import {fitQl7SupportReply, QL7_SUPPORT_REPLY_MAX_GRAPHEMES} from './limits.js'

const CORE_LOCALES = Object.freeze(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'])
const NORMALIZED_LOCALES = Object.freeze([...CORE_LOCALES, 'kk'])

const INTERNAL_MECHANICS = Object.freeze([
  /\bread[-\s]?only\b/iu,
  /\bbounded(?:\s+diagnostic)?\b/iu,
  /\ballowed\s+(?:source|data|collection)s?\b/iu,
  /\bverified\s+actor\b/iu,
  /\bsource\s+adapter\b/iu,
  /\bcollection(?:s)?\b/iu,
  /\bcorrelation(?:id)?\b/iu,
  /\bprivacy\s+boundary\b/iu,
  /\bsecret\s+redaction\b/iu,
  /\bgod[-\s]?mode\b/iu,
  /\bcase\s+engine\b/iu,
  /\bruntime\s+stage\b/iu,
  /\bprovider[_\s-](?:failed|unavailable)\b/iu,
  /\b(?:я|мы)\s+(?:отделил(?:и)?|выделил(?:и)?)\s+(?:кейс|линию|тему)\b/iu,
  /\b(?:я|мы)\s+взял(?:и)?\s+линию\b/iu,
  /\b(?:только\s+для\s+чтения|разреш[её]нн(?:ые|ых)\s+(?:источник|данн|коллекц)|подтвержд[её]нн(?:ый|ого)\s+актор)\b/iu,
  /(?:للقراءة\s+فقط|只读|只讀|קריאה\s+בלבד)/u,
])

const RAW_MACHINE_VALUE = Object.freeze([
  /\b(?:healthy|inconsistent|mongo_unavailable|native_dependency_unavailable|no_source|source_present|foreign_account|timeout)\b/u,
  /\b[a-z][a-z0-9]+(?:_[a-z0-9]+){1,}\b/u,
  /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z\b/u,
  /\b(?:adapterId|businessCollectionsRead|diagnosticBranch|specializedBranch|readOnly)\b/u,
])

const SECRET_PATTERNS = Object.freeze([
  /\bql7ws_[A-Za-z0-9_-]{16,}\b/g,
  /\b(?:api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]\s*[^\s,;]{8,}/giu,
  /\bBearer\s+[^\s,;]{3,}/giu,
  /\b[A-Za-z0-9_-]{3,}\.[A-Za-z0-9_-]{3,}\.[A-Za-z0-9_-]{3,}\b/giu,
  /\b0x[a-f0-9]{64}\b/giu,
  /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
])

const VALUE_LABELS = Object.freeze({
  en: {
    image: 'Image', video: 'Video', audio: 'Audio', embed: 'Video', link: 'Link',
    healthy: 'Everything looks consistent', inconsistent: 'A discrepancy was found',
    active: 'Active', finished: 'Completed', expired: 'Expired', pending: 'Pending',
    removed: 'Removed', published: 'Published', unknown: 'Not confirmed',
  },
  ru: {
    image: 'Изображение', video: 'Видео', audio: 'Аудио', embed: 'Видео', link: 'Ссылка',
    healthy: 'Всё выглядит корректно', inconsistent: 'Обнаружено несоответствие',
    active: 'Активно', finished: 'Завершено', expired: 'Истекло', pending: 'Ожидает',
    removed: 'Удалено', published: 'Опубликовано', unknown: 'Не подтверждено',
  },
  uk: {
    image: 'Зображення', video: 'Відео', audio: 'Аудіо', embed: 'Відео', link: 'Посилання',
    healthy: 'Усе виглядає коректно', inconsistent: 'Виявлено невідповідність',
    active: 'Активно', finished: 'Завершено', expired: 'Термін минув', pending: 'Очікує',
    removed: 'Видалено', published: 'Опубліковано', unknown: 'Не підтверджено',
  },
  es: {
    image: 'Imagen', video: 'Vídeo', audio: 'Audio', embed: 'Vídeo', link: 'Enlace',
    healthy: 'Todo parece correcto', inconsistent: 'Se encontró una discrepancia',
    active: 'Activa', finished: 'Finalizada', expired: 'Caducada', pending: 'Pendiente',
    removed: 'Eliminado', published: 'Publicado', unknown: 'Sin confirmar',
  },
  tr: {
    image: 'Görsel', video: 'Video', audio: 'Ses', embed: 'Video', link: 'Bağlantı',
    healthy: 'Her şey tutarlı görünüyor', inconsistent: 'Bir tutarsızlık bulundu',
    active: 'Aktif', finished: 'Tamamlandı', expired: 'Süresi doldu', pending: 'Bekliyor',
    removed: 'Kaldırıldı', published: 'Yayınlandı', unknown: 'Doğrulanmadı',
  },
  ar: {
    image: 'صورة', video: 'فيديو', audio: 'صوت', embed: 'فيديو', link: 'رابط',
    healthy: 'تبدو الحالة سليمة', inconsistent: 'تم العثور على اختلاف',
    active: 'نشط', finished: 'مكتمل', expired: 'منتهي', pending: 'قيد الانتظار',
    removed: 'تمت الإزالة', published: 'منشور', unknown: 'غير مؤكد',
  },
  zh: {
    image: '图片', video: '视频', audio: '音频', embed: '视频', link: '链接',
    healthy: '状态看起来正常', inconsistent: '发现不一致',
    active: '进行中', finished: '已完成', expired: '已过期', pending: '等待中',
    removed: '已移除', published: '已发布', unknown: '尚未确认',
  },
  he: {
    image: 'תמונה', video: 'וידאו', audio: 'שמע', embed: 'וידאו', link: 'קישור',
    healthy: 'המצב נראה תקין', inconsistent: 'נמצאה אי־התאמה',
    active: 'פעיל', finished: 'הושלם', expired: 'פג תוקף', pending: 'ממתין',
    removed: 'הוסר', published: 'פורסם', unknown: 'לא אומת',
  },
  kk: {
    image: 'Сурет', video: 'Видео', audio: 'Аудио', embed: 'Видео', link: 'Сілтеме',
    healthy: 'Бәрі үйлесімді көрінеді', inconsistent: 'Сәйкессіздік табылды',
    active: 'Белсенді', finished: 'Аяқталды', expired: 'Мерзімі өтті', pending: 'Күтуде',
    removed: 'Жойылды', published: 'Жарияланды', unknown: 'Расталмаған',
  },
})

function str(value) { return String(value ?? '').trim() }

export function normalizeQl7SupportLocale(value = '') {
  const locale = str(value).toLowerCase().split(/[-_]/)[0]
  return NORMALIZED_LOCALES.includes(locale) ? locale : 'en'
}

export function redactQl7SupportSecrets(value = '') {
  let text = str(value)
  for (const pattern of SECRET_PATTERNS) text = text.replace(pattern, '[redacted]')
  return text
}

function splitSentences(value = '') {
  return str(value)
    .split(/(?<=[.!?。！？…])\s+|\n{2,}/u)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizedSentence(value = '') {
  return str(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function dedupeQl7SupportSentences(value = '') {
  const seen = new Set()
  const out = []
  for (const sentence of splitSentences(value)) {
    const key = normalizedSentence(sentence)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(sentence)
  }
  return out.join(' ').trim()
}

export function scanQl7SupportUserText(value = '') {
  const text = redactQl7SupportSecrets(value)
  const internal = INTERNAL_MECHANICS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source)
  const machine = RAW_MACHINE_VALUE.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source)
  const secret = text.includes('[redacted]')
  return Object.freeze({
    ok: internal.length === 0 && machine.length === 0 && !secret,
    internal,
    machine,
    secret,
  })
}

export function applyQl7SupportAdultLanguagePolicy(value = '', {
  maxLength = QL7_SUPPORT_REPLY_MAX_GRAPHEMES,
  preserveLineBreaks = false,
} = {}) {
  let text = redactQl7SupportSecrets(value)
    .replace(/\u0000/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([,.;!?…:])/g, '$1')
    .trim()

  for (const pattern of INTERNAL_MECHANICS) {
    text = text.replace(pattern, '')
  }
  text = text
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.;:—–-]+|[\s,;:—–-]+$/g, '')
    .trim()

  text = dedupeQl7SupportSentences(text)
  if (!preserveLineBreaks) text = text.replace(/\s*\n+\s*/g, ' ')
  return fitQl7SupportReply(text, { maxGraphemes: Math.min(QL7_SUPPORT_REPLY_MAX_GRAPHEMES, Math.max(1, Number(maxLength) || QL7_SUPPORT_REPLY_MAX_GRAPHEMES)) }).text
}

export function formatQl7SupportDate(value, locale = 'en', {
  includeDate = true,
  includeTime = true,
} = {}) {
  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const normalized = normalizeQl7SupportLocale(locale)
  const localeMap = {
    en: 'en-US', ru: 'ru-RU', uk: 'uk-UA', es: 'es-ES',
    tr: 'tr-TR', ar: 'ar', zh: 'zh-CN', he: 'he-IL', kk: 'kk-KZ',
  }
  const options = {}
  if (includeDate) Object.assign(options, { year: 'numeric', month: 'short', day: 'numeric' })
  if (includeTime) Object.assign(options, { hour: '2-digit', minute: '2-digit' })
  try {
    return new Intl.DateTimeFormat(localeMap[normalized], options).format(date)
  } catch {
    return date.toLocaleString()
  }
}

export function humanizeQl7SupportValue(value, locale = 'en') {
  const normalizedLocale = normalizeQl7SupportLocale(locale)
  const labels = VALUE_LABELS[normalizedLocale] || VALUE_LABELS.en
  const raw = str(value)
  if (!raw) return ''
  const key = raw.toLowerCase()
  if (labels[key]) return labels[key]
  if (/^\d{4}-\d{2}-\d{2}T/u.test(raw)) return formatQl7SupportDate(raw, normalizedLocale)
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\p{Ll}/u, (letter) => letter.toUpperCase())
    .trim()
}

export function assertQl7SupportAdultUserText(value = '') {
  const audit = scanQl7SupportUserText(value)
  if (!audit.ok) {
    const error = new Error('ql7_support_user_text_policy')
    error.audit = audit
    throw error
  }
  return true
}

export const QL7_SUPPORT_CORE_LOCALES = CORE_LOCALES
