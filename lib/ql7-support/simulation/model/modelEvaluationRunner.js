import crypto from 'node:crypto'
import {runQl7NativeModelOracleRequest} from './nativeModelOracleClient.js'
import {evaluateQl7SemanticHoldout} from './semanticHoldoutOracle.js'
const h=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
export const QL7_MODEL_EVALUATION_RUNNER_VERSION='1.0.0'
export async function runQl7ModelEvaluation({cases=[],method='understand'}={}){const rows=[];for(const c of cases||[]){let result;try{const view=await runQl7NativeModelOracleRequest({method,input:c.input||{}});const actual=c.project?c.project(view):view.output||{};const oracle=evaluateQl7SemanticHoldout({actual,expected:c.expected||{}});result={caseId:String(c.caseId||''),ok:oracle.ok,oracle,viewHash:view.oracleViewHash}}catch(e){result={caseId:String(c.caseId||''),ok:false,errorCode:String(e?.code||e?.message||'error')}}rows.push(Object.freeze(result))}const body={schema:'ql7.support.model-evaluation',schemaVersion:QL7_MODEL_EVALUATION_RUNNER_VERSION,ok:rows.every(x=>x.ok),caseCount:rows.length,rows:Object.freeze(rows)};return Object.freeze({...body,receiptHash:h(body)})}
