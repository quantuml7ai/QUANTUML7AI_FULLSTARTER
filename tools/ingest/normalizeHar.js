#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function normalizeUrl(url) {
  try {
    const parsed = new URL(String(url || ''));
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString();
  } catch {
    return String(url || '');
  }
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node tools/ingest/normalizeHar.js <har-file>');
    process.exit(1);
  }

  const file = path.resolve(process.cwd(), input);
  const har = JSON.parse(fs.readFileSync(file, 'utf8'));
  const entries = Array.isArray(har?.log?.entries) ? har.log.entries : [];
  const normalized = entries.map((entry) => ({
    url: normalizeUrl(entry?.request?.url),
    method: String(entry?.request?.method || 'GET'),
    status: Number(entry?.response?.status || 0),
    mimeType: String(entry?.response?.content?.mimeType || ''),
    resourceType: String(entry?._resourceType || entry?.initiatorType || ''),
    transferSize: Number(entry?.response?._transferSize || entry?.response?.bodySize || 0),
    startedDateTime: String(entry?.startedDateTime || ''),
  }));
  console.log(JSON.stringify({ file, entries: normalized }, null, 2));
}

main();
