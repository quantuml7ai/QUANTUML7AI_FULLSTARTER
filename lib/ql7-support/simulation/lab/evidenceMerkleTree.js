import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const QL7_SUPPORT_EVIDENCE_MERKLE_VERSION = '5.1.1'

const sha = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

export function buildEvidenceMerkle(files = []) {
  const leaves = (files || [])
    .map((file) => path.resolve(String(file)))
    .sort()
    .map((file) => {
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        throw new Error(`evidence_file_missing:${file}`)
      }
      return Object.freeze({
        file,
        bytes: fs.statSync(file).size,
        sha256: sha(fs.readFileSync(file)),
      })
    })

  let layer = leaves.map((row) => row.sha256)
  if (!layer.length) {
    return Object.freeze({
      schema: 'ql7.support.lab.evidence-merkle',
      schemaVersion: QL7_SUPPORT_EVIDENCE_MERKLE_VERSION,
      leaves: Object.freeze([]),
      root: sha(''),
    })
  }

  while (layer.length > 1) {
    const next = []
    for (let index = 0; index < layer.length; index += 2) {
      next.push(sha(`${layer[index]}:${layer[index + 1] || layer[index]}`))
    }
    layer = next
  }

  return Object.freeze({
    schema: 'ql7.support.lab.evidence-merkle',
    schemaVersion: QL7_SUPPORT_EVIDENCE_MERKLE_VERSION,
    leaves: Object.freeze(leaves),
    root: layer[0],
  })
}
