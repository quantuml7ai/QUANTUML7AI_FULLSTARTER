import {ql7Arr,ql7StableHash,ql7Str} from '../internal/text.js'
export const QL7_NORMALIZATION_LATTICE_SCHEMA='ql7.native.normalization-lattice'
const TYPES=new Set(['identity','unicode_nfkc','casefold','typo','insertion','deletion','substitution','transposition','leet','unicode_confusable','zero_width','translit','wrong_layout','split_join','code_switch','dialect','slang','euphemism','asr_noise'])
export function normalizeQl7NormalizationLattice(raw={},originalText=''){
 const candidates=ql7Arr(raw.candidates).slice(0,64).map((x)=>Object.freeze({originalSpan:ql7Str(x.originalSpan),candidateText:ql7Str(x.candidateText),transformType:TYPES.has(x.transformType)?x.transformType:'identity',probability:Math.min(1,Math.max(0,Number(x.probability||0))),localeHypothesis:ql7Str(x.localeHypothesis||'und'),protected:x.protected===true,evidence:Object.freeze(ql7Arr(x.evidence).slice(0,16)),provenance:ql7Str(x.provenance||'native')}))
 const body={schema:QL7_NORMALIZATION_LATTICE_SCHEMA,schemaVersion:1,originalTextHash:ql7StableHash(ql7Str(originalText)),candidates:Object.freeze(candidates)}
 return Object.freeze({...body,latticeHash:ql7StableHash(JSON.stringify(body))})
}
