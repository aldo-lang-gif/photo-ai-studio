// PIXORA AI 0.9.9 — native gallery save + version bump.
// Runs after prepare-android-098.js and before Capacitor sync/build.
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const htmlPath = path.join(root, 'www', 'index.html');
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
if (!fs.existsSync(htmlPath) || !fs.existsSync(gradlePath)) {
  throw new Error('Progetto Android 0.9.9 incompleto.');
}

let html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('pixora-ai-098-client')) {
  throw new Error('Client 0.9.8 non trovato: eseguire prima prepare-android-098.js.');
}
const exportFunction = "function exportBlob(){if(pixoraAIOutputBlob)return Promise.resolve(pixoraAIOutputBlob);return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94))}";
if (!html.includes(exportFunction)) {
  throw new Error('Funzione exportBlob non trovata: salvataggio nativo non applicato.');
}
if (!html.includes('pixoraGetCurrentExportBlob')) {
  html = html.replace(exportFunction, exportFunction + "\nwindow.pixoraGetCurrentExportBlob=()=>exportBlob();");
}

const nativeGalleryScript = `<script id="pixora-ai-099-gallery-native">
(()=> {
 const button=document.getElementById("saveGallery");
 if(!button || button.dataset.pixoraNativeGallery==="1")return;
 button.dataset.pixoraNativeGallery="1";
 button.addEventListener("click",async()=>{
  if(!window.photoAiIsNative)return;
  const plugin=window.PhotoAiNative||window.Capacitor?.Plugins?.PhotoAiNative;
  const status=document.getElementById("status");
  try{
   if(!plugin?.saveToGallery)throw new Error("Funzione Android di salvataggio non disponibile.");
   const blob=await window.pixoraGetCurrentExportBlob?.();
   if(!(blob instanceof Blob)||!blob.size)throw new Error("Nessuna immagine pronta da salvare.");
   const dataUrl=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||""));
    reader.onerror=()=>reject(new Error("Lettura immagine non riuscita."));
    reader.readAsDataURL(blob);
   });
   const base64=dataUrl.slice(dataUrl.indexOf(",")+1);
   const result=await plugin.saveToGallery({
    imageBase64:base64,
    fileName:"PIXORA-"+new Date().toISOString().replace(/[:.]/g,"-")+".jpg",
    mimeType:"image/jpeg"
   });
   if(!result?.saved)throw new Error("Android non ha confermato il salvataggio.");
   if(status)status.textContent="Foto salvata nella Galleria del telefono · Pictures/PIXORA AI.";
  }catch(error){
   if(status)status.textContent="Salvataggio nella Galleria non riuscito: "+(error?.message||"errore sconosciuto");
  }
 },true);
})();
</script>`;
if (!html.includes('pixora-ai-099-gallery-native')) {
  html = html.replace('</body>', nativeGalleryScript + '\n</body>');
}
html = html.replace("const installed='0.9.8';", "const installed='0.9.9';");
html = html.replaceAll("PIXORA AI 0.9.8", "PIXORA AI 0.9.9");
html = html.replaceAll("v0.9.8", "v0.9.9");
if (!html.includes('pixora-ai-099-gallery-native') || !html.includes('pixoraGetCurrentExportBlob')) {
  throw new Error('Integrazione salvataggio Galleria 0.9.9 incompleta.');
}
fs.writeFileSync(htmlPath, html, 'utf8');

let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/(\bversionCode\s*=?\s*)\d+/, '$1' + '11');
gradle = gradle.replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/, "$1'0.9.9'");
if (!/\bversionCode\s*=?\s*11\b/.test(gradle) || !/\bversionName\s*=?\s*['"]0\.9\.9['"]/.test(gradle)) {
  throw new Error('Versione Gradle 0.9.9 non impostata correttamente.');
}
fs.writeFileSync(gradlePath, gradle, 'utf8');

const manifest = {
  version: '0.9.9',
  versionCode: 11,
  platform: 'android',
  releaseUrl: 'https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.9.9',
  apkUrl: 'https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.9.9/PIXORA-AI-0.9.9.apk'
};
fs.writeFileSync(path.join(root, 'update.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('PIXORA AI 0.9.9: ESRGAN source handling and Android gallery save configured.');
