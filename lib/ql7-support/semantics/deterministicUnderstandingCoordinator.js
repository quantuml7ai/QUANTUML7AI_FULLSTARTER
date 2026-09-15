import { ql7StableHash, ql7Str } from '../internal/text.js'
import { loadQl7SupportActiveCalibration } from '../calibration/runtimeCalibration.js'
import {
  assertQl7SupportDeterministicProductionRuntime,
  QL7_SUPPORT_PRODUCTION_RUNTIME,
} from '../config/productionRuntime.js'

export const QL7_SUPPORT_DETERMINISTIC_UNDERSTANDING_VERSION = '18.0.0'

export function finalizeQl7SupportDeterministicUnderstanding({
  semantic = {},
  text = '',
  locale = 'en',
} = {}) {
  assertQl7SupportDeterministicProductionRuntime()
  const calibration = loadQl7SupportActiveCalibration()
  const body = {
    schema: 'ql7.support.deterministic-understanding-receipt',
    schemaVersion: QL7_SUPPORT_DETERMINISTIC_UNDERSTANDING_VERSION,
    runtimeMode: QL7_SUPPORT_PRODUCTION_RUNTIME.mode,
    calibrationVersion: calibration.verification.calibrationVersion,
    calibrationHash: calibration.verification.artifactSha256,
    approvalReceiptId: calibration.verification.approvalReceiptId,
    inputHash: ql7StableHash(ql7Str(text)),
    locale: ql7Str(locale || semantic?.locale || 'en'),
    semanticVersion: ql7Str(semantic?.version || semantic?.schemaVersion),
    externalInferenceUsed: false,
    modelWeightsUsed: false,
    onlineLearningUsed: false,
  }
  const receipt = Object.freeze({ ...body, receiptId: `det-understanding:${ql7StableHash(JSON.stringify(body))}` })
  const analysis = Object.freeze({
    ...(semantic?.analysis || {}),
    deterministicUnderstandingReceipt: receipt,
    // Historical field name retained as a read-only receipt alias.
    neuralUnderstandingReceipt: receipt,
  })
  return Object.freeze({
    ...semantic,
    analysis,
    deterministicUnderstandingReceipt: receipt,
    neuralUnderstandingReceipt: receipt,
  })
}
