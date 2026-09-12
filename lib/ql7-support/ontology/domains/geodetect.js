// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "geodetect"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:geodetect",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "GeoDetect",
    "aliasesByLocale": {
      "en": [
        "GeoDetect"
      ],
      "ru": [
        "GeoDetect"
      ],
      "uk": [
        "GeoDetect"
      ],
      "es": [
        "GeoDetect"
      ],
      "tr": [
        "GeoDetect"
      ],
      "ar": [
        "GeoDetect"
      ],
      "zh": [
        "GeoDetect"
      ],
      "he": [
        "GeoDetect"
      ],
      "de": [
        "GeoDetect"
      ],
      "fr": [
        "GeoDetect"
      ],
      "it": [
        "GeoDetect"
      ],
      "pt": [
        "GeoDetect"
      ],
      "pl": [
        "GeoDetect"
      ],
      "nl": [
        "GeoDetect"
      ],
      "sv": [
        "GeoDetect"
      ],
      "no": [
        "GeoDetect"
      ],
      "da": [
        "GeoDetect"
      ],
      "fi": [
        "GeoDetect"
      ],
      "cs": [
        "GeoDetect"
      ],
      "sk": [
        "GeoDetect"
      ],
      "hu": [
        "GeoDetect"
      ],
      "ro": [
        "GeoDetect"
      ],
      "bg": [
        "GeoDetect"
      ],
      "sr": [
        "GeoDetect"
      ],
      "hr": [
        "GeoDetect"
      ],
      "sl": [
        "GeoDetect"
      ],
      "el": [
        "GeoDetect"
      ],
      "ka": [
        "GeoDetect"
      ],
      "az": [
        "GeoDetect"
      ],
      "kk": [
        "GeoDetect"
      ],
      "ja": [
        "GeoDetect"
      ],
      "ko": [
        "GeoDetect"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
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
    "contentHash": "35e61bbfd29fbd88a7770e599a1e1cdb91b7d7ac88b16e4ad6d90e35f726ec11"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "geodetect",
    "collections": [
      "profile_geo_events",
      "forum_geo_feed_index"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:geodetect",
      "lib/ql7-support/topicActionRegistry.js:geodetect",
      "mongo-read:geo_sessions",
      "mongo-read:forum_geo_indexes"
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
