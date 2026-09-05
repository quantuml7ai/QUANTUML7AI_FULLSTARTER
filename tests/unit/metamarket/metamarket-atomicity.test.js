import { beforeEach, describe, expect, test, vi } from 'vitest'

const proof = vi.hoisted(() => ({
  domain: null,
  redis: new Map(),
  aborts: 0,
  transactions: 0,
  initialDomain(action) {
    const userTokens = action === 'buy' ? [] : ['token:owned']
    return {
      balanceMicro: { actor: 100_000_000 },
      itemState: {
        active: true,
        buyEnabled: true,
        sellEnabled: true,
        giftEnabled: true,
        marketAvailable: action === 'buy' ? 10 : 9,
        mintedCount: 1,
        totalSupply: 10,
        priceMicro: 1_000_000,
        sellRateBps: 9700,
      },
      counts: {
        'actor:item-1': userTokens.length,
        'recipient:item-1': 0,
      },
      marketTokens: [],
      userTokens: { actor: userTokens, recipient: [] },
      tokens: userTokens.length ? {
        'token:owned': {
          tokenId: 'token:owned',
          serial: 1,
          itemId: 'item-1',
          ownerId: 'actor',
          status: 'owned',
        },
      } : {},
      sequence: 1,
      ledger: [],
      economicCommitted: false,
    }
  },
  reset(action) {
    this.domain = this.initialDomain(action)
    this.redis = new Map()
    this.aborts = 0
    this.transactions = 0
  },
}))

vi.mock('../../../app/api/metamarket/_catalog.js', () => ({
  getMetaMarketCollection: () => ({ code: 'proof' }),
  getMetaMarketItem: (itemId) => itemId === 'item-1' ? {
    itemId: 'item-1',
    collectionId: 'collection-1',
    supply: 10,
    priceMicro: 1_000_000,
    sellRateBps: 9700,
  } : null,
}))

vi.mock('../../../app/api/metamarket/_db.js', () => {
  const countKey = (userId, itemId) => `${userId}:${itemId}`
  return {
    K: {
      idempotency: (userId, action, key) => `idem:${userId}:${action}:${key}`,
      lockItem: (itemId) => `lock:item:${itemId}`,
      lockUser: (userId) => `lock:user:${userId}`,
    },
    MARKET_OWNER_ID: 'MARKET',
    redis: {
      get: async (key) => proof.redis.get(key) || null,
      set: async (key, value, options = {}) => {
        if (options.nx && proof.redis.has(key)) return null
        proof.redis.set(key, value)
        return 'OK'
      },
    },
    ensureItemState: async () => ({ ...proof.domain.itemState }),
    readQcoinBalanceMicro: async (userId) => proof.domain.balanceMicro[userId] || 0,
    writeQcoinBalanceMicro: async (userId, next) => {
      proof.domain.balanceMicro[userId] = next
      return next / 1_000_000
    },
    getUserItemCount: async (userId, itemId) => proof.domain.counts[countKey(userId, itemId)] || 0,
    setUserItemCount: async (userId, itemId, count) => {
      proof.domain.counts[countKey(userId, itemId)] = count
      return count
    },
    popMarketToken: async () => {
      const tokenId = proof.domain.marketTokens.shift()
      return tokenId ? proof.domain.tokens[tokenId] : null
    },
    nextGlobalSeq: async () => ++proof.domain.sequence,
    mintToken: async (item, serial, txId) => ({
      tokenId: `token:${serial}`,
      serial,
      itemId: item.itemId,
      ownerId: 'MARKET',
      status: 'market',
      lastTxId: txId,
    }),
    writeToken: async (token) => { proof.domain.tokens[token.tokenId] = { ...token } },
    addTokenToUser: async (userId, _itemId, tokenId) => {
      proof.domain.userTokens[userId] ||= []
      if (!proof.domain.userTokens[userId].includes(tokenId)) proof.domain.userTokens[userId].push(tokenId)
    },
    removeTokenFromUser: async (userId, _itemId, tokenId) => {
      proof.domain.userTokens[userId] = (proof.domain.userTokens[userId] || []).filter((id) => id !== tokenId)
    },
    selectUserToken: async (userId, itemId, tokenId = '') => {
      const selected = tokenId || (proof.domain.userTokens[userId] || [])[0]
      const token = proof.domain.tokens[selected]
      return token?.itemId === itemId && token?.ownerId === userId ? { ...token } : null
    },
    addTokenToMarket: async (_itemId, tokenId) => { proof.domain.marketTokens.push(tokenId) },
    writeItemState: async (_itemId, patch) => {
      proof.domain.itemState = { ...proof.domain.itemState, ...patch }
      return { ...proof.domain.itemState }
    },
    appendAudit: async () => {},
    reconcileOwnersCount: async () => 0,
  }
})

vi.mock('../../../app/api/metamarket/_locks.js', () => ({
  withMetaMarketLocks: async (_keys, work) => work(),
}))

vi.mock('../../../app/api/metamarket/_ledger.js', () => ({
  createTxId: (type) => `${type}:proof`,
  writeLedgerEvent: async (event) => {
    proof.domain.ledger.push(event)
    throw new Error('injected_final_ledger_failure')
  },
}))

vi.mock('../../../app/api/metamarket/_identity.js', () => ({
  resolveRecipientId: async (raw) => String(raw || ''),
}))

vi.mock('../../../lib/economic-integrity/productionRoute.cjs', () => ({
  default: {
    beginVerifiedEconomicOperation: async (input) => ({
      authorization: {
        replay: false,
        envelope: {
          idempotencyKey: input.idempotencyKey,
          sourceEventId: input.sourceEventId,
        },
        decisionReceipt: { proof: true },
      },
    }),
    commitVerifiedEconomicOperation: async (_started, result) => {
      proof.domain.economicCommitted = true
      return result
    },
    abortVerifiedEconomicOperation: async () => { proof.aborts += 1 },
  },
}))

vi.mock('../../../lib/mongo/transaction-context.cjs', () => ({
  default: {
    withMongoOperationContext: async (work) => work(),
    withMongoTransaction: async (work) => {
      proof.transactions += 1
      const before = structuredClone(proof.domain)
      try {
        return await work()
      } catch (error) {
        proof.domain = before
        throw error
      }
    },
  },
}))

const transactions = await import('../../../app/api/metamarket/_transactions.js')

describe('MetaMarket transaction rollback proof', () => {
  beforeEach(() => proof.reset('buy'))

  test('BUY rolls ownership, supply and QCoin back when the final ledger write fails', async () => {
    const before = structuredClone(proof.domain)
    await expect(transactions.buyItem({
      userId: 'actor',
      itemId: 'item-1',
      quantity: 1,
      idempotencyKey: 'buy-proof',
      source: 'dev',
    })).rejects.toThrow('injected_final_ledger_failure')

    expect(proof.domain).toEqual(before)
    expect(proof.transactions).toBe(1)
    expect(proof.aborts).toBe(1)
  })

  test('SELL rolls ownership, supply and QCoin back when the final ledger write fails', async () => {
    proof.reset('sell')
    const before = structuredClone(proof.domain)
    await expect(transactions.sellItem({
      userId: 'actor',
      itemId: 'item-1',
      quantity: 1,
      idempotencyKey: 'sell-proof',
      source: 'dev',
    })).rejects.toThrow('injected_final_ledger_failure')

    expect(proof.domain).toEqual(before)
    expect(proof.transactions).toBe(1)
    expect(proof.aborts).toBe(1)
  })

  test('GIFT rolls both owners and the token back when the final ledger write fails', async () => {
    proof.reset('gift')
    const before = structuredClone(proof.domain)
    await expect(transactions.giftItem({
      userId: 'actor',
      recipientId: 'recipient',
      itemId: 'item-1',
      quantity: 1,
      idempotencyKey: 'gift-proof',
      source: 'dev',
    })).rejects.toThrow('injected_final_ledger_failure')

    expect(proof.domain).toEqual(before)
    expect(proof.transactions).toBe(1)
    expect(proof.aborts).toBe(1)
  })
})
