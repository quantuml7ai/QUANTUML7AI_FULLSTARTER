// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "vip"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:vip",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "VIP Plus",
    "aliasesByLocale": {
      "en": [
        "VIP Plus"
      ],
      "ru": [
        "VIP Plus"
      ],
      "uk": [
        "VIP Plus"
      ],
      "es": [
        "VIP Plus"
      ],
      "tr": [
        "VIP Plus"
      ],
      "ar": [
        "VIP Plus"
      ],
      "zh": [
        "VIP Plus"
      ],
      "he": [
        "VIP Plus"
      ],
      "de": [
        "VIP Plus"
      ],
      "fr": [
        "VIP Plus"
      ],
      "it": [
        "VIP Plus"
      ],
      "pt": [
        "VIP Plus"
      ],
      "pl": [
        "VIP Plus"
      ],
      "nl": [
        "VIP Plus"
      ],
      "sv": [
        "VIP Plus"
      ],
      "no": [
        "VIP Plus"
      ],
      "da": [
        "VIP Plus"
      ],
      "fi": [
        "VIP Plus"
      ],
      "cs": [
        "VIP Plus"
      ],
      "sk": [
        "VIP Plus"
      ],
      "hu": [
        "VIP Plus"
      ],
      "ro": [
        "VIP Plus"
      ],
      "bg": [
        "VIP Plus"
      ],
      "sr": [
        "VIP Plus"
      ],
      "hr": [
        "VIP Plus"
      ],
      "sl": [
        "VIP Plus"
      ],
      "el": [
        "VIP Plus"
      ],
      "ka": [
        "VIP Plus"
      ],
      "az": [
        "VIP Plus"
      ],
      "kk": [
        "VIP Plus"
      ],
      "ja": [
        "VIP Plus"
      ],
      "ko": [
        "VIP Plus"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
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
    "contentHash": "41adc4e3bfda4f2367290d2f56770ac35535b5dacb449d79ed8696cadfc39c05"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "vip",
    "collections": [
      "profiles",
      "vip_payment_dedupe"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:vip",
      "lib/ql7-support/topicActionRegistry.js:vip",
      "mongo-read:vip_subscriptions",
      "mongo-read:subscription_status",
      "mongo-read:wallet_sessions"
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
