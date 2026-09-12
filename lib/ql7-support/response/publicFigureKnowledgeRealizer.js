import {ql7Arr, ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_PUBLIC_FIGURE_KNOWLEDGE_REALIZER_VERSION='1.0.0'

// Response-owned, reviewed realizations for the only profiles that currently have
// four source-bound substantive facts. Sparse catalog identities remain source-gated.
const S=Object.freeze({
  aristotle:Object.freeze({
    en:'Aristotle was a philosopher and polymath of Classical Greece. His major work covered logic, ethics, metaphysics, politics, biology and rhetoric; notable texts include Nicomachean Ethics and Politics.',
    ru:'Аристотель был философом и учёным-энциклопедистом Древней Греции. Его основные труды посвящены логике, этике, метафизике, политике, биологии и риторике; среди известных работ — «Никомахова этика» и «Политика».',
    uk:'Арістотель був філософом і вченим-енциклопедистом Давньої Греції. Його основні праці присвячені логіці, етиці, метафізиці, політиці, біології та риториці; серед відомих робіт — «Нікомахова етика» і «Політика».',
    es:'Aristóteles fue un filósofo y polímata de la Grecia clásica. Sus principales trabajos abarcaron lógica, ética, metafísica, política, biología y retórica; entre sus obras destacan Ética a Nicómaco y Política.',
    tr:'Aristoteles, Klasik Yunan döneminin filozofu ve çok yönlü bir bilginiydi. Mantık, etik, metafizik, siyaset, biyoloji ve retorik üzerine çalıştı; Nikomakhos’a Etik ile Politika öne çıkan eserleridir.',
    ar:'كان أرسطو فيلسوفاً وموسوعياً من اليونان الكلاسيكية. تناولت أعماله الرئيسية المنطق والأخلاق والميتافيزيقا والسياسة والأحياء والبلاغة؛ ومن أبرز مؤلفاته «الأخلاق النيقوماخية» و«السياسة».',
    zh:'亚里士多德是古典希腊的哲学家和博学家。他的重要研究涵盖逻辑学、伦理学、形而上学、政治学、生物学和修辞学，代表作包括《尼各马可伦理学》和《政治学》。',
    he:'אריסטו היה פילוסוף ואיש אשכולות ביוון הקלאסית. עבודתו המרכזית עסקה בלוגיקה, אתיקה, מטפיזיקה, פוליטיקה, ביולוגיה ורטוריקה; בין חיבוריו הבולטים נמצאים ״האתיקה הניקומאכית״ ו״פוליטיקה״.',
  }),
  'nelson-mandela':Object.freeze({
    en:'Nelson Mandela was an anti-apartheid leader and politician who served as President of South Africa from 1994 to 1999. He received the 1993 Nobel Peace Prize and became a central figure in the country’s transition from apartheid.',
    ru:'Нельсон Мандела был лидером борьбы против апартеида и политиком, занимавшим пост президента Южной Африки с 1994 по 1999 год. Он получил Нобелевскую премию мира 1993 года и стал одной из ключевых фигур перехода страны от апартеида.',
    uk:'Нельсон Мандела був лідером боротьби проти апартеїду й політиком, який обіймав посаду президента Південної Африки з 1994 до 1999 року. Він отримав Нобелівську премію миру 1993 року та став однією з ключових постатей переходу країни від апартеїду.',
    es:'Nelson Mandela fue un líder contra el apartheid y político que presidió Sudáfrica entre 1994 y 1999. Recibió el Premio Nobel de la Paz de 1993 y fue una figura central en la transición del país desde el apartheid.',
    tr:'Nelson Mandela, apartheid karşıtı bir lider ve 1994-1999 yılları arasında Güney Afrika Cumhurbaşkanı olarak görev yapan bir siyasetçiydi. 1993 Nobel Barış Ödülü’nü aldı ve ülkenin apartheid’dan çıkış sürecinin merkezî isimlerinden biri oldu.',
    ar:'كان نيلسون مانديلا قائداً مناهضاً للفصل العنصري وسياسياً تولى رئاسة جنوب أفريقيا من 1994 إلى 1999. نال جائزة نوبل للسلام عام 1993 وأصبح شخصية محورية في انتقال البلاد من نظام الفصل العنصري.',
    zh:'纳尔逊·曼德拉是反种族隔离运动领袖和政治家，1994年至1999年任南非总统。他获得了1993年诺贝尔和平奖，并成为南非结束种族隔离进程中的核心人物。',
    he:'נלסון מנדלה היה מנהיג המאבק באפרטהייד ופוליטיקאי שכיהן כנשיא דרום אפריקה בשנים 1994–1999. הוא קיבל את פרס נובל לשלום לשנת 1993 והיה דמות מרכזית במעבר המדינה ממשטר האפרטהייד.',
  }),
  'albert-einstein':Object.freeze({
    en:'Albert Einstein was a theoretical physicist who developed the theory of relativity. He received the 1921 Nobel Prize in Physics and is also known for work on the photoelectric effect and mass–energy equivalence.',
    ru:'Альберт Эйнштейн был физиком-теоретиком, разработавшим теорию относительности. Он получил Нобелевскую премию по физике за 1921 год и также известен работами о фотоэффекте и эквивалентности массы и энергии.',
    uk:'Альберт Ейнштейн був фізиком-теоретиком, який розробив теорію відносності. Він отримав Нобелівську премію з фізики за 1921 рік і також відомий працями про фотоефект та еквівалентність маси й енергії.',
    es:'Albert Einstein fue un físico teórico que desarrolló la teoría de la relatividad. Recibió el Premio Nobel de Física de 1921 y también es conocido por sus trabajos sobre el efecto fotoeléctrico y la equivalencia entre masa y energía.',
    tr:'Albert Einstein, görelilik kuramını geliştiren bir teorik fizikçiydi. 1921 Nobel Fizik Ödülü’nü aldı; fotoelektrik etki ve kütle-enerji eşdeğerliği üzerine çalışmalarıyla da tanınır.',
    ar:'كان ألبرت أينشتاين فيزيائياً نظرياً طوّر نظرية النسبية. نال جائزة نوبل في الفيزياء لعام 1921، ويُعرف أيضاً بعمله على التأثير الكهروضوئي وتكافؤ الكتلة والطاقة.',
    zh:'阿尔伯特·爱因斯坦是提出相对论的理论物理学家。他获得了1921年诺贝尔物理学奖，也因光电效应和质能等价方面的研究而闻名。',
    he:'אלברט איינשטיין היה פיזיקאי תאורטי שפיתח את תורת היחסות. הוא קיבל את פרס נובל לפיזיקה לשנת 1921 ונודע גם בעבודתו על האפקט הפוטואלקטרי ועל שקילות מסה ואנרגיה.',
  }),
  'mahatma-gandhi':Object.freeze({
    en:'Mahatma Gandhi was a lawyer and anti-colonial political leader who advocated nonviolent resistance. He led India’s independence movement and influenced later civil-rights movements.',
    ru:'Махатма Ганди был юристом и лидером антиколониального движения, отстаивавшим ненасильственное сопротивление. Он возглавлял движение за независимость Индии и повлиял на последующие движения за гражданские права.',
    uk:'Махатма Ганді був юристом і лідером антиколоніального руху, який обстоював ненасильницький опір. Він очолював рух за незалежність Індії та вплинув на подальші рухи за громадянські права.',
    es:'Mahatma Gandhi fue abogado y líder político anticolonial, defensor de la resistencia no violenta. Encabezó el movimiento de independencia de la India e influyó en movimientos posteriores por los derechos civiles.',
    tr:'Mahatma Gandhi, şiddetsiz direnişi savunan bir avukat ve sömürgecilik karşıtı siyasi liderdi. Hindistan bağımsızlık hareketine öncülük etti ve sonraki sivil haklar hareketlerini etkiledi.',
    ar:'كان مهاتما غاندي محامياً وقائداً سياسياً مناهضاً للاستعمار وداعياً إلى المقاومة اللاعنفية. قاد حركة استقلال الهند وأثر في حركات الحقوق المدنية اللاحقة.',
    zh:'圣雄甘地是律师和反殖民政治领袖，主张非暴力抵抗。他领导了印度独立运动，并影响了后来的一系列民权运动。',
    he:'מהטמה גנדי היה עורך דין ומנהיג פוליטי אנטי-קולוניאלי שדגל בהתנגדות לא-אלימה. הוא הוביל את תנועת העצמאות של הודו והשפיע על תנועות זכויות אזרח מאוחרות יותר.',
  }),
  'pablo-picasso':Object.freeze({
    en:'Pablo Picasso was a painter and sculptor associated with modern art. He co-developed Cubism, and Guernica is among his best-known works.',
    ru:'Пабло Пикассо был художником и скульптором, связанным с модернистским искусством. Он участвовал в создании кубизма, а «Герника» относится к числу его самых известных работ.',
    uk:'Пабло Пікассо був художником і скульптором, пов’язаним із модерністським мистецтвом. Він брав участь у формуванні кубізму, а «Герніка» належить до його найвідоміших робіт.',
    es:'Pablo Picasso fue pintor y escultor vinculado al arte moderno. Codesarrolló el cubismo, y Guernica figura entre sus obras más conocidas.',
    tr:'Pablo Picasso, modern sanatla ilişkilendirilen bir ressam ve heykeltıraştı. Kübizmin geliştirilmesine öncülük etti; Guernica en tanınmış eserlerinden biridir.',
    ar:'كان بابلو بيكاسو رساماً ونحاتاً ارتبط بالفن الحديث. شارك في تطوير التكعيبية، وتعد «غيرنيكا» من أشهر أعماله.',
    zh:'巴勃罗·毕加索是现代艺术领域的画家和雕塑家。他共同推动了立体主义的发展，《格尔尼卡》是他最著名的作品之一。',
    he:'פבלו פיקאסו היה צייר ופסל המזוהה עם האמנות המודרנית. הוא היה שותף לפיתוח הקוביזם, ו״גרניקה״ היא מן היצירות הידועות ביותר שלו.',
  }),
  'martin-luther-king-jr':Object.freeze({
    en:'Martin Luther King Jr. was a Baptist minister and civil-rights leader who advocated nonviolent activism. He received the 1964 Nobel Peace Prize, and his I Have a Dream speech is one of his best-known works.',
    ru:'Мартин Лютер Кинг-младший был баптистским пастором и лидером движения за гражданские права, выступавшим за ненасильственную борьбу. Он получил Нобелевскую премию мира 1964 года; его речь «У меня есть мечта» стала одной из самых известных.',
    uk:'Мартін Лютер Кінг-молодший був баптистським пастором і лідером руху за громадянські права, який обстоював ненасильницьку боротьбу. Він отримав Нобелівську премію миру 1964 року; його промова «Я маю мрію» стала однією з найвідоміших.',
    es:'Martin Luther King Jr. fue pastor bautista y líder de los derechos civiles, defensor del activismo no violento. Recibió el Premio Nobel de la Paz de 1964, y su discurso I Have a Dream es una de sus obras más conocidas.',
    tr:'Martin Luther King Jr., şiddetsiz sivil haklar mücadelesini savunan Baptist bir din görevlisi ve sivil haklar lideriydi. 1964 Nobel Barış Ödülü’nü aldı; I Have a Dream konuşması en bilinen çalışmalarındandır.',
    ar:'كان مارتن لوثر كينغ الابن قساً معمدانياً وقائداً للحقوق المدنية دعا إلى النشاط اللاعنفي. نال جائزة نوبل للسلام عام 1964، ويُعد خطاب «لدي حلم» من أشهر أعماله.',
    zh:'马丁·路德·金是浸礼会牧师和民权领袖，倡导非暴力民权行动。他获得了1964年诺贝尔和平奖，《我有一个梦想》演讲是其最著名的作品之一。',
    he:'מרטין לותר קינג הבן היה כומר בפטיסטי ומנהיג זכויות אזרח שדגל בפעילות לא-אלימה. הוא קיבל את פרס נובל לשלום לשנת 1964, ונאומו ״יש לי חלום״ הוא מן העבודות המזוהות עמו ביותר.',
  }),
  'leonardo-da-vinci':Object.freeze({
    en:'Leonardo da Vinci was an artist and polymath of the Italian Renaissance. The Mona Lisa and The Last Supper are among his best-known works, alongside studies in drawing, anatomy and engineering.',
    ru:'Леонардо да Винчи был художником и учёным-энциклопедистом итальянского Возрождения. «Мона Лиза» и «Тайная вечеря» входят в число его самых известных работ; он также занимался рисунком, анатомией и инженерными исследованиями.',
    uk:'Леонардо да Вінчі був художником і вченим-енциклопедистом італійського Відродження. «Мона Ліза» і «Таємна вечеря» належать до його найвідоміших робіт; він також займався рисунком, анатомією та інженерними дослідженнями.',
    es:'Leonardo da Vinci fue artista y polímata del Renacimiento italiano. La Mona Lisa y La última cena están entre sus obras más conocidas, junto con sus estudios de dibujo, anatomía e ingeniería.',
    tr:'Leonardo da Vinci, İtalyan Rönesansı’nın sanatçısı ve çok yönlü bir bilginiydi. Mona Lisa ile Son Akşam Yemeği en tanınmış eserlerindendir; çizim, anatomi ve mühendislik çalışmaları da yaptı.',
    ar:'كان ليوناردو دا فينشي فناناً وموسوعياً من عصر النهضة الإيطالية. تعد «الموناليزا» و«العشاء الأخير» من أشهر أعماله، إلى جانب دراساته في الرسم والتشريح والهندسة.',
    zh:'列奥纳多·达·芬奇是意大利文艺复兴时期的艺术家和博学家。《蒙娜丽莎》和《最后的晚餐》是他最著名的作品之一，他还研究绘画、解剖学和工程学。',
    he:'לאונרדו דה וינצ׳י היה אמן ואיש אשכולות מתקופת הרנסאנס האיטלקי. ״מונה ליזה״ ו״הסעודה האחרונה״ הן מן היצירות הידועות שלו, לצד מחקרים ברישום, אנטומיה והנדסה.',
  }),
  'nikola-tesla':Object.freeze({
    en:'Nikola Tesla was an inventor and electrical engineer known for work on alternating-current power systems. His legacy is also associated with induction motors and high-voltage experiments.',
    ru:'Никола Тесла был изобретателем и инженером-электриком, известным работами над системами переменного тока. Его наследие также связано с асинхронными двигателями и экспериментами с высоким напряжением.',
    uk:'Нікола Тесла був винахідником та інженером-електриком, відомим роботами над системами змінного струму. Його спадщина також пов’язана з асинхронними двигунами й експериментами з високою напругою.',
    es:'Nikola Tesla fue inventor e ingeniero eléctrico, conocido por su trabajo en sistemas de corriente alterna. Su legado también se asocia con los motores de inducción y los experimentos de alta tensión.',
    tr:'Nikola Tesla, alternatif akım güç sistemleri üzerine çalışmalarıyla tanınan bir mucit ve elektrik mühendisiydi. Mirası indüksiyon motorları ve yüksek gerilim deneyleriyle de ilişkilidir.',
    ar:'كان نيكولا تسلا مخترعاً ومهندساً كهربائياً عُرف بعمله على أنظمة طاقة التيار المتردد. ويرتبط إرثه أيضاً بالمحركات الحثية وتجارب الجهد العالي.',
    zh:'尼古拉·特斯拉是发明家和电气工程师，以交流电力系统方面的工作而闻名。他的成就还与感应电动机和高压实验有关。',
    he:'ניקולה טסלה היה ממציא ומהנדס חשמל שנודע בעבודתו על מערכות זרם חילופין. מורשתו קשורה גם למנועי השראה ולניסויי מתח גבוה.',
  }),
  'vincent-van-gogh':Object.freeze({
    en:'Vincent van Gogh was a Post-Impressionist painter whose best-known works include The Starry Night and Sunflowers. His art had a major influence on modern art.',
    ru:'Винсент ван Гог был художником-постимпрессионистом; среди его самых известных работ — «Звёздная ночь» и «Подсолнухи». Его творчество оказало значительное влияние на современное искусство.',
    uk:'Вінсент ван Гог був художником-постімпресіоністом; серед його найвідоміших робіт — «Зоряна ніч» і «Соняшники». Його творчість істотно вплинула на сучасне мистецтво.',
    es:'Vincent van Gogh fue un pintor posimpresionista; entre sus obras más conocidas están La noche estrellada y Los girasoles. Su arte ejerció una gran influencia en el arte moderno.',
    tr:'Vincent van Gogh, Yıldızlı Gece ve Ayçiçekleri gibi eserleriyle tanınan Post-Empresyonist bir ressamdı. Sanatı modern sanat üzerinde büyük etki bıraktı.',
    ar:'كان فنسنت فان غوخ رساماً من تيار ما بعد الانطباعية؛ ومن أشهر أعماله «ليلة النجوم» و«عباد الشمس». ترك فنه تأثيراً كبيراً في الفن الحديث.',
    zh:'文森特·梵高是后印象派画家，代表作包括《星月夜》和《向日葵》。他的艺术对现代艺术产生了重要影响。',
    he:'וינסנט ואן גוך היה צייר פוסט-אימפרסיוניסטי, ובין יצירותיו הידועות נמצאות ״ליל כוכבים״ ו״חמניות״. אמנותו השפיעה רבות על האמנות המודרנית.',
  }),
  'marie-curie':Object.freeze({
    en:'Marie Curie was a physicist and chemist who pioneered research on radioactivity. She received Nobel Prizes in Physics and Chemistry and was the first person to win Nobel Prizes in two scientific fields.',
    ru:'Мария Кюри была физиком и химиком, проводившей новаторские исследования радиоактивности. Она получила Нобелевские премии по физике и химии и стала первым человеком, удостоенным Нобелевских премий в двух научных областях.',
    uk:'Марія Кюрі була фізикинею та хімікинею, яка проводила новаторські дослідження радіоактивності. Вона отримала Нобелівські премії з фізики й хімії та стала першою людиною, відзначеною Нобелівськими преміями у двох наукових галузях.',
    es:'Marie Curie fue física y química, pionera en la investigación de la radiactividad. Recibió los Premios Nobel de Física y Química y fue la primera persona en ganar Nobel en dos campos científicos.',
    tr:'Marie Curie, radyoaktivite araştırmalarına öncülük eden bir fizikçi ve kimyagerdi. Fizik ve Kimya dallarında Nobel Ödülleri aldı ve iki bilim alanında Nobel kazanan ilk kişi oldu.',
    ar:'كانت ماري كوري عالمة فيزياء وكيمياء ورائدة في أبحاث النشاط الإشعاعي. نالت جائزتي نوبل في الفيزياء والكيمياء، وكانت أول شخص يفوز بنوبل في مجالين علميين.',
    zh:'玛丽·居里是物理学家和化学家，也是放射性研究的先驱。她获得了诺贝尔物理学奖和化学奖，是首位在两个科学领域获得诺贝尔奖的人。',
    he:'מארי קירי הייתה פיזיקאית וכימאית וחלוצה בחקר הרדיואקטיביות. היא קיבלה פרסי נובל בפיזיקה ובכימיה והייתה האדם הראשון שזכה בפרסי נובל בשני תחומים מדעיים.',
  }),
  'alan-turing':Object.freeze({
    en:'Alan Turing was a mathematician and computer scientist whose work helped found theoretical computer science. He contributed to wartime cryptanalysis at Bletchley Park and introduced the concept of the Turing machine.',
    ru:'Алан Тьюринг был математиком и специалистом по вычислительной технике, чьи работы заложили основы теоретической информатики. Он участвовал в военном криптоанализе в Блетчли-парке и предложил концепцию машины Тьюринга.',
    uk:'Алан Тюрінг був математиком і фахівцем з обчислювальної техніки, чиї роботи заклали основи теоретичної інформатики. Він брав участь у воєнному криптоаналізі в Блетчлі-парку та запропонував концепцію машини Тюрінга.',
    es:'Alan Turing fue matemático y científico de la computación; su trabajo fue fundamental para la informática teórica. Participó en el criptoanálisis de guerra en Bletchley Park e introdujo el concepto de la máquina de Turing.',
    tr:'Alan Turing, kuramsal bilgisayar biliminin temellerine katkı veren bir matematikçi ve bilgisayar bilimciydi. Bletchley Park’taki savaş dönemi kriptoanalizinde çalıştı ve Turing makinesi kavramını ortaya koydu.',
    ar:'كان آلان تورنغ عالِم رياضيات وحاسوب أسهم عمله في تأسيس علوم الحاسوب النظرية. شارك في تحليل الشفرات زمن الحرب في بلتشلي بارك وطرح مفهوم آلة تورنغ.',
    zh:'艾伦·图灵是数学家和计算机科学家，其工作奠定了理论计算机科学的基础。他参与了布莱切利园的战时密码分析，并提出了图灵机概念。',
    he:'אלן טיורינג היה מתמטיקאי ומדען מחשב שעבודתו סייעה להניח את יסודות מדעי המחשב התאורטיים. הוא השתתף בפענוח צפנים בבלצ׳לי פארק בזמן המלחמה והציג את רעיון מכונת טיורינג.',
  }),
  'william-shakespeare':Object.freeze({
    en:'William Shakespeare was a playwright and poet of the English Renaissance. Hamlet, Macbeth and Romeo and Juliet are among his major works, and his writing had a profound influence on English-language drama and literature.',
    ru:'Уильям Шекспир был драматургом и поэтом английского Возрождения. «Гамлет», «Макбет» и «Ромео и Джульетта» входят в число его главных произведений; его творчество глубоко повлияло на англоязычную драму и литературу.',
    uk:'Вільям Шекспір був драматургом і поетом англійського Відродження. «Гамлет», «Макбет» і «Ромео та Джульєтта» належать до його головних творів; його творчість глибоко вплинула на англомовну драму й літературу.',
    es:'William Shakespeare fue dramaturgo y poeta del Renacimiento inglés. Hamlet, Macbeth y Romeo y Julieta figuran entre sus obras principales, y su escritura influyó profundamente en el teatro y la literatura en lengua inglesa.',
    tr:'William Shakespeare, İngiliz Rönesansı’nın oyun yazarı ve şairiydi. Hamlet, Macbeth ile Romeo ve Juliet başlıca eserlerindendir; yazıları İngilizce tiyatro ve edebiyat üzerinde derin etki bıraktı.',
    ar:'كان ويليام شكسبير كاتباً مسرحياً وشاعراً من عصر النهضة الإنجليزية. تعد «هاملت» و«ماكبث» و«روميو وجولييت» من أبرز أعماله، وقد تركت كتاباته أثراً عميقاً في المسرح والأدب الإنجليزيين.',
    zh:'威廉·莎士比亚是英国文艺复兴时期的剧作家和诗人。《哈姆雷特》《麦克白》和《罗密欧与朱丽叶》是其主要作品，他对英语戏剧和文学产生了深远影响。',
    he:'ויליאם שייקספיר היה מחזאי ומשורר מתקופת הרנסאנס האנגלי. ״המלט״, ״מקבת׳״ ו״רומיאו ויוליה״ הן מיצירותיו המרכזיות, וכתיבתו השפיעה עמוקות על הדרמה והספרות באנגלית.',
  }),
  socrates:Object.freeze({
    en:'Socrates was a philosopher of Classical Athens, associated with the Socratic method of questioning. His thought had a major influence on Western philosophy.',
    ru:'Сократ был философом классических Афин, с которым связывают сократический метод постановки вопросов. Его идеи оказали значительное влияние на западную философию.',
    uk:'Сократ був філософом класичних Афін, з яким пов’язують сократівський метод постановки запитань. Його ідеї істотно вплинули на західну філософію.',
    es:'Sócrates fue un filósofo de la Atenas clásica, asociado con el método socrático de preguntas. Su pensamiento ejerció una gran influencia en la filosofía occidental.',
    tr:'Sokrates, Sokratik sorgulama yöntemiyle ilişkilendirilen Klasik Atina filozofuydu. Düşüncesi Batı felsefesi üzerinde büyük etki bıraktı.',
    ar:'كان سقراط فيلسوفاً من أثينا الكلاسيكية، وارتبط اسمه بالمنهج السقراطي في طرح الأسئلة. ترك فكره تأثيراً كبيراً في الفلسفة الغربية.',
    zh:'苏格拉底是古典雅典的哲学家，苏格拉底式提问法与他密切相关。他的思想对西方哲学产生了重要影响。',
    he:'סוקרטס היה פילוסוף באתונה הקלאסית, המזוהה עם שיטת התשאול הסוקרטית. להגותו הייתה השפעה רבה על הפילוסופיה המערבית.',
  }),
  'ada-lovelace':Object.freeze({
    en:'Ada Lovelace was a mathematician and writer linked to the early history of computing. Her notes on Charles Babbage’s Analytical Engine included an algorithm, and she is often described as an early programming pioneer.',
    ru:'Ада Лавлейс была математиком и писательницей, связанной с ранней историей вычислительной техники. Её примечания к аналитической машине Чарльза Бэббиджа содержали алгоритм, поэтому её часто называют одной из пионеров программирования.',
    uk:'Ада Лавлейс була математикинею й письменницею, пов’язаною з ранньою історією обчислювальної техніки. Її примітки до аналітичної машини Чарльза Беббіджа містили алгоритм, тому її часто називають однією з піонерок програмування.',
    es:'Ada Lovelace fue matemática y escritora vinculada con la historia temprana de la computación. Sus notas sobre la máquina analítica de Charles Babbage incluían un algoritmo, por lo que suele considerarse una pionera de la programación.',
    tr:'Ada Lovelace, bilişimin erken tarihiyle bağlantılı bir matematikçi ve yazardı. Charles Babbage’ın Analitik Makinesi üzerine notları bir algoritma içerdiği için erken programlama öncülerinden biri olarak anılır.',
    ar:'كانت آدا لوفلايس عالمة رياضيات وكاتبة مرتبطة بالبدايات المبكرة للحوسبة. تضمنت ملاحظاتها على آلة تشارلز باباج التحليلية خوارزمية، ولذلك تُذكر كثيراً بوصفها من رواد البرمجة الأوائل.',
    zh:'阿达·洛芙莱斯是与早期计算史相关的数学家和作家。她为查尔斯·巴贝奇分析机撰写的笔记中包含一个算法，因此常被视为早期编程先驱。',
    he:'עדה לאבלייס הייתה מתמטיקאית וסופרת הקשורה להיסטוריה המוקדמת של המחשוב. הערותיה על המנוע האנליטי של צ׳ארלס בבג׳ כללו אלגוריתם, ולכן היא מתוארת לעיתים כחלוצה מוקדמת של התכנות.',
  }),
  'galileo-galilei':Object.freeze({
    en:'Galileo Galilei was an astronomer and physicist of the Scientific Revolution. His telescopic observations supported heliocentric astronomy, and his work also covered physics and scientific instrumentation.',
    ru:'Галилео Галилей был астрономом и физиком эпохи научной революции. Его телескопические наблюдения поддержали гелиоцентрическую астрономию; он также занимался физикой и научными приборами.',
    uk:'Галілео Галілей був астрономом і фізиком доби наукової революції. Його телескопічні спостереження підтримали геліоцентричну астрономію; він також займався фізикою та науковими приладами.',
    es:'Galileo Galilei fue astrónomo y físico de la Revolución Científica. Sus observaciones telescópicas respaldaron la astronomía heliocéntrica, y también trabajó en física e instrumentación científica.',
    tr:'Galileo Galilei, Bilimsel Devrim döneminin astronomu ve fizikçisiydi. Teleskop gözlemleri Güneş merkezli astronomiyi destekledi; fizik ve bilimsel aletler üzerine de çalıştı.',
    ar:'كان غاليليو غاليلي فلكياً وفيزيائياً من عصر الثورة العلمية. دعمت رصده بالتلسكوب علم الفلك القائم على مركزية الشمس، كما عمل في الفيزياء والأجهزة العلمية.',
    zh:'伽利略·伽利莱是科学革命时期的天文学家和物理学家。他的望远镜观测支持了日心说天文学，并研究物理学和科学仪器。',
    he:'גלילאו גליליי היה אסטרונום ופיזיקאי מתקופת המהפכה המדעית. תצפיותיו בטלסקופ תמכו באסטרונומיה ההליוצנטרית, והוא עסק גם בפיזיקה ובמכשור מדעי.',
  }),
  plato:Object.freeze({
    en:'Plato was a philosopher of Classical Greece who founded the Academy in Athens. The Republic is among his best-known works.',
    ru:'Платон был философом Древней Греции и основал Академию в Афинах. «Государство» относится к числу его самых известных произведений.',
    uk:'Платон був філософом Давньої Греції та заснував Академію в Афінах. «Держава» належить до його найвідоміших творів.',
    es:'Platón fue un filósofo de la Grecia clásica que fundó la Academia de Atenas. La República está entre sus obras más conocidas.',
    tr:'Platon, Atina’daki Akademi’yi kuran Klasik Yunan filozofuydu. Devlet en tanınmış eserlerinden biridir.',
    ar:'كان أفلاطون فيلسوفاً من اليونان الكلاسيكية أسس الأكاديمية في أثينا. وتعد «الجمهورية» من أشهر أعماله.',
    zh:'柏拉图是古典希腊哲学家，在雅典创办了学院。《理想国》是他最著名的作品之一。',
    he:'אפלטון היה פילוסוף ביוון הקלאסית שייסד את האקדמיה באתונה. ״המדינה״ היא מן היצירות הידועות ביותר שלו.',
  }),
  'charles-darwin':Object.freeze({
    en:'Charles Darwin was a naturalist who developed the theory of evolution by natural selection. On the Origin of Species is his best-known work, and his research became foundational to evolutionary biology.',
    ru:'Чарльз Дарвин был естествоиспытателем, разработавшим теорию эволюции путём естественного отбора. Его самая известная работа — «О происхождении видов»; исследования Дарвина стали основополагающими для эволюционной биологии.',
    uk:'Чарльз Дарвін був природознавцем, який розробив теорію еволюції шляхом природного добору. Його найвідоміша праця — «Походження видів»; дослідження Дарвіна стали основоположними для еволюційної біології.',
    es:'Charles Darwin fue un naturalista que desarrolló la teoría de la evolución por selección natural. El origen de las especies es su obra más conocida, y sus investigaciones fueron fundamentales para la biología evolutiva.',
    tr:'Charles Darwin, doğal seçilim yoluyla evrim kuramını geliştiren bir doğa bilimciydi. Türlerin Kökeni en bilinen eseridir; çalışmaları evrimsel biyolojinin temellerinden biri oldu.',
    ar:'كان تشارلز داروين عالم طبيعة طوّر نظرية التطور بالانتقاء الطبيعي. يعد «أصل الأنواع» أشهر أعماله، وأصبحت أبحاثه أساساً لعلم الأحياء التطوري.',
    zh:'查尔斯·达尔文是提出自然选择进化理论的博物学家。《物种起源》是他最著名的著作，其研究成为进化生物学的重要基础。',
    he:'צ׳ארלס דרווין היה חוקר טבע שפיתח את תורת האבולוציה באמצעות ברירה טבעית. ״מוצא המינים״ הוא חיבורו הידוע ביותר, ומחקרו היה ליסוד מרכזי בביולוגיה האבולוציונית.',
  }),
  'isaac-newton':Object.freeze({
    en:'Isaac Newton was a mathematician and physicist who formulated the laws of motion and universal gravitation. His Principia is a major work, and his research also covered calculus, optics and classical mechanics.',
    ru:'Исаак Ньютон был математиком и физиком, сформулировавшим законы движения и всемирного тяготения. «Математические начала натуральной философии» — его ключевой труд; он также работал над исчислением, оптикой и классической механикой.',
    uk:'Ісаак Ньютон був математиком і фізиком, який сформулював закони руху та всесвітнього тяжіння. «Математичні начала натуральної філософії» — його ключова праця; він також працював над численням, оптикою та класичною механікою.',
    es:'Isaac Newton fue matemático y físico; formuló las leyes del movimiento y la gravitación universal. Sus Principia son una obra principal, y sus investigaciones también abarcaron cálculo, óptica y mecánica clásica.',
    tr:'Isaac Newton, hareket yasalarını ve evrensel kütle çekimini formüle eden bir matematikçi ve fizikçiydi. Principia başlıca eseridir; kalkülüs, optik ve klasik mekanik üzerine de çalıştı.',
    ar:'كان إسحاق نيوتن عالم رياضيات وفيزياء صاغ قوانين الحركة والجاذبية العامة. يُعد كتاب «المبادئ الرياضية للفلسفة الطبيعية» من أهم أعماله، كما تناولت أبحاثه حساب التفاضل والتكامل والبصريات والميكانيكا الكلاسيكية.',
    zh:'艾萨克·牛顿是数学家和物理学家，提出了运动定律和万有引力定律。《自然哲学的数学原理》是其重要著作，他还研究微积分、光学和经典力学。',
    he:'אייזק ניוטון היה מתמטיקאי ופיזיקאי שניסח את חוקי התנועה ואת חוק הכבידה האוניברסלית. ה״פרינקיפיה״ הוא חיבור מרכזי שלו, ומחקרו עסק גם בחשבון אינפיניטסימלי, באופטיקה ובמכניקה קלאסית.',
  }),
})

export function realizeQl7SupportPublicFigureKnowledge({selected=null,projection=null,locale='en'}={}){
  const personId=ql7Str(selected?.personId||projection?.personId)
  const text=ql7Str(S[personId]?.[locale])
  const facts=ql7Arr(projection?.facts)
  if(!personId||!text||projection?.ok!==true||facts.length===0)return Object.freeze({supported:false,text:'',fragments:Object.freeze([])})
  const sourceReceiptId=ql7Str(facts[0]?.sourceReceiptId)
  const factIds=Object.freeze(facts.map((fact)=>ql7Str(fact?.factId)).filter(Boolean))
  const fragment=Object.freeze({
    factId:`public-figure:${personId}:localized-stable-summary`,
    sourceFactIds:factIds,
    sourceReceiptId,
    text,
  })
  return Object.freeze({
    supported:true,
    personId,
    locale,
    text,
    fragments:Object.freeze([fragment]),
    realizationHash:ql7StableHash(JSON.stringify({personId,locale,text,factIds,sourceReceiptId})),
  })
}

export function getQl7SupportPublicFigureKnowledgeRealizerCoverage(){
  const locales=['en','ru','uk','es','tr','ar','zh','he'],failures=[]
  for(const [personId,rows] of Object.entries(S))for(const locale of locales){
    const minimum=locale==='zh'?28:['ar','he'].includes(locale)?45:60
    if([...ql7Str(rows?.[locale])].length<minimum)failures.push(`${personId}:${locale}`)
  }
  return Object.freeze({
    version:QL7_SUPPORT_PUBLIC_FIGURE_KNOWLEDGE_REALIZER_VERSION,
    profiles:Object.keys(S).length,
    locales:locales.length,
    localizedStableSummaries:Object.keys(S).length*locales.length,
    ok:failures.length===0,
    failures:Object.freeze(failures),
  })
}
