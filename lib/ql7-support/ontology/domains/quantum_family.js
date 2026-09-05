// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "quantum_family"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:quantum_family",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Quantum Family",
    "aliasesByLocale": {
      "en": [
        "Quantum Family"
      ],
      "ru": [
        "Quantum Family"
      ],
      "uk": [
        "Quantum Family"
      ],
      "es": [
        "Quantum Family"
      ],
      "tr": [
        "Quantum Family"
      ],
      "ar": [
        "Quantum Family"
      ],
      "zh": [
        "Quantum Family"
      ],
      "he": [
        "Quantum Family"
      ],
      "de": [
        "Quantum Family"
      ],
      "fr": [
        "Quantum Family"
      ],
      "it": [
        "Quantum Family"
      ],
      "pt": [
        "Quantum Family"
      ],
      "pl": [
        "Quantum Family"
      ],
      "nl": [
        "Quantum Family"
      ],
      "sv": [
        "Quantum Family"
      ],
      "no": [
        "Quantum Family"
      ],
      "da": [
        "Quantum Family"
      ],
      "fi": [
        "Quantum Family"
      ],
      "cs": [
        "Quantum Family"
      ],
      "sk": [
        "Quantum Family"
      ],
      "hu": [
        "Quantum Family"
      ],
      "ro": [
        "Quantum Family"
      ],
      "bg": [
        "Quantum Family"
      ],
      "sr": [
        "Quantum Family"
      ],
      "hr": [
        "Quantum Family"
      ],
      "sl": [
        "Quantum Family"
      ],
      "el": [
        "Quantum Family"
      ],
      "ka": [
        "Quantum Family"
      ],
      "az": [
        "Quantum Family"
      ],
      "kk": [
        "Quantum Family"
      ],
      "ja": [
        "Quantum Family"
      ],
      "ko": [
        "Quantum Family"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
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
    "contentHash": "4dbc676fe91c2051f4cb657b468dc6f08599def7a4f79795884e5dbe62743902"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "quantum_family",
    "collections": [
      "forum_subscription_counts",
      "forum_subscription_sets"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quantum_family",
      "lib/ql7-support/topicActionRegistry.js:quantum_family",
      "mongo-read:forum_follow_edges",
      "mongo-read:forum_recommendation_events"
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
