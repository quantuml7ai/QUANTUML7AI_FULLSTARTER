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

describe('Academy single-card checkpoint contract', () => {
  test('keeps the original exam economics and award FX contract intact', () => {
    const exam = readRepoFile('app/academy/AcademyExamBlock.js')
    const route = readRepoFile('app/api/academy/exam/route.js')
    const page = readRepoFile('app/academy/page.js')

    expect(exam).toContain("'/api/academy/exam?blockId=' + encodeURIComponent(blockId)")
    expect(exam).toContain('const snapshot = await ql7FetchAcademyExamState(')
    expect(exam).toContain("fetch('/api/academy/exam', {")
    expect(exam).toContain('correct: !!isCorrect')
    expect(exam).toContain('const awarded = data.awarded || 0')
    expect(exam).toContain('if (isCorrect && awarded > 0)')
    expect(exam).toContain('setShowAwardFx(true)')
    expect(exam).toContain('setShowAwardFx(false)')
    expect(exam).toContain('QL7-coinBurstOverlay')
    expect(exam).toContain('QL7-coinPiece')
    expect(route).toContain('if (blockId === 29) return 70')
    expect(page).not.toContain('.QL7-coinBurstOverlay')
    expect(page).not.toContain('.QL7-coinPiece')
    expect(page).toContain('className="QL7-academy-module"')
    expect(page).not.toContain('className="panel QL7-academy-module"')
    expect(page).toContain('overflow:visible !important')
  })

  test('renders ten Q&A cards then original exam, unique ad, and pagination at every checkpoint', () => {
    const page = readRepoFile('app/academy/page.js')
    expect(page).toContain('const ACADEMY_CHUNK_SIZE = 10')
    expect(page).toContain('chunkAcademyKeys(qaKeys)')
    expect(page).toContain('<AcademyExamViewport blockId={blockId}')
    expect(page).toContain('<AcademyAdViewport blockId={blockId}')
    expect(page).toContain('<AcademyPaginationControls page={pagination.page}')
    expect(page).toContain('academy_page_${page}_checkpoint_${checkpoint}')
    expect(page).toContain('slotKind="academy_after"')
    expect(page).toContain('key={slotKey}')
    expect(page).toContain("Array.from({ length: 70 }")
    expect((page.match(/blockId=\{\d+\}/g) || []).length).toBe(29)
  })

  test('keeps expensive art, exam and ad runtimes near the viewport through shared observers', () => {
    const page = readRepoFile('app/academy/page.js')
    expect(page).toContain("useNearViewport('320px 0px 320px 0px', false, 1800)")
    expect(page).toContain("useNearViewport('560px 0px 560px 0px', true)")
    expect(page).toContain("useNearViewport('900px 0px 900px 0px', true)")
    expect(page).toContain('const academyMountProfiles = new Map()')
    expect(page).toContain('new IntersectionObserver(')
    expect(page).toContain('profile.callbacks.set(node, onIntersect)')
    expect(page).toContain('const deactivateTimerRef = useRef(0)')
    expect(page).toContain('if (persistOnceActive && activatedRef.current) return')
    expect(page).toContain('setActive(false)')
    expect(page).toContain('Math.max(0, Number(deactivateDelayMs) || 0)')
    expect(page).not.toContain('content-visibility:auto')
    expect(page).not.toContain('contain-intrinsic-size:')
    expect(page).toContain('height:clamp(128px,13vw,196px)')
    expect(page).toContain('height:clamp(126px,34vw,154px)')
    expect(page).toContain('.QL7-art-placeholder { width:100%; height:100%')
    expect(page).toContain('.QL7-art-svg { position:absolute !important;')
    expect(page).toContain('active ? <AcademyExamBlock blockId={blockId} />')
    expect(page).toContain('active ? (')
    expect(page).toContain('<PremiumKnowledgeArt qaKey={qaKey} />')
    expect(page).toContain('<span className="QL7-art-glint"')
  })

  test('deduplicates Academy VIP and exam probes while keeping mounted checkpoint geometry stable', () => {
    const exam = readRepoFile('app/academy/AcademyExamBlock.js')
    const page = readRepoFile('app/academy/page.js')

    expect((exam.match(/fetch\('\/api\/subscription\/status'/g) || []).length).toBe(1)
    expect(exam).toContain('const academyVipStatusCache = new Map()')
    expect(exam).toContain('const academyVipStatusInflight = new Map()')
    expect(exam).toContain('const pending = academyVipStatusInflight.get(key)')
    expect(exam).toContain('Math.min(ttlExpiresAt, Math.max(Date.now(), untilMs))')
    expect(exam).toContain('const academyExamStateCache = new Map()')
    expect(exam).toContain('const academyExamStateInflight = new Map()')
    expect(exam).toContain('const pending = academyExamStateInflight.get(key)')
    expect(exam).toContain('ACADEMY_RUNTIME_CACHE_LIMIT = 64')
    expect(exam).toContain('if (!cooldownUntil || cooldownUntil <= Date.now()) return undefined')
    expect(exam).toContain('if (nextNow >= cooldownUntil) clearInterval(id)')
    expect(page).toContain("useNearViewport('560px 0px 560px 0px', true)")
    expect(page).toContain("useNearViewport('900px 0px 900px 0px', true)")
    expect(page).toContain('if (persistOnceActive && activatedRef.current) return')
    expect(page).not.toContain('content-visibility:auto')
    expect(page).not.toContain('contain-intrinsic-size:')
  })

  test('uses lightweight pointer swipe navigation without touchmove interception', () => {
    const page = readRepoFile('app/academy/page.js')
    expect(page).toContain('onPointerDown={onPointerDown}')
    expect(page).toContain('onPointerUp={onPointerUp}')
    expect(page).toContain("event.pointerType !== 'touch'")
    expect(page).toContain('Math.abs(dx) < 86')
    expect(page).toContain('touch-action:pan-y')
    expect(page).not.toContain('onTouchMove')
    expect(page).not.toContain("addEventListener('touchmove'")
  })

  test('keeps only transition pages mounted and displaces them without resetting vertical scroll', () => {
    const page = readRepoFile('app/academy/page.js')
    expect(page).not.toContain('residentPages')
    expect(page).toContain('transition ? [transition.from, transition.to] : [safePage]')
    expect(page).toContain("direction: next > safePage ? 'forward' : 'backward'")
    expect(page).toContain("data-direction={transition?.direction || 'idle'}")
    expect(page).toContain('data-phase={phase}')
    expect(page).toContain('animation-duration:520ms')
    expect(page).toContain(".QL7-academy-pager-track[data-direction='forward'],")
    const idleStageRule = page.match(/\.QL7-academy-page-stage \{([\s\S]*?)\n\s*\}/)?.[1] || ''
    expect(idleStageRule).not.toContain('transform:')
    expect(idleStageRule).not.toContain('backface-visibility')
    expect(idleStageRule).not.toContain('will-change')
    expect(page).toContain('@keyframes QL7AcademyPageOutForward')
    expect(page).toContain('@keyframes QL7AcademyPageInBackward')
    expect(page).not.toContain('scrollAcademyToTop')
    expect(page).not.toContain('window.scrollTo({ top: 0')
    expect(page).not.toContain('window.scrollTo(0, 0)')
    expect(page).not.toContain("document.querySelector('.page-content')")
  })

  test('uses one bounded static premium SVG per Q&A card with no invalid dynamic dimensions', () => {
    const page = readRepoFile('app/academy/page.js')
    expect(page).toContain('<PremiumKnowledgeArt qaKey={qaKey} />')
    expect(page).toContain('<clipPath id={clipId}>')
    expect(page).toContain('% 32')
    expect(page).toContain('% 20')
    expect(page).toContain('% 16')
    expect(page).toContain('function renderMicroLayer(')
    expect(page).toContain('return Math.max(0.75, svgRange')
    expect(page).toContain('return Math.max(1, svgRange')
    expect(page).not.toContain('<animate')
    expect(page).not.toContain('<filter')
    expect(page).not.toContain('Math.random(')
    expect(page).toContain('grid-template-areas:"art" "copy"')
    expect(page).toContain('height:124px; max-width:none')
    expect(page).toContain('function renderPrecisionLayer(')
  })
})
