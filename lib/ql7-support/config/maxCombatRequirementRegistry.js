export const QL7_SUPPORT_MAX_COMBAT_REQUIREMENT_REGISTRY_VERSION = '5.3.0'
export const QL7_SUPPORT_MAX_COMBAT_REQUIREMENTS = Object.freeze([
  {
    "requirementId": "MC-01",
    "title": "Canonical production executor",
    "owner": "lib/ql7-support/runtime/executeTurn.js",
    "productionUseSite": "lib/ql7-support/runtime/productionTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/productionParityHarness.js",
    "test": "tests/integration/ql7-support-production-lab-parity.integration.test.js",
    "evidence": "release/canonical-runtime.json",
    "requiredTokens": [
      "executeQl7SupportTurnRuntime"
    ]
  },
  {
    "requirementId": "MC-02",
    "title": "Sealed final delivery",
    "owner": "lib/ql7-support/contracts/finalDeliveryReceipt.js",
    "productionUseSite": "lib/ql7-support/runtime/productionTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/productionParityHarness.js",
    "test": "tests/unit/ql7-support/delivery-commit-recovery-test.js",
    "evidence": "delivery/final-delivery.json",
    "requiredTokens": [
      "FinalDelivery"
    ]
  },
  {
    "requirementId": "MC-03",
    "title": "Atomic commit/recovery",
    "owner": "lib/ql7-support/runtime/deliveryCommitCoordinator.js",
    "productionUseSite": "lib/ql7-support/runtime/productionTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/unit/ql7-support/delivery-commit-recovery-test.js",
    "evidence": "delivery/atomicity.json",
    "requiredTokens": [
      "commitQl7SupportFinalDelivery"
    ]
  },
  {
    "requirementId": "MC-04",
    "title": "Novelty availability without semantic-intent lock",
    "owner": "lib/ql7-support/response/noveltyReservation.js",
    "productionUseSite": "lib/ql7-support/runtime/executeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/semanticDuplicateOracle.js",
    "test": "tests/integration/ql7-support-p0-novelty.integration.test.js",
    "evidence": "focused-evidence/p0-novelty-delivery-availability.json",
    "requiredTokens": [
      "semanticIdentityIsExclusive",
      "durableReservationScope"
    ]
  },
  {
    "requirementId": "MC-05",
    "title": "Collision-aware regeneration",
    "owner": "lib/ql7-support/response/regenerationController.js",
    "productionUseSite": "lib/ql7-support/runtime/executeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/semanticDuplicateOracle.js",
    "test": "tests/unit/ql7-support/novelty-delivery-availability-test.js",
    "evidence": "focused-evidence/p0-novelty-delivery-availability.json",
    "requiredTokens": [
      "changedDimensions",
      "scope-safe-clarification"
    ]
  },
  {
    "requirementId": "MC-06",
    "title": "Full novelty collision receipt",
    "owner": "lib/ql7-support/runtime/deliveryCommitCoordinator.js",
    "productionUseSite": "lib/ql7-support/runtime/productionTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/semanticDuplicateOracle.js",
    "test": "tests/contracts/ql7-support-p0-novelty.contract.test.js",
    "evidence": "focused-evidence/p0-novelty-delivery-availability.json",
    "requiredTokens": [
      "candidateRhetoricalSkeletonHash",
      "allowedFactIdsHash"
    ]
  },
  {
    "requirementId": "MC-07",
    "title": "Surface semantic anti-duplication",
    "owner": "lib/ql7-support/response/surfaceRedundancyGuard.js",
    "productionUseSite": "lib/ql7-support/response/finalHumanQualityGate.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/surfaceRedundancyOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "presentation/surface-redundancy.json",
    "requiredTokens": [
      "surfaceRedundancy"
    ]
  },
  {
    "requirementId": "MC-08",
    "title": "Table duplicate protection",
    "owner": "lib/ql7-support/response/surfaceRedundancyReceipt.js",
    "productionUseSite": "lib/ql7-support/presentation/buildSupportSurface.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/surfaceRedundancyOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "presentation/table-deduplication.json",
    "requiredTokens": [
      "duplicateRows",
      "duplicateTableValues"
    ]
  },
  {
    "requirementId": "MC-09",
    "title": "Entity/product repetition necessity",
    "owner": "lib/ql7-support/response/surfaceRedundancyReceipt.js",
    "productionUseSite": "lib/ql7-support/response/finalHumanQualityGate.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/surfaceRedundancyOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "presentation/entity-repetition.json",
    "requiredTokens": [
      "entityMentionGroups"
    ]
  },
  {
    "requirementId": "MC-10",
    "title": "32-locale normalization",
    "owner": "lib/ql7-support/language/normalizeInput.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/mutationEngine.js",
    "independentOracle": "lib/ql7-support/simulation/localePurityOracle.js",
    "test": "tests/unit/ql7-support/locale-profiles-test.js",
    "evidence": "language/normalization-32.json",
    "requiredTokens": [
      "normalizeQl7SupportInput"
    ]
  },
  {
    "requirementId": "MC-11",
    "title": "Dialect/slang/mutation banks",
    "owner": "lib/ql7-support/language/semanticBanks.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/mutationEngine.js",
    "independentOracle": "lib/ql7-support/simulation/localePurityOracle.js",
    "test": "tests/unit/ql7-support/closure-matrix.test.js",
    "evidence": "language/dialect-slang.json",
    "requiredTokens": [
      "semanticSignals"
    ]
  },
  {
    "requirementId": "MC-12",
    "title": "Code-switch/translit/layout",
    "owner": "lib/ql7-support/language/locales/manifest.js",
    "productionUseSite": "lib/ql7-support/language/normalizeInput.js",
    "simulationUseSite": "lib/ql7-support/simulation/mutationEngine.js",
    "independentOracle": "lib/ql7-support/simulation/localePurityOracle.js",
    "test": "tests/unit/ql7-support/locale-profiles-test.js",
    "evidence": "language/code-switch.json",
    "requiredTokens": [
      "codeSwitch"
    ]
  },
  {
    "requirementId": "MC-13",
    "title": "Semantic cost/margin/abstention",
    "owner": "lib/ql7-support/semantics/decisionMath.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/unit/ql7-support/closure-matrix.test.js",
    "evidence": "semantics/decision-math.json",
    "requiredTokens": [
      "decisionMathReceipt"
    ]
  },
  {
    "requirementId": "MC-14",
    "title": "Response scope/domain isolation",
    "owner": "lib/ql7-support/semantics/buildResponseScopeReceipt.js",
    "productionUseSite": "lib/ql7-support/runtime/executeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/domainIsolationOracle.js",
    "test": "tests/contracts/ql7-support-architecture-closure.contract.test.js",
    "evidence": "language-domain-memory-quality/scope.json",
    "requiredTokens": [
      "scopeReceipt"
    ]
  },
  {
    "requirementId": "MC-15",
    "title": "Contextual Support safety",
    "owner": "lib/ql7-support/safety/evaluateTurn.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/unit/ql7-support/closure-matrix.test.js",
    "evidence": "safety/support-context.json",
    "requiredTokens": [
      "evaluateQl7SupportSafety"
    ]
  },
  {
    "requirementId": "MC-16",
    "title": "Shared Composer server authority",
    "owner": "lib/composer-safety/serverGate.cjs",
    "productionUseSite": "app/api/forum/mutate/route.js",
    "simulationUseSite": "lib/ql7-support/simulation/composerSafetyOracle.js",
    "independentOracle": "lib/ql7-support/simulation/composerSafetyOracle.js",
    "test": "tests/unit/composer-safety/composer.test.js",
    "evidence": "policy-side-effects/composer/server-authority.json",
    "requiredTokens": [
      "evaluateComposerSubmit"
    ]
  },
  {
    "requirementId": "MC-17",
    "title": "Composer advisory preview",
    "owner": "lib/composer-safety/clientPreview.js",
    "productionUseSite": "app/forum/features/ui/components/ComposerCore.jsx",
    "simulationUseSite": "lib/ql7-support/simulation/composerSafetyOracle.js",
    "independentOracle": "lib/ql7-support/simulation/composerSafetyOracle.js",
    "test": "tests/unit/composer-safety/composer.test.js",
    "evidence": "policy-side-effects/composer/client-preview.json",
    "requiredTokens": [
      "useComposerSafetyPreview"
    ]
  },
  {
    "requirementId": "MC-18",
    "title": "Ecosystem attack semantic assessment",
    "owner": "lib/ql7-support/security/ecosystemAttackAssessment.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "safety/ecosystem-attack.json",
    "requiredTokens": [
      "ecosystemAttackAssessment"
    ]
  },
  {
    "requirementId": "MC-19",
    "title": "Illicit asset-route assessment",
    "owner": "lib/ql7-support/security/illicitAssetRoutePolicy.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "safety/illicit-asset-route.json",
    "requiredTokens": [
      "illicitAssetRouteAssessment"
    ]
  },
  {
    "requirementId": "MC-20",
    "title": "Lawful QCoin route knowledge",
    "owner": "lib/economic-integrity/routeRegistry.cjs",
    "productionUseSite": "lib/economic-integrity/productionRoute.cjs",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/unit/economic-integrity/economic-gate.test.js",
    "evidence": "policy-side-effects/economic/lawful-routes.json",
    "requiredTokens": [
      "listRoutes"
    ]
  },
  {
    "requirementId": "MC-21",
    "title": "Economic decision receipt",
    "owner": "lib/economic-integrity/decisionReceipt.cjs",
    "productionUseSite": "lib/economic-integrity/productionRoute.cjs",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/unit/economic-integrity/economic-gate.test.js",
    "evidence": "policy-side-effects/economic/receipt.json",
    "requiredTokens": [
      "decisionReceipt"
    ]
  },
  {
    "requirementId": "MC-22",
    "title": "Quarantine deterministic authority",
    "owner": "lib/account-restrictions/quarantineService.cjs",
    "productionUseSite": "lib/account-restrictions/businessActionGuard.cjs",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/unit/account-restrictions/quarantine.test.js",
    "evidence": "policy-side-effects/quarantine/authority.json",
    "requiredTokens": [
      "quarantine"
    ]
  },
  {
    "requirementId": "MC-23",
    "title": "Conversation memory graph",
    "owner": "lib/ql7-support/conversation/conversationMemoryGraph.js",
    "productionUseSite": "lib/ql7-support/runtime/executeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/topicMemoryOracle.js",
    "test": "tests/unit/ql7-support/closure-matrix.test.js",
    "evidence": "language-domain-memory-quality/memory.json",
    "requiredTokens": [
      "memoryGraph"
    ]
  },
  {
    "requirementId": "MC-24",
    "title": "Correction/rejected-hypothesis memory",
    "owner": "lib/ql7-support/conversation/correctionLedger.js",
    "productionUseSite": "lib/ql7-support/conversation/conversationMemoryGraph.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/topicMemoryOracle.js",
    "test": "tests/unit/ql7-support/closure-matrix.test.js",
    "evidence": "language-domain-memory-quality/correction.json",
    "requiredTokens": [
      "correction"
    ]
  },
  {
    "requirementId": "MC-25",
    "title": "Human semantic response plan",
    "owner": "lib/ql7-support/response/buildSemanticResponsePlan.js",
    "productionUseSite": "lib/ql7-support/runtime/executeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/humanNaturalnessOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "language-domain-memory-quality/semantic-plan.json",
    "requiredTokens": [
      "SemanticResponsePlan"
    ]
  },
  {
    "requirementId": "MC-26",
    "title": "Discourse planner",
    "owner": "lib/ql7-support/response/discoursePlanner.js",
    "productionUseSite": "lib/ql7-support/runtime/executeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/humanNaturalnessOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "language-domain-memory-quality/discourse.json",
    "requiredTokens": [
      "regenerationStrategyId"
    ]
  },
  {
    "requirementId": "MC-27",
    "title": "Human natural realizer",
    "owner": "lib/ql7-support/response/humanNaturalRealizer.js",
    "productionUseSite": "lib/ql7-support/runtime/executeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/humanNaturalnessOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "language-domain-memory-quality/hnr.json",
    "requiredTokens": [
      "HUMAN_NATURAL_REALIZER_VERSION"
    ]
  },
  {
    "requirementId": "MC-28",
    "title": "Morphosyntactic/compositional realization",
    "owner": "lib/ql7-support/response/morphosyntacticRealizer.js",
    "productionUseSite": "lib/ql7-support/response/humanNaturalRealizer.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/humanNaturalnessOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "language-domain-memory-quality/morphology.json",
    "requiredTokens": [
      "5.2.0"
    ]
  },
  {
    "requirementId": "MC-29",
    "title": "Humor mechanism ontology",
    "owner": "lib/ql7-support/knowledge/humorMechanismOntology.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/humorCapacityOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "knowledge/humor-mechanisms.json",
    "requiredTokens": [
      "humorMechanismPlan"
    ]
  },
  {
    "requirementId": "MC-30",
    "title": "Humor safety",
    "owner": "lib/ql7-support/knowledge/humorSafetyPolicy.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/humorCapacityOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "safety/humor-policy.json",
    "requiredTokens": [
      "humorSafety"
    ]
  },
  {
    "requirementId": "MC-31",
    "title": "Open human topic ontology",
    "owner": "lib/ql7-support/knowledge/humanTopicOntology.js",
    "productionUseSite": "lib/ql7-support/knowledge/generalKnowledgeRegistry.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/openHumanTopicOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "knowledge/open-human-topics.json",
    "requiredTokens": [
      "open_subject"
    ]
  },
  {
    "requirementId": "MC-32",
    "title": "Open human knowledge router",
    "owner": "lib/ql7-support/knowledge/openHumanKnowledgeRouter.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/openHumanTopicOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "knowledge/open-human-router.json",
    "requiredTokens": [
      "openHumanRoute"
    ]
  },
  {
    "requirementId": "MC-33",
    "title": "Public figure identity graph >=1050 installed-data gate",
    "owner": "lib/ql7-support/knowledge/publicFigureKnowledgeGraph.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/publicFigureCoverageOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "knowledge/public-figure-coverage.json",
    "requiredTokens": [
      "publicFigureKnowledgeGraph",
      "requiredCoverage"
    ]
  },
  {
    "requirementId": "MC-34",
    "title": "Public figure fresh-source gate",
    "owner": "lib/ql7-support/knowledge/publicFigureSourceResolver.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/publicFigureCoverageOracle.js",
    "test": "tests/unit/ql7-support/max-combat.test.js",
    "evidence": "knowledge/public-figure-source.json",
    "requiredTokens": [
      "publicFigureSourceResolution"
    ]
  },
  {
    "requirementId": "MC-35",
    "title": "Ecosystem knowledge graph",
    "owner": "lib/ql7-support/knowledge/knowledgeGraph.js",
    "productionUseSite": "lib/ql7-support/response/morphosyntacticRealizer.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/domainIsolationOracle.js",
    "test": "tests/contracts/ql7-support-architecture-closure.contract.test.js",
    "evidence": "knowledge/ecosystem.json",
    "requiredTokens": [
      "getQl7SupportKnowledgeAnswer"
    ]
  },
  {
    "requirementId": "MC-36",
    "title": "Read-only identity/profile projection",
    "owner": "lib/ql7-support/identityResolver.js",
    "productionUseSite": "lib/ql7-support/server.js",
    "simulationUseSite": "lib/ql7-support/simulation/liveRead.js",
    "independentOracle": "lib/ql7-support/simulation/identityAudit.js",
    "test": "tests/unit/ql7-support/final-runtime.test.js",
    "evidence": "providers-browser-smtp-live/mongo-read.json",
    "requiredTokens": [
      "resolveQl7VerifiedActor"
    ]
  },
  {
    "requirementId": "MC-37",
    "title": "Wallet/Telegram parity",
    "owner": "lib/ql7-support/identityGraph.js",
    "productionUseSite": "lib/ql7-support/identityResolver.js",
    "simulationUseSite": "lib/ql7-support/simulation/identityAudit.js",
    "independentOracle": "lib/ql7-support/simulation/identityAudit.js",
    "test": "tests/unit/ql7-support/final-runtime.test.js",
    "evidence": "providers-browser-smtp-live/identity-parity.json",
    "requiredTokens": [
      "identity"
    ]
  },
  {
    "requirementId": "MC-38",
    "title": "Explainable rating",
    "owner": "lib/ql7-support/ecosystemRating.js",
    "productionUseSite": "lib/ql7-support/server.js",
    "simulationUseSite": "lib/ql7-support/simulation/liveRead.js",
    "independentOracle": "lib/ql7-support/simulation/identityAudit.js",
    "test": "tests/unit/ql7-support/final-runtime.test.js",
    "evidence": "providers-browser-smtp-live/rating.json",
    "requiredTokens": [
      "rating"
    ]
  },
  {
    "requirementId": "MC-39",
    "title": "Operator case",
    "owner": "lib/ql7-support/operator/buildCase.js",
    "productionUseSite": "lib/ql7-support/runtime/executeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/unit/ql7-support/final-runtime.test.js",
    "evidence": "operator/operator-case.json",
    "requiredTokens": [
      "operatorCase"
    ]
  },
  {
    "requirementId": "MC-40",
    "title": "SMTP receipt truth",
    "owner": "lib/supportEmailTransport.js",
    "productionUseSite": "lib/ql7-support/emailOutboxWorker.js",
    "simulationUseSite": "scripts/ql7-support/smtp-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/contracts/ql7-support-architecture-closure.contract.test.js",
    "evidence": "providers-browser-smtp-live/smtp/receipt.json",
    "requiredTokens": [
      "smtp"
    ]
  },
  {
    "requirementId": "MC-41",
    "title": "Provider localization fact/action invariance",
    "owner": "lib/ql7-support/language/finalDeliveryLocalization.js",
    "productionUseSite": "lib/ql7-support/server.js",
    "simulationUseSite": "scripts/ql7-support/native-model-failure-matrix.mjs",
    "independentOracle": "lib/ql7-support/simulation/localePurityOracle.js",
    "test": "tests/unit/ql7-support/closure-matrix.test.js",
    "evidence": "providers-browser-smtp-live/provider.json",
    "requiredTokens": [
      "provider"
    ]
  },
  {
    "requirementId": "MC-42",
    "title": "Operator 10-state runtime",
    "owner": "lib/ql7-support/runtimeStateMachine.js",
    "productionUseSite": "components/Ql7SupportRuntimeBridge.jsx",
    "simulationUseSite": "scripts/ql7-support/browser-acceptance.mjs",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/contracts/ql7-support-architecture-closure.contract.test.js",
    "evidence": "providers-browser-smtp-live/operator-states.json",
    "requiredTokens": []
  },
  {
    "requirementId": "MC-43",
    "title": "Browser/accessibility acceptance",
    "owner": "scripts/ql7-support/browser-acceptance.mjs",
    "productionUseSite": "components/Ql7SupportRuntimeBridge.jsx",
    "simulationUseSite": "scripts/ql7-support/browser-acceptance.mjs",
    "independentOracle": "scripts/ql7-support/browser-acceptance.mjs",
    "test": "tests/contracts/ql7-support-architecture-closure.contract.test.js",
    "evidence": "providers-browser-smtp-live/browser.json",
    "requiredTokens": [
      "browser"
    ]
  },
  {
    "requirementId": "MC-44",
    "title": "Controlled learning governance",
    "owner": "lib/ql7-support/learning/governancePolicy.js",
    "productionUseSite": "lib/ql7-support/learningPipeline.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/contracts/ql7-support-architecture-closure.contract.test.js",
    "evidence": "events-feedback-learning/governance.json",
    "requiredTokens": [
      "learning"
    ]
  },
  {
    "requirementId": "MC-45",
    "title": "Independent oracle layer",
    "owner": "lib/ql7-support/simulation/independentOracle.js",
    "productionUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/independentOracle.js",
    "test": "tests/integration/ql7-support-production-lab-parity.integration.test.js",
    "evidence": "scientific/oracle-isolation.json",
    "requiredTokens": [
      "evaluateQl7SupportScenario"
    ]
  },
  {
    "requirementId": "MC-46",
    "title": "Lab plans A-I exact",
    "owner": "lib/ql7-support/simulation/labPlanRegistry.js",
    "productionUseSite": "scripts/ql7-support/lab-coordinator.mjs",
    "simulationUseSite": "scripts/ql7-support/lab.mjs",
    "independentOracle": "scripts/ql7-support/evidence-validate.mjs",
    "test": "tests/contracts/ql7-support-architecture-closure.contract.test.js",
    "evidence": "release/lab-plans.json",
    "requiredTokens": [
      "chaos-100000"
    ]
  },
  {
    "requirementId": "MC-47",
    "title": "Capacity audit",
    "owner": "scripts/ql7-support/capacity-audit.mjs",
    "productionUseSite": "scripts/ql7-support/lab-coordinator.mjs",
    "simulationUseSite": "scripts/ql7-support/capacity-audit.mjs",
    "independentOracle": "lib/ql7-support/simulation/semanticDuplicateOracle.js",
    "test": "tests/contracts/ql7-support-max-combat.contract.test.js",
    "evidence": "statistics-human-review/capacity.json",
    "requiredTokens": [
      "per-branch-locale"
    ]
  },
  {
    "requirementId": "MC-48",
    "title": "Blind human review/statistics",
    "owner": "scripts/ql7-support/human-review.mjs",
    "productionUseSite": "scripts/ql7-support/lab-coordinator.mjs",
    "simulationUseSite": "scripts/ql7-support/human-review.mjs",
    "independentOracle": "scripts/ql7-support/statistics.mjs",
    "test": "tests/contracts/ql7-support-max-combat.contract.test.js",
    "evidence": "statistics-human-review/reviewer-agreement.json",
    "requiredTokens": [
      "reviewer"
    ]
  },
  {
    "requirementId": "MC-49",
    "title": "Evidence lineage/release verifier",
    "owner": "scripts/ql7-support/release-verify.mjs",
    "productionUseSite": "scripts/ql7-support/lab-coordinator.mjs",
    "simulationUseSite": "scripts/ql7-support/evidence-validate.mjs",
    "independentOracle": "scripts/ql7-support/evidence-validate.mjs",
    "test": "tests/contracts/ql7-support-max-combat.contract.test.js",
    "evidence": "release/release-evidence-manifest.json",
    "requiredTokens": []
  },
  {
    "requirementId": "MC-50",
    "title": "Ω/runtime-map/operator-command traceability",
    "owner": "lib/ql7-support/config/maxCombatRequirementRegistry.js",
    "productionUseSite": "scripts/ql7-support/max-combat-architecture-proof.mjs",
    "simulationUseSite": "scripts/ql7-support/max-combat-architecture-proof.mjs",
    "independentOracle": "scripts/ql7-support/max-combat-architecture-proof.mjs",
    "test": "tests/contracts/ql7-support-max-combat.contract.test.js",
    "evidence": "release/max-combat-architecture-proof.json",
    "requiredTokens": [
      "MAX_COMBAT"
    ]
  },
  {
    "requirementId": "MC-51",
    "title": "32-locale crisis/self-harm concept bank",
    "owner": "lib/ql7-support/safety/crisisConceptBank.js",
    "productionUseSite": "lib/ql7-support/safety/crisisAssessment.js",
    "simulationUseSite": "scripts/ql7-support/premium-cognitive-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/crisisSafetyOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "safety/crisis-concept-bank-32.json",
    "requiredTokens": [
      "QL7_SUPPORT_CRISIS_REQUIRED_LOCALES",
      "nativeReviewRequired"
    ]
  },
  {
    "requirementId": "MC-52",
    "title": "Robust typo/translit/confusable crisis concept matcher",
    "owner": "lib/ql7-support/language/robustConceptMatcher.js",
    "productionUseSite": "lib/ql7-support/safety/crisisAssessment.js",
    "simulationUseSite": "scripts/ql7-support/premium-cognitive-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/crisisSafetyOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "safety/crisis-obfuscation-matcher.json",
    "requiredTokens": [
      "damerau",
      "collisionRisk",
      "normalizationPath"
    ]
  },
  {
    "requirementId": "MC-53",
    "title": "Contextual crisis/self-harm assessment without punitive cooldown",
    "owner": "lib/ql7-support/safety/crisisAssessment.js",
    "productionUseSite": "lib/ql7-support/safety/evaluateTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/crisisSafetyOracle.js",
    "test": "tests/integration/ql7-support-premium-cognitive.integration.test.js",
    "evidence": "safety/crisis-context-32.json",
    "requiredTokens": [
      "inputMustRemainWritable",
      "punitiveActionEligible",
      "counterEvidence"
    ]
  },
  {
    "requirementId": "MC-54",
    "title": "Calibrated semantic mathematics and policy eligibility separation",
    "owner": "lib/ql7-support/semantics/decisionMath.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/decisionMathOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "semantics/decision-math.json",
    "requiredTokens": [
      "normalizedEntropy",
      "expectedLoss",
      "generativeScoreIsAuthority",
      "sideEffectEligible"
    ]
  },
  {
    "requirementId": "MC-55",
    "title": "Internal clarification strategy reservoir >=100",
    "owner": "lib/ql7-support/semantics/clarificationStrategyRegistry.js",
    "productionUseSite": "lib/ql7-support/semantics/clarificationRanker.js",
    "simulationUseSite": "scripts/ql7-support/premium-cognitive-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/clarificationOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "semantics/clarification-strategy-capacity.json",
    "requiredTokens": [
      "QL7_SUPPORT_CLARIFICATION_STRATEGY_COUNT",
      "readyToSend",
      "finalText"
    ]
  },
  {
    "requirementId": "MC-56",
    "title": "Information-gain clarification ranker with one-best-question policy",
    "owner": "lib/ql7-support/semantics/clarificationRanker.js",
    "productionUseSite": "lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/clarificationOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "semantics/clarification-information-gain.json",
    "requiredTokens": [
      "expectedInformationGain",
      "oneBestQuestionPolicy",
      "maxVisibleOptions"
    ]
  },
  {
    "requirementId": "MC-57",
    "title": "One shared AI Box/Exchange analysis service",
    "owner": "lib/exchange/aiBoxAnalysisService.js",
    "productionUseSite": "app/api/brain/analyze/route.js",
    "simulationUseSite": "scripts/ql7-support/premium-cognitive-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/aiBoxAnalyticsOracle.js",
    "test": "tests/integration/ql7-support-premium-cognitive.integration.test.js",
    "evidence": "exchange-ai/shared-analysis-owner.json",
    "requiredTokens": [
      "analyzeAiBoxMarket",
      "readOnly",
      "writeCount",
      "analytics_not_financial_advice"
    ]
  },
  {
    "requirementId": "MC-58",
    "title": "QL7 Support AI Box read-only adapter using shared service",
    "owner": "lib/ql7-support/data/aiBoxSupportReadAdapter.js",
    "productionUseSite": "lib/ql7-support/diagnosticRegistry.js",
    "simulationUseSite": "scripts/ql7-support/premium-cognitive-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/aiBoxAnalyticsOracle.js",
    "test": "tests/integration/ql7-support-premium-cognitive.integration.test.js",
    "evidence": "exchange-ai/support-read-adapter.json",
    "requiredTokens": [
      "sourceOwnerId",
      "riskScore",
      "writeCount"
    ]
  },
  {
    "requirementId": "MC-59",
    "title": "Premium AI Box analytical table projection",
    "owner": "lib/ql7-support/presentation/tableRegistry.js",
    "productionUseSite": "lib/ql7-support/presentation/buildSupportSurface.js",
    "simulationUseSite": "lib/ql7-support/simulation/executeScenario.js",
    "independentOracle": "lib/ql7-support/simulation/surfaceRedundancyOracle.js",
    "test": "tests/integration/ql7-support-premium-cognitive.integration.test.js",
    "evidence": "presentation/ai-box-analytics-table.json",
    "requiredTokens": [
      "ql7.table.ai.recommendation.canonical",
      "riskScore",
      "venueSpread",
      "disclaimer"
    ]
  },
  {
    "requirementId": "MC-60",
    "title": "Outcome calibration evidence ledger without self-confirmation",
    "owner": "lib/ql7-support/learning/outcomeCalibrationLedger.js",
    "productionUseSite": "app/api/dm/support-feedback/route.js",
    "simulationUseSite": "scripts/ql7-support/premium-cognitive-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/outcomeCalibrationOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "learning/outcome-calibration.json",
    "requiredTokens": [
      "automaticProductionPromotion",
      "selfConfirmationForbidden",
      "requiresHumanApproval"
    ]
  },
  {
    "requirementId": "MC-61",
    "title": "Governed learning promotion only after signed approval and frozen gates",
    "owner": "lib/ql7-support/learning/governancePolicy.js",
    "productionUseSite": "lib/ql7-support/learningPipeline.js",
    "simulationUseSite": "scripts/ql7-support/learning-governance-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/outcomeCalibrationOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "learning/no-autonomous-promotion.json",
    "requiredTokens": [
      "approval"
    ]
  },
  {
    "requirementId": "MC-62",
    "title": "Separated Russian operator evidence aggregation",
    "owner": "lib/ql7-support/operator/evidenceAggregation.js",
    "productionUseSite": "lib/ql7-support/operator/buildCase.js",
    "simulationUseSite": "scripts/ql7-support/premium-cognitive-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/operatorEvidenceOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "operator/russian-separated-evidence.json",
    "requiredTokens": [
      "fieldsSeparated",
      "verifiedChecks",
      "unavailableChecks",
      "semanticDecision"
    ]
  },
  {
    "requirementId": "MC-63",
    "title": "Russian SMTP report consumes structured evidence without field mixing",
    "owner": "lib/ql7-support/operator/smtpRendererRu.js",
    "productionUseSite": "lib/ql7-support/operator/buildCase.js",
    "simulationUseSite": "scripts/ql7-support/smtp-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/operatorEvidenceOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "operator/smtp-structured-russian.json",
    "requiredTokens": [
      "Семантика и уверенность",
      "Безопасность и кризисный контекст",
      "Подтверждённые read-only проверки"
    ]
  },
  {
    "requirementId": "MC-64",
    "title": "Large semantic banks plus non-slab discourse strategy capacity",
    "owner": "lib/ql7-support/response/discourseStrategyRegistry.js",
    "productionUseSite": "lib/ql7-support/response/discoursePlanner.js",
    "simulationUseSite": "scripts/ql7-support/capacity-audit.mjs",
    "independentOracle": "lib/ql7-support/simulation/humanNaturalnessOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "language-domain-memory-quality/discourse-and-bank-capacity.json",
    "requiredTokens": [
      "readyToSend",
      "finalText",
      "QL7_SUPPORT_DISCOURSE_STRATEGY_COUNT"
    ]
  },
  {
    "requirementId": "MC-65",
    "title": "Actual native greeting realization capacity with provider capacity boundary",
    "owner": "lib/ql7-support/entryGreetingLexicon.js",
    "productionUseSite": "lib/ql7-support/language/humanVariationPrimitives.js",
    "simulationUseSite": "scripts/ql7-support/premium-cognitive-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/greetingCapacityOracle.js",
    "test": "tests/unit/ql7-support/premium-cognitive.test.js",
    "evidence": "language-domain-memory-quality/greeting-capacity.json",
    "requiredTokens": ["1_200", "entryMode", "readyToSend"]
  },
  {
    "requirementId": "MC-66",
    "title": "Large 32-locale Composer moderation bank with obfuscation/mixed-language scan",
    "owner": "lib/composer-safety/serverModerationBank.cjs",
    "productionUseSite": "lib/composer-safety/semanticAnalyzer.cjs",
    "simulationUseSite": "scripts/ql7-support/composer-safety-proof.mjs",
    "independentOracle": "lib/ql7-support/simulation/composerSafetyOracle.js",
    "test": "tests/unit/composer-safety/composer.test.js",
    "evidence": "composer-safety/large-moderation-bank-and-mutations.json",
    "requiredTokens": ["59507", "all-32-locales-primary-first", "directInsults", "threats"]
  },
  {
    "requirementId":"MC-67",
    "title":"Installed public-figure catalog >=1900 with public-only privacy boundary",
    "owner":"lib/ql7-support/knowledge/public-figures/identityCatalog.js",
    "productionUseSite":"lib/ql7-support/knowledge/publicFigureRegistry.js",
    "simulationUseSite":"scripts/ql7-support/public-figure-richness-proof.mjs",
    "independentOracle":"lib/ql7-support/simulation/publicFigureRichnessOracle.js",
    "test":"tests/unit/ql7-support/public-figure-richness.test.js",
    "evidence":"report/QL7_SUPPORT_LAB/gate0-public-figures.json",
    "requiredTokens":["QL7_SUPPORT_PUBLIC_FIGURE_IDENTITY_COUNT","privateDataForbidden:true","readyToSend:false"]
  },
  {
    "requirementId":"MC-68",
    "title":"Public-figure facts source-bound, current facts fresh, private facts forbidden",
    "owner":"lib/ql7-support/knowledge/public-figures/publicFigureFactResolver.js",
    "productionUseSite":"lib/ql7-support/knowledge/publicFigureRegistry.js",
    "simulationUseSite":"scripts/ql7-support/public-figure-richness-proof.mjs",
    "independentOracle":"lib/ql7-support/simulation/publicFigureRichnessOracle.js",
    "test":"tests/integration/ql7-support-public-figures.integration.test.js",
    "evidence":"report/QL7_SUPPORT_LAB/gate0-public-figures.json",
    "requiredTokens":["current_role","fresh","answerAllowed","public_figure_public_fact_only"]
  },
  {
    "requirementId":"MC-69",
    "title":"Broad human-conversation semantic bank plus production open-subject source route",
    "owner":"lib/ql7-support/knowledge/humanConversationBank.js",
    "productionUseSite":"lib/ql7-support/knowledge/openHumanKnowledgeRouter.js",
    "simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs",
    "independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js",
    "test":"tests/unit/ql7-support/human-knowledge-core.test.js",
    "evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json",
    "requiredTokens":["QL7_SUPPORT_HUMAN_CONVERSATION_MINIMUM_CELLS=8192","open_subject","sourcePolicy","semanticPlanOnly:true"]
  },
  {
    "requirementId":"MC-70",
    "title":"32-locale dialect/slang/code-switch and 24-family mutation profile bank",
    "owner":"lib/ql7-support/language/languageVariantBank.js",
    "productionUseSite":"lib/ql7-support/semantics/analyzeTurn.js",
    "simulationUseSite":"scripts/ql7-support/language-seed-diversity-proof.mjs",
    "independentOracle":"lib/ql7-support/simulation/languageSeedDiversityOracle.js",
    "test":"tests/unit/ql7-support/language-depth.test.js",
    "evidence":"report/QL7_SUPPORT_LAB/gate0-language-depth.json",
    "requiredTokens":["code_switch","intentional_obfuscation","nativeHumanReviewRequired:true","openDialectFallback:true"]
  },
  {
    "requirementId":"MC-71",
    "title":"Humor mechanisms materially affect all-32-locale realization with >=10600 capacity",
    "owner":"lib/ql7-support/response/humorRealizationPlanner.js",
    "productionUseSite":"lib/ql7-support/response/morphosyntacticRealizer.js",
    "simulationUseSite":"scripts/ql7-support/humor-capacity-32l.mjs",
    "independentOracle":"lib/ql7-support/simulation/humorMaterialDiversityOracle.js",
    "test":"tests/unit/ql7-support/humor-32l.test.js",
    "evidence":"report/QL7_SUPPORT_LAB/gate0-humor-32l.json",
    "requiredTokens":["materialVariation","requiresFinalHumanQualityGate:true","visibleIndexToken:false"]
  },
  {
    "requirementId":"MC-72",
    "title":"Final combat data floors are production-imported and fail closed before calibration",
    "owner":"lib/ql7-support/config/staticDataReadiness.js",
    "productionUseSite":"lib/ql7-support/runtime/executeTurn.js",
    "simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs",
    "independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js",
    "test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js",
    "evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json",
    "requiredTokens":["publicFigureIdentities","humanConversationCells","expandedSemanticTermsTotal","crisisReviewedCuesTotal","composerServerExpandedTerms"]
  },
  {
    "requirementId":"MC-73","title":"Surface redundancy distinguishes structural labels from true prose overuse",
    "owner":"lib/ql7-support/response/surfaceRedundancyGuard.js","productionUseSite":"lib/ql7-support/response/finalHumanQualityGate.js",
    "simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs","independentOracle":"lib/ql7-support/simulation/surfaceRedundancyOracle.js",
    "test":"tests/integration/ql7-support-knowledge-integration.test.js","evidence":"presentation/surface-redundancy-structural-prose.json",
    "requiredTokens":["proseMentionCount","structuralEntityRepeats","unnecessary_repeated_entity_label"]
  }

,
{"requirementId":"MC-74","title":"100% rich public profiles for installed public identities","owner":"lib/ql7-support/knowledge/public-figures/manifest.js","productionUseSite":"lib/ql7-support/knowledge/public-figures/publicFigureFactResolver.js","simulationUseSite":"scripts/ql7-support/public-figure-richness-proof.mjs","independentOracle":"lib/ql7-support/simulation/publicFigureRichnessOracle.js","test":"tests/unit/ql7-support/public-figure-richness.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["profileCount","stableFacts","sourceFiles"]},
{"requirementId":"MC-75","title":"public fact provenance and fresh current facts","owner":"lib/ql7-support/knowledge/public-figures/publicFigureFactResolver.js","productionUseSite":"lib/ql7-support/knowledge/public-figures/publicFigureFactResolver.js","simulationUseSite":"tests/integration/ql7-support-public-figures.integration.test.js","independentOracle":"lib/ql7-support/simulation/publicFigureRichnessOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["fresh","sourceReceipt","answerAllowed"]},
{"requirementId":"MC-76","title":"32-locale public-figure aliases transliteration ambiguity","owner":"lib/ql7-support/knowledge/public-figures/identityCatalog.js","productionUseSite":"lib/ql7-support/knowledge/public-figures/publicFigureResolver.js","simulationUseSite":"scripts/ql7-support/public-figure-richness-proof.mjs","independentOracle":"lib/ql7-support/simulation/publicFigureRichnessOracle.js","test":"tests/integration/ql7-support-public-figures.integration.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["aliases","clarify"]},
{"requirementId":"MC-77","title":"public-figure privacy and unknown/unavailable boundary","owner":"lib/ql7-support/knowledge/public-figures/privacyBoundary.js","productionUseSite":"lib/ql7-support/knowledge/public-figures/publicFigureFactResolver.js","simulationUseSite":"scripts/ql7-support/public-figure-richness-proof.mjs","independentOracle":"lib/ql7-support/simulation/publicFigureRichnessOracle.js","test":"tests/unit/ql7-support/public-figure-richness.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["private_fact","unavailable"]},
{"requirementId":"MC-78","title":">=12000 general human semantic knowledge nodes","owner":"lib/ql7-support/knowledge/generalHumanKnowledgeCore.js","productionUseSite":"lib/ql7-support/knowledge/openHumanKnowledgeRouter.js","simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/unit/ql7-support/human-knowledge-core.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["nodeCount","sourcePolicy"]},
{"requirementId":"MC-79","title":">=8192 human conversation cells and open_subject","owner":"lib/ql7-support/knowledge/humanConversationBank.js","productionUseSite":"lib/ql7-support/knowledge/openHumanKnowledgeRouter.js","simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/unit/ql7-support/human-knowledge-core.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["cellCount","openSubject"]},
{"requirementId":"MC-80","title":"open_subject production source route complete","owner":"lib/ql7-support/knowledge/openHumanKnowledgeRouter.js","productionUseSite":"lib/ql7-support/semantics/analyzeTurn.js","simulationUseSite":"tests/integration/ql7-support-open-human.integration.test.js","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/integration/ql7-support-open-human.integration.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["sourceRequired","openSubject"]},
{"requirementId":"MC-81","title":"humor lexical resources installed for all 32 locales","owner":"lib/ql7-support/knowledge/humorLexiconBank.js","productionUseSite":"lib/ql7-support/response/humorRealizationPlanner.js","simulationUseSite":"scripts/ql7-support/humor-capacity-32l.mjs","independentOracle":"lib/ql7-support/simulation/humorMaterialDiversityOracle.js","test":"tests/unit/ql7-support/humor-32l.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["localeCount","externalLocalizationRequired:false"]},
{"requirementId":"MC-82","title":">=10600 material humor realizations per locale","owner":"lib/ql7-support/response/humorRealizationPlanner.js","productionUseSite":"lib/ql7-support/response/humanNaturalRealizer.js","simulationUseSite":"scripts/ql7-support/humor-capacity-32l.mjs","independentOracle":"lib/ql7-support/simulation/humorMaterialDiversityOracle.js","test":"tests/unit/ql7-support/humor-32l.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["semanticId","text"]},
{"requirementId":"MC-83","title":"humor multi-turn callback topic switch memory safety","owner":"lib/ql7-support/knowledge/humorAnecdoteFrameBank.js","productionUseSite":"lib/ql7-support/response/humorRealizationPlanner.js","simulationUseSite":"tests/integration/ql7-support-humor.integration.test.js","independentOracle":"lib/ql7-support/simulation/humorMaterialDiversityOracle.js","test":"tests/integration/ql7-support-humor.integration.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["topic-callback","memoryCallback"]},
{"requirementId":"MC-84","title":"bank authenticity prevents count inflation","owner":"lib/ql7-support/simulation/bankAuthenticityOracle.js","productionUseSite":"lib/ql7-support/config/staticDataReadiness.js","simulationUseSite":"scripts/ql7-support/bank-authenticity-proof.mjs","independentOracle":"lib/ql7-support/simulation/bankAuthenticityOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["placeholderModuleCount","dummyPublicFigureIdentity"]},
{"requirementId":"MC-85","title":"1500 code-reviewed semantic seeds per locale","owner":"lib/ql7-support/language/reviewedSeedRegistry.js","productionUseSite":"lib/ql7-support/language/languageVariantBank.js","simulationUseSite":"scripts/ql7-support/language-seed-diversity-proof.mjs","independentOracle":"lib/ql7-support/simulation/languageSeedDiversityOracle.js","test":"tests/unit/ql7-support/language-depth.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["seedsPerLocale","mutationDerived:false"]},
{"requirementId":"MC-86","title":"dialect register slang reviewed families ambiguity fallback","owner":"lib/ql7-support/language/languageVariantBank.js","productionUseSite":"lib/ql7-support/semantics/analyzeTurn.js","simulationUseSite":"scripts/ql7-support/language-seed-diversity-proof.mjs","independentOracle":"lib/ql7-support/simulation/languageSeedDiversityOracle.js","test":"tests/unit/ql7-support/language-depth.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["dialectFamilyCount","openDialectFallback"]},
{"requirementId":"MC-87","title":">=24 mutation families protected spans provenance","owner":"lib/ql7-support/language/languageVariantBank.js","productionUseSite":"lib/ql7-support/semantics/analyzeTurn.js","simulationUseSite":"scripts/ql7-support/language-seed-diversity-proof.mjs","independentOracle":"lib/ql7-support/simulation/languageSeedDiversityOracle.js","test":"tests/unit/ql7-support/language-depth.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["mutationFamilyCount"]},
{"requirementId":"MC-88","title":"server composer safety all32 context lexical not authority","owner":"lib/composer-safety/safetyConceptOntology.cjs","productionUseSite":"lib/composer-safety/serverGate.cjs","simulationUseSite":"scripts/ql7-support/bank-authenticity-proof.mjs","independentOracle":"lib/ql7-support/simulation/bankAuthenticityOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["lexicalAuthority"]},
{"requirementId":"MC-89","title":"client advisory parity not second policy authority","owner":"lib/composer-safety/clientModerationBank.js","productionUseSite":"lib/composer-safety/clientPreview.js","simulationUseSite":"scripts/ql7-support/composer-safety-proof.mjs","independentOracle":"lib/ql7-support/simulation/bankAuthenticityOracle.js","test":"tests/unit/composer-safety/composer.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["POLICY_AUTHORITY=false"]},
{"requirementId":"MC-90","title":"crisis multilingual depth indirect euphemism obfuscation","owner":"lib/ql7-support/safety/crisisReviewedCueBank.js","productionUseSite":"lib/ql7-support/safety/crisisAssessment.js","simulationUseSite":"scripts/ql7-support/crisis-depth-proof.mjs","independentOracle":"lib/ql7-support/simulation/crisisDepthOracle.js","test":"tests/unit/ql7-support/crisis-depth.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["totalCues","cuesPerLocale"]},
{"requirementId":"MC-91","title":"crisis context target immediacy capability negation reported protective","owner":"lib/ql7-support/safety/crisisAssessment.js","productionUseSite":"lib/ql7-support/safety/evaluateTurn.js","simulationUseSite":"scripts/ql7-support/crisis-depth-proof.mjs","independentOracle":"lib/ql7-support/simulation/crisisDepthOracle.js","test":"tests/unit/ql7-support/crisis-depth.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["protective","reported","immediacy"]},
{"requirementId":"MC-92","title":"HNR material capacity >=10600 branch locale","owner":"lib/ql7-support/response/humanNaturalRealizer.js","productionUseSite":"lib/ql7-support/response/finalHumanQualityGate.js","simulationUseSite":"scripts/ql7-support/capacity-audit.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/integration/ql7-support-humor.integration.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["semanticPlan"]},
{"requirementId":"MC-93","title":"microtopic dialogues >=1060 per locale capacity","owner":"lib/ql7-support/ontology/microtopicOntology.js","productionUseSite":"lib/ql7-support/runtime/executeTurn.js","simulationUseSite":"scripts/ql7-support/capacity-audit.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["microtopic"]},
{"requirementId":"MC-94","title":"ecosystem microtopic capability completeness","owner":"lib/ql7-support/simulation/capabilityRegistry.js","productionUseSite":"lib/ql7-support/runtime/executeTurn.js","simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["capabilityId"]},
{"requirementId":"MC-95","title":"premium surface table fact status time accessibility dedupe","owner":"lib/ql7-support/response/surfaceRedundancyGuard.js","productionUseSite":"lib/ql7-support/response/finalHumanQualityGate.js","simulationUseSite":"scripts/ql7-support/focused-regressions.mjs","independentOracle":"lib/ql7-support/simulation/surfaceRedundancyOracle.js","test":"tests/integration/ql7-support-knowledge-integration.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["duplicate","structural"]},
{"requirementId":"MC-96","title":"Russian operator SMTP typed sections no mixing secrets","owner":"lib/ql7-support/operator/smtpRendererRu.js","productionUseSite":"lib/ql7-support/emailOutboxWorker.js","simulationUseSite":"tests/integration/ql7-support-operator-smtp.integration.test.js","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/integration/ql7-support-operator-smtp.integration.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["section","ru"]},
{"requirementId":"MC-97","title":"SMTP outbox provider receipt truth","owner":"lib/ql7-support/emailOutboxWorker.js","productionUseSite":"lib/supportEmailTransport.js","simulationUseSite":"scripts/ql7-support/smtp-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/integration/ql7-support-operator-smtp.integration.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["receipt"]},
{"requirementId":"MC-98","title":"AI Box one formula owner read-only Support adapter","owner":"lib/exchange/aiBoxAnalysisService.js","productionUseSite":"lib/ql7-support/data/aiBoxSupportReadAdapter.js","simulationUseSite":"scripts/ql7-support/premium-cognitive-proof.mjs","independentOracle":"lib/ql7-support/simulation/aiBoxAnalyticsOracle.js","test":"tests/integration/ql7-support-premium-cognitive.integration.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["readOnly"]},
{"requirementId":"MC-99","title":"calibration math Brier ECE NLL drift outcome separate feedback","owner":"lib/ql7-support/semantics/decisionMath.js","productionUseSite":"lib/ql7-support/learning/outcomeCalibrationLedger.js","simulationUseSite":"scripts/ql7-support/premium-cognitive-proof.mjs","independentOracle":"lib/ql7-support/simulation/decisionMathOracle.js","test":"tests/unit/ql7-support/premium-cognitive.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["posterior","expectedLoss"]},
{"requirementId":"MC-100","title":"governance frozen independent shadow canary signed rollback","owner":"lib/ql7-support/learning/governancePolicy.js","productionUseSite":"lib/ql7-support/learning/outcomeCalibrationLedger.js","simulationUseSite":"scripts/ql7-support/learning-governance-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/unit/ql7-support/scientific-governance.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["shadow","canary","rollback"]},
{"requirementId":"MC-101","title":"Runtime Map and Architecture only detailed authorities","owner":"QL7_SUPPORT_ARCHITECTURE_RU.md","productionUseSite":"scripts/ql7-support/runtime-map-audit.mjs","simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["QL7_SUPPORT_FULL_RUNTIME_MAP_AUDIT_RU.md"]},
{"requirementId":"MC-102","title":"UTF8 module type logging deterministic Windows","owner":"lib/ql7-support/package.json","productionUseSite":"lib/ql7-support/runtime/executeTurn.js","simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["type","module"]},
{"requirementId":"MC-103","title":"browser hydration performance accessibility RTL CJK IME budgets","owner":"scripts/ql7-support/browser-acceptance.mjs","productionUseSite":"components/Ql7SupportRuntimeBridge.jsx","simulationUseSite":"scripts/ql7-support/focused-regressions.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["browser"]},
{"requirementId":"MC-104","title":"one cumulative canonical-strength PS1 exact preimage rollback","owner":"laboratory Comands.md","productionUseSite":"QL7_SUPPORT_ARCHITECTURE_RU.md","simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["Quick","Full","VerifyOnly"]},
{"requirementId":"MC-105","title":"Gate0 blocks calibration until all material floors","owner":"lib/ql7-support/config/staticDataReadiness.js","productionUseSite":"lib/ql7-support/runtime/executeTurn.js","simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/integration/ql7-support-code-data-readiness.integration.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["calibrationAllowed"]},
{"requirementId":"MC-106","title":"after Full Verify only empirical work remains no code data placeholders","owner":"lib/ql7-support/config/finalCombatDataFloors.js","productionUseSite":"lib/ql7-support/runtime/executeTurn.js","simulationUseSite":"scripts/ql7-support/full-code-data-readiness-proof.mjs","independentOracle":"lib/ql7-support/simulation/fullCodeDataReadinessOracle.js","test":"tests/contracts/ql7-support-code-data-readiness.contract.test.js","evidence":"report/QL7_SUPPORT_LAB/gate0-code-data-readiness.json","negativeControls":["placeholder","count-inflation","no-bypass"],"requiredTokens":["maxCombatRequirements"]}])
export const QL7_SUPPORT_MAX_COMBAT_REQUIREMENT_COUNT = QL7_SUPPORT_MAX_COMBAT_REQUIREMENTS.length
