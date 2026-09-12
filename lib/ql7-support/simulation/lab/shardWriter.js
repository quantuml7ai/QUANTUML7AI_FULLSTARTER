import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const QL7_SUPPORT_SHARD_WRITER_VERSION = '5.1.1'
const hash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

export function createQl7LabShardWriter({ directory, shardId } = {}) {
  if (!directory || !shardId) throw new Error('shard_writer_config_required')

  const resolvedDirectory = path.resolve(String(directory))
  fs.mkdirSync(resolvedDirectory, { recursive: true })
  const file = path.join(resolvedDirectory, `${String(shardId)}.ndjson`)

  function append(row) {
    const line = `${JSON.stringify(row)}\n`
    const descriptor = fs.openSync(file, 'a')
    try {
      fs.writeSync(descriptor, line, null, 'utf8')
      fs.fsyncSync(descriptor)
    } finally {
      fs.closeSync(descriptor)
    }
  }

  function seal() {
    const bytes = fs.existsSync(file) ? fs.readFileSync(file) : Buffer.alloc(0)
    return Object.freeze({
      schema: 'ql7.support.lab.shard-seal',
      schemaVersion: QL7_SUPPORT_SHARD_WRITER_VERSION,
      shardId: String(shardId),
      file,
      bytes: bytes.length,
      sha256: hash(bytes),
      lineCount: bytes.toString('utf8').split('\n').filter(Boolean).length,
    })
  }

  return Object.freeze({
    file,
    append,
    seal,
  })
}
