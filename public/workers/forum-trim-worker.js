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

function readAscii(bytes, offset, len) {
  let out = "";
  for (let i = 0; i < len; i += 1) out += String.fromCharCode(bytes[offset + i] || 0);
  return out;
}

function readU32(bytes, offset) {
  return (
    ((bytes[offset] || 0) * 16777216) +
    ((bytes[offset + 1] || 0) << 16) +
    ((bytes[offset + 2] || 0) << 8) +
    (bytes[offset + 3] || 0)
  );
}

function hasMp4Atom(bytesLike, atomType) {
  try {
    const bytes = bytesLike instanceof Uint8Array ? bytesLike : new Uint8Array(bytesLike || []);
    const target = String(atomType || "");
    if (!target || bytes.byteLength < 8) return false;
    let offset = 0;
    let guard = 0;
    const limit = bytes.byteLength;
    while (offset + 8 <= limit && guard < 4096) {
      guard += 1;
      let size = readU32(bytes, offset);
      const type = readAscii(bytes, offset + 4, 4);
      let header = 8;
      if (type === target) return true;
      if (size === 1) {
        if (offset + 16 > limit) return false;
        const hi = readU32(bytes, offset + 8);
        const lo = readU32(bytes, offset + 12);
        size = hi * 4294967296 + lo;
        header = 16;
      } else if (size === 0) {
        size = limit - offset;
      }
      if (!Number.isFinite(size) || size < header) return false;
      offset += size;
    }
  } catch {}
  return false;
}

function toArrayBuffer(data) {
  if (data instanceof ArrayBuffer) return data;
  return data?.buffer
    ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    : null;
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
    const fragmentedInput = hasMp4Atom(bytes, "moof");
    await ffmpeg.writeFile(inName, bytes);
    try { self.postMessage({ type: "progress", progress: 0.05 }); } catch {}

    let copyDone = false;
    let outBuffer = null;
    let pipeline = fragmentedInput ? "worker_faststart_fragmented_copy" : "worker_faststart_copy";
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
      const copied = await ffmpeg.readFile(outName);
      if (hasMp4Atom(copied, "moof")) {
        try { await ffmpeg.deleteFile(outName); } catch {}
        copyDone = false;
        pipeline = "worker_faststart_defragment_transcode";
      } else {
        outBuffer = toArrayBuffer(copied);
        copyDone = !!(outBuffer && outBuffer.byteLength);
        pipeline = fragmentedInput ? "worker_faststart_defragment_copy" : "worker_faststart_copy";
      }
    } catch {
      copyDone = false;
    }
    if (!copyDone) {
      try { await ffmpeg.deleteFile(outName); } catch {}
      const transcodeArgs = [
        "-i", inName,
        "-map", "0:v:0",
        "-map", "0:a?",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "16",
        "-profile:v", "high",
        "-level", "4.1",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac",
        "-b:a", "160k",
        "-f", "mp4",
        outName,
      ];
      await ffmpeg.exec(transcodeArgs);
      pipeline = "worker_faststart_defragment_transcode";
    }

    const data = outBuffer ? null : await ffmpeg.readFile(outName);
    const arr = outBuffer || toArrayBuffer(data);
    if (!arr || !arr.byteLength) throw new Error("faststart_worker_empty");
    try { await ffmpeg.deleteFile(outName); } catch {}
    try { await ffmpeg.deleteFile(inName); } catch {}
    return { buffer: arr, mime: "video/mp4", pipeline };
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
      { type: "done", ok: true, buffer: res.buffer, mime: res.mime, pipeline: res.pipeline },
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
