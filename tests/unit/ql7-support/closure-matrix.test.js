import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_ALL_LOCALES } from '../../../lib/ql7-support/config/behaviorManifest.js'
import { QL7_SUPPORT_DOMAIN_TOPICS, getQl7SupportCanonicalDomain } from '../../../lib/ql7-support/knowledge/domainRegistry.js'
import { getQl7SupportSourceContract } from '../../../lib/ql7-support/sourceRegistry.js'
import { analyzeQl7SupportTurn } from '../../../lib/ql7-support/semantics/analyzeTurn.js'
import { auditQl7SupportCapabilityRegistry } from '../../../lib/ql7-support/simulation/capabilityRegistry.js'
import { auditQl7SupportLabPlans } from '../../../lib/ql7-support/simulation/labPlanRegistry.js'
import { auditQl7SupportScientificLabContract } from '../../../lib/ql7-support/simulation/lab/scientificLabContract.js'
import { auditQl7SupportCompositionalGrammar } from '../../../lib/ql7-support/language/compositionalGrammar.js'
import { auditQl7SupportHumanTopicOntology, classifyQl7SupportHumanTopic } from '../../../lib/ql7-support/knowledge/humanTopicOntology.js'
import { getQl7SupportActionDescriptor } from '../../../lib/ql7-support/topicActionRegistry.js'
import { getQl7SupportEntryGreetingStrategyCoverage } from '../../../lib/ql7-support/entryGreetingLexicon.js'
import { runQl7SupportCapabilityProductionProbe } from '../../../lib/ql7-support/simulation/capabilityProductionProbe.js'
import { resolveQl7SupportDeliverySigningMaterial, resolveQl7SupportDeliverySigningMaterialForServer, resolveQl7SupportProjectionSigningMaterial } from '../../../lib/ql7-support/runtime/productionTurn.js'

describe('QL7 Support REV.5.1 closure matrix', () => {
  it('resolves all 48 canonical domain labels in all 32 locales without normalization damage', () => {
    expect(QL7_SUPPORT_DOMAIN_TOPICS).toHaveLength(48)
    expect(QL7_SUPPORT_ALL_LOCALES).toHaveLength(32)
    const failures=[]
    for(const domainId of QL7_SUPPORT_DOMAIN_TOPICS){
      expect(getQl7SupportSourceContract(domainId).domainId).toBe(domainId)
      for(const locale of QL7_SUPPORT_ALL_LOCALES){
        const label=getQl7SupportCanonicalDomain(domainId,locale).label
        const turn=analyzeQl7SupportTurn({text:label,locale,conversationId:'canonical-domain-matrix',turnId:`${domainId}:${locale}`,now:Date.parse('2026-08-15T00:00:00.000Z')})
        if(turn.analysis.topic!==domainId)failures.push({domainId,locale,label,got:turn.analysis.topic})
      }
    }
    expect(failures).toEqual([])
  }, 120_000)

  it('keeps the real MetaStudio interest-registration opening while retaining planned knowledge semantics', () => {
    expect(getQl7SupportActionDescriptor('metastudio')).toMatchObject({
      actionType:'route',href:'/game?ql7Action=metastudio#metastudio',availability:'planned',purpose:'open_interest_registration',
    })
  })

  it('has a lab proof route for every registered production capability', () => {
    expect(auditQl7SupportCapabilityRegistry()).toMatchObject({ok:true,failures:[]})
    expect(auditQl7SupportLabPlans()).toMatchObject({ok:true,planCount:9,failures:[]})
    const scientific = auditQl7SupportScientificLabContract()
    expect(scientific).toMatchObject({ok:true,failures:[]})
    expect(scientific.ownerCount).toBeGreaterThanOrEqual(44)
    expect(scientific.requiredGates).toEqual(['A','B','C','D','E','F','G','H','I','J','K'])
  })

  it('uses semantic clause primitives rather than ready-made terminal responses', () => {
    const audit=auditQl7SupportCompositionalGrammar()
    expect(audit.ok).toBe(true)
    expect(audit.nativeLocaleCount).toBe(32)
    expect(audit.finalSentenceRows).toBe(0)
  })

  it('supports open human subjects rather than a closed example-only topic list', () => {
    expect(auditQl7SupportHumanTopicOntology()).toMatchObject({ok:true,openSubjectSupported:true})
    expect(classifyQl7SupportHumanTopic('What do you think about zorbles people collect?')).toMatchObject({topicId:'open_subject'})
  })

  it('has no ready-made entry greeting final sentences', () => {
    expect(getQl7SupportEntryGreetingStrategyCoverage()).toMatchObject({finalSentenceRows:0,readyToSendRows:0})
  })


  it('resolves final-delivery signing from existing server secret infrastructure without requiring a new env file', async () => {
    const keys=['QL7_SUPPORT_DELIVERY_SIGNING_KEY','SESSION_SECRET','QL7_SUPPORT_CHOICE_SECRET','QL7_FORUM_CURSOR_SECRET','FORUM_CURSOR_HMAC_SECRET','QL7_SUPPORT_DELIVERY_SIGNING_KEY_ID']
    const before=Object.fromEntries(keys.map((key)=>[key,process.env[key]]))
    try {
      for(const key of keys)delete process.env[key]
      process.env.FORUM_CURSOR_HMAC_SECRET='forum-runtime-secret-for-ql7-support-regression-00000001'
      const resolved=await resolveQl7SupportDeliverySigningMaterialForServer({mode:'production'},{mode:'production'})
      expect(resolved.signingKey).toBeTruthy()
      expect(resolved.keyId).toContain('forum-runtime-env')
    } finally {
      for(const key of keys){
        if(before[key]===undefined)delete process.env[key]
        else process.env[key]=before[key]
      }
    }
  })

  it('does not re-enter the env-only signing resolver after server material has already been resolved', () => {
    const keys=['QL7_SUPPORT_DELIVERY_SIGNING_KEY','SESSION_SECRET','QL7_SUPPORT_CHOICE_SECRET','QL7_FORUM_CURSOR_SECRET','FORUM_CURSOR_HMAC_SECRET','QL7_SUPPORT_DELIVERY_SIGNING_KEY_ID']
    const before=Object.fromEntries(keys.map((key)=>[key,process.env[key]]))
    try {
      for(const key of keys)delete process.env[key]
      const resolved=resolveQl7SupportProjectionSigningMaterial({mode:'production'},{
        input:{mode:'production'},
        signingKey:'server-derived-signing-material-regression-0000000001',
        keyId:'delivery-key:server-runtime:v1:regression',
      })
      expect(resolved).toMatchObject({
        signingKey:'server-derived-signing-material-regression-0000000001',
        keyId:'delivery-key:server-runtime:v1:regression',
        source:'provided_server_material',
      })
    } finally {
      for(const key of keys){
        if(before[key]===undefined)delete process.env[key]
        else process.env[key]=before[key]
      }
    }
  })

  it('keeps delivery signing fail-closed when no synchronous approved signing source exists', () => {
    const keys=['QL7_SUPPORT_DELIVERY_SIGNING_KEY','SESSION_SECRET','QL7_SUPPORT_CHOICE_SECRET','QL7_FORUM_CURSOR_SECRET','FORUM_CURSOR_HMAC_SECRET','QL7_SUPPORT_DELIVERY_SIGNING_KEY_ID']
    const before=Object.fromEntries(keys.map((key)=>[key,process.env[key]]))
    try {
      for(const key of keys)delete process.env[key]
      expect(()=>resolveQl7SupportDeliverySigningMaterial({mode:'production'},{mode:'production'})).toThrow('ql7_support_delivery_signing_key_unavailable')
    } finally {
      for(const key of keys){
        if(before[key]===undefined)delete process.env[key]
        else process.env[key]=before[key]
      }
    }
  })

  it('proves deterministic containment and confirmed three-strike restriction through production authorities', async () => {
    await expect(runQl7SupportCapabilityProductionProbe({capabilityId:'economic.deterministic-compromise-containment',index:7})).resolves.toMatchObject({ok:true,decision:'QUARANTINE_ACCOUNT_3D',quarantineActive:true})
    await expect(runQl7SupportCapabilityProductionProbe({capabilityId:'composer.orange-fifth-drop',index:7})).resolves.toMatchObject({ok:true,warningCount:4,blockedError:'composer_message_dropped'})
  })

  it('keeps all 36 Swedish denial/quotation collision controls non-punitive at semantic authority', () => {
    const stems=['idiot','dum','korkad','värdelös bot','hot','attack']
    const contexts=['inte till dig','jag menade inte dig','det är ett citat','någon sade till mig','för utbildning','i nyheterna']
    const failures=[]
    let index=0
    for(const stem of stems)for(const context of contexts){
      const text=`${context}: ${stem}`
      const turn=analyzeQl7SupportTurn({text,locale:'sv',conversationId:'canonical-sv-collision',turnId:`sv:${index++}`,now:Date.parse('2026-08-15T00:00:00.000Z')})
      if(turn.safety?.operatorRequired===true||Number(turn.safety?.severity||0)>=3)failures.push({text,category:turn.safety?.category,severity:turn.safety?.severity})
    }
    expect(index).toBe(36)
    expect(failures).toEqual([])
    const direct = analyzeQl7SupportTurn({ text: 'jag ska attackera systemet', locale: 'sv', conversationId: 'canonical-sv-positive', turnId: 'sv:positive', now: Date.parse('2026-08-15T00:00:00.000Z') })
    expect(direct.safety).toMatchObject({ category: 'credible_threat', operatorRequired: true })
   }, 30_000)

})
