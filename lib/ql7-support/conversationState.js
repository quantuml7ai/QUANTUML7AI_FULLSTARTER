const SHORT_FOLLOWUP = /^(?:да|нет|ага|неа|проверь|проверьте|какой статус|что с ним|что с ней|почему|когда закончится|а реклама|а vip|yes|no|check|check it|what status|why|when|and ads|and vip|так|ні|перевір|який статус|що з ним|sí|si|no|comprueba|estado|neden|ne zaman|evet|hayır|kontrol|نعم|لا|تحقق|ما الحالة|为什么|状态|检查|是|否|כן|לא|בדוק|מה המצב)[\s?!.,…]*$/iu
const STATUS_FOLLOWUP = /(?:статус|состояни|результат|новост|что там|status|result|update|progress|стан|результат|оновлен|estado|resultado|durum|sonuç|حالة|نتيجة|状态|结果|מצב|תוצאה)/iu
const ABANDONMENT = [
  { code: 'resolved_by_user', pattern: /(?:разобрался|решил(?:ось)?|проблема исчезла|fixed it|resolved|solved|вирішив|проблема зникла|resuelto|solucionado|çözüldü|hallettim|تم الحل|انتهت المشكلة|解决了|问题消失|נפתר|הסתדרתי)/iu },
  { code: 'no_longer_relevant', pattern: /(?:уже неважно|больше не интересно|не актуально|no longer relevant|not important anymore|вже неважливо|не актуально|ya no importa|artık önemli değil|لم يعد مهم|不重要了|לא רלוונטי)/iu },
  { code: 'user_abandoned', pattern: /(?:забудь|не надо|оставь|forget it|never mind|не треба|залиш|olvídalo|boşver|unut|انس الأمر|لا أريد|算了|不用了|עזוב|לא צריך)/iu },
  { code: 'close_requested', pattern: /(?:можно закрыть|закрой обращение|close (?:it|the case)|закрий звернення|puedes cerrar|kapat|يمكن إغلاق|关闭工单|אפשר לסגור)/iu },
  { code: 'temporary_pause', pattern: /(?:вернусь позже|давай позже|pause|later|повернуся пізніше|más tarde|sonra|لاحقاً|稍后|אחר כך)/iu },
]

function str(value) { return String(value ?? '').trim() }
function words(value) { return str(value).split(/\s+/u).filter(Boolean) }

export function classifyQl7SupportAbandonment(text = '') {
  const clean = str(text)
  if (!clean) return null
  const match = ABANDONMENT.find((item) => item.pattern.test(clean))
  return match ? { matched: true, reasonCategory: match.code, closeCase: match.code !== 'temporary_pause' } : null
}

export function isQl7SupportShortFollowup(text = '') {
  const clean = str(text)
  return Boolean(clean && (SHORT_FOLLOWUP.test(clean) || words(clean).length <= 3))
}

export function stabilizeQl7SupportConversationRoute({ text = '', route = {}, previousCase = {}, baseAnalysis = {} } = {}) {
  const clean = str(text)
  const previousTopic = str(previousCase?.activeSubject || previousCase?.activeDomain || previousCase?.topic || previousCase?.previousTopic)
  const abandonment = classifyQl7SupportAbandonment(clean)
  if (abandonment) {
    return {
      ...route,
      topic: previousTopic || str(route?.topic || baseAnalysis?.topic || 'platform'),
      messageAct: 'abandonment',
      role: 'abandonment',
      subIntent: abandonment.reasonCategory,
      confidence: 0.99,
      contextRetained: Boolean(previousTopic),
      abandonment,
    }
  }
  const shortFollowup = isQl7SupportShortFollowup(clean)
  const routeConfidence = Number(route?.confidence || 0)
  const genericTopic = ['platform', 'homepage', 'unknown', 'conversation'].includes(str(route?.topic).toLowerCase())
  const shouldRetain = Boolean(previousTopic && shortFollowup && (genericTopic || routeConfidence < 0.75))
  const statusFollowup = STATUS_FOLLOWUP.test(clean)
  if (!shouldRetain) return { ...route, contextRetained: false, shortFollowup }
  return {
    ...route,
    topic: previousTopic,
    messageAct: statusFollowup ? 'status_followup' : (str(route?.messageAct) || 'followup'),
    role: statusFollowup ? 'status_followup' : (str(route?.role) || 'followup'),
    subIntent: statusFollowup ? 'personal_status' : (str(route?.subIntent) || 'context_followup'),
    confidence: Math.max(0.88, routeConfidence),
    contextRetained: true,
    shortFollowup: true,
    reasonCode: 'active_subject_retained',
  }
}

export function buildQl7SupportConversationState({ previousCase = {}, analysis = {}, messageId = '', now = new Date().toISOString() } = {}) {
  const abandonment = analysis?.abandonment || null
  const priorTurns = Number(previousCase?.turnCount || previousCase?.conversationTurnCount || 0)
  const turnCount = Math.min(9999, priorTurns + 1)
  const unresolvedSlots = Array.isArray(analysis?.missingSlots) ? analysis.missingSlots.filter(Boolean).slice(0, 8) : []
  const negativeFacts = [
    ...(Array.isArray(previousCase?.negativeFacts) ? previousCase.negativeFacts : []),
    ...(analysis?.messageAct === 'denial' ? [{ messageId: str(messageId), value: str(analysis?.sanitizedText), at: now }] : []),
  ].slice(-24)
  const openQuestions = unresolvedSlots.map((slot) => ({ slot: str(slot), askedAt: now })).slice(0, 5)
  const targetTurnBudget = Math.max(3, Math.min(5, Number(previousCase?.targetTurnBudget || 4)))
  return {
    activeSubject: str(analysis?.topic || previousCase?.activeSubject || previousCase?.topic),
    activeDomain: str(analysis?.topic || previousCase?.activeDomain || previousCase?.topic),
    pendingIntent: str(analysis?.subIntent || analysis?.messageAct),
    unresolvedSlots,
    negativeFacts,
    openQuestions,
    turnCount,
    targetTurnBudget,
    shouldDiagnoseByBudget: turnCount >= targetTurnBudget && unresolvedSlots.length === 0,
    abandonment: abandonment || previousCase?.abandonment || null,
    abandonedAt: abandonment ? now : str(previousCase?.abandonedAt),
    abandonmentReason: abandonment?.reasonCategory || str(previousCase?.abandonmentReason),
  }
}
