// PIXORA AI CORE 0.11.0
// Keeps the existing ESRGAN endpoint and adds prompt-based image editing with FLUX.2 Klein 4B.
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_AI_SOURCE_EDGE = 511; // Cloudflare requires reference images smaller than 512x512.
const MAX_AI_OUTPUT_EDGE = 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
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
function isQuotaError(message) {
  return /4006|9422|quota|usage limit|free allocation|neurons|billing limit/i.test(message);
}
async function rateLimit(request, env) {
  if (!env.RL) return { ok: false, response: "missing" };
  try {
    const key = request.headers.get("CF-Connecting-IP") || "unknown";
    const result = await env.RL.limit({ key });
    return result?.success ? { ok: true } : { ok: false, response: "limited" };
  } catch (error) {
    console.error("PIXORA rate limiter failed:", error);
    return { ok: false, response: "error" };
  }
}
async function readImageInfo(env, blob) {
  if (!env.IMAGES) throw new Error("Binding Cloudflare Images non configurato.");
  return env.IMAGES.info(blob.stream());
}
function safeOutputSize(width, height) {
  const scale = Math.min(1, MAX_AI_OUTPUT_EDGE / Math.max(width, height));
  const round = n => Math.max(256, Math.min(1920, Math.round((n * scale) / 16) * 16));
  return { width: round(width), height: round(height) };
}
async function prepareReferenceImage(env, source, info) {
  const width = Number(info?.width), height = Number(info?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error("Impossibile leggere le dimensioni della foto.");
  }
  if (width * height > 40_000_000) throw new Error("Foto troppo grande: massimo 40 megapixel.");
  if (Math.max(width, height) <= MAX_AI_SOURCE_EDGE) {
    return { blob: source, width, height };
  }
  const scale = MAX_AI_SOURCE_EDGE / Math.max(width, height);
  const targetWidth = Math.max(1, Math.floor(width * scale));
  const targetHeight = Math.max(1, Math.floor(height * scale));
  const prepared = await env.IMAGES.input(source.stream())
    .transform({ width: targetWidth, height: targetHeight, fit: "scale-down" })
    .output({ format: "image/jpeg", quality: 90 });
  const response = await prepared.response();
  if (!response.ok) throw new Error("Ridimensionamento della foto non riuscito.");
  return {
    blob: new Blob([await response.arrayBuffer()], { type: "image/jpeg" }),
    width: targetWidth,
    height: targetHeight
  };
}
async function runEdit(request, env, cors) {
  if (!env.AI || !env.IMAGES) return json({
    ok: false,
    error: "Motore IA non configurato: verifica i binding AI e IMAGES del Worker."
  }, 503, cors);
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BYTES + 64 * 1024) return json({ ok: false, error: "Foto troppo grande: massimo 20 MB." }, 413, cors);

  const limit = await rateLimit(request, env);
  if (!limit.ok) {
    if (limit.response === "limited") return json({ ok: false, error: "Limite temporaneo raggiunto. Attendi un minuto e riprova." }, 429, cors);
    return json({ ok: false, error: "Controllo del limite temporaneamente non disponibile." }, 503, cors);
  }

  let form;
  try { form = await request.formData(); }
  catch { return json({ ok: false, error: "Richiesta non valida: invia una foto e una descrizione." }, 400, cors); }

  const source = form.get("image");
  const prompt = String(form.get("prompt") || "").trim();
  if (!(source instanceof Blob) || !source.size) return json({ ok: false, error: "Seleziona prima una foto." }, 400, cors);
  if (source.size > MAX_BYTES) return json({ ok: false, error: "Foto troppo grande: massimo 20 MB." }, 413, cors);
  if (!ALLOWED_TYPES.has((source.type || "").toLowerCase())) return json({ ok: false, error: "Formato non supportato. Usa JPEG, PNG o WebP." }, 415, cors);
  if (prompt.length < 4 || prompt.length > 1200) return json({ ok: false, error: "Descrivi la modifica con almeno 4 e massimo 1200 caratteri." }, 400, cors);

  try {
    const info = await readImageInfo(env, source);
    const reference = await prepareReferenceImage(env, source, info);
    const size = safeOutputSize(Number(info.width), Number(info.height));

    const modelForm = new FormData();
    modelForm.append("prompt", `${prompt}\nEdit the provided image. Preserve the original subject identity, facial features, composition, lighting and all unrequested details. Change only what the instruction explicitly requests. Make the result photorealistic and coherent.`);
    modelForm.append("input_image_0", reference.blob, "pixora-reference.jpg");
    modelForm.append("width", String(size.width));
    modelForm.append("height", String(size.height));
    const encoded = new Response(modelForm);
    const modelResponse = await env.AI.run(MODEL, {
      multipart: {
        body: encoded.body,
        contentType: encoded.headers.get("content-type")
      }
    });

    const imageBase64 = modelResponse?.image || modelResponse?.result?.image;
    if (typeof imageBase64 !== "string" || !imageBase64.length) {
      throw new Error("Il modello non ha restituito un'immagine valida.");
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
    const binary = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
    if (!binary.length) throw new Error("Il risultato generato è vuoto.");
    return new Response(binary, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "X-Pixora-AI-Engine": "Cloudflare-Workers-AI-FLUX-2-Klein-4B",
        "X-Pixora-Output-Width": String(size.width),
        "X-Pixora-Output-Height": String(size.height),
        ...cors
      }
    });
  } catch (error) {
    const message = String(error?.message || error || "");
    console.error("PIXORA /edit failed:", error);
    if (isQuotaError(message)) {
      return json({
        ok: false,
        error: "Quota gratuita Workers AI esaurita o limite del servizio raggiunto. Nessun modello alternativo a pagamento verrà usato. Riprova quando la quota sarà disponibile."
      }, 429, cors);
    }
    return json({ ok: false, error: "Modifica IA non riuscita.", detail: message.slice(0, 220) }, 502, cors);
  }
}
async function runEnhance(request, env, cors) {
  if (!env.IMAGES) return json({ ok: false, error: "Binding Cloudflare Images non configurato." }, 503, cors);
  const limit = await rateLimit(request, env);
  if (!limit.ok) return json({ ok: false, error: limit.response === "limited" ? "Limite temporaneo raggiunto. Attendi un minuto e riprova." : "Controllo del limite temporaneamente non disponibile." }, limit.response === "limited" ? 429 : 503, cors);
  try {
    const contentType = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) return json({ ok: false, error: "Formato non supportato. Usa JPEG, PNG o WebP." }, 415, cors);
    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BYTES) return json({ ok: false, error: "Immagine troppo grande: massimo 20 MB." }, 413, cors);
    const bytes = await request.arrayBuffer();
    if (!bytes.byteLength) return json({ ok: false, error: "File immagine vuoto." }, 400, cors);
    if (bytes.byteLength > MAX_BYTES) return json({ ok: false, error: "Immagine troppo grande: massimo 20 MB." }, 413, cors);
    const imageStream = () => new Blob([bytes], { type: contentType }).stream();
    const info = await env.IMAGES.info(imageStream());
    const width = Number(info?.width), height = Number(info?.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) return json({ ok: false, error: "Impossibile leggere le dimensioni della foto." }, 422, cors);
    if (width * height > 40_000_000) return json({ ok: false, error: "Foto troppo grande da elaborare in sicurezza (massimo 40 megapixel in ingresso)." }, 413, cors);
    let aiWidth = width, aiHeight = height, aiInput = imageStream;
    if (width > 2000 || height > 2000) {
      const scale = Math.min(1, 2000 / width, 2000 / height);
      aiWidth = Math.max(1, Math.round(width * scale));
      aiHeight = Math.max(1, Math.round(height * scale));
      const prepared = await env.IMAGES.input(imageStream()).transform({ width: aiWidth, height: aiHeight, fit: "scale-down" }).output({ format: "image/jpeg", quality: 95 });
      const preparedResponse = await prepared.response();
      if (!preparedResponse.ok) throw new Error("Preparazione della foto prima dell'upscaling AI non riuscita.");
      const preparedBytes = await preparedResponse.arrayBuffer();
      aiInput = () => new Blob([preparedBytes], { type: "image/jpeg" }).stream();
    }
    const outWidth = aiWidth * 2, outHeight = aiHeight * 2;
    if (outWidth <= width || outHeight <= height) return json({ ok: false, error: "Questa foto è già troppo grande per ottenere un risultato AI 2× più grande." }, 413, cors);
    if (outWidth > 8192 || outHeight > 8192 || outWidth * outHeight > 80_000_000) return json({ ok: false, error: "Dimensioni di uscita non supportate per l'ingrandimento AI." }, 413, cors);
    const result = await env.IMAGES.input(aiInput()).transform({ width: outWidth, height: outHeight, fit: { mode: "contain", upscale: "generate" } }).output({ format: "image/jpeg", quality: 92 });
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
    if (isQuotaError(message)) return json({ ok: false, error: "Limite gratuito Cloudflare raggiunto. Nessun servizio a pagamento verrà attivato." }, 429, cors);
    console.error("PIXORA /enhance failed:", error);
    return json({ ok: false, error: "Elaborazione AI non riuscita.", detail: message.slice(0, 180) }, 502, cors);
  }
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
        version: "0.11.0",
        imageBinding: Boolean(env.IMAGES),
        aiBinding: Boolean(env.AI),
        rateLimiter: Boolean(env.RL),
        editModel: MODEL,
        enhanceEngine: "Cloudflare Images ESRGAN",
        editInferenceAvailable: Boolean(env.AI)
      }, 200, cors);
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: "Origine non autorizzata." }, 403, cors);
    if (url.pathname === "/edit" && request.method === "POST") return runEdit(request, env, cors);
    if (url.pathname === "/enhance" && request.method === "POST") return runEnhance(request, env, cors);
    return new Response("PIXORA AI CORE is online. Use GET /health, POST /enhance or POST /edit.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", ...cors }
    });
  }
};
