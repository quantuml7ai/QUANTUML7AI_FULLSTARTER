import {selectQl7SupportGreetingDaypart} from './conversation/temporalContext.js'
import {QL7_SUPPORT_ALL_LOCALES} from './config/behaviorManifest.js'

export const QL7_SUPPORT_ENTRY_GREETING_STRATEGY_VERSION = '5.2.2'
export const QL7_SUPPORT_ENTRY_GREETING_STRATEGY_OWNER_ID = 'ql7-support.entry-greeting-strategy'

const ENTRY_MODES = Object.freeze(['fresh', 'continue'])
const DAYPARTS = Object.freeze(['neutral', 'morning', 'day', 'evening'])
const OPENING_INTENTS = Object.freeze([
  'recognize_arrival',
  'warm_welcome',
  'calm_presence',
  'ready_to_listen',
  'welcome_back',
  'gentle_reconnect',
  'practical_welcome',
  'quiet_attention',
])
const STANCE_INTENTS = Object.freeze([
  'warm_and_direct',
  'calm_and_patient',
  'concise_and_clear',
  'supportive_without_assumption',
  'context_aware',
])
const FRESH_CONTEXT_INTENTS = Object.freeze([
  'invite_issue',
  'invite_expected_result',
  'invite_confusing_step',
  'invite_priority',
  'offer_open_start',
  'offer_status_or_explanation',
])
const CONTINUE_CONTEXT_INTENTS = Object.freeze([
  'resume_open_topic',
  'ask_what_changed',
  'resume_saved_context',
  'invite_new_evidence',
  'offer_status_or_next_step',
  'acknowledge_unfinished_question',
])
const PROMPT_INTENTS = Object.freeze([
  'open_question',
  'expected_vs_actual',
  'first_useful_detail',
  'preferred_starting_point',
  'current_priority',
  'next_observable_change',
  'status_explanation_or_problem',
  'continue_or_new_topic',
])
const RHETORICAL_SHAPES = Object.freeze([
  'opening_then_prompt',
  'opening_context_prompt',
  'context_opening_prompt',
  'opening_prompt_context',
])

function str(value) {
  return String(value ?? '').trim()
}

function hashInt(value = '') {
  let valueHash = 2166136261 >>> 0
  for (const char of str(value) || 'ql7-entry-strategy') {
    valueHash ^= char.codePointAt(0)
    valueHash = Math.imul(valueHash, 16777619) >>> 0
  }
  return valueHash >>> 0
}

function strategyId(locale, mode, ordinal) {
  return `${locale}-${mode}-semantic-${String(ordinal + 1).padStart(4, '0')}`
}

function strategyAt(locale, mode, ordinal) {
  const contextIntents = mode === 'continue' ? CONTINUE_CONTEXT_INTENTS : FRESH_CONTEXT_INTENTS
  let cursor = Math.max(0, Math.trunc(Number(ordinal) || 0))
  const openingIntentId = OPENING_INTENTS[cursor % OPENING_INTENTS.length]
  cursor = Math.floor(cursor / OPENING_INTENTS.length)
  const stanceIntentId = STANCE_INTENTS[cursor % STANCE_INTENTS.length]
  cursor = Math.floor(cursor / STANCE_INTENTS.length)
  const contextIntentId = contextIntents[cursor % contextIntents.length]
  cursor = Math.floor(cursor / contextIntents.length)
  const promptIntentId = PROMPT_INTENTS[cursor % PROMPT_INTENTS.length]
  cursor = Math.floor(cursor / PROMPT_INTENTS.length)
  const rhetoricalShapeId = RHETORICAL_SHAPES[cursor % RHETORICAL_SHAPES.length]
  cursor = Math.floor(cursor / RHETORICAL_SHAPES.length)
  const daypart = DAYPARTS[cursor % DAYPARTS.length]
  return Object.freeze({
    schema: 'ql7.support.entry-greeting-strategy',
    schemaVersion: QL7_SUPPORT_ENTRY_GREETING_STRATEGY_VERSION,
    ownerId: QL7_SUPPORT_ENTRY_GREETING_STRATEGY_OWNER_ID,
    id: strategyId(locale, mode, ordinal),
    locale,
    entryMode: mode,
    daypart,
    openingIntentId,
    stanceIntentId,
    contextIntentId,
    promptIntentId,
    rhetoricalShapeId,
    activeTopicReference: mode === 'continue' ? 'when_verified_open_topic_exists' : 'none',
    openQuestionReference: mode === 'continue' ? 'when_verified_open_question_exists' : 'none',
    realizationOwnerId: 'ql7-support.human-natural-realizer',
    readyToSend: false,
  })
}

export function normalizeQl7SupportEntryLocale(value = 'en') {
  const locale = str(value).toLowerCase().split(/[-_]/u)[0]
  return QL7_SUPPORT_ALL_LOCALES.includes(locale) ? locale : 'en'
}

const ENTRY_STRATEGY_CACHE = new Map()

function strategyBankForLocale(locale = 'en') {
  const language = normalizeQl7SupportEntryLocale(locale)
  if (ENTRY_STRATEGY_CACHE.has(language)) return ENTRY_STRATEGY_CACHE.get(language)
  const rows = Object.freeze(ENTRY_MODES.flatMap((mode) => (
    Array.from({ length: 1_200 }, (_, ordinal) => strategyAt(language, mode, ordinal))
  )))
  ENTRY_STRATEGY_CACHE.set(language, rows)
  return rows
}

export function listQl7SupportEntryGreetings(locale = 'en') {
  return strategyBankForLocale(locale)
}

export function getQl7SupportEntryGreetingById({ locale = 'en', variantId = '' } = {}) {
  const wanted = str(variantId)
  if (!wanted) return null
  return strategyBankForLocale(locale).find((row) => row.id === wanted) || null
}

export function selectQl7SupportEntryGreeting({
  locale = 'en',
  seed = '',
  recentVariantIds = [],
  timeZone = 'UTC',
  now = Date.now(),
  entryMode = '',
} = {}) {
  const language = normalizeQl7SupportEntryLocale(locale)
  const temporal = selectQl7SupportGreetingDaypart({ timeZone, now })
  const mode = /continue/iu.test(str(entryMode)) ? 'continue' : 'fresh'
  const modeRows = strategyBankForLocale(language).filter((row) => row.entryMode === mode)
  const allowedDayparts = new Set(temporal.allowedDayparts || ['neutral'])
  const temporalRows = modeRows.filter((row) => row.daypart === 'neutral' || allowedDayparts.has(row.daypart))
  const bank = temporalRows.length ? temporalRows : modeRows
  const recent = new Set((Array.isArray(recentVariantIds) ? recentVariantIds : []).map(str).filter(Boolean))
  const start = hashInt(seed || `${language}:${mode}:${now}`) % bank.length
  for (let offset = 0; offset < bank.length; offset += 1) {
    const row = bank[(start + offset) % bank.length]
    if (!recent.has(row.id)) return row
  }
  return bank[start]
}

export function validateQl7SupportEntryGreetingStrategy(value = {}) {
  const failures = []
  if (value?.schema !== 'ql7.support.entry-greeting-strategy') failures.push('schema_invalid')
  if (value?.schemaVersion !== QL7_SUPPORT_ENTRY_GREETING_STRATEGY_VERSION) failures.push('schema_version_invalid')
  if (value?.ownerId !== QL7_SUPPORT_ENTRY_GREETING_STRATEGY_OWNER_ID) failures.push('owner_invalid')
  if (!QL7_SUPPORT_ALL_LOCALES.includes(value?.locale)) failures.push('locale_invalid')
  if (!ENTRY_MODES.includes(value?.entryMode)) failures.push('entry_mode_invalid')
  if (!DAYPARTS.includes(value?.daypart)) failures.push('daypart_invalid')
  if (!OPENING_INTENTS.includes(value?.openingIntentId)) failures.push('opening_intent_invalid')
  if (!STANCE_INTENTS.includes(value?.stanceIntentId)) failures.push('stance_intent_invalid')
  const contextIntents = value?.entryMode === 'continue' ? CONTINUE_CONTEXT_INTENTS : FRESH_CONTEXT_INTENTS
  if (!contextIntents.includes(value?.contextIntentId)) failures.push('context_intent_invalid')
  if (!PROMPT_INTENTS.includes(value?.promptIntentId)) failures.push('prompt_intent_invalid')
  if (!RHETORICAL_SHAPES.includes(value?.rhetoricalShapeId)) failures.push('rhetorical_shape_invalid')
  if (value?.readyToSend !== false) failures.push('ready_to_send_invalid')
  if (str(value?.text)) failures.push('final_text_forbidden')
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze([...new Set(failures)]) })
}

export function getQl7SupportEntryGreetingStrategyCoverage() {
  const perLocale = strategyBankForLocale('en').length
  return Object.freeze({
    schemaVersion: QL7_SUPPORT_ENTRY_GREETING_STRATEGY_VERSION,
    locales: Object.freeze([...QL7_SUPPORT_ALL_LOCALES]),
    localeCount: QL7_SUPPORT_ALL_LOCALES.length,
    strategiesPerLocale: perLocale,
    freshStrategiesPerLocale: perLocale / 2,
    continueStrategiesPerLocale: perLocale / 2,
    finalSentenceRows: 0,
    readyToSendRows: 0,
  })
}

export function isQl7SupportEntryGreetingMessage(message = {}) {
  const eventType = str(message?.supportEventType || message?.metadata?.supportEventType)
  const responseCode = str(message?.metadata?.responseCode)
  return eventType === 'entry_greeting' || message?.metadata?.entryGreeting === true || /^greeting(?:_|$)/iu.test(responseCode)
}

export const QL7_SUPPORT_ENTRY_GREETING_LOCALES = Object.freeze([...QL7_SUPPORT_ALL_LOCALES])

export function isQl7SupportEphemeralEntryMessage(message = {}) {
  return isQl7SupportEntryGreetingMessage(message) || message?.metadata?.ephemeralSupportPrompt === true || message?.metadata?.idleNudge === true
}
