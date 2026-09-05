# QL7 Support V11 — migration disposition

Боевой patch ID: `QL7_SUPPORT_UNIFIED_32L_OPERATOR_QUANTUM_MESSENGER_PRODUCT_PARITY_FINAL_R11_V11_CUMULATIVE_FROM_SOURCE_R4`.

Разрешённая база: `QL7_SUPPORT_INTEGRATION_ADS_PACKAGE_CALIBRATION_DOFIX_V9`, final-state `4A453652488F28E5A011F808410DF059EAE4082B55F032A1AFE6A2E498CBA1DB`.

Патч кумулятивно включает V10 adversarial resilience и V11 unified intelligence. В этом apply legacy-модули не удаляются.

## keep-active
- `lib/ql7-support/runtime/executeTurn.js`
- `lib/ql7-support/server.js`
- `lib/ql7-support/semantics/analyzeTurn.js`
- `lib/ql7-support/response/*`
- `lib/ql7-support/presentation/*`

## migrate-data
- `lib/ql7-support/conversationBreadthCorpusV11.js`
- `lib/ql7-support/humanConversationCorpusV11.js`
- `lib/ql7-support/emotionalPresentationV11.js`
- `lib/ql7-support/learningControlPlaneV11.js`
- `lib/ql7-support/v12/safeLearningCalibrationV12.js`
- `lib/ql7-support/v12/semanticOntologyV12.js`
- `lib/ql7-support/v12/semanticBattleExpansionV12.js`

V11 extracts useful corpus axes and governance rules into new V14/V15 canonical modules. The legacy source files remain read-only until replacement coverage passes the full laboratory.

## compatibility-only
- `lib/ql7-support/v13/*`

## cleanup-candidate-after-V11-pass
- `lib/ql7-support/config/capabilitySnapshot.js`
- `lib/ql7-support/premiumSimulationCatalogV11_6.js`
- `lib/ql7-support/presentation/legacyCardReader.js`
- unused V13 facades

No legacy file is deleted by V11.

## Final R11 Operator Native Slot DOFIX — Quantum Messenger sticky stack и строгая product/laboratory parity

Боевой patch ID: `QL7_SUPPORT_UNIFIED_32L_OPERATOR_QUANTUM_MESSENGER_PRODUCT_PARITY_FINAL_R11_V11_CUMULATIVE_FROM_SOURCE_R4`.

Разрешённая база: точный postimage `QL7_SUPPORT_INTEGRATION_ADS_PACKAGE_CALIBRATION_DOFIX_V9`, final-state `4A453652488F28E5A011F808410DF059EAE4082B55F032A1AFE6A2E498CBA1DB`. Патч кумулятивно включает V10 и V11.

### Quantum Messenger sticky stack

Единственный верхний sticky owner — `app/forum/features/dm/components/InboxTabsHeader.jsx`, содержащий титул `Quantum Messenger` и табы. Его реальная высота измеряется `ResizeObserver` и публикуется в CSS variable `--ql7-quantum-messenger-sticky-height`. Оператор QL7 Support (`static.png` / `video.mp4`) использует `position: sticky` с top, равным сумме safe-area, фактической высоты Quantum Messenger и фиксированного зазора. Поэтому оператор упирается не в физический верх viewport, а точно в нижнюю границу sticky-плашки Quantum Messenger.

Identity-плашка QL7 Support с аватаром и никнеймом не sticky, не fixed и не portaled. Она естественно уходит при прокрутке. При обратной прокрутке оператор освобождается из sticky-состояния и возвращается в исходный слот справа от identity-плашки. Scroll listener и `requestAnimationFrame` для позиционирования не используются.

### Один product/laboratory runtime

`lib/ql7-support/runtime/productionTurn.js` является общим product-shaped adapter для `lib/ql7-support/server.js`, `lib/ql7-support/simulation/executeScenario.js` и `lib/ql7-support/simulation/liveRead.js`. Все три пути используют один `executeQl7SupportTurnRuntime`, один locale policy, одинаковую политику доверия contextual follow-up и один final user-visible delivery projection.

Лаборатория проверяет не только topic/messageAct, но и окончательные пользовательские артефакты: `text`, `textHash`, `surfaceHash`, `actionIds`, `responseCode`, composer policy и fact hash. Сервер вызывает тот же `finalizeQl7SupportProductionDelivery` после фактического post-processing карточки, локали и input policy. Simulation evidence и live-read evidence берут текст и action IDs из этого же final delivery projection. Лабораторный PASS запрещён, если final delivery hashes отсутствуют или product/direct projections расходятся.

Deep Translate не является частью native/provider acceptance для 32 поддерживаемых locale и остаётся fallback только для неподдерживаемого языка. Live MongoDB/Redis writes и SMTP live send не входят в лабораторный контур.

### Проверочная матрица

Quick запускает `verify:env`, `verify:docs`, `verify:audits:fast`, `lint`, `typecheck`, `test:contracts`, `test:unit`, `test:component`, `test:integration`, `test:smoke`. Все stages выполняются до конца с отдельными логами; общий отказ формируется после сбора всей матрицы. Full дополнительно запускает `project:docs:full`, `verify:audits:deep`, `build`, `test:codex`.

## Final R11 Operator Native Slot DOFIX — scoped preimage и внешние ресурсы

Боевой patch ID: `QL7_SUPPORT_UNIFIED_32L_OPERATOR_QUANTUM_MESSENGER_PRODUCT_PARITY_FINAL_R11_V11_CUMULATIVE_FROM_SOURCE_R4`.

Release boundary:

- корневые `.env*` файлы не входят в payload и никогда не создаются, не заменяются и не удаляются патчем;
- тяжёлая папка `public/` не входит в preimage-manifest и не участвует в проверке общего количества файлов проекта;
- preimage guard применяется только к точному allowlist изменяемых и создаваемых файлов;
- существующие `.env*` и обязательные QL7 public assets защищаются runtime snapshot до/после без привязки к заранее известному hash;
- isolated verification tree получает канонический `.env.local.example` только внутри временной папки;
- существующий `public/` подключается к isolated verification tree только временным Windows junction в режиме read-only-use; bulk copy тяжёлой медиатеки не выполняется;
- отсутствие или наличие любых других media/env файлов не меняет решение preimage;
- source rollback остаётся byte-for-byte для всего allowlist.

### Final R11 Operator Native Slot DOFIX static-proof consistency

`architecture-and-laboratory-contract` validates the current patch ID in every authoritative Support document, the canonical `behaviorManifestHash` `54d3a82a`, the Quantum Messenger sticky-stack contract, the controlled-cleanup disposition and the isolated verification resource policy. The proof emits clause-level booleans, so a future mismatch identifies the exact missing document or marker instead of returning only a generic static-proof failure.

The heavy `public/` tree is never included in the patch preimage, payload or project file-count guard. The isolated verification tree exposes the existing project `public/` through a temporary read-only-use Windows junction (`publicMode = junction-read-use`) and performs no bulk media copy. If `public/` is absent, only an empty temporary verification directory is created. Root `.env*` files remain outside the manifest and payload and are never modified.

operator-native-slot-fit: identity-plate-expands-to-media-height
