import { afterEach, describe, expect, it, vi } from 'vitest'
const ENV_KEYS = [
  'NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_EVERY',
  'NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_BATCH_SIZE',
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

  it('reads the public recommendation env values and derives the enabled flag', async () => {
    const { readForumRuntimeConfig } = await loadRuntimeModule({
      env: {
        NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_EVERY: '6',
        NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_BATCH_SIZE: '12',
      },
    })

    const runtime = readForumRuntimeConfig()

    expect(runtime.userRecommendations).toMatchObject({
      enabled: true,
      every: 6,
      batchSize: 12,
    })
    expect(runtime.userRecommendations.prefetchRailsAhead).toBe(3)
  })

  it('lets window.__FORUM_CONF__ override env values and disable the module via cadence', async () => {
    const { readForumRuntimeConfig } = await loadRuntimeModule({
      env: {
        NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_EVERY: '8',
        NEXT_PUBLIC_FORUM_USER_RECOMMENDATIONS_BATCH_SIZE: '15',
      },
      forumConf: {
        FORUM_USER_RECOMMENDATIONS_EVERY: 0,
        FORUM_USER_RECOMMENDATIONS_BATCH_SIZE: 9,
      },
    })

    const runtime = readForumRuntimeConfig()

    expect(runtime.userRecommendations).toMatchObject({
      enabled: false,
      every: 0,
      batchSize: 9,
    })
  })
})
