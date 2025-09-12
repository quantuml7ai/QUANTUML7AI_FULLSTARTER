'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const TG_NAME = (process.env.NEXT_PUBLIC_TG_BOT || '').replace(/^@/, '')
const BOT_LINK = process.env.NEXT_PUBLIC_BOT_LINK || (TG_NAME ? `https://t.me/${TG_NAME}` : 'https://t.me/YourBot')
const CHANNEL_LINK = 'https://t.me/l7universe'
const FEEDBACK_LINK = 'https://t.me/L7ai_feedback'
const CONTACT_EMAIL = 'quantuml7ai@gmail.com'

const dict = {
  en: {
    /* ===== UI (exchange/chart) ===== */
    ui_inprogress: 'IN PROGRESS',
    ui_quantum: 'Quantum',
    ui_candles: 'Candles',
    ui_hollow: 'Hollow',
    ui_heikin: 'Heikin-Ashi',
    ui_area: 'Area',
    ui_ma50: 'MA50',
    ui_ema21: 'EMA21',
    ui_ma200: 'MA200',
    ui_vwap: 'VWAP',
    ui_bands: 'Bands',
    ui_volume: 'Volume',
    ui_theme_aqua: 'Aqua',
    ui_theme_violet: 'Violet',
    ui_theme_amber: 'Amber',
    ui_halos: 'Halos',
    ui_stars: 'Stars',
    ui_scan: 'Scan',
    ui_waves: 'Waves',
    ui_ions: 'Ions',
    ui_glint: 'Glint',
    ui_live_on: 'Live ON',
    ui_live_off: 'Live OFF',
    ui_bars: 'Bars',
    ui_glow: 'Glow',
    ui_tick: 'Tick',
    ui_ai_reco: 'AI Recommendation',
    ui_preview: 'preview',
    ui_risk: 'Risk',
    ui_price: 'Price',
    ui_tf: 'TF',
    ui_long_demo: 'Long (demo)',
    ui_short_demo: 'Short (demo)',
    ui_hedge_demo: 'Hedge (demo)',

    /* ===== NAV ===== */
    nav_home: 'Home',
    nav_about: 'About',
    nav_exchange: 'Exchange',
    nav_subscribe: 'Subscribe',
    nav_contact: 'Contact',
    nav_channel: 'Channel',

    /* ===== HERO / HOME (кратко) ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'Cosmic-grade intelligence for research, alpha signals and guarded execution. Wallet auth, PRO/VIP tiers.',
    hero_cta: 'Start in Telegram',
    hero_learn_more: 'Learn More',
    marquee: 'AI • Blockchain • Automation • Quant • Research • Agents • Alpha',

    home_blocks: [
      {
        title: 'Why Quantum L7 AI',
        paras: [
          `We fuse multi-modul models with L7 autonomous agents and on-chain pipelines.
The system authenticates via non-custodial wallets, keeps keys with the user, and turns raw data into decisions across discovery, validation and execution.`,
          `Our philosophy is clarity: hypotheses → tests → evidence.
Agents read docs, parse APIs, stream on-chain data, and compose human-grade reports with charts and citations.`,
        ],
      },
      {
        title: 'What you get',
        bullets: [
          'Alpha discovery from curated on-chain and off-chain sources',
          'Signal ranking, confidence scoring and risk overlays',
          'Backtests, notebooks and reproducible research',
          'Portfolio insights, PnL attribution and regime detection',
          'Automated execution with guardrails and kill-switches',
          'Streaming dashboards and alerting',
          'Private datasets and connectors',
          'API/SDK for desks and builders',
          'Governance hooks and audit trails',
          'Education tracks & live research sessions',
        ],
      },
    ],

    /* ===== ABOUT ===== */
    about_title: 'About Quantum L7 AI',
    about_paragraphs: [
      `Quantum L7 AI is a compact research and signals stack for crypto. Our goal is simple: reduce noise, reveal real market structure, and help you act with discipline rather than impulse.`,

      `L7 stands for application-layer agents. These agents read documents, call APIs, observe blockchains and order books, run small experiments, and assemble explainable outputs. You do not get a black box; you get hypotheses, tests, and a clear trace of why a suggestion appeared.`,

      `Who it is for: traders who want fast situational awareness; researchers who need repeatable studies; builders and desks that require a clean API and a stable data plane.`,

      `Coverage. We ingest market data from major CEX venues and leading DEX aggregators, add reference data (symbols, mappings, contract metadata), and unify it into a single schema. Cross-venue comparability is the design target.`,

      `Data pipeline. Feeds are normalized, gaps are auto-patched, splits and contract changes are reconciled, and derivatives are labeled. Large history buckets enable regime attribution instead of short-term overfitting.`,

      `Analytics engine. More than two hundred indicators are available, but the point is not quantity—the point is ensembles, learned weights, and context. Classic families (RSI, Stochastic, MFI, CCI, ADX/DI, EMA/SMA/WMA, MACD, ATR, Bollinger Bands, VWAP, OBV, Ichimoku baselines) are combined with regime filters and liquidity awareness.`,

      `On-chain modules. We parse transfers, liquidity additions and removals, bridge flows, holder distributions, and basic MEV fingerprints. Signals are down-weighted in thin or manipulated regions.`,

      `News and research stream. Multilingual sources are auto-translated, embedded, and deduplicated. Sentiment, novelty, and source reliability contribute to a lightweight narrative score next to price metrics.`,

      `Signal cards. Each card shows an expected move and time horizon derived from the asset’s history, plus confidence, liquidity context, and quick indicators. Treat cards as beacons that help you frame scenarios and risk—never as a promise.`,

      `Discipline. We build for pre-commitment: playbooks, volatility corridors, dynamic stops, and position-sizing templates. The system nudges you to define invalidation before the trade, not after.`,

      `Architecture. Data and agentic services run as small TypeScript/Python processes behind a stable API. The website uses Next.js for rendering and WebSockets for live updates. Caches and fallbacks keep the UI responsive even during data bursts.`,

      `Security and privacy. We are non-custodial; keys remain with the user. Actions are scoped by role and logged. Secrets are stored server-side, and personal data is minimized and encrypted in transit and at rest.`,

      `Roadmap. Public notebooks and backtests, strategy templates, a portfolio engine with attribution, smarter routing across venues, DeFi connectors, and an optional autopilot mode with strict guardrails and human checkpoints.`,

      `Community and support. We publish weekly research notes, maintain a Telegram channel, and welcome specific requests from teams. Your feedback directly shapes the backlog—useful features ship, while shiny distractions do not.`,

      `Important: subscriptions and wallet linking are handled in our Telegram bot. The website focuses on research, visualization, and documentation. Nothing here is financial advice.`,
    ],
    about_bullets: [
      'Fast situational awareness: market state, trend, momentum, volatility',
      'Cross-venue normalization and liquidity-aware scoring',
      'On-chain flows: holders, liquidity moves, bridge activity, basic MEV flags',
      'News stream with translation, embedding search, and source reliability',
      'Expected move and horizon on every signal card (history-based quantiles)',
      'Ensembles of indicators with regime filters and learned weights',
      'Backtests and notebooks for reproducible research (roadmap)',
      'Portfolio engine: risk budgets, constraints, attribution (roadmap)',
      'Smart routing across CEX/DEX; latency and slippage guards (roadmap)',
      'API/SDK for desks and builders; simple webhooks for automation',
      'Enterprise options: SSO, private deployments, SLA and change windows',
      'Security model: non-custodial, scoped actions, audit logs',
      'Operational resilience: caching layers, graceful degradation, fallbacks',
      'Clean UI that emphasizes decisions, not noise',
      'Scenario thinking: predefined invalidation and stop frameworks',
      'Research artifacts: charts, tables, concise reports with links',
      'Embedding search across your notes and public sources (opt-in)',
      'Extensible connectors: pricing, on-chain, research, social',
      'Human-in-the-loop guardrails for semi-automated workflows',
      'Clear boundaries: signals are tools, not guarantees',
    ],

    tg_button: 'Telegram',

    /* ===== EXCHANGE (расширенное описание) ===== */
    exchange_title: 'Exchange (in development)',
    exchange_sub:
      `A living market canvas with quantum-styled waves, constellation particles and a spiral galaxy overlay.
Next milestones: smart routing across DEX/CEX, venue selection with slippage control, latency-aware execution, auto-hedge and risk limits.`,
    exchange_sections: [
      {
        title: 'Vision: a next-gen L7 exchange',
        paras: [
          `The exchange is not just a chart. It is an L7 agentic pipeline that ingests market data, on-chain events and order book signals, 
scores them and renders explainable recommendations (BUY/SELL/HOLD) with confidence and risk context.`,
          `User identity is wallet-based; compute is orchestrated by agents. Keys stay with the user. 
Everything leaves an audit trail, from research steps to execution.`,
        ],
      },
      {
        title: 'Smart routing & liquidity',
        paras: [
          `Routing will scan liquidity on DEX/CEX venues in parallel, estimate slippage and fees, 
select the venue or a split route, and respect user risk limits.`,
          `Latency matters: the router targets best-effort timing with cancellation/replace logic and a dynamic kill-switch.`,
        ],
      },
      {
        title: 'Risk & controls',
        paras: [
          `Limits by notional, exposure and drawdown. Conditional orders, time-in-force, minimum confidence threshold for AI signals.`,
          `Guardrails protect from runaway loops. Every action is traceable with reason, inputs and model versions.`,
        ],
      },
      {
        title: 'Analytics & explainability',
        paras: [
          `The AI box shows confidence and factors: moving averages alignment, VWAP relation, band position, RSI regime and more.`,
          `Every recommendation is paired with TP/SL bands derived from ATR-like volatility measures and the current regime.`,
        ],
      },
      {
        title: 'What’s next',
        paras: [
          `Portfolio view, PnL attribution, factor contribution charts.`,
          `Backtests & replays directly on the canvas, strategy templates and one-click deployment.`,
        ],
      },
    ],
    roadmap: 'Roadmap',
    ex_bullets: [
      'Smart routing with slippage control and venue selection',
      'Backtests, replays and explainable metrics',
      'Wallet connections and instant portfolio analytics',
      'Strategy templates and guardrails',
    ],

    /* ===== SUBSCRIBE / CONTACT (кратко) ===== */
    subscribe_title: 'Subscription Plans',
    subscribe_sub:
      'Wallet-based authentication. PRO/VIP unlock faster research, private signals and early features.',
    subscribe_cta: 'Subscribe via Telegram',

    contact_title: 'Contact us',
    contact_sub: 'Reach the team — we respond fast.',
    contact_lines: [
      `Telegram channel — announcements and research: ${CHANNEL_LINK}`,
      `Feedback bot — support & requests: ${FEEDBACK_LINK}`,
      `Email — partnerships & enterprise: ${CONTACT_EMAIL}`,
    ],

    links: { bot: BOT_LINK, channel: CHANNEL_LINK, feedback: FEEDBACK_LINK, email: CONTACT_EMAIL },
  },

  ru: {
    /* ===== UI (exchange/chart) ===== */
    ui_inprogress: 'В РАЗРАБОТКЕ',
    ui_quantum: 'Quantum',
    ui_candles: 'Свечи',
    ui_hollow: 'Полые',
    ui_heikin: 'Heikin-Ashi',
    ui_area: 'Область',
    ui_ma50: 'MA50',
    ui_ema21: 'EMA21',
    ui_ma200: 'MA200',
    ui_vwap: 'VWAP',
    ui_bands: 'Полосы',
    ui_volume: 'Объём',
    ui_theme_aqua: 'Аква',
    ui_theme_violet: 'Виолет',
    ui_theme_amber: 'Янтарь',
    ui_halos: 'Ореолы',
    ui_stars: 'Звёзды',
    ui_scan: 'Скан',
    ui_waves: 'Волны',
    ui_ions: 'Ионы',
    ui_glint: 'Блик',
    ui_live_on: 'Live ВКЛ',
    ui_live_off: 'Live ВЫКЛ',
    ui_bars: 'Свечи',
    ui_glow: 'Свечение',
    ui_tick: 'Тик',
    ui_ai_reco: 'AI-рекомендация',
    ui_preview: 'превью',
    ui_risk: 'Риск',
    ui_price: 'Цена',
    ui_tf: 'ТФ',
    ui_long_demo: 'Лонг (демо)',
    ui_short_demo: 'Шорт (демо)',
    ui_hedge_demo: 'Хедж (демо)',

    /* ===== NAV ===== */
    nav_home: 'Главная',
    nav_about: 'О нас',
    nav_exchange: 'Биржа',
    nav_subscribe: 'Подписка',
    nav_contact: 'Связаться',
    nav_channel: 'Канал',

    /* ===== HERO / HOME (кратко) ===== */
    hero_title: 'Космический интеллект для аналитики',
    hero_subtitle:
      'Исследования, альфа-сигналы и исполнение под защитой. Авторизация кошельком, уровни PRO/VIP.',
    hero_cta: 'Начать в Telegram',
    hero_learn_more: 'Подробнее',
    marquee: 'ИИ • Блокчейн • Автоматизация • Квант • Исследования • Агенты • Альфа',

    home_blocks: [
      {
        title: 'Почему Quantum L7 AI',
        paras: [
          `Мы соединяем мультимодульные модели, автономных L7-агентов и ончейн-пайплайны.
Система авторизует через некостодиальные кошельки, ключи остаются у пользователя, а сырые данные превращаются в решения: от поиска идей до исполнения.`,
          `Наш принцип — доказуемость: гипотеза → тест → свидетельства.
Агенты читают документы, ходят в API и блокчейны, собирают отчёты уровня аналитика с графиками и ссылками.`,
        ],
      },
      {
        title: 'Что вы получаете',
        bullets: [
          'Поиск альфы из отобранных on-chain и off-chain источников',
          'Ранжирование сигналов, уверенность и риск-оверлеи',
          'Бэктесты, ноутбуки и воспроизводимость',
          'Инсайты по портфелю, атрибуция PnL и детекция режимов',
          'Автоисполнение со страховками и аварийной остановкой',
          'Онлайн-дашборды и оповещения',
          'Приватные датасеты и коннекторы',
          'API/SDK для команд и разработчиков',
          'Аудит действий и управляемые права',
          'Обучение и живые ресёрч-сессии',
        ],
      },
    ],

    /* ===== ABOUT ===== */
    about_title: 'О Quantum L7 AI',
    about_paragraphs: [
      `Quantum L7 AI — компактный стек для исследований и сигналов по крипторынку. Наша задача проста: убрать шум, показать реальную структуру рынка и помочь действовать дисциплинированно, а не импульсивно.`,

      `L7 — это агенты прикладного уровня. Эти агенты читают документы, обращаются к API, наблюдают блокчейны и стаканы, запускают небольшие эксперименты и собирают объяснимые результаты. Вы получаете не «чёрный ящик», а гипотезы, проверки и понятный след причин появления рекомендации.`,

      `Для кого это: трейдерам — быстрая ситуационная осведомлённость; исследователям — воспроизводимые исследования; командам и разработчикам — чистый API и стабильная шина данных.`,

      `Покрытие. Мы собираем рыночные данные с крупных CEX и ведущих DEX-агрегаторов, добавляем справочники (символы, соответствия, метаданные контрактов) и приводим всё к единой схеме. Цель — сопоставимость площадок.`,

      `Пайплайн данных. Потоки нормализуются, разрывы автоматически закрываются, сплиты и изменения контрактов учитываются, деривативы помечаются. Большая история позволяет определять режимы вместо подгонки под случайные колебания.`,

      `Аналитическое ядро. Индикаторов более двухсот, но важна не численность, а ансамбли, взвешивание и контекст. Классические семейства (RSI, Stochastic, MFI, CCI, ADX/DI, EMA/SMA/WMA, MACD, ATR, полосы Боллинджера, VWAP, OBV, базовые линии Ichimoku) комбинируются с фильтрами режимов и учётом ликвидности.`,

      `Ончейн-модули. Мы анализируем переводы, ввод и вывод ликвидности, перемещения через мосты, распределение держателей и базовые признаки MEV. Сигналы понижаются в весе в тонких или манипулируемых зонах.`,

      `Лента новостей и исследований. Многоязычные источники автоматически переводятся, индексируются и дедуплицируются. Тональность, новизна и надёжность источника формируют лёгкую «оценку нарратива» рядом с ценовыми метриками.`,

      `Карточки сигналов. На каждой — ожидаемая амплитуда и горизонт по истории, уровень уверенности, контекст ликвидности и быстрые индикаторы. Воспринимайте карточку как маяк для сценариев и управления риском, а не как обещание.`,

      `Дисциплина. Мы проектируем инструменты под предварительное принятие правил: плейбуки, коридоры волатильности, динамические стопы и шаблоны расчёта размера позиции. Система мягко подталкивает определить «инвалидацию» до входа, а не после.`,

      `Архитектура. Сервисы данных и агенты — небольшие процессы на TypeScript/Python за стабильным API. Сайт на Next.js, живые обновления — через WebSocket. Кэши и резервные источники поддерживают отзывчивость даже в пиковые моменты.`,

      `Безопасность и приватность. Мы некостодиальны; ключи остаются у пользователя. Действия ограничены ролями и логируются. Секреты хранятся на сервере; персональные данные минимизируются и шифруются при передаче и хранении.`,

      `Дорожная карта. Публичные ноутбуки и бэктесты, шаблоны стратегий, портфельный движок с атрибуцией, более умная маршрутизация между площадками, DeFi-коннекторы и опциональный автопилот с жёсткими ограничителями и человеческими чекпоинтами.`,

      `Сообщество и поддержка. Публикуем еженедельные заметки, ведём Telegram-канал и открыты к конкретным запросам команд. Обратная связь напрямую формирует бэклог: полезные функции выходят в релиз, а блестящие, но бесполезные — нет.`,

      `Важно: подписки и привязка кошельков выполняются в нашем Telegram-боте. Сайт сосредоточен на аналитике, визуализации и документации. Материалы не являются инвестиционной рекомендацией.`,
    ],
    about_bullets: [
      'Быстрая ситуационная осведомлённость: состояние рынка, тренд, импульс, волатильность',
      'Кросс-биржевая нормализация и «ликвидностно-осознанное» взвешивание',
      'Ончейн-потоки: распределение держателей, ввод/вывод ликвидности, перемещения через мосты, базовые признаки MEV',
      'Новостная лента с переводом, поиском по эмбеддингам и оценкой надёжности источников',
      'Ожидаемая амплитуда и горизонт на каждой карточке (квантили по истории)',
      'Ансамбли индикаторов, фильтры режимов и обучаемые веса',
      'Бэктесты и ноутбуки для воспроизводимых исследований (roadmap)',
      'Портфельный модуль: риск-бюджеты, ограничения, атрибуция PnL (roadmap)',
      'Смарт-маршрутизация по CEX/DEX; защита от задержек и проскальзывания (roadmap)',
      'API/SDK для команд и автоматизации; простые вебхуки',
      'Enterprise-опции: SSO, частные деплои, SLA и окна изменений',
      'Некостодиальная модель безопасности: роли и аудит действий',
      'Надёжность: уровни кэширования, плавная деградация, резервные источники',
      'Чистый интерфейс, который подчёркивает решения, а не шум',
      'Сценарное мышление: заранее заданная инвалидация и стоп-фреймворки',
      'Исследовательские артефакты: графики, таблицы, краткие отчёты со ссылками',
      'Поиск по эмбеддингам по вашим заметкам и публичным источникам (по желанию)',
      'Расширяемые коннекторы: цены, ончейн, исследования, социальные сигналы',
      'Человек в контуре для полуавтоматизированных процессов',
      'Чёткие границы: сигналы — инструмент, а не гарантия',
    ],

    tg_button: 'Телеграм',

    /* ===== EXCHANGE (расширенное описание) ===== */
    exchange_title: 'Биржа (в разработке)',
    exchange_sub:
      `Живой неоновый холст: квант-волны, «созвездия» частиц и спираль-галактика.
Далее: смарт-маршрутизация DEX/CEX, выбор площадки со слиппедж-контролем, latency-execution, авто-хедж и риск-лимиты.`,
    exchange_sections: [
      {
        title: 'Видение: биржа нового поколения L7',
        paras: [
          `Это не просто график. Это агентный пайплайн L7, который поглощает рыночные данные, ончейн-события и сигналы стаканов,
оценивает их и выдаёт объяснимые рекомендации (BUY/SELL/HOLD) с уверенностью и контекстом риска.`,
          `Идентичность — через кошелёк; вычисления оркестрируют агенты. Ключи — у пользователя.
Каждый шаг исследован и протоколируется: от открытия данных до исполнения.`,
        ],
      },
      {
        title: 'Маршрутизация и ликвидность',
        paras: [
          `Роутер сканирует ликвидность на DEX/CEX параллельно, оценивает слиппедж и комиссии,
выбирает площадку или сплит-маршрут и соблюдает ваши риск-лимиты.`,
          `Latency имеет значение: целимся в своевременность, поддерживаем cancel/replace-логику и аварийный kill-switch.`,
        ],
      },
      {
        title: 'Риск и контроль',
        paras: [
          `Лимиты по нотионалу, экспозиции и просадке. Conditional-ордера, time-in-force, минимальный порог уверенности для AI-сигналов.`,
          `Страховки защищают от разгона. Любое действие объяснимо: причина, входные данные, версии моделей.`,
        ],
      },
      {
        title: 'Аналитика и объяснимость',
        paras: [
          `AI-бокс показывает уверенность и факторы: согласованность скользящих, отношение к VWAP, положение в полосах, режим RSI и др.`,
          `Каждая рекомендация сопровождается TP/SL, рассчитанными по волатильности (ATR-подобно) и текущему режиму.`,
        ],
      },
      {
        title: 'Что дальше',
        paras: [
          `Портфель, атрибуция PnL, вклад факторов.`,
          `Бэктесты и реплеи прямо на холсте, шаблоны стратегий и развёртывание в один клик.`,
        ],
      },
    ],
    roadmap: 'Дорожная карта',
    ex_bullets: [
      'Смарт-маршрутизация со слиппедж-контролем и выбором площадки',
      'Бэктесты, реплеи и объяснимые метрики',
      'Подключение кошельков и мгновенная аналитика портфеля',
      'Шаблоны стратегий и защитные барьеры',
    ],

    /* ===== SUBSCRIBE / CONTACT (кратко) ===== */
    subscribe_title: 'Тарифы и подписки',
    subscribe_sub:
      'Авторизация через кошелёк. PRO/VIP открывают быстрые исследования, приватные сигналы и ранние функции.',
    subscribe_cta: 'Оформить подписку в Telegram',

    contact_title: 'Связаться с нами',
    contact_sub: 'Пишите — отвечаем быстро.',
    contact_lines: [
      `Telegram-канал — анонсы и исследования: ${CHANNEL_LINK}`,
      `Бот обратной связи — поддержка и запросы: ${FEEDBACK_LINK}`,
      `Почта — партнёрства и enterprise: ${CONTACT_EMAIL}`,
    ],

    links: { bot: BOT_LINK, channel: CHANNEL_LINK, feedback: FEEDBACK_LINK, email: CONTACT_EMAIL },
  },
}

const I18nContext = createContext({ t: (k) => k, lang: 'en', setLang: () => {} })

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en')
  useEffect(() => {
    try { const s = localStorage.getItem('ql7_lang'); if (s === 'ru' || s === 'en') setLang(s) } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('ql7_lang', lang) } catch {}
    if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const t = (k) => dict[lang][k] ?? k
  return <I18nContext.Provider value={{ t, lang, setLang }}>{children}</I18nContext.Provider>
}
export function useI18n() { return useContext(I18nContext) }
