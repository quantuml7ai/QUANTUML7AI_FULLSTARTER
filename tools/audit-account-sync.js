#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const includeRoots = [
  "app/api",
  "app/forum",
  "lib",
];
const exts = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const ignoreDirs = new Set(["node_modules", ".next", ".git", ".turbo", ".vercel", "dist", "build", "out"]);

const keys = [
  "accountId",
  "userId",
  "authorId",
  "wallet",
  "telegramId",
  "initData",
  "linked",
  "followers",
  "following",
  "bio",
  "nickname",
  "vip",
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (ignoreDirs.has(it.name)) continue;
      walk(full, out);
      continue;
    }
    if (!exts.has(path.extname(it.name))) continue;
    out.push(full);
  }
  return out;
}

function scanFile(file) {
  const txt = fs.readFileSync(file, "utf8");
  const lines = txt.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i];
    for (const k of keys) {
      if (s.includes(k)) hits.push({ key: k, line: i + 1, text: s.trim().slice(0, 180) });
    }
  }
  const uniq = [...new Set(hits.map((h) => h.key))];
  return { file, hits, uniq, score: hits.length };
}

function main() {
  const root = process.cwd();
  const files = [];
  for (const r of includeRoots) walk(path.join(root, r), files);
  const scanned = files.map(scanFile).filter((x) => x.hits.length > 0);
  scanned.sort((a, b) => b.score - a.score);

  console.log("\n=== Account Sync Audit (Forum/Web/TMA) ===\n");
  for (const r of scanned.slice(0, 25)) {
    console.log(`- ${r.file}`);
    console.log(`  score=${r.score} keys=[${r.uniq.join(", ")}]`);
    for (const h of r.hits.slice(0, 4)) {
      console.log(`    ${h.key}@${h.line}: ${h.text}`);
    }
    console.log("");
  }

  const summary = {
    scannedFiles: files.length,
    filesWithSyncKeys: scanned.length,
    keyFrequency: keys.reduce((acc, k) => {
      acc[k] = scanned.reduce((s, f) => s + f.hits.filter((h) => h.key === k).length, 0);
      return acc;
    }, {}),
  };

  const out = {
    root,
    generatedAt: new Date().toISOString(),
    summary,
    top: scanned,
  };
  const outPath = path.join(root, "account-sync-audit.report.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`Saved: ${outPath}\n`);
}

main();
