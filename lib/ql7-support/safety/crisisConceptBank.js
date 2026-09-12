import {ql7StableHash} from '../internal/text.js'

export const QL7_SUPPORT_CRISIS_CONCEPT_BANK_VERSION = '5.4.0'
export const QL7_SUPPORT_CRISIS_CONCEPT_BANK_OWNER_ID = 'ql7-support.crisis-concept-bank'
export const QL7_SUPPORT_CRISIS_REQUIRED_LOCALES = Object.freeze(['en','ru','uk','es','tr','ar','zh','he','de','fr','it','pt','pl','nl','sv','no','da','fi','cs','sk','hu','ro','bg','sr','hr','sl','el','ka','az','kk','ja','ko'])

const freezeRow = (row) => Object.freeze(Object.fromEntries(
  Object.entries(row).map(([key, value]) => [key, Array.isArray(value) ? Object.freeze([...value]) : value]),
))

export const QL7_SUPPORT_CRISIS_CONCEPT_BANK = Object.freeze({
  "en": freezeRow({
  "selfPronouns": [
    "i",
    "me",
    "myself"
  ],
  "ideation": [
    "i want to die",
    "i do not want to live",
    "i don’t want to live",
    "life is not worth living",
    "i wish i were dead"
  ],
  "action": [
    "kill myself",
    "hurt myself",
    "harm myself",
    "end my life",
    "take my life",
    "self harm",
    "hang myself",
    "i want to hang myself",
    "shoot myself",
    "jump to my death"
  ],
  "immediacy": [
    "right now",
    "tonight",
    "today",
    "now",
    "can’t stop myself"
  ],
  "help": [
    "help me",
    "i need help",
    "please stay with me",
    "i am scared i might hurt myself"
  ],
  "protective": [
    "i do not want to hurt myself",
    "i am safe",
    "i will not hurt myself",
    "i am asking for a friend"
  ],
  "reported": [
    "he wants to die",
    "she wants to die",
    "they want to die",
    "my friend wants to die"
  ],
  "news": [
    "suicide prevention",
    "news about suicide",
    "history of suicide",
    "suicide statistics"
  ]
}),
  "ru": freezeRow({
  "selfPronouns": [
    "я",
    "мне",
    "себя",
    "себе"
  ],
  "ideation": [
    "хочу умереть",
    "не хочу жить",
    "жить не хочу",
    "нет сил жить",
    "лучше бы меня не было",
    "не вижу смысла жить"
  ],
  "action": [
    "убью себя",
    "покончу с собой",
    "наврежу себе",
    "причиню себе вред",
    "сделаю с собой что-то",
    "хочу что-то сделать с собой",
    "хочу сделать что-то с собой",
    "выйду в окно",
    "наложу на себя руки",
    "хочу повеситься",
    "хочу повешаться",
    "повешусь",
    "вскроюсь",
    "хочу спрыгнуть"
  ],
  "immediacy": [
    "прямо сейчас",
    "сегодня ночью",
    "сегодня",
    "сейчас",
    "не могу себя остановить"
  ],
  "help": [
    "помоги мне",
    "мне нужна помощь",
    "побудь со мной",
    "боюсь что наврежу себе"
  ],
  "protective": [
    "не хочу причинять себе вред",
    "я в безопасности",
    "я не буду вредить себе",
    "это про друга"
  ],
  "reported": [
    "он хочет умереть",
    "она хочет умереть",
    "они хотят умереть",
    "мой друг хочет умереть"
  ],
  "news": [
    "профилактика суицида",
    "новости о суициде",
    "статистика суицидов",
    "история суицида"
  ]
}),
  "uk": freezeRow({
  "selfPronouns": [
    "я",
    "мені",
    "себе",
    "собі"
  ],
  "ideation": [
    "хочу померти",
    "не хочу жити",
    "не бачу сенсу жити",
    "краще б мене не було"
  ],
  "action": [
    "вб’ю себе",
    "вбю себе",
    "накладу на себе руки",
    "завдам собі шкоди",
    "нашкоджу собі",
    "зроблю щось із собою",
    "хочу повіситися",
    "повішуся",
    "хочу стрибнути"
  ],
  "immediacy": [
    "прямо зараз",
    "сьогодні вночі",
    "сьогодні",
    "зараз",
    "не можу себе зупинити"
  ],
  "help": [
    "допоможи мені",
    "мені потрібна допомога",
    "побудь зі мною",
    "боюся що нашкоджу собі"
  ],
  "protective": [
    "не хочу шкодити собі",
    "я в безпеці",
    "я не буду шкодити собі",
    "це про друга"
  ],
  "reported": [
    "він хоче померти",
    "вона хоче померти",
    "вони хочуть померти",
    "мій друг хоче померти"
  ],
  "news": [
    "профілактика суїциду",
    "новини про суїцид",
    "статистика суїцидів"
  ]
}),
  "es": freezeRow({
  "selfPronouns": [
    "yo",
    "me",
    "mí"
  ],
  "ideation": [
    "quiero morir",
    "no quiero vivir",
    "no vale la pena vivir",
    "ojalá estuviera muerto"
  ],
  "action": [
    "matarme",
    "hacerme daño",
    "lastimarme",
    "quitarme la vida",
    "suicidarme",
    "quiero ahorcarme",
    "colgarme",
    "quiero saltar"
  ],
  "immediacy": [
    "ahora mismo",
    "esta noche",
    "hoy",
    "ahora",
    "no puedo detenerme"
  ],
  "help": [
    "ayúdame",
    "necesito ayuda",
    "quédate conmigo",
    "tengo miedo de hacerme daño"
  ],
  "protective": [
    "no quiero hacerme daño",
    "estoy a salvo",
    "no me haré daño",
    "es sobre un amigo"
  ],
  "reported": [
    "él quiere morir",
    "ella quiere morir",
    "quiere suicidarse",
    "mi amigo quiere morir"
  ],
  "news": [
    "prevención del suicidio",
    "noticias sobre suicidio",
    "estadísticas de suicidio"
  ]
}),
  "tr": freezeRow({
  "selfPronouns": [
    "ben",
    "kendim",
    "kendime"
  ],
  "ideation": [
    "ölmek istiyorum",
    "yaşamak istemiyorum",
    "yaşamanın anlamı yok",
    "keşke ölsem"
  ],
  "action": [
    "kendimi öldürmek",
    "kendime zarar vermek",
    "intihar etmek",
    "hayatıma son vermek",
    "kendimi asmak",
    "kendimi asacağım",
    "atlamak istiyorum"
  ],
  "immediacy": [
    "hemen şimdi",
    "bu gece",
    "bugün",
    "şimdi",
    "kendimi durduramıyorum"
  ],
  "help": [
    "bana yardım et",
    "yardıma ihtiyacım var",
    "benimle kal",
    "kendime zarar vermekten korkuyorum"
  ],
  "protective": [
    "kendime zarar vermek istemiyorum",
    "güvendeyim",
    "kendime zarar vermeyeceğim",
    "arkadaşım hakkında"
  ],
  "reported": [
    "o ölmek istiyor",
    "arkadaşım ölmek istiyor",
    "intihar etmek istiyor"
  ],
  "news": [
    "intiharı önleme",
    "intihar haberleri",
    "intihar istatistikleri"
  ]
}),
  "ar": freezeRow({
  "selfPronouns": [
    "أنا",
    "انا",
    "نفسي"
  ],
  "ideation": [
    "أريد أن أموت",
    "لا أريد أن أعيش",
    "لا معنى للحياة",
    "أتمنى لو كنت ميتا"
  ],
  "action": [
    "سأقتل نفسي",
    "أؤذي نفسي",
    "إيذاء نفسي",
    "أنهي حياتي",
    "انتحر",
    "الانتحار",
    "أريد أن أشنق نفسي",
    "سأشنق نفسي",
    "أريد أن أقفز"
  ],
  "immediacy": [
    "الآن",
    "هذه الليلة",
    "اليوم",
    "فورا",
    "لا أستطيع إيقاف نفسي"
  ],
  "help": [
    "ساعدني",
    "أحتاج إلى مساعدة",
    "ابق معي",
    "أخاف أن أؤذي نفسي"
  ],
  "protective": [
    "لا أريد إيذاء نفسي",
    "أنا بأمان",
    "لن أؤذي نفسي",
    "عن صديقي"
  ],
  "reported": [
    "هو يريد أن يموت",
    "هي تريد أن تموت",
    "صديقي يريد أن يموت"
  ],
  "news": [
    "الوقاية من الانتحار",
    "أخبار الانتحار",
    "إحصاءات الانتحار"
  ]
}),
  "zh": freezeRow({
  "selfPronouns": [
    "我",
    "自己",
    "我自己"
  ],
  "ideation": [
    "我想死",
    "我不想活了",
    "活着没有意义",
    "不如死了"
  ],
  "action": [
    "我要自杀",
    "伤害自己",
    "杀死自己",
    "结束自己的生命",
    "自残"
  ],
  "immediacy": [
    "现在",
    "今晚",
    "今天",
    "马上",
    "我控制不住自己"
  ],
  "help": [
    "帮帮我",
    "我需要帮助",
    "陪着我",
    "我怕我会伤害自己"
  ],
  "protective": [
    "我不想伤害自己",
    "我现在安全",
    "我不会伤害自己",
    "是在说朋友"
  ],
  "reported": [
    "他想死",
    "她想死",
    "我朋友想死",
    "他想自杀"
  ],
  "news": [
    "自杀预防",
    "自杀新闻",
    "自杀统计"
  ]
}),
  "he": freezeRow({
  "selfPronouns": [
    "אני",
    "עצמי",
    "בעצמי"
  ],
  "ideation": [
    "אני רוצה למות",
    "אני לא רוצה לחיות",
    "אין טעם לחיות",
    "הלוואי שהייתי מת"
  ],
  "action": [
    "להרוג את עצמי",
    "לפגוע בעצמי",
    "להתאבד",
    "לסיים את החיים שלי"
  ],
  "immediacy": [
    "עכשיו",
    "הלילה",
    "היום",
    "מיד",
    "אני לא מצליח לעצור את עצמי"
  ],
  "help": [
    "תעזור לי",
    "אני צריך עזרה",
    "תישאר איתי",
    "אני מפחד לפגוע בעצמי"
  ],
  "protective": [
    "אני לא רוצה לפגוע בעצמי",
    "אני בטוח עכשיו",
    "אני לא אפגע בעצמי",
    "זה על חבר"
  ],
  "reported": [
    "הוא רוצה למות",
    "היא רוצה למות",
    "חבר שלי רוצה למות"
  ],
  "news": [
    "מניעת התאבדות",
    "חדשות על התאבדות",
    "סטטיסטיקות התאבדות"
  ]
}),
  "de": freezeRow({
  "selfPronouns": [
    "ich",
    "mich",
    "mir"
  ],
  "ideation": [
    "ich will sterben",
    "ich möchte sterben",
    "ich will nicht mehr leben"
  ],
  "action": [
    "mich umbringen",
    "mir etwas antun",
    "mich verletzen",
    "suizid begehen"
  ],
  "immediacy": [
    "jetzt",
    "heute nacht",
    "heute",
    "sofort"
  ],
  "help": [
    "hilf mir",
    "ich brauche hilfe",
    "bleib bei mir"
  ],
  "protective": [
    "ich will mir nichts antun",
    "ich bin sicher",
    "es geht um einen freund"
  ],
  "reported": [
    "er will sterben",
    "sie will sterben",
    "mein freund will sterben"
  ],
  "news": [
    "suizidprävention",
    "nachrichten über suizid"
  ]
}),
  "fr": freezeRow({
  "selfPronouns": [
    "je",
    "moi",
    "me"
  ],
  "ideation": [
    "je veux mourir",
    "je ne veux plus vivre"
  ],
  "action": [
    "me tuer",
    "me faire du mal",
    "mettre fin à mes jours",
    "me suicider"
  ],
  "immediacy": [
    "maintenant",
    "ce soir",
    "aujourd’hui",
    "tout de suite"
  ],
  "help": [
    "aide-moi",
    "j’ai besoin d’aide",
    "reste avec moi"
  ],
  "protective": [
    "je ne veux pas me faire de mal",
    "je suis en sécurité",
    "c’est pour un ami"
  ],
  "reported": [
    "il veut mourir",
    "elle veut mourir",
    "mon ami veut mourir"
  ],
  "news": [
    "prévention du suicide",
    "actualités sur le suicide"
  ]
}),
  "it": freezeRow({
  "selfPronouns": [
    "io",
    "me",
    "mi"
  ],
  "ideation": [
    "voglio morire",
    "non voglio più vivere"
  ],
  "action": [
    "uccidermi",
    "farmi del male",
    "togliermi la vita",
    "suicidarmi"
  ],
  "immediacy": [
    "adesso",
    "stanotte",
    "oggi",
    "subito"
  ],
  "help": [
    "aiutami",
    "ho bisogno di aiuto",
    "resta con me"
  ],
  "protective": [
    "non voglio farmi del male",
    "sono al sicuro",
    "riguarda un amico"
  ],
  "reported": [
    "vuole morire",
    "il mio amico vuole morire"
  ],
  "news": [
    "prevenzione del suicidio",
    "notizie sul suicidio"
  ]
}),
  "pt": freezeRow({
  "selfPronouns": [
    "eu",
    "me",
    "mim"
  ],
  "ideation": [
    "quero morrer",
    "não quero mais viver"
  ],
  "action": [
    "me matar",
    "me machucar",
    "tirar minha vida",
    "me suicidar"
  ],
  "immediacy": [
    "agora",
    "esta noite",
    "hoje",
    "imediatamente"
  ],
  "help": [
    "me ajude",
    "preciso de ajuda",
    "fique comigo"
  ],
  "protective": [
    "não quero me machucar",
    "estou seguro",
    "é sobre um amigo"
  ],
  "reported": [
    "ele quer morrer",
    "ela quer morrer",
    "meu amigo quer morrer"
  ],
  "news": [
    "prevenção do suicídio",
    "notícias sobre suicídio"
  ]
}),
  "pl": freezeRow({
  "selfPronouns": [
    "ja",
    "mnie",
    "sobie"
  ],
  "ideation": [
    "chcę umrzeć",
    "nie chcę żyć"
  ],
  "action": [
    "zabić się",
    "zrobić sobie krzywdę",
    "odebrać sobie życie",
    "popełnić samobójstwo"
  ],
  "immediacy": [
    "teraz",
    "dzisiaj w nocy",
    "dzisiaj",
    "natychmiast"
  ],
  "help": [
    "pomóż mi",
    "potrzebuję pomocy",
    "zostań ze mną"
  ],
  "protective": [
    "nie chcę zrobić sobie krzywdy",
    "jestem bezpieczny",
    "to o przyjacielu"
  ],
  "reported": [
    "on chce umrzeć",
    "ona chce umrzeć",
    "mój przyjaciel chce umrzeć"
  ],
  "news": [
    "zapobieganie samobójstwom",
    "wiadomości o samobójstwie"
  ]
}),
  "nl": freezeRow({
  "selfPronouns": [
    "ik",
    "me",
    "mijzelf"
  ],
  "ideation": [
    "ik wil dood",
    "ik wil niet meer leven"
  ],
  "action": [
    "mezelf doden",
    "mezelf pijn doen",
    "een einde aan mijn leven maken",
    "zelfmoord plegen"
  ],
  "immediacy": [
    "nu",
    "vannacht",
    "vandaag",
    "meteen"
  ],
  "help": [
    "help me",
    "ik heb hulp nodig",
    "blijf bij me"
  ],
  "protective": [
    "ik wil mezelf geen pijn doen",
    "ik ben veilig",
    "het gaat over een vriend"
  ],
  "reported": [
    "hij wil dood",
    "zij wil dood",
    "mijn vriend wil dood"
  ],
  "news": [
    "zelfmoordpreventie",
    "nieuws over zelfmoord"
  ]
}),
  "sv": freezeRow({
  "selfPronouns": [
    "jag",
    "mig",
    "mig själv"
  ],
  "ideation": [
    "jag vill dö",
    "jag vill inte leva"
  ],
  "action": [
    "ta livet av mig",
    "skada mig själv",
    "begå självmord"
  ],
  "immediacy": [
    "nu",
    "i natt",
    "idag",
    "genast"
  ],
  "help": [
    "hjälp mig",
    "jag behöver hjälp",
    "stanna hos mig"
  ],
  "protective": [
    "jag vill inte skada mig själv",
    "jag är säker",
    "det gäller en vän"
  ],
  "reported": [
    "han vill dö",
    "hon vill dö",
    "min vän vill dö"
  ],
  "news": [
    "suicidprevention",
    "nyheter om självmord"
  ]
}),
  "no": freezeRow({
  "selfPronouns": [
    "jeg",
    "meg",
    "meg selv"
  ],
  "ideation": [
    "jeg vil dø",
    "jeg vil ikke leve"
  ],
  "action": [
    "ta livet mitt",
    "skade meg selv",
    "begå selvmord"
  ],
  "immediacy": [
    "nå",
    "i natt",
    "i dag",
    "med en gang"
  ],
  "help": [
    "hjelp meg",
    "jeg trenger hjelp",
    "bli hos meg"
  ],
  "protective": [
    "jeg vil ikke skade meg selv",
    "jeg er trygg",
    "det gjelder en venn"
  ],
  "reported": [
    "han vil dø",
    "hun vil dø",
    "vennen min vil dø"
  ],
  "news": [
    "selvmordsforebygging",
    "nyheter om selvmord"
  ]
}),
  "da": freezeRow({
  "selfPronouns": [
    "jeg",
    "mig",
    "mig selv"
  ],
  "ideation": [
    "jeg vil dø",
    "jeg vil ikke leve"
  ],
  "action": [
    "tage mit eget liv",
    "skade mig selv",
    "begå selvmord"
  ],
  "immediacy": [
    "nu",
    "i nat",
    "i dag",
    "med det samme"
  ],
  "help": [
    "hjælp mig",
    "jeg har brug for hjælp",
    "bliv hos mig"
  ],
  "protective": [
    "jeg vil ikke skade mig selv",
    "jeg er i sikkerhed",
    "det handler om en ven"
  ],
  "reported": [
    "han vil dø",
    "hun vil dø",
    "min ven vil dø"
  ],
  "news": [
    "selvmordsforebyggelse",
    "nyheder om selvmord"
  ]
}),
  "fi": freezeRow({
  "selfPronouns": [
    "minä",
    "minua",
    "itseäni"
  ],
  "ideation": [
    "haluan kuolla",
    "en halua elää"
  ],
  "action": [
    "tappaa itseni",
    "satuttaa itseäni",
    "tehdä itsemurhan"
  ],
  "immediacy": [
    "nyt",
    "tänä yönä",
    "tänään",
    "heti"
  ],
  "help": [
    "auta minua",
    "tarvitsen apua",
    "pysy kanssani"
  ],
  "protective": [
    "en halua satuttaa itseäni",
    "olen turvassa",
    "kyse on ystävästä"
  ],
  "reported": [
    "hän haluaa kuolla",
    "ystäväni haluaa kuolla"
  ],
  "news": [
    "itsemurhien ehkäisy",
    "uutiset itsemurhasta"
  ]
}),
  "cs": freezeRow({
  "selfPronouns": [
    "já",
    "mě",
    "sobě"
  ],
  "ideation": [
    "chci zemřít",
    "nechci žít"
  ],
  "action": [
    "zabít se",
    "ublížit si",
    "vzít si život",
    "spáchat sebevraždu"
  ],
  "immediacy": [
    "teď",
    "dnes v noci",
    "dnes",
    "okamžitě"
  ],
  "help": [
    "pomoz mi",
    "potřebuji pomoc",
    "zůstaň se mnou"
  ],
  "protective": [
    "nechci si ublížit",
    "jsem v bezpečí",
    "jde o kamaráda"
  ],
  "reported": [
    "chce zemřít",
    "můj kamarád chce zemřít"
  ],
  "news": [
    "prevence sebevražd",
    "zprávy o sebevraždě"
  ]
}),
  "sk": freezeRow({
  "selfPronouns": [
    "ja",
    "mňa",
    "sebe"
  ],
  "ideation": [
    "chcem zomrieť",
    "nechcem žiť"
  ],
  "action": [
    "zabiť sa",
    "ublížiť si",
    "vziať si život",
    "spáchať samovraždu"
  ],
  "immediacy": [
    "teraz",
    "dnes v noci",
    "dnes",
    "okamžite"
  ],
  "help": [
    "pomôž mi",
    "potrebujem pomoc",
    "zostaň so mnou"
  ],
  "protective": [
    "nechcem si ublížiť",
    "som v bezpečí",
    "ide o kamaráta"
  ],
  "reported": [
    "chce zomrieť",
    "môj kamarát chce zomrieť"
  ],
  "news": [
    "prevencia samovrážd",
    "správy o samovražde"
  ]
}),
  "hu": freezeRow({
  "selfPronouns": [
    "én",
    "engem",
    "magam"
  ],
  "ideation": [
    "meg akarok halni",
    "nem akarok élni"
  ],
  "action": [
    "megölni magam",
    "ártani magamnak",
    "öngyilkos lenni"
  ],
  "immediacy": [
    "most",
    "ma éjjel",
    "ma",
    "azonnal"
  ],
  "help": [
    "segíts nekem",
    "segítségre van szükségem",
    "maradj velem"
  ],
  "protective": [
    "nem akarok ártani magamnak",
    "biztonságban vagyok",
    "egy barátomról van szó"
  ],
  "reported": [
    "meg akar halni",
    "a barátom meg akar halni"
  ],
  "news": [
    "öngyilkosság megelőzése",
    "öngyilkosságról szóló hírek"
  ]
}),
  "ro": freezeRow({
  "selfPronouns": [
    "eu",
    "mă",
    "mine"
  ],
  "ideation": [
    "vreau să mor",
    "nu mai vreau să trăiesc"
  ],
  "action": [
    "să mă omor",
    "să-mi fac rău",
    "să-mi iau viața",
    "să mă sinucid"
  ],
  "immediacy": [
    "acum",
    "în seara asta",
    "azi",
    "imediat"
  ],
  "help": [
    "ajută-mă",
    "am nevoie de ajutor",
    "stai cu mine"
  ],
  "protective": [
    "nu vreau să-mi fac rău",
    "sunt în siguranță",
    "este despre un prieten"
  ],
  "reported": [
    "vrea să moară",
    "prietenul meu vrea să moară"
  ],
  "news": [
    "prevenirea sinuciderii",
    "știri despre sinucidere"
  ]
}),
  "bg": freezeRow({
  "selfPronouns": [
    "аз",
    "мен",
    "себе си"
  ],
  "ideation": [
    "искам да умра",
    "не искам да живея"
  ],
  "action": [
    "да се убия",
    "да се нараня",
    "да сложа край на живота си",
    "самоубийство"
  ],
  "immediacy": [
    "сега",
    "тази нощ",
    "днес",
    "веднага"
  ],
  "help": [
    "помогни ми",
    "имам нужда от помощ",
    "остани с мен"
  ],
  "protective": [
    "не искам да се нараня",
    "в безопасност съм",
    "става дума за приятел"
  ],
  "reported": [
    "той иска да умре",
    "тя иска да умре",
    "приятелят ми иска да умре"
  ],
  "news": [
    "превенция на самоубийствата",
    "новини за самоубийство"
  ]
}),
  "sr": freezeRow({
  "selfPronouns": [
    "ja",
    "mene",
    "sebe"
  ],
  "ideation": [
    "želim da umrem",
    "ne želim da živim"
  ],
  "action": [
    "da se ubijem",
    "da povredim sebe",
    "da oduzmem sebi život",
    "samoubistvo"
  ],
  "immediacy": [
    "sada",
    "večeras",
    "danas",
    "odmah"
  ],
  "help": [
    "pomozi mi",
    "treba mi pomoć",
    "ostani sa mnom"
  ],
  "protective": [
    "ne želim da se povredim",
    "bezbedan sam",
    "radi se o prijatelju"
  ],
  "reported": [
    "on želi da umre",
    "ona želi da umre",
    "moj prijatelj želi da umre"
  ],
  "news": [
    "prevencija samoubistva",
    "vesti o samoubistvu"
  ]
}),
  "hr": freezeRow({
  "selfPronouns": [
    "ja",
    "mene",
    "sebe"
  ],
  "ideation": [
    "želim umrijeti",
    "ne želim živjeti"
  ],
  "action": [
    "ubiti se",
    "ozlijediti se",
    "oduzeti si život",
    "samoubojstvo"
  ],
  "immediacy": [
    "sada",
    "večeras",
    "danas",
    "odmah"
  ],
  "help": [
    "pomozi mi",
    "trebam pomoć",
    "ostani sa mnom"
  ],
  "protective": [
    "ne želim se ozlijediti",
    "siguran sam",
    "radi se o prijatelju"
  ],
  "reported": [
    "on želi umrijeti",
    "ona želi umrijeti",
    "moj prijatelj želi umrijeti"
  ],
  "news": [
    "prevencija samoubojstva",
    "vijesti o samoubojstvu"
  ]
}),
  "sl": freezeRow({
  "selfPronouns": [
    "jaz",
    "mene",
    "sebe"
  ],
  "ideation": [
    "želim umreti",
    "nočem živeti"
  ],
  "action": [
    "ubiti se",
    "poškodovati se",
    "vzeti si življenje",
    "samomor"
  ],
  "immediacy": [
    "zdaj",
    "nocoj",
    "danes",
    "takoj"
  ],
  "help": [
    "pomagaj mi",
    "potrebujem pomoč",
    "ostani z menoj"
  ],
  "protective": [
    "nočem se poškodovati",
    "sem varen",
    "gre za prijatelja"
  ],
  "reported": [
    "želi umreti",
    "moj prijatelj želi umreti"
  ],
  "news": [
    "preprečevanje samomora",
    "novice o samomoru"
  ]
}),
  "el": freezeRow({
  "selfPronouns": [
    "εγώ",
    "με",
    "εαυτό μου"
  ],
  "ideation": [
    "θέλω να πεθάνω",
    "δεν θέλω να ζήσω"
  ],
  "action": [
    "να σκοτώσω τον εαυτό μου",
    "να κάνω κακό στον εαυτό μου",
    "να αυτοκτονήσω"
  ],
  "immediacy": [
    "τώρα",
    "απόψε",
    "σήμερα",
    "αμέσως"
  ],
  "help": [
    "βοήθησέ με",
    "χρειάζομαι βοήθεια",
    "μείνε μαζί μου"
  ],
  "protective": [
    "δεν θέλω να κάνω κακό στον εαυτό μου",
    "είμαι ασφαλής",
    "είναι για έναν φίλο"
  ],
  "reported": [
    "θέλει να πεθάνει",
    "ο φίλος μου θέλει να πεθάνει"
  ],
  "news": [
    "πρόληψη αυτοκτονίας",
    "ειδήσεις για αυτοκτονία"
  ]
}),
  "ka": freezeRow({
  "selfPronouns": [
    "მე",
    "ჩემი თავი"
  ],
  "ideation": [
    "მინდა მოვკვდე",
    "არ მინდა ცხოვრება"
  ],
  "action": [
    "თავს მოვიკლავ",
    "თავს ზიანს მივაყენებ",
    "თვითმკვლელობა"
  ],
  "immediacy": [
    "ახლავე",
    "ამაღამ",
    "დღეს",
    "დაუყოვნებლივ"
  ],
  "help": [
    "დამეხმარე",
    "დახმარება მჭირდება",
    "ჩემთან დარჩი"
  ],
  "protective": [
    "არ მინდა თავს ზიანი მივაყენო",
    "უსაფრთხოდ ვარ",
    "მეგობარზეა საუბარი"
  ],
  "reported": [
    "მას სიკვდილი უნდა",
    "ჩემ მეგობარს სიკვდილი უნდა"
  ],
  "news": [
    "თვითმკვლელობის პრევენცია",
    "თვითმკვლელობის ამბები"
  ]
}),
  "az": freezeRow({
  "selfPronouns": [
    "mən",
    "özüm",
    "özümə"
  ],
  "ideation": [
    "ölmək istəyirəm",
    "yaşamaq istəmirəm"
  ],
  "action": [
    "özümü öldürmək",
    "özümə zərər vermək",
    "intihar etmək"
  ],
  "immediacy": [
    "indi",
    "bu gecə",
    "bu gün",
    "dərhal"
  ],
  "help": [
    "mənə kömək et",
    "köməyə ehtiyacım var",
    "yanımda qal"
  ],
  "protective": [
    "özümə zərər vermək istəmirəm",
    "təhlükəsizəm",
    "dostum haqqındadır"
  ],
  "reported": [
    "o ölmək istəyir",
    "dostum ölmək istəyir"
  ],
  "news": [
    "intiharın qarşısının alınması",
    "intihar xəbərləri"
  ]
}),
  "kk": freezeRow({
  "selfPronouns": [
    "мен",
    "өзім",
    "өзіме"
  ],
  "ideation": [
    "өлгім келеді",
    "өмір сүргім келмейді"
  ],
  "action": [
    "өзімді өлтіру",
    "өзіме зиян келтіру",
    "өз-өзіне қол жұмсау"
  ],
  "immediacy": [
    "қазір",
    "бүгін түнде",
    "бүгін",
    "дереу"
  ],
  "help": [
    "маған көмектес",
    "маған көмек керек",
    "менімен бірге бол"
  ],
  "protective": [
    "өзіме зиян келтіргім келмейді",
    "мен қауіпсіз жердемін",
    "досым туралы"
  ],
  "reported": [
    "ол өлгісі келеді",
    "досым өлгісі келеді"
  ],
  "news": [
    "суицидтің алдын алу",
    "суицид туралы жаңалықтар"
  ]
}),
  "ja": freezeRow({
  "selfPronouns": [
    "私",
    "自分",
    "僕",
    "俺"
  ],
  "ideation": [
    "死にたい",
    "生きたくない",
    "生きる意味がない"
  ],
  "action": [
    "自殺したい",
    "自分を傷つける",
    "自分を殺す",
    "命を絶つ"
  ],
  "immediacy": [
    "今すぐ",
    "今夜",
    "今日",
    "今"
  ],
  "help": [
    "助けて",
    "助けが必要",
    "そばにいて",
    "自分を傷つけそうで怖い"
  ],
  "protective": [
    "自分を傷つけたくない",
    "今は安全",
    "友達の話です"
  ],
  "reported": [
    "彼は死にたい",
    "彼女は死にたい",
    "友達が死にたいと言っている"
  ],
  "news": [
    "自殺予防",
    "自殺に関するニュース"
  ]
}),
  "ko": freezeRow({
  "selfPronouns": [
    "나",
    "저",
    "자신",
    "내가"
  ],
  "ideation": [
    "죽고 싶다",
    "살고 싶지 않다",
    "사는 의미가 없다"
  ],
  "action": [
    "자살하고 싶다",
    "나를 해치고 싶다",
    "자해하고 싶다",
    "내 목숨을 끊다"
  ],
  "immediacy": [
    "지금 당장",
    "오늘 밤",
    "오늘",
    "지금"
  ],
  "help": [
    "도와줘",
    "도움이 필요해",
    "내 곁에 있어줘",
    "내가 나를 해칠까 봐 무서워"
  ],
  "protective": [
    "나를 해치고 싶지 않다",
    "지금 안전하다",
    "친구 이야기다"
  ],
  "reported": [
    "그는 죽고 싶어 한다",
    "그녀는 죽고 싶어 한다",
    "내 친구가 죽고 싶어 한다"
  ],
  "news": [
    "자살 예방",
    "자살 관련 뉴스"
  ]
}),
})

const GLOBAL_CRISIS_RECORD_CACHE = new Map()
export function listQl7SupportGlobalCrisisConceptRecords(family='') {
  const key=String(family||'').trim()
  if(GLOBAL_CRISIS_RECORD_CACHE.has(key))return GLOBAL_CRISIS_RECORD_CACHE.get(key)
  const rows=[]
  for(const locale of QL7_SUPPORT_CRISIS_REQUIRED_LOCALES){
    const bank=QL7_SUPPORT_CRISIS_CONCEPT_BANK[locale]||{}
    for(const phrase of Array.isArray(bank[key])?bank[key]:[])rows.push(Object.freeze({text:phrase,sourceLocale:locale,conceptId:`crisis:${key}`}))
  }
  const frozen=Object.freeze(rows);GLOBAL_CRISIS_RECORD_CACHE.set(key,frozen);return frozen
}

export function getQl7SupportCrisisConcepts(locale = 'en') {
  const lang = String(locale || 'en').toLowerCase().split(/[-_]/u)[0]
  return QL7_SUPPORT_CRISIS_CONCEPT_BANK[lang] || QL7_SUPPORT_CRISIS_CONCEPT_BANK.en
}

export function auditQl7SupportCrisisConceptBank() {
  const failures = []
  const locales = Object.keys(QL7_SUPPORT_CRISIS_CONCEPT_BANK)
  for (const locale of QL7_SUPPORT_CRISIS_REQUIRED_LOCALES) {
    const row = QL7_SUPPORT_CRISIS_CONCEPT_BANK[locale]
    if (!row) { failures.push(`missing_locale:${locale}`); continue }
    for (const key of ['selfPronouns','ideation','action','immediacy','help','protective','reported','news']) {
      if (!Array.isArray(row[key]) || row[key].length === 0) failures.push(`missing_family:${locale}:${key}`)
    }
  }
  const body = {
    schema: 'ql7.support.crisis-concept-bank-audit',
    schemaVersion: QL7_SUPPORT_CRISIS_CONCEPT_BANK_VERSION,
    localeCount: locales.length,
    requiredLocaleCount: QL7_SUPPORT_CRISIS_REQUIRED_LOCALES.length,
    phraseCount: Object.values(QL7_SUPPORT_CRISIS_CONCEPT_BANK).reduce((sum,row) => sum + Object.values(row).filter(Array.isArray).reduce((s,v)=>s+v.length,0), 0),
    nativeDialectCompletenessClaimed: false,
    nativeReviewRequired: true,
    failures: Object.freeze(failures),
  }
  return Object.freeze({ ...body, ok: failures.length === 0, bankHash: ql7StableHash(JSON.stringify(body)) })
}
