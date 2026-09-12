import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_ALL_LOCALES,
  QL7_SUPPORT_SIMULATION_PROFILES,
} from '../../lib/ql7-support/simulation/scenarioCatalog.js'
import { QL7_SUPPORT_MUTATION_FAMILIES } from '../../lib/ql7-support/simulation/mutationEngine.js'
import { getQl7SemanticBankCoverage } from '../../lib/ql7-support/language/semanticBanks.js'
import { getQl7HumanVariationCoverage } from '../../lib/ql7-support/language/humanVariationPrimitives.js'
import { getQl7SupportKnowledge32Coverage } from '../../lib/ql7-support/simulation/corpora/knowledge32.js'

describe('QL7 Support canonical regulation contracts', () => {
  it('exposes all 32 locales, expanded banks and production run profiles', () => {
    const semantic = getQl7SemanticBankCoverage()
    const human = getQl7HumanVariationCoverage()
    const knowledge32 = getQl7SupportKnowledge32Coverage()
    expect(QL7_SUPPORT_ALL_LOCALES).toHaveLength(32)
    expect(semantic.localeCount).toBe(32)
    expect(semantic.totalTerms).toBeGreaterThan(180000)
    expect(semantic.rows.every((row) => row.totalTerms >= 5000)).toBe(true)
    expect(semantic.rows.every((row) => Object.values(row.categoryCounts).every((count) => count >= 20))).toBe(true)
    expect(human.localeCount).toBe(32)
    expect(human.ok).toBe(true)
    expect(human).toMatchObject({ primitiveOnly: true, readyToSendRows: 0, finalSentenceRows: 0, actualCapacityProofComplete: false, requiredActualOutputsPerBranchLocale: 10000 })
    expect(semantic.topicAliasTopicCount).toBeGreaterThanOrEqual(47)
    expect(semantic.topicAliasTermCount).toBeGreaterThanOrEqual(630)
    expect(knowledge32).toMatchObject({
      ok: true,
      domainCount: 48,
      localeCount: 32,
      baseParaphrasesPerDomainLocale: 50,
      mutationFamiliesPerBase: 8,
      scenarioFloor: 614400,
    })
    expect(QL7_SUPPORT_SIMULATION_PROFILES).toContain('long-dialogue')
    expect(QL7_SUPPORT_SIMULATION_PROFILES).toContain('business')
    expect(QL7_SUPPORT_SIMULATION_PROFILES).toContain('social-boundary')
    expect(QL7_SUPPORT_SIMULATION_PROFILES).toContain('knowledge-32')
    expect(QL7_SUPPORT_MUTATION_FAMILIES).toHaveLength(29)
  }, 60000)

  it('ships full regulation scripts', () => {
    for (const f of [
      'scripts/ql7-support/source-integrity-audit.mjs',
      'scripts/ql7-support/integration-regression-proof.mjs',
      'scripts/ql7-support/simulation-suite.mjs',
      'scripts/ql7-support/native-translate-smoke.mjs',
      'scripts/ql7-support/live-read-proof.mjs',
      'scripts/ql7-support/regulation-audit.mjs',
      'scripts/ql7-support/support-active-process-matrix.mjs',
      'scripts/ql7-support/browser-acceptance.mjs',
      'scripts/ql7-support/operator-asset-guard.mjs',
      'scripts/ql7-support/learning-governance-proof.mjs',
      'scripts/ql7-support/sim.mjs',
      'scripts/ql7-support/watch.mjs',
      'scripts/ql7-support/report.mjs',
      'scripts/ql7-support/replay.mjs',
      'scripts/ql7-support/live-read.mjs',
      'scripts/ql7-support/smtp-snapshot.mjs',
      'scripts/ql7-support/verify.mjs',
    ]) expect(fs.existsSync(f)).toBe(true)
  })

  it('exposes stable unversioned commands without compatibility aliases or revisioned owners', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    for (const name of [
      'ql7:support:sim',
      'ql7:support:watch',
      'ql7:support:report',
      'ql7:support:replay',
      'ql7:support:live-read',
      'ql7:support:browser',
      'ql7:support:smtp',
      'ql7:support:learning',
      'ql7:support:verify',
    ]) {
      expect(pkg.scripts[name]).toMatch(/^node scripts\/ql7-support\/[a-z0-9-]+\.mjs(?:\s|$)/u)
      expect(pkg.scripts[name]).not.toMatch(/\/(?:canonical-|.*(?:rev|v)\d)/iu)
    }
    for (const name of [
      'ql7:support:sim:canonical',
      'ql7:support:watch:canonical',
      'ql7:support:report:canonical',
      'ql7:support:replay:canonical',
      'ql7:support:live-read:canonical',
      'ql7:support:browser:canonical',
      'ql7:support:smtp:canonical',
      'ql7:support:learning:canonical',
      'ql7:support:verify:canonical',
    ]) expect(pkg.scripts[name]).toBeUndefined()
  })
})
