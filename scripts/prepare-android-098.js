// PIXORA AI 0.9.8 — diagnostic client patch; runs after prepare-android-097.js.
const fs = require('fs');
const path = require('path');
const htmlPath = path.join(process.cwd(), 'www', 'index.html');
if (!fs.existsSync(htmlPath)) throw new Error('www/index.html non trovato.');
let html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('pixora-ai-097-client')) throw new Error('Client 0.9.7 non trovato: eseguire prima la preparazione 0.9.7.');
const start = html.indexOf('<script id="pixora-ai-097-client">');
const end = html.indexOf('</script>', start);
if (start < 0 || end < 0) throw new Error('Blocco client 0.9.7 non trovato.');
const replacement = `<script id="pixora-ai-098-client">
(()=> {
 const API="https://pixora-ai-core.aldomoro5525.workers.dev";
 const button=document.getElementById("pixora-ai-097-run");
 const out=document.getElementById("pixora-ai-097-status");
 if(!button||!out)return;
 button.addEventListener("click",async()=>{
  const source=window.pixoraGetOriginalBlob?.();
  if(!source){out.textContent="Prima apri una foto nell’Editor.";return;}
  if(source.size>20*1024*1024){out.textContent="La foto supera il limite di 20 MB.";return;}
  const type=(source.type||"image/jpeg").toLowerCase();
  if(!["image/jpeg","image/png","image/webp"].includes(type)){out.textContent="Formato non supportato. Usa JPEG, PNG o WebP.";return;}
  button.disabled=true;
  const origin=window.location.origin;
  out.textContent="Connessione al servizio AI…";
  try{
   const response=await fetch(API+"/enhance",{method:"POST",headers:{"Content-Type":type},body:source});
   if(!response.ok){
    let data={};try{data=await response.json();}catch{}
    const detail=data.detail?(" · "+data.detail):"";
    throw new Error((data.error||("Servizio non disponibile ("+response.status+")"))+detail);
   }
   const blob=await response.blob();
   if(!blob.size||!blob.type.startsWith("image/"))throw new Error("Il servizio non ha restituito un’immagine valida.");
   await window.pixoraApplyEnhancedBlob(blob);
   const w=response.headers.get("X-Pixora-Output-Width"),h=response.headers.get("X-Pixora-Output-Height");
   out.textContent="Completato!"+(w&&h?" · output "+w+" × "+h:"")+".";
  }catch(error){
   const online=navigator.onLine?"online":"offline";
   out.textContent="Errore di connessione/elaborazione: "+(error?.name||"Error")+" — "+(error?.message||"richiesta non riuscita")+". Origine: "+origin+" · rete: "+online+".";
   console.error("PIXORA AI 0.9.8", {origin,online,name:error?.name,message:error?.message});
  }finally{button.disabled=false;}
 });
})();
</script>`;
html = html.slice(0,start) + replacement + html.slice(end + '</script>'.length);
html = html.replace("const installed='0.9.7';","const installed='0.9.8';");
html = html.replaceAll("PIXORA AI 0.9.7 è aggiornato.","PIXORA AI 0.9.8 è aggiornato.");
html = html.replaceAll("v0.9.7","v0.9.8").replaceAll("PIXORA AI 0.9.7","PIXORA AI 0.9.8");
if (!html.includes('pixora-ai-098-client')) throw new Error('Client 0.9.8 non inserito.');
fs.writeFileSync(htmlPath, html, 'utf8');
const gradlePath=path.join(process.cwd(),'android','app','build.gradle');
if(!fs.existsSync(gradlePath))throw new Error('build.gradle non trovato.');
let gradle=fs.readFileSync(gradlePath,'utf8');
gradle=gradle.replace(/(\bversionCode\s*=?\s*)\d+/, '$1'+'10');
gradle=gradle.replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/, "$1'0.9.8'");
if(!/\bversionCode\s*=?\s*10\b/.test(gradle)||!/\bversionName\s*=?\s*['"]0\.9\.8['"]/.test(gradle))throw new Error('Versione Gradle 0.9.8 non impostata.');
fs.writeFileSync(gradlePath,gradle,'utf8');
const manifest={version:'0.9.8',versionCode:10,platform:'android',releaseUrl:'https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.9.8',apkUrl:'https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.9.8/PIXORA-AI-0.9.8.apk'};
fs.writeFileSync(path.join(process.cwd(),'update.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
console.log('PIXORA AI 0.9.8 client diagnostics and Android version configured.');
