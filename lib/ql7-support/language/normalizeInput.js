import {ql7NormalizeSpaces, ql7StableHash, ql7Str} from '../internal/text.js'
import {normalizeQl7SupportLocale} from './locales.js'
import {getQl7NormalizationHints, getQl7SemanticBank} from './semanticBanks.js'
import {buildQl7InputHypotheses, buildQl7CanonicalInputVariants, QL7_SUPPORT_MUTATION_LATTICE_VERSION} from './mutationLattice.js'

export const QL7_SUPPORT_NORMALIZE_INPUT_VERSION = '14.14.3'

const RU_EN='qwertyuiop[]asdfghjkl;\'zxcvbnm,.'
const RU_RU='йцукенгшщзхъфывапролджэячсмитьбю'
const UK_EN='qwertyuiop[]asdfghjkl;\'zxcvbnm,.'
const UK_UK='йцукенгшщзхїфівапролджєячсмитьбю'
function mapLayout(text,from,to){const m=new Map([...from].map((c,i)=>[c,to[i]||c]));return [...text].map(c=>m.get(c.toLowerCase())||c).join('')}
function cyrillicRatio(s){const letters=[...s].filter(c=>/\p{L}/u.test(c));return letters.length?letters.filter(c=>/[а-яіїєґ]/iu.test(c)).length/letters.length:0}
function latinRatio(s){const letters=[...s].filter(c=>/\p{L}/u.test(c));return letters.length?letters.filter(c=>/[a-z]/iu.test(c)).length/letters.length:0}
const TRANSLIT=[
 [/sch/giu,'щ'],[/sh/giu,'ш'],[/ch/giu,'ч'],[/zh/giu,'ж'],[/kh/giu,'х'],[/ts/giu,'ц'],[/ya/giu,'я'],[/yu/giu,'ю'],[/yo/giu,'ё'],[/ye/giu,'е'],
 [/a/giu,'а'],[/b/giu,'б'],[/v/giu,'в'],[/g/giu,'г'],[/d/giu,'д'],[/e/giu,'е'],[/z/giu,'з'],[/i/giu,'и'],[/j/giu,'й'],[/k/giu,'к'],[/l/giu,'л'],[/m/giu,'м'],[/n/giu,'н'],[/o/giu,'о'],[/p/giu,'п'],[/r/giu,'р'],[/s/giu,'с'],[/t/giu,'т'],[/u/giu,'у'],[/f/giu,'ф'],[/h/giu,'х'],[/c/giu,'к'],[/y/giu,'ы'],[/x/giu,'кс']]
const SEGMENT_HINT_CACHE=new Map()
const TOKEN_LAYOUT_CACHE=new Map()
const SCORE_CACHE=new Map()
function boundedSet(cache,key,value,limit=4096){if(cache.size>=limit)cache.clear();cache.set(key,value);return value}
const JOIN_HINTS=[
 'покажи','проверь','баланс','статус','пакет','реклама','кампания','форум','кошелек','кошелёк','вип','оплата','помоги','украли','деньги','шутку','как','отправить','жалобу','хочу','поговорить','меня','хейтят','не','могу','войти','пропал','работает','ты','идиот',
 'покажи','перевір','баланс','статус','скаргу','говорити','увійти','зник',
 'show','check','my','balance','status','help','fix','how','to','use','forum','qcoin','missing','ads','broken','you','are','an','idiot','tell','me','a','joke','metrics',
 'muestra','verifica','mi','saldo','estado','quiero','hablar','funciona','eres','idiota','cuenta','un','chiste','métricas',
 'bakiye','bakiyemi','goster','göster','durum','kontrol','et','konusmak','konuşmak','istiyorum','calismiyor','çalışmıyor','sen','aptalsın','şaka','yap','metrikler',
 'اعرض','رصيدي','تحقق','حالتي','اريد','التحدث','اختفى','لا','يعمل',
 '显示','检查','我的','余额','状态','想','聊聊','不见','广告',
 'הצג','בדוק','יתרה','סטטוס','רוצה','לדבר','נעלם','לא','עובד',
]
const MERGED_REPAIRS=Object.freeze({
 покажибаланс:'покажи баланс',проверьстатус:'проверь статус',какотправитьжалобу:'как отправить жалобу',хочупоговорить:'хочу поговорить',меняхейтят:'меня хейтят',немогувойти:'не могу войти',qcoinпропал:'QCoin пропал',adsнеработает:'ads не работает',тыидиот:'ты идиот',
 покажимійбаланс:'покажи мій баланс',перевірстатус:'перевір статус',якподатискаргу:'як подати скаргу',хочупоговорити:'хочу поговорити',менехейтять:'мене хейтять',
 showmybalance:'show my balance',checkmystatus:'check my status',helpmefix:'help me fix',howtouseforum:'how to use forum',qcoinmissing:'QCoin missing',adsbroken:'ads broken',
 muestramisaldo:'muestra mi saldo',verificamiestado:'verifica mi estado',quierohablar:'quiero hablar',qcoindesaparecio:'QCoin desaparecio',adsnofunciona:'ads no funciona',
 bakiyemigoster:'bakiyemi goster',bakiyemigöster:'bakiyemi göster',durumukontrolet:'durumu kontrol et',konusmakistiyorum:'konusmak istiyorum',konuşmakistiyorum:'konuşmak istiyorum',qcoinkayboldu:'QCoin kayboldu',reklamcalismiyor:'reklam calismiyor',
 اعرضرصيدي:'اعرض رصيدي',تحققمنحالتي:'تحقق من حالتي',اريدالتحدث:'اريد التحدث',qcoinاختفى:'QCoin اختفى',الإعلاناتلاتعمل:'الإعلانات لا تعمل',
 הצגיתרה:'הצג יתרה',בדוקסטטוס:'בדוק סטטוס',רוצהלדבר:'רוצה לדבר',qcoinנעלם:'QCoin נעלם',פרסוםלאעובד:'פרסום לא עובד',
})
function segmentationHints(locale){const key=String(locale||'en');if(SEGMENT_HINT_CACHE.has(key))return SEGMENT_HINT_CACHE.get(key);const bank=getQl7SemanticBank(key);const rows=Array.from(new Set([...JOIN_HINTS,...getQl7NormalizationHints(key),...bank.dataRequest,...bank.howTo,...bank.forumSlang,...bank.cryptoSlang].map(v=>String(v||'').toLowerCase()).filter(v=>v&&v.length>=2&&!/\s/u.test(v)))).sort((a,b)=>b.length-a.length);SEGMENT_HINT_CACHE.set(key,rows);return rows}
function segmentJoinedWord(word,locale){const source=String(word||'');const lower=source.toLowerCase();const known=MERGED_REPAIRS[lower];if(known)return known;if(source.length<8)return source;const hints=segmentationHints(locale);let index=0;const parts=[];while(index<lower.length){const hit=hints.find(h=>lower.startsWith(h,index));if(!hit)return source;parts.push(source.slice(index,index+hit.length));index+=hit.length}return parts.length>1?parts.join(' '):source}
function splitJoinedWord(word,locale){const segmented=segmentJoinedWord(word,locale);return segmented!==word?segmented:word}
function collapseLetters(text){return text.replace(/([\p{L}\p{N}])\1{3,}/gu,'$1$1')}
function normalizePunctuation(text){return text.replace(/[“”„«»]/gu,'"').replace(/[’`]/gu,"'").replace(/([!?.,])\1{2,}/gu,'$1$1')}

const CONFUSABLE_TO_LATIN=Object.freeze({
 'А':'A','а':'a','В':'B','Е':'E','е':'e','К':'K','к':'k','М':'M','м':'m','Н':'H','О':'O','о':'o','Р':'P','р':'p','С':'C','с':'c','Т':'T','т':'t','Х':'X','х':'x','У':'Y','у':'y','І':'I','і':'i','Ј':'J','ј':'j','Ѕ':'S','ѕ':'s','Ӏ':'I',
})
function repairMixedScriptConfusables(text='',locale='en'){
 const language=String(locale||'en').split(/[-_]/u)[0].toLowerCase()
 return String(text||'').replace(/[\p{L}\p{N}_-]{2,}/gu,(token)=>{
  const hasLatin=/[A-Za-z]/u.test(token)
  const hasCyrillic=/\p{Script=Cyrillic}/u.test(token)
  if(!hasLatin||!hasCyrillic)return token
  const segments=token.split(/[-_]/u).filter(Boolean)
  if(segments.length>1&&segments.every((part)=>!(/[A-Za-z]/u.test(part)&&/\p{Script=Cyrillic}/u.test(part))))return token
  return [...token].map((char)=>CONFUSABLE_TO_LATIN[char]||char).join('')
 })
}
const ZERO_WIDTH_INPUT_RE=/[​-‏⁠﻿]/gu
const SINGLE_LETTER_WEAVE_RE=/(?<!\p{L})\p{L}(?:[.\-_*·•]+\p{L})+(?!\p{L})/gu
function repairAdversarialSeparators(text=''){
 let value=String(text||'')
 value=value.replace(ZERO_WIDTH_INPUT_RE,'')
 value=value.replace(/(?<=\p{L})\p{Extended_Pictographic}(?=\p{L})/gu,'')
 value=value.replace(SINGLE_LETTER_WEAVE_RE,(token)=>token.replace(/[.\-_*·•]+/gu,''))
 return value
}
const UNIVERSAL_HIGH_SIGNAL_TOKENS=Object.freeze(['qcoin','vip','elite'])
const HIGH_SIGNAL_TOKENS_BY_LOCALE=Object.freeze({
 en:Object.freeze(['show','balance','disappeared','active','advertising','package','campaign','views','clicks','spend','metrics','thanks','joke','awful','idiot','attack','system']),
 ru:Object.freeze(['баланс','украли','деньги','активен','рекламного','пакета','просмотры','клики','расход','кампании','метрики','спасибо','анекдот','плохо','поговорить','идиот','атакую']),
 uk:Object.freeze(['баланс','активний','рекламного','пакета','перегляди','кліки','витрати','рекламної','кампанії','метрики','дякую','жарт','погано','поговорити','ідіот','атакую']),
 es:Object.freeze(['saldo','desapareció','dinero','activo','publicitario','campaña','vistas','clics','gasto','métricas','gracias','chiste','hablar','idiota','atacar','sistema']),
 tr:Object.freeze(['bakiyemi','göster','kayboldu','aktif','reklam','paketimin','durumunu','kampanya','görüntüleme','tıklama','harcamayı','metrikler','teşekkürler','şaka','konuşmak','aptalsın','saldıracağım']),
 ar:Object.freeze(['اعرض','رصيد','اختفى','المال','الإعلانات','المشاهدات','النقرات','الإنفاق','المقاييس','الحديث','النظام','نكتة']),
 zh:Object.freeze(['余额','广告套餐状态','广告活动','浏览','点击','支出','指标','谢谢','笑话','攻击系统']),
 he:Object.freeze(['הצג','יתרת','פעיל','חבילת','הפרסום','צפיות','קליקים','הוצאה','מדדים','תודה','בדיחה','אידיוט','אתקוף','המערכת']),
})
const DELETION_TARGET_CACHE=new Map()
const DELETION_REPAIR_DENYLIST=new Set(['stats','פרסום'])
function deletionTargets(locale='en'){
 const key=String(locale||'en').split(/[-_]/u)[0].toLowerCase()
 if(DELETION_TARGET_CACHE.has(key))return DELETION_TARGET_CACHE.get(key)
 const targets=Object.freeze([...UNIVERSAL_HIGH_SIGNAL_TOKENS,...(HIGH_SIGNAL_TOKENS_BY_LOCALE[key]||HIGH_SIGNAL_TOKENS_BY_LOCALE.en)])
 DELETION_TARGET_CACHE.set(key,targets)
 return targets
}
function isSingleDeletionVariant(value,target){const a=[...String(value||'').toLocaleLowerCase()],b=[...String(target||'').toLocaleLowerCase()];if(b.length!==a.length+1)return false;for(let i=0;i<b.length;i++)if(b.slice(0,i).concat(b.slice(i+1)).join('')===a.join(''))return true;return false}
function repairHighSignalDeletionTypos(text='',locale='en'){
 const targets=deletionTargets(locale)
 return String(text||'').replace(/[\p{L}\p{N}_-]{3,}/gu,(token)=>{
  const lower=token.toLocaleLowerCase()
  if(DELETION_REPAIR_DENYLIST.has(lower))return token
  const target=targets.find((candidate)=>isSingleDeletionVariant(token,candidate))
  if(!target)return token
  return /^[\p{Lu}]/u.test(token)?`${target.charAt(0).toLocaleUpperCase()}${target.slice(1)}`:target
 })
}
function repairCommonTypos(text='',locale='en'){
 return repairHighSignalDeletionTypos(text,locale)
  .replace(/(?:qcoi|qoin|qcin|qcon|qcoim|qconi|qcoinn)(?=$|[^\p{L}\p{N}_])/giu,'QCoin')
  .replace(/(^|[^\p{L}\p{N}_])(?:VPI|VP|VI)(?=$|[^\p{L}\p{N}_])/gu,(match,prefix)=>`${prefix}VIP`)
  .replace(/(^|[^\p{L}\p{N}_])IP(?=\s*(?:激活|状态|active|status|статус|актив|estado|durum|حالة|מצב))/gu,(match,prefix)=>`${prefix}VIP`)
  .replace(/(?:мерики|метики|мтрики|метрии|метрки)/giu,'метрики')
  .replace(/(?:metris|merics|metics|metrcs|mtrics)(?=$|[^\p{L}\p{N}_])/giu,'metrics')
  .replace(/(?:merikler|metriler|metikler|mtrikler|metrkler|metriker)(?=$|[^\p{L}\p{N}_])/giu,'metrikler')
  .replace(/(?:Teşekkrler|Teşekküler|Teşekürler|Teşekkürer)/gu,'Teşekkürler')
  .replace(/(^|[^\p{L}\p{N}_])jke(?=$|[^\p{L}\p{N}_])/giu,(match,prefix)=>`${prefix}joke`)
  .replace(/(?:adverising|avertising)/giu,'advertising')
  .replace(/Şak(?=\s+yap)/gu,'Şaka')
  .replace(/(?:atalsın|aptlsın)/giu,'aptalsın')
  .replace(/(^|[^\p{L}\p{N}_])Sn(?=\s+aptalsın)/gu,(match,prefix)=>`${prefix}Sen`)
  .replace(/(^|[^\p{L}\p{N}_])diot(?=$|[^\p{L}\p{N}_])/giu,(match,prefix)=>`${prefix}idiot`)
  .replace(/(?:^|[^\p{L}\p{N}_])atack(?=$|[^\p{L}\p{N}_])/giu,(match)=>match.replace(/atack/iu,'attack'))
  .replace(/Voya(?=\s+atacar)/gu,'Voy a')
  .replace(/(^|[^\p{L}\p{N}_])(?:діот|ідот)(?=$|[^\p{L}\p{N}_])/giu,(match,prefix)=>`${prefix}ідіот`)
  .replace(/атакуюю/giu,'атакую')
  .replace(/(?:атаку|аакую|атаую)(?=\s+систем)/giu,'атакую')
  .replace(/(^|[^\p{L}\p{N}_])Т(?=\s+ідіот)/gu,(match,prefix)=>`${prefix}Ти`)
  .replace(/(?:İ?steme|Ssteme|Siteme|Sistme|Sistee|Sistem)(?=\s+saldıracağım)/giu,'Sisteme')
  .replace(/(атакую)\s+(?:истему|сстему|ситему|систму|систеу|систем)(?=$|[^\p{L}\p{N}_])/giu,'$1 систему')
  .replace(/(?<!广)(?:广套餐|告套餐)(?!状态)/gu,'广告套餐')
  .replace(/([\p{Ll}\p{Lo}])(QCoin|VIP)/gu,'$1 $2')
  .replace(/(QCoin|VIP)([\p{Ll}\p{Lo}])/gu,'$1 $2')
}
function normalizeKnownTerms(text,locale='en'){return repairCommonTypos(text,locale).replace(/\bq(?:oin|coim|coni|coinn)\b/giu,'QCoin').replace(/\bvpi\b/giu,'VIP').replace(/кюкоин|кьюкоин/giu,'QCoin')}
function scoreCandidate(value,locale='en'){const source=String(value||''),cacheKey=`${locale}:${source}`;if(SCORE_CACHE.has(cacheKey))return SCORE_CACHE.get(cacheKey);const lower=source.toLowerCase();let score=0;for(const hint of segmentationHints(locale))if(lower.includes(hint))score+=2;if(/(?:qcoin|vip|ads|forum|wallet|support|баланс|реклам|кошел|форум|رصيد|余额|יתרה)/iu.test(source))score+=4;if(/(?:метрик|metrics?|métric|metrik|المقاييس|指标|מדדים)/iu.test(source))score+=5;if(/(?:спасибо|дякую|thanks|gracias|teşekkür|شكرا|谢谢|תודה|анекдот|жарт|joke|chiste|şaka|نكتة|笑话|בדיחה)/iu.test(source))score+=5;if(/(?:идиот|ідіот|idiot|idiota|aptal|غبي|白痴|אידיוט|attack|атак|atacar|saldır|هاجم|攻击|אתקוף)/iu.test(source))score+=6;return boundedSet(SCORE_CACHE,cacheKey,score,8192)}
function repairEmbeddedWrongLayout(text,locale){
 const convert=(token,direction)=>{const key=`${locale}:${direction}:${token}`;if(TOKEN_LAYOUT_CACHE.has(key))return TOKEN_LAYOUT_CACHE.get(key);if(token.length>32)return boundedSet(TOKEN_LAYOUT_CACHE,key,token);const candidate=direction==='toLatin'?repairCommonTypos(mapLayout(token,RU_RU,RU_EN),locale):repairCommonTypos(mapLayout(token,locale==='uk'?UK_EN:RU_EN,locale==='uk'?UK_UK:RU_RU),locale);const result=scoreCandidate(candidate,locale)>=scoreCandidate(token,locale)+3?candidate:token;return boundedSet(TOKEN_LAYOUT_CACHE,key,result)}
 let value=String(text||'')
 if(!['ru','uk'].includes(locale))value=value.replace(/[\p{Script=Cyrillic}éÉ]{2,}/gu,(token)=>convert(token,'toLatin'))
 if(locale==='ru'||locale==='uk')value=value.replace(/[a-z][a-z.,;'\[\]]{2,}/giu,(token)=>convert(token,'toCyrillic'))
 return value
}
function inferLayoutCandidate(text,locale){
 const source=String(text||'');const candidates=[source]
 if((locale==='ru'||locale==='uk')&&latinRatio(source)>.55)candidates.push(repairCommonTypos(mapLayout(source,locale==='uk'?UK_EN:RU_EN,locale==='uk'?UK_UK:RU_RU),locale))
 if(['en','de','fr','it','es','pt','tr'].includes(locale)&&cyrillicRatio(source)>.55)candidates.push(repairCommonTypos(mapLayout(source,RU_RU,RU_EN),locale))
 candidates.push(repairEmbeddedWrongLayout(source,locale))
 return candidates.sort((a,b)=>scoreCandidate(b,locale)-scoreCandidate(a,locale))[0]||source
}
function translitCandidate(text,locale){if(!['ru','uk'].includes(locale)||latinRatio(text)<.65||text.length>240)return text;let value=text;for(const [re,to] of TRANSLIT)value=value.replace(re,to);return repairCommonTypos(value,locale)}

function ql7SegmentScripts(text=''){const scripts=[];if(/\p{Script=Latin}/u.test(text))scripts.push('Latin');if(/\p{Script=Cyrillic}/u.test(text))scripts.push('Cyrillic');if(/\p{Script=Arabic}/u.test(text))scripts.push('Arabic');if(/\p{Script=Hebrew}/u.test(text))scripts.push('Hebrew');if(/\p{Script=Han}/u.test(text))scripts.push('Han');if(/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(text))scripts.push('Japanese');if(/\p{Script=Hangul}/u.test(text))scripts.push('Hangul');return Object.freeze(scripts)}
function ql7InputSegments(text='',locale='en'){
 const source=String(text||''),rows=[];const re=/[^.!?。！？\n]+[.!?。！？]?|\n+/gu;for(const match of source.matchAll(re)){const raw=String(match[0]||'');if(!raw.trim())continue;const start=match.index||0,end=start+raw.length,quoteScope=/^\s*(?:>|["“«])|(?:["”»])\s*$/u.test(raw),negated=/\b(?:not|never|no|не|нет|никогда|не буду|не хочу|не собираюсь)\b/iu.test(raw),entityCandidates=Array.from(new Set((raw.match(/\b(?:QCoin|BattleCoin|Exchange AI|Forum|MetaMarket|VIP|Ads|Payments|Wallet|Telegram)\b/giu)||[]).map(x=>x.toLowerCase())));const variants=buildQl7CanonicalInputVariants(raw,{locale,maxVariants:12});rows.push(Object.freeze({start,end,text:raw,scripts:ql7SegmentScripts(raw),localeHypotheses:Object.freeze([locale]),normalizedHypotheses:Object.freeze(variants.hypotheses.map(x=>Object.freeze({text:x.text,score:x.score,transformationIds:x.transformationIds}))),semanticRole:'material_input_segment',negated,quoteScope,entityCandidates:Object.freeze(entityCandidates)}))}return Object.freeze(rows)
}

export function normalizeQl7SupportInput({text='',locale='en'}={}){
 const originalText=ql7Str(text);const lang=normalizeQl7SupportLocale(locale);const transforms=[]
 const protectionProbe=buildQl7CanonicalInputVariants(originalText,{locale:lang,maxVariants:1});const protectedOriginal=protectionProbe.protectedSpans;let protectedInput=originalText;const protectedTokens=[];for(let i=protectedOriginal.length-1;i>=0;i--){const span=protectedOriginal[i],token=`\uE000${i}\uE001`;protectedTokens[i]={token,text:span.text};protectedInput=protectedInput.slice(0,span.start)+token+protectedInput.slice(span.end)}
 let value=protectedInput.normalize('NFKC')
 const repairedSeparators=repairAdversarialSeparators(value);if(repairedSeparators!==value){value=repairedSeparators;transforms.push('adversarial_separators')}
 const confusable=repairMixedScriptConfusables(value,lang);if(confusable!==value){value=confusable;transforms.push('mixed_script_confusables')}
 const layout=inferLayoutCandidate(value,lang);if(layout!==value&&scoreCandidate(layout,lang)>=scoreCandidate(value,lang)+2){value=layout;transforms.push('keyboard_layout')}
 const translit=translitCandidate(value,lang);if(translit!==value&&scoreCandidate(translit,lang)>=scoreCandidate(value,lang)+2){value=translit;transforms.push('transliteration')}
 const known=normalizeKnownTerms(value,lang);if(known!==value){value=known;transforms.push('known_term_typo')}
 const collapsed=collapseLetters(value);if(collapsed!==value){value=collapsed;transforms.push('duplicated_letters')}
 const punctuation=normalizePunctuation(value);if(punctuation!==value){value=punctuation;transforms.push('punctuation')}
 const spaced=value.split(/\s+/u).map((word)=>splitJoinedWord(word,lang)).join(' ');if(spaced!==value){value=spaced;transforms.push('merged_words')}
 value=ql7NormalizeSpaces(value);for(const item of protectedTokens){if(item)value=value.split(item.token).join(item.text)}
 const emoji=[...originalText.matchAll(/\p{Extended_Pictographic}/gu)].map(m=>m[0]).slice(0,16)
 const codeSwitch=/[a-z]/iu.test(value)&&/[а-яіїєґ]/iu.test(value)
 const forwardLattice=buildQl7InputHypotheses(originalText,{locale:lang,maxHypotheses:32});const canonicalLattice=buildQl7CanonicalInputVariants(originalText,{locale:lang,maxVariants:24});const hypotheses=Object.freeze([...canonicalLattice.hypotheses,...forwardLattice.hypotheses].filter((row,index,all)=>all.findIndex(x=>x.text===row.text)===index).slice(0,48));const segments=ql7InputSegments(originalText,lang);return Object.freeze({originalText,normalizedText:value,canonicalText:value.toLowerCase(),locale:lang,transforms:Object.freeze(transforms),confidence:transforms.length?0.82:0.98,emoji:Object.freeze(emoji),codeSwitch,hypothesisSchemaVersion:QL7_SUPPORT_MUTATION_LATTICE_VERSION,hypotheses,protectedSpans:canonicalLattice.protectedSpans,segments,fingerprint:ql7StableHash(`${lang}:${value.toLowerCase()}`)})
}
