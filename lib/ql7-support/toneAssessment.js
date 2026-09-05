import sharedSafety from './safety/sharedSemanticEvidence.cjs'
import {QL7_SUPPORT_PROFANITY_BANK_BY_LOCALE} from './language/semanticBanks.js'

// Tone projection is deliberately NOT a safety classifier. Severe/risk semantics
// come only from the canonical shared semantic-safety owner used by Support and
// Composer. This module adds conversational style evidence (profanity, target,
// frustration, spam/noise) without overriding the canonical safety receipt.
const LANGUAGE_LEXICONS = Object.freeze({
  ...QL7_SUPPORT_PROFANITY_BANK_BY_LOCALE,
  kn: Object.freeze(['ಮೂರ್ಖ', 'ಕೆಟ್ಟ', 'ನಿಂದನೆ']),
})
const HELP=/(?:помог|помож|помоч|help|fix|исправ|почин|реши|не\s+работает|не\s+працює|cómo|ayuda|yardım|çalışmıyor|hilf|helfen|funktioniert\s+nicht|ساعد|لا\s+يعمل|帮助|坏了|修复|תעזור|עזרה|לא\s+עובד|תקן)/iu
const SUPPORT_DIRECTED=/(?:^|[^\p{L}\p{N}_])(?:ты|тебя|тебе|вас|вам|support|саппорт|оператор|you|your|tu|usted|du|dich|dir|ihr|euch|sen|siz|أنت|انتم|你|你们|אתה|את|אתם|תמיכה)(?=$|[^\p{L}\p{N}_])/iu
const OTHER_USER=/(?:пользователь|юзер|автор|он|она|user|member|author|él|ella|kullanıcı|مستخدم|用户|משתמש|מחבר)/iu
const SYSTEM_TARGET=/(?:сайт|система|приложение|функция|кнопка|сервер|service|system|app|website|feature|button|server|sistema|seite|anwendung|uygulama|النظام|التطبيق|系统|应用|מערכת|אפליקציה)/iu
const SELF_REFERENCE=/(?:сам\s+себя|про\s+себя|я\s+(?:идиот|тупой)|i(?:'m|\s+am)\s+(?:an?\s+)?(?:idiot|stupid)|soy\s+(?:idiota|tonto)|ben\s+aptalım|أنا\s+غبي|我是傻瓜|אני\s+(?:טיפש|מטומטם))/iu
const JOKE=/(?:шутк|сарказм|лол|ахах|joke|kidding|lol|broma|şaka|مزح|开玩笑|צוחק|בדיחה)/iu
const SPAM_CHARS=/(.)\1{7,}/iu
const DIRECT_DISMISSAL=/(?:иди|пош[её]л|пошла)\s+(?:ты\s+)?нахуй|fuck\s+off|go\s+to\s+hell|verpiss\s+dich|fick\s+dich|vete\s+a\s+la\s+mierda|siktir\s+git|اذهب\s+إلى\s+الجحيم|滚开|לך\s+לעזאזל/iu

const str=v=>String(v??'').trim()
function normalize(value){return str(value).normalize('NFKC').toLowerCase().replace(/[0@]/g,c=>c==='0'?'о':'а').replace(/[1!|]/g,'i').replace(/[3]/g,'е').replace(/[4]/g,'ч').replace(/[5$]/g,'s').replace(/[7]/g,'т').replace(/[._*\-]{1,3}/g,'').replace(/(.)\1{3,}/gu,'$1$1')}
const unique=a=>Array.from(new Set((a||[]).filter(Boolean)))
const CACHE=new WeakMap()
function index(words=[]){if(CACHE.has(words))return CACHE.get(words);const tokens=new Map(),phrases=[];for(const word of words){const n=normalize(word);if(!n)continue;if(n.includes(' '))phrases.push([n,word]);else{const a=tokens.get(n)||[];a.push(word);tokens.set(n,a)}}const x={tokens,phrases};CACHE.set(words,x);return x}
function findLexiconHits(source,language){const n=normalize(source),set=new Set(n.split(/[^\p{L}\p{N}]+/u).filter(Boolean));const primary=language&&LANGUAGE_LEXICONS[language]?LANGUAGE_LEXICONS[language]:[];const banks=primary.length?[primary,LANGUAGE_LEXICONS.en,...Object.values(LANGUAGE_LEXICONS).filter(x=>x!==primary&&x!==LANGUAGE_LEXICONS.en)]:Object.values(LANGUAGE_LEXICONS);const hits=[];for(const words of banks){const ix=index(words);for(const token of set)for(const w of ix.tokens.get(token)||[])hits.push(w);for(const [needle,w] of ix.phrases)if(n.includes(needle))hits.push(w)}return unique(hits)}
function severityFor(category,count){if(['credible_threat','dangerous_operational_intent','violence_incitement','terrorism_operational_intent','murder_or_mass_harm_intent'].includes(category))return'critical';if(['harassment','bullying','degrading_hate_like_language','sexual_violence_context'].includes(category))return'high';if(['insult_to_user','insult_to_support','direct_insult'].includes(category))return count>2?'medium':'low';if(category==='frustration_at_system'||category==='spam_noise')return'low';return'none'}

export function assessQl7SupportTone({text='',language='',translatedText='',canonicalText='',semanticSafety=null}={}){
 const source=str(text),translated=str(translatedText||canonicalText),canonical=[source,translated].filter(Boolean).join('\n')
 const shared=semanticSafety&&semanticSafety.schema==='ql7.support.shared-semantic-safety-frame'?semanticSafety:sharedSafety.evaluateQl7SharedSemanticSafety(canonical,{locale:language||'en'})
 const policy=sharedSafety.projectQl7SharedSafetyPolicy(shared)
 const hits=findLexiconHits(canonical,language)
 const asksForHelp=HELP.test(canonical),directedAtSupport=SUPPORT_DIRECTED.test(canonical)||DIRECT_DISMISSAL.test(canonical),directedAtUser=OTHER_USER.test(canonical),directedAtSystem=SYSTEM_TARGET.test(canonical)
 const words=normalize(source).split(/[^\p{L}\p{N}]+/u).filter(Boolean),repeated=words.length>=6&&new Set(words.slice(-6)).size===1,spamNoise=SPAM_CHARS.test(canonical)||repeated||(source.length>40&&new Set(source.replace(/\s/g,'')).size<=3)
 const profanityDetected=hits.length>0||DIRECT_DISMISSAL.test(canonical),jokeOrSelfReference=JOKE.test(canonical)||SELF_REFERENCE.test(canonical)
 const canonicalClass=str(shared.semanticClass),canonicalRisk=str(shared.risk),quotedContent=['quoted','reported','victim','news','education','fiction','denial','counter_speech'].includes(str(shared.contextRole))
 let taxonomyCategory='neutral'
 if(canonicalRisk==='severe')taxonomyCategory=canonicalClass||'risk_ambiguous'
 else if(spamNoise)taxonomyCategory='spam_noise'
 else if(quotedContent&&canonicalClass==='quoted_or_reported_harm')taxonomyCategory='quoted_or_reported_harm'
 else if(jokeOrSelfReference&&profanityDetected&&['neutral','direct_insult'].includes(canonicalClass))taxonomyCategory='joke_or_self_reference'
 else if(canonicalClass==='direct_insult'&&profanityDetected&&asksForHelp&&!directedAtSupport)taxonomyCategory='frustration_at_system'
 else if(profanityDetected&&directedAtSupport)taxonomyCategory='insult_to_support'
 else if(canonicalClass==='direct_insult'&&profanityDetected&&directedAtUser)taxonomyCategory='insult_to_user'
 else if(canonicalRisk==='moderate'||canonicalRisk==='uncertain')taxonomyCategory=canonicalClass||'risk_ambiguous'
 else if(profanityDetected&&(directedAtSystem||asksForHelp))taxonomyCategory='frustration_at_system'
 else if(profanityDetected)taxonomyCategory='profanity_context_unknown'
 const category=taxonomyCategory==='frustration_at_system'?'frustration_with_request':taxonomyCategory==='quoted_or_reported_harm'?'quoted_content':['credible_threat','credible_personal_threat'].includes(taxonomyCategory)?'threat':taxonomyCategory
 const safetyEscalation=policy.decision==='BLOCK'||canonicalRisk==='severe'
 const target=directedAtSupport?'support':directedAtUser?'other_user':directedAtSystem?'system':str(shared.target?.kind||'unknown')
 return Object.freeze({category,taxonomyCategory,severity:severityFor(taxonomyCategory,hits.length),target,profanityDetected,profanityCount:hits.length,profanityHits:hits.slice(0,12),threat:['credible_threat','credible_personal_threat'].includes(canonicalClass),harassment:['harassment','bullying'].includes(canonicalClass),sexualHarassment:canonicalClass==='sexual_harassment',hate:canonicalClass==='degrading_hate_like_language',quotedContent,jokeOrSelfReference,spamNoise,directedAtSupport,directedAtUser,directedAtSystem,asksForHelp,continueAssistance:policy.decision!=='BLOCK',safetyEscalation,moderationSuggested:safetyEscalation||['insult_to_user','harassment','bullying','degrading_hate_like_language'].includes(taxonomyCategory),emailMaterial:safetyEscalation,responsePolicy:taxonomyCategory==='frustration_at_system'?'acknowledge_frustration_then_one_diagnostic_step':taxonomyCategory==='insult_to_support'?(asksForHelp?'calm_boundary_then_continue_assistance':'calm_boundary_then_invite_concrete_request'):safetyEscalation?'safe_audit_and_human_escalation':spamNoise?'single_soft_warning_no_email_flood':quotedContent?'treat_as_evidence_not_user_intent':'normal_assistance',semanticSafetyReceiptHash:str(shared.provenanceHash||shared.originalHash),semanticSafetyClass:canonicalClass,semanticSafetyRisk:canonicalRisk})
}
export function listQl7SupportToneCategories(){return Object.freeze(['neutral','frustration_at_system','insult_to_support','insult_to_user','harassment','bullying','degrading_hate_like_language','credible_threat','dangerous_operational_intent','sexual_violence_context','quoted_or_reported_harm','joke_or_self_reference','spam_noise','profanity_context_unknown','risk_ambiguous','unknown_or_uncovered'])}
