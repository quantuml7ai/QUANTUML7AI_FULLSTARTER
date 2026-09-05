const service = require('./quarantineService.cjs')
const { getProtectedAction } = require('./protectedRouteRegistry.cjs')
async function guardBusinessAction({ accountId, actionId, now = Date.now() } = {}) {
  const action = getProtectedAction(actionId)
  if (!action) return { allowed: false, status: 500, error: 'restriction_action_unregistered' }
  if (!accountId) return { allowed: true, actionId, anonymous: true }
  const state = await service.getActiveQuarantine(accountId, now)
  if (!state?.active) return { allowed: true, actionId }
  if (action.allowedDuringQuarantine === true) return { allowed: true, restricted: true, actionId, state }
  return {
    allowed: false, status: 423, error: 'account_quarantined', actionId,
    expiresAt: state.expiresAt, reasonCode: state.reasonCode, restrictionReceiptId: state.restrictionReceiptId,
  }
}
module.exports = { guardBusinessAction }
