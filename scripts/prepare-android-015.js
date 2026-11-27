// PIXORA AI 0.13.2 — sposta il salvataggio accanto a + Nuova foto.
const fs = require("fs");
const path = require("path");
const htmlPath = path.join(process.cwd(), "www", "index.html");
if (!fs.existsSync(htmlPath)) throw new Error("www/index.html non trovato.");
let html = fs.readFileSync(htmlPath, "utf8");

const patch = `<script id="pixora-ai-0132-save-toolbar">
(()=>{
 const $=id=>document.getElementById(id);
 const toolbar=$("p092-toolbar"),newPhoto=$("p092-new"),oldSave=$("save");
 if(!toolbar||!newPhoto||!oldSave)throw Error("Toolbar o pulsante Salva non trovati.");
 if(!oldSave.onclick)throw Error("Gestore di salvataggio 0.13.1 non trovato.");
 // Clona il pulsante per eliminare i vecchi listener in conflitto, mantenendo
 // il gestore 0.13.1 che conosce anche il risultato generato dall'IA.
 const save=oldSave.cloneNode(true),saveHandler=oldSave.onclick;
 save.id="save";save.textContent="↓ Salva immagine";save.hidden=false;save.style.display="";save.className="";
 save.onclick=async event=>{
  if(save.disabled)return;save.disabled=true;
  try{await saveHandler.call(save,event);}finally{save.disabled=false;}
 };
 oldSave.replaceWith(save);
 newPhoto.insertAdjacentElement("afterend",save);
 const style=document.createElement("style");
 style.id="pixora-ai-0132-save-toolbar-style";
 style.textContent="#p092-toolbar #save{flex:0 0 auto;white-space:nowrap;padding:8px 9px;border-radius:12px;font-size:10px;font-weight:800;background:linear-gradient(135deg,#8b5cf6,#22cde7);border:1px solid #6f79e8;color:#071126;min-height:36px}";
 document.head.appendChild(style);
 const version=$("photo-ai-version");if(version)version.textContent="v0.13.2";
 document.title="PIXORA AI 0.13.2";
})();
</script>`;
if (!html.includes('id="pixora-ai-0131-native-save-zoom-sync"')) throw new Error("Patch di salvataggio nativo 0.13.1 non trovata.");
if (!html.includes('id="pixora-ai-0132-save-toolbar"')) html = html.replace("</body>", patch + "\n</body>");
if (!html.includes('id="pixora-ai-0132-save-toolbar"')) throw new Error("Pulsante Salva immagine non inserito.");
fs.writeFileSync(htmlPath, html, "utf8");
console.log("PIXORA AI 0.13.2: Salva immagine posizionato accanto a + Nuova foto.");
