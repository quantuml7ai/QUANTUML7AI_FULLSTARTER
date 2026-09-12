// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "localization"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:localization",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Localization",
    "aliasesByLocale": {
      "en": [
        "Localization"
      ],
      "ru": [
        "Локализация"
      ],
      "uk": [
        "Локалізація"
      ],
      "es": [
        "Localización"
      ],
      "tr": [
        "Yerelleştirme"
      ],
      "ar": [
        "التوطين"
      ],
      "zh": [
        "本地化"
      ],
      "he": [
        "לוקליזציה"
      ],
      "de": [
        "Lokalisierung"
      ],
      "fr": [
        "Localisation"
      ],
      "it": [
        "Localizzazione"
      ],
      "pt": [
        "Localização"
      ],
      "pl": [
        "Lokalizacja"
      ],
      "nl": [
        "Lokalisatie"
      ],
      "sv": [
        "Lokalisering"
      ],
      "no": [
        "Lokalisering"
      ],
      "da": [
        "Lokalisering"
      ],
      "fi": [
        "Lokalisointi"
      ],
      "cs": [
        "Lokalizace"
      ],
      "sk": [
        "Lokalizácia"
      ],
      "hu": [
        "Lokalizáció"
      ],
      "ro": [
        "Localizare"
      ],
      "bg": [
        "Локализация"
      ],
      "sr": [
        "Lokalizacija"
      ],
      "hr": [
        "Lokalizacija"
      ],
      "sl": [
        "Lokalizacija"
      ],
      "el": [
        "Τοπική προσαρμογή"
      ],
      "ka": [
        "ლოკალიზაცია"
      ],
      "az": [
        "Lokallaşdırma"
      ],
      "kk": [
        "Локализация"
      ],
      "ja": [
        "ローカライズ"
      ],
      "ko": [
        "현지화"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
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
    "contentHash": "be4c7c0171b393a4813a1cf9bf8dca1b48b5f440ad3937c4e051fe75a15b7001"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "localization",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:localization",
      "lib/ql7-support/topicActionRegistry.js:localization",
      "mongo-read:translation_cache",
      "mongo-read:profile_projection"
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
