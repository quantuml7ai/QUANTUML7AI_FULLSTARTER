import { getMetaMarketCollection, getMetaMarketItem } from './_catalog.js'
import {
  K,
  MARKET_OWNER_ID,
  addTokenToMarket,
  addTokenToUser,
  ensureItemState,
  getUserItemCount,
  mintToken,
  nextGlobalSeq,
  popMarketToken,
  readQcoinBalanceMicro,
  reconcileOwnersCount,
  redis,
  removeTokenFromUser,
  selectUserToken,
  setUserItemCount,
  appendAudit,
  writeItemState,
  writeQcoinBalanceMicro,
  writeToken,
} from './_db.js'
import { withMetaMarketLocks } from './_locks.js'
import { createTxId, writeLedgerEvent } from './_ledger.js'
import { clampQuantity, dynamicPriceMicro, makeHttpError, microToQcoin } from './_format.js'
import { resolveRecipientId } from './_identity.js'

const DONE_TTL_SEC = 7 * 24 * 60 * 60
const PENDING_TTL_SEC = 5 * 60
const ALLOWED_SOURCES = new Set(['quantum-wallet', 'user-info-gift', 'topbar-brand', 'dev'])
const MAX_TRANSACTION_QUANTITY = 10_000

function normalizeAction(raw) {
  const action = String(raw || '').trim()
  if (action === 'buy' || action === 'sell' || action === 'gift') return action
  throw makeHttpError('transaction_failed', 400)
}

function normalizeSource(raw) {
  const source = String(raw || '').trim()
  return ALLOWED_SOURCES.has(source) ? source : 'dev'
}

function sellPriceMicro(item, state) {
  const price = dynamicPriceMicro(item, state)
  const bps = Number(state?.sellRateBps ?? item.sellRateBps ?? 9700)
  return Math.max(0, Math.floor((price * bps) / 10000))
}

function normalizeQuantity(raw, max = MAX_TRANSACTION_QUANTITY) {
  return clampQuantity(raw, 1, Math.max(1, Math.min(MAX_TRANSACTION_QUANTITY, Number(max || MAX_TRANSACTION_QUANTITY))))
}

function buyTotalPriceMicro(item, state, quantity) {
  const qty = normalizeQuantity(quantity)
  return dynamicPriceMicro(item, state) * qty
}

function sellGrossTotalPriceMicro(item, state, quantity) {
  const qty = normalizeQuantity(quantity)
  return dynamicPriceMicro(item, state) * qty
}

function sellTotalPriceMicro(item, state, quantity) {
  const qty = normalizeQuantity(quantity)
  return sellPriceMicro(item, state) * qty
}

function reasonPayload(reason, extra = {}) {
  return {
    canProceed: false,
    reason,
    messageKey: `metamarket_error_${reason}`,
    ...extra,
  }
}

function donePayload(payload) {
  return {
    canProceed: true,
    reason: '',
    messageKey: '',
    ...payload,
  }
}

function validateItemForAction(item, state, action) {
  if (!item) throw makeHttpError('item_not_found', 404)
  if (!state.active) return 'item_inactive'
  if (action === 'buy' && !state.buyEnabled) return 'buy_disabled'
  if (action === 'sell' && !state.sellEnabled) return 'sell_disabled'
  if (action === 'gift' && !state.giftEnabled) return 'gift_disabled'
  return ''
}

async function getIdempotency(userId, action, idempotencyKey) {
  const key = K.idempotency(userId, action, idempotencyKey)
  const raw = await redis.get(key).catch(() => null)
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(String(raw)) } catch { return null }
}

async function beginIdempotency(userId, action, idempotencyKey) {
  const safeKey = String(idempotencyKey || '').trim()
  if (!safeKey) throw makeHttpError('idempotency_conflict', 409)
  const key = K.idempotency(userId, action, safeKey)
  const existing = await getIdempotency(userId, action, safeKey)
  if (existing?.state === 'done' && existing.result) return { duplicate: true, result: existing.result }
  if (existing?.state === 'pending') throw makeHttpError('idempotency_conflict', 409)
  const pending = JSON.stringify({ state: 'pending', createdAt: Date.now() })
  const ok = await redis.set(key, pending, { nx: true, ex: PENDING_TTL_SEC }).catch(() => null)
  if (ok !== 'OK' && ok !== true) {
    const latest = await getIdempotency(userId, action, safeKey)
    if (latest?.state === 'done' && latest.result) return { duplicate: true, result: latest.result }
    throw makeHttpError('idempotency_conflict', 409)
  }
  return { duplicate: false, key }
}

async function finishIdempotency(key, result) {
  await redis.set(key, JSON.stringify({ state: 'done', createdAt: Date.now(), result }), { ex: DONE_TTL_SEC })
}

async function failIdempotency(key, code) {
  if (!key) return
  await redis.set(key, JSON.stringify({ state: 'failed', createdAt: Date.now(), error: code }), { ex: PENDING_TTL_SEC }).catch(() => {})
}

export async function quoteTransaction({ action: rawAction, itemId, userId, recipientId = '', quantity: rawQuantity = 1 }) {
  const action = normalizeAction(rawAction)
  const requestedQuantity = normalizeQuantity(rawQuantity)
  const item = getMetaMarketItem(itemId)
  if (!item) throw makeHttpError('item_not_found', 404)
  const state = await ensureItemState(item)
  const validationReason = validateItemForAction(item, state, action)
  const balanceMicro = await readQcoinBalanceMicro(userId)
  const ownedCount = await getUserItemCount(userId, item.itemId)
  const currentPriceMicro = dynamicPriceMicro(item, state)
  const maxQuantity = action === 'buy'
    ? Math.max(0, Math.min(MAX_TRANSACTION_QUANTITY, Math.floor(Number(state.marketAvailable || 0))))
    : Math.max(0, Math.min(MAX_TRANSACTION_QUANTITY, ownedCount))
  const quantity = maxQuantity > 0 ? Math.min(requestedQuantity, maxQuantity) : requestedQuantity
  const sellGrossTotalMicro = action === 'sell'
    ? sellGrossTotalPriceMicro(item, state, quantity)
    : sellGrossTotalPriceMicro(item, state, Math.min(1, Math.max(1, ownedCount)))
  const totalPriceMicro = action === 'sell'
    ? sellTotalPriceMicro(item, state, quantity)
    : action === 'gift'
      ? 0
      : buyTotalPriceMicro(item, state, quantity)
  const sellFeeMicro = Math.max(0, sellGrossTotalMicro - (action === 'sell' ? totalPriceMicro : sellPriceMicro(item, state)))
  const base = {
    action,
    itemId: item.itemId,
    collectionId: item.collectionId,
    quantity,
    maxQuantity,
    balanceQcoin: microToQcoin(balanceMicro),
    priceQcoin: microToQcoin(currentPriceMicro),
    priceMicro: currentPriceMicro,
    totalPriceQcoin: microToQcoin(totalPriceMicro),
    totalPriceMicro,
    basePriceQcoin: microToQcoin(state.priceMicro),
    basePriceMicro: state.priceMicro,
    sellRateBps: state.sellRateBps,
    sellPriceQcoin: microToQcoin(sellPriceMicro(item, state)),
    sellTotalQcoin: microToQcoin(action === 'sell' ? totalPriceMicro : sellTotalPriceMicro(item, state, Math.min(1, Math.max(1, ownedCount)))),
    sellTotalMicro: action === 'sell' ? totalPriceMicro : sellPriceMicro(item, state),
    sellGrossTotalQcoin: microToQcoin(sellGrossTotalMicro),
    sellGrossTotalMicro,
    sellFeeQcoin: microToQcoin(sellFeeMicro),
    sellFeeMicro,
    available: state.marketAvailable,
    ownershipCount: ownedCount,
    ownedCount,
  }
  if (validationReason) return reasonPayload(validationReason, base)
  if (action === 'buy') {
    if (state.marketAvailable <= 0 || quantity > state.marketAvailable) return reasonPayload('sold_out', base)
    if (balanceMicro < totalPriceMicro) {
      return reasonPayload('insufficient_funds', {
        ...base,
        missingQcoin: microToQcoin(totalPriceMicro - balanceMicro),
      })
    }
  }
  if (action === 'sell' && (ownedCount <= 0 || quantity > ownedCount)) return reasonPayload('not_owner', base)
  if (action === 'gift') {
    const recipient = await resolveRecipientId(recipientId)
    if (!recipient) return reasonPayload('recipient_not_found', base)
    if (recipient === userId) return reasonPayload('self_gift_forbidden', base)
    if (ownedCount <= 0 || quantity > ownedCount) return reasonPayload('not_owner', base)
    return donePayload({ ...base, recipientId: recipient })
  }
  return donePayload(base)
}

export async function buyItem({ userId, itemId, quantity: rawQuantity = 1, idempotencyKey, source, req }) {
  const item = getMetaMarketItem(itemId)
  if (!item) throw makeHttpError('item_not_found', 404)
  const quantity = normalizeQuantity(rawQuantity)
  const idem = await beginIdempotency(userId, 'buy', idempotencyKey)
  if (idem.duplicate) return idem.result
  try {
    const result = await withMetaMarketLocks([K.lockItem(item.itemId), K.lockUser(userId)], async () => {
      const state = await ensureItemState(item)
      const validationReason = validateItemForAction(item, state, 'buy')
      if (validationReason) throw makeHttpError(validationReason, 400)
      if (state.marketAvailable <= 0 || quantity > state.marketAvailable) throw makeHttpError('sold_out', 400)
      const balanceMicro = await readQcoinBalanceMicro(userId)
      const priceMicro = buyTotalPriceMicro(item, state, quantity)
      if (balanceMicro < priceMicro) throw makeHttpError('insufficient_funds', 400)

      const txId = createTxId('BUY', item.itemId)
      const tokens = []
      let mintedCount = 0
      const now = Date.now()
      for (let index = 0; index < quantity; index += 1) {
        let token = await popMarketToken(item.itemId)
        let minted = false
        if (!token) {
          if (state.mintedCount + mintedCount >= state.totalSupply) throw makeHttpError('sold_out', 400)
          const seq = await nextGlobalSeq()
          token = await mintToken(item, seq, txId)
          minted = true
          mintedCount += 1
        }
        token = {
          ...token,
          ownerId: userId,
          status: 'owned',
          updatedAt: now + index,
          lastTxId: txId,
        }
        await writeToken(token)
        await addTokenToUser(userId, item.itemId, token.tokenId, now + index)
        tokens.push(token)
      }
      const ownedBefore = await getUserItemCount(userId, item.itemId)
      const ownedCount = await setUserItemCount(userId, item.itemId, ownedBefore + quantity)
      const nextState = await writeItemState(item.itemId, {
        marketAvailable: state.marketAvailable - quantity,
        mintedCount: state.mintedCount + mintedCount,
      })
      const balanceQcoin = await writeQcoinBalanceMicro(userId, balanceMicro - priceMicro)
      await writeLedgerEvent({
        txId,
        type: 'BUY',
        item,
        token: tokens[0],
        tokenIds: tokens.map((token) => token.tokenId),
        serials: tokens.map((token) => token.serial),
        quantity,
        unitPriceMicro: dynamicPriceMicro(item, state),
        priceMicro,
        qcoinDeltaActor: -priceMicro,
        fromOwnerId: MARKET_OWNER_ID,
        toOwnerId: userId,
        actorId: userId,
        source: normalizeSource(source),
        req,
      })
      return {
        ok: true,
        quantity,
        balanceQcoin,
        itemAvailable: nextState.marketAvailable,
        ownedCount,
        tokenId: tokens[0]?.tokenId || '',
        serial: tokens[0]?.serial || '',
        txId,
        tokenIds: tokens.map((token) => token.tokenId),
        serials: tokens.map((token) => token.serial),
        txIds: [txId],
      }
    })
    await finishIdempotency(idem.key, result)
    return result
  } catch (error) {
    await failIdempotency(idem.key, error?.code || error?.message || 'transaction_failed')
    throw error
  }
}

export async function sellItem({ userId, itemId, quantity: rawQuantity = 1, tokenId = '', idempotencyKey, source, req }) {
  const item = getMetaMarketItem(itemId)
  if (!item) throw makeHttpError('item_not_found', 404)
  const quantity = normalizeQuantity(rawQuantity)
  const idem = await beginIdempotency(userId, 'sell', idempotencyKey)
  if (idem.duplicate) return idem.result
  try {
    const result = await withMetaMarketLocks([K.lockItem(item.itemId), K.lockUser(userId)], async () => {
      const state = await ensureItemState(item)
      const validationReason = validateItemForAction(item, state, 'sell')
      if (validationReason) throw makeHttpError(validationReason, 400)
      const ownedCurrent = await getUserItemCount(userId, item.itemId)
      if (ownedCurrent <= 0 || quantity > ownedCurrent) throw makeHttpError('not_owner', 400)
      const priceMicro = sellTotalPriceMicro(item, state, quantity)
      const txId = createTxId('SELL', item.itemId)
      const tokens = []
      const now = Date.now()
      for (let index = 0; index < quantity; index += 1) {
        const token = await selectUserToken(userId, item.itemId, index === 0 ? tokenId : '')
        if (!token) throw makeHttpError('not_owner', 400)
        await removeTokenFromUser(userId, item.itemId, token.tokenId)
        const nextToken = {
          ...token,
          ownerId: MARKET_OWNER_ID,
          status: 'market',
          updatedAt: now + index,
          lastTxId: txId,
        }
        await writeToken(nextToken)
        await addTokenToMarket(item.itemId, token.tokenId, now + index)
        tokens.push(nextToken)
      }
      const ownedCount = await setUserItemCount(userId, item.itemId, ownedCurrent - quantity)
      const nextState = await writeItemState(item.itemId, {
        marketAvailable: state.marketAvailable + quantity,
      })
      const balanceMicro = await readQcoinBalanceMicro(userId)
      const balanceQcoin = await writeQcoinBalanceMicro(userId, balanceMicro + priceMicro)
      await writeLedgerEvent({
        txId,
        type: 'SELL',
        item,
        token: tokens[0],
        tokenIds: tokens.map((token) => token.tokenId),
        serials: tokens.map((token) => token.serial),
        quantity,
        unitPriceMicro: sellPriceMicro(item, state),
        priceMicro,
        qcoinDeltaActor: priceMicro,
        actorId: userId,
        fromOwnerId: userId,
        toOwnerId: MARKET_OWNER_ID,
        source: normalizeSource(source),
        req,
      })
      return {
        ok: true,
        quantity,
        balanceQcoin,
        itemAvailable: nextState.marketAvailable,
        ownedCount,
        sellPriceQcoin: microToQcoin(priceMicro),
        tokenId: tokens[0]?.tokenId || '',
        serial: tokens[0]?.serial || '',
        txId,
        tokenIds: tokens.map((token) => token.tokenId),
        serials: tokens.map((token) => token.serial),
        txIds: [txId],
      }
    })
    await finishIdempotency(idem.key, result)
    return result
  } catch (error) {
    await failIdempotency(idem.key, error?.code || error?.message || 'transaction_failed')
    throw error
  }
}

export async function giftItem({ userId, itemId, recipientId, quantity: rawQuantity = 1, tokenId = '', idempotencyKey, source, req }) {
  const item = getMetaMarketItem(itemId)
  if (!item) throw makeHttpError('item_not_found', 404)
  const quantity = normalizeQuantity(rawQuantity)
  const recipient = await resolveRecipientId(recipientId)
  if (!recipient) throw makeHttpError('recipient_not_found', 404)
  if (recipient === userId) throw makeHttpError('self_gift_forbidden', 400)
  const idem = await beginIdempotency(userId, 'gift', idempotencyKey)
  if (idem.duplicate) return idem.result
  try {
    const result = await withMetaMarketLocks([K.lockItem(item.itemId), K.lockUser(userId), K.lockUser(recipient)], async () => {
      const state = await ensureItemState(item)
      const validationReason = validateItemForAction(item, state, 'gift')
      if (validationReason) throw makeHttpError(validationReason, 400)
      const giverCurrent = await getUserItemCount(userId, item.itemId)
      if (giverCurrent <= 0 || quantity > giverCurrent) throw makeHttpError('not_owner', 400)
      const recipientCurrent = await getUserItemCount(recipient, item.itemId)
      const txId = createTxId('GIFT', item.itemId)
      const tokens = []
      const now = Date.now()
      for (let index = 0; index < quantity; index += 1) {
        const token = await selectUserToken(userId, item.itemId, index === 0 ? tokenId : '')
        if (!token) throw makeHttpError('not_owner', 400)
        await removeTokenFromUser(userId, item.itemId, token.tokenId)
        await addTokenToUser(recipient, item.itemId, token.tokenId, now + index)
        const nextToken = {
          ...token,
          ownerId: recipient,
          status: 'owned',
          updatedAt: now + index,
          lastTxId: txId,
        }
        await writeToken(nextToken)
        tokens.push(nextToken)
      }
      const giverOwnedCount = await setUserItemCount(userId, item.itemId, giverCurrent - quantity)
      const recipientOwnedCount = await setUserItemCount(recipient, item.itemId, recipientCurrent + quantity)
      await writeLedgerEvent({
        txId,
        type: 'GIFT',
        item,
        token: tokens[0],
        tokenIds: tokens.map((token) => token.tokenId),
        serials: tokens.map((token) => token.serial),
        quantity,
        unitPriceMicro: 0,
        priceMicro: 0,
        qcoinDeltaActor: 0,
        actorId: userId,
        fromOwnerId: userId,
        toOwnerId: recipient,
        source: normalizeSource(source),
        req,
      })
      return {
        ok: true,
        quantity,
        giverOwnedCount,
        recipientOwnedCount,
        tokenId: tokens[0]?.tokenId || '',
        serial: tokens[0]?.serial || '',
        txId,
        tokenIds: tokens.map((token) => token.tokenId),
        serials: tokens.map((token) => token.serial),
        txIds: [txId],
      }
    })
    await finishIdempotency(idem.key, result)
    return result
  } catch (error) {
    await failIdempotency(idem.key, error?.code || error?.message || 'transaction_failed')
    throw error
  }
}

export async function reconcileItem(itemId) {
  const item = getMetaMarketItem(itemId)
  if (!item) throw makeHttpError('item_not_found', 404)
  const state = await ensureItemState(item)
  const collection = getMetaMarketCollection(item.collectionId)
  const report = {
    itemId: item.itemId,
    collectionId: item.collectionId,
    collectionCode: collection?.code || '',
    state,
    checkedAt: Date.now(),
    safe: true,
    issues: [],
  }
  const ownersCount = Number(await reconcileOwnersCount(item.itemId).catch(() => 0) || 0)
  if (ownersCount < 0) {
    report.safe = false
    report.issues.push('owners_negative')
  }
  await appendAudit(report).catch(() => {})
  return report
}
