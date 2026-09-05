import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_RUNTIME_EXECUTOR_ID, QL7_SUPPORT_BEHAVIOR_MANIFEST, QL7_SUPPORT_ALL_LOCALES } from '../../lib/ql7-support/config/behaviorManifest.js'
import { QL7_SUPPORT_CANONICAL_DOMAIN_IDS, QL7_SUPPORT_RELEASE_DOMAIN_ROOTS, QL7_SUPPORT_SYSTEM_ONLY_DOMAINS } from '../../lib/ql7-support/ontology/domainOntology.js'
import { auditQl7SupportKnowledgeGraph } from '../../lib/ql7-support/knowledge/knowledgeGraph.js'
import { listQl7SupportSourceContracts } from '../../lib/ql7-support/sourceRegistry.js'
import { auditQl7SupportCompositionalGrammar } from '../../lib/ql7-support/language/compositionalGrammar.js'
import { auditQl7SupportCapabilityRegistry } from '../../lib/ql7-support/simulation/capabilityRegistry.js'
import { auditQl7SupportLabPlans } from '../../lib/ql7-support/simulation/labPlanRegistry.js'
import { resolveQl7FocusedPackageManagerInvocation } from '../../scripts/ql7-support/focused-regressions.mjs'
import { resolveQl7SupportResponseLocale } from '../../lib/ql7-support/language/responseLocalePolicy.js'
import { QL7_COMPOSER_PREVIEW_DEBOUNCE_MS } from '../../lib/composer-safety/clientPreview.js'

const read=(rel)=>fs.readFileSync(path.join(process.cwd(),rel),'utf8')

describe('QL7 Support canonical architecture closure contract',()=>{
 it('has one canonical production executor and no active version split',()=>{
  expect(QL7_SUPPORT_RUNTIME_EXECUTOR_ID).toBe('executeQl7SupportTurnRuntime')
  expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.runtimeIdentity).toContain('no-active-version-split')
  const runtime=read('lib/ql7-support/runtime/executeTurn.js')
  expect(runtime).toContain('realizeQl7SupportHumanNaturalResponse')
  expect(runtime).not.toMatch(/from\s+['"]\.\.\/response\/realizeNatural\.js['"]/u)
  const winRunner=resolveQl7FocusedPackageManagerInvocation(['exec','vitest','run'],{env:{npm_execpath:'C:/pnpm/pnpm.cjs'},platform:'win32',nodeExecPath:'C:/node/node.exe',exists:()=>true})
  expect(winRunner).toMatchObject({exe:'C:/node/node.exe',mode:'npm_execpath_node',runner:'pnpm.cjs'})
  expect(winRunner.args).toEqual(['C:/pnpm/pnpm.cjs','exec','vitest','run'])
  expect(()=>resolveQl7FocusedPackageManagerInvocation(['exec','vitest'],{env:{},platform:'win32',nodeExecPath:'C:/node/node.exe',exists:()=>false})).toThrow(/npm_execpath_required_on_windows/u)
  const docsShared=read('tools/project-docs-shared.js')
  const docsTree=read('tools/generate-project-tree.js')
  const exactEvidenceGuard="normalized === 'report/QL7_SUPPORT_PATCH' || normalized.startsWith('report/QL7_SUPPORT_PATCH/')"
  expect(docsShared).toContain(exactEvidenceGuard)
  expect(docsTree).toContain(exactEvidenceGuard)
  expect(docsTree).not.toMatch(/ignoredTopDirs\s*=\s*\[[\s\S]{0,1200}['"]report['"]/u)
  expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.projectDocsEvidenceIsolation).toContain('exact-report-QL7_SUPPORT_PATCH')
 })
 it('keeps all 32 locales native-only and requires canonical final-delivery localization',()=>{
  expect(resolveQl7SupportResponseLocale({selectedLocale:'sv'})).toMatchObject({requested:'sv',locale:'sv',kind:'native',supported:true,providerRequired:false,externalTranslationAllowed:false})
  expect(resolveQl7SupportResponseLocale({selectedLocale:'ja'})).toMatchObject({requested:'ja',locale:'ja',kind:'native',supported:true,providerRequired:false,externalTranslationAllowed:false})
  const productionTurn=read('lib/ql7-support/runtime/productionTurn.js')
  const localization=read('lib/ql7-support/language/finalDeliveryLocalization.js')
  expect(productionTurn).toContain('if (!runtime.localePolicy.supported)')
  expect(productionTurn).toContain("typeof input.localizeFinalDelivery !== 'function'")
  expect(productionTurn).toContain("error.code = 'support_locale_temporarily_unavailable'")
  expect(productionTurn).toContain('targetLocale: runtime.localePolicy.requested')
  expect(localization).toContain('localizeQl7SupportReply')
  expect(localization).toContain("['native_translated','same_language','native'].includes(localizedText.translationStatus)")
  expect(localization).toContain('externalTranslationAllowed:false')
  expect(localization).not.toContain("translationStatus !== 'translated'")
  expect(localization).toContain("schema:'ql7.support.native-localization-receipt'")
 })
 it('keeps the normative domain model explicit: 48 canonical = 46 release roots + two system-only domains',()=>{
  expect(QL7_SUPPORT_CANONICAL_DOMAIN_IDS).toHaveLength(48)
  expect(QL7_SUPPORT_RELEASE_DOMAIN_ROOTS).toHaveLength(46)
  expect([...QL7_SUPPORT_SYSTEM_ONLY_DOMAINS].sort()).toEqual(['learning_governance','support_system'])
  expect(auditQl7SupportKnowledgeGraph()).toMatchObject({ok:true,domainCount:48})
  const sources=listQl7SupportSourceContracts()
  expect(sources).toHaveLength(48)
  expect(new Set(sources.map((r)=>r.domainId))).toEqual(new Set(QL7_SUPPORT_CANONICAL_DOMAIN_IDS))
 })
 it('keeps shared Composer Safety semantic, server-authoritative and evidence complete across Forum/DM/Battle Chat',()=>{
  const semantic=read('lib/composer-safety/semanticAnalyzer.cjs')
  const gate=read('lib/composer-safety/serverGate.cjs')
  const receipt=read('lib/composer-safety/decisionReceipt.cjs')
  const warningLedger=read('lib/composer-safety/warningLedger.cjs')
  const securityCase=read('lib/composer-safety/securityCaseService.cjs')
  const forum=read('app/forum/features/ui/components/ComposerCore.jsx')
  const composeDock=read('app/forum/features/ui/components/ComposeDock.jsx')
  const battle=read('app/exchange/battle-chat/BattleChatComposer.jsx')
  const worker=read('app/forum/features/ui/hooks/useComposerSafetyPreview.js')
  const previewWorker=read('lib/composer-safety/previewWorker.js')
  const preview=read('lib/composer-safety/clientPreview.js')
  const badgeLexicon=read('lib/composer-safety/badgeLexicon.js')
  const badge=read('components/composer-safety/ComposerSafetyBadge.jsx')
  const textInput=read('app/forum/features/ui/components/ComposerTextInput.jsx')
  const dmRoute=read('app/api/dm/send/route.js')
  for(const token of ['alternativeClasses','counterEvidence','quoteScope','targetScope','actionability','newsHistoricalEducational','victimReport','counterSpeech']) expect(semantic).toContain(token)
  expect(gate).toContain("require('./semanticAnalyzer.cjs')")
  expect(gate).toContain('analyzeComposerSemantics')
  for(const field of ['decisionId','actorAccountId','surface','inputHash','contentHash','normalizedHash','clientMutationId','locale','selectedClass','alternativeClasses','confidence','margin','evidence','counterEvidence','quoteScope','targetScope','actionability','temporalIntent','capability','specificity','semanticFeatureHash','policyAction','decision','tone','warningCountBefore','warningCountAfter','warningCommitted','persist','clearSubmittedDraft','userRestricted','modelReceiptHash','policyVersion','createdAt','decidedAt','expiresAt','receiptHash','receiptId']) expect(receipt).toContain(field)
  expect(warningLedger).toContain('dismissConfirmedWarning')
  expect(warningLedger).toMatch(/excludedFromRating\s*:\s*true/u)
  expect(receipt).toContain('userRestricted:false')
  expect(receipt).not.toContain('restrictionId')
  expect(forum).not.toContain('ComposerRestrictionBadge')
  expect(battle).not.toContain('ComposerRestrictionBadge')
  expect(worker).toContain('new Worker')
  expect(worker).toContain('QL7_COMPOSER_PREVIEW_DEBOUNCE_MS')
  expect(worker).toContain('resolveComposerPreviewUpdate')
  expect(worker).toContain('fallbackTimer')
  expect(worker).not.toContain('QL7_COMPOSER_PREVIEW_DEBOUNCE_MS/3')
  expect(QL7_COMPOSER_PREVIEW_DEBOUNCE_MS).toBeGreaterThanOrEqual(400)
  expect(QL7_COMPOSER_PREVIEW_DEBOUNCE_MS).toBeLessThanOrEqual(800)
  expect(worker).toContain('locale,targeted')
  expect(previewWorker).toMatch(/import\s*\{\s*classifyComposerPreview\s*\}\s*from\s*['"]\.\/clientPreview\.js['"]/u)
  expect(previewWorker).toContain('payload.locale')
  expect(preview).toContain('matchComposerClientLocaleHints')
  expect(badgeLexicon).toContain('QL7_COMPOSER_BADGE_LOCALES')
  expect(badgeLexicon).toContain('credible_personal_threat')
  expect(badgeLexicon).toContain('getComposerBadgePresentation')
  expect(badge).toContain('ql7ComposerBadgeShine')
  expect(badge).toContain('prefers-reduced-motion: reduce')
  expect(badge).toContain('aria-atomic="true"')
  expect(semantic).toContain('warIncitement')
  expect(semantic).toContain('cyberAttack')
  expect(preview).toContain('warIncitement')
  expect(preview).toContain('cyberAttack')
  expect(preview).toContain('materialActionability')
  expect(composeDock).toContain('<ComposerCore {...composerCoreProps} replyTo={replyTo} />')
  expect(forum).toContain('Boolean((dmMode && !dmSupportMode) || replyTo)')
  expect(forum.indexOf('<ComposerSafetyBadge')).toBeGreaterThanOrEqual(0)
  expect(forum.indexOf('<ComposerSafetyBadge')).toBeLessThan(forum.indexOf('<div className="taWrap"'))
  expect(battle.indexOf('<ComposerSafetyBadge')).toBeGreaterThanOrEqual(0)
  expect(battle.indexOf('<ComposerSafetyBadge')).toBeLessThan(battle.indexOf('<div className={styles.inputShell}>'))
  expect(textInput).toContain('sendDisabled')
  expect(textInput).toContain("event.key !== 'Enter' || sendDisabled")
  expect(gate).toMatch(/const\s+decisionNow\s*=\s*new Date\(Number\(now\)\)\.toISOString\(\)/u)
  expect(gate).toMatch(/verifyComposerDecisionReceipt\(gate\.receipt,\s*\{\s*now\s*\}\)/u)
  expect(gate).toContain('createComposerServerGate')
  expect(warningLedger).toContain('createComposerWarningLedger')
  expect(securityCase).toContain('createComposerSecurityCaseService')
  expect(gate).not.toContain('createQl7SupportInMemoryPolicyDb')
  expect(warningLedger).not.toContain('createQl7SupportInMemoryPolicyDb')
  expect(securityCase).not.toContain('createQl7SupportInMemoryPolicyDb')
  expect(dmRoute).toContain("conversationKind: 'ordinary_dm'")
  expect(dmRoute).not.toMatch(/isQl7SupportMode:\s*true[\s\S]{0,500}conversationKind:\s*'ordinary_dm'/u)
  const focused=read('scripts/ql7-support/focused-regressions.mjs')
  const verify=read('scripts/ql7-support/verify.mjs')
  expect(focused).toContain("proof('composer-safety-proof'")
  expect(focused).toContain('composer-safety-proof.mjs')
  expect(focused).toContain("const evidenceDir = path.resolve(path.dirname(out), 'focused-evidence')")
  expect(focused).toContain('path.join(evidenceDir, `${name}.json`)')
  for (const token of ['owner-graph','static','feature-parity','no-bypass','oracle-isolation','composer-safety-proof']) expect(focused).toContain(`proof('${token}'`)
  expect(verify).toContain('stage_evidence_not_written')
  expect(verify).toContain('evidenceWritten')
  expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.composerSafetyContract).toContain('server-semantic-authority')
  expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.composerSafetyContract).toContain('32-locale-same-worker-fallback-classifier')
  expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.composerSafetyContract).toContain('explicit-test-service-factory-injection')
  expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.composerSafetyContract).toContain('production-mongo-authoritative')
 })
 it('keeps live-read on the same production-shaped verified identity envelope without weakening the production guard',()=>{
  const liveRead=read('lib/ql7-support/simulation/liveRead.js')
  const requestEnvelope=read('lib/ql7-support/contracts/supportTurnRequestEnvelope.js')
  expect(liveRead).toContain('verifiedActorId: canonicalAccountId')
  expect(liveRead).toContain("authMode: 'laboratory_verified_identity'")
  expect(liveRead).toContain('actorReceiptId: `actor-receipt:live-read:')
  expect(liveRead).toContain('executeQl7SupportProductionTurn')
  expect(requestEnvelope).toContain('verified_actor_required')
  expect(requestEnvelope).toContain('actor_receipt_required')
 })
 it('keeps independent human/composer laboratory oracles and explicit acceptance contracts for every release plan',()=>{
  const worker=read('scripts/ql7-support/oracle-worker.mjs')
  const lab=read('scripts/ql7-support/lab.mjs')
  expect(worker).toContain('evaluateHumanNaturalnessIndependent')
  expect(worker).toContain('evaluateComposerSafetyIndependent')
  expect(lab).toContain('acceptanceContract')
  const plans=auditQl7SupportLabPlans()
  expect(plans.ok).toBe(true)
  for(const p of plans.plans){
   expect(p.acceptance?.gate).toBeTruthy()
   expect(p.acceptance?.zeroHardFailures).toBe(true)
   expect(p.acceptance?.requiredOracles?.length).toBeGreaterThan(0)
   expect(p.acceptance?.requiredEvidence?.length).toBeGreaterThan(0)
  }
 })
 it('keeps all 32 locales, zero ready-to-send grammar rows and capability/lab registries complete',()=>{
  expect(QL7_SUPPORT_ALL_LOCALES).toHaveLength(32)
  expect(auditQl7SupportCompositionalGrammar()).toMatchObject({ok:true,finalSentenceRows:0})
  expect(auditQl7SupportCapabilityRegistry()).toMatchObject({ok:true})
  const plans=auditQl7SupportLabPlans()
  expect(plans.ok).toBe(true)
  expect(Object.fromEntries(plans.plans.map((p)=>[p.planId,p.total]))).toMatchObject({
   'calibration-5000':5000,
   'human-calibration-50000':50000,
   'production-1100k':1100000,
   'human-naturalness-domain-isolation-3200k':3200000,
   'complete-4300k':4300000,
   'cell-holdout-1472k':1472000,
   'memory-longitudinal-147200':147200,
   'metamorphic-2355200':2355200,
   'chaos-100000':100000,
  })
 })
})
