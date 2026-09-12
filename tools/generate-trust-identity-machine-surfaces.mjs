#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTrustIdentityLlmsText, buildTrustIdentityMachineManifest } from '../lib/seo/trustIdentityMachineIdentity.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(ROOT, 'public', '.well-known', 'ql7-identity.json')
const llmsPath = path.join(ROOT, 'public', 'llms.txt')
fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
fs.writeFileSync(manifestPath, `${JSON.stringify(buildTrustIdentityMachineManifest(), null, 2)}\n`, 'utf8')
fs.writeFileSync(llmsPath, buildTrustIdentityLlmsText(), 'utf8')
console.log('QL7_TRUST_IDENTITY_MACHINE_SURFACES_V1_OK')
