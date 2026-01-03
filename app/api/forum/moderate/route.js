// app/api/forum/moderate/route.js

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-layers';

import * as nsfwjs from 'nsfwjs';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const LIMITS = {
  maxFiles: 20,
  maxOneBytes: 4 * 1024 * 1024,   // 4MB
  maxTotalBytes: 25 * 1024 * 1024 // 25MB
};

// ----------
// Global singleton (важно для Next dev/HMR) — фикс Conv1/kernel already registered
// ----------
const G = globalThis;

if (!G.__nsfwModerationSingleton) {
  G.__nsfwModerationSingleton = {
    tfReady: false,
    model: null,
    modelPromise: null
  };
}

async function ensureTfReady() {
  const S = G.__nsfwModerationSingleton;
  if (S.tfReady) return;

  // backend + ready делаем один раз на процесс
  try { await tf.setBackend('cpu'); } catch {}
  try { await tf.ready(); } catch {}

  S.tfReady = true;
}

async function getModel(origin) {
  const S = G.__nsfwModerationSingleton;

  if (S.model) return S.model;
  if (S.modelPromise) return S.modelPromise;

  S.modelPromise = (async () => {
    await ensureTfReady();

    const modelUrl = new URL('/models/nsfwjs/model.json', origin).toString();
    const m = await nsfwjs.load(modelUrl, { size: 224 });

    S.model = m;
    return m;
  })();

  return S.modelPromise;
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// Decode JPEG/PNG -> { width, height, rgba } (Uint8Array RGBA)
function decodeImage(buffer, mime) {
  const m = String(mime || '').toLowerCase();
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  if (m === 'image/png') {
    const png = PNG.sync.read(buf);
    return { width: png.width, height: png.height, rgba: png.data };
  }

  const decoded = jpeg.decode(buf, { useTArray: true });
  if (!decoded || !decoded.data || !decoded.width || !decoded.height) {
    throw new Error('decode_failed');
  }
  return { width: decoded.width, height: decoded.height, rgba: decoded.data };
}

// RGBA -> Tensor3D [h,w,3] int32 0..255
function rgbaToTensor({ width, height, rgba }) {
  const w = width, h = height;
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    rgb[j++] = rgba[i];
    rgb[j++] = rgba[i + 1];
    rgb[j++] = rgba[i + 2];
  }
  return tf.tensor3d(rgb, [h, w, 3], 'int32');
}

// --------------------
// Gore/Violence heuristic (MVP) — СТРОЖЕ
// --------------------
function goreHeuristic({ width, height, rgba }) {
  const n = width * height;
  if (!n || !rgba || rgba.length < 4) return { goreScore: 0, violenceScore: 0 };

  let redish = 0;
  let dark = 0;

  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i] || 0;
    const g = rgba[i + 1] || 0;
    const b = rgba[i + 2] || 0;

    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b);
    if (lum < 55) dark++;

    // “blood-ish” — оставляем твою формулу, но чуть чувствительнее
    if (r > 115 && g < 100 && b < 100 && (r - Math.max(g, b)) > 40) redish++;
  }

  const redRatio = redish / n;
  const darkRatio = dark / n;

  // немного усилил вклад красного
  const goreScore = clamp01((redRatio * 1.55) + (darkRatio * 0.22));
  const violenceScore = clamp01((redRatio * 1.05) + (darkRatio * 0.15));

  return { goreScore, violenceScore };
}

// --------------------
// NSFW decision — ЖЕСТЧЕ по Porn/Hentai/Explicit, но НЕ рубим "лифчик"
// --------------------
function nsfwDecision(scores) {
  const Porn = clamp01(scores.Porn);
  const Sexy = clamp01(scores.Sexy);
  const Hentai = clamp01(scores.Hentai);
  const Neutral = clamp01(scores.Neutral);
  const Drawing = clamp01(scores.Drawing);

  // Комбо-индикаторы
  const ps = Porn + Sexy;      // часто ловит ню/эротику, когда Porn средний, Sexy высокий
  const ph = Porn + Hentai;

  // 0) Быстрый “явно безопасно” проход (опционально)
  // если Neutral очень высокий и Porn/Hentai низкие — пропускаем даже при Sexy
  if (Neutral >= 0.80 && Porn < 0.10 && Hentai < 0.10) {
    return { decision: 'allow', reason: 'unknown' };
  }

  // 1) BLOCK — явная порнуха / явный хентай
  if (Porn >= 0.62) return { decision: 'block', reason: 'porn' };
  if (Hentai >= 0.72) return { decision: 'block', reason: 'hentai' };

  // Комбо-блоки (когда Sexy “зашкаливает”, а Porn уже заметный)
  // Это ловит “порно”, которое иногда уходит в Sexy
  if (ps >= 0.95 && Porn >= 0.22) return { decision: 'block', reason: 'porn' };
  if (ph >= 0.90 && Hentai >= 0.25) return { decision: 'block', reason: 'hentai' };

  // 2) REVIEW — явная/вероятная нагота
  // Порог Porn для review понижен (чтобы “ню” чаще отправлялось в review)
  if (Porn >= 0.34) return { decision: 'review', reason: 'explicit_nudity' };
  if (Hentai >= 0.45) return { decision: 'review', reason: 'hentai' };

  // Комбо-review: Sexy высокий + Porn слегка поднят → это обычно “ню/секс-контент”
  if (ps >= 0.82 && Porn >= 0.16) return { decision: 'review', reason: 'sexual' };

  // 3) Sexy-only:
  // ВАЖНО: бельё/лифчик чаще всего даёт высокий Sexy, но низкий Porn.
  // Мы НЕ блокируем Sexy вообще.
  // В review отправляем только очень высокий Sexy, при этом:
  // - если Neutral низкий (т.е. не "обычная фотка")
  // - и Drawing не доминирует (чтобы арты не душить)
  if (Sexy >= 0.88 && Neutral < 0.55 && Drawing < 0.60) {
    return { decision: 'review', reason: 'sexual' };
  }

  return { decision: 'allow', reason: 'unknown' };
}

// --------------------
// Gore decision — СТРОЖЕ (ниже пороги)
// --------------------
function goreDecision(goreScore, violenceScore) {
  // Было: block 0.85, review 0.62, violence 0.70
  // Стало: немного строже
  if (goreScore >= 0.78) return { decision: 'block', reason: 'gore' };
  if (goreScore >= 0.56) return { decision: 'review', reason: 'gore' };
  if (violenceScore >= 0.62) return { decision: 'review', reason: 'violence' };
  return { decision: 'allow', reason: 'unknown' };
}

const severityRank = (decision, reason) => {
  const d = String(decision || 'allow');
  const r = String(reason || 'unknown');
  const dScore = (d === 'block') ? 3 : (d === 'review') ? 2 : 1;

  const reasonPriority = {
    porn: 60,
    explicit_nudity: 55,
    gore: 50,
    violence: 45,
    hentai: 40,
    sexual: 30,
    unknown: 10
  };

  return dScore * 100 + (reasonPriority[r] || 0);
};

export async function POST(req) {
  const started = Date.now();
  let source = 'image';
  let clientRequestId = '';

  try {
    const form = await req.formData();
    const files = form.getAll('files') || [];

    source = String(form.get('source') || 'image');
    clientRequestId = String(form.get('clientRequestId') || '');

    if (!files.length) {
      return Response.json({ ok: false, error: 'No files provided' }, { status: 400 });
    }
    if (files.length > LIMITS.maxFiles) {
      return Response.json({ ok: false, error: `Too many files (max ${LIMITS.maxFiles})` }, { status: 413 });
    }

    // validate size
    let total = 0;
    for (const f of files) {
      const size = Number(f?.size || 0);
      total += size;
      if (size > LIMITS.maxOneBytes) {
        return Response.json({ ok: false, error: `File too large (max ${LIMITS.maxOneBytes} bytes)` }, { status: 413 });
      }
    }
    if (total > LIMITS.maxTotalBytes) {
      return Response.json({ ok: false, error: `Payload too large (max ${LIMITS.maxTotalBytes} bytes)` }, { status: 413 });
    }

    // origin для /public/models/...
    const u = new URL(req.url);
    const proto =
      req.headers.get('x-forwarded-proto') ||
      u.protocol.replace(':', '') ||
      'http';
    const host =
      req.headers.get('x-forwarded-host') ||
      req.headers.get('host') ||
      u.host;
    const origin = `${proto}://${host}`;

    const model = await getModel(origin);

    const details = [];
    let overall = { decision: 'allow', reason: 'unknown', score: 0 };
    const t0 = Date.now();

    for (const f of files) {
      const mime = String(f?.type || '').toLowerCase();

      if (mime && !['image/jpeg', 'image/jpg', 'image/png'].includes(mime)) {
        return Response.json({ ok: false, error: `Unsupported type: ${mime}` }, { status: 415 });
      }

      const ab = await f.arrayBuffer();
      const buf = Buffer.from(ab);

      const decoded = decodeImage(buf, mime || 'image/jpeg');
      const { goreScore, violenceScore } = goreHeuristic(decoded);

      const imgTensor = rgbaToTensor(decoded);

      let nsfw = null;
      try {
        const preds = await model.classify(imgTensor);
        nsfw = {};
        for (const p of (preds || [])) {
          nsfw[p.className] = clamp01(p.probability);
        }
      } finally {
        imgTensor.dispose?.();
      }

      const nsfwRes = nsfwDecision(nsfw || {});
      const goreRes = goreDecision(goreScore, violenceScore);

      let best = nsfwRes;
      if (severityRank(goreRes.decision, goreRes.reason) > severityRank(best.decision, best.reason)) {
        best = goreRes;
      }

      const item = {
        name: String(f?.name || ''),
        type: mime || 'image/jpeg',
        size: Number(f?.size || 0),
        decision: best.decision,
        reason: best.reason,
        scores: {
          nsfw: nsfw || {},
          goreScore: clamp01(goreScore),
          violenceScore: clamp01(violenceScore)
        }
      };

      details.push(item);

      const sc = severityRank(item.decision, item.reason);
      if (sc > overall.score) overall = { decision: item.decision, reason: item.reason, score: sc };
    }

    const ms = Date.now() - t0;

    try {
      console.log('[moderate]', {
        source,
        clientRequestId,
        files: files.length,
        decision: overall.decision,
        reason: overall.reason,
        ms
      });
    } catch {}

    return Response.json({
      ok: true,
      decision: overall.decision,
      reason: overall.reason,
      scores: null,
      details,
      meta: {
        source,
        clientRequestId,
        tookMs: ms
      }
    });
  } catch (e) {
    const ms = Date.now() - started;
    try {
      console.error('[moderate:error]', {
        source,
        clientRequestId,
        ms,
        err: String(e?.message || e),
        stack: e?.stack ? String(e.stack).slice(0, 2000) : undefined,
        cause: e?.cause ? String(e.cause) : undefined
      });
    } catch {}

    return Response.json(
      { ok: false, error: 'Moderation failed' },
      { status: 500 }
    );
  }
}
