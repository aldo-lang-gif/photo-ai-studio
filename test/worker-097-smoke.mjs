import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const origin = 'https://aldo-lang-gif.github.io';
const env = {
  RL: { limit: async () => ({ success: true }) },
  IMAGES: {
    info: async bytes => ({ width: 1200, height: 800, byteLength: bytes.byteLength }),
    input: bytes => ({
      transform(options) { globalThis.__transformOptions = options; return this; },
      output(options) { globalThis.__outputOptions = options; return this; },
      response: async options => new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg', ...options.headers }
      })
    })
  }
};

let response = await worker.fetch(new Request('https://worker.test/health'), env);
assert.equal(response.status, 200);
assert.equal((await response.json()).imageBinding, true);

response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'image/jpeg' }, body: new Uint8Array([9, 8, 7])
}), env);
assert.equal(response.status, 200);
assert.equal(response.headers.get('X-Pixora-AI-Engine'), 'Cloudflare-Images-ESRGAN');
assert.equal(response.headers.get('X-Pixora-Output-Width'), '2400');
assert.equal(globalThis.__transformOptions.fit.upscale, 'generate');
assert.equal(globalThis.__outputOptions.format, 'image/jpeg');
assert.equal(globalThis.__transformOptions.fit.upscale, 'generate');

response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'image/avif' }, body: 'nope'
}), env);
assert.equal(response.status, 415);

response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'image/jpeg' }, body: new Uint8Array([1])
}), env);
assert.equal(response.status, 403);

response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'image/jpeg' }, body: new Uint8Array([1])
}), { RL: env.RL });
assert.equal(response.status, 503);
console.log('PIXORA AI 0.9.7 Worker smoke tests passed.');

// A provider quota error must stop cleanly without suggesting paid fallback.
const quotaEnv = {
  RL: env.RL,
  IMAGES: {
    info: async () => ({ width: 100, height: 100 }),
    input: () => ({
      transform() { return this; },
      output() { return this; },
      response: async () => { throw new Error('Cloudflare Images error 9422: usage limit reached'); }
    })
  }
};
response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'image/jpeg' }, body: new Uint8Array([1, 2, 3])
}), quotaEnv);
assert.equal(response.status, 429);
assert.match((await response.json()).error, /servizio a pagamento/i);
console.log('PIXORA AI 0.9.7 quota guard passed.');
