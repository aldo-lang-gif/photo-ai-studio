# PHOTO AI STUDIO 0.8 — pacchetto Android

Questo pacchetto aggiunge al repository esistente una base Android nativa basata su Capacitor 8 e Google ML Kit. Non sostituisce la PWA pubblicata su GitHub Pages.

## Cosa include
- APK Android debug compilato da GitHub Actions.
- Rilevamento oggetti e relative etichette.
- Rilevamento dei punti della posa umana.
- Generazione di una maschera di segmentazione della persona.
- Elaborazione sul dispositivo, senza API a pagamento.

## Limiti importanti
- La maschera è un risultato intermedio: questa prima versione non crea ancora automaticamente il PNG ritagliato né sostituisce lo sfondo.
- Il rilevamento oggetti usa il modello gestito da Google Play Services e potrebbe dover scaricare il modello al primo utilizzo.
- Pose detection e selfie segmentation sono SDK beta e sono inclusi nell'APK.
- Queste API non generano vestiti, pose nuove o scenari: per l'editing generativo servirà il motore IA locale sul PC o un modello compatibile sul dispositivo.
- L'APK prodotto è una build debug per test personali, non una release firmata per Play Store.

## Come installare nel repository esistente
1. Scarica ed estrai questo ZIP.
2. Nel repository `aldo-lang-gif/photo-ai-studio`, carica i file e le cartelle mantenendo esattamente la struttura. Non eliminare né sostituire `index.html`, `sw.js`, `manifest.webmanifest` o `icon.svg`.
3. Carica `package.json`, `capacitor.config.json`, `native/`, `scripts/` e `.github/workflows/build-android.yml`.
4. Se GitHub chiede di creare le cartelle, usa **Add file → Create new file** e inserisci il percorso completo; per caricare più file è più comodo usare GitHub da browser in modalità desktop o un client Git.
5. Esegui il workflow: repository → Actions → **Build PHOTO AI STUDIO Android 0.8** → Run workflow.
6. Quando termina, apri l'esecuzione e scarica l'artifact `PHOTO-AI-STUDIO-0.8-debug-apk`.
7. Estrai lo ZIP dell'artifact e installa `app-debug.apk` sul Samsung.

## Conservazione della galleria 0.6
La PWA su GitHub Pages resta invariata. La nuova app Android usa il contenuto web impacchettato nell'APK e avrà un archivio locale separato dalla galleria del browser 0.6. Non cancellare i dati di Chrome: la galleria esistente è salvata lì.
