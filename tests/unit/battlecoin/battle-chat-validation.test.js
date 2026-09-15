import { createRequire } from 'node:module'
import { describe, expect, test } from 'vitest'
import {
  BATTLE_CHAT_RECONNECT_INITIAL_MS,
  BATTLE_CHAT_RECONNECT_MAX_MS,
  battleChatReconnectDelay,
} from '../../../app/exchange/battle-chat/battleChatClient.js'

const require = createRequire(import.meta.url)
const validation = require('../../../lib/battlecoin/battle-chat-validation.cjs')

describe('Battle Chat validation contract', () => {
  test('keeps fixed production constants', () => {
    expect(validation.BATTLE_CHAT_CHANNEL).toBe('global')
    expect(validation.BATTLE_CHAT_INITIAL_LIMIT).toBe(100)
    expect(validation.BATTLE_CHAT_SERVER_MAX_LIMIT).toBe(100)
    expect(validation.BATTLE_CHAT_MESSAGE_MAX_GRAPHEMES).toBe(190)
    expect(validation.BATTLE_CHAT_SEND_COOLDOWN_MS).toBe(10_000)
    expect(validation.BATTLE_CHAT_SESSION_HARD_LIMIT).toBe(1000)
    expect(validation.BATTLE_CHAT_QUICK_EMOJIS).toEqual(['\u2764\uFE0F', '\u{1F604}', '\u{1F621}'])
  })

  test('allows market text and quick emoji without links', () => {
    const result = validation.validateBattleChatText('BTC/USDT LONG x10 looks strong \u{1F604}')
    expect(result).toMatchObject({ ok: true, text: 'BTC/USDT LONG x10 looks strong \u{1F604}' })
    expect(result.graphemes).toBeGreaterThan(0)
  })

  test('blocks links and common obfuscation forms', () => {
    const samples = [
      'https://example.com',
      'www.example.com',
      'trader dot com',
      't.me/channel',
      'youtube.com/watch?v=1',
      '[click](https://example.com)',
      'user@example.com',
      'hxxps://example.com',
      'example\uFF0Ecom',
    ]
    for (const sample of samples) {
      expect(validation.validateBattleChatText(sample).error).toBe('battlecoin_chat_links_forbidden')
    }
  })

  test('enforces 190 grapheme limit', () => {
    const ok = validation.validateBattleChatText('\u{1F525}'.repeat(190))
    const bad = validation.validateBattleChatText('\u{1F525}'.repeat(191))
    expect(ok.ok).toBe(true)
    expect(bad).toMatchObject({ ok: false, error: 'battlecoin_chat_too_long' })
  })

  test('uses bounded exponential reconnect delays without changing the first retry', () => {
    expect(BATTLE_CHAT_RECONNECT_INITIAL_MS).toBe(1800)
    expect(BATTLE_CHAT_RECONNECT_MAX_MS).toBe(30000)
    expect([0, 1, 2, 3, 4, 5, 20].map(battleChatReconnectDelay)).toEqual([
      1800,
      3600,
      7200,
      14400,
      28800,
      30000,
      30000,
    ])
    expect(battleChatReconnectDelay(-5)).toBe(1800)
    expect(battleChatReconnectDelay(Number.NaN)).toBe(1800)
  })
})
