import { describe, expect, test } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

describe('economic runtime hardening contract', () => {
  test('blocks a deployment before runtime when receipt HMAC keys are unavailable', () => {
    const packageJson = JSON.parse(readRepoFile('package.json'))
    const preflight = readRepoFile('tools/verify-economic-environment.mjs')

    expect(packageJson.scripts.prebuild).toBe('node tools/verify-economic-environment.mjs')
    expect(preflight).toContain("'QL7_ECONOMIC_SOURCE_HMAC_KEY'")
    expect(preflight).toContain("'QL7_ECONOMIC_DECISION_HMAC_KEY'")
    expect(preflight).toContain("'QL7_DEVICE_EVIDENCE_SALT'")
    expect(preflight).toContain('value.length < minLength')
    expect(preflight).toContain('minLength: 32')
    expect(preflight).toContain('minLength: 16')
    expect(preflight).not.toContain('console.log(value)')
  })

  test('keeps BattleCoin order, QCoin and economic idempotency in one Mongo transaction', () => {
    const battle = readRepoFile('lib/mongo/battlecoin-primary.cjs')
    const qcoin = readRepoFile('lib/mongo/qcoin-primary.cjs')
    const idempotency = readRepoFile('lib/economic-integrity/idempotency.cjs')
    const route = readRepoFile('app/api/battlecoin/order/route.js')

    expect(battle).toContain('withMongoTransaction')
    expect(battle.match(/return runBattlecoinTransaction\(async \(\) =>/gu)).toHaveLength(2)
    expect(battle).toContain('return bindMongoDatabase(database)')
    expect(qcoin).toContain('return bindMongoDatabase(database)')
    expect(idempotency).toContain('return bindMongoDatabase(database)')
    expect(qcoin).toContain('amount: Math.abs(delta)')
    expect(route).toContain('publicBattlecoinError')
    expect(route).not.toContain("error: String(e?.message || e)")
  })

  test('does not use a stale alias userId or the largest balance as ownership authority', () => {
    const profile = readRepoFile('lib/mongo/profile-primary.cjs')
    const accountDeletion = readRepoFile('lib/mongo/account-deletion-primary.cjs')
    const qcoin = readRepoFile('lib/mongo/qcoin-primary.cjs')
    const telegramConfirm = readRepoFile('app/api/telegram/link/confirm/route.js')

    expect(profile).toContain('row?.canonicalAccountId || row?.accountId || row?.userId')
    expect(profile).toContain("error.code = 'IDENTITY_LINK_CONFLICT'")
    expect(profile).toContain("database.collection('profile_telegram_link_index').createIndex({ telegramId: 1 }, { unique: true })")
    expect(profile).toContain("database.collection('profile_telegram_link_index').createIndex({ walletId: 1 }, { unique: true })")
    expect(profile).toContain('async function reserveTelegramWebLink(accountId, rawTelegramId')
    expect(profile).toContain('async function releaseTelegramWebLinkReservation(accountId, rawTelegramId')
    expect(accountDeletion).toContain("{ name: 'profile_telegram_link_index'")
    expect(qcoin).not.toContain('sort((a, b) => num(b?.balance')
    expect(qcoin).not.toContain('projectedBalance > currentBalance')
    expect(qcoin).toContain("error.code = 'QCOIN_IDENTITY_PROJECTION_CONFLICT'")
    expect(telegramConfirm).toContain('reserveTelegramWebLink(accountId, telegramId)')
    expect(telegramConfirm).toContain('assertTelegramLinkAvailable(accountId, telegramId)')
    expect(telegramConfirm).toContain("JSON.stringify({ ok: false, ignored: true, reason: 'ALREADY_LINKED' })")
    expect(telegramConfirm).toContain('releaseTelegramWebLinkReservation(accountId, telegramId)')
    expect(telegramConfirm).not.toContain('tg:link:lock:')
  })


  test('makes referral profile/code writes transaction-bound and concurrency-safe before compaction', () => {
    const referral = readRepoFile('lib/mongo/referral-primary.cjs')
    const linkRoute = readRepoFile('app/api/referral/link/route.js')

    expect(referral).toContain('return bindMongoDatabase(database)')
    expect(referral).toContain('withMongoTransaction')
    expect(referral).toContain("createIndex({ ownerKey: 1 }, { unique: true, sparse: true })")
    expect(referral).toContain('if (canonical) return canonical')
    expect(referral).toContain("error.code = 'REFERRAL_CODE_TAKEN'")
    expect(linkRoute).toContain("return bad('identity_link_conflict', 409)")
  })

  test('signs debug VIP and Ads economic receipts with canonical human principals', () => {
    const vip = readRepoFile('app/api/debug/vip/grant/route.js')
    const ads = readRepoFile('app/api/debug/ads/grant/route.js')

    expect(vip).toContain("mode: 'vip-debug-grant'")
    expect(vip).toContain('identity.vipEntitlementId')
    expect(vip).not.toContain("trim().toLowerCase()")
    expect(ads).toContain("mode: 'ads-debug-grant'")
    expect(ads).toContain('identity.adsOwnerId')
    expect(ads).not.toContain("trim().toLowerCase()")
  })  
})
