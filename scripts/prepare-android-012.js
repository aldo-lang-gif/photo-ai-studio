const fs=require("fs"),path=require("path"),root=process.cwd();
const hp=path.join(root,"www","index.html"),gp=path.join(root,"android","app","build.gradle");
if(!fs.existsSync(hp)||!fs.existsSync(gp))throw new Error("Progetto Android 0.12.0 incompleto.");
let h=fs.readFileSync(hp,"utf8");
for(const m of ['pixora-ai-011-editor','pixora-ai-011-client','pixora-ai-097-panel','pixoraApplyEnhancedBlob'])if(!h.includes(m))throw new Error("Base 0.11.0 incompleta: "+m);
const client=`<script id="pixora-ai-012-client">
(()=>{const $=id=>document.getElementById(id),API="https://pixora-ai-core.aldomoro5525.workers.dev";
const panel=$("pixora-ai-097-panel"),preview=$("preview"),prompt=$("pixora-ai-011-prompt"),edit=$("pixora-ai-011-run"),up=$("pixora-ai-097-run"),status=$("pixora-ai-011-status");
if(!panel||!preview||!prompt||!edit||!up||!status)return;
$("photo-ai-092-prompt")?.remove();panel.querySelector("h3")?.remove();panel.querySelectorAll(":scope > p").forEach(n=>n.remove());
$("pixora-ai-011-result-wrap")?.remove();$("pixora-ai-097-status")?.remove();
const old=$("pixora-ai-011-editor");old?.querySelector("label")?.remove();old?.querySelector("button")?.remove();old?.querySelector('[role="status"]')?.remove();
edit.textContent="✦ MODIFICA CON IA";up.textContent="✨ AUMENTA RISOLUZIONE 2×";
const actions=document.createElement("div");actions.id="pixora-ai-012-actions";actions.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px";actions.append(edit,up);
for(const b of [edit,up])b.style.cssText="width:100%;min-height:48px;padding:11px 7px;border:0;border-radius:12px;background:linear-gradient(120deg,#8b5cf6,#22d3ee);color:#0b1020;font-size:12px;font-weight:900;white-space:normal";
panel.append(prompt,actions,status);panel.style.cssText="margin:10px 0 5px;padding:11px;border:1px solid #6553a5;border-radius:14px;background:linear-gradient(145deg,#171d3b,#17142d);color:#f5f3ff";
prompt.style.cssText="display:block;width:100%;min-height:66px;max-height:120px;box-sizing:border-box;border-radius:12px;border:1px solid #465276;background:#0c1424;color:#fff;padding:11px;font:13px/1.45 system-ui";
prompt.placeholder="Es. Cambia il colore dei capelli in biondo, mantenendo invariati volto e ambiente…";
status.style.cssText="font-size:11px;line-height:1.45;margin-top:8px;color:#d8d5ff;min-height:16px";preview.insertAdjacentElement("afterend",panel);
let busy=false;
async function run(kind){if(busy)return;const source=window.pixoraGetOriginalBlob?.(),instruction=prompt.value.trim();
if(!source){status.textContent="Prima apri una foto nell'Editor.";return;}
if(source.size>20*1024*1024){status.textContent="La foto supera il limite di 20 MB.";return;}
const type=(source.type||"image/jpeg").toLowerCase();if(!["image/jpeg","image/png","image/webp"].includes(type)){status.textContent="Formato non supportato. Usa JPEG, PNG o WebP.";return;}
if(kind==="edit"&&instruction.length<4){status.textContent="Scrivi la modifica che desideri nel campo qui sopra.";prompt.focus();return;}
if(kind==="edit"&&instruction.length>1200){status.textContent="Descrizione troppo lunga: massimo 1200 caratteri.";return;}
busy=true;edit.disabled=true;up.disabled=true;status.textContent=kind==="edit"?"PIXORA sta modificando la foto…":"PIXORA sta aumentando la risoluzione…";
try{let r;if(kind==="edit"){const f=new FormData();f.append("image",source,"pixora-source");f.append("prompt",instruction);r=await fetch(API+"/edit",{method:"POST",body:f});}
else r=await fetch(API+"/enhance",{method:"POST",headers:{"Content-Type":type},body:source});
if(!r.ok){let d={};try{d=await r.json()}catch{}throw new Error((d.error||("Servizio non disponibile ("+r.status+")"))+(d.detail?" · "+d.detail:""));}
const blob=await r.blob();if(!blob.size||!blob.type.startsWith("image/"))throw new Error("Il servizio non ha restituito un'immagine valida.");
if(typeof window.pixoraApplyEnhancedBlob!=="function")throw new Error("Collegamento all'anteprima dell'Editor non disponibile.");
await window.pixoraApplyEnhancedBlob(blob);const w=r.headers.get("X-Pixora-Output-Width"),hh=r.headers.get("X-Pixora-Output-Height");
status.textContent=(kind==="edit"?"Modifica completata":"Risoluzione aumentata")+(w&&hh?" · "+w+" × "+hh:"")+". Premi «Prima / Dopo» per confrontare con l'originale.";
}catch(e){status.textContent="Elaborazione non riuscita: "+(e?.message||"errore sconosciuto");}
finally{busy=false;edit.disabled=false;up.disabled=false;edit.textContent="✦ MODIFICA CON IA";up.textContent="✨ AUMENTA RISOLUZIONE 2×";}}
edit.onclick=()=>run("edit");up.onclick=()=>run("enhance");
})();
</script>`;
for(const id of ["pixora-ai-011-client","pixora-ai-098-client"]){const a=h.indexOf('<script id="'+id+'">');if(a>=0){const b=h.indexOf("</script>",a);if(b<0)throw Error("Script non chiuso "+id);h=h.slice(0,a)+h.slice(b+9);}}
if(!h.includes("pixora-ai-012-client"))h=h.replace("</body>",client+"\n</body>");
h=h.replaceAll("0.11.0","0.12.0").replace("</style>","\n#save,#saveGallery,#saveProjectVersion{display:none!important}\n</style>");
if(!h.includes("pixora-ai-012-client"))throw Error("Client 0.12.0 non inserito.");
fs.writeFileSync(hp,h,"utf8");
let g=fs.readFileSync(gp,"utf8").replace(/(\bversionCode\s*=?\s*)\d+/,"$1"+"14").replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/,"$1'0.12.0'");
if(!/\bversionCode\s*=?\s*14\b/.test(g)||!/\bversionName\s*=?\s*['"]0\.12\.0['"]/.test(g))throw Error("Versione Gradle 0.12.0 non impostata.");
fs.writeFileSync(gp,g,"utf8");
fs.writeFileSync(path.join(root,"update.json"),JSON.stringify({version:"0.12.0",versionCode:14,platform:"android",releaseUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.12.0",apkUrl:"https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.12.0/PIXORA-AI-0.12.0.apk"},null,2)+"\n","utf8");
console.log("PIXORA AI 0.12.0 unified AI controls configured.");
