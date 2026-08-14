const BANKS = Object.freeze({
  en: {
    greeting: ['Hello. I am ready to help — what would you like to understand or check?', 'Welcome. Tell me what brought you here, and we will work through it calmly.', 'Hello. What part of QUANTUM L7 AI would you like to explore today?', 'Good to see you. Describe the question in your own words; I will keep the context as we continue.', 'Welcome back. We can continue an open request or start with a new question.'],
    abandonment: ['Understood. I have closed this request without affecting your other conversations.', 'All right. I will stop work on this topic and preserve the history in case you return to it.'],
    diagnosticStart: ['Thank you — I have enough information to start the check. I will report the confirmed result here.', 'That is enough context. The check is starting now, and I will return with a clear summary.'],
  },
  ru: {
    greeting: ['Здравствуйте. Я готов помочь — что хотите понять или проверить?', 'Добро пожаловать. Расскажите, что привело вас сюда, и спокойно разберёмся.', 'Приветствую. Какую часть QUANTUM L7 AI хотите сегодня изучить или проверить?', 'Рад вас видеть. Опишите вопрос своими словами — я сохраню контекст по ходу разговора.', 'Здравствуйте снова. Можно продолжить открытое обращение или начать с нового вопроса.', 'Добрый день. С чего начнём: объяснить функцию, проверить статус или разобраться с проблемой?'],
    abandonment: ['Понял. Это обращение закрыто, остальные ваши темы не затронуты.', 'Хорошо. Работу по этой теме останавливаю, а историю сохраняю на случай, если вы решите вернуться.'],
    diagnosticStart: ['Спасибо, информации достаточно. Я начинаю проверку и сообщу здесь подтверждённый результат.', 'Контекста достаточно. Проверка уже начинается; по завершении вы получите понятное резюме.'],
  },
  uk: {
    greeting: ['Вітаю. Я готовий допомогти — що хочете зрозуміти або перевірити?', 'Ласкаво просимо. Розкажіть, що сталося, і спокійно розберемося.', 'Добрий день. Яку частину QUANTUM L7 AI хочете сьогодні вивчити або перевірити?', 'Радий вас бачити. Опишіть питання своїми словами — я збережу контекст розмови.', 'Вітаю знову. Можемо продовжити відкрите звернення або почати нове.'],
    abandonment: ['Зрозуміло. Це звернення закрито, інші ваші теми не зачеплено.', 'Добре. Роботу над цією темою зупинено, а історію збережено на випадок повернення.'],
    diagnosticStart: ['Дякую, інформації достатньо. Починаю перевірку й повідомлю підтверджений результат тут.', 'Контексту достатньо. Перевірка вже починається; після завершення ви отримаєте чітке резюме.'],
  },
  es: {
    greeting: ['Hola. Estoy listo para ayudarte: ¿qué quieres entender o comprobar?', 'Bienvenido. Cuéntame qué te trae aquí y lo revisaremos con calma.', 'Hola. ¿Qué parte de QUANTUM L7 AI quieres explorar hoy?', 'Me alegra verte. Explica la pregunta con tus palabras; conservaré el contexto.', 'Bienvenido de nuevo. Podemos continuar una solicitud abierta o empezar una nueva.'],
    abandonment: ['Entendido. He cerrado esta solicitud sin afectar tus otros asuntos.', 'De acuerdo. Detengo el trabajo sobre este tema y conservo el historial por si vuelves.'],
    diagnosticStart: ['Gracias, ya tengo información suficiente. Inicio la comprobación y te comunicaré el resultado confirmado aquí.', 'El contexto es suficiente. La comprobación comienza ahora y recibirás un resumen claro.'],
  },
  tr: {
    greeting: ['Merhaba. Yardıma hazırım; neyi anlamak veya kontrol etmek istersiniz?', 'Hoş geldiniz. Buraya gelmenize neden olan konuyu anlatın, birlikte sakin biçimde inceleyelim.', 'Merhaba. QUANTUM L7 AI ekosisteminin hangi bölümünü bugün keşfetmek istersiniz?', 'Sizi görmek güzel. Soruyu kendi sözlerinizle anlatın; konuşma bağlamını koruyacağım.', 'Tekrar hoş geldiniz. Açık bir talebe devam edebilir veya yeni bir soruyla başlayabiliriz.'],
    abandonment: ['Anladım. Bu talep kapatıldı; diğer konularınız etkilenmedi.', 'Peki. Bu konudaki çalışmayı durduruyorum ve geri dönmeniz durumunda geçmişi koruyorum.'],
    diagnosticStart: ['Teşekkürler, bilgi yeterli. Kontrolü başlatıyorum ve doğrulanan sonucu burada paylaşacağım.', 'Bağlam yeterli. Kontrol şimdi başlıyor; tamamlandığında açık bir özet alacaksınız.'],
  },
  ar: {
    greeting: ['مرحباً. أنا مستعد للمساعدة، ما الذي تريد فهمه أو التحقق منه؟', 'أهلاً بك. أخبرني بما جاء بك وسنراجع الأمر بهدوء.', 'مرحباً. أي جزء من منظومة QUANTUM L7 AI تريد استكشافه اليوم؟', 'سعيد بوجودك. اشرح السؤال بكلماتك وسأحافظ على سياق الحوار.', 'مرحباً بعودتك. يمكننا متابعة طلب مفتوح أو البدء بسؤال جديد.'],
    abandonment: ['مفهوم. تم إغلاق هذا الطلب من دون التأثير في مواضيعك الأخرى.', 'حسناً. سأوقف العمل على هذا الموضوع مع الاحتفاظ بالسجل إذا أردت العودة إليه.'],
    diagnosticStart: ['شكراً، أصبحت المعلومات كافية. سأبدأ التحقق وأعرض النتيجة المؤكدة هنا.', 'السياق كافٍ. يبدأ التحقق الآن وستتلقى ملخصاً واضحاً عند اكتماله.'],
  },
  zh: {
    greeting: ['你好。我已准备好提供帮助——你想了解或检查什么？', '欢迎。请告诉我你遇到的情况，我们会冷静地逐步处理。', '你好。今天想了解 QUANTUM L7 AI 的哪个部分？', '很高兴见到你。请用自己的话描述问题，我会在对话中保持上下文。', '欢迎回来。我们可以继续未完成的请求，也可以开始新的问题。'],
    abandonment: ['明白。该请求已关闭，不会影响你的其他事项。', '好的。我会停止处理这一主题，并保留记录，方便你以后继续。'],
    diagnosticStart: ['谢谢，信息已经足够。我将开始检查，并在这里提供确认后的结果。', '上下文已经足够。检查现在开始，完成后你会收到清晰的摘要。'],
  },
  he: {
    greeting: ['שלום. אני מוכן לעזור — מה תרצה להבין או לבדוק?', 'ברוך הבא. ספר מה הביא אותך לכאן ונבדוק זאת בצורה מסודרת.', 'שלום. איזה חלק של QUANTUM L7 AI תרצה להכיר היום?', 'טוב לראות אותך. תאר את השאלה במילים שלך ואשמור על ההקשר.', 'ברוך שובך. אפשר להמשיך פנייה פתוחה או להתחיל בשאלה חדשה.'],
    abandonment: ['הבנתי. הפנייה הזאת נסגרה בלי להשפיע על הנושאים האחרים שלך.', 'בסדר. אני מפסיק את הטיפול בנושא ושומר את ההיסטוריה למקרה שתרצה לחזור.'],
    diagnosticStart: ['תודה, יש מספיק מידע. הבדיקה מתחילה ואציג כאן את התוצאה שאושרה.', 'ההקשר מספיק. הבדיקה מתחילה עכשיו ובסיומה תקבל סיכום ברור.'],
  },
})
function str(value) { return String(value ?? '').trim() }
function hash(value = '') { let out = 2166136261; for (const char of str(value) || 'ql7') { out ^= char.codePointAt(0); out = Math.imul(out, 16777619) } return Math.abs(out) }
export function getQl7SupportLexiconPhrase({ locale = 'en', category = 'greeting', seed = '' } = {}) {
  const key = str(locale).toLowerCase().split(/[-_]/u)[0]
  const bank = BANKS[key] || BANKS.en
  const values = bank[category] || BANKS.en[category] || []
  return values.length ? values[hash(`${seed}:${key}:${category}`) % values.length] : ''
}
export function getQl7SupportLexiconCoverage() {
  return Object.freeze(Object.fromEntries(Object.entries(BANKS).map(([locale, bank]) => [locale, Object.fromEntries(Object.entries(bank).map(([category, values]) => [category, values.length]))])))
}
