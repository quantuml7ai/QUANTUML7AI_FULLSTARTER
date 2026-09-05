import {describe,it,expect} from 'vitest'
import gateMod from '../../../lib/composer-safety/serverGate.cjs'
import ledgerMod from '../../../lib/composer-safety/warningLedger.cjs'
import semanticAnalyzerMod from '../../../lib/composer-safety/semanticAnalyzer.cjs'
import semanticHintsMod from '../../../lib/composer-safety/localeSemanticHints.cjs'
import riskConceptsMod from '../../../lib/composer-safety/localeRiskConcepts.cjs'
import { classifyComposerPreview, composerPreviewBadgeFromClass, resolveComposerPreviewUpdate } from '../../../lib/composer-safety/clientPreview.js'
import { getComposerBadgePresentation, QL7_COMPOSER_BADGE_LOCALES } from '../../../lib/composer-safety/badgeLexicon.js'
import { QL7_SUPPORT_NATIVE_SAFETY_LEXICON } from '../../../lib/ql7-support/language/safetyLexicon.native.js'
import { QL7_SUPPORT_MULTILINGUAL_SAFETY_LEXICON } from '../../../lib/ql7-support/language/safetyLexicon.multilingual.js'
function memoryDb(){const cols=new Map;const collection=n=>{if(!cols.has(n))cols.set(n,new Map);const m=cols.get(n);return {find(q){let rows=[...m.values()].filter(r=>Object.entries(q||{}).filter(([,v])=>typeof v!=='object').every(([k,v])=>r[k]===v));return {sort(){return this},limit(){return this},async toArray(){return rows}}},async insertOne(r){if(m.has(r._id)){const e=new Error('dup');e.code=11000;throw e}m.set(r._id,{...r})},async findOne(q){return [...m.values()].find(r=>Object.entries(q||{}).every(([k,v])=>r[k]===v))||null},async updateOne(q,u){const r=[...m.values()].find(x=>Object.entries(q||{}).every(([k,v])=>x[k]===v));if(!r)return {matchedCount:0};Object.assign(r,u.$set||{});return {matchedCount:1}}}};return {collection}}
function setup(){const ledger=ledgerMod.createComposerWarningLedger({database:memoryDb()}),outbox={async listPending(){return []},createDeliveryBinding(){return {delivery:{},documentFields:{}}},async prepare(){return {ok:true}},async confirmDeliveryFromStorage(){return {delivered:true}},async markCompleted(){},async markFailed(){},async markCancelled(){}};return {ledger,gate:gateMod.createComposerServerGate({warningLedger:ledger,policyOutboxService:outbox,quarantineLookup:async()=>({state:'NONE'})})}}
describe('composer message policy v2',()=>{it('allows first four orange then drops fifth without restricting user',async()=>{const {gate,ledger}=setup(),now=Date.parse('2026-08-23T00:00:00Z');for(let i=0;i<4;i++){const g=await gate.evaluateComposerSubmit({actorAccountId:'u',surface:'forum',text:'ты идиот',targeted:true,clientMutationId:`x${i}`,locale:'ru',now:now+i});expect(g).toMatchObject({allowed:true,decision:'ALLOW_WITH_ORANGE_WARNING',userRestricted:false});await ledger.commitPublishedOrangeWarning({accountId:'u',classId:g.classId,surface:'forum',contentHash:g.receipt.contentHash,decisionId:g.receipt.decisionId,now:now+i})}const fifth=await gate.evaluateComposerSubmit({actorAccountId:'u',surface:'forum',text:'ты идиот',targeted:true,clientMutationId:'x5',locale:'ru',now:now+5});expect(fifth).toMatchObject({allowed:false,persist:false,decision:'DROP_ORANGE_THRESHOLD',clearSubmittedDraft:true,userRestricted:false})});it('drops red immediately and does not create a timed lock',async()=>{const {gate}=setup();const red=await gate.evaluateComposerSubmit({actorAccountId:'r',surface:'battle_chat',text:'я тебя убью',targeted:true,clientMutationId:'r1',locale:'ru'});expect(red).toMatchObject({allowed:false,persist:false,decision:'DROP_RED',userRestricted:false})});it('keeps deterministic account quarantine separate',async()=>{const {ledger}=setup(),outbox={async listPending(){return []},createDeliveryBinding(){return {}},async prepare(){},async confirmDeliveryFromStorage(){return {delivered:true}},async markCompleted(){},async markFailed(){},async markCancelled(){}};const gate=gateMod.createComposerServerGate({warningLedger:ledger,policyOutboxService:outbox,quarantineLookup:async()=>({state:'ACTIVE',quarantine:{active:true,expiresAt:'2026-08-24T00:00:00Z',reasonCode:'deterministic_compromise'}})});const r=await gate.evaluateComposerSubmit({actorAccountId:'q',surface:'forum',text:'hello'});expect(r).toMatchObject({allowed:false,error:'account_quarantined',status:423})})})

const SAFE_CLASSES = new Set(['clean_respectful', 'neutral', 'quoted_or_reported_harm', 'news_historical_educational_context', 'victim_report', 'counter_speech'])
const RED_CLASSES = new Set(['credible_personal_threat', 'violence_incitement', 'terrorism_praise_or_instruction', 'terrorism_operational_intent', 'murder_or_mass_harm_intent', 'war_or_riot_incitement', 'property_destruction_incitement', 'dangerous_operational_intent', 'sexual_violence_operational_intent'])
const SAFETY_LEXICONS = { ...QL7_SUPPORT_NATIVE_SAFETY_LEXICON, ...QL7_SUPPORT_MULTILINGUAL_SAFETY_LEXICON }

describe('composer semantic context calibration', () => {
  it('separates direct and obfuscated threats from quoted, reported and counter-speech context in all 32 locales', () => {
    const hints = semanticHintsMod.QL7_COMPOSER_LOCALE_SEMANTIC_HINTS
    const risks = riskConceptsMod.QL7_COMPOSER_LOCALE_RISK_CONCEPTS
    expect(Object.keys(hints)).toHaveLength(32)
    expect(Object.keys(risks)).toEqual(Object.keys(hints))
    expect(QL7_COMPOSER_BADGE_LOCALES).toEqual(Object.keys(hints))

    for (const locale of Object.keys(hints)) {
      for (const tone of ['green', 'orange', 'red']) {
        expect(getComposerBadgePresentation(tone, locale, 'credible_personal_threat').locale).toBe(locale)
      }
      const direct = `${hints[locale].first[0]} ${risks[locale].commitment[0]} ${risks[locale].kill[0]}`
      const obfuscated = `${hints[locale].first[0]} ${risks[locale].commitment[0]} ${Array.from(risks[locale].kill[0]).join('·')}`
      const contextual = [
        `${SAFETY_LEXICONS[locale].quotes[0]}: «${direct}»`,
        `${SAFETY_LEXICONS[locale].quotes[0]}: ${risks[locale].kill[0]}`,
        `${hints[locale].victim[0]}: «${direct}»`,
        `${hints[locale].counter[0]} ${risks[locale].kill[0]}`,
        `${hints[locale].education[0]}: «${risks[locale].kill[0]}»`,
      ]

      for (const text of [direct, obfuscated]) {
        expect(RED_CLASSES.has(semanticAnalyzerMod.analyzeComposerSemantics(text, { locale, targeted: true }).classId), `${locale}:server:${text}`).toBe(true)
        expect(RED_CLASSES.has(classifyComposerPreview(text, { locale, targeted: true }).classId), `${locale}:client:${text}`).toBe(true)
      }
      for (const text of contextual) {
        expect(SAFE_CLASSES.has(semanticAnalyzerMod.analyzeComposerSemantics(text, { locale, targeted: true }).classId), `${locale}:server:${text}`).toBe(true)
        expect(SAFE_CLASSES.has(classifyComposerPreview(text, { locale, targeted: true }).classId), `${locale}:client:${text}`).toBe(true)
      }
    }
  }, 120_000)

  it('keeps contextual camouflage blocked while removing live-conversation lexical collisions', () => {
    for (const text of ['This is not a threat, but I will kill you', 'Quote: I will kill you']) {
      expect(semanticAnalyzerMod.analyzeComposerSemantics(text, { locale: 'en', targeted: true }).classId).toBe('credible_personal_threat')
    }
    expect(semanticAnalyzerMod.analyzeComposerSemantics('Это не угроза, но я тебя убью', { locale: 'ru', targeted: true }).classId).toBe('credible_personal_threat')

    const liveSafeSamples = [
      'Just look at how cute he is.',
      'Looks like my grandmother when she found out how much BTC costs.',
      'Eddie Murphy. A legend of laughter and sweetness. Who do you think will succeed him?',
      'Quantum L7 AI We will teach you how to fly #QuantumFamily',
      'Welcome to the QCoin hub! Discuss global blockchain unification and how one currency can power the whole planet.',
      'Foreign post liked by deleted account',
      'NON STOP VIEWS',
      'Trinixie gains generous attention https://example.com/destroy-the-app',
      'Harmony and awareness matter.',
      'Whales dump, scams bite! Protect your seed phrase. Guard your paws!',
      'Damn this is cool.',
    ]
    for (const text of liveSafeSamples) {
      expect(SAFE_CLASSES.has(semanticAnalyzerMod.analyzeComposerSemantics(text, { locale: 'en', targeted: false }).classId), text).toBe(true)
      expect(SAFE_CLASSES.has(classifyComposerPreview(text, { locale: 'en', targeted: false }).classId), text).toBe(true)
    }
  })

  it('keeps badge updates monotonic until the authoritative result settles', () => {
    const green = { classId: 'counter_speech', tone: 'green', key: 'composer_tone_respectful' }
    const orange = { classId: 'direct_insult', tone: 'orange', key: 'composer_tone_warning' }
    const red = { classId: 'credible_personal_threat', tone: 'red', key: 'composer_tone_blocked' }
    expect(resolveComposerPreviewUpdate(red, green)).toBe(red)
    expect(resolveComposerPreviewUpdate(orange, red)).toBe(red)
    expect(resolveComposerPreviewUpdate(red, green, { authoritative: true })).toBe(green)
    expect(resolveComposerPreviewUpdate(green, { ...green })).toBe(green)
    expect(composerPreviewBadgeFromClass('dangerous_operational_intent')?.tone).toBe('red')
    expect(composerPreviewBadgeFromClass('risk_ambiguous')?.tone).toBe('orange')
  })
})
