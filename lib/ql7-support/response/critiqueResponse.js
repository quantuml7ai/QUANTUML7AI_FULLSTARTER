import {ql7CountGraphemes, ql7Locale, ql7Sentences, ql7StableHash, ql7Str} from '../internal/text.js'
import {hasVerifiedQl7SupportReceipt} from '../data/adapterReceipt.js'

const MACHINE=/(?:я определил(?:а)? тему|маршрут помощи|семантическ(?:ий|ого) сигнал|privacy-safe|classifier|adapter receipt|operator states|текущий контекст сессии)/iu
export const QL7_SUPPORT_RESPONSE_CRITIC_VERSION='13.0.0'
export const QL7_SUPPORT_MACHINE_PHRASES=Object.freeze([
  /(?:the useful part is|here is the useful answer|the practical answer is|what matters now|i read the main topic as|no cold script|user goal ahead|strategic signal|generic ticket|privacy-safe facts|i use it to choose|the answer can be warm and still precise|you do not need perfect wording; i can work with slang)/iu,
  /(?:полезная часть здесь|вот полезный ответ|я определил\w*\s+тему|никакого холодного скрипта|стратегическ\w+\s+сигнал|безопасн\w+\s+для приватности факт|я использую это, чтобы выбрать|ответ может быть т[её]плым и точным|я умею работать со сленгом)/iu,
  /\b(?:route|oracle|adapter|classifier|pipeline|confidence|stage flag|collection name)\b/iu,
])
const canonical_FORBIDDEN=Object.freeze([
  ['raw_id_request',/(?:пришл|укаж|назов|send|provide|enter).{0,70}(?:wallet|account|user|post|campaign|invoice|order)?\s*(?:id|айди|идентификатор)/iu,'critical'],
  ['screenshot_request',/(?:прикреп|пришл|загруз).{0,40}(?:скриншот|экран|видео)|(?:attach|send|upload).{0,40}(?:screenshot|screen|video)/iu,'high'],
  ['secret_request',/(?:seed phrase|private key|session token|cookie|сид[-\s]?фраз|приватн\w+\s+ключ|токен\s+сессии)/iu,'critical'],
])
function norm(v=''){return ql7Str(v).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()}
function hasAdjacentRepeatedPhrase(v=''){const tokens=ql7Str(v).toLowerCase().match(/[\p{L}\p{N}@._+-]+/gu)||[];for(let width=3;width<=Math.min(10,Math.floor(tokens.length/2));width+=1){for(let index=0;index+width*2<=tokens.length;index+=1){if(tokens.slice(index,index+width).join(' ' )===tokens.slice(index+width,index+width*2).join(' '))return true}}return false}
function normalizedSentence(s){return norm(s)}
export function critiqueQl7SupportResponse({text='',card=null,surface=null,locale='en',plan={},receipts=[],expectedLocale=''}={}){
 const value=ql7Str(text);const lang=ql7Locale(locale);const issues=[];const graphemes=ql7CountGraphemes(value,lang);if(!value)issues.push('empty_text');if(graphemes>400)issues.push('text_over_400_graphemes');if(MACHINE.test(value))issues.push('machine_language')
 const sentences=ql7Sentences(value);if(new Set(sentences.map(norm)).size!==sentences.length)issues.push('duplicate_sentences')
 const view=surface||card||{};const title=norm(view.title);const summary=norm(view.summary);const body=norm(value);if(title&&title===body)issues.push('title_duplicates_body');if(summary&&title&&summary===title)issues.push('summary_duplicates_title')
 const badges=Array.isArray(view.badges)?view.badges:[];const verified=badges.filter(b=>/verified|confirmed|подтверж/iu.test(`${b?.id||''} ${b?.label||''}`));if(verified.length>1)issues.push('duplicate_verified_badge')
 const checkedAt=ql7Str(view.checkedAt);const verifiedReceipt=(Array.isArray(receipts)?receipts:[]).some(r=>r?.executed===true&&Number(r?.writeCount||0)===0&&['verified','verified_empty'].includes(r?.resultKind));if(checkedAt&&!verifiedReceipt)issues.push('false_checked_at')
 if(plan?.resultKind==='unavailable'&&checkedAt)issues.push('unavailable_has_checked_at');if(plan?.topic==='qcoin'&&Array.isArray(view.tables)&&view.tables.some(t=>/ads/i.test(t?.schema||t?.id||'')))issues.push('wrong_domain_table')

 const fact=plan?.factProjection||view?.factProjection;const tableRows=(view?.tables||[]).flatMap(t=>t?.rows||[]);if(fact?.topic==='vip'&&fact.verified){const statusRow=tableRows.find(r=>r?.key==='status');const tableStatus=ql7Str(statusRow?.value).toLowerCase();const textActive=/(?:status is active|статус актив|estado vip está activo|vip durumu aktif|حالة vip نشطة|vip 状态为有效|מצב vip פעיל)/iu.test(value);if(tableStatus&&fact.status&&tableStatus!==fact.status)issues.push('verified_fact_text_table_mismatch');if(fact.status!=='active'&&textActive)issues.push('verified_fact_text_table_mismatch')}
 const clauses=value.split(/[.;。！？!?]+/u).map(norm).filter(Boolean);if(new Set(clauses).size!==clauses.length||hasAdjacentRepeatedPhrase(value))issues.push('provider_fragment_duplicate');if(plan?.safetyBoundary?.category==='credible_threat'&&/(?:insult|оскорб|руг|hakaret|إساءة|辱骂|עלבון)/iu.test(value))issues.push('threat_copy_contamination')
 if(expectedLocale&&ql7Locale(expectedLocale)!==lang)issues.push('locale_mismatch');if(!view?.primarySvg?.assetId&&view?.schema==='ql7.support.surface')issues.push('missing_svg_asset')
 return Object.freeze({version:'14.2.1',ok:issues.length===0,issues:Object.freeze(issues),graphemes,locale:lang,responseHash:ql7StableHash(value.toLowerCase()),rewriteAllowed:issues.length>0})
}
