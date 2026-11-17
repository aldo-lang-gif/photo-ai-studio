# PHOTO AI STUDIO 0.9.1 — pacchetto sorgenti aggiornamento

## Prima di iniziare
Questo pacchetto NON è un APK già compilato e non è ancora stato testato su dispositivo. Serve ad aggiornare i file sorgente del repository GitHub e poi avviare GitHub Actions.

## File da aggiungere/sostituire nel repository `aldo-lang-gif/photo-ai-studio`
- Sostituire `package.json`
- Sostituire `.github/workflows/build-android.yml`
- Aggiungere `scripts/prepare-android-091.js`
- Aggiungere `update.json`

NON sostituire `index.html`, `scripts/prepare-android.js`, `capacitor.config.json`, `native/` o i file della galleria.
Il package id resta `com.photoaistudio.app09`; il database non viene cancellato né ricreato.

## Compilazione
Dopo aver caricato i file:
1. Aprire GitHub → Actions.
2. Selezionare “Build PHOTO AI STUDIO Android 0.9.1”.
3. Premere “Run workflow”.
4. Attendere il completamento verde.
5. Aprire la run completata e scaricare l'artifact `PHOTO-AI-STUDIO-0.9.1-debug-apk`.

## Importante
La funzione “Verifica aggiornamenti” controlla il manifest remoto e informa se esiste una versione più nuova. Non installa APK in silenzio e non scarica/aggiorna automaticamente il codice web. Per aggiornamenti Android nativi serve un nuovo APK e la conferma dell'utente.

La build usa ancora il generatore 0.9 esistente e aggiunge uno strato grafico 0.9.1. Il bridge ML Kit viene controllato con verifiche difensive; la disponibilità effettiva del plugin va confermata sulla build Android. La Galleria e i progetti IndexedDB sono lasciati intatti. Prima di installare, conserva comunque una copia delle foto importanti nella memoria del telefono.
