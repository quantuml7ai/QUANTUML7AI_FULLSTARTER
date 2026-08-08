import { QL7_SUPPORT_PROFANITY_BANK_BY_LOCALE } from './language/semanticBanks.js'

const LANGUAGE_LEXICONS = Object.freeze({
  ...QL7_SUPPORT_PROFANITY_BANK_BY_LOCALE,
  kn: Object.freeze(['ಮೂರ್ಖ', 'ಕೆಟ್ಟ', 'ನಿಂದನೆ']),
})

const THREAT_PATTERNS = Object.freeze([
  /(?:убью|убити|зарежу|взорву|сожгу|теракт|бомб(?:а|у|ой|ить)|kill\s+(?:you|him|her|them)|terror(?:ist)?\s+attack|bomb(?:ing)?|blow\s+up|matarte|bomba|atentado|seni\s+öldür|bomba|terör\s+saldırısı|سأقتلك|سوف\s+أقتلك|سأفجر|تفجير|قنبلة|إرهاب|عملية\s+إرهابية|هجوماً?\s+إرهابياً?|هجوما?\s+إرهابيا?|ارتكب.{0,32}إرهاب|杀了你|炸掉|炸弹|恐怖袭击|אהרוג\s+אותך|פיגוע|פצצה)/iu,
  /(?:найду\s+тебя|знайду\s+тебе|i\s+will\s+find\s+you|te\s+encontraré|seni\s+bulacağım|سأجدك|我会找到你|אמצא\s+אותך)/iu,
  /(?:кибер\s*атак|cyber\s*attack|ddos|d\s*dos|ддос|взлома(?:ю|ть)|хакну\s+(?:вас|тебя|систем)|вам\s+пизд|тебе\s+пизд|hack\s+(?:you|your|the\s+system)|i\s+will\s+hack|ich\s+hacke|ich\s+werde\s+(?:dich|euch|das\s+system)\s+hacken|terroranschlag|bombe|breach\s+(?:your|the)\s+system)/iu,
  /(?:я\s+(?:убил|убила|зарезал|зарезала)|i\s+(?:killed|stabbed)|he\s+matado|öldürdüm|قتلت|我杀了|הרגתי)/iu,
])
const HARASSMENT = /(?:преслед|сталк|каждый\s+день\s+пиш|doxx|stalk|harass|acoso|taciz|مضايق|تحرش|骚扰|מטריד|הטרד)/iu
const SEXUAL_HARASSMENT = /(?:домога|сексуальн.{0,8}(?:давлен|сообщ)|sexual\s+harass|nude\s+pic|send\s+nudes|acoso\s+sexual|cinsel\s+taciz|تحرش\s+جنسي|性骚扰|הטרדה\s+מינית)/iu
const HATE = /(?:уничтожить\s+всех|ненавижу\s+всех|inferior\s+race|kill\s+all|odio\s+a\s+todos|ırk|كراهية|种族|להרוג\s+את\s+כולם)/iu
const HELP = /(?:помог|помож|помоч|help|fix|исправ|почин|реши|не\s+работает|не\s+працює|cómo|ayuda|yardım|çalışmıyor|hilf|helfen|funktioniert\s+nicht|ساعد|لا\s+يعمل|帮助|坏了|修复|תעזור|עזרה|לא\s+עובד|תקן)/iu
const SUPPORT_DIRECTED = /(?:^|[^\p{L}\p{N}_])(?:ты|тебя|тебе|вас|вам|support|саппорт|оператор|you|your|tu|usted|du|dich|dir|ihr|euch|sen|siz|أنت|انتم|你|你们|אתה|את|אתם|תמיכה)(?=$|[^\p{L}\p{N}_])/iu
const OTHER_USER = /(?:пользователь|юзер|автор|он|она|user|member|author|él|ella|kullanıcı|مستخدم|用户|משתמש|מחבר)/iu
const SYSTEM_TARGET = /(?:сайт|система|приложение|функция|кнопка|сервер|service|system|app|website|feature|button|server|sistema|system|seite|server|anwendung|uygulama|النظام|التطبيق|系统|应用|מערכת|אפליקציה)/iu
const QUOTE_MARKER = /(?:^|\s)(?:цитат|quote|quoted|он\s+написал|она\s+написала|said:|wrote:|dijo:|dedi:|قال:|写道[:：]|כתב[:：]|[>“"«]).{0,220}/iu
const SELF_REFERENCE = /(?:сам\s+себя|про\s+себя|я\s+(?:идиот|тупой)|i(?:'m|\s+am)\s+(?:an?\s+)?(?:idiot|stupid)|soy\s+(?:idiota|tonto)|ben\s+aptalım|أنا\s+غبي|我是傻瓜|אני\s+(?:טיפש|מטומטם))/iu
const JOKE = /(?:шутк|сарказм|лол|ахах|joke|kidding|lol|broma|şaka|مزح|开玩笑|צוחק|בדיחה)/iu
const SPAM_CHARS = /(.)\1{7,}/iu
const DIRECT_DISMISSAL = /(?:иди|пош[её]л|пошла)\s+(?:ты\s+)?нахуй|fuck\s+off|go\s+to\s+hell|verpiss\s+dich|fick\s+dich|vete\s+a\s+la\s+mierda|siktir\s+git|اذهب\s+إلى\s+الجحيم|滚开|לך\s+לעזאזל/iu

function str(value) { return String(value ?? '').trim() }
function normalize(value) {
  return str(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[0@]/g, (char) => (char === '0' ? 'о' : 'а'))
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'е')
    .replace(/[4]/g, 'ч')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 'т')
    .replace(/[._*\-]{1,3}/g, '')
    .replace(/(.)\1{3,}/gu, '$1$1')
}
function unique(values = []) { return Array.from(new Set(values.filter(Boolean))) }

const LEXICON_INDEX_CACHE = new WeakMap()

function pushIndexValue(map, key = '', value) {
  if (!key) return
  if (!map.has(key)) map.set(key, [])
  map.get(key).push(value)
}

function buildLexiconIndex(words = []) {
  const tokenMap = new Map()
  const phraseByToken = new Map()
  for (const word of words) {
    const normalizedWord = normalize(word)
    if (!normalizedWord) continue
    if (normalizedWord.includes(' ')) {
      const probe = normalizedWord.split(/[^\p{L}\p{N}]+/u).find((token) => token.length >= 2)
      pushIndexValue(phraseByToken, probe, Object.freeze({ word, needle: normalizedWord }))
    } else {
      pushIndexValue(tokenMap, normalizedWord, word)
    }
  }
  return Object.freeze({ tokenMap, phraseByToken })
}

function lexiconIndex(words = []) {
  if (!LEXICON_INDEX_CACHE.has(words)) LEXICON_INDEX_CACHE.set(words, buildLexiconIndex(words))
  return LEXICON_INDEX_CACHE.get(words)
}

function findIndexedLexiconHits(normalizedSource = '', tokenSet, words = []) {
  const index = lexiconIndex(words)
  const hits = []
  const seen = new Set()
  for (const token of tokenSet) {
    const tokenHits = index.tokenMap.get(token)
    if (tokenHits) {
      for (const word of tokenHits) {
        if (!seen.has(word)) {
          seen.add(word)
          hits.push(word)
        }
      }
    }
    const phraseRows = index.phraseByToken.get(token)
    if (phraseRows) {
      for (const row of phraseRows) {
        if (normalizedSource.includes(row.needle) && !seen.has(row.word)) {
          seen.add(row.word)
          hits.push(row.word)
        }
      }
    }
  }
  return hits
}

function findLexiconHits(source, language) {
  const normalized = normalize(source)
  const tokenSet = new Set(normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean))
  const languageLexicon = language && LANGUAGE_LEXICONS[language] ? LANGUAGE_LEXICONS[language] : []
  const lexicons = languageLexicon.length
    ? [
      languageLexicon,
      LANGUAGE_LEXICONS.en,
      ...Object.entries(LANGUAGE_LEXICONS)
        .filter(([, words]) => words !== languageLexicon && words !== LANGUAGE_LEXICONS.en)
        .map(([, words]) => words),
    ]
    : Object.values(LANGUAGE_LEXICONS)
  return unique(lexicons.flatMap((words) => findIndexedLexiconHits(normalized, tokenSet, words)))
}

function severityFor(category, profanityCount) {
  if (['threat', 'hate', 'sexual_harassment'].includes(category)) return 'critical'
  if (category === 'harassment') return 'high'
  if (['insult_to_user', 'insult_to_support'].includes(category)) return profanityCount > 2 ? 'medium' : 'low'
  if (category === 'frustration_at_system') return 'low'
  if (category === 'spam_noise') return 'low'
  return 'none'
}

export function assessQl7SupportTone({ text = '', language = '', translatedText = '', canonicalText = '' } = {}) {
  const source = str(text)
  const translated = str(translatedText || canonicalText)
  const canonical = [source, translated].filter(Boolean).join('\n')
  const hits = findLexiconHits(canonical, language)
  const threat = THREAT_PATTERNS.some((pattern) => pattern.test(canonical))
  const harassment = HARASSMENT.test(canonical)
  const sexualHarassment = SEXUAL_HARASSMENT.test(canonical)
  const hate = HATE.test(canonical)
  const asksForHelp = HELP.test(canonical)
  const directedAtSupport = SUPPORT_DIRECTED.test(canonical) || DIRECT_DISMISSAL.test(canonical)
  const directedAtUser = OTHER_USER.test(canonical)
  const directedAtSystem = SYSTEM_TARGET.test(canonical)
  const quotedContent = QUOTE_MARKER.test(canonical)
  const jokeOrSelfReference = JOKE.test(canonical) || SELF_REFERENCE.test(canonical)
  const words = normalize(source).split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  const repeatedWordNoise = words.length >= 6 && new Set(words.slice(-6)).size === 1
  const spamNoise = SPAM_CHARS.test(canonical) || repeatedWordNoise || (source.length > 40 && new Set(source.replace(/\s/g, '')).size <= 3)
  const profanityDetected = hits.length > 0 || DIRECT_DISMISSAL.test(canonical)

  let taxonomyCategory = 'neutral'
  if (quotedContent && (profanityDetected || threat || harassment || hate)) taxonomyCategory = 'quoted_content'
  else if (jokeOrSelfReference && profanityDetected && !threat) taxonomyCategory = 'joke_or_self_reference'
  else if (threat) taxonomyCategory = 'threat'
  else if (sexualHarassment) taxonomyCategory = 'sexual_harassment'
  else if (hate) taxonomyCategory = 'hate'
  else if (harassment) taxonomyCategory = 'harassment'
  else if (spamNoise) taxonomyCategory = 'spam_noise'
  else if (profanityDetected && asksForHelp && !directedAtSupport) taxonomyCategory = 'frustration_at_system'
  else if (profanityDetected && directedAtSupport) taxonomyCategory = 'insult_to_support'
  else if (profanityDetected && directedAtUser) taxonomyCategory = 'insult_to_user'
  else if (profanityDetected && (directedAtSystem || asksForHelp)) taxonomyCategory = 'frustration_at_system'
  else if (profanityDetected) taxonomyCategory = 'profanity_context_unknown'

  const category = taxonomyCategory === 'frustration_at_system' ? 'frustration_with_request' : taxonomyCategory
  const safetyEscalation = ['threat', 'harassment', 'sexual_harassment', 'hate'].includes(taxonomyCategory)
  const moderationSuggested = ['insult_to_user', 'harassment', 'sexual_harassment', 'hate', 'threat'].includes(taxonomyCategory)
  const target = directedAtSupport ? 'support' : (directedAtUser ? 'other_user' : (directedAtSystem ? 'system' : 'unknown'))
  const severity = severityFor(taxonomyCategory, hits.length)

  return {
    category,
    taxonomyCategory,
    severity,
    target,
    profanityDetected,
    profanityCount: hits.length,
    profanityHits: hits.slice(0, 12),
    threat,
    harassment,
    sexualHarassment,
    hate,
    quotedContent,
    jokeOrSelfReference,
    spamNoise,
    directedAtSupport,
    directedAtUser,
    directedAtSystem,
    asksForHelp,
    continueAssistance: !['threat', 'hate'].includes(taxonomyCategory),
    safetyEscalation,
    moderationSuggested,
    emailMaterial: safetyEscalation,
    responsePolicy: taxonomyCategory === 'frustration_at_system'
      ? 'acknowledge_frustration_then_one_diagnostic_step'
      : taxonomyCategory === 'insult_to_support'
        ? (asksForHelp ? 'calm_boundary_then_continue_assistance' : 'calm_boundary_then_invite_concrete_request')
        : safetyEscalation
          ? 'safe_audit_and_human_escalation'
          : taxonomyCategory === 'spam_noise'
            ? 'single_soft_warning_no_email_flood'
            : taxonomyCategory === 'quoted_content'
              ? 'treat_as_evidence_not_user_intent'
              : 'normal_assistance',
  }
}

export function listQl7SupportToxicityCategories() {
  return Object.freeze([
    'neutral',
    'frustration_at_system',
    'insult_to_support',
    'insult_to_user',
    'harassment',
    'hate',
    'threat',
    'sexual_harassment',
    'quoted_content',
    'joke_or_self_reference',
    'spam_noise',
    'profanity_context_unknown',
  ])
}
