// app/api/forum/moderate/route.js

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-layers';

import * as nsfwjs from 'nsfwjs';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const LIMITS = {
  maxFiles: 20,
  maxOneBytes: 4 * 1024 * 1024,   // 4MB
  maxTotalBytes: 25 * 1024 * 1024 // 25MB
};

const VIDEO_PRECOMMIT_SOURCE = 'video_frame_precommit';
const VIDEO_POSTCOMMIT_SOURCE = 'video_frame_postcommit';
const VIDEO_SURFACES = new Set(['forum', 'dm', 'ads']);
const VIDEO_TERMINAL_TTL_SEC = 7 * 24 * 60 * 60;
const VIDEO_INFLIGHT_TTL_SEC = 90;
const SERVER_STRICT_MODERATION = String(process.env.NEXT_PUBLIC_FORUM_MODERATION_MODE || 'BALANCED').toUpperCase() === 'STRICT';

// Keep the legacy image/avatar moderation load path isolated. Mongo/Redis/Ads/identity
// dependencies are loaded only for pre/post-commit video moderation or public Ads status polling.
let videoDepsPromise = null;
async function getVideoDeps() {
  if (!videoDepsPromise) {
    videoDepsPromise = Promise.all([
      import('../../../../lib/mongo/forum-primary.cjs'),
      import('../../../../lib/mongo/dm-primary.cjs'),
      import('../../profile/_identity.js'),
      import('../_db.js'),
      import('../../../../lib/adsCore.js'),
      import('../_bus.js'),
      import('../../../../lib/notificationCenter.js'),
      import('../../../../lib/webPush.js'),
      import('../../../../lib/forum/video-precommit-moderation-receipt.cjs'),
    ]).then(([forumPrimaryMod, dmPrimaryMod, identity, forumDb, adsCore, forumBus, notificationCenter, webPush, receiptMod]) => ({
      forumPrimary: forumPrimaryMod.default || forumPrimaryMod,
      dmPrimary: dmPrimaryMod.default || dmPrimaryMod,
      identity,
      forumDb,
      adsCore,
      forumBus,
      notificationCenter,
      webPush,
      videoReceipt: receiptMod.default || receiptMod,
    }));
  }
  return videoDepsPromise;
}

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

// Video-only sampled-frame quorum for adult-content hard blocks. The per-frame
// model, thresholds, reasons and STRICT policy remain unchanged. A video-level
// Porn/Hentai BLOCK now requires repeated hard evidence across the sampled clip,
// not one or two isolated classifier spikes. The 5-10 frame upload contract uses
// a one-third quorum with a floor of three hard-block frames: 5-9 samples require
// 3 confirming Porn/Hentai BLOCK frames; 10 samples require 4. Sub-quorum adult
// hard hits remain REVIEW evidence. Violence/gore strongest-frame safety stays
// unchanged and image/avatar moderation never enters this aggregator.
function videoAdultBlockQuorum(sampleCount) {
  const count = Math.max(0, Math.floor(Number(sampleCount) || 0));
  return Math.max(3, Math.ceil(count / 3));
}

function aggregateVideoDecision(details, fallback) {
  const items = Array.isArray(details) ? details : [];
  if (!items.length) return fallback;

  const adultBlockReasons = new Set(['porn', 'hentai']);
  const adultBlocks = items.filter((item) =>
    String(item?.decision || '').toLowerCase() === 'block' &&
    adultBlockReasons.has(String(item?.reason || '').toLowerCase())
  );
  const adultBlockQuorum = videoAdultBlockQuorum(items.length);

  if (adultBlocks.length >= adultBlockQuorum) {
    let strongest = adultBlocks[0];
    for (const item of adultBlocks.slice(1)) {
      if (severityRank(item?.decision, item?.reason) > severityRank(strongest?.decision, strongest?.reason)) strongest = item;
    }
    const reason = String(strongest?.reason || 'porn').toLowerCase();
    return { decision: 'block', reason, score: severityRank('block', reason) };
  }

  let overall = { decision: 'allow', reason: 'unknown', score: severityRank('allow', 'unknown') };
  for (const item of items) {
    let decision = String(item?.decision || 'allow').toLowerCase();
    let reason = String(item?.reason || 'unknown').toLowerCase();

    if (decision === 'block' && reason === 'porn') {
      decision = 'review';
      reason = 'explicit_nudity';
    } else if (decision === 'block' && reason === 'hentai') {
      decision = 'review';
    }

    const score = severityRank(decision, reason);
    if (score > overall.score) overall = { decision, reason, score };
  }
  return overall;
}


function cleanId(value) {
  return String(value ?? '').trim();
}

function videoMediaFingerprint(surface, mediaUrl = '') {
  if (cleanId(surface).toLowerCase() !== 'ads') return '';
  const value = cleanId(mediaUrl);
  if (!value) return 'campaign';
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 24);
}

function videoStateKey(surface, entityId, mediaUrl = '') {
  const suffix = videoMediaFingerprint(surface, mediaUrl);
  return `forum:moderation:video:v2:${cleanId(surface).toLowerCase()}:${cleanId(entityId)}${suffix ? `:${suffix}` : ''}`;
}

function videoInflightKey(surface, entityId, mediaUrl = '') {
  return `${videoStateKey(surface, entityId, mediaUrl)}:inflight`;
}

function parseStoredState(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(String(value)); } catch { return null; }
}

async function readStoredVideoState(surface, entityId, mediaUrl = '') {
  try { const { forumDb } = await getVideoDeps(); return parseStoredState(await forumDb.redis.get(videoStateKey(surface, entityId, mediaUrl))); } catch { return null; }
}

async function writeStoredVideoState(surface, entityId, mediaUrl, state) {
  const { forumDb } = await getVideoDeps();
  await forumDb.redis.set(videoStateKey(surface, entityId, mediaUrl), JSON.stringify(state), { ex: VIDEO_TERMINAL_TTL_SEC });
  return state;
}

async function sameCanonicalIdentity(a, b) {
  const leftRaw = cleanId(a);
  const rightRaw = cleanId(b);
  if (!leftRaw || !rightRaw) return false;
  if (leftRaw.toLowerCase() === rightRaw.toLowerCase()) return true;

  const { identity, forumDb } = await getVideoDeps();
  const collect = async (raw) => {
    const ids = new Set([cleanId(raw).toLowerCase()].filter(Boolean));
    try {
      const canonical = cleanId(await identity.resolveCanonicalAccountId(raw));
      if (canonical) ids.add(canonical.toLowerCase());
    } catch {}
    try {
      const linked = await forumDb.collectMediaLockIdentityIds(raw);
      for (const value of linked || []) {
        const clean = cleanId(value).toLowerCase();
        if (clean) ids.add(clean);
      }
    } catch {}
    return ids;
  };

  const [leftIds, rightIds] = await Promise.all([collect(leftRaw), collect(rightRaw)]);
  for (const id of leftIds) if (rightIds.has(id)) return true;
  return false;
}

function findDmVideoAttachment(message, mediaUrl = '') {
  const wanted = cleanId(mediaUrl);
  return (Array.isArray(message?.attachments) ? message.attachments : []).find((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const type = cleanId(entry.type || entry.mediaType || entry.mime).toLowerCase();
    const url = cleanId(entry.url || entry.src || entry.href);
    const isVideo = /video/.test(type) || /\.(?:mp4|webm|mov|m4v|mkv)(?:[?#].*)?$/i.test(url);
    return isVideo && (!wanted || url === wanted);
  }) || null;
}

function forumPostHasVideoUrl(post, mediaUrl = '') {
  const wanted = cleanId(mediaUrl);
  if (!wanted) return false;
  return String(post?.text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line === wanted);
}

async function resolveOwnedVideoEntity(surface, entityId, actorId, mediaUrl = '') {
  const { forumPrimary, dmPrimary, adsCore } = await getVideoDeps();
  if (surface === 'forum') {
    const post = await forumPrimary.getPost(entityId);
    if (!post) return { ok: true, gone: true, ownerId: actorId, entity: null };
    const ownerId = cleanId(post.userId || post.accountId);
    if (!(await sameCanonicalIdentity(ownerId, actorId))) return { ok: false, error: 'forbidden' };
    if (!forumPostHasVideoUrl(post, mediaUrl)) return { ok: false, error: 'video_not_found' };
    return { ok: true, ownerId, entity: post, currentStatus: cleanId(post.videoModerationStatus).toLowerCase() };
  }
  if (surface === 'dm') {
    const message = await dmPrimary.getMessage(entityId);
    if (!message) return { ok: true, gone: true, ownerId: actorId, entity: null };
    const ownerId = cleanId(message.from);
    if (!(await sameCanonicalIdentity(ownerId, actorId))) return { ok: false, error: 'forbidden' };
    const videoAttachment = findDmVideoAttachment(message, mediaUrl);
    if (!videoAttachment) return { ok: false, error: 'video_not_found' };
    return { ok: true, ownerId, entity: message, currentStatus: cleanId(videoAttachment?.moderationStatus).toLowerCase() };
  }
  if (surface === 'ads') {
    const result = await adsCore.getCampaignForVideoModeration({ campaignId: entityId, accountId: actorId, mediaUrl });
    if (!result.ok) {
      if (result.error === 'NOT_FOUND') return { ok: true, gone: true, ownerId: actorId, entity: null };
      return { ok: false, error: String(result.error || 'forbidden').toLowerCase() };
    }
    return {
      ok: true,
      ownerId: cleanId(result.campaign?.accountId || actorId),
      entity: result.campaign,
      video: result.video,
      currentStatus: cleanId(result.video?.moderationStatus).toLowerCase(),
    };
  }
  return { ok: false, error: 'bad_surface' };
}

function shouldRejectVideo(decision, reason) {
  const d = cleanId(decision).toLowerCase();
  const r = cleanId(reason).toLowerCase();
  if (d === 'block') return true;
  if (r === 'violence' || r === 'gore') return true;
  if (SERVER_STRICT_MODERATION && d === 'review') return true;
  return false;
}

function shouldLockVideoReason(reason) {
  return ['porn', 'hentai', 'violence', 'gore'].includes(cleanId(reason).toLowerCase());
}

async function persistApprovedVideo(surface, entityId, actorId, mediaUrl = '') {
  const { dmPrimary, forumDb, adsCore } = await getVideoDeps();
  if (surface === 'forum') {
    const result = await forumDb.setPostVideoModerationStatus(entityId, 'approved');
    if (!result?.post) throw new Error('forum_video_status_update_failed');
    return { entityStatus: 'approved' };
  }
  if (surface === 'dm') {
    const result = await dmPrimary.setMessageVideoModerationStatus(entityId, 'approved');
    if (!result) throw new Error('dm_video_status_update_failed');
    return { entityStatus: 'approved' };
  }
  if (surface === 'ads') {
    const result = await adsCore.setCampaignVideoModerationStatus({ campaignId: entityId, accountId: actorId, mediaUrl, status: 'approved' });
    if (!result?.ok) throw new Error(`ads_video_status_update_failed:${result?.error || 'unknown'}`);
    return { entityStatus: result.campaignStatus || 'pending' };
  }
  throw new Error('bad_surface');
}

const isForumSseEnabled = () => {
  const hardDisabled = String(process.env.FORUM_SSE_HARD_DISABLED ?? '1').trim() !== '0';
  if (hardDisabled) return false;
  return String(process.env.FORUM_SSE_ENABLED || '').trim() === '1';
};

async function publishForumVideoDelete(result, entityId) {
  if (!isForumSseEnabled()) return;
  const deleted = Array.isArray(result?.deletedPostIds)
    ? result.deletedPostIds.map(String)
    : (Array.isArray(result?.deleted) ? result.deleted.map(String) : [String(entityId)]);
  const payload = { type: 'post_deleted', postId: String(entityId), deleted, deletedPostIds: deleted, rev: Number(result?.rev || 0), ts: Date.now() };
  try {
    const { forumBus, forumDb } = await getVideoDeps();
    try { forumBus.bus?.emit?.(payload); } catch {}
    await forumDb.redis.publish('forum:events', JSON.stringify(payload));
  } catch {}
}

async function publishDmVideoDelete(message, entityId) {
  const { notificationCenter, webPush } = await getVideoDeps();
  const from = cleanId(message?.from);
  const to = cleanId(message?.to);
  const jobs = [];
  if (from) jobs.push(webPush.publishStoredNotificationImpulse(from, {
    source: notificationCenter.NOTIFICATION_SOURCES.MESSENGER_MESSAGES,
    count: 0, totalCount: 0, forceSync: true,
    reason: 'dm_video_moderation_delete',
    dmDeletedMessageId: String(entityId), dmDeletedPeerId: to,
  }));
  if (to) jobs.push(webPush.publishStoredNotificationImpulse(to, {
    source: notificationCenter.NOTIFICATION_SOURCES.MESSENGER_MESSAGES,
    count: 0, totalCount: 0, forceSync: true,
    reason: 'dm_video_moderation_delete',
    dmDeletedMessageId: String(entityId), dmDeletedPeerId: from,
  }));
  if (jobs.length) await Promise.allSettled(jobs);
}

async function deleteRejectedVideo(surface, entityId, actorId, mediaUrl = '', ownedVideoEntity = null) {
  const { dmPrimary, forumDb, adsCore } = await getVideoDeps();
  if (surface === 'forum') {
    const result = await forumDb.deletePostBranchHard(entityId);
    await publishForumVideoDelete(result, entityId);
    return { deleted: true, deletedIds: result?.deletedPostIds || result?.deleted || [entityId] };
  }
  if (surface === 'dm') {
    const message = ownedVideoEntity?.entity || await dmPrimary.getMessage(entityId);
    const result = await dmPrimary.deleteMessage(entityId);
    if (!result?.ok) throw new Error('dm_video_delete_failed');
    await publishDmVideoDelete(message, entityId);
    return { deleted: true, deletedIds: [entityId] };
  }
  if (surface === 'ads') {
    const result = await adsCore.deleteCampaignForVideoModeration({ campaignId: entityId, accountId: actorId, mediaUrl });
    if (!result?.ok && result?.error !== 'NOT_FOUND') throw new Error(`ads_video_delete_failed:${result?.error || 'unknown'}`);
    return { deleted: true, deletedIds: [entityId] };
  }
  throw new Error('bad_surface');
}

async function releaseInflight(key) {
  if (!key) return;
  try { const { forumDb } = await getVideoDeps(); await forumDb.redis.del(key); } catch {}
}

export async function POST(req) {
  const started = Date.now();
  let source = 'image';
  let clientRequestId = '';
  let surface = '';
  let entityId = '';
  let mediaUrl = '';
  let actorId = '';
  let mediaSha256 = '';
  let mediaSize = 0;
  let mediaMime = '';
  let moderationReceipt = '';
  let acquiredInflightKey = '';

  try {
    const form = await req.formData();
    const files = form.getAll('files') || [];

    source = String(form.get('source') || 'image');
    clientRequestId = String(form.get('clientRequestId') || '');
    surface = String(form.get('surface') || '').trim().toLowerCase();
    entityId = String(form.get('entityId') || '').trim();
    mediaUrl = String(form.get('mediaUrl') || '').trim();
    actorId = String(req.headers.get('x-forum-user-id') || '').trim();
    mediaSha256 = String(form.get('mediaSha256') || '').trim().toLowerCase();
    mediaSize = Number(form.get('mediaSize') || 0);
    mediaMime = String(form.get('mediaMime') || '').split(';')[0].trim().toLowerCase();

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

    const isVideoPreCommit = source === VIDEO_PRECOMMIT_SOURCE;
    const isVideoPostCommit = source === VIDEO_POSTCOMMIT_SOURCE;
    const isVideoModeration = isVideoPreCommit || isVideoPostCommit;
    let ownedVideoEntity = null;

    if (isVideoPreCommit) {
      if (!VIDEO_SURFACES.has(surface) || !actorId) {
        return Response.json({ ok: false, error: 'video_moderation_context_required' }, { status: 400 });
      }
      if (files.length < 5 || files.length > 10) {
        return Response.json({ ok: false, error: 'video_moderation_requires_5_to_10_frames' }, { status: 400 });
      }
      if (!/^[a-f0-9]{64}$/.test(mediaSha256) || !Number.isSafeInteger(mediaSize) || mediaSize <= 0 || mediaMime !== 'video/mp4') {
        return Response.json({ ok: false, error: 'video_moderation_final_mp4_proof_required' }, { status: 400 });
      }
      const { identity } = await getVideoDeps();
      actorId = cleanId(await identity.resolveCanonicalAccountId(actorId).catch(() => actorId)) || actorId;
    }

    if (isVideoPostCommit) {
      if (!VIDEO_SURFACES.has(surface) || !entityId || !actorId || !mediaUrl) {
        return Response.json({ ok: false, error: 'video_moderation_context_required' }, { status: 400 });
      }
      if (files.length < 5 || files.length > 10) {
        return Response.json({ ok: false, error: 'video_moderation_requires_5_to_10_frames' }, { status: 400 });
      }

      // Canonicalize the actor through the same identity graph used by profile/DM.
      // Wallet, Telegram and linked aliases therefore converge before ownership checks.
      const { identity, forumDb } = await getVideoDeps();
      actorId = cleanId(await identity.resolveCanonicalAccountId(actorId).catch(() => actorId)) || actorId;

      ownedVideoEntity = await resolveOwnedVideoEntity(surface, entityId, actorId, mediaUrl);
      if (!ownedVideoEntity?.ok) {
        const status = ownedVideoEntity?.error === 'video_not_found' ? 404 : 403;
        return Response.json({ ok: false, error: ownedVideoEntity?.error || 'forbidden' }, { status });
      }
      if (ownedVideoEntity?.gone) {
        const goneState = await writeStoredVideoState(surface, entityId, mediaUrl, {
          status: 'gone', reason: 'unknown', deleted: true, lockedUntil: 0, updatedAt: Date.now(),
        }).catch(() => ({ status: 'gone', reason: 'unknown', deleted: true, lockedUntil: 0, updatedAt: Date.now() }));
        return Response.json({
          ok: true,
          decision: 'allow',
          reason: 'unknown',
          details: [],
          videoModeration: goneState,
          meta: { source, surface, entityId, ...(mediaUrl ? { mediaUrl } : {}), clientRequestId, tookMs: Date.now() - started },
        });
      }

      const terminal = await readStoredVideoState(surface, entityId, mediaUrl);
      if (terminal?.status === 'approved' || terminal?.status === 'rejected' || terminal?.status === 'gone') {
        return Response.json({
          ok: true,
          decision: terminal.status === 'rejected' ? 'block' : 'allow',
          reason: terminal.reason || 'unknown',
          details: [],
          videoModeration: terminal,
          meta: { source, surface, entityId, ...(mediaUrl ? { mediaUrl } : {}), clientRequestId, idempotent: true, tookMs: Date.now() - started },
        });
      }

      if (ownedVideoEntity?.currentStatus === 'approved') {
        const approvedState = await writeStoredVideoState(surface, entityId, mediaUrl, {
          status: 'approved', reason: 'unknown', deleted: false, lockedUntil: 0, updatedAt: Date.now(),
        }).catch(() => ({ status: 'approved', reason: 'unknown', deleted: false, lockedUntil: 0, updatedAt: Date.now() }));
        return Response.json({
          ok: true,
          decision: 'allow',
          reason: 'unknown',
          details: [],
          videoModeration: approvedState,
          meta: { source, surface, entityId, ...(mediaUrl ? { mediaUrl } : {}), clientRequestId, idempotent: true, tookMs: Date.now() - started },
        });
      }

      acquiredInflightKey = videoInflightKey(surface, entityId, mediaUrl);
      const acquired = await forumDb.redis.set(acquiredInflightKey, clientRequestId || String(Date.now()), { nx: true, ex: VIDEO_INFLIGHT_TTL_SEC });
      if (!acquired) {
        const racedTerminal = await readStoredVideoState(surface, entityId, mediaUrl);
        if (racedTerminal?.status === 'approved' || racedTerminal?.status === 'rejected' || racedTerminal?.status === 'gone') {
          return Response.json({
            ok: true,
            decision: racedTerminal.status === 'rejected' ? 'block' : 'allow',
            reason: racedTerminal.reason || 'unknown',
            details: [],
            videoModeration: racedTerminal,
            meta: { source, surface, entityId, ...(mediaUrl ? { mediaUrl } : {}), clientRequestId, idempotent: true, tookMs: Date.now() - started },
          });
        }
        return Response.json({ ok: false, error: 'video_moderation_inflight' }, { status: 409 });
      }
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

    if (isVideoModeration) {
      overall = aggregateVideoDecision(details, overall);
    }

    const ms = Date.now() - t0;

    let videoModeration = null;
    if (isVideoPreCommit) {
      const reject = shouldRejectVideo(overall.decision, overall.reason);
      if (reject) {
        let lockedUntil = 0;
        if (shouldLockVideoReason(overall.reason)) {
          const { forumDb } = await getVideoDeps();
          lockedUntil = await forumDb.applyMediaSafetyLock(actorId);
        }
        videoModeration = {
          status: 'rejected',
          reason: overall.reason || 'unknown',
          deleted: false,
          lockedUntil: Number(lockedUntil || 0),
          updatedAt: Date.now(),
        };
      } else {
        const { videoReceipt } = await getVideoDeps();
        moderationReceipt = await videoReceipt.issueVideoModerationReceipt({
          actorId,
          surface,
          sha256: mediaSha256,
          size: mediaSize,
          mime: mediaMime,
        });
        videoModeration = {
          status: 'approved',
          reason: overall.reason || 'unknown',
          deleted: false,
          lockedUntil: 0,
          updatedAt: Date.now(),
        };
      }
    }

    if (isVideoPostCommit) {
      const reject = shouldRejectVideo(overall.decision, overall.reason);
      if (reject) {
        // Apply the existing MediaLog/media lock first for severe content. If deletion
        // later fails, the request remains retryable but the safety lock is never lost.
        let lockedUntil = 0;
        if (shouldLockVideoReason(overall.reason)) {
          const { forumDb } = await getVideoDeps();
          const { applyMediaSafetyLock } = forumDb;
          lockedUntil = await applyMediaSafetyLock(ownedVideoEntity?.ownerId || actorId);
        }
        const deletion = await deleteRejectedVideo(surface, entityId, actorId, mediaUrl, ownedVideoEntity);
        const rejectedState = {
          status: 'rejected',
          reason: overall.reason || 'unknown',
          deleted: !!deletion?.deleted,
          deletedIds: deletion?.deletedIds || [entityId],
          lockedUntil: Number(lockedUntil || 0),
          updatedAt: Date.now(),
        };
        // Redis terminal caching strengthens idempotency, but a cache outage must not
        // erase an already-enforced rejection from the client response.
        videoModeration = await writeStoredVideoState(surface, entityId, mediaUrl, rejectedState)
          .catch(() => rejectedState);
      } else {
        const persisted = await persistApprovedVideo(surface, entityId, actorId, mediaUrl);
        const approvedState = {
          status: 'approved',
          reason: overall.reason || 'unknown',
          deleted: false,
          lockedUntil: 0,
          entityStatus: persisted?.entityStatus || 'approved',
          updatedAt: Date.now(),
        };
        videoModeration = await writeStoredVideoState(surface, entityId, mediaUrl, approvedState)
          .catch(() => approvedState);
      }
      await releaseInflight(acquiredInflightKey);
      acquiredInflightKey = '';
    }

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
      ...(videoModeration ? { videoModeration } : {}),
      ...(moderationReceipt ? { moderationReceipt } : {}),
      meta: {
        source,
        ...(surface ? { surface } : {}),
        ...(entityId ? { entityId } : {}),
        ...(mediaUrl ? { mediaUrl } : {}),
        clientRequestId,
        tookMs: ms
      }
    });
  } catch (e) {
    await releaseInflight(acquiredInflightKey);
    acquiredInflightKey = '';
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

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const surface = String(url.searchParams.get('surface') || '').trim().toLowerCase();
    const entityId = String(url.searchParams.get('entityId') || '').trim();
    const mediaUrl = String(url.searchParams.get('mediaUrl') || '').trim();
    // Public status polling exists only for served Ads and is scoped to the exact
    // video creative so multi-creative campaigns cannot approve each other.
    if (surface !== 'ads' || !entityId || !mediaUrl) {
      return Response.json({ ok: false, error: 'video_moderation_status_not_public' }, { status: 400 });
    }
    const terminal = await readStoredVideoState(surface, entityId, mediaUrl);
    if (terminal?.status) {
      return Response.json({
        ok: true,
        videoModeration: {
          status: String(terminal.status || 'pending'),
          deleted: !!terminal.deleted,
        },
      });
    }
    const { adsCore } = await getVideoDeps();
    const campaignState = await adsCore.getCampaignVideoModerationStatus(entityId, mediaUrl);
    const status = campaignState?.ok ? String(campaignState.status || 'pending') : 'gone';
    return Response.json({
      ok: true,
      videoModeration: {
        status,
        deleted: status === 'gone',
      },
    });
  } catch {
    return Response.json({ ok: false, error: 'Moderation status failed' }, { status: 500 });
  }
}

