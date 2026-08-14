import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
function ok(msg) { console.log(`OK   ${msg}`); }
function fail(msg) { console.log(`FAIL ${msg}`); failed = true; }
function read(rel) { return fs.readFileSync(path.join(root, rel), "utf8"); }
function has(rel, needle) {
  const text = read(rel);
  if (text.includes(needle)) ok(`${rel} :: ${needle}`); else fail(`${rel} missing ${needle}`);
}
function notHas(rel, rx, msg) {
  const text = read(rel);
  if (rx.test(text)) fail(`${rel} ${msg}`); else ok(`${rel} ${msg.replace(/^has /, "has no ")}`);
}

console.log("QL7 v68 premium local browser-worker strict flat faststart check");
const pkg = JSON.parse(read("package.json"));
if (pkg.dependencies?.["@ffmpeg/ffmpeg"] === "0.12.15") ok("package @ffmpeg/ffmpeg@0.12.15"); else fail("package @ffmpeg/ffmpeg@0.12.15 missing");
if (pkg.dependencies?.["@ffmpeg/core"] === "0.12.10") ok("package @ffmpeg/core@0.12.10"); else fail("package @ffmpeg/core@0.12.10 missing");
if (!pkg.dependencies?.["@ffmpeg/util"]) ok("package does not require @ffmpeg/util in v68"); else fail("@ffmpeg/util should not be a direct dependency in v68");
for (const [script, file] of [
  ["ql7:ffmpeg:vendor", "tools/ql7-install-local-ffmpeg-v68.mjs"],
  ["ql7:ffmpeg:assets:check", "tools/ql7-ffmpeg-assets-check-v68.mjs"],
  ["ql7:faststart:check", "tools/ql7-faststart-local-v68-check.mjs"],
]) {
  if (String(pkg.scripts?.[script] || "").includes(file)) ok(`package script ${script} v68`); else fail(`package script ${script} v68 missing`);
}

const worker = "public/workers/forum-trim-worker.js";
for (const needle of [
  'const FFMPEG_VENDOR_BASE = "/vendor/ffmpeg"',
  'function sameOriginVendorUrl(fileName)',
  'const FFMPEG_UMD_URL = sameOriginVendorUrl("ffmpeg.js")',
  'self.__QL7_FFMPEG_RUNTIME_BASE = runtimeBase',
  'baseURI: runtimeBase',
  'function workerFetchFile(input)',
  'importScripts(FFMPEG_UMD_URL)',
  'auditMp4Atoms',
  'already_flat_faststart',
  'worker_local_flat_faststart_remux_defragment_copy',
  'worker_local_flat_faststart_remux_copy',
  'faststart_output_not_flat',
  '"-map", "0:v:0"',
  '"-map", "0:a?"',
  '"-dn"',
  '"-sn"',
  '"-map_chapters", "-1"',
  '"-c", "copy"',
  '"-avoid_negative_ts", "make_zero"',
]) has(worker, needle);
notHas(worker, /cdn\.jsdelivr|unpkg\.com/, "has CDN");
notHas(worker, /FFmpegUtil|FFMPEG_UTIL|index\.js/, "has @ffmpeg/util UMD exports bug");
notHas(worker, /classWorkerURL/, "has forced module classWorkerURL");
if (/async function execFastStartJob[\s\S]*?self\.onmessage/.test(read(worker)) && /async function execFastStartJob[\s\S]*?libx264[\s\S]*?self\.onmessage/.test(read(worker))) fail(`${worker} has faststart transcode fallback`); else ok(`${worker} has no faststart transcode fallback`);

const lib = "lib/forumVideoTrim.js";
for (const needle of [
  'const WORKER_FASTSTART_TIMEOUT_MS = 600000',
  'function pushFastStartDiag',
  'function makeAbortError',
  'function isAbortLike',
  'allowTranscodeForFaststart',
  'strictFlatFaststart',
  'abortFaststartOnSignal',
  'faststart_signal_abort_seen',
  'faststart_worker_done_error',
  'faststart_success',
  'fallback_error',
  'if (strictFlatFaststart) throw new Error(reason)',
]) has(lib, needle);

for (const rel of [
  "app/forum/features/media/hooks/useForumComposerAttachments.js",
  "app/forum/features/media/services/resolveComposerMediaPayload.js",
]) {
  has(rel, "allowTranscode: false");
  has(rel, "strictFlatFaststart: true");
  has(rel, "abortFaststartOnSignal: true");
  has(rel, "mediaCancelRef");
  has(rel, "forum_video_upload_failed");
  notHas(rel, /allowTranscode:\s*true/, "has faststart transcode true");
}
has("app/forum/features/feed/hooks/useForumCreatePostAction.js", "mediaCancelRef");
has("app/forum/ForumRoot.jsx", "mediaCancelRef");
has("app/forum/features/media/hooks/useMediaPipelineController.js", "forum_media_processing");
has("app/forum/features/media/hooks/useMediaPipelineController.js", "clearMediaAbortController");
has("app/forum/features/media/hooks/useVideoCaptureController.js", "pendingVideoBlobMetaRef.current?.clear?.()");
has("app/ads/home.js", "allowTranscode: false");
has("app/ads/home.js", "strictFlatFaststart: true");
notHas("app/ads/home.js", /allowTranscode:\s*true/, "has ads transcode true");
for (const lang of ["en","ru","uk","es","zh","ar","tr"]) {
  has(`components/i18n-dicts/${lang}.js`, '"forum_media_processing"');
}


const forumRootText = read("app/forum/ForumRoot.jsx");
const runtimeCallPos = forumRootText.indexOf("} = useForumComposerRuntime(");
if (runtimeCallPos >= 0) {
  const runtimeBlockStart = forumRootText.lastIndexOf("const {", runtimeCallPos);
  const runtimeBlock = runtimeBlockStart >= 0 ? forumRootText.slice(runtimeBlockStart, runtimeCallPos) : "";
  const mediaCancelRefCount = (runtimeBlock.match(/\bmediaCancelRef\b/g) || []).length;
  if (mediaCancelRefCount === 1) ok("app/forum/ForumRoot.jsx has single mediaCancelRef destructure");
  else fail(`app/forum/ForumRoot.jsx has duplicate mediaCancelRef destructure count=${mediaCancelRefCount}`);
} else {
  fail("app/forum/ForumRoot.jsx useForumComposerRuntime destructure not found");
}

for (const rel of [
  "tools/ql7-install-local-ffmpeg-v68.mjs",
  "tools/ql7-ffmpeg-assets-check-v68.mjs",
  "tools/ql7-faststart-local-v68-check.mjs",
  "tools/ql7-faststart-browser-smoke-v68.mjs",
  "tools/ql7-mp4-atom-audit.mjs",
]) {
  if (fs.existsSync(path.join(root, rel))) ok(rel); else fail(`${rel} missing`);
}

if (failed) process.exit(1);
console.log("[QL7] v68 strict flat faststart check OK");
