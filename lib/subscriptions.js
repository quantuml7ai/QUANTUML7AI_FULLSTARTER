import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), '.data', 'subscriptions.json')

function ensureFile() {
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({}), 'utf8')
}

export function readSubs() {
  try { ensureFile(); return JSON.parse(fs.readFileSync(FILE, 'utf8') || '{}') }
  catch { return {} }
}
export function writeSubs(db) {
  try { ensureFile(); fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8') } catch {}
}
export function setVip(accountId, untilISO) {
  const db = readSubs()
  db[accountId] = { until: untilISO }
  writeSubs(db)
}
export function getVip(accountId) {
  const db = readSubs()
  const rec = db[accountId]
  if (!rec) return { isVip:false, until:null }
  const now = Date.now()
  const untilTs = +new Date(rec.until || 0)
  return { isVip: untilTs > now, until: rec.until || null }
}
