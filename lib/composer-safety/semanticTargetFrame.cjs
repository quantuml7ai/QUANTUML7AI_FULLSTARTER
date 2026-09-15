'use strict'

const VERSION = 'ql7.composer.semantic-target-frame.v1'

function normalize(value = '') {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/gu, '')
    .toLocaleLowerCase()
    .replace(/\s+/gu, ' ')
    .trim()
}

const SECOND_PERSON = /(?:^|[^\p{L}\p{N}_])(?:ты|тебя|тебе|тобой|твой|твоя|твои|вы|вас|вам|вами|ваш|ваша|ваши|you|your|yours|usted|ustedes|tú|tu|te|ti|sen|seni|sana|siz|sizi|size|أنت|انت|أنتم|انتم|إياك|你|您|你们|אתה|את|אתם|אתן|тебе|тобі|вас|вам)(?=$|[^\p{L}\p{N}_])/iu
const MULTILINGUAL_SECOND_PERSON = /(?:^|[^\p{L}\p{N}_])(?:du|dich|dir|euch|dein\p{L}*|toi|vous|votre\p{L}*|ton|ta|voi|vostro\p{L}*|você|vocês|vós|seu\p{L}*|ty|ciebie|cię|tobie|was|wam|twój\p{L}*|jij|jou|jullie|uw|dig|dere|jer|din\p{L}*|sinä|sinut|sua|sinun|tebe|tě|vás|vám|tvůj\p{L}*|teba|ťa|tvoj\p{L}*|téged|neked|titeket|tine|voi|vouă|ти|теб|тебе|ви|твой\p{L}*|tebi|vas|vam|tvoj\p{L}*|εσύ|σε|σένα|εσείς|σας|შენ|შენზე|თქვენ|sən|səni|sənə|sizi|sizə|сен|сені|саған|сіз|сізді|お前|あなた|君|あんた|너|너를|네가|당신|당신을)(?=$|[^\p{L}\p{N}_])/iu
const THIRD_PERSON = /(?:^|[^\p{L}\p{N}_])(?:его|её|ее|их|него|неё|нее|них|him|her|them|ellos|ellas|él|ella|onu|onları|他|她|他们|她们|אותו|אותה|אותם|אותן)(?=$|[^\p{L}\p{N}_])/iu
const HUMAN_NOUN = /(?:^|[^\p{L}\p{N}_])(?:человек\p{L}*|люд\p{L}*|мужчин\p{L}*|женщин\p{L}*|реб[её]н\p{L}*|дет\p{L}*|сосед\p{L}*|парн\p{L}*|девуш\p{L}*|пользовател\p{L}*|оператор\p{L}*|модератор\p{L}*|person|people|human|man|woman|child|children|neighbor|user|operator|moderator|persona|gente|hombre|mujer|niñ\p{L}*|insan|adam|kadın|çocuk|kullanıcı|شخص|إنسان|انسان|رجل|امرأة|طفل|مستخدم|人|男人|女人|孩子|用户|אדם|איש|אישה|ילד|משתמש)(?=$|[^\p{L}\p{N}_])/iu

const PEST_TARGET = /(?:^|[^\p{L}\p{N}_])(?:таракан\p{L}*|тарган\p{L}*|комар\p{L}*|мошк\p{L}*|мух\p{L}*|клоп\p{L}*|мол[ьи]\p{L}*|мурав\p{L}*|мурах\p{L}*|ос\p{L}*|клещ\p{L}*|блох\p{L}*|хлебарк\p{L}*|дървениц\p{L}*|мравк\p{L}*|кърлеж\p{L}*|бубашваб\p{L}*|stenic\p{L}*|moli?\p{L}*|cockroach(?:es)?|roach(?:es)?|mosquito(?:es)?|housefl(?:y|ies)|bedbugs?|moths?|ants?|wasps?|ticks?|fleas?|cucarach\p{L}*|mosquit\p{L}*|mosc\p{L}*|chinche\p{L}*|polill\p{L}*|hormig\p{L}*|avisp\p{L}*|garrapat\p{L}*|pulg\p{L}*|hamam\s+böce\p{L}*|sivrisinek\p{L}*|sinek\p{L}*|tahtakur\p{L}*|güve\p{L}*|karınca\p{L}*|kene\p{L}*|pire\p{L}*|kakerlak\p{L}*|schabe\p{L}*|mücke\p{L}*|fliege\p{L}*|bettwanze\p{L}*|ameise\p{L}*|wespe\p{L}*|zecke\p{L}*|floh\p{L}*|cafard\p{L}*|blatte\p{L}*|moustique\p{L}*|mouche\p{L}*|punaise\p{L}*|fourmi\p{L}*|guêpe\p{L}*|tique\p{L}*|puce\p{L}*|scarafaggi\p{L}*|blatta\p{L}*|zanzar\p{L}*|cimice\p{L}*|formic\p{L}*|vesp\p{L}*|zecc\p{L}*|barat\p{L}*|percevej\p{L}*|traç\p{L}*|formig\p{L}*|carrapat\p{L}*|karaluch\p{L}*|prusak\p{L}*|komar\p{L}*|much\p{L}*|pluskw\p{L}*|mrówk\p{L}*|kleszcz\p{L}*|pchł\p{L}*|kakkerlak\p{L}*|muggen?|vliegen?|bedwants\p{L}*|mieren?|wespen?|teken?|vlooien?|šváb\p{L}*|štěnic\p{L}*|mravenc\p{L}*|klíšť\p{L}*|blech\p{L}*|ploštic\p{L}*|moľ\p{L}*|mrav\p{L}*|kliešť\p{L}*|blch\p{L}*|gândac\p{L}*|țânțar\p{L}*|musc\p{L}*|ploșniț\p{L}*|molie\p{L}*|furnic\p{L}*|viesp\p{L}*|căpuș\p{L}*|puric\p{L}*|csótány\p{L}*|szúnyog\p{L}*|légy\p{L}*|polosk\p{L}*|hangy\p{L}*|darázs\p{L}*|kullancs\p{L}*|bolh\p{L}*|κατσαρίδ\p{L}*|κουνούπ\p{L}*|μύγ\p{L}*|κοριό\p{L}*|μυρμήγκ\p{L}*|σφήκ\p{L}*|τσιμπούρ\p{L}*|ψύλλ\p{L}*|žohar\p{L}*|komarac\p{L}*|stjenic\p{L}*|mrav\p{L}*|krpelj\p{L}*|buh\p{L}*|ščurek\p{L}*|mravlj\p{L}*|klop\p{L}*|bolh\p{L}*|tarakan\p{L}*|ağcaqanad\p{L}*|milçək\p{L}*|taxtabit\p{L}*|qarışqa\p{L}*|gənə\p{L}*|birə\p{L}*|тарақан\p{L}*|маса\p{L}*|шыбын\p{L}*|қандала\p{L}*|құмырсқа\p{L}*|кене\p{L}*|бүрге\p{L}*|ტარაკან\p{L}*|კოღო\p{L}*|ბუზ\p{L}*|ბაღლინჯ\p{L}*|ჭიანჭველ\p{L}*|ტკიპ\p{L}*|რწყილ\p{L}*|صرصور|بعوض|ذبابة|بق|عثة|نملة|دبور|قراد|برغوث|ג'וק|תיקן|יתוש|זבוב|פשפש|עש|נמלה|צרעה|קרציה|פרעוש)(?=$|[^\p{L}\p{N}_])|(?:蟑螂|蚊子|苍蝇|臭虫|飞蛾|蚂蚁|黄蜂|蜱|跳蚤|ゴキブリ|蚊|ハエ|トコジラミ|蛾|アリ|ハチ|ダニ|ノミ|바퀴벌레|모기|파리|빈대|나방|개미|말벌|진드기|벼룩)/iu

const SAFE_INANIMATE_TARGET = /(?:уб(?:ью|ить|иваем)\s+(?:время|процесс|задач\p{L}*|баг\p{L}*|ошибк\p{L}*|вирус\p{L}*|плесен\p{L}*|сорняк\p{L}*)|kill(?:ing)?\s+(?:time|the\s+process|a\s+process|the\s+task|a\s+task|the\s+bug|a\s+bug|the\s+virus|a\s+virus|weeds?|mold)|terminate\s+(?:the\s+)?(?:process|task)|matar\s+el\s+tiempo|öldürmek\s+zaman|时间消磨|時間を潰|시간을\s*때우)/iu

function test(pattern, source) {
  pattern.lastIndex = 0
  return pattern.test(source)
}

function buildComposerSemanticTargetFrame(text = '', { conversationTargeted = false } = {}) {
  const source = normalize(text)
  const secondPerson = test(SECOND_PERSON, source) || test(MULTILINGUAL_SECOND_PERSON, source)
  const thirdPerson = test(THIRD_PERSON, source)
  const humanNoun = test(HUMAN_NOUN, source)
  const pest = test(PEST_TARGET, source)
  const inanimate = test(SAFE_INANIMATE_TARGET, source)
  const explicitHumanTarget = secondPerson || thirdPerson || humanNoun
  const explicitBenignNonHumanTarget = !explicitHumanTarget && (pest || inanimate)
  const inferredConversationRecipient = Boolean(conversationTargeted && !explicitHumanTarget && !explicitBenignNonHumanTarget)
  const targetKind = explicitHumanTarget
    ? 'person'
    : pest
      ? 'household_pest'
      : inanimate
        ? 'inanimate_or_idiomatic'
        : inferredConversationRecipient
          ? 'conversation_recipient_inferred'
          : 'unspecified'
  const personalThreatTarget = explicitHumanTarget || inferredConversationRecipient
  const evidence = [
    secondPerson ? 'explicit_second_person' : '',
    thirdPerson ? 'explicit_third_person' : '',
    humanNoun ? 'explicit_human_noun' : '',
    pest ? 'explicit_household_pest' : '',
    inanimate ? 'explicit_inanimate_or_idiom' : '',
    inferredConversationRecipient ? 'conversation_recipient_fallback' : '',
  ].filter(Boolean)

  return Object.freeze({
    schema: 'ql7.composer.semantic-target-frame',
    schemaVersion: VERSION,
    targetKind,
    explicitHumanTarget,
    explicitBenignNonHumanTarget,
    personalThreatTarget,
    inferredConversationRecipient,
    secondPerson,
    thirdPerson,
    humanNoun,
    householdPest: pest,
    inanimateOrIdiomatic: inanimate,
    conversationTargeted: conversationTargeted === true,
    evidence: Object.freeze(evidence),
  })
}

module.exports = {
  VERSION,
  buildComposerSemanticTargetFrame,
}
