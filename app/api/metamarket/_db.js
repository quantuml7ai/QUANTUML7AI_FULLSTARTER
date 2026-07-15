import { randomBytes } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { getUsersPublicMini } from '../forum/_db.js'
import { isVipNow } from '../../../lib/subscriptions.js'
import { getMetaMarketCollection, getMetaMarketItem } from './_catalog.js'
import {
  decodeCursor,
  encodeCursor,
  microToQcoin,
  microToQcoinString,
} from './_format.js'
import metamarketPrimary from '../../../lib/mongo/metamarket-primary.cjs'

export const redis = Redis.fromEnv()
export const MARKET_OWNER_ID = 'MARKET'

export const K = {
  idempotency: (userId, action, idempotencyKey) => `metamarket:idempotency:${userId}:${action}:${idempotencyKey}`,
  lockItem: (itemId) => `metamarket:lock:item:${itemId}`,
  lockUser: (userId) => `metamarket:lock:user:${userId}`,
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseJsonList(value) {
  if (Array.isArray(value)) return value.map((entry) => String(entry || '').trim()).filter(Boolean)
  const raw = String(value || '').trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map((entry) => String(entry || '').trim()).filter(Boolean)
  } catch {}
  return raw.split(',').map((entry) => entry.trim()).filter(Boolean)
}

function normalizeMarketEvent(raw) {
  const tokenIds = parseJsonList(raw.tokenIds)
  const serials = parseJsonList(raw.serials)
  return {
    ...raw,
    tokenIds,
    serials,
    quantity: Math.max(1, Math.floor(num(raw.quantity, tokenIds.length || 1))),
    unitPriceMicro: num(raw.unitPriceMicro, 0),
    priceMicro: num(raw.priceMicro, 0),
    qcoinDeltaActor: num(raw.qcoinDeltaActor, 0),
    qcoinDeltaCounterparty: num(raw.qcoinDeltaCounterparty, 0),
    createdAt: num(raw.createdAt, 0),
  }
}

function normalizeEventForToken(event, tokenId) {
  const safeTokenId = String(tokenId || '').trim()
  const tokenIds = parseJsonList(event.tokenIds)
  if (!safeTokenId || !tokenIds.length) return event
  const index = tokenIds.indexOf(safeTokenId)
  if (index < 0) return event
  const serials = parseJsonList(event.serials)
  return {
    ...event,
    tokenId: safeTokenId,
    serial: serials[index] || event.serial || '',
  }
}

function randomSuffix() {
  try { return randomBytes(4).toString('hex') } catch { return Math.random().toString(36).slice(2, 10) }
}

export async function readQcoinBalanceMicro(userId) {
  return metamarketPrimary.readQcoinBalanceMicro(userId)
}

export async function writeQcoinBalanceMicro(userId, balanceMicro) {
  return metamarketPrimary.writeQcoinBalanceMicro(userId, balanceMicro)
}

export async function ensureItemState(item) {
  return metamarketPrimary.ensureItemState(item)
}

export function normalizeItemState(item, state = {}) {
  return metamarketPrimary.normalizeItemState(item, state)
}

export async function writeItemState(itemId, patch = {}) {
  const next = await metamarketPrimary.writeItemState(itemId, patch)
  const item = getMetaMarketItem(itemId)
  return item ? normalizeItemState(item, next) : next
}

export async function getUserItemCount(userId, itemId) {
  return metamarketPrimary.getUserItemCount(userId, itemId)
}

export async function setUserItemCount(userId, itemId, count) {
  return metamarketPrimary.setUserItemCount(userId, itemId, count)
}

export async function incrementUserItemCount(userId, itemId, delta) {
  return metamarketPrimary.incrementUserItemCount(userId, itemId, delta)
}

export async function updateOwnerIndexes(itemId, userId, count) {
  return metamarketPrimary.updateOwnerIndexes(itemId, userId, count)
}

export async function addTokenToUser(userId, itemId, tokenId, acquiredAt = Date.now()) {
  return metamarketPrimary.addTokenToUser(userId, itemId, tokenId, acquiredAt)
}

export async function removeTokenFromUser(userId, itemId, tokenId) {
  return metamarketPrimary.removeTokenFromUser(userId, itemId, tokenId)
}

export async function selectUserToken(userId, itemId, tokenId = '') {
  return metamarketPrimary.selectUserToken(userId, itemId, tokenId)
}

export async function popMarketToken(itemId) {
  return metamarketPrimary.popMarketToken(itemId)
}

export async function addTokenToMarket(itemId, tokenId, returnedAt = Date.now()) {
  return metamarketPrimary.addTokenToMarket(itemId, tokenId, returnedAt)
}

export async function readToken(tokenId) {
  return metamarketPrimary.readToken(tokenId)
}

export async function writeToken(token) {
  return metamarketPrimary.writeToken(token)
}

export async function nextGlobalSeq() {
  return metamarketPrimary.nextGlobalSeq()
}

export async function reconcileOwnersCount(itemId) {
  return metamarketPrimary.reconcileOwnersCount(itemId)
}

export async function appendAudit(report = {}) {
  return metamarketPrimary.appendAudit(report)
}

export async function mintToken(item, sequence, txId) {
  const collection = getMetaMarketCollection(item.collectionId)
  const code = collection?.code || 'MM'
  const seq = Number(sequence || await nextGlobalSeq())
  const tokenId = `mm_${String(code).toLowerCase()}_${seq}_${randomSuffix()}`
  const serial = `MM-${code}-${String(seq).padStart(9, '0')}-L7`
  const now = Date.now()
  const token = {
    tokenId,
    serial,
    itemId: item.itemId,
    collectionId: item.collectionId,
    ownerId: MARKET_OWNER_ID,
    status: 'market',
    createdAt: now,
    updatedAt: now,
    lastTxId: txId,
    mintTxId: txId,
    catalogVersionAtMint: item.catalogVersion,
    assetVersionAtMint: item.assetVersion,
  }
  await writeToken(token)
  return token
}

export async function appendMarketEvent(event) {
  return metamarketPrimary.appendMarketEvent(event)
}

export async function listOwnedItems(userId, { limit = 50, cursor = '' } = {}) {
  return metamarketPrimary.listOwnedItems(userId, {
    limit,
    cursor,
    decodeCursor,
    encodeCursor,
    getItem: getMetaMarketItem,
  })
}

export async function listOwners(itemId, { limit = 50, cursor = '' } = {}) {
  const result = await metamarketPrimary.listOwners(itemId, { limit, cursor, decodeCursor, encodeCursor })
  const page = result.page || []
  const publicUsers = await getUsersPublicMini(page.map((row) => row.userId))
  const publicMap = Object.fromEntries((publicUsers || []).map((user) => [user.userId, user]))
  const vipPairs = await Promise.all(page.map(async (row) => {
    const vip = await isVipNow(row.userId).catch(() => ({ active: false }))
    return [row.userId, !!vip?.active]
  }))
  const vipMap = Object.fromEntries(vipPairs)
  const users = page.map((row) => {
    const user = publicMap[row.userId] || { userId: row.userId, nickname: '', icon: '' }
    return {
      ...user,
      userId: row.userId,
      nickname: user.nickname || '',
      icon: user.icon || '',
      avatar: user.icon || '',
      vipActive: !!vipMap[row.userId],
      count: row.count || 0,
      updatedAt: row.recent,
      ownedSince: row.ownedSince || row.recent,
    }
  })
  return {
    users,
    totalOwners: result.totalOwners,
    totalOwnedByUsers: result.totalOwnedByUsers,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  }
}

export async function readEvent(txId) {
  const event = await metamarketPrimary.readEvent(txId)
  return event ? normalizeMarketEvent(event) : null
}

export async function listTokenHistory(tokenId, { limit = 50, cursor = '' } = {}) {
  const result = await metamarketPrimary.listHistory(
    { indexType: 'token_events', tokenId: String(tokenId || '').trim() },
    { limit, cursor, decodeCursor, encodeCursor },
  )
  return {
    events: result.events.map((event) => normalizeEventForToken(event, tokenId)),
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  }
}

export async function listUserHistory(userId, { limit = 50, cursor = '' } = {}) {
  return metamarketPrimary.listHistory(
    { indexType: 'user_events', userId: String(userId || '').trim() },
    { limit, cursor, decodeCursor, encodeCursor },
  )
}

export function formatQcoinFromMicroForMetaMarket(balanceMicro) {
  return microToQcoin(balanceMicro)
}

export function formatQcoinStringFromMicroForMetaMarket(balanceMicro) {
  return microToQcoinString(balanceMicro)
}
