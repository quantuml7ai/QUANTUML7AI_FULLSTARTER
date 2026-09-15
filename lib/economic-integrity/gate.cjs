const economic = require('./index.cjs')
const productionRoute = require('./productionRoute.cjs')
module.exports = Object.freeze({
  schemaVersion: '5.1.0',
  authorize: economic.authorizeEconomicOperation,
  execute: economic.executeEconomicOperation,
  executeVerified: productionRoute.executeVerifiedEconomicOperation,
  beginVerified: productionRoute.beginVerifiedEconomicOperation,
  commitVerified: productionRoute.commitVerifiedEconomicOperation,
  abortVerified: productionRoute.abortVerifiedEconomicOperation,
})
