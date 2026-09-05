import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_CRISIS_REQUIRED_LOCALES, auditQl7SupportCrisisConceptBank, getQl7SupportCrisisConcepts } from '../../../lib/ql7-support/safety/crisisConceptBank.js'
import { auditQl7SupportRobustConceptMatcher } from '../../../lib/ql7-support/language/robustConceptMatcher.js'
import { assessQl7SupportCrisis } from '../../../lib/ql7-support/safety/crisisAssessment.js'
import { verifyQl7SupportCrisisReceiptIndependent } from '../../../lib/ql7-support/simulation/crisisSafetyOracle.js'
import { auditQl7DecisionMathContract, buildQl7DecisionMathReceipt } from '../../../lib/ql7-support/semantics/decisionMath.js'
import { verifyQl7SupportDecisionMathIndependent } from '../../../lib/ql7-support/simulation/decisionMathOracle.js'
import { auditQl7SupportClarificationStrategies } from '../../../lib/ql7-support/semantics/clarificationStrategyRegistry.js'
import { rankQl7SupportClarifications } from '../../../lib/ql7-support/semantics/clarificationRanker.js'
import { evaluateQl7SupportClarificationReceiptIndependent } from '../../../lib/ql7-support/simulation/clarificationOracle.js'
import { auditQl7SupportDiscourseStrategyCapacity } from '../../../lib/ql7-support/response/discourseStrategyRegistry.js'
import { getQl7SemanticBankCoverage } from '../../../lib/ql7-support/language/semanticBanks.js'
import { evaluateAiBoxSignalEngine } from '../../../lib/exchange/aiBoxAnalysisService.js'
import { buildQl7SupportOutcomeCalibrationReceipt, aggregateQl7SupportOutcomeCalibration } from '../../../lib/ql7-support/learning/outcomeCalibrationLedger.js'
import { evaluateQl7SupportOutcomeCalibrationIndependent } from '../../../lib/ql7-support/simulation/outcomeCalibrationOracle.js'
import { buildQl7SupportRussianEvidenceAggregation } from '../../../lib/ql7-support/operator/evidenceAggregation.js'
import { evaluateQl7SupportOperatorEvidenceIndependent } from '../../../lib/ql7-support/simulation/operatorEvidenceOracle.js'
import { listQl7SupportEntryGreetings } from '../../../lib/ql7-support/entryGreetingLexicon.js'
import { realizeQl7HumanEntryGreetingStrategy } from '../../../lib/ql7-support/language/humanVariationPrimitives.js'
import { evaluateQl7SupportGreetingCapacityIndependent } from '../../../lib/ql7-support/simulation/greetingCapacityOracle.js'

describe('canonical premium cognitive/safety architecture',()=>{
  it('has a 32-locale crisis concept bank and robust damaged-input matcher',()=>{
    const bank=auditQl7SupportCrisisConceptBank();const matcher=auditQl7SupportRobustConceptMatcher()
    expect(bank.ok).toBe(true);expect(bank.localeCount).toBe(32);expect(bank.phraseCount).toBeGreaterThan(700);expect(bank.nativeDialectCompletenessClaimed).toBe(false);expect(bank.nativeReviewRequired).toBe(true)
    expect(matcher.ok).toBe(true)
  })
  it('detects explicit immediate self-harm intent across every supported locale without punitive cooldown',()=>{
    expect(QL7_SUPPORT_CRISIS_REQUIRED_LOCALES).toHaveLength(32)
    for(const locale of QL7_SUPPORT_CRISIS_REQUIRED_LOCALES){
      const bank=getQl7SupportCrisisConcepts(locale)
      const text=[bank.selfPronouns?.[0],bank.ideation?.[0],bank.action?.[0],bank.immediacy?.[0]].filter(Boolean).join(' ')
      const receipt=assessQl7SupportCrisis({text,locale})
      const oracle=verifyQl7SupportCrisisReceiptIndependent({receipt,expected:{selfHarm:true,immediate:true,operatorRequired:true,nonPunitive:true}})
      expect(oracle.ok,`${locale}:${oracle.failures.join(',')}`).toBe(true)
      expect(receipt.inputMustRemainWritable).toBe(true);expect(receipt.composerCooldownMs).toBe(0)
    }
  })
  it('keeps news/reported crisis discussion non-punitive',()=>{
    for(const row of [{locale:'ru',text:'В новостях обсуждали профилактику суицида и помощь людям'},{locale:'en',text:'The news discussed suicide prevention and how people can seek help'},{locale:'ja',text:'ニュースで自殺予防と支援について議論した'}]){
      const receipt=assessQl7SupportCrisis({...row,context:{reportedSpeech:true}})
      expect(receipt.selfHarm,row.locale).toBe(false);expect(receipt.punitiveActionEligible).toBe(false)
    }
  })
  it('calculates calibrated decision evidence separately from deterministic side-effect eligibility',()=>{
    expect(auditQl7DecisionMathContract().ok).toBe(true)
    const receipt=buildQl7DecisionMathReceipt({
      text:'check payment',locale:'en',domain:'payments',intentFamily:'personal_status_request',
      decisionKind:'quarantine',policyProofPresent:false,evidenceCoverage:.9,sourceStaleness:.05,
      scoring:{
        topicCandidates:[
          {topic:'payments',total:7.4,components:{lexicalScore:4,entityScore:2,messageActScore:1.4}},
          {topic:'wallet',total:2.2,components:{lexicalScore:1.2,entityScore:1}},
        ],
        positiveSignals:[{topic:'payments',signal:'payment_status',component:'entityScore',value:2}],
        negativeSignals:[],confidenceMargin:5.2,semanticEntropy:.55,calibrationCellSamples:1000,
      },
      memoryGraph:{activeTopic:'payments'},
    })
    const oracle=verifyQl7SupportDecisionMathIndependent(receipt)
    expect(oracle.ok,oracle.failures.join(',')).toBe(true)
    expect(receipt.semanticEvidencePresent).toBe(true)
    expect(receipt.posteriorMetrics.posteriorCount).toBeGreaterThanOrEqual(2)
    expect(receipt.posteriorMetrics.topProbability).toBeGreaterThan(0);expect(receipt.expectedLoss).toBeGreaterThanOrEqual(0)
    expect(receipt.policyEligibility.generativeScoreIsAuthority).toBe(false);expect(receipt.policyEligibility.sideEffectEligible).toBe(false)
  })
  it('ranks >=100 internal clarification strategies but exposes at most four semantic options',()=>{
    expect(auditQl7SupportClarificationStrategies().count).toBeGreaterThanOrEqual(100)
    const receipt=rankQl7SupportClarifications({locale:'ru',hypotheses:[{id:'wallet',probability:.48},{id:'payments',probability:.45},{id:'exchange',probability:.07}],missingSlots:['operation']})
    expect(evaluateQl7SupportClarificationReceiptIndependent(receipt).ok).toBe(true)
    expect(receipt.internalCandidateCount).toBeGreaterThanOrEqual(100);expect(receipt.visibleOptionCount).toBeLessThanOrEqual(4);expect(receipt.oneBestQuestionPolicy).toBe(true)
  })
  it('keeps large semantic banks and discourse plans as semantic primitives rather than ready text slabs',()=>{
    const banks=getQl7SemanticBankCoverage();const discourse=auditQl7SupportDiscourseStrategyCapacity()
    expect(banks.localeCount).toBe(32);expect(banks.totalTerms).toBeGreaterThan(100000);expect(discourse.ok).toBe(true);expect(discourse.count).toBeGreaterThan(400)
  })
  it('computes AI Box signal/risk as read-only analytics',()=>{
    const row=evaluateAiBoxSignalEngine({symbol:'BTCUSDT',tf:'5m',core:{action:'BUY',confidence:74,diagnostics:{totalScore:5,atrRel:.02}},htfAnalysed:[{tf:'1h',result:{action:'BUY',diagnostics:{totalScore:5}}}],venueSpread:.004})
    expect(row.finalAction).toBe('BUY');expect(row.finalConfidence).toBeGreaterThan(74);expect(row.risk.riskScore).toBeGreaterThanOrEqual(0);expect(row.risk.riskScore).toBeLessThanOrEqual(100)
  })
  it('records feedback as calibration evidence but forbids autonomous production promotion',()=>{
    const decision=buildQl7DecisionMathReceipt({
      text:'payment',locale:'ru',domain:'payments',intentFamily:'feedback_context',
      scoring:{topicCandidates:[{topic:'payments',total:8,components:{lexicalScore:5,entityScore:3}}],positiveSignals:[],negativeSignals:[],confidenceMargin:8,semanticEntropy:0,calibrationCellSamples:1000},
      evidenceCoverage:1,memoryGraph:{activeTopic:'payments'},
    })
    const receipt=buildQl7SupportOutcomeCalibrationReceipt({actorId:'a',turnId:'t',deliveryReceiptId:'d',outcomeType:'helpful',topic:'payments',locale:'ru',decisionMathReceipt:decision})
    const aggregate=aggregateQl7SupportOutcomeCalibration([receipt])
    expect(evaluateQl7SupportOutcomeCalibrationIndependent(receipt,aggregate).ok).toBe(true)
    expect(receipt.automaticProductionPromotion).toBe(false);expect(receipt.requiresHumanApproval).toBe(true);expect(aggregate.promotionEligible).toBe(false)
  })
  it('proves at least 1000 normalized-distinct fresh greeting realizations for every native locale',()=>{
    for(const locale of ['en','ru','uk','es','tr','ar','zh','he']){
      const strategies=listQl7SupportEntryGreetings(locale).filter((row)=>row.entryMode==='fresh').slice(0,1200)
      const texts=strategies.map((strategy)=>realizeQl7HumanEntryGreetingStrategy({strategy,seed:`unit:${locale}`}).text)
      const oracle=evaluateQl7SupportGreetingCapacityIndependent({locale,texts,required:1000,mode:'fresh'})
      expect(oracle.ok,`${locale}:${oracle.failures.join(',')}`).toBe(true)
      expect(oracle.normalizedUnique).toBeGreaterThanOrEqual(1000)
    }
  })
  it('keeps Russian operator evidence separated and free of raw database dumps/secrets',()=>{
    const receipt=buildQl7SupportRussianEvidenceAggregation({analysis:{intent:'payment_status',topic:'payments',locale:'ru'},checks:[{topic:'payments',state:'verified',receiptId:'r1'}]})
    const oracle=evaluateQl7SupportOperatorEvidenceIndependent(receipt)
    expect(oracle.ok).toBe(true);expect(receipt.fieldsSeparated).toBe(true);expect(receipt.rawMongoDumpIncluded).toBe(false);expect(receipt.secretsIncluded).toBe(false)
  })
})
