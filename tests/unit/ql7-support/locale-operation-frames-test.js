import { describe, expect, it } from 'vitest'

import {
  QL7_SUPPORT_LOCALE_OPERATION_FRAMES,
  QL7_SUPPORT_REQUIRED_OPERATION_FRAME_KEYS,
  auditQl7SupportLocaleOperationFrames,
  realizeQl7SupportLocaleOperationFrame,
} from '../../../lib/ql7-support/language/localeOperationFrames.js'
import { QL7_SUPPORT_PROFILE_LOCALES } from '../../../lib/ql7-support/language/locales/manifest.js'

describe('QL7 Support locale operation frames canonical.1', () => {
  it('owns every required operation for exactly 32 locale profiles', () => {
    const audit = auditQl7SupportLocaleOperationFrames()

    expect(Object.keys(QL7_SUPPORT_LOCALE_OPERATION_FRAMES)).toEqual(QL7_SUPPORT_PROFILE_LOCALES)
    expect(audit).toMatchObject({
      ok: true,
      localeCount: 32,
      operationCount: 33,
      entryCount: 1056,
      readyToSendRows: 0,
      finalSentenceRows: 0,
      semanticProjection: true,
      failures: [],
    })
    expect(QL7_SUPPORT_REQUIRED_OPERATION_FRAME_KEYS).toHaveLength(33)
  })

  it('realizes slots reproducibly and exposes typed provenance', () => {
    const first = realizeQl7SupportLocaleOperationFrame('ru', 'clarify', {
      topic: 'QCoin',
      detail: 'баланс или историю операций',
    }, 'same-seed')
    const replay = realizeQl7SupportLocaleOperationFrame('ru', 'clarify', {
      topic: 'QCoin',
      detail: 'баланс или историю операций',
    }, 'same-seed')

    expect(first).toEqual(replay)
    expect(first.text).toContain('QCoin')
    expect(first.text).toContain('баланс или историю операций')
    expect(first.entryId).toMatch(/^ru\.operation-frame\.clarify\./u)
    expect(first.contentHash).toMatch(/^[a-f0-9]{8}$/u)
  })

  it('fails closed instead of falling back to another locale or incomplete frame', () => {
    expect(() => realizeQl7SupportLocaleOperationFrame('xx', 'greeting')).toThrow(
      'ql7_locale_operation_frame_missing:xx:greeting',
    )
    expect(() => realizeQl7SupportLocaleOperationFrame('ru', 'unknown')).toThrow(
      'ql7_locale_operation_frame_missing:ru:unknown',
    )
    expect(() => realizeQl7SupportLocaleOperationFrame('ru', 'clarify', { topic: 'QCoin' })).toThrow(
      'ql7_locale_operation_frame_context_missing:ru:clarify:detail',
    )
  })
})
