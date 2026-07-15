import { createHash } from 'node:crypto'
import { appendMarketEvent } from './_db.js'

function hashValue(value) {
  const raw = String(value || '')
  if (!raw) return ''
  return createHash('sha256').update(raw).digest('hex').slice(0, 32)
}

export function createTxId(type, itemId) {
  const safeType = String(type || 'TX').toUpperCase().replace(/[^A-Z0-9]+/g, '')
  const safeItem = String(itemId || 'item').replace(/[^a-zA-Z0-9_-]+/g, '').slice(0, 40)
  return `mmtx_${safeType}_${safeItem}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export async function writeLedgerEvent({
  txId,
  type,
  item,
  token,
  tokenIds = null,
  serials = null,
  quantity = 1,
  unitPriceMicro = 0,
  actorId,
  fromOwnerId = '',
  toOwnerId = '',
  priceMicro = 0,
  qcoinDeltaActor = 0,
  qcoinDeltaCounterparty = 0,
  source = '',
  req = null,
}) {
  const createdAt = Date.now()
  const safeTokenIds = Array.isArray(tokenIds)
    ? tokenIds.map((id) => String(id || '').trim()).filter(Boolean)
    : (token?.tokenId ? [String(token.tokenId)] : [])
  const safeSerials = Array.isArray(serials)
    ? serials.map((serial) => String(serial || '').trim()).filter(Boolean)
    : (token?.serial ? [String(token.serial)] : [])
  const safeQuantity = Math.max(1, Math.floor(Number(quantity || safeTokenIds.length || 1) || 1))
  const event = {
    txId,
    type,
    itemId: item.itemId,
    collectionId: item.collectionId,
    tokenId: token?.tokenId || '',
    serial: token?.serial || '',
    tokenIds: JSON.stringify(safeTokenIds),
    serials: JSON.stringify(safeSerials),
    quantity: safeQuantity,
    unitPriceMicro,
    actorId,
    fromOwnerId,
    toOwnerId,
    priceMicro,
    qcoinDeltaActor,
    qcoinDeltaCounterparty,
    source,
    country: '',
    city: '',
    ipHash: hashValue(req?.headers?.get?.('x-forwarded-for') || req?.headers?.get?.('x-real-ip') || ''),
    userAgentHash: hashValue(req?.headers?.get?.('user-agent') || ''),
    createdAt,
  }
  await appendMarketEvent(event)
  return event
}
