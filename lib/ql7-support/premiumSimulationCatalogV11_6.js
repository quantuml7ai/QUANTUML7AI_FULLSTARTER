
import { QL7_PREMIUM_MICRO_INTENTS_V11_6 } from './microIntentCatalogV11_6.js'
export const QL7_CANONICAL_PREMIUM_SCENARIOS_V11_6=Object.freeze([
 {id:'ai-box-usage-ru',locale:'ru',text:'я имею ввиду на бирже ии бокс как им пользоваться',topic:'exchange_ai',microIntent:'exchange_ai.usage',mustContain:['AI Box'],mustNotContain:['MetaMarket','Quest','VIP']},
 {id:'ai-box-accuracy-ru',locale:'ru',text:'на сколько точна аналитика на бирже?',topic:'exchange_ai',microIntent:'exchange_ai.accuracy',mustContain:['confidence'],mustNotContain:['укажите ID']},
 {id:'qcoin-theft-slang-ru',locale:'ru',text:'украли кькоин с баланса',topic:'qcoin',microIntent:'qcoin.security',statusNot:'confirmed_without_evidence'},
 {id:'ads-elite-zero-slots-ru',locale:'ru',text:'мой рекламный пакет элит активен если кампаний доступно ноль?',topic:'ads_packages',microIntent:'ads_packages.status'},
 {id:'greeting-reset-ru',locale:'ru',text:'Добрый вечер',topic:'support_system',socialAct:'greeting',mustNotContain:['ID','Exchange']},
 {id:'profanity-material-ru',locale:'ru',text:'вы охренели куда делся мой qcoin',topic:'qcoin',microIntent:'qcoin.security'},
])
export function getQl7PremiumSimulationStatsV11_6(){return Object.freeze({microIntents:QL7_PREMIUM_MICRO_INTENTS_V11_6.length,canonical:QL7_CANONICAL_PREMIUM_SCENARIOS_V11_6.length})}
