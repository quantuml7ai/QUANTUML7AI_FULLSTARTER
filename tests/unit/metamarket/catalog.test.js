import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  METAMARKET_CATALOG_VERSION,
  getMetaMarketCatalogSummary,
  getMetaMarketCollection,
  listMetaMarketCollections,
  listMetaMarketItems,
} from '../../../components/MetaMarketCatalog.js'
import {
  formatMetaMarketButtonQcoin,
  formatMetaMarketExactQcoin,
} from '../../../components/metamarket/metaMarketFormat.js'
import { dynamicPriceMicro, priceMicroForAvailable } from '../../../app/api/metamarket/_format.js'
import { repoRoot } from '../../support/projectSurface.js'

const MICRO = 1_000_000

describe('MetaMarket catalog manifest', () => {
  it('keeps collections and items structurally stable', () => {
    const collections = listMetaMarketCollections({ activeOnly: false })
    const collectionIds = new Set(collections.map((collection) => collection.id))
    const collectionCodes = new Set(collections.map((collection) => collection.code))
    const allItems = collections.flatMap((collection) => listMetaMarketItems(collection.id, { activeOnly: false }))
    const itemIds = new Set(allItems.map((item) => item.itemId))

    expect(METAMARKET_CATALOG_VERSION).toMatch(/^mm-/)
    expect(collections).toHaveLength(8)
    expect(collectionIds.size).toBe(collections.length)
    expect(collectionCodes.size).toBe(collections.length)
    expect(allItems).toHaveLength(512)
    expect(itemIds.size).toBe(allItems.length)

    for (const collection of collections) {
      expect(collection).toMatchObject({
        active: expect.any(Boolean),
        folder: expect.any(String),
        titleKey: expect.stringMatching(/^metamarket_collection_/),
        fallbackTitle: expect.any(String),
      })
      expect(collection.code).toMatch(/^[A-Z]{3}$/)
      expect(collection.defaultSupply).toBeGreaterThan(0)
      expect(collection.defaultPriceQcoin).toBeGreaterThan(0)
      expect(collection.defaultSellRateBps).toBeGreaterThan(0)
      expect(collection.defaultSellRateBps).toBeLessThanOrEqual(10_000)
      expect(collection.defaultScarcityPriceBps).toBeGreaterThanOrEqual(0)
      expect(collection.infoKeyStem).toBe(`metamarket_info_collection_${collection.id}`)
      expect(collection.infoTitleKey).toBe(`${collection.infoKeyStem}_title`)
      expect(collection.infoDescriptionKey).toBe(`${collection.infoKeyStem}_description`)
      expect(collection.infoDetailsKey).toBe(`${collection.infoKeyStem}_details`)

      const collectionItems = listMetaMarketItems(collection.id, { activeOnly: false })
      expect(new Set(collectionItems.map((item) => item.supply)).size).toBe(collectionItems.length)
      expect(new Set(collectionItems.map((item) => item.priceQcoin)).size).toBe(collectionItems.length)
    }

    for (const item of allItems) {
      const collection = getMetaMarketCollection(item.collectionId)
      expect(collection).toBeTruthy()
      expect(item.itemId).toMatch(/^mm_/)
      expect(item.titleKey).toBe(`metamarket_item_${item.collectionId}_${item.slug}`)
      expect(item.infoKeyStem).toBe(`metamarket_info_item_${item.collectionId}_${item.slug}`)
      expect(item.infoTitleKey).toBe(`${item.infoKeyStem}_title`)
      expect(item.infoDescriptionKey).toBe(`${item.infoKeyStem}_description`)
      expect(item.infoDetailsKey).toBe(`${item.infoKeyStem}_details`)
      expect(item.fallbackTitle).toBeTruthy()
      expect(item.fileName).toEqual(expect.any(String))
      expect(item.imagePath).toEqual(expect.any(String))
      expect(item.imagePath).toMatch(/^(\/|https?:\/\/|data:image\/|blob:)/)
      expect(item.assetVersion).toContain(path.extname(item.fileName).replace('.', '').toLowerCase() || 'asset')
      expect(item.priceQcoin).toBeGreaterThan(0)
      expect(item.priceMicro).toBe(Math.round(item.priceQcoin * MICRO))
      expect(item.supply).toBeGreaterThan(0)
      expect(item.sellRateBps).toBeGreaterThan(0)
      expect(item.sellRateBps).toBeLessThanOrEqual(10_000)
      expect(item.scarcityPriceBps).toBeGreaterThanOrEqual(0)
      expect(typeof item.active).toBe('boolean')
      expect(typeof item.buyEnabled).toBe('boolean')
      expect(typeof item.sellEnabled).toBe('boolean')
      expect(typeof item.giftEnabled).toBe('boolean')
      expect(['common', 'rare', 'epic', 'legendary', 'mythic', 'quantum']).toContain(item.rarity)

      if (item.imagePath.startsWith('/')) {
        const publicPath = path.join(repoRoot, 'public', item.imagePath.replace(/^\//, ''))
        expect(fs.existsSync(publicPath)).toBe(true)
      }
      if (item.thumbPath?.startsWith('/')) {
        const publicThumbPath = path.join(repoRoot, 'public', item.thumbPath.replace(/^\//, ''))
        expect(fs.existsSync(publicThumbPath)).toBe(true)
      }
    }
  })

  it('summarizes the current seed without hard-coding runtime logic to file names', () => {
    const summary = getMetaMarketCatalogSummary()

    expect(summary.catalogVersion).toBe(METAMARKET_CATALOG_VERSION)
    expect(summary.collectionCount).toBe(8)
    expect(summary.itemCount).toBe(512)

    const metaResourceItems = listMetaMarketItems('meta_resources', { activeOnly: false })
    const metaResourceBuckets = metaResourceItems.reduce(
      (buckets, item) => {
        if (item.priceQcoin > 1_750) buckets.gt1750 += 1
        else if (item.priceQcoin >= 1_000) buckets.gte1000_lte1750 += 1
        else if (item.priceQcoin >= 250) buckets.gte250_lt1000 += 1
        else if (item.priceQcoin <= 50) buckets.gte5_lte50 += 1
        else buckets.gte5_lt250 += 1
        return buckets
      },
      { gte5_lte50: 0, gte5_lt250: 0, gte250_lt1000: 0, gte1000_lte1750: 0, gt1750: 0 }
    )
    expect(metaResourceItems).toHaveLength(68)
    expect(metaResourceBuckets).toEqual({
      gte5_lte50: 20,
      gte5_lt250: 20,
      gte250_lt1000: 14,
      gte1000_lte1750: 10,
      gt1750: 4,
    })
    expect(Math.min(...metaResourceItems.map((item) => item.supply))).toBe(100_000)
    expect(Math.max(...metaResourceItems.map((item) => item.supply))).toBe(1_000_000)
    expect(Math.min(...metaResourceItems.map((item) => item.priceQcoin))).toBe(5)
    expect(Math.max(...metaResourceItems.map((item) => item.priceQcoin))).toBe(2_500)

    const realEstateItems = listMetaMarketItems('real_estate', { activeOnly: false })
    const realEstateBuckets = realEstateItems.reduce(
      (buckets, item) => {
        if (item.priceQcoin > 10_000) buckets.gt10000 += 1
        else if (item.priceQcoin > 5_000) buckets.gt5000_lte10000 += 1
        else if (item.priceQcoin > 2_000) buckets.gt2000_lte5000 += 1
        else if (item.priceQcoin > 500) buckets.gt500_lte2000 += 1
        else buckets.lte500 += 1
        return buckets
      },
      { lte500: 0, gt500_lte2000: 0, gt2000_lte5000: 0, gt5000_lte10000: 0, gt10000: 0 }
    )
    expect(realEstateItems).toHaveLength(85)
    expect(realEstateBuckets).toEqual({
      lte500: 25,
      gt500_lte2000: 21,
      gt2000_lte5000: 21,
      gt5000_lte10000: 14,
      gt10000: 4,
    })
  })

  it('uses a compound scarcity curve instead of a fixed linear price step', () => {
    const item = {
      priceMicro: 1_000_000,
      supply: 4,
      scarcityPriceBps: 10_000,
    }
    const state = {
      priceMicro: item.priceMicro,
      totalSupply: item.supply,
      marketAvailable: item.supply,
      scarcityPriceBps: item.scarcityPriceBps,
    }

    const start = dynamicPriceMicro(item, state)
    const step1 = priceMicroForAvailable(item, state, 3)
    const step2 = priceMicroForAvailable(item, state, 2)
    const step3 = priceMicroForAvailable(item, state, 1)
    const soldOut = priceMicroForAvailable(item, state, 0)

    expect(start).toBe(1_000_000)
    expect(soldOut).toBeGreaterThanOrEqual(1_999_999)
    expect(soldOut).toBeLessThanOrEqual(2_000_000)
    expect(step1 / start).toBeCloseTo(step2 / step1, 5)
    expect(step2 / step1).toBeCloseTo(step3 / step2, 5)
    expect(step1 - start).not.toBe(step2 - step1)
  })

  it('formats QCoin values with real precision and compact button-safe labels', () => {
    expect(formatMetaMarketExactQcoin(21986109.228605)).toBe('21986109.228605')
    expect(formatMetaMarketExactQcoin(4355.080000)).toBe('4355.08')
    expect(formatMetaMarketExactQcoin(50.000000)).toBe('50')
    expect(formatMetaMarketButtonQcoin(4355.080000)).toBe('4355.08')
    expect(formatMetaMarketButtonQcoin(750_000_000)).toBe('750M')
  })
})
