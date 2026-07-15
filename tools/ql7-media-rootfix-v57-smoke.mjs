#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const cmds = [
  ['node', ['tools/ql7-media-rootfix-v57-check.mjs']],
  ['node', ['tools/ql7-media-owner-audit.mjs', '.']],
];
let ok = true;
for (const [cmd, args] of cmds) {
  console.log(`\n[QL7 smoke] ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) ok = false;
}
console.log(`\n[QL7 smoke] ${ok ? 'OK' : 'FAILED'}`);
process.exit(ok ? 0 : 1);
