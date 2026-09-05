import { describe, expect, test } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

const VIP_ENTRY_FILES = [
  'app/subscribe/subscribe.client.jsx',
  'app/exchange/page.js',
  'app/exchange/BattleCoin.jsx',
  'app/academy/AcademyExamBlock.js',
  'app/forum/features/profile/hooks/useVipPayAction.js',
]

describe('VIP and Ads payment-method fork contract', () => {
  test.each(VIP_ENTRY_FILES)('%s opens the shared fork before retaining NOWPayments create', (file) => {
    const source = readRepoFile(file)
    expect(source).toContain('openPaymentMethodPopover')
    expect(source).toContain("purpose: 'vip'")
    expect(source).toContain("method === 'qcoin'")
    expect(source).toContain('/api/pay/create')
  })

  test('routes the selected Ads package through the same shared fork', () => {
    const source = readRepoFile('app/ads/page.jsx')
    expect(source).toContain('openPaymentMethodPopover')
    expect(source).toContain("purpose: 'ads'")
    expect(source).toContain('adsPackage: selectedPkg.tier')
    expect(source).toContain("method === 'qcoin'")
    expect(source).toContain('/api/pay/create')
  })

  test('keeps QCoin top-up fully outside the payment-method popover', () => {
    const create = readRepoFile('app/api/qcoin/topup/create/route.js')
    const webhook = readRepoFile('app/api/qcoin/topup/webhook/route.js')
    const wallet = readRepoFile('components/QuantumWallet.jsx')

    for (const source of [create, webhook, wallet]) {
      expect(source).not.toContain('qcoin-purchase')
      expect(source).not.toContain('openPaymentMethodPopover')
      expect(source).not.toContain('PaymentMethodPopoverHost')
    }
    expect(wallet).toContain('/api/qcoin/topup/create')
  })

  test('uses a hard body portal with bounded desktop and mobile geometry', () => {
    const host = readRepoFile('components/PaymentMethodPopoverHost.jsx')
    const layout = readRepoFile('app/layout.js')

    expect(host).toContain('createPortal(')
    expect(host).toContain('document.body')
    expect(host).toContain('width:min(760px')
    expect(host).toContain('@media(max-width:640px)')
    expect(host).toContain('aspect-ratio:1/1')
    expect(host).toContain('pmp-shine-left')
    expect(host).toContain('pmp-shine-right')
    expect(host).toContain('function QuantumPayTitle')
    expect(host).toContain('pmp-title-dust')
    expect(host).toContain('pmp-now-letter')
    expect(host).toContain('pmp-wallet-burst')
    expect(host).toContain('fill="#ffd66b"')
    expect(host).not.toContain('pmp-wallet-trace')
    expect(host).toContain('@media(prefers-reduced-motion:reduce)')
    expect(host).toContain("setPhase('quote-error')")
    expect(host).toContain("finish({ method: 'nowpayments' })")
    expect(layout).toContain('<PaymentMethodPopoverHost />')
  })

  test('ships complete localizations for the exact seven application languages', () => {
    const source = readRepoFile('components/paymentMethodI18n.js')
    for (const lang of ['ru', 'en', 'zh', 'uk', 'ar', 'tr', 'es']) {
      expect(source).toContain(`${lang}: {`)
    }
    expect(source).toContain("PAYMENT_METHOD_LANGS = Object.freeze(['ru', 'en', 'zh', 'uk', 'ar', 'tr', 'es'])")
    expect(source).toContain("title: 'Оплата'")
    expect(source).toContain("description: 'Выберите способ оплаты'")
  })
})

describe('QCoin entitlement purchase security contract', () => {
  test('authenticates the actor and accepts only VIP or Ads product selectors', () => {
    const route = readRepoFile('app/api/pay/qcoin-purchase/route.js')
    const service = readRepoFile('lib/qcoinEntitlementPurchase.js')

    expect(route).toContain('resolveQl7VerifiedActor')
    expect(route).toContain('actor.canonicalAccountId')
    expect(route).toContain("action === 'quote'")
    expect(route).toContain("action === 'purchase'")
    expect(service).toContain("if (cleanPurpose === 'vip')")
    expect(service).toContain("if (cleanPurpose === 'ads')")
    expect(service).toContain("throw purchaseFailure('UNKNOWN_PURPOSE'")
    expect(service).not.toContain('qcoin_topup')
    expect(service).toContain("name: 'QL7_DEVICE_EVIDENCE_SALT', minLength: 16")
    expect(route).toContain("'PAYMENT_CONFIGURATION_UNAVAILABLE'")
    expect(route).toContain('traceId')
  })

  test('owns price on the server and fixes the exchange rate at one QCoin per USD', () => {
    const service = readRepoFile('lib/qcoinEntitlementPurchase.js')

    expect(service).toContain('process.env.PLAN_PRICE_USD')
    expect(service).toContain('getAdsPackageConfig(adsPackage)')
    expect(service).toContain('const QCOIN_PER_USD = 1')
    expect(service).toContain('amountQcoin: money(amountUsd * QCOIN_PER_USD)')
    expect(service).not.toContain('body?.amount')
  })

  test('commits debit, ledger, idempotency, receipt and entitlement in one Mongo transaction', () => {
    const service = readRepoFile('lib/qcoinEntitlementPurchase.js')
    const qcoin = readRepoFile('lib/mongo/qcoin-primary.cjs')
    const subscriptions = readRepoFile('lib/mongo/subscriptions-primary.cjs')
    const ads = readRepoFile('lib/mongo/ads-primary.cjs')
    const registry = readRepoFile('lib/economic-integrity/routeRegistry.cjs')

    expect(service).toContain('transactionContext.withMongoTransaction(async () =>')
    expect(service).toContain('qcoinPrimary.debitBalanceIfSufficient')
    expect(service).toContain('addVipDays(accountId, product.vipDays')
    expect(service).toContain('grantAdsPackageForAccount({')
    expect(service).toContain("status: 'completed'")
    expect(qcoin).toContain("{ $and: [updateFilter, { balance: { $gte: debit } }] }")
    expect(qcoin).toContain("error.code = 'INSUFFICIENT_QCOIN'")
    expect(subscriptions).toContain('return bindMongoDatabase(database)')
    expect(ads).toContain('return bindMongoDatabase(database)')
    expect(registry).toContain("'qcoin.entitlement.purchase.debit'")
    expect(registry).toContain("'vip.qcoin.activation'")
    expect(registry).toContain("'ads.qcoin.activation'")
  })

  test('indexes purchase receipts and includes them in complete account deletion', () => {
    const service = readRepoFile('lib/qcoinEntitlementPurchase.js')
    const deletion = readRepoFile('lib/mongo/account-deletion-primary.cjs')

    expect(service).toContain("const PURCHASE_COLLECTION = 'qcoin_entitlement_purchases'")
    expect(service).toContain('await ensurePurchaseStorage()')
    expect(service).toContain('purchases.createIndex({ accountId: 1, completedAt: -1 })')
    expect(deletion).toContain("name: 'qcoin_entitlement_purchases'")
  })

  test('does not modify or couple the existing NOWPayments create and webhook routes', () => {
    const create = readRepoFile('app/api/pay/create/route.js')
    const webhook = readRepoFile('app/api/pay/webhook/route.js')

    expect(create).not.toContain('qcoinEntitlementPurchase')
    expect(create).not.toContain('qcoin-purchase')
    expect(webhook).not.toContain('qcoinEntitlementPurchase')
    expect(webhook).not.toContain('qcoin-purchase')
  })
})
