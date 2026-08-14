import crypto from 'node:crypto'
import { executeQl7SupportProductionTurn } from '../runtime/productionTurn.js'

const str = (value) => String(value ?? '').trim()
const lower = (value) => str(value).toLowerCase()
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
const unique = (values = []) => [...new Set(values.map(str).filter(Boolean))]

function mask(value = '') {
  const s = str(value)
  return s.length > 14 ? `${s.slice(0, 6)}...${s.slice(-6)}` : s ? `${s.slice(0, 3)}***` : ''
}

function redactText(value = '') {
  return str(value)
    .replace(/0x[a-f0-9]{40}/giu, (match) => mask(match))
    .replace(/\b\d{6,15}\b/gu, (match) => mask(match))
}

function clean(value, depth = 0) {
  if (depth > 10) return null
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => clean(item, depth + 1))
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/(token|secret|password|cookie|authorization|uri|private|seed|raw)/iu.test(key))
        .map(([key, item]) => [key, clean(item, depth + 1)]),
    )
  }
  const s = redactText(value)
  return s.length > 1200 ? `${s.slice(0, 1200)}...` : s
}

function clauses(ids) {
  return [
    { _id: { $in: ids } },
    { accountId: { $in: ids } },
    { canonicalAccountId: { $in: ids } },
    { userId: { $in: ids } },
    { uid: { $in: ids } },
    { ownerId: { $in: ids } },
    { walletAddress: { $in: ids } },
    { wallet: { $in: ids } },
    { telegramId: { $in: ids } },
    { alias: { $in: ids } },
    { aliasId: { $in: ids } },
  ]
}

function fieldClauses(ids, fields = []) {
  return fields.map((field) => ({ [field]: { $in: ids } }))
}

function hasObjectData(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0
}

async function rows(db, name, filter, limit = 20, sort = { updatedAt: -1, createdAt: -1, _id: -1 }) {
  try {
    return await db.collection(name).find(filter).sort(sort).limit(limit).toArray()
  } catch {
    return []
  }
}

async function one(db, name, filter, projection = {}) {
  try {
    return await db.collection(name).findOne(filter, { projection })
  } catch {
    return null
  }
}

function receipt(adapter, result, resultKind = 'verified', source = 'mongo') {
  const executed = resultKind !== 'unavailable'
  return Object.freeze({
    id: `live:${adapter}:${hash(result).slice(0, 20)}`,
    adapter,
    executed,
    sourceType: 'production_read',
    source,
    actorScope: 'self',
    resultKind,
    result: clean(result),
    durationMs: 0,
    writeCount: 0,
    evidenceHash: hash(result),
    checkedAt: executed ? new Date().toISOString() : undefined,
    error: executed ? undefined : 'source_unavailable',
  })
}

function buildSubscriptionKeys(ids = []) {
  return unique(
    ids.flatMap((id) => [
      `followers:${id}`,
      `followersZ:${id}`,
      `viewer:${id}`,
      `followingZ:${id}`,
      `following:${id}`,
    ]),
  )
}

function countSubscriptionDoc(doc = {}) {
  if (Array.isArray(doc.members)) return unique(doc.members).length
  if (Array.isArray(doc.rows)) return unique(doc.rows.map((row) => row?.member || row?.userId || row?.id)).length
  return Number(doc.count ?? doc.value ?? 0) || 0
}

function maxByPrefix(docs = [], prefixes = []) {
  let out = 0
  for (const doc of docs) {
    const id = lower(doc?._id)
    if (!prefixes.some((prefix) => id.startsWith(lower(prefix)))) continue
    out = Math.max(out, countSubscriptionDoc(doc))
  }
  return out
}

function sampleSubscriptionMembers(docs = [], prefixes = []) {
  const out = []
  for (const doc of docs) {
    const id = lower(doc?._id)
    if (!prefixes.some((prefix) => id.startsWith(lower(prefix)))) continue
    const rowsFromMembers = Array.isArray(doc.members) ? doc.members.map((member) => ({ member })) : []
    const sourceRows = Array.isArray(doc.rows) ? doc.rows : rowsFromMembers
    for (const row of sourceRows) {
      const member = str(row?.member || row?.userId || row?.id)
      if (!member) continue
      out.push(mask(member))
      if (out.length >= 8) return unique(out)
    }
  }
  return unique(out)
}

function summarizeReports(rowsToSummarize = []) {
  return rowsToSummarize.slice(0, 12).map((row) => ({
    postId: row?.postId || row?.id || row?._id,
    reason: row?.reason || row?.reportType || row?.type,
    status: row?.status || row?.action || 'counted',
    createdAt: row?.createdAt || row?.ts,
    updatedAt: row?.updatedAt,
  }))
}

function summarizeEvents(rowsToSummarize = []) {
  return rowsToSummarize.slice(0, 12).map((row) => ({
    kind: row?.kind || row?.eventType || row?.type || row?.action,
    postId: row?.postId || row?.data?.postId,
    reason: row?.reason || row?.data?.reason || row?.reportType,
    status: row?.status || row?.data?.status,
    rev: row?.rev,
    createdAt: row?.createdAt || row?.ts || row?.updatedAt,
  }))
}

export async function readQl7LiveUserSnapshot({
  database,
  walletId = '',
  telegramId = '',
  locale = 'ru',
  services = {},
} = {}) {
  const identityModule = services.identityGraph || await import('../identityGraphV8.js')
  const vipDiagnostic = services.vipDiagnostic || (await import('../vipResolverV8.js')).runQl7SupportVipDiagnosticV8
  const adsDiagnostic = services.adsDiagnostic || (await import('../adsSupportReadAdapterV9.js')).readQl7SupportAdsDiagnosticV9
  const ratingCalculator = services.ratingCalculator || (await import('../ecosystemRating.js')).calculateQl7EcosystemRating
  const buildIdentity = identityModule.buildQl7IdentityGraphV8 || identityModule.build
  const publicIdentity = identityModule.publicQl7IdentityGraphProjectionV8 || identityModule.publicProjection

  if (!database?.collection) throw new Error('mongo_database_unavailable')

  const seeds = unique([
    str(walletId),
    str(telegramId),
    telegramId ? `telegram:${telegramId}` : '',
    telegramId ? `tg:${telegramId}` : '',
  ])
  if (!seeds.length) throw new Error('live_identity_required')

  const actor = {
    valid: true,
    authMode: 'read_only_evidence',
    canonicalAccountId: str(walletId) || str(telegramId),
    aliases: seeds,
  }
  const graph = await buildIdentity({ database, actor, extraAliases: seeds, maxNodes: 64, maxDepth: 3 })
  const canonicalAccountId = str(graph.canonicalAccountId) || actor.canonicalAccountId
  const resolvedActor = { ...actor, canonicalAccountId }
  const ids = unique([...(graph.lookupIds || []), ...seeds])
  const filter = { $or: clauses(ids) }

  const profile = await one(database, 'profiles', filter, {
    _id: 1,
    accountId: 1,
    canonicalAccountId: 1,
    userId: 1,
    nickname: 1,
    nick: 1,
    locale: 1,
    language: 1,
    createdAt: 1,
    registeredAt: 1,
    lastActivityAt: 1,
    lastSeenAt: 1,
    updatedAt: 1,
    stats: 1,
    postsCount: 1,
    topicsCount: 1,
    likesCount: 1,
    followersCount: 1,
    followingCount: 1,
    _geoCurrent: 1,
  })

  const telegramLinks = await rows(database, 'telegram_links', filter, 20)
  const qcoinAccount = await one(database, 'qcoin_accounts', filter)
  const qcoinLedger = await rows(database, 'qcoin_ledger', filter, 40, { createdAt: -1, ts: -1, _id: -1 })
  const invoices = await rows(database, 'qcoin_topup_invoices', filter, 15, { createdAt: -1, _id: -1 })

  const vip = await vipDiagnostic({
    database,
    userId: canonicalAccountId,
    aliases: ids,
    actor: resolvedActor,
    caseId: `read-only:${hash(ids).slice(0, 12)}`,
  }).catch(() => null)
  const ads = await adsDiagnostic({
    database,
    userId: canonicalAccountId,
    aliases: ids,
    analysis: {
      messageAct: 'personal_status_request',
      subIntent: 'ads_packages_self_status',
      operation: 'check_status',
      entities: { selfReference: true },
    },
  }).catch(() => null)

  const forumStats = await one(database, 'forum_user_stats', filter)
  const forumPosts = await rows(database, 'forum_core_posts', filter, 12, { createdAt: -1, _id: -1 })
  const forumTopics = await rows(database, 'forum_core_topics', filter, 12, { createdAt: -1, _id: -1 })

  const subscriptionKeys = buildSubscriptionKeys(ids)
  const subscriptionFilter = { $or: [{ _id: { $in: subscriptionKeys } }] }
  const subscriptionSetRows = await rows(database, 'forum_subscription_sets', subscriptionFilter, 80)
  const subscriptionCountRows = await rows(database, 'forum_subscription_counts', subscriptionFilter, 40)

  const reportIdentityClauses = fieldClauses(ids, [
    'reporterId',
    'reporterKey',
    'userId',
    'accountId',
    'canonicalAccountId',
    'authorId',
    'lockedUserId',
    'data.userId',
    'data.accountId',
    'data.authorId',
    'data.reporterId',
  ])
  const reportsByUser = await rows(database, 'forum_reports', { $or: reportIdentityClauses }, 30, {
    createdAt: -1,
    updatedAt: -1,
    _id: -1,
  })
  const postIds = unique(forumPosts.map((post) => post?._id || post?.id || post?.postId))
  const reportsOnPostRows = postIds.length
    ? await rows(database, 'forum_reports', { postId: { $in: postIds } }, 80, { createdAt: -1, updatedAt: -1, _id: -1 })
    : []
  const coreChangeEvents = await rows(database, 'forum_core_change_events', { $or: reportIdentityClauses }, 30, {
    ts: -1,
    createdAt: -1,
    rev: -1,
    _id: -1,
  })
  const supportAdminEvents = await rows(database, 'ql7_support_admin_events', { $or: reportIdentityClauses }, 20, {
    createdAt: -1,
    updatedAt: -1,
    _id: -1,
  })

  const marketItems = await rows(database, 'metamarket_user_items', filter, 20)
  const marketEvents = await rows(database, 'metamarket_events', filter, 30, { createdAt: -1, ts: -1, _id: -1 })
  const marketOwners = await rows(database, 'metamarket_owners', filter, 20)
  const battlecoinActiveOrders = await rows(database, 'battlecoin_active_orders', filter, 20, { updatedAt: -1, createdAt: -1, _id: -1 })
  const battlecoinHistory = await rows(database, 'battlecoin_order_history', filter, 30, { closedAt: -1, updatedAt: -1, createdAt: -1, _id: -1 })
  const battlecoinLegacyHistory = await rows(database, 'battlecoin_order_histories', filter, 20, { closedAt: -1, updatedAt: -1, createdAt: -1, _id: -1 })
  const battlecoinCounters = await rows(database, 'battlecoin_counters', { _id: { $in: ids.map((id) => `battlecoin:orderId:${id}`) } }, 20)

  const supportCases = await rows(database, 'ql7_support_cases', filter, 20, { createdAt: -1, updatedAt: -1, _id: -1 })
  const supportDiagnostics = await rows(database, 'ql7_support_diagnostic_runs', filter, 20, { createdAt: -1, updatedAt: -1, _id: -1 })
  const supportOutbox = await rows(database, 'support_email_outbox', filter, 12, { createdAt: -1, updatedAt: -1, _id: -1 })

  const stats = profile?.stats || {}
  const subscriptionResult = {
    followers: Math.max(
      Number(stats.followers ?? profile?.followersCount ?? forumStats?.followers ?? 0) || 0,
      maxByPrefix(subscriptionSetRows, ['followers:', 'followersZ:']),
      maxByPrefix(subscriptionCountRows, ['followers:']),
    ),
    following: Math.max(
      Number(stats.following ?? profile?.followingCount ?? forumStats?.following ?? 0) || 0,
      maxByPrefix(subscriptionSetRows, ['viewer:', 'followingZ:', 'following:']),
      maxByPrefix(subscriptionCountRows, ['following:']),
    ),
    sourceRows: {
      countRows: subscriptionCountRows.length,
      setRows: subscriptionSetRows.length,
    },
    sample: {
      followers: sampleSubscriptionMembers(subscriptionSetRows, ['followers:', 'followersZ:']),
      following: sampleSubscriptionMembers(subscriptionSetRows, ['viewer:', 'followingZ:', 'following:']),
    },
  }

  const reportsOnPosts = Math.max(
    Number(stats.reportsOnPosts ?? forumStats?.reportsOnPosts ?? 0) || 0,
    reportsOnPostRows.length,
  )
  const complaintsFiledByUser = Math.max(
    Number(stats.complaintsFiledByUser ?? forumStats?.complaintsFiledByUser ?? 0) || 0,
    reportsByUser.length,
  )
  const moderationFlags = Math.max(
    Number(stats.moderationFlags ?? forumStats?.moderationFlags ?? 0) || 0,
    coreChangeEvents.filter((row) => /ban|lock|delete|restriction|moderation/iu.test(str(row?.kind || row?.type || row?.action))).length,
    supportAdminEvents.length,
  )
  const moderationResult = {
    reportsOnPosts,
    complaintsFiledByUser,
    moderationFlags,
    recentComplaintsByUser: summarizeReports(reportsByUser),
    recentReportsOnUserPosts: summarizeReports(reportsOnPostRows),
    recentModerationEvents: summarizeEvents([...coreChangeEvents, ...supportAdminEvents]),
    privacy: 'reporter identities and raw admin payloads are not exposed in user-facing support evidence',
  }

  const activity = {
    posts: Number(stats.posts ?? stats.postsTotal ?? profile?.postsCount ?? forumStats?.posts ?? forumPosts.length) || 0,
    topics: Number(stats.topics ?? stats.topicsTotal ?? profile?.topicsCount ?? forumStats?.topics ?? forumTopics.length) || 0,
    likes: Number(stats.likes ?? stats.likesTotal ?? profile?.likesCount ?? forumStats?.likes ?? 0) || 0,
    followers: subscriptionResult.followers,
    following: subscriptionResult.following,
    reportsOnPosts,
    complaintsFiledByUser,
    moderationFlags,
    successfulOperations: qcoinLedger.length + marketEvents.length + battlecoinHistory.length + battlecoinLegacyHistory.length,
    vipActive: vip?.active === true,
  }
  const rating = ratingCalculator({
    profile: { ...profile, userId: canonicalAccountId },
    activity,
    violations: { confirmed: moderationFlags, suspiciousPatterns: reportsOnPosts },
    support: { abandonedCases: 0 },
  })

  const qcoinResult = {
    balance: Number(qcoinAccount?.balance ?? qcoinAccount?.amount ?? qcoinAccount?.available ?? 0) || 0,
    available: Number(qcoinAccount?.available ?? qcoinAccount?.balance ?? 0) || 0,
    pending: Number(qcoinAccount?.pending ?? 0) || 0,
    ledger: qcoinLedger.slice(0, 20).map((row) => ({
      type: row.type || row.operation || row.kind,
      amount: row.amount ?? row.value,
      status: row.status,
      createdAt: row.createdAt || row.ts,
    })),
    invoices: invoices.slice(0, 10).map((row) => ({
      status: row.status,
      amount: row.amount,
      currency: row.currency,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
  }
  const vipResult = {
    active: vip?.active === true,
    status: vip?.status || vip?.branch || (vip?.active ? 'active' : 'inactive'),
    tier: vip?.plan || vip?.tier || '',
    expiresAt: vip?.expiresAt || '',
    daysLeft: vip?.daysLeft ?? null,
    checks: vip?.checks || [],
  }
  const adsPackageResult = {
    packageName: ads?.evidence?.packageName || ads?.packageName || ads?.plan || 'ELITE',
    status: ads?.status || ads?.branch || 'unknown',
    usedSlots: ads?.evidence?.usedSlots ?? ads?.evidence?.slotsUsed,
    slotLimit: ads?.evidence?.slotLimit ?? ads?.evidence?.slotsLimit,
    activeCampaignCount: ads?.evidence?.activeCampaignCount ?? ads?.evidence?.campaignCount ?? 0,
    source: ads?.sourceAdapter,
  }
  const campaigns = Array.isArray(ads?.evidence?.campaigns) ? ads.evidence.campaigns : []
  const geoResult = {
    current: profile?._geoCurrent || {},
    source: 'profiles._geoCurrent',
    privacy: 'safe coarse projection only',
  }
  const supportResult = {
    cases: supportCases.length,
    diagnostics: supportDiagnostics.length,
    operatorEmails: supportOutbox.length,
    recentCases: supportCases.slice(0, 8).map((row) => ({
      caseId: row.caseId || row._id,
      status: row.status,
      topic: row.topic || row.analysis?.topic,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
  }

  const geoReceipt = receipt('geo', geoResult, hasObjectData(geoResult.current) ? 'verified' : 'verified_empty', 'profiles._geoCurrent')
  const receiptMap = {
    profile: receipt('profile', {
      nickname: profile?.nickname || profile?.nick || '',
      locale: profile?.locale || profile?.language || locale,
      createdAt: profile?.createdAt || profile?.registeredAt,
      lastActivityAt: profile?.lastActivityAt || profile?.lastSeenAt || profile?.updatedAt,
      activity,
      rating,
      geo: profile?._geoCurrent || {},
    }, profile ? 'verified' : 'unavailable', 'profiles+forum_user_stats'),
    geo: geoReceipt,
    geodetect: geoReceipt,
    qcoin: receipt('qcoin', qcoinResult, qcoinAccount || qcoinLedger.length ? 'verified' : 'verified_empty', 'qcoin_accounts+qcoin_ledger+qcoin_topup_invoices'),
    vip: receipt('vip', vipResult, vip ? 'verified' : 'unavailable', 'vip_subscriptions'),
    ads_packages: receipt('ads_packages', adsPackageResult, ads?.status === 'unavailable' ? 'unavailable' : Number(adsPackageResult.activeCampaignCount) === 0 ? 'verified_empty' : 'verified', 'ads_read_adapter_v9'),
    ads_campaigns: receipt('ads_campaigns', { campaigns }, ads?.status === 'unavailable' ? 'unavailable' : campaigns.length ? 'verified' : 'verified_empty', 'ads_read_adapter_v9'),
    forum: receipt('forum', {
      ...activity,
      recentPosts: forumPosts.length,
      recentTopics: forumTopics.length,
    }, forumStats || forumPosts.length || forumTopics.length ? 'verified' : 'verified_empty', 'forum_user_stats+forum_core'),
    quantum_family: receipt('quantum_family', subscriptionResult, subscriptionSetRows.length || subscriptionCountRows.length ? 'verified' : 'verified_empty', 'forum_subscription_counts+forum_subscription_sets'),
    moderation: receipt('moderation', moderationResult, reportsByUser.length || reportsOnPostRows.length || coreChangeEvents.length || supportAdminEvents.length || reportsOnPosts || complaintsFiledByUser || moderationFlags ? 'verified' : 'verified_empty', 'forum_reports+forum_core_change_events+ql7_support_admin_events'),
    metamarket: receipt('metamarket', {
      ownedItems: marketItems.length,
      events: marketEvents.length,
      ownerRows: marketOwners.length,
      recentEvents: marketEvents.slice(0, 12).map((row) => ({
        type: row.type || row.kind,
        item: row.itemName || row.tokenName || row.itemId,
        createdAt: row.createdAt || row.ts,
      })),
    }, marketItems.length || marketEvents.length || marketOwners.length ? 'verified' : 'verified_empty', 'metamarket_*'),
    battlecoin: receipt('battlecoin', {
      activeOrders: battlecoinActiveOrders.length,
      historyRows: battlecoinHistory.length + battlecoinLegacyHistory.length,
      counterRows: battlecoinCounters.length,
      recentOrders: [...battlecoinActiveOrders, ...battlecoinHistory, ...battlecoinLegacyHistory].slice(0, 12).map((row) => {
        const order = row?.order && typeof row.order === 'object' ? row.order : row
        return {
          orderId: order?.orderId || row?._id,
          status: order?.status || row?.status,
          symbol: order?.symbol || row?.symbol,
          side: order?.side || row?.side,
          stake: order?.stake ?? row?.stake,
          leverage: order?.leverage ?? row?.leverage,
          openedAt: order?.openedAt || row?.openedAt || row?.createdAt,
          closedAt: order?.closedAt || row?.closedAt,
          updatedAt: row?.updatedAt,
        }
      }),
    }, battlecoinActiveOrders.length || battlecoinHistory.length || battlecoinLegacyHistory.length || battlecoinCounters.length ? 'verified' : 'verified_empty', 'battlecoin_active_orders+battlecoin_order_history+battlecoin_counters'),
    telegram: receipt('telegram', {
      linked: telegramLinks.length > 0,
      links: telegramLinks.map((row) => ({
        telegramId: row.telegramId || row.userId,
        accountId: row.accountId || row.wallet || row.walletAddress,
        status: row.status,
      })),
    }, telegramLinks.length ? 'verified' : 'verified_empty', 'telegram_links'),
    support_system: receipt('support_system', supportResult, supportCases.length || supportDiagnostics.length || supportOutbox.length ? 'verified' : 'verified_empty', 'ql7_support_cases+ql7_support_diagnostic_runs+support_email_outbox'),
    rating: receipt('rating', rating, 'verified', 'ecosystemRating.js'),
  }

  const questions = [
    ['qcoin', 'Покажи мой баланс QCoin'],
    ['qcoin', 'Украли деньги с баланса QCoin, проверь операции'],
    ['vip', 'Покажи мой VIP-статус'],
    ['ads_packages', 'Покажи статус моего рекламного пакета'],
    ['ads_campaigns', 'Покажи метрики рекламных кампаний'],
    ['profile', 'Покажи профиль, активность и рейтинг с объяснением confidence'],
    ['geodetect', 'Покажи мой безопасный гео-контекст'],
    ['forum', 'Покажи мою активность на форуме'],
    ['quantum_family', 'Покажи подписчиков, подписки и Quantum Family связи'],
    ['moderation', 'Покажи жалобы на мои посты, мои жалобы и модерационные флаги'],
    ['metamarket', 'Покажи мои данные MetaMarket'],
    ['battlecoin', 'Покажи мои BattleCoin ордера, историю и счетчики'],
    ['telegram', 'Проверь связь Telegram с аккаунтом'],
    ['support_system', 'Покажи историю обращений в QL7 Support'],
  ]
  const surfaces = []
  let ledger = {}
  for (let index = 0; index < questions.length; index += 1) {
    const [topic, text] = questions[index]
    const productionTurn = executeQl7SupportProductionTurn({
      mode: 'replay',
      requestId: `live-read:${index}`,
      conversationId: 'live-read',
      userTurnId: `live-user:${index}`,
      selectedLocale: locale,
      originalText: text,
      priorLedger: ledger,
      adapterReceipts: [receiptMap[topic] || receiptMap.profile],
      actor: { accountIdMasked: mask(canonicalAccountId), locale },
      profile: { nickname: profile?.nickname || profile?.nick || '', locale },
      rating,
      geo: profile?._geoCurrent || {},
      activity,
      now: new Date().toISOString(),
      seed: `live-read:${index}`,
    })
    const result = productionTurn.runtime
    const productionDelivery = productionTurn.delivery
    ledger = result.ledger
    surfaces.push({
      topic,
      question: text,
      text: productionDelivery.text,
      surface: result.surface,
      actionIds: productionDelivery.actionIds,
      receipts: result.adapterReceipts,
      composerPolicy: result.composerPolicy,
      stateEvents: result.stateEvents,
      operatorCase: result.operatorCase,
      critic: result.critic,
      productionDelivery,
    })
  }

  const receipts = Object.values(receiptMap).filter((row, index, list) =>
    list.findIndex((item) => item.id === row.id) === index
  )
  return Object.freeze({
    schema: 'ql7.support.v14.live-user-snapshot',
    readOnly: true,
    writeCount: 0,
    identity: publicIdentity(graph),
    lookupIdCount: ids.length,
    sourceIdsMasked: seeds.map(mask),
    profile: clean(profile),
    activity,
    rating: clean(rating),
    receipts,
    surfaces,
    sourceCounts: {
      telegramLinks: telegramLinks.length,
      qcoinLedger: qcoinLedger.length,
      qcoinInvoices: invoices.length,
      forumPosts: forumPosts.length,
      forumTopics: forumTopics.length,
      subscriptionCountRows: subscriptionCountRows.length,
      subscriptionSetRows: subscriptionSetRows.length,
      reportsByUser: reportsByUser.length,
      reportsOnUserPosts: reportsOnPostRows.length,
      moderationEvents: coreChangeEvents.length + supportAdminEvents.length,
      metamarketItems: marketItems.length,
      metamarketEvents: marketEvents.length,
      battlecoinActiveOrders: battlecoinActiveOrders.length,
      battlecoinHistory: battlecoinHistory.length + battlecoinLegacyHistory.length,
      battlecoinCounters: battlecoinCounters.length,
      supportCases: supportCases.length,
      supportDiagnostics: supportDiagnostics.length,
      supportOperatorEmails: supportOutbox.length,
      geoAvailable: hasObjectData(geoResult.current),
    },
    generatedAt: new Date().toISOString(),
    integrityHash: hash({ ids: ids.map(lower), activity, rating, receiptIds: receipts.map((row) => row.id) }),
  })
}
