const NOOP = () => {};
const WORKER_TRIM_TIMEOUT_MS = 240000;
const WORKER_FASTSTART_TIMEOUT_MS = 180000;
const FASTSTART_TRANSCODE_MAX_BYTES = 96 * 1024 * 1024;

function toExtFromMime(mime = "") {
  const m = String(mime || "").toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("quicktime")) return "mov";
  if (m.includes("mp4")) return "mp4";
  return "mp4";
}

function clampNum(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function pickRecorderMime(preferredMime = "") {
  const cand = [
    preferredMime,
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ].filter(Boolean);
  for (const mime of cand) {
    try {
      if (!MediaRecorder?.isTypeSupported || MediaRecorder.isTypeSupported(mime)) return mime;
    } catch {}
  }
  return "";
}

function readBlobDuration(blob, timeoutMs = 22000) {
  if (typeof document === "undefined") return Promise.resolve(NaN);
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    const src = URL.createObjectURL(blob);
    let done = false;
    const finish = (err, dur) => {
      if (done) return;
      done = true;
      try { clearTimeout(tid); } catch {}
      try { v.pause?.(); } catch {}
      try { v.removeAttribute("src"); } catch {}
      try { v.load?.(); } catch {}
      try { URL.revokeObjectURL(src); } catch {}
      if (err) reject(err);
      else resolve(dur);
    };
    const tryRead = () => {
      let d = Number(v.duration || 0);
      if ((!Number.isFinite(d) || d <= 0 || d === Number.POSITIVE_INFINITY) && v.seekable?.length > 0) {
        try {
          const tail = Number(v.seekable.end(v.seekable.length - 1) || 0);
          if (Number.isFinite(tail) && tail > 0) d = tail;
        } catch {}
      }
      if (Number.isFinite(d) && d > 0 && d < Number.POSITIVE_INFINITY) {
        finish(null, d);
        return true;
      }
      return false;
    };
    const onMeta = () => {
      if (!tryRead()) {
        try { v.currentTime = 0.001; } catch {}
      }
    };
    const onErr = () => {
      if (!tryRead()) finish(new Error("video_metadata_error"));
    };
    const tid = setTimeout(() => {
      if (!tryRead()) finish(new Error("video_metadata_timeout"));
    }, Math.max(1000, Number(timeoutMs || 0)));
    v.preload = "auto";
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.addEventListener("loadedmetadata", onMeta, { once: true });
    v.addEventListener("loadeddata", onMeta, { once: true });
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("error", onErr, { once: true });
    v.src = src;
    try { v.load?.(); } catch {}
  });
}

function seekTo(video, timeSec) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { clearTimeout(tid); } catch {}
      try { video.removeEventListener("seeked", onSeeked); } catch {}
      resolve();
    };
    const onSeeked = () => finish();
    const tid = setTimeout(finish, 1800);
    try { video.addEventListener("seeked", onSeeked, { once: true }); } catch {}
    try { video.currentTime = Math.max(0, Number(timeSec || 0)); } catch { finish(); }
    try {
      const cur = Number(video.currentTime || 0);
      if (Math.abs(cur - Number(timeSec || 0)) < 0.05) finish();
    } catch {}
  });
}

function waitFrame(video, timeoutMs = 280) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { clearTimeout(tid); } catch {}
      resolve();
    };
    const tid = setTimeout(finish, Math.max(80, Number(timeoutMs || 0)));
    try {
      if (video && typeof video.requestVideoFrameCallback === "function") {
        video.requestVideoFrameCallback(() => finish());
        return;
      }
    } catch {}
    try { requestAnimationFrame(() => finish()); } catch { finish(); }
  });
}

function makeCoverRect(srcW, srcH, dstW, dstH) {
  const vw = Math.max(1, Number(srcW || 1));
  const vh = Math.max(1, Number(srcH || 1));
  const cw = Math.max(1, Number(dstW || 1));
  const ch = Math.max(1, Number(dstH || 1));
  const s = Math.max(cw / vw, ch / vh);
  const dw = vw * s;
  const dh = vh * s;
  return {
    dx: (cw - dw) / 2,
    dy: (ch - dh) / 2,
    dw,
    dh,
  };
}

export async function buildForumVideoFilmstrip(inputBlob, opts = {}) {
  if (typeof document === "undefined") return [];
  if (!inputBlob) return [];
  const signal = opts?.signal || null;
  const onProgress = typeof opts?.onProgress === "function" ? opts.onProgress : NOOP;
  const width = Math.max(48, Number(opts?.width || 96));
  const height = Math.max(32, Number(opts?.height || 56));
  const quality = clampNum(opts?.quality, 0.4, 0.9);
  const count = Math.max(8, Math.min(20, Number(opts?.count || 12)));
  const durationHint = Number(opts?.durationSec || 0);

  const url = URL.createObjectURL(inputBlob);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  try { video.crossOrigin = "anonymous"; } catch {}
  video.src = url;

  try {
    await new Promise((resolve, reject) => {
      let done = false;
      const finish = (err) => {
        if (done) return;
        done = true;
        try { video.removeEventListener("loadedmetadata", onMeta); } catch {}
        try { video.removeEventListener("loadeddata", onMeta); } catch {}
        try { video.removeEventListener("error", onErr); } catch {}
        if (err) reject(err);
        else resolve();
      };
      const onMeta = () => finish();
      const onErr = () => finish(new Error("trim_thumb_metadata_error"));
      video.addEventListener("loadedmetadata", onMeta, { once: true });
      video.addEventListener("loadeddata", onMeta, { once: true });
      video.addEventListener("error", onErr, { once: true });
      try { video.load?.(); } catch {}
      if (video.readyState >= 2) finish();
    });
  } catch {
    try { video.pause?.(); } catch {}
    try { video.removeAttribute("src"); } catch {}
    try { video.load?.(); } catch {}
    try { URL.revokeObjectURL(url); } catch {}
    return [];
  }

  const total = Math.max(0.1, Number(video.duration || durationHint || 0.1));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    try { video.pause?.(); } catch {}
    try { video.removeAttribute("src"); } catch {}
    try { video.load?.(); } catch {}
    try { URL.revokeObjectURL(url); } catch {}
    return [];
  }

  const out = [];
  let lastFrameDataUrl = "";
  try {
    // Kick decoder once; some engines otherwise keep returning the first frame after seek.
    try { await video.play?.().catch(() => null); } catch {}
    try { video.pause?.(); } catch {}
    for (let i = 0; i < count; i += 1) {
      if (signal?.aborted) return [];
      const ts = count <= 1 ? 0 : ((i / (count - 1)) * Math.max(0.05, total - 0.05));
      try { await seekTo(video, ts); } catch {}
      try { await waitFrame(video, 420); } catch {}
      const vw = Math.max(1, Number(video.videoWidth || 1));
      const vh = Math.max(1, Number(video.videoHeight || 1));
      const r = makeCoverRect(vw, vh, canvas.width, canvas.height);
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#02060f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, r.dx, r.dy, r.dw, r.dh);
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (i > 0 && dataUrl === lastFrameDataUrl && ts < (total - 0.08)) {
          const jitter = Math.min(total - 0.02, ts + Math.max(0.04, total / (count * 5)));
          try { await seekTo(video, jitter); } catch {}
          try { await waitFrame(video, 380); } catch {}
          try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#02060f";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, r.dx, r.dy, r.dw, r.dh);
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          } catch {}
        }
        lastFrameDataUrl = dataUrl || lastFrameDataUrl;
        out.push({ tSec: ts, dataUrl });
      } catch {}
      try { onProgress((i + 1) / count); } catch {}
      await new Promise((r2) => setTimeout(r2, 0));
    }
  } finally {
    try { video.pause?.(); } catch {}
    try { video.removeAttribute("src"); } catch {}
    try { video.load?.(); } catch {}
    try { URL.revokeObjectURL(url); } catch {}
  }
  return out;
}

async function trimViaWorkerFfmpeg(inputBlob, opts = {}) {
  if (typeof Worker === "undefined") throw new Error("trim_worker_unsupported");
  const signal = opts?.signal || null;
  const onProgress = typeof opts?.onProgress === "function" ? opts.onProgress : NOOP;
  const startSec = Math.max(0, Number(opts?.startSec || 0));
  const maxDurationSec = Math.max(1, Number(opts?.maxDurationSec || 120));
  const sourceMime = String(inputBlob?.type || "video/mp4");
  const sourceExt = toExtFromMime(sourceMime);

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = 0;
    const worker = new Worker("/workers/forum-trim-worker.js");
    let abortCleanup = null;
    const finish = (err, val) => {
      if (settled) return;
      settled = true;
      try { if (timeoutId) clearTimeout(timeoutId); } catch {}
      try { abortCleanup?.(); } catch {}
      abortCleanup = null;
      try { worker.terminate(); } catch {}
      if (err) reject(err);
      else resolve(val);
    };

    const onAbort = () => finish(new Error("trim_aborted"));
    if (signal) {
      if (signal.aborted) {
        finish(new Error("trim_aborted"));
        return;
      }
      try {
        signal.addEventListener("abort", onAbort, { once: true });
        abortCleanup = () => {
          try { signal.removeEventListener("abort", onAbort); } catch {}
        };
      } catch {}
    }

    worker.onmessage = (ev) => {
      const msg = ev?.data || {};
      if (msg?.type === "progress") {
        try { onProgress(Math.max(0, Math.min(1, Number(msg.progress || 0)))); } catch {}
        return;
      }
      if (msg?.type === "done") {
        if (!msg.ok) {
          finish(new Error(String(msg.error || "trim_worker_failed")));
          return;
        }
        const buffer = msg?.buffer;
        if (!(buffer instanceof ArrayBuffer) || !buffer.byteLength) {
          finish(new Error("trim_worker_empty"));
          return;
        }
        const outMime = String(msg?.mime || sourceMime || "video/mp4");
        const outBlob = new Blob([buffer], { type: outMime });
        finish(null, outBlob);
      }
    };
    worker.onerror = (e) => {
      finish(new Error(String(e?.message || "trim_worker_error")));
    };

    timeoutId = setTimeout(() => {
      finish(new Error("trim_worker_timeout"));
    }, WORKER_TRIM_TIMEOUT_MS);

    try {
      worker.postMessage({
        type: "trim",
        blob: inputBlob,
        startSec,
        durationSec: maxDurationSec,
        sourceMime,
        sourceExt,
      });
    } catch (e) {
      finish(e || new Error("trim_worker_post_failed"));
    }
  });
}

export async function optimizeForumVideoFastStart(inputBlob, opts = {}) {
  if (!inputBlob || typeof inputBlob !== "object") {
    throw new Error("faststart_bad_blob");
  }
  const sourceMime = String(inputBlob?.type || "video/mp4");
  const sourceExt = toExtFromMime(sourceMime);
  const sourceBytes = Number(inputBlob?.size || 0);
  const allowTranscode = opts?.allowTranscode !== false;
  const maxTranscodeBytes = Math.max(
    8 * 1024 * 1024,
    Number(opts?.maxTranscodeBytes || FASTSTART_TRANSCODE_MAX_BYTES)
  );
  const canFaststartCopy = sourceExt === "mp4" || sourceExt === "mov";
  const canTranscodeToMp4 = allowTranscode && sourceBytes > 0 && sourceBytes <= maxTranscodeBytes;
  if (!canFaststartCopy && !canTranscodeToMp4) {
    return {
      blob: inputBlob,
      mime: sourceMime || "video/webm",
      changed: false,
      pipeline: canTranscodeToMp4 ? "passthrough_non_mp4" : "passthrough_too_large",
    };
  }
  if (typeof Worker === "undefined") {
    return {
      blob: inputBlob,
      mime: sourceMime || "video/mp4",
      changed: false,
      pipeline: "no_worker",
    };
  }

  const signal = opts?.signal || null;
  const onProgress = typeof opts?.onProgress === "function" ? opts.onProgress : NOOP;

  try {
    const outBlob = await new Promise((resolve, reject) => {
      let settled = false;
      let timeoutId = 0;
      const worker = new Worker("/workers/forum-trim-worker.js");
      let abortCleanup = null;
      const finish = (err, val) => {
        if (settled) return;
        settled = true;
        try { if (timeoutId) clearTimeout(timeoutId); } catch {}
        try { abortCleanup?.(); } catch {}
        abortCleanup = null;
        try { worker.terminate(); } catch {}
        if (err) reject(err);
        else resolve(val);
      };
      const onAbort = () => finish(new Error("faststart_aborted"));
      if (signal) {
        if (signal.aborted) {
          finish(new Error("faststart_aborted"));
          return;
        }
        try {
          signal.addEventListener("abort", onAbort, { once: true });
          abortCleanup = () => {
            try { signal.removeEventListener("abort", onAbort); } catch {}
          };
        } catch {}
      }

      worker.onmessage = (ev) => {
        const msg = ev?.data || {};
        if (msg?.type === "progress") {
          try { onProgress(Math.max(0, Math.min(1, Number(msg.progress || 0)))); } catch {}
          return;
        }
        if (msg?.type === "done") {
          if (!msg.ok) {
            finish(new Error(String(msg.error || "faststart_worker_failed")));
            return;
          }
          const buffer = msg?.buffer;
          if (!(buffer instanceof ArrayBuffer) || !buffer.byteLength) {
            finish(new Error("faststart_worker_empty"));
            return;
          }
          finish(null, new Blob([buffer], { type: "video/mp4" }));
        }
      };
      worker.onerror = (e) => {
        finish(new Error(String(e?.message || "faststart_worker_error")));
      };

      timeoutId = setTimeout(() => {
        finish(new Error("faststart_worker_timeout"));
      }, WORKER_FASTSTART_TIMEOUT_MS);

      try {
        worker.postMessage({
          type: "faststart",
          blob: inputBlob,
          sourceMime,
          sourceExt,
        });
      } catch (e) {
        finish(e || new Error("faststart_worker_post_failed"));
      }
    });

    let outDur = Number.NaN;
    let inDur = Number.NaN;
    try { outDur = await readBlobDuration(outBlob, 22000); } catch {}
    try { inDur = await readBlobDuration(inputBlob, 22000); } catch {}
    const outOk = Number.isFinite(outDur) && outDur > 0;
    const inOk = Number.isFinite(inDur) && inDur > 0;
    const driftOk = !outOk || !inOk || Math.abs(outDur - inDur) <= 0.9;
    if (!outOk || !driftOk) {
      return {
        blob: inputBlob,
        mime: sourceMime || "video/mp4",
        changed: false,
        pipeline: "fallback_bad_duration",
      };
    }

    return {
      blob: outBlob,
      mime: "video/mp4",
      changed: true,
      pipeline: "worker_faststart",
      durationSec: outDur,
    };
  } catch {
    return {
      blob: inputBlob,
      mime: sourceMime || "video/mp4",
      changed: false,
      pipeline: "fallback_error",
    };
  }
}

async function trimForumVideoBlobRealtime(inputBlob, opts = {}) {
  if (typeof document === "undefined") throw new Error("no_document");
  if (typeof MediaRecorder === "undefined") throw new Error("trim_unsupported");
  if (!inputBlob || typeof inputBlob !== "object") throw new Error("bad_blob");

  const signal = opts?.signal || null;
  const onProgress = typeof opts?.onProgress === "function" ? opts.onProgress : NOOP;
  const maxDurationSec = Math.max(1, Number(opts?.maxDurationSec || 120));
  const startReqSec = Math.max(0, Number(opts?.startSec || 0));
  const outputMaxEdge = Math.max(640, Math.min(1280, Number(opts?.maxEdge || 960)));
  const fps = Math.max(18, Math.min(30, Number(opts?.fps || 24)));

  const srcUrl = URL.createObjectURL(inputBlob);
  const video = document.createElement("video");
  video.preload = "auto";
  video.playsInline = true;
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.controls = false;
  video.style.position = "fixed";
  video.style.left = "0";
  video.style.top = "0";
  video.style.width = "2px";
  video.style.height = "2px";
  video.style.opacity = "0.001";
  video.style.pointerEvents = "none";
  video.style.zIndex = "-1";
  video.src = srcUrl;
  try { document.body.appendChild(video); } catch {}

  let canvas = null;
  let ctx = null;
  let srcStream = null;
  let canvasStream = null;
  let mixedStream = null;
  let recorder = null;
  let drawTimer = 0;
  let stopTimer = 0;
  let hardTimeout = 0;
  let abortCleanup = null;
  const chunks = [];
  let stopped = false;

  const cleanup = () => {
    stopped = true;
    try { if (drawTimer) cancelAnimationFrame(drawTimer); } catch {}
    drawTimer = 0;
    try { if (stopTimer) clearInterval(stopTimer); } catch {}
    stopTimer = 0;
    try { if (hardTimeout) clearTimeout(hardTimeout); } catch {}
    hardTimeout = 0;
    try { abortCleanup?.(); } catch {}
    abortCleanup = null;
    try { mixedStream?.getTracks?.().forEach((t) => t.stop()); } catch {}
    mixedStream = null;
    try { canvasStream?.getTracks?.().forEach((t) => t.stop()); } catch {}
    canvasStream = null;
    try { srcStream?.getTracks?.().forEach((t) => t.stop()); } catch {}
    srcStream = null;
    try { recorder = null; } catch {}
    try { canvas?.remove?.(); } catch {}
    canvas = null;
    ctx = null;
    try { video.pause?.(); } catch {}
    try { video.removeAttribute("src"); } catch {}
    try { video.load?.(); } catch {}
    try { video.remove?.(); } catch {}
    try { URL.revokeObjectURL(srcUrl); } catch {}
  };

  const throwIfAborted = () => {
    if (signal?.aborted) throw new Error("trim_aborted");
  };

  try {
    throwIfAborted();
    await new Promise((resolve, reject) => {
      let done = false;
      const finish = (err) => {
        if (done) return;
        done = true;
        try { video.removeEventListener("loadedmetadata", onMeta); } catch {}
        try { video.removeEventListener("loadeddata", onMeta); } catch {}
        try { video.removeEventListener("error", onErr); } catch {}
        if (err) reject(err);
        else resolve();
      };
      const onMeta = () => finish();
      const onErr = () => finish(new Error("video_metadata_error"));
      video.addEventListener("loadedmetadata", onMeta, { once: true });
      video.addEventListener("loadeddata", onMeta, { once: true });
      video.addEventListener("error", onErr, { once: true });
      try { video.load?.(); } catch {}
      if (video.readyState >= 2) finish();
    });

    const totalDur = Number(video.duration || 0);
    if (!Number.isFinite(totalDur) || totalDur <= 0) throw new Error("video_duration_unavailable");
    const clipLen = Math.min(maxDurationSec, totalDur);
    const maxStart = Math.max(0, totalDur - clipLen);
    const clipStart = clampNum(startReqSec, 0, maxStart);
    const clipEnd = Math.min(totalDur, clipStart + clipLen);
    const clipDur = Math.max(0.1, clipEnd - clipStart);

    throwIfAborted();
    await seekTo(video, clipStart);
    try { await waitFrame(video); } catch {}

    srcStream =
      (typeof video.captureStream === "function" ? video.captureStream() : null) ||
      (typeof video.mozCaptureStream === "function" ? video.mozCaptureStream() : null);
    if (!srcStream) throw new Error("trim_unsupported");

    const srcW = Math.max(1, Number(video.videoWidth || 1));
    const srcH = Math.max(1, Number(video.videoHeight || 1));
    const scale = Math.min(1, outputMaxEdge / Math.max(srcW, srcH));
    const outW = Math.max(2, Math.round(srcW * scale));
    const outH = Math.max(2, Math.round(srcH * scale));
    canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = "2px";
    canvas.style.height = "2px";
    canvas.style.opacity = "0.001";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "-1";
    try { document.body.appendChild(canvas); } catch {}
    ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) throw new Error("trim_unsupported");

    const drawFrame = () => {
      if (stopped) return;
      if (video.readyState < 2) return;
      try { ctx.drawImage(video, 0, 0, outW, outH); } catch {}
    };
    drawFrame();
    const drawLoop = () => {
      if (stopped) return;
      try { drawFrame(); } catch {}
      try { drawTimer = requestAnimationFrame(drawLoop); } catch { drawTimer = 0; }
    };
    drawTimer = requestAnimationFrame(drawLoop);

    canvasStream = canvas.captureStream(fps);
    mixedStream = new MediaStream();
    const outVideoTrack = canvasStream?.getVideoTracks?.()?.[0] || null;
    if (!outVideoTrack) throw new Error("trim_unsupported");
    try { mixedStream.addTrack(outVideoTrack); } catch {}
    const srcAudioTracks = srcStream?.getAudioTracks?.() || [];
    for (const tr of srcAudioTracks) {
      try { mixedStream.addTrack(tr); } catch {}
    }

    const recMime = pickRecorderMime(String(inputBlob.type || ""));
    recorder = recMime ? new MediaRecorder(mixedStream, { mimeType: recMime }) : new MediaRecorder(mixedStream);
    recorder.ondataavailable = (e) => {
      if (e?.data?.size) chunks.push(e.data);
    };

    const outBlob = await new Promise(async (resolve, reject) => {
      let settled = false;
      let recStopped = false;
      const rejectOnce = (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      };
      const resolveOnce = (blobOut) => {
        if (settled) return;
        settled = true;
        resolve(blobOut);
      };
      const stopNow = () => {
        if (recStopped) return;
        recStopped = true;
        stopped = true;
        try { recorder.requestData?.(); } catch {}
        try { recorder.stop?.(); } catch {}
        try { video.pause?.(); } catch {}
      };

      recorder.onerror = () => rejectOnce(new Error("trim_record_error"));
      recorder.onstop = () => {
        try {
          const outType = recorder.mimeType || recMime || String(inputBlob.type || "video/webm");
          const b = new Blob(chunks, { type: outType });
          resolveOnce(b);
        } catch (e) {
          rejectOnce(e || new Error("trim_blob_error"));
        }
      };

      if (signal) {
        const onAbort = () => {
          stopNow();
          rejectOnce(new Error("trim_aborted"));
        };
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
        abortCleanup = () => {
          try { signal.removeEventListener("abort", onAbort); } catch {}
        };
      }

      const startedAt = Date.now();
      stopTimer = setInterval(() => {
        try {
          const cur = Number(video.currentTime || 0);
          const pct = Math.max(0, Math.min(1, (cur - clipStart) / clipDur));
          try { onProgress(pct); } catch {}
          if (cur >= (clipEnd - 0.035) || video.ended) {
            stopNow();
            return;
          }
        } catch {}
        if ((Date.now() - startedAt) > ((clipDur + 12) * 1000)) {
          stopNow();
          return;
        }
        if (signal?.aborted) {
          stopNow();
          rejectOnce(new Error("trim_aborted"));
        }
      }, 60);

      hardTimeout = setTimeout(() => {
        stopNow();
      }, Math.max(12000, Math.ceil((clipDur + 12) * 1000)));

      try { recorder.start(700); } catch (e) { rejectOnce(e || new Error("trim_start_failed")); return; }
      try { await video.play(); } catch (e) {
        stopNow();
        rejectOnce(e || new Error("trim_play_failed"));
      }
    });

    let outDur = Number.NaN;
    try { outDur = await readBlobDuration(outBlob, 22000); } catch {}
    if (!Number.isFinite(outDur) || outDur <= 0) {
      outDur = clipDur;
    }

    return {
      blob: outBlob,
      durationSec: outDur,
      startSec: clipStart,
      endSec: clipEnd,
    };
  } finally {
    cleanup();
  }
}

export async function trimForumVideoBlob(inputBlob, opts = {}) {
  const signal = opts?.signal || null;
  const maxDurationSec = Math.max(1, Number(opts?.maxDurationSec || 120));
  const startSec = Math.max(0, Number(opts?.startSec || 0));
  const onProgress = typeof opts?.onProgress === "function" ? opts.onProgress : NOOP;
  const preferWorker = opts?.preferWorker !== false;

  if (preferWorker) {
    try {
      const workerBlob = await trimViaWorkerFfmpeg(inputBlob, {
        signal,
        startSec,
        maxDurationSec,
        onProgress: (p) => {
          try { onProgress(Math.max(0.02, Math.min(0.98, Number(p || 0)))); } catch {}
        },
      });
      let outDur = Number.NaN;
      try { outDur = await readBlobDuration(workerBlob, 22000); } catch {}
      if (Number.isFinite(outDur) && outDur > 0 && outDur <= (maxDurationSec + 1.0)) {
        return {
          blob: workerBlob,
          durationSec: outDur,
          startSec,
          endSec: startSec + outDur,
          pipeline: "worker_ffmpeg",
        };
      }
      throw new Error("trim_worker_bad_duration");
    } catch (e) {
      if (String(e?.message || "").includes("aborted")) throw e;
    }
  }

  const r = await trimForumVideoBlobRealtime(inputBlob, opts);
  return { ...r, pipeline: "media_recorder" };
}
