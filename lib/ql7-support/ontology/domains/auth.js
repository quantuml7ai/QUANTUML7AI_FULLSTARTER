// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "auth"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:auth",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Authorization",
    "aliasesByLocale": {
      "en": [
        "Authorization"
      ],
      "ru": [
        "Авторизация"
      ],
      "uk": [
        "Авторизація"
      ],
      "es": [
        "Autorización"
      ],
      "tr": [
        "Yetkilendirme"
      ],
      "ar": [
        "تسجيل الدخول"
      ],
      "zh": [
        "登录与授权"
      ],
      "he": [
        "הרשאה"
      ],
      "de": [
        "Anmeldung"
      ],
      "fr": [
        "Connexion"
      ],
      "it": [
        "Accesso"
      ],
      "pt": [
        "Autorização"
      ],
      "pl": [
        "Logowanie"
      ],
      "nl": [
        "Aanmelden"
      ],
      "sv": [
        "Inloggning"
      ],
      "no": [
        "Innlogging"
      ],
      "da": [
        "Login"
      ],
      "fi": [
        "Kirjautuminen"
      ],
      "cs": [
        "Přihlášení"
      ],
      "sk": [
        "Prihlásenie"
      ],
      "hu": [
        "Bejelentkezés"
      ],
      "ro": [
        "Autentificare"
      ],
      "bg": [
        "Вход"
      ],
      "sr": [
        "Prijava"
      ],
      "hr": [
        "Prijava"
      ],
      "sl": [
        "Prijava"
      ],
      "el": [
        "Σύνδεση"
      ],
      "ka": [
        "შესვლა"
      ],
      "az": [
        "Giriş"
      ],
      "kk": [
        "Кіру"
      ],
      "ja": [
        "ログイン"
      ],
      "ko": [
        "로그인"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
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
    "contentHash": "ad269e2b7eb7ac1ace40c12173f2091b10febba21b2d96914d73559f0f63e090"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "auth",
    "collections": [
      "account_aliases",
      "profiles"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:auth",
      "lib/ql7-support/topicActionRegistry.js:auth",
      "mongo-read:wallet_sessions",
      "mongo-read:auth_session_events",
      "mongo-read:telegram_links"
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
