import {classifyQl7SupportCatalogSubIntent, classifyQl7SupportCatalogTopic, normalizeQl7SupportTopic} from '../ecosystemCatalog.js'
import {normalizeQl7SupportInput} from '../language/normalizeInput.js'
import {normalizeQl7SupportLocale} from '../language/locales.js'
import {collectQl7SemanticSignals, QL7_SUPPORT_SEMANTIC_BANK_VERSION} from '../language/semanticBanks.js'
import {classifyQl7SupportGeneralTopic} from '../knowledge/generalKnowledgeRegistry.js'
import {routeQl7SupportOpenHumanKnowledge} from '../knowledge/openHumanKnowledgeRouter.js'
import {resolveQl7SupportPublicFigureSourceRequirement} from '../knowledge/publicFigureSourceResolver.js'
import {buildQl7SupportPublicFigureKnowledgeGraph, QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH} from '../knowledge/publicFigureKnowledgeGraph.js'
import {classifyQl7SupportPublicFigureQuestionKind} from '../knowledge/publicFigureQuestionClassifier.js'
import {
 buildQl7SupportBundledStablePublicFigureFactProjection,
 validateQl7SupportPublicFigureFactBundle,
} from '../knowledge/publicFigureFactOntology.js'
import {resolveQl7SupportHumanConversationCell} from '../knowledge/humanConversationBank.js'
import {QL7_SUPPORT_LANGUAGE_VARIANT_PROFILES} from '../language/languageVariantBank.js'
import {auditQl7SupportKnowledgeSourceReceipt} from '../knowledge/sourceReceipt.js'
import {assessQl7SupportEcosystemAttack} from '../security/ecosystemAttackAssessment.js'
import {evaluateQl7SupportIllicitAssetRoute} from '../security/illicitAssetRoutePolicy.js'
import {buildQl7SupportHumorMechanismPlan} from '../knowledge/humorMechanismOntology.js'
import {evaluateQl7SupportHumorSafety} from '../knowledge/humorSafetyPolicy.js'
import {resolveQl7SupportKnowledgeAlias} from '../knowledge/knowledgeGraph.js'
import {evaluateQl7SupportSafety} from '../safety/evaluateTurn.js'
import {assessQl7SupportEmotion} from './emotionAssessment.js'
import {buildQl7SupportIntentConfirmationReceipt} from './intentConfirmationReceipt.js'
import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {extractQl7SupportContactSignals} from '../contact/contactIntelligence.js'
import {buildQl7DecisionMathReceipt} from './decisionMath.js'
import {rankQl7SupportClarifications} from './clarificationRanker.js'
import {extractQl7SupportEntities} from './entityExtractor.js'
import {arbitrateQl7SupportTopic} from './topicArbitrator.js'
import {resolveQl7Coreference} from './coreferenceResolver.js'
import {
 buildQl7SupportPragmaticFrame,
 resolveQl7SupportUserAnswerability,
} from './pragmaticFrame.js'

export const QL7_SUPPORT_ANALYZE_TURN_VERSION='16.2.0'
const MATERIAL_HINT=/(?:баланс|qcoin|vip|реклам|(?:^|[^\p{L}\p{N}_])ads(?=$|[^\p{L}\p{N}_])|advertis|кампан|плат[её]ж|wallet|кошел|форум|forum|telegram|академ|academy|метамаркет|metamarket|battlecoin|профил|profile|авторизац|login|гео|media|медиа|удалить\s+аккаунт|delete\s+account|партн[её]р|инвест|support|поддержк|crypto|крипт|bitcoin|биткоин|биткойн|биток|битка|btc|ethereum|эфир|eth|курс|цена|price|прогноз|forecast|signal|сигнал|recommendation|рекомендац|ai\s*box|ai\s*quota|ai\s*workbench|exchange\s*ai|мошен|скам|scam|fraud|crime|криминал)/iu
const GRATITUDE=/^(?:спасибо|спс|благодарю|дякую|дякс|thanks|thank\s*you|thx|gracias|teşekkür(?:ler)?|sağol|شكرا|شكرًا|谢谢|多谢|תודה)[!?.\s\p{Extended_Pictographic}]*$/iu
const GREETING=/^(?:привет|прив|привіт|вітаю|дарова|здарова|здравствуйте|доброе\s+(?:утро|утречко)|добрый\s+(?:день|вечер)|hello|hi|hey|hola|buenas|merhaba|selam|مرحبا|أهلا|你好|嗨|שלום|היי)[!?.\s\p{Extended_Pictographic}]*$/iu
const FAREWELL=/^(?:пока|до\s+связи|до\s+свидания|увидимся|bye|goodbye|see\s+you|adiós|görüşürüz|مع\s+السلامة|إلى\s+اللقاء|再见|להתראות)[!?.\s\p{Extended_Pictographic}]*$/iu
const HUMOR=/(?:^(?:анекдот|шутк[ауи]?|жарт|witz|blague|barzelletta|piada|żart|dowcip|grap|skämt|vits|spøk|joke|vittighed|vitsi|vtip|vicc|glumă|виц|vic|αστείο|ხუმრობა|zarafat|әзіл|ジョーク|冗談|농담)[!?.\s]*$|расска(?:жи|жите).{0,20}(?:анекдот|шутк)|пошути|пошутим|рассмеш|розкажи.{0,20}жарт|розсміш|tell\s+me\s+a\s+joke|make\s+me\s+laugh|cuenta.{0,20}chiste|hazme\s+re[ií]r|şaka.{0,12}(?:yap|anlat)|قل\s+نكتة|أضحكني|讲个笑话|逗我笑|ספר\s+בדיחה|תצחיק|erzähl.{0,20}witz|raconte.{0,20}blague|racconta.{0,20}barzelletta|conte.{0,20}piada|opowiedz.{0,20}(?:żart|dowcip)|vertel.{0,20}grap|berätta.{0,20}skämt|fortell.{0,20}(?:vits|spøk)|fortæl.{0,20}(?:joke|vittighed)|kerro.{0,20}vitsi|řekni.{0,20}vtip|povedz.{0,20}vtip|mondj.{0,20}viccet|spune.{0,20}glumă|кажи.{0,20}виц|ispričaj.{0,20}vic|povej.{0,20}vic|πες.{0,20}αστείο|მითხარი.{0,20}ხუმრობა|zarafat.{0,12}(?:de|et)|әзіл.{0,12}айт|笑わせて|농담.{0,12}(?:해|해줘|해\s+줘)|웃겨\s*줘)/iu
const PLAYFUL_INVITATION=/(?:подкол(?:и|оть)\s+(?:меня|мне)|потролл(?:ь|ить)\s+(?:меня|мне)|можешь.{0,20}(?:подкол|потрол)|roast\s+me|tease\s+me|bromea\s+conmigo|benimle\s+dalga\s+geç|امزح\s+معي|调侃我|צחק\s+עלי)/iu
const HUMOR_FOLLOWUP=/^(?:ещ[её]|ещ[её]\s+одн[уа]|давай\s+ещ[её]|another|one\s+more|otra|otro|bir\s+tane\s+daha|واحدة\s+أخرى|再来一个|עוד\s+אחד)[!?.\s\p{Extended_Pictographic}]*$/iu
const WELLBEING=/(?:как\s+(?:ты|дела|настроение)|how\s+are\s+you|what'?s\s+up|cómo\s+estás|nasılsın|كيف\s+حال(?:ك)?|你好吗|מה\s+שלומך)/iu
const EMOTIONAL=/(?:мне\s+(?:плохо|тяжело|грустно|одиноко)|мені\s+(?:погано|важко|сумно|самотньо)|meni\s+pogano|hochetsya\s+pogovoriti|хоч(?:у|еться)\s+поговор(?:ить|ити)|просто\s+поговор|трав(?:ят|ля)|булл(?:ят|инг)|унижа(?:ют|ли)|боюсь\s+сорваться|сорв(?:усь|аться)|не\s+курю|брос(?:аю|ил|ила)\s+курить|алкогол|наркотик|расстал(?:ся|ась)|розійшл(?:ися|ась|ся)|бросил(?:а)?|покинув(?:ла)?|умер(?:ла)?|помер(?:ла)?|потерял(?:а)?\s+(?:близкого|друга|родного)|втратив(?:ла)?\s+(?:близького|друга|рідну)|i\s+feel\s+(?:sad|alone|awful|terrible)|we\s+broke\s+up|someone\s+died|need\s+to\s+talk|bully(?:ing|ied)|quit(?:ting)?\s+smoking|relapse|alcohol|drugs?|me\s+siento\s+(?:muy\s+)?(?:mal|triste)|(?:necesit\p{L}*|ncesito|nec(?:e)?sito)\s+hablar|acoso|dej[ée]\s+de\s+fumar|kendimi\s+(?:çok\s+)?kötü\s+hissediyorum|konuşmak\s+istiyorum|ayrıldık|zorbal|sigara|alkol|uyuşturucu|أشعر\s+(?:بالحزن|بالسوء)|أحتاج\s+إلى\s+الحديث|تنمر|تدخين|كحول|مخدرات|我(?:很)?(?:难过|难受|孤独)|想聊聊|霸凌|戒烟|酒精|毒品|אני\s+מרגיש\s+רע|אני\s+עצוב|צריך\s+לדבר|בריונות|עישון|אלכוהול|סמים)/iu
const TOPIC_RECALL=/(?:о\s+ч[её]м\s+мы\s+говорили|что\s+мы\s+обсуждали|про\s+що\s+ми\s+говорили|нагадай\s+тему|what\s+(?:did|were)\s+we\s+(?:talk|discuss)|remind\s+me\s+(?:the\s+)?topic|de\s+qu[eé]\s+habl[aá]bamos|ne\s+konuşuyorduk|عم\s+كنا\s+نتحدث|我们(?:刚才)?聊什么|על\s+מה\s+דיברנו)/iu
const TOPIC_RESUME=/(?:верн[её]мся|продолжим\s+тему|поверн[іи]мося|back\s+to\s+(?:it|that)|resume\s+(?:that|topic)|volvamos|ona\s+d[oö]nelim|لنعد\s+إلى|回到|נחזור\s+לזה)/iu
const CORRECTION=/^(?:(?:нет|ні|no|hayır|لا|不是|לא).{0,80}(?:имел(?:а)?\s+в\s+виду|маю\s+на\s+увазі|i\s+mean|me\s+refiero|demek\s+istedim|أقصد|我是说|התכוונתי)|не\s+то|я\s+имел(?:а)?\s+в\s+виду|исправление)/iu
const INTENT_REJECTION=/(?:нет|ні|no|hayır|لا|不是|לא).{0,48}(?:не\s+(?:про|о)|not\s+about|no\s+es\s+sobre|hakkında\s+değil|ليس\s+عن|不是关于|לא\s+על)/iu
const BARE_DENIAL=/^(?:нет|ні|no|hayır|لا|不是|לא)[!?.\s]*$/iu
const IDENTITY=/(?:кто\s+ты|что\s+ты\s+(?:такое|можешь|умеешь)|что\s+ты\s+можешь|каков[ао]?\s+тво[яй]\s+(?:цель|задача)|зачем\s+ты\s+нужен|расскажи\s+о\s+себе|ты\s+(?:агент|модель|нейросеть|ии)|как\s+устроен\s+твой\s+интеллект|сколько\s+у\s+тебя\s+модел|хто\s+ти|що\s+ти\s+(?:таке|можеш|вмієш)|яка\s+твоя\s+(?:мета|ціль)|розкажи\s+про\s+себе|who\s+are\s+you|what\s+are\s+you|what\s+can\s+you\s+do|what\s+is\s+your\s+(?:purpose|goal)|are\s+you\s+(?:an?\s+)?(?:agent|model|neural)|how\s+does\s+your\s+intelligence\s+work|quién\s+eres|qué\s+puedes\s+hacer|cuál\s+es\s+tu\s+(?:objetivo|propósito)|sen\s+kimsin|ne\s+yapabilirsin|amacın\s+ne|من\s+أنت|ماذا\s+تستطيع|ما\s+هدفك|你是谁|你能做什么|你的(?:目标|目的)是什么|מי\s+אתה|מה\s+אתה\s+יכול|מה\s+המטרה\s+שלך|wer\s+bist\s+du|was\s+kannst\s+du|dein\s+(?:ziel|zweck)|qui\s+es[- ]tu|que\s+peux[- ]tu|ton\s+(?:but|objectif)|chi\s+sei|cosa\s+puoi\s+fare|qual\s+[èe]\s+il\s+tuo\s+scopo|quem\s+[ée]\s+voc[êe]|o\s+que\s+voc[êe]\s+pode\s+fazer|qual\s+[ée]\s+o\s+seu\s+objetivo|kim\s+jesteś|co\s+potrafisz|jaki\s+jest\s+twój\s+cel|wie\s+ben\s+jij|wat\s+kun\s+je|wat\s+is\s+je\s+doel|vem\s+[äa]r\s+du|vad\s+kan\s+du|vad\s+[äa]r\s+ditt\s+syfte|hvem\s+er\s+du|hva\s+kan\s+du|hvad\s+kan\s+du|kuka\s+olet|mit[äa]\s+osaat|kdo\s+jsi|co\s+um[ií]š|kto\s+si|čo\s+dok[aá]žeš|ki\s+vagy|mit\s+tudsz|cine\s+ești|ce\s+poți\s+face|кой\s+си|какво\s+можеш|ko\s+si|šta\s+možeš|tko\s+si|što\s+možeš|kdo\s+si|kaj\s+zmoreš|ποιος\s+είσαι|τι\s+μπορείς|ვინ\s+ხარ|რა\s+შეგიძლია|sən\s+kimsən|nə\s+edə\s+bilirsən|сен\s+кімсің|не\s+істей\s+аласың|あなたは誰|何ができる|目的は何|너는\s+누구|무엇을\s+할\s+수\s+있|목적이\s+뭐)/iu
const BALANCE=/(?:баланс|qcoin|юкоин|ucoin|мой\s+сч[её]т|how\s+much\s+qcoin|balance|יתרת|יתרה|رصيد|余额)/iu
const THEFT=/(?:украл(?:и|ися)?|пропал(?:и)?\s+(?:деньги|qcoin|баланс)|(?:qcoin|баланс).{0,24}(?:пропал|исчез|не\s+сходится)|зникл(?:и|о|а)?\s+(?:грош|грші|роші|кошти|qcoin|баланс)|зник.{0,12}(?:грош|грші|роші)|(?:qcoin|баланс).{0,24}(?:зник|не\s+сход)|(?:грош(?:і|ей)|грші|роші).{0,18}(?:зникл|пропал)|списал(?:и|ось)|списал(?:и|ося)|не\s+сходится\s+баланс|money.{0,18}(?:diappear|disapear|disappear|missing|gone)|(?:diappear|disapear|disappear|missing|gone).{0,18}(?:money|qcoin|balance)|(?:qcoin|balance|bakiye?m?d?e?n?).{0,32}(?:kaybol|diappear|disapear|disappear|missing|gone)|stole|balance\s+is\s+wrong|robbed|dinero.{0,18}(?:desapareci|falta|rob)|(?:desapareci|falta).{0,18}dinero|para.{0,18}(?:kaybol|çalın)|(?:kaybol|çalın).{0,18}(?:para|qcoin|bakiye)|(?:اختف|سرق).{0,24}(?:أموال|مال|رصيد)|(?:أموال|مال).{0,24}(?:اختف|سرق)|(?:钱|余额).{0,12}(?:不见|见了|消失|被盗)|(?:不见|消失).{0,12}(?:钱|余额)|qcoin.{0,18}钱见了|(?:כסף?|יתרה).{0,18}(?:נעלם|נעם|עלם|חסר|נגנב)|(?:נעלם|נעם|עלם|חסר).{0,18}(?:כסף?|יתרה))/iu
const ADS=/(?:реклам|рекламн|(?:^|[^\p{L}\p{N}_])ads(?=$|[^\p{L}\p{N}_])|(?:^|[^\p{L}\p{N}_])ad(?=\s+(?:packages?|campaigns?|metrics?|status|slots?|plans?|spend|views|clicks)\b)|advertis|\bcampaign\b|кампан|\bctr\b|(?:^|[^\p{L}\p{N}_])показ(?:ы|ов|а|ам|ами)?(?=$|[^\p{L}\p{N}_])|клик|impression|anuncio|publicidad|campaña|reklam|kampanya|إعلان|الإعلانات|حملة|广告|广告活动|פרסומ|פרסום|קמפיין)/iu
const NEG_ADS=/(?:не\s+(?:запрос\s+)?про\s+(?:ads?|реклам)|не\s+о\s+реклам|not\s+(?:a\s+request\s+)?about\s+ads?|no\s+es\s+(?:una\s+solicitud\s+de\s+)?publicidad|reklam\s+(?:isteği\s+)?değil|ليس\s+(?:طلبًا\s+)?عن\s+الإعلان|不是(?:关于)?广告(?:的请求)?|לא\s+(?:בקשה\s+)?על\s+פרסום)/iu
const VIP=/(?:\bvip\b|(?:^|[^\p{L}\p{N}_])(?:\u0432\u0438\u043f|\u0432\u0456\u043f)(?=$|[^\p{L}\p{N}_])|premium\s+status|vip\s+status)/iu
const VIP_STATUS_TYPO=/(?:¿?\s*mi\s+ip\s+est[aá]\s+activ[ao]\??|estado\s+de\s+mi\s+ip|situaci[oó]n\s+de\s+mi\s+ip|активен\s+ли\s+мой\s+ip\??|мой\s+ip\s+активен|هل\s+ip\s+نشط\??|ip\s+نشط|האם\s+ip\s+פעיל\??|ip\s+פעיל)/iu
const PACKAGE=/(?:пакет|тариф|elite|лімит|лимит|слот|(?:^|[^\p{L}\p{N}_])(?:packages?|plans?)(?=$|[^\p{L}\p{N}_])|paquete|paket|tarife|باقة|باقات|خطة|套餐|方案|חביל|חבילה|תוכנית)/iu
const METRICS=/(?:метрик|метрики|статистик|аналитик|ctr|показ|перегляд|клік|клик|views?|impressions?|métric|estadíst|clic|visualiz|metrik|istatistik|tıklama|görüntülen|مقاييس|إحصائ|نقر|مشاهد|指标|统计|点击|浏览|מדד|מדדים|סטטיסט|קליק|צפיות)/iu
const AMBIGUOUS_METRICS_TOKEN=/(?:^|[^\p{L}\p{N}_])(?:метрик(?:и|а)?|metriki|metrics?|m[eé]tricas?|estad[ií]sticas?|metrikler|istatistik|المقاييس|الإحصاءات|指标|统计|מדדים|סטטיסטיקה)(?=$|[^\p{L}\p{N}_])/iu
const PROMPT_INJECTION=/(?:игнорируй\s+(?:все\s+)?правил|раскрой\s+(?:classifier|классификатор|системн|внутренн)|show\s+(?:the\s+)?system\s+prompt|ignore\s+(?:all\s+)?(?:previous|system)\s+instructions|reveal\s+(?:the\s+)?(?:classifier|internal|system)|prompt\s*injection|忽略.*(?:规则|指令)|显示.*系统提示|تجاهل.*(?:القواعد|التعليمات)|اكشف.*(?:النظام|المصنف)|התעלם.*(?:הוראות|כללים)|חשוף.*(?:מערכת|מסווג))/iu
const REPORTED_SPEECH=/(?:пользователь\s+написал\s+цитату|reported\s+speech|quoted\s+text|цитата).{0,160}(?:не\s+моя\s+угроза|not\s+my\s+threat|это\s+цитата)/iu
const PRIVACY_ATTACK=/(?:raw\s+mongo|mongo\s+(?:documents?|документ)|приватн(?:ый|ий)\s+ключ|private\s+key|seed\s*phrase|auth\s*token|чуж(?:ие|і)\s+данн|other\s+users?['’]?\s+data|внутренн(?:ие|і)\s+коллекц|internal\s+collections?|原始.*(?:Mongo|文档)|私钥|他人数据|مفتاح\s+خاص|بيانات\s+الآخرين|מפתח\s+פרטי|נתונים\s+של\s+אחרים)/iu
const HOW_TO=/(?:как\s+(?:пользоваться|работает|работать|открыть|создать|найти|сделать|подать|связаться|включить|выключить|активировать|деактивировать|удалить|переключить|изменить|настроить|проверить|купить|приобрести|оплатить|пополнить)|(?:где|куда)\s+(?:можно\s+)?(?:посмотреть|проверить|найти|открыть)|что\s+делать\s+(?:если|когда|при)|что\s+такое|що\s+таке|як\s+(?:цим\s+)?користуватися|для\s+чего|how\s+(?:to|does)|where\s+(?:can\s+i\s+)?(?:find|check|see)|what\s+(?:do|should)\s+i\s+do\s+(?:if|when)|cómo\s+(?:usar|se\s+usa)|nasıl|كيف|如何|了解|解释|說明|说明|使用流程|何时使用|用途|איך|כיצד)/iu
const NEW_UNRELATED_ISSUE=/(?:другая\s+проблема|другой\s+вопрос|не\s+это|this\s+is\s+a\s+separate\s+issue|separate\s+issue|new\s+issue|another\s+issue|інша\s+проблема)/iu
const OPERATIONAL_FAILURE=/(?:не\s+(?:работает|созда[её]тся|создал(?:ся|ась|ось|ись)|открывается|открыл(?:ся|ась|ось|ись)|загружается|загрузил(?:ся|ась|ось|ись)|приходит|приш[её]л|видно)|сломал|ошиб|error|failed|broken|bug|crash|завис|лаг|тормоз|does\s+not\s+(?:work|load|open|create)|did\s+not\s+(?:work|load|open|create))/iu
const HEBREW_MARKET_ANALYTICS_HOW_TO=/(?:כיצד|איך).{0,48}(?:ניתוח|אנליט).{0,48}(?:שוק|מניות)/iu
const STATUS=/(?:статус|состоян(?:ие|ии|ия|ию|ием)|стан|актив(?:ен|ний|ный|на|но|ні|на)?|akt(?:iv|yvn|yven)|aktyv|frnbdty|frnbdybq|доступен|работает\s+ли|status|active|available|activo|activa|activ[ao]|estado|situaci[oó]n|durum|aktif|حالة|نشط|نشطة|نش|شط|状态|激活|活|מצב|פעיל)/iu
const ROADMAP=/(?:когда|планируется|roadmap|в\s+будущем|coming|launch|released|ne\s+zaman|متى|什么时候|מתי)/iu
const BUSINESS=/(?:партн[её]р|сотруднич|співпрац|інвест|инвест|вложить|предложение\s+для\s+компании|partnership|partner|invest|collaborat|business\s+proposal|colaboraci[oó]n|ortakl[ıi]k|yat[ıi]r[ıi]m|合作|投资|الشراكة|استثمار|שותפות|השקעה)/iu
const INVESTMENT_SIGNAL=/(?:инвест|інвест|invest|investment|inversi[oó]n|влож|yat[ıi]r[ıi]m|مستثمر|استثمار|投资|השקעה)/iu
const CONTACT=/(?:связаться|контакт|телефон|email|почт|telegram|whatsapp|call\s+me|contact\s+me)/iu
const OPERATOR_REQUEST=/(?:жив(?:ой|ого)?\s+оператор|оператор(?:у|ом|а)?|(?:^|[^\p{L}\p{N}_])опер(?:атор)?(?=$|[^\p{L}\p{N}_])|саппорт\s+человек|человек(?:а)?\s+из\s+поддержки|менеджер|представител[ья]|свяж(?:и|ите|ись|итеcь|ите\s+меня|ите\s+нас)|хочу\s+(?:к\s+)?оператор|нужен\s+оператор|human\s+(?:agent|operator|support)|support\s+agent|talk\s+to\s+(?:a\s+)?human|contact\s+support|reach\s+(?:the\s+)?operator|representative|manager|call\s+me|agente\s+humano|operador|canl[ıi]\s+destek|m[üu]şteri\s+temsilcisi|موظف\s+بشري|الدعم\s+البشري|人工客服|联系客服|联系人工|נציג\s+אנושי|תמיכה\s+אנושית)/iu
const CONTACT_REFUSAL=/(?:без\s+контакт|не\s+хочу\s+остав|не\s+буду\s+остав|не\s+даю\s+контакт|пишите\s+(?:здесь|тут|в\s+dm|в\s+личк)|только\s+(?:тут|здесь|dm|в\s+личк)|через\s+(?:dm|личн|мессенджер)|no\s+(?:extra\s+)?contacts?|do\s+not\s+contact\s+outside|dm\s+only|message\s+me\s+here|solo\s+dm|sin\s+contactos|sadece\s+dm|buradan\s+yaz|لا\s+أريد\s+ترك\s+جهات|بدون\s+تواصل\s+خارجي|不要.*联系方式|只在这里|רק\s+כאן|בלי\s+פרטי\s+קשר)/iu
const CONTACT_CHANNEL_HINT=/(?:email|e-mail|почт|почта|телефон|phone|telegram|tg\b|whatsapp|wa\b|signal|discord|linkedin|skype|звонок|call|личк|dm\b|direct\s+message|messenger)/iu
const FORUM_THREADS_TOPIC=/(?:ветк(?:а|и|у|е|ой)?\s+форум|гілк(?:а|и|у|ою)?\s+форум|forum\s+thread|thread|тред|ветк|гілк|комментар|відповід|reply|replies)/iu
const FORUM_FEED_TOPIC=/(?:лент(?:а|ы|е|у)?\s+форум|стрічк(?:а|и|у|ою)?\s+форум|forum\s+feed|feed.{0,12}forum|карточк(?:а|и)?\s+пост)/iu
const FORUM_TOPIC=/(?:форум|forum|пост(?:ы|ов)?|топик(?:и|ов)?|тем(?:ы|а).{0,18}(?:форум|forum)|активност[ьи].{0,18}(?:форум|forum))/iu
const PROFILE_TOPIC=/(?:профил|profile|аккаунт.{0,18}(?:активност|рейтинг)|рейтинг.{0,18}(?:confidence|уверенн|довер)|confidence)/iu
const METAMARKET_TOPIC=/(?:метамаркет|metamarket|meta\s*market|подарк(?:и|ов).{0,18}(?:получ|отправ)|коллекци.{0,18}(?:meta|market))/iu
const TELEGRAM_TOPIC=/(?:telegram|телеграм|телеграмм|tg\b|связ(?:ь|ан).{0,18}(?:telegram|телеграм))/iu
const BATTLECOIN_TOPIC=/(?:battle\s*coin|battlecoin|баттл\s*коин|батл\s*коин|батлкоин|баттлкоин|ордер(?:а|ов)?|лонг|шорт|x\d{1,3}|leverage|long|short)/iu
const CRYPTO_ASSET=/(?:\b(?:btc|btcusdt|bitcoin|eth|ethusdt|ethereum|sol|solusdt|solana|ton|tonusdt|bnb|bnbusdt|xrp|xrpusdt|doge|dogeusdt|ada|adausdt|matic|pol|trx|link|ltc|near)\b|биткоин\p{L}*|биткойн\p{L}*|бит(?:ок|ка|ку|ке|ком)|эфир(?:иум)?\p{L}*|солан\p{L}*|тонкоин\p{L}*|дог(?:е|икоин)?\p{L}*|крипт(?:а|о)\p{L}*|криптовалют\p{L}*|加密|比特币|以太坊|عملة|بيتكوين|קריפטו|ביטקוין)/iu
const CRYPTO_PRICE=/(?:курс|цен[ауые]|стоимост|сколько(?:\s+\p{L}+){0,3}\s+стоит|прайс|\b(?:price|rate|quote|market|chart|ticker)\b|котиров|рынок|график|precio|cotizaci|fiyat|piyasa|سعر|قيمة|报价|价格|מחיר|שער)/iu
const AI_RECOMMENDATION=/(?:ai[-\s]?(?:box|workbench|recommendation|analytics|signal)|exchange\s*ai|ии[-\s]?(?:бокс|аналитик|рекомендац|сигнал)|ai\s*квот|квот[аы]\s+ai|прогноз|рекомендац|сигнал|таймфрейм|time\s*frame|timeframe|tf\b|analy[sz]e|analysis|تحليل|توصية|分析|建议|המלצ|ניתוח)/iu
const AI_QUOTA_STATUS=/(?:ai[-\s]*(?:box[-\s]*)?quota|ai[-\s]*квот|квот[аы].{0,24}(?:ai|ии|законч|исчерп|нулев|ноль)|quota.{0,24}(?:exhaust|finish|end|zero|left|remain)|(?:лимит|ресурс).{0,24}(?:ai|ии[-\s]*box))/iu
const FINANCIAL_TIMEFRAME=/(?:\b(?:1m|3m|5m|15m|30m|1h|2h|4h|6h|12h|1d|1w)\b|\b\d{1,2}\s*(?:m|min|мин|минут|h|hour|час|d|day|день|дня)\b)/iu
const SCAM_CRIME=/(?:мошен|скам|развод|обман(?:ули|ул|а|ут)?|афер|криминал|преступ|взлом|фишинг|поддел|шантаж|fraud|scam|criminal|crime|phishing|extortion|blackmail|stolen|robbed|estafa|fraude|dolandır|sahte|احتيال|نصب|ابتزاز|诈骗|欺诈|犯罪|钓鱼|הונאה|פשע|סחיטה)/iu
const CRISIS_LANGUAGE=/(?:хочу\s+(?:повеситься|повешаться|вскрыться|спрыгнуть|застрелиться)|(?:повешусь|повешаюсь|вскроюсь|спрыгну|застрелюсь)|хочу\s+(?:умереть|не\s+жить)|не\s+хочу\s+жить|жить\s+не\s+хочу|нет\s+сил\s+жить|покончу\s+с\s+собой|убью\s+себя|сдела(?:ю|ть).{0,24}с\s+собой|что[-\s]?то.{0,28}с\s+собой|наврежу\s+себе|навредить\s+себе|причинить\s+себе\s+вред|само(?:вред|убий)|су[еиы]цид|накладу\s+на\s+себя\s+руки|выйти\s+в\s+окно|мені\s+(?:не\s+хочеться\s+жити|погано.{0,24}зробити\s+щось\s+із\s+собою)|не\s+хочу\s+жити|заподіяти\s+собі\s+шкоду|i\s+(?:want\s+to\s+die|do\s+not\s+want\s+to\s+live|don't\s+want\s+to\s+live|cant\s+go\s+on|can't\s+go\s+on)|kill\s+myself|hurt\s+myself|harm\s+myself|self[-\s]?harm|end\s+(?:it\s+all|my\s+life)|take\s+my\s+life|quiero\s+morir|no\s+quiero\s+vivir|hacerme\s+daño|suicid|kendime\s+zarar|ölmek\s+istiyorum|yaşamak\s+istemiyorum|انتحار|أريد\s+أن\s+أموت|أؤذي\s+نفسي|自杀|不想活|伤害自己|想死|להתאבד|לא\s+רוצה\s+לחיות|לפגוע\s+בעצמי)/iu
const QUANTUM_FAMILY_TOPIC=/(?:quantum\s*family|квантум\s*фем(?:е|и)ли|подписчик(?:и|ов)?|подписк(?:и|а|ок)|followers?|following|family\s+links)/iu
const MODERATION_TOPIC=/(?:модерац|жалоб(?:а|ы|у|ами)?|репорт(?:ы|ов)?|complaints?|reports?|moderation|бан|ban|flag|флаг)/iu
const GEODETECT_TOPIC=/(?:geo\s*detect|geodetect|гео(?:\s|-)?детект|геолокац|гео\s*контекст|локац|location|country|city|город|страна)/iu
const AMBIGUOUS=/^(?:метрики|метрика|статистика|статус|помоги|допоможи|проблема|не\s+работает|не\s+працює|help|metrics|status|problem|métricas|estadísticas|metrikler|istatistik|المقاييس|الإحصاءات|指标|统计|מדדים|סטטיסטיקה)[!?.\s]*$/iu
const DATA_ACTION=/(?:покаж|показать|проверь|провер|перевір|чекн|сколько|скільки|вывед|вывести|порах|рассчитай|посчитай|show|sho|check|verify|display|calculate|calc|how\s+much|what\s+is\s+my|muestra|verifica|calcula|g[öo]s?ter|kontrol|hesapla|اعرض|ارض|اعر|تحقق|احسب|显示|检查|计算|הצג|הצ|הג|בדוק|חשב|zeige|zeig|prüf|pruef|anzeigen|montre|affiche|mostra|mostre|poka[zż]|sprawd|zobraz|uk[aá]ž|ukaz|arat[aă]|mutasd)/iu
const KNOWLEDGE_OVERVIEW=/(?:what\s+is|about\s+|overview|purpose|user[-\s]?ready|how\s+to|safe\s+usage|current\s+user\s+steps|как\s+|что\s+такое|обзор|назначение|инструкц|зачем|для\s+чего|що\s+таке|як\s+)/iu

function hits(signals,category){return ql7Arr(signals?.categoryHits?.[category])}
function hasHit(signals,category){return hits(signals,category).length>0}
function topBankTopic(signals){return ql7Arr(signals?.topicWeights).slice().sort((a,b)=>Number(b.weight||0)-Number(a.weight||0))[0]?.topic||''}
function hasTopicSignal(signals,topic){return ql7Arr(signals?.topicWeights).some(row=>row.topic===topic&&Number(row.weight||0)>0)}
function hasMaterialSignal(text,signals){return MATERIAL_HINT.test(text)||TZ_ADS.test(text)||ql7Arr(signals?.topicWeights).some(row=>!['support_system'].includes(row.topic))}
function tokenCount(text=''){return (ql7Str(text).match(/[\p{L}\p{N}]+/gu)||[]).length}
const TZ_BALANCE=/(?:saldo(?:n|et|ni|en)?|salda|stanje(?:m|t|ta)?|kontostand|qcoin\s+(?:saldo|salda|stanje)|(?:saldo|salda|stanje).{0,18}qcoin)/iu
const TZ_THEFT=/(?:wallet\s+t(?:o|\u00f6)md|(?:pengar|penger|penge|rahat|novac|denar|qcoin|saldo|salda|stanje).{0,32}(?:f(?:o|\u00f6)rsvann|forsvant|forsvandt|mangler|saknas|borta|v(?:ae|\u00e6)k|katosi|kadonnut|puuttuu|nestao|nedostaje|ukraden|izginil|izginilo|manjka)|(?:f(?:o|\u00f6)rsvann|forsvant|forsvandt|mangler|saknas|borta|v(?:ae|\u00e6)k|katosi|kadonnut|puuttuu|nestao|nedostaje|ukraden|izginil|izginilo|manjka).{0,32}(?:pengar|penger|penge|rahat|novac|denar|qcoin|saldo|salda|stanje))/iu
const TYPO_THEFT=/(?:(?:зикл|знил)(?:и|о|а)?\s+(?:грош|грші|роші|кошти|qcoin|баланс)|(?:зикл|знил).{0,24}(?:грош|грші|роші|кошти|qcoin|баланс)|(?:грош(?:і|ей)|грші|роші|кошти|qcoin|баланс).{0,24}(?:зикл|знил))/iu
const TZ_ADS=/(?:annons(?:er)?|annonser|reklame|reklamer|reklama|kampanj(?:er)?|kampanje|kampanja|oglasi?|mainonta|advertenties?)/iu
const TZ_DATA_ACTION=/(?:\b(?:visa|vis|sjekk|tjek|kontroller(?:a)?|kontroll[ée]r|tarkista|provjeri|proveri|preveri|zeige|anzeigen|montre|v[ée]rifie|mostra|verifica|mostrar|verificar|toon|controleer|zobraz|zkontroluj|ellenőrizd|arată|verifică|покажи|провери|prikaži|pokaži|preveri|δείξε|έλεγξε|göster|yoxla)\b|n(?:a|\u00e4)yt(?:a|\u00e4)|pokaż|sprawdź|zobraziť|skontrolovať|აჩვენე|შეამოწმე|көрсет|тексер|表示|確認|보여|확인)/iu
const TZ_METRICS=/(?:werbekennzahlen|anzeigenstatistik|statistiques?\s+publicitaires?|m[eé]triques?\s+publicitaires?|metriche\s+pubblicitarie|m[eé]tricas?\s+(?:de\s+)?publicidade|metryki\s+reklam|statystyki\s+reklam|advertentiemetingen|advertentiestatistieken|annonsstatistik|annonsdata|annonsstatistikk|annoncestatistik|mainonnan\s+mittarit|mainostilastot|reklamn[ií]\s+(?:metriky|statistiky)|reklamn[eé]\s+metriky|hirdet[eé]si\s+mutat[oó]k|rekl[aá]mstatisztika|metrici\s+publicitare|показатели\s+реклам|метрике\s+реклама|metrike\s+(?:reklama|oglasa|oglasov)|μετρήσεις\s+διαφημίσεων|რეკლამის\s+მეტრიკები|reklam\s+metrikalar[ıi]|жарнама\s+метрикалары|広告(?:メトリクス|統計)|광고\s+(?:지표|통계))/iu
const TZ_STATUS=/(?:\b(?:status|statut|stato|estado|tila|stav|stare|stanje|durum)\b|zustand|statystyka\s+stanu|[aá]llapot|статус|κατάσταση|სტატუსი|vəziyyət|мәртебе|状態|상태)/iu
const KEYBOARD_DATA_ACTION=/(?:gjrf\s*[;:]\s*b|gjrf[;:]?b|gjrfpf(?:nm|nt)?|ghjdth(?:m)?|gthtdbh|xtryb|crjkmrj|crjkmrb)/iu
const KEYBOARD_BALANCE=/(?:[,<]fkfyc|[,<]fkfys|balansu)/iu
const TRANSLIT_THEFT=/(?:znikl[yi]?.{0,32}(?:grosh|hrosh|grosi|kosht|qcoin|balans)|(?:grosh|hrosh|grosi|kosht|qcoin|balans).{0,32}znikl[yi]?)/iu
const KEYBOARD_THEFT=/(?:pybrkb?|pybrk).{0,40}(?:uhji[іi]?|uhjii|[,<]?\s*fkfyc[e]?|qcoin)|(?:uhji[іi]?|uhjii|[,<]?\s*fkfyc[e]?|qcoin).{0,40}(?:pybrkb?|pybrk)/iu
const NON_QUERY_NOISE_WORD=/^(?:dot|point|period|full\s+stop|pika|punkt|prick|tocka|to\u010dka|tacka|ta\u010dka)$/iu
const KEYBOARD_SMASH=/^(?:asdf(?:ghjkl)?|qwer(?:tyuiop)?|zxcv(?:bnm)?|фыва(?:прол)?|йцукен(?:гшщз)?|ячсм(?:ить)?|асдф(?:гх)?|ывап(?:рол)?|йцуке(?:нг)?)$/iu
function hasDataAction(text='',signals={}){return DATA_ACTION.test(text)||TZ_DATA_ACTION.test(text)||KEYBOARD_DATA_ACTION.test(text)||hasHit(signals,'dataRequest')}
function hasBalanceSignal(text=''){return BALANCE.test(text)||TZ_BALANCE.test(text)||KEYBOARD_BALANCE.test(text)}
function hasTheftSignal(text=''){return THEFT.test(text)||TZ_THEFT.test(text)||TYPO_THEFT.test(text)||TRANSLIT_THEFT.test(text)||KEYBOARD_THEFT.test(text)}
function hasAdsSignal(text='',signals={}){return (ADS.test(text)||TZ_ADS.test(text)||hasTopicSignal(signals,'ads_campaigns')||hasTopicSignal(signals,'ads_packages'))&&!NEG_ADS.test(text)}
function isNoiseInput(text=''){
 const source=ql7Str(text).trim()
 if(!source)return true
 const wordsOnly=source.toLowerCase().normalize('NFKC').replace(/[\p{P}\p{S}\p{Extended_Pictographic}\p{Emoji_Presentation}]+/gu,' ').replace(/\s+/gu,' ').trim()
 if(NON_QUERY_NOISE_WORD.test(wordsOnly))return true
 if(KEYBOARD_SMASH.test(wordsOnly))return true
 if(/^[\s\p{P}\p{S}\p{Extended_Pictographic}\p{Emoji_Presentation}]+$/u.test(source))return true
 const tokens=source.match(/[\p{L}\p{N}]+/gu)||[]
 if(!tokens.length)return true
 if(tokens.length===1){
  const token=tokens[0]
  if(/^(?:vip|ads|btc|eth|sol|ton|bnb|xrp|ada|ltc|qcoin|ip)$/iu.test(token))return false
  if(token.length<=2&&!GREETING.test(source)&&!GRATITUDE.test(source))return true
  if(token.length>=4&&token.length<=8&&/^[bcdfghjklmnpqrstvwxyz]{4,}$/iu.test(token))return true
 }
 return false
}
function isExplicitExchangeKnowledgeRequest(text='',anchorTopic=''){
 return anchorTopic==='exchange_ai'&&KNOWLEDGE_OVERVIEW.test(text)&&!(CRYPTO_PRICE.test(text)||FINANCIAL_TIMEFRAME.test(text))
}
function isExplicitQcoinDataRequest(text='',signals={}){
 const mention=hasBalanceSignal(text)||hasTopicSignal(signals,'qcoin')
 return hasTheftSignal(text)||(mention&&(STATUS.test(text)||hasDataAction(text,signals)))
}
function isExplicitVipDataRequest(text='',signals={}){
 const mention=VIP.test(text)||VIP_STATUS_TYPO.test(text)||hasTopicSignal(signals,'vip')
 return VIP_STATUS_TYPO.test(text)||(mention&&(STATUS.test(text)||TZ_STATUS.test(text)||hasDataAction(text,signals)))
}
function isExplicitAdsPackageDataRequest(text='',signals={}){
 const mention=(PACKAGE.test(text)&&(/elite/iu.test(text)||hasAdsSignal(text,signals)||hasTopicSignal(signals,'ads_packages')))||hasTopicSignal(signals,'ads_packages')
 return mention&&hasDataAction(text,signals)&&(STATUS.test(text)||TZ_STATUS.test(text))
}
function isExplicitAdsCampaignDataRequest(text='',signals={}){
 const mention=hasAdsSignal(text,signals)
 return mention&&hasDataAction(text,signals)&&(METRICS.test(text)||TZ_METRICS.test(text)||STATUS.test(text)||TZ_STATUS.test(text))
}
function isVagueDomainMention(text='',signals={}){
 if(isNoiseInput(text))return false
 if(CRISIS_LANGUAGE.test(text)||SCAM_CRIME.test(text)||hasTheftSignal(text)||HOW_TO.test(text)||ROADMAP.test(text)||BUSINESS.test(text)||OPERATOR_REQUEST.test(text))return false
 const source=ql7Str(text)
 const explicitCatalogTopic=explicitCatalogTopicFor(source)
 if(explicitCatalogTopic&&explicitCatalogTopic!=='qcoin'&&(KNOWLEDGE_OVERVIEW.test(source)||/[:\uFF1A]/u.test(source)))return false
 const words=tokenCount(source)
 if(explicitCatalogTopic&&words<=4&&!KNOWLEDGE_OVERVIEW.test(source)&&!/[?？]/u.test(source))return true
 const market=extractMarketSignals(source)
 if(hasAdsSignal(source,signals)&&!isExplicitAdsCampaignDataRequest(source,signals)&&!isExplicitAdsPackageDataRequest(source,signals)&&words<=6)return true
 if((hasBalanceSignal(source)||hasTopicSignal(signals,'qcoin'))&&!isExplicitQcoinDataRequest(source,signals)&&words<=6)return true
 if((VIP.test(source)||hasTopicSignal(signals,'vip'))&&!isExplicitVipDataRequest(source,signals)&&words<=5)return true
 if(CRYPTO_ASSET.test(source)&&!market.active&&words<=8)return true
 return false
}
function businessBriefReady(text='',signals={},contactSignals={}){
 const source=ql7Str(text)
 const detailHits=[
  /(?:цель|задач|предлож|иде[яи]|услов|бюджет|срок|масштаб|аудитор|интеграц|команд|бренд|компан|рынок|value|goal|budget|timeline|scale|audience|integration|company|brand|market|proposal|terms)/iu.test(source),
  /(?:партн|сотруднич|инвест|влож|collaborat|partner|invest|business|strategic|коммерч)/iu.test(source),
  Number(source.length)>90,
  ql7Arr(signals?.topicWeights).some(row=>['partnership','investment','contact'].includes(row.topic)&&Number(row.weight||0)>1),
  contactSignals.offered||contactSignals.refused,
 ]
 return detailHits.filter(Boolean).length>=2
}
const SYMBOL_ALIASES=Object.freeze([
 ['BTCUSDT',/(?:\bbtc(?:usdt)?\b|bitcoin|биткоин\p{L}*|биткойн\p{L}*|бит(?:ок|ка|ку|ке|ком)|比特币|بيتكوين|ביטקוין)/iu],
 ['ETHUSDT',/(?:\beth(?:usdt)?\b|ethereum|эфир(?:иум)?|以太坊|إيثيريوم|אתריום)/iu],
 ['SOLUSDT',/(?:\bsol(?:usdt)?\b|solana|солана)/iu],
 ['TONUSDT',/(?:\bton(?:usdt)?\b|toncoin|тонкоин)/iu],
 ['BNBUSDT',/(?:\bbnb(?:usdt)?\b)/iu],
 ['XRPUSDT',/(?:\bxrp(?:usdt)?\b|ripple)/iu],
 ['DOGEUSDT',/(?:\bdoge(?:usdt)?\b|dogecoin|дог(?:е|икоин)?)/iu],
 ['ADAUSDT',/(?:\bada(?:usdt)?\b|cardano)/iu],
 ['LINKUSDT',/(?:\blink(?:usdt)?\b|chainlink)/iu],
 ['LTCUSDT',/(?:\bltc(?:usdt)?\b|litecoin)/iu],
])
function extractMarketSignals(text=''){
 const source=ql7Str(text)
 const symbol=SYMBOL_ALIASES.find(([,re])=>re.test(source))?.[0]||''
 const rawTimeframe=source.match(/\b(?:1m|3m|5m|15m|30m|1h|2h|4h|6h|12h|1d|1w)\b/iu)?.[0]?.toLowerCase()
 const numeric=source.match(/\b(\d{1,2})\s*(?:m|min|мин|минут)\b/iu)?.[1]
 const hour=source.match(/\b(\d{1,2})\s*(?:h|hour|час)\b/iu)?.[1]
 const day=source.match(/\b(\d{1,2})\s*(?:d|day|день|дня)\b/iu)?.[1]
 const timeframe=rawTimeframe|| (numeric?`${numeric}m`:hour?`${hour}h`:day?`${day}d`:'')
 const hasAsset=CRYPTO_ASSET.test(source)
 const hasPrice=CRYPTO_PRICE.test(source)
 const hasAi=AI_RECOMMENDATION.test(source)
 const hasTimeframe=FINANCIAL_TIMEFRAME.test(source)
 const explicitAiProduct=/(?:exchange\s*ai|ai[-\s]?(?:box|workbench)|ии[-\s]?(?:бокс|аналитик))/iu.test(source)
 const explicitMarketDomain=/(?:крипт(?:а|о|овалют)|crypto(?:currency)?|торгов(?:ля|ый|ой).{0,18}(?:пара|рынок)|trading.{0,18}(?:pair|market))/iu.test(source)
 const directRecommendationRequest=/(?:дай|сделай|покажи|рассчитай|оцени|прогноз|рекоменд|предложи|generate|give\s+me|show\s+me|forecast|recommend|analy[sz]e\s+(?:this|btc|eth|market)|recomienda|analiza|tahmin|öner|حلل|توصية|分析一下|给我建议|נתח|המלץ)/iu.test(source)
 const explicitProduct=Boolean(explicitAiProduct||explicitMarketDomain)
 const domainConfirmed=Boolean(hasAsset||explicitProduct)
 const wantsAi=Boolean(hasAi&&domainConfirmed&&(explicitAiProduct||directRecommendationRequest))
 const wantsPrice=Boolean(hasPrice&&domainConfirmed)||(hasAsset&&hasTimeframe)
 const active=Boolean(domainConfirmed&&(wantsAi||wantsPrice||hasTimeframe))
 return Object.freeze({active,symbol:symbol||'BTCUSDT',timeframe:timeframe||'5m',hasAsset,hasPrice,hasAi,hasTimeframe,explicitProduct,domainConfirmed,wantsAi,wantsPrice,requiresEntitlement:wantsAi||Boolean(domainConfirmed&&/прогноз|рекомендац|signal|сигнал|analysis|analy[sz]e|تحليل|توصية|分析|建议|המלצ/iu.test(source)),sourceHash:ql7StableHash(`${symbol}:${timeframe}:${domainConfirmed}:${wantsAi}:${wantsPrice}`)})
}

function priorIntentConfirmation(previousContext={}){
 const direct=previousContext?.intentConfirmation||previousContext?.intentConfirmationReceipt
 return direct?.schema==='ql7.support.intent-confirmation-receipt'?direct:null
}
function activeFrameIntentContext(previousContext={},domainId='',coreference={}){
 const receipt=previousContext?.activeFrameIntentConfirmation
 if(coreference?.resolvedFromMemory!==true)return null
 if(receipt?.schema!=='ql7.support.intent-confirmation-receipt')return null
 if(!['collecting','confirmed'].includes(receipt.state))return null
 if(ql7Str(receipt.slotValues?.domainId)!==ql7Str(domainId))return null
 if(ql7Str(previousContext?.activeTopic)!==ql7Str(domainId))return null
 return receipt
}
function operationForDomain({domainId='',text='',signals={},marketSignals={},prior=null,contextualReference=false}={}){
 const priorDomain=ql7Str(prior?.slotValues?.domainId)
 const priorOperation=priorDomain===domainId?ql7Str(prior?.slotValues?.operationId):''
 if(domainId==='qcoin'){
  if(hasTheftSignal(text))return'incident_review'
  if(contextualReference&&priorOperation&&hasDataAction(text,signals))return priorOperation
  if(hasBalanceSignal(text)&&(STATUS.test(text)||hasDataAction(text,signals)||prior?.slotValues?.domainId==='qcoin'))return'account_balance'
 }
 if(domainId==='vip'&&(VIP_STATUS_TYPO.test(text)||STATUS.test(text)||hasDataAction(text,signals)))return'vip_status'
 if(domainId==='ads_packages'&&(PACKAGE.test(text)||prior?.slotValues?.domainId==='ads_packages')&&(STATUS.test(text)||hasDataAction(text,signals)||/(?:купить|buy|purchase|activate|активир|تفعيل|购买|הפעל)/iu.test(text)))return'package_status'
 if(domainId==='ads_campaigns'){
  if(METRICS.test(text))return'campaign_metrics'
  if(contextualReference&&priorOperation&&(hasDataAction(text,signals)||FINANCIAL_TIMEFRAME.test(text)))return priorOperation
  if(STATUS.test(text)||hasDataAction(text,signals))return'campaign_status'
 }
 if(domainId==='exchange_ai'){
  if(AI_QUOTA_STATUS.test(text))return'quota_status'
  if(marketSignals.hasAi)return'ai_recommendation'
  if(marketSignals.hasPrice)return'current_price'
  if(prior?.slotValues?.operationId==='ai_recommendation'&&marketSignals.hasTimeframe)return'ai_recommendation'
  if(prior?.slotValues?.operationId==='current_price'&&marketSignals.hasTimeframe)return'current_price'
  if(contextualReference&&priorOperation&&(hasDataAction(text,signals)||marketSignals.hasTimeframe))return priorOperation
 }
 if(domainId==='battlecoin'&&(OPERATIONAL_FAILURE.test(text)||/(?:ошиб(?:ка|ки|ку)|error)\s*[:#-]?\s*\d{3,6}/iu.test(text)))return'incident_diagnostic'
 if(['payments','profile','forum_feed','forum_threads','metamarket','telegram','battlecoin','quantum_family','moderation','geodetect'].includes(domainId)&&(STATUS.test(text)||hasDataAction(text,signals)))return'actor_status'
 return ql7Str(prior?.slotValues?.operationId)
}
function pendingIntentResolution({text='',originalText='',previousContext={},signals={},marketSignals={}}={}){
 const prior=priorIntentConfirmation(previousContext)
 if(!prior||prior.state!=='collecting')return null
 if(CORRECTION.test(text)||INTENT_REJECTION.test(text))return Object.freeze({prior,rejected:true})
 const priorDomain=ql7Str(prior.slotValues?.domainId)
 if(!priorDomain)return Object.freeze({prior})
 const explicitDomain=explicitCatalogTopicFor(text)
 const compatibleExchangeAiContinuation=Boolean(
  priorDomain==='exchange_ai'&&(explicitDomain==='ai'||marketSignals.hasAi||marketSignals.hasTimeframe)
 )
 if(explicitDomain&&explicitDomain!=='support_system'&&explicitDomain!==priorDomain&&!compatibleExchangeAiContinuation){
  return Object.freeze({prior,reset:true})
 }
 let operationId=operationForDomain({domainId:priorDomain,text,signals,marketSignals,prior})
 const addsAsset=marketSignals.hasAsset
 const addsTimeframe=marketSignals.hasTimeframe
 const referenceSource=ql7Str(originalText||text)
 const referenceEntities=extractQl7SupportEntities(referenceSource,referenceSource)
 const boundedReferenceAnswer=Boolean(
  referenceEntities.walletAddress||referenceEntities.accountId||referenceEntities.bareId||
  referenceEntities.invoiceId||referenceEntities.orderId||referenceEntities.campaignId||referenceEntities.packageId||
  referenceEntities.txHash||referenceEntities.telegramId||referenceEntities.nickname
 )
 if(!operationId&&boundedReferenceAnswer){
  if(priorDomain==='ads_campaigns')operationId='campaign_status'
  else if(priorDomain==='ads_packages')operationId='package_status'
  else if(priorDomain==='qcoin')operationId='account_balance'
 }
 if(!operationId&&!addsAsset&&!addsTimeframe)return Object.freeze({prior,domainId:priorDomain})
 const messageAct=operationId==='ai_recommendation'||operationId==='current_price'
  ?'ai_recommendation_request'
  :'personal_status_request'
 return Object.freeze({prior,domainId:priorDomain,operationId,messageAct,addsAsset,addsTimeframe,boundedReferenceAnswer})
}
function candidateIntentDomain({topic='',scoring={},pending=null,marketSignals={}}={}){
 if(pending?.domainId)return pending.domainId
 if(topic&&topic!=='support_system')return topic
 if(marketSignals.hasAsset)return'exchange_ai'
 return ql7Arr(scoring.topicCandidates)
  .filter((row)=>Number(row?.total||0)>0)
  .map((row)=>normalizeQl7SupportTopic(row?.topic))
  .find((candidate)=>candidate&&candidate!=='support_system')||''
}
function semanticNowMs(now=Date.now){
 const raw=typeof now==='function'?now():now
 const parsed=typeof raw==='number'?raw:Date.parse(ql7Str(raw))
 return Number.isFinite(parsed)?parsed:Date.now()
}
function semanticNowIso(now=Date.now){
 return new Date(semanticNowMs(now)).toISOString()
}
function buildIntentConfirmation({text='',conversationId='',turnId='',topic='',messageAct='',signals={},marketSignals={},scoring={},adapterGates={},previousContext={},pending=null,contextualPrior=null,contextualReference=false,now=''}={}){
 const priorCandidate=pending?.prior||contextualPrior||priorIntentConfirmation(previousContext)
 const prior=pending?.reset===true?null:priorCandidate
 const domainId=candidateIntentDomain({topic,scoring,pending,marketSignals})
 const operationId=ql7Str(pending?.operationId)||operationForDomain({domainId,text,signals,marketSignals,prior,contextualReference})
 const directAdapterGate=Object.values(adapterGates).some(Boolean)
 const requested=Boolean(prior?.state==='collecting'||directAdapterGate||(
  ['ambiguous_request','personal_status_request','incident_report','ai_recommendation_request'].includes(messageAct)&&domainId
 ))
 const evidenceIds=[]
 if(domainId)evidenceIds.push(`domain:${domainId}`)
 if(operationId)evidenceIds.push(`operation:${operationId}`)
 if(hasDataAction(text,signals))evidenceIds.push('speech-act:explicit-data-action')
 if(STATUS.test(text))evidenceIds.push('speech-act:explicit-status')
 if(hasTheftSignal(text))evidenceIds.push('incident:missing-or-stolen-funds')
 if(marketSignals.hasAsset)evidenceIds.push(`asset:${marketSignals.symbol}`)
 if(marketSignals.hasTimeframe)evidenceIds.push(`timeframe:${marketSignals.timeframe}`)
 if(pending?.operationId)evidenceIds.push('dialogue:clarification-answer')
 if(pending?.boundedReferenceAnswer)evidenceIds.push('dialogue:bounded-reference-answer')
 if(contextualPrior&&contextualReference)evidenceIds.push('dialogue:active-frame-reference')
 const counterEvidenceIds=[]
 if(pending?.rejected)counterEvidenceIds.push('explicit-intent-rejection')
 if(NEG_ADS.test(text))counterEvidenceIds.push('domain:ads-rejected')
 const effectiveConfidence=pending?.operationId?Math.max(.92,Number(scoring.topicCandidates?.[0]?.total||0)/10):directAdapterGate?Math.max(.96,heuristicEvidenceStrengthFor(topic,messageAct,text,signals,scoring.confidenceMargin)):heuristicEvidenceStrengthFor(topic,messageAct,text,signals,scoring.confidenceMargin)
 return buildQl7SupportIntentConfirmationReceipt({
  previousReceipt:priorCandidate,
  reset:pending?.reset===true,
  rejected:pending?.rejected===true,
  requested,
  conversationId,
  turnId,
  inputMeaningHash:ql7StableHash(ql7Str(text).toLowerCase()),
  slotValues:{
   domainId,
   operationId,
   assetId:marketSignals.hasAsset?marketSignals.symbol:ql7Str(contextualPrior?.slotValues?.assetId),
   timeframe:marketSignals.hasTimeframe?marketSignals.timeframe:ql7Str(contextualPrior?.slotValues?.timeframe),
   actorScope:domainId&&domainId!=='exchange_ai'?'verified_actor':ql7Str(contextualPrior?.slotValues?.actorScope),
  },
  evidenceIds,
  counterEvidenceIds,
  explicitRequestEvidence:directAdapterGate||Boolean(pending?.operationId),
  authoritativeChoice:false,
  confidence:effectiveConfidence,
  confidenceKind:'heuristic_evidence_strength_uncalibrated',
  margin:scoring.confidenceMargin,
  entropy:scoring.semanticEntropy,
  now:ql7Str(now),
 })
}

function catalogLookupText(text=''){return ql7Str(text).replace(/^(?:about|sobre|acerca\s+de|про|о|щодо|关于|關於)\s+/iu,'').replace(/([\p{Script=Han}])\1(?=\p{Script=Han})/gu,'$1').trim()}
function explicitCatalogTopicFor(text=''){const source=ql7Str(text);const raw=ql7Str(classifyQl7SupportCatalogTopic(source,'')||classifyQl7SupportCatalogTopic(catalogLookupText(source),''));return raw?normalizeQl7SupportTopic(raw):''}
function explicitCatalogAnchorTopicFor(text=''){const source=ql7Str(text);if(!/[:：]/u.test(source))return'';const head=source.split(/[:：]/u)[0];if(!head||head.length>96)return'';const raw=ql7Str(classifyQl7SupportCatalogTopic(head,'')||classifyQl7SupportCatalogTopic(catalogLookupText(head),''));return raw?normalizeQl7SupportTopic(raw):''}
function safetySourceFor(normalized={},fallbackText=''){const primary=ql7Str(normalized.normalizedText);const original=ql7Str(normalized.originalText||fallbackText);return original&&original!==primary?`${primary}\n${original}`:primary}
function isProtectedBoundary(text=''){return PROMPT_INJECTION.test(text)||PRIVACY_ATTACK.test(text)}
function isAmbiguousMetricsRequest(text='',signals={}){
 if(!AMBIGUOUS_METRICS_TOKEN.test(text))return false
 const specific=(hasBalanceSignal(text)||VIP.test(text)||VIP_STATUS_TYPO.test(text)||PACKAGE.test(text)||FORUM_TOPIC.test(text)||PROFILE_TOPIC.test(text)||METAMARKET_TOPIC.test(text)||TELEGRAM_TOPIC.test(text)||BATTLECOIN_TOPIC.test(text)||CRYPTO_ASSET.test(text)||AI_RECOMMENDATION.test(text)||hasAdsSignal(text,signals))
 if(specific)return false
 const bankTopic=topBankTopic(signals)
 return !bankTopic||bankTopic==='support_system'||bankTopic==='ads_campaigns'
}
function socialComparable(text=''){
 return ql7Str(text).toLowerCase().normalize('NFKC').replace(/[\p{P}\p{S}]+/gu,' ').replace(/\s+/g,' ').trim()
}
function hasStandaloneSocialHit(text='',signals={},bankId=''){
 const comparable=socialComparable(text)
 if(!comparable)return false
 const rows=ql7Arr(signals?.hits).filter((row)=>ql7Str(row?.bankId||row?.category||row?.id)===bankId)
 return rows.some((row)=>{
  const candidates=[row?.matchedText,row?.matched,row?.value,row?.term,row?.root,row?.text]
  return candidates.map(socialComparable).filter(Boolean).some((candidate)=>candidate===comparable)
 })
}
function messageActFor(text,ledger,signals,originalText='',generalTopic=null,contactSignalsOverride=null){
 const contactSignals=contactSignalsOverride||extractQl7SupportContactSignals(originalText||text)
 const marketSignals=extractMarketSignals(text)
 const explicitCatalogTopic=explicitCatalogTopicFor(text)
 const explicitAnchorTopic=explicitCatalogAnchorTopicFor(text)
 const explicitCatalogBlocksMarketAi=explicitCatalogTopic==='metamarket'||(explicitCatalogTopic==='homepage'&&/cryptoradar/iu.test(text))
 if(CRISIS_LANGUAGE.test(text))return'emotional_support'
 if(REPORTED_SPEECH.test(text))return'reported_speech'
 if(isProtectedBoundary(text))return'security_boundary'
 if(NEW_UNRELATED_ISSUE.test(text))return'new_unrelated_issue'
 if(BARE_DENIAL.test(text)&&(priorIntentConfirmation(ledger)?.state==='collecting'||ledger?.waitingFor||ledger?.openMaterialQuestion))return'denial'
 if(HEBREW_MARKET_ANALYTICS_HOW_TO.test(text))return'how_to_question'
 if(marketSignals.active&&(marketSignals.wantsAi||marketSignals.wantsPrice)&&!explicitCatalogBlocksMarketAi&&!isExplicitExchangeKnowledgeRequest(text,explicitAnchorTopic||explicitCatalogTopic))return'ai_recommendation_request'
 if(SCAM_CRIME.test(text))return'incident_report'
 if((contactSignals.offered||contactSignals.refused)&&Number(ledger?.business?.intakeTurns||0)>0)return Number(ledger?.business?.operatorRequestTurns||0)>0?'human_operator_request':'business_proposal'
 if(EMOTIONAL.test(text)||hasHit(signals,'emotional'))return'emotional_support'
 if(isAmbiguousMetricsRequest(text,signals))return'ambiguous_request'
 if(HUMOR.test(text)||PLAYFUL_INVITATION.test(text))return'humor_request'
 if(GRATITUDE.test(text)||hasStandaloneSocialHit(text,signals,'thanks'))return'gratitude';if(WELLBEING.test(text)&&(GREETING.test(text)||hasStandaloneSocialHit(text,signals,'greetings')))return'wellbeing_question';if(GREETING.test(text)||hasStandaloneSocialHit(text,signals,'greetings'))return'greeting';if(FAREWELL.test(text)||hasStandaloneSocialHit(text,signals,'closure'))return'farewell';if(HUMOR_FOLLOWUP.test(text)&&ledger?.social?.humorMode)return'humor_followup';if(TOPIC_RECALL.test(text)||hasHit(signals,'topicRecall'))return'topic_recall';if(TOPIC_RESUME.test(text)||hasHit(signals,'topicResume'))return'topic_resume';if(IDENTITY.test(text))return'identity_question';if(CORRECTION.test(text)||hasHit(signals,'correction'))return'correction';if(OPERATOR_REQUEST.test(text))return'human_operator_request';if(WELLBEING.test(text)&&!hasMaterialSignal(text,signals))return'wellbeing_question';if(BUSINESS.test(text)||hasHit(signals,'business')||hasHit(signals,'investment'))return'business_proposal';if(hasTheftSignal(text))return'incident_report';if(OPERATIONAL_FAILURE.test(text))return'incident_report';if(isNoiseInput(text)||isNoiseInput(originalText))return'spam_or_noise';if(HOW_TO.test(text)||hasHit(signals,'howTo'))return'how_to_question';if(ROADMAP.test(text))return'roadmap_question';if(isExplicitQcoinDataRequest(text,signals)||isExplicitVipDataRequest(text,signals)||isExplicitAdsPackageDataRequest(text,signals)||isExplicitAdsCampaignDataRequest(text,signals)||hasHit(signals,'dataRequest'))return'personal_status_request';if(isVagueDomainMention(text,signals))return'ambiguous_request';if(generalTopic&&!explicitCatalogTopic&&(!hasMaterialSignal(text,signals)||(generalTopic.openSubject===true&&/[?？؟]/u.test(text)&&!marketSignals.domainConfirmed)))return'general_knowledge_question';if(AMBIGUOUS.test(text))return'ambiguous_request';return hasMaterialSignal(text,signals)?'informational_question':'small_talk'
}
const PRAGMATICALLY_OVERRIDABLE_ACTS=new Set(['small_talk','informational_question','general_knowledge_question','how_to_question','ambiguous_request'])
function messageActWithPragmatics(ruleMessageAct='',pragmaticFrame={}){
 const suggestion=ql7Str(pragmaticFrame?.messageActSuggestion)
 if(!suggestion)return ruleMessageAct
 if(!PRAGMATICALLY_OVERRIDABLE_ACTS.has(ruleMessageAct))return ruleMessageAct
 if(ruleMessageAct==='ambiguous_request'&&suggestion==='spam_or_noise')return ruleMessageAct
 if(suggestion==='ambiguous_request'&&['how_to_question','general_knowledge_question','informational_question'].includes(ruleMessageAct))return ruleMessageAct
 return suggestion
}
function topicFor(text,act,previous,signals,originalText='',coreference={}){
 const explicitCatalogTopic=explicitCatalogTopicFor(text)
 const explicitAnchorTopic=explicitCatalogAnchorTopicFor(text)||explicitCatalogAnchorTopicFor(originalText)
 const marketSignals=extractMarketSignals(text)
 if(act==='security_boundary')return'security'
 if(act==='identity_question'||IDENTITY.test(text))return'support_system'
 if(act==='reported_speech')return'support_system'
 if(act==='general_knowledge_question')return'support_system'
 if(act==='spam_or_noise')return'support_system'
 if(act==='ambiguous_request'&&isAmbiguousMetricsRequest(text,signals))return'support_system'
 if(act==='ambiguous_request'&&isVagueDomainMention(text,signals))return'support_system'
 const contactSource=`${text}\n${originalText}`
 if((CONTACT.test(contactSource)||CONTACT_REFUSAL.test(contactSource)||CONTACT_CHANNEL_HINT.test(contactSource))&&Number(previous?.business?.intakeTurns||0)>0)return ['partnership','investment','contact'].includes(previous?.activeTopic)?previous.activeTopic:'contact'
 if(hasTheftSignal(text)||isExplicitQcoinDataRequest(text,signals))return'qcoin'
 if(isExplicitVipDataRequest(text,signals))return'vip'
 if(isExplicitAdsPackageDataRequest(text,signals))return'ads_packages'
 if(explicitAnchorTopic==='exchange_ai')return'exchange_ai'
 if(explicitAnchorTopic==='exchange'&&act==='ai_recommendation_request')return'exchange_ai'
 if(explicitAnchorTopic)return explicitAnchorTopic
 if(hasAdsSignal(text,signals))return PACKAGE.test(text)?'ads_packages':METRICS.test(text)?'ads_campaigns':'ads_campaigns'
 if(SCAM_CRIME.test(text)&&!hasTheftSignal(text))return'security'
 if(OPERATOR_REQUEST.test(text)&&!BUSINESS.test(text))return'contact'
 if(BUSINESS.test(text))return INVESTMENT_SIGNAL.test(text)?'investment':'partnership'
 if(explicitCatalogTopic==='metamarket'||(explicitCatalogTopic==='homepage'&&/cryptoradar/iu.test(text)))return explicitCatalogTopic
 if(act==='how_to_question'&&HEBREW_MARKET_ANALYTICS_HOW_TO.test(text))return'homepage'
 if(act==='ai_recommendation_request'||marketSignals.active)return'exchange_ai'
 if(explicitCatalogTopic&&!['exchange','exchange_ai'].includes(explicitCatalogTopic))return explicitCatalogTopic
 if(IDENTITY.test(text))return'support_system';if(explicitCatalogTopic)return explicitCatalogTopic;if(BATTLECOIN_TOPIC.test(text))return'battlecoin';if(QUANTUM_FAMILY_TOPIC.test(text))return'quantum_family';if(MODERATION_TOPIC.test(text))return'moderation';if(GEODETECT_TOPIC.test(text))return'geodetect';if(METAMARKET_TOPIC.test(text))return'metamarket';if(TELEGRAM_TOPIC.test(text))return'telegram';if(FORUM_THREADS_TOPIC.test(text))return'forum_threads';if(FORUM_FEED_TOPIC.test(text))return'forum_feed';if(FORUM_TOPIC.test(text))return'forum';if(PROFILE_TOPIC.test(text))return'profile';
 if(act==='topic_recall')return'support_system';if(act==='topic_resume')return previous?.activeTopic||'support_system'
 if(['denial','confirmation','answer_to_question','additional_evidence','status_followup'].includes(act)&&previous?.activeTopic)return normalizeQl7SupportTopic(previous.activeTopic)
 if(coreference?.resolvedFromMemory&&hasDataAction(text,signals)&&previous?.activeTopic&&!NEG_ADS.test(text))return normalizeQl7SupportTopic(previous.activeTopic)
 const bankTopic=topBankTopic(signals);if(bankTopic)return normalizeQl7SupportTopic(bankTopic)
 if(act==='emotional_support'&&!hasMaterialSignal(text,signals))return'support_system'
 if(['gratitude','greeting','farewell','wellbeing_question','small_talk','emotional_support','humor_request','humor_followup'].includes(act))return'support_system'
 const explicitContinuation=/(?:это|этот|эта|они|он|она|там|тогда|дальше|продолж|а что насч[её]т|what about|and then|continue)/iu.test(text)
 return explicitContinuation?(previous?.activeTopic||'support_system'):'support_system'
}
function socialActFor(act){return ['gratitude','greeting','farewell','wellbeing_question','small_talk','general_knowledge_question','emotional_support','humor_request','humor_followup','topic_recall','topic_resume','spam_or_noise'].includes(act)?act:'none'}
function intentList(text,topic,act,signals,contactSignals={}){const out=[];if(!['none','small_talk'].includes(act))out.push(act);if(hasMaterialSignal(text,signals)||['qcoin','ads_packages','ads_campaigns','partnership','investment','contact','exchange_ai','security'].includes(topic))out.push(`${topic}:${act}`);if(OPERATOR_REQUEST.test(text))out.push('human_operator_request');if(CONTACT.test(text)||contactSignals.offered)out.push('contact_offer');if(contactSignals.refused)out.push('contact_dm_only');if(CRYPTO_PRICE.test(text)||AI_RECOMMENDATION.test(text))out.push('market_ai_recommendation');if(SCAM_CRIME.test(text))out.push('security_fraud_crime');return [...new Set(out)]}
function heuristicEvidenceStrengthFor(topic,act,text,signals={},margin=0){
 if(act==='spam_or_noise')return .18
 if(hasTheftSignal(text)||VIP_STATUS_TYPO.test(text)||SCAM_CRIME.test(text)||CRISIS_LANGUAGE.test(text))return .98
 if(isExplicitQcoinDataRequest(text,signals)||isExplicitVipDataRequest(text,signals)||isExplicitAdsPackageDataRequest(text,signals)||isExplicitAdsCampaignDataRequest(text,signals))return .96
 if(act==='ambiguous_request'||isVagueDomainMention(text,signals))return .46
 if(BUSINESS.test(text)||OPERATOR_REQUEST.test(text)||IDENTITY.test(text)||CRYPTO_PRICE.test(text)||AI_RECOMMENDATION.test(text))return .92
 if(act==='topic_recall')return .94
 if(topic==='support_system'&&act==='small_talk')return .72
 return Math.max(.72,Math.min(.98,.78+Math.min(.16,Number(margin||0)/20)))
}
const COMPONENT_KEYS=Object.freeze(['lexicalScore','phraseScore','ngramScore','entityScore','syntaxScore','messageActScore','emotionScore','urgencyScore','explicitSwitchScore','currentGoalScore','recentMaterialTopicScore','verifiedContextScore','negativeEvidencePenalty','contradictionPenalty','staleContextPenalty','quotedSpeechPenalty','unrelatedAdapterPenalty'])
function emptyScore(){return Object.fromEntries(COMPONENT_KEYS.map(k=>[k,0]))}
function scoreTotal(row){return COMPONENT_KEYS.reduce((sum,key)=>sum+Number(row.components?.[key]||0),0)}
function semanticScoreModel({text,topic,act,previous={},signals={},safety={}}){
 const rows=new Map(),positive=[],negative=[]
 const ensure=(candidate)=>{const normalized=normalizeQl7SupportTopic(candidate||'support_system');if(!rows.has(normalized))rows.set(normalized,{topic:normalized,components:emptyScore(),signals:[]});return rows.get(normalized)}
 const add=(candidate,key,value,signal)=>{const row=ensure(candidate);row.components[key]+=Number(value||0);if(signal)row.signals.push(signal);if(signal&&value>=0)positive.push({topic:row.topic,signal,component:key,value});else if(signal)negative.push({topic:row.topic,signal,component:key,value})}
 add(topic,'lexicalScore',2,'selected_topic_rule')
 for(const row of ql7Arr(signals.topicWeights)){add(row.topic,'lexicalScore',Number(row.weight||0),`bank:${ql7Arr(row.hits).join('|')}`);add(row.topic,'phraseScore',ql7Arr(row.hits).length,`phrase:${row.topic}`)}
 if(hasTheftSignal(text)){add('qcoin','urgencyScore',3,'theft_or_missing_money');add('qcoin','entityScore',2,'qcoin_ledger_entity')}
 if(hasBalanceSignal(text))add('qcoin','entityScore',4,'balance_entity')
 if(PACKAGE.test(text)&&/elite/iu.test(text))add('ads_packages','entityScore',5,'elite_package_entity')
 if(hasAdsSignal(text,signals))add(PACKAGE.test(text)?'ads_packages':'ads_campaigns','entityScore',4,'ads_entity')
 if(VIP.test(text)||VIP_STATUS_TYPO.test(text))add('vip','entityScore',4,'vip_entity')
 const explicitCatalogTopic=explicitCatalogTopicFor(text)
 if(explicitCatalogTopic)add(explicitCatalogTopic,'entityScore',5,'catalog_exact_label')
 const marketSignals=extractMarketSignals(text)
 if(marketSignals.active&&marketSignals.domainConfirmed&&explicitCatalogTopic!=='metamarket'){add('exchange_ai','entityScore',4,'market_asset_or_price_entity');if(marketSignals.requiresEntitlement)add('exchange_ai','verifiedContextScore',2,'ai_quota_or_vip_required');if(FINANCIAL_TIMEFRAME.test(text))add('exchange_ai','syntaxScore',1.5,'timeframe_entity')}
 if(SCAM_CRIME.test(text)){add('security','urgencyScore',4,'fraud_crime_signal');add('support_system','messageActScore',1,'operator_review_context')}
 if(act==='security_boundary')add('security','urgencyScore',8,'protected_boundary')
 if(act==='spam_or_noise')add('support_system','explicitSwitchScore',7,'noise_shape_clarification')
 if(act==='ambiguous_request')add('support_system','explicitSwitchScore',6,'ambiguous_metrics_choice')
 if(CRISIS_LANGUAGE.test(text))add('support_system','urgencyScore',5,'self_harm_language')
 if(FORUM_TOPIC.test(text)||FORUM_THREADS_TOPIC.test(text)||FORUM_FEED_TOPIC.test(text))add(topic.startsWith('forum')?topic:'forum','entityScore',3,'forum_entity')
 if(PROFILE_TOPIC.test(text))add('profile','entityScore',3,'profile_entity')
 if(BATTLECOIN_TOPIC.test(text))add('battlecoin','entityScore',4,'battlecoin_entity')
 if(QUANTUM_FAMILY_TOPIC.test(text))add('quantum_family','entityScore',4,'quantum_family_entity')
 if(MODERATION_TOPIC.test(text))add('moderation','entityScore',4,'moderation_entity')
 if(GEODETECT_TOPIC.test(text))add('geodetect','entityScore',4,'geodetect_entity')
 if(METAMARKET_TOPIC.test(text))add('metamarket','entityScore',3,'metamarket_entity')
 if(TELEGRAM_TOPIC.test(text))add('telegram','entityScore',3,'telegram_entity')
 if(OPERATOR_REQUEST.test(text)){add('contact','messageActScore',5,'human_operator_request');add('support_system','urgencyScore',1,'human_support_requested')}
 if(BUSINESS.test(text)||hasHit(signals,'business')||hasHit(signals,'investment'))add(INVESTMENT_SIGNAL.test(text)||hasHit(signals,'investment')?'investment':'partnership','entityScore',4,'business_relationship_entity')
 if(CONTACT.test(text)||CONTACT_CHANNEL_HINT.test(text))add('contact','entityScore',2,'contact_channel_hint')
 if(['personal_status_request','incident_report'].includes(act))add(topic,'messageActScore',2,`act:${act}`)
 // A vague personal-status request has several genuinely material read domains.
 // Preserve them as ranked hypotheses for the ONE interaction-modality owner;
 // do not fabricate a generic product menu later in presentation.
 if(act==='personal_status_request'&&topic==='support_system'&&!explicitCatalogTopic){
  for(const [candidate,score] of [['qcoin',3.7],['vip',3.55],['ads_packages',3.4],['profile',3.25]])add(candidate,'messageActScore',score,'vague_personal_status_material_candidate')
 }
 if(['how_to_question','roadmap_question','informational_question'].includes(act))add(topic,'syntaxScore',1.5,`question:${act}`)
 if(act==='topic_recall'){add('support_system','explicitSwitchScore',7,'topic_recall_over_stale_topic');if(previous.activeTopic)add(previous.activeTopic,'staleContextPenalty',-5,'stale_topic_rejected_for_recall')}
 if(act==='topic_resume'&&previous.activeTopic)add(previous.activeTopic,'explicitSwitchScore',3,'resume_previous_material_topic')
 if(act==='emotional_support'){add(topic,'emotionScore',3,'emotional_intent');if(!hasMaterialSignal(text,signals)){for(const candidate of ['qcoin','ads_packages','ads_campaigns','profile','vip'])add(candidate,'unrelatedAdapterPenalty',-3,'emotion_without_data_request')}}
 if(safety?.threat||safety?.selfHarm)add('support_system','urgencyScore',8,'critical_safety')
 if(previous.activeGoal&&topic===previous.activeTopic)add(topic,'currentGoalScore',.5,'active_goal_continuity')
 if(previous.activeTopic&&!['topic_recall','greeting','gratitude','farewell','small_talk','emotional_support'].includes(act))add(previous.activeTopic,'recentMaterialTopicScore',.35,'recent_material_context')
 if(NEG_ADS.test(text))add('ads_campaigns','negativeEvidencePenalty',-6,'negative_ads_evidence')
 const candidates=[...rows.values()].map(row=>Object.freeze({...row,total:Number(scoreTotal(row).toFixed(3)),components:Object.freeze(Object.fromEntries(Object.entries(row.components).map(([k,v])=>[k,Number(v.toFixed(3))]))),signals:Object.freeze(row.signals.slice(0,12))})).sort((a,b)=>b.total-a.total)
 const top=candidates[0]?.total||0,second=candidates[1]?.total||0,positiveTotal=candidates.reduce((sum,row)=>sum+Math.max(0,row.total),0)||1
 const entropy=Number(candidates.slice(0,6).reduce((sum,row)=>{const p=Math.max(0,row.total)/positiveTotal;return p>0?sum-(p*Math.log2(p)):sum},0).toFixed(3))
 return Object.freeze({topicCandidates:Object.freeze(candidates),topicScores:Object.freeze(Object.fromEntries(candidates.map(row=>[row.topic,row.components]))),positiveSignals:Object.freeze(positive.slice(0,32)),negativeSignals:Object.freeze(negative.slice(0,32)),rejectedCandidates:Object.freeze(candidates.slice(1,8).map(row=>({topic:row.topic,total:row.total,reason:'lower_weighted_score'}))),confidenceMargin:Number((top-second).toFixed(3)),semanticEntropy:entropy,clarificationRequired:act==='ambiguous_request'||(candidates.length>1&&top-second<1.25)})
}
function comparableAliasText(value=''){
 return ql7Str(value).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}_]+/gu,' ').replace(/\s+/gu,' ').trim()
}
function isBareKnowledgeAlias(text='',receipt={}){
 const alias=ql7Str(receipt?.candidates?.[0]?.matchedAlias)
 return Boolean(alias)&&comparableAliasText(text)===comparableAliasText(alias)
}
export function analyzeQl7SupportTurn({text='',locale='en',conversationId='',turnId='',previousContext={},baseAnalysis={},baseRoute={},baseTone={},baseAnalysisTrust=false,knowledgeContext={},now=Date.now}={}){
 const normalized=normalizeQl7SupportInput({text,locale:normalizeQl7SupportLocale(locale)})
 const source=normalized.normalizedText
 const semanticSource=source.replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}⚠️]+/gu,'').trim()
 const semanticSignals=collectQl7SemanticSignals(semanticSource,normalized.locale)
 const contactSignals=extractQl7SupportContactSignals(normalized.originalText||text)
 const marketSignals=extractMarketSignals(semanticSource)
 const coreference=resolveQl7Coreference({text:semanticSource,memoryGraph:{activeTopicFrame:previousContext?.activeTopicFrame}})
 const pendingCandidate=pendingIntentResolution({text:semanticSource,originalText:normalized.originalText||text,previousContext,signals:semanticSignals,marketSignals})
 const scamCrimeSignal=SCAM_CRIME.test(semanticSource)
 const approvedPublicFigures=Array.isArray(knowledgeContext?.approvedPublicFigures)?knowledgeContext.approvedPublicFigures:[]
 const publicFigureKnowledgeGraph=approvedPublicFigures.length?buildQl7SupportPublicFigureKnowledgeGraph({approvedEntries:approvedPublicFigures}):QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH
 const candidateKnowledgeSourceReceipt=knowledgeContext?.sourceReceipt||null
 const sourceReceiptAudit=candidateKnowledgeSourceReceipt?.schema==='ql7.support.knowledge-source-receipt'?auditQl7SupportKnowledgeSourceReceipt(candidateKnowledgeSourceReceipt,{now:semanticNowMs(now)}):{ok:false}
 const knowledgeSourceReceipt=sourceReceiptAudit.ok===true?candidateKnowledgeSourceReceipt:null
 const knowledgeAliasReceipt=resolveQl7SupportKnowledgeAlias({text:semanticSource,locale:normalized.locale})
 const graphDomainId=knowledgeAliasReceipt.decision==='selected'?ql7Str(knowledgeAliasReceipt.selectedDomainId):''
 const graphAliasBare=isBareKnowledgeAlias(semanticSource,knowledgeAliasReceipt)
 // A bare ecosystem alias is already resolved by the canonical knowledge graph.
 // Do not run the open-human/public-figure classifier for the same exact product label.
 const classifiedGeneralTopic=graphDomainId&&graphAliasBare?null:classifyQl7SupportGeneralTopic(semanticSource,{locale:normalized.locale,publicFigureGraph:publicFigureKnowledgeGraph})
 const pragmaticFrame=buildQl7SupportPragmaticFrame({text:semanticSource,originalText:normalized.originalText||text,locale:normalized.locale,semanticSignals,productDomainId:graphDomainId,generalTopic:classifiedGeneralTopic,marketSignals,previousContext})
 const generalTopic=pragmaticFrame.topGoalId==='domain_mention_only'?null:classifiedGeneralTopic
 const standaloneMessageAct=messageActWithPragmatics(messageActFor(semanticSource,previousContext,semanticSignals,normalized.originalText||text,generalTopic,contactSignals),pragmaticFrame)
 const pendingPrior=priorIntentConfirmation(previousContext)
 const pendingResetActs=new Set(['greeting','gratitude','farewell','wellbeing_question','emotional_support','humor_request','humor_followup','identity_question','general_knowledge_question','new_unrelated_issue'])
 const explicitFreshDomain=Boolean(graphDomainId&&!coreference.resolvedFromMemory&&graphDomainId!==ql7Str(pendingPrior?.slotValues?.domainId))
 const pendingDomainId=ql7Str(pendingPrior?.slotValues?.domainId)
 const compatiblePendingGeneralTopic=Boolean(
  pendingDomainId==='exchange_ai'&&
  generalTopic?.category==='ai'&&
  (marketSignals.hasAi||marketSignals.hasAsset||marketSignals.hasTimeframe)
 )
 const generalFreshTopic=Boolean(generalTopic&&!coreference.resolvedFromMemory&&!graphDomainId&&!compatiblePendingGeneralTopic)
 const shouldResetPending=Boolean(
  pendingPrior?.state==='collecting'&&
  !(baseAnalysisTrust===true&&baseAnalysis?.authoritativeChoice===true)&&
  (pendingResetActs.has(standaloneMessageAct)||explicitFreshDomain||generalFreshTopic)
 )
 const pendingResolution=shouldResetPending
  ?Object.freeze({prior:pendingPrior,reset:true,resetReason:'independent_new_turn'})
  :pendingCandidate
 const ruleMessageAct=pendingResolution?.messageAct||standaloneMessageAct
 const graphQuestionForm=Boolean(graphDomainId&&!graphAliasBare&&/[?？؟]/u.test(semanticSource))
 const canonicalMessageAct=graphDomainId&&graphAliasBare
  ?'ambiguous_request'
  :graphDomainId&&(['small_talk','general_knowledge_question'].includes(ruleMessageAct)||(graphQuestionForm&&ruleMessageAct==='ambiguous_request'))
   ?'informational_question'
   :ruleMessageAct
 const messageAct=baseAnalysisTrust===true&&ql7Str(baseAnalysis?.messageAct)?ql7Str(baseAnalysis.messageAct):canonicalMessageAct
 const ruleTopic=topicFor(semanticSource,messageAct,['identity_question','emotional_support','wellbeing_question','greeting','gratitude','farewell','small_talk'].includes(messageAct)?{}:previousContext,semanticSignals,normalized.originalText||text,coreference)
 const graphRouteEligible=Boolean(graphDomainId)&&(
  graphAliasBare||
  graphDomainId===ruleTopic||
  (knowledgeAliasReceipt.sourceGated&&['informational_question','how_to_question','roadmap_question','ambiguous_request'].includes(messageAct))||
  (['support_system','platform'].includes(ruleTopic)&&['informational_question','how_to_question','roadmap_question'].includes(messageAct))
 )
 const canonicalTopic=pendingResolution?.domainId||(graphRouteEligible?graphDomainId:ruleTopic)
 const topicDecisionReceipt=baseAnalysisTrust===true&&ql7Str(baseAnalysis?.topic)?arbitrateQl7SupportTopic({text:semanticSource,messageAct,previousActiveTopic:'',ruleTopic:ql7Str(baseAnalysis.topic),generalTopic:'',activeGoal:ql7Str(previousContext?.activeGoal)}):arbitrateQl7SupportTopic({text:semanticSource,messageAct,previousActiveTopic:ql7Str(previousContext?.activeTopic),ruleTopic:canonicalTopic,generalTopic:messageAct==='identity_question'?'':(generalTopic?.category||generalTopic?.topicId||''),publicFigure:messageAct==='identity_question'?null:(generalTopic?.publicFigure?.selected||null),explicitTopic:ql7Str(pendingResolution?.domainId)||(graphRouteEligible?graphDomainId:''),activeGoal:ql7Str(previousContext?.activeGoal)})
 const topic=normalizeQl7SupportTopic(baseAnalysisTrust===true&&ql7Str(baseAnalysis?.topic)?ql7Str(baseAnalysis.topic):topicDecisionReceipt.selectedTopic||canonicalTopic)
 const contextualPrior=activeFrameIntentContext(previousContext,topic,coreference)
 const contextualDataRequest=Boolean(contextualPrior&&coreference.resolvedFromMemory&&hasDataAction(semanticSource,semanticSignals)&&!NEG_ADS.test(semanticSource))
 const safety=evaluateQl7SupportSafety({text:safetySourceFor(normalized,text),priorConversationState:previousContext,now,locale:normalized.locale})
 const effectiveMessageAct=safety.category==='insult_uncertain'?'boundary_clarification':safety.category==='insult_denied'?'boundary_denial':messageAct
 const emotionAssessment=assessQl7SupportEmotion({text:source,locale:normalized.locale})
 const scoring=semanticScoreModel({text:semanticSource,topic,act:effectiveMessageAct,previous:previousContext,signals:semanticSignals,safety});const materialIntents=intentList(source,topic,effectiveMessageAct,semanticSignals,contactSignals);const entities=extractQl7SupportEntities(semanticSource,normalized.originalText||text);const catalogSubtopic=classifyQl7SupportCatalogSubIntent(topic,source)||(baseAnalysisTrust===true?ql7Str(baseAnalysis?.subIntent):'')||`${topic}_general`;const subtopic=topic==='ads_campaigns'&&entities.selfReference&&isExplicitAdsCampaignDataRequest(semanticSource,semanticSignals)?'ads_self_status':catalogSubtopic;const correction=effectiveMessageAct==='correction'?{text:source,replaces:ql7Str(previousContext?.activeTopic),appliedTopic:topic}:null
 const vaguePersonalStatusChoice=effectiveMessageAct==='personal_status_request'&&topic==='support_system'&&scoring.topicCandidates.filter((row)=>row.topic!=='support_system'&&Number(row.total||0)>0).length>=2;const needsChoice=effectiveMessageAct==='ambiguous_request'||effectiveMessageAct==='spam_or_noise'||vaguePersonalStatusChoice;const emotionalSupport=effectiveMessageAct==='emotional_support';const humor=['humor_request','humor_followup'].includes(effectiveMessageAct);const businessReady=businessBriefReady(semanticSource,semanticSignals,contactSignals);const relationshipSignal=['business_proposal','partnership_request','human_operator_request'].includes(messageAct)||BUSINESS.test(source)||hasHit(semanticSignals,'business')||hasHit(semanticSignals,'investment')
 const genericPersonalGate=Boolean(hasDataAction(semanticSource,semanticSignals)||STATUS.test(semanticSource)||pendingResolution?.operationId)
 const adapterGates=Object.freeze({
  qcoin:isExplicitQcoinDataRequest(semanticSource,semanticSignals)||pendingResolution?.domainId==='qcoin'&&Boolean(pendingResolution.operationId),
  vip:isExplicitVipDataRequest(semanticSource,semanticSignals)||pendingResolution?.domainId==='vip'&&Boolean(pendingResolution.operationId),
  ads_packages:isExplicitAdsPackageDataRequest(semanticSource,semanticSignals)||pendingResolution?.domainId==='ads_packages'&&Boolean(pendingResolution.operationId),
  ads_campaigns:isExplicitAdsCampaignDataRequest(semanticSource,semanticSignals)||pendingResolution?.domainId==='ads_campaigns'&&Boolean(pendingResolution.operationId)||topic==='ads_campaigns'&&contextualDataRequest,
  payments:topic==='payments'&&genericPersonalGate,profile:topic==='profile'&&genericPersonalGate,forum:topic==='forum'&&genericPersonalGate,forum_feed:topic==='forum_feed'&&genericPersonalGate,forum_threads:topic==='forum_threads'&&genericPersonalGate,metamarket:topic==='metamarket'&&genericPersonalGate,telegram:topic==='telegram'&&genericPersonalGate,battlecoin:topic==='battlecoin'&&genericPersonalGate,quantum_family:topic==='quantum_family'&&genericPersonalGate,moderation:topic==='moderation'&&genericPersonalGate,geodetect:topic==='geodetect'&&genericPersonalGate,
  exchange_ai:effectiveMessageAct==='ai_recommendation_request'&&topic==='exchange_ai'&&marketSignals.domainConfirmed&&((marketSignals.wantsAi||marketSignals.wantsPrice)||Boolean(pendingResolution?.operationId))||topic==='exchange_ai'&&contextualDataRequest
 })
 const contextualAdapterGates=Object.freeze(Object.fromEntries(Object.entries(adapterGates).map(([domainId,value])=>[domainId,value||domainId===topic&&contextualDataRequest])))
 const intentConfirmation=buildIntentConfirmation({text:semanticSource,conversationId:ql7Str(conversationId||previousContext?.conversationId||baseAnalysis?.conversationId),turnId:ql7Str(turnId||baseAnalysis?.turnId),topic,messageAct:effectiveMessageAct,signals:semanticSignals,marketSignals,scoring,adapterGates:contextualAdapterGates,previousContext,pending:pendingResolution,contextualPrior,contextualReference:coreference.resolvedFromMemory,now:semanticNowIso(now)})
 const adapterConfirmed=intentConfirmation.adapterAuthorized===true&&intentConfirmation.adapterDomainId===topic
 const adapterEligibility=Object.freeze({qcoin:adapterConfirmed&&topic==='qcoin',vip:adapterConfirmed&&topic==='vip',ads_packages:adapterConfirmed&&topic==='ads_packages',ads_campaigns:adapterConfirmed&&topic==='ads_campaigns',payments:adapterConfirmed&&topic==='payments',profile:adapterConfirmed&&topic==='profile',forum:adapterConfirmed&&topic==='forum',forum_feed:adapterConfirmed&&topic==='forum_feed',forum_threads:adapterConfirmed&&topic==='forum_threads',metamarket:adapterConfirmed&&topic==='metamarket',telegram:adapterConfirmed&&topic==='telegram',battlecoin:adapterConfirmed&&topic==='battlecoin',quantum_family:adapterConfirmed&&topic==='quantum_family',moderation:adapterConfirmed&&topic==='moderation',geodetect:adapterConfirmed&&topic==='geodetect',exchange_ai:adapterConfirmed&&topic==='exchange_ai',mongoReadAllowed:adapterConfirmed&&!emotionalSupport&&!['topic_recall','spam_or_noise','ambiguous_request'].includes(effectiveMessageAct)})
 const primaryIntent=materialIntents[0]||effectiveMessageAct;const secondaryIntents=Object.freeze(materialIntents.slice(1));const deferredIntents=Object.freeze(emotionalSupport&&hasMaterialSignal(source,semanticSignals)?materialIntents.filter(v=>v!==primaryIntent):[])
 const humanConversationCell=generalTopic?resolveQl7SupportHumanConversationCell({category:generalTopic?.category||'open_subject',text:semanticSource,messageAct:effectiveMessageAct}):null
 const openHumanRoute=routeQl7SupportOpenHumanKnowledge({text:semanticSource,locale:normalized.locale,generalTopic,sourceReceipt:knowledgeSourceReceipt})
 const publicFigureSelected=generalTopic?.publicFigure?.selected||null
 const publicFigureQuestion=generalTopic?.publicFigure?classifyQl7SupportPublicFigureQuestionKind(semanticSource):null
 const publicFigureQuestionKind=publicFigureQuestion?.kind||''
 const publicFigureQuestionKindEffective=publicFigureQuestionKind||'stable_identity'
 const bundledPublicFigureFacts=publicFigureSelected?buildQl7SupportBundledStablePublicFigureFactProjection({figure:publicFigureSelected,questionKind:publicFigureQuestionKindEffective}):null
 const externalPublicFigureFacts=publicFigureSelected?validateQl7SupportPublicFigureFactBundle(knowledgeContext?.publicFigureFactBundle||{}, {personId:publicFigureSelected.personId,questionKind:publicFigureQuestionKindEffective,expectedSourceReceiptId:knowledgeSourceReceipt?.receiptId||''}):null
 const externalPublicFigureFactsUsable=externalPublicFigureFacts?.ok===true&&ql7Arr(externalPublicFigureFacts?.facts).length>0
 const publicFigureFactProjection=externalPublicFigureFactsUsable?externalPublicFigureFacts:(bundledPublicFigureFacts?.projection||externalPublicFigureFacts)
 const publicFigureFactSourceReceipt=externalPublicFigureFactsUsable?knowledgeSourceReceipt:bundledPublicFigureFacts?.sourceReceipt
 const publicFigureSourceResolution=generalTopic?.publicFigure?resolveQl7SupportPublicFigureSourceRequirement({figure:publicFigureSelected,questionKind:publicFigureQuestionKindEffective,sourceReceipt:publicFigureFactSourceReceipt||knowledgeSourceReceipt,now:semanticNowIso(now),maxAgeMs:publicFigureFactSourceReceipt?.sourceClass==='curated_stable'?365*24*60*60*1000:24*60*60*1000}):null
 const languageVariantProfile=QL7_SUPPORT_LANGUAGE_VARIANT_PROFILES[normalized.locale]||null
 const ecosystemAttackAssessment=assessQl7SupportEcosystemAttack({text:semanticSource,locale:normalized.locale,safety,analysis:{topic,messageAct:effectiveMessageAct,materialActionability:safety.materialActionability},semanticSignals,entities})
 const illicitAssetRouteAssessment=evaluateQl7SupportIllicitAssetRoute({text:semanticSource,locale:normalized.locale,analysis:{topic,messageAct:effectiveMessageAct,primaryIntent,scamCrimeSignal},safety,semanticSignals})
 const humorSafety=evaluateQl7SupportHumorSafety({requested:humor,safetyClass:safety.category,emotionClass:emotionAssessment.emotionClass,incidentClass:scamCrimeSignal?'security_incident':''})
 const humorMechanismPlan=humor&&humorSafety.allowed?buildQl7SupportHumorMechanismPlan({locale:normalized.locale,topic:generalTopic?.category||topic,index:Number.parseInt(ql7StableHash(`${conversationId}:${turnId}:${semanticSource}`).slice(0,8),16)%50000,seed:`${conversationId}:${turnId}`}):null
 const decisionKind=adapterEligibility.mongoReadAllowed?'personal_read':safety.operatorRequired?'restriction':'general_answer'
 const decisionMathReceipt=buildQl7DecisionMathReceipt({text:semanticSource,locale:normalized.locale,domain:topic,intentFamily:effectiveMessageAct,scoring,decisionKind,policyProofPresent:false,evidenceCoverage:adapterEligibility.mongoReadAllowed?1:decisionKind==='general_answer'?1:0,collisionRisk:normalized?.hypotheses?.some?.((row)=>row?.kind==='mixed_script')?.15:0,analysis:{emotionAssessment},memoryGraph:previousContext?.memoryGraph||previousContext})
 const clarificationDecision=rankQl7SupportClarifications({hypotheses:scoring.topicCandidates,decisionMathReceipt,memory:previousContext?.memoryGraph||previousContext,missingSlot:ql7Arr(intentConfirmation?.missingSlots)[0]||'',locale:normalized.locale})
 const answerabilityDecision=resolveQl7SupportUserAnswerability({pragmaticFrame,messageAct:effectiveMessageAct,intentConfirmation,scoring,decisionMathReceipt,safety})
 const analysis=Object.freeze({...baseAnalysis,language:normalized.locale,locale:normalized.locale,originalText:normalized.originalText,normalizedText:normalized.normalizedText,canonicalText:normalized.canonicalText,normalization:normalized,semanticBankVersion:QL7_SUPPORT_SEMANTIC_BANK_VERSION,semanticSignals,pragmaticFrame,answerabilityDecision,topicDecisionReceipt,coreference,generalTopic,publicFigureKnowledgeGraph:Object.freeze({graphHash:publicFigureKnowledgeGraph.graphHash,count:publicFigureKnowledgeGraph.count,requiredCoverage:publicFigureKnowledgeGraph.requiredCoverage,coverageFloorMet:publicFigureKnowledgeGraph.coverageFloorMet}),knowledgeSourceReceipt:knowledgeSourceReceipt?Object.freeze({receiptId:knowledgeSourceReceipt.receiptId,sourceClass:knowledgeSourceReceipt.sourceClass,sourceRef:knowledgeSourceReceipt.sourceRef,status:knowledgeSourceReceipt.status,verifiedAt:knowledgeSourceReceipt.verifiedAt,receiptHash:knowledgeSourceReceipt.receiptHash}):null,humanConversationCell,languageVariantProfile,openHumanRoute,publicFigureQuestionKind,publicFigureQuestionReceipt:publicFigureQuestion,publicFigureSourceResolution,publicFigureFactProjection,publicFigureFactSourceReceipt:publicFigureFactSourceReceipt||null,humorSafety,humorMechanismPlan,ecosystemAttackAssessment,illicitAssetRouteAssessment,knowledgeAliasReceipt,pragmaticActs:Object.freeze([...(GREETING.test(semanticSource)||hasHit(semanticSignals,'greetings')?['greeting']:[]),...(WELLBEING.test(semanticSource)?['wellbeing_question']:[]),...(PLAYFUL_INVITATION.test(semanticSource)?['playful_invitation']:[]),effectiveMessageAct].filter((v,i,a)=>v&&a.indexOf(v)===i)),socialAct:socialActFor(effectiveMessageAct),materialIntents:Object.freeze(materialIntents),primaryIntent,secondaryIntents,deferredIntents,safetyIntent:safety.threat||safety.selfHarm?safety.category:'',emotionalIntent:emotionalSupport?'supportive_stabilization':'',dataIntent:adapterEligibility.mongoReadAllowed?topic:'',operatorIntent:safety.operatorRequired?'operator_review':messageAct==='human_operator_request'?'human_operator_requested':scamCrimeSignal?'security_fraud_crime_review':relationshipSignal?'relationship_intake':'',entities,contactSignals,contactOffered:contactSignals.offered,contactRefused:contactSignals.refused,contactConsent:contactSignals.consent,contactChannels:contactSignals.channels,contactPreferred:contactSignals.preferred,businessIntent:relationshipSignal?'strategic_relationship':'',businessBriefReady:businessReady,relationshipSignal,marketIntent:adapterEligibility.exchange_ai?'crypto_ai_recommendation':'',marketSignals,scamCrimeSignal,topic,subtopic,subIntent:subtopic,messageAct:effectiveMessageAct,role:effectiveMessageAct,correction,rejectedHypothesis:correction?{topic:ql7Str(previousContext?.activeTopic),reason:'user_correction',text:source}:null,denial:effectiveMessageAct==='correction',emotion:emotionalSupport?'distress':humor?'playful':safety.frustration?'frustrated':relationshipSignal?'focused':scamCrimeSignal?'strict':'neutral',urgency:safety.threat||safety.selfHarm?'critical':hasTheftSignal(source)||scamCrimeSignal?'high':messageAct==='human_operator_request'?'medium':'normal',commercialIntent:relationshipSignal,safetyCategory:safety.category,safety,emotionAssessment,intentConfirmation,needsChoice:needsChoice||intentConfirmation.state==='collecting',clarificationRequired:answerabilityDecision.userClarificationRequired,userClarificationRequired:answerabilityDecision.userClarificationRequired,emotionalSupport,humor,adapterGates:contextualAdapterGates,requiresAdapter:adapterEligibility.mongoReadAllowed&&['qcoin','vip','ads_packages','ads_campaigns','payments','profile','forum','forum_feed','forum_threads','metamarket','telegram','battlecoin','quantum_family','moderation','geodetect','exchange_ai'].includes(topic),adapterEligibility,topicCandidates:scoring.topicCandidates,topicScores:scoring.topicScores,positiveSignals:scoring.positiveSignals,negativeSignals:scoring.negativeSignals,rejectedCandidates:scoring.rejectedCandidates,confidenceMargin:scoring.confidenceMargin,semanticEntropy:scoring.semanticEntropy,confidence:decisionMathReceipt.semanticConfidence,confidenceKind:'decision_math_semantic_confidence',confidenceCalibrated:decisionMathReceipt.calibrationValid===true,calibrationStatus:decisionMathReceipt.calibrationStatus,decisionMathReceipt,clarificationDecision,policyAuthorizationRequired:decisionMathReceipt.abstention.policyProofRequired===true,policyHoldRequired:decisionMathReceipt.abstention.policyHold===true,semanticAbstentionRequired:decisionMathReceipt.abstention.semanticAbstain===true,deterministicEvidenceOnly:true,finalSemanticAuthority:'ql7-native-understanding-coordinator',heuristicScoresAreProbabilities:false,fingerprint:ql7StableHash(`${normalized.fingerprint}:${topic}:${effectiveMessageAct}:${intentConfirmation.receiptHash}:${pragmaticFrame.receiptHash}`)})
 const route=Object.freeze({...baseRoute,topic,topicDecisionReceipt,messageAct:effectiveMessageAct,subIntent:subtopic,confidence:analysis.confidence,confidenceMargin:analysis.confidenceMargin,semanticEntropy:analysis.semanticEntropy,intentConfirmation,needsChoice:analysis.needsChoice,clarificationRequired:analysis.clarificationRequired,userClarificationRequired:analysis.userClarificationRequired,adapterEligibility,requiredAdapter:analysis.requiresAdapter?topic:''})
 const tone=Object.freeze({...baseTone,category:safety.category,taxonomyCategory:safety.category,severity:safety.severity,threat:safety.threat,safetyEscalation:safety.operatorRequired,profanityDetected:safety.insult,directedAtSupport:safety.insult})
 return Object.freeze({version:QL7_SUPPORT_ANALYZE_TURN_VERSION,locale:normalized.locale,normalization:normalized,safety,tone,route,analysis})
}
