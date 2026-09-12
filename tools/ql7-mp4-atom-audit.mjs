import fs from "node:fs";

const args = process.argv.slice(2);
const strict = args.includes("--strict-flat");
const file = args.find((a) => a !== "--strict-flat");
if (!file) {
  console.error("Usage: node tools/ql7-mp4-atom-audit.mjs [--strict-flat] <file.mp4>");
  process.exit(2);
}
const buf = fs.readFileSync(file);
function ascii(offset, len) { return buf.subarray(offset, offset + len).toString("ascii"); }
function u32(offset) { return buf.readUInt32BE(offset); }
const atoms = [];
let offset = 0;
let guard = 0;
while (offset + 8 <= buf.length && guard < 200000) {
  guard += 1;
  let size = u32(offset);
  const type = ascii(offset + 4, 4);
  let header = 8;
  if (size === 1) {
    if (offset + 16 > buf.length) break;
    const hi = u32(offset + 8);
    const lo = u32(offset + 12);
    size = hi * 4294967296 + lo;
    header = 16;
  } else if (size === 0) {
    size = buf.length - offset;
  }
  if (!Number.isFinite(size) || size < header) break;
  atoms.push({ type, offset, size });
  offset += size;
}
const moov = atoms.find((a) => a.type === "moov");
const mdat = atoms.find((a) => a.type === "mdat");
const moofCount = atoms.filter((a) => a.type === "moof").length;
const mdatCount = atoms.filter((a) => a.type === "mdat").length;
const faststart = !!(moov && mdat && moov.offset < mdat.offset);
const fragmented = moofCount > 0;
const verdict = faststart && !fragmented && moofCount === 0 ? "FLAT_FASTSTART_OK" : "NOT_FLAT_FASTSTART";
const result = {
  file,
  bytes: buf.length,
  topLevelAtoms: atoms.slice(0, 80),
  moovOffset: moov?.offset ?? -1,
  firstMdatOffset: mdat?.offset ?? -1,
  mdatCount,
  moofCount,
  faststart,
  fragmented,
  verdict,
};
console.log(JSON.stringify(result, null, 2));
if (strict && verdict !== "FLAT_FASTSTART_OK") process.exit(1);
