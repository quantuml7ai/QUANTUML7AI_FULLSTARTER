import { describe, expect, it } from 'vitest'
import { executeQl7SupportTurnRuntime } from '../../lib/ql7-support/runtime/executeTurn.js'

describe('QL7 Support canonical P0 repeated-same-intent production-shaped integration',()=>{
  it('does not surface internal novelty conflict or response-quality exhaustion',async()=>{
    let memoryGraph=null, noveltyLedger=null, ledger=null
    const hashes=new Set()
    let safeFallbackCount=0
    for(let turn=1;turn<=12;turn+=1){
      const result=await executeQl7SupportTurnRuntime({
        requestId:`canonical-p0-${turn}`,conversationId:'canonical-p0-conversation',turnId:`canonical-p0-turn-${turn}`,actorIdHash:'canonical-p0-actor',
        text:'Как работает QCoin?',locale:'ru',priorMemoryGraph:memoryGraph,priorNoveltyLedger:noveltyLedger,ledger,
        now:new Date(1787080000000+turn*1000).toISOString(),
      })
      expect(result.qualityGate.decision).not.toBe('regenerate')
      expect(result.realized.text.length).toBeGreaterThan(0)
      expect(hashes.has(result.realized.responseHash)).toBe(false)
      hashes.add(result.realized.responseHash)
      if(result.regenerationReceipt?.action==='safe_clarification_delivered'){
        safeFallbackCount+=1
        expect(result.regenerationReceipt.strategy).toBe('scope-safe-clarification')
        expect(result.regenerationReceipt.fallbackQualityGateReceiptHash).toBe(result.qualityGate.receiptHash)
      }
      memoryGraph=result.memoryAfter;noveltyLedger=result.noveltyLedger;ledger=result.ledger
    }
    expect(safeFallbackCount).toBeGreaterThan(0)
    expect(hashes.size).toBe(12)
  }, 30000)
})
