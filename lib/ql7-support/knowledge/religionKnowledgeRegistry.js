import {ql7StableHash, ql7Str} from '../internal/text.js'
import {buildQl7SupportKnowledgeSourceReceipt} from './sourceReceipt.js'

export const QL7_SUPPORT_RELIGION_KNOWLEDGE_VERSION='5.1.0'
function tradition(id,aliases,family,originRegion=''){
 const factId=`religion:${id}:classification`
 const receipt=buildQl7SupportKnowledgeSourceReceipt({factId,subjectId:`religion:${id}`,sourceClass:'curated_stable',sourceRef:`project:ql7-support/religion/${id}`,verifiedAt:'2026-08-06',freshnessClass:'stable-concept'})
 const body={schema:'ql7.support.religion-knowledge',schemaVersion:QL7_SUPPORT_RELIGION_KNOWLEDGE_VERSION,id,aliases:Object.freeze(aliases.map(v=>ql7Str(v).toLowerCase())),family,originRegion,nationalityEquivalent:false,neutralityRequired:true,sourceReceipt:receipt,readyToSend:false,finalText:false}
 return Object.freeze({...body,entryHash:ql7StableHash(JSON.stringify(body))})
}
const ROWS=Object.freeze([
 tradition('christianity',['christianity','христианство','християнство','cristianismo','hristiyanlık','المسيحية','基督教','נצרות'],'abrahamic','middle-east'),
 tradition('islam',['islam','ислам','іслам','islamismo','islam','الإسلام','伊斯兰教','אסלאם'],'abrahamic','middle-east'),
 tradition('judaism',['judaism','иудаизм','юдаїзм','judaísmo','yahudilik','اليهودية','犹太教','יהדות'],'abrahamic','middle-east'),
 tradition('buddhism',['buddhism','буддизм','буддизм','budismo','budizm','البوذية','佛教','בודהיזם'],'dharmic','south-asia'),
 tradition('hinduism',['hinduism','индуизм','індуїзм','hinduismo','hinduizm','الهندوسية','印度教','הינדואיזם'],'dharmic','south-asia'),
 tradition('sikhism',['sikhism','сикхизм','сикхізм','sijismo','sihizm','السيخية','锡克教','סיקיזם'],'dharmic','south-asia'),
 tradition('shinto',['shinto','синто','синтоїзм','sintoísmo','şinto','الشنتو','神道','שינטו'],'east-asian','japan'),
 tradition('taoism',['taoism','daoism','даосизм','даосизм','taoísmo','taoculuk','الطاوية','道教','דאואיזם'],'east-asian','china'),
])
export const QL7_SUPPORT_RELIGION_TRADITIONS=ROWS
function norm(v=''){return ql7Str(v).toLowerCase().normalize('NFKC')}
export function resolveQl7SupportReligionTopic(query=''){const s=norm(query);const hits=ROWS.filter(r=>r.aliases.some(a=>s.includes(norm(a))));return hits.length===1?Object.freeze({decision:'selected',tradition:hits[0]}):hits.length>1?Object.freeze({decision:'clarify',traditions:Object.freeze(hits)}):null}
export function auditQl7SupportReligionRegistry(){return Object.freeze({ok:ROWS.every(r=>r.nationalityEquivalent===false&&r.readyToSend===false&&r.sourceReceipt?.receiptHash),count:ROWS.length,nationalityConflationForbidden:true})}
