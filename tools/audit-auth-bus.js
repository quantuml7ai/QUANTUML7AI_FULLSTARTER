#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const path = require('path');

const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
const ignoreDirs = new Set(['node_modules', '.next', 'dist', 'build', 'out', '.git', '.turbo', '.vercel']);
const roots = ['app', 'components', 'lib'];
const trackedEvents = ['auth:ok', 'auth:success', 'auth:logout', 'open-auth', 'tg:link-status'];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (ignoreDirs.has(item.name)) continue;
      walk(full, out);
    } else if (exts.has(path.extname(item.name))) {
      out.push(full);
    }
  }
  return out;
}

function makeEventStats() {
  return trackedEvents.reduce((acc, event) => {
    acc[event] = { add: 0, remove: 0, dispatch: 0, files: new Set() };
    return acc;
  }, {});
}

function findHits(file, text) {
  const lines = text.split(/\r?\n/);
  const fileSummary = [];
  const eventStats = makeEventStats();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const event of trackedEvents) {
      const escaped = event.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const addRx = new RegExp(`\\baddEventListener\\s*\\(\\s*['"]${escaped}['"]`);
      const removeRx = new RegExp(`\\bremoveEventListener\\s*\\(\\s*['"]${escaped}['"]`);
      const dispatchRx = new RegExp(`\\bdispatchEvent\\s*\\(\\s*new\\s+(?:CustomEvent|Event)\\s*\\(\\s*['"]${escaped}['"]`);
      let kind = '';
      if (addRx.test(line)) kind = 'add';
      else if (removeRx.test(line)) kind = 'remove';
      else if (dispatchRx.test(line)) kind = 'dispatch';
      if (!kind) continue;
      eventStats[event][kind] += 1;
      eventStats[event].files.add(file);
      fileSummary.push({
        event,
        kind,
        line: index + 1,
        text: line.trim().slice(0, 220),
      });
    }
  }
  return { eventStats, fileSummary };
}

function main() {
  const root = process.cwd();
  const files = [];
  roots.forEach((folder) => walk(path.join(root, folder), files));

  const globalStats = makeEventStats();
  const byFile = [];
  for (const file of files) {
    let text = '';
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const { eventStats, fileSummary } = findHits(file, text);
    const totalHits = fileSummary.length;
    if (!totalHits) continue;
    byFile.push({ file, totalHits, hits: fileSummary });
    trackedEvents.forEach((event) => {
      globalStats[event].add += eventStats[event].add;
      globalStats[event].remove += eventStats[event].remove;
      globalStats[event].dispatch += eventStats[event].dispatch;
      eventStats[event].files.forEach((value) => globalStats[event].files.add(value));
    });
  }

  const report = trackedEvents.map((event) => ({
    event,
    add: globalStats[event].add,
    remove: globalStats[event].remove,
    dispatch: globalStats[event].dispatch,
    fileCount: globalStats[event].files.size,
  }));

  byFile.sort((a, b) => b.totalHits - a.totalHits || String(a.file).localeCompare(String(b.file)));

  console.log('\n=== Auth Bus Audit ===\n');
  report.forEach((row) => {
    console.log(`- ${row.event}: add=${row.add} remove=${row.remove} dispatch=${row.dispatch} files=${row.fileCount}`);
  });
  console.log('');
  byFile.slice(0, 20).forEach((item) => {
    console.log(`FILE: ${item.file}`);
    item.hits.slice(0, 10).forEach((hit) => {
      console.log(`  ${hit.kind}@${hit.line} [${hit.event}] ${hit.text}`);
    });
    console.log('');
  });

  const outPath = path.join(root, 'auth-bus.audit.report.json');
  fs.writeFileSync(outPath, JSON.stringify({
    root,
    generatedAt: new Date().toISOString(),
    summary: report,
    byFile,
  }, null, 2), 'utf8');
  console.log(`Saved: ${outPath}\n`);
}

main();
