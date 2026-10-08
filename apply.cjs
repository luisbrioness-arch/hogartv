const fs = require('fs');
let content = fs.readFileSync('src/components/ProductCard.astro', 'utf8');

// The new mid section to replace everything from "<!-- Precio y Botones de Acción / Compartir -->" 
// down to "<!-- Product Schema JSON-LD"
const startMarker = "<!-- Precio y Botones de AcciÃ³n / Compartir -->";
const endMarker = "<!-- Product Schema JSON-LD";

// Wait, because of previous charset it might be "Acción" or "AcciÃ³n"
// We can just use "<!-- Precio y Botones"
const startIdx = content.indexOf('<!-- Precio y Botones');
const endIdx = content.indexOf('<!-- Product Schema JSON-LD');

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find markers!");
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

const newMid = `<!-- Precio y Botones de Acción / Compartir -->
        <div class="pt-5 mt-2 border-t border-slate-800/60 flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span class="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">Precio referencial</span>
              {price ? (
                <div class="text-3xl font-extrabold text-accent-green tracking-tight leading-none">
                  {price}
                </div>
              ) : (
                <Precio productKey={productKey} />
              )}
            </div>

            <!-- Botones de Acción -->
            <div class="flex flex-wrap items-center gap-2">
              <a
                href={\`https://api.whatsapp.com/send?text=\${encodeURIComponent('¡Mira este producto recomendado en HogarTV! ' + title + ': ' + product.url)}\`}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-xs transition-colors"
                title="Compartir por WhatsApp"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.769.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm6.818 5.766c-.001 3.759-3.059 6.817-6.818 6.817-1.189 0-2.316-.312-3.308-.858l-4.723 1.238 1.26-4.598c-.611-1.026-.935-2.203-.935-3.417 0-3.759 3.059-6.818 6.818-6.818 3.759 0 6.818 3.059 6.818 6.818z"/></svg>
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                data-share-url={product.url}
                class="copy-share-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 font-medium text-xs transition-colors"
                title="Copiar enlace"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span class="btn-text">Copiar</span>
              </button>

              <AffiliateLink
                productKey={productKey}
                class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md transition-all hover:-translate-y-0.5 ml-1"
              >
                <span>Ver precio en {tienda}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </AffiliateLink>
            </div>
          </div>

          <!-- Rango de Precios -->
          {precioItem && (
            <div class="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/60 text-xs">
              <div class="flex items-center gap-2 bg-slate-800/30 px-3 py-2.5 rounded-xl border border-slate-700/50 flex-1 min-w-[200px]">
                <span class="text-amber-400 flex items-center gap-1.5 shrink-0">
                  <span>🎯</span> <span class="font-medium">Rango aceptable:</span>
                </span>
                <span class="text-slate-300 font-mono text-[11px] font-medium tracking-tight">
                  {precioItem.rango || 'Varía según tienda'}
                </span>
              </div>
              <div class="flex items-center gap-2 bg-slate-800/30 px-3 py-2.5 rounded-xl border border-slate-700/50 flex-1 min-w-[200px]">
                <span class="text-emerald-400 flex items-center gap-1.5 shrink-0">
                  <span>🏷️</span> <span class="font-medium">Más bajo visto:</span>
                </span>
                <span class="text-emerald-300 font-mono text-[11px] font-bold tracking-tight">
                  {precioItem.precioMinVisto || precioItem.rango?.split('-')[0]?.trim() || precioItem.precioFormateado}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    <!-- Pros y Contras (Oculta contras si está vacío) -->
    {(pros.length > 0 || cons.length > 0) && (
      <div class={\`mt-6 pt-6 border-t border-slate-800/60 grid grid-cols-1 \${pros.length > 0 && cons.length > 0 ? 'md:grid-cols-2' : ''} gap-4\`}>
        {pros.length > 0 && (
          <div class="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-5">
            <div class="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Puntos a favor</span>
            </div>
            <ul class="space-y-2.5 text-[13px] text-slate-300">
              {pros.map((pro) => (
                <li class="flex items-start gap-2.5">
                  <span class="text-emerald-400 mt-0.5 shrink-0">✔</span>
                  <span class="leading-relaxed">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {cons.length > 0 && (
          <div class="bg-rose-950/20 border border-rose-900/30 rounded-xl p-5">
            <div class="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider mb-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              <span>A tener en cuenta</span>
            </div>
            <ul class="space-y-2.5 text-[13px] text-slate-300">
              {cons.map((con) => (
                <li class="flex items-start gap-2.5">
                  <span class="text-rose-400 mt-0.5 shrink-0">✖</span>
                  <span class="leading-relaxed">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

  </div>
</div>

`;

fs.writeFileSync('src/components/ProductCard.astro', before + newMid + after, 'utf8');
