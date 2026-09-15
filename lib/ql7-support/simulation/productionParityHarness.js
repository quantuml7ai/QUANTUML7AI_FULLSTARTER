import {executeQl7SupportTurnRuntime} from '../runtime/executeTurn.js'
import {
  buildQl7SupportProductionTurnInput,
  executeQl7SupportProductionTurn,
  finalizeQl7SupportCanonicalRuntimeDelivery,
  projectQl7SupportProductionDelivery,
  finalizeQl7SupportProductionDelivery,
  resolveQl7SupportProductionUnderstanding,
  QL7_SUPPORT_PRODUCTION_TURN_VERSION,
} from '../runtime/productionTurn.js'
import {commitQl7SupportFinalDelivery} from '../runtime/deliveryCommitCoordinator.js'

export const QL7_SUPPORT_PRODUCTION_PARITY_HARNESS_VERSION = '15.4.0'

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

const PARITY_SIGNING_KEY = 'ql7-support-non-production-delivery-key.1'
const PARITY_KEY_ID = 'delivery-key:non-production.1'

async function commitParityCandidate(candidate, input = {}, runtime = {}) {
  const messageId = `parity:${candidate.candidateHash}`
  const nowMs = Date.parse(input.now || '') || 1786665600000
  return commitQl7SupportFinalDelivery({
    candidate,
    runtime,
    signingKey: PARITY_SIGNING_KEY,
    keyId: PARITY_KEY_ID,
    clock: () => nowMs,
    transport: async () => ({
      messageId,
      providerReceiptId: 'parity-transport.1',
      transportEvidence: { messageId, candidateHash: candidate.candidateHash },
    }),
  })
}

export async function runQl7SupportProductionParityCase(input = {}, adapters = {}) {
  const understoodInput = await resolveQl7SupportProductionUnderstanding(input)
  const runtimeInput = buildQl7SupportProductionTurnInput(understoodInput)
  const product = await executeQl7SupportProductionTurn(understoodInput, adapters)
  const directRuntime = executeQl7SupportTurnRuntime(runtimeInput, adapters)
  const deliveryOverrides = input.productionDeliveryOverrides || {}
  const productCandidate = Object.keys(deliveryOverrides).length
    ? finalizeQl7SupportProductionDelivery({
      productionTurn: product,
      ...deliveryOverrides,
    })
    : product.delivery
  const directCandidate = Object.keys(deliveryOverrides).length
    ? projectQl7SupportProductionDelivery(directRuntime, deliveryOverrides)
    : await finalizeQl7SupportCanonicalRuntimeDelivery(directRuntime, understoodInput)
  const [productDelivery, directDelivery] = await Promise.all([
    commitParityCandidate(productCandidate, input, product.runtime),
    commitParityCandidate(directCandidate, input, directRuntime),
  ])

  const runtimeInputParity = sameValue(product.runtimeInput, runtimeInput)
  const deliveryParity = sameValue(productDelivery, directDelivery)

  return Object.freeze({
    ok: runtimeInputParity && deliveryParity,
    productionTurnVersion: QL7_SUPPORT_PRODUCTION_TURN_VERSION,
    runtimeInputParity,
    deliveryParity,
    production: productDelivery,
    direct: directDelivery,
    productionRuntimeInput: product.runtimeInput,
    directRuntimeInput: runtimeInput,
  })
}
