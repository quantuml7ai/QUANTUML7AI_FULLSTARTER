#!/usr/bin/env node
import fs from 'node:fs';
const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error('Usage: node tools/ql7-har-media-churn.mjs "./file.har"'); process.exit(1); }
const har = JSON.parse(fs.readFileSync(file,'utf8'));
const entries = har?.log?.entries || [];
const groups = new Map();
function norm(raw){ try{ const u=new URL(raw); u.hash=''; return `${u.hostname.toLowerCase()}${u.pathname.toLowerCase()}${u.search.toLowerCase()}`; }catch{return String(raw||'').toLowerCase();} }
for (const e of entries){
  const url = e?.request?.url || '';
  if (!/\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(url)) continue;
  const key = norm(url);
  const g = groups.get(key) || {url, total:0, s206:0, s200:0, errors:0, bytes:0, first:null, last:null, initiators:new Map()};
  g.total += 1;
  if (Number(e?.response?.status) === 206) g.s206 += 1;
  if (Number(e?.response?.status) === 200) g.s200 += 1;
  if (Number(e?.response?.status) >= 400 || String(e?.response?.statusText||'').includes('ERR_')) g.errors += 1;
  g.bytes += Math.max(0, Number(e?.response?.bodySize || e?.response?._transferSize || 0) || 0);
  const t = Date.parse(e?.startedDateTime || '') || 0;
  if (t && (!g.first || t < g.first)) g.first = t;
  if (t && (!g.last || t > g.last)) g.last = t;
  const init = e?._initiator?.type || e?.initiator?.type || 'unknown';
  g.initiators.set(init, (g.initiators.get(init)||0)+1);
  groups.set(key,g);
}
console.log('QL7 HAR media churn');
const top = Array.from(groups.values()).sort((a,b)=> (b.s206+b.errors+b.total) - (a.s206+a.errors+a.total)).slice(0,40);
for (const g of top){
  const span = g.first && g.last ? Math.round((g.last-g.first)/1000) : 0;
  console.log(`\n${g.url}\n  total=${g.total} 206=${g.s206} 200=${g.s200} errors=${g.errors} bytesMB=${(g.bytes/1048576).toFixed(2)} spanSec=${span}\n  initiators=${Array.from(g.initiators.entries()).map(([k,v])=>`${k}:${v}`).join(', ')}`);
}
