import { afterEach, describe, expect, test } from 'vitest'

import {
  inspectQcoinPurchaseRuntimeConfiguration,
  resolveQcoinPurchaseProduct,
  qcoinEntitlementPurchaseConstants,
} from '../../../lib/qcoinEntitlementPurchase.js'
import paymentTranslations, {
  PAYMENT_METHOD_LANGS,
  paymentMethodText,
} from '../../../components/paymentMethodI18n.js'
import deviceEvidenceModule from '../../../lib/account-restrictions/deviceEvidence.cjs'

const deviceEvidence = deviceEvidenceModule?.default || deviceEvidenceModule

const previousVipPrice = process.env.PLAN_PRICE_USD
const previousVipDays = process.env.PLAN_DAYS
const previousNodeEnv = process.env.NODE_ENV
const previousDeviceSalt = process.env.QL7_DEVICE_EVIDENCE_SALT

afterEach(() => {
  if (previousVipPrice === undefined) delete process.env.PLAN_PRICE_USD
  else process.env.PLAN_PRICE_USD = previousVipPrice
  if (previousVipDays === undefined) delete process.env.PLAN_DAYS
  else process.env.PLAN_DAYS = previousVipDays
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = previousNodeEnv
  if (previousDeviceSalt === undefined) delete process.env.QL7_DEVICE_EVIDENCE_SALT
  else process.env.QL7_DEVICE_EVIDENCE_SALT = previousDeviceSalt
})

describe('QCoin entitlement purchase catalog', () => {
  test('requires all production economic secrets, including the device-evidence salt', () => {
    const incomplete = inspectQcoinPurchaseRuntimeConfiguration({
      NODE_ENV: 'production',
      QL7_ECONOMIC_SOURCE_HMAC_KEY: 's'.repeat(32),
      QL7_ECONOMIC_DECISION_HMAC_KEY: 'd'.repeat(32),
    })
    expect(incomplete).toMatchObject({
      production: true,
      configured: false,
      missing: ['QL7_DEVICE_EVIDENCE_SALT'],
    })

    expect(inspectQcoinPurchaseRuntimeConfiguration({
      NODE_ENV: 'production',
      QL7_ECONOMIC_SOURCE_HMAC_KEY: 's'.repeat(32),
      QL7_ECONOMIC_DECISION_HMAC_KEY: 'd'.repeat(32),
      QL7_DEVICE_EVIDENCE_SALT: 'device-evidence-salt-value',
    })).toMatchObject({ configured: true, missing: [] })
  })

  test('reproduces and resolves the production forwarded-IP evidence branch', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.QL7_DEVICE_EVIDENCE_SALT
    const request = {
      headers: { get: (name) => (name === 'x-forwarded-for' ? '203.0.113.10' : '') },
    }

    expect(() => deviceEvidence.fromRequest(request)).toThrow('device_evidence_salt_missing')
    process.env.QL7_DEVICE_EVIDENCE_SALT = 'production-device-evidence-salt'
    expect(deviceEvidence.fromRequest(request)).toMatchObject({
      rawIpStored: false,
      vpnOrSharedIpIsSoleProof: false,
    })
    expect(deviceEvidence.fromRequest(request).serverObservedIpHash).toMatch(/^[a-f0-9]{64}$/)
  })

  test('derives VIP price and duration only from server environment', () => {
    process.env.PLAN_PRICE_USD = '27.45'
    process.env.PLAN_DAYS = '31'

    const product = resolveQcoinPurchaseProduct({
      purpose: 'vip',
      amountUsd: 0.01,
      vipDays: 9999,
    })

    expect(product).toMatchObject({
      purpose: 'vip',
      productKey: 'vip',
      amountUsd: 27.45,
      amountQcoin: 27.45,
      vipDays: 31,
    })
    expect(qcoinEntitlementPurchaseConstants.QCOIN_PER_USD).toBe(1)
  })

  test.each(['STARTER', 'PRO', 'ELITE'])('uses the ads server catalog for %s', (tier) => {
    const product = resolveQcoinPurchaseProduct({
      purpose: 'ads',
      adsPackage: tier,
      amountQcoin: 0.01,
    })

    expect(product.purpose).toBe('ads')
    expect(product.adsPackage).toBe(tier)
    expect(product.amountUsd).toBeGreaterThan(0)
    expect(product.amountQcoin).toBe(product.amountUsd)
    expect(product.durationDays).toBeGreaterThan(0)
  })

  test('rejects products outside VIP and advertising', () => {
    expect(() => resolveQcoinPurchaseProduct({ purpose: 'qcoin_topup' }))
      .toThrow('UNKNOWN_PURPOSE')
    expect(() => resolveQcoinPurchaseProduct({ purpose: 'ads', adsPackage: 'FORGED' }))
      .toThrow('UNKNOWN_ADS_PACKAGE')
  })
})

describe('payment method translations', () => {
  test('contains the complete payment surface in all seven supported languages', () => {
    expect(PAYMENT_METHOD_LANGS).toEqual(['ru', 'en', 'zh', 'uk', 'ar', 'tr', 'es'])
    const englishKeys = Object.keys(paymentTranslations.en).sort()
    expect(englishKeys.length).toBeGreaterThanOrEqual(20)

    for (const lang of PAYMENT_METHOD_LANGS) {
      expect(Object.keys(paymentTranslations[lang]).sort()).toEqual(englishKeys)
      expect(paymentMethodText(lang, 'title')).not.toBe('title')
      expect(paymentMethodText(lang, 'description')).not.toBe('description')
    }
  })
})
