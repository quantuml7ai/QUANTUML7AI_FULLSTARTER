// Generated declarative QL7 Support REV.5.1 ontology domain module. No final user prose.
export const DOMAIN_ID = "academy_exam"

export const domainNode = Object.freeze(
  {
    "nodeId": "domain:academy_exam",
    "schemaVersion": "5.1.0",
    "nodeType": "DomainNode",
    "canonicalLabel": "Academy Exam",
    "aliasesByLocale": {
      "en": [
        "Academy Exam"
      ],
      "ru": [
        "Экзамен Академии"
      ],
      "uk": [
        "Іспит Академії"
      ],
      "es": [
        "Examen de la Academia"
      ],
      "tr": [
        "Akademi Sınavı"
      ],
      "ar": [
        "اختبار الأكاديمية"
      ],
      "zh": [
        "学院考试"
      ],
      "he": [
        "מבחן האקדמיה"
      ],
      "de": [
        "Akademie: Prüfung"
      ],
      "fr": [
        "Académie: Examen"
      ],
      "it": [
        "Accademia: Esame"
      ],
      "pt": [
        "Academia: Exame"
      ],
      "pl": [
        "Akademia: Egzamin"
      ],
      "nl": [
        "Academie: Examen"
      ],
      "sv": [
        "Akademi: Prov"
      ],
      "no": [
        "Akademi: Eksamen"
      ],
      "da": [
        "Akademi: Eksamen"
      ],
      "fi": [
        "Akatemia: Koe"
      ],
      "cs": [
        "Akademie: Zkouška"
      ],
      "sk": [
        "Akadémia: Skúška"
      ],
      "hu": [
        "Akadémia: Vizsga"
      ],
      "ro": [
        "Academie: Examen"
      ],
      "bg": [
        "Академия: Изпит"
      ],
      "sr": [
        "Akademija: Ispit"
      ],
      "hr": [
        "Akademija: Ispit"
      ],
      "sl": [
        "Akademija: Izpit"
      ],
      "el": [
        "Ακαδημία: Εξέταση"
      ],
      "ka": [
        "აკადემია: გამოცდა"
      ],
      "az": [
        "Akademiya: İmtahan"
      ],
      "kk": [
        "Академия: Емтихан"
      ],
      "ja": [
        "アカデミー: 試験"
      ],
      "ko": [
        "아카데미: 시험"
      ]
    },
    "parentIds": [],
    "status": "available",
    "validFrom": "2026-08-15T00:00:00.000Z",
    "validTo": "",
    "sourceReceiptIds": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
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
    "contentHash": "6ec705e6fd517ec4c8fb74d4ec95266a4c8782a6a5b79c3928db3990ea4440dd"
  }
)

export const sourceRequirements = Object.freeze(
  {
    "domainId": "academy_exam",
    "collections": [
      "academy_exams"
    ],
    "authRequired": false,
    "readOnly": true,
    "sourceRefs": [
      "lib/ql7-support/ecosystemCatalog.js:academy_exam",
      "lib/ql7-support/topicActionRegistry.js:academy_exam",
      "mongo-read:academy_exam_attempts",
      "mongo-read:academy_progress"
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
