const base = String(process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");
let failed = false;
function ok(msg) { console.log(`OK   ${msg}`); }
function fail(msg) { console.log(`FAIL ${msg}`); failed = true; }
async function get(path) {
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  const text = await res.text().catch(() => "");
  return { status: res.status, text };
}
console.log(`QL7 v68 browser smoke ${base}`);
for (const path of [
  "/workers/forum-trim-worker.js",
  "/vendor/ffmpeg/ffmpeg.js",
  "/vendor/ffmpeg/814.ffmpeg.js",
  "/workers/814.ffmpeg.js",
  "/vendor/ffmpeg/ffmpeg-core.js",
  "/vendor/ffmpeg/ffmpeg-core.wasm",
  "/vendor/ffmpeg/manifest.json",
]) {
  const res = await get(path);
  if (res.status === 200) ok(`${path} HTTP 200`); else fail(`${path} HTTP ${res.status}`);
  if (path.endsWith(".js") && /cdn\.jsdelivr|unpkg\.com/.test(res.text)) fail(`${path} still contains CDN reference`);
}
const worker = await get("/workers/forum-trim-worker.js");
if (worker.text.includes("__QL7_FFMPEG_RUNTIME_BASE")) ok("worker sets @ffmpeg UMD runtime base to /vendor/ffmpeg/ffmpeg.js"); else fail("worker missing UMD runtime base");
if (worker.text.includes("workerFetchFile") && !/FFmpegUtil|index\.js/.test(worker.text)) ok("worker bypasses @ffmpeg/util UMD"); else fail("worker still uses @ffmpeg/util UMD");
if (!/classWorkerURL/.test(worker.text)) ok("worker does not force classWorkerURL module worker"); else fail("worker still forces classWorkerURL");
const ffmpeg = await get("/vendor/ffmpeg/ffmpeg.js");
if (ffmpeg.text.includes("__QL7_FFMPEG_RUNTIME_BASE")) ok("ffmpeg.js has runtime base guard"); else fail("ffmpeg.js missing runtime base guard");
const util = await get("/vendor/ffmpeg/index.js");
if (util.status === 404) ok("/vendor/ffmpeg/index.js HTTP 404 expected; v68 does not use @ffmpeg/util UMD"); else fail(`/vendor/ffmpeg/index.js HTTP ${util.status}; should not be used`);
if (failed) process.exit(1);
console.log("[QL7] v68 browser smoke OK");
