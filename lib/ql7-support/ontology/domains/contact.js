// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "contact"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:contact",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Contact",
    "aliasesByLocale": {
      "en": [
        "Contact"
      ],
      "ru": [
        "Связь с командой"
      ],
      "uk": [
        "Зв’язок із командою"
      ],
      "es": [
        "Contacto"
      ],
      "tr": [
        "İletişim"
      ],
      "ar": [
        "التواصل"
      ],
      "zh": [
        "联系我们"
      ],
      "he": [
        "יצירת קשר"
      ],
      "de": [
        "Kontakt"
      ],
      "fr": [
        "Contact"
      ],
      "it": [
        "Contatti"
      ],
      "pt": [
        "Contato"
      ],
      "pl": [
        "Kontakt"
      ],
      "nl": [
        "Contact"
      ],
      "sv": [
        "Kontakt"
      ],
      "no": [
        "Kontakt"
      ],
      "da": [
        "Kontakt"
      ],
      "fi": [
        "Yhteydenotto"
      ],
      "cs": [
        "Kontakt"
      ],
      "sk": [
        "Kontakt"
      ],
      "hu": [
        "Kapcsolat"
      ],
      "ro": [
        "Contact"
      ],
      "bg": [
        "Контакт"
      ],
      "sr": [
        "Kontakt"
      ],
      "hr": [
        "Kontakt"
      ],
      "sl": [
        "Stik"
      ],
      "el": [
        "Επικοινωνία"
      ],
      "ka": [
        "კონტაქტი"
      ],
      "az": [
        "Əlaqə"
      ],
      "kk": [
        "Байланыс"
      ],
      "ja": [
        "お問い合わせ"
      ],
      "ko": [
        "문의"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
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
    "contentHash": "2e1100481ed7e71c75c672f0d90733873211714ab1fb4511e707cfa416c6ddad"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "contact",
    "collections": [
      "support_email_outbox",
      "ql7_support_cases"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:contact",
      "lib/ql7-support/topicActionRegistry.js:contact",
      "mongo-read:support_email_outbox",
      "mongo-read:ql7_support_cases"
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
