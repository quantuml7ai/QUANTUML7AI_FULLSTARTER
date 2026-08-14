import { describe, expect, test } from 'vitest'
import { publishQl7SupportRuntimeState, readQl7SupportRuntimeState } from '../../../lib/ql7-support/runtimeStateMachine.js'
import { buildQl7SupportEmailBridgePayload } from '../../../lib/ql7-support/server.js'
import { buildQl7SupportDiagnosticFailureResult } from '../../../lib/ql7-support/diagnosticFailure.js'
import { composeQl7SupportAdminReport, renderQl7SupportAdminReportHtml } from '../../../lib/ql7-support/adminReportComposer.js'

function memoryDatabase() {
  const rows = new Map()
  return {
    collection() {
      return {
        async findOne(filter = {}) { return [...rows.values()].find((row) => !filter._id || row._id === filter._id) || null },
        async updateOne(filter, update) { rows.set(filter._id, { ...(rows.get(filter._id) || {}), ...(update.$setOnInsert || {}), ...(update.$set || {}) }); return { acknowledged: true } },
        find(filter) { const values = [...rows.values()].filter((row) => !filter.userId || row.userId === filter.userId); return { sort() { return this }, limit() { return this }, async toArray() { return values.sort((a, b) => String(b.changedAt).localeCompare(String(a.changedAt))) } } },
      }
    },
  }
}

describe('QL7 Support V7 runtime integration', () => {
  test('persists server-authoritative locked and ready input policies', async () => {
    const database = memoryDatabase()
    const now = () => Date.parse('2026-07-26T10:00:00.000Z')
    const locked = await publishQl7SupportRuntimeState({ database, userId: 'user-7', caseId: 'case-7', correlationId: 'corr-7', state: 'diagnosing', locale: 'ru', clock: now })
    expect(locked.sequence).toBe(1)
    expect(locked.inputPolicy.canSend).toBe(false)
    const ready = await publishQl7SupportRuntimeState({ database, userId: 'user-7', caseId: 'case-7', correlationId: 'corr-7', state: 'clarifying', locale: 'ru', clock: () => now() + 1000 })
    expect(ready.sequence).toBe(2)
    expect(ready.inputPolicy.canSend).toBe(true)
    expect((await readQl7SupportRuntimeState({ database, userId: 'user-7', correlationId: 'corr-7', clock: () => now() + 1000 })).state).toBe('clarifying')
  })

  test('maps a VIP provider timeout into a user-safe result and aggregate admin report', () => {
    const diagnostic = buildQl7SupportDiagnosticFailureResult({ error: Object.assign(new Error('provider adapter stack'), { name: 'AbortError' }), topic: 'vip', caseId: 'case-v7' })
    const bridge = buildQl7SupportEmailBridgePayload({ fromUserId: 'user-v7', text: 'Проверь мой VIP. Bearer abc.def.ghi', messageId: 'message-v7', locale: 'ru', topic: 'vip', caseId: 'case-v7', diagnosticResult: diagnostic, ecosystemRating: { value: 72, band: 'established', confidence: 80 } })
    expect(bridge.report.diagnostic.branch).toBe('timeout')
    expect(JSON.stringify(bridge)).not.toMatch(/abc\.def\.ghi|adapter stack/u)
    const report = composeQl7SupportAdminReport({ report: bridge.report })
    const html = renderQl7SupportAdminReportHtml(report)
    expect(html).toMatch(/отчёт оператору|Рекомендуемое действие/iu)
    expect(html).not.toMatch(/abc\.def\.ghi|adapter stack/u)
  })
})
