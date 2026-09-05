// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "qcoin"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:qcoin",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "QCoin",
    "aliasesByLocale": {
      "en": [
        "QCoin"
      ],
      "ru": [
        "QCoin"
      ],
      "uk": [
        "QCoin"
      ],
      "es": [
        "QCoin"
      ],
      "tr": [
        "QCoin"
      ],
      "ar": [
        "QCoin"
      ],
      "zh": [
        "QCoin"
      ],
      "he": [
        "QCoin"
      ],
      "de": [
        "QCoin"
      ],
      "fr": [
        "QCoin"
      ],
      "it": [
        "QCoin"
      ],
      "pt": [
        "QCoin"
      ],
      "pl": [
        "QCoin"
      ],
      "nl": [
        "QCoin"
      ],
      "sv": [
        "QCoin"
      ],
      "no": [
        "QCoin"
      ],
      "da": [
        "QCoin"
      ],
      "fi": [
        "QCoin"
      ],
      "cs": [
        "QCoin"
      ],
      "sk": [
        "QCoin"
      ],
      "hu": [
        "QCoin"
      ],
      "ro": [
        "QCoin"
      ],
      "bg": [
        "QCoin"
      ],
      "sr": [
        "QCoin"
      ],
      "hr": [
        "QCoin"
      ],
      "sl": [
        "QCoin"
      ],
      "el": [
        "QCoin"
      ],
      "ka": [
        "QCoin"
      ],
      "az": [
        "QCoin"
      ],
      "kk": [
        "QCoin"
      ],
      "ja": [
        "QCoin"
      ],
      "ko": [
        "QCoin"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
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
    "contentHash": "e4ff6729c6a0c2d172062dec073f0b342b22f99c5569bd68855e88172b89dcf0"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "qcoin",
    "collections": [
      "qcoin_topup_invoices",
      "qcoin_topup_events",
      "qcoin_ledger",
      "qcoin_accounts"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:qcoin",
      "lib/ql7-support/topicActionRegistry.js:qcoin",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:qcoin_topup_events",
      "mongo-read:qcoin_ledger",
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
