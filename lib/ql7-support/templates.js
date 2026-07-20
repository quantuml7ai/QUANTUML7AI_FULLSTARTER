export const QL7_SUPPORT_LANGS = Object.freeze(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh'])

const FALLBACK_LANG = 'en'

const EVENT_TEMPLATES = Object.freeze({
  welcome: {
    en: 'Welcome to Quantum L7 AI. This official support thread will deliver account, QCoin, VIP, Ads, moderation, and security notices.',
    ru: 'Добро пожаловать в Quantum L7 AI. В этой официальной ветке поддержки будут приходить уведомления аккаунта, QCoin, VIP, рекламы, модерации и безопасности.',
    uk: 'Вітаємо в Quantum L7 AI. У цій офіційній гілці підтримки надходитимуть сповіщення акаунта, QCoin, VIP, реклами, модерації та безпеки.',
    es: 'Bienvenido a Quantum L7 AI. Este chat oficial de soporte entregará avisos de cuenta, QCoin, VIP, Ads, moderación y seguridad.',
    tr: 'Quantum L7 AI sistemine hoş geldiniz. Bu resmi destek konuşması hesap, QCoin, VIP, reklam, moderasyon ve güvenlik bildirimlerini iletir.',
    ar: 'مرحباً بك في Quantum L7 AI. ستصلك في هذه المحادثة الرسمية إشعارات الحساب وQCoin وVIP والإعلانات والإشراف والأمان.',
    zh: '欢迎来到 Quantum L7 AI。此官方支持会话会发送账户、QCoin、VIP、广告、审核和安全通知。',
  },
  qcoin_credit: {
    en: 'QCoin credited: {amount} QCOIN. Balance update is complete.',
    ru: 'QCoin зачислены: {amount} QCOIN. Баланс обновлён.',
    uk: 'QCoin зараховано: {amount} QCOIN. Баланс оновлено.',
    es: 'QCoin acreditado: {amount} QCOIN. El saldo fue actualizado.',
    tr: 'QCoin yüklendi: {amount} QCOIN. Bakiye güncellendi.',
    ar: 'تمت إضافة QCoin: ‏{amount} QCOIN. تم تحديث الرصيد.',
    zh: 'QCoin 已到账：{amount} QCOIN。余额已更新。',
  },
  vip_activated: {
    en: 'VIP Plus is active until {until}. Premium features are available now.',
    ru: 'VIP Plus активен до {until}. Премиальные функции уже доступны.',
    uk: 'VIP Plus активний до {until}. Преміальні функції вже доступні.',
    es: 'VIP Plus está activo hasta {until}. Las funciones premium ya están disponibles.',
    tr: 'VIP Plus {until} tarihine kadar aktif. Premium özellikler şimdi kullanılabilir.',
    ar: 'VIP Plus نشط حتى {until}. الميزات المميزة متاحة الآن.',
    zh: 'VIP Plus 已激活至 {until}。高级功能现已可用。',
  },
  vip_expiring_3d: {
    en: 'VIP Plus expires in 3 days. Renew in advance to keep premium access uninterrupted.',
    ru: 'VIP Plus закончится через 3 дня. Продлите заранее, чтобы премиум-доступ не прерывался.',
    uk: 'VIP Plus завершиться через 3 дні. Продовжте заздалегідь, щоб преміум-доступ не переривався.',
    es: 'VIP Plus caduca en 3 días. Renueva antes para mantener el acceso premium.',
    tr: 'VIP Plus 3 gün içinde sona erecek. Premium erişimi kesintisiz tutmak için önceden yenileyin.',
    ar: 'ينتهي VIP Plus خلال 3 أيام. جدده مسبقاً للحفاظ على الوصول المميز.',
    zh: 'VIP Plus 将在 3 天后到期。请提前续费以保持高级访问。',
  },
  vip_expiring_2d: {
    en: 'VIP Plus expires in 2 days. Renewal is still available.',
    ru: 'VIP Plus закончится через 2 дня. Продление ещё доступно.',
    uk: 'VIP Plus завершиться через 2 дні. Продовження ще доступне.',
    es: 'VIP Plus caduca en 2 días. La renovación aún está disponible.',
    tr: 'VIP Plus 2 gün içinde sona erecek. Yenileme hâlâ kullanılabilir.',
    ar: 'ينتهي VIP Plus خلال يومين. ما زال التجديد متاحاً.',
    zh: 'VIP Plus 将在 2 天后到期。仍可续费。',
  },
  vip_expiring_1d: {
    en: 'VIP Plus expires tomorrow. Renew today to keep all premium benefits.',
    ru: 'VIP Plus закончится завтра. Продлите сегодня, чтобы сохранить все премиальные возможности.',
    uk: 'VIP Plus завершиться завтра. Продовжте сьогодні, щоб зберегти всі преміальні можливості.',
    es: 'VIP Plus caduca mañana. Renueva hoy para conservar todos los beneficios premium.',
    tr: 'VIP Plus yarın sona erecek. Tüm premium avantajları korumak için bugün yenileyin.',
    ar: 'ينتهي VIP Plus غداً. جدده اليوم للحفاظ على كل المزايا المميزة.',
    zh: 'VIP Plus 明天到期。请今天续费以保留全部高级权益。',
  },
  vip_expired: {
    en: 'VIP Plus has expired. Premium actions are paused until renewal.',
    ru: 'VIP Plus завершён. Премиальные действия приостановлены до продления.',
    uk: 'VIP Plus завершено. Преміальні дії призупинено до продовження.',
    es: 'VIP Plus ha caducado. Las acciones premium quedan pausadas hasta renovar.',
    tr: 'VIP Plus süresi doldu. Premium işlemler yenilemeye kadar duraklatıldı.',
    ar: 'انتهت صلاحية VIP Plus. تم إيقاف الميزات المميزة حتى التجديد.',
    zh: 'VIP Plus 已到期。高级操作将暂停至续费。',
  },
  ads_activated: {
    en: 'Ads package activated: {package}. Campaign: {campaign}.',
    ru: 'Рекламный пакет активирован: {package}. Кампания: {campaign}.',
    uk: 'Рекламний пакет активовано: {package}. Кампанія: {campaign}.',
    es: 'Paquete de Ads activado: {package}. Campaña: {campaign}.',
    tr: 'Reklam paketi aktif: {package}. Kampanya: {campaign}.',
    ar: 'تم تفعيل باقة الإعلانات: {package}. الحملة: {campaign}.',
    zh: '广告套餐已激活：{package}。活动：{campaign}。',
  },
  ads_metrics_weekly: {
    en: 'Weekly Ads report for {campaign}: {views} views, {clicks} clicks, CTR {ctr}. Period: {period}.',
    ru: 'Еженедельный отчёт Ads по {campaign}: просмотры {views}, клики {clicks}, CTR {ctr}. Период: {period}.',
    uk: 'Щотижневий звіт Ads для {campaign}: перегляди {views}, кліки {clicks}, CTR {ctr}. Період: {period}.',
    es: 'Reporte semanal Ads de {campaign}: {views} vistas, {clicks} clics, CTR {ctr}. Periodo: {period}.',
    tr: '{campaign} haftalık reklam raporu: {views} görüntüleme, {clicks} tıklama, CTR {ctr}. Dönem: {period}.',
    ar: 'تقرير Ads الأسبوعي لـ {campaign}: ‏{views} مشاهدة، {clicks} نقرة، CTR {ctr}. الفترة: {period}.',
    zh: '{campaign} 每周广告报告：{views} 次展示，{clicks} 次点击，CTR {ctr}。周期：{period}。',
  },
  ads_expiring_3d: {
    en: 'Ads package expires in 3 days. Campaign: {campaign}.',
    ru: 'Рекламный пакет закончится через 3 дня. Кампания: {campaign}.',
    uk: 'Рекламний пакет завершиться через 3 дні. Кампанія: {campaign}.',
    es: 'El paquete de Ads caduca en 3 días. Campaña: {campaign}.',
    tr: 'Reklam paketi 3 gün içinde sona erecek. Kampanya: {campaign}.',
    ar: 'تنتهي باقة الإعلانات خلال 3 أيام. الحملة: {campaign}.',
    zh: '广告套餐将在 3 天后到期。活动：{campaign}。',
  },
  ads_expiring_2d: {
    en: 'Ads package expires in 2 days. Campaign: {campaign}.',
    ru: 'Рекламный пакет закончится через 2 дня. Кампания: {campaign}.',
    uk: 'Рекламний пакет завершиться через 2 дні. Кампанія: {campaign}.',
    es: 'El paquete de Ads caduca en 2 días. Campaña: {campaign}.',
    tr: 'Reklam paketi 2 gün içinde sona erecek. Kampanya: {campaign}.',
    ar: 'تنتهي باقة الإعلانات خلال يومين. الحملة: {campaign}.',
    zh: '广告套餐将在 2 天后到期。活动：{campaign}。',
  },
  ads_expiring_1d: {
    en: 'Ads package expires tomorrow. Campaign: {campaign}.',
    ru: 'Рекламный пакет закончится завтра. Кампания: {campaign}.',
    uk: 'Рекламний пакет завершиться завтра. Кампанія: {campaign}.',
    es: 'El paquete de Ads caduca mañana. Campaña: {campaign}.',
    tr: 'Reklam paketi yarın sona erecek. Kampanya: {campaign}.',
    ar: 'تنتهي باقة الإعلانات غداً. الحملة: {campaign}.',
    zh: '广告套餐明天到期。活动：{campaign}。',
  },
  ads_final_summary: {
    en: 'Final Ads summary for {campaign}: {views} views, {clicks} clicks, CTR {ctr}.',
    ru: 'Финальная сводка Ads по {campaign}: просмотры {views}, клики {clicks}, CTR {ctr}.',
    uk: 'Фінальний підсумок Ads для {campaign}: перегляди {views}, кліки {clicks}, CTR {ctr}.',
    es: 'Resumen final Ads de {campaign}: {views} vistas, {clicks} clics, CTR {ctr}.',
    tr: '{campaign} final reklam özeti: {views} görüntüleme, {clicks} tıklama, CTR {ctr}.',
    ar: 'ملخص Ads النهائي لـ {campaign}: ‏{views} مشاهدة، {clicks} نقرة، CTR {ctr}.',
    zh: '{campaign} 最终广告摘要：{views} 次展示，{clicks} 次点击，CTR {ctr}。',
  },
  report_received: {
    en: 'A report was received for your post. Type: {reportType}. Post: {postId}.',
    ru: 'На ваш пост поступила жалоба. Тип: {reportType}. Пост: {postId}.',
    uk: 'На ваш пост надійшла скарга. Тип: {reportType}. Пост: {postId}.',
    es: 'Se recibió un reporte sobre tu publicación. Tipo: {reportType}. Post: {postId}.',
    tr: 'Gönderiniz için şikayet alındı. Tür: {reportType}. Gönderi: {postId}.',
    ar: 'تم استلام بلاغ على منشورك. النوع: {reportType}. المنشور: {postId}.',
    zh: '你的帖子收到举报。类型：{reportType}。帖子：{postId}。',
  },
  report_threshold: {
    en: 'Report threshold reached for post {postId}. The moderation process has started.',
    ru: 'По посту {postId} достигнут порог жалоб. Запущен процесс модерации.',
    uk: 'Для поста {postId} досягнуто поріг скарг. Запущено процес модерації.',
    es: 'El post {postId} alcanzó el umbral de reportes. Inició la moderación.',
    tr: '{postId} gönderisi şikayet eşiğine ulaştı. Moderasyon süreci başladı.',
    ar: 'وصل المنشور {postId} إلى حد البلاغات. بدأت عملية الإشراف.',
    zh: '帖子 {postId} 已达到举报阈值。审核流程已启动。',
  },
  post_removed: {
    en: 'Post {postId} was removed after moderation review.',
    ru: 'Пост {postId} удалён после модерационной проверки.',
    uk: 'Пост {postId} видалено після модераційної перевірки.',
    es: 'El post {postId} fue eliminado tras revisión de moderación.',
    tr: '{postId} gönderisi moderasyon incelemesi sonrası kaldırıldı.',
    ar: 'تم حذف المنشور {postId} بعد مراجعة الإشراف.',
    zh: '帖子 {postId} 经审核后已被移除。',
  },
  media_lock: {
    en: 'Media publishing is temporarily limited on your account until {until}. Reason: {reason}.',
    ru: 'Публикация медиа временно ограничена для вашего аккаунта до {until}. Причина: {reason}.',
    uk: 'Публікацію медіа тимчасово обмежено для вашого акаунта до {until}. Причина: {reason}.',
    es: 'La publicación de medios está limitada temporalmente hasta {until}. Motivo: {reason}.',
    tr: 'Medya yayınlama hesabınızda {until} tarihine kadar sınırlı. Neden: {reason}.',
    ar: 'تم تقييد نشر الوسائط مؤقتاً حتى {until}. السبب: {reason}.',
    zh: '你的账户媒体发布已临时限制至 {until}。原因：{reason}。',
  },
  rules_warning: {
    en: 'Rules warning: {reason}. Repeated violations may restrict account features.',
    ru: 'Предупреждение по правилам: {reason}. Повторные нарушения могут ограничить функции аккаунта.',
    uk: 'Попередження щодо правил: {reason}. Повторні порушення можуть обмежити функції акаунта.',
    es: 'Advertencia de reglas: {reason}. Las reincidencias pueden limitar funciones.',
    tr: 'Kural uyarısı: {reason}. Tekrarlanan ihlaller hesap özelliklerini sınırlayabilir.',
    ar: 'تنبيه قواعد: {reason}. قد تؤدي المخالفات المتكررة إلى تقييد الميزات.',
    zh: '规则提醒：{reason}。重复违规可能限制账户功能。',
  },
  broadcast: {
    en: '{message}',
    ru: '{message}',
    uk: '{message}',
    es: '{message}',
    tr: '{message}',
    ar: '{message}',
    zh: '{message}',
  },
  critical_security: {
    en: 'Security notice: {message}',
    ru: 'Уведомление безопасности: {message}',
    uk: 'Сповіщення безпеки: {message}',
    es: 'Aviso de seguridad: {message}',
    tr: 'Güvenlik bildirimi: {message}',
    ar: 'إشعار أمان: {message}',
    zh: '安全通知：{message}',
  },
  support_thread_open: {
    en: 'Hello. This is the official QL7 Support line. Describe what happened in your own words; I will keep the context in this thread and make sure the request reaches the right service direction.',
    ru: 'Здравствуйте. Это официальная линия QL7 Support. Опишите ситуацию своими словами; я сохраню контекст в этой ветке и прослежу, чтобы обращение ушло в нужное направление сервиса.',
    uk: 'Вітаємо. Це офіційна лінія QL7 Support. Опишіть ситуацію своїми словами; я збережу контекст у цій гілці та простежу, щоб звернення пішло в потрібний напрям сервісу.',
    es: 'Hola. Esta es la línea oficial de QL7 Support. Describe lo ocurrido con tus propias palabras; mantendré el contexto en este hilo y haré que llegue al área de servicio correcta.',
    tr: 'Merhaba. Burası resmi QL7 Support hattı. Durumu kendi sözlerinizle anlatın; bağlamı bu konuşmada koruyup talebin doğru servis yönüne ulaşmasını sağlayacağım.',
    ar: 'مرحباً. هذا هو خط QL7 Support الرسمي. اشرح ما حدث بلغتك الخاصة؛ سأحفظ السياق في هذه المحادثة وأضمن وصول الطلب إلى المسار الخدمي المناسب.',
    zh: '你好。这里是 QL7 Support 官方线路。请用自己的话说明发生了什么；我会把上下文保留在本会话中，并确保请求进入正确的服务方向。',
  },
  manual: {
    en: '{message}',
    ru: '{message}',
    uk: '{message}',
    es: '{message}',
    tr: '{message}',
    ar: '{message}',
    zh: '{message}',
  },
})

const SUPPORT_TOPIC_LABELS = Object.freeze({
  qcoin: {
    en: 'QCoin and balance',
    ru: 'QCoin и баланс',
    uk: 'QCoin і баланс',
    es: 'QCoin y saldo',
    tr: 'QCoin ve bakiye',
    ar: 'QCoin والرصيد',
    zh: 'QCoin 与余额',
  },
  vip: {
    en: 'VIP Plus',
    ru: 'VIP Plus',
    uk: 'VIP Plus',
    es: 'VIP Plus',
    tr: 'VIP Plus',
    ar: 'VIP Plus',
    zh: 'VIP Plus',
  },
  ads: {
    en: 'Ads and promotion',
    ru: 'реклама и продвижение',
    uk: 'реклама та просування',
    es: 'Ads y promoción',
    tr: 'reklam ve tanıtım',
    ar: 'الإعلانات والترويج',
    zh: '广告与推广',
  },
  moderation: {
    en: 'moderation and rules',
    ru: 'модерация и правила',
    uk: 'модерація та правила',
    es: 'moderación y reglas',
    tr: 'moderasyon ve kurallar',
    ar: 'الإشراف والقواعد',
    zh: '审核与规则',
  },
  security: {
    en: 'security',
    ru: 'безопасность',
    uk: 'безпека',
    es: 'seguridad',
    tr: 'güvenlik',
    ar: 'الأمان',
    zh: '安全',
  },
  account: {
    en: 'account access',
    ru: 'доступ к аккаунту',
    uk: 'доступ до акаунта',
    es: 'acceso a la cuenta',
    tr: 'hesap erişimi',
    ar: 'الوصول إلى الحساب',
    zh: '账户访问',
  },
  media: {
    en: 'media publishing',
    ru: 'публикация медиа',
    uk: 'публікація медіа',
    es: 'publicación de medios',
    tr: 'medya yayınlama',
    ar: 'نشر الوسائط',
    zh: '媒体发布',
  },
  technical: {
    en: 'technical stability',
    ru: 'техническая стабильность',
    uk: 'технічна стабільність',
    es: 'estabilidad técnica',
    tr: 'teknik kararlılık',
    ar: 'الاستقرار التقني',
    zh: '技术稳定性',
  },
  greeting: {
    en: 'greeting',
    ru: 'приветствие',
    uk: 'привітання',
    es: 'saludo',
    tr: 'selamlama',
    ar: 'تحية',
    zh: '问候',
  },
  general: {
    en: 'your request',
    ru: 'ваше обращение',
    uk: 'ваше звернення',
    es: 'tu solicitud',
    tr: 'talebiniz',
    ar: 'طلبك',
    zh: '你的请求',
  },
})

const SUPPORT_AUTO_REPLIES = Object.freeze({
  new: {
    en: [
      'I see this is about {topic}. The request is registered, the context is saved here, and the next confirmed answer will return in this thread.',
      'Your {topic} request is now open. Add any details here if needed; they will stay attached to the same case.',
      'The message is received and linked to {topic}. I will keep the thread ordered so the service team can work from the full context.',
    ],
    ru: [
      'Вижу, что вопрос относится к направлению «{topic}». Обращение зарегистрировано, контекст сохранён здесь, следующий подтверждённый ответ вернётся в эту ветку.',
      'Заявка по направлению «{topic}» открыта. Если нужны уточнения, добавляйте их сюда — они останутся внутри того же кейса.',
      'Сообщение принято и связано с направлением «{topic}». Я сохраню порядок в ветке, чтобы сервисная команда работала с полным контекстом.',
    ],
    uk: [
      'Бачу, що питання стосується напряму «{topic}». Звернення зареєстровано, контекст збережено тут, наступна підтверджена відповідь повернеться в цю гілку.',
      'Заявку за напрямом «{topic}» відкрито. Якщо потрібні уточнення, додавайте їх тут — вони залишаться в тому самому кейсі.',
      'Повідомлення прийнято й пов’язано з напрямом «{topic}». Я збережу порядок у гілці, щоб сервісна команда працювала з повним контекстом.',
    ],
    es: [
      'Veo que esto trata sobre {topic}. La solicitud quedó registrada, el contexto se conserva aquí y la próxima respuesta confirmada volverá a este hilo.',
      'Tu solicitud de {topic} está abierta. Si necesitas añadir detalles, hazlo aquí; quedarán unidos al mismo caso.',
      'Mensaje recibido y vinculado a {topic}. Mantendré el hilo ordenado para que el equipo de servicio trabaje con el contexto completo.',
    ],
    tr: [
      'Bunun {topic} ile ilgili olduğunu görüyorum. Talep kaydedildi, bağlam burada tutuldu ve sonraki doğrulanmış yanıt bu konuşmaya dönecek.',
      '{topic} talebiniz açıldı. Gerekirse ayrıntıları buraya ekleyin; aynı dosyada kalacaklar.',
      'Mesaj alındı ve {topic} ile ilişkilendirildi. Servis ekibinin tam bağlamla çalışması için konuşmayı düzenli tutacağım.',
    ],
    ar: [
      'أرى أن الموضوع يتعلق بـ {topic}. تم تسجيل الطلب وحفظ السياق هنا، وسيعود الرد المؤكد التالي إلى هذه المحادثة.',
      'تم فتح طلب {topic}. إذا احتجت إلى إضافة تفاصيل، فاكتبها هنا وستبقى ضمن الحالة نفسها.',
      'تم استلام الرسالة وربطها بـ {topic}. سأحافظ على ترتيب المحادثة حتى يعمل فريق الخدمة على السياق الكامل.',
    ],
    zh: [
      '我看到这是关于 {topic} 的问题。请求已登记，上下文会保存在这里，下一条确认回复将回到本会话。',
      '{topic} 请求已打开。如需补充细节，请直接写在这里，它们会归入同一个案件。',
      '消息已收到并关联到 {topic}。我会保持会话清晰，方便服务团队依据完整上下文处理。',
    ],
  },
  followup: {
    en: [
      'I see the additional message about {topic}. The request is already in review; I attached the new details to the same line.',
      'Your update is added to the active {topic} case. Please wait for the confirmed answer here, so the context stays whole.',
      'The thread is still alive. I linked this note to the existing {topic} request and kept the support route focused.',
    ],
    ru: [
      'Вижу дополнительное сообщение по направлению «{topic}». Обращение уже в работе; я прикрепил новые детали к той же линии.',
      'Ваше уточнение добавлено к активному кейсу «{topic}». Ожидайте подтверждённый ответ здесь, чтобы весь контекст оставался цельным.',
      'Ветка живая. Я связал это сообщение с текущим обращением «{topic}» и сохранил фокус поддержки на той же ситуации.',
    ],
    uk: [
      'Бачу додаткове повідомлення за напрямом «{topic}». Звернення вже в роботі; я прикріпив нові деталі до тієї ж лінії.',
      'Ваше уточнення додано до активного кейсу «{topic}». Очікуйте підтверджену відповідь тут, щоб увесь контекст залишався цілісним.',
      'Гілка активна. Я пов’язав це повідомлення з поточним зверненням «{topic}» і зберіг фокус підтримки на тій самій ситуації.',
    ],
    es: [
      'Veo el mensaje adicional sobre {topic}. La solicitud ya está en revisión; añadí los detalles a la misma línea.',
      'Tu actualización fue añadida al caso activo de {topic}. Espera la respuesta confirmada aquí para mantener completo el contexto.',
      'El hilo sigue activo. Vinculé esta nota con la solicitud existente de {topic} y mantuve el foco de soporte.',
    ],
    tr: [
      '{topic} hakkında ek mesajı görüyorum. Talep zaten inceleniyor; yeni ayrıntıları aynı hatta ekledim.',
      'Güncellemeniz aktif {topic} dosyasına eklendi. Bağlamın bütün kalması için onaylı yanıtı burada bekleyin.',
      'Konuşma hâlâ aktif. Bu notu mevcut {topic} talebine bağladım ve destek odağını korudum.',
    ],
    ar: [
      'أرى الرسالة الإضافية بخصوص {topic}. الطلب قيد المراجعة بالفعل؛ أضفت التفاصيل الجديدة إلى المسار نفسه.',
      'تمت إضافة تحديثك إلى حالة {topic} النشطة. انتظر الرد المؤكد هنا حتى يبقى السياق كاملاً.',
      'المحادثة ما زالت نشطة. ربطت هذه الملاحظة بطلب {topic} الحالي وأبقيت مسار الدعم مركزاً.',
    ],
    zh: [
      '我看到关于 {topic} 的补充消息。请求已在处理中；我已把新细节附加到同一条支持线。',
      '你的更新已加入当前 {topic} 案件。请在这里等待确认回复，这样上下文会保持完整。',
      '这个会话仍在跟进。我把这条补充关联到现有的 {topic} 请求，并保持支持路径聚焦。',
    ],
  },
  review: {
    en: [
      'Your {topic} case is already in review. I attached this update to the same timeline; please wait here for the confirmed answer.',
      'I see the continuation. It is connected to the active {topic} request, so there is no need to open a new thread.',
    ],
    ru: [
      'Кейс «{topic}» уже находится в рассмотрении. Я прикрепил это уточнение к той же линии событий; ожидайте подтверждённый ответ здесь.',
      'Вижу продолжение. Оно связано с активным обращением «{topic}», отдельную ветку открывать не нужно.',
    ],
    uk: [
      'Кейс «{topic}» уже на розгляді. Я прикріпив це уточнення до тієї ж лінії подій; очікуйте підтверджену відповідь тут.',
      'Бачу продовження. Воно пов’язане з активним зверненням «{topic}», окрему гілку відкривати не потрібно.',
    ],
    es: [
      'Tu caso de {topic} ya está en revisión. Añadí esta actualización a la misma línea; espera aquí la respuesta confirmada.',
      'Veo la continuación. Queda conectada a la solicitud activa de {topic}, no hace falta abrir otro hilo.',
    ],
    tr: [
      '{topic} dosyanız zaten inceleniyor. Bu güncellemeyi aynı zaman çizgisine ekledim; doğrulanmış yanıtı burada bekleyin.',
      'Devamını görüyorum. Aktif {topic} talebine bağlandı; yeni bir konuşma açmanıza gerek yok.',
    ],
    ar: [
      'حالة {topic} قيد المراجعة بالفعل. أضفت هذا التحديث إلى المسار نفسه؛ انتظر الرد المؤكد هنا.',
      'أرى المتابعة. تم ربطها بطلب {topic} النشط، ولا حاجة لفتح محادثة جديدة.',
    ],
    zh: [
      '{topic} 案件已在处理中。我已把这次更新加入同一条时间线；请在这里等待确认回复。',
      '我看到这是继续补充。它已关联到当前 {topic} 请求，不需要另开会话。',
    ],
  },
})

const SUPPORT_GREETING_REPLIES = Object.freeze({
  new: {
    en: [
      'Hello. I am here. Tell me what you need to check or resolve, and I will keep the context in this official support thread.',
      'Welcome. Describe the situation calmly and clearly: what happened, where it happened, and what result you expected.',
      'Hi. I am ready to help. Send the details in one message if you can, and the next confirmed answer will stay in this thread.',
    ],
    ru: [
      'Здравствуйте. Я на связи. Расскажите, что нужно проверить или решить, а я сохраню контекст в этой официальной ветке поддержки.',
      'Приветствую. Опишите ситуацию спокойно и по сути: что произошло, где именно, и какого результата вы ожидали.',
      'Добрый день. Готов помочь. Если можете, отправьте детали одним сообщением, а следующий подтверждённый ответ останется здесь.',
    ],
    uk: [
      'Вітаю. Я на зв’язку. Розкажіть, що потрібно перевірити або вирішити, а я збережу контекст у цій офіційній гілці підтримки.',
      'Доброго дня. Опишіть ситуацію спокійно й по суті: що сталося, де саме, і якого результату ви очікували.',
      'Привіт. Готовий допомогти. Якщо можете, надішліть деталі одним повідомленням, а наступна підтверджена відповідь залишиться тут.',
    ],
    es: [
      'Hola. Estoy aquí. Cuéntame qué necesitas revisar o resolver, y conservaré el contexto en este hilo oficial de soporte.',
      'Bienvenido. Describe la situación con calma: qué ocurrió, dónde ocurrió y qué resultado esperabas.',
      'Hola. Estoy listo para ayudar. Si puedes, envía los detalles en un solo mensaje; la próxima respuesta confirmada quedará aquí.',
    ],
    tr: [
      'Merhaba. Buradayım. Neyi kontrol etmek veya çözmek istediğinizi anlatın; bağlamı bu resmi destek konuşmasında tutacağım.',
      'Hoş geldiniz. Durumu sakin ve net anlatın: ne oldu, nerede oldu ve hangi sonucu bekliyordunuz.',
      'Merhaba. Yardıma hazırım. Mümkünse ayrıntıları tek mesajda gönderin; sonraki doğrulanmış yanıt burada kalacak.',
    ],
    ar: [
      'مرحباً. أنا هنا. أخبرني بما تحتاج إلى فحصه أو حله، وسأحفظ السياق في هذه المحادثة الرسمية للدعم.',
      'أهلاً بك. صف الموقف بهدوء ووضوح: ماذا حدث، وأين حدث، وما النتيجة التي كنت تتوقعها.',
      'مرحباً. أنا جاهز للمساعدة. إذا أمكن، أرسل التفاصيل في رسالة واحدة وسيبقى الرد المؤكد التالي هنا.',
    ],
    zh: [
      '你好。我在这里。请告诉我需要检查或解决什么，我会把上下文保留在这条官方支持会话里。',
      '欢迎。请清楚说明情况：发生了什么、发生在哪里，以及你原本期待的结果。',
      '你好。我已准备好协助。如果可以，请把细节集中发在一条消息里，下一条确认回复会留在这里。',
    ],
  },
  followup: {
    en: [
      'I am still here. If this continues the same matter, add the details here and I will keep them attached to the current support line.',
      'The thread is active. Send the next detail whenever you are ready; I will keep the support context together.',
    ],
    ru: [
      'Я здесь. Если это продолжение того же вопроса, добавляйте детали сюда - они останутся в текущей линии обращения.',
      'Ветка активна. Отправляйте следующее уточнение, когда будете готовы; я сохраню контекст поддержки цельным.',
    ],
    uk: [
      'Я тут. Якщо це продовження того самого питання, додавайте деталі сюди - вони залишаться в поточній лінії звернення.',
      'Гілка активна. Надсилайте наступне уточнення, коли будете готові; я збережу контекст підтримки цілісним.',
    ],
    es: [
      'Sigo aquí. Si esto continúa el mismo asunto, añade los detalles aquí y los mantendré unidos a la línea actual.',
      'El hilo está activo. Envía el siguiente detalle cuando estés listo; conservaré unido el contexto de soporte.',
    ],
    tr: [
      'Buradayım. Bu aynı konunun devamıysa ayrıntıları buraya ekleyin; mevcut destek hattına bağlı tutacağım.',
      'Konuşma aktif. Hazır olduğunuzda sonraki ayrıntıyı gönderin; destek bağlamını birlikte koruyacağım.',
    ],
    ar: [
      'ما زلت هنا. إذا كان هذا استمراراً للموضوع نفسه، فأضف التفاصيل هنا وسأبقيها مرتبطة بمسار الدعم الحالي.',
      'المحادثة نشطة. أرسل التفصيل التالي عندما تكون جاهزاً؛ سأحافظ على سياق الدعم موحداً.',
    ],
    zh: [
      '我还在。如果这是同一件事的继续，请把细节写在这里，我会把它们保留在当前支持线里。',
      '会话仍然有效。准备好后发送下一条细节，我会保持支持上下文完整。',
    ],
  },
  review: {
    en: ['I am here and the support line is already open. Add only the details that help clarify the current request.'],
    ru: ['Я на связи, и линия поддержки уже открыта. Добавляйте только те детали, которые помогают уточнить текущее обращение.'],
    uk: ['Я на зв’язку, і лінію підтримки вже відкрито. Додавайте лише ті деталі, які допомагають уточнити поточне звернення.'],
    es: ['Estoy aquí y la línea de soporte ya está abierta. Añade solo los detalles que ayuden a aclarar la solicitud actual.'],
    tr: ['Buradayım ve destek hattı zaten açık. Yalnızca mevcut talebi netleştiren ayrıntıları ekleyin.'],
    ar: ['أنا هنا وخط الدعم مفتوح بالفعل. أضف فقط التفاصيل التي تساعد على توضيح الطلب الحالي.'],
    zh: ['我在这里，支持线已经打开。请只补充有助于说明当前请求的细节。'],
  },
})

function cleanLang(value) {
  const lang = String(value || '').trim().toLowerCase().split(/[-_]/)[0]
  return QL7_SUPPORT_LANGS.includes(lang) ? lang : FALLBACK_LANG
}

function cleanPayload(payload = {}) {
  return payload && typeof payload === 'object' ? payload : {}
}

function interpolate(template, payload) {
  const source = String(template || '')
  const data = cleanPayload(payload)
  return source.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const value = data[key]
    if (value === null || value === undefined || value === '') return '—'
    return String(value)
  }).replace(/\s+/g, ' ').trim()
}

export function normalizeQl7SupportLocale(locale) {
  return cleanLang(locale)
}

export function getQl7SupportTemplate(eventType, locale = '') {
  const type = String(eventType || 'manual').trim() || 'manual'
  const block = EVENT_TEMPLATES[type] || EVENT_TEMPLATES.manual
  const lang = cleanLang(locale)
  return block[lang] || block[FALLBACK_LANG] || EVENT_TEMPLATES.manual[FALLBACK_LANG]
}

export function buildQl7SupportMessage({
  eventType = 'manual',
  locale = '',
  payload = {},
  message = '',
} = {}) {
  const data = { ...cleanPayload(payload) }
  if (message && !data.message) data.message = message
  return interpolate(getQl7SupportTemplate(eventType, locale), data)
}

export function buildQl7SupportDedupeKey({ userId, eventType, subjectId = '', timestamp = '', nonce = '' } = {}) {
  const uid = String(userId || '').trim().toLowerCase()
  const type = String(eventType || 'manual').trim().toLowerCase()
  const subject = String(subjectId || '').trim().toLowerCase()
  const time = String(timestamp || '').trim()
  const extra = String(nonce || '').trim()
  return [uid, type, subject, time, extra].filter(Boolean).join(':')
}

function hashSeed(value) {
  const text = String(value || '')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function compactSupportText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const GREETING_PHRASES = Object.freeze([
  'hello',
  'hi',
  'hey',
  'good morning',
  'good afternoon',
  'good evening',
  'привет',
  'приветствую',
  'здравствуйте',
  'здраствуйте',
  'добрый день',
  'доброе утро',
  'добрый вечер',
  'доброго дня',
  'вітаю',
  'привіт',
  'добрий день',
  'доброго ранку',
  'добрий вечір',
  'hola',
  'buenas',
  'buenos dias',
  'buenos días',
  'buenas tardes',
  'buenas noches',
  'merhaba',
  'selam',
  'iyi günler',
  'günaydın',
  'مساء الخير',
  'صباح الخير',
  'مرحبا',
  'أهلا',
  '你好',
  '您好',
])

function isSupportGreetingOnly(text = '') {
  const probe = compactSupportText(text)
  if (!probe || probe.length > 48) return false
  if (GREETING_PHRASES.includes(probe)) return true
  const words = probe.split(/\s+/).filter(Boolean)
  if (words.length > 3) return false
  return GREETING_PHRASES.some((phrase) => probe.startsWith(`${phrase} `))
}

export function classifyQl7SupportRequest(text = '') {
  const source = String(text || '').toLowerCase()
  if (isSupportGreetingOnly(source)) return 'greeting'
  if (/(qcoin|q coin|баланс|баланс|balance|coin|коин|монет|токен|зачисл|topup|invoice|оплат|payment|кошел|wallet)/iu.test(source)) return 'qcoin'
  if (/(vip|вип|x2|x100|premium|премиум|преміум|підпис|подпис|subscription)/iu.test(source)) return 'vip'
  if (/(ads|advert|реклам|кампан|просмотр|клик|ctr|promotion|promote|метрик)/iu.test(source)) return 'ads'
  if (/(жалоб|report|moder|модер|бан|block|правил|rules|удален|removed|наруш)/iu.test(source)) return 'moderation'
  if (/(seed|private|ключ|безопас|security|взлом|hack|парол|password|подозр|suspicious)/iu.test(source)) return 'security'
  if (/(аккаунт|account|login|авториз|вход|google|apple|telegram|walletconnect|кошелек|профил|profile)/iu.test(source)) return 'account'
  if (/(media|медиа|фото|photo|image|video|видео|audio|аудио|upload|загруз|публикац)/iu.test(source)) return 'media'
  if (/(bug|баг|ошиб|error|завис|лаг|slow|тормоз|crash|не работает|сломал|broken)/iu.test(source)) return 'technical'
  return 'general'
}

export function getQl7SupportTopicLabel(topic = 'general', locale = '') {
  const lang = cleanLang(locale)
  const key = String(topic || 'general').trim()
  const block = SUPPORT_TOPIC_LABELS[key] || SUPPORT_TOPIC_LABELS.general
  return block[lang] || block[FALLBACK_LANG] || SUPPORT_TOPIC_LABELS.general[FALLBACK_LANG]
}

export function buildQl7SupportAutoReply({
  locale = '',
  topic = 'general',
  mode = 'new',
  seed = '',
  count = 1,
} = {}) {
  const lang = cleanLang(locale)
  const repeatCount = Math.max(1, Number(count) || 1)
  const replyMode = mode === 'followup'
    ? (repeatCount >= 3 ? 'review' : 'followup')
    : 'new'
  const replySource = String(topic || '') === 'greeting' ? SUPPORT_GREETING_REPLIES : SUPPORT_AUTO_REPLIES
  const variants = replySource[replyMode]?.[lang] || replySource[replyMode]?.[FALLBACK_LANG] || []
  const template = variants[hashSeed(`${seed}:${topic}:${replyMode}`) % Math.max(1, variants.length)] || ''
  return interpolate(template, { topic: getQl7SupportTopicLabel(topic, lang) })
}
