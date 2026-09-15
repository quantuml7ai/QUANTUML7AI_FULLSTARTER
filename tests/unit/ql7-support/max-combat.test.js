import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_NOVELTY_RESERVATION_POLICY, buildQl7SupportNoveltyReservationDescriptors, buildQl7SupportSemanticContextObservation, buildQl7SupportNoveltyReservationScopeId } from '../../../lib/ql7-support/response/noveltyReservation.js'
import { nextQl7SupportRegenerationStrategy, QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS } from '../../../lib/ql7-support/response/regenerationController.js'
import { evaluateQl7SupportSurfaceRedundancy } from '../../../lib/ql7-support/response/surfaceRedundancyGuard.js'
import { buildQl7SupportPublicFigureKnowledgeGraph, auditQl7SupportPublicFigureKnowledgeGraph, resolveQl7SupportPublicFigureFromGraph, QL7_SUPPORT_PUBLIC_FIGURE_REQUIRED_COVERAGE } from '../../../lib/ql7-support/knowledge/publicFigureKnowledgeGraph.js'
import { QL7_SUPPORT_PUBLIC_FIGURE_MAX_CURATED } from '../../../lib/ql7-support/knowledge/publicFigureRegistry.js'
import { auditQl7SupportHumorMechanismCapacity, buildQl7SupportHumorMechanismPlan, QL7_SUPPORT_HUMOR_CAPACITY_FLOOR_PER_LOCALE } from '../../../lib/ql7-support/knowledge/humorMechanismOntology.js'
import { evaluateQl7SupportHumorSafety } from '../../../lib/ql7-support/knowledge/humorSafetyPolicy.js'
import { assessQl7SupportEcosystemAttack } from '../../../lib/ql7-support/security/ecosystemAttackAssessment.js'
import { evaluateQl7SupportIllicitAssetRoute, listQl7SupportLawfulDigitalAssetRoutes } from '../../../lib/ql7-support/security/illicitAssetRoutePolicy.js'
import { evaluateSurfaceRedundancyIndependent } from '../../../lib/ql7-support/simulation/surfaceRedundancyOracle.js'
import riskConceptsPkg from '../../../lib/composer-safety/localeRiskConcepts.cjs'
import semanticHintsPkg from '../../../lib/composer-safety/localeSemanticHints.cjs'
import semanticAnalyzerPkg from '../../../lib/composer-safety/semanticAnalyzer.cjs'
import { QL7_COMPOSER_CLIENT_LOCALE_RISK_CONCEPTS } from '../../../lib/composer-safety/localeRiskConcepts.client.js'
import { QL7_COMPOSER_CLIENT_LOCALE_HINTS } from '../../../lib/composer-safety/localeSemanticHints.client.js'
import { classifyComposerPreview } from '../../../lib/composer-safety/clientPreview.js'

describe('canonical MAX COMBAT architecture', () => {
  it('does not make semantic identity an exclusive novelty reservation', () => {
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.semanticIdentityIsExclusive).toBe(false)
    const qualityGate={novelty:{fingerprint:{exactHash:'a',normalizedHash:'b',unorderedSentenceMultisetHash:'c',unorderedClauseMultisetHash:'d',rhetoricalSkeletonHash:'e',openingHash:'f',closingHash:'g',titleHash:'h',sentenceHashes:['i'],clauseHashes:['j'],minHashSignature:['k']}}}
    const scopeReceipt={primaryDomainId:'qcoin',primaryMicrotopicId:'qcoin.balance',selectedIntentId:'status',memoryHash:'m',allowedFactIds:['fact:1']}
    const rows=buildQl7SupportNoveltyReservationDescriptors({actorIdHash:'actor',conversationId:'conv-1',turnId:'turn-1',locale:'ru',scopeReceipt,semanticPlan:{planHash:'p'},qualityGate})
    expect(rows.some((r)=>r.fingerprintType==='semantic_context')).toBe(false)
    const observation=buildQl7SupportSemanticContextObservation({actorIdHash:'actor',locale:'ru',scopeReceipt,semanticPlan:{planHash:'p'}})
    expect(observation.exclusive).toBe(false)
  })

  it('scopes durable novelty reservations to one actor conversation turn while historical anti-repeat stays in the novelty ledger', () => {
    const qualityGate={novelty:{fingerprint:{exactHash:'same',normalizedHash:'same-n',unorderedSentenceMultisetHash:'same-s',unorderedClauseMultisetHash:'same-c',rhetoricalSkeletonHash:'same-r'}}}
    const scopeReceipt={primaryDomainId:'support_system',primaryMicrotopicId:'support.answer',selectedIntentId:'answer'}
    const a=buildQl7SupportNoveltyReservationDescriptors({actorIdHash:'actor',conversationId:'conv',turnId:'turn-1',locale:'ru',scopeReceipt,qualityGate})
    const b=buildQl7SupportNoveltyReservationDescriptors({actorIdHash:'actor',conversationId:'conv',turnId:'turn-2',locale:'ru',scopeReceipt,qualityGate})
    const retry=buildQl7SupportNoveltyReservationDescriptors({actorIdHash:'actor',conversationId:'conv',turnId:'turn-1',locale:'ru',scopeReceipt,qualityGate})
    expect(QL7_SUPPORT_NOVELTY_RESERVATION_POLICY.durableReservationScope).toBe('actor_conversation_turn')
    expect(buildQl7SupportNoveltyReservationScopeId({actorIdHash:'actor',conversationId:'conv',turnId:'turn-1'})).not.toBe(buildQl7SupportNoveltyReservationScopeId({actorIdHash:'actor',conversationId:'conv',turnId:'turn-2'}))
    expect(a.map((row)=>row.reservationId)).not.toEqual(b.map((row)=>row.reservationId))
    expect(a.map((row)=>row.reservationId)).toEqual(retry.map((row)=>row.reservationId))
  })
  it('selects a collision-relevant strategy and has a bounded budget', () => {
    const row=nextQl7SupportRegenerationStrategy({attempt:0,collisionReceipt:{fingerprintType:'sentence_multiset'}})
    expect(row.action).toBe('regenerate');expect(row.changedDimensions.length).toBeGreaterThan(0);expect(QL7_SUPPORT_MAX_REGENERATION_ATTEMPTS).toBeGreaterThanOrEqual(16)
  })
  it('detects cross-surface/table redundancy independently', () => {
    const surface={title:'QCoin',status:{label:'Активно'},badges:[{label:'Активно'}],tables:[{title:'QCoin',rows:[{key:'balance',label:'Баланс',value:'100'},{key:'balance',label:'Баланс',value:'100'}]}]}
    const prod=evaluateQl7SupportSurfaceRedundancy({surface,text:'Баланс 100',domainId:'qcoin',locale:'ru'})
    const oracle=evaluateSurfaceRedundancyIndependent({surface,text:'Баланс 100'})
    expect(prod.ok).toBe(false);expect(oracle.ok).toBe(false)
  })
  it('allows equal metric values for distinct campaign entities while rejecting a duplicate entity table', () => {
    const campaignTable=(id,title)=>({id,title,schema:'ql7.table.ads.campaign',rows:[{key:'status',label:'Статус',value:'active'},{key:'ctr',label:'CTR',value:'4%'}]})
    const distinct={topic:'ads_campaigns',tables:[campaignTable('campaign-a','Alpha'),campaignTable('campaign-b','Beta')]}
    expect(evaluateQl7SupportSurfaceRedundancy({surface:distinct,domainId:'ads_campaigns',locale:'ru'}).ok).toBe(true)
    expect(evaluateSurfaceRedundancyIndependent({surface:distinct}).ok).toBe(true)
    const duplicate={topic:'ads_campaigns',tables:[campaignTable('campaign-a','Alpha'),campaignTable('campaign-a-copy','Alpha')]}
    expect(evaluateQl7SupportSurfaceRedundancy({surface:duplicate,domainId:'ads_campaigns',locale:'ru'}).failures).toContain('surface_duplicate_table_row')
    expect(evaluateSurfaceRedundancyIndependent({surface:duplicate}).failures).toContain('duplicate_table_row')
  })
  it('keeps public-figure coverage floor explicit instead of inventing rows', () => {
    const graph=buildQl7SupportPublicFigureKnowledgeGraph();const audit=auditQl7SupportPublicFigureKnowledgeGraph(graph)
    expect(QL7_SUPPORT_PUBLIC_FIGURE_REQUIRED_COVERAGE).toBeGreaterThanOrEqual(1050);expect(audit.count).toBeGreaterThanOrEqual(1050);expect(audit.releaseOk).toBe(true)
  })
  it('keeps public-figure architecture above the >=1050 installed data floor and resolves approved graph entries', () => {
    expect(QL7_SUPPORT_PUBLIC_FIGURE_MAX_CURATED).toBeGreaterThanOrEqual(QL7_SUPPORT_PUBLIC_FIGURE_REQUIRED_COVERAGE)
    const graph=buildQl7SupportPublicFigureKnowledgeGraph({approvedEntries:[{personId:'approved-test-figure',canonicalName:'Approved Test Figure',aliases:['approved test figure'],categories:['science'],sourceRefs:['approved:test'],currentSensitive:false}]})
    const resolved=resolveQl7SupportPublicFigureFromGraph('Tell me about Approved Test Figure',{graph})
    expect(resolved?.decision).toBe('selected');expect(resolved?.selected?.personId).toBe('approved-test-figure')
  })

  it('defines >10k semantic humor plan capacity without ready-to-send punchlines', () => {
    const audit=auditQl7SupportHumorMechanismCapacity();expect(audit.theoreticalSemanticPlanCapacity).toBeGreaterThan(QL7_SUPPORT_HUMOR_CAPACITY_FLOOR_PER_LOCALE)
    const plan=buildQl7SupportHumorMechanismPlan({locale:'ru',topic:'football',index:12345,seed:'x'});expect(plan.readyToSend).toBe(false);expect(plan.finalText).toBe(false)
  })
  it('suppresses humor for severe contexts', () => { expect(evaluateQl7SupportHumorSafety({requested:true,safetyClass:'terrorism_operational_intent'}).allowed).toBe(false) })
  it('uses semantic safety/actionability for ecosystem attack decisions rather than lexical hit alone', () => {
    const news=assessQl7SupportEcosystemAttack({text:'новости о кибератаке',locale:'ru',safety:{category:'news_historical_educational_context'},analysis:{materialActionability:false}})
    expect(news.operational).toBe(false)
    const operational=assessQl7SupportEcosystemAttack({text:'target',locale:'ru',safety:{category:'property_destruction_incitement',materialActionability:true},analysis:{materialActionability:true,ecosystemTarget:true}})
    expect(operational.operational).toBe(true);expect(operational.punitiveDecision).toBe(false)
  })
  it('covers severe risk concepts across all 32 locales with client/server parity', () => {
    const riskRows=riskConceptsPkg.QL7_COMPOSER_LOCALE_RISK_CONCEPTS
    const hintRows=semanticHintsPkg.QL7_COMPOSER_LOCALE_SEMANTIC_HINTS
    expect(Object.keys(riskRows)).toHaveLength(32)
    expect(Object.keys(QL7_COMPOSER_CLIENT_LOCALE_RISK_CONCEPTS)).toHaveLength(32)
    for(const locale of Object.keys(riskRows)){
      for(const family of ['kill','attack','war','riot','destroy','cyber','incite','commitment'])expect(riskRows[locale][family]?.length,`${locale}:${family}`).toBeGreaterThan(0)
      const text=`${hintRows[locale].first[0]} ${riskRows[locale].commitment[0]} ${riskRows[locale].kill[0]}`
      const server=semanticAnalyzerPkg.analyzeComposerSemantics(text,{locale,targeted:true})
      const client=classifyComposerPreview(`${QL7_COMPOSER_CLIENT_LOCALE_HINTS[locale].first[0]} ${QL7_COMPOSER_CLIENT_LOCALE_RISK_CONCEPTS[locale].commitment[0]} ${QL7_COMPOSER_CLIENT_LOCALE_RISK_CONCEPTS[locale].kill[0]}`,{locale,targeted:true})
      expect(server.classId,`server:${locale}`).toBe('credible_personal_threat')
      expect(client.classId,`client:${locale}`).toBe('credible_personal_threat')
    }
  }, 15_000)
  it('keeps lawful asset routes explicit and semantic abuse assessment non-punitive', () => {
    expect(listQl7SupportLawfulDigitalAssetRoutes().length).toBeGreaterThanOrEqual(9)
    const row=evaluateQl7SupportIllicitAssetRoute({text:'пример',analysis:{messageAct:'how_to_question',scamCrimeSignal:true,materialActionability:true},safety:{materialActionability:true}})
    expect(row.punitiveDecision).toBe(false);expect(row.requiresEconomicPolicyReceipt).toBe(true)
  })
})
