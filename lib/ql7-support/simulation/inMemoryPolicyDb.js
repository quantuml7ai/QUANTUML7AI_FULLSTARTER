function clone(value){return value==null?value:JSON.parse(JSON.stringify(value))}
function get(obj,key){return String(key||'').split('.').reduce((v,k)=>v==null?undefined:v[k],obj)}
function comparable(v){if(v instanceof Date)return v.getTime();const n=Date.parse(v);return Number.isFinite(n)&&typeof v==='string'&&/T|Z|\d{4}-\d{2}-\d{2}/.test(v)?n:v}
function matchValue(actual,expected){
 if(expected instanceof RegExp)return expected.test(String(actual??''))
 if(expected&&typeof expected==='object'&&!Array.isArray(expected)&&!(expected instanceof Date)){
  if('$in'in expected)return expected.$in.some(v=>String(v)===String(actual))
  if('$exists'in expected)return expected.$exists?actual!==undefined:actual===undefined
  if('$ne'in expected)return String(actual)!==String(expected.$ne)
  if('$gte'in expected)return comparable(actual)>=comparable(expected.$gte)
  if('$gt'in expected)return comparable(actual)>comparable(expected.$gt)
  if('$lte'in expected)return comparable(actual)<=comparable(expected.$lte)
  if('$lt'in expected)return comparable(actual)<comparable(expected.$lt)
 }
 return String(actual)===String(expected)
}
function matches(doc,filter={}){
 if(!filter||!Object.keys(filter).length)return true
 if(Array.isArray(filter.$or))return filter.$or.some(f=>matches(doc,f))
 return Object.entries(filter).every(([key,expected])=>key==='$or'?Array.isArray(expected)&&expected.some(f=>matches(doc,f)):matchValue(get(doc,key),expected))
}
function applyUpdate(doc,update={}){
 if(update.$setOnInsert&&doc.__inserted)Object.assign(doc,clone(update.$setOnInsert))
 if(update.$set)Object.assign(doc,clone(update.$set))
 if(update.$inc)for(const[k,v]of Object.entries(update.$inc))doc[k]=Number(doc[k]||0)+Number(v||0)
 if(update.$push)for(const[k,v]of Object.entries(update.$push)){if(!Array.isArray(doc[k]))doc[k]=[];doc[k].push(clone(v))}
 if(update.$unset)for(const k of Object.keys(update.$unset))delete doc[k]
 delete doc.__inserted
 return doc
}
export function createQl7SupportInMemoryPolicyDb(seed={}){
 const stores=new Map()
 for(const[name,rows]of Object.entries(seed||{}))stores.set(name,(rows||[]).map(clone))
 let seq=0
 const ensure=(name)=>{if(!stores.has(name))stores.set(name,[]);return stores.get(name)}
 const collection=(name)=>({
  async findOne(filter={},options={}){let rows=ensure(name).filter(r=>matches(r,filter));if(options?.sort){const entries=Object.entries(options.sort);rows=rows.slice().sort((a,b)=>{for(const[k,d]of entries){const av=comparable(get(a,k)),bv=comparable(get(b,k));if(av===bv)continue;return(av>bv?1:-1)*Number(d||1)}return 0})}return clone(rows[0]||null)},
  find(filter={}){let rows=ensure(name).filter(r=>matches(r,filter));const cursor={sort(spec={}){const e=Object.entries(spec);rows=rows.slice().sort((a,b)=>{for(const[k,d]of e){const av=comparable(get(a,k)),bv=comparable(get(b,k));if(av===bv)continue;return(av>bv?1:-1)*Number(d||1)}return 0});return cursor},limit(n){rows=rows.slice(0,Number(n)||0);return cursor},async toArray(){return clone(rows)}};return cursor},
  async insertOne(row){const copy=clone(row||{});if(copy._id==null)copy._id=`mem:${name}:${++seq}`;if(ensure(name).some(x=>String(x._id)===String(copy._id))){const e=new Error('duplicate key');e.code=11000;throw e}ensure(name).push(copy);return{acknowledged:true,insertedId:copy._id}},
  async updateOne(filter={},update={},options={}){let row=ensure(name).find(r=>matches(r,filter));let upsertedCount=0;if(!row&&options.upsert){row={...clone(filter),__inserted:true};ensure(name).push(row);upsertedCount=1}if(!row)return{matchedCount:0,modifiedCount:0,upsertedCount:0};applyUpdate(row,update);return{matchedCount:upsertedCount?0:1,modifiedCount:1,upsertedCount,upsertedId:upsertedCount?row._id:null}},
  async deleteMany(filter={}){const before=ensure(name).length;stores.set(name,ensure(name).filter(r=>!matches(r,filter)));return{deletedCount:before-ensure(name).length}},
 })
 return Object.freeze({collection,__snapshot:()=>Object.fromEntries([...stores].map(([k,v])=>[k,clone(v)]))})
}
