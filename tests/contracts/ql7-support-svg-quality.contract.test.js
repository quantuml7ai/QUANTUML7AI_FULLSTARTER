import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_SVG_ASSETS,
  validateQl7SupportSvgRegistry,
} from '../../lib/ql7-support/presentation/svgRegistry.js'

describe('QL7 Support canonical premium SVG production contract',()=>{
  it('ships 160 detailed unique lightweight premium assets',()=>{
    const report=validateQl7SupportSvgRegistry()
    expect(report.ok).toBe(true)
    expect(report.count).toBe(160)
    expect(report.uniquePathHashes).toBe(160)
    expect(report.premiumDetailed).toBe(160)
    expect(report.legacyAssets).toBe(0)
    expect(report.heavyEffects).toBe(0)
    expect(report.minPrimitiveCount).toBeGreaterThanOrEqual(8)
    expect(report.maxAnimatedNodes).toBeLessThanOrEqual(2)
  })
  it('uses actual geometry hashes and no local legacy icon map in production component',()=>{
    expect(new Set(QL7_SUPPORT_SVG_ASSETS.map((asset)=>asset.pathHash)).size).toBe(160)
    const source=fs.readFileSync('app/forum/features/dm/components/Ql7SemanticBadge.js','utf8')
    expect(source).toContain("presentation/svgRegistry.js")
    expect(source).not.toMatch(/function\s+paths\s*\(/u)
    expect(source).toContain("'data-ql7-svg-legacy':'0'")
  })
})
