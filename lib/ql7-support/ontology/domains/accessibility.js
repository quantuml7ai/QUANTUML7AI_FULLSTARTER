// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "accessibility"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:accessibility",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Accessibility",
    "aliasesByLocale": {
      "en": [
        "Accessibility"
      ],
      "ru": [
        "Доступность"
      ],
      "uk": [
        "Доступність"
      ],
      "es": [
        "Accesibilidad"
      ],
      "tr": [
        "Erişilebilirlik"
      ],
      "ar": [
        "إمكانية الوصول"
      ],
      "zh": [
        "无障碍"
      ],
      "he": [
        "נגישות"
      ],
      "de": [
        "Barrierefreiheit"
      ],
      "fr": [
        "Accessibilité"
      ],
      "it": [
        "Accessibilità"
      ],
      "pt": [
        "Acessibilidade"
      ],
      "pl": [
        "Dostępność"
      ],
      "nl": [
        "Toegankelijkheid"
      ],
      "sv": [
        "Tillgänglighet"
      ],
      "no": [
        "Tilgjengelighet"
      ],
      "da": [
        "Tilgængelighed"
      ],
      "fi": [
        "Saavutettavuus"
      ],
      "cs": [
        "Přístupnost"
      ],
      "sk": [
        "Prístupnosť"
      ],
      "hu": [
        "Akadálymentesség"
      ],
      "ro": [
        "Accesibilitate"
      ],
      "bg": [
        "Достъпност"
      ],
      "sr": [
        "Pristupačnost"
      ],
      "hr": [
        "Pristupačnost"
      ],
      "sl": [
        "Dostopnost"
      ],
      "el": [
        "Προσβασιμότητα"
      ],
      "ka": [
        "ხელმისაწვდომობა"
      ],
      "az": [
        "Əlçatanlıq"
      ],
      "kk": [
        "Қолжетімділік"
      ],
      "ja": [
        "アクセシビリティ"
      ],
      "ko": [
        "접근성"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
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
    "contentHash": "838dc90bec582ddd5c60bee63d04240afe824bdc8ce3b9ef0ec944e0d5c5de30"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "accessibility",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:accessibility",
      "lib/ql7-support/topicActionRegistry.js:accessibility",
      "mongo-read:accessibility_reports"
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
