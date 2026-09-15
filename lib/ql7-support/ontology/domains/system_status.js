// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "system_status"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:system_status",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "System status",
    "aliasesByLocale": {
      "en": [
        "System status"
      ],
      "ru": [
        "Состояние системы"
      ],
      "uk": [
        "Стан системи"
      ],
      "es": [
        "Estado del sistema"
      ],
      "tr": [
        "Sistem durumu"
      ],
      "ar": [
        "حالة النظام"
      ],
      "zh": [
        "系统状态"
      ],
      "he": [
        "מצב המערכת"
      ],
      "de": [
        "Systemstatus"
      ],
      "fr": [
        "État du système"
      ],
      "it": [
        "Stato del sistema"
      ],
      "pt": [
        "Estado do sistema"
      ],
      "pl": [
        "Stan systemu"
      ],
      "nl": [
        "Systeemstatus"
      ],
      "sv": [
        "Systemstatus"
      ],
      "no": [
        "Systemstatus"
      ],
      "da": [
        "Systemstatus"
      ],
      "fi": [
        "Järjestelmän tila"
      ],
      "cs": [
        "Stav systému"
      ],
      "sk": [
        "Stav systému"
      ],
      "hu": [
        "Rendszerállapot"
      ],
      "ro": [
        "Starea sistemului"
      ],
      "bg": [
        "Състояние на системата"
      ],
      "sr": [
        "Stanje sistema"
      ],
      "hr": [
        "Stanje sustava"
      ],
      "sl": [
        "Stanje sistema"
      ],
      "el": [
        "Κατάσταση συστήματος"
      ],
      "ka": [
        "სისტემის მდგომარეობა"
      ],
      "az": [
        "Sistem vəziyyəti"
      ],
      "kk": [
        "Жүйе күйі"
      ],
      "ja": [
        "システム状態"
      ],
      "ko": [
        "시스템 상태"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
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
    "contentHash": "62ef38a4250216145fba207300186fa29a2ea45d2cc388d69329fc4a7c8c1bd6"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "system_status",
    "collections": [],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:system_status",
      "lib/ql7-support/topicActionRegistry.js:system_status",
      "mongo-read:system_status_events",
      "mongo-read:runtime_mode_events"
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
