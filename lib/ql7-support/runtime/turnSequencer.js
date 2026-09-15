import crypto from 'node:crypto'
export const QL7_SUPPORT_TURN_SEQUENCER_VERSION='5.4.1'
const sha=v=>crypto.createHash('sha256').update(String(v)).digest('hex')
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const legacyMem=new Map()
function key(actorHash,conversationId){return `${String(actorHash||'')}::${String(conversationId||'ql7-support')}`}
function mutationKey(actorHash,conversationId,clientMutationId){return `${key(actorHash,conversationId)}::${String(clientMutationId||'')}`}
function nowIso(clock){return new Date(Number(clock())).toISOString()}
export function createQl7TurnSequenceReceipt(row={}){const body={schema:'ql7.support.turn-sequence-receipt',schemaVersion:QL7_SUPPORT_TURN_SEQUENCER_VERSION,...row};return Object.freeze({...body,receiptHash:sha(JSON.stringify(body))})}

export function createInMemoryQl7TurnSequenceStore({clock=Date.now}={}){
  const states=new Map(),completed=new Map(),inFlight=new Map()
  const ensure=(actorHash,conversationId)=>{const k=key(actorHash,conversationId);let s=states.get(k);if(!s){s={sequenceCounter:0,leaseEpoch:0,active:null};states.set(k,s)}return s}
  return Object.freeze({
    async claimTurn({actorHash,conversationId,clientMutationId,leaseMs=120000}){
      const mk=mutationKey(actorHash,conversationId,clientMutationId),done=completed.get(mk)
      if(done)return {deduped:true,receipt:done.receipt,result:done.result,commitResult:done.commitResult}
      const s=ensure(actorHash,conversationId),now=Number(clock())
      if(s.active&&s.active.expiresAt>now)return {acquired:false}
      s.sequenceCounter+=1;s.leaseEpoch+=1
      const leaseId=crypto.randomUUID(),active={actorHash,conversationId,clientMutationId,sequenceNo:s.sequenceCounter,leaseEpoch:s.leaseEpoch,leaseId,expiresAt:now+Math.max(1000,Number(leaseMs)||120000)};s.active=active
      return {acquired:true,sequenceNo:active.sequenceNo,leaseEpoch:active.leaseEpoch,leaseId:active.leaseId,leaseExpiresAt:new Date(active.expiresAt).toISOString(),acquiredAt:new Date(now).toISOString(),memoryVersionRead:null,memoryVersionBeforeCommit:null,stalePlanDetected:false,rebaseCount:0}
    },
    async releaseTurn(receipt){const s=ensure(receipt.actorHash,receipt.conversationId);if(s.active?.leaseId===receipt.leaseId&&s.active?.leaseEpoch===receipt.leaseEpoch){s.active=null;return true}return false},
    async validateBeforeTransport(receipt,{memoryVersionCurrent=null,memoryVersionPlanned=null}={}){const s=ensure(receipt.actorHash,receipt.conversationId),active=s.active,leaseValid=Boolean(active&&active.leaseId===receipt.leaseId&&active.leaseEpoch===receipt.leaseEpoch&&active.expiresAt>Number(clock())),stale=memoryVersionCurrent!=null&&memoryVersionPlanned!=null&&Number(memoryVersionCurrent)!==Number(memoryVersionPlanned);return {ok:leaseValid&&!stale,leaseValid,stalePlanDetected:stale,rebaseRequired:stale,receipt:createQl7TurnSequenceReceipt({...receipt,memoryVersionBeforeCommit:memoryVersionCurrent,stalePlanDetected:stale,rebaseCount:Number(receipt.rebaseCount||0)+(stale?1:0),disposition:!leaseValid?'lease_invalid':stale?'rebase_required':'validated_before_transport'})}},
    getCompleted({actorHash,conversationId,clientMutationId}){return completed.get(mutationKey(actorHash,conversationId,clientMutationId))||null},
    markCompleted({actorHash,conversationId,clientMutationId,receipt,result,commitResult}){completed.set(mutationKey(actorHash,conversationId,clientMutationId),{receipt,result,commitResult});return true},
    getInFlight(args){return inFlight.get(mutationKey(args.actorHash,args.conversationId,args.clientMutationId))||null},
    setInFlight(args,promise){inFlight.set(mutationKey(args.actorHash,args.conversationId,args.clientMutationId),promise)},
    clearInFlight(args){inFlight.delete(mutationKey(args.actorHash,args.conversationId,args.clientMutationId))},
    auditState(){return {conversationCount:states.size,completedMutationCount:completed.size,inFlightMutationCount:inFlight.size,states:[...states.entries()].map(([k,v])=>({key:k,sequenceCounter:v.sequenceCounter,leaseEpoch:v.leaseEpoch,active:Boolean(v.active)}))}}
  })
}

export function createMongoQl7TurnSequenceStore({database,collectionName='ql7_support_conversation_turn_leases',clock=Date.now}={}){
  if(!database?.collection)throw new TypeError('turn_sequence_database_required')
  const collection=database.collection(collectionName)
  const leaseDocId=(actorHash,conversationId)=>`support-turn:${sha(`${String(actorHash||'')}:${String(conversationId||'ql7-support')}`)}`
  return Object.freeze({
    async claimTurn({actorHash,conversationId='ql7-support',clientMutationId='',leaseMs=120000}){
      const nowMs=Number(clock()),now=new Date(nowMs).toISOString(),leaseUntil=new Date(nowMs+Math.max(30000,Number(leaseMs)||120000)).toISOString(),ownerToken=crypto.randomUUID(),_id=leaseDocId(actorHash,conversationId)
      try{
        const updated=await collection.findOneAndUpdate({_id,$or:[{ownerToken:{$exists:false}},{ownerToken:''},{leaseUntil:{$lte:now}}]},{$set:{actorHash:String(actorHash),conversationId:String(conversationId||'ql7-support'),clientMutationId:String(clientMutationId||''),ownerToken,leaseUntil,updatedAtServerUtc:now},$setOnInsert:{_id,createdAtServerUtc:now},$inc:{sequenceNo:1,leaseEpoch:1}},{upsert:true,returnDocument:'after'})
        const row=updated?.value&&typeof updated.value==='object'?updated.value:updated
        if(row?.ownerToken===ownerToken)return {acquired:true,leaseId:_id,ownerToken,sequenceNo:Number(row?.sequenceNo||1),leaseEpoch:Number(row?.leaseEpoch||1),leaseExpiresAt:leaseUntil,acquiredAt:now,memoryVersionRead:null,memoryVersionBeforeCommit:null,stalePlanDetected:false,rebaseCount:0}
      }catch(error){if(Number(error?.code)!==11000)throw error}
      return {acquired:false}
    },
    async releaseTurn(receipt){if(!receipt?.leaseId||!receipt?.ownerToken)return false;const at=new Date(Number(clock())).toISOString();const result=await collection.updateOne({_id:receipt.leaseId,ownerToken:receipt.ownerToken,leaseEpoch:Number(receipt.leaseEpoch)},{$set:{ownerToken:'',leaseUntil:at,releasedAtServerUtc:at,updatedAtServerUtc:at}});return Number(result?.matchedCount||0)===1},
    async validateBeforeTransport(receipt,{memoryVersionCurrent=null,memoryVersionPlanned=null}={}){
      const now=new Date(Number(clock())).toISOString(),row=await collection.findOne({_id:receipt?.leaseId})
      const leaseValid=Boolean(row&&row.ownerToken===receipt?.ownerToken&&Number(row.leaseEpoch)===Number(receipt?.leaseEpoch)&&String(row.leaseUntil||'')>now)
      const stale=memoryVersionCurrent!=null&&memoryVersionPlanned!=null&&Number(memoryVersionCurrent)!==Number(memoryVersionPlanned)
      return Object.freeze({ok:leaseValid&&!stale,leaseValid,stalePlanDetected:stale,rebaseRequired:stale,receipt:createQl7TurnSequenceReceipt({...receipt,memoryVersionBeforeCommit:memoryVersionCurrent,stalePlanDetected:stale,rebaseCount:Number(receipt?.rebaseCount||0)+(stale?1:0),disposition:!leaseValid?'lease_invalid':stale?'rebase_required':'validated_before_transport'})})
    },
  })
}

export async function acquireQl7TurnSequence({actorHash='',conversationId='ql7-support',clientMutationId='',waitMs=90000,leaseMs=120000,clock=Date.now,store=null,pollMs=25}={}){
 if(!actorHash)throw Object.assign(new Error('turn_sequence_actor_required'),{code:'turn_sequence_actor_required',status:401})
 const k=key(actorHash,conversationId),started=Number(clock()),deadline=started+Math.max(1000,Number(waitMs)||90000),ticket=clientMutationId||sha(`${k}:${started}:${crypto.randomUUID()}`)
 while(Number(clock())<=deadline){
   if(store?.claimTurn){const claim=await store.claimTurn({actorHash,conversationId,clientMutationId:ticket,leaseMs});if(claim?.deduped&&claim.receipt)return Object.freeze({...claim.receipt,deduped:true,dedupedResult:claim.result,dedupedCommitResult:claim.commitResult});if(claim?.acquired)return createQl7TurnSequenceReceipt({...claim,actorHash,conversationId,clientMutationId:ticket,disposition:'acquired',transportStarted:false})}
   else {const prev=legacyMem.get(k),now=Number(clock());if(!prev||prev.expiresAt<=now){const seq=(prev?.sequenceNo||0)+1,leaseEpoch=(prev?.leaseEpoch||0)+1,leaseId=crypto.randomUUID(),state={sequenceNo:seq,leaseEpoch,leaseId,clientMutationId:ticket,expiresAt:now+leaseMs};legacyMem.set(k,state);return createQl7TurnSequenceReceipt({actorHash,conversationId,clientMutationId:ticket,sequenceNo:seq,leaseId,leaseEpoch,memoryVersionRead:null,memoryVersionBeforeCommit:null,stalePlanDetected:false,rebaseCount:0,transportStarted:false,finalDeliveryBinding:'',commitVersion:null,disposition:'acquired',acquiredAt:nowIso(clock),leaseExpiresAt:new Date(state.expiresAt).toISOString()})}}
   await sleep(Math.max(5,Math.min(250,pollMs)))
 }
 const err=Object.assign(new Error('turn_sequence_wait_timeout'),{code:'turn_sequence_wait_timeout',status:503,retryable:true,ordinaryConcurrency:true});throw err
}
export async function releaseQl7TurnSequence(receipt,{store=null}={}){if(!receipt)return false;if(store?.releaseTurn)return Boolean(await store.releaseTurn(receipt));const k=key(receipt.actorHash,receipt.conversationId),cur=legacyMem.get(k);if(cur?.leaseId===receipt.leaseId&&cur?.leaseEpoch===receipt.leaseEpoch){legacyMem.delete(k);return true}return false}
export async function validateQl7TurnSequenceBeforeTransport(receipt,{memoryVersionCurrent=null,memoryVersionPlanned=null,store=null}={}){if(store?.validateBeforeTransport)return store.validateBeforeTransport(receipt,{memoryVersionCurrent,memoryVersionPlanned});const stale=memoryVersionCurrent!=null&&memoryVersionPlanned!=null&&Number(memoryVersionCurrent)!==Number(memoryVersionPlanned);return Object.freeze({ok:!stale,stalePlanDetected:stale,rebaseRequired:stale,leaseValid:true,receipt:createQl7TurnSequenceReceipt({...receipt,memoryVersionBeforeCommit:memoryVersionCurrent,stalePlanDetected:stale,rebaseCount:Number(receipt?.rebaseCount||0)+(stale?1:0),disposition:stale?'rebase_required':'validated_before_transport'})})}
export function bindQl7TurnSequenceDelivery(receipt,{finalDeliveryBinding='',commitVersion=null,transportStarted=true}={}){return createQl7TurnSequenceReceipt({...receipt,transportStarted:Boolean(transportStarted),finalDeliveryBinding:String(finalDeliveryBinding||''),commitVersion,disposition:'delivery_bound'})}
export async function runQl7SequencedTurn(options,work){const receipt=await acquireQl7TurnSequence(options);try{return await work(receipt)}finally{await releaseQl7TurnSequence(receipt,{store:options?.store}).catch(()=>false)}}

export async function executeSequencedQl7Turn({store=createInMemoryQl7TurnSequenceStore(),actorHash='',conversationId='ql7-support',clientMutationId='',leaseMs=120000,waitMs=90000,execute,commit,validateBeforeTransport=null,memoryVersionPlanned=null,getCurrentMemoryVersion=null}={}){
  if(typeof execute!=='function')throw new TypeError('turn_sequence_execute_required')
  const args={actorHash,conversationId,clientMutationId,leaseMs,waitMs,store}
  const done=store?.getCompleted?.(args);if(done)return Object.freeze({deduped:true,receipt:done.receipt,result:done.result,commitResult:done.commitResult})
  const existing=store?.getInFlight?.(args);if(existing)return existing
  const promise=(async()=>{
    const receipt=await acquireQl7TurnSequence(args)
    if(receipt.deduped)return Object.freeze({deduped:true,receipt,result:receipt.dedupedResult,commitResult:receipt.dedupedCommitResult})
    try{
      const result=await execute({receipt})
      const currentVersion=typeof getCurrentMemoryVersion==='function'?await getCurrentMemoryVersion():memoryVersionPlanned
      const validation=typeof validateBeforeTransport==='function'?await validateBeforeTransport({receipt,result,currentVersion}):await validateQl7TurnSequenceBeforeTransport(receipt,{memoryVersionCurrent:currentVersion,memoryVersionPlanned,store})
      if(validation?.rebaseRequired){const err=Object.assign(new Error('turn_sequence_rebase_required'),{code:'turn_sequence_rebase_required',retryable:true,receipt:validation.receipt});throw err}
      if(validation?.leaseValid===false){const err=Object.assign(new Error('turn_sequence_lease_invalid'),{code:'turn_sequence_lease_invalid',retryable:true});throw err}
      const validatedReceipt=validation?.receipt||receipt
      const commitResult=typeof commit==='function'?await commit({receipt:validatedReceipt,result}):result
      store?.markCompleted?.({actorHash,conversationId,clientMutationId,receipt:validatedReceipt,result,commitResult})
      return Object.freeze({deduped:false,receipt:validatedReceipt,result,commitResult})
    }finally{await releaseQl7TurnSequence(receipt,{store}).catch(()=>false)}
  })()
  store?.setInFlight?.(args,promise)
  try{return await promise}finally{store?.clearInFlight?.(args)}
}

export async function auditQl7TurnSequencer(){
 const store=createInMemoryQl7TurnSequenceStore(),commits=[]
 const tasks=Array.from({length:5},(_,i)=>executeSequencedQl7Turn({store,actorHash:'audit',conversationId:'c',clientMutationId:`m${i}`,leaseMs:5000,waitMs:5000,execute:async()=>{await sleep(2);return i},commit:async({receipt,result})=>{commits.push(receipt.sequenceNo);return result}}))
 const rows=await Promise.all(tasks);let dedupeExec=0;const once=()=>executeSequencedQl7Turn({store,actorHash:'audit2',conversationId:'c2',clientMutationId:'same',execute:async()=>{dedupeExec++;await sleep(3);return 1}});await Promise.all([once(),once()]);const ordered=[...commits].sort((a,b)=>a-b),ok=rows.length===5&&new Set(commits).size===5&&ordered.every((v,i)=>v===i+1)&&dedupeExec===1;return Object.freeze({ok,userVisible409:0,commitCount:commits.length,dedupeExecuteCount:dedupeExec,failures:Object.freeze(ok?[]:['sequencing_or_dedupe'])})
}
