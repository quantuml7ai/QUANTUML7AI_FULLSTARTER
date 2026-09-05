function str(value) { return String(value ?? '').trim() }
function norm(value = '') { return str(value).normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim() }

const SIGNALS = Object.freeze([
  ['safety', /(?:убью|взорву|теракт|kill\s+you|bomb|terror|سأقتلك|قنبلة|杀了你|炸弹|אהרוג|פצצה)/iu, 1],
  ['angry', /(?:бесит|злюсь|ярост|возмущ|розлюч\p{L}*|достал|охуел|заеб|wtf|furious|angry|outraged|pissed|cabreado|furioso|sinirli|öfkeli|غاضب|منزعج|生气|愤怒|כועס|זועם)/iu, 0.94],
  ['frustrated', /(?:не\s+работает|опять|сколько\s+можно|устал|разочарован|задолбал|frustrat|annoyed|still\s+broken|again|no\s+funciona|otra\s+vez|çalışmıyor|yine|لا\s+يعمل|مرة\s+أخرى|又坏了|还是不行|שוב|לא\s+עובד)/iu, 0.86],
  ['anxious', /(?:боюсь|переживаю|тревож|опасаюсь|срочно|тривож\p{L}*|термінов\p{L}*|worried|anxious|afraid|urgent|preocupado|ansioso|endişeli|acil|قلق|خائف|عاجل|担心|焦虑|紧急|מודאג|חרד|דחוף)/iu, 0.84],
  ['disappointed', /(?:обидно|разочарован|печально|жаль|disappointed|sad|let\s+down|decepcionado|üzgün|hayal\s+kırıklığı|محبط|حزين|失望|难过|מאוכזב|עצוב)/iu, 0.82],
  ['joyful', /(?:ура|класс|супер|кайф|отлично|рад|счастлив|awesome|amazing|great|happy|love\s+it|genial|increíble|feliz|harika|mutlu|رائع|سعيد|太棒了|开心|מעולה|שמח)/iu, 0.86],
  ['admiring', /(?:восхищ|гениаль|шедевр|легенда|respect|brilliant|impressive|genius|admiro|impresionante|mükemmel|hayran|مذهل|عبقري|佩服|厉害|מרשים|גאוני)/iu, 0.84],
  ['humorous', /(?:шутк|шути|пошут\p{L}*|пожарт\p{L}*|прикол|ахах|хаха|лол|ирони|joke|funny|haha|lol|broma|chiste|şaka|مزحة|نكتة|امزح|哈哈|笑话|玩笑|בדיחה|חחח)/iu, 0.82],
  ['analytical', /(?:метрик|статистик|аналитик|сравни|разбивк|доказатель|лог|metrics?|statistics|analytics?|compare|breakdown|evidence|logs?|estadística|analítica|análisis|métricas|pruebas|karşılaştır|metrik|إحصائيات|تحليل|مقارنة|指标|统计|分析|比较|מדדים|ניתוח|השוואה)/iu, 0.8],
  ['serious', /(?:серь[её]зно|без\s+шуток|официально|критично|важно|serious|no\s+jokes|official|critical|importante|serio|ciddi|önemli|بجدية|رسمي|مهم|认真|正式|重要|ברצינות|רשמי|חשוב)/iu, 0.76],
])

const THEME = Object.freeze({
  safety: 'safety-red', angry: 'emotion-volcanic', frustrated: 'emotion-amber', anxious: 'emotion-caution',
  disappointed: 'emotion-slate', joyful: 'emotion-joy', admiring: 'emotion-aurora', humorous: 'emotion-playful',
  analytical: 'emotion-analytical', serious: 'emotion-serious', neutral: 'knowledge-blue',
})
const GLYPH = Object.freeze({ safety: '⚠', angry: '!', frustrated: '↻', anxious: '△', disappointed: '◌', joyful: '✦', admiring: '✧', humorous: '☺', analytical: '⌁', serious: '◆', neutral: '◈' })
const PULSE = Object.freeze({ safety: 'alert', angry: 'sharp', frustrated: 'steady', anxious: 'caution', disappointed: 'soft', joyful: 'spark', admiring: 'aurora', humorous: 'bounce', analytical: 'scan', serious: 'focus', neutral: 'none' })

export function assessQl7SupportEmotion({ text = '', translatedText = '', tone = {}, messageAct = '' } = {}) {
  const source = norm([text, translatedText].filter(Boolean).join('\n'))
  let emotion = 'neutral'
  let confidence = 0.5
  if (tone?.safetyEscalation === true || tone?.threat === true) { emotion = 'safety'; confidence = 1 }
  else if (tone?.taxonomyCategory === 'frustration_at_system' || tone?.category === 'frustration_with_request') { emotion = 'frustrated'; confidence = 0.96 }
  else if (tone?.taxonomyCategory === 'insult_to_support') { emotion = 'angry'; confidence = 0.96 }
  else {
    for (const [candidate, pattern, score] of SIGNALS) {
      if (pattern.test(source)) { emotion = candidate; confidence = score; break }
    }
    if (emotion === 'neutral' && messageAct === 'humor_play') { emotion = 'humorous'; confidence = 0.9 }
    if (emotion === 'neutral' && ['complaint', 'appeal'].includes(messageAct)) { emotion = 'serious'; confidence = 0.72 }
    if (emotion === 'neutral' && ['personal_status_request', 'status_followup'].includes(messageAct)) { emotion = 'analytical'; confidence = 0.68 }
    if (emotion === 'neutral' && messageAct === 'gratitude') { emotion = 'joyful'; confidence = 0.82 }
  }
  return Object.freeze({
    emotion,
    intensity: confidence >= 0.92 ? 'high' : (confidence >= 0.76 ? 'medium' : 'low'),
    confidence,
    visualTheme: THEME[emotion] || THEME.neutral,
    pulse: PULSE[emotion] || 'none',
    glyph: GLYPH[emotion] || GLYPH.neutral,
  })
}

export function applyQl7SupportEmotionalPresentation({ cardSpec = {}, text = '', translatedText = '', tone = {}, messageAct = '' } = {}) {
  const source = cardSpec && typeof cardSpec === 'object' ? cardSpec : {}
  const emotion = assessQl7SupportEmotion({ text, translatedText, tone, messageAct })
  const protectedTheme = /^(?:safety-red|violation-crimson|payment-violet-gold|success-emerald|result-emerald)$/u.test(str(source.visualTheme))
  const protectedPurpose = /^(?:safety|violation|restriction|payment_incident|success)$/u.test(str(source.purpose || source.kind))
  return Object.freeze({
    ...source,
    visualTheme: protectedTheme || protectedPurpose ? source.visualTheme : emotion.visualTheme,
    emotion: Object.freeze({ emotion: emotion.emotion, intensity: emotion.intensity, confidence: emotion.confidence, pulse: emotion.pulse, glyph: emotion.glyph }),
  })
}

export function listQl7SupportEmotionFamilies() {
  return Object.freeze(['neutral', 'serious', 'analytical', 'frustrated', 'angry', 'anxious', 'disappointed', 'joyful', 'admiring', 'humorous', 'safety'])
}
