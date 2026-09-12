import crypto from 'node:crypto'

export const QL7_SUPPORT_LAB_ROOT_CAUSE_VERSION = '5.1.1'

const hash = (value) => crypto
  .createHash('sha256')
  .update(String(value ?? ''))
  .digest('hex')

function stageFor(code = '') {
  const value = String(code)
  if (/normal/u.test(value)) return 'normalization'
  if (/language|locale|english/u.test(value)) return 'language detection'
  if (/entity|contact/u.test(value)) return 'entity resolution'
  if (/intent/u.test(value)) return 'intent classification'
  if (/domain|topic/u.test(value)) return 'domain/microtopic scope'
  if (/emotion/u.test(value)) return 'emotion inference'
  if (/safety|threat|insult/u.test(value)) return 'safety classification'
  if (/adapter|fact|source/u.test(value)) return 'fact adapter'
  if (/memory|resume|correction/u.test(value)) return 'memory transition'
  if (/semantic.plan/u.test(value)) return 'semantic plan'
  if (/realiz|human|grammar/u.test(value)) return 'realization'
  if (/duplicate|novelty|skeleton/u.test(value)) return 'novelty'
  if (/delivery|commit|receipt/u.test(value)) return 'delivery commit'
  if (/action|cta/u.test(value)) return 'fact/action parity'
  if (/surface|badge|table|title/u.test(value)) return 'surface rendering'
  if (/composer|economic|quarantine|restriction|policy/u.test(value)) return 'policy authorization'
  if (/infrastructure/u.test(value)) return 'infrastructure'
  return 'oracle disagreement'
}

export function createQl7RootCauseAccumulator() {
  const clusters = new Map()

  return Object.freeze({
    add({ failureCode = '', scenario = {}, result = {}, capability = {} } = {}) {
      const code = String(failureCode || 'unknown')
      const locale = String(scenario.locale || 'unknown')
      const domain = String(result.analysis?.topic || scenario.expected?.topic || 'unknown')
      const rootStage = stageFor(code)
      const key = `${rootStage}|${code}|${locale}|${domain}`

      let row = clusters.get(key)
      if (!row) {
        row = {
          clusterId: `cluster:${hash(key).slice(0, 24)}`,
          failureCode: code,
          rootStage,
          locale,
          domain,
          microtopic: String(result.scopeReceipt?.primaryMicrotopicId || ''),
          count: 0,
          semanticFamilyIds: [],
          representativeScenarioIds: [],
          minimalReproductionId: '',
          featureContributionSummary: {},
          counterfactualResults: [],
          ablationResults: [],
          candidateOwnerFiles: [],
          proposedChangeIds: [],
          regressionSetIds: [],
        }
        clusters.set(key, row)
      }

      row.count += 1
      if (row.representativeScenarioIds.length < 12) {
        row.representativeScenarioIds.push(String(scenario.id || ''))
      }
      if (!row.minimalReproductionId) {
        row.minimalReproductionId = String(scenario.id || '')
      }

      const owner = String(capability?.productionOwner || '')
      if (owner && !row.candidateOwnerFiles.includes(owner)) {
        row.candidateOwnerFiles.push(owner)
      }
      const capabilityId = String(capability?.capabilityId || '')
      if (capabilityId && !row.semanticFamilyIds.includes(capabilityId)) {
        row.semanticFamilyIds.push(capabilityId)
      }
    },

    snapshot() {
      const rows = [...clusters.values()]
        .sort((a, b) => b.count - a.count)
        .map((row) => Object.freeze({
          ...row,
          representativeScenarioIds: Object.freeze(row.representativeScenarioIds),
          candidateOwnerFiles: Object.freeze(row.candidateOwnerFiles),
          semanticFamilyIds: Object.freeze(row.semanticFamilyIds),
        }))
      return Object.freeze(rows)
    },
  })
}
