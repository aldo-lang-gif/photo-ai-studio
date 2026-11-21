import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const { default: worker } = await import(
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
);
const origin = 'https://aldo-lang-gif.github.io';
globalThis.__imageInfo = { width: 1200, height: 800 };
globalThis.__transformCalls = [];
globalThis.__throwOnFinalResponse = false;

const env = {
  RL: { limit: async () => ({ success: true }) },
  IMAGES: {
    info: async () => globalThis.__imageInfo,
    input: () => ({
      transform(options) {
        globalThis.__transformCalls.push(options);
        return this;
      },
      output(options) {
        globalThis.__lastOutputOptions = options;
        return this;
      },
      response: async options => {
        if (globalThis.__throwOnFinalResponse && options?.headers?.['X-Pixora-AI-Engine']) {
          throw new Error('Cloudflare Images error 9422: usage limit reached');
        }
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg', ...(options?.headers || {}) }
        });
      }
    })
  }
};

let response = await worker.fetch(new Request('https://worker.test/health'), env);
assert.equal(response.status, 200);
const health = await response.json();
assert.equal(health.imageBinding, true);
assert.equal(health.version, '0.9.9');

globalThis.__transformCalls = [];
response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'image/jpeg' },
  body: new Uint8Array([9, 8, 7])
}), env);
assert.equal(response.status, 200);
assert.equal(response.headers.get('X-Pixora-AI-Engine'), 'Cloudflare-Images-ESRGAN');
assert.equal(response.headers.get('X-Pixora-Output-Width'), '2400');
assert.equal(globalThis.__transformCalls.length, 1);
assert.equal(globalThis.__transformCalls[0].fit.upscale, 'generate');

globalThis.__imageInfo = { width: 2440, height: 2352 };
globalThis.__transformCalls = [];
response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'image/jpeg' },
  body: new Uint8Array([9, 8, 7])
}), env);
assert.equal(response.status, 200);
assert.equal(response.headers.get('X-Pixora-Output-Width'), '4000');
assert.equal(response.headers.get('X-Pixora-Output-Height'), '3856');
assert.equal(globalThis.__transformCalls.length, 2);
assert.equal(globalThis.__transformCalls[0].width, 2000);
assert.equal(globalThis.__transformCalls[0].height, 1928);
assert.equal(globalThis.__transformCalls[0].fit, 'scale-down');
assert.equal(globalThis.__transformCalls[1].fit.upscale, 'generate');

response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'image/avif' },
  body: 'nope'
}), env);
assert.equal(response.status, 415);

response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST',
  headers: { Origin: 'https://evil.example', 'Content-Type': 'image/jpeg' },
  body: new Uint8Array([1])
}), env);
assert.equal(response.status, 403);

response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'image/jpeg' },
  body: new Uint8Array([1])
}), { RL: env.RL });
assert.equal(response.status, 503);

globalThis.__imageInfo = { width: 100, height: 100 };
globalThis.__throwOnFinalResponse = true;
response = await worker.fetch(new Request('https://worker.test/enhance', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'image/jpeg' },
  body: new Uint8Array([1, 2, 3])
}), env);
assert.equal(response.status, 429);
assert.match((await response.json()).error, /quota gratuita/i);
console.log('PIXORA AI 0.9.9 Worker smoke tests passed.');
