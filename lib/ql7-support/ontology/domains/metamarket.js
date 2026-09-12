// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "metamarket"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:metamarket",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "MetaMarket",
    "aliasesByLocale": {
      "en": [
        "MetaMarket"
      ],
      "ru": [
        "MetaMarket"
      ],
      "uk": [
        "MetaMarket"
      ],
      "es": [
        "MetaMarket"
      ],
      "tr": [
        "MetaMarket"
      ],
      "ar": [
        "MetaMarket"
      ],
      "zh": [
        "MetaMarket"
      ],
      "he": [
        "MetaMarket"
      ],
      "de": [
        "MetaMarket"
      ],
      "fr": [
        "MetaMarket"
      ],
      "it": [
        "MetaMarket"
      ],
      "pt": [
        "MetaMarket"
      ],
      "pl": [
        "MetaMarket"
      ],
      "nl": [
        "MetaMarket"
      ],
      "sv": [
        "MetaMarket"
      ],
      "no": [
        "MetaMarket"
      ],
      "da": [
        "MetaMarket"
      ],
      "fi": [
        "MetaMarket"
      ],
      "cs": [
        "MetaMarket"
      ],
      "sk": [
        "MetaMarket"
      ],
      "hu": [
        "MetaMarket"
      ],
      "ro": [
        "MetaMarket"
      ],
      "bg": [
        "MetaMarket"
      ],
      "sr": [
        "MetaMarket"
      ],
      "hr": [
        "MetaMarket"
      ],
      "sl": [
        "MetaMarket"
      ],
      "el": [
        "MetaMarket"
      ],
      "ka": [
        "MetaMarket"
      ],
      "az": [
        "MetaMarket"
      ],
      "kk": [
        "MetaMarket"
      ],
      "ja": [
        "MetaMarket"
      ],
      "ko": [
        "MetaMarket"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
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
    "contentHash": "581fa4f8e5a62579b8a49286cdb2ec21e0146370a3aab01f0b591afc10e9c198"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "metamarket",
    "collections": [
      "metamarket_item_states",
      "metamarket_owners",
      "metamarket_events",
      "metamarket_audit"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metamarket",
      "lib/ql7-support/topicActionRegistry.js:metamarket",
      "mongo-read:metamarket_user_items",
      "mongo-read:metamarket_transactions",
      "mongo-read:metamarket_event_indexes"
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
