// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "futures"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:futures",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Futures simulator",
    "aliasesByLocale": {
      "en": [
        "Futures simulator"
      ],
      "ru": [
        "Симулятор фьючерсов"
      ],
      "uk": [
        "Симулятор ф’ючерсів"
      ],
      "es": [
        "Simulador de futuros"
      ],
      "tr": [
        "Vadeli işlem simülatörü"
      ],
      "ar": [
        "محاكي العقود الآجلة"
      ],
      "zh": [
        "期货模拟器"
      ],
      "he": [
        "סימולטור חוזים עתידיים"
      ],
      "de": [
        "Futures-Simulator"
      ],
      "fr": [
        "Simulateur de contrats à terme"
      ],
      "it": [
        "Simulatore di futures"
      ],
      "pt": [
        "Simulador de futuros"
      ],
      "pl": [
        "Symulator kontraktów terminowych"
      ],
      "nl": [
        "Futuresimulator"
      ],
      "sv": [
        "Terminssimulator"
      ],
      "no": [
        "Futuressimulator"
      ],
      "da": [
        "Futuresimulator"
      ],
      "fi": [
        "Futuurisimulaattori"
      ],
      "cs": [
        "Simulátor futures"
      ],
      "sk": [
        "Simulátor futures"
      ],
      "hu": [
        "Határidős szimulátor"
      ],
      "ro": [
        "Simulator futures"
      ],
      "bg": [
        "Симулатор за фючърси"
      ],
      "sr": [
        "Simulator fjučersa"
      ],
      "hr": [
        "Simulator futuresa"
      ],
      "sl": [
        "Simulator terminskih pogodb"
      ],
      "el": [
        "Προσομοιωτής συμβολαίων μελλοντικής εκπλήρωσης"
      ],
      "ka": [
        "ფიუჩერსების სიმულატორი"
      ],
      "az": [
        "Fyuçers simulyatoru"
      ],
      "kk": [
        "Фьючерстер симуляторы"
      ],
      "ja": [
        "先物シミュレーター"
      ],
      "ko": [
        "선물 시뮬레이터"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
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
    "contentHash": "92fc62426468d5e8a7a33624b7bb857ddba1680145c583269495873a86edef07"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "futures",
    "collections": [
      "battlecoin_orders",
      "battlecoin_active_orders"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:futures",
      "lib/ql7-support/topicActionRegistry.js:futures",
      "mongo-read:battlecoin_active_orders",
      "mongo-read:battlecoin_order_history",
      "mongo-read:market_snapshots"
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
