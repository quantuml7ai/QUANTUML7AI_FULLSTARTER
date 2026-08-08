function str(value) { return String(value ?? '').trim() }
function norm(value = '') { return str(value).normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim() }
function boundary(source) { return new RegExp(`(?:^|[^\\p{L}\\p{N}_])(?:${source})(?=$|[^\\p{L}\\p{N}_])`, 'iu') }
function hashInt(value = '') { let h = 2166136261 >>> 0; for (const ch of str(value) || 'social') { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0 } return h >>> 0 }
function pick(list = [], seed = '') { const rows = (Array.isArray(list) ? list : []).filter(Boolean); return rows.length ? rows[hashInt(seed) % rows.length] : '' }

const MATERIAL_TOPIC = /(?:quantum\s+l7|l7\s+blockchain|crypto\s*radar|crypto\s+news|market\s+news|quantum\s+exchange|ai\s+(?:box|quota)|battle\s*coin|battlecoin|(?:real[- ]?time\s+)?battle\s+chat|futures?|academy|exam|gameverse|metastudio|metaverse|quantum\s+(?:universe|family|messenger|search)|geo\s*detect|geodetect|meta\s*market|metamarket|account\s+deletion|delete\s+(?:my\s+)?account|data\s+cleanup|authorization|authentication|sign\s*in|log\s*in|roadmap|system\s+status|runtime\s+status|localization|deep\s*translate|accessibility|privacy|security|partnership|investment|push\s+notifications?|quests?|navigation|удал\p{L}*\s+аккаунт|удален\p{L}*\s+аккаунт|очистк\p{L}*\s+данн\p{L}*|авторизац\p{L}*|безопасн\p{L}*|конфиденциальн\p{L}*|дорожн\p{L}*\s+карт\p{L}*|локализац\p{L}*|перевод\p{L}*|доступност\p{L}*|видал\p{L}*\s+акаунт|очищенн\p{L}*\s+даних|авторизац\p{L}*|безпек\p{L}*|конфіденційн\p{L}*|дорожн\p{L}*\s+карт\p{L}*|silme|hesabımı\s+sil|gizlilik|güvenlik|yol\s+haritası|çeviri|erişilebilirlik|حذف\s+الحساب|تنظيف\s+البيانات|الخصوصية|الأمان|خارطة\s+الطريق|الترجمة|إمكانية\s+الوصول|删除账户|账户删除|数据清理|隐私|安全|路线图|翻译|无障碍|מחיקת\s+חשבון|ניקוי\s+נתונים|פרטיות|אבטחה|מפת\s+דרכים|תרגום|נגישות)/iu
const MATERIAL = /(?:q\s*-?coin|qcoin|кьюкоин|кюкоин|баланс|кошел|wallet|payment|плат[её]ж|vip|реклам|advertis|campaign|package|пакет|форум|forum|пост|thread|модерац|жалоб|обжал|апелляц|report|complaint|appeal|filed\s+(?:a\s+)?complaint|profile|профил|telegram|exchange|бирж|battlecoin|academy|академ|metamarket|gameverse|geodetect|push|подписк|广告|套餐|活动|钱包|余额|论坛|举报|פרסום|חבילה|קמפיין|ארנק|יתרה|פורום|דיווח|إعلان|باقة|حملة|محفظة|رصيد|منتدى|بلاغ|reklam|paket|kampanya|cüzdan|bakiye|forum|paquete|publicidad|campaña|saldo|billetera|anuncio)/iu
const PATTERNS = Object.freeze({
  greeting: boundary(String.raw`привет(?:ик|ствую)?|здра(?:вствуй(?:те)?|сте)|доброе\s+(?:утро|утречко)|добрый\s+(?:день|вечер)|доброго\s+(?:дня|вечера)|салют|хай|хеллоу|привіт|вітаю|добрий\s+(?:день|вечір)|доброго\s+(?:ранку|дня|вечора)|hello|hi|hey|hiya|good\s+(?:morning|afternoon|evening)|greetings|hola|buen(?:os\s+días|as\s+tardes|as\s+noches|as)|qué\s+onda|merhaba|selam|günaydın|iyi\s+(?:günler|akşamlar)|مرحبا|مرحباً|أهلا|أهلاً|صباح\s+الخير|مساء\s+الخير|你好|您好|早上好|晚上好|嗨|שלום|היי|בוקר\s+טוב|ערב\s+טוב`),
  farewell: boundary(String.raw`пока|до\s+свидания|до\s+встречи|всего\s+доброго|увидимся|бувай|до\s+побачення|bye|goodbye|see\s+you|take\s+care|adiós|hasta\s+luego|nos\s+vemos|görüşürüz|hoşça\s+kal|مع\s+السلامة|إلى\s+اللقاء|再见|回头见|להתראות|ביי`),
  gratitude: boundary(String.raw`спасибо|спасибки|благодарю|мерси|дякую|щиро\s+дякую|thanks?|thank\s+you|thx|appreciate\s+it|gracias|muchas\s+gracias|teşekkür(?:ler|\s+ederim)?|sağ\s+ol|شكرا|شكراً|ممتن|谢谢|多谢|非常感谢|十分感谢|תודה|תודה\s+רבה`),
  appreciation: boundary(String.raw`ты\s+(?:(?:реально|правда|очень|такой)\s+)*(?:крут|классн|умн|молодец|красавчик|хорош|лучший)|вы\s+(?:крут|классн|умн|молодцы|хорош)|обожаю\s+тебя|ти\s+(?:крут|класн|розумн|молодець)|you(?:\x27re|\s+are)\s+(?:(?:really|very|so)\s+)*(?:great|amazing|smart|awesome|the\s+best|helpful)(?:\s+(?:and\s+)?(?:great|amazing|smart|awesome|helpful))*|good\s+(?:job|bot)|well\s+done|eres\s+(?:genial|increíble|inteligente)|muy\s+bien|harikasın|çok\s+iyisin|أنت\s+(?:رائع|ذكي|ممتاز)|أحسنت|你(?:很|真)?(?:棒|聪明|厉害)(?:也很有帮助)?|你很聪明也很有帮助|你很聪明也很棒|做得好|אתה\s+(?:נהדר|חכם|אלוף)|כל\s+הכבוד`),
  wellbeing_check: boundary(String.raw`как\s+(?:ты|дела|жизнь|настроение)|что\s+нового|как\s+поживаешь|як\s+(?:ти|справи|життя)|how\s+are\s+you|how(?:\x27s|\s+is)\s+it\s+going|what(?:\x27s|\s+is)\s+up|qué\s+tal|cómo\s+estás|cómo\s+va|nasılsın|ne\s+haber|كيف\s+حال(?:ك|كِ)|ما\s+الأخبار|你好吗|最近怎么样|מה\s+שלומך|מה\s+נשמע`),
  emotional_support: boundary(String.raw`мне\s+(?:страшно|тревожно|грустно|тяжело|плохо|обидно|одиноко)|я\s+(?:переживаю|расстроен|расстроена|злюсь|устал|устала)|меня\s+это\s+(?:бесит|пугает|тревожит)|(?:мне\s+)?(?:немного\s+)?тревожно|просто\s+(?:немного\s+)?тревожно|мені\s+(?:страшно|тривожно|сумно|важко)|i(?:\x27m|\s+am)\s+(?:afraid|anxious|sad|upset|angry|tired|worried)|i\s+feel\s+(?:afraid|anxious|sad|upset|angry|tired|worried)(?:\s+and\s+(?:afraid|anxious|sad|upset|angry|tired|worried))*|this\s+makes\s+me\s+(?:angry|nervous|sad)|me\s+siento\s+(?:mal|triste|ansioso|enojado)|estoy\s+(?:preocupado|preocupada|enfadado|enfadada)|korkuyorum|endişeliyim|üzgünüm|sinirliyim|أنا\s+(?:خائف|قلق|حزين|غاضب|متعب)|هذا\s+يزعجني|我(?:很|有点)?(?:害怕|焦虑|难过|生气|累)(?:也很(?:害怕|焦虑|难过|生气|累))?|אני\s+(?:מפחד|מודאג|עצוב|כועס|עייף)|זה\s+מטריד\s+אותי`),
  casual_chat: boundary(String.raw`поговори\s+со\s+мной|давай\s+(?:немного\s+|чуть-чуть\s+)?поболтаем|поболтаем\s+(?:немного|чуть-чуть)|мне\s+скучно|расскажи\s+что-нибудь|просто\s+поболтать|давай\s+поговорим|поговори\s+зі\s+мною|давай\s+(?:трохи\s+)?поговоримо|мені\s+нудно|chat\s+with\s+me|let(?:\x27s|\s+us)\s+chat|chat\s+(?:for\s+)?a\s+(?:bit|while)|i(?:\x27m|\s+am)\s+bored|tell\s+me\s+something|hablemos|estoy\s+aburrido|charla\s+conmigo|sohbet\s+edelim|sıkıldım|حدثني|دعنا\s+نتحدث|أنا\s+ملل|陪我聊聊|陪我聊一会儿|陪我聊一会|我很无聊|聊点什么|בוא\s+נדבר|משעמם\s+לי|ספר\s+לי\s+משהו`),
  apology: boundary(String.raw`извини(?:те)?|простите|сорри|прошу\s+прощения|вибач(?:те)?|перепрошую|sorry|my\s+apologies|excuse\s+me|perd[oó]n|lo\s+siento|özür\s+dilerim|pardon|آسف|عذراً|抱歉|对不起|סליחה|מצטער`),
  confusion: boundary(String.raw`ничего\s+не\s+понимаю|я\s+запутал(?:ся|ась)|непонятно|объясни\s+проще|не\s+могу\s+разобраться|нічого\s+не\s+розумію|я\s+заплутався|i\s+do\s+not\s+understand|i(?:\x27m|\s+am)\s+confused|this\s+is\s+confusing|explain\s+simply|no\s+entiendo|estoy\s+confundido|no\s+lo\s+entiendo|anlamıyorum|kafam\s+karıştı|لا\s+أفهم|أنا\s+مرتبك|اشرح\s+ببساطة|我不明白|我搞糊涂了|请简单解释|אני\s+לא\s+מבין|אני\s+מבולבל|תסביר\s+פשוט`),
  success_confirmation: boundary(String.raw`вс[её]\s+(?:получилось|работает|решено|готово)|проблема\s+решена|теперь\s+вс[её]\s+нормально|усе\s+працює|питання\s+вирішено|it\s+works\s+now|problem\s+solved|all\s+good\s+now|ya\s+funciona|problema\s+resuelto|artık\s+çalışıyor|sorun\s+çözüldü|تم\s+حل\s+المشكلة|يعمل\s+الآن|现在可以了|问题解决了|עכשיו\s+זה\s+עובד|הבעיה\s+נפתרה`),
  impatience: boundary(String.raw`сколько\s+можно\s+ждать|ну\s+и\s+долго|почему\s+так\s+долго|я\s+устал\s+ждать|скільки\s+можна\s+чекати|чому\s+так\s+довго|why\s+is\s+this\s+taking\s+so\s+long|how\s+long\s+do\s+i\s+have\s+to\s+wait|this\s+is\s+too\s+slow|por\s+qué\s+tarda\s+tanto|cuánto\s+hay\s+que\s+esperar|neden\s+bu\s+kadar\s+uzun\s+sürüyor|daha\s+ne\s+kadar\s+bekleyeceğim|لماذا\s+يستغرق\s+وقتاً\s+طويلاً|كم\s+سأنتظر|为什么这么慢|还要等多久|למה\s+זה\s+לוקח\s+כל\s+כך\s+הרבה\s+זמן|כמה\s+עוד\s+לחכות`),
})

export const QL7_SUPPORT_SOCIAL_ACTS_V11 = Object.freeze(['greeting', 'farewell', 'gratitude', 'appreciation', 'wellbeing_check', 'emotional_support', 'casual_chat', 'apology', 'confusion', 'success_confirmation', 'impatience'])
export function isQl7SupportSocialActV11(value = '') { return QL7_SUPPORT_SOCIAL_ACTS_V11.includes(str(value)) }
export function classifyQl7SupportSocialActV11(text = '', { allowMaterialPrefix = false } = {}) {
  const value = norm(text)
  if (!value) return null
  const material = MATERIAL.test(value) || MATERIAL_TOPIC.test(value)
  for (const act of ['success_confirmation', 'farewell', 'gratitude', 'appreciation', 'apology', 'emotional_support', 'confusion', 'impatience', 'wellbeing_check', 'casual_chat', 'greeting']) {
    if (!PATTERNS[act].test(value)) continue
    if (material && !allowMaterialPrefix) return Object.freeze({ act: null, prefixAct: act, material: true, evidence: [`social-prefix:${act}`] })
    return Object.freeze({ act, prefixAct: '', material: false, evidence: [`social:${act}`] })
  }
  return null
}

const COPY = Object.freeze({
  en: {
    greeting: ['Hello. It is good to hear from you. How are you, and what would you like help with today?', 'Hi. I am here with you. We can talk for a moment, then focus on whatever you want to understand or solve.', 'Good to see you. Tell me what brought you here today.'],
    farewell: ['Take care. I am glad we could talk. When you return, we can continue with a fresh start.', 'Goodbye for now. I will be here when another question comes up.'],
    gratitude: ['You are welcome. I am glad I could help. Is there anything else worth checking before we finish?', 'Gladly. Tell me if one more detail remains, otherwise we can close this question.'],
    wellbeing_check: ['I am doing well and fully present with you. More importantly, how are you — and is there something in QL7 you want us to sort out?', 'I am here, steady and ready. Tell me how your day is going, then we can turn to whatever you need help with.'],
    emotional_support: ['I am sorry this is weighing on you. We do not have to rush: tell me what happened, and I will help separate the emotional pressure from the part we can actually solve.', 'That sounds difficult. Take it one step at a time with me: what happened, and which result would make the situation feel safer or clearer?'],
    casual_chat: ['I can stay with you for a little friendly conversation. This channel is mainly built to solve real QL7 questions, so after a moment tell me what would be useful to explore.', 'A little conversation is welcome. I am best when we connect it to something useful — a feature, a status, a problem, or a question you want explained.'],
    casual_boundary: ['I would gladly keep chatting, but this support channel intentionally keeps my conversation range focused on useful solutions. Choose a direction below, or describe the real question in your own words.'],
    appreciation: ['Thank you — that is kind of you. I am glad the conversation feels useful. What shall we work on next?', 'I appreciate that. Let us keep the good momentum: what would you like to understand or check now?'],
    apology: ['No apology is needed. We can simply continue from the part that matters now.', 'It is all right. Tell me what you want to correct or continue.'],
    confusion: ['I understand. Let us remove the noise and take one clear point at a time. What is the first thing that does not make sense?', 'That is okay — complex systems can be confusing. Tell me the result you wanted, and I will explain the path in plain language.'],
    success_confirmation: ['Excellent — I am glad it is working. We can consider this question resolved, unless there is one more thing you want to verify.', 'Good news. I will treat the issue as resolved; tell me if you want a final check or help with something else.'],
    impatience: ['I understand that the wait is frustrating. I will keep the answer focused: tell me which result is still missing, and we will check that exact point.', 'You are right to ask for clarity. Let us identify the current state and the next concrete step without repeating the whole story.'],
  },
  ru: {
    greeting: ['Здравствуйте. Рад вас слышать. Как вы и с чем помочь сегодня?', 'Привет. Я на связи. Можем немного поговорить, а затем спокойно разобраться с тем, что вы хотите понять или решить.', 'Добрый день. Расскажите, что привело вас сегодня.'],
    farewell: ['Берегите себя. Рад был помочь. При следующем входе начнём с чистого и понятного шага.', 'До встречи. Когда появится новый вопрос, я снова буду на связи.'],
    gratitude: ['Пожалуйста. Рад, что оказался полезен. Осталось что-нибудь проверить перед завершением?', 'Всегда пожалуйста. Если важная деталь ещё осталась — скажите, иначе можем спокойно закрыть вопрос.'],
    wellbeing_check: ['У меня всё хорошо — я здесь и внимательно вас слушаю. А как вы? Если что-то тревожит в QL7, разберём это спокойно.', 'Я в порядке и полностью в этом диалоге. Расскажите, как ваше настроение, а потом посмотрим, чем я могу быть полезен.'],
    emotional_support: ['Мне жаль, что вам сейчас тяжело. Не будем спешить: расскажите, что произошло, и я помогу отделить переживание от той части, которую можно реально решить.', 'Понимаю, это может давить. Давайте по одному шагу: что случилось и какой результат помог бы почувствовать больше ясности или спокойствия?'],
    casual_chat: ['Немного по-дружески поговорить можно. Этот канал в первую очередь создан для решения вопросов по QL7, поэтому после пары слов расскажите, что было бы полезно разобрать.', 'Я не против короткой беседы. Лучше всего я помогаю, когда мы связываем её с понятной задачей: функцией, статусом, проблемой или вопросом.'],
    casual_boundary: ['Я бы с удовольствием продолжил свободную беседу, но в этом канале мой разговорный диапазон специально направлен на полезное решение вопросов. Выберите направление ниже или опишите настоящий вопрос своими словами.'],
    appreciation: ['Спасибо, это очень приятно. Рад, что разговор получается полезным. Что разберём дальше?', 'Ценю ваши слова. Давайте сохраним хороший темп — что хотите понять или проверить сейчас?'],
    apology: ['Извиняться не за что. Давайте просто продолжим с того места, которое сейчас важно.', 'Всё в порядке. Скажите, что хотите уточнить, исправить или продолжить.'],
    confusion: ['Понимаю. Давайте уберём лишний шум и разложим всё по одному понятному шагу. Что именно сейчас непонятно первым?', 'Ничего страшного — сложная система действительно может запутать. Скажите, какой результат вы хотели получить, и я объясню путь простыми словами.'],
    success_confirmation: ['Отлично, рад, что всё заработало. Буду считать вопрос решённым, если больше ничего не нужно проверить.', 'Хорошая новость. Зафиксируем результат как успешный; при желании можем сделать последнюю контрольную проверку.'],
    impatience: ['Понимаю, ожидание раздражает. Давайте без повторов: скажите, какого результата всё ещё нет, и проверим именно эту точку.', 'Вы вправе хотеть ясности. Сейчас определим фактическое состояние и следующий конкретный шаг.'],
  },
  uk: {
    greeting: ['Вітаю. Радий вас чути. Як ви і з чим допомогти сьогодні?', 'Привіт. Я на зв’язку. Можемо трохи поговорити, а потім спокійно розібрати те, що ви хочете зрозуміти або вирішити.', 'Добрий день. Розкажіть, що привело вас сьогодні.'],
    farewell: ['Бережіть себе. Радий був допомогти. Наступного разу почнемо з нового зрозумілого кроку.', 'До зустрічі. Коли з’явиться нове питання, я знову буду на зв’язку.'],
    gratitude: ['Будь ласка. Радий, що зміг допомогти. Залишилося щось перевірити перед завершенням?', 'Завжди радий допомогти. Якщо лишилася важлива деталь — скажіть, інакше можемо завершити питання.'],
    wellbeing_check: ['У мене все добре — я тут і уважно вас слухаю. А як ви? Якщо щось турбує в QL7, розберемо це спокійно.', 'Я в порядку й повністю в цьому діалозі. Розкажіть, як ваш настрій, а потім подивимося, чим я можу допомогти.'],
    emotional_support: ['Мені шкода, що вам зараз важко. Не поспішаймо: розкажіть, що сталося, і я допоможу відокремити переживання від того, що можна реально вирішити.', 'Розумію, це може тиснути. Давайте крок за кроком: що сталося і який результат додав би ясності або спокою?'],
    casual_chat: ['Трохи дружньої розмови — цілком нормально. Цей канал насамперед створений для вирішення питань QL7, тож потім скажіть, що було б корисно розібрати.', 'Я не проти короткої бесіди. Найкраще я допомагаю, коли ми пов’язуємо її з функцією, статусом, проблемою чи запитанням.'],
    casual_boundary: ['Я б із радістю продовжив вільну розмову, але в цьому каналі мій діапазон спеціально зосереджений на корисному вирішенні питань. Оберіть напрям нижче або опишіть справжнє запитання своїми словами.'],
    appreciation: ['Дякую, це дуже приємно. Радий, що розмова корисна. Що розберемо далі?'],
    apology: ['Не потрібно вибачатися. Просто продовжимо з того, що зараз важливо.'],
    confusion: ['Розумію. Давайте приберемо зайве й розкладемо все по одному зрозумілому кроку. Що саме незрозуміло першим?'],
    success_confirmation: ['Чудово, радий, що все запрацювало. Вважатиму питання вирішеним, якщо більше нічого не треба перевірити.'],
    impatience: ['Розумію, очікування дратує. Скажіть, якого результату досі немає, і перевіримо саме цю точку.'],
  },
  es: {
    greeting: ['Hola. Me alegra saber de ti. ¿Cómo estás y en qué puedo ayudarte hoy?', 'Buenas. Estoy aquí contigo. Podemos conversar un momento y luego centrarnos en lo que quieras entender o resolver.'],
    farewell: ['Cuídate. Me alegra haber ayudado. Cuando vuelvas, empezaremos con un paso nuevo y claro.', 'Hasta pronto. Estaré aquí cuando aparezca otra pregunta.'],
    gratitude: ['De nada. Me alegra haber sido útil. ¿Queda algo importante por comprobar antes de terminar?', 'Con gusto. Si queda un detalle, dímelo; si no, podemos cerrar la consulta con tranquilidad.'],
    wellbeing_check: ['Estoy bien y completamente presente contigo. ¿Y tú? Si algo te preocupa en QL7, lo revisaremos con calma.', 'Estoy aquí, atento y estable. Cuéntame cómo estás y después veremos en qué puedo ayudarte.'],
    emotional_support: ['Siento que esto te esté pesando. No hace falta correr: cuéntame qué ocurrió y separaré contigo la preocupación de la parte que podemos resolver.', 'Suena difícil. Vamos paso a paso: ¿qué pasó y qué resultado te daría más claridad o tranquilidad?'],
    casual_chat: ['Podemos conversar un poco de forma amistosa. Este canal está pensado sobre todo para resolver preguntas reales de QL7; después dime qué sería útil explorar.', 'Una charla breve está bien. Soy más útil cuando la conectamos con una función, un estado, un problema o una pregunta concreta.'],
    casual_boundary: ['Me gustaría seguir conversando libremente, pero este canal mantiene mi alcance enfocado en soluciones útiles. Elige una dirección o describe la pregunta real con tus palabras.'],
    appreciation: ['Gracias, es muy amable. Me alegra que la conversación sea útil. ¿Qué vemos ahora?'],
    apology: ['No hace falta disculparse. Continuemos con lo que importa ahora.'],
    confusion: ['Lo entiendo. Quitaremos el ruido y veremos un punto claro cada vez. ¿Qué es lo primero que no se entiende?'],
    success_confirmation: ['Excelente, me alegra que funcione. Consideraré el asunto resuelto salvo que quieras comprobar algo más.'],
    impatience: ['Entiendo que la espera molesta. Dime qué resultado sigue faltando y revisaremos exactamente ese punto.'],
  },
  tr: {
    greeting: ['Merhaba. Sizi duymak güzel. Nasılsınız ve bugün neye yardımcı olabilirim?', 'Selam. Buradayım. Biraz konuşabilir, sonra anlamak veya çözmek istediğiniz konuya odaklanabiliriz.'],
    farewell: ['Kendinize iyi bakın. Yardımcı olabildiysem ne mutlu. Yeniden geldiğinizde temiz ve açık bir adımla başlarız.', 'Görüşmek üzere. Yeni bir soru olduğunda burada olacağım.'],
    gratitude: ['Rica ederim. Yardımcı olabildiğime sevindim. Bitirmeden önce kontrol edilecek başka bir şey var mı?', 'Memnuniyetle. Bir ayrıntı kaldıysa söyleyin; yoksa konuyu rahatça kapatabiliriz.'],
    wellbeing_check: ['İyiyim ve tüm dikkatimle buradayım. Siz nasılsınız? QL7 içinde sizi düşündüren bir şey varsa sakinçe inceleyelim.', 'Buradayım, dikkatliyim ve hazırım. Önce nasıl olduğunuzu anlatın, sonra ne konuda yardımcı olabileceğimize bakalım.'],
    emotional_support: ['Bunun sizi zorlamasına üzüldüm. Acele etmeyelim: ne olduğunu anlatın, duygusal yükü çözebileceğimiz somut parçadan birlikte ayıralım.', 'Bu zor görünüyor. Adım adım gidelim: ne oldu ve hangi sonuç size daha fazla netlik veya güven verirdi?'],
    casual_chat: ['Biraz dostça sohbet edebiliriz. Bu kanal esas olarak gerçek QL7 sorularını çözmek için tasarlandı; birazdan neyi incelemenin yararlı olacağını söyleyin.', 'Kısa bir sohbet güzel. Onu bir özellik, durum, sorun veya açıklanmasını istediğiniz bir konuyla bağladığımızda en çok yardımcı olurum.'],
    casual_boundary: ['Sohbete devam etmek isterdim, ancak bu destek kanalında konuşma alanım özellikle yararlı çözümlere odaklanır. Aşağıdan bir yön seçin veya gerçek soruyu kendi sözlerinizle anlatın.'],
    appreciation: ['Teşekkür ederim, çok naziksiniz. Konuşmanın yararlı olmasına sevindim. Sırada neye bakalım?'],
    apology: ['Özür dilemenize gerek yok. Şu anda önemli olan yerden devam edelim.'],
    confusion: ['Anlıyorum. Gereksiz ayrıntıları ayırıp tek bir açık adımdan başlayalım. İlk olarak hangi bölüm anlaşılmıyor?'],
    success_confirmation: ['Harika, çalışmasına sevindim. Başka bir kontrol gerekmiyorsa konuyu çözülmüş sayacağım.'],
    impatience: ['Beklemenin can sıkıcı olduğunu anlıyorum. Hangi sonucun hâlâ eksik olduğunu söyleyin; tam o noktayı kontrol edelim.'],
  },
  ar: {
    greeting: ['مرحباً. يسعدني سماعك. كيف حالك، وبماذا أستطيع مساعدتك اليوم؟', 'أهلاً بك. أنا هنا معك. يمكننا التحدث قليلاً ثم التركيز على ما تريد فهمه أو حله.'],
    farewell: ['اعتن بنفسك. سعيد لأنني استطعت المساعدة. عندما تعود سنبدأ بخطوة جديدة وواضحة.', 'إلى اللقاء. سأكون هنا عندما يظهر سؤال آخر.'],
    gratitude: ['على الرحب والسعة. سعيد لأنني كنت مفيداً. هل بقي شيء مهم نتحقق منه قبل أن ننهي؟', 'بكل سرور. إن بقي تفصيل أخبرني، وإلا يمكننا إنهاء السؤال بهدوء.'],
    wellbeing_check: ['أنا بخير وحاضر معك باهتمام كامل. كيف حالك أنت؟ إذا كان هناك ما يقلقك في QL7 فسنراجعه بهدوء.', 'أنا هنا ومستعد. أخبرني كيف تشعر، ثم نرى ما الذي يمكنني مساعدتك فيه.'],
    emotional_support: ['يؤسفني أن هذا يضغط عليك. لا حاجة للاستعجال: اشرح ما حدث وسأساعدك على فصل القلق عن الجزء الذي نستطيع حله فعلاً.', 'يبدو الأمر صعباً. لنأخذه خطوة خطوة: ماذا حدث، وما النتيجة التي ستمنحك وضوحاً أو طمأنينة أكبر؟'],
    casual_chat: ['يمكننا أن نتحدث قليلاً بلطف. هذه القناة مخصصة أساساً لحل أسئلة QL7 الحقيقية، وبعد لحظة أخبرني بما سيكون مفيداً استكشافه.', 'المحادثة القصيرة مرحب بها. أكون أكثر فائدة عندما نربطها بميزة أو حالة أو مشكلة أو سؤال واضح.'],
    casual_boundary: ['يسعدني استمرار الحديث، لكن نطاقي في قناة الدعم هذه موجّه عمداً إلى الحلول المفيدة. اختر اتجاهاً أدناه أو اشرح السؤال الحقيقي بكلماتك.'],
    appreciation: ['شكراً لك، هذا لطف منك. يسعدني أن الحوار مفيد. ما الذي نراجعه بعد ذلك؟'],
    apology: ['لا حاجة للاعتذار. لنكمل من النقطة المهمة الآن.'],
    confusion: ['أتفهم ذلك. لنزيل التعقيد ونبدأ بنقطة واضحة واحدة. ما أول شيء غير مفهوم؟'],
    success_confirmation: ['ممتاز، يسعدني أنه يعمل الآن. سأعتبر الموضوع محلولاً ما لم ترغب في فحص شيء آخر.'],
    impatience: ['أتفهم أن الانتظار مزعج. أخبرني بالنتيجة التي ما زالت مفقودة وسنفحص تلك النقطة تحديداً.'],
  },
  zh: {
    greeting: ['你好，很高兴收到你的消息。你今天怎么样，需要我帮你处理什么？', '欢迎。我在这里。我们可以先聊两句，再专注于你想了解或解决的事情。'],
    farewell: ['保重，很高兴能帮上忙。下次回来时，我们会从一个新的清晰步骤开始。', '再见。有新问题时，我会继续在这里。'],
    gratitude: ['不客气，很高兴对你有帮助。结束前还有需要核对的内容吗？', '不用谢。如果还有一个重要细节，请告诉我；否则我们可以安心结束。'],
    wellbeing_check: ['我很好，也在认真听你说。你怎么样？如果 QL7 里有什么让你担心，我们可以慢慢理清。', '我在这里，状态稳定，也随时准备帮助你。先说说你最近怎么样，然后我们看看能解决什么。'],
    emotional_support: ['听起来这件事让你很难受。我们不用急：告诉我发生了什么，我会帮你把情绪压力和能够实际解决的部分分开。', '这确实不容易。我们一步一步来：发生了什么，怎样的结果会让你更安心或更清楚？'],
    casual_chat: ['可以先轻松聊一会儿。这个频道主要用于解决真实的 QL7 问题，聊几句后告诉我你想了解什么。', '简单聊聊当然可以。当我们把话题连接到某项功能、状态、问题或疑问时，我能提供最大的帮助。'],
    casual_boundary: ['我也愿意继续自由聊天，但这个支持频道会把我的交流范围集中在有用的解决方案上。请选择下面的方向，或用自己的话说明真正的问题。'],
    appreciation: ['谢谢你，这句话很温暖。很高兴这段对话对你有帮助。接下来想看什么？'],
    apology: ['不用道歉。我们从现在最重要的部分继续就好。'],
    confusion: ['我理解。我们先去掉干扰，一次只理清一个步骤。最先不明白的是什么？'],
    success_confirmation: ['太好了，很高兴现在能用了。如果没有其他需要核对的内容，我会把这个问题视为已解决。'],
    impatience: ['我理解等待会让人烦躁。请告诉我仍然缺少哪个结果，我们只检查那个具体环节。'],
  },
  he: {
    greeting: ['שלום, טוב לשמוע ממך. מה שלומך ובמה אוכל לעזור היום?', 'היי. אני כאן איתך. אפשר לדבר רגע ואז להתמקד במה שתרצה להבין או לפתור.'],
    farewell: ['שמור על עצמך. שמחתי לעזור. בפעם הבאה נתחיל בצעד חדש וברור.', 'להתראות. אהיה כאן כשיעלה עוד משהו.'],
    gratitude: ['בשמחה. אני שמח שעזרתי. נשאר משהו חשוב לבדוק לפני שנסיים?', 'אין בעד מה. אם נשאר פרט אחד, ספר לי; אחרת אפשר לסגור את השאלה בשקט.'],
    wellbeing_check: ['אני בסדר ונמצא כאן איתך במלוא תשומת הלב. מה שלומך? אם משהו ב‑QL7 מטריד אותך, נבדוק אותו בשקט.', 'אני כאן, יציב ומוכן. ספר איך אתה מרגיש, ואז נראה במה אפשר לעזור.'],
    emotional_support: ['מצטער שזה מכביד עליך. אין צורך למהר: ספר מה קרה ואעזור להפריד בין הלחץ הרגשי לבין החלק שאפשר לפתור בפועל.', 'זה נשמע קשה. נתקדם צעד אחר צעד: מה קרה, ואיזו תוצאה תיתן לך יותר בהירות או רוגע?'],
    casual_chat: ['אפשר לנהל שיחה ידידותית קצרה. הערוץ הזה מיועד בעיקר לפתור שאלות אמיתיות ב‑QL7; אחר כך ספר מה יהיה שימושי לבדוק.', 'שיחה קצרה מתקבלת בברכה. אני הכי מועיל כשמחברים אותה לתכונה, מצב, בעיה או שאלה ברורה.'],
    casual_boundary: ['אשמח להמשיך לשוחח, אבל בערוץ התמיכה הזה טווח השיחה שלי ממוקד בכוונה בפתרונות מועילים. בחר כיוון למטה או תאר את השאלה האמיתית במילים שלך.'],
    appreciation: ['תודה, זה מאוד נחמד. שמח שהשיחה מועילה. במה נעסוק עכשיו?'],
    apology: ['אין צורך להתנצל. נמשיך מהנקודה שחשובה עכשיו.'],
    confusion: ['אני מבין. נסיר את הרעש ונעבור על נקודה ברורה אחת בכל פעם. מה הדבר הראשון שאינו מובן?'],
    success_confirmation: ['מצוין, שמח שזה עובד. אראה את העניין כפתור אם אין עוד דבר שתרצה לבדוק.'],
    impatience: ['אני מבין שההמתנה מתסכלת. ספר איזו תוצאה עדיין חסרה ונבדוק בדיוק את הנקודה הזאת.'],
  },
})

function localeKey(value = 'en') { const key = norm(value).split(/[-_]/u)[0]; return COPY[key] ? key : 'en' }
export function buildQl7SupportSocialReplyV11({ locale = 'en', act = 'casual_chat', seed = '', repeated = false } = {}) {
  const lang = localeKey(locale)
  const copy = COPY[lang] || COPY.en
  const category = repeated && ['casual_chat', 'wellbeing_check'].includes(act) ? 'casual_boundary' : act
  const source = copy[category] || copy.casual_chat || COPY.en.casual_chat
  return Object.freeze({ locale: lang, act, category, text: pick(Array.isArray(source) ? source : [source], `${seed}:${category}`), showChoices: category === 'casual_boundary' || ['emotional_support', 'confusion', 'impatience'].includes(act), terminal: ['farewell', 'success_confirmation'].includes(act) })
}
