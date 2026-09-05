import {QL7_SUPPORT_CRISIS_REVIEWED_CUES_BY_LOCALE} from './crisisReviewedCueBank.js'
import {ql7StableHash, ql7Str} from '../internal/text.js'
import {getQl7SupportCrisisConcepts, listQl7SupportGlobalCrisisConceptRecords} from './crisisConceptBank.js'
import {matchQl7SupportConceptPhrases} from '../language/robustConceptMatcher.js'

export const QL7_SUPPORT_CRISIS_REVIEWED_CUE_SOURCE=QL7_SUPPORT_CRISIS_REVIEWED_CUES_BY_LOCALE
export const QL7_SUPPORT_CRISIS_ASSESSMENT_VERSION = '5.2.2'
export const QL7_SUPPORT_CRISIS_ASSESSMENT_OWNER_ID = 'ql7-support.crisis-assessment'

const EPSILON = 1e-9
const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0))
const langOf = (locale = 'en') => ql7Str(locale).toLowerCase().split(/[-_]/u)[0] || 'en'

function softmax(rows = []) {
  if (!rows.length) return []
  const max = Math.max(...rows.map((row) => row.logit))
  const exps = rows.map((row) => Math.exp(row.logit - max))
  const sum = exps.reduce((acc, value) => acc + value, 0) || 1
  return rows.map((row, index) => ({ ...row, probability: exps[index] / sum }))
}

function entropy(rows = []) {
  if (!rows.length) return 0
  const raw = -rows.reduce((sum, row) => {
    const p = Math.max(EPSILON, Number(row.probability || 0))
    return sum + p * Math.log(p)
  }, 0)
  const ceiling = Math.log(rows.length)
  return ceiling > 0 ? clamp01(raw / ceiling) : 0
}

function mergeMatches(...receipts) {
  const rows = []
  for (const receipt of receipts) {
    for (const hit of receipt?.hits || []) rows.push(hit)
  }
  return Object.freeze(rows)
}

function matchFamily({ text, locale, family, phrases, risk = 'high' }) {
  return matchQl7SupportConceptPhrases({
    text,
    locale,
    family,
    phrases,
    allowFuzzy: true,
    risk,
    maxHits: 12,
  })
}

function familyEvidence(receipt, weight) {
  const count = Number(receipt?.hitCount || 0)
  const similarity = Number(receipt?.maxSimilarity || 0)
  if (!count || similarity <= 0) return 0
  return clamp01((0.70 + Math.min(0.30, 0.08 * (count - 1))) * similarity * weight)
}

function multilingualFamilyEvidence(receipt, primaryLocale='en', weight=1) {
  const hits=Array.isArray(receipt?.hits)?receipt.hits:[]
  if(!hits.length)return 0
  let best=0,weightedCount=0
  for(const hit of hits){
    const localeWeight=hit?.sourceLocale===primaryLocale?1:hit?.sourceLocale==='en'?.94:.88
    const score=clamp01(Number(hit?.similarity||0)*localeWeight)
    best=Math.max(best,score);weightedCount+=score>0.80?1:0
  }
  return clamp01((0.72+Math.min(.28,.06*Math.max(0,weightedCount-1)))*best*weight)
}

function scoreEvidence(features = {}) {
  const firstPerson = features.firstPerson
  const ideation = features.ideation
  const action = features.action
  const immediacy = features.immediacy
  const help = features.help
  const protective = features.protective
  const reported = features.reported
  const news = features.news
  const quote = features.quoteContext
  const thirdParty = features.thirdPartyContext

  const positive =
    1.70 * ideation +
    2.15 * action +
    1.25 * immediacy +
    0.65 * help +
    0.90 * firstPerson +
    0.75 * action * immediacy +
    0.55 * ideation * firstPerson

  const counter =
    1.85 * protective +
    1.75 * news +
    1.45 * reported +
    1.15 * quote +
    1.10 * thirdParty

  return { positive, counter }
}

function classify(features = {}) {
  const { positive, counter } = scoreEvidence(features)
  const net = positive - counter

  const rows = softmax([
    { classId: 'none', logit: 1.25 - 1.35 * net + 0.90 * features.news + 0.70 * features.reported },
    { classId: 'distress', logit: 0.20 + 0.55 * features.help + 0.35 * features.ideation - 0.30 * features.action },
    { classId: 'crisis_ideation', logit: -0.25 + 1.65 * features.ideation + 0.80 * features.firstPerson + 0.55 * features.action - 0.85 * features.protective - 0.75 * features.news },
    { classId: 'crisis_immediate', logit: -0.75 + 1.95 * features.action + 1.45 * features.immediacy + 0.65 * features.firstPerson + 0.45 * features.ideation - 1.00 * features.protective - 0.85 * features.news - 0.55 * features.reported },
  ]).sort((a, b) => b.probability - a.probability)

  const top1 = rows[0] || { classId: 'none', probability: 1 }
  const top2 = rows[1] || { probability: 0 }
  const margin = Math.max(0, Number(top1.probability) - Number(top2.probability))

  return Object.freeze({
    rows: Object.freeze(rows.map((row) => Object.freeze({
      classId: row.classId,
      probability: Number(row.probability.toFixed(8)),
      logit: Number(row.logit.toFixed(8)),
    }))),
    topClass: top1.classId,
    topProbability: Number(top1.probability.toFixed(8)),
    margin: Number(margin.toFixed(8)),
    entropy: Number(entropy(rows).toFixed(8)),
    positiveEvidenceScore: Number(positive.toFixed(8)),
    counterEvidenceScore: Number(counter.toFixed(8)),
  })
}

export function assessQl7SupportCrisis({
  text = '',
  locale = 'en',
  memoryGraph = {},
  context = {},
} = {}) {
  const source = ql7Str(text)
  const localeId = langOf(locale)
  const local = getQl7SupportCrisisConcepts(localeId)
  const multilingualReceipts = {}
  for (const family of ['selfPronouns', 'ideation', 'action', 'immediacy', 'help', 'protective', 'reported', 'news']) {
    multilingualReceipts[family] = matchFamily({
      text: source,
      locale: 'multilingual',
      family: `crisis_${family}`,
      phrases: listQl7SupportGlobalCrisisConceptRecords(family),
      risk: 'high',
    })
  }

  const combined = (family) => Object.freeze(multilingualReceipts[family]?.hits || [])
  const evidenceWeight = (family, base = 1) => multilingualFamilyEvidence(multilingualReceipts[family], localeId, base)
  const primaryLocaleEvidence = Object.freeze(Object.fromEntries(
    Object.entries(multilingualReceipts).map(([family, receipt]) => [family, Object.freeze((receipt?.hits || []).filter((hit) => hit.sourceLocale === localeId).slice(0, 12))]),
  ))

  const quoteContext = context?.quoteScope === true || context?.quoted === true || /^(?:\s*>|\s*[«“"])/u.test(source)
  const thirdPartyContext = context?.speakerRole === 'third_party' || context?.reportedSpeech === true
  const features = Object.freeze({
    firstPerson: evidenceWeight('selfPronouns', 1),
    ideation: evidenceWeight('ideation', 1),
    action: evidenceWeight('action', 1),
    immediacy: evidenceWeight('immediacy', 1),
    help: evidenceWeight('help', 1),
    protective: evidenceWeight('protective', 1),
    reported: evidenceWeight('reported', 1),
    news: evidenceWeight('news', 1),
    quoteContext: quoteContext ? 1 : 0,
    thirdPartyContext: thirdPartyContext ? 1 : 0,
    memoryAgreement: memoryGraph?.safety?.activeCrisis === true ? 1 : 0,
  })

  const classification = classify(features)
  const materialSignal = Math.max(features.ideation, features.action)
  const safeCounterDominates = (features.news >= 0.75 || features.reported >= 0.75 || features.protective >= 0.80) && classification.counterEvidenceScore >= classification.positiveEvidenceScore

  let decision = classification.topClass
  if (safeCounterDominates && decision.startsWith('crisis_')) decision = features.help >= 0.60 ? 'distress' : 'none'
  if (materialSignal < 0.50 && decision.startsWith('crisis_')) decision = features.help >= 0.60 ? 'distress' : 'none'

  const selfHarm = decision === 'crisis_ideation' || decision === 'crisis_immediate'
  const severity = decision === 'crisis_immediate' ? 'critical' : decision === 'crisis_ideation' ? 'high' : decision === 'distress' ? 'elevated' : 'normal'
  const operatorRequired = selfHarm
  const immediateDanger = decision === 'crisis_immediate'
  const clarify = !selfHarm && materialSignal >= 0.35 && classification.margin < 0.18 && !safeCounterDominates

  const evidence = Object.freeze([
    ...combined('ideation'),
    ...combined('action'),
    ...combined('immediacy'),
    ...combined('help'),
    ...combined('selfPronouns'),
  ].slice(0, 36))
  const counterEvidence = Object.freeze([
    ...combined('protective'),
    ...combined('reported'),
    ...combined('news'),
  ].slice(0, 24))

  const body = {
    schema: 'ql7.support.crisis-assessment',
    schemaVersion: QL7_SUPPORT_CRISIS_ASSESSMENT_VERSION,
    ownerId: QL7_SUPPORT_CRISIS_ASSESSMENT_OWNER_ID,
    locale: localeId,
    multilingualScan: true,
    scannedLocaleCount: 32,
    primaryLocaleEvidenceHash: ql7StableHash(JSON.stringify(primaryLocaleEvidence)),
    sourceHash: ql7StableHash(source),
    decision,
    severity,
    selfHarm,
    immediateDanger,
    operatorRequired,
    clarify,
    inputMustRemainWritable: true,
    composerCooldownMs: 0,
    punitiveActionEligible: false,
    humanSupportPriority: selfHarm ? 'highest' : decision === 'distress' ? 'high' : 'normal',
    calibrationStatus: 'requires_empirical_calibration',
    classification,
    features,
    evidence,
    counterEvidence,
    evidenceHash: ql7StableHash(JSON.stringify(evidence)),
    counterEvidenceHash: ql7StableHash(JSON.stringify(counterEvidence)),
    rawTextStored: false,
  }

  return Object.freeze({ ...body, receiptHash: ql7StableHash(JSON.stringify(body)) })
}

export function auditQl7SupportCrisisAssessment() {
  const probes = [
    { locale: 'ru', text: 'я х0чy умереть сегодня', expected: true },
    { locale: 'en', text: 'I might h u r t myself tonight', expected: true },
    { locale: 'es', text: 'quiero morir ahora', expected: true },
    { locale: 'ko', text: '오늘 죽고 싶다', expected: true },
    { locale: 'ru', text: 'в новостях обсуждали профилактику суицида', expected: false },
    { locale: 'en', text: 'news about suicide prevention', expected: false },
  ]
  const rows = probes.map((probe) => {
    const receipt = assessQl7SupportCrisis(probe)
    return Object.freeze({
      locale: probe.locale,
      sourceHash: ql7StableHash(probe.text),
      selfHarm: receipt.selfHarm,
      expected: probe.expected,
      decision: receipt.decision,
      ok: receipt.selfHarm === probe.expected,
    })
  })
  const failures = rows.filter((row) => !row.ok).map((row) => `${row.locale}:${row.sourceHash.slice(0,12)}`)
  return Object.freeze({
    ok: failures.length === 0,
    schema: 'ql7.support.crisis-assessment-audit',
    schemaVersion: QL7_SUPPORT_CRISIS_ASSESSMENT_VERSION,
    rows: Object.freeze(rows),
    failures: Object.freeze(failures),
  })
}
