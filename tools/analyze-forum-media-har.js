#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const MEDIA_EXT_RE = /\.(mp4|webm|mov|m4v|m3u8|mp3|aac|wav)(\?|$)/i;
const FORUM_MEDIA_RE = /\/forum\/|blob\.vercel-storage\.com\/forum\//i;
const AD_MEDIA_RE = /(?:^|\/)(ads?|ad-media|campaign|sponsor)(?:\/|[-_])|ADS\.mp4|forum[_-]?ad/i;
const FORUM_REPEAT_WARN = 8;
const CANCEL_WARN = 3;
const CHURN_WARN = 14;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizeUrl(url) {
  try {
    const u = new URL(String(url || ''));
    u.hash = '';
    u.search = '';
    return u.toString();
  } catch {
    return String(url || '');
  }
}

function getHost(url) {
  try {
    return new URL(String(url || '')).host || '';
  } catch {
    return '';
  }
}

function isMediaEntry(entry) {
  const url = String(entry?.request?.url || '');
  const type = String(entry?._resourceType || '');
  const mime = String(entry?.response?.content?.mimeType || '');
  return (
    type === 'media' ||
    /^video\//i.test(mime) ||
    /^audio\//i.test(mime) ||
    MEDIA_EXT_RE.test(url)
  );
}

function classifyMediaUrl(url) {
  const value = String(url || '');
  if (FORUM_MEDIA_RE.test(value)) return 'forum';
  if (AD_MEDIA_RE.test(value)) return 'ad';
  return 'external';
}

function isCancelled(entry) {
  const status = Number(entry?.response?.status || 0);
  const err = String(entry?._error || '');
  const timings = entry?.timings || {};
  return (
    status === 0 ||
    /abort|cancel|failed/i.test(err) ||
    Number(timings.receive || 0) < 0
  );
}

function isPartialContent(entry) {
  const status = Number(entry?.response?.status || 0);
  if (status === 206) return true;
  const headers = Array.isArray(entry?.response?.headers) ? entry.response.headers : [];
  return headers.some((header) => {
    const name = String(header?.name || '').toLowerCase();
    const value = String(header?.value || '');
    return name === 'content-range' || /bytes\s+\d+-\d+\/\d+/i.test(value);
  });
}

function readTransferredBytes(entry) {
  const response = entry?.response || {};
  const explicitTransfer = Number(response?._transferSize || 0);
  if (Number.isFinite(explicitTransfer) && explicitTransfer > 0) return explicitTransfer;
  const bodySize = Number(response?.bodySize || 0);
  if (Number.isFinite(bodySize) && bodySize > 0) return bodySize;
  const contentSize = Number(response?.content?.size || 0);
  if (Number.isFinite(contentSize) && contentSize > 0) return contentSize;
  return 0;
}

function bumpMap(map, key, amount = 1) {
  map.set(key, Number(map.get(key) || 0) + amount);
}

function toSortedCounts(map, limit = 20) {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)))
    .slice(0, limit);
}

function buildRows(entries) {
  const rows = new Map();
  for (const entry of entries) {
    const rawUrl = String(entry?.request?.url || '');
    const url = normalizeUrl(rawUrl);
    const row = rows.get(url) || {
      url,
      category: classifyMediaUrl(rawUrl),
      host: getHost(rawUrl),
      total: 0,
      cancelled: 0,
      partial206: 0,
      transferred: 0,
      statuses: new Set(),
      types: new Set(),
      initiators: new Set(),
    };
    row.total += 1;
    if (isCancelled(entry)) row.cancelled += 1;
    if (isPartialContent(entry)) row.partial206 += 1;
    row.transferred += readTransferredBytes(entry);
    row.statuses.add(String(entry?.response?.status || entry?._error || ''));
    row.types.add(String(entry?._resourceType || entry?.response?.content?.mimeType || ''));
    row.initiators.add(String(entry?._initiator?.type || entry?.initiatorType || ''));
    rows.set(url, row);
  }
  return [...rows.values()]
    .map((row) => ({
      ...row,
      churnScore: row.total + (row.partial206 * 2) + (row.cancelled * 3),
      transferredMB: Math.round((row.transferred / 1024 / 1024) * 10) / 10,
      statuses: [...row.statuses],
      types: [...row.types],
      initiators: [...row.initiators],
    }))
    .sort((a, b) => {
      return (
        b.total - a.total ||
        b.partial206 - a.partial206 ||
        b.cancelled - a.cancelled ||
        String(a.url).localeCompare(String(b.url))
      );
    });
}

function summarizeCategory(rows, category) {
  const items = rows.filter((row) => row.category === category);
  return {
    entries: items.reduce((sum, row) => sum + row.total, 0),
    uniqueUrls: items.length,
    cancelled: items.reduce((sum, row) => sum + row.cancelled, 0),
    partial206: items.reduce((sum, row) => sum + row.partial206, 0),
    topRepeated: items.filter((row) => row.total >= 2).slice(0, 12),
  };
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node tools/analyze-forum-media-har.js <path-to-har>');
    process.exit(1);
  }

  const file = path.resolve(process.cwd(), input);
  const har = readJson(file);
  const entries = Array.isArray(har?.log?.entries) ? har.log.entries : [];
  const mediaEntries = entries.filter(isMediaEntry);
  const rows = buildRows(mediaEntries);

  const initiators = new Map();
  const hosts = new Map();
  const statuses = new Map();
  for (const entry of mediaEntries) {
    bumpMap(initiators, String(entry?._initiator?.type || entry?.initiatorType || ''));
    bumpMap(hosts, getHost(entry?.request?.url));
    bumpMap(statuses, String(entry?.response?.status || entry?._error || ''));
  }

  const forumRows = rows.filter((row) => row.category === 'forum');
  const adRows = rows.filter((row) => row.category === 'ad');
  const externalRows = rows.filter((row) => row.category === 'external');
  const repeatedForumMp4 = forumRows.filter((row) => /\.mp4$/i.test(row.url) && row.total >= 2);
  const repeatedAdMedia = adRows.filter((row) => row.total >= 2);
  const repeatedExternalMedia = externalRows.filter((row) => row.total >= 2);
  const partial206Entries = mediaEntries.filter(isPartialContent);

  const summary = {
    file,
    totalEntries: entries.length,
    mediaEntries: mediaEntries.length,
    forumMediaEntries: mediaEntries.filter((entry) => classifyMediaUrl(entry?.request?.url) === 'forum').length,
    adMediaEntries: mediaEntries.filter((entry) => classifyMediaUrl(entry?.request?.url) === 'ad').length,
    externalMediaEntries: mediaEntries.filter((entry) => classifyMediaUrl(entry?.request?.url) === 'external').length,
    diagEntries: entries.filter((entry) => String(entry?.request?.url || '').includes('/api/debug/forum-diag')).length,
    cancelledMediaEntries: mediaEntries.filter(isCancelled).length,
    partial206Entries: partial206Entries.length,
    partial206ForumEntries: partial206Entries.filter((entry) => classifyMediaUrl(entry?.request?.url) === 'forum').length,
    categories: {
      forum: summarizeCategory(rows, 'forum'),
      ad: summarizeCategory(rows, 'ad'),
      external: summarizeCategory(rows, 'external'),
    },
    uniqueMediaUrls: rows.length,
    repeatedForumMp4Count: repeatedForumMp4.length,
    repeatedAdMediaCount: repeatedAdMedia.length,
    repeatedExternalMediaCount: repeatedExternalMedia.length,
    maxRepeatOnSingleForumMp4: repeatedForumMp4[0]?.total || 0,
    topRepeatedForumMp4: repeatedForumMp4.slice(0, 20),
    topRepeatedAdMedia: repeatedAdMedia.slice(0, 20),
    topRepeatedExternalMedia: repeatedExternalMedia.slice(0, 20),
    topCancelled: rows.filter((row) => row.cancelled > 0).slice(0, 20),
    topChurn: rows.filter((row) => row.total >= 4).slice(0, 20),
    thresholdBreaches: {
      repeat: rows.filter((row) => row.category === 'forum' && row.total >= FORUM_REPEAT_WARN).slice(0, 20),
      cancelled: rows.filter((row) => row.cancelled >= CANCEL_WARN).slice(0, 20),
      churn: rows.filter((row) => row.churnScore >= CHURN_WARN).slice(0, 20),
    },
    initiatorCounts: toSortedCounts(initiators, 20),
    hostCounts: toSortedCounts(hosts, 20),
    statusCounts: toSortedCounts(statuses, 20),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main();
