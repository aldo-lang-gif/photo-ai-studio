// PIXORA AI 0.12.1 — one AI prompt, compact toolbar, no duplicate controls.
const fs=require("fs"),path=require("path"),root=process.cwd();
const hp=path.join(root,"www","index.html"),gp=path.join(root,"android","app","build.gradle");
if(!fs.existsSync(hp)||!fs.existsSync(gp))throw Error("Progetto Android PIXORA incompleto.");
let h=fs.readFileSync(hp,"utf8");
for(const m of ["pixora-ai-097-panel","pixora-ai-011-editor","pixora-ai-011-client","photo-ai-091-prompt","p092-toolbar"])
 if(!h.includes(m))throw Error("Base PIXORA non riconosciuta: "+m);
const hook='   image.src=resultUrl;\n   wrap.hidden=false;';
if(!h.includes(hook))throw Error("Hook risultato IA non trovato.");
if(!h.includes("pixoraShowGeneratedResult?.(blob)"))h=h.replace(hook,hook+'\n   window.pixoraShowGeneratedResult?.(blob);');
const css=`
/* PIXORA AI 0.12.1 — pulizia pannelli e toolbar */
#photo-ai-091-prompt,#photo-ai-091-photo-controls,#p092-tools,#tools,#pixora-ai-097-panel,#pixora-ai-011-result-wrap{display:none!important}
#pixora-ai-012-controls{display:block;margin:10px 0 4px;padding:13px;border:1px solid #6553a5;border-radius:15px;background:linear-gradient(145deg,#171d3b,#17142d)}
#pixora-ai-012-controls label{display:block;font-size:13px;font-weight:800;margin:0 0 7px}
#pixora-ai-012-controls textarea{width:100%;min-height:76px;box-sizing:border-box;border-radius:11px;border:1px solid #465276;background:#0c1424;color:#fff;padding:11px;font:14px/1.45 system-ui}
#pixora-ai-012-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
#pixora-ai-012-actions button{width:100%;min-height:46px;padding:9px 6px;border:0;border-radius:11px;color:#09101f;font-size:11px;line-height:1.25;font-weight:900}
#pixora-ai-011-run{background:linear-gradient(120deg,#8b5cf6,#22d3ee)!important}
#pixora-ai-097-run{background:linear-gradient(120deg,#39b6e8,#7ee7ce)!important}
#pixora-ai-011-status,#pixora-ai-097-status{font-size:11px;line-height:1.4;color:#d8d5ff;margin-top:7px}
#preview #pixora-ai-012-generated{display:block;max-width:100%;max-height:52vh;width:auto;height:auto;object-fit:contain}
#p092-toolbar,#p092-extras{display:flex;gap:6px;overflow-x:auto;overscroll-behavior-x:contain;padding:3px 0 7px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
#p092-toolbar button,#p092-extras button{flex:0 0 auto;white-space:nowrap}
`;
if(!h.includes("PIXORA AI 0.12.1 — pulizia pannelli e toolbar"))h=h.replace("</style>",css+"\n</style>");
const controller=`<script id="pixora-ai-012-unified-editor" data-pixora-cleanup="pixoraRemoveLegacyControls">
(()=>{
 const $=id=>document.getElementById(id),preview=$("preview"),status=$("status");
 const oldPrompt=$("photo-ai-091-prompt"),upPanel=$("pixora-ai-097-panel"),editPanel=$("pixora-ai-011-editor");
 const upscale=$("pixora-ai-097-run"),edit=$("pixora-ai-011-run"),ta=$("pixora-ai-011-prompt");
 const editStatus=$("pixora-ai-011-status"),upStatus=$("pixora-ai-097-status");
 if(!preview||!upPanel||!editPanel||!upscale||!edit||!ta||!editStatus||!upStatus)throw Error("Controlli IA non trovati.");
 const label=editPanel.querySelector('label[for="pixora-ai-011-prompt"]');
 if(!label)throw Error("Etichetta descrizione IA non trovata.");
 oldPrompt?.remove();$("p092-tools")?.remove();$("tools")?.remove();
 // Togli solo la fila grande duplicata: la toolbar compatta p092 resta.
 $("photo-ai-091-photo-controls")?.remove();
 label.textContent="Descrivi cosa vuoi modificare nella foto";
 ta.placeholder="Es. Rimuovi un oggetto, cambia lo sfondo, modifica i vestiti o migliora i dettagli…";
 ta.style.minHeight="76px";
 const panel=document.createElement("section");panel.id="pixora-ai-012-controls";panel.setAttribute("aria-label","Modifica foto con IA");
 const actions=document.createElement("div");actions.id="pixora-ai-012-actions";actions.append(edit,upscale);
 panel.append(label,ta,actions,editStatus,upStatus);
 editPanel.remove();upPanel.remove();$("pixora-ai-011-result-wrap")?.remove();
 const compact=$("p092-toolbar");
 if(compact)compact.insertAdjacentElement("afterend",panel);
 else if(status)status.insertAdjacentElement("afterend",panel);
 else preview.insertAdjacentElement("afterend",panel);
 let resultUrl=null,resultImage=null,after=true;
 window.pixoraShowGeneratedResult=blob=>{
  if(!(blob instanceof Blob)||!blob.size)throw Error("Risultato IA vuoto.");
  const canvas=preview.querySelector("canvas");if(!canvas)throw Error("Anteprima originale non disponibile.");
  if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl=URL.createObjectURL(blob);
  if(!resultImage){resultImage=document.createElement("img");resultImage.id="pixora-ai-012-generated";resultImage.alt="Foto modificata con IA";}
  resultImage.src=resultUrl;canvas.style.display="none";preview.appendChild(resultImage);after=true;
  const b=$("compare");if(b)b.textContent="Prima / Dopo";
  if(status)status.textContent="Modifica IA completata · usa Prima / Dopo per confrontare il risultato.";
 };
 const compare=$("compare");
 if(compare)compare.addEventListener("click",e=>{
  if(!resultImage||!resultImage.isConnected)return;e.preventDefault();e.stopImmediatePropagation();
  const canvas=preview.querySelector("canvas");if(!canvas)return;
  after=!after;canvas.style.display=after?"none":"";resultImage.style.display=after?"":"none";
  compare.textContent=after?"Mostra originale":"Mostra risultato";
  if(status)status.textContent=after?"Risultato IA":"Foto originale";
 },true);
 const picker=$("pick");
 if(picker)picker.addEventListener("change",()=>{
  if(resultUrl){URL.revokeObjectURL(resultUrl);resultUrl=null;}
  if(resultImage){resultImage.remove();resultImage=null;}
  after=true;if(compare)compare.textContent="Prima / Dopo";
 },true);
 document.title="PIXORA AI 0.12.1";
 const brand=document.querySelector("header h1");if(brand)brand.textContent="PIXORA AI";
 const tagline=document.querySelector("header p");if(tagline)tagline.textContent="Immagina · Crea · Evolvi";
 const version=$("photo-ai-version");if(version)version.textContent="v0.12.1";
})();
</script>`;
if(!h.includes('id="pixora-ai-012-unified-editor"'))h=h.replace("</body>",controller+"\n</body>");
for(const m of ["pixora-ai-012-unified-editor","pixora-ai-012-controls","pixoraRemoveLegacyControls","pixoraShowGeneratedResult"])
 if(!h.includes(m))throw Error("Patch 0.12.1 incompleta: "+m);
h=h.replaceAll("0.11.0","0.12.1").replaceAll("0.12.0","0.12.1");
fs.writeFileSync(hp,h,"utf8");
let g=fs.readFileSync(gp,"utf8").replace(/(\bversionCode\s*=?\s*)\d+/,"$1"+"15").replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/,"$1'0.12.1'");
if(!/\bversionCode\s*=?\s*15\b/.test(g)||!/\bversionName\s*=?\s*['"]0\.12\.1['"]/.test(g))throw Error("Versione Gradle 0.12.1 non impostata.");
fs.writeFileSync(gp,g,"utf8");
const manifest={version:"0.12.1",versionCode:15,platform:"android",releaseUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.12.1",apkUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.12.1/PIXORA-AI-0.12.1.apk"};
fs.writeFileSync(path.join(root,"update.json"),JSON.stringify(manifest,null,2)+"\n","utf8");
console.log("PIXORA AI 0.12.1: interfaccia IA unificata e toolbar compatta mantenuta.");
