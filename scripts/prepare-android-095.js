const fs = require('fs');
const path = require('path');
const root = process.cwd();
const www = path.join(root, 'www');
const htmlPath = path.join(www, 'index.html');
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');

if (!fs.existsSync(htmlPath) || !fs.existsSync(gradlePath)) {
  throw new Error('File di build mancanti: eseguire prima la preparazione Android.');
}

let html = fs.readFileSync(htmlPath, 'utf8');
for (const marker of ['photo-ai-091-ui', 'photo-ai-092-ui', 'photo-ai-093-version-guard', 'pixora-ai-094-brand-guard']) {
  if (!html.includes(marker)) throw new Error(`Base PIXORA AI 0.9.4 non riconosciuta: manca ${marker}. Build interrotta.`);
}

const css = `
/* PIXORA AI 0.9.5 — identità visiva */
:root{--pixora-violet:#8b5cf6;--pixora-cyan:#22d3ee;--pixora-bg:#101326}
header .logo#pixora-mark{display:grid!important;place-items:center;width:44px;height:44px;min-width:44px;border-radius:14px;background:linear-gradient(145deg,#171b35,#25234b)!important;border:1px solid #554a91;box-shadow:0 5px 18px #080b1e88!important;overflow:hidden}
#pixora-mark svg{display:block;width:100%;height:100%}
#photo-ai-version{display:inline-block!important;margin-left:8px!important;padding:5px 10px!important;border-radius:20px!important;background:#30245f!important;color:#f3efff!important;font-size:11px!important;font-weight:800!important}
`;
if (!html.includes('PIXORA AI 0.9.5 — identità visiva')) html = html.replace('</style>', css + '\n</style>');

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="PIXORA AI"><defs><linearGradient id="pixoraGradient095" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a78bfa"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><path d="M13 51V13h20c12 0 19 6 19 16S45 45 33 45H25v6H13zm12-17h8c5 0 8-2 8-5s-3-5-8-5h-8v10z" fill="url(#pixoraGradient095)"/><path d="M48 9l2.2 5.8L56 17l-5.8 2.2L48 25l-2.2-5.8L40 17l5.8-2.2L48 9z" fill="#f0abfc"/><circle cx="49" cy="48" r="4" fill="#22d3ee"/></svg>`;
const guard = `
<script id="pixora-ai-095-identity-guard">
(()=>{
 const mark=${JSON.stringify(mark)};
 const apply=()=>{
  const title=document.querySelector('header h1');if(title)title.textContent='PIXORA AI';
  const sub=document.querySelector('header .brand p');if(sub)sub.textContent='Immagina · Crea · Evolvi';
  const logo=document.querySelector('header .logo');if(logo){logo.id='pixora-mark';logo.innerHTML=mark;logo.setAttribute('aria-label','PIXORA AI');}
  const version=document.getElementById('photo-ai-version');if(version)version.textContent='v0.9.5';
  const footer=document.querySelector('.footer');if(footer)footer.textContent='PIXORA AI 0.9.5 · Editor intelligente · Galleria';
  document.title='PIXORA AI 0.9.5';
 };
 apply();
 document.addEventListener('DOMContentLoaded',apply,{once:true});
 // Il vecchio guard 0.9.3 esegue anche un setTimeout a 300 ms: riapplichiamo
 // la versione dopo quel timeout per evitare che ripristini accidentalmente 0.9.3.
 [350,650,1100].forEach(ms=>setTimeout(apply,ms));
})();
</script>`;
if (!html.includes('pixora-ai-095-identity-guard')) html = html.replace('</body>', guard + '\n</body>');
fs.writeFileSync(htmlPath, html, 'utf8');

// Imposta la versione Android senza cambiare applicationId o dati locali.
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/(\bversionCode\s*=?\s*)\d+/, '$1' + '7');
gradle = gradle.replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/, "$1'0.9.5'");
if (!/\bversionCode\s*=?\s*7\b/.test(gradle) || !/\bversionName\s*=?\s*['"]0\.9\.5['"]/.test(gradle)) {
  throw new Error('Versione Gradle 0.9.5 non impostata correttamente.');
}
fs.writeFileSync(gradlePath, gradle, 'utf8');

// Icona launcher Android: risorse vettoriali native, incluse le adaptive icons Android 8+.
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');
const dirs = ['drawable', 'mipmap-anydpi', 'mipmap-anydpi-v26'];
for (const d of dirs) fs.mkdirSync(path.join(res, d), { recursive: true });
const foreground = `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#A78BFA" android:pathData="M25,83 L25,25 L55,25 C75,25 87,36 87,53 C87,70 75,81 55,81 L43,81 L43,83 Z M43,64 L55,64 C63,64 68,60 68,53 C68,46 63,42 55,42 L43,42 Z"/><path android:fillColor="#22D3EE" android:pathData="M82,13 L85,21 L93,24 L85,27 L82,35 L79,27 L71,24 L79,21 Z"/><path android:fillColor="#F0ABFC" android:pathData="M82,76 A5,5 0,1 0,82 86 A5,5 0,1 0,82 76"/></vector>`;
const background = `<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><corners android:radius="24dp"/><solid android:color="#101326"/></shape>`;
const adaptive = `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@drawable/pixora_icon_background"/><foreground android:drawable="@drawable/pixora_icon_foreground"/></adaptive-icon>`;
fs.writeFileSync(path.join(res, 'drawable', 'pixora_icon_foreground.xml'), foreground);
fs.writeFileSync(path.join(res, 'drawable', 'pixora_icon_background.xml'), background);
const legacyIcon = `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#101326" android:pathData="M14,0 L94,0 Q108,0 108,14 L108,94 Q108,108 94,108 L14,108 Q0,108 0,94 L0,14 Q0,0 14,0 Z"/><path android:fillColor="#A78BFA" android:pathData="M25,83 L25,25 L55,25 C75,25 87,36 87,53 C87,70 75,81 55,81 L43,81 L43,83 Z M43,64 L55,64 C63,64 68,60 68,53 C68,46 63,42 55,42 L43,42 Z"/><path android:fillColor="#22D3EE" android:pathData="M82,13 L85,21 L93,24 L85,27 L82,35 L79,27 L71,24 L79,21 Z"/><path android:fillColor="#F0ABFC" android:pathData="M82,76 A5,5 0,1 0,82 86 A5,5 0,1 0,82 76"/></vector>`;
for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  fs.writeFileSync(path.join(res, 'mipmap-anydpi-v26', name), adaptive);
  fs.writeFileSync(path.join(res, 'mipmap-anydpi', name), legacyIcon);
}

console.log('PIXORA AI 0.9.5: logo interno, icona Android e versione 0.9.5 applicati.');
