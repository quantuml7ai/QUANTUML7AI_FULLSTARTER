import crypto from 'node:crypto'
import { normalizeQl7SupportLocale } from '../adultLanguagePolicy.js'

export const QL7_SUPPORT_SAFE_LEARNING_CALIBRATION_VERSION_V12 = '12.0.0'

export const QL7_SUPPORT_SAFE_LEARNING_POLICY_V12 = Object.freeze({
  minIndependentUsers: 25,
  minUsableDialogues: 250,
  minLanguageCount: 4,
  minTopicCount: 8,
  maxSingleUserShare: 0.04,
  maxClusterShare: 0.18,
  maxPoisoningRiskPerUsableSample: 0.35,
  maxPoisoningRate: 0.01,
  requiredStages: Object.freeze([
    'privacy_review',
    'poisoning_review',
    'offline_simulation',
    'regression_compare',
    'shadow',
    'canary',
  ]),
  metricThresholds: Object.freeze({
    truthfulness: 0.96,
    privacy: 1,
    safety: 0.995,
    repetition: 0.95,
    grammar: 0.9,
    localizationCoverage: 0.995,
    humanToneWinRate: 0.9,
    regressionDelta: 0,
    hallucinationRateMax: 0.002,
    errorRateMax: 0.01,
  }),
})

const LEARNING_COPY = Object.freeze({
  en: {
    answer: 'Yes. Support can become better from real conversation experience, but one message or one person cannot change how it behaves. Personal details are removed, repeated patterns from many independent users are compared carefully, and only stable improvements are allowed through. If a few messages try to push the assistant in a harmful direction, they are treated as noise, not as a new rule.',
    openings: ['Yes. Support can become better from real conversation experience.', 'Yes, it can learn from real conversations, but carefully.', 'Yes. The useful part is that learning is gradual, not impulsive.'],
    privacy: ['Personal details are removed before anything becomes a learning signal.', 'The assistant does not need private details to notice a repeated support pattern.', 'Sensitive details are stripped out, and the useful meaning is kept only in a broad form.'],
    guard: ['One person, one dialogue, or a small group of similar messages cannot change how it behaves.', 'A few messages cannot push the assistant into a new habit.', 'A narrow wave of messages is treated carefully instead of becoming a rule.'],
    close: ['Only stable improvements seen across many independent conversations are allowed through.', 'What survives is repeated, useful experience, not pressure from a single conversation.', 'So the system can improve, while one bad or strange dialogue cannot break it.'],
    cardTitle: 'Safe self-learning',
    cardSummary: 'Learning uses many independent signals, hides personal details, and rejects narrow or suspicious pressure.',
    badge: 'Self-calibration',
  },
  ru: {
    answer: 'Да. Поддержка может становиться умнее на реальном опыте общения, но один человек или один диалог не могут поменять её поведение. Личные детали убираются, похожие ситуации сверяются по множеству независимых обращений, а в работу попадают только устойчивые и полезные улучшения. Если кто-то пытается продавить вредную привычку несколькими сообщениями, это остаётся шумом, а не новым правилом.',
    openings: ['Да. Поддержка может становиться умнее на реальном опыте общения.', 'Да, она может учитывать опыт живых диалогов, но аккуратно.', 'Да. Смысл в том, что обучение идёт постепенно, а не от одного случайного сообщения.'],
    privacy: ['Личные детали убираются до того, как ситуация становится обучающим сигналом.', 'Системе не нужны приватные данные, чтобы заметить повторяющуюся проблему поддержки.', 'Чувствительные детали отсекаются, а полезный смысл остаётся только в обобщённом виде.'],
    guard: ['Один человек, один диалог или маленькая группа похожих сообщений не могут поменять её поведение.', 'Несколько сообщений не могут продавить новую привычку ответа.', 'Узкая волна похожих сообщений проверяется осторожно и не становится правилом сама по себе.'],
    close: ['В работу проходят только устойчивые улучшения, которые видны на широком независимом опыте.', 'Остаётся повторяемый полезный опыт, а не давление одного разговора.', 'Поэтому поддержка может умнеть, но один странный или вредный диалог её не ломает.'],
    cardTitle: 'Безопасное самообучение',
    cardSummary: 'Самокалибровка учитывает много независимых сигналов, скрывает личные детали и отсекает узкое давление.',
    badge: 'Самокалибровка',
  },
  uk: {
    answer: 'Так. Підтримка може ставати розумнішою завдяки реальному досвіду спілкування, але одна людина чи один діалог не можуть змінити її поведінку. Особисті деталі прибираються, схожі ситуації звіряються за багатьма незалежними зверненнями, а в роботу проходять лише стійкі й корисні покращення. Якщо хтось кількома повідомленнями тисне на шкідливу звичку, це лишається шумом, а не новим правилом.',
    openings: ['Так. Підтримка може ставати розумнішою завдяки реальному досвіду спілкування.', 'Так, вона може враховувати досвід живих діалогів, але обережно.', 'Так. Навчання тут поступове, а не від одного випадкового повідомлення.'],
    privacy: ['Особисті деталі прибираються до того, як ситуація стає навчальним сигналом.', 'Системі не потрібні приватні дані, щоб помітити повторювану проблему підтримки.', 'Чутливі деталі відсікаються, а корисний сенс лишається тільки в узагальненому вигляді.'],
    guard: ['Одна людина, один діалог або мала група схожих повідомлень не можуть змінити її поведінку.', 'Кілька повідомлень не можуть продавити нову звичку відповіді.', 'Вузька хвиля схожих повідомлень перевіряється обережно й сама не стає правилом.'],
    close: ['У роботу проходять лише стійкі покращення, помітні на широкому незалежному досвіді.', 'Залишається повторюваний корисний досвід, а не тиск однієї розмови.', 'Тому підтримка може розумнішати, але один дивний або шкідливий діалог її не ламає.'],
    cardTitle: 'Безпечне самонавчання',
    cardSummary: 'Самокалібрування враховує багато незалежних сигналів, приховує особисті деталі й відсікає вузький тиск.',
    badge: 'Самокалібрування',
  },
  es: {
    answer: 'Sí. El soporte puede mejorar con la experiencia real de conversación, pero una persona o un solo diálogo no pueden cambiar su comportamiento. Se eliminan los datos personales, se comparan patrones repetidos entre muchos usuarios independientes y solo pasan mejoras estables y útiles. Si unos pocos mensajes intentan empujar una mala costumbre, se tratan como ruido, no como una regla nueva.',
    openings: ['Sí. El soporte puede mejorar con la experiencia real de conversación.', 'Sí, puede aprender de diálogos reales, pero con cuidado.', 'Sí. La mejora es gradual, no una reacción a un solo mensaje.'],
    privacy: ['Los datos personales se eliminan antes de que algo se convierta en señal de aprendizaje.', 'El sistema no necesita datos privados para detectar un patrón repetido de soporte.', 'Los detalles sensibles se apartan y el significado útil queda solo de forma general.'],
    guard: ['Una persona, un diálogo o un grupo pequeño de mensajes parecidos no pueden cambiar su comportamiento.', 'Unos pocos mensajes no pueden imponer una nueva costumbre de respuesta.', 'Una presión estrecha se revisa con cuidado y no se vuelve regla por sí sola.'],
    close: ['Solo avanzan mejoras estables vistas en mucha experiencia independiente.', 'Lo que queda es experiencia útil repetida, no presión de una sola conversación.', 'Así el soporte puede mejorar sin romperse por un diálogo raro o dañino.'],
    cardTitle: 'Autoaprendizaje seguro',
    cardSummary: 'La autocalibración usa muchas señales independientes, oculta datos personales y rechaza presión estrecha.',
    badge: 'Autocalibración',
  },
  tr: {
    answer: 'Evet. Destek gerçek sohbet deneyiminden daha iyi hale gelebilir; ama tek kişi ya da tek konuşma davranışı değiştiremez. Kişisel ayrıntılar çıkarılır, benzer durumlar birçok bağımsız kullanıcı üzerinden karşılaştırılır ve yalnızca istikrarlı, faydalı iyileştirmeler kullanıma yaklaşır. Birkaç mesaj kötü bir alışkanlığı zorlamaya çalışırsa bu yeni kural değil, gürültü sayılır.',
    openings: ['Evet. Destek gerçek sohbet deneyiminden daha iyi hale gelebilir.', 'Evet, canlı konuşmalardan öğrenebilir; ama bunu dikkatli yapar.', 'Evet. İyileşme tek bir mesaja ani tepki değil, kademeli bir süreçtir.'],
    privacy: ['Kişisel ayrıntılar öğrenme sinyaline dönüşmeden önce çıkarılır.', 'Sistem tekrarlanan bir destek desenini görmek için özel bilgilere ihtiyaç duymaz.', 'Hassas ayrıntılar ayrılır, yararlı anlam yalnızca genel biçimde kalır.'],
    guard: ['Tek kişi, tek konuşma veya küçük bir benzer mesaj grubu davranışı değiştiremez.', 'Birkaç mesaj yeni bir cevap alışkanlığını dayatamaz.', 'Dar bir baskı dikkatle ele alınır ve kendi başına kural olmaz.'],
    close: ['Yalnızca birçok bağımsız deneyimde görülen istikrarlı iyileştirmeler ilerler.', 'Kalan şey tek konuşmanın baskısı değil, tekrar eden yararlı deneyimdir.', 'Bu yüzden destek gelişebilir, ama garip ya da zararlı tek diyalog onu bozamaz.'],
    cardTitle: 'Güvenli öz-öğrenme',
    cardSummary: 'Öz-kalibrasyon çok sayıda bağımsız sinyal kullanır, kişisel ayrıntıları gizler ve dar baskıyı reddeder.',
    badge: 'Öz-kalibrasyon',
  },
  ar: {
    answer: 'نعم. يمكن للدعم أن يتحسن من خبرة المحادثات الحقيقية، لكن شخصاً واحداً أو حواراً واحداً لا يستطيع تغيير سلوكه. تُزال التفاصيل الشخصية، وتُقارن الأنماط المتكررة عبر مستخدمين مستقلين كثيرين، ولا يُسمح إلا بالتحسينات المستقرة والمفيدة. إذا حاولت رسائل قليلة دفع عادة ضارة، تُعامل كضجيج لا كقاعدة جديدة.',
    openings: ['نعم. يمكن للدعم أن يتحسن من خبرة المحادثات الحقيقية.', 'نعم، يمكنه التعلم من الحوارات الحية، لكن بحذر.', 'نعم. التحسن هنا تدريجي وليس استجابة لرسالة واحدة.'],
    privacy: ['تُزال التفاصيل الشخصية قبل أن تصبح الحالة إشارة للتعلم.', 'لا يحتاج النظام إلى بيانات خاصة كي يلاحظ نمط دعم متكرر.', 'تُستبعد التفاصيل الحساسة ويبقى المعنى المفيد بصورة عامة فقط.'],
    guard: ['شخص واحد أو حوار واحد أو مجموعة صغيرة من رسائل متشابهة لا يمكنها تغيير السلوك.', 'رسائل قليلة لا تستطيع فرض عادة جديدة في الإجابة.', 'الضغط الضيق يُعامل بحذر ولا يتحول إلى قاعدة من تلقاء نفسه.'],
    close: ['لا تتقدم إلا التحسينات المستقرة الظاهرة عبر خبرة واسعة ومستقلة.', 'ما يبقى هو خبرة مفيدة متكررة، لا ضغط محادثة واحدة.', 'لذلك يمكن للدعم أن يتحسن من دون أن يكسره حوار غريب أو ضار.'],
    cardTitle: 'تعلم ذاتي آمن',
    cardSummary: 'المعايرة الذاتية تعتمد على إشارات مستقلة كثيرة، وتخفي التفاصيل الشخصية، وترفض الضغط الضيق.',
    badge: 'المعايرة الذاتية',
  },
  zh: {
    answer: '可以。支持系统能从真实对话经验里变得更好，但一个人或一次对话不能改变它的行为。个人信息会被去掉，重复出现的情况会在许多独立用户之间认真对比，只有稳定且有帮助的改进才会继续向前。如果少量消息试图带偏助手，它们会被当作噪声，而不是新规则。',
    openings: ['可以。支持系统能从真实对话经验里变得更好。', '可以，它能从真实交流中学习，但会很谨慎。', '可以。这里的改进是逐步形成的，不是一条消息说了算。'],
    privacy: ['个人细节会先被去掉，才可能成为学习信号。', '系统不需要私人信息，也能发现重复出现的支持问题。', '敏感细节会被过滤，只保留概括后的有用含义。'],
    guard: ['一个人、一次对话或少量相似消息不能改变它的行为。', '几条消息不能强行制造新的回答习惯。', '狭窄的压力会被谨慎处理，不会自己变成规则。'],
    close: ['只有在许多独立经验中稳定出现的有用改进才会继续前进。', '留下的是重复验证的有用经验，不是单次对话的压力。', '所以支持系统可以进步，但不会被一次奇怪或有害的对话带坏。'],
    cardTitle: '安全自学习',
    cardSummary: '自校准依赖许多独立信号，隐藏个人细节，并拒绝狭窄或可疑的压力。',
    badge: '自校准',
  },
  he: {
    answer: 'כן. התמיכה יכולה להשתפר מניסיון אמיתי של שיחות, אבל אדם אחד או דיאלוג אחד לא יכולים לשנות את ההתנהגות שלה. פרטים אישיים מוסרים, דפוסים חוזרים נבדקים מול הרבה משתמשים עצמאיים, ורק שיפורים יציבים ומועילים מתקדמים. אם כמה הודעות מנסות לדחוף הרגל מזיק, הן נחשבות רעש ולא כלל חדש.',
    openings: ['כן. התמיכה יכולה להשתפר מניסיון אמיתי של שיחות.', 'כן, היא יכולה ללמוד משיחות אמיתיות, אבל בזהירות.', 'כן. השיפור כאן הדרגתי, לא תגובה להודעה אחת.'],
    privacy: ['פרטים אישיים מוסרים לפני שמשהו הופך לאות למידה.', 'המערכת לא צריכה מידע פרטי כדי לזהות דפוס תמיכה שחוזר על עצמו.', 'פרטים רגישים מופרדים, והמשמעות המועילה נשארת רק בצורה כללית.'],
    guard: ['אדם אחד, דיאלוג אחד או קבוצה קטנה של הודעות דומות לא יכולים לשנות את ההתנהגות.', 'כמה הודעות לא יכולות לכפות הרגל תשובה חדש.', 'לחץ צר נבדק בזהירות ולא הופך לכלל בפני עצמו.'],
    close: ['רק שיפורים יציבים שמופיעים בהרבה ניסיון עצמאי ממשיכים הלאה.', 'מה שנשאר הוא ניסיון מועיל שחוזר על עצמו, לא לחץ של שיחה אחת.', 'כך התמיכה יכולה להשתפר בלי להישבר מדיאלוג מוזר או מזיק אחד.'],
    cardTitle: 'למידה עצמית בטוחה',
    cardSummary: 'כיול עצמי משתמש בהרבה אותות עצמאיים, מסתיר פרטים אישיים ודוחה לחץ צר או חשוד.',
    badge: 'כיול עצמי',
  },
  kk: {
    answer: 'Иә. Қолдау нақты сөйлесу тәжірибесінен жақсара алады, бірақ бір адам немесе бір диалог оның мінезін өзгерте алмайды. Жеке деректер алынып тасталады, ұқсас жағдайлар көп тәуелсіз өтініштер арқылы салыстырылады, әрі тек тұрақты және пайдалы жақсартулар ғана алға өтеді. Бірнеше хабарлама зиянды әдетті күштеп енгізуге тырысса, ол жаңа ереже емес, шу ретінде қаралады.',
    openings: ['Иә. Қолдау нақты сөйлесу тәжірибесінен жақсара алады.', 'Иә, ол тірі диалог тәжірибесін ескере алады, бірақ өте мұқият.', 'Иә. Мұнда жақсару бір хабарламадан емес, біртіндеп жүреді.'],
    privacy: ['Жеке деректер ештеңе үйрену белгісіне айналмай тұрып алынып тасталады.', 'Қайталанатын қолдау мәселесін байқау үшін жеке деректер қажет емес.', 'Сезімтал мәліметтер бөлініп, пайдалы мағына тек жалпы түрде қалады.'],
    guard: ['Бір адам, бір диалог немесе аз ғана ұқсас хабарлама мінез-құлықты өзгерте алмайды.', 'Бірнеше хабарлама жаңа жауап әдетін күштеп енгізе алмайды.', 'Тар қысым мұқият тексеріледі және өздігінен ережеге айналмайды.'],
    close: ['Тек көп тәуелсіз тәжірибеде тұрақты көрінген пайдалы жақсартулар ғана алға өтеді.', 'Қалатыны - бір сөйлесудің қысымы емес, қайталанған пайдалы тәжірибе.', 'Сондықтан қолдау жақсара алады, бірақ бір оғаш немесе зиянды диалог оны бұза алмайды.'],
    cardTitle: 'Қауіпсіз өзіндік оқу',
    cardSummary: 'Өзіндік калибрлеу көп тәуелсіз белгіні ескереді, жеке деректерді жасырады және тар қысымды өткізбейді.',
    badge: 'Өзіндік калибрлеу',
  },
})

function str(value) { return String(value ?? '').trim() }
function hashInt(value) {
  let hash = 2166136261
  const text = String(value)
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
function pick(rows = [], key = '') {
  const values = Array.isArray(rows) && rows.length ? rows : ['']
  return values[hashInt(key) % values.length]
}
function sha(value) { return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex') }
function safeArray(value) { return Array.isArray(value) ? value : [] }
function ratio(part, total) { return total > 0 ? part / total : 0 }
function keyOf(value, fallback = '') { return str(value) || fallback }
function countBy(rows, selector) {
  const counts = new Map()
  for (const row of rows) {
    const key = keyOf(selector(row), 'unknown')
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}
function maxShare(counts, total) {
  return Math.max(0, ...Array.from(counts.values()).map((count) => ratio(count, total)))
}
function metricValue(metrics = {}, key = '') {
  const value = metrics?.[key]
  if (value && typeof value === 'object') return Number(value.score ?? value.value ?? 0)
  return Number(value ?? 0)
}

export function normalizeQl7SupportLearningSampleV12(sample = {}, index = 0) {
  const user = str(sample.userIdHash || sample.userHash || sample.userId || sample.actorHash || `sample-user-${index}`)
  const topic = str(sample.topic || sample.domain || 'support_system')
  const locale = normalizeQl7SupportLocale(sample.sourceLocale || sample.locale || sample.language || 'en')
  const clusterSeed = str(sample.clusterKey || sample.normalizedFingerprint || sample.provenanceHash || sample.textHash || sha({ topic, locale, expected: sample.expected, actual: sample.actual }))
  const poisoningRisk = Math.max(0, Math.min(1, Number(sample.poisoningRisk ?? sample.risk ?? 0)))
  return Object.freeze({
    userIdHash: sha(user).slice(0, 32),
    topic,
    locale,
    clusterKey: sha(clusterSeed).slice(0, 32),
    poisoningRisk,
    quarantined: poisoningRisk >= QL7_SUPPORT_SAFE_LEARNING_POLICY_V12.maxPoisoningRiskPerUsableSample || sample.quarantined === true,
    consent: sample.consent === true,
  })
}

export function summarizeQl7SupportLearningEvidenceV12(samples = []) {
  const normalized = safeArray(samples).map((sample, index) => normalizeQl7SupportLearningSampleV12(sample, index))
  const usable = normalized.filter((sample) => !sample.quarantined)
  const total = normalized.length
  const usableTotal = usable.length
  const poisonCount = normalized.filter((sample) => sample.quarantined).length
  const userCounts = countBy(usable, (sample) => sample.userIdHash)
  const clusterCounts = countBy(usable, (sample) => sample.clusterKey)
  return Object.freeze({
    totalSamples: total,
    usableSamples: usableTotal,
    quarantinedSamples: poisonCount,
    independentUsers: userCounts.size,
    languageCount: new Set(usable.map((sample) => sample.locale)).size,
    topicCount: new Set(usable.map((sample) => sample.topic)).size,
    maxSingleUserShare: Number(maxShare(userCounts, usableTotal).toFixed(6)),
    maxClusterShare: Number(maxShare(clusterCounts, usableTotal).toFixed(6)),
    poisoningRate: Number(ratio(poisonCount, total || 1).toFixed(6)),
    consentCoverage: Number(ratio(usable.filter((sample) => sample.consent).length, usableTotal || 1).toFixed(6)),
    usable,
  })
}

export function evaluateQl7SupportSafeLearningGateV12({
  samples = [],
  candidateMetrics = {},
  completedStages = [],
  candidate = {},
  policy = QL7_SUPPORT_SAFE_LEARNING_POLICY_V12,
} = {}) {
  const evidence = summarizeQl7SupportLearningEvidenceV12(samples)
  const stages = new Set(safeArray(completedStages).map(str))
  const blockers = []
  if (evidence.usableSamples < policy.minUsableDialogues) blockers.push('insufficient_dialogue_mass')
  if (evidence.independentUsers < policy.minIndependentUsers) blockers.push('insufficient_independent_users')
  if (evidence.languageCount < policy.minLanguageCount) blockers.push('insufficient_language_breadth')
  if (evidence.topicCount < policy.minTopicCount) blockers.push('insufficient_topic_breadth')
  if (evidence.maxSingleUserShare > policy.maxSingleUserShare) blockers.push('single_user_influence_too_high')
  if (evidence.maxClusterShare > policy.maxClusterShare) blockers.push('cluster_influence_too_high')
  if (evidence.poisoningRate > policy.maxPoisoningRate) blockers.push('poisoning_rate_too_high')
  if (Number(candidate.poisoningRisk || 0) >= policy.maxPoisoningRiskPerUsableSample) blockers.push('candidate_poisoning_risk')
  for (const stage of policy.requiredStages) if (!stages.has(stage)) blockers.push(`stage_missing:${stage}`)
  const thresholds = policy.metricThresholds
  for (const key of ['truthfulness', 'privacy', 'safety', 'repetition', 'grammar', 'localizationCoverage', 'humanToneWinRate']) {
    if (metricValue(candidateMetrics, key) < Number(thresholds[key])) blockers.push(`metric_low:${key}`)
  }
  if (metricValue(candidateMetrics, 'regressionDelta') < thresholds.regressionDelta) blockers.push('metric_low:regressionDelta')
  if (metricValue(candidateMetrics, 'hallucinationRate') > thresholds.hallucinationRateMax) blockers.push('metric_high:hallucinationRate')
  if (metricValue(candidateMetrics, 'errorRate') > thresholds.errorRateMax) blockers.push('metric_high:errorRate')
  return Object.freeze({
    version: QL7_SUPPORT_SAFE_LEARNING_CALIBRATION_VERSION_V12,
    allowed: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'eligible_for_canary_promotion',
    blockers: Object.freeze(blockers),
    evidence,
    policy,
    automaticSourceRewrite: false,
    requiresHumanApproval: true,
    oneOrFewDialoguesCanPromote: false,
    rollbackRequiredOnRegression: true,
  })
}

export function getQl7SupportSafeLearningCalibrationStatsV12() {
  return Object.freeze({
    version: QL7_SUPPORT_SAFE_LEARNING_CALIBRATION_VERSION_V12,
    policy: QL7_SUPPORT_SAFE_LEARNING_POLICY_V12,
    protectsAgainstOneDialoguePoisoning: true,
    requiresCrossUserQuorum: true,
    requiresCrossLanguageBreadth: true,
    requiresCrossTopicBreadth: true,
    requiresShadowAndCanary: true,
    supportsOptOutAndRedaction: true,
  })
}

function composeLearningAnswer(copy = {}, lang = 'en', seed = '') {
  const key = `${lang}:${seed || sha(copy.answer || lang)}`
  if (!Array.isArray(copy.openings) || !copy.openings.length) return copy.answer
  return [
    pick(copy.openings, `${key}:opening`),
    pick(copy.privacy, `${key}:privacy`),
    pick(copy.guard, `${key}:guard`),
    pick(copy.close, `${key}:close`),
  ].map(str).filter(Boolean).join(' ')
}

export function buildQl7SupportSafeLearningAnswerV12({ locale = 'en', seed = '' } = {}) {
  const lang = normalizeQl7SupportLocale(locale)
  const copy = LEARNING_COPY[lang] || LEARNING_COPY.en
  const text = composeLearningAnswer(copy, lang, seed)
  return Object.freeze({
    text,
    cardSpec: Object.freeze({
      kind: 'v12_learning_response',
      purpose: 'explanation',
      locale: lang,
      title: copy.cardTitle,
      summary: copy.cardSummary,
      status: 'learning_guarded',
      semanticIcon: 'learning',
      visualTheme: 'knowledge-blue',
      badges: Object.freeze([{ label: copy.badge, tone: 'success', icon: 'learning' }]),
      facts: Object.freeze([
        lang === 'ru' ? 'Личные детали не используются как обучающий материал.' : lang === 'kk' ? 'Жеке деректер оқу материалы ретінде қолданылмайды.' : 'Personal details are not used as learning material.',
        lang === 'ru' ? 'Один человек или несколько похожих сообщений не меняют поведение поддержки.' : lang === 'kk' ? 'Бір адам немесе бірнеше ұқсас хабарлама қолдаудың мінезін өзгертпейді.' : 'One person or a few similar messages do not change support behavior.',
        lang === 'ru' ? 'В работу допускаются только устойчивые улучшения, проверенные на широком опыте.' : lang === 'kk' ? 'Тек кең тәжірибеде расталған тұрақты жақсартулар ғана өтеді.' : 'Only stable improvements checked against broad experience are allowed through.',
      ]),
      checks: Object.freeze([]),
      anomalies: Object.freeze([]),
      nextActions: Object.freeze([]),
      renderHints: Object.freeze({ density: 'compact', rails: 'semantic', spacing: 'premium-tight', noNestedCards: true }),
    }),
  })
}
