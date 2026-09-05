import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {resolveQl7SupportResponseBranch} from './responseBranchRegistry.js'
import {selectQl7SupportDiscourseStrategy} from './discourseStrategyRegistry.js'

export const QL7_SUPPORT_DISCOURSE_PLANNER_VERSION = '5.2.0'

const RHETORICAL_SKELETONS = Object.freeze([
  'direct-evidence-next',
  'direct-reason-question',
  'acknowledge-direct-question',
  'direct-boundary-alternative',
  'context-direct-next',
  'direct-example-question',
  'direct-contrast-next',
  'direct-condition-action',
  'answer-source-boundary',
  'answer-detail-choice',
  'observation-meaning-next',
  'fact-interpretation-action',
])

function unit(id, type, value, {
  required = true,
  immutable = false,
  sourceId = '',
  privacyClass = 'public-semantic',
} = {}) {
  return Object.freeze({
    id: ql7Str(id),
    type: ql7Str(type),
    value,
    required,
    immutable,
    sourceId: ql7Str(sourceId),
    privacyClass,
  })
}

function semanticUnits({ semanticPlan = {}, contentPlan = {}, scopeReceipt = {} } = {}) {
  const facts = contentPlan.factProjection?.facts || {}
  const units = [
    unit('scope.domain', 'domain', scopeReceipt.primaryDomainId || contentPlan.topic || 'support_system'),
    unit('scope.microtopic', 'microtopic', scopeReceipt.primaryMicrotopicId || contentPlan.primaryMicrotopicId || '', { required: false }),
    unit('scope.intent', 'intent', scopeReceipt.selectedIntentId || contentPlan.messageAct || '', { required: false }),
    unit('result.kind', 'result-kind', contentPlan.resultKind || 'none'),
    unit('dialogue.waiting-for', 'waiting-for', contentPlan.waitingFor || '', { required: false }),
    unit('confirmation.slot', 'missing-slot', contentPlan.confirmationSlot || contentPlan.intentConfirmation?.missingSlots?.[0] || '', { required: false }),
    unit('relationship.stage', 'relationship-stage', contentPlan.relationshipIntent?.stage || '', { required: false }),
    unit('fact.status', 'status', facts.status || contentPlan.factProjection?.status || '', { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId }),
    unit('fact.balance', 'balance', facts.balance, { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId, privacyClass: 'actor-scoped' }),
    unit('fact.tier', 'tier', facts.tier || facts.packageName || '', { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId, privacyClass: 'actor-scoped' }),
    unit('fact.expires-at', 'expires-at', facts.expiresAt || '', { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId, privacyClass: 'actor-scoped' }),
    unit('fact.active-campaigns', 'active-campaign-count', facts.activeCampaignCount, { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId, privacyClass: 'actor-scoped' }),
    unit('market.asset', 'market-asset', facts.sourceData?.symbol || contentPlan.marketSignals?.symbol || '', { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId }),
    unit('market.timeframe', 'market-timeframe', facts.sourceData?.timeframe || contentPlan.marketSignals?.timeframe || '', { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId }),
    unit('market.action', 'market-action', facts.sourceData?.action || facts.sourceData?.recommendation || facts.sourceData?.signal || '', { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId }),
    unit('market.confidence', 'market-confidence', facts.sourceData?.confidence, { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId }),
    unit('source.checked-at', 'checked-at', contentPlan.factProjection?.checkedAt || contentPlan.receipt?.checkedAt || '', { required: false, immutable: Boolean(contentPlan.factProjection?.verified), sourceId: contentPlan.factProjection?.receiptId }),
    unit('anchor.input-meaning', 'input-meaning-hash', semanticPlan.userSpecificAnchor?.inputMeaningHash || '', { required: false }),
    unit('anchor.topic-frame', 'topic-frame-id', semanticPlan.userSpecificAnchor?.topicFrameId || '', { required: false, privacyClass: 'internal' }),
  ]
  return Object.freeze(units.filter((item) => item.required || (item.value !== '' && item.value !== null && item.value !== undefined)))
}

function mixedHash32(value = '') {
  let x = Number.parseInt(ql7StableHash(value), 16) >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x85ebca6b) >>> 0
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35) >>> 0
  x ^= x >>> 16
  return x >>> 0
}

function chooseSkeleton(branch = {}, semanticPlan = {}, seed = '', attempt = 0, regenerationStrategy = '') {
  const eligible = branch.family === 'safety'
    ? ['acknowledge-direct-question', 'direct-boundary-alternative', 'direct-condition-action']
    : branch.family === 'fact'
      ? ['direct-evidence-next', 'answer-source-boundary', 'fact-interpretation-action', 'observation-meaning-next']
      : branch.family === 'clarification'
        ? ['direct-reason-question', 'context-direct-next', 'answer-detail-choice']
        : RHETORICAL_SKELETONS
  const forced = ql7Str(regenerationStrategy)
  const strategyShift = forced === 'change-rhetorical-skeleton' ? ':force-new-skeleton' : forced ? `:${forced}` : ''
  const key = `${seed}:${attempt}:${branch.id}:${semanticPlan.userSpecificAnchor?.inputMeaningHash || ''}${strategyShift}`
  const index = branch.id === 'fact.ai-recommendation'
    ? mixedHash32(`ai-recommendation:${key}`)
    : Number.parseInt(ql7StableHash(key), 16)
  return eligible[index % eligible.length]
}

function operations(branch = {}, contentPlan = {}) {
  const required = branch.requiredOperations.map((id, index) => Object.freeze({ id, required: true, orderHint: index }))
  const optional = branch.optionalOperations
    .filter((id) => {
      if (id === 'offer-explicit-open-topic') return Boolean(contentPlan.entryEvent?.activeTopic || contentPlan.waitingFor)
      if (id === 'state-source-time') return Boolean(contentPlan.factProjection?.checkedAt || contentPlan.receipt?.checkedAt)
      if (id === 'offer-vip-route') return contentPlan.allowedSecondaryDomainIds?.includes('vip')
      if (id === 'ask-one-material-detail') return Boolean(contentPlan.waitingFor)
      return true
    })
    .map((id, index) => Object.freeze({ id, required: false, orderHint: required.length + index }))
  return Object.freeze([...required, ...optional])
}

export function buildQl7SupportDiscoursePlan({
  semanticPlan = {},
  contentPlan = {},
  scopeReceipt = {},
  locale = 'en',
  seed = '',
  attempt = 0,
  regenerationStrategy = null,
} = {}) {
  const { definition: branch, receipt: branchReceipt } = resolveQl7SupportResponseBranch(contentPlan)
  const units = semanticUnits({ semanticPlan, contentPlan, scopeReceipt })
  const requestedStrategy = ql7Str(regenerationStrategy?.strategy || regenerationStrategy)
  const strategy = selectQl7SupportDiscourseStrategy({ family: branch.family, seed: Number.parseInt(ql7StableHash(`${seed}:${attempt}:${requestedStrategy}`),16) })
  const rhetoricalSkeletonId = chooseSkeleton(branch, semanticPlan, `${seed}:${strategy.id}`, attempt, requestedStrategy)
  const plannedOperations = operations(branch, contentPlan)
  const body = {
    schema: 'ql7.support.discourse-plan',
    schemaVersion: QL7_SUPPORT_DISCOURSE_PLANNER_VERSION,
    locale,
    branchId: branch.id,
    branchFamily: branch.family,
    branchReceiptId: branchReceipt.receiptId,
    speechAct: branch.speechAct,
    rhetoricalSkeletonId,
    discourseStrategyId: strategy.id,
    regenerationStrategyId: requestedStrategy,
    regenerationChangedDimensions: Object.freeze(ql7Arr(regenerationStrategy?.changedDimensions)),
    semanticUnits: units,
    operations: plannedOperations,
    bankFamilies: branch.bankFamilies,
    forbiddenOperations: branch.forbiddenOperations,
    userSpecificAnchor: semanticPlan.userSpecificAnchor || {},
    attempt,
  }
  const planHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({
    ...body,
    planId: `discourse-plan:${planHash}`,
    planHash,
    branchReceipt,
  })
}

export function getQl7SupportDiscourseUnit(plan = {}, type = '') {
  return ql7Arr(plan.semanticUnits).find((item) => item.type === type) || null
}

