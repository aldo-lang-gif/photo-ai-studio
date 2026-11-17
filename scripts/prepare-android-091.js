const fs = require('fs');
const path = require('path');

const root = process.cwd();
const www = path.join(root, 'www');
const htmlPath = path.join(www, 'index.html');
if (!fs.existsSync(htmlPath)) throw new Error('Esegui prima scripts/prepare-android.js');

let html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('id="editor"') || !html.includes('id="studio"') || !html.includes('id="preview"')) {
  throw new Error('Struttura PHOTO AI STUDIO non riconosciuta: build interrotta.');
}
if (html.includes('photo-ai-091-ui')) {
  html = html.replace(/<script id="photo-ai-091-ui">[\s\S]*?<\/script>/, '');
  html = html.replace(/\/\* PHOTO AI STUDIO 0\.9\.1 \*\/[\s\S]*?(?=\n<\/style>)/, '');
}

const css = `
/* PHOTO AI STUDIO 0.9.1 */
:root{--bg:#070d20;--panel:#111b36;--panel2:#0d1730;--accent:#a9b8ff;--line:#344a85}
html,body{background:#070d20}
body{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
header{top:0;padding:12px 14px;background:linear-gradient(110deg,#101b3b,#211849);border-bottom:1px solid #5265b7}
.logo{background:linear-gradient(145deg,#24c6ff,#4627dc);box-shadow:0 4px 20px #625bff66}
header h1{letter-spacing:.2px}
header .brand p{color:#b8c6ff}
main{padding:8px 10px 24px}
.tabs{grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}
.tab{padding:12px 7px;font-size:13px;border-radius:18px}
.tab.active{background:linear-gradient(110deg,#1b6fff,#5424e9);box-shadow:0 0 16px #624bff66}
.card{padding:11px;margin:7px 0;border-radius:17px;background:linear-gradient(145deg,#111d3b,#10162d);border:1px solid #2e427a}
#editor>.card:first-child{display:flex;flex-direction:column;gap:8px}
#editor>.card:first-child>h2{display:none}
#editor .actions:first-of-type{display:none}
#pick{display:none}
#preview{min-height:290px;max-height:56vh;border-radius:15px;background:linear-gradient(145deg,#101d40,#0b1228);border:1px solid #5368bd;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none}
#preview canvas#photo{max-width:100%;max-height:55vh;object-fit:contain}
#preview .empty{width:100%;min-height:285px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#c6d1ff;text-align:center}
#photo-ai-add-photo{border:1px solid #7789ff;border-radius:20px;padding:18px 26px;background:linear-gradient(135deg,#1d6cff,#6525e8);color:white;font-size:16px;font-weight:800;box-shadow:0 0 24px #6457ff66}
#photo-ai-add-photo .add-icon{display:block;font-size:42px;line-height:1.2;margin-bottom:8px}
#photo-ai-add-photo small{display:block;font-size:11px;font-weight:500;color:#e1e5ff;margin-top:5px}
#status{margin:0 3px 2px;font-size:11px}
#photo-ai-091-photo-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
#photo-ai-091-photo-controls button{padding:12px 4px;border-radius:15px;background:linear-gradient(145deg,#142c62,#111a3d);border:1px solid #5269b9;color:#eaf0ff;font-size:12px;font-weight:700}
#photo-ai-091-photo-controls button span{display:block;font-size:21px;margin-bottom:3px;color:#91caff}
#zoomIn,#zoomOut{display:none!important}
.zoombar{display:none!important}
#rotate{display:none!important}
#photo-ai-091-extra-controls{display:flex;gap:7px;overflow-x:auto;padding:2px 0 6px}
#photo-ai-091-extra-controls button{flex:0 0 auto;padding:8px 12px;font-size:11px}
#editor>.card:nth-child(2){padding:10px}
#editor .controls{gap:0 10px}
#editor .control{margin:5px 0}
#editor .control input[type=range]{height:20px}
#studio{display:none!important}
#deviceAi{margin-top:8px}
#photo-ai-091-prompt{border:1px solid #5369b3;background:linear-gradient(140deg,#17264a,#171735);border-radius:16px;padding:10px;margin:3px 0}
#photo-ai-091-prompt label{display:block;font-size:13px;font-weight:800;margin-bottom:7px;color:#f1f3ff}
#photo-ai-091-prompt .prompt-row{display:flex;align-items:center;gap:7px}
#photo-ai-091-prompt textarea{min-height:48px;max-height:110px;resize:vertical;flex:1;min-width:0}
#photo-ai-091-prompt button{padding:10px 13px;font-size:12px;white-space:nowrap;background:linear-gradient(135deg,#8e8aff,#5627e8);color:#080e2b}
#photo-ai-091-tools{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;padding:2px 1px 7px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
#photo-ai-091-tools .tool{flex:0 0 112px;min-height:85px;padding:9px 6px;scroll-snap-align:start;background:linear-gradient(145deg,#172b59,#111b39);border:1px solid #3f579e;border-radius:14px}
#photo-ai-091-tools .tool b{font-size:11px}
#photo-ai-091-tools .tool span{font-size:9px}
#photo-ai-091-update{border:1px solid #526bd1;background:linear-gradient(110deg,#13234a,#24194e);border-radius:16px;padding:11px;margin:10px 0;box-shadow:0 0 14px #453cff33}
#photo-ai-091-update h3{font-size:13px;margin:0 0 5px;color:#f2f4ff}
#photo-ai-091-update p{font-size:11px;color:#b9c7f5;margin:5px 0;line-height:1.45}
#photo-ai-091-update button{padding:10px 13px;font-size:12px;background:linear-gradient(135deg,#a49bff,#6432ed);color:#080d25}
#photo-ai-091-update a{color:#c3caff;font-size:11px}
@media(min-width:620px){#photo-ai-091-tools .tool{flex-basis:140px}}
`;
html = html.replace('</style>', css + '\n</style>');

const ui = `
<script id="photo-ai-091-ui">
(()=> {
  const $=id=>document.getElementById(id);
  const editor=$('editor'),studio=$('studio'),preview=$('preview');
  if(!editor||!studio||!preview)return;
  const editorTab=document.querySelector('[data-view="editor"]');
  const studioTab=document.querySelector('[data-view="studio"]');
  if(editorTab)editorTab.textContent='✦ Editor + IA';
  if(studioTab)studioTab.remove();

  const headerTitle=document.querySelector('header h1');
  if(headerTitle)headerTitle.textContent='PHOTO AI STUDIO';
  const headerSub=document.querySelector('header .brand p');
  if(headerSub)headerSub.textContent='Crea · Modifica · Trasforma';
  let version=document.getElementById('photo-ai-version');
  if(!version){
    version=document.createElement('span');version.id='photo-ai-version';version.textContent='v0.9.1';
    version.style.cssText='display:inline-block;margin-left:8px;padding:5px 10px;border-radius:20px;background:#27236b;color:#e2e5ff;font-size:11px;font-weight:800';
    headerTitle?.after(version);
  }

  const pick=$('pick');
  const oldEmpty=preview.querySelector('.empty');
  if(oldEmpty){
    oldEmpty.innerHTML='<button type="button" id="photo-ai-add-photo"><span class="add-icon">＋</span>AGGIUNGI FOTO<small>Tocca per scegliere dalla Galleria o dai file</small></button>';
  } else if(!preview.querySelector('canvas')){
    preview.innerHTML='<div class="empty"><button type="button" id="photo-ai-add-photo"><span class="add-icon">＋</span>AGGIUNGI FOTO<small>Tocca per scegliere dalla Galleria o dai file</small></button></div>';
  }
  preview.addEventListener('click',e=>{
    if(e.target.closest('#photo-ai-add-photo'))pick?.click();
  });

  const mainCard=editor.querySelector('.card');
  const status=$('status');
  const toolbar=document.createElement('div');
  toolbar.id='photo-ai-091-photo-controls';
  toolbar.innerHTML='<button type="button" id="photo-ai-fit"><span>⛶</span>Adatta</button><button type="button" id="photo-ai-rotate"><span>⟳</span>Ruota</button><button type="button" id="photo-ai-center"><span>⊕</span>Centra</button>';
  if(status)status.after(toolbar);
  $('photo-ai-fit').addEventListener('click',()=>$('zoomFit')?.click());
  $('photo-ai-center').addEventListener('click',()=>$('zoomCenter')?.click());
  $('photo-ai-rotate').addEventListener('click',()=>$('rotate')?.click());

  const save=$('save'),compare=$('compare'),reset=$('reset');
  const extra=document.createElement('div');extra.id='photo-ai-091-extra-controls';
  [save,compare,reset].forEach(el=>{if(el){el.classList.add('secondary');extra.append(el);}});
  toolbar.after(extra);

  const tools=$('tools');
  if(tools){
    tools.id='photo-ai-091-tools';
    const toolHeading=tools.previousElementSibling;
    if(toolHeading&&(toolHeading.tagName==='P'||toolHeading.tagName==='H2'))toolHeading.remove();
  }
  const prompt=$('prompt'),prepare=$('prepare'),example=$('example');
  if(prompt){
    const panel=document.createElement('section');panel.id='photo-ai-091-prompt';
    panel.innerHTML='<label for="prompt">✦ Chiedi all’IA di modificare la foto</label>';
    const row=document.createElement('div');row.className='prompt-row';
    const send=document.createElement('button');send.type='button';send.textContent='➤';
    row.append(prompt,send);panel.append(row);
    const prepared=$('prepared');if(prepared)panel.append(prepared);
    const toolLabel=document.createElement('div');toolLabel.style.cssText='font-size:11px;font-weight:800;margin:10px 0 6px';
    toolLabel.textContent='Strumenti';panel.append(toolLabel);
    if(tools)panel.append(tools);
    mainCard?.append(panel);
    send.addEventListener('click',()=>prepare?.click());
    if(prepare)prepare.style.display='none';
    if(example)example.style.display='none';
  }

  const nativePanel=$('deviceAi');
  if(nativePanel)editor.append(nativePanel);

  const aiStatus=$('aiDeviceStatus');
  if(aiStatus&&!window.PhotoAiNative)aiStatus.textContent='Strumenti IA del dispositivo non disponibili in questa build Android.';
  const update=document.createElement('section');update.id='photo-ai-091-update';
  update.innerHTML='<h3>↻ Aggiornamenti disponibili</h3><p id="photo-ai-091-update-status">Controlla se è disponibile una nuova versione.</p><button type="button" id="photo-ai-091-check">↓ Verifica aggiornamenti</button>';
  editor.append(update);
  $('photo-ai-091-check')?.addEventListener('click',async()=>{
    const out=$('photo-ai-091-update-status');out.textContent='Controllo aggiornamenti in corso…';
    try{
      const res=await fetch('https://raw.githubusercontent.com/aldo-lang-gif/photo-ai-studio/main/update.json',{cache:'no-store'});
      if(!res.ok)throw new Error('manifest');
      const manifest=await res.json();
      const current='0.9.1';
      const newer=String(manifest.version||'0').localeCompare(current,undefined,{numeric:true,sensitivity:'base'})>0;
      if(newer){
        out.textContent='È disponibile PHOTO AI STUDIO '+manifest.version+'. Apri la pagina Releases per scaricare l’APK e confermare l’installazione Android.';
        const a=document.createElement('a');a.href='https://github.com/aldo-lang-gif/photo-ai-studio/releases/latest';a.target='_blank';a.rel='noopener';a.textContent='Apri download APK';out.append(' ',a);
      } else out.textContent='PHOTO AI STUDIO 0.9.1 è aggiornato.';
    }catch(e){out.textContent='Controllo non riuscito. Verifica la connessione e riprova.';}
  });
})();
</script>`;
html = html.replace('</body>', ui + '\n</body>');
fs.writeFileSync(htmlPath, html, 'utf8');

const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
if (!fs.existsSync(gradlePath)) throw new Error('File android/app/build.gradle non trovato.');
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 3');
gradle = gradle.replace(/versionName\s+['"][^'"]+['"]/, "versionName '0.9.1'");
fs.writeFileSync(gradlePath, gradle, 'utf8');

console.log('PHOTO AI STUDIO 0.9.1: interfaccia aggiornata.');
