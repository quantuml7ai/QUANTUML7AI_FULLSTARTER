// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "roadmap"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:roadmap",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Roadmap",
    "aliasesByLocale": {
      "en": [
        "Roadmap"
      ],
      "ru": [
        "Дорожная карта"
      ],
      "uk": [
        "Дорожня карта"
      ],
      "es": [
        "Hoja de ruta"
      ],
      "tr": [
        "Yol haritası"
      ],
      "ar": [
        "خارطة الطريق"
      ],
      "zh": [
        "路线图"
      ],
      "he": [
        "מפת דרכים"
      ],
      "de": [
        "Roadmap"
      ],
      "fr": [
        "Feuille de route"
      ],
      "it": [
        "Roadmap"
      ],
      "pt": [
        "Roteiro"
      ],
      "pl": [
        "Plan rozwoju"
      ],
      "nl": [
        "Routekaart"
      ],
      "sv": [
        "Färdplan"
      ],
      "no": [
        "Veikart"
      ],
      "da": [
        "Køreplan"
      ],
      "fi": [
        "Etenemissuunnitelma"
      ],
      "cs": [
        "Plán vývoje"
      ],
      "sk": [
        "Plán vývoja"
      ],
      "hu": [
        "Ütemterv"
      ],
      "ro": [
        "Foaie de parcurs"
      ],
      "bg": [
        "Пътна карта"
      ],
      "sr": [
        "Plan razvoja"
      ],
      "hr": [
        "Plan razvoja"
      ],
      "sl": [
        "Načrt razvoja"
      ],
      "el": [
        "Οδικός χάρτης"
      ],
      "ka": [
        "საგზაო რუკა"
      ],
      "az": [
        "Yol xəritəsi"
      ],
      "kk": [
        "Жол картасы"
      ],
      "ja": [
        "ロードマップ"
      ],
      "ko": [
        "로드맵"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
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
    "contentHash": "19cd6f7c1e8692b632183edb0c18003c4299c1b3a21469b228c5d35a669e751f"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "roadmap",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:roadmap",
      "lib/ql7-support/topicActionRegistry.js:roadmap",
      "mongo-read:system_status_events"
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
