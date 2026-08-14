import { classifyQl7SupportCatalogTopic, normalizeQl7SupportTopic } from '../ecosystemCatalog.js'
import { ql7Str } from '../internal/text.js'

export const QL7_SUPPORT_ROUTE_CALIBRATION_VERSION_V13 = '13.0.2'
const V13_TOPICS=new Set(['partnership','investment','accessibility','learning_governance'])
function normalizeTopicV13(value){const raw=ql7Str(value).toLowerCase().replace(/[\s-]+/g,'_');return V13_TOPICS.has(raw)?raw:normalizeQl7SupportTopic(raw||'support_system')}

const PRIORITY_RULES = Object.freeze([
  ['ads_packages', /(?:ads?\s+packages?|advertising\s+packages?|paquetes?\s+publicitarios?|paquetes?\s+de\s+publicidad|рекламн\w*\s+пакет|reklam\s+paket|باقة\s+الإعلانات|广告套餐|חבילת\s+הפרסום)/iu],
  ['metamarket', /(?:meta\s*market|metamarket|метамаркет|سوق\s+ميتا|元市场|מטאמרקט)/iu],
  ['academy_exam', /(?:academy\s+(?:exam|examination)|exam\s+result|экзамен\w*\s+академ|іспит\w*\s+академ|examen\s+de\s+la\s+academia|akademi\s+sınavı|اختبار\s+الأكاديمية|学院考试|מבחן\s+האקדמיה)/iu],
  ['forum_threads', /(?:forum\s+(?:threads?|topics?|replies)|hilos\s+del\s+foro|forum\s+konuları|ветк\w*\s+форум|тред|ответ\w*\s+в\s+тем|гілк\w*\s+форум|مواضيع\s+المنتدى|论坛主题|שרשור|שרשורי\s+הפורום)/iu],
  ['futures', /(?:futures(?:\s+simulator)?|симулятор\s+фьючерсов|симулятор\s+ф['’]ючерсів|фьючерс|ф['’]ючерс|vadeli\s+işlem\s+simülatörü|محاكي\s+العقود\s+الآجلة|期货模拟器|סימולטור\s+חוזים\s+עתידיים)/iu],
  ['auth', /(?:authorization|authentication|авторизац|yetkilendirme|autorizaci[oó]n|تسجيل\s+الدخول|登录与授权|הרשאה)/iu],
  ['payments', /(?:^|[^\p{L}\p{N}_])payments?(?=$|[^\p{L}\p{N}_])|платеж|платіж|pagos|ödemeler|المدفوعات|支付|תשלומים/iu],
  ['contact', /(?:team\s+contact|contact\s+the\s+team|связь\s+с\s+командой|зв['’]язок\s+із\s+командою|contacto|iletişim|التواصل|联系我们|יצירת\s+קשר)/iu],
  ['learning_governance', /(?:safe\s+self[-\s]?learning|self[-\s]?calibrat|dialogue\s+(?:experience|improvement)|governed\s+calibrat|самокалибр|самообуч|безпечн\w*\s+самонавч|למידה\s+עצמית|التعلم\s+الذاتي|自学习)/iu],
  ['investment', /(?:investment|investor|инвестиц|інвестиц|yatırım|استثمار|投资|השקעה)/iu],
  ['partnership', /(?:partnership|business\s+(?:proposal|cooperation|interest)|commercial\s+offer|партн[её]рств|сотрудничеств|делов\w+\s+предлож|співпрац|iş\s+ortak|شراكة|合作|שותפות)/iu],
  ['accessibility', /(?:accessibility|keyboard\s+navigation|screen\s+reader|assistive\s+technolog|доступност|навигац\w+\s+с\s+клавиатур|экранн\w+\s+диктор|доступн|клавіатур|无障碍|נגישות)/iu],
  ['account_deletion', /(?:account\s+deletion|delete\s+my\s+account|data\s+cleanup|удален\w+\s+аккаунт|очистк\w+\s+данн|видален\w+\s+акаунт|حذف\s+الحساب|删除账户|מחיקת\s+חשבון)/iu],
  ['telegram', /(?:telegram\s+mini\s+app|\bTMA\b|телеграм\w*\s+(?:мини|привяз)|міні[-\s]?застосунок|تطبيق\s+تيليجرام|电报|טלגרם)/iu],
  ['qcoin', /(?:qcoin|q\s*coin|баланс\w*\s+q|кьюкоин|кью\s*коин)/iu],
  ['support_system', /(?:ql7\s+support|support\s+(?:capabilities|scope|system)|возможност\w*\s+поддержк|система\s+поддержк)/iu],
])

function normalizeCalibrationText(value = '') {
  return ql7Str(value)
    .normalize('NFKC')
    .replace(/[’‘`´ʼʻ]/gu, "'")
    .replace(/\s+/gu, ' ')
    .trim()
}

function explicitCorrection(text = '') {
  return /(?:нет[,\s].{0,20}(?:я\s+про|имею\s+в\s+виду)|not\s+the\s+previous|i\s+mean|no[,\s].{0,20}i\s+mean|ні[,\s].{0,20}я\s+про|不是之前|לא\s+הנושא)/iu.test(normalizeCalibrationText(text))
}

export function calibrateQl7SupportRouteV13({ text = '', route = {}, analysis = {} } = {}) {
  const source = normalizeCalibrationText(text)
  const originalTopic = normalizeTopicV13(route.topic || analysis.topic || 'support_system')
  let topic = originalTopic
  let reason = 'preserve_route'
  for (const [candidate, pattern] of PRIORITY_RULES) {
    if (pattern.test(source)) { topic = candidate; reason = `priority:${candidate}`; break }
  }
  if (topic === originalTopic || explicitCorrection(source)) {
    const catalogTopic = classifyQl7SupportCatalogTopic(source, '')
    if (catalogTopic && (explicitCorrection(source) || topic === 'support_system')) {
      topic = normalizeTopicV13(catalogTopic)
      reason = `catalog:${topic}`
    }
  }
  const correction = explicitCorrection(source)
  return Object.freeze({
    ...route,
    topic,
    messageAct: correction && !['correction', 'denial'].includes(ql7Str(route.messageAct)) ? 'correction' : ql7Str(route.messageAct || analysis.messageAct || analysis.role || 'ambiguous_request'),
    v13Calibration: Object.freeze({ version: QL7_SUPPORT_ROUTE_CALIBRATION_VERSION_V13, originalTopic, topic, changed: topic !== originalTopic, correction, reason }),
  })
}
