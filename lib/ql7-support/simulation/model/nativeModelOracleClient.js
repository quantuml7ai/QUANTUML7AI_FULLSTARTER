import crypto from 'node:crypto'
import {requestQl7NativeModel} from '../../neural/nativeModelGateway.js'
export const QL7_NATIVE_MODEL_ORACLE_CLIENT_VERSION='1.0.0'
const h=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
export async function runQl7NativeModelOracleRequest({method='understand',input={},expectedInvariant=null}={}){const result=await requestQl7NativeModel(method,input);const view={status:result.status,method,releaseId:result.config?.model||'',promotionStatus:result.config?.promotionStatus||'',output:result.output||null,receiptHash:result.receipt?.receiptHash||''};return Object.freeze({...view,oracleViewHash:h(view),invariantResult:typeof expectedInvariant==='function'?Boolean(expectedInvariant(view)):null})}
