#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const exts = new Set([".js", ".jsx", ".ts", ".tsx"]);
const ignoreDirs = new Set(["node_modules", ".next", "dist", "build", "out", ".git", ".turbo", ".vercel"]);

function walk(dir, out = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (ignoreDirs.has(it.name)) continue;
      walk(full, out);
    } else {
      const ext = path.extname(it.name);
      if (exts.has(ext)) out.push(full);
    }
  }
  return out;
}

function findLines(text, rx) {
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (rx.test(lines[i])) hits.push({ line: i + 1, text: lines[i].trim() });
    rx.lastIndex = 0;
  }
  return hits;
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const files = walk(root);

  const results = [];
  for (const f of files) {
    let t;
    try { t = fs.readFileSync(f, "utf8"); } catch { continue; }

    const video = findLines(t, /<video\b/i);
    const autoplay = findLines(t, /\bautoPlay\b|autoplay\s*=/i);
    const loop = findLines(t, /\bloop\b/i);
    const preload = findLines(t, /\bpreload\s*=/i);

    const img = findLines(t, /<img\b/i);
    const lazy = findLines(t, /\bloading\s*=\s*["']lazy["']/i);

    const create = findLines(t, /\bURL\.createObjectURL\s*\(/);
    const revoke = findLines(t, /\bURL\.revokeObjectURL\s*\(/);

    if (video.length || autoplay.length || loop.length || preload.length || img.length || create.length) {
      const flags = [];
      if (video.length && autoplay.length) flags.push("⚠ video + autoplay");
      if (video.length && loop.length) flags.push("⚠ video + loop");
      if (video.length && preload.length) flags.push("⚠ video + preload");
      if (img.length >= 5 && lazy.length === 0) flags.push("⚠ много img без loading=lazy");
      if (create.length > revoke.length) flags.push("⚠ createObjectURL > revokeObjectURL");

      results.push({
        file: f,
        counts: { video: video.length, autoplay: autoplay.length, loop: loop.length, preload: preload.length, img: img.length, lazy: lazy.length, create: create.length, revoke: revoke.length },
        flags,
        samples: {
          video: video.slice(0, 3),
          autoplay: autoplay.slice(0, 3),
          img: img.slice(0, 3),
          create: create.slice(0, 3),
        }
      });
    }
  }

  results.sort((a, b) => {
    const sa = a.counts.video * 6 + a.counts.autoplay * 6 + a.counts.loop * 4 + a.counts.preload * 3 + a.counts.img + (a.counts.create - a.counts.revoke) * 10;
    const sb = b.counts.video * 6 + b.counts.autoplay * 6 + b.counts.loop * 4 + b.counts.preload * 3 + b.counts.img + (b.counts.create - b.counts.revoke) * 10;
    return sb - sa;
  });

  console.log("\n=== Media Audit: TOP ===\n");
  for (const r of results.slice(0, 20)) {
    console.log(`- ${r.file}`);
    console.log(`  video=${r.counts.video} autoplay=${r.counts.autoplay} loop=${r.counts.loop} preload=${r.counts.preload} img=${r.counts.img} lazy=${r.counts.lazy} create=${r.counts.create} revoke=${r.counts.revoke}`);
    for (const f of r.flags) console.log(`  ${f}`);
    for (const [k, arr] of Object.entries(r.samples)) {
      for (const s of arr) console.log(`    ${k}@${s.line}: ${s.text.slice(0, 140)}`);
    }
    console.log("");
  }

  const out = path.join(root, "media-audit.report.json");
  fs.writeFileSync(out, JSON.stringify({ root, generatedAt: new Date().toISOString(), results }, null, 2), "utf8");
  console.log(`Saved: ${out}\n`);
}

main();
