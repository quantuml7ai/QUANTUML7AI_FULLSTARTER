/* eslint-disable no-restricted-globals */
let ffmpeg = null;
let loaded = false;

const FFMPEG_VENDOR_BASE = "/vendor/ffmpeg";

function sameOriginVendorUrl(fileName) {
  const base = String(FFMPEG_VENDOR_BASE || "/vendor/ffmpeg").replace(/\/+$/, "");
  const name = String(fileName || "").replace(/^\/+/, "");
  const path = `${base}/${name}`;
  try {
    const origin = self?.location?.origin;
    if (origin) return new URL(path, origin).href;
  } catch {}
  return path;
}

const FFMPEG_UMD_URL = sameOriginVendorUrl("ffmpeg.js");
const FFMPEG_CORE_JS = sameOriginVendorUrl("ffmpeg-core.js");
const FFMPEG_CORE_WASM = sameOriginVendorUrl("ffmpeg-core.wasm");

function installFfmpegUmdWorkerRuntimeBase() {
  try {
    if (typeof self === "undefined") return;
    const runtimeBase = String(FFMPEG_UMD_URL || "");
    try { self.__QL7_FFMPEG_RUNTIME_BASE = runtimeBase; } catch {}
    const shim = {
      baseURI: runtimeBase,
      currentScript: { src: runtimeBase },
      getElementsByTagName: () => [],
    };
    if (typeof self.document === "undefined") {
      try {
        Object.defineProperty(self, "document", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: shim,
        });
      } catch {
        self.document = shim;
      }
    } else {
      try { self.document.baseURI = runtimeBase; } catch {}
      try { self.document.currentScript = { src: runtimeBase }; } catch {}
    }
  } catch {}
}

async function workerFetchFile(input) {
  if (!input) return new Uint8Array();
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (input?.buffer instanceof ArrayBuffer && typeof input.byteOffset === "number" && typeof input.byteLength === "number") {
    return new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
  }
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return new Uint8Array(await input.arrayBuffer());
  }
  if (typeof URL !== "undefined" && input instanceof URL) {
    const res = await fetch(input);
    return new Uint8Array(await res.arrayBuffer());
  }
  if (typeof input === "string") {
    if (/^data:/i.test(input)) {
      const comma = input.indexOf(",");
      const meta = input.slice(0, comma);
      const data = input.slice(comma + 1);
      if (/;base64/i.test(meta)) {
        const bin = atob(data);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
        return out;
      }
      return new TextEncoder().encode(decodeURIComponent(data));
    }
    const res = await fetch(input);
    return new Uint8Array(await res.arrayBuffer());
  }
  return new Uint8Array();
}

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

function toArrayBuffer(data) {
  if (data instanceof ArrayBuffer) return data;
  return data?.buffer
    ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    : null;
}

function auditMp4Atoms(bytesLike) {
  const bytes = bytesLike instanceof Uint8Array ? bytesLike : new Uint8Array(bytesLike || []);
  const out = {
    bytes: bytes.byteLength,
    moovOffset: -1,
    firstMdatOffset: -1,
    moofCount: 0,
    mdatCount: 0,
    fragmented: false,
    faststart: false,
    flatFaststart: false,
  };
  if (bytes.byteLength < 8) return out;
  let offset = 0;
  let guard = 0;
  const limit = bytes.byteLength;
  while (offset + 8 <= limit && guard < 200000) {
    guard += 1;
    let size = readU32(bytes, offset);
    const type = readAscii(bytes, offset + 4, 4);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > limit) break;
      const hi = readU32(bytes, offset + 8);
      const lo = readU32(bytes, offset + 12);
      size = hi * 4294967296 + lo;
      header = 16;
    } else if (size === 0) {
      size = limit - offset;
    }
    if (type === "moov" && out.moovOffset < 0) out.moovOffset = offset;
    if (type === "mdat") {
      out.mdatCount += 1;
      if (out.firstMdatOffset < 0) out.firstMdatOffset = offset;
    }
    if (type === "moof") out.moofCount += 1;
    if (!Number.isFinite(size) || size < header) break;
    offset += size;
  }
  out.fragmented = out.moofCount > 0;
  out.faststart = out.moovOffset >= 0 && out.firstMdatOffset >= 0 && out.moovOffset < out.firstMdatOffset;
  out.flatFaststart = out.faststart && !out.fragmented && out.moofCount === 0;
  return out;
}

function postProgress(progress, stage) {
  try { self.postMessage({ type: "progress", progress, stage }); } catch {}
}

async function ensureFfmpeg() {
  if (loaded && ffmpeg) return;
  installFfmpegUmdWorkerRuntimeBase();
  if (!self.FFmpegWASM) {
    importScripts(FFMPEG_UMD_URL);
  }
  const FF = self.FFmpegWASM?.FFmpeg;
  if (!FF) throw new Error("trim_worker_ffmpeg_not_available");
  ffmpeg = new FF();
  ffmpeg.on("progress", ({ progress }) => {
    const p = Math.max(0, Math.min(1, Number(progress || 0)));
    postProgress(0.12 + (p * 0.78), "ffmpeg_exec");
  });
  postProgress(0.02, "ffmpeg_runtime_loading");
  await ffmpeg.load({
    coreURL: FFMPEG_CORE_JS,
    wasmURL: FFMPEG_CORE_WASM,
  });
  loaded = true;
  postProgress(0.08, "ffmpeg_runtime_ready");
}

async function execTrimJob(payload) {
  await ensureFfmpeg();
  const blob = payload?.blob;
  if (!blob) throw new Error("trim_worker_bad_blob");

  const startSec = toSec(payload?.startSec);
  const durationSec = Math.max(1, toSec(payload?.durationSec || 120));
  const sourceMime = String(payload?.sourceMime || "video/mp4");
  const sourceExt = extFromMime(payload?.sourceExt || sourceMime);
  const outMime = "video/mp4";
  const inName = `in.${sourceExt}`;
  const outName = "out.mp4";

  try {
    const bytes = await workerFetchFile(blob);
    await ffmpeg.writeFile(inName, bytes);
    postProgress(0.04, "trim_input_written");

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
    const arr = toArrayBuffer(data);
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

async function runCopyRemux(inName, outName, attempt) {
  const baseArgs = [
    "-i", inName,
    "-map", "0:v:0",
    "-map", "0:a?",
    "-dn",
    "-sn",
    "-map_chapters", "-1",
    "-c", "copy",
    "-movflags", "+faststart",
    "-avoid_negative_ts", "make_zero",
    "-f", "mp4",
    outName,
  ];
  const args = attempt === 2
    ? ["-fflags", "+genpts", ...baseArgs]
    : baseArgs;
  await ffmpeg.exec(args);
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
    postProgress(0.09, "faststart_reading_input");
    const bytes = await workerFetchFile(blob);
    const inputAudit = auditMp4Atoms(bytes);
    if (inputAudit.flatFaststart) {
      const arr = toArrayBuffer(bytes);
      if (!arr || !arr.byteLength) throw new Error("faststart_worker_empty");
      postProgress(1, "already_flat_faststart");
      return { buffer: arr, mime: "video/mp4", pipeline: "already_flat_faststart", audit: inputAudit };
    }

    await ffmpeg.writeFile(inName, bytes);
    postProgress(0.12, "faststart_input_written");

    let lastError = null;
    for (const attempt of [1, 2]) {
      try {
        try { await ffmpeg.deleteFile(outName); } catch {}
        await runCopyRemux(inName, outName, attempt);
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;

    const data = await ffmpeg.readFile(outName);
    const outputAudit = auditMp4Atoms(data);
    if (!outputAudit.flatFaststart) {
      const err = new Error("faststart_output_not_flat");
      err.audit = outputAudit;
      throw err;
    }
    const arr = toArrayBuffer(data);
    if (!arr || !arr.byteLength) throw new Error("faststart_worker_empty");
    try { await ffmpeg.deleteFile(outName); } catch {}
    try { await ffmpeg.deleteFile(inName); } catch {}
    postProgress(1, "faststart_done");
    return {
      buffer: arr,
      mime: "video/mp4",
      pipeline: inputAudit.fragmented
        ? "worker_local_flat_faststart_remux_defragment_copy"
        : "worker_local_flat_faststart_remux_copy",
      audit: outputAudit,
    };
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
      { type: "done", ok: true, buffer: res.buffer, mime: res.mime, pipeline: res.pipeline, audit: res.audit },
      [res.buffer]
    );
  } catch (e) {
    self.postMessage({
      type: "done",
      ok: false,
      error: String(e?.message || e || "trim_worker_failed"),
      audit: e?.audit || null,
    });
  }
};
