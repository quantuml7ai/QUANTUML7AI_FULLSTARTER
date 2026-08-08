import { describe, expect, it } from 'vitest'

import en from '../../../components/i18n-dicts/en.js'
import ru from '../../../components/i18n-dicts/ru.js'
import zh from '../../../components/i18n-dicts/zh.js'
import uk from '../../../components/i18n-dicts/uk.js'
import ar from '../../../components/i18n-dicts/ar.js'
import tr from '../../../components/i18n-dicts/tr.js'
import es from '../../../components/i18n-dicts/es.js'
import { readRepoFile } from '../../support/projectSurface.js'

const dictionaries = { en, ru, zh, uk, ar, tr, es }

const requiredKeys = [
  'metamarket_title',
  'metamarket_open',
  'metamarket_open_aria',
  'metamarket_open_from_wallet_aria',
  'metamarket_close',
  'metamarket_close_aria',
  'metamarket_close_title',
  'metamarket_back',
  'metamarket_back_aria',
  'metamarket_back_title',
  'metamarket_gift_open_title',
  'metamarket_gift_open_aria',
  'metamarket_cancel_gift_flow_aria',
  'metamarket_cancel_gift_flow_title',
  'metamarket_info_coming_soon_title',
  'metamarket_collection_info_aria',
  'metamarket_item_info_aria',
  'metamarket_info_open_title',
  'metamarket_info_close_aria',
  'metamarket_info_close_title',
  'metamarket_info_collection_type',
  'metamarket_info_item_type',
  'metamarket_info_description_label',
  'metamarket_info_details_label',
  'metamarket_info_config_key_label',
  'metamarket_info_stats_aria',
  'metamarket_info_code_label',
  'metamarket_info_item_count_label',
  'metamarket_info_status_label',
  'metamarket_info_status_active',
  'metamarket_info_status_paused',
  'metamarket_info_supply_label',
  'metamarket_info_price_label',
  'metamarket_info_rarity_label',
  'metamarket_tab_market',
  'metamarket_tab_collections',
  'metamarket_loading',
  'metamarket_retry',
  'metamarket_error_title',
  'metamarket_network_error',
  'metamarket_unauthorized',
  'metamarket_auth_required_title',
  'metamarket_authorize',
  'metamarket_authorize_aria',
  'metamarket_transaction_busy',
  'metamarket_anonymous_user',
  'metamarket_context_choose_collection',
  'metamarket_context_collection_items_count',
  'metamarket_context_owners_count',
  'metamarket_context_owned_total',
  'metamarket_context_gift_to',
  'metamarket_empty_market',
  'metamarket_empty_collection',
  'metamarket_empty_own_collection',
  'metamarket_open_market',
  'metamarket_buy',
  'metamarket_sell',
  'metamarket_sell_price_button',
  'metamarket_gift',
  'metamarket_deposit',
  'metamarket_deposit_aria',
  'metamarket_deposit_title',
  'metamarket_pay',
  'metamarket_confirm',
  'metamarket_decline',
  'metamarket_close_action',
  'metamarket_transaction_loading_quote',
  'metamarket_transaction_submitting',
  'metamarket_transaction_action_buy',
  'metamarket_transaction_action_sell',
  'metamarket_transaction_action_gift',
  'metamarket_transaction_gift_target',
  'metamarket_quantity_label',
  'metamarket_quantity_available_label',
  'metamarket_market_available_label',
  'metamarket_quantity_decrease_aria',
  'metamarket_quantity_increase_aria',
  'metamarket_buy_confirm_title',
  'metamarket_buy_confirm_body',
  'metamarket_buy_success',
  'metamarket_sell_confirm_title',
  'metamarket_sell_confirm_body',
  'metamarket_sell_success',
  'metamarket_gift_confirm_title',
  'metamarket_gift_confirm_body',
  'metamarket_gift_confirm_button',
  'metamarket_gift_success',
  'metamarket_insufficient_funds_title',
  'metamarket_insufficient_funds_body',
  'metamarket_balance_label',
  'metamarket_qcoin_balance_label',
  'metamarket_required_label',
  'metamarket_missing_label',
  'metamarket_sell_quote_label',
  'metamarket_sell_fee_label',
  'metamarket_owned_count_label',
  'metamarket_sold_out',
  'metamarket_history',
  'metamarket_history_aria',
  'metamarket_history_context',
  'metamarket_history_empty',
  'metamarket_history_market_counterparty',
  'metamarket_history_price_label',
  'metamarket_history_action_buy',
  'metamarket_history_action_sell',
  'metamarket_history_action_gift',
  'metamarket_history_action_receive',
  'metamarket_history_action_event',
  'metamarket_new_gifts_badge_aria',
  'metamarket_new_gift_badge',
  'metamarket_owners_title',
  'metamarket_owners_empty',
  'metamarket_owners_load_more',
  'metamarket_owner_count_aria',
  'metamarket_owner_since_label',
  'metamarket_collection_cyber_animals',
  'metamarket_collection_meta_resources',
  'metamarket_collection_heroes',
  'metamarket_collection_meta_space',
  'metamarket_collection_real_estate',
  'metamarket_collection_keys',
  'metamarket_collection_miscellaneous',
  'metamarket_collection_technique',
  'metamarket_rarity_common',
  'metamarket_rarity_rare',
  'metamarket_rarity_epic',
  'metamarket_rarity_legendary',
  'metamarket_rarity_mythic',
  'metamarket_rarity_quantum',
  'metamarket_error_missing_user_id',
  'metamarket_error_unauthorized',
  'metamarket_error_item_not_found',
  'metamarket_error_collection_not_found',
  'metamarket_error_item_inactive',
  'metamarket_error_buy_disabled',
  'metamarket_error_sell_disabled',
  'metamarket_error_gift_disabled',
  'metamarket_error_sold_out',
  'metamarket_error_insufficient_funds',
  'metamarket_error_not_owner',
  'metamarket_error_recipient_not_found',
  'metamarket_error_self_gift_forbidden',
  'metamarket_error_busy_retry',
  'metamarket_error_idempotency_conflict',
  'metamarket_error_transaction_failed',
  'metamarket_error_network_error',
  'metamarket_collection_items_count',
  'metamarket_collection_open_aria',
  'metamarket_image_missing_aria',
  'metamarket_supply_badge_aria',
  'metamarket_buy_button_aria',
  'metamarket_item_meta_resources_aetheris',
]

describe('MetaMarket contracts', () => {
  it('keeps the host lazy and runtime-only', () => {
    const host = readRepoFile('components/MetaMarketHost.jsx')
    const layout = readRepoFile('app/layout.js')

    expect(host).toContain("dynamic(() => import('./MetaMarket')")
    expect(host).toContain("window.addEventListener('metamarket:open'")
    expect(host).not.toContain("window.addEventListener('metamarket:close'")
    expect(host).not.toContain("window.addEventListener('auth:logout'")
    expect(host).not.toContain('MetaMarketCatalog')
    expect(host).not.toContain('/metamarket/')
    expect(host).not.toMatch(/\bfetch\s*\(/)
    expect(layout).toContain("dynamic(() => import('../components/MetaMarketHost')")
    expect(layout.indexOf('<I18nProvider>')).toBeLessThan(layout.indexOf('<MetaMarketHost />'))
  })

  it('keeps the launch surface limited to wallet and user-info gift flow', () => {
    const wallet = readRepoFile('components/QuantumWallet.jsx')
    const userInfo = readRepoFile('app/forum/features/profile/components/UserInfoPopover.jsx')
    const profilePopover = readRepoFile('app/forum/features/profile/components/ProfilePopover.jsx')
    const transactions = readRepoFile('app/api/metamarket/_transactions.js')
    const forbiddenSource = ['profile', 'settings'].join('-')

    expect(wallet).toContain("source: 'quantum-wallet'")
    expect(wallet).toContain("initialMode: 'market'")
    expect(wallet).toContain('giftFlow: false')
    expect(userInfo).toContain("source: 'user-info-gift'")
    expect(userInfo).toContain("initialMode: 'collections'")
    expect(userInfo).toContain('giftFlow: true')
    expect(userInfo).toContain('userInfoCircleActionBtn--gift')
    expect(profilePopover).not.toContain('metamarket:open')
    expect(profilePopover).not.toContain('MetaMarket')
    expect(`${wallet}\n${userInfo}\n${profilePopover}\n${transactions}`).not.toContain(forbiddenSource)
  })

  it('keeps portal, teardown, accessibility, and no-Russian-JSX contracts in runtime files', () => {
    const runtime = readRepoFile('components/MetaMarket.jsx')
    const files = [
      runtime,
      readRepoFile('components/MetaMarketHost.jsx'),
      readRepoFile('components/MetaMarketIcons.jsx'),
      readRepoFile('components/MetaMarketTitle.jsx'),
    ]

    expect(runtime).toContain('createPortal(')
    expect(runtime).toContain('METAMARKET_Z_INDEX = 2147482500')
    expect(runtime).toContain('aria-modal="true"')
    expect(runtime).toContain('role="dialog"')
    expect(runtime).toContain("document.addEventListener('keydown'")
    expect(runtime).toContain('transactionCloseLocked')
    expect(runtime).not.toContain("event.target === event.currentTarget")
    expect(runtime).not.toContain("window.addEventListener('metamarket:close'")
    expect(runtime).not.toContain("window.addEventListener('auth:logout'")
    expect(runtime).toContain('document.documentElement.style.overflow')
    expect(runtime).toContain('previous.focus')
    expect(runtime).toContain('window.visualViewport')

    for (const source of files) {
      expect(source).not.toMatch(/['"`][^'"`]*[А-Яа-яЁё][^'"`]*['"`]/)
    }
  })

  it('keeps transaction invariants visible in the server domain', () => {
    const transactions = readRepoFile('app/api/metamarket/_transactions.js')
    const db = readRepoFile('app/api/metamarket/_db.js')

    expect(db).toContain('metamarket:idempotency')
    expect(transactions).toContain('marketAvailable: state.marketAvailable - quantity')
    expect(transactions).toContain('marketAvailable: state.marketAvailable + quantity')
    expect(transactions).toContain('buyTotalPriceMicro')
    expect(transactions).toContain('sellTotalPriceMicro')
    expect(transactions).toContain("type: 'GIFT'")
    expect(transactions).toContain('self_gift_forbidden')
    expect(transactions).toContain('writeLedgerEvent')
  })

  it.each(Object.entries(dictionaries))('adds all visible MetaMarket keys to %s', (_lang, dict) => {
    for (const key of requiredKeys) {
      expect(dict[key], key).toBeTruthy()
    }
  })
})
