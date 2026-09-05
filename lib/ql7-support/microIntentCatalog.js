
import {normalizeQl7HumanInput} from './inputNormalization.js'
function str(value){return String(value??'').trim()}
function b(source){return new RegExp(`(?:^|[^\\p{L}\\p{N}_])(?:${source})(?=$|[^\\p{L}\\p{N}_])`,'iu')}

const OPERATIONS=Object.freeze([
  ['overview','what_is'],['location','where_open'],['start','how_start'],['usage','how_use'],['status','status_current'],['eligibility','eligibility'],['price','pricing'],['benefits','benefits'],['limits','limits'],['accuracy','accuracy'],['evidence','evidence'],['history','history'],['security','security'],['privacy','privacy'],['error','error'],['not_working','not_working'],['slow','slow'],['missing','missing'],['compare','compare'],['cancel','cancel'],['retry','retry'],['operator','operator'],['rules','rules'],['next_step','next_step'],
])
const DOMAINS=Object.freeze([
  ['homepage','homepage'],['messenger','messenger'],['support_system','support_system'],['forum_feed','forum_feed'],['forum_threads','forum_threads'],['media','media'],['search','search'],['geodetect','geodetect'],['moderation','moderation'],['profile','profile'],['quantum_family','quantum_family'],['subscriptions','subscriptions'],['vip','vip'],['qcoin','qcoin'],['wallet','wallet'],['payments','payments'],['battlecoin','battlecoin'],['exchange','exchange'],['exchange_ai','exchange_ai'],['battle_chat','battle_chat'],['metamarket','metamarket'],['metastudio','metastudio'],['academy','academy'],['quests','quests'],['ads_packages','ads_packages'],['ads_campaigns','ads_campaigns'],['ads_metrics','ads_campaigns'],['push','push'],['telegram','telegram'],['android','android'],['localization','localization'],['privacy','privacy'],['account_deletion','account_deletion'],['security','security'],['fraud','security'],['technical','support_system'],['contact','contact'],['roadmap','roadmap'],['rules','moderation'],['identity','support_system'],['social','support_system'],['gameverse','gameverse'],['futures','futures'],
])
export const QL7_PREMIUM_MICRO_INTENT_COUNT=DOMAINS.length*OPERATIONS.length
export const QL7_PREMIUM_MICRO_INTENTS=Object.freeze(DOMAINS.flatMap(([domain,topic])=>OPERATIONS.map(([goal,operation],index)=>Object.freeze({id:`${domain}.${goal}`,domain,topic,goal,operation,ordinal:index+1}))))

const DOMAIN_RULES=Object.freeze([
  ['identity','support_system',/(?:кто\s+ты|что\s+ты\s+такое|твоя\s+мисси|who\s+are\s+you|what\s+are\s+you|your\s+mission|quien\s+eres|sen\s+kimsin|من\s+أنت|你是谁|מי\s+אתה)/iu],
  ['social','support_system',/(?:просто\s+поболта|давай\s+поговор|как\s+дела|small\s+talk|just\s+chat|charlemos|sohbet|نتحدث|聊聊天|בוא\s+נדבר)/iu],
  ['homepage','homepage',/(?:главн\p{L}*\s+страниц|homepage|home\s+page|página\s+principal|ana\s+sayfa|الصفحة\s+الرئيسية|主页|דף\s+הבית)/iu],
  ['messenger','messenger',/(?:quantum\s+messenger|квантум\s+мессенджер|личн\p{L}*\s+сообщ|direct\s+messages?|mensajes\s+directos|özel\s+mesaj|رسائل\s+خاصة|私信|הודעות\s+פרטיות)/iu],
  ['support_system','support_system',/(?:ql7\s+support|служб\p{L}*\s+поддерж|support\s+system|soporte|destek\s+sistemi|نظام\s+الدعم|支持系统|מערכת\s+תמיכה)/iu],
  ['exchange_ai','exchange_ai',/(?:ai\s*(?:box|analytics?|analysis|signals?)|exchange\s*ai|аи\s*(?:бокс|аналитик\p{L}*)|ай\s*(?:бокс|аналитик\p{L}*)|ии\s*(?:бокс|аналитик\p{L}*)|аналитик\p{L}*\s+на\s+бирж|birja\s*ai|anal[ií]tica\s+de\s+ia|yapay\s+zeka\s+analiz|تحليل\s+الذكاء|交易所\s*ai|ai\s*分析|ניתוח\s*ai)/iu],
  ['battle_chat','battle_chat',/(?:battle\s*chat|боев\p{L}*\s+чат|батл\s*чат|战斗聊天|צ.?אט\s+קרב)/iu],
  ['battlecoin','battlecoin',/(?:battle\s*coin|battlecoin|батлкоин|عملة\s+المعركة|战斗币|באטלקוין)/iu],
  ['ads_metrics','ads_campaigns',/(?:метрик\p{L}*|статистик\p{L}*|показ\p{L}*|клик\p{L}*|ctr|impressions?|clicks?|metrics?|statistics?|analytics?|estad[ií]sticas?|m[eé]tricas?|istatistik|إحصائيات|统计|מדדים)/iu],
  ['ads_packages','ads_packages',/(?:рекламн\p{L}*\s+(?:пакет|тариф|план)|(?:ads?|advertising)\s+(?:package|plan|bundle)|paquete\s+(?:publicitario|de\s+publicidad)|reklam\s+paketi|حزمة\s+إعلانية|广告套餐|חבילת\s+(?:ה)?פרסום)/iu],
  ['ads_campaigns','ads_campaigns',/(?:рекламн\p{L}*\s+кампан|campaign|campaña|kampanya|حملة\s+إعلانية|广告活动|קמפיין)/iu],
  ['qcoin','qcoin',/(?:q\s*[- ]?coin|qcoin|кьюкоин|кюкоин|q币|קיו\s*קוין)/iu],
  ['wallet','wallet',/(?:quantum\s+wallet|кошел\p{L}*|wallet|cüzdan|محفظة|钱包|ארנק)/iu],
  ['payments','payments',/(?:плат[её]ж\p{L}*|оплат\p{L}*|invoice|payment|factura|ödeme|دفع|付款|תשלום)/iu],
  ['vip','vip',/(?:^|[^a-z0-9_])(?:vip(?:\s*plus)?|вип)(?=$|[^a-z0-9_])/iu],
  ['moderation','moderation',/(?:модерац\p{L}*|жалоб\p{L}*|репорт\p{L}*|appeal|moderation|şikayet|بلاغ|举报|דיווח)/iu],
  ['forum_threads','forum_threads',/(?:ветк\p{L}*|тред\p{L}*|thread|שרשור|论坛主题)/iu],
  ['forum_feed','forum_feed',/(?:лент\p{L}*\s+форум|forum\s+feed|пост\p{L}*\s+в\s+лент|论坛动态|פיד\s+פורום)/iu],
  ['media','media',/(?:медиа\s+лента|видео\s+в\s+форум|qcast|forum\s+media|video\s+feed|媒体流|מדיה\s+בפורום)/iu],
  ['search','search',/(?:поиск\p{L}*|search|buscar|arama|بحث|搜索|חיפוש)/iu],
  ['geodetect','geodetect',/(?:geodetect|геодетект|геолокац|гео\s*сорт|location\s+detect|地理定位|זיהוי\s+מיקום)/iu],
  ['profile','profile',/(?:профил\p{L}*|никнейм|аватар|profile|nickname|avatar|个人资料|פרופיל)/iu],
  ['quantum_family','quantum_family',/(?:quantum\s+family|квантум\s+фемил|подписчик\p{L}*|followers?|关注者|עוקבים)/iu],
  ['subscriptions','subscriptions',/(?:подписк\p{L}*|subscription|suscripci[oó]n|abonelik|اشتراك|订阅|מנוי)/iu],
  ['metamarket','metamarket',/(?:metamarket|метамаркет|подарок|gift|marketplace|元市场|מטאמרקט)/iu],
  ['metastudio','metastudio',/(?:metastudio|метастуди|студи\p{L}*\s+игр|元工作室|מטאסטודיו)/iu],
  ['academy','academy',/(?:academy|академ\p{L}*|курс\p{L}*|экзамен\p{L}*|学院|אקדמיה)/iu],
  ['quests','quests',/(?:^|[^\p{L}\p{N}_])(?:quests?|квест\p{L}*|задани\p{L}*|任务|משימה)(?=$|[^\p{L}\p{N}_])/iu],
  ['push','push',/(?:push|уведомлен\p{L}*|notification|bildirim|إشعار|通知|התראה)/iu],
  ['android','android',/(?:android\s+(?:app|shell)|андроид\p{L}*\s+(?:прилож|оболоч)|تطبيق\s+أندرويد|安卓应用|אפליקציית\s+אנדרואיד)/iu],
  ['telegram','telegram',/(?:telegram|телеграм|tma|mini\s*app|تيليغرام|电报|טלגרם)/iu],
  ['localization','localization',/(?:deep\s*translate|перевод\p{L}*|локализац\p{L}*|translation|çeviri|ترجمة|翻译|תרגום)/iu],
  ['privacy','privacy',/(?:конфиденциальн\p{L}*|privacy|gizlilik|خصوصية|隐私|פרטיות)/iu],
  ['account_deletion','account_deletion',/(?:удал\p{L}*\s+аккаунт|delete\s+(?:my\s+)?account|hesab\p{L}*\s+sil|حذف\s+الحساب|删除账户|מחיקת\s+חשבון)/iu],
  ['security','security',/(?:безопасн\p{L}*|взлом\p{L}*|security|hack|güvenlik|اختراق|安全|אבטחה)/iu],
  ['fraud','security',/(?:меня\s+(?:обманул\p{L}*|мошеннически\s+списал\p{L}*)|мошенническ\p{L}*\s+(?:операц\p{L}*|плат[её]ж\p{L}*|списан\p{L}*)|фрод\s+(?:операц\p{L}*|плат[её]ж\p{L}*|списан\p{L}*)|(?:i\s+(?:was|got)|we\s+were)\s+scammed|scammed\s+me|fraud(?:ulent)?\s+(?:transaction|payment|charge|activity)|account\s+fraud|me\s+estafaron|transacci[oó]n\s+fraudulenta|dolandırıldım|sahte\s+işlem|تعرضت\s+لاحتيال|معاملة\s+احتيالية|我被骗了|欺诈交易|רימו\s+אותי|עסקה\s+הונאתית)/iu],
  ['technical','support_system',/(?:техническ\p{L}*\s+(?:ошиб|проблем|диагност)|technical\s+(?:error|issue|diagnostic)|خطأ\s+تقني|技术问题|תקלה\s+טכנית)/iu],
  ['rules','moderation',/(?:правил\p{L}*\s+(?:форум|сообществ)|community\s+rules|forum\s+rules|reglas\s+de\s+la\s+comunidad|topluluk\s+kuralları|قواعد\s+المجتمع|社区规则|כללי\s+הקהילה)/iu],
  ['contact','contact',/(?:партн[её]р\p{L}*|инвестиц\p{L}*|contact|partnership|investment|合作|שותפות)/iu],
  ['roadmap','roadmap',/(?:roadmap|дорожн\p{L}*\s+карт|когда\s+запуск|路线图|מפת\s+דרכים)/iu],
  ['gameverse','gameverse',/(?:gameverse|геймверс|игров\p{L}*\s+мир|游戏宇宙|גיימברס)/iu],
  ['futures','futures',/(?:futures|фьючерс\p{L}*|дериватив|期货|חוזים\s+עתידיים)/iu],
  ['exchange','exchange',/(?:quantum\s+exchange|бирж\p{L}*|exchange|стакан\p{L}*|ордер\p{L}*|交易所|בורסה)/iu],
])
const GOAL_RULES=Object.freeze([
  ['accuracy',/(?:насколько\s+точн|точност\p{L}*|accuracy|confidence|precisi[oó]n|doğruluk|دقة|准确|דיוק)/iu],
  ['usage',/(?:как\s+(?:(?:им|этим|ею|ей)\s+)?(?:пользоваться|использовать|работать)|how\s+(?:to\s+)?use|cómo\s+usar|nasıl\s+kullan|كيف\s+أستخدم|怎么用|איך\s+משתמש)/iu],
  ['location',/(?:где\s+(?:найти|открыть|находится)|where\s+(?:is|open|find)|d[oó]nde|nerede|أين|在哪里|איפה)/iu],
  ['start',/(?:как\s+(?:начать|запустить|создать)|how\s+(?:to\s+)?(?:start|create|launch)|созда\p{L}*|запуст\p{L}*)/iu],
  ['status',/(?:статус\p{L}*|состояни\p{L}*|актив\p{L}*|действует|status|state|active|estado|durum|حالة|状态|סטטוס)/iu],
  ['history',/(?:истори\p{L}*|последн\p{L}*\s+операц|history|ledger|historial|geçmiş|سجل|历史|היסטוריה)/iu],
  ['evidence',/(?:доказатель\p{L}*|что\s+провер|почему\s+такой\s+вывод|evidence|proof|what\s+was\s+checked|证据|ראיות)/iu],
  ['security',/(?:безопасн\p{L}*|украл\p{L}*|пропал\p{L}*|списал\p{L}*|взлом\p{L}*|security|secure|stolen|unauthorized|盗|גנב)/iu],
  ['eligibility',/(?:доступен\p{L}*\s+ли|могу\s+ли\s+получ|право\s+на|eligible|eligibility|can\s+i\s+get|elegible|uygun\s+mu|مؤهل|是否有资格|זכאות)/iu],
  ['error',/(?:код\s+ошибк|ошибка\s+\d+|error\s+code|exception|código\s+de\s+error|hata\s+kodu|رمز\s+الخطأ|错误代码|קוד\s+שגיאה)/iu],
  ['not_working',/(?:не\s+работает|ошибка|сломал\p{L}*|doesn'?t\s+work|not\s+working|error|не\s+открывается|无法|לא\s+עובד)/iu],
  ['slow',/(?:медлен\p{L}*|долго|slow|taking\s+long|lent|yavaş|بطيء|很慢|איטי)/iu],
  ['price',/(?:цен\p{L}*|сколько\s+стоит|price|cost|precio|fiyat|سعر|价格|מחיר)/iu],
  ['benefits',/(?:зачем|что\s+да[её]т|преимущ\p{L}*|benefit|advantage|qué\s+da|avantaj|فائدة|好处|יתרון)/iu],
  ['limits',/(?:лимит\p{L}*|ограничен\p{L}*|limit|quota|sınır|حد|限制|מגבלה)/iu],
  ['compare',/(?:сравн\p{L}*|разниц\p{L}*|compare|difference|comparar|fark|مقارنة|区别|השוואה)/iu],
  ['privacy',/(?:кто\s+видит|конфиденциальн\p{L}*|privacy|who\s+can\s+see|隐私|פרטיות)/iu],
  ['rules',/(?:правил\p{L}*|можно\s+ли|rules|allowed|reglas|kurallar|قواعد|规则|כללים)/iu],
  ['operator',/(?:оператор\p{L}*|человек\p{L}*\s+поддерж|human\s+agent|operator|人工客服|נציג)/iu],
  ['cancel',/(?:отмен\p{L}*|закрыть|cancel|stop|iptal|إلغاء|取消|בטל)/iu],
  ['retry',/(?:повтор\p{L}*|заново|retry|again|tekrar|أعد|重试|נסה\s+שוב)/iu],
  ['missing',/(?:нет|пропал\p{L}*|не\s+вижу|missing|not\s+found|yok|مفقود|找不到|חסר)/iu],
  ['next_step',/(?:что\s+дальше|следующ\p{L}*\s+шаг|next\s+step|what\s+next|下一步|מה\s+הלאה)/iu],
  ['overview',/(?:что\s+такое|расскажи\p{L}*|объясни\p{L}*|what\s+is|explain|qué\s+es|nedir|ما\s+هو|是什么|מה\s+זה)/iu],
])

export function classifyQl7PremiumMicroIntent(text='', { previousTopic='' }={}) {
  const prepared=normalizeQl7HumanInput(text)
  const source=prepared.variants.join('\n')
  if(!source)return null
  let domain=null,topic=''
  const domainMatches=[]
  for(const row of DOMAIN_RULES){if(row[2].test(source))domainMatches.push(row)}
  const metricsRejected=/(?:без\s+(?:метрик|аналитик|статистик)|не\s+(?:метрики|аналитика|статистика)|no\s+(?:metrics|analytics|statistics)|without\s+(?:metrics|analytics)|sin\s+(?:métricas|metricas|estadísticas|estadisticas)|metrik\s+değil|لا\s+(?:أريد|تظهر).*إحصائ|不要.*(?:指标|统计)|בלי\s+מדדים)/iu.test(source)
  const packageWhenMetricsRejected=metricsRejected ? domainMatches.find((row)=>row[0]==='ads_packages') : null
  const explicitVip=domainMatches.find((row)=>row[0]==='vip')
  const materialMatch=packageWhenMetricsRejected || explicitVip || domainMatches.find((row)=>!['social','identity','support_system'].includes(row[0]))
  const selectedDomain=materialMatch || domainMatches[0]
  if(selectedDomain){domain=selectedDomain[0];topic=selectedDomain[1]}
  const pureSocial = /^(?:привет|здравствуй\p{L}*|доброе?\s+(?:утро|день)|добрый\s+вечер|добрый\s+день|hello|hi|hey|good\s+(?:morning|afternoon|evening)|hola|merhaba|مرحبا|你好|שלום)[!.?\s]*$/iu.test(prepared.normalized)
  if(!domain)return null
  let goal='overview'
  for(const [candidate,pattern] of GOAL_RULES){if(pattern.test(source)){goal=candidate;break}}
  if(domain==='qcoin' && /(?:украл\p{L}*|пропал\p{L}*|исчез\p{L}*|списал\p{L}*|снял\p{L}*|делся|делись|куда\s+делся|stolen|unauthorized|disappeared|盗|גנב)/iu.test(source)) goal='security'
  if(domain==='exchange_ai' && /(?:точн|accuracy|confidence|довер|trust)/iu.test(source)) goal='accuracy'
  const row=QL7_PREMIUM_MICRO_INTENTS.find(x=>x.domain===domain&&x.goal===goal) || QL7_PREMIUM_MICRO_INTENTS.find(x=>x.domain===domain)
  return row ? Object.freeze({...row, confidence:0.998, evidence:Object.freeze([`micro-intent:${row.id}`]), normalizedText:prepared.normalized}) : null
}

export function getQl7PremiumMicroIntentCatalogStats(){return Object.freeze({domains:DOMAINS.length,operations:OPERATIONS.length,microIntents:QL7_PREMIUM_MICRO_INTENTS.length})}
export function listQl7PremiumDomains(){return Object.freeze(DOMAINS.map(([domain,topic])=>({domain,topic})))}
