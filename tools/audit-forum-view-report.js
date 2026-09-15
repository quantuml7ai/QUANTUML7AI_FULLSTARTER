#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = process.cwd()

function read(relPath) {
  const abs = path.join(root, relPath)
  return fs.readFileSync(abs, 'utf8')
}

function hasAll(text, fragments) {
  return fragments.every((frag) => text.includes(frag))
}

function nowIso() {
  return new Date().toISOString()
}

function main() {
  const checks = []
  const risks = []

  const files = {
    db: 'app/api/forum/_db.js',
    snapshotRoute: 'app/api/forum/snapshot/route.js',
    mutateRoute: 'app/api/forum/mutate/route.js',
    syncLoop: 'app/forum/features/feed/hooks/useForumSyncLoop.js',
    reportController: 'app/forum/features/moderation/hooks/useReportController.js',
    sessionShell: 'app/forum/features/ui/hooks/useForumSessionShell.js',
  }

  const dbText = read(files.db)
  const snapshotRouteText = read(files.snapshotRoute)
  const mutateRouteText = read(files.mutateRoute)
  const syncLoopText = read(files.syncLoop)
  const reportControllerText = read(files.reportController)
  const sessionShellText = read(files.sessionShell)

  checks.push({
    check: 'snapshot_incremental_reads_recent_changes',
    ok: hasAll(dbText, ['redis.lrange(K.changes, 0, take - 1)', 'full: true, gap: true']),
  })

  checks.push({
    check: 'snapshot_route_accepts_incremental_full_fallback',
    ok: hasAll(snapshotRouteText, ['hasEventsShape', 'hasFullShape']),
  })

  checks.push({
    check: 'sync_loop_handles_full_fallback',
    ok: hasAll(syncLoopText, ['useFullFallback', 'applyFullSnapshotRef.current']),
  })

  checks.push({
    check: 'mutate_patches_snapshot_for_all_view_ops',
    ok: hasAll(mutateRouteText, [
      "op.type === 'view_topic'",
      "op.type === 'view_topics'",
      "op.type === 'view_posts'",
      'snapshotTopicPatch',
      'snapshotPostPatch',
      "patch: { topics: { [String(topicId)]: { views } } }",
    ]),
  })

  checks.push({
    check: 'report_db_returns_lock_owner',
    ok: hasAll(dbText, ['lockedUserId: authorId', 'setMediaLockUntil(authorId, lockedUntil)']),
  })

  checks.push({
    check: 'report_controller_applies_lock_only_to_target_user',
    ok: hasAll(reportControllerText, ['const lockTarget =', 'lockTarget === me']),
  })

  checks.push({
    check: 'media_lock_polling_enabled',
    ok: hasAll(sessionShellText, ['setInterval(refreshMediaLock, 15000)', 'visibilitychange']),
  })

  checks.forEach((item) => {
    if (!item.ok) risks.push(`failed_check:${item.check}`)
  })

  const status = risks.length ? 'failed' : 'ok'
  const report = {
    phase: '122',
    timestamp: nowIso(),
    scope: [
      files.db,
      files.snapshotRoute,
      files.mutateRoute,
      files.syncLoop,
      files.reportController,
      files.sessionShell,
    ],
    touched_files: Object.values(files),
    new_files: ['tools/audit-forum-view-report.js'],
    moved_logic_domains: [
      'feed/views sync',
      'snapshot incremental fallback',
      'report/media-lock ownership',
      'session media-lock polling',
    ],
    dependency_changes: {
      snapshot_sync: 'incremental now reads newest change window and supports full fallback on gaps',
      view_persistence: 'view_topic(s)/view_post(s) now patch full snapshot for freshness',
      report_locking: 'lock owner id returned and applied only for that user',
    },
    detected_risks: risks,
    detected_cycles: [],
    api_contract_risk: risks.length ? 'medium' : 'low',
    storage_risk: 'low',
    runtime_risk: risks.length ? 'medium' : 'low',
    notes: [
      'Static contract audit for views/report critical paths.',
      'Use together with build + heavy/effects/deps audits.',
    ],
    status,
    checks,
  }

  const outDir = path.join(root, 'audit')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'forum-phase-122-view-sync-report-flow.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
  process.stdout.write(`${outPath}\n`)
  if (status !== 'ok') process.exitCode = 1
}

main()

