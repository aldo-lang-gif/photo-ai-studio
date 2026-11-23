import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../worker.js", import.meta.url), "utf8");
const { default: worker } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

const origin = "https://aldo-lang-gif.github.io";
let capturedModelForm = null;
let capturedTransform = null;
const env = {
  RL: { limit: async () => ({ success: true }) },
  IMAGES: {
    info: async () => ({ width: 1200, height: 800 }),
    input: () => ({
      transform(options) { capturedTransform = options; return this; },
      output() { return this; },
      response: async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "Content-Type": "image/jpeg" } })
    })
  },
  AI: {
    run: async (model, options) => {
      assert.equal(model, "@cf/black-forest-labs/flux-2-klein-4b");
      assert.ok(options.multipart.body);
      const req = new Response(options.multipart.body, { headers: { "Content-Type": options.multipart.contentType } });
      capturedModelForm = await req.formData();
      return { image: btoa("generated-image-bytes") };
    }
  }
};

let response = await worker.fetch(new Request("https://worker.test/health"), env);
assert.equal(response.status, 200);
const health = await response.json();
assert.equal(health.version, "0.11.0");
assert.equal(health.aiBinding, true);

const form = new FormData();
form.append("image", new Blob([new Uint8Array([4, 5, 6])], { type: "image/jpeg" }), "source.jpg");
form.append("prompt", "Aggiungi un cappellino nero senza cambiare il viso");
response = await worker.fetch(new Request("https://worker.test/edit", {
  method: "POST",
  headers: { Origin: origin },
  body: form
}), env);
assert.equal(response.status, 200);
assert.equal(response.headers.get("X-Pixora-AI-Engine"), "Cloudflare-Workers-AI-FLUX-2-Klein-4B");
assert.equal(response.headers.get("Content-Type"), "image/jpeg");
assert.equal(await response.text(), "generated-image-bytes");
assert.ok(capturedModelForm.get("prompt").includes("cappellino nero"));
assert.ok(capturedModelForm.get("input_image_0") instanceof Blob);
assert.equal(capturedModelForm.get("width"), "1024");
assert.equal(capturedModelForm.get("height"), "688");
assert.equal(capturedTransform.width, 511);
assert.equal(capturedTransform.height, 340);

const invalid = new FormData();
invalid.append("image", new Blob([1], { type: "image/jpeg" }), "x.jpg");
invalid.append("prompt", "x");
response = await worker.fetch(new Request("https://worker.test/edit", { method: "POST", body: invalid }), env);
assert.equal(response.status, 400);

response = await worker.fetch(new Request("https://worker.test/edit", {
  method: "POST",
  headers: { Origin: "https://bad.example" },
  body: new FormData()
}), env);
assert.equal(response.status, 403);

const quotaEnv = { ...env, AI: { run: async () => { throw new Error("Workers AI error 4006: free allocation exhausted"); } } };
const quotaForm = new FormData();
quotaForm.append("image", new Blob([1], { type: "image/jpeg" }), "x.jpg");
quotaForm.append("prompt", "Aggiungi un cappellino");
response = await worker.fetch(new Request("https://worker.test/edit", { method: "POST", body: quotaForm }), quotaEnv);
assert.equal(response.status, 429);
assert.match((await response.json()).error, /Nessun modello alternativo a pagamento/);

console.log("PIXORA AI 0.11.0 Worker smoke tests passed.");
