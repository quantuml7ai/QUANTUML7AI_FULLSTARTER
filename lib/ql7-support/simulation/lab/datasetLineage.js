import crypto from 'node:crypto'

export const QL7_SUPPORT_DATASET_LINEAGE_VERSION = '5.1.1'
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')

function frozenStrings(values = []) {
  return Object.freeze([...(values || [])].map(String).filter(Boolean))
}

export function buildDatasetLineage({
  scenario = {},
  familyId = '',
  splitId = '',
  parentIds = [],
  sourceCorpusIds = [],
  mutationChain = [],
} = {}) {
  const body = {
    schema: 'ql7.support.lab.dataset-lineage',
    schemaVersion: QL7_SUPPORT_DATASET_LINEAGE_VERSION,
    scenarioId: String(scenario?.id || ''),
    familyId: String(familyId || scenario?.lab?.bucket || ''),
    splitId: String(splitId || scenario?.lab?.splitId || ''),
    parentIds: frozenStrings(parentIds),
    sourceCorpusIds: frozenStrings(sourceCorpusIds),
    mutationChain: Object.freeze([...(mutationChain || [])]),
    semanticSignature: hash({
      input: scenario?.input || scenario?.text || '',
      expected: scenario?.expected || {},
      analysis: scenario?.analysis || {},
    }),
  }

  return Object.freeze({
    ...body,
    lineageHash: hash(body),
  })
}
