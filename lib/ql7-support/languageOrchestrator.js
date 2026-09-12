import crypto from 'crypto'

export const QL7_SUPPORT_SUPPORTED_LOCALES = Object.freeze(['en','ru','uk','es','tr','ar','zh','he','de','fr','it','pt','pl','nl','sv','no','da','fi','cs','sk','hu','ro','bg','sr','hr','sl','el','ka','az','kk','ja','ko'])
export const QL7_SUPPORT_NATIVE_LOCALES = QL7_SUPPORT_SUPPORTED_LOCALES
export const QL7_SUPPORT_CANONICAL_LOCALE = 'en'

const SECRET_PATTERNS = Object.freeze([
  [/\b(seed\s+phrase|mnemonic|private\s+key)\s*[:=]\s*[^\n\r]+/gi, '$1: [secret-redacted]'],
  [/\bql7ws_[A-Za-z0-9_-]{12,}\b/g, '[wallet-session-redacted]'],
  [/\b(?:bearer\s+)?eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/gi, '[token-redacted]'],
  [/\b(?:0x)?[a-f0-9]{64}\b/gi, '[secret-redacted]'],
  [/\b(?:api[_-]?key|secret|password|passwd|token)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]'],
  [/\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}\b/g, '[credential-redacted]'],
])

function str(value) {
  return String(value ?? '').trim()
}

export function normalizeQl7SupportLanguage(value = '', fallback = 'en') {
  const clean = str(value).toLowerCase().split(/[-_]/)[0]
  if (!clean) return fallback
  if (clean === 'ua') return 'uk'
  if (clean === 'cn') return 'zh'
  return clean
}

export function redactQl7SupportTranslationInput(text = '') {
  let out = String(text ?? '')
  for (const [pattern, replacement] of SECRET_PATTERNS) out = out.replace(pattern, replacement)
  return out.slice(0, 12000)
}

function scriptScores(text = '') {
  const value = String(text ?? '')
  return {
    ar: (value.match(/[\u0600-\u06ff]/g) || []).length,
    he: (value.match(/[\u0590-\u05ff]/g) || []).length,
    zh: (value.match(/[\u3400-\u9fff]/g) || []).length,
    ja: (value.match(/[\u3040-\u30ff]/g) || []).length,
    ko: (value.match(/[\uac00-\ud7af]/g) || []).length,
    hi: (value.match(/[\u0900-\u097f]/g) || []).length,
    cyrillic: (value.match(/[\u0400-\u04ff]/g) || []).length,
    latin: (value.match(/[A-Za-zÀ-ÖØ-öø-ÿĞğİıŞşÇçÑñ]/g) || []).length,
  }
}

export function detectQl7SupportLanguage(text = '', selectedLocale = '') {
  const selected = normalizeQl7SupportLanguage(selectedLocale, '')
  const value = String(text ?? '')
  const lexical = value.toLowerCase().normalize('NFKC')
  if (/(?:^|[^\p{L}])(?:merhaba|teşekkür|lutfen|lütfen|nasil|nasıl)(?=$|[^\p{L}])/iu.test(lexical)) return 'tr'
  if (/(?:^|[^\p{L}])(?:hola|gracias|por\s+favor|cómo|como)(?=$|[^\p{L}])/iu.test(lexical)) return 'es'
  if (/(?:^|[^\p{L}])(?:שלום|בבקשה|תסביר|בדוק|הצג|עזור|עזרה|משקיע|שותפות|פיגוע|מערכת|מנוי|יתרה)(?=$|[^\p{L}])/iu.test(lexical)) return 'he'
  if (/(?:^|[^\p{L}])(?:bonjour|merci|pourquoi|comment|problème|montre|verifie|vérifie|explique|solde|abonnement|investisseur|partenariat|actualites|aide|attaque|accueil|achete|acheté|credite|crédité|paye|payé|vide|pirater|systeme|système|strategique|stratégique|truc|sais|mettre)(?=$|[^\p{L}])/iu.test(lexical)) return 'fr'
  if (/(?:^|[^\p{L}])(?:hallo|danke|warum|wie|wann|startet|ist|noch|aktiv|funktioniert|zeige|prufe|prüfe|erklaere|erkläre|guthaben|abo|werbung|partnerschaft|hilf|terroranschlag|hacke|kaufte|bezahlt|gutgeschrieben|leer|zerstore|zerstöre|zusammenarbeit|verwaltung|diesem|ding|weiss|weiß|hingehoert|hingehört)(?=$|[^\p{L}])/iu.test(lexical)) return 'de'
  if (/(?:^|[^\p{L}])(?:ciao|grazie|perché|come|problema)(?=$|[^\p{L}])/iu.test(lexical)) return 'it'
  if (/(?:^|[^\p{L}])(?:cześć|czesc|dziękuję|dziekuje|dlaczego|jak|problem|pokaz|pokaż|sprawdz|sprawdź|wyjasnij|wyjaśnij|saldo|abonament|reklam|pomoz|pomóż|inwestor|partnerstwa|atak|kupilem|kupiłem|dodano|zaplacony|zapłacony|puste|zhakuje|jestem|chce|strategiczna|wspolpraca|współpraca|administracja|rzecza)(?=$|[^\p{L}])/iu.test(lexical)) return 'pl'
  if (/(?:^|[^\p{L}])(?:olá|obrigad|porque|como|problema)(?=$|[^\p{L}])/iu.test(lexical)) return 'pt'
  if (/(?:^|[^\p{L}])(?:qanday|foydalanish|mumkin|birja|hisob|balans|korsat|ko['’‘]?rsat|tekshir|to['’‘]?lov|obuna|reklama|sovg['’‘]?a|yordam|holat|tushuntir|qayerga|hamkorlik|tizim\p{L}*|hujum|yangilik|muhim\p{L}*|ishlaydi|nima|qachon|boshlanadi|sotib|oldim|tushmadi|buzaman)(?=$|[^\p{L}])/iu.test(lexical)) return 'uz'
  const scores = scriptScores(value)
  if (scores.ja > 0) return 'ja'
  if (scores.ko > 0) return 'ko'
  if (scores.hi > 0) return 'hi'
  if (scores.ar > 0 && scores.ar >= Math.max(scores.he, scores.zh, scores.cyrillic, scores.latin)) return /[پچژگ]/u.test(value) ? 'fa' : 'ar'
  if (scores.he > 0 && scores.he >= Math.max(scores.ar, scores.zh, scores.cyrillic, scores.latin)) return 'he'
  if (scores.zh > 0 && scores.zh >= Math.max(scores.ar, scores.he, scores.cyrillic, scores.latin)) return 'zh'
  if (scores.cyrillic > 0) {
    if (/[іїєґІЇЄҐ]/u.test(value)) return 'uk'
    return selected === 'uk' ? 'uk' : 'ru'
  }
  if (scores.latin > 0) {
    if (/[ğüşöçıİĞÜŞÖÇ]/u.test(value)) return 'tr'
    if (/[¿¡ñáéíóúüÑÁÉÍÓÚÜ]/u.test(value)) return 'es'
    if (selected && QL7_SUPPORT_SUPPORTED_LOCALES.includes(selected)) return selected
    return 'en'
  }
  return selected || 'en'
}

function translationHash({ text, source, target, engine }) {
  return crypto.createHash('sha256')
    .update([source, target, engine, text].join('\u0000'))
    .digest('hex')
    .slice(0, 24)
}

function sourceScriptKey(language = '') {
  const normalized = normalizeQl7SupportLanguage(language, '')
  if (['ru', 'uk', 'bg', 'sr', 'mk'].includes(normalized)) return 'cyrillic'
  if (normalized === 'he') return 'he'
  if (['ar', 'fa', 'ur'].includes(normalized)) return 'ar'
  if (normalized === 'zh') return 'zh'
  if (normalized === 'ja') return 'ja'
  if (normalized === 'ko') return 'ko'
  if (normalized === 'hi') return 'hi'
  return ''
}

function nativeOutputMatchesTarget({ originalText = '', translatedText = '', sourceLanguage = '', targetLanguage = '' } = {}) {
  const source = normalizeQl7SupportLanguage(sourceLanguage, '')
  const target = normalizeQl7SupportLanguage(targetLanguage, '')
  if (!source || !target || source === target) return true
  const inputScores = scriptScores(originalText)
  const outputScores = scriptScores(translatedText)
  const sourceKey = sourceScriptKey(source)
  const targetKey = sourceScriptKey(target) || (['en', 'es', 'tr', 'fr', 'de', 'it', 'pl', 'pt'].includes(target) ? 'latin' : '')
  const inputSourceCount = sourceKey ? Number(inputScores[sourceKey] || 0) : 0
  const outputSourceCount = sourceKey ? Number(outputScores[sourceKey] || 0) : 0
  const outputTargetCount = targetKey ? Number(outputScores[targetKey] || 0) : 0

  // Reject decorated echoes such as "[he] original text" and provider responses
  // that remain predominantly in the source script.
  if (inputSourceCount >= 3 && outputSourceCount >= 3 && outputSourceCount > outputTargetCount) return false

  // For script-specific targets, require visible target-script evidence. This is
  // especially important for Hebrew/Arabic/CJK replies where an English fallback
  // must never be labelled as a successful localization.
  if (targetKey && targetKey !== 'latin') {
    const meaningfulLetters = Object.values(outputScores).reduce((sum, value) => sum + Number(value || 0), 0)
    if (meaningfulLetters >= 3 && outputTargetCount < 2) return false
  }

  // English and other Latin targets must not be a Cyrillic/RTL/CJK echo when the
  // input contains enough source-script characters.
  if (targetKey === 'latin' && inputSourceCount >= 3 && outputTargetCount < 2 && outputSourceCount >= 3) return false
  return true
}

function normalizeNativeTranslationResult(result, originalText = '', { sourceLanguage = '', targetLanguage = '' } = {}) {
  const value = result && typeof result === 'object' ? result : {}
  const text = str(value.text)
  const engine = str(value.engine)
  const engineWarning = str(value.warning)
  const targetValid = nativeOutputMatchesTarget({
    originalText,
    translatedText: text,
    sourceLanguage,
    targetLanguage,
  })
  return {
    ok: !!text && text !== str(originalText) && value.translationSucceeded === true && targetValid,
    text: text || str(originalText),
    engine: engine || 'ql7-native',
    warning: targetValid ? engineWarning : (engineWarning || 'native_output_language_mismatch'),
  }
}

export async function prepareQl7SupportLanguageInput({
  text = '',
  selectedLocale = '',
  translate = null,
} = {}) {
  const originalText = String(text ?? '')
  const redactedText = redactQl7SupportTranslationInput(originalText)
  const detectedLanguage = detectQl7SupportLanguage(redactedText, selectedLocale)
  const nativeLanguage = QL7_SUPPORT_SUPPORTED_LOCALES.includes(detectedLanguage)
  const translationRequired = !nativeLanguage
  if (!translationRequired || typeof translate !== 'function' || !QL7_SUPPORT_SUPPORTED_LOCALES.includes(detectedLanguage)) {
    return {
      originalText,
      redactedText,
      canonicalText: redactedText,
      detectedLanguage,
      canonicalLanguage: translationRequired ? detectedLanguage : detectedLanguage,
      translationRequired,
      translationStatus: translationRequired ? 'unsupported_locale' : 'native',
      translationEngine: translationRequired ? 'none' : 'native',
      translationEvidenceHash: '',
    }
  }

  const result = normalizeNativeTranslationResult(await translate({
    text: redactedText,
    sourceLang: detectedLanguage || 'auto',
    targetLang: QL7_SUPPORT_CANONICAL_LOCALE,
    purpose: 'ql7_support_canonicalization',
  }), redactedText, {
    sourceLanguage: detectedLanguage,
    targetLanguage: QL7_SUPPORT_CANONICAL_LOCALE,
  })
  return {
    originalText,
    redactedText,
    canonicalText: result.ok ? result.text : redactedText,
    detectedLanguage,
    canonicalLanguage: result.ok ? QL7_SUPPORT_CANONICAL_LOCALE : detectedLanguage,
    translationRequired,
    translationStatus: result.ok ? 'native_translated' : 'native_unavailable',
    translationEngine: result.engine,
    translationWarning: result.warning,
    translationEvidenceHash: result.ok
      ? translationHash({ text: result.text, source: detectedLanguage, target: 'en', provider: result.engine })
      : '',
  }
}

export async function localizeQl7SupportReply({
  text = '',
  sourceLanguage = 'en',
  targetLanguage = '',
  translate = null,
} = {}) {
  const sourceText = redactQl7SupportTranslationInput(text)
  const target = normalizeQl7SupportLanguage(targetLanguage, 'en')
  const source = normalizeQl7SupportLanguage(sourceLanguage, 'en')
  if (!sourceText || source === target) return { text: sourceText, sourceLanguage: source, targetLanguage: target, translationStatus: source===target?'same_language':'native', translationEngine:'native', translationEvidenceHash:'' }
  if (!QL7_SUPPORT_SUPPORTED_LOCALES.includes(target) || typeof translate !== 'function') return { text: sourceText, sourceLanguage: source, targetLanguage: target, translationStatus:'native_unavailable', translationEngine:'ql7-native', translationEvidenceHash:'' }
  const result = normalizeNativeTranslationResult(await translate({
    text: sourceText,
    sourceLang: source,
    targetLang: target,
    purpose: 'ql7_support_reply_localization',
  }), sourceText, {
    sourceLanguage: source,
    targetLanguage: target,
  })
  return {
    text: result.ok ? result.text : sourceText,
    targetLanguage: target,
    translationStatus: result.ok ? 'native_translated' : 'native_unavailable',
    translationEngine: result.engine,
    translationWarning: result.warning,
    translationEvidenceHash: result.ok
      ? translationHash({ text: result.text, source: 'en', target, provider: result.engine })
      : '',
  }
}
