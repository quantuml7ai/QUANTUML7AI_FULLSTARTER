import {measureQl7EntityMentionBudget} from './entityMentionBudget.js'
export function evaluateQl7SurfaceSemanticDensity(surface={},entities=[]){const rows=entities.map(e=>measureQl7EntityMentionBudget(e,surface));return Object.freeze({ok:rows.every(x=>!x.overBudget),entities:Object.freeze(rows),duplicateEntityCount:rows.filter(x=>x.overBudget).length})}
