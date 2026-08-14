import crypto from 'crypto'

const MAX_RELEVANT_MESSAGES = 20
const MAX_QUESTIONS = 3
const MAX_REPLY_HISTORY = 24

function str(value) {
  return String(value ?? '').trim()
}

function clone(value) {
  try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null }
}

function unique(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : [values]).map(str).filter(Boolean)))
}

export function semanticFingerprint(value = '') {
  const normalized = str(value)
    .toLowerCase()
    .normalize('NFKC')
    .replace(/\b\d{5,}\b/g, '#id')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 24)
}

export function normalizeQl7SupportMemory(caseDoc = {}) {
  const outer = caseDoc && typeof caseDoc === 'object' ? caseDoc : {}
  const nested = outer.memory && typeof outer.memory === 'object' ? outer.memory : {}
  const doc = { ...nested, ...outer }
  return {
    revision: Math.max(0, Number(doc.revision || 0)),
    currentQuestionCode: str(doc.currentQuestionCode),
    targetSlot: str(doc.targetSlot),
    questionsAsked: (Array.isArray(doc.questionsAsked) ? doc.questionsAsked : []).slice(-MAX_QUESTIONS),
    entities: clone(doc.entities) || {},
    slots: clone(doc.slots) || {},
    claims: (Array.isArray(doc.claims) ? doc.claims : []).slice(-40),
    confirmedFacts: (Array.isArray(doc.confirmedFacts) ? doc.confirmedFacts : []).slice(-40),
    inferredFacts: (Array.isArray(doc.inferredFacts) ? doc.inferredFacts : []).slice(-40),
    contradictions: (Array.isArray(doc.contradictions) ? doc.contradictions : []).slice(-20),
    corrections: (Array.isArray(doc.corrections) ? doc.corrections : []).slice(-20),
    replyHistory: (Array.isArray(doc.replyHistory) ? doc.replyHistory : []).slice(-MAX_REPLY_HISTORY),
    relevantMessages: (Array.isArray(doc.relevantMessages) ? doc.relevantMessages : []).slice(-MAX_RELEVANT_MESSAGES),
    validatedSummary: str(doc.validatedSummary).slice(0, 1800),
    previousTopic: str(doc.topic || doc.previousTopic),
    previousSubIntent: str(doc.subIntent || doc.previousSubIntent),
    caseStatus: str(doc.caseStatus),
  }
}

function provenanceFact({ key, value, source = 'user_claim', messageId = '', asOf = '', confidence = 0.5 } = {}) {
  return {
    key: str(key),
    value: clone(value),
    source: str(source),
    messageId: str(messageId),
    asOf: str(asOf) || new Date().toISOString(),
    confidence: Math.max(0, Math.min(1, Number(confidence || 0))),
  }
}

function mergeObject(base = {}, patch = {}) {
  const out = { ...(base && typeof base === 'object' ? base : {}) }
  for (const [key, value] of Object.entries(patch && typeof patch === 'object' ? patch : {})) {
    if (value === '' || value == null || value === false) continue
    out[key] = clone(value)
  }
  return out
}

export function mergeQl7SupportMemory({
  previousCase = {},
  currentMessage = {},
  analysis = {},
  now = new Date().toISOString(),
} = {}) {
  const prev = normalizeQl7SupportMemory(previousCase)
  const messageId = str(currentMessage.id || currentMessage.messageId)
  const currentText = str(analysis.sanitizedText || currentMessage.safeText || currentMessage.text)
  const fingerprint = semanticFingerprint(currentText)
  const entities = mergeObject(prev.entities, analysis.entities)
  const slots = mergeObject(prev.slots, analysis.slots || analysis.entities)
  const claims = [...prev.claims]
  for (const [key, value] of Object.entries(analysis.entities || {})) {
    if (value === '' || value == null || value === false) continue
    claims.push(provenanceFact({ key, value, source: 'user_claim', messageId, asOf: now, confidence: analysis.confidence || 0.6 }))
  }

  const corrections = [...prev.corrections]
  if (analysis.messageAct === 'correction' || analysis.role === 'correction') {
    for (const [key, value] of Object.entries(analysis.entities || {})) {
      if (!(key in prev.entities) || String(prev.entities[key]) === String(value)) continue
      corrections.push({
        key,
        oldValue: clone(prev.entities[key]),
        newValue: clone(value),
        messageId,
        correctedAt: now,
      })
    }
  }

  const questionCode = str(analysis.currentQuestionCode)
  const questionsAsked = unique([
    ...prev.questionsAsked,
    ...(questionCode ? [questionCode] : []),
  ]).slice(-MAX_QUESTIONS)

  const relevantMessages = [
    ...prev.relevantMessages,
    {
      id: messageId,
      direction: 'user',
      topic: str(analysis.topic),
      subIntent: str(analysis.subIntent),
      messageAct: str(analysis.messageAct || analysis.role),
      fingerprint,
      textPreview: currentText.slice(0, 320),
      at: now,
    },
  ].slice(-MAX_RELEVANT_MESSAGES)

  return {
    ...prev,
    revision: prev.revision + 1,
    currentMessageId: messageId,
    currentMessageFingerprint: fingerprint,
    currentQuestionCode: questionCode,
    targetSlot: questionCode ? str(analysis.targetSlot || questionCode.replace(/_question$/, '')) : '',
    questionsAsked,
    entities,
    slots,
    claims: claims.slice(-40),
    corrections: corrections.slice(-20),
    relevantMessages,
    previousTopic: str(analysis.topic || prev.previousTopic),
    previousSubIntent: str(analysis.subIntent || prev.previousSubIntent),
    updatedAt: now,
  }
}

export function registerQl7SupportReply(memory = {}, { text = '', responseCode = '', messageId = '', at = '' } = {}) {
  const prev = normalizeQl7SupportMemory(memory)
  const safeText = str(text)
  const fingerprint = semanticFingerprint(safeText)
  const textHash = crypto.createHash('sha256').update(safeText).digest('hex')
  const replyHistory = [
    ...prev.replyHistory,
    {
      fingerprint,
      textHash,
      responseCode: str(responseCode),
      messageId: str(messageId),
      at: str(at) || new Date().toISOString(),
    },
  ].slice(-MAX_REPLY_HISTORY)
  return {
    ...prev,
    replyHistory,
    lastReplyFingerprint: fingerprint,
    lastReplyTextHash: textHash,
  }
}

export function isQl7SupportSemanticRepeat(memory = {}, text = '', responseCode = '') {
  const prev = normalizeQl7SupportMemory(memory)
  const fingerprint = semanticFingerprint(text)
  return prev.replyHistory.slice(-6).some((row) => (
    row?.fingerprint === fingerprint ||
    (str(responseCode) && str(row?.responseCode) === str(responseCode) && row?.fingerprint === fingerprint)
  ))
}

export function shouldOpenNewQl7SupportCase({ previousCase = {}, analysis = {} } = {}) {
  const prev = normalizeQl7SupportMemory(previousCase)
  const newTopic = str(analysis.topic)
  const oldTopic = str(prev.previousTopic)
  const act = str(analysis.messageAct || analysis.role)
  if (!previousCase?._id && !previousCase?.caseId) return true
  if (['closed', 'superseded'].includes(str(previousCase.caseStatus))) return true
  if (act === 'new_unrelated_issue') return true
  if (newTopic && oldTopic && newTopic !== oldTopic && !['answer_to_question', 'correction', 'status_request'].includes(act)) return true
  return false
}
