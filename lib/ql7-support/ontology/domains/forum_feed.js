// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "forum_feed"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:forum_feed",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Forum feed",
    "aliasesByLocale": {
      "en": [
        "Forum feed"
      ],
      "ru": [
        "Лента форума"
      ],
      "uk": [
        "Стрічка форуму"
      ],
      "es": [
        "Feed del foro"
      ],
      "tr": [
        "Forum akışı"
      ],
      "ar": [
        "خلاصة المنتدى"
      ],
      "zh": [
        "论坛信息流"
      ],
      "he": [
        "פיד הפורום"
      ],
      "de": [
        "Forum-Feed"
      ],
      "fr": [
        "Fil du forum"
      ],
      "it": [
        "Feed del forum"
      ],
      "pt": [
        "Feed do fórum"
      ],
      "pl": [
        "Aktualności forum"
      ],
      "nl": [
        "Forumoverzicht"
      ],
      "sv": [
        "Forumflöde"
      ],
      "no": [
        "Forumstrøm"
      ],
      "da": [
        "Forumfeed"
      ],
      "fi": [
        "Foorumisyöte"
      ],
      "cs": [
        "Přehled fóra"
      ],
      "sk": [
        "Prehľad fóra"
      ],
      "hu": [
        "Fórumfolyam"
      ],
      "ro": [
        "Fluxul forumului"
      ],
      "bg": [
        "Поток на форума"
      ],
      "sr": [
        "Tok foruma"
      ],
      "hr": [
        "Tok foruma"
      ],
      "sl": [
        "Tok foruma"
      ],
      "el": [
        "Ροή φόρουμ"
      ],
      "ka": [
        "ფორუმის ნაკადი"
      ],
      "az": [
        "Forum axını"
      ],
      "kk": [
        "Форум таспасы"
      ],
      "ja": [
        "フォーラムフィード"
      ],
      "ko": [
        "포럼 피드"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
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
    "contentHash": "0ae2fc4aaa59f71c4906e71a3a9e4c2122a6b70a9974b880b93010f1ac0790de"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "forum_feed",
    "collections": [
      "forum_core_posts",
      "forum_geo_feed_index",
      "forum_core_topics"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_feed",
      "lib/ql7-support/topicActionRegistry.js:forum_feed",
      "mongo-read:forum_posts",
      "mongo-read:forum_topics",
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
