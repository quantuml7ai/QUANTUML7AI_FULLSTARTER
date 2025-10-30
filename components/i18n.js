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
    auth_signin: 'Sign in',
    nav_support: 'Support',
    select_symbol_tf: "Select symbol / TF",
    /* ===== HERO / HOME (кратко) ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'Cosmic-grade intelligence for research, alpha signals and guarded execution. Wallet auth, PRO/VIP tiers.',
    hero_cta: 'Start in Telegram',
    hero_learn_more: 'Learn More',
    marquee: 'AI • Blockchain • Automation • Quant • Research • Agents • Alpha • All rights reserved ',

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
      `Telegram channel — announcements and research: `,
      `Feedback bot — support & requests: `,
      `Email — partnerships & enterprise: `,
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
    auth_signin: 'Авторизация',
    nav_support: 'Поддержка',
    select_symbol_tf: "Выбрать символ / TF",
    /* ===== HERO / HOME (кратко) ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'Космический интеллект для аналитики, исследования, альфа-сигналы и исполнение под защитой. Авторизация кошельком, уровни PRO/VIP.',
    hero_cta: 'Начать в Telegram',
    hero_learn_more: 'Подробнее',
    marquee: 'ИИ • Блокчейн • Автоматизация • Квант • Исследования • Агенты • Альфа • Все права защищены ',

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
      `Telegram-канал — анонсы и исследования: `,
      `Бот обратной связи — поддержка и запросы: `,
      `Почта — партнёрства и enterprise: `,
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
    auth_signin: 'Авторизація',
    nav_support: 'Підтримка',
    select_symbol_tf: "Вибрати символ / TF",
    /* ===== HERO / HOME (коротко) ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'Космічний інтелект для досліджень, альфа-сигналів та безпечного виконання. Авторизація гаманцем, рівні PRO/VIP.',
    hero_cta: 'Почати в Telegram',
    hero_learn_more: 'Дізнатися більше',
    marquee: 'ШІ • Блокчейн • Автоматизація • Квант • Дослідження • Агенти • Альфа • Усі права захищені ',

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
    /* ===== SUBSCRIBE / CONTACT (скорочено) ===== */
    subscribe_title: 'Тарифи та підписки',
    subscribe_sub:
      'Авторизація через гаманець. PRO/VIP відкривають швидкі дослідження, приватні сигнали та ранні функції.',
    subscribe_cta: 'Оформити підписку в Telegram',

    contact_title: 'Зв’язатися з нами',
    contact_sub: 'Пишіть — відповідаємо швидко.',
    contact_lines: [
      `Telegram-канал — анонси та дослідження: `,
      `Бот зворотного зв’язку — підтримка та запити: `,
      `Пошта — партнерства та enterprise: `,
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
    auth_signin: 'Iniciar sesión',
    nav_support: 'Soporte',
    select_symbol_tf: "Seleccionar símbolo / TF",
    /* ===== HERO / HOME ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'Inteligencia cósmica para investigación, señales alfa y ejecución segura. Autenticación con billetera, niveles PRO/VIP.',
    hero_cta: 'Comenzar en Telegram',
    hero_learn_more: 'Saber más',
    marquee: 'IA • Blockchain • Automatización • Cuántico • Investigación • Agentes • Alfa • Todos los derechos reservados ',

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
      `Canal de Telegram — anuncios e investigación: `,
      `Bot de feedback — soporte y pedidos: `,
      `Correo — partnerships & enterprise: `,
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
    auth_signin: '登录',
    nav_support: '支持',
    select_symbol_tf: "选择符号 / 时间框架",
    /* ===== HERO / HOME ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      '为研究、阿尔法信号和安全执行提供宇宙级智能。钱包认证，PRO/VIP 等级。',
    hero_cta: '在 Telegram 开始',
    hero_learn_more: '了解更多',
    marquee: '人工智能 • 区块链 • 自动化 • 量化 • 研究 • 智能体 • 阿尔法 • 版权所有 ',

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
      `Telegram 频道 — 公告与研究: `,
      `反馈机器人 — 支持与请求: `,
      `邮箱 — 合作与企业: `,
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
    auth_signin: 'تسجيل الدخول',
    nav_support: 'الدعم',
    select_symbol_tf: "اختر الرمز / الإطار الزمني",

    /* ===== HERO / HOME ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'ذكاء بمستوى كوني للبحث، إشارات ألفا وتنفيذ محمي. توثيق عبر المحفظة، مستويات PRO/VIP.',
    hero_cta: 'ابدأ عبر Telegram',
    hero_learn_more: 'اعرف المزيد',
    marquee: 'الذكاء الاصطناعي • سلسلة الكتل • الأتمتة • الكمي • الأبحاث • الوكلاء • ألفا • جميع الحقوق محفوظة',

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
      `قناة Telegram — إعلانات وبحث: `,
      `بوت الملاحظات — دعم وطلبات: `,
      `البريد — شراكات ومؤسسات: `,
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
    auth_signin: 'Giriş yap',
    nav_support: 'Destek',
    select_symbol_tf: "Sembol / Zaman Çerçevesi Seç",
    /* ===== HERO / HOME ===== */
    hero_title: 'Quantum L7 AI',
    hero_subtitle:
      'Araştırma, alfa sinyalleri ve güvenli yürütme için kozmik düzeyde zeka. Cüzdan doğrulaması, PRO/VIP seviyeleri.',
    hero_cta: 'Telegram’da Başla',
    hero_learn_more: 'Daha Fazla Bilgi',
    marquee: 'AI • Blockchain • Otomasyon • Kuant • Araştırma • Ajanlar • Alfa • Tüm hakları saklıdır ',

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
      `Telegram kanalı — duyurular ve araştırma: `,
      `Geri bildirim botu — destek ve istekler: `,
      `E-posta — ortaklıklar ve kurumsal: `,
    ],

    links: { bot: BOT_LINK, channel: CHANNEL_LINK, feedback: FEEDBACK_LINK, email: CONTACT_EMAIL },
  },
}
/* ============================================================
   PRIVACY & POLICY — EXTENDED PATCH (x5 content)
   ВСТАВИТЬ в components/i18n.js ПЕРЕД export I18nProvider / useI18n
   НИЧЕГО НЕ ЛОМАЕТ: просто дополняет/перезаписывает ключи.
   ============================================================ */

/* -------------------- EN -------------------- */
const PRIVACY_EN = {
  nav_privacy: 'Privacy & Policy',
  privacy_title: 'Privacy & Policy',
  privacy_updated_label: 'Updated:',
  privacy_updated: '2025-09-14',
  privacy_empty: 'No items',
  privacy_sections: [
    { title: 'Overview', paras: [
      'This Policy explains what we collect, how we use it, and how we protect data on the website, in the Telegram bot, and in our services.',
      'By using the service, you agree to this Policy. This is a product notice, not legal advice.'
    ]},
    { title: 'What we collect', paras: [
      'Account and contact data: Telegram ID/username/display name; email (if you send it); messages you send to us.',
      'Wallet linking: networks and public addresses (never private keys).',
      'Usage and device data: pages, clicks, referrer, hashed IP, user agent, timestamps, error and performance telemetry.'
    ]},
    { title: 'On-chain and public data', paras: [
      'We analyse public blockchain and market data. Such sources are public by design and are not personal data under our control.',
      'Requests (e.g., symbol or address analytics) can be logged to operate the service and improve reliability.'
    ]},
    { title: 'Cookies and localStorage', paras: [
      'We use them minimally: language, session, anti-abuse. You may block them; some features may degrade.'
    ]},
    { title: 'How we use data', paras: [
      'Provide and improve research and signals; routing and guarded execution; abuse prevention; support and communication.',
      'We do not build advertising profiles.'
    ]},
    { title: 'Sharing with third parties', paras: [
      'We do not sell personal data.',
      'Processors: hosting (e.g., Vercel), storage, analytics (if enabled), error tracking, email/Telegram delivery.',
      'Disclosure may be required to comply with law or to protect rights.'
    ]},
    { title: 'Security', paras: [
      'Keys stay with you; we never request seed phrases. Data is encrypted in transit and at rest; access is role-scoped and logged.',
      'We apply least-privilege access, MFA on critical systems, and change control for deployments.'
    ]},
    { title: 'International transfers', paras: [
      'Processing may occur abroad. Where required, we use standard safeguards (e.g., SCC) or other lawful transfer mechanisms.'
    ]},
    { title: 'Your rights', paras: [
      'EEA/UK (GDPR): access, rectification, erasure, portability, restriction/objection; right to lodge a complaint with a supervisory authority.',
      'California (CPRA): access, deletion, correction, opt-out of sale/share; non-discrimination for exercising rights.'
    ]},
    { title: 'Children', paras: [
      'The service is not intended for children under 13 (or higher minimum age in your jurisdiction).'
    ]},
    { title: 'Changes', paras: [
      'We may update this Policy. We will revise the “Updated” date and, when appropriate, notify in-app or via channel.'
    ]},
    { title: 'Contacts', paras: [
      'Email: quantuml7ai@gmail.com',
      'Feedback bot: https://t.me/L7ai_feedback'
    ]},

    /* ===== Extended sections ===== */

    { title: 'Definitions and scope', paras: [
      '“Service” means our websites, bots, APIs, and related applications. “We” means Quantum L7 AI.',
      'This Policy covers data we process as controller. Vendor policies and blockchain networks have their own rules.'
    ]},
    { title: 'Legal bases (GDPR)', paras: [
      'Contract: to provide requested features (routing, research, dashboards).',
      'Legitimate interests: service reliability, security, abuse prevention, product analytics with minimal impact.',
      'Consent: optional analytics/marketing where applicable; you can withdraw at any time.',
      'Legal obligation: where we must retain or disclose data under law.'
    ]},
    { title: 'Data retention', paras: [
      'We keep personal data only as long as necessary for the purposes described or as required by law.',
      'Typical ranges: operational logs 30–180 days; support messages up to 12 months; legal records as mandated.'
    ]},
    { title: 'Subprocessors', paras: [
      'Typical categories: hosting/CDN, object storage, email/Telegram delivery, monitoring, error tracking, basic product analytics.',
      'We engage reputable providers under data-processing agreements and review their safeguards periodically.'
    ]},
    { title: 'Analytics and metrics', paras: [
      'If enabled, we measure aggregate usage (pages, performance, feature adoption).',
      'Analytics is configured to avoid sensitive data and to minimise personal data wherever practical.'
    ]},
    { title: 'Logging and telemetry', paras: [
      'Operational logs may include timestamps, hashed IP, user agent, error traces, and request identifiers.',
      'Logs are rotated, access-controlled, and used for debugging, capacity planning, and abuse detection.'
    ]},
    { title: 'Email and communications', paras: [
      'If you contact us by email or bot, we process your message for support and record keeping.',
      'We do not send marketing without consent. You can opt out at any time.'
    ]},
    { title: 'Webhooks and API', paras: [
      'If you use our APIs or webhooks, payloads may be stored temporarily for reliability and replay protection.',
      'Do not include secrets or private keys in requests; use appropriate auth and rotate tokens regularly.'
    ]},
    { title: 'Wallet linking specifics', paras: [
      'We store networks and public addresses to enable features. We never request or store private keys or seed phrases.',
      'Transactions you perform on-chain are public; we may index and annotate them for analytics and reporting.'
    ]},
    { title: 'Execution guardrails', paras: [
      'Where execution or routing is supported, we apply guardrails (limits, risk rules, sanity checks).',
      'These features are tools, not guarantees; you remain responsible for your decisions and compliance.'
    ]},
    { title: 'Research, models, and LLMs', paras: [
      'We may train or evaluate models on aggregated and anonymised data where possible.',
      'If third-party LLMs are used, we avoid sending personal data unless necessary and covered by agreements.'
    ]},
    { title: 'Automated decision-making', paras: [
      'We do not make solely automated decisions with legal or similarly significant effects.',
      'Recommendations and scores are assistive signals; final decisions remain with you.'
    ]},
    { title: 'Pseudonymisation and aggregation', paras: [
      'Where feasible, we hash or aggregate identifiers to reduce privacy risk.',
      'We separate keys from content and apply access controls to link them only when necessary.'
    ]},
    { title: 'Portability and export', paras: [
      'You can request an export of your personal data associated with your account or bot identity.',
      'We will provide it in a commonly used, machine-readable format unless legal limits apply.'
    ]},
    { title: 'How to exercise rights', paras: [
      'Submit requests via email or our feedback bot. We may ask for reasonable verification (e.g., bot message from your account).',
      'We respond within applicable legal deadlines. Some requests may be limited by law or security considerations.'
    ]},
    { title: 'Incidents and breach notification', paras: [
      'We maintain incident response procedures. If a breach occurs, we will notify affected users and authorities as required by law.',
      'We also conduct post-incident reviews and improve controls to prevent recurrence.'
    ]},
    { title: 'Jurisdiction-specific notices', paras: [
      'EEA/UK: GDPR applies where we act as controller for users in these regions.',
      'US: state privacy laws (e.g., CPRA) may give additional rights; we honour valid opt-out signals where feasible.'
    ]},
    { title: 'Do Not Track and GPC', paras: [
      'Browsers may send Do Not Track or Global Privacy Control signals. Where legally required and technically feasible, we respect them.'
    ]},
    { title: 'Opt-out options', paras: [
      'You can disable optional analytics/cookies, unsubscribe from emails, and limit bot permissions.',
      'Core security and essential functionality may still require minimal processing.'
    ]},
    { title: 'Accessibility and language', paras: [
      'We aim to provide clear explanations in multiple languages. If translations differ, the English version may prevail for interpretation.'
    ]},
    { title: 'DPO / privacy contact', paras: [
      'Privacy contact: quantuml7ai@gmail.com (subject: Privacy). We aim to reply within 30 days.'
    ]},
    { title: 'Effective date and versions', paras: [
      'This Policy is effective on the “Updated” date above. Prior versions may be archived for reference.'
    ]},
    { title: 'Appendix: Glossary', paras: [
      'Controller: decides purposes and means of processing. Processor: processes on behalf of controller.',
      'Personal data: information relating to an identified or identifiable person.'
    ]},
    { title: 'Appendix: Subprocessor list (summary)', paras: [
      'Hosting/CDN (e.g., Vercel), object storage, email/Telegram delivery, error tracking, monitoring, basic product analytics.',
      'A detailed up-to-date list is available on request.'
    ]}
  ]
};

/* -------------------- RU -------------------- */
const PRIVACY_RU = {
  nav_privancy: undefined, // guard against typos
  nav_privacy: 'Конфиденциальность',
  privacy_title: 'Конфиденциальность',
  privacy_updated_label: 'Обновлено:',
  privacy_updated: '2025-09-14',
  privacy_empty: 'Нет данных',
  privacy_sections: [
    { title: 'Обзор', paras: [
      'Эта Политика объясняет, какие данные мы собираем, как используем и защищаем на сайте, в Telegram-боте и сервисах.',
      'Пользуясь сервисом, вы соглашаетесь с Политикой. Это продуктовое уведомление, а не юридическая консультация.'
    ]},
    { title: 'Что мы собираем', paras: [
      'Учётные и контактные данные: Telegram ID/username/отображаемое имя; email (если отправляете); сообщения, которые вы нам передаёте.',
      'Привязка кошелька: сети и публичные адреса (никогда не приватные ключи).',
      'Данные использования и устройства: страницы, клики, реферер, хешированный IP, user-agent, временные метки, телеметрия ошибок и производительности.'
    ]},
    { title: 'Ончейн и публичные данные', paras: [
      'Мы анализируем публичные блокчейн- и рыночные данные. Эти источники по своей природе публичны и не являются нашими «персональными данными».',
      'Запросы (например, анализ адреса или символа) могут логироваться для работы сервиса и повышения надёжности.'
    ]},
    { title: 'Cookie и localStorage', paras: [
      'Используем минимально: язык, сессия, анти-абьюз. Блокировка возможна; часть функций может ухудшиться.'
    ]},
    { title: 'Как используем данные', paras: [
      'Предоставление и улучшение исследований и сигналов; роутинг и защищённое исполнение; предотвращение злоупотреблений; поддержка и коммуникации.',
      'Рекламное профилирование не ведём.'
    ]},
    { title: 'Передача третьим лицам', paras: [
      'Мы не продаём персональные данные.',
      'Процессоры: хостинг (например, Vercel), хранение, аналитика (если включена), трекинг ошибок, доставка email/Telegram.',
      'Раскрытие возможно для соблюдения закона или защиты прав.'
    ]},
    { title: 'Безопасность', paras: [
      'Ключи остаются у вас; seed-фразы мы не запрашиваем. Данные шифруются при передаче и хранении; доступ ролевой и логируется.',
      'Мы применяем принцип наименьших привилегий, MFA для критичных систем и контроль изменений при деплоях.'
    ]},
    { title: 'Международные передачи', paras: [
      'Обработка может выполняться за рубежом. При необходимости используются стандартные гарантии (SCC) или иные законные механизмы.'
    ]},
    { title: 'Ваши права', paras: [
      'ЕЭЗ/Великобритания (GDPR): доступ, исправление, удаление, переносимость, ограничение/возражение; право пожаловаться регулятору.',
      'Калифорния (CPRA): доступ, удаление, исправление, отказ от продажи/обмена; отсутствие дискриминации за реализацию прав.'
    ]},
    { title: 'Дети', paras: [
      'Сервис не предназначен для детей младше 13 лет (или более высокого минимума в вашей юрисдикции).'
    ]},
    { title: 'Изменения', paras: [
      'Мы можем обновлять Политику. Изменим дату «Обновлено» и, при необходимости, уведомим в интерфейсе или канале.'
    ]},
    { title: 'Контакты', paras: [
      'Email: quantuml7ai@gmail.com',
      'Бот обратной связи: https://t.me/L7ai_feedback'
    ]},
    { title: 'Определения и область', paras: [
      '«Сервис» — наши сайты, боты, API и связанные приложения. «Мы» — Quantum L7 AI.',
      'Эта Политика охватывает данные, где мы выступаем контролёром. У вендоров и блокчейнов — свои правила.'
    ]},
    { title: 'Правовые основания (GDPR)', paras: [
      'Договор: чтобы предоставлять запрошенные функции (роутинг, исследования, панели).',
      'Законный интерес: надёжность, безопасность, предотвращение абьюза, продуктовая аналитика при минимальном влиянии.',
      'Согласие: опциональная аналитика/маркетинг; вы можете отозвать его в любой момент.',
      'Юр. обязанность: хранение/раскрытие, если этого требует закон.'
    ]},
    { title: 'Хранение данных', paras: [
      'Храним персональные данные столько, сколько нужно для целей обработки или по закону.',
      'Ориентиры: операционные логи 30–180 дней; сообщения поддержки до 12 месяцев; юр. записи — согласно требованиям.'
    ]},
    { title: 'Субпроцессоры', paras: [
      'Категории: хостинг/CDN, объектное хранилище, email/Telegram, мониторинг, трекинг ошибок, базовая аналитика.',
      'С вендорами заключены DPA; периодически оцениваем их меры защиты.'
    ]},
    { title: 'Аналитика и метрики', paras: [
      'Если включено, измеряем агрегированное использование (страницы, производительность, принятие функций).',
      'Аналитика настраивается так, чтобы исключать чувствительные данные и минимизировать персональные.'
    ]},
    { title: 'Логи и телеметрия', paras: [
      'Операционные логи могут включать временные метки, хеш-IP, user-agent, трассировки ошибок, ID запросов.',
      'Логи ротируются, доступны по ролям и используются для отладки, планирования ёмкости и детекта злоупотреблений.'
    ]},
    { title: 'Почта и коммуникации', paras: [
      'Если вы пишете нам на email или в боте, мы обрабатываем сообщение для поддержки и учёта.',
      'Маркетинг без согласия не рассылаем. Можно отписаться в любой момент.'
    ]},
    { title: 'Webhooks и API', paras: [
      'При использовании API/webhook полезные нагрузки могут временно сохраняться для надёжности и защиты от реплеев.',
      'Не передавайте секреты и приватные ключи; применяйте корректную аутентификацию и ротацию токенов.'
    ]},
    { title: 'Привязка кошелька', paras: [
      'Храним сети и публичные адреса для функций. Приватные ключи/seed-фразы не запрашиваем и не храним.',
      'Ваши ончейн-транзакции публичны; мы можем индексировать и аннотировать их для аналитики и отчётности.'
    ]},
    { title: 'Ограничители исполнения', paras: [
      'Когда поддерживается исполнение/роутинг, применяем ограничители (лимиты, правила риска, sanity-checks).',
      'Это инструменты, а не гарантии; ответственность за решения и соблюдение требований лежит на вас.'
    ]},
    { title: 'Исследования, модели и LLM', paras: [
      'Мы можем обучать/оценивать модели на агрегированных и анонимизированных данных, где это возможно.',
      'При использовании сторонних LLM избегаем передачи персональных данных без необходимости и договорных гарантий.'
    ]},
    { title: 'Автоматизированные решения', paras: [
      'Мы не принимаем исключительно автоматизированные решения с юридически значимым эффектом.',
      'Рекомендации/оценки — вспомогательные сигналы; окончательные решения за вами.'
    ]},
    { title: 'Псевдонимизация и агрегация', paras: [
      'Где возможно, хешируем/агрегируем идентификаторы для снижения рисков.',
      'Ключи отделяем от содержимого; доступ к связке — по необходимости и по ролям.'
    ]},
    { title: 'Портируемость и экспорт', paras: [
      'Вы можете запросить экспорт персональных данных, связанных с вашим аккаунтом или бот-идентификатором.',
      'Предоставим в машиночитаемом формате, если нет законных ограничений.'
    ]},
    { title: 'Как реализовать права', paras: [
      'Отправьте запрос на email или в боте. Для верификации можем попросить сообщение из вашего бота-аккаунта.',
      'Отвечаем в сроки закона; некоторые запросы ограничены правовыми и безопасностными требованиями.'
    ]},
    { title: 'Инциденты и уведомления', paras: [
      'У нас есть процедуры реагирования. В случае инцидента уведомим затронутых пользователей и органы, если требуется законом.',
      'Проводим разбор и улучшаем контроль, чтобы предотвратить повторение.'
    ]},
    { title: 'Заметки по юрисдикциям', paras: [
      'ЕЭЗ/UK: применяется GDPR, когда мы контролёр.',
      'США: законы штатов (например, CPRA) могут давать дополнительные права; по возможности учитываем валидные сигналы opt-out.'
    ]},
    { title: 'Do Not Track и GPC', paras: [
      'Браузер может посылать Do Not Track/Global Privacy Control. Где это требуется и возможно — учитываем.'
    ]},
    { title: 'Опции отказа', paras: [
      'Можно отключить опциональную аналитику/cookies, отписаться от писем, ограничить права бота.',
      'Базовая безопасность и функциональность могут требовать минимальной обработки.'
    ]},
    { title: 'Доступность и язык', paras: [
      'Стараемся давать понятные тексты на нескольких языках. При расхождениях для толкования может применяться английская версия.'
    ]},
    { title: 'Контакт по приватности', paras: [
      'Privacy contact: quantuml7ai@gmail.com (тема: Privacy). Цель — ответить в течение 30 дней.'
    ]},
    { title: 'Действие и версии', paras: [
      'Политика действует с даты «Обновлено». Предыдущие версии можем хранить для справки.'
    ]},
    { title: 'Приложение: глоссарий', paras: [
      'Контролёр — определяет цели и средства обработки. Процессор — обрабатывает по поручению контролёра.',
      'Персональные данные — информация об идентифицированном или идентифицируемом лице.'
    ]},
    { title: 'Приложение: список субпроцессоров (кратко)', paras: [
      'Хостинг/CDN (например, Vercel), объектное хранилище, доставка email/Telegram, трекинг ошибок, мониторинг, базовая аналитика.',
      'Подробный актуальный список доступен по запросу.'
    ]}
  ]
};

/* -------------------- ZH (简体) -------------------- */
const PRIVACY_ZH = {
  nav_privacy: '隐私与政策',
  privacy_title: '隐私与政策',
  privacy_updated_label: '更新日期：',
  privacy_updated: '2025-09-14',
  privacy_empty: '无内容',
  privacy_sections: [
    { title: '概述', paras: [
      '本政策说明我们在网站、Telegram 机器人和服务中如何收集、使用和保护数据。',
      '使用服务即表示您同意本政策。本文为产品告知，并非法律意见。'
    ]},
    { title: '我们收集什么', paras: [
      '账户与联系：Telegram ID/用户名/展示名；邮箱（如您提供）；您发送的消息。',
      '钱包绑定：网络与公开地址（绝不收集私钥）。',
      '使用与设备：页面、点击、来源、哈希化 IP、UA、时间戳、错误与性能遥测。'
    ]},
    { title: '链上与公共数据', paras: [
      '我们分析公开的区块链/市场数据；其本身公开，并非我们控制下的个人数据。',
      '请求（如地址/交易对分析）可记录用于运行和提升可靠性。'
    ]},
    { title: 'Cookies 与本地存储', paras: [
      '仅最小化使用：语言、会话、反滥用。可屏蔽，但功能可能受影响。'
    ]},
    { title: '我们如何使用', paras: [
      '提供与改进研究/信号；带护栏的路由与执行；防滥用；支持与沟通。',
      '不进行广告画像。'
    ]},
    { title: '与第三方共享', paras: [
      '不出售个人数据。',
      '处理方：托管（如 Vercel）、存储、分析（如启用）、错误跟踪、邮件/Telegram 投递。',
      '为守法或保护权利时可能披露。'
    ]},
    { title: '安全性', paras: [
      '密钥在您手中；从不索取助记词。数据在传输与存储中加密；按角色控制并记录访问。',
      '对关键系统采用最小权限与多因子认证，并对部署变更进行管控。'
    ]},
    { title: '跨境传输', paras: [
      '处理可能在境外进行；必要时使用标准保障（如 SCC）或其他合法机制。'
    ]},
    { title: '您的权利', paras: [
      'EEA/英国（GDPR）：访问、更正、删除、可携带、限制/反对；可向监管机构投诉。',
      '加州（CPRA）：访问、删除、纠正、退出出售/共享；行使权利不受歧视。'
    ]},
    { title: '儿童', paras: [
      '本服务不针对 13 岁以下儿童（或您所在法域更高的最低年龄）。'
    ]},
    { title: '变更', paras: [
      '我们可能更新本政策；将调整“更新日期”，必要时在应用内或频道通知。'
    ]},
    { title: '联系', paras: [
      '邮箱：quantuml7ai@gmail.com',
      '反馈机器人：https://t.me/L7ai_feedback'
    ]},
    { title: '定义与范围', paras: [
      '“服务”指我们的网站、机器人、API 及相关应用；“我们”指 Quantum L7 AI。',
      '本政策适用于我们作为控制者处理的数据；供应商/区块链网络有其自身政策。'
    ]},
    { title: '法律基础（GDPR）', paras: [
      '合同：提供所需功能（路由、研究、看板）。',
      '合法利益：可靠性、安全、防滥用、最小化的产品分析。',
      '同意：可选分析/营销；可随时撤回。',
      '法律义务：依法保留或披露数据。'
    ]},
    { title: '数据保留', paras: [
      '仅在必要期间保留个人数据，或按法律要求保留。',
      '参考范围：运行日志 30–180 天；支持消息最长 12 个月；法律记录按要求保留。'
    ]},
    { title: '次处理者', paras: [
      '类别：托管/CDN、对象存储、邮件/Telegram 投递、监控、错误跟踪、基础分析。',
      '与可信供应商签订 DPA，并定期评估其保障。'
    ]},
    { title: '分析与度量', paras: [
      '如启用，仅统计聚合使用（页面、性能、功能采用）。',
      '尽量避免敏感数据并最小化个人数据处理。'
    ]},
    { title: '日志与遥测', paras: [
      '运行日志可能含时间戳、哈希 IP、UA、错误追踪、请求标识。',
      '日志轮转、受控访问，用于调试、容量规划与滥用检测。'
    ]},
    { title: '邮件与沟通', paras: [
      '您通过邮件或机器人联系时，我们为支持与记录处理消息。',
      '未经同意不发送营销；可随时退订。'
    ]},
    { title: 'Webhooks 与 API', paras: [
      '使用 API/webhook 时，负载可能暂存以提高可靠性并防重放。',
      '请勿在请求中包含密钥/私钥；正确使用认证并定期轮换令牌。'
    ]},
    { title: '钱包绑定细则', paras: [
      '为提供功能，我们保存网络与公开地址；从不请求/保存私钥或助记词。',
      '链上交易是公开的；我们可能索引并注释用于分析与报表。'
    ]},
    { title: '执行护栏', paras: [
      '如支持执行/路由，我们施加护栏（限额、风险规则、合理性检查）。',
      '这些是工具而非保证；您对决策与合规负责。'
    ]},
    { title: '研究、模型与 LLM', paras: [
      '尽可能使用聚合匿名数据训练/评估模型。',
      '若使用第三方 LLM，避免发送个人数据，除非必要且有协议保障。'
    ]},
    { title: '自动化决策', paras: [
      '我们不进行具有法律或类似重大影响的完全自动化决策。',
      '推荐与评分是辅助信号；最终决策由您作出。'
    ]},
    { title: '去标识与聚合', paras: [
      '在可行时对标识进行哈希或聚合以降低风险。',
      '将键与内容分离，仅在必要时按权限关联。'
    ]},
    { title: '可携带与导出', paras: [
      '您可请求导出与账户或机器人身份关联的个人数据。',
      '我们将以通用机器可读格式提供，除非受法律限制。'
    ]},
    { title: '权利行使方式', paras: [
      '通过邮箱或反馈机器人提交请求；我们可能要求合理校验（如从您账号发送机器人消息）。',
      '在法定期限内答复；某些请求受法律或安全限制。'
    ]},
    { title: '事件与通报', paras: [
      '我们有事故响应流程；若发生泄露，将依法通知受影响用户与监管部门。',
      '同时复盘改进，防止复发。'
    ]},
    { title: '特定法域说明', paras: [
      'EEA/英国：我们作为控制者时适用 GDPR。',
      '美国：州法（如 CPRA）赋予额外权利；在可行时尊重有效的 opt-out 信号。'
    ]},
    { title: 'Do Not Track / GPC', paras: [
      '浏览器可能发送 DNT 或 GPC 信号；在法律要求且技术可行时，我们予以尊重。'
    ]},
    { title: '退出选项', paras: [
      '可禁用可选分析/ cookie、退订邮件、限制机器人权限。',
      '核心安全与必要功能可能仍需最小处理。'
    ]},
    { title: '无障碍与语言', paras: [
      '我们致力于多语言清晰表述；如有差异，以英文版为准。'
    ]},
    { title: '隐私联系人', paras: [
      '隐私联系：quantuml7ai@gmail.com（主题：Privacy）。我们力争 30 天内回复。'
    ]},
    { title: '生效与版本', paras: [
      '本政策自上述“更新日期”起生效；历史版本可存档备查。'
    ]},
    { title: '附录：术语', paras: [
      '控制者：决定处理目的与方式。处理者：代表控制者处理。',
      '个人数据：与已识别或可识别个人相关的信息。'
    ]},
    { title: '附录：次处理者（摘要）', paras: [
      '托管/CDN（如 Vercel）、对象存储、邮件/Telegram 投递、错误跟踪、监控、基础分析。',
      '可应请求提供更新的详细列表。'
    ]}
  ]
};

/* -------------------- UK -------------------- */
const PRIVACY_UK = {
  nav_privacy: 'Конфіденційність',
  privacy_title: 'Конфіденційність',
  privacy_updated_label: 'Оновлено:',
  privacy_updated: '2025-09-14',
  privacy_empty: 'Немає даних',
  privacy_sections: [
    { title: 'Огляд', paras: [
      'Ця Політика пояснює, які дані ми збираємо, як використовуємо та захищаємо на сайті, у Telegram-боті та сервісах.',
      'Користуючись сервісом, ви погоджуєтесь із Політикою. Це продуктове повідомлення, а не юридична порада.'
    ]},
    { title: 'Що збираємо', paras: [
      'Облікові й контактні дані: Telegram ID/username/ім’я відображення; email (якщо надсилаєте); повідомлення, які ви нам надсилаєте.',
      'Прив’язка гаманця: мережі та публічні адреси (ніколи не приватні ключі).',
      'Дані використання та пристрою: сторінки, кліки, реферер, хешований IP, user-agent, часові мітки, телеметрія помилок і продуктивності.'
    ]},
    { title: 'Он-чейн і публічні дані', paras: [
      'Ми аналізуємо публічні блокчейн- та ринкові дані; вони відкриті за своєю природою та не є нашими «персональними даними».',
      'Запити (наприклад, аналітика адрес/символів) можуть логуватися для роботи сервісу та підвищення надійності.'
    ]},
    { title: 'Cookie та localStorage', paras: [
      'Використовуємо мінімально: мова, сесія, анти-аб’юз. Блокування можливе; деякі функції можуть погіршитися.'
    ]},
    { title: 'Як використовуємо дані', paras: [
      'Надання та покращення досліджень і сигналів; роутинг і захищене виконання; запобігання зловживанням; підтримка та комунікація.',
      'Рекламного профілювання не робимо.'
    ]},
    { title: 'Передача третім сторонам', paras: [
      'Ми не продаємо персональні дані.',
      'Процесори: хостинг (напр., Vercel), зберігання, аналітика (якщо увімкнено), відстеження помилок, доставка email/Telegram.',
      'Розкриття можливе для дотримання закону або захисту прав.'
    ]},
    { title: 'Безпека', paras: [
      'Ключі залишаються у вас; seed-фрази не запитуємо. Дані шифруються під час передачі та зберігання; доступ за ролями і логування.',
      'Застосовуємо найменші привілеї, MFA для критичних систем і контроль змін при деплоях.'
    ]},
    { title: 'Міжнародні передачі', paras: [
      'Обробка може виконуватися за кордоном; де це потрібно, використовуємо стандартні гарантії (SCC) або інші законні механізми.'
    ]},
    { title: 'Ваші права', paras: [
      'ЄЕЗ/ВБ (GDPR): доступ, виправлення, видалення, переносимість, обмеження/заперечення; право на скаргу до наглядового органу.',
      'Каліфорнія (CPRA): доступ, видалення, виправлення, відмова від продажу/обміну; відсутність дискримінації.'
    ]},
    { title: 'Діти', paras: [
      'Сервіс не призначено для дітей до 13 років (або вищий мінімальний вік у вашій юрисдикції).'
    ]},
    { title: 'Зміни', paras: [
      'Можемо оновлювати Політику; змінюємо дату «Оновлено» і, за потреби, повідомляємо в застосунку чи каналі.'
    ]},
    { title: 'Контакти', paras: [
      'Email: quantuml7ai@gmail.com',
      'Бот зворотного зв’язку: https://t.me/L7ai_feedback'
    ]},
    { title: 'Визначення та сфера', paras: [
      '«Сервіс» — наші сайти, боти, API та пов’язані застосунки; «ми» — Quantum L7 AI.',
      'Політика охоплює дані, де ми контролер; у вендорів і блокчейнів — власні правила.'
    ]},
    { title: 'Правові підстави (GDPR)', paras: [
      'Договір: надання запитаних функцій (роутинг, дослідження, панелі).',
      'Законний інтерес: надійність, безпека, запобігання зловживанням, мінімальна продуктова аналітика.',
      'Згода: опційна аналітика/маркетинг; можна відкликати будь-коли.',
      'Юридичний обов’язок: зберігання/розкриття за вимогою закону.'
    ]},
    { title: 'Зберігання даних', paras: [
      'Зберігаємо персональні дані стільки, скільки потрібно для зазначених цілей або за вимогою закону.',
      'Орієнтири: операційні логи 30–180 днів; повідомлення підтримки до 12 міс.; юридичні записи — згідно норм.'
    ]},
    { title: 'Субпроцесори', paras: [
      'Категорії: хостинг/CDN, об’єктне сховище, email/Telegram, моніторинг, відстеження помилок, базова аналітика.',
      'DPA із постачальниками; періодична оцінка їхніх заходів безпеки.'
    ]},
    { title: 'Аналітика та метрики', paras: [
      'Якщо увімкнено, вимірюємо агреговане використання (сторінки, продуктивність, прийняття функцій).',
      'Налаштовуємо аналітику так, щоб мінімізувати персональні дані і виключати чутливі.'
    ]},
    { title: 'Логи та телеметрія', paras: [
      'Логи можуть містити мітки часу, хеш-IP, user-agent, трасування помилок, ідентифікатори запитів.',
      'Логи ротуються, доступ контролюється; застосовуються для відладки, планування ємності та виявлення зловживань.'
    ]},
    { title: 'Пошта та комунікації', paras: [
      'Ваші листи/повідомлення обробляємо для підтримки і обліку.',
      'Маркетинг без згоди не надсилаємо; можна відписатися будь-коли.'
    ]},
    { title: 'Webhooks і API', paras: [
      'Під час використання API/webhook навантаження можуть тимчасово зберігатися для надійності та захисту від повторів.',
      'Не передавайте секрети/приватні ключі; використовуйте коректну автентифікацію і ротацію токенів.'
    ]},
    { title: 'Прив’язка гаманця', paras: [
      'Зберігаємо мережі та публічні адреси для функцій. Приватні ключі/seed не запитуємо і не зберігаємо.',
      'Операції он-чейн публічні; можемо індексувати та анотувати їх для аналітики й звітності.'
    ]},
    { title: 'Огрàничувачі виконання', paras: [
      'Якщо підтримується виконання/роутинг, застосовуємо ліміти, правила ризику, перевірки адекватності.',
      'Це інструменти, а не гарантії; відповідальність за рішення — на вас.'
    ]},
    { title: 'Дослідження, моделі та LLM', paras: [
      'Можемо навчати/оцінювати моделі на агрегованих та анонімізованих даних.',
      'За участі сторонніх LLM уникаємо передачі персональних даних без необхідності та договірних гарантій.'
    ]},
    { title: 'Автоматизовані рішення', paras: [
      'Не приймаємо виключно автоматизованих рішень із юридично значним ефектом.',
      'Рекомендації — допоміжні сигнали; фінальні рішення — за вами.'
    ]},
    { title: 'Псевдонімізація і агрегація', paras: [
      'Де можливо, хешуємо/агрегуємо ідентифікатори для зменшення ризиків.',
      'Ключі відокремлюємо від контенту; зв’язування — лише за потреби та за ролями.'
    ]},
    { title: 'Портативність і експорт', paras: [
      'Можна запросити експорт персональних даних, пов’язаних із вашим акаунтом/бот-ідентифікатором.',
      'Надаємо у машинно-читаному форматі, якщо немає правових обмежень.'
    ]},
    { title: 'Як реалізувати права', paras: [
      'Надішліть запит на email або у боті; можемо попросити верифікацію (повідомлення з вашого акаунта).',
      'Відповідаємо у строки закону; деякі запити обмежені правом/безпекою.'
    ]},
    { title: 'Інциденти і повідомлення', paras: [
      'Маємо процедури реагування; про порушення повідомляємо користувачів/органи — якщо цього вимагає закон.',
      'Проводимо розбір і вдосконалюємо контролі.'
    ]},
    { title: 'Примітки для юрисдикцій', paras: [
      'ЄЕЗ/ВБ: застосовується GDPR, коли ми контролер.',
      'США: закони штатів (CPRA тощо) надають додаткові права; враховуємо валідні сигнали відмови, де це можливо.'
    ]},
    { title: 'Do Not Track / GPC', paras: [
      'Повідомлення DNT/GPC враховуємо там, де це вимагає закон і технічно можливо.'
    ]},
    { title: 'Відмова', paras: [
      'Можна вимкнути опційну аналітику/cookies, відписатися від листів, обмежити права бота.',
      'Базова безпека і функціонал можуть потребувати мінімальної обробки.'
    ]},
    { title: 'Доступність і мова', paras: [
      'Надаємо пояснення кількома мовами; у разі розбіжностей для тлумачення може застосовуватись англомовна версія.'
    ]},
    { title: 'Контакт з приватності', paras: [
      'quantuml7ai@gmail.com (тема: Privacy). Мета — відповідь до 30 днів.'
    ]},
    { title: 'Набуття чинності та версії', paras: [
      'Політика чинна з дати «Оновлено»; попередні версії можуть архівуватися для довідки.'
    ]},
    { title: 'Додаток: глосарій', paras: [
      'Контролер — визначає цілі та засоби обробки. Процесор — обробляє від імені контролера.',
      'Персональні дані — інформація про ідентифіковану/ідентифіковану особу.'
    ]},
    { title: 'Додаток: субпроцесори (стисло)', paras: [
      'Хостинг/CDN (напр., Vercel), об’єктне сховище, email/Telegram, трекінг помилок, моніторинг, базова аналітика.',
      'Детальний актуальний перелік — на запит.'
    ]}
  ]
};

/* -------------------- AR (العربية) -------------------- */
const PRIVACY_AR = {
  nav_privacy: 'الخصوصية والسياسة',
  privacy_title: 'الخصوصية والسياسة',
  privacy_updated_label: 'آخر تحديث:',
  privacy_updated: '2025-09-14',
  privacy_empty: 'لا توجد عناصر',
  privacy_sections: [
    { title: 'نظرة عامة', paras: [
      'توضح هذه السياسة ما نجمعه وكيف نستخدمه ونحمي البيانات على الموقع وروبوت تيليجرام وخدماتنا.',
      'باستخدامك للخدمة فأنت توافق على هذه السياسة. هذا إشعار منتج وليس استشارة قانونية.'
    ]},
    { title: 'ما الذي نجمعه', paras: [
      'بيانات الحساب والتواصل: معرّف/اسم مستخدم/اسم العرض في تيليجرام؛ البريد (إن أرسلته)؛ الرسائل التي ترسلها لنا.',
      'ربط المحفظة: الشبكات والعناوين العامة (أبدًا ليست المفاتيح الخاصة).',
      'بيانات الاستخدام والجهاز: الصفحات والنقرات والمرجع وعنوان IP مُجزّأ ووكيل المستخدم والطوابع الزمنية وتتبع الأخطاء والأداء.'
    ]},
    { title: 'بيانات السلسلة والبيانات العامة', paras: [
      'نحلل بيانات بلوك تشين والسوق العامة؛ هذه المصادر عامة بطبيعتها وليست بيانات شخصية تحت سيطرتنا.',
      'قد تُسجَّل الطلبات (مثل تحليل العنوان/الرمز) لتشغيل الخدمة وتحسين الموثوقية.'
    ]},
    { title: 'الكوكيز والتخزين المحلي', paras: [
      'نستخدمها بالحد الأدنى: اللغة والجلسة ومكافحة الإساءة. يمكنك الحظر وقد تتراجع بعض الميزات.'
    ]},
    { title: 'كيف نستخدم البيانات', paras: [
      'تقديم وتحسين الأبحاث والإشارات؛ التوجيه والتنفيذ المحمي؛ منع الإساءة؛ الدعم والتواصل.',
      'لا ننشئ ملفات إعلانية.'
    ]},
    { title: 'المشاركة مع أطراف ثالثة', paras: [
      'لا نبيع البيانات الشخصية.',
      'معالِجون: الاستضافة (مثل Vercel) والتخزين والتحليلات (إن فُعّلت) وتتبع الأخطاء والبريد/تيليجرام.',
      'قد يحدث الإفصاح امتثالًا للقانون أو لحماية الحقوق.'
    ]},
    { title: 'الأمان', paras: [
      'تظل المفاتيح لديك؛ لا نطلب عبارات الاسترداد. البيانات مُشفّرة أثناء النقل والتخزين؛ الوصول مُقيّد بالأدوار ويُسجّل.',
      'نطبق أقل امتياز ممكن وmfa للأنظمة الحرجة وضبط تغييرات النشر.'
    ]},
    { title: 'النقل الدولي', paras: [
      'قد تتم المعالجة خارج البلد؛ نستخدم ضمانات معيارية (SCC) أو آليات قانونية أخرى عند اللزوم.'
    ]},
    { title: 'حقوقك', paras: [
      'EEA/المملكة المتحدة (GDPR): الوصول والتصحيح والحذف وقابلية النقل والاعتراض/التقييد؛ والشكوى للجهة المختصة.',
      'كاليفورنيا (CPRA): الوصول والحذف والتصحيح والانسحاب من البيع/المشاركة؛ دون تمييز.'
    ]},
    { title: 'الأطفال', paras: [
      'الخدمة غير موجهة لمن هم دون 13 عامًا (أو الحد الأدنى الأعلى في نطاقك القضائي).'
    ]},
    { title: 'التغييرات', paras: [
      'قد نحدّث هذه السياسة؛ سنغيّر تاريخ "آخر تحديث" وسنخطرك داخل التطبيق أو عبر القناة عند الاقتضاء.'
    ]},
    { title: 'جهات الاتصال', paras: [
      'البريد: quantuml7ai@gmail.com',
      'بوت الملاحظات: https://t.me/L7ai_feedback'
    ]},
    { title: 'التعريفات والنطاق', paras: [
      'الخدمة تشمل مواقعنا وروبوتاتنا وواجهاتنا البرمجية وتطبيقاتنا؛ "نحن" تعني Quantum L7 AI.',
      'تنطبق هذه السياسة عندما نكون متحكمًا في البيانات. للمورّدين والشبكات قواعدهم الخاصة.'
    ]},
    { title: 'الأسس القانونية (GDPR)', paras: [
      'العقد: لتقديم الميزات المطلوبة (التوجيه، الأبحاث، اللوحات).',
      'المصلحة المشروعة: الموثوقية والأمان ومنع الإساءة وتحليلات المنتج بحد أدنى من التأثير.',
      'الموافقة: التحليلات/التسويق الاختياري؛ يمكنك سحبها في أي وقت.',
      'الالتزام القانوني: الاحتفاظ/الإفصاح وفقًا للقانون.'
    ]},
    { title: 'الاحتفاظ بالبيانات', paras: [
      'نحتفظ بالبيانات الشخصية للمدة اللازمة للأغراض الموضحة أو كما يتطلب القانون.',
      'أمثلة: سجلات التشغيل 30–180 يومًا؛ رسائل الدعم حتى 12 شهرًا؛ السجلات القانونية حسب المتطلبات.'
    ]},
    { title: 'المعالِجون الفرعيون', paras: [
      'الفئات: الاستضافة/CDN، تخزين الكائنات، تسليم البريد/تيليجرام، المراقبة، تتبع الأخطاء، التحليلات الأساسية.',
      'نبرم اتفاقيات معالجة ونراجع الضمانات دوريًا.'
    ]},
    { title: 'التحليلات والقياس', paras: [
      'إن فُعلت، نقيس الاستخدام التجميعي (الصفحات والأداء وتبنّي الميزات).',
      'نضبط التحليلات لتجنّب البيانات الحساسة وتقليل البيانات الشخصية قدر الإمكان.'
    ]},
    { title: 'السجلات والقياس عن بُعد', paras: [
      'قد تتضمن السجلات طوابع زمنية وعنوان IP مُجزّأ ووكيل المستخدم وتتبع الأخطاء ومعرّفات الطلبات.',
      'نُدوّر السجلات ونقيّد الوصول ونستخدمها للتصحيح والتخطيط والحد من الإساءة.'
    ]},
    { title: 'البريد والتواصل', paras: [
      'إذا تواصلت معنا، نعالج رسالتك للدعم والسجلات.',
      'لا نرسل تسويقًا دون موافقة؛ يمكنك الانسحاب في أي وقت.'
    ]},
    { title: 'واجهات API والويب هوكس', paras: [
      'قد تُخزّن الحمولات مؤقتًا للموثوقية ومنع إعادة الإرسال.',
      'لا ترسل الأسرار/المفاتيح الخاصة؛ استخدم اعتمادًا مناسبًا وقم بتدوير الرموز.'
    ]},
    { title: 'ربط المحفظة', paras: [
      'نخزّن الشبكات والعناوين العامة فقط؛ لا نطلب/نخزن مفاتيح خاصة أو عبارات استرداد.',
      'معاملات السلسلة عامة؛ قد نفهرسها ونشرحها للتحليل والتقارير.'
    ]},
    { title: 'ضوابط التنفيذ', paras: [
      'عند دعم التنفيذ/التوجيه نطبق حدودًا وقواعد مخاطر وفحوصات معقولة.',
      'هذه أدوات وليست ضمانات؛ القرار والامتثال مسؤوليتك.'
    ]},
    { title: 'الأبحاث والنماذج وLLM', paras: [
      'قد نُدرّب/نقيّم النماذج على بيانات مجمعة ومجهّلة حيثما أمكن.',
      'إذا استُخدمت LLM خارجية نتجنّب إرسال بيانات شخصية إلا للضرورة وتحت اتفاقيات.'
    ]},
    { title: 'القرارات الآلية', paras: [
      'لا نتخذ قرارات آلية بحتة ذات أثر قانوني أو مماثل.',
      'التوصيات درجات مساعدة؛ القرار النهائي لك.'
    ]},
    { title: 'إخفاء الهوية والتجميع', paras: [
      'نُجزّئ/نُجمّع المعرفات حيثما أمكن لتقليل المخاطر.',
      'نفصل المفاتيح عن المحتوى ونربطهما عند الحاجة فقط وبحسب الأدوار.'
    ]},
    { title: 'قابلية النقل والتصدير', paras: [
      'يمكنك طلب تصدير لبياناتك الشخصية المرتبطة بحسابك/هوية الروبوت.',
      'نقدّمها بصيغة مقروءة آليًا ما لم تمنعنا حدود قانونية.'
    ]},
    { title: 'ممارسة الحقوق', paras: [
      'أرسل طلبك عبر البريد أو بوت الملاحظات؛ قد نطلب تحققًا معقولًا.',
      'نستجيب ضمن المهل القانونية؛ قد تُقيّد بعض الطلبات بالقانون أو الأمن.'
    ]},
    { title: 'الحوادث والإخطار', paras: [
      'لدينا إجراءات للاستجابة للحوادث؛ سنُخطر المتأثرين والجهات المختصة عند اللزوم.',
      'نراجع الحوادث ونعزز الضوابط منعًا للتكرار.'
    ]},
    { title: 'إشعارات قضائية', paras: [
      'EEA/UK: ينطبق GDPR حيث نكون متحكمًا.',
      'الولايات المتحدة: قد تمنح القوانين الحقوق الإضافية (CPRA)؛ نراعي إشارات الانسحاب حيث أمكن.'
    ]},
    { title: 'عدم التتبع وGPC', paras: [
      'نحترم إشارات DNT/GPC حيث يوجب القانون وكان ذلك ممكنًا تقنيًا.'
    ]},
    { title: 'خيارات الانسحاب', paras: [
      'يمكنك تعطيل التحليلات/الكوكيز الاختيارية، وإلغاء الاشتراك من البريد، وتقييد صلاحيات الروبوت.',
      'قد تتطلّب الوظائف الأساسية حدًا أدنى من المعالجة.'
    ]},
    { title: 'إتاحة الوصول واللغة', paras: [
      'نسعى لشرح واضح بلغات متعددة؛ عند التعارض قد تسود النسخة الإنجليزية.'
    ]},
    { title: 'جهة خصوصية', paras: [
      'privacy: quantuml7ai@gmail.com — نحاول الرد خلال 30 يومًا.'
    ]},
    { title: 'سريان السياسة والإصدارات', paras: [
      'تسري من تاريخ "آخر تحديث" أعلاه؛ قد نحتفظ بنُسخ سابقة للرجوع.'
    ]},
    { title: 'ملحق: مصطلحات', paras: [
      'المتحكم: يحدد أغراض ووسائل المعالجة. المعالِج: يعالج نيابة عن المتحكم.',
      'البيانات الشخصية: معلومات تخص شخصًا مُعرّفًا أو قابلًا للتعريف.'
    ]},
    { title: 'ملحق: قائمة المعالِجين الفرعيين (موجز)', paras: [
      'الاستضافة/CDN (مثل Vercel) وتخزين الكائنات وتسليم البريد/تيليجرام وتتبع الأخطاء والمراقبة والتحليلات الأساسية.',
      'قائمة محدثة بالتفصيل متاحة عند الطلب.'
    ]}
  ]
};

/* -------------------- TR (Türkçe) -------------------- */
const PRIVACY_TR = {
  nav_privacy: 'Gizlilik ve Politika',
  privacy_title: 'Gizlilik ve Politika',
  privacy_updated_label: 'Güncelleme:',
  privacy_updated: '2025-09-14',
  privacy_empty: 'Kayıt yok',
  privacy_sections: [
    { title: 'Genel bakış', paras: [
      'Bu politika; web sitesi, Telegram botu ve hizmetlerde hangi verileri topladığımızı, nasıl kullandığımızı ve nasıl koruduğumuzu açıklar.',
      'Hizmeti kullanarak bu Politikayı kabul etmiş olursunuz. Bu bir ürün bildirimi olup hukuki danışmanlık değildir.'
    ]},
    { title: 'Topladıklarımız', paras: [
      'Hesap ve iletişim: Telegram ID/kullanıcı adı/görünen ad; e-posta (gönderirseniz); bize gönderdiğiniz mesajlar.',
      'Cüzdan bağlantısı: ağlar ve herkese açık adresler (özel anahtar asla).',
      'Kullanım ve cihaz: sayfalar, tıklamalar, yönlendiren, karma IP, user-agent, zaman damgaları, hata ve performans telemetrisi.'
    ]},
    { title: 'Zincir üstü ve açık veriler', paras: [
      'Herkese açık blokzincir/piyasa verilerini analiz ederiz; doğası gereği açıktır ve kontrolümüzdeki kişisel veri değildir.',
      'İstekler (örn. adres/sembol analizi) hizmetin işletimi ve güvenilirliği için günlüğe alınabilir.'
    ]},
    { title: 'Çerezler ve localStorage', paras: [
      'Asgari düzeyde kullanırız: dil, oturum, kötüye kullanım önleme. Engelleyebilirsiniz; bazı işlevler zayıflayabilir.'
    ]},
    { title: 'Veriyi nasıl kullanırız', paras: [
      'Araştırma/sinyalleri sağlamak ve iyileştirmek; korumalı yönlendirme/yürütme; kötüye kullanımı önleme; destek ve iletişim.',
      'Reklam profillemesi yapmayız.'
    ]},
    { title: 'Üçüncü taraflarla paylaşım', paras: [
      'Kişisel veri satmayız.',
      'Veri işleyenler: barındırma (örn. Vercel), depolama, analiz (etkinse), hata izleme, e-posta/Telegram teslimi.',
      'Yasa gereği veya hakları korumak için açıklama olabilir.'
    ]},
    { title: 'Güvenlik', paras: [
      'Anahtarlar sizdedir; seed phrase istemeyiz. Veri aktarım ve depolamada şifrelenir; erişim role dayalıdır ve kayda alınır.',
      'Kritik sistemlerde en az ayrıcalık ve MFA uygular, dağıtımlarda değişiklik kontrolü yaparız.'
    ]},
    { title: 'Uluslararası aktarımlar', paras: [
      'İşleme yurt dışında olabilir; gerektiğinde standart güvenceler (SCC) veya diğer yasal mekanizmalar kullanılır.'
    ]},
    { title: 'Haklarınız', paras: [
      'AEA/UK (GDPR): erişim, düzeltme, silme, taşınabilirlik, kısıtlama/itiraz; denetleyici kuruma şikâyet hakkı.',
      'Kaliforniya (CPRA): erişim, silme, düzeltme, satış/paylaşımdan vazgeçme; hak kullanımında ayrımcılık yok.'
    ]},
    { title: 'Çocuklar', paras: [
      'Hizmet 13 yaş altına (veya yargı bölgenizdeki daha yüksek yaş) yönelik değildir.'
    ]},
    { title: 'Değişiklikler', paras: [
      'Politikayı güncelleyebiliriz; “Güncelleme” tarihini değiştirir ve gerektiğinde uygulama içi/kanal bildirimi yaparız.'
    ]},
    { title: 'İletişim', paras: [
      'E-posta: quantuml7ai@gmail.com',
      'Geri bildirim botu: https://t.me/L7ai_feedback'
    ]},
    { title: 'Tanımlar ve kapsam', paras: [
      '“Hizmet” web siteleri, botlar, API’ler ve ilgili uygulamalardır; “biz” Quantum L7 AI’dır.',
      'Bu politika, denetleyici olduğumuz veriyi kapsar. Sağlayıcıların ve blokzincirlerin kendi kuralları vardır.'
    ]},
    { title: 'Hukuki dayanaklar (GDPR)', paras: [
      'Sözleşme: talep edilen özellikleri sağlamak (yönlendirme, araştırma, paneller).',
      'Meşru menfaat: güvenilirlik, güvenlik, kötüye kullanım önleme, asgari ürün analitiği.',
      'Açık rıza: isteğe bağlı analitik/pazarlama; istediğiniz an geri çekebilirsiniz.',
      'Yasal yükümlülük: veriyi saklama/açıklama.'
    ]},
    { title: 'Saklama', paras: [
      'Kişisel verileri amaçlar için gerekli olduğu sürece veya yasa gerektirdiği kadar saklarız.',
      'Örnekler: operasyonel günlükler 30–180 gün; destek mesajları 12 aya kadar; yasal kayıtlar mevzuata göre.'
    ]},
    { title: 'Alt işleyiciler', paras: [
      'Kategoriler: barındırma/CDN, nesne depolama, e-posta/Telegram teslimi, izleme, hata takibi, temel analitik.',
      'DPA imzalar ve güvenlik önlemlerini periyodik inceleriz.'
    ]},
    { title: 'Analitik ve metrikler', paras: [
      'Etkinse, toplu kullanımı ölçeriz (sayfalar, performans, özellik benimseme).',
      'Duyarlı verileri hariç tutar, kişisel veriyi asgari düzeye indiririz.'
    ]},
    { title: 'Günlükler ve telemetri', paras: [
      'Günlükler zaman damgaları, karma IP, user-agent, hata izleri ve istek kimlikleri içerebilir.',
      'Döndürülür, erişimi kontrol edilir ve hata ayıklama/kapasite planlama/kötüye kullanım tespiti için kullanılır.'
    ]},
    { title: 'E-posta ve iletişim', paras: [
      'E-posta veya bot üzerinden destek amaçlı mesajlarınızı işleriz.',
      'Onay olmadan pazarlama göndermeyiz; istediğiniz an vazgeçebilirsiniz.'
    ]},
    { title: 'Webhooks ve API', paras: [
      'API/webhook yükleri güvenilirlik için geçici olarak saklanabilir.',
      'İsteklere sır/özel anahtar koymayın; doğru kimlik doğrulama ve token rotasyonu kullanın.'
    ]},
    { title: 'Cüzdan bağlantısı', paras: [
      'Ağlar ve açık adresleri saklarız; özel anahtar/seed talep etmeyiz.',
      'Zincir üstü işlemler açıktır; analiz ve raporlama için indeksleyebiliriz.'
    ]},
    { title: 'Yürütme korumaları', paras: [
      'Destekleniyorsa limitler, risk kuralları ve mantık kontrolleri uygularız.',
      'Bunlar araçtır, garanti değildir; karar ve uyum sorumluluğu sizdedir.'
    ]},
    { title: 'Araştırma, modeller ve LLM', paras: [
      'Mümkün olduğunda toplu/anonim verilerle modelleri eğitir/değerlendiririz.',
      'Üçüncü taraf LLM kullanıldığında kişisel veri göndermekten kaçınırız; sözleşmesel korumalar uygularız.'
    ]},
    { title: 'Otomatik kararlar', paras: [
      'Hukuki veya benzer önemli etkileri olan salt otomatik kararlar vermeyiz.',
      'Öneriler yardımcı sinyallerdir; son karar sizindir.'
    ]},
    { title: 'Takma ad ve toplulaştırma', paras: [
      'Mümkün olduğunda tanımlayıcıları karma/toplu hâle getiririz.',
      'Anahtarları içerikten ayırır, gerekli olduğunda rollere göre ilişkilendiririz.'
    ]},
    { title: 'Taşınabilirlik ve dışa aktarma', paras: [
      'Hesabınız/bot kimliğinizle ilişkili kişisel verinizin dışa aktarımını talep edebilirsiniz.',
      'Yasal kısıtlar yoksa yaygın makinece okunur bir biçimde sağlarız.'
    ]},
    { title: 'Hakların kullanımı', paras: [
      'E-posta veya geri bildirim botu ile başvurun; makul doğrulama isteyebiliriz.',
      'Yasal sürelerde yanıt veririz; bazı talepler hukuk/güvenlik nedeniyle kısıtlanabilir.'
    ]},
    { title: 'Olaylar ve ihbar', paras: [
      'Olay müdahale süreçlerimiz vardır; ihlal olursa yasaya göre kullanıcıları/otoriteleri bilgilendiririz.',
      'Tekrarı önlemek için gözden geçirme ve iyileştirme yaparız.'
    ]},
    { title: 'Yargı notları', paras: [
      'AEA/UK: kontrolör olduğumuz yerde GDPR geçerlidir.',
      'ABD: eyalet yasaları (CPRA vb.) ek haklar sağlar; mümkünse geçerli vazgeçme sinyallerine uyarız.'
    ]},
    { title: 'DNT ve GPC', paras: [
      'Gerektiğinde ve teknik olarak mümkünse Do Not Track/Global Privacy Control sinyallerine saygı duyarız.'
    ]},
    { title: 'Vazgeçme seçenekleri', paras: [
      'İsteğe bağlı analitik/cookie’leri kapatabilir, e-postadan çıkabilir, bot izinlerini kısıtlayabilirsiniz.',
      'Temel güvenlik ve işlevsellik asgari işlem gerektirebilir.'
    ]},
    { title: 'Erişilebilirlik ve dil', paras: [
      'Birden fazla dilde açık metin sunmaya çalışırız; yorumda fark olursa İngilizce sürüm geçerli olabilir.'
    ]},
    { title: 'Gizlilik irtibatı', paras: [
      'quantuml7ai@gmail.com (konu: Privacy) — hedef: 30 gün içinde yanıt.'
    ]},
    { title: 'Yürürlük ve sürümler', paras: [
      'Bu politika yukarıdaki tarihten itibaren yürürlüktedir; önceki sürümler referans için saklanabilir.'
    ]},
    { title: 'Ek: Sözlük', paras: [
      'Denetleyici: işleme amaç ve araçlarını belirler. İşleyen: denetleyici adına işler.',
      'Kişisel veri: kimliği belirli veya belirlenebilir kişiye ilişkin bilgi.'
    ]},
    { title: 'Ek: Alt işleyiciler (özet)', paras: [
      'Barındırma/CDN (örn. Vercel), nesne depolama, e-posta/Telegram teslimi, hata takibi, izleme, temel analitik.',
      'Güncel ayrıntılı liste talep üzerine sunulur.'
    ]}
  ]
};
/* -------------------- ES -------------------- */
const PRIVACY_ES = {
  nav_privancy: undefined, // guard against typos
  nav_privacy: 'Privacidad y política',
  privacy_title: 'Privacidad y política',
  privacy_updated_label: 'Actualizado:',
  privacy_updated: '2025-09-14',
  privacy_empty: 'Sin datos',
  privacy_sections: [
    { title: 'Resumen', paras: [
      'Esta Política explica qué datos recopilamos, cómo los usamos y cómo los protegemos en el sitio web, en el bot de Telegram y en los servicios.',
      'Al utilizar el servicio, aceptas esta Política. Es un aviso de producto para ayudarte a entender el uso de datos; no constituye asesoría legal.'
    ]},
    { title: 'Qué recopilamos', paras: [
      'Datos de cuenta y de contacto: ID/username de Telegram/nombre mostrado; correo electrónico (si lo envías); mensajes que nos compartes.',
      'Vinculación de monedero: redes y direcciones públicas (nunca claves privadas).',
      'Datos de uso y del dispositivo: páginas, clics, referente, IP con hash, user-agent, marcas de tiempo, telemetría de errores y rendimiento.'
    ]},
    { title: 'Datos on-chain y públicos', paras: [
      'Analizamos datos públicos de blockchain y de mercado. Por su naturaleza, esos datos ya son públicos y no constituyen “datos personales” bajo nuestro control.',
      'Las consultas (por ejemplo, análisis de dirección o de símbolo) pueden registrarse para operar el servicio y mejorar su fiabilidad.'
    ]},
    { title: 'Cookies y almacenamiento local', paras: [
      'Uso mínimo: idioma, sesión y anti-abuso. Puedes bloquearlas; algunas funciones pueden degradarse.'
    ]},
    { title: 'Cómo usamos los datos', paras: [
      'Prestación y mejora de investigación y señales; ruteo y ejecución protegida; prevención de abusos; soporte y comunicaciones.',
      'No realizamos perfilado publicitario.'
    ]},
    { title: 'Cesión a terceros', paras: [
      'No vendemos datos personales.',
      'Encargados del tratamiento: hosting (p. ej., Vercel), almacenamiento, analítica (si está habilitada), seguimiento de errores, entrega de email/Telegram.',
      'Podemos revelar datos para cumplir la ley o para proteger derechos.'
    ]},
    { title: 'Seguridad', paras: [
      'Las claves permanecen contigo; nunca solicitamos frases semilla. Los datos se cifran en tránsito y en reposo; el acceso es por roles y se registra.',
      'Aplicamos principio de mínimo privilegio, MFA en sistemas críticos y control de cambios en los despliegues.'
    ]},
    { title: 'Transferencias internacionales', paras: [
      'El tratamiento puede realizarse en el extranjero. Cuando es necesario, aplicamos garantías estándar (SCC) u otros mecanismos legales.'
    ]},
    { title: 'Tus derechos', paras: [
      'EEE/Reino Unido (RGPD): acceso, rectificación, supresión, portabilidad, restricción/oposición; derecho a reclamar ante la autoridad supervisora.',
      'California (CPRA): acceso, eliminación, rectificación, opción de no “vender” o “compartir”; sin discriminación por ejercer tus derechos.'
    ]},
    { title: 'Menores', paras: [
      'El servicio no está destinado a menores de 13 años (o a la edad mínima superior de tu jurisdicción).'
    ]},
    { title: 'Cambios', paras: [
      'Podemos actualizar esta Política. Cambiaremos la fecha de “Actualizado” y, cuando sea necesario, avisaremos en la interfaz o en el canal.'
    ]},
    { title: 'Contacto', paras: [
      'Email: quantuml7ai@gmail.com',
      'Bot de feedback: https://t.me/L7ai_feedback'
    ]},
    { title: 'Definiciones y alcance', paras: [
      '“Servicio”: nuestros sitios, bots, API y apps relacionadas. “Nosotros”: Quantum L7 AI.',
      'Esta Política cubre los datos para los que actuamos como responsables del tratamiento. Los proveedores y las blockchains tienen sus propias reglas.'
    ]},
    { title: 'Bases legales (RGPD)', paras: [
      'Contrato: para prestar las funciones solicitadas (ruteo, investigación, paneles).',
      'Interés legítimo: fiabilidad, seguridad, prevención de abusos, analítica de producto con impacto mínimo.',
      'Consentimiento: analítica/marketing opcional; puedes retirarlo en cualquier momento.',
      'Obligación legal: conservación/divulgación cuando lo exija la ley.'
    ]},
    { title: 'Conservación de datos', paras: [
      'Conservamos los datos personales durante el tiempo necesario para los fines del tratamiento o por exigencias legales.',
      'Guías: logs operativos 30–180 días; mensajes de soporte hasta 12 meses; registros legales según los requisitos.'
    ]},
    { title: 'Encargados/Subencargados', paras: [
      'Categorías: hosting/CDN, almacenamiento de objetos, email/Telegram, monitorización, seguimiento de errores, analítica básica.',
      'Tenemos DPAs con los proveedores; evaluamos periódicamente sus medidas de seguridad.'
    ]},
    { title: 'Analítica y métricas', paras: [
      'Si está habilitada, medimos uso agregado (páginas, rendimiento, adopción de funciones).',
      'Configuramos la analítica para excluir datos sensibles y minimizar los personales.'
    ]},
    { title: 'Registros y telemetría', paras: [
      'Los registros operativos pueden incluir marcas de tiempo, IP con hash, user-agent, trazas de errores e IDs de solicitud.',
      'Los logs se rotan, se accede a ellos por rol y se usan para depuración, planificación de capacidad y detección de abusos.'
    ]},
    { title: 'Correo y comunicaciones', paras: [
      'Si nos escribes por email o en el bot, procesamos el mensaje para soporte y seguimiento.',
      'No enviamos marketing sin consentimiento. Puedes darte de baja en cualquier momento.'
    ]},
    { title: 'Webhooks y API', paras: [
      'Al usar API/webhooks, las cargas útiles pueden conservarse temporalmente para fiabilidad y protección contra repeticiones.',
      'No envíes secretos ni claves privadas; usa autenticación adecuada y rotación de tokens.'
    ]},
    { title: 'Vinculación de monedero', paras: [
      'Almacenamos redes y direcciones públicas para las funciones. No solicitamos ni almacenamos claves privadas o frases semilla.',
      'Tus transacciones on-chain son públicas; podemos indexarlas y anotarlas para analítica e informes.'
    ]},
    { title: 'Guardarraíles de ejecución', paras: [
      'Cuando hay ejecución/ruteo, aplicamos guardarraíles (límites, reglas de riesgo, comprobaciones de cordura).',
      'Son herramientas, no garantías; la responsabilidad sobre decisiones y cumplimiento es tuya.'
    ]},
    { title: 'Investigación, modelos y LLM', paras: [
      'Podemos entrenar/evaluar modelos con datos agregados y anonimizados cuando sea posible.',
      'Al usar LLM de terceros, evitamos enviar datos personales sin necesidad y sin garantías contractuales.'
    ]},
    { title: 'Decisiones automatizadas', paras: [
      'No adoptamos decisiones exclusivamente automatizadas con efecto jurídico significativo.',
      'Las recomendaciones/valoraciones son señales de apoyo; las decisiones finales son tuyas.'
    ]},
    { title: 'Seudonimización y agregación', paras: [
      'Cuando es posible, aplicamos hash/aggregación de identificadores para reducir riesgos.',
      'Separamos claves de contenido; el acceso al vínculo está limitado por necesidad y por rol.'
    ]},
    { title: 'Portabilidad y exportación', paras: [
      'Puedes solicitar la exportación de los datos personales vinculados a tu cuenta o identificador del bot.',
      'Los proporcionaremos en formato legible por máquina, salvo restricciones legales.'
    ]},
    { title: 'Cómo ejercer tus derechos', paras: [
      'Envía una solicitud por email o en el bot. Para verificar, podemos pedirte un mensaje desde tu cuenta del bot.',
      'Respondemos en los plazos legales; algunas solicitudes están limitadas por requisitos legales y de seguridad.'
    ]},
    { title: 'Incidentes y notificaciones', paras: [
      'Contamos con procedimientos de respuesta. Si ocurre un incidente, notificaremos a los usuarios afectados y a las autoridades cuando lo exija la ley.',
      'Realizamos análisis posterior y mejoramos controles para evitar recurrencias.'
    ]},
    { title: 'Notas por jurisdicción', paras: [
      'EEE/Reino Unido: aplica el RGPD cuando actuamos como responsables.',
      'EE. UU.: las leyes estatales (por ejemplo, CPRA) pueden otorgar derechos adicionales; cuando sea posible, respetamos señales de exclusión válidas.'
    ]},
    { title: 'Do Not Track y GPC', paras: [
      'El navegador puede enviar Do Not Track/Global Privacy Control. Donde se requiera y sea posible, los respetamos.'
    ]},
    { title: 'Opciones de exclusión', paras: [
      'Puedes desactivar la analítica/cookies opcionales, darte de baja de correos y limitar permisos del bot.',
      'La seguridad y la funcionalidad básicas pueden requerir un tratamiento mínimo.'
    ]},
    { title: 'Accesibilidad e idioma', paras: [
      'Procuramos textos claros en varios idiomas. En caso de discrepancia, la versión en inglés puede prevalecer para interpretación.'
    ]},
    { title: 'Contacto de privacidad', paras: [
      'Contacto de privacidad: quantuml7ai@gmail.com (asunto: Privacy). Objetivo: responder en 30 días.'
    ]},
    { title: 'Vigencia y versiones', paras: [
      'La Política rige desde la fecha “Actualizado”. Podemos conservar versiones previas para referencia.'
    ]},
    { title: 'Anexo: Glosario', paras: [
      'Responsable: determina fines y medios del tratamiento. Encargado: trata datos por cuenta del responsable.',
      'Datos personales: información sobre una persona identificada o identificable.'
    ]},
    { title: 'Anexo: Lista abreviada de encargados', paras: [
      'Hosting/CDN (p. ej., Vercel), almacenamiento de objetos, entrega de email/Telegram, seguimiento de errores, monitorización, analítica básica.',
      'La lista actualizada y detallada está disponible bajo solicitud.'
    ]}
  ]
};


// Применяем патч без ломки существующего словаря:
try {
  Object.assign(dict.en, PRIVACY_EN)
  Object.assign(dict.ru, PRIVACY_RU)
  Object.assign(dict.zh, PRIVACY_ZH)
  Object.assign(dict.uk, PRIVACY_UK)
  Object.assign(dict.ar, PRIVACY_AR)
  Object.assign(dict.tr, PRIVACY_TR)
  Object.assign(dict.es, PRIVACY_ES)
} catch (e) {
  // Если переменная dict называется иначе — поправьте имя ниже под ваш файл.
  console.warn('Privacy patch: please make sure the root dictionary is named "dict".')
}
/* ===== END OF PRIVACY PATCH ===== */
const I18nContext = createContext({ t: (k) => k, lang: 'en', setLang: () => {} })
// ===== Subscribe page dictionary (7 langs) — MARKETING EDITION =====
const SUBSCRIBE_EN = {
  sub_title: 'Subscribe',
  sub_intro:
    'Activate your edge. Connect your wallet to unlock live trading intelligence, effortless automation, and a clear roadmap to disciplined decisions. Choose your pace — explore with Free, accelerate with PRO, or dominate with VIP.',
  sub_wallet_cta: 'Connect Wallet',
  sub_wallet_cta_note: 'Connect your wallet to activate your plan.',
  sub_plans_title: 'Plans',
  sub_free_title: 'FREE — explore & feel the flow',
  sub_free_desc: `
    • 3-day access to experience the platform without commitments.<br/>
    • 1 manual “Signal Now” per day to feel the timing and rhythm.<br/>
    • See how ideas are framed into simple, actionable cards.<br/>
    • Perfect for first touch: interface, language, and overall vibe.<br/>
    • Upgrade anytime — your journey is entirely in your hands.<br/>
  `,
  sub_pro_title: 'PRO — pace, clarity, control',
  sub_pro_price: 'Price: 10 USDT / week',
  sub_pro_desc: `
    • Daily flow tuned for intraday decisions without noise overload.<br/>
    • Structured rhythm to plan entries, manage risk, and review outcomes.<br/>
    • Sharper context around market sessions and momentum shifts.<br/>
    • Flexible enough for workday trading or evening sessions.<br/>
    • Priority assistance when you need a human touch.<br/>
    • Upgrade/extend anytime — your time never goes to waste.<br/>
  `,
  sub_vip_title: 'VIP — full frequency, full focus',
  sub_vip_price: 'Price: 30 USDT / week',
  sub_vip_desc: `
    • Maximum cadence for traders who live the market clock.<br/>
    • Early access to premium tools and exclusive reports.<br/>
    • Deep coverage across assets — ready when opportunities pop.<br/>
    • Personal-feel feedback channel for fast iteration of ideas.<br/>
    • Recognition inside the platform — the VIP mark speaks for itself.<br/>
    • Designed for speed, precision, and decisive execution.<br/>
  `,
  sub_benefits_title: 'Why traders choose us',
  sub_benefits: [
    'Actionable signal cards distilled from complex data — no clutter.',
    'Clear timing windows so you act with purpose, not panic.',
    'Consistent multi-language interface — switch, don’t stumble.',
    'Frictionless plan upgrades and extensions when momentum is on your side.',
    'Weekly highlights that cut through noise and keep you on track.',
    'A community mindset: we grow together, one decision at a time.',
  ],
  sub_payments_title: 'Start in minutes',
  sub_payments: [
    'Pick a plan, connect your wallet, confirm — and you’re in.',
    'Pay in popular assets you already use across major networks.',
    'Your access updates instantly once payment is confirmed.',
    'No manual addresses, no screenshots, no back-and-forth.',
  ],
  sub_legal_note:
    'All information is educational and analytical — not financial advice. Trading involves risk. Stay disciplined with position sizing and protective stops.',
  sub_faq_title: 'FAQ',
  sub_faq: [
    { q: 'What makes Free valuable?', a: 'It lets you test the rhythm and flow risk-free for 3 days — perfect to learn how the interface and signal cards fit your style.' },
    { q: 'Who is PRO for?', a: 'Intraday traders who want pace and clarity without overload — structured timing, clean context, and room to execute.' },
    { q: 'Who is VIP for?', a: 'Active pros who need maximum cadence, early access to premium content, and the fastest turnaround on insights.' },
    { q: 'Can I switch plans later?', a: 'Yes. You can upgrade or extend anytime — your remaining time carries over with no friction.' },
    { q: 'How fast do I start?', a: 'Right after your payment is confirmed — your access switches on instantly.' },
  ],
}

const SUBSCRIBE_RU = {
  sub_title: 'Подписка',
  sub_intro:
    'Активируйте преимущество. Подключите кошелёк — и откройте доступ к живой рыночной аналитике, аккуратной автоматике и понятной дисциплине решений. Выбирайте темп: познакомиться на Free, ускориться на PRO, доминировать на VIP.',
  sub_wallet_cta: 'Подключить кошелёк',
  sub_wallet_cta_note: 'Подключите кошелёк, чтобы активировать план.',
  sub_plans_title: 'Тарифы',
  sub_free_title: 'FREE — узнать и прочувствовать',
  sub_free_desc: `
    • 3 дня, чтобы спокойно освоиться без обязательств.<br/>
    • 1 ручной «Сигнал сейчас» в день — почувствовать ритм и тайминг.<br/>
    • Идеи — в виде понятных карточек, без информационного шума.<br/>
    • Отлично для первого касания: интерфейс, язык, общий вайб.<br/>
    • Переход на платный — когда захотите, без давления.<br/>
  `,
  sub_pro_title: 'PRO — темп, ясность, контроль',
  sub_pro_price: 'Цена: 10 USDT / неделя',
  sub_pro_desc: `
    • Ежедневный ритм для внутридневных решений без перегруза.<br/>
    • Структура, которая помогает планировать входы и управлять риском.<br/>
    • Больше контекста по сессиям и сменам импульса.<br/>
    • Гибко сочетается с рабочим днём или вечерней торговлей.<br/>
    • Приоритетная помощь там, где важно участие человека.<br/>
    • Апгрейд/продление в любой момент — время не пропадает.<br/>
  `,
  sub_vip_title: 'VIP — максимальная частота, максимальный фокус',
  sub_vip_price: 'Цена: 30 USDT / неделя',
  sub_vip_desc: `
    • Максимальный темп для тех, кто живёт по рыночным часам.<br/>
    • Ранний доступ к премиум-материалам и эксклюзивным отчётам.<br/>
    • Глубокое покрытие активов — готовность к моменту «сейчас».<br/>
    • Быстрый канал обратной связи для ускорения идей.<br/>
    • Узнаваемость в платформе — знак VIP говорит сам за себя.<br/>
    • Для скорости, точности и уверенного исполнения.<br/>
  `,
  sub_benefits_title: 'Почему выбирают нас',
  sub_benefits: [
    'Карточки сигналов: суть из сложных данных — без визуального мусора.',
    'Понятные окна времени: действуете осознанно, а не в панике.',
    'Единый интерфейс на 7 языках — переключайтесь, не спотыкаясь.',
    'Планы масштабируются: апгрейд и продление без трения.',
    'Еженедельные выжимки, которые ведут, а не отвлекают.',
    'Комьюнити-подход: растём вместе, решение за решением.',
  ],
  sub_payments_title: 'Старт за минуты',
  sub_payments: [
    'Выберите план, подключите кошелёк, подтвердите — и вы в деле.',
    'Оплачивайте популярными активами в привычных сетях.',
    'Доступ включается сразу после подтверждения платежа.',
    'Без ручных адресов, скриншотов и долгой переписки.',
  ],
  sub_legal_note:
    'Вся информация — образовательная и аналитическая, не финсовет. Торговля связана с риском. Дисциплина, размер позиции и защитные стопы — обязательны.',
  sub_faq_title: 'FAQ',
  sub_faq: [
    { q: 'Зачем Free?', a: '3 дня, чтобы безопасно прочувствовать ритм: интерфейс, карточки, подача — поймёте, как это ложится на ваш стиль.' },
    { q: 'Кому подойдёт PRO?', a: 'Тем, кто торгует внутри дня и ценит темп без перегруза: структурированный тайминг и чистый контекст.' },
    { q: 'Кому нужен VIP?', a: 'Активным профи, кому важна максимальная частота, премиум-контент и быстрый цикл обратной связи.' },
    { q: 'Можно менять план?', a: 'Да, апгрейд и продление доступны в любой момент; остаток времени сохраняется.' },
    { q: 'Когда начинается доступ?', a: 'Сразу после подтверждения платежа — без задержек и лишних действий.' },
  ],
}

const SUBSCRIBE_UK = {
  sub_title: 'Підписка',
  sub_intro:
    'Увімкніть перевагу. Під’єднайте гаманець — і відкрийте живу аналітику, легку автоматизацію та дисципліну рішень. Оберіть темп: познайомтеся на Free, пришвидшіть PRO або домінуйте з VIP.',
  sub_wallet_cta: 'Під’єднати гаманець',
  sub_wallet_cta_note: 'Під’єднайте гаманець, щоб активувати план.',
  sub_plans_title: 'Тарифи',
  sub_free_title: 'FREE — відчути ритм',
  sub_free_desc: `
    • 3 дні, щоб спокійно спробувати без зобов’язань.<br/>
    • 1 ручний «Сигнал зараз» на добу — відчути таймінг і подачу.<br/>
    • Ідеї у вигляді зрозумілих карток без зайвого шуму.<br/>
    • Чудово для першого знайомства: інтерфейс, мова, стиль.<br/>
    • Переходьте на платний у будь-який момент — все під контролем.<br/>
  `,
  sub_pro_title: 'PRO — темп і ясність',
  sub_pro_price: 'Ціна: 10 USDT / тиждень',
  sub_pro_desc: `
    • Щоденний ритм для інтрадей-рішень без перевантаження.<br/>
    • Структура для планування входів і керування ризиком.<br/>
    • Більше контексту щодо сесій та імпульсів ринку.<br/>
    • Гнучко поєднується з роботою або вечірньою торгівлею.<br/>
    • Пріоритетна допомога, коли важлива увага людини.<br/>
    • Апгрейд/продовження будь-коли — час не зникає.<br/>
  `,
  sub_vip_title: 'VIP — максимальна частота',
  sub_vip_price: 'Ціна: 30 USDT / тиждень',
  sub_vip_desc: `
    • Найвищий темп для тих, хто живе ринковим годинником.<br/>
    • Перший доступ до преміум-матеріалів та ексклюзивних оглядів.<br/>
    • Глибоке покриття активів — готовність до моменту «зараз».<br/>
    • Швидкий фідбек-канал для ідей і покращень.<br/>
    • Відзнака всередині платформи — статус VIP говорить сам за себе.<br/>
    • Для швидкості, точності та впевненого виконання.<br/>
  `,
  sub_benefits_title: 'Чому нас обирають',
  sub_benefits: [
    'Зрозумілі картки сигналів — суть без зайвого інформаційного шуму.',
    'Чіткі часові вікна — дієте усвідомлено, а не в паніці.',
    'Єдиний інтерфейс 7 мовами — перемикайтесь без бар’єрів.',
    'Гнучкі плани та просте продовження — коли є імпульс, не гальмуйте.',
    'Щотижневі вижимки — тримають у фокусі важливе.',
    'Мислення спільноти: зростаємо разом, рішення за рішенням.',
  ],
  sub_payments_title: 'Почніть за кілька хвилин',
  sub_payments: [
    'Обирайте план, під’єднуйте гаманець, підтверджуйте — і вперед.',
    'Оплачуйте популярними активами у звичних мережах.',
    'Доступ вмикається одразу після підтвердження платежу.',
    'Без ручних адрес і зайвої бюрократії.',
  ],
  sub_legal_note:
    'Інформація має освітній та аналітичний характер і не є фінансовою порадою. Торгівля ризикована — використовуйте розмір позиції та захисні стопи.',
  sub_faq_title: 'FAQ',
  sub_faq: [
    { q: 'Навіщо Free?', a: '3 дні, щоб відчути ритм і стиль подачі — безкоштовно і без зобов’язань.' },
    { q: 'Кому підійде PRO?', a: 'Тим, хто торгує всередині дня і цінує темп та ясність без зайвого шуму.' },
    { q: 'Для кого VIP?', a: 'Для активних профі, яким потрібна максимальна частота та ранній доступ до преміум-матеріалів.' },
    { q: 'Чи можна змінити план?', a: 'Так. Апгрейд і продовження доступні будь-коли; залишок зберігається.' },
    { q: 'Коли стартує доступ?', a: 'Одразу після підтвердження платежу.' },
  ],
}

const SUBSCRIBE_TR = {
  sub_title: 'Abonelik',
  sub_intro:
    'Avantajınızı açın. Cüzdanı bağlayın ve canlı içgörüler, zahmetsiz otomasyon, disiplinli kararlar için net bir yol haritası elde edin. Temponuzu seçin: Free ile keşfedin, PRO ile hızlanın, VIP ile oyunu yönetin.',
  sub_wallet_cta: 'Cüzdanı Bağla',
  sub_wallet_cta_note: 'Planı etkinleştirmek için cüzdanınızı bağlayın.',
  sub_plans_title: 'Paketler',
  sub_free_title: 'FREE — ritmi hisset',
  sub_free_desc: `
    • 3 gün boyunca risksiz deneyim.<br/>
    • Günde 1 manuel “Şimdi Sinyal” ile zamanlamayı ölç.<br/>
    • Fikirler sade kartlarda, kafa karıştırmadan.<br/>
    • Arayüz, dil ve akışı tanımak için harika başlangıç.<br/>
    • Hazır olduğunda yükselt — kontrol sende.<br/>
  `,
  sub_pro_title: 'PRO — tempo ve netlik',
  sub_pro_price: 'Fiyat: 10 USDT / hafta',
  sub_pro_desc: `
    • Gün içi kararlar için dengeli akış, gürültüsüz.<br/>
    • Giriş planı, risk yönetimi ve sonuç değerlendirmesi için yapı.<br/>
    • Seans dinamiklerine dair daha temiz bağlam.<br/>
    • İş günü veya akşam seanslarına uyumlu esneklik.<br/>
    • İhtiyaç duyduğunda öncelikli destek.<br/>
    • İstediğin an yükselt/uzat — zaman boşa gitmez.<br/>
  `,
  sub_vip_title: 'VIP — tam frekans, tam odak',
  sub_vip_price: 'Fiyat: 30 USDT / hafta',
  sub_vip_desc: `
    • Piyasayı yaşayanlar için maksimum kadans.<br/>
    • Premium içerik ve özel raporlara erken erişim.<br/>
    • Fırsatlar doğduğunda hazır, geniş kapsam.<br/>
    • Hızlı geri bildirim kanalıyla fikirleri birlikte hızlandırın.<br/>
    • Platform içinde tanınan VIP statüsü.<br/>
    • Hız, hassasiyet ve kararlılık için tasarlandı.<br/>
  `,
  sub_benefits_title: 'Neden bizi seçiyorlar',
  sub_benefits: [
    'Karmaşayı eleyen, eyleme dönük sinyal kartları.',
    'Panik değil, amaçla hareket etmenizi sağlayan zaman pencereleri.',
    '7 dilde tutarlı arayüz — takılmadan geçiş yapın.',
    'Anlık yükseltme ve uzatma — momentumu kaçırmayın.',
    'Haftalık öne çıkanlar — odağınızı koruyun.',
    'Topluluk bakışı: her kararla birlikte büyüyoruz.',
  ],
  sub_payments_title: 'Dakikalar içinde başla',
  sub_payments: [
    'Planını seç, cüzdanı bağla, onayla ve başla.',
    'Alışık olduğun ağ ve varlıklarla ödeme yap.',
    'Onaydan sonra erişim anında açılır.',
    'Manuel adres yok, gereksiz adım yok.',
  ],
  sub_legal_note:
    'Tüm bilgiler eğitim/analitik amaçlıdır; yatırım tavsiyesi değildir. İşlemler risk içerir. Pozisyon boyutu ve koruyucu stoplar kullanın.',
  sub_faq_title: 'SSS',
  sub_faq: [
    { q: 'Free neden değerli?', a: '3 gün boyunca ritmi risksiz denersin: arayüz, kartlar, sunum — stiline uyumunu görürsün.' },
    { q: 'PRO kime uygun?', a: 'Gün içi tempo ve netlik isteyen, aşırı gürültüye ihtiyaç duymayanlara.' },
    { q: 'VIP kime uygun?', a: 'Maksimum kadans, premium içerik ve hızlı geri bildirim isteyen aktif profesyonellere.' },
    { q: 'Planı sonra değiştirebilir miyim?', a: 'Evet. İstediğin zaman yükselt veya uzat; kalan süre korunur.' },
    { q: 'Ne kadar hızlı başlarım?', a: 'Ödeme onaylanır onaylanmaz erişimin açılır.' },
  ],
}

const SUBSCRIBE_ES = {
  sub_title: 'Suscripción',
  sub_intro:
    'Activa tu ventaja. Conecta tu wallet y desbloquea inteligencia en vivo, automatización sencilla y decisiones disciplinadas. Elige tu ritmo: descubre con Free, acelera con PRO o lidera con VIP.',
  sub_wallet_cta: 'Conectar wallet',
  sub_wallet_cta_note: 'Conecta tu wallet para activar tu plan.',
  sub_plans_title: 'Planes',
  sub_free_title: 'FREE — sentir el ritmo',
  sub_free_desc: `
    • 3 días para explorar sin compromiso.<br/>
    • 1 “Señal ahora” manual al día — prueba el timing.<br/>
    • Ideas claras en tarjetas sin ruido.<br/>
    • Ideal para conocer interfaz, idioma y estilo.<br/>
    • Actualiza cuando quieras — tú marcas el paso.<br/>
  `,
  sub_pro_title: 'PRO — ritmo y claridad',
  sub_pro_price: 'Precio: 10 USDT / semana',
  sub_pro_desc: `
    • Flujo diario afinado para intradía, sin saturación.<br/>
    • Estructura para entradas, gestión de riesgo y revisión.<br/>
    • Contexto más nítido sobre sesiones e impulsos.<br/>
    • Flexible para jornadas laborales o tarde-noche.<br/>
    • Soporte prioritario cuando hace falta.<br/>
    • Mejora/extiende en cualquier momento — sin pérdidas de tiempo.<br/>
  `,
  sub_vip_title: 'VIP — máxima frecuencia',
  sub_vip_price: 'Precio: 30 USDT / semana',
  sub_vip_desc: `
    • Cadencia máxima para quienes viven el mercado.<br/>
    • Acceso temprano a contenidos premium y reportes exclusivos.<br/>
    • Cobertura profunda: listo para las oportunidades cuando surgen.<br/>
    • Canal de feedback ágil para iterar más rápido.<br/>
    • Distintivo VIP dentro de la plataforma.<br/>
    • Hecho para velocidad, precisión y ejecución decidida.<br/>
  `,
  sub_benefits_title: 'Por qué nos eligen',
  sub_benefits: [
    'Tarjetas accionables: esencia sin desorden.',
    'Ventanas de tiempo claras para actuar con calma y propósito.',
    'Interfaz en 7 idiomas con experiencia consistente.',
    'Planes que crecen contigo: upgrades y extensiones sin fricción.',
    'Resúmenes semanales que separan la señal del ruido.',
    'Mentalidad de comunidad — avanzamos juntos, decisión a decisión.',
  ],
  sub_payments_title: 'Empieza en minutos',
  sub_payments: [
    'Elige plan, conecta wallet, confirma y listo.',
    'Paga con activos populares en redes conocidas.',
    'Acceso al instante tras la confirmación del pago.',
    'Sin direcciones manuales ni trámites innecesarios.',
  ],
  sub_legal_note:
    'La información es educativa y analítica; no constituye asesoría financiera. Operar implica riesgo. Usa tamaño de posición y stops protectores.',
  sub_faq_title: 'FAQ',
  sub_faq: [
    { q: '¿Para qué sirve Free?', a: '3 días para sentir el ritmo sin riesgo: interfaz, tarjetas, estilo — comprueba si encaja contigo.' },
    { q: '¿Para quién es PRO?', a: 'Para intradía que quieren ritmo y claridad sin exceso de ruido.' },
    { q: '¿Para quién es VIP?', a: 'Para profesionales activos que necesitan máxima cadencia y acceso premium.' },
    { q: '¿Puedo cambiar de plan?', a: 'Sí, puedes mejorar o extender cuando quieras; el tiempo restante se mantiene.' },
    { q: '¿Cuándo comienza el acceso?', a: 'Justo después de la confirmación del pago.' },
  ],
}

const SUBSCRIBE_AR = {
  sub_title: 'الاشتراك',
  sub_intro:
    'فعّل ميزتك. اربط محفظتك لفتح تحليلات مباشرة، وأتمتة سلسة، وانضباط في القرارات. اختر وتيرتك: تعرّف عبر Free، تسارع مع PRO، أو تقدّم مع VIP.',
  sub_wallet_cta: 'ربط المحفظة',
  sub_wallet_cta_note: 'اربط محفظتك لتفعيل الخطة.',
  sub_plans_title: 'الباقات',
  sub_free_title: 'FREE — جرّب الإيقاع',
  sub_free_desc: `
    • 3 أيام لاستكشاف المنصة دون التزام.<br/>
    • إشارة يدوية واحدة يوميًا لتجربة التوقيت والإيقاع.<br/>
    • أفكار واضحة في بطاقات مرتّبة بلا ضوضاء.<br/>
    • مثالية للتعرّف على الواجهة واللغة والأسلوب.<br/>
    • يمكنك الترقية متى أردت — القرار بيدك.<br/>
  `,
  sub_pro_title: 'PRO — وتيرة ووضوح',
  sub_pro_price: 'السعر: 10 USDT / أسبوع',
  sub_pro_desc: `
    • تدفّق يومي مضبوط لقرارات داخل اليوم دون إرباك.<br/>
    • بنية تساعد على التخطيط وإدارة المخاطر ومراجعة النتائج.<br/>
    • سياق أوضح لتغيّرات الجلسات والزخم.<br/>
    • مرونة تناسب العمل أو جلسات المساء.<br/>
    • دعم ذو أولوية عند الحاجة.<br/>
    • ترقية/تمديد في أي وقت — الوقت لا يضيع.<br/>
  `,
  sub_vip_title: 'VIP — أقصى تردد، أقصى تركيز',
  sub_vip_price: 'السعر: 30 USDT / أسبوع',
  sub_vip_desc: `
    • وتيرة قصوى لمن يعيشون على ساعة السوق.<br/>
    • وصول مبكر لمحتوى مميز وتقارير حصرية.<br/>
    • تغطية أوسع للأصول — جاهزية للحظة المناسبة.<br/>
    • قناة ملاحظات سريعة لتسريع الأفكار.<br/>
    • تمييز VIP داخل المنصة — يكفي اسمه.<br/>
    • صُمّم للسرعة والدقّة والتنفيذ الحاسم.<br/>
  `,
  sub_benefits_title: 'لماذا يختارنا المتداولون',
  sub_benefits: [
    'بطاقات إشارات عملية تُظهر الخلاصة بلا فوضى.',
    'نوافذ زمنية واضحة لتتحرّك بهدوء وهدف.',
    'واجهة متعدّدة اللغات (7) بتجربة متناسقة.',
    'خطط تتوسّع معك — ترقية وتمديد بلا عناء.',
    'ملخصات أسبوعية تُبقي تركيزك على الأهم.',
    'عقلية المجتمع — نتقدّم معًا، قرارًا بعد قرار.',
  ],
  sub_payments_title: 'ابدأ خلال دقائق',
  sub_payments: [
    'اختر الخطة، اربط محفظتك، أكّد — وانطلق.',
    'ادفع بأصول شائعة على الشبكات المعروفة لديك.',
    'يُفعَّل الوصول فور تأكيد الدفع.',
    'لا عناوين يدوية ولا إجراءات مزعجة.',
  ],
  sub_legal_note:
    'المحتوى تعليمي/تحليلي وليس نصيحة مالية. التداول ينطوي على مخاطرة — استخدم إدارة المخاطر وإيقاف الخسارة.',
  sub_faq_title: 'الأسئلة الشائعة',
  sub_faq: [
    { q: 'ما فائدة Free؟', a: '3 أيام لتجربة الإيقاع بلا مخاطرة: الواجهة، البطاقات، الأسلوب — لترى إن كان يناسبك.' },
    { q: 'لمن خُصّص PRO؟', a: 'لمتداولي اليوم الذين يريدون وتيرة ووضوحًا بلا ضجيج زائد.' },
    { q: 'لمن خُصّص VIP؟', a: 'للمحترفين النشطين الذين يحتاجون أقصى تردد ووصولًا مميزًا.' },
    { q: 'هل أستطيع تغيير الخطة لاحقًا؟', a: 'نعم، يمكنك الترقية والتمديد في أي وقت، مع الحفاظ على الوقت المتبقي.' },
    { q: 'متى يبدأ الوصول؟', a: 'فور تأكيد الدفع مباشرة.' },
  ],
}

const SUBSCRIBE_ZH = {
  sub_title: '订阅',
  sub_intro:
    '启动你的优势。连接钱包，即可解锁实时洞察、轻松自动化与更有纪律的决策。选择你的节奏：先用 Free 探路，用 PRO 加速，用 VIP 掌控全局。',
  sub_wallet_cta: '连接钱包',
  sub_wallet_cta_note: '连接钱包以激活订阅。',
  sub_plans_title: '套餐',
  sub_free_title: 'FREE — 先感受节奏',
  sub_free_desc: `
    • 3 天自由体验，无任何义务。<br/>
    • 每天 1 次手动“即刻信号”，感受时机与韵律。<br/>
    • 清爽卡片呈现要点，无冗余噪音。<br/>
    • 适合初识界面、语言与风格的你。<br/>
    • 随时升级——节奏由你把控。<br/>
  `,
  sub_pro_title: 'PRO — 节奏与清晰',
  sub_pro_price: '价格：10 USDT / 周',
  sub_pro_desc: `
    • 为日内决策精心调校的日常节奏，避免信息过载。<br/>
    • 帮你规划入场、管理风险并复盘结果。<br/>
    • 更清晰的交易时段与动能切换语境。<br/>
    • 可与工作/夜间交易灵活搭配。<br/>
    • 需要时享受优先支持。<br/>
    • 随时升级/延长——时间价值不浪费。<br/>
  `,
  sub_vip_title: 'VIP — 全频率，全专注',
  sub_vip_price: '价格：30 USDT / 周',
  sub_vip_desc: `
    • 为以市场为日程的人提供最高节奏。<br/>
    • 优先获得精选内容与独家报告。<br/>
    • 更深覆盖，机会来临即可把握。<br/>
    • 快速反馈渠道，加速迭代思路。<br/>
    • 平台内尊享 VIP 标识。<br/>
    • 为速度、精准与果断执行而生。<br/>
  `,
  sub_benefits_title: '为什么选择我们',
  sub_benefits: [
    '可行动的信号卡片，去繁就简直击要点。',
    '明确的时间窗口，助你从容而有目的地出手。',
    '7 种语言的统一体验，切换流畅不卡壳。',
    '套餐随你成长，升级与续期无阻力。',
    '每周重点提炼，帮你穿透噪音保持专注。',
    '社区型思维——一路同行，步步精进。',
  ],
  sub_payments_title: '几分钟即可开始',
  sub_payments: [
    '选择套餐，连接钱包，确认后立即使用。',
    '用你熟悉的主流资产与网络支付即可。',
    '支付确认后，访问权限立即开启。',
    '无需手填地址，无需繁琐步骤。',
  ],
  sub_legal_note:
    '所有内容仅供教育与分析，不构成投资建议。交易有风险，请合理控制仓位并使用止损。',
  sub_faq_title: '常见问题',
  sub_faq: [
    { q: 'Free 有何价值？', a: '3 天无负担体验：界面、卡片、呈现方式——看看是否契合你的风格。' },
    { q: 'PRO 适合谁？', a: '希望保持节奏与清晰、避免过载的日内交易者。' },
    { q: 'VIP 适合谁？', a: '需要最高频率与精选内容的活跃型专业交易者。' },
    { q: '可以之后换套餐吗？', a: '可以。随时升级或续期，剩余时间保持有效。' },
    { q: '多久能开始？', a: '支付确认后即可立即开启访问权限。' },
  ],
}

// Merge into dict (keep as-is)
try {
  Object.assign(dict.en, SUBSCRIBE_EN)
  Object.assign(dict.ru, SUBSCRIBE_RU)
  Object.assign(dict.uk, SUBSCRIBE_UK)
  Object.assign(dict.tr, SUBSCRIBE_TR)
  Object.assign(dict.es, SUBSCRIBE_ES)
  Object.assign(dict.ar, SUBSCRIBE_AR)
  Object.assign(dict.zh, SUBSCRIBE_ZH)
} catch {}

/* ============================================================
   AI RECOMMENDATIONS — PATCH (7 languages)
   ВСТАВИТЬ ПЕРЕД export I18nProvider / useI18n
   НИЧЕГО НЕ ЛОМАЕТ: просто дополняет/перезаписывает ключи.
   ============================================================ */

/* -------------------- EN -------------------- */
const AI_EN = {
  exchange_title: 'Exchange (in progress)',
  ai_cta_start_telegram: 'Start in Telegram',
  ai_reco_title: 'AI Recommendation',
  ai_action: 'Action',
  ai_confidence: 'Confidence',
  ai_price: 'Price',
  ai_tp: 'TP',
  ai_sl: 'SL',
  ai_horizons: 'Horizons',
  ai_support: 'Support',
  ai_resistance: 'Resistance',
  ai_levels: 'Levels',
  ai_explainer_title: 'Why this recommendation',
  ai_disclaimer: 'Signals are assistive and educational; not financial advice.',

  // factor lines (ON when condition true; OFF variant used when false)
  ai_f_ema21_gt_ma50_on: 'Uptrend (EMA21 > MA50)',
  ai_f_ema21_gt_ma50_off: 'Not uptrend (EMA21 ≤ MA50)',
  ai_f_ma50_gt_ma200_on: 'Bull regime (MA50 > MA200)',
  ai_f_ma50_gt_ma200_off: 'Bear regime (MA50 ≤ MA200)',
  ai_f_price_gt_vwap_on: 'Price above VWAP',
  ai_f_price_gt_vwap_off: 'Price below VWAP',
  ai_f_rsi_bull_on: 'RSI14 bullish',
  ai_f_rsi_bull_off: 'RSI14 bearish/neutral',
  ai_f_macd_pos_on: 'MACD histogram positive',
  ai_f_macd_pos_off: 'MACD histogram negative',
  ai_note_atr: 'ATR14≈{v} — volatility used for TP/SL',
  ai_note_sr: 'Nearest levels detected from bands/MAs and VWAP',
  ai_note_h: 'Expected absolute move (median) over 6h/24h based on recent returns',

  // CTA / misc (на будущее)
  ai_cta_more: 'Details',
  ai_cta_backtest: 'Backtest (soon)',
}

/* -------------------- RU -------------------- */
const AI_RU = {
  exchange_title: 'Биржа (в разработке)',
  ai_cta_start_telegram: 'Начать в Telegram',
  ai_reco_title: 'AI-рекомендация',
  ai_action: 'Действие',
  ai_confidence: 'Уверенность',
  ai_price: 'Цена',
  ai_tp: 'TP',
  ai_sl: 'SL',
  ai_horizons: 'Горизонты',
  ai_support: 'Поддержка',
  ai_resistance: 'Сопротивление',
  ai_levels: 'Уровни',
  ai_explainer_title: 'Почему такая рекомендация',
  ai_disclaimer: 'Сигналы носят вспомогательный/обучающий характер и не являются финсоветом.',

  ai_f_ema21_gt_ma50_on: 'Восходящий режим (EMA21 > MA50)',
  ai_f_ema21_gt_ma50_off: 'Нет восходящего режима (EMA21 ≤ MA50)',
  ai_f_ma50_gt_ma200_on: 'Бычий режим (MA50 > MA200)',
  ai_f_ma50_gt_ma200_off: 'Медвежий режим (MA50 ≤ MA200)',
  ai_f_price_gt_vwap_on: 'Цена выше VWAP',
  ai_f_price_gt_vwap_off: 'Цена ниже VWAP',
  ai_f_rsi_bull_on: 'RSI14 бычий',
  ai_f_rsi_bull_off: 'RSI14 медвежий/нейтральный',
  ai_f_macd_pos_on: 'MACD-гистограмма положительная',
  ai_f_macd_pos_off: 'MACD-гистограмма отрицательная',
  ai_note_atr: 'ATR14≈{v} — волатильность для TP/SL',
  ai_note_sr: 'Ближайшие уровни найдены по полосам/MA и VWAP',
  ai_note_h: 'Ожидаемое абсолютное движение (медиана) на 6ч/24ч по недавним данным',

  ai_cta_more: 'Подробно',
  ai_cta_backtest: 'Бэктест (скоро)',
}

/* -------------------- UK -------------------- */
const AI_UK = {
  exchange_title: 'Біржа (в розробці)',
  ai_cta_start_telegram: 'Почати в Telegram',
  ai_reco_title: 'AI-рекомендація',
  ai_action: 'Дія',
  ai_confidence: 'Впевненість',
  ai_price: 'Ціна',
  ai_tp: 'TP',
  ai_sl: 'SL',
  ai_horizons: 'Горизонти',
  ai_support: 'Підтримка',
  ai_resistance: 'Опір',
  ai_levels: 'Рівні',
  ai_explainer_title: 'Чому саме така рекомендація',
  ai_disclaimer: 'Сигнали мають допоміжний/освітній характер і не є фінансовою порадою.',

  ai_f_ema21_gt_ma50_on: 'Висхідний режим (EMA21 > MA50)',
  ai_f_ema21_gt_ma50_off: 'Немає висхідного режиму (EMA21 ≤ MA50)',
  ai_f_ma50_gt_ma200_on: 'Бичачий режим (MA50 > MA200)',
  ai_f_ma50_gt_ma200_off: 'Ведмежий режим (MA50 ≤ MA200)',
  ai_f_price_gt_vwap_on: 'Ціна вище VWAP',
  ai_f_price_gt_vwap_off: 'Ціна нижче VWAP',
  ai_f_rsi_bull_on: 'RSI14 — бичачий',
  ai_f_rsi_bull_off: 'RSI14 — ведмежий/нейтральний',
  ai_f_macd_pos_on: 'Позитивна гістограма MACD',
  ai_f_macd_pos_off: 'Негативна гістограма MACD',
  ai_note_atr: 'ATR14≈{v} — волатильність для TP/SL',
  ai_note_sr: 'Найближчі рівні з Bands/MA та VWAP',
  ai_note_h: 'Очікуваний абсолютний рух (медіана) за 6г/24г',

  ai_cta_more: 'Детальніше',
  ai_cta_backtest: 'Бектест (скоро)',
}

/* -------------------- ZH (简体) -------------------- */
const AI_ZH = {
  exchange_title: '交易所（开发中）',
  ai_cta_start_telegram: '在 Telegram 开始',
  ai_reco_title: 'AI 建议',
  ai_action: '操作',
  ai_confidence: '置信度',
  ai_price: '价格',
  ai_tp: '止盈',
  ai_sl: '止损',
  ai_horizons: '时间范围',
  ai_support: '支撑',
  ai_resistance: '阻力',
  ai_levels: '关键位',
  ai_explainer_title: '推荐理由',
  ai_disclaimer: '所有信号仅用于辅助/学习，不构成投资建议。',

  ai_f_ema21_gt_ma50_on: '上升趋势（EMA21 > MA50）',
  ai_f_ema21_gt_ma50_off: '非上升趋势（EMA21 ≤ MA50）',
  ai_f_ma50_gt_ma200_on: '多头结构（MA50 > MA200）',
  ai_f_ma50_gt_ma200_off: '空头结构（MA50 ≤ MA200）',
  ai_f_price_gt_vwap_on: '价格在 VWAP 之上',
  ai_f_price_gt_vwap_off: '价格在 VWAP 之下',
  ai_f_rsi_bull_on: 'RSI14 偏多',
  ai_f_rsi_bull_off: 'RSI14 偏空/中性',
  ai_f_macd_pos_on: 'MACD 柱线为正',
  ai_f_macd_pos_off: 'MACD 柱线为负',
  ai_note_atr: 'ATR14≈{v} — 用于 TP/SL 的波动度',
  ai_note_sr: '依据布林/均线与 VWAP 计算的近端价位',
  ai_note_h: '基于近段收益的 6h/24h 典型幅度（中位数）',

  ai_cta_more: '详情',
  ai_cta_backtest: '回测（即将推出）',
}

/* -------------------- ES -------------------- */
const AI_ES = {
  exchange_title: 'Bolsa (en desarrollo)',
  ai_cta_start_telegram: 'Empezar en Telegram',
  ai_reco_title: 'Recomendación AI',
  ai_action: 'Acción',
  ai_confidence: 'Confianza',
  ai_price: 'Precio',
  ai_tp: 'TP',
  ai_sl: 'SL',
  ai_horizons: 'Horizontes',
  ai_support: 'Soporte',
  ai_resistance: 'Resistencia',
  ai_levels: 'Niveles',
  ai_explainer_title: 'Por qué esta recomendación',
  ai_disclaimer: 'Las señales son de apoyo/educación; no constituyen asesoramiento financiero.',

  ai_f_ema21_gt_ma50_on: 'Tendencia alcista (EMA21 > MA50)',
  ai_f_ema21_gt_ma50_off: 'Sin tendencia alcista (EMA21 ≤ MA50)',
  ai_f_ma50_gt_ma200_on: 'Régimen alcista (MA50 > MA200)',
  ai_f_ma50_gt_ma200_off: 'Régimen bajista (MA50 ≤ MA200)',
  ai_f_price_gt_vwap_on: 'Precio sobre VWAP',
  ai_f_price_gt_vwap_off: 'Precio bajo VWAP',
  ai_f_rsi_bull_on: 'RSI14 alcista',
  ai_f_rsi_bull_off: 'RSI14 bajista/neutro',
  ai_f_macd_pos_on: 'Histograma MACD positivo',
  ai_f_macd_pos_off: 'Histograma MACD negativo',
  ai_note_atr: 'ATR14≈{v} — volatilidad para TP/SL',
  ai_note_sr: 'Niveles cercanos desde bandas/MAs y VWAP',
  ai_note_h: 'Movimiento absoluto esperado (mediana) 6h/24h',

  ai_cta_more: 'Detalles',
  ai_cta_backtest: 'Backtest (pronto)',
}

/* -------------------- AR (العربية) -------------------- */
const AI_AR = {
  exchange_title: 'البورصة (قيد التطوير)',
  ai_cta_start_telegram: 'ابدأ في تيليجرام',
  ai_reco_title: 'توصية الذكاء الاصطناعي',
  ai_action: 'الإجراء',
  ai_confidence: 'الثقة',
  ai_price: 'السعر',
  ai_tp: 'جني ربح',
  ai_sl: 'إيقاف خسارة',
  ai_horizons: 'الأُطُر الزمنية',
  ai_support: 'الدعم',
  ai_resistance: 'المقاومة',
  ai_levels: 'المستويات',
  ai_explainer_title: 'لماذا هذه التوصية',
  ai_disclaimer: 'الإشارات لأغراض المساعدة والتعليم فقط وليست نصيحة مالية.',

  ai_f_ema21_gt_ma50_on: 'اتجاه صاعد (EMA21 > MA50)',
  ai_f_ema21_gt_ma50_off: 'لا يوجد اتجاه صاعد (EMA21 ≤ MA50)',
  ai_f_ma50_gt_ma200_on: 'نظام صعودي (MA50 > MA200)',
  ai_f_ma50_gt_ma200_off: 'نظام هبوطي (MA50 ≤ MA200)',
  ai_f_price_gt_vwap_on: 'السعر أعلى من VWAP',
  ai_f_price_gt_vwap_off: 'السعر أدنى من VWAP',
  ai_f_rsi_bull_on: 'RSI14 إيجابي',
  ai_f_rsi_bull_off: 'RSI14 سلبي/محايد',
  ai_f_macd_pos_on: 'مُدرّج MACD موجب',
  ai_f_macd_pos_off: 'مُدرّج MACD سالب',
  ai_note_atr: 'ATR14≈{v} — التذبذب المستخدم لـ TP/SL',
  ai_note_sr: 'أقرب المستويات من الحزم/المتوسطات و VWAP',
  ai_note_h: 'الحركة المتوقعة (الوسيط) خلال 6س/24س',

  ai_cta_more: 'تفاصيل',
  ai_cta_backtest: 'اختبار رجعي (قريبًا)',
}

/* -------------------- TR -------------------- */
const AI_TR = {
  exchange_title: 'Borsa (geliştirme aşamasında)',
  ai_cta_start_telegram: 'Telegram’da Başla',
  ai_reco_title: 'AI Önerisi',
  ai_action: 'Aksiyon',
  ai_confidence: 'Güven',
  ai_price: 'Fiyat',
  ai_tp: 'TP',
  ai_sl: 'SL',
  ai_horizons: 'Zaman ufukları',
  ai_support: 'Destek',
  ai_resistance: 'Direnç',
  ai_levels: 'Seviyeler',
  ai_explainer_title: 'Bu önerinin gerekçesi',
  ai_disclaimer: 'Sinyaller yardımcı/eğitseldir; yatırım tavsiyesi değildir.',

  ai_f_ema21_gt_ma50_on: 'Yükseliş rejimi (EMA21 > MA50)',
  ai_f_ema21_gt_ma50_off: 'Yükseliş rejimi yok (EMA21 ≤ MA50)',
  ai_f_ma50_gt_ma200_on: 'Boğa rejimi (MA50 > MA200)',
  ai_f_ma50_gt_ma200_off: 'Ayı rejimi (MA50 ≤ MA200)',
  ai_f_price_gt_vwap_on: 'Fiyat VWAP üzerinde',
  ai_f_price_gt_vwap_off: 'Fiyat VWAP altında',
  ai_f_rsi_bull_on: 'RSI14 yükseliş',
  ai_f_rsi_bull_off: 'RSI14 düşüş/nötr',
  ai_f_macd_pos_on: 'MACD histogramı pozitif',
  ai_f_macd_pos_off: 'MACD histogramı negatif',
  ai_note_atr: 'ATR14≈{v} — TP/SL için volatilite',
  ai_note_sr: 'Yakın seviyeler: bantlar/MA ve VWAP',
  ai_note_h: '6s/24s için beklenen mutlak hareket (medyan)',

  ai_cta_more: 'Detaylar',
  ai_cta_backtest: 'Backtest (yakında)',
}

/* -------------------- MERGE -------------------- */
try {
  Object.assign(dict.en, AI_EN)
  Object.assign(dict.ru, AI_RU)
  Object.assign(dict.uk, AI_UK)
  Object.assign(dict.es, AI_ES)
  Object.assign(dict.zh, AI_ZH)
  Object.assign(dict.ar, AI_AR)
  Object.assign(dict.tr, AI_TR)
} catch {}
/* ========================= AI QUOTA STRINGS — PATCH =========================
   ВСТАВИТЬ ПЕРЕД export I18nProvider / useI18n
   Добавляет ключи:
   - ai_limit_reached   — мигающая красная надпись
   - ai_time_left       — строка «Осталось времени сегодня»
   ========================================================================== */

// EN
const AI_QUOTA_EN = {
  ai_limit_reached: 'Limit reached. For full access, continue in Telegram or remove the limit here',
  ai_time_left: 'Time left today',
}
// RU
const AI_QUOTA_RU = {
  ai_limit_reached: 'Лимит исчерпан. Для полного доступа — продолжить в Telegram или снять лимит здесь',
  ai_time_left: 'Осталось времени сегодня',
}
// UK
const AI_QUOTA_UK = {
  ai_limit_reached: 'Ліміт вичерпано. Для повного доступу — продовжуйте в Telegram або зніміть ліміт тут',
  ai_time_left: 'Залишилось часу сьогодні',
}
// ZH (简体)
const AI_QUOTA_ZH = {
  ai_limit_reached: '已达上限。要获得完整访问，请在 Telegram 中继续，或在此处解除限制',
  ai_time_left: '今日剩余时间',
}
// ES
const AI_QUOTA_ES = {
  ai_limit_reached: 'Límite alcanzado. Para acceso completo, continúa en Telegram o quita el límite aquí',
  ai_time_left: 'Tiempo restante de hoy',
}
// AR
const AI_QUOTA_AR = {
  ai_limit_reached: 'العربية: تم بلوغ الحد. للوصول الكامل، تابع في Telegram أو أزل الحد من هنا',
  ai_time_left: 'الوقت المتبقي اليوم', 
}
// TR
const AI_QUOTA_TR = {
  ai_limit_reached: 'Limit aşıldı. Tam erişim için Telegram’da devam edin veya limiti burada kaldırın',
  ai_time_left: 'Bugün kalan süre',
}

// MERGE
try {
  Object.assign(dict.en, AI_QUOTA_EN)
  Object.assign(dict.ru, AI_QUOTA_RU)
  Object.assign(dict.uk, AI_QUOTA_UK)
  Object.assign(dict.zh, AI_QUOTA_ZH)
  Object.assign(dict.es, AI_QUOTA_ES)
  Object.assign(dict.ar, AI_QUOTA_AR)
  Object.assign(dict.tr, AI_QUOTA_TR)
} catch {}
/* ============================================================
   VIP+ — "Снять лимит" / Remove Limit (NowPayments) — I18N (7 langs)
   ВСТАВИТЬ ПЕРЕД export I18nProvider / useI18n
   НИЧЕГО НЕ ЛОМАЕТ: просто дополняет/перезаписывает ключи.
   ============================================================ */

/* -------------------- EN -------------------- */
const UNLIMIT_EN = {
  ai_unlimit_btn: 'Remove limit',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'Remove limit — VIP+',
  ai_unlimit_price: 'Price: $30 / month',
  ai_unlimit_desc:
    'Unlock 24/7 AI Box access on this account. The daily browser quota is disabled for 30 days once the payment is confirmed via NowPayments.',
  ai_unlimit_benefits: [
    'No daily browser quota — AI Box is always on.',
    'Plan is tied to your current account/wallet auth.',
    'Payment is processed by NowPayments; webhook activates access automatically.',
  ],
  ai_unlimit_pay_now: 'Pay $30',
  ai_unlimit_cancel: 'Cancel',
  ai_unlimit_learn_more: 'Details',
  ai_unlimit_status_waiting: 'Waiting for payment confirmation…',
  ai_unlimit_status_confirmed: 'Payment confirmed — limit removed until {date}.',
  ai_unlimit_status_underpaid: 'Underpaid: received {got}, required {need}.',
  ai_unlimit_status_expired: 'Invoice expired or was cancelled.',
  ai_unlimit_status_error: 'Payment error. Please try again or contact support.',
  ai_unlimit_toast_on: 'VIP+ activated',
  ai_unlimit_toast_off: 'VIP+ expired',
}

/* -------------------- RU -------------------- */
const UNLIMIT_RU = {
  ai_unlimit_btn: 'Снять лимит',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'Снять лимит — VIP+',
  ai_unlimit_price: 'Цена: $30 / месяц',
  ai_unlimit_desc:
    'Откройте круглосуточный доступ к AI Box на этом аккаунте. Дневная квота из браузера отключается на 30 дней после подтверждения платежа через NowPayments.',
  ai_unlimit_benefits: [
    'Без дневной квоты — AI Box всегда доступен.',
    'План привязан к текущей авторизации/кошельку.',
    'Оплата через NowPayments; вебхук активирует доступ автоматически.',
  ],
  ai_unlimit_pay_now: 'Оплатить $30',
  ai_unlimit_cancel: 'Отмена',
  ai_unlimit_learn_more: 'Подробнее',
  ai_unlimit_status_waiting: 'Ждём подтверждение платежа…',
  ai_unlimit_status_confirmed: 'Оплата подтверждена — лимит снят до {date}.',
  ai_unlimit_status_underpaid: 'Недоплата: получено {got}, требуется {need}.',
  ai_unlimit_status_expired: 'Счёт истёк или был отменён.',
  ai_unlimit_status_error: 'Ошибка платежа. Попробуйте ещё раз или напишите в поддержку.',
  ai_unlimit_toast_on: 'VIP+ активирован',
  ai_unlimit_toast_off: 'VIP+ закончился',
}

/* -------------------- UK -------------------- */
const UNLIMIT_UK = {
  ai_unlimit_btn: 'Зняти ліміт',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'Зняти ліміт — VIP+',
  ai_unlimit_price: 'Ціна: $30 / місяць',
  ai_unlimit_desc:
    'Відкрийте цілодобовий доступ до AI Box для цього акаунта. Денна квота з браузера вимикається на 30 днів після підтвердження платежу через NowPayments.',
  ai_unlimit_benefits: [
    'Без денної квоти — AI Box завжди доступний.',
    'План прив’язано до поточної авторизації/гаманця.',
    'Оплата через NowPayments; вебхук автоматично активує доступ.',
  ],
  ai_unlimit_pay_now: 'Сплатити $30',
  ai_unlimit_cancel: 'Скасувати',
  ai_unlimit_learn_more: 'Деталі',
  ai_unlimit_status_waiting: 'Очікуємо підтвердження платежу…',
  ai_unlimit_status_confirmed: 'Оплату підтверджено — ліміт знято до {date}.',
  ai_unlimit_status_underpaid: 'Недоплата: отримано {got}, потрібно {need}.',
  ai_unlimit_status_expired: 'Рахунок прострочено або скасовано.',
  ai_unlimit_status_error: 'Помилка платежу. Спробуйте ще раз або зверніться в підтримку.',
  ai_unlimit_toast_on: 'VIP+ активовано',
  ai_unlimit_toast_off: 'VIP+ завершився',
}

/* -------------------- ES -------------------- */
const UNLIMIT_ES = {
  ai_unlimit_btn: 'Quitar límite',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'Quitar límite — VIP+',
  ai_unlimit_price: 'Precio: $30 / mes',
  ai_unlimit_desc:
    'Desbloquea acceso 24/7 al AI Box en esta cuenta. La cuota diaria del navegador se desactiva durante 30 días tras la confirmación del pago vía NowPayments.',
  ai_unlimit_benefits: [
    'Sin cuota diaria — AI Box siempre activo.',
    'Plan vinculado a tu cuenta/cartera actual.',
    'Pago por NowPayments; el webhook activa el acceso automáticamente.',
  ],
  ai_unlimit_pay_now: 'Pagar $30',
  ai_unlimit_cancel: 'Cancelar',
  ai_unlimit_learn_more: 'Detalles',
  ai_unlimit_status_waiting: 'Esperando confirmación del pago…',
  ai_unlimit_status_confirmed: 'Pago confirmado — límite quitado hasta {date}.',
  ai_unlimit_status_underpaid: 'Pago insuficiente: recibido {got}, requerido {need}.',
  ai_unlimit_status_expired: 'La factura caducó o fue cancelada.',
  ai_unlimit_status_error: 'Error de pago. Inténtalo de nuevo o contacta soporte.',
  ai_unlimit_toast_on: 'VIP+ activado',
  ai_unlimit_toast_off: 'VIP+ expiró',
}

/* -------------------- ZH (简体) -------------------- */
const UNLIMIT_ZH = {
  ai_unlimit_btn: '解除限制',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: '解除限制 — VIP+',
  ai_unlimit_price: '价格：$30 / 月',
  ai_unlimit_desc:
    '为此账户解锁 24/7 AI Box 访问。通过 NowPayments 确认支付后，浏览器的每日配额将在 30 天内关闭。',
  ai_unlimit_benefits: [
    '无每日配额 — AI Box 持续可用。',
    '套餐绑定到你当前的账户/钱包登录。',
    '使用 NowPayments 支付；回调（webhook）会自动开通权限。',
  ],
  ai_unlimit_pay_now: '支付 $30',
  ai_unlimit_cancel: '取消',
  ai_unlimit_learn_more: '详情',
  ai_unlimit_status_waiting: '正在等待支付确认…',
  ai_unlimit_status_confirmed: '支付已确认 — 限制解除至 {date}。',
  ai_unlimit_status_underpaid: '支付不足：已收 {got}，需 {need}。',
  ai_unlimit_status_expired: '账单已过期或被取消。',
  ai_unlimit_status_error: '支付错误。请重试或联系支持。',
  ai_unlimit_toast_on: 'VIP+ 已开通',
  ai_unlimit_toast_off: 'VIP+ 已到期',
}

/* -------------------- AR -------------------- */
const UNLIMIT_AR = {
  ai_unlimit_btn: 'إزالة الحدّ',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'إزالة الحدّ — VIP+',
  ai_unlimit_price: 'السعر: 30$ / شهريًا',
  ai_unlimit_desc:
    'افتح وصولًا مستمرًا على مدار الساعة إلى AI Box لهذا الحساب. يتم إيقاف حصة المتصفح اليومية لمدة 30 يومًا بعد تأكيد الدفع عبر NowPayments.',
  ai_unlimit_benefits: [
    'بدون حصة يومية — AI Box متاح دائمًا.',
    'الخطة مرتبطة بتسجيل دخولك / محفظتك الحالية.',
    'يُعالج الدفع عبر NowPayments ويُفعَّل الوصول تلقائيًا بواسطة Webhook.',
  ],
  ai_unlimit_pay_now: 'ادفع 30$',
  ai_unlimit_cancel: 'إلغاء',
  ai_unlimit_learn_more: 'تفاصيل',
  ai_unlimit_status_waiting: 'بانتظار تأكيد الدفع…',
  ai_unlimit_status_confirmed: 'تم تأكيد الدفع — أزيل الحد حتى {date}.',
  ai_unlimit_status_underpaid: 'دفع غير مكتمل: المستلم {got}، المطلوب {need}.',
  ai_unlimit_status_expired: 'انتهت صلاحية الفاتورة أو أُلغيت.',
  ai_unlimit_status_error: 'خطأ في الدفع. حاول مجددًا أو تواصل مع الدعم.',
  ai_unlimit_toast_on: 'تم تفعيل VIP+',
  ai_unlimit_toast_off: 'انتهى VIP+',
}

/* -------------------- TR -------------------- */
const UNLIMIT_TR = {
  ai_unlimit_btn: 'Limiti kaldır',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'Limiti kaldır — VIP+',
  ai_unlimit_price: 'Fiyat: $30 / ay',
  ai_unlimit_desc:
    'Bu hesapta 7/24 AI Box erişimini aç. NowPayments üzerinden ödeme onaylandığında tarayıcı günlük kotası 30 gün boyunca kapatılır.',
  ai_unlimit_benefits: [
    'Günlük kota yok — AI Box her zaman açık.',
    'Plan, mevcut hesabın/cüzdan girişinle eşleştirilir.',
    'Ödeme NowPayments ile; webhook erişimi otomatik açar.',
  ],
  ai_unlimit_pay_now: '30$ öde',
  ai_unlimit_cancel: 'İptal',
  ai_unlimit_learn_more: 'Detaylar',
  ai_unlimit_status_waiting: 'Ödeme onayı bekleniyor…',
  ai_unlimit_status_confirmed: 'Ödeme onaylandı — limit {date} tarihine kadar kaldırıldı.',
  ai_unlimit_status_underpaid: 'Eksik ödeme: alınan {got}, gereken {need}.',
  ai_unlimit_status_expired: 'Fatura süresi doldu veya iptal edildi.',
  ai_unlimit_status_error: 'Ödeme hatası. Tekrar deneyin veya destekle iletişime geçin.',
  ai_unlimit_toast_on: 'VIP+ etkin',
  ai_unlimit_toast_off: 'VIP+ sona erdi',
}
/* -------------------- MERGE -------------------- */
try {
  Object.assign(dict.en, UNLIMIT_EN)
  Object.assign(dict.ru, UNLIMIT_RU)
  Object.assign(dict.uk, UNLIMIT_UK)
  Object.assign(dict.es, UNLIMIT_ES)
  Object.assign(dict.zh, UNLIMIT_ZH)
  Object.assign(dict.ar, UNLIMIT_AR)
  Object.assign(dict.tr, UNLIMIT_TR)
} catch (e) {}
/* -------------------- ACTIVE_UNTIL (only one key) -------------------- */
const ACTIVE_EN = { active_until: 'active until' }
const ACTIVE_RU = { active_until: 'активно до' }
const ACTIVE_UK = { active_until: 'активно до' }
const ACTIVE_ES = { active_until: 'activo hasta' }
const ACTIVE_ZH = { active_until: '有效至' }           // 简体中文
const ACTIVE_AR = { active_until: 'نشط حتى' }         // RTL
const ACTIVE_TR = { active_until: 'şu tarihe kadar aktif' }

/* -------------------- MERGE (append without removing anything) -------------------- */
try {
  Object.assign(dict.en, ACTIVE_EN)
  Object.assign(dict.ru, ACTIVE_RU)
  Object.assign(dict.uk, ACTIVE_UK)
  Object.assign(dict.es, ACTIVE_ES)
  Object.assign(dict.zh, ACTIVE_ZH)
  Object.assign(dict.ar, ACTIVE_AR)
  Object.assign(dict.tr, ACTIVE_TR)
} catch (e) {}

/* -------------------- EN -------------------- */
const FORUM_UI_EN = {
  // Admin
  forum_admin: 'ADMIN',
  forum_admin_active: 'ADMIN',
  forum_admin_exit: 'exit admin',
  forum_admin_pass: 'Admin password',
  forum_activate: 'Activate',

  // Global / Dialogs
  forum_cancel: 'Cancel',
  forum_close: 'Close',
  forum_save: 'Save',
  forum_total: 'total',
  forum_need_auth: 'Authorization required',
  forum_auth_required: 'Sign in required',
  forum_not_signed: 'Not signed in',

  // Account / Profile
  forum_account: 'Account',
  forum_account_settings: 'Account settings',
  forum_profile_nickname: 'Nickname',
  forum_profile_nickname_ph: 'How should we call you?',
  forum_profile_avatar: 'Avatar',
  forum_avatar_vip: 'VIP+ avatars',

  // VIP+
forum_vip_only: 'VIP+ only',
forum_vip_plus: 'VIP+',
forum_vip_active: 'VIP+ active',
forum_vip_thanks: 'Thanks for your support!',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ unlocks premium avatars and emoji, the ability to send voice messages and images, and a faster Q COIN growth rate (×2 accrual). VIP+ also removes the limit on the AI Analytics box on the Exchange page, giving you access to high-fidelity forecasts and deeper insights. Be seen, be heard, and grow your balance faster with VIP+.',
forum_vip_pay: 'Pay',
forum_vip_pay_fail: 'Payment failed. Try again later.',
forum_vip_required: 'VIP+ required',
forum_vip_already_active: 'VIP is already active',
forum_vip_activated: 'VIP activated',
forum_vip_pending: 'Payment pending…',


  // Header / Search / Sort
  forum_search_ph: 'Enter keyword…',
  forum_sort: 'Sort',
  forum_sort_new: 'Newest',
  forum_sort_top: 'Top',
  forum_sort_views: 'Views',
  forum_sort_likes: 'Likes',
  forum_sort_replies: 'Replies',
  forum_search_empty: 'Nothing found',

  // Navigation
  forum_back: 'Back',
  forum_home: 'Home',

  // Threads / Posts
  forum_open_replies: 'Replies',
  forum_no_posts_yet: 'No posts yet',
  forum_report_ok: 'Report sent',
  forum_report: 'Report',
  forum_reply: 'Reply',
  forum_delete: 'Delete',
  forum_unban: 'Unban',
  forum_ban: 'Ban',
  forum_views: 'Views',
  forum_replies: 'Replies',
  forum_like: 'Like',
  forum_dislike: 'Dislike',

  // Composer
  forum_reply_to: 'Reply to',
  forum_replying_to: 'Replying to',
  forum_composer_hint: 'Be precise. Respect evidence. Links are welcome.',
  forum_composer_placeholder: 'Write a message…',
  forum_send: 'Send',
  forum_more_emoji: 'More emoji',
  forum_emoji_vip: 'Stickers',
  forum_attach: 'Attach',
  forum_remove: 'Remove',
  forum_remove_attachment: 'Remove attachment',
  forum_post_sent: 'Sent',

  // New Topic
  forum_hint_select_topic: 'Select a topic to read and reply',
  forum_create: 'Create',
  forum_creating: 'Creating…',
  forum_topic_title: 'Title',
  forum_topic_title_ph: 'Short, precise title',
  forum_topic_desc: 'Description',
  forum_topic_desc_ph: 'Optional description',
  forum_topic_first_msg: 'First message',
  forum_topic_first_msg_ph: 'Start the discussion with facts, data and sources…',

   // QCoin Desk (expanded)
/* -------------------- EN -------------------- */
forum_qcoin_desc:
'Next-generation cryptocurrency with a proof-of-activity reward model.\n\n' +
'Now in the forum you can earn not only through activity but also by completing quests: finish tasks and receive real cryptocurrency.\n\n' +
'VIP members receive double rewards ×2, as well as additional accruals for views, likes, and the engagement of their posts — their contribution is measured in Q COIN.\n\n' +
'The system is built on a hybrid on-/off-chain architecture with continuous synchronization and is preparing to integrate with the new L7 blockchain — a platform for the next financial generation.\n\n' +
'L7 will become a new financial order: its own blockchain, a distributed economy, and full decentralization.\n\n' +
'Stay active, complete quests, and don’t miss the moment — earn the cryptocurrency of the future today.',
forum_qcoin_withdraw_note:
'The L7 blockchain is UNDER DEVELOPMENT. \n\n' +
'Withdrawals will be available after the blockchain launch. \n\n' +
'The "WITHDRAW" button will turn gold.',

forum_qcoin_exchange: 'Exchange',
forum_qcoin_withdraw: 'Withdraw',
forum_qcoin_open_hint: 'Open Q COIN',
forum_qcoin_x2: 'x2',
forum_qcoin_x2_hint: 'VIP+: accrual ×2',

forum_inbox: 'Replies to me',
forum_inbox_title: 'Replies to your messages',
forum_inbox_empty: 'No new replies',

}

/* -------------------- RU -------------------- */
const FORUM_UI_RU = {
  // Admin
  forum_admin: 'АДМИН',
  forum_admin_active: 'АДМИН',
  forum_admin_exit: 'выйти из режима админа',
  forum_admin_pass: 'Админ-пароль',
  forum_activate: 'Активировать',

  // Global / Dialogs
  forum_cancel: 'Отмена',
  forum_close: 'Закрыть',
  forum_save: 'Сохранить',
  forum_total: 'всего',
  forum_need_auth: 'Требуется авторизация',
  forum_auth_required: 'Нужна авторизация',
  forum_not_signed: 'Вы не вошли',

  // Account / Profile
  forum_account: 'Аккаунт',
  forum_account_settings: 'Настройки аккаунта',
  forum_profile_nickname: 'Ник',
  forum_profile_nickname_ph: 'Как вас называть?',
  forum_profile_avatar: 'Аватар',
  forum_avatar_vip: 'VIP+ аватары',

  // VIP+
forum_vip_only: 'Только для VIP+',
forum_vip_plus: 'VIP+',
forum_vip_active: 'VIP+ активен',
forum_vip_thanks: 'Спасибо за поддержку!',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ открывает доступ к премиум-аватарам и эмодзи, отправке голосовых сообщений и изображений, а также ускоряет рост Q COIN (начисление ×2). Кроме того, VIP+ снимает лимит c AI-бокса аналитики на странице Exchange — доступны продвинутые прогнозы и глубокая аналитика. Будьте заметны, отправляйте больше форматов и ускоряйте баланс с VIP+.',
forum_vip_pay: 'Оплатить',
forum_vip_pay_fail: 'Оплата не удалась. Повторите позже.',
forum_vip_required: 'Нужен VIP+',
forum_vip_already_active: 'VIP уже активен',
forum_vip_activated: 'VIP активирован',
forum_vip_pending: 'Платёж в обработке…',


  // Header / Search / Sort
  forum_search_ph: 'Введите ключевое слово…',
  forum_sort: 'Сортировать',
  forum_sort_new: 'Новые',
  forum_sort_top: 'Топ',
  forum_sort_views: 'Просмотры',
  forum_sort_likes: 'Лайки',
  forum_sort_replies: 'Ответы',
  forum_search_empty: 'Ничего не найдено',

  // Navigation
  forum_back: 'Назад',
  forum_home: 'На главную',

  // Threads / Posts
  forum_open_replies: 'Ответы',
  forum_no_posts_yet: 'Пока нет сообщений',
  forum_report_ok: 'Жалоба отправлена',
  forum_report: 'Пожаловаться',
  forum_reply: 'Ответить',
  forum_delete: 'Удалить',
  forum_unban: 'Снять бан',
  forum_ban: 'Забанить',
  forum_views: 'Просмотры',
  forum_replies: 'Ответы',
  forum_like: 'Нравится',
  forum_dislike: 'Не нравится',

  // Composer
  forum_reply_to: 'Ответ для',
  forum_replying_to: 'Ответ к',
  forum_composer_hint: 'Будьте точны. Ссылайтесь на факты. Ссылки приветствуются.',
  forum_composer_placeholder: 'Напишите сообщение…',
  forum_send: 'Отправить',
  forum_more_emoji: 'Больше эмодзи',
  forum_emoji_vip: 'Стикеры',
  forum_attach: 'Прикрепить',
  forum_remove: 'Убрать',
  forum_remove_attachment: 'Убрать вложение',
  forum_post_sent: 'Отправлено',

  // New Topic
  forum_hint_select_topic: 'Выберите тему для чтения и ответа',
  forum_create: 'Создать',
  forum_creating: 'Создаём…',
  forum_topic_title: 'Заголовок',
  forum_topic_title_ph: 'Короткий точный заголовок',
  forum_topic_desc: 'Описание',
  forum_topic_desc_ph: 'Необязательное описание',
  forum_topic_first_msg: 'Первое сообщение',
  forum_topic_first_msg_ph: 'Начните обсуждение фактами, данными и источниками…',

 // QCoin Desk (expanded)
/* -------------------- RU -------------------- */
forum_qcoin_desc:
'Криптовалюта - нового поколения с моделью вознаграждения proof-of-activity.\n\n' +
'Теперь в форуме можно зарабатывать не только активностью, но и прохождением квестов: выполняйте задания и получайте реальную криптовалюту.\n\n' +
'Участники VIP получают двойное вознаграждение ×2, а также дополнительные начисления за просмотры, лайки и активность своих публикаций — их вклад оценивается в Q COIN.\n\n' +
'Система построена на гибридной on-/off-chain-архитектуре с постоянной синхронизацией и готовится к интеграции с новым блокчейном L7 — платформой будущего финансового поколения.\n\n' +
'L7 станет новым финансовым порядком: собственный блокчейн, распределённая экономика и полная децентрализация.\n\n' +
'Следите за активностью, проходите квесты и не упускайте момент — зарабатывайте криптовалюту будущего уже сегодня.',


forum_qcoin_withdraw_note:
  'Блокчейн L7 В РАЗРАБОТКЕ. \n\n' +
  'Вывод станет доступным после запуска блокчейна. \n\n' +
  'Кнопка "ВЫВЕСТИ" станет золотой.',

forum_qcoin_exchange: 'Биржа',
forum_qcoin_withdraw: 'Вывести',
forum_qcoin_open_hint: 'Открыть Q COIN',
forum_qcoin_x2: 'x2',
forum_qcoin_x2_hint: 'VIP+: начисление ×2',

forum_inbox: 'Ответы мне',
forum_inbox_title: 'Ответы на ваши сообщения',
forum_inbox_empty: 'Новых ответов нет',

}

/* -------------------- UK -------------------- */
const FORUM_UI_UK = {
  // Admin
  forum_admin: 'АДМІН',
  forum_admin_active: 'АДМІН',
  forum_admin_exit: 'вийти з режиму адміна',
  forum_admin_pass: 'Пароль адміністратора',
  forum_activate: 'Активувати',

  // Global / Dialogs
  forum_cancel: 'Скасувати',
  forum_close: 'Закрити',
  forum_save: 'Зберегти',
  forum_total: 'усього',
  forum_need_auth: 'Потрібна авторизація',
  forum_auth_required: 'Потрібен вхід',
  forum_not_signed: 'Не ввійшли',

  // Account / Profile
  forum_account: 'Обліковий запис',
  forum_account_settings: 'Налаштування облікового запису',
  forum_profile_nickname: 'Нікнейм',
  forum_profile_nickname_ph: 'Як до вас звертатися?',
  forum_profile_avatar: 'Аватар',
  forum_avatar_vip: 'VIP+ аватари',

  // VIP+
forum_vip_only: 'Лише для VIP+',
forum_vip_plus: 'VIP+',
forum_vip_active: 'VIP+ активний',
forum_vip_thanks: 'Дякуємо за підтримку!',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ надає преміум-аватари й емодзі, можливість надсилати голосові повідомлення та зображення, а також пришвидшує нарахування Q COIN (×2). Додатково VIP+ знімає ліміт з AI-бокса аналітики на сторінці Exchange — відкриває високоточні прогнози та глибоку аналітику. Будьте помітними й накопичуйте баланс швидше з VIP+.',
forum_vip_pay: 'Сплатити',
forum_vip_pay_fail: 'Оплату не виконано. Спробуйте пізніше.',
forum_vip_required: 'Потрібен VIP+',
forum_vip_already_active: 'VIP уже активний',
forum_vip_activated: 'VIP активовано',
forum_vip_pending: 'Платіж обробляється…',


  // Header / Search / Sort
  forum_search_ph: 'Введіть ключове слово…',
  forum_sort: 'Сортувати',
  forum_sort_new: 'Нові',
  forum_sort_top: 'Топ',
  forum_sort_views: 'Перегляди',
  forum_sort_likes: 'Вподобання',
  forum_sort_replies: 'Відповіді',
  forum_search_empty: 'Нічого не знайдено',

  // Navigation
  forum_back: 'Назад',
  forum_home: 'На головну',

  // Threads / Posts
  forum_open_replies: 'Відповіді',
  forum_no_posts_yet: 'Повідомлень ще немає',
  forum_report_ok: 'Скаргу надіслано',
  forum_report: 'Поскаржитися',
  forum_reply: 'Відповісти',
  forum_delete: 'Видалити',
  forum_unban: 'Розблокувати',
  forum_ban: 'Заблокувати',
  forum_views: 'Перегляди',
  forum_replies: 'Відповіді',
  forum_like: 'Подобається',
  forum_dislike: 'Не подобається',

  // Composer
  forum_reply_to: 'Відповідь для',
  forum_replying_to: 'Відповідь на',
  forum_composer_hint: 'Будьте точні. Посилайтеся на факти. Посилання вітаються.',
  forum_composer_placeholder: 'Напишіть повідомлення…',
  forum_send: 'Надіслати',
  forum_more_emoji: 'Більше емодзі',
  forum_emoji_vip: 'Стікери',
  forum_attach: 'Прикріпити',
  forum_remove: 'Прибрати',
  forum_remove_attachment: 'Прибрати вкладення',
  forum_post_sent: 'Надіслано',

  // New Topic
  forum_hint_select_topic: 'Оберіть тему для читання та відповіді',
  forum_create: 'Створити',
  forum_creating: 'Створюємо…',
  forum_topic_title: 'Заголовок',
  forum_topic_title_ph: 'Короткий точний заголовок',
  forum_topic_desc: 'Опис',
  forum_topic_desc_ph: 'Необов’язковий опис',
  forum_topic_first_msg: 'Перше повідомлення',
  forum_topic_first_msg_ph: 'Почніть дискусію фактами, даними і джерелами…',

/* -------------------- UK (Українська) -------------------- */
forum_qcoin_desc:
'Криптовалюта - нового покоління з моделлю винагороди proof-of-activity.\n\n' +
'Тепер у форумі можна заробляти не лише активністю, а й проходженням квестів: виконуйте завдання та отримуйте реальну криптовалюту.\n\n' +
'Учасники VIP отримують подвійну винагороду ×2, а також додаткові нарахування за перегляди, вподобайки та активність своїх публікацій — їхній внесок оцінюється у Q COIN.\n\n' +
'Система побудована на гібридній on-/off-chain архітектурі з постійною синхронізацією та готується до інтеграції з новим блокчейном L7 — платформою майбутнього фінансового покоління.\n\n' +
'L7 стане новим фінансовим порядком: власний блокчейн, розподілена економіка та повна децентралізація.\n\n' +
'Стежте за активністю, проходьте квести й не втрачайте момент — заробляйте криптовалюту майбутнього вже сьогодні.',
forum_qcoin_withdraw_note:
'Блокчейн L7 У РОЗРОБЦІ. \n\n' +
'Виведення стане доступним після запуску блокчейна. \n\n' +
'Кнопка "ВИВЕСТИ" стане золотою.',

forum_qcoin_exchange: 'Біржа',
forum_qcoin_withdraw: 'Вивести',
forum_qcoin_open_hint: 'Відкрити Q COIN',
forum_qcoin_x2: 'x2',
forum_qcoin_x2_hint: 'VIP+: нарахування ×2',

forum_inbox: 'Відповіді мені',
forum_inbox_title: 'Відповіді на ваші повідомлення',
forum_inbox_empty: 'Нових відповідей немає',

}

/* -------------------- ES -------------------- */
const FORUM_UI_ES = {
  // Admin
  forum_admin: 'ADMIN',
  forum_admin_active: 'ADMIN',
  forum_admin_exit: 'salir de admin',
  forum_admin_pass: 'Contraseña de administrador',
  forum_activate: 'Activar',

  // Global / Dialogs
  forum_cancel: 'Cancelar',
  forum_close: 'Cerrar',
  forum_save: 'Guardar',
  forum_total: 'total',
  forum_need_auth: 'Se requiere autorización',
  forum_auth_required: 'Se requiere iniciar sesión',
  forum_not_signed: 'Sin iniciar sesión',

  // Account / Profile
  forum_account: 'Cuenta',
  forum_account_settings: 'Ajustes de la cuenta',
  forum_profile_nickname: 'Apodo',
  forum_profile_nickname_ph: '¿Cómo te llamamos?',
  forum_profile_avatar: 'Avatar',
  forum_avatar_vip: 'Avatares VIP+',

  // VIP+
forum_vip_only: 'Solo VIP+',
forum_vip_plus: 'VIP+',
forum_vip_active: 'VIP+ activo',
forum_vip_thanks: '¡Gracias por apoyar!',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ desbloquea avatares y emoji premium, permite enviar mensajes de voz e imágenes y acelera el crecimiento de Q COIN (acumulación ×2). Además, VIP+ elimina el límite del cuadro de Analítica IA en la página Exchange para acceder a pronósticos de alta fidelidad y análisis profundos. Destácate y aumenta tu saldo más rápido con VIP+.',
forum_vip_pay: 'Pagar',
forum_vip_pay_fail: 'El pago falló. Inténtalo de nuevo más tarde.',
forum_vip_required: 'Se requiere VIP+',
forum_vip_already_active: 'El VIP ya está activo',
forum_vip_activated: 'VIP activado',
forum_vip_pending: 'Pago en proceso…',


  // Header / Search / Sort
  forum_search_ph: 'Introduce una palabra clave…',
  forum_sort: 'Ordenar',
  forum_sort_new: 'Más nuevo',
  forum_sort_top: 'Top',
  forum_sort_views: 'Vistas',
  forum_sort_likes: 'Me gusta',
  forum_sort_replies: 'Respuestas',
  forum_search_empty: 'No se encontró nada',

  // Navigation
  forum_back: 'Volver',
  forum_home: 'Inicio',

  // Threads / Posts
  forum_open_replies: 'Respuestas',
  forum_no_posts_yet: 'Aún no hay mensajes',
  forum_report_ok: 'Reporte enviado',
  forum_report: 'Reportar',
  forum_reply: 'Responder',
  forum_delete: 'Eliminar',
  forum_unban: 'Quitar bloqueo',
  forum_ban: 'Bloquear',
  forum_views: 'Vistas',
  forum_replies: 'Respuestas',
  forum_like: 'Me gusta',
  forum_dislike: 'No me gusta',

  // Composer
  forum_reply_to: 'Responder a',
  forum_replying_to: 'Respondiendo a',
  forum_composer_hint: 'Sé preciso. Basa en evidencias. Los enlaces son bienvenidos.',
  forum_composer_placeholder: 'Escribe un mensaje…',
  forum_send: 'Enviar',
  forum_more_emoji: 'Más emoji',
  forum_emoji_vip: 'Pegatinas',
  forum_attach: 'Adjuntar',
  forum_remove: 'Quitar',
  forum_remove_attachment: 'Quitar adjunto',
  forum_post_sent: 'Enviado',

  // New Topic
  forum_hint_select_topic: 'Elige un tema para leer y responder',
  forum_create: 'Crear',
  forum_creating: 'Creando…',
  forum_topic_title: 'Título',
  forum_topic_title_ph: 'Título corto y preciso',
  forum_topic_desc: 'Descripción',
  forum_topic_desc_ph: 'Descripción opcional',
  forum_topic_first_msg: 'Primer mensaje',
  forum_topic_first_msg_ph: 'Inicia con hechos, datos y fuentes…',

/* -------------------- ES (Español) -------------------- */
forum_qcoin_desc:
'Criptomoneda - de nueva generación con un modelo de recompensas proof-of-activity.\n\n' +
'Ahora en el foro puedes ganar no solo con tu actividad, sino también completando misiones: cumple las tareas y recibe criptomoneda real.\n\n' +
'Los miembros VIP obtienen recompensas dobles ×2, además de acreditaciones adicionales por las vistas, los “me gusta” y la actividad de sus publicaciones — su contribución se valora en Q COIN.\n\n' +
'El sistema está construido sobre una arquitectura híbrida on-/off-chain con sincronización continua y se prepara para integrarse con la nueva blockchain L7 — una plataforma para la próxima generación financiera.\n\n' +
'L7 se convertirá en un nuevo orden financiero: blockchain propia, economía distribuida y descentralización total.\n\n' +
'Mantén tu actividad, completa misiones y no pierdas el momento — gana hoy la criptomoneda del futuro.',
forum_qcoin_withdraw_note:
'La cadena L7 ESTÁ EN DESARROLLO. \n\n' +
'Los retiros estarán disponibles tras el lanzamiento de la cadena. \n\n' +
'El botón "RETIRAR" se volverá dorado.',

forum_qcoin_exchange: 'Exchange',
forum_qcoin_withdraw: 'Retirar',
forum_qcoin_open_hint: 'Abrir Q COIN',
forum_qcoin_x2: 'x2',
forum_qcoin_x2_hint: 'VIP+: acumulación ×2',

forum_inbox: 'Respuestas para mí',
forum_inbox_title: 'Respuestas a tus mensajes',
forum_inbox_empty: 'No hay respuestas nuevas',

}

/* -------------------- ZH (简体) -------------------- */
const FORUM_UI_ZH = {
  // Admin
  forum_admin: '管理员',
  forum_admin_active: '管理员',
  forum_admin_exit: '退出管理员模式',
  forum_admin_pass: '管理员密码',
  forum_activate: '激活',

  // Global / Dialogs
  forum_cancel: '取消',
  forum_close: '关闭',
  forum_save: '保存',
  forum_total: '合计',
  forum_need_auth: '需要授权',
  forum_auth_required: '需要登录',
  forum_not_signed: '未登录',

  // Account / Profile
  forum_account: '账号',
  forum_account_settings: '账号设置',
  forum_profile_nickname: '昵称',
  forum_profile_nickname_ph: '我们如何称呼你？',
  forum_profile_avatar: '头像',
  forum_avatar_vip: 'VIP+ 头像',

  // VIP+
forum_vip_only: '仅限 VIP+',
forum_vip_plus: 'VIP+',
forum_vip_active: 'VIP+ 已激活',
forum_vip_thanks: '感谢支持！',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ 解锁高级头像与表情，可发送语音消息与图片，并将 Q COIN 的累计速度提升至 ×2。此外，VIP+ 还取消 Exchange 页面 AI 分析框的限制，提供高保真预测与深度洞察。更醒目、更高效地增长余额，尽在 VIP+。',
forum_vip_pay: '支付',
forum_vip_pay_fail: '支付失败，请稍后重试。',
forum_vip_required: '需要 VIP+',
forum_vip_already_active: 'VIP 已处于激活状态',
forum_vip_activated: 'VIP 已激活',
forum_vip_pending: '支付处理中…',


  // Header / Search / Sort
  forum_search_ph: '输入关键字…',
  forum_sort: '排序',
  forum_sort_new: '最新',
  forum_sort_top: '热门',
  forum_sort_views: '浏览量',
  forum_sort_likes: '点赞',
  forum_sort_replies: '回复数',
  forum_search_empty: '未找到内容',

  // Navigation
  forum_back: '返回',
  forum_home: '首页',

  // Threads / Posts
  forum_open_replies: '回复',
  forum_no_posts_yet: '暂无消息',
  forum_report_ok: '已提交举报',
  forum_report: '举报',
  forum_reply: '回复',
  forum_delete: '删除',
  forum_unban: '解除封禁',
  forum_ban: '封禁',
  forum_views: '浏览量',
  forum_replies: '回复',
  forum_like: '赞',
  forum_dislike: '踩',

  // Composer
  forum_reply_to: '回复给',
  forum_replying_to: '正在回复',
  forum_composer_hint: '请准确、基于证据。欢迎附上链接。',
  forum_composer_placeholder: '写点什么…',
  forum_send: '发送',
  forum_more_emoji: '更多表情',
  forum_emoji_vip: '贴纸',
  forum_attach: '附件',
  forum_remove: '移除',
  forum_remove_attachment: '移除附件',
  forum_post_sent: '已发送',

  // New Topic
  forum_hint_select_topic: '选择一个主题以阅读和回复',
  forum_create: '创建',
  forum_creating: '正在创建…',
  forum_topic_title: '标题',
  forum_topic_title_ph: '简短而准确的标题',
  forum_topic_desc: '描述',
  forum_topic_desc_ph: '可选描述',
  forum_topic_first_msg: '首条消息',
  forum_topic_first_msg_ph: '用事实、数据与来源开启讨论…',

/* -------------------- ZH (简体) -------------------- */
forum_qcoin_desc:
'新一代加密货币，采用 proof-of-activity 奖励模型。\n\n' +
'现在在论坛中，不仅可以靠活跃度赚钱，还可以通过完成任务（quests）：完成任务即可获得真正的加密货币。\n\n' +
'VIP 用户可获得双倍奖励 ×2，并因其帖子获得的浏览、点赞和互动享有额外计入——其贡献以 Q COIN 计量。\n\n' +
'系统基于混合式 on-/off-chain 架构并持续同步，正准备与全新的 L7 区块链集成——面向下一代金融的平台。\n\n' +
'L7 将成为新的金融秩序：自有区块链、分布式经济与完全去中心化。\n\n' +
'保持活跃、完成任务，不要错过时机——从今天起赚取未来的加密货币。',

forum_qcoin_withdraw_note:
'L7 区块链正在开发中。 \n\n' +
'区块链上线后将开放提现。 \n\n' +
'“提现”按钮将变为金色。',

forum_qcoin_exchange: '交易所',
forum_qcoin_withdraw: '提取',
forum_qcoin_open_hint: '打开 Q COIN',
forum_qcoin_x2: 'x2',
forum_qcoin_x2_hint: 'VIP+：计息 ×2',

forum_inbox: '回复给我',
forum_inbox_title: '给你的回复',
forum_inbox_empty: '暂无新回复',


  // Inbox
  forum_inbox: '给我的回复',
  forum_inbox_title: '针对你消息的回复',
  forum_inbox_empty: '暂无新回复',
}

/* -------------------- AR -------------------- */
const FORUM_UI_AR = {
  // Admin
  forum_admin: 'مشرف',
  forum_admin_active: 'مشرف',
  forum_admin_exit: 'الخروج من وضع المشرف',
  forum_admin_pass: 'كلمة مرور المشرف',
  forum_activate: 'تفعيل',

  // Global / Dialogs
  forum_cancel: 'إلغاء',
  forum_close: 'إغلاق',
  forum_save: 'حفظ',
  forum_total: 'الإجمالي',
  forum_need_auth: 'يلزم تفويض',
  forum_auth_required: 'يلزم تسجيل الدخول',
  forum_not_signed: 'غير مسجل الدخول',

  // Account / Profile
  forum_account: 'الحساب',
  forum_account_settings: 'إعدادات الحساب',
  forum_profile_nickname: 'الاسم المستعار',
  forum_profile_nickname_ph: 'بماذا نناديك؟',
  forum_profile_avatar: 'الصورة الرمزية',
  forum_avatar_vip: 'صور VIP+',

  // VIP+
forum_vip_only: 'خاص بـ VIP+',
forum_vip_plus: 'VIP+',
forum_vip_active: 'VIP+ مُفعّل',
forum_vip_thanks: 'شكرًا على دعمك!',
forum_vip_title: 'VIP+',
forum_vip_desc: 'يوفّر VIP+ صورًا رمزية ورموزًا تعبيرية مميزة، وإرسال رسائل صوتية وصور، ويمنح معدل تراكم أسرع لعملة Q COIN (×2). كما يزيل VIP+ حدّ صندوق تحليلات الذكاء الاصطناعي في صفحة Exchange لتصل إلى توقعات عالية الدقة ورؤى معمّقة. تميّز ونمِّ رصيدك بسرعة أكبر مع VIP+.',
forum_vip_pay: 'ادفع',
forum_vip_pay_fail: 'فشل الدفع. حاول لاحقًا.',
forum_vip_required: 'يتطلب VIP+',
forum_vip_already_active: 'VIP مفعّل بالفعل',
forum_vip_activated: 'تم تفعيل VIP',
forum_vip_pending: 'الدفع قيد المعالجة…',


  // Header / Search / Sort
  forum_search_ph: 'أدخل كلمة مفتاحية…',
  forum_sort: 'فرز',
  forum_sort_new: 'الأحدث',
  forum_sort_top: 'الأعلى',
  forum_sort_views: 'المشاهدات',
  forum_sort_likes: 'الإعجابات',
  forum_sort_replies: 'الردود',
  forum_search_empty: 'لا توجد نتائج',

  // Navigation
  forum_back: 'رجوع',
  forum_home: 'الصفحة الرئيسية',

  // Threads / Posts
  forum_open_replies: 'الردود',
  forum_no_posts_yet: 'لا رسائل بعد',
  forum_report_ok: 'تم إرسال البلاغ',
  forum_report: 'إبلاغ',
  forum_reply: 'رد',
  forum_delete: 'حذف',
  forum_unban: 'إلغاء الحظر',
  forum_ban: 'حظر',
  forum_views: 'المشاهدات',
  forum_replies: 'الردود',
  forum_like: 'إعجاب',
  forum_dislike: 'عدم إعجاب',

  // Composer
  forum_reply_to: 'رد على',
  forum_replying_to: 'جارٍ الرد على',
  forum_composer_hint: 'كن دقيقًا واستند إلى الأدلة. الروابط مُرحب بها.',
  forum_composer_placeholder: 'اكتب رسالة…',
  forum_send: 'إرسال',
  forum_emoji_vip: 'الملصقات',
  forum_attach: 'إرفاق',
  forum_remove: 'إزالة',
  forum_remove_attachment: 'إزالة المرفق',
  forum_post_sent: 'تم الإرسال',

  // New Topic
  forum_hint_select_topic: 'اختر موضوعًا للقراءة والرد',
  forum_create: 'إنشاء',
  forum_creating: 'جارٍ الإنشاء…',
  forum_topic_title: 'العنوان',
  forum_topic_title_ph: 'عنوان قصير ودقيق',
  forum_topic_desc: 'الوصف',
  forum_topic_desc_ph: 'وصف اختياري',
  forum_topic_first_msg: 'أول رسالة',
  forum_topic_first_msg_ph: 'ابدأ النقاش بالحقائق والبيانات والمصادر…',

/* -------------------- AR (العربية) -------------------- */
forum_qcoin_desc:
'عملة مشفّرة من الجيل الجديد بنموذج مكافآت proof-of-activity.\n\n' +
'يمكنك الآن الكسب في المنتدى ليس فقط عبر نشاطك، بل أيضًا عبر إتمام المهمات: أنجز المهام واحصل على عملة مشفّرة حقيقية.\n\n' +
'يحصل أعضاء VIP على مكافآت مضاعفة ×2، إضافةً إلى اعتمادات إضافية مقابل المشاهدات والإعجابات وتفاعل منشوراتهم — ويُقيَّم إسهامهم بعملة Q COIN.\n\n' +
'تقوم المنظومة على بنية هجينة تجمع بين on-/off-chain مع مزامنة مستمرة، وتستعد للاندماج مع سلسلة الكتل الجديدة L7 — منصة الجيل المالي القادم.\n\n' +
'ستصبح L7 نظامًا ماليًا جديدًا: سلسلة كتل خاصة، واقتصاد موزّع، ولامركزية كاملة.\n\n' +
'حافظ على نشاطك، أكمِل المهمات، ولا تفوّت الفرصة — ابدأ اليوم بكسب عملة المستقبل المشفّرة.',

forum_qcoin_withdraw_note:
'سلسلة L7 قيد التطوير. \n\n' +
'سيصبح السحب متاحًا بعد إطلاق سلسلة الكتل. \n\n' +
'سيصبح زر "سَحْب" ذهبيًا.',

forum_qcoin_exchange: 'منصة',
forum_qcoin_withdraw: 'سحب',
forum_qcoin_open_hint: 'فتح Q COIN',
forum_qcoin_x2: 'x2',
forum_qcoin_x2_hint: 'VIP+: احتساب ×2',

forum_inbox: 'الردود عليّ',
forum_inbox_title: 'الردود على رسائلك',
forum_inbox_empty: 'لا ردود جديدة',

}

/* -------------------- TR -------------------- */
const FORUM_UI_TR = {
  // Admin
  forum_admin: 'ADMİN',
  forum_admin_active: 'ADMİN',
  forum_admin_exit: 'admin modundan çık',
  forum_admin_pass: 'Yönetici parolası',
  forum_activate: 'Etkinleştir',

  // Global / Dialogs
  forum_cancel: 'İptal',
  forum_close: 'Kapat',
  forum_save: 'Kaydet',
  forum_total: 'toplam',
  forum_need_auth: 'Yetkilendirme gerekli',
  forum_auth_required: 'Giriş gerekli',
  forum_not_signed: 'Giriş yapılmadı',

  // Account / Profile
  forum_account: 'Hesap',
  forum_account_settings: 'Hesap ayarları',
  forum_profile_nickname: 'Takma ad',
  forum_profile_nickname_ph: 'Sana nasıl hitap edelim?',
  forum_profile_avatar: 'Avatar',
  forum_avatar_vip: 'VIP+ avatarlar',

  // VIP+
forum_vip_only: 'Sadece VIP+',
forum_vip_plus: 'VIP+',
forum_vip_active: 'VIP+ aktif',
forum_vip_thanks: 'Desteğin için teşekkürler!',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+; premium avatarlar ve emojiler, sesli mesaj ve görsel gönderimi, ayrıca Q COIN için daha hızlı birikim (×2) sunar. Ek olarak VIP+, Exchange sayfasındaki Yapay Zekâ Analiz kutusundaki limiti kaldırır; yüksek doğruluklu tahminler ve derin analizlere erişim sağlar. Öne çık ve bakiyeni daha hızlı büyüt: VIP+ ile.',
forum_vip_pay: 'Öde',
forum_vip_pay_fail: 'Ödeme başarısız. Daha sonra tekrar deneyin.',
forum_vip_required: 'VIP+ gerekli',
forum_vip_already_active: 'VIP zaten aktif',
forum_vip_activated: 'VIP etkinleştirildi',
forum_vip_pending: 'Ödeme beklemede…',


  // Header / Search / Sort
  forum_search_ph: 'Anahtar kelime gir…',
  forum_sort: 'Sırala',
  forum_sort_new: 'En yeni',
  forum_sort_top: 'Top',
  forum_sort_views: 'Görüntülenme',
  forum_sort_likes: 'Beğeni',
  forum_sort_replies: 'Yanıt',
  forum_search_empty: 'Sonuç yok',

  // Navigation
  forum_back: 'Geri',
  forum_home: 'Ana sayfa',

  // Threads / Posts
  forum_open_replies: 'Yanıtlar',
  forum_no_posts_yet: 'Henüz mesaj yok',
  forum_report_ok: 'Şikayet gönderildi',
  forum_report: 'Şikayet et',
  forum_reply: 'Yanıtla',
  forum_delete: 'Sil',
  forum_unban: 'Yasağı kaldır',
  forum_ban: 'Yasakla',
  forum_views: 'Görüntülenme',
  forum_replies: 'Yanıt',
  forum_like: 'Beğen',
  forum_dislike: 'Beğenme',

  // Composer
  forum_reply_to: 'Şuna yanıtla',
  forum_replying_to: 'Yanıtlıyor',
  forum_composer_hint: 'Kesin ol. Kanıta dayandır. Bağlantılar hoş karşılanır.',
  forum_composer_placeholder: 'Bir mesaj yaz…',
  forum_send: 'Gönder',
  forum_more_emoji: 'Daha fazla emoji',
  forum_emoji_vip: 'Çıkartmalar',
  forum_attach: 'Ekle',
  forum_remove: 'Kaldır',
  forum_remove_attachment: 'Eki kaldır',
  forum_post_sent: 'Gönderildi',

  // New Topic
  forum_hint_select_topic: 'Okumak ve yanıtlamak için bir konu seç',
  forum_create: 'Oluştur',
  forum_creating: 'Oluşturuluyor…',
  forum_topic_title: 'Başlık',
  forum_topic_title_ph: 'Kısa ve net başlık',
  forum_topic_desc: 'Açıklama',
  forum_topic_desc_ph: 'İsteğe bağlı açıklama',
  forum_topic_first_msg: 'İlk mesaj',
  forum_topic_first_msg_ph: 'Tartışmayı gerçekler, veriler ve kaynaklarla başlat…',

/* -------------------- TR (Türkçe) -------------------- */
forum_qcoin_desc:
'Proof-of-activity ödül modeliyle yeni nesil kripto para birimi.\n\n' +
'Artık forumda yalnızca aktiviteyle değil, görevleri tamamlayarak da kazanabilirsiniz: görevleri bitirin ve gerçek kripto para elde edin.\n\n' +
'VIP üyeler ×2 çift ödül alır ve gönderilerinin görüntülenmeleri, beğenileri ve etkileşimi için ek tahakkuklardan yararlanır — katkıları Q COIN ile ölçülür.\n\n' +
'Sistem, sürekli senkronizasyona sahip hibrit bir on-/off-chain mimarisi üzerine kuruludur ve yeni L7 blokzinciriyle entegrasyona hazırlanmaktadır — bu, sonraki finansal neslin platformudur.\n\n' +
'L7 yeni bir finansal düzen olacak: kendi blokzinciri, dağıtık ekonomi ve tam merkeziyetsizlik.\n\n' +
'Aktif kalın, görevleri tamamlayın ve fırsatı kaçırmayın — geleceğin kripto parasını bugün kazanın.',

forum_qcoin_withdraw_note:
'L7 blokzinciri GELİŞTİRME AŞAMASINDA. \n\n' +
'Çekimler, blokzinciri yayına girdikten sonra kullanılabilir olacak. \n\n' +
'"ÇEK" düğmesi altın rengine dönecek.',

forum_qcoin_exchange: 'Borsa',
forum_qcoin_withdraw: 'Çek',
forum_qcoin_open_hint: 'Q COIN’i aç',
forum_qcoin_x2: 'x2',
forum_qcoin_x2_hint: 'VIP+: tahakkuk ×2',

forum_inbox: 'Bana yanıtlar',
forum_inbox_title: 'İletilerinize gelen yanıtlar',
forum_inbox_empty: 'Yeni yanıt yok',

}

/* -------------------- MERGE -------------------- */
try {
  Object.assign(dict.en || {}, FORUM_UI_EN)
  Object.assign(dict.ru || {}, FORUM_UI_RU)
  Object.assign(dict.uk || {}, FORUM_UI_UK)
  Object.assign(dict.es || {}, FORUM_UI_ES)
  Object.assign(dict.zh || {}, FORUM_UI_ZH)
  Object.assign(dict.ar || {}, FORUM_UI_AR)
  Object.assign(dict.tr || {}, FORUM_UI_TR)
} catch (_) {}


const EMOJI_CATS_EN = {
  forum_emoji_cat_people:     'People',
  forum_emoji_cat_animals:    'Animals',
  forum_emoji_cat_food:       'Food',
  forum_emoji_cat_activities: 'Activities',
  forum_emoji_cat_travel:     'Travel',
  forum_emoji_cat_objects:    'Objects',
  forum_emoji_cat_symbols:    'Symbols',
  forum_emoji_cat_smileys:    "Faces",
  forum_emoji_cat_hands:      "Hands",
  forum_tab_stickers: "Stickers",
  forum_tab_emoji: "Emoji", 
  forum_emoji_cat_flags: "Flags",
    forum_err_no_user: "User not specified.",
    forum_err_forbidden: "Not allowed.",
    forum_err_empty_text: "Text is empty.",
    forum_err_not_found: "Item not found.",
    forum_err_unknown_action: "Unknown action.",
    forum_err_mutate_failed: "Failed to apply changes.",
    forum_err_internal: "Internal error.",
    forum_ok_post_edited: "Post updated.",
    forum_ok_post_deleted: "Post deleted.",
    forum_ok_topic_deleted: "Topic deleted.",
    forum_edit_mode: "Edit mode", 
 forum_create_ok: "Created successfully",
forum_error_delete: "Error deleting",
forum_delete_ok: "Deleted successfully",
    
};

const EMOJI_CATS_RU = {
  forum_emoji_cat_people:     'Люди',
  forum_emoji_cat_animals:    'Животные',
  forum_emoji_cat_food:       'Еда',
  forum_emoji_cat_activities: 'Активности',
  forum_emoji_cat_travel:     'Путешествия',
  forum_emoji_cat_objects:    'Предметы',
  forum_emoji_cat_symbols:    'Символы',
  forum_emoji_cat_smileys:    "Лица",
  forum_emoji_cat_hands:      "Руки",
  forum_tab_stickers: "Стикеры",
  forum_tab_emoji: "Эмодзи",
  forum_emoji_cat_flags: "Флаги", 
    forum_err_no_user: "Не указан пользователь.",
    forum_err_forbidden: "Нет прав на действие.",
    forum_err_empty_text: "Текст пуст.",
    forum_err_not_found: "Объект не найден.",
    forum_err_unknown_action: "Неизвестное действие.",
    forum_err_mutate_failed: "Не удалось применить изменения.",
    forum_err_internal: "Внутренняя ошибка.",
    forum_ok_post_edited: "Пост обновлён.",
    forum_ok_post_deleted: "Пост удалён.",
    forum_ok_topic_deleted: "Тема удалена.",
    forum_edit_mode: "Режим редактирования",  
 forum_create_ok: "Создано успешно",
forum_error_delete: "Ошибка при удалении",
forum_delete_ok: "Удалено успешно",
    
};

const EMOJI_CATS_UK = {
  forum_emoji_cat_people:     'Люди',
  forum_emoji_cat_animals:    'Тварини',
  forum_emoji_cat_food:       'Їжа',
  forum_emoji_cat_activities: 'Активності',
  forum_emoji_cat_travel:     'Подорожі',
  forum_emoji_cat_objects:    'Предмети',
  forum_emoji_cat_symbols:    'Символи',
  forum_emoji_cat_smileys:    "Обличчя",
  forum_emoji_cat_hands:      "Руки",
  forum_tab_stickers: "Стікери",
  forum_tab_emoji: "Емодзі", 
  forum_emoji_cat_flags: "Прапори", 
    forum_err_no_user: "Користувача не вказано.",
    forum_err_forbidden: "Немає прав для дії.",
    forum_err_empty_text: "Текст порожній.",
    forum_err_not_found: "Об'єкт не знайдено.",
    forum_err_unknown_action: "Невідома дія.",
    forum_err_mutate_failed: "Не вдалося застосувати зміни.",
    forum_err_internal: "Внутрішня помилка.",
    forum_ok_post_edited: "Пост оновлено.",
    forum_ok_post_deleted: "Пост видалено.",
    forum_ok_topic_deleted: "Тему видалено.",
    forum_edit_mode: "Режим редагування",
forum_create_ok: "Успішно створено",
forum_error_delete: "Помилка під час видалення",
forum_delete_ok: "Успішно видалено",

};

const EMOJI_CATS_ES = {
  forum_emoji_cat_people:     'Personas',
  forum_emoji_cat_animals:    'Animales',
  forum_emoji_cat_food:       'Comida',
  forum_emoji_cat_activities: 'Actividades',
  forum_emoji_cat_travel:     'Viajes',
  forum_emoji_cat_objects:    'Objetos',
  forum_emoji_cat_symbols:    'Símbolos',
  forum_emoji_cat_smileys:    "Caras",
  forum_emoji_cat_hands: "Manos",
  forum_tab_stickers: "Stickers",
  forum_tab_emoji: "Emojis",
  forum_emoji_cat_flags: "Banderas",
    forum_err_no_user: "No se especificó el usuario.",
    forum_err_forbidden: "No tienes permisos para esta acción.",
    forum_err_empty_text: "El texto está vacío.",
    forum_err_not_found: "Elemento no encontrado.",
    forum_err_unknown_action: "Acción desconocida.",
    forum_err_mutate_failed: "No se pudieron aplicar los cambios.",
    forum_err_internal: "Error interno.",
    forum_ok_post_edited: "Publicación actualizada.",
    forum_ok_post_deleted: "Publicación eliminada.",
    forum_ok_topic_deleted: "Tema eliminado.",
    forum_edit_mode: "Modo de edición",
forum_create_ok: "Creado con éxito",
forum_error_delete: "Error al eliminar",
forum_delete_ok: "Eliminado con éxito",

};

const EMOJI_CATS_ZH = { // 简体中文
  forum_emoji_cat_people:     '人物',
  forum_emoji_cat_animals:    '动物',
  forum_emoji_cat_food:       '食物',
  forum_emoji_cat_activities: '活动',
  forum_emoji_cat_travel:     '旅行',
  forum_emoji_cat_objects:    '物品',
  forum_emoji_cat_symbols:    '符号',
  forum_emoji_cat_smileys:    "面孔",
  forum_emoji_cat_hands:      "手",
  forum_tab_stickers: "贴纸",
  forum_tab_emoji: "表情符号", 
  forum_emoji_cat_flags: "旗帜", 
    forum_err_no_user: "未指定用户。",
    forum_err_forbidden: "无权执行此操作。",
    forum_err_empty_text: "文本为空。",
    forum_err_not_found: "未找到条目。",
    forum_err_unknown_action: "未知操作。",
    forum_err_mutate_failed: "应用更改失败。",
    forum_err_internal: "内部错误。",
    forum_ok_post_edited: "帖子已更新。",
    forum_ok_post_deleted: "帖子已删除。",
    forum_ok_topic_deleted: "主题已删除。",
    forum_edit_mode: "编辑模式" ,
forum_create_ok: "已成功创建",
forum_error_delete: "删除时出错",
forum_delete_ok: "已成功删除",

};

const EMOJI_CATS_AR = { // RTL
  forum_emoji_cat_people:     'الأشخاص',
  forum_emoji_cat_animals:    'الحيوانات',
  forum_emoji_cat_food:       'الطعام',
  forum_emoji_cat_activities: 'الأنشطة',
  forum_emoji_cat_travel:     'السفر',
  forum_emoji_cat_objects:    'الأشياء',
  forum_emoji_cat_symbols:    'الرموز',
  forum_emoji_cat_smileys:    "وجوه" ,
  forum_emoji_cat_hands:      "الأيدي",
  forum_tab_stickers: "ملصقات",
  forum_tab_emoji: "رموز تعبيرية",
  forum_emoji_cat_flags: "الأعلام" ,
    forum_err_no_user: "لم يتم تحديد المستخدم.",
    forum_err_forbidden: "لا تملك صلاحية لهذا الإجراء.",
    forum_err_empty_text: "النص فارغ.",
    forum_err_not_found: "العنصر غير موجود.",
    forum_err_unknown_action: "إجراء غير معروف.",
    forum_err_mutate_failed: "فشل تطبيق التغييرات.",
    forum_err_internal: "خطأ داخلي.",
    forum_ok_post_edited: "تم تحديث المشاركة.",
    forum_ok_post_deleted: "تم حذف المشاركة.",
    forum_ok_topic_deleted: "تم حذف الموضوع.",
    forum_edit_mode: "وضع التحرير" ,
forum_create_ok: "تم الإنشاء بنجاح",
forum_error_delete: "حدث خطأ أثناء الحذف",
forum_delete_ok: "تم الحذف بنجاح",

};

const EMOJI_CATS_TR = {
  forum_emoji_cat_people:     'İnsanlar',
  forum_emoji_cat_animals:    'Hayvanlar',
  forum_emoji_cat_food:       'Yiyecek',
  forum_emoji_cat_activities: 'Etkinlikler',
  forum_emoji_cat_travel:     'Seyahat',
  forum_emoji_cat_objects:    'Nesneler',
  forum_emoji_cat_symbols:    'Semboller',
  forum_emoji_cat_smileys:    "Yüzler",
  forum_emoji_cat_hands:      "Eller",

  forum_tab_stickers: "Çıkartmalar",
  forum_tab_emoji: "Emojiler",
  forum_emoji_cat_flags: "Bayraklar",
    forum_err_no_user: "Kullanıcı belirtilmedi.",
    forum_err_forbidden: "Bu işlem için yetkiniz yok.",
    forum_err_empty_text: "Metin boş.",
    forum_err_not_found: "Öğe bulunamadı.",
    forum_err_unknown_action: "Bilinmeyen işlem.",
    forum_err_mutate_failed: "Değişiklikler uygulanamadı.",
    forum_err_internal: "Dahili hata.",
    forum_ok_post_edited: "Gönderi güncellendi.",
    forum_ok_post_deleted: "Gönderi silindi.",
    forum_ok_topic_deleted: "Konu silindi.",
    forum_edit_mode: "Düzenleme modu", 
forum_create_ok: "Başarıyla oluşturuldu",
forum_error_delete: "Silme hatası",
forum_delete_ok: "Başarıyla silindi",

};

/* -------------------- MERGE (append without removing anything) -------------------- */
try {
  Object.assign(dict.en, EMOJI_CATS_EN);
  Object.assign(dict.ru, EMOJI_CATS_RU);
  Object.assign(dict.uk, EMOJI_CATS_UK);
  Object.assign(dict.es, EMOJI_CATS_ES);
  Object.assign(dict.zh, EMOJI_CATS_ZH);
  Object.assign(dict.ar, EMOJI_CATS_AR);
  Object.assign(dict.tr, EMOJI_CATS_TR);
} catch (e) {}
 
const FORUM_NEWS_EN = {
  forum_title: 'Forum',
  nick_free: "Username is available",
  nick_taken: "Username is taken",
  quest_do: "START" ,
  quest_open: "earn",
  quest_reward: "REWARD",
  quest_tasks_done: "Complete the tasks",
  quest_done: "DONE",
  quest_card_1: "• Quantum Universe •",
  quest_card_2: "• Crypto Run •",
  quest_card_3: "• TeleGo •" ,
  quest_card_4: "• SpaceX •" ,
  quest_card_5: "• Tik Token •" ,
  quest_card_6: "• Quest Tube •" ,
  quest_card_7: "• Crypto Shopping •" ,  
  quest_card_8: "• Crypto Game •" ,
  quest_card_9: "• Web Surfing •" ,
  quest_card_10: "• Instarted •" ,
  quest_card_11: "" ,
  quest_card_12: "" ,
  quest_card_13: "" ,
  quest_card_14: "" ,
  quest_card_15: "" ,
  quest_card_16: "" ,
  quest_card_17: "" ,
  quest_card_18: "" ,
  quest_card_19: "" ,
  quest_card_20: "" ,
  quest_card_21: "" ,
  quest_card_22: "" ,
  quest_card_23: "" ,
  quest_card_24: "" ,
  quest_card_25: "" ,
  quest_card_26: "" ,
  quest_card_27: "" ,  
  quest_card_28: "" ,
  quest_card_29: "" ,
  quest_card_30: "" ,
  quest_card_31: "" ,
  quest_card_32: "" ,
  quest_card_33: "" ,
  quest_card_34: "" ,
  quest_card_35: "" ,
  quest_card_36: "" ,
  quest_card_37: "" ,
  quest_card_38: "" ,
  quest_card_39: "" ,
  quest_card_40: "" ,
}

/* -------------------- RU -------------------- */
const FORUM_NEWS_RU = {
   forum_title: 'Форум',
   nick_free: "Ник свободен",
   nick_taken: "Ник уже занят",
   quest_open: "заработать",
   quest_reward: "НАГРАДА",
   quest_tasks_done: "Выполни задания",
   quest_do: "НАЧАТЬ" ,
   quest_done: "ВЫПОНЕНО",
     quest_card_1: "• Quantum Universe •",
  quest_card_2: "• Crypto Run •",
  quest_card_3: "• TeleGo •" ,
  quest_card_4: "• SpaceX •" ,
  quest_card_5: "• Tik Token •" ,
  quest_card_6: "• Quest Tube •" ,
  quest_card_7: "• Crypto Shopping •" ,  
  quest_card_8: "• Crypto Game •" ,
  quest_card_9: "• Web Surfing •" ,
  quest_card_10: "• Instarted •" ,
  quest_card_11: "" ,
  quest_card_12: "" ,
  quest_card_13: "" ,
  quest_card_14: "" ,
  quest_card_15: "" ,
  quest_card_16: "" ,
  quest_card_17: "" ,
  quest_card_18: "" ,
  quest_card_19: "" ,
  quest_card_20: "" ,
  quest_card_21: "" ,
  quest_card_22: "" ,
  quest_card_23: "" ,
  quest_card_24: "" ,
  quest_card_25: "" ,
  quest_card_26: "" ,
  quest_card_27: "" ,  
  quest_card_28: "" ,
  quest_card_29: "" ,
  quest_card_30: "" ,
  quest_card_31: "" ,
  quest_card_32: "" ,
  quest_card_33: "" ,
  quest_card_34: "" ,
  quest_card_35: "" ,
  quest_card_36: "" ,
  quest_card_37: "" ,
  quest_card_38: "" ,
  quest_card_39: "" ,
  quest_card_40: "" ,
}

/* -------------------- UK -------------------- */
const FORUM_NEWS_UK = {
  forum_title: 'Форум',
  nick_free: "Нік вільний",
  nick_taken: "Нік вже зайнятий",
  quest_open: "заробити",
  quest_reward: "НАГОРОДА",
  quest_tasks_done: "Виконай завдання",
  quest_do: "ПОЧАТИ" ,
  quest_done: "ВИКОНАНО",
    quest_card_1: "• Quantum Universe •",
  quest_card_2: "• Crypto Run •",
  quest_card_3: "• TeleGo •" ,
  quest_card_4: "• SpaceX •" ,
  quest_card_5: "• Tik Token •" ,
  quest_card_6: "• Quest Tube •" ,
  quest_card_7: "• Crypto Shopping •" ,  
  quest_card_8: "• Crypto Game •" ,
  quest_card_9: "• Web Surfing •" ,
  quest_card_10: "• Instarted •" ,
  quest_card_11: "" ,
  quest_card_12: "" ,
  quest_card_13: "" ,
  quest_card_14: "" ,
  quest_card_15: "" ,
  quest_card_16: "" ,
  quest_card_17: "" ,
  quest_card_18: "" ,
  quest_card_19: "" ,
  quest_card_20: "" ,
  quest_card_21: "" ,
  quest_card_22: "" ,
  quest_card_23: "" ,
  quest_card_24: "" ,
  quest_card_25: "" ,
  quest_card_26: "" ,
  quest_card_27: "" ,  
  quest_card_28: "" ,
  quest_card_29: "" ,
  quest_card_30: "" ,
  quest_card_31: "" ,
  quest_card_32: "" ,
  quest_card_33: "" ,
  quest_card_34: "" ,
  quest_card_35: "" ,
  quest_card_36: "" ,
  quest_card_37: "" ,
  quest_card_38: "" ,
  quest_card_39: "" ,
  quest_card_40: "" ,
}

/* -------------------- ES -------------------- */
const FORUM_NEWS_ES = {
  forum_title: 'Foro',
  nick_free: "Nombre de usuario disponible",
  nick_taken: "Nombre de usuario ocupado",
  quest_open: "ganar",
  quest_reward: "RECOMPENSA",
  quest_tasks_done: "Completa las tareas",
  quest_do: "EMPEZAR" ,
  quest_done: "COMPLETADO",
    quest_card_1: "• Quantum Universe •",
  quest_card_2: "• Crypto Run •",
  quest_card_3: "• TeleGo •" ,
  quest_card_4: "• SpaceX •" ,
  quest_card_5: "• Tik Token •" ,
  quest_card_6: "• Quest Tube •" ,
  quest_card_7: "• Crypto Shopping •" ,  
  quest_card_8: "• Crypto Game •" ,
  quest_card_9: "• Web Surfing •" ,
  quest_card_10: "• Instarted •" ,
  quest_card_11: "" ,
  quest_card_12: "" ,
  quest_card_13: "" ,
  quest_card_14: "" ,
  quest_card_15: "" ,
  quest_card_16: "" ,
  quest_card_17: "" ,
  quest_card_18: "" ,
  quest_card_19: "" ,
  quest_card_20: "" ,
  quest_card_21: "" ,
  quest_card_22: "" ,
  quest_card_23: "" ,
  quest_card_24: "" ,
  quest_card_25: "" ,
  quest_card_26: "" ,
  quest_card_27: "" ,  
  quest_card_28: "" ,
  quest_card_29: "" ,
  quest_card_30: "" ,
  quest_card_31: "" ,
  quest_card_32: "" ,
  quest_card_33: "" ,
  quest_card_34: "" ,
  quest_card_35: "" ,
  quest_card_36: "" ,
  quest_card_37: "" ,
  quest_card_38: "" ,
  quest_card_39: "" ,
  quest_card_40: "" ,
}

/* -------------------- ZH (简体) -------------------- */
const FORUM_NEWS_ZH = {
  forum_title: '论坛',
  nick_free: "昵称可用",
  nick_taken: "昵称已被占用",
  quest_open: "赚取",
  quest_reward: "奖励",
  quest_tasks_done: "完成任务",
  quest_do: "开始" ,
  quest_done: "已完成",
    quest_card_1: "• Quantum Universe •",
  quest_card_2: "• Crypto Run •",
  quest_card_3: "• TeleGo •" ,
  quest_card_4: "• SpaceX •" ,
  quest_card_5: "• Tik Token •" ,
  quest_card_6: "• Quest Tube •" ,
  quest_card_7: "• Crypto Shopping •" ,  
  quest_card_8: "• Crypto Game •" ,
  quest_card_9: "• Web Surfing •" ,
  quest_card_10: "• Instarted •" ,
  quest_card_11: "" ,
  quest_card_12: "" ,
  quest_card_13: "" ,
  quest_card_14: "" ,
  quest_card_15: "" ,
  quest_card_16: "" ,
  quest_card_17: "" ,
  quest_card_18: "" ,
  quest_card_19: "" ,
  quest_card_20: "" ,
  quest_card_21: "" ,
  quest_card_22: "" ,
  quest_card_23: "" ,
  quest_card_24: "" ,
  quest_card_25: "" ,
  quest_card_26: "" ,
  quest_card_27: "" ,  
  quest_card_28: "" ,
  quest_card_29: "" ,
  quest_card_30: "" ,
  quest_card_31: "" ,
  quest_card_32: "" ,
  quest_card_33: "" ,
  quest_card_34: "" ,
  quest_card_35: "" ,
  quest_card_36: "" ,
  quest_card_37: "" ,
  quest_card_38: "" ,
  quest_card_39: "" ,
  quest_card_40: "" ,
}

/* -------------------- AR -------------------- */
const FORUM_NEWS_AR = {
  forum_title: 'المنتدى',
  nick_free: "اسم المستخدم متاح",
  nick_taken: "اسم المستخدم مستخدم بالفعل",  
  quest_open: "كسب",
  quest_reward: "مكافأة",
  quest_tasks_done: "أكمل المهام",
  quest_do: "ابدأ" ,
  quest_done: "مكتمل",
    quest_card_1: "• Quantum Universe •",
  quest_card_2: "• Crypto Run •",
  quest_card_3: "• TeleGo •" ,
  quest_card_4: "• SpaceX •" ,
  quest_card_5: "• Tik Token •" ,
  quest_card_6: "• Quest Tube •" ,
  quest_card_7: "• Crypto Shopping •" ,  
  quest_card_8: "• Crypto Game •" ,
  quest_card_9: "• Web Surfing •" ,
  quest_card_10: "• Instarted •" ,
  quest_card_11: "" ,
  quest_card_12: "" ,
  quest_card_13: "" ,
  quest_card_14: "" ,
  quest_card_15: "" ,
  quest_card_16: "" ,
  quest_card_17: "" ,
  quest_card_18: "" ,
  quest_card_19: "" ,
  quest_card_20: "" ,
  quest_card_21: "" ,
  quest_card_22: "" ,
  quest_card_23: "" ,
  quest_card_24: "" ,
  quest_card_25: "" ,
  quest_card_26: "" ,
  quest_card_27: "" ,  
  quest_card_28: "" ,
  quest_card_29: "" ,
  quest_card_30: "" ,
  quest_card_31: "" ,
  quest_card_32: "" ,
  quest_card_33: "" ,
  quest_card_34: "" ,
  quest_card_35: "" ,
  quest_card_36: "" ,
  quest_card_37: "" ,
  quest_card_38: "" ,
  quest_card_39: "" ,
  quest_card_40: "" ,
}

/* -------------------- TR -------------------- */
const FORUM_NEWS_TR = {
  forum_title: 'Forum',
  nick_free: "Kullanıcı adı uygun",
  nick_taken: "Kullanıcı adı alınmış",  
  quest_open: "kazanmak",
  quest_reward: "ÖDÜL",
  quest_tasks_done: "Görevleri tamamla",
  quest_do: "BAŞLAT",
  quest_done: "TAMAMLANDI",
    quest_card_1: "• Quantum Universe •",
  quest_card_2: "• Crypto Run •",
  quest_card_3: "• TeleGo •" ,
  quest_card_4: "• SpaceX •" ,
  quest_card_5: "• Tik Token •" ,
  quest_card_6: "• Quest Tube •" ,
  quest_card_7: "• Crypto Shopping •" ,  
  quest_card_8: "• Crypto Game •" ,
  quest_card_9: "• Web Surfing •" ,
  quest_card_10: "• Instarted •" ,
  quest_card_11: "" ,
  quest_card_12: "" ,
  quest_card_13: "" ,
  quest_card_14: "" ,
  quest_card_15: "" ,
  quest_card_16: "" ,
  quest_card_17: "" ,
  quest_card_18: "" ,
  quest_card_19: "" ,
  quest_card_20: "" ,
  quest_card_21: "" ,
  quest_card_22: "" ,
  quest_card_23: "" ,
  quest_card_24: "" ,
  quest_card_25: "" ,
  quest_card_26: "" ,
  quest_card_27: "" ,  
  quest_card_28: "" ,
  quest_card_29: "" ,
  quest_card_30: "" ,
  quest_card_31: "" ,
  quest_card_32: "" ,
  quest_card_33: "" ,
  quest_card_34: "" ,
  quest_card_35: "" ,
  quest_card_36: "" ,
  quest_card_37: "" ,
  quest_card_38: "" ,
  quest_card_39: "" ,
  quest_card_40: "" ,
}

/* -------------------- MERGE -------------------- */
try {
  Object.assign(dict.en  || {}, FORUM_NEWS_EN)
  Object.assign(dict.ru  || {}, FORUM_NEWS_RU)
  Object.assign(dict.uk  || {}, FORUM_NEWS_UK)
  Object.assign(dict.es  || {}, FORUM_NEWS_ES)
  Object.assign(dict.zh  || {}, FORUM_NEWS_ZH)
  Object.assign(dict.ar  || {}, FORUM_NEWS_AR)
  Object.assign(dict.tr  || {}, FORUM_NEWS_TR)
} catch (_) {}  

const TMA_AUTO_EN = {
  tma_authorizing: 'Authorizing…',
  tma_no_init: 'Open inside Telegram Mini App (no valid initData)',
  tma_auth_failed: 'Auth failed',
  tma_network_error: 'Network error',
  tma_init_present: 'initData present',
  tma_init_absent: 'no initData',

  // Hero copy
  tma_welcome_title: 'The Quantum Metaverse of L7 AI',
  tma_welcome_sub: 'Welcome! A global forum, AI recommendations, crypto trading, news, and planet-wide chat await you.',
  tma_feat_forum: 'Global Forum',
  tma_feat_ai: 'AI Recommendations',
  tma_feat_trading: 'Crypto Trading',
  tma_feat_news: 'News',
  tma_feat_chat: 'Chat with the World',
  tma_mining_note: 'Post comments and mine crypto right here ⚙️🪙'
};

const TMA_AUTO_RU = {
  tma_authorizing: 'Авторизация…',
  tma_no_init: 'Откройте внутри Telegram Mini App (нет корректного initData)',
  tma_auth_failed: 'Ошибка авторизации',
  tma_network_error: 'Сетевая ошибка',
  tma_init_present: 'initData найден',
  tma_init_absent: 'initData отсутствует',

  tma_welcome_title: 'Квантовая метавселенная L7 AI',
  tma_welcome_sub: 'Добро пожаловать! Здесь глобальный форум, ИИ-рекомендации, криптоторговля, новости и общение со всей планетой.',
  tma_feat_forum: 'Глобальный форум',
  tma_feat_ai: 'ИИ-рекомендации',
  tma_feat_trading: 'Криптоторговля',
  tma_feat_news: 'Новости',
  tma_feat_chat: 'Общение со всем миром',
  tma_mining_note: 'Комментируй и майни криптовалюту прямо здесь ⚙️🪙'
};

const TMA_AUTO_UK = {
  tma_authorizing: 'Авторизація…',
  tma_no_init: 'Відкрийте всередині Telegram Mini App (немає коректного initData)',
  tma_auth_failed: 'Помилка авторизації',
  tma_network_error: 'Мережева помилка',
  tma_init_present: 'initData знайдено',
  tma_init_absent: 'initData відсутній',

  tma_welcome_title: 'Квантова метавсесвіт L7 AI',
  tma_welcome_sub: 'Ласкаво просимо! Тут глобальний форум, ІІ-рекомендації, криптоторгівля, новини та спілкування з усім світом.',
  tma_feat_forum: 'Глобальний форум',
  tma_feat_ai: 'Рекомендації ШІ',
  tma_feat_trading: 'Криптоторгівля',
  tma_feat_news: 'Новини',
  tma_feat_chat: 'Спілкування зі світом',
  tma_mining_note: 'Коментуй і майнь криптовалюту прямо тут ⚙️🪙'
};

const TMA_AUTO_ES = {
  tma_authorizing: 'Autorizando…',
  tma_no_init: 'Ábrelo dentro de Telegram Mini App (sin initData válido)',
  tma_auth_failed: 'Error de autenticación',
  tma_network_error: 'Error de red',
  tma_init_present: 'initData presente',
  tma_init_absent: 'initData ausente',

  tma_welcome_title: 'El Metaverso Cuántico de L7 AI',
  tma_welcome_sub: '¡Bienvenido! Te esperan un foro global, recomendaciones de IA, trading cripto, noticias y chat con todo el mundo.',
  tma_feat_forum: 'Foro Global',
  tma_feat_ai: 'Recomendaciones de IA',
  tma_feat_trading: 'Trading Cripto',
  tma_feat_news: 'Noticias',
  tma_feat_chat: 'Chat mundial',
  tma_mining_note: 'Comenta y mina criptomonedas aquí ⚙️🪙'
};

const TMA_AUTO_ZH = { // 简体中文
  tma_authorizing: '正在授权…',
  tma_no_init: '请在 Telegram 小程序中打开（缺少有效的 initData）',
  tma_auth_failed: '授权失败',
  tma_network_error: '网络错误',
  tma_init_present: '已检测到 initData',
  tma_init_absent: '未检测到 initData',

  tma_welcome_title: 'L7 AI 量子元宇宙',
  tma_welcome_sub: '欢迎加入！这里有全球论坛、AI 推荐、加密交易、新闻与全球交流。',
  tma_feat_forum: '全球论坛',
  tma_feat_ai: 'AI 推荐',
  tma_feat_trading: '加密交易',
  tma_feat_news: '新闻资讯',
  tma_feat_chat: '与世界交流',
  tma_mining_note: '发表评论即可在此处挖矿 ⚙️🪙'
};

const TMA_AUTO_AR = { // العربية (RTL)
  tma_authorizing: 'جارٍ التفويض…',
  tma_no_init: 'افتح داخل تطبيق تيليجرام المصغّر (لا توجد بيانات initData صالحة)',
  tma_auth_failed: 'فشل تسجيل الدخول',
  tma_network_error: 'خطأ في الشبكة',
  tma_init_present: 'تم العثور على initData',
  tma_init_absent: 'لا توجد initData',

  tma_welcome_title: 'الكون المتعدد الكمي لـ L7 AI',
  tma_welcome_sub: 'مرحبًا بك! هنا منتدى عالمي وتوصيات ذكاء اصطناعي وتداول عملات مشفّرة وأخبار ودردشة مع العالم.',
  tma_feat_forum: 'منتدى عالمي',
  tma_feat_ai: 'توصيات الذكاء الاصطناعي',
  tma_feat_trading: 'تداول العملات المشفّرة',
  tma_feat_news: 'الأخبار',
  tma_feat_chat: 'دردشة مع العالم',
  tma_mining_note: 'علّق وابدأ تعدين العملة المشفّرة هنا ⚙️🪙'
};

const TMA_AUTO_TR = {
  tma_authorizing: 'Yetkilendiriliyor…',
  tma_no_init: 'Telegram Mini App içinde açın (geçerli initData yok)',
  tma_auth_failed: 'Kimlik doğrulama başarısız',
  tma_network_error: 'Ağ hatası',
  tma_init_present: 'initData mevcut',
  tma_init_absent: 'initData yok',

  tma_welcome_title: 'L7 AI’in Kuantum Metaverse’ü',
  tma_welcome_sub: 'Hoş geldin! Küresel forum, YZ önerileri, kripto ticareti, haberler ve dünya ile sohbet seni bekliyor.',
  tma_feat_forum: 'Küresel Forum',
  tma_feat_ai: 'YZ Önerileri',
  tma_feat_trading: 'Kripto Ticareti',
  tma_feat_news: 'Haberler',
  tma_feat_chat: 'Dünya ile Sohbet',
  tma_mining_note: 'Yorum yap ve burada kripto kaz! ⚙️🪙'
};

/* -------------------- MERGE (append without removing anything) -------------------- */
try {
  Object.assign(dict.en, TMA_AUTO_EN);
  Object.assign(dict.ru, TMA_AUTO_RU);
  Object.assign(dict.uk, TMA_AUTO_UK);
  Object.assign(dict.es, TMA_AUTO_ES);
  Object.assign(dict.zh, TMA_AUTO_ZH);
  Object.assign(dict.ar, TMA_AUTO_AR);
  Object.assign(dict.tr, TMA_AUTO_TR);
} catch (e) {}


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
