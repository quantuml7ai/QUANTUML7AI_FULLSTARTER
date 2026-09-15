// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "quests"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:quests",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Quests",
    "aliasesByLocale": {
      "en": [
        "Quests"
      ],
      "ru": [
        "Квесты"
      ],
      "uk": [
        "Квести"
      ],
      "es": [
        "Misiones"
      ],
      "tr": [
        "Görevler"
      ],
      "ar": [
        "المهام"
      ],
      "zh": [
        "任务"
      ],
      "he": [
        "משימות"
      ],
      "de": [
        "Aufgaben"
      ],
      "fr": [
        "Quêtes"
      ],
      "it": [
        "Missioni"
      ],
      "pt": [
        "Missões"
      ],
      "pl": [
        "Zadania"
      ],
      "nl": [
        "Opdrachten"
      ],
      "sv": [
        "Uppdrag"
      ],
      "no": [
        "Oppdrag"
      ],
      "da": [
        "Opgaver"
      ],
      "fi": [
        "Tehtävät"
      ],
      "cs": [
        "Úkoly"
      ],
      "sk": [
        "Úlohy"
      ],
      "hu": [
        "Küldetések"
      ],
      "ro": [
        "Misiuni"
      ],
      "bg": [
        "Задачи"
      ],
      "sr": [
        "Zadaci"
      ],
      "hr": [
        "Zadaci"
      ],
      "sl": [
        "Naloge"
      ],
      "el": [
        "Αποστολές"
      ],
      "ka": [
        "დავალებები"
      ],
      "az": [
        "Tapşırıqlar"
      ],
      "kk": [
        "Тапсырмалар"
      ],
      "ja": [
        "クエスト"
      ],
      "ko": [
        "퀘스트"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
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
    "contentHash": "58cdf9e8e3adea1efa1883b06f58875943ae32d014e5f6ed8012b2198ed76dd1"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "quests",
    "collections": [
      "qcoin_ledger"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:quests",
      "lib/ql7-support/topicActionRegistry.js:quests",
      "mongo-read:quest_progress",
      "mongo-read:quest_status",
      "mongo-read:qcoin_ledger"
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
