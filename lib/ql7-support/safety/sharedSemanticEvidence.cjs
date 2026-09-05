'use strict'
const crypto=require('node:crypto')
const {buildQl7CanonicalInputVariants,QL7_SUPPORT_MUTATION_LATTICE_VERSION}=require('../language/mutationLattice.cjs')
const {getComposerReviewedMaterialRows}=require('../../composer-safety/reviewedMaterialRegistry.cjs')
const {matchComposerLocaleSemanticHints}=require('../../composer-safety/localeSemanticHints.cjs')
const {buildComposerSemanticTargetFrame}=require('../../composer-safety/semanticTargetFrame.cjs')
const VERSION='5.4.3',CACHE=new Map(),INDEX=new Map()
const SAFE_ROLES=new Set(['quoted','reported','victim','counter_speech','news','education','research','fiction','roleplay','idiom','metaphor','denial','self_defense'])
const SEVERE_CONCEPTS=new Set(['credible_personal_threat','credible_threat','violence_incitement','terrorism_operational_intent','murder_or_mass_harm_intent','cyber_attack','asset_abuse','explosive','terror','weapon','sexual_violence_operational_intent'])
const ORANGE_CONCEPTS=new Set(['direct_insult','harassment','bullying','degrading_hate_like_language','degradation','profanity','profanity_non_targeted','uncertain_hostility'])
const normalize=(s='')=>String(s||'').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/gu,'').toLocaleLowerCase().replace(/[._*~`|/:;,+\-]+/gu,' ').replace(/\s+/gu,' ').trim(),compact=s=>normalize(s).replace(/[^\p{L}\p{N}]+/gu,''),h=s=>crypto.createHash('sha256').update(String(s)).digest('hex')
const STOP=new Set('ты тебя твой вам вы ваш я мы он она они это тот та пользователь люди человек слово фраза пример проверка контекста сообщение прямая адрес ну и как какая же перестань быть меня назвали цитата не называй почему разбор тест moderation direct user person system server qcoin support the a an to you your i we they he she said say word phrase example this that'.split(/\s+/u))
function rows(locale='en'){locale=String(locale||'en').toLowerCase().split(/[-_]/u)[0];if(CACHE.has(locale))return CACHE.get(locale);const arr=getComposerReviewedMaterialRows(locale);CACHE.set(locale,arr);return arr}
function editDistance(a,b,max=2){a=[...a];b=[...b];if(Math.abs(a.length-b.length)>max)return max+1;let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const cur=[i];let rowMin=i;for(let j=1;j<=b.length;j++){const v=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));cur[j]=v;rowMin=Math.min(rowMin,v)}if(rowMin>max)return max+1;prev=cur}return prev[b.length]}
function materialIndex(locale){
 locale=String(locale||'en').toLowerCase().split(/[-_]/u)[0]
 if(INDEX.has(locale))return INDEX.get(locale)
 // A single lexical token may only become standalone risk evidence when it is
 // concept-discriminative inside the direct-risk corpus. Template/function words
 // (for example English "what" in "what a filthy") occur across unrelated
 // concepts and must never inherit the label of whichever seed happened to win.
 const direct=[];const tokenConcepts=new Map()
 for(const row of rows(locale)){
  if(row.mutationDerived===true)continue
  const concept=String(row.conceptId||'neutral'),ctx=String(row.contextRole||'direct')
  const toks=normalize(row.surface).match(/[\p{L}\p{N}]+/gu)||[]
  // Specificity is measured against the whole reviewed corpus, not only direct rows.
  // Otherwise a generic question token can look unique merely because its safe-context
  // occurrences were excluded from the denominator.
  for(const token of new Set(toks)){
   if([...token].length<4||STOP.has(token))continue
   const set=tokenConcepts.get(token)||new Set();set.add(concept);tokenConcepts.set(token,set)
  }
  if(ctx==='direct')direct.push({row,concept,ctx,toks})
 }
 const result=[]
 for(const item of direct){
  const {row,concept,ctx,toks}=item
  for(const token of toks){
   if([...token].length<4||STOP.has(token))continue
   const concepts=tokenConcepts.get(token)||new Set()
   if(concepts.size!==1)continue
   result.push(Object.freeze({
    token,conceptId:concept,seedId:row.seedId||'',contextRole:ctx,
    target:String(row.target||''),intent:String(row.intent||''),actionability:String(row.actionability||''),
    weight:SEVERE_CONCEPTS.has(concept)?.93:.85,
   }))
  }
 }
 const dedup=[...new Map(result.map(x=>[`${x.conceptId}:${x.token}:${x.target}:${x.intent}:${x.actionability}`,x])).values()]
 INDEX.set(locale,Object.freeze(dedup))
 return INDEX.get(locale)
}
function isStructurallyUncoveredNoise(value=''){
 const words=normalize(value).match(/[\p{L}\p{N}]+/gu)||[]
 if(words.length<1||words.length>4)return false
 const latinConsonantRun=/^[bcdfghjklmnpqrstvwxyz]{5,}$/iu
 const cyrillicConsonantRun=/^[бвгджзйклмнпрстфхцчшщ]{5,}$/iu
 return words.every(word=>latinConsonantRun.test(word)||cyrillicConsonantRun.test(word))
}
function stripExplicitQuotedSegments(source=''){return String(source||'').replace(/«[^»]*»|“[^”]*”|"[^"]*"|'[^']*'/gu,' ')}
function hasMaterialRiskLexeme(source=''){return /(?:угрож|уб|взорв|бомб|hack|ddos|дд|qcoin|украд|накрут|обойти|шлюх|твар|мраз|weapon|terror|kill|steal|attack|bomb|shoot|stab|harm|изнасил|зґвалт|rape|sexual\s+assault|tecavüz|اغتصاب|强奸|性侵|אונס)/iu.test(normalize(source))}
function contextRole(source=''){const raw=String(source||'');const s=normalize(raw);const explicitQuote=/«[^»]*»|“[^”]*”|"[^"]*"|'[^']*'/u.test(raw);const unquoted=stripExplicitQuotedSegments(raw);const harmfulUnquoted=explicitQuote&&hasMaterialRiskLexeme(unquoted);if(!harmfulUnquoted&&(/^(?:>|“|"|«)|(?:^|\s)(?:цитат\p{L}*|quote|quoted|said|сказал|сказала|написал|написала)(?:\s|$)/iu.test(s)))return 'quoted';if(/(?:мне сказали|мне написали|he said|she said|they said|reported|сообщили|сказали)/iu.test(s))return 'reported';if(/\b(?:меня угрож|мне угрож|victim|against me|на меня напал)\b/iu.test(s))return 'victim';if(/(?:новост|news|article|reporting|историческ|historical)/iu.test(s))return 'news';if(/\b(?:учеб|образоват|education|research|исследован|анализир)\b/iu.test(s))return 'education';if(/(?:\bwhat\s+(?:does|do|is|are)\b.{0,80}\b(?:mean|meaning|insult|threat|slur)\b|\bis\b.{0,60}\b(?:an?\s+)?(?:insult|threat|slur)\b|что\s+(?:значит|означает)(?:\s|$)|является\s+ли.{0,80}(?:оскорб|угроз|бран))/iu.test(s))return 'education';if(/\b(?:фильм|роман|fiction|story|персонаж|roleplay|ролевая)\b/iu.test(s))return 'fiction';if(/(?:\b(?:i will not|i won't|do not intend|do not call|don't call|do not say|don't say|do not insult|don't insult|do not threaten|don't threaten)\b|(?:^|\s)(?:не буду|не собираюсь|не хочу причин|не называй|не говори|не оскорбляй|не угрожай)(?:\s|$))/iu.test(s))return 'denial';if(/\b(?:осуждаю|против насилия|counter.?speech|это неправильно)\b/iu.test(s))return 'counter_speech';return 'direct'}
function stripScopedQuotedSegments(source=''){return String(source||'').replace(/«[^»]*»|“[^”]*”|"[^"]*"|'[^']*'|「[^」]*」|『[^』]*』/gu,' ')}
function resolveContextRole(source='',locale='en'){
 const raw=String(source||''),s=normalize(raw),hints=matchComposerLocaleSemanticHints(raw,locale)
 const explicitQuote=/«[^»]*»|“[^”]*”|"[^"]*"|'[^']*'|「[^」]*」|『[^』]*』/u.test(raw)
 const unquoted=stripScopedQuotedSegments(raw),harmfulUnquoted=explicitQuote&&hasMaterialRiskLexeme(unquoted)
 const explicitKnowledgeContext=/(?:новост|article|reporting|историческ|historical|research|исследован|учеб|образоват|что\s+(?:значит|означает)|what\s+(?:does|do|is|are).{0,80}(?:mean|meaning))/iu.test(s)
 if(hints.victim||/(?:мне\s+(?:угрож|пишут|написал|сказал)|меня\s+(?:атак|преслед)|threatened\s+me|wrote\s+to\s+me|said\s+to\s+me|attacked\s+me|harassed\s+me)/iu.test(s))return 'victim'
 if(hints.counter||/(?:осуждаю\s+насили|против\s+(?:насили|террор|войн)|condemn\s+violence|against\s+(?:violence|terror|war))/iu.test(s))return 'counter_speech'
 if(explicitKnowledgeContext||(hints.education&&!explicitQuote))return hints.education?'education':'news'
 if(/(?:фильм|роман|книг|сценари|персонаж|fiction|story|movie|novel|roleplay|role-play)/iu.test(s))return 'fiction'
 if(/(?:i\s+(?:will\s+not|won't|do\s+not\s+intend)|do\s+not\s+(?:call|say|insult|threaten|kill|attack)|don't\s+(?:call|say|insult|threaten|kill|attack)|(?:^|\s)(?:(?:я|мы)\s+)?не\s+(?:буду|собираюсь|хочу\s+причин|назову|скажу|оскорблю|угрожаю|угрожу|убью|убьём|убьем|атакую|нападу|взорву)|(?:^|\s)не\s+(?:называй|говори|оскорбляй|угрожай|убивай|нападай)(?:\s|$))/iu.test(s))return 'denial'
 if(/(?:мне\s+(?:сказали|написали)|(?:he|she|they)\s+(?:said|wrote)|reported|сообщили)/iu.test(s))return 'reported'
 if(explicitQuote&&!harmfulUnquoted)return 'quoted'
 return 'direct'
}
function intent(source=''){const s=normalize(source);if(/\b(?:как|how|ways?|инструкц|способ|обойти|накрутить|украсть|взломать|ddos|ддос)\b/iu.test(s))return 'question_or_operational';if(/(?:^|\s)(?:я|мы|i|we)(?:\s|$).{0,24}\b(?:сделаю|буду|собираюсь|планирую|прикончу|грохну|уничтожу|снесу|взорву|украду|will|plan|going to)\b/iu.test(s))return 'commitment';return 'description'}
function familySignals(source=''){const s=normalize(source),c=compact(source),out=[],push=(concept,weight,evidence,meta={})=>out.push({conceptId:concept,weight,evidence,...meta});if(/(?:шлюх|твар|мраз|ублюд|сука|идиот|дебил|мудак|мерзк|ху[йи]|пид[оа]р)/iu.test(s)||/(?:шлюх|твар|мраз|ублюд|сука|идиот|дебил|мудак|мерзк|ху[йи]|пид[оа]р)/iu.test(c)||/(?:shlyuh|tvar|mraz)/iu.test(s))push('direct_insult',.94,'supplemental-hostility-family');if(/(?:приконч|грохн|убью|зареж|застрелю|взорв|снесу.{0,12}(?:серв|сайт)|kill\s+you|i\s*ll\s+kill)/iu.test(s))push('credible_threat',.96,'supplemental-threat-family',{target:'person',intent:'commitment',actionability:'none'});if(/(?:дд[о0]с|dd[o0]s|снесу.{0,12}серв|взлом|hack.{0,12}(?:server|account)|ботнет|botnet)/iu.test(s)||/(?:дд0с|dd0s)/iu.test(c))push('cyber_attack',.95,'supplemental-cyber-family',{target:'ecosystem',intent:'description',actionability:'operational'});if(/(?:украд.{0,16}qcoin|накрут.{0,16}qcoin|обойти.{0,20}(?:начислен|qcoin)|steal.{0,16}qcoin|bypass.{0,16}qcoin)/iu.test(s))push('asset_abuse',.95,'supplemental-asset-family',{target:'asset',intent:'question',actionability:'operational'});if(/(?:бомб|взорв|explosive|mass\s+harm|теракт|terror)/iu.test(s))push('violence_incitement',.82,'supplemental-danger-family',{target:'unspecified',intent:'description',actionability:'none'});const sexual=/(?:изнасил|сексуальн.{0,20}(?:насил|принужд)|без\s+соглас|зґвалт|rape|sexual\s+assault|sexual\s+coercion|violaci[oó]n|agresi[oó]n\s+sexual|tecavüz|cinsel\s+sald|اغتصاب|اعتداء\s+جنسي|强奸|性侵|אונס|תקיפה\s+מינית)/iu.test(s);const sexualOperational=sexual&&/(?:(?:^|\s)(?:я|мы|i|we)(?:\s|$).{0,36}(?:хочу|хотим|собираюсь|планирую|буду|want|plan|going\s+to|will).{0,48}(?:изнасил|зґвалт|rape|sexual\s+assault|tecavüz|اغتصاب|强奸|אונס)|(?:как\s+(?:(?:совершить|сделать).{0,24})?(?:изнасил|зґвалт)|how\s+to.{0,30}(?:rape|sexual)|cómo.{0,30}(?:violar|agresi[oó]n\s+sexual)|nasıl.{0,30}(?:tecavüz|cinsel\s+sald)|كيف.{0,30}(?:اغتصاب|اعتداء\s+جنسي)|如何.{0,30}(?:强奸|性侵)|איך.{0,30}(?:אונס|תקיפה\s+מינית))|(?:давай|давайте|let'?s).{0,36}(?:изнасил|rape|tecavüz|اغتصاب|强奸|אונס))/iu.test(s);if(sexualOperational)push('sexual_violence_operational_intent',.98,'supplemental-sexual-violence-operational',{target:'person',intent:/^(?:.*(?:как|how|cómo|nasıl|كيف|如何|איך))/iu.test(s)?'question':'commitment',actionability:'operational'});else if(sexual)push('sexual_violence',.94,'supplemental-sexual-violence-family',{target:'person',intent:'description',actionability:'none'});if(/(?:как\s+работ|подскаж|добрый\s+(?:день|вечер)|will\s+this\s+work|how\s+does|what\s+is|bana.{0,40}bahset|anlat|cu[eé]ntame|expl[ií]came|حدثني|告诉我|ספר\s+לי)/iu.test(s))push('benign_support_request',.88,'supplemental-benign-support',{target:'none',intent:'question',actionability:'none'});return out}
function materialRootSignals(source,locale){
 const lattice=buildQl7CanonicalInputVariants(source,{locale,maxVariants:24}),index=materialIndex(locale),hits=[]
 for(const hyp of lattice.hypotheses){
  const toks=normalize(hyp.text).match(/[\p{L}\p{N}]+/gu)||[],byConcept=new Map()
  for(let tokenIndex=0;tokenIndex<toks.length;tokenIndex++){
   const token=toks[tokenIndex],tokenLen=[...token].length
   if(tokenLen<4)continue
   for(const root of index){
    const rootLen=[...root.token].length,exact=token===root.token
    // Short one-edit matches are unsafe as standalone semantic evidence (e.g. Turkish bana/sana).
    // Fuzzy matching is reserved for sufficiently long lexical anchors and later requires corroboration.
    const maxDistance=exact?0:(rootLen>=8?2:rootLen>=5?1:0)
    if(!exact&&maxDistance===0)continue
    const distance=exact?0:editDistance(token,root.token,maxDistance)
    if(!exact&&distance>maxDistance)continue
    const match={...root,token,tokenIndex,tokenLength:tokenLen,rootLength:rootLen,exact,distance}
    const arr=byConcept.get(root.conceptId)||[];arr.push(match);byConcept.set(root.conceptId,arr)
   }
  }
  for(const [conceptId,matches] of byConcept){
   const uniqueByInput=[...new Map(matches.map(m=>[`${m.tokenIndex}:${m.token}`,m])).values()]
   const strongest=matches.slice().sort((a,b)=>(b.exact-a.exact)||(b.rootLength-a.rootLength)||(a.distance-b.distance))[0]
   const strongStandalone=matches.some(m=>(m.exact&&m.rootLength>=7)||(!m.exact&&m.rootLength>=8&&m.distance===1))
   const corroborated=uniqueByInput.length>=2
   const severe=SEVERE_CONCEPTS.has(conceptId)
   const moderate=ORANGE_CONCEPTS.has(conceptId)
   // Severe concepts cannot be promoted from a lone short/common token. Moderate lexical insults may.
   const accepted=severe?(strongStandalone||corroborated):moderate?(matches.some(m=>m.exact)||strongStandalone||corroborated):(matches.some(m=>m.exact)||corroborated)
   if(!accepted)continue
   hits.push({
    conceptId,
    weight:Math.min(.97,Number(strongest.weight||.8)+(corroborated?.03:0)+(strongStandalone?.02:0)),
    evidence:corroborated?'reviewed-material-root-corroborated':'reviewed-material-root-strong',
    seedId:strongest.seedId,
    matchedRootHash:h(strongest.token).slice(0,16),
    hypothesisTransformations:hyp.transformationIds,
    target:strongest.target,
    intent:strongest.intent,
    actionability:strongest.actionability,
    corroboratingInputTokenCount:uniqueByInput.length,
    rootMatchExact:strongest.exact,
   })
  }
 }
 return {lattice,hits}
}
function evidenceFor(text,{locale='en'}={}){
 const source=String(text||''),n=normalize(source),role=resolveContextRole(source,locale),arr=rows(locale),hits=[],rootScan=materialRootSignals(source,locale),targetFrame=buildComposerSemanticTargetFrame(source,{conversationTargeted:false})
 for(const hyp of rootScan.lattice.hypotheses){
  const hn=normalize(hyp.text),hc=compact(hyp.text)
  for(const row of arr){
   const rr=normalize(row.surface),rc=compact(row.surface)
   if(!rr)continue
   const exact=hn===rr||hn.includes(rr)||(rc.length>=5&&hc.includes(rc))
   if(!exact)continue
   hits.push({
    conceptId:row.conceptId||'neutral',weight:.84,source:'reviewed-material-surface',seedId:row.seedId||'',
    surfaceHash:h(rr).slice(0,16),contextRole:row.contextRole||'direct',hypothesisTransformations:hyp.transformationIds,
    target:String(row.target||''),intent:String(row.intent||''),actionability:String(row.actionability||''),
   })
  }
 }
 hits.push(...rootScan.hits.map(x=>({...x,source:x.evidence||'reviewed-material-root'})),...familySignals(source).map(x=>({...x,source:'supplemental-semantic-family'})))
 if(targetFrame.explicitBenignNonHumanTarget&&!targetFrame.explicitHumanTarget){
  for(let index=hits.length-1;index>=0;index-=1){
   if(['credible_threat','credible_personal_threat','murder_or_mass_harm_intent'].includes(String(hits[index]?.conceptId||'')))hits.splice(index,1)
  }
 }
 const by=new Map();for(const x of hits){const prev=by.get(x.conceptId);if(!prev||x.weight>prev.weight)by.set(x.conceptId,x)}
 const concepts=[...by.values()].sort((a,b)=>b.weight-a.weight),primaryHit=concepts[0]||null,primary=primaryHit?.conceptId||'neutral'
 const materialSafeContext=hits.some(x=>SAFE_ROLES.has(String(x.contextRole||''))&&x.source==='reviewed-material-surface')
 const unquotedScope=stripScopedQuotedSegments(source),unquotedIntent=intent(unquotedScope)
 const unquotedSevere=familySignals(unquotedScope).some(x=>SEVERE_CONCEPTS.has(String(x.conceptId||'')))
 const actionableSafeContextConflict=!['denial','victim','counter_speech'].includes(role)&&unquotedSevere&&(unquotedIntent!=='description'||/(?:how\s+to|step[- ]by[- ]step|как\s+(?:сделать|собрать)|пошаг|инструкц)/iu.test(normalize(unquotedScope)))
 const safeContext=(SAFE_ROLES.has(role)||materialSafeContext)&&!actionableSafeContextConflict
 const riskNeighborhood=/(?:угрож|уб|взорв|бомб|hack|ddos|дд|qcoin|украд|накрут|обойти|шлюх|твар|мраз|weapon|terror|kill|steal|attack|bomb|shoot|stab|harm|изнасил|зґвалт|rape|sexual\s+assault|tecavüz|اغتصاب|强奸|性侵|אונס)/iu.test(n)&&!(targetFrame.explicitBenignNonHumanTarget&&!targetFrame.explicitHumanTarget&&!concepts.length)
 const coverageConfidence=concepts.length?Math.min(.99,.78+Math.min(.20,concepts.length*.05)):(riskNeighborhood?.24:.18)
 const semanticConfidence=concepts.length?(concepts[0].weight||.7):(riskNeighborhood?.30:.20)
 const lexicalTarget=targetFrame.personalThreatTarget||/(?:support|саппорт|сервер|qcoin)/iu.test(n)
 const dataTarget=String(primaryHit?.target||'')
 const target=lexicalTarget||['person','support','ecosystem','server','account','asset'].includes(dataTarget)?'specific_or_ecosystem':'unspecified'
 const lexicalIntent=intent(source),dataIntent=String(primaryHit?.intent||'')
 const intentClass=lexicalIntent!=='description'?lexicalIntent:(['commitment','question','request','incitement'].includes(dataIntent)?dataIntent:'description')
 const dataActionability=String(primaryHit?.actionability||'')
 const actionability=/(?:как|how|шаг|step|инструкц|script|код|exploit|обойти|накрут)/iu.test(n)||dataActionability==='operational'?'potentially_operational':'descriptive_or_none'
 let semanticClass='neutral',risk='none'
 if(concepts.length){
  if(safeContext){
   semanticClass=role==='victim'
    ?'victim_report'
    :role==='news'||role==='education'
     ?'news_historical_educational_context'
     :role==='denial'
      ?'quoted_or_reported_harm'
      :role==='counter_speech'
       ?'counter_speech'
       :'quoted_or_reported_harm'
  }else if(SEVERE_CONCEPTS.has(primary)){
   if(['credible_threat','credible_personal_threat'].includes(primary)){
    if(intentClass==='commitment'&&target==='specific_or_ecosystem'){semanticClass='credible_threat';risk='severe'}
    else if(actionability==='potentially_operational'||['question','request','incitement'].includes(intentClass)){semanticClass='dangerous_operational_intent';risk='severe'}
    else {semanticClass='risk_ambiguous';risk='uncertain'}
   }else{semanticClass=['cyber_attack','asset_abuse'].includes(primary)?'dangerous_operational_intent':primary;risk='severe'}
  }else if(ORANGE_CONCEPTS.has(primary)){semanticClass=primary;risk='moderate'}
  else if(primary==='sexual_violence'){semanticClass='sexual_violence_context';risk='moderate'}
  else if(primary==='benign_support_request'){semanticClass='clean_respectful';risk='none'}
  else semanticClass=primary
 }else if(riskNeighborhood){semanticClass='risk_ambiguous';risk='uncertain'}
 else if(isStructurallyUncoveredNoise(source)){semanticClass='unknown_or_uncovered';risk='unknown'}
 else {semanticClass='neutral';risk='none'}
 const noUnsupportedHighConfidenceClean=!(semanticClass==='clean_respectful'&&coverageConfidence<.65),ambiguity=Math.max(0,1-semanticConfidence)
 return Object.freeze({
  schema:'ql7.support.shared-semantic-safety-frame',schemaVersion:VERSION,normalizationVersion:QL7_SUPPORT_MUTATION_LATTICE_VERSION,
  locale,originalHash:h(source),normalizedHash:h(n),semanticClass,risk,contextRole:role,target:Object.freeze({kind:target,semanticFrame:targetFrame}),
  intent:Object.freeze({kind:intentClass}),actionability:Object.freeze({kind:actionability}),conceptCandidates:Object.freeze(concepts.map(Object.freeze)),
  coverageConfidence,semanticConfidence,sourceConfidence:concepts.length?.90:.20,policyConfidence:Math.min(semanticConfidence,coverageConfidence),
  ambiguity,abstentionReason:semanticClass==='risk_ambiguous'?'risk_neighborhood_low_or_uncorroborated_material_coverage':semanticClass==='neutral'&&!concepts.length?'no_material_risk_signal':'',safeContext,
  noUnsupportedHighConfidenceClean,normalizationHypotheses:Object.freeze(rootScan.lattice.hypotheses.map(x=>Object.freeze({transformations:x.transformationIds,score:x.score,textHash:h(x.text).slice(0,16)}))),
  provenanceHash:h(JSON.stringify({v:VERSION,locale,role,concepts})),
 })
}
function policy(frame){if(frame.safeContext&&frame.conceptCandidates?.length)return Object.freeze({decision:'ALLOW',tone:'green',punitive:false,reason:'safe_context_with_material_evidence'});if(frame.risk==='severe')return Object.freeze({decision:'BLOCK',tone:'red',punitive:false,createSecurityCase:true,reason:frame.semanticClass});if(frame.risk==='moderate'||frame.risk==='uncertain'||frame.risk==='unknown')return Object.freeze({decision:'ALLOW_WITH_WARNING',tone:'orange',punitive:false,reason:frame.semanticClass});if(frame.semanticClass==='clean_respectful'&&frame.coverageConfidence>=.65&&frame.conceptCandidates?.length)return Object.freeze({decision:'ALLOW',tone:'green',punitive:false,reason:'sufficient_safe_coverage'});if(frame.semanticClass==='neutral'&&frame.risk==='none')return Object.freeze({decision:'ALLOW',tone:'green',punitive:false,reason:'no_material_risk_signal'});return Object.freeze({decision:'ALLOW_WITH_WARNING',tone:'orange',punitive:false,reason:'coverage_uncertain'})}
function audit(){const cases=[['ru','т.в.а.р.ь','direct_insult'],['ru','дд0с','dangerous_operational_intent'],['ru','я тебя прикончу','credible_threat'],['ru','цитата: я тебя прикончу','credible_threat'],['ru','цитата: «я тебя прикончу»','quoted_or_reported_harm'],['ru','мне написали «я тебя убью»','victim_report'],['tr','bana denizden bahset','clean_respectful'],['tr','sana zarar vereceğim','credible_threat'],['en','will this work','clean_respectful'],['en','What is QL7 Blockchain?','clean_respectful'],['en','what does kill you mean','news_historical_educational_context'],['en','do not call people idiot','quoted_or_reported_harm'],['ru','что значит я тебя убью','news_historical_educational_context']],failures=[],rowsOut=[];for(const [locale,text,expected] of cases){const frame=evidenceFor(text,{locale});rowsOut.push({locale,textHash:h(text).slice(0,12),semanticClass:frame.semanticClass,risk:frame.risk,contextRole:frame.contextRole});if(frame.semanticClass!==expected)failures.push(`${locale}:${expected}:${frame.semanticClass}`)}const clean=evidenceFor('добрый день, подскажите как работает форум',{locale:'ru'});if(clean.semanticClass!=='clean_respectful'||clean.coverageConfidence<.65)failures.push('clean_control');const neutral=evidenceFor('квампель фрумзик',{locale:'ru'});if(neutral.semanticClass!=='neutral'||neutral.risk!=='none')failures.push('neutral_control');const sexual=evidenceFor('как насчет изнасилования',{locale:'ru'});if(!['sexual_violence_context','risk_ambiguous'].includes(sexual.semanticClass))failures.push('sexual_violence_uncovered');return Object.freeze({ok:!failures.length,version:VERSION,cases:Object.freeze(rowsOut),failures:Object.freeze(failures)})}
module.exports={VERSION,normalize,contextRole:resolveContextRole,evaluateQl7SharedSemanticSafety:evidenceFor,projectQl7SharedSafetyPolicy:policy,auditQl7SharedSemanticSafety:audit}
