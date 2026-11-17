const fs = require('fs');
const path = require('path');

const root = process.cwd();
const htmlPath = path.join(root, 'www', 'index.html');
const bridgePath = path.join(root, 'www', 'native-bridge.js');
const bridgeSource = `(()=> {
  const cap = window.Capacitor;
  const plugin = cap && cap.Plugins && cap.Plugins.PhotoAiNative;
  if (plugin) window.PhotoAiNative = plugin;
  window.photoAiIsNative = !!(cap && (cap.isNativePlatform ? cap.isNativePlatform() : (cap.getPlatform && cap.getPlatform() !== 'web')));
})();`;
fs.writeFileSync(bridgePath, bridgeSource, 'utf8');
if (!fs.existsSync(htmlPath)) throw new Error('Esegui prima scripts/prepare-android.js');
let html = fs.readFileSync(htmlPath, 'utf8');

if (!html.includes('id="editor"') || !html.includes('id="studio"') || !html.includes('id="preview"')) {
  throw new Error('Struttura PHOTO AI STUDIO non riconosciuta: nessuna modifica applicata.');
}
if (html.includes('photo-ai-091-ui')) {
  console.log('Interfaccia 0.9.1 già applicata.');
} else {
  const css = `
/* PHOTO AI STUDIO 0.9.1 */
:root{--bg:#090e20;--panel:#141d35;--panel2:#10182c;--accent:#aab8ff;--line:#34466f}
html{background:#090e20}
body{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}
header{top:0;padding:10px 14px 9px;background:linear-gradient(110deg,#111b39f2,#241c49f2);border-bottom:1px solid #5364a5}
.logo{background:linear-gradient(145deg,#b9a5ff,#5268d8);box-shadow:0 4px 18px #7768ff55}
main{padding:8px 10px 24px}
.tabs{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.tab{padding:10px 6px;font-size:12px}
.card{padding:11px;margin:7px 0;border-radius:15px}
.card h2{margin-bottom:7px}
#editor>.card:first-child{display:flex;flex-direction:column;gap:7px}
#editor>.card:first-child>h2{margin:0}
#editor .actions:first-of-type{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
#editor .actions:first-of-type button,#editor .actions:first-of-type .filebtn{padding:9px 5px;font-size:11px}
#preview{min-height:150px;max-height:55vh;border-radius:13px;background:#070b16}
#preview canvas#photo{max-width:100%;max-height:55vh;object-fit:contain}
#status{margin:2px 3px 3px}
#rotate{order:-1}
#zoomIn,#zoomOut{display:none!important}
.zoombar{display:flex;justify-content:flex-end;gap:6px;margin:0}
.zoombar #zoomFit,.zoombar #zoomCenter{padding:7px 12px;font-size:11px}
#editor .card:nth-child(2){padding:10px}
#editor .controls{gap:0 10px}
#editor .control{margin:5px 0}
#editor .control input[type=range]{height:20px}
#studio{display:none!important}
#deviceAi{margin-top:8px}
#photo-ai-091-prompt{border:1px solid #5869ad;background:linear-gradient(140deg,#172344,#17172f);border-radius:14px;padding:10px;margin:2px 0}
#photo-ai-091-prompt label{display:block;font-size:12px;font-weight:700;margin-bottom:7px}
#photo-ai-091-prompt textarea{min-height:48px;max-height:110px;resize:vertical}
#photo-ai-091-prompt .prompt-row{display:flex;gap:7px;margin-top:7px}
#photo-ai-091-prompt button{padding:9px 12px;font-size:11px;white-space:nowrap}
#photo-ai-091-tools{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;padding:2px 1px 7px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
#photo-ai-091-tools .tool{flex:0 0 132px;min-height:64px;padding:9px;scroll-snap-align:start}
#photo-ai-091-tools .tool b{font-size:11px}
#photo-ai-091-tools .tool span{font-size:9px}
#photo-ai-091-update{border:1px solid #485b9b;background:linear-gradient(130deg,#171f3d,#211a3d);border-radius:13px;padding:10px;margin:10px 0}
#photo-ai-091-update h3{font-size:12px;margin:0 0 5px}
#photo-ai-091-update p{font-size:11px;color:var(--muted);margin:5px 0;line-height:1.45}
#photo-ai-091-update button{padding:8px 12px;font-size:11px}
#photo-ai-091-update a{color:#c3caff;font-size:11px}
.footer{margin-top:10px}
@media(min-width:620px){#photo-ai-091-tools .tool{flex-basis:150px}}
`;
  html = html.replace('</style>', css + '\n</style>');
  const script = `
<script id="photo-ai-091-ui">
(()=> {
  const $=id=>document.getElementById(id);
  const editor=$('editor'), studio=$('studio');
  if(!editor||!studio)return;
  const editorTab=document.querySelector('[data-view="editor"]');
  const studioTab=document.querySelector('[data-view="studio"]');
  if(editorTab)editorTab.textContent='✦ Editor + IA';
  if(studioTab)studioTab.remove();

  const mainCard=editor.querySelector('.card');
  const preview=$('preview');
  const status=$('status');
  const rotate=$('rotate');
  const topActions=mainCard?.querySelector('.actions');
  if(rotate&&topActions)topActions.insertBefore(rotate,topActions.children[1]||null);

  const tools=$('tools');
  if(tools){
    tools.id='photo-ai-091-tools';
    const toolHeading=tools.previousElementSibling;
    if(toolHeading?.tagName==='P'||toolHeading?.tagName==='H2')toolHeading.remove();
  }
  const prompt=$('prompt');
  const prepare=$('prepare');
  const example=$('example');
  if(prompt&&preview){
    const panel=document.createElement('section');
    panel.id='photo-ai-091-prompt';
    panel.innerHTML='<label for="prompt">✦ Chiedi all’IA di modificare la foto</label>';
    const row=document.createElement('div');row.className='prompt-row';
    const send=document.createElement('button');send.type='button';send.textContent='Prepara';
    row.append(prompt,send);panel.append(row);
    const prepared=$('prepared');
    if(prepared)panel.append(prepared);
    const toolLabel=document.createElement('div');
    toolLabel.style.cssText='font-size:11px;font-weight:700;margin:9px 0 5px';
    toolLabel.textContent='Strumenti';
    panel.append(toolLabel);
    if(tools)panel.append(tools);
    const card=preview.closest('.card');
    if(card)card.append(panel);
    send.addEventListener('click',()=>prepare?.click());
    if(prepare)prepare.style.display='none';
    if(example)example.style.display='none';
  }
  const zoomIn=$('zoomIn'),zoomOut=$('zoomOut');
  if(zoomIn)zoomIn.style.display='none';
  if(zoomOut)zoomOut.style.display='none';
  const fit=$('zoomFit'),center=$('zoomCenter');
  if(fit)fit.textContent='Adatta';
  if(center)center.textContent='Centra';

  // Il bridge nativo può non essere presente nelle build web: mostra un messaggio chiaro.
  const aiStatus=$('aiDeviceStatus');
  if(aiStatus && !window.PhotoAiNative){
    aiStatus.textContent='IA del telefono non disponibile in questa installazione. Verifica che il plugin Android sia incluso nella build.';
  }
  const update=document.createElement('section');
  update.id='photo-ai-091-update';
  update.innerHTML='<h3>↻ Aggiornamenti</h3><p id="photo-ai-091-update-status">Controlla se è disponibile una versione più recente di PHOTO AI STUDIO.</p><button type="button" id="photo-ai-091-check">Verifica aggiornamenti</button><p><a href="https://github.com/aldo-lang-gif/photo-ai-studio/actions" target="_blank" rel="noopener">Apri le build Android su GitHub</a></p>';
  const gallery=document.getElementById('gallery');
  if(gallery)gallery.prepend(update);
  const check=$('photo-ai-091-check'), updateStatus=$('photo-ai-091-update-status');
  if(check)check.addEventListener('click',async()=>{
    updateStatus.textContent='Controllo versione in corso…';
    try{
      const response=await fetch('https://raw.githubusercontent.com/aldo-lang-gif/photo-ai-studio/main/update.json',{cache:'no-store'});
      if(!response.ok)throw new Error('Manifest non disponibile');
      const manifest=await response.json();
      const current='0.9.1';
      const newer=String(manifest.version||'0').localeCompare(current,undefined,{numeric:true,sensitivity:'base'})>0;
      updateStatus.textContent=newer
        ? 'È disponibile la versione '+manifest.version+'. Per aggiornare l’app Android occorre scaricare e installare il nuovo APK.'
        : 'PHOTO AI STUDIO è aggiornato (versione '+current+').';
      if(newer&&manifest.instructionsUrl){
        const link=document.createElement('a');link.href=manifest.instructionsUrl;link.target='_blank';link.rel='noopener';link.textContent='Apri istruzioni aggiornamento';
        updateStatus.append(' ',link);
      }
    }catch(e){updateStatus.textContent='Impossibile verificare ora. Controlla la connessione e riprova.';}
  });
})();
</script>`;
  html = html.replace('</body>', script + '\n</body>');
}

fs.writeFileSync(htmlPath, html);

// Mantiene applicationId e database; incrementa soltanto la versione Android.
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
if (!fs.existsSync(gradlePath)) throw new Error('File android/app/build.gradle non trovato.');
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 3');
gradle = gradle.replace("versionName '0.9.0'", "versionName '0.9.1'");
fs.writeFileSync(gradlePath, gradle);
console.log('PHOTO AI STUDIO 0.9.1: interfaccia e versione preparate.');
