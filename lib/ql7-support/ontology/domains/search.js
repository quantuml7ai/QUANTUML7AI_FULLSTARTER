// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "search"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:search",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Search",
    "aliasesByLocale": {
      "en": [
        "Search"
      ],
      "ru": [
        "Поиск"
      ],
      "uk": [
        "Пошук"
      ],
      "es": [
        "Búsqueda"
      ],
      "tr": [
        "Arama"
      ],
      "ar": [
        "البحث"
      ],
      "zh": [
        "搜索"
      ],
      "he": [
        "חיפוש"
      ],
      "de": [
        "Suche"
      ],
      "fr": [
        "Recherche"
      ],
      "it": [
        "Ricerca"
      ],
      "pt": [
        "Pesquisa"
      ],
      "pl": [
        "Wyszukiwanie"
      ],
      "nl": [
        "Zoeken"
      ],
      "sv": [
        "Sökning"
      ],
      "no": [
        "Søk"
      ],
      "da": [
        "Søgning"
      ],
      "fi": [
        "Haku"
      ],
      "cs": [
        "Vyhledávání"
      ],
      "sk": [
        "Vyhľadávanie"
      ],
      "hu": [
        "Keresés"
      ],
      "ro": [
        "Căutare"
      ],
      "bg": [
        "Търсене"
      ],
      "sr": [
        "Pretraga"
      ],
      "hr": [
        "Pretraživanje"
      ],
      "sl": [
        "Iskanje"
      ],
      "el": [
        "Αναζήτηση"
      ],
      "ka": [
        "ძიება"
      ],
      "az": [
        "Axtarış"
      ],
      "kk": [
        "Іздеу"
      ],
      "ja": [
        "検索"
      ],
      "ko": [
        "검색"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
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
    "contentHash": "e3150430bd2b5560bdfe7febf5c0b8f107c2ca0d9cf721e55fe1987664e4f2fe"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "search",
    "collections": [
      "profile_nick_index",
      "forum_core_posts",
      "forum_core_topics"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:search",
      "lib/ql7-support/topicActionRegistry.js:search",
      "mongo-read:forum_search_index",
      "mongo-read:profile_search_index"
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
