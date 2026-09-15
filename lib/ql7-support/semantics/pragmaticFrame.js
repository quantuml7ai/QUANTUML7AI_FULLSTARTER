import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_PRAGMATIC_FRAME_VERSION = '1.0.0'
export const QL7_SUPPORT_PRAGMATIC_FRAME_OWNER_ID = 'ql7-support.semantics.pragmatic-frame'

const EXPLAIN = /(?:\b(?:what\s+is|tell\s+me\s+about|explain|overview|describe|how\s+is\s+.{0,32}\s+(?:organized|structured))\b|(?:расскаж|объясн|поясн|что\s+такое|для\s+чего|зачем|как\s+(?:здесь\s+)?устроен(?:а|о|ы)?|из\s+чего\s+состоит)|(?:розкаж|поясн|що\s+таке|для\s+чого|як\s+(?:тут\s+)?влаштован(?:а|о|і)?|з\s+чого\s+складається)|(?:cu[eé]ntame|explica|qu[eé]\s+es|c[oó]mo\s+est[aá]\s+(?:organizado|estructurado))|(?:anlat|a[çc]ıkla|nedir|nas[ıi]l\s+(?:düzenlen|yapılandır))|(?:اشرح|ما\s+هو|حدثني\s+عن|كيف\s+(?:يُنظَّم|تم\s+تنظيمه))|(?:什么是|介绍|解释|讲讲|如何组织|怎么构成)|(?:מה\s+זה|ספר\s+לי\s+על|הסבר|איך\s+.+\s+בנוי))/iu
const HOW = /(?:\bhow\s+(?:do|does|can|to)\b|\b(?:where\s+(?:can\s+i\s+)?(?:find|check|see)|what\s+(?:do|should)\s+i\s+do\s+(?:if|when))\b|\bhow\s+(?:does|can).{0,32}\bhelp\b|(?:как|каким\s+образом)\s+(?:мне\s+)?(?:польз|работ|откры|нача|созда|най|сдела|получ|отправ|куп|приобр|оплат|пополн|подат|связ|включ|выключ|удал|переключ|измен|настро|провер)|(?:где|куда)\s+(?:можно\s+)?(?:посмотр|провер|най|откры)|что\s+делать\s+(?:если|когда|при)|как.{0,32}помога|(?:як|яким\s+чином)\s+(?:мені\s+)?(?:корист|прац|відкр|поча|створ|знай|зроб|отрим|надісл|куп|придба|оплат|поповн|подат|зв’яз|увімк|вимк|видал|перемк|змін|налашт|перевір)|(?:де|куди)\s+(?:можна\s+)?(?:подив|перевір|знай|відкр)|що\s+робити\s+(?:якщо|коли|при)|як.{0,32}допомага|c[oó]mo\s+(?:usar|funciona|abrir|empezar|crear|comprar|pagar|enviar|activar|desactivar|eliminar|cambiar|configurar|comprobar)|d[oó]nde\s+(?:puedo\s+)?(?:ver|comprobar|encontrar)|qu[eé]\s+hacer\s+(?:si|cuando)|c[oó]mo.{0,32}ayuda|nas[ıi]l\s+(?:kullan|çalış|aç|başla|oluştur|satın\s+al|öde|gönder|etkinleştir|kapat|sil|değiştir|ayarla|kontrol)|nerede\s+(?:gör|kontrol|bul)|(?:olursa|olduğunda)\s+ne\s+yap|nas[ıi]l.{0,32}yardım|كيف\s+(?:أستخدم|يعمل|أفتح|أبدأ|أنشئ|أشتري|أدفع|أرسل|أفعّل|أعطّل|أحذف|أغيّر|أضبط|أتحقق)|أين\s+(?:أرى|أتحقق|أجد)|ماذا\s+أفعل\s+(?:إذا|عند)|كيف.{0,32}يساعد|(?:如何|怎么)(?:使用|工作|打开|开始|创建|购买|支付|发送|启用|关闭|删除|切换|设置|检查|帮助)|(?:在哪里|去哪)(?:查看|检查|找到)|(?:如果|遇到).{0,20}怎么办|(?:איך|כיצד)\s+(?:משתמש|עובד|פותח|מתחיל|יוצר|קונה|משלם|שולח|מפעיל|מכבה|מוחק|משנה|מגדיר|בודק|עוזר)|איפה\s+(?:רואים|בודקים|מוצאים)|מה\s+לעשות\s+(?:אם|כאשר))/iu
const PURCHASE = /(?:\b(?:buy|purchase|pay\s+for|top\s*up|acquire|subscribe)\b|(?:купить|покупк|приобрест|приобрет|оплатить|пополнить|подписаться)|(?:купити|придбати|оплатити|поповнити|підписатися)|(?:comprar|adquirir|pagar|recargar|suscrib)|(?:satın\s+al|öde|yükle|abone)|(?:شراء|أشتري|ادفع|أدفع|اشترك)|(?:购买|买|支付|充值|订阅)|(?:לקנות|רכישה|לשלם|להטעין|להירשם))/iu
const OPINION = /(?:\b(?:what\s+do\s+you\s+think|your\s+(?:view|take|opinion)|prospects?|outlook|why\s+do\s+people|discuss)\b|(?:что\s+(?:ты\s+)?дума|как\s+(?:ты\s+)?счита|тво[её]\s+мнение|перспектив|почему\s+люди|поговорим\s+про|обсудим)|(?:що\s+(?:ти\s+)?дума|як\s+(?:ти\s+)?вважа|твоя\s+думка|перспектив|чому\s+люди|обговоримо)|(?:qu[eé]\s+piensas|tu\s+opini[oó]n|perspectivas?|por\s+qu[eé]\s+la\s+gente)|(?:ne\s+düşün|fikrin|geleceği|insanlar\s+neden)|(?:ما\s+رأيك|ماذا\s+تعتقد|آفاق|لماذا\s+يخاف\s+الناس)|(?:你怎么看|你的看法|前景|为什么人们)|(?:מה\s+דעתך|מה\s+אתה\s+חושב|תחזית|למה\s+אנשים))/iu
const PERSONAL = /(?:\b(?:my|mine|me|our|account)\b|(?:мой|моя|мо[её]|мои|мне|у\s+меня|наш)|(?:мій|моя|мо[єе]|мої|мені|у\s+мене|наш)|(?:mi|m[ií]o|m[ií]a|cuenta)|(?:benim|bana|hesab)|(?:حسابي|رصيدي|لي|خاصتي)|(?:我的|我账户|给我)|(?:שלי|החשבון\s+שלי|לי))/iu
const DATA_ACTION = /(?:\b(?:show|display|check|verify|calculate|give\s+me|what\s+is\s+my)\b|(?:покаж|вывед|проверь|провер|посчитай|рассчитай|сколько\s+у\s+меня)|(?:покаж|вивед|перевір|порахуй|скільки\s+в\s+мене)|(?:muestra|verifica|calcula|cu[aá]nto\s+tengo)|(?:g[öo]ster|kontrol|hesapla)|(?:اعرض|تحقق|احسب)|(?:显示|检查|计算)|(?:הצג|בדוק|חשב))/iu
const STATUS = /(?:\b(?:status|balance|metrics?|statistics?|active|remaining|quota)\b|(?:статус|состояни|баланс|метрик|статистик|актив|остаток|квот)|(?:статус|стан|баланс|метрик|статистик|актив|залишок|квот)|(?:estado|saldo|m[eé]tricas?|estad[ií]sticas?|activo)|(?:durum|bakiye|metrik|istatistik|aktif)|(?:حالة|رصيد|مقاييس|إحصاءات|نشط)|(?:状态|余额|指标|统计|激活)|(?:מצב|יתרה|מדדים|סטטיסטיקה|פעיל))/iu
const CURRENT = /(?:\b(?:now|current|currently|today|latest|live|right\s+now)\b|(?:сейчас|сегодня|текущ|актуальн|прямо\s+сейчас)|(?:зараз|сьогодні|поточн|актуальн)|(?:ahora|actual|hoy|[uú]ltim)|(?:şimdi|güncel|bugün)|(?:الآن|حالي|اليوم|أحدث)|(?:现在|当前|今天|最新|实时)|(?:עכשיו|נוכחי|היום|עדכני))/iu
const PRICE = /(?:\b(?:price|worth|rate|quote|ticker)\b|(?:цен[ауые]|стоимост|курс|котиров|сколько(?:\s+\p{L}+){0,3}\s+стоит)|(?:цін[ауи]|вартіст|курс|котирув|скільки(?:\s+\p{L}+){0,3}\s+кошту)|(?:precio|cotizaci[oó]n|cu[aá]nto(?:\s+\p{L}+){0,3}\s+vale)|(?:fiyat|kur|değer)|(?:سعر|قيمة)|(?:价格|价值|报价)|(?:מחיר|שווי|שער))/iu
const AI_REQUEST = /(?:\b(?:forecast|prediction|recommendation|signal|analyse|analyze)\b|(?:прогноз|рекомендац|сигнал|проанализ|рассчитай\s+сценар)|(?:прогноз|рекомендац|сигнал|проаналіз)|(?:pron[oó]stico|recomendaci[oó]n|señal|analiza)|(?:tahmin|öneri|sinyal|analiz)|(?:توقع|توصية|إشارة|حلل)|(?:预测|建议|信号|分析)|(?:תחזית|המלצה|אות|נתח))/iu
const QUESTION = /[?？]/u
const NEGATION = /(?:\b(?:not|never|no)\b|(?:не|нет|никогда|не\s+надо)|(?:не|ні|ніколи)|(?:no|nunca)|(?:değil|hayır)|(?:لا|ليس)|(?:不|不是|不要)|(?:לא|אין))/iu

function hasSignal(signals = {}, category = '') {
  return ql7Arr(signals?.categoryHits?.[category]).length > 0
}

function wordCount(text = '') {
  return (ql7Str(text).match(/[\p{L}\p{N}]+/gu) || []).length
}

function evidence(id = '', weight = 0) {
  return Object.freeze({ id, weight: Number(weight.toFixed(3)) })
}

function candidateStore() {
  const rows = new Map()
  return {
    add(id, weight, evidenceId) {
      if (!id || !Number.isFinite(Number(weight)) || Number(weight) === 0) return
      const row = rows.get(id) || { id, score: 0, evidence: [], counterEvidence: [] }
      row.score += Number(weight)
      if (evidenceId) row.evidence.push(evidence(evidenceId, Number(weight)))
      rows.set(id, row)
    },
    counter(id, weight, evidenceId) {
      const row = rows.get(id) || { id, score: 0, evidence: [], counterEvidence: [] }
      row.score -= Math.abs(Number(weight) || 0)
      if (evidenceId) row.counterEvidence.push(evidence(evidenceId, -Math.abs(Number(weight) || 0)))
      rows.set(id, row)
    },
    rows() {
      return Object.freeze([...rows.values()]
        .map((row) => Object.freeze({
          ...row,
          score: Number(row.score.toFixed(3)),
          evidence: Object.freeze(row.evidence),
          counterEvidence: Object.freeze(row.counterEvidence),
        }))
        .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id)))
    },
  }
}

function actForGoal(goalId = '', { productDomain = false, generalTopic = false } = {}) {
  if (goalId === 'personal_read') return 'personal_status_request'
  if (goalId === 'current_market_fact' || goalId === 'ai_market_analysis') return 'ai_recommendation_request'
  if (goalId === 'how_to_or_purchase') return 'how_to_question'
  if (goalId === 'explain_overview') return generalTopic && !productDomain ? 'general_knowledge_question' : 'informational_question'
  if (goalId === 'opinion_discussion') return 'general_knowledge_question'
  if (goalId === 'meaningless_fragment') return 'spam_or_noise'
  if (goalId === 'domain_mention_only') return 'ambiguous_request'
  return ''
}

export function buildQl7SupportPragmaticFrame({
  text = '',
  originalText = '',
  locale = 'en',
  semanticSignals = {},
  productDomainId = '',
  generalTopic = null,
  marketSignals = {},
  previousContext = {},
} = {}) {
  const source = ql7Str(text || originalText).normalize('NFKC')
  const words = wordCount(source)
  const store = candidateStore()
  const productDomain = Boolean(ql7Str(productDomainId))
  const generalResolved = Boolean(generalTopic?.nodeId || generalTopic?.category)
  const hasExplain = EXPLAIN.test(source)
  const hasHow = HOW.test(source)
  const hasPurchase = PURCHASE.test(source)
  const hasOpinion = OPINION.test(source)
  const hasPersonal = PERSONAL.test(source)
  const hasDataAction = DATA_ACTION.test(source) || hasSignal(semanticSignals, 'dataRequest')
  const hasStatus = STATUS.test(source)
  const hasCurrent = CURRENT.test(source)
  const hasPrice = PRICE.test(source)
  const hasAiRequest = AI_REQUEST.test(source)
  const questionForm = QUESTION.test(source) || hasExplain || hasHow || hasOpinion
  const meaningfulObject = productDomain || generalResolved || marketSignals?.hasAsset === true
  const meaningless = words === 0 || (words === 1 && !meaningfulObject && !hasSignal(semanticSignals, 'greetings') && !hasSignal(semanticSignals, 'thanks'))

  if (meaningless) store.add('meaningless_fragment', 10, 'shape:no-meaningful-proposition')

  if (hasHow) store.add('how_to_or_purchase', 5, 'speech-act:how-to-relation')
  if (hasPurchase) store.add('how_to_or_purchase', 4, 'goal:purchase-or-top-up')
  if ((hasHow || hasPurchase) && meaningfulObject) store.add('how_to_or_purchase', 3, 'relation:action-plus-object')

  if (hasExplain) store.add('explain_overview', 5, 'speech-act:explain')
  if (hasExplain && meaningfulObject) store.add('explain_overview', 3, 'relation:explain-plus-object')

  if (hasOpinion) store.add('opinion_discussion', 5, 'speech-act:opinion-or-discussion')
  if (hasOpinion && meaningfulObject) store.add('opinion_discussion', 3, 'relation:opinion-plus-subject')
  if (hasOpinion && hasPrice && hasCurrent) store.counter('opinion_discussion', 2, 'counter:current-price-request')

  if (marketSignals?.hasAsset && hasPrice) store.add('current_market_fact', 5, 'relation:asset-plus-price')
  if (marketSignals?.hasAsset && hasPrice && (hasCurrent || questionForm)) store.add('current_market_fact', 3, 'scope:current-market-fact')
  if (marketSignals?.hasAsset && hasAiRequest) store.add('ai_market_analysis', 6, 'relation:asset-plus-analysis')
  if (marketSignals?.hasAsset && hasAiRequest && marketSignals?.hasTimeframe) store.add('ai_market_analysis', 3, 'relation:analysis-plus-timeframe')
  if (hasOpinion && !hasPrice && !hasAiRequest) {
    store.counter('current_market_fact', 4, 'counter:discussion-without-current-fact')
    store.counter('ai_market_analysis', 4, 'counter:opinion-without-analysis-request')
  }

  if (hasDataAction && hasStatus) store.add('personal_read', 4, 'relation:data-action-plus-status')
  if (hasDataAction && hasPersonal) store.add('personal_read', 3, 'relation:data-action-plus-actor')
  if (hasPersonal && hasStatus && productDomain) store.add('personal_read', 2, 'relation:actor-status-plus-domain')
  if (hasPersonal && productDomain && !hasDataAction && !hasStatus) store.counter('personal_read', 3, 'counter:ownership-without-read-action')
  if ((hasExplain || hasHow || hasPurchase || hasOpinion) && !hasDataAction) store.counter('personal_read', 5, 'counter:knowledge-goal-not-personal-read')

  if (productDomain && !hasExplain && !hasHow && !hasPurchase && !hasOpinion && !hasDataAction && !hasStatus && !hasPrice && !hasAiRequest) {
    store.add('domain_mention_only', words <= 4 ? 6 : 3, 'shape:domain-without-goal')
  }
  if (marketSignals?.hasAsset && !hasPrice && !hasAiRequest && !hasOpinion && !hasHow && !hasPurchase) {
    store.add('domain_mention_only', 6, 'shape:asset-without-goal')
  }

  if (NEGATION.test(source)) {
    if (hasDataAction || hasStatus) store.counter('personal_read', 1.5, 'scope:negation-present')
    if (hasPurchase) store.counter('how_to_or_purchase', 1, 'scope:negation-present')
  }
  if (questionForm && meaningfulObject && (hasOpinion || hasHow || hasPurchase || hasExplain)) {
    store.add(hasOpinion ? 'opinion_discussion' : hasHow || hasPurchase ? 'how_to_or_purchase' : 'explain_overview', 1, 'syntax:question-plus-object')
  }
  if (previousContext?.activeTopic && previousContext.activeTopic === productDomainId && words <= 5) {
    store.add('context_continuation', 1.25, 'memory:active-topic-agreement')
  }

  const candidates = store.rows()
  const top = candidates[0] || Object.freeze({ id: 'unknown', score: 0, evidence: Object.freeze([]), counterEvidence: Object.freeze([]) })
  const second = candidates[1] || Object.freeze({ id: 'unknown', score: 0 })
  const margin = Number((top.score - second.score).toFixed(3))
  const sensitiveGoal = ['personal_read', 'current_market_fact', 'ai_market_analysis'].includes(top.id)
  const safeDirectGoal = ['how_to_or_purchase', 'explain_overview', 'opinion_discussion'].includes(top.id)
  const clearSafeGoal = safeDirectGoal && top.score >= 6 && margin >= 1.25 && meaningfulObject
  const ambiguous = top.id === 'domain_mention_only' || (top.id === 'unknown' && words > 0) || (margin < 1.25 && top.score < 8)
  const userClarificationRequired = top.id === 'meaningless_fragment' || ambiguous || (sensitiveGoal && top.score < 7)
  const messageActSuggestion = actForGoal(top.id, { productDomain, generalTopic: generalResolved })
  const actorScope = hasPersonal ? 'self_or_owned' : 'public_or_unspecified'
  const temporalScope = hasCurrent ? 'current' : hasOpinion ? 'open_horizon' : 'stable_or_unspecified'
  const answerabilityClass = top.id === 'meaningless_fragment'
    ? 'meaningless-input'
    : sensitiveGoal
      ? (userClarificationRequired ? 'sensitive-clarification' : 'sensitive-confirmation-gate')
      : clearSafeGoal
        ? 'direct-safe-answer'
        : ambiguous
          ? 'meaning-clarification'
          : 'bounded-answer'
  const body = {
    schema: 'ql7.support.pragmatic-frame',
    schemaVersion: QL7_SUPPORT_PRAGMATIC_FRAME_VERSION,
    ownerId: QL7_SUPPORT_PRAGMATIC_FRAME_OWNER_ID,
    locale: ql7Str(locale),
    inputMeaningHash: ql7StableHash(source.toLocaleLowerCase(locale || 'en')),
    productDomainId: ql7Str(productDomainId),
    generalTopicId: ql7Str(generalTopic?.nodeId || generalTopic?.category),
    actorScope,
    temporalScope,
    requestForm: questionForm ? 'question-or-explicit-request' : 'statement-or-fragment',
    topGoalId: top.id,
    messageActSuggestion,
    candidates,
    scoreMargin: margin,
    sensitiveGoal,
    clearSafeGoal,
    userClarificationRequired,
    answerabilityClass,
    provenance: Object.freeze({
      normalizationPreservedOriginal: Boolean(ql7Str(originalText)),
      semanticBankSignalsUsed: Boolean(semanticSignals?.categoryHits),
      conversationMemoryUsed: Boolean(previousContext?.activeTopic),
      calibratedProbabilityClaimed: false,
    }),
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `pragmatic-frame:${receiptHash}`, receiptHash })
}

export function resolveQl7SupportUserAnswerability({
  pragmaticFrame = {},
  messageAct = '',
  intentConfirmation = {},
  scoring = {},
  decisionMathReceipt = {},
  safety = {},
} = {}) {
  const safeDirectActs = new Set([
    'greeting', 'gratitude', 'farewell', 'wellbeing_question', 'small_talk',
    'emotional_support', 'humor_request', 'humor_followup', 'identity_question',
    'how_to_question', 'informational_question', 'general_knowledge_question',
    'roadmap_question', 'reported_speech',
  ])
  const protectedBySafety = safety?.operatorRequired === true || safety?.selfHarm === true || safety?.threat === true
  const confirmationPending = ['collecting', 'exhausted'].includes(ql7Str(intentConfirmation?.state))
  const confirmationAuthorized = intentConfirmation?.state === 'confirmed' && intentConfirmation?.adapterAuthorized === true
  const directSafe = !protectedBySafety && !confirmationPending && (
    pragmaticFrame?.clearSafeGoal === true || safeDirectActs.has(ql7Str(messageAct))
  )
  const semanticUncertainty = decisionMathReceipt?.abstention?.semanticAbstain === true || scoring?.clarificationRequired === true
  const pragmaticClarification = pragmaticFrame?.userClarificationRequired === true && !directSafe
  const userClarificationRequired = confirmationPending || (pragmaticClarification && !confirmationAuthorized) || (semanticUncertainty && !directSafe && !confirmationAuthorized)
  const body = {
    schema: 'ql7.support.user-answerability-decision',
    schemaVersion: QL7_SUPPORT_PRAGMATIC_FRAME_VERSION,
    directSafe,
    confirmationPending,
    semanticUncertaintyPreserved: semanticUncertainty,
    userClarificationRequired,
    reasonCode: confirmationPending
      ? 'sensitive-intent-confirmation-pending'
      : confirmationAuthorized
        ? 'sensitive-intent-confirmed'
        : directSafe
          ? 'answer-with-bounded-evidence'
      : pragmaticFrame?.userClarificationRequired === true
        ? ql7Str(pragmaticFrame.answerabilityClass || 'pragmatic-ambiguity')
        : semanticUncertainty && !directSafe
          ? 'semantic-uncertainty'
          : 'answer-with-bounded-evidence',
  }
  const receiptHash = ql7StableHash(JSON.stringify(body))
  return Object.freeze({ ...body, receiptId: `answerability:${receiptHash}`, receiptHash })
}
