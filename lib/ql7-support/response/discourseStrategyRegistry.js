export const QL7_SUPPORT_DISCOURSE_STRATEGY_VERSION = '5.2.2'
export const QL7_SUPPORT_DISCOURSE_STRATEGY_OWNER_ID = 'ql7-support.discourse-strategy-registry'

const BASE = Object.freeze([
  Object.freeze({id:'direct-fact-next',families:Object.freeze(['fact','knowledge']),stages:Object.freeze(['answer','evidence','next-step']),maxQuestions:1}),
  Object.freeze({id:'direct-reason-clarify',families:Object.freeze(['clarification']),stages:Object.freeze(['known','uncertainty','material-question']),maxQuestions:1}),
  Object.freeze({id:'acknowledge-answer-next',families:Object.freeze(['dialogue','relationship']),stages:Object.freeze(['acknowledge-if-evidenced','answer','continuation']),maxQuestions:1}),
  Object.freeze({id:'boundary-alternative',families:Object.freeze(['safety']),stages:Object.freeze(['boundary','safe-alternative']),maxQuestions:1}),
  Object.freeze({id:'evidence-uncertainty-action',families:Object.freeze(['incident','fact']),stages:Object.freeze(['status','evidence','uncertainty','allowed-action']),maxQuestions:1}),
  Object.freeze({id:'human-topic-continuity',families:Object.freeze(['dialogue','knowledge']),stages:Object.freeze(['answer','contextual-detail','continuation']),maxQuestions:1}),
])

const FAMILY_STAGE = Object.freeze({
  fact:Object.freeze(['answer','evidence','interpretation','allowed-action']),
  knowledge:Object.freeze(['answer','context','example','continuation']),
  clarification:Object.freeze(['known','uncertainty','contrast','material-question']),
  dialogue:Object.freeze(['anchor','answer','contextual-detail','continuation']),
  relationship:Object.freeze(['acknowledge-if-evidenced','material-goal','safe-next-step','continuation']),
  safety:Object.freeze(['human-boundary','risk-context','safe-alternative','one-question-if-needed']),
  incident:Object.freeze(['incident-summary','verified-evidence','uncertainty','allowed-action']),
})
const FOCUS=Object.freeze(['direct','contrast','cause','outcome'])
const EVIDENCE=Object.freeze(['evidence-first','meaning-first','source-first','uncertainty-first'])
const RHYTHM=Object.freeze(['compact','balanced','two-beat','progressive'])

function generatedStrategies(){
  const rows=[]
  for(const [family,stages] of Object.entries(FAMILY_STAGE)){
    for(const focus of FOCUS)for(const evidence of EVIDENCE)for(const rhythm of RHYTHM){
      const id=`${family}:${focus}:${evidence}:${rhythm}`
      rows.push(Object.freeze({id,families:Object.freeze([family]),stages,maxQuestions:1,focus,evidenceOrder:evidence,rhythm,readyToSend:false,finalText:false}))
    }
  }
  return rows
}

export const QL7_SUPPORT_DISCOURSE_STRATEGIES=Object.freeze([...BASE,...generatedStrategies()])
export const QL7_SUPPORT_DISCOURSE_STRATEGY_COUNT=QL7_SUPPORT_DISCOURSE_STRATEGIES.length

function stableIndex(seed,length){if(!length)return 0;const numeric=Number(seed);if(Number.isFinite(numeric))return Math.abs(Math.trunc(numeric))%length;let hash=2166136261;for(const char of String(seed??'')){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619)}return Math.abs(hash>>>0)%length}

export function selectQl7SupportDiscourseStrategy({family='',seed=0,forbiddenStrategyIds=[]}={}){
 const forbidden=new Set((forbiddenStrategyIds||[]).map(String))
 const candidates=QL7_SUPPORT_DISCOURSE_STRATEGIES.filter((strategy)=>(!family||strategy.families.includes(family))&&!forbidden.has(strategy.id))
 const fallback=QL7_SUPPORT_DISCOURSE_STRATEGIES.filter((strategy)=>!forbidden.has(strategy.id))
 const rows=candidates.length?candidates:fallback
 return rows[stableIndex(seed,rows.length)]||QL7_SUPPORT_DISCOURSE_STRATEGIES[0]
}

export function auditQl7SupportDiscourseStrategyCapacity(){
 const failures=[];const ids=new Set(QL7_SUPPORT_DISCOURSE_STRATEGIES.map((row)=>row.id))
 if(ids.size!==QL7_SUPPORT_DISCOURSE_STRATEGY_COUNT)failures.push('duplicate_strategy_id')
 if(QL7_SUPPORT_DISCOURSE_STRATEGY_COUNT<100)failures.push('strategy_space_below_100')
 if(QL7_SUPPORT_DISCOURSE_STRATEGIES.some((row)=>row.readyToSend===true||row.finalText===true))failures.push('stored_final_text_strategy')
 return Object.freeze({ok:failures.length===0,version:QL7_SUPPORT_DISCOURSE_STRATEGY_VERSION,count:QL7_SUPPORT_DISCOURSE_STRATEGY_COUNT,failures:Object.freeze(failures)})
}
