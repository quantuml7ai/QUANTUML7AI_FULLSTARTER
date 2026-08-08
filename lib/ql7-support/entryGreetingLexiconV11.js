import { selectQl7SupportGreetingDaypartV12 } from './v12/temporalContextV12.js'
import { QL7_SUPPORT_ALL_LOCALES } from './config/behaviorManifest.js'
import { getQl7HumanEntryGreetingBank } from './language/humanVariationBanks.js'
const BANK = Object.freeze({
  en: Object.freeze([
    ['en-warm-01', 'Hello. I am here and ready to help. What would you like to sort out today?'],
    ['en-warm-02', 'Good to see you. Tell me what is happening, and we will take it one clear step at a time.'],
    ['en-warm-03', 'Welcome back. We can continue an earlier question or start with something new.'],
    ['en-warm-04', 'Hi. Describe the situation in your own words — I will keep the useful context together.'],
    ['en-warm-05', 'Hello again. What would make this visit useful for you right now?'],
    ['en-warm-06', 'I am listening. You can begin with the result you wanted or the part that feels unclear.'],
    ['en-warm-07', 'Welcome. We can check a status, explain a feature, or calmly untangle a problem.'],
    ['en-warm-08', 'Hi there. What should we look at first?'],
    ['en-warm-09', 'Good day. Tell me what you need, and I will help you find the shortest clear path.'],
    ['en-warm-10', 'I am back on the line with you. What would you like to understand or verify?'],
  ]),
  ru: Object.freeze([
    ['ru-warm-01', 'Здравствуйте. Я на связи и готов помочь. Что хотите разобрать сегодня?'],
    ['ru-warm-02', 'Рад вас видеть. Расскажите, что происходит, и разберём всё спокойно по шагам.'],
    ['ru-warm-03', 'Добрый день. Можем продолжить прежний вопрос или начать с нового.'],
    ['ru-warm-04', 'Добрый вечер. Опишите ситуацию своими словами — я сохраню полезный контекст.'],
    ['ru-warm-05', 'Привет. Что сейчас важнее всего понять или проверить?'],
    ['ru-warm-06', 'Я слушаю. Можно начать с того, какой результат вы ожидали и что получилось на деле.'],
    ['ru-warm-07', 'Снова на связи. Проверим статус, разберём функцию или спокойно решим проблему.'],
    ['ru-warm-08', 'Здравствуйте снова. С чего удобнее начать?'],
    ['ru-warm-09', 'Рад помочь. Расскажите, что вас привело, и найдём понятный следующий шаг.'],
    ['ru-warm-10', 'Я рядом в этом диалоге. Что хотите узнать, проверить или исправить?'],
  ]),
  uk: Object.freeze([
    ['uk-warm-01', 'Вітаю. Я на зв’язку й готовий допомогти. Що хочете розібрати сьогодні?'],
    ['uk-warm-02', 'Радий вас бачити. Розкажіть, що відбувається, і спокійно пройдемо все крок за кроком.'],
    ['uk-warm-03', 'Добрий день. Можемо продовжити попереднє питання або почати нове.'],
    ['uk-warm-04', 'Добрий вечір. Опишіть ситуацію своїми словами — я збережу корисний контекст.'],
    ['uk-warm-05', 'Привіт. Що зараз найважливіше зрозуміти або перевірити?'],
    ['uk-warm-06', 'Я слухаю. Почніть з очікуваного результату або з того, що пішло не так.'],
    ['uk-warm-07', 'Знову на зв’язку. Перевіримо статус, пояснимо функцію або спокійно розв’яжемо проблему.'],
    ['uk-warm-08', 'Вітаю знову. З чого зручніше почати?'],
  ]),
  es: Object.freeze([
    ['es-warm-01', 'Hola. Estoy aquí y listo para ayudarte. ¿Qué quieres resolver hoy?'],
    ['es-warm-02', 'Me alegra verte. Cuéntame qué ocurre y lo revisaremos con calma, paso a paso.'],
    ['es-warm-03', 'Buenos días. Podemos continuar una pregunta anterior o empezar una nueva.'],
    ['es-warm-04', 'Buenas tardes. Describe la situación con tus palabras y mantendré el contexto útil.'],
    ['es-warm-05', 'Hola de nuevo. ¿Qué necesitas entender o comprobar ahora?'],
    ['es-warm-06', 'Te escucho. Puedes empezar por el resultado que esperabas o por lo que salió mal.'],
    ['es-warm-07', 'Estoy de vuelta contigo. Revisemos un estado, una función o un problema concreto.'],
    ['es-warm-08', 'Bienvenido. ¿Por dónde prefieres empezar?'],
  ]),
  tr: Object.freeze([
    ['tr-warm-01', 'Merhaba. Buradayım ve yardımcı olmaya hazırım. Bugün neyi çözmek istersiniz?'],
    ['tr-warm-02', 'Sizi görmek güzel. Ne olduğunu anlatın, birlikte sakin ve adım adım inceleyelim.'],
    ['tr-warm-03', 'İyi günler. Önceki bir soruya devam edebilir veya yeni bir konuya başlayabiliriz.'],
    ['tr-warm-04', 'İyi akşamlar. Durumu kendi sözlerinizle anlatın; yararlı bağlamı koruyacağım.'],
    ['tr-warm-05', 'Tekrar merhaba. Şu anda neyi anlamak veya kontrol etmek istiyorsunuz?'],
    ['tr-warm-06', 'Sizi dinliyorum. Beklediğiniz sonuçtan veya ters giden noktadan başlayabilirsiniz.'],
    ['tr-warm-07', 'Yeniden bağlantıdayız. Bir durumu, özelliği ya da sorunu birlikte inceleyebiliriz.'],
    ['tr-warm-08', 'Hoş geldiniz. Nereden başlayalım?'],
  ]),
  ar: Object.freeze([
    ['ar-warm-01', 'مرحباً. أنا هنا ومستعد للمساعدة. ما الذي تريد حله اليوم؟'],
    ['ar-warm-02', 'سعيد بوجودك. اشرح ما يحدث وسنراجعه بهدوء خطوة بخطوة.'],
    ['ar-warm-03', 'نهارك سعيد. يمكننا متابعة سؤال سابق أو البدء بموضوع جديد.'],
    ['ar-warm-04', 'مساء الخير. صف الحالة بكلماتك وسأحافظ على السياق المفيد.'],
    ['ar-warm-05', 'مرحباً من جديد. ما الذي تريد فهمه أو التحقق منه الآن؟'],
    ['ar-warm-06', 'أنا أستمع. ابدأ بالنتيجة التي توقعتها أو بالنقطة التي لم تعمل كما ينبغي.'],
    ['ar-warm-07', 'عدنا إلى الحوار. يمكننا فحص حالة أو شرح ميزة أو حل مشكلة محددة.'],
    ['ar-warm-08', 'أهلاً بك. من أين تفضّل أن نبدأ؟'],
  ]),
  zh: Object.freeze([
    ['zh-warm-01', '你好。我在这里，随时可以帮你。今天想解决什么问题？'],
    ['zh-warm-02', '很高兴见到你。请告诉我发生了什么，我们一步一步处理。'],
    ['zh-warm-03', '您好。我们可以继续之前的问题，也可以开始新的话题。'],
    ['zh-warm-04', '晚上好。请用自己的话描述情况，我会保留有用的上下文。'],
    ['zh-warm-05', '欢迎回来。现在最想了解或检查什么？'],
    ['zh-warm-06', '我在听。你可以先说预期结果，或者哪一步没有按计划进行。'],
    ['zh-warm-07', '我们又见面了。可以检查状态、解释功能或处理具体问题。'],
    ['zh-warm-08', '欢迎。你想从哪里开始？'],
  ]),
  he: Object.freeze([
    ['he-warm-01', 'שלום. אני כאן ומוכן לעזור. מה תרצה לפתור היום?'],
    ['he-warm-02', 'טוב לראות אותך. ספר מה קורה ונעבור על זה בשקט, שלב אחר שלב.'],
    ['he-warm-03', 'יום טוב. אפשר להמשיך שאלה קודמת או להתחיל נושא חדש.'],
    ['he-warm-04', 'ערב טוב. תאר את המצב במילים שלך ואשמור על ההקשר השימושי.'],
    ['he-warm-05', 'שלום שוב. מה חשוב לך להבין או לבדוק עכשיו?'],
    ['he-warm-06', 'אני מקשיב. אפשר להתחיל מהתוצאה שציפית לה או מהנקודה שלא עבדה.'],
    ['he-warm-07', 'חזרנו לשיחה. אפשר לבדוק מצב, להסביר תכונה או לפתור בעיה ממוקדת.'],
    ['he-warm-08', 'ברוך הבא. מאיפה נוח להתחיל?'],
  ]),
})



const IDLE_BANK = Object.freeze({
  en: Object.freeze([
    ['en-idle-01', 'I am still here. Did the question get resolved, or should we continue from the part that remains unclear?'],
    ['en-idle-02', 'No rush. When you are ready, tell me whether we should continue, check a status, or close this question.'],
    ['en-idle-03', 'Just checking in: is there anything you still want me to explain or verify before we finish?'],
  ]),
  ru: Object.freeze([
    ['ru-idle-01', 'Я всё ещё на связи. Вопрос уже решён или продолжим с той части, которая осталась непонятной?'],
    ['ru-idle-02', 'Не тороплю. Когда будете готовы, скажите: продолжаем, проверяем статус или закрываем вопрос?'],
    ['ru-idle-03', 'Уточню на всякий случай: осталось что-то объяснить или проверить перед завершением?'],
  ]),
  uk: Object.freeze([
    ['uk-idle-01', 'Я все ще на зв’язку. Питання вже вирішено чи продовжимо з того, що залишилося незрозумілим?'],
    ['uk-idle-02', 'Не кваплю. Коли будете готові, скажіть: продовжуємо, перевіряємо статус чи закриваємо питання?'],
    ['uk-idle-03', 'Уточню: чи залишилося щось пояснити або перевірити перед завершенням?'],
  ]),
  es: Object.freeze([
    ['es-idle-01', 'Sigo aquí. ¿La pregunta ya quedó resuelta o continuamos con la parte que sigue poco clara?'],
    ['es-idle-02', 'Sin prisa. Cuando estés listo, dime si continuamos, comprobamos un estado o cerramos la consulta.'],
    ['es-idle-03', 'Solo confirmo: ¿queda algo por explicar o verificar antes de terminar?'],
  ]),
  tr: Object.freeze([
    ['tr-idle-01', 'Hâlâ buradayım. Soru çözüldü mü, yoksa net olmayan kısımdan devam edelim mi?'],
    ['tr-idle-02', 'Acele etmeyin. Hazır olduğunuzda devam mı edelim, durum mu kontrol edelim, yoksa konuyu kapatalım mı?'],
    ['tr-idle-03', 'Kapatmadan önce açıklamamı veya kontrol etmemi istediğiniz bir nokta kaldı mı?'],
  ]),
  ar: Object.freeze([
    ['ar-idle-01', 'ما زلت هنا. هل تم حل السؤال أم نتابع من الجزء الذي ما زال غير واضح؟'],
    ['ar-idle-02', 'لا داعي للعجلة. عندما تكون جاهزاً أخبرني: نتابع، نتحقق من الحالة، أم ننهي السؤال؟'],
    ['ar-idle-03', 'للتأكد فقط: هل بقي شيء تريد شرحه أو التحقق منه قبل أن ننهي؟'],
  ]),
  zh: Object.freeze([
    ['zh-idle-01', '我还在。问题已经解决了吗，还是继续处理仍不清楚的部分？'],
    ['zh-idle-02', '不用着急。准备好后告诉我：继续、检查状态，还是结束这个问题？'],
    ['zh-idle-03', '确认一下：结束前还有需要解释或核对的内容吗？'],
  ]),
  he: Object.freeze([
    ['he-idle-01', 'אני עדיין כאן. השאלה נפתרה, או שנמשיך מהחלק שעדיין אינו ברור?'],
    ['he-idle-02', 'אין לחץ. כשתהיה מוכן, ספר אם ממשיכים, בודקים מצב או סוגרים את השאלה.'],
    ['he-idle-03', 'רק כדי לוודא: נשאר משהו שתרצה שאסביר או אבדוק לפני שנסיים?'],
  ]),
})

const ENTRY_EXTRA_BANK = Object.freeze({
  en: Object.freeze([
    ['en-fresh-11', 'Welcome back. I am ready to help with a fresh question whenever you are ready.'],
    ['en-fresh-12', 'Good to see you again. Tell me what needs attention, and I will keep the path clear.'],
    ['en-fresh-13', 'Hello again. What should we check, explain, or fix for you today?'],
    ['en-fresh-14', 'I am here with you. Start anywhere: the issue, the expected result, or the part that feels confusing.'],
    ['en-continue-01', 'We can continue from the open question. What part should I check next?'],
    ['en-continue-02', 'The previous thread is still open. Send the next detail, and I will connect it to the existing context.'],
    ['en-continue-03', 'Ready to continue. Do you want to add evidence, check status, or narrow the remaining step?'],
    ['en-continue-04', 'I kept the thread context. Tell me what changed since the last message.'],
  ]),
  ru: Object.freeze([
    ['ru-fresh-11', 'Рад снова видеть. Чем помочь сейчас: проверить статус, объяснить функцию или разобрать проблему?'],
    ['ru-fresh-12', 'Здравствуйте снова. Напишите, что важно решить сегодня, и я аккуратно соберу контекст.'],
    ['ru-fresh-13', 'Я на связи. Можно начать с короткого описания ситуации или с результата, который вы ожидали.'],
    ['ru-fresh-14', 'Добро пожаловать обратно. Что проверим, уточним или исправим первым делом?'],
    ['ru-continue-01', 'Можем продолжить открытый вопрос. Что появилось нового или что нужно проверить следующим шагом?'],
    ['ru-continue-02', 'Предыдущая тема ещё не закрыта. Добавьте деталь, и я свяжу её с уже собранным контекстом.'],
    ['ru-continue-03', 'Готов продолжить по текущему обращению. Нужна проверка статуса, уточнение или разбор нового факта?'],
    ['ru-continue-04', 'Контекст этой переписки сохранён. Напишите, что изменилось после последнего сообщения.'],
  ]),
  uk: Object.freeze([
    ['uk-fresh-11', 'Радий бачити знову. Чим допомогти зараз: перевірити статус, пояснити функцію чи розібрати проблему?'],
    ['uk-fresh-12', 'Вітаю знову. Напишіть, що важливо вирішити сьогодні, і я акуратно зберу контекст.'],
    ['uk-fresh-13', 'Я на зв’язку. Можна почати з короткого опису ситуації або з очікуваного результату.'],
    ['uk-fresh-14', 'Ласкаво просимо назад. Що перевіримо, уточнимо або виправимо спочатку?'],
    ['uk-continue-01', 'Можемо продовжити відкрите питання. Що з’явилося нового або що перевірити далі?'],
    ['uk-continue-02', 'Попередня тема ще не закрита. Додайте деталь, і я поєднаю її з уже зібраним контекстом.'],
    ['uk-continue-03', 'Готовий продовжити поточне звернення. Потрібна перевірка статусу, уточнення чи новий факт?'],
    ['uk-continue-04', 'Контекст цієї переписки збережено. Напишіть, що змінилося після останнього повідомлення.'],
  ]),
  es: Object.freeze([
    ['es-fresh-11', 'Me alegra verte de nuevo. ¿Qué revisamos, explicamos o corregimos primero?'],
    ['es-fresh-12', 'Hola otra vez. Cuéntame qué quieres resolver hoy y mantendré el contexto ordenado.'],
    ['es-fresh-13', 'Estoy aquí contigo. Puedes empezar por el problema, el resultado esperado o la parte confusa.'],
    ['es-fresh-14', 'Bienvenido de vuelta. Dime qué necesita atención y avanzamos con calma.'],
    ['es-continue-01', 'Podemos continuar la consulta abierta. ¿Qué cambió o qué quieres comprobar ahora?'],
    ['es-continue-02', 'La conversación anterior sigue abierta. Añade el detalle y lo uniré al contexto existente.'],
    ['es-continue-03', 'Listo para continuar. ¿Quieres revisar estado, aportar evidencia o cerrar el paso pendiente?'],
    ['es-continue-04', 'Conservo el contexto del hilo. Dime qué ocurrió desde el último mensaje.'],
  ]),
  tr: Object.freeze([
    ['tr-fresh-11', 'Tekrar hoş geldiniz. Önce neyi kontrol edelim, açıklayalım veya düzeltelim?'],
    ['tr-fresh-12', 'Yeniden merhaba. Bugün neyi çözmek istediğinizi yazın; bağlamı düzenli tutacağım.'],
    ['tr-fresh-13', 'Buradayım. Sorundan, beklenen sonuçtan veya karışık gelen noktadan başlayabilirsiniz.'],
    ['tr-fresh-14', 'Sizi tekrar görmek güzel. Hangi konuya öncelik verelim?'],
    ['tr-continue-01', 'Açık konudan devam edebiliriz. Ne değişti veya şimdi neyi kontrol edelim?'],
    ['tr-continue-02', 'Önceki başlık hâlâ açık. Yeni ayrıntıyı yazın; mevcut bağlama bağlayacağım.'],
    ['tr-continue-03', 'Devam etmeye hazırım. Durum kontrolü, ek kanıt veya kalan adımı netleştirelim mi?'],
    ['tr-continue-04', 'Bu konuşmanın bağlamı korunuyor. Son mesajdan sonra ne değişti?'],
  ]),
  ar: Object.freeze([
    ['ar-fresh-11', 'سعيد بعودتك. ما الذي نتحقق منه أو نشرحه أو نصلحه أولاً؟'],
    ['ar-fresh-12', 'مرحباً من جديد. اكتب ما تريد حله اليوم وسأحافظ على السياق مرتباً.'],
    ['ar-fresh-13', 'أنا هنا معك. يمكنك البدء بالمشكلة أو النتيجة المتوقعة أو الجزء غير الواضح.'],
    ['ar-fresh-14', 'أهلاً بعودتك. ما الأمر الذي يحتاج إلى انتباه الآن؟'],
    ['ar-continue-01', 'يمكننا متابعة السؤال المفتوح. ما الذي تغيّر أو ما الذي تريد التحقق منه الآن؟'],
    ['ar-continue-02', 'الموضوع السابق ما زال مفتوحاً. أضف التفصيل وسأربطه بالسياق الموجود.'],
    ['ar-continue-03', 'جاهز للمتابعة. هل تريد فحص الحالة أو إضافة دليل أو توضيح الخطوة المتبقية؟'],
    ['ar-continue-04', 'تم حفظ سياق هذه المحادثة. أخبرني بما تغيّر منذ آخر رسالة.'],
  ]),
  zh: Object.freeze([
    ['zh-fresh-11', '欢迎回来。我们先检查、解释，还是修复哪个问题？'],
    ['zh-fresh-12', '又见面了。请告诉我今天想解决什么，我会把上下文整理清楚。'],
    ['zh-fresh-13', '我在这里。可以先说问题、预期结果，或让你困惑的部分。'],
    ['zh-fresh-14', '欢迎回来。现在最需要处理的是哪一项？'],
    ['zh-continue-01', '我们可以继续未关闭的问题。现在有什么变化，或需要检查哪一步？'],
    ['zh-continue-02', '之前的主题仍然打开。补充细节后，我会接到已有上下文里。'],
    ['zh-continue-03', '可以继续。你想查状态、补充证据，还是确认剩下的步骤？'],
    ['zh-continue-04', '我保留了这条对话的上下文。请告诉我上一条消息之后发生了什么。'],
  ]),
  he: Object.freeze([
    ['he-fresh-11', 'שמח לראות אותך שוב. מה נבדוק, נסביר או נתקן קודם?'],
    ['he-fresh-12', 'שלום שוב. כתוב מה חשוב לפתור היום ואשמור את ההקשר מסודר.'],
    ['he-fresh-13', 'אני כאן איתך. אפשר להתחיל מהבעיה, מהתוצאה שציפית לה או מהחלק הלא ברור.'],
    ['he-fresh-14', 'ברוך שובך. איזה נושא צריך תשומת לב עכשיו?'],
    ['he-continue-01', 'אפשר להמשיך את השאלה הפתוחה. מה השתנה או מה לבדוק עכשיו?'],
    ['he-continue-02', 'הנושא הקודם עדיין פתוח. הוסף פרט ואחבר אותו להקשר הקיים.'],
    ['he-continue-03', 'מוכן להמשיך. נבדוק מצב, נוסיף ראיה או נחדד את הצעד שנשאר?'],
    ['he-continue-04', 'ההקשר של השיחה נשמר. ספר מה השתנה מאז ההודעה האחרונה.'],
  ]),
})

function str(value) { return String(value ?? '').trim() }
function hashInt(value = '') {
  let hash = 2166136261 >>> 0
  for (const char of str(value) || 'ql7-entry') {
    hash ^= char.codePointAt(0)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash >>> 0
}
export function normalizeQl7SupportEntryLocaleV11(value = 'en') {
  const locale = str(value).toLowerCase().split(/[-_]/u)[0]
  return QL7_SUPPORT_ALL_LOCALES.includes(locale) ? locale : 'en'
}
const ENTRY_BANK_CACHE_V11 = new Map()
const ENTRY_LIST_CACHE_V11 = new Map()
function entryBankForLocale(locale = 'en') {
  const lang = normalizeQl7SupportEntryLocaleV11(locale)
  if (ENTRY_BANK_CACHE_V11.has(lang)) return ENTRY_BANK_CACHE_V11.get(lang)
  const base = [...(BANK[lang] || []), ...(ENTRY_EXTRA_BANK[lang] || [])]
  const generated = getQl7HumanEntryGreetingBank(lang)
  const fresh = (generated.entryGreetingFresh || []).map((text, index) => [`${lang}-fresh-generated-${String(index + 1).padStart(4, '0')}`, text])
  const cont = (generated.entryGreetingContinue || []).map((text, index) => [`${lang}-continue-generated-${String(index + 1).padStart(4, '0')}`, text])
  const bank = Object.freeze([...base, ...fresh, ...cont])
  ENTRY_BANK_CACHE_V11.set(lang, bank)
  return bank
}
export function listQl7SupportEntryGreetingsV11(locale = 'en') {
  const lang = normalizeQl7SupportEntryLocaleV11(locale)
  if (ENTRY_LIST_CACHE_V11.has(lang)) return ENTRY_LIST_CACHE_V11.get(lang)
  const list = Object.freeze(entryBankForLocale(lang).map(([id, text]) => Object.freeze({ id, text, locale: lang })))
  ENTRY_LIST_CACHE_V11.set(lang, list)
  return list
}
export function getQl7SupportEntryGreetingByIdV11({ locale = 'en', variantId = '' } = {}) {
  const bank = listQl7SupportEntryGreetingsV11(locale)
  const wanted = str(variantId)
  return bank.find((row) => row.id === wanted) || null
}
function greetingDaypartV11(row = {}) {
  const id = str(row?.id)
  if (/^(?:ru|uk)-warm-03$/u.test(id)) return 'day'
  if (/^(?:ru|uk|es|tr|ar|zh|he)-warm-04$/u.test(id)) return 'evening'
  if (/^es-warm-03$/u.test(id)) return 'morning'
  if (/^(?:tr|ar|he)-warm-03$|^en-warm-09$/u.test(id)) return 'day'
  return 'neutral'
}
function greetingEntryModeV11(row = {}) {
  const id = str(row?.id)
  if (/-continue-/u.test(id)) return 'continue'
  if (/-fresh-/u.test(id)) return 'fresh'
  return 'neutral'
}
export function selectQl7SupportEntryGreetingV11({ locale = 'en', seed = '', recentVariantIds = [], timeZone = 'UTC', now = Date.now(), entryMode = '' } = {}) {
  const temporal = selectQl7SupportGreetingDaypartV12({ timeZone, now })
  const fullBank = listQl7SupportEntryGreetingsV11(locale)
  const normalizedMode = /continue/iu.test(str(entryMode)) ? 'continue' : (/fresh|closed|new/iu.test(str(entryMode)) ? 'fresh' : '')
  const modeBank = normalizedMode === 'continue'
    ? fullBank.filter((row) => greetingEntryModeV11(row) === 'continue')
    : normalizedMode === 'fresh'
      ? fullBank.filter((row) => greetingEntryModeV11(row) !== 'continue')
      : fullBank
  const allowed = new Set(temporal.allowedDayparts || ['neutral'])
  const filtered = modeBank.filter((row) => allowed.has(greetingDaypartV11(row)))
  const bank = filtered.length ? filtered : (modeBank.length ? modeBank : fullBank)
  const recent = new Set((Array.isArray(recentVariantIds) ? recentVariantIds : []).map(str).filter(Boolean))
  const start = hashInt(seed || `${Date.now()}:${Math.random()}`) % bank.length
  for (let offset = 0; offset < bank.length; offset += 1) {
    const row = bank[(start + offset) % bank.length]
    if (!recent.has(row.id)) return row
  }
  return bank[start]
}
const ENTRY_RECENT_MEMORY_V11 = new Map()
function recentStorageKey(userId = '', locale = 'en') {
  return `ql7:support:entry-greetings:v11:${str(userId).toLowerCase()}:${normalizeQl7SupportEntryLocaleV11(locale)}`
}
export function createQl7SupportInstantGreetingMessageV11({ userId = '', locale = 'en', entryNonce = '', entryMode = '', now = Date.now() } = {}) {
  const recentKey = recentStorageKey(userId, locale)
  let recent = ENTRY_RECENT_MEMORY_V11.get(recentKey) || []
  let sessionBacked = false
  if (typeof sessionStorage !== 'undefined') {
    try {
      recent = JSON.parse(sessionStorage.getItem(recentKey) || '[]') || recent
      sessionBacked = true
    } catch {}
  }
  const timeZone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' } })()
  const selected = selectQl7SupportEntryGreetingV11({ locale, seed: `${userId}:${entryNonce}:${entryMode}:${now}`, recentVariantIds: recent, timeZone, now, entryMode })
  const nextRecent = [selected.id, ...recent].filter(Boolean).slice(0, 5)
  ENTRY_RECENT_MEMORY_V11.set(recentKey, nextRecent)
  if (ENTRY_RECENT_MEMORY_V11.size > 128) ENTRY_RECENT_MEMORY_V11.delete(ENTRY_RECENT_MEMORY_V11.keys().next().value)
  if (sessionBacked) {
    try { sessionStorage.setItem(recentKey, JSON.stringify(nextRecent)) } catch {}
  }
  const mutationId = `entry:${entryNonce || `${now}`}`.slice(0, 160)
  return Object.freeze({
    id: `tmp_dm_ql7_entry_${hashInt(`${mutationId}:${selected.id}`).toString(16)}`,
    from: 'ql7-support',
    fromCanonical: 'ql7-support',
    to: str(userId),
    toCanonical: str(userId),
    text: selected.text,
    ts: Number(now) || Date.now(),
    status: 'sending',
    isSystem: true,
    systemRole: 'ql7_support_system',
    supportThread: true,
    supportEventType: 'entry_greeting',
    clientMutationId: mutationId,
    correlationId: mutationId,
    metadata: Object.freeze({
      entryGreeting: true,
      clientOnly: true,
      entryVariantId: selected.id,
      entryMode: str(entryMode),
      responseCode: 'greeting_entry_client',
    }),
  })
}
export function isQl7SupportEntryGreetingMessageV11(message = {}) {
  const eventType = str(message?.supportEventType || message?.metadata?.supportEventType)
  const responseCode = str(message?.metadata?.responseCode)
  return eventType === 'entry_greeting' || message?.metadata?.entryGreeting === true || /^greeting(?:_|$)/iu.test(responseCode)
}
export const QL7_SUPPORT_ENTRY_GREETING_LOCALES_V11 = Object.freeze([...QL7_SUPPORT_ALL_LOCALES])


export function createQl7SupportIdleNudgeMessageV11({ userId = '', locale = 'en', entryNonce = '', anchorId = '', now = Date.now() } = {}) {
  const lang = normalizeQl7SupportEntryLocaleV11(locale)
  const bank = IDLE_BANK[lang] || IDLE_BANK.en
  const selected = bank[hashInt(`${userId}:${entryNonce}:${anchorId}:${now}`) % bank.length]
  const id = selected?.[0] || `${lang}-idle-01`
  const text = selected?.[1] || IDLE_BANK.en[0][1]
  const mutationId = `idle:${entryNonce || now}:${anchorId || 'latest'}`.slice(0, 160)
  return Object.freeze({
    id: `tmp_dm_ql7_idle_${hashInt(`${mutationId}:${id}`).toString(16)}`,
    from: 'ql7-support',
    fromCanonical: 'ql7-support',
    to: str(userId),
    toCanonical: str(userId),
    text,
    ts: Number(now) || Date.now(),
    status: 'delivered',
    isSystem: true,
    systemRole: 'ql7_support_system',
    supportThread: true,
    supportEventType: 'idle_nudge',
    clientMutationId: mutationId,
    correlationId: mutationId,
    metadata: Object.freeze({
      clientOnly: true,
      ephemeralSupportPrompt: true,
      idleNudge: true,
      entryNonce: str(entryNonce),
      anchorId: str(anchorId),
      responseCode: 'social_idle_nudge',
      idleVariantId: id,
    }),
  })
}

export function isQl7SupportEphemeralEntryMessageV11(message = {}) {
  return isQl7SupportEntryGreetingMessageV11(message) || message?.metadata?.ephemeralSupportPrompt === true || message?.metadata?.idleNudge === true
}
