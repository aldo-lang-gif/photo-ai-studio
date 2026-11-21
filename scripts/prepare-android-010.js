// PIXORA AI 0.10.0 — single-screen editor and direct Android gallery save.
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const htmlPath = path.join(root, 'www', 'index.html');
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
if (!fs.existsSync(htmlPath) || !fs.existsSync(gradlePath)) {
  throw new Error('Progetto Android 0.10.0 incompleto.');
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Disable the legacy hidden project autosave/resume logic as well as its visible controls.
const projectPatches = [
  ["if (image) { await ensureProject(); await saveVersion(); }", "/* project saving removed in 0.10.0 */"],
  ["await ensureProject(); await renderProjects();", "/* project saving removed in 0.10.0 */"],
  ["$('saveProjectVersion').onclick=()=>saveVersion().catch(()=>status('Errore durante il salvataggio della versione.'));", "$('saveProjectVersion').onclick=()=>{};"],
  ["$('galleryRefresh').addEventListener('click',renderProjects);", "/* internal project gallery removed */"],
  ["document.querySelector('[data-view=\"gallery\"]').addEventListener('click',renderProjects);", "/* internal project gallery removed */"],
  ["$('saveGallery').addEventListener('click',()=>{setTimeout(()=>saveVersion().catch(()=>{}),700);});", "/* internal project gallery removed */"],
  ["  renderProjects();\n\n  // Migliora la leggibilità della maschera", "  // Migliora la leggibilità della maschera"]
];
for (const [from, to] of projectPatches) {
  if (!html.includes(from)) throw new Error('Hook archivio progetti non trovato: ' + from.slice(0, 70));
  html = html.replace(from, to);
}
const pickHandler = /\$\('pick'\)\.addEventListener\('change',e=>\{[\s\S]*?\n  \}\);/;
if (!pickHandler.test(html)) throw new Error('Handler apertura foto non trovato per disattivare autosalvataggio progetti.');
html = html.replace(pickHandler, "$('pick').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;originalBlob=f;activeProjectId=null;fitZoom();});");

for (const marker of ['pixora-ai-099-gallery-native', 'pixora-ai-098-client', 'pixora-ai-097-panel']) {
  if (!html.includes(marker)) throw new Error('Base 0.9.9 non riconosciuta: manca ' + marker);
}

const css = `
/* PIXORA AI 0.10.0 — single screen */
nav.tabs,#gallery,#studio,.footer,#saveGallery,#saveProjectVersion,#projectStatus,
#projectsGrid,#projectsEmpty,.zoombar,#deviceAi{display:none!important}
#editor{display:block!important}
#pixora-ai-097-panel{margin:12px 0 0}
#pixora-ai-097-panel h3{font-size:16px}
#save{width:100%;min-height:46px;background:linear-gradient(120deg,#8b5cf6,#22d3ee);color:#09101f}
#editor>.card:first-child .actions{grid-template-columns:1fr 1fr}
#editor>.card:first-child .actions #save{grid-column:1/-1;grid-row:1}
`;
if (!html.includes('PIXORA AI 0.10.0 — single screen')) {
  html = html.replace('</style>', css + '\n</style>');
}

const script = `<script id="pixora-ai-010-single-screen">
(()=>{
 const byId=id=>document.getElementById(id);
 const editor=byId("editor");
 if(!editor)return;

 // Remove navigation, the internal gallery, the unfinished prompt studio and project controls.
 document.querySelector("nav.tabs")?.remove();
 byId("gallery")?.remove();
 byId("studio")?.remove();
 byId("deviceAi")?.remove();
 ["saveGallery","saveProjectVersion","projectStatus","projectsGrid","projectsEmpty"].forEach(id=>byId(id)?.remove());

 // Put the real ESRGAN action inside the same screen as the editor.
 const aiPanel=byId("pixora-ai-097-panel");
 const firstCard=editor.querySelector(".card");
 if(aiPanel&&firstCard)firstCard.insertAdjacentElement("afterend",aiPanel);

 const brand= document.querySelector("header h1");
 if(brand)brand.textContent="PIXORA AI";
 const tagline=document.querySelector("header p");
 if(tagline)tagline.textContent="AI PHOTO EDITOR";
 document.title="PIXORA AI 0.10.0";

 const status=byId("status");
 const save=byId("save");
 if(save && save.dataset.pixoraDirectSave!=="1"){
  save.dataset.pixoraDirectSave="1";
  save.textContent="Salva risultato";
  save.addEventListener("click",async event=>{
   event.preventDefault();
   event.stopImmediatePropagation();
   if(save.disabled)return;
   const canvas=byId("preview")?.querySelector("canvas");
   if(!canvas){if(status)status.textContent="Prima apri una foto.";return;}
   save.disabled=true;
   const setStatus=value=>{if(status)status.textContent=value;};
   try{
    const blob=await window.pixoraGetCurrentExportBlob?.();
    if(!(blob instanceof Blob)||!blob.size)throw new Error("Nessuna immagine pronta da salvare.");
    if(window.photoAiIsNative){
     const plugin=window.PhotoAiNative||window.Capacitor?.Plugins?.PhotoAiNative;
     if(!plugin?.saveToGallery)throw new Error("Funzione di salvataggio Android non disponibile. Aggiorna l'app.");
     setStatus("Salvataggio nella Galleria del telefono…");
     const dataUrl=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||""));
      reader.onerror=()=>reject(new Error("Lettura dell'immagine non riuscita."));
      reader.readAsDataURL(blob);
     });
     const comma=dataUrl.indexOf(",");
     if(comma<0)throw new Error("Immagine non valida.");
     const result=await plugin.saveToGallery({
      imageBase64:dataUrl.slice(comma+1),
      fileName:"PIXORA-"+new Date().toISOString().replace(/[:.]/g,"-")+".jpg",
      mimeType:"image/jpeg"
     });
     if(!result?.saved)throw new Error("Android non ha confermato il salvataggio.");
     setStatus("✓ Foto salvata sul telefono · Galleria > Pictures/PIXORA AI.");
    }else{
     const url=URL.createObjectURL(blob),a=document.createElement("a");
     a.href=url;a.download="PIXORA-risultato.jpg";a.click();
     setTimeout(()=>URL.revokeObjectURL(url),2000);
     setStatus("Foto scaricata. Apri Download per trovarla.");
    }
   }catch(error){
    setStatus("Salvataggio non riuscito: "+(error?.message||"errore sconosciuto"));
   }finally{save.disabled=false;}
  },true);
 }

 const aiInfo=byId("pixora-ai-097-panel")?.querySelector("p");
 if(aiInfo)aiInfo.textContent="ESRGAN esegue una super-risoluzione AI 2×. L'immagine viene inviata al servizio solo quando premi il pulsante; non viene archiviata dal Worker.";
 const aiStatus=byId("pixora-ai-097-status");
 if(aiStatus && !aiStatus.textContent.trim())aiStatus.textContent="Apri una foto e premi il pulsante per avviare l'elaborazione AI.";
})();
</script>`;
if (!html.includes('pixora-ai-010-single-screen')) {
  html = html.replace('</body>', script + '\n</body>');
}
if (!html.includes('pixora-ai-010-single-screen') || !html.includes('Salva risultato')) {
  throw new Error('Interfaccia singola 0.10.0 non inserita.');
}
html = html.replaceAll('0.9.9', '0.10.0');
html = html.replaceAll('PIXORA AI 0.9.9', 'PIXORA AI 0.10.0');
fs.writeFileSync(htmlPath, html, 'utf8');

let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/(\bversionCode\s*=?\s*)\d+/, '$1' + '12');
gradle = gradle.replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/, "$1'0.10.0'");
if (!/\bversionCode\s*=?\s*12\b/.test(gradle) || !/\bversionName\s*=?\s*['"]0\.10\.0['"]/.test(gradle)) {
  throw new Error('Versione Gradle 0.10.0 non impostata correttamente.');
}
fs.writeFileSync(gradlePath, gradle, 'utf8');

const manifest = {
  version: '0.10.0',
  versionCode: 12,
  platform: 'android',
  releaseUrl: 'https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.10.0',
  apkUrl: 'https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.10.0/PIXORA-AI-0.10.0.apk'
};
fs.writeFileSync(path.join(root, 'update.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('PIXORA AI 0.10.0: single-screen editor and direct device save configured.');
