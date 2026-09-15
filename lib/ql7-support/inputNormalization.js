
function str(value) { return String(value ?? '').trim() }

const RU_LATIN = Object.freeze({
  shch:'щ', yo:'ё', zh:'ж', kh:'х', ts:'ц', ch:'ч', sh:'ш', yu:'ю', ya:'я', ye:'е',
  a:'а', b:'б', v:'в', g:'г', d:'д', e:'е', z:'з', i:'и', y:'й', k:'к', l:'л', m:'м', n:'н', o:'о', p:'п', r:'р', s:'с', t:'т', u:'у', f:'ф', h:'х', c:'к', j:'дж', q:'к', w:'в', x:'кс',
})
const TYPO_ROWS = Object.freeze([
  [/(?:^|[^\p{L}\p{N}_])кь?коин(?=$|[^\p{L}\p{N}_])/giu, ' qcoin'], [/(?:^|[^\p{L}\p{N}_])кью\s*коин(?=$|[^\p{L}\p{N}_])/giu, ' qcoin'], [/(?:^|[^\p{L}\p{N}_])q\s*[- ]?coin(?=$|[^\p{L}\p{N}_])/giu, ' qcoin'],
  [/(?:^|[^\p{L}\p{N}_])аи\s*[- ]?бокс(?=$|[^\p{L}\p{N}_])/giu, ' ai box'], [/(?:^|[^\p{L}\p{N}_])ай\s*[- ]?бокс(?=$|[^\p{L}\p{N}_])/giu, ' ai box'], [/(?:^|[^\p{L}\p{N}_])ии\s*[- ]?бокс(?=$|[^\p{L}\p{N}_])/giu, ' ai box'],
  [/\bэ?ксч?е?нж\b/giu, 'exchange'], [/\bбирж[аи]\s+ии\b/giu, 'exchange ai'],
  [/\bрекл(?:амн)?\s*пак(?:ет)?\b/giu, 'рекламный пакет'], [/\bбалик\b/giu, 'баланс'],
  [/\bметрикс\b/giu, 'метрики'], [/\bстата\b/giu, 'статистика'], [/\bкампа(?:ния|шка)\b/giu, 'кампания'],
])
const KEYBOARD_RU_TO_EN = Object.freeze({
  й:'q',ц:'w',у:'e',к:'r',е:'t',н:'y',г:'u',ш:'i',щ:'o',з:'p',х:'[',ъ:']',ф:'a',ы:'s',в:'d',а:'f',п:'g',р:'h',о:'j',л:'k',д:'l',ж:';',э:"'",я:'z',ч:'x',с:'c',м:'v',и:'b',т:'n',ь:'m',б:',',ю:'.',
})

function collapseLetters(value='') {
  return value.replace(/([\p{L}])\1{2,}/giu, (m, ch) => ch + ch)
}
function stripControls(value='') {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069]/gu, '')
}
function transliterateLikelyRussian(value='') {
  return value.replace(/\b[a-z]{4,}\b/giu, (word) => {
    if (!/(privet|zdrav|dobr|balans|paket|reklam|birzh|analitik|koin|koshel|platezh|spasibo|poka|ukral|propal|pomogi|prover)/iu.test(word)) return word
    let out = word.toLowerCase()
    for (const key of Object.keys(RU_LATIN).sort((a,b)=>b.length-a.length)) out = out.replaceAll(key, RU_LATIN[key])
    return out
  })
}
function keyboardAlternate(value='') {
  const chars=[...value.toLowerCase()]
  const convertible=chars.filter(ch=>KEYBOARD_RU_TO_EN[ch]).length
  if (convertible < 4 || convertible / Math.max(1, chars.length) < 0.45) return ''
  return chars.map(ch=>KEYBOARD_RU_TO_EN[ch] || ch).join('')
}

export function normalizeQl7HumanInput(value='', { includeAlternate=true }={}) {
  const original=str(value).slice(0, 600)
  let normalized=stripControls(original).normalize('NFKC').toLowerCase().replace(/[’`´]/gu, "'")
  normalized=collapseLetters(normalized).replace(/[_|]+/gu,' ').replace(/\s+/gu,' ').trim()
  for (const [pattern,replacement] of TYPO_ROWS) normalized=normalized.replace(pattern,replacement)
  normalized=normalized.replace(/\s+/gu,' ').trim()
  const transliterated=transliterateLikelyRussian(normalized)
  const alternate=includeAlternate ? keyboardAlternate(normalized) : ''
  return Object.freeze({ original, normalized, transliterated, alternate, variants:Object.freeze(Array.from(new Set([normalized,transliterated,alternate].filter(Boolean)))) })
}

export function listQl7HumanNoiseTransforms() {
  return Object.freeze(['unicode_nfkc','control_strip','whitespace','repeat_letters','apostrophe','qcoin_typos','ai_box_typos','exchange_typos','ads_abbreviations','balance_slang','ru_transliteration','keyboard_alternate','case_fold','emoji_tolerant','punctuation_tolerant','linebreak_tolerant','code_switch','voice_transcript','filler_words','profanity_prefix','gratitude_suffix','greeting_prefix','long_narrative','negative_topic','topic_return','deictic_followup','missing_spaces','extra_spaces','homoglyphs','mixed_script','short_fragment','dialect_alias','abbreviation','safe_length'])
}
