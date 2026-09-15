// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "gameverse"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:gameverse",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Gameverse",
    "aliasesByLocale": {
      "en": [
        "Gameverse"
      ],
      "ru": [
        "Gameverse"
      ],
      "uk": [
        "Gameverse"
      ],
      "es": [
        "Gameverse"
      ],
      "tr": [
        "Gameverse"
      ],
      "ar": [
        "Gameverse"
      ],
      "zh": [
        "Gameverse"
      ],
      "he": [
        "Gameverse"
      ],
      "de": [
        "Gameverse"
      ],
      "fr": [
        "Gameverse"
      ],
      "it": [
        "Gameverse"
      ],
      "pt": [
        "Gameverse"
      ],
      "pl": [
        "Gameverse"
      ],
      "nl": [
        "Gameverse"
      ],
      "sv": [
        "Gameverse"
      ],
      "no": [
        "Gameverse"
      ],
      "da": [
        "Gameverse"
      ],
      "fi": [
        "Gameverse"
      ],
      "cs": [
        "Gameverse"
      ],
      "sk": [
        "Gameverse"
      ],
      "hu": [
        "Gameverse"
      ],
      "ro": [
        "Gameverse"
      ],
      "bg": [
        "Gameverse"
      ],
      "sr": [
        "Gameverse"
      ],
      "hr": [
        "Gameverse"
      ],
      "sl": [
        "Gameverse"
      ],
      "el": [
        "Gameverse"
      ],
      "ka": [
        "Gameverse"
      ],
      "az": [
        "Gameverse"
      ],
      "kk": [
        "Gameverse"
      ],
      "ja": [
        "Gameverse"
      ],
      "ko": [
        "Gameverse"
      ]
    },
    "parentIds": [],
    "status": "partially_available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
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
    "contentHash": "3ff744bf043b2b782602c34ffec9ef6030d31a95e4df696239b2ee8c4ef415a0"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "gameverse",
    "collections": [
      "qcoin_ledger"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:gameverse",
      "lib/ql7-support/topicActionRegistry.js:gameverse",
      "mongo-read:game_sessions",
      "mongo-read:quest_progress",
      "mongo-read:qcoin_ledger"
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
