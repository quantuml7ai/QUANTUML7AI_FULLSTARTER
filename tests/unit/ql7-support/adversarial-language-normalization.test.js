import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_SEMANTIC_BANK_LOCALES,
  collectQl7SafetySignals,
  getQl7SemanticBank,
} from '../../../lib/ql7-support/language/semanticBanks.js'
import { createRequire } from 'node:module'

const require=createRequire(import.meta.url)
const shared=require('../../../lib/ql7-support/safety/sharedSemanticEvidence.cjs')

describe('QL7 adversarial language normalization',()=>{
  it('keeps all 32 canonical locales materially populated',()=>{
    expect(QL7_SUPPORT_SEMANTIC_BANK_LOCALES).toHaveLength(32)
    for(const locale of QL7_SUPPORT_SEMANTIC_BANK_LOCALES){
      const bank=getQl7SemanticBank(locale)
      expect(bank.profanity.length).toBeGreaterThanOrEqual(64)
      expect(bank.directInsults.length).toBeGreaterThanOrEqual(48)
      expect(bank.threats.length).toBeGreaterThanOrEqual(32)
    }
  })

  it('repairs representative intentional obfuscations instead of relying on exact keywords',()=>{
    for(const text of ['б/л/я/т/ь','б@л@я@т@ь','б#л#я#т#ь','б🙂л🙂я🙂т🙂ь','б л я т ь','п/и/д/о/р']){
      const signals=collectQl7SafetySignals(text,'ru')
      const frame=shared.evaluateQl7SharedSemanticSafety(text,{locale:'ru'})
      expect(signals.profanity.length+signals.directInsults.length+signals.euphemisms.length>0 || frame.semanticClass==='direct_insult').toBe(true)
    }
  })

  it('recognizes short Hangul safety material after canonical normalization',()=>{
    const signals=collectQl7SafetySignals('젠장','ko')
    expect(signals.profanity.length+signals.directInsults.length+signals.euphemisms.length).toBeGreaterThan(0)
  })

  it('uses context roles so quotation and victim reports are not treated as direct hostile acts',()=>{
    expect(shared.evaluateQl7SharedSemanticSafety('ты пидор',{locale:'ru'}).semanticClass).toBe('direct_insult')
    expect(shared.evaluateQl7SharedSemanticSafety('цитата: «ты пидор»',{locale:'ru'}).semanticClass).toBe('quoted_or_reported_harm')
    expect(shared.evaluateQl7SharedSemanticSafety('мне написали «я тебя убью»',{locale:'ru'}).semanticClass).toBe('victim_report')
  })
})
