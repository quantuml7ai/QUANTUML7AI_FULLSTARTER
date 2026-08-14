import { isQl7SupportActive } from './config/featureFlag.js'
import { deliverQl7SupportEvent } from './server.js'
import crypto from 'crypto'
import mongoClient from '../mongo/client.cjs'
import { buildQl7SupportDedupeKey } from './templates.js'
import { QL7_SUPPORT_CASE_COLLECTION } from './caseEngine.js'
import { buildQl7SupportCard } from './cards.js'
import { describeQl7SupportReportProgress } from './reportPolicyRegistry.js'

const QL7_SUPPORT_ADMIN_EVENT_COLLECTION = 'ql7_support_admin_events'

const MODERATION_COPY = Object.freeze({
  en: {
    receivedTitle: 'Report received for your post',
    receivedSummary: 'A complaint was registered for this exact post. The reporter remains anonymous. The content is preserved below for your review.',
    thresholdTitle: 'Moderation review started',
    thresholdSummary: 'The complaint threshold was reached. The post and its evidence are being reviewed under the platform rules.',
    removedTitle: 'Post removed after moderation',
    removedSummary: 'The post was removed after the moderation threshold and review process.',
    receivedStatus: 'Received', thresholdStatus: 'Under review', removedStatus: 'Removed',
    review: 'Review the exact content below. If media is present, the same media is shown in the card. Do not attempt to identify the reporter.',
    reasons: { porn: 'Possible sexual or pornographic content', violence: 'Possible violent content', boring: 'Users marked the post as not interesting', uninteresting: 'Users marked the post as not interesting', spam: 'Possible spam or misleading content', other: 'Possible rules violation' },
  },
  ru: {
    receivedTitle: 'На ваш пост поступила жалоба',
    receivedSummary: 'Жалоба зарегистрирована именно на этот пост. Личность автора жалобы остаётся анонимной. Ниже показан сам материал и подтверждённые метаданные.',
    thresholdTitle: 'Начата модерационная проверка',
    thresholdSummary: 'Достигнут порог жалоб. Пост и связанные доказательства проверяются по правилам платформы.',
    removedTitle: 'Пост удалён после модерации',
    removedSummary: 'Пост удалён после достижения порога жалоб и модерационной проверки.',
    receivedStatus: 'Получено', thresholdStatus: 'На проверке', removedStatus: 'Удалён',
    review: 'Проверьте конкретный материал ниже. Если в посте есть видео, изображение или аудио, оно показано в этой карточке. Автор жалобы не раскрывается.',
    reasons: { porn: 'Пользователи считают, что материал может содержать порно или сексуальный контент', violence: 'Пользователи считают, что материал может содержать сцены насилия', boring: 'Пользователи отметили пост как неинтересный', uninteresting: 'Пользователи отметили пост как неинтересный', spam: 'Возможный спам или вводящий в заблуждение материал', other: 'Возможное нарушение правил платформы' },
  },
  uk: {
    receivedTitle: 'На ваш допис надійшла скарга',
    receivedSummary: 'Скаргу зареєстровано саме на цей допис. Автор скарги залишається анонімним. Нижче показано матеріал і підтверджені метадані.',
    thresholdTitle: 'Розпочато модераційну перевірку',
    thresholdSummary: 'Досягнуто поріг скарг. Допис і докази перевіряються за правилами платформи.',
    removedTitle: 'Допис видалено після модерації',
    removedSummary: 'Допис видалено після досягнення порогу скарг і модераційної перевірки.',
    receivedStatus: 'Отримано', thresholdStatus: 'На перевірці', removedStatus: 'Видалено',
    review: 'Перегляньте конкретний матеріал нижче. Відео, зображення або аудіо з допису показано в цій картці. Автор скарги не розкривається.',
    reasons: { porn: 'Можливий порнографічний або сексуальний контент', violence: 'Можливі сцени насильства', boring: 'Користувачі позначили допис як нецікавий', uninteresting: 'Користувачі позначили допис як нецікавий', spam: 'Можливий спам або оманливий матеріал', other: 'Можливе порушення правил' },
  },
  es: {
    receivedTitle: 'Tu publicación recibió un reporte',
    receivedSummary: 'El reporte corresponde exactamente a esta publicación. La identidad del reportante permanece anónima. El contenido y los metadatos confirmados aparecen abajo.',
    thresholdTitle: 'Revisión de moderación iniciada',
    thresholdSummary: 'Se alcanzó el umbral de reportes. La publicación y sus pruebas se revisan según las reglas.',
    removedTitle: 'Publicación eliminada tras moderación',
    removedSummary: 'La publicación fue eliminada después del umbral y la revisión de moderación.',
    receivedStatus: 'Recibido', thresholdStatus: 'En revisión', removedStatus: 'Eliminado',
    review: 'Revisa el contenido exacto. Si había video, imagen o audio, se muestra en esta tarjeta. No se revela el reportante.',
    reasons: { porn: 'Posible contenido sexual o pornográfico', violence: 'Posible contenido violento', boring: 'Los usuarios marcaron la publicación como poco interesante', uninteresting: 'Los usuarios marcaron la publicación como poco interesante', spam: 'Posible spam o contenido engañoso', other: 'Posible infracción de las reglas' },
  },
  tr: {
    receivedTitle: 'Gönderiniz hakkında şikayet alındı',
    receivedSummary: 'Şikayet tam olarak bu gönderiye aittir. Şikayet eden kişi anonim kalır. İçerik ve doğrulanmış meta veriler aşağıdadır.',
    thresholdTitle: 'Moderasyon incelemesi başladı',
    thresholdSummary: 'Şikayet eşiğine ulaşıldı. Gönderi ve kanıtlar platform kurallarına göre inceleniyor.',
    removedTitle: 'Gönderi moderasyon sonrası kaldırıldı',
    removedSummary: 'Gönderi, şikayet eşiği ve moderasyon incelemesi sonrasında kaldırıldı.',
    receivedStatus: 'Alındı', thresholdStatus: 'İnceleniyor', removedStatus: 'Kaldırıldı',
    review: 'Aşağıdaki gerçek içeriği inceleyin. Video, görsel veya ses varsa bu kartta gösterilir. Şikayet eden açıklanmaz.',
    reasons: { porn: 'Olası cinsel veya pornografik içerik', violence: 'Olası şiddet içeriği', boring: 'Kullanıcılar gönderiyi ilgi çekici değil olarak işaretledi', uninteresting: 'Kullanıcılar gönderiyi ilgi çekici değil olarak işaretledi', spam: 'Olası spam veya yanıltıcı içerik', other: 'Olası kural ihlali' },
  },
  ar: {
    receivedTitle: 'تم استلام بلاغ على منشورك',
    receivedSummary: 'البلاغ يتعلق بهذا المنشور تحديداً. تبقى هوية المبلّغ مجهولة. يظهر المحتوى والبيانات المؤكدة أدناه.',
    thresholdTitle: 'بدأت مراجعة الإشراف',
    thresholdSummary: 'تم بلوغ حد البلاغات. تتم مراجعة المنشور والأدلة وفق قواعد المنصة.',
    removedTitle: 'تم حذف المنشور بعد الإشراف',
    removedSummary: 'تم حذف المنشور بعد بلوغ حد البلاغات ومراجعة الإشراف.',
    receivedStatus: 'تم الاستلام', thresholdStatus: 'قيد المراجعة', removedStatus: 'تم الحذف',
    review: 'راجع المحتوى المحدد أدناه. إذا كان المنشور يتضمن فيديو أو صورة أو صوتاً فسيظهر في البطاقة. لا تُكشف هوية المبلّغ.',
    reasons: { porn: 'محتوى جنسي أو إباحي محتمل', violence: 'محتوى عنيف محتمل', boring: 'صنّف المستخدمون المنشور على أنه غير مثير للاهتمام', uninteresting: 'صنّف المستخدمون المنشور على أنه غير مثير للاهتمام', spam: 'رسائل مزعجة أو محتوى مضلل محتمل', other: 'مخالفة محتملة للقواعد' },
  },
  zh: {
    receivedTitle: '你的帖子收到举报',
    receivedSummary: '举报针对下方这一具体帖子。举报者身份保持匿名。帖子内容和已确认元数据如下。',
    thresholdTitle: '已启动审核',
    thresholdSummary: '举报数量达到阈值，帖子和相关证据正在按平台规则审核。',
    removedTitle: '帖子经审核后移除',
    removedSummary: '帖子在达到举报阈值并完成审核后被移除。',
    receivedStatus: '已收到', thresholdStatus: '审核中', removedStatus: '已移除',
    review: '请查看下方具体内容。原帖中的视频、图片或音频会直接显示。举报者身份不会公开。',
    reasons: { porn: '可能包含色情或性内容', violence: '可能包含暴力内容', boring: '用户将帖子标记为不感兴趣', uninteresting: '用户将帖子标记为不感兴趣', spam: '可能是垃圾信息或误导性内容', other: '可能违反平台规则' },
  },
  he: {
    receivedTitle: 'התקבל דיווח על הפוסט שלך',
    receivedSummary: 'הדיווח מתייחס בדיוק לפוסט המוצג למטה. זהות המדווח נשארת חסויה. התוכן והמטא־נתונים המאומתים מוצגים כאן.',
    thresholdTitle: 'נפתחה בדיקת מודרציה',
    thresholdSummary: 'סף הדיווחים הושג. הפוסט והראיות נבדקים בהתאם לכללי הפלטפורמה.',
    removedTitle: 'הפוסט הוסר לאחר בדיקת מודרציה',
    removedSummary: 'הפוסט הוסר לאחר שהושג סף הדיווחים והושלמה בדיקת המודרציה.',
    receivedStatus: 'התקבל', thresholdStatus: 'בבדיקה', removedStatus: 'הוסר',
    review: 'בדוק את התוכן המדויק למטה. אם יש וידאו, תמונה או שמע, הם מוצגים בכרטיס. זהות המדווח אינה נחשפת.',
    reasons: { porn: 'ייתכן תוכן מיני או פורנוגרפי', violence: 'ייתכן תוכן אלים', boring: 'משתמשים סימנו את הפוסט כלא מעניין', uninteresting: 'משתמשים סימנו את הפוסט כלא מעניין', spam: 'ייתכן ספאם או תוכן מטעה', other: 'ייתכן שהופרו כללי הפלטפורמה' },
  },
})

function moderationLocale(value = '') {
  const lang = str(value).toLowerCase().split(/[-_]/)[0]
  return MODERATION_COPY[lang] ? lang : 'en'
}

function moderationReasonLabel(reason = '', locale = '') {
  const copy = MODERATION_COPY[moderationLocale(locale)] || MODERATION_COPY.en
  return copy.reasons[str(reason).toLowerCase()] || copy.reasons.other
}

async function resolveEventLocale(userId = '', preferred = '') {
  const direct = moderationLocale(preferred)
  if (str(preferred) && direct) return direct
  try {
    const handle = await mongoClient.getMongoDb()
    const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
    const uid = str(userId)
    const profile = await database.collection('profiles').findOne({
      $or: [{ _id: `profile:${uid}` }, { accountId: uid }, { canonicalAccountId: uid }, { userId: uid }],
    }, { projection: { locale: 1, language: 1, preferredLocale: 1 } })
    const profileLocale = str(profile?.locale || profile?.language || profile?.preferredLocale)
    if (profileLocale) return moderationLocale(profileLocale)

    const recentCase = await database.collection(QL7_SUPPORT_CASE_COLLECTION).findOne(
      { userId: uid },
      { sort: { updatedAt: -1, _id: -1 }, projection: { selectedLocale: 1, detectedLanguage: 1 } },
    ).catch(() => null)
    const caseLocale = str(recentCase?.selectedLocale || recentCase?.detectedLanguage)
    if (caseLocale) return moderationLocale(caseLocale)
  } catch {}
  return 'en'
}

function str(value) {
  return String(value ?? '').trim()
}

function nowIso() {
  return new Date().toISOString()
}

function maskId(value = '') {
  const clean = str(value)
  if (!clean) return ''
  if (clean.length < 10) return `${clean.slice(0, 2)}***`
  return `${clean.slice(0, 4)}…${clean.slice(-4)}`
}

async function recordAdminEvent({ eventType, userId, reporterId = '', subjectId = '', payload = {} } = {}) {
  const handle = await mongoClient.getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database?.collection) return null
  const at = nowIso()
  const digest = crypto.createHash('sha256').update([eventType, userId, reporterId, subjectId, at].join(':')).digest('hex').slice(0, 28)
  const doc = {
    _id: `support-admin-event:${digest}`,
    eventType: str(eventType),
    userId: str(userId),
    reporterId: str(reporterId),
    reporterIdMasked: maskId(reporterId),
    subjectId: str(subjectId),
    payload: JSON.parse(JSON.stringify(payload || {})),
    createdAt: at,
    visibility: 'admin_only',
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_ADMIN_EVENT_COLLECTION).insertOne(doc)
  return doc
}

function subject(...parts) {
  return parts.map(str).filter(Boolean).join(':') || 'event'
}

function withTimestamp(payload = {}, timestamp = '') {
  const ts = str(timestamp) || str(payload?.timestamp) || nowIso()
  return { ...(payload || {}), timestamp: ts }
}

async function emit({
  userId,
  userAliases = [],
  eventType,
  subjectId,
  locale = '',
  payload = {},
  timestamp = '',
  push = true,
  supportCard = null,
} = {}) {
  const dedupeKey = buildQl7SupportDedupeKey({
    userId,
    eventType,
    subjectId,
  })
  return deliverQl7SupportEvent({
    userId,
    userAliases,
    eventType,
    subjectId,
    locale,
    payload: withTimestamp(payload, timestamp),
    supportCard,
    dedupeKey,
    push,
  })
}

export async function notifyQl7Welcome({ userId, userAliases = [], locale = '', registeredAt = '' } = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'welcome',
    subjectId: 'registration',
    locale,
    payload: {},
    timestamp: registeredAt,
  })
}

export async function notifyQl7QcoinCredited({
  userId,
  userAliases = [],
  locale = '',
  amount = '',
  balance = '',
  invoiceId = '',
  paymentId = '',
  creditedAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'qcoin_credit',
    subjectId: subject(invoiceId, paymentId),
    locale,
    payload: { amount, balance, invoiceId, paymentId },
    timestamp: creditedAt,
  })
}

export async function notifyQl7VipActivated({
  userId,
  userAliases = [],
  locale = '',
  until = '',
  paymentId = '',
  activatedAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'vip_activated',
    subjectId: subject(paymentId, until),
    locale,
    payload: { until, paymentId },
    timestamp: activatedAt || until,
  })
}

export async function notifyQl7VipExpiring({
  userId,
  userAliases = [],
  locale = '',
  daysLeft,
  until = '',
  warningAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const days = Number(daysLeft)
  const eventType = days === 3 ? 'vip_expiring_3d' : (days === 2 ? 'vip_expiring_2d' : 'vip_expiring_1d')
  return emit({
    userId,
    userAliases,
    eventType,
    subjectId: subject(until, `${days || 1}d`),
    locale,
    payload: { until, daysLeft: days || 1 },
    timestamp: warningAt || until,
  })
}

export async function notifyQl7VipExpired({
  userId,
  userAliases = [],
  locale = '',
  until = '',
  expiredAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'vip_expired',
    subjectId: subject(until),
    locale,
    payload: { until },
    timestamp: expiredAt || until,
  })
}

export async function notifyQl7AdsActivated({
  userId,
  userAliases = [],
  locale = '',
  packageName = '',
  campaign = '',
  invoiceId = '',
  activatedAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'ads_activated',
    subjectId: subject(invoiceId, packageName, campaign),
    locale,
    payload: { package: packageName, campaign, invoiceId },
    timestamp: activatedAt,
  })
}

export async function notifyQl7AdsMetricsWeekly({
  userId,
  userAliases = [],
  locale = '',
  campaign = '',
  packageName = '',
  views = 0,
  clicks = 0,
  ctr = '',
  period = '',
  reportId = '',
  reportedAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'ads_metrics_weekly',
    subjectId: subject(reportId, campaign, period),
    locale,
    payload: { campaign, package: packageName, views, clicks, ctr, period },
    timestamp: reportedAt || period,
  })
}

export async function notifyQl7AdsExpiring({
  userId,
  userAliases = [],
  locale = '',
  daysLeft,
  campaign = '',
  packageName = '',
  expiresAt = '',
  warningAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const days = Number(daysLeft)
  const eventType = days === 3 ? 'ads_expiring_3d' : (days === 2 ? 'ads_expiring_2d' : 'ads_expiring_1d')
  return emit({
    userId,
    userAliases,
    eventType,
    subjectId: subject(campaign, expiresAt, `${days || 1}d`),
    locale,
    payload: { campaign, package: packageName, expiresAt, daysLeft: days || 1 },
    timestamp: warningAt || expiresAt,
  })
}

export async function notifyQl7AdsFinalSummary({
  userId,
  userAliases = [],
  locale = '',
  campaign = '',
  packageName = '',
  views = 0,
  clicks = 0,
  ctr = '',
  reportId = '',
  finishedAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'ads_final_summary',
    subjectId: subject(reportId, campaign, finishedAt),
    locale,
    payload: { campaign, package: packageName, views, clicks, ctr },
    timestamp: finishedAt,
  })
}

export async function notifyQl7ReportReceived({
  userId,
  userAliases = [],
  locale = '',
  postId = '',
  reportType = '',
  reporterId = '',
  reportedAt = '',
  snapshot = null,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const eventLocale = await resolveEventLocale(userId, locale)
  const copy = MODERATION_COPY[eventLocale] || MODERATION_COPY.en
  const reasonLabel = moderationReasonLabel(reportType, eventLocale)
  const safeSnapshot = snapshot && typeof snapshot === 'object' ? snapshot : null
  const supportCard = safeSnapshot ? buildQl7SupportCard({
    kind: 'moderation_snapshot',
    locale: eventLocale,
    title: copy.receivedTitle,
    summary: copy.receivedSummary,
    status: copy.receivedStatus,
    snapshot: {
      ...safeSnapshot,
      postId,
      reportType,
      reasonLabel,
      reviewMessage: copy.review,
      capturedAt: safeSnapshot.capturedAt || reportedAt,
      reportProgress: describeQl7SupportReportProgress({ reportType, currentReports: Number(safeSnapshot.thresholdCount || 1) }),
    },
    asOf: reportedAt,
  }) : null
  await recordAdminEvent({
    eventType: 'report_received',
    userId,
    reporterId,
    subjectId: subject(postId, reportType, reportedAt),
    payload: { postId, reportType, snapshot: safeSnapshot },
  }).catch(() => null)
  return emit({
    userId,
    userAliases,
    eventType: 'report_received',
    subjectId: subject(postId, reportType, reportedAt),
    locale: eventLocale,
    payload: { postId, reportType: reasonLabel, reporterPrivate: true },
    timestamp: reportedAt,
    supportCard,
  })
}

export async function notifyQl7ReportThreshold({
  userId,
  userAliases = [],
  locale = '',
  postId = '',
  reportType = '',
  count = 0,
  reachedAt = '',
  snapshot = null,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const eventLocale = await resolveEventLocale(userId, locale)
  const copy = MODERATION_COPY[eventLocale] || MODERATION_COPY.en
  const reasonLabel = moderationReasonLabel(reportType, eventLocale)
  const supportCard = snapshot ? buildQl7SupportCard({
    kind: 'moderation_snapshot', locale: eventLocale, title: copy.thresholdTitle, summary: copy.thresholdSummary, status: copy.thresholdStatus,
    snapshot: { ...snapshot, postId, reportType, reasonLabel, reviewMessage: copy.review, thresholdCount: count, reportProgress: describeQl7SupportReportProgress({ reportType, currentReports: count }), capturedAt: snapshot.capturedAt || reachedAt }, asOf: reachedAt,
  }) : null
  return emit({
    userId,
    userAliases,
    eventType: 'report_threshold',
    subjectId: subject(postId, reportType, count),
    locale: eventLocale,
    payload: { postId, reportType: reasonLabel, count },
    timestamp: reachedAt,
    supportCard,
  })
}

export async function notifyQl7PostRemoved({
  userId,
  userAliases = [],
  locale = '',
  postId = '',
  reason = '',
  rev = '',
  removedAt = '',
  snapshot = null,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const eventLocale = await resolveEventLocale(userId, locale)
  const copy = MODERATION_COPY[eventLocale] || MODERATION_COPY.en
  const reasonLabel = moderationReasonLabel(reason, eventLocale)
  const supportCard = snapshot ? buildQl7SupportCard({
    kind: 'moderation_snapshot', locale: eventLocale, title: copy.removedTitle, summary: copy.removedSummary, status: copy.removedStatus,
    snapshot: { ...snapshot, postId, reportType: reason, reasonLabel, reviewMessage: copy.review, removed: true, reportProgress: { ...describeQl7SupportReportProgress({ reportType: reason, currentReports: Number(snapshot.thresholdCount || 0) }), reviewStatus: 'removed' }, capturedAt: snapshot.capturedAt || removedAt }, asOf: removedAt,
  }) : null
  return emit({
    userId,
    userAliases,
    eventType: 'post_removed',
    subjectId: subject(postId, rev),
    locale: eventLocale,
    payload: { postId, reason: reasonLabel, rev },
    timestamp: removedAt,
    supportCard,
  })
}

export async function notifyQl7MediaLock({
  userId,
  userAliases = [],
  locale = '',
  until = '',
  reason = '',
  lockedAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'media_lock',
    subjectId: subject(until, reason),
    locale,
    payload: { until, reason },
    timestamp: lockedAt || until,
  })
}

export async function notifyQl7RulesWarning({
  userId,
  userAliases = [],
  locale = '',
  reason = '',
  warningId = '',
  warnedAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'rules_warning',
    subjectId: subject(warningId, reason),
    locale,
    payload: { reason },
    timestamp: warnedAt,
  })
}

export async function notifyQl7Broadcast({
  userId,
  userAliases = [],
  locale = '',
  message = '',
  broadcastId = '',
  sentAt = '',
  push = true,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'broadcast',
    subjectId: subject(broadcastId),
    locale,
    payload: { message, broadcastId: subject(broadcastId) },
    timestamp: sentAt,
    push,
  })
}

export async function notifyQl7Security({
  userId,
  userAliases = [],
  locale = '',
  message = '',
  securityId = '',
  sentAt = '',
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  return emit({
    userId,
    userAliases,
    eventType: 'critical_security',
    subjectId: subject(securityId),
    locale,
    payload: { message },
    timestamp: sentAt,
  })
}
