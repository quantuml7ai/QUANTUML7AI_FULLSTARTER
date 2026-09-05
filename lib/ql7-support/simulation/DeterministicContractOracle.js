import crypto from 'node:crypto'
const h=(v)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
const arr=(v)=>Array.isArray(v)?v:[]
export function evaluateQl7SupportContractOracle({scenario={},result={},productionDelivery={}}={}){const failures=[],expected=scenario.expected||{},surface=result.surface||{};
const analysis=result.analysis||{};
if(expected.topic&&analysis.topic!==expected.topic)failures.push({code:'wrong_topic',expected:expected.topic,actual:analysis.topic,severity:'high'});
if(expected.messageAct&&analysis.messageAct!==expected.messageAct)failures.push({code:'wrong_message_act',expected:expected.messageAct,actual:analysis.messageAct,severity:'high'});
if(expected.surfaceKind&&surface.surfaceKind!==expected.surfaceKind)failures.push({code:'wrong_surface_kind',expected:expected.surfaceKind,actual:surface.surfaceKind,severity:'high'});
if(expected.tableSchema&&!arr(surface.tables).some((t)=>t?.schema===expected.tableSchema))failures.push({code:'required_table_missing',expected:expected.tableSchema,severity:'high'});
if(expected.operatorCase===true&&!result.operatorCase)failures.push({code:'operator_case_missing',severity:'critical'});
if(expected.noAdapter===true&&arr(result.adapterReceipts).some((r)=>r?.executed===true))failures.push({code:'protected_adapter_executed',severity:'critical'});
if(expected.allowed!==undefined&&Boolean(result.composerPolicy?.allowed)!==Boolean(expected.allowed))failures.push({code:'composer_allowed_mismatch',severity:'critical'});
if(expected.cooldownMs!==undefined&&Number(result.composerPolicy?.cooldownMs||0)!==Number(expected.cooldownMs))failures.push({code:'cooldown_mismatch',severity:'high'});
if(!String(result.text||'').trim())failures.push({code:'empty_final_text',severity:'critical'});
if(!productionDelivery?.receipt?.receiptHash||productionDelivery?.receipt?.commitState!=='committed')failures.push({code:'sealed_delivery_not_committed',severity:'critical'});
if(result.runtimeParity?.sameExecutor!==true)failures.push({code:'production_simulation_executor_mismatch',severity:'critical'});
const body={oracle:'canonical-deterministic-contract',schemaVersion:'5.1.0',scenarioId:scenario.id||'',failures,ok:!failures.length};
return Object.freeze({...body,receiptHash:h(body)})}
export function evaluateQl7SupportDeterministicSemanticConsistency(result={}){const failures=[];
const fact=result.factProjection||result.plan?.factProjection;
const rows=(result.surface?.tables||[]).flatMap((t)=>t?.rows||[]);
if(fact?.topic==='vip'&&fact.verified){const status=String(rows.find((r)=>r?.key==='status')?.value||'').toLowerCase();
if(status&&status!==String(fact.status||'').toLowerCase())failures.push({code:'verified_fact_text_table_mismatch',severity:'critical'})}if(result.safety?.category==='insult_uncertain'&&(!result.composerPolicy?.allowed||Number(result.safety?.cooldownMs||0)>0))failures.push({code:'uncertain_insult_wrong_cooldown',severity:'critical'});
return Object.freeze({oracle:'canonical-semantic-consistency',schemaVersion:'5.1.0',ok:!failures.length,failures:Object.freeze(failures)})}
