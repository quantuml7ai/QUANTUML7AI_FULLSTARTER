import {buildQl7SupportHumorMechanismPlan} from '../knowledge/humorMechanismOntology.js'
import {getQl7SupportTopicLabel} from '../ecosystemCatalog.js'
import {validateQl7SupportEventSourceProposition} from '../eventNotificationCatalog.js'
import {
  getQl7SupportFactLabel,
} from '../language/factPresentationLexicon.js'
import {
  realizeQl7SupportCompositionalSurface,
} from '../language/compositionalGrammar.js'
import {
  QL7_SUPPORT_LOCALE_PROFILES,
} from '../language/locales/manifest.js'
import {QL7_SUPPORT_GENERAL_KNOWLEDGE_REGISTRY} from '../knowledge/generalKnowledgeRegistry.js'
import {realizeQl7SupportGeneralFacts} from './generalFactRealizer.js'
import {realizeQl7SupportProductKnowledge} from './productKnowledgeRealizer.js'
import {realizeQl7SupportPublicFigureKnowledge} from './publicFigureKnowledgeRealizer.js'
import {getQl7SupportKnowledgeAnswer} from '../knowledgeRegistry.js'
import {
  ql7Arr,
  ql7NormalizeSpaces,
  ql7SafeVisibleText,
  ql7StableHash,
  ql7Str,
} from '../internal/text.js'
import {planQl7SupportPropositions} from './propositionPlanner.js'
import {buildQl7SupportReferencePlan} from './referringExpressionPlanner.js'
import {resolveQl7SupportStyle} from './styleController.js'
import {registerQl7SupportImmutableFactFragments} from './immutableFactFragmentRegistry.js'
import {selectQl7SupportNoveltyFallbackClarification} from '../semantics/clarificationStrategyRegistry.js'
import {selectQl7SupportEntryGreetingCoordinated} from '../greetingCoordinator.js'

export const QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION = '5.4.0'
export const QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_OWNER_ID = 'ql7-support.morphosyntactic-realizer'

const BRANCH_OPERATION = Object.freeze({
  'entry.contextual-greeting': 'greeting',
  'event.verified-notification': 'verified',
  'safety.crisis': 'crisis',
  'safety.credible-threat': 'threat',
  'safety.insult-clarification': 'targetClarify',
  'safety.denial-repair': 'denialRepair',
  'safety.direct-insult-boundary': 'boundary',
  'clarification.intent-exhausted': 'abstain',
  'clarification.intent-slot': 'clarify',
  'clarification.noise-recovery': 'noise',
  'clarification.domain-ambiguity': 'clarify',
  'clarification.open-case-selection': 'clarify',
  'relationship.collect-brief': 'business',
  'relationship.collect-contact': 'contact',
  'relationship.handoff-with-contact': 'handoff',
  'relationship.handoff-dm-only': 'handoff',
  'relationship.handoff-without-contact': 'handoff',
  'dialogue.no-new-fact': 'noNewFact',
  'dialogue.wellbeing': 'wellbeing',
  'dialogue.gratitude': 'thanks',
  'dialogue.greeting': 'greeting',
  'dialogue.farewell': 'farewell',
  'dialogue.humor': 'humor',
  'dialogue.emotional-support': 'emotion',
  'dialogue.social-boundary': 'socialBoundary',
  'dialogue.topic-recall': 'topicRecall',
  'dialogue.identity': 'identity',
  'dialogue.reported-speech': 'reportedSpeech',
  'incident.security-review': 'incident',
  'incident.qcoin-discrepancy': 'incident',
  'incident.ecosystem-intake': 'incident',
  'fact.ai-quota-exhausted': 'aiQuota',
  'fact.ai-recommendation': 'verified',
  'fact.verified': 'verified',
  'fact.verified-empty': 'empty',
  'fact.unavailable': 'unavailable',
  'knowledge.planned-status': 'planned',
  'knowledge.answer': 'knowledge',
  'dialogue.general-knowledge': 'knowledge',
  'dialogue.small-talk': 'smallTalk',
})

const EVENT_FAILURE = /(?:failed|problem|inconsistency|removed|restriction|expired|exhausted|critical)/iu
const EVENT_PENDING = /(?:pending|warning|expir)/iu
const STATUS_ACTIVE = /^(?:active|enabled|valid|success|successful|completed|confirmed|linked|yes)$/iu
const STATUS_INACTIVE = /^(?:inactive|disabled|expired|cancelled|canceled|not_active|no)$/iu
const STATUS_EXHAUSTED = /^(?:exhausted|depleted|quota_exhausted|limit_reached)$/iu
const STATUS_AVAILABLE = /^(?:available|ready|eligible|open)$/iu
const STRUCTURED_EXACT_FACT_TABLE_TOPICS = new Set([
  'qcoin',
  'vip',
  'ads_packages',
  'ads_campaigns',
  'payments',
  'exchange_ai',
])

function strictProfile(locale = '') {
  const key = ql7Str(locale).toLowerCase().split(/[-_]/u)[0]
  const profile = QL7_SUPPORT_LOCALE_PROFILES[key]
  if (!profile) {
    const error = new Error(`ql7_morphology_locale_unsupported:${locale}`)
    error.code = 'ql7_morphology_locale_unsupported'
    throw error
  }
  return profile
}

function terminal(profile = {}) {
  if (profile.locale === 'zh' || profile.locale === 'ja') return '。'
  if (profile.locale === 'ar') return '.'
  return ql7Str(profile.sentenceSegmentation?.terminators?.[0]) || '.'
}

function withTerminal(value = '', profile = {}) {
  const text = ql7Str(value).replace(/[.!?。！？؟]+$/u, '')
  return text ? `${text}${terminal(profile)}` : ''
}

function formatNumber(value, profile = {}, options = {}) {
  if (value === '' || value === null || value === undefined) return ''
  const number = Number(value)
  if (!Number.isFinite(number)) return ql7Str(value).slice(0, 80)
  return new Intl.NumberFormat(profile.formatting.intlLocale, {
    maximumFractionDigits: 8,
    ...options,
  }).format(number)
}

function formatDate(value, profile = {}) {
  const timestamp = Date.parse(ql7Str(value))
  if (!Number.isFinite(timestamp)) return ''
  try {
    return new Intl.DateTimeFormat(profile.formatting.intlLocale, {
      dateStyle: profile.formatting.dateStyle || 'long',
      timeStyle: profile.formatting.timeStyle || 'short',
    }).format(new Date(timestamp))
  } catch {
    return ''
  }
}

function rtlIsolate(value = '', profile = {}) {
  const text = ql7Str(value)
  return text && profile.direction === 'rtl' ? `\u2068${text}\u2069` : text
}

function factsOf(contentPlan = {}) {
  const projected = contentPlan.factProjection?.facts || {}
  const source = projected.sourceData || {}
  const receipt = contentPlan.receipt?.result && typeof contentPlan.receipt.result === 'object'
    ? contentPlan.receipt.result
    : {}
  return Object.freeze({ ...receipt, ...source, ...projected })
}

function createCollector() {
  const frames = []
  const labels = []
  const immutable = []
  const sources = []
  return {
    frames,
    labels,
    immutable,
    sources,
    frame(locale, key, variables, seed) {
      const realized = realizeQl7SupportCompositionalSurface(locale, key, variables, seed)
      frames.push(Object.freeze({
        operationKey: key,
        entryId: realized.entryId,
        contentHash: realized.contentHash,
        receiptId: realized.receipt?.receiptId || '',
      }))
      return realized.text
    },
    label(locale, key) {
      const entry = getQl7SupportFactLabel(locale, key)
      labels.push(Object.freeze({ key, entryId: entry.entryId, contentHash: entry.contentHash }))
      return entry.value
    },
    fact(fragmentId, text, sourceId = '') {
      const value = ql7NormalizeSpaces(text)
      if (!value) return ''
      immutable.push(Object.freeze({ fragmentId: ql7Str(fragmentId), text: value, sourceId: ql7Str(sourceId) }))
      return value
    },
    source(fragmentId, text, sourceReceiptIds = []) {
      const value = ql7NormalizeSpaces(text)
      if (!value) return ''
      sources.push(Object.freeze({
        fragmentId: ql7Str(fragmentId),
        text: value,
        sourceReceiptIds: Object.freeze(ql7Arr(sourceReceiptIds).map((item) => ql7Str(item?.receiptId || item?.id || item)).filter(Boolean)),
      }))
      return value
    },
  }
}


function localizedStatus(value, locale, collector) {
  const source = ql7Str(value).toLowerCase()
  if (STATUS_ACTIVE.test(source)) return collector.label(locale, 'active')
  if (STATUS_INACTIVE.test(source)) return collector.label(locale, 'inactive')
  if (STATUS_EXHAUSTED.test(source)) return collector.label(locale, 'exhausted')
  if (STATUS_AVAILABLE.test(source)) return collector.label(locale, 'available')
  return ''
}

export function resolveQl7SupportExactFactVisibilityOwner(contentPlan = {}) {
  const topic = ql7Str(contentPlan.topic)
  const receiptKind = ql7Str(contentPlan.receipt?.resultKind)
  const structuredTableOwnerPresent = contentPlan.surfaceKind === 'structured'
    && STRUCTURED_EXACT_FACT_TABLE_TOPICS.has(topic)
    && ['verified', 'verified_empty', 'inconsistent'].includes(receiptKind)
  const verifiedProjectionPresent = contentPlan.factProjection?.verified === true
    || ql7Str(contentPlan.resultKind) === 'verified'
    || receiptKind === 'verified'
  const mode = structuredTableOwnerPresent
    ? 'structured_table'
    : verifiedProjectionPresent
      ? 'prose_immutable_fragment'
      : 'none'
  return Object.freeze({
    schema: 'ql7.support.exact-fact-visibility-owner',
    schemaVersion: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
    topic,
    mode,
    structuredTableOwnerPresent,
    exactProseSuppressed: structuredTableOwnerPresent,
    verifiedProjectionPresent,
  })
}

function compactFactSentence({ contentPlan, locale, profile, collector }) {
  const data = factsOf(contentPlan)
  const topic = ql7Str(contentPlan.topic)
  const sourceId = ql7Str(contentPlan.factProjection?.receiptId || contentPlan.receipt?.id)
  const factId = ql7Str(contentPlan.factProjection?.factHash || sourceId || `${topic}:verified`)
  let value = ''

  if (topic === 'qcoin') {
    const balance = data.balance ?? data.available ?? data.amount
    if (balance !== undefined && balance !== null && balance !== '') {
      value = `${collector.label(locale, 'balance')}: ${rtlIsolate(formatNumber(balance, profile), profile)} QCoin`
    }
  } else if (topic === 'vip') {
    const status = localizedStatus(data.status || (data.active === true ? 'active' : data.active === false ? 'inactive' : ''), locale, collector)
    const parts = [status ? `${collector.label(locale, 'status')}: ${status}` : '']
    if (data.tier || data.plan) parts.push(`${collector.label(locale, 'tier')}: ${rtlIsolate(data.tier || data.plan, profile)}`)
    const expiry = formatDate(data.expiresAt || data.expiry, profile)
    if (expiry) parts.push(`${collector.label(locale, 'expires')}: ${rtlIsolate(expiry, profile)}`)
    value = parts.filter(Boolean).join(' · ')
  } else if (topic === 'ads_packages') {
    const parts = []
    if (data.packageName || data.package || data.tier) parts.push(rtlIsolate(data.packageName || data.package || data.tier, profile))
    const count = data.activeCampaignCount ?? data.activeCampaigns
    if (count !== undefined && count !== null && count !== '') {
      parts.push(`${collector.label(locale, 'campaigns')}: ${formatNumber(count, profile, { maximumFractionDigits: 0 })}`)
    }
    value = parts.join(' · ')
  } else if (topic === 'ads_campaigns') {
    const rows = Array.isArray(data.campaigns) ? data.campaigns : []
    const count = rows.length || data.activeCampaignCount || data.activeCampaigns
    if (count !== undefined && count !== null && count !== '') {
      value = `${collector.label(locale, 'campaigns')}: ${formatNumber(count, profile, { maximumFractionDigits: 0 })}`
    }
  } else if (topic === 'payments') {
    const parts = []
    const status = localizedStatus(data.status || data.paymentStatus || data.state, locale, collector)
    if (status) parts.push(`${collector.label(locale, 'status')}: ${status}`)
    if (data.amount !== undefined && data.amount !== null && data.amount !== '') {
      parts.push(`${collector.label(locale, 'amount')}: ${formatNumber(data.amount, profile)} ${rtlIsolate(data.currency, profile)}`.trim())
    }
    value = parts.join(' · ')
  }

  return value ? collector.fact(factId, withTerminal(value, profile), sourceId) : ''
}

function clarificationDomain(contentPlan = {}) {
  return ql7Str(
    contentPlan.clarificationDomain ||
    ql7Str(contentPlan.waitingFor).replace(/^clarification:/u, '') ||
    contentPlan.intentConfirmation?.slotValues?.domainId ||
    contentPlan.topic ||
    'support_system',
  )
}

function topicLabel(contentPlan = {}, locale = '', domainId = '') {
  const topic = ql7Str(domainId || contentPlan.topic || 'support_system')
  return ql7Str(getQl7SupportTopicLabel(topic, locale) || topic || 'Support')
}



const NOVELTY_FALLBACK_FOCUS_LABEL = Object.freeze({
  intent: 'usage', domain: 'details', entity: 'asset', time: 'timeframe',
  status: 'currentStatus', action: 'operation', result: 'problem', source: 'source',
})
const NOVELTY_FALLBACK_SECONDARY_LABEL = Object.freeze({
  top2: 'currentStatus', top3: 'details', material_vs_social: 'problem', read_vs_explain: 'usage',
})
function noveltyFallbackVariables({ contentPlan = {}, locale = '', discoursePlan = {}, seed = '', collector } = {}) {
  const selection = selectQl7SupportNoveltyFallbackClarification({
    seed: `${seed}:${discoursePlan.planHash}:${discoursePlan.attempt}:${contentPlan.topic || 'support_system'}`,
  })
  const supportGeneric = ql7Str(contentPlan.topic)==='support_system'
  const primaryKey = supportGeneric ? (selection.focus==='source'?'source':'problem') : (NOVELTY_FALLBACK_FOCUS_LABEL[selection.focus] || 'details')
  const secondaryKey = supportGeneric ? 'details' : (NOVELTY_FALLBACK_SECONDARY_LABEL[selection.contrast] || 'currentStatus')
  const toneKey = supportGeneric ? 'details' : (({ neutral: 'details', concise: 'currentStatus', supportive: 'problem', technical: 'source' })[selection.tone] || 'details')
  const formKey = supportGeneric ? 'usage' : (({ binary: 'usage', single_slot: 'operation', contrastive: 'timeframe', example_anchored: 'asset' })[selection.form] || 'usage')
  const details = [primaryKey, toneKey].filter((value, index, rows) => rows.indexOf(value) === index)
    .map((key) => collector.label(locale, key)).join(' ')
  const secondaryDetails = [secondaryKey, formKey].filter((value, index, rows) => rows.indexOf(value) === index)
    .map((key) => collector.label(locale, key)).join(' ')
  return Object.freeze({
    topic: supportGeneric ? '' : topicLabel(contentPlan, locale),
    detail: details,
    secondaryDetail: secondaryDetails,
    variant: selection.index,
    focus: selection.focus,
    contrast: selection.contrast,
    tone: selection.tone,
    form: selection.form,
    selectionReceipt: selection,
  })
}
function clarificationDetail(contentPlan, locale, collector) {
  const domainId = clarificationDomain(contentPlan)
  const slot = ql7Str(contentPlan.confirmationSlot || contentPlan.intentConfirmation?.missingSlots?.[0])
  if (slot === 'assetId') return collector.label(locale, 'asset')
  if (slot === 'timeframe') return collector.label(locale, 'timeframe')
  if (contentPlan.openCaseSelection) return collector.label(locale, 'case')
  if (domainId === 'qcoin') {
    return [collector.label(locale, 'balance'), collector.label(locale, 'usage'), collector.label(locale, 'problem')].join(' / ')
  }
  if (['ads_campaigns', 'ads_packages'].includes(domainId)) {
    return [collector.label(locale, 'campaigns'), collector.label(locale, 'currentStatus'), collector.label(locale, 'problem')].join(' / ')
  }
  if (domainId === 'exchange_ai' || domainId === 'exchange') {
    return [collector.label(locale, 'price'), collector.label(locale, 'usage'), collector.label(locale, 'operation')].join(' / ')
  }
  if (domainId === 'support_system') return [collector.label(locale, 'problem'), collector.label(locale, 'details')].join(' / ')
  return [collector.label(locale, 'usage'), collector.label(locale, 'currentStatus'), collector.label(locale, 'problem')].join(' / ')
}

function knowledgeReceipt(answer = {}) {
  const body = {
    schema: 'ql7.support.knowledge-realization-receipt',
    schemaVersion: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
    graphVersion: ql7Str(answer.knowledgeGraphVersion),
    graphHash: ql7Str(answer.knowledgeGraphHash),
    domainNodeId: ql7Str(answer.knowledgeDomainNodeId),
    nodeId: ql7Str(answer.knowledgeNodeId || answer.nodeId),
    nodeHash: ql7Str(answer.knowledgeNode?.nodeHash || answer.nodeHash),
    intentId: ql7Str(answer.knowledgeIntentId),
    availability: ql7Str(answer.availability),
    answerSource: ql7Str(answer.source || 'general-knowledge-registry'),
    evidenceHashes: Object.freeze(ql7Arr(answer.sourceReceipts).map((row) => ql7Str(row?.evidenceHash || row?.factHash)).filter(Boolean)),
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptHash })
}


function publicFigureFactSentence(contentPlan={},collector,profile={}){
  const projection=contentPlan.publicFigureFactProjection||null
  const selected=contentPlan.generalTopic?.publicFigure?.selected||null
  const facts=ql7Arr(projection?.facts)
  if(!selected||!facts.length)return''
  const localized=realizeQl7SupportPublicFigureKnowledge({selected,projection,locale:profile.locale||'en'})
  if(localized.supported){
    return localized.fragments.map((fragment)=>collector.source(fragment.factId,fragment.text,[fragment.sourceReceiptId])).filter(Boolean).join(' ')
  }
  // Unsupported locale: keep source facts internal for native generation instead of
  // emitting a foreign-language raw fact into the user's selected locale.
  return ''
}

function realizeKnowledge({ contentPlan, locale, seed, collector, profile = strictProfile(locale) }) {
  // Academy Q/A is source-backed knowledge, never a parallel responder. Source text may
  // be displayed only when its sourceLocale is exactly the selected response locale.
  const academy = contentPlan.academyKnowledgeReceipt || null
  if (academy?.resultKind === 'verified' && academy?.result?.qaKey) {
    const result = academy.result
    const topic = result.sourceLocale === profile.locale ? ql7Str(result.question || result.family || 'Academy') : topicLabel({ topic: 'academy' }, locale, 'academy')
    const answer = Object.freeze({
      source: 'academy.i18n.qa', sourceReceipts: Object.freeze([{ evidenceHash: academy.receiptHash, factHash: academy.sourceSnapshotHash }]),
      knowledgeNodeId: result.qaKey, knowledgeDomainNodeId: 'academy', knowledgeIntentId: ql7Str(contentPlan.messageAct), availability: 'available',
    })
    if (result.readyToSend === true && result.sourceLocale === profile.locale) {
      const text = collector.source(`academy:${result.qaKey}`, ql7SafeVisibleText(result.answer, profile.locale, 3800), [academy.sourceReceiptId])
      if (text) return { text, receipt: knowledgeReceipt(answer) }
    }
    // For the other native locales the source answer remains evidence for the QL7 model.
    // Deterministic fallback must never leak the source language into the target locale.
    return { text: collector.frame(locale, 'knowledge', { topic }, `${seed}:academy-native-realization-required`), receipt: knowledgeReceipt(answer) }
  }
  // Knowledge owners provide semantic scope, availability and source receipts only.
  // They are deliberately forbidden from injecting ready-made prose into the final response.
  if (contentPlan.generalTopic?.nodeId && contentPlan.messageAct === 'general_knowledge_question') {
    const nodeId = ql7Str(contentPlan.generalTopic.nodeId)
    const node = QL7_SUPPORT_GENERAL_KNOWLEDGE_REGISTRY[nodeId] || null
    const route = contentPlan.openHumanRoute || null
    const figureResolution = contentPlan.publicFigureSourceResolution || null
    const selectedFigure=contentPlan.generalTopic?.publicFigure?.selected||null
    const topic = ql7Str(selectedFigure?.canonicalName || contentPlan.generalTopic.subjectText || contentPlan.generalTopic.category || node?.category || nodeId || contentPlan.topic)
    const publicFigureClaimBlocked = Boolean(contentPlan.generalTopic?.publicFigure) && figureResolution?.answerClaimAllowed === false
    const publicFigureFactsMissing = Boolean(selectedFigure) && ql7Arr(contentPlan.publicFigureFactProjection?.facts).length === 0
    const missingCurrentSource = route?.abstainOnMissingCurrentSource === true || publicFigureClaimBlocked
    const missingOpenSource = route?.openSubject === true && route?.sourceVerified !== true
    const sourceBlocked = missingCurrentSource || missingOpenSource || publicFigureFactsMissing
    const availability = sourceBlocked ? 'unavailable' : node ? 'available' : route?.sourceVerified ? 'available' : 'unknown'
    const answer = Object.freeze({
      nodeId,
      nodeHash: ql7Str(node?.nodeHash || contentPlan.generalTopic.nodeHash),
      source: sourceBlocked ? 'source-required-not-verified' : 'general-knowledge-semantic-registry',
      sourceReceipts: Object.freeze(node?.sourceReceipt ? [node.sourceReceipt] : []),
      knowledgeNodeId: nodeId,
      knowledgeDomainNodeId: '',
      knowledgeIntentId: ql7Str(contentPlan.messageAct),
      availability,
    })
    if (sourceBlocked) {
      return {
        text: collector.frame(locale, 'unavailable', { topic }, `${seed}:general-source-unavailable`),
        receipt: knowledgeReceipt(answer),
      }
    }
    const publicFigureFactText = publicFigureFactSentence(contentPlan,collector,profile)
    const factRealization = node ? realizeQl7SupportGeneralFacts({ locale, topicLabel: topic, semanticFacts: node.semanticFacts, seed }) : null
    for (const fragment of ql7Arr(factRealization?.fragments)) collector.fact(fragment.factId, fragment.text, fragment.sourceReceiptId)
    const stableFigureName=contentPlan.generalTopic?.publicFigure?.selected?.canonicalName||''
    const semanticLead=collector.frame(locale,'knowledge',{topic:stableFigureName||topic},`${seed}:general-semantic`)
    const figureSourceReceipt=contentPlan.publicFigureFactSourceReceipt||null
    return {
      text: publicFigureFactText || factRealization?.text || semanticLead,
      receipt: knowledgeReceipt({ ...answer, sourceReceipts: figureSourceReceipt?[figureSourceReceipt]:(factRealization?.sourceReceipts || answer.sourceReceipts) }),
    }
  }
  const answer = getQl7SupportKnowledgeAnswer({
    topic: contentPlan.topic,
    intent: contentPlan.messageAct,
    locale,
    seed,
    attempt: contentPlan.realizationAttempt || 0,
  })
  if (!answer) return { text: '', receipt: null }
  const productRealization = realizeQl7SupportProductKnowledge({
    answer,
    locale,
    intent: answer.knowledgeIntentId || contentPlan.messageAct,
    seed,
  })
  if (productRealization.supported) {
    const fragments = productRealization.fragments.map((fragment) => collector.fact(
      fragment.factId,
      fragment.text,
      fragment.sourceReceiptId,
    )).filter(Boolean)
    return {
      text: fragments.join(' '),
      receipt: knowledgeReceipt(answer),
    }
  }
  const topic = ql7Str(answer.label || answer.canonicalDomain?.label || contentPlan.topic)
  const operation = answer.availability === 'planned'
    ? 'planned'
    : (contentPlan.messageAct === 'how_to_question' || contentPlan.messageAct === 'how_to')
      ? 'howTo'
      : 'knowledge'
  return {
    text: collector.frame(locale, operation, { topic }, `${seed}:product-semantic`),
    receipt: knowledgeReceipt(answer),
  }
}

function eventOperation(contentPlan = {}) {
  const type = ql7Str(contentPlan.eventEnvelope?.type)
  if (type === 'welcome') return 'greeting'
  if (type === 'idle_nudge') return 'smallTalk'
  if (EVENT_FAILURE.test(type)) return 'unavailable'
  if (EVENT_PENDING.test(type)) return 'knowledge'
  return 'verified'
}

function eventSource(contentPlan = {}, locale = '', collector) {
  const envelope = contentPlan.eventEnvelope || {}
  const payload = envelope.payload && typeof envelope.payload === 'object' ? envelope.payload : {}
  const proposition = payload.announcement || payload.securityNotice
  if (!proposition) return ''
  const validation = validateQl7SupportEventSourceProposition(proposition, { eventType: envelope.type })
  if (!validation.ok || proposition.sourceLocale !== locale) {
    const error = new Error('event_source_proposition_invalid')
    error.code = 'event_source_proposition_invalid'
    error.failures = validation.failures
    throw error
  }
  return collector.source(proposition.propositionId, proposition.sourceText, [envelope.sourceReceipt])
}

function eventFact(contentPlan = {}, profile = {}, collector) {
  const envelope = contentPlan.eventEnvelope || {}
  const payload = envelope.payload && typeof envelope.payload === 'object' ? envelope.payload : {}
  const parts = [
    payload.amount,
    payload.currency,
    payload.package,
    payload.campaign,
    payload.item,
    payload.status,
    payload.daysRemaining !== undefined ? `T-${payload.daysRemaining}` : '',
  ].map((value) => ql7Str(value).slice(0, 80)).filter(Boolean)
  if (!parts.length) return ''
  return collector.fact(
    envelope.sourceReceipt?.factHash || envelope.sourceReceipt?.receiptId || envelope.eventId,
    withTerminal(parts.map((item) => rtlIsolate(item, profile)).join(' · '), profile),
    envelope.sourceReceipt?.receiptId,
  )
}

function composeBranch({ discoursePlan, contentPlan, semanticPlan, scopeReceipt, locale, seed, profile, collector }) {
  const branchId = ql7Str(discoursePlan.branchId)
  const selectedOperation = BRANCH_OPERATION[branchId]
  if (!selectedOperation) {
    const error = new Error(`ql7_morphology_branch_unsupported:${branchId}`)
    error.code = 'ql7_morphology_branch_unsupported'
    throw error
  }
  const label = topicLabel(contentPlan, locale)
  const operationSeed = `${seed}:${discoursePlan.rhetoricalSkeletonId}:${discoursePlan.attempt}`
  let text = ''
  let receipt = null
  let noveltyFallbackReceipt = null
  let eventPresentation = null
  let entryGreetingReceipt = null

  if ((discoursePlan.regenerationStrategyId === 'scope-safe-clarification' || ql7Arr(contentPlan.factProjection?.issues).length > 0) && !branchId.startsWith('safety.')) {
    const fallback = noveltyFallbackVariables({ contentPlan, locale, discoursePlan, seed: operationSeed, collector })
    text = collector.frame(locale, 'noveltyFallback', fallback, `${operationSeed}:novelty-fallback:${fallback.selectionReceipt.receiptHash}`)
    const fallbackReceiptBody = {
      schema: 'ql7.support.novelty-delivery-availability-fallback-receipt',
      schemaVersion: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
      strategyId: fallback.selectionReceipt.selectedStrategyId,
      strategyReceiptHash: fallback.selectionReceipt.receiptHash,
      focus: fallback.focus,
      contrast: fallback.contrast,
      tone: fallback.tone,
      form: fallback.form,
      safeClarification: true,
      finalTextStored: false,
    }
    const fallbackReceiptHash = ql7StableHash(JSON.stringify(fallbackReceiptBody))
    noveltyFallbackReceipt = Object.freeze({
      ...fallbackReceiptBody,
      receiptId: `novelty-fallback:${fallbackReceiptHash}`,
      receiptHash: fallbackReceiptHash,
    })
  } else if (branchId === 'entry.contextual-greeting') {
    const event = contentPlan.entryEvent || {}
    const activeTopicId = ql7Str(event.activeTopic)
    const activeTopicLabel = activeTopicId ? getQl7SupportTopicLabel(activeTopicId, locale) : ''
    const strategy = selectQl7SupportEntryGreetingCoordinated({
      userId: ql7Str(event.actorSeed || scopeReceipt.actorIdHash),
      locale,
      entryNonce: ql7Str(event.entrySessionId || event.entryNonce || event.greetingReservationId),
      entryMode: ql7Str(event.entryMode),
      recentFingerprints: ql7Arr(event.recentFingerprints),
      recentVariantIds: ql7Arr(event.recentVariantIds),
      timeZone: ql7Str(event.timeZone) || 'UTC',
      now: Number(event.now) || Date.parse(ql7Str(event.createdAt)) || Date.now(),
    })
    const ordinal = Math.max(0, Number.parseInt(ql7Str(strategy.id).match(/semantic-(\d+)$/u)?.[1] || '1', 10) - 1)
    text = collector.frame(locale, 'entryGreeting', {
      variant: ordinal,
      entryMode: strategy.entryMode,
      topic: strategy.entryMode === 'continue' ? activeTopicLabel : '',
      openingIntentId: strategy.openingIntentId,
      stanceIntentId: strategy.stanceIntentId,
      contextIntentId: strategy.contextIntentId,
      promptIntentId: strategy.promptIntentId,
      rhetoricalShapeId: strategy.rhetoricalShapeId,
    }, `${operationSeed}:entry:${strategy.id}`)
    entryGreetingReceipt = Object.freeze({
      schema: 'ql7.support.entry-greeting-realization-receipt',
      schemaVersion: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
      strategyId: strategy.id,
      strategyFingerprint: strategy.fingerprint,
      entryMode: strategy.entryMode,
      activeTopicId,
      activeTopicRemembered: Boolean(activeTopicId && activeTopicLabel),
      hasOpenQuestion: Boolean(ql7Str(event.openQuestion)),
      finalTextStored: false,
    })
  } else if (branchId === 'event.verified-notification') {
    const key = eventOperation(contentPlan)
    const variables = ['knowledge', 'unavailable', 'verified'].includes(key) ? { topic: label } : {}
    const lead = collector.frame(locale, key, variables, `${operationSeed}:event`)
    const source = eventSource(contentPlan, locale, collector)
    const fact = eventFact(contentPlan, profile, collector)
    text = [lead, source, fact].filter(Boolean).join(' ')
    eventPresentation = Object.freeze({
      snapshot: contentPlan.eventEnvelope?.surfaceFacts?.snapshot || null,
      sourceReceiptId: contentPlan.eventEnvelope?.sourceReceipt?.receiptId || '',
      occurredAtServerUtc: contentPlan.eventEnvelope?.occurredAtServerUtc || '',
    })
  } else if (branchId === 'fact.ai-recommendation') {
    // Exact market facts are rendered once in the structured table. Prose confirms
    // the source-bound result and mandatory educational boundary without duplicating
    // table label/value pairs that the final surface-redundancy guard rejects.
    const verified = collector.frame(locale, 'verified', { topic: label }, `${operationSeed}:verified`)
    const disclaimer = collector.frame(locale, 'aiDisclaimer', {}, `${operationSeed}:disclaimer`)
    const shapes = {
      'direct-evidence-next': [verified, disclaimer],
      'answer-source-boundary': [verified, disclaimer],
      'fact-interpretation-action': [disclaimer, verified],
      'observation-meaning-next': [verified, disclaimer],
    }
    text = (shapes[discoursePlan.rhetoricalSkeletonId] || shapes['direct-evidence-next']).filter(Boolean).join(' ')
  } else if (branchId === 'fact.verified') {
    // Exact fact ownership is contextual: when a verified structured table is actually
    // present, prose must not duplicate its exact row. When morphology is used without
    // a table-owning receipt, the verified immutable fact remains visible in prose.
    const ownership = resolveQl7SupportExactFactVisibilityOwner(contentPlan)
    const fact = ownership.exactProseSuppressed
      ? ''
      : compactFactSentence({ contentPlan, locale, profile, collector })
    const verified = collector.frame(locale, 'verified', { topic: label }, `${operationSeed}:verified`)
    text = [fact, verified].filter(Boolean).join(' ')
  } else if (branchId === 'fact.verified-empty') {
    text = collector.frame(locale, 'empty', { topic: label }, operationSeed)
  } else if (branchId === 'knowledge.answer' || branchId === 'dialogue.general-knowledge' || branchId === 'knowledge.planned-status') {
    const knowledge = realizeKnowledge({ contentPlan, locale, seed: operationSeed, collector, profile })
    receipt = knowledge.receipt
    if (knowledge.text) text = knowledge.text
    else {
      const key = branchId === 'knowledge.planned-status'
        ? 'planned'
        : contentPlan.messageAct === 'how_to_question' ? 'howTo' : selectedOperation
      text = collector.frame(locale, key, { topic: label }, operationSeed)
    }
  } else if (selectedOperation === 'topicRecall') {
    const recalledDomainId = ql7Arr(scopeReceipt?.allowedDomainIds)
      .find((domainId) => domainId && domainId !== 'support_system') || contentPlan.topic
    text = collector.frame(locale, 'topicRecall', {
      topic: topicLabel(contentPlan, locale, recalledDomainId),
    }, operationSeed)
  } else if (selectedOperation === 'clarify') {
    const domainId = clarificationDomain(contentPlan)
    text = collector.frame(locale, 'clarify', {
      topic: domainId === 'support_system' ? '' : topicLabel(contentPlan, locale, domainId),
      detail: clarificationDetail(contentPlan, locale, collector),
    }, operationSeed)
  } else if (selectedOperation === 'humor') {
    if (contentPlan.humorSafety?.allowed === false) {
      text = collector.frame(locale, 'smallTalk', { topic: label }, `${operationSeed}:humor-suppressed`)
    } else {
      const plan = contentPlan.humorMechanismPlan || buildQl7SupportHumorMechanismPlan({
        locale,
        topic: label || 'general',
        index: Number.parseInt(ql7StableHash(`${operationSeed}:humor`).slice(0, 8), 16) % 46_080,
        seed: `${operationSeed}:humor`,
      })
      text = collector.frame(locale, 'humor', {
        topic: label,
        mechanismId: plan.mechanismId,
        setupConceptId: plan.setupConceptId,
        pivotConceptId: plan.pivotConceptId,
        closureConceptId: plan.closureConceptId,
      }, `${operationSeed}:humor`)
    }
  } else {
    const variables = ['unavailable', 'verified', 'empty', 'planned', 'knowledge', 'howTo', 'boundary'].includes(selectedOperation)
      ? { topic: label }
      : selectedOperation === 'noNewFact'
        ? { variant: discoursePlan.attempt }
        : {}
    text = collector.frame(locale, selectedOperation, variables, operationSeed)
    if (branchId.startsWith('incident.')) text = `${rtlIsolate(label, profile)}: ${text}`
    if (branchId.startsWith('relationship.') && contentPlan.topic && contentPlan.topic !== 'support_system') {
      text = `${rtlIsolate(label, profile)}: ${text}`
    }
  }

  if (contentPlan.resultKind === 'verified' && !text && semanticPlan.requiredFacts?.length) {
    text = collector.frame(locale, 'verified', { topic: label }, `${operationSeed}:required-fact`)
  }
  return { text, knowledgeReceipt: receipt, noveltyFallbackReceipt, eventPresentation, entryGreetingReceipt }
}

function titleFor({ contentPlan = {}, discoursePlan = {}, locale = '', suppressTitle = false } = {}) {
  if (suppressTitle) return ''
  if (discoursePlan.branchId === 'fact.ai-recommendation' || discoursePlan.branchId === 'fact.ai-quota-exhausted') {
    return topicLabel(contentPlan, locale, 'exchange_ai')
  }
  if (contentPlan.messageAct === 'entry_greeting' || contentPlan.messageAct === 'event_notification') return ''
  if (contentPlan.surfaceKind !== 'structured') return ''
  return topicLabel(contentPlan, locale)
}

export function realizeQl7SupportMorphosyntax({
  discoursePlan = {},
  semanticPlan = {},
  contentPlan = {},
  scopeReceipt = {},
  locale = 'en',
  seed = '',
  attempt = 0,
  suppressTitle = false,
  memoryGraph = {},
  preferences = {},
  analysis = {},
} = {}) {
  const profile = strictProfile(locale)
  const propositionPlan = planQl7SupportPropositions({ semanticPlan, contentPlan, scopeReceipt })
  const referencePlan = buildQl7SupportReferencePlan({ scopeReceipt, memoryGraph, locale })
  const stylePlan = resolveQl7SupportStyle({ preferences, analysis, contentPlan })
  if (discoursePlan.locale && discoursePlan.locale !== profile.locale) {
    const error = new Error(`ql7_morphology_plan_locale_mismatch:${discoursePlan.locale}:${profile.locale}`)
    error.code = 'ql7_morphology_plan_locale_mismatch'
    throw error
  }
  const collector = createCollector()
  const composed = composeBranch({
    discoursePlan,
    semanticPlan,
    scopeReceipt,
    contentPlan: { ...contentPlan, realizationAttempt: attempt },
    locale: profile.locale,
    seed: seed || discoursePlan.planHash || semanticPlan.planHash,
    profile,
    collector,
  })
  const max = Math.max(1, Math.min(4_000, Number(semanticPlan.responseBudget?.max) || 4_000))
  const text = ql7SafeVisibleText(ql7NormalizeSpaces(composed.text), profile.locale, max)
  if (!text) {
    const error = new Error(`ql7_morphology_empty_realization:${discoursePlan.branchId}`)
    error.code = 'ql7_morphology_empty_realization'
    throw error
  }
  const title = titleFor({ contentPlan, discoursePlan, locale: profile.locale, suppressTitle })
  const immutableFactFragments = registerQl7SupportImmutableFactFragments(collector.immutable.filter((row) => text.includes(row.text)))
  const sourcedFragments = Object.freeze(collector.sources.filter((row) => text.includes(row.text)))
  const receiptBody = {
    schema: 'ql7.support.morphology-realization-receipt',
    schemaVersion: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
    ownerId: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_OWNER_ID,
    propositionPlan,
    referencePlan,
    stylePlan,
    locale: profile.locale,
    localeProfileVersion: profile.schemaVersion,
    localeReviewStatus: profile.review.status,
    discoursePlanId: discoursePlan.planId,
    discoursePlanHash: discoursePlan.planHash,
    semanticPlanId: semanticPlan.planId,
    semanticPlanHash: semanticPlan.planHash,
    scopeReceiptId: scopeReceipt.receiptId,
    branchId: discoursePlan.branchId,
    rhetoricalSkeletonId: discoursePlan.rhetoricalSkeletonId,
    frameReceipts: Object.freeze(collector.frames),
    lexicalReceipts: Object.freeze(collector.labels),
    immutableFragmentIds: Object.freeze(immutableFactFragments.map((row) => row.fragmentId)),
    sourcedFragmentIds: Object.freeze(sourcedFragments.map((row) => row.fragmentId)),
    entryGreetingReceipt: composed.entryGreetingReceipt,
    exactFactOwnership: resolveQl7SupportExactFactVisibilityOwner(contentPlan),
    morphologyChecks: Object.freeze({
      numberFormatLocale: profile.formatting.intlLocale,
      dateStyle: profile.formatting.dateStyle,
      direction: profile.direction,
      protectedSpanKinds: profile.protectedSpans.kinds,
      unresolvedSlots: 0,
      rawIsoDateLeak: /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/u.test(text),
    }),
    attempt,
    textHash: ql7StableHash(text),
  }
  const receiptHash = ql7StableHash(JSON.stringify(receiptBody))
  const realizationReceipt = Object.freeze({ ...receiptBody, receiptId: `morphology:${receiptHash}`, receiptHash })
  return Object.freeze({
    schema: 'ql7.support.morphology-realization',
    schemaVersion: QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION,
    locale: profile.locale,
    text,
    title,
    summary: '',
    propositions: Object.freeze(ql7Arr(semanticPlan.requiredPropositions)),
    immutableFactFragments,
    sourcedFragments,
    knowledgeReceipt: composed.knowledgeReceipt,
    noveltyFallbackReceipt: composed.noveltyFallbackReceipt,
    eventPresentation: composed.eventPresentation,
    entryGreetingReceipt: composed.entryGreetingReceipt,
    realizationReceipt,
    variationId: `${discoursePlan.branchId}:${discoursePlan.rhetoricalSkeletonId}:${composed.entryGreetingReceipt?.strategyId || collector.frames.map((row) => row.entryId).join('+')}`,
    migrationSource: 'discourse-plan-morphology',
    responseHash: ql7StableHash(text.toLowerCase()),
    realizationId: `realization:${ql7StableHash(`${discoursePlan.planHash}:${text}`)}`,
  })
}
