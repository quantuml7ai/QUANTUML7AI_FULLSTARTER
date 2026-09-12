import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_RUNTIME_VERSION, QL7_SUPPORT_BEHAVIOR_MANIFEST } from '../../lib/ql7-support/config/behaviorManifest.js'
import { QL7_SUPPORT_ANALYZE_TURN_VERSION } from '../../lib/ql7-support/semantics/analyzeTurn.js'

const root=process.cwd()
const text=(rel)=>fs.readFileSync(path.join(root,rel),'utf8')

describe('canonical authoritative documentation and version coherence',()=>{
  it('pins current runtime and semantic analyzer versions through canonical owners',()=>{
    expect(QL7_SUPPORT_RUNTIME_VERSION).toBe('5.3.0')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.runtimeVersion).toBe(QL7_SUPPORT_RUNTIME_VERSION)
    expect(QL7_SUPPORT_ANALYZE_TURN_VERSION).toBe('16.2.0')
  })
  it('keeps exactly one detailed architecture authority plus generated runtime map',()=>{
    expect(fs.existsSync(path.join(root,'QL7_SUPPORT_ARCHITECTURE_RU.md'))).toBe(true)
    expect(fs.existsSync(path.join(root,'QL7_SUPPORT_FULL_RUNTIME_MAP_AUDIT_RU.md'))).toBe(true)
    expect(fs.existsSync(path.join(root,'QL7_SUPPORT_MAX_COMBAT_canonical_IMPLEMENTATION_RU.md'))).toBe(false)
    const architecture=text('QL7_SUPPORT_ARCHITECTURE_RU.md')
    const runtimeMap=text('QL7_SUPPORT_FULL_RUNTIME_MAP_AUDIT_RU.md')
    expect(architecture).toContain('# QL7 SUPPORT — FINAL NATIVE NEURAL PRODUCTION ARCHITECTURE')
    expect(architecture).toContain('CURRENT POSTIMAGE ARCHITECTURE AUTHORITY')
    expect(architecture).toContain('ONE CANONICAL RUNTIME')
    expect(architecture).toContain('ZERO EXTERNAL AI')
    expect(runtimeMap).toContain('## 0.1. Authoritative documentation model')
    expect(runtimeMap).toContain('General architecture authority: **QL7_SUPPORT_ARCHITECTURE_RU.md**')
    expect(runtimeMap).toContain('Parallel implementation map forbidden')
    expect(runtimeMap).not.toContain('QL7_SUPPORT_NATIVE_NEURAL_INTELLIGENCE_MASTER_SPEC_RU_FINAL')
  })
})
