#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node tools/ingest/normalizeHeap.js <heapsnapshot-analysis-json>');
    process.exit(1);
  }

  const file = path.resolve(process.cwd(), input);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const normalized = {
    file,
    snapshot: data.snapshot || {},
    nodes: data.nodes || {},
    keywordHits: Array.isArray(data.keywordHits) ? data.keywordHits : [],
  };
  console.log(JSON.stringify(normalized, null, 2));
}

main();
