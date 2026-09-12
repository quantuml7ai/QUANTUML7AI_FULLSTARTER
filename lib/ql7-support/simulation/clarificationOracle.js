import crypto from 'node:crypto'

export const QL7_SUPPORT_CLARIFICATION_ORACLE_VERSION='5.2.2'
const h=(value)=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')

export function evaluateQl7SupportClarificationReceiptIndependent(receipt={}){
  const failures=[]
  const count=Number(receipt?.internalCandidateCount||0)
  const visible=Number(receipt?.visibleOptionCount||0)
  const ranked=Array.isArray(receipt?.topRanked)?receipt.topRanked:[]
  if(receipt?.schema!=='ql7.support.clarification-ranking')failures.push('schema')
  if(count<100)failures.push(`internal_candidate_floor:${count}`)
  if(visible<0||visible>4)failures.push(`visible_option_count:${visible}`)
  if(receipt?.oneBestQuestionPolicy!==true)failures.push('one_best_question_policy')
  if(receipt?.rawQuestionStored!==false)failures.push('raw_question_storage')
  if(!receipt?.selected?.strategyId)failures.push('selected_strategy')
  if(receipt?.selected?.readyToSend!==false||receipt?.selected?.finalText!==false)failures.push('stored_final_text')
  if(ranked.length<1||ranked.length>16)failures.push(`ranked_window:${ranked.length}`)
  for(const row of ranked){
    if(!Number.isFinite(Number(row?.expectedInformationGain)))failures.push('information_gain_nonfinite')
    if(!Number.isFinite(Number(row?.score)))failures.push('score_nonfinite')
  }
  return Object.freeze({
    schema:'ql7.support.independent-clarification-oracle',schemaVersion:QL7_SUPPORT_CLARIFICATION_ORACLE_VERSION,
    ok:failures.length===0,internalCandidateCount:count,visibleOptionCount:visible,failures,
    receiptHash:h({count,visible,selected:receipt?.selected?.strategyId||'',failures}),
  })
}
