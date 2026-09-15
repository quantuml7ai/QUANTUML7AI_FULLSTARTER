// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "push"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:push",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Push notifications",
    "aliasesByLocale": {
      "en": [
        "Push notifications"
      ],
      "ru": [
        "Push-уведомления"
      ],
      "uk": [
        "Push-сповіщення"
      ],
      "es": [
        "Notificaciones push"
      ],
      "tr": [
        "Push bildirimleri"
      ],
      "ar": [
        "الإشعارات الفورية"
      ],
      "zh": [
        "推送通知"
      ],
      "he": [
        "התראות דחיפה"
      ],
      "de": [
        "Push-Benachrichtigungen"
      ],
      "fr": [
        "Notifications push"
      ],
      "it": [
        "Notifiche push"
      ],
      "pt": [
        "Notificações push"
      ],
      "pl": [
        "Powiadomienia push"
      ],
      "nl": [
        "Pushmeldingen"
      ],
      "sv": [
        "Pushnotiser"
      ],
      "no": [
        "Pushvarsler"
      ],
      "da": [
        "Pushnotifikationer"
      ],
      "fi": [
        "Push-ilmoitukset"
      ],
      "cs": [
        "Push oznámení"
      ],
      "sk": [
        "Push oznámenia"
      ],
      "hu": [
        "Push értesítések"
      ],
      "ro": [
        "Notificări push"
      ],
      "bg": [
        "Push известия"
      ],
      "sr": [
        "Push obaveštenja"
      ],
      "hr": [
        "Push obavijesti"
      ],
      "sl": [
        "Potisna obvestila"
      ],
      "el": [
        "Ειδοποιήσεις push"
      ],
      "ka": [
        "Push შეტყობინებები"
      ],
      "az": [
        "Push bildirişləri"
      ],
      "kk": [
        "Push хабарландырулары"
      ],
      "ja": [
        "プッシュ通知"
      ],
      "ko": [
        "푸시 알림"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
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
    "contentHash": "82734755dfa86a9d2e087c37ba4b982c9fe0c7af25d93d7e7d5e2a9cb1eaf1ce"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "push",
    "collections": [
      "dm_counters",
      "dm_deliveries"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:push",
      "lib/ql7-support/topicActionRegistry.js:push",
      "mongo-read:notification_states",
      "mongo-read:push_subscriptions",
      "mongo-read:dm_message_indexes"
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
