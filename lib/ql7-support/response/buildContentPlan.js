import {buildQl7SupportContactQuestionnaire} from '../contact/questionnaire.js'
import {getQl7SupportTopicLabel, normalizeQl7SupportTopic} from '../ecosystemCatalog.js'
import {normalizeQl7SupportReceipts} from '../data/adapterReceipt.js'
import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'
import {localizeQl7ChoiceOther} from '../presentation/choiceLocaleLexicon.js'

export const QL7_SUPPORT_CONTENT_PLAN_VERSION='14.15.0'
const SOCIAL=new Set(['entry_greeting','greeting','gratitude','farewell','wellbeing_question','small_talk','emotional_support','humor_request','humor_followup','topic_recall','topic_resume','spam_or_noise','general_knowledge_question'])
const CLOSURE=new Set(['gratitude','farewell','conversation_close'])
const RELATIONSHIP_ACTS=new Set(['business_proposal','partnership_request','human_operator_request'])
const RELATIONSHIP_TOPICS=new Set(['partnership','investment','contact'])
const PRODUCT_KNOWLEDGE_SECONDARIES=Object.freeze({
 platform:Object.freeze(['qcoin','wallet','metamarket','academy','exchange_ai']),
 qcoin:Object.freeze(['wallet']),
 wallet:Object.freeze(['qcoin','exchange']),
 exchange_ai:Object.freeze(['exchange','vip']),
 battlecoin:Object.freeze(['exchange','qcoin']),
 gameverse:Object.freeze(['qcoin']),
 metamarket:Object.freeze(['qcoin']),
 quantum_zigzag:Object.freeze(['qcoin']),
 battle_chat:Object.freeze(['exchange']),
 messenger:Object.freeze(['support_system']),
 quests:Object.freeze(['qcoin']),
 news:Object.freeze(['homepage']),
 futures:Object.freeze(['exchange']),
 search:Object.freeze(['forum_feed','forum_threads']),
 geodetect:Object.freeze(['forum_feed','profile']),
 media:Object.freeze(['forum_feed','moderation']),
 moderation:Object.freeze(['forum_feed','forum_threads']),
 quantum_family:Object.freeze(['profile']),
 auth:Object.freeze(['telegram','wallet']),
 telegram:Object.freeze(['auth','wallet']),
 payments:Object.freeze(['wallet','qcoin']),
 vip:Object.freeze(['payments']),
 ads_packages:Object.freeze(['payments','ads_campaigns']),
 ads_campaigns:Object.freeze(['ads_packages']),
 push:Object.freeze(['messenger']),
 contact:Object.freeze(['support_system']),
 privacy:Object.freeze(['security','account_deletion']),
 security:Object.freeze(['privacy','contact']),
 account_deletion:Object.freeze(['privacy','auth']),
 navigation:Object.freeze(['auth']),
 roadmap:Object.freeze(['system_status']),
 system_status:Object.freeze(['roadmap']),
 localization:Object.freeze(['accessibility']),
 accessibility:Object.freeze(['localization']),
 support_system:Object.freeze(['contact','privacy']),
})
const KNOWLEDGE_ACTS=new Set(['informational_question','how_to_question','roadmap_question','availability_question','when_question'])
function topicOf(input={}){const raw=ql7Str(input?.analysis?.topic||input?.route?.topic||'support_system');if(['ads_packages','ads_campaigns','partnership','investment','contact'].includes(raw))return raw;return normalizeQl7SupportTopic(raw)}
function receiptSearchText(row={}){const result=row?.result&&typeof row.result==='object'?row.result:{};return `${row?.adapter||''} ${row?.source||''} ${row?.actorScope||row?.scope||''} ${result?.topic||''} ${result?.branch||''} ${result?.specializedBranch||''}` }
function receiptFor(topic,rows=[]){const hints={qcoin:/qcoin|balance|ledger/i,vip:/vip/i,ads_packages:/ads|package/i,ads_campaigns:/ads|campaign|metric/i,payments:/payment|invoice/i,profile:/profile|rating/i,rating:/rating|profile/i,forum:/forum/i,forum_feed:/forum/i,forum_threads:/forum/i,geodetect:/geo|geodetect|_geoCurrent|profile/i,quantum_family:/quantum_family|subscription|followers|following|family/i,moderation:/moderation|report|complaint|forum_reports|admin_events/i,metamarket:/metamarket/i,battlecoin:/battlecoin|order|battle/i,exchange_ai:/exchange_ai|ai|quota|market|crypto|recommend|price/i,telegram:/telegram/i,support_system:/support|ql7_support|case|outbox/i};const re=hints[topic];return rows.find(r=>r.executed&&Number(r.writeCount||0)===0&&(!re||re.test(receiptSearchText(r))))||null}
function roleFor({topic,act,safety,resultKind,operationId=''}){if(safety?.category==='insult_uncertain')return'choice';if(safety?.category==='insult_denied')return'conversation';if(safety?.selfHarm)return'operator';if(safety?.threat)return'threat';if(safety?.category==='direct_insult')return safety.cooldownMs?'blocked':'warning';if(act==='gratitude')return'gratitude';if(act==='entry_greeting'||act==='greeting')return'greeting';if(act==='topic_recall'||act==='topic_resume')return'conversation';if(act==='spam_or_noise')return'choice';if(act==='humor_request'||act==='humor_followup')return'humor';if(act==='emotional_support')return'emotional_support';if(act==='identity_question')return'identity';if(act==='human_operator_request')return'operator';if(act==='security_boundary')return'privacy';if(act==='reported_speech')return'conversation';if(topic==='exchange_ai'&&operationId==='current_price')return'verification';if(act==='ai_recommendation_request'||topic==='exchange_ai')return'ai_recommendation';if(act==='business_proposal'||act==='partnership_request')return topic==='investment'?'investment':'partnership';if(topic==='qcoin'&&act==='incident_report')return'security';if(topic==='security'&&act==='incident_report')return'security';if(resultKind==='unavailable')return'unavailable';if(resultKind==='inconsistent')return'warning';if(topic==='ads_packages')return'ads_package';if(topic==='ads_campaigns')return'ads_metrics';if(topic==='payments')return'payment';if(topic==='support_system'&&act==='ambiguous_request')return'choice';const map={platform:'identity',homepage:'information',news:'information',exchange:'payment',exchange_ai:'ai_recommendation',battlecoin:'payment',battle_chat:'social',futures:'analytics',academy:'academy',academy_exam:'academy',gameverse:'gameverse',metastudio:'gameverse',metaverse:'gameverse',quantum_zigzag:'information',ql7_blockchain:'information',forum_feed:'forum',forum_threads:'forum',search:'information',geodetect:'forum',media:'forum',moderation:'security',metamarket:'metamarket',quantum_family:'social',profile:'identity',auth:'security',wallet:'wallet',telegram:'telegram',push:'event',messenger:'social',quests:'gameverse',contact:'operator',privacy:'privacy',security:'security',account_deletion:'privacy',navigation:'information',roadmap:'information',system_status:'verification',localization:'translation',accessibility:'accessibility',support_system:'identity'};return map[topic]||topic||'social'}
function moodFor({act,safety,resultKind}){if(safety?.threat||safety?.selfHarm)return'strict';if(safety?.category==='direct_insult')return'firm';if(act==='entry_greeting'||act==='gratitude')return'warm';if(act==='humor_request'||act==='humor_followup')return'playful';if(act==='emotional_support')return'calm';if(resultKind==='verified'||resultKind==='verified_empty')return'confident';if(resultKind==='unavailable')return'neutral';return'supportive'}
function hasMaterialEntity(value,key=''){if(key==='hasSecret')return false;if(value===true)return true;if(value===false||value===null||value===undefined||ql7Str(value)==='')return false;if(Array.isArray(value))return value.some((item)=>hasMaterialEntity(item,key));if(typeof value==='object')return Object.entries(value).some(([childKey,child])=>hasMaterialEntity(child,childKey));return true}
const PROVIDER_CHOICE_LABELS=Object.freeze({
 qcoin:{de:'QCoin und Guthaben',fr:'QCoin et solde',it:'QCoin e saldo',pt:'QCoin e saldo',pl:'QCoin i saldo',nl:'QCoin en saldo',sv:'QCoin och saldo',no:'QCoin og saldo',da:'QCoin og saldo',fi:'QCoin ja saldo',cs:'QCoin a zustatek',sk:'QCoin a zostatok',hu:'QCoin es egyenleg',ro:'QCoin si sold',bg:'QCoin и баланс',sr:'QCoin i stanje',hr:'QCoin i stanje',sl:'QCoin in stanje',el:'QCoin και υπόλοιπο',ka:'QCoin და ბალანსი',az:'QCoin və balans',kk:'QCoin және баланс',ja:'QCoin と残高',ko:'QCoin 및 잔액'},
 ads_campaigns:{de:'Werbekennzahlen',fr:'Statistiques publicitaires',it:'Metriche pubblicitarie',pt:'Metricas de publicidade',pl:'Metryki reklam',nl:'Advertentiemetingen',sv:'Annonsstatistik',no:'Annonsemal',da:'Annoncemetrikker',fi:'Mainonnan mittarit',cs:'Reklamni metriky',sk:'Reklamne metriky',hu:'Hirdetesi mutatok',ro:'Metrici publicitari',bg:'Рекламни показатели',sr:'Metrike reklama',hr:'Metrike oglasa',sl:'Metrike oglasov',el:'Μετρήσεις διαφημίσεων',ka:'რეკლამის მეტრიკები',az:'Reklam metrikalari',kk:'Жарнама метрикалары',ja:'広告メトリクス',ko:'광고 지표'},
 exchange_ai:{de:'KI-Kryptoanalyse',fr:'Analyse crypto IA',it:'Analisi crypto AI',pt:'Analise cripto AI',pl:'Analiza krypto AI',nl:'AI-cryptoanalyse',sv:'AI-kryptoanalys',no:'AI-kryptoanalyse',da:'AI-kryptoanalyse',fi:'AI-kryptoanalyysi',cs:'AI kryptoanalyza',sk:'AI kryptoanalyza',hu:'AI kriptoelemzes',ro:'Analiza cripto AI',bg:'AI крипто анализ',sr:'AI kripto analiza',hr:'AI kripto analiza',sl:'AI kripto analiza',el:'AI ανάλυση crypto',ka:'AI კრიპტო ანალიზი',az:'AI kripto analizi',kk:'AI крипто талдау',ja:'AI暗号分析',ko:'AI 암호화폐 분석'},
 profile:{de:'Profil und Aktivitat',fr:'Profil et activite',it:'Profilo e attivita',pt:'Perfil e atividade',pl:'Profil i aktywnosc',nl:'Profiel en activiteit',sv:'Profil och aktivitet',no:'Profil og aktivitet',da:'Profil og aktivitet',fi:'Profiili ja toiminta',cs:'Profil a aktivita',sk:'Profil a aktivita',hu:'Profil es tevekenyseg',ro:'Profil si activitate',bg:'Профил и активност',sr:'Profil i aktivnost',hr:'Profil i aktivnost',sl:'Profil in dejavnost',el:'Προφίλ και δραστηριότητα',ka:'პროფილი და აქტივობა',az:'Profil və aktivlik',kk:'Профиль және белсенділік',ja:'プロフィールと活動',ko:'프로필 및 활동'},
 partnership:{de:'Partnerschaft',fr:'Partenariat',it:'Partnership',pt:'Parceria',pl:'Partnerstwo',nl:'Partnerschap',sv:'Partnerskap',no:'Partnerskap',da:'Partnerskab',fi:'Kumppanuus',cs:'Partnerstvi',sk:'Partnerstvo',hu:'Partnerség',ro:'Parteneriat',bg:'Партньорство',sr:'Partnerstvo',hr:'Partnerstvo',sl:'Partnerstvo',el:'Συνεργασία',ka:'პარტნიორობა',az:'Tərəfdaşlıq',kk:'Серіктестік',ja:'パートナーシップ',ko:'파트너십'},
 investment:{de:'Investition',fr:'Investissement',it:'Investimento',pt:'Investimento',pl:'Inwestycja',nl:'Investering',sv:'Investering',no:'Investering',da:'Investering',fi:'Sijoitus',cs:'Investice',sk:'Investicia',hu:'Befektetes',ro:'Investitie',bg:'Инвестиция',sr:'Investicija',hr:'Investicija',sl:'Nalozba',el:'Επένδυση',ka:'ინვესტიცია',az:'Investisiya',kk:'Инвестиция',ja:'投資',ko:'투자'},
 contact:{de:'Kontakt zum Operator',fr:'Contact operateur',it:'Contatto operatore',pt:'Contato com operador',pl:'Kontakt z operatorem',nl:'Contact met operator',sv:'Kontakt med operator',no:'Kontakt med operator',da:'Kontakt med operator',fi:'Yhteys operaattoriin',cs:'Kontakt s operatorem',sk:'Kontakt s operatorom',hu:'Kapcsolat operatorral',ro:'Contact operator',bg:'Контакт с оператор',sr:'Kontakt sa operaterom',hr:'Kontakt s operaterom',sl:'Kontakt z operaterjem',el:'Επικοινωνία με χειριστή',ka:'ოპერატორთან კავშირი',az:'Operatorla əlaqə',kk:'Оператормен байланыс',ja:'オペレーター連絡',ko:'운영자 연락'},
 support_system:{de:'Support-Hilfe',fr:'Aide support',it:'Aiuto supporto',pt:'Ajuda do suporte',pl:'Pomoc wsparcia',nl:'Supporthulp',sv:'Supporthjalp',no:'Supporthjelp',da:'Supporthjaelp',fi:'Tukipalvelu',cs:'Podpora',sk:'Podpora',hu:'Tamogatas',ro:'Ajutor suport',bg:'Помощ от поддръжка',sr:'Pomoc podrske',hr:'Pomoć podrške',sl:'Pomoč podpore',el:'Βοήθεια υποστήριξης',ka:'მხარდაჭერის დახმარება',az:'Dəstək yardımı',kk:'Қолдау көмегі',ja:'サポートヘルプ',ko:'지원 도움말'},
})
function choiceLabel(topic,locale='en'){
 const provider=PROVIDER_CHOICE_LABELS[topic]?.[locale]
 if(provider)return provider
 const fallback={qcoin:{en:'QCoin and balance',ru:'QCoin и баланс',uk:'QCoin і баланс',es:'QCoin y saldo',tr:'QCoin ve bakiye',ar:'QCoin والرصيد',zh:'QCoin 与余额',he:'QCoin ויתרה'},ads_campaigns:{en:'Advertising metrics',ru:'Рекламные метрики',uk:'Рекламні метрики',es:'Métricas publicitarias',tr:'Reklam metrikleri',ar:'مقاييس الإعلانات',zh:'广告指标',he:'מדדי פרסום'},exchange_ai:{en:'AI-Recomendation',ru:'AI-Recomendation по крипте',uk:'AI-Recomendation щодо крипти',es:'AI-Recomendation cripto',tr:'Kripto AI-Recomendation',ar:'توصية AI-Recomendation',zh:'AI-Recomendation 加密分析',he:'AI-Recomendation קריפטו'},security:{en:'Fraud or security',ru:'Мошенничество или безопасность',uk:'Шахрайство або безпека',es:'Fraude o seguridad',tr:'Dolandırıcılık veya güvenlik',ar:'احتيال أو أمان',zh:'欺诈或安全',he:'הונאה או אבטחה'},profile:{en:'Profile and activity',ru:'Профиль и активность',uk:'Профіль і активність',es:'Perfil y actividad',tr:'Profil ve etkinlik',ar:'الملف والنشاط',zh:'个人资料与活动',he:'פרופיל ופעילות'},partnership:{en:'Partnership',ru:'Партнерство',uk:'Партнерство',es:'Colaboración',tr:'Ortaklık',ar:'شراكة',zh:'合作',he:'שותפות'},investment:{en:'Investment',ru:'Инвестиции',uk:'Інвестиції',es:'Inversión',tr:'Yatırım',ar:'استثمار',zh:'投资',he:'השקעה'},contact:{en:'Operator contact',ru:'Связь с оператором',uk:"Зв'язок з оператором",es:'Contacto con operador',tr:'Operatörle iletişim',ar:'التواصل مع المشغل',zh:'联系人工客服',he:'יצירת קשר עם נציג'},support_system:{en:'Support help',ru:'Помощь поддержки',uk:'Допомога підтримки',es:'Ayuda de soporte',tr:'Destek yardımı',ar:'مساعدة الدعم',zh:'支持帮助',he:'עזרת תמיכה'}}[topic]
 return fallback?.[locale]||getQl7SupportTopicLabel(topic,locale)||fallback?.en||topic
}
const CHOICE_RELATED_DOMAINS=Object.freeze({
 ads_campaigns:Object.freeze(['ads_packages','payments','profile']),
 ads_packages:Object.freeze(['ads_campaigns','payments','profile']),
 qcoin:Object.freeze(['wallet','payments','profile']),
 wallet:Object.freeze(['qcoin','payments','security']),
 exchange_ai:Object.freeze(['exchange','vip','qcoin']),
 exchange:Object.freeze(['exchange_ai','wallet','payments']),
 vip:Object.freeze(['payments','profile','qcoin']),
 payments:Object.freeze(['wallet','qcoin','vip']),
 profile:Object.freeze(['quantum_family','geodetect','moderation']),
 forum_feed:Object.freeze(['forum_threads','search','moderation']),
 forum_threads:Object.freeze(['forum_feed','search','moderation']),
 metamarket:Object.freeze(['qcoin','wallet','profile']),
 telegram:Object.freeze(['auth','profile','security']),
 battlecoin:Object.freeze(['exchange','qcoin','profile']),
 quantum_family:Object.freeze(['profile','messenger','privacy']),
 moderation:Object.freeze(['forum_feed','forum_threads','privacy']),
 geodetect:Object.freeze(['forum_feed','profile','privacy']),
 security:Object.freeze(['privacy','auth','contact']),
 privacy:Object.freeze(['security','account_deletion','contact']),
 support_system:Object.freeze(['contact','privacy','security']),
})
function choicePlan(locale='en',topic='support_system',analysis={},now=''){
 const nowMs=Date.parse(ql7Str(now))||Number(now)||Date.now();const expiresAt=nowMs+900000
 const ranked=ql7Arr(analysis.topicCandidates)
  .map((row)=>({topic:normalizeQl7SupportTopic(row?.topic),score:Number(row?.probability??row?.confidence??row?.score??row?.total??0)}))
  .filter((row)=>row.topic&&row.topic!=='support_system'&&row.topic!=='other'&&Number.isFinite(row.score)&&row.score>0)
  .sort((a,b)=>b.score-a.score)
 const confirmationDomain=normalizeQl7SupportTopic(analysis?.intentConfirmation?.slotValues?.domainId)
 const primary=confirmationDomain||normalizeQl7SupportTopic(topic)
 const topics=[]
 const add=(candidate)=>{const value=normalizeQl7SupportTopic(candidate);if(!value||value==='support_system'||value==='other'||topics.includes(value)||topics.length>=4)return;topics.push(value)}
 for(const row of ranked)add(row.topic)
 add(primary)
 // Do not pad a semantic ambiguity with unrelated product menu items.
 // The Choice Card is a projection of the canonical ranked hypotheses only:
 // up to four material alternatives + Other. If the semantic owner has fewer
 // than two material alternatives, a choice surface is not justified.
 const anchor=(primary&&primary!=='support_system'?primary:topics[0])||'support_system'
 const confirmationState=ql7Str(analysis?.intentConfirmation?.state)
 const missingSlots=ql7Arr(analysis?.intentConfirmation?.missingSlots)
 // Only a canonical pending intent-confirmation may expand the card with
 // semantically adjacent scopes. A plain ranked ambiguity is never padded.
 if(['collecting','exhausted'].includes(confirmationState)&&missingSlots.length>0){
  for(const candidate of (CHOICE_RELATED_DOMAINS[anchor]||PRODUCT_KNOWLEDGE_SECONDARIES[anchor]||[]))add(candidate)
 }
 if(topics.length<2)return null
 const otherCopy=localizeQl7ChoiceOther(locale)
 return {id:`choice:${ql7StableHash(`${locale}:${anchor}:${topics.join('|')}`)}`,options:topics.slice(0,4).map((intent,i)=>({id:`option-${i+1}`,label:choiceLabel(intent,locale),topic:intent,intent,expirySeconds:900,expiresAt,oneTime:true,signedToken:''})),other:{id:'other',label:otherCopy.label,topic:'other',intent:'other',placeholder:otherCopy.placeholder,expirySeconds:900,expiresAt,oneTime:true,signedToken:''}}
}
function openCaseChoicePlan(locale='en',openCases=[],now='',timeZone='UTC'){
 const nowMs=Date.parse(ql7Str(now))||Number(now)||Date.now();const expiresAt=nowMs+900000
 const options=ql7Arr(openCases)
  .map((item)=>({item,caseId:ql7Str(item?.caseId||item?._id||item?.id)}))
  .filter((row)=>row.caseId)
  .slice(0,4)
  .map(({item,caseId},index)=>{const topic=normalizeQl7SupportTopic(item?.topic||'support_system');const label=getQl7SupportTopicLabel(topic,locale)||getQl7SupportTopicLabel(topic,'en')||topic;let description='';const rawDate=ql7Str(item?.updatedAt||item?.createdAt);if(rawDate){const parsed=Date.parse(rawDate);if(Number.isFinite(parsed)){try{description=new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',timeZone:ql7Str(timeZone)||'UTC'}).format(new Date(parsed))}catch{description=new Date(parsed).toISOString().slice(0,10)}}}return{id:`open-case-${index+1}`,label:`${label} #${index+1}`,description,topic,intent:'status_followup',caseId,expirySeconds:900,expiresAt,oneTime:true,signedToken:''}})
 const otherCopy=localizeQl7ChoiceOther(locale)
 const other={id:'other',label:otherCopy.label,topic:'other',intent:'other',placeholder:otherCopy.placeholder,expirySeconds:900,expiresAt,oneTime:true,signedToken:''}
 return{id:`open-cases:${ql7StableHash(`${locale}:${options.map(row=>row.caseId).join('|')}:${expiresAt}`)}`,options,other}
}
function relationshipPlan({analysis={},topic='',act='',conversationState={}}={}){
 const active=RELATIONSHIP_ACTS.has(act)||analysis.relationshipSignal===true||analysis.commercialIntent===true||ql7Str(analysis.operatorIntent)==='human_operator_requested'
 if(!active)return null
 const contactStatus=analysis.contactRefused?'dm_only':analysis.contactConsent?'provided':'missing'
 const turns=Number(conversationState?.business?.intakeTurns||0)
 const operatorRequested=act==='human_operator_request'||ql7Str(analysis.operatorIntent)==='human_operator_requested'||Number(conversationState?.business?.operatorRequestTurns||0)>0
 const briefReady=analysis.businessBriefReady===true||turns>=2||contactStatus!=='missing'
 const stage=contactStatus==='provided'?'handoff_with_contacts':contactStatus==='dm_only'?'handoff_dm_only':briefReady&&turns>=3?'handoff_without_contacts':briefReady?'collect_contact':'collect_brief'
 const operatorReportReady=stage.startsWith('handoff_')
 return Object.freeze({active:true,stage,topic:RELATIONSHIP_TOPICS.has(topic)?topic:'contact',contactStatus,operatorRequested,briefReady,intakeTurns:turns,contactPromptRequired:stage==='collect_contact'||stage==='collect_brief',operatorReportReady,reason:operatorRequested?'human_operator_requested':'business_relationship_intake'})
}
function clarificationDomainFor(analysis={}){
 const candidate=ql7Arr(analysis.topicCandidates).map(row=>normalizeQl7SupportTopic(row?.topic)).find(topic=>topic&&topic!=='support_system')
 if(candidate)return candidate
 if(analysis?.marketSignals?.hasAsset===true)return'exchange_ai'
 return'support_system'
}
function eventSemanticPropositions(envelope={}){
 const sourceProposition=envelope?.payload?.announcement||envelope?.payload?.securityNotice||null
 return [
  envelope?.type?`event:${envelope.type}`:'',
  envelope?.primaryDomainId?`event-domain:${envelope.primaryDomainId}`:'',
  envelope?.primaryMicrotopicId?`event-microtopic:${envelope.primaryMicrotopicId}`:'',
  envelope?.sourceReceipt?.receiptId?`event-source:${envelope.sourceReceipt.receiptId}`:'',
  sourceProposition?.propositionId?`event-proposition:${sourceProposition.propositionId}`:'',
  sourceProposition?.templateId?`event-template:${sourceProposition.templateId}@${sourceProposition.templateVersion}`:'',
  ...ql7Arr(envelope?.verifiedFactIds).map((factId)=>`verified-event-fact:${factId}`),
 ].filter(Boolean)
}
export function buildQl7SupportResponseContentPlan({analysis={},route={},tone={},locale='en',receipts=[],conversationState={},seed='',factProjection=null,runtimeContext={}}={}){
 const topic=topicOf({analysis,route});const act=ql7Str(analysis.messageAct||route.messageAct||'informational_question');const safety=analysis.safety||tone.safety||{};const eventEnvelope=act==='event_notification'&&runtimeContext.eventEnvelope?runtimeContext.eventEnvelope:null;const normalizedReceipts=normalizeQl7SupportReceipts(receipts);const receipt=receiptFor(topic,normalizedReceipts)|| (eventEnvelope?normalizedReceipts.find((row)=>row.source==='support.event-source'):null);const resultKind=receipt?.resultKind||(eventEnvelope?'verified':((analysis.requiresAdapter||route.requiredAdapter)?'unavailable':'none'))
 const intentConfirmation=analysis.intentConfirmation||route.intentConfirmation||null;const safetyOwnsTurn=Boolean(safety?.category&&safety.category!=='none');const noNewFact=act==='denial'&&Boolean(ql7Str(analysis.currentQuestionCode||route.currentQuestionCode||conversationState.waitingFor)||['collecting','exhausted'].includes(ql7Str(intentConfirmation?.state)))&&!hasMaterialEntity(analysis.entities||{});const confirmationPending=['collecting','exhausted'].includes(ql7Str(intentConfirmation?.state))&&!safetyOwnsTurn&&act!=='emotional_support'&&!noNewFact;const relationshipIntent=relationshipPlan({analysis,topic,act,conversationState});const supportiveBoundary=act==='emotional_support'&&Number(conversationState?.social?.supportiveTurns||0)>=3;const securityOperatorRequired=analysis.scamCrimeSignal===true&&topic==='security'&&act==='incident_report';const noiseInput=act==='spam_or_noise';const ambiguousInput=act==='ambiguous_request';const clarificationDomain=ql7Str(intentConfirmation?.slotValues?.domainId)||(ambiguousInput?clarificationDomainFor(analysis):'');const openCaseSelection=(['status_request','status_followup'].includes(act)||(act==='personal_status_request'&&topic==='support_system'))&&ql7Arr(runtimeContext.openCases).length>1;const materialHypotheses=ql7Arr(analysis.topicCandidates).filter((row)=>Number(row?.probability??row?.confidence??row?.score??0)>0);const modalityChoice=runtimeContext.interactionModality?.mode==='choice';const semanticChoice=analysis.needsChoice===true&&materialHypotheses.length>=2;const choiceSuppressedByPrimaryFlow=Boolean(relationshipIntent)||act==='emotional_support'||act==='event_notification'||safety?.operatorRequired===true||safety?.selfHarm===true||safety?.threat===true;const needsChoice=openCaseSelection||(!choiceSuppressedByPrimaryFlow&&(modalityChoice||semanticChoice));const candidateChoices=openCaseSelection?openCaseChoicePlan(locale,runtimeContext.openCases,runtimeContext.now,runtimeContext.timeZone):needsChoice?choicePlan(locale,topic,analysis,runtimeContext.now):null;const hasChoiceSurface=Boolean(candidateChoices&&ql7Arr(candidateChoices.options).length>=2);const surfaceKind=['entry_greeting','event_notification'].includes(act)?'event':safety?.threat||safety?.selfHarm||safety?.category==='direct_insult'?'safety':safety?.category==='insult_uncertain'?'choices':safety?.category==='insult_denied'?'compact':hasChoiceSurface?'choices':noiseInput||ambiguousInput||confirmationPending?'compact':noNewFact?'compact':relationshipIntent||securityOperatorRequired?'structured':receipt||!SOCIAL.has(act)?'structured':'compact'
 const semanticRole=roleFor({topic,act,safety,resultKind,operationId:ql7Str(analysis.intentConfirmation?.slotValues?.operationId)});const mood=moodFor({act,safety,resultKind});const severity=safety?.severity|| (resultKind==='inconsistent'?'warning':'normal')
 const verifiedFacts=receipt&&['verified','verified_empty'].includes(receipt.resultKind)?[{receiptId:receipt.id,topic,resultKind:receipt.resultKind,factId:eventEnvelope?.sourceReceipt?.receiptId||''}]:eventEnvelope?[{receiptId:eventEnvelope.sourceReceipt?.receiptId,topic,resultKind:'verified',factId:eventEnvelope.sourceReceipt?.receiptId}]:[]
 const unavailableFacts=receipt?.resultKind==='unavailable'||((analysis.requiresAdapter||route.requiredAdapter)&&!receipt)?[{topic,reason:'verified_source_unavailable'}]:[]
 const choices=candidateChoices
 const confirmationSlot=ql7Arr(intentConfirmation?.missingSlots)[0]||(!intentConfirmation?.explicitRequestEvidence?'operationId':'');const waitingFor=relationshipIntent?.stage==='collect_brief'?'business_brief':relationshipIntent?.stage==='collect_contact'?'contact_or_dm_confirmation':choices?'signed_choice':ambiguousInput?`clarification:${clarificationDomain}`:confirmationPending?`${intentConfirmation.receiptId}:${confirmationSlot||'semantic_evidence'}`:securityOperatorRequired?'operator_security_review':(noNewFact?ql7Str(analysis.currentQuestionCode||route.currentQuestionCode||conversationState.waitingFor):(act==='incident_report'&&!receipt?'one_material_detail':''))
 const operatorHandoff=safety?.operatorRequired?{required:true,reason:safety.category,status:'pending_commit'}:relationshipIntent?.operatorReportReady?{required:true,reason:relationshipIntent.reason,status:'ready_for_operator_report',contactStatus:relationshipIntent.contactStatus,stage:relationshipIntent.stage}:securityOperatorRequired?{required:true,reason:'security_fraud_crime_review',status:'ready_for_operator_report',stage:'security_review'}:null
 const quotaNeedsVip=topic==='exchange_ai'&&receipt?.result&&(receipt.result.quotaState==='exhausted'||receipt.result.canAnalyze===false)
 const contactQuestionnaire=relationshipIntent?buildQl7SupportContactQuestionnaire({locale,consentReceipt:analysis.contactConsentReceipt||null,previous:conversationState?.business?.questionnaire||{},input:{text:analysis.originalText||'',...(analysis.contactQuestionnaireInput||{})}}):null
 const entryEvent=act==='entry_greeting'&&runtimeContext.entryEvent?runtimeContext.entryEvent:null
 const eventPropositions=eventEnvelope?eventSemanticPropositions(eventEnvelope):[]
 const knowledgeSecondaries=KNOWLEDGE_ACTS.has(act)?[...(PRODUCT_KNOWLEDGE_SECONDARIES[topic]||[])]:[]
 const entrySecondaries=entryEvent&&ql7Str(entryEvent.activeTopic)?[ql7Str(entryEvent.activeTopic)]:[]
 const allowedSecondaryDomainIds=choices
  ? choices.options.map(row=>row.topic)
  : entryEvent
    ? entrySecondaries
    : [...new Set([...knowledgeSecondaries,...(quotaNeedsVip?['vip']:[])])]
 const plan={version:'15.1.0',topic,messageAct:act,socialAct:analysis.socialAct||'none',surfaceKind,mood,semanticRole,severity:eventEnvelope?.severity||severity,maxGraphemes:eventEnvelope?Math.min(4000,Number(eventEnvelope?.maxGraphemes||2000)):4000,receipt,resultKind,factProjection,noNewFact,responseCode:eventEnvelope?`event:${eventEnvelope.type}`:entryEvent?`entry_greeting:${ql7Str(entryEvent.entryMode)||'fresh'}`:openCaseSelection?'open_cases:selection':runtimeContext.runtimeCapability?`runtime_status:${runtimeContext.runtimeCapability.capabilityId||topic}:${runtimeContext.runtimeCapability.status||'unknown'}`:confirmationPending?`intent_confirmation:${intentConfirmation.state}:${confirmationSlot||'semantic_evidence'}`:noNewFact?`no_new_fact:${topic}`:'',confirmedFacts:verifiedFacts,unavailableFacts,choices,openCaseSelection,runtimeCapability:runtimeContext.runtimeCapability||null,entryEvent,eventEnvelope,intentConfirmation,confirmationPending,confirmationSlot,allowedSecondaryDomainIds,clarificationDomain,clarificationDecision:analysis.clarificationDecision||null,generalTopic:analysis.generalTopic||null,humanConversationCell:analysis.humanConversationCell||null,languageVariantProfile:analysis.languageVariantProfile||null,openHumanRoute:analysis.openHumanRoute||null,publicFigureQuestionKind:analysis.publicFigureQuestionKind||'',publicFigureSourceResolution:analysis.publicFigureSourceResolution||null,publicFigureFactProjection:analysis.publicFigureFactProjection||null,publicFigureFactSourceReceipt:analysis.publicFigureFactSourceReceipt||null,humorSafety:analysis.humorSafety||null,humorMechanismPlan:analysis.humorMechanismPlan||null,ecosystemAttackAssessment:analysis.ecosystemAttackAssessment||null,illicitAssetRouteAssessment:analysis.illicitAssetRouteAssessment||null,primaryMicrotopicId:eventEnvelope?.primaryMicrotopicId||(analysis.generalTopic?.nodeId?`general.${analysis.generalTopic.nodeId}`:''),relationshipIntent,contactQuestionnaire,supportiveBoundary,marketIntent:analysis.marketIntent||'',marketSignals:analysis.marketSignals||null,academyKnowledgeReceipt:analysis.academyKnowledgeReceipt||null,interactionModality:runtimeContext.interactionModality||null,contactRequest:relationshipIntent?.contactPromptRequired?{requested:true,allowDmOnly:true,channels:['email','telegram','phone','dm']}:null,safetyBoundary:safety?.category&&safety?.category!=='none'?{category:safety.category,level:safety.escalationLevel,cooldownMs:safety.cooldownMs,blockedUntil:safety.blockedUntil,assessment:safety.insultAssessment,state:safety.insultState}:null,operatorHandoff,nextAction:waitingFor?{type:waitingFor}:null,waitingFor,closureState:CLOSURE.has(act)?'closed':'open',forbiddenPropositions:['expected_vs_actual_unless_ui_comparison','internal_classifier','internal_route','fake_verified','duplicate_title_body','duplicate_status_badge'],seed:ql7StableHash(`${seed}:${topic}:${act}:${resultKind}:${noNewFact?'no-new-fact':'normal'}:${relationshipIntent?.stage||'no-relationship'}:${supportiveBoundary?'social-boundary':'regular'}:${securityOperatorRequired?'security-review':'regular'}:${intentConfirmation?.receiptHash||'no-confirmation'}`),propositions:[`topic:${topic}`,`act:${act}`,`result:${resultKind}`,...eventPropositions,entryEvent?`entry:${ql7Str(entryEvent.entryMode)||'fresh'}`:'',openCaseSelection?'open-cases:selection':'',runtimeContext.runtimeCapability?`runtime-capability:${runtimeContext.runtimeCapability.capabilityId||topic}`:'',intentConfirmation?`intent-confirmation:${intentConfirmation.state}:${intentConfirmation.receiptId}`:'',analysis.generalTopic?.nodeId?`general:${analysis.generalTopic.nodeId}`:'',analysis.openHumanRoute?`open-human:${analysis.openHumanRoute.topicId}`:'',analysis.humanConversationCell?`human-cell:${analysis.humanConversationCell.cellId}`:'',analysis.publicFigureQuestionKind?`public-figure-question:${analysis.publicFigureQuestionKind}`:'',analysis.publicFigureFactProjection?.facts?.length?`public-figure-facts:${analysis.publicFigureFactProjection.projectionHash}`:'',analysis.humorMechanismPlan?`humor-mechanism:${analysis.humorMechanismPlan.mechanismId}`:'',analysis.ecosystemAttackAssessment?.operational?'security:ecosystem-attack-assessment':'',analysis.illicitAssetRouteAssessment?.decision==='deny_operational_guidance'?'security:illicit-asset-route-assessment':'',clarificationDomain?`clarification:${clarificationDomain}`:'',relationshipIntent?`relationship:${relationshipIntent.stage}`:'',securityOperatorRequired?'security:fraud_crime_operator_review':'',supportiveBoundary?'social:bounded_return_to_support':'',quotaNeedsVip?'quota:vip-activation-allowed':'',noNewFact?'dialogue:no_new_fact':'',safety?.category?`safety:${safety.category}`:''].filter(Boolean)}
 return Object.freeze(plan)
}
