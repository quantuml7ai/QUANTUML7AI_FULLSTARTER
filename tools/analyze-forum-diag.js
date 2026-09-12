#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function parseJsonl(file) {
  const text = fs.readFileSync(file, 'utf8');
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function maxBy(items, pick) {
  let best = null;
  let bestValue = -Infinity;
  for (const item of items) {
    const value = Number(pick(item));
    if (!Number.isFinite(value)) continue;
    if (value > bestValue) {
      bestValue = value;
      best = item;
    }
  }
  return best;
}

function countBy(items, pick) {
  const out = new Map();
  for (const item of items) {
    const key = String(pick(item) || '');
    out.set(key, Number(out.get(key) || 0) + 1);
  }
  return [...out.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function main() {
  const input = process.argv[2] || 'forum-diag.jsonl';
  const file = path.resolve(process.cwd(), input);
  const rows = parseJsonl(file);

  const peakHeap = maxBy(rows, (row) => row?.mem?.usedJSHeapSize || 0);
  const peakVideos = maxBy(rows, (row) => row?.videos || 0);
  const peakPlaying = maxBy(rows, (row) => row?.videosPlaying || 0);
  const focusSwitches = rows.filter((row) => row?.event === 'media_focus_switch');
  const iframeUnloads = rows.filter((row) => row?.event === 'iframe_hard_unload');
  const scrollEvents = rows.filter((row) => row?.event === 'scroll');

  const summary = {
    file,
    rows: rows.length,
    eventCounts: countBy(rows, (row) => row?.event).slice(0, 20),
    peakHeap: peakHeap
      ? {
          ts: peakHeap.ts,
          usedJSHeapSize: peakHeap.mem?.usedJSHeapSize || 0,
          videos: peakHeap.videos || 0,
          videosPlaying: peakHeap.videosPlaying || 0,
          iframesLoaded: peakHeap.iframesLoaded || 0,
        }
      : null,
    peakVideos: peakVideos
      ? {
          ts: peakVideos.ts,
          videos: peakVideos.videos || 0,
          videosPlaying: peakVideos.videosPlaying || 0,
          scrollY: peakVideos.scrollY || 0,
        }
      : null,
    peakPlaying: peakPlaying
      ? {
          ts: peakPlaying.ts,
          videos: peakPlaying.videos || 0,
          videosPlaying: peakPlaying.videosPlaying || 0,
          scrollY: peakPlaying.scrollY || 0,
        }
      : null,
    focusSwitches: focusSwitches.length,
    iframeUnloads: iframeUnloads.length,
    scrollEvents: scrollEvents.length,
    topFocusSwitchRatios: focusSwitches
      .map((row) => ({
        ts: row.ts,
        ratio: row?.extra?.ratio || 0,
        prevRatio: row?.extra?.prevRatio || 0,
        score: row?.extra?.score || 0,
        prevScore: row?.extra?.prevScore || 0,
      }))
      .sort((a, b) => Number(b.ratio || 0) - Number(a.ratio || 0))
      .slice(0, 15),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main();
