import crypto from 'node:crypto'
import {QL7_SUPPORT_RELEASE_DOMAIN_ROOTS} from './domainOntology.js'

// Generated declarative microtopic inventory. The data is intentionally expanded for auditability.
const rows = [
  {
    "microtopicId": "platform:platform.overview",
    "domainId": "platform",
    "intentId": "platform.overview",
    "sourceNodeId": "knowledge.platform.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "930d2b981b927a5d724168718b98ff710b29c2f7db3d6f038625dba3942dea82"
  },
  {
    "microtopicId": "platform:platform.purpose",
    "domainId": "platform",
    "intentId": "platform.purpose",
    "sourceNodeId": "knowledge.platform.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "09cfa5467d7f08e7daefc54289df9b1e08ef0b92dd67e5a39542594c7dc24fbf"
  },
  {
    "microtopicId": "platform:platform.user_value",
    "domainId": "platform",
    "intentId": "platform.user_value",
    "sourceNodeId": "knowledge.platform.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "f6a9246521a5f42a2105c06bcde8b32a1ef2cc48b7c77be1fb0ac51dad8a7aed"
  },
  {
    "microtopicId": "platform:platform.open",
    "domainId": "platform",
    "intentId": "platform.open",
    "sourceNodeId": "knowledge.platform.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "d727d2c7279a3d39545f03490586ed127c63b8bd0bd29b9c060e22a226996f14"
  },
  {
    "microtopicId": "platform:platform.start",
    "domainId": "platform",
    "intentId": "platform.start",
    "sourceNodeId": "knowledge.platform.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "6ff0c78be519597321b00f373e41a944ad30c88a8d6aa297664b144ac6717e52"
  },
  {
    "microtopicId": "platform:platform.how_to",
    "domainId": "platform",
    "intentId": "platform.how_to",
    "sourceNodeId": "knowledge.platform.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "f1feabc4442d36c528e5436916d9f60705f7788dfd23ad42373dbe9d8fc8f02c"
  },
  {
    "microtopicId": "platform:platform.availability",
    "domainId": "platform",
    "intentId": "platform.availability",
    "sourceNodeId": "knowledge.platform.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "56dd72a282a85884378ec92abb733b99deec8ef3860d2a4f047fdcac25ff90b7"
  },
  {
    "microtopicId": "platform:platform.limitations",
    "domainId": "platform",
    "intentId": "platform.limitations",
    "sourceNodeId": "knowledge.platform.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "0e202766e89d53f95c60ccadee64a7de65a219739bc2d30551d279a34fdd390a"
  },
  {
    "microtopicId": "platform:platform.prerequisites",
    "domainId": "platform",
    "intentId": "platform.prerequisites",
    "sourceNodeId": "knowledge.platform.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "814b79ef488337c4a5e84c022cda61ffa19666c7f2b6a7d59f22754bd0ed3be8"
  },
  {
    "microtopicId": "platform:platform.safety",
    "domainId": "platform",
    "intentId": "platform.safety",
    "sourceNodeId": "knowledge.platform.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "e736428a08bcd6a97ad89def51196dd1f779999353b7ad90a07434814b0fbadc"
  },
  {
    "microtopicId": "platform:platform.privacy",
    "domainId": "platform",
    "intentId": "platform.privacy",
    "sourceNodeId": "knowledge.platform.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "8592b71b3de382ff5208f1ce020b0c76f949b9f13c1f86ce89ccf4ef61aebdc4"
  },
  {
    "microtopicId": "platform:platform.self_status",
    "domainId": "platform",
    "intentId": "platform.self_status",
    "sourceNodeId": "knowledge.platform.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "45e16553ec60c7e0720ee04ca1d24febf3dcf442a843e8ff6ca101c54a0f4557"
  },
  {
    "microtopicId": "platform:platform.incident",
    "domainId": "platform",
    "intentId": "platform.incident",
    "sourceNodeId": "knowledge.platform.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "598ff49d6b506fcd392629cf00ddbdff4ad1041f2836933bbb0bc3ee413553e5"
  },
  {
    "microtopicId": "platform:platform.purchase_cost",
    "domainId": "platform",
    "intentId": "platform.purchase_cost",
    "sourceNodeId": "knowledge.platform.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "42ce78de57d7cf414761dc93fbf4d166ebfd0d8a0623f8dd4ab4f0f5c9215914"
  },
  {
    "microtopicId": "platform:platform.earning_credit",
    "domainId": "platform",
    "intentId": "platform.earning_credit",
    "sourceNodeId": "knowledge.platform.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "c74d7de86380071b32c9f1cef9c92465fe0e706984f583349f05b458d42e6349"
  },
  {
    "microtopicId": "platform:platform.gift_transfer_sale",
    "domainId": "platform",
    "intentId": "platform.gift_transfer_sale",
    "sourceNodeId": "knowledge.platform.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "a708637f12ba56366152d8a263c8ff7cc5bb606c287a82a5fbf3ee159a396087"
  },
  {
    "microtopicId": "platform:platform.developers_mission",
    "domainId": "platform",
    "intentId": "platform.developers_mission",
    "sourceNodeId": "knowledge.platform.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "a6741ba29033afc0ff57007fb917af75bfa007efc900b1fd5f41ee5f23f3fb7e"
  },
  {
    "microtopicId": "platform:platform.roadmap",
    "domainId": "platform",
    "intentId": "platform.roadmap",
    "sourceNodeId": "knowledge.platform.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "dae7dab7bec66b8c17fd3542d601f9924834a372a7015d4d270a233234891107"
  },
  {
    "microtopicId": "platform:platform.action",
    "domainId": "platform",
    "intentId": "platform.action",
    "sourceNodeId": "knowledge.platform.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "181747a6dcbb0a78828e0dfcafb3492acf8d31466392c6fda8a745436a434c9b"
  },
  {
    "microtopicId": "platform:platform.capability",
    "domainId": "platform",
    "intentId": "platform.capability",
    "sourceNodeId": "knowledge.platform.capability.explains-product-relations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "e9ef5f5fb674493b605bf3fb6062ae5797bdad7b7540f7499ffd486dfe291cdf"
  },
  {
    "microtopicId": "platform:platform.source_evidence",
    "domainId": "platform",
    "intentId": "platform.source_evidence",
    "sourceNodeId": "knowledge.platform.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "8ebccd38f33aa3a28f53cd41a70fbbc43282b6fdddcd38a3795900b73bbebb54"
  },
  {
    "microtopicId": "platform:platform.realization",
    "domainId": "platform",
    "intentId": "platform.realization",
    "sourceNodeId": "knowledge.platform.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "6e7b32a046ad457852d4100dc0d187693393ff502d70e43ea64d1bf9856a81e1"
  },
  {
    "microtopicId": "homepage:homepage.overview",
    "domainId": "homepage",
    "intentId": "homepage.overview",
    "sourceNodeId": "knowledge.homepage.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "27295052d10996ef25aed39955764050741f33e0091aa8e279467cd8e5f80b13"
  },
  {
    "microtopicId": "homepage:homepage.purpose",
    "domainId": "homepage",
    "intentId": "homepage.purpose",
    "sourceNodeId": "knowledge.homepage.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "c67d352917d9a50dd8e98490ab4286796b6cf40f96a9e6faade77a30abd6c060"
  },
  {
    "microtopicId": "homepage:homepage.user_value",
    "domainId": "homepage",
    "intentId": "homepage.user_value",
    "sourceNodeId": "knowledge.homepage.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "3650906236c18e4281a3b03530864f58f749d4758cca14b4fb83cb37461e5312"
  },
  {
    "microtopicId": "homepage:homepage.open",
    "domainId": "homepage",
    "intentId": "homepage.open",
    "sourceNodeId": "knowledge.homepage.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "0a960e88f732ad15057925c4957765c4c0e02808638f388003288127ab8145a4"
  },
  {
    "microtopicId": "homepage:homepage.start",
    "domainId": "homepage",
    "intentId": "homepage.start",
    "sourceNodeId": "knowledge.homepage.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "ff6f736088a6a265414fc948c6520a1ad4c64abaedf4e1151c99ce5e8d331b91"
  },
  {
    "microtopicId": "homepage:homepage.how_to",
    "domainId": "homepage",
    "intentId": "homepage.how_to",
    "sourceNodeId": "knowledge.homepage.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "fdb9f151f1d344be5bc212dbfdbc11d736e370c5f68533ae6df884429a8de33d"
  },
  {
    "microtopicId": "homepage:homepage.availability",
    "domainId": "homepage",
    "intentId": "homepage.availability",
    "sourceNodeId": "knowledge.homepage.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "90647346e3a388daef2d7977b5d35fe7bf11980a13f9ccbca09962efb182fd32"
  },
  {
    "microtopicId": "homepage:homepage.limitations",
    "domainId": "homepage",
    "intentId": "homepage.limitations",
    "sourceNodeId": "knowledge.homepage.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "2bb3fb742f968dc8d2dd25e020d37efce35d567ea1a30ff37faaf6b6f8b99647"
  },
  {
    "microtopicId": "homepage:homepage.prerequisites",
    "domainId": "homepage",
    "intentId": "homepage.prerequisites",
    "sourceNodeId": "knowledge.homepage.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "87915bbddcb49ec558f27bfd9fab91c3030f46d2ef0249d7123a567eae451a59"
  },
  {
    "microtopicId": "homepage:homepage.safety",
    "domainId": "homepage",
    "intentId": "homepage.safety",
    "sourceNodeId": "knowledge.homepage.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "49391ebd808eb59e632a0c58907018fa15a07b200c3309a7ca0481677c1056a3"
  },
  {
    "microtopicId": "homepage:homepage.privacy",
    "domainId": "homepage",
    "intentId": "homepage.privacy",
    "sourceNodeId": "knowledge.homepage.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "57d634ed4aca179816679ea6ee3dd51b4137bf8889c098e366f08d0dc4a3a677"
  },
  {
    "microtopicId": "homepage:homepage.self_status",
    "domainId": "homepage",
    "intentId": "homepage.self_status",
    "sourceNodeId": "knowledge.homepage.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "ddf1783b34e10a579df39e83f6ca6937a114dc86a2d11e2ef4c41b2a309cf2cf"
  },
  {
    "microtopicId": "homepage:homepage.incident",
    "domainId": "homepage",
    "intentId": "homepage.incident",
    "sourceNodeId": "knowledge.homepage.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "876f7929995e2bf70277647013914f3bbe9d2bebd48afe922e0d65be44717a76"
  },
  {
    "microtopicId": "homepage:homepage.purchase_cost",
    "domainId": "homepage",
    "intentId": "homepage.purchase_cost",
    "sourceNodeId": "knowledge.homepage.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "0493082dc4455de6fbf921f0800ca2166d3c25d525ec457d92464690ef40f726"
  },
  {
    "microtopicId": "homepage:homepage.earning_credit",
    "domainId": "homepage",
    "intentId": "homepage.earning_credit",
    "sourceNodeId": "knowledge.homepage.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "fd3635d18d263ca371292bc431bcd7e96a9206740db8b38316cd968b506b0bdb"
  },
  {
    "microtopicId": "homepage:homepage.gift_transfer_sale",
    "domainId": "homepage",
    "intentId": "homepage.gift_transfer_sale",
    "sourceNodeId": "knowledge.homepage.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "9a127edc9866be604a85ff8473dabd9de1d5ebac6bca2ccb3d71081be9730050"
  },
  {
    "microtopicId": "homepage:homepage.developers_mission",
    "domainId": "homepage",
    "intentId": "homepage.developers_mission",
    "sourceNodeId": "knowledge.homepage.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "6984cfba8e37e02cdfee6aba333724fa9dc4eec32ef7d2b6e83cd38b7d5a4672"
  },
  {
    "microtopicId": "homepage:homepage.roadmap",
    "domainId": "homepage",
    "intentId": "homepage.roadmap",
    "sourceNodeId": "knowledge.homepage.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "267d6058883f68b450707de4fd61c61e69db7177827f71b501e7a7c29057d146"
  },
  {
    "microtopicId": "homepage:homepage.action",
    "domainId": "homepage",
    "intentId": "homepage.action",
    "sourceNodeId": "knowledge.homepage.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "62a0a86c74dc6ab7c1e10e711e7f9d50e33d5e3f78bacc7c21ff34b5def4aabd"
  },
  {
    "microtopicId": "homepage:homepage.capability",
    "domainId": "homepage",
    "intentId": "homepage.capability",
    "sourceNodeId": "knowledge.homepage.capability.market-data-is-observational",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "30c679857438b1bfbec62ae3d8066b05494dc6ee1a47e2ec7b7c460e0e33f63e"
  },
  {
    "microtopicId": "homepage:homepage.source_evidence",
    "domainId": "homepage",
    "intentId": "homepage.source_evidence",
    "sourceNodeId": "knowledge.homepage.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "e1289c5ad7f8bde48cbb46d215c9a9371fc65ecae7e5449b238264285721d456"
  },
  {
    "microtopicId": "homepage:homepage.realization",
    "domainId": "homepage",
    "intentId": "homepage.realization",
    "sourceNodeId": "knowledge.homepage.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "e0dabb7efca86f2a180c1c0ec0d7604c3e2baeb85a1a4f36a8918078bbfad91d"
  },
  {
    "microtopicId": "news:news.overview",
    "domainId": "news",
    "intentId": "news.overview",
    "sourceNodeId": "knowledge.news.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "89b67543d710a0657be1ce69f5eb198cb9ff246d3eee33a930b0bacf70c3fd7b"
  },
  {
    "microtopicId": "news:news.purpose",
    "domainId": "news",
    "intentId": "news.purpose",
    "sourceNodeId": "knowledge.news.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "07f1fec6fc3638de5a5ba0df146bfa699b17d4a750d0182a08ff77df874818c5"
  },
  {
    "microtopicId": "news:news.user_value",
    "domainId": "news",
    "intentId": "news.user_value",
    "sourceNodeId": "knowledge.news.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "eef83df096a448c15a54b7ac612f1097f2856f4507148da47a10de8c7d92b75a"
  },
  {
    "microtopicId": "news:news.open",
    "domainId": "news",
    "intentId": "news.open",
    "sourceNodeId": "knowledge.news.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "6ba5a469d7b58381d5265e946ae4018dcc31eeb1325e357a8a1ff4aedfb43bca"
  },
  {
    "microtopicId": "news:news.start",
    "domainId": "news",
    "intentId": "news.start",
    "sourceNodeId": "knowledge.news.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "cf929da41c6e0a5c0cd713d59f8f9466272494ce0101a3479d2b781170804058"
  },
  {
    "microtopicId": "news:news.how_to",
    "domainId": "news",
    "intentId": "news.how_to",
    "sourceNodeId": "knowledge.news.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "192b0b421836ac769d9c0f3521b620f26ad83ea65114ad5d34f31f92747fe710"
  },
  {
    "microtopicId": "news:news.availability",
    "domainId": "news",
    "intentId": "news.availability",
    "sourceNodeId": "knowledge.news.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "4258b2a8fc43a10896853708c73cd41fa9a21b05827a30c3553d4ee88ecb3d66"
  },
  {
    "microtopicId": "news:news.limitations",
    "domainId": "news",
    "intentId": "news.limitations",
    "sourceNodeId": "knowledge.news.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "da7f6ecf9c0bac1be9d6738fc4a6ccff079ea9bf17e2c293ea88b0d8122c5edd"
  },
  {
    "microtopicId": "news:news.prerequisites",
    "domainId": "news",
    "intentId": "news.prerequisites",
    "sourceNodeId": "knowledge.news.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "49b971f188b9bfe0c6d3b3a2ff932bd049522db64833223089d3f8af8b582bb3"
  },
  {
    "microtopicId": "news:news.safety",
    "domainId": "news",
    "intentId": "news.safety",
    "sourceNodeId": "knowledge.news.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "6e59ee11d774bca6ecc3bd53a9cd84bfa565814999deefa1278bdf20163ffb69"
  },
  {
    "microtopicId": "news:news.privacy",
    "domainId": "news",
    "intentId": "news.privacy",
    "sourceNodeId": "knowledge.news.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "4df44f1512ca0cd0c405c249413fc77444f40d99eb1daa2282f85f8896af881e"
  },
  {
    "microtopicId": "news:news.self_status",
    "domainId": "news",
    "intentId": "news.self_status",
    "sourceNodeId": "knowledge.news.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "258ef445a554d8a6bb95825bb0ec1575fd319b415b4183569bba0a8c90ec1811"
  },
  {
    "microtopicId": "news:news.incident",
    "domainId": "news",
    "intentId": "news.incident",
    "sourceNodeId": "knowledge.news.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "ea9d4d4041485ef70854c2d6f537b024005fd0da1b19bcc67c0b0defb7a75f72"
  },
  {
    "microtopicId": "news:news.purchase_cost",
    "domainId": "news",
    "intentId": "news.purchase_cost",
    "sourceNodeId": "knowledge.news.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "78a7125961d2a8a3d8c8f791c6207cf80591a669696988b69205ebbba1f7a956"
  },
  {
    "microtopicId": "news:news.earning_credit",
    "domainId": "news",
    "intentId": "news.earning_credit",
    "sourceNodeId": "knowledge.news.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "59fce28dc6ac86faa007bebe3262aa249bab4110b2f264c68a557375d16baf24"
  },
  {
    "microtopicId": "news:news.gift_transfer_sale",
    "domainId": "news",
    "intentId": "news.gift_transfer_sale",
    "sourceNodeId": "knowledge.news.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "0a234ffd82d8fc93708632832d6cb35dedf58258fbb59bd509b331a7c6164cb9"
  },
  {
    "microtopicId": "news:news.developers_mission",
    "domainId": "news",
    "intentId": "news.developers_mission",
    "sourceNodeId": "knowledge.news.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "293e4362e6294b50c150aa6fd389b84056a782de222c257bf855a574c4b284ee"
  },
  {
    "microtopicId": "news:news.roadmap",
    "domainId": "news",
    "intentId": "news.roadmap",
    "sourceNodeId": "knowledge.news.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "502d6a1d0d0a49b1bf20bae28cff7bbb3f8795629103896e7d0fa87e0b7973a8"
  },
  {
    "microtopicId": "news:news.action",
    "domainId": "news",
    "intentId": "news.action",
    "sourceNodeId": "knowledge.news.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "edef978215ab6bab45e1ea7bae550ba14a4e44c2792cfbabdd55c9f640eea1d6"
  },
  {
    "microtopicId": "news:news.capability",
    "domainId": "news",
    "intentId": "news.capability",
    "sourceNodeId": "knowledge.news.capability.keeps-source-timestamp",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "6fa971c2d541539cb1a2badd3b56e023a5a1e0e6f9028bb66495021e3a712443"
  },
  {
    "microtopicId": "news:news.source_evidence",
    "domainId": "news",
    "intentId": "news.source_evidence",
    "sourceNodeId": "knowledge.news.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "2b64883381714582e820dd04f77db3fd45fb648025a82c887042ff691573126e"
  },
  {
    "microtopicId": "news:news.realization",
    "domainId": "news",
    "intentId": "news.realization",
    "sourceNodeId": "knowledge.news.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
    ],
    "availability": "available",
    "contentHash": "7d97a36b042ed00427ba2fc5bd01e0a73aca846470e8ccb3ff07e313a68c472c"
  },
  {
    "microtopicId": "exchange:exchange.overview",
    "domainId": "exchange",
    "intentId": "exchange.overview",
    "sourceNodeId": "knowledge.exchange.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "732d6fddccf9046f720d8b084e659175ebf705b1e624343c5bd52d830d7e460d"
  },
  {
    "microtopicId": "exchange:exchange.purpose",
    "domainId": "exchange",
    "intentId": "exchange.purpose",
    "sourceNodeId": "knowledge.exchange.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "39077169bc667dff284703fd1d9fc868d05a87289dbafbaed75ec2fc8ac93a6e"
  },
  {
    "microtopicId": "exchange:exchange.user_value",
    "domainId": "exchange",
    "intentId": "exchange.user_value",
    "sourceNodeId": "knowledge.exchange.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "869948728aa581ff46edbfdd63031ff0d78c50a691cc11d5b1e3c892c754cd91"
  },
  {
    "microtopicId": "exchange:exchange.open",
    "domainId": "exchange",
    "intentId": "exchange.open",
    "sourceNodeId": "knowledge.exchange.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "1d496a4272afcd0878b8ebe8bf07132af8eff29b468cda93bfe7fdd978c048b5"
  },
  {
    "microtopicId": "exchange:exchange.start",
    "domainId": "exchange",
    "intentId": "exchange.start",
    "sourceNodeId": "knowledge.exchange.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "c9701787ca36f21681721727c45d8410a246a9d0721b4d709a7a08d7cf8d9522"
  },
  {
    "microtopicId": "exchange:exchange.how_to",
    "domainId": "exchange",
    "intentId": "exchange.how_to",
    "sourceNodeId": "knowledge.exchange.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "c495268393b502ba4b51a71548c8aa22d070e3edaeeb6b9baeed855c77451d9f"
  },
  {
    "microtopicId": "exchange:exchange.availability",
    "domainId": "exchange",
    "intentId": "exchange.availability",
    "sourceNodeId": "knowledge.exchange.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "abe157b5c5d92ac32574a5721a709cf1ef7774b8ce53fecd5d740836672a7adc"
  },
  {
    "microtopicId": "exchange:exchange.limitations",
    "domainId": "exchange",
    "intentId": "exchange.limitations",
    "sourceNodeId": "knowledge.exchange.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "859dc423dfd754e3f589d458233cb836b3822adda51f977195a43fc23275af43"
  },
  {
    "microtopicId": "exchange:exchange.prerequisites",
    "domainId": "exchange",
    "intentId": "exchange.prerequisites",
    "sourceNodeId": "knowledge.exchange.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "e485b17421834f0e78724e075bb43ac54fc98829d32c242bf9ba262ed81f9133"
  },
  {
    "microtopicId": "exchange:exchange.safety",
    "domainId": "exchange",
    "intentId": "exchange.safety",
    "sourceNodeId": "knowledge.exchange.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "a78ba7872d635eedc253a27e3519373ec7caf6e503b8419ddabd3c111ac21df9"
  },
  {
    "microtopicId": "exchange:exchange.privacy",
    "domainId": "exchange",
    "intentId": "exchange.privacy",
    "sourceNodeId": "knowledge.exchange.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "e966b181bb3231a22975b6bd2d7ab163141e7dbaa5cfe96efd94387af8758c2e"
  },
  {
    "microtopicId": "exchange:exchange.self_status",
    "domainId": "exchange",
    "intentId": "exchange.self_status",
    "sourceNodeId": "knowledge.exchange.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "4c51da94792fae1793e5bf0f9666cdbeaf02f5961a82d0fe95590c219130700e"
  },
  {
    "microtopicId": "exchange:exchange.incident",
    "domainId": "exchange",
    "intentId": "exchange.incident",
    "sourceNodeId": "knowledge.exchange.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "b77cb077f8a24f58279d0ee3ef4fa2b07b918c96cbcdcc179d420eeebd68b4d0"
  },
  {
    "microtopicId": "exchange:exchange.purchase_cost",
    "domainId": "exchange",
    "intentId": "exchange.purchase_cost",
    "sourceNodeId": "knowledge.exchange.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "32598e957c854d1eb16bb0bd676a80039a10e5b05a03354210b785bef6c5cc25"
  },
  {
    "microtopicId": "exchange:exchange.earning_credit",
    "domainId": "exchange",
    "intentId": "exchange.earning_credit",
    "sourceNodeId": "knowledge.exchange.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "154412a1c6e45169231219df203ea8ef23c8aa84c59525e4b916961a8d2e5da4"
  },
  {
    "microtopicId": "exchange:exchange.gift_transfer_sale",
    "domainId": "exchange",
    "intentId": "exchange.gift_transfer_sale",
    "sourceNodeId": "knowledge.exchange.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "52d55de52fad1f3e195a594992f6a13e7d3955f626283a8e733017ed43c6680e"
  },
  {
    "microtopicId": "exchange:exchange.developers_mission",
    "domainId": "exchange",
    "intentId": "exchange.developers_mission",
    "sourceNodeId": "knowledge.exchange.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "0ac915bd5d5b81998f75d99e28a600406d263b7de2e246305ad9c2fcb215385e"
  },
  {
    "microtopicId": "exchange:exchange.roadmap",
    "domainId": "exchange",
    "intentId": "exchange.roadmap",
    "sourceNodeId": "knowledge.exchange.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "39a6140e7ae305e7559668bd20b8858a1d0ac86c7bae22f677398cd34bfd3dfe"
  },
  {
    "microtopicId": "exchange:exchange.action",
    "domainId": "exchange",
    "intentId": "exchange.action",
    "sourceNodeId": "knowledge.exchange.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "0895d50dbceda8ad8ce5ad6c1e35f9bcbd24ee4a028aa943c92e1fbfc8e3a5bc"
  },
  {
    "microtopicId": "exchange:exchange.capability",
    "domainId": "exchange",
    "intentId": "exchange.capability",
    "sourceNodeId": "knowledge.exchange.capability.reads-runtime-availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "69cd31c77f14ace2d38b4eb65f026cc32acf6b4bc4ef50e33c042e629aea3820"
  },
  {
    "microtopicId": "exchange:exchange.source_evidence",
    "domainId": "exchange",
    "intentId": "exchange.source_evidence",
    "sourceNodeId": "knowledge.exchange.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "ab11c358cb8d2d8e0ab53a3931cf3afdb6d18dd971e9612991fb12131c3edf79"
  },
  {
    "microtopicId": "exchange:exchange.realization",
    "domainId": "exchange",
    "intentId": "exchange.realization",
    "sourceNodeId": "knowledge.exchange.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
    ],
    "availability": "partially_available",
    "contentHash": "90a83cbeaf4c46396d20c30c185184f8ffebf9a9edc8c33ce331ad8a8421f694"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.overview",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.overview",
    "sourceNodeId": "knowledge.exchange_ai.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "f57cac138eb0c7b9df9fe8af6da4be59b2242c4f691608d4325e80ce0085181b"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.purpose",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.purpose",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "3e49bbfcf12f8fedbd95c83821f218fa34959b04231fd2e0bea8ccf4884be8e5"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.user_value",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.user_value",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "da364a09525e927f20c5d62adf6cecf61bb56814e93ef02d7e9d017b301f34a9"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.open",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.open",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "d53fda867e0c4f9934136ef088308271b1d4523e2be780352eccd5289367c520"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.start",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.start",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "663a2a302d9200da72b46b6f630512532faaaffcdc1b9619d0ff16dd02cfb6d3"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.how_to",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.how_to",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "637c93511490791c663a23ea01682eae2c4c842c881bc63274f8ab02662ea8f4"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.availability",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.availability",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "e291b7ee66091bf9d53d94c40db220f2540dec2cfd097331b46a3583e8f17528"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.limitations",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.limitations",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "a4fa23e595ac67869e9990cd0a885c796aa2b76687f15f2048f2ba6d09254233"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.prerequisites",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.prerequisites",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "09118d06e44f4610a6f675e5843914879cfc1439f699af40ce0fcefbd6d9f508"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.safety",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.safety",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "f9aa5b6e863edd17614fdd84a453b8def45e85c6fdc478001ecf7a44c949975f"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.privacy",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.privacy",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "979dec743fe5479657fa6443c2472922558d5dcaf3d7f1dd82b939c625b059db"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.self_status",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.self_status",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "9710f9fe7af5abfa31b4ffebed843dd13fd8a4428346eeffb3f2f08f2191b385"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.incident",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.incident",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "007994e23bb8a4f0fbc4917dba3af85b10e83f1b1ca88e83a9a43b4fa68a8902"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.purchase_cost",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.purchase_cost",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "c9774127d327f466edb37c5c2377920733e46f12be312a56b817c43f8fad917c"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.earning_credit",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.earning_credit",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "742d004340e2dd17648507b1ec4f7d42b2b268eceb6c201ca912f6a7434a815c"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.gift_transfer_sale",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.gift_transfer_sale",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "404ff3b58c3c0166b7c98298d2449ed30e532c6be1b71a8828f8ba352fa59ecd"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.developers_mission",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.developers_mission",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "a5b6b256736f44f882d54b2a314dcea640ea5c24f76848a4d1040ca080d92dd3"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.roadmap",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.roadmap",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "a40cb5ebfa0549d0a28a74d45f9b64ccdfc6ef338adefaf8a4ffdff9f976f375"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.action",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.action",
    "sourceNodeId": "knowledge.exchange_ai.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "255b1de65bb104b8dc04ddd32414e7c83fdbe57234eb08fc093a7e2e1e1908f2"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.capability",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.capability",
    "sourceNodeId": "knowledge.exchange_ai.capability.checks-entitlement-and-quota",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "377ca99c96886c57eb8e188e920e068b847a217700c3752d875654b77aefeffe"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.source_evidence",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.source_evidence",
    "sourceNodeId": "knowledge.exchange_ai.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "c68afe00f73f35dc30444509bd677575326220d8153af539adb5791e9c7fb89c"
  },
  {
    "microtopicId": "exchange_ai:exchange_ai.realization",
    "domainId": "exchange_ai",
    "intentId": "exchange_ai.realization",
    "sourceNodeId": "knowledge.exchange_ai.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
    ],
    "availability": "partially_available",
    "contentHash": "8df0d47a7060af0c943df1d347101f4357017779c5a524c22d5e361192f49ba7"
  },
  {
    "microtopicId": "battlecoin:battlecoin.overview",
    "domainId": "battlecoin",
    "intentId": "battlecoin.overview",
    "sourceNodeId": "knowledge.battlecoin.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "8e34cc11debf15ba79f435cada4b7d6846098f27b4cde665a240219df8d5f3cc"
  },
  {
    "microtopicId": "battlecoin:battlecoin.purpose",
    "domainId": "battlecoin",
    "intentId": "battlecoin.purpose",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "665ced82c09e7c3e82e29656adf47bf626d1838e7f3c5b312d367550e9a6475d"
  },
  {
    "microtopicId": "battlecoin:battlecoin.user_value",
    "domainId": "battlecoin",
    "intentId": "battlecoin.user_value",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "72b4df731663927780d7b635cea354b91a86dc1a61f08cd2b1817fbe611f81a1"
  },
  {
    "microtopicId": "battlecoin:battlecoin.open",
    "domainId": "battlecoin",
    "intentId": "battlecoin.open",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "c8bec8d6a6590055396874c05ec591ece5396b9736229e9aae753be1b9fbc709"
  },
  {
    "microtopicId": "battlecoin:battlecoin.start",
    "domainId": "battlecoin",
    "intentId": "battlecoin.start",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "0b34c5c1b358bf2ab67d71f400776076526d1a591c74d3fea6de5baa23f7cb21"
  },
  {
    "microtopicId": "battlecoin:battlecoin.how_to",
    "domainId": "battlecoin",
    "intentId": "battlecoin.how_to",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "99e1cdc9aa65c4ee3019c18c84f97c74e6aca1fb55eb6c62f7bdbbd9522d97f0"
  },
  {
    "microtopicId": "battlecoin:battlecoin.availability",
    "domainId": "battlecoin",
    "intentId": "battlecoin.availability",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "d5c55b779feddda8f61e747fbac48a92d37cc13a2a755ce7d8a4c347eaa2b211"
  },
  {
    "microtopicId": "battlecoin:battlecoin.limitations",
    "domainId": "battlecoin",
    "intentId": "battlecoin.limitations",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "d1169e3b73b9725ccb90b7b3b9d8a484efe8d3ec04926ce7a510b170770c051b"
  },
  {
    "microtopicId": "battlecoin:battlecoin.prerequisites",
    "domainId": "battlecoin",
    "intentId": "battlecoin.prerequisites",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "bac20c12c7ab0b8475383ac20a4a1689f095498f35ee3f6f8f7cdccebe32e704"
  },
  {
    "microtopicId": "battlecoin:battlecoin.safety",
    "domainId": "battlecoin",
    "intentId": "battlecoin.safety",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "280b6b02dde62dc5e8d31c33e85330a83a6af91e3c3b995e347d26efc34abbdc"
  },
  {
    "microtopicId": "battlecoin:battlecoin.privacy",
    "domainId": "battlecoin",
    "intentId": "battlecoin.privacy",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "2a90a6e38f59a03ad6a1e85a442feea54d45860113477349c2d643b3c8a38c57"
  },
  {
    "microtopicId": "battlecoin:battlecoin.self_status",
    "domainId": "battlecoin",
    "intentId": "battlecoin.self_status",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "ec45dc1074289b6b51ebd2f8383866578267ae423eb0effe4bb69ada16aa1a12"
  },
  {
    "microtopicId": "battlecoin:battlecoin.incident",
    "domainId": "battlecoin",
    "intentId": "battlecoin.incident",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "7f7a98e62564593eeaedf42d177b04a41ca42dac18e2b973dd552f8ab1faa09c"
  },
  {
    "microtopicId": "battlecoin:battlecoin.purchase_cost",
    "domainId": "battlecoin",
    "intentId": "battlecoin.purchase_cost",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "06fc7ad9ff4e2a68f5c4cd81bf9aeaae24398393a4a0a51b1891e8a3489d7ae8"
  },
  {
    "microtopicId": "battlecoin:battlecoin.earning_credit",
    "domainId": "battlecoin",
    "intentId": "battlecoin.earning_credit",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "34c6d48adced700c795d8b08dc9d464d22edb41fc939ace09db900d8c16ccb64"
  },
  {
    "microtopicId": "battlecoin:battlecoin.gift_transfer_sale",
    "domainId": "battlecoin",
    "intentId": "battlecoin.gift_transfer_sale",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "102bd87ab4f9169a81d0c9f02497458d764995dfac06c8f5a871cdd1afb7eac2"
  },
  {
    "microtopicId": "battlecoin:battlecoin.developers_mission",
    "domainId": "battlecoin",
    "intentId": "battlecoin.developers_mission",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "4bfe4e3fc6d0ee23dc20a755c70f59a3afa638a3da1ac00bd69fae4034fd92b2"
  },
  {
    "microtopicId": "battlecoin:battlecoin.roadmap",
    "domainId": "battlecoin",
    "intentId": "battlecoin.roadmap",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "b3ca6f99a718c5824d1c9446ffaac870321091c5ed2221dd8039fc9aed28d51f"
  },
  {
    "microtopicId": "battlecoin:battlecoin.action",
    "domainId": "battlecoin",
    "intentId": "battlecoin.action",
    "sourceNodeId": "knowledge.battlecoin.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "0afba79dcf5c300a56e668ebb52696a48f741eeefe7845a81a7c5d1d1f0ed9b8"
  },
  {
    "microtopicId": "battlecoin:battlecoin.capability",
    "domainId": "battlecoin",
    "intentId": "battlecoin.capability",
    "sourceNodeId": "knowledge.battlecoin.capability.checks-order-creation-and-settlement-chain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "8b07b5d392e02dc6ed213d10bd525c159103738840d110fc263e18dff98f6c80"
  },
  {
    "microtopicId": "battlecoin:battlecoin.source_evidence",
    "domainId": "battlecoin",
    "intentId": "battlecoin.source_evidence",
    "sourceNodeId": "knowledge.battlecoin.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "7191073247142abf8cb70b8753418c6e306ede86069e4efa9def41b8f0574c82"
  },
  {
    "microtopicId": "battlecoin:battlecoin.realization",
    "domainId": "battlecoin",
    "intentId": "battlecoin.realization",
    "sourceNodeId": "knowledge.battlecoin.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "c4f631bbc8112555af50565a2616d91a5606f49a78a6b4528d6d29160af922d2"
  },
  {
    "microtopicId": "battle_chat:battle_chat.overview",
    "domainId": "battle_chat",
    "intentId": "battle_chat.overview",
    "sourceNodeId": "knowledge.battle_chat.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "2c93e5bf96cc5a8b36151572511d0021834b9bdf3ad5a4f193843389789518f3"
  },
  {
    "microtopicId": "battle_chat:battle_chat.purpose",
    "domainId": "battle_chat",
    "intentId": "battle_chat.purpose",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "dade9fba3cc63aeb0fbac9c61129f15028a519b9b0ec2d26bffb1f02b5fb031e"
  },
  {
    "microtopicId": "battle_chat:battle_chat.user_value",
    "domainId": "battle_chat",
    "intentId": "battle_chat.user_value",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "1b9e763cf1b042c9bdc0013102538f1ebd6699778fd2dee5bce9264d847026f2"
  },
  {
    "microtopicId": "battle_chat:battle_chat.open",
    "domainId": "battle_chat",
    "intentId": "battle_chat.open",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "df2a85a7117b0c07c32cc8518045934ef03633bbf2240dc233e96cbf4b665933"
  },
  {
    "microtopicId": "battle_chat:battle_chat.start",
    "domainId": "battle_chat",
    "intentId": "battle_chat.start",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "d4e4e3dec141af31cd1fbde72254db1f1cac41c5928fce01fdaa5dc5893a27d1"
  },
  {
    "microtopicId": "battle_chat:battle_chat.how_to",
    "domainId": "battle_chat",
    "intentId": "battle_chat.how_to",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "43e4c5e9a4d0ced6c73cdb8d92d4158a1f3fc7607f9bbad222b468f01e21f7d1"
  },
  {
    "microtopicId": "battle_chat:battle_chat.availability",
    "domainId": "battle_chat",
    "intentId": "battle_chat.availability",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "a4e9d8a53ee59082da36628a3d1bf3d61615d796252065b1445b2bfd26f3138f"
  },
  {
    "microtopicId": "battle_chat:battle_chat.limitations",
    "domainId": "battle_chat",
    "intentId": "battle_chat.limitations",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "2bc9cecb114355c36e830ddc8850ed2a7da6a88e5678efc11e82041ec1178180"
  },
  {
    "microtopicId": "battle_chat:battle_chat.prerequisites",
    "domainId": "battle_chat",
    "intentId": "battle_chat.prerequisites",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "386733b1a13e1d12f643fa641deda21b80fa907341f570422bdc14b5e03d6f9d"
  },
  {
    "microtopicId": "battle_chat:battle_chat.safety",
    "domainId": "battle_chat",
    "intentId": "battle_chat.safety",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "572f727e4e8779b69bb8099e3eaf0dce74bf7f01587680e41361aa9504a09cf9"
  },
  {
    "microtopicId": "battle_chat:battle_chat.privacy",
    "domainId": "battle_chat",
    "intentId": "battle_chat.privacy",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "efffcb493195a5511623eb2c9c6ec10aabf764251665aab5254e62b2a6501633"
  },
  {
    "microtopicId": "battle_chat:battle_chat.self_status",
    "domainId": "battle_chat",
    "intentId": "battle_chat.self_status",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "129fb1b13daeb6bf33ed31f02a361c91cfeabb293d39dc0b20837dcdacf20f6b"
  },
  {
    "microtopicId": "battle_chat:battle_chat.incident",
    "domainId": "battle_chat",
    "intentId": "battle_chat.incident",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "bc56b92421e4389ae13b91b85303aa342db8d9b11d66fbc08c89646ba684bd3e"
  },
  {
    "microtopicId": "battle_chat:battle_chat.purchase_cost",
    "domainId": "battle_chat",
    "intentId": "battle_chat.purchase_cost",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "f3024deb314b56e654f9463f743f99c48f55034cc37fc06f4833fb55e97b4efe"
  },
  {
    "microtopicId": "battle_chat:battle_chat.earning_credit",
    "domainId": "battle_chat",
    "intentId": "battle_chat.earning_credit",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "4eb66f51db6c5c643111d5388460b3f5f578a92fe138d07d768315de55f76185"
  },
  {
    "microtopicId": "battle_chat:battle_chat.gift_transfer_sale",
    "domainId": "battle_chat",
    "intentId": "battle_chat.gift_transfer_sale",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "832caabe6507490ce7782a55cebdb76015e65523f7414891692465177c9f3407"
  },
  {
    "microtopicId": "battle_chat:battle_chat.developers_mission",
    "domainId": "battle_chat",
    "intentId": "battle_chat.developers_mission",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "0cfdfd4514b31c66c04daa272029e3475cd9affe3dee313c516c14d232b1c538"
  },
  {
    "microtopicId": "battle_chat:battle_chat.roadmap",
    "domainId": "battle_chat",
    "intentId": "battle_chat.roadmap",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "da4353387da4a66720b1bfb0bba18c8577680245e5059a0b4663fdbd48891777"
  },
  {
    "microtopicId": "battle_chat:battle_chat.action",
    "domainId": "battle_chat",
    "intentId": "battle_chat.action",
    "sourceNodeId": "knowledge.battle_chat.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "04b7035b7a8bb347cd8afaddf1f75ce9c6fb13f65f2481733056ae7a57c41ffd"
  },
  {
    "microtopicId": "battle_chat:battle_chat.capability",
    "domainId": "battle_chat",
    "intentId": "battle_chat.capability",
    "sourceNodeId": "knowledge.battle_chat.capability.uses-canonical-account-identity",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "2f4426568064c0b6e4001c2454b964fb0e9440d1eea5133ec27fbf801b938d4e"
  },
  {
    "microtopicId": "battle_chat:battle_chat.source_evidence",
    "domainId": "battle_chat",
    "intentId": "battle_chat.source_evidence",
    "sourceNodeId": "knowledge.battle_chat.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "70e257d8b0efcab77de1662f74607a025b4750d036df1dc7e026c698dec11613"
  },
  {
    "microtopicId": "battle_chat:battle_chat.realization",
    "domainId": "battle_chat",
    "intentId": "battle_chat.realization",
    "sourceNodeId": "knowledge.battle_chat.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "1b213b31f291c3eb63ece45272615ac7e1fffa15b0258e63e0a8b7ded93ecee7"
  },
  {
    "microtopicId": "futures:futures.overview",
    "domainId": "futures",
    "intentId": "futures.overview",
    "sourceNodeId": "knowledge.futures.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "f15a37befdfcb302998bea025a5930cee28009d57f6acf957108a4095d4900c1"
  },
  {
    "microtopicId": "futures:futures.purpose",
    "domainId": "futures",
    "intentId": "futures.purpose",
    "sourceNodeId": "knowledge.futures.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "d14bfa3db32c05930475911acd8c0d2cc351843539516ecd1f74fb007bdd9781"
  },
  {
    "microtopicId": "futures:futures.user_value",
    "domainId": "futures",
    "intentId": "futures.user_value",
    "sourceNodeId": "knowledge.futures.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "d21d262b681baa89d9073d65d2e8629cc6067f6f8d67b75ab85f73ff57fe6776"
  },
  {
    "microtopicId": "futures:futures.open",
    "domainId": "futures",
    "intentId": "futures.open",
    "sourceNodeId": "knowledge.futures.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "03e92f4248d24b354fbfcc286a1a313ef280e1fb27f4541255789f4e1c8d8615"
  },
  {
    "microtopicId": "futures:futures.start",
    "domainId": "futures",
    "intentId": "futures.start",
    "sourceNodeId": "knowledge.futures.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "3a41f6a32af3524a8f827f29e825abbfcf6effe6ce8bc355ed524668fdb638c1"
  },
  {
    "microtopicId": "futures:futures.how_to",
    "domainId": "futures",
    "intentId": "futures.how_to",
    "sourceNodeId": "knowledge.futures.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "7b3be7e2eb0de587fbfc5a34c1e5e44229ddd4b396cf73ccc9f1993746003ddd"
  },
  {
    "microtopicId": "futures:futures.availability",
    "domainId": "futures",
    "intentId": "futures.availability",
    "sourceNodeId": "knowledge.futures.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "2dddaede0747f3edc3474ab593729c028ec7eb1344de3da5684e5552a426f7d5"
  },
  {
    "microtopicId": "futures:futures.limitations",
    "domainId": "futures",
    "intentId": "futures.limitations",
    "sourceNodeId": "knowledge.futures.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "67e44e5c302c6034e31bd29fd0e06cf41060d332155d41fc7c5ab3483c22efa0"
  },
  {
    "microtopicId": "futures:futures.prerequisites",
    "domainId": "futures",
    "intentId": "futures.prerequisites",
    "sourceNodeId": "knowledge.futures.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "059e16a8cf3ba7668deb263cb2c436ab7ab203a7cdb586d63b7c129e6dd089c8"
  },
  {
    "microtopicId": "futures:futures.safety",
    "domainId": "futures",
    "intentId": "futures.safety",
    "sourceNodeId": "knowledge.futures.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "89b48edad7407e6fd841971bae13651cb97f2d483267083ce20f1539157c463b"
  },
  {
    "microtopicId": "futures:futures.privacy",
    "domainId": "futures",
    "intentId": "futures.privacy",
    "sourceNodeId": "knowledge.futures.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "10984b98be8d09e616e8decf43aca1214c76a0d58270c2e1883fb82e2b2bbc69"
  },
  {
    "microtopicId": "futures:futures.self_status",
    "domainId": "futures",
    "intentId": "futures.self_status",
    "sourceNodeId": "knowledge.futures.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "8609f8c5024cc4315e204fb216036c3457621c957134c7b2f57e5fb60af6530f"
  },
  {
    "microtopicId": "futures:futures.incident",
    "domainId": "futures",
    "intentId": "futures.incident",
    "sourceNodeId": "knowledge.futures.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "1342c9b2662238c5925309404b2859a631f76d302b0961806dd600e447ade31b"
  },
  {
    "microtopicId": "futures:futures.purchase_cost",
    "domainId": "futures",
    "intentId": "futures.purchase_cost",
    "sourceNodeId": "knowledge.futures.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "2aaa3c015b9cb8bc1c23af4c88bd9123ad78b9836570a9b1182660c2592117f4"
  },
  {
    "microtopicId": "futures:futures.earning_credit",
    "domainId": "futures",
    "intentId": "futures.earning_credit",
    "sourceNodeId": "knowledge.futures.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "ac456702bf8bee3b51097abf49290a1626ea92b89906fde6b7240a69680c70ca"
  },
  {
    "microtopicId": "futures:futures.gift_transfer_sale",
    "domainId": "futures",
    "intentId": "futures.gift_transfer_sale",
    "sourceNodeId": "knowledge.futures.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "6ea904eadf0639b94dd91ce40606a4a51f8bd5a5a51aebe49a186347a4f573fb"
  },
  {
    "microtopicId": "futures:futures.developers_mission",
    "domainId": "futures",
    "intentId": "futures.developers_mission",
    "sourceNodeId": "knowledge.futures.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "3a74816082966367c47ba0b0e99aa95425771c47bf43c9df9ecf505ee25ba6a2"
  },
  {
    "microtopicId": "futures:futures.roadmap",
    "domainId": "futures",
    "intentId": "futures.roadmap",
    "sourceNodeId": "knowledge.futures.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "cec6daf09dbd5faeabee151ac99661f90036065e43f8874c712e7da542583680"
  },
  {
    "microtopicId": "futures:futures.action",
    "domainId": "futures",
    "intentId": "futures.action",
    "sourceNodeId": "knowledge.futures.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "75368504376e1b87c95ca667636c435b6cd6b8a574db57946c1ebc228462b4c0"
  },
  {
    "microtopicId": "futures:futures.capability",
    "domainId": "futures",
    "intentId": "futures.capability",
    "sourceNodeId": "knowledge.futures.capability.explains-risk-clearly",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "5b848bf1e8e7a849a6f571e7d5b5a6dd41ba153752ed25e200f8f68f8bc1e1a3"
  },
  {
    "microtopicId": "futures:futures.source_evidence",
    "domainId": "futures",
    "intentId": "futures.source_evidence",
    "sourceNodeId": "knowledge.futures.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "bbba42ef541046e0204342f7fd03ebffb2ad48c8a60eb81f9dc32ddb6f3fc39d"
  },
  {
    "microtopicId": "futures:futures.realization",
    "domainId": "futures",
    "intentId": "futures.realization",
    "sourceNodeId": "knowledge.futures.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
    ],
    "availability": "available",
    "contentHash": "a4bd4be947ae0430bba4de9208566cc173951267babe3d73acaf879d7db3886f"
  },
  {
    "microtopicId": "academy:academy.overview",
    "domainId": "academy",
    "intentId": "academy.overview",
    "sourceNodeId": "knowledge.academy.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "a1988b69a6782ac72532ed485b55cbbca72823250e817fb7866e9e9ea5b7ed20"
  },
  {
    "microtopicId": "academy:academy.purpose",
    "domainId": "academy",
    "intentId": "academy.purpose",
    "sourceNodeId": "knowledge.academy.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "332d32d4a0d3462d70792a47c4c819929b57cc9a02ce972fc6667e8434f17fab"
  },
  {
    "microtopicId": "academy:academy.user_value",
    "domainId": "academy",
    "intentId": "academy.user_value",
    "sourceNodeId": "knowledge.academy.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "dcb9709419ceebcce556309460e592ff43789eb69f6cc42f2d43fb5f267a6aa7"
  },
  {
    "microtopicId": "academy:academy.open",
    "domainId": "academy",
    "intentId": "academy.open",
    "sourceNodeId": "knowledge.academy.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "6383bcc26a59d326b8d8a619abc6b5a6d34b863791d8bd74279ef018090bccc3"
  },
  {
    "microtopicId": "academy:academy.start",
    "domainId": "academy",
    "intentId": "academy.start",
    "sourceNodeId": "knowledge.academy.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "1adc6ea2ccf085d0bdadd23b14f4700ac87e05e8f49d9c4ae7b20678ae670927"
  },
  {
    "microtopicId": "academy:academy.how_to",
    "domainId": "academy",
    "intentId": "academy.how_to",
    "sourceNodeId": "knowledge.academy.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "4273559c04de8353c44afd55dc402960524bd50848e4646d471b6a2991385f85"
  },
  {
    "microtopicId": "academy:academy.availability",
    "domainId": "academy",
    "intentId": "academy.availability",
    "sourceNodeId": "knowledge.academy.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "e4d13d85b4cb080f4288a67c169abf62bf065df377bba26e85c5a8b232b2702d"
  },
  {
    "microtopicId": "academy:academy.limitations",
    "domainId": "academy",
    "intentId": "academy.limitations",
    "sourceNodeId": "knowledge.academy.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "f30b83b3e813f63c8bbf90c703467ce2d8ed489ed1eaffd1122a85a16b4b21d0"
  },
  {
    "microtopicId": "academy:academy.prerequisites",
    "domainId": "academy",
    "intentId": "academy.prerequisites",
    "sourceNodeId": "knowledge.academy.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "89d73ebc42f75309afb66a58c93211ba839ac7e73aadf186fc1ed3f1b0e82353"
  },
  {
    "microtopicId": "academy:academy.safety",
    "domainId": "academy",
    "intentId": "academy.safety",
    "sourceNodeId": "knowledge.academy.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "45d833352d6f152a26b8b10364b3e05c5507511d017d748b41590063c1abc795"
  },
  {
    "microtopicId": "academy:academy.privacy",
    "domainId": "academy",
    "intentId": "academy.privacy",
    "sourceNodeId": "knowledge.academy.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "72b49bc20de88ebaeae9c8c60ef4061f1def6ff32f0a5aa4a897b28d117868ff"
  },
  {
    "microtopicId": "academy:academy.self_status",
    "domainId": "academy",
    "intentId": "academy.self_status",
    "sourceNodeId": "knowledge.academy.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "80acc94faf7d8044ccc7d3e98ed90e4e792a26fcbb3c2a3d6f922c7fad179922"
  },
  {
    "microtopicId": "academy:academy.incident",
    "domainId": "academy",
    "intentId": "academy.incident",
    "sourceNodeId": "knowledge.academy.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "0d91bc44be1b6b23a373e122d70bd61d182c90c46a10a959d19138c5299c190d"
  },
  {
    "microtopicId": "academy:academy.purchase_cost",
    "domainId": "academy",
    "intentId": "academy.purchase_cost",
    "sourceNodeId": "knowledge.academy.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "1f3f52314cdfbd6952742925442e516493ca8c5d6937e8c133affa0760cda4ac"
  },
  {
    "microtopicId": "academy:academy.earning_credit",
    "domainId": "academy",
    "intentId": "academy.earning_credit",
    "sourceNodeId": "knowledge.academy.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "ca88a6ccafe9e7b1b47457b47bdff88f7d966f2e4d15f92756c309f126475d6c"
  },
  {
    "microtopicId": "academy:academy.gift_transfer_sale",
    "domainId": "academy",
    "intentId": "academy.gift_transfer_sale",
    "sourceNodeId": "knowledge.academy.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "c5a705cb3382886ab6878172b0e80f781f4b01dea85d186472903dd097196a11"
  },
  {
    "microtopicId": "academy:academy.developers_mission",
    "domainId": "academy",
    "intentId": "academy.developers_mission",
    "sourceNodeId": "knowledge.academy.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "88f6a3eff87da0c4b12d3bd15e874c2a35e9a34605ceb6cfc7ba243ed2017b42"
  },
  {
    "microtopicId": "academy:academy.roadmap",
    "domainId": "academy",
    "intentId": "academy.roadmap",
    "sourceNodeId": "knowledge.academy.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "c2c13f0b69a7e2df1cf67b01b4158d70049b8e5352f5052b0221bda3cf471292"
  },
  {
    "microtopicId": "academy:academy.action",
    "domainId": "academy",
    "intentId": "academy.action",
    "sourceNodeId": "knowledge.academy.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "93f3d2bb2b6e4f387a980865974d0123a469ec1afcde4a9887a79389fd859157"
  },
  {
    "microtopicId": "academy:academy.capability",
    "domainId": "academy",
    "intentId": "academy.capability",
    "sourceNodeId": "knowledge.academy.capability.checks-course-progress",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "1811458380251426a0e2db35346b2936f2a1403bf1cd402bf28ff8a88fc0a5df"
  },
  {
    "microtopicId": "academy:academy.source_evidence",
    "domainId": "academy",
    "intentId": "academy.source_evidence",
    "sourceNodeId": "knowledge.academy.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "b5cfc908ea6b5da34ed95cf47c39f9c070895a0e47735c5958a681c3b0cc280f"
  },
  {
    "microtopicId": "academy:academy.realization",
    "domainId": "academy",
    "intentId": "academy.realization",
    "sourceNodeId": "knowledge.academy.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
    ],
    "availability": "available",
    "contentHash": "c85a216808fdb352cd49b268341bbcff99979046abcbb9df21f747853f90bfdc"
  },
  {
    "microtopicId": "academy_exam:academy_exam.overview",
    "domainId": "academy_exam",
    "intentId": "academy_exam.overview",
    "sourceNodeId": "knowledge.academy_exam.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "d8bdc108fcad6e424b598c9d3b456f50c249612083b524d7c5eb77035ce01fa5"
  },
  {
    "microtopicId": "academy_exam:academy_exam.purpose",
    "domainId": "academy_exam",
    "intentId": "academy_exam.purpose",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "fdb5f284ae8d71ffff849def5fbb0d8720d4ba0ca5b519c65c345ea399879ad4"
  },
  {
    "microtopicId": "academy_exam:academy_exam.user_value",
    "domainId": "academy_exam",
    "intentId": "academy_exam.user_value",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "44e81ce7e0deb6b5e1dfa84b86e521b92e147a6a1b3d68fd4e172abf4f6b8ee4"
  },
  {
    "microtopicId": "academy_exam:academy_exam.open",
    "domainId": "academy_exam",
    "intentId": "academy_exam.open",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "f898cde8d0650a47609e17a84e39ae571d692331d7d6211a27494f6db58e8905"
  },
  {
    "microtopicId": "academy_exam:academy_exam.start",
    "domainId": "academy_exam",
    "intentId": "academy_exam.start",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "6141ab3a013a0bcb0e5e722be5947473c1f05d61ba9e668337fb4d870c6c7533"
  },
  {
    "microtopicId": "academy_exam:academy_exam.how_to",
    "domainId": "academy_exam",
    "intentId": "academy_exam.how_to",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "1fb34a8b7b4a6ae92741d4304cd310e115615929156a105158a79575089bb696"
  },
  {
    "microtopicId": "academy_exam:academy_exam.availability",
    "domainId": "academy_exam",
    "intentId": "academy_exam.availability",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "ef9f129e7c616b71c8797ffe3c803ffd397d44a1c12f48c1ac481ae675cb6fd0"
  },
  {
    "microtopicId": "academy_exam:academy_exam.limitations",
    "domainId": "academy_exam",
    "intentId": "academy_exam.limitations",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "a3859e215c9b2c458a31e7c98bd3bdd31d5585488438491f25a07c372995a494"
  },
  {
    "microtopicId": "academy_exam:academy_exam.prerequisites",
    "domainId": "academy_exam",
    "intentId": "academy_exam.prerequisites",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "8297a672746af4e593a2004ec831d138e5b0e4d8caff26daee6b6a0de758ca5d"
  },
  {
    "microtopicId": "academy_exam:academy_exam.safety",
    "domainId": "academy_exam",
    "intentId": "academy_exam.safety",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "1f7c6f4061d47f88ef136f17de7284dd33e8ffea2a42852a673ec099f518ef52"
  },
  {
    "microtopicId": "academy_exam:academy_exam.privacy",
    "domainId": "academy_exam",
    "intentId": "academy_exam.privacy",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "1c6b4a2ccd59cfe2a6c2c5093394a4a58bc9a8c4ec172d5ae8fed20dba67da46"
  },
  {
    "microtopicId": "academy_exam:academy_exam.self_status",
    "domainId": "academy_exam",
    "intentId": "academy_exam.self_status",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "92b06d509a72a66ed05e2203bad17924e47efe8c7add4c474f1d66644ab493a4"
  },
  {
    "microtopicId": "academy_exam:academy_exam.incident",
    "domainId": "academy_exam",
    "intentId": "academy_exam.incident",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "f9cc48943fc7a4dd7b124db981609d9d31de950a6584945e4c143f31f9131bbd"
  },
  {
    "microtopicId": "academy_exam:academy_exam.purchase_cost",
    "domainId": "academy_exam",
    "intentId": "academy_exam.purchase_cost",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "0058fddd27b8ad742c64ded6aee33f0e3e1c620aa00dc4ef86ed958b94e05286"
  },
  {
    "microtopicId": "academy_exam:academy_exam.earning_credit",
    "domainId": "academy_exam",
    "intentId": "academy_exam.earning_credit",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "f8f249fdb03db2eb3c6b1974ef236ec5c6e5a71938b70067d9f2fd1b5e8c5bda"
  },
  {
    "microtopicId": "academy_exam:academy_exam.gift_transfer_sale",
    "domainId": "academy_exam",
    "intentId": "academy_exam.gift_transfer_sale",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "07410aab202524e4245c5a3ecea682880c09154cba26a4ae17e268c4512d74f1"
  },
  {
    "microtopicId": "academy_exam:academy_exam.developers_mission",
    "domainId": "academy_exam",
    "intentId": "academy_exam.developers_mission",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "cd2d3b4020684a6e26d0fea424e586faa2596b7d3fb5f02bfc3f4a918da8353c"
  },
  {
    "microtopicId": "academy_exam:academy_exam.roadmap",
    "domainId": "academy_exam",
    "intentId": "academy_exam.roadmap",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "1d681c180736d6337b94e695b0891f6ea7d9b5275445861c0eaa835955cf1cc2"
  },
  {
    "microtopicId": "academy_exam:academy_exam.action",
    "domainId": "academy_exam",
    "intentId": "academy_exam.action",
    "sourceNodeId": "knowledge.academy_exam.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "e203117fb6f38fe3cb4aa556739344fbf958de1c1b3ff29c08f5c717f808d322"
  },
  {
    "microtopicId": "academy_exam:academy_exam.capability",
    "domainId": "academy_exam",
    "intentId": "academy_exam.capability",
    "sourceNodeId": "knowledge.academy_exam.capability.reads-attempt-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "5a94628fdbf60cdcc6805ee1bdfcec87a42b1ffc913d7e2b3753db68cf5a54c7"
  },
  {
    "microtopicId": "academy_exam:academy_exam.source_evidence",
    "domainId": "academy_exam",
    "intentId": "academy_exam.source_evidence",
    "sourceNodeId": "knowledge.academy_exam.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "01d3a779ba37d0c87c9f21f5fe0ac99ffd01750e02f3614eb0ceb259c9703f1d"
  },
  {
    "microtopicId": "academy_exam:academy_exam.realization",
    "domainId": "academy_exam",
    "intentId": "academy_exam.realization",
    "sourceNodeId": "knowledge.academy_exam.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
    ],
    "availability": "available",
    "contentHash": "87a681d6f15f6f5cb58773baebb822c947d2143b2a8a11b8e701e094a7060e17"
  },
  {
    "microtopicId": "gameverse:gameverse.overview",
    "domainId": "gameverse",
    "intentId": "gameverse.overview",
    "sourceNodeId": "knowledge.gameverse.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "c52f2f77f39dad943aa841abcba666b1304b9419bcba8d6c852c44032ebcbe91"
  },
  {
    "microtopicId": "gameverse:gameverse.purpose",
    "domainId": "gameverse",
    "intentId": "gameverse.purpose",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "badc9ef68cadcf4f394c9bf173c6c2a5f64c22ee08c5474f73efc7e4ae8be2ff"
  },
  {
    "microtopicId": "gameverse:gameverse.user_value",
    "domainId": "gameverse",
    "intentId": "gameverse.user_value",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "052102e0dbbc76d1c10269da69db5b531877323eded21b9ab3ed29bb011a3cb3"
  },
  {
    "microtopicId": "gameverse:gameverse.open",
    "domainId": "gameverse",
    "intentId": "gameverse.open",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "6d1008d59b9856f5fcb6eb89ca3e18089371bee48295d02004c0c8700f77ec88"
  },
  {
    "microtopicId": "gameverse:gameverse.start",
    "domainId": "gameverse",
    "intentId": "gameverse.start",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "910936ebe3552384a8a2f20364e60ac646154afb4c101922f1679d0ed6cee4ba"
  },
  {
    "microtopicId": "gameverse:gameverse.how_to",
    "domainId": "gameverse",
    "intentId": "gameverse.how_to",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "e2890f53316d8b19074b562bd6344785be0f9d476184623f4cf3dd123f171e6a"
  },
  {
    "microtopicId": "gameverse:gameverse.availability",
    "domainId": "gameverse",
    "intentId": "gameverse.availability",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "0affc0ed68afca36166979159e79edd20c9211e7b9fa1cd75513b199781b595c"
  },
  {
    "microtopicId": "gameverse:gameverse.limitations",
    "domainId": "gameverse",
    "intentId": "gameverse.limitations",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "a16548c6b6bf2d83809038ccc8d91d53c8f8d69c376144c184624a55fcacbd16"
  },
  {
    "microtopicId": "gameverse:gameverse.prerequisites",
    "domainId": "gameverse",
    "intentId": "gameverse.prerequisites",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "fe5eadc29e7caec52a2ae4f0ec809e47d2cf4ec72057546e39e77c1a1a682201"
  },
  {
    "microtopicId": "gameverse:gameverse.safety",
    "domainId": "gameverse",
    "intentId": "gameverse.safety",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "ee267ed8897ea081ec69cb24b120a28f119c5f816d6a65432e5fe41ab995ec0b"
  },
  {
    "microtopicId": "gameverse:gameverse.privacy",
    "domainId": "gameverse",
    "intentId": "gameverse.privacy",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "14cce1a0bfa1cfe4dbf283f2fcfb98a6d85c7b6330c6f5cebc56d09af366a1b9"
  },
  {
    "microtopicId": "gameverse:gameverse.self_status",
    "domainId": "gameverse",
    "intentId": "gameverse.self_status",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "452e06c06a175deff2bd2c02ad61aff8c61dd980c0fa934433e4ab067fe405e1"
  },
  {
    "microtopicId": "gameverse:gameverse.incident",
    "domainId": "gameverse",
    "intentId": "gameverse.incident",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "f447f67ba232320312590740ab5a6a968e1f97b8d9b0a179d2abaa8a677d5e9a"
  },
  {
    "microtopicId": "gameverse:gameverse.purchase_cost",
    "domainId": "gameverse",
    "intentId": "gameverse.purchase_cost",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "1619c081006f68b65082bdc06833764b476957a65e33f0fd39b109306ebfb05f"
  },
  {
    "microtopicId": "gameverse:gameverse.earning_credit",
    "domainId": "gameverse",
    "intentId": "gameverse.earning_credit",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "0b0587522bd57b3b25ac231cb4689935d1e080f5a86564896ae4e40458086f6c"
  },
  {
    "microtopicId": "gameverse:gameverse.gift_transfer_sale",
    "domainId": "gameverse",
    "intentId": "gameverse.gift_transfer_sale",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "ced2f4a235576f649490bc80521a1fc90e33f0d905327e93f945cd59159e242b"
  },
  {
    "microtopicId": "gameverse:gameverse.developers_mission",
    "domainId": "gameverse",
    "intentId": "gameverse.developers_mission",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "d294d846c62f69f6f3cf12638e3ebbbb45b25cb413805551a030af4cf403854a"
  },
  {
    "microtopicId": "gameverse:gameverse.roadmap",
    "domainId": "gameverse",
    "intentId": "gameverse.roadmap",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "a893b132886390f23f5cbab92cf7f5b32c8b2ac0e1549cbd406f388e5a2f37ff"
  },
  {
    "microtopicId": "gameverse:gameverse.action",
    "domainId": "gameverse",
    "intentId": "gameverse.action",
    "sourceNodeId": "knowledge.gameverse.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "c5f45ee05359a483a623ad0076cc6e48c2220e88f52348e58bd62444be3877d9"
  },
  {
    "microtopicId": "gameverse:gameverse.capability",
    "domainId": "gameverse",
    "intentId": "gameverse.capability",
    "sourceNodeId": "knowledge.gameverse.capability.checks-gameplay-state",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "d37251cce498cb1211f50cba885b4daa542a91e654d62c670f1bb673265e81ed"
  },
  {
    "microtopicId": "gameverse:gameverse.source_evidence",
    "domainId": "gameverse",
    "intentId": "gameverse.source_evidence",
    "sourceNodeId": "knowledge.gameverse.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "2da17abe5724f788739804c1db0279e77ef9195e37f12659cb400b6a02e990df"
  },
  {
    "microtopicId": "gameverse:gameverse.realization",
    "domainId": "gameverse",
    "intentId": "gameverse.realization",
    "sourceNodeId": "knowledge.gameverse.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "partially_available",
    "contentHash": "a22f4ebd1ae837661009401cb90118682d9228db16a81f8868ff6b2f73d97d19"
  },
  {
    "microtopicId": "metastudio:metastudio.overview",
    "domainId": "metastudio",
    "intentId": "metastudio.overview",
    "sourceNodeId": "knowledge.metastudio.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "c50f62d14daad83380a90d705547105d93a72d5b7630f558185571a7f3efe302"
  },
  {
    "microtopicId": "metastudio:metastudio.purpose",
    "domainId": "metastudio",
    "intentId": "metastudio.purpose",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "7fa592f990b7e304015f360009be96512c50f492229cd4c3b4e6a1337ca50fd9"
  },
  {
    "microtopicId": "metastudio:metastudio.user_value",
    "domainId": "metastudio",
    "intentId": "metastudio.user_value",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "18f0da086391817688e26636ccb61abde74f8d56621f9eb2b9c0379bb1b47a40"
  },
  {
    "microtopicId": "metastudio:metastudio.open",
    "domainId": "metastudio",
    "intentId": "metastudio.open",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "1046fb5bc048c3f77081dbbc9bafd26b4deec93233d9141eb29480a92d7cc752"
  },
  {
    "microtopicId": "metastudio:metastudio.start",
    "domainId": "metastudio",
    "intentId": "metastudio.start",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "f141e2343ff345860d3f90626f847921bb921e646f15930652e14210a27f6218"
  },
  {
    "microtopicId": "metastudio:metastudio.how_to",
    "domainId": "metastudio",
    "intentId": "metastudio.how_to",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "14a709faedf5085fd4c8425ee27327753b5f6f5285172edbd2a4879576f171e3"
  },
  {
    "microtopicId": "metastudio:metastudio.availability",
    "domainId": "metastudio",
    "intentId": "metastudio.availability",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "8723e3a31faec8b084a9647c0fc7078ae603cc6bc77a76ff24a33e5762ed61e1"
  },
  {
    "microtopicId": "metastudio:metastudio.limitations",
    "domainId": "metastudio",
    "intentId": "metastudio.limitations",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "0f3b8a7c8ef94d6323de007255e8a20335bdd69460a2e0efd2e4f1d85be22112"
  },
  {
    "microtopicId": "metastudio:metastudio.prerequisites",
    "domainId": "metastudio",
    "intentId": "metastudio.prerequisites",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "ef8fe784330391fb8307d055fc9c650074ce00e7c3ddf0d93c4ca0ee267d1852"
  },
  {
    "microtopicId": "metastudio:metastudio.safety",
    "domainId": "metastudio",
    "intentId": "metastudio.safety",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "1d843359044510f8779d2e43bc93af3e48cde9428dd35077c67070bd6f92c40f"
  },
  {
    "microtopicId": "metastudio:metastudio.privacy",
    "domainId": "metastudio",
    "intentId": "metastudio.privacy",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "9a45546d5e17f28c1abfdc34c9172cd3cbcabce6fceb4a7ef4a0956acf65c925"
  },
  {
    "microtopicId": "metastudio:metastudio.self_status",
    "domainId": "metastudio",
    "intentId": "metastudio.self_status",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "a6590ce25f4c683c112818637491da9eaf6e88eff10ac669ac8f4c165ddd3e86"
  },
  {
    "microtopicId": "metastudio:metastudio.incident",
    "domainId": "metastudio",
    "intentId": "metastudio.incident",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "6dbd997a2e5f27a26a4d31c7c7a6692cc3e297eef01173783b59e30b81d8ac52"
  },
  {
    "microtopicId": "metastudio:metastudio.purchase_cost",
    "domainId": "metastudio",
    "intentId": "metastudio.purchase_cost",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "09988d976ff8a5923d586598a9cda8173ab4bb4f518c063c53e0d95003c1c087"
  },
  {
    "microtopicId": "metastudio:metastudio.earning_credit",
    "domainId": "metastudio",
    "intentId": "metastudio.earning_credit",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "97e2fe05598656a864fc8838f8bfd7b855053e965d459045d87afedca4ef6cd5"
  },
  {
    "microtopicId": "metastudio:metastudio.gift_transfer_sale",
    "domainId": "metastudio",
    "intentId": "metastudio.gift_transfer_sale",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "3f8db05302b5559192274120ebb347f7f03a2754591eaac3946f0f5a00f27143"
  },
  {
    "microtopicId": "metastudio:metastudio.developers_mission",
    "domainId": "metastudio",
    "intentId": "metastudio.developers_mission",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "0d80226ef45e2aaef1d37e6d34f44780f3c6257af1048a9861cdcbc382c39946"
  },
  {
    "microtopicId": "metastudio:metastudio.roadmap",
    "domainId": "metastudio",
    "intentId": "metastudio.roadmap",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "9ae8190d9e29295af8c3a4d8cb0a2f8b1bfb842e63a9d0f45cc600b2c7bb287d"
  },
  {
    "microtopicId": "metastudio:metastudio.action",
    "domainId": "metastudio",
    "intentId": "metastudio.action",
    "sourceNodeId": "knowledge.metastudio.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "77f4145d5cfa94ec82effe89baf440cc3be45d206c095a676d0f618b913e831a"
  },
  {
    "microtopicId": "metastudio:metastudio.capability",
    "domainId": "metastudio",
    "intentId": "metastudio.capability",
    "sourceNodeId": "knowledge.metastudio.capability.checks-creator-state",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "6ef7da01fc403026a21d4db358815fe3b7ba132f2cfc4d0095177372e855ba90"
  },
  {
    "microtopicId": "metastudio:metastudio.source_evidence",
    "domainId": "metastudio",
    "intentId": "metastudio.source_evidence",
    "sourceNodeId": "knowledge.metastudio.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "a7891182260de43ea4e65126818b32853c1f7d0242819fb19e2a39bb7dcabfd5"
  },
  {
    "microtopicId": "metastudio:metastudio.realization",
    "domainId": "metastudio",
    "intentId": "metastudio.realization",
    "sourceNodeId": "knowledge.metastudio.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
    ],
    "availability": "planned",
    "contentHash": "5773e26667f7a785c87b830f21d569c143ad5f281fb0a93eeaa0d4b58b6fc248"
  },
  {
    "microtopicId": "metaverse:metaverse.overview",
    "domainId": "metaverse",
    "intentId": "metaverse.overview",
    "sourceNodeId": "knowledge.metaverse.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "016d4a39bc49770adcf6078e0832190061f493790b10bcb17e9a82e3324f6b6b"
  },
  {
    "microtopicId": "metaverse:metaverse.purpose",
    "domainId": "metaverse",
    "intentId": "metaverse.purpose",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "a234ac86e043b742ab74589bce5fc5c9f81634516ddc5c9642d0889c8a86f1bd"
  },
  {
    "microtopicId": "metaverse:metaverse.user_value",
    "domainId": "metaverse",
    "intentId": "metaverse.user_value",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "9d54f078935937df123a018ea60d7f03108c853ec0e60b9ce490be1e74df9587"
  },
  {
    "microtopicId": "metaverse:metaverse.open",
    "domainId": "metaverse",
    "intentId": "metaverse.open",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "999be98ab4861941ea0cf5d53c83fb2b3426b37eceaf40ce4e1b14eff6bc255a"
  },
  {
    "microtopicId": "metaverse:metaverse.start",
    "domainId": "metaverse",
    "intentId": "metaverse.start",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "4bc2514cd04a7f1aaeadb8e43d34e62f0635a7b7cfa7ccd868a2f412843b22da"
  },
  {
    "microtopicId": "metaverse:metaverse.how_to",
    "domainId": "metaverse",
    "intentId": "metaverse.how_to",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "9856c5bdb4ef2671692e3c0a57c0e498e8dcba1ee57123c13309d967a91ef400"
  },
  {
    "microtopicId": "metaverse:metaverse.availability",
    "domainId": "metaverse",
    "intentId": "metaverse.availability",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "95ef77f4f020d7de0035eff69477c3f322187721d8f49cd246d2591a1ce70b34"
  },
  {
    "microtopicId": "metaverse:metaverse.limitations",
    "domainId": "metaverse",
    "intentId": "metaverse.limitations",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "9581059493e52907ed3ace43ff9d2f2b813d32c394b291d6ba9e58ed0e253590"
  },
  {
    "microtopicId": "metaverse:metaverse.prerequisites",
    "domainId": "metaverse",
    "intentId": "metaverse.prerequisites",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "239df187bff60cad110fb0bfd0ee82f587815a6ef4641cecceb3e0e8bab5c5d7"
  },
  {
    "microtopicId": "metaverse:metaverse.safety",
    "domainId": "metaverse",
    "intentId": "metaverse.safety",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "88ff45e5d94390e9a13b8a696eae4b948d227e434b1caf8a4a7f815a9fc13bde"
  },
  {
    "microtopicId": "metaverse:metaverse.privacy",
    "domainId": "metaverse",
    "intentId": "metaverse.privacy",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "8ba6952d0db933f812a68b110dca8833bf44bd6ae3896a3af3354029b4ebf1b7"
  },
  {
    "microtopicId": "metaverse:metaverse.self_status",
    "domainId": "metaverse",
    "intentId": "metaverse.self_status",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "552457eb083dccd41fdb82c7fcf9a5138fef488e214a232112d16cca3ade71db"
  },
  {
    "microtopicId": "metaverse:metaverse.incident",
    "domainId": "metaverse",
    "intentId": "metaverse.incident",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "514220ba6f1340c16b88d7f91d9d73f763f16799ce3c679cb4cb0f65d657dd47"
  },
  {
    "microtopicId": "metaverse:metaverse.purchase_cost",
    "domainId": "metaverse",
    "intentId": "metaverse.purchase_cost",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "5c99c79913219aa932cb81efe0b2936c8db8d87658a226dd926c6b2a545fe401"
  },
  {
    "microtopicId": "metaverse:metaverse.earning_credit",
    "domainId": "metaverse",
    "intentId": "metaverse.earning_credit",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "3b1df564e0db65b71b42c28864ba88e173204c4139275cbf9def9d3b70b5083c"
  },
  {
    "microtopicId": "metaverse:metaverse.gift_transfer_sale",
    "domainId": "metaverse",
    "intentId": "metaverse.gift_transfer_sale",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "36add0aa7c7047dcf21505f4ddb136aacef19fbdb056700a3230b19005362edd"
  },
  {
    "microtopicId": "metaverse:metaverse.developers_mission",
    "domainId": "metaverse",
    "intentId": "metaverse.developers_mission",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "52a590ea28b10459732663ec0e49b73092b2f01c8afaa2d28081270bf71f9b7b"
  },
  {
    "microtopicId": "metaverse:metaverse.roadmap",
    "domainId": "metaverse",
    "intentId": "metaverse.roadmap",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "7d5ae4e3544a6657782dff09f14b67953385a63a34a120bf5a0c80054b0e9758"
  },
  {
    "microtopicId": "metaverse:metaverse.action",
    "domainId": "metaverse",
    "intentId": "metaverse.action",
    "sourceNodeId": "knowledge.metaverse.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "383221e172383d1d468bd315d1148b15932cc1d9169a72427ae3f16418acd48c"
  },
  {
    "microtopicId": "metaverse:metaverse.capability",
    "domainId": "metaverse",
    "intentId": "metaverse.capability",
    "sourceNodeId": "knowledge.metaverse.capability.checks-access-state",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "b5083f0b1350a401f806672cdc73e5610e2929160460acc85efd6187e7ae4b34"
  },
  {
    "microtopicId": "metaverse:metaverse.source_evidence",
    "domainId": "metaverse",
    "intentId": "metaverse.source_evidence",
    "sourceNodeId": "knowledge.metaverse.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "556ba126e546865e93af12844dc12bfa8f05c43bedebdaa32979a4e94551c794"
  },
  {
    "microtopicId": "metaverse:metaverse.realization",
    "domainId": "metaverse",
    "intentId": "metaverse.realization",
    "sourceNodeId": "knowledge.metaverse.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
    ],
    "availability": "planned",
    "contentHash": "c645457fcdd7fa291d998036b412c67f68d6a469b3c16287fb3116fbdef73de7"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.overview",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.overview",
    "sourceNodeId": "knowledge.quantum_zigzag.domain",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "80ab7656984f360becf4fb5f14f647e3698e61e7e964910aecc45ebe1070ef94"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.purpose",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.purpose",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.purpose",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "e9c0593d627de5278dcb198353c492283a3476dbe2ad2b7a2fa4ce25f3f393cd"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.user_value",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.user_value",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.user-value",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "3325f9e8aa03f142fe6a9d03466874a799bb5977cb281da7ed2819c1670a6c51"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.open",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.open",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.open",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "c1d5e21b4ab38406cc062ec292c19f62b498349db54a4570aebcbb83a5475a0c"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.start",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.start",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.start",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "be544c90bd43aae8c47d2e4200adc273d09821f22af2845229b4aa6355544f5a"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.how_to",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.how_to",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.how-to",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "41357784fe76bbcbcbd4311d9e4bbbe4ab9e7a2561cdecb1f780b3001bd13873"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.availability",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.availability",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.availability",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "071362835cbcf928474f8f51b5ae71e9c30feb6f0b4917bc3a2d50e2b1d3726e"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.limitations",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.limitations",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.limitations",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "3cbba4eebb7d0bb7d962751baabb0e64af145c09e0daa07399866c213c1a4c5b"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.prerequisites",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.prerequisites",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.prerequisites",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "8463d658e5b5423039f89b0524b121f42ccff3d464f567c3b7472ad4b0b8ceef"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.safety",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.safety",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.safety",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "3a95e01d1de77f74275963443cecb300186a5f09782ffd877f5fdc4eafa2b5db"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.privacy",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.privacy",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.privacy",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "9e2afba015b236298d596c1a45222028ad653d5bd89363b284418fe1df1ccb1c"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.self_status",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.self_status",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.self-status",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "06452ff5927fb59588b5883a67fbbade1919e11f8ade58e712e3f8874a510000"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.incident",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.incident",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.incident",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "eeeffdd64e989af095465baef9f0171d690dfab12620d2efd83839450ac1e2c7"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.purchase_cost",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.purchase_cost",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.purchase-cost",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "cc9b667430b1de443dd68d983cdd86ff191e0dcc3e46271a2742d77372984c6e"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.earning_credit",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.earning_credit",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.earning-credit",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "5846769ba69ebbf68bf48ba8f2eeaf86088627567390508c4070da999f27779e"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.gift_transfer_sale",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.gift_transfer_sale",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "07b23f6b7835c47006421e1d3063fcd3df3752d0da395f6f702420a1c21ed787"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.developers_mission",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.developers_mission",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.developers-mission",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "8048db700e2baf533d4a8cbfce6da314d51520a7eedf7f27f4a8f40b9ac13577"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.roadmap",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.roadmap",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.roadmap",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "71d67f7e27619b7deb17060ffd816cbe718c4ab2107e0f477210841fa4dc0b73"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.action",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.action",
    "sourceNodeId": "knowledge.quantum_zigzag.microdomainnode.action",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "103102da5902aa1f087ae5773eeaceb0bece9672a46fc084ae47465020c08036"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.capability",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.capability",
    "sourceNodeId": "knowledge.quantum_zigzag.capability.planned-digital-storefronts",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "2fab442c4f57169fbf272042c8d122874711e843291fed29ca8e18d86f7ed861"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.source_evidence",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.source_evidence",
    "sourceNodeId": "knowledge.quantum_zigzag.sourcereceipt.source-evidence",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "210e0f0ae913dfd8e2dc8b142fd5c01e7c30ea2d3ebbdb1915bb618523f736c9"
  },
  {
    "microtopicId": "quantum_zigzag:quantum_zigzag.realization",
    "domainId": "quantum_zigzag",
    "intentId": "quantum_zigzag.realization",
    "sourceNodeId": "knowledge.quantum_zigzag.realizationplan.realization",
    "sourceRefs": [
      "components/i18n.source.js:quantum_wallet_action_zigzag_description",
      "docs/mobile-payment-compliance.md",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "647636b72f74c0e3a8a2e724948305c165aa512f850b3c27678ca0751044df1b"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.overview",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.overview",
    "sourceNodeId": "knowledge.ql7_blockchain.domain",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "9e17686b439fe9ac423bf6b99cd34fee4d8aa3a7c4078d898ed79677cac2e84d"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.purpose",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.purpose",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.purpose",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "f2e55b2a94d63f8e2a1d42509269dc7621df382241d3ace57d0d564ba4aae79b"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.user_value",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.user_value",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.user-value",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "f4b7748be89586b6231634503a612db1d885b9b611a6478a0e10e5cba708cb79"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.open",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.open",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.open",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "7e325c4fab4065372ea463082149fc71d809ba382db20f3ae5ed19147a18c75e"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.start",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.start",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.start",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "66b3f930598300612e47dff50996e960cf81b65b324b8a63a2de58dc0845fa3d"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.how_to",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.how_to",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.how-to",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "5735636c3ba6c0fd000cd8c42796459b19eb1a2f9d89527dc093b0b311811ce2"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.availability",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.availability",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.availability",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "1892f7009665b470f8d3626586f32da5bb07c58e8d95e29c6f02a15ac8c9ce78"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.limitations",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.limitations",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.limitations",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "4d67a0af912cd59ad9ea32330a955ed3fdc65304e955c14b3b798d3057effebc"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.prerequisites",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.prerequisites",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.prerequisites",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "cbd0c8fd8b654c720bcc847a7fdb343411fc58576f56aae367e2bdec6a0fcd4c"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.safety",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.safety",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.safety",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "a9f2bbd4b2ec89aa28b874464776bf17250fba6d2bf872b2f23714e24c61dcc5"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.privacy",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.privacy",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.privacy",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "c4e5df33dceceee632333cc0bf9e68ed6c11e412e6b196ec4cea4b1d1f24e5e5"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.self_status",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.self_status",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.self-status",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "db8bb03b5c91c6a1e245b40c1f7980b91b6b5881f4a947c2e929ed207a170bdc"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.incident",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.incident",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.incident",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "0364ae35ac3ea697e38f1a5d737ab866aa782e7c41168b62ef1527c3e2db8330"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.purchase_cost",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.purchase_cost",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.purchase-cost",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "7c8882496303acf8caf8814c34bef83d13d24374f76e2176525cd7ac9a385e17"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.earning_credit",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.earning_credit",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.earning-credit",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "d4240111ae935d0b487a4f7a802273302c222f2ee56897fb98ea0c091f15ebbe"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.gift_transfer_sale",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.gift_transfer_sale",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "041df85b776fbd1b769467b4581d15e04ef84e4860f1b843a4a223d218cfdcbd"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.developers_mission",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.developers_mission",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.developers-mission",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "a44d8409a34df108f3306fc97a1989e83336d9a7fcc85a2696f265d9aa90a7c9"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.roadmap",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.roadmap",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.roadmap",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "3705d3c09106d1881f539440063f87b05b740d8bb41a209dfc9653265d1327b0"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.action",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.action",
    "sourceNodeId": "knowledge.ql7_blockchain.microdomainnode.action",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "cb53fb50e3dbca0fd4ec13d1147f4aae32fdd4eb4c5a361c4c3fada90ba9a5ac"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.capability",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.capability",
    "sourceNodeId": "knowledge.ql7_blockchain.capability.planned-verifiable-ownership-history",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "27b512ba92196f5da4b0e793ab941c757f6a274d523644156ca335c38743b0ec"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.source_evidence",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.source_evidence",
    "sourceNodeId": "knowledge.ql7_blockchain.sourcereceipt.source-evidence",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "97ba9a81f9b4ce6ed2a4ebaf3f3a21007f046c8619c04e1a26e069062be340a1"
  },
  {
    "microtopicId": "ql7_blockchain:ql7_blockchain.realization",
    "domainId": "ql7_blockchain",
    "intentId": "ql7_blockchain.realization",
    "sourceNodeId": "knowledge.ql7_blockchain.realizationplan.realization",
    "sourceRefs": [
      "components/i18n.source.js:about_sections.blockchain",
      "components/i18n.source.js:quantum_wallet_blockchain",
      "docs/mobile-shell.md"
    ],
    "availability": "planned",
    "contentHash": "c5870467ec09dc3f08b0fe63ffbe9737bcdd04f50d6a7bab80ce21c5c3c8135f"
  },
  {
    "microtopicId": "forum_feed:forum_feed.overview",
    "domainId": "forum_feed",
    "intentId": "forum_feed.overview",
    "sourceNodeId": "knowledge.forum_feed.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "eca088f084c0446ed27394792eb0920799acb7545003e1998d190feb39ba05f6"
  },
  {
    "microtopicId": "forum_feed:forum_feed.purpose",
    "domainId": "forum_feed",
    "intentId": "forum_feed.purpose",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "8f7cb53330eb900f6db5de8ca4b7f6caf197fcea2230f059dd657f5f6b8c9e6b"
  },
  {
    "microtopicId": "forum_feed:forum_feed.user_value",
    "domainId": "forum_feed",
    "intentId": "forum_feed.user_value",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "f6e884349efbd8bfab1be311a6f6c883b969df76c7ae285d249b07ad4128eb5c"
  },
  {
    "microtopicId": "forum_feed:forum_feed.open",
    "domainId": "forum_feed",
    "intentId": "forum_feed.open",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "ca890491f43aded169bee26c36c3dc84d4956b74df2b80eac4161df440e636b6"
  },
  {
    "microtopicId": "forum_feed:forum_feed.start",
    "domainId": "forum_feed",
    "intentId": "forum_feed.start",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "a9a966d458b61efb52628c0e305dc496663408ce3f29054edc1e9e2a60a5cad3"
  },
  {
    "microtopicId": "forum_feed:forum_feed.how_to",
    "domainId": "forum_feed",
    "intentId": "forum_feed.how_to",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "ea498a9d6593410580087488ab23b1a4c648b54e75a5bc12284d09fb8f3a3c0b"
  },
  {
    "microtopicId": "forum_feed:forum_feed.availability",
    "domainId": "forum_feed",
    "intentId": "forum_feed.availability",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "32fbb1bb3ad77c294d810e3886280e550ccec80d782eeb1cea23a6169f038101"
  },
  {
    "microtopicId": "forum_feed:forum_feed.limitations",
    "domainId": "forum_feed",
    "intentId": "forum_feed.limitations",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "be4258066d0fb3edc8b956cdb91b07c72f0826f1568d5748c14aecc673bccf40"
  },
  {
    "microtopicId": "forum_feed:forum_feed.prerequisites",
    "domainId": "forum_feed",
    "intentId": "forum_feed.prerequisites",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "ce78ad1eb8a8fe780245575c47f411d4792405ec369abf216c18bf6e35656416"
  },
  {
    "microtopicId": "forum_feed:forum_feed.safety",
    "domainId": "forum_feed",
    "intentId": "forum_feed.safety",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "8f0ed36e7649a87cf2a7fefa2d5587b50fd8d7d19d5917cb91835bd3826c69ed"
  },
  {
    "microtopicId": "forum_feed:forum_feed.privacy",
    "domainId": "forum_feed",
    "intentId": "forum_feed.privacy",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "9e7accf68148a7148777e9d7d6643d1fed5583875807fb01c9ea74ff6af6cf06"
  },
  {
    "microtopicId": "forum_feed:forum_feed.self_status",
    "domainId": "forum_feed",
    "intentId": "forum_feed.self_status",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "e65d78f56b98d5faac68c69bb72e4562d8cf5fd81de74f460eee586bc1e7f2fb"
  },
  {
    "microtopicId": "forum_feed:forum_feed.incident",
    "domainId": "forum_feed",
    "intentId": "forum_feed.incident",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "f6c46a25d9692a8c6a83cd13d7241995486d0d698e42462c568029cd06fdb188"
  },
  {
    "microtopicId": "forum_feed:forum_feed.purchase_cost",
    "domainId": "forum_feed",
    "intentId": "forum_feed.purchase_cost",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "de9ad87daf1687e3d9da674350e23d77dc441ad8d7e8d46c473a99de1f5b94f1"
  },
  {
    "microtopicId": "forum_feed:forum_feed.earning_credit",
    "domainId": "forum_feed",
    "intentId": "forum_feed.earning_credit",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "5564aecfece21c921ae799953f52fa43d34564b3e6aebedbac84939d9838cfdd"
  },
  {
    "microtopicId": "forum_feed:forum_feed.gift_transfer_sale",
    "domainId": "forum_feed",
    "intentId": "forum_feed.gift_transfer_sale",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "5800ac2a916651ebcfcbef8560979881f82991824d511ba69030ef1506bdd1a6"
  },
  {
    "microtopicId": "forum_feed:forum_feed.developers_mission",
    "domainId": "forum_feed",
    "intentId": "forum_feed.developers_mission",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "7486bd94922180d8ca620b5ef6d0db8dba8f4cbe0a18e3db3dcea52854f253a4"
  },
  {
    "microtopicId": "forum_feed:forum_feed.roadmap",
    "domainId": "forum_feed",
    "intentId": "forum_feed.roadmap",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "d84ca85bfd3880eb90474d930da4a97a5bbfcb5b8dceb0507d3c3777a09c3bc6"
  },
  {
    "microtopicId": "forum_feed:forum_feed.action",
    "domainId": "forum_feed",
    "intentId": "forum_feed.action",
    "sourceNodeId": "knowledge.forum_feed.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "055d88e434a7e24877c4ca16ea2194d80e1692d3714bd2f02dac502587202bc6"
  },
  {
    "microtopicId": "forum_feed:forum_feed.capability",
    "domainId": "forum_feed",
    "intentId": "forum_feed.capability",
    "sourceNodeId": "knowledge.forum_feed.capability.checks-feed-sorting-context",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "be2a3036c829e5c0fb641790db7e9189a2237a4f7e70c383e687b42a4b7cd777"
  },
  {
    "microtopicId": "forum_feed:forum_feed.source_evidence",
    "domainId": "forum_feed",
    "intentId": "forum_feed.source_evidence",
    "sourceNodeId": "knowledge.forum_feed.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "58c0ca9f03627e3465816ddc9a3e739c710a85341b14ce25e9485c47e4c797bb"
  },
  {
    "microtopicId": "forum_feed:forum_feed.realization",
    "domainId": "forum_feed",
    "intentId": "forum_feed.realization",
    "sourceNodeId": "knowledge.forum_feed.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "f48a34463a8561c90cc792815d004fae55b9a8abf75843652c7617c603f852c8"
  },
  {
    "microtopicId": "forum_threads:forum_threads.overview",
    "domainId": "forum_threads",
    "intentId": "forum_threads.overview",
    "sourceNodeId": "knowledge.forum_threads.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "61055d11459b1aa2763a170f28c8a4872abb8b811bf32e8367835b4410aa1cf9"
  },
  {
    "microtopicId": "forum_threads:forum_threads.purpose",
    "domainId": "forum_threads",
    "intentId": "forum_threads.purpose",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "4c38d2735bc4e9de37958545171041169b940a13d31582dcc5388ab3a502fa2e"
  },
  {
    "microtopicId": "forum_threads:forum_threads.user_value",
    "domainId": "forum_threads",
    "intentId": "forum_threads.user_value",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "0be4933ec80f7b43802e38b8b84fff49efcdbc860ac79577f873a2ba374ad7a9"
  },
  {
    "microtopicId": "forum_threads:forum_threads.open",
    "domainId": "forum_threads",
    "intentId": "forum_threads.open",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "1b271e77845526b1de83ebdf191df0d0028f17280741ecb1faff50c755da353f"
  },
  {
    "microtopicId": "forum_threads:forum_threads.start",
    "domainId": "forum_threads",
    "intentId": "forum_threads.start",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "8f1538725592d07c0367c06cd8f2ce15391a39f301284556bb4061698e09748b"
  },
  {
    "microtopicId": "forum_threads:forum_threads.how_to",
    "domainId": "forum_threads",
    "intentId": "forum_threads.how_to",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "0a45e8980c08d881035bcd03219dfc36450407a7c734dade576d8075e9344e96"
  },
  {
    "microtopicId": "forum_threads:forum_threads.availability",
    "domainId": "forum_threads",
    "intentId": "forum_threads.availability",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "25e2c7cbf9fb6ac956da29365b854efbd18bf55c4b348f2cb1ea583127ad778e"
  },
  {
    "microtopicId": "forum_threads:forum_threads.limitations",
    "domainId": "forum_threads",
    "intentId": "forum_threads.limitations",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "4c41e1f301dbceb7b0674b45bdf0a0d382ce799994d86dbdbc614277364c717a"
  },
  {
    "microtopicId": "forum_threads:forum_threads.prerequisites",
    "domainId": "forum_threads",
    "intentId": "forum_threads.prerequisites",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "ac435fb495f4910bd9984d0543382ba5e945e34d760f32aca9a437bc7df7e86f"
  },
  {
    "microtopicId": "forum_threads:forum_threads.safety",
    "domainId": "forum_threads",
    "intentId": "forum_threads.safety",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "ee7a19c290242f200dfa52d83e2e7ad74073f38aea010642ff3bad29e1059a9c"
  },
  {
    "microtopicId": "forum_threads:forum_threads.privacy",
    "domainId": "forum_threads",
    "intentId": "forum_threads.privacy",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "5ed4bd6bad8933dec2a3e7e774f14e87d4ecf50e94244aeb34f2801cf621e3ba"
  },
  {
    "microtopicId": "forum_threads:forum_threads.self_status",
    "domainId": "forum_threads",
    "intentId": "forum_threads.self_status",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "1de220a1fda58e6b377f5dbe3f01500cd0d97fc63dbb81d5486948878e9242a2"
  },
  {
    "microtopicId": "forum_threads:forum_threads.incident",
    "domainId": "forum_threads",
    "intentId": "forum_threads.incident",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "87244df1c12e55ba4030d84cb774313e2c8fd33ebc96c80f1395176e027a63b4"
  },
  {
    "microtopicId": "forum_threads:forum_threads.purchase_cost",
    "domainId": "forum_threads",
    "intentId": "forum_threads.purchase_cost",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "d6c4dea00bd7e6acdbe85e08ae0ec6b64b48c6c0fe4cbb99966a4cd10182d18a"
  },
  {
    "microtopicId": "forum_threads:forum_threads.earning_credit",
    "domainId": "forum_threads",
    "intentId": "forum_threads.earning_credit",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "6445a505b36013ce59ff3b19ecb7718f94441b13352dc032acb1fc3f60677438"
  },
  {
    "microtopicId": "forum_threads:forum_threads.gift_transfer_sale",
    "domainId": "forum_threads",
    "intentId": "forum_threads.gift_transfer_sale",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "a1019d1d2daf5a0cf31b543172e2ad011f9787e43f71bba90792d2e5c84a9d26"
  },
  {
    "microtopicId": "forum_threads:forum_threads.developers_mission",
    "domainId": "forum_threads",
    "intentId": "forum_threads.developers_mission",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "a132fbe521073caad0334631c049b5763da637b8fb45830de98ece3726aa0d40"
  },
  {
    "microtopicId": "forum_threads:forum_threads.roadmap",
    "domainId": "forum_threads",
    "intentId": "forum_threads.roadmap",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "ee1a54a14cc659cf92974ed430da8002fff1e735b571fa525360902a7a9a3dba"
  },
  {
    "microtopicId": "forum_threads:forum_threads.action",
    "domainId": "forum_threads",
    "intentId": "forum_threads.action",
    "sourceNodeId": "knowledge.forum_threads.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "3f14902bd89f807d386a998cf634e4900f35a8ad7947ac3d9eebdd01efafecc4"
  },
  {
    "microtopicId": "forum_threads:forum_threads.capability",
    "domainId": "forum_threads",
    "intentId": "forum_threads.capability",
    "sourceNodeId": "knowledge.forum_threads.capability.checks-opened-thread-ordering",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "e485f8b70b4e615ce323809cc5aec2ebf180270994c574dc96474bdb00987b44"
  },
  {
    "microtopicId": "forum_threads:forum_threads.source_evidence",
    "domainId": "forum_threads",
    "intentId": "forum_threads.source_evidence",
    "sourceNodeId": "knowledge.forum_threads.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "6a4894db781ca8b9cfc66a79a65094e94a0d388b9424e284a556e90968520220"
  },
  {
    "microtopicId": "forum_threads:forum_threads.realization",
    "domainId": "forum_threads",
    "intentId": "forum_threads.realization",
    "sourceNodeId": "knowledge.forum_threads.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
    ],
    "availability": "available",
    "contentHash": "e3a5362e353586ef401ca05320f729eb93958dcd8725dc5fdfc4ec4fac989acf"
  },
  {
    "microtopicId": "search:search.overview",
    "domainId": "search",
    "intentId": "search.overview",
    "sourceNodeId": "knowledge.search.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "c92f126ba57a729c4750bcf6610b2df16bef0ea85fdd8dcd8c797bab3bf59d76"
  },
  {
    "microtopicId": "search:search.purpose",
    "domainId": "search",
    "intentId": "search.purpose",
    "sourceNodeId": "knowledge.search.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "ace9ecfe6a25546a7944213ff1c732544ddca682cfb792975e9f5c05777268d7"
  },
  {
    "microtopicId": "search:search.user_value",
    "domainId": "search",
    "intentId": "search.user_value",
    "sourceNodeId": "knowledge.search.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "6b418b093272e4629902d9bc111ecbd6601a0bc371bf782b6c6bbd99137c9d33"
  },
  {
    "microtopicId": "search:search.open",
    "domainId": "search",
    "intentId": "search.open",
    "sourceNodeId": "knowledge.search.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "a7e00a0187b9d4db2225e8d0e6ead714336c184887d389b7e00418881a3d71a0"
  },
  {
    "microtopicId": "search:search.start",
    "domainId": "search",
    "intentId": "search.start",
    "sourceNodeId": "knowledge.search.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "2d3245afbcb917d97fcc8686a4f1758abd191a917f339c032ba00d8c08ab1a07"
  },
  {
    "microtopicId": "search:search.how_to",
    "domainId": "search",
    "intentId": "search.how_to",
    "sourceNodeId": "knowledge.search.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "d203465c2e5c973a5abdbe40523ea43724c9a7527854e420faa582520680382a"
  },
  {
    "microtopicId": "search:search.availability",
    "domainId": "search",
    "intentId": "search.availability",
    "sourceNodeId": "knowledge.search.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "644f53df7ed5cef7f789f0f62b52c22d54afeab61bd6869737d765eddbf6fe3e"
  },
  {
    "microtopicId": "search:search.limitations",
    "domainId": "search",
    "intentId": "search.limitations",
    "sourceNodeId": "knowledge.search.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "5466ba9e3d3df0b4f074e39a668f49338dc2aa0ba78b39e4d29f5379bacee352"
  },
  {
    "microtopicId": "search:search.prerequisites",
    "domainId": "search",
    "intentId": "search.prerequisites",
    "sourceNodeId": "knowledge.search.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "61ec2613a120eec4e3319fc7e46c9d9ee96482822d845ab53d531f934c51af98"
  },
  {
    "microtopicId": "search:search.safety",
    "domainId": "search",
    "intentId": "search.safety",
    "sourceNodeId": "knowledge.search.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "7eeacbbb16fc8c4a5fc11cc66bc5eebf3d80e7524374486c93650751c279658a"
  },
  {
    "microtopicId": "search:search.privacy",
    "domainId": "search",
    "intentId": "search.privacy",
    "sourceNodeId": "knowledge.search.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "bf78ff179f4757eae0df6b04a77d81bae10f5cc393113a3060a8d559f778b018"
  },
  {
    "microtopicId": "search:search.self_status",
    "domainId": "search",
    "intentId": "search.self_status",
    "sourceNodeId": "knowledge.search.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "aed353a1b1521efcf2936aca141df89c65258e6c4f1dc341ffad0de89b40221a"
  },
  {
    "microtopicId": "search:search.incident",
    "domainId": "search",
    "intentId": "search.incident",
    "sourceNodeId": "knowledge.search.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "8db4778c655c5d85887d7bd8f68c4e6f9edcb57fe78941bc33582f9a1bd89efe"
  },
  {
    "microtopicId": "search:search.purchase_cost",
    "domainId": "search",
    "intentId": "search.purchase_cost",
    "sourceNodeId": "knowledge.search.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "a337adae1c7f1ffaa101b02e0d42f434546efb340375b6d5f847b499830aed03"
  },
  {
    "microtopicId": "search:search.earning_credit",
    "domainId": "search",
    "intentId": "search.earning_credit",
    "sourceNodeId": "knowledge.search.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "7916ec8cfb8636c5d98829bf3b5761f50d7c3136a0cdeb638795ead662f5c039"
  },
  {
    "microtopicId": "search:search.gift_transfer_sale",
    "domainId": "search",
    "intentId": "search.gift_transfer_sale",
    "sourceNodeId": "knowledge.search.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "6f8575592ad7a63c78d84d9f7e2f6efa0d395b03df9c8c779b15f7de4a36b775"
  },
  {
    "microtopicId": "search:search.developers_mission",
    "domainId": "search",
    "intentId": "search.developers_mission",
    "sourceNodeId": "knowledge.search.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "f8b1ddb0cdc4776848a6d89c25ac8b087a20e0ea53eba82316346075f95c228a"
  },
  {
    "microtopicId": "search:search.roadmap",
    "domainId": "search",
    "intentId": "search.roadmap",
    "sourceNodeId": "knowledge.search.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "6ab6df8e1eab8562344260c1141c19b1247e3f4cc1cf307f3e56c61c6287c3eb"
  },
  {
    "microtopicId": "search:search.action",
    "domainId": "search",
    "intentId": "search.action",
    "sourceNodeId": "knowledge.search.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "7bd1cc573e7b64fe278fda5d4c48f8732554fd4d0ee943500e9930054443d886"
  },
  {
    "microtopicId": "search:search.capability",
    "domainId": "search",
    "intentId": "search.capability",
    "sourceNodeId": "knowledge.search.capability.checks-index-freshness",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "9ad892d0c7136bc6e6d6ede658fb74963e65b0d89aad6e5e6e6b08fd900ecb87"
  },
  {
    "microtopicId": "search:search.source_evidence",
    "domainId": "search",
    "intentId": "search.source_evidence",
    "sourceNodeId": "knowledge.search.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "d663a568a6e3efa10b5473a36122502d3a8adc3e6831c2006fd3c31eab2fbd6c"
  },
  {
    "microtopicId": "search:search.realization",
    "domainId": "search",
    "intentId": "search.realization",
    "sourceNodeId": "knowledge.search.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
    ],
    "availability": "available",
    "contentHash": "55e46b04d1fc9734de77f3979ef61a6006bfc462d2f3b81f932344011082058a"
  },
  {
    "microtopicId": "geodetect:geodetect.overview",
    "domainId": "geodetect",
    "intentId": "geodetect.overview",
    "sourceNodeId": "knowledge.geodetect.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "d0460885e38aada1073a1831bda8a85e31dc1127f18b4e8795437a983e336657"
  },
  {
    "microtopicId": "geodetect:geodetect.purpose",
    "domainId": "geodetect",
    "intentId": "geodetect.purpose",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "cb8dfe7017bec016f0995bb7144cd7ba2dcd0b365ca21a5ac85a510153f8596e"
  },
  {
    "microtopicId": "geodetect:geodetect.user_value",
    "domainId": "geodetect",
    "intentId": "geodetect.user_value",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "9863bb965ad01e16ae2ce9058ae50fc8a098cbb27a370a7ca8a26aa3d5f7416b"
  },
  {
    "microtopicId": "geodetect:geodetect.open",
    "domainId": "geodetect",
    "intentId": "geodetect.open",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "9fd4bb4b09f5c9c10ec59cb4a9dd55c759d0e9f7288e9da126c39b974275daaa"
  },
  {
    "microtopicId": "geodetect:geodetect.start",
    "domainId": "geodetect",
    "intentId": "geodetect.start",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "69c8afd0d6b82c1e996ed7d2378955353891712425bba796fd449479997d62a2"
  },
  {
    "microtopicId": "geodetect:geodetect.how_to",
    "domainId": "geodetect",
    "intentId": "geodetect.how_to",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "571ad0d663b75ee0a309443b38f968f44bf3223ef6360121b913e0fb4343393a"
  },
  {
    "microtopicId": "geodetect:geodetect.availability",
    "domainId": "geodetect",
    "intentId": "geodetect.availability",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "407acf16da67dc51d2fe9ee7d0bc9499b74ba33766c2cf3b56417711ee764932"
  },
  {
    "microtopicId": "geodetect:geodetect.limitations",
    "domainId": "geodetect",
    "intentId": "geodetect.limitations",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "a6efb24a94cd94c9009f4d19caaae888d305940b668a57389d19a0d07753beaf"
  },
  {
    "microtopicId": "geodetect:geodetect.prerequisites",
    "domainId": "geodetect",
    "intentId": "geodetect.prerequisites",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "9e12b66ad4ceca6fd32c1556019a3efb626eed114c5983711e8d1f981eebb585"
  },
  {
    "microtopicId": "geodetect:geodetect.safety",
    "domainId": "geodetect",
    "intentId": "geodetect.safety",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "f97351fe2f924d4a94125c53574bc6ef9c2cb30e1705d407ffa7dbdaae8ac0cf"
  },
  {
    "microtopicId": "geodetect:geodetect.privacy",
    "domainId": "geodetect",
    "intentId": "geodetect.privacy",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "563afb2af47b5ff5c6311f5374c4b0f8c02ff66d47ab0c1a3a649463222f8298"
  },
  {
    "microtopicId": "geodetect:geodetect.self_status",
    "domainId": "geodetect",
    "intentId": "geodetect.self_status",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "d3034cce2ee5ac4d6a18482638fdb64b239b82c89357584e9d4a5b3f12216260"
  },
  {
    "microtopicId": "geodetect:geodetect.incident",
    "domainId": "geodetect",
    "intentId": "geodetect.incident",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "8a47731b6a4856610a145a3265197353c860d68123cf91660786ee688f5ae402"
  },
  {
    "microtopicId": "geodetect:geodetect.purchase_cost",
    "domainId": "geodetect",
    "intentId": "geodetect.purchase_cost",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "900ee9af5770e814267e71fb53a0557e4e58e380bf7f855296bef459e5cf34d6"
  },
  {
    "microtopicId": "geodetect:geodetect.earning_credit",
    "domainId": "geodetect",
    "intentId": "geodetect.earning_credit",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "6f5008c26100cd0d3529b42cddf30a6d1cd5b8e578ccf5e5c01dd0d6105ae4ea"
  },
  {
    "microtopicId": "geodetect:geodetect.gift_transfer_sale",
    "domainId": "geodetect",
    "intentId": "geodetect.gift_transfer_sale",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "3eb1fb9586fec3a1fe4f9d55033a27d0ac03eb9a7e3a8f410ce6801cef03396c"
  },
  {
    "microtopicId": "geodetect:geodetect.developers_mission",
    "domainId": "geodetect",
    "intentId": "geodetect.developers_mission",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "080cac177a3f1318bdfa2e1164671183fd4603456d77455c37b49bee92c377e8"
  },
  {
    "microtopicId": "geodetect:geodetect.roadmap",
    "domainId": "geodetect",
    "intentId": "geodetect.roadmap",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "8a1ba6098b0c9f737629c797beba1a9f230c9e3803c4be6a995c4b422be246a4"
  },
  {
    "microtopicId": "geodetect:geodetect.action",
    "domainId": "geodetect",
    "intentId": "geodetect.action",
    "sourceNodeId": "knowledge.geodetect.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "38faa8fe0d09821cefa42de3d869b8fd72d2f79ebed3005af3033d0065f9cf65"
  },
  {
    "microtopicId": "geodetect:geodetect.capability",
    "domainId": "geodetect",
    "intentId": "geodetect.capability",
    "sourceNodeId": "knowledge.geodetect.capability.uses-consented-geo-state",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "fd128fc4597397155e1da202372b896111874dfe1781b647742dc4add1edc52d"
  },
  {
    "microtopicId": "geodetect:geodetect.source_evidence",
    "domainId": "geodetect",
    "intentId": "geodetect.source_evidence",
    "sourceNodeId": "knowledge.geodetect.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "cacb056ae289d5a070dbd4ac5560ca97cb9666e3811e00f714f28f8610a91647"
  },
  {
    "microtopicId": "geodetect:geodetect.realization",
    "domainId": "geodetect",
    "intentId": "geodetect.realization",
    "sourceNodeId": "knowledge.geodetect.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
    ],
    "availability": "available",
    "contentHash": "0f7926e3c8f1d7e49fbfa89c5685c37c9feb5ea84901d2f5dd3612591391e4b8"
  },
  {
    "microtopicId": "media:media.overview",
    "domainId": "media",
    "intentId": "media.overview",
    "sourceNodeId": "knowledge.media.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "e35655f4a50b9fd79c39abd84b880dc2d18158630584318c3da77187902322ac"
  },
  {
    "microtopicId": "media:media.purpose",
    "domainId": "media",
    "intentId": "media.purpose",
    "sourceNodeId": "knowledge.media.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "a5925af0b8cc59a1bbd94e9a4d8e1705783fc7e92f6a35c0a80048da52ae4387"
  },
  {
    "microtopicId": "media:media.user_value",
    "domainId": "media",
    "intentId": "media.user_value",
    "sourceNodeId": "knowledge.media.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "1f22c945e47b60358018b825b05d17fe7a95a8aa9042ac75328bfdb574bf8498"
  },
  {
    "microtopicId": "media:media.open",
    "domainId": "media",
    "intentId": "media.open",
    "sourceNodeId": "knowledge.media.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "b76cb948676c0ec2e52f4c64fe81f0d550eb06b85d7b77c73238ed2f66e14696"
  },
  {
    "microtopicId": "media:media.start",
    "domainId": "media",
    "intentId": "media.start",
    "sourceNodeId": "knowledge.media.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "6f15604c7ad91e4c85c016e8e8078f180d455395b115eade46a18d98ace2544b"
  },
  {
    "microtopicId": "media:media.how_to",
    "domainId": "media",
    "intentId": "media.how_to",
    "sourceNodeId": "knowledge.media.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "7811fd2f787ef8fa79ad48280f0ffd05a17af5f6b7787b69ff90c2520008a090"
  },
  {
    "microtopicId": "media:media.availability",
    "domainId": "media",
    "intentId": "media.availability",
    "sourceNodeId": "knowledge.media.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "9697edec00632c6e2f544eac437ea5e6a8a56ac7f356ed380df4145f24428e8b"
  },
  {
    "microtopicId": "media:media.limitations",
    "domainId": "media",
    "intentId": "media.limitations",
    "sourceNodeId": "knowledge.media.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "80e350f664a54a0a3024d899812d2d08b5c9c75c3dfdfb797557db982697ce85"
  },
  {
    "microtopicId": "media:media.prerequisites",
    "domainId": "media",
    "intentId": "media.prerequisites",
    "sourceNodeId": "knowledge.media.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "fc515cbcdd87307e6df8dbf0abd1d4d112a6b1aed90252ba5448db67e23218cb"
  },
  {
    "microtopicId": "media:media.safety",
    "domainId": "media",
    "intentId": "media.safety",
    "sourceNodeId": "knowledge.media.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "0cdbb593ec7a294f3c6a386d073e18bb1cd523ca3217acf83d59c5a9440de51e"
  },
  {
    "microtopicId": "media:media.privacy",
    "domainId": "media",
    "intentId": "media.privacy",
    "sourceNodeId": "knowledge.media.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "a92250cf16f0f11d0e5e81c19ad34bef30a1dbfa7aa5618d421eee1871cd8b35"
  },
  {
    "microtopicId": "media:media.self_status",
    "domainId": "media",
    "intentId": "media.self_status",
    "sourceNodeId": "knowledge.media.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "0fd9ac279b91cef3ed5a354d51821bfa0ee804713040fd1e569b4de58b29ccca"
  },
  {
    "microtopicId": "media:media.incident",
    "domainId": "media",
    "intentId": "media.incident",
    "sourceNodeId": "knowledge.media.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "c4750b7f1384f4f2e0be0ab9172d2330802f1b2d09efb30e41ce529a60f9ef81"
  },
  {
    "microtopicId": "media:media.purchase_cost",
    "domainId": "media",
    "intentId": "media.purchase_cost",
    "sourceNodeId": "knowledge.media.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "18fa1a8591f0f4f64d2ad47fed2bf5ccf7c09ca608559dd07fc69d7ca91c0ffc"
  },
  {
    "microtopicId": "media:media.earning_credit",
    "domainId": "media",
    "intentId": "media.earning_credit",
    "sourceNodeId": "knowledge.media.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "5ad49f8075d17866c7b30c66ac5b4003908fc06b5779a13f17dcb656e8bb72c8"
  },
  {
    "microtopicId": "media:media.gift_transfer_sale",
    "domainId": "media",
    "intentId": "media.gift_transfer_sale",
    "sourceNodeId": "knowledge.media.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "ac52e2df4d1442115fe5f1b4a2253f3e625678485a0dd52038453187a33c669a"
  },
  {
    "microtopicId": "media:media.developers_mission",
    "domainId": "media",
    "intentId": "media.developers_mission",
    "sourceNodeId": "knowledge.media.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "d0c05e46fe700d9cc368b2e2e5af3dfafe51663e0346e8f5dbf3823dd39bb02a"
  },
  {
    "microtopicId": "media:media.roadmap",
    "domainId": "media",
    "intentId": "media.roadmap",
    "sourceNodeId": "knowledge.media.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "30741c38601e6d3e6d4472164f7585d7190928e350b259d70a9cf906e610aae7"
  },
  {
    "microtopicId": "media:media.action",
    "domainId": "media",
    "intentId": "media.action",
    "sourceNodeId": "knowledge.media.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "683d832fd202d197e0e4d1847c1a8dea388253916ee1f7374c4d9f3f3a4f4410"
  },
  {
    "microtopicId": "media:media.capability",
    "domainId": "media",
    "intentId": "media.capability",
    "sourceNodeId": "knowledge.media.capability.checks-upload-and-processing-stages",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "f4a21faed77e4057dd177da4dd800aec43a6945fd1c1595e0d62420068fc028f"
  },
  {
    "microtopicId": "media:media.source_evidence",
    "domainId": "media",
    "intentId": "media.source_evidence",
    "sourceNodeId": "knowledge.media.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "a9d9fbe1e3d7dc6daa183e7cc26bae323764ae0c52d448e1db097b26a1bab075"
  },
  {
    "microtopicId": "media:media.realization",
    "domainId": "media",
    "intentId": "media.realization",
    "sourceNodeId": "knowledge.media.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
    ],
    "availability": "available",
    "contentHash": "802ab07fcd40c3b6bfbb8724d0d03884030eb48dc3b09bb8dec27fc4622228b5"
  },
  {
    "microtopicId": "moderation:moderation.overview",
    "domainId": "moderation",
    "intentId": "moderation.overview",
    "sourceNodeId": "knowledge.moderation.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "1e7f5cee738da6b8dcca62296dda716a4e8ffa433b8dc6e39fd5e08c4948330e"
  },
  {
    "microtopicId": "moderation:moderation.purpose",
    "domainId": "moderation",
    "intentId": "moderation.purpose",
    "sourceNodeId": "knowledge.moderation.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "0fbbcf0eb40abd93b21e1d80208d546d53d7c36001103067f7b330405dfff19f"
  },
  {
    "microtopicId": "moderation:moderation.user_value",
    "domainId": "moderation",
    "intentId": "moderation.user_value",
    "sourceNodeId": "knowledge.moderation.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "cad058a0296df023c8ea52f51ec15927ec4a5d4d1ecb1195bddd4928e5d2c0fa"
  },
  {
    "microtopicId": "moderation:moderation.open",
    "domainId": "moderation",
    "intentId": "moderation.open",
    "sourceNodeId": "knowledge.moderation.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "1e429a941e067b45b4e98a8fc5b87c485cf421171e02600f677b868b5c937f38"
  },
  {
    "microtopicId": "moderation:moderation.start",
    "domainId": "moderation",
    "intentId": "moderation.start",
    "sourceNodeId": "knowledge.moderation.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "c9a645eadd887bfcf11e8a8a6b9e02c7719194410d4db1608ea88cdefcf9abe4"
  },
  {
    "microtopicId": "moderation:moderation.how_to",
    "domainId": "moderation",
    "intentId": "moderation.how_to",
    "sourceNodeId": "knowledge.moderation.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "a9cc9af6fd1d928a268b91168162588f3dab67c50719373d35603972b115b0a3"
  },
  {
    "microtopicId": "moderation:moderation.availability",
    "domainId": "moderation",
    "intentId": "moderation.availability",
    "sourceNodeId": "knowledge.moderation.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "d96c0c5558988acac00cccc42a2ccae6f9786a8e6ede0aba408090f39bf3a32a"
  },
  {
    "microtopicId": "moderation:moderation.limitations",
    "domainId": "moderation",
    "intentId": "moderation.limitations",
    "sourceNodeId": "knowledge.moderation.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "d41564cbffb9329822a18b2ef73add8a0544508bc7ffafaeb2d6b254069d4e6b"
  },
  {
    "microtopicId": "moderation:moderation.prerequisites",
    "domainId": "moderation",
    "intentId": "moderation.prerequisites",
    "sourceNodeId": "knowledge.moderation.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "274d2c60242d459cb7f2bac51495fe3aac529e88d831e0a7978db65a0e8e1d0d"
  },
  {
    "microtopicId": "moderation:moderation.safety",
    "domainId": "moderation",
    "intentId": "moderation.safety",
    "sourceNodeId": "knowledge.moderation.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "d240c5445e221ca4795ab79f6db11057c40b1e551e4c1b5e6968cd5ca7b62604"
  },
  {
    "microtopicId": "moderation:moderation.privacy",
    "domainId": "moderation",
    "intentId": "moderation.privacy",
    "sourceNodeId": "knowledge.moderation.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "6d5c5c7388776e22c9194249caba0e33d8db0b8e8e5f90658918088861d0671e"
  },
  {
    "microtopicId": "moderation:moderation.self_status",
    "domainId": "moderation",
    "intentId": "moderation.self_status",
    "sourceNodeId": "knowledge.moderation.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "c321f427ad6860da483d25c4ec278f1ffb91f040a9fa8afd18389a1ce14721d0"
  },
  {
    "microtopicId": "moderation:moderation.incident",
    "domainId": "moderation",
    "intentId": "moderation.incident",
    "sourceNodeId": "knowledge.moderation.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "199eecf95e0af92c38b35da6e1729e9fb602eddb28ccd51bfd593575f9226b47"
  },
  {
    "microtopicId": "moderation:moderation.purchase_cost",
    "domainId": "moderation",
    "intentId": "moderation.purchase_cost",
    "sourceNodeId": "knowledge.moderation.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "1eda9fbad5a81015399a58423eee21c4e7c32876efdbb3a562a7836fb80d8905"
  },
  {
    "microtopicId": "moderation:moderation.earning_credit",
    "domainId": "moderation",
    "intentId": "moderation.earning_credit",
    "sourceNodeId": "knowledge.moderation.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "158db561909c8f4da878a2863bc7f0af52cf8292093392cdb7558b925b6bc031"
  },
  {
    "microtopicId": "moderation:moderation.gift_transfer_sale",
    "domainId": "moderation",
    "intentId": "moderation.gift_transfer_sale",
    "sourceNodeId": "knowledge.moderation.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "e937c00da86c9275af54a1386ca68ef11c25ba0d7a95e5e409aacf3436dc9ec7"
  },
  {
    "microtopicId": "moderation:moderation.developers_mission",
    "domainId": "moderation",
    "intentId": "moderation.developers_mission",
    "sourceNodeId": "knowledge.moderation.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "eda64eb2738c88ef168e2797cc9e1884379b2e6292f4a63988e6d7cd65fc9caa"
  },
  {
    "microtopicId": "moderation:moderation.roadmap",
    "domainId": "moderation",
    "intentId": "moderation.roadmap",
    "sourceNodeId": "knowledge.moderation.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "b05501c1c3f9c7bfaaa53e525a73d0e153379f6a3793dccb9c8c013a9ae9f065"
  },
  {
    "microtopicId": "moderation:moderation.action",
    "domainId": "moderation",
    "intentId": "moderation.action",
    "sourceNodeId": "knowledge.moderation.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "496a89140e2eacb6c8054c4b8adb410a1ab1a7fd707ebb887d85b0f112cc15cb"
  },
  {
    "microtopicId": "moderation:moderation.capability",
    "domainId": "moderation",
    "intentId": "moderation.capability",
    "sourceNodeId": "knowledge.moderation.capability.separates-reporter-privacy-from-admin-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "27706c56622d502d294c57aeeaa7d3c40f2e2f44e2bb6ef5455d1dde1c96092b"
  },
  {
    "microtopicId": "moderation:moderation.source_evidence",
    "domainId": "moderation",
    "intentId": "moderation.source_evidence",
    "sourceNodeId": "knowledge.moderation.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "b2b9e992ebfecc2433c3ca9009a5b3049b13e3efc9bc4721dc9f5ac2656d57c1"
  },
  {
    "microtopicId": "moderation:moderation.realization",
    "domainId": "moderation",
    "intentId": "moderation.realization",
    "sourceNodeId": "knowledge.moderation.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
    ],
    "availability": "available",
    "contentHash": "9e23f3622e8c68902bbff53dd444c5cb632322505a20edd29b170cc54faa5f96"
  },
  {
    "microtopicId": "metamarket:metamarket.overview",
    "domainId": "metamarket",
    "intentId": "metamarket.overview",
    "sourceNodeId": "knowledge.metamarket.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "d6f9941a1b0f91e75fb6c4a4421750668b834b78ed17b0d9cc65fbe1b9cd0431"
  },
  {
    "microtopicId": "metamarket:metamarket.purpose",
    "domainId": "metamarket",
    "intentId": "metamarket.purpose",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "895d21b0d0ed6c020b8f19a6dc48f7cc6dfe6f467f7211a51a3135c291955b33"
  },
  {
    "microtopicId": "metamarket:metamarket.user_value",
    "domainId": "metamarket",
    "intentId": "metamarket.user_value",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "70d2ed8faa92bc3eea2c312788b1019b798fcbe21f1160e5bc6da5bd87797b54"
  },
  {
    "microtopicId": "metamarket:metamarket.open",
    "domainId": "metamarket",
    "intentId": "metamarket.open",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "f8bdac3c8e76441dfe48296883700bd42fbf6dfea46ac1d55fac88e303499e71"
  },
  {
    "microtopicId": "metamarket:metamarket.start",
    "domainId": "metamarket",
    "intentId": "metamarket.start",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "3b413652913e8661e1e20335a8a8b968ef13fec45bdf106658b96fcf0903517a"
  },
  {
    "microtopicId": "metamarket:metamarket.how_to",
    "domainId": "metamarket",
    "intentId": "metamarket.how_to",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "4094f43d863107c83c13de3f4fea822ef22bd4cfc6458555139b7b391435d673"
  },
  {
    "microtopicId": "metamarket:metamarket.availability",
    "domainId": "metamarket",
    "intentId": "metamarket.availability",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "9075b6c195b9ebbbba984f67932484e37d06ae93b696e05c23032db9d05c2648"
  },
  {
    "microtopicId": "metamarket:metamarket.limitations",
    "domainId": "metamarket",
    "intentId": "metamarket.limitations",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "2aeeca671f0a201e4ac478d7139e4ffb70f450cfb51e0b038abaa5d1eb6e900e"
  },
  {
    "microtopicId": "metamarket:metamarket.prerequisites",
    "domainId": "metamarket",
    "intentId": "metamarket.prerequisites",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "a9cdd3913bf4eab0f2888f05329f7f75037c123352eaac49c91500ad14faf7d0"
  },
  {
    "microtopicId": "metamarket:metamarket.safety",
    "domainId": "metamarket",
    "intentId": "metamarket.safety",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "ebbcfb9a1df98772672e50259de49cef70fd6fb78f3156b1a6dd5a898f450e8e"
  },
  {
    "microtopicId": "metamarket:metamarket.privacy",
    "domainId": "metamarket",
    "intentId": "metamarket.privacy",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "aba9694f6e7be0bf4a145437c4a88b4f9418fe389edb91f23e6edf19ca29d532"
  },
  {
    "microtopicId": "metamarket:metamarket.self_status",
    "domainId": "metamarket",
    "intentId": "metamarket.self_status",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "eb688234afd41c36abe362430b9e248193102251802089357e4360877f486a23"
  },
  {
    "microtopicId": "metamarket:metamarket.incident",
    "domainId": "metamarket",
    "intentId": "metamarket.incident",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "67fd4bd0ead997e1949a582ed94d772f414dc946e232498ae0b66eaee67bbb9f"
  },
  {
    "microtopicId": "metamarket:metamarket.purchase_cost",
    "domainId": "metamarket",
    "intentId": "metamarket.purchase_cost",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "0b5f636a1573874ad7c42ff9a6433b8ef6421607bc6945576b7b5ce720356352"
  },
  {
    "microtopicId": "metamarket:metamarket.earning_credit",
    "domainId": "metamarket",
    "intentId": "metamarket.earning_credit",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "a2ef227665dbc6641194e7f6c5eb0d7913c374a0b03909ae6bccc49516e817dc"
  },
  {
    "microtopicId": "metamarket:metamarket.gift_transfer_sale",
    "domainId": "metamarket",
    "intentId": "metamarket.gift_transfer_sale",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "f59970876eea4b7ecc17175386ba1555a676fd7b6dcdc3f542787552ae2fe4a8"
  },
  {
    "microtopicId": "metamarket:metamarket.developers_mission",
    "domainId": "metamarket",
    "intentId": "metamarket.developers_mission",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "0eb7d3a1af9b956e57f9adf716d365f981a5b6586fc0bf2f7e16503ce30bb63c"
  },
  {
    "microtopicId": "metamarket:metamarket.roadmap",
    "domainId": "metamarket",
    "intentId": "metamarket.roadmap",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "a9dbf32019d027f28e889ae1105a3d02729f74089e08849a787926cc1d2ed146"
  },
  {
    "microtopicId": "metamarket:metamarket.action",
    "domainId": "metamarket",
    "intentId": "metamarket.action",
    "sourceNodeId": "knowledge.metamarket.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "5774a09e65ab55d79fa6af323f1b4a84aaf9cc15833c4e5b2d85ab8d41d68fa4"
  },
  {
    "microtopicId": "metamarket:metamarket.capability",
    "domainId": "metamarket",
    "intentId": "metamarket.capability",
    "sourceNodeId": "knowledge.metamarket.capability.checks-item-ownership-and-transfer-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "e55fe529dfbc5d7d29a770983fb242d68f0d817b201674f5b5e336a5f8cd7b7f"
  },
  {
    "microtopicId": "metamarket:metamarket.source_evidence",
    "domainId": "metamarket",
    "intentId": "metamarket.source_evidence",
    "sourceNodeId": "knowledge.metamarket.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "685566ae66fe45bfdd0110ef303f95ee713321f9b325e4d8f03fa209af5ace94"
  },
  {
    "microtopicId": "metamarket:metamarket.realization",
    "domainId": "metamarket",
    "intentId": "metamarket.realization",
    "sourceNodeId": "knowledge.metamarket.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
    ],
    "availability": "available",
    "contentHash": "80aa35b2ed2d31b7f7c168b37c4eacbe3f87ce35783c5472cc9dbabdbf72c281"
  },
  {
    "microtopicId": "quantum_family:quantum_family.overview",
    "domainId": "quantum_family",
    "intentId": "quantum_family.overview",
    "sourceNodeId": "knowledge.quantum_family.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "e4732deebf82756f36e0fef4ad735a35d3e960d69c5923b0be2dcc05b860f883"
  },
  {
    "microtopicId": "quantum_family:quantum_family.purpose",
    "domainId": "quantum_family",
    "intentId": "quantum_family.purpose",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "43b7cd79327f8a584d8d51d2785bc80102e7596b80536dcb37f11fa716b754d6"
  },
  {
    "microtopicId": "quantum_family:quantum_family.user_value",
    "domainId": "quantum_family",
    "intentId": "quantum_family.user_value",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "416f840c88776c59fff69d8dac27f2ee7a2d9502dbc7999205ea16f41409c560"
  },
  {
    "microtopicId": "quantum_family:quantum_family.open",
    "domainId": "quantum_family",
    "intentId": "quantum_family.open",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "7e4929c9cf33896c17d1f0a3d7eabcc6b4f850f1a3753599aaa5c27cc9024fc6"
  },
  {
    "microtopicId": "quantum_family:quantum_family.start",
    "domainId": "quantum_family",
    "intentId": "quantum_family.start",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "52f584d640fc10b9c32c34ac4112faca13f5a8f7380f819932eee5954352c244"
  },
  {
    "microtopicId": "quantum_family:quantum_family.how_to",
    "domainId": "quantum_family",
    "intentId": "quantum_family.how_to",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "a6e6f5b35c17537a6516ff30ba0cd38fcfb833caff34a657007013fb6951a2aa"
  },
  {
    "microtopicId": "quantum_family:quantum_family.availability",
    "domainId": "quantum_family",
    "intentId": "quantum_family.availability",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "7a40a2f1b043bfd577a1957c6a51b6164917a376e2a37ceda2fb2eab7a6d0f1b"
  },
  {
    "microtopicId": "quantum_family:quantum_family.limitations",
    "domainId": "quantum_family",
    "intentId": "quantum_family.limitations",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "68ece87b09280d3eadae7ce2275cab46e19c4092f011c81cc261c51c6d83c432"
  },
  {
    "microtopicId": "quantum_family:quantum_family.prerequisites",
    "domainId": "quantum_family",
    "intentId": "quantum_family.prerequisites",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "10b94ac2c0571379f6d084db30f762d5f5caa75e8867389910f655d6c307f4e9"
  },
  {
    "microtopicId": "quantum_family:quantum_family.safety",
    "domainId": "quantum_family",
    "intentId": "quantum_family.safety",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "33cc92a26b82399567abba4893830a29c985eadb277a2495e546b1f93386729d"
  },
  {
    "microtopicId": "quantum_family:quantum_family.privacy",
    "domainId": "quantum_family",
    "intentId": "quantum_family.privacy",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "46e605eea7e8ebeb2558eb7626d0f846ae4633d3f2fd7d3b913537534bc6b6cd"
  },
  {
    "microtopicId": "quantum_family:quantum_family.self_status",
    "domainId": "quantum_family",
    "intentId": "quantum_family.self_status",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "e47c0a0e6dd3be0ddf593ee387a525b79a38ae3e1fc7442ca5dcf1edb1be1085"
  },
  {
    "microtopicId": "quantum_family:quantum_family.incident",
    "domainId": "quantum_family",
    "intentId": "quantum_family.incident",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "df128f3f999020a5597e15b24e6823832bb11409784578fbba49dde736d44d9f"
  },
  {
    "microtopicId": "quantum_family:quantum_family.purchase_cost",
    "domainId": "quantum_family",
    "intentId": "quantum_family.purchase_cost",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "7becb1668b3c682d18a44137d82aa284d721618c21a009836ef31249c070b484"
  },
  {
    "microtopicId": "quantum_family:quantum_family.earning_credit",
    "domainId": "quantum_family",
    "intentId": "quantum_family.earning_credit",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "9b2dc249c1d30ceda9245e6f8d0cf2cb8375381f66563da092094297893650b9"
  },
  {
    "microtopicId": "quantum_family:quantum_family.gift_transfer_sale",
    "domainId": "quantum_family",
    "intentId": "quantum_family.gift_transfer_sale",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "64259e255de436291d082c8d7513ccddb815a84e5f5352ee760945784e9a05cf"
  },
  {
    "microtopicId": "quantum_family:quantum_family.developers_mission",
    "domainId": "quantum_family",
    "intentId": "quantum_family.developers_mission",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "f61a0852f09066cae0619298fdd21917766503cd185b3086fe0c3d30ee7a9a7b"
  },
  {
    "microtopicId": "quantum_family:quantum_family.roadmap",
    "domainId": "quantum_family",
    "intentId": "quantum_family.roadmap",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "e96d5889a696d05b5c936712af7fab9f15a7ea9abe60f57ca93bfbe2127547ff"
  },
  {
    "microtopicId": "quantum_family:quantum_family.action",
    "domainId": "quantum_family",
    "intentId": "quantum_family.action",
    "sourceNodeId": "knowledge.quantum_family.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "2f5541bb724843c86fa8e25b087ef406040bce5e133a0db74778a98cc1596b6b"
  },
  {
    "microtopicId": "quantum_family:quantum_family.capability",
    "domainId": "quantum_family",
    "intentId": "quantum_family.capability",
    "sourceNodeId": "knowledge.quantum_family.capability.checks-relationship-graph",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "0491b6361fa612e73758ac43444d33544703f42c69550ea80035e4a8abc6262c"
  },
  {
    "microtopicId": "quantum_family:quantum_family.source_evidence",
    "domainId": "quantum_family",
    "intentId": "quantum_family.source_evidence",
    "sourceNodeId": "knowledge.quantum_family.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "a65ba2f52219c38f1b27bf949e7aee69d2a100f9d820f676e4df82814254b404"
  },
  {
    "microtopicId": "quantum_family:quantum_family.realization",
    "domainId": "quantum_family",
    "intentId": "quantum_family.realization",
    "sourceNodeId": "knowledge.quantum_family.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
    ],
    "availability": "available",
    "contentHash": "80197d3ccc30f543715a1bdc37b859c5570f1ef9d7f9b0835b57077641e29dd7"
  },
  {
    "microtopicId": "profile:profile.overview",
    "domainId": "profile",
    "intentId": "profile.overview",
    "sourceNodeId": "knowledge.profile.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "508c4566d203e4161696c95b9d30711a56b998130a7783ae8a81a51537435ff5"
  },
  {
    "microtopicId": "profile:profile.purpose",
    "domainId": "profile",
    "intentId": "profile.purpose",
    "sourceNodeId": "knowledge.profile.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "cf1f86057d6be39aebef06e3920863d7069626a96426c3bad43a15cd88adb98a"
  },
  {
    "microtopicId": "profile:profile.user_value",
    "domainId": "profile",
    "intentId": "profile.user_value",
    "sourceNodeId": "knowledge.profile.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "8504b7f94cb75a8ea4772b430228b4c0772842c4640785831f5920286f5d4600"
  },
  {
    "microtopicId": "profile:profile.open",
    "domainId": "profile",
    "intentId": "profile.open",
    "sourceNodeId": "knowledge.profile.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "0c3f43b77711063ffcc5ba7d5bc591de4849ea146e2939af156b3680262f7d44"
  },
  {
    "microtopicId": "profile:profile.start",
    "domainId": "profile",
    "intentId": "profile.start",
    "sourceNodeId": "knowledge.profile.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "105adb738fcd3ef1713e43d9eda83284cc8613865cfed95b08649f4ad29470be"
  },
  {
    "microtopicId": "profile:profile.how_to",
    "domainId": "profile",
    "intentId": "profile.how_to",
    "sourceNodeId": "knowledge.profile.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "2ee7dac65d39de1238b148b1a55dbd4c562b0817b83065fd21fc34e61a502ec0"
  },
  {
    "microtopicId": "profile:profile.availability",
    "domainId": "profile",
    "intentId": "profile.availability",
    "sourceNodeId": "knowledge.profile.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "8bbf6beef1b53a4cc24356d375fd7c99d1d9ce1d21e83ac6f57622b29976875a"
  },
  {
    "microtopicId": "profile:profile.limitations",
    "domainId": "profile",
    "intentId": "profile.limitations",
    "sourceNodeId": "knowledge.profile.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "2b4eb724a936f5a6b71533d8b0cf077c58ad657fc561fb175a63a159ce7a2248"
  },
  {
    "microtopicId": "profile:profile.prerequisites",
    "domainId": "profile",
    "intentId": "profile.prerequisites",
    "sourceNodeId": "knowledge.profile.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "534090a391e6d4048a8f052554cd79716218be4064005f675b9bff5a23e9d976"
  },
  {
    "microtopicId": "profile:profile.safety",
    "domainId": "profile",
    "intentId": "profile.safety",
    "sourceNodeId": "knowledge.profile.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "42a05e70cf45d3b5d0c7096b2b3fe5f99a5ecd68402382b34eb32e0f52ef5d0b"
  },
  {
    "microtopicId": "profile:profile.privacy",
    "domainId": "profile",
    "intentId": "profile.privacy",
    "sourceNodeId": "knowledge.profile.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "9025f3a7f0966496d4dca2b43863fc17b5c48d2694a33975b881775b563fbb87"
  },
  {
    "microtopicId": "profile:profile.self_status",
    "domainId": "profile",
    "intentId": "profile.self_status",
    "sourceNodeId": "knowledge.profile.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "37bac6bec21285b917a06c3c5909e25554ada2649305b0e8f2190b3a3b4cd8ca"
  },
  {
    "microtopicId": "profile:profile.incident",
    "domainId": "profile",
    "intentId": "profile.incident",
    "sourceNodeId": "knowledge.profile.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "aea183ce2f8ab988dc4dbb6cd61a5744ab8aed8c420208ee291d61a3e2818e66"
  },
  {
    "microtopicId": "profile:profile.purchase_cost",
    "domainId": "profile",
    "intentId": "profile.purchase_cost",
    "sourceNodeId": "knowledge.profile.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "2ee1e6a63b93bd5c619553103f0d82302714358bcdd9b8acec8f11617878117d"
  },
  {
    "microtopicId": "profile:profile.earning_credit",
    "domainId": "profile",
    "intentId": "profile.earning_credit",
    "sourceNodeId": "knowledge.profile.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "07a92f052626a074fcc57e07c833d260acb3d47673f07b2ff7d00d17decd7962"
  },
  {
    "microtopicId": "profile:profile.gift_transfer_sale",
    "domainId": "profile",
    "intentId": "profile.gift_transfer_sale",
    "sourceNodeId": "knowledge.profile.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "93664457d690e8650f5f17e4fc77685e41966c3ef6215231842c2241986f4b63"
  },
  {
    "microtopicId": "profile:profile.developers_mission",
    "domainId": "profile",
    "intentId": "profile.developers_mission",
    "sourceNodeId": "knowledge.profile.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "9de951f9f3f904608e33591cb007767d408a8ff80ef723d0ea0e933b2d39073d"
  },
  {
    "microtopicId": "profile:profile.roadmap",
    "domainId": "profile",
    "intentId": "profile.roadmap",
    "sourceNodeId": "knowledge.profile.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "61b4ff0365451eab99711b1fa604eb42d1820b8501f53aef3ca172e917957bcc"
  },
  {
    "microtopicId": "profile:profile.action",
    "domainId": "profile",
    "intentId": "profile.action",
    "sourceNodeId": "knowledge.profile.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "508f1e20356307829dfb28147204a9b34cacb82966e43d5e48f2c14f1cf1988f"
  },
  {
    "microtopicId": "profile:profile.capability",
    "domainId": "profile",
    "intentId": "profile.capability",
    "sourceNodeId": "knowledge.profile.capability.checks-profile-projection",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "40c5f1f6253b95b7111c3ce0a7607661254cdcf32c1af23524ce8b9bc88c4964"
  },
  {
    "microtopicId": "profile:profile.source_evidence",
    "domainId": "profile",
    "intentId": "profile.source_evidence",
    "sourceNodeId": "knowledge.profile.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "c87f7c182d3092ff2160799b297b7774300b1ab1a2af5f3f271089242195cf36"
  },
  {
    "microtopicId": "profile:profile.realization",
    "domainId": "profile",
    "intentId": "profile.realization",
    "sourceNodeId": "knowledge.profile.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
    ],
    "availability": "available",
    "contentHash": "44f0ebcb40204bbb75b64cd89a5136aa1aaf3285ef73442c479d9a460aa6b60b"
  },
  {
    "microtopicId": "auth:auth.overview",
    "domainId": "auth",
    "intentId": "auth.overview",
    "sourceNodeId": "knowledge.auth.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "19013688748b644666ed8ed9957d2548bfc14c0593395b2aa6ea8b66e3072de2"
  },
  {
    "microtopicId": "auth:auth.purpose",
    "domainId": "auth",
    "intentId": "auth.purpose",
    "sourceNodeId": "knowledge.auth.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "fe6a65c029c72a028ed0bdfa16e45025653016a9d9523f4bd01b70b7b0c0fa9d"
  },
  {
    "microtopicId": "auth:auth.user_value",
    "domainId": "auth",
    "intentId": "auth.user_value",
    "sourceNodeId": "knowledge.auth.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "c69e1ac7198f0e4d50e498c59bf0db85284c55a43f4d94d5ecc33ef146b25669"
  },
  {
    "microtopicId": "auth:auth.open",
    "domainId": "auth",
    "intentId": "auth.open",
    "sourceNodeId": "knowledge.auth.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "2b19ab49884d646d2f73985540fa7772539ab58f8761a6c4cea3f6c4b6092807"
  },
  {
    "microtopicId": "auth:auth.start",
    "domainId": "auth",
    "intentId": "auth.start",
    "sourceNodeId": "knowledge.auth.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "e7f33b63f77206d468762b004742ba08f624355c407aa5131b069d5150881f2b"
  },
  {
    "microtopicId": "auth:auth.how_to",
    "domainId": "auth",
    "intentId": "auth.how_to",
    "sourceNodeId": "knowledge.auth.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "409f47740afc9509be6752cf992145c0f480ba046e121ecc8fe032cffb4f6375"
  },
  {
    "microtopicId": "auth:auth.availability",
    "domainId": "auth",
    "intentId": "auth.availability",
    "sourceNodeId": "knowledge.auth.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "2840e14bf85de8330916d42fe0f0c70947068e190c2ac262d500707be938745d"
  },
  {
    "microtopicId": "auth:auth.limitations",
    "domainId": "auth",
    "intentId": "auth.limitations",
    "sourceNodeId": "knowledge.auth.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "be02d537af31915bdc31350d9edbe727ac5cba1b59e0d070341171e1a43c10bd"
  },
  {
    "microtopicId": "auth:auth.prerequisites",
    "domainId": "auth",
    "intentId": "auth.prerequisites",
    "sourceNodeId": "knowledge.auth.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "26a4e8d9fb99c7a7fe314e14d698fe441546217a8a87ebbd8a5083e8c2c4b3d4"
  },
  {
    "microtopicId": "auth:auth.safety",
    "domainId": "auth",
    "intentId": "auth.safety",
    "sourceNodeId": "knowledge.auth.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "b1eebccdaa024a770c8c5c77ed903e81f1a41c9ac0b3bdd206b2baec1762302a"
  },
  {
    "microtopicId": "auth:auth.privacy",
    "domainId": "auth",
    "intentId": "auth.privacy",
    "sourceNodeId": "knowledge.auth.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "7e0c3b9ce78e61e78aa0a9be754650361a2e6466accb926c7445985bdf1f5272"
  },
  {
    "microtopicId": "auth:auth.self_status",
    "domainId": "auth",
    "intentId": "auth.self_status",
    "sourceNodeId": "knowledge.auth.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "470373ff4bdc3dbd128b69999570722bc9cd5fd34866621ef94e4208c50e1b40"
  },
  {
    "microtopicId": "auth:auth.incident",
    "domainId": "auth",
    "intentId": "auth.incident",
    "sourceNodeId": "knowledge.auth.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "27cff4006c320cf2c3c378cfb58ec434621aab61413818db158b4f8781a94415"
  },
  {
    "microtopicId": "auth:auth.purchase_cost",
    "domainId": "auth",
    "intentId": "auth.purchase_cost",
    "sourceNodeId": "knowledge.auth.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "9e8ddf5b5f5c982f955a5fd2bbda5578351e192515853f1d3714d45d7484d158"
  },
  {
    "microtopicId": "auth:auth.earning_credit",
    "domainId": "auth",
    "intentId": "auth.earning_credit",
    "sourceNodeId": "knowledge.auth.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "58294f1a1f056cadf4a470f1681c2e2f0f307bd626f8ce74548638fd1d6aa96b"
  },
  {
    "microtopicId": "auth:auth.gift_transfer_sale",
    "domainId": "auth",
    "intentId": "auth.gift_transfer_sale",
    "sourceNodeId": "knowledge.auth.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "409585bcb6f6cf50be41af0b187fe7a2c19dfb60434bd9c3a2842f5e961f59a3"
  },
  {
    "microtopicId": "auth:auth.developers_mission",
    "domainId": "auth",
    "intentId": "auth.developers_mission",
    "sourceNodeId": "knowledge.auth.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "a1b2e48c3f27a4665690eeb7a6a34202478d903927f0110d06ba15d9b97eb8fe"
  },
  {
    "microtopicId": "auth:auth.roadmap",
    "domainId": "auth",
    "intentId": "auth.roadmap",
    "sourceNodeId": "knowledge.auth.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "74f4285f224dce0a7f77607663b91cb76a4c5810f3788e0e89f6743cfcc09d76"
  },
  {
    "microtopicId": "auth:auth.action",
    "domainId": "auth",
    "intentId": "auth.action",
    "sourceNodeId": "knowledge.auth.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "f49ed1b44cac030f34870a6bd67455375f1da32f0238a950de8f2d35c477b090"
  },
  {
    "microtopicId": "auth:auth.capability",
    "domainId": "auth",
    "intentId": "auth.capability",
    "sourceNodeId": "knowledge.auth.capability.checks-latest-valid-session",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "66c336ad81e82e1012dc180ab8b95d35d2dfda52a400e4da9f86a97a2090801f"
  },
  {
    "microtopicId": "auth:auth.source_evidence",
    "domainId": "auth",
    "intentId": "auth.source_evidence",
    "sourceNodeId": "knowledge.auth.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "b584c5689ed6b54b99cd4787ba231bd96e7cea7b071bf342ee0a0107547cd3ed"
  },
  {
    "microtopicId": "auth:auth.realization",
    "domainId": "auth",
    "intentId": "auth.realization",
    "sourceNodeId": "knowledge.auth.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
    ],
    "availability": "available",
    "contentHash": "3fd419ca321d3051479f06fe6d42b935036d9fcc74ef65f8f8f4e709d7a44ffd"
  },
  {
    "microtopicId": "wallet:wallet.overview",
    "domainId": "wallet",
    "intentId": "wallet.overview",
    "sourceNodeId": "knowledge.wallet.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "e1f2f602c92f959fa3aad15ee1b2f02d6ba1f0eba1dedd793de6d336b9fac74d"
  },
  {
    "microtopicId": "wallet:wallet.purpose",
    "domainId": "wallet",
    "intentId": "wallet.purpose",
    "sourceNodeId": "knowledge.wallet.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "a12d2424790caead36a3b947a2d1664e1ad9b0df8728f5581d8bc376b1654c83"
  },
  {
    "microtopicId": "wallet:wallet.user_value",
    "domainId": "wallet",
    "intentId": "wallet.user_value",
    "sourceNodeId": "knowledge.wallet.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "08ac8d1dfec772d21289a436cdd9f0a5e68acb78f1ce3533bedbb711165fc63d"
  },
  {
    "microtopicId": "wallet:wallet.open",
    "domainId": "wallet",
    "intentId": "wallet.open",
    "sourceNodeId": "knowledge.wallet.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "7d4f2eae0aecb145caeb1f7b331b28e23daf159e99e94be16846e6e85cb082d5"
  },
  {
    "microtopicId": "wallet:wallet.start",
    "domainId": "wallet",
    "intentId": "wallet.start",
    "sourceNodeId": "knowledge.wallet.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "e11e63ed74e69af2af9b358c55d6714ee9fa00b02e48a1dc3fcfd6d79cc5ab5c"
  },
  {
    "microtopicId": "wallet:wallet.how_to",
    "domainId": "wallet",
    "intentId": "wallet.how_to",
    "sourceNodeId": "knowledge.wallet.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "b403f1fc76c513e83dbd2d46a4010cd9f7011b4af95b492ee2732811273090b4"
  },
  {
    "microtopicId": "wallet:wallet.availability",
    "domainId": "wallet",
    "intentId": "wallet.availability",
    "sourceNodeId": "knowledge.wallet.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "c9d542d8aa1a685f17ed8c44b22cf327920e8b0cce680b61dbc0bfb3b79606e5"
  },
  {
    "microtopicId": "wallet:wallet.limitations",
    "domainId": "wallet",
    "intentId": "wallet.limitations",
    "sourceNodeId": "knowledge.wallet.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "3db329f259fe46a7834a2f80235d48dd3535b9516c7aa11868518d2ff24a0d1a"
  },
  {
    "microtopicId": "wallet:wallet.prerequisites",
    "domainId": "wallet",
    "intentId": "wallet.prerequisites",
    "sourceNodeId": "knowledge.wallet.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "b93fd408098244b1d38e717118f4c83fb9375e4d8a3ed86796a281bdace4f7eb"
  },
  {
    "microtopicId": "wallet:wallet.safety",
    "domainId": "wallet",
    "intentId": "wallet.safety",
    "sourceNodeId": "knowledge.wallet.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "1c72350145df2d8161ddb18376600d576c25a19cf0f6a2d29af70ccff597b17e"
  },
  {
    "microtopicId": "wallet:wallet.privacy",
    "domainId": "wallet",
    "intentId": "wallet.privacy",
    "sourceNodeId": "knowledge.wallet.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "82b54b038c209bd215c312c5d33769cb0a0382e57790900ee908732c81b4dcc9"
  },
  {
    "microtopicId": "wallet:wallet.self_status",
    "domainId": "wallet",
    "intentId": "wallet.self_status",
    "sourceNodeId": "knowledge.wallet.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "64adda78b56aa7a1f47cddb45f2a12e09ac6bbdbabd45eeccd14c28cfabd2c07"
  },
  {
    "microtopicId": "wallet:wallet.incident",
    "domainId": "wallet",
    "intentId": "wallet.incident",
    "sourceNodeId": "knowledge.wallet.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "932f14ce543edc8e84ac528352e7b249ec7e68a3920236cbe2d0308a230b1ea0"
  },
  {
    "microtopicId": "wallet:wallet.purchase_cost",
    "domainId": "wallet",
    "intentId": "wallet.purchase_cost",
    "sourceNodeId": "knowledge.wallet.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "f6218d434c5ef303147ed919c88cde4d228b162b23244e02babac6d88796e609"
  },
  {
    "microtopicId": "wallet:wallet.earning_credit",
    "domainId": "wallet",
    "intentId": "wallet.earning_credit",
    "sourceNodeId": "knowledge.wallet.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "b6c6ae9fbacae63a1f639c819aa599c39cabd5bc5234f40bdc5807a5c2bd20d4"
  },
  {
    "microtopicId": "wallet:wallet.gift_transfer_sale",
    "domainId": "wallet",
    "intentId": "wallet.gift_transfer_sale",
    "sourceNodeId": "knowledge.wallet.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "af0d35fb26dc669f00c9c06dbf15c9682bb5ebbc8a270a1602390a182fa5c7a5"
  },
  {
    "microtopicId": "wallet:wallet.developers_mission",
    "domainId": "wallet",
    "intentId": "wallet.developers_mission",
    "sourceNodeId": "knowledge.wallet.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "40b8977eebcb4446eba4670bdd5d6b444a93484afe44d952b3aed75c43faaa38"
  },
  {
    "microtopicId": "wallet:wallet.roadmap",
    "domainId": "wallet",
    "intentId": "wallet.roadmap",
    "sourceNodeId": "knowledge.wallet.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "2fd421c9698fa630f3becae274ce2260c5b2fa334dee92f86a17571aed3ef768"
  },
  {
    "microtopicId": "wallet:wallet.action",
    "domainId": "wallet",
    "intentId": "wallet.action",
    "sourceNodeId": "knowledge.wallet.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "674c8ad5115bc6a15d89aed7597f554214736494ed6a4e0c169592b786b0a338"
  },
  {
    "microtopicId": "wallet:wallet.capability",
    "domainId": "wallet",
    "intentId": "wallet.capability",
    "sourceNodeId": "knowledge.wallet.capability.resolves-wallet-aliases",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "45626b343c2fbad5cd9b80e7484fe81479c97a74b3940583b5637a9f12733f03"
  },
  {
    "microtopicId": "wallet:wallet.source_evidence",
    "domainId": "wallet",
    "intentId": "wallet.source_evidence",
    "sourceNodeId": "knowledge.wallet.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "95a9ae8f9cb06b805fe95057634b1ef2c8acdded4a73f9aa4ef9e162853e2568"
  },
  {
    "microtopicId": "wallet:wallet.realization",
    "domainId": "wallet",
    "intentId": "wallet.realization",
    "sourceNodeId": "knowledge.wallet.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "82bf5b3efc927998b5c0b24d85ee787f96772a6e49dd28e35d8dd515b34530e3"
  },
  {
    "microtopicId": "telegram:telegram.overview",
    "domainId": "telegram",
    "intentId": "telegram.overview",
    "sourceNodeId": "knowledge.telegram.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "60863e3456363aef15008541814e180bcb973d9551b5b614eb86bd753fa1220f"
  },
  {
    "microtopicId": "telegram:telegram.purpose",
    "domainId": "telegram",
    "intentId": "telegram.purpose",
    "sourceNodeId": "knowledge.telegram.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "bcb0aa685a20ff3841dba0657ca98176ebf774e779e2ff292a1852629aabd07a"
  },
  {
    "microtopicId": "telegram:telegram.user_value",
    "domainId": "telegram",
    "intentId": "telegram.user_value",
    "sourceNodeId": "knowledge.telegram.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "ff32df1d664fde81c29a59f0d7b5b61a5a95fe4c928876640da5614d6d8a62d0"
  },
  {
    "microtopicId": "telegram:telegram.open",
    "domainId": "telegram",
    "intentId": "telegram.open",
    "sourceNodeId": "knowledge.telegram.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "709e05f75ec93848da7a17d484f6e495130605c02ec883b4789e6da2e4b04482"
  },
  {
    "microtopicId": "telegram:telegram.start",
    "domainId": "telegram",
    "intentId": "telegram.start",
    "sourceNodeId": "knowledge.telegram.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "c08bec0ec3d58b71096e9f56a60bbabab8e95d8c6a8efdf85c4bc285eda2e641"
  },
  {
    "microtopicId": "telegram:telegram.how_to",
    "domainId": "telegram",
    "intentId": "telegram.how_to",
    "sourceNodeId": "knowledge.telegram.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "495d29a77e7ae866a317f0b07911cb2ffa6cadf18c01d47e1c2bb6f4ef3ff229"
  },
  {
    "microtopicId": "telegram:telegram.availability",
    "domainId": "telegram",
    "intentId": "telegram.availability",
    "sourceNodeId": "knowledge.telegram.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "f9f255f3be8c45fa60594d24628fe6159d36fe3b8e89f46838aebe169dd95e06"
  },
  {
    "microtopicId": "telegram:telegram.limitations",
    "domainId": "telegram",
    "intentId": "telegram.limitations",
    "sourceNodeId": "knowledge.telegram.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "ee85890cc59073e7923b9e738d2fcf280766178c10289c03b0c84b70302fe951"
  },
  {
    "microtopicId": "telegram:telegram.prerequisites",
    "domainId": "telegram",
    "intentId": "telegram.prerequisites",
    "sourceNodeId": "knowledge.telegram.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "8a3c6fc6852dff43c67399118a6934b4f5dc8ba0d4483ad8879798b367aad6e6"
  },
  {
    "microtopicId": "telegram:telegram.safety",
    "domainId": "telegram",
    "intentId": "telegram.safety",
    "sourceNodeId": "knowledge.telegram.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "0f9a93576fcbaf182b0d77057584ea85ef3234a70e64f1bbb4b1e50c3778d953"
  },
  {
    "microtopicId": "telegram:telegram.privacy",
    "domainId": "telegram",
    "intentId": "telegram.privacy",
    "sourceNodeId": "knowledge.telegram.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "581918a004194ae37cc8dff991efac779424d6a2363d9f215d19af81bddb8ee0"
  },
  {
    "microtopicId": "telegram:telegram.self_status",
    "domainId": "telegram",
    "intentId": "telegram.self_status",
    "sourceNodeId": "knowledge.telegram.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "6481f9f52cd8436f51530f3400c60b38865184c13f3073d90ea4fe522c000cf6"
  },
  {
    "microtopicId": "telegram:telegram.incident",
    "domainId": "telegram",
    "intentId": "telegram.incident",
    "sourceNodeId": "knowledge.telegram.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "be658c577a37cd8d236856dc9a1f2a890437423ef6e84729edaccdff5a006b1e"
  },
  {
    "microtopicId": "telegram:telegram.purchase_cost",
    "domainId": "telegram",
    "intentId": "telegram.purchase_cost",
    "sourceNodeId": "knowledge.telegram.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "ebce0ae89aeb8af9d3db50ca2570309dbe9dcd20364e74ef482521399476e6fb"
  },
  {
    "microtopicId": "telegram:telegram.earning_credit",
    "domainId": "telegram",
    "intentId": "telegram.earning_credit",
    "sourceNodeId": "knowledge.telegram.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "3fdbd7e971d2485573b81164d9439540f0015ec5ad455243678a18acbd55a47f"
  },
  {
    "microtopicId": "telegram:telegram.gift_transfer_sale",
    "domainId": "telegram",
    "intentId": "telegram.gift_transfer_sale",
    "sourceNodeId": "knowledge.telegram.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "cbe70d8d612a2b4a47db97325bf6ffb50b827d116ae4db4d60b5e7faf91103d0"
  },
  {
    "microtopicId": "telegram:telegram.developers_mission",
    "domainId": "telegram",
    "intentId": "telegram.developers_mission",
    "sourceNodeId": "knowledge.telegram.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "ed6d47f512b4d115ac1ec675ac94d68d9036663070e34b86881667669a31e8b5"
  },
  {
    "microtopicId": "telegram:telegram.roadmap",
    "domainId": "telegram",
    "intentId": "telegram.roadmap",
    "sourceNodeId": "knowledge.telegram.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "635770c42ceb1d5e49901c08e61307f2c481e4ec0cad5f3a6ec8a49a1bda9dd3"
  },
  {
    "microtopicId": "telegram:telegram.action",
    "domainId": "telegram",
    "intentId": "telegram.action",
    "sourceNodeId": "knowledge.telegram.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "8ba71bf24ecab50b054b8e5ce96220d62d1012cb187e9d6f0a492f18bfda4760"
  },
  {
    "microtopicId": "telegram:telegram.capability",
    "domainId": "telegram",
    "intentId": "telegram.capability",
    "sourceNodeId": "knowledge.telegram.capability.verifies-initdata-freshness",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "7b0f6b89e97eeb3801ad2cba3cdd0b9fb0d59d266de29eaed25cb9150bcbf677"
  },
  {
    "microtopicId": "telegram:telegram.source_evidence",
    "domainId": "telegram",
    "intentId": "telegram.source_evidence",
    "sourceNodeId": "knowledge.telegram.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "6801682633984b98a3bd08dc0b4fdccfcd1eb973fbe0e55ef543c20556ff7d61"
  },
  {
    "microtopicId": "telegram:telegram.realization",
    "domainId": "telegram",
    "intentId": "telegram.realization",
    "sourceNodeId": "knowledge.telegram.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
      "mongo-read:profile_aliases"
    ],
    "availability": "available",
    "contentHash": "488ee506bbc8d6f10a426d811661578730d402c72d8eecc1cc1015414c63a541"
  },
  {
    "microtopicId": "qcoin:qcoin.overview",
    "domainId": "qcoin",
    "intentId": "qcoin.overview",
    "sourceNodeId": "knowledge.qcoin.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "395c0e216dbdb9a0b85c888680eec01adadbf863ed33f48ea541cbd95293282b"
  },
  {
    "microtopicId": "qcoin:qcoin.purpose",
    "domainId": "qcoin",
    "intentId": "qcoin.purpose",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "0a574adb068af2391ac72d80f957c60a38336443566e2144f5b7c74690b5362c"
  },
  {
    "microtopicId": "qcoin:qcoin.user_value",
    "domainId": "qcoin",
    "intentId": "qcoin.user_value",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "955546972e17971d6a966c7881456b3d8f18897048b57def8033ff2e346ab6a5"
  },
  {
    "microtopicId": "qcoin:qcoin.open",
    "domainId": "qcoin",
    "intentId": "qcoin.open",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "52498bfb81ad054ef9f61be7f2e2e137ff37697f2e499ff030baf2ee29e35e08"
  },
  {
    "microtopicId": "qcoin:qcoin.start",
    "domainId": "qcoin",
    "intentId": "qcoin.start",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "04e51f680bdba15bae058dfa035203c89aa3f9cac775c2112ddd4b5230ab2f4f"
  },
  {
    "microtopicId": "qcoin:qcoin.how_to",
    "domainId": "qcoin",
    "intentId": "qcoin.how_to",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "306fd111a47507fdfc44c564026a475a3c0ac5ad67e77f9c3ac45f1604b03989"
  },
  {
    "microtopicId": "qcoin:qcoin.availability",
    "domainId": "qcoin",
    "intentId": "qcoin.availability",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "04a140d0c08f814dedbccd0f60586b4a13ad24c9fe982116099757268f39e2f5"
  },
  {
    "microtopicId": "qcoin:qcoin.limitations",
    "domainId": "qcoin",
    "intentId": "qcoin.limitations",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "4ab1260b2034d037f5a07e4264ac0b6d67b6ca96f4e8b78a5c41af504f28a761"
  },
  {
    "microtopicId": "qcoin:qcoin.prerequisites",
    "domainId": "qcoin",
    "intentId": "qcoin.prerequisites",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "bf3805c757ddc5022a3ac74f0085186627af4a9c7b2876be050b43e3e504976f"
  },
  {
    "microtopicId": "qcoin:qcoin.safety",
    "domainId": "qcoin",
    "intentId": "qcoin.safety",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "9b4c5fd4f15f3e0e44ad4dd14f9a074bc9d83a1f9f17812eb9764d1f6224ed06"
  },
  {
    "microtopicId": "qcoin:qcoin.privacy",
    "domainId": "qcoin",
    "intentId": "qcoin.privacy",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "55322980c0ead7cbddcf8765d2fc0dca4a63cad575ee2e0e24793a831b5458ff"
  },
  {
    "microtopicId": "qcoin:qcoin.self_status",
    "domainId": "qcoin",
    "intentId": "qcoin.self_status",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "387f4c135463f19ab31e5f26c8fbe768cc2c52d324763549a8443c09d72ca151"
  },
  {
    "microtopicId": "qcoin:qcoin.incident",
    "domainId": "qcoin",
    "intentId": "qcoin.incident",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "14cad545db7a63b1e4e5a5c2605929ea307997cbb1aaf4b001ab934af9dd3945"
  },
  {
    "microtopicId": "qcoin:qcoin.purchase_cost",
    "domainId": "qcoin",
    "intentId": "qcoin.purchase_cost",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "4e6a06173da21698dabe1c46d384844f7659f0ff34ee10cc3580f69eb2c5259e"
  },
  {
    "microtopicId": "qcoin:qcoin.earning_credit",
    "domainId": "qcoin",
    "intentId": "qcoin.earning_credit",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "1501bf8b673bcddbcf2f350dc58b2a2610641d2ab90f583219d09dbd489beb8d"
  },
  {
    "microtopicId": "qcoin:qcoin.gift_transfer_sale",
    "domainId": "qcoin",
    "intentId": "qcoin.gift_transfer_sale",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "e31e862eaecbc2803d5f24390be3fca30a1840453601c39a04b4b64052a5db1d"
  },
  {
    "microtopicId": "qcoin:qcoin.developers_mission",
    "domainId": "qcoin",
    "intentId": "qcoin.developers_mission",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "b24de92128131864887297006a579a5f6c92820b1441d87c260a33e2d0c7514f"
  },
  {
    "microtopicId": "qcoin:qcoin.roadmap",
    "domainId": "qcoin",
    "intentId": "qcoin.roadmap",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "4001c499429fdd73087abe91b2797e8aadbc80e4135acd704e783e8190d488df"
  },
  {
    "microtopicId": "qcoin:qcoin.action",
    "domainId": "qcoin",
    "intentId": "qcoin.action",
    "sourceNodeId": "knowledge.qcoin.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "3bc417f99043fe947a2cf3b70f1cb0c7c6969c0ae494609935e112344caf6c3e"
  },
  {
    "microtopicId": "qcoin:qcoin.capability",
    "domainId": "qcoin",
    "intentId": "qcoin.capability",
    "sourceNodeId": "knowledge.qcoin.capability.checks-invoice-to-webhook-to-ledger-chain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "b184bdf21cf25bb95ea202dd592fcf5055999e215247f519718da865f9601178"
  },
  {
    "microtopicId": "qcoin:qcoin.source_evidence",
    "domainId": "qcoin",
    "intentId": "qcoin.source_evidence",
    "sourceNodeId": "knowledge.qcoin.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "ccffcd29c950c0ec97c7ceb1d2ef8e6024aa0b2bdf6d6994f7253501833313a6"
  },
  {
    "microtopicId": "qcoin:qcoin.realization",
    "domainId": "qcoin",
    "intentId": "qcoin.realization",
    "sourceNodeId": "knowledge.qcoin.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
      "mongo-read:qcoin_accounts"
    ],
    "availability": "available",
    "contentHash": "085c3aea37c34309d85bd1a5be4203418e360bf1d3ae51095d665b849b05a24b"
  },
  {
    "microtopicId": "payments:payments.overview",
    "domainId": "payments",
    "intentId": "payments.overview",
    "sourceNodeId": "knowledge.payments.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "48155c304e992564464002343d6cf7ec58b40f4e14fa1889f524447be8eb1fbe"
  },
  {
    "microtopicId": "payments:payments.purpose",
    "domainId": "payments",
    "intentId": "payments.purpose",
    "sourceNodeId": "knowledge.payments.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "30a10719be9f8633b117f9691bfcd2f2efc031271cdfde07e052cea5c4e5a9b1"
  },
  {
    "microtopicId": "payments:payments.user_value",
    "domainId": "payments",
    "intentId": "payments.user_value",
    "sourceNodeId": "knowledge.payments.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "6f36b50cfa120ec9732d76155a6ae7792ed55fed07072ac3639d3118fec4d1d1"
  },
  {
    "microtopicId": "payments:payments.open",
    "domainId": "payments",
    "intentId": "payments.open",
    "sourceNodeId": "knowledge.payments.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "f078293f5e36fe8e158182aee80c636eaeb9c918782c1764ad1f1d5885c65181"
  },
  {
    "microtopicId": "payments:payments.start",
    "domainId": "payments",
    "intentId": "payments.start",
    "sourceNodeId": "knowledge.payments.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "2cff2ccf767157f40a634a2ccad0f307ec4a71547cfa4cba322ed91bc3402cf4"
  },
  {
    "microtopicId": "payments:payments.how_to",
    "domainId": "payments",
    "intentId": "payments.how_to",
    "sourceNodeId": "knowledge.payments.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "b136f79d84b87cbcbc0f5e42e1466bd06c666bd7b40bf287afa4b5c7fe1332a8"
  },
  {
    "microtopicId": "payments:payments.availability",
    "domainId": "payments",
    "intentId": "payments.availability",
    "sourceNodeId": "knowledge.payments.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "1268534b928e1c7af84418ed4b26f0fab7dabfd8b34a7d3b44b9c3d3eb069f93"
  },
  {
    "microtopicId": "payments:payments.limitations",
    "domainId": "payments",
    "intentId": "payments.limitations",
    "sourceNodeId": "knowledge.payments.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "8b1a712cbdf1f6849325888a3ff1c5ccdfa7dd9d2ce6f7ba2a6987b0a28e2ccd"
  },
  {
    "microtopicId": "payments:payments.prerequisites",
    "domainId": "payments",
    "intentId": "payments.prerequisites",
    "sourceNodeId": "knowledge.payments.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "af0e0d4e2b2249c3c193b5087bf0f8fd207cb7f0b12f42b58dc90b533f50a3aa"
  },
  {
    "microtopicId": "payments:payments.safety",
    "domainId": "payments",
    "intentId": "payments.safety",
    "sourceNodeId": "knowledge.payments.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "b94dd8b1c86d580a8ab8805a20c524dc81b125e99aa95aa4cab30121871507fe"
  },
  {
    "microtopicId": "payments:payments.privacy",
    "domainId": "payments",
    "intentId": "payments.privacy",
    "sourceNodeId": "knowledge.payments.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "88ec4d30de78a4d65ff1394aff5edc6d004d0b4e965b2c66baf68ca19183ecf4"
  },
  {
    "microtopicId": "payments:payments.self_status",
    "domainId": "payments",
    "intentId": "payments.self_status",
    "sourceNodeId": "knowledge.payments.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "fbef8a18ea17bdb7afa8239e0104f9af89f8381e0d420505965c536d391f8ff6"
  },
  {
    "microtopicId": "payments:payments.incident",
    "domainId": "payments",
    "intentId": "payments.incident",
    "sourceNodeId": "knowledge.payments.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "e5df07fc55479f2404bf8fd43b9e306741890f289bc329afb0fc72f4328498a1"
  },
  {
    "microtopicId": "payments:payments.purchase_cost",
    "domainId": "payments",
    "intentId": "payments.purchase_cost",
    "sourceNodeId": "knowledge.payments.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "6eb4d399128d1855a2cda8128e2d55717fcc2472b7869aa187b33d2a1662ef03"
  },
  {
    "microtopicId": "payments:payments.earning_credit",
    "domainId": "payments",
    "intentId": "payments.earning_credit",
    "sourceNodeId": "knowledge.payments.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "c3301a41597f2ea3eb0d188ee4bccabe5af3afa5f21c1ee7d34b7ec386e8412c"
  },
  {
    "microtopicId": "payments:payments.gift_transfer_sale",
    "domainId": "payments",
    "intentId": "payments.gift_transfer_sale",
    "sourceNodeId": "knowledge.payments.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "2fff56550e09b6db5b820c0ced00fdb050caa141beeb9974c45a9c58b84779e7"
  },
  {
    "microtopicId": "payments:payments.developers_mission",
    "domainId": "payments",
    "intentId": "payments.developers_mission",
    "sourceNodeId": "knowledge.payments.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "64fc847ada67b76641c8e98452389f9982f54197bbf98799da1394b68f30bf9e"
  },
  {
    "microtopicId": "payments:payments.roadmap",
    "domainId": "payments",
    "intentId": "payments.roadmap",
    "sourceNodeId": "knowledge.payments.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "74430dbf8fe25fbba21297b8460cd1bf51191a6be865f88d7f72ce0442a6e584"
  },
  {
    "microtopicId": "payments:payments.action",
    "domainId": "payments",
    "intentId": "payments.action",
    "sourceNodeId": "knowledge.payments.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "6549df548b4b8440e932fa042110780cb181fca32f0d9a4edfff4b92e773ee36"
  },
  {
    "microtopicId": "payments:payments.capability",
    "domainId": "payments",
    "intentId": "payments.capability",
    "sourceNodeId": "knowledge.payments.capability.checks-payment-identifiers",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "5f4c74d6dda0db124aea4127cfc242219e63d4fa05611323e78e23122a588bb4"
  },
  {
    "microtopicId": "payments:payments.source_evidence",
    "domainId": "payments",
    "intentId": "payments.source_evidence",
    "sourceNodeId": "knowledge.payments.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "f37d148a33cf7447d3cd14ce6088b2f69830b98f8a226ae4f238f24f0573ff18"
  },
  {
    "microtopicId": "payments:payments.realization",
    "domainId": "payments",
    "intentId": "payments.realization",
    "sourceNodeId": "knowledge.payments.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
    ],
    "availability": "available",
    "contentHash": "570f5a1a86d0ebacce13e16f2548842a460e227c9460cd4ebd5cfbad309c5d8d"
  },
  {
    "microtopicId": "vip:vip.overview",
    "domainId": "vip",
    "intentId": "vip.overview",
    "sourceNodeId": "knowledge.vip.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "f2f327abe463975665246abdc4a87fe368b5f76adbd165cd57d372fa8a25e546"
  },
  {
    "microtopicId": "vip:vip.purpose",
    "domainId": "vip",
    "intentId": "vip.purpose",
    "sourceNodeId": "knowledge.vip.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "9fe995a8c9dfa0cafc6f12e7b7734329f427c32bfafb24948e72faba6c19959a"
  },
  {
    "microtopicId": "vip:vip.user_value",
    "domainId": "vip",
    "intentId": "vip.user_value",
    "sourceNodeId": "knowledge.vip.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "fc01a803ba7666e8aab5c2ff57e8ef549928010346668c81d68f4663b888c556"
  },
  {
    "microtopicId": "vip:vip.open",
    "domainId": "vip",
    "intentId": "vip.open",
    "sourceNodeId": "knowledge.vip.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "93cdbd14804a2540e949ddef32a67549de30e0343609ea08d27d54ef8d16e11d"
  },
  {
    "microtopicId": "vip:vip.start",
    "domainId": "vip",
    "intentId": "vip.start",
    "sourceNodeId": "knowledge.vip.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "c1a74f5e49bfdce6161e26fb3afa295a921226d75e53798db2ec708c5d10e964"
  },
  {
    "microtopicId": "vip:vip.how_to",
    "domainId": "vip",
    "intentId": "vip.how_to",
    "sourceNodeId": "knowledge.vip.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "2c0e65ec3cda142b2c81d4272b0093304b115185dfecf0a1c3138ad5aeb1adbb"
  },
  {
    "microtopicId": "vip:vip.availability",
    "domainId": "vip",
    "intentId": "vip.availability",
    "sourceNodeId": "knowledge.vip.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "4d0cd65f9d02c0f1040c718cf6801961a1a9a0935eaee61b825303b3a9b0b5da"
  },
  {
    "microtopicId": "vip:vip.limitations",
    "domainId": "vip",
    "intentId": "vip.limitations",
    "sourceNodeId": "knowledge.vip.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "bc81cc7c4fae36a7558127da05663c8b4d29dfac24b8f2323cd82d68d55307af"
  },
  {
    "microtopicId": "vip:vip.prerequisites",
    "domainId": "vip",
    "intentId": "vip.prerequisites",
    "sourceNodeId": "knowledge.vip.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "1f2ed6cbfe3d1acaa0f647c1aa32b139ba2de6f0b4490c29f73e65051e4a9843"
  },
  {
    "microtopicId": "vip:vip.safety",
    "domainId": "vip",
    "intentId": "vip.safety",
    "sourceNodeId": "knowledge.vip.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "197d78e819310a6f810f3785ab42270f56eb7e29db9e54225fd08d4a29b95c88"
  },
  {
    "microtopicId": "vip:vip.privacy",
    "domainId": "vip",
    "intentId": "vip.privacy",
    "sourceNodeId": "knowledge.vip.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "7e5a134f60ca1341ade20add548f05619137754a1dbe02d9664871092c7a756e"
  },
  {
    "microtopicId": "vip:vip.self_status",
    "domainId": "vip",
    "intentId": "vip.self_status",
    "sourceNodeId": "knowledge.vip.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "2d381633309a9ec938694977642691ad5d5ee79d4900ba3a0a57aef0e485596c"
  },
  {
    "microtopicId": "vip:vip.incident",
    "domainId": "vip",
    "intentId": "vip.incident",
    "sourceNodeId": "knowledge.vip.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "88052ac8ceb8adf935cdefe0e95b766f47f156ecced4a3c4736edd5bd1ee7572"
  },
  {
    "microtopicId": "vip:vip.purchase_cost",
    "domainId": "vip",
    "intentId": "vip.purchase_cost",
    "sourceNodeId": "knowledge.vip.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "f3b9b29bec1892d6b2105bf0568e5d9bd464af45ca054c233e19fd062341ef5b"
  },
  {
    "microtopicId": "vip:vip.earning_credit",
    "domainId": "vip",
    "intentId": "vip.earning_credit",
    "sourceNodeId": "knowledge.vip.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "4a11960628d3ca36241b944caceed9bd2cf86d38f0c23ca6150cd4df975d35ee"
  },
  {
    "microtopicId": "vip:vip.gift_transfer_sale",
    "domainId": "vip",
    "intentId": "vip.gift_transfer_sale",
    "sourceNodeId": "knowledge.vip.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "1885657a21dd0c871957d2faae2591a209bd0794359501503096cf64b7b5d333"
  },
  {
    "microtopicId": "vip:vip.developers_mission",
    "domainId": "vip",
    "intentId": "vip.developers_mission",
    "sourceNodeId": "knowledge.vip.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "9533294483f51da3d88222bcb66de093b1edbabe3b97859cfc5d22127e3b79fd"
  },
  {
    "microtopicId": "vip:vip.roadmap",
    "domainId": "vip",
    "intentId": "vip.roadmap",
    "sourceNodeId": "knowledge.vip.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "b0cb3f21be760f80c6d40aaa7c5ee331aa49dec23be3be1ea7e26712716955f9"
  },
  {
    "microtopicId": "vip:vip.action",
    "domainId": "vip",
    "intentId": "vip.action",
    "sourceNodeId": "knowledge.vip.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "13f4b6fa1f62bdab5faac30fd1687ddae59efc9fb5139e207170cc03130a97e4"
  },
  {
    "microtopicId": "vip:vip.capability",
    "domainId": "vip",
    "intentId": "vip.capability",
    "sourceNodeId": "knowledge.vip.capability.checks-entitlement-source",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "7c9c8f34a7e92d33c8d34627df60414a90292f88a36362afb02b8f115b9f1489"
  },
  {
    "microtopicId": "vip:vip.source_evidence",
    "domainId": "vip",
    "intentId": "vip.source_evidence",
    "sourceNodeId": "knowledge.vip.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "8f1a558b51e657e935dcd9a87311529154829ef3b0c2c0a336c298fdf6262d35"
  },
  {
    "microtopicId": "vip:vip.realization",
    "domainId": "vip",
    "intentId": "vip.realization",
    "sourceNodeId": "knowledge.vip.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "874e4dd445f8215a72d05900d6901b79061c86600ca9308fa87debc73eff96c5"
  },
  {
    "microtopicId": "ads_packages:ads_packages.overview",
    "domainId": "ads_packages",
    "intentId": "ads_packages.overview",
    "sourceNodeId": "knowledge.ads_packages.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "ffb129fc3bc4022b81a8492cf2416a91806dc2c2eb2fdb03d00065275fc46105"
  },
  {
    "microtopicId": "ads_packages:ads_packages.purpose",
    "domainId": "ads_packages",
    "intentId": "ads_packages.purpose",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "15cddaf41b61971f005cfda41979ea0c7266ab14cb48d011118cf3719f0665f2"
  },
  {
    "microtopicId": "ads_packages:ads_packages.user_value",
    "domainId": "ads_packages",
    "intentId": "ads_packages.user_value",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "0f730d2df4a0eae6cbe7f0c796002fd4297a71af7579e50e06f7fae769d40660"
  },
  {
    "microtopicId": "ads_packages:ads_packages.open",
    "domainId": "ads_packages",
    "intentId": "ads_packages.open",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "181ccf7469b37f1f3cad26321757b72000e2942835b597d72f5584644921381f"
  },
  {
    "microtopicId": "ads_packages:ads_packages.start",
    "domainId": "ads_packages",
    "intentId": "ads_packages.start",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "5389cf7720f0a31f5936bda8e03c7d0f81b141fabad537c2756b14bea62ab7a5"
  },
  {
    "microtopicId": "ads_packages:ads_packages.how_to",
    "domainId": "ads_packages",
    "intentId": "ads_packages.how_to",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "61568dc2a4928551a928edf52a0f08a72163542d6b5e7a8468f327c4d4b27d06"
  },
  {
    "microtopicId": "ads_packages:ads_packages.availability",
    "domainId": "ads_packages",
    "intentId": "ads_packages.availability",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "b7fde760405a84f3341f63adc5ee0c6c63aa172cf4d999d438fe71e2a8cdb45e"
  },
  {
    "microtopicId": "ads_packages:ads_packages.limitations",
    "domainId": "ads_packages",
    "intentId": "ads_packages.limitations",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "7b4d92a7b3b8e4d726362e0114da0c5de5425003f90a139d721f583e77d06b0d"
  },
  {
    "microtopicId": "ads_packages:ads_packages.prerequisites",
    "domainId": "ads_packages",
    "intentId": "ads_packages.prerequisites",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "724a70e798d527da7d6f4b1b12138217cc306febf934266bb9ffe5458e058838"
  },
  {
    "microtopicId": "ads_packages:ads_packages.safety",
    "domainId": "ads_packages",
    "intentId": "ads_packages.safety",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "8792e14545bf0c470af190827205d61ee8c38199429b0a05b92fe21c5330520c"
  },
  {
    "microtopicId": "ads_packages:ads_packages.privacy",
    "domainId": "ads_packages",
    "intentId": "ads_packages.privacy",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "61a17f3162404f9c86a9a94c5c67c9e3ea998d7c5170b3624bca9b0002872da1"
  },
  {
    "microtopicId": "ads_packages:ads_packages.self_status",
    "domainId": "ads_packages",
    "intentId": "ads_packages.self_status",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "c3aef5e0a2900ed8bcfd4b11a2743e92c351dd89b2ac9b40669ab8ee327b091c"
  },
  {
    "microtopicId": "ads_packages:ads_packages.incident",
    "domainId": "ads_packages",
    "intentId": "ads_packages.incident",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "edfa584055b49837b620e6ac86c093a9d9c5cb7143a390c9d383bcb215816bbf"
  },
  {
    "microtopicId": "ads_packages:ads_packages.purchase_cost",
    "domainId": "ads_packages",
    "intentId": "ads_packages.purchase_cost",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "e90639114cae1e00530a282c4b43a3ffd1f8e0b4aec543e16d7d487688c84123"
  },
  {
    "microtopicId": "ads_packages:ads_packages.earning_credit",
    "domainId": "ads_packages",
    "intentId": "ads_packages.earning_credit",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "fead68f96bb068339c169b51143cd753893915f01093e1568210d050e876f121"
  },
  {
    "microtopicId": "ads_packages:ads_packages.gift_transfer_sale",
    "domainId": "ads_packages",
    "intentId": "ads_packages.gift_transfer_sale",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "eebe9474eb61a3a2f47a3876973367cb794409d8d9f5575a11f75bff18b4be38"
  },
  {
    "microtopicId": "ads_packages:ads_packages.developers_mission",
    "domainId": "ads_packages",
    "intentId": "ads_packages.developers_mission",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "677efb924a56d34576a72ebecc9fe1b7f56b57e774ce04fb4ba979c65a4db1fd"
  },
  {
    "microtopicId": "ads_packages:ads_packages.roadmap",
    "domainId": "ads_packages",
    "intentId": "ads_packages.roadmap",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "600a0ce47d1c50be081626391f60f5f6c67feb7805db5acd2b86a2225133dbe8"
  },
  {
    "microtopicId": "ads_packages:ads_packages.action",
    "domainId": "ads_packages",
    "intentId": "ads_packages.action",
    "sourceNodeId": "knowledge.ads_packages.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "8a401e517d5547251e19a2d0a938837ec1df7a832dc6171c12b976c6eccc6801"
  },
  {
    "microtopicId": "ads_packages:ads_packages.capability",
    "domainId": "ads_packages",
    "intentId": "ads_packages.capability",
    "sourceNodeId": "knowledge.ads_packages.capability.checks-package-lifecycle",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "55c01afe951514300c080b49efc0204102f7bfd4e68c94ccf313933904f2351b"
  },
  {
    "microtopicId": "ads_packages:ads_packages.source_evidence",
    "domainId": "ads_packages",
    "intentId": "ads_packages.source_evidence",
    "sourceNodeId": "knowledge.ads_packages.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "0b776801499ecdcf80a0598c28ff4407889f8ebe370124b106c66aed1df4b411"
  },
  {
    "microtopicId": "ads_packages:ads_packages.realization",
    "domainId": "ads_packages",
    "intentId": "ads_packages.realization",
    "sourceNodeId": "knowledge.ads_packages.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "e0293f58c0a22c9094c7ee789d170645184060f8a819d60bbc22f31c49bdb5d9"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.overview",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.overview",
    "sourceNodeId": "knowledge.ads_campaigns.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "5ce5d9f9c76583da3ee97388a11f03efe43da751543ec6ff4fe8ca3a97cb2976"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.purpose",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.purpose",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "ab3d43fb92f6175a07321d2cda094a5d05715067bc9e5c52ee7f6cf175a7d9e6"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.user_value",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.user_value",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "088b8cb5bbca1a2f23d659edd5a92e950fdd32bee68bc1c4866202b33045b020"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.open",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.open",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "8e7b8896683edd43fc9c95bd75987c93c286383eb5cac1720c36c1716b0ecd4e"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.start",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.start",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "63419cc079f45db4d154d4f074e4a0b6255959547e21fe17bfe1bb331ce5398e"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.how_to",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.how_to",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "d36f31432682a2aba13202037fd51c7730a90bf98d31ff92342036c2474b2333"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.availability",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.availability",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "218338d810d0e7020903ab491a32992847fd7dabc478c2b6f61d447a84e4e627"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.limitations",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.limitations",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "d3b3342531a2f5d99fdc5245d2ee81d4746cfd0f4b9acb318b9b9fd0f5576771"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.prerequisites",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.prerequisites",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "a22978a0bcf8b9d617a0c69f2e60b9a9399fe6b88fe329677bb540521379674b"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.safety",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.safety",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "f22fdfb4b26bdcef9e1caee75a6294ba1e2c27bb4f739370b38250ce923194de"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.privacy",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.privacy",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "66897b5d0b7130763f902e0a5e2081ea6d163924b8079c183250bcd09a9886dc"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.self_status",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.self_status",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "c86d53d93ad9949f5e6aa55543c6813afc91adae5cd9ad8e88b81f39ed091869"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.incident",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.incident",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "e434093f7f57e637cefd07b5c929053ea306d4d700a77d608fc08cbbf209aca9"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.purchase_cost",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.purchase_cost",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "7ae5d7253d721d4d1063c398c49d6e4e5c540c9ac432eef426e56d2ec6e28f17"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.earning_credit",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.earning_credit",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "6a00f683e9c6fe963fea97705aaa83463149b6b58f70066bbc130c27d50b9a15"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.gift_transfer_sale",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.gift_transfer_sale",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "9d0624986971902186c9502d4f28bf0f4c4946189701d9013a0094b1d427b9f3"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.developers_mission",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.developers_mission",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "35bf80235cfe450dec8cc96ccec79b06905a8fb9e94e0e8aa12e22af040cd450"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.roadmap",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.roadmap",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "6888819a72a3d43a003a11e490a160161f16ad2e2bd8f71de62f09568daf4ded"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.action",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.action",
    "sourceNodeId": "knowledge.ads_campaigns.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "05fe9fc0270c9e3e85ab0dc2a30bc22959ffc4460030cfd3a0f2e762807092c9"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.capability",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.capability",
    "sourceNodeId": "knowledge.ads_campaigns.capability.checks-campaign-status-and-metrics",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "10fb03df99cb5ba2776f41d4434e779093c4972fdcee67f41768de3058b77dd2"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.source_evidence",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.source_evidence",
    "sourceNodeId": "knowledge.ads_campaigns.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "f63a66b49b8061aae4c7cd699298526c6b2d447f767b6c7efd15ed999dc67e02"
  },
  {
    "microtopicId": "ads_campaigns:ads_campaigns.realization",
    "domainId": "ads_campaigns",
    "intentId": "ads_campaigns.realization",
    "sourceNodeId": "knowledge.ads_campaigns.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "availability": "available",
    "contentHash": "79fb74d5f321a0475205073a658e8194e3f6caa7b105531c6aa5593d7be10ec5"
  },
  {
    "microtopicId": "push:push.overview",
    "domainId": "push",
    "intentId": "push.overview",
    "sourceNodeId": "knowledge.push.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "e17675f670dfd354291a52d7539edbac4eff5c68ba6ac7357e76c4e3b852bc18"
  },
  {
    "microtopicId": "push:push.purpose",
    "domainId": "push",
    "intentId": "push.purpose",
    "sourceNodeId": "knowledge.push.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "dccfd5c4561f68eda2cdb9b7109cc284247621fd01b7a1dd7c07d1d7a8f60ef5"
  },
  {
    "microtopicId": "push:push.user_value",
    "domainId": "push",
    "intentId": "push.user_value",
    "sourceNodeId": "knowledge.push.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "92207c1c25db4be3ee3dce692ae00989df63fe9d9989cc43d1da68c6f43f1478"
  },
  {
    "microtopicId": "push:push.open",
    "domainId": "push",
    "intentId": "push.open",
    "sourceNodeId": "knowledge.push.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "bcdfbd06ca2bd60e292dfab9092af7c16eafde78b49cc71b6cbfd77a72522114"
  },
  {
    "microtopicId": "push:push.start",
    "domainId": "push",
    "intentId": "push.start",
    "sourceNodeId": "knowledge.push.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "35fbf174105ea8ac9eab869c15b6e2bcb512f7ffb9507ec8929026a438ce3ac8"
  },
  {
    "microtopicId": "push:push.how_to",
    "domainId": "push",
    "intentId": "push.how_to",
    "sourceNodeId": "knowledge.push.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "cfed50687eb03c3f7247dd8ea73a04b3ee95a8b87d484657813e1d9d1f0f2d22"
  },
  {
    "microtopicId": "push:push.availability",
    "domainId": "push",
    "intentId": "push.availability",
    "sourceNodeId": "knowledge.push.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "d6bc0c7e54ef953ebc2a4979b7e59765732d47aab903cb57f06246d43388aa04"
  },
  {
    "microtopicId": "push:push.limitations",
    "domainId": "push",
    "intentId": "push.limitations",
    "sourceNodeId": "knowledge.push.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "30fc70c10aacc351cde67d0dad7df1451f95c740bde4765e87142687918dc79e"
  },
  {
    "microtopicId": "push:push.prerequisites",
    "domainId": "push",
    "intentId": "push.prerequisites",
    "sourceNodeId": "knowledge.push.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "78f9dd3660470c8440ef3b21f78366a55de39fb2c59cfbb432e4a8cc863f84ed"
  },
  {
    "microtopicId": "push:push.safety",
    "domainId": "push",
    "intentId": "push.safety",
    "sourceNodeId": "knowledge.push.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "dc4e1582421225aa2795e583f505e72fefb86efc3c11a86337789d0ecbc37013"
  },
  {
    "microtopicId": "push:push.privacy",
    "domainId": "push",
    "intentId": "push.privacy",
    "sourceNodeId": "knowledge.push.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "d60e9314ab5500a12e9c92512abc7ef06c1a12b055a7418ee215e96421056057"
  },
  {
    "microtopicId": "push:push.self_status",
    "domainId": "push",
    "intentId": "push.self_status",
    "sourceNodeId": "knowledge.push.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "61cea39710776f0320b0134d263d5380bf9af45835f4abb6d535edc40376297a"
  },
  {
    "microtopicId": "push:push.incident",
    "domainId": "push",
    "intentId": "push.incident",
    "sourceNodeId": "knowledge.push.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "f60991de0d9696629114a5b591196c74720810bbb3eabe62967047483105ab6e"
  },
  {
    "microtopicId": "push:push.purchase_cost",
    "domainId": "push",
    "intentId": "push.purchase_cost",
    "sourceNodeId": "knowledge.push.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "390a8772073074554846726fdd87296215e3552bb83e472960b774131291e7d4"
  },
  {
    "microtopicId": "push:push.earning_credit",
    "domainId": "push",
    "intentId": "push.earning_credit",
    "sourceNodeId": "knowledge.push.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "94e9fa80b3a6f8f8bfd1bfd78059e67c2824c9d794a98d557b10cac83c3cb85b"
  },
  {
    "microtopicId": "push:push.gift_transfer_sale",
    "domainId": "push",
    "intentId": "push.gift_transfer_sale",
    "sourceNodeId": "knowledge.push.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "6ba94783dae01e56745a47583ac4ec681c1339506f7bb1e00446c2affb01deb2"
  },
  {
    "microtopicId": "push:push.developers_mission",
    "domainId": "push",
    "intentId": "push.developers_mission",
    "sourceNodeId": "knowledge.push.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "ae2aff1829c96c5d2031c236afe80b61cb730434c1d18abf11f133e88b137d73"
  },
  {
    "microtopicId": "push:push.roadmap",
    "domainId": "push",
    "intentId": "push.roadmap",
    "sourceNodeId": "knowledge.push.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "c4658ec60939f8cfff72c2c616cfcd1e8b9f2450d313c8d851076d58e2944e9b"
  },
  {
    "microtopicId": "push:push.action",
    "domainId": "push",
    "intentId": "push.action",
    "sourceNodeId": "knowledge.push.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "e5e124fdab2a656137900b0b7001a83b9c08ad274ae3febcc46cbea66858d3f8"
  },
  {
    "microtopicId": "push:push.capability",
    "domainId": "push",
    "intentId": "push.capability",
    "sourceNodeId": "knowledge.push.capability.checks-mongo-primary-notification-state",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "9c068ca561e632a7b0118fba879a5acfe966d09be289f2d55927f8309ac60027"
  },
  {
    "microtopicId": "push:push.source_evidence",
    "domainId": "push",
    "intentId": "push.source_evidence",
    "sourceNodeId": "knowledge.push.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "d5d846fa15e501a4b2a304c56dc19251e3c64ed2e5a8d4814f1cef025bb37623"
  },
  {
    "microtopicId": "push:push.realization",
    "domainId": "push",
    "intentId": "push.realization",
    "sourceNodeId": "knowledge.push.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
    ],
    "availability": "available",
    "contentHash": "81b4d1df1c8bcbe950c12f75535462418ccbb5dc6261a13bdc373e3f627a0339"
  },
  {
    "microtopicId": "messenger:messenger.overview",
    "domainId": "messenger",
    "intentId": "messenger.overview",
    "sourceNodeId": "knowledge.messenger.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "35e643bb7208ba4747c6fd1e515370f9ebd86a8c3863bda982ae877b006e05ed"
  },
  {
    "microtopicId": "messenger:messenger.purpose",
    "domainId": "messenger",
    "intentId": "messenger.purpose",
    "sourceNodeId": "knowledge.messenger.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "9f3d42c8df369757bdc08d7ce793decd6772dcab77a02518ed71b604ff566eeb"
  },
  {
    "microtopicId": "messenger:messenger.user_value",
    "domainId": "messenger",
    "intentId": "messenger.user_value",
    "sourceNodeId": "knowledge.messenger.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "e3a100d4b01fa084f91ff77373d0d375ad79645547795e205043aebe55ef1205"
  },
  {
    "microtopicId": "messenger:messenger.open",
    "domainId": "messenger",
    "intentId": "messenger.open",
    "sourceNodeId": "knowledge.messenger.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "e7d98226eebc039663e8176b659a937e1651ac379eecd1419c62a5e7d26fee46"
  },
  {
    "microtopicId": "messenger:messenger.start",
    "domainId": "messenger",
    "intentId": "messenger.start",
    "sourceNodeId": "knowledge.messenger.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "d733bbf2c85f371bca67ca7c2c602e27d7fccfee20390b920bd341d0d32f1d5b"
  },
  {
    "microtopicId": "messenger:messenger.how_to",
    "domainId": "messenger",
    "intentId": "messenger.how_to",
    "sourceNodeId": "knowledge.messenger.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "302e27470009238c86e7f012943b6ce61af0f93cd8663044a900f3797919f848"
  },
  {
    "microtopicId": "messenger:messenger.availability",
    "domainId": "messenger",
    "intentId": "messenger.availability",
    "sourceNodeId": "knowledge.messenger.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "6a88fb880f91b74552a6ebde1d56145f7052d67c757fb888afe49ea41aa36e6c"
  },
  {
    "microtopicId": "messenger:messenger.limitations",
    "domainId": "messenger",
    "intentId": "messenger.limitations",
    "sourceNodeId": "knowledge.messenger.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "783650a09a79d905e7309daeeeac977e3e366b33874fa0ecac7048f8fc116e58"
  },
  {
    "microtopicId": "messenger:messenger.prerequisites",
    "domainId": "messenger",
    "intentId": "messenger.prerequisites",
    "sourceNodeId": "knowledge.messenger.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "31ec100feb8d01b08134c33d1281f64363f141322c13286ece75312f008eba9a"
  },
  {
    "microtopicId": "messenger:messenger.safety",
    "domainId": "messenger",
    "intentId": "messenger.safety",
    "sourceNodeId": "knowledge.messenger.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "294e4b4216538b1e2222cc33c6802943a716eff3cd20d4ad27e61500bf739b38"
  },
  {
    "microtopicId": "messenger:messenger.privacy",
    "domainId": "messenger",
    "intentId": "messenger.privacy",
    "sourceNodeId": "knowledge.messenger.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "ff305573e98da6e0a9ef58c3b58e7027d4b83d7faf146fc6cb004e9145499965"
  },
  {
    "microtopicId": "messenger:messenger.self_status",
    "domainId": "messenger",
    "intentId": "messenger.self_status",
    "sourceNodeId": "knowledge.messenger.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "ed0054f7eb4a30affa36b81c1957bce42fdc2e9d487d5907d2ea1da1687daebd"
  },
  {
    "microtopicId": "messenger:messenger.incident",
    "domainId": "messenger",
    "intentId": "messenger.incident",
    "sourceNodeId": "knowledge.messenger.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "dda0bf27d1e42e2f97d8b12d424fc8c0d21ce00bb588d36f86c3fca68f049da6"
  },
  {
    "microtopicId": "messenger:messenger.purchase_cost",
    "domainId": "messenger",
    "intentId": "messenger.purchase_cost",
    "sourceNodeId": "knowledge.messenger.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "4d408ca1737b7f3238499237768c294c61b7133781c60881ba116e589e30fa0d"
  },
  {
    "microtopicId": "messenger:messenger.earning_credit",
    "domainId": "messenger",
    "intentId": "messenger.earning_credit",
    "sourceNodeId": "knowledge.messenger.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "6bd13987a66db9f7ed6c2040ed00fbde7608e61bf1c5bf3c371249487df8778d"
  },
  {
    "microtopicId": "messenger:messenger.gift_transfer_sale",
    "domainId": "messenger",
    "intentId": "messenger.gift_transfer_sale",
    "sourceNodeId": "knowledge.messenger.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "e71ab0c1b83560e227a005593cd2e535ded6602bca7f8c653d19cd9fcfdc9e43"
  },
  {
    "microtopicId": "messenger:messenger.developers_mission",
    "domainId": "messenger",
    "intentId": "messenger.developers_mission",
    "sourceNodeId": "knowledge.messenger.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "a55f053926729ffbcf2095d4624814a034565a5c25ea3ee2ecd37a4d5eef1258"
  },
  {
    "microtopicId": "messenger:messenger.roadmap",
    "domainId": "messenger",
    "intentId": "messenger.roadmap",
    "sourceNodeId": "knowledge.messenger.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "1f66fb42df3cb5c1389796bd69cf6d7a7193e2d283241337b1a844b1db00b36a"
  },
  {
    "microtopicId": "messenger:messenger.action",
    "domainId": "messenger",
    "intentId": "messenger.action",
    "sourceNodeId": "knowledge.messenger.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "db26678484e5e18d83da844ef5a7afbb4e9505560f3cb27f703a539cf1ddcfc8"
  },
  {
    "microtopicId": "messenger:messenger.capability",
    "domainId": "messenger",
    "intentId": "messenger.capability",
    "sourceNodeId": "knowledge.messenger.capability.checks-delivery-read-receipt-chain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "3ded2db36f6c88bdcda2de00619287af7ad94fe05ef4e2a704a2828e98986114"
  },
  {
    "microtopicId": "messenger:messenger.source_evidence",
    "domainId": "messenger",
    "intentId": "messenger.source_evidence",
    "sourceNodeId": "knowledge.messenger.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "1395df702765a29b640690e16668f4a265fd034caeaf4e5a1ff12fb1f08842e1"
  },
  {
    "microtopicId": "messenger:messenger.realization",
    "domainId": "messenger",
    "intentId": "messenger.realization",
    "sourceNodeId": "knowledge.messenger.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
    ],
    "availability": "available",
    "contentHash": "05b0e25338dbfa0bedff15a619300c3b93f1c2eaf5c7f60f319dd2c3f7f5792c"
  },
  {
    "microtopicId": "quests:quests.overview",
    "domainId": "quests",
    "intentId": "quests.overview",
    "sourceNodeId": "knowledge.quests.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "4e74e43a0ff72b16edd8f0fecc093c97a119af67239cea74c03c27462f131287"
  },
  {
    "microtopicId": "quests:quests.purpose",
    "domainId": "quests",
    "intentId": "quests.purpose",
    "sourceNodeId": "knowledge.quests.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "93d13c2c3157188160e80eff361645c172737839330ec453c3c769f8f31b648e"
  },
  {
    "microtopicId": "quests:quests.user_value",
    "domainId": "quests",
    "intentId": "quests.user_value",
    "sourceNodeId": "knowledge.quests.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "211c508e6a9c023af9afe2348c1bb48a2603d6c8aff67da12a78fb12f0ef70bc"
  },
  {
    "microtopicId": "quests:quests.open",
    "domainId": "quests",
    "intentId": "quests.open",
    "sourceNodeId": "knowledge.quests.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "efd2e754fda28ab088cc304f0d3ee277c01ae7b3bb680ebd578c78744864ec04"
  },
  {
    "microtopicId": "quests:quests.start",
    "domainId": "quests",
    "intentId": "quests.start",
    "sourceNodeId": "knowledge.quests.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "b86f8a3efa99a0a6bea2f0f2e0c72a2a9cb94c7721b8cc9a73426f9998d3ec30"
  },
  {
    "microtopicId": "quests:quests.how_to",
    "domainId": "quests",
    "intentId": "quests.how_to",
    "sourceNodeId": "knowledge.quests.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "6e5e3e3fcf0642816f95a3d02d8a640ddea7620249ae1829575305291d7bdbc8"
  },
  {
    "microtopicId": "quests:quests.availability",
    "domainId": "quests",
    "intentId": "quests.availability",
    "sourceNodeId": "knowledge.quests.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "fbfeb1c6c443dd23564d97b84fcf2efb4919ef5b5620d80588fb60526f0bee69"
  },
  {
    "microtopicId": "quests:quests.limitations",
    "domainId": "quests",
    "intentId": "quests.limitations",
    "sourceNodeId": "knowledge.quests.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "8056b37a1e2682176dfd1e986cb939b61e45ca4fb8d41ac48e4375911529cffc"
  },
  {
    "microtopicId": "quests:quests.prerequisites",
    "domainId": "quests",
    "intentId": "quests.prerequisites",
    "sourceNodeId": "knowledge.quests.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "908bb5c06327ca0fd6f15a1a3816aacd854ebeffac81a58a6e5d5a611470749f"
  },
  {
    "microtopicId": "quests:quests.safety",
    "domainId": "quests",
    "intentId": "quests.safety",
    "sourceNodeId": "knowledge.quests.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "4ff04b0c6a71fb76c2e92af3b75eb795bc1a432d79761df613455941fe841694"
  },
  {
    "microtopicId": "quests:quests.privacy",
    "domainId": "quests",
    "intentId": "quests.privacy",
    "sourceNodeId": "knowledge.quests.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "522f71967958cc7ee1976dfe8304a646b3ddfed7c18315b23cfe4038536a586b"
  },
  {
    "microtopicId": "quests:quests.self_status",
    "domainId": "quests",
    "intentId": "quests.self_status",
    "sourceNodeId": "knowledge.quests.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "866a3550119c36a45e67291b51a1a30323ee63997bc0eaa36bfc0d44c8d3e9e7"
  },
  {
    "microtopicId": "quests:quests.incident",
    "domainId": "quests",
    "intentId": "quests.incident",
    "sourceNodeId": "knowledge.quests.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "898ba5202c04f6c2d35c3de38abf0a2dee26fe399f3ce01f5b656c66a2277ec0"
  },
  {
    "microtopicId": "quests:quests.purchase_cost",
    "domainId": "quests",
    "intentId": "quests.purchase_cost",
    "sourceNodeId": "knowledge.quests.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "9a790edfdab6bca6ffae5404dbf7520deb65d93c789765d0e456ffc8d3133748"
  },
  {
    "microtopicId": "quests:quests.earning_credit",
    "domainId": "quests",
    "intentId": "quests.earning_credit",
    "sourceNodeId": "knowledge.quests.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "b99952a097c2e51c3838e9b18693dd2363be816fefec7a0558763916e3285d0f"
  },
  {
    "microtopicId": "quests:quests.gift_transfer_sale",
    "domainId": "quests",
    "intentId": "quests.gift_transfer_sale",
    "sourceNodeId": "knowledge.quests.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "bd6c032f31940ae3917f37593a90f1a69df963dae77c1e866adfe2e75f747a8a"
  },
  {
    "microtopicId": "quests:quests.developers_mission",
    "domainId": "quests",
    "intentId": "quests.developers_mission",
    "sourceNodeId": "knowledge.quests.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "4d4af5c2b0fe5e261a6b7dc418cdbcc47448a8fd19044fe834249c48ae0ce624"
  },
  {
    "microtopicId": "quests:quests.roadmap",
    "domainId": "quests",
    "intentId": "quests.roadmap",
    "sourceNodeId": "knowledge.quests.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "457ae42a9e2871e0497c25afe7f53bf52dfae1a333b85c117af890732d7ba8a5"
  },
  {
    "microtopicId": "quests:quests.action",
    "domainId": "quests",
    "intentId": "quests.action",
    "sourceNodeId": "knowledge.quests.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "83427f6615013c8292214b75fa008e6ba6f5ba03206da7c545afd5ed7e54486b"
  },
  {
    "microtopicId": "quests:quests.capability",
    "domainId": "quests",
    "intentId": "quests.capability",
    "sourceNodeId": "knowledge.quests.capability.checks-progress-state",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "00fab441719821a5c9dd0407d85f5dd6eaae8a6e6644b23b3e8387d7b3070525"
  },
  {
    "microtopicId": "quests:quests.source_evidence",
    "domainId": "quests",
    "intentId": "quests.source_evidence",
    "sourceNodeId": "knowledge.quests.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "34102ac9f7b96247efd098837032a31eac68e85f9e64b0290c0d57acd0dd47eb"
  },
  {
    "microtopicId": "quests:quests.realization",
    "domainId": "quests",
    "intentId": "quests.realization",
    "sourceNodeId": "knowledge.quests.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
    ],
    "availability": "available",
    "contentHash": "8005825b7c68669c2e23d523bbc572f52937a8e79534f05504dc68b2429e5078"
  },
  {
    "microtopicId": "contact:contact.overview",
    "domainId": "contact",
    "intentId": "contact.overview",
    "sourceNodeId": "knowledge.contact.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "bbd664aea5020d42003e209a8084c37a737f19750191609402577b0249dc3dbf"
  },
  {
    "microtopicId": "contact:contact.purpose",
    "domainId": "contact",
    "intentId": "contact.purpose",
    "sourceNodeId": "knowledge.contact.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "573e6d86466f950c51e5b245b0c72f1478bb06efbbfd6feee8a48232aefa0280"
  },
  {
    "microtopicId": "contact:contact.user_value",
    "domainId": "contact",
    "intentId": "contact.user_value",
    "sourceNodeId": "knowledge.contact.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "92a3244920e494524a9d85c01e8479cbef78cc80b999da80a35d637d4dd8ed78"
  },
  {
    "microtopicId": "contact:contact.open",
    "domainId": "contact",
    "intentId": "contact.open",
    "sourceNodeId": "knowledge.contact.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "155f4d8276b5c956bd256599ef0e41e9683240fbc9c39771d5a9b9ffd7eace5f"
  },
  {
    "microtopicId": "contact:contact.start",
    "domainId": "contact",
    "intentId": "contact.start",
    "sourceNodeId": "knowledge.contact.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "09f382f091173bbb0f9bb9759255f95ef3b7599d9eb9fdc901d04d92efe951a1"
  },
  {
    "microtopicId": "contact:contact.how_to",
    "domainId": "contact",
    "intentId": "contact.how_to",
    "sourceNodeId": "knowledge.contact.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "2f7b3098bccf6be52025b977c176fe3b93eceb3034200d1d8d14d401811e36d4"
  },
  {
    "microtopicId": "contact:contact.availability",
    "domainId": "contact",
    "intentId": "contact.availability",
    "sourceNodeId": "knowledge.contact.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "6150e597215e043701b40057bb36c32185c4062da522aada64790c8e3de5f346"
  },
  {
    "microtopicId": "contact:contact.limitations",
    "domainId": "contact",
    "intentId": "contact.limitations",
    "sourceNodeId": "knowledge.contact.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "7dc55ffb7e62c67f46335cd7dda7710e00f04b750cbb51c325849357e0715d13"
  },
  {
    "microtopicId": "contact:contact.prerequisites",
    "domainId": "contact",
    "intentId": "contact.prerequisites",
    "sourceNodeId": "knowledge.contact.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "f03bfd06fe1571852793e0aa8c08a82a6809089c80a3951330e8f769a3388756"
  },
  {
    "microtopicId": "contact:contact.safety",
    "domainId": "contact",
    "intentId": "contact.safety",
    "sourceNodeId": "knowledge.contact.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "02b996c5ca4a6ebe793b13863614cf340e2ad01957f2bc3c13e303a9cf6a6687"
  },
  {
    "microtopicId": "contact:contact.privacy",
    "domainId": "contact",
    "intentId": "contact.privacy",
    "sourceNodeId": "knowledge.contact.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "74d504d008ab0e87121d81bcfb8b10088e0f71917273c57e69662d680f024055"
  },
  {
    "microtopicId": "contact:contact.self_status",
    "domainId": "contact",
    "intentId": "contact.self_status",
    "sourceNodeId": "knowledge.contact.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "72f16deb4e153b2e46a3dad1ea6b3a25831b0a5dab440e37ef25c6ff6ae54a3e"
  },
  {
    "microtopicId": "contact:contact.incident",
    "domainId": "contact",
    "intentId": "contact.incident",
    "sourceNodeId": "knowledge.contact.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "b5d4ae048b727fa10368e1cf0bc19bc2486062a10e516ddd86c8103cce9f48f0"
  },
  {
    "microtopicId": "contact:contact.purchase_cost",
    "domainId": "contact",
    "intentId": "contact.purchase_cost",
    "sourceNodeId": "knowledge.contact.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "7d767606e45ead4d9649aa72a6e7d1fc370c2db3cafd564604483f95938988e3"
  },
  {
    "microtopicId": "contact:contact.earning_credit",
    "domainId": "contact",
    "intentId": "contact.earning_credit",
    "sourceNodeId": "knowledge.contact.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "7ea3eafd79d432f23597afa71eaad3d34207348d1520e3744289e5d82336a075"
  },
  {
    "microtopicId": "contact:contact.gift_transfer_sale",
    "domainId": "contact",
    "intentId": "contact.gift_transfer_sale",
    "sourceNodeId": "knowledge.contact.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "31e3004c5644e4691cbbf3639eb252c97bafaec45fd8e63cf41135026c5982c9"
  },
  {
    "microtopicId": "contact:contact.developers_mission",
    "domainId": "contact",
    "intentId": "contact.developers_mission",
    "sourceNodeId": "knowledge.contact.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "17e050bc5cc9f453317d1fac6a10b831df66b6031ba5f461c8777dee66a0c55d"
  },
  {
    "microtopicId": "contact:contact.roadmap",
    "domainId": "contact",
    "intentId": "contact.roadmap",
    "sourceNodeId": "knowledge.contact.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "e27b8dcf32a49148abc76b3e16efaa1309ee3a22aafb298c0e6989bb3a82681f"
  },
  {
    "microtopicId": "contact:contact.action",
    "domainId": "contact",
    "intentId": "contact.action",
    "sourceNodeId": "knowledge.contact.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "921d9c148b4b70fa3d63c05a8979c4e4af81f16dd53ef5df5647f9a24dffecb9"
  },
  {
    "microtopicId": "contact:contact.capability",
    "domainId": "contact",
    "intentId": "contact.capability",
    "sourceNodeId": "knowledge.contact.capability.routes-material-messages-to-admin",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "feb771c98cc4e5c10175af73be24f0dd5dd837d34e903e8ec3bde475980710d9"
  },
  {
    "microtopicId": "contact:contact.source_evidence",
    "domainId": "contact",
    "intentId": "contact.source_evidence",
    "sourceNodeId": "knowledge.contact.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "7a2e42271bd0eba5aadad926aa95a7642a6f34a3c9ea9bf0643ef863a58d0984"
  },
  {
    "microtopicId": "contact:contact.realization",
    "domainId": "contact",
    "intentId": "contact.realization",
    "sourceNodeId": "knowledge.contact.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
    ],
    "availability": "available",
    "contentHash": "db477ad613712f5b117f6e218a9cd9f598ec4041777a03f9e4819cfa961a26e8"
  },
  {
    "microtopicId": "privacy:privacy.overview",
    "domainId": "privacy",
    "intentId": "privacy.overview",
    "sourceNodeId": "knowledge.privacy.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "d3568c3ca9181d1853e75244d1efa05b53586c0487742f5362cc6f7bc8882ce1"
  },
  {
    "microtopicId": "privacy:privacy.purpose",
    "domainId": "privacy",
    "intentId": "privacy.purpose",
    "sourceNodeId": "knowledge.privacy.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "18ab9485a5704e63dfe57a7e4318c8d9813594745b315a03c98fcf3848785d36"
  },
  {
    "microtopicId": "privacy:privacy.user_value",
    "domainId": "privacy",
    "intentId": "privacy.user_value",
    "sourceNodeId": "knowledge.privacy.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "b90ae04ba6d6597e01ff3a9b903b8b21b8a845d946981bd5a2c0346481887c54"
  },
  {
    "microtopicId": "privacy:privacy.open",
    "domainId": "privacy",
    "intentId": "privacy.open",
    "sourceNodeId": "knowledge.privacy.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "593102751ec8a2cf7ee90b1a65748c6efc51c9e432d9629bf91986ad12d159bd"
  },
  {
    "microtopicId": "privacy:privacy.start",
    "domainId": "privacy",
    "intentId": "privacy.start",
    "sourceNodeId": "knowledge.privacy.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "a04ea7547a3322f83485afb88d1b9bf9836dd69ba95ad082d6f73c6f5d1c0acf"
  },
  {
    "microtopicId": "privacy:privacy.how_to",
    "domainId": "privacy",
    "intentId": "privacy.how_to",
    "sourceNodeId": "knowledge.privacy.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "f839e2405bd2254f49bc12a13028cf9001250986c89ef7d272d4701c7c7057c4"
  },
  {
    "microtopicId": "privacy:privacy.availability",
    "domainId": "privacy",
    "intentId": "privacy.availability",
    "sourceNodeId": "knowledge.privacy.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "4ffea08e507a923ad6b73b7977937c3c317b882c79dfe0176aa8a152417433d2"
  },
  {
    "microtopicId": "privacy:privacy.limitations",
    "domainId": "privacy",
    "intentId": "privacy.limitations",
    "sourceNodeId": "knowledge.privacy.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "c4e3c812c44dc1efe3fc61bb450d3ace04e360fbcf8aa0b08183c39f2ba5dc42"
  },
  {
    "microtopicId": "privacy:privacy.prerequisites",
    "domainId": "privacy",
    "intentId": "privacy.prerequisites",
    "sourceNodeId": "knowledge.privacy.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "265d088f97f7652badee061c5723bc48d8d06f821a7c5b46b3f6b2a7ee5a0752"
  },
  {
    "microtopicId": "privacy:privacy.safety",
    "domainId": "privacy",
    "intentId": "privacy.safety",
    "sourceNodeId": "knowledge.privacy.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "70a6e36f3f1040b172a3a5769a7cc082a0177e5bef3b5c0b7cf5c264c2225b06"
  },
  {
    "microtopicId": "privacy:privacy.privacy",
    "domainId": "privacy",
    "intentId": "privacy.privacy",
    "sourceNodeId": "knowledge.privacy.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "404a8c15771932f69dfba4acc7bc9ff593036d570cbc45e5c2987fbb400b6421"
  },
  {
    "microtopicId": "privacy:privacy.self_status",
    "domainId": "privacy",
    "intentId": "privacy.self_status",
    "sourceNodeId": "knowledge.privacy.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "940c337e9fdc2aff697626429198c0cc90115903aa1e45ff92775e4b3efbde8f"
  },
  {
    "microtopicId": "privacy:privacy.incident",
    "domainId": "privacy",
    "intentId": "privacy.incident",
    "sourceNodeId": "knowledge.privacy.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "9c044d8a47b28683994fa3e144f6d27a4fe304099d5dbd7b30952c7e26ceb003"
  },
  {
    "microtopicId": "privacy:privacy.purchase_cost",
    "domainId": "privacy",
    "intentId": "privacy.purchase_cost",
    "sourceNodeId": "knowledge.privacy.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "3766fd0fc215d32ba55975538117a64879c24b8e19264bc7705c8ae2957933ef"
  },
  {
    "microtopicId": "privacy:privacy.earning_credit",
    "domainId": "privacy",
    "intentId": "privacy.earning_credit",
    "sourceNodeId": "knowledge.privacy.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "5aa4d5f13c8491bf9d205c9134aae235315be138356cce95e664a55e59d3a554"
  },
  {
    "microtopicId": "privacy:privacy.gift_transfer_sale",
    "domainId": "privacy",
    "intentId": "privacy.gift_transfer_sale",
    "sourceNodeId": "knowledge.privacy.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "a5740465657e9def93f5d8df9606059a402feb28fa71b9df07790db133f6d7eb"
  },
  {
    "microtopicId": "privacy:privacy.developers_mission",
    "domainId": "privacy",
    "intentId": "privacy.developers_mission",
    "sourceNodeId": "knowledge.privacy.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "4ed7937e07f4ba1b5e0e1ec1d7f0f2f8f92d6eee7c5459c06595f9c210f3cbca"
  },
  {
    "microtopicId": "privacy:privacy.roadmap",
    "domainId": "privacy",
    "intentId": "privacy.roadmap",
    "sourceNodeId": "knowledge.privacy.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "c7f6af804e018ba84d80af77d2f0d54112137ea3d15b36d3cf061873aa73d6eb"
  },
  {
    "microtopicId": "privacy:privacy.action",
    "domainId": "privacy",
    "intentId": "privacy.action",
    "sourceNodeId": "knowledge.privacy.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "bc4928991299e5c790270ba453f4cbd8fad63333a5cef39bedba739da51b7580"
  },
  {
    "microtopicId": "privacy:privacy.capability",
    "domainId": "privacy",
    "intentId": "privacy.capability",
    "sourceNodeId": "knowledge.privacy.capability.separates-user-safe-and-admin-only-details",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "56992ca1a69c387808910ed92a191072c2d76cbb77362c040b3d2d27354320ee"
  },
  {
    "microtopicId": "privacy:privacy.source_evidence",
    "domainId": "privacy",
    "intentId": "privacy.source_evidence",
    "sourceNodeId": "knowledge.privacy.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "f9be5729770f528bc019b7ae78a779e36d27c25144e2244c221c746844d10864"
  },
  {
    "microtopicId": "privacy:privacy.realization",
    "domainId": "privacy",
    "intentId": "privacy.realization",
    "sourceNodeId": "knowledge.privacy.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
    ],
    "availability": "available",
    "contentHash": "d4b71bb6f13ed226fb84bd11e7d53b9198429d67b146a62e5460f9b84fa0bb8c"
  },
  {
    "microtopicId": "security:security.overview",
    "domainId": "security",
    "intentId": "security.overview",
    "sourceNodeId": "knowledge.security.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "debd382832907dfeaf87c24a24a140fbf14cf6d6f5c65c718607556c46055b0f"
  },
  {
    "microtopicId": "security:security.purpose",
    "domainId": "security",
    "intentId": "security.purpose",
    "sourceNodeId": "knowledge.security.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "72a2d50487833521cb2b9818d592259ac51e64dc12866974fdee99906a105157"
  },
  {
    "microtopicId": "security:security.user_value",
    "domainId": "security",
    "intentId": "security.user_value",
    "sourceNodeId": "knowledge.security.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "c0a917f109f807e5e5e6a209e208504f2498db9f0980e4677cc14e7022e30738"
  },
  {
    "microtopicId": "security:security.open",
    "domainId": "security",
    "intentId": "security.open",
    "sourceNodeId": "knowledge.security.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "503f2dfa709aea24ea754c49e5b9e7fed7970ea247e5c80d62430f2d87092808"
  },
  {
    "microtopicId": "security:security.start",
    "domainId": "security",
    "intentId": "security.start",
    "sourceNodeId": "knowledge.security.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "33b881b18d373200d236320f45950af1d31e783b07da4741860e7fa94e3b2c98"
  },
  {
    "microtopicId": "security:security.how_to",
    "domainId": "security",
    "intentId": "security.how_to",
    "sourceNodeId": "knowledge.security.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "9c3dfceb12af1d269a169b20150847009f04dc3208a1c75382393e5714f185bd"
  },
  {
    "microtopicId": "security:security.availability",
    "domainId": "security",
    "intentId": "security.availability",
    "sourceNodeId": "knowledge.security.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "65ad7f35dbf5d697d9ea7d54c7292275ff115c97d0e4cf49bcfc2e37941b48e4"
  },
  {
    "microtopicId": "security:security.limitations",
    "domainId": "security",
    "intentId": "security.limitations",
    "sourceNodeId": "knowledge.security.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "843f994e21c00bc0dba9af32ec34ec961d85242779cec13c29f3e62d016687cf"
  },
  {
    "microtopicId": "security:security.prerequisites",
    "domainId": "security",
    "intentId": "security.prerequisites",
    "sourceNodeId": "knowledge.security.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "02e99726f0fee18ae70203e905a3898ce7146ab5f46852684c34f24bcf3a10a2"
  },
  {
    "microtopicId": "security:security.safety",
    "domainId": "security",
    "intentId": "security.safety",
    "sourceNodeId": "knowledge.security.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "561f88c61f25d4070fa1266a05262f436c39c51a4667f1fdbc3907b0acb459f0"
  },
  {
    "microtopicId": "security:security.privacy",
    "domainId": "security",
    "intentId": "security.privacy",
    "sourceNodeId": "knowledge.security.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "c5b88a7733b4f1ecc21164d109950fc2f32b0372c24b79e2847fa41d974ef158"
  },
  {
    "microtopicId": "security:security.self_status",
    "domainId": "security",
    "intentId": "security.self_status",
    "sourceNodeId": "knowledge.security.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "8ca91be6880dadc5fd8a36a197bba2977fd26a17bbec2c3d88e76da65e066bf6"
  },
  {
    "microtopicId": "security:security.incident",
    "domainId": "security",
    "intentId": "security.incident",
    "sourceNodeId": "knowledge.security.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "8bf0163dfb298a50d6dd98db24e7a7b590f90688880b453a6d7b8c18fd66ceaa"
  },
  {
    "microtopicId": "security:security.purchase_cost",
    "domainId": "security",
    "intentId": "security.purchase_cost",
    "sourceNodeId": "knowledge.security.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "d10776f48f5c427cbc0b9dd204cc59c8b03cb9872d86cf790acb4a0e49519a01"
  },
  {
    "microtopicId": "security:security.earning_credit",
    "domainId": "security",
    "intentId": "security.earning_credit",
    "sourceNodeId": "knowledge.security.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "748ee45ece3b431170d0dbe6f0dbd51ce2a6561434b4c4f5af896282a638b706"
  },
  {
    "microtopicId": "security:security.gift_transfer_sale",
    "domainId": "security",
    "intentId": "security.gift_transfer_sale",
    "sourceNodeId": "knowledge.security.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "f6956cad6b9a7a77031b62f2e70e8466b3ae920881bb52c98b2f6e33271b493f"
  },
  {
    "microtopicId": "security:security.developers_mission",
    "domainId": "security",
    "intentId": "security.developers_mission",
    "sourceNodeId": "knowledge.security.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "747aff340a0377d923e06126cc2fa10fd30cfe66c35cd8a7fa1915a178a0bbe0"
  },
  {
    "microtopicId": "security:security.roadmap",
    "domainId": "security",
    "intentId": "security.roadmap",
    "sourceNodeId": "knowledge.security.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "7c8d6dcb0c4550a66fb739df14a97180323d5c8294bf87da2711a5efb68e8b16"
  },
  {
    "microtopicId": "security:security.action",
    "domainId": "security",
    "intentId": "security.action",
    "sourceNodeId": "knowledge.security.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "429d82395b7c82e1f7140f4b1824c9406069fa5f730cbe1dec52a3672d17bb3f"
  },
  {
    "microtopicId": "security:security.capability",
    "domainId": "security",
    "intentId": "security.capability",
    "sourceNodeId": "knowledge.security.capability.redacts-secrets-before-storage-email",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "548061aeac06741ee8caaaf5cb8fc5c9346064180b80b7b1cb4fb86d2850780e"
  },
  {
    "microtopicId": "security:security.source_evidence",
    "domainId": "security",
    "intentId": "security.source_evidence",
    "sourceNodeId": "knowledge.security.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "eaab470460ae6381be8163d29eaf5b491e712e653212fa140eb6ae915e5b38d0"
  },
  {
    "microtopicId": "security:security.realization",
    "domainId": "security",
    "intentId": "security.realization",
    "sourceNodeId": "knowledge.security.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
    ],
    "availability": "available",
    "contentHash": "7e2f30d4c1d927409ec3814594527ee4b989f27c12aa1bf7c193355de7856325"
  },
  {
    "microtopicId": "account_deletion:account_deletion.overview",
    "domainId": "account_deletion",
    "intentId": "account_deletion.overview",
    "sourceNodeId": "knowledge.account_deletion.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "79228a73a299875fba0fa65f371772aff639eba2fed3605885f0958503c60fb0"
  },
  {
    "microtopicId": "account_deletion:account_deletion.purpose",
    "domainId": "account_deletion",
    "intentId": "account_deletion.purpose",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "943eaa1e0f249f137330b2e679123c5329f5df3405f2e279890baefabac053ef"
  },
  {
    "microtopicId": "account_deletion:account_deletion.user_value",
    "domainId": "account_deletion",
    "intentId": "account_deletion.user_value",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "e4aacacc0ceb62d195ae28329b6d98aa661dab834629f13be7144999542c47d7"
  },
  {
    "microtopicId": "account_deletion:account_deletion.open",
    "domainId": "account_deletion",
    "intentId": "account_deletion.open",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "1a2e5febc6234654a14f1bc690019434244643704a60af10523c45091f928def"
  },
  {
    "microtopicId": "account_deletion:account_deletion.start",
    "domainId": "account_deletion",
    "intentId": "account_deletion.start",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "0836cf21b66f59996ba4b902b1299627ec99cab6ab6d2b20426daa4e2d578290"
  },
  {
    "microtopicId": "account_deletion:account_deletion.how_to",
    "domainId": "account_deletion",
    "intentId": "account_deletion.how_to",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "82919cc3352342562a76d78cffe999b1a5372e31ba89b87436f83fe7b4d5780b"
  },
  {
    "microtopicId": "account_deletion:account_deletion.availability",
    "domainId": "account_deletion",
    "intentId": "account_deletion.availability",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "c8babaaefdd8d2962facbbf19acbb9e04a4286cbc62aa6001d635397c2e5793b"
  },
  {
    "microtopicId": "account_deletion:account_deletion.limitations",
    "domainId": "account_deletion",
    "intentId": "account_deletion.limitations",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "3189288ea6693440a0d426c803bb6dabac4941574ed13bb2f90d079edf6e5e06"
  },
  {
    "microtopicId": "account_deletion:account_deletion.prerequisites",
    "domainId": "account_deletion",
    "intentId": "account_deletion.prerequisites",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "4cd70ff62980af848549b103583fa0310d309fa6645047206cf658705b81967a"
  },
  {
    "microtopicId": "account_deletion:account_deletion.safety",
    "domainId": "account_deletion",
    "intentId": "account_deletion.safety",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "5e05d9e903d716cc84c8b992aa52a0c6c2a56bdcf3fc51b55f03e3e16142ca0f"
  },
  {
    "microtopicId": "account_deletion:account_deletion.privacy",
    "domainId": "account_deletion",
    "intentId": "account_deletion.privacy",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "67caf83d29f53b11a3a3b5cc11f845fff817746b961234bd24a7abc1414ec885"
  },
  {
    "microtopicId": "account_deletion:account_deletion.self_status",
    "domainId": "account_deletion",
    "intentId": "account_deletion.self_status",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "849043c2bc65eeaf42a8ce66a1650417cc671dda01db37224623be62b009985c"
  },
  {
    "microtopicId": "account_deletion:account_deletion.incident",
    "domainId": "account_deletion",
    "intentId": "account_deletion.incident",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "6be3dceae705142d9200f78093af654da3739ebebc9d9b08658c9f290b330fba"
  },
  {
    "microtopicId": "account_deletion:account_deletion.purchase_cost",
    "domainId": "account_deletion",
    "intentId": "account_deletion.purchase_cost",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "7baa38c974a3c80707df612585fd59d4ea1c0b943c2179fecfd9be209491eba1"
  },
  {
    "microtopicId": "account_deletion:account_deletion.earning_credit",
    "domainId": "account_deletion",
    "intentId": "account_deletion.earning_credit",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "8009e53f6612147ca581c6a20d678d0be1252b2aa868340920daa6dd11601e8f"
  },
  {
    "microtopicId": "account_deletion:account_deletion.gift_transfer_sale",
    "domainId": "account_deletion",
    "intentId": "account_deletion.gift_transfer_sale",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "3ade86c4c77c18d338ccb6bc0dd9442adba9b968a5c27a4eade20e2318cc71ce"
  },
  {
    "microtopicId": "account_deletion:account_deletion.developers_mission",
    "domainId": "account_deletion",
    "intentId": "account_deletion.developers_mission",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "cbc1b54532e8771eaffd89b379e738b62802fbee31380e04fd480fb84efc3e75"
  },
  {
    "microtopicId": "account_deletion:account_deletion.roadmap",
    "domainId": "account_deletion",
    "intentId": "account_deletion.roadmap",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "3962312e1acd8a5900ffbe60219d49825d2eec7511dd53e8dd942444b16a4422"
  },
  {
    "microtopicId": "account_deletion:account_deletion.action",
    "domainId": "account_deletion",
    "intentId": "account_deletion.action",
    "sourceNodeId": "knowledge.account_deletion.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "55db2a8dc5cd0b422d6b236b70294bc3cd0fcb0ec2898df6de4b9a150fc65ff2"
  },
  {
    "microtopicId": "account_deletion:account_deletion.capability",
    "domainId": "account_deletion",
    "intentId": "account_deletion.capability",
    "sourceNodeId": "knowledge.account_deletion.capability.explains-irreversible-actions",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "1141ba482b6b25173ecf7c6ebd6dd7b722f13c818c456588b4d603bf463c801c"
  },
  {
    "microtopicId": "account_deletion:account_deletion.source_evidence",
    "domainId": "account_deletion",
    "intentId": "account_deletion.source_evidence",
    "sourceNodeId": "knowledge.account_deletion.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "b752c98975c85ea3e0a6407fd50aa57e7d1dffb5feca7203fb43adac36e9564d"
  },
  {
    "microtopicId": "account_deletion:account_deletion.realization",
    "domainId": "account_deletion",
    "intentId": "account_deletion.realization",
    "sourceNodeId": "knowledge.account_deletion.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "70749c97c9083472d951b6d96147020e966a27dd771cbe4596bba908e7c1c699"
  },
  {
    "microtopicId": "navigation:navigation.overview",
    "domainId": "navigation",
    "intentId": "navigation.overview",
    "sourceNodeId": "knowledge.navigation.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "518cc0aaa4b4893761de466ad16016034fa2c8491101adb4d3cd6318d8117ba5"
  },
  {
    "microtopicId": "navigation:navigation.purpose",
    "domainId": "navigation",
    "intentId": "navigation.purpose",
    "sourceNodeId": "knowledge.navigation.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "ac53c7155bb9ae5b199e0bba0f04ea8c770e512c88b42a12d7d450fe4b8277ea"
  },
  {
    "microtopicId": "navigation:navigation.user_value",
    "domainId": "navigation",
    "intentId": "navigation.user_value",
    "sourceNodeId": "knowledge.navigation.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "db952dfc6e2095971a1b577e6347fbaaf2e86d3ddc8b7ed6cbc92c77236cfa3b"
  },
  {
    "microtopicId": "navigation:navigation.open",
    "domainId": "navigation",
    "intentId": "navigation.open",
    "sourceNodeId": "knowledge.navigation.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "d8586522c86f2796babe25598d9ca3e2020252da700136881fd9ed6ab38a3d30"
  },
  {
    "microtopicId": "navigation:navigation.start",
    "domainId": "navigation",
    "intentId": "navigation.start",
    "sourceNodeId": "knowledge.navigation.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "aefec740f629afcf626dba5a1d0f5ca96f28fefc7e082081a52d29e39e25f018"
  },
  {
    "microtopicId": "navigation:navigation.how_to",
    "domainId": "navigation",
    "intentId": "navigation.how_to",
    "sourceNodeId": "knowledge.navigation.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "40a1cca67d8db3d62d8281d1bef2431a50f7e6fa064d5fc58eabef9aa557ef29"
  },
  {
    "microtopicId": "navigation:navigation.availability",
    "domainId": "navigation",
    "intentId": "navigation.availability",
    "sourceNodeId": "knowledge.navigation.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "61e40fa902321085e52cd8023419f1a930d281d7482b196eb924398692d13249"
  },
  {
    "microtopicId": "navigation:navigation.limitations",
    "domainId": "navigation",
    "intentId": "navigation.limitations",
    "sourceNodeId": "knowledge.navigation.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "2a58d585f11a3a98c5684ce38cb3026f77176317a577bd7f715598f497bc9f88"
  },
  {
    "microtopicId": "navigation:navigation.prerequisites",
    "domainId": "navigation",
    "intentId": "navigation.prerequisites",
    "sourceNodeId": "knowledge.navigation.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "d856de7ec1576b3aadb14f4fbba10bd5126c0bbb66a989a7dd8a6b799ad5b1f6"
  },
  {
    "microtopicId": "navigation:navigation.safety",
    "domainId": "navigation",
    "intentId": "navigation.safety",
    "sourceNodeId": "knowledge.navigation.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "5d03fa25b3e03337242d03d95b7a4b45959b9ae9acb83a6b1eaaefe0fa802ead"
  },
  {
    "microtopicId": "navigation:navigation.privacy",
    "domainId": "navigation",
    "intentId": "navigation.privacy",
    "sourceNodeId": "knowledge.navigation.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "399840c4a7ac9f2c8730a5ffea97f8eff2f660e7b05a6268d86327fe38a283d5"
  },
  {
    "microtopicId": "navigation:navigation.self_status",
    "domainId": "navigation",
    "intentId": "navigation.self_status",
    "sourceNodeId": "knowledge.navigation.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "b1b3fa1ff8e31767ab40ac27e6d1c08a096315d550c5141c33cb2bca892ce647"
  },
  {
    "microtopicId": "navigation:navigation.incident",
    "domainId": "navigation",
    "intentId": "navigation.incident",
    "sourceNodeId": "knowledge.navigation.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "b8be760236a2b9211039f58447ba04330b75474222cc44b8cdcc296ff243f6ec"
  },
  {
    "microtopicId": "navigation:navigation.purchase_cost",
    "domainId": "navigation",
    "intentId": "navigation.purchase_cost",
    "sourceNodeId": "knowledge.navigation.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "d2a0094087faa7b7c6cd7486d22f36acecfa310ee19c3a5c03b3dfa800486b75"
  },
  {
    "microtopicId": "navigation:navigation.earning_credit",
    "domainId": "navigation",
    "intentId": "navigation.earning_credit",
    "sourceNodeId": "knowledge.navigation.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "00b9f4d311214e8d4b52ee4f9f367c65286de198e798ce2e8f0d8202fa84992d"
  },
  {
    "microtopicId": "navigation:navigation.gift_transfer_sale",
    "domainId": "navigation",
    "intentId": "navigation.gift_transfer_sale",
    "sourceNodeId": "knowledge.navigation.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "012f74d543284a72947f548b89833cbb81c0d480375fb31e3cf43db098d86b8d"
  },
  {
    "microtopicId": "navigation:navigation.developers_mission",
    "domainId": "navigation",
    "intentId": "navigation.developers_mission",
    "sourceNodeId": "knowledge.navigation.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "179ec3d840bfb79f43976f1489f0bc7b59bb99c152071fddd47b0a8e3630f508"
  },
  {
    "microtopicId": "navigation:navigation.roadmap",
    "domainId": "navigation",
    "intentId": "navigation.roadmap",
    "sourceNodeId": "knowledge.navigation.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "c36139b7d06d0e510f7ca3163d0385cf1875d98ee76f682b4e2e64b6ab8247b9"
  },
  {
    "microtopicId": "navigation:navigation.action",
    "domainId": "navigation",
    "intentId": "navigation.action",
    "sourceNodeId": "knowledge.navigation.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "494125d4327720da32c6fd6c3cbf7a32e5002deefb6406bb3b6015031d1a2239"
  },
  {
    "microtopicId": "navigation:navigation.capability",
    "domainId": "navigation",
    "intentId": "navigation.capability",
    "sourceNodeId": "knowledge.navigation.capability.explains-where-to-go",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "f6e8d9f0fff7217c6d6a955654d54e8dbd75574e593aee2f7e96332d7e3504ce"
  },
  {
    "microtopicId": "navigation:navigation.source_evidence",
    "domainId": "navigation",
    "intentId": "navigation.source_evidence",
    "sourceNodeId": "knowledge.navigation.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "f7a91a02a4754c87f76588eb03217e2a0d107bd95912be643e07cbe92d57df7b"
  },
  {
    "microtopicId": "navigation:navigation.realization",
    "domainId": "navigation",
    "intentId": "navigation.realization",
    "sourceNodeId": "knowledge.navigation.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
    ],
    "availability": "available",
    "contentHash": "10a89fe5eb3f489db0f3d2a6a62b59420b9fe5c09e191b6de93505a43fb43fce"
  },
  {
    "microtopicId": "roadmap:roadmap.overview",
    "domainId": "roadmap",
    "intentId": "roadmap.overview",
    "sourceNodeId": "knowledge.roadmap.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "839e9dfd134317a22e2b6a9064747b10f1d4864fa54d45bf5623d42fe5fcce3b"
  },
  {
    "microtopicId": "roadmap:roadmap.purpose",
    "domainId": "roadmap",
    "intentId": "roadmap.purpose",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "7f44e013a76704c91d299a8eefbc0ad334dc89333b4f267d2029235384f637e4"
  },
  {
    "microtopicId": "roadmap:roadmap.user_value",
    "domainId": "roadmap",
    "intentId": "roadmap.user_value",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "0b7aaf35f8c5371ab9458ba3e0676032527c30513c7ed34214c05ab9bf2b984a"
  },
  {
    "microtopicId": "roadmap:roadmap.open",
    "domainId": "roadmap",
    "intentId": "roadmap.open",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "5f2d29ae1a356cce35f92c36d64eb59468127209aa1805b5479a20dede06f73c"
  },
  {
    "microtopicId": "roadmap:roadmap.start",
    "domainId": "roadmap",
    "intentId": "roadmap.start",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "26e5f74038b9e97525734e87fbaa15332922d8278711d7fde6cc29149cae6bd2"
  },
  {
    "microtopicId": "roadmap:roadmap.how_to",
    "domainId": "roadmap",
    "intentId": "roadmap.how_to",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "d0238764b1bc740ee9d4f2c1433a8ccdc19f4f48c690a8f3d1bea096a35c4c4b"
  },
  {
    "microtopicId": "roadmap:roadmap.availability",
    "domainId": "roadmap",
    "intentId": "roadmap.availability",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "dd4ac911ddc34247bfc4313c94bd4a331f1761009c311a3f7d03be6b649da816"
  },
  {
    "microtopicId": "roadmap:roadmap.limitations",
    "domainId": "roadmap",
    "intentId": "roadmap.limitations",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "7c6d1d5aab49ce828b2aa4a6449dee71fc9cd131a38b97b491a03c821019e715"
  },
  {
    "microtopicId": "roadmap:roadmap.prerequisites",
    "domainId": "roadmap",
    "intentId": "roadmap.prerequisites",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "93d94b514b181524108cf8c6720c1d00afd825ca80e687540c6c016a4ba68bc1"
  },
  {
    "microtopicId": "roadmap:roadmap.safety",
    "domainId": "roadmap",
    "intentId": "roadmap.safety",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "8cd79235769388df0348000f3e426a7d7b04e50f714047f0f12e38c487befa92"
  },
  {
    "microtopicId": "roadmap:roadmap.privacy",
    "domainId": "roadmap",
    "intentId": "roadmap.privacy",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "9749dd94e2bf2cc8c652cb14dad8a1e9a179c70ca9d06c4139c2706c4ebe3806"
  },
  {
    "microtopicId": "roadmap:roadmap.self_status",
    "domainId": "roadmap",
    "intentId": "roadmap.self_status",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "b5fc60b2f8125617b36a9b88c4edf8103cde564240366f1b7491ec372714368d"
  },
  {
    "microtopicId": "roadmap:roadmap.incident",
    "domainId": "roadmap",
    "intentId": "roadmap.incident",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "6f37a90102070c2df1b0204edd9b40eb77eb4e3c0fd70d19553d13c01cf99820"
  },
  {
    "microtopicId": "roadmap:roadmap.purchase_cost",
    "domainId": "roadmap",
    "intentId": "roadmap.purchase_cost",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "4719dd32c0a9fa2940f83a8fa971c92c8050561067d5bb503fa26719eb52800e"
  },
  {
    "microtopicId": "roadmap:roadmap.earning_credit",
    "domainId": "roadmap",
    "intentId": "roadmap.earning_credit",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "727c09239d9ba9c5c24a57503079c9b79f641f59999830b2bb4e65278d238198"
  },
  {
    "microtopicId": "roadmap:roadmap.gift_transfer_sale",
    "domainId": "roadmap",
    "intentId": "roadmap.gift_transfer_sale",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "3aaa1b5fa6cdf3bfca42eb24974db30084173800e35a9e785d53013055592cb1"
  },
  {
    "microtopicId": "roadmap:roadmap.developers_mission",
    "domainId": "roadmap",
    "intentId": "roadmap.developers_mission",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "8ae620d4cda1ac99ab4706b76537df4ad71d5f611b597a44d59c5a9457ef958e"
  },
  {
    "microtopicId": "roadmap:roadmap.roadmap",
    "domainId": "roadmap",
    "intentId": "roadmap.roadmap",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "7718f22b411b868eda84966783c761528325aabb83863f27104fe3329de5fdb5"
  },
  {
    "microtopicId": "roadmap:roadmap.action",
    "domainId": "roadmap",
    "intentId": "roadmap.action",
    "sourceNodeId": "knowledge.roadmap.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "2533504f977aa82b2743f6faa14b3e8f22cdbdef4ac1dbad5115531e450abbcb"
  },
  {
    "microtopicId": "roadmap:roadmap.capability",
    "domainId": "roadmap",
    "intentId": "roadmap.capability",
    "sourceNodeId": "knowledge.roadmap.capability.does-not-invent-dates",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "9cd65bdd5bdfd3547f9581219843094bd11ec8ca55ba16844678679d91e0c0ec"
  },
  {
    "microtopicId": "roadmap:roadmap.source_evidence",
    "domainId": "roadmap",
    "intentId": "roadmap.source_evidence",
    "sourceNodeId": "knowledge.roadmap.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "e35d764da11aba02e5847434031ae3e84a5df9a30af14bf8a9011b53db962d4f"
  },
  {
    "microtopicId": "roadmap:roadmap.realization",
    "domainId": "roadmap",
    "intentId": "roadmap.realization",
    "sourceNodeId": "knowledge.roadmap.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
    ],
    "availability": "available",
    "contentHash": "7179826c47e6efc142853ea2d6bb7106f577ff08c6c4ebc2ce7871934872d975"
  },
  {
    "microtopicId": "system_status:system_status.overview",
    "domainId": "system_status",
    "intentId": "system_status.overview",
    "sourceNodeId": "knowledge.system_status.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "22ffd0f336abf64cfef56db994b24b735abd2b926a2fad21e6c6ca5ecc144dc5"
  },
  {
    "microtopicId": "system_status:system_status.purpose",
    "domainId": "system_status",
    "intentId": "system_status.purpose",
    "sourceNodeId": "knowledge.system_status.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "d2d160d9c963813a448bae2afb34a081c4c3d67efa227b9879681581841d1baa"
  },
  {
    "microtopicId": "system_status:system_status.user_value",
    "domainId": "system_status",
    "intentId": "system_status.user_value",
    "sourceNodeId": "knowledge.system_status.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "88ec0ca8106e4732d4829c0e8e6ba4083dd14894d29a698c2ec5ac30d8348f28"
  },
  {
    "microtopicId": "system_status:system_status.open",
    "domainId": "system_status",
    "intentId": "system_status.open",
    "sourceNodeId": "knowledge.system_status.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "62f48451825d624839ec262bee3ba9d46affdbb01db9fc14f4e64bc364803e4f"
  },
  {
    "microtopicId": "system_status:system_status.start",
    "domainId": "system_status",
    "intentId": "system_status.start",
    "sourceNodeId": "knowledge.system_status.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "d445cb60b39938398fed908481120b16909387a2ca7984ec5de0cd850573eded"
  },
  {
    "microtopicId": "system_status:system_status.how_to",
    "domainId": "system_status",
    "intentId": "system_status.how_to",
    "sourceNodeId": "knowledge.system_status.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "7d079e860782b90eaad9419b5b73a1c1141683dbe7d406bedbe422ecd4fbb22d"
  },
  {
    "microtopicId": "system_status:system_status.availability",
    "domainId": "system_status",
    "intentId": "system_status.availability",
    "sourceNodeId": "knowledge.system_status.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "5ba5a5888ebdfe11cbb4abe8a34c3cfbdd2f3755544b4d35da50dd156026b605"
  },
  {
    "microtopicId": "system_status:system_status.limitations",
    "domainId": "system_status",
    "intentId": "system_status.limitations",
    "sourceNodeId": "knowledge.system_status.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "af12b575cb8921da16bf24cff1081d3c6c42f88e9dae203bc116442957e7bd5a"
  },
  {
    "microtopicId": "system_status:system_status.prerequisites",
    "domainId": "system_status",
    "intentId": "system_status.prerequisites",
    "sourceNodeId": "knowledge.system_status.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "b307dba7e3544c3c96cbccae65b34fd8695cce0f48b67afd7011e5fedb21b832"
  },
  {
    "microtopicId": "system_status:system_status.safety",
    "domainId": "system_status",
    "intentId": "system_status.safety",
    "sourceNodeId": "knowledge.system_status.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "0bcf7d3c5e9fb9a6ff2a1738cf86f4dc24599debcf88a802139764001b685746"
  },
  {
    "microtopicId": "system_status:system_status.privacy",
    "domainId": "system_status",
    "intentId": "system_status.privacy",
    "sourceNodeId": "knowledge.system_status.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "ceb3064a6f8d692643d2ce00c22a0a45eb316fe81c755db1e5b98974f978f3f2"
  },
  {
    "microtopicId": "system_status:system_status.self_status",
    "domainId": "system_status",
    "intentId": "system_status.self_status",
    "sourceNodeId": "knowledge.system_status.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "2cce9b5023ebb62227699808484caf90cf57f0f30c1285e89bdc6320895f29c2"
  },
  {
    "microtopicId": "system_status:system_status.incident",
    "domainId": "system_status",
    "intentId": "system_status.incident",
    "sourceNodeId": "knowledge.system_status.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "b64a5b9e7d3f2b7f6aa61fd453e08e495b5a8ce9ec9e85cc8ee22979ba9e925f"
  },
  {
    "microtopicId": "system_status:system_status.purchase_cost",
    "domainId": "system_status",
    "intentId": "system_status.purchase_cost",
    "sourceNodeId": "knowledge.system_status.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "54776cf53cc03fc565a6ec0acb9c997af51f4592bc11c7373869bff646094620"
  },
  {
    "microtopicId": "system_status:system_status.earning_credit",
    "domainId": "system_status",
    "intentId": "system_status.earning_credit",
    "sourceNodeId": "knowledge.system_status.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "ab0d83f5ae5fc8bf421e83ab982911dd4c2dcf8e9b35759cd85ed5ec5197cb46"
  },
  {
    "microtopicId": "system_status:system_status.gift_transfer_sale",
    "domainId": "system_status",
    "intentId": "system_status.gift_transfer_sale",
    "sourceNodeId": "knowledge.system_status.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "f546a26c63f5dc5e488cabb84398f155de7e1ffe30791830438405558f1f1d88"
  },
  {
    "microtopicId": "system_status:system_status.developers_mission",
    "domainId": "system_status",
    "intentId": "system_status.developers_mission",
    "sourceNodeId": "knowledge.system_status.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "3b090a894fc8511ee72f626fb587d233b6fa4f4976167e0072f57da6cc8e795b"
  },
  {
    "microtopicId": "system_status:system_status.roadmap",
    "domainId": "system_status",
    "intentId": "system_status.roadmap",
    "sourceNodeId": "knowledge.system_status.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "60a3f549788c8aecf677c23e3a1edda0a6e4480bad9325a811bd714ba4b954e4"
  },
  {
    "microtopicId": "system_status:system_status.action",
    "domainId": "system_status",
    "intentId": "system_status.action",
    "sourceNodeId": "knowledge.system_status.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "f47498e708b52ac94d214ee507be4e980a1dd9d08ef497ba8a8c3705a9e68d39"
  },
  {
    "microtopicId": "system_status:system_status.capability",
    "domainId": "system_status",
    "intentId": "system_status.capability",
    "sourceNodeId": "knowledge.system_status.capability.checks-current-runtime-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "6d85cddf4313acae9bdb2653453fa9b47844786aba9dac2d8e71eee7294429ca"
  },
  {
    "microtopicId": "system_status:system_status.source_evidence",
    "domainId": "system_status",
    "intentId": "system_status.source_evidence",
    "sourceNodeId": "knowledge.system_status.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "aad026a97ab2fa75809ac1e92f4f5bccfe7f1b8df4fe66b92ec9ccd8c06aed14"
  },
  {
    "microtopicId": "system_status:system_status.realization",
    "domainId": "system_status",
    "intentId": "system_status.realization",
    "sourceNodeId": "knowledge.system_status.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
    ],
    "availability": "available",
    "contentHash": "3f3eb555cdbc1bd2c3b6ede3dd174e9779fe09d741c5b6306b33b3daec4ac151"
  },
  {
    "microtopicId": "localization:localization.overview",
    "domainId": "localization",
    "intentId": "localization.overview",
    "sourceNodeId": "knowledge.localization.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "d9fa7e6935ee4fd888b20ac56aca4ce3e59bba8ec348008ae38f692d97116796"
  },
  {
    "microtopicId": "localization:localization.purpose",
    "domainId": "localization",
    "intentId": "localization.purpose",
    "sourceNodeId": "knowledge.localization.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "61ae86b8e65641ee5c571bbdb65a0247fcbacd15bef364a4fd006118f82fd53c"
  },
  {
    "microtopicId": "localization:localization.user_value",
    "domainId": "localization",
    "intentId": "localization.user_value",
    "sourceNodeId": "knowledge.localization.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "82d04e437ad11a09e37db98991f67feb22cbf6e53c5891d9a52484617e1a122b"
  },
  {
    "microtopicId": "localization:localization.open",
    "domainId": "localization",
    "intentId": "localization.open",
    "sourceNodeId": "knowledge.localization.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "c30e91ba5692acc941d52b9e6f53001c1a27f81f6a9e2939822fa1a7216b861c"
  },
  {
    "microtopicId": "localization:localization.start",
    "domainId": "localization",
    "intentId": "localization.start",
    "sourceNodeId": "knowledge.localization.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "3a788ac821cb2445f3a45ad0a2246ffaf22fa510ab3947a93094097828a0b927"
  },
  {
    "microtopicId": "localization:localization.how_to",
    "domainId": "localization",
    "intentId": "localization.how_to",
    "sourceNodeId": "knowledge.localization.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "c44ac6dbaa3255fc0627166374165b86d1fe4d400183dae3897da5bff8f69865"
  },
  {
    "microtopicId": "localization:localization.availability",
    "domainId": "localization",
    "intentId": "localization.availability",
    "sourceNodeId": "knowledge.localization.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "f55ac584010b7ebc39ae05489c4d380297f40e600b2a12aa950ff23821b743e2"
  },
  {
    "microtopicId": "localization:localization.limitations",
    "domainId": "localization",
    "intentId": "localization.limitations",
    "sourceNodeId": "knowledge.localization.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "b0479ba3f526e84df76e410a2e70b4853a57f93274f1ab1a5434195e13687431"
  },
  {
    "microtopicId": "localization:localization.prerequisites",
    "domainId": "localization",
    "intentId": "localization.prerequisites",
    "sourceNodeId": "knowledge.localization.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "e2c51ad4d9599306d95a46a44cc99ab000ed488442e37d55a2479de6a8d72a31"
  },
  {
    "microtopicId": "localization:localization.safety",
    "domainId": "localization",
    "intentId": "localization.safety",
    "sourceNodeId": "knowledge.localization.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "1d399bbaf0c39668b32f9ca04302c8769b5bc55a8885b4751c43aaea9009d164"
  },
  {
    "microtopicId": "localization:localization.privacy",
    "domainId": "localization",
    "intentId": "localization.privacy",
    "sourceNodeId": "knowledge.localization.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "ca323a350f8a193608bb51ba459204c5fdea22a5ef407f251921831b72b9d2ef"
  },
  {
    "microtopicId": "localization:localization.self_status",
    "domainId": "localization",
    "intentId": "localization.self_status",
    "sourceNodeId": "knowledge.localization.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "f232efa23616a389597609a04a57dce06464164cbc89d96963f4782452ae00c2"
  },
  {
    "microtopicId": "localization:localization.incident",
    "domainId": "localization",
    "intentId": "localization.incident",
    "sourceNodeId": "knowledge.localization.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "430d8ee784a468ff1fa6e47ef27860bf9dfdd18171b2de7d98e1dbbc9733eacd"
  },
  {
    "microtopicId": "localization:localization.purchase_cost",
    "domainId": "localization",
    "intentId": "localization.purchase_cost",
    "sourceNodeId": "knowledge.localization.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "4820e8c9b2ab8f2280166e9378d6ca0232499287af5d61c9648133cc3fe9709b"
  },
  {
    "microtopicId": "localization:localization.earning_credit",
    "domainId": "localization",
    "intentId": "localization.earning_credit",
    "sourceNodeId": "knowledge.localization.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "a4ffe6ce7d7e7caa74fcbfbf98fae12250469d3d367074ff41f67da4dec953de"
  },
  {
    "microtopicId": "localization:localization.gift_transfer_sale",
    "domainId": "localization",
    "intentId": "localization.gift_transfer_sale",
    "sourceNodeId": "knowledge.localization.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "e4d7e4d77a3302964bbad675e6d43664898d1c3356c48d387223aa219b6be803"
  },
  {
    "microtopicId": "localization:localization.developers_mission",
    "domainId": "localization",
    "intentId": "localization.developers_mission",
    "sourceNodeId": "knowledge.localization.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "55bdd6f90e66bc6353485651a2978905ef4b83f5da232dae223600fbff569882"
  },
  {
    "microtopicId": "localization:localization.roadmap",
    "domainId": "localization",
    "intentId": "localization.roadmap",
    "sourceNodeId": "knowledge.localization.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "7ba3a0750f0c3bd05ca61309d6e49ff37311fb6d47039c3d48b21c73e01e0068"
  },
  {
    "microtopicId": "localization:localization.action",
    "domainId": "localization",
    "intentId": "localization.action",
    "sourceNodeId": "knowledge.localization.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "f636903bfa8acb278869c7ff5902358b8640f0deaad70935d75fccd888048d03"
  },
  {
    "microtopicId": "localization:localization.capability",
    "domainId": "localization",
    "intentId": "localization.capability",
    "sourceNodeId": "knowledge.localization.capability.preserves-original-language",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "8fd94416b08f4792ea88d1fd778733b2069d27e37d2ce58ac3eddc1143e26b24"
  },
  {
    "microtopicId": "localization:localization.source_evidence",
    "domainId": "localization",
    "intentId": "localization.source_evidence",
    "sourceNodeId": "knowledge.localization.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "33230f170c3ef1508dd514ca78195f7f4844105ebd3fde98e41095ad708c3f0b"
  },
  {
    "microtopicId": "localization:localization.realization",
    "domainId": "localization",
    "intentId": "localization.realization",
    "sourceNodeId": "knowledge.localization.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
    ],
    "availability": "available",
    "contentHash": "ba172786dbe48ff16ba1284e150f0cb9d2899c0debe912ad7685f31367c5caf0"
  },
  {
    "microtopicId": "accessibility:accessibility.overview",
    "domainId": "accessibility",
    "intentId": "accessibility.overview",
    "sourceNodeId": "knowledge.accessibility.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "3ccd2ad91e98881ef6d7e06ac55dd9d2a2143db224f0c5e7663e6b56964e56fd"
  },
  {
    "microtopicId": "accessibility:accessibility.purpose",
    "domainId": "accessibility",
    "intentId": "accessibility.purpose",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "b2702b9f5ba1fe4f212cac55e031735ce037ee0505b56d7fd1687ee223132fa5"
  },
  {
    "microtopicId": "accessibility:accessibility.user_value",
    "domainId": "accessibility",
    "intentId": "accessibility.user_value",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "fad242f3f47169095174822a393da78c23d3cc6ef8eb9efb85213fd6f77271e0"
  },
  {
    "microtopicId": "accessibility:accessibility.open",
    "domainId": "accessibility",
    "intentId": "accessibility.open",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "6522c2491cc0cb5fb2b39fc0f49a03db24b735057e5ce5616719b1ff219b03eb"
  },
  {
    "microtopicId": "accessibility:accessibility.start",
    "domainId": "accessibility",
    "intentId": "accessibility.start",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "3df49e7133c0ab24c78f14449c33d46b0e5aefca8148e7bafdf403fae2d51bef"
  },
  {
    "microtopicId": "accessibility:accessibility.how_to",
    "domainId": "accessibility",
    "intentId": "accessibility.how_to",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "3ad3e5c734d7c144799334dc1b4fc55012876967da5ca064ffd106b3e743a760"
  },
  {
    "microtopicId": "accessibility:accessibility.availability",
    "domainId": "accessibility",
    "intentId": "accessibility.availability",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "7793d310c6b2221f903eaf1b2b1679f1efa8ee3d0d76526ccf328359096c4769"
  },
  {
    "microtopicId": "accessibility:accessibility.limitations",
    "domainId": "accessibility",
    "intentId": "accessibility.limitations",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "6be090a36baa90e7e28f3e34e5e65023c04b38544f0c1f076a240f9da45d3872"
  },
  {
    "microtopicId": "accessibility:accessibility.prerequisites",
    "domainId": "accessibility",
    "intentId": "accessibility.prerequisites",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "66ca55b4d81e1d187b0bfb37bb3a5f5f3328269d8ec7f5142a73fd7a4c3bd81c"
  },
  {
    "microtopicId": "accessibility:accessibility.safety",
    "domainId": "accessibility",
    "intentId": "accessibility.safety",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "5ebe476ef93bb03d036b9a3163353c459defd7b6d5282090c85c61fdccdef2c2"
  },
  {
    "microtopicId": "accessibility:accessibility.privacy",
    "domainId": "accessibility",
    "intentId": "accessibility.privacy",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "cbcd9e176273541e10906e9f6745045421eed5ff69f556fd6bf3eec534f75ff1"
  },
  {
    "microtopicId": "accessibility:accessibility.self_status",
    "domainId": "accessibility",
    "intentId": "accessibility.self_status",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "3bbbf912988de5c7d1298c8ace41f3a7fed691f9d8046741b3c2092c77c4a900"
  },
  {
    "microtopicId": "accessibility:accessibility.incident",
    "domainId": "accessibility",
    "intentId": "accessibility.incident",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "6b2f36f87e6dcbb7884b06dc1453b3b30a3aa1b46380acd1d31b7e2cb682f2f2"
  },
  {
    "microtopicId": "accessibility:accessibility.purchase_cost",
    "domainId": "accessibility",
    "intentId": "accessibility.purchase_cost",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "efbbc13c9495658ae2e0f1a258d6803af271f749c68a3f39029a6c2f2cae0cb5"
  },
  {
    "microtopicId": "accessibility:accessibility.earning_credit",
    "domainId": "accessibility",
    "intentId": "accessibility.earning_credit",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "e6814c85ac6788388a622c57f6ba8e5626be5cc597631cca77a16016116a257e"
  },
  {
    "microtopicId": "accessibility:accessibility.gift_transfer_sale",
    "domainId": "accessibility",
    "intentId": "accessibility.gift_transfer_sale",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "73118ec07d98cbbc426c17f4d7646120ef7af64beab5cbf6751e7920fc7eb3af"
  },
  {
    "microtopicId": "accessibility:accessibility.developers_mission",
    "domainId": "accessibility",
    "intentId": "accessibility.developers_mission",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "31f6ffda6fc2e66917b34e81b837ac4a5db41b1561a7e7f77c000ff4042b6dfc"
  },
  {
    "microtopicId": "accessibility:accessibility.roadmap",
    "domainId": "accessibility",
    "intentId": "accessibility.roadmap",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "2c5fc79415c1bcd33fb0002389e00ddfc7428c5b9a8ab55e9cc1f6301d48cbda"
  },
  {
    "microtopicId": "accessibility:accessibility.action",
    "domainId": "accessibility",
    "intentId": "accessibility.action",
    "sourceNodeId": "knowledge.accessibility.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "b1b3c0114fd9f93cc56dff85a93225e689155f7f848a987d362ea95cb8a1d515"
  },
  {
    "microtopicId": "accessibility:accessibility.capability",
    "domainId": "accessibility",
    "intentId": "accessibility.capability",
    "sourceNodeId": "knowledge.accessibility.capability.keeps-controls-usable",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "4e9944e31f96fb7c9ad077b617eefdf0be0fbd8b6f6ab53e73e1ba3968bd2beb"
  },
  {
    "microtopicId": "accessibility:accessibility.source_evidence",
    "domainId": "accessibility",
    "intentId": "accessibility.source_evidence",
    "sourceNodeId": "knowledge.accessibility.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "014c8835529dd328ca94f334cd372b79bb70509fd6bbe03402599bfda9757fd8"
  },
  {
    "microtopicId": "accessibility:accessibility.realization",
    "domainId": "accessibility",
    "intentId": "accessibility.realization",
    "sourceNodeId": "knowledge.accessibility.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
    ],
    "availability": "available",
    "contentHash": "00247f688b1bec7d77a5d58148b53545cd57b2f1d08a5879cb0ff122f608ac75"
  },
  {
    "microtopicId": "partnership:partnership.overview",
    "domainId": "partnership",
    "intentId": "partnership.overview",
    "sourceNodeId": "knowledge.partnership.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "be20c6ee665ea24c7ee5bff5cdb4e99e6b2d79e443eecb687b23b4d15b1d3b04"
  },
  {
    "microtopicId": "partnership:partnership.purpose",
    "domainId": "partnership",
    "intentId": "partnership.purpose",
    "sourceNodeId": "knowledge.partnership.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "b1f0682d94147cc49cec23ded05857d00d0712480f20a0eb3fc4f88cd92fd756"
  },
  {
    "microtopicId": "partnership:partnership.user_value",
    "domainId": "partnership",
    "intentId": "partnership.user_value",
    "sourceNodeId": "knowledge.partnership.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "f373719e8b6192ed2f44b0909e3d90281b3b059a646252359cfab67ec81bfe36"
  },
  {
    "microtopicId": "partnership:partnership.open",
    "domainId": "partnership",
    "intentId": "partnership.open",
    "sourceNodeId": "knowledge.partnership.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "68473e59d23ca913ccf254fb7af4d5fd86ef45ead2854c2b9d79113db293999c"
  },
  {
    "microtopicId": "partnership:partnership.start",
    "domainId": "partnership",
    "intentId": "partnership.start",
    "sourceNodeId": "knowledge.partnership.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "3735b9bdd7353408dfc49a278e0ff413fc745bc0788105ad444cb34f728265ef"
  },
  {
    "microtopicId": "partnership:partnership.how_to",
    "domainId": "partnership",
    "intentId": "partnership.how_to",
    "sourceNodeId": "knowledge.partnership.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "6dd9904db7602220aa429b43a183aa4820366b4410f86da61626c856adad95b6"
  },
  {
    "microtopicId": "partnership:partnership.availability",
    "domainId": "partnership",
    "intentId": "partnership.availability",
    "sourceNodeId": "knowledge.partnership.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "f6e5c11b5e48bfe951bd17f7df5dbe9df7cf610c3e30454545568f6668af20e5"
  },
  {
    "microtopicId": "partnership:partnership.limitations",
    "domainId": "partnership",
    "intentId": "partnership.limitations",
    "sourceNodeId": "knowledge.partnership.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "6bd8fc424c3e0af2daaee7ae3b3ab44d0970b12d0ba4bd6a5057c32b1280fa8c"
  },
  {
    "microtopicId": "partnership:partnership.prerequisites",
    "domainId": "partnership",
    "intentId": "partnership.prerequisites",
    "sourceNodeId": "knowledge.partnership.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "16005dc1bbf3213778310115a57ecff73ceb15bd640a7fcf58e7eeeb58c7bbc2"
  },
  {
    "microtopicId": "partnership:partnership.safety",
    "domainId": "partnership",
    "intentId": "partnership.safety",
    "sourceNodeId": "knowledge.partnership.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "28b934a8870b3a735f5de42836e566c45117e3877c08b02811399645f600a015"
  },
  {
    "microtopicId": "partnership:partnership.privacy",
    "domainId": "partnership",
    "intentId": "partnership.privacy",
    "sourceNodeId": "knowledge.partnership.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "2a6c1ca49c6e3b27052b2d36c85b8fa5dc5bc3e16fdb0e48e679557abdd9f5e2"
  },
  {
    "microtopicId": "partnership:partnership.self_status",
    "domainId": "partnership",
    "intentId": "partnership.self_status",
    "sourceNodeId": "knowledge.partnership.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "5a980d3d3d1e74f41840f340cd81a9ee00d303476a59e8ae16eff5c79e9525df"
  },
  {
    "microtopicId": "partnership:partnership.incident",
    "domainId": "partnership",
    "intentId": "partnership.incident",
    "sourceNodeId": "knowledge.partnership.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "51eb0a889648afde11c558520f01bcce0112cbd4a646a29b5dd4d2d874b66c49"
  },
  {
    "microtopicId": "partnership:partnership.purchase_cost",
    "domainId": "partnership",
    "intentId": "partnership.purchase_cost",
    "sourceNodeId": "knowledge.partnership.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "28164ebbc5ce538573d847c9bcf7c18751287d616c55ed8c11b34738c9578a96"
  },
  {
    "microtopicId": "partnership:partnership.earning_credit",
    "domainId": "partnership",
    "intentId": "partnership.earning_credit",
    "sourceNodeId": "knowledge.partnership.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "f274108f018cd1746080cb7336aea2a74eaed0e29361cb72a3740cd6474b9cdc"
  },
  {
    "microtopicId": "partnership:partnership.gift_transfer_sale",
    "domainId": "partnership",
    "intentId": "partnership.gift_transfer_sale",
    "sourceNodeId": "knowledge.partnership.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "e2125ff4e37de9879f63cecd8ca830021d950d396c9d81df047bd5587b82021c"
  },
  {
    "microtopicId": "partnership:partnership.developers_mission",
    "domainId": "partnership",
    "intentId": "partnership.developers_mission",
    "sourceNodeId": "knowledge.partnership.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "3fe48b247bf30b00073bdab13c5a5ff826a6744311f4d071cfed8c6e623e4e34"
  },
  {
    "microtopicId": "partnership:partnership.roadmap",
    "domainId": "partnership",
    "intentId": "partnership.roadmap",
    "sourceNodeId": "knowledge.partnership.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "85a16174efaab7b73d988dc3f1e9d2261a5ff6135b8b9a38fcb77a213fdcc7fe"
  },
  {
    "microtopicId": "partnership:partnership.action",
    "domainId": "partnership",
    "intentId": "partnership.action",
    "sourceNodeId": "knowledge.partnership.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "0ef3132640a25f961341f97238c8c36a7dc94ce10fe22bdf11713b1ab30d536f"
  },
  {
    "microtopicId": "partnership:partnership.capability",
    "domainId": "partnership",
    "intentId": "partnership.capability",
    "sourceNodeId": "knowledge.partnership.capability.verified-knowledge-and-bounded-support-guidance",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "f9f6f992ab0bf44e28b25ade8ac41c87ad25cc94fe1848bff575c764a57af6ee"
  },
  {
    "microtopicId": "partnership:partnership.source_evidence",
    "domainId": "partnership",
    "intentId": "partnership.source_evidence",
    "sourceNodeId": "knowledge.partnership.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "f70613a84217bcfb4e003bf8b5f9f1782b963dfc45ea76ed2addb4e7780d9bd9"
  },
  {
    "microtopicId": "partnership:partnership.realization",
    "domainId": "partnership",
    "intentId": "partnership.realization",
    "sourceNodeId": "knowledge.partnership.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "f3427d810166cf5711b770e5f6ed48c5150d785f4f2f552c05479ea5fa2441d4"
  },
  {
    "microtopicId": "investment:investment.overview",
    "domainId": "investment",
    "intentId": "investment.overview",
    "sourceNodeId": "knowledge.investment.domain",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "fc56cfdeb62972d2f10239bb37f6579e6d438da7394719470fa3a8b8f7a06f79"
  },
  {
    "microtopicId": "investment:investment.purpose",
    "domainId": "investment",
    "intentId": "investment.purpose",
    "sourceNodeId": "knowledge.investment.microdomainnode.purpose",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "4facd0feef26d40c24360646c3ee596a237bf45f08096f10548e3199a304e8e0"
  },
  {
    "microtopicId": "investment:investment.user_value",
    "domainId": "investment",
    "intentId": "investment.user_value",
    "sourceNodeId": "knowledge.investment.microdomainnode.user-value",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "ef81f881263cc86dc077f48c818ba98d49e5120e1e2f29f94d28fd55318b4d87"
  },
  {
    "microtopicId": "investment:investment.open",
    "domainId": "investment",
    "intentId": "investment.open",
    "sourceNodeId": "knowledge.investment.microdomainnode.open",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "0904a23358ebe44ea8b7145a2ac9c743f6cbea7625aac6142248075edf9565f6"
  },
  {
    "microtopicId": "investment:investment.start",
    "domainId": "investment",
    "intentId": "investment.start",
    "sourceNodeId": "knowledge.investment.microdomainnode.start",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "6a1def2bd7966497cbf9f5399df5e6095e6dbf1b89047622446301b3438383a7"
  },
  {
    "microtopicId": "investment:investment.how_to",
    "domainId": "investment",
    "intentId": "investment.how_to",
    "sourceNodeId": "knowledge.investment.microdomainnode.how-to",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "d22811ae219034d7eea7986cf2c1c3685f6da25e40dc9af68badc7b042976c6d"
  },
  {
    "microtopicId": "investment:investment.availability",
    "domainId": "investment",
    "intentId": "investment.availability",
    "sourceNodeId": "knowledge.investment.microdomainnode.availability",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "6e6fb80f5afc3b388a4b113f62892a941ed777a148fb2c02dae914db23970754"
  },
  {
    "microtopicId": "investment:investment.limitations",
    "domainId": "investment",
    "intentId": "investment.limitations",
    "sourceNodeId": "knowledge.investment.microdomainnode.limitations",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "1ed381e613ba9897f357f7984727b0d43e964b612d63f18f99cb0f32f0fe6b25"
  },
  {
    "microtopicId": "investment:investment.prerequisites",
    "domainId": "investment",
    "intentId": "investment.prerequisites",
    "sourceNodeId": "knowledge.investment.microdomainnode.prerequisites",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "1455558c926bdb95e3dc723da1a949d89dc698e63f9bc99866113c547e8c19f2"
  },
  {
    "microtopicId": "investment:investment.safety",
    "domainId": "investment",
    "intentId": "investment.safety",
    "sourceNodeId": "knowledge.investment.microdomainnode.safety",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "09120df9cbf6b5445764d23ce5579749f8b5bef021d5cfeb6bb086dba6ac38bf"
  },
  {
    "microtopicId": "investment:investment.privacy",
    "domainId": "investment",
    "intentId": "investment.privacy",
    "sourceNodeId": "knowledge.investment.microdomainnode.privacy",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "8314b4717a94ee817c1566d992a082dc8bd47ee8cde8a06e8984c4cad141d5f9"
  },
  {
    "microtopicId": "investment:investment.self_status",
    "domainId": "investment",
    "intentId": "investment.self_status",
    "sourceNodeId": "knowledge.investment.microdomainnode.self-status",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "3edf2ace755cc99a8a2c2e44a1506dab8791c999a38ffacea259a436153a3704"
  },
  {
    "microtopicId": "investment:investment.incident",
    "domainId": "investment",
    "intentId": "investment.incident",
    "sourceNodeId": "knowledge.investment.microdomainnode.incident",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "d8d8f6fbcee0cf02299c6fcb2d96b424991de86fea5b4ba2b5e5e0466eea11aa"
  },
  {
    "microtopicId": "investment:investment.purchase_cost",
    "domainId": "investment",
    "intentId": "investment.purchase_cost",
    "sourceNodeId": "knowledge.investment.microdomainnode.purchase-cost",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "cbad4b93724b87935b5ee07481be26134e2582a9a9bde9e31f5b32cd9ef2a2bf"
  },
  {
    "microtopicId": "investment:investment.earning_credit",
    "domainId": "investment",
    "intentId": "investment.earning_credit",
    "sourceNodeId": "knowledge.investment.microdomainnode.earning-credit",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "af4e2d1c1bd56235ec1299a54ccf64e171f25b73b742c00ee745a857e4b0e3ed"
  },
  {
    "microtopicId": "investment:investment.gift_transfer_sale",
    "domainId": "investment",
    "intentId": "investment.gift_transfer_sale",
    "sourceNodeId": "knowledge.investment.microdomainnode.gift-transfer-sale",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "c7397b7cf9fbcfee0b3ad42ddcf32cd6b5cc61926026e97a6b5f15cf2b322ad7"
  },
  {
    "microtopicId": "investment:investment.developers_mission",
    "domainId": "investment",
    "intentId": "investment.developers_mission",
    "sourceNodeId": "knowledge.investment.microdomainnode.developers-mission",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "ce7447029ed1a83934f50822458464cd07611c67f961bc215a31ad75ca8731f0"
  },
  {
    "microtopicId": "investment:investment.roadmap",
    "domainId": "investment",
    "intentId": "investment.roadmap",
    "sourceNodeId": "knowledge.investment.microdomainnode.roadmap",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "dadee41f896f770bdbc6c84daaf711a8b0f74117e94049a6f84472549d459cb3"
  },
  {
    "microtopicId": "investment:investment.action",
    "domainId": "investment",
    "intentId": "investment.action",
    "sourceNodeId": "knowledge.investment.microdomainnode.action",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "1b906734802f3e57e4efa7f7f8bd0ccc279720191ce690f14cb71b4837ee164b"
  },
  {
    "microtopicId": "investment:investment.capability",
    "domainId": "investment",
    "intentId": "investment.capability",
    "sourceNodeId": "knowledge.investment.capability.verified-knowledge-and-bounded-support-guidance",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "e7e18f5b3b94179cef37e4a399cc88a65622f193d64e49fae0e2522fa74dd8ff"
  },
  {
    "microtopicId": "investment:investment.source_evidence",
    "domainId": "investment",
    "intentId": "investment.source_evidence",
    "sourceNodeId": "knowledge.investment.sourcereceipt.source-evidence",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "1f59f8ff4c9d5c5dca74dae1e3e2be2199616ac0b852dd3a63faa5a0fd4733a3"
  },
  {
    "microtopicId": "investment:investment.realization",
    "domainId": "investment",
    "intentId": "investment.realization",
    "sourceNodeId": "knowledge.investment.realizationplan.realization",
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
    ],
    "availability": "available",
    "contentHash": "c19b3629055fb4a40a64275b246422269b94de488d1c10d51462c3ed7a60a2f8"
  }
]


const REQUIRED_CAPABILITIES=Object.freeze(['EXPLAIN','HOW_TO','NAVIGATE','SHOW','CHECK_READ_ONLY','COMPARE','STATUS','INCIDENT_TRIAGE','CLARIFY','SAFE_ACTION','OPERATOR_HANDOFF'])
function materializeMicrotopic(row){
 const baseSource=Object.freeze([...(row.sourceRefs||[])])
 const capabilities=Object.freeze(Object.fromEntries(REQUIRED_CAPABILITIES.map(id=>[id,Object.freeze({supported:true,mode:id==='CHECK_READ_ONLY'?'read-only':'semantic-plan',policyReason:'canonical-microtopic-capability'})])))
 return Object.freeze({...row,purpose:`Explain and safely handle ${row.microtopicId}.`,terminology:Object.freeze([row.domainId,row.intentId,row.microtopicId]),statusPolicy:'source-bound-availability',sourceNodeIds:Object.freeze([row.sourceNodeId].filter(Boolean)),sourceRequirements:baseSource,safeRoutes:Object.freeze([row.domainId]),constraints:Object.freeze(['no-generative-economic-write','privacy-boundary','source-freshness-when-current']),personalReadEligibility:'intent-and-identity-required',privacyClass:'support-safe',incidentPatterns:Object.freeze([`${row.domainId}:incident`]),rightsEntitlements:Object.freeze([]),negativeCrossDomainExamples:Object.freeze([`do-not-confuse:${row.domainId}:unrelated-domain`]),operatorHandoffPolicy:'policy-and-consent-bound',supportWriteGuarantee:'none',capabilities,sourceRefs:baseSource,contentHash:crypto.createHash('sha256').update(JSON.stringify({...row,capabilities})).digest('hex')})
}
export const QL7_SUPPORT_MICROTOPIC_REQUIRED_CAPABILITIES=REQUIRED_CAPABILITIES
export const QL7_SUPPORT_MICROTOPICS = Object.freeze(rows.map(materializeMicrotopic))
export const QL7_SUPPORT_MICROTOPIC_MANIFEST_HASH=crypto.createHash('sha256').update(JSON.stringify(QL7_SUPPORT_MICROTOPICS)).digest('hex')
export function getQl7SupportMicrotopic(id=''){return QL7_SUPPORT_MICROTOPICS.find(row=>row.microtopicId===String(id))||null}
export function listQl7SupportMicrotopics(domainId=''){return QL7_SUPPORT_MICROTOPICS.filter(row=>!domainId||row.domainId===domainId)}
export function auditQl7SupportMicrotopicOntology(){const failures=[],ids=new Set();let uncovered=0;for(const domainId of QL7_SUPPORT_RELEASE_DOMAIN_ROOTS)if(!QL7_SUPPORT_MICROTOPICS.some(row=>row.domainId===domainId))failures.push(`domain_without_microtopic:${domainId}`);for(const row of QL7_SUPPORT_MICROTOPICS){if(ids.has(row.microtopicId))failures.push(`duplicate_microtopic:${row.microtopicId}`);ids.add(row.microtopicId);if(!row.sourceRefs.length)failures.push(`microtopic_without_source:${row.microtopicId}`);if(!row.contentHash)failures.push(`microtopic_without_hash:${row.microtopicId}`);for(const cap of REQUIRED_CAPABILITIES)if(row.capabilities?.[cap]?.supported!==true){uncovered++;failures.push(`capability:${row.microtopicId}:${cap}`)}}if(QL7_SUPPORT_MICROTOPICS.length<1012)failures.push(`microtopic_floor:${QL7_SUPPORT_MICROTOPICS.length}`);return Object.freeze({ok:!failures.length,microtopicCount:QL7_SUPPORT_MICROTOPICS.length,domainCount:QL7_SUPPORT_RELEASE_DOMAIN_ROOTS.length,requiredCapabilityCount:REQUIRED_CAPABILITIES.length,requiredCapabilityUncovered:uncovered,manifestHash:QL7_SUPPORT_MICROTOPIC_MANIFEST_HASH,failures:Object.freeze(failures)})}
