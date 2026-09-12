import { describe, expect, it } from 'vitest'
import { evaluateQl7SupportSafety } from '../../lib/ql7-support/safety/evaluateTurn.js'
import { readQl7SupportAiBoxAnalysis } from '../../lib/ql7-support/data/aiBoxSupportReadAdapter.js'
import { analyzeAiBoxMarket, QL7_AI_BOX_ANALYSIS_SERVICE_OWNER_ID } from '../../lib/exchange/aiBoxAnalysisService.js'
import { verifyQl7AiBoxAnalyticsIndependent } from '../../lib/ql7-support/simulation/aiBoxAnalyticsOracle.js'

const pack=(symbol,tf)=>({symbol,tf,c:[100,101,102,103],extras:{venueSpread:.004,venues:['A','B'],globalSpot:103}})
const deps={
  fetchMultiVenuePack:async(symbol,tf)=>pack(symbol,tf),
  brain:{analyzeTF:(row)=>({action:'BUY',confidence:72,price:Number(row.c.at(-1)),diagnostics:{totalScore:5,atrRel:.02},horizons:{'1h':104,'6h':106,'24h':110},support:[99],resistance:[108],entry:{low:101,high:103},stop:98,targets:[106,110],reasons:[{key:'trend',params:{}}]})},
}

describe('canonical premium production-path integrations',()=>{
  it('routes crisis assessment through canonical Support safety and keeps the input writable',()=>{
    const crisis=evaluateQl7SupportSafety({text:'я х0чy умереть прямо сейчас',locale:'ru',priorLedger:{}})
    expect(crisis.category).toBe('crisis');expect(crisis.selfHarm).toBe(true);expect(crisis.operatorRequired).toBe(true)
    expect(crisis.inputMustRemainWritable).toBe(true);expect(crisis.cooldownMs).toBe(0);expect(crisis.crisisAssessment.punitiveActionEligible).toBe(false)
    const news=evaluateQl7SupportSafety({text:'в новостях обсуждали профилактику суицида',locale:'ru',priorLedger:{}})
    expect(news.selfHarm).toBe(false)
  })
  it('uses the same AI Box analysis owner for the Exchange route and QL7 Support read-only projection',async()=>{
    const product=await analyzeAiBoxMarket({symbol:'BTCUSDT',tf:'5m'},deps)
    const support=await readQl7SupportAiBoxAnalysis({analysis:{topic:'exchange_ai',marketSignals:{symbol:'BTCUSDT',timeframe:'5m'}},actor:{id:'actor-1'},deps,now:new Date('2026-08-18T22:00:00.000Z')})
    expect(verifyQl7AiBoxAnalyticsIndependent(product).ok).toBe(true)
    expect(product.ownerId).toBe(QL7_AI_BOX_ANALYSIS_SERVICE_OWNER_ID)
    expect(support.result.sourceOwnerId).toBe(QL7_AI_BOX_ANALYSIS_SERVICE_OWNER_ID)
    expect(support.readOnly).toBe(true);expect(support.writeCount).toBe(0)
    expect(support.result.action).toBe(product.data.action);expect(support.result.confidence).toBe(product.data.confidence)
    expect(support.result.disclaimerId).toBe('analytics_not_financial_advice')
  })
})
