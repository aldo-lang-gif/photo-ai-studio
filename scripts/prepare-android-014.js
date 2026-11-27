// PIXORA AI 0.13.2 — updater fix, compatible with the 0.13.1 preparation step.
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const htmlPath = path.join(root, "www", "index.html");
const gradlePath = path.join(root, "android", "app", "build.gradle");
const packagePath = path.join(root, "package.json");
const manifestPath = path.join(root, "update.json");
const javaPath = path.join(root, "android", "app", "src", "main", "java", "com", "photoaistudio", "app09");
const activityPath = path.join(javaPath, "MainActivity.java");
const updaterPath = path.join(javaPath, "PixoraUpdaterPlugin.java");
const androidManifestPath = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml");

for (const p of [htmlPath, gradlePath, packagePath, activityPath, updaterPath, androidManifestPath]) {
  if (!fs.existsSync(p)) throw new Error("File necessario per updater Android non trovato: " + p);
}

let html = fs.readFileSync(htmlPath, "utf8");
if (!html.includes('id="pixora-ai-096-updater"')) throw new Error("Sistema aggiornamenti PIXORA non trovato.");
// La preparazione 0.13.1 aggiorna già il valore: non cercare più soltanto 0.9.7.
if (!/const installed='[^']+';/.test(html)) throw new Error("Versione installata dell'updater non trovata.");
html = html.replace(/const installed='[^']+';/, "const installed='0.13.2';");
html = html.replace(/PIXORA AI [0-9.]+ è aggiornato\./, "PIXORA AI 0.13.2 è aggiornato.");
if (!html.includes("const installed='0.13.2';")) throw new Error("Versione installata dell'updater non aggiornata.");
fs.writeFileSync(htmlPath, html, "utf8");

const activity = fs.readFileSync(activityPath, "utf8");
const plugin = fs.readFileSync(updaterPath, "utf8");
const androidManifest = fs.readFileSync(androidManifestPath, "utf8");
if (!activity.includes("registerPlugin(PixoraUpdaterPlugin.class)")) throw new Error("PixoraUpdaterPlugin non registrato in MainActivity.");
if (!plugin.includes("downloadAndInstall") || !plugin.includes("ACTION_VIEW")) throw new Error("Plugin di download/installazione incompleto.");
if (!androidManifest.includes("android.permission.REQUEST_INSTALL_PACKAGES")) throw new Error("Permesso Android per installazione APK mancante.");

let gradle = fs.readFileSync(gradlePath, "utf8");
gradle = gradle.replace(/(\bversionCode\s*=?\s*)\d+/, "$1" + "18");
gradle = gradle.replace(/(\bversionName\s*=?\s*)['"][^'"]+['"]/, "$1'0.13.2'");
if (!/\bversionCode\s*=?\s*18\b/.test(gradle) || !/\bversionName\s*=?\s*['"]0\.13\.2['"]/.test(gradle)) {
  throw new Error("Versione Gradle 0.13.2 non impostata.");
}
fs.writeFileSync(gradlePath, gradle, "utf8");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.version = "0.13.2";
const build = pkg.scripts["build:android"] || "";
if (!build.includes("prepare-android-014.js")) {
  if (!build.includes("node scripts/prepare-android-013.js")) throw new Error("Catena build Android non riconosciuta.");
  pkg.scripts["build:android"] = build.replace(
    "node scripts/prepare-android-013.js",
    "node scripts/prepare-android-013.js && node scripts/prepare-android-014.js"
  );
}
if (!pkg.scripts["build:android"].includes("prepare-android-014.js") ||
    !pkg.scripts["build:android"].includes("prepare-android-015.js")) {
  throw new Error("Catena build 0.13.2 incompleta: devono essere presenti gli script 014 e 015.");
}
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

const manifest = {
  version: "0.13.2",
  versionCode: 18,
  platform: "android",
  releaseUrl: "https://github.com/aldo-lang-gif/photo-ai-studio/releases/tag/v0.13.2",
  apkUrl: "https://github.com/aldo-lang-gif/photo-ai-studio/releases/download/v0.13.2/PIXORA-AI-0.13.2.apk"
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log("PIXORA AI 0.13.2: updater compatibile con la catena 0.13.1 e verifiche Android superate.");
