import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { listProjectFiles, readRepoFile } from '../../support/projectSurface.js'

const require = createRequire(import.meta.url)
const canonicalUserId = require('../../../lib/identity/canonical-user-id.cjs')

const CHECKSUM = '0x51be760fA3775263D2C2496824f23Ca31d829e6A'
const LOWER = CHECKSUM.toLowerCase()

function functionSlice(source, startToken, endToken) {
  const start = source.indexOf(startToken)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = source.indexOf(endToken, start + startToken.length)
  expect(end).toBeGreaterThan(start)
  return source.slice(start, end)
}

describe('canonical human identity Stage 1-4 contract', () => {
  it('collapses every supported wallet and Telegram syntax to one canonical form', () => {
    expect(canonicalUserId.normalizeWalletId(LOWER)).toBe(CHECKSUM)
    expect(canonicalUserId.normalizeWalletId(`wallet:${LOWER}`)).toBe(CHECKSUM)
    expect(canonicalUserId.normalizeWalletId(CHECKSUM)).toBe(CHECKSUM)

    for (const value of [
      '6783588404',
      'telegram:6783588404',
      'telegramid:6783588404',
      'telegram:id:6783588404',
      'tguid:6783588404',
      'tg:6783588404',
      'tg:uid:6783588404',
      'tma:6783588404',
    ]) {
      expect(canonicalUserId.normalizeTelegramId(value)).toBe('6783588404')
    }
  })

  it('keeps legacy alias collections read-only in production', () => {
    const profile = readRepoFile('lib/mongo/profile-primary.cjs')
    const dm = readRepoFile('lib/mongo/dm-primary.cjs')

    const aliasWriter = functionSlice(
      profile,
      'async function writeCanonicalAliases(',
      'async function findAlias(',
    )
    expect(aliasWriter).toContain('return 0')
    expect(aliasWriter).not.toContain("collection('account_aliases')")
    expect(aliasWriter).not.toMatch(/\b(?:updateOne|updateMany|replaceOne|insertOne|insertMany|bulkWrite|findOneAndUpdate|findOneAndReplace)\s*\(/)

    const dmAliasWriter = functionSlice(
      dm,
      'async function addAliasesFor(',
      'async function expandAliasIds(',
    )
    expect(dmAliasWriter).toContain('return false')
    expect(dmAliasWriter).not.toContain("collection('dm_aliases')")
    expect(dmAliasWriter).not.toMatch(/\b(?:updateOne|updateMany|replaceOne|insertOne|insertMany|bulkWrite|findOneAndUpdate|findOneAndReplace)\s*\(/)

    const productionFiles = [
      ...listProjectFiles('app', (relPath) => /\.(?:js|jsx|mjs|cjs)$/.test(relPath)),
      ...listProjectFiles('lib', (relPath) => /\.(?:js|jsx|mjs|cjs)$/.test(relPath)),
    ]
    const forbidden = []
    for (const relPath of productionFiles) {
      const source = readRepoFile(relPath)
      if (/collection\(['"]account_aliases['"]\)[\s\S]{0,220}\.(?:updateOne|updateMany|replaceOne|insertOne|insertMany|bulkWrite|findOneAndUpdate|findOneAndReplace)\s*\(/.test(source)) {
        forbidden.push(`${relPath}:account_aliases`)
      }
      if (/collection\(['"]dm_aliases['"]\)[\s\S]{0,220}\.(?:updateOne|updateMany|replaceOne|insertOne|insertMany|bulkWrite|findOneAndUpdate|findOneAndReplace)\s*\(/.test(source)) {
        forbidden.push(`${relPath}:dm_aliases`)
      }
    }
    expect(forbidden).toEqual([])
  })

  it('routes permanent identity writers through the canonical adapter or DB-aware resolver', () => {
    const requiredTokens = {
      'app/api/wallet-session/route.js': ['normalizeWalletId'],
      'app/api/telegram/link/resolve/route.js': ['resolveCanonicalAccountId'],
      'app/api/metastudio/register/route.js': ['resolveCanonicalAccountId'],
      'app/api/academy/exam/route.js': ['aliases', 'writeExamState'],
      'app/api/debug/ads/grant/route.js': ['identityContract.resolve', 'adsOwnerId'],
      'app/api/debug/vip/grant/route.js': ['identityContract.resolve', 'vipEntitlementId'],      
      'app/api/aiquota/usage/route.js': ['quotaAccountReadCandidates', 'accountReadKeys'],
      'app/api/pay/webhook/route.js': ['resolveHumanAccountId', 'resolveCanonicalAccountId'],
      'lib/adsCore.js': ['resolveWriteAccountId', 'resolveCanonicalAccountId'],
      'lib/exchange/aiQuotaIdentity.js': ['normalizePrincipalSyntax'],
      'lib/identity/ql7IdentityContract.cjs': ['canonical-user-id.cjs'],
      'lib/mongo/battlecoin-primary.cjs': ['resolveAccountId', 'resolveAccountIdCandidates'],
      'lib/mongo/battlecoin-chat-primary.cjs': ['identityIds', 'readSenderState', 'authorIdentityIds: [accountId]'],
      'lib/mongo/dm-primary.cjs': ['resolveDmPrincipal'],
      'lib/mongo/forum-primary.cjs': ['resolveForumPrincipal'],
      'lib/mongo/metamarket-primary.cjs': ['resolveUserIdentity', 'metamarket_event_indexes'],
      'lib/mongo/metastudio-primary.cjs': ['registrationIdentityIds', 'legacyAccountIds'],
      'lib/mongo/profile-primary.cjs': ['principalId', 'canonicalAccountId', 'writeCanonicalAliases'],
      'lib/mongo/qcoin-primary.cjs': ['normalizePrincipalSyntax', 'resolveAccountUpdateFilter'],
      'lib/mongo/quest-primary.cjs': ['resolveQuestPrincipal', 'questReadIds'],
      'lib/mongo/referral-primary.cjs': ['referralIdentityIds', 'legacyUids', 'ownerKey', 'withMongoTransaction'],
      'lib/mongo/subscriptions-primary.cjs': ['legacyAccountIds', 'normalizePrincipalSyntax'],
      'lib/ql7-support/scheduler.js': ['normalizePrincipalSyntax'],
      'lib/subscriptions.js': ['resolveCanonicalAccountId', 'legacyAccountIds'],
    }

    for (const [relPath, tokens] of Object.entries(requiredTokens)) {
      const source = readRepoFile(relPath)
      for (const token of tokens) expect(source).toContain(token)
    }
  })

  it('writes one canonical forum subscription owner while retaining legacy read keys only', () => {
    const source = readRepoFile('lib/mongo/forum-primary.cjs')
    const writeIds = functionSlice(source, 'function subscriptionWriteIds(', 'function rankedRows(')
    const writer = functionSlice(source, 'async function writeSubscriptionRelationDocs(', 'async function setCountDoc(')
    const reader = functionSlice(source, 'async function readSubscriptionRowsForIdentity(', 'async function writeSetDoc(')

    expect(writeIds).toContain('return candidate ? [candidate] : []')
    expect(writer).toContain('followingZ:')
    expect(writer).toContain('followersZ:')
    expect(writer).not.toContain('viewer:')
    expect(writer).not.toMatch(/writeSetDoc\(`followers:/)

    expect(reader).toContain("['followingZ:', 'viewer:']")
    expect(reader).toContain("['followersZ:', 'followers:']")
    expect(reader).toContain('const sourceDocs = canonicalDocs.length ? canonicalDocs : docs')
  })

  it('preserves the current star EIP-55 compatibility bridge until Mongo compaction', () => {
    const source = readRepoFile(
      'app/forum/features/subscriptions/hooks/useStarredAuthorsState.js',
    )
    expect(source).toContain("import { getAddress } from 'viem'")
    expect(source).toContain('out.add(getAddress(wallet))')
  })


  it('keeps referral UI on the authoritative verified auth session instead of stale account storage', () => {
    const host = readRepoFile('components/InviteFriendHost.jsx')
    const provider = readRepoFile('components/InviteFriendProvider.jsx')

    for (const source of [host, provider]) {
      expect(source).toContain('readAuthorizedAccountId')
      expect(source).not.toContain("ls.getItem('account')")
      expect(source).not.toContain("ls.getItem('wallet')")
      expect(source).not.toContain("ls.getItem('asherId')")
      expect(source).not.toContain("ls.getItem('ql7_uid')")
    }
  })

  it('keeps Battle Chat alias candidates read-only while persisting only the canonical author identity', () => {
    const source = readRepoFile('lib/mongo/battlecoin-chat-primary.cjs')
    expect(source).toContain('authorIdentityIds: [accountId]')
    expect(source).toContain('const ids = identitySet([id, ...identityIds])')
    expect(source).toContain('nextAllowedAtMs = Math.max')
  })
  it('keeps account deletion alias-aware across every account-dependent contour', () => {
    const source = readRepoFile('lib/mongo/account-deletion-primary.cjs')
    for (const collection of [
      'account_aliases',
      'profile_geo_events',
      'notification_states',
      'dm_aliases',
      'academy_exams',
      'quest_progress',
      'referral_profiles',
      'battlecoin_order_history',
      'battlecoin_order_histories',
      'battlecoin_counters',
      'metamarket_events',
      'forum_user_post_index',
      'forum_user_topic_index',
      'forum_thread_index',
      'forum_geo_feed_index',
      'forum_user_stats',
      'forum_media_feed_index',
      'forum_reply_inbox_index',
      'forum_search_index',
      'metastudio_registrations',
      'ads_kv',
      'ads_sets',
    ]) {
      expect(source).toContain(`name: '${collection}'`)
    }
    expect(source).toContain("nestedExactAny('value'")
    expect(source).toContain('collectAdsContext')
    expect(source).toContain('removeAdsBusinessIdsFromSets')
    expect(source).toContain("'users.canonicalAccountId': { $in: ids }")
    expect(source).toContain("identityScope === 'canonical'")
    expect(source).toContain('buildSideIdentityIds')
    expect(source).toContain('linked_surviving_profiles')
    expect(source).toContain('redis_identity_records')
    expect(source).toContain('detachSurvivingLinkProfiles')
  })

  it('closes account deletion derived-state residues across DM and forum projections', () => {
    const source = readRepoFile('lib/mongo/account-deletion-primary.cjs')
    const plans = functionSlice(source, 'function makeBasePlans(', 'function readId(')

    expect(plans).toContain("name: 'forum_user_stats'")
    expect(plans).toContain("name: 'forum_reply_inbox_index'")
    expect(plans).toContain("name: 'forum_media_feed_index'")
    expect(plans).toContain("name: 'notification_states'")
    expect(plans).toContain("name: 'profile_geo_events'")
    expect(plans).toContain("containsAny('threadKey', ids)")

    const deletedDialogPlan = plans
      .split('\n')
      .find((line) => line.includes("name: 'dm_deleted_dialogs'")) || ''

    expect(deletedDialogPlan).not.toContain("'peerId'")
    expect(source).toContain('async function buildDmDeletionContext(')
    expect(source).toContain('async function collectDmRelatedDeletionDocs(')
    expect(source).toContain('async function writeDmAccountDeletionTombstones(')
    expect(source).toContain('async function reconcileForumParentReplyCountsAfterDeletion(')
    expect(source).toContain('async function reconcileTouchedForumUserStats(')
    expect(source).toContain('dm_peer_account_deleted_tombstones')
    expect(source).toContain('forum_user_stats_reconciled')
  })

  it('keeps repeated account deletion archives retry-safe without overwriting prior evidence', () => {
    const source = readRepoFile(
      'lib/mongo/account-deletion-primary.cjs',
    )

    expect(source).toContain(
      'function isDuplicateArchiveKeyError(error)',
    )

    expect(source).toMatch(
      /const\s+baseArchiveKey\s*=\s*`deleted_account:\$\{accountId\}`/,
    )

    expect(source).toMatch(
      /if\s*\(\s*!isDuplicateArchiveKeyError\(error\)\s*\)/,
    )

    expect(source).toMatch(
      /root\.archiveKey\s*=\s*`\$\{baseArchiveKey\}:\$\{deletionId\}`/,
    )

    expect(source).not.toContain(
      'replaceOne({ archiveKey:',
    )
  })
})
