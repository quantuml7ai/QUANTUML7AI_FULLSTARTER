export const QL7_SUPPORT_IDLE_POLICY_VERSION_V12 = '12.0.0'

function str(value) { return String(value ?? '').trim() }

export function evaluateQl7SupportIdlePolicyV12({ ledger = {}, state = '', lastAssistantAtMs = 0, nowMs = Date.now(), locale = 'en' } = {}) {
  const runtimeState = str(state || ledger.caseStatus || (ledger.openMaterialQuestion ? 'waiting_user' : 'idle'))
  const elapsedMs = Math.max(0, Number(nowMs || 0) - Number(lastAssistantAtMs || 0))
  const hasMaterialTurn = ledger.openMaterialQuestion === true || (Array.isArray(ledger.turns) && ledger.turns.some((turn) => turn?.material === true))
  const waitingChoice = runtimeState === 'waiting_choice'
  const allowed = hasMaterialTurn && ['waiting_user', 'waiting_choice', 'clarifying'].includes(runtimeState) && elapsedMs >= 5 * 60 * 1000
  return Object.freeze({
    version: QL7_SUPPORT_IDLE_POLICY_VERSION_V12,
    allowed,
    reason: allowed ? 'material_waiting_user' : (!hasMaterialTurn ? 'no_material_user_turn' : (elapsedMs < 5 * 60 * 1000 ? 'too_early' : 'state_not_waiting')),
    delayMs: waitingChoice ? 7 * 60 * 1000 : 5 * 60 * 1000,
    locale: str(locale) || 'en',
    messageKey: waitingChoice ? 'choose_option_or_describe' : 'material_followup_only',
  })
}
