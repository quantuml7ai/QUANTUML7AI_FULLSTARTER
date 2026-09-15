import {ql7StableHash, ql7Str} from '../internal/text.js'
import {collectQl7SafetySignals} from '../language/semanticBanks.js'
import {assessQl7SupportInsult} from './insultAssessment.js'
import {resolveQl7SupportInsultState} from './insultStateMachine.js'
import {assessQl7SupportCrisis} from './crisisAssessment.js'
import {evaluateQl7SharedSemanticSafety} from './sharedSemanticEvidence.js'
const QUOTE=/^(?:>|“|"|«)|(?:он|она|они|they|he|she)\s+(?:сказал|сказала|said)|(?:цитат\p{L}*|quote|lyrics|песня|film|movie)/iu
const DIRECT_INSULT=/(?:ты|вы|ти|ви|you|u|eres|usted|ustedes|sen|siz|أنت|انتم|你|您|אתה|אתם).{0,24}(?:идиот|ідіот|дебил|дебіл|туп(?:ой|ые|ий|і)|мудак|moron|idiot|stupid|fuck\s*you|imbécil|idiota|estúpido|aptal|salak|غبي|أحمق|白痴|蠢|מטומטם|אידיוט)|^(?:идиоты|ідіоти|дебилы|дебіли|мудаки|уроды|morons?|idiots?|idiotas?|aptallar|حمقى|白痴|מטומטמים)[!?.\s]*$/iu
const PRODUCT_FRUSTRATION=/(?:сервис|сайт|приложение|система|функция|app|service|site|system).{0,24}(?:бесит|достал|дерьмо|ужас|sucks|broken|terrible|shit)/iu
const IMMEDIATE_DANGER=/(?:теракт|бомба|massacre|terror(?:ist)?\s+attack|ataque\s+terrorista|terör\s+saldırısı|هجوم\s+إرهابي|恐怖袭击|פיגוע|bomb\s+threat)/iu
const THREAT_INTENT_MARKERS_BY_LOCALE=Object.freeze({
 en:['i','we','i will','we will'],ru:['я','мы','собираюсь','намерен'],uk:['я','ми','збираюся','маю намір'],es:['yo','nosotros','voy a','vamos a'],tr:['ben','biz','saldıracağım','öldüreceğim'],ar:['انا','أنا','نحن','سأ','سوف'],zh:['我','我们','我要','我会'],he:['אני','אנחנו','אתקוף','אפרוץ','אהרוג','אשמיד'],
 de:['ich','wir'],fr:['je','nous'],it:['io','noi','attaccherò'],pt:['eu','nós','nos','vou','vamos'],pl:['ja','my','zaatakuję'],nl:['ik','wij','we'],sv:['jag','vi'],no:['jeg','vi'],da:['jeg','vi'],fi:['minä','me','hyökkään'],
 cs:['já','my','zaútočím'],sk:['ja','my','zaútočím'],hu:['én','mi','megtámadom'],ro:['eu','noi','voi ataca'],bg:['аз','ние','ще'],sr:['ja','mi','napadnuću'],hr:['ja','mi','napast ću'],sl:['jaz','mi','napadel bom'],el:['εγώ','εμείς','θα'],ka:['მე','ჩვენ','შევუტევ'],az:['mən','biz','edəcəyəm'],kk:['мен','біз','жасаймын'],ja:['私','僕','俺','私たち','システムを攻撃する'],ko:['나','저','우리','공격하겠다'],
})
const STRONG_THREAT_DENIAL_BY_LOCALE=Object.freeze({
 en:['not you','not directed at you'],ru:['не тебя','не в твой адрес'],uk:['не тебе','не на твою адресу'],es:['no era para ti','no iba dirigido a ti'],tr:['sana demedim'],ar:['لم أقصدك'],zh:['不是对你说的','不是针对你'],he:['לא התכוונתי אליך'],
 de:['nicht gegen dich','nicht an dich gerichtet'],fr:['pas contre toi','pas pour toi'],it:['non era rivolto a te'],pt:['não era para você'],pl:['nie do ciebie'],nl:['niet tegen jou'],sv:['inte till dig','jag menade inte dig'],no:['ikke til deg'],da:['ikke til dig'],fi:['ei sinulle'],
 cs:['nebylo to na tebe'],sk:['nebolo to na teba'],hu:['nem neked szólt'],ro:['nu era pentru tine'],bg:['не беше към теб'],sr:['nije bilo tebi'],hr:['nije bilo tebi'],sl:['ni bilo namenjeno tebi'],el:['δεν ήταν για σένα'],ka:['შენთვის არ მითქვამს'],az:['sənə demədim'],kk:['саған айтпадым'],ja:['あなたに言ったのではない'],ko:['당신에게 한 말이 아닙니다'],
})
const UNIVERSAL_CODE_SWITCH_INTENT=/(?:^|[^\p{L}\p{N}_])(?:i\s+(?:will|am\s+going\s+to|plan\s+to|want\s+to)|we\s+(?:will|are\s+going\s+to|plan\s+to|want\s+to))(?=$|[^\p{L}\p{N}_])/iu
function rx(v=''){return String(v).replace(/[\\^$.*+?()[\]{}|]/g,'\\$&')}
function containsIntentMarker(source='',locale='en'){
 const lang=ql7Str(locale).toLowerCase().split(/[-_]/u)[0]||'en'
 if(UNIVERSAL_CODE_SWITCH_INTENT.test(source))return true
 for(const marker of THREAT_INTENT_MARKERS_BY_LOCALE[lang]||[]){
  if(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Georgian}]/u.test(marker)){if(source.includes(marker))return true;continue}
  if(new RegExp(`(?:^|[^\\p{L}\\p{N}_])${rx(marker)}(?=$|[^\\p{L}\\p{N}_])`,'iu').test(source))return true
 }
 return false
}

function hasStrongThreatDenial(source='',locale='en'){
 const lang=ql7Str(locale).toLowerCase().split(/[-_]/u)[0]||'en'
 const folded=source.toLowerCase().normalize('NFKC')
 return (STRONG_THREAT_DENIAL_BY_LOCALE[lang]||[]).some((phrase)=>folded.includes(String(phrase).toLowerCase().normalize('NFKC')))
}
const BENIGN_THREAT_CONTEXT=/(?:кто\s+так(?:ой|ая)|расскажи\s+(?:о|про)|что\s+такое|истори[яи]|биограф|учеб|образоват|новост|цитат|фильм|книг|документаль|public\s+figure|who\s+is|tell\s+me\s+about|what\s+is|history\s+of|educational|news\s+about|elon\s+musk|илон\s+маск)/iu
const SUPPORT_TARGET=/(?:^|[^\p{L}\p{N}_])(?:ты|вы|тебя|вам|support|саппорт|оператор|bot|бот|you|your|u|du|dich|dir|euch|tu|usted|sen|siz|أنت|انتم|你|您|אתה|אתם)(?=$|[^\p{L}\p{N}_])/iu
function safetyNowMs(now=Date.now){
 const raw=typeof now==='function'?now():now
 const parsed=typeof raw==='number'?raw:Date.parse(ql7Str(raw))
 return Number.isFinite(parsed)?parsed:Date.now()
}
export function evaluateQl7SupportSafety({text='',priorConversationState={},now=Date.now,locale=''}={}){
 const source=ql7Str(text);const sharedSemanticEvidence=evaluateQl7SharedSemanticSafety(source,{locale:locale||'en'});const bank=collectQl7SafetySignals(source,locale);const rawInsultAssessment=assessQl7SupportInsult({text:source,locale,priorConversationState});const quoted=sharedSemanticEvidence.safeContext||QUOTE.test(source)||(rawInsultAssessment?.matches?.quotes||[]).length>0;const benignThreatContext=BENIGN_THREAT_CONTEXT.test(source)||sharedSemanticEvidence.safeContext;const obfuscatedThreatHits=rawInsultAssessment?.matches?.threats||[];const sharedThreatClass=['credible_threat','credible_personal_threat'].includes(sharedSemanticEvidence.semanticClass);const sharedSevere=sharedSemanticEvidence.risk==='severe'&&!sharedSemanticEvidence.safeContext;const sharedTargeted=sharedSemanticEvidence.target?.kind==='specific_or_ecosystem';const sharedCommitment=sharedSemanticEvidence.intent?.kind==='commitment';const lexicalThreat=bank.threats.length>0||obfuscatedThreatHits.length>0||sharedThreatClass;const threatIntent=containsIntentMarker(source,locale)||sharedCommitment;const threatDenied=hasStrongThreatDenial(source,locale)||sharedSemanticEvidence.contextRole==='denial';const immediateDanger=IMMEDIATE_DANGER.test(source)||(sharedThreatClass&&sharedTargeted&&sharedCommitment);const threat=!quoted&&!benignThreatContext&&!threatDenied&&((lexicalThreat&&threatIntent)||immediateDanger);const crisisAssessment=assessQl7SupportCrisis({text:source,locale,priorConversationState,context:{quoted,quoteScope:quoted,reportedSpeech:quoted}});const selfHarm=!quoted&&crisisAssessment.selfHarm;const frustration=PRODUCT_FRUSTRATION.test(source);let insultAssessment=quoted?Object.freeze({...rawInsultAssessment,score:Math.min(.2,Number(rawInsultAssessment.score||0)),decision:'none',target:'third_party',counterEvidence:Object.freeze(Array.from(new Set([...(rawInsultAssessment.counterEvidence||[]),'quoted_or_reported'])))}):rawInsultAssessment;if(!quoted&&sharedSemanticEvidence.semanticClass==='direct_insult'&&!['confirmed','continued'].includes(insultAssessment?.decision)){insultAssessment=Object.freeze({...rawInsultAssessment,score:Math.max(.9,Number(rawInsultAssessment?.score||0)),decision:'confirmed',target:'direct',evidence:Object.freeze([...(rawInsultAssessment?.evidence||[]),'shared_semantic_evidence'])})};const insultState=resolveQl7SupportInsultState({assessment:insultAssessment,priorConversationState,now:new Date(safetyNowMs(now)).toISOString()});const prior=Number(priorConversationState?.safety?.confirmedDirectInsultCount??priorConversationState?.safety?.directInsultCount??priorConversationState?.safetyStrikeCount??0)
 let category='none',severity='normal',escalationLevel=0,cooldownMs=0,operatorRequired=false
 if(selfHarm){category='crisis';severity='critical';escalationLevel=5;operatorRequired=true}
 else if(threat){category='credible_threat';severity='critical';escalationLevel=5;cooldownMs=30*60*1000;operatorRequired=true}
 else if(insultAssessment.decision==='uncertain'){category='insult_uncertain';severity='normal';escalationLevel=prior}
 else if(insultAssessment.decision==='denied'){category='insult_denied';severity='normal';escalationLevel=prior}
 else if(['confirmed','continued'].includes(insultAssessment.decision)){category='direct_insult';escalationLevel=prior+1;severity=escalationLevel===1?'warning':'elevated';cooldownMs=escalationLevel===1?0:escalationLevel===2?60*1000:escalationLevel===3?5*60*1000:15*60*1000;operatorRequired=escalationLevel>=4}
 else if(frustration){category='product_frustration';severity='normal'}
 const current=safetyNowMs(now);const blockedUntil=cooldownMs?new Date(current+cooldownMs).toISOString():''
 return Object.freeze({category,severity,escalationLevel,cooldownMs,blockedUntil,operatorRequired,quoted,benignThreatContext,threatIntent,threatDenied,immediateDanger:immediateDanger||crisisAssessment.immediateDanger,frustration,insult:category==='direct_insult',threat,selfHarm,crisisAssessment,inputMustRemainWritable:crisisAssessment.inputMustRemainWritable!==false,insultAssessment,insultState,sharedSemanticEvidence,semanticConfidence:sharedSemanticEvidence.semanticConfidence,coverageConfidence:sharedSemanticEvidence.coverageConfidence,policyConfidence:sharedSemanticEvidence.policyConfidence,profanityHits:Object.freeze([...bank.profanity,...bank.euphemisms].slice(0,16)),threatHits:Object.freeze(threat?[...bank.threats,...obfuscatedThreatHits,...sharedSemanticEvidence.conceptCandidates.map(x=>x.conceptId)].slice(0,16):[]),matchedSpanHash:category==='none'?'':ql7StableHash(source.toLowerCase()),allowMaterialHelp:!threat&&!selfHarm})
}
