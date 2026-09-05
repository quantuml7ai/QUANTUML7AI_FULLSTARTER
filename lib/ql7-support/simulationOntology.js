export const QL7_SUPPORT_SIMULATION_TOPICS = Object.freeze([
  'platform','homepage','news','exchange','exchange_ai','battlecoin','battle_chat','futures','academy','academy_exam','gameverse','metastudio','metaverse','forum_feed','forum_threads','search','geodetect','media','moderation','metamarket','quantum_family','profile','auth','wallet','telegram','qcoin','payments','vip','ads_packages','ads_campaigns','push','messenger','quests','contact','privacy','security','account_deletion','navigation','roadmap','system_status','localization','accessibility','learning_governance','support_system',
])

export const QL7_SUPPORT_CORE_NATIVE_LANGUAGES = Object.freeze(['en','ru','uk','es','tr','ar','zh','he'])
export const QL7_SUPPORT_SIMULATION_LANGUAGES = Object.freeze(['en','ru','uk','es','tr','ar','zh','he','de','fr','it','pt','pl','nl','sv','no','da','fi','cs','sk','hu','ro','bg','sr','hr','sl','el','ka','az','kk','ja','ko'])

export const QL7_SUPPORT_SIMULATION_AXES = Object.freeze({
  intent: ['overview','how_to','personal_status','troubleshooting','complaint','correction','comparison','purchase_interest','business_interest'],
  messageAct: ['greeting','question','command','report','denial','confirmation','choice','correction','threat','joke','spam'],
  lengthBucket: ['1','2-4','5-12','13-32','33-80','81-160','161-320','321-480','481-599','600'],
  outputLength: ['micro','short','compact','standard','detailed','maximum'],
  register: ['formal','neutral','colloquial','youth_slang','regional','technical','simple'],
  script: ['latin','cyrillic','arabic','hebrew','han','mixed','transliteration'],
  emotion: ['calm','joy','anxiety','frustration','anger','distrust','panic','sadness','excitement'],
  humor: ['none','joke','irony','sarcasm','playful_complaint','unsafe_sensitive'],
  noise: ['none','emoji_flood','punctuation_flood','repeated_characters','empty_semantics','pasted_log'],
  typo: ['none','missing_letters','swaps','keyboard_layout','phonetic','missing_spaces'],
  mutation: ['none','case','punctuation','typo','transliteration','keyboard_layout','emoji','code_switch','negation','sarcasm','noise','prompt_injection'],
  topicTransition: ['continue','clarify','abrupt_switch','return','multi_intent','correction'],
  userState: ['anonymous','authenticated','vip_active','vip_expired','ads_active','ads_zero','qcoin_pending','foreign_account'],
  runtimeState: ['development','private_beta','public_beta','live','maintenance','paused','unknown'],
  sourceState: ['healthy','zero','missing','stale','timeout','inconsistent','unauthorized'],
  actionState: ['route','overlay','global_event','tab','deep_link','retry_diagnostic'],
  securityAttack: ['none','prompt_injection','secret_bait','forged_card','id_substitution','foreign_account'],
  learningState: ['no_evidence','early_evidence','conflicting_evidence','candidate','guarded_review','small_release','safe_revert'],
  userReaction: ['helpful','unhelpful','corrected','clicked','ignored','repeated','escalated','resolved'],
  temporalPattern: ['single_turn','same_day_return','multi_day_return','stale_case','renewed_subscription'],
  concurrency: ['single','duplicate_send','parallel_tabs','worker_retry','sse_reconnect','topic_race'],
  performance: ['warm','cold_start','provider_latency','db_timeout','bounded_concurrency'],
  translationState: ['native','translated','provider_timeout','partial_failure','fallback','rtl'],
  choiceState: ['none','fresh','selected','duplicate','stale','expired','tampered','wrong_user_case'],
})

export const QL7_SUPPORT_TOPIC_LABELS = Object.freeze({
  platform: 'QUANTUM L7 AI ecosystem and L7 Blockchain',
  homepage: 'homepage and CryptoRadar QRM',
  news: 'crypto news and translated market news',
  exchange: 'Quantum Exchange',
  exchange_ai: 'AI Box and AI Quota',
  battlecoin: 'BattleCoin and ten-minute battles',
  battle_chat: 'Real-Time Battle Chat',
  futures: 'futures and battle positions',
  academy: 'Quantum Academy lessons and progress',
  academy_exam: 'Academy exam and result',
  gameverse: 'Gameverse',
  metastudio: 'MetaStudio',
  metaverse: 'Quantum Universe and metaverse',
  forum_feed: 'forum feed, publishing and sorting',
  forum_threads: 'forum topics, replies and threads',
  search: 'Quantum Search',
  geodetect: 'GeoDetect and geographic feed priority',
  media: 'forum media, video and audio',
  moderation: 'reports, violations, deletion and appeal',
  metamarket: 'MetaMarket items, collection and history',
  quantum_family: 'Quantum Family followers and subscriptions',
  profile: 'profile and account settings',
  auth: 'authorization and account session',
  wallet: 'Quantum Wallet',
  telegram: 'Telegram Mini App',
  qcoin: 'QCoin balance, top-up and ledger',
  payments: 'payments, invoices and payment history',
  vip: 'VIP subscription and benefits',
  ads_packages: 'advertising packages',
  ads_campaigns: 'advertising campaigns, targeting and analytics',
  push: 'push notifications',
  messenger: 'Quantum Messenger',
  quests: 'quests and rewards',
  contact: 'contact, investment and partnership proposal',
  privacy: 'privacy and personal-data handling',
  security: 'account security and fraud protection',
  account_deletion: 'account deletion and data cleanup',
  navigation: 'navigation through the ecosystem',
  roadmap: 'roadmap and future plans',
  system_status: 'current runtime status and availability',
  localization: 'language and Deep Translate',
  accessibility: 'accessibility, keyboard and RTL support',
  learning_governance: 'safe self-learning, dialogue experience and governed calibration',
  support_system: 'QL7 Support capabilities and scope',
})

const FRAMES = Object.freeze({
  en: { overview:'Tell me clearly about {topic}.', how_to:'How do I use {topic}?', personal_status:'Check my current {topic} status.', troubleshooting:'Why is {topic} not working for me?', complaint:'I am unhappy because {topic} is wrong. Please investigate.', correction:'No, I mean {topic}, not the previous subject.', comparison:'Compare {topic} with the related alternatives.', purchase_interest:'I am considering buying or activating {topic}. What should I know?', business_interest:'I want to discuss a business partnership concerning {topic}.' },
  ru: { overview:'Чётко расскажи мне про {topic}.', how_to:'Как пользоваться {topic}?', personal_status:'Проверь мой текущий статус по теме {topic}.', troubleshooting:'Почему у меня не работает {topic}?', complaint:'Я недоволен: с {topic} что-то неправильно. Разберитесь.', correction:'Нет, я имею в виду {topic}, а не прошлую тему.', comparison:'Сравни {topic} со связанными вариантами.', purchase_interest:'Я думаю купить или активировать {topic}. Что важно знать?', business_interest:'Хочу обсудить деловое партнёрство по теме {topic}.' },
  uk: { overview:'Чітко розкажи мені про {topic}.', how_to:'Як користуватися {topic}?', personal_status:'Перевір мій поточний статус щодо {topic}.', troubleshooting:'Чому в мене не працює {topic}?', complaint:'Я незадоволений: із {topic} щось не так. Перевірте.', correction:'Ні, я маю на увазі {topic}, а не попередню тему.', comparison:'Порівняй {topic} з пов’язаними варіантами.', purchase_interest:'Я планую придбати або активувати {topic}. Що треба знати?', business_interest:'Хочу обговорити ділове партнерство щодо {topic}.' },
  es: { overview:'Explícame claramente {topic}.', how_to:'¿Cómo se usa {topic}?', personal_status:'Comprueba mi estado actual de {topic}.', troubleshooting:'¿Por qué no me funciona {topic}?', complaint:'No estoy conforme: algo falla con {topic}. Investígalo.', correction:'No, me refiero a {topic}, no al tema anterior.', comparison:'Compara {topic} con las opciones relacionadas.', purchase_interest:'Estoy pensando en comprar o activar {topic}. ¿Qué debo saber?', business_interest:'Quiero hablar de una asociación comercial relacionada con {topic}.' },
  tr: { overview:'Bana {topic} konusunu açıkça anlat.', how_to:'{topic} nasıl kullanılır?', personal_status:'Mevcut {topic} durumumu kontrol et.', troubleshooting:'{topic} neden bende çalışmıyor?', complaint:'Memnun değilim; {topic} ile ilgili bir sorun var. İncele.', correction:'Hayır, önceki konuyu değil {topic} konusunu kastediyorum.', comparison:'{topic} ile ilgili seçenekleri karşılaştır.', purchase_interest:'{topic} satın almayı veya etkinleştirmeyi düşünüyorum. Ne bilmeliyim?', business_interest:'{topic} hakkında iş ortaklığı görüşmek istiyorum.' },
  ar: { overview:'اشرح لي بوضوح موضوع {topic}.', how_to:'كيف أستخدم {topic}؟', personal_status:'تحقق من حالتي الحالية بخصوص {topic}.', troubleshooting:'لماذا لا يعمل {topic} لدي؟', complaint:'أنا غير راضٍ؛ توجد مشكلة في {topic}. تحقق منها.', correction:'لا، أقصد {topic} وليس الموضوع السابق.', comparison:'قارن {topic} بالخيارات المرتبطة به.', purchase_interest:'أفكر في شراء أو تفعيل {topic}. ماذا يجب أن أعرف؟', business_interest:'أرغب في مناقشة شراكة تجارية بشأن {topic}.' },
  zh: { overview:'请清楚介绍一下{topic}。', how_to:'如何使用{topic}？', personal_status:'请检查我当前的{topic}状态。', troubleshooting:'为什么我的{topic}无法正常使用？', complaint:'我不满意，{topic}似乎有问题，请调查。', correction:'不，我指的是{topic}，不是之前的话题。', comparison:'请比较{topic}和相关选项。', purchase_interest:'我在考虑购买或启用{topic}，需要了解什么？', business_interest:'我想讨论与{topic}有关的商业合作。' },
  he: { overview:'הסבר לי בבירור על {topic}.', how_to:'כיצד משתמשים ב־{topic}?', personal_status:'בדוק את המצב הנוכחי שלי בנושא {topic}.', troubleshooting:'מדוע {topic} אינו עובד אצלי?', complaint:'אני לא מרוצה; יש בעיה ב־{topic}. בדוק אותה.', correction:'לא, אני מתכוון ל־{topic}, לא לנושא הקודם.', comparison:'השווה את {topic} לאפשרויות הקשורות.', purchase_interest:'אני שוקל לרכוש או להפעיל את {topic}. מה חשוב לדעת?', business_interest:'אני רוצה לדון בשותפות עסקית הקשורה ל־{topic}.' },
  de: { overview:'Erkläre mir {topic} klar.', how_to:'Wie benutze ich {topic}?', personal_status:'Prüfe meinen aktuellen Status für {topic}.', troubleshooting:'Warum funktioniert {topic} bei mir nicht?', complaint:'Ich bin unzufrieden; bei {topic} stimmt etwas nicht. Bitte prüfe es.', correction:'Nein, ich meine {topic}, nicht das vorherige Thema.', comparison:'Vergleiche {topic} mit den verbundenen Optionen.', purchase_interest:'Ich erwäge, {topic} zu kaufen oder zu aktivieren. Was muss ich wissen?', business_interest:'Ich möchte über eine Geschäftspartnerschaft zu {topic} sprechen.' },
  fr: { overview:'Explique-moi clairement {topic}.', how_to:'Comment utiliser {topic} ?', personal_status:'Vérifie mon statut actuel pour {topic}.', troubleshooting:'Pourquoi {topic} ne fonctionne-t-il pas pour moi ?', complaint:'Je ne suis pas satisfait : il y a un problème avec {topic}. Vérifie-le.', correction:'Non, je parle de {topic}, pas du sujet précédent.', comparison:'Compare {topic} aux options associées.', purchase_interest:'J’envisage d’acheter ou d’activer {topic}. Que dois-je savoir ?', business_interest:'Je souhaite discuter d’un partenariat commercial concernant {topic}.' },
  it: { overview:'Spiegami chiaramente {topic}.', how_to:'Come si usa {topic}?', personal_status:'Controlla il mio stato attuale per {topic}.', troubleshooting:'Perché {topic} non funziona per me?', complaint:'Non sono soddisfatto: c’è un problema con {topic}. Verificalo.', correction:'No, intendo {topic}, non l’argomento precedente.', comparison:'Confronta {topic} con le opzioni correlate.', purchase_interest:'Sto pensando di acquistare o attivare {topic}. Cosa devo sapere?', business_interest:'Voglio discutere una partnership commerciale riguardo a {topic}.' },
  pt: { overview:'Explique claramente {topic}.', how_to:'Como usar {topic}?', personal_status:'Verifique meu estado atual de {topic}.', troubleshooting:'Por que {topic} não funciona para mim?', complaint:'Não estou satisfeito; há algo errado com {topic}. Verifique.', correction:'Não, quero dizer {topic}, não o assunto anterior.', comparison:'Compare {topic} com as opções relacionadas.', purchase_interest:'Estou pensando em comprar ou ativar {topic}. O que devo saber?', business_interest:'Quero discutir uma parceria comercial sobre {topic}.' },
  pl: { overview:'Wyjaśnij mi jasno {topic}.', how_to:'Jak korzystać z {topic}?', personal_status:'Sprawdź mój aktualny status dotyczący {topic}.', troubleshooting:'Dlaczego {topic} u mnie nie działa?', complaint:'Nie jestem zadowolony; z {topic} jest problem. Sprawdź to.', correction:'Nie, chodzi mi o {topic}, a nie poprzedni temat.', comparison:'Porównaj {topic} z powiązanymi opcjami.', purchase_interest:'Rozważam zakup lub aktywację {topic}. Co trzeba wiedzieć?', business_interest:'Chcę omówić partnerstwo biznesowe dotyczące {topic}.' },
  ro: { overview:'Explică-mi clar {topic}.', how_to:'Cum folosesc {topic}?', personal_status:'Verifică starea mea actuală pentru {topic}.', troubleshooting:'De ce nu funcționează {topic} pentru mine?', complaint:'Nu sunt mulțumit; există o problemă cu {topic}. Verifică.', correction:'Nu, mă refer la {topic}, nu la subiectul anterior.', comparison:'Compară {topic} cu opțiunile asociate.', purchase_interest:'Mă gândesc să cumpăr sau să activez {topic}. Ce trebuie să știu?', business_interest:'Vreau să discut un parteneriat de afaceri privind {topic}.' },
  nl: { overview:'Leg {topic} duidelijk uit.', how_to:'Hoe gebruik ik {topic}?', personal_status:'Controleer mijn huidige status voor {topic}.', troubleshooting:'Waarom werkt {topic} niet voor mij?', complaint:'Ik ben ontevreden; er is iets mis met {topic}. Onderzoek het.', correction:'Nee, ik bedoel {topic}, niet het vorige onderwerp.', comparison:'Vergelijk {topic} met de gerelateerde opties.', purchase_interest:'Ik overweeg {topic} te kopen of activeren. Wat moet ik weten?', business_interest:'Ik wil een zakelijk partnerschap over {topic} bespreken.' },
  sv: { overview:'Förklara {topic} tydligt.', how_to:'Hur använder jag {topic}?', personal_status:'Kontrollera min nuvarande status för {topic}.', troubleshooting:'Varför fungerar inte {topic} för mig?', complaint:'Jag är missnöjd; något är fel med {topic}. Undersök det.', correction:'Nej, jag menar {topic}, inte föregående ämne.', comparison:'Jämför {topic} med relaterade alternativ.', purchase_interest:'Jag överväger att köpa eller aktivera {topic}. Vad behöver jag veta?', business_interest:'Jag vill diskutera ett affärspartnerskap kring {topic}.' },
  no: { overview:'Forklar {topic} tydelig.', how_to:'Hvordan bruker jeg {topic}?', personal_status:'Sjekk min nåværende status for {topic}.', troubleshooting:'Hvorfor fungerer ikke {topic} for meg?', complaint:'Jeg er misfornøyd; noe er galt med {topic}. Undersøk det.', correction:'Nei, jeg mener {topic}, ikke forrige tema.', comparison:'Sammenlign {topic} med relaterte alternativer.', purchase_interest:'Jeg vurderer å kjøpe eller aktivere {topic}. Hva må jeg vite?', business_interest:'Jeg vil diskutere et forretningspartnerskap om {topic}.' },
  da: { overview:'Forklar {topic} tydeligt.', how_to:'Hvordan bruger jeg {topic}?', personal_status:'Kontrollér min aktuelle status for {topic}.', troubleshooting:'Hvorfor virker {topic} ikke for mig?', complaint:'Jeg er utilfreds; der er noget galt med {topic}. Undersøg det.', correction:'Nej, jeg mener {topic}, ikke det forrige emne.', comparison:'Sammenlign {topic} med relaterede muligheder.', purchase_interest:'Jeg overvejer at købe eller aktivere {topic}. Hvad skal jeg vide?', business_interest:'Jeg vil diskutere et forretningspartnerskab om {topic}.' },
  fi: { overview:'Selitä {topic} selkeästi.', how_to:'Miten käytän {topic}?', personal_status:'Tarkista nykyinen {topic}-tilani.', troubleshooting:'Miksi {topic} ei toimi minulla?', complaint:'En ole tyytyväinen; {topic}-asiassa on ongelma. Tutki se.', correction:'Ei, tarkoitan {topic}, en edellistä aihetta.', comparison:'Vertaa {topic} siihen liittyviin vaihtoehtoihin.', purchase_interest:'Harkitsen {topic}-ostoa tai aktivointia. Mitä minun pitää tietää?', business_interest:'Haluan keskustella {topic}-aiheisesta liikekumppanuudesta.' },
  cs: { overview:'Jasně mi vysvětli {topic}.', how_to:'Jak se používá {topic}?', personal_status:'Zkontroluj můj aktuální stav pro {topic}.', troubleshooting:'Proč mi {topic} nefunguje?', complaint:'Nejsem spokojený; s {topic} je problém. Prověř to.', correction:'Ne, myslím {topic}, ne předchozí téma.', comparison:'Porovnej {topic} se souvisejícími možnostmi.', purchase_interest:'Zvažuji nákup nebo aktivaci {topic}. Co mám vědět?', business_interest:'Chci projednat obchodní partnerství týkající se {topic}.' },
  sk: { overview:'Jasne mi vysvetli {topic}.', how_to:'Ako sa používa {topic}?', personal_status:'Skontroluj môj aktuálny stav pre {topic}.', troubleshooting:'Prečo mi {topic} nefunguje?', complaint:'Nie som spokojný; s {topic} je problém. Prever to.', correction:'Nie, myslím {topic}, nie predchádzajúcu tému.', comparison:'Porovnaj {topic} so súvisiacimi možnosťami.', purchase_interest:'Zvažujem kúpu alebo aktiváciu {topic}. Čo mám vedieť?', business_interest:'Chcem prediskutovať obchodné partnerstvo týkajúce sa {topic}.' },
  hu: { overview:'Magyarázd el világosan: {topic}.', how_to:'Hogyan használható a {topic}?', personal_status:'Ellenőrizd a jelenlegi {topic} állapotomat.', troubleshooting:'Miért nem működik nálam a {topic}?', complaint:'Nem vagyok elégedett; probléma van a {topic} működésével. Vizsgáld meg.', correction:'Nem, a {topic} témára gondolok, nem az előzőre.', comparison:'Hasonlítsd össze a {topic} kapcsolódó lehetőségeit.', purchase_interest:'A {topic} megvásárlását vagy aktiválását fontolgatom. Mit kell tudnom?', business_interest:'Üzleti partnerségről szeretnék beszélni a {topic} kapcsán.' },
  bg: { overview:'Обясни ми ясно {topic}.', how_to:'Как се използва {topic}?', personal_status:'Провери текущия ми статус за {topic}.', troubleshooting:'Защо {topic} не работи при мен?', complaint:'Не съм доволен; има проблем с {topic}. Провери го.', correction:'Не, имам предвид {topic}, а не предишната тема.', comparison:'Сравни {topic} със свързаните опции.', purchase_interest:'Обмислям да купя или активирам {topic}. Какво трябва да знам?', business_interest:'Искам да обсъдя бизнес партньорство относно {topic}.' },
  sr: { overview:'Jasno mi objasni {topic}.', how_to:'Kako se koristi {topic}?', personal_status:'Proveri moj trenutni status za {topic}.', troubleshooting:'Zašto {topic} ne radi kod mene?', complaint:'Nisam zadovoljan; postoji problem sa {topic}. Proveri to.', correction:'Ne, mislim na {topic}, ne na prethodnu temu.', comparison:'Uporedi {topic} sa povezanim opcijama.', purchase_interest:'Razmišljam da kupim ili aktiviram {topic}. Šta treba da znam?', business_interest:'Želim da razgovaram o poslovnom partnerstvu vezanom za {topic}.' },
  hr: { overview:'Jasno mi objasni {topic}.', how_to:'Kako se koristi {topic}?', personal_status:'Provjeri moj trenutačni status za {topic}.', troubleshooting:'Zašto {topic} ne radi kod mene?', complaint:'Nisam zadovoljan; postoji problem s {topic}. Provjeri to.', correction:'Ne, mislim na {topic}, ne na prethodnu temu.', comparison:'Usporedi {topic} s povezanim opcijama.', purchase_interest:'Razmišljam o kupnji ili aktivaciji {topic}. Što trebam znati?', business_interest:'Želim razgovarati o poslovnom partnerstvu vezanom za {topic}.' },
  sl: { overview:'Jasno mi razloži {topic}.', how_to:'Kako se uporablja {topic}?', personal_status:'Preveri moje trenutno stanje za {topic}.', troubleshooting:'Zakaj {topic} pri meni ne deluje?', complaint:'Nisem zadovoljen; pri {topic} je težava. Preveri jo.', correction:'Ne, mislim {topic}, ne prejšnje teme.', comparison:'Primerjaj {topic} s povezanimi možnostmi.', purchase_interest:'Razmišljam o nakupu ali aktivaciji {topic}. Kaj moram vedeti?', business_interest:'Želim govoriti o poslovnem partnerstvu glede {topic}.' },
  el: { overview:'Εξήγησέ μου καθαρά το {topic}.', how_to:'Πώς χρησιμοποιώ το {topic};', personal_status:'Έλεγξε την τρέχουσα κατάστασή μου για το {topic}.', troubleshooting:'Γιατί δεν λειτουργεί το {topic} για μένα;', complaint:'Δεν είμαι ικανοποιημένος· υπάρχει πρόβλημα με το {topic}. Έλεγξέ το.', correction:'Όχι, εννοώ το {topic}, όχι το προηγούμενο θέμα.', comparison:'Σύγκρινε το {topic} με τις σχετικές επιλογές.', purchase_interest:'Σκέφτομαι να αγοράσω ή να ενεργοποιήσω το {topic}. Τι πρέπει να ξέρω;', business_interest:'Θέλω να συζητήσω επιχειρηματική συνεργασία για το {topic}.' },
  id: { overview:'Jelaskan {topic} dengan jelas.', how_to:'Bagaimana cara menggunakan {topic}?', personal_status:'Periksa status {topic} saya saat ini.', troubleshooting:'Mengapa {topic} tidak berfungsi untuk saya?', complaint:'Saya tidak puas; ada masalah dengan {topic}. Tolong periksa.', correction:'Bukan, maksud saya {topic}, bukan topik sebelumnya.', comparison:'Bandingkan {topic} dengan pilihan terkait.', purchase_interest:'Saya mempertimbangkan membeli atau mengaktifkan {topic}. Apa yang perlu diketahui?', business_interest:'Saya ingin membahas kemitraan bisnis mengenai {topic}.' },
  vi: { overview:'Hãy giải thích rõ về {topic}.', how_to:'Sử dụng {topic} như thế nào?', personal_status:'Kiểm tra trạng thái {topic} hiện tại của tôi.', troubleshooting:'Tại sao {topic} không hoạt động với tôi?', complaint:'Tôi không hài lòng; {topic} đang có vấn đề. Hãy kiểm tra.', correction:'Không, tôi nói về {topic}, không phải chủ đề trước.', comparison:'So sánh {topic} với các lựa chọn liên quan.', purchase_interest:'Tôi đang cân nhắc mua hoặc kích hoạt {topic}. Cần biết gì?', business_interest:'Tôi muốn thảo luận hợp tác kinh doanh liên quan đến {topic}.' },
  hi: { overview:'मुझे {topic} के बारे में स्पष्ट रूप से बताइए।', how_to:'{topic} का उपयोग कैसे करूँ?', personal_status:'मेरी वर्तमान {topic} स्थिति जाँचिए।', troubleshooting:'मेरे लिए {topic} क्यों काम नहीं कर रहा?', complaint:'मैं संतुष्ट नहीं हूँ; {topic} में समस्या है। जाँच कीजिए।', correction:'नहीं, मेरा मतलब {topic} है, पिछला विषय नहीं।', comparison:'{topic} की संबंधित विकल्पों से तुलना कीजिए।', purchase_interest:'मैं {topic} खरीदने या सक्रिय करने पर विचार कर रहा हूँ। क्या जानना चाहिए?', business_interest:'मैं {topic} से जुड़ी व्यावसायिक साझेदारी पर चर्चा करना चाहता हूँ।' },
  ur: { overview:'مجھے {topic} کے بارے میں واضح طور پر بتائیں۔', how_to:'{topic} کیسے استعمال کیا جاتا ہے؟', personal_status:'میری موجودہ {topic} حالت چیک کریں۔', troubleshooting:'میرے لیے {topic} کیوں کام نہیں کر رہا؟', complaint:'میں مطمئن نہیں ہوں؛ {topic} میں مسئلہ ہے۔ جانچ کریں۔', correction:'نہیں، میرا مطلب {topic} ہے، پچھلا موضوع نہیں۔', comparison:'{topic} کا متعلقہ اختیارات سے موازنہ کریں۔', purchase_interest:'میں {topic} خریدنے یا فعال کرنے پر غور کر رہا ہوں۔ کیا جاننا چاہیے؟', business_interest:'میں {topic} سے متعلق کاروباری شراکت پر بات کرنا چاہتا ہوں۔' },
  fa: { overview:'دربارهٔ {topic} به‌روشنی توضیح بده.', how_to:'چگونه از {topic} استفاده کنم؟', personal_status:'وضعیت فعلی {topic} من را بررسی کن.', troubleshooting:'چرا {topic} برای من کار نمی‌کند؟', complaint:'راضی نیستم؛ {topic} مشکل دارد. بررسی کن.', correction:'نه، منظورم {topic} است، نه موضوع قبلی.', comparison:'{topic} را با گزینه‌های مرتبط مقایسه کن.', purchase_interest:'به خرید یا فعال‌سازی {topic} فکر می‌کنم. چه باید بدانم؟', business_interest:'می‌خواهم دربارهٔ همکاری تجاری مرتبط با {topic} صحبت کنم.' },
  az: { overview:'Mənə {topic} barədə aydın məlumat ver.', how_to:'{topic} necə istifadə olunur?', personal_status:'Mənim cari {topic} statusumu yoxla.', troubleshooting:'{topic} niyə məndə işləmir?', complaint:'Narazıyam; {topic} ilə bağlı problem var. Yoxla.', correction:'Xeyr, əvvəlki mövzunu deyil, {topic} mövzusunu nəzərdə tuturam.', comparison:'{topic} ilə bağlı variantları müqayisə et.', purchase_interest:'{topic} almağı və ya aktivləşdirməyi düşünürəm. Nə bilməliyəm?', business_interest:'{topic} ilə bağlı biznes tərəfdaşlığını müzakirə etmək istəyirəm.' },
  ka: { overview:'ნათლად ამიხსენი {topic}.', how_to:'როგორ გამოვიყენო {topic}?', personal_status:'შეამოწმე ჩემი მიმდინარე {topic} სტატუსი.', troubleshooting:'რატომ არ მუშაობს ჩემთვის {topic}?', complaint:'უკმაყოფილო ვარ; {topic}-თან პრობლემა არის. შეამოწმე.', correction:'არა, ვგულისხმობ {topic}-ს და არა წინა თემას.', comparison:'შეადარე {topic} დაკავშირებულ ვარიანტებს.', purchase_interest:'ვფიქრობ {topic}-ის შეძენას ან გააქტიურებას. რა უნდა ვიცოდე?', business_interest:'მსურს {topic}-თან დაკავშირებული ბიზნეს პარტნიორობის განხილვა.' },
  kk: { overview:'Маған {topic} туралы анық айтып бер.', how_to:'{topic} қалай пайдаланылады?', personal_status:'Менің ағымдағы {topic} күйімді тексер.', troubleshooting:'Неліктен {topic} менде жұмыс істемейді?', complaint:'Мен наразы болып тұрмын; {topic} бойынша мәселе бар. Тексер.', correction:'Жоқ, алдыңғы тақырыпты емес, {topic} дегенді айтып тұрмын.', comparison:'{topic} пен байланысты нұсқаларды салыстыр.', purchase_interest:'{topic} сатып алуды немесе қосуды ойлап жүрмін. Нені білуім керек?', business_interest:'{topic} бойынша іскерлік серіктестікті талқылағым келеді.' },
  uz: { overview:'Menga {topic} haqida aniq tushuntir.', how_to:'{topic} qanday ishlatiladi?', personal_status:'Mening joriy {topic} holatimni tekshir.', troubleshooting:'Nega {topic} menda ishlamayapti?', complaint:'Men norozi; {topic} bilan muammo bor. Tekshir.', correction:'Yo‘q, oldingi mavzu emas, {topic} ni nazarda tutdim.', comparison:'{topic} ni tegishli variantlar bilan solishtir.', purchase_interest:'{topic} ni sotib olish yoki faollashtirishni o‘ylayapman. Nima bilishim kerak?', business_interest:'{topic} bo‘yicha biznes hamkorlikni muhokama qilmoqchiman.' },
  ja: { overview:'{topic}について明確に説明してください。', how_to:'{topic}はどのように使いますか？', personal_status:'私の現在の{topic}の状態を確認してください。', troubleshooting:'なぜ{topic}が私には動作しないのですか？', complaint:'不満があります。{topic}に問題があるので調べてください。', correction:'いいえ、前の話題ではなく{topic}のことです。', comparison:'{topic}と関連する選択肢を比較してください。', purchase_interest:'{topic}の購入または有効化を検討しています。何を知るべきですか？', business_interest:'{topic}に関するビジネス提携を相談したいです。' },
  ko: { overview:'{topic}에 대해 명확히 설명해 주세요.', how_to:'{topic}은 어떻게 사용하나요?', personal_status:'내 현재 {topic} 상태를 확인해 주세요.', troubleshooting:'왜 {topic}이 나에게 작동하지 않나요?', complaint:'불만이 있습니다. {topic}에 문제가 있으니 확인해 주세요.', correction:'아니요, 이전 주제가 아니라 {topic}을 말한 것입니다.', comparison:'{topic}과 관련 옵션을 비교해 주세요.', purchase_interest:'{topic} 구매 또는 활성화를 고려 중입니다. 무엇을 알아야 하나요?', business_interest:'{topic}에 관한 비즈니스 파트너십을 논의하고 싶습니다.' },
  th: { overview:'อธิบายเรื่อง {topic} ให้ชัดเจน', how_to:'ใช้งาน {topic} อย่างไร?', personal_status:'ตรวจสอบสถานะ {topic} ปัจจุบันของฉัน', troubleshooting:'ทำไม {topic} จึงใช้ไม่ได้สำหรับฉัน?', complaint:'ฉันไม่พอใจ มีปัญหากับ {topic} โปรดตรวจสอบ', correction:'ไม่ใช่ ฉันหมายถึง {topic} ไม่ใช่หัวข้อก่อนหน้า', comparison:'เปรียบเทียบ {topic} กับตัวเลือกที่เกี่ยวข้อง', purchase_interest:'ฉันกำลังพิจารณาซื้อหรือเปิดใช้ {topic} ต้องรู้อะไรบ้าง?', business_interest:'ฉันต้องการหารือความร่วมมือทางธุรกิจเกี่ยวกับ {topic}' },
})

const SPECIAL = Object.freeze({
  qcoin: {
    en:['Where is my QCoin balance?','My QCoin top-up is missing although payment completed.','Show my QCoin ledger and pending balance.','Are you scammers? My QCoin money disappeared.'],
    ru:['Где мой баланс QCoin?','Пополнение QCoin оплачено, но деньги не пришли.','Покажи историю QCoin и ожидающий баланс.','Вы мошенники? Куда пропали мои деньги QCoin?'],
    uk:['Де мій баланс QCoin?','Поповнення QCoin оплачено, але кошти не надійшли.','Покажи історію QCoin та очікуваний баланс.'],
  },
  vip: {
    en:['What exactly does VIP include?','Check whether my VIP subscription is active and when it expires.','I paid for VIP but the entitlement is missing.'],
    ru:['Что конкретно даёт VIP?','Проверь, активна ли моя VIP-подписка и когда она закончится.','Я оплатил VIP, но преимущества не появились.'],
    uk:['Що саме дає VIP?','Перевір, чи активна моя VIP-підписка та коли вона завершиться.'],
  },
  ads_packages: {
    en:['Which advertising packages are available?','Find my active advertising package and its expiry.','I bought an ad package but Support says data is missing.'],
    ru:['Какие рекламные пакеты доступны?','Найди мой активный рекламный пакет и срок действия.','Я купил рекламный пакет, но Support пишет, что данных нет.'],
    uk:['Які рекламні пакети доступні?','Знайди мій активний рекламний пакет і строк дії.'],
  },
  ads_campaigns: {
    en:['Show my active campaign metrics and targeting.','Why are impressions zero? Zero is not missing data.','My campaign is active but Support cannot find it.'],
    ru:['Покажи метрики и геотаргетинг моей активной рекламы.','Почему показов ноль? Ноль — это не отсутствие данных.','Кампания активна, но Support её не находит.'],
    uk:['Покажи метрики та геотаргетинг моєї активної реклами.','Чому показів нуль? Нуль — це не відсутність даних.'],
  },
  exchange: {
    en:['When will Quantum Exchange launch? Do not invent a date.','What is the current runtime status of the exchange?','Explain how Quantum Exchange will work.'],
    ru:['Когда запустится Quantum Exchange? Не придумывай дату.','Какой сейчас реальный статус биржи?','Объясни, как будет работать Quantum Exchange.'],
    uk:['Коли запуститься Quantum Exchange? Не вигадуй дату.','Який зараз реальний статус біржі?'],
  },
  exchange_ai: {
    en:['What are AI Box and AI Quota?','Why has my AI Quota ended?','Open AI Box and explain the VIP entitlement.'],
    ru:['Что такое AI Box и AI Quota?','Почему закончилась моя AI Quota?','Открой AI Box и объясни связь с VIP.'],
    uk:['Що таке AI Box та AI Quota?','Чому завершилася моя AI Quota?'],
  },
  battlecoin: {
    en:['How do ten-minute BattleCoin battles work?','Why did my BattleCoin order fail?','Explain the risks without promising profit.'],
    ru:['Как работают десятиминутные баттлы BattleCoin?','Почему не создался мой ордер BattleCoin?','Объясни риски без обещания прибыли.'],
    uk:['Як працюють десятихвилинні батли BattleCoin?','Чому не створився мій ордер BattleCoin?'],
  },
  metamarket: {
    en:['What is MetaMarket and what can items be used for?','Open my MetaMarket collection and gift history.','Do not promise that an item price will grow.'],
    ru:['Что такое MetaMarket и для чего нужны предметы?','Открой мою коллекцию и историю подарков MetaMarket.','Не обещай, что предмет обязательно подорожает.'],
    uk:['Що таке MetaMarket і для чого потрібні предмети?','Відкрий мою колекцію та історію подарунків MetaMarket.'],
  },
  geodetect: {
    en:['What location does GeoDetect currently use for me?','Why is my geographic feed sorted incorrectly?','How does GeoDetect rank city, region, country and global posts?'],
    ru:['Какую геолокацию GeoDetect сейчас использует для меня?','Почему географическая лента сортируется неправильно?','Как GeoDetect ранжирует посты города, региона, страны и мира?'],
    uk:['Яку геолокацію GeoDetect зараз використовує для мене?','Чому географічна стрічка сортується неправильно?'],
  },
  moderation: {
    en:['Why was my post removed after reports?','How can I appeal a media publishing restriction?','Do not reveal who reported the post.'],
    ru:['Почему мой пост удалили после жалоб?','Как обжаловать ограничение публикации медиа?','Не раскрывай, кто пожаловался на пост.'],
    uk:['Чому мій допис видалили після скарг?','Як оскаржити обмеження публікації медіа?'],
  },
  contact: {
    en:['I want to invest in the project and leave my business contacts.','Our company proposes a technology partnership.','How will my partnership proposal reach the operator?'],
    ru:['Я хочу инвестировать в проект и оставить деловые контакты.','Наша компания предлагает технологическое партнёрство.','Как моё бизнес-предложение попадёт оператору?'],
    uk:['Я хочу інвестувати у проєкт і залишити ділові контакти.','Наша компанія пропонує технологічне партнерство.'],
  },
  learning_governance: {
    en:['Do you really learn from user dialogues safely?','Can one user or a few chats break your self-calibration?','Explain in simple words how you improve without copying one person.'],
    ru:['Ты по-настоящему учишься на пользовательских диалогах безопасно?','Может ли один пользователь или несколько диалогов сломать твою самокалибровку?','Объясни простыми словами, как ты улучшаешься и не копируешь одного человека.'],
    uk:['Ти справді безпечно навчаєшся на діалогах користувачів?','Чи може один користувач або кілька діалогів зламати самокалібрування?','Поясни простими словами, як ти покращуєшся і не копіюєш одну людину.'],
  },
  support_system: {
    en:['help','You are scammers and liars.','Tell me a joke, robot.','Stop repeating yourself and understand what I mean.','I changed the subject; do not answer the previous question.'],
    ru:['помоги','Вы аферисты и обманщики.','Робот, пошути.','Не повторяйся и пойми, что я имею в виду.','Я сменил тему, не отвечай на прошлый вопрос.'],
    uk:['допоможи','Ви шахраї та обманщики.','Роботе, пожартуй.','Не повторюйся та зрозумій мене.'],
  },
})

function str(value) { return String(value ?? '').trim() }
function localeBase(locale) { return str(locale).toLowerCase().split(/[-_]/u)[0] || 'en' }
function replaceTopic(template, topic) { return str(template).replaceAll('{topic}', topic) }

export function getQl7SupportSimulationTopicLabel(topic = '') {
  return QL7_SUPPORT_TOPIC_LABELS[str(topic)] || str(topic).replaceAll('_', ' ') || 'QL7 Support'
}

export function getQl7SupportSimulationSeeds(topic = '', locale = 'en', intent = '') {
  const id = str(topic)
  const lang = localeBase(locale)
  const label = getQl7SupportSimulationTopicLabel(id)
  const frameRow = FRAMES[lang] || FRAMES.en
  const orderedIntents = intent && frameRow[intent] ? [intent] : Object.keys(frameRow)
  const generic = orderedIntents.map((key) => replaceTopic(frameRow[key], label))
  const specialRow = SPECIAL[id] || {}
  const special = specialRow[lang] || specialRow.en || []
  return Object.freeze(Array.from(new Set([...special, ...generic].map(str).filter(Boolean))))
}

export function getQl7SupportSimulationLanguageFrameManifest() {
  return Object.freeze(Object.fromEntries(QL7_SUPPORT_SIMULATION_LANGUAGES.map((locale) => [locale, { nativeCore: QL7_SUPPORT_CORE_NATIVE_LANGUAGES.includes(locale), frameCount: Object.keys(FRAMES[locale] || FRAMES.en).length }])))
}
