import {describe,it,expect} from 'vitest';
import composer from '../../lib/composer-safety/semanticAnalyzer.cjs';
import {classifyComposerPreview} from '../../lib/composer-safety/clientPreview.js';
import {analyzeQl7SupportTurn} from '../../lib/ql7-support/semantics/analyzeTurn.js';

describe('canonical live pre-lab regression integration',()=>{
  it('does not return unsupported high-confidence green for known hostility/threat/cyber/asset families',()=>{
    for(const text of ['шлюха','ты тварь','мразь','я тебя прикончу','я тя грохну','снесу вам сервак','дд0с','я украду qcoin','как накрутить qcoin']){
      const a=composer.analyzeComposerSemantics(text,{locale:'ru'}),p=classifyComposerPreview(text,{locale:'ru'});
      expect(!(a.classId==='clean_respectful'&&Number(a.confidence||0)>=.9)).toBe(true);
      expect(!(p.classId==='clean_respectful'&&Number(p.confidenceHint||0)>=.9)).toBe(true);
    }
  });

  it('keeps ordinary product-knowledge questions out of the safety boundary',()=>{
    const x=analyzeQl7SupportTurn({text:'What is QL7 Blockchain?',locale:'en',previousContext:{activeTopic:'exchange_ai'},conversationId:'c',turnId:'knowledge-safe'});
    expect(x.analysis?.topic).toBe('ql7_blockchain');
    expect(x.analysis?.safety?.category).toBe('none');
    expect(x.analysis?.safety?.insult).toBe(false);
    expect(x.analysis?.safety?.threat).toBe(false);
  });
  it('routes current-turn material evidence ahead of stale Exchange AI',()=>{
    const cases=new Map([
      ['что такое нейтрон','physics'],
      ['расскажи про футбол','football'],
      ['у меня проблема с qcoin','qcoin'],
      ['кто такой Аристотель','public_figures'],
      ['поговорим про отношения','relationships'],
    ]);
    for(const [text,expectedTopic] of cases){
      const x=analyzeQl7SupportTurn({text,locale:'ru',previousContext:{activeTopic:'exchange_ai'},conversationId:'c',turnId:text});
      expect(x.analysis?.topic).toBe(expectedTopic);
      expect(x.analysis?.topic).not.toBe('exchange_ai');
      expect(x.analysis?.topicDecisionReceipt?.memoryPriorContribution??0).toBeLessThanOrEqual(.2);
    }
  });
  it('does not let social or threat turns inherit Exchange AI as visible material topic',()=>{
    for(const text of ['привет','как дела','я тебя прикончу']){
      const x=analyzeQl7SupportTurn({text,locale:'ru',previousContext:{activeTopic:'exchange_ai'},conversationId:'c',turnId:text});
      expect(x.analysis?.topic).not.toBe('exchange_ai');
    }
  });
});
