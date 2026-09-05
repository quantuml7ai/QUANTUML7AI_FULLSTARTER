// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "profile"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:profile",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Profile",
    "aliasesByLocale": {
      "en": [
        "Profile"
      ],
      "ru": [
        "Профиль"
      ],
      "uk": [
        "Профіль"
      ],
      "es": [
        "Perfil"
      ],
      "tr": [
        "Profil"
      ],
      "ar": [
        "الملف الشخصي"
      ],
      "zh": [
        "个人资料"
      ],
      "he": [
        "פרופיל"
      ],
      "de": [
        "Profil"
      ],
      "fr": [
        "Profil"
      ],
      "it": [
        "Profilo"
      ],
      "pt": [
        "Perfil"
      ],
      "pl": [
        "Profil"
      ],
      "nl": [
        "Profiel"
      ],
      "sv": [
        "Profil"
      ],
      "no": [
        "Profil"
      ],
      "da": [
        "Profil"
      ],
      "fi": [
        "Profiili"
      ],
      "cs": [
        "Profil"
      ],
      "sk": [
        "Profil"
      ],
      "hu": [
        "Profil"
      ],
      "ro": [
        "Profil"
      ],
      "bg": [
        "Профил"
      ],
      "sr": [
        "Profil"
      ],
      "hr": [
        "Profil"
      ],
      "sl": [
        "Profil"
      ],
      "el": [
        "Προφίλ"
      ],
      "ka": [
        "პროფილი"
      ],
      "az": [
        "Profil"
      ],
      "kk": [
        "Профиль"
      ],
      "ja": [
        "プロフィール"
      ],
      "ko": [
        "프로필"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
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
    "contentHash": "9bae47d74db75ab374a7882195eac24f492dc9012eb23b724579a3dc289d9aa4"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "profile",
    "collections": [
      "profiles",
      "profile_nick_index",
      "profile_geo_events"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:profile",
      "lib/ql7-support/topicActionRegistry.js:profile",
      "mongo-read:profile_projection",
      "mongo-read:profile_aliases",
      "mongo-read:profile_avatars"
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
