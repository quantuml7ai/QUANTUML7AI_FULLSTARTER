// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "battlecoin"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:battlecoin",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "BattleCoin",
    "aliasesByLocale": {
      "en": [
        "BattleCoin"
      ],
      "ru": [
        "BattleCoin"
      ],
      "uk": [
        "BattleCoin"
      ],
      "es": [
        "BattleCoin"
      ],
      "tr": [
        "BattleCoin"
      ],
      "ar": [
        "BattleCoin"
      ],
      "zh": [
        "BattleCoin"
      ],
      "he": [
        "BattleCoin"
      ],
      "de": [
        "BattleCoin"
      ],
      "fr": [
        "BattleCoin"
      ],
      "it": [
        "BattleCoin"
      ],
      "pt": [
        "BattleCoin"
      ],
      "pl": [
        "BattleCoin"
      ],
      "nl": [
        "BattleCoin"
      ],
      "sv": [
        "BattleCoin"
      ],
      "no": [
        "BattleCoin"
      ],
      "da": [
        "BattleCoin"
      ],
      "fi": [
        "BattleCoin"
      ],
      "cs": [
        "BattleCoin"
      ],
      "sk": [
        "BattleCoin"
      ],
      "hu": [
        "BattleCoin"
      ],
      "ro": [
        "BattleCoin"
      ],
      "bg": [
        "BattleCoin"
      ],
      "sr": [
        "BattleCoin"
      ],
      "hr": [
        "BattleCoin"
      ],
      "sl": [
        "BattleCoin"
      ],
      "el": [
        "BattleCoin"
      ],
      "ka": [
        "BattleCoin"
      ],
      "az": [
        "BattleCoin"
      ],
      "kk": [
        "BattleCoin"
      ],
      "ja": [
        "BattleCoin"
      ],
      "ko": [
        "BattleCoin"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
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
    "contentHash": "d255d3374d301737f81627ab4076a1f12c71c23a2e2f8bff42afacf569e8407c"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "battlecoin",
    "collections": [
      "battlecoin_active_orders",
      "battlecoin_orders",
      "qcoin_accounts"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battlecoin",
      "lib/ql7-support/topicActionRegistry.js:battlecoin",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:battlecoin_order_histories",
      "mongo-read:battlecoin_counters",
      "mongo-read:qcoin_accounts"
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
