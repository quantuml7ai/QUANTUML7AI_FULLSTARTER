// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "messenger"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:messenger",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Quantum Messenger",
    "aliasesByLocale": {
      "en": [
        "Quantum Messenger"
      ],
      "ru": [
        "Quantum Messenger"
      ],
      "uk": [
        "Quantum Messenger"
      ],
      "es": [
        "Quantum Messenger"
      ],
      "tr": [
        "Quantum Messenger"
      ],
      "ar": [
        "Quantum Messenger"
      ],
      "zh": [
        "Quantum Messenger"
      ],
      "he": [
        "Quantum Messenger"
      ],
      "de": [
        "Quantum Messenger"
      ],
      "fr": [
        "Quantum Messenger"
      ],
      "it": [
        "Quantum Messenger"
      ],
      "pt": [
        "Quantum Messenger"
      ],
      "pl": [
        "Quantum Messenger"
      ],
      "nl": [
        "Quantum Messenger"
      ],
      "sv": [
        "Quantum Messenger"
      ],
      "no": [
        "Quantum Messenger"
      ],
      "da": [
        "Quantum Messenger"
      ],
      "fi": [
        "Quantum Messenger"
      ],
      "cs": [
        "Quantum Messenger"
      ],
      "sk": [
        "Quantum Messenger"
      ],
      "hu": [
        "Quantum Messenger"
      ],
      "ro": [
        "Quantum Messenger"
      ],
      "bg": [
        "Quantum Messenger"
      ],
      "sr": [
        "Quantum Messenger"
      ],
      "hr": [
        "Quantum Messenger"
      ],
      "sl": [
        "Quantum Messenger"
      ],
      "el": [
        "Quantum Messenger"
      ],
      "ka": [
        "Quantum Messenger"
      ],
      "az": [
        "Quantum Messenger"
      ],
      "kk": [
        "Quantum Messenger"
      ],
      "ja": [
        "Quantum Messenger"
      ],
      "ko": [
        "Quantum Messenger"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
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
    "contentHash": "f5921ae1fea5e737af930d9df5d0313c3141a39a631917a00b5dc80cf501c65d"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "messenger",
    "collections": [
      "dm_messages",
      "dm_thread_entries",
      "dm_mailbox_entries",
      "dm_deliveries"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:messenger",
      "lib/ql7-support/topicActionRegistry.js:messenger",
      "mongo-read:dm_messages",
      "mongo-read:dm_dialogs",
      "mongo-read:dm_read_receipts"
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
