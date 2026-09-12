// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "ads_packages"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:ads_packages",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Ads packages",
    "aliasesByLocale": {
      "en": [
        "Ads packages"
      ],
      "ru": [
        "Рекламные пакеты"
      ],
      "uk": [
        "Рекламні пакети"
      ],
      "es": [
        "Paquetes publicitarios"
      ],
      "tr": [
        "Reklam paketleri"
      ],
      "ar": [
        "باقات الإعلانات"
      ],
      "zh": [
        "广告套餐"
      ],
      "he": [
        "חבילות פרסום"
      ],
      "de": [
        "Werbepakete"
      ],
      "fr": [
        "Forfaits publicitaires"
      ],
      "it": [
        "Pacchetti pubblicitari"
      ],
      "pt": [
        "Pacotes publicitários"
      ],
      "pl": [
        "Pakiety reklamowe"
      ],
      "nl": [
        "Advertentiepakketten"
      ],
      "sv": [
        "Annonspaket"
      ],
      "no": [
        "Annonsepakker"
      ],
      "da": [
        "Annoncepakker"
      ],
      "fi": [
        "Mainospaketit"
      ],
      "cs": [
        "Reklamní balíčky"
      ],
      "sk": [
        "Reklamné balíky"
      ],
      "hu": [
        "Hirdetési csomagok"
      ],
      "ro": [
        "Pachete publicitare"
      ],
      "bg": [
        "Рекламни пакети"
      ],
      "sr": [
        "Reklamni paketi"
      ],
      "hr": [
        "Oglasni paketi"
      ],
      "sl": [
        "Oglaševalski paketi"
      ],
      "el": [
        "Διαφημιστικά πακέτα"
      ],
      "ka": [
        "სარეკლამო პაკეტები"
      ],
      "az": [
        "Reklam paketləri"
      ],
      "kk": [
        "Жарнама пакеттері"
      ],
      "ja": [
        "広告パッケージ"
      ],
      "ko": [
        "광고 패키지"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ],
    "requiredEvidenceTypes": [
      "source_receipt",
      "read_adapter_receipt"
    ],
    "forbiddenClaims": [
      "unsourced_roadmap_date",
      "unsupported_availability_claim",
      "unverified_secondary_domain_insertion"
    ],
    "privacyClass": "user_safe",
    "ownerId": "ql7-support.ontology",
    "contentHash": "06a63aac458d5e1d7069a458227f63e7f38b3ef1c3bb1cef79502f682acabc46"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "ads_packages",
    "collections": [
      "ads_kv",
      "ads_sets",
      "ads_counters",
      "ads_analytics"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_packages",
      "lib/ql7-support/topicActionRegistry.js:ads_packages",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
    ]
  }
)

export const nodes = Object.freeze([domainNode])
export const edges = Object.freeze([])

export default Object.freeze({
  domainId: DOMAIN_ID,
  nodes,
  edges,
  sourceRequirements,
})
