import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('QL7 Support premium smoke wiring', () => {
  test('wires live, static, self-test and 6192-scenario runners without package drift', () => {
    for (const file of [
      'scripts/ql7-support/static-audit.mjs',
      'scripts/ql7-support/self-test.mjs',
      'scripts/ql7-support/synthetic-scenario-matrix.mjs',
      'scripts/ql7-support/live-smoke.mjs',
    ]) expect(fs.existsSync(path.join(root, file))).toBe(true)

    const matrix = read('scripts/ql7-support/synthetic-scenario-matrix.mjs')
    expect(matrix).toContain("['ru', 'en', 'uk', 'es', 'tr', 'ar', 'zh', 'he']")
    expect(matrix).toContain('acts: 18')
    expect(matrix).toContain('QL7_SUPPORT_SYNTHETIC_TEST_ENABLED')
    expect(matrix).toContain("String(process.env.QL7_SUPPORT_SYNTHETIC_ALLOWED || '') === '1'")
    expect(matrix).toContain("process.env.NODE_ENV === 'production'")
    expect(matrix).toContain("const collectionName = 'ql7_support_synthetic_runs'")
    expect(matrix).toContain('database.collection(collectionName)')
    expect(matrix).toContain('deleteMany({')
    expect(matrix).toContain('scenarioRunId: runId')
    expect(matrix).toContain('syntheticPrefix')
    expect(matrix).toContain('createdBy')
    expect(matrix).toContain('synthetic: true')
    expect(matrix).toContain('leftovers === 0')
    expect(matrix).not.toContain('deleteMany({})')
    expect(matrix).not.toContain('updateMany({})')
  })

  test('keeps live smoke read-only unless authenticated support writes are explicitly configured', () => {
    const live = read('scripts/ql7-support/live-smoke.mjs')
    expect(live).toContain("const baseUrl = String(args['base-url']")
    expect(live).toContain('authenticated-live-credentials-required')
    expect(live).toContain('QL7_SUPPORT_LIVE_WALLET_ADDRESS')
    expect(live).toContain('QL7_SUPPORT_LIVE_WALLET_TOKEN')
    expect(live).toContain('readOnlyDefault')
    expect(live).toContain('writesRestrictedToQl7Support: true')
    expect(live).toContain('realBusinessWrites: false')
    expect(live).toContain('realSmtpSent: false')
    expect(live).not.toContain('deleteMany({})')
    expect(live).not.toContain('updateMany({})')
  })

  test('exposes verified persisted operator states and premium card surface', () => {
    const stateRoute = read('app/api/dm/support-state/route.js')
    expect(stateRoute).toContain('resolveQl7VerifiedActor')
    expect(stateRoute).toContain('getQl7SupportRuntimeStateForUser')
    expect(stateRoute).toContain('verified_session_required')
    expect(stateRoute).toContain("cache-control': 'no-store")
    expect(read('app/forum/features/dm/components/Ql7SupportOperator.jsx')).toContain('data-ql7-support-operator')
    expect(read('app/forum/features/dm/components/Ql7SupportOperator.jsx')).toContain('data-support-ui-state')
    const card = read('app/forum/features/dm/components/Ql7SupportCard.js')
    const media = read('app/forum/features/dm/components/DmMediaRenderer.jsx')
    const row = read('app/forum/features/dm/components/DmThreadMessageRow.jsx')
    expect(card).toContain("import DmMediaRenderer from './DmMediaRenderer'")
    expect(card).toContain("source: 'support-complaint'")
    expect(card).not.toContain('data-ql7-support-video-loop')
    expect(card).not.toMatch(/<[A-Za-z]/)
    expect(media).toContain("const VIDEO_SHELL_CLASS = 'videoCard mediaBox dmMediaBox'")
    expect(media).toContain("const VIDEO_STYLE = Object.freeze({ minHeight: 350, maxHeight: 'min(72vh, 650px)'")
    expect(media).not.toMatch(/ViewportFiveSecondVideo|ql7-support-video-loop/u)
    expect(row).toContain('VideoPlayer={NativeSafeVideoPlayer}')
    expect(row).toContain('VoicePlayer={DmVoicePlayer}')
    expect(row).toContain('source="ordinary-dm"')
    expect(read('app/forum/styles/modules/dmStyles.js')).toMatch(/@media\s*\(max-width:\s*360px\)/)
  })
})
