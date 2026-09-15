import {QL7_SUPPORT_ALL_LOCALES} from '../../config/behaviorManifest.js'
import {getQl7SupportCanonicalDomain, QL7_SUPPORT_DOMAIN_TOPICS} from '../../knowledge/domainRegistry.js'
import {ql7Arr, ql7NormalizeSpaces, ql7StableHash, ql7Str} from '../../internal/text.js'
import {mutateQl7SupportText} from '../mutationEngine.js'

export const QL7_SUPPORT_KNOWLEDGE_32_SCHEMA_VERSION = '15.1.0'
export const QL7_SUPPORT_KNOWLEDGE_32_LOCALES = Object.freeze([...QL7_SUPPORT_ALL_LOCALES])
export const QL7_SUPPORT_KNOWLEDGE_32_TOPICS = Object.freeze([...new Set(QL7_SUPPORT_DOMAIN_TOPICS)])
export const QL7_SUPPORT_KNOWLEDGE_32_BASE_PARAPHRASE_COUNT = 50
export const QL7_SUPPORT_KNOWLEDGE_32_REQUIRED_MUTATION_FAMILIES = Object.freeze([
  'clean',
  'typo',
  'joined',
  'spacing',
  'zero_width',
  'confusable',
  'keyboard_layout',
  'translit',
])

const AXES = Object.freeze({
  en: Object.freeze({
    openers: Object.freeze([
      'What is {label} in Quantum L7 AI?',
      'Explain {label} in practical terms.',
      'Help me understand {label}.',
      'Give me a user-ready overview of {label}.',
      'Walk me through {label}.',
    ]),
    focus: Object.freeze([
      'Include purpose and current user steps.',
      'Cover safe usage, account context and limits.',
      'Show what is verified now and what should not be assumed.',
      'Separate available behavior from planned or unknown items.',
      'Tell me when to use it and what evidence matters.',
    ]),
    boundary: Object.freeze([
      'Do not invent data beyond the registry.',
      'Keep the answer grounded in verified product facts.',
    ]),
  }),
  ru: Object.freeze({
    openers: Object.freeze([
      'Что такое {label} в Quantum L7 AI?',
      'Объясни {label} простыми практическими словами.',
      'Помоги понять {label}.',
      'Дай пользовательский обзор {label}.',
      'Проведи меня по {label}.',
    ]),
    focus: Object.freeze([
      'Укажи назначение и текущие шаги пользователя.',
      'Покажи безопасное использование, контекст аккаунта и ограничения.',
      'Отдели подтвержденное состояние от предположений.',
      'Раздели уже работающее поведение, планы и неизвестные части.',
      'Объясни, когда это использовать и какие доказательства важны.',
    ]),
    boundary: Object.freeze([
      'Не выдумывай данные вне реестра продукта.',
      'Держи ответ только на проверенных продуктовых фактах.',
    ]),
  }),
  uk: Object.freeze({
    openers: Object.freeze([
      'Що таке {label} у Quantum L7 AI?',
      'Поясни {label} практичною мовою.',
      'Допоможи зрозуміти {label}.',
      'Дай користувацький огляд {label}.',
      'Проведи мене через {label}.',
    ]),
    focus: Object.freeze([
      'Додай призначення і поточні кроки користувача.',
      'Покажи безпечне використання, контекст акаунта й обмеження.',
      'Відокрем підтверджений стан від припущень.',
      'Розділи вже доступну поведінку, плани й невідомі частини.',
      'Поясни, коли це використовувати і які докази важливі.',
    ]),
    boundary: Object.freeze([
      'Не вигадуй дані поза реєстром продукту.',
      'Тримай відповідь на перевірених продуктових фактах.',
    ]),
  }),
  es: Object.freeze({
    openers: Object.freeze([
      '¿Qué es {label} dentro de Quantum L7 AI?',
      'Explica {label} de forma práctica.',
      'Ayúdame a entender {label}.',
      'Dame una visión útil de {label}.',
      'Guíame por {label}.',
    ]),
    focus: Object.freeze([
      'Incluye propósito y pasos actuales del usuario.',
      'Cubre uso seguro, contexto de cuenta y límites.',
      'Separa lo verificado de lo que no debe asumirse.',
      'Distingue funciones activas, planes y puntos desconocidos.',
      'Explica cuándo usarlo y qué evidencia importa.',
    ]),
    boundary: Object.freeze([
      'No inventes datos fuera del registro del producto.',
      'Mantén la respuesta basada en hechos verificados.',
    ]),
  }),
  tr: Object.freeze({
    openers: Object.freeze([
      'Quantum L7 AI içinde {label} nedir?',
      '{label} konusunu pratik şekilde açıkla.',
      '{label} konusunu anlamama yardım et.',
      '{label} için kullanıcıya hazır bir özet ver.',
      'Beni {label} boyunca adım adım yönlendir.',
    ]),
    focus: Object.freeze([
      'Amaç ve mevcut kullanıcı adımlarını ekle.',
      'Güvenli kullanım, hesap bağlamı ve sınırları anlat.',
      'Doğrulanmış durum ile varsayımı ayır.',
      'Yayındaki davranışı, planları ve bilinmeyenleri ayır.',
      'Ne zaman kullanılacağını ve hangi kanıtın önemli olduğunu açıkla.',
    ]),
    boundary: Object.freeze([
      'Ürün kaydı dışında veri uydurma.',
      'Yanıtı doğrulanmış ürün gerçeklerine dayandır.',
    ]),
  }),
  ar: Object.freeze({
    openers: Object.freeze([
      'ما هو {label} داخل Quantum L7 AI؟',
      'اشرح {label} بشكل عملي.',
      'ساعدني على فهم {label}.',
      'أعطني نظرة مفيدة عن {label}.',
      'أرشدني خلال {label}.',
    ]),
    focus: Object.freeze([
      'اذكر الغرض والخطوات الحالية للمستخدم.',
      'اشرح الاستخدام الآمن وسياق الحساب والحدود.',
      'افصل بين المؤكد وما لا يجب افتراضه.',
      'ميّز بين السلوك المتاح والخطط وما هو غير معروف.',
      'وضح متى أستخدمه وما الدليل المهم.',
    ]),
    boundary: Object.freeze([
      'لا تخترع بيانات خارج سجل المنتج.',
      'اجعل الإجابة مبنية على حقائق منتج موثقة.',
    ]),
  }),
  zh: Object.freeze({
    openers: Object.freeze([
      'Quantum L7 AI 中的 {label} 是什么？',
      '用实用方式解释 {label}。',
      '帮我理解 {label}。',
      '给我一个面向用户的 {label} 概览。',
      '带我了解 {label} 的使用流程。',
    ]),
    focus: Object.freeze([
      '包含用途和当前用户步骤。',
      '说明安全用法、账户上下文和限制。',
      '区分已验证状态和不应假设的内容。',
      '分清已上线行为、计划内容和未知部分。',
      '说明何时使用以及哪些证据重要。',
    ]),
    boundary: Object.freeze([
      '不要编造产品注册表之外的数据。',
      '回答只基于已验证的产品事实。',
    ]),
  }),
  he: Object.freeze({
    openers: Object.freeze([
      'מהו {label} בתוך Quantum L7 AI?',
      'הסבר את {label} בצורה מעשית.',
      'עזור לי להבין את {label}.',
      'תן סקירה מוכנה למשתמש על {label}.',
      'העבר אותי דרך {label}.',
    ]),
    focus: Object.freeze([
      'כלול מטרה ושלבי משתמש נוכחיים.',
      'כסה שימוש בטוח, הקשר חשבון ומגבלות.',
      'הפרד בין מאומת לבין מה שלא צריך להניח.',
      'הבדל בין התנהגות קיימת, תוכניות וחלקים לא ידועים.',
      'הסבר מתי להשתמש בזה ואילו ראיות חשובות.',
    ]),
    boundary: Object.freeze([
      'אל תמציא נתונים מחוץ לרישום המוצר.',
      'בסס את התשובה רק על עובדות מוצר מאומתות.',
    ]),
  }),
})

function axesFor(locale = 'en') {
  return AXES[locale] || AXES.en
}

function fill(value = '', vars = {}) {
  return ql7NormalizeSpaces(ql7Str(value).replace(/\{(\w+)\}/g, (_, key) => ql7Str(vars[key])))
}

function anchorFor(locale = 'en', label = '', topic = '') {
  const cleanLabel = ql7Str(label || topic)
  const native = {
    en: `About ${cleanLabel}:`,
    ru: `Про ${cleanLabel}:`,
    uk: `Про ${cleanLabel}:`,
    es: `Sobre ${cleanLabel}:`,
    tr: `${cleanLabel} hakkında:`,
    ar: `حول ${cleanLabel}:`,
    zh: `关于 ${cleanLabel}:`,
    he: `על ${cleanLabel}:`,
  }
  return native[locale] || `About ${cleanLabel}:`
}

function pickBasePrompt({ topic = 'support_system', locale = 'en', paraphraseIndex = 0 } = {}) {
  const domain = getQl7SupportCanonicalDomain(topic, locale)
  const axes = axesFor(locale)
  const index = Math.max(0, Number(paraphraseIndex) || 0) % QL7_SUPPORT_KNOWLEDGE_32_BASE_PARAPHRASE_COUNT
  const opener = axes.openers[index % axes.openers.length]
  const focus = axes.focus[Math.floor(index / axes.openers.length) % axes.focus.length]
  const boundary = axes.boundary[Math.floor(index / (axes.openers.length * axes.focus.length)) % axes.boundary.length]
  return fill(`${opener} ${focus} ${boundary}`, {
    label: domain.label || topic,
    scope: domain.scope || '',
  })
}

function hashInt(value = '') {
  return Number.parseInt(ql7StableHash(value).slice(0, 8), 16) >>> 0
}

export function buildQl7SupportKnowledge32Prompt({
  topic = 'support_system',
  locale = 'en',
  paraphraseIndex = 0,
  mutationFamily = 'clean',
  seed = '',
} = {}) {
  const domain = getQl7SupportCanonicalDomain(topic, locale)
  const baseText = pickBasePrompt({ topic, locale, paraphraseIndex })
  const mutation = mutateQl7SupportText(baseText, mutationFamily, { locale, seed })
  const input = ql7NormalizeSpaces(`${anchorFor(locale, domain.label, topic)} ${mutation.mutatedText}`)
  return Object.freeze({
    version: QL7_SUPPORT_KNOWLEDGE_32_SCHEMA_VERSION,
    topic,
    locale,
    paraphraseIndex: Math.max(0, Number(paraphraseIndex) || 0) % QL7_SUPPORT_KNOWLEDGE_32_BASE_PARAPHRASE_COUNT,
    mutationFamily,
    baseText,
    input,
    mutation,
    promptHash: ql7StableHash(`${topic}:${locale}:${paraphraseIndex}:${mutationFamily}:${input}`),
  })
}

export function buildQl7SupportKnowledge32ScenarioSeed(index = 0, { locale = '', seed = 'ql7-knowledge32' } = {}) {
  const safeIndex = Math.max(0, Number(index) || 0)
  const topic = QL7_SUPPORT_KNOWLEDGE_32_TOPICS[safeIndex % QL7_SUPPORT_KNOWLEDGE_32_TOPICS.length]
  const selectedLocale = locale || QL7_SUPPORT_KNOWLEDGE_32_LOCALES[Math.floor(safeIndex / QL7_SUPPORT_KNOWLEDGE_32_TOPICS.length) % QL7_SUPPORT_KNOWLEDGE_32_LOCALES.length]
  const paraphraseIndex = hashInt(`${seed}:paraphrase:${safeIndex}`) % QL7_SUPPORT_KNOWLEDGE_32_BASE_PARAPHRASE_COUNT
  const mutationFamily = QL7_SUPPORT_KNOWLEDGE_32_REQUIRED_MUTATION_FAMILIES[hashInt(`${seed}:mutation:${safeIndex}`) % QL7_SUPPORT_KNOWLEDGE_32_REQUIRED_MUTATION_FAMILIES.length]
  return buildQl7SupportKnowledge32Prompt({
    topic,
    locale: selectedLocale,
    paraphraseIndex,
    mutationFamily,
    seed: `${seed}:${safeIndex}:${topic}:${selectedLocale}`,
  })
}

export function getQl7SupportKnowledge32Coverage() {
  const pairRows = []
  let minBaseParaphrases = Infinity
  let duplicatePairs = 0
  for (const topic of QL7_SUPPORT_KNOWLEDGE_32_TOPICS) {
    for (const locale of QL7_SUPPORT_KNOWLEDGE_32_LOCALES) {
      const prompts = new Set()
      for (let index = 0; index < QL7_SUPPORT_KNOWLEDGE_32_BASE_PARAPHRASE_COUNT; index += 1) {
        prompts.add(pickBasePrompt({ topic, locale, paraphraseIndex: index }).toLowerCase())
      }
      minBaseParaphrases = Math.min(minBaseParaphrases, prompts.size)
      if (prompts.size < QL7_SUPPORT_KNOWLEDGE_32_BASE_PARAPHRASE_COUNT) duplicatePairs += 1
      pairRows.push(Object.freeze({ topic, locale, baseParaphrases: prompts.size }))
    }
  }
  const scenarioFloor = QL7_SUPPORT_KNOWLEDGE_32_TOPICS.length *
    QL7_SUPPORT_KNOWLEDGE_32_LOCALES.length *
    QL7_SUPPORT_KNOWLEDGE_32_BASE_PARAPHRASE_COUNT *
    QL7_SUPPORT_KNOWLEDGE_32_REQUIRED_MUTATION_FAMILIES.length
  return Object.freeze({
    version: QL7_SUPPORT_KNOWLEDGE_32_SCHEMA_VERSION,
    domainCount: QL7_SUPPORT_KNOWLEDGE_32_TOPICS.length,
    localeCount: QL7_SUPPORT_KNOWLEDGE_32_LOCALES.length,
    pairCount: pairRows.length,
    baseParaphrasesPerDomainLocale: QL7_SUPPORT_KNOWLEDGE_32_BASE_PARAPHRASE_COUNT,
    mutationFamiliesPerBase: QL7_SUPPORT_KNOWLEDGE_32_REQUIRED_MUTATION_FAMILIES.length,
    scenarioFloor,
    minBaseParaphrases,
    duplicatePairs,
    ok: QL7_SUPPORT_KNOWLEDGE_32_TOPICS.length >= 46 &&
      QL7_SUPPORT_KNOWLEDGE_32_LOCALES.length === 32 &&
      minBaseParaphrases >= QL7_SUPPORT_KNOWLEDGE_32_BASE_PARAPHRASE_COUNT &&
      QL7_SUPPORT_KNOWLEDGE_32_REQUIRED_MUTATION_FAMILIES.length >= 8 &&
      scenarioFloor >= 46 * 32 * 50 * 8 &&
      duplicatePairs === 0,
    sampleRows: Object.freeze(pairRows.slice(0, 12)),
  })
}
