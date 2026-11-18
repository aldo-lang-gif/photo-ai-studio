const fs=require('fs'),path=require('path'),root=process.cwd();
const www=path.join(root,'www'),htmlPath=path.join(www,'index.html'),gradlePath=path.join(root,'android/app/build.gradle');
if(!fs.existsSync(htmlPath)||!fs.existsSync(gradlePath))throw new Error('File di build mancanti.');
let h=fs.readFileSync(htmlPath,'utf8');
if(!h.includes('photo-ai-091-ui')||!h.includes('photo-ai-092-ui')||!h.includes('photo-ai-093-version-guard'))throw new Error('Base 0.9.3 non riconosciuta: build interrotta.');
if(!h.includes('p092-check'))throw new Error('Controllo aggiornamenti 0.9.3 non trovato: build interrotta.');
const css=`
/* PIXORA AI 0.9.4 */
:root{--bg:#101326;--panel:#171b35;--accent:#9b83ff}
html,body{background:#101326!important}
header{background:linear-gradient(110deg,#171b35,#202044)!important;border-bottom:1px solid #39365f!important}
header .logo{background:linear-gradient(145deg,#8b5cf6,#22d3ee)!important;box-shadow:none!important}
#pixora-mark{font-weight:900;font-size:22px;line-height:1;color:#fff;letter-spacing:-2px}
#photo-ai-092-prompt,#p092-update{border-color:#51477d}
#p092-toolbar .primary{background:linear-gradient(135deg,#7655df,#4e70d9)}
`;
if(!h.includes('/* PIXORA AI 0.9.4 */'))h=h.replace('</style>',css+'\n</style>');
const guard=`
<script id="pixora-ai-094-brand-guard">
(()=>{const apply=()=>{
 const title=document.querySelector('header h1');if(title)title.textContent='PIXORA AI';
 const sub=document.querySelector('header .brand p');if(sub)sub.textContent='Immagina · Crea · Evolvi';
 const mark=document.querySelector('header .logo');if(mark){mark.id='pixora-mark';mark.textContent='P';}
 const version=document.getElementById('photo-ai-version');if(version)version.textContent='v0.9.4';
 const footer=document.querySelector('.footer');if(footer)footer.textContent='PIXORA AI 0.9.4 · Editor intelligente · Galleria';
 document.title='PIXORA AI 0.9.4';
 ['aiObjects','aiPose','aiSegment','aiMaskPreview'].forEach(id=>document.getElementById(id)?.remove());
 document.getElementById('p092-native')?.remove();
 document.getElementById('deviceAi')?.remove();
};
apply();document.addEventListener('DOMContentLoaded',apply,{once:true});
const out=document.getElementById('p092-update-status'),check=document.getElementById('p092-check');
if(check)check.onclick=async()=>{
 if(!out)return;out.textContent='Controllo aggiornamenti in corso…';
 try{
  const url='https://raw.githubusercontent.com/aldo-lang-gif/photo-ai-studio/main/update.json?v='+Date.now();
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error('Manifest non disponibile');
  const manifest=await response.json();
  const installed='0.9.4';
  const parse=v=>String(v||'0').split(/[.+-]/).map(x=>/^\d+$/.test(x)?Number(x):x);
  const compare=(a,b)=>{const x=parse(a),y=parse(b);for(let i=0;i<Math.max(x.length,y.length);i++){const p=x[i]??0,q=y[i]??0;if(p===q)continue;if(typeof p==='number'&&typeof q==='number')return p>q?1:-1;return String(p).localeCompare(String(q),undefined,{numeric:true})>0?1:-1;}return 0;};
  const result=compare(manifest.version,installed);
  if(result>0){
   out.textContent='È disponibile PIXORA AI '+manifest.version+'.';
   const a=document.createElement('a');a.href=manifest.releaseUrl||'https://github.com/aldo-lang-gif/photo-ai-studio/releases/latest';a.target='_blank';a.rel='noopener';a.textContent='Scarica aggiornamento APK';out.append(' ',a);
  }else if(result===0){out.textContent='PIXORA AI 0.9.4 è aggiornato.';}
  else{out.textContent='Il manifest online non è ancora aggiornato. Riprova più tardi.';}
 }catch(e){out.textContent='Controllo non riuscito. Verifica la connessione e riprova.';}
};
})();
</script>`;
if(!h.includes('pixora-ai-094-brand-guard'))h=h.replace('</body>',guard+'\n</body>');
fs.writeFileSync(htmlPath,h,'utf8');
let g=fs.readFileSync(gradlePath,'utf8');
g=g.replace(/(\bversionCode\s*=?\s*)\d+/,'$1'+'6');
g=g.replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/,'$1'+"'0.9.4'");
if(!/\bversionCode\s*=?\s*6\b/.test(g)||!/\bversionName\s*=?\s*['"]0\.9\.4['"]/.test(g))throw new Error('Versione Gradle 0.9.4 non impostata.');
fs.writeFileSync(gradlePath,g,'utf8');
console.log('PIXORA AI 0.9.4: brand, rimozione strumenti e controllo aggiornamenti applicati.');
