import { executeQl7SupportTurnRuntime } from '../runtime/executeTurn.js'
import {
  buildQl7SupportProductionTurnInput,
  executeQl7SupportProductionTurn,
  projectQl7SupportProductionDelivery,
  finalizeQl7SupportProductionDelivery,
  QL7_SUPPORT_PRODUCTION_TURN_VERSION,
} from '../runtime/productionTurn.js'

export const QL7_SUPPORT_PRODUCTION_PARITY_HARNESS_VERSION = '15.2.1'

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function runQl7SupportProductionParityCase(input = {}, adapters = {}) {
  const runtimeInput = buildQl7SupportProductionTurnInput(input)
  const product = executeQl7SupportProductionTurn(input, adapters)
  const directRuntime = executeQl7SupportTurnRuntime(runtimeInput, adapters)
  const deliveryOverrides = input.productionDeliveryOverrides || {}
  const productDelivery = Object.keys(deliveryOverrides).length
    ? finalizeQl7SupportProductionDelivery({
      productionTurn: product,
      ...deliveryOverrides,
    })
    : product.delivery
  const directDelivery = Object.keys(deliveryOverrides).length
    ? projectQl7SupportProductionDelivery(directRuntime, deliveryOverrides)
    : projectQl7SupportProductionDelivery(directRuntime)

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
