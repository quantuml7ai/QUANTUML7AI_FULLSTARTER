import { normalizeQl7SupportLocale } from './adultLanguagePolicy.js'
import { getQl7SupportKnowledgeAnswer } from './knowledgeRegistry.js'

function str(value) { return String(value ?? '').trim() }

const COPY = Object.freeze({
  en: {
    greeting: 'Hello. How can I help?', close: 'You are welcome. Take care.',
    status: 'The request is still being processed. Add one important detail only if something changed.',
    noNewFact: 'That information is already recorded. Add only a new detail or explain what changed.',
    newIssue: 'Understood. Let us focus on the new question.', correction: 'Thanks for the correction. I will use the updated detail.',
    incident: 'I understand the issue. Write the most useful detail or the approximate time.',
  },
  ru: {
    greeting: 'Здравствуйте. Чем могу помочь?', close: 'Пожалуйста. Всего доброго.',
    status: 'Обращение ещё обрабатывается. Добавьте одну важную деталь, только если что-то изменилось.',
    noNewFact: 'Эта информация уже учтена. Добавьте только новую деталь или уточните, что изменилось.',
    newIssue: 'Понял. Сосредоточимся на новом вопросе.', correction: 'Спасибо за уточнение. Буду учитывать исправленную деталь.',
    incident: 'Понимаю ситуацию. Опишите самую полезную деталь или примерное время события.',
  },
  uk: {
    greeting: 'Вітаю. Чим можу допомогти?', close: 'Будь ласка. Усього доброго.',
    status: 'Звернення ще опрацьовується. Додайте одну важливу деталь, лише якщо щось змінилося.',
    noNewFact: 'Цю інформацію вже враховано. Додайте лише нову деталь або уточніть, що змінилося.',
    newIssue: 'Зрозуміло. Зосередьмося на новому питанні.', correction: 'Дякую за уточнення. Врахую виправлену деталь.',
    incident: 'Розумію ситуацію. Опишіть найкориснішу деталь або приблизний час події.',
  },
  es: {
    greeting: 'Hola. ¿En qué puedo ayudarte?', close: 'De nada. Que tengas un buen día.',
    status: 'La solicitud sigue en proceso. Añade un dato importante solo si algo cambió.',
    noNewFact: 'Esa información ya está registrada. Añade solo un dato nuevo o explica qué cambió.',
    newIssue: 'Entendido. Centrémonos en la nueva pregunta.', correction: 'Gracias por la corrección. Usaré el dato actualizado.',
    incident: 'Entiendo la situación. Describe el detalle más útil o la hora aproximada.',
  },
  tr: {
    greeting: 'Merhaba. Nasıl yardımcı olabilirim?', close: 'Rica ederim. İyi günler.',
    status: 'Talep hâlâ işleniyor. Yalnızca bir şey değiştiyse önemli bir ayrıntı ekleyin.',
    noNewFact: 'Bu bilgi zaten kaydedildi. Yalnızca yeni bir ayrıntı ekleyin veya neyin değiştiğini açıklayın.',
    newIssue: 'Anlaşıldı. Yeni soruya odaklanalım.', correction: 'Düzeltme için teşekkürler. Güncellenen ayrıntıyı kullanacağım.',
    incident: 'Durumu anlıyorum. En yararlı ayrıntıyı veya yaklaşık zamanı yazın.',
  },
  ar: {
    greeting: 'مرحباً. كيف يمكنني مساعدتك؟', close: 'على الرحب والسعة. أتمنى لك يوماً طيباً.',
    status: 'لا يزال الطلب قيد المعالجة. أضف معلومة مهمة واحدة فقط إذا تغيّر شيء.',
    noNewFact: 'تم تسجيل هذه المعلومة. أضف تفصيلاً جديداً فقط أو وضّح ما الذي تغيّر.',
    newIssue: 'مفهوم. لنركّز على السؤال الجديد.', correction: 'شكراً على التصحيح. سأعتمد المعلومة المحدّثة.',
    incident: 'أفهم الموقف. اكتب التفصيل الأكثر فائدة أو الوقت التقريبي.',
  },
  zh: {
    greeting: '你好。需要我帮你处理什么？', close: '不客气。祝你顺利。',
    status: '请求仍在处理中。只有情况发生变化时，才需要补充一项重要信息。',
    noNewFact: '这项信息已经记录。请只补充新的细节，或说明发生了什么变化。',
    newIssue: '明白。我们来处理新的问题。', correction: '感谢更正。我会采用更新后的信息。',
    incident: '我理解这个情况。请描述最有用的细节或大致时间。',
  },
  he: {
    greeting: 'שלום. איך אפשר לעזור?', close: 'בשמחה. כל טוב.',
    status: 'הפנייה עדיין בטיפול. הוסף פרט חשוב אחד רק אם משהו השתנה.',
    noNewFact: 'המידע הזה כבר נרשם. הוסף רק פרט חדש או הסבר מה השתנה.',
    newIssue: 'הבנתי. נתמקד בשאלה החדשה.', correction: 'תודה על התיקון. אשתמש בפרט המעודכן.',
    incident: 'אני מבין את המצב. תאר את הפרט השימושי ביותר או זמן משוער.',
  },
})

function copy(locale = 'en') { const lang = normalizeQl7SupportLocale(locale); return COPY[lang] || COPY.en }

export function composeQl7SupportSemanticReply({ analysis = {}, locale = 'en' } = {}) {
  const c = copy(locale)
  const role = str(analysis.role || analysis.messageAct)
  if (role === 'greeting') return c.greeting
  if (['informational_question', 'how_to_question', 'why_question', 'when_question'].includes(role)) {
    return getQl7SupportKnowledgeAnswer({ topic: analysis.topic, intent: role, locale }).text
  }
  if (str(analysis.currentQuestionText)) return `${c.incident} ${str(analysis.currentQuestionText)}`
  return c.incident
}

export function composeQl7SupportControlReply({ kind = '', locale = 'en' } = {}) {
  const c = copy(locale)
  if (kind === 'close') return c.close
  if (kind === 'status') return c.status
  if (kind === 'noNewFact') return c.noNewFact
  if (kind === 'newIssue') return c.newIssue
  if (kind === 'correction') return c.correction
  return c.incident
}
