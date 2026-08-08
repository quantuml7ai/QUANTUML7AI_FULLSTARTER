function str(value) { return String(value ?? '').trim() }

function normalize(value = '') {
  return str(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

const NEW_ISSUE = /(?:^|[^\p{L}\p{N}_])(?:another\s+(?:issue|problem|question)|new\s+(?:issue|problem)|separate\s+(?:issue|problem)|different\s+(?:issue|problem)|другая\s+проблема|другой\s+вопрос|новая\s+проблема|це\s+інша\s+проблема|інше\s+питання|otro\s+problema|otra\s+pregunta|başka\s+bir\s+sorun|yeni\s+bir\s+sorun|مشكلة\s+أخرى|سؤال\s+آخر|另一个问题|新的问题|בעיה\s+אחרת|שאלה\s+אחרת)(?=$|[^\p{L}\p{N}_])/iu
const TOPIC_REJECTION = /(?:^|[^\p{L}\p{N}_])(?:i\s+(?:do\s+not|don't)\s+(?:need|want)|stop\s+(?:this|talking\s+about)|drop\s+(?:this|the\s+topic)|не\s+(?:нужна|нужен|нужно|надо)|не\s+хочу|закрой\s+(?:эту\s+)?тему|хватит\s+про|мені\s+не\s+потрібн|не\s+хочу|no\s+necesito|no\s+quiero|deja\s+este\s+tema|istemiyorum|gerek\s+yok|bu\s+konuyu\s+kapat|لا\s+أريد|لا\s+أحتاج|أغلق\s+هذا\s+الموضوع|不需要|不要再说|关闭这个话题|אני\s+לא\s+(?:צריך|צריכה|רוצה)|תפסיק\s+לדבר\s+על)(?=$|[^\p{L}\p{N}_])/iu
const CONTINUE_MARKER = /(?:^|[^\p{L}\p{N}_])(?:also|additionally|ещ[её]|дополнительно|уточняю|ще|додатково|además|también|ayrıca|أيضاً|另外|此外|בנוסף)(?=$|[^\p{L}\p{N}_])/iu
const EXPLICIT_STATUS = /(?:^|[^\p{L}\p{N}_])(?:status|state|статус|состояни\p{L}*|стан|what\s+is\s+happening|any\s+update|что\s+там|що\s+там|durum|estado|الحالة|状态|סטטוס|מה\s+המצב)(?=$|[^\p{L}\p{N}_])/iu
const EXPLICIT_SELF_REFERENCE = /(?:^|[^\p{L}\p{N}_])(?:мой|моя|моё|мое|мои|моего|моей|мою|моим|моём|моем|у\s+меня|мій|моя|мої|мого|моїм|моєму|моєю|у\s+мене|my|mine|own|mi|mis|mío|mía|benim|bakiyem\p{L}*|hesabım|paketim|رصيدي|حسابي|حزمتي|إعلاني|שלי|החשבון\s+שלי)(?=$|[^\p{L}\p{N}_])/iu
const CJK_SELF_REFERENCE = /(?:我的|我自己的|我的账户)/iu

const NON_MATERIAL_ACTS = new Set([
  'empty',
  'greeting',
  'gratitude',
  'conversation_close',
  'topic_rejection',
  'spam_or_noise',
  'identity_question',
  'humor_play',
  'informational_question',
  'how_to_question',
  'why_question',
  'when_question',
  'status_request',
])

export function countQl7SupportActionableEntities(entities = {}) {
  if (!entities || typeof entities !== 'object') return 0
  return Object.entries(entities).reduce((count, [key, value]) => {
    if (key === 'hasSecret' || key === 'selfReference') return count
    if (value === '' || value === null || value === undefined || value === false || value === true) return count
    return count + 1
  }, 0)
}

export function decideQl7SupportConversationTurn({
  text = '',
  canonicalText = '',
  previousContext = {},
  route = {},
  analysis = {},
  tone = {},
} = {}) {
  const source = normalize([text, canonicalText].filter(Boolean).join('\n'))
  const previousTopic = str(previousContext?.previousTopic || previousContext?.topic)
  const topic = str(route?.topic || analysis?.topic || previousTopic || 'support_system')
  const messageAct = str(route?.messageAct || analysis?.messageAct || analysis?.role || 'problem_description')
  const topicSwitchDecision = str(route?.topicSwitchDecision)
  const operation = str(route?.operation || route?.turnFrame?.operation)
  const actionableEntityCount = countQl7SupportActionableEntities(analysis?.entities)
  const hasActionableEntity = actionableEntityCount > 0
  const explicitNewIssue = NEW_ISSUE.test(source) || messageAct === 'new_unrelated_issue' || topicSwitchDecision === 'switch'
  const topicRejected = TOPIC_REJECTION.test(source) || messageAct === 'topic_rejection'
  const topicChanged = Boolean(previousTopic && topic && previousTopic !== topic)
  const explicitStatus = EXPLICIT_STATUS.test(source) || messageAct === 'status_request' || /(?:^|_)self_status$/u.test(str(route?.subIntent || analysis?.subIntent))
  const continuationMarker = CONTINUE_MARKER.test(source)
  const safetyEscalation = tone?.safetyEscalation === true || operation === 'safety_review' || ['threat', 'hate', 'harassment', 'sexual_harassment'].includes(str(tone?.taxonomyCategory || tone?.category))
  const insultToSupport = str(tone?.taxonomyCategory || tone?.category) === 'insult_to_support'
  const frustration = ['frustration_at_system', 'frustration_with_request'].includes(str(tone?.taxonomyCategory || tone?.category))
  const asksForHelp = tone?.asksForHelp === true || ['problem_description', 'how_to_question', 'why_question'].includes(messageAct)
  const selfStatus = /(?:^|_)self_status$/u.test(str(route?.subIntent || analysis?.subIntent))
  const explicitSelfReference = EXPLICIT_SELF_REFERENCE.test(source) || CJK_SELF_REFERENCE.test(source)
  const microIntent = str(route?.microIntent || analysis?.microIntent)
  const actorScopedReadSubIntent = [
    'qcoin_balance',
    'wallet_connection_status',
    'payments_self_status',
    'ads_packages_self_status',
    'ads_campaigns_self_status',
    'ads_campaigns_metrics',
    'vip_self_status',
    'moderation_report_count',
    'qcoin_security',
  ].includes(str(route?.subIntent || analysis?.subIntent))
  const qcoinSecurityRead = microIntent === 'qcoin.security' || str(route?.subIntent || analysis?.subIntent) === 'qcoin_security'
  const actorScopedRead = (explicitSelfReference || qcoinSecurityRead) &&
    route?.domainPlan?.privacyBoundary === 'user_safe_evidence_only' &&
    (['check_status', 'show_metrics', 'security'].includes(operation) || actorScopedReadSubIntent || qcoinSecurityRead) &&
    ['qcoin', 'wallet', 'payments', 'ads_campaigns', 'ads_packages', 'vip', 'moderation'].includes(topic)
  const informational = ['greeting', 'gratitude', 'appreciation', 'wellbeing_check', 'emotional_support', 'casual_chat', 'small_talk_boundary', 'apology', 'confusion', 'success_confirmation', 'impatience', 'identity_question', 'humor_play', 'informational_question', 'how_to_question', 'why_question', 'when_question'].includes(messageAct) && !selfStatus && !actorScopedRead
  const explanationFollowup = operation === 'explain' || operation === 'launch_status' || operation === 'show_metrics'
  const ownMetricsStatus = operation === 'show_metrics' && ['ads_campaigns', 'ads_packages', 'qcoin', 'vip'].includes(topic)
  const actorScopedIncident = (qcoinSecurityRead || ['incident_report', 'problem_description'].includes(messageAct)) &&
    ['qcoin', 'payments', 'ads_campaigns', 'ads_packages', 'vip'].includes(topic)
  const relationshipRequest = ['partnership_request', 'business_proposal', 'human_operator_request'].includes(messageAct) || ['partnership', 'investment', 'contact'].includes(topic)

  let decision = 'continue_case'
  let shouldStartNewCase = false
  let shouldClearQuestion = false
  let shouldDiagnose = false
  let caseStatus = str(analysis?.caseStatus || 'collecting_context')
  let reasonCode = 'same_case'

  if (safetyEscalation) {
    decision = 'safety_escalation'
    shouldClearQuestion = true
    caseStatus = 'awaiting_admin'
    reasonCode = `tone_${str(tone?.taxonomyCategory || tone?.category || 'safety')}`
  } else if (topicRejected) {
    decision = insultToSupport ? 'boundary_and_close_topic' : 'close_topic'
    shouldClearQuestion = true
    caseStatus = 'user_notified'
    reasonCode = 'explicit_topic_rejection'
  } else if (insultToSupport && !hasActionableEntity && !asksForHelp) {
    decision = 'calm_boundary'
    shouldClearQuestion = true
    caseStatus = 'user_notified'
    reasonCode = 'insult_without_support_request'
  } else if (relationshipRequest) {
    decision = messageAct === 'human_operator_request' ? 'operator_handoff_intake' : 'partnership_intake'
    shouldClearQuestion = true
    caseStatus = messageAct === 'human_operator_request' ? 'collecting_context' : 'collecting_context'
    reasonCode = messageAct === 'human_operator_request' ? 'human_operator_intake' : 'strategic_relationship_intent'
  } else if (topicSwitchDecision === 'clarify') {
    decision = 'clarify_topic'
    caseStatus = 'collecting_context'
    reasonCode = 'topic_switch_v9_clarify'
  } else if (explicitNewIssue || (topicChanged && !continuationMarker && !['answer_to_question', 'confirmation', 'denial', 'correction'].includes(messageAct))) {
    decision = insultToSupport ? 'boundary_and_switch_topic' : 'switch_topic'
    shouldStartNewCase = true
    shouldClearQuestion = true
    caseStatus = selfStatus || actorScopedRead || ownMetricsStatus || actorScopedIncident || hasActionableEntity ? 'ready_for_diagnostic' : ((informational || explanationFollowup) ? 'user_notified' : 'collecting_context')
    reasonCode = topicSwitchDecision === 'switch' ? 'topic_switch_v9' : (explicitNewIssue ? 'explicit_new_issue' : 'topic_changed')
  } else if (insultToSupport) {
    decision = 'boundary_and_continue'
    shouldClearQuestion = !hasActionableEntity
    caseStatus = hasActionableEntity ? 'ready_for_diagnostic' : 'collecting_context'
    reasonCode = 'insult_with_support_request'
  } else if (selfStatus || actorScopedRead || ownMetricsStatus || actorScopedIncident || (explicitStatus && topic !== 'support_system')) {
    decision = 'diagnose_self_status'
    shouldClearQuestion = true
    shouldDiagnose = true
    caseStatus = 'ready_for_diagnostic'
    reasonCode = actorScopedIncident ? 'verified_actor_material_incident' : 'verified_actor_self_status'
  } else if (hasActionableEntity && !informational) {
    decision = 'diagnose_material_incident'
    shouldClearQuestion = true
    shouldDiagnose = true
    caseStatus = 'ready_for_diagnostic'
    reasonCode = 'actionable_entity_present'
  } else if (informational || explanationFollowup) {
    decision = 'answer_information'
    shouldClearQuestion = true
    caseStatus = 'user_notified'
    reasonCode = `informational_${operation || messageAct}`
  } else if (frustration) {
    decision = 'acknowledge_and_clarify'
    caseStatus = 'collecting_context'
    reasonCode = 'frustration_without_actionable_anchor'
  } else if (messageAct === 'status_request') {
    decision = 'report_case_status'
    shouldClearQuestion = true
    caseStatus = str(previousContext?.caseStatus || analysis?.caseStatus || 'collecting_context')
    reasonCode = 'persisted_status_request'
  }

  if (shouldDiagnose === false && caseStatus === 'ready_for_diagnostic') shouldDiagnose = true

  const relationshipIntent = relationshipRequest || decision === 'partnership_intake' || decision === 'operator_handoff_intake'
  const emailMaterial = safetyEscalation || (
    !NON_MATERIAL_ACTS.has(messageAct) &&
    !topicRejected &&
    !(insultToSupport && !hasActionableEntity) &&
    (hasActionableEntity || selfStatus || actorScopedRead || actorScopedIncident || str(analysis?.entities?.hasSecret) === 'true')
  )

  return Object.freeze({
    decision,
    reasonCode,
    messageAct,
    previousTopic,
    topic,
    topicChanged,
    topicSwitchDecision,
    topicRejected,
    explicitNewIssue,
    continuationMarker,
    selfStatus,
    explicitSelfReference,
    actorScopedRead,
    explicitStatus,
    informational,
    explanationFollowup,
    operation,
    actionableEntityCount,
    hasActionableEntity,
    shouldStartNewCase,
    shouldClearQuestion,
    shouldDiagnose,
    relationshipIntent,
    emailMaterial,
    caseStatus,
    diagnosticStatus: shouldDiagnose ? 'ready' : (caseStatus === 'user_notified' ? 'not_started' : str(analysis?.diagnosticStatus || 'not_started')),
  })
}
