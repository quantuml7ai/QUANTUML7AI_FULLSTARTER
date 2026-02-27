#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const exts = new Set([".js", ".jsx", ".ts", ".tsx"]);
const ignoreDirs = new Set(["node_modules", ".next", ".git", ".turbo", ".vercel", "dist", "build", "out"]);
const roots = ["app", "components", "lib"];

const patterns = [
  { k: "for-loop", rx: /\bfor\s*\(/g },
  { k: "while-loop", rx: /\bwhile\s*\(/g },
  { k: "map-chain", rx: /\.map\(.+\)\.map\(/g },
  { k: "filter-map", rx: /\.filter\(.+\)\.map\(/g },
  { k: "layout-read", rx: /\b(getBoundingClientRect|offsetHeight|offsetWidth|clientHeight|clientWidth)\b/g },
  { k: "sync-json", rx: /\bJSON\.parse\(|\bJSON\.stringify\(/g },
  { k: "local-storage", rx: /\blocalStorage\./g },
  { k: "session-storage", rx: /\bsessionStorage\./g },
  { k: "network-call", rx: /\bfetch\s*\(|axios\.|new\s+XMLHttpRequest\b/g },
  { k: "raf", rx: /\brequestAnimationFrame\s*\(/g },
  { k: "interval", rx: /\bsetInterval\s*\(/g },
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
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const counts = {};
  for (const p of patterns) {
    counts[p.k] = (text.match(p.rx) || []).length;
  }
  const longLines = lines
    .map((s, i) => ({ i: i + 1, len: s.length, text: s.trim() }))
    .filter((x) => x.len > 180)
    .slice(0, 12);
  const score =
    counts["for-loop"] * 2 +
    counts["while-loop"] * 3 +
    counts["layout-read"] * 3 +
    counts["network-call"] * 2 +
    counts["raf"] * 2 +
    counts["interval"] * 2 +
    longLines.length;
  return { file, counts, longLines, score };
}

function main() {
  const root = process.cwd();
  const files = [];
  for (const r of roots) walk(path.join(root, r), files);
  const report = files.map(scanFile).sort((a, b) => b.score - a.score);

  console.log("\n=== Runtime Hotspots Audit ===\n");
  for (const r of report.slice(0, 20)) {
    console.log(`- ${r.file}`);
    console.log(
      `  score=${r.score} loops=${r.counts["for-loop"] + r.counts["while-loop"]} layout=${r.counts["layout-read"]} net=${r.counts["network-call"]} raf=${r.counts.raf} interval=${r.counts.interval}`
    );
    if (r.longLines.length) {
      const sample = r.longLines[0];
      console.log(`  long-line@${sample.i}: ${sample.text.slice(0, 140)}`);
    }
    console.log("");
  }

  const out = {
    root,
    generatedAt: new Date().toISOString(),
    report,
  };
  const outPath = path.join(root, "runtime-hotspots.report.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`Saved: ${outPath}\n`);
}

main();
