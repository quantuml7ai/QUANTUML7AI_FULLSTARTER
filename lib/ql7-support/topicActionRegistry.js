import {normalizeQl7SupportLocale} from './language/locales.js'
import {normalizeQl7SupportTopic} from './ecosystemCatalog.js'
import {getQl7SupportMultilingualActionLabels} from './language/ecosystemLocaleLexicon.js'

function str(value) { return String(value ?? '').trim() }
function frozen(value) { return Object.freeze(value) }

export const QL7_SUPPORT_ACTION_REGISTRY = frozen({
  home: frozen({ actionType: 'route', href: '/' }),
  homepage: frozen({ actionType: 'route', href: '/' }),
  crypto_radar: frozen({ actionType: 'route', href: '/' }),
  qrm: frozen({ actionType: 'route', href: '/' }),
  platform: frozen({ actionType: 'route', href: '/about' }),
  about: frozen({ actionType: 'route', href: '/about' }),
  news: frozen({ actionType: 'route', href: '/', tab: 'crypto-news' }),
  exchange: frozen({ actionType: 'route', href: '/exchange' }),
  exchange_ai: frozen({ actionType: 'route', href: '/exchange', tab: 'ai-box' }),
  battlecoin: frozen({ actionType: 'route', href: '/exchange', tab: 'battlecoin' }),
  battle_chat: frozen({ actionType: 'route', href: '/exchange', tab: 'battle-chat' }),
  futures: frozen({ actionType: 'route', href: '/exchange', tab: 'futures' }),
  academy: frozen({ actionType: 'route', href: '/academy' }),
  academy_exam: frozen({ actionType: 'route', href: '/academy', tab: 'exam' }),
  gameverse: frozen({ actionType: 'route', href: '/game' }),
  game: frozen({ actionType: 'route', href: '/game' }),
  metastudio: frozen({ actionType: 'route', href: '/game?ql7Action=metastudio#metastudio', availability: 'planned', purpose: 'open_interest_registration' }),
  metaverse: frozen({ actionType: 'route', href: '/about', tab: 'roadmap' }),
  quantum_zigzag: frozen({ actionType: 'route', href: '/about', tab: 'roadmap' }),
  ql7_blockchain: frozen({ actionType: 'route', href: '/about', tab: 'roadmap' }),
  metamarket: frozen({ actionType: 'global_event', eventName: 'metamarket:open', detail: frozen({ source: 'ql7-support', initialMode: 'market' }) }),
  ads: frozen({ actionType: 'route', href: '/ads' }),
  ads_packages: frozen({ actionType: 'route', href: '/ads', tab: 'packages' }),
  ads_campaigns: frozen({ actionType: 'route', href: '/ads', tab: 'campaigns' }),
  qcoin: frozen({ actionType: 'global_event', eventName: 'quantum-wallet:open', detail: frozen({ source: 'ql7-support', tab: 'qcoin' }) }),
  wallet: frozen({ actionType: 'global_event', eventName: 'quantum-wallet:open', detail: frozen({ source: 'ql7-support', tab: 'overview' }) }),
  payments: frozen({ actionType: 'global_event', eventName: 'quantum-wallet:open', detail: frozen({ source: 'ql7-support', tab: 'history' }) }),
  vip: frozen({ actionType: 'route', href: '/subscribe' }),
  subscribe: frozen({ actionType: 'route', href: '/subscribe' }),
  forum: frozen({ actionType: 'route', href: '/forum' }),
  forum_feed: frozen({ actionType: 'route', href: '/forum', tab: 'feed' }),
  forum_threads: frozen({ actionType: 'route', href: '/forum', tab: 'threads' }),
  search: frozen({ actionType: 'route', href: '/forum', tab: 'search' }),
  geodetect: frozen({ actionType: 'route', href: '/forum', tab: 'geodetect' }),
  media: frozen({ actionType: 'route', href: '/forum', tab: 'media' }),
  profile: frozen({ actionType: 'route', href: '/forum', tab: 'profile' }),
  moderation: frozen({ actionType: 'route', href: '/forum', tab: 'moderation' }),
  messenger: frozen({ actionType: 'route', href: '/forum', tab: 'messenger' }),
  quests: frozen({ actionType: 'route', href: '/forum', tab: 'quests' }),
  quantum_family: frozen({ actionType: 'route', href: '/forum', tab: 'quantum-family' }),
  auth: frozen({ actionType: 'global_event', eventName: 'open-auth', detail: frozen({ source: 'ql7-support' }) }),
  telegram: frozen({ actionType: 'route', href: '/tma/auto' }),
  push: frozen({ actionType: 'route', href: '/forum', tab: 'notifications' }),
  contact: frozen({ actionType: 'route', href: '/forum?ql7SupportOpen=1&inbox=messages&dmUser=ql7-support' }),
  privacy: frozen({ actionType: 'route', href: '/privacy' }),
  security: frozen({ actionType: 'route', href: '/privacy', tab: 'security' }),
  account_deletion: frozen({ actionType: 'route', href: '/privacy', tab: 'account-deletion' }),
  navigation: frozen({ actionType: 'route', href: '/' }),
  roadmap: frozen({ actionType: 'route', href: '/about', tab: 'roadmap' }),
  system_status: frozen({ actionType: 'route', href: '/about', tab: 'system-status' }),
  localization: frozen({ actionType: 'route', href: '/about', tab: 'localization' }),
  accessibility: frozen({ actionType: 'route', href: '/about', tab: 'accessibility' }),
  learning_governance: frozen({ actionType: 'case_action', caseAction: 'continue_support' }),
  support: frozen({ actionType: 'case_action', caseAction: 'continue_support' }),
  support_system: frozen({ actionType: 'case_action', caseAction: 'continue_support' }),
})

export const QL7_SUPPORT_ROUTE_HREFS = frozen(Object.fromEntries(Object.entries(QL7_SUPPORT_ACTION_REGISTRY).filter(([, value]) => value.actionType === 'route').map(([key, value]) => [key, value.href])))
export const QL7_SUPPORT_SAFE_ROUTE_IDS = frozen(Object.keys(QL7_SUPPORT_ACTION_REGISTRY))
const QL7_SUPPORT_ROUTE_NAVIGATION_HREFS = frozen({
  exchange_ai: '/exchange#ql7-exchange-ai-box',
  battlecoin: '/exchange#ql7-exchange-battlecoin',
  battle_chat: '/exchange#ql7-exchange-battle-chat',
  futures: '/exchange#ql7-exchange-battlecoin',
})

const LABELS = frozen({
  en: { default: ['Learn more','Open the section','Review details'], wallet: 'Open Quantum Wallet', qcoin: 'Check QCoin', vip: 'Open subscriptions', metamarket: 'Open MetaMarket', ads: 'Open advertising cabinet', exchange: 'Open the exchange', exchangeAi: 'Open AI Box', gameverse: 'Open Gameverse', academy: 'Open Academy', forum: 'Open Forum', messenger: 'Open Messenger', auth: 'Open authorization', privacy: 'Open privacy center', support: 'Continue with support' },
  ru: { default: ['Узнать подробнее','Открыть раздел','Посмотреть детали'], wallet: 'Открыть Quantum Wallet', qcoin: 'Проверить QCoin', vip: 'Открыть подписки', metamarket: 'Открыть MetaMarket', ads: 'Открыть рекламный кабинет', exchange: 'Открыть биржу', exchangeAi: 'Открыть AI Box', gameverse: 'Открыть Gameverse', academy: 'Открыть Академию', forum: 'Открыть форум', messenger: 'Открыть Messenger', auth: 'Открыть авторизацию', privacy: 'Открыть центр приватности', support: 'Продолжить с поддержкой' },
  uk: { default: ['Дізнатися більше','Відкрити розділ','Переглянути деталі'], wallet: 'Відкрити Quantum Wallet', qcoin: 'Перевірити QCoin', vip: 'Відкрити підписки', metamarket: 'Відкрити MetaMarket', ads: 'Відкрити рекламний кабінет', exchange: 'Відкрити біржу', exchangeAi: 'Відкрити AI Box', gameverse: 'Відкрити Gameverse', academy: 'Відкрити Академію', forum: 'Відкрити форум', messenger: 'Відкрити Messenger', auth: 'Відкрити авторизацію', privacy: 'Відкрити центр приватності', support: 'Продовжити з підтримкою' },
  es: { default: ['Ver detalles','Abrir sección','Conocer más'], wallet: 'Abrir Quantum Wallet', qcoin: 'Comprobar QCoin', vip: 'Abrir suscripciones', metamarket: 'Abrir MetaMarket', ads: 'Abrir publicidad', exchange: 'Abrir exchange', exchangeAi: 'Abrir AI Box', gameverse: 'Abrir Gameverse', academy: 'Abrir Academia', forum: 'Abrir foro', messenger: 'Abrir Messenger', auth: 'Abrir autorización', privacy: 'Abrir privacidad', support: 'Continuar con soporte' },
  tr: { default: ['Daha fazla bilgi','Bölümü aç','Ayrıntıları incele'], wallet: 'Quantum Wallet aç', qcoin: 'QCoin kontrol et', vip: 'Abonelikleri aç', metamarket: 'MetaMarket aç', ads: 'Reklam panelini aç', exchange: 'Borsayı aç', exchangeAi: 'AI Box aç', gameverse: 'Gameverse aç', academy: 'Akademiyi aç', forum: 'Forumu aç', messenger: 'Messenger aç', auth: 'Yetkilendirmeyi aç', privacy: 'Gizlilik merkezini aç', support: 'Destekle devam et' },
  ar: { default: ['معرفة المزيد','فتح القسم','عرض التفاصيل'], wallet: 'فتح Quantum Wallet', qcoin: 'فحص QCoin', vip: 'فتح الاشتراكات', metamarket: 'فتح MetaMarket', ads: 'فتح لوحة الإعلانات', exchange: 'فتح المنصة', exchangeAi: 'فتح AI Box', gameverse: 'فتح Gameverse', academy: 'فتح الأكاديمية', forum: 'فتح المنتدى', messenger: 'فتح Messenger', auth: 'فتح تسجيل الدخول', privacy: 'فتح مركز الخصوصية', support: 'المتابعة مع الدعم' },
  zh: { default: ['了解详情','打开页面','查看更多'], wallet: '打开 Quantum Wallet', qcoin: '检查 QCoin', vip: '打开订阅', metamarket: '打开 MetaMarket', ads: '打开广告中心', exchange: '打开交易所', exchangeAi: '打开 AI Box', gameverse: '打开 Gameverse', academy: '打开学院', forum: '打开论坛', messenger: '打开 Messenger', auth: '打开授权', privacy: '打开隐私中心', support: '继续联系支持' },
  he: { default: ['לפרטים נוספים','לפתוח את האזור','לעיין בפרטים'], wallet: 'פתיחת Quantum Wallet', qcoin: 'בדיקת QCoin', vip: 'פתיחת מנויים', metamarket: 'פתיחת MetaMarket', ads: 'פתיחת מרכז הפרסום', exchange: 'פתיחת הבורסה', exchangeAi: 'פתיחת AI Box', gameverse: 'פתיחת Gameverse', academy: 'פתיחת האקדמיה', forum: 'פתיחת הפורום', messenger: 'פתיחת Messenger', auth: 'פתיחת התחברות', privacy: 'פתיחת מרכז פרטיות', support: 'המשך עם התמיכה' },
})

const TOPIC_ROUTE_ID = frozen({ homepage:'homepage',crypto_radar:'crypto_radar',platform:'platform',news:'news',exchange:'exchange',exchange_ai:'exchange_ai',battlecoin:'battlecoin',battle_chat:'battle_chat',futures:'futures',academy:'academy',academy_exam:'academy_exam',gameverse:'gameverse',metastudio:'metastudio',metaverse:'metaverse',quantum_zigzag:'quantum_zigzag',ql7_blockchain:'ql7_blockchain',metamarket:'metamarket',ads_packages:'ads_packages',ads_campaigns:'ads_campaigns',qcoin:'qcoin',wallet:'wallet',vip:'vip',payments:'payments',forum:'forum',forum_feed:'forum_feed',forum_threads:'forum_threads',search:'search',geodetect:'geodetect',media:'media',profile:'profile',auth:'auth',telegram:'telegram',moderation:'moderation',messenger:'messenger',push:'push',quests:'quests',quantum_family:'quantum_family',contact:'contact',privacy:'privacy',security:'security',account_deletion:'account_deletion',navigation:'navigation',roadmap:'roadmap',system_status:'system_status',localization:'localization',accessibility:'accessibility',learning_governance:'learning_governance',support_system:'support_system' })
function hashInt(value=''){let hash=2166136261;for(const char of str(value)||'ql7-action'){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619)}return Math.abs(hash)}
function pick(list=[],seed=''){const values=(Array.isArray(list)?list:[]).filter(Boolean);return values.length?values[hashInt(seed)%values.length]:''}

export function isQl7SupportSafeRouteId(value=''){return Object.prototype.hasOwnProperty.call(QL7_SUPPORT_ACTION_REGISTRY,str(value))}
export function getQl7SupportRouteHref(value=''){return str(QL7_SUPPORT_ACTION_REGISTRY[str(value)]?.href)}
export function getQl7SupportRouteNavigationHref(value=''){
  const routeId=str(value)
  return str(QL7_SUPPORT_ROUTE_NAVIGATION_HREFS[routeId]||QL7_SUPPORT_ACTION_REGISTRY[routeId]?.href)
}
export function getQl7SupportActionDescriptor(value=''){const row=QL7_SUPPORT_ACTION_REGISTRY[str(value)];return row?frozen({...row,detail:row.detail?{...row.detail}:undefined}):null}
export function getQl7SupportTopicRouteId(topic=''){const raw=str(topic).toLowerCase();if(raw==='qrm'||raw==='crypto_radar')return raw;return TOPIC_ROUTE_ID[normalizeQl7SupportTopic(topic)]||''}
export function getQl7SupportTopicActionLabel(locale='en',seed='',routeId=''){const lang=normalizeQl7SupportLocale(locale);const row=LABELS[lang]||getQl7SupportMultilingualActionLabels(lang)||LABELS.en;const special=routeId==='qcoin'?row.qcoin:routeId==='wallet'||routeId==='payments'?row.wallet:routeId==='vip'?row.vip:routeId==='metamarket'?row.metamarket:routeId.startsWith('ads_')?row.ads:routeId==='exchange_ai'?row.exchangeAi:routeId.startsWith('exchange')||['battlecoin','battle_chat','futures'].includes(routeId)?row.exchange:routeId==='gameverse'?row.gameverse:['metastudio','metaverse','quantum_zigzag','ql7_blockchain'].includes(routeId)?'':routeId==='academy'||routeId==='academy_exam'?row.academy:routeId==='forum'||routeId.startsWith('forum_')||['search','geodetect','media','quantum_family','moderation','profile','push','quests'].includes(routeId)?row.forum:routeId==='messenger'?row.messenger:routeId==='auth'||routeId==='telegram'?row.auth:['privacy','security','account_deletion'].includes(routeId)?row.privacy:['contact','support_system','learning_governance'].includes(routeId)?row.support:'';return special||pick(row.default,`${seed}:${lang}`)||LABELS.en.default[0]}
export function getQl7SupportTopicAction(topic='',{locale='en',seed='',kind='primary'}={}){const normalizedTopic=normalizeQl7SupportTopic(topic);const routeId=getQl7SupportTopicRouteId(normalizedTopic);const descriptor=getQl7SupportActionDescriptor(routeId);if(!routeId||!descriptor)return null;return frozen({id:`open-${normalizedTopic}`,routeId,...descriptor,label:getQl7SupportTopicActionLabel(locale,`${seed}:${normalizedTopic}`,routeId),iconKey:'arrow-right',kind})}
