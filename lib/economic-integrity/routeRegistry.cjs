const VERSION = 'ql7.economic.route-registry.v5.1'
const POLICY_VERSION = 'rev5.1'

function route(writerOwner, allowedOperationTypes, requiredReceipts, amountBounds, sideEffectOwner, rollbackOwner, extra = {}) {
  return Object.freeze({
    writerOwner,
    allowedOperationTypes: Object.freeze([...allowedOperationTypes]),
    requiredReceipts: Object.freeze([...requiredReceipts]),
    requiredActorState: Object.freeze(extra.requiredActorState || ['verified']),
    amountBounds: Object.freeze(amountBounds || [0, Number.MAX_SAFE_INTEGER]),
    frequencyBounds: Object.freeze(extra.frequencyBounds || { max: 10000, windowSec: 86400 }),
    idempotencyRule: extra.idempotencyRule || 'required',
    replayRule: extra.replayRule || 'same-result',
    fraudSignals: Object.freeze(extra.fraudSignals || []),
    sideEffectOwner,
    rollbackOwner,
    operationFamily: extra.operationFamily || 'economic',
  })
}

const ROUTES = Object.freeze({
  'qcoin.topup.webhook': route('qcoin-primary', ['credit'], ['payment'], [0.000001, 10_000_000], 'qcoin-primary.incrementBalance', 'economic.reversal'),
  'qcoin.topup.debug': route('qcoin-primary', ['credit'], ['operator-approval'], [0.000001, 10_000_000], 'qcoin-primary.incrementBalance', 'economic.reversal'),
  'qcoin.drop': route('qcoin-primary', ['credit'], ['drop-policy'], [0.000001, 1_000_000], 'qcoin-primary.incrementBalance', 'economic.reversal'),
  'qcoin.heartbeat.accrual': route('qcoin-primary', ['credit'], ['activity-accrual'], [0, 1], 'qcoin-primary.writeState', 'economic.reversal', { frequencyBounds: { max: 100000, windowSec: 86400 } }),
  'qcoin.entitlement.purchase.debit': route('qcoin-entitlement-purchase', ['debit'], ['qcoin-purchase'], [0.000001, 100_000_000], 'qcoin-primary.debitBalanceIfSufficient', 'economic.reversal'),
  'academy.exam.reward': route('qcoin-primary', ['credit'], ['exam-result'], [0.000001, 1_000_000], 'qcoin-primary.incrementBalance', 'economic.reversal'),
  'quest.reward': route('qcoin-primary', ['credit'], ['quest-completion'], [0.000001, 1_000_000], 'qcoin-primary.incrementBalance', 'economic.reversal'),
  'referral.reward': route('qcoin-primary', ['credit'], ['referral-event'], [0.000001, 1_000_000], 'qcoin-primary.incrementBalance', 'economic.reversal'),
  'battlecoin.open.debit': route('battlecoin-primary', ['debit'], ['battle-order'], [0.000001, 10_000_000], 'qcoin-primary.incrementBalance', 'economic.reversal'),
  'battlecoin.settlement': route('battlecoin-primary', ['credit'], ['battle-settlement'], [0, 100_000_000], 'qcoin-primary.incrementBalance', 'economic.reversal'),
  'metamarket.buy': route('metamarket-transactions', ['debit', 'ownership_transfer'], ['market-order'], [0.000001, 100_000_000], 'metamarket-primary', 'economic.reversal'),
  'metamarket.sell': route('metamarket-transactions', ['credit', 'ownership_transfer'], ['market-order'], [0.000001, 100_000_000], 'metamarket-primary', 'economic.reversal'),
  'metamarket.gift': route('metamarket-transactions', ['ownership_transfer'], ['market-order'], [0, 100_000_000], 'metamarket-primary', 'economic.reversal'),
  'vip.payment.activation': route('subscriptions-primary', ['entitlement_activate', 'entitlement_extend'], ['payment'], [0, 1_000_000], 'subscriptions-primary.setVip', 'economic.entitlement-reversal'),
  'vip.qcoin.activation': route('qcoin-entitlement-purchase', ['entitlement_extend'], ['qcoin-purchase'], [1, 3650], 'subscriptions-primary.setVip', 'economic.entitlement-reversal'),
  'vip.referral.activation': route('subscriptions-primary', ['entitlement_activate', 'entitlement_extend'], ['referral-event'], [0, 1_000_000], 'subscriptions-primary.setVip', 'economic.entitlement-reversal'),
  'vip.debug.grant': route('subscriptions-primary', ['entitlement_activate', 'entitlement_extend'], ['operator-approval'], [0, 1_000_000], 'subscriptions-primary.setVip', 'economic.entitlement-reversal'),
  'ads.payment.activation': route('adsCore', ['entitlement_activate'], ['payment'], [0, 1_000_000], 'adsCore.grantAdsPackageForAccount', 'economic.entitlement-reversal'),
  'ads.qcoin.activation': route('qcoin-entitlement-purchase', ['entitlement_activate'], ['qcoin-purchase'], [0, 1_000_000], 'adsCore.grantAdsPackageForAccount', 'economic.entitlement-reversal'),
  'ads.debug.grant': route('adsCore', ['entitlement_activate'], ['operator-approval'], [0, 1_000_000], 'adsCore.grantAdsPackageForAccount', 'economic.entitlement-reversal'),
  'ai.quota.consume': route('aiquota', ['quota_consume'], ['quota-entitlement'], [0.000001, 1_000_000], 'aiquota', 'economic.reversal'),
  'operator.correction': route('economic-operator', ['credit', 'debit', 'entitlement_activate', 'entitlement_extend'], ['operator-approval'], [0, 100_000_000], 'registered-writer', 'economic.reversal'),
  'economic.reversal': route('economic-reconciliation', ['reversal'], ['original-commit'], [0, 100_000_000], 'registered-writer', 'none'),
  'economic.migration': route('economic-migration', ['migration'], ['migration-approval'], [0, 100_000_000], 'registered-writer', 'economic.reversal'),
})

function getRoute(routeId) { return ROUTES[String(routeId || '').trim()] || null }
function listRoutes() { return Object.entries(ROUTES).map(([routeId, value]) => Object.freeze({ routeId, ...value })) }
function hasRoute(routeId) { return !!getRoute(routeId) }

module.exports = { VERSION, POLICY_VERSION, ROUTES, getRoute, listRoutes, hasRoute }
