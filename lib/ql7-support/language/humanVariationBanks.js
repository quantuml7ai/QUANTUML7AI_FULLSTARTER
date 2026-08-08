import { QL7_SUPPORT_ALL_LOCALES } from '../config/behaviorManifest.js'
import { QL7_SUPPORT_ECOSYSTEM_TOPICS, getQl7SupportTopicLabel } from '../ecosystemCatalog.js'
import { ql7Arr, ql7Locale, ql7NormalizeSpaces, ql7StableHash, ql7Str } from '../internal/text.js'

export const QL7_SUPPORT_HUMAN_VARIATION_VERSION = '15.3.1'

const CATEGORIES = Object.freeze([
  'emotional',
  'socialBoundary',
  'humor',
  'small',
  'businessCollectBrief',
  'businessCollectContact',
  'businessHandoffContacts',
  'businessHandoffDmOnly',
  'businessHandoffNoContacts',
  'boundary',
  'firmWarning',
  'strictWarning',
  'playfulBridge',
  'entryGreetingFresh',
  'entryGreetingContinue',
  'productHowToBridge',
  'dataTableIntro',
  'aiRecommendationReady',
  'aiQuotaExhausted',
  'qcoinIncident',
  'operatorContactProbe',
  'purchaseSuccess',
  'purchaseFailure',
  'unrecognizedInput',
  'ambiguousMaterialClarifier',
  'casualConversationBridge',
])

const RAW = Object.freeze({
  en: {
    hear: ['I hear you.', 'I am with you.', 'That sounds heavy.'],
    steady: ['Take one small safe step first.', 'Do not carry the whole thing at once.', 'Stay close to someone you trust if you can.'],
    bridge: ['Then we can choose the clean QL7 step.', 'I will separate feelings, facts and action.', 'We can keep this calm and useful.'],
    mission: ['I can support you briefly, but my talk mode is intentionally limited for ecosystem help.'],
    choice: ['Pick a direction below or describe another QL7 issue.'],
    joke: ['Tiny support joke: the cache promised freshness, so the logs asked for receipts.', 'A bug tried to become a feature; QA asked it to bring documents.', 'My safest joke: private keys never enter chat, even for comedy.', 'The server took a deep breath and still kept every process orderly.', 'A QCoin refresh walked in politely and left with verified data.'],
    business: ['I can turn this into a clear partnership request.', 'This looks like a business or cooperation approach.', 'Let us shape the commercial idea so an operator can act on it.'],
    detail: ['Add the goal, value, scale, timing and who answers from your side.'],
    contact: ['You may leave email, Telegram or phone, or choose DM only.'],
    ready: ['The core is clear enough for operator preparation.'],
    dm: ['If you do not want external contacts, the operator will answer in Quantum Messenger.'],
    handoff: ['The request has been formed and sent to the operator.'],
    thanks: ['Thank you for your trust and belief in Quantum L7 AI.', 'They will contact you soon.', 'Your contact details were attached only because you provided them.'],
    boundary: ['I will help, but let us continue without insults.', 'I can stay useful only if the conversation remains respectful.', 'Sharp emotions are understandable; direct insults still need to stop.'],
    firm: ['This is a firm boundary.', 'The next message must be calmer.', 'If insults continue, input will pause for safety.'],
    safety: ['Security review takes priority.', 'Threats and harassment cannot stay in ordinary chat.', 'The system will preserve the context for review.'],
    small: ['I am here. What should we sort out?', 'We can talk briefly, then focus on a QL7 task.', 'Tell me what changed and I will keep the context clean.'],
    playful: ['We can keep it light, as long as we keep it useful.', 'A smile is welcome; secrets and abuse stay outside the room.'],
  },
  ru: {
    hear: ['Я вас слышу.', 'Я рядом.', 'Похоже, вам сейчас правда тяжело.'],
    steady: ['Сначала выберите один маленький безопасный шаг.', 'Не нужно тянуть всю ситуацию сразу.', 'Если есть возможность, побудьте рядом с человеком, которому доверяете.'],
    bridge: ['Потом спокойно выберем точный шаг в QL7.', 'Я разделю эмоцию, факты и действие.', 'Сохраним разговор тёплым, но полезным.'],
    mission: ['Я могу коротко поддержать, но мои разговорные функции намеренно ограничены ради задач экосистемы.'],
    choice: ['Выберите направление ниже или опишите другой вопрос QL7.'],
    joke: ['Маленькая шутка поддержки: кэш пообещал свежесть, а логи попросили чек.', 'Баг пришёл в релиз как функция, но QA попросил документы.', 'Самая безопасная шутка: приватные ключи не заходят в чат даже ради юмора.', 'Сервер глубоко вдохнул и всё равно аккуратно держит процессы.', 'QCoin обновился, поздоровался и ушёл только с подтверждёнными данными.'],
    business: ['Я могу собрать это в понятное партнёрское обращение.', 'Похоже на бизнес-подход, сотрудничество или инвестиционный интерес.', 'Давайте оформим коммерческую суть так, чтобы оператор мог действовать.'],
    detail: ['Добавьте цель, ценность, масштаб, сроки и кто ответит с вашей стороны.'],
    contact: ['Можно оставить email, Telegram или телефон, либо выбрать только DM.'],
    ready: ['Суть уже достаточно ясна для подготовки оператору.'],
    dm: ['Если внешние контакты оставлять не хотите, оператор ответит в Quantum Messenger.'],
    handoff: ['Обращение сформировано и передано оператору.'],
    thanks: ['Спасибо за обращение, доверие и веру в перспективы Quantum L7 AI.', 'В ближайшее время с вами свяжутся.', 'Контакты приложены только потому, что вы их сами оставили.'],
    boundary: ['Я помогу, но продолжим без оскорблений.', 'Я могу быть полезным только в уважительном разговоре.', 'Сильные эмоции понятны, но прямые оскорбления нужно остановить.'],
    firm: ['Это строгая граница.', 'Следующее сообщение должно быть спокойнее.', 'Если оскорбления продолжатся, ввод будет временно остановлен.'],
    safety: ['Проверка безопасности сейчас важнее обычного диалога.', 'Угрозы и травля не остаются в обычном чате.', 'Система сохранит контекст для проверки.'],
    small: ['Я на связи. Что разберём?', 'Можем немного поговорить, а затем вернуться к задаче QL7.', 'Напишите, что изменилось, и я сохраню контекст чистым.'],
    playful: ['Можно с улыбкой, главное - чтобы было полезно.', 'Лёгкость приветствуется; секреты и грубость остаются за дверью.'],
  },
  uk: {
    hear: ['Я вас чую.', 'Я поруч.', 'Схоже, вам зараз справді важко.'],
    steady: ['Спершу оберіть один маленький безпечний крок.', 'Не потрібно нести все одразу.', 'Якщо можете, будьте поруч із людиною, якій довіряєте.'],
    bridge: ['Потім спокійно оберемо точний крок у QL7.', 'Я відокремлю емоцію, факти й дію.', 'Збережемо розмову теплою і корисною.'],
    mission: ['Я можу коротко підтримати, але розмовні функції навмисно обмежені для задач екосистеми.'],
    choice: ['Оберіть напрям нижче або опишіть інше питання QL7.'],
    joke: ['Маленький жарт підтримки: кеш пообіцяв свіжість, а логи попросили чек.', 'Баг прийшов у реліз як функція, але QA попросив документи.', 'Найбезпечніший жарт: приватні ключі не заходять у чат навіть заради гумору.', 'Сервер глибоко вдихнув і все одно тримає процеси рівно.', 'QCoin оновився чемно і приніс лише перевірені дані.'],
    business: ['Я можу оформити це як зрозуміле партнерське звернення.', 'Схоже на бізнес-підхід, співпрацю або інвестиційний інтерес.', 'Сформулюймо комерційну суть так, щоб оператор міг діяти.'],
    detail: ['Додайте мету, цінність, масштаб, строки і хто відповідає з вашого боку.'],
    contact: ['Можна залишити email, Telegram або телефон, або обрати лише DM.'],
    ready: ['Суть уже достатньо ясна для оператора.'],
    dm: ['Якщо зовнішні контакти не бажані, оператор відповість у Quantum Messenger.'],
    handoff: ['Звернення сформовано й передано оператору.'],
    thanks: ['Дякуємо за звернення, довіру і віру в перспективи Quantum L7 AI.', 'Найближчим часом з вами зв’яжуться.', 'Контакти додано лише тому, що ви їх залишили.'],
    boundary: ['Я допоможу, але продовжімо без образ.', 'Я корисний тільки в поважній розмові.', 'Сильні емоції зрозумілі, але прямі образи треба зупинити.'],
    firm: ['Це чітка межа.', 'Наступне повідомлення має бути спокійнішим.', 'Якщо образи триватимуть, введення тимчасово зупиниться.'],
    safety: ['Перевірка безпеки зараз важливіша за звичайний діалог.', 'Погрози й цькування не лишаються у звичайному чаті.', 'Система збере контекст для перевірки.'],
    small: ['Я на зв’язку. Що розберемо?', 'Можемо трохи поговорити, а потім перейти до задачі QL7.', 'Напишіть, що змінилося, і я збережу контекст чистим.'],
    playful: ['Можна з усмішкою, головне - щоб було корисно.', 'Легкість вітається; секрети й грубість лишаються осторонь.'],
  },
  es: {
    hear: ['Te escucho.', 'Estoy contigo.', 'Esto suena realmente pesado.'],
    steady: ['Elige primero un paso pequeño y seguro.', 'No cargues toda la situación de golpe.', 'Si puedes, mantente cerca de alguien de confianza.'],
    bridge: ['Después elegimos el paso limpio dentro de QL7.', 'Separaré emoción, hechos y acción.', 'Mantendremos esto cálido y útil.'],
    mission: ['Puedo apoyarte brevemente, pero mi modo conversacional está limitado para ayudar con el ecosistema.'],
    choice: ['Elige una dirección abajo o describe otro asunto QL7.'],
    joke: ['Chiste de soporte: la caché prometió frescura y los logs pidieron recibos.', 'Un bug llegó como función; QA pidió papeles.', 'La broma más segura: las claves privadas nunca entran al chat.', 'El servidor respiró hondo y ordenó todos sus procesos.', 'QCoin se actualizó con cortesía y trajo datos verificados.'],
    business: ['Puedo convertir esto en una solicitud clara de colaboración.', 'Esto parece una propuesta comercial, alianza o inversión.', 'Organicemos la idea para que un operador pueda actuar.'],
    detail: ['Añade objetivo, valor, escala, plazos y quién responde de tu lado.'],
    contact: ['Puedes dejar email, Telegram o teléfono, o elegir solo DM.'],
    ready: ['La esencia ya está lista para prepararla al operador.'],
    dm: ['Si no quieres contactos externos, el operador responderá por Quantum Messenger.'],
    handoff: ['La solicitud fue formada y enviada al operador.'],
    thanks: ['Gracias por tu confianza en Quantum L7 AI.', 'Te contactarán pronto.', 'Los contactos se adjuntaron solo porque los proporcionaste.'],
    boundary: ['Te ayudaré, pero continuemos sin insultos.', 'Solo puedo ser útil si la conversación sigue siendo respetuosa.', 'Entiendo la emoción, pero los insultos directos deben parar.'],
    firm: ['Este es un límite firme.', 'El próximo mensaje debe ser más calmado.', 'Si continúan los insultos, la entrada se pausará temporalmente.'],
    safety: ['La revisión de seguridad tiene prioridad.', 'Amenazas y acoso no quedan en el chat normal.', 'El sistema conservará el contexto para revisión.'],
    small: ['Estoy aquí. ¿Qué revisamos?', 'Podemos hablar un poco y luego volver a una tarea QL7.', 'Dime qué cambió y mantendré el contexto claro.'],
    playful: ['Podemos mantenerlo ligero si sigue siendo útil.', 'Una sonrisa ayuda; secretos e insultos se quedan fuera.'],
  },
  tr: {
    hear: ['Sizi duyuyorum.', 'Yanınızdayım.', 'Bu gerçekten ağır geliyor.'],
    steady: ['Önce küçük ve güvenli bir adım seçin.', 'Her şeyi aynı anda taşımayın.', 'Mümkünse güvendiğiniz birinin yanında olun.'],
    bridge: ['Sonra QL7 içinde net adımı seçeriz.', 'Duygu, gerçek ve eylemi ayıracağım.', 'Bunu sıcak ve yararlı tutabiliriz.'],
    mission: ['Kısa süre destek olabilirim, ancak konuşma modum ekosistem yardımı için sınırlıdır.'],
    choice: ['Aşağıdan bir yön seçin veya başka bir QL7 konusunu yazın.'],
    joke: ['Destek şakası: önbellek tazelik sözü verdi, günlükler kanıt istedi.', 'Bir hata özellik gibi geldi; QA evrak istedi.', 'En güvenli şaka: özel anahtarlar sohbete girmez.', 'Sunucu derin nefes aldı ve süreçleri düzenli tuttu.', 'QCoin nazikçe yenilendi ve doğrulanmış veri getirdi.'],
    business: ['Bunu net bir iş ortaklığı talebine çevirebilirim.', 'Bu bir iş birliği, ortaklık veya yatırım ilgisi gibi görünüyor.', 'Operatörün işlem yapabileceği ticari özü oluşturalım.'],
    detail: ['Hedefi, değeri, ölçeği, zamanı ve sizin tarafta kimin yanıtlayacağını ekleyin.'],
    contact: ['Email, Telegram veya telefon bırakabilir ya da sadece DM seçebilirsiniz.'],
    ready: ['Öz, operatöre hazırlamak için yeterince net.'],
    dm: ['Harici iletişim istemiyorsanız operatör Quantum Messenger üzerinden yanıtlar.'],
    handoff: ['Talep oluşturuldu ve operatöre iletildi.'],
    thanks: ['Quantum L7 AI’a güveniniz için teşekkürler.', 'Yakında sizinle iletişime geçilecek.', 'İletişim bilgileri yalnızca siz verdiğiniz için eklendi.'],
    boundary: ['Yardım edeceğim, ancak hakaret etmeden devam edelim.', 'Yalnızca saygılı bir konuşmada yararlı kalabilirim.', 'Duyguyu anlıyorum, ama doğrudan hakaret durmalı.'],
    firm: ['Bu net bir sınırdır.', 'Sonraki mesaj daha sakin olmalı.', 'Hakaret sürerse giriş geçici olarak durur.'],
    safety: ['Güvenlik incelemesi önceliklidir.', 'Tehdit ve taciz normal sohbette kalamaz.', 'Sistem bağlamı inceleme için saklar.'],
    small: ['Buradayım. Neyi çözelim?', 'Biraz konuşup sonra QL7 görevine dönebiliriz.', 'Neyin değiştiğini yazın, bağlamı temiz tutacağım.'],
    playful: ['Hafif kalabiliriz, yeter ki yararlı olsun.', 'Gülümseme iyi; sırlar ve kabalık dışarıda kalır.'],
  },
  ar: {
    hear: ['أسمعك.', 'أنا معك.', 'يبدو الأمر ثقيلاً فعلاً.'],
    steady: ['اختر أولاً خطوة صغيرة وآمنة.', 'لا تحمل الموقف كله دفعة واحدة.', 'ابق قريباً من شخص تثق به إن استطعت.'],
    bridge: ['بعدها نختار خطوة QL7 الواضحة.', 'سأفصل بين الشعور والحقائق والفعل.', 'سنحافظ على الحديث دافئاً ومفيداً.'],
    mission: ['يمكنني دعمك briefly، لكن وضع المحادثة محدود عمداً لمساعدة المنظومة.'],
    choice: ['اختر اتجاهاً أدناه أو اشرح مسألة QL7 أخرى.'],
    joke: ['مزحة دعم صغيرة: وعدت الذاكرة المؤقتة بالانتعاش فطلبت السجلات إيصالاً.', 'دخل خطأ كميزة جديدة، فطلب فريق QA أوراقه.', 'أكثر مزحة أماناً: المفاتيح الخاصة لا تدخل الدردشة.', 'أخذ الخادم نفساً عميقاً ورتب كل عملياته.', 'تحدّث QCoin بأدب وجلب بيانات مؤكدة فقط.'],
    business: ['أستطيع تحويل ذلك إلى طلب شراكة واضح.', 'يبدو هذا اهتماماً تجارياً أو شراكة أو استثماراً.', 'لنصوغ الفكرة التجارية كي يتمكن المشغل من التصرف.'],
    detail: ['أضف الهدف والقيمة والنطاق والوقت ومن يرد من طرفك.'],
    contact: ['يمكنك ترك البريد أو Telegram أو الهاتف، أو اختيار DM فقط.'],
    ready: ['الخلاصة واضحة بما يكفي لتحضيرها للمشغل.'],
    dm: ['إذا لم ترغب في جهات خارجية فسيرد المشغل عبر Quantum Messenger.'],
    handoff: ['تم تشكيل الطلب وإرساله إلى المشغل.'],
    thanks: ['شكراً لثقتك وإيمانك بآفاق Quantum L7 AI.', 'سيتم التواصل معك قريباً.', 'أضيفت جهات التواصل فقط لأنك قدمتها.'],
    boundary: ['سأساعدك، لكن لنكمل من دون إساءة.', 'أستطيع أن أكون مفيداً فقط إذا بقي الحوار محترماً.', 'أفهم الانفعال، لكن الإهانات المباشرة يجب أن تتوقف.'],
    firm: ['هذا حد واضح.', 'يجب أن تكون الرسالة التالية أهدأ.', 'إذا استمرت الإساءات فسيتم إيقاف الإدخال مؤقتاً.'],
    safety: ['مراجعة الأمان لها الأولوية.', 'التهديدات والمضايقة لا تبقى في الدردشة العادية.', 'سيحفظ النظام السياق للمراجعة.'],
    small: ['أنا هنا. ماذا نراجع؟', 'يمكننا الحديث قليلاً ثم العودة إلى مهمة QL7.', 'اكتب ما تغيّر وسأبقي السياق واضحاً.'],
    playful: ['يمكن أن يبقى الأمر خفيفاً ما دام مفيداً.', 'الابتسامة مرحب بها؛ الأسرار والإساءة تبقى خارجاً.'],
  },
  zh: {
    hear: ['我听到了。', '我在这里。', '这听起来真的很沉重。'],
    steady: ['先选一个小而安全的步骤。', '不要一次扛下全部事情。', '如果可以，靠近一个你信任的人。'],
    bridge: ['然后我们选择清晰的 QL7 下一步。', '我会分开情绪、事实和行动。', '我们可以让对话温暖又有用。'],
    mission: ['我可以短暂支持你，但闲聊能力被刻意限制，以便服务生态支持。'],
    choice: ['请选择下面的方向，或描述另一个 QL7 问题。'],
    joke: ['支持小笑话：缓存保证自己很新鲜，日志要求它出示收据。', '一个 bug 说自己是新功能，QA 请它带文件。', '最安全的笑话：私钥永远不进聊天。', '服务器深呼吸了一下，仍然把进程排得整整齐齐。', 'QCoin 礼貌刷新，只带来已验证数据。'],
    business: ['我可以把它整理成清晰的合作请求。', '这像是商业合作、伙伴关系或投资意向。', '我们把商业核心整理好，让客服可以行动。'],
    detail: ['请补充目标、价值、规模、时间以及你方联系人。'],
    contact: ['你可以留下 email、Telegram 或电话，也可以选择只用 DM。'],
    ready: ['核心已经足够清楚，可以准备给客服。'],
    dm: ['如果不想留下外部联系方式，客服会通过 Quantum Messenger 回复。'],
    handoff: ['请求已整理并发送给客服。'],
    thanks: ['感谢你对 Quantum L7 AI 的信任与期待。', '对方会尽快联系你。', '联系方式只因你主动提供才会附上。'],
    boundary: ['我会帮助你，但请不要继续辱骂。', '只有保持尊重，我才能继续有效帮助。', '强烈情绪可以理解，但直接辱骂需要停止。'],
    firm: ['这是明确边界。', '下一条消息需要更平静。', '如果辱骂继续，输入会暂时暂停。'],
    safety: ['安全审查优先。', '威胁和骚扰不能留在普通聊天里。', '系统会保留上下文用于复核。'],
    small: ['我在。我们先处理什么？', '可以短暂聊聊，然后回到 QL7 任务。', '告诉我发生了什么变化，我会保持上下文清晰。'],
    playful: ['可以轻松一点，只要保持有用。', '微笑欢迎；秘密和粗鲁留在外面。'],
  },
  he: {
    hear: ['אני שומע אותך.', 'אני איתך.', 'זה נשמע באמת כבד.'],
    steady: ['בחרו קודם צעד קטן ובטוח.', 'לא צריך לשאת הכול בבת אחת.', 'אם אפשר, הישארו ליד אדם שאתם סומכים עליו.'],
    bridge: ['אחר כך נבחר את צעד QL7 הנקי.', 'אפריד בין רגש, עובדות ופעולה.', 'נשמור על זה חם ושימושי.'],
    mission: ['אפשר לתמוך בקצרה, אבל מצב השיחה מוגבל בכוונה לטובת תמיכת האקוסיסטם.'],
    choice: ['בחרו כיוון למטה או תארו עניין QL7 אחר.'],
    joke: ['בדיחת תמיכה קטנה: המטמון הבטיח רעננות והיומנים ביקשו קבלה.', 'באג נכנס כתכונה חדשה; QA ביקש מסמכים.', 'הבדיחה הכי בטוחה: מפתחות פרטיים לא נכנסים לצאט.', 'השרת נשם עמוק ועדיין סידר את כל התהליכים.', 'QCoin התרענן בנימוס והביא רק נתונים מאומתים.'],
    business: ['אפשר להפוך זאת לבקשת שותפות ברורה.', 'זה נראה כמו פנייה עסקית, שיתוף פעולה או עניין השקעה.', 'נסדר את העיקר העסקי כדי שנציג יוכל לפעול.'],
    detail: ['הוסיפו מטרה, ערך, היקף, זמנים ומי עונה מצדכם.'],
    contact: ['אפשר להשאיר email, Telegram או טלפון, או לבחור רק DM.'],
    ready: ['העיקר ברור מספיק להכנה לנציג.'],
    dm: ['אם אינכם רוצים קשר חיצוני, הנציג יענה ב-Quantum Messenger.'],
    handoff: ['הפנייה נוצרה ונשלחה לנציג.'],
    thanks: ['תודה על האמון ועל האמונה בעתיד Quantum L7 AI.', 'יצרו איתכם קשר בקרוב.', 'פרטי הקשר צורפו רק כי מסרתם אותם.'],
    boundary: ['אעזור, אבל נמשיך בלי עלבונות.', 'אפשר להיות שימושי רק בשיחה מכבדת.', 'רגש חזק מובן, אבל עלבונות ישירים צריכים להיעצר.'],
    firm: ['זה גבול ברור.', 'ההודעה הבאה צריכה להיות רגועה יותר.', 'אם העלבונות ימשיכו, הקלט יושהה זמנית.'],
    safety: ['בדיקת אבטחה קודמת לשיחה רגילה.', 'איומים והטרדה לא נשארים בצאט רגיל.', 'המערכת תשמור את ההקשר לבדיקה.'],
    small: ['אני כאן. מה נבדוק?', 'אפשר לדבר מעט ואז לחזור למשימת QL7.', 'כתבו מה השתנה ואשמור על הקשר ברור.'],
    playful: ['אפשר לשמור על קלילות, כל עוד זה שימושי.', 'חיוך מתקבל; סודות וגסות נשארים בחוץ.'],
  },
})

const PROVIDER = Object.freeze({
  de: ['Ich höre dich.', 'Ein kleiner sicherer Schritt zuerst.', 'Danach klären wir den QL7-Schritt.', 'Ich kann kurz unterstützen, bleibe aber auf QL7 Support fokussiert.', 'Wähle unten eine Richtung.', 'Kooperationsanfrage', 'Ziel, Wert, Umfang und Zeitplan', 'Email, Telegram, Telefon oder nur DM', 'Die Anfrage wurde an den Operator gesendet.', 'Danke für dein Vertrauen in Quantum L7 AI.', 'Bitte ohne Beleidigungen.', 'Das ist eine klare Grenze.', 'Sicherheitsprüfung hat Vorrang.', 'Was sollen wir ordnen?', 'Leicht ist okay, wenn es nützlich bleibt.'],
  fr: ['Je vous entends.', 'Un petit pas sûr d’abord.', 'Ensuite nous choisirons l’étape QL7.', 'Je peux soutenir brièvement, mais je reste centré sur le support QL7.', 'Choisissez une direction ci-dessous.', 'demande de partenariat', 'objectif, valeur, échelle et calendrier', 'email, Telegram, téléphone ou DM seulement', 'La demande a été envoyée à l’opérateur.', 'Merci pour votre confiance en Quantum L7 AI.', 'Continuons sans insultes.', 'C’est une limite claire.', 'La sécurité passe d’abord.', 'Que voulez-vous clarifier?', 'Un ton léger est bien s’il reste utile.'],
  it: ['Ti ascolto.', 'Prima un piccolo passo sicuro.', 'Poi scegliamo il passo QL7 corretto.', 'Posso sostenerti brevemente, ma resto focalizzato sul supporto QL7.', 'Scegli una direzione qui sotto.', 'richiesta di partnership', 'obiettivo, valore, scala e tempi', 'email, Telegram, telefono o solo DM', 'La richiesta è stata inviata all’operatore.', 'Grazie per la fiducia in Quantum L7 AI.', 'Continuiamo senza insulti.', 'Questo è un limite chiaro.', 'La sicurezza ha priorità.', 'Cosa sistemiamo?', 'Leggero va bene se resta utile.'],
  pt: ['Eu escuto você.', 'Primeiro um passo pequeno e seguro.', 'Depois escolhemos o passo QL7 certo.', 'Posso apoiar brevemente, mas sigo focado no suporte QL7.', 'Escolha uma direção abaixo.', 'pedido de parceria', 'objetivo, valor, escala e prazo', 'email, Telegram, telefone ou só DM', 'A solicitação foi enviada ao operador.', 'Obrigado pela confiança na Quantum L7 AI.', 'Vamos continuar sem insultos.', 'Este é um limite claro.', 'A segurança vem primeiro.', 'O que vamos organizar?', 'Leve é bom quando continua útil.'],
  pl: ['Słyszę cię.', 'Najpierw mały bezpieczny krok.', 'Potem wybierzemy krok QL7.', 'Mogę krótko wesprzeć, ale skupiam się na pomocy QL7.', 'Wybierz kierunek poniżej.', 'prośba o partnerstwo', 'cel, wartość, skala i termin', 'email, Telegram, telefon albo tylko DM', 'Zgłoszenie wysłano do operatora.', 'Dziękujemy za zaufanie do Quantum L7 AI.', 'Kontynuujmy bez obelg.', 'To wyraźna granica.', 'Bezpieczeństwo jest pierwsze.', 'Co uporządkujemy?', 'Lekkość jest dobra, jeśli pomaga.'],
  ro: ['Te aud.', 'Mai întâi un pas mic și sigur.', 'Apoi alegem pasul QL7 potrivit.', 'Pot susține pe scurt, dar rămân concentrat pe suportul QL7.', 'Alege o direcție mai jos.', 'cerere de parteneriat', 'scop, valoare, scară și termen', 'email, Telegram, telefon sau doar DM', 'Cererea a fost trimisă operatorului.', 'Mulțumim pentru încrederea în Quantum L7 AI.', 'Continuăm fără insulte.', 'Aceasta este o limită clară.', 'Siguranța are prioritate.', 'Ce clarificăm?', 'Tonul ușor e bun dacă rămâne util.'],
  nl: ['Ik hoor je.', 'Eerst een kleine veilige stap.', 'Daarna kiezen we de QL7-stap.', 'Ik kan kort steunen, maar blijf gericht op QL7 Support.', 'Kies hieronder een richting.', 'partnerverzoek', 'doel, waarde, schaal en timing', 'email, Telegram, telefoon of alleen DM', 'Het verzoek is naar de operator gestuurd.', 'Dank voor je vertrouwen in Quantum L7 AI.', 'Laten we doorgaan zonder beledigingen.', 'Dit is een duidelijke grens.', 'Veiligheid gaat voor.', 'Wat zullen we ordenen?', 'Luchtig mag, zolang het nuttig blijft.'],
  sv: ['Jag hör dig.', 'Först ett litet tryggt steg.', 'Sedan väljer vi rätt QL7-steg.', 'Jag kan stötta kort, men håller fokus på QL7 Support.', 'Välj en riktning nedan.', 'partnerförfrågan', 'mål, värde, omfattning och tid', 'email, Telegram, telefon eller bara DM', 'Ärendet skickades till operatören.', 'Tack för ditt förtroende för Quantum L7 AI.', 'Låt oss fortsätta utan förolämpningar.', 'Det är en tydlig gräns.', 'Säkerhet går först.', 'Vad ska vi reda ut?', 'Lätt ton är okej när den hjälper.'],
  no: ['Jeg hører deg.', 'Først et lite trygt steg.', 'Så velger vi riktig QL7-steg.', 'Jeg kan støtte kort, men holder fokus på QL7 Support.', 'Velg en retning nedenfor.', 'partnerforespørsel', 'mål, verdi, omfang og tid', 'email, Telegram, telefon eller bare DM', 'Saken ble sendt til operatøren.', 'Takk for tilliten til Quantum L7 AI.', 'La oss fortsette uten fornærmelser.', 'Dette er en tydelig grense.', 'Sikkerhet kommer først.', 'Hva skal vi avklare?', 'Lett tone er fint når den hjelper.'],
  da: ['Jeg hører dig.', 'Først et lille sikkert skridt.', 'Derefter vælger vi det rette QL7-trin.', 'Jeg kan støtte kort, men holder fokus på QL7 Support.', 'Vælg en retning nedenfor.', 'partnerforespørgsel', 'mål, værdi, omfang og timing', 'email, Telegram, telefon eller kun DM', 'Sagen blev sendt til operatøren.', 'Tak for tilliden til Quantum L7 AI.', 'Lad os fortsætte uden fornærmelser.', 'Det er en tydelig grænse.', 'Sikkerhed kommer først.', 'Hvad skal vi afklare?', 'Let tone er fin, når den hjælper.'],
  fi: ['Kuulen sinut.', 'Ensin pieni turvallinen askel.', 'Sitten valitsemme oikean QL7-askeleen.', 'Voin tukea hetken, mutta pysyn QL7 Supportissa.', 'Valitse suunta alta.', 'kumppanuuspyyntö', 'tavoite, arvo, laajuus ja aikataulu', 'email, Telegram, puhelin tai vain DM', 'Pyyntö lähetettiin operaattorille.', 'Kiitos luottamuksesta Quantum L7 AI:hin.', 'Jatketaan ilman loukkauksia.', 'Tämä on selkeä raja.', 'Turvallisuus ensin.', 'Mitä selvitämme?', 'Kevyt sävy sopii, jos se auttaa.'],
  cs: ['Slyším vás.', 'Nejprve malý bezpečný krok.', 'Potom zvolíme krok QL7.', 'Mohu krátce podpořit, ale zůstávám u podpory QL7.', 'Vyberte směr níže.', 'žádost o partnerství', 'cíl, hodnota, rozsah a termín', 'email, Telegram, telefon nebo jen DM', 'Žádost byla odeslána operátorovi.', 'Děkujeme za důvěru v Quantum L7 AI.', 'Pokračujme bez urážek.', 'To je jasná hranice.', 'Bezpečnost má přednost.', 'Co vyjasníme?', 'Lehkost je v pořádku, když pomáhá.'],
  sk: ['Počujem vás.', 'Najprv malý bezpečný krok.', 'Potom zvolíme krok QL7.', 'Môžem krátko podporiť, ale ostávam pri podpore QL7.', 'Vyberte smer nižšie.', 'žiadosť o partnerstvo', 'cieľ, hodnota, rozsah a čas', 'email, Telegram, telefón alebo iba DM', 'Žiadosť bola odoslaná operátorovi.', 'Ďakujeme za dôveru v Quantum L7 AI.', 'Pokračujme bez urážok.', 'Toto je jasná hranica.', 'Bezpečnosť má prednosť.', 'Čo objasníme?', 'Ľahkosť je dobrá, ak pomáha.'],
  hu: ['Hallom önt.', 'Először egy kis biztonságos lépés.', 'Utána kiválasztjuk a QL7 lépést.', 'Röviden támogathatom, de a QL7 Supportnál maradok.', 'Válasszon irányt lent.', 'partnerségi kérés', 'cél, érték, méret és időzítés', 'email, Telegram, telefon vagy csak DM', 'A kérés elküldve az operátornak.', 'Köszönjük a bizalmat a Quantum L7 AI iránt.', 'Folytassuk sértések nélkül.', 'Ez világos határ.', 'A biztonság elsőbbséget élvez.', 'Mit tisztázzunk?', 'Lehet könnyed, ha hasznos marad.'],
  bg: ['Чувам ви.', 'Първо малка безопасна стъпка.', 'После избираме QL7 стъпката.', 'Мога да подкрепя кратко, но оставам фокусиран върху QL7 Support.', 'Изберете посока по-долу.', 'заявка за партньорство', 'цел, стойност, мащаб и срок', 'email, Telegram, телефон или само DM', 'Заявката е изпратена до оператор.', 'Благодарим за доверието в Quantum L7 AI.', 'Да продължим без обиди.', 'Това е ясна граница.', 'Сигурността е първа.', 'Какво да изясним?', 'Лек тон е добре, ако е полезен.'],
  sr: ['Čujem vas.', 'Prvo jedan mali bezbedan korak.', 'Zatim biramo pravi QL7 korak.', 'Mogu kratko da podržim, ali ostajem na QL7 Support fokusu.', 'Izaberite smer ispod.', 'partnerski zahtev', 'cilj, vrednost, obim i rok', 'email, Telegram, telefon ili samo DM', 'Zahtev je poslat operateru.', 'Hvala na poverenju u Quantum L7 AI.', 'Nastavimo bez uvreda.', 'Ovo je jasna granica.', 'Bezbednost je prva.', 'Šta da razjasnimo?', 'Lagan ton je dobar ako ostaje koristan.'],
  hr: ['Čujem vas.', 'Prvo jedan mali siguran korak.', 'Zatim biramo pravi QL7 korak.', 'Mogu kratko podržati, ali ostajem fokusiran na QL7 Support.', 'Odaberite smjer ispod.', 'partnerski zahtjev', 'cilj, vrijednost, opseg i rok', 'email, Telegram, telefon ili samo DM', 'Zahtjev je poslan operateru.', 'Hvala na povjerenju u Quantum L7 AI.', 'Nastavimo bez uvreda.', 'Ovo je jasna granica.', 'Sigurnost je prva.', 'Što trebamo razjasniti?', 'Lagan ton je dobar ako ostaje koristan.'],
  sl: ['Slišim vas.', 'Najprej majhen varen korak.', 'Nato izberemo pravi QL7 korak.', 'Lahko kratko podprem, vendar ostajam pri QL7 Support.', 'Spodaj izberite smer.', 'partnerska prošnja', 'cilj, vrednost, obseg in čas', 'email, Telegram, telefon ali samo DM', 'Zahteva je bila poslana operaterju.', 'Hvala za zaupanje v Quantum L7 AI.', 'Nadaljujmo brez žalitev.', 'To je jasna meja.', 'Varnost je prva.', 'Kaj naj razjasnimo?', 'Lahek ton je dober, če ostane uporaben.'],
  el: ['Σε ακούω.', 'Πρώτα ένα μικρό ασφαλές βήμα.', 'Μετά επιλέγουμε το βήμα QL7.', 'Μπορώ να στηρίξω σύντομα, αλλά μένω στο QL7 Support.', 'Διάλεξε κατεύθυνση παρακάτω.', 'αίτημα συνεργασίας', 'στόχος, αξία, κλίμακα και χρόνος', 'email, Telegram, τηλέφωνο ή μόνο DM', 'Το αίτημα στάλθηκε στον operator.', 'Ευχαριστούμε για την εμπιστοσύνη στο Quantum L7 AI.', 'Συνεχίζουμε χωρίς προσβολές.', 'Αυτό είναι σαφές όριο.', 'Η ασφάλεια προηγείται.', 'Τι να ξεκαθαρίσουμε?', 'Η ελαφρότητα είναι καλή όταν βοηθά.'],
  id: ['Saya mendengar Anda.', 'Mulai dari satu langkah kecil yang aman.', 'Lalu kita pilih langkah QL7 yang tepat.', 'Saya bisa mendukung sebentar, tetapi fokus pada QL7 Support.', 'Pilih arah di bawah.', 'permintaan kemitraan', 'tujuan, nilai, skala, dan waktu', 'email, Telegram, telepon, atau DM saja', 'Permintaan dikirim ke operator.', 'Terima kasih atas kepercayaan pada Quantum L7 AI.', 'Mari lanjut tanpa hinaan.', 'Ini batas yang jelas.', 'Keamanan menjadi prioritas.', 'Apa yang kita rapikan?', 'Ringan boleh jika tetap berguna.'],
  vi: ['Tôi nghe bạn.', 'Trước hết là một bước nhỏ an toàn.', 'Sau đó ta chọn bước QL7 rõ ràng.', 'Tôi có thể hỗ trợ ngắn, nhưng vẫn tập trung vào QL7 Support.', 'Chọn một hướng bên dưới.', 'yêu cầu hợp tác', 'mục tiêu, giá trị, quy mô và thời gian', 'email, Telegram, điện thoại hoặc chỉ DM', 'Yêu cầu đã gửi cho người vận hành.', 'Cảm ơn bạn tin tưởng Quantum L7 AI.', 'Hãy tiếp tục không xúc phạm.', 'Đây là ranh giới rõ ràng.', 'An toàn được ưu tiên.', 'Ta cần làm rõ gì?', 'Nhẹ nhàng cũng tốt nếu hữu ích.'],
  hi: ['मैं आपकी बात सुन रहा हूँ।', 'पहले एक छोटा सुरक्षित कदम चुनें।', 'फिर हम सही QL7 कदम चुनेंगे।', 'मैं थोड़ी देर सहारा दे सकता हूँ, पर QL7 Support पर केंद्रित रहता हूँ।', 'नीचे एक दिशा चुनें।', 'साझेदारी अनुरोध', 'लक्ष्य, मूल्य, पैमाना और समय', 'email, Telegram, phone या केवल DM', 'अनुरोध ऑपरेटर को भेज दिया गया है।', 'Quantum L7 AI पर भरोसे के लिए धन्यवाद।', 'बिना अपमान के जारी रखें।', 'यह स्पष्ट सीमा है।', 'सुरक्षा पहले है।', 'क्या स्पष्ट करें?', 'हल्का रहना ठीक है, अगर उपयोगी रहे।'],
  ur: ['میں آپ کی بات سن رہا ہوں۔', 'پہلے ایک چھوٹا محفوظ قدم۔', 'پھر ہم QL7 کا واضح قدم چنیں گے۔', 'میں مختصر سہارا دے سکتا ہوں، مگر QL7 Support پر مرکوز رہتا ہوں۔', 'نیچے ایک سمت چنیں۔', 'شراکت داری کی درخواست', 'مقصد، قدر، پیمانہ اور وقت', 'email، Telegram، phone یا صرف DM', 'درخواست آپریٹر کو بھیج دی گئی۔', 'Quantum L7 AI پر اعتماد کا شکریہ۔', 'توہین کے بغیر آگے بڑھیں۔', 'یہ واضح حد ہے۔', 'سلامتی پہلے ہے۔', 'کیا واضح کریں؟', 'ہلکا انداز اچھا ہے اگر مفید رہے۔'],
  fa: ['صدای شما را می‌شنوم.', 'اول یک قدم کوچک و امن.', 'بعد قدم روشن QL7 را انتخاب می‌کنیم.', 'می‌توانم کوتاه حمایت کنم، اما روی QL7 Support متمرکز می‌مانم.', 'یک مسیر زیر انتخاب کنید.', 'درخواست همکاری', 'هدف، ارزش، مقیاس و زمان', 'email، Telegram، phone یا فقط DM', 'درخواست به اپراتور ارسال شد.', 'از اعتماد شما به Quantum L7 AI سپاسگزاریم.', 'بدون توهین ادامه دهیم.', 'این یک مرز روشن است.', 'امنیت اولویت دارد.', 'چه چیزی را روشن کنیم؟', 'لحن سبک خوب است اگر مفید بماند.'],
  az: ['Sizi eşidirəm.', 'Əvvəl kiçik təhlükəsiz addım.', 'Sonra QL7 addımını seçəcəyik.', 'Qısa dəstək verə bilərəm, amma QL7 Support fokusunda qalıram.', 'Aşağıda istiqamət seçin.', 'tərəfdaşlıq müraciəti', 'məqsəd, dəyər, miqyas və vaxt', 'email, Telegram, telefon və ya yalnız DM', 'Müraciət operatora göndərildi.', 'Quantum L7 AI-a etibarınız üçün təşəkkürlər.', 'Təhqirsiz davam edək.', 'Bu aydın sərhəddir.', 'Təhlükəsizlik öncədir.', 'Nəyi aydınlaşdıraq?', 'Yüngül ton faydalı qalırsa yaxşıdır.'],
  ka: ['გისმენთ.', 'ჯერ ერთი პატარა უსაფრთხო ნაბიჯი.', 'შემდეგ ავირჩევთ QL7 ნაბიჯს.', 'შემიძლია მოკლე მხარდაჭერა, მაგრამ QL7 Support-ზე ვრჩები.', 'აირჩიეთ მიმართულება ქვემოთ.', 'პარტნიორობის მოთხოვნა', 'მიზანი, ღირებულება, მასშტაბი და დრო', 'email, Telegram, phone ან მხოლოდ DM', 'მოთხოვნა ოპერატორს გაეგზავნა.', 'გმადლობთ Quantum L7 AI-ის ნდობისთვის.', 'გავაგრძელოთ შეურაცხყოფის გარეშე.', 'ეს მკაფიო ზღვარია.', 'უსაფრთხოება პირველია.', 'რა დავაზუსტოთ?', 'სიმსუბუქე კარგია, თუ სასარგებლოა.'],
  kk: ['Сізді тыңдап тұрмын.', 'Алдымен шағын қауіпсіз қадам.', 'Содан кейін QL7 қадамын таңдаймыз.', 'Қысқа қолдау бере аламын, бірақ QL7 Support бағытын ұстаймын.', 'Төменнен бағыт таңдаңыз.', 'серіктестік сұрауы', 'мақсат, құндылық, ауқым және мерзім', 'email, Telegram, телефон немесе тек DM', 'Өтініш операторға жіберілді.', 'Quantum L7 AI-ға сеніміңіз үшін рахмет.', 'Қорлаусыз жалғастырайық.', 'Бұл анық шекара.', 'Қауіпсіздік бірінші орында.', 'Нені нақтылаймыз?', 'Жеңіл тон пайдалы болса жақсы.'],
  uz: ['Sizni eshityapman.', 'Avval kichik xavfsiz qadam.', 'Keyin QL7 qadamini tanlaymiz.', 'Qisqa qo‘llab-quvvatlay olaman, ammo QL7 Supportga e’tibor qilaman.', 'Quyidan yo‘nalish tanlang.', 'hamkorlik so‘rovi', 'maqsad, qiymat, ko‘lam va vaqt', 'email, Telegram, telefon yoki faqat DM', 'So‘rov operatorga yuborildi.', 'Quantum L7 AIga ishonchingiz uchun rahmat.', 'Haqoratsiz davom etamiz.', 'Bu aniq chegara.', 'Xavfsizlik birinchi.', 'Nimani aniqlaymiz?', 'Yengil ohang foydali bo‘lsa yaxshi.'],
  ja: ['聞いています。', 'まず小さく安全な一歩からです。', 'そのあと明確な QL7 の手順を選びます。', '短く支えられますが、QL7 Support に集中します。', '下から方向を選んでください。', 'パートナーシップ依頼', '目的、価値、規模、時期', 'email、Telegram、電話、または DM のみ', '依頼はオペレーターへ送信されました。', 'Quantum L7 AI への信頼に感謝します。', '侮辱なしで続けましょう。', 'これは明確な境界です。', '安全確認が優先です。', '何を整理しますか？', '役に立つなら軽さも歓迎です。'],
  ko: ['듣고 있습니다.', '먼저 작고 안전한 한 걸음부터요.', '그다음 QL7의 명확한 단계를 고르겠습니다.', '짧게 지지할 수 있지만 QL7 Support에 집중합니다.', '아래에서 방향을 선택하세요.', '파트너십 요청', '목표, 가치, 규모, 일정', 'email, Telegram, phone 또는 DM만', '요청이 운영자에게 전달되었습니다.', 'Quantum L7 AI를 믿어 주셔서 감사합니다.', '모욕 없이 이어가겠습니다.', '이것은 분명한 경계입니다.', '안전 검토가 우선입니다.', '무엇을 정리할까요?', '도움이 된다면 가볍게 가도 좋습니다.'],
  th: ['ฉันได้ยินคุณ.', 'เริ่มจากก้าวเล็กที่ปลอดภัยก่อน.', 'จากนั้นเลือกขั้นตอน QL7 ที่ชัดเจน.', 'ฉันช่วยประคองได้สั้น ๆ แต่ยังโฟกัส QL7 Support.', 'เลือกทิศทางด้านล่าง.', 'คำขอพาร์ตเนอร์', 'เป้าหมาย คุณค่า ขนาด และเวลา', 'email, Telegram, phone หรือ DM เท่านั้น', 'ส่งคำขอให้โอเปอเรเตอร์แล้ว.', 'ขอบคุณที่เชื่อมั่นใน Quantum L7 AI.', 'คุยต่อโดยไม่ดูหมิ่นกันนะ.', 'นี่คือขอบเขตที่ชัดเจน.', 'ความปลอดภัยมาก่อน.', 'ต้องการจัดการเรื่องไหน?', 'คุยเบา ๆ ได้ ถ้ายังมีประโยชน์.'],
})

function providerPack(locale) {
  const row = PROVIDER[locale]
  if (!row) return null
  const [hear, steady, bridge, mission, choice, business, detail, contact, handoff, thanks, boundary, firm, safety, small, playful] = row
  return {
    hear: [hear, steady],
    steady: [steady, bridge],
    bridge: [bridge, small],
    mission: [mission],
    choice: [choice],
    joke: [
      `${playful} ${boundary}`,
      `${hear} ${playful}`,
      `${bridge} ${thanks}`,
    ],
    business: [business],
    detail: [detail],
    contact: [contact],
    ready: [detail],
    dm: [contact],
    handoff: [handoff],
    thanks: [thanks],
    boundary: [boundary, firm],
    firm: [firm, boundary],
    safety: [safety],
    small: [small, hear],
    playful: [playful],
  }
}

function rawPack(locale) {
  const normalized = ql7Locale(locale)
  return RAW[normalized] || providerPack(normalized) || RAW.en
}

function dedupe(rows) {
  const seen = new Set()
  const out = []
  for (const row of rows.map((item) => ql7NormalizeSpaces(item)).filter(Boolean)) {
    const key = row.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return Object.freeze(out)
}

function cross2(a = [], b = []) {
  return dedupe(ql7Arr(a).flatMap((x) => ql7Arr(b).map((y) => `${x} ${y}`)))
}

function cross3(a = [], b = [], c = []) {
  return dedupe(ql7Arr(a).flatMap((x) => ql7Arr(b).flatMap((y) => ql7Arr(c).map((z) => `${x} ${y} ${z}`))))
}

function patterns(keys = [], limit = 120) {
  const source = ql7Arr(keys).filter(Boolean)
  const out = []
  const used = new Set()
  function walk(row) {
    if (out.length >= limit) return
    if (row.length === source.length) {
      out.push(Object.freeze([...row]))
      return
    }
    for (const key of source) {
      if (used.has(key)) continue
      used.add(key)
      row.push(key)
      walk(row)
      row.pop()
      used.delete(key)
      if (out.length >= limit) return
    }
  }
  walk([])
  return Object.freeze(out)
}

const FIVE_SLOT_PATTERNS = patterns(['hear', 'steady', 'bridge', 'small', 'choice'], 24)
const HUMOR_PATTERNS = patterns(['joke', 'playful', 'small', 'bridge', 'hear'], 24)
const BUSINESS_PATTERNS = patterns(['business', 'detail', 'contact', 'ready', 'handoff', 'thanks'], 36)
const WARNING_PATTERNS = patterns(['boundary', 'firm', 'safety', 'small', 'choice'], 24)

function crossPattern(groups = {}, order = []) {
  let rows = ['']
  for (const key of order) {
    const values = ql7Arr(groups[key]).filter(Boolean)
    if (!values.length) return []
    rows = rows.flatMap((prefix) => values.map((value) => `${prefix} ${value}`.trim()))
  }
  return rows
}

function orderedCross(groups = {}, orders = []) {
  return ql7Arr(orders).flatMap((order) => crossPattern(groups, order))
}

function hasAdjacentRepeatedPhrase(value = '') {
  const tokens = ql7Str(value).toLowerCase().match(/[\p{L}\p{N}@._+-]+/gu) || []
  for (let width = 3; width <= Math.min(10, Math.floor(tokens.length / 2)); width += 1) {
    for (let index = 0; index + (width * 2) <= tokens.length; index += 1) {
      const left = tokens.slice(index, index + width).join(' ')
      const right = tokens.slice(index + width, index + (width * 2)).join(' ')
      if (left === right) return true
    }
  }
  return false
}

function dedupeLimit(rows = [], limit = 1800) {
  const max = Math.max(1, Number(limit) || 1800)
  const seen = new Set()
  const out = []
  for (const item of rows) {
    const row = ql7NormalizeSpaces(item)
    if (!row) continue
    if (hasAdjacentRepeatedPhrase(row)) continue
    const key = row.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
    if (out.length >= max) break
  }
  return Object.freeze(out)
}

function topicLabelsFor(locale = 'en') {
  return QL7_SUPPORT_ECOSYSTEM_TOPICS
    .map((topic) => getQl7SupportTopicLabel(topic, locale) || topic)
    .map((value) => ql7NormalizeSpaces(value))
    .filter(Boolean)
}

function renderTemplate(value = '', vars = {}) {
  return ql7NormalizeSpaces(ql7Str(value).replace(/\{(\w+)\}/gu, (match, key) => (
    Object.prototype.hasOwnProperty.call(vars, key) ? ql7Str(vars[key]) : match
  )))
}

function crossTemplates(templates = [], axes = {}, limit = 1800) {
  const max = Math.max(1, Number(limit) || 1800)
  const keys = Object.keys(axes)
  if (!keys.length) return dedupeLimit(templates, max)
  if (keys.some((key) => !ql7Arr(axes[key]).filter(Boolean).length)) return Object.freeze([])
  const seen = new Set()
  const out = []
  function push(value = '') {
    const row = ql7NormalizeSpaces(value)
    if (!row) return
    const key = row.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(row)
  }
  function walk(index = 0, vars = {}) {
    if (out.length >= max) return
    if (index >= keys.length) {
      for (const template of ql7Arr(templates)) {
        push(renderTemplate(template, vars))
        if (out.length >= max) return
      }
      return
    }
    const key = keys[index]
    for (const value of ql7Arr(axes[key]).filter(Boolean)) {
      walk(index + 1, { ...vars, [key]: value })
      if (out.length >= max) return
    }
  }
  walk(0, {})
  return Object.freeze(out)
}

const EXTRA_NATIVE = Object.freeze({
  en: Object.freeze({
    fresh: ['Good to see you again.', 'I am ready for a fresh QL7 question.', 'Start with the result you expected.', 'We can check status, explain a feature, or fix a support issue.'],
    continue: ['The previous thread is still open.', 'I can continue from the saved context.', 'Tell me what changed since the last message.', 'We can resume the unfinished QL7 topic without losing the earlier facts.'],
    product: ['Use {label} when you need the verified product path.', 'I will explain {label} through current capabilities, safe limits and available actions.', 'For {label}, I separate confirmed behavior from roadmap or unknown pieces.', 'If {label} needs account data, I use only approved read-only evidence.'],
    table: ['The table below uses human labels and verified values only.', 'I will keep raw keys out and show the checked facts in a readable table.', 'Empty, unavailable and forbidden data stay separate in the table.', 'Dates and statuses should be readable, not database-shaped.'],
    aiReady: ['AI-Recomendation is prepared for {symbol} on {timeframe}: price {price}, scenario {action}, confidence {confidence}. {reason} {disclaimer}', 'For {symbol} on {timeframe}, the calculation is ready: {action} with confidence {confidence} at price {price}. {reason} {disclaimer}', 'I checked the available AI Box route for {symbol} and {timeframe}; the current scenario is {action}, confidence {confidence}. {reason} {disclaimer}'],
    aiQuota: ['The daily AI Box quota is exhausted. VIP opens continuous analytics; activate VIP and return to the same symbol and timeframe.', 'I will not start a market calculation without quota or VIP access. Activate VIP, then I can continue the same AI Box check.', 'Your AI Box resource is at zero for now, so I am pausing the calculation and offering the VIP route instead.'],
    qcoinIncident: ['I understand this as a possible QCoin balance or ledger incident. I will start with verified account operations and keep Ads out of this check.', 'The meaning is clear: QCoin funds or balance changed unexpectedly. I will verify the ledger, recent operations and receipts before drawing conclusions.', 'I will treat this as a QCoin security/balance review, not a generic complaint. Add details if you have them; if not, I will begin with the available verified data.'],
    operator: ['Tell me the goal, value, scale, timing and preferred contact method.', 'If you want a human operator, I first need the business context and consent for contact handling.', 'You can leave email, Telegram or phone, or keep the follow-up inside Quantum Messenger only.'],
    purchaseOk: ['The purchase event is verified and the result can be shown to you safely.', 'Payment or purchase completion is confirmed by receipt; I will show the useful result without raw internals.', 'The operation is marked successful in the verified source.'],
    purchaseFail: ['The purchase did not complete in the verified source, so I will explain the safe next step without inventing success.', 'The payment or purchase is not confirmed; I will keep the status precise and show the retry or support route.', 'The source reports an unsuccessful operation, not a completed purchase.'],
    unrecognized: ['This does not look like a clear question yet.', 'I see a fragment, but not enough meaning to choose a QL7 check.', 'That message is too thin for a balance, Ads, VIP or AI route.', 'I will not guess from a symbol or a broken fragment.'],
    ambiguous: ['I can see a possible topic, but not the exact action yet.', 'This may point to QL7, but I need the concrete thing you want checked.', 'I will not open account data or a market calculation from one vague word.', 'There is a signal here, but not enough confidence for a table.'],
    casual: ['I can chat for a moment, then I should bring us back to a useful QL7 step.', 'A little ordinary talk is fine; after that I will help with the open QL7 topic.', 'I am glad to stay warm and useful, then we can return to the thing you actually need.'],
  }),
  ru: Object.freeze({
    fresh: ['Рад снова видеть.', 'Готов к новому вопросу по QL7.', 'Начните с результата, который ожидали.', 'Можем проверить статус, объяснить функцию или разобрать проблему.'],
    continue: ['Предыдущая тема ещё открыта.', 'Могу продолжить с сохранённого контекста.', 'Напишите, что изменилось после последнего сообщения.', 'Вернёмся к незакрытому вопросу QL7 без потери уже собранных фактов.'],
    product: ['Используйте «{label}», когда нужен подтверждённый продуктовый путь.', 'Я объясню «{label}» через текущие функции, безопасные границы и доступные действия.', 'По «{label}» я отделяю подтверждённое поведение от roadmap и неизвестных частей.', 'Если для «{label}» нужны данные аккаунта, я беру только разрешённые read-only доказательства.'],
    table: ['Таблица ниже использует человеческие названия и только подтверждённые значения.', 'Сырые ключи не показываются: факты будут в читаемой таблице.', 'Пустые, недоступные и запрещённые данные в таблице разделены.', 'Даты и статусы должны быть понятными, а не в виде сырой записи базы.'],
    aiReady: ['AI-Recomendation подготовлена для {symbol} на {timeframe}: цена {price}, сценарий {action}, уверенность {confidence}. {reason} {disclaimer}', 'Для {symbol} на {timeframe} расчёт готов: {action}, уверенность {confidence}, цена {price}. {reason} {disclaimer}', 'Я проверил доступный маршрут AI Box для {symbol} и {timeframe}; текущий сценарий: {action}, уверенность {confidence}. {reason} {disclaimer}'],
    aiQuota: ['Дневная AI-квота исчерпана. VIP открывает постоянную аналитику; активируйте VIP и вернитесь к той же монете и таймфрейму.', 'Я не запускаю рыночный расчёт без квоты или VIP-доступа. Активируйте VIP, и я продолжу ту же проверку AI Box.', 'Ваш ресурс AI Box сейчас на нуле, поэтому расчёт остановлен и предложен маршрут VIP.'],
    qcoinIncident: ['Я понимаю это как возможный инцидент баланса или леджера QCoin. Начну с подтверждённых операций аккаунта и не буду смешивать это с Ads.', 'Суть ясна: средства или баланс QCoin изменились неожиданно. Проверю леджер, последние операции и receipts до выводов.', 'Отнесу это к проверке безопасности и баланса QCoin, а не к общей жалобе. Если есть детали — добавьте; если нет, начну с доступных подтверждённых данных.'],
    operator: ['Укажите цель, ценность, масштаб, сроки и удобный способ связи.', 'Если нужен живой оператор, сначала соберу бизнес-контекст и согласие на обработку контакта.', 'Можно оставить email, Telegram или телефон, либо оставить продолжение только в Quantum Messenger.'],
    purchaseOk: ['Событие покупки подтверждено, результат можно безопасно показать пользователю.', 'Оплата или покупка подтверждена receipt; покажу полезный результат без внутренних сырых данных.', 'Операция отмечена как успешная в проверенном источнике.'],
    purchaseFail: ['Покупка не завершилась в проверенном источнике, поэтому я не буду изображать успех и покажу безопасный следующий шаг.', 'Оплата или покупка не подтверждена; статус будет точным, с маршрутом повтора или поддержки.', 'Источник сообщает неуспешную операцию, а не завершённую покупку.'],
    unrecognized: ['Это пока не похоже на понятный вопрос или запрос.', 'Я вижу фрагмент, но смысла недостаточно для проверки QL7.', 'По такому короткому набору символов нельзя честно выбрать баланс, рекламу, VIP или AI-расчёт.', 'Я не буду угадывать по точке, символу или обрывку фразы.'],
    ambiguous: ['Тему я примерно вижу, но точного действия пока нет.', 'Похоже на направление QL7, но нужно понять, что именно проверить.', 'Я не открываю данные аккаунта и не запускаю расчёт по одному расплывчатому слову.', 'Сигнал есть, но уверенности недостаточно для таблицы или проверки.'],
    casual: ['Можем немного поговорить, а потом я аккуратно верну нас к полезному шагу QL7.', 'Мне приятно пообщаться, но дальше лучше выбрать открытую тему или новый вопрос.', 'Я могу коротко поддержать обычный разговор, а затем предложу вернуться к сути.'],
  }),
  uk: Object.freeze({
    fresh: ['Радий бачити знову.', 'Готовий до нового питання QL7.', 'Почніть з результату, який очікували.', 'Можемо перевірити статус, пояснити функцію або розібрати проблему.'],
    continue: ['Попередня тема ще відкрита.', 'Можу продовжити зі збереженого контексту.', 'Напишіть, що змінилося після останнього повідомлення.', 'Повернімося до незакритого питання QL7 без втрати вже зібраних фактів.'],
    product: ['Використовуйте «{label}», коли потрібен підтверджений продуктовий шлях.', 'Я поясню «{label}» через поточні функції, безпечні межі й доступні дії.', 'Для «{label}» я відділяю підтверджену поведінку від roadmap і невідомих частин.', 'Якщо для «{label}» потрібні дані акаунта, я беру лише дозволені read-only докази.'],
    table: ['Таблиця нижче використовує людські назви й лише підтверджені значення.', 'Сирі ключі не показуються: факти будуть у читабельній таблиці.', 'Порожні, недоступні й заборонені дані в таблиці розділені.', 'Дати й статуси мають бути зрозумілими, а не схожими на сирий запис бази.'],
    aiReady: ['AI-Recomendation підготовлена для {symbol} на {timeframe}: ціна {price}, сценарій {action}, впевненість {confidence}. {reason} {disclaimer}', 'Для {symbol} на {timeframe} розрахунок готовий: {action}, впевненість {confidence}, ціна {price}. {reason} {disclaimer}', 'Я перевірив доступний маршрут AI Box для {symbol} і {timeframe}; поточний сценарій: {action}, впевненість {confidence}. {reason} {disclaimer}'],
    aiQuota: ['Денна AI-квота вичерпана. VIP відкриває постійну аналітику; активуйте VIP і поверніться до тієї ж монети й таймфрейму.', 'Я не запускаю ринковий розрахунок без квоти або VIP-доступу. Активуйте VIP, і я продовжу ту саму перевірку AI Box.', 'Ваш ресурс AI Box зараз на нулі, тому розрахунок зупинено й запропоновано маршрут VIP.'],
    qcoinIncident: ['Я розумію це як можливий інцидент балансу або леджера QCoin. Почну з підтверджених операцій акаунта й не змішуватиму це з Ads.', 'Суть зрозуміла: кошти або баланс QCoin змінилися несподівано. Перевірю леджер, останні операції й receipts до висновків.', 'Віднесу це до перевірки безпеки й балансу QCoin, а не до загальної скарги. Якщо є деталі — додайте; якщо ні, почну з доступних підтверджених даних.'],
    operator: ['Додайте мету, цінність, масштаб, строки й зручний спосіб зв’язку.', 'Якщо потрібен живий оператор, спочатку зберу бізнес-контекст і згоду на обробку контакту.', 'Можна залишити email, Telegram або телефон, або продовжити тільки в Quantum Messenger.'],
    purchaseOk: ['Подію покупки підтверджено, результат можна безпечно показати користувачу.', 'Оплата або покупка підтверджена receipt; покажу корисний результат без внутрішніх сирих даних.', 'Операцію позначено як успішну в перевіреному джерелі.'],
    purchaseFail: ['Покупка не завершилася в перевіреному джерелі, тому я не зображатиму успіх і покажу безпечний наступний крок.', 'Оплата або покупка не підтверджена; статус буде точним, із маршрутом повтору або підтримки.', 'Джерело повідомляє неуспішну операцію, а не завершену покупку.'],
    unrecognized: ['Це поки не схоже на зрозуміле питання або запит.', 'Я бачу фрагмент, але сенсу замало для перевірки QL7.', 'За таким коротким набором символів не можна чесно обрати баланс, рекламу, VIP або AI-розрахунок.', 'Я не вгадуватиму за крапкою, символом чи уривком фрази.'],
    ambiguous: ['Тему я приблизно бачу, але точної дії ще немає.', 'Це схоже на напрям QL7, та потрібно зрозуміти, що саме перевірити.', 'Я не відкриваю дані акаунта й не запускаю розрахунок за одним розмитим словом.', 'Сигнал є, але впевненості замало для таблиці або перевірки.'],
    casual: ['Можемо трохи поговорити, а потім я м’яко поверну нас до корисного кроку QL7.', 'Мені приємно поспілкуватися, але далі краще обрати відкриту тему або нове питання.', 'Я можу коротко підтримати звичайну розмову, а потім запропоную повернутися до суті.'],
  }),
  es: Object.freeze({
    fresh: ['Me alegra verte de nuevo.', 'Estoy listo para una nueva pregunta QL7.', 'Empieza por el resultado que esperabas.', 'Podemos comprobar un estado, explicar una función o resolver un problema.'],
    continue: ['La consulta anterior sigue abierta.', 'Puedo continuar desde el contexto guardado.', 'Dime qué cambió desde el último mensaje.', 'Podemos retomar el tema QL7 pendiente sin perder los hechos reunidos.'],
    product: ['Usa {label} cuando necesites una ruta de producto verificada.', 'Explicaré {label} con funciones actuales, límites seguros y acciones disponibles.', 'Para {label}, separo lo confirmado de roadmap o partes desconocidas.', 'Si {label} requiere datos de cuenta, solo uso evidencia autorizada de solo lectura.'],
    table: ['La tabla usa etiquetas humanas y valores verificados.', 'No mostraré claves crudas; los hechos aparecen en una tabla legible.', 'Datos vacíos, no disponibles y prohibidos permanecen separados.', 'Fechas y estados deben verse claros, no como una fila cruda de base.'],
    aiReady: ['AI-Recomendation está preparada para {symbol} en {timeframe}: precio {price}, escenario {action}, confianza {confidence}. {reason} {disclaimer}', 'Para {symbol} en {timeframe}, el cálculo está listo: {action}, confianza {confidence}, precio {price}. {reason} {disclaimer}', 'Revisé la ruta AI Box disponible para {symbol} y {timeframe}; el escenario actual es {action}, confianza {confidence}. {reason} {disclaimer}'],
    aiQuota: ['La cuota diaria de AI Box está agotada. VIP abre analítica continua; actívalo y vuelve al mismo activo y temporalidad.', 'No inicio un cálculo de mercado sin cuota o VIP. Activa VIP y continuaré la misma revisión de AI Box.', 'Tu recurso AI Box está en cero por ahora, así que pauso el cálculo y ofrezco la ruta VIP.'],
    qcoinIncident: ['Entiendo esto como posible incidente de saldo o ledger QCoin. Empezaré con operaciones verificadas de cuenta y no lo mezclaré con Ads.', 'La esencia está clara: fondos o saldo QCoin cambiaron de forma inesperada. Verificaré ledger, operaciones recientes y receipts antes de concluir.', 'Lo trataré como revisión de seguridad y saldo QCoin, no como queja genérica. Añade detalles si los tienes; si no, empiezo con datos verificados disponibles.'],
    operator: ['Indica objetivo, valor, escala, plazos y contacto preferido.', 'Si necesitas un operador humano, primero recojo contexto comercial y consentimiento de contacto.', 'Puedes dejar email, Telegram o teléfono, o mantener la respuesta dentro de Quantum Messenger.'],
    purchaseOk: ['El evento de compra está verificado y el resultado puede mostrarse de forma segura.', 'El pago o compra está confirmado por receipt; mostraré el resultado útil sin datos internos crudos.', 'La operación figura como exitosa en la fuente verificada.'],
    purchaseFail: ['La compra no se completó en la fuente verificada, así que no fingiré éxito y mostraré el siguiente paso seguro.', 'El pago o compra no está confirmado; el estado será preciso, con ruta de reintento o soporte.', 'La fuente informa una operación fallida, no una compra completada.'],
    unrecognized: ['Todavía no parece una pregunta o solicitud clara.', 'Veo un fragmento, pero no hay suficiente sentido para elegir una comprobación QL7.', 'Con tan pocos símbolos no debo elegir saldo, Ads, VIP o cálculo AI.', 'No voy a adivinar por un punto, un símbolo o una frase rota.'],
    ambiguous: ['Veo una posible dirección, pero aún falta la acción exacta.', 'Esto puede pertenecer a QL7, pero necesito saber qué quieres comprobar.', 'No abro datos de cuenta ni inicio cálculo de mercado por una palabra vaga.', 'Hay señal, pero no suficiente confianza para una tabla o verificación.'],
    casual: ['Podemos hablar un momento y luego volver con suavidad a un paso QL7 útil.', 'Me alegra conversar, pero después conviene elegir el tema abierto o uno nuevo.', 'Puedo sostener una charla breve y luego ayudarte a volver a lo esencial.'],
  }),
})

const FALLBACK_EXTRA = Object.freeze({
  reasons: [
    'Verified facts stay separate from assumptions.',
    'Account data is used only through approved read-only receipts.',
    'Safety, privacy and product limits remain visible.',
    'I keep evidence, confidence and next action in separate lanes.',
    'The response is based on available receipts, not hidden internals.',
    'Unverified signals are treated as context, not as a final conclusion.',
    'The route stays tied to the same production adapter that the user sees.',
    'I avoid raw keys and keep the result human-readable.',
  ],
  disclaimers: [
    'Educational analytics only; this is not financial advice.',
    'This is not financial advice, and no guaranteed profit is implied.',
    'Use this as learning context for your own decision; it is not financial advice.',
    'Risk remains with the user; this support message is not financial advice.',
    'Market movement can change after the checked snapshot, so this is not financial advice.',
    'This explains a scenario, does not promise an outcome, and is not financial advice.',
    'The table is evidence, not an instruction to trade or financial advice.',
    'The answer should be read as product support plus learning context, not financial advice.',
  ],
  next: [
    'Open the available action if you want to inspect details.',
    'Add one detail only if it changes the checked facts.',
    'I can continue from the same topic without starting over.',
    'If the source is unavailable, I will say that directly.',
    'If operator review is needed, the context will stay redacted.',
    'The next step stays inside the approved QL7 route.',
    'I will not ask for private keys, tokens or another person’s data.',
    'A repeated request gets a fresh wording but the same verified meaning.',
  ],
})

const AI_DISCLAIMER_BANK = Object.freeze({
  en: Object.freeze([
    'Educational analytics only; this is not financial advice.',
    'This is learning context, not financial advice or a promise of profit.',
    'Use the scenario for education only; it is not an instruction to trade.',
    'Market risk remains with the user, and this is not financial advice.',
  ]),
  ru: Object.freeze([
    'Это только обучающая аналитика, а не финансовый совет.',
    'Это учебный контекст, не рекомендация к сделке и не гарантия прибыли.',
    'Используйте сценарий для обучения; он не является инструкцией торговать.',
    'Рыночный риск остаётся на пользователе, это не финансовый совет.',
  ]),
  uk: Object.freeze([
    'Це лише навчальна аналітика, а не фінансова порада.',
    'Це навчальний контекст, не інструкція до угоди і не гарантія прибутку.',
    'Використовуйте сценарій для навчання; це не наказ торгувати.',
    'Ринковий ризик залишається на користувачі, це не фінансова порада.',
  ]),
  es: Object.freeze([
    'Solo es analítica educativa, no asesoramiento financiero.',
    'Es contexto de aprendizaje, no una orden de operar ni garantía de beneficio.',
    'Usa el escenario para educación; no es instrucción de trading.',
    'El riesgo de mercado sigue siendo del usuario, no es asesoramiento financiero.',
  ]),
  tr: Object.freeze([
    'Yalnızca eğitim amaçlı analizdir, finansal tavsiye değildir.',
    'Bu öğrenme bağlamıdır; işlem talimatı veya kâr garantisi değildir.',
    'Senaryoyu eğitim için kullanın; trade emri değildir.',
    'Piyasa riski kullanıcıdadır, bu finansal tavsiye değildir.',
  ]),
  ar: Object.freeze([
    'هذا تحليل تعليمي فقط وليس نصيحة مالية.',
    'هذا سياق تعلّمي، وليس أمراً بالتداول أو ضماناً للربح.',
    'استخدم السيناريو للتعليم فقط؛ ليس تعليمات تداول.',
    'تبقى مخاطر السوق على المستخدم، وهذا ليس نصيحة مالية.',
  ]),
  zh: Object.freeze([
    '这只是教育性分析，不是财务建议。',
    '这是学习背景，不是交易指令，也不保证收益。',
    '请把该情景用于学习；它不是下单建议。',
    '市场风险仍由用户承担，这不是财务建议。',
  ]),
  he: Object.freeze([
    'זה ניתוח לימודי בלבד, לא ייעוץ פיננסי.',
    'זה הקשר לימודי, לא הוראת מסחר ולא הבטחת רווח.',
    'השתמשו בתרחיש ללמידה; זו אינה הוראה לסחור.',
    'סיכון השוק נשאר אצל המשתמש, וזה לא ייעוץ פיננסי.',
  ]),
  de: Object.freeze(['Nur Bildungsanalyse, keine Finanzberatung.', 'Das ist Lernkontext, keine Handelsanweisung und kein Gewinnversprechen.']),
  fr: Object.freeze(['Analyse éducative uniquement, pas un conseil financier.', 'C’est un contexte d’apprentissage, pas un ordre de trading ni une garantie de gain.']),
  it: Object.freeze(['Solo analisi educativa, non consulenza finanziaria.', 'È contesto di apprendimento, non ordine di trading né garanzia di profitto.']),
  pt: Object.freeze(['Apenas análise educativa, não aconselhamento financeiro.', 'É contexto de aprendizagem, não ordem de negociação nem garantia de lucro.']),
  pl: Object.freeze(['To tylko analiza edukacyjna, nie porada finansowa.', 'To kontekst do nauki, nie polecenie transakcji ani gwarancja zysku.']),
  ro: Object.freeze(['Doar analiză educațională, nu sfat financiar.', 'Este context de învățare, nu ordin de tranzacționare sau garanție de profit.']),
  nl: Object.freeze(['Alleen educatieve analyse, geen financieel advies.', 'Dit is leercontext, geen handelsopdracht of winstbelofte.']),
  sv: Object.freeze(['Endast utbildande analys, inte finansiell rådgivning.', 'Detta är lärandekontext, inte handelsorder eller vinstlöfte.']),
  no: Object.freeze(['Kun pedagogisk analyse, ikke finansiell rådgivning.', 'Dette er læringskontekst, ikke handelsordre eller gevinstløfte.']),
  da: Object.freeze(['Kun uddannelsesanalyse, ikke finansiel rådgivning.', 'Dette er læringskontekst, ikke handelsordre eller løfte om gevinst.']),
  fi: Object.freeze(['Vain koulutuksellista analyysiä, ei taloudellista neuvontaa.', 'Tämä on oppimiskonteksti, ei kaupankäyntiohje tai tuottolupaus.']),
  cs: Object.freeze(['Pouze vzdělávací analýza, ne finanční rada.', 'Je to učební kontext, ne obchodní pokyn ani záruka zisku.']),
  sk: Object.freeze(['Iba vzdelávacia analýza, nie finančné poradenstvo.', 'Je to učebný kontext, nie obchodný pokyn ani záruka zisku.']),
  hu: Object.freeze(['Csak oktatási elemzés, nem pénzügyi tanács.', 'Ez tanulási kontextus, nem kereskedési utasítás vagy profitgarancia.']),
  bg: Object.freeze(['Само образователен анализ, не финансов съвет.', 'Това е учебен контекст, не търговска инструкция или гаранция за печалба.']),
  sr: Object.freeze(['Samo obrazovna analiza, nije finansijski savet.', 'Ovo je kontekst za učenje, ne nalog za trgovanje ili garancija profita.']),
  hr: Object.freeze(['Samo obrazovna analiza, nije financijski savjet.', 'Ovo je kontekst učenja, ne nalog za trgovanje ili jamstvo dobiti.']),
  sl: Object.freeze(['Samo izobraževalna analiza, ne finančni nasvet.', 'To je učni kontekst, ne trgovalno naročilo ali jamstvo dobička.']),
  el: Object.freeze(['Μόνο εκπαιδευτική ανάλυση, όχι χρηματοοικονομική συμβουλή.', 'Είναι μαθησιακό πλαίσιο, όχι εντολή trading ή εγγύηση κέρδους.']),
  id: Object.freeze(['Hanya analitik edukatif, bukan nasihat finansial.', 'Ini konteks pembelajaran, bukan instruksi trading atau janji untung.']),
  vi: Object.freeze(['Chỉ là phân tích giáo dục, không phải lời khuyên tài chính.', 'Đây là ngữ cảnh học tập, không phải lệnh giao dịch hay bảo đảm lợi nhuận.']),
  hi: Object.freeze(['यह केवल शैक्षिक विश्लेषण है, वित्तीय सलाह नहीं।', 'यह सीखने का संदर्भ है, ट्रेडिंग आदेश या लाभ की गारंटी नहीं।']),
  ur: Object.freeze(['یہ صرف تعلیمی تجزیہ ہے، مالی مشورہ نہیں۔', 'یہ سیکھنے کا سیاق ہے، ٹریڈنگ حکم یا منافع کی ضمانت نہیں۔']),
  fa: Object.freeze(['این فقط تحلیل آموزشی است، نه توصیه مالی.', 'این زمینه آموزشی است، نه دستور معامله یا تضمین سود.']),
  az: Object.freeze(['Yalnız tədris analitikasıdır, maliyyə məsləhəti deyil.', 'Bu öyrənmə kontekstidir, ticarət əmri və ya mənfəət zəmanəti deyil.']),
  ka: Object.freeze(['ეს მხოლოდ სასწავლო ანალიტიკაა, არა ფინანსური რჩევა.', 'ეს არის სასწავლო კონტექსტი, არა სავაჭრო ბრძანება ან მოგების გარანტია.']),
  kk: Object.freeze(['Бұл тек оқу талдауы, қаржылық кеңес емес.', 'Бұл оқу контексті, сауда бұйрығы немесе пайда кепілдігі емес.']),
  uz: Object.freeze(['Bu faqat o‘quv tahlili, moliyaviy maslahat emas.', 'Bu o‘rganish konteksti, savdo buyrug‘i yoki foyda kafolati emas.']),
  ja: Object.freeze(['教育目的の分析のみで、金融助言ではありません。', '学習用の文脈であり、取引指示や利益保証ではありません。']),
  ko: Object.freeze(['교육용 분석일 뿐 금융 조언이 아닙니다.', '학습 맥락이며 거래 지시나 수익 보장이 아닙니다.']),
  th: Object.freeze(['เป็นการวิเคราะห์เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำทางการเงิน.', 'นี่คือบริบทเพื่อการเรียนรู้ ไม่ใช่คำสั่งซื้อขายหรือการรับประกันกำไร.']),
})

function aiDisclaimerRows(locale = 'en') {
  return AI_DISCLAIMER_BANK[ql7Locale(locale)] || FALLBACK_EXTRA.disclaimers
}

function localizedAmplifier(p = null) {
  if (!p) return FALLBACK_EXTRA
  const reasons = dedupe([...ql7Arr(p.ready), ...ql7Arr(p.bridge), ...ql7Arr(p.safety), ...ql7Arr(p.small)])
  const disclaimers = dedupe([...ql7Arr(p.safety), ...ql7Arr(p.bridge), ...ql7Arr(p.mission)])
  const next = dedupe([...ql7Arr(p.choice), ...ql7Arr(p.contact), ...ql7Arr(p.bridge)])
  return {
    reasons: reasons.length ? reasons : FALLBACK_EXTRA.reasons,
    disclaimers: disclaimers.length ? disclaimers : FALLBACK_EXTRA.disclaimers,
    next: next.length ? next : FALLBACK_EXTRA.next,
  }
}

function amplifyRows(rows = [], limit = 1800, p = null) {
  const extra = localizedAmplifier(p)
  return crossTemplates([
    '{base} {reason} {next}',
    '{base} {next} {reason}',
    '{reason} {base} {next}',
    '{base} {reason}',
    '{base} {next}',
    '{base} {disclaimer}',
  ], {
    base: ql7Arr(rows).filter(Boolean),
    reason: extra.reasons,
    disclaimer: extra.disclaimers,
    next: extra.next,
  }, limit)
}

function extraPack(locale, p) {
  const native = EXTRA_NATIVE[locale]
  if (native) return native
  return Object.freeze({
    fresh: dedupe([...p.hear, ...p.small, ...p.choice]),
    continue: dedupe([...p.ready, ...p.bridge, ...p.choice]),
    product: dedupe([...p.bridge, ...p.choice, ...p.safety].map((row) => `${row} {label}.`)),
    table: dedupe([...p.ready, ...p.safety, ...p.bridge, ...p.choice]),
    aiReady: [
      `${p.ready[0] || p.bridge[0] || ''} {symbol} / {timeframe}: {action}, {confidence}, {price}. {reason} {disclaimer}`,
      `${p.bridge[0] || p.ready[0] || ''} {symbol} / {timeframe}: {action}, {confidence}, {price}. {reason} {disclaimer}`,
    ],
    aiQuota: dedupe([...p.ready, ...p.contact, ...p.choice]).map((row) => `${row} AI Box / VIP.`),
    qcoinIncident: dedupe([...p.safety, ...p.ready, ...p.bridge]).map((row) => `${row} QCoin.`),
    operator: dedupe([...p.business, ...p.detail, ...p.contact]),
    purchaseOk: dedupe([...p.ready, ...p.thanks, ...p.bridge]).map((row) => `${row} QCoin / MetaMarket / Ads.`),
    purchaseFail: dedupe([...p.safety, ...p.contact, ...p.bridge]).map((row) => `${row} QCoin / MetaMarket / Ads.`),
    unrecognized: dedupe([...p.small, ...p.choice, ...p.bridge]),
    ambiguous: dedupe([...p.choice, ...p.small, ...p.ready, ...p.bridge]),
    casual: dedupe([...p.playful, ...p.small, ...p.bridge, ...p.mission]),
  })
}

function buildEntryGreetingBank(locale) {
  const p = rawPack(locale)
  const extra = extraPack(locale, p)
  const entryLabels = dedupe([
    ...topicLabelsFor(locale).slice(0, 48),
    'QCoin',
    'VIP',
    'AI Box',
    'MetaMarket',
    'Forum',
    'Quantum Wallet',
    'Gameverse',
    'BattleCoin',
  ])
  const entryFreshGroups = { fresh: extra.fresh, hear: p.hear, steady: p.steady, bridge: p.bridge, small: p.small, choice: p.choice }
  const entryContinueGroups = { continue: extra.continue, ready: p.ready, bridge: p.bridge, small: p.small, choice: p.choice }
  const entryFreshRows = dedupeLimit([
    ...expandEntryRows(extra.fresh, p, entryLabels, 1600),
    ...expandDialogueRows(extra.fresh, p, entryLabels, 1400),
    ...extra.fresh,
    ...cross2(extra.fresh, p.choice),
    ...orderedCross(entryFreshGroups, patterns(['fresh', 'hear', 'steady', 'bridge', 'choice'], 96)),
  ], 1200)
  const entryContinueRows = dedupeLimit([
    ...expandEntryRows(extra.continue, p, entryLabels, 1600),
    ...expandDialogueRows(extra.continue, p, entryLabels, 1400),
    ...extra.continue,
    ...cross2(extra.continue, p.ready),
    ...orderedCross(entryContinueGroups, patterns(['continue', 'ready', 'bridge', 'small', 'choice'], 96)),
  ], 1200)
  return Object.freeze({
    entryGreetingFresh: entryFreshRows,
    entryGreetingContinue: entryContinueRows,
  })
}

function topicLabelPairs(labels = []) {
  const source = ql7Arr(labels).filter(Boolean)
  const out = []
  for (let i = 0; i < source.length; i += 1) {
    for (let j = 0; j < source.length; j += 1) {
      if (i !== j) out.push(`${source[i]} / ${source[j]}`)
    }
  }
  return out.length ? out : ['QL7']
}

function expandDialogueRows(rows = [], p = {}, labels = [], limit = 10000) {
  const base = dedupeLimit(rows, 128)
  const labelRows = topicLabelPairs(labels)
  const templates = [
    '{base} {labelPair}. {hear} {choice}',
    '{hear} {base} {labelPair}. {bridge}',
    '{base} {labelPair}. {choice}',
    '{small} {base} {labelPair}. {choice}',
    '{base} {bridge} {labelPair}.',
    '{base} {small} {labelPair}. {choice}',
  ]
  const axes = {
    base,
    labelPair: labelRows,
    hear: ql7Arr(p.hear).filter(Boolean),
    bridge: ql7Arr(p.bridge).filter(Boolean),
    small: ql7Arr(p.small).filter(Boolean),
    choice: ql7Arr(p.choice).filter(Boolean),
  }
  const seen = new Set()
  const out = []
  const pick = (key, attempt, span = 1) => {
    const values = axes[key]
    return values.length ? values[Math.floor(attempt / span) % values.length] : ''
  }
  const labelSpan = templates.length
  const baseSpan = labelSpan * Math.max(1, labelRows.length)
  for (let attempt = 0; out.length < limit && attempt < limit * 2; attempt += 1) {
    const template = templates[attempt % templates.length]
    const row = renderTemplate(template, {
      base: pick('base', attempt, baseSpan),
      labelPair: pick('labelPair', attempt, labelSpan),
      hear: pick('hear', attempt, 3),
      bridge: pick('bridge', attempt, 7),
      small: pick('small', attempt, 11),
      choice: pick('choice', attempt, 13),
    })
    if (!row) continue
    const key = row.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return Object.freeze(out)
}

function expandEntryRows(rows = [], p = {}, labels = [], limit = 1600) {
  const bases = dedupeLimit(rows, 64)
  const labelRows = dedupeLimit(labels, 64)
  const templates = [
    '{base} {label}. {hear} {bridge} {choice}',
    '{hear} {base} {label}. {steady} {choice}',
    '{base} {label}. {small} {bridge}',
    '{label}: {base} {hear} {choice}',
    '{base} {hear} {label}. {small} {choice}',
    '{small} {base} {label}. {steady} {bridge}',
  ]
  const axes = {
    base: bases,
    label: labelRows,
    hear: ql7Arr(p.hear).filter(Boolean),
    steady: ql7Arr(p.steady).filter(Boolean),
    bridge: ql7Arr(p.bridge).filter(Boolean),
    small: ql7Arr(p.small).filter(Boolean),
    choice: ql7Arr(p.choice).filter(Boolean),
  }
  if (Object.values(axes).some((values) => !values.length)) return Object.freeze([])
  const seen = new Set()
  const out = []
  for (const template of templates) {
    for (const base of axes.base) {
      for (const label of axes.label) {
        for (const hear of axes.hear) {
          for (const steady of axes.steady) {
            for (const bridge of axes.bridge) {
              for (const small of axes.small) {
                for (const choice of axes.choice) {
                  const row = renderTemplate(template, { base, label, hear, steady, bridge, small, choice })
                  const key = row.toLowerCase()
                  if (!row || seen.has(key) || hasAdjacentRepeatedPhrase(row)) continue
                  seen.add(key)
                  out.push(row)
                  if (out.length >= limit) return Object.freeze(out)
                }
              }
            }
          }
        }
      }
    }
  }
  return Object.freeze(out)
}

function buildBank(locale) {
  const p = rawPack(locale)
  const extra = extraPack(locale, p)
  const topicLabels = topicLabelsFor(locale)
  const fallbackLabels = ['qcoin', 'vip', 'ads_campaigns', 'ads_packages', 'exchange_ai', 'profile', 'contact', 'security', 'forum', 'wallet', 'payments', 'metamarket', 'gameverse', 'academy', 'messenger', 'telegram', 'moderation', 'quantum_family', 'battlecoin', 'homepage']
    .map((topic) => getQl7SupportTopicLabel(topic, locale) || topic)
    .filter(Boolean)
  const supportGroups = { hear: p.hear, steady: p.steady, bridge: p.bridge, small: p.small, choice: p.choice }
  const humorGroups = { joke: p.joke, playful: p.playful, small: p.small, bridge: p.bridge, hear: p.hear }
  const businessGroups = { business: p.business, detail: p.detail, contact: p.contact, ready: p.ready, handoff: p.handoff, thanks: p.thanks, dm: p.dm }
  const warningGroups = { boundary: p.boundary, firm: p.firm, safety: p.safety, small: p.small, choice: p.choice }
  const entryGreetingBank = getQl7HumanEntryGreetingBank(locale)
  const productBaseRows = crossTemplates(extra.product, { label: topicLabels }, 1000)
  const productRows = expandDialogueRows([
    ...productBaseRows,
    ...cross2(productBaseRows, p.bridge),
    ...cross2(productBaseRows, p.choice),
  ], p, fallbackLabels, 1000)
  const tableRows = amplifyRows([
    ...extra.table,
    ...cross2(extra.table, p.ready),
    ...orderedCross({ table: extra.table, ready: p.ready, bridge: p.bridge, safety: p.safety }, patterns(['table', 'ready', 'bridge', 'safety'], 48)),
  ], 1000, p)
  const aiAmplifier = localizedAmplifier(p)
  const aiReadyRows = amplifyRows(crossTemplates(extra.aiReady, {
    reason: aiAmplifier.reasons,
    disclaimer: aiDisclaimerRows(locale),
  }, 1000), 1000, p)
  const aiQuotaRows = amplifyRows([
    ...extra.aiQuota,
    ...cross2(extra.aiQuota, p.contact),
    ...cross2(extra.aiQuota, p.choice),
    ...orderedCross({ quota: extra.aiQuota, contact: p.contact, ready: p.ready, choice: p.choice }, patterns(['quota', 'ready', 'contact', 'choice'], 48)),
  ], 1000, p)
  const qcoinIncidentRows = amplifyRows([
    ...extra.qcoinIncident,
    ...cross2(extra.qcoinIncident, p.ready),
    ...cross2(extra.qcoinIncident, p.safety),
    ...orderedCross({ incident: extra.qcoinIncident, ready: p.ready, safety: p.safety, bridge: p.bridge }, patterns(['incident', 'ready', 'safety', 'bridge'], 48)),
  ], 1000, p)
  const operatorRows = amplifyRows([
    ...extra.operator,
    ...cross2(extra.operator, p.contact),
    ...cross2(p.business, extra.operator),
    ...orderedCross({ operator: extra.operator, business: p.business, detail: p.detail, contact: p.contact }, patterns(['business', 'operator', 'detail', 'contact'], 48)),
  ], 1000, p)
  const unrecognizedRows = expandDialogueRows(extra.unrecognized, p, fallbackLabels, 10000)
  const ambiguousRows = expandDialogueRows(extra.ambiguous, p, fallbackLabels, 10000)
  const casualRows = expandDialogueRows(extra.casual, p, fallbackLabels, 10000)
  return Object.freeze({
    emotional: dedupeLimit([
      ...cross3(p.hear, p.steady, p.bridge),
      ...orderedCross(supportGroups, FIVE_SLOT_PATTERNS),
    ], 900),
    socialBoundary: dedupeLimit([
      ...cross3(p.hear, p.mission, p.choice),
      ...orderedCross({ ...supportGroups, mission: p.mission }, patterns(['hear', 'mission', 'steady', 'bridge', 'choice'], 24)),
    ], 800),
    humor: dedupeLimit([
      ...p.joke,
      ...cross2(p.playful, p.small),
      ...orderedCross(humorGroups, HUMOR_PATTERNS),
    ], 900),
    small: dedupeLimit([
      ...p.small,
      ...cross2(p.small, p.bridge),
      ...orderedCross(supportGroups, patterns(['small', 'hear', 'bridge', 'steady', 'choice'], 24)),
    ], 800),
    businessCollectBrief: dedupeLimit([
      ...cross2(p.business, p.detail),
      ...cross2(p.business, p.contact),
      ...cross2(p.detail, p.contact),
      ...orderedCross(businessGroups, BUSINESS_PATTERNS),
    ], 900),
    businessCollectContact: dedupeLimit([
      ...cross2(p.ready, p.contact),
      ...cross2(p.ready, p.handoff),
      ...cross2(p.contact, p.handoff),
      ...orderedCross(businessGroups, patterns(['ready', 'contact', 'business', 'handoff', 'thanks'], 24)),
    ], 700),
    businessHandoffContacts: dedupeLimit([
      ...cross2(p.handoff, p.thanks),
      ...orderedCross(businessGroups, patterns(['handoff', 'thanks', 'business', 'contact'], 16)),
    ], 420),
    businessHandoffDmOnly: dedupeLimit([
      ...cross2(p.handoff, p.dm),
      ...orderedCross(businessGroups, patterns(['handoff', 'dm', 'business', 'thanks'], 16)),
    ], 420),
    businessHandoffNoContacts: dedupeLimit([
      ...cross2(p.handoff, p.contact),
      ...orderedCross(businessGroups, patterns(['handoff', 'contact', 'business', 'thanks'], 16)),
    ], 420),
    boundary: dedupeLimit([
      ...p.boundary,
      ...cross2(p.boundary, p.small),
      ...orderedCross(warningGroups, patterns(['boundary', 'small', 'choice'], 12)),
    ], 360),
    firmWarning: dedupeLimit([
      ...p.firm,
      ...cross2(p.boundary, p.firm),
      ...orderedCross(warningGroups, WARNING_PATTERNS),
    ], 700),
    strictWarning: dedupeLimit([
      ...p.safety,
      ...cross2(p.firm, p.safety),
      ...orderedCross(warningGroups, patterns(['firm', 'safety', 'boundary', 'small', 'choice'], 24)),
    ], 700),
    playfulBridge: dedupeLimit([
      ...p.playful,
      ...cross2(p.playful, p.bridge),
      ...orderedCross({ playful: p.playful, bridge: p.bridge, small: p.small, hear: p.hear }, patterns(['playful', 'bridge', 'small', 'hear'], 16)),
    ], 600),
    entryGreetingFresh: entryGreetingBank.entryGreetingFresh,
    entryGreetingContinue: entryGreetingBank.entryGreetingContinue,
    productHowToBridge: productRows,
    dataTableIntro: tableRows,
    aiRecommendationReady: aiReadyRows,
    aiQuotaExhausted: aiQuotaRows,
    qcoinIncident: qcoinIncidentRows,
    operatorContactProbe: operatorRows,
    purchaseSuccess: amplifyRows([
      ...extra.purchaseOk,
      ...cross2(extra.purchaseOk, p.thanks),
      ...orderedCross({ purchase: extra.purchaseOk, ready: p.ready, thanks: p.thanks, bridge: p.bridge }, patterns(['purchase', 'ready', 'thanks', 'bridge'], 48)),
    ], 900, p),
    purchaseFailure: amplifyRows([
      ...extra.purchaseFail,
      ...cross2(extra.purchaseFail, p.contact),
      ...orderedCross({ purchase: extra.purchaseFail, safety: p.safety, contact: p.contact, bridge: p.bridge }, patterns(['purchase', 'safety', 'contact', 'bridge'], 48)),
    ], 900, p),
    unrecognizedInput: unrecognizedRows,
    ambiguousMaterialClarifier: ambiguousRows,
    casualConversationBridge: casualRows,
  })
}

const CACHE = new Map()
const ENTRY_GREETING_CACHE = new Map()
const PRODUCT_BRIDGE_CACHE = new Map()
let COVERAGE_CACHE = null

export function getQl7HumanVariationBank(locale = 'en') {
  const normalized = ql7Locale(locale)
  if (!CACHE.has(normalized)) CACHE.set(normalized, buildBank(normalized))
  return CACHE.get(normalized)
}

export function getQl7HumanEntryGreetingBank(locale = 'en') {
  const normalized = ql7Locale(locale)
  if (!ENTRY_GREETING_CACHE.has(normalized)) ENTRY_GREETING_CACHE.set(normalized, buildEntryGreetingBank(normalized))
  return ENTRY_GREETING_CACHE.get(normalized)
}

export function listQl7HumanVariationCategories() {
  return CATEGORIES
}

export function pickQl7HumanVariation(locale = 'en', category = 'small', options = {}) {
  const bank = getQl7HumanVariationBank(locale)
  const rows = ql7Arr(bank[category] || bank.small || [])
  if (!rows.length) return ''
  const seen = new Set(ql7Arr(options.ledger?.responseFingerprints))
  const seed = `${locale}:${category}:${ql7Str(options.seed)}:${ql7Arr(options.ledger?.responseFingerprints).slice(-8).join('|')}`
  const start = Number.parseInt(ql7StableHash(seed), 16) % rows.length
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[(start + i) % rows.length]
    if (!seen.has(ql7StableHash(row.toLowerCase()))) return row
  }
  return rows[start]
}

export function pickQl7ProductHowToBridge(locale = 'en', topic = 'support_system', options = {}) {
  const normalized = ql7Locale(locale)
  const cleanTopic = ql7Str(topic) || 'support_system'
  const key = `${normalized}:${cleanTopic}`
  if (!PRODUCT_BRIDGE_CACHE.has(key)) {
    const p = rawPack(normalized)
    const extra = extraPack(normalized, p)
    const label = getQl7SupportTopicLabel(cleanTopic, normalized) || cleanTopic
    PRODUCT_BRIDGE_CACHE.set(key, expandDialogueRows(crossTemplates(extra.product, { label: [label] }, 1000), p, [label, 'QL7'], 1000))
  }
  const rows = PRODUCT_BRIDGE_CACHE.get(key)
  if (!rows.length) return ''
  const seen = new Set(ql7Arr(options.ledger?.responseFingerprints))
  const seed = `${normalized}:${cleanTopic}:product-bridge:${ql7Str(options.seed)}:${ql7Arr(options.ledger?.responseFingerprints).slice(-8).join('|')}`
  const start = Number.parseInt(ql7StableHash(seed), 16) % rows.length
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[(start + i) % rows.length]
    if (!seen.has(ql7StableHash(row.toLowerCase()))) return row
  }
  return rows[start]
}

export function getQl7HumanVariationCoverage() {
  if (COVERAGE_CACHE) return COVERAGE_CACHE
  const rows = QL7_SUPPORT_ALL_LOCALES.map((locale) => {
    const bank = getQl7HumanVariationBank(locale)
    const categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category, ql7Arr(bank[category]).length]))
    const totalVariants = Object.values(categoryCounts).reduce((sum, value) => sum + Number(value || 0), 0)
    return Object.freeze({ locale, totalVariants, categoryCounts })
  })
  COVERAGE_CACHE = Object.freeze({
    version: QL7_SUPPORT_HUMAN_VARIATION_VERSION,
    localeCount: rows.length,
    categories: CATEGORIES,
    totalVariants: rows.reduce((sum, row) => sum + row.totalVariants, 0),
    minVariantsPerLocale: Math.min(...rows.map((row) => row.totalVariants)),
    ok: rows.length === QL7_SUPPORT_ALL_LOCALES.length && rows.every((row) => row.totalVariants >= 7000 && CATEGORIES.every((category) => row.categoryCounts[category] > 0)),
    rows: Object.freeze(rows),
  })
  return COVERAGE_CACHE
}
