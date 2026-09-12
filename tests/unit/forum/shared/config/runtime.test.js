import { afterEach, describe, expect, it, vi } from 'vitest'
const ENV_KEYS = [
  'NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_EVERY',
]

async function loadRuntimeModule({ env = {}, forumConf } = {}) {
  ENV_KEYS.forEach((key) => {
    delete process.env[key]
  })
  Object.assign(process.env, env)

  if (forumConf === undefined) {
    delete globalThis.window
  } else {
    globalThis.window = { __FORUM_CONF__: forumConf }
  }

  vi.resetModules()
  return import('../../../../../app/forum/shared/config/runtime.js')
}

describe('readForumRuntimeConfig', () => {
  afterEach(() => {
    ENV_KEYS.forEach((key) => {
      delete process.env[key]
    })
    delete globalThis.window
    vi.resetModules()
  })

  it('keeps the recommendation rail at exactly 15 while cadence remains configurable', async () => {
    const { readForumRuntimeConfig } = await loadRuntimeModule({
      env: {
        NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_EVERY: '6',
              },
    })

    const runtime = readForumRuntimeConfig()

    expect(runtime.userRecommendations).toMatchObject({
      enabled: true,
      every: 6,
      batchSize: 15,
    })
    expect(runtime.userRecommendations.prefetchRailsAhead).toBe(3)
  })

  it('lets window.__FORUM_CONF__ disable via cadence but cannot shrink the 15-user rail', async () => {
    const { readForumRuntimeConfig } = await loadRuntimeModule({
      env: {
        NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_EVERY: '8',
      },
      forumConf: {
        FORUM_USER_RECOMMENDATIONS_EVERY: 0,
        FORUM_USER_RECOMMENDATIONS_BATCH_SIZE: 6,
      },
    })

    const runtime = readForumRuntimeConfig()

    expect(runtime.userRecommendations).toMatchObject({
      enabled: false,
      every: 0,
      batchSize: 15,
    })
  })
  it('ignores a stale public batch-size env override such as 6', async () => {
    process.env.NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_BATCH_SIZE = '6'
    const { readForumRuntimeConfig } = await loadRuntimeModule({
      env: { NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_EVERY: '8' },
    })
    expect(readForumRuntimeConfig().userRecommendations.batchSize).toBe(15)
    delete process.env.NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_BATCH_SIZE
  })

})
