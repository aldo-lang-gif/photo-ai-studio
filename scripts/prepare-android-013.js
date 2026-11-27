// PIXORA AI 0.13.0 — restore Gallery save, pinch zoom and iterative AI editing.
const fs=require("fs"),path=require("path"),root=process.cwd();
const hp=path.join(root,"www","index.html"),gp=path.join(root,"android","app","build.gradle");
if(!fs.existsSync(hp)||!fs.existsSync(gp))throw Error("Progetto Android PIXORA incompleto.");
let h=fs.readFileSync(hp,"utf8");
for(const m of ['id="pixora-ai-012-unified-editor"','id="pixora-ai-012-controls"','id="pixora-ai-011-run"','id="pixora-ai-097-run"','id="save"','id="preview"','pixoraGetCurrentExportBlob','pixoraGetOriginalBlob','pixoraApplyEnhancedBlob','pixoraShowGeneratedResult'])
 if(!h.includes(m))throw Error("Base 0.12.1 incompleta: manca "+m);

if(!h.includes('id="pixora-ai-013-function-restore"')){
 const css=`
/* PIXORA AI 0.13.0 */
#pixora-ai-012-controls #save{display:block!important;grid-column:1/-1;width:100%;min-height:44px;margin-top:2px;border:1px solid #596caa;border-radius:11px;background:linear-gradient(120deg,#243d72,#176b78);color:#f5fbff;font-weight:900}
#preview{touch-action:none!important}
#preview canvas#photo,#preview #pixora-ai-012-generated{transform-origin:center center;will-change:transform;touch-action:none}
`;
 h=h.replace("</style>",css+"\n</style>");
 const code=`<script id="pixora-ai-013-function-restore" data-pixora-current-image="pixora-ai-013-current-image">
(()=>{
 const $=id=>document.getElementById(id),panel=$("pixora-ai-012-controls"),preview=$("preview"),save=$("save"),status=$("status");
 if(!panel||!preview||!save)throw Error("Controlli principali 0.13.0 non trovati.");
 save.textContent="▣ Salva nella Galleria";
 save.setAttribute("aria-label","Salva la foto elaborata nella Galleria del telefono");
 save.hidden=false;panel.appendChild(save);

 // Conserva i bridge originali e aggiorna la sorgente attiva dopo ogni risultato AI.
 const getOriginal=window.pixoraGetOriginalBlob;
 const getExport=window.pixoraGetCurrentExportBlob;
 const applyEnhanced=window.pixoraApplyEnhancedBlob;
 const showGenerated=window.pixoraShowGeneratedResult;
 if(typeof applyEnhanced!=="function"||typeof showGenerated!=="function")throw Error("Bridge immagini non disponibile.");
 let latestAiBlob=null;
 window.pixoraGetOriginalBlob=()=>latestAiBlob||(typeof getOriginal==="function"?getOriginal():null);
 window.pixoraGetCurrentExportBlob=async()=>{
  if(latestAiBlob)return latestAiBlob;
  if(typeof getExport==="function")return await getExport();
  const canvas=preview.querySelector("canvas");
  if(!canvas)throw Error("Nessuna immagine pronta da salvare.");
  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("Esportazione non riuscita.")),"image/jpeg",.94));
 };
 window.pixoraApplyEnhancedBlob=async blob=>{
  await applyEnhanced(blob);latestAiBlob=blob;return blob;
 };
 window.pixoraShowGeneratedResult=async blob=>{
  if(!(blob instanceof Blob)||!blob.size)throw Error("Risultato IA vuoto.");
  await applyEnhanced(blob);
  latestAiBlob=blob;
  await showGenerated(blob);
  if(status)status.textContent="Risultato IA pronto · puoi salvarlo o descrivere un'altra modifica.";
 };
 $("pick")?.addEventListener("change",()=>{latestAiBlob=null;},true);
})();
`;
 h=h.replace("</body>",code+"\n</body>");
}

if(!h.includes('id="pixora-ai-013-pinch-zoom"')){
 const zoom=`<script id="pixora-ai-013-pinch-zoom">
(()=>{
 const area=document.getElementById("preview");if(!area)return;
 let pts=new Map(),scale=1,x=0,y=0,startDistance=0,startScale=1,lastCenter=null;
 const imgs=()=>[area.querySelector("canvas#photo"),area.querySelector("#pixora-ai-012-generated")].filter(Boolean);
 const paint=()=>{const t="translate("+x+"px,"+y+"px) scale("+scale+")";imgs().forEach(el=>{el.style.transformOrigin="center center";el.style.transform=t;});};
 const dist=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
 const center=p=>({x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2});
 const halt=e=>{e.preventDefault();e.stopImmediatePropagation();};
 area.addEventListener("pointerdown",e=>{
  halt(e);try{area.setPointerCapture(e.pointerId);}catch{}
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===2){const p=[...pts.values()];startDistance=Math.max(1,dist(p));startScale=scale;lastCenter=center(p);}
 },{capture:true,passive:false});
 area.addEventListener("pointermove",e=>{
  if(!pts.has(e.pointerId))return;halt(e);
  const old=pts.get(e.pointerId),now={x:e.clientX,y:e.clientY};pts.set(e.pointerId,now);
  if(pts.size===1){x+=now.x-old.x;y+=now.y-old.y;}
  else if(pts.size>=2){const p=[...pts.values()].slice(0,2),c=center(p);scale=Math.max(.5,Math.min(5,startScale*dist(p)/startDistance));if(lastCenter){x+=c.x-lastCenter.x;y+=c.y-lastCenter.y;}lastCenter=c;}
  paint();
 },{capture:true,passive:false});
 const end=e=>{if(!pts.has(e.pointerId))return;halt(e);pts.delete(e.pointerId);if(pts.size===1){startScale=scale;lastCenter=null;}else if(!pts.size){startDistance=0;lastCenter=null;}};
 ["pointerup","pointercancel","lostpointercapture"].forEach(n=>area.addEventListener(n,end,{capture:true,passive:false}));
 document.getElementById("p092-fit")?.addEventListener("click",()=>{scale=1;x=0;y=0;paint();});
 document.getElementById("p092-center")?.addEventListener("click",()=>{x=0;y=0;paint();});
 window.pixoraResetTouchZoom=()=>{scale=1;x=0;y=0;paint();};
})();
`;
 h=h.replace("</body>",zoom+"\n</body>");
}
for(const m of ['id="pixora-ai-013-function-restore"','id="pixora-ai-013-pinch-zoom"','pixora-ai-013-current-image','Salva nella Galleria'])
 if(!h.includes(m))throw Error("Patch 0.13.0 incompleta: "+m);
h=h.replaceAll("0.12.1","0.13.0");
fs.writeFileSync(hp,h,"utf8");
 let g=fs.readFileSync(gp,"utf8").replace(/(\bversionCode\s*=?\s*)\d+/,"$1"+"16").replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/,"$1'0.13.0'");
 if(!/\bversionCode\s*=?\s*16\b/.test(g)||!/\bversionName\s*=?\s*['"]0\.13\.0['"]/.test(g))throw Error("Versione Gradle 0.13.0 non impostata.");
fs.writeFileSync(gp,g,"utf8");
fs.writeFileSync(path.join(root,"update.json"),JSON.stringify({version:"0.13.0",versionCode:16,platform:"android",releaseUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.13.0",apkUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.13.0/PIXORA-AI-0.13.0.apk"},null,2)+"\n","utf8");
console.log("PIXORA AI 0.13.0 pronta: Galleria, zoom touch, modifica iterativa.");
