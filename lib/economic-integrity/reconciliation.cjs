const crypto = require('node:crypto')
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])); return value }
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex') }
function reconcileSnapshot({ balance = 0, ledgerEntries = [], entitlement = null, expectedEntitlement = null, accountId = '' } = {}) {
  const ledgerSum = (ledgerEntries || []).reduce((sum, row) => sum + Number(row?.amount || 0), 0)
  const delta = Number(balance) - ledgerSum
  const entitlementMismatch = expectedEntitlement !== null && JSON.stringify(stable(entitlement)) !== JSON.stringify(stable(expectedEntitlement))
  const body = {
    schema: 'ql7.economic.reconciliation.v5.1', accountId: String(accountId || ''), balance: Number(balance), ledgerSum,
    delta, entitlementMismatch, decision: Math.abs(delta) < 1e-9 && !entitlementMismatch ? 'PASS' : 'HOLD_FOR_REVIEW',
    automaticRepairAllowed: false, checkedAt: new Date().toISOString(),
  }
  return Object.freeze({ ...body, reconciliationHash: hash(body) })
}
module.exports = { reconcileSnapshot }
