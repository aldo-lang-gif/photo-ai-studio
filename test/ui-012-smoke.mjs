import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const s=await readFile(new URL("../scripts/prepare-android-012.js",import.meta.url),"utf8");
assert.ok(s.includes('preview.insertAdjacentElement("afterend",panel)'));
assert.ok(s.includes("window.pixoraApplyEnhancedBlob(blob)"));
assert.ok(s.includes('edit.onclick=()=>run("edit")'));
assert.ok(s.includes('up.onclick=()=>run("enhance")'));
assert.ok(s.includes("#save,#saveGallery,#saveProjectVersion"));
console.log("PIXORA AI 0.12.0 UI patch checks passed.");
