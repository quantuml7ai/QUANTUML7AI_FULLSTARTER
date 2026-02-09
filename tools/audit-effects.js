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

function scan(text) {
  const lines = text.split(/\r?\n/);

  // Очень грубый, но практичный парсер: ищем "useEffect(() => {" и берем блок до ближайшего "}, ["
  const effects = [];
  for (let i = 0; i < lines.length; i++) {
    if (/\buseEffect\s*\(\s*\(\s*\)\s*=>\s*\{/.test(lines[i]) || /\buseEffect\s*\(\s*function\s*\(\)\s*\{/.test(lines[i])) {
      const start = i;
      let end = i + 1;
      let depth = 0;
      let started = false;

      for (let j = i; j < lines.length; j++) {
        const line = lines[j];
        for (const ch of line) {
          if (ch === "{") { depth++; started = true; }
          if (ch === "}") depth--;
        }
        end = j;
        if (started && depth <= 0) break;
      }

      const block = lines.slice(start, end + 1).join("\n");
      effects.push({ startLine: start + 1, endLine: end + 1, block });
      i = end;
    }
  }

  const results = [];
  for (const e of effects) {
    const b = e.block;

    const add = (b.match(/\baddEventListener\s*\(/g) || []).length;
    const rem = (b.match(/\bremoveEventListener\s*\(/g) || []).length;

    const si = (b.match(/\bsetInterval\s*\(/g) || []).length;
    const ci = (b.match(/\bclearInterval\s*\(/g) || []).length;

    const raf = (b.match(/\brequestAnimationFrame\s*\(/g) || []).length;
    const caf = (b.match(/\bcancelAnimationFrame\s*\(/g) || []).length;

    const rect = (b.match(/\bgetBoundingClientRect\s*\(/g) || []).length;

    const hasCleanup = /return\s*\(\s*\)\s*=>/.test(b) || /return\s+function/.test(b);

    const flags = [];
    if (add > rem) flags.push(`⚠ addEventListener(${add}) > removeEventListener(${rem})`);
    if (si > ci) flags.push(`⚠ setInterval(${si}) > clearInterval(${ci})`);
    if (raf > caf) flags.push(`⚠ requestAnimationFrame(${raf}) > cancelAnimationFrame(${caf})`);
    if (!hasCleanup && (add || si || raf)) flags.push(`⚠ нет cleanup return(), но есть подписки/таймеры`);
    if (rect >= 3) flags.push(`⚠ getBoundingClientRect внутри effect: ${rect} (часто признак дорогих измерений)`);

    if (flags.length) results.push({ ...e, add, rem, si, ci, raf, caf, rect, flags });
  }
  return results;
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const files = walk(root);

  const all = [];
  for (const f of files) {
    let text;
    try { text = fs.readFileSync(f, "utf8"); } catch { continue; }
    const res = scan(text);
    if (res.length) all.push({ file: f, issues: res });
  }

  // Сортируем: сначала самые "опасные"
  all.sort((a, b) => {
    const sa = a.issues.reduce((s, x) => s + (x.add - x.rem) * 5 + (x.si - x.ci) * 4 + (x.raf - x.caf) * 4 + x.rect, 0);
    const sb = b.issues.reduce((s, x) => s + (x.add - x.rem) * 5 + (x.si - x.ci) * 4 + (x.raf - x.caf) * 4 + x.rect, 0);
    return sb - sa;
  });

  console.log("\n=== Effects Leak Audit (TOP) ===\n");
  for (const item of all.slice(0, 20)) {
    console.log(`FILE: ${item.file}`);
    for (const it of item.issues.slice(0, 6)) {
      console.log(`  lines ${it.startLine}-${it.endLine}: ${it.flags.join(" | ")}`);
    }
    console.log("");
  }

  const out = path.join(root, "effects-leak.report.json");
  fs.writeFileSync(out, JSON.stringify({ root, generatedAt: new Date().toISOString(), all }, null, 2), "utf8");
  console.log(`Saved: ${out}\n`);
}

main();
