// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "metastudio"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:metastudio",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "MetaStudio",
    "aliasesByLocale": {
      "en": [
        "MetaStudio"
      ],
      "ru": [
        "MetaStudio"
      ],
      "uk": [
        "MetaStudio"
      ],
      "es": [
        "MetaStudio"
      ],
      "tr": [
        "MetaStudio"
      ],
      "ar": [
        "MetaStudio"
      ],
      "zh": [
        "MetaStudio"
      ],
      "he": [
        "MetaStudio"
      ],
      "de": [
        "MetaStudio"
      ],
      "fr": [
        "MetaStudio"
      ],
      "it": [
        "MetaStudio"
      ],
      "pt": [
        "MetaStudio"
      ],
      "pl": [
        "MetaStudio"
      ],
      "nl": [
        "MetaStudio"
      ],
      "sv": [
        "MetaStudio"
      ],
      "no": [
        "MetaStudio"
      ],
      "da": [
        "MetaStudio"
      ],
      "fi": [
        "MetaStudio"
      ],
      "cs": [
        "MetaStudio"
      ],
      "sk": [
        "MetaStudio"
      ],
      "hu": [
        "MetaStudio"
      ],
      "ro": [
        "MetaStudio"
      ],
      "bg": [
        "MetaStudio"
      ],
      "sr": [
        "MetaStudio"
      ],
      "hr": [
        "MetaStudio"
      ],
      "sl": [
        "MetaStudio"
      ],
      "el": [
        "MetaStudio"
      ],
      "ka": [
        "MetaStudio"
      ],
      "az": [
        "MetaStudio"
      ],
      "kk": [
        "MetaStudio"
      ],
      "ja": [
        "MetaStudio"
      ],
      "ko": [
        "MetaStudio"
      ]
    },
    "parentIds": [],
    "status": "planned",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
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
    "contentHash": "492fbb78d0636ef6b92f031fbc6ac9718e51d2362b6f60792cfd93cae03d5ddc"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "metastudio",
    "collections": [
      "metastudio_registrations",
      "metastudio_registration_latest"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metastudio",
      "lib/ql7-support/topicActionRegistry.js:metastudio",
      "mongo-read:metastudio_creators",
      "mongo-read:media_assets"
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
