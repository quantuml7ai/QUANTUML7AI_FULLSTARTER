import {describe,it,expect} from 'vitest';
import {runQl7MaterialityOracle} from '../../../lib/ql7-support/simulation/materialityOracle.js';
import {auditQl7SupportMicrotopicOntology} from '../../../lib/ql7-support/ontology/microtopicOntology.js';
import {auditQl7RuntimeStateMonotonicity} from '../../../lib/ql7-support/runtime/runtimeStateReceipt.js';
import {auditQl7TurnSequencer} from '../../../lib/ql7-support/runtime/turnSequencer.js';
import {auditQl7EntrySession} from '../../../lib/ql7-support/greeting/entrySession.js';
import {evaluateQl7SharedSemanticSafety} from '../../../lib/ql7-support/safety/sharedSemanticEvidence.js';
import {evaluateQl7SupportSafety} from '../../../lib/ql7-support/safety/evaluateTurn.js';
import {buildQl7SupportBadges} from '../../../lib/ql7-support/presentation/badgePolicy.js';

describe('canonical material runtime',()=>{
  it('meets material floors without coordinate inflation',()=>{
    const r=runQl7MaterialityOracle();
    expect(r.ok).toBe(true);
    expect(r.language.localeCount).toBe(32);
    for(const x of Object.values(r.language.locales)) expect(x.normalizedDistinct).toBeGreaterThanOrEqual(1500);
    expect(r.crisis.totalDistinct).toBeGreaterThanOrEqual(2048);
    expect(r.generalHuman.materialNodeCount).toBeGreaterThanOrEqual(12000);
    expect(r.conversation.materialCellCount).toBeGreaterThanOrEqual(8192);
    expect(r.publicFigures.selfCatalogOnlySubstantiveFacts).toBe(0);
    expect(r.publicFigures.profileAccountingPct).toBe(100);
  });

  it('rejects weak short-token threat false positives while preserving a material Turkish threat',()=>{
    const benign=evaluateQl7SharedSemanticSafety('bana denizden bahset',{locale:'tr'});
    expect(benign.risk).not.toBe('severe');
    expect(benign.semanticClass).toBe('clean_respectful');
    expect(evaluateQl7SupportSafety({text:'bana denizden bahset',locale:'tr'}).threat).toBe(false);
    const threat=evaluateQl7SharedSemanticSafety('sana zarar vereceğim',{locale:'tr'});
    expect(threat.semanticClass).toBe('credible_threat');
    expect(threat.risk).toBe('severe');
    expect(evaluateQl7SupportSafety({text:'sana zarar vereceğim',locale:'tr'}).threat).toBe(true);
  });

  it('keeps generic knowledge and metalinguistic safety controls out of direct-abuse policy',()=>{
    const general=evaluateQl7SharedSemanticSafety('What is QL7 Blockchain?',{locale:'en'});
    expect(general.semanticClass).toBe('clean_respectful');
    expect(evaluateQl7SupportSafety({text:'What is QL7 Blockchain?',locale:'en'}).insult).toBe(false);
    const meta=evaluateQl7SharedSemanticSafety('what does kill you mean',{locale:'en'});
    expect(meta.semanticClass).toBe('news_historical_educational_context');
    expect(evaluateQl7SupportSafety({text:'what does kill you mean',locale:'en'}).threat).toBe(false);
    const counter=evaluateQl7SharedSemanticSafety('do not call people idiot',{locale:'en'});
    expect(counter.safeContext).toBe(true);
    expect(evaluateQl7SupportSafety({text:'do not call people idiot',locale:'en'}).insult).toBe(false);
  });
  it('does not fabricate a Support identity badge for general-human/open-subject topics',()=>{
    const open=buildQl7SupportBadges({plan:{topic:'open_subject',resultKind:'none',semanticRole:'greeting'},locale:'en'});
    expect(open.some((row)=>/ql7 support/iu.test(String(row?.label||'')))).toBe(false);
    const physics=buildQl7SupportBadges({plan:{topic:'physics',resultKind:'none',semanticRole:'knowledge'},locale:'en'});
    expect(physics.some((row)=>/ql7 support/iu.test(String(row?.label||'')))).toBe(false);
    const qcoin=buildQl7SupportBadges({plan:{topic:'qcoin',resultKind:'none',semanticRole:'knowledge'},locale:'en'});
    expect(qcoin.some((row)=>String(row?.id||'')==='topic-qcoin')).toBe(true);
  });
  it('covers every required microtopic capability',()=>{
    const r=auditQl7SupportMicrotopicOntology();
    expect(r.ok).toBe(true);
    expect(r.microtopicCount).toBeGreaterThanOrEqual(1012);
    expect(r.requiredCapabilityUncovered).toBe(0);
  });
  it('never regresses terminal runtime state',()=>{expect(auditQl7RuntimeStateMonotonicity().ok).toBe(true)});
  it('keeps exactly-once greeting identity stable',()=>{expect(auditQl7EntrySession().ok).toBe(true)});
  it('sequences ordinary concurrent turns without user-visible conflict',async()=>{
    const r=await auditQl7TurnSequencer();
    expect(r.ok).toBe(true);
    expect(r.userVisibleConcurrentConflictCount??0).toBe(0);
  });
});
