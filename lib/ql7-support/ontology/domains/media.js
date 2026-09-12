// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "media"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:media",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Media",
    "aliasesByLocale": {
      "en": [
        "Media"
      ],
      "ru": [
        "Медиа"
      ],
      "uk": [
        "Медіа"
      ],
      "es": [
        "Contenido multimedia"
      ],
      "tr": [
        "Medya"
      ],
      "ar": [
        "الوسائط"
      ],
      "zh": [
        "媒体"
      ],
      "he": [
        "מדיה"
      ],
      "de": [
        "Medien"
      ],
      "fr": [
        "Médias"
      ],
      "it": [
        "Media"
      ],
      "pt": [
        "Mídia"
      ],
      "pl": [
        "Multimedia"
      ],
      "nl": [
        "Media"
      ],
      "sv": [
        "Media"
      ],
      "no": [
        "Medier"
      ],
      "da": [
        "Medier"
      ],
      "fi": [
        "Media"
      ],
      "cs": [
        "Média"
      ],
      "sk": [
        "Médiá"
      ],
      "hu": [
        "Média"
      ],
      "ro": [
        "Media"
      ],
      "bg": [
        "Медия"
      ],
      "sr": [
        "Mediji"
      ],
      "hr": [
        "Mediji"
      ],
      "sl": [
        "Predstavnost"
      ],
      "el": [
        "Πολυμέσα"
      ],
      "ka": [
        "მედია"
      ],
      "az": [
        "Media"
      ],
      "kk": [
        "Медиа"
      ],
      "ja": [
        "メディア"
      ],
      "ko": [
        "미디어"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
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
    "contentHash": "9acc595c9fdbcec9d8c05458a758b22a33ce276800e6c59c320f815e9c0f7d5a"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "media",
    "collections": [
      "forum_media_feed_index",
      "forum_core_posts"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:media",
      "lib/ql7-support/topicActionRegistry.js:media",
      "mongo-read:forum_media_assets",
      "mongo-read:media_moderation_results",
      "mongo-read:media_upload_jobs"
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
