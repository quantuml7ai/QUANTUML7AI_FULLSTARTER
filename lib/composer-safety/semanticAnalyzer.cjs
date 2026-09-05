const crypto=require('node:crypto')
const { matchQl7SupportObfuscatedSafety }=require('../ql7-support/safety/obfuscationMatcher.js')
const { matchComposerLocaleSemanticHints }=require('./localeSemanticHints.cjs')
const { matchComposerLocaleRiskConcepts }=require('./localeRiskConcepts.cjs')
const { matchComposerServerModerationBank }=require('./serverModerationBank.cjs')
const { evaluateQl7SharedSemanticSafety }=require('../ql7-support/safety/sharedSemanticEvidence.cjs')
const { buildComposerSemanticTargetFrame }=require('./semanticTargetFrame.cjs')
const VERSION='ql7.composer.semantic-analyzer'
const CLASS_IDS=Object.freeze(['clean_respectful','neutral','profanity_non_targeted','product_frustration','uncertain_hostility','direct_insult','repeated_direct_insult','harassment','bullying','degrading_hate_like_language','credible_personal_threat','violence_incitement','terrorism_praise_or_instruction','terrorism_operational_intent','murder_or_mass_harm_intent','war_or_riot_incitement','property_destruction_incitement','quoted_or_reported_harm','news_historical_educational_context','victim_report','counter_speech','dangerous_operational_intent','risk_ambiguous','sexual_violence_context','sexual_violence_operational_intent','unknown_or_uncovered'])
const SEVERE=new Set(['credible_personal_threat','violence_incitement','terrorism_praise_or_instruction','terrorism_operational_intent','murder_or_mass_harm_intent','war_or_riot_incitement','property_destruction_incitement','dangerous_operational_intent','sexual_violence_operational_intent'])
const ORANGE=new Set(['profanity_non_targeted','product_frustration','uncertain_hostility','direct_insult','repeated_direct_insult','harassment','bullying','degrading_hate_like_language','risk_ambiguous','sexual_violence_context','unknown_or_uncovered'])
const SAFE_CONTEXT=new Set(['quoted_or_reported_harm','news_historical_educational_context','victim_report','counter_speech'])
function normalize(text=''){return String(text||'').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/gu,'').replace(/\s+/gu,' ').trim()}
function hash(v=''){return crypto.createHash('sha256').update(String(v)).digest('hex')}
function tokens(s){return normalize(s).toLocaleLowerCase().match(/[\p{L}\p{N}_'-]+/gu)||[]}
function spans(re,s){const out=[];for(const m of s.matchAll(re)){out.push({start:m.index||0,end:(m.index||0)+String(m[0]||'').length,text:String(m[0]||'').slice(0,120)})}return out}
function hit(re,s,id,weight,polarity='support'){const m=spans(re,s);return m.length?{id,weight,polarity,spans:m}:null}
function bool(re,s){return re.test(s)}
function extractFeatures(text,{locale='und',targeted=false,quotedRanges=[],conversationReferences=[],context={}}={}){
 const rawSource=normalize(text),source=normalize(rawSource.replace(/(?:https?:\/\/|www\.)\S+/giu,' ')),lower=source.toLocaleLowerCase(),ts=tokens(lower),f=[];const add=(x)=>{if(x)f.push(x)}
 const canonicalSafety=matchQl7SupportObfuscatedSafety({text:source,locale})
 const localeHints=matchComposerLocaleSemanticHints(source,locale),riskHints=matchComposerLocaleRiskConcepts(source,locale),moderationHints=matchComposerServerModerationBank(source,locale)
 const quoteSpans=[...spans(/["“”«»][^"“”«»]{1,320}["“”«»]/gu,source),...(Array.isArray(quotedRanges)?quotedRanges:[]).map(r=>({start:Number(r?.start||0),end:Number(r?.end||0),text:''}))]
 const unquotedSource=source.replace(/["“”«»][^"“”«»]{1,320}["“”«»]/gu,' '),unquotedLower=unquotedSource.toLocaleLowerCase(),unquotedHints=matchComposerLocaleSemanticHints(unquotedSource,locale),unquotedRiskHints=matchComposerLocaleRiskConcepts(unquotedSource,locale)
 const reported=bool(/(?:\b(?:он|она|они|they|he|she)\b.{0,30}\b(?:сказал|сказала|сказали|said|wrote|написал|написала)\b)/iu,lower)
 const canonicalInsult=canonicalSafety.insults.length>0,canonicalThreat=canonicalSafety.threats.length>0,canonicalTarget=canonicalSafety.targets.length>0,canonicalDenial=canonicalSafety.denials.length>0,canonicalProduct=canonicalSafety.product.length>0,canonicalQuote=canonicalSafety.quotes.length>0
 const explicitKnowledgeContext=bool(/(?:\b(?:news|article|report|history|historical|education|educational|research|study)\b|новост|стать[яи]|истори|учеб|образоват|исслед|что\s+(?:значит|означает)|what\s+(?:does|do|is|are).{0,80}(?:mean|meaning))/iu,lower)
 const news=Boolean(context?.educational||context?.historical||context?.news)||explicitKnowledgeContext||(localeHints.education&&!(quoteSpans.length>0||canonicalQuote))
 const victim=Boolean(context?.victimReport)||localeHints.victim||bool(/(?:мне\s+(?:угрож|пишут|написал|сказал)|меня\s+(?:оскорб|преслед|атак)|threatened\s+me|wrote\s+to\s+me|said\s+to\s+me|harass(?:ed|ing)\s+me|attacked\s+me|someone\s+threatened)/iu,lower)
 const counter=Boolean(context?.counterSpeech)||localeHints.counter||bool(/(?:не\s+(?:надо|делай|убивай|нападай)|нельзя\s+(?:убивать|нападать)|осуждаю|против\s+(?:насилия|терро|войн)|\bdo\s+not\b|\bdon't\b|\bcondemn\b|\bagainst\b).{0,90}(?:уб|kill|террор|terror|насил|violence|attack|войн|war)/iu,lower)
 const selfDefense=bool(/(?:самооборон|self[- ]defen[sc]e)/iu,lower),fiction=bool(/(?:фильм|роман|книг|игр[аеы]|сценар|fiction|movie|novel|game|song|lyrics)/iu,lower)
 const explicitNegation=bool(/(?:^|[\s,.;:!?])(?:не|нет)(?=$|[\s,.;:!?])|\b(?:never|not|don't|do not)\b/iu,lower)
 const negation=localeHints.counter||explicitNegation||canonicalDenial
 /* canonical denial is retained as provenance but does not by itself suppress severe policy; locale matcher is intentionally fuzzy. */
 const decisionDenial=localeHints.counter||explicitNegation
 const second=canonicalTarget||ts.some(x=>['ты','тебя','тебе','твой','вы','вас','вам','ваш','you','your'].includes(x))
 const third=ts.some(x=>['его','её','ее','их','him','her','them'].includes(x))
 const targetFrame=buildComposerSemanticTargetFrame(unquotedSource,{conversationTargeted:targeted})
 const first=unquotedHints.firstPerson||ts.some(x=>['я','мы','i','we'].includes(x))
 const implicitFirstHarm=bool(/(?:уб(?:ью|ьём|ьем|иваем)|зареж(?:у|ем)|застрел(?:ю|им)|ликвидиру(?:ю|ем)|we(?:'ll|\s+will)\s+(?:kill|shoot|stab))/iu,unquotedLower)
 const directKill=unquotedRiskHints.kill||bool(/(?:уб(?:ью|ьём|ьем|ить|иваем)|зареж|застрел|ликвидир|\bkill(?:ing)?\b|\bmurder(?:ing)?\b|\bshoot\b|\bstab\b|\bsana\s+zarar\s+vereceğim\b)/iu,unquotedLower)||context?.credibleThreat===true
 const operational=unquotedHints.operational||bool(/(?:как\s+(?:сделать|собрать|устроить)|инструкц|пошаг|\bhow\s+to\b|\bstep[- ]by[- ]step\b|\b(?:build|make)\b)/iu,unquotedLower)||context?.operationalIntent===true
 const commitment=unquotedRiskHints.commitment||bool(/(?:делаем|сделаем|устроим|заложим|взорв(?:ём|ем)|начн(?:ём|ем)|развяжем|провед(?:ём|ем)|let'?s\s+(?:make|plant|start|launch|attack)|we(?:'ll|\s+will)\s+(?:make|plant|start|launch|attack)|\bzarar\s+vereceğim\b)/iu,unquotedLower)
 const explosive=localeHints.explosive||bool(/(?:бомб|взрыв|explosive|bomb|детонат|detonat)/iu,lower),terror=localeHints.terror||bool(/(?:террор|теракт|terror|isis|isil|игил)/iu,lower)
 const mass=bool(/(?:всех|толп|массов|everyone|crowd|mass\s+(?:harm|murder|kill))/iu,lower)
 const attack=unquotedRiskHints.attack||bool(/(?:атак(?:а|у|уем|овать)|напад(?:ение|ём|ем|ать)|\battack(?:ed|ing|s)?\b)/iu,unquotedLower)
 const incite=unquotedRiskHints.incite||bool(/(?:давайте|давай|призываю|идите|бейте|нападайте|начн(?:ём|ем)|go\s+attack|incite|let'?s\s+(?:attack|start|launch))/iu,unquotedLower)
 const war=unquotedRiskHints.war||unquotedRiskHints.riot||bool(/(?:войн(?:а|у|ой|ы|е)?|мятеж|бунт|\b(?:war|riot)\b)/iu,unquotedLower)
 const warIncitement=war&&(incite||commitment||bool(/(?:развязать|объявить|начать\s+войн|start\s+(?:a\s+)?war|declare\s+war)/iu,unquotedLower))
 const cyberAttack=unquotedRiskHints.cyber||bool(/(?:хакерск(?:ая|ую|ой)?\s+атак|кибератак|взлом(?:аем|ать)?|ddos|cyber[- ]?attack|hacker\s+attack|hack\s+(?:the\s+)?(?:site|server|system))/iu,unquotedLower)
 const property=unquotedRiskHints.destroy||bool(/(?:поджечь|сжечь|разнести|взорвать|burn\s+down|destroy\s+(?:the\s+)?(?:house|car|store|property))/iu,lower)||cyberAttack
 const praise=bool(/(?:герои|молодцы|правы|слава|praise|heroes?|glory)/iu,lower)&&terror
 const profanity=moderationHints.profanity||moderationHints.euphemisms||bool(/(?:бляд|сука|нахуй|хуйло|пидор(?:ас)?|ебан|ебуч|мудак|fuck|shit)/iu,lower),insult=moderationHints.directInsults||bool(/(?:идиот|дебил|тупиц|хуйло|пидор(?:ас)?|ебуч|moron|idiot|stupid|retard)/iu,lower)
 const product=canonicalProduct||bool(/(?:сервис|продукт|приложен|сайт|\b(?:service|product|app|site)\b)/iu,lower),frustration=bool(/(?:достал|ненавижу|говно|ужасн|отстой|\b(?:sucks|hate|broken|trash)\b)/iu,lower)
 const idiom=bool(/(?:убивает\s+(?:батаре|производительност)|взорвать\s+рынок|kills?\s+(?:the\s+)?battery|blow\s+up\s+the\s+market)/iu,lower)
 const protectiveAdvice=bool(/(?:\b(?:protect|guard|secure)\b.{0,80}\b(?:seed\s+phrase|wallet|account|password|funds?|assets?|data)\b|\b(?:seed\s+phrase|wallet|account|password|funds?|assets?|data)\b.{0,80}\b(?:protect|guard|secure)\b)/iu,lower)
 const positiveExclamation=bool(/\bdamn\s+(?:this|that|it)\s+is\s+(?:cool|awesome|amazing|great|beautiful)\b/iu,lower)
 if(canonicalInsult)add({id:'canonical_locale_insult',weight:1.4,polarity:'support',spans:canonicalSafety.insults.map(x=>({start:-1,end:-1,text:x.termHash}))});if(canonicalThreat)add({id:'canonical_locale_threat',weight:1.8,polarity:'support',spans:canonicalSafety.threats.map(x=>({start:-1,end:-1,text:x.termHash}))});if(canonicalTarget)add({id:'canonical_locale_target',weight:1.2,polarity:'support',spans:canonicalSafety.targets.map(x=>({start:-1,end:-1,text:x.termHash}))});if(canonicalDenial)add({id:'canonical_locale_denial',weight:1.7,polarity:'counter',spans:canonicalSafety.denials.map(x=>({start:-1,end:-1,text:x.termHash}))});if(canonicalQuote)add({id:'canonical_locale_quote',weight:1.4,polarity:'counter',spans:canonicalSafety.quotes.map(x=>({start:-1,end:-1,text:x.termHash}))});
 add(hit(/(?:уб(?:ью|ьём|ьем|ить|иваем)|зареж|застрел|\bkill\b|\bmurder\b)/giu,lower,'harm_verb',2));add(hit(/(?:бомб|explosive|bomb)/giu,lower,'explosive_entity',2));add(hit(/(?:террор|terror)/giu,lower,'terror_entity',2));add(hit(/(?:идиот|дебил|хуйло|пидор(?:ас)?|ебуч|moron|idiot|stupid)/giu,lower,'insult_lexeme',1));add(hit(/(?:бляд|сука|хуйло|пидор(?:ас)?|ебан|ебуч|fuck|shit)/giu,lower,'profanity_lexeme',1))
 const temporalIntent=unquotedHints.temporal||bool(/(?:сейчас|сегодня|завтра|скоро|now|today|tomorrow|soon)/iu,unquotedLower)
 return Object.freeze({version:VERSION,source:rawSource,normalizedHash:hash(rawSource),locale:String(locale||'und'),tokenCount:ts.length,contextKind:String(context?.conversationKind||context?.operationType||''),localeHints,riskHints,moderationHints:{version:moderationHints.version,bankTermCount:moderationHints.bankTermCount,scannedLocaleCount:moderationHints.scannedLocaleCount,profanity:moderationHints.profanity,euphemisms:moderationHints.euphemisms,directInsults:moderationHints.directInsults,threats:moderationHints.threats},canonicalSafety:{version:canonicalSafety.version,locale:canonicalSafety.locale,fingerprint:canonicalSafety.fingerprint,insultHits:canonicalSafety.insults.length,threatHits:canonicalSafety.threats.length,targetHits:canonicalSafety.targets.length,denialHits:canonicalSafety.denials.length,productHits:canonicalSafety.product.length,quoteHits:canonicalSafety.quotes.length},quoteScope:{hasQuote:quoteSpans.length>0||canonicalQuote,reportedSpeech:reported,ranges:quoteSpans},targetScope:{targeted:Boolean(targeted||second||third),harmTargeted:targetFrame.personalThreatTarget===true,targetKind:targetFrame.targetKind,firstPerson:Boolean(first||implicitFirstHarm),secondPerson:second,thirdPerson:third,semanticFrame:targetFrame},context:{newsHistoricalEducational:news,victimReport:victim,counterSpeech:counter,selfDefense,fiction,negation,denial:decisionDenial,canonicalDenialObserved:canonicalDenial,idiom,protectiveAdvice,positiveExclamation,conversationReferenceCount:Array.isArray(conversationReferences)?conversationReferences.length:0},signals:{directKill,operational,commitment,explosive,terror,mass,attack,incite,war,warIncitement,cyberAttack,property,praise,profanity,insult,product,frustration},actionability:{operationalInstruction:Boolean(operational||commitment),hasTarget:Boolean(targeted||second||third),hasHarmTarget:targetFrame.personalThreatTarget===true,specificity:(explosive||terror||property||mass||warIncitement||cyberAttack)?'high':directKill?'medium':'low',capabilityClaim:Boolean((first||implicitFirstHarm||commitment)&&(operational||(directKill&&targetFrame.personalThreatTarget===true)||property||attack||warIncitement)),temporalIntent},features:Object.freeze(f)})
}
function scoreCandidates(features,{priorConfirmedWarnings=0}={}){const s=features.signals,c=features.context,t=features.targetScope,a=features.actionability,rows=[];const add=(id,score,evidence=[],counterEvidence=[])=>rows.push({id,score,evidence,counterEvidence});
 if(!features.source)add('neutral',1,['empty'],[])
 if(c.victimReport)add('victim_report',.995,['victim_report_context'],[])
 if(c.counterSpeech)add('counter_speech',.995,['counter_speech_context'],[])
 if(c.newsHistoricalEducational)add('news_historical_educational_context',.985,['news_or_education_context'],[])
 if((features.quoteScope.hasQuote||features.quoteScope.reportedSpeech)&&!a.operationalInstruction)add('quoted_or_reported_harm',.97,['quote_or_reported_scope'],[])
 const safeCounter=[c.victimReport&&'victim_report',c.counterSpeech&&'counter_speech',c.newsHistoricalEducational&&'news_education',c.selfDefense&&'self_defense',c.fiction&&'fiction',c.idiom&&'safe_idiom',c.denial&&'local_denial',(features.quoteScope.hasQuote||features.quoteScope.reportedSpeech)&&'quoted_scope'].filter(Boolean)
 const suppressSevere=Boolean(safeCounter.length&&!a.operationalInstruction)
 if(c.denial&&(s.directKill||s.attack||s.terror||s.incite||s.property))add('clean_respectful',.992,['local_denial_context'],[])
 if((c.fiction||c.selfDefense||c.idiom)&&!a.operationalInstruction)add('clean_respectful',.99,[c.fiction?'fiction_context':c.selfDefense?'self_defense_context':'safe_idiom'],[])
 if((c.protectiveAdvice||c.positiveExclamation)&&!a.operationalInstruction&&!s.directKill&&!s.terror&&!s.attack&&!s.property)add('clean_respectful',.99,[c.protectiveAdvice?'protective_advice_context':'positive_exclamation_context'],[])
 if(s.terror&&s.explosive&&(s.operational||s.commitment))add('terrorism_operational_intent',suppressSevere?.42:.995,['terror_entity','explosive_entity',s.operational?'operational_instruction':'operational_commitment'],safeCounter)
 if(s.directKill&&a.hasHarmTarget&&(t.firstPerson||s.commitment))add('credible_personal_threat',suppressSevere?.35:.99,['harm_verb',t.firstPerson?'first_person':'operational_commitment',t.targetKind||'specific_target'],safeCounter)
 if(s.directKill&&s.mass)add('murder_or_mass_harm_intent',suppressSevere?.35:.99,['harm_verb','mass_target'],safeCounter)
 if(s.warIncitement)add('war_or_riot_incitement',suppressSevere?.35:.985,['war_or_riot','incitement_or_commitment'],safeCounter)
 if(s.property&&(t.firstPerson||s.commitment||s.cyberAttack))add('property_destruction_incitement',suppressSevere?.35:.97,[s.cyberAttack?'cyber_attack_intent':'property_harm',t.firstPerson?'first_person':'operational_commitment'],safeCounter)
 if(s.incite&&(s.directKill||s.attack))add('violence_incitement',suppressSevere?.35:.97,['incitement',s.directKill?'harm_verb':'attack_verb'],safeCounter)
 if(s.praise)add('terrorism_praise_or_instruction',suppressSevere?.35:.96,['terror_entity','praise'],safeCounter)
 if(s.terror&&!s.explosive&&!c.newsHistoricalEducational&&!c.victimReport&&!c.counterSpeech)add('uncertain_hostility',.84,['terror_topic_without_safe_context'],[])
 if(s.war&&!s.warIncitement&&!c.newsHistoricalEducational&&!c.victimReport&&!c.counterSpeech)add('uncertain_hostility',.8,['war_topic_without_safe_context'],[])
 if((s.insult||features.canonicalSafety.insultHits>0)&&a.hasTarget&&!c.denial)add(priorConfirmedWarnings>0?'repeated_direct_insult':'direct_insult',.91,['insult_lexeme','target_scope'],[])
 if(s.frustration&&s.product)add('product_frustration',.94,['product_entity','frustration'],[])
 if(s.profanity)add(a.hasTarget?'uncertain_hostility':'profanity_non_targeted',a.hasTarget?.82:.9,['profanity_lexeme',...(a.hasTarget?['target_scope']:[])],[])
 if(!rows.length)add('neutral',features.source.length>=3?.64:.55,['no_material_risk_signal','coverage_not_assumed_safe'],[])
 return rows.sort((x,y)=>y.score-x.score)
}
function analyzeComposerSemantics(text,options={}){
 const features=extractFeatures(text,options)
 const semanticSource=features.source.replace(/(?:https?:\/\/|www\.)\S+/giu,' ')
 const shared=evaluateQl7SharedSemanticSafety(semanticSource,{locale:options.locale||'und'})
 const sharedClass=shared.semanticClass==='credible_threat'?'credible_personal_threat':shared.semanticClass
 const candidates=scoreCandidates(features,options)
 if(sharedClass==='unknown_or_uncovered'){
  for(let i=candidates.length-1;i>=0;i-=1)if(candidates[i].id==='neutral')candidates.splice(i,1)
  candidates.push({id:'unknown_or_uncovered',score:Math.max(.66,1-Number(shared.coverageConfidence||0)),evidence:['semantic_coverage_unproven'],counterEvidence:[]})
 }
 if(sharedClass&&!['neutral','clean_respectful','unknown_or_uncovered'].includes(sharedClass)){
  const existing=candidates.find(x=>x.id===sharedClass)
  const materialSharedEvidence=(shared.conceptCandidates||[]).some(row=>{
   const source=String(row?.source||'')
   return !source.startsWith('reviewed-material-root')||(
    sharedClass==='credible_personal_threat'&&features.targetScope.harmTargeted&&
    source==='reviewed-material-root-corroborated'&&row?.rootMatchExact===true&&
    Number(row?.corroboratingInputTokenCount||0)>=2
   )
  })
  const sharedPromotable=Boolean(existing||SAFE_CONTEXT.has(sharedClass)||materialSharedEvidence)
  if(existing){existing.score=Math.max(existing.score,shared.semanticConfidence);existing.evidence=[...(existing.evidence||[]),'shared_semantic_evidence']}
  else if(sharedPromotable)candidates.push({id:sharedClass,score:shared.semanticConfidence,evidence:['shared_semantic_evidence',...shared.conceptCandidates.map(x=>x.conceptId)],counterEvidence:shared.safeContext?['safe_context']:[]})
 }
 if(sharedClass==='clean_respectful'&&shared.coverageConfidence>=.65&&!candidates.some(x=>SEVERE.has(x.id)||ORANGE.has(x.id)))candidates.push({id:'clean_respectful',score:Math.min(.92,shared.semanticConfidence),evidence:['shared_safe_coverage'],counterEvidence:[]})
 candidates.sort((a,b)=>b.score-a.score)
 const top=candidates[0]||{id:'neutral',score:.55,evidence:[],counterEvidence:[]},second=candidates[1]||{score:0};let selected=top
 const severeTop=candidates.find(r=>SEVERE.has(r.id)&&r.score>=.85)
 const sharedSevere=shared.risk==='severe'
  ? candidates.filter(r=>SEVERE.has(r.id)).sort((a,b)=>b.score-a.score)[0]||null
  : null
 const safe=candidates.find(r=>SAFE_CONTEXT.has(r.id)&&r.score>=.95&&((r.id!=='news_historical_educational_context'||!features.actionability.operationalInstruction)||features.quoteScope.hasQuote||features.quoteScope.reportedSpeech||features.context.victimReport||features.context.counterSpeech))
 // Canonical shared-safety evidence is authoritative for severe risk. A broad
 // quote/news heuristic in the preview layer may never downgrade a severe
 // unquoted remainder or otherwise override the shared semantic receipt.
 const scopedSafe=Boolean(safe&&!features.actionability.operationalInstruction&&!features.actionability.capabilityClaim&&(features.quoteScope.hasQuote||features.quoteScope.reportedSpeech||features.context.victimReport||features.context.counterSpeech))
 if(sharedSevere&&!scopedSafe)selected=sharedSevere
 else if(safe&&(!severeTop||['quoted_or_reported_harm','victim_report','counter_speech'].includes(safe.id)||features.context.idiom||features.context.fiction))selected=safe
 const alternatives=candidates.filter(r=>r.id!==selected.id).slice(0,4)
 const margin=Math.max(0,selected.score-(alternatives[0]?.score||0));const abstain=SEVERE.has(selected.id)&&selected.score<.85
 if(abstain)selected={id:'uncertain_hostility',score:selected.score,evidence:selected.evidence,counterEvidence:[...(selected.counterEvidence||[]),'severe_below_authority_threshold']}
 const semanticFeatureHash=hash(JSON.stringify({locale:features.locale,normalizedHash:features.normalizedHash,contextKind:features.contextKind,riskHints:features.riskHints,canonicalSafety:features.canonicalSafety,quoteScope:features.quoteScope,targetScope:features.targetScope,context:features.context,signals:features.signals,actionability:features.actionability,features:features.features.map(({id,weight,polarity})=>({id,weight,polarity}))}))
 return Object.freeze({version:VERSION,classId:selected.id,selectedClass:selected.id,confidence:Number(selected.score.toFixed(4)),semanticConfidence:Number(shared.semanticConfidence||selected.score),coverageConfidence:Number(shared.coverageConfidence||0),sourceConfidence:Number(shared.sourceConfidence||0),policyConfidence:Number(shared.policyConfidence||0),calibrationStatus:'live-context-regression-calibrated-32-locales',abstentionReason:shared.abstentionReason||'',margin:Number(margin.toFixed(4)),material:features.source.length>=3,evidence:Object.freeze([...(selected.evidence||[])]),counterEvidence:Object.freeze([...(selected.counterEvidence||[])]),alternativeClasses:Object.freeze(alternatives.map(r=>({classId:r.id,confidence:Number(r.score.toFixed(4)),evidence:r.evidence,counterEvidence:r.counterEvidence}))),quoteScope:features.quoteScope,targetScope:features.targetScope,actionability:features.actionability,semanticFeatureHash,sharedSemanticEvidence:shared,featureReceipt:features})}
function policyForClass(classId,options={}){return require('./messagePolicy.cjs').decideComposerMessagePolicy(classId,{priorConfirmedPublishedOrange:Number(options.priorConfirmedWarnings||0)})}
module.exports={VERSION,CLASS_IDS,SEVERE,ORANGE,SAFE_CONTEXT,normalize,extractFeatures,scoreCandidates,analyzeComposerSemantics,policyForClass}
