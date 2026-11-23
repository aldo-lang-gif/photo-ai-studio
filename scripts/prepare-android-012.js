// PIXORA AI 0.12.0 — consolidate AI tools in the main editor preview.
const fs=require("fs"),path=require("path"),root=process.cwd();
const hp=path.join(root,"www","index.html"),gp=path.join(root,"android","app","build.gradle");
if(!fs.existsSync(hp)||!fs.existsSync(gp))throw Error("Progetto Android 0.12.0 incompleto.");
let h=fs.readFileSync(hp,"utf8");
for(const m of ["pixora-ai-097-panel","pixora-ai-011-editor","pixora-ai-011-client"])if(!h.includes(m))throw Error("Base 0.11.0 non riconosciuta: "+m);
const css=`
/* PIXORA AI 0.12.0 — unified AI workspace */
#pixora-ai-097-panel{display:none!important}
#pixora-ai-012-controls{display:block;margin:12px 0 2px;padding:13px;border:1px solid #6553a5;border-radius:15px;background:linear-gradient(145deg,#171d3b,#17142d)}
#pixora-ai-012-controls label{display:block;font-size:12px;font-weight:800;margin:0 0 7px}
#pixora-ai-012-controls textarea{width:100%;min-height:70px;box-sizing:border-box;border-radius:11px;border:1px solid #465276;background:#0c1424;color:#fff;padding:11px;font:13px/1.45 system-ui}
#pixora-ai-012-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
#pixora-ai-012-actions button{width:100%;min-height:46px;padding:9px 6px;border:0;border-radius:11px;color:#09101f;font-size:11px;line-height:1.25;font-weight:900}
#pixora-ai-011-run{background:linear-gradient(120deg,#8b5cf6,#22d3ee)!important}
#pixora-ai-097-run{background:linear-gradient(120deg,#39b6e8,#7ee7ce)!important}
#pixora-ai-011-status,#pixora-ai-097-status{font-size:11px;line-height:1.4;color:#d8d5ff;margin-top:7px}
#pixora-ai-011-result-wrap{display:none!important}
#preview #pixora-ai-012-generated{display:block;max-width:100%;max-height:52vh;width:auto;height:auto;object-fit:contain}
`;
if(!h.includes("PIXORA AI 0.12.0 — unified AI workspace"))h=h.replace("</style>",css+"</style>");
const hook='   image.src=resultUrl;\n   wrap.hidden=false;';
if(!h.includes(hook))throw Error("Hook risultato IA 0.11.0 non trovato.");
h=h.replace(hook,hook+'\n   window.pixoraShowGeneratedResult?.(blob);');
const controller=`<script id="pixora-ai-012-unified-editor">
(()=>{
 const $=id=>document.getElementById(id),preview=$("preview"),editor=$("editor"),panel=$("pixora-ai-097-panel"),promptPanel=$("pixora-ai-011-editor");
 const upscale=$("pixora-ai-097-run"),edit=$("pixora-ai-011-run"),textarea=$("pixora-ai-011-prompt"),editStatus=$("pixora-ai-011-status"),upStatus=$("pixora-ai-097-status");
 if(!preview||!editor||!panel||!promptPanel||!upscale||!edit||!textarea||!editStatus||!upStatus)throw Error("Controlli IA esistenti non trovati.");
 const label=promptPanel.querySelector('label[for="pixora-ai-011-prompt"]');
 if(!label)throw Error("Etichetta descrizione non trovata.");
 label.textContent="Descrivi la modifica da applicare";
 textarea.placeholder="Es. Aggiungi un cappellino nero, realistico, senza modificare il viso.";
 textarea.style.minHeight="70px";
 const workspace=document.createElement("section");workspace.id="pixora-ai-012-controls";workspace.setAttribute("aria-label","Strumenti IA");
 const actions=document.createElement("div");actions.id="pixora-ai-012-actions";actions.append(edit,upscale);
 workspace.append(label,textarea,actions,editStatus,upStatus);
 $("pixora-ai-011-result-wrap")?.remove();promptPanel.remove();panel.remove();
 const status=$("status");if(status)status.insertAdjacentElement("afterend",workspace);else preview.insertAdjacentElement("afterend",workspace);
 let url=null,img=null,after=true;
 window.pixoraShowGeneratedResult=blob=>{
  if(!(blob instanceof Blob)||!blob.size)throw Error("Risultato IA vuoto.");
  const canvas=preview.querySelector("canvas");if(!canvas)throw Error("Anteprima originale non disponibile.");
  if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);
  if(!img){img=document.createElement("img");img.id="pixora-ai-012-generated";img.alt="Foto modificata con IA";}
  img.src=url;canvas.style.display="none";preview.appendChild(img);after=true;
  const b=$("compare");if(b)b.textContent="Prima / Dopo";
  if(status)status.textContent="Risultato IA visualizzato · premi Prima / Dopo per confrontarlo con l'originale.";
 };
 const compare=$("compare");
 if(compare)compare.addEventListener("click",e=>{
  if(!img||!img.isConnected)return;e.preventDefault();e.stopImmediatePropagation();
  const canvas=preview.querySelector("canvas");if(!canvas)return;
  after=!after;canvas.style.display=after?"none":"";img.style.display=after?"":"none";
  compare.textContent=after?"Mostra originale":"Mostra risultato";
  if(status)status.textContent=after?"Risultato IA":"Foto originale";
 },true);
 const picker=$("pick");if(picker)picker.addEventListener("change",()=>{
  if(url){URL.revokeObjectURL(url);url=null;}if(img){img.remove();img=null;}
  after=true;if(compare)compare.textContent="Prima / Dopo";
 },true);
 document.title="PIXORA AI 0.12.0";
 const brand=document.querySelector("header h1");if(brand)brand.textContent="PIXORA AI";
 const tagline=document.querySelector("header p");if(tagline)tagline.textContent="AI PHOTO EDITOR";
})();
</script>`;
if(!h.includes('id="pixora-ai-012-unified-editor"'))h=h.replace("</body>",controller+"</body>");
for(const m of ["pixora-ai-012-unified-editor","pixora-ai-012-controls","pixora-ai-012-generated","pixoraShowGeneratedResult?.(blob)"])if(!h.includes(m))throw Error("Patch incompleta: "+m);
h=h.replaceAll("0.11.0","0.12.0").replaceAll("v0.11.0","v0.12.0");
fs.writeFileSync(hp,h,"utf8");
let g=fs.readFileSync(gp,"utf8").replace(/(\bversionCode\s*=?\s*)\d+/,"$1"+"14").replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/,"$1'0.12.0'");
if(!/\bversionCode\s*=?\s*14\b/.test(g)||!/\bversionName\s*=?\s*['"]0\.12\.0['"]/.test(g))throw Error("Versione Gradle non impostata.");
fs.writeFileSync(gp,g,"utf8");
fs.writeFileSync(path.join(root,"update.json"),JSON.stringify({version:"0.12.0",versionCode:14,platform:"android",releaseUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.12.0",apkUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.12.0/PIXORA-AI-0.12.0.apk"},null,2)+"\n");
console.log("PIXORA 0.12.0 unified editor configured.");
