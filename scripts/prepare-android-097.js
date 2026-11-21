const fs = require('fs');
const path = require('path');
const root = process.cwd();
const htmlPath = path.join(root, 'www', 'index.html');
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
if (!fs.existsSync(htmlPath) || !fs.existsSync(gradlePath)) throw new Error('Progetto Android incompleto.');
let html = fs.readFileSync(htmlPath, 'utf8');
for (const marker of ['pixora-ai-096-updater', 'pixora-ai-095-identity-guard', 'p092-toolbar']) {
  if (!html.includes(marker)) throw new Error('Base PIXORA AI 0.9.6 non riconosciuta: manca ' + marker);
}

const css = `
/* PIXORA AI 0.9.7 — AI upscaling controls */
#pixora-ai-097-panel{margin:10px 0;padding:12px;border:1px solid #6553a5;border-radius:14px;background:linear-gradient(145deg,#171d3b,#17142d);color:#f5f3ff}
#pixora-ai-097-panel h3{font-size:14px;margin:0 0 6px}
#pixora-ai-097-panel p{font-size:11px;line-height:1.45;color:#c7c5df;margin:5px 0 9px}
#pixora-ai-097-run{width:100%;padding:12px;border:0;border-radius:11px;background:linear-gradient(120deg,#8b5cf6,#22d3ee);color:#0b1020;font-weight:900}
#pixora-ai-097-run:disabled{opacity:.55}
#pixora-ai-097-status{font-size:11px;margin-top:8px;color:#d8d5ff;min-height:16px}
`;
if (!html.includes('PIXORA AI 0.9.7 — AI upscaling controls')) html = html.replace('</style>', css + '\n</style>');

const panel = `
<section id="pixora-ai-097-panel" aria-label="Miglioramento fotografico con intelligenza artificiale">
  <h3>✨ Miglioramento AI · Super-risoluzione 2×</h3>
  <p>Usa ESRGAN di Cloudflare per aumentare la risoluzione e recuperare dettagli. La foto viene inviata al servizio solo quando tocchi il pulsante. PIXORA non archivia l’immagine sul proprio Worker.</p>
  <p>Disponibilità gratuita soggetta al limite mensile Cloudflare Images. Se il limite è esaurito, l’elaborazione si ferma: nessun servizio a pagamento viene attivato.</p>
  <button type="button" id="pixora-ai-097-run">MIGLIORA QUESTA FOTO CON IA</button>
  <div id="pixora-ai-097-status" role="status" aria-live="polite">Apri una foto e premi il pulsante per autorizzare l’invio e l’elaborazione.</div>
</section>`;
if (!html.includes('id="pixora-ai-097-panel"')) html = html.replace('</body>', panel + '\n<script id="pixora-ai-097-client">\n(()=>{\n const API="https://pixora-ai-core.aldomoro5525.workers.dev";\n const button=document.getElementById("pixora-ai-097-run");\n const out=document.getElementById("pixora-ai-097-status");\n if(!button||!out)return;\n button.addEventListener("click",async()=>{\n  const source=window.pixoraGetOriginalBlob?.();\n  if(!source){out.textContent="Prima apri una foto nell’Editor.";return;}\n  if(source.size>20*1024*1024){out.textContent="La foto supera il limite di 20 MB. Scegli un file più leggero.";return;}\n  const type=(source.type||"image/jpeg").toLowerCase();\n  if(!["image/jpeg","image/png","image/webp"].includes(type)){out.textContent="Formato non supportato. Usa JPEG, PNG o WebP.";return;}\n  button.disabled=true;out.textContent="Invio autorizzato. Analisi dimensioni ed elaborazione AI in corso…";\n  try{\n   const response=await fetch(API+"/enhance",{method:"POST",headers:{"Content-Type":type},body:source});\n   if(!response.ok){let data={};try{data=await response.json();}catch{}throw new Error(data.error||("Servizio non disponibile ("+response.status+")."));}\n   const blob=await response.blob();\n   if(!blob.size||!blob.type.startsWith("image/"))throw new Error("Il servizio non ha restituito un’immagine valida.");\n   await window.pixoraApplyEnhancedBlob(blob);\n   const w=response.headers.get("X-Pixora-Output-Width"),h=response.headers.get("X-Pixora-Output-Height");\n   out.textContent="Completato!"+(w&&h?" · output "+w+" × "+h:"")+". È stato creato un nuovo progetto AI; il progetto di partenza resta nella Galleria.";\n  }catch(error){out.textContent=error?.message||"Elaborazione non riuscita. Riprova più tardi.";}\n  finally{button.disabled=false;}\n });\n})();\n</script>\n</body>');

// Advance the updater's installed version without replacing the stable updater implementation.
html = html.replace("const installed='0.9.6';", "const installed='0.9.7';");
html = html.replace('PIXORA AI 0.9.6 è aggiornato.', 'PIXORA AI 0.9.7 è aggiornato.');
html = html.replace(/v0\.9\.5/g, 'v0.9.7');
html = html.replace(/PIXORA AI 0\.9\.5/g, 'PIXORA AI 0.9.7');
html = html.replace(/pixora-ai-v095/g, 'pixora-ai-v097');
const versionGuard = `<script id="pixora-ai-097-version-guard">(()=>{const apply=()=>{const v=document.getElementById('photo-ai-version');if(v)v.textContent='v0.9.7';const f=document.querySelector('.footer');if(f)f.textContent='PIXORA AI 0.9.7 · Miglioramento fotografico AI · Galleria';document.title='PIXORA AI 0.9.7';};apply();[250,700,1300].forEach(t=>setTimeout(apply,t));})();</script>`;
if (!html.includes('pixora-ai-097-version-guard')) html = html.replace('</body>', versionGuard + '\n</body>');
if (!html.includes('pixora-ai-097-client') || !html.includes('window.pixoraApplyEnhancedBlob') || !html.includes('pixoraAIOutputBlob')) throw new Error('Integrazione AI 0.9.7 incompleta: build interrotta.');
fs.writeFileSync(htmlPath, html, 'utf8');

let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/(\bversionCode\s*=?\s*)\d+/, '$1' + '9');
gradle = gradle.replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/, "$1'0.9.7'");
if (!/\bversionCode\s*=?\s*9\b/.test(gradle) || !/\bversionName\s*=?\s*['"]0\.9\.7['"]/.test(gradle)) throw new Error('Versione Gradle 0.9.7 non impostata correttamente.');
fs.writeFileSync(gradlePath, gradle, 'utf8');

const manifestPath = path.join(root, 'update.json');
const manifest = {
  version: '0.9.7',
  versionCode: 9,
  platform: 'android',
  releaseUrl: 'https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.9.7',
  apkUrl: 'https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.9.7/PIXORA-AI-0.9.7.apk'
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log('PIXORA AI 0.9.7: client ESRGAN, privacy notice, updater, manifest and Android version configured.');
