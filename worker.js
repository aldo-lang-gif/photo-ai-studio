// PIXORA AI CORE 0.9.9
// Cloudflare Images ESRGAN upscaling. Images are processed in memory, not persisted by this Worker.
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_AI_SOURCE_DIMENSION = 2000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_ORIGINS = new Set([
  "https://aldo-lang-gif.github.io",
  "http://localhost",
  "https://localhost",
  "capacitor://localhost",
  "ionic://localhost"
]);

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "X-Pixora-Output-Width, X-Pixora-Output-Height, X-Pixora-AI-Engine",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response("Origin not allowed", { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        ok: true,
        worker: "PIXORA AI CORE",
        version: "0.9.9",
        imageBinding: Boolean(env.IMAGES),
        rateLimiter: Boolean(env.RL),
        engine: "Cloudflare Images ESRGAN AI upscaling",
        inferenceExecuted: false
      }, 200, cors);
    }
    if (url.pathname !== "/enhance" || request.method !== "POST") {
      return new Response("PIXORA AI CORE is online. Use GET /health or POST /enhance.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...cors }
      });
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: "Origine non autorizzata." }, 403, cors);
    if (!env.IMAGES) return json({ ok: false, error: "Binding Cloudflare Images non configurato." }, 503, cors);
    if (!env.RL) return json({ ok: false, error: "Rate limiter non configurato." }, 503, cors);

    try {
      const contentType = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_TYPES.has(contentType)) return json({ ok: false, error: "Formato non supportato. Usa JPEG, PNG o WebP." }, 415, cors);
      const declaredLength = Number(request.headers.get("Content-Length") || 0);
      if (declaredLength > MAX_BYTES) return json({ ok: false, error: "Immagine troppo grande: massimo 20 MB." }, 413, cors);

      let limit;
      try {
        const clientKey = request.headers.get("CF-Connecting-IP") || "unknown";
        limit = await env.RL.limit({ key: clientKey });
      } catch (rateError) {
        console.error("PIXORA rate limiter failed:", rateError);
        return json({
          ok: false,
          error: "Controllo del limite temporaneamente non disponibile. Riprova tra poco.",
          detail: String(rateError?.message || rateError).slice(0, 180)
        }, 503, cors);
      }
      if (!limit?.success) return json({ ok: false, error: "Limite temporaneo raggiunto. Attendi un minuto e riprova." }, 429, cors);

      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength) return json({ ok: false, error: "File immagine vuoto." }, 400, cors);
      if (bytes.byteLength > MAX_BYTES) return json({ ok: false, error: "Immagine troppo grande: massimo 20 MB." }, 413, cors);

      const imageStream = () => new Blob([bytes], { type: contentType }).stream();
      const info = await env.IMAGES.info(imageStream());
      const width = Number(info?.width), height = Number(info?.height);
      if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
        return json({ ok: false, error: "Impossibile leggere le dimensioni della foto." }, 422, cors);
      }
      if (width * height > 40_000_000) {
        return json({ ok: false, error: "Foto troppo grande da elaborare in sicurezza (massimo 40 megapixel in ingresso)." }, 413, cors);
      }

      // Cloudflare's AI generate upscaler accepts source images up to 2000x2000.
      // Larger originals are first reduced proportionally, then passed to ESRGAN for a 2x AI upscale.
      let aiWidth = width;
      let aiHeight = height;
      let aiInput = imageStream;

      if (width > MAX_AI_SOURCE_DIMENSION || height > MAX_AI_SOURCE_DIMENSION) {
        const prepScale = Math.min(
          1,
          MAX_AI_SOURCE_DIMENSION / width,
          MAX_AI_SOURCE_DIMENSION / height
        );
        aiWidth = Math.max(1, Math.round(width * prepScale));
        aiHeight = Math.max(1, Math.round(height * prepScale));

        const prepared = await env.IMAGES.input(imageStream())
          .transform({ width: aiWidth, height: aiHeight, fit: "scale-down" })
          .output({ format: "image/jpeg", quality: 95 });

        const preparedResponse = await prepared.response();
        if (!preparedResponse.ok) {
          throw new Error("Preparazione della foto prima dell'upscaling AI non riuscita.");
        }
        const preparedBytes = await preparedResponse.arrayBuffer();
        aiInput = () => new Blob([preparedBytes], { type: "image/jpeg" }).stream();
      }

      const outWidth = aiWidth * 2;
      const outHeight = aiHeight * 2;
      if (outWidth <= width || outHeight <= height) {
        return json({
          ok: false,
          error: "Questa foto è già troppo grande per ottenere un risultato AI 2× più grande. L'originale non è stato modificato."
        }, 413, cors);
      }
      if (outWidth > 8192 || outHeight > 8192 || outWidth * outHeight > 80_000_000) {
        return json({ ok: false, error: "Dimensioni di uscita non supportate per l'ingrandimento AI." }, 413, cors);
      }

      const result = await env.IMAGES.input(aiInput())
        .transform({
          width: outWidth,
          height: outHeight,
          fit: { mode: "contain", upscale: "generate" }
        })
        .output({ format: "image/jpeg", quality: 92 });

      // Await response() so asynchronous provider errors are caught below (including quota errors).
      return await result.response({
        headers: {
          "Cache-Control": "no-store",
          "X-Pixora-AI-Engine": "Cloudflare-Images-ESRGAN",
          "X-Pixora-Output-Width": String(outWidth),
          "X-Pixora-Output-Height": String(outHeight),
          ...cors
        }
      });
    } catch (error) {
      const message = String(error?.message || error || "");
      if (/\b9422\b|quota|usage limit reached|transformation limit reached/i.test(message)) {
        return json({
          ok: false,
          error: "Quota gratuita Cloudflare Images raggiunta. Nessun servizio a pagamento verrà attivato: riprova il mese prossimo."
        }, 429, cors);
      }
      console.error("PIXORA /enhance failed:", error);
      return json({ ok: false, error: "Elaborazione AI non riuscita.", detail: message.slice(0, 180) }, 502, cors);
    }
  }
};
