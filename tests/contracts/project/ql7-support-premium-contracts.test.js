import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const sha256 = (relativePath) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex')

describe('QL7 Support Planetary AI canonical architecture contracts', () => {
  test('pins dependencies while allowing mandated QL7 Support command-surface expansion', () => {
    const pkg = JSON.parse(read('package.json'))
    const dependencyManifest = {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      peerDependencies: pkg.peerDependencies || {},
      optionalDependencies: pkg.optionalDependencies || {},
    }
    const dependencyHash = crypto.createHash('sha256')
      .update(JSON.stringify(dependencyManifest, Object.keys(dependencyManifest).sort()))
      .digest('hex')
    const canonicalDependencyJson = JSON.stringify(dependencyManifest, (key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
      }
      return value
    })
    const canonicalDependencyHash = crypto.createHash('sha256').update(canonicalDependencyJson).digest('hex')
    expect(canonicalDependencyHash).toBe('7f531077f17c0f81537313bba470e22611fd5e9aad805f7f27ee43447fa4ede5')
    expect(dependencyHash).toMatch(/^[a-f0-9]{64}$/u)
    expect(sha256('pnpm-lock.yaml')).toBe('35c48cff6025c4d2cb20a47042718b70eae0ba356720cb21c7e3a6ef4d9e164a')
    for (const script of ['ql7:support:preflight','ql7:support:verify','ql7:support:combat','ql7:support:capacity','ql7:support:human-review','ql7:support:evidence:validate','ql7:support:release','ql7:support:architecture']) {
      expect(pkg.scripts?.[script], script).toBeTruthy()
    }
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
    const cards = read('lib/ql7-support/cardSchema.js')
    const card = read('lib/ql7-support/cardSchema.js')

    expect(send).toContain('normalizeQl7SupportText')
    expect(send).not.toContain('body?.supportCard')
    expect(cards).toContain('export function buildQl7SupportCard(input = {})')
    expect(card).toContain('integrity: Object.freeze({')
    expect(card).toContain('signature: hash(body)')
    expect(card).toContain("algorithm: 'sha256'")
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
    expect(source).toContain('return deleteLearningDataAuthority(args)')
    expect(source).not.toMatch(/QL7_SUPPORT_LEARNING_CANDIDATES\)\.deleteMany\(/u)
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
      'ql7_support_entry_events',
      'ql7_support_event_envelopes',
      'ql7_support_delivery_receipts',
      'ql7_support_event_outbox',
      'ql7_support_novelty_fingerprints',
      'ql7_support_quality_receipts',
      'ql7_support_conversation_turn_leases',
      'ql7_support_memory_recovery_conflicts',
    ]) expect(deletion).toContain(`name: '${collection}'`)
    expect(deletion).toContain('actorIdHash')
    expect(deletion).toContain('recipientIdHash')
    expect(deletion).toContain('recipientHash')
    expect(deletion).toContain('actorHash')
    expect(deletion).not.toContain("name: 'ql7_support_learning_deployments'")
  })
})
