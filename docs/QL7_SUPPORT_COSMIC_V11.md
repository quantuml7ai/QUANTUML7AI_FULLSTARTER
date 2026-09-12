# QL7 Intelligent Support Cosmic V11

## Scope

This contour upgrades QL7 Support without changing ordinary DM, forum, payments, QCoin writes, BattleCoin orders, advertising writes, MetaMarket transactions, or production secrets.

## Fixed contracts

- User composer and clarification `Other`: 1–600 grapheme clusters.
- Final localized QL7 Support reply: 1–4,000 grapheme clusters.
- Choice cards: up to four signed options plus signed `Other`.
- Canonical raw dialogue: existing `dm_messages`.
- Derived cognitive memory: support-owned V11 collections with hashes and redacted observations.
- Runtime self-learning cannot rewrite source code, routes, financial logic, privileges, or facts.

## Production flow

```text
authenticated input
→ grapheme and secret policy
→ Deep Translate canonicalization
→ semantic hypotheses
→ signed choice override when present
→ topic switch and dialogue memory
→ permission-aware read adapters
→ response plan and bounded personality
→ novelty/policy checks
→ structured localization
→ 4,000-grapheme final budget
→ signed cards and safe actions
→ DM persistence
→ cognitive observation
```

## Actions

- QCoin / Quantum Wallet: `quantum-wallet:open`.
- MetaMarket: `metamarket:open`.
- VIP: `/subscribe`.
- Advertising: `/ads`.
- Exchange / BattleCoin / Futures: `/exchange` with a safe target tab.
- Gameverse / MetaStudio: `/game` with a safe target tab.

## Learning control plane

Online adaptation is restricted to bounded communication traits. Global calibration follows:

```text
observation → privacy/poisoning review → candidate → offline simulation
→ regression comparison → shadow → canary → governed promotion → rollback
```

A high average score cannot bypass a critical safety, grounding, action, privacy, or regression failure.

## Simulation

Runner:

```powershell
node .\scripts\ql7-support\hyper-semantic-simulation.mjs `
  --mode quick `
  --seed ql7-baseline-v11 `
  --scenario-count 5000
```

Modes:

- `quick`: 5,000–15,000.
- `standard`: 50,000–100,000.
- `deep`: 250,000+.
- `soak`: 1,000,000+.

The runner is deterministic, streaming, sharded, resumable, and writes replay commands, JSONL results, failure clusters, coverage CSV files, and cognitive maturity metrics.

Live simulation requires a separately running development server and explicit local credentials. It must never run against production or perform financial/business writes.

## Local verification

```powershell
node .\scripts\ql7-support\v11-static-audit.mjs
node .\scripts\ql7-support\v11-self-test.mjs
pnpm exec vitest run --configLoader native --project unit tests/unit/ql7-support/cosmic-intelligence-v11.test.js
pnpm exec vitest run --configLoader native --project contracts tests/contracts/project/ql7-support-cosmic-v11-contracts.test.js
pnpm exec vitest run --configLoader native --project integration tests/integration/ql7-support/cosmic-v11-pipeline.test.js
```

## Action safety contract (V11.0.7)

Structured-card actions are normalized before signing. Only canonical registry routes, same-origin paths, approved global events, approved case actions and an explicit retry-diagnostic action survive. External URLs, protocol-relative URLs, JavaScript schemes, fake route IDs and targetless action types are discarded.

## Canonical route and navigation contract (V11.0.8)

Signed cards retain stable canonical hrefs required by the permanent support contracts. The renderer derives a separate allowlisted navigation href for confirmed Exchange anchors. This preserves backwards compatibility, keeps signatures deterministic and still opens the intended BattleCoin, Futures, Battle Chat or AI Box area.

## Simulation truth calibration (V11.1.0)

The production Support runtime is unchanged. V11.1.0 repairs the offline laboratory so calibration is based on valid evidence instead of impossible or misleading oracles.

- Truncated prompts that no longer preserve a complete topic signal are evaluated as ambiguity/clarification cases rather than forced exact-topic failures.
- Multi-intent turns require coverage of both expected topics through the primary route, hypotheses or alternatives.
- Follow-ups after an ambiguous opening explicitly clarify the intended topic before exact-topic scoring.
- Failure clusters contain failure code, expected topic(s), actual topic, transition, locale, mutation and oracle mode, and examples point to the actual failing turn.
- Reports separate scenario pass rate, turn semantic accuracy, exact-topic accuracy, ambiguity accuracy, multi-intent accuracy, start accuracy and follow-up accuracy.
- Unmeasured maturity slices have zero weight and cannot qualify the system.

New evidence files include `evaluation-metrics.json`, `confusion-matrix.json/csv`, `accuracy-by-transition.csv`, `accuracy-by-topic.csv`, and `failure-codes.csv`.


## V11.2 truth hardening and runtime topic calibration

- An initial exact-topic oracle is emitted only when its compact primary anchor remains recoverable after truncation and keyboard-layout mutation; otherwise visible topics plus the support fallback form the ambiguity allowlist.
- Position-aware named topic anchors keep the user's explicit subject ahead of incidental VIP, Ads and QCoin state.
- Mixed Latin/Cyrillic keyboard-layout corruption is repaired only in an alternate semantic view; the original message is never rewritten.
- Compound continuation requests preserve a real established primary topic; an ambiguity-only support fallback yields to the first explicit named topic while secondary topics remain in the hypothesis set.
- Contact/partnership and Deep Translate/localization are first-class production topics.
- Word-boundary and domain-specific aliases prevent false Quest/Academy matches and distinguish GeoDetect, moderation corrections and support-social acts.
- Multi-intent probes name both expected topics explicitly, GeoDetect seeds remain inside feed geolocation, and named topic evidence overrides stale ambiguity in topic-switch arbitration.

- V11.2.1 preserves explicit routed topics when a flattened route object is reframed; an absent `intent.top.topic` no longer normalizes to `support_system` and overrides text hints.

## V11.2.2 explicit topic rejection calibration

- A topic mention preceded by an explicit rejection such as `Не про QCoin` or `not about QCoin` is no longer scored as the active named topic.
- The rejected stale topic is removed from positive alias, native-status, catalog fallback and previous-focus scoring unless the same topic is mentioned positively elsewhere in the message.
- Inclusive constructions such as `not only QCoin` remain positive and continue to participate in multi-intent routing.
- Regression coverage proves that `Не про QCoin. Теперь покажи мои рекламные метрики.` switches to `ads_campaigns`.


## V11.3 evidence-bound oracle and multilingual routing calibration

- Partnership requests are represented as `contact + domain` only when partnership language remains visible after truncation; a lost business-intent label cannot manufacture an exact contact oracle.
- Ambiguity allowlists inherit previously established oracle candidates and include bounded operational fallbacks, preventing one uncertain opening from cascading false failures through deictic follow-ups.
- Strong topic anchors and weak truncated signals are separated: partial fragments may be accepted as ambiguity candidates but never promoted to exact-topic proof.
- Generic phrases such as `help`, `I changed the subject`, and `do not repeat` no longer masquerade as exact `support_system` evidence.
- Runtime routing recognizes multilingual partnership language, moderation appeals and report-deletion phrases, Ukrainian exchange stems, Russian/Ukrainian advertising packages, roadmap/future-plan wording, Quantum Family over incidental VIP state, and a bare explicit Push subject over a balance joke.
- Unicode-safe `invest` boundaries prevent Spanish `Investígalo` from being misclassified as an investment/partnership request.
- Regression evidence replays all 399 non-critical V11.2.3 failure scenarios with the same production-baseline seed and requires zero routing/oracle failures before delivery.

## V11.3 residual evidence closure

The V11.3 calibration is based on the deterministic V11.2.3 corpus run with 10,000 scenarios and 155,211 turns. It separates production routing defects from oracle defects instead of weakening acceptance thresholds.

The residual closure adds:

- multi-topic deictic continuation that preserves every established topic instead of forcing the partnership/contact primary topic on later generic follow-ups;
- multilingual GeoDetect geographic-feed evidence;
- explicit privacy/data-handling and account-deletion/data-cleanup evidence;
- MetaMarket item-price-growth safety wording;
- weak-only treatment for a bare or truncated `forum` token, preventing unsupported exact expectations;
- regression scenarios for the prior failure corpus and multilingual routing matrix.

The calibration remains offline by default. It does not write MongoDB business data, does not call provider translation unless explicitly enabled, and does not auto-promote learned behavior.

## V11.3.1 MetaMarket item-price evidence hotfix

- Safety wording about an item price growing, rising, increasing or going up is treated as MetaMarket evidence in English, Russian and Ukrainian even when the brand name is omitted.
- The simulation oracle uses the same bounded evidence, so an explicit MetaMarket price-safety turn is not incorrectly graded as unresolved ambiguity.
- The matcher is bounded to item/price language and does not steal explicit QCoin token-price or Futures price-growth requests.
- Unit and integration regressions cover the exact failed English and Russian cases plus QCoin/Futures negative controls.


## V11.4.0 semantic and emotional breadth

- `semanticNuanceV11` separates advertising package lifecycle, campaign metrics, purchase, benefits and campaign creation/status across bounded multilingual and slang variants.
- Explicit metrics rejection cannot be scored as a metrics request; QCoin balance, wallet connection, payment/VIP state and moderation privacy/appeal/count intents have independent sub-intents.
- `emotionalPresentationV11` maps bounded emotional evidence to signed card theme, glyph, intensity and reduced-motion-safe pulse without changing facts, permissions or business data.
- Choice cards render at most four signed domain options plus signed `Other`, vertically and at full width.
- Support administrator HTML contains one direct-DM action and a Gmail-safe high-contrast user-claim surface.
- `v11-conversation-breadth-audit.mjs` measures deterministic semantic, emotion and 43-topic × 32-language response breadth separately from live/provider/Mongo/browser acceptance.
- Finite simulation is evidence for the measured corpus, not a claim that every possible natural-language utterance has been proven.

## V11.4.1 actor-scoped read continuity

An explicit self-owned read request remains diagnostic-ready when the topic arbiter switches from stale context to QCoin, Wallet, Payments, Ads, VIP, or Moderation. The guard requires an explicit multilingual self-reference, `user_safe_evidence_only`, and a bounded read operation or read sub-intent. It never authorizes business-state mutation.

## V11.4.2 opaque administrator deep-link identifiers

Administrator email display formatting is separated from technical DM routing identifiers. Account, case, message and correlation identifiers use a fail-closed opaque sanitizer and remain stable across HTML rendering and URLSearchParams serialization. Humanization is never applied to routing tokens.

## V11.5.0 human conversation and live evidence

- Client entry greeting is created synchronously from a curated eight-locale lexicon before the authenticated server request completes. The chosen variant ID is persisted server-side so optimistic and durable text remain identical.
- Previous transient entry/idle messages are removed on exit; each new entry selects a recent-variant-safe greeting and appears at the newest-first edge of Quantum Messenger.
- Social routing covers greeting, farewell, gratitude, appreciation, wellbeing, emotional support, casual chat, apology, confusion, success and impatience without stealing a material QL7 request embedded in natural speech.
- Repeated unbounded small talk receives a warm scope boundary and a signed four-option-plus-Other clarification card. Ordinary social turns never ask for account IDs.
- Identity copy names Quantum L7 AI Global only when identity or purpose is actually asked. User-visible text excludes architecture, alliance, collection and orchestration internals.
- Ads package state is read through the same canonical source functions used by the Ads cabinet. An active package remains active even when no campaign slots are currently in use; campaign analytics are fetched only for explicit metric intents.
- Optional provider, canonical Mongo read and authenticated CDP-browser evidence are separate guarded modes. They never run implicitly during offline verification.


## V11.6.0 Premium Human Intelligence

Слой V11.6.0 вводит 1032 micro-intent в 43 доменах, нормализацию сленга/опечаток/транслитерации, узкие response plans, evidence-first QCoin security, корректное состояние Ads package при нулевом остатке кампаний и 30 семантических SVG-ролей. Социальный акт не перехватывает материальный запрос. Пользовательские таблицы не показывают raw keys, `pending`, `true/false`, полный wallet или служебные IDs. Offline, provider, Mongo и browser evidence учитываются раздельно.

## V12.0.0 Human Context and Factual 50M Architecture

V12 переводит QL7 Support из classifier-only проверки в production-equivalent контур: каждый сценарий строит настоящий пользовательский turn, проходит через language/dialect, toxicity, intent hypotheses, topic switch, ledger, identity, read-only diagnostic adapters, response planner, adaptive realizer, premium card builder, structured localization, visual/oracle acceptance и sharded report writer.

### Runtime Modules

- `temporalContextV12.js`: нормализует IANA time-zone, local daypart и безопасное приветствие; 05:00 никогда не выбирает вечерний вариант.
- `conversationLedgerV12.js`: хранит active topic, previous topic, unresolved slot, open material question и последние assistant claims без смешивания greeting/idle с реальным вопросом.
- `idlePolicyV12.js`: разрешает idle-nudge только после material user turn и waiting-user состояния; пустой support-thread не получает ложное "вопрос решён?".
- `semanticOntologyV12.js`: строит 10 000+ semantic nodes из 43 тем, 32 языков, классов сценариев и dialect packs; статистика включена в simulation manifest.
- `semanticBattleExpansionV12.js`: превращает базовый сценарий в живой вопрос с отрицанием, code-switching, slang, typo/noise, accessibility context, safety boundary и warm/social префиксами.
- `languageDialectRouterV12.js`: фиксирует выбранный язык, detected dialect, transliteration/code-switch/emoji/noise signals и не подменяет текст классификаторной заглушкой.
- `safeLearningCalibrationV12.js`: моделирует настоящее безопасное самообучение по широкому независимому опыту, quorum по пользователям/языкам/темам, poisoning guard, staged promotion и rollback requirement; один пользователь или несколько похожих диалогов не могут изменить поведение.
- `sessionIdentityContextV12.js`: подтверждает, что self-status ответы не просят raw wallet/user/account/order IDs и работают от actor/session context.
- `safetyEscalationLedgerV12.js`: реализует ladder: первое грубое сообщение - warning, второе - 60 секунд, третье - 5 минут, credible threat - 30 минут и operator handoff.
- `responsePlannerV12.js`: адаптирует production response plan через V12 variation, critic и fallback, не меняя факты и права доступа.
- `adaptiveResponseVariationV12.js`: собирает human-first ответы до 4000 grapheme clusters, поддерживает social, humor, partnership, learning, safety и product-support режимы, отфильтровывает machine/meta scaffolding и закрывает текст на границе предложения.
- `responseCriticV12.js`: запрещает raw IDs, secret requests, screenshot/screen upload prompts, stale machine wording, meta-answer phrases and internal process language before response acceptance.
- `choiceDiversityV12.js`: проверяет signed choice cards на distinct options and duplicate semantic labels.
- `premiumCardLayoutV12.js`: строит Card V12 с compact density, semantic rails, premium-tight spacing, localized badges and no nested cards.
- `structuredLocalizationV12.js`: переводит text, title, summary, labels, actions, status and badges as natural-language nodes while preserving ids and internal keys.
- `adminReportRuV12.js`: формирует privacy-safe SMTP/operator report; user claim surface stays high-contrast on the blue base.
- `visualAcceptanceV12.js`: serializes DOM contract for badge localization, STOP SVG exception, rail geometry and RTL readiness.
- `independentReferenceOracleV12.js`: оценивает фактический response/card/choices/dom без импорта production classifier.
- `factualSimulationV12.js`: выполняет full pair pipeline, checkpointing, shard writing, raw records, oracle failures and reproducible run manifests up to 50 000 000 pairs.

### Human Answer Rules

- Пользователь не видит внутренние формулы вроде "держу безопасный контекст", "old branch", "user goal ahead", "strategic signal", "generic ticket", "verified login" или "same thread without restart".
- Если человек пишет тепло ("брат", "bro", "kardeşim", "amigo"), Support может отвечать теплее, но не притворяется человеком и не раскрывает системные принципы.
- Small talk, благодарность, настроение и просьба пошутить отвечаются коротко и естественно; material topic внутри такого сообщения остаётся главным.
- Partnership/investment/contact requests получают отдельный strategic intake: благодарность за интерес, ценность/масштаб/контакт, privacy-safe summary for administration.
- Learning/self-calibration объясняется простыми словами: система улучшается на широком обезличенном опыте, но один диалог или маленькая группа сообщений не могут её сломать или продавить новую привычку.
- Threats, harassment and direct insults получают человеческий boundary без холодной лекции; вводная фрустрация не скрывает QCoin/Ads/VIP/Payment/Forum request.

### Topic Arbitration Calibrations

- Explicit correction such as "No, I mean Telegram Mini App / TMA" switches away from stale `system_status` when the new topic has strong named/native evidence.
- Friendly `bro` and words such as `topic` are tokenized before profanity matching, so Turkish `piç/pic` no longer fires on English substrings.
- `system_status` outranks incidental accessibility/navigation context when the user explicitly says `runtime status`, `system status` or `current availability`.
- Business/operator phrasing is gated: ordinary Academy, Telegram, Privacy or QCoin support does not receive operator/admin/business text unless the user asks for handoff, partnership, investment or commercial contact.

### Visual And Localization Rules

- Left rail safety badges use only localized labels: warning, sent-to-operator and pause/cooldown with timer.
- The raw English words `WARNING` and `OPERATOR` are forbidden in visible rail labels; `STOP` is allowed only inside the central red SVG shield and is not a localization failure.
- Premium cards use semantic SVG roles, compact rails, stable dimensions, localized status/action/table labels and no raw booleans, raw keys, duplicate titles or untranslated nested labels.
- Ordinary conversation cards must not show "checked at" timestamps unless an actual diagnostic/evidence check has run.

### Simulation And Reports

`scripts/ql7-support/v12-factual-e2e-runner.mjs` is the V12 evidence runner. It is deterministic by `--seed`, writes `factual-simulation/shards/*.ndjson.zst`, `raw-records`, checkpoints, manifest, coverage artifacts, SMTP/visual/browser/static evidence files and replay-ready configs under `reports/ql7-support-v12/<runId>/`.

The runner never performs 50M HTTP requests, Mongo business writes, SMTP sends or paid translation calls by default. Provider translation is explicit and bounded by `--provider-sample-limit`. Ultimate 50M requires `--allow-ultimate`.

The acceptance sequence is:

```powershell
node scripts\ql7-support\v12-factual-e2e-runner.mjs --mode quick --count 5000 --seed <seed> --evidence-mode balanced --run-id <runId> --report-dir reports\ql7-support-v12\<runId> --checkpoint-interval 1000 --shard-max-bytes 50000000
node scripts\ql7-support\v12-validate-factual-report.mjs --report-dir reports\ql7-support-v12\<runId> --expected-count 5000
```

Large calibration uses the same command shape with `--mode extreme --count 5000000` or `--mode ultimate --count 50000000 --allow-ultimate`. Any production-code, ontology, localization, oracle, card or visual change after a large run invalidates that run and requires a new `runId`.
