// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "telegram"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:telegram",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Telegram Mini App",
    "aliasesByLocale": {
      "en": [
        "Telegram Mini App"
      ],
      "ru": [
        "Telegram Mini App"
      ],
      "uk": [
        "Telegram Mini App"
      ],
      "es": [
        "Telegram Mini App"
      ],
      "tr": [
        "Telegram Mini App"
      ],
      "ar": [
        "Telegram Mini App"
      ],
      "zh": [
        "Telegram Mini App"
      ],
      "he": [
        "Telegram Mini App"
      ],
      "de": [
        "Telegram Mini App"
      ],
      "fr": [
        "Telegram Mini App"
      ],
      "it": [
        "Telegram Mini App"
      ],
      "pt": [
        "Telegram Mini App"
      ],
      "pl": [
        "Telegram Mini App"
      ],
      "nl": [
        "Telegram Mini App"
      ],
      "sv": [
        "Telegram Mini App"
      ],
      "no": [
        "Telegram Mini App"
      ],
      "da": [
        "Telegram Mini App"
      ],
      "fi": [
        "Telegram Mini App"
      ],
      "cs": [
        "Telegram Mini App"
      ],
      "sk": [
        "Telegram Mini App"
      ],
      "hu": [
        "Telegram Mini App"
      ],
      "ro": [
        "Telegram Mini App"
      ],
      "bg": [
        "Telegram Mini App"
      ],
      "sr": [
        "Telegram Mini App"
      ],
      "hr": [
        "Telegram Mini App"
      ],
      "sl": [
        "Telegram Mini App"
      ],
      "el": [
        "Telegram Mini App"
      ],
      "ka": [
        "Telegram Mini App"
      ],
      "az": [
        "Telegram Mini App"
      ],
      "kk": [
        "Telegram Mini App"
      ],
      "ja": [
        "Telegram Mini App"
      ],
      "ko": [
        "Telegram Mini App"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
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
    "contentHash": "d356e4c134bbca5365c93d0e2f653c052114892b521bf55da9e646dd64120bb0"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "telegram",
    "collections": [
      "account_aliases",
      "profiles"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:telegram",
      "lib/ql7-support/topicActionRegistry.js:telegram",
      "mongo-read:telegram_links",
      "mongo-read:wallet_sessions",
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
