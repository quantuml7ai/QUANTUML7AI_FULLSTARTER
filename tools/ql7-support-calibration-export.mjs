import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

function argument(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? String(process.argv[index + 1] || '') : fallback
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  return value
}
const serialize = (value) => JSON.stringify(stable(value))
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex')
const readJson = (file) => JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))

const candidateFile = argument('candidate')
const approvalFile = argument('approval')
const outputFile = argument('output')
if (!candidateFile || !approvalFile || !outputFile) {
  throw new Error('usage: --candidate <redacted-candidate.json> --approval <signed-approval.json> --output <artifact.json>')
}

const candidate = readJson(candidateFile)
const approval = readJson(approvalFile)
const candidateSerialized = serialize(candidate)
const candidateSha256 = sha(candidateSerialized)
const forbidden = /"(?:rawText|transcript|messages|prompt|response|privateKey|sessionToken|secret)"/iu
if (candidate.schema !== 'ql7.support.calibration-export-candidate') throw new Error('calibration_candidate_schema_invalid')
if (candidate.status !== 'validated') throw new Error('calibration_candidate_not_validated')
if (candidate.antiPoisoningReview !== 'passed') throw new Error('calibration_candidate_poisoning_review_missing')
if (candidate.holdoutValidation !== 'passed') throw new Error('calibration_candidate_holdout_missing')
if (forbidden.test(candidateSerialized)) throw new Error('calibration_candidate_contains_forbidden_raw_material')
if (approval.schema !== 'ql7.support.calibration-export-approval') throw new Error('calibration_approval_schema_invalid')
if (approval.status !== 'approved' || approval.candidateSha256 !== candidateSha256) throw new Error('calibration_approval_binding_invalid')
if (approval.algorithm !== 'ed25519') throw new Error('calibration_approval_algorithm_invalid')
const approved = crypto.verify(
  null,
  Buffer.from(candidateSerialized),
  approval.publicKeyPem,
  Buffer.from(String(approval.signature || ''), 'base64'),
)
if (!approved) throw new Error('calibration_approval_signature_invalid')

const artifact = {
  schema: 'ql7.support.deterministic-calibration-export',
  schemaVersion: '1.0.0',
  calibrationVersion: String(candidate.calibrationVersion || ''),
  status: 'approved',
  runtimeMode: 'deterministic-js',
  createdAt: new Date().toISOString(),
  rollbackVersion: String(candidate.rollbackVersion || ''),
  lineage: {
    candidateSha256,
    candidateReceiptId: String(candidate.candidateReceiptId || ''),
    holdoutReceiptId: String(candidate.holdoutReceiptId || ''),
    approvalReceiptId: String(approval.approvalReceiptId || ''),
  },
  calibration: stable(candidate.calibration || {}),
  governance: {
    antiPoisoningReview: 'passed',
    holdoutValidation: 'passed',
    humanApproved: true,
    onlineLearning: false,
    productionMutation: false,
    rawExamplesIncluded: false,
    modelWeightsIncluded: false,
  },
}
const serialized = serialize(artifact)
const envelope = { ...artifact, artifactSha256: sha(serialized) }
fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true })
fs.writeFileSync(path.resolve(outputFile), `${JSON.stringify(envelope, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ ok: true, output: path.resolve(outputFile), artifactSha256: envelope.artifactSha256 }, null, 2))
