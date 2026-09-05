import {scoreQl7Sparse} from './sparseIndex.js'
import {searchQl7LocalEmbeddingIndex} from './localEmbeddingIndex.js'
import {rerankQl7Evidence} from './neuralReranker.js'
import {resolveQl7KnowledgeConflicts} from './conflictResolver.js'
import {createQl7EvidencePack} from './evidencePack.js'
import {ql7StableHash} from '../../internal/text.js'
export function retrieveQl7HybridEvidence({query='',queryVector=[],rows=[],snapshotId='',limit=24}={}){const denseById=new Map(searchQl7LocalEmbeddingIndex(queryVector,rows,Math.max(limit,rows.length)).map(x=>[x.claimId||x.id,x.embeddingScore]));const scored=rows.map(r=>({...r,sparseScore:scoreQl7Sparse(query,`${r.proposition||''} ${(r.aliases||[]).join(' ')}`),embeddingScore:denseById.get(r.claimId||r.id)||Number(r.embeddingScore||0)}));const ranked=rerankQl7Evidence(scored).slice(0,limit),resolved=resolveQl7KnowledgeConflicts(ranked);return createQl7EvidencePack({queryHash:ql7StableHash(query),snapshotId,claims:resolved.accepted,conflicts:resolved.conflicts,coverage:ranked.length?Math.min(1,ranked.reduce((s,r)=>s+Math.max(0,r.hybridScore||0),0)/ranked.length):0})}
