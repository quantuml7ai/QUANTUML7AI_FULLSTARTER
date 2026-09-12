// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "metaverse"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:metaverse",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Metaverse",
    "aliasesByLocale": {
      "en": [
        "Metaverse"
      ],
      "ru": [
        "Метавселенная"
      ],
      "uk": [
        "Метавсесвіт"
      ],
      "es": [
        "Metaverso"
      ],
      "tr": [
        "Metaverse"
      ],
      "ar": [
        "العالم الافتراضي"
      ],
      "zh": [
        "元宇宙"
      ],
      "he": [
        "מטאוורס"
      ],
      "de": [
        "Metaversum"
      ],
      "fr": [
        "Métavers"
      ],
      "it": [
        "Metaverso"
      ],
      "pt": [
        "Metaverso"
      ],
      "pl": [
        "Metawersum"
      ],
      "nl": [
        "Metaverse"
      ],
      "sv": [
        "Metaversum"
      ],
      "no": [
        "Metavers"
      ],
      "da": [
        "Metavers"
      ],
      "fi": [
        "Metaversumi"
      ],
      "cs": [
        "Metaverzum"
      ],
      "sk": [
        "Metaverzum"
      ],
      "hu": [
        "Metaverzum"
      ],
      "ro": [
        "Metavers"
      ],
      "bg": [
        "Метавселена"
      ],
      "sr": [
        "Metaverzum"
      ],
      "hr": [
        "Metaverzum"
      ],
      "sl": [
        "Metaverzum"
      ],
      "el": [
        "Μετασύμπαν"
      ],
      "ka": [
        "მეტავერსი"
      ],
      "az": [
        "Metakainat"
      ],
      "kk": [
        "Метаверс"
      ],
      "ja": [
        "メタバース"
      ],
      "ko": [
        "메타버스"
      ]
    },
    "parentIds": [],
    "status": "planned",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
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
    "contentHash": "06d3d2ec704a845adfb70c4b20ec2e7630a27d01d216fd988e73fc93a8686bc9"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "metaverse",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:metaverse",
      "lib/ql7-support/topicActionRegistry.js:metaverse",
      "mongo-read:metaverse_sessions",
      "mongo-read:profile_avatars"
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
