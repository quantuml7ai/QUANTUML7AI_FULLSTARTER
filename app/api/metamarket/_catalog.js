import {
  getMetaMarketCatalogSummary,
  getMetaMarketCollection,
  getMetaMarketItem,
  listMetaMarketCollections,
  listMetaMarketItems,
  METAMARKET_CATALOG_VERSION,
} from '../../../components/MetaMarketCatalog.js'
import { dynamicPriceMicro, microToQcoin } from './_format.js'

export {
  getMetaMarketCatalogSummary,
  getMetaMarketCollection,
  getMetaMarketItem,
  listMetaMarketCollections,
  listMetaMarketItems,
  METAMARKET_CATALOG_VERSION,
}

export function serializeCatalogCollection(collection, extra = {}) {
  return {
    id: collection.id,
    folder: collection.folder,
    code: collection.code,
    titleKey: collection.titleKey,
    fallbackTitle: collection.fallbackTitle,
    sort: collection.sort,
    active: !!collection.active,
    theme: collection.theme,
    infoKeyStem: collection.infoKeyStem,
    infoTitleKey: collection.infoTitleKey,
    infoDescriptionKey: collection.infoDescriptionKey,
    infoDetailsKey: collection.infoDetailsKey,
    infoButtonAriaKey: collection.infoButtonAriaKey,
    itemCount: Number(collection.itemCount || listMetaMarketItems(collection.id).length || 0),
    previewStrategy: collection.previewStrategy,
    ...extra,
  }
}

export function serializeCatalogItem(item, state = {}, extra = {}) {
  const totalSupply = Number(state.totalSupply ?? item.supply ?? 0)
  const marketAvailable = Number(state.marketAvailable ?? item.supply ?? 0)
  const basePriceMicro = Number(state.priceMicro ?? item.priceMicro ?? 0)
  const currentPriceMicro = dynamicPriceMicro(item, { ...state, totalSupply, marketAvailable })
  return {
    itemId: item.itemId,
    collectionId: item.collectionId,
    slug: item.slug,
    imagePath: item.imagePath,
    thumbPath: item.thumbPath || null,
    titleKey: item.titleKey,
    fallbackTitle: item.fallbackTitle,
    infoKeyStem: item.infoKeyStem,
    infoTitleKey: item.infoTitleKey,
    infoDescriptionKey: item.infoDescriptionKey,
    infoDetailsKey: item.infoDetailsKey,
    infoButtonAriaKey: item.infoButtonAriaKey,
    rarity: item.rarity,
    priceQcoin: microToQcoin(currentPriceMicro),
    priceMicro: currentPriceMicro,
    basePriceQcoin: microToQcoin(basePriceMicro),
    basePriceMicro,
    sellRateBps: Number(state.sellRateBps ?? item.sellRateBps ?? 0),
    scarcityPriceBps: Number(state.scarcityPriceBps ?? item.scarcityPriceBps ?? 0),
    totalSupply,
    marketAvailable,
    active: state.active == null ? !!item.active : !!Number(state.active),
    buyEnabled: state.buyEnabled == null ? !!item.buyEnabled : !!Number(state.buyEnabled),
    sellEnabled: state.sellEnabled == null ? !!item.sellEnabled : !!Number(state.sellEnabled),
    giftEnabled: state.giftEnabled == null ? !!item.giftEnabled : !!Number(state.giftEnabled),
    sort: item.sort,
    assetVersion: item.assetVersion,
    catalogVersion: item.catalogVersion,
    ...extra,
  }
}
