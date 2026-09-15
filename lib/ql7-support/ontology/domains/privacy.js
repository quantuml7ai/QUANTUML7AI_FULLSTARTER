// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "privacy"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:privacy",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Privacy",
    "aliasesByLocale": {
      "en": [
        "Privacy"
      ],
      "ru": [
        "Конфиденциальность"
      ],
      "uk": [
        "Конфіденційність"
      ],
      "es": [
        "Privacidad"
      ],
      "tr": [
        "Gizlilik"
      ],
      "ar": [
        "الخصوصية"
      ],
      "zh": [
        "隐私"
      ],
      "he": [
        "פרטיות"
      ],
      "de": [
        "Datenschutz"
      ],
      "fr": [
        "Confidentialité"
      ],
      "it": [
        "Privacy"
      ],
      "pt": [
        "Privacidade"
      ],
      "pl": [
        "Prywatność"
      ],
      "nl": [
        "Privacy"
      ],
      "sv": [
        "Integritet"
      ],
      "no": [
        "Personvern"
      ],
      "da": [
        "Privatliv"
      ],
      "fi": [
        "Tietosuoja"
      ],
      "cs": [
        "Soukromí"
      ],
      "sk": [
        "Súkromie"
      ],
      "hu": [
        "Adatvédelem"
      ],
      "ro": [
        "Confidențialitate"
      ],
      "bg": [
        "Поверителност"
      ],
      "sr": [
        "Privatnost"
      ],
      "hr": [
        "Privatnost"
      ],
      "sl": [
        "Zasebnost"
      ],
      "el": [
        "Απόρρητο"
      ],
      "ka": [
        "კონფიდენციალურობა"
      ],
      "az": [
        "Məxfilik"
      ],
      "kk": [
        "Құпиялылық"
      ],
      "ja": [
        "プライバシー"
      ],
      "ko": [
        "개인정보 보호"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
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
    "contentHash": "d1d8474e153e5fa44b74c2b78ea544e9cf6f6cb4c2f6f9928ea57688c7ca52c2"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "privacy",
    "collections": [
      "deleted_accounts"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:privacy",
      "lib/ql7-support/topicActionRegistry.js:privacy",
      "mongo-read:privacy_audit_events",
      "mongo-read:account_deletion_requests"
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
