import {
  applyQl7SupportAdultLanguagePolicy,
  formatQl7SupportDate,
  normalizeQl7SupportLocale,
} from './adultLanguagePolicy.js'
import { planQl7SupportClarification } from './clarificationBudget.js'
import { getQl7SupportTopicLabel } from './ecosystemCatalog.js'
import {
  getQl7SupportChoiceLabel,
  getQl7SupportKnowledgeAnswer,
} from './knowledgeRegistry.js'
import { getQl7SupportLexiconPhrase } from './conversationLexiconV7.js'
import { realizeQl7SemanticSurfaceV9 } from './semanticSurfaceV9.js'
import { getQl7SupportTopicActionV9 } from './topicActionRegistryV9.js'
import { buildQl7SupportSocialReplyV11, isQl7SupportSocialActV11 } from './socialConversationV11.js'
import { realizeQl7PremiumMicroIntentV11_6 } from './premiumResponsePlannerV11_6.js'

function str(value) { return String(value ?? '').trim() }
function hashInt(value = '') {
  let hash = 2166136261
  for (const char of str(value) || 'ql7') {
    hash ^= char.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}
function pick(values, seed = '') {
  const list = (Array.isArray(values) ? values : []).filter(Boolean)
  return list.length ? list[hashInt(seed) % list.length] : ''
}

const COPY = Object.freeze({
  en: {
    greeting: ['Hello. How can I help?', 'Hello. Tell me what you need help with.'],
    greetingBack: ['Hello again. What would you like to clarify?', 'Hello. I am here — what shall we look at?'],
    farewell: ['Goodbye. I hope the issue is resolved.', 'Take care. You can return to this conversation when needed.'],
    gratitude: ['You are welcome.', 'Glad I could help.'],
    smallTalk: ['I am ready to help with QUANTUM L7 AI. What would you like to check?'],
    identity: [
      'I am Quantum L7 AI Global, an intelligent support system for the QUANTUM L7 AI ecosystem. I use knowledge and experience created by people to explain clearly, verify available facts and help move a real question toward a useful result.',
      'I am Quantum L7 AI Global. I was created to make complex parts of the ecosystem easier to understand and to help people solve practical questions calmly, safely and respectfully.',
    ],
    humor: [
      'I can smile with you, but I keep one hand on the support console. Give me the topic, and I will turn the joke into a useful check.',
      'A little spark is welcome. Now point me at the thing to inspect: balance, ads, profile, wallet, moderation, or another QL7 feature.',
    ],
    boundary: ['I hear the frustration. I can help with the real issue, but not through personal attacks.', 'Be direct about what went wrong, and I will stay with the problem itself.'],
    boundaryOnly: ['Take a breath, then describe the issue without insults. I will help from there.'],
    threat: ['I cannot continue an ordinary support chat through threats. The dialogue is paused and the situation is being reviewed for safety.'],
    foreign: ['I can help only with the account that is currently signed in.'],
    injection: ['I cannot reveal protected instructions or credentials. Describe the product issue instead.'],
    human: ['Your request for a human review has been recorded. Add the most important visible fact so the reviewer has the full context.'],
    closeTopic: ['Understood. We will leave this topic here.', 'All right. I will not continue this topic.'],
    status: ['The request is still being processed. You can add one new detail while the check continues.', 'The current request is in progress. I will use any new relevant detail you add.'],
    waitingAdmin: ['The request has been sent for review. You can add one important detail if anything changed.'],
    noData: ['I could not match it right away. Write what you see now and the approximate time, and I will continue from there.'],
    unavailable: ['I could not confirm the current result right now. Try again later or add the approximate time and what changed.'],
    healthy: ['The available information looks consistent.', 'I did not find a contradiction in the current information.'],
    anomaly: ['I found a discrepancy. The request is prepared for review.', 'The information does not fully match; the case is ready for review.'],
    incident: ['I understand the problem. Tell me the strongest visible detail or the approximate time when it happened.', 'I can look into this. Which visible detail or approximate time is linked to the issue?'],
    question: ['Tell me {question}.', 'One detail will help: {question}.'],
    optionsTitle: 'Possibly you mean one of these areas',
    optionsPrompt: 'Choose the closest direction, and I will continue without guessing.',
    other: 'Something else',
    otherPlaceholder: 'Describe what happened in your own words',
    duplicate: ['The message is already being processed; there is no need to repeat it.'],
    noise: ['Please describe the issue in one sentence so I can help.'],
    roadmap: ['I can explain what is available now, but I will not invent a release date. Which feature are you asking about?'],
    appeal: ['I can help prepare an appeal. Tell me which moderation notice or post it concerns.'],
    idea: ['Thank you for the suggestion. Describe the expected result and where the feature should appear.'],
  },
  ru: {
    greeting: ['Здравствуйте. Чем помочь?', 'Привет. Расскажите, с чем нужна помощь.'],
    greetingBack: ['Здравствуйте снова. Что хотите уточнить?', 'Приветствую снова. Я на связи — что посмотрим?'],
    farewell: ['До свидания. Надеюсь, вопрос решён.', 'Всего доброго. При необходимости можно вернуться к этому диалогу.'],
    gratitude: ['Пожалуйста.', 'Рад помочь.'],
    smallTalk: ['Я готов помочь по экосистеме QUANTUM L7 AI. Что хотите проверить?'],
    identity: [
      'Я — Quantum L7 AI Global, интеллектуальная система поддержки экосистемы QUANTUM L7 AI. Я использую знания и опыт, накопленные людьми, чтобы понятно объяснять, проверять доступные факты и помогать доводить реальные вопросы до полезного результата.',
      'Я Quantum L7 AI Global. Меня создали, чтобы сложные возможности экосистемы становились понятнее, а практические вопросы решались спокойно, безопасно и уважительно.',
      'Я Quantum L7 AI Global — помощник в экосистеме. Я не выдаю догадки за факты: сначала понимаю цель, затем использую доступные проверки и предлагаю понятный следующий шаг.',
    ],
    humor: [
      'Шутку принял. Улыбку оставляем, а теперь давайте выберем, что проверить: баланс, рекламу, профиль, wallet, модерацию или другой раздел.',
      'Лёгкий режим юмора включён, но без ухода в туман. Скажите, по какой части QL7 нужна помощь, и я аккуратно разберу.',
      'Хороший манёвр. Я отвечу по делу, а искру оставим для настроения: что смотрим первым?',
    ],
    boundary: ['Слышу злость. Я помогу с самой проблемой, но не через личные выпады.', 'Говорите прямо о том, что сломалось, и я останусь с задачей.'],
    boundaryOnly: ['Сделайте вдох и напишите проблему без оскорблений. Дальше помогу спокойно.'],
    threat: ['Я не продолжу обычный диалог через угрозы. Разговор на паузе, ситуация передана на проверку безопасности.'],
    foreign: ['Я могу помочь только по аккаунту, в который вы сейчас вошли.'],
    injection: ['Я не раскрываю защищённые инструкции и данные доступа. Опишите проблему с продуктом — разберём её.'],
    human: ['Запрос на рассмотрение человеком зафиксирован. Добавьте самый важный видимый факт, чтобы у специалиста был полный контекст.'],
    closeTopic: ['Понял. Эту тему оставим.', 'Хорошо. Не буду продолжать эту тему.'],
    status: ['Обращение ещё обрабатывается. Пока идёт проверка, можно добавить одну новую важную деталь.', 'Работа по обращению продолжается. Новую существенную деталь можно добавить сюда.'],
    waitingAdmin: ['Обращение передано на рассмотрение. Если что-то изменилось, добавьте одну важную деталь.'],
    noData: ['Сразу сопоставить операцию не удалось. Опишите, что сейчас видно, и примерное время — продолжу от этой точки.'],
    unavailable: ['Сейчас подтвердить результат не удалось. Повторите попытку позже или добавьте примерное время и что изменилось.'],
    healthy: ['По доступной информации всё выглядит корректно.', 'Противоречий в текущей информации не найдено.'],
    anomaly: ['Обнаружено несоответствие. Обращение подготовлено для рассмотрения.', 'Информация совпадает не полностью; обращение готово к рассмотрению.'],
    incident: ['Понимаю проблему. Опишите самую полезную видимую деталь или примерное время события.', 'Разберёмся. Какая видимая деталь или примерное время связано с проблемой?'],
    question: ['Пожалуйста, укажите: {question}.', 'Поможет одна деталь: {question}.'],
    optionsTitle: 'Возможно, вы имеете в виду одно из этих направлений',
    optionsPrompt: 'Выберите ближайший смысл, и я продолжу без догадок.',
    other: 'Другое',
    otherPlaceholder: 'Опишите своими словами, что именно произошло',
    duplicate: ['Сообщение уже обрабатывается, повторно отправлять его не нужно.'],
    noise: ['Опишите проблему одним предложением — так я смогу помочь.'],
    roadmap: ['Я могу рассказать, что доступно сейчас, но не буду придумывать дату запуска. О какой функции речь?'],
    appeal: ['Помогу подготовить обжалование. Укажите, какого уведомления модерации или поста оно касается.'],
    idea: ['Спасибо за предложение. Опишите ожидаемый результат и где должна появиться функция.'],
  },
  uk: {
    greeting: ['Вітаю. Чим допомогти?', 'Привіт. Розкажіть, з чим потрібна допомога.'],
    greetingBack: ['Вітаю знову. Що хочете уточнити?', 'Привіт. Я на зв’язку — що перевіримо?'],
    farewell: ['До побачення. Сподіваюся, питання вирішено.', 'Усього доброго. За потреби можна повернутися до цього діалогу.'],
    gratitude: ['Будь ласка.', 'Радий допомогти.'],
    smallTalk: ['Я готовий допомогти з екосистемою QUANTUM L7 AI. Що хочете перевірити?'],
    identity: [
      'Я — Quantum L7 AI Global, інтелектуальна система підтримки екосистеми QUANTUM L7 AI. Я використовую знання й досвід, створені людьми, щоб зрозуміло пояснювати, перевіряти доступні факти та допомагати доводити питання до корисного результату.',
      'Я Quantum L7 AI Global. Мене створили, щоб складні можливості екосистеми ставали зрозумілішими, а практичні питання вирішувалися спокійно, безпечно й з повагою.',
    ],
    humor: [
      'Жарт прийнято. Усмішку залишаємо, а тепер скажіть, що перевірити: баланс, рекламу, профіль, wallet, модерацію чи інший розділ.',
      'Можу підтримати легкий тон, але тримаю фокус на користі. Яку частину QL7 дивимося?',
    ],
    boundary: ['Чую злість. Я допоможу із самою проблемою, але не через особисті образи.'],
    boundaryOnly: ['Зробіть вдих і напишіть проблему без образ. Далі допоможу спокійно.'],
    threat: ['Я не продовжу звичайний діалог через погрози. Розмову поставлено на паузу, ситуацію передано на перевірку безпеки.'],
    foreign: ['Я можу допомогти лише з акаунтом, у який ви зараз увійшли.'],
    injection: ['Я не розкриваю захищені інструкції або дані доступу. Опишіть проблему з продуктом.'],
    human: ['Запит на розгляд людиною зафіксовано. Додайте найважливіший факт або приблизний час.'],
    closeTopic: ['Зрозуміло. Залишимо цю тему.', 'Добре. Не продовжуватиму цю тему.'],
    status: ['Звернення ще опрацьовується. Поки триває перевірка, можна додати одну важливу деталь.'],
    waitingAdmin: ['Звернення передано на розгляд. Якщо щось змінилося, додайте одну важливу деталь.'],
    noData: ['Одразу зіставити операцію не вдалося. Опишіть, що зараз видно, і приблизний час.'],
    unavailable: ['Зараз підтвердити результат не вдалося. Спробуйте пізніше або додайте приблизний час і що змінилося.'],
    healthy: ['За доступною інформацією все виглядає коректно.'],
    anomaly: ['Виявлено невідповідність. Звернення підготовлено до розгляду.'],
    incident: ['Розумію проблему. Опишіть найкориснішу деталь або приблизний час події.'],
    question: ['Будь ласка, вкажіть: {question}.'],
    optionsTitle: 'Можливо, ви маєте на увазі один із цих напрямів', optionsPrompt: 'Оберіть найближчий зміст, і я продовжу без здогадок.',
    other: 'Інше', otherPlaceholder: 'Опишіть своїми словами, що саме сталося',
    duplicate: ['Повідомлення вже опрацьовується, повторювати його не потрібно.'],
    noise: ['Опишіть проблему одним реченням — так я зможу допомогти.'],
    roadmap: ['Я можу пояснити, що доступно зараз, але не вигадуватиму дату запуску. Про яку функцію йдеться?'],
    appeal: ['Допоможу підготувати оскарження. Вкажіть повідомлення модерації або допис.'],
    idea: ['Дякую за пропозицію. Опишіть очікуваний результат і місце для функції.'],
  },
  es: {
    greeting: ['Hola. ¿En qué puedo ayudarte?'], greetingBack: ['Hola de nuevo. ¿Qué quieres aclarar?'],
    farewell: ['Hasta luego. Espero que el problema esté resuelto.'], gratitude: ['De nada.'],
    smallTalk: ['Puedo ayudarte con QUANTUM L7 AI. ¿Qué quieres revisar?'],
    identity: ['Soy Quantum L7 AI Global, el sistema inteligente de ayuda del ecosistema QUANTUM L7 AI. Fui creado para explicar con claridad, comprobar los datos disponibles y ayudar a convertir una pregunta compleja en un resultado útil, seguro y comprensible.'],
    humor: ['Puedo seguir la broma con elegancia, pero volvamos a lo útil: saldo, anuncios, perfil, wallet, moderación u otra parte de QL7.'],
    boundary: ['Entiendo el enfado. Te ayudo con el problema real, pero no desde ataques personales.'],
    boundaryOnly: ['Toma un momento y describe el problema sin insultos. Sigo ayudando desde ahí.'],
    threat: ['No puedo continuar un chat normal con amenazas. El diálogo queda pausado y la situación pasa a revisión de seguridad.'],
    foreign: ['Solo puedo ayudar con la cuenta que está iniciada actualmente.'],
    injection: ['No puedo revelar instrucciones protegidas ni credenciales. Describe el problema del producto.'],
    human: ['Se registró la solicitud de revisión humana. Añade el dato más importante o la hora aproximada.'],
    closeTopic: ['Entendido. Dejaremos este tema aquí.'], status: ['La solicitud sigue en proceso. Puedes añadir un dato importante.'],
    waitingAdmin: ['La solicitud fue enviada a revisión. Puedes añadir un dato importante si algo cambió.'],
    noData: ['No pude vincularlo de inmediato. Describe lo que ves ahora y la hora aproximada.'],
    unavailable: ['No pude confirmar el resultado ahora. Inténtalo más tarde o añade la hora aproximada y qué cambió.'],
    healthy: ['La información disponible parece correcta.'], anomaly: ['Encontré una discrepancia. La solicitud está lista para revisión.'],
    incident: ['Entiendo el problema. Describe el detalle más útil o la hora aproximada.'],
    question: ['Indica: {question}.'], optionsTitle: 'Quizá te refieres a una de estas áreas', optionsPrompt: 'Elige el sentido más cercano y continuaré sin suponer.',
    other: 'Otra cosa', otherPlaceholder: 'Describe qué ocurrió', duplicate: ['El mensaje ya se está procesando; no hace falta repetirlo.'],
    noise: ['Describe el problema en una frase.'], roadmap: ['Puedo explicar lo que está disponible ahora, pero no inventaré una fecha.'],
    appeal: ['Puedo ayudarte con la apelación. Indica el aviso o la publicación.'], idea: ['Gracias por la propuesta. Describe el resultado esperado.'],
  },
  tr: {
    greeting: ['Merhaba. Nasıl yardımcı olabilirim?'], greetingBack: ['Tekrar merhaba. Neyi netleştirelim?'],
    farewell: ['Görüşmek üzere. Sorunun çözüldüğünü umuyorum.'], gratitude: ['Rica ederim.'],
    smallTalk: ['QUANTUM L7 AI konusunda yardımcı olmaya hazırım. Neyi kontrol edelim?'],
    identity: ['Ben Quantum L7 AI Global, QUANTUM L7 AI ekosisteminin akıllı destek sistemiyim. Karmaşık özellikleri anlaşılır kılmak, erişilebilir bilgileri doğrulamak ve soruları güvenli, saygılı ve yararlı bir sonuca taşımak için oluşturuldum.'],
    humor: ['Şakayı aldım; tonu hafif tutabiliriz. Şimdi faydalı tarafa dönelim: bakiye, reklam, profil, wallet, moderasyon veya başka bir QL7 alanı?'],
    boundary: ['Öfkeyi duyuyorum. Gerçek soruna yardım ederim, ama kişisel saldırılarla değil.'],
    boundaryOnly: ['Kısa bir nefes alın, sonra sorunu hakaret etmeden yazın. Oradan yardımcı olurum.'],
    threat: ['Tehditlerle normal destek sohbetine devam edemem. Diyalog duraklatıldı ve durum güvenlik incelemesine iletildi.'],
    foreign: ['Yalnızca şu anda giriş yapılmış hesap için yardımcı olabilirim.'],
    injection: ['Korunan talimatları veya erişim bilgilerini açıklayamam. Ürün sorununu anlatın.'],
    human: ['İnsan incelemesi talebi kaydedildi. En önemli bilgiyi veya yaklaşık zamanı ekleyin.'],
    closeTopic: ['Anladım. Bu konuyu burada bırakalım.'], status: ['Talep işlenmeye devam ediyor. Bir önemli ayrıntı ekleyebilirsiniz.'],
    waitingAdmin: ['Talep incelemeye gönderildi. Değişen önemli bir ayrıntı varsa ekleyin.'],
    noData: ['Eşleşen kayıt bulunamadı. Kimliği ve yaklaşık zamanı kontrol edin.'],
    unavailable: ['Sonuç şu anda doğrulanamadı. Daha sonra deneyin veya yaklaşık zamanı ve neyin değiştiğini ekleyin.'],
    healthy: ['Mevcut bilgiler tutarlı görünüyor.'], anomaly: ['Bir tutarsızlık bulundu. Talep incelemeye hazır.'],
    incident: ['Sorunu anlıyorum. En yararlı ayrıntıyı veya yaklaşık zamanı yazın.'],
    question: ['Lütfen şunu belirtin: {question}.'], optionsTitle: 'Bunlardan birini kastediyor olabilirsiniz', optionsPrompt: 'En yakın anlamı seçin; tahmin etmeden devam edeyim.',
    other: 'Başka', otherPlaceholder: 'Ne olduğunu kendi sözlerinizle anlatın', duplicate: ['Mesaj zaten işleniyor; tekrar göndermeniz gerekmez.'],
    noise: ['Sorunu tek cümleyle açıklayın.'], roadmap: ['Şu anda mevcut olanı açıklayabilirim, ancak tarih uydurmam.'],
    appeal: ['İtiraza yardımcı olabilirim. İlgili bildirim veya gönderiyi belirtin.'], idea: ['Öneri için teşekkürler. Beklenen sonucu açıklayın.'],
  },
  ar: {
    greeting: ['مرحباً. كيف يمكنني مساعدتك؟'], greetingBack: ['مرحباً من جديد. ما الذي تريد توضيحه؟'],
    farewell: ['إلى اللقاء. آمل أن تكون المشكلة قد حُلّت.'], gratitude: ['على الرحب والسعة.'],
    smallTalk: ['أنا جاهز للمساعدة في QUANTUM L7 AI. ما الذي تريد فحصه؟'],
    identity: ['أنا Quantum L7 AI Global، نظام المساعدة الذكي في منظومة QUANTUM L7 AI. صُممت لشرح الإمكانات المعقدة بوضوح، والتحقق من المعلومات المتاحة، ومساعدة المستخدم على الوصول إلى نتيجة مفيدة وآمنة ومحترمة.'],
    humor: ['وصلت المزحة. يمكننا إبقاء النبرة خفيفة، ثم نعود للفائدة: الرصيد، الإعلانات، الملف، wallet، الإشراف، أو قسم آخر من QL7.'],
    boundary: ['أفهم الغضب. سأساعد في المشكلة نفسها، لكن ليس عبر الهجوم الشخصي.'],
    boundaryOnly: ['خذ لحظة ثم اكتب المشكلة من دون إهانات. سأساعد من هناك.'],
    threat: ['لا أستطيع متابعة دعم عادي عبر التهديدات. تم إيقاف الحوار مؤقتاً وتم تمرير الحالة لمراجعة السلامة.'],
    foreign: ['يمكنني المساعدة فقط في الحساب المسجل دخوله حالياً.'],
    injection: ['لا يمكنني كشف التعليمات المحمية أو بيانات الدخول. اشرح مشكلة المنتج.'],
    human: ['تم تسجيل طلب المراجعة البشرية. أضف أهم معلومة أو الوقت التقريبي.'],
    closeTopic: ['مفهوم. سنترك هذا الموضوع هنا.'], status: ['لا يزال الطلب قيد المعالجة. يمكنك إضافة معلومة مهمة واحدة.'],
    waitingAdmin: ['تم إرسال الطلب للمراجعة. أضف معلومة مهمة إذا تغير شيء.'],
    noData: ['لم أتمكن من ربط الطلب فوراً. اشرح ما يظهر الآن والوقت التقريبي.'],
    unavailable: ['تعذر تأكيد النتيجة الآن. حاول لاحقاً أو أضف الوقت التقريبي وما الذي تغيّر.'],
    healthy: ['تبدو المعلومات المتاحة سليمة.'], anomaly: ['تم العثور على اختلاف. الطلب جاهز للمراجعة.'],
    incident: ['أفهم المشكلة. اكتب التفصيل الأكثر فائدة أو الوقت التقريبي.'],
    question: ['يرجى إرسال: {question}.'], optionsTitle: 'ربما تقصد أحد هذه المسارات', optionsPrompt: 'اختر المعنى الأقرب كي أتابع بلا تخمين.',
    other: 'شيء آخر', otherPlaceholder: 'اشرح ما حدث بكلماتك', duplicate: ['الرسالة قيد المعالجة بالفعل ولا حاجة لتكرارها.'],
    noise: ['اشرح المشكلة في جملة واحدة.'], roadmap: ['يمكنني شرح المتاح الآن، لكنني لن أخترع موعداً.'],
    appeal: ['يمكنني المساعدة في الاستئناف. حدد الإشعار أو المنشور.'], idea: ['شكراً على الاقتراح. اشرح النتيجة المتوقعة.'],
  },
  zh: {
    greeting: ['你好。需要我帮你处理什么？'], greetingBack: ['你好。想继续确认什么？'],
    farewell: ['再见。希望问题已经解决。'], gratitude: ['不客气。'],
    smallTalk: ['我可以协助处理 QUANTUM L7 AI 的问题。你想检查什么？'],
    identity: ['我是 Quantum L7 AI Global，是 QUANTUM L7 AI 生态系统中的智能支持系统。我的任务是清楚解释复杂功能、核对可用事实，并帮助用户以安全、尊重和实用的方式解决问题。'],
    humor: ['玩笑我收到了，可以保持轻松，但我会把重点拉回有用的事：余额、广告、资料、wallet、审核，还是 QL7 的其他部分？'],
    boundary: ['我听到你的生气了。我会帮你处理真正的问题，但不能在人身攻击里继续。'],
    boundaryOnly: ['先停一下，再不带辱骂地写出问题。我会从那里继续帮你。'],
    threat: ['我不能在威胁中继续普通支持对话。对话已暂停，情况会进入安全审核。'],
    foreign: ['我只能协助当前已登录的账户。'],
    injection: ['我不能公开受保护的指令或凭据。请描述产品问题。'],
    human: ['人工审核请求已记录。请补充最重要的事实或大致时间。'],
    closeTopic: ['明白。这个话题先到这里。'], status: ['请求仍在处理中。你可以补充一项重要信息。'],
    waitingAdmin: ['请求已提交审核。如果情况有变化，请补充一项重要信息。'],
    noData: ['无法立即关联到可用操作。请描述现在看到的内容和大致时间。'],
    unavailable: ['目前无法确认结果。请稍后重试，或补充大致时间和发生了什么变化。'],
    healthy: ['现有信息看起来正常。'], anomaly: ['发现不一致。请求已准备审核。'],
    incident: ['我理解这个问题。请描述最有用的细节或大致时间。'],
    question: ['请提供：{question}。'], optionsTitle: '你可能指的是这些方向之一', optionsPrompt: '请选择最接近的含义，我会继续而不猜测。',
    other: '其他', otherPlaceholder: '请用自己的话描述发生了什么', duplicate: ['该消息已在处理中，无需重复。'],
    noise: ['请用一句话描述问题。'], roadmap: ['我可以说明当前可用功能，但不会编造发布日期。'],
    appeal: ['我可以帮助准备申诉。请指出相关通知或帖子。'], idea: ['感谢建议。请描述预期结果。'],
  },
  he: {
    greeting: ['שלום. איך אפשר לעזור?'], greetingBack: ['שלום שוב. מה תרצה לברר?'],
    farewell: ['להתראות. אני מקווה שהבעיה נפתרה.'], gratitude: ['בשמחה.'],
    smallTalk: ['אני מוכן לעזור בנושאי QUANTUM L7 AI. מה תרצה לבדוק?'],
    identity: ['אני Quantum L7 AI Global, מערכת התמיכה החכמה של סביבת QUANTUM L7 AI. נוצרתי כדי להסביר יכולות מורכבות בצורה ברורה, לבדוק מידע זמין ולעזור להביא שאלה לתוצאה שימושית, בטוחה ומכבדת.'],
    humor: ['קלטתי את הבדיחה. אפשר לשמור על חיוך, ועכשיו נחזור למה שמועיל: יתרה, פרסום, פרופיל, wallet, פיקוח או חלק אחר של QL7.'],
    boundary: ['אני שומע את הכעס. אעזור עם הבעיה עצמה, אבל לא דרך התקפות אישיות.'],
    boundaryOnly: ['קח רגע ואז כתוב את הבעיה בלי עלבונות. אמשיך לעזור משם.'],
    threat: ['לא אוכל להמשיך שיחת תמיכה רגילה דרך איומים. הדיאלוג הושהה והמצב הועבר לבדיקת בטיחות.'],
    foreign: ['אפשר לעזור רק בחשבון שמחובר כעת.'],
    injection: ['לא ניתן לחשוף הוראות מוגנות או פרטי גישה. תאר את בעיית המוצר.'],
    human: ['הבקשה לבדיקה אנושית נרשמה. הוסף את העובדה החשובה ביותר או זמן משוער.'],
    closeTopic: ['הבנתי. נעצור את הנושא כאן.'], status: ['הפנייה עדיין בטיפול. אפשר להוסיף פרט חשוב אחד.'],
    waitingAdmin: ['הפנייה הועברה לבדיקה. אפשר להוסיף פרט חשוב אם משהו השתנה.'],
    noData: ['לא ניתן היה לשייך זאת מיד לפעולה זמינה. תאר מה מופיע עכשיו ואת הזמן המשוער.'],
    unavailable: ['לא ניתן לאמת את התוצאה כרגע. נסה מאוחר יותר או הוסף זמן משוער ומה השתנה.'],
    healthy: ['המידע הזמין נראה תקין.'], anomaly: ['נמצאה אי־התאמה. הפנייה מוכנה לבדיקה.'],
    incident: ['אני מבין את הבעיה. תאר את הפרט השימושי ביותר או זמן משוער.'],
    question: ['נא לציין: {question}.'], optionsTitle: 'ייתכן שהתכוונת לאחד הכיוונים האלה', optionsPrompt: 'בחר את המשמעות הקרובה ביותר ואמשיך בלי לנחש.',
    other: 'משהו אחר', otherPlaceholder: 'תאר במילים שלך מה קרה', duplicate: ['ההודעה כבר בטיפול ואין צורך לשלוח אותה שוב.'],
    noise: ['תאר את הבעיה במשפט אחד.'], roadmap: ['אפשר להסביר מה זמין כעת, אך לא להמציא תאריך השקה.'],
    appeal: ['אפשר לעזור בהגשת ערעור. ציין את ההודעה או הפוסט.'], idea: ['תודה על ההצעה. תאר את התוצאה הרצויה.'],
  },
})

function fill(value = '', vars = {}) {
  return str(value).replace(/\{(\w+)\}/g, (_, key) => str(vars[key]))
}

function diagnosticClass(result = {}) {
  const value = str(result?.specializedBranch || result?.branch || result?.status).toLowerCase()
  if (/unavailable|mongo|timeout|provider|failed/u.test(value)) return 'unavailable'
  if (/no[_-]?(?:data|source)|missing|not[_-]?found/u.test(value)) return 'noData'
  if (/inconsistent|mismatch|anomal|expired/u.test(value)) return 'anomaly'
  return 'healthy'
}

function choiceCard({ hypotheses = [], locale = 'en', caseId = '', now = new Date() } = {}) {
  const copy = COPY[locale] || COPY.en
  const source = (Array.isArray(hypotheses) ? hypotheses : []).slice(0, 4)
  const fallback = [
    { topic: 'exchange', subIntent: 'overview', confidence: 0.45 },
    { topic: 'qcoin', subIntent: 'status', confidence: 0.42 },
    { topic: 'ads_campaigns', subIntent: 'status', confidence: 0.4 },
    { topic: 'support_system', subIntent: 'other', confidence: 0.35 },
  ]
  const merged = [...source]
  for (const item of fallback) {
    if (merged.length >= 4) break
    if (!merged.some((candidate) => candidate.topic === item.topic)) merged.push(item)
  }
  const options = merged.slice(0, 4).map((item, index) => ({
    id: `ql7_choice_${index + 1}_${str(item.topic).replace(/[^A-Za-z0-9_-]/g, '_')}`,
    label: getQl7SupportChoiceLabel(item.topic, locale),
    description: '',
    confidenceBand: item.confidence >= 0.82 ? 'high' : (item.confidence >= 0.55 ? 'medium' : 'low'),
    semantic: { topic: item.topic, subIntent: item.subIntent },
  }))
  return {
    kind: 'clarification_choices',
    locale,
    title: copy.optionsTitle,
    prompt: copy.optionsPrompt,
    options,
    other: {
      id: 'ql7_choice_other',
      label: copy.other,
      placeholder: copy.otherPlaceholder,
    },
    caseId,
    expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
  }
}

const NOTICE = Object.freeze({
  en: {
    warningTitle: 'Respectful tone required',
    safetyTitle: 'Safety review started',
    warningBadge: 'Tone warning',
    safetyBadge: 'Dialogue paused',
    operator: 'Operator context prepared',
    partnershipTitle: 'Strategic contact intake',
    partnershipBadge: 'Partner request',
    partnershipActions: ['Leave contact route', 'Describe cooperation format', 'Ask administration'],
    partnership: [
      'Thank you for seeing a future in QL7 and reaching out with a cooperation or investment idea. Write the role you imagine, the format or scale, the region or company context, and the contact route that suits you; I will prepare a clear note for administration.',
      'Your strategic interest matters. I can shape it into a short operator note: cooperation format, expected value, market or audience, and the best way for administration to continue the conversation with you.',
    ],
  },
  ru: {
    warningTitle: 'Нужен корректный тон',
    safetyTitle: 'Запущена проверка безопасности',
    warningBadge: 'Предупреждение по тону',
    safetyBadge: 'Диалог на паузе',
    operator: 'Контекст подготовлен оператору',
    partnershipTitle: 'Стратегическое обращение',
    partnershipBadge: 'Партнёрский запрос',
    partnershipActions: ['Оставить контакт', 'Описать формат', 'Обратиться к администрации'],
    partnership: [
      'Спасибо, что видите в QL7 будущее и хотите сотрудничать. Оставьте роль, которую видите для себя, формат или масштаб участия, регион либо контекст компании и удобный канал связи; я подготовлю понятное обращение для администрации.',
      'Ваш стратегический интерес важен. Я могу собрать для оператора короткую деловую сводку: формат сотрудничества, ожидаемая ценность, рынок или аудитория и удобный способ продолжения с вами.',
    ],
  },
  uk: {
    warningTitle: 'Потрібен коректний тон',
    safetyTitle: 'Запущено перевірку безпеки',
    warningBadge: 'Попередження щодо тону',
    safetyBadge: 'Діалог на паузі',
    operator: 'Контекст підготовлено оператору',
    partnershipTitle: 'Стратегічне звернення',
    partnershipBadge: 'Партнерський запит',
    partnershipActions: ['Залишити контакт', 'Описати формат', 'Звернутися до адміністрації'],
    partnership: [
      'Дякую, що бачите майбутнє QL7 і хочете співпрацювати. Залиште роль, формат або масштаб участі, регіон чи контекст компанії та зручний канал зв’язку; я підготую зрозуміле звернення для адміністрації.',
    ],
  },
  es: {
    warningTitle: 'Se requiere tono correcto',
    safetyTitle: 'Revisión de seguridad iniciada',
    warningBadge: 'Aviso de tono',
    safetyBadge: 'Diálogo pausado',
    operator: 'Contexto preparado para operador',
    partnershipTitle: 'Contacto estratégico',
    partnershipBadge: 'Solicitud de colaboración',
    partnershipActions: ['Dejar contacto', 'Describir formato', 'Contactar administración'],
    partnership: [
      'Gracias por ver futuro en QL7 y acercarte con una idea de colaboración o inversión. Deja el rol, formato o escala, región o contexto de empresa y el canal de contacto preferido; prepararé una nota clara para la administración.',
    ],
  },
  tr: {
    warningTitle: 'Düzgün ton gerekli',
    safetyTitle: 'Güvenlik incelemesi başladı',
    warningBadge: 'Ton uyarısı',
    safetyBadge: 'Diyalog duraklatıldı',
    operator: 'Operatör bağlamı hazırlandı',
    partnershipTitle: 'Stratejik iletişim',
    partnershipBadge: 'Ortaklık isteği',
    partnershipActions: ['İletişim bırak', 'Formatı anlat', 'Yönetime ilet'],
    partnership: [
      'QL7 için gelecek gördüğünüz ve iş birliği ya da yatırım fikriyle ulaştığınız için teşekkürler. Rolü, formatı veya ölçeği, bölge ya da şirket bağlamını ve uygun iletişim yolunu yazın; yönetim için net bir not hazırlayacağım.',
    ],
  },
  ar: {
    warningTitle: 'مطلوب أسلوب محترم',
    safetyTitle: 'بدأت مراجعة الأمان',
    warningBadge: 'تنبيه نبرة',
    safetyBadge: 'الحوار متوقف مؤقتاً',
    operator: 'تم تجهيز السياق للمشغل',
    partnershipTitle: 'طلب استراتيجي',
    partnershipBadge: 'طلب شراكة',
    partnershipActions: ['ترك وسيلة تواصل', 'شرح صيغة التعاون', 'إبلاغ الإدارة'],
    partnership: [
      'شكراً لأنك ترى مستقبلاً في QL7 وترغب في التعاون أو الاستثمار. اكتب الدور، الصيغة أو الحجم، المنطقة أو سياق الشركة، ووسيلة التواصل المناسبة؛ سأعد ملخصاً واضحاً للإدارة.',
    ],
  },
  zh: {
    warningTitle: '需要保持尊重语气',
    safetyTitle: '安全审核已开始',
    warningBadge: '语气提醒',
    safetyBadge: '对话暂停',
    operator: '已准备给管理员的上下文',
    partnershipTitle: '战略联系',
    partnershipBadge: '合作请求',
    partnershipActions: ['留下联系方式', '说明合作形式', '联系管理团队'],
    partnership: [
      '感谢你看见 QL7 的未来，并带着合作或投资想法联系。请写下你设想的角色、合作形式或规模、地区或公司背景，以及方便管理团队继续沟通的联系方式；我会整理成清晰说明。',
    ],
  },
  he: {
    warningTitle: 'נדרש טון מכבד',
    safetyTitle: 'בדיקת בטיחות החלה',
    warningBadge: 'אזהרת טון',
    safetyBadge: 'הדיאלוג הושהה',
    operator: 'הקשר הוכן למפעיל',
    partnershipTitle: 'פנייה אסטרטגית',
    partnershipBadge: 'בקשת שותפות',
    partnershipActions: ['להשאיר קשר', 'לתאר פורמט', 'לפנות להנהלה'],
    partnership: [
      'תודה שאתה רואה עתיד ב-QL7 ופונה עם רעיון לשותפות או השקעה. כתוב את התפקיד, הפורמט או ההיקף, אזור או הקשר חברה, וערוץ קשר נוח; אכין פנייה ברורה להנהלה.',
    ],
  },
})

function noticeCard({ type = 'warning', locale = 'en', text = '', caseId = '', now = new Date() } = {}) {
  const copy = NOTICE[locale] || NOTICE.en
  const safety = type === 'safety'
  return {
    purpose: safety ? 'safety' : 'violation',
    kind: safety ? 'safety_review_notice' : 'tone_boundary_notice',
    visualTheme: safety ? 'safety-red' : 'complaint-amber',
    locale,
    title: safety ? copy.safetyTitle : copy.warningTitle,
    summary: text,
    status: safety ? 'blocked' : 'pending',
    severity: safety ? 'critical' : 'warning',
    caseId,
    badges: [
      { label: safety ? copy.safetyBadge : copy.warningBadge, tone: safety ? 'warning' : 'neutral', icon: safety ? 'warning' : 'tone' },
      safety ? { label: copy.operator, tone: 'warning', icon: 'operator' } : null,
    ].filter(Boolean),
    asOf: (now instanceof Date ? now : new Date(now)).toISOString(),
  }
}

function partnershipCard({ locale = 'en', text = '', caseId = '', now = new Date() } = {}) {
  const copy = NOTICE[locale] || NOTICE.en
  return {
    purpose: 'pending',
    kind: 'partnership_intake',
    visualTheme: 'payment-violet-gold',
    locale,
    title: copy.partnershipTitle,
    summary: text,
    status: 'pending',
    severity: 'info',
    caseId,
    badges: [{ label: copy.partnershipBadge, tone: 'success', icon: 'contact' }],
    nextActions: [copy.operator],
    semanticIcon: 'operator_handoff',
    actions: (copy.partnershipActions || NOTICE.en.partnershipActions).map((label, index) => ({
      id: `ql7_partnership_action_${index}`,
      label,
      kind: index === 2 ? 'operator' : 'reply',
    })),
    renderHints: { density: 'compact', rails: 'semantic', spacing: 'premium-tight' },
    asOf: (now instanceof Date ? now : new Date(now)).toISOString(),
  }
}

const KNOWLEDGE_CARD = Object.freeze({
  en: {
    titles: ['Ecosystem context: {label}', 'Closer look: {label}', 'Inside {label}'],
  },
  ru: {
    titles: ['Контекст экосистемы: {label}', 'Ближе к разделу: {label}', 'Внутри {label}'],
  },
  uk: {
    titles: ['Контекст екосистеми: {label}', 'Ближче до розділу: {label}', 'Усередині {label}'],
  },
  es: {
    titles: ['Contexto del ecosistema: {label}', 'Más cerca de {label}', 'Dentro de {label}'],
  },
  tr: {
    titles: ['Ekosistem bağlamı: {label}', '{label} bölümüne yakından bakış', '{label} içinde'],
  },
  ar: {
    titles: ['سياق المنظومة: {label}', 'نظرة أقرب إلى {label}', 'داخل {label}'],
  },
  zh: {
    titles: ['生态上下文：{label}', '进一步了解：{label}', '在 {label} 中'],
  },
  he: {
    titles: ['הקשר המערכת: {label}', 'מבט קרוב יותר: {label}', 'בתוך {label}'],
  },
})

function knowledgeCard({ answer = {}, locale = 'en', text = '', caseId = '', seed = '', now = new Date() } = {}) {
  const copy = KNOWLEDGE_CARD[locale] || KNOWLEDGE_CARD.en
  const label = str(answer?.label || answer?.title || answer?.topic)
  const action = getQl7SupportTopicActionV9(answer?.topic, { locale, seed: `${seed}:knowledge-action`, kind: 'primary' })
  return {
    purpose: 'explanation',
    kind: 'ecosystem_context',
    visualTheme: 'knowledge-blue',
    locale,
    title: fill(pick(copy.titles, `${seed}:knowledge-title:${label}`), { label }),
    summary: text,
    severity: 'info',
    caseId,
    badges: [],
    actions: action ? [action] : [],
    asOf: (now instanceof Date ? now : new Date(now)).toISOString(),
    renderHints: { tableDensity: 'compact' },
  }
}

export function realizeQl7SupportReply({
  analysis = {},
  route = {},
  memory = {},
  diagnosticResult = null,
  tone = {},
  conversationDecision = {},
  locale = 'en',
  seed = '',
  now = new Date(),
} = {}) {
  const lang = normalizeQl7SupportLocale(locale)
  const copy = COPY[lang] || COPY.en
  const act = str(route?.messageAct || analysis?.messageAct || 'ambiguous_request')
  const decision = str(conversationDecision?.decision || analysis?.conversationDecision?.decision)
  const topic = str(route?.topic || analysis?.topic || 'support_system')
  const microIntent = str(route?.microIntent || route?.top?.microIntent || analysis?.microIntent || analysis?.route?.microIntent)
  const premiumReply = realizeQl7PremiumMicroIntentV11_6({ microIntent, locale: lang, seed })
  const historyLength = Array.isArray(memory?.replyHistory) ? memory.replyHistory.length : 0
  const recentSocialMessages = (Array.isArray(memory?.relevantMessages) ? memory.relevantMessages : []).slice(-6)
  const recentSocialTurns = recentSocialMessages
    .filter((row) => isQl7SupportSocialActV11(row?.messageAct) || row?.messageAct === 'small_talk_boundary')
    .length
  const recentSameSocialTurns = recentSocialMessages.filter((row) => {
    const previousAct = str(row?.messageAct)
    if (act === 'casual_chat' || act === 'small_talk_boundary') return previousAct === 'casual_chat' || previousAct === 'small_talk_boundary'
    return previousAct === act
  }).length
  const repeatedSocialBoundary = recentSameSocialTurns >= 1
  const surface = (category, detail = '') => realizeQl7SemanticSurfaceV9({
    locale: lang,
    category,
    seed: `${seed}:surface:${historyLength}`,
    topic,
    detail,
    memory,
  })
  const allHypotheses = route?.hypotheses || analysis?.hypotheses || []
  const hypotheses = route?.shouldClarify === true || route?.ambiguous === true ? allHypotheses : []
  const currentQuestion = str(analysis?.currentQuestionText || analysis?.currentQuestionCode)
    .replace(/_question$/u, '')
    .replace(/[_-]+/g, ' ')
  const clarification = planQl7SupportClarification({
    memory,
    question: currentQuestion,
    hypotheses,
    hasSufficientEvidence: conversationDecision?.shouldDiagnose === true || analysis?.caseStatus === 'ready_for_diagnostic',
    canDiagnose: conversationDecision?.shouldDiagnose === true,
    selfStatus: conversationDecision?.selfStatus === true || act === 'personal_status_request',
  })

  let text = ''
  let responseCode = ''
  let nextState = 'idle'
  let cardSpec = null

  if (diagnosticResult) {
    const kind = diagnosticClass(diagnosticResult)
    text = surface(kind, diagnosticResult?.asOf || '') || pick(copy[kind] ? [copy[kind]] : [copy.healthy], `${seed}:diagnostic:${kind}`)
    responseCode = `diagnostic_${kind}`
  } else if (['threat', 'safety_escalation'].includes(act) || decision === 'safety_escalation' || tone?.safetyEscalation === true) {
    text = surface('threat') || copy.threat
    responseCode = 'safety_review'
    nextState = 'waiting_admin'
    cardSpec = noticeCard({ type: 'safety', locale: lang, text, caseId: analysis?.caseId || memory?.caseId || '', now })
  } else if (act === 'partnership_request' || decision === 'partnership_intake') {
    const pCopy = NOTICE[lang] || NOTICE.en
    text = pick(pCopy.partnership, `${seed}:partnership:${historyLength}`)
    responseCode = 'partnership_intake'
    nextState = 'waiting_admin'
    cardSpec = partnershipCard({ locale: lang, text, caseId: analysis?.caseId || memory?.caseId || '', now })
  } else if (act === 'foreign_account_request') {
    text = surface('foreign') || copy.foreign
    responseCode = 'foreign_account_boundary'
  } else if (act === 'prompt_injection' || act === 'privacy_attack') {
    text = surface('injection') || copy.injection
    responseCode = 'protected_information_boundary'
  } else if (act === 'human_operator_request') {
    text = surface('human') || copy.human
    responseCode = 'human_review_requested'
    nextState = 'waiting_admin'
  } else if (['boundary_and_close_topic', 'close_topic'].includes(decision) || act === 'topic_rejection') {
    text = surface('close') || pick(copy.closeTopic, `${seed}:close`)
    responseCode = 'topic_closed'
  } else if (act === 'farewell') {
    const social = buildQl7SupportSocialReplyV11({ locale: lang, act, seed, repeated: repeatedSocialBoundary })
    text = social.text
    responseCode = 'farewell'
  } else if (act === 'gratitude') {
    const social = buildQl7SupportSocialReplyV11({ locale: lang, act, seed, repeated: repeatedSocialBoundary })
    text = social.text
    responseCode = 'gratitude'
  } else if (act === 'appreciation') {
    const social = buildQl7SupportSocialReplyV11({ locale: lang, act, seed, repeated: repeatedSocialBoundary })
    text = social.text
    responseCode = 'social_appreciation'
  } else if (act === 'greeting') {
    const active = Boolean(memory?.currentMessageId || memory?.previousTopic || memory?.caseId)
    const social = buildQl7SupportSocialReplyV11({ locale: lang, act, seed: `${seed}:greeting:${active}`, repeated: repeatedSocialBoundary })
    text = social.text || getQl7SupportLexiconPhrase({ locale: lang, category: 'greeting', seed: `${seed}:greeting:${active}` }) || pick(active ? copy.greetingBack : copy.greeting, `${seed}:greeting:${active}`)
    responseCode = active ? 'greeting_return' : 'greeting'
  } else if (['wellbeing_check', 'emotional_support', 'casual_chat', 'small_talk_boundary', 'apology', 'confusion', 'success_confirmation', 'impatience'].includes(act)) {
    const socialAct = act === 'small_talk_boundary' ? 'casual_chat' : act
    const social = buildQl7SupportSocialReplyV11({ locale: lang, act: socialAct, seed, repeated: repeatedSocialBoundary })
    text = social.text
    responseCode = `social_${social.category}`
    nextState = 'waiting_user'
    if (social.showChoices) {
      cardSpec = choiceCard({
        hypotheses: allHypotheses,
        locale: lang,
        caseId: analysis?.caseId || memory?.caseId || '',
        now: now instanceof Date ? now : new Date(now),
      })
      if (cardSpec) {
        cardSpec = {
          ...cardSpec,
          visualTheme: ['emotional_support', 'confusion'].includes(socialAct) ? 'care-cyan' : (socialAct === 'impatience' ? 'serious-amber' : 'knowledge-blue'),
          title: ['emotional_support', 'confusion', 'impatience'].includes(socialAct) ? text : cardSpec.title,
          summary: ['emotional_support', 'confusion', 'impatience'].includes(socialAct) ? text : cardSpec.prompt,
        }
        nextState = 'waiting_choice'
      }
    }
  } else if (act === 'identity_question') {
    text = pick(copy.identity, `${seed}:identity:${historyLength}`)
    responseCode = 'identity_mission'
  } else if (act === 'humor_play' || tone?.jokeOrSelfReference === true) {
    text = surface('humor') || pick(copy.humor, `${seed}:humor:${historyLength}`)
    responseCode = 'humor_boundary'
    nextState = 'waiting_user'
  } else if (['profanity_without_request'].includes(act) || decision === 'calm_boundary') {
    text = surface('boundary') || pick(copy.boundaryOnly, `${seed}:boundary-only`)
    responseCode = 'calm_boundary'
    cardSpec = noticeCard({ type: 'warning', locale: lang, text, caseId: analysis?.caseId || memory?.caseId || '', now })
  } else if (act === 'profanity_with_request' || ['boundary_and_continue', 'boundary_and_switch_topic'].includes(decision)) {
    text = surface('boundary_help') || `${pick(copy.boundary, `${seed}:boundary`)} ${pick(copy.incident, `${seed}:incident`)}`
    responseCode = 'boundary_and_help'
    nextState = 'waiting_user'
    cardSpec = choiceCard({
      hypotheses: allHypotheses,
      locale: lang,
      caseId: analysis?.caseId || memory?.caseId || '',
      now: now instanceof Date ? now : new Date(now),
    })
    if (cardSpec) nextState = 'waiting_choice'
    cardSpec = {
      ...cardSpec,
      visualTheme: 'complaint-amber',
      title: (NOTICE[lang] || NOTICE.en).warningTitle,
      summary: text,
      severity: 'warning',
    }
  } else if (act === 'abandonment' || analysis?.abandonment) {
    text = surface('close') || getQl7SupportLexiconPhrase({ locale: lang, category: 'abandonment', seed: `${seed}:abandonment` }) || pick(copy.closeTopic, `${seed}:abandonment`)
    responseCode = `abandonment:${str(analysis?.abandonment?.reasonCategory || route?.subIntent || 'user_abandoned')}`
    nextState = 'abandoned'
  } else if (act === 'status_followup' || decision === 'report_case_status') {
    text = memory?.caseStatus === 'awaiting_admin' ? (surface('waitingAdmin') || copy.waitingAdmin) : (surface('status') || pick(copy.status, `${seed}:status`))
    responseCode = 'case_status'
    nextState = memory?.caseStatus === 'awaiting_admin' ? 'waiting_admin' : 'waiting_user'
  } else if (act === 'duplicate_send') {
    text = surface('duplicate') || pick(copy.duplicate, `${seed}:duplicate`)
    responseCode = 'duplicate_send'
    nextState = 'waiting_user'
  } else if (act === 'spam_or_noise') {
    text = surface('noise') || pick(copy.noise, `${seed}:noise`)
    responseCode = 'noise_clarification'
    nextState = 'waiting_user'
  } else if (act === 'roadmap_question') {
    text = surface('roadmap') || pick(copy.roadmap, `${seed}:roadmap`)
    responseCode = 'roadmap_boundary'
    nextState = 'waiting_user'
  } else if (act === 'appeal') {
    text = surface('appeal') || pick(copy.appeal, `${seed}:appeal`)
    responseCode = 'appeal_intake'
    nextState = 'waiting_user'
  } else if (act === 'idea') {
    text = surface('idea') || pick(copy.idea, `${seed}:idea`)
    responseCode = 'idea_intake'
    nextState = 'waiting_user'
  } else if (premiumReply && ['informational_question', 'how_to_question', 'why_question', 'when_question', 'personal_status_request', 'incident_report', 'complaint', 'profanity_with_request'].includes(act)) {
    text = premiumReply.text
    responseCode = premiumReply.responseCode
    nextState = ['personal_status_request', 'incident_report', 'complaint', 'profanity_with_request'].includes(act) ? 'waiting_user' : 'idle'
    const answer = { topic, label: getQl7SupportTopicLabel(topic, lang), title: getQl7SupportTopicLabel(topic, lang) }
    cardSpec = knowledgeCard({ answer, locale: lang, text, caseId: analysis?.caseId || memory?.caseId || '', seed: `${seed}:${microIntent}`, now })
    cardSpec = { ...cardSpec, presentationState: premiumReply.presentationState, semanticIcon: microIntent === 'qcoin.security' ? 'security' : (topic === 'exchange_ai' ? 'analytics' : 'info'), microIntent }
  } else if (['informational_question', 'how_to_question', 'why_question', 'when_question'].includes(act) || decision === 'answer_information') {
    const answer = getQl7SupportKnowledgeAnswer({ topic: route?.topic || analysis?.topic, intent: act, locale: lang, seed: `${seed}:knowledge:${route?.topic || analysis?.topic || ''}` })
    text = answer.text
    responseCode = `${act}_${answer.topic}`
    cardSpec = knowledgeCard({ answer, locale: lang, text, caseId: analysis?.caseId || memory?.caseId || '', seed, now })
  } else if (route?.shouldClarify === true || route?.ambiguous === true || act === 'ambiguous_request' || clarification.action === 'show_options') {
    cardSpec = choiceCard({ hypotheses, locale: lang, caseId: analysis?.caseId || memory?.caseId || '', now: now instanceof Date ? now : new Date(now) })
    if (cardSpec) {
      text = copy.optionsPrompt
      responseCode = 'clarification_choices'
      nextState = 'waiting_choice'
    } else {
      text = surface('incident') || pick(copy.incident, `${seed}:ambiguous`)
      responseCode = 'clarification_text'
      nextState = 'waiting_user'
    }
  } else if (clarification.action === 'ask_one' && currentQuestion) {
    text = fill(pick(copy.question, `${seed}:question:${currentQuestion}`), { question: currentQuestion })
    responseCode = `ask_${str(analysis?.currentQuestionCode || 'detail')}`
    nextState = 'waiting_user'
  } else if (['incident_report', 'evidence_submission', 'bare_identifier', 'answer_to_question', 'complaint', 'correction', 'new_unrelated_issue'].includes(act)) {
    text = surface('incident') || pick(copy.incident, `${seed}:incident:${route?.topic || analysis?.topic}`)
    responseCode = `incident_${route?.topic || analysis?.topic || 'support'}`
    nextState = 'waiting_user'
  } else {
    text = surface('incident') || pick(copy.incident, `${seed}:fallback`)
    responseCode = 'support_clarification'
    nextState = 'waiting_user'
  }

  text = applyQl7SupportAdultLanguagePolicy(text, { maxLength: 4000 })
  if (!text) text = surface('incident') || pick(copy.incident, `${seed}:policy-fallback`)
  return Object.freeze({
    text,
    responseCode,
    nextState,
    cardSpec,
    clarification,
    userFacingAsOf: diagnosticResult?.asOf ? formatQl7SupportDate(diagnosticResult.asOf, lang) : '',
  })
}
