import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

describe('QL7 Support deterministic production deployment contracts', () => {
  it('keeps the canonical production import graph free of lab, Python and model runtime code', () => {
    const output = execFileSync(process.execPath, ['tools/ql7-support-production-boundary.mjs'], {
      cwd: root,
      encoding: 'utf8',
    })
    expect(JSON.parse(output)).toMatchObject({
      ok: true,
      runtimeMode: 'deterministic-js',
      pythonInProductionGraph: false,
      modelWeightsInProductionGraph: false,
      externalAiInProductionGraph: false,
      serverBanksInClientGraph: false,
      failures: [],
    })
    const owners = [
      'lib/ql7-support/runtime/productionTurn.js',
      'lib/ql7-support/runtime/canonicalContext.js',
      'lib/ql7-support/response/humanNaturalRealizer.js',
      'lib/ql7-support/knowledge/retrieval/hybridRetriever.js',
      'lib/ql7-support/nativeTranslationService.js',
    ].map(read).join('\n')
    expect(owners).not.toMatch(/from ['"].*\/neural\//u)
    expect(owners).not.toMatch(/nativeModelGateway|nativeGenerationAdapter|nativeCriticAdapter/u)
  })

  it('excludes local lab and heavy artifacts from both Vercel upload and Next traces', () => {
    const ignored = read('.vercelignore')
    for (const item of [
      '.venv-ql7/',
      'ml/ql7-native/',
      'services/ql7-model-runtime/',
      'models/ql7-native/',
      '**/*.pt',
      '**/*.pth',
      '**/*.ckpt',
      '**/*.safetensors',
      '**/*.onnx',
      'reports/',
      'scripts/ql7-support/',
    ]) expect(ignored).toContain(item)
    const nextConfig = read('next.config.mjs')
    expect(nextConfig).toContain('outputFileTracingExcludes')
    expect(nextConfig).toContain("'./.venv-ql7/**'")
    expect(nextConfig).toContain("'./services/ql7-model-runtime/**'")
  })

  it('keeps local Python calibration infrastructure available but outside production', () => {
    expect(fs.existsSync(path.join(root, 'services/ql7-model-runtime/server.py'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'services/ql7-model-runtime/tests/test_contract.py'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'scripts/ql7-support/native-python-ml-proof.mjs'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'tools/ql7-support-calibration-export.mjs'))).toBe(true)
    expect(read('lib/ql7-support/server.js')).not.toMatch(/learningPipeline|recordQl7SupportCanonicalLearningObservation/u)
    expect(read('lib/ql7-support/runtime/executeTurn.js')).not.toContain('buildQl7SupportIncidentCandidate')
  })

  it('declares compact TTL/CAS memory and signed fail-closed calibration as production authorities', () => {
    const memory = read('lib/ql7-support/conversation/persistentMemoryProjection.js')
    const store = read('lib/ql7-support/conversation/memoryStore.js')
    const calibration = read('lib/ql7-support/calibration/runtimeCalibration.js')
    expect(memory).toContain('QL7_SUPPORT_PERSISTED_MEMORY_MAX_BYTES = 32 * 1024')
    expect(memory).toContain('recentTurnHashes: 24')
    expect(memory).toContain('topicFrames: 16')
    expect(store).toContain("expireAfterSeconds: 0, name: 'ttl_support_memory_expiry'")
    expect(store).toContain('{ conversationId: id, memoryVersion: expected }')
    expect(calibration).toContain('calibration_artifact_hash_mismatch')
    expect(calibration).toContain('calibration_signature_invalid')
    expect(calibration).toContain("error.status = 503")
  })
})
