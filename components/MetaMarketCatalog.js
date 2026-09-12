// Версия каталога: меняется при управляемом обновлении предметов, цен, supply или ассетов.
// MetaMarketCatalog — единственная точка, где настраиваются коллекции, предметы,
// ассеты, тиражи, базовые цены, коэффициенты продажи и динамика scarcity-цены.
//
// Как правильно менять ассеты:
// 1. Положить новые PNG в public/metamarket/<folder>.
// 2. В COLLECTION_DEFINITIONS заменить fileName или добавить новый файл.
// 3. Если это тот же предмет с новой картинкой, itemId должен остаться прежним:
//    менять можно fileName/imagePath/assetVersion, но не slug/itemId после запуска.
// 4. Если предмет новый, добавляется новый файл/slug и новый i18n key.
// 5. Если предмет надо скрыть из продажи, ставится active: false, но история не удаляется.
// 6. Если меняются supply/price после реальных продаж, это надо делать миграцией/admin script,
//    а не тихой правкой каталога, чтобы Redis counters и token history не разошлись.
//
// Денежная модель:
// - priceQcoin хранится как человекочитаемая базовая цена.
// - priceMicro хранится как integer microQCoin для точных серверных расчетов.
// - scarcityPriceBps задает итоговый процент удорожания к моменту sold out.
// - сервер применяет этот процент компаундно: каждая следующая покупка умножает
//   текущую ступень цены, а каждая продажа обратно снижает цену по той же кривой.
// - sellRateBps задает payout при продаже обратно в маркет от текущей динамической цены.
//
// Rarity влияет на стартовую цену/тираж в seed-генераторе и на UI glow. Если позже
// предметы будут описываться вручную, явные priceQcoin/supply должны иметь приоритет.
export const METAMARKET_CATALOG_VERSION = 'mm-test-2026-05-v5'
// Базовая выплата при продаже обратно в маркет: 9700 bps = 97% от текущей серверной цены.
export const METAMARKET_DEFAULT_SELL_RATE_BPS = 9700
// Точность QCoin на сервере и в manifest: 1 QCoin = 1_000_000 microQCoin.
export const METAMARKET_MICRO_PER_QCOIN = 1_000_000
// Коэффициент роста цены при выкупе supply: 6500 bps = до +65% к базовой цене при полном sold out.
// Значение 6500 bps означает целевое +65% к базовой цене при полном sold out.
// Сервер не прибавляет фиксированную сумму к базе: он строит компаундную кривую,
// где каждая следующая покупка применяет процент к текущей цене, а продажа назад
// двигает цену вниз на одну такую же ступень.
export const METAMARKET_DEFAULT_SCARCITY_PRICE_BPS = 6500

// Справочник полей коллекции:
// - id: вечный технический id коллекции. Он участвует в itemId, Redis-ключах, API-фильтрах,
//   owners index и истории транзакций, поэтому после боевого запуска его нельзя переименовывать.
// - folder: имя папки внутри public/metamarket. Меняется только при реальном переносе ассетов
//   и требует синхронной правки fileName/imagePath для предметов этой коллекции.
// - code: короткий публичный код коллекции для serial вида MM-KEY-000000777-L7.
//   Он должен быть коротким, стабильным и уникальным, потому что виден пользователю в истории.
// - titleKey: единственный видимый UI-текст названия коллекции. Переводы добавляются в словари,
//   а JSX и API не должны подставлять ручные строки.
// - fallbackTitle: технический аварийный fallback для отладки. Это не основной UI-текст.
// - sort: стабильный порядок карточек коллекций. Можно менять без миграций, потому что история
//   и ownership на порядок сортировки не завязаны.
// - active: мягкое включение/выключение коллекции. Для retired-коллекций ставим false, но не
//   удаляем ее из каталога, чтобы старые token/event записи продолжали резолвиться.
// - theme: визуальный акцент карточек. Не влияет на цену, тираж, владельцев или транзакции.
// - defaultSupply: базовый тираж, от которого seed-генератор считает supply предметов с учетом rarity.
//   После реальных продаж менять вручную нельзя: нужен admin script или миграция Redis-счетчиков.
// - defaultPriceQcoin: базовая человеческая цена до rarity-коррекции и scarcity-кривой.
//   Сервер всегда пересчитывает priceMicro и не доверяет клиенту.
// - defaultSellRateBps: процент выплаты при продаже обратно в хранилище Meta Market.
//   9700 означает 97% от текущей динамической цены конкретной ступени.
// - defaultScarcityPriceBps: целевой процент роста цены при выкупе всего supply коллекции.
//   Алгоритм компаундный: рост и обратное снижение применяются к текущей ступени цены,
//   а не фиксированной прибавкой к исходной базе.
// - previewStrategy: правило выбора превью. Сейчас используется stable-seeded, чтобы превью
//   не прыгало при каждом render и не создавало ощущение сломанной карточки.
// - infoKeyStem: базовый i18n-stem для будущего описания коллекции в кнопке (i).
//   Из него строятся ключи *_title, *_description и *_details. Можно заменить вручную,
//   если коллекция получит отдельную редакционную страницу или локализованное описание.
// - files: текущий тестовый seed PNG. До production itemId может выводиться из filename,
//   после production для замены картинки нужно сохранять старый itemId и менять только assetVersion.
//
// Справочник полей карточки предмета задается в ITEM_CARD_SETTINGS:
// - rarity: визуальный ранг конкретного предмета. Выставляется вручную на каждый item.
// - supply: тираж конкретного предмета. После реальных продаж менять только через migration/admin.
// - priceQcoin: базовая цена конкретного предмета до динамической scarcity-кривой.
// - infoKeyStem: индивидуальный i18n-stem для кнопки (i) и будущего описания предмета.
// - sellRateBps/scarcityPriceBps/active/buyEnabled/sellEnabled/giftEnabled можно задать
//   точечно на конкретном предмете, если он должен отличаться от настроек коллекции.
//
// Итоговый предмет формируется в buildItem:
// - itemId хранит ownership и token history; он переживает смену картинки, цены и перевода.
// - slug сейчас получен из filename, но в production его нельзя считать безопасной бизнес-сущностью.
// - imagePath всегда начинается с /metamarket/ и должен оставаться публичным URL из папки public.
// - titleKey имеет формат metamarket_item_<collectionId>_<slug>; тексты должны жить в 7 словарях.
// - supply, priceQcoin, sellRateBps, scarcityPriceBps являются серверной правдой для расчетов.
// - buyEnabled/sellEnabled/giftEnabled отключают конкретные операции без удаления предмета.
// - assetVersion/catalogVersion/createdAtVersion нужны, чтобы история знала, с каким ассетом
//   и каталогом был создан token, даже если в будущем PNG или название поменяются.
const COLLECTION_DEFINITIONS = [
  // Все блоки коллекций ниже используют один и тот же набор полей; подробные комментарии даны в первом блоке.
  {
    // id: стабильный идентификатор коллекции для API, Redis, itemId и истории.
    id: 'cyber_animals',
    // folder: папка в public/metamarket, откуда берутся тестовые ассеты коллекции.
    folder: 'cyber_animals',
    // code: короткий код коллекции для публичных serial вида MM-CYA-000000001-L7.
    code: 'CYA',
    // titleKey: i18n-ключ видимого названия коллекции.
    titleKey: 'metamarket_collection_cyber_animals',
    // fallbackTitle: технический fallback, если словарь сломан.
    fallbackTitle: 'Cyber Animals',
    // sort: порядок коллекции в корневом списке маркета.
    sort: 10,
    // active: включает или скрывает коллекцию без удаления исторических id.
    active: true,
    // theme: визуальная тема glow/rails для карточек коллекции.
    theme: 'cyan',
    // defaultSupply: стартовый тираж каждого предмета коллекции до rarity-коррекции.
    defaultSupply: 777,
    // defaultPriceQcoin: базовая цена до rarity-коррекции и динамического scarcity-множителя.
    defaultPriceQcoin: 7,
    // defaultSellRateBps: процент выплаты при продаже предмета обратно в маркет.
    defaultSellRateBps: METAMARKET_DEFAULT_SELL_RATE_BPS,
    // defaultScarcityPriceBps: насколько дорожает предмет при уменьшении остатка в хранилище.
    defaultScarcityPriceBps: METAMARKET_DEFAULT_SCARCITY_PRICE_BPS,
    // previewStrategy: стабильный выбор превью без прыжков при re-render.
    previewStrategy: 'stable-seeded',
    // infoKeyStem: базовый stem ключей будущего инфо-поповера коллекции.
    infoKeyStem: 'metamarket_info_collection_cyber_animals',
    // files: тестовые PNG текущего seed-набора; itemId после production нужно держать стабильным.
    files: [
      'Aetherion.webp',
      'AetherScavenger.webp',
      'AquaMind.webp',
      'AquaPulse.webp',
      'AquaSentinel.webp',
      'AuroraVix.webp',
      'BlastHorn.webp',
      'BlazeClaw.webp',
      'BlockSnail.webp',
      'ByteJaw.webp',
      'DataCrane.webp',
      'DataGrizzly.webp',
      'DataHart.webp',
      'Donaflex.webp',
      'EchoByte.webp',
      'FrostByte.webp',
      'GravitonPrime.webp',
      'Heliot.webp',
      'IronTusker.webp',
      'Kynex.webp',
      'LumaGiraffe.webp',
      'MagnoRam.webp',
      'NanoSpecter.webp',
      'NanoTitan.webp',
      'NeonGrace.webp',
      'Neraxis.webp',
      'NeuroBlade.webp',
      'NeuroVenom.webp',
      'NoctSynapse.webp',
      'PulseRunner.webp',
      'PulseShade.webp',
      'PulseStripe.webp',
      'QCat.webp',
      'QDog.webp',
      'QOwl.webp',
      'QuantumSloth.webp',
      'QuantumSteed.webp',
      'RedCore.webp',
      'Rynex.webp',
      'SharKiller.webp',
      'Solara.webp',
      'SolarDune.webp',
      'SolarOx.webp',
      'SubNet.webp',
      'Tharion.webp',
      'ThermoSynapse.webp',
      'Venomatrix.webp',
      'VoltBound.webp',
      'VoltPossum.webp',
      'Zyntrix.webp',
    ],
  },
  {
    id: 'meta_resources',
    folder: 'meta_resources',
    code: 'RES',
    titleKey: 'metamarket_collection_meta_resources',
    fallbackTitle: 'Meta Resources',
    sort: 20,
    active: true,
    theme: 'violet',
    defaultSupply: 1_000_000,
    defaultPriceQcoin: 5,
    defaultSellRateBps: METAMARKET_DEFAULT_SELL_RATE_BPS,
    defaultScarcityPriceBps: METAMARKET_DEFAULT_SCARCITY_PRICE_BPS,
    previewStrategy: 'stable-seeded',
    infoKeyStem: 'metamarket_info_collection_meta_resources',
    files: [
      'Aetheris.webp',
      'Aethora.webp',
      'Aethyra.webp',
      'Antimatter.webp',
      'Asteryon.webp',
      'Aurivon.webp',
      'Bioryn.webp',
      'Biovex.webp',
      'Capacitor.webp',
      'Chronyra.webp',
      'Corelith.webp',
      'Crynthar.webp',
      'Cryovast.webp',
      'Cryovolt.webp',
      'Crystara.webp',
      'Cubeyra.webp',
      'Darkyra.webp',
      'Dreamyra.webp',
      'Dualith.webp',
      'Elyndra.webp',
      'Forgeon.webp',
      'Forman.webp',
      'Fusiora.webp',
      'Galmyra.webp',
      'Glacirion.webp',
      'Gold Nugget.webp',
      'Gravion.webp',
      'Gravionis.webp',
      'Helionis.webp',
      'IgnisCore.webp',
      'Inferyte.webp',
      'IvoryShard.webp',
      'Lumetall.webp',
      'Lumivra.webp',
      'Lumyra.webp',
      'Magnetron.webp',
      'Mechyra.webp',
      'Mystarion.webp',
      'Neonyx.webp',
      'Neuralite.webp',
      'Neuroxis.webp',
      'Noctyra.webp',
      'Oblivara.webp',
      'Oblivyra.webp',
      'Oraclyra.webp',
      'PlasmaFuel.webp',
      'Plasmoryn.webp',
      'Platinyx.webp',
      'Pyronis.webp',
      'QuantPrime.webp',
      'Quantyra.webp',
      'Radiyra.webp',
      'Runyra.webp',
      'Runyxis.webp',
      'Solarion.webp',
      'Solvra.webp',
      'Solyra.webp',
      'Solyros.webp',
      'Stellaris.webp',
      'Terranyx.webp',
      'Toxarion.webp',
      'Umbyra.webp',
      'Varyon.webp',
      'Verdanix.webp',
      'Verdyra.webp',
      'Viridrax.webp',
      'ViridraxBloom.webp',
      'Voidarion.webp',
    ],
  },
  {
    id: 'heroes',
    folder: 'heroes',
    code: 'HER',
    titleKey: 'metamarket_collection_heroes',
    fallbackTitle: 'Heroes',
    sort: 30,
    active: true,
    theme: 'gold',
    defaultSupply: 100000,
    defaultPriceQcoin: 100,
    defaultSellRateBps: METAMARKET_DEFAULT_SELL_RATE_BPS,
    defaultScarcityPriceBps: METAMARKET_DEFAULT_SCARCITY_PRICE_BPS,
    previewStrategy: 'stable-seeded',
    infoKeyStem: 'metamarket_info_collection_heroes',
    files: [
      'Abyssal.webp',
      'AegisPrime.webp',
      'AetherArchitect.webp',
      'Aqualis.webp',
      'Architect.webp',
      'Arkanis.webp',
      'Aureon.webp',
      'AurionCelestis.webp',
      'BronzeSentinel.webp',
      'CelestialEnvoy.webp',
      'ChronoParasite.webp',
      'ColeDust.webp',
      'CorvinShade.webp',
      'Dawnfire.webp',
      'DrakeSolen.webp',
      'DreamEngine.webp',
      'Elias.webp',
      'FireTiron.webp',
      'Frostbane.webp',
      'Gearholt.webp',
      'GlassWarden.webp',
      'HelionVex.webp',
      'Hiveblade.webp',
      'HollowBotanist.webp',
      'IceBlaster.webp',
      'IgnisMartialis.webp',
      'IndustrialТor.webp',
      'Ironclad.webp',
      'IronLegionary.webp',
      'Ka’Roth.webp',
      'KaelDraven.webp',
      'Kaelthorn.webp',
      'Krythar.webp',
      'KuroSynth.webp',
      'LuminDiver.webp',
      'LyraAetheris.webp',
      'LyraFrost.webp',
      'MedievalKnight.webp',
      'MiraHolt.webp',
      'NeonVanguard.webp',
      'Nerathis.webp',
      'Nexara.webp',
      'NoctisVeil.webp',
      'NyraSolstice.webp',
      'NyxArkhon.webp',
      'Obsidian.webp',
      'OrinVale.webp',
      'OrionJack.webp',
      'OrionVexar.webp',
      'Orvian.webp',
      'Ravenna.webp',
      'RaxionBladeclaw.webp',
      'Renaissance.webp',
      'RexVorn.webp',
      'RhaegorVorn.webp',
      'RiftLibrarian.webp',
      'RiftNomad.webp',
      'RonanKade.webp',
      'ScapePredator.webp',
      'SeleneArdent.webp',
      'SeraphionLux.webp',
      'SpectralVoid.webp',
      'Stormlord.webp',
      'Sylvarion.webp',
      'Syterix.webp',
      'Thalvion.webp',
      'TireGekoid.webp',
      'Verdant.webp',
      'Voidstrider.webp',
      'Xir’Tal.webp',
      'Xylaren.webp',
      'ZenithFlux.webp',
      'Zenrath.webp',
      'Zerathion.webp',
      'ZerathOmnivar.webp',
      'Zerion.webp',
      'ZyraMoonfang.webp',
    ],
  },
  {
    id: 'meta_space',
    folder: 'meta_space',
    code: 'MCO',
    titleKey: 'metamarket_collection_meta_space',
    fallbackTitle: 'MetaCosmos',
    sort: 35,
    active: true,
    theme: 'quantum',
    defaultSupply: 250000,
    defaultPriceQcoin: 10,
    defaultSellRateBps: METAMARKET_DEFAULT_SELL_RATE_BPS,
    defaultScarcityPriceBps: METAMARKET_DEFAULT_SCARCITY_PRICE_BPS,
    previewStrategy: 'stable-seeded',
    infoKeyStem: 'metamarket_info_collection_meta_space',
    files: [
      'Abyssarion.webp',
      'AstralRelic.webp',
      'Aurionis.webp',
      'Azurion.webp',
      'Cataclyra.webp',
      'Celestara.webp',
      'Comyra.webp',
      'Corevian.webp',
      'Coronae.webp',
      'CosmicStringX.webp',
      'Cryflame.webp',
      'Cryonix.webp',
      'Cryonys.webp',
      'Cryovex.webp',
      'CrystalMoon.webp',
      'CrystalNebula.webp',
      'Dualith.webp',
      'Dyseron.webp',
      'Eclipsera.webp',
      'Elyndros.webp',
      'Emberis.webp',
      'Emberith.webp',
      'Flareon.webp',
      'Fractyra.webp',
      'Glacira.webp',
      'Glacirion.webp',
      'GlacirionPrime.webp',
      'Glaciron.webp',
      'hardonix.webp',
      'Ignara.webp',
      'IgnarionPrime.webp',
      'Inferra.webp',
      'Jovara.webp',
      'Luminex.webp',
      'LunaCore.webp',
      'MagnetarX.webp',
      'Molthera.webp',
      'NebulaX.webp',
      'Novyra.webp',
      'Oblivara.webp',
      'Oceara.webp',
      'Pyronyx.webp',
      'Pyrragon.webp',
      'Pyrrion.webp',
      'Satyros.webp',
      'SingularityX.webp',
      'Solaris.webp',
      'Solaryx.webp',
      'SupernovaX.webp',
      'TerraPrime.webp',
      'Therionis.webp',
      'VoidSphereX.webp',
      'Volcaris.webp',
      'Voltanys.webp',
      'Xylarion.webp',
    ],
  },
  {
    id: 'real_estate',
    folder: 'real_estate',
    code: 'REA',
    titleKey: 'metamarket_collection_real_estate',
    fallbackTitle: 'Real Estate',
    sort: 40,
    active: true,
    theme: 'emerald',
    defaultSupply: 100000,
    defaultPriceQcoin: 75,
    defaultSellRateBps: METAMARKET_DEFAULT_SELL_RATE_BPS,
    defaultScarcityPriceBps: METAMARKET_DEFAULT_SCARCITY_PRICE_BPS,
    previewStrategy: 'stable-seeded',
    infoKeyStem: 'metamarket_info_collection_real_estate',
    files: [
      'AbyssalForge.webp',
      'Aerionis.webp',
      'Alquira.webp',
      'Aqualis.webp',
      'Aquanex.webp',
      'Aquaryn.webp',
      'Arboris.webp',
      'AsteroidResort.webp',
      'Aurivon.webp',
      'AxisDawn.webp',
      'BioSpire.webp',
      'Brassora.webp',
      'Celestara.webp',
      'ChronaSpire.webp',
      'ChronosHall.webp',
      'Cosmyra.webp',
      'Crownora.webp',
      'CrystalCasino.webp',
      'CrystalRanch.webp',
      'Crythara.webp',
      'Cryvona.webp',
      'Domyra.webp',
      'EchoVault.webp',
      'Ecosyra.webp',
      'Elyndor.webp',
      'Elyndra.webp',
      'Elyzoria.webp',
      'Fluxora.webp',
      'Fortyra.webp',
      'FractalHaven.webp',
      'FrozenPort.webp',
      'Fumora.webp',
      'GalacticMall.webp',
      'GalacticReal.webp',
      'Gearion.webp',
      'Halcyra.webp',
      'Hydryon.webp',
      'Inferis.webp',
      'Isyrel.webp',
      'JungleEstate.webp',
      'Koralyth.webp',
      'Lumivara.webp',
      'Lunaris.webp',
      'LuxoraCore.webp',
      'Marivon.webp',
      'Marsyn.webp',
      'Miralis.webp',
      'Mirathis.webp',
      'Mistora.webp',
      'Mycovar.webp',
      'NebulaHotel.webp',
      'NebularFoundry.webp',
      'Neonix.webp',
      'Nerithis.webp',
      'Nestara.webp',
      'Neythra.webp',
      'Noctyra.webp',
      'OriginTower.webp',
      'Oxivra.webp',
      'Ozyrel.webp',
      'Phorion.webp',
      'QuantumBank.webp',
      'Quantyra.webp',
      'Redora.webp',
      'RustcoreDistrict.webp',
      'Selunaris.webp',
      'Skythrone.webp',
      'Skyvora.webp',
      'SolarMirage.webp',
      'SolarVeil.webp',
      'Stellora.webp',
      'Sweetara.webp',
      'Sylvara.webp',
      'TechnoSpace.webp',
      'Thalora.webp',
      'Thryvon.webp',
      'uxyra.webp',
      'Velora.webp',
      'VerdantSpire.webp',
      'VoidPort.webp',
      'Xelythar.webp',
      'Zenora.webp',
      'Zerathis.webp',
      'Zeylara.webp',
      'Zeythra.webp',
    ],
  },
  {
    id: 'meta_keys',
    folder: 'meta_keys',
    code: 'KEY',
    titleKey: 'metamarket_collection_meta_keys',
    fallbackTitle: 'MetaKeys',
    sort: 50,
    active: true,
    theme: 'quantum',
    defaultSupply: 3000,
    defaultPriceQcoin: 10000,
    defaultSellRateBps: METAMARKET_DEFAULT_SELL_RATE_BPS,
    defaultScarcityPriceBps: 9000,
    previewStrategy: 'stable-seeded',
    infoKeyStem: 'metamarket_info_collection_meta_keys',
    files: [
      'Quantum.webp',
      'On.webp',
      'Si.webp',
      'Vi.webp',
    ],
  },
  {
    id: 'miscellaneous',
    folder: 'miscellaneous',
    code: 'MSC',
    titleKey: 'metamarket_collection_miscellaneous',
    fallbackTitle: 'Miscellaneous',
    sort: 60,
    active: true,
    theme: 'rose',
    defaultSupply: 650_000,
    defaultPriceQcoin: 2,
    defaultSellRateBps: METAMARKET_DEFAULT_SELL_RATE_BPS,
    defaultScarcityPriceBps: METAMARKET_DEFAULT_SCARCITY_PRICE_BPS,
    previewStrategy: 'stable-seeded',
    infoKeyStem: 'metamarket_info_collection_miscellaneous',
    files: [
      'Neocap.webp',
      'Hexaura.webp',
      'Cubryon.webp',
      'Aurajack.webp',
      'Gemnyx.webp',
      'Obscyra.webp',
      'Luminara.webp',
      'Liquidra.webp',
      'Cosmaview.webp',
      'Stellara.webp',
      'Digitron.webp',
      'Flamoryx.webp',
      'Floranyx.webp',
      'Aurabloom.webp',
      'Bouquora.webp',
      'Chronoryx.webp',
      'Quantara.webp',
      'Metachups.webp',
      'Mystara.webp',
      'Globarys.webp',
      'Cyberion.webp',
      'Lumicandle.webp',
      'Ammoryx.webp',
      'Frogaris.webp',
      'Fuelara.webp',
      'Crystalis.webp',
      'Q‑7X9.webp',
      'Cyberbear.webp',
      'Cyberbunny.webp',
      'Biotree.webp',
      'Quantcup.webp',
      'Darkheart.webp',
      'Neosneak.webp',
      'DictaphoneX.webp',
      'Rollerion.webp',
      'Tennix.webp',
      'Rosanyx.webp',
      'Vinylon.webp',
      'Rugbyon.webp',
      'RunestoneX.webp',
      'Statum.webp',
      'Cyberbite.webp',
      'Cyberflag.webp',
      'Steamra.webp',
      'Spectra.webp',
      'Wrenchon.webp',
      'Blasteron.webp',
      'Orbistaff.webp',
      'Oxycandy.webp',
      'Nitrocandy.webp',
      'Jestmask.webp',
      'Cybercorn.webp',
      'Thermoview.webp',
      'Lumisphere.webp',
      'Infernogem.webp',
      'Paracyber.webp',
      'Neonlight.webp',
      'Cyberheart.webp',
      'Cyberboots.webp',
      'Dumblox.webp',
      'Mycoryx.webp',
      'Antivirus.webp',
      'Cyberknife.webp',
      'Cybercatapult.webp',
      'Hydrocaps.webp',
      'Cyberbow.webp',
      'Portalis.webp',
      'Shoptron.webp',
      'Steamscope.webp',
      'Cyberpick.webp',
      'Cyberhelm.webp',
      'Cyberknees.webp',
      'Keyl7.webp',
      'Cyberphones.webp',
      'Cyberskates.webp',
      'Lionflint.webp',
      'Solarcompass.webp',
      'Imperhat.webp',
      'Cyberlip.webp',
      'Steampen.webp',
      'Stoneaxe.webp',
    ],
  },
  {
    id: 'technique',
    folder: 'technique',
    code: 'TEC',
    titleKey: 'metamarket_collection_technique',
    fallbackTitle: 'Technique',
    sort: 70,
    active: true,
    theme: 'blue',
    defaultSupply: 175_000,
    defaultPriceQcoin: 25,
    defaultSellRateBps: METAMARKET_DEFAULT_SELL_RATE_BPS,
    defaultScarcityPriceBps: METAMARKET_DEFAULT_SCARCITY_PRICE_BPS,
    previewStrategy: 'stable-seeded',
    infoKeyStem: 'metamarket_info_collection_technique',
    files: [
      'Abyssor.webp',
      'Aerolyth.webp',
      'Aeroryn.webp',
      'Aetheron.webp',
      'Aquaris.webp',
      'Aracnix.webp',
      'Armoryx.webp',
      'Asteryn.webp',
      'AsterynPrime.webp',
      'Autoryn.webp',
      'Bathoryn.webp',
      'Battalon.webp',
      'Bitrider.webp',
      'Blastoryn.webp',
      'Blastoryx.webp',
      'Chargon.webp',
      'Classoryn.webp',
      'Corelyth.webp',
      'Cryonix.webp',
      'Cryptoryx.webp',
      'Crysalon.webp',
      'Crysalor.webp',
      'Cryseron.webp',
      'Crystarion.webp',
      'Cyberion.webp',
      'Cyberis.webp',
      'Cyberon.webp',
      'Cybervanix.webp',
      'Cylorix.webp',
      'Darkon.webp',
      'Dravion.webp',
      'Dravon.webp',
      'Drillgon.webp',
      'Dualon.webp',
      'Dumpyra.webp',
      'Excaryon.webp',
      'Flygon.webp',
      'Galvion.webp',
      'GirodunePro.webp',
      'Glidron.webp',
      'Graviton.webp',
      'Gravyon.webp',
      'Hauloryx.webp',
      'Hoverion.webp',
      'Hoveron.webp',
      'Hydrion.webp',
      'Hydrionix.webp',
      'Ignaryx.webp',
      'Irydon.webp',
      'Jetron.webp',
      'JetronFly.webp',
      'Lavorix.webp',
      'Luminar.webp',
      'Lunaris.webp',
      'Magnoryx.webp',
      'Marsyra.webp',
      'Mecharis.webp',
      'Metronyx.webp',
      'Motoryn.webp',
      'Nautyra.webp',
      'NautyraSix.webp',
      'Nebryon.webp',
      'NebryonPS.webp',
      'Portyra.webp',
      'Quantor.webp',
      'Railtron.webp',
      'Ravager.webp',
      'Redmaris.webp',
      'Rovaryn.webp',
      'Sailtron.webp',
      'Skyron.webp',
      'Solaryx.webp',
      'Starion.webp',
      'Stealthoryn.webp',
      'Steamaryn.webp',
      'Steamdrill.webp',
      'Steamor.webp',
      'Stormaryx.webp',
      'Subryon.webp',
      'Tankryon.webp',
      'Terradyne.webp',
      'Terramax.webp',
      'Terronix.webp',
      'Titanor.webp',
      'Tourion.webp',
      'Tugoryn.webp',
      'Velaryx.webp',
      'Veyronix.webp',
      'Voltrax.webp',
      'Wartrax.webp',
      'Xerion.webp',
      'Xythera.webp',
    ],
  },
]

const RARITY_SEQUENCE = ['common', 'rare', 'common', 'epic', 'common', 'rare', 'legendary', 'common', 'rare', 'epic', 'mythic', 'quantum']

// Экономическая формула Cyber Animals:
// valueScore задается вручную после визуальной оценки арта от 0 до 100.
// Чем выше valueScore, тем меньше тираж и тем выше базовая цена.
// Кривые нелинейные: топовые предметы получают резкий премиальный скачок цены
// и сильное сжатие supply, а массовые предметы остаются доступными и ликвидными.
const CYBER_ANIMAL_SUPPLY_MIN = 1_000
const CYBER_ANIMAL_SUPPLY_MAX = 100_000
const CYBER_ANIMAL_PRICE_MIN = 50
const CYBER_ANIMAL_PRICE_MAX = 5_000
const CYBER_ANIMAL_SCORE_MIN = 51
const CYBER_ANIMAL_SCORE_MAX = 100
const CYBER_ANIMAL_SUPPLY_CURVE = 1.36

function normalizeCyberAnimalScore(valueScore) {
  const score = clampValueScore(valueScore)
  return Math.max(0, Math.min(1, (score - CYBER_ANIMAL_SCORE_MIN) / (CYBER_ANIMAL_SCORE_MAX - CYBER_ANIMAL_SCORE_MIN)))
}

function interpolateCyberAnimalPrice(valueScore, uniqueKey = '') {
  const score = clampValueScore(valueScore)
  let minScore = 51
  let maxScore = 75
  let minPrice = 50
  let maxPrice = 500
  let curve = 1.18

  if (score >= 96) {
    minScore = 96
    maxScore = 100
    minPrice = 2_400
    maxPrice = CYBER_ANIMAL_PRICE_MAX
    curve = 1.14
  } else if (score >= 91) {
    minScore = 91
    maxScore = 95
    minPrice = 1_300
    maxPrice = 2_000
    curve = 1.08
  } else if (score >= 76) {
    minScore = 76
    maxScore = 90
    minPrice = 520
    maxPrice = 1_200
    curve = 1.12
  }

  const local = Math.max(0, Math.min(1, (score - minScore) / Math.max(1, maxScore - minScore)))
  const basePrice = minPrice + ((maxPrice - minPrice) * Math.pow(local, curve))
  if (!uniqueKey || score === CYBER_ANIMAL_SCORE_MIN || score === CYBER_ANIMAL_SCORE_MAX) return basePrice

  const spread = Math.min(Math.max((maxPrice - minPrice) * 0.0015, 0.01), 4)
  const delta = (stableCatalogFraction(uniqueKey) - 0.5) * spread
  if (score <= minScore) return Math.min(maxPrice, basePrice + Math.abs(delta))
  if (score >= maxScore) return Math.max(minPrice, basePrice - Math.abs(delta))
  return Math.max(minPrice, Math.min(maxPrice, basePrice + delta))
}

function clampValueScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, score))
}

function roundToStep(value, step) {
  return Math.round(Number(value || 0) / step) * step
}

function stableCatalogFraction(value) {
  const source = String(value || '')
  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return (hash % 1000) / 1000
}

function cyberAnimalEconomy(valueScore, uniqueKey = '') {
  const t = normalizeCyberAnimalScore(valueScore)
  const supplyRaw = CYBER_ANIMAL_SUPPLY_MAX - ((CYBER_ANIMAL_SUPPLY_MAX - CYBER_ANIMAL_SUPPLY_MIN) * Math.pow(t, CYBER_ANIMAL_SUPPLY_CURVE))
  const priceRaw = interpolateCyberAnimalPrice(valueScore, uniqueKey)
  return {
    supply: Math.max(CYBER_ANIMAL_SUPPLY_MIN, Math.min(CYBER_ANIMAL_SUPPLY_MAX, roundToStep(supplyRaw, 1))),
    priceQcoin: Math.max(CYBER_ANIMAL_PRICE_MIN, Math.min(CYBER_ANIMAL_PRICE_MAX, Number(priceRaw.toFixed(2)))),
  }
}

function cyberAnimalCard({ rarity, valueScore, infoKeyStem }) {
  return {
    rarity,
    valueScore: clampValueScore(valueScore),
    ...cyberAnimalEconomy(valueScore, infoKeyStem),
    infoKeyStem,
  }
}

const HERO_SUPPLY_MIN = 1_000
const HERO_SUPPLY_MAX = 100_000
const HERO_PRICE_MIN = 50
const HERO_PRICE_MAX = 10_000
const HERO_SCORE_MIN = 25
const HERO_SCORE_MAX = 100
const HERO_TOP_SCORE_MIN = 94.5
const HERO_PREMIUM_SCORE_MIN = 89.5
const HERO_MID_SCORE_MIN = 74
const HERO_PRICE_SUPPLY_CURVE = 0.82

function interpolateHeroPrice(valueScore, uniqueKey = '') {
  const score = clampValueScore(valueScore)
  let minScore = HERO_SCORE_MIN
  let maxScore = HERO_MID_SCORE_MIN - 1
  let minPrice = HERO_PRICE_MIN
  let maxPrice = 500
  let curve = 1.16

  if (score >= HERO_TOP_SCORE_MIN) {
    minScore = HERO_TOP_SCORE_MIN
    maxScore = HERO_SCORE_MAX
    minPrice = 5_100
    maxPrice = HERO_PRICE_MAX
    curve = 1.1
  } else if (score >= HERO_PREMIUM_SCORE_MIN) {
    minScore = HERO_PREMIUM_SCORE_MIN
    maxScore = HERO_TOP_SCORE_MIN - 0.5
    minPrice = 2_600
    maxPrice = 5_000
    curve = 1.08
  } else if (score >= HERO_MID_SCORE_MIN) {
    minScore = HERO_MID_SCORE_MIN
    maxScore = HERO_PREMIUM_SCORE_MIN - 0.5
    minPrice = 525
    maxPrice = 2_500
    curve = 1.12
  }

  const local = Math.max(0, Math.min(1, (score - minScore) / Math.max(1, maxScore - minScore)))
  const basePrice = minPrice + ((maxPrice - minPrice) * Math.pow(local, curve))
  if (!uniqueKey || score === HERO_SCORE_MIN || score === HERO_SCORE_MAX) return basePrice

  const spread = Math.min(Math.max((maxPrice - minPrice) * 0.0015, 0.01), 4)
  const delta = (stableCatalogFraction(uniqueKey) - 0.5) * spread
  if (score <= minScore) return Math.min(maxPrice, basePrice + Math.abs(delta))
  if (score >= maxScore) return Math.max(minPrice, basePrice - Math.abs(delta))
  return Math.max(minPrice, Math.min(maxPrice, basePrice + delta))
}

function heroPriceFromScore(valueScore, uniqueKey = '') {
  return Number(interpolateHeroPrice(valueScore, uniqueKey).toFixed(2))
}

function heroEconomy(valueScore, uniqueKey = '') {
  const priceQcoin = Math.max(HERO_PRICE_MIN, Math.min(HERO_PRICE_MAX, heroPriceFromScore(valueScore, uniqueKey)))
  const priceT = Math.max(0, Math.min(1, (priceQcoin - HERO_PRICE_MIN) / (HERO_PRICE_MAX - HERO_PRICE_MIN)))
  const supplyRaw = HERO_SUPPLY_MAX - ((HERO_SUPPLY_MAX - HERO_SUPPLY_MIN) * Math.pow(priceT, HERO_PRICE_SUPPLY_CURVE))
  return {
    supply: Math.max(HERO_SUPPLY_MIN, Math.min(HERO_SUPPLY_MAX, roundToStep(supplyRaw, 1))),
    priceQcoin,
  }
}

function heroCard({ rarity, valueScore, infoKeyStem }) {
  return {
    rarity,
    valueScore: clampValueScore(valueScore),
    ...heroEconomy(valueScore, infoKeyStem),
    infoKeyStem,
  }
}

// Индивидуальные настройки карточек предметов.
// Чтобы отредактировать конкретный предмет, меняется только его блок ниже:
// fileName остается в collection.files как текущий ассет, а здесь задаются бизнес-поля карточки.
// Важно: itemId по умолчанию строится из collectionId + slug файла и не меняется при замене PNG.
// Если после production нужно заменить картинку старого предмета, меняем fileName в files,
// но сохраняем slug/itemId через отдельную миграцию или явный itemId в этом блоке.
const META_SPACE_SUPPLY_MIN = 1_000
const META_SPACE_SUPPLY_MAX = 250_000
const META_SPACE_PRICE_MIN = 10
const META_SPACE_PRICE_MAX = 7_500
const META_SPACE_SCORE_MIN = 20
const META_SPACE_SUPPLY_CURVE = 0.78
// Порог справедливой цены MetaCosmos: около 30% коллекции доступны до 2000 QCoin.
const META_SPACE_PRICE_ENTRY_SCORE_CAP = 78
const META_SPACE_PRICE_ENTRY_CAP = 500
// Верхний элитный порог: только около 10% коллекции должны быть дороже 20000 QCoin.
const META_SPACE_PRICE_PREMIUM_SCORE_CAP = 96
const META_SPACE_PRICE_PREMIUM_CAP = 5_000
// Локальные кривые внутри диапазонов: ниже значение мягче, выше значение агрессивнее.
const META_SPACE_PRICE_ENTRY_CURVE = 1.2
const META_SPACE_PRICE_MID_CURVE = 2.8
const META_SPACE_PRICE_PREMIUM_CURVE = 1.1

function metaSpacePriceStep() {
  return 0.01
}

function metaSpaceSupplyStep() {
  return 1
}

function metaSpaceEconomy(valueScore) {
  const score = Math.max(META_SPACE_SCORE_MIN, clampValueScore(valueScore))
  let priceRaw = META_SPACE_PRICE_MIN
  if (score <= META_SPACE_PRICE_ENTRY_SCORE_CAP) {
    const t = (score - META_SPACE_SCORE_MIN) / (META_SPACE_PRICE_ENTRY_SCORE_CAP - META_SPACE_SCORE_MIN)
    priceRaw = META_SPACE_PRICE_MIN + ((META_SPACE_PRICE_ENTRY_CAP - META_SPACE_PRICE_MIN) * Math.pow(t, META_SPACE_PRICE_ENTRY_CURVE))
  } else if (score <= META_SPACE_PRICE_PREMIUM_SCORE_CAP) {
    const t = (score - META_SPACE_PRICE_ENTRY_SCORE_CAP) / (META_SPACE_PRICE_PREMIUM_SCORE_CAP - META_SPACE_PRICE_ENTRY_SCORE_CAP)
    priceRaw = META_SPACE_PRICE_ENTRY_CAP + ((META_SPACE_PRICE_PREMIUM_CAP - META_SPACE_PRICE_ENTRY_CAP) * Math.pow(t, META_SPACE_PRICE_MID_CURVE))
  } else {
    const t = (score - META_SPACE_PRICE_PREMIUM_SCORE_CAP) / (100 - META_SPACE_PRICE_PREMIUM_SCORE_CAP)
    priceRaw = META_SPACE_PRICE_PREMIUM_CAP + ((META_SPACE_PRICE_MAX - META_SPACE_PRICE_PREMIUM_CAP) * Math.pow(t, META_SPACE_PRICE_PREMIUM_CURVE))
  }
  const priceQcoin = Math.max(
    META_SPACE_PRICE_MIN,
    Math.min(META_SPACE_PRICE_MAX, roundToStep(priceRaw, metaSpacePriceStep(priceRaw)))
  )
  const priceT = Math.max(0, Math.min(1, (priceQcoin - META_SPACE_PRICE_MIN) / (META_SPACE_PRICE_MAX - META_SPACE_PRICE_MIN)))
  const supplyRaw = META_SPACE_SUPPLY_MAX - ((META_SPACE_SUPPLY_MAX - META_SPACE_SUPPLY_MIN) * Math.pow(priceT, META_SPACE_SUPPLY_CURVE))
  return {
    supply: Math.max(META_SPACE_SUPPLY_MIN, Math.min(META_SPACE_SUPPLY_MAX, roundToStep(supplyRaw, metaSpaceSupplyStep(supplyRaw)))),
    priceQcoin,
  }
}

function metaSpaceCard({ rarity, valueScore, infoKeyStem }) {
  return {
    rarity,
    valueScore: clampValueScore(valueScore),
    ...metaSpaceEconomy(valueScore),
    infoKeyStem,
  }
}

const REAL_ESTATE_SUPPLY_MIN = 1_000
const REAL_ESTATE_SUPPLY_MAX = 100_000
const REAL_ESTATE_PRICE_MIN = 75
const REAL_ESTATE_PRICE_MAX = 25_000
const REAL_ESTATE_SCORE_MIN = 20
const REAL_ESTATE_SCORE_MAX = 100
const REAL_ESTATE_SUPPLY_CURVE = 0.82
const REAL_ESTATE_ENTRY_SCORE_MIN = 50
const REAL_ESTATE_MID_SCORE_MIN = 75
const REAL_ESTATE_PREMIUM_SCORE_MIN = 90
const REAL_ESTATE_TOP_SCORE_MIN = 97

function interpolateRealEstatePrice(valueScore, uniqueKey = '') {
  const score = Math.max(REAL_ESTATE_SCORE_MIN, clampValueScore(valueScore))
  let minScore = REAL_ESTATE_SCORE_MIN
  let maxScore = REAL_ESTATE_ENTRY_SCORE_MIN - 1
  let minPrice = REAL_ESTATE_PRICE_MIN
  let maxPrice = 500
  let curve = 1.18

  if (score >= REAL_ESTATE_TOP_SCORE_MIN) {
    minScore = REAL_ESTATE_TOP_SCORE_MIN
    maxScore = REAL_ESTATE_SCORE_MAX
    minPrice = 10_250
    maxPrice = REAL_ESTATE_PRICE_MAX
    curve = 1.08
  } else if (score >= REAL_ESTATE_PREMIUM_SCORE_MIN) {
    minScore = REAL_ESTATE_PREMIUM_SCORE_MIN
    maxScore = REAL_ESTATE_TOP_SCORE_MIN - 0.5
    minPrice = 5_100
    maxPrice = 10_000
    curve = 1.1
  } else if (score >= REAL_ESTATE_MID_SCORE_MIN) {
    minScore = REAL_ESTATE_MID_SCORE_MIN
    maxScore = REAL_ESTATE_PREMIUM_SCORE_MIN - 0.5
    minPrice = 2_050
    maxPrice = 5_000
    curve = 1.12
  } else if (score >= REAL_ESTATE_ENTRY_SCORE_MIN) {
    minScore = REAL_ESTATE_ENTRY_SCORE_MIN
    maxScore = REAL_ESTATE_MID_SCORE_MIN - 0.5
    minPrice = 525
    maxPrice = 2_000
    curve = 1.14
  }

  const local = Math.max(0, Math.min(1, (score - minScore) / Math.max(1, maxScore - minScore)))
  const basePrice = minPrice + ((maxPrice - minPrice) * Math.pow(local, curve))
  if (!uniqueKey || score === REAL_ESTATE_SCORE_MIN || score === REAL_ESTATE_SCORE_MAX) return basePrice

  const spread = Math.min(Math.max((maxPrice - minPrice) * 0.0015, 0.01), 4)
  const delta = (stableCatalogFraction(uniqueKey) - 0.5) * spread
  if (score <= minScore) return Math.min(maxPrice, basePrice + Math.abs(delta))
  if (score >= maxScore) return Math.max(minPrice, basePrice - Math.abs(delta))
  return Math.max(minPrice, Math.min(maxPrice, basePrice + delta))
}

function realEstateEconomy(valueScore, uniqueKey = '') {
  const priceQcoin = Math.max(
    REAL_ESTATE_PRICE_MIN,
    Math.min(REAL_ESTATE_PRICE_MAX, Number(interpolateRealEstatePrice(valueScore, uniqueKey).toFixed(2)))
  )
  const priceT = Math.max(0, Math.min(1, (priceQcoin - REAL_ESTATE_PRICE_MIN) / (REAL_ESTATE_PRICE_MAX - REAL_ESTATE_PRICE_MIN)))
  const supplyRaw = REAL_ESTATE_SUPPLY_MAX - ((REAL_ESTATE_SUPPLY_MAX - REAL_ESTATE_SUPPLY_MIN) * Math.pow(priceT, REAL_ESTATE_SUPPLY_CURVE))
  return {
    supply: Math.max(REAL_ESTATE_SUPPLY_MIN, Math.min(REAL_ESTATE_SUPPLY_MAX, roundToStep(supplyRaw, 1))),
    priceQcoin,
  }
}

function realEstateCard({ rarity, valueScore, infoKeyStem }) {
  return {
    rarity,
    valueScore: clampValueScore(valueScore),
    ...realEstateEconomy(valueScore, infoKeyStem),
    infoKeyStem,
  }
}

const META_RESOURCE_SUPPLY_MIN = 100_000
const META_RESOURCE_SUPPLY_MAX = 1_000_000
const META_RESOURCE_PRICE_MIN = 5
const META_RESOURCE_PRICE_MAX = 2_500
const META_RESOURCE_SCORE_MIN = 20
const META_RESOURCE_SCORE_MAX = 100
const META_RESOURCE_SUPPLY_CURVE = 0.84
const META_RESOURCE_LOW_SCORE_MAX = 34
const META_RESOURCE_ENTRY_SCORE_MIN = 55
const META_RESOURCE_MID_SCORE_MIN = 75
const META_RESOURCE_PREMIUM_SCORE_MIN = 90

function interpolateMetaResourcePrice(valueScore, uniqueKey = '') {
  const score = Math.max(META_RESOURCE_SCORE_MIN, clampValueScore(valueScore))
  let minScore = META_RESOURCE_SCORE_MIN
  let maxScore = META_RESOURCE_ENTRY_SCORE_MIN - 1
  let minPrice = META_RESOURCE_PRICE_MIN
  let maxPrice = 250
  let curve = 1.18

  if (score >= META_RESOURCE_PREMIUM_SCORE_MIN) {
    minScore = META_RESOURCE_PREMIUM_SCORE_MIN
    maxScore = META_RESOURCE_SCORE_MAX
    minPrice = 1_780
    maxPrice = META_RESOURCE_PRICE_MAX
    curve = 1.08
  } else if (score >= META_RESOURCE_MID_SCORE_MIN) {
    minScore = META_RESOURCE_MID_SCORE_MIN
    maxScore = META_RESOURCE_PREMIUM_SCORE_MIN - 0.5
    minPrice = 1_025
    maxPrice = 1_750
    curve = 1.1
  } else if (score >= META_RESOURCE_ENTRY_SCORE_MIN) {
    minScore = META_RESOURCE_ENTRY_SCORE_MIN
    maxScore = META_RESOURCE_MID_SCORE_MIN - 0.5
    minPrice = 275
    maxPrice = 1_000
    curve = 1.16
  } else if (score > META_RESOURCE_LOW_SCORE_MAX) {
    minScore = META_RESOURCE_LOW_SCORE_MAX + 1
    maxScore = META_RESOURCE_ENTRY_SCORE_MIN - 1
    minPrice = 52
    maxPrice = 250
    curve = 1.14
  } else {
    maxScore = META_RESOURCE_LOW_SCORE_MAX
    maxPrice = 50
    curve = 1.12
  }

  const local = Math.max(0, Math.min(1, (score - minScore) / Math.max(1, maxScore - minScore)))
  const basePrice = minPrice + ((maxPrice - minPrice) * Math.pow(local, curve))
  if (!uniqueKey || score === META_RESOURCE_SCORE_MIN || score === META_RESOURCE_SCORE_MAX) return basePrice

  const spread = Math.min(Math.max((maxPrice - minPrice) * 0.0016, 0.01), 4)
  const delta = (stableCatalogFraction(uniqueKey) - 0.5) * spread
  if (score <= minScore) return Math.min(maxPrice, basePrice + Math.abs(delta))
  if (score >= maxScore) return Math.max(minPrice, basePrice - Math.abs(delta))
  return Math.max(minPrice, Math.min(maxPrice, basePrice + delta))
}

function metaResourceEconomy(valueScore, uniqueKey = '') {
  const priceQcoin = Math.max(
    META_RESOURCE_PRICE_MIN,
    Math.min(META_RESOURCE_PRICE_MAX, Number(interpolateMetaResourcePrice(valueScore, uniqueKey).toFixed(2)))
  )
  const priceT = Math.max(0, Math.min(1, (priceQcoin - META_RESOURCE_PRICE_MIN) / (META_RESOURCE_PRICE_MAX - META_RESOURCE_PRICE_MIN)))
  const supplyRaw = META_RESOURCE_SUPPLY_MAX - ((META_RESOURCE_SUPPLY_MAX - META_RESOURCE_SUPPLY_MIN) * Math.pow(priceT, META_RESOURCE_SUPPLY_CURVE))
  return {
    supply: Math.max(META_RESOURCE_SUPPLY_MIN, Math.min(META_RESOURCE_SUPPLY_MAX, roundToStep(supplyRaw, 1))),
    priceQcoin,
  }
}

function metaResourceCard({ rarity, valueScore, infoKeyStem }) {
  return {
    rarity,
    valueScore: clampValueScore(valueScore),
    ...metaResourceEconomy(valueScore, infoKeyStem),
    infoKeyStem,
  }
}

const MISCELLANEOUS_SUPPLY_MIN = 150_000
const MISCELLANEOUS_SUPPLY_MAX = 650_000
const MISCELLANEOUS_PRICE_MIN = 2
const MISCELLANEOUS_PRICE_MAX = 25
const MISCELLANEOUS_SCORE_MIN = 20
const MISCELLANEOUS_SCORE_MAX = 100
const MISCELLANEOUS_SUPPLY_CURVE = 0.86

function interpolateMiscellaneousPrice(valueScore, uniqueKey = '') {
  const score = Math.max(MISCELLANEOUS_SCORE_MIN, clampValueScore(valueScore))
  let minScore = MISCELLANEOUS_SCORE_MIN
  let maxScore = 45
  let minPrice = MISCELLANEOUS_PRICE_MIN
  let maxPrice = 5
  let curve = 1.14

  if (score >= 94) {
    minScore = 94
    maxScore = MISCELLANEOUS_SCORE_MAX
    minPrice = 22
    maxPrice = MISCELLANEOUS_PRICE_MAX
    curve = 1.06
  } else if (score >= 82) {
    minScore = 82
    maxScore = 93.9
    minPrice = 16
    maxPrice = 22
    curve = 1.08
  } else if (score >= 65) {
    minScore = 65
    maxScore = 81.9
    minPrice = 10
    maxPrice = 16
    curve = 1.1
  } else if (score >= 45) {
    minScore = 45
    maxScore = 64.9
    minPrice = 5
    maxPrice = 10
    curve = 1.12
  }

  const local = Math.max(0, Math.min(1, (score - minScore) / Math.max(1, maxScore - minScore)))
  const basePrice = minPrice + ((maxPrice - minPrice) * Math.pow(local, curve))
  if (!uniqueKey || score === MISCELLANEOUS_SCORE_MIN || score === MISCELLANEOUS_SCORE_MAX) return basePrice

  const spread = Math.min(Math.max((maxPrice - minPrice) * 0.0017, 0.01), 0.18)
  const delta = (stableCatalogFraction(uniqueKey) - 0.5) * spread
  if (score <= minScore) return Math.min(maxPrice, basePrice + Math.abs(delta))
  if (score >= maxScore) return Math.max(minPrice, basePrice - Math.abs(delta))
  return Math.max(minPrice, Math.min(maxPrice, basePrice + delta))
}

function miscellaneousEconomy(valueScore, uniqueKey = '') {
  const priceQcoin = Math.max(
    MISCELLANEOUS_PRICE_MIN,
    Math.min(MISCELLANEOUS_PRICE_MAX, Number(interpolateMiscellaneousPrice(valueScore, uniqueKey).toFixed(2)))
  )
  const priceT = Math.max(0, Math.min(1, (priceQcoin - MISCELLANEOUS_PRICE_MIN) / (MISCELLANEOUS_PRICE_MAX - MISCELLANEOUS_PRICE_MIN)))
  const supplyRaw = MISCELLANEOUS_SUPPLY_MAX - ((MISCELLANEOUS_SUPPLY_MAX - MISCELLANEOUS_SUPPLY_MIN) * Math.pow(priceT, MISCELLANEOUS_SUPPLY_CURVE))
  return {
    supply: Math.max(MISCELLANEOUS_SUPPLY_MIN, Math.min(MISCELLANEOUS_SUPPLY_MAX, roundToStep(supplyRaw, 1))),
    priceQcoin,
  }
}

function miscellaneousCard({ rarity, valueScore, infoKeyStem }) {
  return {
    rarity,
    valueScore: clampValueScore(valueScore),
    ...miscellaneousEconomy(valueScore, infoKeyStem),
    infoKeyStem,
  }
}

const TECHNIQUE_SUPPLY_MIN = 1_000
const TECHNIQUE_SUPPLY_MAX = 175_000
const TECHNIQUE_PRICE_MIN = 25
const TECHNIQUE_PRICE_MAX = 9_000
const TECHNIQUE_SCORE_MIN = 5
const TECHNIQUE_SCORE_MAX = 100
const TECHNIQUE_SUPPLY_CURVE = 0.9

function interpolateTechniquePrice(valueScore, uniqueKey = '') {
  const score = Math.max(TECHNIQUE_SCORE_MIN, clampValueScore(valueScore))
  let minScore = TECHNIQUE_SCORE_MIN
  let maxScore = 29
  let minPrice = TECHNIQUE_PRICE_MIN
  let maxPrice = 100
  let curve = 1.08

  if (score >= 97) {
    minScore = 97
    maxScore = TECHNIQUE_SCORE_MAX
    minPrice = 7_520
    maxPrice = TECHNIQUE_PRICE_MAX
    curve = 1.04
  } else if (score >= 90) {
    minScore = 90
    maxScore = 96.9
    minPrice = 3_540
    maxPrice = 7_500
    curve = 1.07
  } else if (score >= 70) {
    minScore = 70
    maxScore = 89.9
    minPrice = 1_720
    maxPrice = 3_500
    curve = 1.12
  } else if (score >= 50) {
    minScore = 50
    maxScore = 69.9
    minPrice = 520
    maxPrice = 1_750
    curve = 1.16
  } else if (score >= 30) {
    minScore = 30
    maxScore = 49.9
    minPrice = 105
    maxPrice = 500
    curve = 1.14
  }

  const local = Math.max(0, Math.min(1, (score - minScore) / Math.max(1, maxScore - minScore)))
  const basePrice = minPrice + ((maxPrice - minPrice) * Math.pow(local, curve))
  if (!uniqueKey || score === TECHNIQUE_SCORE_MIN || score === TECHNIQUE_SCORE_MAX) return basePrice

  const spread = Math.min(Math.max((maxPrice - minPrice) * 0.0014, 0.01), 6)
  const delta = (stableCatalogFraction(uniqueKey) - 0.5) * spread
  if (score <= minScore) return Math.min(maxPrice, basePrice + Math.abs(delta))
  if (score >= maxScore) return Math.max(minPrice, basePrice - Math.abs(delta))
  return Math.max(minPrice, Math.min(maxPrice, basePrice + delta))
}

function techniqueEconomy(valueScore, uniqueKey = '') {
  const priceQcoin = Math.max(
    TECHNIQUE_PRICE_MIN,
    Math.min(TECHNIQUE_PRICE_MAX, Number(interpolateTechniquePrice(valueScore, uniqueKey).toFixed(2)))
  )
  const priceT = Math.max(0, Math.min(1, (priceQcoin - TECHNIQUE_PRICE_MIN) / (TECHNIQUE_PRICE_MAX - TECHNIQUE_PRICE_MIN)))
  const supplyRaw = TECHNIQUE_SUPPLY_MAX - ((TECHNIQUE_SUPPLY_MAX - TECHNIQUE_SUPPLY_MIN) * Math.pow(priceT, TECHNIQUE_SUPPLY_CURVE))
  return {
    supply: Math.max(TECHNIQUE_SUPPLY_MIN, Math.min(TECHNIQUE_SUPPLY_MAX, roundToStep(supplyRaw, 1))),
    priceQcoin,
  }
}

function techniqueCard({ rarity, valueScore, infoKeyStem }) {
  return {
    rarity,
    valueScore: clampValueScore(valueScore),
    ...techniqueEconomy(valueScore, infoKeyStem),
    infoKeyStem,
  }
}

const ITEM_CARD_SETTINGS = {
  cyber_animals: {
    'Aetherion.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 84, infoKeyStem: 'metamarket_info_item_cyber_animals_aetherion' }),
    'AetherScavenger.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 91, infoKeyStem: 'metamarket_info_item_cyber_animals_aetherscavenger' }),
    'AquaMind.webp': cyberAnimalCard({ rarity: 'quantum', valueScore: 93, infoKeyStem: 'metamarket_info_item_cyber_animals_aquamind' }),
    'AquaPulse.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 56, infoKeyStem: 'metamarket_info_item_cyber_animals_aquapulse' }),
    'AquaSentinel.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 58, infoKeyStem: 'metamarket_info_item_cyber_animals_aquasentinel' }),
    'AuroraVix.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 73, infoKeyStem: 'metamarket_info_item_cyber_animals_auroravix' }),
    'BlastHorn.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 86, infoKeyStem: 'metamarket_info_item_cyber_animals_blasthorn' }),
    'BlazeClaw.webp': cyberAnimalCard({ rarity: 'quantum', valueScore: 95, infoKeyStem: 'metamarket_info_item_cyber_animals_blazeclaw' }),
    'BlockSnail.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 70, infoKeyStem: 'metamarket_info_item_cyber_animals_blocksnail' }),
    'ByteJaw.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 75, infoKeyStem: 'metamarket_info_item_cyber_animals_bytejaw' }),
    'DataCrane.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 77, infoKeyStem: 'metamarket_info_item_cyber_animals_datacrane' }),
    'DataGrizzly.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 83, infoKeyStem: 'metamarket_info_item_cyber_animals_datagrizzly' }),
    'DataHart.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 69, infoKeyStem: 'metamarket_info_item_cyber_animals_datahart' }),
    'Donaflex.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 59, infoKeyStem: 'metamarket_info_item_cyber_animals_donaflex' }),
    'EchoByte.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 71, infoKeyStem: 'metamarket_info_item_cyber_animals_echobyte' }),
    'FrostByte.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 66, infoKeyStem: 'metamarket_info_item_cyber_animals_frostbyte' }),
    'GravitonPrime.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 60, infoKeyStem: 'metamarket_info_item_cyber_animals_gravitonprime' }),
    'Heliot.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 67, infoKeyStem: 'metamarket_info_item_cyber_animals_heliot' }),
    'IronTusker.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 76, infoKeyStem: 'metamarket_info_item_cyber_animals_irontusker' }),
    'Kynex.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 81, infoKeyStem: 'metamarket_info_item_cyber_animals_kynex' }),
    'LumaGiraffe.webp': cyberAnimalCard({ rarity: 'quantum', valueScore: 94, infoKeyStem: 'metamarket_info_item_cyber_animals_lumagiraffe' }),
    'MagnoRam.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 74, infoKeyStem: 'metamarket_info_item_cyber_animals_magnoram' }),
    'NanoSpecter.webp': cyberAnimalCard({ rarity: 'rare', valueScore: 54, infoKeyStem: 'metamarket_info_item_cyber_animals_nanospecter' }),
    'NanoTitan.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 89, infoKeyStem: 'metamarket_info_item_cyber_animals_nanotitan' }),
    'NeonGrace.webp': cyberAnimalCard({ rarity: 'quantum', valueScore: 97, infoKeyStem: 'metamarket_info_item_cyber_animals_neongrace' }),
    'Neraxis.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 87, infoKeyStem: 'metamarket_info_item_cyber_animals_neraxis' }),
    'NeuroBlade.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 78, infoKeyStem: 'metamarket_info_item_cyber_animals_neuroblade' }),
    'NeuroVenom.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 72, infoKeyStem: 'metamarket_info_item_cyber_animals_neurovenom' }),
    'NoctSynapse.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 65, infoKeyStem: 'metamarket_info_item_cyber_animals_noctsynapse' }),
    'PulseRunner.webp': cyberAnimalCard({ rarity: 'rare', valueScore: 53, infoKeyStem: 'metamarket_info_item_cyber_animals_pulserunner' }),
    'PulseShade.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 61, infoKeyStem: 'metamarket_info_item_cyber_animals_pulseshade' }),
    'PulseStripe.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 62, infoKeyStem: 'metamarket_info_item_cyber_animals_pulsestripe' }),
    'QCat.webp': cyberAnimalCard({ rarity: 'quantum', valueScore: 100, infoKeyStem: 'metamarket_info_item_cyber_animals_qcat' }),
    'QDog.webp': cyberAnimalCard({ rarity: 'quantum', valueScore: 99, infoKeyStem: 'metamarket_info_item_cyber_animals_qdog' }),
    'QOwl.webp': cyberAnimalCard({ rarity: 'quantum', valueScore: 98, infoKeyStem: 'metamarket_info_item_cyber_animals_qowl' }),
    'QuantumSloth.webp': cyberAnimalCard({ rarity: 'rare', valueScore: 51, infoKeyStem: 'metamarket_info_item_cyber_animals_quantumsloth' }),
    'QuantumSteed.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 80, infoKeyStem: 'metamarket_info_item_cyber_animals_quantumsteed' }),
    'RedCore.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 92, infoKeyStem: 'metamarket_info_item_cyber_animals_redcore' }),
    'Rynex.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 82, infoKeyStem: 'metamarket_info_item_cyber_animals_rynex' }),
    'SharKiller.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 85, infoKeyStem: 'metamarket_info_item_cyber_animals_sharkiller' }),
    'Solara.webp': cyberAnimalCard({ rarity: 'quantum', valueScore: 96, infoKeyStem: 'metamarket_info_item_cyber_animals_solara' }),
    'SolarDune.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 57, infoKeyStem: 'metamarket_info_item_cyber_animals_solardune' }),
    'SolarOx.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 64, infoKeyStem: 'metamarket_info_item_cyber_animals_solarox' }),
    'SubNet.webp': cyberAnimalCard({ rarity: 'legendary', valueScore: 68, infoKeyStem: 'metamarket_info_item_cyber_animals_subnet' }),
    'Tharion.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 90, infoKeyStem: 'metamarket_info_item_cyber_animals_tharion' }),
    'ThermoSynapse.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 88, infoKeyStem: 'metamarket_info_item_cyber_animals_thermosynapse' }),
    'Venomatrix.webp': cyberAnimalCard({ rarity: 'mythic', valueScore: 79, infoKeyStem: 'metamarket_info_item_cyber_animals_venomatrix' }),
    'VoltBound.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 55, infoKeyStem: 'metamarket_info_item_cyber_animals_voltbound' }),
    'VoltPossum.webp': cyberAnimalCard({ rarity: 'rare', valueScore: 52, infoKeyStem: 'metamarket_info_item_cyber_animals_voltpossum' }),
    'Zyntrix.webp': cyberAnimalCard({ rarity: 'epic', valueScore: 63, infoKeyStem: 'metamarket_info_item_cyber_animals_zyntrix' }),
  },
  meta_resources: {
    'Aetheris.webp': metaResourceCard({ rarity: 'rare', valueScore: 54, infoKeyStem: 'metamarket_info_item_meta_resources_aetheris' }),
    'Aethora.webp': metaResourceCard({ rarity: 'rare', valueScore: 53, infoKeyStem: 'metamarket_info_item_meta_resources_aethora' }),
    'Aethyra.webp': metaResourceCard({ rarity: 'rare', valueScore: 52, infoKeyStem: 'metamarket_info_item_meta_resources_aethyra' }),
    'Antimatter.webp': metaResourceCard({ rarity: 'mythic', valueScore: 94, infoKeyStem: 'metamarket_info_item_meta_resources_antimatter' }),
    'Asteryon.webp': metaResourceCard({ rarity: 'legendary', valueScore: 91, infoKeyStem: 'metamarket_info_item_meta_resources_asteryon' }),
    'Aurivon.webp': metaResourceCard({ rarity: 'legendary', valueScore: 83, infoKeyStem: 'metamarket_info_item_meta_resources_aurivon' }),
    'Bioryn.webp': metaResourceCard({ rarity: 'rare', valueScore: 51, infoKeyStem: 'metamarket_info_item_meta_resources_bioryn' }),
    'Biovex.webp': metaResourceCard({ rarity: 'rare', valueScore: 64, infoKeyStem: 'metamarket_info_item_meta_resources_biovex' }),
    'Capacitor.webp': metaResourceCard({ rarity: 'epic', valueScore: 72, infoKeyStem: 'metamarket_info_item_meta_resources_capacitor' }),
    'Chronyra.webp': metaResourceCard({ rarity: 'mythic', valueScore: 96, infoKeyStem: 'metamarket_info_item_meta_resources_chronyra' }),
    'Corelith.webp': metaResourceCard({ rarity: 'rare', valueScore: 67, infoKeyStem: 'metamarket_info_item_meta_resources_corelith' }),
    'Crynthar.webp': metaResourceCard({ rarity: 'rare', valueScore: 50, infoKeyStem: 'metamarket_info_item_meta_resources_crynthar' }),
    'Cryovast.webp': metaResourceCard({ rarity: 'rare', valueScore: 49, infoKeyStem: 'metamarket_info_item_meta_resources_cryovast' }),
    'Cryovolt.webp': metaResourceCard({ rarity: 'epic', valueScore: 65, infoKeyStem: 'metamarket_info_item_meta_resources_cryovolt' }),
    'Crystara.webp': metaResourceCard({ rarity: 'common', valueScore: 48, infoKeyStem: 'metamarket_info_item_meta_resources_crystara' }),
    'Cubeyra.webp': metaResourceCard({ rarity: 'common', valueScore: 47, infoKeyStem: 'metamarket_info_item_meta_resources_cubeyra' }),
    'Darkyra.webp': metaResourceCard({ rarity: 'rare', valueScore: 46, infoKeyStem: 'metamarket_info_item_meta_resources_darkyra' }),
    'Dreamyra.webp': metaResourceCard({ rarity: 'rare', valueScore: 45, infoKeyStem: 'metamarket_info_item_meta_resources_dreamyra' }),
    'Dualith.webp': metaResourceCard({ rarity: 'epic', valueScore: 63, infoKeyStem: 'metamarket_info_item_meta_resources_dualith' }),
    'Elyndra.webp': metaResourceCard({ rarity: 'rare', valueScore: 44, infoKeyStem: 'metamarket_info_item_meta_resources_elyndra' }),
    'Forgeon.webp': metaResourceCard({ rarity: 'epic', valueScore: 71, infoKeyStem: 'metamarket_info_item_meta_resources_forgeon' }),
    'Forman.webp': metaResourceCard({ rarity: 'common', valueScore: 43, infoKeyStem: 'metamarket_info_item_meta_resources_forman' }),
    'Fusiora.webp': metaResourceCard({ rarity: 'epic', valueScore: 69, infoKeyStem: 'metamarket_info_item_meta_resources_fusiora' }),
    'Galmyra.webp': metaResourceCard({ rarity: 'rare', valueScore: 42, infoKeyStem: 'metamarket_info_item_meta_resources_galmyra' }),
    'Glacirion.webp': metaResourceCard({ rarity: 'rare', valueScore: 41, infoKeyStem: 'metamarket_info_item_meta_resources_glacirion' }),
    'Gold Nugget.webp': metaResourceCard({ rarity: 'rare', valueScore: 40, infoKeyStem: 'metamarket_info_item_meta_resources_gold_nugget' }),
    'Gravion.webp': metaResourceCard({ rarity: 'legendary', valueScore: 74, infoKeyStem: 'metamarket_info_item_meta_resources_gravion' }),
    'Gravionis.webp': metaResourceCard({ rarity: 'legendary', valueScore: 89, infoKeyStem: 'metamarket_info_item_meta_resources_gravionis' }),
    'Helionis.webp': metaResourceCard({ rarity: 'rare', valueScore: 39, infoKeyStem: 'metamarket_info_item_meta_resources_helionis' }),
    'IgnisCore.webp': metaResourceCard({ rarity: 'rare', valueScore: 38, infoKeyStem: 'metamarket_info_item_meta_resources_igniscore' }),
    'Inferyte.webp': metaResourceCard({ rarity: 'rare', valueScore: 37, infoKeyStem: 'metamarket_info_item_meta_resources_inferyte' }),
    'IvoryShard.webp': metaResourceCard({ rarity: 'common', valueScore: 36, infoKeyStem: 'metamarket_info_item_meta_resources_ivoryshard' }),
    'Lumetall.webp': metaResourceCard({ rarity: 'common', valueScore: 35, infoKeyStem: 'metamarket_info_item_meta_resources_lumetall' }),
    'Lumivra.webp': metaResourceCard({ rarity: 'common', valueScore: 34, infoKeyStem: 'metamarket_info_item_meta_resources_lumivra' }),
    'Lumyra.webp': metaResourceCard({ rarity: 'common', valueScore: 33, infoKeyStem: 'metamarket_info_item_meta_resources_lumyra' }),
    'Magnetron.webp': metaResourceCard({ rarity: 'rare', valueScore: 32, infoKeyStem: 'metamarket_info_item_meta_resources_magnetron' }),
    'Mechyra.webp': metaResourceCard({ rarity: 'rare', valueScore: 61, infoKeyStem: 'metamarket_info_item_meta_resources_mechyra' }),
    'Mystarion.webp': metaResourceCard({ rarity: 'epic', valueScore: 75, infoKeyStem: 'metamarket_info_item_meta_resources_mystarion' }),
    'Neonyx.webp': metaResourceCard({ rarity: 'legendary', valueScore: 81, infoKeyStem: 'metamarket_info_item_meta_resources_neonyx' }),
    'Neuralite.webp': metaResourceCard({ rarity: 'epic', valueScore: 62, infoKeyStem: 'metamarket_info_item_meta_resources_neuralite' }),
    'Neuroxis.webp': metaResourceCard({ rarity: 'legendary', valueScore: 78, infoKeyStem: 'metamarket_info_item_meta_resources_neuroxis' }),
    'Noctyra.webp': metaResourceCard({ rarity: 'rare', valueScore: 31, infoKeyStem: 'metamarket_info_item_meta_resources_noctyra' }),
    'Oblivara.webp': metaResourceCard({ rarity: 'rare', valueScore: 30, infoKeyStem: 'metamarket_info_item_meta_resources_oblivara' }),
    'Oblivyra.webp': metaResourceCard({ rarity: 'rare', valueScore: 29, infoKeyStem: 'metamarket_info_item_meta_resources_oblivyra' }),
    'Oraclyra.webp': metaResourceCard({ rarity: 'rare', valueScore: 28, infoKeyStem: 'metamarket_info_item_meta_resources_oraclyra' }),
    'PlasmaFuel.webp': metaResourceCard({ rarity: 'rare', valueScore: 60, infoKeyStem: 'metamarket_info_item_meta_resources_plasmafuel' }),
    'Plasmoryn.webp': metaResourceCard({ rarity: 'epic', valueScore: 77, infoKeyStem: 'metamarket_info_item_meta_resources_plasmoryn' }),
    'Platinyx.webp': metaResourceCard({ rarity: 'common', valueScore: 27, infoKeyStem: 'metamarket_info_item_meta_resources_platinyx' }),
    'Pyronis.webp': metaResourceCard({ rarity: 'common', valueScore: 26, infoKeyStem: 'metamarket_info_item_meta_resources_pyronis' }),
    'QuantPrime.webp': metaResourceCard({ rarity: 'quantum', valueScore: 100, infoKeyStem: 'metamarket_info_item_meta_resources_quantprime' }),
    'Quantyra.webp': metaResourceCard({ rarity: 'legendary', valueScore: 87, infoKeyStem: 'metamarket_info_item_meta_resources_quantyra' }),
    'Radiyra.webp': metaResourceCard({ rarity: 'mythic', valueScore: 80, infoKeyStem: 'metamarket_info_item_meta_resources_radiyra' }),
    'Runyra.webp': metaResourceCard({ rarity: 'common', valueScore: 25, infoKeyStem: 'metamarket_info_item_meta_resources_runyra' }),
    'Runyxis.webp': metaResourceCard({ rarity: 'mythic', valueScore: 85, infoKeyStem: 'metamarket_info_item_meta_resources_runyxis' }),
    'Solarion.webp': metaResourceCard({ rarity: 'common', valueScore: 24, infoKeyStem: 'metamarket_info_item_meta_resources_solarion' }),
    'Solvra.webp': metaResourceCard({ rarity: 'common', valueScore: 23, infoKeyStem: 'metamarket_info_item_meta_resources_solvra' }),
    'Solyra.webp': metaResourceCard({ rarity: 'common', valueScore: 22, infoKeyStem: 'metamarket_info_item_meta_resources_solyra' }),
    'Solyros.webp': metaResourceCard({ rarity: 'rare', valueScore: 59, infoKeyStem: 'metamarket_info_item_meta_resources_solyros' }),
    'Stellaris.webp': metaResourceCard({ rarity: 'legendary', valueScore: 76, infoKeyStem: 'metamarket_info_item_meta_resources_stellaris' }),
    'Terranyx.webp': metaResourceCard({ rarity: 'common', valueScore: 21, infoKeyStem: 'metamarket_info_item_meta_resources_terranyx' }),
    'Toxarion.webp': metaResourceCard({ rarity: 'common', valueScore: 20, infoKeyStem: 'metamarket_info_item_meta_resources_toxarion' }),
    'Umbyra.webp': metaResourceCard({ rarity: 'common', valueScore: 20.5, infoKeyStem: 'metamarket_info_item_meta_resources_umbyra' }),
    'Varyon.webp': metaResourceCard({ rarity: 'rare', valueScore: 57, infoKeyStem: 'metamarket_info_item_meta_resources_varyon' }),
    'Verdanix.webp': metaResourceCard({ rarity: 'common', valueScore: 21.5, infoKeyStem: 'metamarket_info_item_meta_resources_verdanix' }),
    'Verdyra.webp': metaResourceCard({ rarity: 'common', valueScore: 22.5, infoKeyStem: 'metamarket_info_item_meta_resources_verdyra' }),
    'Viridrax.webp': metaResourceCard({ rarity: 'common', valueScore: 23.5, infoKeyStem: 'metamarket_info_item_meta_resources_viridrax' }),
    'ViridraxBloom.webp': metaResourceCard({ rarity: 'epic', valueScore: 56, infoKeyStem: 'metamarket_info_item_meta_resources_viridraxbloom' }),
    'Voidarion.webp': metaResourceCard({ rarity: 'common', valueScore: 24.5, infoKeyStem: 'metamarket_info_item_meta_resources_voidarion' }),
  },
  heroes: {
    'Abyssal.webp': heroCard({ rarity: 'mythic', valueScore: 90, infoKeyStem: 'metamarket_info_item_heroes_abyssal' }),
    'AegisPrime.webp': heroCard({ rarity: 'epic', valueScore: 62, infoKeyStem: 'metamarket_info_item_heroes_aegisprime' }),
    'AetherArchitect.webp': heroCard({ rarity: 'quantum', valueScore: 98, infoKeyStem: 'metamarket_info_item_heroes_aetherarchitect' }),
    'Aqualis.webp': heroCard({ rarity: 'mythic', valueScore: 83, infoKeyStem: 'metamarket_info_item_heroes_aqualis' }),
    'Architect.webp': heroCard({ rarity: 'quantum', valueScore: 95, infoKeyStem: 'metamarket_info_item_heroes_architect' }),
    'Arkanis.webp': heroCard({ rarity: 'quantum', valueScore: 97, infoKeyStem: 'metamarket_info_item_heroes_arkanis' }),
    'Aureon.webp': heroCard({ rarity: 'rare', valueScore: 44, infoKeyStem: 'metamarket_info_item_heroes_aureon' }),
    'AurionCelestis.webp': heroCard({ rarity: 'mythic', valueScore: 92, infoKeyStem: 'metamarket_info_item_heroes_aurioncelestis' }),
    'BronzeSentinel.webp': heroCard({ rarity: 'epic', valueScore: 48, infoKeyStem: 'metamarket_info_item_heroes_bronzesentinel' }),
    'CelestialEnvoy.webp': heroCard({ rarity: 'mythic', valueScore: 87, infoKeyStem: 'metamarket_info_item_heroes_celestialenvoy' }),
    'ChronoParasite.webp': heroCard({ rarity: 'mythic', valueScore: 93, infoKeyStem: 'metamarket_info_item_heroes_chronoparasite' }),
    'ColeDust.webp': heroCard({ rarity: 'rare', valueScore: 32, infoKeyStem: 'metamarket_info_item_heroes_coledust' }),
    'CorvinShade.webp': heroCard({ rarity: 'epic', valueScore: 58, infoKeyStem: 'metamarket_info_item_heroes_corvinshade' }),
    'Dawnfire.webp': heroCard({ rarity: 'legendary', valueScore: 79, infoKeyStem: 'metamarket_info_item_heroes_dawnfire' }),
    'DrakeSolen.webp': heroCard({ rarity: 'common', valueScore: 30, infoKeyStem: 'metamarket_info_item_heroes_drakesolen' }),
    'DreamEngine.webp': heroCard({ rarity: 'quantum', valueScore: 96, infoKeyStem: 'metamarket_info_item_heroes_dreamengine' }),
    'Elias.webp': heroCard({ rarity: 'common', valueScore: 27, infoKeyStem: 'metamarket_info_item_heroes_elias' }),
    'FireTiron.webp': heroCard({ rarity: 'mythic', valueScore: 88, infoKeyStem: 'metamarket_info_item_heroes_firetiron' }),
    'Frostbane.webp': heroCard({ rarity: 'epic', valueScore: 55, infoKeyStem: 'metamarket_info_item_heroes_frostbane' }),
    'Gearholt.webp': heroCard({ rarity: 'rare', valueScore: 41, infoKeyStem: 'metamarket_info_item_heroes_gearholt' }),
    'GlassWarden.webp': heroCard({ rarity: 'quantum', valueScore: 94, infoKeyStem: 'metamarket_info_item_heroes_glasswarden' }),
    'HelionVex.webp': heroCard({ rarity: 'mythic', valueScore: 86, infoKeyStem: 'metamarket_info_item_heroes_helionvex' }),
    'Hiveblade.webp': heroCard({ rarity: 'legendary', valueScore: 76, infoKeyStem: 'metamarket_info_item_heroes_hiveblade' }),
    'HollowBotanist.webp': heroCard({ rarity: 'mythic', valueScore: 91, infoKeyStem: 'metamarket_info_item_heroes_hollowbotanist' }),
    'IceBlaster.webp': heroCard({ rarity: 'mythic', valueScore: 82, infoKeyStem: 'metamarket_info_item_heroes_iceblaster' }),
    'IgnisMartialis.webp': heroCard({ rarity: 'mythic', valueScore: 85, infoKeyStem: 'metamarket_info_item_heroes_ignismartialis' }),
    'IndustrialТor.webp': heroCard({ rarity: 'rare', valueScore: 37, infoKeyStem: 'metamarket_info_item_heroes_industrial_or' }),
    'Ironclad.webp': heroCard({ rarity: 'rare', valueScore: 43, infoKeyStem: 'metamarket_info_item_heroes_ironclad' }),
    'IronLegionary.webp': heroCard({ rarity: 'epic', valueScore: 45, infoKeyStem: 'metamarket_info_item_heroes_ironlegionary' }),
    'Ka’Roth.webp': heroCard({ rarity: 'legendary', valueScore: 80, infoKeyStem: 'metamarket_info_item_heroes_ka_roth' }),
    'KaelDraven.webp': heroCard({ rarity: 'rare', valueScore: 35, infoKeyStem: 'metamarket_info_item_heroes_kaeldraven' }),
    'Kaelthorn.webp': heroCard({ rarity: 'epic', valueScore: 53, infoKeyStem: 'metamarket_info_item_heroes_kaelthorn' }),
    'Krythar.webp': heroCard({ rarity: 'mythic', valueScore: 89, infoKeyStem: 'metamarket_info_item_heroes_krythar' }),
    'KuroSynth.webp': heroCard({ rarity: 'legendary', valueScore: 68, infoKeyStem: 'metamarket_info_item_heroes_kurosynth' }),
    'LuminDiver.webp': heroCard({ rarity: 'mythic', valueScore: 84, infoKeyStem: 'metamarket_info_item_heroes_lumindiver' }),
    'LyraAetheris.webp': heroCard({ rarity: 'quantum', valueScore: 99, infoKeyStem: 'metamarket_info_item_heroes_lyraaetheris' }),
    'LyraFrost.webp': heroCard({ rarity: 'epic', valueScore: 49, infoKeyStem: 'metamarket_info_item_heroes_lyrafrost' }),
    'MedievalKnight.webp': heroCard({ rarity: 'rare', valueScore: 33, infoKeyStem: 'metamarket_info_item_heroes_medievalknight' }),
    'MiraHolt.webp': heroCard({ rarity: 'rare', valueScore: 39, infoKeyStem: 'metamarket_info_item_heroes_miraholt' }),
    'NeonVanguard.webp': heroCard({ rarity: 'legendary', valueScore: 72, infoKeyStem: 'metamarket_info_item_heroes_neonvanguard' }),
    'Nerathis.webp': heroCard({ rarity: 'legendary', valueScore: 81, infoKeyStem: 'metamarket_info_item_heroes_nerathis' }),
    'Nexara.webp': heroCard({ rarity: 'legendary', valueScore: 78, infoKeyStem: 'metamarket_info_item_heroes_nexara' }),
    'NoctisVeil.webp': heroCard({ rarity: 'mythic', valueScore: 90.5, infoKeyStem: 'metamarket_info_item_heroes_noctisveil' }),
    'NyraSolstice.webp': heroCard({ rarity: 'legendary', valueScore: 77, infoKeyStem: 'metamarket_info_item_heroes_nyrasolstice' }),
    'NyxArkhon.webp': heroCard({ rarity: 'legendary', valueScore: 69, infoKeyStem: 'metamarket_info_item_heroes_nyxarkhon' }),
    'Obsidian.webp': heroCard({ rarity: 'legendary', valueScore: 74, infoKeyStem: 'metamarket_info_item_heroes_obsidian' }),
    'OrinVale.webp': heroCard({ rarity: 'rare', valueScore: 34, infoKeyStem: 'metamarket_info_item_heroes_orinvale' }),
    'OrionJack.webp': heroCard({ rarity: 'common', valueScore: 25, infoKeyStem: 'metamarket_info_item_heroes_orionjack' }),
    'OrionVexar.webp': heroCard({ rarity: 'legendary', valueScore: 73, infoKeyStem: 'metamarket_info_item_heroes_orionvexar' }),
    'Orvian.webp': heroCard({ rarity: 'epic', valueScore: 47, infoKeyStem: 'metamarket_info_item_heroes_orvian' }),
    'Ravenna.webp': heroCard({ rarity: 'epic', valueScore: 57, infoKeyStem: 'metamarket_info_item_heroes_ravenna' }),
    'RaxionBladeclaw.webp': heroCard({ rarity: 'legendary', valueScore: 66, infoKeyStem: 'metamarket_info_item_heroes_raxionbladeclaw' }),
    'Renaissance.webp': heroCard({ rarity: 'rare', valueScore: 31, infoKeyStem: 'metamarket_info_item_heroes_renaissance' }),
    'RexVorn.webp': heroCard({ rarity: 'epic', valueScore: 50, infoKeyStem: 'metamarket_info_item_heroes_rexvorn' }),
    'RhaegorVorn.webp': heroCard({ rarity: 'legendary', valueScore: 75, infoKeyStem: 'metamarket_info_item_heroes_rhaegorvorn' }),
    'RiftLibrarian.webp': heroCard({ rarity: 'quantum', valueScore: 98.5, infoKeyStem: 'metamarket_info_item_heroes_riftlibrarian' }),
    'RiftNomad.webp': heroCard({ rarity: 'mythic', valueScore: 89.5, infoKeyStem: 'metamarket_info_item_heroes_riftnomad' }),
    'RonanKade.webp': heroCard({ rarity: 'rare', valueScore: 36, infoKeyStem: 'metamarket_info_item_heroes_ronankade' }),
    'ScapePredator.webp': heroCard({ rarity: 'mythic', valueScore: 86.5, infoKeyStem: 'metamarket_info_item_heroes_scapepredator' }),
    'SeleneArdent.webp': heroCard({ rarity: 'mythic', valueScore: 83.5, infoKeyStem: 'metamarket_info_item_heroes_seleneardent' }),
    'SeraphionLux.webp': heroCard({ rarity: 'quantum', valueScore: 100, infoKeyStem: 'metamarket_info_item_heroes_seraphionlux' }),
    'SpectralVoid.webp': heroCard({ rarity: 'legendary', valueScore: 71, infoKeyStem: 'metamarket_info_item_heroes_spectralvoid' }),
    'Stormlord.webp': heroCard({ rarity: 'legendary', valueScore: 80.5, infoKeyStem: 'metamarket_info_item_heroes_stormlord' }),
    'Sylvarion.webp': heroCard({ rarity: 'epic', valueScore: 46, infoKeyStem: 'metamarket_info_item_heroes_sylvarion' }),
    'Syterix.webp': heroCard({ rarity: 'legendary', valueScore: 67, infoKeyStem: 'metamarket_info_item_heroes_syterix' }),
    'Thalvion.webp': heroCard({ rarity: 'mythic', valueScore: 84.5, infoKeyStem: 'metamarket_info_item_heroes_thalvion' }),
    'TireGekoid.webp': heroCard({ rarity: 'rare', valueScore: 42, infoKeyStem: 'metamarket_info_item_heroes_tiregekoid' }),
    'Verdant.webp': heroCard({ rarity: 'epic', valueScore: 65, infoKeyStem: 'metamarket_info_item_heroes_verdant' }),
    'Voidstrider.webp': heroCard({ rarity: 'legendary', valueScore: 79.5, infoKeyStem: 'metamarket_info_item_heroes_voidstrider' }),
    'Xir’Tal.webp': heroCard({ rarity: 'legendary', valueScore: 70, infoKeyStem: 'metamarket_info_item_heroes_xir_tal' }),
    'Xylaren.webp': heroCard({ rarity: 'epic', valueScore: 52, infoKeyStem: 'metamarket_info_item_heroes_xylaren' }),
    'ZenithFlux.webp': heroCard({ rarity: 'quantum', valueScore: 94.5, infoKeyStem: 'metamarket_info_item_heroes_zenithflux' }),
    'Zenrath.webp': heroCard({ rarity: 'epic', valueScore: 60, infoKeyStem: 'metamarket_info_item_heroes_zenrath' }),
    'Zerathion.webp': heroCard({ rarity: 'mythic', valueScore: 91.5, infoKeyStem: 'metamarket_info_item_heroes_zerathion' }),
    'ZerathOmnivar.webp': heroCard({ rarity: 'mythic', valueScore: 82.5, infoKeyStem: 'metamarket_info_item_heroes_zerathomnivar' }),
    'Zerion.webp': heroCard({ rarity: 'mythic', valueScore: 87.5, infoKeyStem: 'metamarket_info_item_heroes_zerion' }),
    'ZyraMoonfang.webp': heroCard({ rarity: 'epic', valueScore: 64, infoKeyStem: 'metamarket_info_item_heroes_zyramoonfang' }),
  },
  meta_space: {
    'Abyssarion.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 88, infoKeyStem: 'metamarket_info_item_meta_space_abyssarion' }),
    'AstralRelic.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 98, infoKeyStem: 'metamarket_info_item_meta_space_astralrelic' }),
    'Aurionis.webp': metaSpaceCard({ rarity: 'epic', valueScore: 62, infoKeyStem: 'metamarket_info_item_meta_space_aurionis' }),
    'Azurion.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 72, infoKeyStem: 'metamarket_info_item_meta_space_azurion' }),
    'Cataclyra.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 87, infoKeyStem: 'metamarket_info_item_meta_space_cataclyra' }),
    'Celestara.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 95, infoKeyStem: 'metamarket_info_item_meta_space_celestara' }),
    'Comyra.webp': metaSpaceCard({ rarity: 'rare', valueScore: 42, infoKeyStem: 'metamarket_info_item_meta_space_comyra' }),
    'Corevian.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 88.5, infoKeyStem: 'metamarket_info_item_meta_space_corevian' }),
    'Coronae.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 76, infoKeyStem: 'metamarket_info_item_meta_space_coronae' }),
    'CosmicStringX.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 96, infoKeyStem: 'metamarket_info_item_meta_space_cosmicstringx' }),
    'Cryflame.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 97, infoKeyStem: 'metamarket_info_item_meta_space_cryflame' }),
    'Cryonix.webp': metaSpaceCard({ rarity: 'rare', valueScore: 38, infoKeyStem: 'metamarket_info_item_meta_space_cryonix' }),
    'Cryonys.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 70, infoKeyStem: 'metamarket_info_item_meta_space_cryonys' }),
    'Cryovex.webp': metaSpaceCard({ rarity: 'epic', valueScore: 58, infoKeyStem: 'metamarket_info_item_meta_space_cryovex' }),
    'CrystalMoon.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 73, infoKeyStem: 'metamarket_info_item_meta_space_crystalmoon' }),
    'CrystalNebula.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 94, infoKeyStem: 'metamarket_info_item_meta_space_crystalnebula' }),
    'Dualith.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 99, infoKeyStem: 'metamarket_info_item_meta_space_dualith' }),
    'Dyseron.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 80, infoKeyStem: 'metamarket_info_item_meta_space_dyseron' }),
    'Eclipsera.webp': metaSpaceCard({ rarity: 'epic', valueScore: 55, infoKeyStem: 'metamarket_info_item_meta_space_eclipsera' }),
    'Elyndros.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 74, infoKeyStem: 'metamarket_info_item_meta_space_elyndros' }),
    'Emberis.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 89, infoKeyStem: 'metamarket_info_item_meta_space_emberis' }),
    'Emberith.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 83, infoKeyStem: 'metamarket_info_item_meta_space_emberith' }),
    'Flareon.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 78, infoKeyStem: 'metamarket_info_item_meta_space_flareon' }),
    'Fractyra.webp': metaSpaceCard({ rarity: 'epic', valueScore: 57, infoKeyStem: 'metamarket_info_item_meta_space_fractyra' }),
    'Glacira.webp': metaSpaceCard({ rarity: 'epic', valueScore: 60, infoKeyStem: 'metamarket_info_item_meta_space_glacira' }),
    'Glacirion.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 75, infoKeyStem: 'metamarket_info_item_meta_space_glacirion' }),
    'GlacirionPrime.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 91, infoKeyStem: 'metamarket_info_item_meta_space_glacirionprime' }),
    'Glaciron.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 77, infoKeyStem: 'metamarket_info_item_meta_space_glaciron' }),
    'hardonix.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 85, infoKeyStem: 'metamarket_info_item_meta_space_hardonix' }),
    'Ignara.webp': metaSpaceCard({ rarity: 'epic', valueScore: 66, infoKeyStem: 'metamarket_info_item_meta_space_ignara' }),
    'IgnarionPrime.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 92, infoKeyStem: 'metamarket_info_item_meta_space_ignarionprime' }),
    'Inferra.webp': metaSpaceCard({ rarity: 'epic', valueScore: 64, infoKeyStem: 'metamarket_info_item_meta_space_inferra' }),
    'Jovara.webp': metaSpaceCard({ rarity: 'rare', valueScore: 30, infoKeyStem: 'metamarket_info_item_meta_space_jovara' }),
    'Luminex.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 82, infoKeyStem: 'metamarket_info_item_meta_space_luminex' }),
    'LunaCore.webp': metaSpaceCard({ rarity: 'common', valueScore: 20, infoKeyStem: 'metamarket_info_item_meta_space_lunacore' }),
    'MagnetarX.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 93, infoKeyStem: 'metamarket_info_item_meta_space_magnetarx' }),
    'Molthera.webp': metaSpaceCard({ rarity: 'epic', valueScore: 61, infoKeyStem: 'metamarket_info_item_meta_space_molthera' }),
    'NebulaX.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 81, infoKeyStem: 'metamarket_info_item_meta_space_nebulax' }),
    'Novyra.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 79, infoKeyStem: 'metamarket_info_item_meta_space_novyra' }),
    'Oblivara.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 84, infoKeyStem: 'metamarket_info_item_meta_space_oblivara' }),
    'Oceara.webp': metaSpaceCard({ rarity: 'epic', valueScore: 59, infoKeyStem: 'metamarket_info_item_meta_space_oceara' }),
    'Pyronyx.webp': metaSpaceCard({ rarity: 'epic', valueScore: 56, infoKeyStem: 'metamarket_info_item_meta_space_pyronyx' }),
    'Pyrragon.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 90, infoKeyStem: 'metamarket_info_item_meta_space_pyrragon' }),
    'Pyrrion.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 71, infoKeyStem: 'metamarket_info_item_meta_space_pyrrion' }),
    'Satyros.webp': metaSpaceCard({ rarity: 'rare', valueScore: 45, infoKeyStem: 'metamarket_info_item_meta_space_satyros' }),
    'SingularityX.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 100, infoKeyStem: 'metamarket_info_item_meta_space_singularityx' }),
    'Solaris.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 83.5, infoKeyStem: 'metamarket_info_item_meta_space_solaris' }),
    'Solaryx.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 88.8, infoKeyStem: 'metamarket_info_item_meta_space_solaryx' }),
    'SupernovaX.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 95.5, infoKeyStem: 'metamarket_info_item_meta_space_supernovax' }),
    'TerraPrime.webp': metaSpaceCard({ rarity: 'rare', valueScore: 40, infoKeyStem: 'metamarket_info_item_meta_space_terraprime' }),
    'Therionis.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 86.5, infoKeyStem: 'metamarket_info_item_meta_space_therionis' }),
    'VoidSphereX.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 99.5, infoKeyStem: 'metamarket_info_item_meta_space_voidspherex' }),
    'Volcaris.webp': metaSpaceCard({ rarity: 'legendary', valueScore: 76.5, infoKeyStem: 'metamarket_info_item_meta_space_volcaris' }),
    'Voltanys.webp': metaSpaceCard({ rarity: 'mythic', valueScore: 90.5, infoKeyStem: 'metamarket_info_item_meta_space_voltanys' }),
    'Xylarion.webp': metaSpaceCard({ rarity: 'quantum', valueScore: 97.5, infoKeyStem: 'metamarket_info_item_meta_space_xylarion' }),
  },
  real_estate: {
    'AbyssalForge.webp': realEstateCard({ rarity: 'legendary', valueScore: 89, infoKeyStem: 'metamarket_info_item_real_estate_abyssalforge' }),
    'Aerionis.webp': realEstateCard({ rarity: 'epic', valueScore: 72, infoKeyStem: 'metamarket_info_item_real_estate_aerionis' }),
    'Alquira.webp': realEstateCard({ rarity: 'legendary', valueScore: 88, infoKeyStem: 'metamarket_info_item_real_estate_alquira' }),
    'Aqualis.webp': realEstateCard({ rarity: 'legendary', valueScore: 88.5, infoKeyStem: 'metamarket_info_item_real_estate_aqualis' }),
    'Aquanex.webp': realEstateCard({ rarity: 'epic', valueScore: 71, infoKeyStem: 'metamarket_info_item_real_estate_aquanex' }),
    'Aquaryn.webp': realEstateCard({ rarity: 'legendary', valueScore: 87.5, infoKeyStem: 'metamarket_info_item_real_estate_aquaryn' }),
    'Arboris.webp': realEstateCard({ rarity: 'legendary', valueScore: 87, infoKeyStem: 'metamarket_info_item_real_estate_arboris' }),
    'AsteroidResort.webp': realEstateCard({ rarity: 'mythic', valueScore: 91.5, infoKeyStem: 'metamarket_info_item_real_estate_asteroidresort' }),
    'Aurivon.webp': realEstateCard({ rarity: 'epic', valueScore: 70, infoKeyStem: 'metamarket_info_item_real_estate_aurivon' }),
    'AxisDawn.webp': realEstateCard({ rarity: 'epic', valueScore: 69, infoKeyStem: 'metamarket_info_item_real_estate_axisdawn' }),
    'BioSpire.webp': realEstateCard({ rarity: 'epic', valueScore: 68, infoKeyStem: 'metamarket_info_item_real_estate_biospire' }),
    'Brassora.webp': realEstateCard({ rarity: 'legendary', valueScore: 86, infoKeyStem: 'metamarket_info_item_real_estate_brassora' }),
    'Celestara.webp': realEstateCard({ rarity: 'legendary', valueScore: 85, infoKeyStem: 'metamarket_info_item_real_estate_celestara' }),
    'ChronaSpire.webp': realEstateCard({ rarity: 'legendary', valueScore: 84, infoKeyStem: 'metamarket_info_item_real_estate_chronaspire' }),
    'ChronosHall.webp': realEstateCard({ rarity: 'mythic', valueScore: 94.5, infoKeyStem: 'metamarket_info_item_real_estate_chronoshall' }),
    'Cosmyra.webp': realEstateCard({ rarity: 'legendary', valueScore: 83, infoKeyStem: 'metamarket_info_item_real_estate_cosmyra' }),
    'Crownora.webp': realEstateCard({ rarity: 'legendary', valueScore: 82, infoKeyStem: 'metamarket_info_item_real_estate_crownora' }),
    'CrystalCasino.webp': realEstateCard({ rarity: 'mythic', valueScore: 96, infoKeyStem: 'metamarket_info_item_real_estate_crystalcasino' }),
    'CrystalRanch.webp': realEstateCard({ rarity: 'mythic', valueScore: 91, infoKeyStem: 'metamarket_info_item_real_estate_crystalranch' }),
    'Crythara.webp': realEstateCard({ rarity: 'epic', valueScore: 67, infoKeyStem: 'metamarket_info_item_real_estate_crythara' }),
    'Cryvona.webp': realEstateCard({ rarity: 'epic', valueScore: 66, infoKeyStem: 'metamarket_info_item_real_estate_cryvona' }),
    'Domyra.webp': realEstateCard({ rarity: 'rare', valueScore: 48, infoKeyStem: 'metamarket_info_item_real_estate_domyra' }),
    'EchoVault.webp': realEstateCard({ rarity: 'legendary', valueScore: 81, infoKeyStem: 'metamarket_info_item_real_estate_echovault' }),
    'Ecosyra.webp': realEstateCard({ rarity: 'epic', valueScore: 65, infoKeyStem: 'metamarket_info_item_real_estate_ecosyra' }),
    'Elyndor.webp': realEstateCard({ rarity: 'epic', valueScore: 64, infoKeyStem: 'metamarket_info_item_real_estate_elyndor' }),
    'Elyndra.webp': realEstateCard({ rarity: 'rare', valueScore: 47, infoKeyStem: 'metamarket_info_item_real_estate_elyndra' }),
    'Elyzoria.webp': realEstateCard({ rarity: 'legendary', valueScore: 80, infoKeyStem: 'metamarket_info_item_real_estate_elyzoria' }),
    'Fluxora.webp': realEstateCard({ rarity: 'rare', valueScore: 46, infoKeyStem: 'metamarket_info_item_real_estate_fluxora' }),
    'Fortyra.webp': realEstateCard({ rarity: 'rare', valueScore: 45, infoKeyStem: 'metamarket_info_item_real_estate_fortyra' }),
    'FractalHaven.webp': realEstateCard({ rarity: 'mythic', valueScore: 92, infoKeyStem: 'metamarket_info_item_real_estate_fractalhaven' }),
    'FrozenPort.webp': realEstateCard({ rarity: 'legendary', valueScore: 79, infoKeyStem: 'metamarket_info_item_real_estate_frozenport' }),
    'Fumora.webp': realEstateCard({ rarity: 'epic', valueScore: 63, infoKeyStem: 'metamarket_info_item_real_estate_fumora' }),
    'GalacticMall.webp': realEstateCard({ rarity: 'mythic', valueScore: 96.5, infoKeyStem: 'metamarket_info_item_real_estate_galacticmall' }),
    'GalacticReal.webp': realEstateCard({ rarity: 'quantum', valueScore: 99, infoKeyStem: 'metamarket_info_item_real_estate_galacticreal' }),
    'Gearion.webp': realEstateCard({ rarity: 'legendary', valueScore: 78, infoKeyStem: 'metamarket_info_item_real_estate_gearion' }),
    'Halcyra.webp': realEstateCard({ rarity: 'epic', valueScore: 62, infoKeyStem: 'metamarket_info_item_real_estate_halcyra' }),
    'Hydryon.webp': realEstateCard({ rarity: 'legendary', valueScore: 77.5, infoKeyStem: 'metamarket_info_item_real_estate_hydryon' }),
    'Inferis.webp': realEstateCard({ rarity: 'legendary', valueScore: 77, infoKeyStem: 'metamarket_info_item_real_estate_inferis' }),
    'Isyrel.webp': realEstateCard({ rarity: 'legendary', valueScore: 76.5, infoKeyStem: 'metamarket_info_item_real_estate_isyrel' }),
    'JungleEstate.webp': realEstateCard({ rarity: 'mythic', valueScore: 90.5, infoKeyStem: 'metamarket_info_item_real_estate_jungleestate' }),
    'Koralyth.webp': realEstateCard({ rarity: 'legendary', valueScore: 76, infoKeyStem: 'metamarket_info_item_real_estate_koralyth' }),
    'Lumivara.webp': realEstateCard({ rarity: 'rare', valueScore: 44, infoKeyStem: 'metamarket_info_item_real_estate_lumivara' }),
    'Lunaris.webp': realEstateCard({ rarity: 'epic', valueScore: 61, infoKeyStem: 'metamarket_info_item_real_estate_lunaris' }),
    'LuxoraCore.webp': realEstateCard({ rarity: 'quantum', valueScore: 97, infoKeyStem: 'metamarket_info_item_real_estate_luxoracore' }),
    'Marivon.webp': realEstateCard({ rarity: 'epic', valueScore: 60, infoKeyStem: 'metamarket_info_item_real_estate_marivon' }),
    'Marsyn.webp': realEstateCard({ rarity: 'rare', valueScore: 43, infoKeyStem: 'metamarket_info_item_real_estate_marsyn' }),
    'Miralis.webp': realEstateCard({ rarity: 'epic', valueScore: 59, infoKeyStem: 'metamarket_info_item_real_estate_miralis' }),
    'Mirathis.webp': realEstateCard({ rarity: 'rare', valueScore: 42, infoKeyStem: 'metamarket_info_item_real_estate_mirathis' }),
    'Mistora.webp': realEstateCard({ rarity: 'epic', valueScore: 58, infoKeyStem: 'metamarket_info_item_real_estate_mistora' }),
    'Mycovar.webp': realEstateCard({ rarity: 'rare', valueScore: 41, infoKeyStem: 'metamarket_info_item_real_estate_mycovar' }),
    'NebulaHotel.webp': realEstateCard({ rarity: 'mythic', valueScore: 95.5, infoKeyStem: 'metamarket_info_item_real_estate_nebulahotel' }),
    'NebularFoundry.webp': realEstateCard({ rarity: 'mythic', valueScore: 95, infoKeyStem: 'metamarket_info_item_real_estate_nebularfoundry' }),
    'Neonix.webp': realEstateCard({ rarity: 'rare', valueScore: 40, infoKeyStem: 'metamarket_info_item_real_estate_neonix' }),
    'Nerithis.webp': realEstateCard({ rarity: 'epic', valueScore: 57, infoKeyStem: 'metamarket_info_item_real_estate_nerithis' }),
    'Nestara.webp': realEstateCard({ rarity: 'epic', valueScore: 56, infoKeyStem: 'metamarket_info_item_real_estate_nestara' }),
    'Neythra.webp': realEstateCard({ rarity: 'rare', valueScore: 39, infoKeyStem: 'metamarket_info_item_real_estate_neythra' }),
    'Noctyra.webp': realEstateCard({ rarity: 'rare', valueScore: 38, infoKeyStem: 'metamarket_info_item_real_estate_noctyra' }),
    'OriginTower.webp': realEstateCard({ rarity: 'quantum', valueScore: 98, infoKeyStem: 'metamarket_info_item_real_estate_origintower' }),
    'Oxivra.webp': realEstateCard({ rarity: 'epic', valueScore: 55, infoKeyStem: 'metamarket_info_item_real_estate_oxivra' }),
    'Ozyrel.webp': realEstateCard({ rarity: 'legendary', valueScore: 75.5, infoKeyStem: 'metamarket_info_item_real_estate_ozyrel' }),
    'Phorion.webp': realEstateCard({ rarity: 'rare', valueScore: 37, infoKeyStem: 'metamarket_info_item_real_estate_phorion' }),
    'QuantumBank.webp': realEstateCard({ rarity: 'quantum', valueScore: 100, infoKeyStem: 'metamarket_info_item_real_estate_quantumbank' }),
    'Quantyra.webp': realEstateCard({ rarity: 'rare', valueScore: 36, infoKeyStem: 'metamarket_info_item_real_estate_quantyra' }),
    'Redora.webp': realEstateCard({ rarity: 'rare', valueScore: 35, infoKeyStem: 'metamarket_info_item_real_estate_redora' }),
    'RustcoreDistrict.webp': realEstateCard({ rarity: 'rare', valueScore: 34, infoKeyStem: 'metamarket_info_item_real_estate_rustcoredistrict' }),
    'Selunaris.webp': realEstateCard({ rarity: 'legendary', valueScore: 75.2, infoKeyStem: 'metamarket_info_item_real_estate_selunaris' }),
    'Skythrone.webp': realEstateCard({ rarity: 'mythic', valueScore: 94, infoKeyStem: 'metamarket_info_item_real_estate_skythrone' }),
    'Skyvora.webp': realEstateCard({ rarity: 'rare', valueScore: 33, infoKeyStem: 'metamarket_info_item_real_estate_skyvora' }),
    'SolarMirage.webp': realEstateCard({ rarity: 'mythic', valueScore: 90, infoKeyStem: 'metamarket_info_item_real_estate_solarmirage' }),
    'SolarVeil.webp': realEstateCard({ rarity: 'rare', valueScore: 32, infoKeyStem: 'metamarket_info_item_real_estate_solarveil' }),
    'Stellora.webp': realEstateCard({ rarity: 'rare', valueScore: 31, infoKeyStem: 'metamarket_info_item_real_estate_stellora' }),
    'Sweetara.webp': realEstateCard({ rarity: 'epic', valueScore: 54, infoKeyStem: 'metamarket_info_item_real_estate_sweetara' }),
    'Sylvara.webp': realEstateCard({ rarity: 'rare', valueScore: 30, infoKeyStem: 'metamarket_info_item_real_estate_sylvara' }),
    'TechnoSpace.webp': realEstateCard({ rarity: 'mythic', valueScore: 93.5, infoKeyStem: 'metamarket_info_item_real_estate_technospace' }),
    'Thalora.webp': realEstateCard({ rarity: 'epic', valueScore: 52, infoKeyStem: 'metamarket_info_item_real_estate_thalora' }),
    'Thryvon.webp': realEstateCard({ rarity: 'rare', valueScore: 29, infoKeyStem: 'metamarket_info_item_real_estate_thryvon' }),
    'uxyra.webp': realEstateCard({ rarity: 'common', valueScore: 28, infoKeyStem: 'metamarket_info_item_real_estate_uxyra' }),
    'Velora.webp': realEstateCard({ rarity: 'common', valueScore: 27, infoKeyStem: 'metamarket_info_item_real_estate_velora' }),
    'VerdantSpire.webp': realEstateCard({ rarity: 'mythic', valueScore: 93, infoKeyStem: 'metamarket_info_item_real_estate_verdantspire' }),
    'VoidPort.webp': realEstateCard({ rarity: 'mythic', valueScore: 92.5, infoKeyStem: 'metamarket_info_item_real_estate_voidport' }),
    'Xelythar.webp': realEstateCard({ rarity: 'common', valueScore: 26, infoKeyStem: 'metamarket_info_item_real_estate_xelythar' }),
    'Zenora.webp': realEstateCard({ rarity: 'common', valueScore: 23, infoKeyStem: 'metamarket_info_item_real_estate_zenora' }),
    'Zerathis.webp': realEstateCard({ rarity: 'epic', valueScore: 50, infoKeyStem: 'metamarket_info_item_real_estate_zerathis' }),
    'Zeylara.webp': realEstateCard({ rarity: 'common', valueScore: 20, infoKeyStem: 'metamarket_info_item_real_estate_zeylara' }),
    'Zeythra.webp': realEstateCard({ rarity: 'legendary', valueScore: 75, infoKeyStem: 'metamarket_info_item_real_estate_zeythra' }),
  },
  meta_keys: {
    'Quantum.webp': { rarity: 'quantum', supply: 1, priceQcoin: 250000000, infoKeyStem: 'metamarket_info_item_meta_keys_quantum' },
    'On.webp': { rarity: 'mythic', supply: 1000, priceQcoin: 50000, infoKeyStem: 'metamarket_info_item_meta_keys_on' },
    'Si.webp': { rarity: 'legendary', supply: 2000, priceQcoin: 25000, infoKeyStem: 'metamarket_info_item_meta_keys_si' },
    'Vi.webp': { rarity: 'epic', supply: 3000, priceQcoin: 10000, infoKeyStem: 'metamarket_info_item_meta_keys_vi' },
  },
  miscellaneous: {
    'Neocap.webp': miscellaneousCard({ rarity: 'common', valueScore: 38.6, infoKeyStem: 'metamarket_info_item_miscellaneous_neocap' }),
    'Hexaura.webp': miscellaneousCard({ rarity: 'common', valueScore: 39.2, infoKeyStem: 'metamarket_info_item_miscellaneous_hexaura' }),
    'Cubryon.webp': miscellaneousCard({ rarity: 'common', valueScore: 39.9, infoKeyStem: 'metamarket_info_item_miscellaneous_cubryon' }),
    'Aurajack.webp': miscellaneousCard({ rarity: 'common', valueScore: 40.7, infoKeyStem: 'metamarket_info_item_miscellaneous_aurajack' }),
    'Gemnyx.webp': miscellaneousCard({ rarity: 'quantum', valueScore: 95.4, infoKeyStem: 'metamarket_info_item_miscellaneous_gemnyx' }),
    'Obscyra.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 86.4, infoKeyStem: 'metamarket_info_item_miscellaneous_obscyra' }),
    'Luminara.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 94.6, infoKeyStem: 'metamarket_info_item_miscellaneous_luminara' }),
    'Liquidra.webp': miscellaneousCard({ rarity: 'rare', valueScore: 47.9, infoKeyStem: 'metamarket_info_item_miscellaneous_liquidra' }),
    'Cosmaview.webp': miscellaneousCard({ rarity: 'rare', valueScore: 57.3, infoKeyStem: 'metamarket_info_item_miscellaneous_cosmaview' }),
    'Stellara.webp': miscellaneousCard({ rarity: 'rare', valueScore: 56.1, infoKeyStem: 'metamarket_info_item_miscellaneous_stellara' }),
    'Digitron.webp': miscellaneousCard({ rarity: 'legendary', valueScore: 79.9, infoKeyStem: 'metamarket_info_item_miscellaneous_digitron' }),
    'Flamoryx.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 85.6, infoKeyStem: 'metamarket_info_item_miscellaneous_flamoryx' }),
    'Floranyx.webp': miscellaneousCard({ rarity: 'rare', valueScore: 55.2, infoKeyStem: 'metamarket_info_item_miscellaneous_floranyx' }),
    'Aurabloom.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 89.4, infoKeyStem: 'metamarket_info_item_miscellaneous_aurabloom' }),
    'Bouquora.webp': miscellaneousCard({ rarity: 'rare', valueScore: 54.1, infoKeyStem: 'metamarket_info_item_miscellaneous_bouquora' }),
    'Chronoryx.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 93.7, infoKeyStem: 'metamarket_info_item_miscellaneous_chronoryx' }),
    'Quantara.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 92.8, infoKeyStem: 'metamarket_info_item_miscellaneous_quantara' }),
    'Metachups.webp': miscellaneousCard({ rarity: 'common', valueScore: 29.7, infoKeyStem: 'metamarket_info_item_miscellaneous_metachups' }),
    'Mystara.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 83.7, infoKeyStem: 'metamarket_info_item_miscellaneous_mystara' }),
    'Globarys.webp': miscellaneousCard({ rarity: 'epic', valueScore: 65.2, infoKeyStem: 'metamarket_info_item_miscellaneous_globarys' }),
    'Cyberion.webp': miscellaneousCard({ rarity: 'rare', valueScore: 46.3, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberion' }),
    'Lumicandle.webp': miscellaneousCard({ rarity: 'rare', valueScore: 52.6, infoKeyStem: 'metamarket_info_item_miscellaneous_lumicandle' }),
    'Ammoryx.webp': miscellaneousCard({ rarity: 'legendary', valueScore: 81.4, infoKeyStem: 'metamarket_info_item_miscellaneous_ammoryx' }),
    'Frogaris.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 88.2, infoKeyStem: 'metamarket_info_item_miscellaneous_frogaris' }),
    'Fuelara.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 82.5, infoKeyStem: 'metamarket_info_item_miscellaneous_fuelara' }),
    'Crystalis.webp': miscellaneousCard({ rarity: 'quantum', valueScore: 98.6, infoKeyStem: 'metamarket_info_item_miscellaneous_crystalis' }),
    'Q‑7X9.webp': miscellaneousCard({ rarity: 'rare', valueScore: 60.7, infoKeyStem: 'metamarket_info_item_miscellaneous_q_7x9' }),
    'Cyberbear.webp': miscellaneousCard({ rarity: 'common', valueScore: 43.4, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberbear' }),
    'Cyberbunny.webp': miscellaneousCard({ rarity: 'common', valueScore: 42.8, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberbunny' }),
    'Biotree.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 87.1, infoKeyStem: 'metamarket_info_item_miscellaneous_biotree' }),
    'Quantcup.webp': miscellaneousCard({ rarity: 'common', valueScore: 44.1, infoKeyStem: 'metamarket_info_item_miscellaneous_quantcup' }),
    'Darkheart.webp': miscellaneousCard({ rarity: 'quantum', valueScore: 100, infoKeyStem: 'metamarket_info_item_miscellaneous_darkheart' }),
    'Neosneak.webp': miscellaneousCard({ rarity: 'rare', valueScore: 51.7, infoKeyStem: 'metamarket_info_item_miscellaneous_neosneak' }),
    'DictaphoneX.webp': miscellaneousCard({ rarity: 'rare', valueScore: 59.4, infoKeyStem: 'metamarket_info_item_miscellaneous_dictaphonex' }),
    'Rollerion.webp': miscellaneousCard({ rarity: 'rare', valueScore: 49.6, infoKeyStem: 'metamarket_info_item_miscellaneous_rollerion' }),
    'Tennix.webp': miscellaneousCard({ rarity: 'rare', valueScore: 48.8, infoKeyStem: 'metamarket_info_item_miscellaneous_tennix' }),
    'Rosanyx.webp': miscellaneousCard({ rarity: 'rare', valueScore: 53.4, infoKeyStem: 'metamarket_info_item_miscellaneous_rosanyx' }),
    'Vinylon.webp': miscellaneousCard({ rarity: 'common', valueScore: 44.9, infoKeyStem: 'metamarket_info_item_miscellaneous_vinylon' }),
    'Rugbyon.webp': miscellaneousCard({ rarity: 'rare', valueScore: 47.1, infoKeyStem: 'metamarket_info_item_miscellaneous_rugbyon' }),
    'RunestoneX.webp': miscellaneousCard({ rarity: 'quantum', valueScore: 97.8, infoKeyStem: 'metamarket_info_item_miscellaneous_runestonex' }),
    'Statum.webp': miscellaneousCard({ rarity: 'rare', valueScore: 62.2, infoKeyStem: 'metamarket_info_item_miscellaneous_statum' }),
    'Cyberbite.webp': miscellaneousCard({ rarity: 'rare', valueScore: 50.8, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberbite' }),
    'Cyberflag.webp': miscellaneousCard({ rarity: 'common', valueScore: 41.4, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberflag' }),
    'Steamra.webp': miscellaneousCard({ rarity: 'legendary', valueScore: 76.1, infoKeyStem: 'metamarket_info_item_miscellaneous_steamra' }),
    'Spectra.webp': miscellaneousCard({ rarity: 'rare', valueScore: 61.5, infoKeyStem: 'metamarket_info_item_miscellaneous_spectra' }),
    'Wrenchon.webp': miscellaneousCard({ rarity: 'common', valueScore: 20, infoKeyStem: 'metamarket_info_item_miscellaneous_wrenchon' }),
    'Blasteron.webp': miscellaneousCard({ rarity: 'legendary', valueScore: 78.4, infoKeyStem: 'metamarket_info_item_miscellaneous_blasteron' }),
    'Orbistaff.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 84.9, infoKeyStem: 'metamarket_info_item_miscellaneous_orbistaff' }),
    'Oxycandy.webp': miscellaneousCard({ rarity: 'common', valueScore: 28.6, infoKeyStem: 'metamarket_info_item_miscellaneous_oxycandy' }),
    'Nitrocandy.webp': miscellaneousCard({ rarity: 'common', valueScore: 27.1, infoKeyStem: 'metamarket_info_item_miscellaneous_nitrocandy' }),
    'Jestmask.webp': miscellaneousCard({ rarity: 'common', valueScore: 42.1, infoKeyStem: 'metamarket_info_item_miscellaneous_jestmask' }),
    'Cybercorn.webp': miscellaneousCard({ rarity: 'common', valueScore: 25.8, infoKeyStem: 'metamarket_info_item_miscellaneous_cybercorn' }),
    'Thermoview.webp': miscellaneousCard({ rarity: 'epic', valueScore: 68.9, infoKeyStem: 'metamarket_info_item_miscellaneous_thermoview' }),
    'Lumisphere.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 91.7, infoKeyStem: 'metamarket_info_item_miscellaneous_lumisphere' }),
    'Infernogem.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 90.5, infoKeyStem: 'metamarket_info_item_miscellaneous_infernogem' }),
    'Paracyber.webp': miscellaneousCard({ rarity: 'epic', valueScore: 66.4, infoKeyStem: 'metamarket_info_item_miscellaneous_paracyber' }),
    'Neonlight.webp': miscellaneousCard({ rarity: 'common', valueScore: 21.6, infoKeyStem: 'metamarket_info_item_miscellaneous_neonlight' }),
    'Cyberheart.webp': miscellaneousCard({ rarity: 'legendary', valueScore: 80.7, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberheart' }),
    'Cyberboots.webp': miscellaneousCard({ rarity: 'epic', valueScore: 73.6, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberboots' }),
    'Dumblox.webp': miscellaneousCard({ rarity: 'rare', valueScore: 45.1, infoKeyStem: 'metamarket_info_item_miscellaneous_dumblox' }),
    'Mycoryx.webp': miscellaneousCard({ rarity: 'common', valueScore: 30.8, infoKeyStem: 'metamarket_info_item_miscellaneous_mycoryx' }),
    'Antivirus.webp': miscellaneousCard({ rarity: 'mythic', valueScore: 82.9, infoKeyStem: 'metamarket_info_item_miscellaneous_antivirus' }),
    'Cyberknife.webp': miscellaneousCard({ rarity: 'epic', valueScore: 72.3, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberknife' }),
    'Cybercatapult.webp': miscellaneousCard({ rarity: 'epic', valueScore: 67.8, infoKeyStem: 'metamarket_info_item_miscellaneous_cybercatapult' }),
    'Hydrocaps.webp': miscellaneousCard({ rarity: 'common', valueScore: 22.9, infoKeyStem: 'metamarket_info_item_miscellaneous_hydrocaps' }),
    'Cyberbow.webp': miscellaneousCard({ rarity: 'legendary', valueScore: 77.2, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberbow' }),
    'Portalis.webp': miscellaneousCard({ rarity: 'quantum', valueScore: 96.8, infoKeyStem: 'metamarket_info_item_miscellaneous_portalis' }),
    'Shoptron.webp': miscellaneousCard({ rarity: 'common', valueScore: 24.3, infoKeyStem: 'metamarket_info_item_miscellaneous_shoptron' }),
    'Steamscope.webp': miscellaneousCard({ rarity: 'epic', valueScore: 69.7, infoKeyStem: 'metamarket_info_item_miscellaneous_steamscope' }),
    'Cyberpick.webp': miscellaneousCard({ rarity: 'epic', valueScore: 70.2, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberpick' }),
    'Cyberhelm.webp': miscellaneousCard({ rarity: 'legendary', valueScore: 75.3, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberhelm' }),
    'Cyberknees.webp': miscellaneousCard({ rarity: 'rare', valueScore: 45.7, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberknees' }),
    'Keyl7.webp': miscellaneousCard({ rarity: 'rare', valueScore: 58.1, infoKeyStem: 'metamarket_info_item_miscellaneous_keyl7' }),
    'Cyberphones.webp': miscellaneousCard({ rarity: 'epic', valueScore: 71.4, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberphones' }),
    'Cyberskates.webp': miscellaneousCard({ rarity: 'rare', valueScore: 50.4, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberskates' }),
    'Lionflint.webp': miscellaneousCard({ rarity: 'rare', valueScore: 63.6, infoKeyStem: 'metamarket_info_item_miscellaneous_lionflint' }),
    'Solarcompass.webp': miscellaneousCard({ rarity: 'rare', valueScore: 64.3, infoKeyStem: 'metamarket_info_item_miscellaneous_solarcompass' }),
    'Imperhat.webp': miscellaneousCard({ rarity: 'epic', valueScore: 74.2, infoKeyStem: 'metamarket_info_item_miscellaneous_imperhat' }),
    'Cyberlip.webp': miscellaneousCard({ rarity: 'common', valueScore: 37.3, infoKeyStem: 'metamarket_info_item_miscellaneous_cyberlip' }),
    'Steampen.webp': miscellaneousCard({ rarity: 'rare', valueScore: 49.1, infoKeyStem: 'metamarket_info_item_miscellaneous_steampen' }),
    'Stoneaxe.webp': miscellaneousCard({ rarity: 'rare', valueScore: 60.1, infoKeyStem: 'metamarket_info_item_miscellaneous_stoneaxe' }),
  },
  technique: {
    'Abyssor.webp': techniqueCard({ rarity: 'common', valueScore: 29, infoKeyStem: 'metamarket_info_item_technique_abyssor' }),
    'Aerolyth.webp': techniqueCard({ rarity: 'mythic', valueScore: 96.4, infoKeyStem: 'metamarket_info_item_technique_aerolyth' }),
    'Aeroryn.webp': techniqueCard({ rarity: 'common', valueScore: 27.4, infoKeyStem: 'metamarket_info_item_technique_aeroryn' }),
    'Aetheron.webp': techniqueCard({ rarity: 'common', valueScore: 28.1, infoKeyStem: 'metamarket_info_item_technique_aetheron' }),
    'Aquaris.webp': techniqueCard({ rarity: 'epic', valueScore: 51.4, infoKeyStem: 'metamarket_info_item_technique_aquaris' }),
    'Aracnix.webp': techniqueCard({ rarity: 'common', valueScore: 26.6, infoKeyStem: 'metamarket_info_item_technique_aracnix' }),
    'Armoryx.webp': techniqueCard({ rarity: 'epic', valueScore: 53.6, infoKeyStem: 'metamarket_info_item_technique_armoryx' }),
    'Asteryn.webp': techniqueCard({ rarity: 'legendary', valueScore: 87.8, infoKeyStem: 'metamarket_info_item_technique_asteryn' }),
    'AsterynPrime.webp': techniqueCard({ rarity: 'legendary', valueScore: 89.2, infoKeyStem: 'metamarket_info_item_technique_asterynprime' }),
    'Autoryn.webp': techniqueCard({ rarity: 'common', valueScore: 24.9, infoKeyStem: 'metamarket_info_item_technique_autoryn' }),
    'Bathoryn.webp': techniqueCard({ rarity: 'common', valueScore: 25.7, infoKeyStem: 'metamarket_info_item_technique_bathoryn' }),
    'Battalon.webp': techniqueCard({ rarity: 'epic', valueScore: 56.9, infoKeyStem: 'metamarket_info_item_technique_battalon' }),
    'Bitrider.webp': techniqueCard({ rarity: 'common', valueScore: 21.7, infoKeyStem: 'metamarket_info_item_technique_bitrider' }),
    'Blastoryn.webp': techniqueCard({ rarity: 'epic', valueScore: 67.9, infoKeyStem: 'metamarket_info_item_technique_blastoryn' }),
    'Blastoryx.webp': techniqueCard({ rarity: 'legendary', valueScore: 71.2, infoKeyStem: 'metamarket_info_item_technique_blastoryx' }),
    'Chargon.webp': techniqueCard({ rarity: 'common', valueScore: 21.1, infoKeyStem: 'metamarket_info_item_technique_chargon' }),
    'Classoryn.webp': techniqueCard({ rarity: 'common', valueScore: 20.2, infoKeyStem: 'metamarket_info_item_technique_classoryn' }),
    'Corelyth.webp': techniqueCard({ rarity: 'legendary', valueScore: 86.4, infoKeyStem: 'metamarket_info_item_technique_corelyth' }),
    'Cryonix.webp': techniqueCard({ rarity: 'rare', valueScore: 46.8, infoKeyStem: 'metamarket_info_item_technique_cryonix' }),
    'Cryptoryx.webp': techniqueCard({ rarity: 'rare', valueScore: 30.3, infoKeyStem: 'metamarket_info_item_technique_cryptoryx' }),
    'Crysalon.webp': techniqueCard({ rarity: 'epic', valueScore: 69, infoKeyStem: 'metamarket_info_item_technique_crysalon' }),
    'Crysalor.webp': techniqueCard({ rarity: 'legendary', valueScore: 85.1, infoKeyStem: 'metamarket_info_item_technique_crysalor' }),
    'Cryseron.webp': techniqueCard({ rarity: 'common', valueScore: 20, infoKeyStem: 'metamarket_info_item_technique_cryseron' }),
    'Crystarion.webp': techniqueCard({ rarity: 'quantum', valueScore: 100, infoKeyStem: 'metamarket_info_item_technique_crystarion' }),
    'Cyberion.webp': techniqueCard({ rarity: 'epic', valueScore: 68.8, infoKeyStem: 'metamarket_info_item_technique_cyberion' }),
    'Cyberis.webp': techniqueCard({ rarity: 'rare', valueScore: 44.6, infoKeyStem: 'metamarket_info_item_technique_cyberis' }),
    'Cyberon.webp': techniqueCard({ rarity: 'epic', valueScore: 55.8, infoKeyStem: 'metamarket_info_item_technique_cyberon' }),
    'Cybervanix.webp': techniqueCard({ rarity: 'rare', valueScore: 43.5, infoKeyStem: 'metamarket_info_item_technique_cybervanix' }),
    'Cylorix.webp': techniqueCard({ rarity: 'rare', valueScore: 42.4, infoKeyStem: 'metamarket_info_item_technique_cylorix' }),
    'Darkon.webp': techniqueCard({ rarity: 'epic', valueScore: 64.6, infoKeyStem: 'metamarket_info_item_technique_darkon' }),
    'Dravion.webp': techniqueCard({ rarity: 'legendary', valueScore: 89.8, infoKeyStem: 'metamarket_info_item_technique_dravion' }),
    'Dravon.webp': techniqueCard({ rarity: 'rare', valueScore: 34.7, infoKeyStem: 'metamarket_info_item_technique_dravon' }),
    'Drillgon.webp': techniqueCard({ rarity: 'epic', valueScore: 61.3, infoKeyStem: 'metamarket_info_item_technique_drillgon' }),
    'Dualon.webp': techniqueCard({ rarity: 'rare', valueScore: 39.1, infoKeyStem: 'metamarket_info_item_technique_dualon' }),
    'Dumpyra.webp': techniqueCard({ rarity: 'epic', valueScore: 59.1, infoKeyStem: 'metamarket_info_item_technique_dumpyra' }),
    'Excaryon.webp': techniqueCard({ rarity: 'epic', valueScore: 60.2, infoKeyStem: 'metamarket_info_item_technique_excaryon' }),
    'Flygon.webp': techniqueCard({ rarity: 'common', valueScore: 18.5, infoKeyStem: 'metamarket_info_item_technique_flygon' }),
    'Galvion.webp': techniqueCard({ rarity: 'mythic', valueScore: 94.1, infoKeyStem: 'metamarket_info_item_technique_galvion' }),
    'GirodunePro.webp': techniqueCard({ rarity: 'common', valueScore: 17.8, infoKeyStem: 'metamarket_info_item_technique_girodunepro' }),
    'Glidron.webp': techniqueCard({ rarity: 'common', valueScore: 5, infoKeyStem: 'metamarket_info_item_technique_glidron' }),
    'Graviton.webp': techniqueCard({ rarity: 'rare', valueScore: 33.6, infoKeyStem: 'metamarket_info_item_technique_graviton' }),
    'Gravyon.webp': techniqueCard({ rarity: 'rare', valueScore: 40.2, infoKeyStem: 'metamarket_info_item_technique_gravyon' }),
    'Hauloryx.webp': techniqueCard({ rarity: 'common', valueScore: 19.4, infoKeyStem: 'metamarket_info_item_technique_hauloryx' }),
    'Hoverion.webp': techniqueCard({ rarity: 'common', valueScore: 17.1, infoKeyStem: 'metamarket_info_item_technique_hoverion' }),
    'Hoveron.webp': techniqueCard({ rarity: 'common', valueScore: 16.4, infoKeyStem: 'metamarket_info_item_technique_hoveron' }),
    'Hydrion.webp': techniqueCard({ rarity: 'legendary', valueScore: 81, infoKeyStem: 'metamarket_info_item_technique_hydrion' }),
    'Hydrionix.webp': techniqueCard({ rarity: 'common', valueScore: 15.7, infoKeyStem: 'metamarket_info_item_technique_hydrionix' }),
    'Ignaryx.webp': techniqueCard({ rarity: 'legendary', valueScore: 86.1, infoKeyStem: 'metamarket_info_item_technique_ignaryx' }),
    'Irydon.webp': techniqueCard({ rarity: 'legendary', valueScore: 83.7, infoKeyStem: 'metamarket_info_item_technique_irydon' }),
    'Jetron.webp': techniqueCard({ rarity: 'rare', valueScore: 49, infoKeyStem: 'metamarket_info_item_technique_jetron' }),
    'JetronFly.webp': techniqueCard({ rarity: 'legendary', valueScore: 82.3, infoKeyStem: 'metamarket_info_item_technique_jetronfly' }),
    'Lavorix.webp': techniqueCard({ rarity: 'mythic', valueScore: 93, infoKeyStem: 'metamarket_info_item_technique_lavorix' }),
    'Luminar.webp': techniqueCard({ rarity: 'rare', valueScore: 41.3, infoKeyStem: 'metamarket_info_item_technique_luminar' }),
    'Lunaris.webp': techniqueCard({ rarity: 'epic', valueScore: 62.4, infoKeyStem: 'metamarket_info_item_technique_lunaris' }),
    'Magnoryx.webp': techniqueCard({ rarity: 'legendary', valueScore: 79.4, infoKeyStem: 'metamarket_info_item_technique_magnoryx' }),
    'Marsyra.webp': techniqueCard({ rarity: 'common', valueScore: 27.2, infoKeyStem: 'metamarket_info_item_technique_marsyra' }),
    'Mecharis.webp': techniqueCard({ rarity: 'rare', valueScore: 31.4, infoKeyStem: 'metamarket_info_item_technique_mecharis' }),
    'Metronyx.webp': techniqueCard({ rarity: 'common', valueScore: 14.9, infoKeyStem: 'metamarket_info_item_technique_metronyx' }),
    'Motoryn.webp': techniqueCard({ rarity: 'common', valueScore: 14.2, infoKeyStem: 'metamarket_info_item_technique_motoryn' }),
    'Nautyra.webp': techniqueCard({ rarity: 'epic', valueScore: 63.5, infoKeyStem: 'metamarket_info_item_technique_nautyra' }),
    'NautyraSix.webp': techniqueCard({ rarity: 'epic', valueScore: 62.7, infoKeyStem: 'metamarket_info_item_technique_nautyrasix' }),
    'Nebryon.webp': techniqueCard({ rarity: 'legendary', valueScore: 82.9, infoKeyStem: 'metamarket_info_item_technique_nebryon' }),
    'NebryonPS.webp': techniqueCard({ rarity: 'mythic', valueScore: 95.2, infoKeyStem: 'metamarket_info_item_technique_nebryonps' }),
    'Portyra.webp': techniqueCard({ rarity: 'quantum', valueScore: 97.4, infoKeyStem: 'metamarket_info_item_technique_portyra' }),
    'Quantor.webp': techniqueCard({ rarity: 'epic', valueScore: 65.7, infoKeyStem: 'metamarket_info_item_technique_quantor' }),
    'Railtron.webp': techniqueCard({ rarity: 'common', valueScore: 26.3, infoKeyStem: 'metamarket_info_item_technique_railtron' }),
    'Ravager.webp': techniqueCard({ rarity: 'rare', valueScore: 35.8, infoKeyStem: 'metamarket_info_item_technique_ravager' }),
    'Redmaris.webp': techniqueCard({ rarity: 'legendary', valueScore: 77.2, infoKeyStem: 'metamarket_info_item_technique_redmaris' }),
    'Rovaryn.webp': techniqueCard({ rarity: 'common', valueScore: 25.5, infoKeyStem: 'metamarket_info_item_technique_rovaryn' }),
    'Sailtron.webp': techniqueCard({ rarity: 'epic', valueScore: 52.5, infoKeyStem: 'metamarket_info_item_technique_sailtron' }),
    'Skyron.webp': techniqueCard({ rarity: 'common', valueScore: 13.5, infoKeyStem: 'metamarket_info_item_technique_skyron' }),
    'Solaryx.webp': techniqueCard({ rarity: 'legendary', valueScore: 73.6, infoKeyStem: 'metamarket_info_item_technique_solaryx' }),
    'Starion.webp': techniqueCard({ rarity: 'rare', valueScore: 47.9, infoKeyStem: 'metamarket_info_item_technique_starion' }),
    'Stealthoryn.webp': techniqueCard({ rarity: 'rare', valueScore: 48.7, infoKeyStem: 'metamarket_info_item_technique_stealthoryn' }),
    'Steamaryn.webp': techniqueCard({ rarity: 'common', valueScore: 12.8, infoKeyStem: 'metamarket_info_item_technique_steamaryn' }),
    'Steamdrill.webp': techniqueCard({ rarity: 'legendary', valueScore: 70.4, infoKeyStem: 'metamarket_info_item_technique_steamdrill' }),
    'Steamor.webp': techniqueCard({ rarity: 'common', valueScore: 12.1, infoKeyStem: 'metamarket_info_item_technique_steamor' }),
    'Stormaryx.webp': techniqueCard({ rarity: 'legendary', valueScore: 78.1, infoKeyStem: 'metamarket_info_item_technique_stormaryx' }),
    'Subryon.webp': techniqueCard({ rarity: 'epic', valueScore: 50.3, infoKeyStem: 'metamarket_info_item_technique_subryon' }),
    'Tankryon.webp': techniqueCard({ rarity: 'legendary', valueScore: 80.3, infoKeyStem: 'metamarket_info_item_technique_tankryon' }),
    'Terradyne.webp': techniqueCard({ rarity: 'epic', valueScore: 58, infoKeyStem: 'metamarket_info_item_technique_terradyne' }),
    'Terramax.webp': techniqueCard({ rarity: 'mythic', valueScore: 92, infoKeyStem: 'metamarket_info_item_technique_terramax' }),
    'Terronix.webp': techniqueCard({ rarity: 'common', valueScore: 11.4, infoKeyStem: 'metamarket_info_item_technique_terronix' }),
    'Titanor.webp': techniqueCard({ rarity: 'quantum', valueScore: 98.8, infoKeyStem: 'metamarket_info_item_technique_titanor' }),
    'Tourion.webp': techniqueCard({ rarity: 'common', valueScore: 10.7, infoKeyStem: 'metamarket_info_item_technique_tourion' }),
    'Tugoryn.webp': techniqueCard({ rarity: 'common', valueScore: 9.9, infoKeyStem: 'metamarket_info_item_technique_tugoryn' }),
    'Velaryx.webp': techniqueCard({ rarity: 'rare', valueScore: 38, infoKeyStem: 'metamarket_info_item_technique_velaryx' }),
    'Veyronix.webp': techniqueCard({ rarity: 'rare', valueScore: 36.9, infoKeyStem: 'metamarket_info_item_technique_veyronix' }),
    'Voltrax.webp': techniqueCard({ rarity: 'mythic', valueScore: 91, infoKeyStem: 'metamarket_info_item_technique_voltrax' }),
    'Wartrax.webp': techniqueCard({ rarity: 'legendary', valueScore: 72.5, infoKeyStem: 'metamarket_info_item_technique_wartrax' }),
    'Xerion.webp': techniqueCard({ rarity: 'rare', valueScore: 45.7, infoKeyStem: 'metamarket_info_item_technique_xerion' }),
    'Xythera.webp': techniqueCard({ rarity: 'common', valueScore: 8.6, infoKeyStem: 'metamarket_info_item_technique_xythera' }),
  },
}

function toMicro(value) {
  return Math.max(0, Math.round(Number(value || 0) * METAMARKET_MICRO_PER_QCOIN))
}

function fileSlug(fileName) {
  return String(fileName || '')
    .replace(/\.[^.]+$/u, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function fallbackItemTitle(slug) {
  return String(slug || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.toUpperCase())
    .join(' ')
}

function normalizeItemBoolean(value, fallback = true) {
  return value == null ? fallback : !!value
}

function itemInfoStem(collectionId, slug, settings = {}) {
  return String(settings.infoKeyStem || `metamarket_info_item_${collectionId}_${slug}`)
}

function collectionInfoStem(collection) {
  return String(collection.infoKeyStem || `metamarket_info_collection_${collection.id}`)
}

// Media contract:
// - collection.files may contain PNG, WebP, AVIF, JPEG, GIF, or future browser-supported image names.
// - ITEM_CARD_SETTINGS can override imagePath/thumbPath/assetVersion per item without changing UI/API code.
// - itemId must stay stable when only the media file or extension changes.
function normalizeFileEntry(fileEntry) {
  if (typeof fileEntry === 'string') return { fileName: fileEntry }
  if (!fileEntry || typeof fileEntry !== 'object') return { fileName: '' }
  return {
    ...fileEntry,
    fileName: String(fileEntry.fileName || fileEntry.name || fileEntry.asset || '').trim(),
  }
}

function normalizePublicImagePath(value) {
  const assetPath = String(value || '').trim()
  if (!assetPath) return ''
  if (/^(https?:)?\/\//i.test(assetPath) || /^(data:image\/|blob:)/i.test(assetPath)) return assetPath
  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`
}

function defaultImagePath(collection, fileName) {
  return `/metamarket/${collection.folder}/${fileName}`
}

function defaultAssetVersion(fileName) {
  const extension = String(fileName || '').match(/\.([^.]+)$/u)?.[1]?.toLowerCase() || 'asset'
  return `test-${extension}-v1`
}

function buildItem(collection, fileEntry, index) {
  const entry = normalizeFileEntry(fileEntry)
  const fileName = entry.fileName
  const slug = fileSlug(fileName)
  const settings = {
    ...(ITEM_CARD_SETTINGS[collection.id]?.[fileName] || {}),
    ...(entry.settings || {}),
    ...entry,
  }
  const rarity = settings.rarity || RARITY_SEQUENCE[index % RARITY_SEQUENCE.length] || 'common'
  const priceQcoin = Number(settings.priceQcoin ?? collection.defaultPriceQcoin ?? 1)
  const supply = Math.max(1, Number(settings.supply ?? collection.defaultSupply ?? 1))
  const infoStem = itemInfoStem(collection.id, slug, settings)
  const imagePath = normalizePublicImagePath(settings.imagePath || defaultImagePath(collection, fileName))
  const thumbPath = normalizePublicImagePath(settings.thumbPath || '')

  return {
    // itemId: стабильный id предмета для ownership, token history, owners index и прошлых транзакций.
    itemId: settings.itemId || `mm_${collection.id}_${slug}`,
    // collectionId: связь предмета с коллекцией.
    collectionId: collection.id,
    // slug: technical slug, сейчас получен из тестового filename.
    slug,
    // fileName: имя PNG внутри public/metamarket/<folder>.
    fileName,
    // imagePath: публичный путь до текущего PNG-ассета.
    imagePath,
    // thumbPath: будущий отдельный thumbnail, если он появится.
    thumbPath: thumbPath || null,
    // titleKey: i18n-ключ названия конкретного предмета без дублирования названия коллекции.
    titleKey: settings.titleKey || `metamarket_item_${collection.id}_${slug}`,
    // infoKeyStem: базовый stem будущих текстов инфо-поповера конкретной карточки.
    infoKeyStem: infoStem,
    // infoTitleKey: ключ заголовка подробного инфо-поповера.
    infoTitleKey: settings.infoTitleKey || `${infoStem}_title`,
    // infoDescriptionKey: ключ основного описания подробного инфо-поповера.
    infoDescriptionKey: settings.infoDescriptionKey || `${infoStem}_description`,
    // infoDetailsKey: ключ технического/редакционного блока подробностей.
    infoDetailsKey: settings.infoDetailsKey || `${infoStem}_details`,
    // infoButtonAriaKey: будущий item-specific aria-key для кнопки (i), если понадобится.
    infoButtonAriaKey: settings.infoButtonAriaKey || `${infoStem}_button_aria`,
    // fallbackTitle: технический fallback названия предмета.
    fallbackTitle: fallbackItemTitle(slug),
    // supply: итоговый тираж предмета после rarity-коррекции.
    supply,
    // priceQcoin: базовая цена до динамического scarcity-множителя.
    priceQcoin,
    // priceMicro: базовая цена в integer microQCoin.
    priceMicro: toMicro(priceQcoin),
    // sellRateBps: процент выплаты от текущей динамической цены при продаже обратно.
    sellRateBps: Number(settings.sellRateBps ?? collection.defaultSellRateBps),
    // scarcityPriceBps: коэффициент роста/снижения цены при изменении marketAvailable.
    scarcityPriceBps: Number(settings.scarcityPriceBps ?? collection.defaultScarcityPriceBps ?? METAMARKET_DEFAULT_SCARCITY_PRICE_BPS),
    // rarity: визуальная редкость предмета, не заменяет явно заданную цену.
    rarity,
    // active: скрывает предмет без удаления исторического itemId.
    active: normalizeItemBoolean(settings.active, true),
    // buyEnabled: разрешает покупку из хранилища маркета.
    buyEnabled: normalizeItemBoolean(settings.buyEnabled, true),
    // sellEnabled: разрешает продажу обратно в хранилище.
    sellEnabled: normalizeItemBoolean(settings.sellEnabled, true),
    // giftEnabled: разрешает дарение между пользователями.
    giftEnabled: normalizeItemBoolean(settings.giftEnabled, true),
    // sort: порядок предмета внутри коллекции.
    sort: Number(settings.sort ?? (index + 1)),
    // assetVersion: версия текущего PNG-ассета.
    assetVersion: String(settings.assetVersion || defaultAssetVersion(fileName)),
    // catalogVersion: версия каталога, в которой описан предмет.
    catalogVersion: METAMARKET_CATALOG_VERSION,
    // createdAtVersion: версия каталога, где itemId появился впервые.
    createdAtVersion: METAMARKET_CATALOG_VERSION,
  }
}

export const METAMARKET_COLLECTIONS = COLLECTION_DEFINITIONS
  .map(({ files, ...collection }) => {
    const infoStem = collectionInfoStem(collection)
    return {
      ...collection,
      infoKeyStem: infoStem,
      infoTitleKey: collection.infoTitleKey || `${infoStem}_title`,
      infoDescriptionKey: collection.infoDescriptionKey || `${infoStem}_description`,
      infoDetailsKey: collection.infoDetailsKey || `${infoStem}_details`,
      infoButtonAriaKey: collection.infoButtonAriaKey || `${infoStem}_button_aria`,
      itemCount: files.length,
    }
  })
  .sort((a, b) => a.sort - b.sort)

export const METAMARKET_ITEMS = COLLECTION_DEFINITIONS
  .flatMap((collection) => collection.files.map((fileName, index) => buildItem(collection, fileName, index)))
  .sort((a, b) => {
    if (a.collectionId === b.collectionId) return a.sort - b.sort
    const ca = METAMARKET_COLLECTIONS.find((collection) => collection.id === a.collectionId)?.sort || 0
    const cb = METAMARKET_COLLECTIONS.find((collection) => collection.id === b.collectionId)?.sort || 0
    return ca - cb
  })

export const METAMARKET_COLLECTIONS_BY_ID = Object.freeze(Object.fromEntries(METAMARKET_COLLECTIONS.map((collection) => [collection.id, collection])))
export const METAMARKET_ITEMS_BY_ID = Object.freeze(Object.fromEntries(METAMARKET_ITEMS.map((item) => [item.itemId, item])))

export function listMetaMarketCollections({ activeOnly = true } = {}) {
  return METAMARKET_COLLECTIONS.filter((collection) => !activeOnly || collection.active)
}

export function listMetaMarketItems(collectionId, { activeOnly = true } = {}) {
  const cid = String(collectionId || '').trim()
  return METAMARKET_ITEMS.filter((item) => item.collectionId === cid && (!activeOnly || item.active))
}

export function getMetaMarketCollection(collectionId) {
  return METAMARKET_COLLECTIONS_BY_ID[String(collectionId || '').trim()] || null
}

export function getMetaMarketItem(itemId) {
  return METAMARKET_ITEMS_BY_ID[String(itemId || '').trim()] || null
}

export function getMetaMarketItemCollection(itemId) {
  const item = getMetaMarketItem(itemId)
  return item ? getMetaMarketCollection(item.collectionId) : null
}

export function getMetaMarketCatalogSummary() {
  return {
    catalogVersion: METAMARKET_CATALOG_VERSION,
    collectionCount: METAMARKET_COLLECTIONS.length,
    itemCount: METAMARKET_ITEMS.length,
  }
}

// Asset replacement workflow:
// 1. Replace files in public/metamarket/<collectionFolder>.
// 2. Update this manifest entry: fileName/imagePath/assetVersion for an existing item, or add a new item.
// 3. Keep itemId stable when the same item receives new art, title, price, or rarity.
// 4. Use active:false to hide retired items after launch instead of deleting historical ids.
