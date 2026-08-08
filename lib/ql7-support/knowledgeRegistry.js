import {
  QL7_SUPPORT_ECOSYSTEM_TOPICS,
  buildQl7SupportDomainPlan,
  getQl7SupportTopicLabel,
  normalizeQl7SupportTopic,
} from './ecosystemCatalog.js'
import { normalizeQl7SupportLocale } from './language/locales.js'
import {
  buildQl7LocalDictionaryContext,
  realizeQl7LocalDictionaryAnswer,
} from './localDictionaryContext.js'
import { getQl7SupportCanonicalDomain } from './knowledge/domainRegistry.js'
import { getQl7SupportDomainKnowledgePack } from './knowledge/domainKnowledge.js'

function str(value) { return String(value ?? '').trim() }

const UI_PATHS = Object.freeze({
  homepage: Object.freeze({
    en: [
      'CryptoRadar is the market overview on the main page. It helps you scan current market movement, news context and attention signals in one place.',
      'Open the main page, review the radar blocks, then open a concrete market or news item when you need details.',
      'The radar explains context and direction; it does not promise profit or replace your own decision.',
    ],
    ru: [
      'CryptoRadar — это обзор рынка на главной странице. Он помогает быстро увидеть движение рынка, новостной фон и сигналы внимания в одном месте.',
      'Откройте главную страницу, посмотрите блоки радара и переходите в конкретный рынок или новость, когда нужна детализация.',
      'Радар объясняет контекст и направление движения, но не обещает прибыль и не заменяет ваше решение.',
    ],
    uk: [
      'CryptoRadar — це огляд ринку на головній сторінці. Він допомагає швидко побачити рух ринку, новинний фон і сигнали уваги.',
      'Відкрийте головну сторінку, перегляньте блоки радара й переходьте до конкретного ринку або новини для деталей.',
      'Радар пояснює контекст, але не гарантує прибуток.',
    ],
  }),
  exchange: Object.freeze({
    en: [
      'Open Quantum Exchange and choose the market you need.',
      'Use the chart timeframe and the price/volume indicators to inspect movement.',
      'Compare the order book with recent trades before making a decision.',
      'Open an order only after checking its type, amount and price; Support does not predict profit.',
    ],
    ru: [
      'Откройте Quantum Exchange и выберите нужный рынок.',
      'На графике задайте таймфрейм и сравните движение цены с объёмом.',
      'Сопоставьте стакан заявок с последними сделками — так видно текущий баланс спроса и предложения.',
      'Перед созданием ордера проверьте его тип, объём и цену. Поддержка не прогнозирует прибыль.',
    ],
    uk: [
      'Відкрийте Quantum Exchange і виберіть потрібний ринок.',
      'На графіку задайте таймфрейм і порівняйте рух ціни з обсягом.',
      'Зіставте книгу заявок з останніми угодами.',
      'Перед створенням ордера перевірте тип, обсяг і ціну.',
    ],
  }),
  exchange_ai: Object.freeze({
    en: ['Open the Exchange AI panel, select the market and timeframe, then compare the signal with the live chart and order book. Treat the signal as analysis, not a guarantee.'],
    ru: ['Откройте панель Exchange AI, выберите рынок и таймфрейм, затем сопоставьте сигнал с живым графиком и стаканом заявок. Сигнал — это аналитика, а не гарантия результата.'],
    uk: ['Відкрийте панель Exchange AI, виберіть ринок і таймфрейм, а потім звірте сигнал із графіком та книгою заявок.'],
  }),
  battlecoin: Object.freeze({
    en: [
      'BattleCoin is the competitive trading/game order layer inside the ecosystem. It is about positions, orders, status and results.',
      'Use it when you need to check an order, side, amount, fill, cancellation or an error connected to a BattleCoin action.',
      'If you ask about a chat message or room, I will treat that as Battle Chat, not as a BattleCoin order.',
    ],
    ru: [
      'BattleCoin — это соревновательный торгово-игровой слой экосистемы: позиции, ордера, статус и результат действий.',
      'К нему относятся вопросы про ордер, сторону, сумму, исполнение, отмену или ошибку действия BattleCoin.',
      'Если речь про сообщения или комнату общения, я буду относить это к Battle Chat, а не к ордерам BattleCoin.',
    ],
    uk: [
      'BattleCoin — це змагальний торгово-ігровий шар екосистеми: позиції, ордери, статус і результат дій.',
      'До нього належать питання про ордер, сторону, суму, виконання, скасування або помилку дії.',
      'Якщо йдеться про повідомлення чи кімнату спілкування, це Battle Chat.',
    ],
  }),
  battle_chat: Object.freeze({
    en: [
      'Battle Chat is the conversation layer around BattleCoin activity. It covers messages, rooms, reactions and moderation state.',
      'Use it for chat visibility, message delivery, likes, moderation notices or room behavior.',
      'Order status and position checks stay in BattleCoin; chat behavior stays in Battle Chat.',
    ],
    ru: [
      'Battle Chat — это слой общения вокруг BattleCoin: сообщения, комнаты, реакции и состояние модерации.',
      'К нему относятся видимость чата, доставка сообщений, лайки, уведомления модерации и поведение комнаты.',
      'Статусы ордеров проверяются в BattleCoin, а поведение сообщений — в Battle Chat.',
    ],
    uk: [
      'Battle Chat — це шар спілкування навколо BattleCoin: повідомлення, кімнати, реакції та модерація.',
      'Сюди належать видимість чату, доставка повідомлень, лайки й поведінка кімнати.',
      'Статуси ордерів залишаються в BattleCoin.',
    ],
  }),
  ads_campaigns: Object.freeze({
    en: [
      'Open Ads, go to your campaign list and select the campaign.',
      'The analytics panel shows impressions, clicks, CTR, period and geographic distribution.',
      'Change the period to compare short-term and lifetime performance.',
      'If metrics stay at zero after delivery has started, write the campaign name and the approximate time.',
    ],
    ru: [
      'Откройте Ads, перейдите к списку кампаний и выберите нужную кампанию.',
      'В панели аналитики отображаются показы, клики, CTR, период и география.',
      'Переключайте период, чтобы сравнить текущую динамику с результатом за всё время.',
      'Если после начала показа метрики остаются нулевыми, напишите название кампании и примерное время.',
    ],
    uk: [
      'Відкрийте Ads, перейдіть до списку кампаній і виберіть потрібну.',
      'Панель аналітики показує перегляди, кліки, CTR, період і географію.',
      'Змініть період, щоб порівняти поточну динаміку з результатом за весь час.',
    ],
  }),
  qcoin: Object.freeze({
    en: ['Open Quantum Wallet to see the QCoin balance and transaction history. For your own signed-in balance, Support checks the verified wallet session and aliases without asking you for account codes. For a missing top-up, the amount and approximate time are usually enough to begin.'],
    ru: ['Откройте Quantum Wallet, чтобы увидеть баланс QCoin и историю операций. Для вашего собственного баланса поддержка использует валидную Wallet session и алиасы, поэтому служебные коды аккаунта не нужны. Если не отобразилось пополнение, обычно достаточно суммы и примерного времени.'],
    uk: ['Відкрийте Quantum Wallet, щоб побачити баланс QCoin та історію операцій. Для вашого власного балансу підтримка використовує валідну Wallet session і аліаси, тому службові коди акаунта не потрібні. Для зниклого поповнення зазвичай достатньо суми та приблизного часу.'],
  }),
  metaverse: Object.freeze({
    en: [
      'Metaverse is a planned ecosystem space connected with game, profile and social experiences.',
      'When you ask about launch timing, I will use only confirmed runtime or roadmap evidence. If no public date is confirmed, I will say that directly instead of inventing a date.',
      'For current access questions, I can check whether the available pages, game entry and profile-linked features are already active for your account.',
    ],
    ru: [
      'Метавселенная — это планируемое пространство экосистемы, связанное с игровыми, профильными и социальными возможностями.',
      'Если вопрос про дату запуска, я использую только подтверждённые данные рантайма или дорожной карты. Если публичная дата не подтверждена, я скажу это прямо, без выдуманных сроков.',
      'По текущему доступу я могу проверить, какие страницы, игровые входы и профильные функции уже активны для вашего аккаунта.',
    ],
    uk: [
      'Метавсесвіт — це запланований простір екосистеми, пов’язаний з ігровими, профільними та соціальними можливостями.',
      'Якщо питання про дату запуску, я використовую лише підтверджені дані рантайма або дорожньої карти.',
      'Якщо публічна дата не підтверджена, я скажу це прямо.',
    ],
  }),
  metamarket: Object.freeze({
    en: [
      'MetaMarket is the ownership and marketplace layer of the ecosystem. It is used for item state, ownership, token context and audit history.',
      'Use it when you need to check who owns an item, whether a marketplace action is active, or why an item state looks different.',
      'Support can explain and read the verified state; it does not transfer assets from chat.',
    ],
    ru: [
      'MetaMarket — это слой владения и маркетплейса внутри экосистемы: состояние предметов, владельцы, токены и история аудита.',
      'К нему относятся вопросы “кому принадлежит предмет”, “активно ли действие”, “почему статус предмета изменился”.',
      'Поддержка может объяснить и прочитать подтверждённое состояние, но не переносит активы из чата.',
    ],
    uk: [
      'MetaMarket — це шар володіння і маркетплейсу: стан предметів, власники, токени й історія аудиту.',
      'Сюди належать питання про власника предмета, активність дії або зміну статусу.',
      'Підтримка пояснює і читає підтверджений стан, але не переносить активи з чату.',
    ],
  }),
  vip: Object.freeze({
    en: ['Open Quantum Wallet, choose VIP and check the active plan, activation date and expiry date.'],
    ru: ['Откройте Quantum Wallet, выберите VIP и проверьте активный пакет, дату активации и срок действия.'],
    uk: ['Відкрийте Quantum Wallet, виберіть VIP і перевірте активний пакет, дату активації та строк дії.'],
  }),
  moderation: Object.freeze({
    en: ['Open the moderation notice to see the reported post, reason, captured time and current review status. Use the appeal action when it is available.'],
    ru: ['Откройте уведомление модерации: в карточке будут сам материал, причина жалобы, время фиксации и текущий статус. Если доступно обжалование, используйте соответствующее действие в карточке.'],
    uk: ['Відкрийте повідомлення модерації: картка покаже матеріал, причину скарги, час фіксації та поточний статус.'],
  }),
  learning_governance: Object.freeze({
    en: [
      'QL7 Support can become better from real conversation experience, but it does not copy one message into a new rule.',
      'Personal details are removed, repeated situations are compared across many independent users, and only stable useful improvements move forward.',
      'One user, one dialogue, spam, or a small repeated cluster cannot rewrite behavior; narrow pressure is treated as noise.',
    ],
    ru: [
      'QL7 Support может становиться лучше на реальном опыте общения, но не превращает одно сообщение в новое правило.',
      'Личные детали убираются, похожие ситуации сверяются по множеству независимых пользователей, а дальше проходят только устойчивые полезные улучшения.',
      'Один пользователь, один диалог, спам или маленькая группа похожих сообщений не могут переписать поведение; узкое давление считается шумом.',
    ],
    uk: [
      'QL7 Support може ставати кращою завдяки реальному досвіду спілкування, але не перетворює одне повідомлення на нове правило.',
      'Особисті деталі прибираються, схожі ситуації звіряються за багатьма незалежними користувачами, а далі проходять лише стійкі корисні покращення.',
      'Один користувач, один діалог, спам або мала група схожих повідомлень не можуть переписати поведінку; вузький тиск вважається шумом.',
    ],
  }),
  support_system: Object.freeze({
    en: ['Describe what happened, where it happened and what result you expected. One concrete detail or approximate time is usually enough to begin checking.'],
    ru: ['Опишите, что произошло, в каком разделе и какой результат ожидался. Начать можно с того, что сейчас видно, или с примерного времени события.'],
    uk: ['Опишіть, що сталося, у якому розділі та який результат очікувався. Зазвичай достатньо однієї конкретної деталі або приблизного часу.'],
  }),
})

const GENERIC = Object.freeze({
  en: {
    overview: '{label} is part of the QUANTUM L7 AI ecosystem. It is used for {scope}.',
    howTo: 'Open {label}, choose the item you want to work with, and use the available status, history and action controls. Describe what behaves differently if the interface does not match your expectation.',
  },
  ru: {
    overview: '«{label}» — часть экосистемы QUANTUM L7 AI. Раздел предназначен для следующего: {scope}.',
    howTo: 'Откройте «{label}», выберите нужный объект и используйте доступные элементы статуса, истории и действий. Если интерфейс ведёт себя иначе, опишите, что именно не совпало с ожиданием.',
  },
  uk: {
    overview: '«{label}» — частина екосистеми QUANTUM L7 AI. Розділ призначений для такого: {scope}.',
    howTo: 'Відкрийте «{label}», виберіть потрібний об’єкт і скористайтеся доступними елементами статусу, історії та дій.',
  },
  es: {
    overview: '{label} forma parte del ecosistema QUANTUM L7 AI. Se utiliza para {scope}.',
    howTo: 'Abre {label}, elige el elemento y usa los controles de estado, historial y acciones disponibles.',
  },
  tr: {
    overview: '{label}, QUANTUM L7 AI ekosisteminin bir parçasıdır. Şu amaçla kullanılır: {scope}.',
    howTo: '{label} bölümünü açın, ilgili öğeyi seçin ve durum, geçmiş ve işlem kontrollerini kullanın.',
  },
  ar: {
    overview: 'يُعد {label} جزءاً من منظومة QUANTUM L7 AI، ويُستخدم من أجل {scope}.',
    howTo: 'افتح {label}، واختر العنصر المطلوب، ثم استخدم أدوات الحالة والسجل والإجراءات المتاحة.',
  },
  zh: {
    overview: '{label} 是 QUANTUM L7 AI 生态系统的一部分，用于 {scope}。',
    howTo: '打开 {label}，选择相应项目，然后使用状态、历史记录和操作控件。',
  },
  he: {
    overview: '{label} הוא חלק ממערכת QUANTUM L7 AI ומשמש עבור {scope}.',
    howTo: 'פתחו את {label}, בחרו את הפריט המתאים והשתמשו בבקרי המצב, ההיסטוריה והפעולות.',
  },
})

const CHOICE_LABELS = Object.freeze({
  exchange: { en: 'Exchange analytics', ru: 'Аналитика биржи', uk: 'Аналітика біржі', es: 'Analítica del exchange', tr: 'Borsa analizi', ar: 'تحليلات المنصة', zh: '交易所分析', he: 'ניתוח הבורסה' },
  exchange_ai: { en: 'Exchange AI signals', ru: 'Сигналы Exchange AI', uk: 'Сигнали Exchange AI', es: 'Señales de Exchange AI', tr: 'Exchange AI sinyalleri', ar: 'إشارات Exchange AI', zh: 'Exchange AI 信号', he: 'אותות Exchange AI' },
  qcoin: { en: 'QCoin payment', ru: 'Оплата QCoin', uk: 'Оплата QCoin', es: 'Pago QCoin', tr: 'QCoin ödemesi', ar: 'دفع QCoin', zh: 'QCoin 支付', he: 'תשלום QCoin' },
  ads_campaigns: { en: 'Advertising campaign', ru: 'Рекламная кампания', uk: 'Рекламна кампанія', es: 'Campaña publicitaria', tr: 'Reklam kampanyası', ar: 'حملة إعلانية', zh: '广告活动', he: 'קמפיין פרסום' },
  moderation: { en: 'Moderation or appeal', ru: 'Модерация или обжалование', uk: 'Модерація або оскарження', es: 'Moderación o apelación', tr: 'Moderasyon veya itiraz', ar: 'الإشراف أو الاستئناف', zh: '审核或申诉', he: 'פיקוח או ערעור' },
  support_system: { en: 'Something else', ru: 'Другая ситуация', uk: 'Інша ситуація', es: 'Otra situación', tr: 'Başka bir durum', ar: 'حالة أخرى', zh: '其他情况', he: 'מצב אחר' },
})

function fill(value = '', vars = {}) {
  return str(value).replace(/\{(\w+)\}/g, (_, key) => str(vars[key]))
}

function translatedLines(topic, locale) {
  const entry = UI_PATHS[topic]
  if (!entry) return null
  return entry[locale] || null
}

export function getQl7SupportChoiceLabel(topic = '', locale = 'en') {
  const normalizedTopic = normalizeQl7SupportTopic(topic)
  const lang = normalizeQl7SupportLocale(locale)
  return CHOICE_LABELS[normalizedTopic]?.[lang] ||
    CHOICE_LABELS[normalizedTopic]?.en ||
    getQl7SupportTopicLabel(normalizedTopic, lang)
}

export function getQl7SupportKnowledgeAnswer({
  topic = 'support_system',
  intent = 'overview',
  locale = 'en',
  seed = '',
} = {}) {
  const normalizedTopic = normalizeQl7SupportTopic(topic)
  const lang = normalizeQl7SupportLocale(locale)
  const plan = buildQl7SupportDomainPlan({ analysis: { topic: normalizedTopic }, locale: lang })
  const canonicalDomain = getQl7SupportCanonicalDomain(normalizedTopic, lang)
  const domainPack = getQl7SupportDomainKnowledgePack(lang, canonicalDomain.label || plan.label)
  const localDictionaryEligible = ['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh', 'he'].includes(lang)
  const localContext = localDictionaryEligible
    ? buildQl7LocalDictionaryContext({ topic: normalizedTopic, locale: lang })
    : null
  if (localContext?.ok && ['how_to_question', 'informational_question', 'why_question', 'when_question', 'roadmap_question', 'overview', 'how_to'].includes(intent)) {
    const realized = realizeQl7LocalDictionaryAnswer({
      topic: normalizedTopic,
      intent,
      locale: lang,
      seed: seed || `${normalizedTopic}:${intent}:${lang}:${Date.now()}:${Math.random()}`,
      context: localContext,
    })
    return Object.freeze({
      topic: normalizedTopic,
      label: plan.label,
      title: plan.label,
      paragraphs: realized.paragraphs,
      text: realized.text,
      source: 'local_i18n_semantic_context_v9',
      verified: true,
      canonicalDomain,
      domainKnowledgeSource: domainPack.source,
      cta: canonicalDomain.cta,
      dictionaryContext: Object.freeze({
        sourceLocale: localContext.sourceLocale,
        keyCount: localContext.keyCount,
        keys: localContext.keys,
        terms: localContext.terms,
        capabilities: localContext.capabilities,
        evidenceDigest: localContext.evidenceDigest,
      }),
    })
  }
  const direct = translatedLines(normalizedTopic, lang)
  if (direct && ['how_to_question', 'informational_question', 'why_question', 'when_question', 'roadmap_question', 'overview', 'how_to'].includes(intent)) {
    return Object.freeze({
      topic: normalizedTopic,
      label: plan.label,
      title: plan.label,
      paragraphs: Object.freeze(direct),
      text: direct.join(' '),
      source: 'versioned_ui_path',
      verified: true,
      canonicalDomain,
      domainKnowledgeSource: domainPack.source,
      cta: canonicalDomain.cta,
    })
  }
  const copy = GENERIC[lang] || null
  const template = copy
    ? (intent === 'how_to_question' || intent === 'how_to' ? copy.howTo : copy.overview)
    : ''
  const catalogText = template
    ? fill(template, { label: canonicalDomain.label || plan.label, scope: canonicalDomain.scope || plan.scope })
    : ''
  const paragraphs = Object.freeze(Array.from(new Set([
    domainPack.intro,
    domainPack.use,
    catalogText,
    domainPack.boundary,
  ].map(str).filter(Boolean))))
  const text = paragraphs.join(' ')
  return Object.freeze({
    topic: normalizedTopic,
    label: canonicalDomain.label || plan.label,
    title: canonicalDomain.label || plan.label,
    paragraphs,
    text,
    source: 'canonical_domain_registry_v15',
    verified: true,
    canonicalDomain,
    domainKnowledgeSource: domainPack.source,
    cta: canonicalDomain.cta,
  })
}

export function auditQl7SupportKnowledgeRegistry() {
  const missing = []
  for (const topic of QL7_SUPPORT_ECOSYSTEM_TOPICS) {
    const answer = getQl7SupportKnowledgeAnswer({ topic, intent: 'overview', locale: 'en' })
    if (!answer.text || !answer.label) missing.push(topic)
  }
  return Object.freeze({
    ok: missing.length === 0,
    topics: QL7_SUPPORT_ECOSYSTEM_TOPICS.length,
    missing: Object.freeze(missing),
  })
}

export const QL7_SUPPORT_KNOWLEDGE_TOPICS_V6 = QL7_SUPPORT_ECOSYSTEM_TOPICS
