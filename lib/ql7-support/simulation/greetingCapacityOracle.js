import crypto from 'node:crypto'

export const QL7_SUPPORT_GREETING_CAPACITY_ORACLE_VERSION='5.2.2'
const hash=(value)=>crypto.createHash('sha256').update(String(value??'')).digest('hex')
const normalize=(value)=>String(value??'').normalize('NFKC').toLocaleLowerCase().replace(/\s+/gu,' ').trim()

export function evaluateQl7SupportGreetingCapacityIndependent({locale='',texts=[],required=1000,mode='fresh'}={}){
  const source=Array.isArray(texts)?texts:[]
  const exact=new Set(source.map((v)=>String(v??'').trim()).filter(Boolean))
  const normalized=new Set(source.map(normalize).filter(Boolean))
  const hashes=[...normalized].map(hash)
  const failures=[]
  if(source.length<required)failures.push(`sample_floor:${source.length}/${required}`)
  if(exact.size<required)failures.push(`exact_capacity:${exact.size}/${required}`)
  if(normalized.size<required)failures.push(`normalized_capacity:${normalized.size}/${required}`)
  if(hashes.length!==new Set(hashes).size)failures.push('hash_collision')
  return Object.freeze({
    schema:'ql7.support.greeting-capacity-independent-oracle',schemaVersion:QL7_SUPPORT_GREETING_CAPACITY_ORACLE_VERSION,
    locale:String(locale),mode,required,sampleCount:source.length,exactUnique:exact.size,normalizedUnique:normalized.size,
    ok:failures.length===0,failures:Object.freeze(failures),reportHash:hash(JSON.stringify({locale,mode,required,sampleCount:source.length,exact:exact.size,normalized:normalized.size,failures})),
  })
}
