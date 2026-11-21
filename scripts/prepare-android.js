const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = process.cwd();
const www = path.join(root, 'www');
fs.mkdirSync(www, { recursive: true });

for (const file of ['index.html', 'sw.js', 'manifest.webmanifest', 'icon.svg']) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error(`File richiesto mancante nella root: ${file}`);
  fs.copyFileSync(source, path.join(www, file));
}

let html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
html = html.replace(
  'function draw(){if(!image)return;const max=1800,scale=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));',
  'let pixoraAIOutputBlob=null,pixoraLoadingAIOutput=false;\nfunction draw(){if(!pixoraLoadingAIOutput)pixoraAIOutputBlob=null;if(!image)return;const max=1800,scale=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));'
);
html = html.replace(
  "function exportBlob(){return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94))}",
  "function exportBlob(){if(pixoraAIOutputBlob)return Promise.resolve(pixoraAIOutputBlob);return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94))}"
);
html = html.replace("indexedDB.open(DB_NAME,1)", "indexedDB.open(DB_NAME,2)");
html = html.replace(
  "req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});",
  "req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'id',autoIncrement:true});};"
);

html = html.replace(/PHOTO AI STUDIO 0\.6/g, 'PHOTO AI STUDIO 0.9');
html = html.replace(/LABORATORIO FOTOGRAFICO PERSONALE · 0\.6/g, 'LABORATORIO FOTOGRAFICO PERSONALE · 0.9');
html = html.replace(/PHOTO AI STUDIO 0\.6 · PWA personale/g, 'PHOTO AI STUDIO 0.9 · Android · progetti locali');

html = html.replace(
  "const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true}),preview=$('preview');",
  "const canvas=document.createElement('canvas');canvas.id='photo';const ctx=canvas.getContext('2d',{willReadFrequently:true}),preview=$('preview');"
);


const nativePanel = `
<section class="card" id="deviceAi">
<h2>IA del telefono · strumenti locali</h2>
<p class="sub">Analisi eseguite sul dispositivo tramite Google ML Kit. Non generano nuovi vestiti o sfondi.</p>
<div class="actions three">
<button id="aiObjects" class="secondary">Rileva oggetti</button>
<button id="aiPose" class="secondary">Rileva posa</button>
<button id="aiSegment" class="secondary">Separa persona</button>
</div>
<div id="aiDeviceStatus" class="notice" style="margin-top:10px">Apri una foto nell'Editor. Queste funzioni sono disponibili nell'APK Android.</div>
<div id="aiMaskPreview" style="margin-top:10px"></div>
</section>`;
html = html.replace('</section>\n<section class="view" id="gallery">', '</section>' + nativePanel + '\n<section class="view" id="gallery">');

html = html.replace('</style>', `
/* 0.9: area di lavoro adattiva e controlli di navigazione */
#preview{touch-action:none;position:relative;min-height:210px}
#preview canvas#photo{max-width:100%;max-height:52vh;transform-origin:center center;will-change:transform}
.zoombar{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:9px}
.zoombar button{padding:10px 5px}
#aiMaskPreview{background-color:#151d31;background-image:linear-gradient(45deg,#293653 25%,transparent 25%),linear-gradient(-45deg,#293653 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#293653 75%),linear-gradient(-45deg,transparent 75%,#293653 75%);background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0;border:1px solid #435170;border-radius:12px;overflow:hidden;padding:8px;text-align:center}
#aiMaskPreview img{max-height:48vh;object-fit:contain;image-rendering:auto;filter:drop-shadow(0 2px 8px #0008)}
.project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:10px}
.project-item{border:1px solid var(--line);background:#0e1729;border-radius:13px;padding:9px;min-width:0}
.project-item strong{display:block;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.project-item small{display:block;color:var(--muted);font-size:10px;margin:4px 0 8px}
.project-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.project-actions button{font-size:10px;padding:8px 4px}
@media(min-width:620px){.project-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>`);

html = html.replace('<div class="status" id="status">Nessuna foto caricata · modalità locale</div>', `
<div class="status" id="status">Nessuna foto caricata · modalità locale</div>
<div class="zoombar">
<button class="secondary" id="zoomOut">− Zoom</button><button class="secondary" id="zoomIn">＋ Zoom</button>
<button class="secondary" id="zoomFit">Adatta</button><button class="secondary" id="zoomCenter">Centra</button>
</div>
<div class="actions" style="margin-top:8px"><button class="secondary" id="saveProjectVersion">Salva nuova versione progetto</button></div>
<div class="status" id="projectStatus">Progetto non ancora creato.</div>`);

html = html.replace('<div id="galleryEmpty" class="empty-gallery">', `
<h2 style="margin-top:18px">Progetti modificabili</h2>
<p class="sub">I progetti conservano la foto originale e le regolazioni: puoi riprenderli senza perdere la versione di partenza.</p>
<div id="projectsGrid" class="project-grid"></div>
<div id="projectsEmpty" class="empty-gallery">Apri una foto nell’Editor: il progetto verrà salvato automaticamente qui.</div>
<div id="galleryEmpty" class="empty-gallery">`);

html = html.replace('</section>\\n\\n<section class="view" id="gallery">', '</section>\\n\\n<section class="view" id="gallery">');
html = html.replace('</body>', `
<script src="./native-bridge.js"></script>
<script>
(() => {
  const $ = id => document.getElementById(id);
  const DB = 'photo-ai-studio-db';
  const PROJECTS = 'projects';
  let activeProjectId = null;
  let originalBlob = null;
  let saveTimer = null;
  let zoom = 1, panX = 0, panY = 0;
  let pointers = new Map(), pinchStart = null;

  function projectState() {
    return {
      brightness: Number($('brightness').value),
      contrast: Number($('contrast').value),
      saturation: Number($('saturation').value),
      sharpness: Number($('sharpness').value),
      rotation: rotation || 0,
      preset: preset || null
    };
  }
  function openProjectDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('gallery')) db.createObjectStore('gallery', {keyPath:'id', autoIncrement:true});
        if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, {keyPath:'id', autoIncrement:true});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function projectGet(id) {
    const db = await openProjectDB();
    return new Promise((resolve,reject) => {
      const r = db.transaction(PROJECTS,'readonly').objectStore(PROJECTS).get(Number(id));
      r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
    });
  }
  async function projectPut(item) {
    const db = await openProjectDB();
    return new Promise((resolve,reject) => {
      const tx=db.transaction(PROJECTS,'readwrite');
      const r=tx.objectStore(PROJECTS).put(item);
      r.onsuccess=()=>{item.id=r.result;};
      tx.oncomplete=()=>resolve(item.id); tx.onerror=()=>reject(tx.error);
    });
  }
  async function projectAdd(item) {
    const db = await openProjectDB();
    return new Promise((resolve,reject) => {
      const tx=db.transaction(PROJECTS,'readwrite');
      const r=tx.objectStore(PROJECTS).add(item);
      r.onsuccess=()=>{item.id=r.result;};
      tx.oncomplete=()=>resolve(item.id); tx.onerror=()=>reject(tx.error);
    });
  }
  async function projectAll() {
    const db=await openProjectDB();
    return new Promise((resolve,reject)=>{
      const r=db.transaction(PROJECTS,'readonly').objectStore(PROJECTS).getAll();
      r.onsuccess=()=>resolve(r.result.sort((a,b)=>b.updated-a.updated));
      r.onerror=()=>reject(r.error);
    });
  }
  async function ensureProject() {
    if (!image || !originalBlob) return;
    const state=projectState();
    if (activeProjectId) {
      const item=await projectGet(activeProjectId);
      if (item) {
        item.state=state; item.updated=Date.now(); item.name=currentName || item.name;
        await projectPut(item);
        $('projectStatus').textContent='Salvataggio automatico attivo · '+item.name;
        return;
      }
    }
    const item={name:currentName || 'Nuovo progetto', originalBlob, state, versions:[], created:Date.now(), updated:Date.now()};
    activeProjectId=await projectAdd(item);
    $('projectStatus').textContent='Progetto salvato automaticamente · '+item.name;
  }
  // Public, narrow bridge for PIXORA AI 0.9.7 cloud enhancement.
  // The source file stays local until the user explicitly taps the AI button.
  window.pixoraGetOriginalBlob = () => originalBlob;
  window.pixoraApplyEnhancedBlob = async (blob) => {
    if (!(blob instanceof Blob) || !blob.size) throw new Error('Risultato AI non valido.');
    if (image) { await ensureProject(); await saveVersion(); }
    const url = URL.createObjectURL(blob);
    try {
      const im = new Image();
      await new Promise((resolve, reject) => { im.onload = resolve; im.onerror = reject; im.src = url; });
      image = im;
      pixoraAIOutputBlob = blob; pixoraLoadingAIOutput = true;
      originalBlob = blob;
      activeProjectId = null;
      currentName = (currentName || 'Foto') + '-AI';
      showingOriginal = false; preset = null; rotation = 0;
      ['brightness','contrast','saturation'].forEach(id => $(id).value = 100);
      $('sharpness').value = 0; updateLabels(); draw(); pixoraLoadingAIOutput = false; fitZoom();
      status('Miglioramento AI completato · ' + im.naturalWidth + ' × ' + im.naturalHeight);
      await ensureProject(); await renderProjects();
    } finally { URL.revokeObjectURL(url); }
  };

  function queueProjectSave() {
    if (!image || !originalBlob) return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>ensureProject().then(renderProjects).catch(()=>{$('projectStatus').textContent='Salvataggio progetto non disponibile.';}),450);
  }
  async function loadProjectImage(blob, state, id, name) {
    const url=URL.createObjectURL(blob), im=new Image();
    im.onload=async()=>{
      image=im; originalBlob=blob; activeProjectId=id || null; pixoraAIOutputBlob=(name||'').endsWith('-AI')?blob:null; pixoraLoadingAIOutput=true;
      currentName=name || 'Progetto';
      $('brightness').value=state?.brightness ?? 100;
      $('contrast').value=state?.contrast ?? 100;
      $('saturation').value=state?.saturation ?? 100;
      $('sharpness').value=state?.sharpness ?? 0;
      rotation=state?.rotation ?? 0; preset=state?.preset ?? null;
      showingOriginal=false; updateLabels(); draw(); pixoraLoadingAIOutput=false; fitZoom();
      status('Progetto riaperto · originale conservato');
      $('projectStatus').textContent='Progetto in modifica · '+currentName;
      URL.revokeObjectURL(url);
      document.querySelector('[data-view="editor"]').click();
      if (!id) await ensureProject();
    };
    im.onerror=()=>{URL.revokeObjectURL(url);status('Impossibile riaprire questa immagine.');};
    im.src=url;
  }
  async function renderProjects() {
    const grid=$('projectsGrid'), empty=$('projectsEmpty');
    if(!grid) return;
    grid.innerHTML='';
    let items=[];
    try{items=await projectAll();}catch(e){empty.textContent='Archivio progetti non disponibile.';return;}
    empty.style.display=items.length?'none':'block';
    for(const p of items){
      const card=document.createElement('div');card.className='project-item';
      const title=document.createElement('strong');title.textContent=p.name || 'Progetto';
      const meta=document.createElement('small');meta.textContent=new Date(p.updated).toLocaleString('it-IT')+' · '+(p.versions?.length||0)+' versioni';
      const actions=document.createElement('div');actions.className='project-actions';
      const resume=document.createElement('button');resume.textContent='Riprendi';resume.onclick=()=>loadProjectImage(p.originalBlob,p.state,p.id,p.name);
      const duplicate=document.createElement('button');duplicate.className='secondary';duplicate.textContent='Duplica';duplicate.onclick=async()=>{
        const copy={name:(p.name||'Progetto')+' - copia',originalBlob:p.originalBlob,state:{...p.state},versions:[...(p.versions||[])],created:Date.now(),updated:Date.now()};
        await projectAdd(copy);renderProjects();
      };
      const restore=document.createElement('button');restore.className='secondary';restore.textContent='Originale';restore.onclick=async()=>{
        if(!confirm('Ripristinare la foto originale e azzerare le regolazioni correnti? Le versioni salvate restano disponibili.'))return;
        await loadProjectImage(p.originalBlob,{brightness:100,contrast:100,saturation:100,sharpness:0,rotation:0,preset:null},p.id,p.name);
        await ensureProject();renderProjects();
      };
      const remove=document.createElement('button');remove.className='secondary';remove.textContent='Elimina';remove.onclick=async()=>{
        if(!confirm('Eliminare questo progetto e la sua cronologia?'))return;
        const db=await openProjectDB();await new Promise((resolve,reject)=>{const tx=db.transaction(PROJECTS,'readwrite');tx.objectStore(PROJECTS).delete(p.id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
        if(activeProjectId===p.id){activeProjectId=null;originalBlob=null;$('projectStatus').textContent='Progetto eliminato.';}
        renderProjects();
      };
      actions.append(resume,duplicate,restore,remove);card.append(title,meta,actions);grid.append(card);
    }
  }
  async function saveVersion() {
    if(!image){status('Apri prima una foto.');return;}
    await ensureProject();
    const item=await projectGet(activeProjectId);
    const blob=await exportBlob();
    if(!blob){status('Impossibile creare la versione.');return;}
    item.versions=item.versions||[];
    item.versions.push({blob,state:projectState(),created:Date.now(),label:'Versione '+(item.versions.length+1)});
    item.updated=Date.now();await projectPut(item);
    status('Nuova versione salvata nel progetto.');
    $('projectStatus').textContent='Progetto salvato · '+item.versions.length+' versioni';
    renderProjects();
  }
  function applyZoom() {
    const c=$('preview').querySelector('canvas');
    if(c)c.style.transform='translate('+panX+'px,'+panY+'px) scale('+zoom+')';
  }
  function fitZoom(){zoom=1;panX=0;panY=0;applyZoom();}
  $('zoomIn').onclick=()=>{zoom=Math.min(4,zoom*1.2);applyZoom();};
  $('zoomOut').onclick=()=>{zoom=Math.max(.5,zoom/1.2);applyZoom();};
  $('zoomFit').onclick=fitZoom;
  $('zoomCenter').onclick=()=>{panX=0;panY=0;applyZoom();};
  const area=$('preview');
  area.addEventListener('pointerdown',e=>{area.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});});
  area.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const prev=pointers.get(e.pointerId),dx=e.clientX-prev.x,dy=e.clientY-prev.y;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===1){panX+=dx;panY+=dy;applyZoom();}
    else if(pointers.size===2){
      const pts=[...pointers.values()],dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      if(pinchStart){zoom=Math.max(.5,Math.min(4,zoom*dist/pinchStart));applyZoom();}
      pinchStart=dist;
    }
  });
  const clearPointer=e=>{pointers.delete(e.pointerId);pinchStart=null;};
  area.addEventListener('pointerup',clearPointer);area.addEventListener('pointercancel',clearPointer);area.addEventListener('lostpointercapture',clearPointer);

  $('saveProjectVersion').onclick=()=>saveVersion().catch(()=>status('Errore durante il salvataggio della versione.'));
  $('galleryRefresh').addEventListener('click',renderProjects);
  document.querySelector('[data-view="gallery"]').addEventListener('click',renderProjects);
  $('saveGallery').addEventListener('click',()=>{setTimeout(()=>saveVersion().catch(()=>{}),700);});
  $('pick').addEventListener('change',e=>{
    const f=e.target.files?.[0];if(!f)return;
    originalBlob=f;activeProjectId=null;
    let tries=0;
    const waitForImage=()=>{
      if(image){ensureProject().then(renderProjects).catch(()=>{$('projectStatus').textContent='Impossibile salvare il progetto.';});return;}
      if(++tries<60)setTimeout(waitForImage,100);
      else $('projectStatus').textContent='Immagine non ancora pronta: riprova ad aprire il progetto.';
    };
    waitForImage();
    fitZoom();
  });
  ['brightness','contrast','saturation','sharpness'].forEach(id=>$(id).addEventListener('input',queueProjectSave));
  ['rotate','warm','mono','auto','reset'].forEach(id=>$(id).addEventListener('click',()=>setTimeout(queueProjectSave,80)));
  const originalDraw=draw;
  draw=function(){originalDraw();applyZoom();};
  renderProjects();

  // Migliora la leggibilità della maschera: scala contenuta, sfondo a scacchi e contorno.
  const maskStyle=document.createElement('style');
  maskStyle.textContent='#aiMaskPreview img{width:auto;max-width:100%;height:auto;max-height:48vh;object-fit:contain;outline:1px solid #aab8ff55}';
  document.head.appendChild(maskStyle);
})();
</script>
<script>
(()=> {
  const status=document.getElementById('aiDeviceStatus');
  const getImage=()=>{
    if(!window.photoAiIsNative || !window.PhotoAiNative) throw new Error('Apri l’APK Android 0.9 per usare l’IA del telefono.');
    const canvas=document.querySelector('#preview canvas');
    if(!canvas) throw new Error('Prima apri una foto nell’Editor.');
    return canvas.toDataURL('image/jpeg',0.88).split(',')[1];
  };
  const run=async(method)=>{
    try{
      status.textContent='Elaborazione sul telefono…';
      const result=await window.PhotoAiNative[method]({imageBase64:getImage()});
      if(method==='detectObjects'){
        const list=result.objects||[];
        status.textContent=list.length?'Oggetti rilevati: '+list.map(x=>x.label+(x.confidence?' ('+Math.round(x.confidence*100)+'%)':'')).join(', '):'Nessun oggetto riconosciuto.';
      } else if(method==='detectPose'){
        const pts=result.landmarks||[];
        status.textContent=pts.length?'Posa rilevata: '+pts.length+' punti del corpo individuati.':'Non è stata rilevata una persona.';
      } else {
        const holder=document.getElementById('aiMaskPreview');
        holder.innerHTML='';
        const img=document.createElement('img');
        img.alt='Maschera di segmentazione della persona';
        img.src='data:image/png;base64,'+result.maskBase64;
        holder.appendChild(img);
        status.textContent='Maschera della persona creata ('+result.width+' × '+result.height+'). È una maschera di analisi, non ancora il ritaglio trasparente finale.';
      }
    }catch(e){status.textContent=e.message||'Operazione non riuscita.';}
  };
  document.getElementById('aiObjects').onclick=()=>run('detectObjects');
  document.getElementById('aiPose').onclick=()=>run('detectPose');
  document.getElementById('aiSegment').onclick=()=>run('segmentPerson');
  if(!window.photoAiIsNative)status.textContent='Questi strumenti sono attivi solo nell’APK Android.';
})();
</script>
</body>`);

fs.writeFileSync(path.join(www, 'index.html'), html);

const appGradle = path.join(root, 'android/app/build.gradle');
const appGradleKts = path.join(root, 'android/app/build.gradle.kts');
const gradlePath = fs.existsSync(appGradle) ? appGradle : appGradleKts;
if (!fs.existsSync(gradlePath)) throw new Error('Non trovo android/app/build.gradle generato da Capacitor.');
if (gradlePath.endsWith('.kts')) throw new Error('Il progetto attende il file Gradle Groovy generato da Capacitor.');
let gradle = fs.readFileSync(gradlePath, 'utf8');
const deps = `
    implementation 'com.google.mlkit:object-detection:17.0.2'
    implementation 'com.google.mlkit:pose-detection-accurate:18.0.0-beta5'
    implementation 'com.google.mlkit:segmentation-selfie:16.0.0-beta6'
`;
if (!gradle.includes('com.google.mlkit:object-detection')) {
  gradle = gradle.replace(/dependencies\s*\{/, match => match + deps);
}
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 2');
gradle = gradle.replace(/versionName\s+['"][^'"]+['"]/, "versionName '0.9.0'");
fs.writeFileSync(gradlePath, gradle);

const javaDir = path.join(root, 'android/app/src/main/java/com/photoaistudio/app09');
fs.mkdirSync(javaDir, { recursive: true });
for (const file of ['MainActivity.java', 'PhotoAiNativePlugin.java']) {
  fs.copyFileSync(path.join(root, 'native', file), path.join(javaDir, file));
}
console.log('Preparazione Android 0.9 completata.');
