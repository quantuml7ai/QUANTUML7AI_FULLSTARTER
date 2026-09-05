// Shared Mongo transaction context for operations that span repositories.

const { AsyncLocalStorage } = require('node:async_hooks')

const STORE_KEY = '__ql7MongoTransactionStorageV1'
const storage = globalThis[STORE_KEY] || new AsyncLocalStorage()
globalThis[STORE_KEY] = storage

let testTransactionRunner = null

const COLLECTION_OPTION_INDEX = Object.freeze({
  aggregate: 1,
  bulkWrite: 1,
  countDocuments: 1,
  deleteMany: 1,
  deleteOne: 1,
  distinct: 2,
  estimatedDocumentCount: 0,
  find: 1,
  findOne: 1,
  findOneAndDelete: 1,
  findOneAndReplace: 2,
  findOneAndUpdate: 2,
  insertMany: 1,
  insertOne: 1,
  replaceOne: 2,
  updateMany: 2,
  updateOne: 2,
})

function currentMongoSession() {
  return storage.getStore()?.session || null
}

async function memoizeMongoContext(key, loader) {
  if (typeof loader !== 'function') throw new Error('mongo_context_loader_required')
  const store = storage.getStore()
  const cacheKey = String(key || '').trim()
  if (!store?.memo || !cacheKey) return loader()
  if (store.memo.has(cacheKey)) return store.memo.get(cacheKey)
  const pending = Promise.resolve().then(loader)
  store.memo.set(cacheKey, pending)
  try {
    return await pending
  } catch (error) {
    if (store.memo.get(cacheKey) === pending) store.memo.delete(cacheKey)
    throw error
  }
}

async function withMongoOperationContext(work) {
  if (typeof work !== 'function') throw new Error('mongo_operation_work_required')
  if (storage.getStore()) return work()
  return storage.run({ session: null, memo: new Map() }, work)
}

function bindCollectionSession(collection, session) {
  if (!collection || !session) return collection
  return new Proxy(collection, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (typeof value !== 'function') return value
      const optionIndex = COLLECTION_OPTION_INDEX[property]
      if (!Number.isInteger(optionIndex)) return value.bind(target)
      return (...inputArgs) => {
        const args = [...inputArgs]
        while (args.length <= optionIndex) args.push(undefined)
        const previous = args[optionIndex]
        args[optionIndex] = {
          ...(previous && typeof previous === 'object' ? previous : {}),
          session,
        }
        return value.apply(target, args)
      }
    },
  })
}

function bindMongoDatabase(database) {
  const session = currentMongoSession()
  if (!database || !session || typeof database.collection !== 'function') return database
  return new Proxy(database, {
    get(target, property, receiver) {
      if (property === 'collection') {
        return (...args) => bindCollectionSession(target.collection(...args), session)
      }
      const value = Reflect.get(target, property, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}

async function withMongoTransaction(work, options = {}) {
  if (typeof work !== 'function') throw new Error('mongo_transaction_work_required')

  if (testTransactionRunner) {
    return testTransactionRunner((session = { test: true }) => (
      storage.run({ session, memo: storage.getStore()?.memo || new Map() }, work)
    ))
  }

  const { getMongoDb } = require('./client.cjs')
  const handle = await getMongoDb()
  const client = handle?.client
  if (!client || typeof client.startSession !== 'function') {
    throw new Error('mongo_transaction_session_unavailable')
  }

  const session = client.startSession()
  let result
  try {
    await session.withTransaction(async () => {
      result = await storage.run({ session, memo: storage.getStore()?.memo || new Map() }, work)
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary',
      maxCommitTimeMS: Math.max(1_000, Number(options.maxCommitTimeMS || 15_000)),
    })
    return result
  } finally {
    await Promise.resolve(session.endSession()).catch(() => {})
  }
}

function __setTestTransactionRunner(runner) {
  testTransactionRunner = typeof runner === 'function' ? runner : null
}

module.exports = {
  __setTestTransactionRunner,
  bindMongoDatabase,
  currentMongoSession,
  memoizeMongoContext,
  withMongoOperationContext,
  withMongoTransaction,
}
