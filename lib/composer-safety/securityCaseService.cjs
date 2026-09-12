const crypto = require('node:crypto')
const caseAuthority = require('../ql7-support/operator/caseAuthority.cjs')
let testDb = null
function str(v) { return String(v ?? '').trim() }
function sha(value) { return crypto.createHash('sha256').update(String(value ?? '')).digest('hex') }
function normalizeDatabase(handle) { const database=handle?.db&&typeof handle.db.collection==='function'?handle.db:handle;if(!database||typeof database.collection!=='function')throw new Error('mongo_db_unavailable');return database }
async function productionDatabase(){if(testDb)return normalizeDatabase(testDb);const {getMongoDb}=require('../mongo/client.cjs');return normalizeDatabase(await getMongoDb())}
function createComposerSecurityCaseService({database=null,getDatabase=null}={}){if(!database&&typeof getDatabase!=='function')throw new Error('composer_security_case_database_dependency_required');const db=async()=>normalizeDatabase(database||await getDatabase());async function createComposerSecurityCase({actorAccountId,surface,classId,decisionId,contentHash,evidence=[],now=Date.now()}={}){const actor=str(actorAccountId);if(!actor||!str(decisionId))throw new Error('composer_security_case_identity_required');return caseAuthority.createOrGetCase({database:await db(),caseKind:'composer_security',actorId:actor,actorIdHash:sha(actor),operationId:str(decisionId),surface:str(surface),classId:str(classId),contentHash:str(contentHash),evidence,status:'ready_for_review',privacyClass:'security_minimized',now,extra:{sourceAuthority:'composer.semantic-safety'}})}return Object.freeze({createComposerSecurityCase})}
const productionService=createComposerSecurityCaseService({getDatabase:productionDatabase})
function __setTestDb(value){testDb=value||null}
module.exports={...productionService,createComposerSecurityCaseService,__setTestDb}
