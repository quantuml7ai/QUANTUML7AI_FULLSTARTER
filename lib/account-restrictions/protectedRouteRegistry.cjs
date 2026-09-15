const VERSION = 'ql7.account-restriction.protected-route-registry.v5.1'
const ACTIONS = Object.freeze({
  'forum.publish': Object.freeze({ scope: 'publication', allowedDuringQuarantine: false }),
  'forum.react': Object.freeze({ scope: 'social', allowedDuringQuarantine: false }),
  'forum.follow': Object.freeze({ scope: 'social', allowedDuringQuarantine: false }),
  'forum.upload': Object.freeze({ scope: 'publication', allowedDuringQuarantine: false }),
  'dm.send': Object.freeze({ scope: 'messaging', allowedDuringQuarantine: false }),
  'battle_chat.send': Object.freeze({ scope: 'messaging', allowedDuringQuarantine: false }),
  'battle_chat.react': Object.freeze({ scope: 'social', allowedDuringQuarantine: false }),
  'economic.write': Object.freeze({ scope: 'economic', allowedDuringQuarantine: false }),
  'metamarket.write': Object.freeze({ scope: 'economic', allowedDuringQuarantine: false }),
  'battlecoin.write': Object.freeze({ scope: 'economic', allowedDuringQuarantine: false }),
  'profile.destructive': Object.freeze({ scope: 'destructive', allowedDuringQuarantine: false }),
  'support_security': Object.freeze({ scope: 'support', allowedDuringQuarantine: true }),
  'appeal': Object.freeze({ scope: 'appeal', allowedDuringQuarantine: true }),
  'privacy_read': Object.freeze({ scope: 'privacy', allowedDuringQuarantine: true }),
  'legal_read': Object.freeze({ scope: 'legal', allowedDuringQuarantine: true }),
  'logout': Object.freeze({ scope: 'auth', allowedDuringQuarantine: true }),
  'account_export': Object.freeze({ scope: 'privacy', allowedDuringQuarantine: true }),
})
function getProtectedAction(actionId) { return ACTIONS[String(actionId || '').trim()] || null }
function listProtectedActions() { return Object.entries(ACTIONS).map(([actionId, value]) => Object.freeze({ actionId, ...value })) }
module.exports = { VERSION, ACTIONS, getProtectedAction, listProtectedActions }
