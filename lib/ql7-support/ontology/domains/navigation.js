// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "navigation"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:navigation",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Navigation",
    "aliasesByLocale": {
      "en": [
        "Navigation"
      ],
      "ru": [
        "Навигация"
      ],
      "uk": [
        "Навігація"
      ],
      "es": [
        "Navegación"
      ],
      "tr": [
        "Gezinme"
      ],
      "ar": [
        "التنقل"
      ],
      "zh": [
        "导航"
      ],
      "he": [
        "ניווט"
      ],
      "de": [
        "Navigation"
      ],
      "fr": [
        "Navigation"
      ],
      "it": [
        "Navigazione"
      ],
      "pt": [
        "Navegação"
      ],
      "pl": [
        "Nawigacja"
      ],
      "nl": [
        "Navigatie"
      ],
      "sv": [
        "Navigering"
      ],
      "no": [
        "Navigasjon"
      ],
      "da": [
        "Navigation"
      ],
      "fi": [
        "Navigointi"
      ],
      "cs": [
        "Navigace"
      ],
      "sk": [
        "Navigácia"
      ],
      "hu": [
        "Navigáció"
      ],
      "ro": [
        "Navigare"
      ],
      "bg": [
        "Навигация"
      ],
      "sr": [
        "Navigacija"
      ],
      "hr": [
        "Navigacija"
      ],
      "sl": [
        "Krmarjenje"
      ],
      "el": [
        "Πλοήγηση"
      ],
      "ka": [
        "ნავიგაცია"
      ],
      "az": [
        "Naviqasiya"
      ],
      "kk": [
        "Навигация"
      ],
      "ja": [
        "ナビゲーション"
      ],
      "ko": [
        "탐색"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
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
    "contentHash": "28601102b980c3134d6da74e8c204409e9e447d4e5cb57485750a2491ef322f6"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "navigation",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:navigation",
      "lib/ql7-support/topicActionRegistry.js:navigation",
      "mongo-read:site_runtime_state"
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
