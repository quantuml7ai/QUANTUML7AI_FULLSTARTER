import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)

describe('BattleCoin storage cutover status', () => {
  test('documents the approved Mongo Primary adapter contract', () => {
    const mongoBattlecoinAdapter = resolve(process.cwd(), 'lib/mongo/battlecoin-primary.cjs')

    expect(existsSync(mongoBattlecoinAdapter)).toBe(true)

    const battlecoinPrimary = require(mongoBattlecoinAdapter)
    expect(battlecoinPrimary).toMatchObject({
      readState: expect.any(Function),
      readOpenOrder: expect.any(Function),
      readHistory: expect.any(Function),
      openOrderWithStakeDebit: expect.any(Function),
      settleOrderWithQcoinReturn: expect.any(Function),
    })
    expect(battlecoinPrimary.constants).toMatchObject({
      HISTORY_MAIN: 'battlecoin_order_history',
      HISTORY_LEGACY: 'battlecoin_order_histories',
      COUNTERS_MAIN: 'battlecoin_counters',
      COUNTERS_LEGACY: 'battlecoin_order_counters',
    })
  })
})
