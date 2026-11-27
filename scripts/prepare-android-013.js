// PIXORA AI 0.13.1 — native gallery save + original zoom handlers.
const fs=require("fs"),path=require("path"),root=process.cwd();
const hp=path.join(root,"www","index.html"),gp=path.join(root,"android","app","build.gradle");
if(!fs.existsSync(hp)||!fs.existsSync(gp))throw Error("Progetto Android PIXORA incompleto.");
let h=fs.readFileSync(hp,"utf8");
for(const m of ['id="pixora-ai-012-unified-editor"','id="pixora-ai-012-controls"','id="save"','id="preview"','pixoraGetCurrentExportBlob','pixoraShowGeneratedResult'])
 if(!h.includes(m))throw Error("Base PIXORA non riconosciuta: manca "+m);

// Remove the duplicate gesture handler from 0.13.0; the original app already owns pinch/pan.
h=h.replace(/<script id="pixora-ai-013-pinch-zoom">[\s\S]*?<\/script>\s*/,"");
h=h.replace(/#preview\{touch-action:none!important\}/g,"#preview{touch-action:none}");
h=h.replace(/<script id="pixora-ai-013-function-restore"[\s\S]*?<\/script>\s*/,"");

const code=`<script id="pixora-ai-0131-native-save-zoom-sync">
(()=> {
 const $=id=>document.getElementById(id),panel=$("pixora-ai-012-controls"),preview=$("preview"),save=$("save"),status=$("status");
 if(!panel||!preview||!save)throw Error("Controlli PIXORA non trovati.");
 save.textContent="▣ Salva nella Galleria";save.hidden=false;
 if(save.parentElement!==panel)panel.appendChild(save);
 let latestAiBlob=null;
 const oldShow=window.pixoraShowGeneratedResult;
 if(typeof oldShow!=="function")throw Error("Visualizzazione risultato IA non disponibile.");
 window.pixoraShowGeneratedResult=async blob=>{
  if(!(blob instanceof Blob)||!blob.size)throw Error("Risultato IA vuoto.");
  latestAiBlob=blob;return await oldShow(blob);
 };
 $("pick")?.addEventListener("change",()=>{latestAiBlob=null;},true);

 // Mirror original canvas zoom onto the generated image.
 const syncZoom=()=>{
  const canvas=preview.querySelector("canvas#photo"),img=preview.querySelector("#pixora-ai-012-generated");
  if(img){img.style.transform=canvas?.style.transform||"";img.style.transformOrigin="center center";img.style.willChange="transform";}
 };
 new MutationObserver(syncZoom).observe(preview,{subtree:true,childList:true,attributes:true,attributeFilter:["style"]});
 ["p092-fit","p092-center","zoomFit","zoomCenter"].forEach(id=>$(id)?.addEventListener("click",()=>requestAnimationFrame(syncZoom)));

 // Save the current AI result, or export the original editor canvas, through the native plugin.
 save.onclick=async event=>{
  event?.preventDefault?.();if(save.disabled)return;save.disabled=true;
  const say=t=>{if(status)status.textContent=t;};
  try{
   let blob=latestAiBlob;
   if(!blob){const current=await window.pixoraGetCurrentExportBlob?.();if(current instanceof Blob&&current.size)blob=current;}
   if(!(blob instanceof Blob)||!blob.size)throw Error("Nessuna immagine pronta da salvare.");
   if(window.photoAiIsNative){
    const plugin=window.PhotoAiNative||window.Capacitor?.Plugins?.PhotoAiNative;
    if(!plugin?.saveToGallery)throw Error("Plugin Android non disponibile.");
    let mime=(blob.type||"").toLowerCase();
    if(!["image/jpeg","image/png","image/webp"].includes(mime))mime="image/jpeg";
    if(mime!==blob.type){
     const bitmap=await createImageBitmap(blob),canvas=document.createElement("canvas");
     canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext("2d").drawImage(bitmap,0,0);bitmap.close();
     blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Conversione immagine non riuscita.")),mime,.94));
    }
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=()=>reject(Error("Lettura immagine non riuscita."));reader.readAsDataURL(blob);});
    const comma=data.indexOf(",");if(comma<0)throw Error("Dati immagine non validi.");
    const ext=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
    const result=await plugin.saveToGallery({imageBase64:data.slice(comma+1),fileName:"PIXORA-"+new Date().toISOString().replace(/[:.]/g,"-")+"."+ext,mimeType:mime});
    if(!result?.saved)throw Error("Android non ha confermato il salvataggio.");
    say("✓ Foto salvata nella Galleria · Pictures/PIXORA AI.");
   }else{
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="PIXORA-risultato.jpg";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
    say("Foto scaricata. Apri Download per trovarla.");
   }
  }catch(error){say("Salvataggio non riuscito: "+(error?.message||"errore sconosciuto"));}
  finally{save.disabled=false;}
 };
})();
</script>`;
h=h.replace("</body>",code+"\n</body>");
if(!h.includes('id="pixora-ai-0131-native-save-zoom-sync"')||h.includes('id="pixora-ai-013-pinch-zoom"'))throw Error("Patch 0.13.1 incompleta.");
h=h.replaceAll("0.12.1","0.13.1").replaceAll("0.13.0","0.13.1");
fs.writeFileSync(hp,h,"utf8");
let g=fs.readFileSync(gp,"utf8").replace(/(\bversionCode\s*=?\s*)\d+/,"$1"+"17").replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/,"$1'0.13.1'");
if(!/\bversionCode\s*=?\s*17\b/.test(g)||!/\bversionName\s*=?\s*['"]0\.13\.1['"]/.test(g))throw Error("Versione Gradle 0.13.1 non impostata.");
fs.writeFileSync(gp,g,"utf8");
fs.writeFileSync(path.join(root,"update.json"),JSON.stringify({version:"0.13.1",versionCode:17,platform:"android",releaseUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.13.1",apkUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.13.1/PIXORA-AI-0.13.1.apk"},null,2)+"\n","utf8");
console.log("PIXORA AI 0.13.1 pronta.");
