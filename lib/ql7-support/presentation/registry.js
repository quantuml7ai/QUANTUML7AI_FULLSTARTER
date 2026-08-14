import { getQl7SupportTopicLabel, normalizeQl7SupportTopic } from '../ecosystemCatalog.js'
import { ql7Locale, ql7Str } from '../internal/text.js'

export const QL7_SUPPORT_PRESENTATION_REGISTRY_VERSION_V13 = '13.0.0'
const V13_TOPICS=new Set(['partnership','investment','accessibility','learning_governance'])
function normalizeTopicV13(value){const raw=ql7Str(value).toLowerCase().replace(/[\s-]+/g,'_');return V13_TOPICS.has(raw)?raw:normalizeQl7SupportTopic(raw||'support_system')}

const TOPIC_ICONS = Object.freeze({
  support_system:'information', qcoin:'qcoin', wallet:'wallet', payments:'payment', payment:'payment', vip:'vip',
  ads_packages:'ads_package', ads_campaigns:'ads_metrics', ads_metrics:'ads_metrics', forum:'forum', forum_threads:'forum',
  telegram:'telegram', quantum_messenger:'conversation', battle_chat:'conversation', push:'information', academy:'academy',
  academy_exam:'academy', gameverse:'gameverse', metamarket:'metamarket', exchange:'exchange', battlecoin:'exchange',
  privacy:'privacy', security:'security', account_access:'identity', identity:'identity', account_deletion:'account_deletion',
  accessibility:'accessibility', contact:'operator_handoff', partnership:'partnership', investment:'investment', media:'information',
  learning_governance:'learning', domains:'information', ai_box:'information', profile:'identity', moderation:'moderation',
})

const ROLE_BY_KIND = Object.freeze({
  thanks:'gratitude', hello:'greeting', bye:'conversation', mood:'social', jokes:'humor', information:'information',
  status:'verification', incident:'clarification', clarification:'clarification', correction:'context', rude:'warning',
  threat:'threat', operator:'operator_handoff', unavailable:'unavailable', success:'confirmed', choice:'choice',
})

const THEMES = Object.freeze({
  gratitude:'emotion-joy', greeting:'aurora-welcome', social:'emotion-aurora', humor:'emotion-playful', information:'knowledge-blue',
  verification:'result-emerald', clarification:'clarify-indigo', context:'choice-aurora', warning:'complaint-amber',
  threat:'safety-red', blocked:'safety-red', operator_handoff:'runtime-cyan', unavailable:'runtime-cyan', confirmed:'success-emerald',
  qcoin:'result-emerald', vip:'payment-violet-gold', payment:'payment-violet-gold', ads_metrics:'emotion-analytical',
  ads_package:'choice-aurora', security:'emotion-serious', privacy:'emotion-serious', partnership:'emotion-aurora',
  investment:'payment-violet-gold', accessibility:'knowledge-blue', academy:'knowledge-blue', gameverse:'emotion-playful',
  metamarket:'payment-violet-gold', telegram:'runtime-cyan', forum:'knowledge-blue', account_deletion:'safety-red',
})

const TITLES = Object.freeze({
  en:{greeting:'Ready to help',gratitude:'Glad to help',social:'Let us talk',humor:'A quick smile',warning:'Let us keep it respectful',threat:'Safety boundary',operator_handoff:'Human review',unavailable:'Verification unavailable',confirmed:'Verified result',clarification:'One detail is needed',context:'Correction accepted'},
  ru:{greeting:'Рад помочь',gratitude:'Рад помочь',social:'Давайте поговорим',humor:'Немного юмора',warning:'Давайте без оскорблений',threat:'Граница безопасности',operator_handoff:'Передано оператору',unavailable:'Проверка пока недоступна',confirmed:'Подтверждённый результат',clarification:'Нужна одна деталь',context:'Исправление принято'},
  uk:{greeting:'Радий допомогти',gratitude:'Радий допомогти',social:'Давайте поговоримо',humor:'Трохи гумору',warning:'Давайте без образ',threat:'Межа безпеки',operator_handoff:'Передано оператору',unavailable:'Перевірка поки недоступна',confirmed:'Підтверджений результат',clarification:'Потрібна одна деталь',context:'Виправлення прийнято'},
  es:{greeting:'Listo para ayudar',gratitude:'Me alegra ayudar',social:'Hablemos',humor:'Una sonrisa rápida',warning:'Mantengamos el respeto',threat:'Límite de seguridad',operator_handoff:'Enviado a revisión humana',unavailable:'Comprobación no disponible',confirmed:'Resultado verificado',clarification:'Falta un dato',context:'Corrección aceptada'},
  tr:{greeting:'Yardım etmeye hazırım',gratitude:'Yardımcı olmaktan memnunum',social:'Konuşalım',humor:'Kısa bir gülümseme',warning:'Saygılı ilerleyelim',threat:'Güvenlik sınırı',operator_handoff:'İnsan incelemesine aktarıldı',unavailable:'Kontrol şu anda kullanılamıyor',confirmed:'Doğrulanan sonuç',clarification:'Bir ayrıntı gerekli',context:'Düzeltme kabul edildi'},
  ar:{greeting:'جاهز للمساعدة',gratitude:'سعيد بالمساعدة',social:'لنتحدث',humor:'ابتسامة سريعة',warning:'لنحافظ على الاحترام',threat:'حدود الأمان',operator_handoff:'تم التحويل للمراجعة البشرية',unavailable:'التحقق غير متاح الآن',confirmed:'نتيجة مؤكدة',clarification:'نحتاج إلى تفصيل واحد',context:'تم قبول التصحيح'},
  zh:{greeting:'随时为你处理',gratitude:'很高兴能帮上忙',social:'聊一聊',humor:'轻松一下',warning:'请保持尊重',threat:'安全边界',operator_handoff:'已转人工审核',unavailable:'暂时无法核验',confirmed:'已确认结果',clarification:'还需要一个信息',context:'已采用更正'},
  he:{greeting:'מוכן לעזור',gratitude:'שמח לעזור',social:'בואו נדבר',humor:'חיוך קטן',warning:'נשמור על שיח מכבד',threat:'גבול בטיחות',operator_handoff:'הועבר לבדיקה אנושית',unavailable:'האימות אינו זמין כרגע',confirmed:'תוצאה מאומתת',clarification:'נדרש פרט אחד',context:'התיקון התקבל'},
})

function titleFor(role, topic, locale){
  const lang=ql7Locale(locale); const dictionary=TITLES[lang]||TITLES.en
  const custom={en:{partnership:'Partnership',investment:'Investment',accessibility:'Accessibility',learning_governance:'Safe learning'},ru:{partnership:'Партнёрство',investment:'Инвестиции',accessibility:'Доступность',learning_governance:'Безопасное обучение'},uk:{partnership:'Партнерство',investment:'Інвестиції',accessibility:'Доступність',learning_governance:'Безпечне навчання'}}
  return dictionary[role] || (custom[lang]||custom.en)[topic] || getQl7SupportTopicLabel(topic,lang) || getQl7SupportTopicLabel(topic,'en') || 'Support'
}

export function resolveQl7SupportPresentationV13({topic='',kind='',messageAct='',verified=false,unavailable=false,operator=false,severity='',tone={}}={}){
  const normalizedTopic=normalizeTopicV13(topic||'support_system')
  const normalizedKind=ql7Str(kind)
  let role=ROLE_BY_KIND[normalizedKind] || TOPIC_ICONS[normalizedTopic] || 'information'
  if(['information','status'].includes(normalizedKind)&&TOPIC_ICONS[normalizedTopic]) role=TOPIC_ICONS[normalizedTopic]
  if(operator) role='operator_handoff'
  if(unavailable) role='unavailable'
  if(verified && ['verification','unavailable','information'].includes(role)) role=TOPIC_ICONS[normalizedTopic]||'confirmed'
  if(/threat|attack|terror/iu.test(`${kind} ${messageAct} ${tone?.taxonomyCategory||''}`)) role='threat'
  if(/blocked|cooldown/iu.test(`${kind} ${severity}`)) role='blocked'
  if(/warning|insult|rude/iu.test(`${kind} ${severity}`) && role!=='threat') role='warning'
  const purpose = role==='greeting'?'greeting':role==='humor'?'humor':role==='clarification'?'clarification':role==='warning'?'complaint':['threat','blocked'].includes(role)?'safety':role==='operator_handoff'?'notice':verified?'diagnostic_result':'explanation'
  const presentationState = role==='threat'||role==='blocked'?'strict':role==='warning'?'caution':role==='humor'?'playful':verified?'confirmed':unavailable?'neutral':'calm'
  return Object.freeze({
    version:QL7_SUPPORT_PRESENTATION_REGISTRY_VERSION_V13,
    topic:normalizedTopic, role, purpose,
    iconKey:role,
    visualTheme:THEMES[role]||THEMES[TOPIC_ICONS[normalizedTopic]]||'knowledge-blue',
    presentationState,
    severity:ql7Str(severity)||(['threat','blocked'].includes(role)?'critical':role==='warning'?'warning':'info'),
    statusTone:verified?'success':role==='warning'?'warning':['threat','blocked'].includes(role)?'danger':'neutral',
  })
}

export function getQl7SupportSurfaceTitleV13({role='information',topic='support_system',locale='en'}={}){
  const normalizedTopic=normalizeTopicV13(topic||'support_system')
  const generic=titleFor(role,normalizedTopic,locale)
  if(['information','verification','qcoin','wallet','payment','vip','ads_metrics','ads_package','forum','telegram','academy','gameverse','metamarket','security','privacy','accessibility','partnership','investment','identity','learning'].includes(role)){
    return getQl7SupportTopicLabel(normalizedTopic,ql7Locale(locale)) || generic
  }
  return generic
}
