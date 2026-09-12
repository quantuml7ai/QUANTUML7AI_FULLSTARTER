// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "moderation"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:moderation",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Moderation",
    "aliasesByLocale": {
      "en": [
        "Moderation"
      ],
      "ru": [
        "Модерация"
      ],
      "uk": [
        "Модерація"
      ],
      "es": [
        "Moderación"
      ],
      "tr": [
        "Moderasyon"
      ],
      "ar": [
        "الإشراف"
      ],
      "zh": [
        "内容审核"
      ],
      "he": [
        "פיקוח"
      ],
      "de": [
        "Moderation"
      ],
      "fr": [
        "Modération"
      ],
      "it": [
        "Moderazione"
      ],
      "pt": [
        "Moderação"
      ],
      "pl": [
        "Moderacja"
      ],
      "nl": [
        "Moderatie"
      ],
      "sv": [
        "Moderering"
      ],
      "no": [
        "Moderering"
      ],
      "da": [
        "Moderation"
      ],
      "fi": [
        "Moderointi"
      ],
      "cs": [
        "Moderování"
      ],
      "sk": [
        "Moderovanie"
      ],
      "hu": [
        "Moderálás"
      ],
      "ro": [
        "Moderare"
      ],
      "bg": [
        "Модерация"
      ],
      "sr": [
        "Moderacija"
      ],
      "hr": [
        "Moderiranje"
      ],
      "sl": [
        "Moderiranje"
      ],
      "el": [
        "Εποπτεία"
      ],
      "ka": [
        "მოდერაცია"
      ],
      "az": [
        "Moderasiya"
      ],
      "kk": [
        "Модерация"
      ],
      "ja": [
        "モデレーション"
      ],
      "ko": [
        "관리"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
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
    "privacyClass": "restricted",
    "ownerId": "ql7-support.ontology",
    "contentHash": "6e49614745bfd0dbc89d9c45b79e9e69690ab523cdcefb0585c9165f4ec51165"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "moderation",
    "collections": [
      "forum_admin_state",
      "forum_core_change_events",
      "forum_core_posts"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:moderation",
      "lib/ql7-support/topicActionRegistry.js:moderation",
      "mongo-read:forum_reports",
      "mongo-read:forum_moderation_actions",
      "mongo-read:account_restrictions"
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
