export const QL7_SUPPORT_RUNTIME_STATUSES_V11 = Object.freeze(['unknown', 'development', 'private_beta', 'public_beta', 'live', 'maintenance', 'paused', 'retired'])
export const QL7_SUPPORT_RUNTIME_CAPABILITY_COLLECTION_V11 = 'ql7_support_runtime_capabilities'

const DEFAULTS = Object.freeze({
  exchange: { status: 'development', publishedLaunchAt: null },
  exchange_ai: { status: 'development', publishedLaunchAt: null },
  battlecoin: { status: 'development', publishedLaunchAt: null },
  futures: { status: 'development', publishedLaunchAt: null },
  gameverse: { status: 'development', publishedLaunchAt: null },
  metastudio: { status: 'development', publishedLaunchAt: null },
  metamarket: { status: 'live', publishedLaunchAt: null },
  forum: { status: 'live', publishedLaunchAt: null },
})
const TOPIC_TO_CAPABILITY = Object.freeze({ exchange: 'exchange', exchange_ai: 'exchange_ai', battlecoin: 'battlecoin', battle_chat: 'battlecoin', futures: 'futures', gameverse: 'gameverse', metastudio: 'metastudio', metaverse: 'gameverse', metamarket: 'metamarket', forum_feed: 'forum', forum_threads: 'forum' })

function str(value) { return String(value ?? '').trim() }
function validDate(value) { if (value === null || value === undefined || String(value).trim() === '') return null; const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toISOString() : null }
function envKey(id, suffix) { return `QL7_RUNTIME_${str(id).replace(/[^A-Za-z0-9]/gu, '_').toUpperCase()}_${suffix}` }

export function normalizeQl7SupportRuntimeCapabilityV11(value = {}, fallbackId = '') {
  const capabilityId = str(value?.capabilityId || fallbackId)
  const status = QL7_SUPPORT_RUNTIME_STATUSES_V11.includes(str(value?.status)) ? str(value.status) : 'unknown'
  return Object.freeze({
    capabilityId,
    status,
    effectiveAt: validDate(value?.effectiveAt),
    publishedLaunchAt: validDate(value?.publishedLaunchAt),
    source: str(value?.source || 'runtime_registry').slice(0, 120),
    asOf: validDate(value?.asOf) || new Date().toISOString(),
    userVisible: value?.userVisible !== false,
    notesKey: str(value?.notesKey).slice(0, 120),
  })
}

export function getQl7SupportRuntimeCapabilityV11(capabilityId = '', overrides = {}) {
  const id = str(capabilityId)
  const source = overrides?.[id] || DEFAULTS[id] || { status: 'unknown', publishedLaunchAt: null }
  return normalizeQl7SupportRuntimeCapabilityV11({ ...source, capabilityId: id }, id)
}

export function getQl7SupportRuntimeCapabilityIdForTopicV11(topic = '') {
  return TOPIC_TO_CAPABILITY[str(topic)] || ''
}

export async function readQl7SupportRuntimeCapabilityV11({ database = null, capabilityId = '', topic = '', env = process.env } = {}) {
  const id = str(capabilityId || getQl7SupportRuntimeCapabilityIdForTopicV11(topic))
  if (!id) return null
  const environmentStatus = str(env?.[envKey(id, 'STATUS')])
  const environmentDate = str(env?.[envKey(id, 'LAUNCH_AT')])
  if (QL7_SUPPORT_RUNTIME_STATUSES_V11.includes(environmentStatus)) {
    return normalizeQl7SupportRuntimeCapabilityV11({ capabilityId: id, status: environmentStatus, publishedLaunchAt: environmentDate || null, source: `env:${envKey(id, 'STATUS')}`, asOf: new Date().toISOString() }, id)
  }
  if (database?.collection) {
    const row = await database.collection(QL7_SUPPORT_RUNTIME_CAPABILITY_COLLECTION_V11)
      .findOne({ $or: [{ _id: id }, { capabilityId: id }] })
      .catch(() => null)
    if (row) return normalizeQl7SupportRuntimeCapabilityV11({ ...row, capabilityId: id, source: row.source || QL7_SUPPORT_RUNTIME_CAPABILITY_COLLECTION_V11 }, id)
  }
  return getQl7SupportRuntimeCapabilityV11(id)
}

const STATE_TEXT = Object.freeze({
  en: { development: 'is in development', private_beta: 'is in private beta', public_beta: 'is available in public beta', live: 'is available', maintenance: 'is temporarily under maintenance', paused: 'is temporarily paused', retired: 'is no longer available', unknown: 'has no confirmed current status', date: 'Published date', noDate: 'No confirmed public launch date is available yet. Users will be notified after an official update.' },
  ru: { development: 'находится в разработке', private_beta: 'доступна в закрытой beta', public_beta: 'доступна в открытой beta', live: 'доступна', maintenance: 'временно находится на обслуживании', paused: 'временно приостановлена', retired: 'больше не доступна', unknown: 'не имеет подтверждённого текущего статуса', date: 'Опубликованная дата', noDate: 'Подтверждённая публичная дата запуска пока не опубликована. Пользователи получат уведомление после официального обновления.' },
  uk: { development: 'перебуває в розробці', private_beta: 'доступна в закритій beta', public_beta: 'доступна у відкритій beta', live: 'доступна', maintenance: 'тимчасово перебуває на обслуговуванні', paused: 'тимчасово призупинена', retired: 'більше не доступна', unknown: 'не має підтвердженого поточного статусу', date: 'Опублікована дата', noDate: 'Підтверджену публічну дату запуску ще не оприлюднено. Користувачі отримають сповіщення після офіційного оновлення.' },
  es: { development: 'está en desarrollo', private_beta: 'está en beta privada', public_beta: 'está disponible en beta pública', live: 'está disponible', maintenance: 'está temporalmente en mantenimiento', paused: 'está temporalmente en pausa', retired: 'ya no está disponible', unknown: 'no tiene un estado actual confirmado', date: 'Fecha publicada', noDate: 'Todavía no hay una fecha pública de lanzamiento confirmada. Los usuarios recibirán una notificación tras una actualización oficial.' },
  tr: { development: 'geliştirme aşamasındadır', private_beta: 'özel beta aşamasındadır', public_beta: 'genel beta olarak kullanılabilir', live: 'kullanılabilir', maintenance: 'geçici olarak bakımdadır', paused: 'geçici olarak duraklatılmıştır', retired: 'artık kullanılamaz', unknown: 'doğrulanmış güncel bir durumu yoktur', date: 'Yayımlanan tarih', noDate: 'Henüz doğrulanmış bir genel lansman tarihi yok. Resmî güncellemeden sonra kullanıcılara bildirim gönderilecektir.' },
  ar: { development: 'قيد التطوير', private_beta: 'متاحة ضمن نسخة تجريبية خاصة', public_beta: 'متاحة ضمن نسخة تجريبية عامة', live: 'متاحة', maintenance: 'تخضع للصيانة مؤقتاً', paused: 'متوقفة مؤقتاً', retired: 'لم تعد متاحة', unknown: 'لا تملك حالة حالية مؤكدة', date: 'التاريخ المنشور', noDate: 'لا يوجد حتى الآن موعد إطلاق عام مؤكد. سيتم إشعار المستخدمين بعد صدور تحديث رسمي.' },
  zh: { development: '正在开发中', private_beta: '处于私测阶段', public_beta: '已开放公测', live: '当前可用', maintenance: '暂时处于维护中', paused: '暂时暂停', retired: '已停止提供', unknown: '当前状态尚未确认', date: '已公布日期', noDate: '目前尚无确认的公开上线日期。正式更新后将通知用户。' },
  he: { development: 'נמצא בפיתוח', private_beta: 'זמין בגרסת בטא פרטית', public_beta: 'זמין בגרסת בטא ציבורית', live: 'זמין', maintenance: 'נמצא זמנית בתחזוקה', paused: 'מושהה זמנית', retired: 'אינו זמין עוד', unknown: 'אין לו מצב נוכחי מאומת', date: 'תאריך שפורסם', noDate: 'עדיין לא פורסם מועד השקה ציבורי מאומת. המשתמשים יקבלו הודעה לאחר עדכון רשמי.' },
})

export function buildQl7SupportRuntimeClaimV11(capability = {}, locale = 'en') {
  const row = normalizeQl7SupportRuntimeCapabilityV11(capability, capability?.capabilityId)
  const lang = str(locale).toLowerCase().split(/[-_]/u)[0]
  const copy = STATE_TEXT[lang] || STATE_TEXT.en
  const state = copy[row.status] || copy.unknown
  const date = row.publishedLaunchAt
  const text = date
    ? `${row.capabilityId} ${state}. ${copy.date}: ${date}.`
    : `${row.capabilityId} ${state}. ${copy.noDate}`
  return Object.freeze({ capabilityId: row.capabilityId, status: row.status, text, publishedLaunchAt: date, inventedDate: false, source: row.source, asOf: row.asOf })
}
