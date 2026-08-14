import { normalizeQl7SupportTopic } from './ecosystemCatalog.js'
import { isQl7SupportSemanticRepeat, semanticFingerprint } from './dialogueMemory.js'
import { applyQl7SupportAdultLanguagePolicy, normalizeQl7SupportLocale } from './adultLanguagePolicy.js'
import { realizeQl7SupportReply } from './naturalLanguageRealizer.js'
import { realizeQl7SemanticSurfaceV9 } from './semanticSurfaceV9.js'
import { enforceQl7SupportReplyBudgetV11 } from './limitsV11.js'
import { selectQl7SupportResponseModeV11 } from './personalityEngineV11.js'

function str(value) { return String(value ?? '').trim() }

function hasQl7SupportMaterialEntity(value) {
  if (value === null || value === undefined || value === false) return false
  if (value === true) return true
  if (Array.isArray(value)) return value.some((item) => hasQl7SupportMaterialEntity(item))
  if (typeof value === 'object') return Object.values(value).some((item) => hasQl7SupportMaterialEntity(item))
  return str(value) !== ''
}

const REPEAT_COPY = Object.freeze({
  en: 'I already have that information. Add only a new detail, or tell me what changed.',
  ru: 'Эта информация уже учтена. Добавьте только новую деталь или уточните, что изменилось.',
  uk: 'Цю інформацію вже враховано. Додайте лише нову деталь або уточніть, що змінилося.',
  es: 'Esa información ya está registrada. Añade solo un dato nuevo o indica qué cambió.',
  tr: 'Bu bilgi zaten kaydedildi. Yalnızca yeni bir ayrıntı ekleyin veya neyin değiştiğini belirtin.',
  ar: 'تم أخذ هذه المعلومة في الاعتبار. أضف تفصيلاً جديداً فقط أو وضّح ما الذي تغيّر.',
  zh: '这项信息已经记录。请只补充新的细节，或说明发生了什么变化。',
  he: 'המידע הזה כבר נרשם. הוסף רק פרט חדש או ציין מה השתנה.',
})

const NO_NEW_FACT_COPY = Object.freeze({
  en: ['Understood. I will not ask for that detail again. Add a different fact only if one is available.', 'That detail is not available. Tell me only what changed or provide another useful reference.'],
  ru: ['Понял. Повторно эту деталь спрашивать не буду. Добавьте другой факт, только если он есть.', 'Этой детали нет. Уточните только то, что изменилось, или пришлите другой полезный ориентир.'],
  uk: ['Зрозуміло. Повторно цю деталь не запитуватиму. Додайте інший факт, лише якщо він є.', 'Цієї деталі немає. Уточніть лише те, що змінилося, або надішліть інший корисний орієнтир.'],
  es: ['Entendido. No volveré a pedir ese dato. Añade otro hecho solo si está disponible.', 'Ese dato no está disponible. Indica únicamente qué cambió o aporta otra referencia útil.'],
  tr: ['Anladım. Bu ayrıntıyı tekrar sormayacağım. Yalnızca varsa başka bir bilgi ekleyin.', 'Bu ayrıntı mevcut değil. Sadece neyin değiştiğini veya başka bir yararlı referansı belirtin.'],
  ar: ['مفهوم. لن أطلب هذه المعلومة مرة أخرى. أضف معلومة مختلفة فقط إذا كانت متاحة.', 'هذه المعلومة غير متاحة. وضّح فقط ما الذي تغيّر أو أرسل مرجعاً مفيداً آخر.'],
  zh: ['明白。我不会再次询问这项信息。只有在有其他事实时再补充。', '这项信息无法提供。请只说明发生了什么变化，或提供其他有用的参考。'],
  he: ['הבנתי. לא אבקש את הפרט הזה שוב. הוסף עובדה אחרת רק אם היא זמינה.', 'הפרט הזה אינו זמין. ציין רק מה השתנה או ספק סימוכין שימושיים אחרים.'],
})

export function buildQl7SupportPremiumResponsePlan({
  analysis = {},
  route = {},
  memory = {},
  diagnosticResult = null,
  tone = {},
  conversationDecision = null,
  locale = 'en',
  seed = '',
  now = new Date().toISOString(),
} = {}) {
  const lang = normalizeQl7SupportLocale(locale)
  const topic = normalizeQl7SupportTopic(route.topic || analysis.topic || 'support_system')
  const messageAct = str(route.messageAct || analysis.messageAct || analysis.role || 'ambiguous_request')
  const decision = conversationDecision || analysis?.conversationDecision || {}
  const historyLength = Array.isArray(memory?.replyHistory) ? memory.replyHistory.length : 0
  const currentQuestionCode = str(analysis?.currentQuestionCode || memory?.currentQuestionCode)
  const questionsAsked = Array.isArray(memory?.questionsAsked) ? memory.questionsAsked.map(str) : []
  const entities = analysis?.entities && typeof analysis.entities === 'object' ? analysis.entities : {}
  const denialWithoutNewFact = messageAct === 'denial'
    && currentQuestionCode
    && questionsAsked.includes(currentQuestionCode)
    && !Object.values(entities).some((value) => hasQl7SupportMaterialEntity(value))
  const realized = denialWithoutNewFact ? {
    text: realizeQl7SemanticSurfaceV9({
      locale: lang,
      category: 'no_new_fact',
      topic,
      seed: `${seed}:no-new-fact:${historyLength}`,
      memory,
    }) || (NO_NEW_FACT_COPY[lang] || NO_NEW_FACT_COPY.en)[historyLength % 2],
    responseCode: `no_new_fact:${topic}`,
    nextState: 'waiting_user',
    cardSpec: null,
    clarification: null,
    userFacingAsOf: '',
  } : realizeQl7SupportReply({
    analysis: { ...analysis, topic },
    route: { ...route, topic, messageAct },
    memory,
    diagnosticResult,
    tone,
    conversationDecision: decision,
    locale: lang,
    seed: `${seed}:turn:${historyLength}`,
    now: now instanceof Date ? now : new Date(now),
  })

  const responseMode = selectQl7SupportResponseModeV11({ messageAct, topic, diagnosticResult, tone, hasCard: Boolean(realized.cardSpec), requestedDetail: ['how_to_question', 'why_question', 'roadmap_question'].includes(messageAct) })
  let text = applyQl7SupportAdultLanguagePolicy(realized.text, { maxLength: 4000 })
  let responseCode = str(realized.responseCode || `${topic}_${messageAct}`)
  if (isQl7SupportSemanticRepeat(memory, text, responseCode)) {
    text = realizeQl7SemanticSurfaceV9({
      locale: lang,
      category: 'repeat',
      topic,
      seed: `${seed}:repeat:${historyLength + 1}`,
      memory,
    }) || REPEAT_COPY[lang] || REPEAT_COPY.en
    responseCode = `material_update_required:${topic}`
  }

  const budgeted = enforceQl7SupportReplyBudgetV11(text, { mode: responseMode, locale: lang, hardMax: 4000 })
  text = budgeted.text

  return Object.freeze({
    text,
    responseMode,
    replyBudget: budgeted,
    responseCode,
    locale: lang,
    topic,
    messageAct,
    semanticFingerprint: semanticFingerprint(text),
    nextState: str(realized.nextState || (tone?.safetyEscalation ? 'waiting_admin' : 'idle')),
    domainPlan: route.domainPlan || analysis.domainPlan || null,
    conversationDecision: str(decision?.decision || 'continue_case'),
    cardSpec: realized.cardSpec || null,
    clarification: realized.clarification || null,
    userFacingAsOf: realized.userFacingAsOf || '',
  })
}
