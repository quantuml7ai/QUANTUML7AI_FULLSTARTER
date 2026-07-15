#!/usr/bin/env node

const baseUrl = String(process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const validWallet = '0x8F49b54543c77A08f38BF036F3CFe5a3D7Ef16EC'

async function post(payload) {
  const res = await fetch(`${baseUrl}/api/wallet-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

function pass(label) {
  console.log(`PASS ${label}`)
}

function fail(label, value) {
  console.error(`FAIL ${label}`)
  if (value !== undefined) console.error(value)
  process.exitCode = 1
}

console.log(`[QL7 smoke] Base URL: ${baseUrl}`)

const unknown = await post({ action: 'unknown' })
if (unknown.status === 400 && unknown.data?.ok === false) pass('wallet-session unknown action returns 400')
else fail('wallet-session unknown action returns 400', unknown)

const badCreate = await post({ action: 'create', walletAddress: 'bad' })
if (badCreate.status === 400 && ['bad_wallet_address', 'invalid_wallet_address'].includes(badCreate.data?.error)) {
  pass('wallet-session rejects invalid wallet create')
} else fail('wallet-session rejects invalid wallet create', badCreate)

const fakeVerify = await post({ action: 'verify', walletAddress: validWallet, token: 'ql7ws_fake' })
if (fakeVerify.status === 401 && fakeVerify.data?.authorized === false) pass('wallet-session rejects fake token')
else fail('wallet-session rejects fake token', fakeVerify)

const created = await post({ action: 'create', walletAddress: validWallet, accountId: validWallet, provider: 'smoke' })
if (created.status === 200 && created.data?.ok === true && String(created.data?.token || '').startsWith('ql7ws_')) {
  pass('wallet-session creates token for valid wallet')
} else fail('wallet-session creates token for valid wallet', created)

const verified = await post({ action: 'verify', walletAddress: validWallet, token: created.data?.token })
if (verified.status === 200 && verified.data?.authorized === true) pass('wallet-session verifies created token')
else fail('wallet-session verifies created token', verified)

if (process.exitCode) console.error('[QL7 smoke] FAILED')
else console.log('[QL7 smoke] OK')
