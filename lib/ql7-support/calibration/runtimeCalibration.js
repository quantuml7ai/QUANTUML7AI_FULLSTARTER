import crypto from 'node:crypto'
import { QL7_SUPPORT_ACTIVE_CALIBRATION } from './activeCalibration.js'
import { QL7_SUPPORT_ACTIVE_CALIBRATION_MANIFEST } from './calibrationManifest.js'

export const QL7_SUPPORT_RUNTIME_CALIBRATION_VERSION = '1.0.0'

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  }
  return value
}

export function serializeQl7SupportCalibrationArtifact(artifact = {}) {
  return JSON.stringify(stable(artifact))
}

export function verifyQl7SupportCalibrationArtifact({
  artifact = QL7_SUPPORT_ACTIVE_CALIBRATION,
  manifest = QL7_SUPPORT_ACTIVE_CALIBRATION_MANIFEST,
} = {}) {
  const failures = []
  const serialized = serializeQl7SupportCalibrationArtifact(artifact)
  const artifactSha256 = crypto.createHash('sha256').update(serialized).digest('hex')

  if (artifact?.schema !== 'ql7.support.deterministic-calibration-artifact') failures.push('invalid_artifact_schema')
  if (manifest?.schema !== 'ql7.support.deterministic-calibration-manifest') failures.push('invalid_manifest_schema')
  if (artifact?.status !== 'approved' || manifest?.status !== 'approved') failures.push('calibration_not_approved')
  if (artifact?.runtimeMode !== 'deterministic-js' || manifest?.runtimeMode !== 'deterministic-js') failures.push('invalid_runtime_mode')
  if (!artifact?.governance?.humanApproved) failures.push('human_approval_missing')
  if (artifact?.governance?.onlineLearning !== false) failures.push('online_learning_forbidden')
  if (artifact?.governance?.rawExamplesIncluded !== false) failures.push('raw_examples_forbidden')
  if (artifact?.governance?.modelWeightsIncluded !== false) failures.push('model_weights_forbidden')
  if (artifact?.calibrationVersion !== manifest?.calibrationVersion) failures.push('calibration_version_mismatch')
  if (artifact?.lineage?.approvalReceiptId !== manifest?.approvalReceiptId) failures.push('approval_receipt_mismatch')
  if (artifact?.rollbackVersion !== manifest?.rollbackVersion) failures.push('rollback_version_mismatch')
  if (artifactSha256 !== manifest?.artifactSha256) failures.push('calibration_artifact_hash_mismatch')

  let signatureVerified = false
  try {
    signatureVerified = manifest?.signatureAlgorithm === 'ed25519' && crypto.verify(
      null,
      Buffer.from(serialized),
      manifest.publicKeyPem,
      Buffer.from(String(manifest.signature || ''), 'base64'),
    )
  } catch {
    signatureVerified = false
  }
  if (!signatureVerified) failures.push('calibration_signature_invalid')

  return Object.freeze({
    ok: failures.length === 0,
    failures: Object.freeze(failures),
    artifactSha256,
    calibrationVersion: String(artifact?.calibrationVersion || ''),
    approvalReceiptId: String(artifact?.lineage?.approvalReceiptId || ''),
    rollbackVersion: String(artifact?.rollbackVersion || ''),
    signatureVerified,
  })
}

let cached = null

export function loadQl7SupportActiveCalibration() {
  if (cached) return cached
  const verification = verifyQl7SupportCalibrationArtifact()
  if (!verification.ok) {
    const error = new Error('ql7_support_calibration_integrity_failed')
    error.code = 'ql7_support_calibration_integrity_failed'
    error.status = 503
    error.failures = verification.failures
    throw error
  }
  cached = Object.freeze({
    artifact: QL7_SUPPORT_ACTIVE_CALIBRATION,
    manifest: QL7_SUPPORT_ACTIVE_CALIBRATION_MANIFEST,
    verification,
  })
  return cached
}
