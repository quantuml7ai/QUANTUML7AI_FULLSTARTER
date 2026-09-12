import { describe, expect, test, vi, beforeEach } from 'vitest'

const routeHarness = vi.hoisted(() => ({
  state: {
    requestUserId: '',
    aliases: {},
    about: {},
    followers: {},
    posts: {},
    topics: {},
    likes: {},
    counts: {},
    profiles: {},
    vip: {},
  },
}))

vi.mock('../../../../app/api/forum/_utils.js', () => ({
  requireUserId: vi.fn(() => {
    if (!routeHarness.state.requestUserId) {
      const err = new Error('unauthorized')
      err.status = 401
      throw err
    }
    return routeHarness.state.requestUserId
  }),
}))

vi.mock('../../../../app/api/profile/_identity.js', () => ({
  resolveCanonicalAccountId: vi.fn(async (id) => routeHarness.state.aliases[id] || id),
}))

vi.mock('../../../../app/api/forum/_db.js', () => ({
  getFollowersCount: vi.fn(async (id) => routeHarness.state.followers[id] || 0),
  getSubscriptionCounts: vi.fn(async (id) => routeHarness.state.counts[id] || { followers: 0, following: 0 }),
  getUserAbout: vi.fn(async (id) => routeHarness.state.about[id] || ''),
  getUserPostsTotal: vi.fn(async (id) => routeHarness.state.posts[id] || 0),
  getUserProfile: vi.fn(async (id) => routeHarness.state.profiles[id] || { nickname: '', icon: '' }),
  getUserTopicsTotal: vi.fn(async (id) => routeHarness.state.topics[id] || 0),
  getUserLikesTotal: vi.fn(async (id) => routeHarness.state.likes[id] || 0),
}))

vi.mock('../../../../lib/subscriptions.js', () => ({
  isVipNowReadOnly: vi.fn(async (id) => ({ active: !!routeHarness.state.vip[id] })),
}))

describe('/api/profile/user-popover Mongo identity compatibility', () => {
  beforeEach(() => {
    routeHarness.state.requestUserId = ''
    routeHarness.state.aliases = {}
    routeHarness.state.about = {}
    routeHarness.state.followers = {}
    routeHarness.state.posts = {}
    routeHarness.state.topics = {}
    routeHarness.state.likes = {}
    routeHarness.state.counts = {}
    routeHarness.state.profiles = {}
    routeHarness.state.vip = {}
    vi.resetModules()
  })

  test('keeps canonical wallet totals while accepting a linked Telegram/raw id', async () => {
    routeHarness.state.aliases['telegram:777001'] = '0xabc'
    routeHarness.state.about['0xabc'] = 'canonical about'
    routeHarness.state.profiles['0xabc'] = { nickname: 'Wallet Name', icon: '/avatars/wallet.png' }
    routeHarness.state.profiles['telegram:777001'] = { nickname: 'TMA Name', icon: '/avatars/tma.png' }
    routeHarness.state.posts['0xabc'] = 9
    routeHarness.state.posts['telegram:777001'] = 3
    routeHarness.state.topics['0xabc'] = 4
    routeHarness.state.likes['0xabc'] = 12
    routeHarness.state.counts['0xabc'] = { followers: 15, following: 7 }
    routeHarness.state.counts['telegram:777001'] = { followers: 2, following: 1 }
    routeHarness.state.vip['0xabc'] = true

    const { GET } = await import('../../../../app/api/profile/user-popover/route.js')
    const res = await GET(new Request('https://example.test/api/profile/user-popover?uid=telegram:777001'))
    const json = await res.json()

    expect(json).toMatchObject({
      ok: true,
      accountId: '0xabc',
      nickname: 'Wallet Name',
      icon: '/avatars/wallet.png',
      vipActive: true,
      about: 'canonical about',
      stats: {
        followers: 15,
        following: 7,
        posts: 9,
        topics: 4,
        likes: 12,
      },
    })
  })

  test('uses legacy profile fields only when the canonical profile is empty', async () => {
    routeHarness.state.aliases['telegram:777002'] = '0xdef'
    routeHarness.state.profiles['0xdef'] = { nickname: '', icon: '' }
    routeHarness.state.profiles['telegram:777002'] = { nickname: 'Legacy TMA', icon: '/avatars/legacy.png' }

    const { GET } = await import('../../../../app/api/profile/user-popover/route.js')
    const res = await GET(new Request('https://example.test/api/profile/user-popover?uid=telegram:777002'))
    const json = await res.json()

    expect(json).toMatchObject({
      ok: true,
      accountId: '0xdef',
      nickname: 'Legacy TMA',
      icon: '/avatars/legacy.png',
    })
  })
})
