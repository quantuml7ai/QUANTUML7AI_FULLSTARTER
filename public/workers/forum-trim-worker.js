/* eslint-disable no-restricted-globals */
let ffmpeg = null;
let fetchFile = null;
let loaded = false;

const FFMPEG_UMD_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js";
const FFMPEG_UTIL_UMD_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/umd/index.js";
const FFMPEG_CORE_JS = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js";
const FFMPEG_CORE_WASM = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm";

function toSec(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function extFromMime(mime) {
  const s = String(mime || "").toLowerCase();
  if (s.includes("webm")) return "webm";
  if (s.includes("quicktime")) return "mov";
  if (s.includes("mp4")) return "mp4";
  return "mp4";
}

async function ensureFfmpeg() {
  if (loaded && ffmpeg && fetchFile) return;
  if (!self.FFmpegWASM || !self.FFmpegUtil) {
    importScripts(FFMPEG_UMD_URL, FFMPEG_UTIL_UMD_URL);
  }
  const FF = self.FFmpegWASM?.FFmpeg;
  fetchFile = self.FFmpegUtil?.fetchFile;
  if (!FF || !fetchFile) throw new Error("trim_worker_ffmpeg_not_available");
  ffmpeg = new FF();
  ffmpeg.on("progress", ({ progress }) => {
    const p = Math.max(0, Math.min(1, Number(progress || 0)));
    try { self.postMessage({ type: "progress", progress: p }); } catch {}
  });
  await ffmpeg.load({
    coreURL: FFMPEG_CORE_JS,
    wasmURL: FFMPEG_CORE_WASM,
  });
  loaded = true;
}

async function execTrimJob(payload) {
  await ensureFfmpeg();
  const blob = payload?.blob;
  if (!blob) throw new Error("trim_worker_bad_blob");

  const startSec = toSec(payload?.startSec);
  const durationSec = Math.max(1, toSec(payload?.durationSec || 120));
  const sourceMime = String(payload?.sourceMime || "video/mp4");
  const sourceExt = extFromMime(payload?.sourceExt || sourceMime);
  const outExt = "mp4";
  const outMime = "video/mp4";

  const inName = `in.${sourceExt}`;
  const outName = `out.${outExt}`;

  try {
    const bytes = await fetchFile(blob);
    await ffmpeg.writeFile(inName, bytes);
    try { self.postMessage({ type: "progress", progress: 0.04 }); } catch {}

    const trimArgs = [
      "-ss", startSec.toFixed(3),
      "-i", inName,
      "-t", durationSec.toFixed(3),
      "-map", "0:v:0",
      "-map", "0:a?",
      "-fflags", "+genpts",
      "-avoid_negative_ts", "make_zero",
      "-vf", "fps=24,scale='if(gt(iw,1080),1080,iw)':-2",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-profile:v", "high",
      "-level", "4.1",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "128k",
      outName,
    ];
    await ffmpeg.exec(trimArgs);

    const data = await ffmpeg.readFile(outName);
    const arr = data?.buffer ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : null;
    if (!arr || !arr.byteLength) throw new Error("trim_worker_empty");
    try { await ffmpeg.deleteFile(outName); } catch {}
    try { await ffmpeg.deleteFile(inName); } catch {}
    return { buffer: arr, mime: outMime };
  } catch (e) {
    try { await ffmpeg.deleteFile(inName); } catch {}
    try { await ffmpeg.deleteFile(outName); } catch {}
    throw e;
  }
}

async function execFastStartJob(payload) {
  await ensureFfmpeg();
  const blob = payload?.blob;
  if (!blob) throw new Error("faststart_worker_bad_blob");

  const sourceMime = String(payload?.sourceMime || "video/mp4");
  const sourceExt = extFromMime(payload?.sourceExt || sourceMime);
  const inName = `fast_in.${sourceExt}`;
  const outName = "fast_out.mp4";

  try {
    const bytes = await fetchFile(blob);
    await ffmpeg.writeFile(inName, bytes);
    try { self.postMessage({ type: "progress", progress: 0.05 }); } catch {}

    let copyDone = false;
    try {
      const args = [
        "-i", inName,
        "-map", "0",
        "-c", "copy",
        "-movflags", "+faststart",
        "-f", "mp4",
        outName,
      ];
      await ffmpeg.exec(args);
      copyDone = true;
    } catch {
      copyDone = false;
    }
    if (!copyDone) {
      try { await ffmpeg.deleteFile(outName); } catch {}
      const transcodeArgs = [
        "-i", inName,
        "-map", "0:v:0",
        "-map", "0:a?",
        "-vf", "fps=24,scale='if(gt(iw,1080),1080,iw)':-2",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-profile:v", "high",
        "-level", "4.1",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac",
        "-b:a", "128k",
        "-f", "mp4",
        outName,
      ];
      await ffmpeg.exec(transcodeArgs);
    }

    const data = await ffmpeg.readFile(outName);
    const arr = data?.buffer ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : null;
    if (!arr || !arr.byteLength) throw new Error("faststart_worker_empty");
    try { await ffmpeg.deleteFile(outName); } catch {}
    try { await ffmpeg.deleteFile(inName); } catch {}
    return { buffer: arr, mime: "video/mp4" };
  } catch (e) {
    try { await ffmpeg.deleteFile(inName); } catch {}
    try { await ffmpeg.deleteFile(outName); } catch {}
    throw e;
  }
}

self.onmessage = async (event) => {
  const msg = event?.data || {};
  if (msg?.type !== "trim" && msg?.type !== "faststart") return;
  try {
    const res = msg?.type === "faststart"
      ? await execFastStartJob(msg)
      : await execTrimJob(msg);
    self.postMessage(
      { type: "done", ok: true, buffer: res.buffer, mime: res.mime },
      [res.buffer]
    );
  } catch (e) {
    self.postMessage({
      type: "done",
      ok: false,
      error: String(e?.message || "trim_worker_failed"),
    });
  }
};
