import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const QL7_SUPPORT_CHECKPOINT_JOURNAL_VERSION = '5.1.1'

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex')

export function appendCheckpointJournal(file, row) {
  const resolved = path.resolve(String(file))
  fs.mkdirSync(path.dirname(resolved), { recursive: true })

  const recordedAt = new Date().toISOString()
  const body = {
    schema: 'ql7.support.lab.checkpoint',
    schemaVersion: QL7_SUPPORT_CHECKPOINT_JOURNAL_VERSION,
    ...(row || {}),
    recordedAt,
  }
  const line = JSON.stringify({
    ...body,
    recordHash: hash(JSON.stringify(body)),
  })

  const descriptor = fs.openSync(resolved, 'a')
  try {
    fs.writeSync(descriptor, `${line}\n`, null, 'utf8')
    fs.fsyncSync(descriptor)
  } finally {
    fs.closeSync(descriptor)
  }
}

export function readCheckpointJournal(file) {
  const resolved = path.resolve(String(file))
  if (!fs.existsSync(resolved)) return []

  const rows = []
  for (const line of fs.readFileSync(resolved, 'utf8').split(/\n/gu).filter(Boolean)) {
    const parsed = JSON.parse(line)
    const { recordHash, ...body } = parsed
    if (recordHash && hash(JSON.stringify(body)) !== recordHash) {
      throw new Error('checkpoint_journal_hash_mismatch')
    }
    rows.push(parsed)
  }
  return rows
}
