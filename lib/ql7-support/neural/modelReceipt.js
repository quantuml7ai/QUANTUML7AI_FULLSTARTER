import crypto from 'node:crypto'
import {ql7Str} from '../internal/text.js'
export const QL7_NATIVE_MODEL_RECEIPT_SCHEMA='ql7.native-model-receipt'
const SHA256_RE=/^[a-f0-9]{64}$/u
function sha256(value=''){return crypto.createHash('sha256').update(String(value)).digest('hex')}
function normalizedHash(value=''){const v=ql7Str(value).toLowerCase();return SHA256_RE.test(v)?v:sha256(v)}
export function createQl7NativeModelReceipt(input={}){
  const body={schema:QL7_NATIVE_MODEL_RECEIPT_SCHEMA,schemaVersion:1,modelRole:ql7Str(input.modelRole),releaseId:ql7Str(input.releaseId),modelArtifactHash:normalizedHash(input.modelArtifactHash),tokenizerHash:normalizedHash(input.tokenizerHash),requestHash:normalizedHash(input.requestHash),inputLocale:ql7Str(input.inputLocale||'und'),latencyMs:Math.max(0,Number(input.latencyMs||0)),hardwareClass:ql7Str(input.hardwareClass||'unknown'),determinismMode:ql7Str(input.determinismMode||'bounded'),calibrationId:ql7Str(input.calibrationId),outputHash:normalizedHash(input.outputHash),status:ql7Str(input.status||'ok'),promotionStatus:ql7Str(input.promotionStatus)}
  const receiptHash=sha256(JSON.stringify(body));return Object.freeze({...body,receiptHash,receiptId:`native-model:${receiptHash}`})
}
