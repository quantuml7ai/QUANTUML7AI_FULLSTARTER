import crypto from 'node:crypto'
export const QL7_DOMAIN_ISOLATION_ORACLE_VERSION='5.1.0-independent'
const TOKENS=Object.freeze({
 qcoin:['qcoin'],vip:['vip'],ads_packages:['ads package','ad package','рекламн','пакет'],ads_campaigns:['campaign','кампан'],wallet:['wallet','кошел'],payments:['payment','платеж','оплат'],metamarket:['metamarket'],battlecoin:['battlecoin'],battle_chat:['battle chat'],futures:['futures'],exchange:['exchange','бирж'],exchange_ai:['ai box'],forum:['forum','форум'],messenger:['messenger'],academy:['academy','академ'],gameverse:['gameverse'],metastudio:['metastudio'],metaverse:['metaverse'],quantum_zigzag:['quantum zigzag'],ql7_blockchain:['l7 blockchain','ql7 blockchain'],security:['security','безопас','безпек'],privacy:['privacy','приват'],telegram:['telegram'],profile:['profile','профил'],quests:['quest','квест'],moderation:['moderation','модерац'],
})
function norm(v=''){return String(v||'').normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim()}
export function evaluateDomainIsolationIndependent({text='',expectedDomain='',allowedDomains=[],explicitlyRequestedDomains=[]}={}){
 const value=norm(text);const allowed=new Set([expectedDomain,...allowedDomains,...explicitlyRequestedDomains].filter(Boolean));const hits=[]
 for(const [domain,tokens] of Object.entries(TOKENS))for(const token of tokens)if(value.includes(token)){hits.push({domain,token});break}
 const leaks=hits.filter(row=>!allowed.has(row.domain))
 const body={oracle:'domain-isolation-independent',version:QL7_DOMAIN_ISOLATION_ORACLE_VERSION,expectedDomain,allowedDomains:[...allowed],hits,leaks,ok:leaks.length===0}
 return Object.freeze({...body,receiptHash:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')})
}
