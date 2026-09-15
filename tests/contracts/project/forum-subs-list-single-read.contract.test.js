import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const ROOT = process.cwd()
const readRepoFile = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')

describe('forum subscriptions list single-read contract', () => {
  test('keeps one alias-aware relation read while preserving canonical output and legacy/TMA compatibility', () => {
    const route = readRepoFile('app/api/forum/subs/list/route.js')
    const mongo = readRepoFile('lib/mongo/forum-primary.cjs')

    const routeCalls = route.match(/listSubscriptions\(/g) || []
    expect(routeCalls).toHaveLength(1)
    expect(route).toContain('listSubscriptions(viewerIdRaw)')
    expect(route).not.toContain('listSubscriptions(viewerId)')
    expect(route).toContain('resolveCanonicalAccountId(viewerIdRaw)')
    expect(route).toContain('resolveCanonicalAccountIds(rawAuthors)')
    expect(route).toContain("aliases[raw] || raw")
    expect(route).not.toContain('canonicalAuthors')
    expect(route).not.toContain('legacyAuthors')

    // The one-read optimization is safe only because the lower Mongo reader keeps
    // every historical owner key as READ compatibility while canonical Z state wins.
    expect(mongo).toContain("['followingZ:', 'viewer:']")
    expect(mongo).toContain("['followersZ:', 'followers:']")
    expect(mongo).toContain('const sourceDocs = canonicalDocs.length ? canonicalDocs : docs')
    expect(mongo).toContain('row?.tgId')
    expect(mongo).toContain('row?.tg_id')
    expect(mongo).toContain('target.add(`tma:${telegramId}`)')
  })
})
