import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();

function pkgRoot(pkg) {
  const direct = path.join(root, "node_modules", ...pkg.split("/"));
  if (fs.existsSync(direct)) return direct;
  try {
    const entry = require.resolve(pkg, { paths: [root] });
    let cur = path.dirname(entry);
    while (cur && cur !== path.dirname(cur)) {
      if (fs.existsSync(path.join(cur, "package.json"))) return cur;
      cur = path.dirname(cur);
    }
  } catch {}
  throw new Error(`[QL7] package not found: ${pkg}. Run pnpm install first.`);
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function copy(src, dst) {
  if (!fs.existsSync(src)) throw new Error(`[QL7] missing source asset: ${src}`);
  ensureDir(dst);
  fs.copyFileSync(src, dst);
  const size = fs.statSync(dst).size;
  console.log(`[QL7] copied ${path.relative(root, src)} -> ${path.relative(root, dst)} (${size} bytes)`);
}

function patchText(file, patches) {
  let text = fs.readFileSync(file, "utf8");
  for (const patch of patches) {
    const before = text;
    if (patch.type === "replace") text = text.replace(patch.search, patch.value);
    if (patch.type === "regex") text = text.replace(patch.search, patch.value);
    if (text === before && patch.required) {
      throw new Error(`[QL7] required patch did not match ${path.relative(root, file)} :: ${patch.name || patch.search}`);
    }
  }
  fs.writeFileSync(file, text);
}

const ffmpegRoot = pkgRoot("@ffmpeg/ffmpeg");
const coreRoot = pkgRoot("@ffmpeg/core");

const vendorDir = path.join(root, "public", "vendor", "ffmpeg");
const workersDir = path.join(root, "public", "workers");
fs.mkdirSync(vendorDir, { recursive: true });
fs.mkdirSync(workersDir, { recursive: true });

const ffmpegJs = path.join(vendorDir, "ffmpeg.js");
const classWorkerVendor = path.join(vendorDir, "814.ffmpeg.js");
const classWorkerCompat = path.join(workersDir, "814.ffmpeg.js");

copy(path.join(ffmpegRoot, "dist", "umd", "ffmpeg.js"), ffmpegJs);
copy(path.join(ffmpegRoot, "dist", "umd", "814.ffmpeg.js"), classWorkerVendor);
copy(path.join(coreRoot, "dist", "umd", "ffmpeg-core.js"), path.join(vendorDir, "ffmpeg-core.js"));
copy(path.join(coreRoot, "dist", "umd", "ffmpeg-core.wasm"), path.join(vendorDir, "ffmpeg-core.wasm"));

patchText(ffmpegJs, [
  {
    type: "replace",
    name: "webpack public path worker runtime base",
    search: "e.b=document.baseURI||self.location.href",
    value: "e.b=(typeof self!==\"undefined\"&&self.__QL7_FFMPEG_RUNTIME_BASE)||((typeof document!==\"undefined\"&&document.baseURI)||self.location.href)",
    required: true,
  },
]);
console.log("[QL7] patched public/vendor/ffmpeg/ffmpeg.js worker runtime base guard");

const classPatches = [
  {
    type: "regex",
    name: "replace @ffmpeg/core CDN fallback",
    search: /https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net\/npm)\/@ffmpeg\/core@[^"']+\/dist\/umd\/ffmpeg-core\.js/g,
    value: "/vendor/ffmpeg/ffmpeg-core.js",
    required: false,
  },
  {
    type: "regex",
    name: "replace ffmpeg-core relative fallback",
    search: /new URL\(["']ffmpeg-core\.js["'],\s*self\.location\)/g,
    value: 'new URL("/vendor/ffmpeg/ffmpeg-core.js", self.location)',
    required: false,
  },
];
patchText(classWorkerVendor, classPatches);
fs.copyFileSync(classWorkerVendor, classWorkerCompat);
console.log("[QL7] patched public/vendor/ffmpeg/814.ffmpeg.js CDN fallback to local core");
console.log("[QL7] copied compatibility chunk public/workers/814.ffmpeg.js for @ffmpeg UMD dynamic import");

const staleUtil = path.join(vendorDir, "index.js");
if (fs.existsSync(staleUtil)) {
  fs.rmSync(staleUtil, { force: true });
  console.log("[QL7] removed stale public/vendor/ffmpeg/index.js; v68 uses workerFetchFile instead of @ffmpeg/util UMD");
}

fs.writeFileSync(path.join(vendorDir, "manifest.json"), JSON.stringify({
  ql7: "local-ffmpeg-v68",
  ffmpeg: "@ffmpeg/ffmpeg@0.12.15",
  core: "@ffmpeg/core@0.12.10",
  util: "not-used",
  runtimeBase: "/vendor/ffmpeg/ffmpeg.js",
  classWorkerVendor: "/vendor/ffmpeg/814.ffmpeg.js",
  classWorkerCompat: "/workers/814.ffmpeg.js",
  generatedAt: new Date().toISOString(),
}, null, 2));

console.log("[QL7] v68 local ffmpeg wasm vendor assets are ready.");
