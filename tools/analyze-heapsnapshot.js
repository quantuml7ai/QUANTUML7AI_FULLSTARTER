#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const path = require('path');

const HEADER_SCAN_MAX_BYTES = 8 * 1024 * 1024;
const CHUNK_SIZE = 1024 * 1024;
const KEYWORDS = [
  'detached',
  'htmlvideoelement',
  'htmlaudioelement',
  'htmliframeelement',
  'intersectionobserver',
  'resizeobserver',
  '__forum',
  'forumads',
  'useforummediacoordinator',
  'web3modal',
  'wagmi',
  'youtube',
  'tiktok',
];
const KEYWORD_GROUPS = Object.freeze({
  mediaDom: ['htmlvideoelement', 'htmlaudioelement', 'htmliframeelement'],
  observers: ['intersectionobserver', 'resizeobserver'],
  forumRuntime: ['__forum', 'forumads', 'useforummediacoordinator'],
  sdkRuntimes: ['web3modal', 'wagmi', 'youtube', 'tiktok'],
});

function readHeaderMeta(file) {
  const fd = fs.openSync(file, 'r');
  try {
    let bytesToRead = 512 * 1024;
    while (bytesToRead <= HEADER_SCAN_MAX_BYTES) {
      const buffer = Buffer.allocUnsafe(bytesToRead);
      const read = fs.readSync(fd, buffer, 0, bytesToRead, 0);
      const text = buffer.toString('utf8', 0, read);
      const match = text.match(/"snapshot"\s*:\s*(\{[\s\S]*?\})\s*,\s*"nodes"\s*:\s*\[/);
      if (match) {
        return JSON.parse(match[1]);
      }
      bytesToRead *= 2;
    }
  } finally {
    fs.closeSync(fd);
  }
  throw new Error('Unable to parse heapsnapshot header metadata');
}

async function analyzeNodes(file, nodeTypes, nodeFieldCount) {
  return new Promise((resolve, reject) => {
    const typeStats = new Map();
    let totalSelfSize = 0;
    let totalNodes = 0;
    let detachedNodes = 0;
    let detachedSelfSize = 0;
    let started = false;
    let searchBuffer = '';
    let fieldIndex = 0;
    let currentType = 0;
    let currentSelfSize = 0;
    let numberBuffer = '';
    let finished = false;

    const stream = fs.createReadStream(file, { encoding: 'utf8', highWaterMark: CHUNK_SIZE });

    const getTypeStat = (typeIndex) => {
      const typeName = String(nodeTypes[typeIndex] || `type_${typeIndex}`);
      if (!typeStats.has(typeName)) {
        typeStats.set(typeName, {
          type: typeName,
          count: 0,
          selfSize: 0,
          detachedCount: 0,
          detachedSelfSize: 0,
          maxSelfSize: 0,
        });
      }
      return typeStats.get(typeName);
    };

    const finalizeNode = (detachedness) => {
      const stat = getTypeStat(currentType);
      const size = Number(currentSelfSize || 0);
      const detached = Number(detachedness || 0) > 0;
      totalNodes += 1;
      totalSelfSize += size;
      stat.count += 1;
      stat.selfSize += size;
      stat.maxSelfSize = Math.max(stat.maxSelfSize, size);
      if (detached) {
        detachedNodes += 1;
        detachedSelfSize += size;
        stat.detachedCount += 1;
        stat.detachedSelfSize += size;
      }
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      try { stream.destroy(); } catch {}
      const stats = [...typeStats.values()]
        .map((row) => ({
          ...row,
          selfSizeMB: Math.round((row.selfSize / 1024 / 1024) * 100) / 100,
          detachedSelfSizeMB: Math.round((row.detachedSelfSize / 1024 / 1024) * 100) / 100,
          maxSelfSizeKB: Math.round((row.maxSelfSize / 1024) * 100) / 100,
        }))
        .sort((a, b) => b.selfSize - a.selfSize || b.count - a.count);
      const typeTotals = Object.fromEntries(
        stats.map((row) => [row.type, {
          count: row.count,
          selfSize: row.selfSize,
          selfSizeMB: row.selfSizeMB,
          detachedCount: row.detachedCount,
          detachedSelfSize: row.detachedSelfSize,
          detachedSelfSizeMB: row.detachedSelfSizeMB,
        }]),
      );
      resolve({
        totalNodes,
        totalSelfSize,
        totalSelfSizeMB: Math.round((totalSelfSize / 1024 / 1024) * 100) / 100,
        detachedNodes,
        detachedSelfSize,
        detachedSelfSizeMB: Math.round((detachedSelfSize / 1024 / 1024) * 100) / 100,
        typeTotals,
        topTypesBySelfSize: stats.slice(0, 16),
        topTypesByDetachedSize: stats
          .filter((row) => row.detachedCount > 0)
          .sort((a, b) => b.detachedSelfSize - a.detachedSelfSize || b.detachedCount - a.detachedCount)
          .slice(0, 16),
      });
    };

    stream.on('data', (chunk) => {
      if (finished) return;
      let text = chunk;
      if (!started) {
        searchBuffer += text;
        const marker = '"nodes":[';
        const index = searchBuffer.indexOf(marker);
        if (index === -1) {
          searchBuffer = searchBuffer.slice(-marker.length);
          return;
        }
        text = searchBuffer.slice(index + marker.length);
        searchBuffer = '';
        started = true;
      }

      for (let index = 0; index < text.length; index += 1) {
        const ch = text[index];
        const isDigit = (ch >= '0' && ch <= '9') || ch === '-';
        if (isDigit) {
          numberBuffer += ch;
          continue;
        }
        if ((ch === ',' || ch === ']') && numberBuffer.length) {
          const value = Number(numberBuffer);
          numberBuffer = '';
          if (fieldIndex === 0) currentType = value;
          if (fieldIndex === 3) currentSelfSize = value;
          if (fieldIndex === nodeFieldCount - 1) finalizeNode(value);
          fieldIndex = (fieldIndex + 1) % nodeFieldCount;
        }
        if (ch === ']') {
          finish();
          return;
        }
      }
    });

    stream.on('end', finish);
    stream.on('error', (error) => {
      if (finished) return;
      reject(error);
    });
  });
}

async function scanKeywords(file, keywords) {
  const normalized = keywords.map((keyword) => String(keyword).toLowerCase());
  const longest = normalized.reduce((max, keyword) => Math.max(max, keyword.length), 0);
  const counts = Object.fromEntries(normalized.map((keyword) => [keyword, 0]));
  let carry = '';
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file, { encoding: 'utf8', highWaterMark: CHUNK_SIZE });
    stream.on('data', (chunk) => {
      const text = (carry + chunk).toLowerCase();
      const safeLength = Math.max(0, text.length - Math.max(1, longest - 1));
      const scanText = text.slice(0, safeLength);
      normalized.forEach((keyword) => {
        let offset = 0;
        while (offset >= 0) {
          const next = scanText.indexOf(keyword, offset);
          if (next === -1) break;
          counts[keyword] += 1;
          offset = next + keyword.length;
        }
      });
      carry = text.slice(safeLength);
    });
    stream.on('end', () => {
      if (carry) {
        normalized.forEach((keyword) => {
          let offset = 0;
          while (offset >= 0) {
            const next = carry.indexOf(keyword, offset);
            if (next === -1) break;
            counts[keyword] += 1;
            offset = next + keyword.length;
          }
        });
      }
      resolve();
    });
    stream.on('error', reject);
  });
  return Object.entries(counts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword));
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node tools/analyze-heapsnapshot.js <path-to-heapsnapshot>');
    process.exit(1);
  }

  const file = path.resolve(process.cwd(), input);
  const stat = fs.statSync(file);
  const snapshot = readHeaderMeta(file);
  const nodeFieldCount = Array.isArray(snapshot?.meta?.node_fields) ? snapshot.meta.node_fields.length : 0;
  const nodeTypes = snapshot?.meta?.node_types?.[0];
  if (!nodeFieldCount || !Array.isArray(nodeTypes)) {
    throw new Error('Heapsnapshot metadata is missing node fields/types');
  }

  const [nodeSummary, keywordSummary] = await Promise.all([
    analyzeNodes(file, nodeTypes, nodeFieldCount),
    scanKeywords(file, KEYWORDS),
  ]);
  const keywordMap = new Map(keywordSummary.map((row) => [String(row.keyword || '').toLowerCase(), Number(row.count || 0)]));
  const typeTotals = nodeSummary.typeTotals || {};
  const nativeSelfSize = Number(typeTotals.native?.selfSize || 0);
  const mediaGroupSummary = Object.fromEntries(
    Object.entries(KEYWORD_GROUPS).map(([group, keywords]) => {
      const counts = Object.fromEntries(
        keywords.map((keyword) => [keyword, Number(keywordMap.get(keyword) || 0)]),
      );
      const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
      return [group, { total, counts }];
    }),
  );
  const ratios = {
    nativeToSelfRatio: nodeSummary.totalSelfSize ? Number((nativeSelfSize / nodeSummary.totalSelfSize).toFixed(4)) : 0,
    detachedToSelfRatio: nodeSummary.totalSelfSize ? Number((nodeSummary.detachedSelfSize / nodeSummary.totalSelfSize).toFixed(4)) : 0,
    detachedToNativeRatio: nativeSelfSize ? Number((nodeSummary.detachedSelfSize / nativeSelfSize).toFixed(4)) : 0,
  };
  const failSignals = {
    iframePresenceElevated: Number(keywordMap.get('htmliframeelement') || 0) > 1,
    mediaDomPresenceElevated: Number(mediaGroupSummary.mediaDom?.total || 0) > 20,
    observerDensityElevated: Number(mediaGroupSummary.observers?.total || 0) > 25,
    sdkRuntimePresenceElevated: Number(mediaGroupSummary.sdkRuntimes?.total || 0) > 40,
    detachedLeakElevated: Number(ratios.detachedToSelfRatio || 0) > 0.03,
  };

  const summary = {
    file,
    fileSizeMB: Math.round((Number(stat.size || 0) / 1024 / 1024) * 100) / 100,
    snapshot: {
      nodeCount: Number(snapshot?.node_count || 0),
      edgeCount: Number(snapshot?.edge_count || 0),
      extraNativeBytesMB: Math.round((Number(snapshot?.extra_native_bytes || 0) / 1024 / 1024) * 100) / 100,
    },
    nodes: nodeSummary,
    keywordHits: keywordSummary.slice(0, 24),
  };
  const verifyReport = {
    file,
    generatedAt: new Date().toISOString(),
    snapshot: summary.snapshot,
    fileSizeMB: summary.fileSizeMB,
    heapDiscipline: {
      totalSelfSizeMB: nodeSummary.totalSelfSizeMB,
      detachedNodes: nodeSummary.detachedNodes,
      detachedSelfSizeMB: nodeSummary.detachedSelfSizeMB,
      ratios,
      topTypesBySelfSize: nodeSummary.topTypesBySelfSize.slice(0, 10),
      topTypesByDetachedSize: nodeSummary.topTypesByDetachedSize.slice(0, 10),
    },
    runtimeGroups: mediaGroupSummary,
    failSignals,
    calibrationSignals: {
      nodeCount: Number(summary.snapshot.nodeCount || 0),
      edgeCount: Number(summary.snapshot.edgeCount || 0),
      htmlVideoKeywordHits: Number(keywordMap.get('htmlvideoelement') || 0),
      htmlAudioKeywordHits: Number(keywordMap.get('htmlaudioelement') || 0),
      htmlIframeKeywordHits: Number(keywordMap.get('htmliframeelement') || 0),
      youtubeKeywordHits: Number(keywordMap.get('youtube') || 0),
      wagmiKeywordHits: Number(keywordMap.get('wagmi') || 0),
      web3modalKeywordHits: Number(keywordMap.get('web3modal') || 0),
    },
  };

  const outPath = path.join(process.cwd(), 'heapsnapshot-analysis.report.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
  const verifyOutPath = path.join(process.cwd(), 'media-heap.verify.report.json');
  fs.writeFileSync(verifyOutPath, JSON.stringify(verifyReport, null, 2), 'utf8');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Saved: ${outPath}`);
  console.log(JSON.stringify(verifyReport, null, 2));
  console.log(`Saved: ${verifyOutPath}`);
}

main().catch((error) => {
  console.error(String(error?.stack || error?.message || error));
  process.exit(1);
});
