// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "investment"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:investment",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Investment proposal",
    "aliasesByLocale": {
      "en": [
        "Investment proposal"
      ],
      "ru": [
        "Инвестиционное предложение"
      ],
      "uk": [
        "Інвестиційна пропозиція"
      ],
      "es": [
        "Propuesta de inversión"
      ],
      "tr": [
        "Yatırım teklifi"
      ],
      "ar": [
        "اقتراح استثمار"
      ],
      "zh": [
        "投资提案"
      ],
      "he": [
        "הצעת השקעה"
      ],
      "de": [
        "Investment proposal"
      ],
      "fr": [
        "Investment proposal"
      ],
      "it": [
        "Investment proposal"
      ],
      "pt": [
        "Investment proposal"
      ],
      "pl": [
        "Investment proposal"
      ],
      "nl": [
        "Investment proposal"
      ],
      "sv": [
        "Investment proposal"
      ],
      "no": [
        "Investment proposal"
      ],
      "da": [
        "Investment proposal"
      ],
      "fi": [
        "Investment proposal"
      ],
      "cs": [
        "Investment proposal"
      ],
      "sk": [
        "Investment proposal"
      ],
      "hu": [
        "Investment proposal"
      ],
      "ro": [
        "Investment proposal"
      ],
      "bg": [
        "Investment proposal"
      ],
      "sr": [
        "Investment proposal"
      ],
      "hr": [
        "Investment proposal"
      ],
      "sl": [
        "Investment proposal"
      ],
      "el": [
        "Investment proposal"
      ],
      "ka": [
        "Investment proposal"
      ],
      "az": [
        "Investment proposal"
      ],
      "kk": [
        "Investment proposal"
      ],
      "ja": [
        "Investment proposal"
      ],
      "ko": [
        "Investment proposal"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
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
    "contentHash": "c30663798323a604d5daebc98c510ceb87e363ca8b8099c1d7adc36cf0e5dc87"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "investment",
    "collections": [
      "ql7_support_cases"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:investment",
      "mongo-read:ql7_support_cases",
      "mongo-read:support_email_outbox"
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
