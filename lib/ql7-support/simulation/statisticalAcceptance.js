// Compatibility/statistical facade.
// Mathematical implementations stay in the canonical lab statistical owners.
export {
  clopperPearsonUpperZero,
  wilsonInterval,
  punitiveFalsePositiveClaim,
  bootstrapMeanInterval,
  confusionMetrics,
  cohenKappaInterval,
} from './lab/statisticalEngine.js'

export { evaluatePowerAdequacy } from './lab/powerAnalysis.js'
