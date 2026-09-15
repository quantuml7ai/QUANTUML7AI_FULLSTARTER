// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "security"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:security",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Security",
    "aliasesByLocale": {
      "en": [
        "Security"
      ],
      "ru": [
        "Безопасность"
      ],
      "uk": [
        "Безпека"
      ],
      "es": [
        "Seguridad"
      ],
      "tr": [
        "Güvenlik"
      ],
      "ar": [
        "الأمان"
      ],
      "zh": [
        "安全"
      ],
      "he": [
        "אבטחה"
      ],
      "de": [
        "Sicherheit"
      ],
      "fr": [
        "Sécurité"
      ],
      "it": [
        "Sicurezza"
      ],
      "pt": [
        "Segurança"
      ],
      "pl": [
        "Bezpieczeństwo"
      ],
      "nl": [
        "Beveiliging"
      ],
      "sv": [
        "Säkerhet"
      ],
      "no": [
        "Sikkerhet"
      ],
      "da": [
        "Sikkerhed"
      ],
      "fi": [
        "Turvallisuus"
      ],
      "cs": [
        "Bezpečnost"
      ],
      "sk": [
        "Bezpečnosť"
      ],
      "hu": [
        "Biztonság"
      ],
      "ro": [
        "Securitate"
      ],
      "bg": [
        "Сигурност"
      ],
      "sr": [
        "Bezbednost"
      ],
      "hr": [
        "Sigurnost"
      ],
      "sl": [
        "Varnost"
      ],
      "el": [
        "Ασφάλεια"
      ],
      "ka": [
        "უსაფრთხოება"
      ],
      "az": [
        "Təhlükəsizlik"
      ],
      "kk": [
        "Қауіпсіздік"
      ],
      "ja": [
        "セキュリティ"
      ],
      "ko": [
        "보안"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
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
    "privacyClass": "restricted",
    "ownerId": "ql7-support.ontology",
    "contentHash": "2e70cf6dd1c151b8e6324c88b32447e9c9220971c89a596d693933ac9f60dc87"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "security",
    "collections": [
      "account_aliases",
      "profiles"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:security",
      "lib/ql7-support/topicActionRegistry.js:security",
      "mongo-read:auth_session_events",
      "mongo-read:security_incidents",
      "mongo-read:wallet_sessions"
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
