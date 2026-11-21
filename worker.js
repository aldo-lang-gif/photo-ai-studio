// PIXORA AI CORE 0.9.7
// Privacy-first photo upscaling through Cloudflare Images AI ESRGAN.
// The Worker does not persist uploaded image bytes.
const MAX_BYTES = 20 * 1024 * 1024;
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
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors }
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
        version: "0.9.7",
        imageBinding: Boolean(env.IMAGES),
        rateLimiter: Boolean(env.RL),
        engine: "Cloudflare Images AI upscaling (ESRGAN)",
        inferenceExecuted: false
      }, 200, cors);
    }

    if (url.pathname !== "/enhance" || request.method !== "POST") {
      return new Response("PIXORA AI CORE is online. Use GET /health or POST /enhance.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...cors }
      });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: "Origin non autorizzata." }, 403, cors);
    if (!env.IMAGES) return json({ ok: false, error: "Binding Cloudflare Images non configurato. Nessuna foto è stata elaborata." }, 503, cors);
    if (!env.RL) return json({ ok: false, error: "Rate limiter non configurato." }, 503, cors);

    const contentType = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
      return json({ ok: false, error: "Formato non supportato. Usa JPEG, PNG o WebP." }, 415, cors);
    }
    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BYTES) return json({ ok: false, error: "Immagine troppo grande: massimo 20 MB." }, 413, cors);

    const clientKey = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.RL.limit({ key: clientKey });
    if (!success) return json({ ok: false, error: "Limite temporaneo raggiunto. Attendi un minuto e riprova." }, 429, cors);

    try {
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength) return json({ ok: false, error: "File immagine vuoto." }, 400, cors);
      if (bytes.byteLength > MAX_BYTES) return json({ ok: false, error: "Immagine troppo grande: massimo 20 MB." }, 413, cors);

      // Cloudflare Images .info() and .input() accept a ReadableStream.
      const imageStream = () => new Blob([bytes], { type: contentType }).stream();
      const info = await env.IMAGES.info(imageStream());
      const width = Number(info?.width), height = Number(info?.height);
      if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
        return json({ ok: false, error: "Impossibile leggere le dimensioni della foto." }, 422, cors);
      }
      if (width * height > 40_000_000) {
        return json({ ok: false, error: "Foto troppo grande da elaborare in sicurezza (massimo 40 megapixel in ingresso)." }, 413, cors);
      }

      const scale = Math.min(2, 8192 / width, 8192 / height, Math.sqrt(80_000_000 / (width * height)));
      if (!Number.isFinite(scale) || scale <= 1.001) {
        return json({ ok: false, error: "La foto è già troppo grande per un ingrandimento AI sicuro (massimo 8192 px per lato)." }, 413, cors);
      }
      const outWidth = Math.round(width * scale);
      const outHeight = Math.round(height * scale);
      if (outWidth <= width || outHeight <= height || outWidth > 8192 || outHeight > 8192 || outWidth * outHeight > 80_000_000) {
        return json({ ok: false, error: "Dimensioni di uscita non supportate per l’ingrandimento AI." }, 413, cors);
      }

      const result = await env.IMAGES.input(imageStream())
        .transform({
          width: outWidth,
          height: outHeight,
          fit: { mode: "contain", upscale: "generate" }
        })
        .output({ format: "image/jpeg", quality: 92 })
        .response({
          headers: {
            "Cache-Control": "no-store",
            "X-Pixora-AI-Engine": "Cloudflare-Images-ESRGAN",
            "X-Pixora-Output-Width": String(outWidth),
            "X-Pixora-Output-Height": String(outHeight),
            ...cors
          }
        });

      return result;
    } catch (error) {
      const message = String(error?.message || error || "");
      if (/\b9422\b|quota|usage limit reached|transformation limit reached/i.test(message)) {
        return json({ ok: false, error: "Quota gratuita Cloudflare Images raggiunta. Non verrà attivato alcun servizio a pagamento: riprova il mese prossimo." }, 429, cors);
      }
      console.error("PIXORA /enhance failed:", error);
      return json({ ok: false, error: "Elaborazione AI non riuscita. Riprova più tardi.", detail: message.slice(0, 180) }, 502, cors);
    }
  }
};
