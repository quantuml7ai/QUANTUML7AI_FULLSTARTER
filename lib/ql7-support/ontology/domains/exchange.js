// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "exchange"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:exchange",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Quantum Exchange",
    "aliasesByLocale": {
      "en": [
        "Quantum Exchange"
      ],
      "ru": [
        "Quantum Exchange"
      ],
      "uk": [
        "Quantum Exchange"
      ],
      "es": [
        "Quantum Exchange"
      ],
      "tr": [
        "Quantum Exchange"
      ],
      "ar": [
        "Quantum Exchange"
      ],
      "zh": [
        "Quantum Exchange"
      ],
      "he": [
        "Quantum Exchange"
      ],
      "de": [
        "Quantum Exchange"
      ],
      "fr": [
        "Quantum Exchange"
      ],
      "it": [
        "Quantum Exchange"
      ],
      "pt": [
        "Quantum Exchange"
      ],
      "pl": [
        "Quantum Exchange"
      ],
      "nl": [
        "Quantum Exchange"
      ],
      "sv": [
        "Quantum Exchange"
      ],
      "no": [
        "Quantum Exchange"
      ],
      "da": [
        "Quantum Exchange"
      ],
      "fi": [
        "Quantum Exchange"
      ],
      "cs": [
        "Quantum Exchange"
      ],
      "sk": [
        "Quantum Exchange"
      ],
      "hu": [
        "Quantum Exchange"
      ],
      "ro": [
        "Quantum Exchange"
      ],
      "bg": [
        "Quantum Exchange"
      ],
      "sr": [
        "Quantum Exchange"
      ],
      "hr": [
        "Quantum Exchange"
      ],
      "sl": [
        "Quantum Exchange"
      ],
      "el": [
        "Quantum Exchange"
      ],
      "ka": [
        "Quantum Exchange"
      ],
      "az": [
        "Quantum Exchange"
      ],
      "kk": [
        "Quantum Exchange"
      ],
      "ja": [
        "Quantum Exchange"
      ],
      "ko": [
        "Quantum Exchange"
      ]
    },
    "parentIds": [],
    "status": "partially_available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
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
    "contentHash": "dfa5f3e6c0f22381a13c6db2ab959b5968414ce40b0eb3b966af9f437a43bdcf"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "exchange",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:exchange",
      "lib/ql7-support/topicActionRegistry.js:exchange",
      "mongo-read:exchange_runtime_state",
      "mongo-read:market_snapshots",
      "mongo-read:system_status_events"
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
