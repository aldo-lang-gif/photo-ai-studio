const fs=require('fs'),path=require('path'),root=process.cwd(),www=path.join(root,'www'),htmlPath=path.join(www,'index.html'),gradlePath=path.join(root,'android/app/build.gradle');
if(!fs.existsSync(htmlPath)||!fs.existsSync(gradlePath))throw new Error('File di build mancanti.');
let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('photo-ai-091-ui')||!html.includes('photo-ai-092-ui'))throw new Error('Generatori 0.9.1/0.9.2 non rilevati: build bloccata per evitare APK vecchio.');
html=html.replace(/v0\.9\.[12]/g,'v0.9.3').replace(/PHOTO AI STUDIO 0\.9\.[12]/g,'PHOTO AI STUDIO 0.9.3');
const guard=`<script id="photo-ai-093-version-guard">(()=>{const f=()=>{const v=document.getElementById('photo-ai-version');if(v)v.textContent='v0.9.3';const x=document.querySelector('.footer');if(x)x.textContent='PHOTO AI STUDIO 0.9.3 · Editor + IA · Galleria';};f();document.addEventListener('DOMContentLoaded',f,{once:true});setTimeout(f,300);})();</script>`;
if(!html.includes('photo-ai-093-version-guard'))html=html.replace('</body>',guard+'\\n</body>');
fs.writeFileSync(htmlPath,html,'utf8');

let g=fs.readFileSync(gradlePath,'utf8');
// Supporta entrambe le sintassi Gradle: versionCode 4 e versionCode = 4.
g=g.replace(/(\bversionCode\s*=?\s*)\d+/, '$1'+'5');
g=g.replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/, '$1'+"'0.9.3'");
if(!/\bversionCode\s*=?\s*5\b/.test(g)||!/\bversionName\s*=?\s*['"]0\.9\.3['"]/.test(g)) {
  throw new Error('Versione Gradle non impostata correttamente. Controllare android/app/build.gradle.');
}
fs.writeFileSync(gradlePath,g,'utf8');
const m=path.join(root,'update.json');if(fs.existsSync(m)){const d=JSON.parse(fs.readFileSync(m,'utf8'));d.version='0.9.3';d.versionCode=5;d.releaseUrl='https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.9.3';fs.writeFileSync(m,JSON.stringify(d,null,2)+'\\n');}
console.log('0.9.3: versionCode 5 e versionName 0.9.3 verificati.');
