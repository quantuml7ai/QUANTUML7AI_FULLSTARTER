export const QL7_SUPPORT_ACTION_ONTOLOGY_VERSION = '5.1.1'

const ACTION_ROWS = Object.freeze([
  ['explain', 'runtime', false, false],
  ['clarify', 'runtime', false, false],
  ['read_actor_data', 'read_adapter', false, true],
  ['open_route', 'signed_action', false, true],
  ['create_operator_case', 'operator_case', true, true],
  ['economic_write', 'economic_gate', true, true],
  ['publish_content', 'composer_gate', true, true],
  ['quarantine', 'quarantine_policy', true, true],
  ['appeal', 'restriction_service', true, true],
])

export const QL7_SUPPORT_ACTION_CLASSES = Object.freeze(
  ACTION_ROWS.map(([actionId, authority, sideEffect, receiptRequired]) => Object.freeze({
    actionId,
    authority,
    sideEffect,
    receiptRequired,
    clientAuthority: false,
    version: QL7_SUPPORT_ACTION_ONTOLOGY_VERSION,
  })),
)

export function getQl7SupportActionClass(actionId = '') {
  return QL7_SUPPORT_ACTION_CLASSES.find((row) => row.actionId === String(actionId)) || null
}

export function validateQl7SupportActionAuthorization({
  actionId = '',
  authority = '',
  receiptPresent = false,
  actorVerified = false,
} = {}) {
  const action = getQl7SupportActionClass(actionId)
  const failures = []
  if (!action) failures.push('action_unknown')
  if (action && authority && action.authority !== authority) failures.push('action_authority_mismatch')
  if (action?.receiptRequired && receiptPresent !== true) failures.push('action_receipt_required')
  if (['read_actor_data', 'economic_write', 'quarantine', 'appeal'].includes(actionId) && actorVerified !== true) {
    failures.push('verified_actor_required')
  }
  return Object.freeze({
    ok: failures.length === 0,
    action,
    failures: Object.freeze(failures),
  })
}
