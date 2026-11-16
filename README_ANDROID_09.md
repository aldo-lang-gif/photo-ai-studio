# PHOTO AI STUDIO Android 0.9

## Prima di iniziare
Questo pacchetto aggiorna il wrapper Android, non sovrascrive automaticamente i file PWA della root. Le nuove funzioni sono inserite nella copia `www/index.html` generata durante la build.

## Importante: installazione di prova separata
La 0.9 usa temporaneamente l'identificativo Android `com.photoaistudio.app09` e il nome `PHOTO AI STUDIO 0.9`. In questo modo può essere installata accanto alla 0.8 senza disinstallarla e senza cancellare i suoi dati. È una build di test separata.

## File da aggiungere alla root del repository
Mantieni i file web già presenti nel repository (`index.html`, `sw.js`, `manifest.webmanifest`, `icon.svg`) e aggiungi/sostituisci con quelli di questo pacchetto:
- `package.json`
- `capacitor.config.json`
- `native/bridge.js`
- `native/MainActivity.java`
- `native/PhotoAiNativePlugin.java`
- `scripts/prepare-android.js`
- `.github/workflows/build-android.yml`

Aggiungi anche `README_ANDROID_09.md`.

## Funzioni 0.9 incluse
- adattamento della foto nell'area di anteprima;
- zoom con pulsanti + e −;
- spostamento della foto trascinando;
- pulsante Adatta e Centra;
- progetti locali con originale e parametri di modifica;
- ripresa del progetto dalla sezione Galleria;
- salvataggio automatico delle regolazioni;
- salvataggio di versioni;
- duplicazione del progetto;
- ripristino dell'originale;
- strumenti ML Kit già presenti in 0.8, con maschera visualizzata su sfondo a scacchi.

## Dati e compatibilità
- Il database IndexedDB esistente `photo-ai-studio-db` viene aggiornato da versione 1 a versione 2. Lo store `gallery` non viene cancellato; viene aggiunto lo store `projects`.
- Non cancellare i dati di Chrome o dell'app 0.8.
- I progetti della 0.9 sono memorizzati nell'app di test 0.9 e non vengono importati automaticamente dalla 0.8.
- Il rilevamento posa e la segmentazione ML Kit restano strumenti di analisi, non generazione di vestiti/sfondi/pose.
- La funzione di zoom è di visualizzazione: non cambia i pixel esportati.
- Prima di considerare la 0.9 definitiva, verificare la build GitHub Actions e testare apertura, caricamento, zoom, progetto, ripresa, duplicazione e versione.

## Build
GitHub Actions genera `PHOTO-AI-STUDIO-0.9-debug-apk`. Apri il workflow `Build PHOTO AI STUDIO Android 0.9`, premi `Run workflow` e scarica l'artifact quando la run termina con `Success`.
