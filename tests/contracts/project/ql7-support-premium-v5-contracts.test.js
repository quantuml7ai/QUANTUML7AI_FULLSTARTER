import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const sha256 = (relativePath) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex')

describe('QL7 Support Planetary AI V5 architecture contracts', () => {
  test('pins the approved dependency manifest postimage', () => {
    expect(sha256('package.json')).toBe('8f68ba866c9ed8ffe76597bdfa9be6aab9b4250344e526a92d654cc7c1f833c5')
    expect(sha256('pnpm-lock.yaml')).toBe('35c48cff6025c4d2cb20a47042718b70eae0ba356720cb21c7e3a6ef4d9e164a')
  })

  test('requires a verified actor only for Support and preserves ordinary DM routing', () => {
    const send = read('app/api/dm/send/route.js')
    const thread = read('app/api/dm/thread/route.js')
    const state = read('app/api/dm/support-state/route.js')
    const identity = read('lib/ql7-support/identityResolver.js')

    expect(send).toContain("if (isQl7SupportId(to))")
    expect(send).toContain('resolveQl7VerifiedActor')
    expect(send).toContain("return bad(actor?.failureCode || 'verified_session_required', 401)")
    expect(send).toContain('const from = await requireUserIdCanonical(req, body)')
    expect(thread).toContain('resolveQl7VerifiedActor')
    expect(state).toContain('resolveQl7VerifiedActor')
    expect(identity).toContain("failureCode: 'verified_session_required'")
    expect(identity).not.toContain('rawToken:')
    expect(identity).not.toContain('rawInitData:')
  })

  test('keeps user cards server-only and strips forged rich fields from public writes', () => {
    const send = read('app/api/dm/send/route.js')
    const codec = read('lib/mongo/dm-read-domain-codec.cjs')
    const row = read('app/forum/features/dm/components/DmThreadMessageRow.jsx')
    const cards = read('lib/ql7-support/contracts/supportCard.js')
    const cardV4 = read('lib/ql7-support/cardSchemaV4.js')

    expect(send).toContain('normalizeQl7SupportText')
    expect(send).not.toContain('body?.supportCard')
    expect(cards).toContain('return buildQl7SupportCardV4(prepared)')
    expect(cardV4).toContain('integrity: Object.freeze({')
    expect(cardV4).toContain('signature: hash(body)')
    expect(cardV4).toContain("algorithm: 'sha256'")
    expect(codec).toContain('supportCard')
    expect(row).toContain('QL7_SUPPORT_SYSTEM_ROLE')
    expect(row).toContain("systemRole === QL7_SUPPORT_SYSTEM_ROLE || systemRole === 'ql7_support_system'")
    expect(row).toContain('isRenderableQl7SupportCard')
  })

  test('separates reporter-private admin evidence from the user projection', () => {
    const events = read('lib/ql7-support/events.js')
    const report = read('app/api/forum/report/route.js')
    expect(events).toContain("const QL7_SUPPORT_ADMIN_EVENT_COLLECTION = 'ql7_support_admin_events'")
    expect(events).toContain('reporterPrivate: true')
    expect(events).not.toContain('payload: { postId, reportType, reporterId')
    expect(report).toContain('moderationSnapshot')
    expect(report).toContain('capturedAt')
  })

  test('proves diagnostics are bounded reads and never mutate business collections', () => {
    const registry = read('lib/ql7-support/diagnosticRegistry.js')
    const sources = read('lib/ql7-support/sourceRegistry.js')
    expect(registry).toContain('boundedFilter')
    expect(registry).toContain('fingerprintCollections')
    expect(registry).toContain('businessCollectionsWritten: []')
    expect(registry).not.toMatch(/deleteMany\s*\(\s*\{\s*\}\s*\)/)
    expect(registry).not.toMatch(/updateMany\s*\(/)
    expect(sources).toContain('maxRowsPerCollection: 25')
    expect(sources).toContain('readOnly: true')
  })

  test('keeps current message identity stable across optimistic, realtime and poll merges', () => {
    const sender = read('app/forum/features/dm/services/sendDmComposerMessage.js')
    const loaders = read('app/forum/features/dm/utils/dmLoaders.js')
    const server = read('lib/ql7-support/server.js')
    expect(sender).toContain('composerSnapshot: Object.freeze')
    expect(sender).toContain('clientMutationId')
    expect(loaders).toContain('byMutation')
    expect(server).toContain('triggeringUserMessageId')
    expect(server).toContain("eventType: 'support_reply'")
  })

  test('keeps controlled learning review, evaluation, deployment and rollback explicit', () => {
    const source = read('lib/ql7-support/learningPipeline.js')
    expect(source).toMatch(/status:\s*risk\s*>=\s*0\.35\s*\?\s*'rejected_poisoning_risk'\s*:\s*'candidate'/)
    expect(source).toContain("status = approved ? 'approved_for_eval' : 'rejected'")
    expect(source).toContain("throw new Error('learning_evaluation_failed')")
    expect(source).toContain("status: 'rolled_back'")
    expect(source).toContain('const userIdHash = sha(str(userId)).slice(0, 32)')
    expect(source).toMatch(/const candidateSeed = \{\s*userIdHash,/)
    expect(source).toMatch(/QL7_SUPPORT_LEARNING_CANDIDATES\)\.deleteMany\(\{\s*userIdHash: userHash,\s*status:/)
    expect(source).not.toContain('userId: str(userId)')
  })

  test('includes all personal Support collections in account deletion without deleting global deployments', () => {
    const deletion = read('lib/mongo/account-deletion-primary.cjs')
    for (const collection of [
      'ql7_support_cases',
      'ql7_support_diagnostic_runs',
      'ql7_support_user_requests',
      'ql7_support_message_dedupe',
      'ql7_support_ui_events',
      'ql7_support_security_audit',
      'ql7_support_admin_events',
      'ql7_support_learning_candidates',
      'support_email_outbox',
    ]) expect(deletion).toContain(`name: '${collection}'`)
    expect(deletion).not.toContain("name: 'ql7_support_learning_deployments'")
  })
})
