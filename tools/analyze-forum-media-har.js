#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const MEDIA_EXT_RE = /\.(mp4|webm|mov|m4v|m3u8|mp3|aac|wav)(\?|$)/i;
const FORUM_MEDIA_RE = /\/forum\/|blob\.vercel-storage\.com\/forum\//i;
const AD_MEDIA_RE = /(?:^|\/)(ads?|ad-media|campaign|sponsor)(?:\/|[-_])|ADS\.mp4|forum[_-]?ad/i;
const REPEAT_WINDOW_GAP_MS = 15_000;
const BURST_WINDOW_GAP_MS = 2_500;

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

function getPathname(url) {
  try {
    return new URL(String(url || '')).pathname || '';
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

function parseStartedAt(entry) {
  const raw = String(entry?.startedDateTime || '');
  const ms = Date.parse(raw);
  return {
    raw,
    ms: Number.isFinite(ms) ? ms : null,
  };
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
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
    const startedAt = parseStartedAt(entry);
    const partial206 = isPartialContent(entry);
    const cancelled = isCancelled(entry);
    const row = rows.get(url) || {
      url,
      category: classifyMediaUrl(rawUrl),
      host: getHost(rawUrl),
      routeSegment: getPathname(rawUrl).split('/').filter(Boolean)[0] || '',
      total: 0,
      cancelled: 0,
      partial206: 0,
      transferred: 0,
      statuses: new Set(),
      types: new Set(),
      initiators: new Set(),
      events: [],
      firstSeenMs: null,
      lastSeenMs: null,
    };
    row.total += 1;
    if (cancelled) row.cancelled += 1;
    if (partial206) row.partial206 += 1;
    row.transferred += readTransferredBytes(entry);
    row.statuses.add(String(entry?.response?.status || entry?._error || ''));
    row.types.add(String(entry?._resourceType || entry?.response?.content?.mimeType || ''));
    row.initiators.add(String(entry?._initiator?.type || entry?.initiatorType || ''));
    row.events.push({
      startedAt: startedAt.raw,
      startedMs: startedAt.ms,
      status: Number(entry?.response?.status || 0),
      cancelled,
      partial206,
      transferBytes: readTransferredBytes(entry),
      initiator: String(entry?._initiator?.type || entry?.initiatorType || ''),
    });
    if (startedAt.ms !== null) {
      row.firstSeenMs = row.firstSeenMs === null ? startedAt.ms : Math.min(row.firstSeenMs, startedAt.ms);
      row.lastSeenMs = row.lastSeenMs === null ? startedAt.ms : Math.max(row.lastSeenMs, startedAt.ms);
    }
    rows.set(url, row);
  }
  return [...rows.values()]
    .map((row) => ({
      ...row,
      transferredMB: Math.round((row.transferred / 1024 / 1024) * 10) / 10,
      firstSeenAt: row.firstSeenMs ? new Date(row.firstSeenMs).toISOString() : '',
      lastSeenAt: row.lastSeenMs ? new Date(row.lastSeenMs).toISOString() : '',
      statuses: [...row.statuses],
      types: [...row.types],
      initiators: [...row.initiators],
      events: row.events
        .sort((left, right) => {
          const leftMs = left.startedMs === null ? Number.MAX_SAFE_INTEGER : left.startedMs;
          const rightMs = right.startedMs === null ? Number.MAX_SAFE_INTEGER : right.startedMs;
          return leftMs - rightMs;
        }),
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

function classifyWindowTags(window, category) {
  const tags = [];
  if (window.count >= 4 && Number(window.maxGapMs || 0) <= BURST_WINDOW_GAP_MS) tags.push('burst-reload');
  if (window.count >= 2 && Number(window.durationMs || 0) > REPEAT_WINDOW_GAP_MS) tags.push('restore-like-repeat');
  if (window.partial206Count > 0 && window.cancelledCount > 0) tags.push('partial-then-cancel');
  if (window.count >= 2 && window.partial206Count >= Math.max(2, window.count - 1)) tags.push('same-src-thrash');
  if (category === 'ad' && window.count >= 2) tags.push('ad-repeat');
  if (category === 'external' && window.count >= 2) tags.push('external-runtime-repeat');
  return tags;
}

function buildWindowsForRow(row) {
  const windows = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    const avgGapMs = current.gaps.length
      ? Math.round(current.gaps.reduce((sum, value) => sum + value, 0) / current.gaps.length)
      : 0;
    const window = {
      index: windows.length + 1,
      count: current.count,
      repeatCount: Math.max(0, current.count - 1),
      partial206Count: current.partial206Count,
      cancelledCount: current.cancelledCount,
      transferredMB: round(current.transferred / 1024 / 1024, 2),
      firstAt: current.firstAt || '',
      lastAt: current.lastAt || '',
      durationMs: current.durationMs,
      minGapMs: current.gaps.length ? Math.min(...current.gaps) : 0,
      maxGapMs: current.gaps.length ? Math.max(...current.gaps) : 0,
      avgGapMs,
    };
    window.tags = classifyWindowTags(window, row.category);
    windows.push(window);
    current = null;
  };

  for (const event of row.events) {
    const previousMs = current?.lastMs ?? null;
    const gapMs = previousMs !== null && event.startedMs !== null ? event.startedMs - previousMs : null;
    const shouldStartNewWindow =
      !current ||
      gapMs === null ||
      gapMs > REPEAT_WINDOW_GAP_MS;

    if (shouldStartNewWindow) flush();
    if (!current) {
      current = {
        count: 0,
        partial206Count: 0,
        cancelledCount: 0,
        transferred: 0,
        firstAt: event.startedAt,
        lastAt: event.startedAt,
        firstMs: event.startedMs,
        lastMs: event.startedMs,
        durationMs: 0,
        gaps: [],
      };
    } else if (gapMs !== null) {
      current.gaps.push(gapMs);
    }

    current.count += 1;
    current.partial206Count += event.partial206 ? 1 : 0;
    current.cancelledCount += event.cancelled ? 1 : 0;
    current.transferred += Number(event.transferBytes || 0);
    current.lastAt = event.startedAt || current.lastAt;
    current.lastMs = event.startedMs;
    current.durationMs =
      current.firstMs !== null && current.lastMs !== null
        ? Math.max(0, current.lastMs - current.firstMs)
        : 0;
  }

  flush();
  return windows;
}

function countWindowTags(rows) {
  const counts = new Map();
  rows.forEach((row) => {
    row.sameSrcWindows.forEach((window) => {
      window.tags.forEach((tag) => bumpMap(counts, tag));
    });
  });
  return toSortedCounts(counts, 20);
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
  const rows = buildRows(mediaEntries).map((row) => {
    const sameSrcWindows = buildWindowsForRow(row);
    return {
      ...row,
      sameSrcWindows,
      sameSrcWindowCount: sameSrcWindows.length,
      repeatedWindowCount: sameSrcWindows.filter((window) => window.count >= 2).length,
      peakWindowRepeatCount: sameSrcWindows.reduce((max, window) => Math.max(max, Number(window.count || 0)), 0),
      hasPartialThenCancel: sameSrcWindows.some((window) => window.tags.includes('partial-then-cancel')),
    };
  });

  const initiators = new Map();
  const hosts = new Map();
  const statuses = new Map();
  const routeSegments = new Map();
  for (const entry of mediaEntries) {
    bumpMap(initiators, String(entry?._initiator?.type || entry?.initiatorType || ''));
    bumpMap(hosts, getHost(entry?.request?.url));
    bumpMap(statuses, String(entry?.response?.status || entry?._error || ''));
    bumpMap(routeSegments, getPathname(entry?.request?.url).split('/').filter(Boolean)[0] || '');
  }

  const forumRows = rows.filter((row) => row.category === 'forum');
  const adRows = rows.filter((row) => row.category === 'ad');
  const externalRows = rows.filter((row) => row.category === 'external');
  const repeatedForumMp4 = forumRows.filter((row) => /\.mp4$/i.test(row.url) && row.total >= 2);
  const repeatedAdMedia = adRows.filter((row) => row.total >= 2);
  const repeatedExternalMedia = externalRows.filter((row) => row.total >= 2);
  const partial206Entries = mediaEntries.filter(isPartialContent);
  const sameSrcWindows = rows.flatMap((row) => row.sameSrcWindows.map((window) => ({
    url: row.url,
    category: row.category,
    host: row.host,
    routeSegment: row.routeSegment,
    ...window,
  })));
  const repeatedWindows = sameSrcWindows.filter((window) => window.count >= 2);
  const highRepeatWindows = repeatedWindows.filter((window) => window.count >= 4);
  const cancelledAfterPartialCount = sameSrcWindows.reduce((sum, window) => {
    if (!window.tags.includes('partial-then-cancel')) return sum;
    return sum + Number(window.cancelledCount || 0);
  }, 0);
  const metrics = {
    firstRequestCount: rows.length,
    repeatRequestCount: Math.max(0, mediaEntries.length - rows.length),
    cancelledMediaRatio: round(mediaEntries.length ? mediaEntries.filter(isCancelled).length / mediaEntries.length : 0, 4),
    partial206MediaRatio: round(mediaEntries.length ? partial206Entries.length / mediaEntries.length : 0, 4),
    forumPartial206Ratio: round(
      forumRows.reduce((sum, row) => sum + row.total, 0)
        ? forumRows.reduce((sum, row) => sum + row.partial206, 0) / forumRows.reduce((sum, row) => sum + row.total, 0)
        : 0,
      4,
    ),
    repeatedWindowCount: repeatedWindows.length,
    highRepeatWindowCount: highRepeatWindows.length,
    cancelledAfterPartialCount,
    partialThenCancelUrlCount: rows.filter((row) => row.hasPartialThenCancel).length,
  };
  const failSignals = {
    sameSrcThrashDetected: repeatedForumMp4.some((row) => Number(row.total || 0) > 3),
    forum206StormDetected: partial206Entries.filter((entry) => classifyMediaUrl(entry?.request?.url) === 'forum').length > 3,
    cancelAfterPartialDetected: cancelledAfterPartialCount > 0,
    adRepeatStormDetected: repeatedAdMedia.some((row) => Number(row.total || 0) > 3),
    externalMediaRepeatDetected: repeatedExternalMedia.some((row) => Number(row.total || 0) > 3),
  };

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
    telemetryCoverage: {
      routeSegments: toSortedCounts(routeSegments, 20),
      runtimeMarkersPresent: entries.some((entry) => String(entry?.request?.url || '').includes('/api/debug/forum-diag')),
      ownerChangeCorrelationAvailable: false,
      visibilityRestoreCorrelationAvailable: false,
    },
    uniqueMediaUrls: rows.length,
    repeatedForumMp4Count: repeatedForumMp4.length,
    repeatedAdMediaCount: repeatedAdMedia.length,
    repeatedExternalMediaCount: repeatedExternalMedia.length,
    maxRepeatOnSingleForumMp4: repeatedForumMp4[0]?.total || 0,
    sameSrcWindowCount: sameSrcWindows.length,
    metrics,
    failSignals,
    topRepeatedForumMp4: repeatedForumMp4.slice(0, 20),
    topRepeatedAdMedia: repeatedAdMedia.slice(0, 20),
    topRepeatedExternalMedia: repeatedExternalMedia.slice(0, 20),
    topCancelled: rows.filter((row) => row.cancelled > 0).slice(0, 20),
    topChurn: rows.filter((row) => row.total >= 4).slice(0, 20),
    topSameSrcWindows: repeatedWindows
      .sort((left, right) => {
        return (
          right.count - left.count ||
          right.partial206Count - left.partial206Count ||
          right.cancelledCount - left.cancelledCount ||
          String(left.url).localeCompare(String(right.url))
        );
      })
      .slice(0, 20),
    sameSrcWindowTags: countWindowTags(rows),
    initiatorCounts: toSortedCounts(initiators, 20),
    hostCounts: toSortedCounts(hosts, 20),
    statusCounts: toSortedCounts(statuses, 20),
  };

  const outPath = path.join(process.cwd(), 'forum-media-har.report.json');
  fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Saved: ${outPath}`);
}

main();
