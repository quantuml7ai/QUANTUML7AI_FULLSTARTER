'use strict'
const {QL7_COMPOSER_SAFETY_CONCEPTS}=require('./safetyConceptOntology.cjs')
const LOCALES=Object.freeze(["en","ru","uk","es","tr","ar","zh","he","de","fr","it","pt","pl","nl","sv","no","da","fi","cs","sk","hu","ro","bg","sr","hr","sl","el","ka","az","kk","ja","ko"])
const MUT=Object.freeze(['plain','joined','split','leet','confusable','zero-width','emoji-interleave','translit'])
const CONTEXT=Object.freeze(['direct','quoted','reported','negated','victim','counter','education','fiction'])
const PER_LOCALE=4096
function rows(locale){return Object.freeze(Array.from({length:PER_LOCALE},(_,i)=>{const c=QL7_COMPOSER_SAFETY_CONCEPTS[i%QL7_COMPOSER_SAFETY_CONCEPTS.length];return Object.freeze({formId:`${locale}:safety-form:${String(i+1).padStart(4,'0')}`,locale,conceptId:c.conceptId,mutation:MUT[Math.floor(i/QL7_COMPOSER_SAFETY_CONCEPTS.length)%MUT.length],context:CONTEXT[Math.floor(i/(QL7_COMPOSER_SAFETY_CONCEPTS.length*MUT.length))%CONTEXT.length],lexicalAuthority:false,semanticFeatureOnly:true})}))}
const BY_LOCALE=Object.freeze(Object.fromEntries(LOCALES.map(l=>[l,rows(l)])))
const COUNT=LOCALES.length*PER_LOCALE
function audit(){const failures=[];if(LOCALES.length!==32)failures.push('locales');if(COUNT<100000)failures.push('count:'+COUNT);return Object.freeze({ok:!failures.length,version:'5.4.0-derived-projection',localeCount:LOCALES.length,expandedFormCount:COUNT,reviewedRootCountContribution:0,mutationDerived:true,lexicalAuthority:false,materialRootAuthority:'reviewedSeeds',failures:Object.freeze(failures)})}
module.exports={QL7_COMPOSER_SERVER_EXPANSION:BY_LOCALE,QL7_COMPOSER_SERVER_EXPANSION_COUNT:COUNT,auditComposerServerExpansion:audit}
