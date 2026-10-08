const fs = require('fs');
let content = fs.readFileSync('src/components/ProductCard.astro', 'utf8');

const startIdx = content.indexOf('<!-- Precio y Botones');
const endIdx = content.indexOf('<!-- Product Schema JSON-LD');

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find markers!");
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

const newMid = `<!-- Precio y Botones de Acción / Compartir -->
        <div class="pt-6 mt-4 border-t border-slate-700 flex flex-col gap-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-5">
            
            <!-- Bloque Precio Principal -->
            <div class="flex flex-col">
              <span class="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Precio Referencial
              </span>
              {price ? (
                <div class="text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
                  {price}
                </div>
              ) : (
                <div class="text-4xl font-black text-white tracking-tight">
                  <Precio productKey={productKey} />
                </div>
              )}
            </div>

            <!-- Botones de Acción -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- Botón Compartir por WhatsApp (Estilo más vivo) -->
              <a
                href={\`https://api.whatsapp.com/send?text=\${encodeURIComponent('¡Mira este producto recomendado en HogarTV! ' + title + ': ' + product.url)}\`}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white border border-[#25D366]/50 text-[#25D366] font-bold text-sm shadow-sm transition-all duration-300 group"
                title="Compartir por WhatsApp"
              >
                <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.769.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm6.818 5.766c-.001 3.759-3.059 6.817-6.818 6.817-1.189 0-2.316-.312-3.308-.858l-4.723 1.238 1.26-4.598c-.611-1.026-.935-2.203-.935-3.417 0-3.759 3.059-6.818 6.818-6.818 3.759 0 6.818 3.059 6.818 6.818z"/></svg>
                <span class="hidden sm:inline">WhatsApp</span>
              </a>

              <!-- Botón Copiar Link (Estilo más vivo) -->
              <button
                type="button"
                data-share-url={product.url}
                class="copy-share-btn inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-600 border border-slate-600 text-white font-bold text-sm shadow-sm transition-all duration-300"
                title="Copiar enlace"
              >
                <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span class="btn-text hidden sm:inline">Copiar</span>
              </button>

              <!-- Botón CTA Afiliado (Grande y llamativo) -->
              <AffiliateLink
                productKey={productKey}
                class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 hover:from-brand-400 hover:to-indigo-400 text-white font-black text-[15px] shadow-lg shadow-brand-500/40 hover:shadow-brand-500/60 hover:-translate-y-1 transition-all duration-300 ml-0 sm:ml-2"
              >
                <span>Comprar en {tienda}</span>
                <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </AffiliateLink>
            </div>
          </div>

          <!-- Rango de Precios Inteligente (Diseño modernizado tipo tags) -->
          {precioItem && (
            <div class="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-700/50">
              <div class="flex items-center bg-slate-800/80 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
                <div class="bg-slate-700/80 px-3 py-1.5 flex items-center gap-1.5">
                  <span class="text-amber-400 text-sm">🎯</span>
                  <span class="text-xs font-bold text-slate-200 uppercase tracking-wide">Rango Normal</span>
                </div>
                <div class="px-4 py-1.5 font-mono text-sm font-semibold text-slate-300">
                  {precioItem.rango || 'Varía según tienda'}
                </div>
              </div>
              
              <div class="flex items-center bg-emerald-950/30 rounded-lg overflow-hidden border border-emerald-900/50 shadow-inner">
                <div class="bg-emerald-900/50 px-3 py-1.5 flex items-center gap-1.5">
                  <span class="text-emerald-400 text-sm">🔥</span>
                  <span class="text-xs font-bold text-emerald-100 uppercase tracking-wide">Mejor Oferta</span>
                </div>
                <div class="px-4 py-1.5 font-mono text-sm font-black text-emerald-400">
                  {precioItem.precioMinVisto || precioItem.rango?.split('-')[0]?.trim() || precioItem.precioFormateado}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    <!-- Pros y Contras -->
    {(pros.length > 0 || cons.length > 0) && (
      <div class={\`mt-8 grid grid-cols-1 \${pros.length > 0 && cons.length > 0 ? 'md:grid-cols-2' : ''} gap-5\`}>
        
        {pros.length > 0 && (
          <div class="bg-gradient-to-br from-emerald-900/20 to-emerald-950/10 border border-emerald-800/40 rounded-2xl p-6 shadow-sm">
            <div class="flex items-center gap-2 text-emerald-400 font-black text-[13px] uppercase tracking-widest mb-4">
              <div class="bg-emerald-500/20 p-1.5 rounded-lg">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span>Por qué elegirlo</span>
            </div>
            <ul class="space-y-3">
              {pros.map((pro) => (
                <li class="flex items-start gap-3">
                  <span class="text-emerald-500 mt-0.5 text-lg leading-none font-bold">✓</span>
                  <span class="text-[14px] text-slate-200 leading-snug font-medium">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {cons.length > 0 && (
          <div class="bg-gradient-to-br from-rose-900/20 to-rose-950/10 border border-rose-800/40 rounded-2xl p-6 shadow-sm">
            <div class="flex items-center gap-2 text-rose-400 font-black text-[13px] uppercase tracking-widest mb-4">
              <div class="bg-rose-500/20 p-1.5 rounded-lg">
                <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </div>
              <span>A considerar</span>
            </div>
            <ul class="space-y-3">
              {cons.map((con) => (
                <li class="flex items-start gap-3">
                  <span class="text-rose-500 mt-0.5 text-lg leading-none font-bold">×</span>
                  <span class="text-[14px] text-slate-300 leading-snug">{con}</span>
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
