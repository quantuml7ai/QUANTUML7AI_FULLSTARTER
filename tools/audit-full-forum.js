#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const exts = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const ignoreDirs = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  ".vercel",
  "dist",
  "build",
  "out",
]);

const R = {
  addEvt: /\baddEventListener\s*\(/g,
  remEvt: /\bremoveEventListener\s*\(/g,
  setInt: /\bsetInterval\s*\(/g,
  clrInt: /\bclearInterval\s*\(/g,
  setTo: /\bsetTimeout\s*\(/g,
  raf: /\brequestAnimationFrame\s*\(/g,
  caf: /\bcancelAnimationFrame\s*\(/g,
  rect: /\bgetBoundingClientRect\s*\(/g,
  qsa: /\bquerySelectorAll\s*\(/g,
  video: /<video\b/gi,
  autoplay: /\bautoPlay\b|autoplay\s*=/gi,
  loop: /\bloop\b/gi,
  preload: /\bpreload\s*=/gi,
  createUrl: /\bURL\.createObjectURL\s*\(/g,
  revokeUrl: /\bURL\.revokeObjectURL\s*\(/g,
  fetch: /\bfetch\s*\(/g,
  redis: /\bredis\b|ioredis|upstash/gi,
  accountKeys: /\b(accountId|userId|authorId|wallet|telegramId|linked|initData)\b/g,
  unicodeEscape: /\\u[0-9a-fA-F]{4}/g,
  mojibake: /(?:Р.|Ð.|Ñ.){3,}/g,
};

function walk(dir, out = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (ignoreDirs.has(it.name)) continue;
      walk(full, out);
      continue;
    }
    const ext = path.extname(it.name);
    if (!exts.has(ext)) continue;
    out.push(full);
  }
  return out;
}

function count(text, rx) {
  const m = text.match(rx);
  return m ? m.length : 0;
}

function score(c) {
  return (
    (c.video || 0) * 6 +
    (c.autoplay || 0) * 6 +
    (c.loop || 0) * 4 +
    (c.preload || 0) * 3 +
    (c.raf || 0) * 2 +
    (c.setInt || 0) * 2 +
    (c.rect || 0) * 2 +
    Math.max(0, (c.addEvt || 0) - (c.remEvt || 0)) * 4 +
    Math.max(0, (c.createUrl || 0) - (c.revokeUrl || 0)) * 8 +
    (c.unicodeEscape || 0) * 6 +
    (c.mojibake || 0) * 7
  );
}

function isForumScope(file) {
  const f = file.replace(/\\/g, "/");
  return (
    f.includes("/app/forum/") ||
    f.includes("/app/api/forum/") ||
    f.endsWith("/components/i18n.js") ||
    f.includes("/lib/forum")
  );
}

function scanFile(file) {
  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const c = {
    addEvt: count(text, R.addEvt),
    remEvt: count(text, R.remEvt),
    setInt: count(text, R.setInt),
    clrInt: count(text, R.clrInt),
    setTo: count(text, R.setTo),
    raf: count(text, R.raf),
    caf: count(text, R.caf),
    rect: count(text, R.rect),
    qsa: count(text, R.qsa),
    video: count(text, R.video),
    autoplay: count(text, R.autoplay),
    loop: count(text, R.loop),
    preload: count(text, R.preload),
    createUrl: count(text, R.createUrl),
    revokeUrl: count(text, R.revokeUrl),
    fetch: count(text, R.fetch),
    redis: count(text, R.redis),
    accountKeys: count(text, R.accountKeys),
    unicodeEscape: count(text, R.unicodeEscape),
    mojibake: count(text, R.mojibake),
  };

  const flags = [];
  if (c.addEvt > c.remEvt) flags.push(`event-listeners imbalance (${c.addEvt}/${c.remEvt})`);
  if (c.setInt > c.clrInt) flags.push(`interval imbalance (${c.setInt}/${c.clrInt})`);
  if (c.raf > c.caf) flags.push(`raf imbalance (${c.raf}/${c.caf})`);
  if (c.createUrl > c.revokeUrl) flags.push(`objectURL imbalance (${c.createUrl}/${c.revokeUrl})`);
  if (c.video && c.autoplay) flags.push("video + autoplay");
  if (c.rect >= 10) flags.push(`many layout reads (${c.rect})`);
  if (c.unicodeEscape > 0) flags.push(`unicode escapes found (${c.unicodeEscape})`);
  if (c.mojibake > 0) flags.push(`possible mojibake found (${c.mojibake})`);

  return {
    file,
    forumScope: isForumScope(file),
    counts: c,
    flags,
    score: score(c),
  };
}

function aggregate(files) {
  const sum = {};
  for (const f of files) {
    for (const [k, v] of Object.entries(f.counts || {})) {
      sum[k] = (sum[k] || 0) + Number(v || 0);
    }
  }
  return sum;
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const files = walk(root);
  const scanned = files.map(scanFile).filter(Boolean);
  const relevant = scanned.filter((x) => x.score > 0 || x.flags.length > 0);
  const top = [...relevant].sort((a, b) => b.score - a.score).slice(0, 40);
  const forumFiles = scanned.filter((x) => x.forumScope);
  const forumTop = [...forumFiles].sort((a, b) => b.score - a.score).slice(0, 25);

  const summary = {
    projectFilesScanned: scanned.length,
    forumFilesScanned: forumFiles.length,
    projectTotals: aggregate(scanned),
    forumTotals: aggregate(forumFiles),
    forumRiskFiles: forumFiles.filter((x) => x.flags.length > 0).length,
    unicodeEscapeFiles: scanned.filter((x) => x.counts.unicodeEscape > 0).length,
    mojibakeFiles: scanned.filter((x) => x.counts.mojibake > 0).length,
  };

  console.log("\n=== Full Deep Audit: Project Summary ===");
  console.log(`files scanned: ${summary.projectFilesScanned}`);
  console.log(`forum scope files: ${summary.forumFilesScanned}`);
  console.log(`forum risk files: ${summary.forumRiskFiles}`);
  console.log(`unicode escape files: ${summary.unicodeEscapeFiles}`);
  console.log(`mojibake candidate files: ${summary.mojibakeFiles}`);

  console.log("\n=== Top Forum Risk Files ===\n");
  for (const r of forumTop.slice(0, 12)) {
    const c = r.counts;
    console.log(`- ${r.file}`);
    console.log(
      `  score=${r.score} video=${c.video} autoplay=${c.autoplay} raf=${c.raf}/${c.caf} interval=${c.setInt}/${c.clrInt} evt=${c.addEvt}/${c.remEvt} objectURL=${c.createUrl}/${c.revokeUrl}`
    );
    if (r.flags.length) {
      console.log(`  flags: ${r.flags.join(" | ")}`);
    }
    console.log("");
  }

  const out = {
    root,
    generatedAt: new Date().toISOString(),
    summary,
    topProject: top,
    topForum: forumTop,
  };
  const outPath = path.join(root, "deep-audit.report.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`Saved: ${outPath}\n`);
}

main();
