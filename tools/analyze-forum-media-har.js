#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

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

function isMediaEntry(entry) {
  const url = String(entry?.request?.url || '');
  const type = String(entry?._resourceType || '');
  const mime = String(entry?.response?.content?.mimeType || '');
  return (
    type === 'media' ||
    /^video\//i.test(mime) ||
    /^audio\//i.test(mime) ||
    /\.(mp4|webm|mov|m4v|m3u8|mp3|aac|wav)(\?|$)/i.test(url)
  );
}

function isCancelled(entry) {
  const status = Number(entry?.response?.status || 0);
  const err = String(entry?._error || '');
  const timings = entry?.timings || {};
  return (
    status === 0 ||
    /abort|cancel|failed/i.test(err) ||
    timings.receive < 0
  );
}

function toRows(entries) {
  const rows = new Map();
  for (const entry of entries) {
    const url = String(entry?.request?.url || '');
    const key = normalizeUrl(url);
    const row = rows.get(key) || {
      url: key,
      total: 0,
      cancelled: 0,
      transferred: 0,
      statuses: new Set(),
      types: new Set(),
      initiators: new Set(),
    };
    row.total += 1;
    if (isCancelled(entry)) row.cancelled += 1;
    row.transferred += Number(entry?.response?.bodySize || 0) || 0;
    row.statuses.add(String(entry?.response?.status || entry?._error || ''));
    row.types.add(String(entry?._resourceType || entry?.response?.content?.mimeType || ''));
    row.initiators.add(String(entry?._initiator?.type || ''));
    rows.set(key, row);
  }
  return [...rows.values()]
    .map((row) => ({
      ...row,
      statuses: [...row.statuses],
      types: [...row.types],
      initiators: [...row.initiators],
    }))
    .sort((a, b) => b.cancelled - a.cancelled || b.total - a.total);
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
  const forumMedia = mediaEntries.filter((entry) => /\/forum\//i.test(String(entry?.request?.url || '')));
  const adMedia = mediaEntries.filter((entry) => /ADS\.mp4|\/ads\//i.test(String(entry?.request?.url || '')));
  const diagEntries = entries.filter((entry) => String(entry?.request?.url || '').includes('/api/debug/forum-diag'));

  const byUrl = toRows(mediaEntries);
  const topCancelled = byUrl.filter((row) => row.cancelled > 0).slice(0, 20);
  const topChurn = byUrl.filter((row) => row.total >= 4).slice(0, 20);

  const summary = {
    file,
    totalEntries: entries.length,
    mediaEntries: mediaEntries.length,
    forumMediaEntries: forumMedia.length,
    adMediaEntries: adMedia.length,
    diagEntries: diagEntries.length,
    cancelledMediaEntries: mediaEntries.filter(isCancelled).length,
    topCancelled,
    topChurn,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main();
