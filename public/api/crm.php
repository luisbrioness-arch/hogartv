<?php
// public/api/crm.php
// HogarTV.cl - Backend API para el CRM de Clientes, Cotizaciones y Administración

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
    // Proteger carpeta de datos para que nadie lea JSONs desde la web
    @file_put_contents($dataDir . '/.htaccess', "Deny from all\n<IfModule !mod_authz_core.c>\n    Order deny,allow\n    Deny from all\n</IfModule>\n<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>");
}

$leadsFile = $dataDir . '/leads.json';
$configFile = $dataDir . '/config.json';

// Helper para leer JSON
function getJsonData(string $path): array {
    if (!file_exists($path)) {
        return [];
    }
    $raw = @file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    return json_decode($raw, true) ?: [];
}

// Helper para guardar JSON atómicamente
function saveJsonData(string $path, array $data): bool {
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $tmp = $path . '.tmp.' . bin2hex(random_bytes(6));
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (@file_put_contents($tmp, $json) !== false) {
        return @rename($tmp, $path);
    }
    return false;
}

// Obtener payload
$rawBody = file_get_contents('php://input');
$input = json_decode($rawBody, true) ?: $_POST;
$action = (string)($_GET['action'] ?? $input['action'] ?? '');

// Credenciales por defecto
$defaultUsers = [
    'admin' => 'hogartv2026',
    'luis' => 'hogartv2026'
];

// Helper para verificar autenticación
function checkAuth(array $input, array $defaultUsers): bool {
    if (!empty($_SESSION['hogartv_crm_user'])) {
        return true;
    }
    $token = (string)($input['token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '');
    $token = str_replace('Bearer ', '', $token);
    if ($token !== '') {
        $parts = explode(':', base64_decode($token) ?: '');
        if (count($parts) === 2) {
            [$u, $p] = $parts;
            if (isset($defaultUsers[$u]) && $defaultUsers[$u] === $p) {
                return true;
            }
        }
    }
    return false;
}

// Inicializar archivo de leads vacío si no existe
if (!file_exists($leadsFile)) {
    saveJsonData($leadsFile, []);
}

// ROUTING DE ACCIONES
switch ($action) {
    case 'login':
        $username = trim((string)($input['username'] ?? ''));
        $password = trim((string)($input['password'] ?? ''));

        if (isset($defaultUsers[$username]) && $defaultUsers[$username] === $password) {
            $_SESSION['hogartv_crm_user'] = $username;
            $token = base64_encode($username . ':' . $password);
            echo json_encode([
                'ok' => true,
                'message' => 'Sesión iniciada con éxito',
                'user' => [
                    'username' => $username,
                    'nombre' => ($username === 'luis' ? 'Luis Briones' : 'Administrador HogarTV')
                ],
                'token' => $token
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['ok' => false, 'message' => 'Usuario o contraseña incorrectos']);
        }
        break;

    case 'logout':
        $_SESSION['hogartv_crm_user'] = null;
        session_destroy();
        echo json_encode(['ok' => true, 'message' => 'Sesión cerrada']);
        break;

    case 'get_leads':
        if (!checkAuth($input, $defaultUsers)) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'message' => 'No autorizado']);
            exit;
        }
        $leads = getJsonData($leadsFile);
        echo json_encode(['ok' => true, 'leads' => $leads]);
        break;

    case 'save_lead':
        // Endpoint PÚBLICO para captar clientes desde el formulario web
        $nombre = trim((string)($input['nombre'] ?? 'Cliente Web'));
        $telefono = trim((string)($input['telefono'] ?? ''));
        $email = trim((string)($input['email'] ?? ''));
        $comuna = trim((string)($input['comuna'] ?? 'Región del Biobío'));
        $servicio = trim((string)($input['servicio'] ?? 'general'));
        $servicioNombre = trim((string)($input['servicio_nombre'] ?? 'Consulta Técnica General'));
        $distancia = trim((string)($input['distancia_estimada'] ?? ''));
        $mensaje = trim((string)($input['mensaje'] ?? ''));
        $origen = trim((string)($input['origen'] ?? 'web_formulario'));

        if ($telefono === '' && $email === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'message' => 'Se requiere al menos un teléfono o correo de contacto']);
            exit;
        }

        $leads = getJsonData($leadsFile);
        $newLead = [
            'id' => 'lead_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)),
            'nombre' => $nombre !== '' ? $nombre : 'Cliente por contactar',
            'telefono' => $telefono,
            'email' => $email,
            'comuna' => $comuna !== '' ? $comuna : 'Biobío / Por confirmar',
            'servicio' => $servicio,
            'servicio_nombre' => $servicioNombre,
            'distancia_estimada' => $distancia,
            'mensaje' => $mensaje,
            'estado' => 'nuevo',
            'presupuesto' => (int)($input['presupuesto'] ?? 0),
            'notas' => '',
            'origen' => $origen,
            'creado_en' => date('Y-m-d H:i:s')
        ];

        // Insertar al inicio de la lista
        array_unshift($leads, $newLead);
        saveJsonData($leadsFile, $leads);

        echo json_encode(['ok' => true, 'message' => 'Solicitud registrada correctamente', 'id' => $newLead['id']]);
        break;

    case 'update_lead':
        if (!checkAuth($input, $defaultUsers)) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'message' => 'No autorizado']);
            exit;
        }

        $id = (string)($input['id'] ?? '');
        $estado = (string)($input['estado'] ?? '');
        $notas = (string)($input['notas'] ?? '');
        $presupuesto = isset($input['presupuesto']) ? (int)$input['presupuesto'] : null;

        $leads = getJsonData($leadsFile);
        $found = false;

        foreach ($leads as &$lead) {
            if ($lead['id'] === $id) {
                if ($estado !== '') {
                    $lead['estado'] = $estado;
                }
                if ($notas !== '') {
                    $lead['notas'] = $notas;
                }
                if ($presupuesto !== null) {
                    $lead['presupuesto'] = $presupuesto;
                }
                $lead['actualizado_en'] = date('Y-m-d H:i:s');
                $found = true;
                break;
            }
        }

        if ($found) {
            saveJsonData($leadsFile, $leads);
            echo json_encode(['ok' => true, 'message' => 'Prospecto actualizado']);
        } else {
            http_response_code(404);
            echo json_encode(['ok' => false, 'message' => 'Prospecto no encontrado']);
        }
        break;

    case 'delete_lead':
        if (!checkAuth($input, $defaultUsers)) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'message' => 'No autorizado']);
            exit;
        }

        $id = (string)($input['id'] ?? '');
        $leads = getJsonData($leadsFile);
        $filtered = array_values(array_filter($leads, fn($l) => ($l['id'] ?? '') !== $id));

        saveJsonData($leadsFile, $filtered);
        echo json_encode(['ok' => true, 'message' => 'Prospecto eliminado']);
        break;

    case 'stats':
        if (!checkAuth($input, $defaultUsers)) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'message' => 'No autorizado']);
            exit;
        }

        $leads = getJsonData($leadsFile);
        $total = count($leads);
        $nuevos = 0;
        $satelitales = 0;
        $visitas = 0;
        $cerrados = 0;
        $montoTotal = 0;

        foreach ($leads as $l) {
            $st = $l['estado'] ?? '';
            $srv = $l['servicio'] ?? '';
            if ($st === 'nuevo') $nuevos++;
            if ($st === 'visita') $visitas++;
            if ($st === 'cerrado') $cerrados++;
            if (str_contains($srv, 'satelital') || str_contains($srv, 'rural')) $satelitales++;
            $montoTotal += (int)($l['presupuesto'] ?? 0);
        }

        echo json_encode([
            'ok' => true,
            'stats' => [
                'total' => $total,
                'nuevos' => $nuevos,
                'satelitales' => $satelitales,
                'visitas' => $visitas,
                'cerrados' => $cerrados,
                'monto_total' => $montoTotal
            ]
        ]);
        break;

    default:
        echo json_encode([
            'ok' => true,
            'sistema' => 'HogarTV CRM API',
            'version' => '2.0.0',
            'time' => date('Y-m-d H:i:s'),
            'status' => 'operativo'
        ]);
        break;
}
