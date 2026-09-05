import crypto from 'node:crypto'
export const QL7_EMBEDDING_SIMILARITY_ORACLE_VERSION='5.1.0-independent'
function hash(v){return crypto.createHash('sha256').update(String(v??'')).digest('hex')}
function norm(v=''){return String(v||'').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]+/gu,' ').replace(/\s+/gu,' ').trim()}
function tokens(v=''){return norm(v).match(/[\p{L}\p{N}]+/gu)||[]}
function featureVector(text='',dimensions=384){const vec=new Float64Array(dimensions);const ts=tokens(text);const grams=[];for(let n=1;n<=3;n++)for(let i=0;i+n<=ts.length;i++)grams.push(ts.slice(i,i+n).join(' '));for(const gram of grams){const d=crypto.createHash('sha256').update(gram).digest();const idx=d.readUInt32BE(0)%dimensions;const sign=(d[4]&1)?1:-1;vec[idx]+=sign*(1+Math.log1p(gram.split(' ').length))}let ss=0;for(const x of vec)ss+=x*x;const scale=ss>0?1/Math.sqrt(ss):0;return Array.from(vec,(x)=>x*scale)}
function cosine(a=[],b=[]){let dot=0,aa=0,bb=0;const n=Math.min(a.length,b.length);for(let i=0;i<n;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return aa&&bb?dot/Math.sqrt(aa*bb):0}
export function createQl7IndependentEmbeddingVerifier({modelId='ql7-lab-hashed-semantic',modelChecksum='',dimensions=384,embed=null}={}){
 const checksum=modelChecksum||hash(JSON.stringify({modelId,dimensions,algorithm:'hashed-word-ngram-1-3-signed'}))
 const embedFn=typeof embed==='function'?embed:(text)=>featureVector(text,dimensions)
 return Object.freeze({
  modelId,modelChecksum:checksum,dimensions,
  async compare(left='',right='',{threshold=.80}={}){const [a,b]=await Promise.all([embedFn(left),embedFn(right)]);const similarity=cosine(a,b);const body={oracle:'embedding-similarity-independent',version:QL7_EMBEDDING_SIMILARITY_ORACLE_VERSION,modelId,modelChecksum:checksum,threshold,similarity,nearDuplicate:similarity>=threshold,leftHash:hash(norm(left)),rightHash:hash(norm(right))};return Object.freeze({...body,receiptHash:hash(JSON.stringify(body))})},
 })
}
