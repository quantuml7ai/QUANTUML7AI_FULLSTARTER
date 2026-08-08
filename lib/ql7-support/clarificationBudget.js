import crypto from 'node:crypto'

function str(value) { return String(value ?? '').trim() }
function normalize(value = '') {
  return str(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim()
}
function fingerprint(value = '') {
  return crypto.createHash('sha256').update(normalize(value)).digest('hex')
}

export const QL7_SUPPORT_MAX_TEXTUAL_CLARIFICATION_ROUNDS = 2
export const QL7_SUPPORT_MAX_QUESTIONS_PER_REPLY = 1

export function countQl7SupportClarificationRounds(memory = {}) {
  const explicit = Number(memory?.clarificationRounds)
  if (Number.isFinite(explicit) && explicit >= 0) return Math.min(99, Math.floor(explicit))
  const questions = Array.isArray(memory?.questionsAsked) ? memory.questionsAsked : []
  return Math.min(99, questions.length)
}

export function hasQl7SupportQuestionBeenAsked(memory = {}, question = '') {
  const target = fingerprint(question)
  const fingerprints = new Set([
    ...(Array.isArray(memory?.questionFingerprints) ? memory.questionFingerprints : []),
    ...(Array.isArray(memory?.questionsAsked) ? memory.questionsAsked.map(fingerprint) : []),
  ].map(str).filter(Boolean))
  return fingerprints.has(target)
}

export function planQl7SupportClarification({
  memory = {},
  question = '',
  hypotheses = [],
  hasSufficientEvidence = false,
  canDiagnose = false,
  selfStatus = false,
} = {}) {
  const rounds = countQl7SupportClarificationRounds(memory)
  const safeQuestion = str(question)
  const repeated = safeQuestion ? hasQl7SupportQuestionBeenAsked(memory, safeQuestion) : false
  const options = (Array.isArray(hypotheses) ? hypotheses : []).slice(0, 4)
  if (hasSufficientEvidence || canDiagnose || selfStatus) {
    return Object.freeze({
      action: 'diagnose',
      rounds,
      repeated,
      question: '',
      options: Object.freeze([]),
      reason: selfStatus ? 'verified_self_status' : 'sufficient_evidence',
    })
  }
  if (!safeQuestion || repeated || rounds >= QL7_SUPPORT_MAX_TEXTUAL_CLARIFICATION_ROUNDS) {
    return Object.freeze({
      action: options.length ? 'show_options' : 'wait_or_review',
      rounds,
      repeated,
      question: '',
      options: Object.freeze(options),
      reason: repeated ? 'question_repeated' : (rounds >= QL7_SUPPORT_MAX_TEXTUAL_CLARIFICATION_ROUNDS ? 'clarification_budget_exhausted' : 'no_useful_question'),
    })
  }
  return Object.freeze({
    action: 'ask_one',
    rounds,
    repeated: false,
    question: safeQuestion,
    options: Object.freeze([]),
    reason: 'one_material_question',
    nextRounds: rounds + 1,
    questionFingerprint: fingerprint(safeQuestion),
  })
}

export function mergeQl7SupportClarificationMemory(memory = {}, plan = {}) {
  if (plan?.action !== 'ask_one' || !plan?.questionFingerprint) return { ...(memory || {}) }
  const fingerprints = [
    ...(Array.isArray(memory?.questionFingerprints) ? memory.questionFingerprints : []),
    plan.questionFingerprint,
  ].filter(Boolean)
  return {
    ...(memory || {}),
    clarificationRounds: Number(plan.nextRounds || countQl7SupportClarificationRounds(memory)),
    questionFingerprints: [...new Set(fingerprints)].slice(-8),
  }
}
