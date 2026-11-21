# PIXORA AI 0.9.7 — pacchetto sorgente

## Cosa contiene
- Tutta la base Android 0.9.6 conservata: package ID, dati locali, plugin updater e firma stabile.
- Nuovo endpoint `POST /enhance` nel Worker Cloudflare.
- Upscaling AI 2× basato su ESRGAN tramite Cloudflare Images.
- Pulsante nell’Editor Android che invia la foto solo dopo un tocco esplicito.
- Limite upload 20 MB, formati JPEG/PNG/WebP, limite 40 MP in ingresso e rate limit esistente.
- Il Worker non salva i byte dell’immagine in storage. Il progetto originale resta in Galleria e il risultato viene creato come nuovo progetto.
- Nessun modello Topaz a pagamento, nessun credito prepagato e nessun fallback a provider a pagamento.

## Quota e costi
Cloudflare Images Free include fino a 5.000 trasformazioni uniche al mese. Superata la quota, le nuove trasformazioni vengono rifiutate; il Worker mostra un messaggio e non passa a servizi a pagamento. La quota è condivisa con eventuali altre trasformazioni già usate dall’account Cloudflare.

## Requisito Cloudflare
`wrangler.jsonc` aggiunge il binding `IMAGES` oltre ai binding `AI` e `RL` già presenti. Il deploy del Worker deve applicare questa configurazione. La funzione `upscale=generate` di Cloudflare Images è documentata da Cloudflare come upscaling AI basato su ESRGAN; non è un semplice ridimensionamento bicubico. Il modello viene eseguito dal servizio Images, non dal binding Workers AI `AI`. Dopo il deploy, aprire:

- `https://pixora-ai-core.aldomoro5525.workers.dev/health`

Il JSON deve indicare `imageBinding: true`. Se è `false`, non tentare l’upscaling: configurare il binding Images sul Worker Cloudflare e ridistribuire.

## Privacy
L’immagine viene trasmessa al Worker solo quando l’utente preme **Migliora questa foto con IA**. Il Worker non scrive l’immagine su R2, KV o database; la passa al binding Images per l’elaborazione e restituisce il risultato. Non usare il pulsante se non si desidera inviare quella foto a Cloudflare.

## Verifiche
`npm run test:worker` controlla le risposte dell’endpoint con un binding Images simulato; non equivale a una prova reale dell’inferenza Cloudflare. Dopo il deploy, la prova reale va eseguita con una foto di test e verificando la risposta immagine e le intestazioni `X-Pixora-AI-Engine` e dimensioni.

## Build Android
Il workflow GitHub Actions mantiene la firma stabile tramite i secrets già esistenti `PIXORA_KEYSTORE_BASE64` e `PIXORA_KEYSTORE_PASSWORD`. Il build produce `PIXORA-AI-0.9.7.apk` e incrementa `versionCode` a 9, senza cambiare `applicationId` (`com.photoaistudio.app09`).

Eseguire `Build PIXORA AI Android 0.9.7` da GitHub Actions dopo aver caricato il pacchetto sul repository. Verificare che il workflow termini con Success prima di installare l’APK.

## Limiti dichiarati
Questa prima integrazione è AI super-risoluzione ESRGAN 2×: non è ancora un sistema generativo completo per rimozione oggetti, cambio vestiti, cambio sfondo o ricostruzione volti. Queste funzioni non vengono simulate con filtri e restano da integrare separatamente. Il risultato AI va controllato visivamente perché la super-risoluzione può ricostruire dettagli plausibili, non recuperare informazioni che non esistono nella foto originale.
