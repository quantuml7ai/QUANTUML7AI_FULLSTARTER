import {matchComposerClientLocaleHints} from './localeSemanticHints.client.js'
import {matchComposerClientLocaleRiskConcepts} from './localeRiskConcepts.client.js'
import {matchComposerClientModerationBank} from './clientModerationBank.js'
import semanticTargetFrameModule from './semanticTargetFrame.cjs'

const { buildComposerSemanticTargetFrame } = semanticTargetFrameModule

export const QL7_COMPOSER_PREVIEW_DEBOUNCE_MS = 550
export const QL7_COMPOSER_PREVIEW_VERSION = '2.1.0'
export const QL7_COMPOSER_PREVIEW_AUTHORITY = 'advisory_only_server_gate_authoritative'
const QUOTE_LABEL = /(?:quote|quotation|citation|цитат\p{L}*|cita|citazione|citação|citaat|citat|citace|citácia|alıntı|اقتباس|引用|ציטוט|zitat|cytat|sitat|lainaus|idézet|παράθεση|ციტატა|дәйексөз|인용)\s*[:：-]/iu
const CYBER_DEFENSE_RE=/(?:защит\p{L}*|безопасност\p{L}*|предотврат\p{L}*|расслед\p{L}*|восстанов\p{L}*|protect\p{L}*|defen[cs]\p{L}*|secur\p{L}*|prevent\p{L}*|investigat\p{L}*|recover\p{L}*|schutz\p{L}*|sicher\p{L}*|préven\p{L}*|sécur\p{L}*|protéger|proteger|seguranç\p{L}*|protegg\p{L}*|beveilig\p{L}*|säker\p{L}*|sikker\p{L}*|turvall\p{L}*|zabezpiecz\p{L}*|bezpeč\p{L}*|biztons\p{L}*|securitat\p{L}*|сигурност\p{L}*|bezbed\p{L}*|sigurn\p{L}*|varnost\p{L}*|ασφάλ\p{L}*|უსაფრთხო\p{L}*|təhlükəsiz\p{L}*|қауіпсіз\p{L}*|保护|防御|防止|安全|保護|防御|防止|セキュリティ|보호|방어|예방|보안|حماية|أمن|מניע|הגנה|אבטח)/iu
const PREVENTION_RE=/(?:как\s+(?:защит|предотврат|избеж)|не\s+допустить|предотвращени|защита\s+от|how\s+to\s+(?:prevent|stop|avoid|protect)|prevention|protection\s+from|defen[cs]e\s+against|prévenir|empêcher|evitar|prevenir|verhindern|önlemek|منع|الوقاية|防止|预防|防ぐ|予防|예방|방지)/iu
const HARASSMENT_RE=/(?:никто\s+тебя\s+не\s+любит|исчезни\s+(?:навсегда|отсюда)|трав\p{L}*\s+(?:его|её|ее|их|тебя)|кажд\p{L}*\s+день.{0,40}(?:унижа|оскорб|преслед)|nobody\s+loves\s+you|go\s+away\s+forever|harass\p{L}*\s+(?:him|her|them|you)|bully\p{L}*)/iu
const DEGRADING_RE=/(?:жалк\p{L}*\s+ничтож\p{L}*|туп\p{L}*\s+ничтож\p{L}*|не\s+человек|недосто\p{L}*\s+жить|worthless\s+(?:trash|creature|person)|subhuman|not\s+human|doesn'?t\s+deserve\s+to\s+live)/iu

export function shouldPreviewComposerText(text='') {
  const value=String(text || '').trim()
  if(value.length>=3)return true
  return Array.from(value).length>=2&&/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(value)
}

function norm(text='') {
  return String(text || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase()
}

function hasToken(text, words=[]) {
  const ts = new Set(text.match(/[\p{L}\p{N}_'-]+/gu) || [])
  return words.some((word) => ts.has(word))
}

function any(text, patterns=[]) {
  return patterns.some((re) => re.test(text))
}

function row(classId, confidenceHint, signals=[]) {
  return {authority:'advisory_only',semanticTruth:false,
    classId,
    authoritative: false,
    version: QL7_COMPOSER_PREVIEW_VERSION,
    confidenceHint,
    signals,
  }
}

export function classifyComposerPreview(text='', { locale='und', targeted=false } = {}) {
  const rawValue = norm(text)
  if (!shouldPreviewComposerText(rawValue)) return row('neutral', 1)
  const value = norm(rawValue.replace(/(?:https?:\/\/|www\.)\S+/giu, ' '))

  const quote = /["“”«»]/u.test(value)
  const quoteLabel = QUOTE_LABEL.test(value)
  const unquoted = value.replace(/["“”«»][^"“”«»]{1,320}["“”«»]/gu, ' ')
  const hints = matchComposerClientLocaleHints(unquoted, locale)
  const riskHints = matchComposerClientLocaleRiskConcepts(unquoted, locale)
  const fullRiskHints = matchComposerClientLocaleRiskConcepts(value, locale)
  const moderationHints = matchComposerClientModerationBank(unquoted, locale)
  const fullHints = matchComposerClientLocaleHints(value, locale)

  const news = quoteLabel || fullHints.education || any(value, [
    /новост|истори|учеб|образоват|исслед|цитат/iu,
    /\b(?:news|history|education|educational|research|quote|article)\b/iu,
  ])
  const victim = fullHints.victim || any(value, [
    /мне\s+(?:угрож|пишут)|меня\s+(?:оскорб|преслед|атак)/iu,
    /\b(?:threatened|harassed|attacked)\s+me\b/iu,
  ])
  const counter = fullHints.counter || any(value, [
    /(?:не\s+(?:надо|убивай|нападай)|нельзя|осуждаю|против).{0,80}(?:уб|насил|террор|атак|войн|attack|kill|violence|terror|war)/iu,
    /(?:\bdo not\b|\bdon't\b|\bcondemn\b|\bagainst\b).{0,80}(?:attack|kill|violence|terror|war)/iu,
  ])
  const idiom = any(value, [
    /убивает\s+(?:батаре|производительност)|взорвать\s+рынок/iu,
    /kills?\s+(?:the\s+)?battery|blow\s+up\s+the\s+market/iu,
  ])
  const fiction = any(value, [/фильм|роман|книг|игр[аеы]|сценар/iu, /\b(?:fiction|movie|novel|game|story|screenplay)\b/iu])
  const protectiveAdvice = any(value, [/(?:\b(?:protect|guard|secure)\b.{0,80}\b(?:seed\s+phrase|wallet|account|password|funds?|assets?|data)\b|\b(?:seed\s+phrase|wallet|account|password|funds?|assets?|data)\b.{0,80}\b(?:protect|guard|secure)\b)/iu])
  const positiveExclamation = any(value, [/\bdamn\s+(?:this|that|it)\s+is\s+(?:cool|awesome|amazing|great|beautiful)\b/iu])

  const first = hints.firstPerson || hasToken(unquoted, ['я','мы','i','we'])
  const second = hasToken(unquoted, ['ты','тебя','тебе','твой','вы','вас','вам','ваш','you','your'])
  const third = hasToken(unquoted, ['его','её','ее','их','him','her','them'])
  const targetFrame = buildComposerSemanticTargetFrame(unquoted, { conversationTargeted: targeted })
  const conversationalTarget = Boolean(targeted || second || third)
  const harmTarget = targetFrame.personalThreatTarget === true
  const implicitFirstHarm = any(unquoted, [/(?:уб(?:ью|ьём|ьем|иваем)|зареж(?:у|ем)|застрел(?:ю|им)|ликвидиру(?:ю|ем))/iu, /we(?:'ll|\s+will)\s+(?:kill|shoot|stab)/iu])
  const kill = riskHints.kill || any(unquoted, [/(?:уб(?:ью|ьём|ьем|ить|иваем)|зареж|застрел|ликвидир)/iu, /\b(?:kill(?:ing)?|murder(?:ing)?|shoot|stab)\b/iu, /\bsana\s+zarar\s+vereceğim\b/iu])
  const terror = fullHints.terror || any(value, [/террор|теракт|terror|isis|isil|игил/iu])
  const explosive = fullHints.explosive || any(value, [/бомб|взрыв|bomb|explosive|детонат|detonat/iu])
  const operational = hints.operational || any(unquoted, [/как\s+(?:сделать|собрать|устроить)|инструкц|пошаг/iu, /\bhow\s+to\b|\bstep[- ]by[- ]step\b|\b(?:build|make)\b/iu])
  const commitment = riskHints.commitment || any(unquoted, [/(?:делаем|сделаем|устроим|заложим|взорв(?:ём|ем)|начн(?:ём|ем)|развяжем|провед(?:ём|ем))/iu, /let'?s\s+(?:make|plant|start|launch|attack)|we(?:'ll|\s+will)\s+(?:make|plant|start|launch|attack)/iu, /\bzarar\s+vereceğim\b/iu])
  const attack = riskHints.attack || any(unquoted, [/(?:атак(?:а|у|уем|овать)|напад(?:ение|ём|ем|ать))/iu, /\battack(?:ing)?\b/iu])
  const incite = riskHints.incite || any(unquoted, [/(?:давайте|давай|призываю|идите|бейте|нападайте|начн(?:ём|ем))/iu, /\bincite\b|go\s+attack|let'?s\s+(?:attack|start|launch)/iu])
  const war = riskHints.war || riskHints.riot || any(unquoted, [/(?:войн(?:а|у|ой|ы|е)?|мятеж|бунт)/iu, /\b(?:war|riot)\b/iu])
  const warIncitement = war && (incite || commitment || any(unquoted, [/развязать|объявить|начать\s+войн/iu, /start\s+(?:a\s+)?war|declare\s+war/iu]))
  const cyberAttack = riskHints.cyber || any(unquoted, [/(?:хакерск(?:ая|ую|ой)?\s+атак|кибератак|взлом(?:аем|ать)?|d+d+[o0о]+s|д+д+[o0о]+с|снесу.{0,20}серв)/iu, /cyber[- ]?attack|hacker\s+attack|hack\s+(?:the\s+)?(?:site|server|system)/iu])
  const assetAbuse = any(unquoted, [/(?:украд|накрут|обойти|взлом).{0,40}(?:qcoin|q[ -]?coin|кьюкоин|кью коин)/iu, /(?:steal|inflate|bypass|exploit).{0,40}(?:qcoin|q[ -]?coin)/iu])
  const property = riskHints.destroy || cyberAttack || any(unquoted, [/поджечь|сжечь|разнести|взорвать/iu, /burn\s+down|destroy\s+(?:the\s+)?(?:house|car|store|property)/iu])
  const naturalDestroyAction = Boolean(riskHints.hits?.destroy?.some?.((row) => row?.vocabulary === 'natural_intent'))
  const naturalCyberAction = Boolean(riskHints.hits?.cyber?.some?.((row) => row?.vocabulary === 'natural_intent'))
  const cyberDefense = cyberAttack && CYBER_DEFENSE_RE.test(value) && !naturalCyberAction && !commitment && !incite
  const prevention = PREVENTION_RE.test(value) && !commitment && !incite
  const quotedHarmContinuation = Boolean(quote && (riskHints.commitment || hints.temporal) && (
    fullRiskHints.kill || fullRiskHints.attack || fullRiskHints.destroy || fullRiskHints.cyber || fullRiskHints.war || fullRiskHints.riot || explosive || terror
  ))
  const mass = any(unquoted, [/всех|толп|массов/iu, /everyone|crowd|mass\s+(?:harm|murder|kill)/iu])
  const sexualViolence = any(unquoted, [/(?:изнасил|сексуальн.{0,20}(?:насил|принужд)|без\s+соглас|зґвалт|violaci[oó]n|agresi[oó]n\s+sexual|rape|sexual\s+assault|sexual\s+coercion|tecavüz|cinsel\s+sald|اغتصاب|اعتداء\s+جنسي|强奸|性侵|אונס|תקיפה\s+מינית)/iu])
  const sexualOperational = sexualViolence && (operational || commitment || incite || any(unquoted,[/(?:как\s+(?:совершить|сделать)|how\s+to|cómo\s+(?:hacer|cometer)|nasıl\s+(?:yap|tecavüz)|كيف\s+(?:أفعل|أرتكب)|如何.{0,12}(?:实施|进行)|איך\s+(?:לבצע|לעשות)).{0,40}(?:изнасил|rape|sexual|tecavüz|اغتصاب|强奸|אונס)/iu,/(?:(?:^|\s)(?:я|мы|i|we)(?:\s|$).{0,36}(?:хочу|хотим|собираюсь|планирую|буду|want|plan|going\s+to|will).{0,48}(?:изнасил|зґвалт|rape|sexual\s+assault|tecavüz|اغتصاب|强奸|אונס))/iu]))
  const refusal = any(unquoted, [/(?:^|[\s,.;:!?])не\s+(?:собираюсь|буду|стану).{0,64}(?:уб|атак|напад|взорв|подж)/iu, /\b(?:will\s+not|won't|am\s+not\s+going\s+to)\b.{0,64}(?:kill|attack|bomb|burn)/iu])
  const harassment = HARASSMENT_RE.test(value)
  const degrading = DEGRADING_RE.test(value)

  // Safe context may suppress a lexical risk hit, but never wash out an
  // actionable harmful request. The server remains authoritative on submit.
  const materialActionability = Boolean(
    operational || commitment || warIncitement || naturalDestroyAction || quotedHarmContinuation ||
    (kill && harmTarget && (first || implicitFirstHarm)) ||
    (property && !cyberDefense && (first || commitment || incite || cyberAttack || naturalDestroyAction)) ||
    (incite && (kill || attack))
  )
  if (victim) return row('victim_report', .97, ['victim_context'])
  if (counter) return row('counter_speech', .97, ['counter_speech'])
  if (refusal && !/(?:\bbut\b|\bhowever\b|\bно\b).{0,48}(?:\bwill\b|\bgoing\s+to\b|уб(?:ью|ьём|ьем)|атакую|нападу)/iu.test(unquoted)) return row('clean_respectful', .96, ['explicit_refusal'])
  if (news && !materialActionability) return row('news_historical_educational_context', .90, ['context'])
  if ((idiom || fiction) && !materialActionability) return row('clean_respectful', .90, [idiom ? 'safe_idiom' : 'fiction_context'])
  if ((protectiveAdvice || positiveExclamation) && !materialActionability && !kill && !terror && !attack && !property) return row('clean_respectful', .92, [protectiveAdvice ? 'protective_advice_context' : 'positive_exclamation_context'])
  if ((cyberDefense || prevention) && !materialActionability) return row('clean_respectful', .94, [cyberDefense ? 'cyber_defense_context' : 'prevention_context'])

  if (quotedHarmContinuation) return row('dangerous_operational_intent', .98, ['quoted_harm','unquoted_continuation'])
  if (terror && (operational || commitment || incite)) return row('terrorism_operational_intent', .97, ['terror', explosive ? 'explosive' : 'terror_action', operational ? 'operational' : incite ? 'incitement' : 'commitment'])
  if (explosive && !terror && (operational || commitment || incite)) return row('dangerous_operational_intent', .96, ['explosive', operational ? 'operational' : incite ? 'incitement' : 'commitment'])
  if (kill && harmTarget && (first || implicitFirstHarm || commitment)) return row('credible_personal_threat', .96, [first || implicitFirstHarm ? 'first_person' : 'operational_commitment',targetFrame.targetKind,'harm'])
  if (kill && mass) return row('murder_or_mass_harm_intent', .96, ['harm','mass_target'])
  if (warIncitement) return row('war_or_riot_incitement', .95, ['war_or_riot','incitement'])
  if (property && !cyberDefense && (first || commitment || incite || cyberAttack || naturalDestroyAction)) return row('property_destruction_incitement', .94, [cyberAttack ? 'cyber_attack' : 'property_harm',incite ? 'incitement' : naturalDestroyAction ? 'natural_action_form' : 'commitment'])
  if (incite && (kill || attack)) return row('violence_incitement', .94, ['incitement', kill ? 'harm' : 'attack'])
  if (sexualOperational) return row('sexual_violence_operational_intent', .96, ['sexual_violence','operational_intent'])
  if (sexualViolence) return row('sexual_violence_context', .90, ['sexual_violence','context_required'])
  if (quote && !materialActionability && !kill && !terror && !attack && !property && !cyberAttack && !sexualViolence) return row('quoted_or_reported_harm', .90, ['quote_scope_only'])
  if (
    kill && targetFrame.explicitBenignNonHumanTarget &&
    !targetFrame.explicitHumanTarget && !terror && !explosive && !mass &&
    !property && !cyberAttack && !sexualViolence
  ) {
    return row('neutral', .93, ['explicit_benign_non_human_target', targetFrame.targetKind])
  }

  const product = any(value, [/сервис|продукт|приложен|сайт|квантум/iu, /\b(?:service|product|app|site|quantum)\b/iu])
  const frustration = any(value, [/достал|ненавижу|говно|отстой/iu, /\b(?:sucks|hate|trash|broken)\b/iu])
  const insult = moderationHints.directInsults || any(value, [/идиот|дебил|тупиц|хуйло|пидор(?:ас)?|ебуч|шлюх|твар|мраз|мерзк.{0,10}твар|кончен.{0,10}шлюх/iu, /\b(?:idiot|moron|stupid|retard|whore|scum)\b/iu])
  const profanity = moderationHints.profanity || moderationHints.euphemisms || any(value, [/бляд|сука|нахуй|хуйло|пидор(?:ас)?|ебан|ебуч|мудак/iu, /\b(?:fuck|shit)\b/iu])

  if (assetAbuse) return row('uncertain_hostility', .91, ['asset_abuse','security_review'])
  if (cyberAttack && !cyberDefense) return row('uncertain_hostility', .90, ['cyber_risk','security_review'])
  if (harassment) return row('harassment', .93, ['harassment_pattern', conversationalTarget ? 'target' : 'target_implied'])
  if (degrading) return row('degrading_hate_like_language', .92, ['degrading_pattern', conversationalTarget ? 'target' : 'target_implied'])
  if (insult) return row(conversationalTarget ? 'direct_insult' : 'uncertain_hostility', conversationalTarget ? .91 : .86, ['insult', ...(conversationalTarget ? ['target'] : ['target_unknown'])])
  if (product && frustration) return row('product_frustration', .90, ['product','frustration'])
  if (profanity) return row(conversationalTarget ? 'uncertain_hostility' : 'profanity_non_targeted', conversationalTarget ? .86 : .90, ['profanity', ...(conversationalTarget ? ['target'] : [])])
  if (terror) return row('uncertain_hostility', .84, ['terror_topic_without_safe_context'])
  if (war) return row('uncertain_hostility', .80, ['war_topic_without_safe_context'])
  if ((riskHints.kill || riskHints.attack || riskHints.destroy || riskHints.cyber || riskHints.war || riskHints.riot) && !cyberDefense && !prevention) return row('risk_ambiguous', .79, ['localized_risk_neighborhood','context_or_target_unresolved'])

  const benignKnown = any(value,[/(?:добрый\s+(?:день|вечер)|привет).{0,40}(?:подскаж|как\s+работ|что\s+такое|форум|support|поддерж)/iu,/(?:hello|hi|good\s+(?:morning|afternoon)).{0,40}(?:how\s+does|what\s+is|support|forum)/iu])
  if(benignKnown) return row('clean_respectful', .88, ['known_benign_support_context'])
  const riskLikeUnknown = any(value,[/(?:грохн|приконч|снесу|взорв|бомб|убий|атак|хак)/iu,/\b(?:kill|bomb|attack|hack)\b/iu])
  if(riskLikeUnknown) return row('uncertain_hostility', .72, ['risk_neighborhood','coverage_uncertain'])
  return row('neutral', .82, ['no_material_risk_signal'])
}

export function composerPreviewBadgeFromClass(classId='neutral') {
  if (['clean_respectful','neutral','quoted_or_reported_harm','news_historical_educational_context','victim_report','counter_speech'].includes(classId)) return classId === 'neutral' ? null : { tone:'green', key:'composer_tone_respectful' }
  if (['profanity_non_targeted','product_frustration','uncertain_hostility','direct_insult','repeated_direct_insult','harassment','bullying','degrading_hate_like_language','risk_ambiguous','sexual_violence_context','unknown_or_uncovered'].includes(classId)) return { tone:'orange', key:'composer_tone_warning' }
  if (['credible_personal_threat','violence_incitement','terrorism_praise_or_instruction','terrorism_operational_intent','murder_or_mass_harm_intent','war_or_riot_incitement','property_destruction_incitement','dangerous_operational_intent','sexual_violence_operational_intent'].includes(classId)) return { tone:'red', key:'composer_tone_blocked' }
  return null
}

export function composerPreviewToneRank(value) {
  const tone = typeof value === 'string' ? value : value?.tone
  return tone === 'red' ? 3 : tone === 'orange' ? 2 : tone === 'green' ? 1 : 0
}

export function sameComposerPreviewPresentation(left, right) {
  if (left === right) return true
  if (!left || !right) return false
  return String(left.tone || '') === String(right.tone || '')
    && String(left.classId || '') === String(right.classId || '')
    && String(left.key || '') === String(right.key || '')
}

export function resolveComposerPreviewUpdate(previous, candidate, { authoritative = false } = {}) {
  if (sameComposerPreviewPresentation(previous, candidate)) return previous
  if (authoritative || !previous) return candidate
  if (!candidate?.tone || composerPreviewToneRank(candidate) < composerPreviewToneRank(previous)) return previous
  return candidate
}
