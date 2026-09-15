// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "payments"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:payments",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Payments",
    "aliasesByLocale": {
      "en": [
        "Payments"
      ],
      "ru": [
        "Платежи"
      ],
      "uk": [
        "Платежі"
      ],
      "es": [
        "Pagos"
      ],
      "tr": [
        "Ödemeler"
      ],
      "ar": [
        "المدفوعات"
      ],
      "zh": [
        "支付"
      ],
      "he": [
        "תשלומים"
      ],
      "de": [
        "Zahlungen"
      ],
      "fr": [
        "Paiements"
      ],
      "it": [
        "Pagamenti"
      ],
      "pt": [
        "Pagamentos"
      ],
      "pl": [
        "Płatności"
      ],
      "nl": [
        "Betalingen"
      ],
      "sv": [
        "Betalningar"
      ],
      "no": [
        "Betalinger"
      ],
      "da": [
        "Betalinger"
      ],
      "fi": [
        "Maksut"
      ],
      "cs": [
        "Platby"
      ],
      "sk": [
        "Platby"
      ],
      "hu": [
        "Fizetések"
      ],
      "ro": [
        "Plăți"
      ],
      "bg": [
        "Плащания"
      ],
      "sr": [
        "Plaćanja"
      ],
      "hr": [
        "Plaćanja"
      ],
      "sl": [
        "Plačila"
      ],
      "el": [
        "Πληρωμές"
      ],
      "ka": [
        "გადახდები"
      ],
      "az": [
        "Ödənişlər"
      ],
      "kk": [
        "Төлемдер"
      ],
      "ja": [
        "支払い"
      ],
      "ko": [
        "결제"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
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
    "contentHash": "f93d52df4aae2b55cd9602886fe34c43789898777dd4661d92cb939e40ec8a34"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "payments",
    "collections": [
      "payment_counters",
      "payment_legacy_snapshots",
      "payment_webhook_runtime",
      "qcoin_topup_invoices",
      "ads_kv"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:payments",
      "lib/ql7-support/topicActionRegistry.js:payments",
      "mongo-read:payment_invoices",
      "mongo-read:qcoin_topup_invoices",
      "mongo-read:vip_payments",
      "mongo-read:ads_kv"
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
