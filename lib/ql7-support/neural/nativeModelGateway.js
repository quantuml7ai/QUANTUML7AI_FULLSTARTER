import crypto from 'node:crypto'
import {loadQl7NativeModelManifest,assertQl7NativeEndpoint} from './modelManifest.js'
import {createQl7NativeModelReceipt} from './modelReceipt.js'
import {normalizeQl7SemanticFrame} from './semanticFrameSchema.js'
import {normalizeQl7SafetyFrame} from './safetyFrameSchema.js'
import {normalizeQl7NormalizationLattice} from './normalizationLatticeSchema.js'
import {ql7Str} from '../internal/text.js'
export const QL7_NATIVE_MODEL_GATEWAY_VERSION='1.0.0'
const LOCALES=new Set('en ru uk es tr ar zh he de fr it pt pl nl sv no da fi cs sk hu ro bg sr hr sl el ka az kk ja ko'.split(' '))
function locale(v=''){const x=String(v||'und').toLowerCase().split(/[-_]/)[0];return LOCALES.has(x)?x:'und'}
function normalizeText(v=''){return String(v||'').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/gu,'').replace(/\s+/gu,' ').trim()}
function bootstrapUnderstand(input,manifest){const text=normalizeText(input.text),lc=text.toLowerCase(),loc=locale(input.locale);let messageAct='informational_question',goal='explain_overview',topicId='support_system',openTopicClass='',uncertainty=.35
 if(!text){messageAct='spam_or_noise';goal='unknown';uncertainty=.8}
 else if(/^(привет|hello|hi|hola|merhaba|привіт|你好|こんにちは|안녕)/iu.test(text)){messageAct='greeting';goal='social_connection';uncertainty=.08}
 else if(/[?？]$/u.test(text)||/^(что|кто|как|почему|where|what|who|how|why|qué|cómo|wer|wie)\b/iu.test(text)){messageAct='general_knowledge_question';goal='explain_overview';openTopicClass='open_subject';uncertainty=.28}
 const frame=normalizeQl7SemanticFrame({locale:loc,messageAct,userGoal:goal,topicsTopK:[{topicId,probability:1-uncertainty}],oodScore:openTopicClass?.25:.1,uncertainty,evidenceSpans:text?[text.slice(0,120)]:[]})
 const h={topicId,openTopicClass,subject:openTopicClass?text.slice(0,120):'',messageAct,goalId:goal,confidence:Number((1-uncertainty).toFixed(4)),evidenceSpans:text?[text.slice(0,120)]:[],counterEvidenceCodes:uncertainty>.6?['open-set-unknown']:[]}
 const normalization=normalizeQl7NormalizationLattice({candidates:[{originalSpan:text,candidateText:text,transformType:'identity',probability:1,localeHypothesis:loc,protected:false,evidence:['bootstrap-identity'],provenance:'ql7-native-bootstrap'}]},input.text);return {schemaVersion:'2.0.0',detectedLocale:loc,normalization,hypotheses:[h],dialoguePlan:{responseMode:uncertainty>.68?'clarify':'direct_answer',stance:'warm',detailLevel:'standard'},semanticFrame:frame}
}
function sha256(value=''){return crypto.createHash('sha256').update(String(value)).digest('hex')}
function receipt(role,manifest,input,output,start){return createQl7NativeModelReceipt({modelRole:role,releaseId:manifest.releaseId,modelArtifactHash:manifest[role]?.sha256||'',tokenizerHash:manifest.tokenizer?.sha256||'',requestHash:sha256(JSON.stringify(input)),inputLocale:locale(input.locale),latencyMs:Date.now()-start,hardwareClass:'bootstrap-js',determinismMode:'deterministic',calibrationId:manifest.calibrationArtifactHash,outputHash:sha256(JSON.stringify(output)),status:'ok',promotionStatus:manifest.promotionStatus})}
async function localRpc(method,input,manifest,{fetchImpl=fetch,timeoutMs=4000}={}){assertQl7NativeEndpoint(manifest.endpoint);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{const r=await fetchImpl(`${manifest.endpoint.replace(/\/$/,'')}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input),signal:controller.signal,cache:'no-store'});if(!r.ok)throw new Error(`native_model_http_${r.status}`);return await r.json()}finally{clearTimeout(timer)}}
export function getQl7NativeModelConfig(){const m=loadQl7NativeModelManifest();return Object.freeze({mode:m.promotionStatus==='PRODUCTION_PROMOTED'?'production':'bootstrap',providerId:'ql7-native',model:m.releaseId,promotionStatus:m.promotionStatus,manifestHash:m.manifestHash})}
export async function requestQl7NativeModel(method,input={},options={}){const manifest=options.manifest||loadQl7NativeModelManifest();const start=Date.now();let output
 if(manifest.runtimeMode==='in_process_bootstrap'){if(method==='understand')output=bootstrapUnderstand(input,manifest);else if(method==='safety')output=normalizeQl7SafetyFrame({uncertainty:.75,evidenceSpans:[]});else if(method==='translate')return {status:'unavailable',errorCode:'bootstrap_translation_not_proven',config:getQl7NativeModelConfig(),latencyMs:Date.now()-start};else if(method==='generate')return {status:'unavailable',errorCode:'bootstrap_generation_not_proven',config:getQl7NativeModelConfig(),latencyMs:Date.now()-start};else output={ok:true}}
 else output=await localRpc(method,input,manifest,options)
 const modelRole=method==='understand'?'understanding':method==='generate'?'generator':method==='safety'?'understanding':method==='critique'?'critic':'understanding';return {status:'ok',output,receipt:receipt(modelRole,manifest,input,output,start),config:getQl7NativeModelConfig(),latencyMs:Date.now()-start}}
export async function requestQl7NativeUnderstanding(input,options={}){return requestQl7NativeModel('understand',input,options)}
export async function requestQl7NativeTranslation(input,options={}){return requestQl7NativeModel('translate',input,options)}
export async function requestQl7NativeGeneration(input,options={}){return requestQl7NativeModel('generate',input,options)}
export async function requestQl7NativeCritique(input,options={}){return requestQl7NativeModel('critique',input,options)}
export function assertQl7ProductionPromotedNativeModel(){return loadQl7NativeModelManifest({verifyArtifacts:true,requirePromoted:true})}
