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
    about_sections: [
      { title: 'What is Quantum L7 AI',           parasIdx: [0] },
      { title: 'L7 agents, not black boxes',      parasIdx: [1] },
      { title: 'Who it is for',                   parasIdx: [2] },
      { title: 'Coverage',                        parasIdx: [3] },
      { title: 'Data pipeline',                   parasIdx: [4] },
      { title: 'Analytics engine',                parasIdx: [5] },
      { title: 'On-chain modules',                parasIdx: [6] },
      { title: 'News & research stream',          parasIdx: [7] },
      { title: 'Signal cards',                    parasIdx: [8] },
      { title: 'Decision discipline',             parasIdx: [9] },
      { title: 'Architecture',                    parasIdx: [10] },
      { title: 'Security & privacy',              parasIdx: [11] },
      { title: 'Roadmap',                          parasIdx: [12] },
      { title: 'Community & support',             parasIdx: [13] },
      { title: 'Important',                       parasIdx: [14] },
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
    about_sections: [
      { title: 'Что такое Quantum L7 AI',           parasIdx: [0] },
      { title: 'L7-агенты, а не «чёрный ящик»',     parasIdx: [1] },
      { title: 'Для кого',                          parasIdx: [2] },
      { title: 'Покрытие',                          parasIdx: [3] },
      { title: 'Пайплайн данных',                   parasIdx: [4] },
      { title: 'Аналитическое ядро',                parasIdx: [5] },
      { title: 'Ончейн-модули',                     parasIdx: [6] },
      { title: 'Лента новостей и исследований',     parasIdx: [7] },
      { title: 'Карточки сигналов',                 parasIdx: [8] },
      { title: 'Дисциплина',                        parasIdx: [9] },
      { title: 'Архитектура',                       parasIdx: [10] },
      { title: 'Безопасность и приватность',        parasIdx: [11] },
      { title: 'Дорожная карта',                    parasIdx: [12] },
      { title: 'Сообщество и поддержка',            parasIdx: [13] },
      { title: 'Важно',                             parasIdx: [14] },
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

  uk: {
    /* ===== UI (exchange/chart) ===== */
    ui_inprogress: 'У РОЗРОБЦІ',
    ui_quantum: 'Quantum',
    ui_candles: 'Свічки',
    ui_hollow: 'Порожні',
    ui_heikin: 'Heikin-Ashi',
    ui_area: 'Область',
    ui_ma50: 'MA50',
    ui_ema21: 'EMA21',
    ui_ma200: 'MA200',
    ui_vwap: 'VWAP',
    ui_bands: 'Смуги',
    ui_volume: 'Обсяг',
    ui_theme_aqua: 'Аква',
    ui_theme_violet: 'Фіолетовий',
    ui_theme_amber: 'Бурштин',
    ui_halos: 'Орeоли',
    ui_stars: 'Зірки',
    ui_scan: 'Скан',
    ui_waves: 'Хвилі',
    ui_ions: 'Іони',
    ui_glint: 'Блиск',
    ui_live_on: 'Live УВІМК',
    ui_live_off: 'Live ВИМК',
    ui_bars: 'Свічки',
    ui_glow: 'Світіння',
    ui_tick: 'Тік',
    ui_ai_reco: 'AI-рекомендація',
    ui_preview: 'попередній перегляд',
    ui_risk: 'Ризик',
    ui_price: 'Ціна',
    ui_tf: 'ТФ',
    ui_long_demo: 'Лонг (демо)',
    ui_short_demo: 'Шорт (демо)',
    ui_hedge_demo: 'Хедж (демо)',

    /* ===== NAV ===== */
    nav_home: 'Головна',
    nav_about: 'Про нас',
    nav_exchange: 'Біржа',
    nav_subscribe: 'Підписка',
    nav_contact: 'Зв’язатися',
    nav_channel: 'Канал',

    /* ===== HERO / HOME (коротко) ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'Космічний інтелект для досліджень, альфа-сигналів та безпечного виконання. Авторизація гаманцем, рівні PRO/VIP.',
    hero_cta: 'Почати в Telegram',
    hero_learn_more: 'Дізнатися більше',
    marquee: 'ШІ • Блокчейн • Автоматизація • Квант • Дослідження • Агенти • Альфа',

    home_blocks: [
      {
        title: 'Чому Quantum L7 AI',
        paras: [
          `Ми поєднуємо мультимодальні моделі, автономних агентів L7 і ончейн-пайплайни.
Система авторизує через некостодіальні гаманці, ключі залишаються у користувача, а сирі дані перетворюються на рішення — від відкриття до виконання.`,
          `Наш принцип — прозорість: гіпотеза → тест → докази.
Агенти читають документи, ходять в API і блокчейни, складають звіти рівня аналітика з графіками та посиланнями.`,
        ],
      },
      {
        title: 'Що ви отримуєте',
        bullets: [
          'Пошук альфи з відібраних on-chain і off-chain джерел',
          'Ранжування сигналів, впевненість та ризик-оверлеї',
          'Бектести, ноутбуки і відтворювані дослідження',
          'Інсайти по портфелю, атрибуція PnL і виявлення режимів',
          'Автоматичне виконання зі страховками і аварійною зупинкою',
          'Онлайн-дашборди та сповіщення',
          'Приватні датасети та конектори',
          'API/SDK для команд і розробників',
          'Аудит дій та контрольовані права',
          'Навчання і живі ресерч-сесії',
        ],
      },
    ],

    /* ===== ABOUT ===== */
    about_title: 'Про Quantum L7 AI',
    about_paragraphs: [
      `Quantum L7 AI — компактний стек для досліджень і сигналів на крипторинку. Наша мета проста: прибрати шум, показати справжню структуру ринку і допомогти діяти дисципліновано, а не імпульсивно.`,

      `L7 — це агенти прикладного рівня. Вони читають документи, звертаються до API, спостерігають блокчейни та стакани, запускають експерименти й формують пояснювані результати. Це не «чорна скринька», а гіпотези, перевірки і зрозумілий слід причин появи рекомендації.`,

      `Для кого це: трейдерам — швидка ситуаційна поінформованість; дослідникам — відтворювані експерименти; командам і розробникам — чистий API і стабільна шина даних.`,

      `Покриття. Ми збираємо ринкові дані з великих CEX і провідних DEX-агрегаторів, додаємо довідкові дані (символи, відповідності, метадані контрактів) і приводимо все до єдиної схеми. Мета — порівнюваність між біржами.`,

      `Пайплайн даних. Потоки нормалізуються, розриви автоматично закриваються, спліти і зміни контрактів враховуються, деривативи маркуються. Велика історія дозволяє визначати режими замість підгонки під випадкові коливання.`,

      `Аналітичне ядро. Індикаторів понад двісті, але головне — ансамблі, ваги і контекст. Класичні сімейства (RSI, Stochastic, MFI, CCI, ADX/DI, EMA/SMA/WMA, MACD, ATR, смуги Боллінджера, VWAP, OBV, базові лінії Ichimoku) комбінуються з фільтрами режимів і урахуванням ліквідності.`,

      `Ончейн-модулі. Ми аналізуємо трансфери, введення та виведення ліквідності, переміщення через мости, розподіл власників та базові ознаки MEV. Сигнали знижуються у вазі в тонких або маніпульованих зонах.`,

      `Стрічка новин і досліджень. Багатомовні джерела автоматично перекладаються, індексуються та дедуплікуються. Тональність, новизна і надійність формують «оцінку наративу» поруч із ціновими метриками.`,

      `Картки сигналів. На кожній — очікуваний рух і горизонт по історії, рівень впевненості, контекст ліквідності та швидкі індикатори. Це маяк для сценаріїв і управління ризиком, а не обіцянка.`,

      `Дисципліна. Ми створюємо інструменти під попереднє визначення правил: плейбуки, коридори волатильності, динамічні стопи і шаблони розміру позиції. Система підштовхує визначати «інвалідацію» до входу, а не після.`,

      `Архітектура. Сервіси даних і агенти — невеликі процеси на TypeScript/Python за стабільним API. Сайт на Next.js, живі оновлення через WebSocket. Кеші і резервні джерела підтримують відгук навіть у пікові моменти.`,

      `Безпека і приватність. Ми некостодіальні; ключі залишаються у користувача. Дії обмежуються ролями і логуються. Секрети зберігаються на сервері; персональні дані мінімізуються і шифруються під час передачі та зберігання.`,

      `Дорожня карта. Публічні ноутбуки і бектести, шаблони стратегій, портфельний рушій з атрибуцією, розумна маршрутизація між біржами, DeFi-конектори і опціональний автопілот з обмежувачами та чекпоінтами.`,

      `Спільнота і підтримка. Ми публікуємо щотижневі замітки, ведемо Telegram-канал і відкриті до конкретних запитів команд. Фідбек напряму формує беклог: корисні функції виходять у реліз, а блискучі, але непотрібні — ні.`,

      `Важливо: підписки і прив’язка гаманців здійснюються в нашому Telegram-боті. Сайт зосереджений на дослідженнях, візуалізації та документації. Це не фінансова порада.`,
    ],
    about_sections: [
      { title: 'Що таке Quantum L7 AI', parasIdx: [0] },
      { title: 'L7-агенти, а не «чорна скринька»', parasIdx: [1] },
      { title: 'Для кого', parasIdx: [2] },
      { title: 'Покриття', parasIdx: [3] },
      { title: 'Пайплайн даних', parasIdx: [4] },
      { title: 'Аналітичне ядро', parasIdx: [5] },
      { title: 'Ончейн-модулі', parasIdx: [6] },
      { title: 'Стрічка новин і досліджень', parasIdx: [7] },
      { title: 'Картки сигналів', parasIdx: [8] },
      { title: 'Дисципліна', parasIdx: [9] },
      { title: 'Архітектура', parasIdx: [10] },
      { title: 'Безпека і приватність', parasIdx: [11] },
      { title: 'Дорожня карта', parasIdx: [12] },
      { title: 'Спільнота і підтримка', parasIdx: [13] },
      { title: 'Важливо', parasIdx: [14] },
    ],

    about_bullets: [
      'Швидка ситуаційна поінформованість: стан ринку, тренд, імпульс, волатильність',
      'Крос-біржова нормалізація і «ліквіднісно-усвідомлене» зважування',
      'Ончейн-потоки: власники, ліквідність, мости, базові ознаки MEV',
      'Новинна стрічка з перекладом, пошуком по ембеддингам і надійністю джерел',
      'Очікуваний рух і горизонт на кожній картці (історичні квантілі)',
      'Ансамблі індикаторів, фільтри режимів і ваги',
      'Бектести і ноутбуки для відтворюваних досліджень (roadmap)',
      'Портфельний модуль: ризик-бюджети, обмеження, атрибуція PnL (roadmap)',
      'Смарт-маршрутизація по CEX/DEX; захист від затримок і прослизання (roadmap)',
      'API/SDK для команд і автоматизації; прості вебхуки',
      'Enterprise-опції: SSO, приватні деплои, SLA і вікна змін',
      'Некостодіальна модель безпеки: ролі і аудит дій',
      'Надійність: рівні кешування, плавна деградація, резервні джерела',
      'Чистий інтерфейс, що підкреслює рішення, а не шум',
      'Сценарне мислення: заздалегідь визначена інвалідація і стоп-фреймворки',
      'Дослідницькі артефакти: графіки, таблиці, звіти з посиланнями',
      'Пошук по ембеддингам у власних нотатках і публічних джерелах (опційно)',
      'Розширювані конектори: ціни, ончейн, дослідження, соціальні сигнали',
      'Людина в контурі для напівавтоматизованих процесів',
      'Чіткі межі: сигнали — це інструмент, а не гарантія',
    ],

    tg_button: 'Телеграм',

    /* ===== EXCHANGE ===== */
    exchange_title: 'Біржа (в розробці)',
    exchange_sub:
      `Живий неоновий холст: квантові хвилі, сузір’я частинок і спіраль-галактика.
Далі: смарт-маршрутизація DEX/CEX, вибір біржі зі слиппедж-контролем, latency-execution, авто-хедж і ризик-ліміти.`,
    exchange_sections: [
      {
        title: 'Бачення: біржа нового покоління L7',
        paras: [
          `Це не просто графік. Це агентний пайплайн L7, що поглинає ринкові дані, ончейн-події та сигнали стаканів,
оцінює їх і видає пояснювані рекомендації (BUY/SELL/HOLD) з упевненістю та контекстом ризику.`,
          `Ідентичність — через гаманець; обчислення оркеструють агенти. Ключі — у користувача.
Кожен крок досліджується і протоколюється: від відкриття даних до виконання.`,
        ],
      },
      {
        title: 'Маршрутизація і ліквідність',
        paras: [
          `Роутер сканує ліквідність на DEX/CEX паралельно, оцінює слиппедж і комісії,
вибирає біржу або спліт-маршрут і дотримується ризик-лімітів.`,
          `Latency має значення: ціль — своєчасність, підтримка cancel/replace-логіки і аварійний kill-switch.`,
        ],
      },
      {
        title: 'Ризик і контроль',
        paras: [
          `Ліміти по нотіоналу, експозиції і просадці. Conditional-ордера, time-in-force, мінімальний поріг впевненості для AI-сигналів.`,
          `Страховки захищають від розгону. Будь-яка дія пояснювана: причина, дані, версії моделей.`,
        ],
      },
      {
        title: 'Аналітика і пояснюваність',
        paras: [
          `AI-бокс показує впевненість і фактори: узгодженість ковзних, відношення до VWAP, положення в смугах, режим RSI тощо.`,
          `Кожна рекомендація супроводжується TP/SL, розрахованими по волатильності (ATR-подібно) і поточному режиму.`,
        ],
      },
      {
        title: 'Що далі',
        paras: [
          `Портфель, атрибуція PnL, внесок факторів.`,
          `Бектести і реплеї прямо на холсті, шаблони стратегій і розгортання в один клік.`,
        ],
      },
    ],
    roadmap: 'Дорожня карта',
    ex_bullets: [
      'Смарт-маршрутизація зі слиппедж-контролем і вибором біржі',
      'Бектести, реплеї і пояснювані метрики',
      'Підключення гаманців і миттєва аналітика портфеля',
      'Шаблони стратегій і захисні бар’єри',
    ],

    links: { bot: BOT_LINK, channel: CHANNEL_LINK, feedback: FEEDBACK_LINK, email: CONTACT_EMAIL },
  },

  es: {
    /* ===== UI (exchange/chart) ===== */
    ui_inprogress: 'EN DESARROLLO',
    ui_quantum: 'Quantum',
    ui_candles: 'Velas',
    ui_hollow: 'Huecas',
    ui_heikin: 'Heikin-Ashi',
    ui_area: 'Área',
    ui_ma50: 'MA50',
    ui_ema21: 'EMA21',
    ui_ma200: 'MA200',
    ui_vwap: 'VWAP',
    ui_bands: 'Bandas',
    ui_volume: 'Volumen',
    ui_theme_aqua: 'Aqua',
    ui_theme_violet: 'Violeta',
    ui_theme_amber: 'Ámbar',
    ui_halos: 'Halos',
    ui_stars: 'Estrellas',
    ui_scan: 'Escanear',
    ui_waves: 'Olas',
    ui_ions: 'Iones',
    ui_glint: 'Destello',
    ui_live_on: 'Live ENC',
    ui_live_off: 'Live APAG',
    ui_bars: 'Barras',
    ui_glow: 'Brillo',
    ui_tick: 'Tick',
    ui_ai_reco: 'Recomendación AI',
    ui_preview: 'previsualización',
    ui_risk: 'Riesgo',
    ui_price: 'Precio',
    ui_tf: 'TF',
    ui_long_demo: 'Largo (demo)',
    ui_short_demo: 'Corto (demo)',
    ui_hedge_demo: 'Cobertura (demo)',

    /* ===== NAV ===== */
    nav_home: 'Inicio',
    nav_about: 'Acerca de',
    nav_exchange: 'Intercambio',
    nav_subscribe: 'Suscripción',
    nav_contact: 'Contacto',
    nav_channel: 'Canal',

    /* ===== HERO / HOME ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'Inteligencia cósmica para investigación, señales alfa y ejecución segura. Autenticación con billetera, niveles PRO/VIP.',
    hero_cta: 'Comenzar en Telegram',
    hero_learn_more: 'Saber más',
    marquee: 'IA • Blockchain • Automatización • Cuántico • Investigación • Agentes • Alfa',

    home_blocks: [
      {
        title: 'Por qué Quantum L7 AI',
        paras: [
          `Fusionamos modelos multimodales con agentes autónomos L7 y pipelines on-chain.
El sistema se autentica vía billeteras no custodiales, mantiene las llaves en el usuario y convierte datos en decisiones: desde descubrimiento hasta ejecución.`,
          `Nuestra filosofía es claridad: hipótesis → pruebas → evidencia.
Los agentes leen documentos, llaman APIs, observan blockchains y arman reportes de nivel humano con gráficos y citas.`,
        ],
      },
      {
        title: 'Qué obtienes',
        bullets: [
          'Descubrimiento de alfa en fuentes on-chain y off-chain seleccionadas',
          'Ranking de señales, puntuación de confianza y superposición de riesgos',
          'Backtests, cuadernos y reproducibilidad',
          'Insights de portafolio, atribución PnL y detección de regímenes',
          'Ejecución automática con protecciones y kill-switch',
          'Dashboards en vivo y alertas',
          'Datasets privados y conectores',
          'API/SDK para equipos y desarrolladores',
          'Hooks de gobernanza y trazabilidad de auditoría',
          'Rutas educativas y sesiones de investigación en vivo',
        ],
      },
    ],

    /* ===== ABOUT ===== */
    about_title: 'Acerca de Quantum L7 AI',
    about_paragraphs: [
      `Quantum L7 AI es un stack compacto de investigación y señales para cripto. Nuestra meta es simple: reducir ruido, revelar la estructura real del mercado y ayudarte a actuar con disciplina en lugar de impulso.`,

      `L7 significa agentes de capa de aplicación. Estos agentes leen documentos, llaman APIs, observan blockchains y libros de órdenes, corren experimentos y arman salidas explicables. No recibes una caja negra; recibes hipótesis, pruebas y un rastro claro de por qué apareció una sugerencia.`,

      `Para quién: traders que quieren conciencia situacional rápida; investigadores que necesitan estudios repetibles; equipos y mesas que requieren API limpia y un plano de datos estable.`,

      `Cobertura. Ingerimos datos de mercado de principales CEX y agregadores DEX, añadimos datos de referencia (símbolos, mapeos, metadatos de contratos) y unificamos en un esquema único. La comparabilidad entre venues es la meta.`,

      `Pipeline de datos. Feeds normalizados, huecos auto-rellenados, splits y cambios de contratos reconciliados, y derivados etiquetados. Grandes históricos permiten atribución de regímenes en lugar de sobreajuste de corto plazo.`,

      `Motor analítico. Más de doscientos indicadores, pero la clave no es cantidad, sino ensembles, pesos aprendidos y contexto. Familias clásicas (RSI, Stochastic, MFI, CCI, ADX/DI, EMA/SMA/WMA, MACD, ATR, Bandas de Bollinger, VWAP, OBV, líneas de Ichimoku) combinadas con filtros de regímenes y conciencia de liquidez.`,

      `Módulos on-chain. Analizamos transferencias, adiciones y retiros de liquidez, flujos de puentes, distribución de holders y huellas básicas de MEV. Las señales se reducen en peso en regiones delgadas o manipuladas.`,

      `Stream de noticias e investigación. Fuentes multilingües auto-traducidas, embebidas y deduplicadas. Sentimiento, novedad y fiabilidad del origen contribuyen a un score narrativo al lado de métricas de precio.`,

      `Tarjetas de señales. Cada tarjeta muestra un movimiento esperado y horizonte de tiempo derivado de la historia del activo, más confianza, contexto de liquidez e indicadores rápidos. Úsalas como faros para escenarios y riesgo, no como promesas.`,

      `Disciplina. Construimos para pre-compromiso: playbooks, corredores de volatilidad, stops dinámicos y plantillas de sizing. El sistema te anima a definir invalidación antes de la operación, no después.`,

      `Arquitectura. Servicios de datos y agentes corren como pequeños procesos TypeScript/Python tras un API estable. El sitio usa Next.js y WebSockets para actualizaciones en vivo. Caches y respaldos mantienen la UI responsiva aún en picos de datos.`,

      `Seguridad y privacidad. No custodial; llaves permanecen con el usuario. Acciones con roles y logueadas. Secretos guardados en servidor; datos minimizados y cifrados en tránsito y reposo.`,

      `Hoja de ruta. Cuadernos públicos y backtests, plantillas de estrategias, motor de portafolio con atribución, enrutamiento inteligente entre venues, conectores DeFi y modo autopiloto opcional con protecciones y checkpoints humanos.`,

      `Comunidad y soporte. Publicamos notas semanales, mantenemos canal en Telegram y aceptamos pedidos específicos de equipos. Tu feedback forma directamente el backlog: salen features útiles, no distracciones brillantes.`,

      `Importante: suscripciones y vínculo de billetera gestionados en nuestro bot de Telegram. El sitio se centra en investigación, visualización y documentación. Nada aquí es asesoría financiera.`,
    ],
    about_sections: [
      { title: 'Qué es Quantum L7 AI', parasIdx: [0] },
      { title: 'Agentes L7, no cajas negras', parasIdx: [1] },
      { title: 'Para quién', parasIdx: [2] },
      { title: 'Cobertura', parasIdx: [3] },
      { title: 'Pipeline de datos', parasIdx: [4] },
      { title: 'Motor analítico', parasIdx: [5] },
      { title: 'Módulos on-chain', parasIdx: [6] },
      { title: 'Noticias e investigación', parasIdx: [7] },
      { title: 'Tarjetas de señales', parasIdx: [8] },
      { title: 'Disciplina', parasIdx: [9] },
      { title: 'Arquitectura', parasIdx: [10] },
      { title: 'Seguridad y privacidad', parasIdx: [11] },
      { title: 'Hoja de ruta', parasIdx: [12] },
      { title: 'Comunidad y soporte', parasIdx: [13] },
      { title: 'Importante', parasIdx: [14] },
    ],

    about_bullets: [
      'Conciencia situacional rápida: estado de mercado, tendencia, momentum, volatilidad',
      'Normalización cross-venue y puntuación con liquidez',
      'Flujos on-chain: holders, movimientos de liquidez, puentes, banderas MEV básicas',
      'Noticias con traducción, búsqueda embebida y fiabilidad de fuente',
      'Movimiento esperado e horizonte en cada tarjeta (cuantiles históricos)',
      'Ensembles de indicadores con filtros y pesos',
      'Backtests y cuadernos reproducibles (roadmap)',
      'Motor de portafolio: presupuestos de riesgo, restricciones, atribución (roadmap)',
      'Enrutamiento CEX/DEX; protecciones contra latencia y slippage (roadmap)',
      'API/SDK para equipos; webhooks simples',
      'Opciones enterprise: SSO, despliegues privados, SLA',
      'Modelo no custodial: acciones con rol, logs de auditoría',
      'Resiliencia: caches, degradación elegante, respaldos',
      'UI limpia enfocada en decisiones, no ruido',
      'Pensamiento de escenarios: invalidación previa y frameworks de stop',
      'Artefactos: gráficos, tablas, reportes con links',
      'Búsqueda embebida en tus notas y fuentes públicas (opt-in)',
      'Conectores extensibles: precios, on-chain, investigación, social',
      'Guardrails con humano en el loop',
      'Límites claros: señales son herramientas, no garantías',
    ],

    tg_button: 'Telegram',

    /* ===== EXCHANGE ===== */
    exchange_title: 'Intercambio (en desarrollo)',
    exchange_sub:
      `Un lienzo vivo de mercado con ondas cuánticas, partículas constelación y una galaxia espiral.
Próximos hitos: enrutamiento DEX/CEX, selección con control de slippage, ejecución consciente de latencia, auto-hedge y límites de riesgo.`,
    exchange_sections: [
      {
        title: 'Visión: un intercambio L7 de próxima generación',
        paras: [
          `El intercambio no es solo un gráfico. Es un pipeline agentico L7 que ingiere datos de mercado, eventos on-chain y señales de libros de órdenes,
los puntúa y genera recomendaciones explicables (BUY/SELL/HOLD) con confianza y contexto de riesgo.`,
          `Identidad via billetera; cómputo orquestado por agentes. Llaves con el usuario.
Todo deja trazabilidad: desde investigación hasta ejecución.`,
        ],
      },
      {
        title: 'Enrutamiento y liquidez',
        paras: [
          `El router escanea liquidez en DEX/CEX en paralelo, estima slippage y fees,
selecciona venue o ruta dividida, y respeta límites de riesgo.`,
          `La latencia importa: timing con lógica de cancel/replace y kill-switch dinámico.`,
        ],
      },
      {
        title: 'Riesgo y controles',
        paras: [
          `Límites por notional, exposición y drawdown. Órdenes condicionales, time-in-force, umbral de confianza mínima para señales AI.`,
          `Guardrails protegen de bucles runaway. Todo trazable: razones, inputs y versiones de modelo.`,
        ],
      },
      {
        title: 'Analítica y explicabilidad',
        paras: [
          `El AI box muestra confianza y factores: medias móviles, relación VWAP, posición en bandas, régimen RSI y más.`,
          `Cada recomendación incluye bandas TP/SL derivadas de ATR y el régimen actual.`,
        ],
      },
      {
        title: 'Qué sigue',
        paras: [
          `Vista de portafolio, atribución PnL, contribución de factores.`,
          `Backtests y replays en el lienzo, plantillas y despliegue 1-clic.`,
        ],
      },
    ],
    roadmap: 'Hoja de ruta',
    ex_bullets: [
      'Enrutamiento inteligente con control de slippage',
      'Backtests, replays y métricas explicables',
      'Conexiones de billetera y analítica instantánea',
      'Plantillas de estrategia y guardrails',
    ],

    /* ===== SUBSCRIBE / CONTACT ===== */
    subscribe_title: 'Planes de suscripción',
    subscribe_sub:
      'Autenticación con billetera. PRO/VIP desbloquea investigación más rápida, señales privadas y features tempranas.',
    subscribe_cta: 'Suscribirse vía Telegram',

    contact_title: 'Contáctanos',
    contact_sub: 'Escríbenos — respondemos rápido.',
    contact_lines: [
      `Canal de Telegram — anuncios e investigación: ${CHANNEL_LINK}`,
      `Bot de feedback — soporte y pedidos: ${FEEDBACK_LINK}`,
      `Correo — partnerships & enterprise: ${CONTACT_EMAIL}`,
    ],

    links: { bot: BOT_LINK, channel: CHANNEL_LINK, feedback: FEEDBACK_LINK, email: CONTACT_EMAIL },
  },

  zh: {
    /* ===== UI (exchange/chart) ===== */
    ui_inprogress: '开发中',
    ui_quantum: 'Quantum',
    ui_candles: '蜡烛图',
    ui_hollow: '空心',
    ui_heikin: '平均足',
    ui_area: '面积图',
    ui_ma50: 'MA50',
    ui_ema21: 'EMA21',
    ui_ma200: 'MA200',
    ui_vwap: 'VWAP',
    ui_bands: '带状线',
    ui_volume: '成交量',
    ui_theme_aqua: '水蓝',
    ui_theme_violet: '紫色',
    ui_theme_amber: '琥珀',
    ui_halos: '光环',
    ui_stars: '星辰',
    ui_scan: '扫描',
    ui_waves: '波浪',
    ui_ions: '离子',
    ui_glint: '闪光',
    ui_live_on: '实时 开',
    ui_live_off: '实时 关',
    ui_bars: '条形图',
    ui_glow: '辉光',
    ui_tick: '跳动',
    ui_ai_reco: 'AI 推荐',
    ui_preview: '预览',
    ui_risk: '风险',
    ui_price: '价格',
    ui_tf: '时间框',
    ui_long_demo: '做多 (演示)',
    ui_short_demo: '做空 (演示)',
    ui_hedge_demo: '对冲 (演示)',

    /* ===== NAV ===== */
    nav_home: '首页',
    nav_about: '关于',
    nav_exchange: '交易所',
    nav_subscribe: '订阅',
    nav_contact: '联系',
    nav_channel: '频道',

    /* ===== HERO / HOME ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      '为研究、阿尔法信号和安全执行提供宇宙级智能。钱包认证，PRO/VIP 等级。',
    hero_cta: '在 Telegram 开始',
    hero_learn_more: '了解更多',
    marquee: '人工智能 • 区块链 • 自动化 • 量化 • 研究 • 智能体 • 阿尔法',

    home_blocks: [
      {
        title: '为什么选择 Quantum L7 AI',
        paras: [
          `我们将多模态模型与 L7 自主代理和链上管道融合。
系统通过去托管钱包认证，密钥由用户掌握，将原始数据转化为从发现、验证到执行的决策。`,
          `我们的理念是清晰：假设 → 测试 → 证据。
代理读取文档、调用 API、监听链上数据，并生成带有图表和引用的人类级别报告。`,
        ],
      },
      {
        title: '你将获得什么',
        bullets: [
          '从精选的链上和链下来源中发现阿尔法',
          '信号排名、置信度评分和风险覆盖',
          '回测、研究笔记本和可复现研究',
          '投资组合洞察、PnL 归因和市场状态检测',
          '带有防护和紧急开关的自动化执行',
          '实时仪表盘和警报',
          '私有数据集和连接器',
          '为团队和开发者提供 API/SDK',
          '治理挂钩和审计追踪',
          '教育课程和实时研究会话',
        ],
      },
    ],

    /* ===== ABOUT ===== */
    about_title: '关于 Quantum L7 AI',
    about_paragraphs: [
      `Quantum L7 AI 是一个紧凑的加密研究和信号堆栈。目标很简单：减少噪音，揭示真实的市场结构，帮助你用纪律而非冲动行动。`,

      `L7 代表应用层代理。这些代理读取文档、调用 API、观察区块链和订单簿，运行实验并生成可解释的输出。你获得的不是黑箱，而是假设、测试和清晰的推理链。`,

      `适用人群：需要快速市场感知的交易员；需要可复现研究的研究者；需要干净 API 和稳定数据层的团队和平台。`,

      `覆盖范围。我们从主要 CEX 和领先 DEX 聚合器获取市场数据，添加参考数据（符号、映射、合约元数据），并统一成单一架构。跨平台可比性是目标。`,

      `数据管道。数据源被标准化，缺口自动填补，拆分和合约变更被处理，衍生品被标记。大量历史数据支持市场状态归因，而不是短期过拟合。`,

      `分析引擎。提供 200 多个指标，但重点不在数量，而在于集成、权重和上下文。经典系列（RSI、随机指标、MFI、CCI、ADX/DI、EMA/SMA/WMA、MACD、ATR、布林带、VWAP、OBV、一目均衡表）与状态过滤和流动性感知结合。`,

      `链上模块。我们解析转账、流动性增加和移除、跨链桥流、持有者分布和基本 MEV 特征。在流动性不足或操纵区域信号会被降权。`,

      `新闻与研究流。多语言来源自动翻译、嵌入并去重。情绪、新颖性和来源可靠性共同构成轻量级叙事评分，显示在价格指标旁。`,

      `信号卡。每张卡片显示预期走势和时间范围，附带置信度、流动性上下文和快速指标。它们是帮助你制定场景和风险的灯塔，而不是承诺。`,

      `纪律。我们为预先承诺而构建：操作手册、波动走廊、动态止损和仓位大小模板。系统推动你在交易前定义无效点，而不是之后。`,

      `架构。数据和代理服务作为小型 TypeScript/Python 进程运行在稳定 API 背后。网站用 Next.js 渲染，WebSocket 实时更新。缓存和备用保持界面在数据高峰期依然响应。`,

      `安全与隐私。我们是去托管的；密钥在用户手中。操作按角色划分并记录。秘密存储在服务器端，个人数据在传输和存储中被最小化并加密。`,

      `路线图。公共笔记本和回测、策略模板、投资组合引擎、跨平台更智能路由、DeFi 连接器和带有人类检查点的自动驾驶模式。`,

      `社区与支持。我们每周发布研究笔记，维护 Telegram 频道，接受团队的具体请求。你的反馈直接塑造待办事项——有用功能上线，花哨但无用的不会。`,

      `重要提示：订阅和钱包绑定通过我们的 Telegram 机器人处理。网站专注于研究、可视化和文档。这里不是投资建议。`,
    ],
    about_sections: [
      { title: '什么是 Quantum L7 AI', parasIdx: [0] },
      { title: 'L7 代理，不是黑箱', parasIdx: [1] },
      { title: '适用人群', parasIdx: [2] },
      { title: '覆盖范围', parasIdx: [3] },
      { title: '数据管道', parasIdx: [4] },
      { title: '分析引擎', parasIdx: [5] },
      { title: '链上模块', parasIdx: [6] },
      { title: '新闻与研究流', parasIdx: [7] },
      { title: '信号卡', parasIdx: [8] },
      { title: '纪律', parasIdx: [9] },
      { title: '架构', parasIdx: [10] },
      { title: '安全与隐私', parasIdx: [11] },
      { title: '路线图', parasIdx: [12] },
      { title: '社区与支持', parasIdx: [13] },
      { title: '重要提示', parasIdx: [14] },
    ],

    about_bullets: [
      '快速市场感知：市场状态、趋势、动量、波动性',
      '跨平台标准化和流动性感知评分',
      '链上流：持有者、流动性变化、跨链桥、MEV 指标',
      '带翻译的新闻流、嵌入式搜索和来源可靠性',
      '每个信号卡上的预期走势和时间范围（基于历史分位数）',
      '指标集成与状态过滤和权重学习',
      '回测和可复现研究（路线图）',
      '投资组合引擎：风险预算、约束、PnL 归因（路线图）',
      '跨 CEX/DEX 智能路由；延迟和滑点保护（路线图）',
      '团队 API/SDK；简单 webhook 自动化',
      '企业选项：SSO、私有部署、SLA',
      '安全模型：去托管、角色范围、审计日志',
      '运行可靠性：缓存层、优雅降级、备用',
      '简洁 UI 突出决策，而非噪音',
      '场景思维：预定义无效点和止损框架',
      '研究成果：图表、表格、简报',
      '跨笔记嵌入搜索（可选）',
      '可扩展连接器：价格、链上、研究、社交',
      '半自动化流程中的人为防护',
      '清晰边界：信号是工具，不是保证',
    ],

    tg_button: 'Telegram',

    /* ===== EXCHANGE ===== */
    exchange_title: '交易所（开发中）',
    exchange_sub:
      `一个动态的市场画布，带有量子波、星座粒子和螺旋星系覆盖。
下一步：DEX/CEX 智能路由、滑点控制、延迟感知执行、自动对冲和风险限制。`,
    exchange_sections: [
      {
        title: '愿景：下一代 L7 交易所',
        paras: [
          `交易所不仅是图表。它是一个 L7 代理管道，吸收市场数据、链上事件和订单簿信号，
评分并生成可解释的推荐（买/卖/持有）及其置信度和风险上下文。`,
          `身份基于钱包；计算由代理编排。密钥掌握在用户手中。
所有过程都有审计轨迹：从研究到执行。`,
        ],
      },
      {
        title: '智能路由与流动性',
        paras: [
          `路由器并行扫描 DEX/CEX 的流动性，估计滑点和费用，
选择最佳 venue 或拆分路径，并遵守风险限制。`,
          `延迟至关重要：通过 cancel/replace 逻辑和 kill-switch 提高执行及时性。`,
        ],
      },
      {
        title: '风险与控制',
        paras: [
          `名义、敞口和回撤限制。条件订单、时效、AI 信号最小置信阈值。`,
          `防护栏防止失控循环。所有操作可追踪：原因、输入和模型版本。`,
        ],
      },
      {
        title: '分析与可解释性',
        paras: [
          `AI 框显示信心和因素：均线对齐、VWAP 关系、带内位置、RSI 状态等。`,
          `每个推荐配有基于 ATR 的 TP/SL 波段及当前市场状态。`,
        ],
      },
      {
        title: '下一步',
        paras: [
          `投资组合视图、PnL 归因、因子贡献。`,
          `回测和重放直接在画布上，策略模板，一键部署。`,
        ],
      },
    ],
    roadmap: '路线图',
    ex_bullets: [
      '智能路由与滑点控制',
      '回测、重放和可解释指标',
      '钱包连接与即时投资组合分析',
      '策略模板与防护栏',
    ],

    /* ===== SUBSCRIBE / CONTACT ===== */
    subscribe_title: '订阅计划',
    subscribe_sub:
      '钱包认证。PRO/VIP 解锁更快的研究、私人信号和早期功能。',
    subscribe_cta: '通过 Telegram 订阅',

    contact_title: '联系我们',
    contact_sub: '联系我们 — 快速响应。',
    contact_lines: [
      `Telegram 频道 — 公告与研究: ${CHANNEL_LINK}`,
      `反馈机器人 — 支持与请求: ${FEEDBACK_LINK}`,
      `邮箱 — 合作与企业: ${CONTACT_EMAIL}`,
    ],

    links: { bot: BOT_LINK, channel: CHANNEL_LINK, feedback: FEEDBACK_LINK, email: CONTACT_EMAIL },
  },

  ar: {
    /* ===== UI (exchange/chart) ===== */
    ui_inprogress: 'قيد التطوير',
    ui_quantum: 'Quantum',
    ui_candles: 'شموع',
    ui_hollow: 'مجوفة',
    ui_heikin: 'هيكين-أشي',
    ui_area: 'منطقة',
    ui_ma50: 'MA50',
    ui_ema21: 'EMA21',
    ui_ma200: 'MA200',
    ui_vwap: 'VWAP',
    ui_bands: 'أشرطة',
    ui_volume: 'حجم التداول',
    ui_theme_aqua: 'أكوا',
    ui_theme_violet: 'بنفسجي',
    ui_theme_amber: 'كهرمان',
    ui_halos: 'هالات',
    ui_stars: 'نجوم',
    ui_scan: 'مسح',
    ui_waves: 'أمواج',
    ui_ions: 'أيونات',
    ui_glint: 'وميض',
    ui_live_on: 'تشغيل مباشر',
    ui_live_off: 'إيقاف مباشر',
    ui_bars: 'أعمدة',
    ui_glow: 'توهج',
    ui_tick: 'تيك',
    ui_ai_reco: 'توصية بالذكاء الاصطناعي',
    ui_preview: 'معاينة',
    ui_risk: 'مخاطر',
    ui_price: 'سعر',
    ui_tf: 'الإطار الزمني',
    ui_long_demo: 'شراء (تجريبي)',
    ui_short_demo: 'بيع (تجريبي)',
    ui_hedge_demo: 'تحوط (تجريبي)',

    /* ===== NAV ===== */
    nav_home: 'الرئيسية',
    nav_about: 'حول',
    nav_exchange: 'البورصة',
    nav_subscribe: 'اشتراك',
    nav_contact: 'اتصال',
    nav_channel: 'القناة',

    /* ===== HERO / HOME ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'ذكاء بمستوى كوني للبحث، إشارات ألفا وتنفيذ محمي. توثيق عبر المحفظة، مستويات PRO/VIP.',
    hero_cta: 'ابدأ عبر Telegram',
    hero_learn_more: 'اعرف المزيد',
    marquee: 'ذكاء اصطناعي • بلوكتشين • أتمتة • كوانت • بحث • وكلاء • ألفا',

    home_blocks: [
      {
        title: 'لماذا Quantum L7 AI',
        paras: [
          `نمزج النماذج متعددة الأنماط مع وكلاء L7 المستقلين وخطوط المعالجة على السلسلة.
النظام يتوثق عبر محافظ غير احتجازية، تبقى المفاتيح لدى المستخدم، ويحوّل البيانات الخام إلى قرارات عبر الاكتشاف، التحقق والتنفيذ.`,
          `فلسفتنا هي الوضوح: فرضيات → اختبارات → أدلة.
الوكلاء يقرؤون المستندات، يستدعون واجهات برمجة التطبيقات، يراقبون بيانات السلسلة، ويؤلفون تقارير بمستوى بشري مع رسوم بيانية ومراجع.`,
        ],
      },
      {
        title: 'ما الذي ستحصل عليه',
        bullets: [
          'اكتشاف ألفا من مصادر مختارة على السلسلة وخارجها',
          'تصنيف إشارات، درجات ثقة وطبقات مخاطر',
          'اختبارات رجعية، دفاتر وأبحاث قابلة للتكرار',
          'رؤى المحفظة، نسب الأرباح والخسائر واكتشاف الأنظمة',
          'تنفيذ آلي مع ضوابط ومفاتيح إيقاف',
          'لوحات معلومات مباشرة وتنبيهات',
          'مجموعات بيانات خاصة وموصلات',
          'واجهة برمجة تطبيقات/SDK للفرق والمطورين',
          'وصلات الحوكمة وسجلات التدقيق',
          'مسارات تعليمية وجلسات بحث مباشرة',
        ],
      },
    ],

    /* ===== ABOUT ===== */
    about_title: 'حول Quantum L7 AI',
    about_paragraphs: [
      `Quantum L7 AI هو حزمة مدمجة للبحث والإشارات في مجال الكريبتو. هدفنا بسيط: تقليل الضوضاء، كشف البنية الحقيقية للسوق، ومساعدتك على التصرف بانضباط بدلًا من الاندفاع.`,

      `L7 تعني وكلاء طبقة التطبيقات. هؤلاء الوكلاء يقرؤون المستندات، يستدعون واجهات برمجة التطبيقات، يراقبون السلاسل ودفاتر الأوامر، يجرون تجارب صغيرة، ويجمعون مخرجات قابلة للتفسير. لا تحصل على صندوق أسود؛ بل على فرضيات، اختبارات، ومسار واضح للتوصية.`,

      `لمن هذا: للمتداولين الذين يريدون وعيًا سريعًا بالحالة؛ للباحثين الذين يحتاجون دراسات قابلة للتكرار؛ للفرق والمكاتب التي تحتاج إلى واجهة برمجة تطبيقات نظيفة ومستقرة.`,

      `التغطية. نستوعب بيانات السوق من منصات CEX الرئيسية ومجمّعات DEX الرائدة، نضيف بيانات مرجعية (رموز، خرائط، بيانات عقود) ونوحدها في مخطط واحد. الهدف هو إمكانية المقارنة عبر المنصات.`,

      `خط البيانات. يتم تطبيع التدفقات، تُسد الثغرات تلقائيًا، تُعالج الانقسامات وتغييرات العقود، وتوسم المشتقات. توفر السجلات التاريخية الكبيرة إمكانية عزو الأنظمة بدلاً من الإفراط في الملاءمة قصيرة الأجل.`,

      `محرك التحليلات. أكثر من مئتي مؤشر، لكن النقطة ليست الكثرة، بل التشكيلات، الأوزان المكتسبة والسياق. العائلات الكلاسيكية (RSI، Stochastic، MFI، CCI، ADX/DI، EMA/SMA/WMA، MACD، ATR، بولينجر باندز، VWAP، OBV، Ichimoku) مع مرشحات الأنظمة وإدراك السيولة.`,

      `الوحدات على السلسلة. نحلل التحويلات، إضافات وإزالات السيولة، تدفقات الجسور، توزيع الحامِلين وبصمات MEV الأساسية. الإشارات تخفّض في المناطق الضعيفة أو المتلاعب بها.`,

      `تيار الأخبار والأبحاث. المصادر متعددة اللغات تترجم تلقائيًا، تُضمَّن وتُزال الازدواجية. المزاج، الجِدة وموثوقية المصدر تشكّل درجة سردية بجوار مقاييس السعر.`,

      `بطاقات الإشارات. كل بطاقة تعرض حركة متوقعة وأفقًا زمنيًا مستمدًا من تاريخ الأصل، إضافة إلى الثقة، سياق السيولة ومؤشرات سريعة. تعامل معها كمنارات تساعدك على التفكير بالسيناريوهات والمخاطر — لا كوعود.`,

      `الانضباط. نبني من أجل الالتزام المسبق: أدلة تشغيل، ممرات تقلب، توقفات ديناميكية وقوالب تحديد حجم الصفقات. النظام يدفعك لتعريف الإلغاء قبل الصفقة لا بعدها.`,

      `البنية. خدمات البيانات والوكلاء تعمل كعمليات صغيرة بلغة TypeScript/Python خلف واجهة API مستقرة. الموقع يستخدم Next.js للتقديم و WebSockets للتحديث المباشر. التخزين المؤقت والبدائل تحافظ على استجابة الواجهة أثناء فترات الذروة.`,

      `الأمان والخصوصية. نحن غير احتجازيين؛ المفاتيح تبقى مع المستخدم. الأفعال مقيدة بالأدوار ومسجلة. الأسرار محفوظة على الخادم، والبيانات الشخصية مُقللة ومشفرة أثناء النقل وفي الراحة.`,

      `خارطة الطريق. دفاتر عامة واختبارات رجعية، قوالب استراتيجيات، محرك محفظة مع عزو، توجيه أكثر ذكاءً بين المنصات، موصلات DeFi ووضع الطيار الآلي الاختياري مع ضوابط صارمة ونقاط تحقق بشرية.`,

      `المجتمع والدعم. ننشر ملاحظات أسبوعية، ندير قناة Telegram، ونرحب بالطلبات المحددة من الفرق. ملاحظاتك تشكّل مباشرة جدول الأعمال — تُطلق الميزات المفيدة، لا اللمّاعة بلا فائدة.`,

      `مهم: الاشتراكات وربط المحافظ تُدار عبر بوت Telegram. الموقع يركّز على البحث، التصور والتوثيق. لا شيء هنا يُعتبر نصيحة مالية.`,
    ],
    about_sections: [
      { title: 'ما هو Quantum L7 AI', parasIdx: [0] },
      { title: 'وكلاء L7، لا صناديق سوداء', parasIdx: [1] },
      { title: 'لمن', parasIdx: [2] },
      { title: 'التغطية', parasIdx: [3] },
      { title: 'خط البيانات', parasIdx: [4] },
      { title: 'محرك التحليلات', parasIdx: [5] },
      { title: 'الوحدات على السلسلة', parasIdx: [6] },
      { title: 'تيار الأخبار والأبحاث', parasIdx: [7] },
      { title: 'بطاقات الإشارات', parasIdx: [8] },
      { title: 'الانضباط', parasIdx: [9] },
      { title: 'البنية', parasIdx: [10] },
      { title: 'الأمان والخصوصية', parasIdx: [11] },
      { title: 'خارطة الطريق', parasIdx: [12] },
      { title: 'المجتمع والدعم', parasIdx: [13] },
      { title: 'مهم', parasIdx: [14] },
    ],

    about_bullets: [
      'وعي سريع بالحالة: حالة السوق، الاتجاه، الزخم، التقلب',
      'تطبيع عبر المنصات وتقييم واعٍ بالسيولة',
      'تدفقات على السلسلة: حامِلون، تحركات السيولة، نشاط الجسور، إشارات MEV أساسية',
      'أخبار مع ترجمة، بحث مضمَّن وموثوقية المصدر',
      'حركة متوقعة وأفق على كل بطاقة إشارة (كوانتايل تاريخية)',
      'تشكيلات مؤشرات مع مرشحات أنظمة وأوزان مكتسبة',
      'اختبارات رجعية ودفاتر أبحاث قابلة للتكرار (خارطة الطريق)',
      'محرك محفظة: ميزانيات مخاطر، قيود، عزو PnL (خارطة الطريق)',
      'توجيه ذكي بين CEX/DEX؛ حماية من التأخير والانزلاق (خارطة الطريق)',
      'واجهة برمجة تطبيقات/SDK للفرق والأتمتة؛ ويب هوكس بسيطة',
      'خيارات مؤسساتية: SSO، نشر خاص، SLA',
      'نموذج أمان غير احتجازي: أدوار وسجلات تدقيق',
      'المرونة التشغيلية: طبقات تخزين مؤقت، تدهور سلس، بدائل',
      'واجهة نظيفة تركز على القرارات لا الضوضاء',
      'تفكير بالسيناريوهات: إلغاء مُسبق وتوقفات محددة',
      'نتائج أبحاث: رسوم بيانية، جداول، تقارير موجزة',
      'بحث مضمَّن عبر ملاحظاتك والمصادر العامة (اختياري)',
      'موصلات قابلة للتوسيع: أسعار، على السلسلة، بحث، اجتماعي',
      'حماية بوجود إنسان في الحلقة للعمليات شبه المؤتمتة',
      'حدود واضحة: الإشارات أدوات لا ضمانات',
    ],

    tg_button: 'تيليجرام',

    /* ===== EXCHANGE ===== */
    exchange_title: 'البورصة (قيد التطوير)',
    exchange_sub:
      `لوحة سوق حيّة مع أمواج كمومية، جزيئات كوكبية وتراكب مجرة حلزونية.
الخطوات التالية: توجيه ذكي عبر DEX/CEX، اختيار منصات مع تحكم بالانزلاق، تنفيذ مدرك للتأخير، تحوط تلقائي وحدود مخاطر.`,
    exchange_sections: [
      {
        title: 'رؤية: بورصة L7 من الجيل القادم',
        paras: [
          `البورصة ليست مجرد رسم بياني. إنها خط معالجة L7 يستوعب بيانات السوق، أحداث على السلسلة وإشارات دفاتر الأوامر،
يقيمها ويصدر توصيات قابلة للتفسير (شراء/بيع/احتفاظ) مع الثقة وسياق المخاطر.`,
          `الهوية قائمة على المحفظة؛ الحساب ينفذه الوكلاء. المفاتيح مع المستخدم.
كل شيء يترك أثر تدقيق: من خطوات البحث إلى التنفيذ.`,
        ],
      },
      {
        title: 'التوجيه والسيولة',
        paras: [
          `الراوتر يمسح السيولة على DEX/CEX بالتوازي، يقدّر الانزلاق والرسوم،
يختار منصة أو مسار مقسم، ويحترم حدود المخاطر.`,
          `التأخير مهم: الهدف توقيت أفضل بآلية إلغاء/استبدال ومفتاح إيقاف ديناميكي.`,
        ],
      },
      {
        title: 'المخاطر والضوابط',
        paras: [
          `حدود بالقيمة الاسمية، الانكشاف والتراجع. أوامر مشروطة، مدة صلاحية، حد أدنى للثقة في إشارات AI.`,
          `حواجز تحمي من الحلقات الخارجة عن السيطرة. كل فعل قابل للتتبع: السبب، المدخلات وإصدارات النماذج.`,
        ],
      },
      {
        title: 'التحليلات وقابلية التفسير',
        paras: [
          `صندوق AI يظهر الثقة والعوامل: توافق المتوسطات المتحركة، علاقة VWAP، الموضع في الأشرطة، نظام RSI وأكثر.`,
          `كل توصية تترافق مع نطاقات TP/SL مشتقة من تقلبات ATR والنظام الحالي.`,
        ],
      },
      {
        title: 'ما التالي',
        paras: [
          `عرض المحفظة، عزو الأرباح والخسائر، مساهمة العوامل.`,
          `اختبارات رجعية وإعادات تشغيل مباشرة على اللوحة، قوالب استراتيجيات ونشر بنقرة واحدة.`,
        ],
      },
    ],
    roadmap: 'خارطة الطريق',
    ex_bullets: [
      'توجيه ذكي مع تحكم بالانزلاق واختيار المنصات',
      'اختبارات رجعية، إعادات تشغيل ومقاييس قابلة للتفسير',
      'اتصال المحفظة وتحليلات فورية للمحفظة',
      'قوالب استراتيجيات وضوابط حماية',
    ],

    /* ===== SUBSCRIBE / CONTACT ===== */
    subscribe_title: 'خطط الاشتراك',
    subscribe_sub:
      'توثيق عبر المحفظة. PRO/VIP تفتح بحث أسرع، إشارات خاصة وميزات مبكرة.',
    subscribe_cta: 'اشترك عبر Telegram',

    contact_title: 'اتصل بنا',
    contact_sub: 'تواصل مع الفريق — نستجيب بسرعة.',
    contact_lines: [
      `قناة Telegram — إعلانات وبحث: ${CHANNEL_LINK}`,
      `بوت الملاحظات — دعم وطلبات: ${FEEDBACK_LINK}`,
      `البريد — شراكات ومؤسسات: ${CONTACT_EMAIL}`,
    ],

    links: { bot: BOT_LINK, channel: CHANNEL_LINK, feedback: FEEDBACK_LINK, email: CONTACT_EMAIL },
  },

  tr: {
    /* ===== UI (exchange/chart) ===== */
    ui_inprogress: 'GELİŞİYOR',
    ui_quantum: 'Quantum',
    ui_candles: 'Mumlar',
    ui_hollow: 'İçi Boş',
    ui_heikin: 'Heikin-Ashi',
    ui_area: 'Alan',
    ui_ma50: 'MA50',
    ui_ema21: 'EMA21',
    ui_ma200: 'MA200',
    ui_vwap: 'VWAP',
    ui_bands: 'Bantlar',
    ui_volume: 'Hacim',
    ui_theme_aqua: 'Aqua',
    ui_theme_violet: 'Mor',
    ui_theme_amber: 'Kehribar',
    ui_halos: 'Halkalar',
    ui_stars: 'Yıldızlar',
    ui_scan: 'Tara',
    ui_waves: 'Dalgalar',
    ui_ions: 'İyonlar',
    ui_glint: 'Parıltı',
    ui_live_on: 'Canlı AÇIK',
    ui_live_off: 'Canlı KAPALI',
    ui_bars: 'Çubuklar',
    ui_glow: 'Parlama',
    ui_tick: 'Tik',
    ui_ai_reco: 'AI Önerisi',
    ui_preview: 'önizleme',
    ui_risk: 'Risk',
    ui_price: 'Fiyat',
    ui_tf: 'Zaman Çerçevesi',
    ui_long_demo: 'Uzun (demo)',
    ui_short_demo: 'Kısa (demo)',
    ui_hedge_demo: 'Hedge (demo)',

    /* ===== NAV ===== */
    nav_home: 'Ana Sayfa',
    nav_about: 'Hakkında',
    nav_exchange: 'Borsa',
    nav_subscribe: 'Abone Ol',
    nav_contact: 'İletişim',
    nav_channel: 'Kanal',

    /* ===== HERO / HOME ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'Araştırma, alfa sinyalleri ve güvenli yürütme için kozmik düzeyde zeka. Cüzdan doğrulaması, PRO/VIP seviyeleri.',
    hero_cta: 'Telegram’da Başla',
    hero_learn_more: 'Daha Fazla Bilgi',
    marquee: 'AI • Blockchain • Otomasyon • Kuant • Araştırma • Ajanlar • Alfa',

    home_blocks: [
      {
        title: 'Neden Quantum L7 AI',
        paras: [
          `Çok modüllü modelleri L7 otonom ajanlar ve zincir üstü hatlarla birleştiriyoruz.
Sistem, gözetimsiz cüzdanlarla doğrulanır, anahtarlar kullanıcıda kalır ve ham verileri keşif, doğrulama ve yürütme arasında kararlara dönüştürür.`,
          `Felsefemiz açıklıktır: hipotezler → testler → kanıt.
Ajanlar belgeleri okur, API’leri çağırır, zincir verilerini izler ve grafikler ile alıntılarla insan düzeyinde raporlar hazırlar.`,
        ],
      },
      {
        title: 'Ne elde edersiniz',
        bullets: [
          'Seçilmiş zincir içi ve dışı kaynaklardan alfa keşfi',
          'Sinyal sıralaması, güven puanlaması ve risk katmanları',
          'Geriye dönük testler, defterler ve yeniden üretilebilir araştırmalar',
          'Portföy içgörüleri, PnL atıfı ve rejim tespiti',
          'Koruma ve acil durdurma anahtarıyla otomatik yürütme',
          'Canlı panolar ve uyarılar',
          'Özel veri kümeleri ve bağlayıcılar',
          'Ekipler ve geliştiriciler için API/SDK',
          'Yönetişim kancaları ve denetim izleri',
          'Eğitim yolları ve canlı araştırma oturumları',
        ],
      },
    ],

    /* ===== ABOUT ===== */
    about_title: 'Quantum L7 AI Hakkında',
    about_paragraphs: [
      `Quantum L7 AI, kripto için kompakt bir araştırma ve sinyal yığınıdır. Amacımız basittir: gürültüyü azaltmak, gerçek piyasa yapısını ortaya çıkarmak ve sizi dürtüyle değil disiplinle hareket etmeye yönlendirmek.`,

      `L7, uygulama katmanı ajanlarını ifade eder. Bu ajanlar belgeleri okur, API’leri çağırır, blok zincirlerini ve emir defterlerini gözlemler, küçük deneyler yapar ve açıklanabilir çıktılar üretir. Kara kutu almazsınız; hipotezler, testler ve açık bir iz elde edersiniz.`,

      `Kimler için: Hızlı durum farkındalığı isteyen traderlar; tekrar edilebilir çalışmalar isteyen araştırmacılar; temiz API ve istikrarlı veri düzlemi isteyen ekipler ve masalar.`,

      `Kapsam. Büyük CEX platformlarından ve önde gelen DEX toplayıcılarından piyasa verilerini alıyoruz, referans veriler (semboller, eşlemeler, sözleşme meta verileri) ekliyoruz ve tek bir şemada birleştiriyoruz. Çapraz platform karşılaştırılabilirliği hedeflenir.`,

      `Veri hattı. Beslemeler normalize edilir, boşluklar otomatik doldurulur, bölünmeler ve sözleşme değişiklikleri uzlaştırılır ve türevler etiketlenir. Büyük tarih havuzları kısa vadeli aşırı uyum yerine rejim atfına izin verir.`,

      `Analitik motoru. İki yüzden fazla gösterge mevcuttur, ancak mesele miktar değil; topluluklar, öğrenilmiş ağırlıklar ve bağlamdır. Klasik aileler (RSI, Stokastik, MFI, CCI, ADX/DI, EMA/SMA/WMA, MACD, ATR, Bollinger Bantları, VWAP, OBV, Ichimoku) rejim filtreleri ve likidite farkındalığıyla birleştirilir.`,

      `Zincir üstü modüller. Transferleri, likidite ekleme ve kaldırma işlemlerini, köprü akışlarını, sahip dağılımlarını ve temel MEV parmak izlerini çözümleriz. İnce veya manipüle edilmiş bölgelerde sinyallerin ağırlığı azaltılır.`,

      `Haber ve araştırma akışı. Çok dilli kaynaklar otomatik çevrilir, gömülür ve yinelenenler kaldırılır. Duyarlılık, yenilik ve kaynak güvenilirliği fiyat metriklerinin yanında hafif bir anlatı puanına katkıda bulunur.`,

      `Sinyal kartları. Her kart, varlığın geçmişinden türetilen beklenen hareketi ve zaman ufkunu gösterir, ayrıca güven, likidite bağlamı ve hızlı göstergeler sunar. Kartlara, risk ve senaryoları çerçevelemeye yardımcı olan işaretçiler olarak davranın — asla bir garanti olarak değil.`,

      `Disiplin. Ön taahhüt için oluşturuyoruz: oyun planları, oynaklık koridorları, dinamik duraklar ve pozisyon boyutlandırma şablonları. Sistem sizi işlemden önce geçersizliği tanımlamaya iter, sonrasında değil.`,

      `Mimari. Veri ve ajan hizmetleri, sabit bir API arkasında küçük TypeScript/Python süreçleri olarak çalışır. Web sitesi, Next.js ile render edilir ve WebSockets ile canlı güncellemeler yapılır. Önbellekler ve yedekler, veri patlamaları sırasında bile kullanıcı arayüzünü duyarlı tutar.`,

      `Güvenlik ve gizlilik. Gözetimsiziz; anahtarlar kullanıcıda kalır. Eylemler role göre kapsamlıdır ve kaydedilir. Sırlar sunucu tarafında saklanır, kişisel veriler minimize edilir ve aktarımda ve depoda şifrelenir.`,

      `Yol Haritası. Genel defterler ve geriye dönük testler, strateji şablonları, portföy motoru, platformlar arası daha akıllı yönlendirme, DeFi bağlayıcıları ve katı korumalar ile insan denetimleri olan isteğe bağlı bir otomatik pilot modu.`,

      `Topluluk ve destek. Haftalık araştırma notları yayınlıyoruz, bir Telegram kanalı işletiyoruz ve ekiplerden gelen özel talepleri memnuniyetle karşılıyoruz. Geri bildiriminiz doğrudan bekleme listemizi şekillendirir — yararlı özellikler çıkar, dikkat dağıtıcı olanlar çıkmaz.`,

      `Önemli: abonelikler ve cüzdan bağlantısı Telegram botumuz aracılığıyla yönetilir. Web sitesi araştırma, görselleştirme ve belgeler üzerinde yoğunlaşır. Buradaki hiçbir şey finansal tavsiye değildir.`,
    ],
    about_sections: [
      { title: 'Quantum L7 AI Nedir', parasIdx: [0] },
      { title: 'L7 ajanları, kara kutular değil', parasIdx: [1] },
      { title: 'Kimler için', parasIdx: [2] },
      { title: 'Kapsam', parasIdx: [3] },
      { title: 'Veri hattı', parasIdx: [4] },
      { title: 'Analitik motoru', parasIdx: [5] },
      { title: 'Zincir üstü modüller', parasIdx: [6] },
      { title: 'Haber & araştırma akışı', parasIdx: [7] },
      { title: 'Sinyal kartları', parasIdx: [8] },
      { title: 'Disiplin', parasIdx: [9] },
      { title: 'Mimari', parasIdx: [10] },
      { title: 'Güvenlik & gizlilik', parasIdx: [11] },
      { title: 'Yol Haritası', parasIdx: [12] },
      { title: 'Topluluk & destek', parasIdx: [13] },
      { title: 'Önemli', parasIdx: [14] },
    ],

    about_bullets: [
      'Hızlı durum farkındalığı: piyasa durumu, trend, momentum, oynaklık',
      'Platformlar arası normalleştirme ve likiditeye duyarlı puanlama',
      'Zincir üstü akışlar: sahipler, likidite hareketleri, köprü aktiviteleri, temel MEV işaretleri',
      'Çeviri, gömülü arama ve kaynak güvenilirliği ile haber akışı',
      'Her sinyal kartında beklenen hareket ve ufuk (tarihsel kantiller)',
      'Rejim filtreleri ve öğrenilmiş ağırlıklarla gösterge toplulukları',
      'Geriye dönük testler ve yeniden üretilebilir araştırmalar (yol haritası)',
      'Portföy motoru: risk bütçeleri, kısıtlamalar, PnL atıfı (yol haritası)',
      'Akıllı yönlendirme; gecikme ve kayma korumaları (yol haritası)',
      'Ekipler için API/SDK; basit web kancaları',
      'Kurumsal seçenekler: SSO, özel dağıtımlar, SLA',
      'Gözetimsiz güvenlik modeli: kapsamlı eylemler, denetim kayıtları',
      'Operasyonel dayanıklılık: önbellek katmanları, zarif bozulma, yedekler',
      'Temiz UI: kararları vurgular, gürültüyü değil',
      'Senaryo düşüncesi: önceden tanımlanmış geçersizlik ve durdurma çerçeveleri',
      'Araştırma çıktıları: grafikler, tablolar, raporlar',
      'Notlarınız ve genel kaynaklar arasında gömülü arama (isteğe bağlı)',
      'Genişletilebilir bağlayıcılar: fiyat, zincir, araştırma, sosyal',
      'Yarı otomatik iş akışları için insan denetimli korumalar',
      'Açık sınırlar: sinyaller araçtır, garanti değil',
    ],

    tg_button: 'Telegram',

    /* ===== EXCHANGE ===== */
    exchange_title: 'Borsa (gelişiyor)',
    exchange_sub:
      `Kuantum tarzı dalgalar, takımyıldız parçacıkları ve spiral galaksi örtüsüyle canlı bir piyasa tuvali.
Sonraki adımlar: DEX/CEX üzerinde akıllı yönlendirme, kayma kontrolüyle platform seçimi, gecikmeye duyarlı yürütme, otomatik hedge ve risk limitleri.`,
    exchange_sections: [
      {
        title: 'Vizyon: yeni nesil L7 borsası',
        paras: [
          `Borsa sadece bir grafik değildir. Bu, piyasa verilerini, zincir üstü olayları ve emir defteri sinyallerini alan,
puanlayan ve güven ile risk bağlamında açıklanabilir öneriler (AL/SAT/TUT) sunan bir L7 ajan hattıdır.`,
          `Kimlik cüzdan tabanlıdır; işlem ajanlar tarafından orkestre edilir. Anahtarlar kullanıcıda kalır.
Araştırmadan yürütmeye kadar her şeyin denetim izi vardır.`,
        ],
      },
      {
        title: 'Akıllı yönlendirme & likidite',
        paras: [
          `Yönlendirici, DEX/CEX üzerindeki likiditeyi paralel tarar, kaymayı ve ücretleri tahmin eder,
bir platform veya bölünmüş rota seçer ve kullanıcı risk sınırlarına uyar.`,
          `Gecikme önemlidir: iptal/değiştir mantığı ve dinamik kill-switch ile en iyi zamanlama hedeflenir.`,
        ],
      },
      {
        title: 'Risk & kontroller',
        paras: [
          `Nominal, maruz kalma ve çekilme sınırları. Koşullu emirler, geçerlilik süresi, AI sinyalleri için minimum güven eşiği.`,
          `Koruma rayları kontrolden çıkan döngüleri önler. Her eylem gerekçesi, girdiler ve model sürümleriyle izlenebilir.`,
        ],
      },
      {
        title: 'Analitik & açıklanabilirlik',
        paras: [
          `AI kutusu güven ve faktörleri gösterir: hareketli ortalama uyumu, VWAP ilişkisi, bant konumu, RSI rejimi ve daha fazlası.`,
          `Her öneri, ATR benzeri volatilite ölçülerinden ve mevcut rejimden türetilen TP/SL bantlarıyla birlikte gelir.`,
        ],
      },
      {
        title: 'Sonraki adımlar',
        paras: [
          `Portföy görünümü, PnL atıfı, faktör katkı grafikleri.`,
          `Tuval üzerinde doğrudan backtest ve tekrarlar, strateji şablonları ve tek tıkla dağıtım.`,
        ],
      },
    ],
    roadmap: 'Yol Haritası',
    ex_bullets: [
      'Kayma kontrolüyle akıllı yönlendirme ve platform seçimi',
      'Geriye dönük testler, tekrarlar ve açıklanabilir metrikler',
      'Cüzdan bağlantıları ve anlık portföy analizi',
      'Strateji şablonları ve koruma rayları',
    ],

    /* ===== SUBSCRIBE / CONTACT ===== */
    subscribe_title: 'Abonelik Planları',
    subscribe_sub:
      'Cüzdan tabanlı doğrulama. PRO/VIP daha hızlı araştırma, özel sinyaller ve erken özellikler sunar.',
    subscribe_cta: 'Telegram üzerinden abone ol',

    contact_title: 'Bize Ulaşın',
    contact_sub: 'Ekiple iletişime geçin — hızlı yanıtlıyoruz.',
    contact_lines: [
      `Telegram kanalı — duyurular ve araştırma: ${CHANNEL_LINK}`,
      `Geri bildirim botu — destek ve istekler: ${FEEDBACK_LINK}`,
      `E-posta — ortaklıklar ve kurumsal: ${CONTACT_EMAIL}`,
    ],

    links: { bot: BOT_LINK, channel: CHANNEL_LINK, feedback: FEEDBACK_LINK, email: CONTACT_EMAIL },
  },
}

const I18nContext = createContext({ t: (k) => k, lang: 'en', setLang: () => {} })

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en')
  useEffect(() => {
    try { const s = localStorage.getItem('ql7_lang'); if (['ru','en','uk','es','zh','ar','tr'].includes(s)) setLang(s) } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('ql7_lang', lang) } catch {}
    if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const t = (k) => dict[lang][k] ?? k
  return <I18nContext.Provider value={{ t, lang, setLang }}>{children}</I18nContext.Provider>
}
export function useI18n() { return useContext(I18nContext) }
