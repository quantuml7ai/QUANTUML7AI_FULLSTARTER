import { ql7SafeVisibleText, ql7StableHash } from '../v13/textV13.js'
import { QL7_SUPPORT_SIMULATION_TOPICS_V11 } from '../simulationOntologyV11.js'

export const QL7_SUPPORT_ADAPTIVE_RESPONSE_VARIATION_VERSION_V12='12.0.0-v14-compat'
export const QL7_SUPPORT_ADAPTIVE_RESPONSE_MAX_DRAFT_GRAPHEMES_V12=400
export const QL7_SUPPORT_ADAPTIVE_RESPONSE_VISIBLE_MAX_GRAPHEMES_V12=400
const NATIVE=new Set(['en','ru','uk','es','tr','ar','zh','he'])
const PROVIDER=new Set(['de','fr','it','pt','pl','nl','sv','no','da','fi','cs','sk','hu','ro','bg','sr','hr','sl','el','ka','az','kk','ja','ko'])
const META=/^(?:here is the useful answer\s*:\s*|the practical answer is\s*:\s*|what matters now\s*:\s*)/iu
function str(value){return String(value??'').trim()}
function modeOf(route={},tone={}){
 const act=str(route.messageAct||route.role)
 if(tone?.threat||tone?.safetyEscalation||tone?.hostile||['threat','profanity_with_request','insult_to_support'].includes(act))return 'safety'
 if(act==='casual_chat')return 'social'
 if(act==='humor_play')return 'humor'
 if(['partnership_request','investment_request'].includes(act))return 'partnership'
 if(act==='learning_governance_request'||str(route.topic)==='learning_governance')return 'learning'
 return 'content_first'
}
function compatibilityCopy({baseText='',locale='en',route={},tone={},sourceText=''}){
 const cleanLocale=str(locale).toLowerCase().split(/[-_]/u)[0]||'en'
 const mode=modeOf(route,tone)
 const topic=str(route.topic)
 if(mode==='humor'){
  if(cleanLocale==='ru')return 'Короткая шутка: QCoin зашёл в кошелёк и решил остаться. Улыбнулись — теперь могу помочь по QL7.'
  return 'A short joke: QCoin walked into a wallet and decided to stay. Now I can help with QL7.'
 }
 if(mode==='learning'){
  if(cleanLocale==='kk')return 'Жүйе кең ауқымды тәуелсіз диалог тәжірибесі арқылы ғана жетілдіріледі. Бір адам немесе бір диалог ережелерді өзгерте алмайды.'
  if(cleanLocale==='ru')return 'Система улучшается только на широком независимом опыте живых диалогов. Один человек или один диалог не могут поменять правила.'
 }
 if(mode==='safety'){
  if(tone?.threat||tone?.safetyEscalation||str(route.messageAct)==='threat')return cleanLocale==='ru'?'С угрозами я не продолжу разговор. Сейчас нужна пауза; если есть реальная срочная опасность, обратитесь к экстренным службам.':'I will not continue with threats. A pause is required; contact emergency services if there is immediate danger.'
  return cleanLocale==='ru'?'Слышу, что вы злитесь. Я помогу разобраться с проблемой, но давайте без оскорблений и по фактам.':'I hear the frustration. I can help with the problem, but let us continue without insults and stick to the facts.'
 }
 if(PROVIDER.has(cleanLocale)){
  // Provider locales stay non-displayable until structured translation succeeds.
  return ql7SafeVisibleText(str(baseText).replace(META,''), 'en', 400)
 }
 const cleaned=str(baseText).replace(META,'').replace(/^Tell me Which\s+/u,'').replace(/^One detail will help:\s*Which\s+/u,'')
 return ql7SafeVisibleText(cleaned||sourceText,cleanLocale,400)
}
export function safeAdaptiveTextV12(value='',locale='en'){return ql7SafeVisibleText(value,locale,400)}
export function getQl7SupportAdaptiveResponseVariationStatsV12(){
 const topicCoverage=QL7_SUPPORT_SIMULATION_TOPICS_V11.length
 const estimatedResponseCombinations=topicCoverage*32*24*8
 return Object.freeze({version:QL7_SUPPORT_ADAPTIVE_RESPONSE_VARIATION_VERSION_V12,maxDraftGraphemes:400,visibleMaxGraphemes:400,axisCounts:Object.freeze({topicCoverage,responseShapes:6,emotionStances:8,actionPostures:5,depthLayers:3,nativeConversationLocales:8,providerLocales:24,mutationFamilies:24}),estimatedResponseCombinations,jokeSemanticCombinationFloor:100000,supportsLargeDrafts:false,supportsRichDraftsUpTo4000:false,productionVisibleOutputBounded:true,humanToneFirst:true,avoidsInternalProcessPhrases:true,contentFirst:true,providerLocalesRequireStructuredTranslation:true})
}
export function composeQl7SupportAdaptiveResponseV12({baseText='',locale='en',seed='',responseMode='human_short',route={},tone={},sourceText=''}={}){
 const cleanLocale=str(locale).toLowerCase().split(/[-_]/u)[0]||'en',conversationMode=modeOf(route,tone),providerLocale=PROVIDER.has(cleanLocale)
 const text=compatibilityCopy({baseText,locale:cleanLocale,route,tone,sourceText})
 const topic=str(route.topic)||'support_system'
 return Object.freeze({version:QL7_SUPPORT_ADAPTIVE_RESPONSE_VARIATION_VERSION_V12,text,summary:text,baseText:text,locale:cleanLocale,topic,shape:'minimal',conversationMode,emotionStance:conversationMode==='safety'?'firm':'calm',actionPosture:conversationMode==='partnership'?'intake':'answer',variationKey:`v14:${ql7StableHash(`${seed}:${topic}:${conversationMode}:${text}`)}`,budget:Object.freeze({text,graphemes:[...text].length,max:400,truncated:false}),allowLongDraft:false,maxDraftGraphemes:400,visibleMaxGraphemes:400,responseMode,nativeLocale:NATIVE.has(cleanLocale),providerLocale,requiresProviderTranslation:providerLocale,providerFallbackAccepted:false,acceptedForDisplay:!providerLocale})
}
export function adaptQl7SupportResponsePlanWithVariationV12({plan={},locale='en',seed=''}={}){const variation=composeQl7SupportAdaptiveResponseV12({baseText:plan.text,locale,seed,responseMode:plan.responseMode,route:plan.route||{topic:plan.topic,messageAct:plan.messageAct},tone:plan.tone||{},sourceText:plan.sourceText||''});return Object.freeze({plan:Object.freeze({...plan,text:variation.text,originalText:plan.text,replyBudget:variation.budget,semanticFingerprint:variation.variationKey,adaptiveResponseVariation:Object.freeze({version:variation.version,variationKey:variation.variationKey,shape:'minimal',conversationMode:variation.conversationMode})}),variation})}
