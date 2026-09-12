// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "platform"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:platform",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Quantum L7 AI platform",
    "aliasesByLocale": {
      "en": [
        "Quantum L7 AI platform"
      ],
      "ru": [
        "Платформа QUANTUM L7 AI"
      ],
      "uk": [
        "Платформа QUANTUM L7 AI"
      ],
      "es": [
        "Plataforma QUANTUM L7 AI"
      ],
      "tr": [
        "QUANTUM L7 AI platformu"
      ],
      "ar": [
        "منصة QUANTUM L7 AI"
      ],
      "zh": [
        "QUANTUM L7 AI 平台"
      ],
      "he": [
        "פלטפורמת QUANTUM L7 AI"
      ],
      "de": [
        "Quantum L7 AI"
      ],
      "fr": [
        "Quantum L7 AI"
      ],
      "it": [
        "Quantum L7 AI"
      ],
      "pt": [
        "Quantum L7 AI"
      ],
      "pl": [
        "Quantum L7 AI"
      ],
      "nl": [
        "Quantum L7 AI"
      ],
      "sv": [
        "Quantum L7 AI"
      ],
      "no": [
        "Quantum L7 AI"
      ],
      "da": [
        "Quantum L7 AI"
      ],
      "fi": [
        "Quantum L7 AI"
      ],
      "cs": [
        "Quantum L7 AI"
      ],
      "sk": [
        "Quantum L7 AI"
      ],
      "hu": [
        "Quantum L7 AI"
      ],
      "ro": [
        "Quantum L7 AI"
      ],
      "bg": [
        "Quantum L7 AI"
      ],
      "sr": [
        "Quantum L7 AI"
      ],
      "hr": [
        "Quantum L7 AI"
      ],
      "sl": [
        "Quantum L7 AI"
      ],
      "el": [
        "Quantum L7 AI"
      ],
      "ka": [
        "Quantum L7 AI"
      ],
      "az": [
        "Quantum L7 AI"
      ],
      "kk": [
        "Quantum L7 AI"
      ],
      "ja": [
        "Quantum L7 AI"
      ],
      "ko": [
        "Quantum L7 AI"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
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
    "contentHash": "903aef02c5a2973ea2af1c5a39b28eadfc050f60e9995cd101fd51e1de452085"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "platform",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:platform",
      "lib/ql7-support/topicActionRegistry.js:platform",
      "mongo-read:site_runtime_state",
      "mongo-read:system_status_events"
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
