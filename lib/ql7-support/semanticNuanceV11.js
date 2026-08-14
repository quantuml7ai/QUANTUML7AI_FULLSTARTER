function str(value) { return String(value ?? '').trim() }
function norm(value = '') {
  return str(value).normalize('NFKC').toLowerCase().replace(/[’`]/gu, "'").replace(/\s+/gu, ' ').trim()
}
function has(pattern, value) { return pattern.test(value) }

const SELF = /(?:^|[^\p{L}\p{N}_])(?:мой|моя|моё|мое|мои|моего|моей|мою|моим|моём|моем|у\s+меня|мiй|мій|моя|мої|мого|моїм|моєму|моєю|у\s+мене|my|mine|own|mi|mis|mío|mía|benim|hesabım|paketim|رصيدي|حسابي|حزمتي|باقتي|إعلاني|我的|我自己的|我的账户|שלי|החשבון\s+שלי)(?=$|[^\p{L}\p{N}_])/iu
const STATUS = /(?:состоян\p{L}*|статус\p{L}*|сейчас|зараз|жив\p{L}*|законч\p{L}*|скінч\p{L}*|діє|чинн\p{L}*|актив\p{L}*|остат\p{L}*|остал\p{L}*|срок\p{L}*|истека\p{L}*|проверь\p{L}*|покажи\p{L}*|стан\p{L}*|активн\p{L}*|залиш\p{L}*|термін\p{L}*|status|state|active|remaining|left|expiry|expires?|check|show|what'?s\s+up\s+with|estado|activo|queda|vence|durum|aktif|kaldı|bitiş|حالة|نشط|متبقي|ينتهي|状态|有效|剩余|到期|סטטוס|פעיל|נותר|תוקף)/iu
const BUY = /(?:куп\p{L}*|приобр\p{L}*|оформ\p{L}*|подключ\p{L}*|запуст\p{L}*|как\s+(?:взять|получить|купить)|варт\p{L}*|придбат\p{L}*|підключ\p{L}*|buy|purchase|order|subscribe|activate|start|launch|how\s+do\s+i\s+get|how\s+to\s+get|compr\p{L}*|contratar|activar|satın\s+al|satin\s+al|etkinleştir|شراء|اشتر|أشتر|أشتري|اشتري|تفعيل|购买|开通|קנ\p{L}*|רכוש\p{L}*|רוכש\p{L}*|הפעל\p{L}*)/iu
const NEGATED_ACTIVATION = /(?:не\s+(?:активир\p{L}*|включ\p{L}*|подключ\p{L}*)|не\s+активовано|did\s+not\s+activat\p{L}*|doesn['’]?t\s+activat\p{L}*|not\s+activat(?:e|ed|ing)?|failed\s+to\s+activat\p{L}*|still\s+inactive|no\s+se\s+activ\p{L}*|no\s+est[aá]\s+activ\p{L}*|etkinleşmedi|aktif\s+olmadı|لم\s+يتم\s+التفعيل|غير\s+مفع[ّ]?ل|未激活|没有激活|לא\s+הופעל|לא\s+פעיל)/iu
const BENEFIT = /(?:что\s+(?:даст|дает)|зачем|польз\p{L}*|выгод\p{L}*|преимущ\p{L}*|охват\p{L}*|що\s+(?:дасть|дає)|корист\p{L}*|переваг\p{L}*|what\s+(?:does|will)\s+it\s+give|why\s+(?:buy|use)|benefits?|advantages?|value|reach|qué\s+aporta|beneficios?|ventajas?|ne\s+işe\s+yarar|avantaj|ماذا\s+يعطي|فوائد|مزايا|有什么用|好处|优势|מה\s+זה\s+נותן|יתרונות)/iu
const METRICS = /(?:метрик\p{L}*|статистик\p{L}*|(?:^|[^\p{L}\p{N}_])стат(?:а|е|у|ы|ка|ку|ки)?(?=$|[^\p{L}\p{N}_])|аналитик\p{L}*|результат\p{L}*|показ\p{L}*|просмотр\p{L}*|клик\p{L}*|охват\p{L}*|конверс\p{L}*|витрат\p{L}*|(?:^|[^\p{L}\p{N}_])(?:metrics?|stats?|statistics|analytics?|performance|results?|impressions?|views?|clicks?|reach|ctr|conversion|spend)(?=$|[^\p{L}\p{N}_])|estad[ií]sticas?|m[eé]tricas?|rendimiento|impresiones|clics|istatistik|metrik|gösterim|tıklama|إحصائيات|مقاييس|نتائج|مرات\s+الظهور|نقرات|数据|指标|统计|展示|点击|נתונים|מדדים|סטטיסטיק\p{L}*|חשיפות|קליקים)/iu
const PACKAGE = /(?:рекламн\p{L}*\s+пакет\p{L}*|пакет\p{L}*\s+реклам\p{L}*|пакет\p{L}*|тариф\p{L}*|план\p{L}*|рекламн\p{L}*\s+тариф\p{L}*|рекламн\p{L}*\s+план\p{L}*|ad(?:vertising)?\s+(?:package|plan|bundle|tier)s?|package|plan|bundle|paquete\s+(?:de\s+)?publicidad|paquete|plan\s+publicitario|reklam\s+paketi|paket|حزمة\s+إعلانية|باقة\s+إعلانية|حزمتي|باقتي|حزمة|باقة|广告套餐|推广套餐|套餐|חבילת\s+ה?פרסום|חביל\p{L}*)/iu
const CAMPAIGN = /(?:рекламн\p{L}*\s+кампан\p{L}*|кампан\p{L}*|объявлен\p{L}*|рекламн\p{L}*\s+размещ\p{L}*|(?:^|[^\p{L}\p{N}_])(?:ad|ads|campaign|campaigns)(?=$|[^\p{L}\p{N}_])|advertis\p{L}*|publicidad|campaña|anuncio|reklam\s+kampanyası|kampanya|إعلان|إعلاني\p{L}*|حملة\s+إعلانية|حملتي|广告活动|推广活动|广告|קמפיין\s+פרסום|קמפיין|פרסום)/iu
const GENERIC_AD = /(?:реклам\p{L}*|(?:^|[^\p{L}\p{N}_])(?:ad|ads)(?=$|[^\p{L}\p{N}_])|advertis\p{L}*|publicidad|reklam\p{L}*|إعلان|إعلاني\p{L}*|广告|פרסום)/iu

const METRICS_REJECTION = /(?:без\s+(?:метрик\p{L}*|аналитик\p{L}*|статистик\p{L}*)|не\s+(?:про\s+)?(?:метрик\p{L}*|аналитик\p{L}*|статистик\p{L}*)|skip\s+(?:the\s+)?(?:metrics?|stats?|analytics?)|no\s+(?:metrics?|stats?|analytics?)|without\s+(?:metrics?|stats?|analytics?)|sin\s+(?:m[eé]tricas?|estad[ií]sticas?|anal[ií]tica)|(?:(?:metrik|istatistik)\s+değil|(?:metrik|istatistik)(?:leri)?\s+istemiyorum)|لا\s+(?:أريد|اريد)\s+(?:المقاييس|الإحصائيات)|不要[^。！？!?]{0,20}(?:数据|指标|统计)|בלי\s+(?:מדדים|סטטיסטיקה|ניתוח))/iu
const PACKAGE_REJECTION = /(?:не\s+(?:про\s+)?пакет\p{L}*|not\s+(?:the\s+)?(?:package|plan|bundle)|no\s+el\s+paquete|paket\s+değil|ليس\s+الحزمة|不是套餐|לא\s+החבילה)/iu
const CREATE = /(?:созда\p{L}*|настро\p{L}*|таргет\p{L}*|геотаргет\p{L}*|аудитор\p{L}*|креатив\p{L}*|create|set\s*up|configure|target|audience|creative|crear|configurar|segmentar|oluştur|hedefle|إنشاء|إعداد|استهداف|创建|设置|定向|צור|הגדר|טרגט)/iu

const BALANCE = /(?:баланс\p{L}*|балик|бабк\p{L}*|остаток|сколько\s+(?:денег|qcoin)|balance|how\s+much|saldo|bakiye|رصيد|余额|יתרת?\p{L}*)/iu
const QCOIN = /(?:q\s*coin|qcoin|кьюкоин|кью\s*коин|кюкоин|كيو\s*كوين|q币|קיו\s*קוין)/iu
const WALLET = /(?:quantum\s+wallet|кошел\p{L}*|wallet|billetera|cüzdan|محفظة|محفظت\p{L}*|钱包|ארנק)/iu
const SESSION = /(?:подключ\p{L}*|сесси\p{L}*|авторизац\p{L}*|адрес\p{L}*|connect|session|sign\s*in|address|conectar|sesión|bağla|oturum|ربط|جلسة|عنوان|连接|会话|地址|חיבור|סשן|כתובת)/iu
const PAYMENT = /(?:плат[её]ж\p{L}*|оплат\p{L}*|сч[её]т\p{L}*|инвойс\p{L}*|чек\p{L}*|payment|invoice|receipt|charge|pago|factura|ödeme|fatura|دفع|فاتورة|إيصال|付款|账单|收据|תשלום|חשבונית|קבלה)/iu
const VIP = /(?:^|[^\p{L}\p{N}_])(?:vip|vip\s*plus|вип|вип\s*плюс|اشتراك\s+vip|会员|מנוי\s+vip)(?=$|[^\p{L}\p{N}_])/iu
const REPORT = /(?:жалоб\p{L}*|репорт\p{L}*|скарг\p{L}*|reports?|complaints?|reporte|queja|şikayet|بلاغ|举报|דיווח|תלונה)/iu
const APPEAL = /(?:обжал\p{L}*|апелляц\p{L}*|оспор\p{L}*|оскарж\p{L}*|appeal|contest|impugnar|apel\p{L}*|itiraz|استئناف|اعتراض|申诉|ערעור|לערער)/iu
const WHO_REPORTED = /(?:кто[^.!?\n]{0,48}(?:пожаловал\p{L}*|зарепортил\p{L}*)|кто\s+написал\s+жалоб|хто\s+поскаржив|who\s+reported|who\s+filed|qui[eé]n\s+report|kim\s+şikayet|من\s+أبلغ|谁举报|מי\s+דיווח)/iu

function result(topic, subIntent, confidence, evidence, extra = {}) {
  return Object.freeze({ topic, subIntent, confidence, evidence: Object.freeze((Array.isArray(evidence) ? evidence : []).filter(Boolean)), ...extra })
}

export function classifyQl7SupportSemanticNuanceV11(text = '', { previousTopic = '' } = {}) {
  const source = norm(text)
  if (!source) return null
  const self = has(SELF, source)
  const status = has(STATUS, source)
  const buy = has(BUY, source) && !has(NEGATED_ACTIVATION, source)
  const benefit = has(BENEFIT, source)
  const metricsRejected = has(METRICS_REJECTION, source)
  const packageRejected = has(PACKAGE_REJECTION, source)
  const metrics = has(METRICS, source) && !metricsRejected
  const packageMention = has(PACKAGE, source) && !packageRejected
  const campaignMention = has(CAMPAIGN, source)
  const adMention = has(GENERIC_AD, source)
  const previousAds = ['ads_packages', 'ads_campaigns'].includes(str(previousTopic))

  // An explicit purchase verb outranks incidental benefit or reach wording.
  if (buy && (adMention || packageMention || campaignMention)) {
    return result('ads_packages', 'ads_packages_purchase', 0.996, ['nuance:ads_purchase'])
  }
  // Metrics always describe campaign performance, unless the user explicitly rejected metrics.
  if (metrics && (campaignMention || adMention || previousAds)) {
    return result('ads_campaigns', 'ads_campaigns_metrics', 0.997, ['nuance:ads_metrics', self ? 'nuance:self' : 'nuance:informational'])
  }
  // Package lifecycle/status is separate from campaign statistics.
  if (packageMention && (status || self || previousAds) && !metrics) {
    return result('ads_packages', 'ads_packages_self_status', adMention || previousAds ? 0.996 : 0.972, ['nuance:ads_package_status', adMention ? 'nuance:ads_anchor' : 'nuance:ecosystem_package', metricsRejected ? 'nuance:metrics_rejected' : ''])
  }
  if (benefit && (adMention || packageMention || campaignMention)) {
    return result('ads_packages', 'ads_packages_benefits', 0.994, ['nuance:ads_benefits'])
  }
  if (campaignMention && status && !metrics && !buy && !benefit) {
    return result('ads_campaigns', 'ads_campaigns_self_status', self ? 0.993 : 0.976, ['nuance:ads_campaign_status', self ? 'nuance:self' : 'nuance:status'])
  }
  if (has(CREATE, source) && (adMention || campaignMention)) {
    return result('ads_campaigns', 'ads_campaigns_create', 0.992, ['nuance:ads_campaign_create'])
  }

  if (has(QCOIN, source) && has(BALANCE, source)) return result('qcoin', 'qcoin_balance', 0.997, ['nuance:qcoin_balance'])
  if (has(WALLET, source) && has(SESSION, source)) return result('wallet', 'wallet_connection_status', 0.995, ['nuance:wallet_connection'])
  if (has(PAYMENT, source)) return result('payments', status || self ? 'payments_self_status' : (buy ? 'payments_how_to' : 'payments_general'), 0.991, ['nuance:payments'])
  if (has(VIP, source)) {
    if (status || self) return result('vip', 'vip_self_status', 0.995, ['nuance:vip_status'])
    if (buy) return result('vip', 'vip_purchase', 0.993, ['nuance:vip_purchase'])
    if (benefit) return result('vip', 'vip_benefits', 0.993, ['nuance:vip_benefits'])
  }
  if (has(WHO_REPORTED, source)) return result('moderation', 'moderation_reporter_privacy', 0.997, ['nuance:reporter_privacy'])
  if (has(APPEAL, source)) return result('moderation', 'moderation_appeal', 0.995, ['nuance:moderation_appeal'])
  if (has(REPORT, source) && (status || self || /сколько|how\s+many|cu[aá]nt|kaç|كم|多少|כמה/iu.test(source))) return result('moderation', 'moderation_report_count', 0.994, ['nuance:report_count'])

  return null
}

export function listQl7SupportSemanticNuanceFamiliesV11() {
  return Object.freeze([
    'ads_packages_status', 'ads_packages_purchase', 'ads_packages_benefits', 'ads_campaign_metrics',
    'ads_campaign_status', 'ads_campaign_create', 'qcoin_balance', 'wallet_connection', 'payments',
    'vip_status', 'vip_purchase', 'vip_benefits', 'moderation_report_count', 'moderation_appeal', 'moderation_reporter_privacy',
  ])
}
