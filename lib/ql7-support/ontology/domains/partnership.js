// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "partnership"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:partnership",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Partnership",
    "aliasesByLocale": {
      "en": [
        "Partnership"
      ],
      "ru": [
        "Партнёрство"
      ],
      "uk": [
        "Партнерство"
      ],
      "es": [
        "Colaboración"
      ],
      "tr": [
        "Ortaklık"
      ],
      "ar": [
        "الشراكة"
      ],
      "zh": [
        "合作"
      ],
      "he": [
        "שותפות"
      ],
      "de": [
        "Partnership"
      ],
      "fr": [
        "Partnership"
      ],
      "it": [
        "Partnership"
      ],
      "pt": [
        "Partnership"
      ],
      "pl": [
        "Partnership"
      ],
      "nl": [
        "Partnership"
      ],
      "sv": [
        "Partnership"
      ],
      "no": [
        "Partnership"
      ],
      "da": [
        "Partnership"
      ],
      "fi": [
        "Partnership"
      ],
      "cs": [
        "Partnership"
      ],
      "sk": [
        "Partnership"
      ],
      "hu": [
        "Partnership"
      ],
      "ro": [
        "Partnership"
      ],
      "bg": [
        "Partnership"
      ],
      "sr": [
        "Partnership"
      ],
      "hr": [
        "Partnership"
      ],
      "sl": [
        "Partnership"
      ],
      "el": [
        "Partnership"
      ],
      "ka": [
        "Partnership"
      ],
      "az": [
        "Partnership"
      ],
      "kk": [
        "Partnership"
      ],
      "ja": [
        "Partnership"
      ],
      "ko": [
        "Partnership"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
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
    "contentHash": "6fd2cd8d9794032cfb94163bd311e1a9d543bdc12c1362c1cc45762c94079a2f"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "partnership",
    "collections": [
      "ql7_support_cases"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:partnership",
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
