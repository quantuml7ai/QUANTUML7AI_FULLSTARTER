// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "forum_threads"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:forum_threads",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Forum threads",
    "aliasesByLocale": {
      "en": [
        "Forum threads"
      ],
      "ru": [
        "Ветки форума"
      ],
      "uk": [
        "Гілки форуму"
      ],
      "es": [
        "Hilos del foro"
      ],
      "tr": [
        "Forum konuları"
      ],
      "ar": [
        "مواضيع المنتدى"
      ],
      "zh": [
        "论坛主题"
      ],
      "he": [
        "שרשורי הפורום"
      ],
      "de": [
        "Forum-Themen"
      ],
      "fr": [
        "Sujets du forum"
      ],
      "it": [
        "Discussioni del forum"
      ],
      "pt": [
        "Tópicos do fórum"
      ],
      "pl": [
        "Wątki forum"
      ],
      "nl": [
        "Forumonderwerpen"
      ],
      "sv": [
        "Forumtrådar"
      ],
      "no": [
        "Forumtråder"
      ],
      "da": [
        "Forumtråde"
      ],
      "fi": [
        "Foorumin ketjut"
      ],
      "cs": [
        "Vlákna fóra"
      ],
      "sk": [
        "Vlákna fóra"
      ],
      "hu": [
        "Fórumtémák"
      ],
      "ro": [
        "Subiectele forumului"
      ],
      "bg": [
        "Теми във форума"
      ],
      "sr": [
        "Teme foruma"
      ],
      "hr": [
        "Teme foruma"
      ],
      "sl": [
        "Teme foruma"
      ],
      "el": [
        "Θέματα φόρουμ"
      ],
      "ka": [
        "ფორუმის თემები"
      ],
      "az": [
        "Forum mövzuları"
      ],
      "kk": [
        "Форум тақырыптары"
      ],
      "ja": [
        "フォーラムトピック"
      ],
      "ko": [
        "포럼 주제"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
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
    "contentHash": "291c8182ed873c45485200b54b956be31291b248e0747e8628c7a5a7db7e3a07"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "forum_threads",
    "collections": [
      "forum_thread_index",
      "forum_core_posts"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:forum_threads",
      "lib/ql7-support/topicActionRegistry.js:forum_threads",
      "mongo-read:forum_posts",
      "mongo-read:forum_threads",
      "mongo-read:forum_thread_replies"
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
