import crypto from 'node:crypto'
import {normalizeQl7SupportOntologyNode} from './nodeSchemas.js'
export const QL7_SUPPORT_ONTOLOGY_MIGRATION_VERSION='5.1.0'
export function migrateQl7LegacyKnowledgeNode(node={}){const domainId=String(node.domainId||'').trim();
const canonicalLabel=String(node.canonicalName||node.label||node.nodeId||domainId).trim();
const migrated=normalizeQl7SupportOntologyNode({nodeId:`legacy:${String(node.nodeId||crypto.createHash('sha256').update(JSON.stringify(node)).digest('hex').slice(0,16))}`,nodeType:node.nodeKind==='DomainNode'?'DomainNode':'MicrotopicNode',canonicalLabel,aliasesByLocale:node.aliasesByLocale||{},parentIds:[],status:String(node.availability||'unknown'),validFrom:String(node.lastVerifiedAt||''),validTo:'',sourceReceiptIds:[...(node.sourceRefs||[])],requiredEvidenceTypes:['source_receipt'],forbiddenClaims:[...(node.forbiddenClaims||[])],privacyClass:'public',ownerId:'ql7-support.ontology',domainId});
return Object.freeze({schema:'ql7.support.ontology-migration-receipt',schemaVersion:QL7_SUPPORT_ONTOLOGY_MIGRATION_VERSION,sourceNodeId:String(node.nodeId||''),targetNode:migrated,migrationHash:crypto.createHash('sha256').update(JSON.stringify(migrated)).digest('hex')})}
