// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "news"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:news",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Crypto News",
    "aliasesByLocale": {
      "en": [
        "Crypto News"
      ],
      "ru": [
        "Криптоновости"
      ],
      "uk": [
        "Криптоновини"
      ],
      "es": [
        "Noticias cripto"
      ],
      "tr": [
        "Kripto haberleri"
      ],
      "ar": [
        "أخبار العملات الرقمية"
      ],
      "zh": [
        "加密新闻"
      ],
      "he": [
        "חדשות קריפטו"
      ],
      "de": [
        "Krypto-Nachrichten"
      ],
      "fr": [
        "Actualités crypto"
      ],
      "it": [
        "Notizie crypto"
      ],
      "pt": [
        "Notícias de criptomoedas"
      ],
      "pl": [
        "Wiadomości kryptowalutowe"
      ],
      "nl": [
        "Cryptonieuws"
      ],
      "sv": [
        "Kryptonyheter"
      ],
      "no": [
        "Kryptonyheter"
      ],
      "da": [
        "Kryptonyheder"
      ],
      "fi": [
        "Kryptouutiset"
      ],
      "cs": [
        "Krypto zprávy"
      ],
      "sk": [
        "Krypto správy"
      ],
      "hu": [
        "Kriptohírek"
      ],
      "ro": [
        "Știri cripto"
      ],
      "bg": [
        "Крипто новини"
      ],
      "sr": [
        "Kripto vesti"
      ],
      "hr": [
        "Kripto vijesti"
      ],
      "sl": [
        "Kripto novice"
      ],
      "el": [
        "Νέα κρυπτονομισμάτων"
      ],
      "ka": [
        "კრიპტო სიახლეები"
      ],
      "az": [
        "Kripto xəbərləri"
      ],
      "kk": [
        "Крипто жаңалықтары"
      ],
      "ja": [
        "暗号資産ニュース"
      ],
      "ko": [
        "암호화폐 뉴스"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
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
    "contentHash": "4799d6299176c79d4f74496208aa89c6a4e82fd6c05d1f1d757490308d5303cc"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "news",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:news",
      "lib/ql7-support/topicActionRegistry.js:news",
      "mongo-read:crypto_news_cache",
      "mongo-read:translation_cache"
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
