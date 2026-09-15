// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "account_deletion"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:account_deletion",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Account deletion",
    "aliasesByLocale": {
      "en": [
        "Account deletion"
      ],
      "ru": [
        "Удаление аккаунта"
      ],
      "uk": [
        "Видалення акаунта"
      ],
      "es": [
        "Eliminación de la cuenta"
      ],
      "tr": [
        "Hesap silme"
      ],
      "ar": [
        "حذف الحساب"
      ],
      "zh": [
        "删除账户"
      ],
      "he": [
        "מחיקת חשבון"
      ],
      "de": [
        "Konto löschen"
      ],
      "fr": [
        "Suppression du compte"
      ],
      "it": [
        "Eliminazione account"
      ],
      "pt": [
        "Exclusão da conta"
      ],
      "pl": [
        "Usunięcie konta"
      ],
      "nl": [
        "Account verwijderen"
      ],
      "sv": [
        "Radera konto"
      ],
      "no": [
        "Slett konto"
      ],
      "da": [
        "Slet konto"
      ],
      "fi": [
        "Tilin poistaminen"
      ],
      "cs": [
        "Odstranění účtu"
      ],
      "sk": [
        "Odstránenie účtu"
      ],
      "hu": [
        "Fiók törlése"
      ],
      "ro": [
        "Ștergerea contului"
      ],
      "bg": [
        "Изтриване на акаунт"
      ],
      "sr": [
        "Brisanje naloga"
      ],
      "hr": [
        "Brisanje računa"
      ],
      "sl": [
        "Izbris računa"
      ],
      "el": [
        "Διαγραφή λογαριασμού"
      ],
      "ka": [
        "ანგარიშის წაშლა"
      ],
      "az": [
        "Hesabın silinməsi"
      ],
      "kk": [
        "Аккаунтты жою"
      ],
      "ja": [
        "アカウント削除"
      ],
      "ko": [
        "계정 삭제"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
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
    "contentHash": "7a3e912d8488e4cae1140ff77809d1eb8eafc499f15f8c3f0117a801385795bc"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "account_deletion",
    "collections": [
      "deleted_accounts",
      "deleted_account_chunks"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:account_deletion",
      "lib/ql7-support/topicActionRegistry.js:account_deletion",
      "mongo-read:account_deletion_requests",
      "mongo-read:profile_projection"
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
