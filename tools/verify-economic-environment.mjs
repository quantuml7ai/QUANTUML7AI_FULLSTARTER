import fs from 'node:fs'
import path from 'node:path'

const REQUIRED_KEYS = [
  { name: 'QL7_ECONOMIC_SOURCE_HMAC_KEY', minLength: 32 },
  { name: 'QL7_ECONOMIC_DECISION_HMAC_KEY', minLength: 32 },
  { name: 'QL7_DEVICE_EVIDENCE_SALT', minLength: 16 },
]

function localEnvValue(name) {
  const filePath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(filePath)) return ''
  const prefix = `${name}=`
  const line = fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/u)
    .find((entry) => entry.trim().startsWith(prefix))
  return line ? line.trim().slice(prefix.length).trim() : ''
}

const invalid = REQUIRED_KEYS.filter(({ name, minLength }) => {
  const value = String(process.env[name] || localEnvValue(name)).trim()
  return value.length < minLength
})

if (invalid.length) {
  console.error('[economic-env] deployment blocked: missing or short protected economic configuration')
  invalid.forEach(({ name, minLength }) => console.error(` - ${name} must contain at least ${minLength} characters`))
  process.exit(1)
}

console.log(`[economic-env] ready (${REQUIRED_KEYS.length} protected keys present)`)
