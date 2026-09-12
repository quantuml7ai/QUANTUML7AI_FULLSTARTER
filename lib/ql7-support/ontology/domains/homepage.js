// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "homepage"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:homepage",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Homepage and CryptoRadar",
    "aliasesByLocale": {
      "en": [
        "Homepage and CryptoRadar"
      ],
      "ru": [
        "Главная страница и CryptoRadar"
      ],
      "uk": [
        "Головна сторінка та CryptoRadar"
      ],
      "es": [
        "Página principal y CryptoRadar"
      ],
      "tr": [
        "Ana sayfa ve CryptoRadar"
      ],
      "ar": [
        "الصفحة الرئيسية وCryptoRadar"
      ],
      "zh": [
        "主页与 CryptoRadar"
      ],
      "he": [
        "דף הבית ו-CryptoRadar"
      ],
      "de": [
        "CryptoRadar"
      ],
      "fr": [
        "CryptoRadar"
      ],
      "it": [
        "CryptoRadar"
      ],
      "pt": [
        "CryptoRadar"
      ],
      "pl": [
        "CryptoRadar"
      ],
      "nl": [
        "CryptoRadar"
      ],
      "sv": [
        "CryptoRadar"
      ],
      "no": [
        "CryptoRadar"
      ],
      "da": [
        "CryptoRadar"
      ],
      "fi": [
        "CryptoRadar"
      ],
      "cs": [
        "CryptoRadar"
      ],
      "sk": [
        "CryptoRadar"
      ],
      "hu": [
        "CryptoRadar"
      ],
      "ro": [
        "CryptoRadar"
      ],
      "bg": [
        "CryptoRadar"
      ],
      "sr": [
        "CryptoRadar"
      ],
      "hr": [
        "CryptoRadar"
      ],
      "sl": [
        "CryptoRadar"
      ],
      "el": [
        "CryptoRadar"
      ],
      "ka": [
        "CryptoRadar"
      ],
      "az": [
        "CryptoRadar"
      ],
      "kk": [
        "CryptoRadar"
      ],
      "ja": [
        "CryptoRadar"
      ],
      "ko": [
        "CryptoRadar"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
    ],
    "requiredEvidenceTypes": [
      "source_receipt"
    ],
    "forbiddenClaims": [
      "unsourced_roadmap_date",
      "unsupported_availability_claim",
      "unverified_secondary_domain_insertion"
    ],
    "privacyClass": "user_safe",
    "ownerId": "ql7-support.ontology",
    "contentHash": "7ee18f2ba0265c5e984d941cb82238e49b69d866a513be6391848c6a610e9df9"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "homepage",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:homepage",
      "lib/ql7-support/topicActionRegistry.js:homepage",
      "mongo-read:crypto_news_cache",
      "mongo-read:market_snapshots",
      "mongo-read:runtime_mode_events"
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
