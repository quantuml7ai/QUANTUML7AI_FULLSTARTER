import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
function ok(msg) { console.log(`OK   ${msg}`); }
function fail(msg) { console.log(`FAIL ${msg}`); failed = true; }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function read(rel) { return fs.readFileSync(path.join(root, rel), "utf8"); }

console.log("QL7 v68 local ffmpeg assets check");
for (const pkg of ["@ffmpeg/ffmpeg", "@ffmpeg/core"]) {
  const p = path.join(root, "node_modules", ...pkg.split("/"));
  if (fs.existsSync(p)) ok(`${pkg} installed at ${path.relative(root, p)}`);
  else fail(`${pkg} missing - run pnpm install`);
}
if (!fs.existsSync(path.join(root, "node_modules", "@ffmpeg", "util"))) ok("@ffmpeg/util not required by v68");
else ok("@ffmpeg/util may exist transitively, but v68 does not import its UMD runtime");

for (const rel of [
  "public/vendor/ffmpeg/ffmpeg.js",
  "public/vendor/ffmpeg/814.ffmpeg.js",
  "public/workers/814.ffmpeg.js",
  "public/vendor/ffmpeg/ffmpeg-core.js",
  "public/vendor/ffmpeg/ffmpeg-core.wasm",
  "public/vendor/ffmpeg/manifest.json",
]) {
  if (exists(rel)) ok(rel); else fail(rel);
}
if (!exists("public/vendor/ffmpeg/index.js")) ok("no public/vendor/ffmpeg/index.js; v68 avoids @ffmpeg/util UMD exports bug");
else fail("public/vendor/ffmpeg/index.js should not exist in v68");

const worker = read("public/workers/forum-trim-worker.js");
if (/cdn\.jsdelivr|unpkg\.com/.test(worker)) fail("worker still has CDN references"); else ok("worker has no CDN references");
for (const needle of [
  'const FFMPEG_VENDOR_BASE = "/vendor/ffmpeg"',
  'function sameOriginVendorUrl(fileName)',
  'const FFMPEG_UMD_URL = sameOriginVendorUrl("ffmpeg.js")',
  'const FFMPEG_CORE_JS = sameOriginVendorUrl("ffmpeg-core.js")',
  'const FFMPEG_CORE_WASM = sameOriginVendorUrl("ffmpeg-core.wasm")',
  'function installFfmpegUmdWorkerRuntimeBase()',
  'self.__QL7_FFMPEG_RUNTIME_BASE = runtimeBase',
  'baseURI: runtimeBase',
  'function workerFetchFile(input)',
  'importScripts(FFMPEG_UMD_URL)',
]) {
  if (worker.includes(needle)) ok(`worker :: ${needle}`); else fail(`worker missing ${needle}`);
}
if (/FFmpegUtil|index\.js|FFMPEG_UTIL/.test(worker)) fail("worker still imports @ffmpeg/util/index.js"); else ok("worker does not import @ffmpeg/util UMD");
if (/classWorkerURL/.test(worker)) fail("worker still forces classWorkerURL"); else ok("worker does not force classWorkerURL module worker");

const ffmpegJs = exists("public/vendor/ffmpeg/ffmpeg.js") ? read("public/vendor/ffmpeg/ffmpeg.js") : "";
if (ffmpegJs.includes("__QL7_FFMPEG_RUNTIME_BASE")) ok("vendor ffmpeg.js has runtime base guard"); else fail("vendor ffmpeg.js missing runtime base guard");
if (/e\.b=document\.baseURI\|\|self\.location\.href/.test(ffmpegJs)) fail("vendor ffmpeg.js still has unguarded document.baseURI publicPath"); else ok("vendor ffmpeg.js has no unguarded document.baseURI publicPath");

const classText = exists("public/vendor/ffmpeg/814.ffmpeg.js") ? read("public/vendor/ffmpeg/814.ffmpeg.js") : "";
if (/unpkg\.com|cdn\.jsdelivr/.test(classText)) fail("vendor 814.ffmpeg.js still has CDN fallback"); else ok("vendor 814.ffmpeg.js has no CDN fallback");
const compatText = exists("public/workers/814.ffmpeg.js") ? read("public/workers/814.ffmpeg.js") : "";
if (/unpkg\.com|cdn\.jsdelivr/.test(compatText)) fail("compat public/workers/814.ffmpeg.js still has CDN fallback"); else ok("compat public/workers/814.ffmpeg.js has no CDN fallback");

const eslintrc = read(".eslintrc.json");
if (eslintrc.includes('"public/vendor/ffmpeg/**"')) ok("eslint ignores public/vendor/ffmpeg/** through .eslintrc.json"); else fail("eslint ignore for public/vendor/ffmpeg/** missing");
if (eslintrc.includes('"public/workers/814.ffmpeg.js"')) ok("eslint ignores public/workers/814.ffmpeg.js through .eslintrc.json"); else fail("eslint ignore for public/workers/814.ffmpeg.js missing");
if (!exists(".eslintignore")) ok("no standalone .eslintignore created by v68"); else ok("standalone .eslintignore exists from previous work; v68 does not require it");

if (failed) process.exit(1);
console.log("[QL7] v68 local ffmpeg assets check OK");
