// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "ads_campaigns"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:ads_campaigns",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Ads campaigns",
    "aliasesByLocale": {
      "en": [
        "Ads campaigns"
      ],
      "ru": [
        "Рекламные кампании"
      ],
      "uk": [
        "Рекламні кампанії"
      ],
      "es": [
        "Campañas publicitarias"
      ],
      "tr": [
        "Reklam kampanyaları"
      ],
      "ar": [
        "الحملات الإعلانية"
      ],
      "zh": [
        "广告活动"
      ],
      "he": [
        "קמפיינים פרסומיים"
      ],
      "de": [
        "Werbekampagnen"
      ],
      "fr": [
        "Campagnes publicitaires"
      ],
      "it": [
        "Campagne pubblicitarie"
      ],
      "pt": [
        "Campanhas publicitárias"
      ],
      "pl": [
        "Kampanie reklamowe"
      ],
      "nl": [
        "Advertentiecampagnes"
      ],
      "sv": [
        "Annonskampanjer"
      ],
      "no": [
        "Annonsekampanjer"
      ],
      "da": [
        "Annoncekampagner"
      ],
      "fi": [
        "Mainoskampanjat"
      ],
      "cs": [
        "Reklamní kampaně"
      ],
      "sk": [
        "Reklamné kampane"
      ],
      "hu": [
        "Hirdetési kampányok"
      ],
      "ro": [
        "Campanii publicitare"
      ],
      "bg": [
        "Рекламни кампании"
      ],
      "sr": [
        "Reklamne kampanje"
      ],
      "hr": [
        "Oglasne kampanje"
      ],
      "sl": [
        "Oglaševalske kampanje"
      ],
      "el": [
        "Διαφημιστικές καμπάνιες"
      ],
      "ka": [
        "სარეკლამო კამპანიები"
      ],
      "az": [
        "Reklam kampaniyaları"
      ],
      "kk": [
        "Жарнама науқандары"
      ],
      "ja": [
        "広告キャンペーン"
      ],
      "ko": [
        "광고 캠페인"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
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
    "contentHash": "e422fd2a3ca467726915d539cd9afe504862144b71439f1ab1095818f260dad1"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "ads_campaigns",
    "collections": [
      "ads_kv",
      "ads_sets",
      "ads_analytics",
      "ads_counters"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:ads_campaigns",
      "lib/ql7-support/topicActionRegistry.js:ads_campaigns",
      "mongo-read:ads_kv",
      "mongo-read:ads_sets",
      "mongo-read:ads_analytics"
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
