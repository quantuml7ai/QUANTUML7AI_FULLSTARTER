// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "exchange_ai"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:exchange_ai",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Exchange AI analytics",
    "aliasesByLocale": {
      "en": [
        "Exchange AI analytics"
      ],
      "ru": [
        "Аналитика Exchange AI"
      ],
      "uk": [
        "Аналітика Exchange AI"
      ],
      "es": [
        "Analítica de Exchange AI"
      ],
      "tr": [
        "Exchange AI analizi"
      ],
      "ar": [
        "تحليلات Exchange AI"
      ],
      "zh": [
        "Exchange AI 分析"
      ],
      "he": [
        "ניתוח Exchange AI"
      ],
      "de": [
        "Exchange AI"
      ],
      "fr": [
        "Exchange AI"
      ],
      "it": [
        "Exchange AI"
      ],
      "pt": [
        "Exchange AI"
      ],
      "pl": [
        "Exchange AI"
      ],
      "nl": [
        "Exchange AI"
      ],
      "sv": [
        "Exchange AI"
      ],
      "no": [
        "Exchange AI"
      ],
      "da": [
        "Exchange AI"
      ],
      "fi": [
        "Exchange AI"
      ],
      "cs": [
        "Exchange AI"
      ],
      "sk": [
        "Exchange AI"
      ],
      "hu": [
        "Exchange AI"
      ],
      "ro": [
        "Exchange AI"
      ],
      "bg": [
        "Exchange AI"
      ],
      "sr": [
        "Exchange AI"
      ],
      "hr": [
        "Exchange AI"
      ],
      "sl": [
        "Exchange AI"
      ],
      "el": [
        "Exchange AI"
      ],
      "ka": [
        "Exchange AI"
      ],
      "az": [
        "Exchange AI"
      ],
      "kk": [
        "Exchange AI"
      ],
      "ja": [
        "Exchange AI"
      ],
      "ko": [
        "Exchange AI"
      ]
    },
    "parentIds": [],
    "status": "partially_available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
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
    "contentHash": "fdebc9d10bf60d1845e401099b5eefe9d5c40a857ed0a169441e80c0b31fba35"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "exchange_ai",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange_ai",
      "lib/ql7-support/topicActionRegistry.js:exchange_ai",
      "mongo-read:ai_entitlements",
      "mongo-read:ai_quota_usage",
      "mongo-read:market_snapshots"
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
