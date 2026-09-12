import {ql7StableHash, ql7Str} from '../internal/text.js'
import {classifyQl7SupportHumanTopic} from './humanTopicOntology.js'
import {createQl7SupportGeneralKnowledgeNode, auditQl7SupportGeneralKnowledgeNode} from './knowledgeNodeSchema.js'
import {buildQl7SupportKnowledgeSourceReceipt} from './sourceReceipt.js'
import {QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH, resolveQl7SupportPublicFigureFromGraph} from './publicFigureKnowledgeGraph.js'
import {resolveQl7SupportReligionTopic} from './religionKnowledgeRegistry.js'

export const QL7_SUPPORT_GENERAL_KNOWLEDGE_VERSION = '5.2.0-pragmatic-stable-concepts'
const SOURCE_DATE='2026-08-06'
function fact(subjectId, relation, objectConceptId, { currentSensitive=false, sourceRef='', objectValue='' }={}){
 const factId=`general:${subjectId}:${relation}:${objectConceptId||String(objectValue)}`
 const claimHash=ql7StableHash(JSON.stringify({subjectId,relation,objectConceptId,objectValue}))
 const receipt=buildQl7SupportKnowledgeSourceReceipt({factId,subjectId,sourceClass:currentSensitive?'official_public_source':'curated_stable',sourceRef:sourceRef||`project:ql7-support/general/${subjectId}`,verifiedAt:SOURCE_DATE,freshnessClass:currentSensitive?'current-sensitive':'stable-concept',currentSensitive,claimHash})
 return Object.freeze({factId,subjectId,relation,objectConceptId,objectValue,sourceReceipt:receipt,immutable:!currentSensitive})
}
function node(nodeId,category,aliases,facts=[],opts={}){return createQl7SupportGeneralKnowledgeNode({nodeId,category,aliases,semanticFacts:facts,currentSensitive:opts.currentSensitive===true,ambiguity:opts.ambiguity||'',entityType:opts.entityType||'topic',sourceRequirement:opts.sourceRequirement||'curated_or_current',selectionPolicy:opts.selectionPolicy||''})}

const NODES=Object.freeze([
 node('nature.oceans','nature',['ocean','oceans','sea','seas','океан','океаны','море','моря','océano','mar','okyanus','deniz','محيط','بحر','海洋','ים','אוקיינוס'],[
   fact('nature.oceans','instance_of','earth_system'), fact('nature.oceans','focuses_on','climate_and_ecosystems'),
 ]),
 node('transport.cars','cars',['car','cars','automobile','автомобиль','машина','авто','автомобіль','coche','auto','araba','سيارة','汽车','רכב'],[
   fact('transport.cars','instance_of','road_vehicle'), fact('transport.cars','uses','multiple_powertrain_types'),
 ]),
 node('transport.motorcycles','motorcycles',['motorcycle','motorbike','moto','мотоцикл','мото','мотоцикл','motocicleta','motosiklet','دراجة نارية','摩托车','אופנוע'],[
   fact('transport.motorcycles','instance_of','powered_two_wheel_vehicle'), fact('transport.motorcycles','associated_with','rider_safety_equipment'),
 ]),
 node('sports.football','football',['football','soccer','футбол','fútbol','futbol','كرة القدم','足球','כדורגל'],[
   fact('sports.football','instance_of','team_ball_sport'), fact('sports.football','associated_with','eleven_player_standard_field_side'),
 ]),
 node('sports.boxing','boxing',['boxing','бокс','boxeo','boks','الملاكمة','拳击','איגרוף'],[
   fact('sports.boxing','instance_of','combat_sport'), fact('sports.boxing','uses','gloved_striking_rules'),
 ]),
 node('sports.mma-ufc','mma_ufc',['mma','ufc','mixed martial arts','смешанные единоборства','мма','ufc','artes marciales mixtas','karma dövüş sanatları','فنون القتال المختلطة','综合格斗','אמנויות לחימה משולבות'],[
   fact('sports.mma-ufc','instance_of','combat_sport_context'), fact('sports.mma-ufc','distinct_from','ufc_is_promotion_not_sport'),
 ]),
 node('sports.formula1','motorsport',['formula 1','f1','формула 1','formula uno','formula bir','فورمولا 1','一级方程式','פורמולה 1'],[
   fact('sports.formula1','instance_of','single_seater_motorsport'),
 ]),
 node('entertainment.theme-parks','theme_parks',['theme park','amusement park','disneyland','disney world','парк развлечений','диснейленд','дисней ворлд','parque temático','disneyland','tema parkı','ديزني لاند','مدينة ملاهي','迪士尼乐园','פארק שעשועים'],[
   fact('entertainment.theme-parks','instance_of','entertainment_destination'), fact('entertainment.theme-parks','associated_with','rides_shows_and_theming'),
 ]),
 node('technology.ai','ai',['artificial intelligence','ai','искусственный интеллект','ии','штучний інтелект','ia','yapay zeka','الذكاء الاصطناعي','人工智能','בינה מלאכותית'],[
   fact('technology.ai','instance_of','computer_science_field'), fact('technology.ai','focuses_on','systems_performing_intelligent_tasks'),
 ]),
 node('technology.blockchain','blockchain',['blockchain','block chain','distributed ledger','блокчейн','распределённый реестр','розподілений реєстр','cadena de bloques','blok zinciri','blokzincir','سلسلة الكتل','区块链','בלוקציין','בלוקצ׳יין'],[
   fact('technology.blockchain','instance_of','distributed_ledger_system'),
   fact('technology.blockchain','uses','cryptographic_linking_and_consensus'),
   fact('technology.blockchain','focuses_on','verifiable_shared_history'),
 ]),
 node('finance.bitcoin-basics','bitcoin',['bitcoin','btc','биткоин','биткойн','биток','битка','біткоїн','біток','bitcóin','bitkoin','بيتكوين','比特币','ביטקוין'],[
   fact('finance.bitcoin-basics','instance_of','decentralized_digital_asset'),
   fact('finance.bitcoin-basics','uses','public_blockchain'),
   fact('finance.bitcoin-basics','affected_by','adoption_liquidity_regulation_and_risk'),
   fact('finance.bitcoin-basics','safety_boundary','educational_context_not_price_prediction'),
 ],{selectionPolicy:'stable_concepts_only_no_price_forecast'}),
 node('psychology.change-uncertainty','change_psychology',['fear of change','why people fear change','people fear change','uncertainty and change','страх перемен','боятся перемен','люди боятся перемен','страх змін','бояться змін','люди бояться змін','miedo al cambio','insanlar değişimden korkar','الخوف من التغيير','لماذا يخاف الناس من التغيير','害怕改变','人们为什么害怕改变','פחד משינוי','למה אנשים מפחדים משינוי'],[
   fact('psychology.change-uncertainty','affected_by','uncertainty_and_loss_of_control'),
   fact('psychology.change-uncertainty','associated_with','habit_and_predictability'),
   fact('psychology.change-uncertainty','can_help','gradual_steps_and_clear_options'),
 ],{selectionPolicy:'general_psychology_not_diagnosis'}),
 node('science.space','space',['space','astronomy','cosmos','космос','астрономия','космос','astronomía','uzay','الفضاء','太空','חלל'],[
   fact('science.space','instance_of','astronomy_and_spaceflight_topic'),
 ]),
 node('religion.neutral_overview','religion',['religion','религия','релігія','religión','din','دين','宗教','דת'],[
   fact('religion.neutral_overview','distinct_from','nationality_or_ethnicity'), fact('religion.neutral_overview','focuses_on','belief_practice_community_ethics'),
 ],{selectionPolicy:'neutrality_and_non_conflation'}),
 node('health.general-boundary','health_general',['health','здоровье','здоров’я','salud','sağlık','الصحة','健康','בריאות'],[
   fact('health.general-boundary','safety_boundary','general_information_not_diagnosis'),
 ],{selectionPolicy:'no_diagnosis'}),
 node('history.general','history',['history','история','історія','historia','tarih','التاريخ','历史','היסטוריה'],[
   fact('history.general','instance_of','study_of_past_events_and_societies'),
 ]),
 node('culture.cinema','cinema',['cinema','film','movie','кино','фильм','кіно','película','sinema','فيلم','电影','קולנוע'],[
   fact('culture.cinema','instance_of','audiovisual_art_and_industry'),
 ]),
 node('culture.music','music',['music','музыка','музика','música','müzik','موسيقى','音乐','מוזיקה'],[
   fact('culture.music','instance_of','performing_and_compositional_art'),
 ]),
 node('business.general','business_general',['business','entrepreneurship','startup','бизнес','предпринимательство','бізнес','empresa','girişimcilik','أعمال','商业','עסקים'],[
   fact('business.general','instance_of','economic_and_organizational_activity'),
 ]),
])

export const QL7_SUPPORT_GENERAL_KNOWLEDGE_REGISTRY=Object.freeze(Object.fromEntries(NODES.map(n=>[n.nodeId,n])))
export const QL7_SUPPORT_GENERAL_KNOWLEDGE_REGISTRY_HASH=ql7StableHash(JSON.stringify(NODES))
function norm(v=''){return ql7Str(v).toLowerCase().normalize('NFKC').replace(/[’'`]/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim()}
function tokenSet(v=''){return new Set(norm(v).split(/\s+/u).filter(Boolean))}
function similarity(a='',b=''){const A=tokenSet(a),B=tokenSet(b);if(!A.size||!B.size)return 0;let hit=0;for(const x of A)if(B.has(x))hit++;return hit/Math.max(A.size,B.size)}
function hasMaterialAliasBoundary(source='',alias=''){const s=norm(source),a=norm(alias);if(!s||!a)return false;const st=s.split(/\s+/u).filter(Boolean),at=a.split(/\s+/u).filter(Boolean);if(!at.length)return false;if(at.length>1){for(let i=0;i<=st.length-at.length;i++){let ok=true;for(let j=0;j<at.length;j++){if(st[i+j]!==at[j]){ok=false;break}}if(ok)return true}return false}const token=at[0];if(st.includes(token))return true;const n=[...token].length;const cjk=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(token);if(cjk&&n>=2)return st.some(v=>v.includes(token));const arabic=/\p{Script=Arabic}/u.test(token);if(arabic&&n>=2)return st.some(v=>v===`ال${token}`||v===`و${token}`||v===`بال${token}`||v===`وال${token}`||(n>=4&&(v.startsWith(token)||v.endsWith(token))));const hebrew=/\p{Script=Hebrew}/u.test(token);if(hebrew&&n>=2)return st.some(v=>v===`ה${token}`||v===`ו${token}`||v===`ב${token}`||v===`ל${token}`||v===`מה${token}`||(n>=4&&(v.startsWith(token)||v.endsWith(token))));if(n>=4)return st.some(v=>v.startsWith(token)||v.endsWith(token));return false}

export function classifyQl7SupportGeneralTopic(text='', { locale='', publicFigureGraph=QL7_SUPPORT_DEFAULT_PUBLIC_FIGURE_GRAPH }={}) {
 const source=norm(text); if(!source)return null
 const publicFigure=resolveQl7SupportPublicFigureFromGraph(text,{graph:publicFigureGraph})
 if(publicFigure){const selected=publicFigure.selected;const body={nodeId:selected?`person.${selected.personId}`:'public_figure_ambiguous',category:'public_figures',confidence:publicFigure.decision==='selected'?.97:.55,margin:publicFigure.decision==='selected'?20:0,ambiguity:publicFigure.decision==='clarify'?'public_figure_ambiguous':publicFigure.roleQuery?'current_role_source_required':'',evidence:Object.freeze((publicFigure.candidates||[]).map(r=>r.entryHash)),nodeHash:selected?.entryHash||ql7StableHash(JSON.stringify(publicFigure)),publicFigure,currentSensitive:publicFigure.currentSourceRequired===true,sourceRequired:publicFigure.currentSourceRequired===true};return Object.freeze(body)}
 const religion=resolveQl7SupportReligionTopic(text)
 if(religion?.decision==='selected'){const r=religion.tradition;return Object.freeze({nodeId:`religion.${r.id}`,category:'religion',confidence:.96,margin:18,ambiguity:'',evidence:Object.freeze([r.entryHash]),nodeHash:r.entryHash,religion,sourceRequired:false})}
 const candidates=NODES.map(entry=>{let score=0,hits=[];for(const alias of entry.aliases){const a=norm(alias);if(!a)continue;if(hasMaterialAliasBoundary(source,a)){score+=a.length+8;hits.push(alias)}else{const sim=similarity(source,a);if(sim>=.8){score+=sim*8;hits.push(alias)}}}return{entry,score,hits}}).filter(r=>r.score>0).sort((a,b)=>b.score-a.score)
 if(candidates.length){const w=candidates[0],r=candidates[1];return Object.freeze({nodeId:w.entry.nodeId,category:w.entry.category,confidence:r?Math.min(.98,.68+Math.max(0,w.score-r.score)/30):.94,margin:r?w.score-r.score:w.score,ambiguity:w.entry.ambiguity,evidence:Object.freeze(w.hits.map(v=>ql7StableHash(v))),nodeHash:w.entry.nodeHash,currentSensitive:w.entry.currentSensitive,sourceRequired:w.entry.currentSensitive})}
 const humanTopic=classifyQl7SupportHumanTopic(text,{locale,allowOpenSubject:true});if(!humanTopic)return null
 return Object.freeze({nodeId:humanTopic.openSubject?'open_subject':`human.${humanTopic.category}`,category:humanTopic.category,confidence:humanTopic.confidence,margin:humanTopic.margin,ambiguity:humanTopic.openSubject?'source_required_for_specific_fact':'',evidence:Object.freeze(humanTopic.evidenceAliases||[]),nodeHash:humanTopic.receiptHash,openSubject:humanTopic.openSubject,subjectText:humanTopic.subjectText||'',sourceRequired:true})
}

export function getQl7SupportGeneralKnowledgeNode(nodeId=''){return QL7_SUPPORT_GENERAL_KNOWLEDGE_REGISTRY[ql7Str(nodeId)]||null}
export function realizeQl7SupportGeneralKnowledge({nodeId='',locale='en'}={}){const node=getQl7SupportGeneralKnowledgeNode(nodeId);if(!node)return Object.freeze({nodeId,locale,semanticFacts:Object.freeze([]),sourceReceipts:Object.freeze([]),text:'',readyToSend:false,sourceRequired:true});return Object.freeze({nodeId:node.nodeId,category:node.category,locale,semanticFacts:node.semanticFacts,sourceReceipts:Object.freeze(node.semanticFacts.map(f=>f.sourceReceipt).filter(Boolean)),nodeHash:node.nodeHash,text:'',readyToSend:false,finalText:false,sourceRequired:node.currentSensitive})}
export function getQl7SupportGeneralKnowledgeCoverage(){const failures=[];for(const node of NODES){const a=auditQl7SupportGeneralKnowledgeNode(node);if(!a.ok)failures.push(...a.failures.map(x=>`${node.nodeId}:${x}`))}return Object.freeze({version:QL7_SUPPORT_GENERAL_KNOWLEDGE_VERSION,nodeCount:NODES.length,registryHash:QL7_SUPPORT_GENERAL_KNOWLEDGE_REGISTRY_HASH,readyToSendRows:0,finalSentenceRows:0,structuredFactCount:NODES.reduce((s,n)=>s+n.semanticFacts.length,0),openSubjectSupported:true,failures:Object.freeze(failures),ok:failures.length===0})}
