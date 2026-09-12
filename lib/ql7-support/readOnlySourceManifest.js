const REAL_READ_COLLECTIONS = Object.freeze([
  'academy_exams', 'account_aliases', 'ads_analytics', 'ads_counters', 'ads_kv', 'ads_sets',
  'battlecoin_active_orders', 'battlecoin_chat_likes', 'battlecoin_chat_messages', 'battlecoin_orders',
  'deleted_account_chunks', 'deleted_accounts', 'dm_aliases', 'dm_blocks', 'dm_counters',
  'dm_deleted_dialogs', 'dm_deliveries', 'dm_last_seen', 'dm_mailbox_entries', 'dm_messages',
  'dm_thread_entries', 'forum_admin_state', 'forum_core_change_events', 'forum_core_counters',
  'forum_core_posts', 'forum_core_snapshot', 'forum_core_topics', 'forum_core_user_metadata',
  'forum_geo_feed_index', 'forum_media_feed_index', 'forum_post_reactions', 'forum_reply_inbox_index',
  'forum_subscription_counts', 'forum_subscription_sets', 'forum_thread_index', 'forum_user_post_index',
  'forum_user_stats', 'forum_user_topic_index', 'metamarket_audit', 'metamarket_counters',
  'metamarket_events', 'metamarket_item_states', 'metamarket_owners', 'metamarket_qcoin_context',
  'metamarket_tokens', 'metastudio_registration_latest', 'metastudio_registrations', 'payment_counters',
  'payment_legacy_snapshots', 'payment_webhook_runtime', 'profile_geo_events', 'profile_nick_index',
  'profiles', 'qcoin_accounts', 'qcoin_counters', 'qcoin_ledger', 'qcoin_topup_events',
  'qcoin_topup_invoices', 'qcoin_topup_payment_dedupe', 'qcoin_topup_runtime', 'ql7_runtime_secrets',
  'ql7_support_cases', 'ql7_support_diagnostic_runs', 'ql7_support_message_dedupe',
  'ql7_support_user_requests', 'ql7_support_ui_events', 'ql7_support_learning_candidates',
  'ql7_support_learning_deployments', 'ql7_support_feedback_events', 'ql7_support_eval_runs',
  'ql7_support_deployment_state', 'ql7_support_turn_decisions', 'ql7_support_dialogue_outcomes',
  'ql7_support_action_outcomes', 'ql7_support_translation_outcomes', 'ql7_support_response_quality',
  'ql7_support_personality_state', 'ql7_support_user_adaptation', 'ql7_support_calibration_snapshots',
  'ql7_support_simulation_runs', 'ql7_support_simulation_failures',
  'ql7_support_entry_events', 'ql7_support_event_envelopes',
  'ql7_support_delivery_receipts', 'ql7_support_event_outbox',
  'ql7_support_novelty_fingerprints', 'ql7_support_quality_receipts',
  'ql7_support_conversation_turn_leases', 'ql7_support_memory_recovery_conflicts',
  'referral_codes', 'referral_profiles', 'referral_unique_ips',
  'referral_vip_queue', 'support_email_outbox', 'support_email_dead_letters', 'vip_payment_dedupe',
])

const REAL_READ_COLLECTION_SET = new Set(REAL_READ_COLLECTIONS)

export const QL7_SUPPORT_REAL_READ_COLLECTIONS = REAL_READ_COLLECTIONS
export function isQl7SupportRealReadCollection(name = '') {
  return REAL_READ_COLLECTION_SET.has(String(name || '').trim())
}
export function listQl7SupportRealReadCollections() {
  return Object.freeze([...REAL_READ_COLLECTIONS].sort())
}

export const QL7_SUPPORT_CONFIGURED_READ_COLLECTIONS = Object.freeze({
  platform: [], homepage: [], news: [], exchange: [], exchange_ai: [],
  battlecoin: ['battlecoin_active_orders', 'battlecoin_orders', 'qcoin_accounts'],
  battle_chat: ['battlecoin_chat_messages', 'battlecoin_chat_likes'],
  futures: ['battlecoin_orders', 'battlecoin_active_orders'],
  academy: ['academy_exams'], academy_exam: ['academy_exams'],
  gameverse: ['qcoin_ledger'],
  metastudio: ['metastudio_registrations', 'metastudio_registration_latest'], metaverse: [], quantum_zigzag: [], ql7_blockchain: [],
  forum_feed: ['forum_core_posts', 'forum_geo_feed_index', 'forum_core_topics'],
  forum_threads: ['forum_thread_index', 'forum_core_posts'],
  search: ['profile_nick_index', 'forum_core_posts', 'forum_core_topics'],
  geodetect: ['profile_geo_events', 'forum_geo_feed_index'],
  media: ['forum_media_feed_index', 'forum_core_posts'],
  moderation: ['forum_admin_state', 'forum_core_change_events', 'forum_core_posts'],
  metamarket: ['metamarket_item_states', 'metamarket_owners', 'metamarket_events', 'metamarket_audit'],
  quantum_family: ['forum_subscription_counts', 'forum_subscription_sets'],
  profile: ['profiles', 'profile_nick_index', 'profile_geo_events'],
  auth: ['account_aliases', 'profiles'], wallet: ['profiles', 'qcoin_accounts'], telegram: ['account_aliases', 'profiles'],
  qcoin: ['qcoin_topup_invoices', 'qcoin_topup_events', 'qcoin_ledger', 'qcoin_accounts'],
  payments: ['payment_counters', 'payment_legacy_snapshots', 'payment_webhook_runtime', 'qcoin_topup_invoices', 'ads_kv'],
  vip: ['profiles', 'vip_payment_dedupe'],
  ads_packages: ['ads_kv', 'ads_sets', 'ads_counters', 'ads_analytics'], ads_campaigns: ['ads_kv', 'ads_sets', 'ads_analytics', 'ads_counters'],
  push: ['dm_counters', 'dm_deliveries'], messenger: ['dm_messages', 'dm_thread_entries', 'dm_mailbox_entries', 'dm_deliveries'],
  quests: ['qcoin_ledger'], contact: ['support_email_outbox', 'ql7_support_cases'], privacy: ['deleted_accounts'], security: ['account_aliases', 'profiles'],
  account_deletion: ['deleted_accounts', 'deleted_account_chunks'], navigation: [], roadmap: [], system_status: [], localization: [], accessibility: [],
  partnership: ['ql7_support_cases'], investment: ['ql7_support_cases'],
  learning_governance: ['ql7_support_learning_candidates', 'ql7_support_feedback_events', 'ql7_support_eval_runs', 'ql7_support_learning_deployments', 'ql7_support_deployment_state', 'ql7_support_calibration_snapshots'],
  support_system: ['ql7_support_cases', 'ql7_support_diagnostic_runs', 'support_email_outbox', 'ql7_support_delivery_receipts', 'ql7_support_quality_receipts', 'ql7_support_event_outbox'],
})

export function getQl7SupportConfiguredReadCollections(topic = '') {
  const key = String(topic || '').trim().toLowerCase()
  return Object.freeze([...(QL7_SUPPORT_CONFIGURED_READ_COLLECTIONS[key] || [])].filter((name) => isQl7SupportRealReadCollection(name)))
}
