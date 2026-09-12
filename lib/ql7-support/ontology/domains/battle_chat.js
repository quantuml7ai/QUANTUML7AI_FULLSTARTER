// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "battle_chat"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:battle_chat",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Battle Chat",
    "aliasesByLocale": {
      "en": [
        "Battle Chat"
      ],
      "ru": [
        "Battle Chat"
      ],
      "uk": [
        "Battle Chat"
      ],
      "es": [
        "Battle Chat"
      ],
      "tr": [
        "Battle Chat"
      ],
      "ar": [
        "Battle Chat"
      ],
      "zh": [
        "Battle Chat"
      ],
      "he": [
        "Battle Chat"
      ],
      "de": [
        "Battle Chat"
      ],
      "fr": [
        "Battle Chat"
      ],
      "it": [
        "Battle Chat"
      ],
      "pt": [
        "Battle Chat"
      ],
      "pl": [
        "Battle Chat"
      ],
      "nl": [
        "Battle Chat"
      ],
      "sv": [
        "Battle Chat"
      ],
      "no": [
        "Battle Chat"
      ],
      "da": [
        "Battle Chat"
      ],
      "fi": [
        "Battle Chat"
      ],
      "cs": [
        "Battle Chat"
      ],
      "sk": [
        "Battle Chat"
      ],
      "hu": [
        "Battle Chat"
      ],
      "ro": [
        "Battle Chat"
      ],
      "bg": [
        "Battle Chat"
      ],
      "sr": [
        "Battle Chat"
      ],
      "hr": [
        "Battle Chat"
      ],
      "sl": [
        "Battle Chat"
      ],
      "el": [
        "Battle Chat"
      ],
      "ka": [
        "Battle Chat"
      ],
      "az": [
        "Battle Chat"
      ],
      "kk": [
        "Battle Chat"
      ],
      "ja": [
        "Battle Chat"
      ],
      "ko": [
        "Battle Chat"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
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
    "contentHash": "89f1f4a59bc1513c7a876681686e894acb1bd3ac98f0f70bd3cbe44fade8fd39"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "battle_chat",
    "collections": [
      "battlecoin_chat_messages",
      "battlecoin_chat_likes"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:battle_chat",
      "lib/ql7-support/topicActionRegistry.js:battle_chat",
      "mongo-read:battlecoin_chat_messages",
      "mongo-read:battlecoin_chat_reactions",
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
