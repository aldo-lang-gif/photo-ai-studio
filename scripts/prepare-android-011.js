// PIXORA AI 0.11.0 — prompt-based generative image editing.
// Runs after the existing 0.10.0 preparation. It does not add or restore a gallery/save feature.
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const htmlPath = path.join(root, "www", "index.html");
const gradlePath = path.join(root, "android", "app", "build.gradle");
if (!fs.existsSync(htmlPath) || !fs.existsSync(gradlePath)) throw new Error("Progetto Android 0.11.0 incompleto.");
let html = fs.readFileSync(htmlPath, "utf8");
if (!html.includes('id="pixora-ai-097-panel"')) throw new Error("Pannello AI non trovato: eseguire prima la catena di preparazione 0.10.0.");

const oldClientStart = html.indexOf('<script id="pixora-ai-098-client">');
if (oldClientStart >= 0) {
  const oldClientEnd = html.indexOf("</script>", oldClientStart);
  if (oldClientEnd < 0) throw new Error("Script client precedente non chiuso.");
  html = html.slice(0, oldClientStart) + html.slice(oldClientEnd + 9);
}
const panelClose = html.indexOf("</section>", html.indexOf('id="pixora-ai-097-panel"'));
if (panelClose < 0) throw new Error("Chiusura pannello AI non trovata.");
const ui = `
  <div id="pixora-ai-011-editor" style="margin-top:12px">
    <label for="pixora-ai-011-prompt" style="display:block;font-size:12px;font-weight:800;margin:8px 0">Descrivi la modifica che vuoi</label>
    <textarea id="pixora-ai-011-prompt" maxlength="1200" placeholder="Esempio: aggiungi un cappellino sportivo nero, realistico, senza modificare il viso." style="width:100%;min-height:92px;box-sizing:border-box;border-radius:12px;border:1px solid #465276;background:#0c1424;color:#fff;padding:12px;font:13px/1.5 system-ui"></textarea>
    <button type="button" id="pixora-ai-011-run" style="width:100%;margin-top:9px;padding:13px;border:0;border-radius:11px;background:linear-gradient(120deg,#8b5cf6,#22d3ee);color:#0b1020;font-weight:900">MODIFICA LA FOTO CON IA</button>
    <div id="pixora-ai-011-status" role="status" aria-live="polite" style="font-size:11px;line-height:1.5;margin-top:9px;color:#d8d5ff">La foto viene inviata al modello solo quando premi il pulsante. L'originale nell'Editor non viene sovrascritto.</div>
    <div id="pixora-ai-011-result-wrap" hidden style="margin-top:12px">
      <div style="font-size:12px;font-weight:800;margin-bottom:7px">Anteprima del risultato generato</div>
      <img id="pixora-ai-011-result" alt="Risultato della modifica IA" style="display:block;width:100%;height:auto;max-height:65vh;object-fit:contain;border-radius:12px;background:#080c15;border:1px solid #465276">
      <div id="pixora-ai-011-dimensions" style="font-size:10px;color:#a7b3ca;margin-top:6px"></div>
    </div>
  </div>`;
if (!html.includes('id="pixora-ai-011-editor"')) {
  html = html.slice(0, panelClose) + ui + "\n" + html.slice(panelClose);
}
const client = `<script id="pixora-ai-011-client">
(()=> {
 const API="https://pixora-ai-core.aldomoro5525.workers.dev";
 const button=document.getElementById("pixora-ai-011-run");
 const prompt=document.getElementById("pixora-ai-011-prompt");
 const status=document.getElementById("pixora-ai-011-status");
 const wrap=document.getElementById("pixora-ai-011-result-wrap");
 const image=document.getElementById("pixora-ai-011-result");
 const dimensions=document.getElementById("pixora-ai-011-dimensions");
 if(!button||!prompt||!status||!wrap||!image)return;
 let resultUrl=null;
 button.addEventListener("click",async()=>{
  const source=window.pixoraGetOriginalBlob?.();
  const instruction=prompt.value.trim();
  if(!source){status.textContent="Prima apri una foto nell'Editor.";return;}
  if(!instruction||instruction.length<4){status.textContent="Scrivi una descrizione della modifica.";return;}
  if(instruction.length>1200){status.textContent="La descrizione è troppo lunga: massimo 1200 caratteri.";return;}
  if(source.size>20*1024*1024){status.textContent="La foto supera il limite di 20 MB.";return;}
  if(!["image/jpeg","image/png","image/webp"].includes((source.type||"").toLowerCase())){status.textContent="Formato non supportato. Usa JPEG, PNG o WebP.";return;}
  button.disabled=true;
  button.textContent="ELABORAZIONE IN CORSO…";
  status.textContent="Invio della foto e modifica generativa in corso. Attendi senza chiudere PIXORA…";
  try{
   const body=new FormData();
   body.append("image",source,"pixora-source");
   body.append("prompt",instruction);
   const response=await fetch(API+"/edit",{method:"POST",body});
   if(!response.ok){
    let data={};try{data=await response.json();}catch{}
    throw new Error(data.error||("Servizio non disponibile ("+response.status+")")+(data.detail?" · "+data.detail:""));
   }
   const blob=await response.blob();
   if(!blob.size||!blob.type.startsWith("image/"))throw new Error("Il servizio non ha restituito un'immagine valida.");
   if(resultUrl)URL.revokeObjectURL(resultUrl);
   resultUrl=URL.createObjectURL(blob);
   image.src=resultUrl;
   wrap.hidden=false;
   const w=response.headers.get("X-Pixora-Output-Width"),h=response.headers.get("X-Pixora-Output-Height");
   dimensions.textContent=w&&h?("Dimensioni generate: "+w+" × "+h):"Risultato generato con FLUX.2 Klein 4B.";
   status.textContent="Modifica completata. L'originale nell'Editor è rimasto invariato.";
  }catch(error){
   status.textContent="Modifica non riuscita: "+(error?.message||"errore sconosciuto");
  }finally{
   button.disabled=false;
   button.textContent="MODIFICA LA FOTO CON IA";
  }
 });
})();
</script>`;
if (!html.includes('id="pixora-ai-011-client"')) html = html.replace("</body>", client + "\n</body>");
html = html.replaceAll("0.10.0", "0.11.0");
html = html.replaceAll("PIXORA AI 0.10.0", "PIXORA AI 0.11.0");
html = html.replace("ESRGAN esegue una super-risoluzione AI 2×. L'immagine viene inviata al servizio solo quando premi il pulsante; non viene archiviata dal Worker.", "PIXORA include super-risoluzione e modifica generativa tramite istruzioni testuali.");
html = html.replace("MIGLIORA QUESTA FOTO CON IA", "MIGLIORA RISOLUZIONE 2×");
html = html.replace("Miglioramento AI · Super-risoluzione 2×", "Strumenti IA · Super-risoluzione ed editing generativo");
html = html.replace("La foto viene inviata al servizio solo quando tocchi il pulsante. PIXORA non archivia l’immagine sul proprio Worker.", "La foto viene inviata al servizio solo quando tocchi il pulsante. PIXORA non archivia l’immagine sul proprio Worker.");
html = html.replace("PIXORA AI 0.10.0", "PIXORA AI 0.11.0");
html = html.replace("document.title='PIXORA AI 0.10.0';", "document.title='PIXORA AI 0.11.0';");
html = html.replace("const installed='0.10.0';", "const installed='0.11.0';");
html = html.replace("v0.10.0", "v0.11.0");
html = html.replace("pixora-ai-010-single-screen", "pixora-ai-010-single-screen");
if (!html.includes('pixora-ai-011-client') || !html.includes('pixora-ai-011-editor')) throw new Error("Interfaccia di editing generativo non inserita.");
// Keep the user's current no-gallery/no-save app state: remove the old direct-to-Gallery action.
html = html.replace(/#save\{[^}]*\}/g, "#save{display:none!important}");
html = html.replace(/#saveGallery[^,;}]*/g, "#saveGallery");
html = html.replace("</style>", "\n#save,#saveGallery,#saveProjectVersion{display:none!important}\n</style>");
fs.writeFileSync(htmlPath, html, "utf8");

let gradle = fs.readFileSync(gradlePath, "utf8");
gradle = gradle.replace(/(\bversionCode\s*=?\s*)\d+/, "$1" + "13");
gradle = gradle.replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/, "$1'0.11.0'");
if (!/\bversionCode\s*=?\s*13\b/.test(gradle) || !/\bversionName\s*=?\s*['"]0\.11\.0['"]/.test(gradle)) throw new Error("Versione Gradle 0.11.0 non impostata correttamente.");
fs.writeFileSync(gradlePath, gradle, "utf8");
const manifest = {
  version: "0.11.0",
  versionCode: 13,
  platform: "android",
  releaseUrl: "https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.11.0",
  apkUrl: "https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.11.0/PIXORA-AI-0.11.0.apk"
};
fs.writeFileSync(path.join(root, "update.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log("PIXORA AI 0.11.0: prompt-based generative editing configured; Gallery save controls kept hidden.");
