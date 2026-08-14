import {
  applyQl7SupportAdultLanguagePolicy,
  formatQl7SupportDate,
  humanizeQl7SupportValue,
  normalizeQl7SupportLocale,
} from './adultLanguagePolicy.js'
import { getQl7SupportTopicLabel, normalizeQl7SupportTopic } from './ecosystemCatalog.js'
import { localizeQl7MetricV8 } from './presentationV8.js'
import { localizeQl7MetricV9, normalizeQl7MetricKeyV9, ql7MetricFormatV9 } from './metricRegistryV9.js'
import { decideQl7EvidenceStatusV11_6, sanitizeQl7EvidenceRowsV11_6 } from './evidencePolicyV11_6.js'

function str(value) { return String(value ?? '').trim() }
function arr(value) { return Array.isArray(value) ? value : [] }

const COPY = Object.freeze({
  en: {
    title: 'Check result', healthy: 'Everything found is consistent.',
    anomaly: 'A discrepancy was found and the case is ready for review.',
    noData: 'I could not match this request to an available operation.',
    unavailable: 'The current result could not be confirmed right now.',
    facts: 'What was confirmed', checks: 'What was checked', attention: 'What needs attention',
    next: 'What you can do', rows: 'Records found', status: 'Result', updated: 'Checked',
    retry: 'Try again later or add the approximate time and the useful detail you see.',
    balanceTitle: 'QCoin balance',
    balanceSummary: 'I checked the signed-in account and its aliases. This is the current balance state.',
    vipTitle: 'VIP status',
    vipActiveSummary: 'The signed-in account has an active VIP entitlement.',
    vipInactiveSummary: 'The signed-in account does not have an active VIP entitlement right now.',
    vipExpiredSummary: 'The latest VIP entitlement found for this account has expired.',
    adsMissingTitle: 'Advertising package status',
    adsMissingSummary: 'The signed-in account has no active advertising package or campaign right now.',
    more: 'More details', followup: 'I can also check VIP, ads, payments or another ecosystem area if needed.',
  },
  ru: {
    title: 'Результат проверки', healthy: 'По найденным данным всё выглядит корректно.',
    anomaly: 'Обнаружено несоответствие. Обращение подготовлено для рассмотрения.',
    noData: 'Сразу сопоставить это обращение с доступной операцией не удалось.',
    unavailable: 'Сейчас не удалось подтвердить результат.',
    facts: 'Что подтверждено', checks: 'Что проверено', attention: 'На что обратить внимание',
    next: 'Что можно сделать', rows: 'Найдено записей', status: 'Результат', updated: 'Проверено',
    retry: 'Повторите попытку позже или добавьте примерное время и полезную видимую деталь.',
    balanceTitle: 'Баланс QCoin',
    balanceSummary: 'Я проверил текущий аккаунт и его алиасы. Это актуальное состояние баланса.',
    vipTitle: 'Состояние VIP',
    vipActiveSummary: 'У текущего аккаунта есть активная VIP-подписка.',
    vipInactiveSummary: 'У текущего аккаунта сейчас нет активной VIP-подписки.',
    vipExpiredSummary: 'Последняя найденная VIP-подписка по этому аккаунту уже истекла.',
    adsMissingTitle: 'Состояние рекламного пакета',
    adsMissingSummary: 'У текущего аккаунта сейчас нет активного рекламного пакета или кампании.',
    more: 'Подробнее', followup: 'Если нужно, могу также проверить VIP, рекламу, платежи или другой раздел экосистемы.',
  },
  uk: {
    title: 'Результат перевірки', healthy: 'За знайденими даними все виглядає коректно.',
    anomaly: 'Виявлено невідповідність. Звернення підготовлено до розгляду.',
    noData: 'Одразу зіставити це звернення з доступною операцією не вдалося.',
    unavailable: 'Зараз не вдалося підтвердити результат.',
    facts: 'Що підтверджено', checks: 'Що перевірено', attention: 'На що звернути увагу',
    next: 'Що можна зробити', rows: 'Знайдено записів', status: 'Результат', updated: 'Перевірено',
    retry: 'Повторіть спробу пізніше або додайте приблизний час і корисну видиму деталь.',
    balanceTitle: 'Баланс QCoin',
    balanceSummary: 'Я перевірив поточний акаунт і його аліаси. Це актуальний стан балансу.',
    vipTitle: 'Стан VIP',
    vipActiveSummary: 'Поточний акаунт має активну VIP-підписку.',
    vipInactiveSummary: 'Поточний акаунт зараз не має активної VIP-підписки.',
    vipExpiredSummary: 'Остання знайдена VIP-підписка для цього акаунта вже завершилась.',
    adsMissingTitle: 'Стан рекламного пакета',
    adsMissingSummary: 'Поточний акаунт зараз не має активного рекламного пакета або кампанії.',
    more: 'Докладніше', followup: 'За потреби можу також перевірити VIP, рекламу, платежі або інший розділ екосистеми.',
  },
  es: {
    title: 'Resultado de la comprobación', healthy: 'Los datos encontrados parecen correctos.',
    anomaly: 'Se encontró una discrepancia y el caso está listo para revisión.',
    noData: 'No pude vincular esta solicitud con una operación disponible.', unavailable: 'No se pudo confirmar el resultado ahora.',
    facts: 'Datos confirmados', checks: 'Comprobaciones', attention: 'Atención', next: 'Qué puedes hacer',
    rows: 'Registros encontrados', status: 'Resultado', updated: 'Comprobado', retry: 'Inténtalo más tarde o añade la hora aproximada y el detalle útil que ves.',
    balanceTitle: 'Saldo QCoin', balanceSummary: 'Revisé la cuenta iniciada y sus alias. Este es el estado actual del saldo.',
    vipTitle: 'Estado VIP', vipActiveSummary: 'La cuenta iniciada tiene VIP activo.', vipInactiveSummary: 'La cuenta iniciada no tiene VIP activo ahora.', vipExpiredSummary: 'El último VIP encontrado para esta cuenta ya expiró.',
    adsMissingTitle: 'Estado del paquete publicitario', adsMissingSummary: 'La cuenta iniciada no tiene paquete publicitario ni campaña activa ahora.',
    more: 'Más detalles', followup: 'También puedo revisar VIP, anuncios, pagos u otra área del ecosistema si lo necesitas.',
  },
  tr: {
    title: 'Kontrol sonucu', healthy: 'Bulunan bilgiler tutarlı görünüyor.',
    anomaly: 'Bir tutarsızlık bulundu; kayıt incelemeye hazır.', noData: 'Eşleşen kayıt bulunamadı.',
    unavailable: 'Sonuç şu anda doğrulanamadı.', facts: 'Doğrulananlar', checks: 'Kontroller',
    attention: 'Dikkat', next: 'Yapabilecekleriniz', rows: 'Bulunan kayıt', status: 'Sonuç', updated: 'Kontrol zamanı',
    retry: 'Daha sonra tekrar deneyin veya yaklaşık zamanı ve gördüğünüz yararlı ayrıntıyı ekleyin.',
    balanceTitle: 'QCoin bakiyesi', balanceSummary: 'Giriş yapılan hesabı ve aliaslarını kontrol ettim. Güncel bakiye durumu budur.',
    vipTitle: 'VIP durumu', vipActiveSummary: 'Giriş yapılan hesapta aktif VIP var.', vipInactiveSummary: 'Giriş yapılan hesapta şu anda aktif VIP yok.', vipExpiredSummary: 'Bu hesap için bulunan son VIP süresi dolmuş.',
    adsMissingTitle: 'Reklam paketi durumu', adsMissingSummary: 'Giriş yapılan hesapta şu anda aktif reklam paketi veya kampanya yok.',
    more: 'Ayrıntılar', followup: 'Gerekirse VIP, reklamlar, ödemeler veya başka bir ekosistem alanını da kontrol edebilirim.',
  },
  ar: {
    title: 'نتيجة الفحص', healthy: 'تبدو البيانات التي تم العثور عليها سليمة.',
    anomaly: 'تم العثور على اختلاف وأصبح الطلب جاهزاً للمراجعة.', noData: 'لم يتم العثور على سجل مطابق.',
    unavailable: 'تعذر تأكيد النتيجة الآن.', facts: 'ما تم تأكيده', checks: 'ما تم فحصه',
    attention: 'ما يحتاج إلى الانتباه', next: 'ما يمكنك فعله', rows: 'السجلات الموجودة', status: 'النتيجة', updated: 'وقت الفحص',
    retry: 'حاول لاحقاً أو أضف الوقت التقريبي والتفصيل المفيد الذي تراه.',
    balanceTitle: 'رصيد QCoin', balanceSummary: 'تحققت من الحساب المسجل دخوله وكل الأسماء المرتبطة به. هذه هي حالة الرصيد الحالية.',
    vipTitle: 'حالة VIP', vipActiveSummary: 'الحساب المسجل دخوله لديه VIP نشط.', vipInactiveSummary: 'لا يوجد VIP نشط حالياً لهذا الحساب.', vipExpiredSummary: 'آخر VIP تم العثور عليه لهذا الحساب انتهت صلاحيته.',
    adsMissingTitle: 'حالة حزمة الإعلانات', adsMissingSummary: 'لا توجد حالياً حزمة إعلانية أو حملة نشطة لهذا الحساب.',
    more: 'تفاصيل أكثر', followup: 'يمكنني أيضاً فحص VIP أو الإعلانات أو المدفوعات أو أي قسم آخر من المنظومة عند الحاجة.',
  },
  zh: {
    title: '检查结果', healthy: '找到的数据看起来一致。', anomaly: '发现不一致，工单已准备审核。',
    noData: '未找到与此请求匹配的记录。', unavailable: '目前无法确认结果。',
    facts: '已确认内容', checks: '检查内容', attention: '需要注意', next: '可执行操作',
    rows: '找到的记录', status: '结果', updated: '检查时间', retry: '请稍后重试，或补充大致时间和你看到的有用细节。',
    balanceTitle: 'QCoin 余额', balanceSummary: '我已检查当前登录账户及其别名。这是当前余额状态。',
    vipTitle: 'VIP 状态', vipActiveSummary: '当前登录账户拥有有效 VIP。', vipInactiveSummary: '当前登录账户现在没有有效 VIP。', vipExpiredSummary: '为此账户找到的最近 VIP 已过期。',
    adsMissingTitle: '广告套餐状态', adsMissingSummary: '当前登录账户现在没有有效广告套餐或广告活动。',
    more: '更多详情', followup: '如有需要，我也可以检查 VIP、广告、支付或生态系统的其他部分。',
  },
  he: {
    title: 'תוצאת הבדיקה', healthy: 'הנתונים שנמצאו נראים תקינים.',
    anomaly: 'נמצאה אי־התאמה והפנייה מוכנה לבדיקה.', noData: 'לא נמצאה רשומה תואמת.',
    unavailable: 'לא ניתן היה לאמת את התוצאה כרגע.', facts: 'מה אומת',
    checks: 'מה נבדק', attention: 'מה דורש תשומת לב', next: 'מה ניתן לעשות',
    rows: 'רשומות שנמצאו', status: 'תוצאה', updated: 'מועד הבדיקה', retry: 'נסו שוב מאוחר יותר או הוסיפו זמן משוער ואת הפרט השימושי שמופיע אצלכם.',
    balanceTitle: 'יתרת QCoin', balanceSummary: 'בדקתי את החשבון המחובר ואת הכינויים שלו. זה מצב היתרה הנוכחי.',
    vipTitle: 'מצב VIP', vipActiveSummary: 'לחשבון המחובר יש VIP פעיל.', vipInactiveSummary: 'לחשבון המחובר אין כעת VIP פעיל.', vipExpiredSummary: 'ה-VIP האחרון שנמצא לחשבון הזה פג.',
    adsMissingTitle: 'מצב חבילת פרסום', adsMissingSummary: 'לחשבון המחובר אין כעת חבילת פרסום או קמפיין פעיל.',
    more: 'פרטים נוספים', followup: 'אם צריך, אפשר לבדוק גם VIP, פרסום, תשלומים או חלק אחר של המערכת.',
  },
})


const PREMIUM_COPY = Object.freeze({
  en: {
    qcoinSecurityTitle: 'QCoin security check', checked: 'What was checked', currentBalance: 'Current balance',
    operations: 'Recent operations reviewed', outgoing: 'Outgoing operations found', pending: 'Operations still pending',
    period: 'Review period', conclusion: 'Conclusion', limitation: 'What remains unknown',
    noOutgoing: 'No outgoing operation was found in the available review window.',
    outgoingFound: 'Outgoing operations exist and require comparison with the time and amount you remember.',
    needScope: 'Add the approximate time and amount so the review can be narrowed safely.',
    packageTitle: 'Advertising package', package: 'Package', packageStatus: 'Package status', activated: 'Activated',
    expires: 'Valid until', daysLeft: 'Days remaining', campaignLimit: 'Campaign limit', used: 'Used', available: 'Available for new campaigns',
    exhausted: 'The package is active, but its campaign allowance is fully used. Zero available campaigns does not mean that the package is missing.',
    activeSummary: 'The advertising package is active.',
  },
  ru: {
    qcoinSecurityTitle: 'Проверка безопасности QCoin', checked: 'Что было проверено', currentBalance: 'Текущий баланс',
    operations: 'Проверено последних операций', outgoing: 'Найдено исходящих операций', pending: 'Операций в ожидании',
    period: 'Период проверки', conclusion: 'Вывод', limitation: 'Что пока не установлено',
    noOutgoing: 'В доступном периоде не найдено исходящих операций, которые подтверждают несанкционированное списание.',
    outgoingFound: 'В истории есть исходящие операции. Их нужно сопоставить с примерным временем и суммой, которую вы помните.',
    needScope: 'Укажите примерное время и сумму изменения — тогда проверка будет точнее и доказательнее.',
    packageTitle: 'Рекламный пакет', package: 'Пакет', packageStatus: 'Статус пакета', activated: 'Активирован',
    expires: 'Действует до', daysLeft: 'Осталось дней', campaignLimit: 'Лимит кампаний', used: 'Использовано', available: 'Доступно новых кампаний',
    exhausted: 'Пакет активен, но текущий лимит кампаний полностью использован. Ноль доступных кампаний не означает, что пакет отсутствует.',
    activeSummary: 'Рекламный пакет активен.',
  },
  uk: {
    qcoinSecurityTitle: 'Перевірка безпеки QCoin', checked: 'Що було перевірено', currentBalance: 'Поточний баланс',
    operations: 'Перевірено останніх операцій', outgoing: 'Знайдено вихідних операцій', pending: 'Операцій в очікуванні',
    period: 'Період перевірки', conclusion: 'Висновок', limitation: 'Що поки не встановлено',
    noOutgoing: 'У доступному періоді не знайдено вихідних операцій, які підтверджують несанкціоноване списання.',
    outgoingFound: 'В історії є вихідні операції. Їх потрібно зіставити з приблизним часом і сумою.',
    needScope: 'Додайте приблизний час і суму зміни, щоб звузити перевірку.',
    packageTitle: 'Рекламний пакет', package: 'Пакет', packageStatus: 'Статус пакета', activated: 'Активовано', expires: 'Діє до', daysLeft: 'Залишилось днів', campaignLimit: 'Ліміт кампаній', used: 'Використано', available: 'Доступно нових кампаній', exhausted: 'Пакет активний, але ліміт кампаній повністю використано. Нуль доступних кампаній не означає відсутність пакета.', activeSummary: 'Рекламний пакет активний.',
  },
})
function premiumCopy(locale='en') { return PREMIUM_COPY[locale] || PREMIUM_COPY.en }
function finite(value) { const n = Number(value); return Number.isFinite(n) ? n : null }
function dateRange(start='', end='', locale='en') {
  const a = start ? formatQl7SupportDate(start, locale) : ''
  const b = end ? formatQl7SupportDate(end, locale) : ''
  return [a, b].filter(Boolean).join(' — ')
}

function presentQcoinSecurity({ copy, evidence, lang, asOf }) {
  const pc = premiumCopy(lang)
  const checks = [pc.currentBalance, pc.operations, pc.outgoing, pc.pending].filter(Boolean)
  const facts = []
  if (evidence.accountFound === true) facts.push(pc.currentBalance)
  if (finite(evidence.ledgerOperationCount) !== null) facts.push(pc.operations)
  const unknowns = []
  if (evidence.amountProvided !== true) unknowns.push(lang === 'ru' ? 'Точная сумма изменения не указана.' : 'The exact amount was not provided.')
  if (evidence.timeScopeProvided !== true) unknowns.push(lang === 'ru' ? 'Точное время изменения не указано.' : 'The exact time was not provided.')
  const anomalies = finite(evidence.outgoingOperationCount) > 0 ? [pc.outgoingFound] : []
  const status = decideQl7EvidenceStatusV11_6({ claim: 'qcoin_security', checks, facts, unknowns, anomalies })
  const conclusion = finite(evidence.outgoingOperationCount) > 0 ? pc.outgoingFound : pc.noOutgoing
  const rows = sanitizeQl7EvidenceRowsV11_6([
    { key: 'currentBalance', label: pc.currentBalance, value: evidence.balance, tone: 'success' },
    { key: 'operationsReviewed', label: pc.operations, value: evidence.ledgerOperationCount, tone: 'neutral' },
    { key: 'outgoingFound', label: pc.outgoing, value: evidence.outgoingOperationCount, tone: finite(evidence.outgoingOperationCount) > 0 ? 'warning' : 'success' },
    { key: 'pendingLocalized', label: pc.pending, value: evidence.pendingOperationCount, tone: finite(evidence.pendingOperationCount) > 0 ? 'warning' : 'neutral' },
    { key: 'reviewPeriod', label: pc.period, value: dateRange(evidence.windowStart, evidence.windowEnd, lang), tone: 'neutral' },
    { key: 'checkedAt', label: copy.updated, value: formatQl7SupportDate(evidence.checkedAt || asOf, lang), tone: 'neutral' },
  ], lang)
  return Object.freeze({
    kind: 'data_table', locale: lang, title: pc.qcoinSecurityTitle,
    summary: conclusion, status: status.code, presentationState: status.tone,
    semanticIcon: status.semanticIcon, semanticTone: status.tone,
    badges: Object.freeze([{ label: status.label, tone: status.tone, icon: status.semanticIcon }]),
    facts: Object.freeze(facts), checks: Object.freeze(checks), anomalies: Object.freeze(anomalies),
    nextActions: Object.freeze(unknowns.length ? [pc.needScope] : []), metrics: Object.freeze([]),
    table: { columns: Object.freeze([{ key: 'label', label: pc.checked }, { key: 'value', label: copy.status }]), rows },
    actions: Object.freeze([{ id: 'open-wallet', routeId: 'wallet', label: copy.more, labelKey: 'more', iconKey: 'wallet', kind: 'secondary' }]),
    asOf, labels: Object.freeze({ facts: copy.facts, checks: pc.checked, anomalies: copy.attention, next: copy.next }),
    evidenceConclusion: conclusion, evidenceLimitations: Object.freeze(unknowns),
  })
}

function presentAdsPackage({ copy, evidence, lang, classification, asOf }) {
  const effectiveClassification = effectiveDiagnosticClassification(classification, evidence)
  const pc = premiumCopy(lang)
  const packageName = str(evidence.packageName || evidence.plan || evidence.tier)
  const packageStatus = str(evidence.packageStatus || evidence.status || (evidence.active === true ? 'active' : ''))
  const limit = finite(evidence.campaignLimit ?? evidence.maxCampaigns ?? evidence.maxCampaignsTotal)
  const used = finite(evidence.usedCampaigns ?? evidence.campaignsUsed ?? evidence.campaignCount)
  const available = finite(evidence.availableCampaigns ?? evidence.campaignsAvailable ?? (limit !== null && used !== null ? Math.max(0, limit - used) : null))
  const active = evidence.active === true || /active|актив/iu.test(packageStatus)
  const exhausted = active && available === 0 && limit !== null
  const rows = sanitizeQl7EvidenceRowsV11_6([
    { key: 'packageName', label: pc.package, value: packageName, tone: 'accent' },
    { key: 'packageStatusLocalized', label: pc.packageStatus, value: active ? 'active' : packageStatus, tone: active ? 'success' : 'warning' },
    { key: 'activatedAt', label: pc.activated, value: (evidence.activatedAt || evidence.startedAt) ? formatQl7SupportDate(evidence.activatedAt || evidence.startedAt, lang) : '', tone: 'neutral' },
    { key: 'expiresAt', label: pc.expires, value: (evidence.expiresAt || evidence.validUntil) ? formatQl7SupportDate(evidence.expiresAt || evidence.validUntil, lang) : '', tone: active ? 'success' : 'warning' },
    { key: 'daysLeft', label: pc.daysLeft, value: evidence.daysLeft, tone: active ? 'success' : 'warning' },
    { key: 'campaignLimit', label: pc.campaignLimit, value: limit, tone: 'neutral' },
    { key: 'usedCampaigns', label: pc.used, value: used, tone: 'neutral' },
    { key: 'availableCampaigns', label: pc.available, value: available, tone: exhausted ? 'warning' : 'success' },
    { key: 'checkedAt', label: copy.updated, value: formatQl7SupportDate(asOf, lang), tone: 'neutral' },
  ], lang)
  const summary = exhausted ? pc.exhausted : (active ? pc.activeSummary : copy[effectiveClassification])
  return Object.freeze({
    kind: 'data_table', locale: lang, title: pc.packageTitle, summary,
    status: active ? (exhausted ? 'partial' : 'healthy') : effectiveClassification,
    presentationState: exhausted ? 'cautious' : (active ? 'success' : 'warning'),
    semanticIcon: 'ads_package', semanticTone: exhausted ? 'warning' : 'analytics',
    badges: Object.freeze([{ label: packageName || pc.packageTitle, tone: active ? 'success' : 'warning', icon: 'ads_package' }]),
    facts: Object.freeze([]), checks: Object.freeze([pc.packageStatus, pc.campaignLimit]),
    anomalies: Object.freeze(exhausted ? [pc.exhausted] : []), nextActions: Object.freeze([]), metrics: Object.freeze([]),
    table: rows.length ? { columns: Object.freeze([{ key: 'label', label: copy.facts }, { key: 'value', label: copy.status }]), rows } : null,
    actions: Object.freeze([{ id: 'open-ads', routeId: 'ads', label: copy.more, labelKey: 'more', iconKey: 'bar-chart', kind: 'primary' }]),
    asOf, labels: Object.freeze({ facts: copy.facts, checks: copy.checks, anomalies: copy.attention, next: copy.next }),
  })
}

function classifyBranch(result = {}) {
  const branch = str(result?.specializedBranch || result?.branch || result?.status).toLowerCase()
  if (/unavailable|mongo|timeout|provider|failed/u.test(branch)) return 'unavailable'
  if (/no[_-]?(?:data|source)|missing|not[_-]?found|zero_records|inactive|not[_-]?active/u.test(branch)) return 'noData'
  if (/inconsistent|mismatch|anomal|expired|failed/u.test(branch)) return 'anomaly'
  return 'healthy'
}

function compactFact(label, value, locale, asOf = '') {
  const cleanValue = humanizeQl7SupportValue(value, locale)
  if (!str(label) || !cleanValue) return null
  return {
    label: str(label),
    value: cleanValue,
    asOf: asOf ? formatQl7SupportDate(asOf, locale) : '',
  }
}

function cleanList(values, locale) {
  return arr(values)
    .map((item) => {
      if (typeof item === 'string') return humanizeQl7SupportValue(item, locale)
      if (item && typeof item === 'object') {
        return applyQl7SupportAdultLanguagePolicy(
          item.label || item.message || item.title || item.value || '',
          { maxLength: 240 },
        )
      }
      return ''
    })
    .filter(Boolean)
    .slice(0, 8)
}

function metricLabel(key = '', locale = 'en') {
  return localizeQl7MetricV9(key, locale) || localizeQl7MetricV8(key, locale)
}

function metricRow(key, value, locale, tone = 'neutral') {
  if (value === null || value === undefined || value === '') return null
  const normalized = normalizeQl7MetricKeyV9(key) || key
  return {
    key: normalized,
    label: metricLabel(normalized, locale),
    value,
    format: ql7MetricFormatV9(normalized),
    tone,
  }
}
const UNAVAILABLE_CLASSIFICATION_RE = /^(?:unavailable|mongo_unavailable|provider_unavailable|provider_failure|timeout|source_unavailable)$/iu
const EVIDENCE_META_KEY_RE = /^(?:status|branch|source|sourceStatus|adapterId|error|errors|raw|query|collections|businessCollectionsRead|businessCollectionsWritten|unavailableSources|asOf|updatedAt|checkedAt|generatedAt|readOnly|ok)$/iu

function hasConcreteEvidenceValue(value, key = '') {
  if (EVIDENCE_META_KEY_RE.test(str(key).replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_'))) return false
  if (value === 0 || value === false) return true
  if (value === undefined || value === null || str(value) === '') return false
  if (Array.isArray(value)) return value.some((item) => hasConcreteEvidenceValue(item, key))
  if (typeof value === 'object') return Object.entries(value).some(([childKey, childValue]) => hasConcreteEvidenceValue(childValue, childKey))
  return true
}

function hasConcreteEvidence(evidence = {}) {
  if (!evidence || typeof evidence !== 'object') return false
  return Object.entries(evidence).some(([key, value]) => hasConcreteEvidenceValue(value, key))
}

function effectiveDiagnosticClassification(classification = '', evidence = {}) {
  const value = str(classification) || 'healthy'
  return UNAVAILABLE_CLASSIFICATION_RE.test(value) && hasConcreteEvidence(evidence) ? 'healthy' : value
}

function presentQcoinBalance({ copy, evidence, lang, asOf }) {
  const balance = evidence.balance ?? evidence.accountBalance
  const rows = [
    { key: 'balance', label: metricLabel('balance', lang), value: balance, tone: 'success' },
    { key: 'checkedAt', label: copy.updated, value: evidence.checkedAt || asOf, tone: 'neutral' },
  ].filter(Boolean)
  return Object.freeze({
    kind: 'data_table',
    locale: lang,
    title: copy.balanceTitle,
    summary: `${copy.balanceSummary} ${copy.followup}`,
    status: 'healthy',
    badges: Object.freeze([
      { label: 'QCoin', tone: 'success', icon: 'coin' },
    ]),
    facts: Object.freeze([]),
    checks: Object.freeze([]),
    anomalies: Object.freeze([]),
    nextActions: Object.freeze([]),
    metrics: Object.freeze([]),
    table: {
      columns: Object.freeze([
        { key: 'label', label: copy.facts },
        { key: 'value', label: copy.status },
      ]),
      rows: Object.freeze(rows),
    },
    actions: Object.freeze([{ id: 'open-wallet', routeId: 'wallet', label: copy.more, labelKey: 'more', iconKey: 'wallet', kind: 'primary' }]),
    asOf,
    labels: Object.freeze({ facts: copy.facts, checks: copy.checks, anomalies: copy.attention, next: copy.next }),
  })
}

function presentVip({ copy, diagnosticResult, lang, classification, asOf }) {
  const branch = str(diagnosticResult?.branch).toLowerCase()
  const active = branch === 'active' || diagnosticResult?.active === true
  const expired = branch === 'expired'
  const rows = [
    { key: 'vipStatus', label: copy.status, value: active ? copy.vipActiveSummary : (expired ? copy.vipExpiredSummary : copy.vipInactiveSummary), tone: active ? 'success' : 'warning' },
    active && diagnosticResult?.plan ? { key: 'plan', label: metricLabel('packageName', lang), value: diagnosticResult.plan, tone: 'success' } : null,
    diagnosticResult?.expiresAt ? { key: 'expiresAt', label: metricLabel('expiresAt', lang), value: diagnosticResult.expiresAt, tone: active ? 'success' : 'warning' } : null,
    active && Number.isFinite(Number(diagnosticResult?.daysLeft)) ? { key: 'remainingDays', label: lang === 'ru' ? 'Осталось дней' : (lang === 'uk' ? 'Залишилось днів' : 'Days left'), value: Number(diagnosticResult.daysLeft), tone: 'success' } : null,
    { key: 'checkedAt', label: copy.updated, value: asOf, tone: 'neutral' },
  ].filter(Boolean)
  return Object.freeze({
    kind: 'data_table',
    locale: lang,
    title: copy.vipTitle,
    summary: copy.followup,
    status: active ? 'healthy' : classification,
    badges: Object.freeze(active ? [{ label: 'VIP', tone: 'success', icon: 'crown' }] : [{ label: lang === 'ru' ? 'VIP не активен' : (lang === 'uk' ? 'VIP не активний' : 'VIP inactive'), tone: 'warning', icon: 'crown' }]),
    facts: Object.freeze([]),
    checks: Object.freeze([]),
    anomalies: Object.freeze([]),
    nextActions: Object.freeze([]),
    metrics: Object.freeze([]),
    table: {
      columns: Object.freeze([
        { key: 'label', label: copy.facts },
        { key: 'value', label: copy.status },
      ]),
      rows: Object.freeze(rows),
    },
    actions: Object.freeze([{ id: 'open-vip', routeId: 'vip', label: copy.more, labelKey: 'more', iconKey: 'crown', kind: active ? 'secondary' : 'primary' }]),
    asOf,
    labels: Object.freeze({ facts: copy.facts, checks: copy.checks, anomalies: copy.attention, next: copy.next }),
  })
}

function presentAds({ copy, evidence, lang, classification, asOf }) {
  const effectiveClassification = effectiveDiagnosticClassification(classification, evidence)
  if (
    str(evidence?.packageCount) === '0' &&
    str(evidence?.campaignCount) === '0'
  ) {
    return Object.freeze({
      kind: 'notice',
      locale: lang,
      title: copy.adsMissingTitle,
      summary: `${copy.adsMissingSummary} ${copy.followup}`,
      status: 'noData',
      badges: Object.freeze([]),
      facts: Object.freeze([]),
      checks: Object.freeze([]),
      anomalies: Object.freeze([]),
      nextActions: Object.freeze([]),
      metrics: Object.freeze([]),
      table: null,
      actions: Object.freeze([{ id: 'open-ads', routeId: 'ads', label: copy.more, labelKey: 'more', iconKey: 'bar-chart', kind: 'primary' }]),
      asOf,
      labels: Object.freeze({ facts: copy.facts, checks: copy.checks, anomalies: copy.attention, next: copy.next }),
    })
  }
  const campaignRows = Array.isArray(evidence.campaignRows) ? evidence.campaignRows : []
  const metrics = [
    metricRow('impressions', evidence.impressions, lang, 'success'),
    metricRow('clicks', evidence.clicks, lang),
    metricRow('ctr', evidence.ctr, lang),
    metricRow('campaignCount', evidence.campaignCount, lang),
    metricRow('packageCount', evidence.packageCount, lang),
    metricRow('metricsUpdatedAt', evidence.metricsUpdatedAt || asOf, lang),
  ].filter(Boolean)
  const rows = campaignRows.length
    ? campaignRows.flatMap((campaign, index) => [
      { key: `campaign-${index}-name`, label: `${metricLabel('campaignName', lang)} ${index + 1}`, value: campaign.campaignName || campaign.campaignId, tone: 'accent' },
      { key: `campaign-${index}-package`, label: metricLabel('packageName', lang), value: campaign.packageName || evidence.packageName },
      { key: `campaign-${index}-impressions`, label: metricLabel('impressions', lang), value: campaign.impressions, tone: 'success' },
      { key: `campaign-${index}-clicks`, label: metricLabel('clicks', lang), value: campaign.clicks },
      { key: `campaign-${index}-ctr`, label: metricLabel('ctr', lang), value: campaign.ctr },
      { key: `campaign-${index}-updated`, label: metricLabel('metricsUpdatedAt', lang), value: campaign.metricsUpdatedAt || evidence.metricsUpdatedAt || asOf },
    ].filter((row) => row.value !== null && row.value !== undefined && row.value !== ''))
    : metrics
  return Object.freeze({
    kind: 'data_table',
    locale: lang,
    title: `${copy.title}: ${getQl7SupportTopicLabel('ads_campaigns', lang)}`,
    summary: `${copy[effectiveClassification]} ${copy.followup}`,
    status: effectiveClassification,
    badges: Object.freeze([
      evidence.packageName ? { label: evidence.packageName, tone: 'neutral', icon: 'package' } : null,
      evidence.campaignName ? { label: evidence.campaignName, tone: 'success', icon: 'campaign' } : null,
    ].filter(Boolean)),
    facts: Object.freeze([]),
    checks: Object.freeze([]),
    anomalies: Object.freeze([]),
    nextActions: Object.freeze(effectiveClassification === 'healthy' ? [] : [copy.retry]),
    metrics: Object.freeze([]),
    table: rows.length ? {
      columns: Object.freeze([
        { key: 'label', label: copy.facts },
        { key: 'value', label: copy.status },
      ]),
      rows: Object.freeze(rows.slice(0, 32)),
    } : null,
    actions: Object.freeze([{ id: 'open-ads', routeId: 'ads', label: copy.more, labelKey: 'more', iconKey: 'bar-chart', kind: 'primary' }]),
    asOf,
    labels: Object.freeze({ facts: copy.facts, checks: copy.checks, anomalies: copy.attention, next: copy.next }),
  })
}

export function presentQl7SupportDiagnostic({
  requestContext = {},
  diagnosticResult = {},
  topic = '',
  locale = 'en',
} = {}) {
  const lang = normalizeQl7SupportLocale(locale)
  const copy = COPY[lang] || COPY.en
  const classification = classifyBranch(diagnosticResult)
  const resolvedTopic = normalizeQl7SupportTopic(topic || requestContext?.topic || requestContext?.route?.topic || requestContext?.analysis?.topic || 'support_system')
  const label = getQl7SupportTopicLabel(resolvedTopic, lang)
  const evidence = diagnosticResult?.evidence && typeof diagnosticResult.evidence === 'object' ? diagnosticResult.evidence : {}
  const effectiveClassification = effectiveDiagnosticClassification(classification, evidence)
  const asOf = diagnosticResult?.asOf || diagnosticResult?.updatedAt || new Date().toISOString()
  if (resolvedTopic === 'qcoin' && str(diagnosticResult?.branch) === 'qcoin_security_evidence') {
    const card = presentQcoinSecurity({ copy, evidence, lang, asOf })
    const presentation = { ...card }
    Object.defineProperty(presentation, 'card', { value: card, enumerable: false, writable: false, configurable: false })
    return Object.freeze(presentation)
  }
  if (resolvedTopic === 'qcoin' && str(diagnosticResult?.branch) === 'qcoin_balance_ok') {
    const card = presentQcoinBalance({ copy, evidence, lang, asOf })
    const presentation = { ...card }
    Object.defineProperty(presentation, 'card', { value: card, enumerable: false, writable: false, configurable: false })
    return Object.freeze(presentation)
  }
  if (resolvedTopic === 'vip' || diagnosticResult?.topic === 'vip') {
    const card = presentVip({ copy, diagnosticResult, lang, classification: effectiveClassification, asOf })
    const presentation = { ...card }
    Object.defineProperty(presentation, 'card', { value: card, enumerable: false, writable: false, configurable: false })
    return Object.freeze(presentation)
  }
  if (resolvedTopic === 'ads_packages' && (str(evidence.packageName || evidence.plan || evidence.tier) || evidence.active === true || str(evidence.packageStatus || evidence.status))) {
    const card = presentAdsPackage({ copy, evidence, lang, classification: effectiveClassification, asOf })
    const presentation = { ...card }
    Object.defineProperty(presentation, 'card', { value: card, enumerable: false, writable: false, configurable: false })
    return Object.freeze(presentation)
  }
  if (resolvedTopic === 'ads_campaigns' || resolvedTopic === 'ads_packages' || diagnosticResult?.topic === 'ads') {
    const card = presentAds({ copy, evidence, lang, classification: effectiveClassification, asOf })
    const presentation = { ...card }
    Object.defineProperty(presentation, 'card', { value: card, enumerable: false, writable: false, configurable: false })
    return Object.freeze(presentation)
  }
  const facts = [
    Number.isFinite(Number(evidence.rowsFound)) ? compactFact(copy.rows, String(evidence.rowsFound), lang, asOf) : null,
    compactFact(copy.status, copy[effectiveClassification], lang, asOf),
    compactFact(copy.updated, formatQl7SupportDate(asOf, lang), lang),
  ].filter(Boolean)

  const rows = []
  for (const [key, value] of Object.entries(evidence)) {
    if (['rowsFound', 'raw', 'documents', 'query', 'collections', 'adapterId', 'status', 'branch', 'ok', 'readOnly', 'error', 'errors', 'source', 'sourceStatus', 'unavailableSources', 'businessCollectionsRead', 'businessCollectionsWritten'].includes(key)) continue
    if (value === null || value === undefined || value === '' || typeof value === 'object') continue
    rows.push({
      key,
      label: metricLabel(key, lang),
      value,
    })
  }

  const card = Object.freeze({
    kind: rows.length ? 'data_table' : 'diagnostic',
    locale: lang,
    title: label ? `${copy.title}: ${label}` : copy.title,
    summary: copy[effectiveClassification],
    status: effectiveClassification,
    facts: Object.freeze(facts),
    checks: Object.freeze(cleanList(diagnosticResult?.checks, lang)),
    anomalies: Object.freeze(cleanList(diagnosticResult?.anomalies, lang)),
    nextActions: Object.freeze(effectiveClassification === 'unavailable' || effectiveClassification === 'noData' ? [copy.retry] : []),
    table: rows.length ? {
      columns: Object.freeze([
        { key: 'label', label: copy.facts },
        { key: 'value', label: copy.status },
      ]),
      rows: sanitizeQl7EvidenceRowsV11_6(rows.slice(0, 20), lang),
    } : null,
    asOf,
    labels: Object.freeze({
      facts: copy.facts, checks: copy.checks, anomalies: copy.attention, next: copy.next,
    }),
  })
  const presentation = { ...card }
  Object.defineProperty(presentation, 'card', {
    value: card,
    enumerable: false,
    writable: false,
    configurable: false,
  })
  return Object.freeze(presentation)
}
