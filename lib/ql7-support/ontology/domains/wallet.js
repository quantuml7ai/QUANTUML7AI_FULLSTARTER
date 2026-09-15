// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "wallet"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:wallet",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Quantum Wallet",
    "aliasesByLocale": {
      "en": [
        "Quantum Wallet"
      ],
      "ru": [
        "Quantum Wallet"
      ],
      "uk": [
        "Quantum Wallet"
      ],
      "es": [
        "Quantum Wallet"
      ],
      "tr": [
        "Quantum Wallet"
      ],
      "ar": [
        "Quantum Wallet"
      ],
      "zh": [
        "Quantum Wallet"
      ],
      "he": [
        "Quantum Wallet"
      ],
      "de": [
        "Quantum Wallet"
      ],
      "fr": [
        "Quantum Wallet"
      ],
      "it": [
        "Quantum Wallet"
      ],
      "pt": [
        "Quantum Wallet"
      ],
      "pl": [
        "Quantum Wallet"
      ],
      "nl": [
        "Quantum Wallet"
      ],
      "sv": [
        "Quantum Wallet"
      ],
      "no": [
        "Quantum Wallet"
      ],
      "da": [
        "Quantum Wallet"
      ],
      "fi": [
        "Quantum Wallet"
      ],
      "cs": [
        "Quantum Wallet"
      ],
      "sk": [
        "Quantum Wallet"
      ],
      "hu": [
        "Quantum Wallet"
      ],
      "ro": [
        "Quantum Wallet"
      ],
      "bg": [
        "Quantum Wallet"
      ],
      "sr": [
        "Quantum Wallet"
      ],
      "hr": [
        "Quantum Wallet"
      ],
      "sl": [
        "Quantum Wallet"
      ],
      "el": [
        "Quantum Wallet"
      ],
      "ka": [
        "Quantum Wallet"
      ],
      "az": [
        "Quantum Wallet"
      ],
      "kk": [
        "Quantum Wallet"
      ],
      "ja": [
        "Quantum Wallet"
      ],
      "ko": [
        "Quantum Wallet"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
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
    "contentHash": "fcbe3f5f27fc7448fc9491a03f3eb96f789e301dfe7519647eef315e659df837"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "wallet",
    "collections": [
      "profiles",
      "qcoin_accounts"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:wallet",
      "lib/ql7-support/topicActionRegistry.js:wallet",
      "mongo-read:wallet_sessions",
      "mongo-read:qcoin_accounts",
      "mongo-read:profile_aliases"
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
