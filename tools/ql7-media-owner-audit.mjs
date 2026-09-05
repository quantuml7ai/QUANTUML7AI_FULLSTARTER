#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || '.');
const OWNER_PATTERNS = [
  ['video tags', /<video\b/g],
  ['iframe tags', /<iframe\b/g],
  ['play()', /\.play\?*\(/g],
  ['pause()', /\.pause\?*\(/g],
  ['load()', /\.load\?*\(/g],
  ['set src attr', /setAttribute\(['"]src['"]/g],
  ['remove src attr', /removeAttribute\(['"]src['"]\)/g],
  ['data-windowing-keepalive', /data-windowing-keepalive/g],
  ['IntersectionObserver', /IntersectionObserver/g],
  ['requestIdleCallback', /requestIdleCallback/g],
  ['mediaLock', /mediaLock/g],
  ['QCast', /QCast|qcast/g],
  ['AdCard', /AdCard/g],
  ['ForumAdSlot', /ForumAdSlot/g],
  ['ExternalVideoPlayer', /ExternalVideoPlayer/g],
];
const exts = new Set(['.js','.jsx','.mjs','.cjs','.ts','.tsx']);
const rows = [];
function walk(dir){
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === '.git' || ent.name === '.pnpm-store') continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p); else if(exts.has(path.extname(ent.name))) {
      const txt=fs.readFileSync(p,'utf8');
      const hits=[];
      for (const [name,re] of OWNER_PATTERNS){ const n=(txt.match(re)||[]).length; if(n) hits.push(`${name}:${n}`); }
      if(hits.length) rows.push({file:path.relative(root,p), hits:hits.join(' | ')});
    }
  }
}
walk(root);
console.log('QL7 media owner audit');
for (const row of rows.sort((a,b)=>a.file.localeCompare(b.file))) console.log(`${row.file}\n  ${row.hits}`);
