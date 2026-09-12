// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "academy"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:academy",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Academy",
    "aliasesByLocale": {
      "en": [
        "Academy"
      ],
      "ru": [
        "Академия"
      ],
      "uk": [
        "Академія"
      ],
      "es": [
        "Academia"
      ],
      "tr": [
        "Akademi"
      ],
      "ar": [
        "الأكاديمية"
      ],
      "zh": [
        "学院"
      ],
      "he": [
        "האקדמיה"
      ],
      "de": [
        "Akademie"
      ],
      "fr": [
        "Académie"
      ],
      "it": [
        "Accademia"
      ],
      "pt": [
        "Academia"
      ],
      "pl": [
        "Akademia"
      ],
      "nl": [
        "Academie"
      ],
      "sv": [
        "Akademi"
      ],
      "no": [
        "Akademi"
      ],
      "da": [
        "Akademi"
      ],
      "fi": [
        "Akatemia"
      ],
      "cs": [
        "Akademie"
      ],
      "sk": [
        "Akadémia"
      ],
      "hu": [
        "Akadémia"
      ],
      "ro": [
        "Academie"
      ],
      "bg": [
        "Академия"
      ],
      "sr": [
        "Akademija"
      ],
      "hr": [
        "Akademija"
      ],
      "sl": [
        "Akademija"
      ],
      "el": [
        "Ακαδημία"
      ],
      "ka": [
        "აკადემია"
      ],
      "az": [
        "Akademiya"
      ],
      "kk": [
        "Академия"
      ],
      "ja": [
        "アカデミー"
      ],
      "ko": [
        "아카데미"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
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
    "contentHash": "ae5568c10884adc8048c560f021d6ff4ae6fb4b7c070b0574e32711488f27670"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "academy",
    "collections": [
      "academy_exams"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy",
      "lib/ql7-support/topicActionRegistry.js:academy",
      "mongo-read:academy_progress",
      "mongo-read:academy_courses"
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
