#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const exts = new Set([".js", ".jsx", ".ts", ".tsx"]);
const ignoreDirs = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "out",
  ".git",
  ".turbo",
  ".vercel",
]);

const patterns = [
  // Таймеры / циклы
  { key: "setInterval", rx: /\bsetInterval\s*\(/g, why: "Может плодиться/не чиститься → утечки/нагрузка" },
  { key: "clearInterval", rx: /\bclearInterval\s*\(/g, why: "Проверяем парность с setInterval" },
  { key: "setTimeout", rx: /\bsetTimeout\s*\(/g, why: "Может заспамить ререндер/таймеры" },
  { key: "requestAnimationFrame", rx: /\brequestAnimationFrame\s*\(/g, why: "RAF-циклы часто грузят main-thread" },
  { key: "cancelAnimationFrame", rx: /\bcancelAnimationFrame\s*\(/g, why: "Проверяем парность с RAF" },

  // DOM измерения (дорого)
  { key: "getBoundingClientRect", rx: /\bgetBoundingClientRect\s*\(/g, why: "Очень дорого в скролле/таче/raf" },
  { key: "querySelectorAll", rx: /\bquerySelectorAll\s*\(/g, why: "Может быть дорого/часто вызываться" },

  // Event listeners (утечки)
  { key: "addEventListener", rx: /\baddEventListener\s*\(/g, why: "Если без remove → утечки и лаги" },
  { key: "removeEventListener", rx: /\bremoveEventListener\s*\(/g, why: "Проверяем парность с add" },

  // Медиа / тяжёлые штуки
  { key: "<video", rx: /<video\b/gi, why: "Видео = память+декодер+GPU" },
  { key: "<audio", rx: /<audio\b/gi, why: "Аудио = доп ресурсы" },
  { key: "<img", rx: /<img\b/gi, why: "Картинки без lazy часто убивают память" },
  { key: "autoplay", rx: /\bautoPlay\b|autoplay\s*=/gi, why: "Autoplay/loop → постоянная нагрузка" },
  { key: "loop", rx: /\bloop\b/gi, why: "Loop особенно опасен на множестве карточек" },
  { key: "preload", rx: /\bpreload\s*=/gi, why: "preload=auto/metadata может забивать сеть/память" },
  { key: "loading=lazy", rx: /\bloading\s*=\s*["']lazy["']/gi, why: "Ищем где НЕ lazy" },
  { key: "decoding=async", rx: /\bdecoding\s*=\s*["']async["']/gi, why: "Полезно для img" },

  // Blob URL (утечки)
  { key: "createObjectURL", rx: /\bURL\.createObjectURL\s*\(/g, why: "Если без revoke → утечки памяти" },
  { key: "revokeObjectURL", rx: /\bURL\.revokeObjectURL\s*\(/g, why: "Проверяем парность create/revoke" },

  // Base64 в коде (часто убийца)
  { key: "base64", rx: /data:[^;]+;base64,/gi, why: "Base64 в state/props = резкий рост памяти" },

  // Частые setState в скролле (грубая эвристика)
  { key: "onScroll", rx: /\bonScroll\s*=/g, why: "Проверь, нет ли setState/измерений внутри" },
  { key: "touchmove", rx: /\btouchmove\b/gi, why: "Touchmove легко сломать/перегрузить" },
  { key: "wheel", rx: /\bwheel\b/gi, why: "Wheel обработчики могут грузить" },
];

function walk(dir, out = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (ignoreDirs.has(it.name)) continue;
      walk(full, out);
    } else {
      const ext = path.extname(it.name);
      if (!exts.has(ext)) continue;
      out.push(full);
    }
  }
  return out;
}

function scanFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (const p of patterns) {
    for (let i = 0; i < lines.length; i++) {
      if (p.rx.test(lines[i])) {
        hits.push({ key: p.key, line: i + 1, text: lines[i].trim(), why: p.why });
      }
      p.rx.lastIndex = 0;
    }
  }
  // сводные эвристики
  const counts = Object.create(null);
  for (const h of hits) counts[h.key] = (counts[h.key] || 0) + 1;

  // Простые “красные флаги” по файлу
  const flags = [];
  if ((counts.addEventListener || 0) > (counts.removeEventListener || 0)) flags.push("⚠ addEventListener > removeEventListener (возможная утечка)");
  if ((counts.setInterval || 0) > (counts.clearInterval || 0)) flags.push("⚠ setInterval > clearInterval (возможная утечка)");
  if ((counts.createObjectURL || 0) > (counts.revokeObjectURL || 0)) flags.push("⚠ createObjectURL > revokeObjectURL (возможная утечка)");
  if ((counts.getBoundingClientRect || 0) >= 10) flags.push("⚠ много getBoundingClientRect (дорого, особенно в scroll/raf)");
  if ((counts.autoplay || 0) >= 1 && (counts["<video"] || 0) >= 1) flags.push("⚠ autoplay видео (может грузить/GPU/память)");
  if ((counts["<img"] || 0) >= 5 && (counts["loading=lazy"] || 0) === 0) flags.push("⚠ много img без loading=lazy");
  return { file, counts, flags, hits };
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const files = walk(root);
  const report = files.map(scanFile).filter(r => Object.keys(r.counts).length > 0);

  // сортируем по “тяжести”
  report.sort((a, b) => {
    const wa = (a.counts.getBoundingClientRect || 0) * 3
      + (a.counts["<video"] || 0) * 6
      + (a.counts.autoplay || 0) * 6
      + (a.counts.setInterval || 0) * 2
      + (a.counts.requestAnimationFrame || 0) * 2;
    const wb = (b.counts.getBoundingClientRect || 0) * 3
      + (b.counts["<video"] || 0) * 6
      + (b.counts.autoplay || 0) * 6
      + (b.counts.setInterval || 0) * 2
      + (b.counts.requestAnimationFrame || 0) * 2;
    return wb - wa;
  });

  const top = report.slice(0, 30);
  console.log("\n=== Heavy Audit: TOP files ===\n");
  for (const r of top) {
    const c = r.counts;
    const score =
      (c.getBoundingClientRect || 0) * 3 +
      (c["<video"] || 0) * 6 +
      (c.autoplay || 0) * 6 +
      (c.setInterval || 0) * 2 +
      (c.requestAnimationFrame || 0) * 2 +
      (c.addEventListener || 0);

    console.log(`- ${r.file}`);
    console.log(`  score=${score}  rect=${c.getBoundingClientRect || 0}  video=${c["<video"] || 0}  autoplay=${c.autoplay || 0}  interval=${c.setInterval || 0}  raf=${c.requestAnimationFrame || 0}`);
    for (const f of r.flags) console.log(`  ${f}`);
    console.log("");
  }

  const outPath = path.join(root, "heavy-audit.report.json");
  fs.writeFileSync(outPath, JSON.stringify({ root, generatedAt: new Date().toISOString(), report }, null, 2), "utf8");
  console.log(`\nSaved JSON report: ${outPath}\n`);
}

main();
