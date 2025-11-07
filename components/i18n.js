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
/* ===== HERO / HOME (short) ===== */
hero_title: 'Welcome to the Quantum L7 AI Universe',
hero_subtitle:
  'Quantum L7 AI is not just a platform but an entire cybernetic universe of decision-making: institutional-grade multichain data, autonomous L7 agents, on-chain pipelines, and trading routing operate as a single digital organism. We connect the Web-MiniApp, Telegram MiniApp and QL7 AI Bot, a forum with the QCoin economy, and a global exchange ( core in the final stage ) to provide instant alpha signals, disciplined entry/exit windows, automated execution, and a transparent risk perimeter. Authorization is via non-custodial wallets (keys stay with you), support for PRO/VIP tiers, priority limits, and quota removal. At the core is a legally vetted Web3 architecture, cross-exchange liquidity aggregation, behavioral and microstructural models, as well as replicable research pipelines with the log hypothesis → test → evidence. This is next-generation infrastructure for those who work at market pace and require provability, speed, and accuracy.',
hero_cta: 'Start in Telegram',
hero_learn_more: 'Learn more',
marquee: 'AI • Quantum agents • On-chain analytics • Crypto exchange (core) • Forum • QCoin mining • Auto-execution • Risk perimeter • Liquidity routing • Web3 metaverse • API/SDK • Enterprise • All rights reserved',

home_blocks: [
  {
    title: 'Why Quantum L7 AI',
    paras: [
      `Quantum L7 AI is a cross-platform ecosystem: the AI core, autonomous L7 agents, on-chain monitoring, normalized market feeds, the forum social network, and the QCoin economy are combined into a single computational fabric. Every artifact — a transaction, a news narrative, a post, a liquidity chart — enters the common data loop and becomes a call to action.`,
      `L7 agents autonomously read documents and APIs, observe blockchains and order books, classify behavioral patterns, assess market regimes, and produce verifiable hypotheses. The result is not a “black box” but an explainable card: scenario probability, amplitude, horizons, SL/TP, confidence factors, and links to primary sources.`,
      `Authorization is via non-custodial wallets: we do not store private keys and only confirm ownership of the address. Access rights and quotas are synchronized between the Telegram MiniApp, the web interface, and the QL7 bot; VIP status marks the boundaries of limits and lets you into priority processing channels.`,
      `The market core is built on cross-exchange aggregation, unification of symbols/contracts, and latency-aware feed processing. We combine institution-level histories with real-time streams to track spread dispersion, shock volumes, order balance, MEV risks, and the effect of the news impulse.`,
      `The platform principle is provability: hypothesis → test → evidence. Every computation is logged, metrics are reproducible, and “noise” arbitrage is cut off by regime filters. This is how we turn raw data into disciplined decisions and intuition into verifiable tactics.`,
      `The forum is embedded into the loop: content passes AI scoring (quality, engagement, anti-spam/anti-sybil), and activity is mapped into the QCoin economy. This is not a “social network for likes” but a targeted cognitive bus where knowledge and contribution are converted into tokenized value.`,
    ],
  },

  {
    title: 'What you get',
    bullets: [
      'Next-generation quantum analytics: a symbiosis of AI intelligence, on-chain metrics, and microstructural market features.',
      'Alpha signals with probability of execution, amplitude, and horizon, plus transparent justification of confidence factors.',
      'A normalized cross-exchange data core: unification of symbols/contracts, liquidity, spreads, and tick frequency.',
      'On-chain monitoring: holder distribution, flows through bridges, CEX/DEX liquidity, basic MEV patterns.',
      'Global exchange (core in development): liquidity routing, slippage protection, contextual risk assessment.',
      'Auto-execute: execution with fail-safe triggers, dynamic stops, and emergency shutdown on anomalies.',
      'Portfolio dashboards: PnL attribution, risk budgets, volatility regimes, corridors, and position sizing discipline.',
      'Replicable research: backtests, notebooks, visual reports, what-if scenarios, and exposure of assumptions.',
      'Narrative feed: AI tonality, embeddings, source trust, and linking news to price metrics.',
      'Forum economy: AI moderation, QCoin mining for contribution and activity, media posting with algorithmic scoring.',
      'VIP program: removal of daily quotas in the AI Box, extended limits, priority processing, and X2 for QCoin on quests/time.',
      'Integrations: Telegram MiniApp, web, QL7 bot; single session, shared status, and coordinated access rights.',
      'API/SDK/Webhooks: secure integrations, sandbox mode, event-driven architecture for teams and automation.',
      'Multichain stack: Ethereum, BSC, Polygon, Solana, TON, Avalanche, etc.; bridging and accounting for network specifics.',
      'Legally vetted Web3 architecture: logging, role separation, cryptographic verification, and privacy.',
    ],
  },

  {
    title: 'Infrastructure and data',
    paras: [
      `Market data: we combine historical and streaming CEX/DEX feeds, bring them to a common schema, close gaps, and account for splits and derivative specifics. On top — ensemble indicators (RSI/ADX/ATR/VWAP/OBV/Ichimoku/volume clusters), regime filters, and liquidity context.`,
      `On-chain layer: address graphs, liquidity movements, holder concentrations, bridge events, basic MEV risks. Public blockchains are not personal data, but we carefully log requests and debug IDs for reliability and incident investigation.`,
      `Narratives and news: multilingual indexing, translation, deduplication, source scoring, assessment of novelty and covariations with price; the result is a light numerical overlay next to price and volume that helps distinguish noise from a meaningful impulse.`,
      `Storage and cache: splitting streams into hot/warm, graceful degradation without loss of critical functions, prioritization of channels for VIP and system tasks. All computation stages have traceability, artifact version control, and reproducibility.`,
    ],
  },

  {
    title: 'Security and compliance',
    paras: [
      `Non-custodial model: private keys and seed phrases remain with the user. Authorization is by signature; access is role-based, logged, and audited. Minimization of personal data, encryption in transit and at rest, anti-fraud/anti-sybil pipelines.`,
      `Legal clarity: we provide analytics and tools, not financial advice. The payment flow through NowPayments with on-chain confirmation activates the subscription automatically; the status is synchronized across MiniApp/web/bot. Privacy and logging policies are transparent and updated.`,
      `Execution limiters: sanity checks, limits, emergency stop triggers, and anomaly monitoring. These are instruments of discipline, not a guarantee of result; trading involves risk, decisions are on the user side.`,
    ],
  },

  {
    title: 'Integrations: MiniApp • Bot • Forum • Exchange',
    paras: [
      `The Telegram MiniApp and the web work as mirror interfaces with a single session and rights. The QL7 bot is a lightweight entry into the AI channel and notifications. The forum is not just a community: it is a cognitive bus where knowledge and contribution are converted into QCoin, and VIP content passes priority AI scoring.`,
      `Exchange (core in the final stage): order routing, contextual assessment of slippage, on-chain execution where applicable, and extended backtest/what-if modes for VIP. Integration with analytics gives a rare effect — the signal knows “how” it will be executed.`,
    ],
  },

  {
    title: 'For teams and developers',
    bullets: [
      'API/SDK/Webhooks with a secure token model and key rotation.',
      'Event-driven integrations, sandbox environments, connectors to on-chain/off-chain sources.',
      'White-Label and Enterprise modes: SSO, private deployments, SLA, change windows.',
      'Notebooks/backtests: artifact export, reports, reproducibility of experiments.',
      'Deep feature acceptance and performance metrics for product teams.',
    ],
  },
],


/* ===== ABOUT ===== */
about_title: 'About Quantum L7 AI',
about_paragraphs: [
  `Quantum L7 AI is not just “analytics” — it is an integrated operational framework for making trading decisions and enabling social interaction around crypto markets. The platform’s core unites Web-MiniApp (web + Telegram), forums with gamified QCoin mining, and an AI research engine that filters noise, reveals liquidity structures, and suggests disciplined entry/exit scenarios. We combine market microstructure, on-chain telemetry, behavioral patterns, and news narratives into one coherent, interpretable layer — so you don’t have to “chase” the market but can design your moves in advance.`,

  `L7 agents are applied AI modules that live on data. They read documents and feeds, query APIs, observe blockchains, order books, and derivatives, run mini-experiments, and produce explainable artifacts: hypotheses, backtest snapshots, contextual indicators. The focus is not on the “black box magic,” but on traceability: from each conclusion, the path is visible — which features were considered (liquidity, spreads, asymmetry, imbalances, impulses, volume clusters), why weight was reduced in thin/manipulated zones, and where the boundary of scenario invalidation lies.`,

  `Who it’s for. For traders — fast situational awareness and manageable signal frequency without overload; for researchers — reproducible pipelines and clean data; for teams — API/SDK, webhooks, and a reliable event bus; for the builder community — forums, reputation metrics, and the QCoin economy for contributions. VIP+ receives a priority AI channel, media posting, accelerated quotas, and a “gold” status that affects ranking and limits.`,

  `Coverage. We aggregate data from leading CEXs and DEX aggregators, normalize symbols and contract metadata, unify tick frequencies and order book depth. We introduce unified directories, mappings of pairs/networks/markets, tag derivatives, and account for splits, delistings, and contract migrations. The goal is comparability across platforms and networks: a single abstraction layer to compare liquidity, costs, latency, and the “real” availability of volumes.`,

  `Data pipeline. Streams are cleaned, gaps are restored, anomalies are tagged, and delay contours are calibrated. The history is deep — this allows detection of regimes instead of chasing random spikes. We add on-chain routes, bridge transfers, holder distributions, MEV activity markers, and link them with market metrics. The result — feature ensembles resistant to “noise bubbles” and local anomalies.`,

  `Analytical core. Hundreds of indicators are merely a palette. The essence is in ensembles and context: RSI/RSX, Stochastic, CCI/MFI, ADX/DI, ATR and bands, EMA/SMA/WMA, MACD/Signal/Histogram, VWAP/POC/Value-Area, volume profiles, Bid/Ask imbalances, and liquidity sweeps. We blend classical families with regime filters, liquidity and behavioral heuristics, and on-chain inflow/outflow markers. Each card is not a “tip,” but a compass: amplitude through history, realization horizon, confidence, prerequisites, and invalidation boundaries.`,

  `On-chain modules. We track transfer clusters, bridges, accumulation/distribution, large holder concentration, basic MEV patterns, and anomalous routes. In thin liquidity zones, during funding or spread spikes, signal weights decrease; when confirmed by several domains (spot, derivatives, on-chain) — they increase. This minimizes “false confidence” where the market is fragile.`,

  `Narratives and news. The multilingual feed is translated, deduplicated, and indexed by embeddings. We evaluate novelty, source credibility, the ratio of “ritual/substance,” tone, and thematic persistence over time. Alongside price and on-chain metrics, a light “narrative map” emerges: what drives attention, where regulatory risks appear, what amplifies volatility, and what fades away.`,

  `Signal cards and discipline. Each card contains expected amplitude (quantiles), time horizon, SL/TP markers, a quick liquidity summary, and a set of triggers that must align. The system promotes discipline: before entry, you see invalidation, risk unit, and a dynamic volatility corridor; after entry — you receive validation checkpoints and risk removal conditions.`,

  `Architecture. Lightweight TypeScript/Python services behind a stable API; the website runs on Next.js with live layers via WebSocket. Cache layers and fallback sources ensure graceful degradation during peaks. API/SDK and webhooks enable automation, while roles and audit enforce secure boundaries. MiniApp works in web and Telegram so you can manage the market in one flow: charts, forum, wallet, bot — without friction.`,

  `Security and privacy. Non-custodial: we do not request or store private keys/seeds. Roles restrict access, actions are logged, personal data is minimized and encrypted in transit and at rest. Anti-sybil/anti-fraud pipelines protect the QCoin economy and the forum’s reputation mechanics; session validation is gentle yet strict, maintaining access integrity.`,

  `Forum and QCoin mining. The forum is not a “social network,” but a production line of knowledge. Every 4 hours, you confirm activity and lock in rewards; posts with media (video/images/audio) go through QuantumLCM-AI scoring (quality, engagement, anti-spam/anti-sybil) and are converted into QCoin. VIP+ receives X2 in time and X2 in quests, priority in ranking, extended media limits, and accelerated moderation. Reputation and contribution are not empty noise but economically meaningful values.`,

  `Exchange (in development) and recommendations. The trading core and execution are being connected step by step; AI-based recommendations by symbols/timeframes, order book depth, and liquidity profiles are already available. We are designing smart routing, delay/slippage protection, portfolio constraints, and PnL attribution. VIP+ gains access to experimental indicators, what-if/backtest modes, and extended analytical horizons.`,

  `QCoin economy and L7 blockchain. QCoin is the fuel of knowledge and productive traffic. The upcoming L7-chain is a layer that connects cross-network assets, banks, and financial infrastructure into a universal value router. Our goal is for QCoin to become a neutral settlement unit within the ecosystem, with transparent issuance/burning and a fair withdrawal queue. VIP+ enjoys higher priority in distributions and early access to staking/validator roles.`,

  `Payment and activation. The VIP+ subscription is processed via NowPayments: crypto payment (USDT and others), webhook instantly activates access and synchronizes status across MiniApp, bot, and forum. No screenshots or manual checks. The interface is available in 7 languages; wallet linking is seamless. You pay for speed, interpretability, and an economy where contribution is rewarded.`,

  `Community and roadmap. We publish weekly notes, open alpha-feature betas, and accept targeted requests from teams. In the backlog: a portfolio engine with risk budgets, extended CEX/DEX smart routing, public notebooks/backtests, and a “semi-autopilot” under human supervision. Everything that enhances discipline and reduces friction goes to release; what merely glitters but doesn’t help — doesn’t. Materials are educational/analytical, not financial advice.`
],

about_sections: [
  { title: 'What is Quantum L7 AI',             parasIdx: [0] },
  { title: 'L7 Agents, not a “Black Box”',       parasIdx: [1] },
  { title: 'Who it’s for',                       parasIdx: [2] },
  { title: 'Coverage',                           parasIdx: [3] },
  { title: 'Data Pipeline',                      parasIdx: [4] },
  { title: 'Analytical Core',                    parasIdx: [5] },
  { title: 'On-chain Modules',                   parasIdx: [6] },
  { title: 'Narratives and News',                parasIdx: [7] },
  { title: 'Cards and Discipline',               parasIdx: [8] },
  { title: 'Architecture',                       parasIdx: [9] },
  { title: 'Security and Privacy',               parasIdx: [10] },
  { title: 'Forum and QCoin Mining',             parasIdx: [11] },
  { title: 'Exchange and Recommendations',       parasIdx: [12] },
  { title: 'QCoin Economy and L7 Chain',         parasIdx: [13] },
  { title: 'Payment, Localization, Roadmap',     parasIdx: [14] }
],

about_bullets: [
  'Situational awareness: trend, impulse, volatility, liquidity',
  'Cross-exchange normalization, latency-aware feature weighting',
  'On-chain flows, holder concentrations, bridges, MEV hints',
  'Narrative feed with translation and trust/novelty assessment',
  'Cards: amplitude (quantiles), horizons, SL/TP, confidence',
  'Indicator ensembles + regime filters + behavioral factors',
  'API/SDK and webhooks for automation without “magic”',
  'Graceful degradation and fallback sources under peak load',
  'Non-custodial security: roles, audit, encryption',
  'Forum: QCoin mining, quests, media posting with AI scoring',
  'VIP+: X2 in time and quests, priority in rankings and limits',
  'Exchange recommendations already available; execution core coming soon',
  'NowPayments: instant activation, status synchronization',
  'L7 blockchain: priority withdrawal queues and early roles',
  '7 languages, unified access via web and Telegram MiniApp'
],

tg_button: 'Telegram',


/* ===== EXCHANGE (extended description) ===== */
exchange_title: 'Exchange (in development)',
exchange_sub:
  `Quantum L7 Exchange is a multi-chain, plausibly explainable next-generation trading platform,
combining CEX/DEX liquidity, AI recommendations, and institutional-grade data infrastructure into a unified computational fabric.
We process 87 TB of market histories and over 37 billion historical candles across all major networks and venues, normalize ticks,
order book depth, and derivative specifications, bringing the market to a single decision-making standard. The goal is not "yet another exchange,"
but an execution circuit with provable logic: hypothesis → test → evidence → trade, with transparent risk limiters and traceable audit.`,

exchange_sections: [
  {
    title: 'Vision: next-generation L7 Exchange',
    paras: [
      `L7 Exchange is an agent-based pipeline where autonomous L7 agents consume market feeds, on-chain events, news, and behavioral microstructure signals,
synchronize them in time, and output explainable recommendations (BUY/SELL/HOLD) with probability,
amplitude, horizon, and risk context (liquidity, spread, dispersion, anomalies). For the user, this means
decision reproducibility: each signal card is accompanied by a log of factors, model versions, and links to primary sources.`,
      `Identity — through non-custodial wallets (we do not store private keys or seed phrases). Access rights,
quotas, and limits are synchronized between the web interface and MiniApp. Execution of actions — only within user-defined
limiters and with sufficient model confidence. The platform principle is provability, not a “black box.”`,
      `Institutional-grade data: 87 TB of histories, 37+ billion candles, contract and symbol unification,
latency-aware stream processing, gap cleaning, accounting for splits and derivative specifics. On top — ensembles of 200+ indicators
(RSI/ADX/ATR/VWAP/OBV/Ichimoku/volume clusters, regime filters, etc.), behavioral features, and micro-imbalance statistics.`,
      `H2 2026 — target window for public launch of the L7 Exchange core along with the next-generation L7 blockchain
(inter-network coordination layer). At launch — cross-exchange routing, explainable auto-execution,
and later — expansion toward on-chain clearing and native smart access rights.`,
    ],
  },

  {
    title: 'Routing and liquidity',
    paras: [
      `The smart router simultaneously scans liquidity on CEX/DEX, models slippage, fees, and delays,
selects the venue/split route, and controls execution quality via target metrics (expected fill, adverse selection,
mark-out over N seconds/minutes). In split mode, orders are fragmented and distributed across pools/books to minimize impact.`,
      `Latency matters: we support cancel/replace, timeouts, “kill-switch,” partial take-profit rules,
and reactions to spread dispersion spikes. In arbitrage scenarios, tick synchronization windows and low-latency connections are used.`,
      `Market microstructure: we analyze order imbalances, hidden volume spikes, level-by-level liquidity,
the influence of news/on-chain events, behavior of “aggressive” prints, and slippage probability relative to notional size.`,
    ],
  },

  {
    title: 'Risk and control',
    paras: [
      `Global and instrument-level limits: by notional, portfolio share, daily/weekly drawdown, leverage, and concentration.
Execution profiles (conservative/balanced/aggressive) and minimum required model confidence. All triggers are transparently described
and logged for audit. Every action is explainable: reason, input data, model versions, and execution parameters.`,
      `Conditional orders (stop/stop-limit), time-in-force (GTC/IOC/FOK), partial take-profit directives, dynamic stop corridors
by volatility regime (ATR-like), “circuit-breaker” during anomalies, night “silences,” and event blocks (e.g., high-impact news).`,
      `Anti-pump and anti-spike: extra checks of spread/liquidity, deviation thresholds from fair price, ban on “averaging into the abyss,”
emergency forced de-escalation level when the environment becomes “not suitable for trading.”`,
    ],
  },

  {
    title: 'Analytics and explainability',
    paras: [
      `AI-Box for each symbol/TF displays confidence level, decision factors (from relative position to VWAP/bands
to RSI/volume cluster regimes), amplitude and historical horizons (quantiles), and recommended TP/SL.
Presentation is compact but verifiable: numbers, not metaphors.`,
      `Explainability by design: cause ➜ effect. The card contains factor weights, links to sources,
snapshot of books/volumes, and “what-if” mini-simulations. The goal is to give the trader a transparent decision skeleton
that can be reproduced and challenged.`,
      `News/narratives: multilingual parsing, translation, deduplication, AI tonality, source trust, and correlation with price reaction.
This is not “noise” but context for assessing scenario probability and execution windows.`,
    ],
  },

  {
    title: 'Portfolio, reporting, and attribution',
    paras: [
      `Portfolio panels with PnL attribution: decomposition by alpha sources, market regimes, symbols, risk budgets,
and model decisions. “Mark-out” and impact metrics are calculated separately to distinguish “luck” from systematic performance.`,
      `Trade journals, export, reports, APIs for integrations. Research reproducibility: backtests and “replay”
on historical streams directly over the chart. “Strategy templates” and “one-click” deployment with limiters.`,
      `Team modes (roadmap): roles, permissions, parameter coordination, centralized reports,
white-label and private deployments for enterprise.`,
    ],
  },

  {
    title: 'Data and network infrastructure',
    paras: [
      `Feed unification: cross-exchange aggregation, normalization of ticks and depth to a common schema, gap filling,
handling of splits and contract changes. On top — ensembles of 200+ indicators, behavioral/regime filters,
and microstructural features. Historical layer — 87 TB, over 37 billion candles.`,
      `On-chain layer: address graphs, holder concentration, liquidity inflows/outflows, bridge movements, basic MEV risks.
Public blockchains are not personal data; operational logs (within legal limits) help
ensure reliability and incident investigation.`,
      `Network stack: optimized connections to liquidity and market data providers, degradation strategy
without losing critical functions, hot/warm caches, prioritization of VIP processing channels. All computation stages are traceable.`,
    ],
  },

  {
    title: 'Security and compliance',
    paras: [
      `Non-custodial model: keys remain with the user, authorization — by signature. Role-based access,
minimization of personal data, encryption “in transit” and “at rest,” anti-fraud/anti-sybil pipelines.
Action logging for audit and reproducibility.`,
      `Regulatory context: we provide analytics and tools, not financial advice.
Subscription payment via NowPayments with on-chain confirmation — automatic activation of limits/rights without manual “checks.”
Privacy and logging policies are transparent and regularly updated.`,
      `Execution limiters are discipline, not guarantee. The market is volatile; decisions and compliance with jurisdictional
requirements rest on the user. We provide frameworks, metrics, and explainability so that risk is conscious.`,
    ],
  },

  {
    title: 'Roadmap and launch',
    paras: [
      `H2 2026: public launch of the L7 Exchange core and next-generation L7 blockchain — inter-network coordination layer
designed to simplify clearing and access rights at the smart contract level, as well as improve execution observability.
Main focus — liquidity routing, explainable auto-execute, portfolio attribution, and team modes.`,
      `QCoin — the internal economy of the L7 ecosystem. The roadmap includes QCoin’s role in payment and incentive processes
within the ecosystem. The goal is a unified “settlement layer” between analytics, execution, and user services.`,
      `Before the public release — extended betas, stress tests, stability reports, and open logged results
on execution quality and latency. Transparency is the core of trust.`,
    ],
  },
],

roadmap: 'Roadmap',

ex_bullets: [
  'Smart CEX/DEX routing with slippage control, splits, and latency-aware execution',
  'Explainable AI signals: probability, amplitude, horizons, confidence factors, TP/SL',
  'Portfolio panels: PnL attribution, risk budgets, “mark-out,” impact metrics',
  'Backtests and replays on historical streams directly on the chart',
  'Risk limiters: limits, time-in-force, kill-switch, dynamic stop corridors',
  'Data unification: 87 TB of histories, 37+ billion candles, 200+ indicators and regime filters',
  'Wallet connection, non-custodial model, and logged action audit',
  'H2 2026: public launch of L7 Exchange core and next-generation L7 blockchain',
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
hero_title: 'Добро пожаловать в Quantum L7 AI Вселенную',
hero_subtitle:
  'Quantum L7 AI — это не просто платформа, а целая кибернетическая вселенная принятия решений: мультичейн-данные институционального класса, автономные L7-агенты, ончейн-пайплайны и торговая маршрутизация работают как единый цифровой организм. Мы стыкуем Web-MiniApp, Telegram MiniApp и QL7 AI Bot, форум с экономикой QCoin и глобальную биржу ( ядро в финальной стадии ), чтобы дать мгновочные альфа-сигналы, дисциплинированные окна входа/выхода, автоматизированное исполнение и прозрачный риск-контур. Авторизация — через некостодиальные кошельки (ключи у вас), поддержка PRO/VIP-уровней, приоритетные лимиты и снятие квот. В основе — юридически выверенная архитектура Web3, кросс-эксчендж-агрегация ликвидности, поведенческие и микроструктурные модели, а также реплицируемые ресёрч-пайплайны с логом гипотеза → тест → свидетельства. Это инфраструктура нового поколения для тех, кто работает в темпе рынка и требует доказуемости, скорости и точности.',
hero_cta: 'Начать в Telegram',
hero_learn_more: 'Подробнее',
marquee: 'ИИ • Квантовые агенты • Ончейн-аналитика • Криптобиржа (ядро) • Форум • QCoin Майнинг • Автоисполнение • Risk-контур • Маршрутизация ликвидности • Метавселенная Web3 • API/SDK • Enterprise • Все права защищены',

home_blocks: [
  {
    title: 'Почему Quantum L7 AI',
    paras: [
      `Quantum L7 AI — кросс-платформенная экосистема: ИИ-ядро, автономные L7-агенты, ончейн-мониторинг, нормализованные маркет-фиды, социальная сеть форума и экономика QCoin объединены в единую вычислительную ткань. Каждый артефакт — транзакция, новостной нарратив, пост, график ликвидности — попадает в общий контур данных и становится сигналом к действию.`,
      `Агенты L7 автономно читают документы и API, наблюдают блокчейны и стаканы, классифицируют поведенческие паттерны, оценивают режимы рынка и выводят проверяемые гипотезы. Результат — не «чёрный ящик», а объяснимая карточка: вероятность сценария, амплитуда, горизонты, SL/TP, факторы уверенности и ссылки на первоисточники.`,
      `Авторизация — через некостодиальные кошельки: мы не храним приватные ключи, а подтверждаем владение адресом. Права доступа и квоты синхронизируются между Telegram MiniApp, веб-интерфейсом и ботом QL7, статус VIP размечает границы лимитов и пропускает в приоритетные каналы обработки.`,
      `Маркет-ядро строится на кросс-биржевой агрегации, унификации символов/контрактов и latency-aware обработке фидов. Мы совмещаем институт-уровень историй с потоками реального времени, чтобы отслеживать дисперсию спреда, ударные объёмы, баланс заявок, MEV-риски и эффект новостного импульса.`,
      `Принцип платформы — доказуемость: гипотеза → тест → свидетельства. Каждый расчёт логируется, метрики воспроизводимы, а арбитраж «шума» отсекается фильтрами режимов. Так мы превращаем сырые данные в дисциплинированные решения, а интуицию — в проверяемую тактику.`,
      `Форум встраивается в контур: контент проходит AI-скоринг (качество, вовлечённость, анти-спам/anti-sybil), а активность маппится в экономику QCoin. Это не «соцсеть ради лайков», а целевая когнитивная шина, где знания и вклад конвертируются в токенизированную ценность.`,
    ],
  },

  {
    title: 'Что вы получаете',
    bullets: [
      'Квантовую аналитику нового поколения: симбиоз AI-интеллекта, ончейн-метрик и микроструктурных признаков рынка.',
      'Альфа-сигналы с вероятностью исполнения, амплитудой и горизонтом, плюс прозрачное обоснование факторов уверенности.',
      'Нормализованное кросс-биржевое ядро данных: унификация символов/контрактов, ликвидности, спредов и частоты тиков.',
      'Ончейн-мониторинг: распределение держателей, потоки через мосты, ликвидность CEX/DEX, базовые MEV-паттерны.',
      'Глобальная биржа (ядро в разработке): маршрутизация ликвидности, защита от проскальзывания, контекстная оценка риска.',
      'Auto-execute: исполнение с fail-safe триггерами, динамическими стопами и аварийной остановкой при аномалиях.',
      'Портфельные панели: атрибуция PnL, риск-бюджеты, режимы волатильности, коридоры и дисциплина размера позиции.',
      'Реплицируемые исследования: бэктесты, ноутбуки, визуальные отчёты, what-if-сценарии и экспозиция допущений.',
      'Лента нарративов: AI-тональность, эмбеддинги, доверие источников и связывание новостей с ценовыми метриками.',
      'Форум-экономика: AI-модерация, QCoin-майнинг за вклад и активность, медиапостинг с алгоритмическим скорингом.',
      'VIP-программа: снятие дневных квот в AI Box, расширенные лимиты, приоритетная обработка и X2 по QCoin для квестов/времени.',
      'Интеграции: Telegram MiniApp, веб, бот QL7; единая сессия, общий статус и согласованные права доступа.',
      'API/SDK/Webhooks: безопасные интеграции, sandbox-режим, event-driven архитектура для команд и автоматизации.',
      'Мультичейн-стек: Ethereum, BSC, Polygon, Solana, TON, Avalanche и др.; мостирование и учёт сетевой специфики.',
      'Юридически выверенная Web3-архитектура: логирование, разделение ролей, криптографическая верификация и приватность.',
    ],
  },

  {
    title: 'Инфраструктура и данные',
    paras: [
      `Маркет-данные: объединяем исторические и потоковые фиды CEX/DEX, приводим к общей схеме, закрываем разрывы, учитываем сплиты и особенности деривативов. Поверх — ансамблевые индикаторы (RSI/ADX/ATR/VWAP/OBV/Ichimoku/объёмные кластеры), фильтры режимов и контекст ликвидности.`,
      `Ончейн-слой: адресные графы, перемещения ликвидности, концентрации держателей, мостовые события, базовые MEV-риски. Публичные блокчейны — не персональные данные, но мы аккуратно логируем запросы и отладочные ID для надёжности и расследования инцидентов.`,
      `Нарративы и новости: мультиязычная индексация, перевод, дедупликация, скоринг источников, оценка новизны и ковариаций с ценой; результат — лёгкая числовая надстройка рядом с ценой и объёмом, которая помогает отличить шум от значимого импульса.`,
      `Хранилища и кэш: разделение потоков на горячие/тёплые, деградация без потери критичных функций, приоритизация каналов для VIP и системных задач. Все вычислительные этапы имеют трассировку, контроль версий артефактов и воспроизводимость.`,
    ],
  },

  {
    title: 'Безопасность и соответствие',
    paras: [
      `Некостодиальная модель: приватные ключи и сид-фразы остаются у пользователя. Авторизация — подписью; доступы — по ролям, журналируются и проверяются. Минимизация персональных данных, шифрование в транзите и на хранении, анти-fraud/anti-sybil пайплайны.`,
      `Юридическая чистота: мы предоставляем аналитику и инструменты, а не финсоветы. Флоу оплаты через NowPayments с ончейн-подтверждением активирует подписку автоматически; статус синхронизируется между MiniApp/веб/ботом. Политики приватности и логирования — прозрачны и обновляются.`,
      `Ограничители исполнения: sanity-checks, лимиты, аварийные стоп-триггеры и мониторинг аномалий. Это инструменты дисциплины, а не гарантия результата; трейдинг связан с риском, решения — на стороне пользователя.`,
    ],
  },

  {
    title: 'Интеграции: MiniApp • Бот • Форум • Биржа',
    paras: [
      `Telegram MiniApp и веб работают как зеркальные интерфейсы с единой сессией и правами. Бот QL7 — лёгкий вход в AI-канал и уведомления. Форум — не просто комьюнити: это когнитивная шина, где знания и вклад конвертируются в QCoin, а контент VIP проходит приоритетный AI-скоринг.`,
      `Биржа (ядро в финальной стадии): маршрутизация ордеров, контекстная оценка проскальзывания, ончейн-исполнение там, где применимо, и расширенные режимы backtest/what-if для VIP. Интеграция с аналитикой даёт редкий эффект — сигнал знает, «как» он будет исполняться.`,
    ],
  },

  {
    title: 'VIP и экономика QCoin',
    paras: [
      `VIP снимает дневные квоты в AI Box, расширяет лимиты и приоритизирует обработку. На форуме VIP получает X2 множители по времени и квестам, золотой бейдж и увеличенный вес медиапостов (видео/изображения/аудио) в алгоритмическом скоринге. Активность, вклад и просмотры конвертируются в QCoin с учётом качества и вовлечённости.`,
      `Оплата через NowPayments: как только on-chain подтверждение приходит, статус активируется мгновенно и распространяется на MiniApp/бот/веб. В дорожной карте — запуск L7-чейна: VIP — верхние слои priority-tier для распределений и очередей вывода QCoin, ранние роли валидаторов/стейкеров и повышенные лимиты.`,
    ],
  },

  {
    title: 'Для команд и разработчиков',
    bullets: [
      'API/SDK/Webhooks с безопасной моделью токенов и ротацией ключей.',
      'Event-driven интеграции, sandbox-окружения, коннекторы к ончейн/офчейн источникам.',
      'White-Label и Enterprise-режимы: SSO, частные деплои, SLA, окна изменений.',
      'Ноутбуки/бэктесты: экспорт артефактов, отчёты, воспроизводимость экспериментов.',
      'Глубокие метрики приёмки фич и производительности для продуктовых команд.',
    ],
  },
],


/* ===== ABOUT ===== */
about_title: 'О Quantum L7 AI',
about_paragraphs: [
  `Quantum L7 AI — это не просто «аналитика», а единый операционный контур принятия торговых решений и социального взаимодействия вокруг крипто-рынков. Ядро платформы объединяет Web-MiniApp (веб + Telegram), форумы с геймифицированным QCoin-майнингом и ИИ-ресёрч-движок, который снимает шум, выявляет структуру ликвидности и подсказывает дисциплинированные сценарии входа/выхода. Мы соединяем рыночную микро-структуру, ончейн-телееметрию, поведенческие паттерны и новостные нарративы в один согласованный, интерпретируемый слой — так, чтобы вам не приходилось «догонять» рынок, а можно было проектировать ход заранее.`,

  `L7-агенты — это прикладные ИИ-модули, которые живут на данных. Они читают документы и ленты, запрашивают API, наблюдают блокчейны, стаканы и деривативы, прогоняют мини-эксперименты и выдают объяснимые артефакты: гипотезы, бэктест-снапшоты, контекстные индикаторы. Важна не «магия чёрного ящика», а трассируемость: из каждого вывода виден путь — какие признаки были учтены (ликвидность, спрэды, асимметрия, дисбалансы, импульсы, кластера объёмов), почему понижен вес в тонких/манипулируемых зонах и где проходит граница невалидности сценария.`,

  `Для кого это. Трейдерам — быстрая ситуационная осведомлённость и управляемая частота сигналов без перегруза; исследователям — воспроизводимые пайплайны и чистые данные; командам — API/SDK, вебхуки и надёжная шина событий; билдер-сообществу — форумы, репутационные метрики и QCoin-экономика за вклад. VIP+ получает приоритетный ИИ-канал, медиапостинг, ускоренные квоты и «золотой» статус, который влияет на выдачу и лимиты.`,

  `Покрытие. Мы агрегируем данные с ведущих CEX и DEX-агрегаторов, нормализуем символы и контракт-метаданные, унифицируем частоты тиков и глубину стаканов. Вводим единые справочники, мэппинги пар/сетей/маркетов, помечаем деривативы, учитываем сплиты, делистинги и миграции контрактов. Цель — сопоставимость площадок и сетей: один слой абстракции, чтобы сравнивать ликвидность, издержки, задержки и «реальную» доступность объёмов.`,

  `Пайплайн данных. Потоки очищаются, пропуски реставрируются, аномалии маркируются, контуры задержек калибруются. История глубока — это даёт возможность выявлять режимы, а не натягивать указку на случайный всплеск. Мы добавляем ончейн-маршруты, переводные мосты, распределения держателей, признаки MEV-активности и связываем это с рыночными метриками. Итог — ансамбли признаков, устойчивые к «пузырям шума» и локальным аномалиям.`,

  `Аналитическое ядро. Сотни индикаторов — лишь палитра. Главное — ансамбли и контекст: RSI/RSX, Stochastic, CCI/MFI, ADX/DI, ATR и полосы, EMA/SMA/WMA, MACD/Signal/Histogram, VWAP/POC/Value-Area, объёмные профили, дисбалансы Bid/Ask и свипы ликвидности. Мы смешиваем классические семейства с фильтрами режимов, евристиками по ликвидности и поведению, а также с ончейн-маркером притока/оттока. Каждая карточка — это не «совет», а компас: амплитуда по истории, горизонт реализации, уверенность, предпосылки и границы инвалидации.`,

  `Ончейн-модули. Мы отслеживаем переводные кластера, мосты, накопление/распределение, концентрацию крупных держателей, базовые MEV-паттерны и аномальные маршруты. В тонких зонах ликвидности, при всплесках фандинга или спрэда вес сигналов снижается; при подтверждении несколькими доменами (спот, деривативы, ончейн) — повышается. Так минимизируется «ложная уверенность» там, где рынок хрупок.`,

  `Нарративы и новости. Мультиязычная лента переводится, дедуплицируется и индексируется по эмбеддингам. Мы оцениваем новизну, доверие источника, соотношение «ритуал/суть», тональность и «тягучесть» темы во времени. Рядом с ценовыми и ончейн-метриками появляется лёгкая «карта нарратива»: чем драйвится внимание, где регуляторные риски, что усиливает волатильность, а что сдувается.`,

  `Карточки сигналов и дисциплина. На карточке — ожидаемая амплитуда (квантили), временной горизонт, SL/TP-маркеры, быстрая сводка ликвидности и набор триггеров, которые должны сойтись. Система подталкивает к дисциплине: до входа вы видите инвалидацию, риск-единицу и динамический коридор волатильности; после — получаете проверочные чек-поинты и условия снятия риска.`,

  `Архитектура. Лёгкие сервисы на TypeScript/Python за стабильным API; сайт — на Next.js с живыми слоями через WebSocket. Кэш-уровни и резервные источники обеспечивают плавную деградацию в пиках. API/SDK и вебхуки дают автоматизацию, а роли и аудит — безопасные границы. MiniApp работает в вебе и в Telegram, чтобы вы могли вести рынок в одном потоке: графики, форум, кошелёк, бот — без трения.`,

  `Безопасность и приватность. Некостодиально: приватные ключи/seed не запрашиваем и не храним. Роли ограничивают доступ, действия логируются, персональные данные минимизируются и шифруются в передаче и хранении. Анти-sybil/anti-fraud пайплайны защищают экономику QCoin и репутационные механики форума; валидация сессий бережно, но строго поддерживает целостность доступа.`,

  `Форум и QCoin-майнинг. Форум — это не «соцсеть», а производственная линия знаний. Каждые 4 часа вы подтверждаете активность и лочите награду; посты с медиа (видео/изображения/аудио) проходят скоринг QuantumLCM-AI (качество, вовлечённость, анти-спам/анти-sybil) и конвертятся в QCoin. VIP+ получает X2 по времени и X2 по квестам, приоритет в выдаче, расширенные лимиты на медиа и ускоренную модерацию. Репутация и вклад — не пустой шум, а экономически значимая величина.`,

  `Биржа (в разработке) и рекомендации. Торговое ядро и исполнение подключаются поэтапно; уже доступны ИИ-рекомендации по символам/таймфреймам, глубина стакана и профиль ликвидности. Мы проектируем smart-routing, защиту от задержек/проскальзывания, портфельные ограничения и атрибуцию PnL. VIP+ получает доступ к экспериментальным индикаторам, режимам what-if/backtest и расширенным горизонтам анализа.`,

  `Экономика QCoin и L7-блокчейн. QCoin — топливо знаний и полезного трафика. Будущий L7-chain — это слой, который связывает кросс-сетевые активы, банки и фин-инфраструктуру в универсальный маршрутизатор ценности. Наша цель — чтобы QCoin стал нейтральной расчётной единицей в экосистеме, с прозрачной эмиссией/сжиганием и честной очередью вывода. VIP+ имеет повышенный приоритет на распределения и ранний доступ к стейкингу/валидаторским ролям.`,

  `Оплата и активация. Подписка VIP+ оформляется через NowPayments: крипто-оплата (USDT и др.), вебхук мгновенно активирует доступ и синхронизирует статус между MiniApp, ботом и форумом. Никаких скриншотов и ручных проверок. Интерфейс доступен на 7 языках; связка кошелька — бесшовная. Вы платите за скорость, интерпретируемость и экономику, в которой вклад вознаграждается.`,

  `Комьюнити и дорожная карта. Мы публикуем еженедельные заметки, открываем беты альфа-фич, принимаем целевые запросы от команд. В бэклоге: портфельный движок с риск-бюджетами, расширенная смарт-маршрутизация CEX/DEX, публичные ноутбуки/бэктесты, «полуавтопилот» под контролем человека. Всё, что повышает дисциплину и снижает трение, идёт в релиз; то, что блестит, но не помогает — нет. Материалы — образовательные/аналитические, не финсовет.`
],

about_sections: [
  { title: 'Что такое Quantum L7 AI',           parasIdx: [0] },
  { title: 'L7-агенты, а не «чёрный ящик»',     parasIdx: [1] },
  { title: 'Для кого',                          parasIdx: [2] },
  { title: 'Покрытие',                          parasIdx: [3] },
  { title: 'Пайплайн данных',                   parasIdx: [4] },
  { title: 'Аналитическое ядро',                parasIdx: [5] },
  { title: 'Ончейн-модули',                     parasIdx: [6] },
  { title: 'Нарративы и новости',               parasIdx: [7] },
  { title: 'Карточки и дисциплина',             parasIdx: [8] },
  { title: 'Архитектура',                       parasIdx: [9] },
  { title: 'Безопасность и приватность',        parasIdx: [10] },
  { title: 'Форум и QCoin-майнинг',             parasIdx: [11] },
  { title: 'Биржа и рекомендации',              parasIdx: [12] },
  { title: 'Экономика QCoin и L7-чейн',         parasIdx: [13] },
  { title: 'Оплата, локализация, дорожная карта', parasIdx: [14] }
],

about_bullets: [
  'Ситуационная осведомлённость: тренд, импульс, волатильность, ликвидность',
  'Кросс-биржевая нормализация, latency-aware взвешивание признаков',
  'Ончейн-потоки, концентрации держателей, мосты, MEV-намёки',
  'Нарративная лента с переводом и оценкой доверия/новизны',
  'Карточки: амплитуда (квантили), горизонты, SL/TP, уверенность',
  'Ансамбли индикаторов + фильтры режимов + поведение',
  'API/SDK и вебхуки для автоматизации без «магии»',
  'Плавная деградация и резервные источники в пике нагрузки',
  'Некостодиальная безопасность: роли, аудит, шифрование',
  'Форум: QCoin-майнинг, квесты, медиапостинг с AI-скорингом',
  'VIP+: X2 по времени и квестам, приоритет в выдаче и лимитах',
  'Рекомендации на бирже уже доступны; ядро исполнения на подходе',
  'NowPayments: мгновенная активация, синхронизация статуса',
  'L7-блокчейн: приоритетные очереди вывода и ранние роли',
  '7 языков, единый доступ в вебе и Telegram MiniApp'
],

tg_button: 'Телеграм',


/* ===== EXCHANGE (расширенное описание) ===== */
exchange_title: 'Биржа (в разработке)',
exchange_sub:
  `Quantum L7 Exchange — это многоцепочная, правдоподобно объяснимая торговая платформа нового поколения,
объединяющая CEX/DEX-ликвидность, ИИ-рекомендации и институциональную инфраструктуру данных в единую вычислительную ткань.
Мы обрабатываем 87 ТБ рыночных историй и более 37 млрд исторических свечей по всем крупным сетям и площадкам, нормализуем тики,
глубину стаканов и деривативные спецификации, приводя рынок к одному стандарту принятия решений. Цель — не «ещё одна биржа»,
а контур исполнения с доказуемой логикой: гипотеза → тест → свидетельства → сделка, с прозрачными ограничителями риска и трассируемым аудитом.`,

exchange_sections: [
  {
    title: 'Видение: биржа нового поколения L7',
    paras: [
      `L7 Exchange — это агентный пайплайн, где автономные L7-агенты потребляют маркет-фиды, ончейн-события, новости и поведенческие сигналы
микроструктуры, синхронизируют их по времени и выдают объяснимые рекомендации (BUY/SELL/HOLD) с вероятностью,
амплитудой, горизонтом и контекстом риска (ликвидность, спред, дисперсия, аномалии). Для пользователя это означает
воспроизводимость решений: каждая карточка сигнала сопровождается логом факторов, версиями моделей и ссылками на первоисточники.`,
      `Идентичность — через некостодиальные кошельки (мы не храним приватные ключи и seed-фразы). Права доступа,
квоты и лимиты синхронизируются в веб-интерфейсе и MiniApp. Исполнение действий — только в пределах заданных вами
ограничителей и при достаточном уровне уверенности модели. Принцип платформы — доказуемость, а не «чёрный ящик».`,
      `Данные институционального уровня: 87 ТБ историй, 37+ млрд свечей, унификация контрактов и символов,
latency-aware обработка потоков, очистка разрывов, учёт сплитов и специфик деривативов. Поверх — ансамбли из 200+ индикаторов
(RSI/ADX/ATR/VWAP/OBV/Ichimoku/объёмные кластеры, режимные фильтры и др.), поведенческие признаки и статистика микро-имбалансов.`,
      `H2 2026 — целевое окно публичного запуска ядра L7 Exchange вместе с L7-блокчейном нового поколения
(межсетевой уровень согласования). На старте — кросс-биржевая маршрутизация, объяснимое автоисполнение,
а затем — расширение в сторону ончейн-клиринга и нативных смарт-прав доступа.`,
    ],
  },

  {
    title: 'Маршрутизация и ликвидность',
    paras: [
      `Смарт-роутер параллельно сканирует ликвидность на CEX/DEX, моделирует слиппедж, комиссии и задержки,
подбирает площадку/сплит-маршрут и контролирует качество исполнения через целевые метрики (expected fill, adverse selection, 
mark-out через N секунд/минут). В режиме сплита заявки дробятся и разносятся по пулам/книгам, чтобы минимизировать воздействие.`,
      `Latency имеет значение: поддерживаем cancel/replace, тайм-ауты, «kill-switch», правила частичной фиксации и
реакцию на скачки дисперсии спреда. В арбитражных сценариях используются окна синхронизации тиков и соединения с низкой задержкой.`,
      `Маркет-микроструктура: анализируем дисбаланс заявок, всплески скрытого объёма, ликвидность по уровням,
влияние новостей/ончейн-событий, поведение «агрессивных» принтов и вероятность проскальзывания по размеру нотионала.`,
    ],
  },

  {
    title: 'Риск и контроль',
    paras: [
      `Глобальные и инструментальные лимиты: по нотионалу, доле портфеля, дневной/недельной просадке, плечу, концентрации.
Профили исполнения (conservative/balanced/aggressive) и минимальная требуемая уверенность модели. Все триггеры прозрачно описаны
и логируются для аудита. Любое действие объяснимо: причина, входные данные, версии моделей и параметры исполнения.`,
      `Conditional-ордера (stop/stop-limit), time-in-force (GTC/IOC/FOK), директивы частичной фиксации, динамические стоп-коридоры
по режиму волатильности (ATR-подобные), «circuit-breaker» при аномалиях, ночные «тишины» и блоки событий (например, high-impact новости).`,
      `Анти-разгон и анти-скачок: экстра-проверки спреда/ликвидности, пороги отклонений от справедливой цены, запрет усреднения «в пропасть»,
аварийный уровень принудительной деэскалации, когда окружение становится «некорректным для торгов».`,
    ],
  },

  {
    title: 'Аналитика и объяснимость',
    paras: [
      `AI-Box для каждого символа/TF показывает уровень уверенности, факторы решения (от относительного положения к VWAP/полосам
до режимов RSI/объёмных кластеров), амплитуду и горизонты по истории (квантили) и рекомендуемые TP/SL. 
Подача компактна, но проверяема: цифры, а не метафоры.`,
      `Explainability by design: причина ➜ эффект. Карточка содержит веса факторов, ссылки на источники, 
моментальные снимки стаканов/объёмов и «what-if» мини-симуляции. Цель — дать трейдеру прозрачный скелет решения, 
который можно воспроизвести и оспорить.`,
      `Новости/нарративы: мультиязычный парсинг, перевод, дедупликация, AI-тональность, доверие к источнику, связь с ценовой реакцией.
Это не «шум», а контекст для оценки вероятности сценария и временных окон исполнения.`,
    ],
  },

  {
    title: 'Портфель, отчётность и атрибуция',
    paras: [
      `Портфельные панели с атрибуцией PnL: decomposition по источникам альфы, режимам рынка, символам, риск-бюджетам и
решениям модели. Отдельно считаются «mark-out» и impact-метрики, чтобы отличать «везение» от системности.`,
      `Журналы сделок, экспорт, отчёты, API для интеграций. Реплицируемость исследований: бэктесты и «replay» 
на исторических потоках прямо поверх графика. «Шаблоны стратегий» и «one-click» развертывание с ограничителями.`,
      `Командные режимы (roadmap): роли, права, согласование параметров, централизованные отчёты, 
white-label и приватные развертывания для enterprise.`,
    ],
  },

  {
    title: 'Инфраструктура данных и сети',
    paras: [
      `Унификация фидов: кросс-эксчендж-агрегация, приведение тиков и глубины к общей схеме, закрытие пропусков, 
обработка сплитов и контрактных изменений. Поверх — ансамбли из 200+ индикаторов, поведенческие/режимные фильтры
и микроструктурные признаки. Исторический пласт — 87 ТБ, свыше 37 млрд свечей.`,
      `Ончейн-уровень: адресные графы, концентрация держателей, ввод/вывод ликвидности, мостовые перемещения, базовые MEV-риски.
Публичные блокчейны не являются персональными данными; при этом операционные логи (в пределах закона) помогают 
обеспечить надёжность и расследование инцидентов.`,
      `Сетевой стек: оптимизированные соединения к провайдерам ликвидности и маркет-данным, стратегия деградации
без потери критичных функций, горячие/тёплые кэши, приоритизация VIP-каналов обработки. Все вычислительные этапы трассируются.`,
    ],
  },

  {
    title: 'Безопасность и соответствие',
    paras: [
      `Некостодиальная модель: ключи у пользователя, авторизация — подписью. Ролевой доступ, 
минимизация персональных данных, шифрование «в полёте» и «на хранении», анти-fraud/anti-sybil пайплайны.
Логирование действий для аудита и воспроизводимости.`,
      `Регуляторный контекст: мы предоставляем аналитику и инструменты, а не финансовые рекомендации.
Оплата подписки через NowPayments с ончейн-подтверждением — автоматическая активация лимитов/прав без ручных «чеков». 
Политики конфиденциальности и логирования — прозрачные и регулярного обновления.`,
      `Ограничители исполнения — это дисциплина, а не гарантия. Рынок волатилен; решения и соблюдение требований юрисдикций —
на стороне пользователя. Мы даём рамки, метрики и explainability, чтобы риск был осознанным.`,
    ],
  },

  {
    title: 'Дорожная карта и запуск',
    paras: [
      `H2 2026: публичный запуск ядра L7 Exchange и L7-блокчейна нового поколения — межсетевой слой согласования,
призванный упростить клиринг и права доступа на уровне смарт-контрактов, а также улучшить наблюдаемость исполнения.
Основной акцент — маршрутизация ликвидности, explainable auto-execute, портфельная атрибуция и командные режимы.`,
      `QCoin — внутренняя экономика экосистемы L7. В дорожной карте — роль QCoin в платёжных/стимулирующих процессах экосистемы.
Цель — единый «расчётный слой» между аналитикой, исполнением и пользовательскими сервисами.`,
      `Перед публичным релизом — расширенные беты, стресс-тесты, отчёты стабильности и открытые журналируемые результаты 
по качеству исполнения и задержкам. Прозрачность — ядро доверия.`,
    ],
  },
],

roadmap: 'Дорожная карта',

ex_bullets: [
  'Смарт-маршрутизация CEX/DEX со слиппедж-контролем, сплитами и latency-aware исполнением',
  'Explainable AI-сигналы: вероятность, амплитуда, горизонты, факторы уверенности, TP/SL',
  'Портфельные панели: атрибуция PnL, риск-бюджеты, «mark-out», impact-метрики',
  'Бэктесты и реплеи на исторических потоках прямо на графике',
  'Ограничители риска: лимиты, time-in-force, kill-switch, динамические стоп-коридоры',
  'Унификация данных: 87 ТБ историй, 37+ млрд свечей, 200+ индикаторов и режимные фильтры',
  'Подключение кошельков, некостодиальная модель и журналируемый аудит действий',
  'H2 2026: публичный запуск ядра L7 Exchange и L7-блокчейна нового поколения',
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
hero_title: 'Ласкаво просимо до Всесвіту Quantum L7 AI',
hero_subtitle:
  'Quantum L7 AI — це не просто платформа, а цілий кібернетичний всесвіт прийняття рішень: мультичейн-дані інституційного класу, автономні L7-агенти, ончейн-пайплайни та торговельна маршрутизація працюють як єдиний цифровий організм. Ми поєднуємо Web-MiniApp, Telegram MiniApp і QL7 AI Bot, форум з економікою QCoin та глобальну біржу (ядро на фінальній стадії), щоб надати миттєві альфа-сигнали, дисципліновані вікна входу/виходу, автоматизоване виконання та прозорий ризик-контур. Авторизація — через некостодіальні гаманці (ключі у вас), підтримка рівнів PRO/VIP, пріоритетні ліміти та зняття квот. В основі — юридично вивірена архітектура Web3, кросс-екчейндж-агрегація ліквідності, поведінкові та мікроструктурні моделі, а також відтворювані ресерч-пайплайни з логом гіпотеза → тест → свідчення. Це інфраструктура нового покоління для тих, хто працює в темпі ринку й потребує доказовості, швидкості та точності.',
hero_cta: 'Почати в Telegram',
hero_learn_more: 'Докладніше',
marquee: 'ШІ • Квантові агенти • Ончейн-аналітика • Криптобіржа (ядро) • Форум • QCoin Майнінг • Автовиконання • Risk-контур • Маршрутизація ліквідності • Метавсесвіт Web3 • API/SDK • Enterprise • Усі права захищено',

home_blocks: [
  {
    title: 'Чому Quantum L7 AI',
    paras: [
      `Quantum L7 AI — кросплатформна екосистема: ШІ-ядро, автономні L7-агенти, ончейн-моніторинг, нормалізовані маркет-фіди, соціальна мережа форуму та економіка QCoin об’єднані в єдину обчислювальну тканину. Кожен артефакт — транзакція, новинний наратив, пост, графік ліквідності — потрапляє в загальний контур даних і стає сигналом до дії.`,
      `Агенти L7 автономно читають документи й API, спостерігають блокчейни та стакани, класифікують поведінкові патерни, оцінюють режими ринку та формують перевірювані гіпотези. Результат — не «чорна скринька», а пояснювана картка: імовірність сценарію, амплітуда, горизонти, SL/TP, фактори впевненості та посилання на першоджерела.`,
      `Авторизація — через некостодіальні гаманці: ми не зберігаємо приватні ключі, а підтверджуємо володіння адресою. Права доступу й квоти синхронізуються між Telegram MiniApp, веб-інтерфейсом і ботом QL7, статус VIP визначає межі лімітів і пропускає у пріоритетні канали обробки.`,
      `Маркет-ядро побудоване на кросбіржовій агрегації, уніфікації символів/контрактів і latency-aware обробці фідів. Ми поєднуємо інституційного рівня історії з потоками реального часу, щоб відстежувати дисперсію спреду, ударні об’єми, баланс заявок, MEV-ризики та ефект новинного імпульсу.`,
      `Принцип платформи — доказовість: гіпотеза → тест → свідчення. Кожен розрахунок логуються, метрики відтворювані, а арбітраж «шуму» відсікається фільтрами режимів. Так ми перетворюємо сирі дані на дисципліновані рішення, а інтуїцію — на перевірювану тактику.`,
      `Форум вбудовується в контур: контент проходить AI-скоринг (якість, залученість, анти-спам/anti-sybil), а активність мапується в економіку QCoin. Це не «соцмережа заради лайків», а цільова когнітивна шина, де знання та внесок конвертуються в токенізовану цінність.`,
    ],
  },

  {
    title: 'Що ви отримуєте',
    bullets: [
      'Квантову аналітику нового покоління: симбіоз AI-інтелекту, ончейн-метрик і мікроструктурних ознак ринку.',
      'Альфа-сигнали з імовірністю виконання, амплітудою та горизонтом, плюс прозоре обґрунтування факторів упевненості.',
      'Нормалізоване кросбіржове ядро даних: уніфікація символів/контрактів, ліквідності, спредів і частоти тікiв.',
      'Ончейн-моніторинг: розподіл власників, потоки через мости, ліквідність CEX/DEX, базові MEV-патерни.',
      'Глобальна біржа (ядро в розробці): маршрутизація ліквідності, захист від проскальзування, контекстна оцінка ризику.',
      'Auto-execute: виконання з fail-safe тригерами, динамічними стопами й аварійною зупинкою при аномаліях.',
      'Портфельні панелі: атрибуція PnL, ризик-бюджети, режими волатильності, коридори та дисципліна розміру позиції.',
      'Відтворювані дослідження: бектести, ноутбуки, візуальні звіти, what-if-сценарії та експозиція припущень.',
      'Стрічка наративів: AI-тональність, ембеддінги, довіра джерел і зв’язок новин із ціновими метриками.',
      'Форум-економіка: AI-модерація, QCoin-майнінг за внесок і активність, медіапостинг з алгоритмічним скорингом.',
      'VIP-програма: зняття денних квот у AI Box, розширені ліміти, пріоритетна обробка та X2 по QCoin для квестів/часу.',
      'Інтеграції: Telegram MiniApp, веб, бот QL7; єдина сесія, спільний статус і узгоджені права доступу.',
      'API/SDK/Webhooks: безпечні інтеграції, sandbox-режим, event-driven архітектура для команд та автоматизації.',
      'Мультичейн-стек: Ethereum, BSC, Polygon, Solana, TON, Avalanche тощо; мостування й урахування мережевої специфіки.',
      'Юридично вивірена Web3-архітектура: логування, розподіл ролей, криптографічна верифікація та приватність.',
    ],
  },

  {
    title: 'Інфраструктура та дані',
    paras: [
      `Маркет-дані: об’єднуємо історичні та потокові фіди CEX/DEX, приводимо до спільної схеми, закриваємо розриви, враховуємо спліти та особливості деривативів. Поверх — ансамблеві індикатори (RSI/ADX/ATR/VWAP/OBV/Ichimoku/об’ємні кластери), фільтри режимів і контекст ліквідності.`,
      `Ончейн-шар: адресні графи, переміщення ліквідності, концентрації власників, події мостів, базові MEV-ризики. Публічні блокчейни — не персональні дані, але ми обережно логуємо запити й відладкові ID для надійності та розслідування інцидентів.`,
      `Наративи та новини: мультимовна індексація, переклад, дедуплікація, скоринг джерел, оцінка новизни та коваріацій із ціною; результат — легка числова надбудова поряд із ціною й об’ємом, яка допомагає відрізнити шум від значущого імпульсу.`,
      `Сховища та кеш: поділ потоків на гарячі/теплі, деградація без втрати критичних функцій, пріоритизація каналів для VIP і системних завдань. Усі обчислювальні етапи мають трасування, контроль версій артефактів і відтворюваність.`,
    ],
  },

  {
    title: 'Безпека та відповідність',
    paras: [
      `Некостодіальна модель: приватні ключі та сид-фрази залишаються у користувача. Авторизація — підписом; доступи — за ролями, журналюються й перевіряються. Мінімізація персональних даних, шифрування під час передачі та зберігання, анти-fraud/anti-sybil пайплайни.`,
      `Юридична чистота: ми надаємо аналітику й інструменти, а не фінансові поради. Флоу оплати через NowPayments з ончейн-підтвердженням активує підписку автоматично; статус синхронізується між MiniApp/веб/ботом. Політики приватності та логування — прозорі й оновлюються.`,
      `Обмежувачі виконання: sanity-checks, ліміти, аварійні стоп-тригери та моніторинг аномалій. Це інструменти дисципліни, а не гарантія результату; трейдинг пов’язаний із ризиком, рішення — на стороні користувача.`,
    ],
  },

  {
    title: 'Інтеграції: MiniApp • Бот • Форум • Біржа',
    paras: [
      `Telegram MiniApp і веб працюють як дзеркальні інтерфейси з єдиною сесією та правами. Бот QL7 — легкий вхід до AI-каналу й сповіщень. Форум — не просто ком’юніті: це когнітивна шина, де знання й внесок конвертуються в QCoin, а контент VIP проходить пріоритетний AI-скоринг.`,
      `Біржа (ядро на фінальній стадії): маршрутизація ордерів, контекстна оцінка проскальзування, ончейн-виконання там, де застосовується, і розширені режими backtest/what-if для VIP. Інтеграція з аналітикою дає рідкісний ефект — сигнал знає, «як» він буде виконаний.`,
    ],
  },

  {
    title: 'VIP і економіка QCoin',
    paras: [
      `VIP знімає денні квоти в AI Box, розширює ліміти та пріоритизує обробку. На форумі VIP отримує X2 множники за час і квести, золотий бейдж і збільшену вагу медіапостів (відео/зображення/аудіо) в алгоритмічному скорингу. Активність, внесок і перегляди конвертуються в QCoin із урахуванням якості та залученості.`,
      `Оплата через NowPayments: щойно on-chain підтвердження надходить, статус активується миттєво й поширюється на MiniApp/бот/веб. У дорожній карті — запуск L7-чейну: VIP — верхні шари priority-tier для розподілів і черг виведення QCoin, ранні ролі валідаторів/стейкерів і підвищені ліміти.`,
    ],
  },

  {
    title: 'Для команд і розробників',
    bullets: [
      'API/SDK/Webhooks із безпечною моделлю токенів і ротацією ключів.',
      'Event-driven інтеграції, sandbox-середовища, конектори до ончейн/офчейн джерел.',
      'White-Label і Enterprise-режими: SSO, приватні деплої, SLA, вікна змін.',
      'Ноутбуки/бектести: експорт артефактів, звіти, відтворюваність експериментів.',
      'Глибокі метрики приймання фіч і продуктивності для продуктових команд.',
    ],
  },
],


/* ===== ABOUT ===== */ 
about_title: 'Про Quantum L7 AI',
about_paragraphs: [
  `Quantum L7 AI — це не просто «аналітика», а єдиний операційний контур ухвалення торговельних рішень і соціальної взаємодії навколо крипторинків. Ядро платформи об’єднує Web-MiniApp (веб + Telegram), форуми з гейміфікованим майнінгом QCoin і ІІ-ресерч-рушій, який прибирає шум, виявляє структуру ліквідності та підказує дисципліновані сценарії входу/виходу. Ми поєднуємо ринкову мікроструктуру, ончейн-телеметрію, поведінкові патерни та новинні наративи в один узгоджений, інтерпретований шар — так, щоб вам не доводилося «наздоганяти» ринок, а можна було проєктувати хід заздалегідь.`,

  `L7-агенти — це прикладні ІІ-модулі, які живуть на даних. Вони читають документи та стрічки, запитують API, спостерігають блокчейни, стакани й деривативи, проганяють мініексперименти та видають пояснювані артефакти: гіпотези, бектест-снепшоти, контекстні індикатори. Важлива не «магія чорної скриньки», а трасованість: із кожного висновку видно шлях — які ознаки було враховано (ліквідність, спреди, асиметрія, дисбаланси, імпульси, кластери обсягів), чому знижено вагу в тонких/маніпульованих зонах і де проходить межа невалідності сценарію.`,

  `Для кого це. Трейдерам — швидка ситуаційна обізнаність і керована частота сигналів без перевантаження; дослідникам — відтворювані пайплайни та чисті дані; командам — API/SDK, вебхуки й надійна шина подій; білдер-спільноті — форуми, репутаційні метрики та економіка QCoin за внесок. VIP+ отримує пріоритетний ІІ-канал, медіапостинг, пришвидшені квоти та «золотий» статус, який впливає на видачу й ліміти.`,

  `Покриття. Ми агрегуємо дані з провідних CEX і DEX-агрегаторів, нормалізуємо символи й контракт-метадані, уніфікуємо частоти тіків і глибину стаканів. Уводимо єдині довідники, мепінги пар/мереж/ринків, позначаємо деривативи, враховуємо спліти, делістинги та міграції контрактів. Мета — співставність майданчиків і мереж: один шар абстракції, щоб порівнювати ліквідність, витрати, затримки та «реальну» доступність обсягів.`,

  `Пайплайн даних. Потоки очищуються, пропуски відновлюються, аномалії маркуються, контури затримок калібруються. Історія глибока — це дає змогу виявляти режими, а не натягувати вказівник на випадковий сплеск. Ми додаємо ончейн-маршрути, переказні мости, розподіли тримачів, ознаки MEV-активності та пов’язуємо це з ринковими метриками. Підсумок — ансамблі ознак, стійкі до «бульбашок шуму» й локальних аномалій.`,

  `Аналітичне ядро. Сотні індикаторів — лише палітра. Головне — ансамблі та контекст: RSI/RSX, Stochastic, CCI/MFI, ADX/DI, ATR і смуги, EMA/SMA/WMA, MACD/Signal/Histogram, VWAP/POC/Value-Area, об’ємні профілі, дисбаланси Bid/Ask і свіпи ліквідності. Ми змішуємо класичні сімейства з фільтрами режимів, евристиками з ліквідності та поведінки, а також з ончейн-маркером притоку/відтоку. Кожна картка — це не «порада», а компас: амплітуда за історією, горизонт реалізації, упевненість, передумови та межі інвалідації.`,

  `Ончейн-модулі. Ми відстежуємо переказні кластери, мости, накопичення/розподіл, концентрацію великих тримачів, базові MEV-патерни та аномальні маршрути. У тонких зонах ліквідності, за сплесків фондінгу чи спреду вага сигналів знижується; за підтвердження кількома доменами (спот, деривативи, ончейн) — підвищується. Так мінімізується «хибна впевненість» там, де ринок крихкий.`,

  `Наративи та новини. Багатомовна стрічка перекладається, дедуплікується й індексується за ембедингами. Ми оцінюємо новизну, довіру до джерела, співвідношення «ритуал/сутність», тональність і «липкість» теми в часі. Поруч із ціновими та ончейн-метриками з’являється легка «карта наративу»: чим драйвиться увага, де регуляторні ризики, що підсилює волатильність, а що здувається.`,

  `Картки сигналів і дисципліна. На картці — очікувана амплітуда (квантілі), часовий горизонт, SL/TP-маркери, швидка зведена з ліквідності та набір тригерів, які мають зійтися. Система підштовхує до дисципліни: до входу ви бачите інвалідацію, ризик-одиницю й динамічний коридор волатильності; після — отримуєте перевірочні чек-поінти та умови зняття ризику.`,

  `Архітектура. Легкі сервіси на TypeScript/Python за стабільним API; сайт — на Next.js із живими шарами через WebSocket. Кеш-рівні та резервні джерела забезпечують плавну деградацію в піках. API/SDK і вебхуки дають автоматизацію, а ролі й аудит — безпечні межі. MiniApp працює у вебі й у Telegram, щоб ви могли вести ринок в одному потоці: графіки, форум, гаманець, бот — без тертя.`,

  `Безпека та приватність. Некостодіально: приватні ключі/seed не запитуємо й не зберігаємо. Ролі обмежують доступ, дії логуються, персональні дані мінімізуються та шифруються під час передавання і зберігання. Anti-sybil/anti-fraud пайплайни захищають економіку QCoin і репутаційні механіки форуму; валідація сесій дбайливо, але суворо підтримує цілісність доступу.`,

  `Форум і майнінг QCoin. Форум — це не «соцмережа», а виробнича лінія знань. Кожні 4 години ви підтверджуєте активність і фіксуєте винагороду; пости з медіа (відео/зображення/аудіо) проходять скоринг QuantumLCM-AI (якість, залученість, анти-спам/anti-sybil) і конвертуються в QCoin. VIP+ отримує X2 за часом і X2 за квестами, пріоритет у видачі, розширені ліміти на медіа та пришвидшену модерацію. Репутація і внесок — не порожній шум, а економічно значуща величина.`,

  `Біржа (в розробці) і рекомендації. Торговельне ядро та виконання під’єднуються поетапно; уже доступні ІІ-рекомендації за символами/таймфреймами, глибина стакана й профіль ліквідності. Ми проєктуємо smart-routing, захист від затримок/прослизання, портфельні обмеження й атрибуцію PnL. VIP+ отримує доступ до експериментальних індикаторів, режимів what-if/backtest і розширених горизонтів аналізу.`,

  `Економіка QCoin і L7-блокчейн. QCoin — паливо знань і корисного трафіку. Майбутній L7-chain — це шар, який поєднує кросмережеві активи, банки та фінінфраструктуру в універсальний маршрутизатор цінності. Наша мета — щоб QCoin став нейтральною розрахунковою одиницею в екосистемі, з прозорою емісією/спалюванням і чесною чергою виводу. VIP+ має підвищений пріоритет на розподіли й ранній доступ до стейкінгу/валідаторських ролей.`,

  `Оплата й активація. Підписка VIP+ оформлюється через NowPayments: криптооплата (USDT та ін.), вебхук миттєво активує доступ і синхронізує статус між MiniApp, ботом і форумом. Жодних скріншотів і ручних перевірок. Інтерфейс доступний 7 мовами; зв’язка гаманця — безшовна. Ви платите за швидкість, інтерпретованість і економіку, у якій внесок винагороджується.`,

  `Ком’юніті та дорожня карта. Ми публікуємо щотижневі нотатки, відкриваємо бети альфа-фіч, приймаємо цільові запити від команд. У беклозі: портфельний рушій із ризик-бюджетами, розширена смарт-маршрутизація CEX/DEX, публічні ноутбуки/бектести, «напівавтопілот» під контролем людини. Усе, що підвищує дисципліну й знижує тертя, іде в реліз; те, що блищить, але не допомагає — ні. Матеріали — освітні/аналітичні, не фінансова порада.`
],

about_sections: [
  { title: 'Що таке Quantum L7 AI',             parasIdx: [0] },
  { title: 'L7-агенти, а не «чорна скринька»',   parasIdx: [1] },
  { title: 'Для кого',                           parasIdx: [2] },
  { title: 'Покриття',                           parasIdx: [3] },
  { title: 'Пайплайн даних',                     parasIdx: [4] },
  { title: 'Аналітичне ядро',                    parasIdx: [5] },
  { title: 'Ончейн-модулі',                      parasIdx: [6] },
  { title: 'Наративи та новини',                 parasIdx: [7] },
  { title: 'Картки та дисципліна',               parasIdx: [8] },
  { title: 'Архітектура',                        parasIdx: [9] },
  { title: 'Безпека та приватність',             parasIdx: [10] },
  { title: 'Форум і майнінг QCoin',              parasIdx: [11] },
  { title: 'Біржа та рекомендації',              parasIdx: [12] },
  { title: 'Економіка QCoin і L7-ланцюг',        parasIdx: [13] },
  { title: 'Оплата, локалізація, дорожня карта', parasIdx: [14] }
],

about_bullets: [
  'Ситуаційна обізнаність: тренд, імпульс, волатильність, ліквідність',
  'Кросбіржова нормалізація, latency-aware зважування ознак',
  'Ончейн-потоки, концентрації тримачів, мости, натяки MEV',
  'Наративна стрічка з перекладом і оцінкою довіри/новизни',
  'Картки: амплітуда (квантілі), горизонти, SL/TP, упевненість',
  'Ансамблі індикаторів + фільтри режимів + поведінка',
  'API/SDK і вебхуки для автоматизації без «магії»',
  'Плавна деградація та резервні джерела в пікове навантаження',
  'Некостодіальна безпека: ролі, аудит, шифрування',
  'Форум: майнінг QCoin, квести, медіапостинг з AI-скорингом',
  'VIP+: X2 за часом і квестами, пріоритет у видачі та лімітах',
  'Рекомендації на біржі вже доступні; ядро виконання на підході',
  'NowPayments: миттєва активація, синхронізація статусу',
  'L7-блокчейн: пріоритетні черги виводу та ранні ролі',
  '7 мов, єдиний доступ у вебі й Telegram MiniApp'
],

tg_button: 'Телеграм',


/* ===== EXCHANGE (розширений опис) ===== */
exchange_title: 'Біржа (у розробці)',
exchange_sub:
  `Quantum L7 Exchange — це багатоланцюгова, правдоподібно пояснювана торгова платформа нового покоління,
що об’єднує CEX/DEX-ліквідність, ІІ-рекомендації та інституційну інфраструктуру даних в єдину обчислювальну тканину.
Ми обробляємо 87 ТБ ринкових історій і понад 37 млрд історичних свічок по всіх великих мережах і майданчиках, нормалізуємо тікі,
глибину книг заявок і специфікації деривативів, приводячи ринок до одного стандарту ухвалення рішень. Мета — не «ще одна біржа»,
а контур виконання з доведеною логікою: гіпотеза → тест → свідчення → угода, з прозорими обмежувачами ризику та простежуваним аудитом.`,

exchange_sections: [
  {
    title: 'Бачення: біржа нового покоління L7',
    paras: [
      `L7 Exchange — це агентний пайплайн, де автономні L7-агенти споживають маркет-фіди, ончейн-події, новини та поведінкові сигнали
мікроструктури, синхронізують їх у часі та видають пояснювані рекомендації (BUY/SELL/HOLD) з імовірністю,
амплітудою, горизонтом і контекстом ризику (ліквідність, спред, дисперсія, аномалії). Для користувача це означає
відтворюваність рішень: кожна картка сигналу супроводжується логом факторів, версіями моделей і посиланнями на першоджерела.`,
      `Ідентичність — через некостодіальні гаманці (ми не зберігаємо приватні ключі та seed-фрази). Права доступу,
квоти та ліміти синхронізуються у веб-інтерфейсі та MiniApp. Виконання дій — тільки в межах заданих вами
обмежувачів і за достатнього рівня впевненості моделі. Принцип платформи — доведеність, а не «чорна скринька».`,
      `Дані інституційного рівня: 87 ТБ історій, 37+ млрд свічок, уніфікація контрактів і символів,
обробка потоків з урахуванням затримок (latency-aware), очищення розривів, урахування сплітів і специфік деривативів. Поверх — ансамблі з 200+ індикаторів
(RSI/ADX/ATR/VWAP/OBV/Ichimoku/об’ємні кластери, режимні фільтри тощо), поведінкові ознаки та статистика мікро-імбалансів.`,
      `H2 2026 — цільове вікно публічного запуску ядра L7 Exchange разом із L7-блокчейном нового покоління
(міжмережевий рівень узгодження). На старті — крос-біржова маршрутизація, пояснюване авто виконання,
а далі — розширення у бік ончейн-клірингу та нативних смарт-прав доступу.`,
    ],
  },

  {
    title: 'Маршрутизація та ліквідність',
    paras: [
      `Смарт-роутер паралельно сканує ліквідність на CEX/DEX, моделює сліпедж, комісії та затримки,
добирає майданчик/спліт-маршрут і контролює якість виконання через цільові метрики (expected fill, adverse selection,
mark-out через N секунд/хвилин). У режимі спліта заявки дробляться й розносяться по пулам/книгам, щоб мінімізувати вплив.`,
      `Latency має значення: підтримуємо cancel/replace, тайм-аути, «kill-switch», правила часткової фіксації та
реакцію на стрибки дисперсії спреда. В арбітражних сценаріях використовуються вікна синхронізації тіків і з’єднання з низькою затримкою.`,
      `Маркет-мікроструктура: аналізуємо дисбаланс заявок, сплески прихованого об’єму, ліквідність по рівнях,
вплив новин/ончейн-подій, поведінку «агресивних» принтів і ймовірність прослизання за розміром ноціоналу.`,
    ],
  },

  {
    title: 'Ризик і контроль',
    paras: [
      `Глобальні та інструментальні ліміти: за ноціоналом, часткою портфеля, денною/тижневою просадкою, плечем, концентрацією.
Профілі виконання (conservative/balanced/aggressive) і мінімальна потрібна впевненість моделі. Усі тригери прозоро описані
та логуються для аудиту. Будь-яка дія пояснювана: причина, вхідні дані, версії моделей і параметри виконання.`,
      `Conditional-ордера (stop/stop-limit), time-in-force (GTC/IOC/FOK), директиви часткової фіксації, динамічні стоп-коридори
за режимом волатильності (ATR-подібні), «circuit-breaker» при аномаліях, нічні «тиші» та блоки подій (наприклад, high-impact новини).`,
      `Анти-розгін і анти-стрибок: екстра-перевірки спреда/ліквідності, пороги відхилень від справедливої ціни, заборона усереднення «в прірву»,
аварійний рівень примусової деескалації, коли оточення стає «некоректним для торгів».`,
    ],
  },

  {
    title: 'Аналітика та пояснюваність',
    paras: [
      `AI-Box для кожного символу/TF показує рівень впевненості, фактори рішення (від відносного положення до VWAP/смуг
до режимів RSI/об’ємних кластерів), амплітуду й горизонти за історією (квантили) та рекомендовані TP/SL.
Подача компактна, але перевірювана: цифри, а не метафори.`,
      `Explainability by design: причина ➜ ефект. Картка містить ваги факторів, посилання на джерела,
моментальні знімки книг/об’ємів і «what-if» міні-симуляції. Мета — дати трейдеру прозорий скелет рішення,
який можна відтворити й оскаржити.`,
      `Новини/наративи: мультимовний парсинг, переклад, дедуплікація, AI-тональність, довіра до джерела, зв’язок із ціновою реакцією.
Це не «шум», а контекст для оцінки імовірності сценарію та часових вікон виконання.`,
    ],
  },

  {
    title: 'Портфель, звітність і атрибуція',
    paras: [
      `Портфельні панелі з атрибуцією PnL: decomposition за джерелами альфи, режимами ринку, символами, ризик-бюджетами та
рішеннями моделі. Окремо рахуються «mark-out» і impact-метрики, щоб відрізняти «везіння» від системності.`,
      `Журнали угод, експорт, звіти, API для інтеграцій. Репліковуваність досліджень: бек-тести та «replay»
на історичних потоках прямо поверх графіка. «Шаблони стратегій» і «one-click» розгортання з обмежувачами.`,
      `Командні режими (roadmap): ролі, права, погодження параметрів, централізовані звіти,
white-label і приватні розгортання для enterprise.`,
    ],
  },

  {
    title: 'Інфраструктура даних і мережі',
    paras: [
      `Уніфікація фідів: крос-біржова агрегація, приведення тіків і глибини до спільної схеми, закриття пропусків,
обробка сплітів і контрактних змін. Поверх — ансамблі з 200+ індикаторів, поведінкові/режимні фільтри
та мікроструктурні ознаки. Історичний пласт — 87 ТБ, понад 37 млрд свічок.`,
      `Ончейн-рівень: адресні графи, концентрація тримачів, ввід/вивід ліквідності, мостові переміщення, базові MEV-ризики.
Публічні блокчейни не є персональними даними; при цьому операційні логи (у межах закону) допомагають
забезпечити надійність і розслідування інцидентів.`,
      `Мережевий стек: оптимізовані з’єднання до провайдерів ліквідності та маркет-даних, стратегія деградації
без втрати критичних функцій, гарячі/теплі кеші, пріоритизація VIP-каналів обробки. Усі обчислювальні етапи трасуються.`,
    ],
  },

  {
    title: 'Безпека та відповідність',
    paras: [
      `Некостодіальна модель: ключі у користувача, авторизація — підписом. Рольовий доступ,
мінімізація персональних даних, шифрування «в польоті» і «на зберіганні», анти-fraud/anti-sybil пайплайни.
Логування дій для аудиту та відтворюваності.`,
      `Регуляторний контекст: ми надаємо аналітику й інструменти, а не фінансові рекомендації.
Оплата підписки через NowPayments з ончейн-підтвердженням — автоматична активація лімітів/прав без ручних «чеків».
Політики конфіденційності та логування — прозорі та регулярного оновлення.`,
      `Обмежувачі виконання — це дисципліна, а не гарантія. Ринок волатильний; рішення та дотримання вимог юрисдикцій —
на боці користувача. Ми даємо рамки, метрики та explainability, щоб ризик був усвідомленим.`,
    ],
  },

  {
    title: 'Дорожня карта і запуск',
    paras: [
      `H2 2026: публічний запуск ядра L7 Exchange і L7-блокчейна нового покоління — міжмережевий шар узгодження,
покликаний спростити кліринг і права доступу на рівні смарт-контрактів, а також покращити спостережуваність виконання.
Основний акцент — маршрутизація ліквідності, explainable auto-execute, портфельна атрибуція та командні режими.`,
      `QCoin — внутрішня економіка екосистеми L7. У дорожній карті — роль QCoin у платіжних/стимулюючих процесах екосистеми.
Мета — єдиний «розрахунковий шар» між аналітикою, виконанням і користувацькими сервісами.`,
      `Перед публічним релізом — розширені бети, стрес-тести, звіти стабільності та відкриті журналовані результати
щодо якості виконання й затримок. Прозорість — ядро довіри.`,
    ],
  },
],

roadmap: 'Дорожня карта',

ex_bullets: [
  'Смарт-маршрутизація CEX/DEX зі сліпедж-контролем, сплітами та latency-aware виконанням',
  'Explainable AI-сигнали: імовірність, амплітуда, горизонти, фактори впевненості, TP/SL',
  'Портфельні панелі: атрибуція PnL, ризик-бюджети, «mark-out», impact-метрики',
  'Бек-тести й реплеї на історичних потоках прямо на графіку',
  'Обмежувачі ризику: ліміти, time-in-force, kill-switch, динамічні стоп-коридори',
  'Уніфікація даних: 87 ТБ історій, 37+ млрд свічок, 200+ індикаторів і режимні фільтри',
  'Підключення гаманців, некостодіальна модель і журналований аудит дій',
  'H2 2026: публічний запуск ядра L7 Exchange і L7-блокчейна нового покоління',
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
/* ===== HERO / HOME (breve) ===== */  
hero_title: 'Bienvenido al Universo Quantum L7 AI',
hero_subtitle:
  'Quantum L7 AI no es solo una plataforma, sino todo un universo cibernético de toma de decisiones: datos multichain de clase institucional, agentes L7 autónomos, pipelines on-chain y enrutamiento de trading funcionan como un único organismo digital. Acoplamos Web-MiniApp, Telegram MiniApp y QL7 AI Bot, el foro con la economía de QCoin y la bolsa global ( núcleo en fase final ), para ofrecer señales alfa instantáneas, ventanas disciplinadas de entrada/salida, ejecución automatizada y un contorno de riesgo transparente. La autorización es a través de carteras no custodiales (las llaves son tuyas), soporte de niveles PRO/VIP, límites prioritarios y eliminación de cuotas. En la base hay una arquitectura Web3 jurídicamente afinada, agregación de liquidez entre exchanges, modelos de comportamiento y microestructurales, así como pipelines de research replicables con registro hipótesis → prueba → evidencias. Es una infraestructura de nueva generación para quienes trabajan al ritmo del mercado y exigen demostrabilidad, velocidad y precisión.',
hero_cta: 'Empezar en Telegram',
hero_learn_more: 'Más información',
marquee: 'IA • Agentes cuánticos • Analítica on-chain • Criptobolsa (núcleo) • Foro • Minería de QCoin • Autoejecución • Contorno de riesgo • Enrutamiento de liquidez • Metaverso Web3 • API/SDK • Enterprise • Todos los derechos reservados',

home_blocks: [
  {
    title: 'Por qué Quantum L7 AI',
    paras: [
      `Quantum L7 AI es un ecosistema multiplataforma: núcleo de IA, agentes L7 autónomos, monitoreo on-chain, feeds de mercado normalizados, red social del foro y economía de QCoin unidos en un único tejido computacional. Cada artefacto —transacción, narrativa de noticias, publicación, gráfico de liquidez— entra en el contorno común de datos y se convierte en una señal para la acción.`,
      `Los agentes L7 leen de forma autónoma documentos y API, observan blockchains y order books, clasifican patrones de comportamiento, evalúan regímenes de mercado y producen hipótesis verificables. El resultado no es una «caja negra», sino una tarjeta explicable: probabilidad del escenario, amplitud, horizontes, SL/TP, factores de confianza y enlaces a fuentes primarias.`,
      `La autorización es a través de carteras no custodiales: no almacenamos claves privadas, sino que confirmamos la titularidad de la dirección. Los derechos de acceso y las cuotas se sincronizan entre Telegram MiniApp, la interfaz web y el bot QL7, el estado VIP delimita los límites y da paso a canales de procesamiento prioritarios.`,
      `El núcleo de mercado se construye sobre agregación entre exchanges, unificación de símbolos/contratos y procesamiento de feeds con conciencia de latencia (latency-aware). Combinamos historiales de nivel institucional con flujos en tiempo real para seguir la dispersión del spread, volúmenes de impacto, balance de órdenes, riesgos MEV y el efecto del impulso de noticias.`,
      `El principio de la plataforma es la demostrabilidad: hipótesis → prueba → evidencias. Cada cálculo se registra, las métricas son reproducibles y el arbitraje del «ruido» se recorta con filtros de régimen. Así convertimos datos en bruto en decisiones disciplinadas, y la intuición en táctica verificable.`,
      `El foro se integra en el contorno: el contenido pasa por scoring de IA (calidad, engagement, anti-spam/anti-sybil), y la actividad se mapea a la economía de QCoin. No es una «red social por los likes», sino un bus cognitivo orientado a objetivos donde el conocimiento y la contribución se convierten en valor tokenizado.`,
    ],
  },

  {
    title: 'Qué obtienes',
    bullets: [
      'Analítica cuántica de nueva generación: simbiosis de inteligencia de IA, métricas on-chain y rasgos microestructurales del mercado.',
      'Señales alfa con probabilidad de ejecución, amplitud y horizonte, más una justificación transparente de los factores de confianza.',
      'Núcleo de datos cross-exchange normalizado: unificación de símbolos/contratos, liquidez, spreads y frecuencia de ticks.',
      'Monitoreo on-chain: distribución de holders, flujos a través de puentes, liquidez CEX/DEX, patrones MEV básicos.',
      'Bolsa global (núcleo en desarrollo): enrutamiento de liquidez, protección contra slippage, evaluación contextual del riesgo.',
      'Auto-execute: ejecución con triggers a prueba de fallos (fail-safe), stops dinámicos y parada de emergencia ante anomalías.',
      'Paneles de portafolio: atribución de PnL, presupuestos de riesgo, regímenes de volatilidad, corredores y disciplina del tamaño de la posición.',
      'Investigaciones replicables: backtests, notebooks, informes visuales, escenarios what-if y exposición de supuestos.',
      'Feed de narrativas: tonalidad de IA, embeddings, confianza de las fuentes y vinculación de noticias con métricas de precio.',
      'Economía del foro: moderación por IA, minería de QCoin por contribución y actividad, publicación de medios con scoring algorítmico.',
      'Programa VIP: eliminación de cuotas diarias en AI Box, límites ampliados, procesamiento prioritario y X2 en QCoin para misiones/tiempo.',
      'Integraciones: Telegram MiniApp, web, bot QL7; sesión unificada, estado común y derechos de acceso alineados.',
      'API/SDK/Webhooks: integraciones seguras, modo sandbox, arquitectura dirigida por eventos (event-driven) para equipos y automatización.',
      'Stack multichain: Ethereum, BSC, Polygon, Solana, TON, Avalanche y otros; puenteo y consideración de la especificidad de la red.',
      'Arquitectura Web3 jurídicamente afinada: logging, separación de roles, verificación criptográfica y privacidad.',
    ],
  },

  {
    title: 'Infraestructura y datos',
    paras: [
      `Datos de mercado: unimos feeds históricos y en streaming de CEX/DEX, los llevamos a un esquema común, cerramos brechas y consideramos splits y particularidades de los derivados. Encima — indicadores en ensemble (RSI/ADX/ATR/VWAP/OBV/Ichimoku/clusteres de volumen), filtros de régimen y contexto de liquidez.`,
      `Capa on-chain: grafos de direcciones, movimientos de liquidez, concentraciones de holders, eventos de puentes, riesgos MEV básicos. Las blockchains públicas no son datos personales, pero registramos cuidadosamente solicitudes e ID de depuración para fiabilidad e investigación de incidentes.`,
      `Narrativas y noticias: indexación multilingüe, traducción, deduplicación, scoring de fuentes, evaluación de novedad y covariaciones con el precio; el resultado es una ligera sobreestructura numérica junto al precio y el volumen que ayuda a distinguir el ruido del impulso significativo.`,
      `Almacenamiento y caché: separación de flujos en calientes/templados, degradación sin pérdida de funciones críticas, priorización de canales para VIP y tareas del sistema. Todas las etapas computacionales tienen trazabilidad, control de versiones de artefactos y reproducibilidad.`,
    ],
  },

  {
    title: 'Seguridad y cumplimiento',
    paras: [
      `Modelo no custodial: las claves privadas y las frases semilla permanecen con el usuario. Autorización por firma; accesos por roles, registrados y auditados. Minimización de datos personales, cifrado en tránsito y en reposo, pipelines anti-fraude/anti-sybil.`,
      `Limpieza jurídica: proporcionamos analítica y herramientas, no consejos financieros. El flujo de pago vía NowPayments con confirmación on-chain activa la suscripción automáticamente; el estado se sincroniza entre MiniApp/web/bot. Las políticas de privacidad y logging son transparentes y se actualizan.`,
      `Limitadores de ejecución: sanity-checks, límites, triggers de stop de emergencia y monitoreo de anomalías. Son instrumentos de disciplina, no garantía de resultado; el trading conlleva riesgo y las decisiones están del lado del usuario.`,
    ],
  },

  {
    title: 'Integraciones: MiniApp • Bot • Foro • Bolsa',
    paras: [
      `Telegram MiniApp y la web funcionan como interfaces espejadas con sesión y derechos unificados. El bot QL7 es una entrada ligera al canal de IA y a las notificaciones. El foro no es solo una comunidad: es un bus cognitivo donde el conocimiento y la contribución se convierten en QCoin, y el contenido VIP pasa por un scoring de IA prioritario.`,
      `Bolsa (núcleo en fase final): enrutamiento de órdenes, evaluación contextual del slippage, ejecución on-chain donde aplique y modos ampliados de backtest/what-if para VIP. La integración con la analítica ofrece un efecto poco común: la señal sabe «cómo» se ejecutará.`,
    ],
  },

  {
    title: 'VIP y economía de QCoin',
    paras: [
      `VIP elimina las cuotas diarias en AI Box, amplía los límites y prioriza el procesamiento. En el foro, VIP recibe multiplicadores X2 por tiempo y misiones, una insignia dorada y mayor peso de las publicaciones de medios (video/imagen/audio) en el scoring algorítmico. La actividad, la contribución y las visualizaciones se convierten en QCoin considerando calidad y engagement.`,
      `Pago vía NowPayments: en cuanto llega la confirmación on-chain, el estado se activa al instante y se propaga a MiniApp/bot/web. En la hoja de ruta está el lanzamiento de L7-chain: VIP — capas superiores del priority-tier para distribuciones y colas de retiro de QCoin, roles tempranos de validadores/stakers y límites aumentados.`,
    ],
  },

  {
    title: 'Para equipos y desarrolladores',
    bullets: [
      'API/SDK/Webhooks con modelo seguro de tokens y rotación de claves.',
      'Integraciones dirigidas por eventos (event-driven), entornos sandbox, conectores a fuentes on-chain/off-chain.',
      'Modos White-Label y Enterprise: SSO, despliegues privados, SLA, ventanas de cambio.',
      'Notebooks/backtests: exportación de artefactos, informes y reproducibilidad de experimentos.',
      'Métricas profundas de adopción de features y rendimiento para equipos de producto.',
    ],
  },
],

/* ===== ABOUT ===== */  
about_title: 'Acerca de Quantum L7 AI',
about_paragraphs: [
  `Quantum L7 AI no es solo «analítica», sino un único contorno operativo para la toma de decisiones de trading y la interacción social alrededor de los cripto­mercados. El núcleo de la plataforma unifica Web-MiniApp (web + Telegram), foros con minería gamificada de QCoin y un motor de investigación con IA que elimina el ruido, revela la estructura de liquidez y sugiere escenarios disciplinados de entrada/salida. Conectamos la microestructura del mercado, la telemetría on-chain, los patrones de comportamiento y las narrativas de noticias en una única capa coherente e interpretable, para que no tengas que «correr detrás» del mercado, sino poder diseñar la jugada de antemano.`,

  `Los agentes L7 son módulos de IA aplicados que viven de los datos. Leen documentos y feeds, consultan APIs, observan blockchains, libros de órdenes y derivados, ejecutan mini-experimentos y entregan artefactos explicables: hipótesis, instantáneas de backtest e indicadores contextuales. Lo importante no es la «magia de la caja negra», sino la trazabilidad: desde cada conclusión se ve el camino — qué señales se tuvieron en cuenta (liquidez, spreads, asimetría, desbalances, impulsos, clústeres de volumen), por qué se redujo el peso en zonas finas/manipulables y dónde está el límite de invalidez del escenario.`,

  `Para quién es. Para traders — conciencia situacional rápida y frecuencia de señales controlada sin sobrecarga; para investigadores — pipelines reproducibles y datos limpios; para equipos — API/SDK, webhooks y un bus de eventos confiable; para la comunidad de builders — foros, métricas de reputación y economía de QCoin por contribución. VIP+ obtiene un canal de IA prioritario, publicación de medios, cuotas aceleradas y un estatus «dorado» que influye en la exposición y los límites.`,

  `Cobertura. Agregamos datos de los principales CEX y agregadores DEX, normalizamos símbolos y metadatos de contratos, unificamos frecuencias de ticks y profundidad de libros. Introducimos catálogos unificados, mapeos de pares/redes/mercados, marcamos derivados, tenemos en cuenta splits, delistings y migraciones de contratos. El objetivo es la comparabilidad entre plataformas y redes: una sola capa de abstracción para comparar liquidez, costes, latencias y la disponibilidad «real» de volúmenes.`,

  `Pipeline de datos. Los flujos se limpian, los huecos se restauran, las anomalías se marcan y los contornos de latencia se calibran. La historia es profunda — esto permite identificar regímenes y no encajar un puntero sobre un pico aleatorio. Añadimos rutas on-chain, puentes de transferencia, distribuciones de holders, señales de actividad MEV y lo vinculamos con métricas de mercado. El resultado son conjuntos de características resistentes a «burbujas de ruido» y anomalías locales.`,

  `Núcleo analítico. Cientos de indicadores son solo la paleta. Lo principal son los conjuntos y el contexto: RSI/RSX, Stochastic, CCI/MFI, ADX/DI, ATR y bandas, EMA/SMA/WMA, MACD/Signal/Histogram, VWAP/POC/Value-Area, perfiles de volumen, desbalances Bid/Ask y barridos de liquidez. Mezclamos familias clásicas con filtros de régimen, heurísticas de liquidez y comportamiento, así como con un marcador on-chain de entrada/salida de flujos. Cada tarjeta no es un «consejo», sino una brújula: amplitud histórica, horizonte de materialización, confianza, supuestos y límites de invalidación.`,

  `Módulos on-chain. Rastrearmos clústeres de transferencias, puentes, acumulación/distribución, concentración de grandes tenedores, patrones MEV básicos y rutas anómalas. En zonas de liquidez fina, o con picos de funding o de spread, el peso de las señales se reduce; cuando se confirma en varios dominios (spot, derivados, on-chain) — aumenta. Así se minimiza la «falsa confianza» donde el mercado es frágil.`,

  `Narrativas y noticias. El feed multilingüe se traduce, se desduplica y se indexa mediante embeddings. Evaluamos la novedad, la confianza en la fuente, la proporción «ritual/esencia», la tonalidad y la persistencia del tema en el tiempo. Junto a las métricas de precio y on-chain aparece un «mapa de narrativa» ligero: qué impulsa la atención, dónde están los riesgos regulatorios, qué aumenta la volatilidad y qué se desinfla.`,

  `Tarjetas de señales y disciplina. En la tarjeta — amplitud esperada (cuantiles), horizonte temporal, marcadores SL/TP, un resumen rápido de liquidez y un conjunto de triggers que deben confluir. El sistema impulsa la disciplina: antes de entrar ves la invalidación, la unidad de riesgo y el corredor dinámico de volatilidad; después — recibes checkpoints de verificación y condiciones para retirar riesgo.`,

  `Arquitectura. Servicios ligeros en TypeScript/Python tras un API estable; el sitio — en Next.js con capas en vivo vía WebSocket. Niveles de caché y fuentes de respaldo aseguran una degradación suave en picos. API/SDK y webhooks habilitan la automatización, y los roles y el auditoría marcan límites seguros. MiniApp funciona en la web y en Telegram para que puedas llevar el mercado en un mismo flujo: gráficos, foro, billetera, bot — sin fricción.`,

  `Seguridad y privacidad. No custodial: no solicitamos ni almacenamos claves privadas/seed. Los roles restringen el acceso, las acciones se registran, los datos personales se minimizan y se cifran en tránsito y en reposo. Los pipelines anti-sybil/anti-fraude protegen la economía de QCoin y los mecanismos de reputación del foro; la validación de sesiones mantiene con cuidado, pero con rigor, la integridad del acceso.`,

  `Foro y minería de QCoin. El foro no es una «red social», sino una línea de producción de conocimiento. Cada 4 horas confirmas actividad y bloqueas la recompensa; las publicaciones con medios (video/imagen/audio) pasan el scoring de QuantumLCM-AI (calidad, engagement, anti-spam/anti-sybil) y se convierten en QCoin. VIP+ obtiene X2 en tiempo y X2 en misiones, prioridad en la exposición, límites ampliados para medios y moderación acelerada. Reputación y contribución no son ruido vacío, sino una magnitud económicamente significativa.`,

  `Exchange (en desarrollo) y recomendaciones. El núcleo de trading y la ejecución se conectan por etapas; ya están disponibles recomendaciones con IA por símbolos/marcos temporales, profundidad de libro y perfil de liquidez. Diseñamos smart-routing, protección frente a latencias/deslizamiento, restricciones de cartera y atribución de PnL. VIP+ obtiene acceso a indicadores experimentales, modos what-if/backtest y horizontes de análisis ampliados.`,

  `Economía de QCoin y L7-blockchain. QCoin es el combustible del conocimiento y del tráfico útil. El futuro L7-chain es una capa que conecta activos cross-chain, bancos e infra financiera en un enrutador universal de valor. Nuestro objetivo es que QCoin se convierta en una unidad de liquidación neutral en el ecosistema, con emisión/quema transparente y una cola de retirada justa. VIP+ tiene prioridad elevada en distribuciones y acceso temprano a staking/roles de validador.`,

  `Pago y activación. La suscripción VIP+ se tramita vía NowPayments: pago cripto (USDT y otros), el webhook activa el acceso al instante y sincroniza el estatus entre MiniApp, bot y foro. Sin capturas de pantalla ni verificaciones manuales. La interfaz está disponible en 7 idiomas; el enlace con la billetera es sin fricción. Pagas por velocidad, interpretabilidad y una economía donde la contribución es recompensada.`,

  `Comunidad y hoja de ruta. Publicamos notas semanales, abrimos betas de funciones alfa y aceptamos solicitudes dirigidas de equipos. En el backlog: motor de carteras con presupuestos de riesgo, smart-routing ampliado CEX/DEX, notebooks/backtests públicos y «piloto semiautomático» bajo control humano. Todo lo que aumente la disciplina y reduzca la fricción va a release; lo que brilla pero no ayuda — no. Materiales — educativos/analíticos, no asesoramiento financiero.`
],

about_sections: [
  { title: 'Qué es Quantum L7 AI',            parasIdx: [0] },
  { title: 'Agentes L7, no una «caja negra»', parasIdx: [1] },
  { title: 'Para quién',                      parasIdx: [2] },
  { title: 'Cobertura',                       parasIdx: [3] },
  { title: 'Pipeline de datos',               parasIdx: [4] },
  { title: 'Núcleo analítico',                parasIdx: [5] },
  { title: 'Módulos on-chain',                parasIdx: [6] },
  { title: 'Narrativas y noticias',           parasIdx: [7] },
  { title: 'Tarjetas y disciplina',           parasIdx: [8] },
  { title: 'Arquitectura',                    parasIdx: [9] },
  { title: 'Seguridad y privacidad',          parasIdx: [10] },
  { title: 'Foro y minería de QCoin',         parasIdx: [11] },
  { title: 'Exchange y recomendaciones',      parasIdx: [12] },
  { title: 'Economía de QCoin y L7-chain',    parasIdx: [13] },
  { title: 'Pago, localización, hoja de ruta', parasIdx: [14] }
],

about_bullets: [
  'Conciencia situacional: tendencia, impulso, volatilidad, liquidez',
  'Normalización cross-exchange, ponderación de señales sensible a latencia',
  'Flujos on-chain, concentración de holders, puentes, indicios MEV',
  'Feed narrativo con traducción y evaluación de confianza/novedad',
  'Tarjetas: amplitud (cuantiles), horizontes, SL/TP, confianza',
  'Conjuntos de indicadores + filtros de régimen + comportamiento',
  'API/SDK y webhooks para automatización sin «magia»',
  'Degradación suave y fuentes de respaldo en picos de carga',
  'Seguridad no custodial: roles, auditoría, cifrado',
  'Foro: minería de QCoin, misiones, publicación de medios con scoring IA',
  'VIP+: X2 en tiempo y misiones, prioridad en exposición y límites',
  'Recomendaciones en el exchange ya disponibles; núcleo de ejecución en camino',
  'NowPayments: activación instantánea, sincronización de estatus',
  'L7-blockchain: colas de retiro prioritarias y roles tempranos',
  '7 idiomas, acceso unificado en la web y Telegram MiniApp'
],

tg_button: 'Telegram',


/* ===== EXCHANGE (descripción ampliada) ===== */
exchange_title: 'Exchange (en desarrollo)',
exchange_sub:
  `Quantum L7 Exchange — es una plataforma de trading multichain, plausiblemente explicable, de nueva generación,
que unifica la liquidez CEX/DEX, las recomendaciones de IA y la infraestructura de datos institucional en un único tejido computacional.
Procesamos 87 TB de históricos de mercado y más de 37 mil millones de velas históricas en todas las redes y plazas principales, normalizamos los ticks,
la profundidad de los libros de órdenes y las especificaciones de derivados, llevando el mercado a un único estándar de toma de decisiones. El objetivo no es «otro exchange más»,
sino un circuito de ejecución con lógica demostrable: hipótesis → test → evidencias → operación, con limitadores de riesgo transparentes y auditoría trazable.`,

exchange_sections: [
  {
    title: 'Visión: Exchange L7 de nueva generación',
    paras: [
      `L7 Exchange es un pipeline basado en agentes, donde agentes L7 autónomos consumen feeds de mercado, eventos on-chain, noticias y señales de comportamiento
de la microestructura, los sincronizan en el tiempo y emiten recomendaciones explicables (BUY/SELL/HOLD) con probabilidad,
amplitud, horizonte y contexto de riesgo (liquidez, spread, dispersión, anomalías). Para el usuario esto significa
reproducibilidad de las decisiones: cada tarjeta de señal va acompañada de un log de factores, versiones de modelos y enlaces a las fuentes primarias.`,
      `Identidad — a través de monederos no custodiales (no almacenamos claves privadas ni frases semilla). Los derechos de acceso,
cuotas y límites se sincronizan en la interfaz web y en el MiniApp. La ejecución de acciones — solo dentro de los limitadores
establecidos por ti y con un nivel suficiente de confianza del modelo. El principio de la plataforma — demostrabilidad, no una «caja negra».`,
      `Datos de nivel institucional: 87 TB de históricos, 37+ mil millones de velas, unificación de contratos y símbolos,
procesamiento de flujos con reconocimiento de latencia (latency-aware), limpieza de cortes, consideración de splits y especificidades de derivados. Encima — ensembles de 200+ indicadores
(RSI/ADX/ATR/VWAP/OBV/Ichimoku/clústeres de volumen, filtros de régimen, etc.), rasgos de comportamiento y estadística de micro–desequilibrios.`,
      `H2 2026 — ventana objetivo de lanzamiento público del núcleo de L7 Exchange junto con el L7-blockchain de nueva generación
(nivel de conciliación entre redes). En el inicio — enrutamiento cross-exchange, auto-ejecución explicable,
y después — expansión hacia clearing on-chain y smart-permisos de acceso nativos.`,
    ],
  },

  {
    title: 'Enrutamiento y liquidez',
    paras: [
      `El smart router escanea en paralelo la liquidez en CEX/DEX, modela el slippage, comisiones y latencias,
elige la plaza/ruta dividida y controla la calidad de ejecución mediante métricas objetivo (expected fill, adverse selection,
mark-out tras N segundos/minutos). En modo split, las órdenes se fraccionan y distribuyen por pools/libros para minimizar el impacto.`,
      `La latencia importa: soportamos cancel/replace, time-outs, «kill-switch», reglas de fijación parcial
y reacción a saltos en la dispersión del spread. En escenarios de arbitraje se usan ventanas de sincronización de ticks y conexiones de baja latencia.`,
      `Microestructura de mercado: analizamos el desequilibrio de órdenes, picos de volumen oculto, liquidez por niveles,
el impacto de noticias/eventos on-chain, el comportamiento de prints «agresivos» y la probabilidad de deslizamiento según el tamaño nocional.`,
    ],
  },

  {
    title: 'Riesgo y control',
    paras: [
      `Límites globales y por instrumento: por nocional, cuota de cartera, caída diaria/semanal, apalancamiento, concentración.
Perfiles de ejecución (conservative/balanced/aggressive) y confianza mínima requerida del modelo. Todos los disparadores están descritos con transparencia
y se registran para auditoría. Cualquier acción es explicable: motivo, datos de entrada, versiones de modelos y parámetros de ejecución.`,
      `Órdenes condicionales (stop/stop-limit), time-in-force (GTC/IOC/FOK), directivas de fijación parcial, corredores de stop dinámicos
por régimen de volatilidad (tipo ATR), «circuit-breaker» ante anomalías, «silencios» nocturnos y bloques de eventos (por ejemplo, noticias de alto impacto).`,
      `Anti-aceleración y anti-pico: comprobaciones extra de spread/liquidez, umbrales de desviación respecto al precio justo, prohibición de promediar «al abismo»,
nivel de desescalada forzosa de emergencia cuando el entorno se vuelve «no apto para el trading».`,
    ],
  },

  {
    title: 'Analítica y explicabilidad',
    paras: [
      `El AI-Box para cada símbolo/TF muestra el nivel de confianza, los factores de decisión (desde la posición relativa frente a VWAP/bandas
hasta los regímenes de RSI/clústeres de volumen), la amplitud y los horizontes según la historia (cuantiles) y los TP/SL recomendados.
La presentación es compacta pero verificable: cifras, no metáforas.`,
      `Explainability by design: causa ➜ efecto. La tarjeta contiene los pesos de los factores, enlaces a las fuentes,
instantáneas de libros/volúmenes y mini-simulaciones «what-if». El objetivo — dar al trader un esqueleto transparente de la decisión,
que pueda reproducirse y debatirse.`,
      `Noticias/narrativas: parsing multilingüe, traducción, deduplicación, tonalidad por IA, confianza en la fuente y vínculo con la reacción del precio.
No es «ruido», sino contexto para evaluar la probabilidad del escenario y las ventanas temporales de ejecución.`,
    ],
  },

  {
    title: 'Cartera, informes y atribución',
    paras: [
      `Paneles de cartera con atribución de PnL: descomposición por fuentes de alfa, regímenes de mercado, símbolos, presupuestos de riesgo y
decisiones del modelo. Se calculan por separado las métricas de «mark-out» e impacto, para diferenciar la «suerte» de la sistematicidad.`,
      `Diarios de operaciones, exportación, informes, API para integraciones. Reproducibilidad de investigación: backtests y «replay»
sobre flujos históricos directamente sobre el gráfico. «Plantillas de estrategia» y despliegue «one-click» con limitadores.`,
      `Modos de equipo (roadmap): roles, permisos, consenso de parámetros, informes centralizados,
white-label y despliegues privados para enterprise.`,
    ],
  },

  {
    title: 'Infraestructura de datos y red',
    paras: [
      `Unificación de feeds: agregación cross-exchange, normalización de ticks y profundidad a un esquema común, cierre de huecos,
procesamiento de splits y cambios de contrato. Encima — ensembles de 200+ indicadores, filtros de comportamiento/régimen
y rasgos de microestructura. Capa histórica — 87 TB, más de 37 mil millones de velas.`,
      `Nivel on-chain: grafos de direcciones, concentración de tenedores, entrada/salida de liquidez, movimientos por puentes, riesgos MEV básicos.
Las blockchains públicas no son datos personales; al mismo tiempo, los logs operativos (dentro de la ley) ayudan
a garantizar la fiabilidad e investigar incidentes.`,
      `Stack de red: conexiones optimizadas a proveedores de liquidez y datos de mercado, estrategia de degradación
sin pérdida de funciones críticas, cachés calientes/templados, priorización de canales VIP de procesamiento. Todas las etapas de cómputo se trazan.`,
    ],
  },

  {
    title: 'Seguridad y cumplimiento',
    paras: [
      `Modelo no custodial: las llaves con el usuario, autorización — mediante firma. Acceso por roles,
minimización de datos personales, cifrado «en tránsito» y «en reposo», pipelines anti-fraude/anti-sybil.
Registro de acciones para auditoría y reproducibilidad.`,
      `Contexto regulatorio: proporcionamos analítica y herramientas, no recomendaciones financieras.
Pago de suscripción vía NowPayments con confirmación on-chain — activación automática de límites/permisos sin «chequeos» manuales.
Las políticas de privacidad y registro — transparentes y de actualización regular.`,
      `Los limitadores de ejecución — son disciplina, no garantía. El mercado es volátil; las decisiones y el cumplimiento normativo —
del lado del usuario. Damos marcos, métricas y explicabilidad para que el riesgo sea consciente.`,
    ],
  },

  {
    title: 'Hoja de ruta y lanzamiento',
    paras: [
      `H2 2026: lanzamiento público del núcleo de L7 Exchange y del L7-blockchain de nueva generación — una capa de conciliación entre redes,
destinada a simplificar el clearing y los permisos de acceso a nivel de smart contracts, así como a mejorar la observabilidad de la ejecución.
El foco principal — enrutamiento de liquidez, auto-ejecución explicable, atribución de cartera y modos de equipo.`,
      `QCoin — la economía interna del ecosistema L7. En la hoja de ruta — el papel de QCoin en los procesos de pago/estimulación del ecosistema.
El objetivo — una «capa de liquidación» única entre analítica, ejecución y servicios de usuario.`,
      `Antes del lanzamiento público — betas ampliadas, pruebas de estrés, informes de estabilidad y resultados abiertos y registrables
sobre la calidad de ejecución y latencias. La transparencia — el núcleo de la confianza.`,
    ],
  },
],

roadmap: 'Hoja de ruta',

ex_bullets: [
  'Enrutamiento inteligente CEX/DEX con control de slippage, splits y ejecución con reconocimiento de latencia (latency-aware)',
  'Señales de IA explicables: probabilidad, amplitud, horizontes, factores de confianza, TP/SL',
  'Paneles de cartera: atribución de PnL, presupuestos de riesgo, «mark-out», métricas de impacto',
  'Backtests y replays en flujos históricos directamente en el gráfico',
  'Limitadores de riesgo: límites, time-in-force, kill-switch, corredores de stop dinámicos',
  'Unificación de datos: 87 TB de históricos, 37+ mil millones de velas, 200+ indicadores y filtros de régimen',
  'Conexión de monederos, modelo no custodial y auditoría registrada de acciones',
  'H2 2026: lanzamiento público del núcleo de L7 Exchange y del L7-blockchain de nueva generación',
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
/* ===== HERO / HOME (简述) ===== */   
hero_title: '欢迎来到 Quantum L7 AI 宇宙',
hero_subtitle:
  'Quantum L7 AI 不只是一个平台，而是一个完整的决策赛博宇宙：机构级的多链数据、自治的 L7 代理、链上流水线与交易路由像一个数字有机体协同运作。我们对接 Web-MiniApp、Telegram MiniApp 与 QL7 AI Bot、具有 QCoin 经济的论坛以及全球交易所（ 内核处于最终阶段 ），以提供即时的 Alpha 信号、纪律化的进场/出场窗口、自动化执行与透明的风险轮廓。授权通过非托管钱包（私钥在你手中），支持 PRO/VIP 等级、优先级限额与取消配额。其基础是法务严谨的 Web3 架构、跨交易所的流动性聚合、行为与微结构模型，以及可复现的研究流水线并记录 假设 → 测试 → 证据。它是为在市场节奏中工作并要求可证性、速度与精度的人所打造的新一代基础设施。',
hero_cta: '从 Telegram 开始',
hero_learn_more: '了解更多',
marquee: 'AI • 量子代理 • 链上分析 • 加密交易所（内核） • 论坛 • QCoin 挖矿 • 自动执行 • 风险轮廓 • 流动性路由 • Web3 元宇宙 • API/SDK • Enterprise • 保留所有权利',

home_blocks: [
  {
    title: '为什么选择 Quantum L7 AI',
    paras: [
      `Quantum L7 AI 是一个跨平台生态：AI 核心、自治 L7 代理、链上监控、规范化的市场数据源、论坛社交网络与 QCoin 经济被整合为一体的计算织体。每个工件——交易、新闻叙事、帖子、流动性图——都会进入公共数据闭环并转化为行动信号。`,
      `L7 代理可自主阅读文档与 API，观察区块链与订单簿，归类行为模式，评估市场状态并产出可验证的假设。结果不是“黑箱”，而是一张可解释的卡片：情景概率、幅度、时间跨度、SL/TP、置信因子以及指向原始来源的链接。`,
      `授权通过非托管钱包：我们不保存私钥，而是确认地址所有权。访问权限与配额在 Telegram MiniApp、Web 界面与 QL7 机器人之间同步，VIP 状态标定限额边界并进入优先处理通道。`,
      `市场内核基于跨交易所聚合、符号/合约统一与延迟感知（latency-aware）数据处理构建。我们将机构级历史与实时流结合，以跟踪价差离散、冲击性成交量、订单平衡、MEV 风险以及新闻脉冲效应。`,
      `平台原则是可证性：假设 → 测试 → 证据。每次计算均记录在案，度量可复现，“噪声套利”由状态过滤器剔除。由此我们把原始数据转化为纪律化决策，把直觉变为可验证的战术。`,
      `论坛嵌入闭环：内容经过 AI 评分（质量、参与度、anti-spam/anti-sybil），活动被映射到 QCoin 经济。这不是“为点赞而生的社交网络”，而是目标导向的认知总线，知识与贡献被转化为代币化价值。`,
    ],
  },

  {
    title: '你将获得什么',
    bullets: [
      '新一代量子分析：AI 智能、链上度量与市场微结构特征的共生融合。',
      'Alpha 信号包含执行概率、幅度与时间跨度，并提供透明的置信因子依据。',
      '规范化的跨交易所数据内核：统一符号/合约、流动性、价差与 Tick 频率。',
      '链上监控：持有者分布、跨桥流动、CEX/DEX 流动性、基础 MEV 模式。',
      '全球交易所（内核开发中）：流动性路由、滑点防护、情境化风险评估。',
      'Auto-execute：具备故障安全触发器、动态止损与异常紧急停止的执行。',
      '投资组合面板：PnL 归因、风险预算、波动率状态、通道与仓位规模纪律。',
      '可复现研究：回测、Notebooks、可视化报告、what-if 场景与假设曝光。',
      '叙事信息流：AI 语调、嵌入（embeddings）、来源可信度与新闻与价格度量的关联。',
      '论坛经济：AI 审核、以贡献与活跃度进行 QCoin 挖矿、带算法评分的媒体发帖。',
      'VIP 计划：移除 AI Box 的日配额、扩展限额、优先处理，以及针对任务/时间的 QCoin X2。',
      '集成：Telegram MiniApp、Web、QL7 机器人；统一会话、共享状态与一致的访问权限。',
      'API/SDK/Webhooks：安全集成、sandbox 模式、面向事件（event-driven）的团队与自动化架构。',
      '多链栈：Ethereum、BSC、Polygon、Solana、TON、Avalanche 等；跨链桥接并考虑网络特性。',
      '法务严谨的 Web3 架构：日志记录、角色分离、密码学验证与隐私保护。',
    ],
  },

  {
    title: '基础设施与数据',
    paras: [
      `市场数据：我们汇聚 CEX/DEX 的历史与流式数据源，统一到通用模式、弥合缺口，考虑拆分与衍生品特性。其上叠加集成式指标（RSI/ADX/ATR/VWAP/OBV/Ichimoku/成交量簇）、状态过滤器与流动性上下文。`,
      `链上层：地址图、流动性迁移、持有者集中度、跨桥事件、基础 MEV 风险。公共区块链不是个人数据，但我们会谨慎记录请求与调试 ID，以保障可靠性并用于事件调查。`,
      `叙事与新闻：多语言索引、翻译、去重、来源评分、新颖性与与价格的协方差评估；输出是在价格与成交量旁的一层轻量数值叠加，帮助分辨噪声与有意义的脉冲。`,
      `存储与缓存：将流拆分为热/温路径，在不丢失关键功能的前提下渐进降级，并为 VIP 与系统任务优先分配通道。所有计算阶段具备可追溯性、工件版本控制与可复现性。`,
    ],
  },

  {
    title: '安全与合规',
    paras: [
      `非托管模型：私钥与助记词保留在用户侧。签名授权；基于角色的访问已记录并可审计。最小化个人数据，在传输与存储中加密，具备 anti-fraud/anti-sybil 流水线。`,
      `法律洁净：我们提供分析与工具，而非财务建议。通过 NowPayments 的链上确认将自动激活订阅；状态在 MiniApp/Web/机器人间同步。隐私与日志策略透明且持续更新。`,
      `执行限幅器：sanity-checks、限制、紧急止损触发器与异常监控。它们是纪律工具，而非结果保证；交易伴随风险，决策由用户自行承担。`,
    ],
  },

  {
    title: '集成：MiniApp • 机器人 • 论坛 • 交易所',
    paras: [
      `Telegram MiniApp 与 Web 作为镜像界面运行，具备统一会话与权限。QL7 机器人是进入 AI 通道与通知的轻入口。论坛不只是社区：它是认知总线，知识与贡献转化为 QCoin，且 VIP 内容享有优先的 AI 评分。`,
      `交易所（内核处于最终阶段）：订单路由、滑点的情境评估、在适用处进行链上执行，以及为 VIP 提供扩展的 backtest/what-if 模式。与分析的整合带来罕见效果——信号“知道”它将如何被执行。`,
    ],
  },

  {
    title: 'VIP 与 QCoin 经济',
    paras: [
      `VIP 取消 AI Box 的日配额、扩展限额并优先处理。在论坛中，VIP 获得时间与任务的 X2 倍增、金色徽章，以及在算法评分中更高权重的媒体帖子（视频/图片/音频）。活动、贡献与浏览量会在考量质量与参与度后转化为 QCoin。`,
      `通过 NowPayments 支付：一旦链上确认到达，状态即刻激活并传播到 MiniApp/机器人/Web。路线图包含 L7 链的启动：VIP 处于分配与 QCoin 提现队列的高优先层级，拥有验证人/质押者等早期角色与更高限额。`,
    ],
  },

  {
    title: '面向团队与开发者',
    bullets: [
      '具备安全令牌模型与密钥轮换的 API/SDK/Webhooks。',
      '面向事件（event-driven）的集成、sandbox 环境、对接链上/链下来源的连接器。',
      'White-Label 与 Enterprise 模式：SSO、私有部署、SLA、变更窗口。',
      'Notebooks/回测：工件导出、报告与实验可复现性。',
      '为产品团队提供深入的功能采纳与性能度量。',
    ],
  },
],


/* ===== ABOUT ===== */   
about_title: '关于 Quantum L7 AI',
about_paragraphs: [
  `Quantum L7 AI 不仅仅是“分析”，而是围绕加密市场的交易决策与社会化互动的统一运营闭环。平台内核整合了 Web-MiniApp（网页 + Telegram）、带有游戏化 QCoin 挖矿的论坛，以及能降噪、识别流动性结构并给出纪律化入场/出场方案的 AI 研究引擎。我们把市场微观结构、链上遥测、行为模式与新闻叙事融合为一个一致且可解释的层，让你不必“追着”市场跑，而是可以提前设计下一步。`,

  `L7 代理是运行在数据之上的应用型 AI 模块。它们读取文档与信息流，请求 API，观察区块链、订单簿与衍生品，运行小型实验，并产出可解释的工件：假设、回测快照、上下文指标。重视的不是“黑箱魔法”，而是可追溯性：每个结论都能看到路径——考虑了哪些特征（流动性、价差、非对称、失衡、动量、成交量簇），为何在薄弱/易被操纵的区域降低权重，以及情景的失效边界在哪里。`,

  `适用对象。对交易员——快速的情境感知与可控的信号频率而不致过载；对研究者——可复现的流水线与干净数据；对团队——API/SDK、webhook 与可靠的事件总线；对构建者社区——论坛、声誉度量与按贡献计的 QCoin 经济。VIP+ 获得优先级 AI 通道、媒体发布、加速配额以及影响曝光与限额的“金色”状态。`,

  `覆盖面。我们聚合头部 CEX 与 DEX 聚合器的数据，规范化交易符号与合约元数据，统一 TICK 频率与订单簿深度。引入统一目录、交易对/网络/市场映射，标注衍生品，纳入拆分、下架与合约迁移。目标是平台与网络的可比性：用单一抽象层对比流动性、成本、延迟与“真实”的可用成交量。`,

  `数据流水线。数据流被清洗，缺口被修复，异常被标记，延迟轮廓被校准。历史足够深，从而识别“市场状态”，而不是把指针硬套在偶发尖峰上。我们加入链上路径、跨链桥、持有者分布、MEV 活动迹象，并把它们与市场指标相连。结果是对“噪声气泡”和局部异常足够稳健的特征集合。`,

  `分析内核。上百个指标只是调色板。关键在于“特征集合 + 上下文”：RSI/RSX、Stochastic、CCI/MFI、ADX/DI、ATR 与带宽、EMA/SMA/WMA、MACD/Signal/Histogram、VWAP/POC/Value-Area、成交量剖面、Bid/Ask 失衡与流动性扫单。我们把经典家族与状态过滤器、基于流动性与行为的启发式、以及链上流入/流出标记相融合。每张卡片不是“建议”，而是罗盘：历史幅度、实现期限、自信度、前提与失效边界。`,

  `链上模块。我们跟踪转账簇、跨链桥、累积/分配、大额持有者集中度、基础 MEV 模式与异常路径。在流动性薄弱区域或资金费率/价差飙升时，信号权重降低；当被多个域（现货、衍生品、链上）共同确认时，权重提升。这样能把市场脆弱处的“虚假自信”降到最低。`,

  `叙事与新闻。多语言信息流会被翻译、去重，并以嵌入向量索引。我们评估新颖性、来源可信度、“形式/实质”的比例、语调以及主题随时间的黏性。与价格与链上指标并排，会出现一张轻量的“叙事地图”：注意力被什么驱动、监管风险在哪里、哪些放大波动、哪些正在消退。`,

  `信号卡片与纪律。卡片上包含——期望幅度（分位数）、时间地平线、SL/TP 标记、流动性速览与必须共振的触发器集合。系统促使纪律：入场前你能看到失效点、风险单位与动态波动率走廊；入场后——会获得用于核对的检查点与减风险条件。`,

  `架构。以 TypeScript/Python 实现的轻量服务位于稳定 API 之后；站点基于 Next.js，并通过 WebSocket 提供实时层。缓存层与后备来源确保在峰值期间的平滑降级。API/SDK 与 webhook 支持自动化，而角色与审计定义安全边界。MiniApp 同时运行在 Web 与 Telegram 上，让你在单一流程中操盘市场：图表、论坛、钱包、机器人——无摩擦。`,

  `安全与隐私。非托管：我们不请求也不存储私钥/seed。通过角色限制访问、记录操作，个人数据最小化，并在传输与存储中加密。anti-sybil/anti-fraud 流水线保护 QCoin 经济与论坛的声誉机制；会话校验在温和且严格的前提下维护访问完整性。`,

  `论坛与 QCoin 挖矿。论坛不是“社交网络”，而是知识生产线。每 4 小时你确认活跃度并锁定奖励；含媒体（视频/图片/音频）的帖子通过 QuantumLCM-AI 的评分（质量、参与度、反垃圾/反女巫）并转化为 QCoin。VIP+ 获得时间 X2 与任务 X2、曝光优先、扩展的媒体限额与加速审核。声誉与贡献不是空噪声，而是具有经济意义的量。`,

  `交易所（开发中）与推荐。交易内核与执行会分阶段接入；已提供按品种/周期的 AI 推荐、订单簿深度与流动性画像。我们设计智能路由、延迟/滑点防护、组合约束与 PnL 归因。VIP+ 可访问实验性指标、what-if/回测模式与更宽的分析视野。`,

  `QCoin 经济与 L7 区块链。QCoin 是知识与有效流量的燃料。未来的 L7-chain 是把跨网络资产、银行与金融基础设施连接起来的通用价值路由层。我们的目标是让 QCoin 成为生态内的中性结算单位，具备透明的发行/销毁与公平的提现队列。VIP+ 在分配上享有更高优先级，并可更早获得质押/验证者角色的通道。`,

  `支付与激活。VIP+ 订阅通过 NowPayments 办理：加密支付（USDT 等），Webhook 即刻激活访问并在 MiniApp、机器人与论坛之间同步状态。无需截图与人工核验。界面支持 7 种语言；钱包绑定无缝。你为速度、可解释性，以及一个对贡献予以回报的经济付费。`,

  `社区与路线图。我们发布每周笔记、开放 alpha 功能的 beta 测试，并接受团队的定向需求。待办中：带风险预算的组合引擎、增强的 CEX/DEX 智能路由、公开笔记本/回测、“半自动驾驶”（人控）。凡能提升纪律、降低摩擦的都会发布；那些华而不实的则不会。所有材料均为教育/分析内容，非财务建议。`
],

about_sections: [
  { title: '什么是 Quantum L7 AI',           parasIdx: [0] },
  { title: 'L7 代理，而非“黑箱”',            parasIdx: [1] },
  { title: '适用对象',                         parasIdx: [2] },
  { title: '覆盖面',                           parasIdx: [3] },
  { title: '数据流水线',                       parasIdx: [4] },
  { title: '分析内核',                         parasIdx: [5] },
  { title: '链上模块',                         parasIdx: [6] },
  { title: '叙事与新闻',                       parasIdx: [7] },
  { title: '卡片与纪律',                       parasIdx: [8] },
  { title: '架构',                             parasIdx: [9] },
  { title: '安全与隐私',                       parasIdx: [10] },
  { title: '论坛与 QCoin 挖矿',                parasIdx: [11] },
  { title: '交易所与推荐',                     parasIdx: [12] },
  { title: 'QCoin 经济与 L7-chain',            parasIdx: [13] },
  { title: '支付、在地化与路线图',             parasIdx: [14] }
],

about_bullets: [
  '情境感知：趋势、动量、波动率、流动性',
  '跨交易所归一化，面向延迟的特征加权',
  '链上流、持有者集中度、跨链桥、MEV 线索',
  '叙事信息流：翻译与信任/新颖性评估',
  '卡片：幅度（分位数）、地平线、SL/TP、自信度',
  '指标集合 + 状态过滤 + 行为',
  '用于无“魔法”的自动化：API/SDK 与 webhook',
  '峰值负载下的平滑降级与后备来源',
  '非托管安全：角色、审计、加密',
  '论坛：QCoin 挖矿、任务、带 AI 评分的媒体发布',
  'VIP+：时间 X2 与任务 X2，曝光与限额优先',
  '交易所内的推荐已可用；执行内核在路上',
  'NowPayments：即时激活，状态同步',
  'L7 区块链：提现优先队列与早期角色',
  '7 种语言，Web 与 Telegram MiniApp 的统一入口'
],

tg_button: 'Telegram',

/* ===== EXCHANGE（扩展描述） ===== */
exchange_title: '交易所（开发中）',
exchange_sub:
  `Quantum L7 Exchange——这是一个多链、可信可解释的下一代交易平台，
将 CEX/DEX 流动性、AI 推荐与机构级数据基础设施融合为统一的计算织体。
我们处理 87 TB 的市场历史与超过 370 亿条历史 K 线，覆盖所有主流网络与平台，规范化 tick、
订单簿深度与衍生品规范，把市场拉齐到同一套决策标准。目标不是“又一个交易所”，
而是具备可证逻辑的执行回路：假设 → 测试 → 证据 → 成交，并配以透明的风险限制与可追溯审计。`,

exchange_sections: [
  {
    title: '愿景：新一代 L7 交易所',
    paras: [
      `L7 Exchange 是一条基于代理的管线，自治的 L7 代理会消费行情馈送、链上事件、新闻与
微观结构的行为信号，将其按时间对齐，输出可解释的（BUY/SELL/HOLD）建议，附带概率、
幅度、时间跨度与风险语境（流动性、价差、离散度、异常）。对用户而言，这意味着
决策的可复现性：每张信号卡都伴随因素日志、模型版本与原始来源链接。`,
      `身份——通过非托管钱包（我们不保存私钥与助记词）。访问权限、
配额与限额在 Web 界面与 MiniApp 间同步。行动执行——仅在你设定的
限制之内，且在模型置信度足够时进行。平台原则——可证，而非“黑箱”。`,
      `机构级数据：87 TB 历史、370 亿+ K 线，合一的合约与符号，
感知延迟的流处理（latency-aware）、缺口清理、考虑拆分与衍生品特性。在此之上——200+ 指标的集成
（RSI/ADX/ATR/VWAP/OBV/Ichimoku/成交量簇、状态滤波等）、行为特征与微观失衡统计。`,
      `H2 2026——与新一代 L7 区块链共同的 L7 Exchange 内核公开发布目标窗口
（跨网络协调层）。启动阶段——跨交易所路由、可解释的自动执行，
随后——向链上清算与原生智能访问权限扩展。`,
    ],
  },

  {
    title: '路由与流动性',
    paras: [
      `智能路由器并行扫描 CEX/DEX 流动性，建模滑点、手续费与延迟，
选择场所/拆分路径，并通过目标指标（expected fill、adverse selection、
N 秒/分钟后的 mark-out）监控执行质量。在拆分模式下，订单被分片并分散到池/订单簿，以最小化冲击。`,
      `延迟很重要：支持 cancel/replace、超时、“kill-switch”、部分止盈规则，
以及对价差离散度跳变的响应。在套利场景下，使用 tick 同步窗口与低延迟连接。`,
      `市场微观结构：我们分析订单失衡、隐藏量突发、分层流动性、
新闻/链上事件影响、“激进”成交打印的行为，以及按名义规模的滑点概率。`,
    ],
  },

  {
    title: '风险与控制',
    paras: [
      `全局与品种级限额：按名义金额、组合占比、日/周回撤、杠杆、集中度。
执行侧档（conservative/balanced/aggressive）与模型所需的最低置信度。所有触发器均透明描述，
并记录以供审计。任何动作皆可解释：原因、输入数据、模型版本与执行参数。`,
      `条件单（stop/stop-limit）、time-in-force（GTC/IOC/FOK）、部分止盈指令、按波动状态
（类 ATR）的动态止损走廊、异常时的“circuit-breaker”、夜间静默期与事件阻断（如高影响新闻）。`,
      `反拉高与反跳跃：对价差/流动性的额外校验、公允价格偏离阈值、禁止“越跌越加仓”式摊薄，
以及当环境变得“不适合交易”时的紧急强制去风险级别。`,
    ],
  },

  {
    title: '分析与可解释性',
    paras: [
      `每个品种/周期的 AI-Box 显示置信度、决策因素（从相对 VWAP/带状区间的位置
到 RSI/成交量簇的状态）、基于历史的幅度与时间跨度（分位数）以及建议的 TP/SL。
呈现紧凑但可核验：数字，而非比喻。`,
      `按设计即“可解释”（Explainability by design）：原因 ➜ 结果。卡片包含因素权重、来源链接、
订单簿/成交量快照与“what-if”微模拟。目标——为交易者提供透明的决策骨架，
可被重现与质疑。`,
      `新闻/叙事：多语言解析、翻译、去重、AI 情感、来源可信度与与价格反应的关联。
这不是“噪声”，而是用于评估情景概率与执行时间窗口的语境。`,
    ],
  },

  {
    title: '组合、报表与归因',
    paras: [
      `带 PnL 归因的组合面板：按阿尔法来源、市场状态、品种、风险预算与
模型决策进行分解。单独计算“mark-out”与冲击指标，以区分“运气”与系统性。`,
      `交易日志、导出、报表、用于集成的 API。研究可复现性：回测与
在历史流上的“重放”，直接叠加在图表之上。“策略模板”与带限制的一键部署。`,
      `团队模式（roadmap）：角色、权限、参数协同、集中报表、
white-label 与面向企业的私有部署。`,
    ],
  },

  {
    title: '数据与网络基础设施',
    paras: [
      `馈送统一：跨交易所聚合、将 tick 与深度拉齐到统一模式、弥补缺失、
处理拆分与合约变更。在其上——200+ 指标集成、行为/状态滤波
与微观结构特征。历史层——87 TB，超过 370 亿条 K 线。`,
      `链上层：地址图、持有者集中度、流动性入/出、跨桥迁移、基础 MEV 风险。
公有区块链不属于个人数据；同时，运营日志（在法律范围内）有助于
保障可靠性与事件调查。`,
      `网络栈：到流动性与行情提供方的优化连接、在不丢失关键功能前提下的降级策略、
热/温缓存、VIP 处理通道优先级。所有计算阶段均可追踪。`,
    ],
  },

  {
    title: '安全与合规',
    paras: [
      `非托管模型：密钥在用户侧，授权——签名完成。基于角色的访问、
最小化个人数据、传输与静态加密、反欺诈/anti-sybil 管线。
行为记录用于审计与可复现。`,
      `监管语境：我们提供分析与工具，而非金融建议。
通过 NowPayments 的链上确认订阅付款——自动激活限额/权限，无需人工“检查”。
隐私与日志策略——透明且定期更新。`,
      `执行限制——是纪律而非担保。市场具备波动性；决策与司法辖区合规——
在用户一侧。我们提供框架、指标与可解释性，使风险是“被认知”的。`,
    ],
  },

  {
    title: '路线图与发布',
    paras: [
      `H2 2026：L7 Exchange 内核与新一代 L7 区块链的公开发布——一个跨网络的协调层，
旨在简化清算与在智能合约层面的访问权限，并提升执行的可观测性。
核心聚焦——流动性路由、可解释的自动执行、组合归因与团队模式。`,
      `QCoin——L7 生态的内部经济。在路线图中——QCoin 在生态支付/激励流程中的角色。
目标——在分析、执行与用户服务之间构建统一的“结算层”。`,
      `公开发布前——扩展 Beta、压力测试、稳定性报告与对
执行质量与延迟的公开可记录结果。透明性——信任的核心。`,
    ],
  },
],

roadmap: '路线图',

ex_bullets: [
  '具备滑点控制、拆分与感知延迟执行的 CEX/DEX 智能路由',
  '可解释的 AI 信号：概率、幅度、时间跨度、置信因素、TP/SL',
  '组合面板：PnL 归因、风险预算、“mark-out”、冲击指标',
  '直接在图表上的历史流回测与重放',
  '风险限制：限额、time-in-force、kill-switch、动态止损走廊',
  '数据统一：87 TB 历史、370 亿+ K 线、200+ 指标与状态滤波',
  '钱包连接、非托管模型与可记录的行为审计',
  'H2 2026：L7 Exchange 内核与新一代 L7 区块链的公开发布',
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

/* ===== HERO / HOME (مختصر) ===== */    
hero_title: 'مرحبًا بكم في كون Quantum L7 AI',
hero_subtitle:
  'Quantum L7 AI ليست مجرد منصة، بل هي كون سيبراني متكامل لاتخاذ القرار: بيانات متعددة السلاسل بمستوى مؤسساتي، عملاء L7 مستقلون، خطوط معالجة على السلسلة وتوجيه تداول يعمل كوحدة رقمية واحدة. نحن ندمج Web-MiniApp و Telegram MiniApp و QL7 AI Bot ومنتدى باقتصاد QCoin وبورصة عالمية (النواة في المرحلة النهائية) لتقديم إشارات Alpha فورية، ونوافذ دخول/خروج منضبطة، وتنفيذ آلي، وهيكل شفاف لإدارة المخاطر. يتم تسجيل الدخول عبر محافظ غير وصائية (المفاتيح لديك)، مع دعم مستويات PRO/VIP، وحدود أولوية وإلغاء الحصص. الأساس هو هيكل Web3 قانوني محكم، وتراكم سيولة عبر البورصات، ونماذج سلوكية وميكروهيكلية، إضافةً إلى خطوط بحث قابلة للتكرار مع سجل فرضية → اختبار → أدلة. إنها بنية تحتية من الجيل الجديد لأولئك الذين يعملون وفق إيقاع السوق ويطلبون الإثبات والسرعة والدقة.',
hero_cta: 'ابدأ عبر Telegram',
hero_learn_more: 'اعرف المزيد',
marquee: 'الذكاء الاصطناعي • العملاء الكميون • تحليلات على السلسلة • بورصة العملات المشفرة (النواة) • المنتدى • تعدين QCoin • تنفيذ آلي • هيكل المخاطر • توجيه السيولة • ميتافيرس Web3 • API/SDK • Enterprise • جميع الحقوق محفوظة',

home_blocks: [
  {
    title: 'لماذا Quantum L7 AI',
    paras: [
      `Quantum L7 AI هو نظام بيئي متعدد المنصات: نواة ذكاء اصطناعي، عملاء L7 مستقلون، مراقبة على السلسلة، خلاصات سوقية موحدة، شبكة اجتماعية للمنتدى واقتصاد QCoin مدمجة في نسيج حسابي واحد. كل أثر — معاملة، سرد خبري، منشور، مخطط سيولة — يدخل في دائرة البيانات العامة ويصبح إشارة للعمل.`,
      `عملاء L7 يقرؤون المستندات وواجهات API بشكل مستقل، ويراقبون سلاسل الكتل ودفاتر الأوامر، ويصنفون الأنماط السلوكية، ويقيّمون أوضاع السوق ويستنتجون فرضيات قابلة للتحقق. النتيجة ليست "صندوقًا أسود"، بل بطاقة قابلة للتفسير: احتمال السيناريو، السعة، الآفاق، SL/TP، عوامل الثقة وروابط إلى المصادر الأصلية.`,
      `تسجيل الدخول عبر محافظ غير وصائية: لا نخزن المفاتيح الخاصة بل نتحقق من ملكية العنوان. يتم مزامنة حقوق الوصول والحصص بين Telegram MiniApp وواجهة الويب وروبوت QL7، حالة VIP تحدد حدود القيود وتمنح أولوية في قنوات المعالجة.`,
      `نواة السوق مبنية على تراكم عبر البورصات، وتوحيد الرموز/العقود، ومعالجة خلاصات مدركة للكمون. ندمج البيانات المؤسسية التاريخية مع التدفقات الآنية لتتبع تشتت الفروق، الأحجام الصادمة، توازن الطلبات، مخاطر MEV وتأثير نبض الأخبار.`,
      `مبدأ المنصة هو الإثبات: فرضية → اختبار → أدلة. كل عملية حسابية يتم تسجيلها، المقاييس قابلة لإعادة الإنتاج، ويتم استبعاد "ضوضاء" المراجحة عبر مرشحات الأوضاع. وهكذا نحول البيانات الخام إلى قرارات منضبطة، والحدس إلى تكتيك قابل للتحقق.`,
      `المنتدى جزء من الحلقة: المحتوى يخضع لتقييم ذكاء اصطناعي (جودة، تفاعل، مكافحة البريد المزعج/anti-sybil)، والنشاط يُرسم على اقتصاد QCoin. إنها ليست "شبكة اجتماعية من أجل الإعجابات"، بل حافلة معرفية موجهة حيث تتحول المعرفة والمساهمة إلى قيمة رمزية.`,
    ],
  },

  {
    title: 'ما الذي ستحصل عليه',
    bullets: [
      'تحليلات كمية من الجيل الجديد: تكامل ذكاء اصطناعي وقياسات على السلسلة وخصائص ميكروهيكل السوق.',
      'إشارات Alpha باحتمالية تنفيذ وسعة وأفق، مع تبرير شفاف لعوامل الثقة.',
      'نواة بيانات موحدة عبر البورصات: توحيد الرموز/العقود، السيولة، الفروق وتردد التحديث.',
      'مراقبة على السلسلة: توزيع الحاملين، التدفقات عبر الجسور، سيولة CEX/DEX، أنماط MEV الأساسية.',
      'بورصة عالمية (النواة قيد التطوير): توجيه السيولة، حماية من الانزلاق، تقييم سياقي للمخاطر.',
      'تنفيذ آلي Auto-execute: تشغيل بمحفزات آمنة، وقف ديناميكي وتوقف طارئ عند الشذوذ.',
      'لوحات المحافظ: نسب PnL، ميزانيات المخاطر، أوضاع التقلب، الممرات وانضباط حجم المركز.',
      'بحوث قابلة للتكرار: اختبارات خلفية، دفاتر تفاعلية، تقارير مرئية، سيناريوهات what-if وعرض الافتراضات.',
      'تغذية السرديات: نغمة الذكاء الاصطناعي، تمثيلات embeddings، ثقة المصادر وربط الأخبار بالمقاييس السعرية.',
      'اقتصاد المنتدى: إشراف ذكاء اصطناعي، تعدين QCoin مقابل المساهمة والنشاط، نشر وسائط بتقييم خوارزمي.',
      'برنامج VIP: إزالة الحصص اليومية في AI Box، حدود موسعة، معالجة أولوية و X2 لـ QCoin للمهام/الوقت.',
      'تكاملات: Telegram MiniApp، الويب، روبوت QL7؛ جلسة موحدة، حالة مشتركة وصلاحيات وصول متناسقة.',
      'API/SDK/Webhooks: تكاملات آمنة، وضع sandbox، هيكلية مدفوعة بالأحداث للفرق والأتمتة.',
      'حزمة متعددة السلاسل: Ethereum و BSC و Polygon و Solana و TON و Avalanche وغيرها؛ جسر وأخذ الخصائص الشبكية بعين الاعتبار.',
      'هيكل Web3 قانوني محكم: تسجيل، فصل الأدوار، تحقق تشفيري وخصوصية.',
    ],
  },

  {
    title: 'البنية التحتية والبيانات',
    paras: [
      `بيانات السوق: نجمع الخلاصات التاريخية والفورية من CEX/DEX، نوحدها ضمن مخطط عام، نغلق الفجوات، نأخذ بعين الاعتبار التقسيمات وخصائص المشتقات. في الأعلى — مؤشرات جماعية (RSI/ADX/ATR/VWAP/OBV/Ichimoku/عناقيد الحجم)، مرشحات أوضاع وسياق السيولة.`,
      `الطبقة على السلسلة: رسوم العناوين، تحركات السيولة، تركّز الحاملين، أحداث الجسور، مخاطر MEV الأساسية. سلاسل الكتل العامة ليست بيانات شخصية، لكننا نسجل الطلبات ومعرّفات التصحيح بعناية من أجل الموثوقية والتحقيق في الحوادث.`,
      `السرديات والأخبار: فهرسة متعددة اللغات، ترجمة، إزالة التكرار، تقييم المصادر، تقدير الحداثة والتغاير مع السعر؛ النتيجة — طبقة رقمية خفيفة بجانب السعر والحجم تساعد على التمييز بين الضوضاء والنبض المهم.`,
      `التخزين والذاكرة المؤقتة: تقسيم التدفقات إلى ساخنة/دافئة، تدهور تدريجي دون فقدان الوظائف الحرجة، أولوية القنوات لـ VIP والمهام النظامية. جميع مراحل الحساب تتمتع بتتبع، تحكم في نسخ القطع الأثرية وقابلية إعادة الإنتاج.`,
    ],
  },

  {
    title: 'الأمان والامتثال',
    paras: [
      `نموذج غير وصائي: المفاتيح الخاصة وعبارات البذور تبقى لدى المستخدم. المصادقة بالتوقيع؛ الوصولات حسب الأدوار، تُسجّل وتُراجع. تقليل البيانات الشخصية، تشفير أثناء النقل والتخزين، خطوط معالجة anti-fraud/anti-sybil.`,
      `النزاهة القانونية: نحن نقدم تحليلات وأدوات وليس نصائح مالية. تدفق الدفع عبر NowPayments مع تأكيد على السلسلة يُفعّل الاشتراك تلقائيًا؛ الحالة تُزامن بين MiniApp/الويب/الروبوت. سياسات الخصوصية والتسجيل شفافة ويتم تحديثها.`,
      `حدود التنفيذ: فحوص منطقية، قيود، محفزات توقف طارئة ومراقبة الشذوذ. إنها أدوات انضباط وليست ضمانًا للنتائج؛ التداول ينطوي على مخاطر، والقرارات تقع على عاتق المستخدم.`,
    ],
  },

  {
    title: 'التكاملات: MiniApp • روبوت • منتدى • بورصة',
    paras: [
      `يعمل Telegram MiniApp والويب كواجهات متطابقة بجلسة وصلاحيات موحدة. روبوت QL7 هو مدخل خفيف لقناة الذكاء الاصطناعي والإشعارات. المنتدى ليس مجرد مجتمع: إنه حافلة معرفية حيث تتحول المعرفة والمساهمات إلى QCoin، ومحتوى VIP يخضع لتقييم ذكاء اصطناعي ذي أولوية.`,
      `البورصة (النواة في المرحلة النهائية): توجيه الأوامر، تقييم سياقي للانزلاق، تنفيذ على السلسلة حيثما ينطبق، وأوضاع موسعة للاختبار الخلفي/what-if لـ VIP. التكامل مع التحليلات يخلق تأثيرًا نادرًا — الإشارة "تعرف" كيف سيتم تنفيذها.`,
    ],
  },

  {
    title: 'VIP واقتصاد QCoin',
    paras: [
      `VIP يزيل الحصص اليومية في AI Box، يوسع الحدود ويمنح أولوية المعالجة. في المنتدى، يحصل VIP على مضاعفات X2 للوقت والمهام، شارة ذهبية ووزن أكبر للمنشورات الإعلامية (فيديو/صور/صوت) في التقييم الخوارزمي. النشاط والمساهمة والمشاهدات تتحول إلى QCoin مع مراعاة الجودة والمشاركة.`,
      `الدفع عبر NowPayments: بمجرد وصول التأكيد على السلسلة، يتم تفعيل الحالة فورًا وتمتد إلى MiniApp/الروبوت/الويب. في خارطة الطريق — إطلاق سلسلة L7: VIP في الطبقات العليا من فئة الأولوية لتوزيع وسحب QCoin، بأدوار مبكرة للمُحققين/المُكدِّسين وحدود أعلى.`,
    ],
  },

  {
    title: 'للفرق والمطورين',
    bullets: [
      'API/SDK/Webhooks بنموذج رموز آمن وتدوير المفاتيح.',
      'تكاملات مدفوعة بالأحداث، بيئات sandbox، موصلات لمصادر على السلسلة/خارجها.',
      'أنماط White-Label وEnterprise: تسجيل دخول موحد SSO، نشرات خاصة، اتفاقيات SLA ونوافذ تغيير.',
      'دفاتر/اختبارات خلفية: تصدير القطع الأثرية، تقارير، قابلية إعادة تجربة التجارب.',
      'مقاييس عميقة لقبول الميزات والأداء لفرق المنتج.',
    ],
  },
],

/* ===== ABOUT ===== */    
about_title: 'حول Quantum L7 AI',
about_paragraphs: [
  `Quantum L7 AI ليس مجرد «تحليلات»، بل هو مسارٌ تشغيلي موحّد لاتخاذ قرارات التداول والتفاعل الاجتماعي حول أسواق التشفير. نواة المنصّة توحّد Web-MiniApp (الويب + تيليغرام)، والمنتديات مع تعدين QCoin المُعمّم بنظام اللعب، ومحرك بحثٍ بحثيّ بالذكاء الاصطناعي يخفّض الضوضاء، ويكشف بنية السيولة، ويقترح سيناريوهات دخول/خروج منضبطة. نحن نصل البنيةَ الميكروية للسوق، والقياس عن بُعد على السلسلة، والأنماط السلوكية، والسرديات الإخبارية في طبقة واحدة منسجمة قابلة للتفسير — حتى لا تضطر «لمطاردة» السوق، بل لتصميم الخطوة مسبقًا.`,

  `وكلاء L7 هي وحدات ذكاء اصطناعي تطبيقية تعيش على البيانات. تقرأ الوثائق والتغذيات، تطلب واجهات API، تراقب البلوكشينات ودفاتر الأوامر والمشتقات، تُشغِّل تجارب مصغّرة وتُخرج مُخرجات قابلة للتفسير: فروض، لقطات backtest، ومؤشرات سياقية. المهم ليس «سحر الصندوق الأسود»، بل القابلية للتتبّع: من كل استنتاج يظهر المسار — ما السمات التي أُخذت بالحسبان (السيولة، الفروقات، اللاتماثل، الاختلالات، الزخم، عناقيد الأحجام)، ولماذا خُفِّض الوزن في المناطق الرقيقة/القابلة للتلاعب، وأين تمرّ حدود بطلان السيناريو.`,

  `لمن هذا. للمتداولين — وعيٌ سياقي سريع وتردد إشارات مُتحكَّم به دون إرهاق؛ وللباحثين — خطوط معالجة قابلة لإعادة الإنتاج وبيانات نظيفة؛ وللفِرَق — API/SDK و webhooks وحافّة أحداث موثوقة؛ ولمجتمع البنّائين — منتديات ومقاييس سمعة واقتصاد QCoin مقابل المساهمة. يحصل VIP+ على قناة ذكاء اصطناعي ذات أولوية، ونشر وسائط، وحصص مُعجّلة، وحالة «ذهبية» تؤثر على الظهور والحدود.`,

  `التغطية. نُجمّع البيانات من أبرز منصّات CEX ومجمّعات DEX، نطبع الرموز وبيانات تعريف العقود، نوحّد ترددات التيك وعمق دفاتر الأوامر. ندخل دلائل موحّدة، وخرائط أزواج/شبكات/أسواق، نُعلِّم المشتقات، ونأخذ بالانقسامات وشطب الإدراج وهجرة العقود. الهدف — قابلية مقارنة المنصات والشبكات: طبقة تجريد واحدة لمقارنة السيولة والتكاليف والتأخّر و«التوافر الحقيقي» للأحجام.`,

  `خط أنابيب البيانات. تُنقّى التدفقات، تُرمّم الفجوات، تُعلَّم الشذوذات، وتُعايَر محيطات التأخّر. التاريخ عميق — ما يتيح كشف الأنظمة بدلاً من شدّ المؤشر على ومضة عشوائية. نضيف المسارات على السلسلة، الجسور التحويلية، توزيعات الحائزين، دلائل نشاط MEV ونربط ذلك بمقاييس السوق. النتيجة — مجموعات سمات متينة ضد «فقاعات الضوضاء» والشذوذات المحلية.`,

  `النواة التحليلية. مئات المؤشرات ليست سوى لوحة ألوان. الأساس — المجموعات والسياق: RSI/RSX و Stochastic و CCI/MFI و ADX/DI و ATR والشرائط، و EMA/SMA/WMA و MACD/Signal/Histogram و VWAP/POC/Value-Area، وبروفايلات الحجم، واختلالات Bid/Ask و«كنس» السيولة. نمزج العائلات الكلاسيكية مع مرشّحات الأنماط، والحدسيات المبنية على السيولة والسلوك، ومع مُؤشِّر التدفق/الخروج على السلسلة. كل بطاقة ليست «نصيحة»، بل بوصلة: السعة تاريخيًا، أفق التحقّق، الثقة، الفرضيات، وحدود الإبطال.`,

  `وحدات على السلسلة. نتابع عناقيد التحويل، والجسور، والتراكم/التوزيع، وتركيز الحائزين الكبار، وأنماط MEV الأساسية والمسارات الشاذة. في مناطق السيولة الرقيقة أو عند طفرة الفاندنغ أو الفروقات، يُخفض وزن الإشارات؛ وعند التأكيد عبر مجالات متعددة (سبوت، مشتقات، على السلسلة) يُرفع. هكذا نقلّل «الثقة الزائفة» في مواضع هشاشة السوق.`,

  `السرديات والأخبار. تُترجم التغذية متعددة اللغات، وتُزال المكررات، وتُفهرس بالتضمينات. نقيس الجِدّة، وثوقية المصدر، نسبة «الطقس/الجوهر»، النبرة، و«لزوجة» الموضوع عبر الزمن. بجوار مقاييس السعر وما على السلسلة، تظهر «خريطة سردية» خفيفة: ما الذي يقود الانتباه، أين مخاطر التنظيم، ما الذي يضخّم التذبذب، وما الذي يخبو.`,

  `بطاقات الإشارات والانضباط. على البطاقة — السعة المتوقعة (الكوَنتيلات)، الأفق الزمني، علامات SL/TP، ملخص سريع للسيولة ومجموعة مُشغّلات يجب أن تتلاقى. المنظومة تدفع نحو الانضباط: قبل الدخول ترى الإبطال، وحدة المخاطرة، وممر تذبذب ديناميكي؛ وبعده — تتلقى نقاط فحص وشروط خفض المخاطرة.`,

  `البنية. خدمات خفيفة بـ TypeScript/Python خلف API مستقر؛ الموقع على Next.js بطبقات حيّة عبر WebSocket. طبقات الكاش والمصادر الاحتياطية تضمن هبوطًا سلسًا وقت الذروة. API/SDK و webhooks يتيحان الأتمتة، بينما الأدوار والتدقيق يرسمان حدود الأمان. MiniApp يعمل على الويب وفي تيليغرام، لتقود السوق في مسار واحد: رسوم بيانية، منتدى، محفظة، بوت — بلا احتكاك.`,

  `الأمان والخصوصية. غير وصائي: لا نطلب ولا نخزّن المفاتيح الخاصة/seed. تُقيَّد الصلاحيات عبر الأدوار، وتُسجَّل الأفعال، وتُقلّل البيانات الشخصية وتُشفّر في النقل والتخزين. خطوط anti-sybil/anti-fraud تحمي اقتصاد QCoin وآليات السمعة في المنتدى؛ والتحقّق من الجلسات يحافظ بعناية — ولكن بصرامة — على سلامة الوصول.`,

  `المنتدى وتعدين QCoin. المنتدى ليس «شبكة اجتماعية»، بل خط إنتاج للمعرفة. كل 4 ساعات تؤكّد النشاط وتُقفل المكافأة؛ المنشورات ذات الوسائط (فيديو/صور/صوت) تمر بتقييم QuantumLCM-AI (جودة، تفاعل، مضاد للسبام/للسيبيل) وتتحوّل إلى QCoin. يحصل VIP+ على ×2 في الوقت و×2 في المهام، أولوية في الظهور، حدود موسّعة للوسائط وتدقيقًا مُسرَّعًا. السمعة والمساهمة ليست ضجيجًا فارغًا، بل مقدار ذو دلالة اقتصادية.`,

  `البورصة (قيد التطوير) والتوصيات. نواة التداول والتنفيذ تُربطان تدريجيًا؛ تتوفر بالفعل توصيات ذكاء اصطناعي بحسب الرموز/الأُطر الزمنية، وعمق دفتر الأوامر وبروفايل السيولة. نُصمّم توجيهًا ذكيًا، وحماية من التأخّر/الانزلاق، وقيود محفظية، ونَسب PnL. يحصل VIP+ على مؤشرات تجريبية، وأنماط what-if/backtest، وآفاق تحليل موسّعة.`,

  `اقتصاد QCoin وسلسلة L7. الـ QCoin هو وقود المعرفة والحركة المفيدة. سلسلة L7 المستقبلية طبقة تصل الأصول عَبْر الشبكات والبنوك والبنية المالية إلى مُوجِّه قيمة عام. هدفنا أن يصبح QCoin وحدة تسوية محايدة في المنظومة، بإصدار/حرق شفاف وطابور سحب عادل. يتمتع VIP+ بأولوية أعلى في التوزيعات وبوصول مبكر لأدوار التخزين/التحقق.`,

  `الدفع والتفعيل. اشتراك VIP+ يتم عبر NowPayments: دفعٌ بالعملات المشفّرة (USDT وغيرها)، يُفعِّل الـ webhook الوصول فورًا ويُزامن الحالة بين MiniApp والبوت والمنتدى. لا لقطات شاشة ولا فحوصات يدوية. الواجهة متاحة بـ 7 لغات؛ ربط المحفظة سلس. أنت تدفع مقابل السرعة والقابلية للتفسير واقتصادٍ تُكافَأ فيه المساهمة.`,

  `المجتمع وخارطة الطريق. ننشر مذكرات أسبوعية، نفتح بيتا لميزات ألفا، ونتلقّى طلبات موجّهة من الفرق. في قائمة العمل: محرّك محفظة بميزانيات مخاطر، توجيه ذكي موسّع CEX/DEX، دفاتر/اختبارات عامة، و«طيار نصف آلي» تحت تحكّم بشري. كل ما يعزّز الانضباط ويقلّل الاحتكاك يذهب للإصدار؛ وما يلمع ولا يُفيد — فلا. المواد تعليمية/تحليلية، وليست نصيحةً مالية.`
],

about_sections: [
  { title: 'ما هو Quantum L7 AI',           parasIdx: [0] },
  { title: 'وكلاء L7، وليس «صندوقًا أسود»',  parasIdx: [1] },
  { title: 'لمن هذا',                        parasIdx: [2] },
  { title: 'التغطية',                        parasIdx: [3] },
  { title: 'خط أنابيب البيانات',             parasIdx: [4] },
  { title: 'النواة التحليلية',               parasIdx: [5] },
  { title: 'وحدات على السلسلة',              parasIdx: [6] },
  { title: 'السرديات والأخبار',              parasIdx: [7] },
  { title: 'البطاقات والانضباط',             parasIdx: [8] },
  { title: 'البنية',                         parasIdx: [9] },
  { title: 'الأمان والخصوصية',               parasIdx: [10] },
  { title: 'المنتدى وتعدين QCoin',           parasIdx: [11] },
  { title: 'البورصة والتوصيات',              parasIdx: [12] },
  { title: 'اقتصاد QCoin وسلسلة L7',         parasIdx: [13] },
  { title: 'الدفع، التوطين، خارطة الطريق',   parasIdx: [14] }
],

about_bullets: [
  'وعيٌ سياقي: اتجاه، زخم، تذبذب، سيولة',
  'تطبيع عبر البورصات، وزن سمات واعٍ للتأخّر (latency-aware)',
  'تدفّقات على السلسلة، تركّز الحائزين، الجسور، لمحات MEV',
  'تغذية سردية مع ترجمة وتقييم الثقة/الجِدّة',
  'بطاقات: السعة (كوَنتيلات)، الآفاق، SL/TP، الثقة',
  'مجاميع مؤشرات + مرشّحات أنماط + سلوك',
  'API/SDK و webhooks للأتمتة بلا «سحر»',
  'هبوط سلس ومصادر احتياطية عند ذروة الحمل',
  'أمان غير وصائي: أدوار، تدقيق، تشفير',
  'منتدى: تعدين QCoin، مهام، نشر وسائط مع تقييم بالذكاء الاصطناعي',
  'VIP+: ×2 في الوقت والمهام، أولوية في الظهور والحدود',
  'التوصيات على البورصة متاحة؛ نواة التنفيذ في الطريق',
  'NowPayments: تفعيل فوري، مزامنة للحالة',
  'سلسلة L7: طوابير سحب أولوية وأدوار مبكرة',
  '7 لغات، دخول موحّد عبر الويب و Telegram MiniApp'
],

tg_button: 'تيليغرام',


/* ===== EXCHANGE (الوصف الموسّع) ===== */
exchange_title: 'البورصة (قيد التطوير)',
exchange_sub:
  `Quantum L7 Exchange — هي منصة تداول متعددة السلاسل، قابلة للتفسير بشكل موثوق من الجيل الجديد،
توحِّد سيولة CEX/DEX، وتوصيات الذكاء الاصطناعي، والبنية التحتية المؤسسية للبيانات في نسيج حوسبي موحّد.
نعالج 87 تيرابايت من تواريخ السوق وأكثر من 37 مليار شمعة تاريخية عبر جميع الشبكات والمنصات الكبرى، ونقوم بتطبيع التكات،
وعمق دفاتر الأوامر ومواصفات المشتقات، لنجعل السوق وفق معيار واحد لاتخاذ القرار. الهدف ليس «بورصة أخرى»،
بل حلقة تنفيذ بمنطق قابل للإثبات: فرضية → اختبار → أدلة → صفقة، مع محددات مخاطر شفافة وتدقيق قابل للتتبع.`,

exchange_sections: [
  {
    title: 'الرؤية: بورصة L7 من الجيل الجديد',
    paras: [
      `L7 Exchange — هو خط أنابيب قائم على الوكلاء، حيث تستهلك وكلات L7 الذاتية خلاصات السوق، والأحداث على السلسلة، والأخبار، والإشارات السلوكية
للبنية المجهرية، وتزامنها زمنياً وتُخرج توصيات قابلة للتفسير (BUY/SELL/HOLD) مع الاحتمال،
وسعة الحركة، والأفق الزمني، وسياق المخاطر (السيولة، الفارق السعري، التشتت، الشذوذات). بالنسبة للمستخدم، هذا يعني
قابلية إعادة إنتاج القرارات: كل بطاقة إشارة تُرفق بسجل العوامل، وإصدارات النماذج، وروابط إلى المصادر الأصلية.`,
      `الهوية — عبر محافظ غير وصائية (لا نحفظ المفاتيح الخاصة ولا عبارات الاسترداد). حقوق الوصول،
والحصص والحدود تتزامن بين واجهة الويب وMiniApp. يتم تنفيذ الإجراءات فقط ضمن
المحددات التي عيّنتها ومع مستوى كافٍ من ثقة النموذج. مبدأ المنصة — القابلية للإثبات، لا «الصندوق الأسود».`,
      `بيانات بمستوى مؤسسي: 87 تيرابايت من التواريخ، 37+ مليار شمعة، توحيد للعقود والرموز،
معالجة مدركة للكمون (latency-aware)، ترميم للفجوات، وأخذ انقسامات وخصائص المشتقات بالحسبان. فوق ذلك — توليفات من 200+ مؤشر
(RSI/ADX/ATR/VWAP/OBV/Ichimoku/عناقيد حجمية، مرشحات حالات وغيرها)، وسمات سلوكية وإحصائيات اختلالات دقيقة.`,
      `النصف الثاني 2026 — نافذة الإطلاق العلني لهواة L7 Exchange مع سلسلة L7 من الجيل الجديد
(طبقة تنسيق بين الشبكات). في البداية — توجيه عبر-البورصات، وتنفيذ تلقائي قابل للتفسير،
ثم — التوسع نحو المقاصة على السلسلة وصلاحيات وصول ذكية أصلية.`,
    ],
  },

  {
    title: 'التوجيه والسيولة',
    paras: [
      `الموجّه الذكي يفحص بالتوازي السيولة على CEX/DEX، ويُنمذج الانزلاق السعري والعمولات والكمون،
ويختار المنصة/مسار التجزئة ويضبط جودة التنفيذ عبر مقاييس مستهدفة (التعبئة المتوقعة expected fill، الاختيار المعاكس adverse selection،
وmark-out بعد N من الثواني/الدقائق). في وضع التجزئة تُقسّم الطلبات وتُوزّع عبر المجمعات/الدفاتر لتقليل الأثر.`,
      `للْكمون أهمية: ندعم cancel/replace، والمهل الزمنية (timeouts)، و«kill-switch»، وقواعد التثبيت الجزئي،
والاستجابة لقفزات تشتت الفارق السعري. في سيناريوهات المراجحة تُستخدم نوافذ مزامنة للتكات واتصالات منخفضة الكمون.`,
      `البنية المجهرية للسوق: نحلّل اختلال الأوامر، طفرات الحجم المخفي، السيولة على المستويات،
أثر الأخبار/الأحداث على السلسلة، سلوك الطبعات «العدوانية» واحتمال الانزلاق وفق حجم القيمة الإسمية (notional).`,
    ],
  },

  {
    title: 'المخاطر والتحكّم',
    paras: [
      `حدود عامة وعلى مستوى الأداة: حسب القيمة الإسمية، ونسبة المحفظة، والتراجع اليومي/الأسبوعي، والرافعة، والتركيز.
ملفات تنفيذ (conservative/balanced/aggressive) والحد الأدنى المطلوب لثقة النموذج. جميع المشغلات موصوفة بشفافية
ويتم تسجيلها للتدقيق. أي إجراء قابل للتفسير: السبب، والبيانات الداخلة، وإصدارات النماذج، ومعايير التنفيذ.`,
      `أوامر مشروطة (stop/stop-limit)، وtime-in-force (GTC/IOC/FOK)، وتوجيهات التثبيت الجزئي، وممرات وقف خسارة ديناميكية
وفق حالة التقلب (مشابهة لـ ATR)، و«circuit-breaker» عند الشذوذات، و«صمت» ليلي وحواجز أحداث (مثلاً أخبار عالية الأثر).`,
      `مضادّ التضخيم ومضادّ القفزات: تحققّات إضافية للفارق/السيولة، عتبات انحراف عن السعر العادل، حظر المتوسط «نحو الهاوية»،
ومستوى طارئ لخفض المخاطر قسراً عندما يصبح المحيط «غير مناسب للتداول».`,
    ],
  },

  {
    title: 'التحليلات والقابلية للتفسير',
    paras: [
      `AI-Box لكل رمز/إطار زمني يعرض مستوى الثقة، وعوامل القرار (من الموضع النسبي لـ VWAP/النطاقات
إلى حالات RSI/العناقيد الحجمية)، والسعة والأفق عبر التاريخ (القيم الكمية) وTP/SL الموصى بها.
العرض مُكثّف ولكنه قابل للتحقق: أرقام لا استعارات.`,
      `القابلية للتفسير بحسب التصميم: سبب ➜ أثر. البطاقة تحتوي أوزان العوامل، وروابط المصادر،
ولقطات فورية للدفاتر/الأحجام ومحاكاة «what-if» مصغّرة. الهدف — منح المتداول هيكل قرار شفاف
يمكن إعادة إنتاجه والطعن فيه.`,
      `الأخبار/السرديات: تحليل متعدد اللغات، وترجمة، وإزالة تكرار، ونبرة بالذكاء الاصطناعي، وثقة بالمصدر، وصلات بردة الفعل السعرية.
هذا ليس «ضجيجاً»، بل سياقاً لتقييم احتمال السيناريو ونوافذ التنفيذ الزمنية.`,
    ],
  },

  {
    title: 'المحفظة، التقارير والإسناد',
    paras: [
      `ألواح محفظة مع إسناد PnL: تفكيك حسب مصادر الألفا، وحالات السوق، والرموز، وميزانيات المخاطر،
وقرارات النموذج. تُحسب على حدة مقاييس «mark-out» والأثر للتمييز بين «الحظ» والمنهجية.`,
      `سجلات صفقات، وتصدير، وتقارير، وواجهات API للتكامل. قابلية تكرار البحوث: اختبارات رجعية و«إعادة تشغيل»
على التدفقات التاريخية مباشرة فوق الرسم البياني. «قوالب استراتيجيات» ونشر «بنقرة واحدة» مع محددات.`,
      `أوضاع الفرق (خارطة طريق): أدوار، وصلاحيات، ومواءمة المعايير، وتقارير مركزية،
وعلامة بيضاء ونشرات خاصة للمؤسسات (enterprise).`,
    ],
  },

  {
    title: 'بنية البيانات والشبكات',
    paras: [
      `توحيد الخلاصات: تجميع عبر-البورصات، ومواءمة التكات والعمق إلى مخطط موحّد، وسدّ الفجوات،
ومعالجة الانقسامات وتغييرات العقود. فوق ذلك — توليفات من 200+ مؤشر، ومرشحات سلوكية/حالات،
وسمات بنية مجهرية. طبقة التاريخ — 87 تيرابايت، وأكثر من 37 مليار شمعة.`,
      `الطبقة على السلسلة: رسوم عناوين، وتركيز الحائزين، وإدخال/سحب السيولة، وتحركات عبر الجسور، ومخاطر MEV الأساسية.
سلاسل الكتل العامة ليست بيانات شخصية؛ ومع ذلك فإن سجلات التشغيل (ضمن القانون) تساعد
على ضمان الموثوقية والتحقيق في الحوادث.`,
      `ركيمة الشبكة: وصلات مُحسّنة إلى مزودي السيولة وبيانات السوق، واستراتيجية تدهور
من دون فقدان الوظائف الحرجة، وذاكرات تخزين مؤقتة ساخنة/دافئة، وأولوية لقنوات VIP. جميع مراحل الحساب قابلة للتتبع.`,
    ],
  },

  {
    title: 'الأمان والامتثال',
    paras: [
      `نموذج غير وصائي: المفاتيح لدى المستخدم، والتخويل — بالتوقيع. وصول قائم على الأدوار،
وتقليل البيانات الشخصية إلى الحد الأدنى، وتشفير «أثناء النقل» و«أثناء التخزين»، وخطوط مضاد-احتيال/anti-sybil.
تسجيل الأفعال للتدقيق وقابلية التكرار.`,
      `السياق التنظيمي: نقدّم تحليلات وأدوات، لا نصائح مالية.
دفع الاشتراك عبر NowPayments مع تأكيد على السلسلة — تفعيل تلقائي للحدود/الحقوق من دون «شيكات» يدوية.
سياسات الخصوصية والتسجيل — شفافة وتُحدَّث بانتظام.`,
      `محددات التنفيذ — انضباط لا ضمان. السوق متقلب؛ القرارات والامتثال لمتطلبات الولايات القضائية —
على عاتق المستخدم. نحن نقدّم أطر العمل والمقاييس والقابلية للتفسير ليكون الخطر مُدرَكاً.`,
    ],
  },

  {
    title: 'خارطة الطريق والإطلاق',
    paras: [
      `H2 2026: الإطلاق العلني لهواة L7 Exchange ونظام سلسلة L7 من الجيل الجديد — طبقة تنسيق بين الشبكات،
مقصود بها تبسيط المقاصة وصلاحيات الوصول على مستوى العقود الذكية، وتحسين قابلية ملاحظة التنفيذ.
التركيز الأساسي — توجيه السيولة، وتنفيذ تلقائي قابل للتفسير، وإسناد المحفظة وأوضاع الفرق.`,
      `QCoin — الاقتصاد الداخلي لمنظومة L7. في خارطة الطريق — دور QCoin في عمليات الدفع/التحفيز داخل المنظومة.
الغاية — «طبقة تسوية» موحّدة بين التحليلات، والتنفيذ، وخدمات المستخدم.`,
      `قبل الإصدار العلني — نسخ بيتا موسّعة، واختبارات إجهاد، وتقارير استقرار، ونتائج مفتوحة مُسجّلة
حول جودة التنفيذ والكمون. الشفافية — نواة الثقة.`,
    ],
  },
],

roadmap: 'خارطة الطريق',

ex_bullets: [
  'توجيه ذكي CEX/DEX مع ضبط الانزلاق، وتجزيئات، وتنفيذ مدرك للكمون',
  'إشارات ذكاء اصطناعي قابلة للتفسير: الاحتمال، السعة، الآفاق، عوامل الثقة، TP/SL',
  'ألواح المحفظة: إسناد PnL، ميزانيات المخاطر، «mark-out»، ومقاييس الأثر',
  'اختبارات رجعية وإعادة تشغيل على التدفقات التاريخية مباشرة على الرسم البياني',
  'محددات المخاطر: حدود، time-in-force، مفتاح إيقاف (kill-switch)، وممرات وقف خسارة ديناميكية',
  'توحيد البيانات: 87 تيرابايت من التاريخ، 37+ مليار شمعة، 200+ مؤشر ومرشحات حالات',
  'اتصال المحافظ، نموذج غير وصائي وتدقيق أفعال قابل للتسجيل',
  'H2 2026: الإطلاق العلني لهواة L7 Exchange ونظام سلسلة L7 من الجيل الجديد',
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
/* ===== HERO / HOME (kısa) ===== */     
hero_title: 'Quantum L7 AI Evrenine Hoş Geldiniz',
hero_subtitle:
  'Quantum L7 AI sadece bir platform değil, baştan sona bir karar alma siber evrenidir: kurumsal sınıf çok zincirli veriler, otonom L7 ajanları, on-chain hatlar ve ticaret yönlendirmesi tek bir dijital organizma gibi çalışır. Web-MiniApp, Telegram MiniApp ve QL7 AI Bot’u, QCoin ekonomisine sahip forumu ve küresel borsayı ( çekirdek son aşamada ) birbirine bağlıyoruz; böylece anlık alfa sinyalleri, disiplinli giriş/çıkış pencereleri, otomatikleştirilmiş icra ve şeffaf bir risk konturu sağlıyoruz. Yetkilendirme — saklama yapmayan cüzdanlar üzerinden (anahtarlar sizde), PRO/VIP seviyeleri desteği, öncelikli limitler ve kota kaldırma. Temelde — hukuken titizlikle doğrulanmış bir Web3 mimarisi, borsalar arası likidite agregasyonu, davranışsal ve mikro-yapısal modeller ile hipotez → test → kanıt günlüklerine sahip tekrarlanabilir araştırma hatları. Bu, piyasanın temposunda çalışan ve ispatlanabilirlik, hız ve doğruluk talep edenler için yeni nesil bir altyapıdır.',
hero_cta: 'Telegram’da Başla',
hero_learn_more: 'Daha fazla bilgi',
marquee: 'YZ • Kuantum ajanlar • On-chain analitik • Kripto borsası (çekirdek) • Forum • QCoin Madenciliği • Otomatik icra • Risk konturu • Likidite yönlendirme • Web3 Metaverse • API/SDK • Enterprise • Tüm hakları saklıdır',

home_blocks: [
  {
    title: 'Neden Quantum L7 AI',
    paras: [
      `Quantum L7 AI — çok platformlu bir ekosistemdir: YZ çekirdeği, otonom L7 ajanları, on-chain izleme, normalize edilmiş piyasa feed’leri, forumun sosyal ağı ve QCoin ekonomisi tek bir hesaplama dokusunda birleştirilmiştir. Her bir artefakt — işlem, haber anlatısı, gönderi, likidite grafiği — ortak veri çevrimine girer ve eylem sinyaline dönüşür.`,
      `L7 ajanları belgeleri ve API’leri otonom olarak okur, blokzincirleri ve emir defterlerini gözlemler, davranış kalıplarını sınıflandırır, piyasa rejimlerini değerlendirir ve doğrulanabilir hipotezler çıkarır. Sonuç — “kara kutu” değil, açıklanabilir bir karttır: senaryo olasılığı, genlik, ufuklar, SL/TP, güven faktörleri ve birincil kaynaklara bağlantılar.`,
      `Yetkilendirme — saklama yapmayan cüzdanlar üzerinden: özel anahtarları saklamayız, adres sahipliğini doğrularız. Erişim hakları ve kotalar Telegram MiniApp, web arayüzü ve QL7 botu arasında senkronize edilir; VIP durumu limit sınırlarını işaretler ve öncelikli işleme kanallarına geçirir.`,
      `Piyasa çekirdeği borsalar arası agregasyon, sembol/kontrat birliği ve gecikme-duyarlı (latency-aware) feed işleme üzerine kuruludur. Spread dağılımını, şok hacimleri, emir dengesi, MEV riskleri ve haber impulsu etkisini izlemek için kurum seviyesindeki tarihçeleri gerçek zamanlı akışlarla birleştiriyoruz.`,
      `Platform ilkesi — ispatlanabilirlik: hipotez → test → kanıtlar. Her hesaplama loglanır, metrikler yeniden üretilebilir ve “gürültü” arbitrajı rejim filtreleriyle ayıklanır. Böylece ham verileri disiplinli kararlara, sezgiyi doğrulanabilir taktiğe dönüştürüyoruz.`,
      `Forum çevrime gömülüdür: içerik AI skorlama’dan (kalite, etkileşim, anti-spam/anti-sybil) geçer ve aktivite QCoin ekonomisine haritalanır. Bu “beğeni için sosyal ağ” değil, bilginin ve katkının jetonlaştırılmış değere dönüştüğü hedeflenmiş bir bilişsel otobüstür.`,
    ],
  },

  {
    title: 'Ne elde edersiniz',
    bullets: [
      'Yeni nesil kuant analitik: YZ zekâsı, on-chain metrikler ve piyasanın mikro-yapısal özelliklerinin sinerjisi.',
      'Yürütme olasılığı, genlik ve ufukla birlikte alfa sinyalleri; ayrıca güven faktörlerinin şeffaf gerekçesi.',
      'Normalize edilmiş borsalar arası veri çekirdeği: sembol/kontrat, likidite, spread ve tik frekansının birleştirilmesi.',
      'On-chain izleme: sahip dağılımı, köprüler üzerinden akışlar, CEX/DEX likiditesi, temel MEV kalıpları.',
      'Küresel borsa (çekirdek geliştirme aşamasında): likidite yönlendirme, kayma koruması, bağlamsal risk değerlendirmesi.',
      'Auto-execute: fail-safe tetikleyicilerle yürütme, dinamik stoplar ve anomalilerde acil durdurma.',
      'Portföy panelleri: PnL atfı, risk bütçeleri, oynaklık rejimleri, koridorlar ve pozisyon boyutu disiplini.',
      'Tekrarlanabilir araştırmalar: backtestler, not defterleri, görsel raporlar, what-if senaryoları ve varsayımların ekspozisyonu.',
      'Anlatı akışı: AI tonlaması, gömlemeler (embeddings), kaynak güveni ve haberlerin fiyat metrikleriyle bağlanması.',
      'Forum ekonomisi: AI moderasyonu, katkı ve aktivite için QCoin madenciliği, algoritmik skorlama ile medya gönderimi.',
      'VIP programı: AI Box’ta günlük kotaların kaldırılması, genişletilmiş limitler, öncelikli işleme ve görevler/zaman için QCoin’de X2.',
      'Entegrasyonlar: Telegram MiniApp, web, QL7 botu; tek oturum, ortak durum ve uyumlu erişim hakları.',
      'API/SDK/Webhooks: güvenli entegrasyonlar, sandbox modu, ekipler ve otomasyon için olay güdümlü mimari.',
      'Multichain yığın: Ethereum, BSC, Polygon, Solana, TON, Avalanche vb.; köprüleme ve ağ özgünlüklerinin dikkate alınması.',
      'Hukuken titizlikle doğrulanmış Web3 mimarisi: loglama, rol ayrımı, kriptografik doğrulama ve mahremiyet.',
    ],
  },

  {
    title: 'Altyapı ve veriler',
    paras: [
      `Piyasa verileri: CEX/DEX’in tarihsel ve akış feed’lerini birleştirir, ortak şemaya getirir, boşlukları kapatır, bölünmeleri ve türev özelliklerini hesaba katarız. Üstünde — topluluk (ensemble) göstergeler (RSI/ADX/ATR/VWAP/OBV/Ichimoku/hacim kümeleri), rejim filtreleri ve likidite bağlamı.`,
      `On-chain katman: adres grafikleri, likidite hareketleri, büyük sahip yoğunlukları, köprü olayları, temel MEV riskleri. Açık blokzincirler kişisel veri değildir, ancak güvenilirlik ve olay incelemesi için istekleri ve hata ayıklama kimliklerini dikkatle loglarız.`,
      `Anlatılar ve haberler: çok dilli indeksleme, çeviri, yinelenenlerin kaldırılması, kaynak skoru, yenilik ve fiyatla kovaryansın değerlendirilmesi; sonuç — fiyat ve hacmin yanında gürültüyü anlamlı impulsdan ayırmaya yardım eden hafif sayısal bir üst katman.`,
      `Depolar ve önbellek: akışların sıcak/ılık olarak ayrılması, kritik işlev kaybı olmadan kademeli bozulma, VIP ve sistem görevleri için kanal önceliklendirme. Tüm hesaplama aşamalarında izlenebilirlik, artefakt sürüm kontrolü ve yeniden üretilebilirlik vardır.`,
    ],
  },

  {
    title: 'Güvenlik ve uygunluk',
    paras: [
      `Saklama yapmayan model: özel anahtarlar ve seed ifadeleri kullanıcıda kalır. Yetkilendirme — imza ile; erişimler — rollere göre, loglanır ve denetlenir. Kişisel verilerin en aza indirilmesi, aktarımda ve depoda şifreleme, anti-fraud/anti-sybil hatları.`,
      `Hukuki temizlik: analiz ve araçlar sağlarız, finansal tavsiye değil. NowPayments üzerinden on-chain teyit ile ödeme akışı aboneliği otomatik etkinleştirir; durum MiniApp/web/bot arasında senkronize edilir. Gizlilik ve log politikaları şeffaftır ve güncellenir.`,
      `Yürütme sınırlayıcıları: sağduyu kontrolleri (sanity-checks), limitler, acil durdurma tetikleyicileri ve anomali izleme. Bunlar disiplin araçlarıdır, sonuç garantisi değil; ticaret risk içerir, kararlar kullanıcıya aittir.`,
    ],
  },

  {
    title: 'Entegrasyonlar: MiniApp • Bot • Forum • Borsa',
    paras: [
      `Telegram MiniApp ve web, tek oturum ve haklarla aynalı arayüzler olarak çalışır. QL7 botu AI kanalına ve bildirimlere hafif bir giriş sağlar. Forum sadece bir topluluk değil: bilgi ve katkının QCoin’e dönüştüğü bilişsel bir otobüstür ve VIP içeriği öncelikli AI skorlamasından geçer.`,
      `Borsa (çekirdek son aşamada): emir yönlendirme, kayma için bağlamsal değerlendirme, uygulanabildiğinde on-chain icra ve VIP için genişletilmiş backtest/what-if modları. Analitik ile entegrasyon nadir bir etki verir — sinyal “nasıl” icra edileceğini bilir.`,
    ],
  },

  {
    title: 'VIP ve QCoin ekonomisi',
    paras: [
      `VIP, AI Box’taki günlük kotaları kaldırır, limitleri genişletir ve işlemeyi önceliklendirir. Forumda VIP, zaman ve görevler için X2 çarpanları, altın rozet ve algoritmik skorlama içinde medya gönderilerine (video/görüntü/ses) artırılmış ağırlık alır. Aktivite, katkı ve görüntülemeler kalite ve etkileşim dikkate alınarak QCoin’e dönüştürülür.`,
      `Ödeme NowPayments üzerinden: on-chain teyit gelir gelmez durum anında etkinleşir ve MiniApp/bot/web’e yayılır. Yol haritasında — L7 zincirinin başlatılması: VIP, QCoin dağıtımı ve çekim kuyrukları için öncelik katmanlarının üstünde yer alır, doğrulayıcı/stake eden rollere erken erişim ve artırılmış limitler alır.`,
    ],
  },

  {
    title: 'Takımlar ve geliştiriciler için',
    bullets: [
      'Güvenli token modeli ve anahtar döndürme ile API/SDK/Webhooks.',
      'Olay güdümlü entegrasyonlar, sandbox ortamları, on-chain/off-chain kaynaklara konnektörler.',
      'White-Label ve Enterprise modları: SSO, özel dağıtımlar, SLA, değişiklik pencereleri.',
      'Not defterleri/backtestler: artefakt dışa aktarımı, raporlar, deneylerin yeniden üretilebilirliği.',
      'Ürün ekipleri için özellik kabulü ve performansa dair derin metrikler.',
    ],
  },
],


/* ===== ABOUT ===== */     
about_title: 'Quantum L7 AI Hakkında',
about_paragraphs: [
  `Quantum L7 AI sadece bir “analitik” değildir; kripto piyasaları etrafında ticaret kararları almayı ve sosyal etkileşimi birleştiren tek bir operasyonel sistemdir. Platformun çekirdeği, Web-MiniApp’i (web + Telegram), oyunlaştırılmış QCoin madenciliğine sahip forumları ve gürültüyü azaltan, likidite yapısını ortaya çıkaran ve disiplinli giriş/çıkış senaryoları öneren bir yapay zekâ araştırma motorunu bir araya getirir. Piyasa mikro yapısını, zincir üstü telemetrileri, davranış kalıplarını ve haber anlatılarını tek bir uyumlu ve yorumlanabilir katmanda birleştiriyoruz — böylece piyasayı “yakalamak” zorunda kalmaz, adımı önceden planlayabilirsiniz.`,

  `L7 ajanları — veriler üzerinde yaşayan uygulamalı yapay zekâ modülleridir. Belgeleri ve akışları okur, API’lere istek gönderir, blok zincirlerini, emir defterlerini ve türevleri gözlemler, mini deneyler yürütür ve açıklanabilir çıktılar sunar: hipotezler, backtest anlık görüntüleri, bağlamsal göstergeler. Burada önemli olan “kara kutu büyüsü” değil, izlenebilirliktir: Her sonuçta yol görünür — hangi özellikler dikkate alınmıştır (likidite, spread’ler, asimetri, dengesizlikler, momentum, hacim kümeleri), neden ince/manipüle edilebilir alanlarda ağırlık azaltılmıştır ve senaryonun geçersizlik sınırı nerededir.`,

  `Kimin için. Tüccarlar için — hızlı durumsal farkındalık ve aşırı yüklenmeden kontrol edilebilir sinyal sıklığı; araştırmacılar için — yeniden üretilebilir veri işleme hatları ve temiz veri; ekipler için — API/SDK, webhook’lar ve güvenilir bir olay hattı; geliştirici topluluğu için — forumlar, itibar metrikleri ve katkıya dayalı QCoin ekonomisi. VIP+ kullanıcıları, öncelikli bir yapay zekâ kanalı, medya paylaşımı, hızlandırılmış kotalar ve görünürlük ve limitleri etkileyen “altın” statü elde eder.`,

  `Kapsam. Önde gelen CEX ve DEX toplayıcılarından veri topluyor, sembolleri ve sözleşme meta verilerini normalleştiriyor, tik frekanslarını ve emir defteri derinliklerini birleştiriyoruz. Birleşik dizinler, çiftler/ağlar/piyasalar için eşleştirmeler oluşturuyor, türevleri işaretliyor, bölünmeleri, delistleri ve sözleşme göçlerini hesaba katıyoruz. Amaç — platformlar ve ağlar arasında karşılaştırılabilirliktir: likiditeyi, maliyetleri, gecikmeleri ve “gerçek” hacim kullanılabilirliğini karşılaştırmak için tek bir soyutlama katmanı.`,

  `Veri hattı. Akışlar temizlenir, eksikler onarılır, anormallikler işaretlenir, gecikme konturları kalibre edilir. Derin geçmiş, rastgele bir sıçrama yerine rejimleri tanımlama olanağı sağlar. Zincir üstü yollar, köprüler, sahip dağılımları, MEV etkinliği göstergeleri ekliyor ve bunları piyasa metrikleriyle ilişkilendiriyoruz. Sonuç — “gürültü kabarcıklarına” ve yerel anormalliklere dayanıklı özellik kümeleri.`,

  `Analitik çekirdek. Yüzlerce gösterge yalnızca bir palettir. Önemli olan — ansambller ve bağlamdır: RSI/RSX, Stochastic, CCI/MFI, ADX/DI, ATR ve bantlar, EMA/SMA/WMA, MACD/Signal/Histogram, VWAP/POC/Value-Area, hacim profilleri, Bid/Ask dengesizlikleri ve likidite süpürmeleri. Klasik aileleri rejim filtreleriyle, likidite ve davranışa dayalı sezgilerle ve zincir üstü giriş/çıkış işaretçileriyle birleştiriyoruz. Her kart bir “tavsiye” değil, bir pusuladır: tarihsel genlik, gerçekleştirme ufku, güven düzeyi, varsayımlar ve geçersizlik sınırları.`,

  `Zincir üstü modüller. Transfer kümelerini, köprüleri, birikim/dağılımı, büyük sahip yoğunluklarını, temel MEV kalıplarını ve anormal yolları izliyoruz. İnce likidite bölgelerinde veya fonlama/spread patlamalarında sinyal ağırlığı azalır; birden fazla alan (spot, türev, zincir üstü) tarafından onaylandığında artar. Bu, piyasanın kırılgan olduğu yerlerde “yanlış güven”i en aza indirir.`,

  `Anlatılar ve haberler. Çok dilli akış çevrilir, yinelenenler kaldırılır ve gömülerle endekslenir. Yenilik, kaynak güvenilirliği, “ritüel/öz” oranı, ton ve konunun zaman içindeki “yoğunluğu” değerlendirilir. Fiyat ve zincir üstü metriklerin yanında hafif bir “anlatı haritası” görünür: ilgiyi ne yönlendiriyor, düzenleyici riskler nerede, volatiliteyi ne artırıyor, ne sönümleniyor.`,

  `Sinyal kartları ve disiplin. Kartta — beklenen genlik (kantiller), zaman ufku, SL/TP işaretleri, hızlı likidite özeti ve bir araya gelmesi gereken tetikleyici seti bulunur. Sistem disiplini teşvik eder: Giriş öncesinde geçersizliği, risk birimini ve dinamik volatilite koridorunu görürsünüz; sonrasında — kontrol noktaları ve risk azaltma koşulları alırsınız.`,

  `Mimari. TypeScript/Python üzerinde hafif servisler, istikrarlı bir API’nin arkasında; site — WebSocket üzerinden canlı katmanlarla Next.js üzerine kuruludur. Önbellek seviyeleri ve yedek kaynaklar, zirve zamanlarında sorunsuz bozulmayı sağlar. API/SDK ve webhook’lar otomasyon sağlar, roller ve denetimler güvenli sınırlar belirler. MiniApp, web’de ve Telegram’da çalışır, böylece piyasayı tek bir akışta yönetebilirsiniz: grafikler, forum, cüzdan, bot — sürtünmesiz.`,

  `Güvenlik ve gizlilik. Saklama yapılmaz: özel anahtarlar/seed istenmez veya saklanmaz. Roller erişimi sınırlar, eylemler kaydedilir, kişisel veriler en aza indirilir ve iletim/depolama sırasında şifrelenir. Anti-sybil/anti-fraud hatları QCoin ekonomisini ve forumun itibar mekanizmalarını korur; oturum doğrulaması dikkatli ama sıkı bir şekilde erişim bütünlüğünü sürdürür.`,

  `Forum ve QCoin madenciliği. Forum bir “sosyal ağ” değil, bilgi üretim hattıdır. Her 4 saatte bir etkinliği onaylar ve ödülü kilitlersiniz; medya içeren gönderiler (video/görsel/ses) QuantumLCM-AI tarafından (kalite, etkileşim, anti-spam/anti-sybil) puanlanır ve QCoin’e dönüştürülür. VIP+ zaman açısından ×2 ve görevlerde ×2 alır, listelerde öncelik, genişletilmiş medya limitleri ve hızlandırılmış moderasyon elde eder. İtibar ve katkı, boş bir gürültü değil, ekonomik olarak anlamlı bir değerdir.`,

  `Borsa (geliştirme aşamasında) ve öneriler. Ticaret çekirdeği ve yürütme kademeli olarak bağlanır; şu anda sembol/zaman aralıkları, emir defteri derinliği ve likidite profiline göre yapay zekâ önerileri mevcuttur. Akıllı yönlendirme, gecikme/kayma koruması, portföy kısıtlamaları ve PnL atfı tasarlıyoruz. VIP+ deneysel göstergelere, what-if/backtest modlarına ve genişletilmiş analiz ufuklarına erişim sağlar.`,

  `QCoin ekonomisi ve L7 blok zinciri. QCoin — bilgi ve faydalı trafiğin yakıtıdır. Gelecekteki L7-chain, çapraz ağ varlıklarını, bankaları ve finansal altyapıyı evrensel bir değer yönlendiriciye bağlayan bir katmandır. Amacımız, QCoin’in ekosistem içinde şeffaf ihraç/yakım ve adil çekim sırası ile nötr bir hesap birimi haline gelmesidir. VIP+, dağıtımlarda artırılmış önceliğe ve stake/doğrulayıcı rollere erken erişime sahiptir.`,

  `Ödeme ve aktivasyon. VIP+ aboneliği NowPayments üzerinden yapılır: kripto ödeme (USDT vb.), webhook erişimi anında etkinleştirir ve durumu MiniApp, bot ve forum arasında senkronize eder. Ekran görüntüleri veya manuel doğrulamalar gerekmez. Arayüz 7 dilde mevcuttur; cüzdan bağlantısı sorunsuzdur. Hız, yorumlanabilirlik ve katkının ödüllendirildiği bir ekonomi için ödeme yaparsınız.`,

  `Topluluk ve yol haritası. Haftalık notlar yayımlıyoruz, alfa özelliklerinin betalarını açıyoruz, ekiplerden hedefli talepler alıyoruz. Geri planda: risk bütçeleriyle portföy motoru, gelişmiş CEX/DEX akıllı yönlendirme, herkese açık not defterleri/backtest’ler, insan kontrolünde “yarı otomatik pilot”. Disiplini artıran ve sürtünmeyi azaltan her şey yayına girer; parlayan ama faydasız olanlar — asla. Materyaller — eğitimsel/analitik, finansal tavsiye değildir.`
],

about_sections: [
  { title: 'Quantum L7 AI Nedir',           parasIdx: [0] },
  { title: 'L7 Ajanları, “Kara Kutu” Değil', parasIdx: [1] },
  { title: 'Kimler İçin',                   parasIdx: [2] },
  { title: 'Kapsam',                        parasIdx: [3] },
  { title: 'Veri Hattı',                    parasIdx: [4] },
  { title: 'Analitik Çekirdek',             parasIdx: [5] },
  { title: 'Zincir Üstü Modüller',          parasIdx: [6] },
  { title: 'Anlatılar ve Haberler',         parasIdx: [7] },
  { title: 'Kartlar ve Disiplin',           parasIdx: [8] },
  { title: 'Mimari',                        parasIdx: [9] },
  { title: 'Güvenlik ve Gizlilik',          parasIdx: [10] },
  { title: 'Forum ve QCoin Madenciliği',    parasIdx: [11] },
  { title: 'Borsa ve Öneriler',             parasIdx: [12] },
  { title: 'QCoin Ekonomisi ve L7 Zinciri', parasIdx: [13] },
  { title: 'Ödeme, Yerelleştirme, Yol Haritası', parasIdx: [14] }
],

about_bullets: [
  'Durumsal farkındalık: trend, momentum, volatilite, likidite',
  'Borsalar arası normalizasyon, gecikme farkındalıklı özellik ağırlığı',
  'Zincir üstü akışlar, sahip yoğunlukları, köprüler, MEV ipuçları',
  'Çevirili ve güven/yenilik değerlendirmeli anlatı akışı',
  'Kartlar: genlik (kantiller), ufuklar, SL/TP, güven',
  'Gösterge ansamblleri + rejim filtreleri + davranış',
  '“Sihir” olmadan otomasyon için API/SDK ve webhook’lar',
  'Yoğunlukta sorunsuz düşüş ve yedek kaynaklar',
  'Saklamasız güvenlik: roller, denetim, şifreleme',
  'Forum: QCoin madenciliği, görevler, AI puanlamalı medya paylaşımı',
  'VIP+: zamana ve görevlere ×2, listelerde ve limitlerde öncelik',
  'Borsa önerileri zaten mevcut; yürütme çekirdeği yolda',
  'NowPayments: anında aktivasyon, durum senkronizasyonu',
  'L7 blok zinciri: öncelikli çekim sıraları ve erken roller',
  '7 dil, web ve Telegram MiniApp üzerinden tek erişim'
],

tg_button: 'Telegram',


/* ===== EXCHANGE (genişletilmiş açıklama) ===== */
exchange_title: 'Borsa (geliştirme aşamasında)',
exchange_sub:
  `Quantum L7 Exchange — çok zincirli, makul şekilde açıklanabilir yeni nesil bir ticaret platformudur,
CEX/DEX likiditesini, yapay zekâ önerilerini ve kurumsal veri altyapısını tek bir hesaplama dokusunda birleştirir.
Tüm büyük ağlar ve platformlarda 87 TB piyasa geçmişini ve 37+ milyar tarihsel mum verisini işliyor, tikleri,
emir defteri derinliğini ve türev spesifikasyonlarını normalize ederek piyasayı tek bir karar alma standardına getiriyoruz. Amaç — «bir borsa daha» değil,
kanıtlanabilir mantığa sahip bir yürütme çevrimi: hipotez → test → kanıtlar → işlem, şeffaf risk sınırlayıcıları ve izlenebilir denetim ile.`,

exchange_sections: [
  {
    title: 'Vizyon: yeni nesil L7 borsası',
    paras: [
      `L7 Exchange — otonom L7 ajanlarının piyasa beslemelerini, onchain olayları, haberleri ve mikroyapı davranış sinyallerini
tükettiği, bunları zaman açısından senkronize edip açıklanabilir öneriler (BUY/SELL/HOLD) ürettiği ajan-temelli bir boru hattıdır,
olasılık, genlik, ufuk ve risk bağlamı (likidite, spread, varyans, anormallikler) ile. Kullanıcı için bu,
kararların yeniden üretilebilirliği anlamına gelir: her sinyal kartı faktör günlüğü, model sürümleri ve birincil kaynaklara bağlantılar ile birlikte gelir.`,
      `Kimlik — saklama yapmayan cüzdanlar aracılığıyla (özel anahtarları ve seed ifadelerini saklamıyoruz). Erişim hakları,
kotalar ve limitler web arayüzü ve MiniApp içinde senkronize edilir. Eylemlerin yürütülmesi — yalnızca sizin belirlediğiniz
sınırlayıcılar dâhilinde ve modelin yeterli güven düzeyi olduğunda. Platformun ilkesi — «kara kutu» değil, kanıtlanabilirlik.`,
      `Kurumsal düzeyde veriler: 87 TB geçmiş, 37+ milyar mum, sözleşmelerin ve sembollerin birleştirilmesi,
gecikme-duyarlı (latency-aware) akış işleme, boşlukların temizlenmesi, bölünmelerin ve türev özelliklerinin dikkate alınması. Üstünde — 200+ göstergeden oluşan ansambller
(RSI/ADX/ATR/VWAP/OBV/Ichimoku/hacim kümeleri, rejim filtreleri vb.), davranışsal özellikler ve mikro dengesizlik istatistikleri.`,
      `H2 2026 — yeni nesil L7 blokzinciri ile birlikte L7 Exchange çekirdeğinin halka açık lansmanı için hedef pencere
(ağlar arası uzlaşma katmanı). Başlangıçta — borsalar arası yönlendirme, açıklanabilir otomatik yürütme,
ardından — onchain kliringe ve yerel akıllı erişim haklarına doğru genişleme.`,
    ],
  },

  {
    title: 'Yönlendirme ve likidite',
    paras: [
      `Akıllı yönlendirici paralel olarak CEX/DEX üzerindeki likiditeyi tarar, kayma (slippage), ücretler ve gecikmeleri modeller,
platformu/bölünmüş rotayı seçer ve hedef metrikler (expected fill, adverse selection, 
N saniye/dakika sonrası mark-out) üzerinden yürütme kalitesini kontrol eder. Bölme modunda emirler parçalanır ve etkisini en aza indirmek için havuzlara/defterlere dağıtılır.`,
      `Gecikme önemlidir: cancel/replace, zaman aşımı (time-out), «kill-switch», kısmi kâr alma kuralları ve
spread varyansındaki sıçramalara tepkiyi destekliyoruz. Arbitraj senaryolarında tik senkronizasyon pencereleri ve düşük gecikmeli bağlantılar kullanılır.`,
      `Piyasa mikroyapısı: emir dengesizliğini, gizli hacim sıçramalarını, seviye bazlı likiditeyi,
haberlerin/onchain olayların etkisini, «agresif» baskıların davranışını ve nominal büyüklüğe göre kayma olasılığını analiz ediyoruz.`,
    ],
  },

  {
    title: 'Risk ve kontrol',
    paras: [
      `Küresel ve enstrüman bazlı limitler: nominal, portföy payı, günlük/haftalık geri çekilme, kaldıraç, yoğunlaşma.
Yürütme profilleri (conservative/balanced/aggressive) ve model için asgari gerekli güven. Tüm tetikleyiciler şeffaf biçimde tanımlanır
ve denetim için kaydedilir. Her eylem açıklanabilir: neden, giriş verileri, model sürümleri ve yürütme parametreleri.`,
      `Koşullu emirler (stop/stop-limit), time-in-force (GTC/IOC/FOK), kısmi kâr alma direktifleri, dinamik stop koridorları
volatilite rejimine göre (ATR-benzeri), «circuit-breaker» anormalliklerde, gece «sessizlikleri» ve olay blokları (örneğin yüksek etkili haberler).`,
      `Anti-hızlandırma ve anti-sıçrama: spread/likidite için ekstra kontroller, adil fiyattan sapma eşikleri, «uçuruma» doğru ortalamayı yasaklama,
çevre «ticaret için uygunsuz» olduğunda zorunlu gerilimi azaltma için acil düzey.`,
    ],
  },

  {
    title: 'Analitik ve açıklanabilirlik',
    paras: [
      `Her sembol/TF için AI-Box güven düzeyini, karar faktörlerini (VWAP/bantlara göre göreli konumdan
RSI/hacim kümeleri rejimlerine kadar), tarihsel genliği ve ufukları (kantil) ve önerilen TP/SL’yi gösterir. 
Sunum kompakt ama doğrulanabilirdir: metafor değil, rakamlar.`,
      `Tasarım gereği açıklanabilirlik: neden ➜ etki. Kart, faktör ağırlıklarını, kaynak bağlantılarını,
defterler/hacimler için anlık görüntüleri ve «what-if» mini simülasyonlarını içerir. Amaç — tüccara şeffaf bir karar iskeleti vermek,
ki yeniden üretilebilir ve itiraz edilebilir.`,
      `Haberler/anlatılar: çok dilli ayrıştırma, çeviri, yinelenenlerin kaldırılması, AI-tonu, kaynağa güven, fiyat tepkisiyle bağ.
Bu «gürültü» değil, senaryo olasılığını ve yürütme zaman pencerelerini değerlendirmek için bağlamdır.`,
    ],
  },

  {
    title: 'Portföy, raporlama ve atıf',
    paras: [
      `PnL atfı olan portföy panelleri: alfa kaynaklarına, piyasa rejimlerine, sembollere, risk bütçelerine ve
model kararlarına göre ayrıştırma. «Mark-out» ve etki metrikleri ayrıca hesaplanır ki «şansı» sistematiklikten ayırabilelim.`,
      `İşlem günlükleri, dışa aktarma, raporlar, entegrasyonlar için API. Araştırmaların tekrarlanabilirliği: backtestler ve «replay» 
geçmiş akışlar üzerinde doğrudan grafiğin üstünde. «Strateji şablonları» ve sınırlayıcılarla «tek tıkla» devreye alma.`,
      `Takım modları (yol haritası): roller, yetkiler, parametre uzlaşması, merkezi raporlar, 
white-label ve enterprise için özel dağıtımlar.`,
    ],
  },

  {
    title: 'Veri ve ağ altyapısı',
    paras: [
      `Beslemelerin birleştirilmesi: borsalar arası toplama, tik ve derinliğin ortak şemaya getirilmesi, boşlukların kapatılması, 
bölünmelerin ve sözleşme değişikliklerinin işlenmesi. Üstünde — 200+ göstergeden ansambller, davranışsal/rejim filtreleri
ve mikroyapısal özellikler. Tarihsel katman — 87 TB, 37 milyardan fazla mum.`,
      `Onchain katman: adres grafikleri, sahip yoğunlaşması, likidite girişi/çıkışı, köprü hareketleri, temel MEV riskleri.
Genel blokzincirler kişisel veri değildir; buna karşın operasyonel günlükler (yasa sınırları içinde) 
güvenilirliği sağlamak ve olay soruşturmalarına yardımcı olmak için fayda sağlar.`,
      `Ağ yığını: likidite ve piyasa verisi sağlayıcılarına optimize bağlantılar, kritik işlev kaybı olmadan bozulma stratejisi,
sıcak/ılık önbellekler, VIP işleme kanallarına öncelik. Tüm hesaplama aşamaları izlenebilir.`,
    ],
  },

  {
    title: 'Güvenlik ve uyumluluk',
    paras: [
      `Saklama yapmayan model: anahtarlar kullanıcıda, yetkilendirme — imzayla. Rol tabanlı erişim, 
asgari kişisel veri, «aktarılırken» ve «depolanırken» şifreleme, anti-fraud/anti-sybil hatları.
Eylemlerin denetim ve tekrarlanabilirlik için günlüğe alınması.`,
      `Düzenleyici bağlam: finansal tavsiyeler değil, analiz ve araçlar sunuyoruz.
NowPayments üzerinden onchain teyit ile abonelik ödemesi — manuel «kontroller» olmadan limit/hakların otomatik aktivasyonu. 
Gizlilik ve günlükleme politikaları — şeffaf ve düzenli güncellenir.`,
      `Yürütme sınırlayıcıları — disiplin, garanti değil. Piyasa oynaktır; kararlar ve yargı gerekliliklerine uyum —
kullanıcı tarafındadır. Riskin bilinçli olması için çerçeveler, metrikler ve açıklanabilirlik sunuyoruz.`,
    ],
  },

  {
    title: 'Yol haritası ve lansman',
    paras: [
      `H2 2026: L7 Exchange çekirdeği ve yeni nesil L7 blokzincirinin halka açık lansmanı — akıllı sözleşmeler seviyesinde kliringi
ve erişim haklarını basitleştirmeyi, ayrıca yürütmenin gözlemlenebilirliğini iyileştirmeyi amaçlayan ağlar arası uzlaşma katmanı.
Ana odak — likidite yönlendirme, açıklanabilir otomatik yürütme, portföy atfı ve takım modları.`,
      `QCoin — L7 ekosisteminin dahili ekonomisi. Yol haritasında — ekosistemin ödeme/teşvik süreçlerinde QCoin’in rolü.
Amaç — analitik, yürütme ve kullanıcı hizmetleri arasında tek bir «hesaplaşma katmanı».`,
      `Halka açık sürümden önce — genişletilmiş betalar, stres testleri, kararlılık raporları ve 
yürütme kalitesi ile gecikmeler üzerine açık, günlüklü sonuçlar. Şeffaflık — güvenin çekirdeği.`,
    ],
  },
],

roadmap: 'Yol haritası',

ex_bullets: [
  'Slippage kontrolü, bölme ve gecikme-duyarlı yürütme ile CEX/DEX akıllı yönlendirme',
  'Açıklanabilir AI sinyalleri: olasılık, genlik, ufuklar, güven faktörleri, TP/SL',
  'Portföy panelleri: PnL atfı, risk bütçeleri, «mark-out», etki metrikleri',
  'Geçmiş akışlar üzerinde doğrudan grafikte backtestler ve replayler',
  'Risk sınırlayıcıları: limitler, time-in-force, kill-switch, dinamik stop koridorları',
  'Veri birleştirme: 87 TB geçmiş, 37+ milyar mum, 200+ gösterge ve rejim filtreleri',
  'Cüzdan bağlantısı, saklama yapmayan model ve eylemlerin günlüğe alınabilir denetimi',
  'H2 2026: L7 Exchange çekirdeğinin ve yeni nesil L7 blokzincirinin halka açık lansmanı',
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
  nav_privacy: 'Privacy',
  privacy_title: 'Privacy & Policy',
  privacy_updated_label: 'Updated:',
  privacy_updated: '2025-10-30',
  privacy_empty: 'No data',
  privacy_sections: [
    {
      title: '1. Overview',
      paras: [
        '1.1. This Quantum L7 AI Privacy Policy (hereinafter — the “Policy”) describes what data we collect, the legal bases for processing, where and how we store it, how we protect it, and how we transfer it within the ecosystem: website, Web-MiniApp, Telegram Mini App, Telegram bot(s), API, Forum, analytics services, and trading interfaces (incl. the Exchange under development).',
        '1.2. By using Quantum L7 AI services (“Service”), you confirm that you have read the Policy and accept its terms. The Policy is intended to transparently inform users, is not individual legal advice, and does not replace contracts/offers/policies of specific vendors.',
        '1.3. We act as a data controller with respect to personal data we collect and for which we determine the purposes/means of processing, and as a processor where we process data on behalf of clients/partners.',
        '1.4. The terms “personal data,” “processing,” “controller,” “processor,” “data subject,” and “international transfer” are used as defined by global regulatory frameworks (GDPR/UK GDPR, CCPA/CPRA, etc.).',
        '1.5. Our services interact with on-chain sources and market feeds: public blockchain data is inherently open and is not our “personal data,” but correlations with your account may constitute personal data.'
      ]
    },

    {
      title: '2. What We Collect',
      paras: [
        '2.1. Account and identification data: Telegram ID/username/display name (when logging in via Telegram Mini App or bot), internal Account ID, subscription status labels (VIP/Free), interface language.',
        '2.2. Contact data: email (if provided), Forum nickname, reference identifiers of external accounts (Google, Apple, Twitter/X, Discord, etc.) when linked.',
        '2.3. Authorization and linkages: the fact and route of login through a multi-provider ecosystem (OAuth/OIDC, Telegram WebApp initData, Sign in with Apple/Google/Twitter/X/Discord, wallet signature, magic link), technical tokens/stamps/signatures (without storing private keys or seed phrases).',
        '2.4. Wallets and networks: public addresses, networks used (L1/L2), transaction metadata related to subscription payments via NowPayments and on-chain confirmations.',
        '2.5. Usage data: visited pages/screens, interface actions, timestamps, hashed IP, user agent, client performance parameters, error telemetry.',
        '2.6. Forum and content: posts, topics, upload metadata (images/video/audio), system scoring artifacts (quality/engagement/anti-spam/anti-sybil), activity statistics for QCoin mining.',
        '2.7. Payments and billing: invoice statuses, payment confirmations (via the integrated payment provider), amounts/currencies/timestamps, technical routing logs.',
        '2.8. On-chain and market data: we index and aggregate public chains/exchange feeds/order books/historical candles for analytical purposes and to provide Service functionality.'
      ]
    },

    {
      title: '3. On-chain and Public Data',
      paras: [
        '3.1. Public blockchain records are available to any network participant; their processing for analytics, indicators, and recommendations is carried out within the permitted use of publicly available information.',
        '3.2. Matching on-chain activity with your account is possible when a wallet/payments/subscriptions are voluntarily linked. In this case, a personal usage profile is created.',
        '3.3. Requests to public nodes/RPC/indexing providers and market aggregators may be logged for reliability, security, abuse prevention, and service quality improvement.'
      ]
    },

    {
      title: '4. Cookies, localStorage, and Other Client Artifacts',
      paras: [
        '4.1. We apply minimally necessary mechanisms: language storage, secure session tokens, anti-abuse parameters, UX settings.',
        '4.2. If cookies/localStorage are blocked, some functions may become unavailable or degraded (e.g., sessions, personal limits, language).',
        '4.3. Where required by law, we request consent for non-critical cookies/analytics.'
      ]
    },

    {
      title: '5. How We Use Data',
      paras: [
        '5.1. Providing functionality: authorization/linking of accounts, synchronization of subscription statuses, access to the Forum, MiniApp, bot, analytics dashboards, and recommendations.',
        '5.2. Product improvement: aggregated usage analytics, A/B evaluations, performance telemetry, troubleshooting, improving AI model accuracy.',
        '5.3. Security and integrity: abuse protection (rate limit, anti-spam, anti-sybil), anomaly control, audit of service actions, incident investigation.',
        '5.4. Billing and compliance: processing payment statuses, confirmations, access rights accounting, compliance with financial reporting and counter-illegal activity laws.',
        '5.5. Communications and support: responses to requests, status notifications (e.g., successful VIP activation), service messages.',
        '5.6. We do not conduct marketing profiling; mailings are carried out only when a lawful basis exists (e.g., consent).'
      ]
    },

    {
      title: '6. Transfer and Disclosure to Third Parties',
      paras: [
        '6.1. We do not sell personal data.',
        '6.2. Data may be processed by our subprocessors under our instructions and only for the purposes described in the Policy: compute platforms/hosting, CDN, object storage, queues and caches, monitoring/logging/error tracking, payment gateways, messaging providers (email/Telegram), analytics platforms.',
        '6.3. Disclosure is possible in compliance with the law, lawful requests by competent authorities, and to protect the rights/safety of users and the Service.',
        '6.4. In the event of a change in corporate control (merger/sale of assets), data may be transferred to the successor provided equivalent protection is maintained and notice is given where required by law.'
      ]
    },

    {
      title: '7. Security',
      paras: [
        '7.1. Principles: security by design, least privilege (PoLP), separation of duties, mandatory logging of critical operations.',
        '7.2. Encryption: TLS in transit; encryption at rest for sensitive artifacts; key management with access control.',
        '7.3. Access: multi-factor authentication for admin consoles, role-based access control, environment segmentation (prod/stage/dev).',
        '7.4. Change control: code reviews, signed builds, gradual rollouts, rollbacks, blocking unsafe configurations.',
        '7.5. Testing and monitoring: intrusion detection, alerts, periodic reviews of configurations and permissions.',
        '7.6. Wallet keys and seed phrases: we do not request or store them. Signatures are performed on the user side or in a trusted wallet.'
      ]
    },

    {
      title: '8. International Transfers',
      paras: [
        '8.1. Processing and storage may be carried out in multi-regional infrastructure with geo-replication and load balancing.',
        '8.2. For cross-border transfers, lawful mechanisms are used (including standard contractual clauses, where applicable) and equivalent protective measures.',
        '8.3. The user consents to international data transfer within the scope of providing the Service.'
      ]
    },

    {
      title: '9. Your Rights',
      paras: [
        '9.1. EEA/UK (GDPR): right of access, rectification, erasure, restriction/objection, portability, and the right to lodge a complaint with a supervisory authority.',
        '9.2. USA (including California/CPRA): right to know, correct, delete, opt out of sale/sharing, and the right to non-discrimination for exercising rights.',
        '9.3. Exercising rights: see the “How to Exercise Rights” section. Identity verification is required.'
      ]
    },

    {
      title: '10. Children',
      paras: [
        '10.1. The Service is not intended for children under 13 (or a higher age as required by your jurisdiction).',
        '10.2. If you believe a child has provided us with data, contact us for deletion.'
      ]
    },

    {
      title: '11. Changes',
      paras: [
        '11.1. We may update the Policy to reflect changes in technology, law, and products.',
        '11.2. In the event of material changes, the “Updated” date is revised and, if necessary, a notice is displayed in the interface.'
      ]
    },

    {
      title: '12. Contacts',
      paras: [
        '12.1. Email for privacy requests: quantuml7ai@gmail.com',
        '12.2. Feedback channel (bot): https://t.me/L7ai_feedback'
      ]
    },

    {
      title: '13. Definitions and Scope',
      paras: [
        '13.1. “Service” — websites, Web-MiniApp, Telegram Mini App, Telegram bots, Forum, API, analytics, payment integrations, and trading interfaces.',
        '13.2. “We” — Quantum L7 AI. The Policy covers data where we act as the controller. Third-party services (authorization providers, blockchains, wallets, payment gateways) operate under their own rules.',
        '13.3. The subject of the Policy — user data and operational data necessary for the functioning of the Service.'
      ]
    },

    {
      title: '14. Legal Bases for Processing (GDPR/UK GDPR)',
      paras: [
        '14.1. Contract/necessity for service provision: authorization, access to functionality, billing, and support.',
        '14.2. Legitimate interest: security, abuse prevention, operational analytics with low privacy risk.',
        '14.3. Consent: optional metrics/marketing communications, where applicable. Consent may be withdrawn.',
        '14.4. Legal obligation: storage and disclosure where required by law (e.g., accounting records).'
      ]
    },

    {
      title: '15. Data Storage (Retention)',
      paras: [
        '15.1. We retain personal data no longer than necessary for the purposes of processing or as required by law.',
        '15.2. Benchmarks: service logs 30–180 days; performance telemetry up to 90 days; support correspondence up to 12 months; billing records — according to legal retention periods.',
        '15.3. Anonymized aggregates may be stored longer for research and statistical purposes.'
      ]
    },

    {
      title: '16. Subprocessors and Infrastructure',
      paras: [
        '16.1. Categories of subprocessors: compute platforms and hosting, CDN, object storages, SQL/NoSQL databases, caches and message queues, monitoring/logging/tracing, email/messaging dispatch, payment operators, providers indexing on-chain/market feeds.',
        '16.2. Data Protection Agreements (DPAs) are in place with each subprocessor, and technical/organizational security measures are applied.',
        '16.3. The up-to-date list of categories is available in the Policy; a detailed current list is provided upon request subject to security requirements.'
      ]
    },

    {
      title: '17. Analytics and Metrics',
      paras: [
        '17.1. We may collect aggregated usage metrics (interface coverage, performance, feature adoption) to the extent necessary to improve the product.',
        '17.2. Analytics settings aim to exclude sensitive data and minimize personal identifiers.',
        '17.3. Where required, a consent mechanism is used for non-essential metrics.'
      ]
    },

    {
      title: '18. Logs and Telemetry',
      paras: [
        '18.1. Operational logs may include timestamps, hashed IP, user agent, error traces, request/correlation IDs, response codes.',
        '18.2. Logs are rotated, access-restricted, and used for debugging, capacity planning, DDoS/bot traffic protection, and auditing.',
        '18.3. Logging points are designed in line with the principle of minimization.'
      ]
    },

    {
      title: '19. Mail, Notifications, and Communications',
      paras: [
        '19.1. Messages sent to our addresses/bots are processed for support, contract performance, and service quality accounting.',
        '19.2. You may opt out of non-service mailings; service notifications (e.g., subscription status) are essential for functionality.'
      ]
    },

    {
      title: '20. Webhooks and API',
      paras: [
        '20.1. When using Webhook/API, payloads may be temporarily buffered for reliable delivery, deduplication, and replay protection.',
        '20.2. Do not transmit secrets, private keys, or other materials not intended for third parties via Webhook/API; use signatures, token rotation, and source restrictions.'
      ]
    },

    {
      title: '21. Wallet Linking and Payments',
      paras: [
        '21.1. We store public addresses and network parameters necessary for identification and billing functions. Private keys/seed phrases are not collected or stored.',
        '21.2. Payment processing is performed via an integrated provider; we receive invoice/confirmation statuses and identifiers necessary for VIP subscription activation.',
        '21.3. On-chain payment confirmations are public information; we match them with your account solely for access purposes.'
      ]
    },

    {
      title: '22. Execution Limiters and Risk Contour',
      paras: [
        '22.1. Technical limiters (rate limit, sanity checks) and risk rules apply to trading/analytical modes. These are engineering mechanisms, not guarantees of results.',
        '22.2. The user is responsible for trading decisions, legal compliance, and risk management.'
      ]
    },

    {
      title: '23. Research, Models, and AI',
      paras: [
        '23.1. We may train/validate models on aggregated/pseudonymized datasets where appropriate and lawful.',
        '23.2. When using third-party models, we comply with contractual and technical restrictions on transferring personal data and apply minimization.'
      ]
    },

    {
      title: '24. Automated Decisions',
      paras: [
        '24.1. We do not make solely automated decisions with a legally significant effect on the user.',
        '24.2. Recommendations and assessments are auxiliary signals to support decisions. The final choice remains with the user.'
      ]
    },

    {
      title: '25. Pseudonymization, Aggregation, and Minimization',
      paras: [
        '25.1. Where possible, we pseudonymize identifiers and aggregate metrics, separating keys and data payloads.',
        '25.2. Access to the “key—data” linkage is limited by roles and necessity.'
      ]
    },

    {
      title: '26. Portability and Export',
      paras: [
        '26.1. You may request an export of personal data associated with your account/bot identifier.',
        '26.2. We will provide the data in a machine-readable format, if there are no legal restrictions, and after verification.'
      ]
    },

    {
      title: '27. Exercising Data Subject Rights',
      paras: [
        '27.1. Send a request by email to quantuml7ai@gmail.com or via the feedback bot.',
        '27.2. For identity verification, we may ask you to send a message from the linked Telegram/bot account or to confirm ownership of the associated account/wallet.',
        '27.3. A response is provided within the timeframes established by applicable law; some requests may be limited by security/legislative requirements.'
      ]
    },

    {
      title: '28. Incidents and Breach Notifications',
      paras: [
        '28.1. Response procedures are in place: incident classification, impact containment, root cause investigation, service restoration.',
        '28.2. Where required by law, affected users and regulators are notified and provided with relevant information about the nature of the incident and the measures taken.'
      ]
    },

    {
      title: '29. Jurisdictional Notes',
      paras: [
        '29.1. EEA/UK: GDPR/UK GDPR norms apply regarding data subject rights, lawfulness of processing, and international transfers.',
        '29.2. USA: applicable state laws apply (including CPRA). Where supported technical opt-out signals exist, we strive to honor them.',
        '29.3. Other regions: local rules apply regarding mandatory storage, notification, and protection requirements.'
      ]
    },

    {
      title: '30. Do Not Track (DNT) and Global Privacy Control (GPC)',
      paras: [
        '30.1. If your browser sends DNT/GPC, we account for these signals to the extent technically supported and required by law.'
      ]
    },

    {
      title: '31. Opt-Out Options and Privacy Settings',
      paras: [
        '31.1. You may disable non-essential cookies/analytics, unsubscribe from non-service emails, and restrict bot permissions.',
        '31.2. Core security/functional mechanisms may require minimal processing and cannot be disabled.'
      ]
    },

    {
      title: '32. Accessibility, Languages, and Interpretation',
      paras: [
        '32.1. We provide texts in multiple languages. In case of discrepancies, the English version may prevail for legal interpretation.',
        '32.2. Translations aim to maintain legal equivalence.'
      ]
    },

    {
      title: '33. Data Stores and Location',
      paras: [
        '33.1. Operational databases: relational and/or document-oriented DBMS deployed in a multi-zone architecture with redundancy and replication.',
        '33.2. Caches and queues: Redis clusters/streams/queues to accelerate sessions, anti-abuse logic, and temporary artifacts.',
        '33.3. Object storage: storage of user-uploaded media and backups with managed versioning and lifecycle policies.',
        '33.4. Backups: periodic backups, recovery verification, separation of access rights, encryption at rest.',
        '33.5. Authorization integrations: identity providers (Google, Apple, Twitter/X, Discord, Telegram) provide us with tokens/confirmations; we do not store their passwords or manage their internal databases.',
        '33.6. Geography: data may be processed in multi-regional infrastructure for fault tolerance and performance, using lawful international transfer mechanisms.'
      ]
    },

    {
      title: '34. Policy Term and Versions',
      paras: [
        '34.1. The Policy enters into force as of the “Updated” date indicated above.',
        '34.2. We may retain previous editions for archival purposes and transparency of changes.'
      ]
    },

    {
      title: 'Appendix A: Glossary',
      paras: [
        'A.1. Controller — a person/organization determining the purposes and means of processing personal data.',
        'A.2. Processor — a person/organization processing data on behalf of the controller.',
        'A.3. Personal data — any information about an identified or identifiable person.',
        'A.4. International transfer — the transfer of personal data outside the country/region of their initial collection.'
      ]
    },

    {
      title: 'Appendix B: Categories of Subprocessors',
      paras: [
        'B.1. Hosting/compute and container orchestration.',
        'B.2. CDN and edge content delivery.',
        'B.3. Databases (SQL/NoSQL) and Redis caches.',
        'B.4. Object storages and backup systems.',
        'B.5. Monitoring/logging/tracing/error tracking.',
        'B.6. Payment operators and on-chain confirmation gateways.',
        'B.7. Messaging providers (email/Telegram) and queue services.',
        'B.8. Blockchain data/market feed indexing and analytics platforms.'
      ]
    }
  ]
};


/* -------------------- RU -------------------- */
const PRIVACY_RU = { 
  nav_privacy: 'Политика конфиденциальности',
  privacy_title: 'Политика конфиденциальности',
  privacy_updated_label: 'Обновлено:',
  privacy_updated: '2025-10-30',
  privacy_empty: 'Нет данных',
  privacy_sections: [
    {
      title: '1. Обзор',
      paras: [
        '1.1. Эта Политика конфиденциальности Quantum L7 AI (далее — «Политика») описывает, какие данные мы собираем, на каких правовых основаниях обрабатываем, где и как храним, как защищаем и передаём в пределах экосистемы: веб-сайт, Web-MiniApp, Telegram Mini App, Telegram-бот(ы), API, Форум, аналитические сервисы и торговые интерфейсы (вкл. разрабатываемую Биржу).',
        '1.2. Используя сервисы Quantum L7 AI («Сервис»), вы подтверждаете, что ознакомились с Политикой и принимаете её условия. Политика предназначена для прозрачного информирования пользователей, не является индивидуальной юридической консультацией и не заменяет договоры/оферты/политики конкретных вендоров.',
        '1.3. Мы действуем как контролёр данных в отношении персональных данных, которые собираем и определяем цели/средства их обработки, и как процессор там, где обрабатываем данные по поручению клиентов/партнёров.',
        '1.4. Термины «персональные данные», «обработка», «контролёр», «процессор», «субъект данных», «международная передача» используются в значениях, принятых глобальными регуляторными рамками (GDPR/UK GDPR, CCPA/CPRA и пр.).',
        '1.5. Наши сервисы взаимодействуют с ончейн-источниками и рыночными лентами: публичные блокчейн-данные по природе открыты и не являются нашими «персональными данными», но сопоставления с вашим аккаунтом могут образовывать персональные данные.'
      ]
    },

    {
      title: '2. Что мы собираем',
      paras: [
        '2.1. Учётные и идентификационные данные: Telegram ID/username/отображаемое имя (при входе через Telegram Mini App или бот), внутренний Account ID, метки статуса подписки (VIP/Free), язык интерфейса.',
        '2.2. Контактные данные: email (если предоставляете), ник на Форуме, ссылочные идентификаторы внешних аккаунтов (Google, Apple, Twitter/X, Discord и др.) при связывании.',
        '2.3. Авторизация и связки: факт и маршрут входа через мульти-провайдерную экосистему (OAuth/OIDC, Telegram WebApp initData, Sign in with Apple/Google/Twitter/X/Discord, wallet-signature, magic-link), технические токены/штампы/подписи (без хранения приватных ключей и сид-фраз).',
        '2.4. Кошельки и сети: публичные адреса, используемые сети (L1/L2), транзакционные метаданные, связанные с оплатой подписки через NowPayments и ончейн-подтверждения.',
        '2.5. Данные использования: посещённые страницы/экраны, действия в интерфейсе, временные метки, хешированный IP, user-agent, параметры производительности клиента, телеметрия ошибок.',
        '2.6. Форум и контент: посты, темы, метаданные загрузок (изображения/видео/аудио), системные артефакты скоринга (оценки качества/вовлечённости/anti-spam/anti-sybil), статистика активности для QCoin-майнинга.',
        '2.7. Оплаты и биллинг: статусы инвойсов, подтверждения платежей (через интегрированный платёжный провайдер), суммы/валюты/временные метки, технические журналы маршрутизации.',
        '2.8. Ончейн и маркет-данные: мы индексируем и агрегируем публичные цепочки/биржевые ленты/книги заявок/исторические свечи в аналитических целях и для предоставления функций Сервиса.'
      ]
    },

    {
      title: '3. Ончейн и публичные данные',
      paras: [
        '3.1. Публичные блокчейн-записи доступны любому участнику сети; их обработка для аналитики, индикаторов и рекомендаций производится в рамках допустимого использования общедоступной информации.',
        '3.2. Сопоставление ончейн-активности с вашим аккаунтом возможно при добровольной привязке кошелька/платежей/подписок. В таком случае создаётся персональный профиль использования.',
        '3.3. Запросы к публичным нодам/провайдерам RPC/индексации и маркет-агрегаторам могут логироваться для надёжности, безопасности, защиты от злоупотреблений и улучшения качества сервиса.'
      ]
    },

    {
      title: '4. Cookie, localStorage и другие клиентские артефакты',
      paras: [
        '4.1. Мы применяем минимально необходимые механизмы: сохранение языка, безопасные маркеры сессии, анти-абьюз параметры, UX-настройки.',
        '4.2. При блокировке cookie/localStorage часть функций может стать недоступной или деградировать (например, сессии, персональные лимиты, язык).',
        '4.3. Где это требуется законом, мы запрашиваем согласие на некритичные cookie/аналитику.'
      ]
    },

    {
      title: '5. Как мы используем данные',
      paras: [
        '5.1. Предоставление функционала: авторизация/связывание аккаунтов, синхронизация статусов подписки, доступ к Форуму, MiniApp, боту, аналитическим панелям и рекомендациям.',
        '5.2. Улучшение продукта: агрегированная аналитика использования, A/B-оценки, телеметрия производительности, устранение сбоев, повышение точности ИИ-моделей.',
        '5.3. Безопасность и целостность: защита от злоупотреблений (rate-limit, anti-spam, anti-sybil), контроль аномалий, аудит служебных действий, расследование инцидентов.',
        '5.4. Биллинг и соответствие: обработка статусов платежей, подтверждений, учёт прав доступа, соблюдение законов о финансовой отчётности и противодействии незаконной деятельности.',
        '5.5. Коммуникации и поддержка: ответы на запросы, уведомления по статусам (например, успешная активация VIP), сервисные сообщения.',
        '5.6. Маркетинговое профилирование не ведём; рассылки осуществляются только при наличии законного основания (например, согласия).'
      ]
    },

    {
      title: '6. Передача и раскрытие третьим лицам',
      paras: [
        '6.1. Мы не продаём персональные данные.',
        '6.2. Данные могут обрабатываться нашими субпроцессорами по нашим инструкциям и только в целях, описанных Политикой: вычислительные платформы/хостинг, CDN, объектное хранилище, очереди и кэши, мониторинг/логирование/трекинг ошибок, платёжные шлюзы, провайдеры сообщений (email/Telegram), аналитические платформы.',
        '6.3. Раскрытие возможно при соблюдении закона, законных запросах компетентных органов, защите прав/безопасности пользователей и Сервиса.',
        '6.4. При смене корпоративного контроля (слияние/продажа активов) данные могут быть переданы правопреемнику при условии соблюдения эквивалентной защиты и уведомления, если это требуется законом.'
      ]
    },

    {
      title: '7. Безопасность',
      paras: [
        '7.1. Принципы: безопасность по проекту (security by design), минимум привилегий (PoLP), разделение обязанностей, обязательное журналирование критичных операций.',
        '7.2. Шифрование: TLS при передаче; шифрование на уровне хранения для чувствительных артефактов; управление ключами с контролем доступа.',
        '7.3. Доступ: многофакторная аутентификация для админских консолей, ролевое разграничение, сегментация сред (prod/stage/dev).',
        '7.4. Контроль изменений: рецензирование кода, подписанные сборки, постепенные выкладки, откаты, блокировки небезопасных конфигураций.',
        '7.5. Тестирование и мониторинг: детектирование вторжений, алерты, периодические ревизии конфигураций и разрешений.',
        '7.6. Ключи кошельков и seed-фразы: мы их не запрашиваем и не храним. Подписания выполняются на стороне пользователя или доверенного кошелька.'
      ]
    },

    {
      title: '8. Международные передачи',
      paras: [
        '8.1. Обработка и хранение могут осуществляться в много-региональной инфраструктуре с гео-репликацией и балансировкой.',
        '8.2. При трансграничных передачах используются законные механизмы (в т.ч. стандартные договорные положения, если применимо) и эквивалентные меры защиты.',
        '8.3. Пользователь соглашается на международную передачу данных в рамках предоставления Сервиса.'
      ]
    },

    {
      title: '9. Ваши права',
      paras: [
        '9.1. ЕЭЗ/UK (GDPR): право на доступ, исправление, удаление, ограничение/возражение, переносимость, а также право подать жалобу в надзорный орган.',
        '9.2. США (включая Калифорнию/CPRA): право знать, исправлять, удалять, отказаться от продажи/обмена, право на отсутствие дискриминации за реализацию прав.',
        '9.3. Реализация прав: см. раздел «Как реализовать права». Идентификационная проверка обязательна.'
      ]
    },

    {
      title: '10. Дети',
      paras: [
        '10.1. Сервис не предназначен для детей младше 13 лет (или более высокого возраста согласно праву вашей юрисдикции).',
        '10.2. Если вы считаете, что ребёнок предоставил нам данные, свяжитесь с нами для удаления.'
      ]
    },

    {
      title: '11. Изменения',
      paras: [
        '11.1. Мы можем обновлять Политику для отражения изменений в технологиях, праве и продуктах.',
        '11.2. При существенных изменениях обновляется дата «Обновлено» и, при необходимости, отображается уведомление в интерфейсе.'
      ]
    },

    {
      title: '12. Контакты',
      paras: [
        '12.1. Email для запросов по приватности: quantuml7ai@gmail.com',
        '12.2. Канал обратной связи (бот): https://t.me/L7ai_feedback'
      ]
    },

    {
      title: '13. Определения и область действия',
      paras: [
        '13.1. «Сервис» — сайты, Web-MiniApp, Telegram Mini App, Telegram-боты, Форум, API, аналитика, интеграции платежей и биржевые интерфейсы.',
        '13.2. «Мы» — Quantum L7 AI. Политика охватывает данные, где мы выступаем контролёром. Сторонние сервисы (провайдеры авторизации, блокчейны, кошельки, платёжные шлюзы) действуют по своим правилам.',
        '13.3. Объект Политики — данные пользователей и операционные данные, необходимые для функционирования Сервиса.'
      ]
    },

    {
      title: '14. Правовые основания обработки (GDPR/UK GDPR)',
      paras: [
        '14.1. Договор/необходимость для оказания услуги: авторизация, доступ к функционалу, биллинг и поддержка.',
        '14.2. Законный интерес: безопасность, предотвращение злоупотреблений, эксплуатационная аналитика с низким риском для частной жизни.',
        '14.3. Согласие: опциональные метрики/маркетинговые коммуникации, если применимо. Согласие можно отозвать.',
        '14.4. Юридическая обязанность: хранение и раскрытие там, где этого требует закон (например, бухгалтерские записи).'
      ]
    },

    {
      title: '15. Хранение данных (ретенция)',
      paras: [
        '15.1. Мы храним персональные данные не дольше, чем необходимо для целей обработки или требований закона.',
        '15.2. Ориентиры: служебные логи 30–180 дней; телеметрия производительности до 90 дней; переписка поддержки до 12 месяцев; биллинговые записи — согласно правовым срокам хранения.',
        '15.3. Анонимизированные агрегаты могут храниться дольше для исследовательских и статистических целей.'
      ]
    },

    {
      title: '16. Субпроцессоры и инфраструктура',
      paras: [
        '16.1. Категории субпроцессоров: вычислительные платформы и хостинг, CDN, объектные хранилища, базы данных SQL/NoSQL, кэши и очереди сообщений, мониторинг/логирование/трассировка, рассылка email/сообщений, платёжные операторы, провайдеры индексирования ончейн/рыночных лент.',
        '16.2. С каждым субпроцессором заключены договорённости о защите данных (DPA) и применяются технические/организационные меры безопасности.',
        '16.3. Обновляемый перечень категорий доступен в Политике; детальный актуальный список предоставляется по запросу с учётом требований безопасности.'
      ]
    },

    {
      title: '17. Аналитика и метрики',
      paras: [
        '17.1. Мы можем собирать агрегированные метрики использования (покрытие интерфейсов, производительность, принятие функций) в объёме, необходимом для улучшения продукта.',
        '17.2. Настройки аналитики ориентированы на исключение чувствительных данных и минимизацию персональных идентификаторов.',
        '17.3. Где требуется, применяется механизм согласия для несущественных метрик.'
      ]
    },

    {
      title: '18. Логи и телеметрия',
      paras: [
        '18.1. Операционные логи могут включать временные метки, хеш-IP, user-agent, трассировки ошибок, ID запросов/корреляции, коды ответов.',
        '18.2. Логи ротируются, ограничены по доступу и используются для отладки, планирования ёмкости, защиты от DDoS/бот-трафика, аудита.',
        '18.3. Точки логирования спроектированы с учётом принципа минимизации.'
      ]
    },

    {
      title: '19. Почта, уведомления и коммуникации',
      paras: [
        '19.1. Сообщения, отправленные на наши адреса/боты, обрабатываются для поддержки, исполнения договорных обязательств и учёта качества сервиса.',
        '19.2. Вы можете отказаться от несервисных рассылок; сервисные уведомления (например, о статусе подписки) являются обязательными для функционирования.'
      ]
    },

    {
      title: '20. Webhooks и API',
      paras: [
        '20.1. При использовании Webhook/API полезные нагрузки могут временно буферизоваться для надёжной доставки, дедупликации и защиты от повторов.',
        '20.2. Не передавайте через Webhook/API секреты, приватные ключи и иные материалы, не предназначенные для сторон; используйте подписи, ротацию токенов и ограничение источников.'
      ]
    },

    {
      title: '21. Привязка кошельков и платежи',
      paras: [
        '21.1. Мы храним публичные адреса и сетевые параметры, необходимые для функций идентификации и биллинга. Приватные ключи/seed-фразы не собираются и не хранятся.',
        '21.2. Платёжный процессинг выполняется через интегрированный провайдер; мы получаем статусы/идентификаторы инвойсов и подтверждений, необходимые для активации подписки VIP.',
        '21.3. Ончейн-подтверждения платежей являются публичной информацией; мы сопоставляем их с вашим аккаунтом исключительно для целей доступа.'
      ]
    },

    {
      title: '22. Ограничители исполнения и риск-контур',
      paras: [
        '22.1. Для торговых/аналитических режимов применяются технические ограничители (rate-limit, sanity-checks) и риск-правила. Это инженерные механизмы, а не гарантии результата.',
        '22.2. Ответственность за торговые решения, соблюдение правовых требований и риск-менеджмент несёт пользователь.'
      ]
    },

    {
      title: '23. Исследования, модели и ИИ',
      paras: [
        '23.1. Мы можем обучать/валидировать модели на агрегированных/псевдонимизированных наборах, где это уместно и законно.',
        '23.2. При использовании сторонних моделей соблюдаем договорные и технические ограничения передачи персональных данных и применяем минимизацию.'
      ]
    },

    {
      title: '24. Автоматизированные решения',
      paras: [
        '24.1. Мы не принимаем исключительно автоматизированные решения с юридически значимым эффектом в отношении пользователя.',
        '24.2. Рекомендации и оценки — вспомогательные сигналы для поддержки решений. Окончательный выбор остаётся за пользователем.'
      ]
    },

    {
      title: '25. Псевдонимизация, агрегация и минимизация',
      paras: [
        '25.1. Где возможно, мы псевдонимизируем идентификаторы и агрегируем метрики, разделяем ключи и полезные данные.',
        '25.2. Доступ к связке «ключ—данные» ограничивается ролями и необходимостью.'
      ]
    },

    {
      title: '26. Портируемость и экспорт',
      paras: [
        '26.1. Вы можете запросить экспорт персональных данных, связанных с вашим аккаунтом/бот-идентификатором.',
        '26.2. Мы предоставим данные в машиночитаемом формате, если отсутствуют правовые ограничения, и после верификации.'
      ]
    },

    {
      title: '27. Реализация прав субъектов данных',
      paras: [
        '27.1. Направьте запрос по email quantuml7ai@gmail.com или через бота обратной связи.',
        '27.2. Для верификации личности можем попросить отправить сообщение из привязанного Telegram/бот-аккаунта либо подтвердить владение связанной учётной записью/кошельком.',
        '27.3. Ответ предоставляется в сроки, установленные применимым правом; некоторые запросы могут быть ограничены требованиями безопасности/законодательства.'
      ]
    },

    {
      title: '28. Инциденты и уведомления о нарушениях',
      paras: [
        '28.1. Действуют процедуры реагирования: классификация инцидента, ограничение воздействия, расследование причин, восстановление сервисности.',
        '28.2. В случаях, требуемых законом, уведомляются затронутые пользователи и регуляторы, предоставляется релевантная информация о характере инцидента и применённых мерах.'
      ]
    },

    {
      title: '29. Юрисдикционные заметки',
      paras: [
        '29.1. ЕЭЗ/UK: применяются нормы GDPR/UK GDPR в части прав субъектов данных, законности обработки, международных передач.',
        '29.2. США: применяются соответствующие законы штатов (включая CPRA). При наличии поддерживаемых технических сигналов opt-out мы стремимся их учитывать.',
        '29.3. Иные регионы: применяются локальные нормы в части обязательных требований к хранению, уведомлению и защите.'
      ]
    },

    {
      title: '30. Do Not Track (DNT) и Global Privacy Control (GPC)',
      paras: [
        '30.1. Если ваш браузер отправляет DNT/GPC, мы учитываем эти сигналы в той мере, в какой это поддерживается технически и требуется правом.'
      ]
    },

    {
      title: '31. Опции отказа и настройки приватности',
      paras: [
        '31.1. Вы можете отключить несущественные cookies/аналитику, отписаться от несервисных писем, ограничить права бота.',
        '31.2. Базовые механизмы безопасности/функциональности могут требовать минимальной обработки и не могут быть отключены.'
      ]
    },

    {
      title: '32. Доступность, языки и толкование',
      paras: [
        '32.1. Мы предоставляем тексты на нескольких языках. При несоответствии версий приоритет может иметь английская версия для целей юридического толкования.',
        '32.2. Переводы стремятся сохранять юридическую эквивалентность.'
      ]
    },

    {
      title: '33. Хранилища и расположение данных',
      paras: [
        '33.1. Операционные базы данных: реляционные и/или документо-ориентированные СУБД, развернутые в много-зонной архитектуре с резервированием и репликацией.',
        '33.2. Кэши и очереди: Redis-кластеры/стримы/очереди для ускорения сессий, анти-абьюз логики и временных артефактов.',
        '33.3. Объектное хранилище: хранение загруженных пользователями медиа и резервных копий с управляемыми политиками версионирования и жизненного цикла.',
        '33.4. Бэкапы: периодические резервные копии, проверка восстановления, разделение прав доступа, шифрование на хранении.',
        '33.5. Интеграции авторизации: провайдеры идентичности (Google, Apple, Twitter/X, Discord, Telegram) предоставляют нам токены/подтверждения; мы не храним их пароли и не управляем их внутренними базами данных.',
        '33.6. География: данные могут обрабатываться в много-региональной инфраструктуре для отказоустойчивости и производительности, с применением законных механизмов международной передачи.'
      ]
    },

    {
      title: '34. Срок действия и версии Политики',
      paras: [
        '34.1. Политика вступает в силу с даты «Обновлено», указанной выше.',
        '34.2. Мы можем хранить предыдущие редакции для архивных целей и прозрачности изменений.'
      ]
    },

    {
      title: 'Приложение A: Глоссарий',
      paras: [
        'A.1. Контролёр — лицо/организация, определяющие цели и средства обработки персональных данных.',
        'A.2. Процессор — лицо/организация, обрабатывающие данные по поручению контролёра.',
        'A.3. Персональные данные — любая информация об идентифицированном или идентифицируемом лице.',
        'A.4. Международная передача — передача персональных данных за пределы страны/региона их первоначального сбора.'
      ]
    },

    {
      title: 'Приложение B: Категории субпроцессоров',
      paras: [
        'B.1. Хостинг/вычисления и контейнерная оркестрация.',
        'B.2. CDN и пограничная доставка контента.',
        'B.3. Базы данных (SQL/NoSQL) и Redis-кэши.',
        'B.4. Объектные хранилища и системы бэкапов.',
        'B.5. Мониторинг/логирование/трассировка/трекинг ошибок.',
        'B.6. Платёжные операторы и шлюзы ончейн-подтверждений.',
        'B.7. Провайдеры сообщений (email/Telegram) и сервисы очередей.',
        'B.8. Индексация блокчейн-данных/рыночных лент и аналитические платформы.'
      ]
    }
  ]
};


/* -------------------- ZH (简体) -------------------- */
const PRIVACY_ZH = {
  nav_privacy: '隐私',
  privacy_title: '隐私政策',
  privacy_updated_label: '更新：',
  privacy_updated: '2025-10-30',
  privacy_empty: '无数据',
  privacy_sections: [
    {
      title: '1. 概述',
      paras: [
        '1.1. 本《Quantum L7 AI 隐私政策》（下称“政策”）描述我们收集哪些数据、基于何种法律依据处理这些数据、在何处以及如何存储、如何保护并在以下生态系统范围内进行传输：网站、Web-MiniApp、Telegram Mini App、Telegram 机器人、API、论坛、分析服务以及交易界面（包括正在开发的交易所）。',
        '1.2. 使用 Quantum L7 AI 的服务（“服务”）即表示您确认已阅读并接受本政策的条款。本政策旨在对用户进行透明告知，并非个别法律意见，且不取代特定供应商的合同/要约/政策。',
        '1.3. 对于我们收集并决定其处理目的/方式的个人数据，我们作为数据控制者；对于我们受客户/合作伙伴委托而处理的数据，我们作为数据处理者。',
        '1.4. “个人数据”、“处理”、“控制者”、“处理者”、“数据主体”、“跨境传输”等术语，按照全球监管框架（GDPR/UK GDPR、CCPA/CPRA 等）的通行含义使用。',
        '1.5. 我们的服务与链上来源及市场数据源交互：公共区块链数据本质上是开放的，并非我们的“个人数据”；但与您的账户进行关联后，可能构成个人数据。'
      ]
    },

    {
      title: '2. 我们收集什么',
      paras: [
        '2.1. 账户与身份数据：Telegram ID/用户名/显示名（通过 Telegram Mini App 或机器人登录时）、内部 Account ID、订阅状态标记（VIP/Free）、界面语言。',
        '2.2. 联系方式：电子邮件（如您提供）、论坛昵称、在绑定时的外部账户引用标识（Google、Apple、Twitter/X、Discord 等）。',
        '2.3. 认证与关联：通过多提供方生态系统登录的事实与路径（OAuth/OIDC、Telegram WebApp initData、用 Apple/Google/Twitter/X/Discord 登录、钱包签名、魔法链接），技术令牌/时间戳/签名（不存储私钥与助记词）。',
        '2.4. 钱包与网络：公开地址、使用的网络（L1/L2）、与通过 NowPayments 支付订阅及链上确认相关的交易元数据。',
        '2.5. 使用数据：访问的页面/界面、界面中的操作、时间戳、哈希化 IP、user-agent、客户端性能参数、错误遥测。',
        '2.6. 论坛与内容：帖子、主题、上传元数据（图片/视频/音频）、系统评分产物（质量/参与度/反垃圾/反女巫）、用于 QCoin 挖矿的活跃度统计。',
        '2.7. 支付与计费：发票状态、付款确认（通过集成的支付提供方）、金额/货币/时间戳、路由技术日志。',
        '2.8. 链上与市场数据：我们出于分析目的及提供服务功能，会索引并聚合公共链/交易所行情/订单簿/历史 K 线等数据。'
      ]
    },

    {
      title: '3. 链上与公共数据',
      paras: [
        '3.1. 公共区块链记录对任何网络参与者开放；为分析、指标与推荐而进行的处理属于对公开信息的允许使用范围之内。',
        '3.2. 当您自愿绑定钱包/支付/订阅时，可能将链上活动与您的账号进行关联，此时会生成个性化的使用画像。',
        '3.3. 向公共节点/RPC/索引服务与市场聚合器发起的请求可为可靠性、安全、滥用防护与服务质量改进之目的而记录日志。'
      ]
    },

    {
      title: '4. Cookie、localStorage 及其他客户端工件',
      paras: [
        '4.1. 我们仅采用最低限度必要的机制：语言保存、安全会话标记、反滥用参数、用户体验设置。',
        '4.2. 若阻止 cookie/localStorage，部分功能可能不可用或降级（如会话、个性化限额、语言）。',
        '4.3. 法律要求的场景下，我们会就非关键性 cookie/分析征求同意。'
      ]
    },

    {
      title: '5. 我们如何使用数据',
      paras: [
        '5.1. 提供功能：账户授权/绑定、订阅状态同步、访问论坛、MiniApp、机器人、分析面板与推荐。',
        '5.2. 产品改进：汇总的使用分析、A/B 评估、性能遥测、故障排除、提升 AI 模型准确度。',
        '5.3. 安全与完整性：滥用防护（限流、反垃圾、反女巫）、异常控制、运维操作审计、事件调查。',
        '5.4. 计费与合规：处理支付状态、确认信息、访问权限核算，遵守财务报告与反非法活动相关法律。',
        '5.5. 通讯与支持：回复请求、状态通知（如 VIP 成功激活）、服务消息。',
        '5.6. 我们不进行营销画像；仅在具有合法依据（如同意）时发送通信。'
      ]
    },

    {
      title: '6. 向第三方的传输与披露',
      paras: [
        '6.1. 我们不出售个人数据。',
        '6.2. 数据可由我们的分处理方按我们的指示并仅为本政策所述之目的进行处理：计算平台/主机托管、CDN、对象存储、队列与缓存、监控/日志/错误追踪、支付网关、消息提供方（电子邮件/Telegram）、分析平台。',
        '6.3. 在符合法律、具备主管机关合法请求、以及为保护用户与服务之权利/安全的情况下，可能进行披露。',
        '6.4. 如发生公司控制权变更（合并/资产出售），可在确保等效保护并在法律要求时进行通知的前提下，将数据转移给继任方。'
      ]
    },

    {
      title: '7. 安全',
      paras: [
        '7.1. 原则：从设计即安全（security by design）、最小权限（PoLP）、职责分离、对关键操作的强制日志记录。',
        '7.2. 加密：传输中使用 TLS；对敏感工件进行静态加密；密钥管理实施访问控制。',
        '7.3. 访问：管理控制台采用多因素认证，基于角色的访问控制，环境分段（prod/stage/dev）。',
        '7.4. 变更控制：代码评审、签名构建、渐进式发布、回滚、阻断不安全配置。',
        '7.5. 测试与监控：入侵检测、告警、定期审查配置与权限。',
        '7.6. 钱包密钥与助记词：我们不请求也不存储。签名在用户侧或受信钱包侧完成。'
      ]
    },

    {
      title: '8. 跨境传输',
      paras: [
        '8.1. 处理与存储可能在多区域基础设施内进行，并采用地理副本与负载均衡。',
        '8.2. 进行跨境传输时使用合法机制（包括如适用的标准合同条款）及等效的保护措施。',
        '8.3. 用户同意在提供服务范围内进行数据的国际传输。'
      ]
    },

    {
      title: '9. 您的权利',
      paras: [
        '9.1. EEA/英国（GDPR）：访问、更正、删除、限制/反对、可携带权，以及向监管机构投诉的权利。',
        '9.2. 美国（含加州/CPRA）：知情、更正、删除、选择退出出售/共享，以及就行使权利不受歧视的权利。',
        '9.3. 权利行使：见“如何行使权利”一节。需进行身份核验。'
      ]
    },

    {
      title: '10. 儿童',
      paras: [
        '10.1. 本服务不面向 13 岁以下儿童（或依据您所属法域规定的更高年龄）。',
        '10.2. 若您认为儿童向我们提供了数据，请与我们联系以删除。'
      ]
    },

    {
      title: '11. 变更',
      paras: [
        '11.1. 我们可能为反映技术、法律与产品的变化而更新本政策。',
        '11.2. 发生重大变更时，将更新“更新”日期，并在必要时于界面中显示通知。'
      ]
    },

    {
      title: '12. 联系方式',
      paras: [
        '12.1. 隐私请求邮箱：quantuml7ai@gmail.com',
        '12.2. 反馈渠道（机器人）：https://t.me/L7ai_feedback'
      ]
    },

    {
      title: '13. 定义与适用范围',
      paras: [
        '13.1. “服务”——网站、Web-MiniApp、Telegram Mini App、Telegram 机器人、论坛、API、分析、支付集成与交易界面。',
        '13.2. “我们”——Quantum L7 AI。本政策涵盖我们作为控制者所涉及的数据。第三方服务（认证提供方、区块链、钱包、支付网关）遵循其各自规则。',
        '13.3. 政策客体——用户数据及服务运行所必需的运营数据。'
      ]
    },

    {
      title: '14. 处理的法律依据（GDPR/UK GDPR）',
      paras: [
        '14.1. 合同/提供服务所必需：授权、功能访问、计费与支持。',
        '14.2. 合法利益：安全、滥用防护、对隐私风险较低的运营分析。',
        '14.3. 同意：如适用的可选指标/营销通信。可随时撤回同意。',
        '14.4. 法定义务：在法律要求时进行保存与披露（如会计记录）。'
      ]
    },

    {
      title: '15. 数据存储（留存）',
      paras: [
        '15.1. 我们保留个人数据的时间不超过处理目的所需或法律要求的期限。',
        '15.2. 参考：业务日志 30–180 天；性能遥测最长 90 天；支持往来最长 12 个月；计费记录——依法律留存期限保存。',
        '15.3. 为研究与统计目的，匿名化汇总数据可保留更久。'
      ]
    },

    {
      title: '16. 分处理者与基础设施',
      paras: [
        '16.1. 分处理者类别：计算平台与托管、CDN、对象存储、SQL/NoSQL 数据库、缓存与消息队列、监控/日志/追踪、电子邮件/消息发送、支付处理方、链上/市场数据索引提供方。',
        '16.2. 我们与每个分处理者签有数据处理协议（DPA），并落实技术/组织的安全措施。',
        '16.3. 类别清单会在本政策中保持更新；在符合安全要求的前提下，可按请求提供当前的详细清单。'
      ]
    },

    {
      title: '17. 分析与指标',
      paras: [
        '17.1. 我们可在必要范围内收集汇总使用指标（界面覆盖度、性能、功能采纳）以改进产品。',
        '17.2. 分析设置旨在排除敏感数据并最小化个人标识符。',
        '17.3. 在需要时，对非必要指标适用同意机制。'
      ]
    },

    {
      title: '18. 日志与遥测',
      paras: [
        '18.1. 运营日志可能包含时间戳、哈希化 IP、user-agent、错误追踪、请求/关联 ID、响应代码。',
        '18.2. 日志实施轮换与访问限制，用于调试、容量规划、DDoS/机器人流量防护与审计。',
        '18.3. 日志采集点遵循最小化原则进行设计。'
      ]
    },

    {
      title: '19. 邮件、通知与通信',
      paras: [
        '19.1. 发送至我们地址/机器人的消息，会为支持、合同履行与服务质量核算之目的而处理。',
        '19.2. 您可退订非服务类邮件；服务通知（如订阅状态）为运行所必需。'
      ]
    },

    {
      title: '20. Webhooks 与 API',
      paras: [
        '20.1. 使用 Webhook/API 时，负载可能会被临时缓冲以确保可靠投递、去重与重放防护。',
        '20.2. 请勿通过 Webhook/API 传输机密、私钥或其他不面向第三方的材料；请使用签名、令牌轮换与来源限制。'
      ]
    },

    {
      title: '21. 钱包绑定与支付',
      paras: [
        '21.1. 我们保存用于身份识别与计费所需的公开地址与网络参数。不收集也不存储私钥/助记词。',
        '21.2. 支付处理由集成的提供方执行；我们接收用于激活 VIP 订阅所必需的发票与确认的状态/标识。',
        '21.3. 链上支付确认属于公共信息；我们仅为访问目的将其与您的账户进行匹配。'
      ]
    },

    {
      title: '22. 执行限制与风险框架',
      paras: [
        '22.1. 在交易/分析模式下适用技术限制（限流、合理性检查）与风险规则。这些为工程机制，并不构成结果保证。',
        '22.2. 用户对交易决策、合规与风险管理自行负责。'
      ]
    },

    {
      title: '23. 研究、模型与人工智能',
      paras: [
        '23.1. 在适当且合法的情况下，我们可基于汇总/假名化的数据集训练/验证模型。',
        '23.2. 使用第三方模型时，我们遵守个人数据传输的合同与技术限制，并贯彻最小化。'
      ]
    },

    {
      title: '24. 自动化决策',
      paras: [
        '24.1. 我们不作出对用户具有法律意义且完全由自动化产生的决定。',
        '24.2. 推荐与评估为辅助性信号，用于支持决策。最终选择权在用户。'
      ]
    },

    {
      title: '25. 假名化、聚合与最小化',
      paras: [
        '25.1. 在可能的情况下，我们对标识符进行假名化并对指标进行汇总，将密钥与有效数据相分离。',
        '25.2. 对“密钥—数据”关联的访问受角色与必要性限制。'
      ]
    },

    {
      title: '26. 可携带性与导出',
      paras: [
        '26.1. 您可请求导出与您的账户/机器人标识关联的个人数据。',
        '26.2. 在不存在法律限制且通过验证后，我们将以机器可读格式提供数据。'
      ]
    },

    {
      title: '27. 数据主体权利的实现',
      paras: [
        '27.1. 请通过电子邮件 quantuml7ai@gmail.com 或反馈机器人提交请求。',
        '27.2. 为进行身份验证，我们可能会要求您通过已绑定的 Telegram/机器人账户发送消息，或确认对关联账户/钱包的所有权。',
        '27.3. 我们将在适用法律规定的时限内答复；出于安全/法律要求，部分请求可能受到限制。'
      ]
    },

    {
      title: '28. 事件与泄露通知',
      paras: [
        '28.1. 我们设有响应程序：事件分类、影响控制、原因调查、服务恢复。',
        '28.2. 在法律要求的情况下，我们会通知受影响的用户与监管机构，并提供有关事件性质与所采取措施的相关信息。'
      ]
    },

    {
      title: '29. 司法辖区说明',
      paras: [
        '29.1. EEA/英国：在数据主体权利、处理的合法性与跨境传输方面适用 GDPR/UK GDPR 规范。',
        '29.2. 美国：适用相关州法（包括 CPRA）。在支持技术性选择退出信号的情况下，我们将尽力予以尊重。',
        '29.3. 其他地区：在强制性存储、通知与保护要求方面适用当地规范。'
      ]
    },

    {
      title: '30. Do Not Track（DNT）与 Global Privacy Control（GPC）',
      paras: [
        '30.1. 若您的浏览器发送 DNT/GPC 信号，我们将在技术可行且法律要求的范围内予以考虑。'
      ]
    },

    {
      title: '31. 退出选项与隐私设置',
      paras: [
        '31.1. 您可以禁用非必要的 cookies/分析、退订非服务类邮件，并限制机器人的权限。',
        '31.2. 核心安全/功能机制可能需要最低限度处理，且无法禁用。'
      ]
    },

    {
      title: '32. 可及性、语言与解释',
      paras: [
        '32.1. 我们提供多语言文本。若版本不一致，出于法律解释之目的，英文版本可能具有优先效力。',
        '32.2. 各语言译文力求保持法律等效性。'
      ]
    },

    {
      title: '33. 存储与数据位置',
      paras: [
        '33.1. 运营数据库：在多可用区架构中部署的关系型与/或文档型数据库管理系统，具备冗余与复制能力。',
        '33.2. 缓存与队列：用于加速会话、反滥用逻辑与临时工件的 Redis 集群/流/队列。',
        '33.3. 对象存储：存放用户上传的媒体与备份，配有受管的版本及生命周期策略。',
        '33.4. 备份：定期备份、恢复校验、访问权限分离、静态加密。',
        '33.5. 认证集成：身份提供方（Google、Apple、Twitter/X、Discord、Telegram）向我们提供令牌/确认；我们不存储其密码，也不管理其内部数据库。',
        '33.6. 地理位置：为容错与性能，数据可在多区域基础设施中处理，并使用合法的国际传输机制。'
      ]
    },

    {
      title: '34. 政策效力与版本',
      paras: [
        '34.1. 本政策自上述“更新”日期起生效。',
        '34.2. 我们可能为存档与变更透明之目的保留先前版本。'
      ]
    },

    {
      title: '附录 A：术语表',
      paras: [
        'A.1. 控制者——决定个人数据处理目的与方式的个人/组织。',
        'A.2. 处理者——代表控制者处理数据的个人/组织。',
        'A.3. 个人数据——关于已识别或可识别个体的任何信息。',
        'A.4. 跨境传输——将个人数据传输出其最初收集的国家/地区之外。'
      ]
    },

    {
      title: '附录 B：分处理者类别',
      paras: [
        'B.1. 主机托管/计算与容器编排。',
        'B.2. CDN 与边缘内容分发。',
        'B.3. 数据库（SQL/NoSQL）与 Redis 缓存。',
        'B.4. 对象存储与备份系统。',
        'B.5. 监控/日志/追踪/错误跟踪。',
        'B.6. 支付处理方与链上确认网关。',
        'B.7. 消息提供方（电子邮件/Telegram）与队列服务。',
        'B.8. 区块链数据/市场行情索引与分析平台。'
      ]
    }
  ]
};

/* -------------------- UK -------------------- */
const PRIVACY_UK = {
  nav_privacy: 'Конфіденційність',
  privacy_title: 'Політика конфіденційності',
  privacy_updated_label: 'Оновлено:',
  privacy_updated: '2025-10-30',
  privacy_empty: 'Немає даних',
  privacy_sections: [
    {
      title: '1. Огляд',
      paras: [
        '1.1. Ця Політика конфіденційності Quantum L7 AI (далі — «Політика») описує, які дані ми збираємо, на яких правових підставах обробляємо, де й як зберігаємо, як захищаємо та передаємо в межах екосистеми: вебсайт, Web-MiniApp, Telegram Mini App, Telegram-бот(и), API, Форум, аналітичні сервіси та торгові інтерфейси (вкл. Біржу, що розробляється).',
        '1.2. Користуючись сервісами Quantum L7 AI («Сервіс»), ви підтверджуєте, що ознайомилися з Політикою і приймаєте її умови. Політика призначена для прозорого інформування користувачів, не є індивідуальною юридичною консультацією і не замінює договори/оферти/політики конкретних вендорів.',
        '1.3. Ми діємо як контролер даних щодо персональних даних, які збираємо і визначаємо цілі/засоби їх обробки, та як процесор там, де обробляємо дані за дорученням клієнтів/партнерів.',
        '1.4. Терміни «персональні дані», «обробка», «контролер», «процесор», «суб’єкт даних», «міжнародна передача» використовуються у значеннях, прийнятих глобальними регуляторними рамками (GDPR/UK GDPR, CCPA/CPRA тощо).',
        '1.5. Наші сервіси взаємодіють з ончейн-джерелами та ринковими стрічками: публічні блокчейн-дані за своєю природою відкриті і не є нашими «персональними даними», втім співставлення з вашим акаунтом може утворювати персональні дані.'
      ]
    },

    {
      title: '2. Що ми збираємо',
      paras: [
        '2.1. Облікові та ідентифікаційні дані: Telegram ID/username/відображуване ім’я (при вході через Telegram Mini App або бота), внутрішній Account ID, мітки статусу підписки (VIP/Free), мова інтерфейсу.',
        '2.2. Контактні дані: email (якщо надаєте), нік на Форумі, референтні ідентифікатори зовнішніх акаунтів (Google, Apple, Twitter/X, Discord тощо) при зв’язуванні.',
        '2.3. Авторизація і зв’язки: факт і маршрут входу через мульти-провайдерну екосистему (OAuth/OIDC, Telegram WebApp initData, Sign in with Apple/Google/Twitter/X/Discord, wallet-signature, magic-link), технічні токени/штампи/підписи (без зберігання приватних ключів і seed-фраз).',
        '2.4. Гаманці та мережі: публічні адреси, використовувані мережі (L1/L2), транзакційні метадані, пов’язані з оплатою підписки через NowPayments та ончейн-підтвердження.',
        '2.5. Дані використання: відвідані сторінки/екрани, дії в інтерфейсі, часові мітки, хешований IP, user-agent, параметри продуктивності клієнта, телеметрія помилок.',
        '2.6. Форум і контент: пости, теми, метадані завантажень (зображення/відео/аудіо), системні артефакти скорингу (оцінки якості/залученості/anti-spam/anti-sybil), статистика активності для майнінгу QCoin.',
        '2.7. Оплати і білінг: статуси інвойсів, підтвердження платежів (через інтегрованого платіжного провайдера), суми/валюти/часові мітки, технічні журнали маршрутизації.',
        '2.8. Ончейн і маркет-дані: ми індексуємо та агрегуємо публічні ланцюги/біржові стрічки/книги ордерів/історичні свічки в аналітичних цілях і для надання функцій Сервісу.'
      ]
    },

    {
      title: '3. Ончейн і публічні дані',
      paras: [
        '3.1. Публічні записи блокчейна доступні будь-якому учаснику мережі; їх обробка для аналітики, індикаторів і рекомендацій здійснюється в межах допустимого використання загальнодоступної інформації.',
        '3.2. Співставлення ончейн-активності з вашим акаунтом можливе за добровільного прив’язування гаманця/платежів/підписок. У такому разі створюється персональний профіль використання.',
        '3.3. Запити до публічних нод/провайдерів RPC/індексації та маркет-агрегаторів можуть логуватися для надійності, безпеки, захисту від зловживань і покращення якості сервісу.'
      ]
    },

    {
      title: '4. Cookie, localStorage та інші клієнтські артефакти',
      paras: [
        '4.1. Ми застосовуємо мінімально необхідні механізми: збереження мови, безпечні маркери сесії, параметри анти-abuse, UX-налаштування.',
        '4.2. При блокуванні cookie/localStorage частина функцій може стати недоступною або деградувати (наприклад, сесії, персональні ліміти, мова).',
        '4.3. Де це вимагається законом, ми запитуємо згоду на некритичні cookie/аналітику.'
      ]
    },

    {
      title: '5. Як ми використовуємо дані',
      paras: [
        '5.1. Надання функціоналу: авторизація/зв’язування акаунтів, синхронізація статусів підписки, доступ до Форуму, MiniApp, бота, аналітичних панелей і рекомендацій.',
        '5.2. Поліпшення продукту: агрегована аналітика використання, A/B-оцінки, телеметрія продуктивності, усунення збоїв, підвищення точності AI-моделей.',
        '5.3. Безпека і цілісність: захист від зловживань (rate-limit, anti-spam, anti-sybil), контроль аномалій, аудит службових дій, розслідування інцидентів.',
        '5.4. Білінг і відповідність: обробка статусів платежів, підтверджень, облік прав доступу, дотримання законів щодо фінансової звітності та протидії незаконній діяльності.',
        '5.5. Комунікації і підтримка: відповіді на запити, сповіщення про статуси (наприклад, успішна активація VIP), сервісні повідомлення.',
        '5.6. Маркетингового профілювання не ведемо; розсилки здійснюються лише за наявності законної підстави (наприклад, згоди).'
      ]
    },

    {
      title: '6. Передача і розкриття третім особам',
      paras: [
        '6.1. Ми не продаємо персональні дані.',
        '6.2. Дані можуть оброблятися нашими субпроцесорами за нашими інструкціями і лише з цілями, описаними Політикою: обчислювальні платформи/хостинг, CDN, об’єктне сховище, черги і кеші, моніторинг/логування/трекінг помилок, платіжні шлюзи, провайдери повідомлень (email/Telegram), аналітичні платформи.',
        '6.3. Розкриття можливе при дотриманні закону, законних запитах компетентних органів, захисті прав/безпеки користувачів і Сервісу.',
        '6.4. При зміні корпоративного контролю (злиття/продаж активів) дані можуть бути передані правонаступнику за умови збереження еквівалентного захисту і повідомлення, якщо це вимагається законом.'
      ]
    },

    {
      title: '7. Безпека',
      paras: [
        '7.1. Принципи: безпека за проєктом (security by design), мінімум привілеїв (PoLP), розподіл обов’язків, обов’язкове журналювання критичних операцій.',
        '7.2. Шифрування: TLS під час передавання; шифрування на рівні зберігання для чутливих артефактів; керування ключами з контролем доступу.',
        '7.3. Доступ: багатофакторна автентифікація для адмінських консолей, ролева сегрегація доступу, сегментація середовищ (prod/stage/dev).',
        '7.4. Контроль змін: рецензування коду, підписані збірки, поступові викладки, відкати, блокування небезпечних конфігурацій.',
        '7.5. Тестування і моніторинг: виявлення вторгнень, алерти, періодичні ревізії конфігурацій і дозволів.',
        '7.6. Ключі гаманців і seed-фрази: ми їх не запитуємо і не зберігаємо. Підписання виконується на стороні користувача або довіреного гаманця.'
      ]
    },

    {
      title: '8. Міжнародні передачі',
      paras: [
        '8.1. Обробка і зберігання можуть здійснюватися у багаторегіональній інфраструктурі з геореплікацією і балансуванням.',
        '8.2. При транскордонних передачах використовуються законні механізми (в т.ч. стандартні договірні положення, якщо застосовно) і еквівалентні заходи захисту.',
        '8.3. Користувач погоджується на міжнародну передачу даних у межах надання Сервісу.'
      ]
    },

    {
      title: '9. Ваші права',
      paras: [
        '9.1. ЄЕЗ/UK (GDPR): право на доступ, виправлення, видалення, обмеження/заперечення, переносимість, а також право подати скаргу до наглядового органу.',
        '9.2. США (включно з Каліфорнією/CPRA): право знати, виправляти, видаляти, відмовитися від продажу/обміну, право на відсутність дискримінації за реалізацію прав.',
        '9.3. Реалізація прав: див. розділ «Як реалізувати права». Ідентифікаційна перевірка обов’язкова.'
      ]
    },

    {
      title: '10. Діти',
      paras: [
        '10.1. Сервіс не призначений для дітей молодше 13 років (або вищого віку згідно із правом вашої юрисдикції).',
        '10.2. Якщо ви вважаєте, що дитина надала нам дані, зв’яжіться з нами для видалення.'
      ]
    },

    {
      title: '11. Зміни',
      paras: [
        '11.1. Ми можемо оновлювати Політику для відображення змін у технологіях, праві та продуктах.',
        '11.2. При суттєвих змінах оновлюється дата «Оновлено» і, за необхідності, відображається сповіщення в інтерфейсі.'
      ]
    },

    {
      title: '12. Контакти',
      paras: [
        '12.1. Email для запитів з приватності: quantuml7ai@gmail.com',
        '12.2. Канал зворотного зв’язку (бот): https://t.me/L7ai_feedback'
      ]
    },

    {
      title: '13. Визначення та сфера дії',
      paras: [
        '13.1. «Сервіс» — сайти, Web-MiniApp, Telegram Mini App, Telegram-боти, Форум, API, аналітика, інтеграції платежів і біржові інтерфейси.',
        '13.2. «Ми» — Quantum L7 AI. Політика охоплює дані, де ми виступаємо контролером. Сторонні сервіси (провайдери авторизації, блокчейни, гаманці, платіжні шлюзи) діють за власними правилами.',
        '13.3. Об’єкт Політики — дані користувачів та операційні дані, необхідні для функціонування Сервісу.'
      ]
    },

    {
      title: '14. Правові підстави обробки (GDPR/UK GDPR)',
      paras: [
        '14.1. Договір/необхідність для надання послуги: авторизація, доступ до функціоналу, білінг і підтримка.',
        '14.2. Законний інтерес: безпека, запобігання зловживанням, операційна аналітика з низьким ризиком для приватності.',
        '14.3. Згода: опціональні метрики/маркетингові комунікації, якщо застосовно. Згоду можна відкликати.',
        '14.4. Юридичний обов’язок: зберігання і розкриття там, де цього вимагає закон (наприклад, бухгалтерські записи).'
      ]
    },

    {
      title: '15. Зберігання даних (ретенція)',
      paras: [
        '15.1. Ми зберігаємо персональні дані не довше, ніж потрібно для цілей обробки або вимог закону.',
        '15.2. Орієнтири: службові журнали 30–180 днів; телеметрія продуктивності до 90 днів; листування підтримки до 12 місяців; білінгові записи — згідно з правовими строками зберігання.',
        '15.3. Анонімізовані агрегати можуть зберігатися довше для дослідницьких і статистичних цілей.'
      ]
    },

    {
      title: '16. Субпроцесори і інфраструктура',
      paras: [
        '16.1. Категорії субпроцесорів: обчислювальні платформи і хостинг, CDN, об’єктні сховища, бази даних SQL/NoSQL, кеші та черги повідомлень, моніторинг/логування/трасування, розсилка email/повідомлень, платіжні оператори, провайдери індексування ончейн/ринкових стрічок.',
        '16.2. З кожним субпроцесором укладені угоди про захист даних (DPA) і застосовуються технічні/організаційні заходи безпеки.',
        '16.3. Оновлюваний перелік категорій доступний у Політиці; детальний актуальний список надається за запитом з урахуванням вимог безпеки.'
      ]
    },

    {
      title: '17. Аналітика і метрики',
      paras: [
        '17.1. Ми можемо збирати агреговані метрики використання (покриття інтерфейсів, продуктивність, прийняття функцій) у обсязі, необхідному для поліпшення продукту.',
        '17.2. Налаштування аналітики орієнтовані на виключення чутливих даних і мінімізацію персональних ідентифікаторів.',
        '17.3. Де потрібно, застосовується механізм згоди для неістотних метрик.'
      ]
    },

    {
      title: '18. Журнали і телеметрія',
      paras: [
        '18.1. Операційні журнали можуть включати часові мітки, хеш-IP, user-agent, трасування помилок, ID запитів/кореляції, коди відповідей.',
        '18.2. Журнали ротуються, обмежені за доступом і використовуються для налагодження, планування ємності, захисту від DDoS/бот-трафіку, аудиту.',
        '18.3. Точки логування спроєктовані з урахуванням принципу мінімізації.'
      ]
    },

    {
      title: '19. Пошта, сповіщення і комунікації',
      paras: [
        '19.1. Повідомлення, надіслані на наші адреси/боти, обробляються для підтримки, виконання договірних зобов’язань і обліку якості сервісу.',
        '19.2. Ви можете відмовитися від несервісних розсилок; сервісні сповіщення (наприклад, про статус підписки) є обов’язковими для функціонування.'
      ]
    },

    {
      title: '20. Webhooks і API',
      paras: [
        '20.1. При використанні Webhook/API корисні навантаження можуть тимчасово буферизуватися для надійної доставки, дедуплікації і захисту від повторів.',
        '20.2. Не передавайте через Webhook/API секрети, приватні ключі та інші матеріали, не призначені для сторонніх; використовуйте підписи, ротацію токенів і обмеження джерел.'
      ]
    },

    {
      title: '21. Прив’язка гаманців і платежі',
      paras: [
        '21.1. Ми зберігаємо публічні адреси і мережеві параметри, необхідні для функцій ідентифікації і білінгу. Приватні ключі/seed-фрази не збираються і не зберігаються.',
        '21.2. Платіжний процесинг виконується через інтегрованого провайдера; ми отримуємо статуси/ідентифікатори інвойсів і підтверджень, необхідні для активації підписки VIP.',
        '21.3. Ончейн-підтвердження платежів є публічною інформацією; ми співставляємо їх з вашим акаунтом виключно для цілей доступу.'
      ]
    },

    {
      title: '22. Обмежувачі виконання і контур ризику',
      paras: [
        '22.1. Для торгових/аналітичних режимів застосовуються технічні обмежувачі (rate-limit, sanity-checks) і правила ризику. Це інженерні механізми, а не гарантії результату.',
        '22.2. Відповідальність за торгові рішення, дотримання правових вимог і ризик-менеджмент несе користувач.'
      ]
    },

    {
      title: '23. Дослідження, моделі і ШІ',
      paras: [
        '23.1. Ми можемо навчати/валідувати моделі на агрегованих/псевдонімізованих наборах, де це доречно і законно.',
        '23.2. При використанні сторонніх моделей дотримуємося договірних і технічних обмежень передачі персональних даних і застосовуємо мінімізацію.'
      ]
    },

    {
      title: '24. Автоматизовані рішення',
      paras: [
        '24.1. Ми не приймаємо виключно автоматизовані рішення з юридично значущим ефектом щодо користувача.',
        '24.2. Рекомендації і оцінки — допоміжні сигнали для підтримки рішень. Остаточний вибір залишається за користувачем.'
      ]
    },

    {
      title: '25. Псевдонімізація, агрегація і мінімізація',
      paras: [
        '25.1. Де можливо, ми псевдонімізуємо ідентифікатори і агрегуємо метрики, розділяємо ключі та корисні дані.',
        '25.2. Доступ до зв’язки «ключ—дані» обмежується ролями і необхідністю.'
      ]
    },

    {
      title: '26. Портативність і експорт',
      paras: [
        '26.1. Ви можете запросити експорт персональних даних, пов’язаних з вашим акаунтом/бот-ідентифікатором.',
        '26.2. Ми надамо дані у машиночитному форматі, за відсутності правових обмежень, і після верифікації.'
      ]
    },

    {
      title: '27. Реалізація прав суб’єктів даних',
      paras: [
        '27.1. Надішліть запит на email quantuml7ai@gmail.com або через бота зворотного зв’язку.',
        '27.2. Для верифікації особи можемо попросити надіслати повідомлення з прив’язаного Telegram/бот-акаунта або підтвердити володіння пов’язаним обліковим записом/гаманцем.',
        '27.3. Відповідь надається у строки, встановлені застосовним правом; деякі запити можуть бути обмежені вимогами безпеки/законодавства.'
      ]
    },

    {
      title: '28. Інциденти і повідомлення про порушення',
      paras: [
        '28.1. Діють процедури реагування: класифікація інциденту, обмеження впливу, розслідування причин, відновлення сервісності.',
        '28.2. У випадках, що вимагаються законом, повідомляються залучені користувачі і регулятори, надається релевантна інформація про характер інциденту і вжиті заходи.'
      ]
    },

    {
      title: '29. Юрисдикційні примітки',
      paras: [
        '29.1. ЄЕЗ/UK: застосовуються норми GDPR/UK GDPR у частині прав суб’єктів даних, законності обробки, міжнародних передач.',
        '29.2. США: застосовуються відповідні закони штатів (включно з CPRA). За наявності підтримуваних технічних сигналів opt-out ми прагнемо їх враховувати.',
        '29.3. Інші регіони: застосовуються локальні норми у частині обов’язкових вимог до зберігання, повідомлення і захисту.'
      ]
    },

    {
      title: '30. Do Not Track (DNT) та Global Privacy Control (GPC)',
      paras: [
        '30.1. Якщо ваш браузер надсилає DNT/GPC, ми враховуємо ці сигнали тією мірою, якою це підтримується технічно і вимагається правом.'
      ]
    },

    {
      title: '31. Опції відмови і налаштування приватності',
      paras: [
        '31.1. Ви можете вимкнути неістотні cookies/аналітику, відписатися від несервісних листів, обмежити права бота.',
        '31.2. Базові механізми безпеки/функціональності можуть вимагати мінімальної обробки і не можуть бути вимкнені.'
      ]
    },

    {
      title: '32. Доступність, мови і тлумачення',
      paras: [
        '32.1. Ми надаємо тексти кількома мовами. У разі невідповідності версій пріоритет може мати англійська версія для цілей юридичного тлумачення.',
        '32.2. Переклади спрямовані на збереження юридичної еквівалентності.'
      ]
    },

    {
      title: '33. Сховища і розташування даних',
      paras: [
        '33.1. Операційні бази даних: реляційні та/або документно-орієнтовані СУБД, розгорнуті в багатозонній архітектурі з резервуванням і реплікацією.',
        '33.2. Кеші і черги: Redis-кластери/стрими/черги для прискорення сесій, анти-abuse логіки та тимчасових артефактів.',
        '33.3. Об’єктне сховище: зберігання завантажених користувачами медіа і резервних копій з керованими політиками версіонування та життєвого циклу.',
        '33.4. Бекапи: періодичні резервні копії, перевірка відновлення, розмежування прав доступу, шифрування при зберіганні.',
        '33.5. Інтеграції авторизації: провайдери ідентичності (Google, Apple, Twitter/X, Discord, Telegram) надають нам токени/підтвердження; ми не зберігаємо їх паролі і не керуємо їх внутрішніми базами даних.',
        '33.6. Географія: дані можуть оброблятися у багаторегіональній інфраструктурі для відмовостійкості та продуктивності, із застосуванням законних механізмів міжнародної передачі.'
      ]
    },

    {
      title: '34. Строк дії і версії Політики',
      paras: [
        '34.1. Політика набирає чинності з дати «Оновлено», зазначеної вище.',
        '34.2. Ми можемо зберігати попередні редакції для архівних цілей і прозорості змін.'
      ]
    },

    {
      title: 'Додаток A: Глосарій',
      paras: [
        'A.1. Контролер — особа/організація, що визначає цілі і засоби обробки персональних даних.',
        'A.2. Процесор — особа/організація, що обробляє дані за дорученням контролера.',
        'A.3. Персональні дані — будь-яка інформація про ідентифіковану або ідентифіковану особу.',
        'A.4. Міжнародна передача — передача персональних даних за межі країни/регіону їх початкового збирання.'
      ]
    },

    {
      title: 'Додаток B: Категорії субпроцесорів',
      paras: [
        'B.1. Хостинг/обчислення і контейнерна оркестрація.',
        'B.2. CDN і прикордонна доставка контенту.',
        'B.3. Бази даних (SQL/NoSQL) і Redis-кеші.',
        'B.4. Об’єктні сховища і системи бекапів.',
        'B.5. Моніторинг/логування/трасування/трекинг помилок.',
        'B.6. Платіжні оператори і шлюзи ончейн-підтверджень.',
        'B.7. Провайдери повідомлень (email/Telegram) і сервіси черг.',
        'B.8. Індексація блокчейн-даних/ринкових стрічок і аналітичні платформи.'
      ]
    }
  ]
};


/* -------------------- AR (العربية) -------------------- */
const PRIVACY_AR = {
  nav_privacy: 'الخصوصية',
  privacy_title: 'سياسة الخصوصية',
  privacy_updated_label: 'تم التحديث:',
  privacy_updated: '2025-10-30',
  privacy_empty: 'لا توجد بيانات',
  privacy_sections: [
    {
      title: '1. نظرة عامة',
      paras: [
        '1.1. توضح سياسة الخصوصية الخاصة بـ Quantum L7 AI (ويُشار إليها فيما بعد بـ «السياسة») البيانات التي نجمعها، والأسس القانونية التي نعالجها بموجبها، وأين وكيف نخزّنها، وكيف نحميها وننقلها ضمن حدود المنظومة: الموقع الإلكتروني، Web-MiniApp، تطبيق Telegram Mini App، روبوت/روبوتات Telegram، واجهة برمجة التطبيقات (API)، المنتدى، خدمات التحليلات وواجهات التداول (بما في ذلك البورصة قيد التطوير).',
        '1.2. باستخدامك لخدمات Quantum L7 AI («الخدمة») فإنك تؤكد اطّلاعك على السياسة وقبولك لشروطها. تهدف السياسة إلى إبلاغ المستخدمين بشفافية، وليست استشارة قانونية فردية، ولا تُ替ل العقود/العروض/السياسات الخاصة بمورّدين محددين.',
        '1.3. نعمل بصفتنا متحكمًا بالبيانات فيما يتعلق بالبيانات الشخصية التي نجمعها ونحدد أغراض/وسائل معالجتها، وبصفتنا معالجًا حيث نعالج البيانات نيابةً عن العملاء/الشركاء.',
        '1.4. تُستخدم مصطلحات «البيانات الشخصية»، «المعالجة»، «المتحكم»، «المعالج»، «صاحب البيانات»، «النقل الدولي» وفق المعاني المعتمدة في الأطر التنظيمية العالمية (GDPR/UK GDPR، وCCPA/CPRA وغيرها).',
        '1.5. تتفاعل خدماتنا مع مصادر على السلسلة (On-chain) ومع خلاصات الأسواق: بيانات البلوك تشين العامة بطبيعتها مفتوحة وليست «بياناتنا الشخصية»، إلا أن مواءمتها مع حسابك قد تشكّل بيانات شخصية.'
      ]
    },

    {
      title: '2. ما الذي نجمعه',
      paras: [
        '2.1. بيانات الحساب والتعريف: معرف Telegram/اسم المستخدم/الاسم المعروض (عند تسجيل الدخول عبر Telegram Mini App أو الروبوت)، معرف الحساب الداخلي (Account ID)، وسوم حالة الاشتراك (VIP/Free)، لغة الواجهة.',
        '2.2. بيانات الاتصال: البريد الإلكتروني (إن قمت بتقديمه)، لقب المنتدى، معرّفات الإحالة للحسابات الخارجية (Google, Apple, Twitter/X, Discord وغيرها) عند الربط.',
        '2.3. التفويض والربط: واقعة ومسار الدخول عبر منظومة متعددة المزوّدين (OAuth/OIDC، وTelegram WebApp initData، وSign in with Apple/Google/Twitter/X/Discord، وتوقيع المحفظة wallet-signature، والرابط السحري magic-link)، والرموز/الأختام/التواقيع التقنية (دون تخزين المفاتيح الخاصة أو عبارات الاسترجاع seed).',
        '2.4. المحافظ والشبكات: العناوين العامة، والشبكات المستخدمة (L1/L2)، والبيانات الوصفية للمعاملات المرتبطة بدفع الاشتراك عبر NowPayments وتأكيدات السلسلة.',
        '2.5. بيانات الاستخدام: الصفحات/الشاشات التي تمت زيارتها، الأفعال داخل الواجهة، الطوابع الزمنية، عنوان IP المُجزّأ (hashed)، وكيل المستخدم (user-agent)، معلمات أداء العميل، قياسات التليمترية للأخطاء.',
        '2.6. المنتدى والمحتوى: المنشورات، المواضيع، بيانات وصفية للملفات المرفوعة (صور/فيديو/صوت)، مصنوعات نظام التقييم (الجودة/التفاعل/anti-spam/anti-sybil)، وإحصاءات النشاط لتعدين QCoin.',
        '2.7. المدفوعات والفوترة: حالات الفواتير، وتأكيدات المدفوعات (عبر مزوّد الدفع المدمج)، المبالغ/العملات/الطوابع الزمنية، والسجلات التقنية للتوجيه.',
        '2.8. بيانات السلسلة والأسواق: نقوم بفهرسة وتجميع سلاسل عامة/خلاصات البورصات/دفاتر الأوامر/الشموع التاريخية لأغراض تحليلية ولتقديم وظائف الخدمة.'
      ]
    },

    {
      title: '3. بيانات السلسلة والبيانات العامة',
      paras: [
        '3.1. سجلات البلوك تشين العامة متاحة لأي مشارك في الشبكة؛ ومعالجتها لأغراض التحليلات والمؤشرات والتوصيات تتم في إطار الاستخدام المسموح للمعلومات المتاحة للعامة.',
        '3.2. قد يكون مواءمة النشاط على السلسلة مع حسابك ممكنًا عند الربط الطوعي لمحفظتك/مدفوعاتك/اشتراكاتك. في هذه الحالة يُنشأ ملف استخدام شخصي.',
        '3.3. قد يتم تسجيل الطلبات إلى العُقد العامة/مزودي RPC/خدمات الفهرسة وإلى مُجمِّعات الأسواق لأغراض الاعتمادية والأمان ومنع إساءة الاستخدام وتحسين جودة الخدمة.'
      ]
    },

    {
      title: '4. ملفات تعريف الارتباط (Cookie) وlocalStorage وغيرها من عناصر العميل',
      paras: [
        '4.1. نطبق آليات بالحد الأدنى الضروري: حفظ اللغة، رموز جلسات آمنة، معلمات مكافحة الإساءة، إعدادات تجربة المستخدم.',
        '4.2. عند حظر ملفات Cookie/مساحة localStorage قد تصبح بعض الوظائف غير متاحة أو تتدهور (مثل الجلسات، الحدود الشخصية، اللغة).',
        '4.3. حيثما يقتضي القانون ذلك، نطلب الموافقة على ملفات تعريف الارتباط/التحليلات غير الأساسية.'
      ]
    },

    {
      title: '5. كيف نستخدم البيانات',
      paras: [
        '5.1. إتاحة الوظائف: التفويض/ربط الحسابات، مزامنة حالات الاشتراك، الوصول إلى المنتدى وMiniApp والروبوت ولوحات التحليلات والتوصيات.',
        '5.2. تحسين المنتج: تحليلات استخدام مجمّعة، تقييمات A/B، تليمترية الأداء، معالجة الأعطال، رفع دقة نماذج الذكاء الاصطناعي.',
        '5.3. الأمان والنزاهة: حماية من الإساءة (rate-limit وanti-spam وanti-sybil)، التحكم في الشذوذات، تدقيق الأفعال الخدمية، التحقيق في الحوادث.',
        '5.4. الفوترة والامتثال: معالجة حالات المدفوعات والتأكيدات، احتساب حقوق الوصول، الامتثال لقوانين التقارير المالية ومكافحة الأنشطة غير المشروعة.',
        '5.5. الاتصالات والدعم: الرد على الطلبات، إشعارات بالحالات (مثل تفعيل VIP بنجاح)، رسائل خدمية.',
        '5.6. لا نقوم بإجراء تنميط تسويقي؛ وتُرسل الرسائل فقط عند وجود أساس قانوني (مثل الموافقة).'
      ]
    },

    {
      title: '6. النقل والإفصاح لأطراف ثالثة',
      paras: [
        '6.1. لا نبيع البيانات الشخصية.',
        '6.2. قد تُعالج البيانات بواسطة معالِجينا الفرعيين وفق تعليماتنا وللغايات الموصوفة في السياسة فقط: منصات الحوسبة/الاستضافة، شبكات توصيل المحتوى (CDN)، التخزين الكائني (Object Storage)، الطوابير والذاكرات المؤقتة (Caches)، المراقبة/التسجيل/تتبع الأخطاء، بوابات الدفع، مزودو الرسائل (email/Telegram)، منصات التحليلات.',
        '6.3. قد يتم الإفصاح وفقًا للقانون، وللاستجابات المشروعة للجهات المختصة، ولحماية حقوق/سلامة المستخدمين والخدمة.',
        '6.4. عند تغيير السيطرة المؤسسية (اندماج/بيع الأصول) قد تُنقل البيانات إلى الخلف القانوني بشرط الحفاظ على حماية مكافئة والإخطار عند الاقتضاء قانونًا.'
      ]
    },

    {
      title: '7. الأمان',
      paras: [
        '7.1. مبادئ: الأمان حسب التصميم (security by design)، أقل قدر من الصلاحيات (PoLP)، فصل المهام، التسجيل الإلزامي للعمليات الحرجة.',
        '7.2. التشفير: TLS أثناء النقل؛ وتشفير على مستوى التخزين للمواد الحساسة؛ وإدارة مفاتيح مع ضوابط وصول.',
        '7.3. الوصول: مصادقة متعددة العوامل لوحدات تحكم الإدارة، وضبط قائم على الأدوار، وتقسيم البيئات (prod/stage/dev).',
        '7.4. التحكم في التغييرات: مراجعات للكود، نسخ مبنية وموقعة، نشر تدريجي، إمكانات الرجوع، وحظر التهيئات غير الآمنة.',
        '7.5. الاختبار والمراقبة: كشف التسلل، التنبيهات، مراجعات دورية للتهيئات والأذونات.',
        '7.6. مفاتيح المحافظ وعبارات الاسترجاع (seed): لا نطلبها ولا نخزنها. تُجرى عمليات التوقيع على جهة المستخدم أو المحفظة الموثوقة.'
      ]
    },

    {
      title: '8. عمليات النقل الدولية',
      paras: [
        '8.1. قد تتم المعالجة والتخزين ضمن بنية تحتية متعددة الأقاليم مع نسخ جغرافي (geo-replication) وموازنة أحمال.',
        '8.2. عند عمليات النقل عبر الحدود تُستخدم آليات قانونية (بما في ذلك الشروط التعاقدية القياسية عند الاقتضاء) وتُطبّق تدابير حماية مكافئة.',
        '8.3. يوافق المستخدم على النقل الدولي للبيانات في إطار تقديم الخدمة.'
      ]
    },

    {
      title: '9. حقوقك',
      paras: [
        '9.1. المنطقة الاقتصادية الأوروبية/المملكة المتحدة (GDPR): حق الوصول، التصحيح، المحو، التقييد/الاعتراض، قابلية النقل، وكذلك حق تقديم شكوى إلى سلطة رقابية.',
        '9.2. الولايات المتحدة (بما فيها كاليفورنيا/CPRA): حق المعرفة، التصحيح، المحو، إلغاء البيع/المشاركة، والحق في عدم التمييز عند ممارسة الحقوق.',
        '9.3. ممارسة الحقوق: انظر قسم «كيفية ممارسة الحقوق». التحقق من الهوية إلزامي.'
      ]
    },

    {
      title: '10. الأطفال',
      paras: [
        '10.1. الخدمة غير موجهة للأطفال دون 13 عامًا (أو سن أعلى وفق قانون سلطتكم القضائية).',
        '10.2. إذا اعتقدت أن طفلًا قد زوّدنا ببيانات، فالرجاء التواصل معنا للحذف.'
      ]
    },

    {
      title: '11. التغييرات',
      paras: [
        '11.1. قد نقوم بتحديث السياسة لتعكس التغييرات في التكنولوجيا والقانون والمنتجات.',
        '11.2. عند حدوث تغييرات جوهرية تُحدّث خانة «تم التحديث» وقد يظهر إشعار داخل الواجهة عند الحاجة.'
      ]
    },

    {
      title: '12. جهات الاتصال',
      paras: [
        '12.1. بريد طلبات الخصوصية: quantuml7ai@gmail.com',
        '12.2. قناة التغذية الراجعة (روبوت): https://t.me/L7ai_feedback'
      ]
    },

    {
      title: '13. التعاريف ونطاق التطبيق',
      paras: [
        '13.1. «الخدمة» — المواقع، Web-MiniApp، تطبيق Telegram Mini App، روبوتات Telegram، المنتدى، API، التحليلات، تكاملات الدفع وواجهات التداول.',
        '13.2. «نحن» — Quantum L7 AI. تغطي السياسة البيانات التي نؤدي فيها دور المتحكم. تعمل الخدمات الخارجية (مزودو التفويض، سلاسل الكتل، المحافظ، بوابات الدفع) وفق قواعدها الخاصة.',
        '13.3. موضوع السياسة — بيانات المستخدمين والبيانات التشغيلية اللازمة لعمل الخدمة.'
      ]
    },

    {
      title: '14. الأسس القانونية للمعالجة (GDPR/UK GDPR)',
      paras: [
        '14.1. العقد/الضرورة لتقديم الخدمة: التفويض، الوصول إلى الوظائف، الفوترة والدعم.',
        '14.2. المصلحة المشروعة: الأمان، منع إساءة الاستخدام، التحليلات التشغيلية منخفضة المخاطر على الخصوصية.',
        '14.3. الموافقة: المقاييس الاختيارية/الاتصالات التسويقية عند الاقتضاء. يمكن سحب الموافقة.',
        '14.4. الالتزام القانوني: التخزين والإفصاح حيثما يقتضي القانون (مثل السجلات المحاسبية).'
      ]
    },

    {
      title: '15. الاحتفاظ بالبيانات',
      paras: [
        '15.1. نحتفظ بالبيانات الشخصية لمدة لا تتجاوز ما يلزم لأغراض المعالجة أو ما يقتضيه القانون.',
        '15.2. مؤشرات إرشادية: سجلات الخدمة 30–180 يومًا؛ تليمترية الأداء حتى 90 يومًا؛ مراسلات الدعم حتى 12 شهرًا؛ سجلات الفوترة — وفق فترات الاحتفاظ القانونية.',
        '15.3. قد تُحتفظ بالتجميعات المُجهّلة لمدة أطول لأغراض بحثية وإحصائية.'
      ]
    },

    {
      title: '16. المعالجون الفرعيون والبنية التحتية',
      paras: [
        '16.1. فئات المعالجين الفرعيين: منصات الحوسبة والاستضافة، CDN، مخازن كائنية، قواعد بيانات SQL/NoSQL، الذاكرات المؤقتة وطوابير الرسائل، المراقبة/التسجيل/التتبع، إرسال البريد/الرسائل، مشغلو الدفع، مزودو فهرسة بيانات السلسلة/خلاصات السوق.',
        '16.2. لدينا اتفاقيات معالجة بيانات (DPA) مع كل معالج فرعي وتُطبق تدابير أمنية تقنية/تنظيمية.',
        '16.3. قائمة الفئات المحدّثة متاحة في السياسة؛ وتُقدَّم قائمة تفصيلية سارية عند الطلب مع مراعاة متطلبات الأمان.'
      ]
    },

    {
      title: '17. التحليلات والمقاييس',
      paras: [
        '17.1. قد نجمع مقاييس استخدام مجمّعة (تغطية الواجهات، الأداء، اعتماد الميزات) بالقدر اللازم لتحسين المنتج.',
        '17.2. تُضبط إعدادات التحليلات لاستبعاد البيانات الحساسة وتقليل المعرّفات الشخصية.',
        '17.3. حيثما يلزم، يُطبّق نظام موافقة للمقاييس غير الأساسية.'
      ]
    },

    {
      title: '18. السجلات والتليمترية',
      paras: [
        '18.1. قد تتضمن السجلات التشغيلية طوابع زمنية، وعنوان IP مُجزّأ، وuser-agent، وتتبع الأخطاء، ومعرّفات الطلب/الارتباط، وأكواد الاستجابة.',
        '18.2. تُدار السجلات بالتدوير وتقييد الوصول وتُستخدم لأغراض تصحيح الأعطال، وتخطيط السعة، والحماية من هجمات DDoS/حركة الروبوتات، والتدقيق.',
        '18.3. تُصمَّم نقاط التسجيل وفق مبدأ التقليل إلى الحد الأدنى.'
      ]
    },

    {
      title: '19. البريد والإشعارات والاتصالات',
      paras: [
        '19.1. تُعالَج الرسائل المرسلة إلى عناويننا/روبوتاتنا لأغراض الدعم، والوفاء بالالتزامات التعاقدية، وحساب جودة الخدمة.',
        '19.2. يمكنك إلغاء الاشتراك من المراسلات غير الخدمية؛ أمّا إشعارات الخدمة (مثل حالة الاشتراك) فهي ضرورية للتشغيل.'
      ]
    },

    {
      title: '20. Webhooks وواجهة برمجة التطبيقات (API)',
      paras: [
        '20.1. عند استخدام Webhook/API قد تُخزّن الحمولات مؤقتًا لضمان التسليم الموثوق، وإزالة التكرار، والحماية من الإعادة.',
        '20.2. لا تمرّر أسرارًا أو مفاتيح خاصة أو أي مواد غير مخصصة للغير عبر Webhook/API؛ استخدم التواقيع، وتدوير الرموز (token rotation)، وتقييد المصادر.'
      ]
    },

    {
      title: '21. ربط المحافظ والمدفوعات',
      paras: [
        '21.1. نخزّن العناوين العامة ومعلمات الشبكة اللازمة لوظائف التعريف والفوترة. لا نجمع أو نخزّن المفاتيح الخاصة/عبارات الاسترجاع.',
        '21.2. تُنفَّذ معالجة المدفوعات عبر مزود مدمج؛ ونتلقى حالات/معرّفات الفواتير والتأكيدات اللازمة لتفعيل اشتراك VIP.',
        '21.3. تُعد تأكيدات المدفوعات على السلسلة معلومات عامة؛ ونقوم بمواءمتها مع حسابك لأغراض الوصول فقط.'
      ]
    },

    {
      title: '22. محددات التنفيذ وإطار المخاطر',
      paras: [
        '22.1. تُطبّق محددات تقنية (rate-limit وsanity-checks) وقواعد مخاطر على أوضاع التداول/التحليل. هذه آليات هندسية وليست ضمانات للنتيجة.',
        '22.2. يتحمل المستخدم مسؤولية قرارات التداول، والامتثال للمتطلبات القانونية، وإدارة المخاطر.'
      ]
    },

    {
      title: '23. الأبحاث والنماذج والذكاء الاصطناعي',
      paras: [
        '23.1. قد نقوم بتدريب/التحقق من النماذج على مجموعات بيانات مجمّعة/مُستعارة الاسم (pseudonymized) حيثما كان ذلك مناسبًا وقانونيًا.',
        '23.2. عند استخدام نماذج تابعة لطرف ثالث نلتزم بالقيود التعاقدية والتقنية لنقل البيانات الشخصية ونطبّق مبدأ التقليل.'
      ]
    },

    {
      title: '24. القرارات المؤتمتة',
      paras: [
        '24.1. لا نتخذ قرارات مؤتمتة بالكامل ذات أثر قانوني جوهري على المستخدم.',
        '24.2. التوصيات والتقييمات إشارات مساعدة لدعم القرارات. يظل الاختيار النهائي للمستخدم.'
      ]
    },

    {
      title: '25. إخفاء الهوية الجزئي، التجميع، والتقليل',
      paras: [
        '25.1. حيثما أمكن، نقوم باستعارة معرّفات الهوية وتجميع المقاييس، وفصل المفاتيح عن البيانات المفيدة.',
        '25.2. يُقيَّد الوصول إلى رابطة «المفتاح—البيانات» بحسب الأدوار والحاجة.'
      ]
    },

    {
      title: '26. قابلية النقل والتصدير',
      paras: [
        '26.1. يمكنك طلب تصدير البيانات الشخصية المرتبطة بحسابك/معرّف الروبوت.',
        '26.2. سنقدّم البيانات بتنسيق قابل للقراءة آليًا عند عدم وجود قيود قانونية وبعد التحقق.'
      ]
    },

    {
      title: '27. تنفيذ حقوق أصحاب البيانات',
      paras: [
        '27.1. أرسل طلبًا عبر البريد الإلكتروني إلى quantuml7ai@gmail.com أو عبر روبوت التغذية الراجعة.',
        '27.2. للتحقق من الهوية قد نطلب إرسال رسالة من حساب Telegram/الروبوت المرتبط أو تأكيد ملكية الحساب/المحفظة المرتبطة.',
        '27.3. يُقدَّم الرد ضمن الآجال التي يحددها القانون الساري؛ وقد تُقيَّد بعض الطلبات بمتطلبات الأمان/التشريعات.'
      ]
    },

    {
      title: '28. الحوادث وإشعارات الخروقات',
      paras: [
        '28.1. توجد إجراءات استجابة: تصنيف الحادث، احتواء الأثر، التحقيق في الأسباب، واستعادة الخدمة.',
        '28.2. في الحالات التي يقتضيها القانون، يُخطَر المستخدمون المتأثرون والجهات الرقابية وتُقدَّم معلومات ذات صلة بطبيعة الحادث والإجراءات المتخذة.'
      ]
    },

    {
      title: '29. ملاحظات قضائية',
      paras: [
        '29.1. المنطقة الاقتصادية الأوروبية/المملكة المتحدة: تُطبَّق قواعد GDPR/UK GDPR فيما يخص حقوق أصحاب البيانات، ومشروعية المعالجة، وعمليات النقل الدولية.',
        '29.2. الولايات المتحدة: تُطبَّق القوانين ذات الصلة للولايات (بما في ذلك CPRA). وعند توفر إشارات تقنية مدعومة للرفض (opt-out) نسعى لأخذها بالاعتبار.',
        '29.3. مناطق أخرى: تُطبَّق القواعد المحلية بشأن المتطلبات الإلزامية للتخزين والإخطار والحماية.'
      ]
    },

    {
      title: '30. عدم التتبع (DNT) والتحكم العالمي بالخصوصية (GPC)',
      paras: [
        '30.1. إذا أرسل متصفحك إشعارات DNT/GPC فإننا نأخذ هذه الإشارات بالاعتبار بالقدر المتاح تقنيًا والمطلوب قانونًا.'
      ]
    },

    {
      title: '31. خيارات الانسحاب وإعدادات الخصوصية',
      paras: [
        '31.1. يمكنك تعطيل ملفات تعريف الارتباط/التحليلات غير الأساسية، وإلغاء الاشتراك من الرسائل غير الخدمية، وتقييد صلاحيات الروبوت.',
        '31.2. قد تتطلب آليات الأمان/الوظائف الأساسية حدًا أدنى من المعالجة ولا يمكن تعطيلها.'
      ]
    },

    {
      title: '32. الإتاحة واللغات والتفسير',
      paras: [
        '32.1. نوفر نصوصًا بعدة لغات. وعند عدم التطابق بين النسخ قد تكون للنسخة الإنجليزية أولوية لأغراض التفسير القانوني.',
        '32.2. تسعى الترجمات للحفاظ على التكافؤ القانوني.'
      ]
    },

    {
      title: '33. المخازن ومواقع البيانات',
      paras: [
        '33.1. قواعد البيانات التشغيلية: أنظمة إدارة قواعد بيانات علائقية و/أو موجهة للوثائق، منشورة ضمن بنية متعددة المناطق مع توفير redundancies وreplication.',
        '33.2. الذاكرات المؤقتة والطوابير: عناقيد/تدفقات/طوابير Redis لتسريع الجلسات ومنطق مكافحة الإساءة والعناصر المؤقتة.',
        '33.3. التخزين الكائني: تخزين الوسائط التي يرفعها المستخدمون والنسخ الاحتياطية مع سياسات مُدارة للإصدارات ودورة الحياة.',
        '33.4. النسخ الاحتياطي: نسخ احتياطية دورية، تحقق من الاستعادة، فصل صلاحيات الوصول، وتشفير أثناء التخزين.',
        '33.5. تكاملات التفويض: يزوّدنا مزودو الهوية (Google وApple وTwitter/X وDiscord وTelegram) بالرموز/التأكيدات؛ لا نخزن كلمات مرورهم ولا ندير قواعد بياناتهم الداخلية.',
        '33.6. الجغرافيا: قد تُعالَج البيانات ضمن بنية متعددة الأقاليم لتحقيق الاعتمادية والأداء، باستخدام آليات نقل دولية قانونية.'
      ]
    },

    {
      title: '34. مدة ونُسخ السياسة',
      paras: [
        '34.1. تدخل السياسة حيز التنفيذ اعتبارًا من تاريخ «تم التحديث» المبيّن أعلاه.',
        '34.2. قد نحتفظ بالإصدارات السابقة لأغراض الأرشفة وشفافية التغييرات.'
      ]
    },

    {
      title: 'الملحق A: مسرد المصطلحات',
      paras: [
        'A.1. المتحكم — شخص/منظمة يحدد أغراض ووسائل معالجة البيانات الشخصية.',
        'A.2. المعالج — شخص/منظمة يعالج البيانات نيابةً عن المتحكم.',
        'A.3. البيانات الشخصية — أي معلومات عن شخص مُعرّف أو قابل للتعريف.',
        'A.4. النقل الدولي — نقل البيانات الشخصية خارج بلد/منطقة جمعها الأولي.'
      ]
    },

    {
      title: 'الملحق B: فئات المعالجين الفرعيين',
      paras: [
        'B.1. الاستضافة/الحوسبة وتنظيم الحاويات.',
        'B.2. شبكات توصيل المحتوى (CDN) والتوصيل الطرفي للمحتوى.',
        'B.3. قواعد البيانات (SQL/NoSQL) وذاكرات Redis المؤقتة.',
        'B.4. المخازن الكائنية وأنظمة النسخ الاحتياطي.',
        'B.5. المراقبة/التسجيل/التتبع/تتبع الأخطاء.',
        'B.6. مشغلو الدفع وبوابات تأكيدات السلسلة.',
        'B.7. مزودو الرسائل (email/Telegram) وخدمات الطوابير.',
        'B.8. فهرسة بيانات البلوك تشين/خلاصات السوق ومنصات التحليلات.'
      ]
    }
  ]
};


/* -------------------- TR (Türkçe) -------------------- */
const PRIVACY_TR = {
  nav_privacy: 'Gizlilik',
  privacy_title: 'Gizlilik Politikası',
  privacy_updated_label: 'Güncellendi:',
  privacy_updated: '2025-10-30',
  privacy_empty: 'Veri yok',
  privacy_sections: [
    {
      title: '1. Genel Bakış',
      paras: [
        '1.1. Bu Quantum L7 AI Gizlilik Politikası (bundan sonra “Politika”) hangi verileri topladığımızı, hangi hukuki dayanaklarla işlediğimizi, verileri nerede ve nasıl sakladığımızı, nasıl koruduğumuzu ve aşağıdaki ekosistem sınırları içinde nasıl aktardığımızı açıklar: web sitesi, Web-MiniApp, Telegram Mini App, Telegram bot(lar)ı, API, Forum, analitik hizmetleri ve ticaret arayüzleri (geliştirilmekte olan Borsa dahil).',
        '1.2. Quantum L7 AI hizmetlerini (“Hizmet”) kullanmak, Politika’yı okuduğunuzu ve koşullarını kabul ettiğinizi teyit eder. Politika, kullanıcıları şeffaf biçimde bilgilendirmek içindir; bireysel hukuki danışmanlık değildir ve belirli sağlayıcıların sözleşme/teklif/politikalarının yerine geçmez.',
        '1.3. Topladığımız ve işleme amaçlarını/araçlarını belirlediğimiz kişisel veriler yönünden veri sorumlusu, müşteriler/iş ortakları adına verileri işlediğimiz yerlerde ise veri işleyen olarak hareket ederiz.',
        '1.4. “Kişisel veriler”, “işleme”, “sorumlu”, “işleyen”, “veri sahibi”, “uluslararası aktarım” terimleri, küresel düzenleyici çerçevelerde (GDPR/UK GDPR, CCPA/CPRA vb.) kabul edilen anlamlarda kullanılır.',
        '1.5. Hizmetlerimiz on-chain kaynaklar ve piyasa yayınları ile etkileşir: kamuya açık blokzincir verileri doğası gereği açıktır ve bizim “kişisel verimiz” değildir; ancak hesabınızla eşleştirildiğinde kişisel veri teşkil edebilir.'
      ]
    },

    {
      title: '2. Ne Topluyoruz',
      paras: [
        '2.1. Hesap ve kimlik verileri: Telegram ID/kullanıcı adı/görünen ad (Telegram Mini App veya bot üzerinden girişte), dahili Account ID, abonelik durumu etiketleri (VIP/Free), arayüz dili.',
        '2.2. İletişim verileri: e-posta (sağlarsanız), Forum takma adı, bağlama sırasında harici hesaplara ait referans tanımlayıcılar (Google, Apple, Twitter/X, Discord vb.).',
        '2.3. Yetkilendirme ve bağlantılar: çoklu sağlayıcılı ekosistem üzerinden girişin olgusu ve rotası (OAuth/OIDC, Telegram WebApp initData, Apple/Google/Twitter/X/Discord ile giriş, cüzdan imzası, magic-link), teknik belirteçler/zaman damgaları/imutlar (özel anahtar ve seed ifadelerini saklamadan).',
        '2.4. Cüzdanlar ve ağlar: açık adresler, kullanılan ağlar (L1/L2), NowPayments üzerinden abonelik ödemesine ve on-chain onaylara ilişkin işlem üst verileri.',
        '2.5. Kullanım verileri: ziyaret edilen sayfalar/ekranlar, arayüzdeki işlemler, zaman damgaları, karma IP, user-agent, istemci performans parametreleri, hata telemetrisi.',
        '2.6. Forum ve içerik: gönderiler, konular, yüklemelerin üst verileri (görsel/video/ses), puanlama sistemine ait eserler (kalite/etkileşim/anti-spam/anti-sybil), QCoin madenciliği için etkinlik istatistikleri.',
        '2.7. Ödemeler ve faturalama: fatura durumları, ödeme onayları (entegrasyonlu ödeme sağlayıcısı üzerinden), tutarlar/para birimleri/zaman damgaları, yönlendirme teknik günlükleri.',
        '2.8. On-chain ve piyasa verileri: analitik amaçlarla ve Hizmet işlevlerini sunmak için kamuya açık zincirleri/borsa akışlarını/emir defterlerini/tarihsel mumları indeksleyip toplulaştırırız.'
      ]
    },

    {
      title: '3. On-chain ve Kamu Verileri',
      paras: [
        '3.1. Kamu blokzincir kayıtları ağdaki herkesin erişimine açıktır; bunların analitik, gösterge ve tavsiye amaçlı işlenmesi, kamuya açık bilginin izin verilen kullanımı kapsamındadır.',
        '3.2. Cüzdan/ödeme/aboneliği gönüllü olarak bağladığınızda, on-chain etkinliğin hesabınızla eşleştirilmesi mümkün olup bu durumda kişiselleştirilmiş bir kullanım profili oluşturulur.',
        '3.3. Kamu düğümlerine/RPC/indeksleme sağlayıcılarına ve piyasa toplayıcılarına yapılan istekler, güvenilirlik, güvenlik, kötüye kullanımın önlenmesi ve hizmet kalitesinin iyileştirilmesi amaçlarıyla günlüğe kaydedilebilir.'
      ]
    },

    {
      title: '4. Çerezler, localStorage ve Diğer İstemci Eserleri',
      paras: [
        '4.1. Asgari gerekli mekanizmaları uygularız: dilin saklanması, güvenli oturum belirteçleri, kötüye kullanım karşıtı parametreler, UX ayarları.',
        '4.2. Çerezler/localStorage engellendiğinde bazı işlevler kullanılamaz hale gelebilir veya gerileyebilir (ör. oturumlar, kişisel limitler, dil).',
        '4.3. Kanunen gerektiği yerlerde, kritik olmayan çerezler/analitik için rıza talep ederiz.'
      ]
    },

    {
      title: '5. Verileri Nasıl Kullanıyoruz',
      paras: [
        '5.1. İşlevsellik sağlama: hesap yetkilendirme/bağlama, abonelik durumlarının senkronizasyonu, Forum, MiniApp, bot, analitik paneller ve önerilere erişim.',
        '5.2. Ürün iyileştirme: toplulaştırılmış kullanım analitiği, A/B değerlendirmeleri, performans telemetrisi, arızaların giderilmesi, yapay zeka modellerinin doğruluğunun artırılması.',
        '5.3. Güvenlik ve bütünlük: kötüye kullanımdan koruma (rate-limit, anti-spam, anti-sybil), anomali kontrolü, hizmet işlemlerinin denetimi, olay soruşturmaları.',
        '5.4. Faturalama ve uygunluk: ödeme durumlarının ve onaylarının işlenmesi, erişim haklarının muhasebesi, finansal raporlama ve yasa dışı faaliyetle mücadele mevzuatına uyum.',
        '5.5. İletişimler ve destek: taleplere yanıtlar, durum bildirimleri (ör. VIP’in başarıyla etkinleştirilmesi), hizmet mesajları.',
        '5.6. Pazarlama profillemesi yürütmüyoruz; gönderimler yalnızca yasal dayanak (ör. rıza) olması halinde yapılır.'
      ]
    },

    {
      title: '6. Üçüncü Taraflara Aktarım ve Açıklama',
      paras: [
        '6.1. Kişisel verileri satmayız.',
        '6.2. Veriler, yalnızca Politika’da açıklanan amaçlar için ve talimatlarımız doğrultusunda alt işleyicilerimiz tarafından işlenebilir: bilişim platformları/barındırma, CDN, nesne depolama, kuyruklar ve önbellekler, izleme/günlükleme/hata izleme, ödeme ağ geçitleri, mesaj sağlayıcıları (e-posta/Telegram), analitik platformları.',
        '6.3. Kanuna uyum, yetkili mercilerin yasal talepleri ve kullanıcıların ile Hizmetin haklarının/güvenliğinin korunması hallerinde açıklama yapılabilir.',
        '6.4. Kurumsal kontrol değişiminde (birleşme/varlık satışı) veriler, eşdeğer korumanın sürdürülmesi ve kanunen gerekirse bildirim yapılması koşuluyla halefe devredilebilir.'
      ]
    },

    {
      title: '7. Güvenlik',
      paras: [
        '7.1. İlkeler: tasarım gereği güvenlik (security by design), asgari ayrıcalık (PoLP), görevlerin ayrımı, kritik işlemlerin zorunlu günlüğe alınması.',
        '7.2. Şifreleme: aktarım sırasında TLS; hassas eserler için saklama katmanında şifreleme; erişim kontrolüyle anahtar yönetimi.',
        '7.3. Erişim: yönetim konsolları için çok faktörlü kimlik doğrulama, role dayalı ayrım, ortamların segmentasyonu (prod/stage/dev).',
        '7.4. Değişiklik kontrolü: kod gözden geçirme, imzalı derlemeler, kademeli yayınlar, geri alma, güvensiz yapılandırmaların engellenmesi.',
        '7.5. Test ve izleme: saldırı tespiti, uyarılar, yapılandırmaların ve izinlerin periyodik gözden geçirilmesi.',
        '7.6. Cüzdan anahtarları ve seed ifadeleri: bunları talep etmeyiz ve saklamayız. İmzalama, kullanıcı tarafında veya güvenilir cüzdan tarafında yapılır.'
      ]
    },

    {
      title: '8. Uluslararası Aktarımlar',
      paras: [
        '8.1. İşleme ve saklama, coğrafi replikasyon ve yük dengeleme içeren çok bölgeli bir altyapıda yürütülebilir.',
        '8.2. Sınır ötesi aktarımlarda yasal mekanizmalar (uygulanabildiğinde standart sözleşme maddeleri dahil) ve eşdeğer koruma tedbirleri kullanılır.',
        '8.3. Kullanıcı, Hizmetin sunulması kapsamında verilerin uluslararası aktarımına rıza gösterir.'
      ]
    },

    {
      title: '9. Haklarınız',
      paras: [
        '9.1. AEA/UK (GDPR): erişim, düzeltme, silme, kısıtlama/itiraz, taşınabilirlik hakları ve denetim otoritesine şikayet hakkı.',
        '9.2. ABD (Kaliforniya/CPRA dahil): bilme, düzeltme, silme, satış/paylaşımın reddi ve hakların kullanımında ayrımcılık yapılmaması hakkı.',
        '9.3. Hakların kullanımı: bkz. “Haklar nasıl kullanılır” bölümü. Kimlik doğrulaması zorunludur.'
      ]
    },

    {
      title: '10. Çocuklar',
      paras: [
        '10.1. Hizmet, 13 yaş altı çocuklara (veya yargı alanınızdaki daha yüksek yaş sınırına) yönelik değildir.',
        '10.2. Bir çocuğun bize veri sağladığını düşünüyorsanız, silme için bizimle iletişime geçin.'
      ]
    },

    {
      title: '11. Değişiklikler',
      paras: [
        '11.1. Politikayı; teknoloji, hukuk ve ürünlerdeki değişiklikleri yansıtmak üzere güncelleyebiliriz.',
        '11.2. Önemli değişikliklerde “Güncellendi” tarihi güncellenir ve gerektiğinde arayüzde bildirim gösterilir.'
      ]
    },

    {
      title: '12. İletişim',
      paras: [
        '12.1. Gizlilik talepleri için e-posta: quantuml7ai@gmail.com',
        '12.2. Geri bildirim kanalı (bot): https://t.me/L7ai_feedback'
      ]
    },

    {
      title: '13. Tanımlar ve Kapsam',
      paras: [
        '13.1. “Hizmet” — siteler, Web-MiniApp, Telegram Mini App, Telegram botları, Forum, API, analitik, ödeme entegrasyonları ve borsa arayüzleri.',
        '13.2. “Biz” — Quantum L7 AI. Politika, veri sorumlusu olduğumuz verileri kapsar. Üçüncü taraf hizmetler (yetkilendirme sağlayıcıları, blokzincirler, cüzdanlar, ödeme ağ geçitleri) kendi kurallarına göre hareket eder.',
        '13.3. Politikanın konusu — kullanıcı verileri ve Hizmetin çalışması için gerekli operasyonel veriler.'
      ]
    },

    {
      title: '14. İşlemenin Hukuki Dayanakları (GDPR/UK GDPR)',
      paras: [
        '14.1. Sözleşme/hizmet sunumu için gereklilik: yetkilendirme, işlevlere erişim, faturalama ve destek.',
        '14.2. Meşru menfaat: güvenlik, kötüye kullanımın önlenmesi, mahremiyet açısından düşük riskli operasyonel analitik.',
        '14.3. Rıza: uygulanabildiğinde isteğe bağlı metrikler/pazarlama iletişimleri. Rıza geri çekilebilir.',
        '14.4. Hukuki yükümlülük: kanunun gerektirdiği hallerde saklama ve açıklama (ör. muhasebe kayıtları).'
      ]
    },

    {
      title: '15. Veri Saklama (Retansiyon)',
      paras: [
        '15.1. Kişisel verileri, işleme amaçları için gerekli olan veya yasanın gerektirdiği süreden daha uzun süre saklamayız.',
        '15.2. Kılavuzlar: hizmet günlükleri 30–180 gün; performans telemetrisi 90 güne kadar; destek yazışmaları 12 aya kadar; faturalama kayıtları — yasal saklama sürelerine göre.',
        '15.3. Anonimleştirilmiş toplulaştırmalar, araştırma ve istatistik amaçlarıyla daha uzun süre saklanabilir.'
      ]
    },

    {
      title: '16. Alt İşleyiciler ve Altyapı',
      paras: [
        '16.1. Alt işleyici kategorileri: bilişim platformları ve barındırma, CDN, nesne depoları, SQL/NoSQL veritabanları, önbellekler ve mesaj kuyrukları, izleme/günlükleme/iz sürme, e-posta/mesaj gönderimi, ödeme operatörleri, on-chain/piyasa akışları indeks sağlayıcıları.',
        '16.2. Her alt işleyiciyle veri işleme anlaşmaları (DPA) yapılmıştır ve teknik/organizasyonel güvenlik önlemleri uygulanır.',
        '16.3. Güncellenebilir kategori listesi Politika’da mevcuttur; güvenlik gereklilikleri gözetilerek talep üzerine güncel detaylı liste sağlanır.'
      ]
    },

    {
      title: '17. Analitik ve Metrikler',
      paras: [
        '17.1. Ürünü geliştirmek için gerekli ölçüde toplulaştırılmış kullanım metrikleri (arayüz kapsaması, performans, özellik benimseme) toplayabiliriz.',
        '17.2. Analitik ayarları, hassas verilerin hariç tutulmasına ve kişisel tanımlayıcıların en aza indirilmesine yöneliktir.',
        '17.3. Gerektiği yerlerde, kritik olmayan metrikler için rıza mekanizması uygulanır.'
      ]
    },

    {
      title: '18. Günlükler ve Telemetri',
      paras: [
        '18.1. Operasyonel günlükler; zaman damgaları, karma IP, user-agent, hata izleri, istek/ilişkilendirme kimlikleri, yanıt kodlarını içerebilir.',
        '18.2. Günlükler döndürülür, erişimle sınırlandırılır ve hata ayıklama, kapasite planlama, DDoS/bot trafiğinden korunma ve denetim için kullanılır.',
        '18.3. Günlükleme noktaları, minimizasyon ilkesine göre tasarlanır.'
      ]
    },

    {
      title: '19. E-posta, Bildirimler ve İletişimler',
      paras: [
        '19.1. Adreslerimize/botlarımıza gönderilen mesajlar; destek, sözleşmesel yükümlülüklerin ifası ve hizmet kalitesi muhasebesi amaçlarıyla işlenir.',
        '19.2. Hizmet dışı gönderimleri reddedebilirsiniz; hizmet bildirimleri (ör. abonelik durumu) işleyiş için zorunludur.'
      ]
    },

    {
      title: '20. Webhooks ve API',
      paras: [
        '20.1. Webhook/API kullanıldığında, yükler güvenilir teslimat, yinelenenlerin elenmesi ve yeniden oynatmaya karşı koruma için geçici olarak arabelleğe alınabilir.',
        '20.2. Webhook/API üzerinden sırlar, özel anahtarlar ve üçüncü taraflara yönelik olmayan diğer materyalleri iletmeyin; imzalar, belirteç rotasyonu ve kaynak kısıtlama kullanın.'
      ]
    },

    {
      title: '21. Cüzdan Bağlama ve Ödemeler',
      paras: [
        '21.1. Kimlik tespiti ve faturalama işlevleri için gerekli açık adresleri ve ağ parametrelerini saklarız. Özel anahtarlar/seed ifadeleri toplanmaz ve saklanmaz.',
        '21.2. Ödeme işleme entegre sağlayıcı aracılığıyla yürütülür; VIP aboneliğin etkinleştirilmesi için gerekli fatura ve onay durumlarını/kimliklerini alırız.',
        '21.3. On-chain ödeme onayları kamuya açık bilgidir; bunları yalnızca erişim amaçlarıyla hesabınızla eşleştiririz.'
      ]
    },

    {
      title: '22. Yürütme Sınırlayıcıları ve Risk Çerçevesi',
      paras: [
        '22.1. Ticaret/analitik modlarında teknik sınırlayıcılar (rate-limit, sanity-checks) ve risk kuralları uygulanır. Bunlar mühendislik mekanizmalarıdır; sonuç garantisi değildir.',
        '22.2. Ticaret kararları, hukuki gerekliliklere uyum ve risk yönetimi sorumluluğu kullanıcıya aittir.'
      ]
    },

    {
      title: '23. Araştırmalar, Modeller ve Yapay Zeka',
      paras: [
        '23.1. Uygun ve yasal olduğu durumlarda, modelleri toplulaştırılmış/pseudonymize edilmiş veri kümeleri üzerinde eğitebilir/doğrulayabiliriz.',
        '23.2. Üçüncü taraf modeller kullanıldığında, kişisel veri aktarımına ilişkin sözleşmesel ve teknik kısıtlamalara uyar ve minimizasyon uygularız.'
      ]
    },

    {
      title: '24. Otomatik Kararlar',
      paras: [
        '24.1. Kullanıcı üzerinde hukuken anlamlı etki doğuran tamamen otomatik kararlar almayız.',
        '24.2. Tavsiyeler ve değerlendirmeler, karar desteği için yardımcı sinyallerdir. Nihai seçim kullanıcıya aittir.'
      ]
    },

    {
      title: '25. Takma Adlandırma, Toplulaştırma ve Minimizasyon',
      paras: [
        '25.1. Mümkün olduğunda, tanımlayıcıları takma adlandırır ve metrikleri toplulaştırır, anahtarları yararlı verilerden ayırırız.',
        '25.2. “Anahtar—veri” bağlantısına erişim roller ve gereklilikle sınırlandırılır.'
      ]
    },

    {
      title: '26. Taşınabilirlik ve Dışa Aktarım',
      paras: [
        '26.1. Hesabınız/bot tanımlayıcınız ile ilişkili kişisel verilerin dışa aktarımını talep edebilirsiniz.',
        '26.2. Hukuki kısıt bulunmaması ve doğrulama sonrasında verileri makinece okunabilir biçimde sağlayacağız.'
      ]
    },

    {
      title: '27. Veri Sahibi Haklarının Kullanımı',
      paras: [
        '27.1. Talebinizi quantuml7ai@gmail.com e-postasına veya geri bildirim botu üzerinden iletin.',
        '27.2. Kimlik doğrulaması için, bağlı Telegram/bot hesabınızdan mesaj göndermenizi veya ilişkili hesap/cüzdan mülkiyetini teyit etmenizi isteyebiliriz.',
        '27.3. Yanıt, yürürlükteki hukukun öngördüğü sürelerde sağlanır; bazı talepler güvenlik/mevzuat gereklilikleriyle sınırlandırılabilir.'
      ]
    },

    {
      title: '28. Olaylar ve İhlal Bildirimleri',
      paras: [
        '28.1. Yanıt prosedürleri yürürlüktedir: olay sınıflandırması, etkinin sınırlandırılması, nedenlerin araştırılması, hizmetin geri yüklenmesi.',
        '28.2. Kanunen gerektiği durumlarda, etkilenen kullanıcılar ve düzenleyiciler bilgilendirilir; olayın niteliği ve alınan önlemler hakkında ilgili bilgiler sağlanır.'
      ]
    },

    {
      title: '29. Yargı Notları',
      paras: [
        '29.1. AEA/UK: veri sahibi hakları, işlemenin yasallığı ve uluslararası aktarımlar bakımından GDPR/UK GDPR hükümleri uygulanır.',
        '29.2. ABD: ilgili eyalet kanunları (CPRA dahil) uygulanır. Desteklenen teknik “vazgeçme” sinyalleri mevcutsa bunları dikkate almaya çalışırız.',
        '29.3. Diğer bölgeler: saklama, bildirim ve korumaya ilişkin zorunlu gerekliliklerde yerel kurallar uygulanır.'
      ]
    },

    {
      title: '30. Do Not Track (DNT) ve Global Privacy Control (GPC)',
      paras: [
        '30.1. Tarayıcınız DNT/GPC sinyalleri gönderiyorsa, bunları teknik olarak mümkün ve hukuken gerekli olduğu ölçüde dikkate alırız.'
      ]
    },

    {
      title: '31. Vazgeçme Seçenekleri ve Gizlilik Ayarları',
      paras: [
        '31.1. Gerekli olmayan çerezleri/analitiği devre dışı bırakabilir, hizmet dışı e-postalardan ayrılabilir, bot izinlerini kısıtlayabilirsiniz.',
        '31.2. Temel güvenlik/işlevsellik mekanizmaları asgari işlem gerektirebilir ve devre dışı bırakılamaz.'
      ]
    },

    {
      title: '32. Erişilebilirlik, Diller ve Yorum',
      paras: [
        '32.1. Metinleri birden çok dilde sunarız. Sürümler arasında uyumsuzluk halinde, hukuki yorum amaçları için İngilizce sürüm öncelik kazanabilir.',
        '32.2. Çeviriler, hukuki eşdeğerliği korumayı hedefler.'
      ]
    },

    {
      title: '33. Depolar ve Veri Konumları',
      paras: [
        '33.1. Operasyonel veritabanları: yedeklilik ve replikasyon içeren çok bölgeli mimaride konuşlandırılmış ilişkisel ve/veya belge odaklı VTYS’ler.',
        '33.2. Önbellekler ve kuyruklar: oturumları hızlandırmak, kötüye kullanım karşıtı mantık ve geçici eserler için Redis kümeleri/akışları/kuyrukları.',
        '33.3. Nesne depolama: kullanıcı tarafından yüklenen ortamlar ve yedeklerin, yönetilen sürümleme ve yaşam döngüsü politikalarıyla saklanması.',
        '33.4. Yedekler: periyodik yedeklemeler, geri yükleme doğrulaması, erişim haklarının ayrımı, saklama sırasında şifreleme.',
        '33.5. Yetkilendirme entegrasyonları: kimlik sağlayıcıları (Google, Apple, Twitter/X, Discord, Telegram) bize belirteçler/onaylar sağlar; parolalarını saklamaz ve iç veritabanlarını yönetmeyiz.',
        '33.6. Coğrafya: veriler, dayanıklılık ve performans için çok bölgeli altyapıda işlenebilir ve yasal uluslararası aktarım mekanizmaları uygulanır.'
      ]
    },

    {
      title: '34. Politikanın Yürürlüğü ve Sürümleri',
      paras: [
        '34.1. Politika, yukarıda belirtilen “Güncellendi” tarihinden itibaren yürürlüğe girer.',
        '34.2. Arşivleme ve değişikliklerin şeffaflığı amaçlarıyla önceki sürümleri saklayabiliriz.'
      ]
    },

    {
      title: 'Ek A: Terimler Sözlüğü',
      paras: [
        'A.1. Veri sorumlusu — kişisel verilerin işlenme amaç ve araçlarını belirleyen kişi/kuruluş.',
        'A.2. Veri işleyen — veri sorumlusu adına verileri işleyen kişi/kuruluş.',
        'A.3. Kişisel veriler — tanımlanmış veya tanımlanabilir kişiye ilişkin herhangi bir bilgi.',
        'A.4. Uluslararası aktarım — kişisel verilerin ilk toplandığı ülke/bölge dışına aktarılması.'
      ]
    },

    {
      title: 'Ek B: Alt İşleyici Kategorileri',
      paras: [
        'B.1. Barındırma/bilgi işlem ve konteyner orkestrasyonu.',
        'B.2. CDN ve uç içerik dağıtımı.',
        'B.3. Veritabanları (SQL/NoSQL) ve Redis önbellekleri.',
        'B.4. Nesne depoları ve yedekleme sistemleri.',
        'B.5. İzleme/günlükleme/iz sürme/hata takibi.',
        'B.6. Ödeme operatörleri ve on-chain onay ağ geçitleri.',
        'B.7. Mesaj sağlayıcıları (e-posta/Telegram) ve kuyruk servisleri.',
        'B.8. Blokzincir verisi/piyasa akışı indeksleme ve analitik platformları.'
      ]
    }
  ]
};

/* -------------------- ES -------------------- */
const PRIVACY_ES = {
  nav_privacy: 'Privacidad',
  privacy_title: 'Política de privacidad',
  privacy_updated_label: 'Actualizado:',
  privacy_updated: '2025-10-30',
  privacy_empty: 'Sin datos',
  privacy_sections: [
    {
      title: '1. Visión general',
      paras: [
        '1.1. Esta Política de Privacidad de Quantum L7 AI (en adelante, la «Política») describe qué datos recopilamos, en qué bases jurídicas los tratamos, dónde y cómo los almacenamos, cómo los protegemos y cómo los transferimos dentro del ecosistema: sitio web, Web-MiniApp, Telegram Mini App, bot(es) de Telegram, API, Foro, servicios analíticos e interfaces de trading (incluida la Bolsa en desarrollo).',
        '1.2. Al utilizar los servicios de Quantum L7 AI (el «Servicio»), usted confirma que ha leído la Política y acepta sus términos. La Política está destinada a informar a los usuarios de forma transparente; no constituye asesoramiento jurídico individual ni sustituye a contratos/ofertas/políticas de proveedores específicos.',
        '1.3. Actuamos como responsable del tratamiento respecto de los datos personales que recopilamos y para los que determinamos los fines/medios del tratamiento, y como encargado del tratamiento cuando tratamos datos por encargo de clientes/socios.',
        '1.4. Los términos «datos personales», «tratamiento», «responsable», «encargado», «titular de los datos», «transferencia internacional» se utilizan con los significados aceptados por los marcos regulatorios globales (GDPR/UK GDPR, CCPA/CPRA, etc.).',
        '1.5. Nuestros servicios interactúan con fuentes on-chain y flujos de mercado: los datos de blockchain públicos son por naturaleza abiertos y no constituyen nuestros «datos personales», pero su correlación con su cuenta puede conformar datos personales.'
      ]
    },

    {
      title: '2. Qué recopilamos',
      paras: [
        '2.1. Datos de cuenta e identificación: Telegram ID/nombre de usuario/nombre visible (al iniciar sesión mediante Telegram Mini App o bot), Account ID interno, etiquetas de estado de suscripción (VIP/Free), idioma de la interfaz.',
        '2.2. Datos de contacto: correo electrónico (si lo proporciona), alias en el Foro, identificadores de referencia de cuentas externas (Google, Apple, Twitter/X, Discord, etc.) al vincularlas.',
        '2.3. Autorización y vinculaciones: hecho y ruta de inicio de sesión a través del ecosistema multiforme de proveedores (OAuth/OIDC, Telegram WebApp initData, Sign in with Apple/Google/Twitter/X/Discord, firma de monedero, magic-link), tokens/marcas/firmas técnicas (sin almacenar claves privadas ni frases semilla).',
        '2.4. Monederos y redes: direcciones públicas, redes utilizadas (L1/L2), metadatos de transacciones relacionados con el pago de la suscripción vía NowPayments y confirmaciones on-chain.',
        '2.5. Datos de uso: páginas/pantallas visitadas, acciones en la interfaz, marcas de tiempo, IP con hash, user-agent, parámetros de rendimiento del cliente, telemetría de errores.',
        '2.6. Foro y contenido: publicaciones, temas, metadatos de cargas (imágenes/video/audio), artefactos de sistemas de puntuación (calidad/engagement/anti-spam/anti-sybil), estadísticas de actividad para la minería de QCoin.',
        '2.7. Pagos y facturación: estados de facturas, confirmaciones de pagos (a través del proveedor de pagos integrado), importes/monedas/marcas de tiempo, registros técnicos de enrutamiento.',
        '2.8. Datos on-chain y de mercado: indexamos y agregamos cadenas públicas/feeds de intercambio/libros de órdenes/velas históricas con fines analíticos y para ofrecer funciones del Servicio.'
      ]
    },

    {
      title: '3. Datos on-chain y públicos',
      paras: [
        '3.1. Los registros públicos de blockchain están disponibles para cualquier participante de la red; su tratamiento para análisis, indicadores y recomendaciones se realiza dentro del uso permitido de la información de acceso público.',
        '3.2. La correlación de la actividad on-chain con su cuenta es posible mediante la vinculación voluntaria de monedero/pagos/suscripciones. En tal caso, se crea un perfil de uso personal.',
        '3.3. Las solicitudes a nodos públicos/proveedores de RPC/indexación y a agregadores de mercado pueden registrarse para fiabilidad, seguridad, prevención de abusos y mejora de la calidad del servicio.'
      ]
    },

    {
      title: '4. Cookies, localStorage y otros artefactos del cliente',
      paras: [
        '4.1. Aplicamos mecanismos estrictamente necesarios: conservación del idioma, marcadores de sesión seguros, parámetros antiabuso, ajustes de UX.',
        '4.2. Si se bloquean las cookies/localStorage, parte de las funciones puede volverse inaccesible o degradarse (por ejemplo, sesiones, límites personalizados, idioma).',
        '4.3. Cuando lo exige la ley, solicitamos consentimiento para cookies/analítica no críticas.'
      ]
    },

    {
      title: '5. Cómo utilizamos los datos',
      paras: [
        '5.1. Prestación de funcionalidades: autorización/vinculación de cuentas, sincronización de estados de suscripción, acceso al Foro, MiniApp, bot, paneles analíticos y recomendaciones.',
        '5.2. Mejora del producto: analítica de uso agregada, evaluaciones A/B, telemetría de rendimiento, resolución de fallos, aumento de la precisión de los modelos de IA.',
        '5.3. Seguridad e integridad: protección contra abusos (rate-limit, anti-spam, anti-sybil), control de anomalías, auditoría de acciones de servicio, investigación de incidentes.',
        '5.4. Facturación y cumplimiento: tratamiento de estados de pagos y confirmaciones, gestión de derechos de acceso, cumplimiento de leyes de contabilidad financiera y de lucha contra actividades ilícitas.',
        '5.5. Comunicaciones y soporte: respuestas a solicitudes, notificaciones de estado (por ejemplo, activación exitosa de VIP), mensajes de servicio.',
        '5.6. No realizamos perfilado de marketing; los envíos se efectúan solo cuando existe base legal (por ejemplo, consentimiento).'
      ]
    },

    {
      title: '6. Transferencia y divulgación a terceros',
      paras: [
        '6.1. No vendemos datos personales.',
        '6.2. Los datos pueden ser tratados por nuestros subencargados conforme a nuestras instrucciones y únicamente para los fines descritos en la Política: plataformas de cómputo/hosting, CDN, almacenamiento de objetos, colas y cachés, monitorización/registro/seguimiento de errores, pasarelas de pago, proveedores de mensajería (email/Telegram), plataformas analíticas.',
        '6.3. La divulgación es posible en cumplimiento de la ley, ante solicitudes legítimas de autoridades competentes, y para proteger los derechos/seguridad de los usuarios y del Servicio.',
        '6.4. En caso de cambio de control corporativo (fusión/venta de activos), los datos pueden transferirse al sucesor siempre que se mantenga una protección equivalente y se notifique cuando lo exija la ley.'
      ]
    },

    {
      title: '7. Seguridad',
      paras: [
        '7.1. Principios: seguridad por diseño (security by design), mínimo privilegio (PoLP), segregación de funciones, registro obligatorio de operaciones críticas.',
        '7.2. Cifrado: TLS en tránsito; cifrado en almacenamiento para artefactos sensibles; gestión de claves con control de acceso.',
        '7.3. Acceso: autenticación multifactor para consolas de administración, segregación por roles, segmentación de entornos (prod/stage/dev).',
        '7.4. Control de cambios: revisión de código, builds firmadas, despliegues graduales, rollbacks, bloqueo de configuraciones inseguras.',
        '7.5. Pruebas y monitorización: detección de intrusiones, alertas, revisiones periódicas de configuraciones y permisos.',
        '7.6. Claves de monedero y frases semilla: no las solicitamos ni almacenamos. Las firmas se realizan del lado del usuario o de un monedero de confianza.'
      ]
    },

    {
      title: '8. Transferencias internacionales',
      paras: [
        '8.1. El tratamiento y almacenamiento pueden realizarse en una infraestructura multirregional con replicación geográfica y balanceo.',
        '8.2. En transferencias transfronterizas se utilizan mecanismos legales (incluidas cláusulas contractuales tipo, cuando corresponda) y medidas de protección equivalentes.',
        '8.3. El usuario consiente la transferencia internacional de datos en el marco de la prestación del Servicio.'
      ]
    },

    {
      title: '9. Sus derechos',
      paras: [
        '9.1. EEE/Reino Unido (GDPR): derecho de acceso, rectificación, supresión, limitación/oposición, portabilidad, así como derecho a presentar reclamación ante una autoridad de control.',
        '9.2. EE. UU. (incluida California/CPRA): derecho a saber, rectificar, eliminar, optar por no vender/compartir, y derecho a no sufrir discriminación por ejercer sus derechos.',
        '9.3. Ejercicio de derechos: véase la sección «Cómo ejercer los derechos». La verificación de identidad es obligatoria.'
      ]
    },

    {
      title: '10. Menores',
      paras: [
        '10.1. El Servicio no está destinado a menores de 13 años (o una edad superior según la legislación de su jurisdicción).',
        '10.2. Si cree que un menor nos ha proporcionado datos, póngase en contacto con nosotros para su eliminación.'
      ]
    },

    {
      title: '11. Cambios',
      paras: [
        '11.1. Podemos actualizar la Política para reflejar cambios en tecnologías, legislación y productos.',
        '11.2. En cambios sustanciales, se actualiza la fecha de «Actualizado» y, cuando sea necesario, se muestra un aviso en la interfaz.'
      ]
    },

    {
      title: '12. Contacto',
      paras: [
        '12.1. Correo para solicitudes de privacidad: quantuml7ai@gmail.com',
        '12.2. Canal de feedback (bot): https://t.me/L7ai_feedback'
      ]
    },

    {
      title: '13. Definiciones y alcance',
      paras: [
        '13.1. «Servicio»: sitios, Web-MiniApp, Telegram Mini App, bots de Telegram, Foro, API, analítica, integraciones de pagos e interfaces de intercambio.',
        '13.2. «Nosotros»: Quantum L7 AI. La Política abarca los datos respecto de los cuales actuamos como responsable del tratamiento. Los servicios de terceros (proveedores de autorización, blockchains, monederos, pasarelas de pago) actúan conforme a sus propias normas.',
        '13.3. Objeto de la Política: datos de usuarios y datos operativos necesarios para el funcionamiento del Servicio.'
      ]
    },

    {
      title: '14. Bases jurídicas del tratamiento (GDPR/UK GDPR)',
      paras: [
        '14.1. Contrato/necesidad para la prestación del servicio: autorización, acceso a funcionalidades, facturación y soporte.',
        '14.2. Interés legítimo: seguridad, prevención de abusos, analítica operativa de bajo riesgo para la vida privada.',
        '14.3. Consentimiento: métricas opcionales/comunicaciones de marketing, cuando corresponda. El consentimiento puede retirarse.',
        '14.4. Obligación legal: conservación y divulgación cuando lo exija la ley (por ejemplo, registros contables).'
      ]
    },

    {
      title: '15. Conservación de datos (retención)',
      paras: [
        '15.1. Conservamos los datos personales no más tiempo del necesario para los fines del tratamiento o los requisitos legales.',
        '15.2. Guías: logs de servicio 30–180 días; telemetría de rendimiento hasta 90 días; correspondencia de soporte hasta 12 meses; registros de facturación según plazos legales de conservación.',
        '15.3. Los agregados anonimizados pueden conservarse por más tiempo con fines de investigación y estadísticos.'
      ]
    },

    {
      title: '16. Subencargados e infraestructura',
      paras: [
        '16.1. Categorías de subencargados: plataformas de cómputo y hosting, CDN, almacenes de objetos, bases de datos SQL/NoSQL, cachés y colas de mensajes, monitorización/registro/trazabilidad, envío de email/mensajes, operadores de pago, proveedores de indexación de datos on-chain/feeds de mercado.',
        '16.2. Con cada subencargado se han suscrito acuerdos de tratamiento de datos (DPA) y se aplican medidas técnicas/organizativas de seguridad.',
        '16.3. La lista actualizable de categorías está disponible en la Política; la lista detallada y vigente se proporciona bajo solicitud considerando los requisitos de seguridad.'
      ]
    },

    {
      title: '17. Analítica y métricas',
      paras: [
        '17.1. Podemos recopilar métricas de uso agregadas (cobertura de interfaces, rendimiento, adopción de funciones) en la medida necesaria para mejorar el producto.',
        '17.2. Los ajustes de analítica están orientados a excluir datos sensibles y minimizar identificadores personales.',
        '17.3. Donde se requiera, se aplica un mecanismo de consentimiento para métricas no esenciales.'
      ]
    },

    {
      title: '18. Logs y telemetría',
      paras: [
        '18.1. Los logs operativos pueden incluir marcas de tiempo, IP con hash, user-agent, trazas de errores, IDs de solicitudes/correlación, códigos de respuesta.',
        '18.2. Los logs se rotan, se restringe su acceso y se utilizan para depuración, planificación de capacidad, protección contra DDoS/tráfico de bots y auditoría.',
        '18.3. Los puntos de registro se diseñan conforme al principio de minimización.'
      ]
    },

    {
      title: '19. Correo, notificaciones y comunicaciones',
      paras: [
        '19.1. Los mensajes enviados a nuestras direcciones/bots se tratan para soporte, ejecución de obligaciones contractuales y control de calidad del servicio.',
        '19.2. Puede darse de baja de envíos no relacionados con el servicio; las notificaciones de servicio (por ejemplo, sobre el estado de la suscripción) son obligatorias para el funcionamiento.'
      ]
    },

    {
      title: '20. Webhooks y API',
      paras: [
        '20.1. Al utilizar Webhook/API, las cargas útiles pueden almacenarse temporalmente en búfer para la entrega fiable, la deduplicación y la protección contra repeticiones.',
        '20.2. No transmita secretos, claves privadas u otros materiales no destinados a terceros a través de Webhook/API; utilice firmas, rotación de tokens y restricción de orígenes.'
      ]
    },

    {
      title: '21. Vinculación de monederos y pagos',
      paras: [
        '21.1. Almacenamos direcciones públicas y parámetros de red necesarios para funciones de identificación y facturación. No se recopilan ni almacenan claves privadas/frases semilla.',
        '21.2. El procesamiento de pagos se realiza a través del proveedor integrado; recibimos estados/identificadores de facturas y confirmaciones necesarios para activar la suscripción VIP.',
        '21.3. Las confirmaciones de pagos on-chain son información pública; las correlacionamos con su cuenta exclusivamente para fines de acceso.'
      ]
    },

    {
      title: '22. Limitadores de ejecución y contorno de riesgo',
      paras: [
        '22.1. Para modos de trading/analítica se aplican limitadores técnicos (rate-limit, sanity-checks) y reglas de riesgo. Son mecanismos de ingeniería, no garantías de resultado.',
        '22.2. La responsabilidad por las decisiones de trading, el cumplimiento normativo y la gestión del riesgo recae en el usuario.'
      ]
    },

    {
      title: '23. Investigación, modelos e IA',
      paras: [
        '23.1. Podemos entrenar/validar modelos con conjuntos agregados/pseudonimizados cuando sea apropiado y legal.',
        '23.2. Al usar modelos de terceros, respetamos las restricciones contractuales y técnicas de transferencia de datos personales y aplicamos minimización.'
      ]
    },

    {
      title: '24. Decisiones automatizadas',
      paras: [
        '24.1. No adoptamos decisiones exclusivamente automatizadas con efecto jurídico significativo sobre el usuario.',
        '24.2. Las recomendaciones y valoraciones son señales auxiliares de apoyo a la decisión. La elección final corresponde al usuario.'
      ]
    },

    {
      title: '25. Pseudonimización, agregación y minimización',
      paras: [
        '25.1. Cuando es posible, pseudonimizamos identificadores y agregamos métricas, separando claves y datos útiles.',
        '25.2. El acceso al vínculo «clave—datos» se limita por roles y necesidad.'
      ]
    },

    {
      title: '26. Portabilidad y exportación',
      paras: [
        '26.1. Puede solicitar la exportación de los datos personales asociados a su cuenta/identificador de bot.',
        '26.2. Proporcionaremos los datos en un formato legible por máquina, si no existen restricciones legales, y tras la verificación.'
      ]
    },

    {
      title: '27. Ejercicio de derechos de los titulares de datos',
      paras: [
        '27.1. Envíe su solicitud al correo quantuml7ai@gmail.com o a través del bot de feedback.',
        '27.2. Para la verificación de identidad, podemos pedirle que envíe un mensaje desde su cuenta de Telegram/bot vinculada o que confirme la titularidad de la cuenta/monedero asociado.',
        '27.3. La respuesta se proporciona dentro de los plazos establecidos por la ley aplicable; algunas solicitudes pueden estar limitadas por requisitos de seguridad/legislación.'
      ]
    },

    {
      title: '28. Incidentes y notificaciones de brechas',
      paras: [
        '28.1. Existen procedimientos de respuesta: clasificación del incidente, contención del impacto, investigación de causas, restauración del servicio.',
        '28.2. En los casos exigidos por la ley, se notifica a los usuarios afectados y a los reguladores, proporcionando información relevante sobre la naturaleza del incidente y las medidas aplicadas.'
      ]
    },

    {
      title: '29. Notas jurisdiccionales',
      paras: [
        '29.1. EEE/Reino Unido: se aplican las normas del GDPR/UK GDPR en lo relativo a derechos de los titulares, licitud del tratamiento y transferencias internacionales.',
        '29.2. EE. UU.: se aplican las leyes estatales correspondientes (incluida la CPRA). Cuando existan señales técnicas de «opt-out» compatibles, procuramos tenerlas en cuenta.',
        '29.3. Otras regiones: se aplican las normas locales respecto de requisitos obligatorios de conservación, notificación y protección.'
      ]
    },

    {
      title: '30. Do Not Track (DNT) y Global Privacy Control (GPC)',
      paras: [
        '30.1. Si su navegador envía DNT/GPC, consideramos dichas señales en la medida en que sea técnicamente posible y lo exija la ley.'
      ]
    },

    {
      title: '31. Opciones de exclusión y ajustes de privacidad',
      paras: [
        '31.1. Puede desactivar cookies/analítica no esenciales, darse de baja de correos no relacionados con el servicio y limitar permisos del bot.',
        '31.2. Los mecanismos básicos de seguridad/funcionalidad pueden requerir tratamiento mínimo y no pueden desactivarse.'
      ]
    },

    {
      title: '32. Accesibilidad, idiomas e interpretación',
      paras: [
        '32.1. Proporcionamos textos en varios idiomas. En caso de discrepancia entre versiones, la versión en inglés puede tener prioridad a efectos de interpretación jurídica.',
        '32.2. Las traducciones procuran mantener la equivalencia jurídica.'
      ]
    },

    {
      title: '33. Almacenes y ubicación de datos',
      paras: [
        '33.1. Bases de datos operativas: SGBD relacionales y/o orientadas a documentos, desplegadas en arquitectura multizona con redundancia y replicación.',
        '33.2. Cachés y colas: clústeres/streams/colas de Redis para acelerar sesiones, lógica antiabuso y artefactos temporales.',
        '33.3. Almacenamiento de objetos: conservación de medios cargados por usuarios y copias de seguridad con políticas gestionadas de versionado y ciclo de vida.',
        '33.4. Copias de seguridad: backups periódicos, verificación de restauración, segregación de derechos de acceso, cifrado en reposo.',
        '33.5. Integraciones de autorización: los proveedores de identidad (Google, Apple, Twitter/X, Discord, Telegram) nos proporcionan tokens/confirmaciones; no almacenamos sus contraseñas ni gestionamos sus bases de datos internas.',
        '33.6. Geografía: los datos pueden tratarse en infraestructura multirregional para resiliencia y rendimiento, aplicando mecanismos legales de transferencia internacional.'
      ]
    },

    {
      title: '34. Vigencia y versiones de la Política',
      paras: [
        '34.1. La Política entra en vigor a partir de la fecha de «Actualizado» indicada arriba.',
        '34.2. Podemos conservar versiones anteriores con fines de archivo y transparencia de cambios.'
      ]
    },

    {
      title: 'Anexo A: Glosario',
      paras: [
        'A.1. Responsable del tratamiento: persona/organización que determina los fines y medios del tratamiento de datos personales.',
        'A.2. Encargado del tratamiento: persona/organización que trata datos por encargo del responsable.',
        'A.3. Datos personales: cualquier información sobre una persona identificada o identificable.',
        'A.4. Transferencia internacional: transferencia de datos personales fuera del país/región donde se recopilaron inicialmente.'
      ]
    },

    {
      title: 'Anexo B: Categorías de subencargados',
      paras: [
        'B.1. Alojamiento/cómputo y orquestación de contenedores.',
        'B.2. CDN y entrega de contenido en el borde.',
        'B.3. Bases de datos (SQL/NoSQL) y cachés Redis.',
        'B.4. Almacenes de objetos y sistemas de copias de seguridad.',
        'B.5. Monitorización/registro/trazabilidad/seguimiento de errores.',
        'B.6. Operadores de pago y pasarelas de confirmaciones on-chain.',
        'B.7. Proveedores de mensajería (email/Telegram) y servicios de colas.',
        'B.8. Indexación de datos de blockchain/feeds de mercado y plataformas analíticas.'
      ]
    }
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
  sub_title: 'Subscription',
  sub_intro:
    'Quantum L7 is not "just another service" but a unified decision-making framework. 87 TB of market data, 37 billion historical candles across-chains, cross-exchange aggregation, liquidity normalization, and latency-aware processing. One account opens the Web MiniApp, Telegram bot QL7 AI Bot, and the Forum with QCoin mining. The MiniApp runs in Telegram and on the web; exchange recommendations are already delivered in real time (trading core and execution are in the final stage). VIP+ provides unlimited AI analytics time, X2 quest multipliers, and bonus QCoin accruals for media content (video/images/audio) that passes scoring by the Quantum L7 AI engine. Payment is via NowPayments: once on-chain confirmation arrives, access is activated instantly and synchronized across MiniApp/bot/forum. Ahead — the launch of the next-generation L7 blockchain: VIPs receive a higher priority tier for distribution and QCoin withdrawal queue, early access to staking/validator roles, and increased limits. Seven interface languages, precise wallet integration, strict risk management discipline, and “entry windows” without noise — everything to keep you in the market flow.',

  sub_wallet_cta: 'Connect wallet',
  sub_wallet_cta_note: 'Connect your wallet — the plan will activate and sync with MiniApp/Telegram/forum.',
  sub_plans_title: 'Plans',

  sub_vip_title: 'VIP+ — X2 QCoin, premium AI channel, media posting, L7 network priority',
  sub_vip_price: 'Price: 30 USDT / month',
  sub_vip_desc: `
    • Unified VIP layer: MiniApp + Telegram + Web — status and limits everywhere, with no discrepancies or delays.<br/>
    • Forum mining: every 4 hours confirm your activity and record QCoin; VIP gets X2 to time and X2 quest multiplier.<br/>
    • Media posting (VIP): videos/images/audio are processed by Quantum L7 AI scoring (quality, engagement, anti-spam/anti-sybil) and converted into boosted QCoin bonuses.<br/>
    • Market recommendations: symbol/TF signals already work; advanced volatility analysis, volume clustering, and what-if/backtest are prioritized for VIP.<br/>
    • Telegram QL7 AI Bot: extended quotas, priority responses, X2 “on-chain clarity” windows during turbulence peaks.<br/>
    • NowPayments: crypto payment (USDT and others) with instant activation after on-chain confirmation — no screenshots or manual checks.<br/>
    • L7 blockchain (upcoming release): VIPs — top layers of the QCoin withdrawal queue, higher caps, early access to validator/staking and technical beta channels.<br/>
    • Forum profile: gold badge, boosted visibility, extended media limits, faster moderation, and higher content weight in ranking.<br/>
    • Localization in 7 languages and adaptive UX from mobile Telegram to desktop web — one interface, different environments, zero friction.<br/>
    • For those who need pace: precise entries/SL/TP, clean risk contour, transparent calculations, and fair reward economy.<br/>
  `,

  sub_benefits_title: 'Why Choose Us',
  sub_benefits: [
    'Institutional-grade data: 87 TB, 37 billion candles, cross-exchange liquidity aggregator, unified tick frequency and order book depth.',
    'MiniApp + Telegram + Forum: one subscription = shared quotas, rights, and progress; context switching without state loss.',
    'QCoin economy: activity every 4 hours, quests, media posting; VIP gets X2 time/quest multiplier and increased content weight.',
    'AI analytics without noise: focus on entry/exit windows, SL/TP, risk profile, and real horizons — not on “news” noise.',
    'Market microstructure: spread dispersion, impact volumes, imbalances, VWAP/POC scenarios, and behavioral patterns — delivered concisely.',
    'NowPayments onboarding: crypto payment and instant activation; no manual confirmations.',
    'Road to L7-chain: VIP — top priority tier for QCoin withdrawal, staking, and validator programs at network launch.',
    'Anti-sybil/anti-fraud pipelines: behavioral metrics, anti-manipulation protection, and fair distribution model.',
    'Premium AI bandwidth: higher request frequency, shorter latency, priority processing.',
    'Research and alpha features: experimental indicators, private channels, early betas for advanced users.',
    'Multi-jurisdictional localization: 7 languages, unified signal semantics, and interface without “broken” translations.',
    'Lag-free experience: lightweight front-end, adaptive panels, seamless flow between bot, forum, and MiniApp.',
    'Support for speed: VIP tickets are handled with short SLA and priority escalation.',
  ],

  sub_payments_title: 'Start in Minutes',
  sub_payments: [
    '1) Connect your wallet — your account will link with MiniApp/Telegram/forum.',
    '2) Choose VIP+ and pay via NowPayments (USDT and other networks).',
    '3) Once on-chain confirmation arrives, the subscription activates automatically — no screenshots or emails.',
    '4) Status and limits sync across all points: MiniApp, QL7 AI Bot, Forum.',
    '5) Enable QCoin mining: confirm activity every 4 hours + quests; VIP gets X2.',
    '6) Publish media: Quantum L7 AI will evaluate and grant bonus QCoin according to scoring.',
    '7) Follow the exchange and L7-chain release: VIPs are first in withdrawal queues and early roles in the network.',
    '8) Manage risks: use SL/TP, maintain position size, don’t overtrade volatility.',
    '9) Update your plan seamlessly: upgrade and renew in a few clicks, remaining time carries over.',
    '10) Keep your access: single account, local auth markers, and session fail protection.',
  ],

  sub_legal_note:
    'We provide analytics and tools — not financial advice. Volatility is high; control your risks, position size, and execution discipline.',

  sub_faq_title: 'FAQ',
  sub_faq: [
    {
      q: 'What is MiniApp and how is it different from a regular website?',
      a: 'It’s a cross-platform interface (web + Telegram) with a single account and synchronized limits; requires no installation and opens instantly.'
    },
    {
      q: 'How does QCoin mining on the forum work?',
      a: 'Every 4 hours you confirm activity and record rewards; tasks/quests and media posting boost profitability. VIP gets X2 in time and X2 in quests.'
    },
    {
      q: 'What does VIP+ provide right now?',
      a: 'Priority AI channel, media posting with QCoin bonuses and gold badge, increased content weight, early access to experimental indicators, and accelerated support.'
    },
    {
      q: 'What market data do we use?',
      a: 'Aggregated historical series — 87 TB, 37 billion candles, cross-exchange unification, microstructure and behavioral pattern analysis considering liquidity and spread.'
    },
    {
      q: 'How is the subscription activated and why is it instant?',
      a: 'Payment goes through NowPayments; as soon as the transaction is confirmed on-chain, VIP status is automatically enabled across all components.'
    },
    {
      q: 'How will VIP affect the future L7 blockchain?',
      a: 'VIPs receive priority in distributions and first in line for QCoin withdrawals, higher limits, early validator/staker roles, and access to technical beta channels.'
    },
    {
      q: 'Can the plan be upgraded without losing time?',
      a: 'Yes. Upgrading takes a couple of clicks; unused time carries over and accumulates.'
    },
    {
      q: 'Which languages are supported?',
      a: 'Seven locales with unified signal terminology; switching is instant and does not break the interface layout.'
    },
    {
      q: 'Are there any verification requirements?',
      a: 'Anti-sybil/anti-fraud mechanics and behavioral filters are in place; in risky signals, the system may request additional verification.'
    },
  ],
}

const SUBSCRIBE_RU = {
  sub_title: 'Подписка',
  sub_intro:
    'Quantum L7 — это не «ещё один сервис», а единый контур принятия решений. 87 ТБ рыночных данных, 37 млрд исторических свечей across-chains, кросс-эксчендж-агрегация, нормализация ликвидности и latency-aware обработка. Один аккаунт открывает Web-MiniApp, Telegram-бота QL7 AI Bot и Форум с QCoin-майнингом. MiniApp живёт в Telegram и в вебе, рекомендации по бирже уже отдаются в реальном времени (торговое ядро и исполнение — на финальной стадии). VIP+ даёт безлимит времени ИИ-аналитики, X2 квест-множители и бонусные QCoin-начисления за медиаконтент (видео/изображения/аудио), который проходит скоринг движком Quantum L7 AI. Оплата — через NowPayments: как только on-chain подтверждение прилетело, доступ включается мгновенно и синхронизируется в MiniApp/боте/форуме. Впереди — запуск L7-блокчейна нового поколения: VIP получают повышенный priority tier на распределение и очередь вывода QCoin, ранний доступ к стейкингу/валидаторским ролям и повышенные лимиты. Семь языков интерфейса, аккуратная связка кошелька, строгая дисциплина риск-менеджмента и «окна входа» без шума — всё, чтобы держать тебя в рыночном потоке.',

  sub_wallet_cta: 'Подключить кошелёк',
  sub_wallet_cta_note: 'Подключите кошелёк — план активируется и синхронизируется с MiniApp/Telegram/форумом.',
  sub_plans_title: 'Тарифы',

  sub_vip_title: 'VIP+ — X2 QCoin, премиальный AI-канал, медиапостинг, приоритет L7-сети',
  sub_vip_price: 'Цена: 30 USDT / месяц',
  sub_vip_desc: `
    • Единый VIP-слой: MiniApp + Telegram + Веб — статус и лимиты везде, без расхождений и задержек.<br/>
    • Форум-майнинг: каждые 4 часа подтверждай активность и фиксируй QCoin; VIP получает X2 ко времени и X2 квест-мультипликатор.<br/>
    • Медиапостинг (VIP): видео/изображения/аудио проходят Quantum L7 AI-скоринг (quality, engagement, anti-spam/anti-sybil) и конвертятся в повышенные QCoin-бонусы.<br/>
    • Рекомендации по рынку: сигналы по символам/TF уже работают; углублённый анализ волатильности, кластеризация объёмов и what-if/backtest доступны в приоритете для VIP.<br/>
    • Telegram QL7 AI Bot: расширенные квоты, приоритет ответа, X2 окна «on-chain clarity» в пиках турбулентности.<br/>
    • NowPayments: крипто-оплата (USDT и др.) с мгновенной активацией после on-chain подтверждения — без скринов и мануальных проверок.<br/>
    • L7-блокчейн (грядущий релиз): VIP — верхние слои очереди на вывод QCoin, повышенные капы, ранний доступ к валидаторам/стейкингу и техническим бета-каналам.<br/>
    • Профиль на форуме: золотой бейдж, буст выдачи, расширенные лимиты на медиа, ускоренная модерация и повышенный вес контента в ранжировании.<br/>
    • Локализация на 7 языках и адаптивный UX от мобильного Telegram до десктопного веба — один интерфейс, разные среды, ноль трения.<br/>
    • Для тех, кому нужен темп: precise entries/SL/TP, риск-контур без лишней «пены», прозрачность расчётов и честная экономика наград.<br/>
  `,

  sub_benefits_title: 'Почему выбирают нас',
  sub_benefits: [
    'Данные институционального уровня: 87 ТБ, 37 млрд свечей, кросс-биржевой агрегат ликвидности, унификация тик-частоты и глубины стаканов.',
    'MiniApp + Telegram + Форум: одна подписка = общие квоты, права и прогресс; переключение контекстов без потери состояния.',
    'QCoin-экономика: активность каждые 4 часа, квесты, медиапостинг; VIP получает X2 время/квест-мультипликатор и повышенный вес контента.',
    'AI-аналитика без шума: фокус на окнах входа/выхода, SL/TP, риск-профиле и реальных горизонтах, а не на «новостном» шуме.',
    'Market microstructure: дисперсия спрэда, ударные объёмы, имбалансы, VWAP/POC-сценарии и поведенческие паттерны — в лаконичной подаче.',
    'NowPayments-онбординг: оплата в крипто и моментальная активация; никаких ручных подтверждений.',
    'Road to L7-chain: VIP — верхний priority tier для вывода QCoin, стейкинга и валидаторских программ при запуске сети.',
    'Anti-sybil/anti-fraud пайплайны: поведенческие метрики, защита от накруток и честная распределительная модель.',
    'Премиальный AI-бэндвидт: больше частоты запросов, более короткие задержки, приоритетная обработка.',
    'Ресёрч и альфа-фичи: экспериментальные индикаторы, закрытые каналы, ранние беты для продвинутых пользователей.',
    'Мультиюридическая локализация: 7 языков, единая семантика сигналов и интерфейс без «ломающего» перевода.',
    'Опыт без лагов: лёгкий фронт, адаптивные панели, бесшовный flow между ботом, форумом и MiniApp.',
    'Поддержка для темпа: VIP-тикеты обрабатываются с коротким SLA и приоритетной эскалацией.',
  ],

  sub_payments_title: 'Старт за минуты',
  sub_payments: [
    '1) Подключите кошелёк — аккаунт свяжется с MiniApp/Telegram/форумом.',
    '2) Выберите VIP+ и оплатите через NowPayments (USDT и другие сети).',
    '3) По on-chain подтверждению подписка активируется автоматически — без скринов и писем.',
    '4) Статус и лимиты синхронизируются во всех точках: MiniApp, QL7 AI Bot, Форум.',
    '5) Включайте QCoin-майнинг: каждые 4 часа подтверждение активности + квесты; для VIP действует X2.',
    '6) Публикуйте медиа: Quantum L7 AI оценит и начислит бонусные QCoin согласно скорингу.',
    '7) Следите за релизом биржи и L7-чейна: VIP — первые в очередях на вывод и ранние роли в сети.',
    '8) Менеджьте риски: используйте SL/TP, выдерживайте размер позиции, не переторговывайте волатильность.',
    '9) Обновляйте план без трения: апгрейд и продление в пару кликов, остаток переносится.',
    '10) Храните доступ: единый аккаунт, локальные маркеры авторизации и защита от сбоев сессии.',
  ],

  sub_legal_note:
    'Мы предоставляем аналитику и инструменты — не финансовые рекомендации. Волатильность высока; контролируйте риски, размер позиции и соблюдайте дисциплину исполнения.',

  sub_faq_title: 'FAQ',
  sub_faq: [
    {
      q: 'Что такое MiniApp и чем он отличается от обычного сайта?',
      a: 'Это кросс-платформенный интерфейс (веб + Telegram) с единым аккаунтом и синхронизированными лимитами; не требует установок и открывается мгновенно.'
    },
    {
      q: 'Как устроен QCoin-майнинг на форуме?',
      a: 'Каждые 4 часа подтверждаете активность и фиксируете награду; задания/квесты и медиапостинг усиливают доходность. VIP получает X2 по времени и X2 по квестам.'
    },
    {
      q: 'Что даёт VIP+ прямо сейчас?',
      a: 'Приоритетный AI-канал, медиапостинг с QCoin-бонусами и золотой бейдж, повышенный вес контента, ранний доступ к экспериментальным индикаторам и ускоренная поддержка.'
    },
    {
      q: 'Какие рыночные данные мы используем?',
      a: 'Агрегированные исторические ряды — 87 ТБ, 37 млрд свечей, cross-exchange унификация, анализ микроструктуры и поведенческих паттернов с учётом ликвидности и спрэда.'
    },
    {
      q: 'Как активируется подписка и почему она мгновенная?',
      a: 'Оплата проходит через NowPayments; как только транзакция подтверждена on-chain, статус VIP включается автоматически во всех компонентах.'
    },
    {
      q: 'Как VIP повлияет на будущий L7-блокчейн?',
      a: 'VIP получает приоритет в распределениях и первой очереди на вывод QCoin, повышенные лимиты, ранние роли валидаторов/стейкеров и доступ к техническим бета-каналам.'
    },
    {
      q: 'Можно ли апгрейдить план без потери времени?',
      a: 'Да. Апгрейд выполняется в пару кликов; неиспользованный остаток переносится и суммируется.'
    },
    {
      q: 'Какие языки поддерживаются?',
      a: 'Семь локалей с едиными терминами сигналов; переключение мгновенное и не ломает разметку интерфейса.'
    },
    {
      q: 'Есть ли требования к верификации?',
      a: 'Работают anti-sybil/anti-fraud механики и поведенческие фильтры; при рисковых сигналах система может запросить дополнительное подтверждение.'
    },
  ],
}

const SUBSCRIBE_UK = {
  sub_title: 'Підписка',
  sub_intro:
    'Quantum L7 — це не «ще один сервіс», а єдиний контур ухвалення рішень. 87 ТБ ринкових даних, 37 млрд історичних свічок across-chains, крос-ексчендж-агрегація, нормалізація ліквідності та latency-aware обробка. Один акаунт відкриває Web-MiniApp, Telegram-бота QL7 AI Bot і Форум із QCoin-майнінгом. MiniApp працює в Telegram і на вебі, рекомендації по біржі вже видаються в реальному часі (торгове ядро та виконання — на фінальній стадії). VIP+ дає безліміт часу ІІ-аналітики, X2 квест-множники та бонусні QCoin-нарахування за медіаконтент (відео/зображення/аудіо), який проходить скоринг рушієм Quantum L7 AI. Оплата — через NowPayments: щойно on-chain підтвердження надійшло, доступ вмикається миттєво та синхронізується в MiniApp/боті/форумі. Попереду — запуск L7-блокчейну нового покоління: VIP отримують підвищений priority tier на розподіл і чергу виведення QCoin, ранній доступ до стейкінгу/валідаторських ролей і підвищені ліміти. Сім мов інтерфейсу, акуратна зв’язка гаманця, сувора дисципліна ризик-менеджменту та «вікна входу» без шуму — усе, щоб тримати тебе в ринковому потоці.',

  sub_wallet_cta: 'Підключити гаманець',
  sub_wallet_cta_note: 'Підключи гаманець — план активується та синхронізується з MiniApp/Telegram/форумом.',
  sub_plans_title: 'Тарифи',

  sub_vip_title: 'VIP+ — X2 QCoin, преміальний AI-канал, медіапостинг, пріоритет L7-мережі',
  sub_vip_price: 'Ціна: 30 USDT / місяць',
  sub_vip_desc: `
    • Єдиний VIP-рівень: MiniApp + Telegram + Веб — статус і ліміти всюди, без розбіжностей і затримок.<br/>
    • Форум-майнінг: кожні 4 години підтверджуй активність і фіксуй QCoin; VIP отримує X2 до часу та X2 квест-мультиплікатор.<br/>
    • Медіапостинг (VIP): відео/зображення/аудіо проходять Quantum L7 AI-скоринг (quality, engagement, anti-spam/anti-sybil) і конвертуються в підвищені QCoin-бонуси.<br/>
    • Рекомендації по ринку: сигнали по символах/TF уже працюють; поглиблений аналіз волатильності, кластеризація обсягів і what-if/backtest доступні з пріоритетом для VIP.<br/>
    • Telegram QL7 AI Bot: розширені квоти, пріоритет відповіді, X2 вікна «on-chain clarity» у піки турбулентності.<br/>
    • NowPayments: крипто-оплата (USDT та ін.) з миттєвою активацією після on-chain підтвердження — без скрінів і ручних перевірок.<br/>
    • L7-блокчейн (майбутній реліз): VIP — верхні рівні черги на виведення QCoin, підвищені капи, ранній доступ до валідаторів/стейкінгу та технічних бета-каналів.<br/>
    • Профіль на форумі: золота відзнака, буст видачі, розширені ліміти на медіа, прискорена модерація та підвищена вага контенту в ранжуванні.<br/>
    • Локалізація на 7 мовах і адаптивний UX від мобільного Telegram до десктопного вебу — один інтерфейс, різні середовища, нуль тертя.<br/>
    • Для тих, кому потрібен темп: precise entries/SL/TP, ризик-контур без зайвої «піни», прозорість розрахунків і чесна економіка винагород.<br/>
  `,

  sub_benefits_title: 'Чому обирають нас',
  sub_benefits: [
    'Дані інституційного рівня: 87 ТБ, 37 млрд свічок, крос-біржовий агрегат ліквідності, уніфікація тік-частоти та глибини стаканів.',
    'MiniApp + Telegram + Форум: одна підписка = спільні квоти, права і прогрес; перемикання контекстів без втрати стану.',
    'QCoin-економіка: активність кожні 4 години, квести, медіапостинг; VIP отримує X2 час/квест-мультиплікатор і підвищену вагу контенту.',
    'AI-аналітика без шуму: фокус на вікнах входу/виходу, SL/TP, ризик-профілі та реальних горизонтах, а не на «новинному» шумі.',
    'Market microstructure: дисперсія спреду, ударні обсяги, імбаланси, VWAP/POC-сценарії та поведінкові патерни — у лаконічній подачі.',
    'NowPayments-онбординг: оплата в крипто і миттєва активація; ніяких ручних підтверджень.',
    'Road to L7-chain: VIP — верхній priority tier для виведення QCoin, стейкінгу та валідаторських програм під час запуску мережі.',
    'Anti-sybil/anti-fraud пайплайни: поведінкові метрики, захист від накруток і чесна розподільна модель.',
    'Преміальний AI-бендвідт: більша частота запитів, коротші затримки, пріоритетна обробка.',
    'Ресерч і альфа-фічі: експериментальні індикатори, закриті канали, ранні бети для просунутих користувачів.',
    'Мультиюридична локалізація: 7 мов, єдина семантика сигналів і інтерфейс без «зламаного» перекладу.',
    'Досвід без лагів: легкий фронт, адаптивні панелі, безшовний flow між ботом, форумом і MiniApp.',
    'Підтримка для темпу: VIP-тікет обробляються з коротким SLA і пріоритетною ескалацією.',
  ],

  sub_payments_title: 'Старт за хвилини',
  sub_payments: [
    '1) Підключіть гаманець — акаунт зв’яжеться з MiniApp/Telegram/форумом.',
    '2) Оберіть VIP+ і оплатіть через NowPayments (USDT та інші мережі).',
    '3) Після on-chain підтвердження підписка активується автоматично — без скрінів і листів.',
    '4) Статус і ліміти синхронізуються в усіх точках: MiniApp, QL7 AI Bot, Форум.',
    '5) Вмикайте QCoin-майнінг: кожні 4 години підтвердження активності + квести; для VIP діє X2.',
    '6) Публікуйте медіа: Quantum L7 AI оцінить і нарахує бонусні QCoin згідно зі скорингом.',
    '7) Слідкуйте за релізом біржі та L7-чейну: VIP — перші в чергах на виведення та ранні ролі в мережі.',
    '8) Керуйте ризиками: використовуйте SL/TP, дотримуйтесь розміру позиції, не переторговуйте волатильність.',
    '9) Оновлюйте план без тертя: апгрейд і продовження в кілька кліків, залишок переноситься.',
    '10) Зберігайте доступ: єдиний акаунт, локальні маркери авторизації та захист від збоїв сесії.',
  ],

  sub_legal_note:
    'Ми надаємо аналітику та інструменти — не фінансові рекомендації. Волатильність висока; контролюйте ризики, розмір позиції та дотримуйтесь дисципліни виконання.',

  sub_faq_title: 'FAQ',
  sub_faq: [
    {
      q: 'Що таке MiniApp і чим він відрізняється від звичайного сайту?',
      a: 'Це кросплатформовий інтерфейс (веб + Telegram) з єдиним акаунтом і синхронізованими лімітами; не потребує встановлення і відкривається миттєво.'
    },
    {
      q: 'Як влаштований QCoin-майнінг на форумі?',
      a: 'Кожні 4 години підтверджуєте активність і фіксуєте нагороду; завдання/квести та медіапостинг підвищують дохідність. VIP отримує X2 за часом і X2 за квестами.'
    },
    {
      q: 'Що дає VIP+ прямо зараз?',
      a: 'Пріоритетний AI-канал, медіапостинг із QCoin-бонусами та золота відзнака, підвищена вага контенту, ранній доступ до експериментальних індикаторів і прискорена підтримка.'
    },
    {
      q: 'Які ринкові дані ми використовуємо?',
      a: 'Агреговані історичні ряди — 87 ТБ, 37 млрд свічок, cross-exchange уніфікація, аналіз мікроструктури та поведінкових патернів із урахуванням ліквідності та спреду.'
    },
    {
      q: 'Як активується підписка і чому вона миттєва?',
      a: 'Оплата проходить через NowPayments; як тільки транзакцію підтверджено on-chain, статус VIP вмикається автоматично у всіх компонентах.'
    },
    {
      q: 'Як VIP вплине на майбутній L7-блокчейн?',
      a: 'VIP отримує пріоритет у розподілах і першу чергу на виведення QCoin, підвищені ліміти, ранні ролі валідаторів/стейкерів і доступ до технічних бета-каналів.'
    },
    {
      q: 'Чи можна апгрейдити план без втрати часу?',
      a: 'Так. Апгрейд виконується в кілька кліків; невикористаний залишок переноситься і сумується.'
    },
    {
      q: 'Які мови підтримуються?',
      a: 'Сім локалей з єдиними термінами сигналів; перемикання миттєве й не ламає розмітку інтерфейсу.'
    },
    {
      q: 'Чи є вимоги до верифікації?',
      a: 'Працюють anti-sybil/anti-fraud механіки та поведінкові фільтри; у разі ризикових сигналів система може запросити додаткове підтвердження.'
    },
  ],
}


const SUBSCRIBE_TR = {
  sub_title: 'Abonelik',
  sub_intro:
    'Quantum L7 “bir başka servis” değil, tekil bir karar alma çevrimidir. 87 TB piyasa verisi, zincirler-arası 37 milyar tarihsel mum, cross-exchange agregasyon, likidite normalizasyonu ve latency-aware işleme. Tek hesapla Web-MiniApp, QL7 AI Bot adlı Telegram botu ve QCoin madenciliği olan Foruma erişim açılır. MiniApp Telegram’da ve web’de yaşar; borsa tavsiyeleri hâlihazırda gerçek zamanlı veriliyor (ticaret çekirdeği ve yürütme — son aşamada). VIP+ sınırsız İA-analizi süresi, X2 görev/quest çarpanları ve Quantum L7 AI motorunun skorlama sürecinden geçen medya içerikleri (video/görseller/ses) için bonus QCoin tahakkukları sağlar. Ödeme — NowPayments üzerinden: on-chain onay düşer düşmez erişim anında açılır ve MiniApp/bot/forumda senkronize edilir. İleride — yeni nesil L7 blokzincirinin lansmanı: VIP’ler dağıtım ve QCoin çekim kuyruğunda yükseltilmiş priority tier, staking/validator rollerine erken erişim ve artırılmış limitler alır. Yedi arayüz dili, düzgün cüzdan bağlama, sıkı risk yönetimi disiplini ve gürültüsüz “giriş pencereleri” — seni piyasa akışında tutmak için her şey.',

  sub_wallet_cta: 'Cüzdanı bağla',
  sub_wallet_cta_note: 'Cüzdanı bağlayın — plan etkinleşir ve MiniApp/Telegram/forum ile senkronize edilir.',
  sub_plans_title: 'Tarifeler',

  sub_vip_title: 'VIP+ — X2 QCoin, premium AI kanal, medya gönderimi, L7 ağı önceliği',
  sub_vip_price: 'Fiyat: 30 USDT / ay',
  sub_vip_desc: `
    • Tekil VIP katmanı: MiniApp + Telegram + Web — statü ve limitler her yerde, sapma ve gecikme olmadan.<br/>
    • Forum madenciliği: her 4 saatte bir aktiviteyi onayla ve QCoin’i sabitle; VIP zaman için X2 ve görev/quest çarpanı için X2 alır.<br/>
    • Medya gönderimi (VIP): video/görseller/ses Quantum L7 AI skorlama (quality, engagement, anti-spam/anti-sybil) sürecinden geçer ve artırılmış QCoin bonuslarına dönüştürülür.<br/>
    • Piyasa tavsiyeleri: sembol/TF sinyalleri zaten çalışıyor; oynaklığın derinlemesine analizi, hacim kümeleme ve what-if/backtest VIP için öncelikli erişimdedir.<br/>
    • Telegram QL7 AI Bot: genişletilmiş kotalar, yanıt önceliği, türbülans piklerinde X2 “on-chain clarity” pencereleri.<br/>
    • NowPayments: on-chain onaydan sonra anında aktivasyonlu kripto ödeme (USDT ve diğerleri) — ekran görüntüsü ve manuel kontrol yok.<br/>
    • L7 blokzinciri (yaklaşan sürüm): VIP — QCoin çekim kuyruğunun üst katmanları, artırılmış cap’ler, validator/staking ve teknik beta kanallarına erken erişim.<br/>
    • Forum profili: altın rozet, gösterim boostu, medya için genişletilmiş limitler, hızlandırılmış moderasyon ve sıralamada içeriğin artırılmış ağırlığı.<br/>
    • 7 dilde yerelleştirme ve mobil Telegram’dan masaüstü webe kadar uyarlanabilir UX — tek arayüz, farklı ortamlar, sıfır sürtünme.<br/>
    • Hıza ihtiyacı olanlar için: precise entries/SL/TP, gereksiz “köpük” olmadan risk konturu, şeffaf hesaplamalar ve adil ödül ekonomisi.<br/>
  `,

  sub_benefits_title: 'Neden bizi seçiyorlar',
  sub_benefits: [
    'Kurumsal düzeyde veri: 87 TB, 37 milyar mum, borsa-ötesi likidite agregatörü, tik frekansının ve emir defteri derinliklerinin birleştirilmesi.',
    'MiniApp + Telegram + Forum: tek abonelik = ortak kotalar, haklar ve ilerleme; durum kaybı olmadan bağlamlar arasında geçiş.',
    'QCoin ekonomisi: her 4 saatte aktivite, görevler, medya gönderimi; VIP X2 zaman/quest çarpanı ve içeriğin artırılmış ağırlığını alır.',
    'Gürültüsüz AI analitiği: giriş/çıkış pencerelerine, SL/TP’ye, risk profilene ve gerçek ufuklara odaklanma — “haber” gürültüsüne değil.',
    'Market microstructure: spread dağılımı, darbe hacimleri, dengesizlikler, VWAP/POC senaryoları ve davranışsal pattern’ler — yalın sunumla.',
    'NowPayments onboarding: kripto ile ödeme ve anında aktivasyon; hiçbir manuel onay yok.',
    'Road to L7-chain: VIP — ağ lansmanında QCoin çekimi, staking ve validator programları için üst priority tier.',
    'Anti-sybil/anti-fraud pipeline’lar: davranış metrikleri, manipülasyona karşı koruma ve adil dağıtım modeli.',
    'Premium AI bant genişliği: daha yüksek istek sıklığı, daha kısa gecikmeler, öncelikli işleme.',
    'Research ve alfa özellikleri: deneysel indikatörler, kapalı kanallar, ileri düzey kullanıcılar için erken betalar.',
    'Çok yargı alanlı yerelleştirme: 7 dil, birleşik sinyal semantiği ve “bozuk” çeviri olmadan arayüz.',
    'Lagsiz deneyim: hafif front-end, uyarlanabilir paneller, bot, forum ve MiniApp arasında kesintisiz flow.',
    'Hız için destek: VIP ticket’lar kısa SLA ve öncelikli eskalasyonla işlenir.',
  ],

  sub_payments_title: 'Dakikalar içinde başlangıç',
  sub_payments: [
    '1) Cüzdanı bağlayın — hesap MiniApp/Telegram/forum ile ilişkilendirilecektir.',
    '2) VIP+’ı seçin ve NowPayments üzerinden ödeyin (USDT ve diğer ağlar).',
    '3) On-chain onaydan sonra abonelik otomatik olarak etkinleşir — ekran görüntüsü ve e-posta yok.',
    '4) Statü ve limitler tüm noktalarda senkronize edilir: MiniApp, QL7 AI Bot, Forum.',
    '5) QCoin madenciliğini açın: her 4 saatte aktivite onayı + görevler; VIP için X2 geçerlidir.',
    '6) Medya yayınlayın: Quantum L7 AI değerlendirir ve skorlama uyarınca bonus QCoin tahsis eder.',
    '7) Borsa ve L7-zinciri sürümünü takip edin: VIP — çekim kuyruklarında ilkler ve ağda erken roller.',
    '8) Riskleri yönetin: SL/TP kullanın, pozisyon boyutunu koruyun, oynaklığı aşırı işlemeyin.',
    '9) Sürtünmesiz plan güncelleyin: birkaç tıklamayla upgrade ve yenileme, kalan süre taşınır.',
    '10) Erişimi koruyun: tek hesap, yerel yetkilendirme belirteçleri ve oturum arızalarına karşı koruma.',
  ],

  sub_legal_note:
    'Biz analiz ve araçlar sağlarız — finansal tavsiye değil. Oynaklık yüksektir; riskleri, pozisyon boyutunu kontrol edin ve yürütme disiplinine uyun.',

  sub_faq_title: 'FAQ',
  sub_faq: [
    {
      q: 'MiniApp nedir ve sıradan bir siteden nasıl farklıdır?',
      a: 'Tek hesap ve senkronize limitlerle (web + Telegram) çapraz platform bir arayüzdür; kurulum gerektirmez ve anında açılır.'
    },
    {
      q: 'Forumda QCoin madenciliği nasıl düzenlenmiştir?',
      a: 'Her 4 saatte aktiviteyi onaylar ve ödülü sabitlersiniz; görevler/quest’ler ve medya gönderimi kârlılığı artırır. VIP zaman ve görevlerde X2 alır.'
    },
    {
      q: 'VIP+ şu anda ne sağlar?',
      a: 'Öncelikli AI kanal, QCoin bonuslu medya gönderimi ve altın rozet, içeriğin artırılmış ağırlığı, deneysel indikatörlere erken erişim ve hızlandırılmış destek.'
    },
    {
      q: 'Hangi piyasa verilerini kullanıyoruz?',
      a: 'Agregat tarihsel seriler — 87 TB, 37 milyar mum, cross-exchange birlikteliği, likidite ve spread dikkate alınarak mikro yapı ve davranışsal pattern analizi.'
    },
    {
      q: 'Abonelik nasıl etkinleşir ve neden anındadır?',
      a: 'Ödeme NowPayments üzerinden geçer; işlem on-chain onaylanır onaylanmaz VIP statüsü tüm bileşenlerde otomatik olarak açılır.'
    },
    {
      q: 'VIP gelecekteki L7 blokzincirini nasıl etkiler?',
      a: 'VIP dağıtımlarda öncelik ve QCoin çekimleri için ilk sırayı, daha yüksek limitleri, validator/staker rollerine erken erişimi ve teknik beta kanallarına erişimi alır.'
    },
    {
      q: 'Planı zaman kaybı olmadan upgrade etmek mümkün mü?',
      a: 'Evet. Upgrade birkaç tıklamada yapılır; kullanılmayan bakiye taşınır ve toplanır.'
    },
    {
      q: 'Hangi diller desteklenir?',
      a: 'Birleşik sinyal terimleriyle yedi lokal; geçiş anlıktır ve arayüz yerleşimini bozmaz.'
    },
    {
      q: 'Doğrulama gereksinimleri var mı?',
      a: 'Anti-sybil/anti-fraud mekanikleri ve davranış filtreleri çalışır; riskli sinyallerde sistem ek doğrulama isteyebilir.'
    },
  ],
}


const SUBSCRIBE_ES = {
  sub_title: 'Suscripción',
  sub_intro:
    'Quantum L7 no es "otro servicio más", sino un único circuito de toma de decisiones. 87 TB de datos de mercado, 37 mil millones de velas históricas across-chains, agregación cross-exchange, normalización de liquidez y procesamiento con reconocimiento de latencia. Una sola cuenta abre el Web-MiniApp, el bot de Telegram QL7 AI Bot y el Foro con minería de QCoin. MiniApp funciona en Telegram y en la web; las recomendaciones de intercambio ya se entregan en tiempo real (el núcleo comercial y la ejecución están en la etapa final). VIP+ otorga tiempo ilimitado de analítica de IA, multiplicadores de misiones X2 y bonificaciones QCoin por contenido multimedia (video/imágenes/audio) que pasa la puntuación del motor Quantum L7 AI. El pago se realiza a través de NowPayments: tan pronto como llegue la confirmación on-chain, el acceso se activa al instante y se sincroniza en MiniApp/bot/foro. Próximamente — el lanzamiento del blockchain de nueva generación L7: los VIP reciben un nivel de prioridad más alto para la distribución y la cola de retiro de QCoin, acceso anticipado a staking/roles de validadores y límites aumentados. Siete idiomas de interfaz, vinculación precisa de la billetera, estricta disciplina de gestión de riesgos y "ventanas de entrada" sin ruido — todo para mantenerte en el flujo del mercado.',

  sub_wallet_cta: 'Conectar billetera',
  sub_wallet_cta_note: 'Conecta tu billetera — el plan se activará y se sincronizará con MiniApp/Telegram/foro.',
  sub_plans_title: 'Planes',

  sub_vip_title: 'VIP+ — X2 QCoin, canal premium de IA, publicación multimedia, prioridad de la red L7',
  sub_vip_price: 'Precio: 30 USDT / mes',
  sub_vip_desc: `
    • Capa VIP unificada: MiniApp + Telegram + Web — estado y límites en todas partes, sin discrepancias ni demoras.<br/>
    • Minería del foro: cada 4 horas confirma actividad y fija QCoin; el VIP recibe X2 en tiempo y X2 multiplicador de misiones.<br/>
    • Publicación multimedia (VIP): video/imágenes/audio pasan la puntuación de Quantum L7 AI (quality, engagement, anti-spam/anti-sybil) y se convierten en bonificaciones QCoin aumentadas.<br/>
    • Recomendaciones de mercado: las señales por símbolos/TF ya funcionan; análisis avanzado de volatilidad, agrupación de volúmenes y what-if/backtest están disponibles con prioridad para VIP.<br/>
    • Telegram QL7 AI Bot: cuotas ampliadas, prioridad de respuesta, ventanas X2 de "on-chain clarity" en picos de turbulencia.<br/>
    • NowPayments: pago en criptomonedas (USDT y otras) con activación instantánea tras la confirmación on-chain — sin capturas de pantalla ni verificaciones manuales.<br/>
    • Blockchain L7 (próximo lanzamiento): VIP — niveles superiores en la cola de retiro de QCoin, límites más altos, acceso temprano a validadores/staking y canales beta técnicos.<br/>
    • Perfil en el foro: insignia dorada, aumento de exposición, límites ampliados de medios, moderación acelerada y mayor peso del contenido en el ranking.<br/>
    • Localización en 7 idiomas y UX adaptable desde Telegram móvil hasta web de escritorio — una sola interfaz, diferentes entornos, fricción cero.<br/>
    • Para quienes necesitan ritmo: precise entries/SL/TP, contorno de riesgo sin "espuma" innecesaria, transparencia en los cálculos y economía justa de recompensas.<br/>
  `,

  sub_benefits_title: 'Por qué nos eligen',
  sub_benefits: [
    'Datos de nivel institucional: 87 TB, 37 mil millones de velas, agregador de liquidez cross-exchange, unificación de frecuencia de ticks y profundidad de libros de órdenes.',
    'MiniApp + Telegram + Foro: una suscripción = cuotas, derechos y progreso compartidos; cambio de contexto sin pérdida de estado.',
    'Economía QCoin: actividad cada 4 horas, misiones, publicaciones multimedia; VIP obtiene X2 en tiempo/multiplicador de misiones y mayor peso del contenido.',
    'Analítica de IA sin ruido: enfoque en ventanas de entrada/salida, SL/TP, perfil de riesgo y horizontes reales, no en ruido "noticioso".',
    'Market microstructure: dispersión del spread, volúmenes de impacto, desequilibrios, escenarios VWAP/POC y patrones de comportamiento — presentados de forma concisa.',
    'Onboarding con NowPayments: pago en cripto y activación instantánea; sin confirmaciones manuales.',
    'Camino hacia L7-chain: VIP — nivel de prioridad superior para retiro de QCoin, staking y programas de validadores al lanzamiento de la red.',
    'Pipelines Anti-sybil/anti-fraud: métricas de comportamiento, protección contra manipulaciones y modelo de distribución justo.',
    'Ancho de banda de IA premium: mayor frecuencia de solicitudes, menor latencia, procesamiento prioritario.',
    'Investigación y funciones alfa: indicadores experimentales, canales privados, betas tempranas para usuarios avanzados.',
    'Localización multijurisdiccional: 7 idiomas, semántica unificada de señales e interfaz sin traducciones "rotas".',
    'Experiencia sin retrasos: front-end liviano, paneles adaptativos, flujo fluido entre bot, foro y MiniApp.',
    'Soporte para el ritmo: los tickets VIP se procesan con SLA corto y escalamiento prioritario.',
  ],

  sub_payments_title: 'Comienza en minutos',
  sub_payments: [
    '1) Conecta tu billetera — la cuenta se vinculará con MiniApp/Telegram/foro.',
    '2) Elige VIP+ y paga a través de NowPayments (USDT y otras redes).',
    '3) Tras la confirmación on-chain, la suscripción se activa automáticamente — sin capturas ni correos.',
    '4) Estado y límites se sincronizan en todos los puntos: MiniApp, QL7 AI Bot, Foro.',
    '5) Activa la minería QCoin: cada 4 horas confirmación de actividad + misiones; VIP recibe X2.',
    '6) Publica medios: Quantum L7 AI evaluará y acreditará QCoin de bonificación según la puntuación.',
    '7) Sigue el lanzamiento del exchange y la cadena L7: VIP — los primeros en las colas de retiro y roles tempranos en la red.',
    '8) Gestiona riesgos: usa SL/TP, mantén el tamaño de la posición, no sobreopere la volatilidad.',
    '9) Actualiza el plan sin fricción: actualización y renovación en unos clics, el saldo restante se transfiere.',
    '10) Conserva el acceso: cuenta única, marcadores locales de autorización y protección contra fallos de sesión.',
  ],

  sub_legal_note:
    'Proporcionamos analítica y herramientas — no asesoramiento financiero. La volatilidad es alta; controla tus riesgos, el tamaño de tu posición y mantén la disciplina de ejecución.',

  sub_faq_title: 'FAQ',
  sub_faq: [
    {
      q: '¿Qué es MiniApp y en qué se diferencia de un sitio web normal?',
      a: 'Es una interfaz multiplataforma (web + Telegram) con una sola cuenta y límites sincronizados; no requiere instalación y se abre al instante.'
    },
    {
      q: '¿Cómo funciona la minería de QCoin en el foro?',
      a: 'Cada 4 horas confirmas actividad y fijas la recompensa; las misiones y publicaciones multimedia aumentan la rentabilidad. El VIP obtiene X2 en tiempo y X2 en misiones.'
    },
    {
      q: '¿Qué ofrece VIP+ ahora mismo?',
      a: 'Canal de IA prioritario, publicación multimedia con bonificaciones QCoin e insignia dorada, mayor peso del contenido, acceso temprano a indicadores experimentales y soporte acelerado.'
    },
    {
      q: '¿Qué datos de mercado utilizamos?',
      a: 'Series históricas agregadas — 87 TB, 37 mil millones de velas, unificación cross-exchange, análisis de microestructura y patrones de comportamiento teniendo en cuenta liquidez y spread.'
    },
    {
      q: '¿Cómo se activa la suscripción y por qué es instantánea?',
      a: 'El pago se realiza a través de NowPayments; tan pronto como la transacción se confirme on-chain, el estado VIP se activa automáticamente en todos los componentes.'
    },
    {
      q: '¿Cómo afectará el VIP al futuro blockchain L7?',
      a: 'El VIP recibe prioridad en las distribuciones y primeras filas para retiros de QCoin, límites aumentados, roles tempranos de validadores/stakers y acceso a canales beta técnicos.'
    },
    {
      q: '¿Se puede actualizar el plan sin perder tiempo?',
      a: 'Sí. La actualización se realiza en unos pocos clics; el saldo no utilizado se transfiere y acumula.'
    },
    {
      q: '¿Qué idiomas son compatibles?',
      a: 'Siete locales con terminología unificada de señales; el cambio es instantáneo y no rompe el diseño de la interfaz.'
    },
    {
      q: '¿Hay requisitos de verificación?',
      a: 'Funcionan mecanismos anti-sybil/anti-fraud y filtros de comportamiento; ante señales de riesgo, el sistema puede solicitar verificación adicional.'
    },
  ],
}


const SUBSCRIBE_AR = {
  sub_title: 'الاشتراك',
  sub_intro:
    'Quantum L7 ليست "خدمة أخرى"، بل هي دائرة موحدة لاتخاذ القرار. 87 تيرابايت من بيانات السوق، 37 مليار شمعة تاريخية عبر السلاسل، تجميع عبر البورصات، توحيد السيولة ومعالجة مدركة للتأخير (latency-aware). حساب واحد يفتح Web-MiniApp، روبوت تيليجرام QL7 AI Bot والمنتدى مع تعدين QCoin. MiniApp يعمل داخل تيليجرام وعلى الويب؛ التوصيات الخاصة بالتداول تُقدَّم بالفعل في الوقت الفعلي (النواة التجارية والتنفيذ في المرحلة النهائية). VIP+ يمنح وقتاً غير محدود لتحليل الذكاء الاصطناعي، مضاعفات مهام X2 ومكافآت QCoin إضافية على المحتوى الإعلامي (فيديو/صور/صوت) الذي يتم تقييمه بواسطة محرك Quantum L7 AI. الدفع عبر NowPayments: بمجرد وصول تأكيد on-chain، يتم تفعيل الوصول فوراً ويتزامن مع MiniApp/الروبوت/المنتدى. قريباً — إطلاق سلسلة كتل L7 من الجيل الجديد: يحصل المستخدمون VIP على مستوى أولوية أعلى للتوزيع وصف انتظار السحب لـ QCoin، وصول مبكر إلى أدوار الـ staking/المدققين وحدود أعلى. سبع لغات للواجهة، ربط محفظة دقيق، انضباط صارم لإدارة المخاطر و"نوافذ دخول" بدون ضوضاء — كل ذلك لإبقائك في تدفق السوق.',

  sub_wallet_cta: 'ربط المحفظة',
  sub_wallet_cta_note: 'قم بربط محفظتك — سيتم تفعيل الخطة ومزامنتها مع MiniApp/تيليجرام/المنتدى.',
  sub_plans_title: 'الخطط',

  sub_vip_title: 'VIP+ — X2 QCoin، قناة ذكاء اصطناعي مميزة، نشر وسائط، أولوية شبكة L7',
  sub_vip_price: 'السعر: 30 USDT / شهرياً',
  sub_vip_desc: `
    • طبقة VIP موحدة: MiniApp + تيليجرام + الويب — الحالة والحدود في كل مكان، بدون تأخير أو اختلاف.<br/>
    • تعدين المنتدى: كل 4 ساعات أكد النشاط وثبت QCoin؛ يحصل VIP على X2 في الوقت وX2 في مضاعف المهام.<br/>
    • نشر الوسائط (VIP): الفيديو/الصور/الصوت يتم تقييمها عبر نظام Quantum L7 AI (الجودة، التفاعل، مكافحة البريد العشوائي/الهوية المزيفة) وتتحول إلى مكافآت QCoin أعلى.<br/>
    • توصيات السوق: الإشارات على الرموز/TF تعمل بالفعل؛ تحليل متقدم للتقلبات، تجميع الأحجام، وما-إذا/اختبارات رجعية متاحة بأولوية لـ VIP.<br/>
    • روبوت تيليجرام QL7 AI: حصص موسعة، أولوية في الرد، نوافذ X2 لـ "on-chain clarity" في فترات الاضطراب.<br/>
    • NowPayments: الدفع بالعملات المشفرة (USDT وغيرها) مع تفعيل فوري بعد تأكيد on-chain — بدون لقطات شاشة أو تحقق يدوي.<br/>
    • سلسلة كتل L7 (الإصدار القادم): VIP — في أعلى طبقات صف السحب لـ QCoin، حدود أعلى، وصول مبكر إلى المدققين/staking والقنوات التجريبية التقنية.<br/>
    • الملف الشخصي في المنتدى: شارة ذهبية، تعزيز الظهور، حدود موسعة للوسائط، إشراف أسرع وزيادة وزن المحتوى في التصنيف.<br/>
    • توطين بـ 7 لغات وتجربة مستخدم متكيفة من تيليجرام للهاتف إلى الويب المكتبي — واجهة واحدة، بيئات مختلفة، بدون احتكاك.<br/>
    • لمن يحتاجون إلى السرعة: نقاط دخول/SL/TP دقيقة، محيط مخاطر بدون "رغوة" زائدة، شفافية الحسابات واقتصاد مكافآت عادل.<br/>
  `,

  sub_benefits_title: 'لماذا يختاروننا',
  sub_benefits: [
    'بيانات بمستوى المؤسسات: 87 تيرابايت، 37 مليار شمعة، مجمّع سيولة عبر البورصات، توحيد ترددات الـ tick وعمق دفاتر الأوامر.',
    'MiniApp + تيليجرام + المنتدى: اشتراك واحد = حصص وحقوق وتقدم مشترك؛ التبديل بين السياقات بدون فقدان الحالة.',
    'اقتصاد QCoin: نشاط كل 4 ساعات، مهام، نشر وسائط؛ يحصل VIP على X2 في الوقت/مضاعف المهام وزيادة وزن المحتوى.',
    'تحليلات ذكاء اصطناعي بدون ضوضاء: تركيز على نوافذ الدخول/الخروج، SL/TP، ملف المخاطر والآفاق الواقعية، وليس "ضوضاء الأخبار".',
    'هيكل السوق المصغر: تباين الفارق السعري، أحجام الصفقات المفاجئة، اختلالات، سيناريوهات VWAP/POC وأنماط سلوكية — بشكل مختصر وواضح.',
    'الانضمام عبر NowPayments: الدفع بالعملات المشفرة والتفعيل الفوري؛ بدون تأكيدات يدوية.',
    'الطريق إلى سلسلة L7: VIP — أعلى مستوى أولوية لسحب QCoin، staking وبرامج المدققين عند إطلاق الشبكة.',
    'قنوات مكافحة sybil/الاحتيال: مقاييس سلوكية، حماية من التلاعب ونموذج توزيع عادل.',
    'عرض نطاق ذكاء اصطناعي متميز: تكرار طلبات أعلى، تأخير أقصر، معالجة أولوية.',
    'بحث وميزات ألفا: مؤشرات تجريبية، قنوات مغلقة، إصدارات بيتا مبكرة للمستخدمين المتقدمين.',
    'توطين متعدد القوانين: 7 لغات، دلالات إشارات موحدة وواجهة بدون ترجمة "مكسورة".',
    'تجربة بدون تأخير: واجهة أمامية خفيفة، لوحات قابلة للتكيف، تدفق سلس بين الروبوت، المنتدى وMiniApp.',
    'دعم السرعة: تذاكر VIP تتم معالجتها بوقت SLA قصير وتصعيد أولوية.',
  ],

  sub_payments_title: 'ابدأ خلال دقائق',
  sub_payments: [
    '1) اربط محفظتك — سيتم ربط الحساب بـ MiniApp/تيليجرام/المنتدى.',
    '2) اختر VIP+ وادفع عبر NowPayments (USDT وشبكات أخرى).',
    '3) بعد تأكيد on-chain، يتم تفعيل الاشتراك تلقائياً — بدون لقطات شاشة أو رسائل.',
    '4) يتم مزامنة الحالة والحدود في جميع النقاط: MiniApp، QL7 AI Bot، المنتدى.',
    '5) فعّل تعدين QCoin: كل 4 ساعات تأكيد نشاط + مهام؛ VIP يحصل على X2.',
    '6) انشر الوسائط: يقوم Quantum L7 AI بالتقييم ومنح مكافآت QCoin الإضافية حسب النتيجة.',
    '7) تابع إصدار المنصة وسلسلة L7: VIP — الأوائل في صفوف السحب والأدوار المبكرة في الشبكة.',
    '8) أدر المخاطر: استخدم SL/TP، حافظ على حجم الصفقة، لا تتداول بشكل مفرط أثناء التقلب.',
    '9) قم بتحديث الخطة بدون احتكاك: ترقية وتجديد بنقرات قليلة، ويتم ترحيل الرصيد المتبقي.',
    '10) احفظ الوصول: حساب موحد، رموز تفويض محلية وحماية من فشل الجلسات.',
  ],

  sub_legal_note:
    'نحن نوفر تحليلات وأدوات — ولسنا نصائح مالية. التقلب مرتفع؛ راقب المخاطر، حجم الصفقة والتزم بانضباط التنفيذ.',

  sub_faq_title: 'الأسئلة الشائعة',
  sub_faq: [
    {
      q: 'ما هو MiniApp وكيف يختلف عن الموقع العادي؟',
      a: 'إنه واجهة متعددة المنصات (الويب + تيليجرام) بحساب واحد وحدود متزامنة؛ لا يتطلب تثبيت ويفتح فوراً.'
    },
    {
      q: 'كيف يعمل تعدين QCoin في المنتدى؟',
      a: 'كل 4 ساعات تؤكد النشاط وتثبت المكافأة؛ المهام والنشر الإعلامي يزيدان العائد. يحصل VIP على X2 في الوقت وX2 في المهام.'
    },
    {
      q: 'ما الذي يقدمه VIP+ حالياً؟',
      a: 'قناة ذكاء اصطناعي أولوية، نشر وسائط مع مكافآت QCoin وشارة ذهبية، زيادة وزن المحتوى، وصول مبكر إلى مؤشرات تجريبية ودعم أسرع.'
    },
    {
      q: 'ما البيانات السوقية التي نستخدمها؟',
      a: 'سلاسل تاريخية مجمعة — 87 تيرابايت، 37 مليار شمعة، توحيد عبر البورصات، تحليل البنية الدقيقة والسلوك مع مراعاة السيولة والفارق السعري.'
    },
    {
      q: 'كيف يتم تفعيل الاشتراك ولماذا هو فوري؟',
      a: 'يتم الدفع عبر NowPayments؛ وبمجرد تأكيد المعاملة on-chain، يتم تفعيل حالة VIP تلقائياً في جميع المكونات.'
    },
    {
      q: 'كيف سيؤثر VIP على سلسلة كتل L7 المستقبلية؟',
      a: 'يحصل VIP على أولوية في التوزيع والصف الأول لسحب QCoin، حدود أعلى، أدوار مبكرة للمدققين/stakers والوصول إلى القنوات التجريبية التقنية.'
    },
    {
      q: 'هل يمكن ترقية الخطة دون فقدان الوقت؟',
      a: 'نعم. تتم الترقية بنقرات قليلة؛ ويتم ترحيل الرصيد غير المستخدم وجمعه.'
    },
    {
      q: 'ما اللغات المدعومة؟',
      a: 'سبع لغات محلية بمصطلحات إشارات موحدة؛ التبديل فوري ولا يكسر تنسيق الواجهة.'
    },
    {
      q: 'هل هناك متطلبات للتحقق؟',
      a: 'تعمل آليات مكافحة sybil/الاحتيال والفلاتر السلوكية؛ عند الإشارات الخطرة قد يطلب النظام تحققاً إضافياً.'
    },
  ],
}


const SUBSCRIBE_ZH = {
  sub_title: '订阅',
  sub_intro:
    'Quantum L7 不是“又一个服务”，而是统一的决策闭环。87 TB 市场数据，跨链（across-chains）370 亿条历史K线，跨交易所聚合、流动性归一化与感知延迟（latency-aware）处理。一个账号即可开启 Web-MiniApp、Telegram 机器人 QL7 AI Bot 和带有 QCoin 挖矿的论坛。MiniApp 同时运行在 Telegram 与网页端，交易所推荐已实时给出（交易内核与执行——处于最终阶段）。VIP+ 提供不限时的 AI 分析、X2 任务倍增器，以及对通过 Quantum L7 AI 引擎打分的媒体内容（视频/图片/音频）的 QCoin 奖励计入。支付——通过 NowPayments：一旦链上（on-chain）确认到达，访问即刻开启，并在 MiniApp/机器人/论坛中同步。接下来——新一代 L7 区块链上线：VIP 获得更高的分发优先级层（priority tier）与 QCoin 提现队列优先、对质押/验证者角色的早期访问以及更高的限额。七种界面语言、严谨的钱包绑定、严格的风险管理纪律与无噪声的“入场窗口”——一切只为让你保持在市场流中。',

  sub_wallet_cta: '连接钱包',
  sub_wallet_cta_note: '连接钱包——计划将被激活并与 MiniApp/Telegram/论坛同步。',
  sub_plans_title: '套餐',

  sub_vip_title: 'VIP+ — X2 QCoin，高级 AI 频道，媒体发布，L7 网络优先级',
  sub_vip_price: '价格: 30 USDT / 月',
  sub_vip_desc: `
    • 统一的 VIP 层：MiniApp + Telegram + Web —— 各处同一状态与限额，无差异无延迟。<br/>
    • 论坛挖矿：每 4 小时确认活跃并记账 QCoin；VIP 获得时间 X2 与任务倍增 X2。<br/>
    • 媒体发布（VIP）：视频/图片/音频通过 Quantum L7 AI 评分（quality、engagement、anti-spam/anti-sybil），并转换为更高的 QCoin 奖励。<br/>
    • 市场推荐：按符号/TF 的信号已就绪；更深入的波动性分析、成交量聚类与 what-if/backtest 向 VIP 优先开放。<br/>
    • Telegram QL7 AI Bot：更高配额、回复优先、在动荡高峰期提供 X2 的“on-chain clarity” 窗口。<br/>
    • NowPayments：加密支付（USDT 等），链上确认后即刻激活——无需截图与人工核验。<br/>
    • L7 区块链（即将发布）：VIP —— 处于 QCoin 提现队列的更高层级，更高上限，提前获取验证者/质押与技术测试渠道。<br/>
    • 论坛个人资料：金色徽章、曝光提升、更高的媒体限额、更快的审核，以及内容在排序中的更高权重。<br/>
    • 7 种语言本地化与自适应 UX（从移动端 Telegram 到桌面端网页）——一个界面、不同环境、零摩擦。<br/>
    • 适合需要节奏的人：precise entries/SL/TP，无多余“泡沫”的风险轮廓，计算透明与公平的奖励经济。<br/>
  `,

  sub_benefits_title: '为什么选择我们',
  sub_benefits: [
    '机构级数据：87 TB、370 亿条K线、跨交易所流动性聚合器、统一的 tick 频率与订单簿深度。',
    'MiniApp + Telegram + 论坛：一份订阅 = 共享配额、权限与进度；上下文切换不丢状态。',
    'QCoin 经济：每 4 小时活跃、任务、媒体发布；VIP 获得 X2 时间/任务倍增与更高的内容权重。',
    '无噪音的 AI 分析：聚焦入场/出场窗口、SL/TP、风险画像与真实周期，而非“新闻”噪音。',
    'Market microstructure：价差离散度、冲击性成交量、失衡、VWAP/POC 场景与行为模式——简洁呈现。',
    'NowPayments 上线引导：加密支付与即时激活；无需人工确认。',
    '通往 L7-chain：VIP —— 在网络启动时，对 QCoin 提现、质押与验证者计划处于更高的优先级层。',
    'Anti-sybil/anti-fraud 流水线：行为度量、反刷保护与公平的分配模型。',
    '高级 AI 带宽：更高请求频率、更短时延、优先处理。',
    '研究与 Alpha 特性：实验性指标、私有频道、面向高级用户的早期测试版。',
    '多法域本地化：7 种语言、统一的信号语义与不“破版”的界面翻译。',
    '无卡顿体验：轻量前端、自适应面板，机器人、论坛与 MiniApp 间无缝流转。',
    '面向节奏的支持：VIP 工单以更短 SLA 与优先级升级处理。',
  ],

  sub_payments_title: '几分钟即可开始',
  sub_payments: [
    '1) 连接钱包——账号将关联到 MiniApp/Telegram/论坛。',
    '2) 选择 VIP+ 并通过 NowPayments 支付（USDT 与其他网络）。',
    '3) 链上确认后，订阅将自动激活——无需截图与邮件。',
    '4) 状态与限额在各处同步：MiniApp、QL7 AI Bot、论坛。',
    '5) 开启 QCoin 挖矿：每 4 小时进行活跃确认 + 任务；VIP 享有 X2。',
    '6) 发布媒体：Quantum L7 AI 将评估并按评分发放 QCoin 奖励。',
    '7) 关注交易所与 L7 链的发布：VIP —— 提现队列优先且获得网络中的早期角色。',
    '8) 管理风险：使用 SL/TP，控制仓位大小，勿过度交易波动性。',
    '9) 无摩擦地更新计划：数次点击即可升级与续订，剩余时间可结转。',
    '10) 保持访问：统一账号、本地授权标记与会话故障保护。',
  ],

  sub_legal_note:
    '我们提供分析与工具——并非财务建议。波动性较高；请控制风险、仓位大小并遵守执行纪律。',

  sub_faq_title: 'FAQ',
  sub_faq: [
    {
      q: '什么是 MiniApp，它与普通网站有何不同？',
      a: '这是一个跨平台界面（Web + Telegram），采用单一账号与同步限额；无需安装并可即时打开。'
    },
    {
      q: '论坛中的 QCoin 挖矿如何运作？',
      a: '每 4 小时确认活跃并记账奖励；任务/任务（quests）与媒体发布提升收益。VIP 在时间与任务上获得 X2。'
    },
    {
      q: 'VIP+ 现在能带来什么？',
      a: '优先级 AI 频道、带 QCoin 奖励的媒体发布与金色徽章、更高的内容权重、对实验性指标的早期访问与加速支持。'
    },
    {
      q: '我们使用哪些市场数据？',
      a: '聚合的历史序列——87 TB、370 亿条K线、跨交易所统一，结合流动性与价差进行微观结构与行为模式分析。'
    },
    {
      q: '订阅如何激活，为什么是即时的？',
      a: '支付通过 NowPayments 进行；一旦交易在链上确认，VIP 状态会在所有组件中自动开启。'
    },
    {
      q: 'VIP 将如何影响未来的 L7 区块链？',
      a: 'VIP 在分配与 QCoin 提现中享有优先、获得更高限额、对验证者/质押者角色的早期访问，以及进入技术测试频道。'
    },
    {
      q: '能否在不损失时间的情况下升级计划？',
      a: '可以。升级只需几次点击；未用余额会结转并累计。'
    },
    {
      q: '支持哪些语言？',
      a: '七种本地化与统一的信号术语；切换即时且不破坏界面布局。'
    },
    {
      q: '是否有验证要求？',
      a: 'Anti-sybil/anti-fraud 机制与行为过滤已启用；在风险信号下，系统可能要求额外验证。'
    },
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
  ai_unlimit_title: 'Remove Limit — VIP+',
  ai_unlimit_price: 'Price: $30 / month',
  ai_unlimit_desc:
    'Unlock 24/7 access to AI Box on this account and enable the extended VIP perimeter across the entire Quantum L7 ecosystem. The daily browser quota is disabled for 30 days after on-chain payment confirmation via NowPayments — activation is automatic, with no screenshots or messaging required. VIP status is synchronized between the web version, MiniApp and the Telegram bot: AI analytics without blockers, queue priority, access to media posting on the Forum (video/images/audio) and boosted QCoin mining. VIP gets a ×2 multiplier for time and quests, and content is scored by QuantumLCM-AI (quality/engagement/anti-spam/anti-sybil) and earns additional QCoin. Accruals are counted in the overall QCoin economy and prepare for the launch of the next-generation L7 blockchain — VIP receives elevated priority for distributions and an earlier withdrawal queue.',
  ai_unlimit_benefits: [
    'No daily quota — AI Box is available 24/7 for 30 days.',
    'Auto-activation via NowPayments: the webhook enables VIP+ immediately after on-chain confirmation.',
    'Status is linked to the current authentication/wallet; works in the web version, MiniApp and Telegram bot.',
    'Forum: media posting (video/images/audio) is allowed for VIP — content is ranked higher.',
    'QCoin mining every 4 hours: VIP gets ×2 time and ×2 quest multiplier.',
    'Bonus QCoin for media content based on QuantumLCM-AI scoring (quality/engagement/anti-sybil).',
    'Additional QCoin accruals for views and engagement of your posts based on transparent metrics.',
    'Priority servicing of the AI channel: higher limits, lower latency, faster responses.',
    'Exchange recommendations are already available: expanded analysis horizons, early access to experimental modes.',
    'Unified VIP badge and priority in Forum listings — more visibility and reach.',
    'Preparation for the L7 blockchain: higher priority in distributions and QCoin withdrawal queues at network launch.',
    'Security by default: no storage of private keys/seed, only public addresses and invoice statuses.',
    'Flexible localization: interface and notifications in 7 languages without loss of functionality.',
    'Transparent billing: price is fixed, period — 30 days, status is shown in the interface.',
    'Compatibility with quests/events: VIP gets increased caps and faster reward crediting.',
    'Anti-fraud/anti-spam protection: fair QCoin economy, protection against manipulation and bots.',
    'Status synchronization across devices: desktop/mobile/Telegram work in sync.',
    'Quota removal takes effect immediately — no session restart or additional confirmations.'
  ],
  ai_unlimit_pay_now: 'Pay $30',
  ai_unlimit_cancel: 'Cancel',
  ai_unlimit_learn_more: 'Learn more',
  ai_unlimit_status_waiting: 'Waiting for payment confirmation…',
  ai_unlimit_status_confirmed: 'Payment confirmed — limit removed until {date}.',
  ai_unlimit_status_underpaid: 'Underpayment: received {got}, required {need}.',
  ai_unlimit_status_expired: 'Invoice expired or was canceled.',
  ai_unlimit_status_error: 'Payment error. Please try again or contact support.',
  ai_unlimit_toast_on: 'VIP+ activated',
  ai_unlimit_toast_off: 'VIP+ expired'
};

/* -------------------- RU -------------------- */
const UNLIMIT_RU = {
  ai_unlimit_btn: 'Снять лимит',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'Снять лимит — VIP+',
  ai_unlimit_price: 'Цена: $30 / месяц',
  ai_unlimit_desc:
    'Откройте круглосуточный доступ к AI Box на этом аккаунте и подключите расширенный VIP-контур всей экосистемы Quantum L7. Дневная квота в браузере отключается на 30 дней после on-chain подтверждения платежа через NowPayments — активация проходит автоматически, без скриншотов и переписки. Статус VIP синхронизируется между веб-версией, MiniApp и Telegram-ботом: AI-аналитика без стопоров, приоритет в очередях, доступ к медиапостингу на Форуме (видео/изображения/аудио) и усиленный QCoin-майнинг. Для VIP действует X2 множитель по времени и квестам, а контент проходит скоринг QuantumLCM-AI (качество/вовлечённость/anti-spam/anti-sybil) и приносит дополнительные QCoin. Накопления учитываются в общей экономике QCoin и готовят к запуску L7-блокчейна нового поколения — VIP получает повышенный приоритет на распределения и более раннюю очередь вывода.',
  ai_unlimit_benefits: [
    'Без дневной квоты — AI Box доступен 24/7 на протяжении 30 дней.',
    'Автоактивация через NowPayments: вебхук включает VIP+ сразу после on-chain подтверждения.',
    'Статус привязан к текущей авторизации/кошельку; работает в веб-версии, MiniApp и Telegram-боте.',
    'Форум: разрешён медиапостинг (видео/изображения/аудио) для VIP — контент ранжируется выше.',
    'QCoin-майнинг каждые 4 часа: VIP получает X2 по времени и X2 квест-множитель.',
    'Бонусные QCoin за медиаконтент по скорингу QuantumLCM-AI (quality/engagement/anti-sybil).',
    'Дополнительные QCoin начисления за просмотры и вовлечённость ваших постов по прозрачным метрикам.',
    'Приоритетное обслуживание AI-канала: выше лимиты, меньше задержки, ускоренные ответы.',
    'Рекомендации на бирже уже доступны: расширенные горизонты анализа, ранний доступ к экспериментальным режимам.',
    'Единый VIP-бейдж и приоритет в выдаче на Форуме — больше видимость и охват.',
    'Подготовка к L7-блокчейну: повышенный приоритет в распределениях и очереди вывода QCoin при старте сети.',
    'Безопасность по умолчанию: без хранения приватных ключей/seed, только публичные адреса и статусы инвойсов.',
    'Гибкая локализация: интерфейс и уведомления на 7 языках без потери функционала.',
    'Прозрачный биллинг: цена фиксирована, период — 30 дней, статус отображается в интерфейсе.',
    'Совместимость с квестами/ивентами: VIP получает повышенные капы и ускоренное зачисление наград.',
    'Anti-fraud/anti-spam защита: честная экономика QCoin, защита от накруток и ботов.',
    'Синхронизация статуса между устройствами: десктоп/мобайл/Telegram работают согласованно.',
    'Отмена квоты действует сразу — без перезапуска сессии и доп. подтверждений.'
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
  ai_unlimit_toast_off: 'VIP+ закончился'
};

/* -------------------- UK -------------------- */
const UNLIMIT_UK = {
  ai_unlimit_btn: 'Зняти ліміт',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'Зняти ліміт — VIP+',
  ai_unlimit_price: 'Ціна: $30 / місяць',
  ai_unlimit_desc:
    'Відкрийте цілодобовий доступ до AI Box на цьому акаунті та підключіть розширений VIP-контур усієї екосистеми Quantum L7. Денна квота у браузері вимикається на 30 днів після on-chain підтвердження платежу через NowPayments — активація проходить автоматично, без скріншотів і листування. Статус VIP синхронізується між веб-версією, MiniApp і Telegram-ботом: AI-аналітика без стопів, пріоритет у чергах, доступ до медіапостингу на Форумі (відео/зображення/аудіо) та посилений QCoin-майнінг. Для VIP діє X2 множник за часом і квестами, а контент проходить скоринг QuantumLCM-AI (якість/залученість/anti-spam/anti-sybil) і приносить додаткові QCoin. Накопичення враховуються в загальній економіці QCoin і готують до запуску L7-блокчейна нового покоління — VIP отримує підвищений пріоритет у розподіленнях і більш ранню чергу виведення.',
  ai_unlimit_benefits: [
    'Без денної квоти — AI Box доступний 24/7 протягом 30 днів.',
    'Автоактивація через NowPayments: вебхук вмикає VIP+ одразу після on-chain підтвердження.',
    'Статус прив’язаний до поточної авторизації/гаманця; працює у веб-версії, MiniApp і Telegram-боті.',
    'Форум: дозволено медіапостинг (відео/зображення/аудіо) для VIP — контент ранжується вище.',
    'QCoin-майнінг кожні 4 години: VIP отримує X2 за часом і X2 квест-множник.',
    'Бонусні QCoin за медіаконтент за скорингом QuantumLCM-AI (quality/engagement/anti-sybil).',
    'Додаткові QCoin нарахування за перегляди та залученість ваших постів за прозорими метриками.',
    'Пріоритетне обслуговування AI-каналу: вищі ліміти, менше затримок, прискорені відповіді.',
    'Рекомендації на біржі вже доступні: розширені горизонти аналізу, ранній доступ до експериментальних режимів.',
    'Єдиний VIP-бейдж і пріоритет у видачі на Форумі — більше видимості та охоплення.',
    'Підготовка до L7-блокчейна: підвищений пріоритет у розподіленнях і черзі виведення QCoin при старті мережі.',
    'Безпека за замовчуванням: без зберігання приватних ключів/seed, лише публічні адреси та статуси інвойсів.',
    'Гнучка локалізація: інтерфейс і сповіщення 7 мовами без втрати функціональності.',
    'Прозорий білінг: ціна фіксована, період — 30 днів, статус відображається в інтерфейсі.',
    'Сумісність із квестами/івентами: VIP отримує підвищені капи та прискорене зарахування нагород.',
    'Anti-fraud/anti-spam захист: чесна економіка QCoin, захист від накруток і ботів.',
    'Синхронізація статусу між пристроями: десктоп/мобайл/Telegram працюють узгоджено.',
    'Скасування квоти діє одразу — без перезапуску сесії та додаткових підтверджень.'
  ],
  ai_unlimit_pay_now: 'Сплатити $30',
  ai_unlimit_cancel: 'Скасувати',
  ai_unlimit_learn_more: 'Докладніше',
  ai_unlimit_status_waiting: 'Чекаємо підтвердження платежу…',
  ai_unlimit_status_confirmed: 'Платіж підтверджено — ліміт знято до {date}.',
  ai_unlimit_status_underpaid: 'Недоплата: отримано {got}, потрібно {need}.',
  ai_unlimit_status_expired: 'Рахунок минув або був скасований.',
  ai_unlimit_status_error: 'Помилка платежу. Спробуйте ще раз або зверніться в підтримку.',
  ai_unlimit_toast_on: 'VIP+ активовано',
  ai_unlimit_toast_off: 'VIP+ завершився'
};


/* -------------------- ES -------------------- */
const UNLIMIT_ES = { 
  ai_unlimit_btn: 'Eliminar límite',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'Eliminar límite — VIP+',
  ai_unlimit_price: 'Precio: $30 / mes',
  ai_unlimit_desc:
    'Obtén acceso las 24 horas al AI Box en esta cuenta y activa el perímetro VIP ampliado de todo el ecosistema Quantum L7. La cuota diaria en el navegador se desactiva durante 30 días después de la confirmación on-chain del pago a través de NowPayments — la activación se realiza automáticamente, sin capturas de pantalla ni correspondencia. El estado VIP se sincroniza entre la versión web, MiniApp y el bot de Telegram: analítica de IA sin interrupciones, prioridad en las colas, acceso a publicación multimedia en el Foro (video/imagenes/audio) y minería de QCoin mejorada. Para los VIP se aplica un multiplicador X2 en tiempo y misiones, y el contenido pasa la puntuación de QuantumLCM-AI (calidad/participación/anti-spam/anti-sybil) generando QCoin adicional. Las acumulaciones se tienen en cuenta en la economía general de QCoin y preparan el lanzamiento del blockchain L7 de nueva generación — el VIP recibe mayor prioridad en las distribuciones y una cola de retiro anticipada.',
  ai_unlimit_benefits: [
    'Sin cuota diaria — AI Box disponible 24/7 durante 30 días.',
    'Activación automática a través de NowPayments: el webhook habilita VIP+ inmediatamente después de la confirmación on-chain.',
    'El estado está vinculado a la autenticación/cartera actual; funciona en la versión web, MiniApp y bot de Telegram.',
    'Foro: publicación multimedia (video/imagenes/audio) permitida para VIP — el contenido se clasifica más alto.',
    'Minería de QCoin cada 4 horas: el VIP recibe X2 en tiempo y X2 multiplicador de misiones.',
    'Bonificación de QCoin por contenido multimedia según la puntuación QuantumLCM-AI (quality/engagement/anti-sybil).',
    'Acreditaciones adicionales de QCoin por vistas y participación en tus publicaciones según métricas transparentes.',
    'Atención prioritaria del canal de IA: límites más altos, menor latencia, respuestas aceleradas.',
    'Las recomendaciones en el intercambio ya están disponibles: horizontes de análisis ampliados, acceso anticipado a modos experimentales.',
    'Insignia VIP unificada y prioridad en el Foro — mayor visibilidad y alcance.',
    'Preparación para el blockchain L7: prioridad elevada en las distribuciones y en la cola de retiro de QCoin al iniciar la red.',
    'Seguridad por defecto: sin almacenamiento de claves privadas/seed, solo direcciones públicas y estados de facturas.',
    'Localización flexible: interfaz y notificaciones en 7 idiomas sin pérdida de funcionalidad.',
    'Facturación transparente: precio fijo, periodo — 30 días, el estado se muestra en la interfaz.',
    'Compatibilidad con misiones/eventos: el VIP obtiene límites más altos y acreditación de recompensas más rápida.',
    'Protección anti-fraude/anti-spam: economía QCoin justa, protección contra inflaciones y bots.',
    'Sincronización de estado entre dispositivos: escritorio/móvil/Telegram funcionan de forma coordinada.',
    'La cancelación de la cuota entra en vigor de inmediato — sin reiniciar sesión ni confirmaciones adicionales.'
  ],
  ai_unlimit_pay_now: 'Pagar $30',
  ai_unlimit_cancel: 'Cancelar',
  ai_unlimit_learn_more: 'Más información',
  ai_unlimit_status_waiting: 'Esperando confirmación del pago…',
  ai_unlimit_status_confirmed: 'Pago confirmado — límite eliminado hasta {date}.',
  ai_unlimit_status_underpaid: 'Pago insuficiente: recibido {got}, requerido {need}.',
  ai_unlimit_status_expired: 'La factura ha expirado o fue cancelada.',
  ai_unlimit_status_error: 'Error de pago. Intenta de nuevo o contacta con soporte.',
  ai_unlimit_toast_on: 'VIP+ activado',
  ai_unlimit_toast_off: 'VIP+ finalizado'
};


/* -------------------- ZH (简体) -------------------- */
const UNLIMIT_ZH = {  
  ai_unlimit_btn: '解除限额',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: '解除限额 — VIP+',
  ai_unlimit_price: '价格：$30 / 月',
  ai_unlimit_desc:
    '为此账号开启 AI Box 的 24/7 不间断访问，并接入 Quantum L7 全生态的扩展 VIP 边界。通过 NowPayments 完成链上支付确认后，浏览器中的每日配额将停用 30 天——激活全程自动完成，无需截图与往返沟通。VIP 状态在网页版、MiniApp 与 Telegram 机器人之间同步：AI 分析无阻塞、队列优先、可在论坛发布媒体（视频/图片/音频），并强化 QCoin 挖矿。VIP 享有 X2 时间与任务倍增，内容将通过 QuantumLCM-AI 评分（质量/参与度/anti-spam/anti-sybil）并获得额外 QCoin。累积计入 QCoin 整体经济，为下一代 L7 区块链上线做准备——VIP 在分配与提现队列中获得更高优先级与更早通道。',
  ai_unlimit_benefits: [
    '无日配额——AI Box 在 30 天内 24/7 可用。',
    '通过 NowPayments 自动激活：webhook 在链上确认后立即开启 VIP+。',
    '状态绑定到当前授权/钱包；适用于网页版、MiniApp 与 Telegram 机器人。',
    '论坛：VIP 可发布媒体（视频/图片/音频）——内容排名更靠前。',
    'QCoin 挖矿每 4 小时一次：VIP 获得 X2 时间与 X2 任务倍增。',
    '基于 QuantumLCM-AI 评分（quality/engagement/anti-sybil）的媒体内容可获额外 QCoin 奖励。',
    '依据透明指标，按帖子浏览与参与度获得额外 QCoin 计入。',
    'AI 通道优先服务：更高限额、更低延迟、更快响应。',
    '交易所推荐已可用：更广的分析视野，抢先体验实验模式。',
    '统一的 VIP 徽章与论坛结果优先——更高可见度与覆盖面。',
    '为 L7 区块链做准备：网络启动时在 QCoin 分配与提现队列中享更高优先级。',
    '默认安全：不存储私钥/seed，仅保留公开地址与发票状态。',
    '灵活本地化：界面与通知支持 7 种语言且不降级。',
    '透明计费：价格固定，周期 — 30 天，状态在界面中显示。',
    '兼容任务/活动：VIP 获得更高上限并加速发放奖励。',
    'Anti-fraud/anti-spam 保护：公平的 QCoin 经济，防刷量与机器人。',
    '跨设备状态同步：桌面/移动端/Telegram 协同工作。',
    '配额取消即时生效——无需重启会话或额外确认。'
  ],
  ai_unlimit_pay_now: '支付 $30',
  ai_unlimit_cancel: '取消',
  ai_unlimit_learn_more: '了解更多',
  ai_unlimit_status_waiting: '等待支付确认…',
  ai_unlimit_status_confirmed: '付款已确认 — 限额解除至 {date}。',
  ai_unlimit_status_underpaid: '付款不足：收到 {got}，需要 {need}。',
  ai_unlimit_status_expired: '账单已过期或已被取消。',
  ai_unlimit_status_error: '支付错误。请重试或联系支持。',
  ai_unlimit_toast_on: 'VIP+ 已激活',
  ai_unlimit_toast_off: 'VIP+ 已到期'
};


/* -------------------- AR -------------------- */
const UNLIMIT_AR = {    
  ai_unlimit_btn: 'إزالة الحد',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'إزالة الحد — VIP+',
  ai_unlimit_price: 'السعر: $30 / شهر',
  ai_unlimit_desc:
    'افتح وصولاً على مدار الساعة إلى AI Box على هذا الحساب وفعّل نطاق VIP الموسّع عبر منظومة Quantum L7 بأكملها. يتم تعطيل الحصة اليومية في المتصفح لمدة 30 يوماً بعد تأكيد الدفع على السلسلة عبر NowPayments — تتم عملية التفعيل تلقائياً، دون لقطات شاشة أو مراسلات. تتزامن حالة VIP بين الإصدار الويب وMiniApp وروبوت Telegram: تحليلات الذكاء الاصطناعي بلا توقفات، أولوية في الطوابير، إمكانية نشر الوسائط في المنتدى (فيديو/صور/صوت) وتعدين QCoin معزّز. يحصل VIP على مُضاعِف X2 للوقت والمهام، ويخضع المحتوى لتقييم QuantumLCM-AI (الجودة/التفاعل/anti-spam/anti-sybil) ويُولّد QCoin إضافية. تُحتسب التراكمات ضمن اقتصاد QCoin العام وتُهيّئ لإطلاق بلوكتشين L7 من الجيل الجديد — يحصل VIP على أولوية أعلى في التوزيعات وطابور سحب أبكر.',
  ai_unlimit_benefits: [
    'بدون حصة يومية — AI Box متاح 24/7 لمدة 30 يوماً.',
    'تفعيل تلقائي عبر NowPayments: يفعّل الـ VIP+ مباشرة بعد التأكيد على السلسلة عبر webhook.',
    'الحالة مرتبطة بعملية المصادقة/المحفظة الحالية؛ تعمل في الإصدار الويب وMiniApp وروبوت Telegram.',
    'المنتدى: مسموح نشر الوسائط (فيديو/صور/صوت) لمستخدمي VIP — يتم ترتيب المحتوى أعلى.',
    'تعدين QCoin كل 4 ساعات: يحصل VIP على X2 للوقت وX2 مُضاعِف المهام.',
    'QCoin إضافية لمحتوى الوسائط وفق تقييم QuantumLCM-AI (quality/engagement/anti-sybil).',
    'اعتمادات QCoin إضافية مقابل المشاهدات والتفاعل مع منشوراتك وفق مقاييس شفافة.',
    'خدمة أولوية لقناة الذكاء الاصطناعي: حدود أعلى، كمون أقل، واستجابات أسرع.',
    'توصيات البورصة متاحة بالفعل: آفاق تحليل موسّعة، وصول مبكر للأوضاع التجريبية.',
    'شارة VIP موحّدة وأولوية في نتائج المنتدى — رؤية وانتشار أكبر.',
    'التحضير لبلوكتشين L7: أولوية أعلى في التوزيعات وطابور سحب QCoin عند إطلاق الشبكة.',
    'الأمان بشكل افتراضي: دون تخزين للمفاتيح الخاصة/seed، عناوين عامة وحالات الفواتير فقط.',
    'محلية مرنة: الواجهة والإشعارات بـ 7 لغات دون فقدان للوظائف.',
    'فاتورة شفافة: السعر ثابت، الفترة — 30 يوماً، تُعرض الحالة في الواجهة.',
    'توافق مع المهام/الفعاليات: يحصل VIP على حدود أعلى وتسريع في إضافة المكافآت.',
    'حماية Anti-fraud/anti-spam: اقتصاد QCoin عادل، حماية من التلاعب والروبوتات.',
    'مزامنة الحالة بين الأجهزة: سطح المكتب/الهاتف/Telegram تعمل بانسجام.',
    'إلغاء الحصة يسري فوراً — دون إعادة تشغيل الجلسة أو تأكيدات إضافية.'
  ],
  ai_unlimit_pay_now: 'ادفع $30',
  ai_unlimit_cancel: 'إلغاء',
  ai_unlimit_learn_more: 'اعرف المزيد',
  ai_unlimit_status_waiting: 'ننتظر تأكيد الدفع…',
  ai_unlimit_status_confirmed: 'تم تأكيد الدفع — تمت إزالة الحد حتى {date}.',
  ai_unlimit_status_underpaid: 'نقص في الدفع: تم استلام {got}، المطلوب {need}.',
  ai_unlimit_status_expired: 'انتهت صلاحية الفاتورة أو تم إلغاؤها.',
  ai_unlimit_status_error: 'خطأ في الدفع. حاول مرة أخرى أو تواصل مع الدعم.',
  ai_unlimit_toast_on: 'تم تفعيل VIP+',
  ai_unlimit_toast_off: 'انتهى VIP+'
};


/* -------------------- TR -------------------- */
const UNLIMIT_TR = {     
  ai_unlimit_btn: 'Limiti kaldır',
  ai_unlimit_vip_badge: 'VIP+',
  ai_unlimit_title: 'Limiti kaldır — VIP+',
  ai_unlimit_price: 'Fiyat: $30 / ay',
  ai_unlimit_desc:
    'Bu hesapta AI Box’a 7/24 erişim sağlayın ve Quantum L7 ekosisteminin tamamında genişletilmiş VIP çevresini etkinleştirin. NowPayments üzerinden zincir üzeri ödeme onayından sonra tarayıcıdaki günlük kota 30 gün boyunca devre dışı bırakılır — etkinleştirme otomatik olarak gerçekleşir, ekran görüntüsü veya yazışma gerekmez. VIP durumu web sürümü, MiniApp ve Telegram bot arasında senkronize edilir: kesintisiz AI analitiği, kuyruk önceliği, Forumda medya paylaşımı (video/görseller/ses) erişimi ve güçlendirilmiş QCoin madenciliği. VIP kullanıcıları için zaman ve görevlerde X2 çarpanı geçerlidir, içerik QuantumLCM-AI (kalite/katılım/anti-spam/anti-sybil) tarafından puanlanır ve ek QCoin kazandırır. Birikimler genel QCoin ekonomisine dahil edilir ve yeni nesil L7 blok zincirinin lansmanına hazırlanır — VIP, dağıtımlarda ve para çekme sıralarında daha yüksek öncelik elde eder.',
  ai_unlimit_benefits: [
    'Günlük kota olmadan — AI Box 30 gün boyunca 7/24 kullanılabilir.',
    'NowPayments üzerinden otomatik etkinleştirme: webhook, zincir üzeri onaydan hemen sonra VIP+’ı etkinleştirir.',
    'Durum mevcut oturum açma/cüzdanla ilişkilidir; web sürümünde, MiniApp ve Telegram botta çalışır.',
    'Forum: VIP kullanıcıları için medya paylaşımı (video/görseller/ses) serbesttir — içerik daha üst sıralarda görünür.',
    'QCoin madenciliği her 4 saatte bir: VIP kullanıcıları zaman ve görevlerde X2 çarpan alır.',
    'QuantumLCM-AI puanlamasına (quality/engagement/anti-sybil) göre medya içeriği için bonus QCoin.',
    'Gönderilerinizin görüntülenmesi ve etkileşimine göre şeffaf metriklerle ek QCoin kazançları.',
    'AI kanalında öncelikli hizmet: daha yüksek limitler, daha az gecikme, daha hızlı yanıtlar.',
    'Borsa önerileri zaten mevcut: genişletilmiş analiz ufukları, deneysel modlara erken erişim.',
    'Tek VIP rozeti ve Forumda arama önceliği — daha fazla görünürlük ve erişim.',
    'L7 blok zinciri hazırlığı: ağ başlatıldığında dağıtımlar ve QCoin çekme sıralarında artan öncelik.',
    'Varsayılan olarak güvenlik: özel anahtarlar/seed saklanmaz, yalnızca genel adresler ve fatura durumları.',
    'Esnek yerelleştirme: arayüz ve bildirimler 7 dilde, işlev kaybı olmadan.',
    'Şeffaf faturalandırma: sabit fiyat, süre — 30 gün, durum arayüzde görüntülenir.',
    'Görevler/etkinliklerle uyumluluk: VIP kullanıcıları daha yüksek sınırlar ve daha hızlı ödül tahsisi alır.',
    'Anti-fraud/anti-spam koruması: adil QCoin ekonomisi, sahtecilik ve botlara karşı koruma.',
    'Cihazlar arasında durum senkronizasyonu: masaüstü/mobil/Telegram uyumlu çalışır.',
    'Kota iptali anında geçerlidir — oturum yeniden başlatma veya ek onay gerekmez.'
  ],
  ai_unlimit_pay_now: '$30 öde',
  ai_unlimit_cancel: 'İptal',
  ai_unlimit_learn_more: 'Daha fazla bilgi',
  ai_unlimit_status_waiting: 'Ödeme onayı bekleniyor…',
  ai_unlimit_status_confirmed: 'Ödeme onaylandı — limit {date} tarihine kadar kaldırıldı.',
  ai_unlimit_status_underpaid: 'Eksik ödeme: {got} alındı, gereken {need}.',
  ai_unlimit_status_expired: 'Fatura süresi doldu veya iptal edildi.',
  ai_unlimit_status_error: 'Ödeme hatası. Lütfen tekrar deneyin veya destekle iletişime geçin.',
  ai_unlimit_toast_on: 'VIP+ etkinleştirildi',
  ai_unlimit_toast_off: 'VIP+ süresi doldu'
};

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
forum_admin_pass: 'Enter the Admin password to gain access. ⚠️ WARNING ⚠️ Do not attempt to enter the password if you are not part of the administrative group (any cheating attempts will result in a permanent ban and balance deduction). Sincerely, the Quantum L7 AI Team.',
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
forum_vip_thanks: 'VIP+ Activated! You can now fully take advantage of all the features of our ecosystem',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ unlocks access to image uploads and also accelerates Q COIN growth (×2 accumulation). In addition, VIP+ removes the limit from the AI analytics box on the Exchange page — advanced forecasts and deep analytics become available. Be visible, send more formats, and accelerate your balance with VIP+.',
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
forum_admin_pass: 'Для доступа введите Админ-пароль. ⚠️ ПРЕДУПРЕЖДЕНИЕ ⚠️ Не пытайтесь вводить пароль, если вы не относитесь к административной группе (за попытки читинга вы будете заблокированы навсегда, а баланс списан). С уважением, команда Quantum L7 AI.',
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
forum_vip_thanks: 'VIP+ Активирован! Теперь Вы можете - полноценно воспользоваться всеми возможностями нашей экосистемы',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ открывает доступ к отправке изображений, а также ускоряет рост Q COIN (начисление ×2). Кроме того, VIP+ снимает лимит c AI-бокса аналитики на странице Exchange — доступны продвинутые прогнозы и глубокая аналитика. Будьте заметны, отправляйте больше форматов и ускоряйте баланс с VIP+.',
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
forum_admin_pass: 'Для доступу введіть Адмін-пароль. ⚠️ ПОПЕРЕДЖЕННЯ ⚠️ Не намагайтеся вводити пароль, якщо ви не належите до адміністративної групи (за спроби шахрайства вас буде заблоковано назавжди, а баланс списано). З повагою, команда Quantum L7 AI.',
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
forum_vip_thanks: 'VIP+ Активовано! Тепер ви можете повною мірою скористатися всіма можливостями нашої екосистеми',
forum_vip_desc: 'VIP+ відкриває доступ до надсилання зображень, а також пришвидшує зростання Q COIN (нарахування ×2). Крім того, VIP+ знімає обмеження з AI-боксу аналітики на сторінці Exchange — доступні розширені прогнози та глибока аналітика. Будьте помітні, надсилайте більше форматів і прискорюйте баланс із VIP+.',
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
forum_admin_pass: 'Ingrese la contraseña de administrador para acceder. ⚠️ ADVERTENCIA ⚠️ No intente ingresar la contraseña si no pertenece al grupo administrativo (los intentos de hacer trampa resultarán en una suspensión permanente y la deducción del saldo). Atentamente, el equipo de Quantum L7 AI.',
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
forum_vip_thanks: '¡VIP+ Activado! Ahora puedes aprovechar plenamente todas las funciones de nuestro ecosistema',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ desbloquea el acceso para enviar imágenes y acelera el crecimiento de Q COIN (acumulación ×2). Además, VIP+ elimina el límite del cuadro de análisis AI en la página Exchange — se habilitan pronósticos avanzados y análisis profundos. Sé visible, envía más formatos y acelera tu balance con VIP+.',
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
forum_admin_pass: '请输入管理员密码以获得访问权限。⚠️ 警告 ⚠️ 如果您不属于管理组，请不要尝试输入密码（任何作弊尝试都将导致永久封禁并扣除余额）。此致，Quantum L7 AI 团队。',
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
forum_vip_thanks: 'VIP+ 已激活！您现在可以充分利用我们生态系统的所有功能',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ 可开启图片上传权限，并加速 Q COIN 增长（积累 ×2）。此外，VIP+ 解除 Exchange 页面 AI 分析框的限制 — 可使用高级预测和深度分析。让自己更显眼，发送更多格式，并用 VIP+ 加快资产增长。',
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
forum_admin_pass: 'أدخل كلمة مرور المسؤول للوصول. ⚠️ تحذير ⚠️ لا تحاول إدخال كلمة المرور إذا لم تكن ضمن المجموعة الإدارية (ستؤدي أي محاولة للغش إلى حظر دائم وخصم الرصيد). مع أطيب التحيات، فريق Quantum L7 AI.',
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
forum_vip_thanks: 'تم تفعيل VIP+! يمكنك الآن الاستفادة الكاملة من جميع إمكانيات نظامنا البيئي',
forum_vip_title: 'VIP+',
forum_vip_desc: 'يفتح VIP+ الوصول إلى إرسال الصور، كما يسرّع نمو عملة Q COIN (تراكم ×2). بالإضافة إلى ذلك، يزيل VIP+ الحد من صندوق التحليلات بالذكاء الاصطناعي في صفحة Exchange — لتصبح التوقعات المتقدمة والتحليلات العميقة متاحة. كن بارزًا، أرسل المزيد من الصيغ، وسرّع رصيدك مع VIP+.',
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
forum_admin_pass: 'Erişim için yönetici şifresini girin. ⚠️ UYARI ⚠️ Yönetici grubuna ait değilseniz şifreyi girmeye çalışmayın (hile girişimleri kalıcı yasak ve bakiye düşümü ile sonuçlanacaktır). Saygılarımızla, Quantum L7 AI Ekibi.',
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
forum_vip_thanks: 'VIP+ Etkinleştirildi! Artık ekosistemimizin tüm olanaklarından tam olarak yararlanabilirsiniz',
forum_vip_title: 'VIP+',
forum_vip_desc: 'VIP+ görsel yükleme erişimini açar ve Q COIN büyümesini hızlandırır (×2 birikim). Ayrıca, VIP+ Exchange sayfasındaki AI analiz kutusundaki sınırı kaldırır — gelişmiş tahminler ve derin analizler kullanılabilir hale gelir. Görünür olun, daha fazla format gönderin ve VIP+ ile bakiyenizi hızlandırın.',
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
  forum_ad_label: 'Advertisement',
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
  forum_ad_label: 'Реклама',
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
  forum_ad_label: 'Реклама',
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
  forum_ad_label: 'Anuncio',
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
  forum_ad_label: '广告',
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
  forum_ad_label: 'إعلان',
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
  forum_ad_label: 'Reklam',
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

// === TMA Auto — welcome title (7 languages) ===
const TMA_AUTO_EN = { tma_welcome_title: "Welcome to the Quantum L7 AI Universe" };
const TMA_AUTO_RU = { tma_welcome_title: "Добро пожаловать во Вселенную Quantum L7 AI" };
const TMA_AUTO_UK = { tma_welcome_title: "Ласкаво просимо до Всесвіту Quantum L7 AI" };
const TMA_AUTO_ES = { tma_welcome_title: "Bienvenido al Universo de Quantum L7 AI" };
const TMA_AUTO_ZH = { tma_welcome_title: "欢迎来到 Quantum L7 AI 宇宙" }; // 简体
const TMA_AUTO_AR = { tma_welcome_title: "مرحبًا بكم في كون Quantum L7 AI" };
const TMA_AUTO_TR = { tma_welcome_title: "Quantum L7 AI Evrenine Hoş Geldiniz" };

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
