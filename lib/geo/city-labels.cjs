// lib/geo/city-labels.cjs
// QL7_GEO111_I18N_LABELS_V1C
// City labels use a localized registry plus a safe trusted-header fallback. Encoding-sensitive transliteration uses code points, not raw identifier keys.

const CITY_LABELS_BY_KEY = Object.freeze({
  "city_abidjan": {
    "ar": "أبيدجان",
    "en": "Abidjan",
    "es": "Abiyán",
    "ru": "Абиджан",
    "tr": "Abidjan",
    "uk": "Абіджан",
    "zh": "阿比让"
  },
  "city_accra": {
    "ar": "أكرا",
    "en": "Accra",
    "es": "Acra",
    "ru": "Аккра",
    "tr": "Akra",
    "uk": "Аккра",
    "zh": "阿克拉"
  },
  "city_acre": {
    "ar": "Acre",
    "en": "Acre",
    "es": "Acre",
    "ru": "Acre",
    "tr": "Acre",
    "uk": "Acre",
    "zh": "Acre"
  },
  "city_act": {
    "ar": "ACT",
    "en": "ACT",
    "es": "ACT",
    "ru": "ACT",
    "tr": "ACT",
    "uk": "ACT",
    "zh": "ACT"
  },
  "city_adak": {
    "ar": "أداك",
    "en": "Adak",
    "es": "Adak",
    "ru": "Адак",
    "tr": "Adak",
    "uk": "Адак",
    "zh": "埃达克"
  },
  "city_addis_ababa": {
    "ar": "أديس أبابا",
    "en": "Addis Ababa",
    "es": "Adís Abeba",
    "ru": "Аддис-Абеба",
    "tr": "Addis Ababa",
    "uk": "Аддис-Абеба",
    "zh": "亚的斯亚贝巴"
  },
  "city_adelaide": {
    "ar": "أديليد",
    "en": "Adelaide",
    "es": "Adelaida",
    "ru": "Аделаида",
    "tr": "Adelaide",
    "uk": "Аделаїда",
    "zh": "阿德莱德"
  },
  "city_aden": {
    "ar": "عدن",
    "en": "Aden",
    "es": "Adén",
    "ru": "Аден",
    "tr": "Aden",
    "uk": "Аден",
    "zh": "亚丁"
  },
  "city_alaska": {
    "ar": "Alaska",
    "en": "Alaska",
    "es": "Alaska",
    "ru": "Alaska",
    "tr": "Alaska",
    "uk": "Alaska",
    "zh": "Alaska"
  },
  "city_aleutian": {
    "ar": "Aleutian",
    "en": "Aleutian",
    "es": "Aleutian",
    "ru": "Aleutian",
    "tr": "Aleutian",
    "uk": "Aleutian",
    "zh": "Aleutian"
  },
  "city_algiers": {
    "ar": "الجزائر",
    "en": "Algiers",
    "es": "Argel",
    "ru": "Алжир",
    "tr": "Cezayir",
    "uk": "Алжир",
    "zh": "阿尔及尔"
  },
  "city_almaty": {
    "ar": "ألماتي",
    "en": "Almaty",
    "es": "Almaty",
    "ru": "Алматы",
    "tr": "Almatı",
    "uk": "Алмати",
    "zh": "阿拉木图"
  },
  "city_amman": {
    "ar": "عمّان",
    "en": "Amman",
    "es": "Ammán",
    "ru": "Амман",
    "tr": "Amman",
    "uk": "Амман",
    "zh": "安曼"
  },
  "city_amsterdam": {
    "ar": "أمستردام",
    "en": "Amsterdam",
    "es": "Ámsterdam",
    "ru": "Амстердам",
    "tr": "Amsterdam",
    "uk": "Амстердам",
    "zh": "阿姆斯特丹"
  },
  "city_anadyr": {
    "ar": "أندير",
    "en": "Anadyr",
    "es": "Anádyr",
    "ru": "Анадырь",
    "tr": "Anadır",
    "uk": "Анадир",
    "zh": "阿纳德尔"
  },
  "city_anchorage": {
    "ar": "أنشوراج",
    "en": "Anchorage",
    "es": "Anchorage",
    "ru": "Анкоридж",
    "tr": "Anchorage",
    "uk": "Анкоридж",
    "zh": "安克雷奇"
  },
  "city_andorra": {
    "ar": "أندورا",
    "en": "Andorra",
    "es": "Andorra",
    "ru": "Андорра",
    "tr": "Andorra",
    "uk": "Андорра",
    "zh": "安道尔"
  },
  "city_anguilla": {
    "ar": "أنغويلا",
    "en": "Anguilla",
    "es": "Anguila",
    "ru": "Ангилья",
    "tr": "Anguilla",
    "uk": "Анґілья",
    "zh": "安圭拉"
  },
  "city_antananarivo": {
    "ar": "أنتاناناريفو",
    "en": "Antananarivo",
    "es": "Antananarivo",
    "ru": "Антананариву",
    "tr": "Antananarivo",
    "uk": "Антананаріву",
    "zh": "安塔那那利佛"
  },
  "city_antigua": {
    "ar": "أنتيغوا",
    "en": "Antigua",
    "es": "Antigua",
    "ru": "Антигуа",
    "tr": "Antigua",
    "uk": "Антиґуа",
    "zh": "安提瓜"
  },
  "city_apia": {
    "ar": "أبيا",
    "en": "Apia",
    "es": "Apia",
    "ru": "Апиа",
    "tr": "Apia",
    "uk": "Апіа",
    "zh": "阿皮亚"
  },
  "city_aqtau": {
    "ar": "أكتاو",
    "en": "Aqtau",
    "es": "Aktau",
    "ru": "Актау",
    "tr": "Aktav",
    "uk": "Актау",
    "zh": "阿克套"
  },
  "city_aqtobe": {
    "ar": "أكتوب",
    "en": "Aqtobe",
    "es": "Aktobe",
    "ru": "Актобе",
    "tr": "Aktöbe",
    "uk": "Актобе",
    "zh": "阿克托别"
  },
  "city_araguaina": {
    "ar": "أروجوانيا",
    "en": "Araguaina",
    "es": "Araguaína",
    "ru": "Арагуаина",
    "tr": "Araguaina",
    "uk": "Араґуаіна",
    "zh": "阿拉瓜伊纳"
  },
  "city_arizona": {
    "ar": "Arizona",
    "en": "Arizona",
    "es": "Arizona",
    "ru": "Arizona",
    "tr": "Arizona",
    "uk": "Arizona",
    "zh": "Arizona"
  },
  "city_aruba": {
    "ar": "أروبا",
    "en": "Aruba",
    "es": "Aruba",
    "ru": "Аруба",
    "tr": "Aruba",
    "uk": "Аруба",
    "zh": "阿鲁巴"
  },
  "city_ashgabat": {
    "ar": "عشق آباد",
    "en": "Ashgabat",
    "es": "Asjabad",
    "ru": "Ашхабад",
    "tr": "Aşkabat",
    "uk": "Ашгабат",
    "zh": "阿什哈巴德"
  },
  "city_ashkhabad": {
    "ar": "Ashkhabad",
    "en": "Ashkhabad",
    "es": "Ashkhabad",
    "ru": "Ashkhabad",
    "tr": "Ashkhabad",
    "uk": "Ashkhabad",
    "zh": "Ashkhabad"
  },
  "city_asmara": {
    "ar": "Asmara",
    "en": "Asmara",
    "es": "Asmara",
    "ru": "Asmara",
    "tr": "Asmara",
    "uk": "Asmara",
    "zh": "Asmara"
  },
  "city_astrakhan": {
    "ar": "أستراخان",
    "en": "Astrakhan",
    "es": "Astracán",
    "ru": "Астрахань",
    "tr": "Astrahan",
    "uk": "Астрахань",
    "zh": "阿斯特拉罕"
  },
  "city_asuncion": {
    "ar": "أسونسيون",
    "en": "Asunción",
    "es": "Asunción",
    "ru": "Асунсьон",
    "tr": "Asunción",
    "uk": "Асунсьйон",
    "zh": "亚松森"
  },
  "city_athens": {
    "ar": "أثينا",
    "en": "Athens",
    "es": "Atenas",
    "ru": "Афины",
    "tr": "Atina",
    "uk": "Афіни",
    "zh": "雅典"
  },
  "city_atikokan": {
    "ar": "Atikokan",
    "en": "Atikokan",
    "es": "Atikokan",
    "ru": "Atikokan",
    "tr": "Atikokan",
    "uk": "Atikokan",
    "zh": "Atikokan"
  },
  "city_atka": {
    "ar": "Atka",
    "en": "Atka",
    "es": "Atka",
    "ru": "Atka",
    "tr": "Atka",
    "uk": "Atka",
    "zh": "Atka"
  },
  "city_atlantic": {
    "ar": "Atlantic",
    "en": "Atlantic",
    "es": "Atlantic",
    "ru": "Atlantic",
    "tr": "Atlantic",
    "uk": "Atlantic",
    "zh": "Atlantic"
  },
  "city_atyrau": {
    "ar": "أتيراو",
    "en": "Atyrau",
    "es": "Atyrau",
    "ru": "Атырау",
    "tr": "Atırav",
    "uk": "Атирау",
    "zh": "阿特劳"
  },
  "city_auckland": {
    "ar": "أوكلاند",
    "en": "Auckland",
    "es": "Auckland",
    "ru": "Окленд",
    "tr": "Auckland",
    "uk": "Окленд",
    "zh": "奥克兰"
  },
  "city_azores": {
    "ar": "أزورس",
    "en": "Azores",
    "es": "Azores",
    "ru": "Азорские о-ва",
    "tr": "Azor Adaları",
    "uk": "Азорські острови",
    "zh": "亚速尔群岛"
  },
  "city_baghdad": {
    "ar": "بغداد",
    "en": "Baghdad",
    "es": "Bagdad",
    "ru": "Багдад",
    "tr": "Bağdat",
    "uk": "Багдад",
    "zh": "巴格达"
  },
  "city_bahia": {
    "ar": "باهيا",
    "en": "Bahia",
    "es": "Bahía",
    "ru": "Баия",
    "tr": "Bahia",
    "uk": "Байя",
    "zh": "巴伊亚"
  },
  "city_bahia_de_banderas": {
    "ar": "باهيا بانديراس",
    "en": "Bahía de Banderas",
    "es": "Bahía de Banderas",
    "ru": "Баия-де-Бандерас",
    "tr": "Bahia Banderas",
    "uk": "Баїя Бандерас",
    "zh": "巴伊亚班德拉斯"
  },
  "city_bahrain": {
    "ar": "البحرين",
    "en": "Bahrain",
    "es": "Baréin",
    "ru": "Бахрейн",
    "tr": "Bahreyn",
    "uk": "Бахрейн",
    "zh": "巴林"
  },
  "city_bajanorte": {
    "ar": "BajaNorte",
    "en": "BajaNorte",
    "es": "BajaNorte",
    "ru": "BajaNorte",
    "tr": "BajaNorte",
    "uk": "BajaNorte",
    "zh": "BajaNorte"
  },
  "city_bajasur": {
    "ar": "BajaSur",
    "en": "BajaSur",
    "es": "BajaSur",
    "ru": "BajaSur",
    "tr": "BajaSur",
    "uk": "BajaSur",
    "zh": "BajaSur"
  },
  "city_baku": {
    "ar": "باكو",
    "en": "Baku",
    "es": "Bakú",
    "ru": "Баку",
    "tr": "Bakü",
    "uk": "Баку",
    "zh": "巴库"
  },
  "city_bamako": {
    "ar": "باماكو",
    "en": "Bamako",
    "es": "Bamako",
    "ru": "Бамако",
    "tr": "Bamako",
    "uk": "Бамако",
    "zh": "巴马科"
  },
  "city_bangkok": {
    "ar": "بانكوك",
    "en": "Bangkok",
    "es": "Bangkok",
    "ru": "Бангкок",
    "tr": "Bangkok",
    "uk": "Бангкок",
    "zh": "曼谷"
  },
  "city_bangui": {
    "ar": "بانغوي",
    "en": "Bangui",
    "es": "Bangui",
    "ru": "Банги",
    "tr": "Bangui",
    "uk": "Банґі",
    "zh": "班吉"
  },
  "city_banjul": {
    "ar": "بانجول",
    "en": "Banjul",
    "es": "Banjul",
    "ru": "Банжул",
    "tr": "Banjul",
    "uk": "Банжул",
    "zh": "班珠尔"
  },
  "city_barbados": {
    "ar": "بربادوس",
    "en": "Barbados",
    "es": "Barbados",
    "ru": "Барбадос",
    "tr": "Barbados",
    "uk": "Барбадос",
    "zh": "巴巴多斯"
  },
  "city_barnaul": {
    "ar": "بارناول",
    "en": "Barnaul",
    "es": "Barnaúl",
    "ru": "Барнаул",
    "tr": "Barnaul",
    "uk": "Барнаул",
    "zh": "巴尔瑙尔"
  },
  "city_beirut": {
    "ar": "بيروت",
    "en": "Beirut",
    "es": "Beirut",
    "ru": "Бейрут",
    "tr": "Beyrut",
    "uk": "Бейрут",
    "zh": "贝鲁特"
  },
  "city_belaya_tserkov": {
    "ar": "بيلا تسيركفا",
    "en": "Bila Tserkva",
    "es": "Bila Tserkva",
    "ru": "Белая Церковь",
    "tr": "Bila Tserkva",
    "uk": "Біла Церква",
    "zh": "白采尔克瓦"
  },
  "city_belem": {
    "ar": "بلم",
    "en": "Belem",
    "es": "Belén",
    "ru": "Белен",
    "tr": "Belem",
    "uk": "Белен",
    "zh": "贝伦"
  },
  "city_belfast": {
    "ar": "Belfast",
    "en": "Belfast",
    "es": "Belfast",
    "ru": "Belfast",
    "tr": "Belfast",
    "uk": "Belfast",
    "zh": "Belfast"
  },
  "city_belgrade": {
    "ar": "بلغراد",
    "en": "Belgrade",
    "es": "Belgrado",
    "ru": "Белград",
    "tr": "Belgrad",
    "uk": "Белград",
    "zh": "贝尔格莱德"
  },
  "city_belize": {
    "ar": "بليز",
    "en": "Belize",
    "es": "Belice",
    "ru": "Белиз",
    "tr": "Belize",
    "uk": "Беліз",
    "zh": "伯利兹"
  },
  "city_berlin": {
    "ar": "برلين",
    "en": "Berlin",
    "es": "Berlín",
    "ru": "Берлин",
    "tr": "Berlin",
    "uk": "Берлін",
    "zh": "柏林"
  },
  "city_bermuda": {
    "ar": "برمودا",
    "en": "Bermuda",
    "es": "Bermudas",
    "ru": "Бермудские о-ва",
    "tr": "Bermuda",
    "uk": "Бермуди",
    "zh": "百慕大"
  },
  "city_beulah_north_dakota": {
    "ar": "بيولا، داكوتا الشمالية",
    "en": "Beulah, North Dakota",
    "es": "Beulah, Dakota del Norte",
    "ru": "Бойла, Северная Дакота",
    "tr": "Beulah, Kuzey Dakota",
    "uk": "Бʼюла, Північна Дакота",
    "zh": "北达科他州比尤拉"
  },
  "city_bila_tserkva": {
    "ar": "بيلا تسيركفا",
    "en": "Bila Tserkva",
    "es": "Bila Tserkva",
    "ru": "Белая Церковь",
    "tr": "Bila Tserkva",
    "uk": "Біла Церква",
    "zh": "白采尔克瓦"
  },
  "city_bishkek": {
    "ar": "بشكيك",
    "en": "Bishkek",
    "es": "Bishkek",
    "ru": "Бишкек",
    "tr": "Bişkek",
    "uk": "Бішкек",
    "zh": "比什凯克"
  },
  "city_bissau": {
    "ar": "بيساو",
    "en": "Bissau",
    "es": "Bisáu",
    "ru": "Бисау",
    "tr": "Bissau",
    "uk": "Бісау",
    "zh": "比绍"
  },
  "city_blanc_sablon": {
    "ar": "بلانك-سابلون",
    "en": "Blanc-Sablon",
    "es": "Blanc-Sablon",
    "ru": "Бланк-Саблон",
    "tr": "Blanc-Sablon",
    "uk": "Блан-Саблон",
    "zh": "布兰克萨布隆"
  },
  "city_blantyre": {
    "ar": "بلانتاير",
    "en": "Blantyre",
    "es": "Blantyre",
    "ru": "Блантайр",
    "tr": "Blantyre",
    "uk": "Блантайр",
    "zh": "布兰太尔"
  },
  "city_boa_vista": {
    "ar": "باو فيستا",
    "en": "Boa Vista",
    "es": "Boa Vista",
    "ru": "Боа-Виста",
    "tr": "Boa Vista",
    "uk": "Боа-Віста",
    "zh": "博阿维斯塔"
  },
  "city_bogota": {
    "ar": "بوغوتا",
    "en": "Bogota",
    "es": "Bogotá",
    "ru": "Богота",
    "tr": "Bogota",
    "uk": "Боґота",
    "zh": "波哥大"
  },
  "city_boise": {
    "ar": "بويس",
    "en": "Boise",
    "es": "Boise",
    "ru": "Бойсе",
    "tr": "Boise",
    "uk": "Бойсе",
    "zh": "博伊西"
  },
  "city_boryspil": {
    "ar": "بوريسبيل",
    "en": "Boryspil",
    "es": "Boryspil",
    "ru": "Борисполь",
    "tr": "Boryspil",
    "uk": "Бориспіль",
    "zh": "鲍里斯皮尔"
  },
  "city_bougainville": {
    "ar": "بوغانفيل",
    "en": "Bougainville",
    "es": "Bougainville",
    "ru": "Бугенвиль",
    "tr": "Bougainville",
    "uk": "Буґенвіль",
    "zh": "布干维尔"
  },
  "city_bratislava": {
    "ar": "براتيسلافا",
    "en": "Bratislava",
    "es": "Bratislava",
    "ru": "Братислава",
    "tr": "Bratislava",
    "uk": "Братислава",
    "zh": "布拉迪斯拉发"
  },
  "city_brazzaville": {
    "ar": "برازافيل",
    "en": "Brazzaville",
    "es": "Brazzaville",
    "ru": "Браззавиль",
    "tr": "Brazzavil",
    "uk": "Браззавіль",
    "zh": "布拉柴维尔"
  },
  "city_brisbane": {
    "ar": "برسيبان",
    "en": "Brisbane",
    "es": "Brisbane",
    "ru": "Брисбен",
    "tr": "Brisbane",
    "uk": "Брісбен",
    "zh": "布里斯班"
  },
  "city_broken_hill": {
    "ar": "بروكن هيل",
    "en": "Broken Hill",
    "es": "Broken Hill",
    "ru": "Брокен-Хилл",
    "tr": "Broken Hill",
    "uk": "Брокен-Хілл",
    "zh": "布罗肯希尔"
  },
  "city_brovary": {
    "ar": "بروفاري",
    "en": "Brovary",
    "es": "Brovary",
    "ru": "Бровары",
    "tr": "Brovary",
    "uk": "Бровари",
    "zh": "布罗瓦雷"
  },
  "city_brunei": {
    "ar": "بروناي",
    "en": "Brunei",
    "es": "Brunéi",
    "ru": "Бруней",
    "tr": "Brunei",
    "uk": "Бруней",
    "zh": "文莱"
  },
  "city_brussels": {
    "ar": "بروكسل",
    "en": "Brussels",
    "es": "Bruselas",
    "ru": "Брюссель",
    "tr": "Brüksel",
    "uk": "Брюссель",
    "zh": "布鲁塞尔"
  },
  "city_bucha": {
    "ar": "بوتشا",
    "en": "Bucha",
    "es": "Bucha",
    "ru": "Буча",
    "tr": "Bucha",
    "uk": "Буча",
    "zh": "布恰"
  },
  "city_bucharest": {
    "ar": "بوخارست",
    "en": "Bucharest",
    "es": "Bucarest",
    "ru": "Бухарест",
    "tr": "Bükreş",
    "uk": "Бухарест",
    "zh": "布加勒斯特"
  },
  "city_budapest": {
    "ar": "بودابست",
    "en": "Budapest",
    "es": "Budapest",
    "ru": "Будапешт",
    "tr": "Budapeşte",
    "uk": "Будапешт",
    "zh": "布达佩斯"
  },
  "city_buenos_aires": {
    "ar": "Buenos Aires",
    "en": "Buenos Aires",
    "es": "Buenos Aires",
    "ru": "Buenos Aires",
    "tr": "Buenos Aires",
    "uk": "Buenos Aires",
    "zh": "Buenos Aires"
  },
  "city_bujumbura": {
    "ar": "بوجومبورا",
    "en": "Bujumbura",
    "es": "Bujumbura",
    "ru": "Бужумбура",
    "tr": "Bujumbura",
    "uk": "Бужумбура",
    "zh": "布琼布拉"
  },
  "city_busingen": {
    "ar": "بوسنغن",
    "en": "Busingen",
    "es": "Busingen",
    "ru": "Бюзинген-на-Верхнем-Рейне",
    "tr": "Büsingen",
    "uk": "Бюзінген",
    "zh": "布辛根"
  },
  "city_cairo": {
    "ar": "القاهرة",
    "en": "Cairo",
    "es": "El Cairo",
    "ru": "Каир",
    "tr": "Kahire",
    "uk": "Каїр",
    "zh": "开罗"
  },
  "city_cambridge_bay": {
    "ar": "كامبرديج باي",
    "en": "Cambridge Bay",
    "es": "Cambridge Bay",
    "ru": "Кеймбридж-Бей",
    "tr": "Cambridge Bay",
    "uk": "Кеймбрідж-Бей",
    "zh": "剑桥湾"
  },
  "city_campo_grande": {
    "ar": "كومبو جراند",
    "en": "Campo Grande",
    "es": "Campo Grande",
    "ru": "Кампу-Гранди",
    "tr": "Campo Grande",
    "uk": "Кампу-Ґранді",
    "zh": "大坎普"
  },
  "city_canary": {
    "ar": "كناري",
    "en": "Canary",
    "es": "Canarias",
    "ru": "Канарские о-ва",
    "tr": "Kanarya Adaları",
    "uk": "Канарські острови",
    "zh": "加那利"
  },
  "city_canberra": {
    "ar": "Canberra",
    "en": "Canberra",
    "es": "Canberra",
    "ru": "Canberra",
    "tr": "Canberra",
    "uk": "Canberra",
    "zh": "Canberra"
  },
  "city_cancun": {
    "ar": "كانكون",
    "en": "Cancún",
    "es": "Cancún",
    "ru": "Канкун",
    "tr": "Cancun",
    "uk": "Канкун",
    "zh": "坎昆"
  },
  "city_cape_verde": {
    "ar": "الرأس الأخضر",
    "en": "Cape Verde",
    "es": "Cabo Verde",
    "ru": "Кабо-Верде",
    "tr": "Cape Verde",
    "uk": "Кабо-Верде",
    "zh": "佛得角"
  },
  "city_caracas": {
    "ar": "كاراكاس",
    "en": "Caracas",
    "es": "Caracas",
    "ru": "Каракас",
    "tr": "Caracas",
    "uk": "Каракас",
    "zh": "加拉加斯"
  },
  "city_casablanca": {
    "ar": "الدار البيضاء",
    "en": "Casablanca",
    "es": "Casablanca",
    "ru": "Касабланка",
    "tr": "Kazablanka",
    "uk": "Касабланка",
    "zh": "卡萨布兰卡"
  },
  "city_casey": {
    "ar": "كاساي",
    "en": "Casey",
    "es": "Casey",
    "ru": "Кейси",
    "tr": "Casey",
    "uk": "Кейсі",
    "zh": "卡塞"
  },
  "city_catamarca": {
    "ar": "Catamarca",
    "en": "Catamarca",
    "es": "Catamarca",
    "ru": "Catamarca",
    "tr": "Catamarca",
    "uk": "Catamarca",
    "zh": "Catamarca"
  },
  "city_cayenne": {
    "ar": "كايين",
    "en": "Cayenne",
    "es": "Cayena",
    "ru": "Кайенна",
    "tr": "Cayenne",
    "uk": "Каєнна",
    "zh": "卡宴"
  },
  "city_cayman": {
    "ar": "كايمان",
    "en": "Cayman",
    "es": "Caimán",
    "ru": "Острова Кайман",
    "tr": "Cayman",
    "uk": "Кайманові Острови",
    "zh": "开曼"
  },
  "city_center_north_dakota": {
    "ar": "سنتر",
    "en": "Center, North Dakota",
    "es": "Center, Dakota del Norte",
    "ru": "Центр, Северная Дакота",
    "tr": "Merkez, Kuzey Dakota",
    "uk": "Сентр, Північна Дакота",
    "zh": "北达科他州申特"
  },
  "city_central": {
    "ar": "Central",
    "en": "Central",
    "es": "Central",
    "ru": "Central",
    "tr": "Central",
    "uk": "Central",
    "zh": "Central"
  },
  "city_ceuta": {
    "ar": "سيتا",
    "en": "Ceuta",
    "es": "Ceuta",
    "ru": "Сеута",
    "tr": "Septe",
    "uk": "Сеута",
    "zh": "休达"
  },
  "city_chagos": {
    "ar": "تشاغوس",
    "en": "Chagos",
    "es": "Chagos",
    "ru": "Чагос",
    "tr": "Chagos",
    "uk": "Чаґос",
    "zh": "查戈斯"
  },
  "city_chatham": {
    "ar": "تشاثام",
    "en": "Chatham",
    "es": "Chatham",
    "ru": "Чатем",
    "tr": "Chatham",
    "uk": "Чатем",
    "zh": "查塔姆"
  },
  "city_cherkasy": {
    "ar": "تشيركاسي",
    "en": "Cherkasy",
    "es": "Cherkasy",
    "ru": "Черкассы",
    "tr": "Çerkası",
    "uk": "Черкаси",
    "zh": "切尔卡瑟"
  },
  "city_chernigov": {
    "ar": "تشيرنيهيف",
    "en": "Chernihiv",
    "es": "Cherníhiv",
    "ru": "Чернигов",
    "tr": "Çernihiv",
    "uk": "Чернігів",
    "zh": "切尔尼戈夫"
  },
  "city_chernihiv": {
    "ar": "تشيرنيهيف",
    "en": "Chernihiv",
    "es": "Cherníhiv",
    "ru": "Чернигов",
    "tr": "Çernihiv",
    "uk": "Чернігів",
    "zh": "切尔尼戈夫"
  },
  "city_chernivtsi": {
    "ar": "تشيرنيفتسي",
    "en": "Chernivtsi",
    "es": "Chernivtsí",
    "ru": "Черновцы",
    "tr": "Çernivtsi",
    "uk": "Чернівці",
    "zh": "切尔诺夫策"
  },
  "city_chernovtsy": {
    "ar": "تشيرنيفتسي",
    "en": "Chernivtsi",
    "es": "Chernivtsí",
    "ru": "Черновцы",
    "tr": "Çernivtsi",
    "uk": "Чернівці",
    "zh": "切尔诺夫策"
  },
  "city_chicago": {
    "ar": "شيكاغو",
    "en": "Chicago",
    "es": "Chicago",
    "ru": "Чикаго",
    "tr": "Chicago",
    "uk": "Чікаґо",
    "zh": "芝加哥"
  },
  "city_chihuahua": {
    "ar": "تشيواوا",
    "en": "Chihuahua",
    "es": "Chihuahua",
    "ru": "Чиуауа",
    "tr": "Chihuahua",
    "uk": "Чіуауа",
    "zh": "奇瓦瓦"
  },
  "city_chisinau": {
    "ar": "تشيسيناو",
    "en": "Chisinau",
    "es": "Chisináu",
    "ru": "Кишинев",
    "tr": "Kişinev",
    "uk": "Кишинів",
    "zh": "基希讷乌"
  },
  "city_chita": {
    "ar": "تشيتا",
    "en": "Chita",
    "es": "Chitá",
    "ru": "Чита",
    "tr": "Çita",
    "uk": "Чита",
    "zh": "赤塔"
  },
  "city_choibalsan": {
    "ar": "Choibalsan",
    "en": "Choibalsan",
    "es": "Choibalsan",
    "ru": "Choibalsan",
    "tr": "Choibalsan",
    "uk": "Choibalsan",
    "zh": "Choibalsan"
  },
  "city_chongqing": {
    "ar": "Chongqing",
    "en": "Chongqing",
    "es": "Chongqing",
    "ru": "Chongqing",
    "tr": "Chongqing",
    "uk": "Chongqing",
    "zh": "Chongqing"
  },
  "city_christmas_island": {
    "ar": "كريسماس",
    "en": "Christmas Island",
    "es": "Navidad",
    "ru": "о-в Рождества",
    "tr": "Christmas Island",
    "uk": "Острів Різдва",
    "zh": "圣诞岛"
  },
  "city_chungking": {
    "ar": "Chungking",
    "en": "Chungking",
    "es": "Chungking",
    "ru": "Chungking",
    "tr": "Chungking",
    "uk": "Chungking",
    "zh": "Chungking"
  },
  "city_chuuk": {
    "ar": "Chuuk",
    "en": "Chuuk",
    "es": "Chuuk",
    "ru": "Chuuk",
    "tr": "Chuuk",
    "uk": "Chuuk",
    "zh": "Chuuk"
  },
  "city_ciudad_juarez": {
    "ar": "سيوداد خواريز",
    "en": "Ciudad Juárez",
    "es": "Ciudad Juárez",
    "ru": "Сьюдад-Хуарес",
    "tr": "Ciudad Juárez",
    "uk": "С’юдад-Хуарес",
    "zh": "华雷斯城"
  },
  "city_cocos_islands": {
    "ar": "كوكوس",
    "en": "Cocos Islands",
    "es": "Cocos Islands",
    "ru": "Кокосовые о-ва",
    "tr": "Cocos Islands",
    "uk": "Кокосові острови",
    "zh": "可可斯"
  },
  "city_colombo": {
    "ar": "كولومبو",
    "en": "Colombo",
    "es": "Colombo",
    "ru": "Коломбо",
    "tr": "Kolombo",
    "uk": "Коломбо",
    "zh": "科伦坡"
  },
  "city_comodrivadavia": {
    "ar": "ComodRivadavia",
    "en": "ComodRivadavia",
    "es": "ComodRivadavia",
    "ru": "ComodRivadavia",
    "tr": "ComodRivadavia",
    "uk": "ComodRivadavia",
    "zh": "ComodRivadavia"
  },
  "city_comoro": {
    "ar": "جزر القمر",
    "en": "Comoro",
    "es": "Comoras",
    "ru": "Коморы",
    "tr": "Komor",
    "uk": "Комори",
    "zh": "科摩罗"
  },
  "city_conakry": {
    "ar": "كوناكري",
    "en": "Conakry",
    "es": "Conakri",
    "ru": "Конакри",
    "tr": "Konakri",
    "uk": "Конакрі",
    "zh": "科纳克里"
  },
  "city_continental": {
    "ar": "Continental",
    "en": "Continental",
    "es": "Continental",
    "ru": "Continental",
    "tr": "Continental",
    "uk": "Continental",
    "zh": "Continental"
  },
  "city_copenhagen": {
    "ar": "كوبنهاغن",
    "en": "Copenhagen",
    "es": "Copenhague",
    "ru": "Копенгаген",
    "tr": "Kopenhag",
    "uk": "Копенгаген",
    "zh": "哥本哈根"
  },
  "city_cordoba": {
    "ar": "Cordoba",
    "en": "Cordoba",
    "es": "Cordoba",
    "ru": "Cordoba",
    "tr": "Cordoba",
    "uk": "Cordoba",
    "zh": "Cordoba"
  },
  "city_costa_rica": {
    "ar": "كوستاريكا",
    "en": "Costa Rica",
    "es": "Costa Rica",
    "ru": "Коста-Рика",
    "tr": "Kosta Rika",
    "uk": "Коста-Ріка",
    "zh": "哥斯达黎加"
  },
  "city_coyhaique": {
    "ar": "Coyhaique",
    "en": "Coyhaique",
    "es": "Coyhaique",
    "ru": "Coyhaique",
    "tr": "Coyhaique",
    "uk": "Coyhaique",
    "zh": "Coyhaique"
  },
  "city_creston": {
    "ar": "كريستون",
    "en": "Creston",
    "es": "Creston",
    "ru": "Крестон",
    "tr": "Creston",
    "uk": "Крестон",
    "zh": "克雷斯顿"
  },
  "city_cuiaba": {
    "ar": "كيابا",
    "en": "Cuiaba",
    "es": "Cuiabá",
    "ru": "Куяба",
    "tr": "Cuiaba",
    "uk": "Куяба",
    "zh": "库亚巴"
  },
  "city_curacao": {
    "ar": "كوراساو",
    "en": "Curaçao",
    "es": "Curazao",
    "ru": "Кюрасао",
    "tr": "Curaçao",
    "uk": "Кюрасао",
    "zh": "库拉索"
  },
  "city_currie": {
    "ar": "Currie",
    "en": "Currie",
    "es": "Currie",
    "ru": "Currie",
    "tr": "Currie",
    "uk": "Currie",
    "zh": "Currie"
  },
  "city_dacca": {
    "ar": "Dacca",
    "en": "Dacca",
    "es": "Dacca",
    "ru": "Dacca",
    "tr": "Dacca",
    "uk": "Dacca",
    "zh": "Dacca"
  },
  "city_dakar": {
    "ar": "داكار",
    "en": "Dakar",
    "es": "Dakar",
    "ru": "Дакар",
    "tr": "Dakar",
    "uk": "Дакар",
    "zh": "达喀尔"
  },
  "city_damascus": {
    "ar": "دمشق",
    "en": "Damascus",
    "es": "Damasco",
    "ru": "Дамаск",
    "tr": "Şam",
    "uk": "Дамаск",
    "zh": "大马士革"
  },
  "city_danmarkshavn": {
    "ar": "دانمرك شافن",
    "en": "Danmarkshavn",
    "es": "Danmarkshavn",
    "ru": "Денмарксхавн",
    "tr": "Danmarkshavn",
    "uk": "Денмарксхавн",
    "zh": "丹马沙文"
  },
  "city_dar_es_salaam": {
    "ar": "دار السلام",
    "en": "Dar es Salaam",
    "es": "Dar es-Salam",
    "ru": "Дар-эс-Салам",
    "tr": "Darüsselam",
    "uk": "Дар-ес-Салам",
    "zh": "达累斯萨拉姆"
  },
  "city_darwin": {
    "ar": "دارون",
    "en": "Darwin",
    "es": "Darwin",
    "ru": "Дарвин",
    "tr": "Darwin",
    "uk": "Дарвін",
    "zh": "达尔文"
  },
  "city_davis": {
    "ar": "دافيز",
    "en": "Davis",
    "es": "Davis",
    "ru": "Дейвис",
    "tr": "Davis",
    "uk": "Девіс",
    "zh": "戴维斯"
  },
  "city_dawson": {
    "ar": "داوسان",
    "en": "Dawson",
    "es": "Dawson",
    "ru": "Доусон",
    "tr": "Dawson",
    "uk": "Доусон",
    "zh": "道森"
  },
  "city_dawson_creek": {
    "ar": "داوسن كريك",
    "en": "Dawson Creek",
    "es": "Dawson Creek",
    "ru": "Доусон-Крик",
    "tr": "Dawson Creek",
    "uk": "Доусон-Крік",
    "zh": "道森克里克"
  },
  "city_denoronha": {
    "ar": "DeNoronha",
    "en": "DeNoronha",
    "es": "DeNoronha",
    "ru": "DeNoronha",
    "tr": "DeNoronha",
    "uk": "DeNoronha",
    "zh": "DeNoronha"
  },
  "city_denver": {
    "ar": "دنفر",
    "en": "Denver",
    "es": "Denver",
    "ru": "Денвер",
    "tr": "Denver",
    "uk": "Денвер",
    "zh": "丹佛"
  },
  "city_detroit": {
    "ar": "ديترويت",
    "en": "Detroit",
    "es": "Detroit",
    "ru": "Детройт",
    "tr": "Detroit",
    "uk": "Детройт",
    "zh": "底特律"
  },
  "city_dhaka": {
    "ar": "دكا",
    "en": "Dhaka",
    "es": "Daca",
    "ru": "Дакка",
    "tr": "Dakka",
    "uk": "Дакка",
    "zh": "达卡"
  },
  "city_dili": {
    "ar": "ديلي",
    "en": "Dili",
    "es": "Dili",
    "ru": "Дили",
    "tr": "Dili",
    "uk": "Ділі",
    "zh": "帝力"
  },
  "city_djibouti": {
    "ar": "جيبوتي",
    "en": "Djibouti",
    "es": "Yibuti",
    "ru": "Джибути",
    "tr": "Cibuti",
    "uk": "Джібуті",
    "zh": "吉布提"
  },
  "city_dnipro": {
    "ar": "دنيبرو",
    "en": "Dnipro",
    "es": "Dnipro",
    "ru": "Днепр",
    "tr": "Dnipro",
    "uk": "Дніпро",
    "zh": "第聂伯罗"
  },
  "city_dominica": {
    "ar": "دومينيكا",
    "en": "Dominica",
    "es": "Dominica",
    "ru": "Доминика",
    "tr": "Dominika",
    "uk": "Домініка",
    "zh": "多米尼加"
  },
  "city_donetsk": {
    "ar": "دونيتسك",
    "en": "Donetsk",
    "es": "Donetsk",
    "ru": "Донецк",
    "tr": "Donetsk",
    "uk": "Донецьк",
    "zh": "顿涅茨克"
  },
  "city_douala": {
    "ar": "دوالا",
    "en": "Douala",
    "es": "Duala",
    "ru": "Дуала",
    "tr": "Douala",
    "uk": "Дуала",
    "zh": "杜阿拉"
  },
  "city_dubai": {
    "ar": "دبي",
    "en": "Dubai",
    "es": "Dubái",
    "ru": "Дубай",
    "tr": "Dubai",
    "uk": "Дубай",
    "zh": "迪拜"
  },
  "city_dublin": {
    "ar": "دبلن",
    "en": "Dublin",
    "es": "Dublín",
    "ru": "Дублин",
    "tr": "Dublin",
    "uk": "Дублін",
    "zh": "都柏林"
  },
  "city_dumont_d_urville": {
    "ar": "دي مونت دو روفيل",
    "en": "Dumont-d’Urville",
    "es": "Dumont-d’Urville",
    "ru": "Дюмон-д’Юрвиль",
    "tr": "Dumont-d’Urville",
    "uk": "Дюмон-дʼЮрвіль",
    "zh": "迪蒙·迪维尔"
  },
  "city_dushanbe": {
    "ar": "دوشانبي",
    "en": "Dushanbe",
    "es": "Dusambé",
    "ru": "Душанбе",
    "tr": "Duşanbe",
    "uk": "Душанбе",
    "zh": "杜尚别"
  },
  "city_east": {
    "ar": "East",
    "en": "East",
    "es": "East",
    "ru": "East",
    "tr": "East",
    "uk": "East",
    "zh": "East"
  },
  "city_east_indiana": {
    "ar": "East-Indiana",
    "en": "East-Indiana",
    "es": "East-Indiana",
    "ru": "East-Indiana",
    "tr": "East-Indiana",
    "uk": "East-Indiana",
    "zh": "East-Indiana"
  },
  "city_easter_island": {
    "ar": "استر",
    "en": "Easter Island",
    "es": "Isla de Pascua",
    "ru": "о-в Пасхи",
    "tr": "Paskalya Adası",
    "uk": "Острів Пасхи",
    "zh": "复活节岛"
  },
  "city_easterisland": {
    "ar": "EasterIsland",
    "en": "EasterIsland",
    "es": "EasterIsland",
    "ru": "EasterIsland",
    "tr": "EasterIsland",
    "uk": "EasterIsland",
    "zh": "EasterIsland"
  },
  "city_eastern": {
    "ar": "Eastern",
    "en": "Eastern",
    "es": "Eastern",
    "ru": "Eastern",
    "tr": "Eastern",
    "uk": "Eastern",
    "zh": "Eastern"
  },
  "city_edmonton": {
    "ar": "ايدمونتون",
    "en": "Edmonton",
    "es": "Edmonton",
    "ru": "Эдмонтон",
    "tr": "Edmonton",
    "uk": "Едмонтон",
    "zh": "埃德蒙顿"
  },
  "city_efate": {
    "ar": "إيفات",
    "en": "Efate",
    "es": "Efate",
    "ru": "Эфате",
    "tr": "Efate",
    "uk": "Ефате",
    "zh": "埃法特"
  },
  "city_eirunepe": {
    "ar": "ايرونبي",
    "en": "Eirunepe",
    "es": "Eirunepé",
    "ru": "Эйрунепе",
    "tr": "Eirunepe",
    "uk": "Ейрунепе",
    "zh": "依伦尼贝"
  },
  "city_el_aaiun": {
    "ar": "العيون",
    "en": "El Aaiun",
    "es": "El Aaiún",
    "ru": "Эль-Аюн",
    "tr": "Layun",
    "uk": "Ель-Аюн",
    "zh": "阿尤恩"
  },
  "city_el_salvador": {
    "ar": "السلفادور",
    "en": "El Salvador",
    "es": "El Salvador",
    "ru": "Сальвадор",
    "tr": "El Salvador",
    "uk": "Сальвадор",
    "zh": "萨尔瓦多"
  },
  "city_enderbury": {
    "ar": "اندربيرج",
    "en": "Enderbury",
    "es": "Enderbury",
    "ru": "о-в Эндербери",
    "tr": "Enderbury",
    "uk": "Ендербері",
    "zh": "恩德伯里"
  },
  "city_ensenada": {
    "ar": "Ensenada",
    "en": "Ensenada",
    "es": "Ensenada",
    "ru": "Ensenada",
    "tr": "Ensenada",
    "uk": "Ensenada",
    "zh": "Ensenada"
  },
  "city_eucla": {
    "ar": "أوكلا",
    "en": "Eucla",
    "es": "Eucla",
    "ru": "Юкла",
    "tr": "Eucla",
    "uk": "Евкла",
    "zh": "尤克拉"
  },
  "city_fakaofo": {
    "ar": "فاكاوفو",
    "en": "Fakaofo",
    "es": "Fakaofo",
    "ru": "Факаофо",
    "tr": "Fakaofo",
    "uk": "Факаофо",
    "zh": "法考福"
  },
  "city_famagusta": {
    "ar": "فاماغوستا",
    "en": "Famagusta",
    "es": "Famagusta",
    "ru": "Фамагуста",
    "tr": "Gazimağusa",
    "uk": "Фамагуста",
    "zh": "法马古斯塔"
  },
  "city_faroe": {
    "ar": "فارو",
    "en": "Faroe",
    "es": "Islas Feroe",
    "ru": "Фарерские о-ва",
    "tr": "Faroe",
    "uk": "Фарерські острови",
    "zh": "法罗"
  },
  "city_fernando_de_noronha": {
    "ar": "نوروناه",
    "en": "Fernando de Noronha",
    "es": "Fernando de Noronha",
    "ru": "Норонья",
    "tr": "Fernando de Noronha",
    "uk": "Норонья",
    "zh": "洛罗尼亚"
  },
  "city_fiji": {
    "ar": "فيجي",
    "en": "Fiji",
    "es": "Fiyi",
    "ru": "Фиджи",
    "tr": "Fiji",
    "uk": "Фіджі",
    "zh": "斐济"
  },
  "city_fort_nelson": {
    "ar": "فورت نيلسون",
    "en": "Fort Nelson",
    "es": "Fort Nelson",
    "ru": "Форт Нельсон",
    "tr": "Fort Nelson",
    "uk": "Форт Нельсон",
    "zh": "纳尔逊堡"
  },
  "city_fort_wayne": {
    "ar": "Fort Wayne",
    "en": "Fort Wayne",
    "es": "Fort Wayne",
    "ru": "Fort Wayne",
    "tr": "Fort Wayne",
    "uk": "Fort Wayne",
    "zh": "Fort Wayne"
  },
  "city_fortaleza": {
    "ar": "فورتاليزا",
    "en": "Fortaleza",
    "es": "Fortaleza",
    "ru": "Форталеза",
    "tr": "Fortaleza",
    "uk": "Форталеза",
    "zh": "福塔雷萨"
  },
  "city_freetown": {
    "ar": "فري تاون",
    "en": "Freetown",
    "es": "Freetown",
    "ru": "Фритаун",
    "tr": "Freetown",
    "uk": "Фрітаун",
    "zh": "弗里敦"
  },
  "city_funafuti": {
    "ar": "فونافوتي",
    "en": "Funafuti",
    "es": "Funafuti",
    "ru": "Фунафути",
    "tr": "Funafuti",
    "uk": "Фунафуті",
    "zh": "富纳富提"
  },
  "city_gaborone": {
    "ar": "غابورون",
    "en": "Gaborone",
    "es": "Gaborone",
    "ru": "Габороне",
    "tr": "Gaborone",
    "uk": "Ґабороне",
    "zh": "哈博罗内"
  },
  "city_galapagos": {
    "ar": "جلاباجوس",
    "en": "Galapagos",
    "es": "Galápagos",
    "ru": "Галапагосские о-ва",
    "tr": "Galapagos",
    "uk": "Ґалапаґос",
    "zh": "科隆群岛"
  },
  "city_gambier": {
    "ar": "جامبير",
    "en": "Gambier",
    "es": "Gambier",
    "ru": "о-ва Гамбье",
    "tr": "Gambier",
    "uk": "Гамбʼє",
    "zh": "甘比尔"
  },
  "city_gaza": {
    "ar": "غزة",
    "en": "Gaza",
    "es": "Gaza",
    "ru": "Газа",
    "tr": "Gazze",
    "uk": "Газа",
    "zh": "加沙"
  },
  "city_general": {
    "ar": "General",
    "en": "General",
    "es": "General",
    "ru": "General",
    "tr": "General",
    "uk": "General",
    "zh": "General"
  },
  "city_gibraltar": {
    "ar": "جبل طارق",
    "en": "Gibraltar",
    "es": "Gibraltar",
    "ru": "Гибралтар",
    "tr": "Cebelitarık",
    "uk": "Гібралтар",
    "zh": "直布罗陀"
  },
  "city_glace_bay": {
    "ar": "جلاس باي",
    "en": "Glace Bay",
    "es": "Glace Bay",
    "ru": "Глейс-Бей",
    "tr": "Glace Bay",
    "uk": "Ґлейс-Бей",
    "zh": "格莱斯贝"
  },
  "city_goose_bay": {
    "ar": "جوس باي",
    "en": "Goose Bay",
    "es": "Goose Bay",
    "ru": "Гус-Бей",
    "tr": "Goose Bay",
    "uk": "Ґус-Бей",
    "zh": "古斯湾"
  },
  "city_grand_turk": {
    "ar": "غراند ترك",
    "en": "Grand Turk",
    "es": "Gran Turca",
    "ru": "Гранд-Терк",
    "tr": "Grand Turk",
    "uk": "Ґранд-Терк",
    "zh": "大特克"
  },
  "city_grenada": {
    "ar": "غرينادا",
    "en": "Grenada",
    "es": "Granada",
    "ru": "Гренада",
    "tr": "Grenada",
    "uk": "Ґренада",
    "zh": "格林纳达"
  },
  "city_guadalcanal": {
    "ar": "غوادالكانال",
    "en": "Guadalcanal",
    "es": "Guadalcanal",
    "ru": "Гуадалканал",
    "tr": "Guadalcanal",
    "uk": "Гуадалканал",
    "zh": "瓜达尔卡纳尔"
  },
  "city_guadeloupe": {
    "ar": "غوادلوب",
    "en": "Guadeloupe",
    "es": "Guadalupe",
    "ru": "Гваделупа",
    "tr": "Guadeloupe",
    "uk": "Ґваделупа",
    "zh": "瓜德罗普"
  },
  "city_guam": {
    "ar": "غوام",
    "en": "Guam",
    "es": "Guam",
    "ru": "Гуам",
    "tr": "Guam",
    "uk": "Гуам",
    "zh": "关岛"
  },
  "city_guatemala": {
    "ar": "غواتيمالا",
    "en": "Guatemala",
    "es": "Guatemala",
    "ru": "Гватемала",
    "tr": "Guatemala",
    "uk": "Ґватемала",
    "zh": "危地马拉"
  },
  "city_guayaquil": {
    "ar": "غواياكويل",
    "en": "Guayaquil",
    "es": "Guayaquil",
    "ru": "Гуаякиль",
    "tr": "Guayaquil",
    "uk": "Ґуаякіль",
    "zh": "瓜亚基尔"
  },
  "city_guernsey": {
    "ar": "غيرنزي",
    "en": "Guernsey",
    "es": "Guernesey",
    "ru": "Гернси",
    "tr": "Guernsey",
    "uk": "Гернсі",
    "zh": "根西岛"
  },
  "city_guyana": {
    "ar": "غيانا",
    "en": "Guyana",
    "es": "Guyana",
    "ru": "Гайана",
    "tr": "Guyana",
    "uk": "Ґайана",
    "zh": "圭亚那"
  },
  "city_halifax": {
    "ar": "هاليفاكس",
    "en": "Halifax",
    "es": "Halifax",
    "ru": "Галифакс",
    "tr": "Halifax",
    "uk": "Галіфакс",
    "zh": "哈利法克斯"
  },
  "city_harare": {
    "ar": "هراري",
    "en": "Harare",
    "es": "Harare",
    "ru": "Хараре",
    "tr": "Harare",
    "uk": "Хараре",
    "zh": "哈拉雷"
  },
  "city_harbin": {
    "ar": "Harbin",
    "en": "Harbin",
    "es": "Harbin",
    "ru": "Harbin",
    "tr": "Harbin",
    "uk": "Harbin",
    "zh": "Harbin"
  },
  "city_havana": {
    "ar": "هافانا",
    "en": "Havana",
    "es": "La Habana",
    "ru": "Гавана",
    "tr": "Havana",
    "uk": "Гавана",
    "zh": "哈瓦那"
  },
  "city_hawaii": {
    "ar": "Hawaii",
    "en": "Hawaii",
    "es": "Hawaii",
    "ru": "Hawaii",
    "tr": "Hawaii",
    "uk": "Hawaii",
    "zh": "Hawaii"
  },
  "city_hebron": {
    "ar": "هيبرون (مدينة الخليل)",
    "en": "Hebron",
    "es": "Hebrón",
    "ru": "Хеврон",
    "tr": "El Halil",
    "uk": "Хеврон",
    "zh": "希伯伦"
  },
  "city_helsinki": {
    "ar": "هلسنكي",
    "en": "Helsinki",
    "es": "Helsinki",
    "ru": "Хельсинки",
    "tr": "Helsinki",
    "uk": "Гельсінкі",
    "zh": "赫尔辛基"
  },
  "city_hermosillo": {
    "ar": "هيرموسيلو",
    "en": "Hermosillo",
    "es": "Hermosillo",
    "ru": "Эрмосильо",
    "tr": "Hermosillo",
    "uk": "Ермосільйо",
    "zh": "埃莫西约"
  },
  "city_ho_chi_minh": {
    "ar": "Ho Chi Minh",
    "en": "Ho Chi Minh",
    "es": "Ho Chi Minh",
    "ru": "Ho Chi Minh",
    "tr": "Ho Chi Minh",
    "uk": "Ho Chi Minh",
    "zh": "Ho Chi Minh"
  },
  "city_ho_chi_minh_city": {
    "ar": "مدينة هو تشي منة",
    "en": "Ho Chi Minh City",
    "es": "Ciudad Ho Chi Minh",
    "ru": "Хошимин",
    "tr": "Ho Chi Minh Kenti",
    "uk": "Хошимін",
    "zh": "胡志明市"
  },
  "city_hobart": {
    "ar": "هوبارت",
    "en": "Hobart",
    "es": "Hobart",
    "ru": "Хобарт",
    "tr": "Hobart",
    "uk": "Гобарт",
    "zh": "霍巴特"
  },
  "city_hong_kong": {
    "ar": "هونغ كونغ",
    "en": "Hong Kong",
    "es": "Hong Kong",
    "ru": "Гонконг",
    "tr": "Hong Kong",
    "uk": "Гонконг",
    "zh": "香港"
  },
  "city_honolulu": {
    "ar": "هونولولو",
    "en": "Honolulu",
    "es": "Honolulú",
    "ru": "Гонолулу",
    "tr": "Honolulu",
    "uk": "Гонолулу",
    "zh": "檀香山"
  },
  "city_hovd": {
    "ar": "هوفد",
    "en": "Hovd",
    "es": "Hovd",
    "ru": "Ховд",
    "tr": "Hovd",
    "uk": "Ховд",
    "zh": "科布多"
  },
  "city_indiana_starke": {
    "ar": "Indiana-Starke",
    "en": "Indiana-Starke",
    "es": "Indiana-Starke",
    "ru": "Indiana-Starke",
    "tr": "Indiana-Starke",
    "uk": "Indiana-Starke",
    "zh": "Indiana-Starke"
  },
  "city_indianapolis": {
    "ar": "Indianapolis",
    "en": "Indianapolis",
    "es": "Indianapolis",
    "ru": "Indianapolis",
    "tr": "Indianapolis",
    "uk": "Indianapolis",
    "zh": "Indianapolis"
  },
  "city_inuvik": {
    "ar": "اينوفيك",
    "en": "Inuvik",
    "es": "Inuvik",
    "ru": "Инувик",
    "tr": "Inuvik",
    "uk": "Інувік",
    "zh": "伊努维克"
  },
  "city_iqaluit": {
    "ar": "اكويلت",
    "en": "Iqaluit",
    "es": "Iqaluit",
    "ru": "Икалуит",
    "tr": "Iqaluit",
    "uk": "Ікалуїт",
    "zh": "伊魁特"
  },
  "city_irkutsk": {
    "ar": "ايركيتسك",
    "en": "Irkutsk",
    "es": "Irkutsk",
    "ru": "Иркутск",
    "tr": "İrkutsk",
    "uk": "Іркутськ",
    "zh": "伊尔库茨克"
  },
  "city_irpin": {
    "ar": "إربين",
    "en": "Irpin",
    "es": "Irpín",
    "ru": "Ирпень",
    "tr": "İrpin",
    "uk": "Ірпінь",
    "zh": "伊尔平"
  },
  "city_isle_of_man": {
    "ar": "جزيرة مان",
    "en": "Isle of Man",
    "es": "Isla de Man",
    "ru": "о-в Мэн",
    "tr": "Man Adası",
    "uk": "Острів Мен",
    "zh": "马恩岛"
  },
  "city_istanbul": {
    "ar": "Istanbul",
    "en": "Istanbul",
    "es": "Istanbul",
    "ru": "Istanbul",
    "tr": "Istanbul",
    "uk": "Istanbul",
    "zh": "Istanbul"
  },
  "city_ittoqqortoormiit": {
    "ar": "سكورسبيسند",
    "en": "Ittoqqortoormiit",
    "es": "Ittoqqortoormiit",
    "ru": "Скорсбисунн",
    "tr": "Ittoqqortoormiit",
    "uk": "Іттоккортоорміут",
    "zh": "斯科列斯比桑德"
  },
  "city_ivano_frankivsk": {
    "ar": "إيفانو فرانكيفسك",
    "en": "Ivano-Frankivsk",
    "es": "Ivano-Frankivsk",
    "ru": "Ивано-Франковск",
    "tr": "İvano-Frankivsk",
    "uk": "Івано-Франківськ",
    "zh": "伊万诺-弗兰科夫斯克"
  },
  "city_jakarta": {
    "ar": "جاكرتا",
    "en": "Jakarta",
    "es": "Yakarta",
    "ru": "Джакарта",
    "tr": "Cakarta",
    "uk": "Джакарта",
    "zh": "雅加达"
  },
  "city_jamaica": {
    "ar": "جامايكا",
    "en": "Jamaica",
    "es": "Jamaica",
    "ru": "Ямайка",
    "tr": "Jamaika",
    "uk": "Ямайка",
    "zh": "牙买加"
  },
  "city_jan_mayen": {
    "ar": "Jan Mayen",
    "en": "Jan Mayen",
    "es": "Jan Mayen",
    "ru": "Jan Mayen",
    "tr": "Jan Mayen",
    "uk": "Jan Mayen",
    "zh": "Jan Mayen"
  },
  "city_jayapura": {
    "ar": "جايابيورا",
    "en": "Jayapura",
    "es": "Jayapura",
    "ru": "Джаяпура",
    "tr": "Jayapura",
    "uk": "Джайпур",
    "zh": "查亚普拉"
  },
  "city_jersey": {
    "ar": "جيرسي",
    "en": "Jersey",
    "es": "Jersey",
    "ru": "Джерси",
    "tr": "Jersey",
    "uk": "Джерсі",
    "zh": "泽西岛"
  },
  "city_jerusalem": {
    "ar": "القدس",
    "en": "Jerusalem",
    "es": "Jerusalén",
    "ru": "Иерусалим",
    "tr": "Kudüs",
    "uk": "Єрусалим",
    "zh": "耶路撒冷"
  },
  "city_johannesburg": {
    "ar": "جوهانسبرغ",
    "en": "Johannesburg",
    "es": "Johannesburgo",
    "ru": "Йоханнесбург",
    "tr": "Johannesburg",
    "uk": "Йоганнесбурґ",
    "zh": "约翰内斯堡"
  },
  "city_johnston": {
    "ar": "Johnston",
    "en": "Johnston",
    "es": "Johnston",
    "ru": "Johnston",
    "tr": "Johnston",
    "uk": "Johnston",
    "zh": "Johnston"
  },
  "city_juba": {
    "ar": "جوبا",
    "en": "Juba",
    "es": "Juba",
    "ru": "Джуба",
    "tr": "Cuba",
    "uk": "Джуба",
    "zh": "朱巴"
  },
  "city_jujuy": {
    "ar": "Jujuy",
    "en": "Jujuy",
    "es": "Jujuy",
    "ru": "Jujuy",
    "tr": "Jujuy",
    "uk": "Jujuy",
    "zh": "Jujuy"
  },
  "city_juneau": {
    "ar": "جوني",
    "en": "Juneau",
    "es": "Juneau",
    "ru": "Джуно",
    "tr": "Juneau",
    "uk": "Джуно",
    "zh": "朱诺"
  },
  "city_kabul": {
    "ar": "كابول",
    "en": "Kabul",
    "es": "Kabul",
    "ru": "Кабул",
    "tr": "Kabil",
    "uk": "Кабул",
    "zh": "喀布尔"
  },
  "city_kaliningrad": {
    "ar": "كالينجراد",
    "en": "Kaliningrad",
    "es": "Kaliningrado",
    "ru": "Калининград",
    "tr": "Kaliningrad",
    "uk": "Калінінград",
    "zh": "加里宁格勒"
  },
  "city_kamchatka": {
    "ar": "كامتشاتكا",
    "en": "Kamchatka",
    "es": "Kamchatka",
    "ru": "Петропавловск-Камчатский",
    "tr": "Kamçatka",
    "uk": "Камчатка",
    "zh": "堪察加"
  },
  "city_kampala": {
    "ar": "كامبالا",
    "en": "Kampala",
    "es": "Kampala",
    "ru": "Кампала",
    "tr": "Kampala",
    "uk": "Кампала",
    "zh": "坎帕拉"
  },
  "city_kanton": {
    "ar": "كانتون",
    "en": "Kanton",
    "es": "Kanton",
    "ru": "Кантон",
    "tr": "Kanton",
    "uk": "Кантон",
    "zh": "坎顿岛"
  },
  "city_karachi": {
    "ar": "كراتشي",
    "en": "Karachi",
    "es": "Karachi",
    "ru": "Карачи",
    "tr": "Karaçi",
    "uk": "Карачі",
    "zh": "卡拉奇"
  },
  "city_kashgar": {
    "ar": "Kashgar",
    "en": "Kashgar",
    "es": "Kashgar",
    "ru": "Kashgar",
    "tr": "Kashgar",
    "uk": "Kashgar",
    "zh": "Kashgar"
  },
  "city_kathmandu": {
    "ar": "Kathmandu",
    "en": "Kathmandu",
    "es": "Kathmandu",
    "ru": "Kathmandu",
    "tr": "Kathmandu",
    "uk": "Kathmandu",
    "zh": "Kathmandu"
  },
  "city_kerguelen": {
    "ar": "كيرغويلين",
    "en": "Kerguelen",
    "es": "Kerguelen",
    "ru": "Кергелен",
    "tr": "Kerguelen",
    "uk": "Керґелен",
    "zh": "凯尔盖朗"
  },
  "city_khandyga": {
    "ar": "خانديجا",
    "en": "Khandyga",
    "es": "Khandiga",
    "ru": "Хандыга",
    "tr": "Handiga",
    "uk": "Хандига",
    "zh": "汉德加"
  },
  "city_kharkiv": {
    "ar": "خاركيف",
    "en": "Kharkiv",
    "es": "Járkov",
    "ru": "Харьков",
    "tr": "Harkiv",
    "uk": "Харків",
    "zh": "哈尔科夫"
  },
  "city_khartoum": {
    "ar": "الخرطوم",
    "en": "Khartoum",
    "es": "Jartum",
    "ru": "Хартум",
    "tr": "Hartum",
    "uk": "Хартум",
    "zh": "喀土穆"
  },
  "city_kherson": {
    "ar": "خيرسون",
    "en": "Kherson",
    "es": "Jersón",
    "ru": "Херсон",
    "tr": "Herson",
    "uk": "Херсон",
    "zh": "赫尔松"
  },
  "city_khmelnitsky": {
    "ar": "خملنيتسكي",
    "en": "Khmelnytskyi",
    "es": "Jmelnitski",
    "ru": "Хмельницкий",
    "tr": "Hmelnytskyi",
    "uk": "Хмельницький",
    "zh": "赫梅利尼茨基"
  },
  "city_khmelnytskyi": {
    "ar": "خملنيتسكي",
    "en": "Khmelnytskyi",
    "es": "Jmelnitski",
    "ru": "Хмельницкий",
    "tr": "Hmelnytskyi",
    "uk": "Хмельницький",
    "zh": "赫梅利尼茨基"
  },
  "city_kiev": {
    "ar": "كييف",
    "en": "Kyiv",
    "es": "Kiev",
    "ru": "Киев",
    "tr": "Kiev",
    "uk": "Київ",
    "zh": "基辅"
  },
  "city_kigali": {
    "ar": "كيغالي",
    "en": "Kigali",
    "es": "Kigali",
    "ru": "Кигали",
    "tr": "Kigali",
    "uk": "Кігалі",
    "zh": "基加利"
  },
  "city_kinshasa": {
    "ar": "كينشاسا",
    "en": "Kinshasa",
    "es": "Kinshasa",
    "ru": "Киншаса",
    "tr": "Kinşasa",
    "uk": "Кіншаса",
    "zh": "金沙萨"
  },
  "city_kiritimati": {
    "ar": "كيريتي ماتي",
    "en": "Kiritimati",
    "es": "Kiritimati",
    "ru": "Киритимати",
    "tr": "Kiritimati",
    "uk": "Кірітіматі",
    "zh": "基里地马地岛"
  },
  "city_kirov": {
    "ar": "كيروف",
    "en": "Kirov",
    "es": "Kírov",
    "ru": "Киров",
    "tr": "Kirov",
    "uk": "Кіров",
    "zh": "基洛夫"
  },
  "city_knox_in": {
    "ar": "Knox IN",
    "en": "Knox IN",
    "es": "Knox IN",
    "ru": "Knox IN",
    "tr": "Knox IN",
    "uk": "Knox IN",
    "zh": "Knox IN"
  },
  "city_knox_indiana": {
    "ar": "كونكس",
    "en": "Knox, Indiana",
    "es": "Knox, Indiana",
    "ru": "Нокс, Индиана",
    "tr": "Knox, Indiana",
    "uk": "Нокс, Індіана",
    "zh": "印第安纳州诺克斯"
  },
  "city_kolkata": {
    "ar": "كالكتا",
    "en": "Kolkata",
    "es": "Calcuta",
    "ru": "Калькутта",
    "tr": "Kalküta",
    "uk": "Колката",
    "zh": "加尔各答"
  },
  "city_kosrae": {
    "ar": "كوسرا",
    "en": "Kosrae",
    "es": "Kosrae",
    "ru": "Косрае",
    "tr": "Kosrae",
    "uk": "Косрае",
    "zh": "库赛埃"
  },
  "city_kostanay": {
    "ar": "قوستاناي",
    "en": "Kostanay",
    "es": "Kostanái",
    "ru": "Костанай",
    "tr": "Kostanay",
    "uk": "Костанай",
    "zh": "库斯塔奈"
  },
  "city_kralendijk": {
    "ar": "كرالنديك",
    "en": "Kralendijk",
    "es": "Kralendijk",
    "ru": "Кралендейк",
    "tr": "Kralendijk",
    "uk": "Кралендейк",
    "zh": "克拉伦代克"
  },
  "city_krasnoyarsk": {
    "ar": "كراسنويارسك",
    "en": "Krasnoyarsk",
    "es": "Krasnoyarsk",
    "ru": "Красноярск",
    "tr": "Krasnoyarsk",
    "uk": "Красноярськ",
    "zh": "克拉斯诺亚尔斯克"
  },
  "city_kremenchuk": {
    "ar": "كريمنشوك",
    "en": "Kremenchuk",
    "es": "Kremenchuk",
    "ru": "Кременчуг",
    "tr": "Kremençuk",
    "uk": "Кременчук",
    "zh": "克列缅丘克"
  },
  "city_krivoj_rog": {
    "ar": "كريفي ريه",
    "en": "Kryvyi Rih",
    "es": "Krivói Rog",
    "ru": "Кривой Рог",
    "tr": "Krivyi Rih",
    "uk": "Кривий Ріг",
    "zh": "克里沃罗格"
  },
  "city_krivoy_rog": {
    "ar": "كريفي ريه",
    "en": "Kryvyi Rih",
    "es": "Krivói Rog",
    "ru": "Кривой Рог",
    "tr": "Krivyi Rih",
    "uk": "Кривий Ріг",
    "zh": "克里沃罗格"
  },
  "city_kropyvnytskyi": {
    "ar": "كروبيفنيتسكي",
    "en": "Kropyvnytskyi",
    "es": "Kropyvnytskyi",
    "ru": "Кропивницкий",
    "tr": "Kropıvnıtskıy",
    "uk": "Кропивницький",
    "zh": "克罗皮夫尼茨基"
  },
  "city_kryvyi_rih": {
    "ar": "كريفي ريه",
    "en": "Kryvyi Rih",
    "es": "Krivói Rog",
    "ru": "Кривой Рог",
    "tr": "Krivyi Rih",
    "uk": "Кривий Ріг",
    "zh": "克里沃罗格"
  },
  "city_kuala_lumpur": {
    "ar": "كوالا لامبور",
    "en": "Kuala Lumpur",
    "es": "Kuala Lumpur",
    "ru": "Куала-Лумпур",
    "tr": "Kuala Lumpur",
    "uk": "Куала-Лумпур",
    "zh": "吉隆坡"
  },
  "city_kuching": {
    "ar": "كيشينج",
    "en": "Kuching",
    "es": "Kuching",
    "ru": "Кучинг",
    "tr": "Kuçing",
    "uk": "Кучинг",
    "zh": "古晋"
  },
  "city_kuwait": {
    "ar": "الكويت",
    "en": "Kuwait",
    "es": "Kuwait",
    "ru": "Кувейт",
    "tr": "Kuveyt",
    "uk": "Кувейт",
    "zh": "科威特"
  },
  "city_kwajalein": {
    "ar": "كواجالين",
    "en": "Kwajalein",
    "es": "Kwajalein",
    "ru": "Кваджалейн",
    "tr": "Kwajalein",
    "uk": "Кваджалейн",
    "zh": "夸贾林"
  },
  "city_kyiv": {
    "ar": "كييف",
    "en": "Kyiv",
    "es": "Kiev",
    "ru": "Киев",
    "tr": "Kiev",
    "uk": "Київ",
    "zh": "基辅"
  },
  "city_la_paz": {
    "ar": "لا باز",
    "en": "La Paz",
    "es": "La Paz",
    "ru": "Ла-Пас",
    "tr": "La Paz",
    "uk": "Ла-Пас",
    "zh": "拉巴斯"
  },
  "city_la_rioja": {
    "ar": "لا ريوجا",
    "en": "La Rioja",
    "es": "La Rioja",
    "ru": "Ла-Риоха",
    "tr": "La Rioja",
    "uk": "Ла-Ріоха",
    "zh": "拉里奥哈"
  },
  "city_lagos": {
    "ar": "لاغوس",
    "en": "Lagos",
    "es": "Lagos",
    "ru": "Лагос",
    "tr": "Lagos",
    "uk": "Лаґос",
    "zh": "拉各斯"
  },
  "city_lhi": {
    "ar": "LHI",
    "en": "LHI",
    "es": "LHI",
    "ru": "LHI",
    "tr": "LHI",
    "uk": "LHI",
    "zh": "LHI"
  },
  "city_libreville": {
    "ar": "ليبرفيل",
    "en": "Libreville",
    "es": "Libreville",
    "ru": "Либревиль",
    "tr": "Librevil",
    "uk": "Лібревіль",
    "zh": "利伯维尔"
  },
  "city_lima": {
    "ar": "ليما",
    "en": "Lima",
    "es": "Lima",
    "ru": "Лима",
    "tr": "Lima",
    "uk": "Ліма",
    "zh": "利马"
  },
  "city_lindeman": {
    "ar": "ليندمان",
    "en": "Lindeman",
    "es": "Lindeman",
    "ru": "Линдеман",
    "tr": "Lindeman",
    "uk": "Ліндеман",
    "zh": "林德曼"
  },
  "city_lisbon": {
    "ar": "لشبونة",
    "en": "Lisbon",
    "es": "Lisboa",
    "ru": "Лиссабон",
    "tr": "Lizbon",
    "uk": "Лісабон",
    "zh": "里斯本"
  },
  "city_ljubljana": {
    "ar": "ليوبليانا",
    "en": "Ljubljana",
    "es": "Liubliana",
    "ru": "Любляна",
    "tr": "Ljubljana",
    "uk": "Любляна",
    "zh": "卢布尔雅那"
  },
  "city_lome": {
    "ar": "لومي",
    "en": "Lome",
    "es": "Lomé",
    "ru": "Ломе",
    "tr": "Lome",
    "uk": "Ломе",
    "zh": "洛美"
  },
  "city_london": {
    "ar": "لندن",
    "en": "London",
    "es": "Londres",
    "ru": "Лондон",
    "tr": "Londra",
    "uk": "Лондон",
    "zh": "伦敦"
  },
  "city_longyearbyen": {
    "ar": "لونجيربين",
    "en": "Longyearbyen",
    "es": "Longyearbyen",
    "ru": "Лонгйир",
    "tr": "Longyearbyen",
    "uk": "Лонгʼїр",
    "zh": "朗伊尔城"
  },
  "city_lord_howe_island": {
    "ar": "لورد هاو",
    "en": "Lord Howe Island",
    "es": "Lord Howe Island",
    "ru": "Лорд-Хау",
    "tr": "Lord Howe Island",
    "uk": "Лорд-Хау",
    "zh": "豪勋爵岛"
  },
  "city_los_angeles": {
    "ar": "لوس انجلوس",
    "en": "Los Angeles",
    "es": "Los Ángeles",
    "ru": "Лос-Анджелес",
    "tr": "Los Angeles",
    "uk": "Лос-Анджелес",
    "zh": "洛杉矶"
  },
  "city_louisville": {
    "ar": "Louisville",
    "en": "Louisville",
    "es": "Louisville",
    "ru": "Louisville",
    "tr": "Louisville",
    "uk": "Louisville",
    "zh": "Louisville"
  },
  "city_lower_prince_s_quarter": {
    "ar": "حي الأمير السفلي",
    "en": "Lower Prince’s Quarter",
    "es": "Lower Prince’s Quarter",
    "ru": "Лоуэр-Принс-Куотер",
    "tr": "Lower Prince’s Quarter",
    "uk": "Лоуер-Принсес-Квотер",
    "zh": "下太子区"
  },
  "city_luanda": {
    "ar": "لواندا",
    "en": "Luanda",
    "es": "Luanda",
    "ru": "Луанда",
    "tr": "Luanda",
    "uk": "Луанда",
    "zh": "罗安达"
  },
  "city_lubumbashi": {
    "ar": "لومبباشا",
    "en": "Lubumbashi",
    "es": "Lubumbashi",
    "ru": "Лубумбаши",
    "tr": "Lubumbashi",
    "uk": "Лубумбаші",
    "zh": "卢本巴希"
  },
  "city_luhansk": {
    "ar": "لوهانسك",
    "en": "Luhansk",
    "es": "Lugansk",
    "ru": "Луганск",
    "tr": "Luhansk",
    "uk": "Луганськ",
    "zh": "卢甘斯克"
  },
  "city_lusaka": {
    "ar": "لوساكا",
    "en": "Lusaka",
    "es": "Lusaka",
    "ru": "Лусака",
    "tr": "Lusaka",
    "uk": "Лусака",
    "zh": "卢萨卡"
  },
  "city_lutsk": {
    "ar": "لوتسك",
    "en": "Lutsk",
    "es": "Lutsk",
    "ru": "Луцк",
    "tr": "Lutsk",
    "uk": "Луцьк",
    "zh": "卢茨克"
  },
  "city_luxembourg": {
    "ar": "لوكسمبورغ",
    "en": "Luxembourg",
    "es": "Luxemburgo",
    "ru": "Люксембург",
    "tr": "Lüksemburg",
    "uk": "Люксембург",
    "zh": "卢森堡"
  },
  "city_lviv": {
    "ar": "لفيف",
    "en": "Lviv",
    "es": "Leópolis",
    "ru": "Львов",
    "tr": "Lviv",
    "uk": "Львів",
    "zh": "利沃夫"
  },
  "city_macao": {
    "ar": "Macao",
    "en": "Macao",
    "es": "Macao",
    "ru": "Macao",
    "tr": "Macao",
    "uk": "Macao",
    "zh": "Macao"
  },
  "city_maceio": {
    "ar": "ماشيو",
    "en": "Maceio",
    "es": "Maceió",
    "ru": "Масейо",
    "tr": "Maceio",
    "uk": "Масейо",
    "zh": "马塞约"
  },
  "city_macquarie_island": {
    "ar": "ماكواري",
    "en": "Macquarie Island",
    "es": "Macquarie Island",
    "ru": "Маккуори",
    "tr": "Macquarie Island",
    "uk": "Маккуорі",
    "zh": "麦格理"
  },
  "city_madeira": {
    "ar": "ماديرا",
    "en": "Madeira",
    "es": "Madeira",
    "ru": "Мадейра",
    "tr": "Madeira Adaları",
    "uk": "Мадейра",
    "zh": "马德拉"
  },
  "city_madrid": {
    "ar": "مدريد",
    "en": "Madrid",
    "es": "Madrid",
    "ru": "Мадрид",
    "tr": "Madrid",
    "uk": "Мадрид",
    "zh": "马德里"
  },
  "city_magadan": {
    "ar": "مجادن",
    "en": "Magadan",
    "es": "Magadán",
    "ru": "Магадан",
    "tr": "Magadan",
    "uk": "Магадан",
    "zh": "马加丹"
  },
  "city_mahe": {
    "ar": "ماهي",
    "en": "Mahe",
    "es": "Mahé",
    "ru": "Маэ",
    "tr": "Mahe",
    "uk": "Махе",
    "zh": "马埃岛"
  },
  "city_majuro": {
    "ar": "ماجورو",
    "en": "Majuro",
    "es": "Majuro",
    "ru": "Маджуро",
    "tr": "Majuro",
    "uk": "Маджуро",
    "zh": "马朱罗"
  },
  "city_makassar": {
    "ar": "ماكسار",
    "en": "Makassar",
    "es": "Makasar",
    "ru": "Макасар",
    "tr": "Makassar",
    "uk": "Макассар",
    "zh": "望加锡"
  },
  "city_malabo": {
    "ar": "مالابو",
    "en": "Malabo",
    "es": "Malabo",
    "ru": "Малабо",
    "tr": "Malabo",
    "uk": "Малабо",
    "zh": "马拉博"
  },
  "city_maldives": {
    "ar": "المالديف",
    "en": "Maldives",
    "es": "Maldivas",
    "ru": "Мальдивы",
    "tr": "Maldivler",
    "uk": "Мальдіви",
    "zh": "马尔代夫"
  },
  "city_malta": {
    "ar": "مالطة",
    "en": "Malta",
    "es": "Malta",
    "ru": "Мальта",
    "tr": "Malta",
    "uk": "Мальта",
    "zh": "马耳他"
  },
  "city_managua": {
    "ar": "ماناغوا",
    "en": "Managua",
    "es": "Managua",
    "ru": "Манагуа",
    "tr": "Managua",
    "uk": "Манаґуа",
    "zh": "马那瓜"
  },
  "city_manaus": {
    "ar": "ماناوس",
    "en": "Manaus",
    "es": "Manaos",
    "ru": "Манаус",
    "tr": "Manaus",
    "uk": "Манаус",
    "zh": "马瑙斯"
  },
  "city_manila": {
    "ar": "مانيلا",
    "en": "Manila",
    "es": "Manila",
    "ru": "Манила",
    "tr": "Manila",
    "uk": "Маніла",
    "zh": "马尼拉"
  },
  "city_maputo": {
    "ar": "مابوتو",
    "en": "Maputo",
    "es": "Maputo",
    "ru": "Мапуту",
    "tr": "Maputo",
    "uk": "Мапуту",
    "zh": "马普托"
  },
  "city_marengo_indiana": {
    "ar": "مارنجو",
    "en": "Marengo, Indiana",
    "es": "Marengo, Indiana",
    "ru": "Маренго, Индиана",
    "tr": "Marengo, Indiana",
    "uk": "Маренго, Індіана",
    "zh": "印第安纳州马伦戈"
  },
  "city_mariehamn": {
    "ar": "ماريهامن",
    "en": "Mariehamn",
    "es": "Mariehamn",
    "ru": "Мариехамн",
    "tr": "Mariehamn",
    "uk": "Марієгамн",
    "zh": "玛丽港"
  },
  "city_marigot": {
    "ar": "ماريغوت",
    "en": "Marigot",
    "es": "Marigot",
    "ru": "Мариго",
    "tr": "Marigot",
    "uk": "Маріґо",
    "zh": "马里戈特"
  },
  "city_mariupol": {
    "ar": "ماريوبول",
    "en": "Mariupol",
    "es": "Mariúpol",
    "ru": "Мариуполь",
    "tr": "Mariupol",
    "uk": "Маріуполь",
    "zh": "马里乌波尔"
  },
  "city_marquesas": {
    "ar": "ماركيساس",
    "en": "Marquesas",
    "es": "Marquesas",
    "ru": "Маркизские о-ва",
    "tr": "Markiz Adaları",
    "uk": "Маркізькі острови",
    "zh": "马克萨斯"
  },
  "city_martinique": {
    "ar": "المارتينيك",
    "en": "Martinique",
    "es": "Martinica",
    "ru": "Мартиника",
    "tr": "Martinique",
    "uk": "Мартініка",
    "zh": "马提尼克"
  },
  "city_maseru": {
    "ar": "ماسيرو",
    "en": "Maseru",
    "es": "Maseru",
    "ru": "Масеру",
    "tr": "Maseru",
    "uk": "Масеру",
    "zh": "马塞卢"
  },
  "city_matamoros": {
    "ar": "ماتاموروس",
    "en": "Matamoros",
    "es": "Matamoros",
    "ru": "Матаморос",
    "tr": "Matamoros",
    "uk": "Матаморос",
    "zh": "马塔莫罗斯"
  },
  "city_mauritius": {
    "ar": "موريشيوس",
    "en": "Mauritius",
    "es": "Mauricio",
    "ru": "Маврикий",
    "tr": "Mauritius",
    "uk": "Маврикій",
    "zh": "毛里求斯"
  },
  "city_mawson": {
    "ar": "ماوسون",
    "en": "Mawson",
    "es": "Mawson",
    "ru": "Моусон",
    "tr": "Mawson",
    "uk": "Моусон",
    "zh": "莫森"
  },
  "city_mayotte": {
    "ar": "مايوت",
    "en": "Mayotte",
    "es": "Mayotte",
    "ru": "Майотта",
    "tr": "Mayotte",
    "uk": "Майотта",
    "zh": "马约特"
  },
  "city_mazatlan": {
    "ar": "مازاتلان",
    "en": "Mazatlan",
    "es": "Mazatlán",
    "ru": "Масатлан",
    "tr": "Mazatlan",
    "uk": "Масатлан",
    "zh": "马萨特兰"
  },
  "city_mbabane": {
    "ar": "مباباني",
    "en": "Mbabane",
    "es": "Mbabane",
    "ru": "Мбабане",
    "tr": "Mbabane",
    "uk": "Мбабане",
    "zh": "姆巴巴纳"
  },
  "city_mcmurdo": {
    "ar": "ماك موردو",
    "en": "McMurdo",
    "es": "McMurdo",
    "ru": "Мак-Мердо",
    "tr": "McMurdo",
    "uk": "Мак-Мердо",
    "zh": "麦克默多"
  },
  "city_melbourne": {
    "ar": "ميلبورن",
    "en": "Melbourne",
    "es": "Melbourne",
    "ru": "Мельбурн",
    "tr": "Melbourne",
    "uk": "Мельбурн",
    "zh": "墨尔本"
  },
  "city_mendoza": {
    "ar": "Mendoza",
    "en": "Mendoza",
    "es": "Mendoza",
    "ru": "Mendoza",
    "tr": "Mendoza",
    "uk": "Mendoza",
    "zh": "Mendoza"
  },
  "city_menominee": {
    "ar": "مينوميني",
    "en": "Menominee",
    "es": "Menominee",
    "ru": "Меномини",
    "tr": "Menominee",
    "uk": "Меноміні",
    "zh": "梅诺米尼"
  },
  "city_merida": {
    "ar": "ميريدا",
    "en": "Mérida",
    "es": "Mérida",
    "ru": "Мерида",
    "tr": "Merida",
    "uk": "Меріда",
    "zh": "梅里达"
  },
  "city_metlakatla": {
    "ar": "ميتلاكاتلا",
    "en": "Metlakatla",
    "es": "Metlakatla",
    "ru": "Метлакатла",
    "tr": "Metlakatla",
    "uk": "Метлакатла",
    "zh": "梅特拉卡特拉"
  },
  "city_mexico_city": {
    "ar": "مكسيكو سيتي",
    "en": "Mexico City",
    "es": "Ciudad de México",
    "ru": "Мехико",
    "tr": "Mexico City",
    "uk": "Мехіко",
    "zh": "墨西哥城"
  },
  "city_michigan": {
    "ar": "Michigan",
    "en": "Michigan",
    "es": "Michigan",
    "ru": "Michigan",
    "tr": "Michigan",
    "uk": "Michigan",
    "zh": "Michigan"
  },
  "city_midway": {
    "ar": "ميدواي",
    "en": "Midway",
    "es": "Midway",
    "ru": "о-ва Мидуэй",
    "tr": "Midway",
    "uk": "Мідвей",
    "zh": "中途岛"
  },
  "city_minsk": {
    "ar": "مينسك",
    "en": "Minsk",
    "es": "Minsk",
    "ru": "Минск",
    "tr": "Minsk",
    "uk": "Мінськ",
    "zh": "明斯克"
  },
  "city_miquelon": {
    "ar": "مكويلون",
    "en": "Miquelon",
    "es": "Miquelón",
    "ru": "Микелон",
    "tr": "Miquelon",
    "uk": "Мікелон",
    "zh": "密克隆"
  },
  "city_mogadishu": {
    "ar": "مقديشيو",
    "en": "Mogadishu",
    "es": "Mogadiscio",
    "ru": "Могадишо",
    "tr": "Mogadişu",
    "uk": "Моґадішо",
    "zh": "摩加迪沙"
  },
  "city_monaco": {
    "ar": "موناكو",
    "en": "Monaco",
    "es": "Mónaco",
    "ru": "Монако",
    "tr": "Monako",
    "uk": "Монако",
    "zh": "摩纳哥"
  },
  "city_moncton": {
    "ar": "وينكتون",
    "en": "Moncton",
    "es": "Moncton",
    "ru": "Монктон",
    "tr": "Moncton",
    "uk": "Монктон",
    "zh": "蒙克顿"
  },
  "city_monrovia": {
    "ar": "مونروفيا",
    "en": "Monrovia",
    "es": "Monrovia",
    "ru": "Монровия",
    "tr": "Monrovia",
    "uk": "Монровія",
    "zh": "蒙罗维亚"
  },
  "city_monterrey": {
    "ar": "مونتيري",
    "en": "Monterrey",
    "es": "Monterrey",
    "ru": "Монтеррей",
    "tr": "Monterrey",
    "uk": "Монтерей",
    "zh": "蒙特雷"
  },
  "city_montevideo": {
    "ar": "مونتفيديو",
    "en": "Montevideo",
    "es": "Montevideo",
    "ru": "Монтевидео",
    "tr": "Montevideo",
    "uk": "Монтевідео",
    "zh": "蒙得维的亚"
  },
  "city_monticello_kentucky": {
    "ar": "مونتيسيلو",
    "en": "Monticello, Kentucky",
    "es": "Monticello, Kentucky",
    "ru": "Монтиселло, Кентукки",
    "tr": "Monticello, Kentucky",
    "uk": "Монтіселло, Кентуккі",
    "zh": "肯塔基州蒙蒂塞洛"
  },
  "city_montreal": {
    "ar": "Montreal",
    "en": "Montreal",
    "es": "Montreal",
    "ru": "Montreal",
    "tr": "Montreal",
    "uk": "Montreal",
    "zh": "Montreal"
  },
  "city_montserrat": {
    "ar": "مونتسيرات",
    "en": "Montserrat",
    "es": "Montserrat",
    "ru": "Монтсеррат",
    "tr": "Montserrat",
    "uk": "Монтсеррат",
    "zh": "蒙特塞拉特"
  },
  "city_moscow": {
    "ar": "موسكو",
    "en": "Moscow",
    "es": "Moscú",
    "ru": "Москва",
    "tr": "Moskova",
    "uk": "Москва",
    "zh": "莫斯科"
  },
  "city_mountain": {
    "ar": "Mountain",
    "en": "Mountain",
    "es": "Mountain",
    "ru": "Mountain",
    "tr": "Mountain",
    "uk": "Mountain",
    "zh": "Mountain"
  },
  "city_muscat": {
    "ar": "مسقط",
    "en": "Muscat",
    "es": "Mascate",
    "ru": "Маскат",
    "tr": "Maskat",
    "uk": "Маскат",
    "zh": "马斯喀特"
  },
  "city_mykolaiv": {
    "ar": "ميكولايف",
    "en": "Mykolaiv",
    "es": "Mykolaiv",
    "ru": "Николаев",
    "tr": "Mıkolayiv",
    "uk": "Миколаїв",
    "zh": "尼古拉耶夫"
  },
  "city_mykolayiv": {
    "ar": "ميكولايف",
    "en": "Mykolaiv",
    "es": "Mykolaiv",
    "ru": "Николаев",
    "tr": "Mıkolayiv",
    "uk": "Миколаїв",
    "zh": "尼古拉耶夫"
  },
  "city_nairobi": {
    "ar": "نيروبي",
    "en": "Nairobi",
    "es": "Nairobi",
    "ru": "Найроби",
    "tr": "Nairobi",
    "uk": "Найробі",
    "zh": "内罗毕"
  },
  "city_nassau": {
    "ar": "ناسو",
    "en": "Nassau",
    "es": "Nassau",
    "ru": "Нассау",
    "tr": "Nassau",
    "uk": "Насау",
    "zh": "拿骚"
  },
  "city_nauru": {
    "ar": "ناورو",
    "en": "Nauru",
    "es": "Nauru",
    "ru": "Науру",
    "tr": "Nauru",
    "uk": "Науру",
    "zh": "瑙鲁"
  },
  "city_ndjamena": {
    "ar": "نجامينا",
    "en": "Ndjamena",
    "es": "Yamena",
    "ru": "Нджамена",
    "tr": "Ndjamena",
    "uk": "Нджамена",
    "zh": "恩贾梅纳"
  },
  "city_new_salem_north_dakota": {
    "ar": "نيو ساليم",
    "en": "New Salem, North Dakota",
    "es": "New Salem, Dakota del Norte",
    "ru": "Нью-Сейлем, Северная Дакота",
    "tr": "New Salem, Kuzey Dakota",
    "uk": "Нью-Салем, Північна Дакота",
    "zh": "北达科他州新塞勒姆"
  },
  "city_new_york": {
    "ar": "نيويورك",
    "en": "New York",
    "es": "Nueva York",
    "ru": "Нью-Йорк",
    "tr": "New York",
    "uk": "Нью-Йорк",
    "zh": "纽约"
  },
  "city_newfoundland": {
    "ar": "Newfoundland",
    "en": "Newfoundland",
    "es": "Newfoundland",
    "ru": "Newfoundland",
    "tr": "Newfoundland",
    "uk": "Newfoundland",
    "zh": "Newfoundland"
  },
  "city_niamey": {
    "ar": "نيامي",
    "en": "Niamey",
    "es": "Niamey",
    "ru": "Ниамей",
    "tr": "Niamey",
    "uk": "Ніамей",
    "zh": "尼亚美"
  },
  "city_nicosia": {
    "ar": "نيقوسيا",
    "en": "Nicosia",
    "es": "Nicosia",
    "ru": "Никосия",
    "tr": "Lefkoşa",
    "uk": "Нікосія",
    "zh": "尼科西亚"
  },
  "city_nikolayev": {
    "ar": "ميكولايف",
    "en": "Mykolaiv",
    "es": "Mykolaiv",
    "ru": "Николаев",
    "tr": "Mıkolayiv",
    "uk": "Миколаїв",
    "zh": "尼古拉耶夫"
  },
  "city_nipigon": {
    "ar": "Nipigon",
    "en": "Nipigon",
    "es": "Nipigon",
    "ru": "Nipigon",
    "tr": "Nipigon",
    "uk": "Nipigon",
    "zh": "Nipigon"
  },
  "city_niue": {
    "ar": "نيوي",
    "en": "Niue",
    "es": "Niue",
    "ru": "Ниуэ",
    "tr": "Niue",
    "uk": "Ніуе",
    "zh": "纽埃"
  },
  "city_nome": {
    "ar": "نوم",
    "en": "Nome",
    "es": "Nome",
    "ru": "Ном",
    "tr": "Nome",
    "uk": "Ном",
    "zh": "诺姆"
  },
  "city_norfolk_island": {
    "ar": "نورفولك",
    "en": "Norfolk Island",
    "es": "Norfolk Island",
    "ru": "Норфолк",
    "tr": "Norfolk Island",
    "uk": "Норфолк",
    "zh": "诺福克"
  },
  "city_north": {
    "ar": "North",
    "en": "North",
    "es": "North",
    "ru": "North",
    "tr": "North",
    "uk": "North",
    "zh": "North"
  },
  "city_nouakchott": {
    "ar": "نواكشوط",
    "en": "Nouakchott",
    "es": "Nuakchot",
    "ru": "Нуакшот",
    "tr": "Nouakchott",
    "uk": "Нуакшотт",
    "zh": "努瓦克肖特"
  },
  "city_noumea": {
    "ar": "نوميا",
    "en": "Noumea",
    "es": "Numea",
    "ru": "Нумеа",
    "tr": "Noumea",
    "uk": "Нумеа",
    "zh": "努美阿"
  },
  "city_novokuznetsk": {
    "ar": "نوفوكوزنتسك",
    "en": "Novokuznetsk",
    "es": "Novokuznetsk",
    "ru": "Новокузнецк",
    "tr": "Novokuznetsk",
    "uk": "Новокузнецьк",
    "zh": "新库兹涅茨克"
  },
  "city_novosibirsk": {
    "ar": "نوفوسبيرسك",
    "en": "Novosibirsk",
    "es": "Novosibirsk",
    "ru": "Новосибирск",
    "tr": "Novosibirsk",
    "uk": "Новосибірськ",
    "zh": "新西伯利亚"
  },
  "city_nsw": {
    "ar": "NSW",
    "en": "NSW",
    "es": "NSW",
    "ru": "NSW",
    "tr": "NSW",
    "uk": "NSW",
    "zh": "NSW"
  },
  "city_nuuk": {
    "ar": "غودثاب",
    "en": "Nuuk",
    "es": "Nuuk",
    "ru": "Нуук",
    "tr": "Nuuk",
    "uk": "Нуук",
    "zh": "努克"
  },
  "city_odesa": {
    "ar": "أوديسا",
    "en": "Odesa",
    "es": "Odesa",
    "ru": "Одесса",
    "tr": "Odesa",
    "uk": "Одеса",
    "zh": "敖德萨"
  },
  "city_odessa": {
    "ar": "أوديسا",
    "en": "Odesa",
    "es": "Odesa",
    "ru": "Одесса",
    "tr": "Odesa",
    "uk": "Одеса",
    "zh": "敖德萨"
  },
  "city_ojinaga": {
    "ar": "أوجيناجا",
    "en": "Ojinaga",
    "es": "Ojinaga",
    "ru": "Охинага",
    "tr": "Ojinaga",
    "uk": "Охінаґа",
    "zh": "奥希纳加"
  },
  "city_omsk": {
    "ar": "أومسك",
    "en": "Omsk",
    "es": "Omsk",
    "ru": "Омск",
    "tr": "Omsk",
    "uk": "Омськ",
    "zh": "鄂木斯克"
  },
  "city_oral": {
    "ar": "أورال",
    "en": "Oral",
    "es": "Oral",
    "ru": "Уральск",
    "tr": "Oral",
    "uk": "Орал",
    "zh": "乌拉尔"
  },
  "city_oslo": {
    "ar": "أوسلو",
    "en": "Oslo",
    "es": "Oslo",
    "ru": "Осло",
    "tr": "Oslo",
    "uk": "Осло",
    "zh": "奥斯陆"
  },
  "city_ouagadougou": {
    "ar": "واغادوغو",
    "en": "Ouagadougou",
    "es": "Uagadugú",
    "ru": "Уагадугу",
    "tr": "Ouagadougou",
    "uk": "Уаґадуґу",
    "zh": "瓦加杜古"
  },
  "city_pacific": {
    "ar": "Pacific",
    "en": "Pacific",
    "es": "Pacific",
    "ru": "Pacific",
    "tr": "Pacific",
    "uk": "Pacific",
    "zh": "Pacific"
  },
  "city_pago_pago": {
    "ar": "باغو باغو",
    "en": "Pago Pago",
    "es": "Pago Pago",
    "ru": "Паго-Паго",
    "tr": "Pago Pago",
    "uk": "Паго-Паго",
    "zh": "帕果帕果"
  },
  "city_palau": {
    "ar": "بالاو",
    "en": "Palau",
    "es": "Palaos",
    "ru": "Палау",
    "tr": "Palau",
    "uk": "Палау",
    "zh": "帕劳"
  },
  "city_palmer": {
    "ar": "بالمير",
    "en": "Palmer",
    "es": "Palmer",
    "ru": "Палмер",
    "tr": "Palmer",
    "uk": "Палмер",
    "zh": "帕尔默"
  },
  "city_panama": {
    "ar": "بنما",
    "en": "Panama",
    "es": "Panamá",
    "ru": "Панама",
    "tr": "Panama",
    "uk": "Панама",
    "zh": "巴拿马"
  },
  "city_pangnirtung": {
    "ar": "Pangnirtung",
    "en": "Pangnirtung",
    "es": "Pangnirtung",
    "ru": "Pangnirtung",
    "tr": "Pangnirtung",
    "uk": "Pangnirtung",
    "zh": "Pangnirtung"
  },
  "city_paramaribo": {
    "ar": "باراماريبو",
    "en": "Paramaribo",
    "es": "Paramaribo",
    "ru": "Парамарибо",
    "tr": "Paramaribo",
    "uk": "Парамарибо",
    "zh": "帕拉马里博"
  },
  "city_paris": {
    "ar": "باريس",
    "en": "Paris",
    "es": "París",
    "ru": "Париж",
    "tr": "Paris",
    "uk": "Париж",
    "zh": "巴黎"
  },
  "city_perth": {
    "ar": "برثا",
    "en": "Perth",
    "es": "Perth",
    "ru": "Перт",
    "tr": "Perth",
    "uk": "Перт",
    "zh": "珀斯"
  },
  "city_petersburg_indiana": {
    "ar": "بيترسبرغ",
    "en": "Petersburg, Indiana",
    "es": "Petersburg, Indiana",
    "ru": "Питерсберг, Индиана",
    "tr": "Petersburg, Indiana",
    "uk": "Пітерсберг, Індіана",
    "zh": "印第安纳州彼得斯堡"
  },
  "city_phnom_penh": {
    "ar": "بنوم بنه",
    "en": "Phnom Penh",
    "es": "Phnom Penh",
    "ru": "Пномпень",
    "tr": "Phnom Penh",
    "uk": "Пномпень",
    "zh": "金边"
  },
  "city_phoenix": {
    "ar": "فينكس",
    "en": "Phoenix",
    "es": "Phoenix",
    "ru": "Финикс",
    "tr": "Phoenix",
    "uk": "Фінікс",
    "zh": "凤凰城"
  },
  "city_pitcairn": {
    "ar": "بيتكيرن",
    "en": "Pitcairn",
    "es": "Pitcairn",
    "ru": "Питкэрн",
    "tr": "Pitcairn",
    "uk": "Піткерн",
    "zh": "皮特凯恩"
  },
  "city_podgorica": {
    "ar": "بودغوريكا",
    "en": "Podgorica",
    "es": "Podgorica",
    "ru": "Подгорица",
    "tr": "Podgorica",
    "uk": "Подгориця",
    "zh": "波德戈里察"
  },
  "city_pohnpei": {
    "ar": "Pohnpei",
    "en": "Pohnpei",
    "es": "Pohnpei",
    "ru": "Pohnpei",
    "tr": "Pohnpei",
    "uk": "Pohnpei",
    "zh": "Pohnpei"
  },
  "city_poltava": {
    "ar": "بولتافا",
    "en": "Poltava",
    "es": "Poltava",
    "ru": "Полтава",
    "tr": "Poltava",
    "uk": "Полтава",
    "zh": "波尔塔瓦"
  },
  "city_pontianak": {
    "ar": "بونتيانك",
    "en": "Pontianak",
    "es": "Pontianak",
    "ru": "Понтианак",
    "tr": "Pontianak",
    "uk": "Понтіанак",
    "zh": "坤甸"
  },
  "city_port_au_prince": {
    "ar": "بورت أو برنس",
    "en": "Port-au-Prince",
    "es": "Puerto Príncipe",
    "ru": "Порт-о-Пренс",
    "tr": "Port-au-Prince",
    "uk": "Порт-о-Пренс",
    "zh": "太子港"
  },
  "city_port_moresby": {
    "ar": "بور مورسبي",
    "en": "Port Moresby",
    "es": "Port Moresby",
    "ru": "Порт-Морсби",
    "tr": "Port Moresby",
    "uk": "Порт-Морсбі",
    "zh": "莫尔兹比港"
  },
  "city_port_of_spain": {
    "ar": "بورت أوف سبين",
    "en": "Port of Spain",
    "es": "Puerto España",
    "ru": "Порт-оф-Спейн",
    "tr": "Port of Spain",
    "uk": "Порт-оф-Спейн",
    "zh": "西班牙港"
  },
  "city_porto_acre": {
    "ar": "Porto Acre",
    "en": "Porto Acre",
    "es": "Porto Acre",
    "ru": "Porto Acre",
    "tr": "Porto Acre",
    "uk": "Porto Acre",
    "zh": "Porto Acre"
  },
  "city_porto_novo": {
    "ar": "بورتو نوفو",
    "en": "Porto-Novo",
    "es": "Portonovo",
    "ru": "Порто-Ново",
    "tr": "Porto-Novo",
    "uk": "Порто-Ново",
    "zh": "波多诺伏"
  },
  "city_porto_velho": {
    "ar": "بورتو فيلو",
    "en": "Porto Velho",
    "es": "Porto Velho",
    "ru": "Порту-Велью",
    "tr": "Porto Velho",
    "uk": "Порту-Велью",
    "zh": "波多韦柳"
  },
  "city_prague": {
    "ar": "براغ",
    "en": "Prague",
    "es": "Praga",
    "ru": "Прага",
    "tr": "Prag",
    "uk": "Прага",
    "zh": "布拉格"
  },
  "city_puerto_rico": {
    "ar": "بورتوريكو",
    "en": "Puerto Rico",
    "es": "Puerto Rico",
    "ru": "Пуэрто-Рико",
    "tr": "Porto Riko",
    "uk": "Пуерто-Ріко",
    "zh": "波多黎各"
  },
  "city_punta_arenas": {
    "ar": "بونتا أريناز",
    "en": "Punta Arenas",
    "es": "Punta Arenas",
    "ru": "Пунта-Аренас",
    "tr": "Punta Arenas",
    "uk": "Пунта-Аренас",
    "zh": "蓬塔阿雷纳斯"
  },
  "city_pyongyang": {
    "ar": "بيونغ يانغ",
    "en": "Pyongyang",
    "es": "Pyongyang",
    "ru": "Пхеньян",
    "tr": "Pyongyang",
    "uk": "Пхеньян",
    "zh": "平壤"
  },
  "city_qatar": {
    "ar": "قطر",
    "en": "Qatar",
    "es": "Catar",
    "ru": "Катар",
    "tr": "Katar",
    "uk": "Катар",
    "zh": "卡塔尔"
  },
  "city_queensland": {
    "ar": "Queensland",
    "en": "Queensland",
    "es": "Queensland",
    "ru": "Queensland",
    "tr": "Queensland",
    "uk": "Queensland",
    "zh": "Queensland"
  },
  "city_qyzylorda": {
    "ar": "كيزيلوردا",
    "en": "Qyzylorda",
    "es": "Kyzylorda",
    "ru": "Кызылорда",
    "tr": "Kızılorda",
    "uk": "Кизилорда",
    "zh": "克孜洛尔达"
  },
  "city_rainy_river": {
    "ar": "Rainy River",
    "en": "Rainy River",
    "es": "Rainy River",
    "ru": "Rainy River",
    "tr": "Rainy River",
    "uk": "Rainy River",
    "zh": "Rainy River"
  },
  "city_rankin_inlet": {
    "ar": "رانكن انلت",
    "en": "Rankin Inlet",
    "es": "Rankin Inlet",
    "ru": "Ранкин-Инлет",
    "tr": "Rankin Inlet",
    "uk": "Ренкін-Інлет",
    "zh": "兰今湾"
  },
  "city_rarotonga": {
    "ar": "راروتونغا",
    "en": "Rarotonga",
    "es": "Rarotonga",
    "ru": "Раротонга",
    "tr": "Rarotonga",
    "uk": "Раротонга",
    "zh": "拉罗汤加"
  },
  "city_recife": {
    "ar": "ريسيف",
    "en": "Recife",
    "es": "Recife",
    "ru": "Ресифи",
    "tr": "Recife",
    "uk": "Ресіфі",
    "zh": "累西腓"
  },
  "city_regina": {
    "ar": "ريجينا",
    "en": "Regina",
    "es": "Regina",
    "ru": "Реджайна",
    "tr": "Regina",
    "uk": "Реджайна",
    "zh": "里贾纳"
  },
  "city_resolute": {
    "ar": "ريزولوت",
    "en": "Resolute",
    "es": "Resolute",
    "ru": "Резольют",
    "tr": "Resolute",
    "uk": "Резольют",
    "zh": "雷索卢特"
  },
  "city_reunion": {
    "ar": "ريونيون",
    "en": "Réunion",
    "es": "Reunión",
    "ru": "Реюньон",
    "tr": "Réunion",
    "uk": "Реюньйон",
    "zh": "留尼汪"
  },
  "city_reykjavik": {
    "ar": "ريكيافيك",
    "en": "Reykjavik",
    "es": "Reikiavik",
    "ru": "Рейкьявик",
    "tr": "Reykjavik",
    "uk": "Рейкʼявік",
    "zh": "雷克雅未克"
  },
  "city_riga": {
    "ar": "ريغا",
    "en": "Riga",
    "es": "Riga",
    "ru": "Рига",
    "tr": "Riga",
    "uk": "Рига",
    "zh": "里加"
  },
  "city_rio_branco": {
    "ar": "ريوبرانكو",
    "en": "Rio Branco",
    "es": "Río Branco",
    "ru": "Риу-Бранку",
    "tr": "Rio Branco",
    "uk": "Ріо-Бранко",
    "zh": "里奥布郎库"
  },
  "city_rio_gallegos": {
    "ar": "ريو جالييوس",
    "en": "Rio Gallegos",
    "es": "Río Gallegos",
    "ru": "Рио-Гальегос",
    "tr": "Rio Gallegos",
    "uk": "Ріо-Ґальєґос",
    "zh": "里奥加耶戈斯"
  },
  "city_rivne": {
    "ar": "ريفنه",
    "en": "Rivne",
    "es": "Rivne",
    "ru": "Ровно",
    "tr": "Rivne",
    "uk": "Рівне",
    "zh": "罗夫诺"
  },
  "city_riyadh": {
    "ar": "الرياض",
    "en": "Riyadh",
    "es": "Riad",
    "ru": "Эр-Рияд",
    "tr": "Riyad",
    "uk": "Ер-Ріяд",
    "zh": "利雅得"
  },
  "city_rome": {
    "ar": "روما",
    "en": "Rome",
    "es": "Roma",
    "ru": "Рим",
    "tr": "Roma",
    "uk": "Рим",
    "zh": "罗马"
  },
  "city_rosario": {
    "ar": "Rosario",
    "en": "Rosario",
    "es": "Rosario",
    "ru": "Rosario",
    "tr": "Rosario",
    "uk": "Rosario",
    "zh": "Rosario"
  },
  "city_rothera": {
    "ar": "روثيرا",
    "en": "Rothera",
    "es": "Rothera",
    "ru": "Ротера",
    "tr": "Rothera",
    "uk": "Ротера",
    "zh": "罗瑟拉"
  },
  "city_rovno": {
    "ar": "ريفنه",
    "en": "Rivne",
    "es": "Rivne",
    "ru": "Ровно",
    "tr": "Rivne",
    "uk": "Рівне",
    "zh": "罗夫诺"
  },
  "city_saipan": {
    "ar": "سايبان",
    "en": "Saipan",
    "es": "Saipán",
    "ru": "Сайпан",
    "tr": "Saipan",
    "uk": "Сайпан",
    "zh": "塞班"
  },
  "city_sakhalin": {
    "ar": "سكالين",
    "en": "Sakhalin",
    "es": "Sajalín",
    "ru": "о-в Сахалин",
    "tr": "Sahalin",
    "uk": "Сахалін",
    "zh": "萨哈林"
  },
  "city_salta": {
    "ar": "سالطا",
    "en": "Salta",
    "es": "Salta",
    "ru": "Сальта",
    "tr": "Salta",
    "uk": "Сальта",
    "zh": "萨尔塔"
  },
  "city_samara": {
    "ar": "سمراء",
    "en": "Samara",
    "es": "Samara",
    "ru": "Самара",
    "tr": "Samara",
    "uk": "Самара",
    "zh": "萨马拉"
  },
  "city_samarkand": {
    "ar": "سمرقند",
    "en": "Samarkand",
    "es": "Samarcanda",
    "ru": "Самарканд",
    "tr": "Semerkand",
    "uk": "Самарканд",
    "zh": "撒马尔罕"
  },
  "city_samoa": {
    "ar": "Samoa",
    "en": "Samoa",
    "es": "Samoa",
    "ru": "Samoa",
    "tr": "Samoa",
    "uk": "Samoa",
    "zh": "Samoa"
  },
  "city_san_juan": {
    "ar": "سان خوان",
    "en": "San Juan",
    "es": "San Juan",
    "ru": "Сан-Хуан",
    "tr": "San Juan",
    "uk": "Сан-Хуан",
    "zh": "圣胡安"
  },
  "city_san_luis": {
    "ar": "سان لويس",
    "en": "San Luis",
    "es": "San Luis",
    "ru": "Сан-Луис",
    "tr": "San Luis",
    "uk": "Сан-Луїс",
    "zh": "圣路易斯"
  },
  "city_san_marino": {
    "ar": "سان مارينو",
    "en": "San Marino",
    "es": "San Marino",
    "ru": "Сан-Марино",
    "tr": "San Marino",
    "uk": "Сан-Марино",
    "zh": "圣马力诺"
  },
  "city_santa_isabel": {
    "ar": "Santa Isabel",
    "en": "Santa Isabel",
    "es": "Santa Isabel",
    "ru": "Santa Isabel",
    "tr": "Santa Isabel",
    "uk": "Santa Isabel",
    "zh": "Santa Isabel"
  },
  "city_santarem": {
    "ar": "سانتاريم",
    "en": "Santarem",
    "es": "Santarém",
    "ru": "Сантарен",
    "tr": "Santarem",
    "uk": "Сантарен",
    "zh": "圣塔伦"
  },
  "city_santiago": {
    "ar": "سانتياغو",
    "en": "Santiago",
    "es": "Santiago de Chile",
    "ru": "Сантьяго",
    "tr": "Santiago",
    "uk": "Сантьяґо",
    "zh": "圣地亚哥"
  },
  "city_santo_domingo": {
    "ar": "سانتو دومينغو",
    "en": "Santo Domingo",
    "es": "Santo Domingo",
    "ru": "Санто-Доминго",
    "tr": "Santo Domingo",
    "uk": "Санто-Домінґо",
    "zh": "圣多明各"
  },
  "city_sao_paulo": {
    "ar": "ساو باولو",
    "en": "Sao Paulo",
    "es": "São Paulo",
    "ru": "Сан-Паулу",
    "tr": "Sao Paulo",
    "uk": "Сан-Паулу",
    "zh": "圣保罗"
  },
  "city_sao_tome": {
    "ar": "ساو تومي",
    "en": "São Tomé",
    "es": "Santo Tomé",
    "ru": "Сан-Томе",
    "tr": "São Tomé",
    "uk": "Сан-Томе",
    "zh": "圣多美"
  },
  "city_sarajevo": {
    "ar": "سراييفو",
    "en": "Sarajevo",
    "es": "Sarajevo",
    "ru": "Сараево",
    "tr": "Saraybosna",
    "uk": "Сараєво",
    "zh": "萨拉热窝"
  },
  "city_saratov": {
    "ar": "ساراتوف",
    "en": "Saratov",
    "es": "Sarátov",
    "ru": "Саратов",
    "tr": "Saratov",
    "uk": "Саратов",
    "zh": "萨拉托夫"
  },
  "city_saskatchewan": {
    "ar": "Saskatchewan",
    "en": "Saskatchewan",
    "es": "Saskatchewan",
    "ru": "Saskatchewan",
    "tr": "Saskatchewan",
    "uk": "Saskatchewan",
    "zh": "Saskatchewan"
  },
  "city_seoul": {
    "ar": "سول",
    "en": "Seoul",
    "es": "Seúl",
    "ru": "Сеул",
    "tr": "Seul",
    "uk": "Сеул",
    "zh": "首尔"
  },
  "city_sevastopol": {
    "ar": "سيفاستوبول",
    "en": "Sevastopol",
    "es": "Sebastopol",
    "ru": "Севастополь",
    "tr": "Sivastopol",
    "uk": "Севастополь",
    "zh": "塞瓦斯托波尔"
  },
  "city_shanghai": {
    "ar": "شنغهاي",
    "en": "Shanghai",
    "es": "Shanghái",
    "ru": "Шанхай",
    "tr": "Şanghay",
    "uk": "Шанхай",
    "zh": "上海"
  },
  "city_shiprock": {
    "ar": "Shiprock",
    "en": "Shiprock",
    "es": "Shiprock",
    "ru": "Shiprock",
    "tr": "Shiprock",
    "uk": "Shiprock",
    "zh": "Shiprock"
  },
  "city_simferopol": {
    "ar": "سيمفروبول",
    "en": "Simferopol",
    "es": "Simferópol",
    "ru": "Симферополь",
    "tr": "Simferopol",
    "uk": "Сімферополь",
    "zh": "辛菲罗波尔"
  },
  "city_singapore": {
    "ar": "سنغافورة",
    "en": "Singapore",
    "es": "Singapur",
    "ru": "Сингапур",
    "tr": "Singapur",
    "uk": "Сінгапур",
    "zh": "新加坡"
  },
  "city_sitka": {
    "ar": "سيتكا",
    "en": "Sitka",
    "es": "Sitka",
    "ru": "Ситка",
    "tr": "Sitka",
    "uk": "Сітка",
    "zh": "锡特卡"
  },
  "city_skopje": {
    "ar": "سكوبي",
    "en": "Skopje",
    "es": "Skopie",
    "ru": "Скопье",
    "tr": "Üsküp",
    "uk": "Скопʼє",
    "zh": "斯科普里"
  },
  "city_sofia": {
    "ar": "صوفيا",
    "en": "Sofia",
    "es": "Sofía",
    "ru": "София",
    "tr": "Sofya",
    "uk": "Софія",
    "zh": "索非亚"
  },
  "city_south": {
    "ar": "South",
    "en": "South",
    "es": "South",
    "ru": "South",
    "tr": "South",
    "uk": "South",
    "zh": "South"
  },
  "city_south_georgia": {
    "ar": "جورجيا الجنوبية",
    "en": "South Georgia",
    "es": "Georgia del Sur",
    "ru": "Южная Георгия",
    "tr": "Güney Georgia",
    "uk": "Південна Джорджія",
    "zh": "南乔治亚"
  },
  "city_south_pole": {
    "ar": "South Pole",
    "en": "South Pole",
    "es": "South Pole",
    "ru": "South Pole",
    "tr": "South Pole",
    "uk": "South Pole",
    "zh": "South Pole"
  },
  "city_srednekolymsk": {
    "ar": "سريدنكوليمسك",
    "en": "Srednekolymsk",
    "es": "Srednekolimsk",
    "ru": "Среднеколымск",
    "tr": "Srednekolymsk",
    "uk": "Середньоколимськ",
    "zh": "中科雷姆斯克"
  },
  "city_st_barthelemy": {
    "ar": "سانت بارتيليمي",
    "en": "St. Barthélemy",
    "es": "San Bartolomé",
    "ru": "Сен-Бартелеми",
    "tr": "Saint Barthelemy",
    "uk": "Сен-Бартелемі",
    "zh": "圣巴泰勒米岛"
  },
  "city_st_helena": {
    "ar": "سانت هيلينا",
    "en": "St. Helena",
    "es": "Santa Elena",
    "ru": "о-в Святой Елены",
    "tr": "St. Helena",
    "uk": "Острів Святої Єлени",
    "zh": "圣赫勒拿"
  },
  "city_st_john_s": {
    "ar": "سانت جونس",
    "en": "St. John’s",
    "es": "San Juan de Terranova",
    "ru": "Сент-Джонс",
    "tr": "St. John’s",
    "uk": "Сент-Джонс",
    "zh": "圣约翰斯"
  },
  "city_st_kitts": {
    "ar": "سانت كيتس",
    "en": "St. Kitts",
    "es": "San Cristóbal",
    "ru": "Сент-Китс",
    "tr": "St. Kitts",
    "uk": "Сент-Кіттс",
    "zh": "圣基茨"
  },
  "city_st_lucia": {
    "ar": "سانت لوشيا",
    "en": "St. Lucia",
    "es": "Santa Lucía",
    "ru": "Сент-Люсия",
    "tr": "St. Lucia",
    "uk": "Сент-Люсія",
    "zh": "圣卢西亚"
  },
  "city_st_thomas": {
    "ar": "سانت توماس",
    "en": "St. Thomas",
    "es": "St. Thomas",
    "ru": "Сент-Томас",
    "tr": "St. Thomas",
    "uk": "Сент-Томас",
    "zh": "圣托马斯"
  },
  "city_st_vincent": {
    "ar": "سانت فنسنت",
    "en": "St. Vincent",
    "es": "San Vicente",
    "ru": "Сент-Винсент",
    "tr": "St. Vincent",
    "uk": "Сент-Вінсент",
    "zh": "圣文森特"
  },
  "city_stanley": {
    "ar": "استانلي",
    "en": "Stanley",
    "es": "Stanley",
    "ru": "Стэнли",
    "tr": "Stanley",
    "uk": "Стенлі",
    "zh": "斯坦利"
  },
  "city_stockholm": {
    "ar": "ستوكهولم",
    "en": "Stockholm",
    "es": "Estocolmo",
    "ru": "Стокгольм",
    "tr": "Stokholm",
    "uk": "Стокгольм",
    "zh": "斯德哥尔摩"
  },
  "city_sumy": {
    "ar": "سومي",
    "en": "Sumy",
    "es": "Sumy",
    "ru": "Сумы",
    "tr": "Sumı",
    "uk": "Суми",
    "zh": "苏梅"
  },
  "city_swift_current": {
    "ar": "سوفت كارنت",
    "en": "Swift Current",
    "es": "Swift Current",
    "ru": "Свифт-Керрент",
    "tr": "Swift Current",
    "uk": "Свіфт-Каррент",
    "zh": "斯威夫特卡伦特"
  },
  "city_sydney": {
    "ar": "سيدني",
    "en": "Sydney",
    "es": "Sídney",
    "ru": "Сидней",
    "tr": "Sidney",
    "uk": "Сідней",
    "zh": "悉尼"
  },
  "city_syowa": {
    "ar": "سايووا",
    "en": "Syowa",
    "es": "Syowa",
    "ru": "Сёва",
    "tr": "Showa",
    "uk": "Сьова",
    "zh": "昭和"
  },
  "city_tahiti": {
    "ar": "تاهيتي",
    "en": "Tahiti",
    "es": "Tahití",
    "ru": "Таити",
    "tr": "Tahiti",
    "uk": "Таїті",
    "zh": "塔希提"
  },
  "city_taipei": {
    "ar": "تايبيه",
    "en": "Taipei",
    "es": "Taipéi",
    "ru": "Тайбэй",
    "tr": "Taipei",
    "uk": "Тайбей",
    "zh": "台北"
  },
  "city_tallinn": {
    "ar": "تالين",
    "en": "Tallinn",
    "es": "Tallin",
    "ru": "Таллин",
    "tr": "Tallinn",
    "uk": "Таллінн",
    "zh": "塔林"
  },
  "city_tarawa": {
    "ar": "تاراوا",
    "en": "Tarawa",
    "es": "Tarawa",
    "ru": "Тарава",
    "tr": "Tarawa",
    "uk": "Тарава",
    "zh": "塔拉瓦"
  },
  "city_tashkent": {
    "ar": "طشقند",
    "en": "Tashkent",
    "es": "Taskent",
    "ru": "Ташкент",
    "tr": "Taşkent",
    "uk": "Ташкент",
    "zh": "塔什干"
  },
  "city_tasmania": {
    "ar": "Tasmania",
    "en": "Tasmania",
    "es": "Tasmania",
    "ru": "Tasmania",
    "tr": "Tasmania",
    "uk": "Tasmania",
    "zh": "Tasmania"
  },
  "city_tbilisi": {
    "ar": "تبليسي",
    "en": "Tbilisi",
    "es": "Tiflis",
    "ru": "Тбилиси",
    "tr": "Tiflis",
    "uk": "Тбілісі",
    "zh": "第比利斯"
  },
  "city_tegucigalpa": {
    "ar": "تيغوسيغالبا",
    "en": "Tegucigalpa",
    "es": "Tegucigalpa",
    "ru": "Тегусигальпа",
    "tr": "Tegucigalpa",
    "uk": "Теґусіґальпа",
    "zh": "特古西加尔巴"
  },
  "city_tehran": {
    "ar": "طهران",
    "en": "Tehran",
    "es": "Teherán",
    "ru": "Тегеран",
    "tr": "Tahran",
    "uk": "Тегеран",
    "zh": "德黑兰"
  },
  "city_tel_aviv": {
    "ar": "Tel Aviv",
    "en": "Tel Aviv",
    "es": "Tel Aviv",
    "ru": "Tel Aviv",
    "tr": "Tel Aviv",
    "uk": "Tel Aviv",
    "zh": "Tel Aviv"
  },
  "city_tell_city_indiana": {
    "ar": "مدينة تل، إنديانا",
    "en": "Tell City, Indiana",
    "es": "Tell City, Indiana",
    "ru": "Телл-Сити",
    "tr": "Tell City, Indiana",
    "uk": "Телл-Сіті, Індіана",
    "zh": "印第安纳州特尔城"
  },
  "city_ternopil": {
    "ar": "تيرنوبل",
    "en": "Ternopil",
    "es": "Ternópil",
    "ru": "Тернополь",
    "tr": "Ternopil",
    "uk": "Тернопіль",
    "zh": "捷尔诺波尔"
  },
  "city_thimbu": {
    "ar": "Thimbu",
    "en": "Thimbu",
    "es": "Thimbu",
    "ru": "Thimbu",
    "tr": "Thimbu",
    "uk": "Thimbu",
    "zh": "Thimbu"
  },
  "city_thimphu": {
    "ar": "تيمفو",
    "en": "Thimphu",
    "es": "Timbu",
    "ru": "Тхимпху",
    "tr": "Thimphu",
    "uk": "Тхімпху",
    "zh": "廷布"
  },
  "city_thule": {
    "ar": "ثيل",
    "en": "Thule",
    "es": "Thule",
    "ru": "Туле",
    "tr": "Thule",
    "uk": "Туле",
    "zh": "图勒"
  },
  "city_thunder_bay": {
    "ar": "Thunder Bay",
    "en": "Thunder Bay",
    "es": "Thunder Bay",
    "ru": "Thunder Bay",
    "tr": "Thunder Bay",
    "uk": "Thunder Bay",
    "zh": "Thunder Bay"
  },
  "city_tijuana": {
    "ar": "تيخوانا",
    "en": "Tijuana",
    "es": "Tijuana",
    "ru": "Тихуана",
    "tr": "Tijuana",
    "uk": "Тіхуана",
    "zh": "蒂华纳"
  },
  "city_timbuktu": {
    "ar": "Timbuktu",
    "en": "Timbuktu",
    "es": "Timbuktu",
    "ru": "Timbuktu",
    "tr": "Timbuktu",
    "uk": "Timbuktu",
    "zh": "Timbuktu"
  },
  "city_tirane": {
    "ar": "تيرانا",
    "en": "Tirane",
    "es": "Tirana",
    "ru": "Тирана",
    "tr": "Tiran",
    "uk": "Тирана",
    "zh": "地拉那"
  },
  "city_tiraspol": {
    "ar": "Tiraspol",
    "en": "Tiraspol",
    "es": "Tiraspol",
    "ru": "Tiraspol",
    "tr": "Tiraspol",
    "uk": "Tiraspol",
    "zh": "Tiraspol"
  },
  "city_tokyo": {
    "ar": "طوكيو",
    "en": "Tokyo",
    "es": "Tokio",
    "ru": "Токио",
    "tr": "Tokyo",
    "uk": "Токіо",
    "zh": "东京"
  },
  "city_tomsk": {
    "ar": "تومسك",
    "en": "Tomsk",
    "es": "Tomsk",
    "ru": "Томск",
    "tr": "Tomsk",
    "uk": "Томськ",
    "zh": "托木斯克"
  },
  "city_tongatapu": {
    "ar": "تونغاتابو",
    "en": "Tongatapu",
    "es": "Tongatapu",
    "ru": "Тонгатапу",
    "tr": "Tongatapu",
    "uk": "Тонгатапу",
    "zh": "东加塔布"
  },
  "city_toronto": {
    "ar": "تورونتو",
    "en": "Toronto",
    "es": "Toronto",
    "ru": "Торонто",
    "tr": "Toronto",
    "uk": "Торонто",
    "zh": "多伦多"
  },
  "city_tortola": {
    "ar": "تورتولا",
    "en": "Tortola",
    "es": "Tórtola",
    "ru": "Тортола",
    "tr": "Tortola",
    "uk": "Тортола",
    "zh": "托尔托拉"
  },
  "city_tripoli": {
    "ar": "طرابلس",
    "en": "Tripoli",
    "es": "Trípoli",
    "ru": "Триполи",
    "tr": "Trablus",
    "uk": "Триполі",
    "zh": "的黎波里"
  },
  "city_troll": {
    "ar": "ترول",
    "en": "Troll",
    "es": "Troll",
    "ru": "Тролль",
    "tr": "Troll",
    "uk": "Тролл",
    "zh": "特罗尔"
  },
  "city_tucuman": {
    "ar": "تاكمان",
    "en": "Tucuman",
    "es": "Tucumán",
    "ru": "Тукуман",
    "tr": "Tucuman",
    "uk": "Тукуман",
    "zh": "图库曼"
  },
  "city_tunis": {
    "ar": "تونس",
    "en": "Tunis",
    "es": "Túnez",
    "ru": "Тунис",
    "tr": "Tunus",
    "uk": "Туніс",
    "zh": "突尼斯"
  },
  "city_ujung_pandang": {
    "ar": "Ujung Pandang",
    "en": "Ujung Pandang",
    "es": "Ujung Pandang",
    "ru": "Ujung Pandang",
    "tr": "Ujung Pandang",
    "uk": "Ujung Pandang",
    "zh": "Ujung Pandang"
  },
  "city_ulaanbaatar": {
    "ar": "آلانباتار",
    "en": "Ulaanbaatar",
    "es": "Ulán Bator",
    "ru": "Улан-Батор",
    "tr": "Ulan Batur",
    "uk": "Улан-Батор",
    "zh": "乌兰巴托"
  },
  "city_ulan_bator": {
    "ar": "Ulan Bator",
    "en": "Ulan Bator",
    "es": "Ulan Bator",
    "ru": "Ulan Bator",
    "tr": "Ulan Bator",
    "uk": "Ulan Bator",
    "zh": "Ulan Bator"
  },
  "city_ulyanovsk": {
    "ar": "أوليانوفسك",
    "en": "Ulyanovsk",
    "es": "Uliánovsk",
    "ru": "Ульяновск",
    "tr": "Ulyanovsk",
    "uk": "Ульянівськ",
    "zh": "乌里扬诺夫斯克"
  },
  "city_urumqi": {
    "ar": "أرومكي",
    "en": "Urumqi",
    "es": "Ürümqi",
    "ru": "Урумчи",
    "tr": "Urumçi",
    "uk": "Урумчі",
    "zh": "乌鲁木齐"
  },
  "city_ushuaia": {
    "ar": "أشوا",
    "en": "Ushuaia",
    "es": "Ushuaia",
    "ru": "Ушуая",
    "tr": "Ushuaia",
    "uk": "Ушуая",
    "zh": "乌斯怀亚"
  },
  "city_ust_nera": {
    "ar": "أوست نيرا",
    "en": "Ust-Nera",
    "es": "Ust-Nera",
    "ru": "Усть-Нера",
    "tr": "Ust-Nera",
    "uk": "Усть-Нера",
    "zh": "乌斯内拉"
  },
  "city_uzhgorod": {
    "ar": "Uzhgorod",
    "en": "Uzhgorod",
    "es": "Uzhgorod",
    "ru": "Uzhgorod",
    "tr": "Uzhgorod",
    "uk": "Uzhgorod",
    "zh": "Uzhgorod"
  },
  "city_uzhhorod": {
    "ar": "أوجهورود",
    "en": "Uzhhorod",
    "es": "Úzhgorod",
    "ru": "Ужгород",
    "tr": "Ujhorod",
    "uk": "Ужгород",
    "zh": "乌日霍罗德"
  },
  "city_vaduz": {
    "ar": "فادوز",
    "en": "Vaduz",
    "es": "Vaduz",
    "ru": "Вадуц",
    "tr": "Vaduz",
    "uk": "Вадуц",
    "zh": "瓦杜兹"
  },
  "city_vancouver": {
    "ar": "فانكوفر",
    "en": "Vancouver",
    "es": "Vancouver",
    "ru": "Ванкувер",
    "tr": "Vancouver",
    "uk": "Ванкувер",
    "zh": "温哥华"
  },
  "city_vatican": {
    "ar": "الفاتيكان",
    "en": "Vatican",
    "es": "El Vaticano",
    "ru": "Ватикан",
    "tr": "Vatikan",
    "uk": "Ватикан",
    "zh": "梵蒂冈"
  },
  "city_vevay_indiana": {
    "ar": "فيفاي",
    "en": "Vevay, Indiana",
    "es": "Vevay, Indiana",
    "ru": "Вевей, Индиана",
    "tr": "Vevay, Indiana",
    "uk": "Вівей, Індіана",
    "zh": "印第安纳州维维市"
  },
  "city_victoria": {
    "ar": "Victoria",
    "en": "Victoria",
    "es": "Victoria",
    "ru": "Victoria",
    "tr": "Victoria",
    "uk": "Victoria",
    "zh": "Victoria"
  },
  "city_vienna": {
    "ar": "فيينا",
    "en": "Vienna",
    "es": "Viena",
    "ru": "Вена",
    "tr": "Viyana",
    "uk": "Відень",
    "zh": "维也纳"
  },
  "city_vientiane": {
    "ar": "فيانتيان",
    "en": "Vientiane",
    "es": "Vientián",
    "ru": "Вьентьян",
    "tr": "Vientiane",
    "uk": "Вʼєнтьян",
    "zh": "万象"
  },
  "city_vilnius": {
    "ar": "فيلنيوس",
    "en": "Vilnius",
    "es": "Vilna",
    "ru": "Вильнюс",
    "tr": "Vilnius",
    "uk": "Вільнюс",
    "zh": "维尔纽斯"
  },
  "city_vincennes_indiana": {
    "ar": "فينسينس",
    "en": "Vincennes, Indiana",
    "es": "Vincennes, Indiana",
    "ru": "Винсеннес",
    "tr": "Vincennes, Indiana",
    "uk": "Вінсенс, Індіана",
    "zh": "印第安纳州温森斯"
  },
  "city_vinnytsia": {
    "ar": "فينيتسا",
    "en": "Vinnytsia",
    "es": "Vínnytsia",
    "ru": "Винница",
    "tr": "Vinnıtsya",
    "uk": "Вінниця",
    "zh": "文尼察"
  },
  "city_virgin": {
    "ar": "Virgin",
    "en": "Virgin",
    "es": "Virgin",
    "ru": "Virgin",
    "tr": "Virgin",
    "uk": "Virgin",
    "zh": "Virgin"
  },
  "city_vladivostok": {
    "ar": "فلاديفوستك",
    "en": "Vladivostok",
    "es": "Vladivostok",
    "ru": "Владивосток",
    "tr": "Vladivostok",
    "uk": "Владивосток",
    "zh": "符拉迪沃斯托克"
  },
  "city_volgograd": {
    "ar": "فولوجراد",
    "en": "Volgograd",
    "es": "Volgogrado",
    "ru": "Волгоград",
    "tr": "Volgograd",
    "uk": "Волгоград",
    "zh": "伏尔加格勒"
  },
  "city_vostok": {
    "ar": "فوستوك",
    "en": "Vostok",
    "es": "Vostok",
    "ru": "Восток",
    "tr": "Vostok",
    "uk": "Восток",
    "zh": "沃斯托克"
  },
  "city_wake_island": {
    "ar": "واك",
    "en": "Wake Island",
    "es": "Wake Island",
    "ru": "Уэйк",
    "tr": "Wake Island",
    "uk": "Вейк",
    "zh": "威克"
  },
  "city_wallis": {
    "ar": "واليس",
    "en": "Wallis",
    "es": "Wallis",
    "ru": "Уоллис",
    "tr": "Wallis",
    "uk": "Уолліс",
    "zh": "瓦利斯"
  },
  "city_warsaw": {
    "ar": "وارسو",
    "en": "Warsaw",
    "es": "Varsovia",
    "ru": "Варшава",
    "tr": "Varşova",
    "uk": "Варшава",
    "zh": "华沙"
  },
  "city_west": {
    "ar": "West",
    "en": "West",
    "es": "West",
    "ru": "West",
    "tr": "West",
    "uk": "West",
    "zh": "West"
  },
  "city_whitehorse": {
    "ar": "وايت هورس",
    "en": "Whitehorse",
    "es": "Whitehorse",
    "ru": "Уайтхорс",
    "tr": "Whitehorse",
    "uk": "Вайтгорс",
    "zh": "怀特霍斯"
  },
  "city_winamac_indiana": {
    "ar": "ويناماك",
    "en": "Winamac, Indiana",
    "es": "Winamac, Indiana",
    "ru": "Уинамак",
    "tr": "Winamac, Indiana",
    "uk": "Вінамак, Індіана",
    "zh": "印第安纳州威纳马克"
  },
  "city_windhoek": {
    "ar": "ويندهوك",
    "en": "Windhoek",
    "es": "Windhoek",
    "ru": "Виндхук",
    "tr": "Windhoek",
    "uk": "Віндгук",
    "zh": "温得和克"
  },
  "city_winnipeg": {
    "ar": "وينيبيج",
    "en": "Winnipeg",
    "es": "Winnipeg",
    "ru": "Виннипег",
    "tr": "Winnipeg",
    "uk": "Вінніпеґ",
    "zh": "温尼伯"
  },
  "city_yakutat": {
    "ar": "ياكوتات",
    "en": "Yakutat",
    "es": "Yakutat",
    "ru": "Якутат",
    "tr": "Yakutat",
    "uk": "Якутат",
    "zh": "亚库塔特"
  },
  "city_yakutsk": {
    "ar": "ياكتسك",
    "en": "Yakutsk",
    "es": "Yakutsk",
    "ru": "Якутск",
    "tr": "Yakutsk",
    "uk": "Якутськ",
    "zh": "雅库茨克"
  },
  "city_yancowinna": {
    "ar": "Yancowinna",
    "en": "Yancowinna",
    "es": "Yancowinna",
    "ru": "Yancowinna",
    "tr": "Yancowinna",
    "uk": "Yancowinna",
    "zh": "Yancowinna"
  },
  "city_yangon": {
    "ar": "رانغون",
    "en": "Yangon",
    "es": "Yangón (Rangún)",
    "ru": "Янгон",
    "tr": "Yangon",
    "uk": "Янгон",
    "zh": "仰光"
  },
  "city_yap": {
    "ar": "Yap",
    "en": "Yap",
    "es": "Yap",
    "ru": "Yap",
    "tr": "Yap",
    "uk": "Yap",
    "zh": "Yap"
  },
  "city_yekaterinburg": {
    "ar": "يكاترنبيرج",
    "en": "Yekaterinburg",
    "es": "Ekaterimburgo",
    "ru": "Екатеринбург",
    "tr": "Yekaterinburg",
    "uk": "Єкатеринбург",
    "zh": "叶卡捷琳堡"
  },
  "city_yellowknife": {
    "ar": "Yellowknife",
    "en": "Yellowknife",
    "es": "Yellowknife",
    "ru": "Yellowknife",
    "tr": "Yellowknife",
    "uk": "Yellowknife",
    "zh": "Yellowknife"
  },
  "city_yerevan": {
    "ar": "يريفان",
    "en": "Yerevan",
    "es": "Ereván",
    "ru": "Ереван",
    "tr": "Erivan",
    "uk": "Єреван",
    "zh": "埃里温"
  },
  "city_yukon": {
    "ar": "Yukon",
    "en": "Yukon",
    "es": "Yukon",
    "ru": "Yukon",
    "tr": "Yukon",
    "uk": "Yukon",
    "zh": "Yukon"
  },
  "city_zagreb": {
    "ar": "زغرب",
    "en": "Zagreb",
    "es": "Zagreb",
    "ru": "Загреб",
    "tr": "Zagreb",
    "uk": "Загреб",
    "zh": "萨格勒布"
  },
  "city_zaporizhia": {
    "ar": "زابوريجيا",
    "en": "Zaporizhzhia",
    "es": "Zaporiyia",
    "ru": "Запорожье",
    "tr": "Zaporijya",
    "uk": "Запоріжжя",
    "zh": "扎波罗热"
  },
  "city_zaporizhzhia": {
    "ar": "زابوريجيا",
    "en": "Zaporizhzhia",
    "es": "Zaporiyia",
    "ru": "Запорожье",
    "tr": "Zaporijya",
    "uk": "Запоріжжя",
    "zh": "扎波罗热"
  },
  "city_zaporozhye": {
    "ar": "زابوريجيا",
    "en": "Zaporizhzhia",
    "es": "Zaporiyia",
    "ru": "Запорожье",
    "tr": "Zaporijya",
    "uk": "Запоріжжя",
    "zh": "扎波罗热"
  },
  "city_zhytomyr": {
    "ar": "جيتومير",
    "en": "Zhytomyr",
    "es": "Zhytomyr",
    "ru": "Житомир",
    "tr": "Jıtomır",
    "uk": "Житомир",
    "zh": "日托米尔"
  },
  "city_zurich": {
    "ar": "زيورخ",
    "en": "Zurich",
    "es": "Zúrich",
    "ru": "Цюрих",
    "tr": "Zürih",
    "uk": "Цюріх",
    "zh": "苏黎世"
  }
})

const TRANSLITERATION_BY_CODEPOINT = Object.freeze({
  1072: 'a', 1073: 'b', 1074: 'v', 1075: 'h', 1169: 'g', 1076: 'd', 1077: 'e', 1108: 'ie',
  1078: 'zh', 1079: 'z', 1080: 'y', 1110: 'i', 1111: 'i', 1081: 'i', 1082: 'k', 1083: 'l',
  1084: 'm', 1085: 'n', 1086: 'o', 1087: 'p', 1088: 'r', 1089: 's', 1090: 't', 1091: 'u',
  1092: 'f', 1093: 'kh', 1094: 'ts', 1095: 'ch', 1096: 'sh', 1097: 'shch', 1100: '',
  1102: 'iu', 1103: 'ia', 1099: 'y', 1101: 'e', 1105: 'e', 1098: '',
  322: 'l', 248: 'o', 273: 'd', 240: 'd', 254: 'th', 230: 'ae', 339: 'oe', 223: 'ss', 305: 'i',
})

const CITY_ALIAS_BY_KEY = Object.freeze({
  city_kiev: 'city_kyiv',
  city_odessa: 'city_odesa',
  city_zaporozhye: 'city_zaporizhzhia',
  city_zaporizhia: 'city_zaporizhzhia',
  city_nikolayev: 'city_mykolaiv',
  city_mykolayiv: 'city_mykolaiv',
  city_khmelnitsky: 'city_khmelnytskyi',
  city_krivoy_rog: 'city_kryvyi_rih',
  city_krivoj_rog: 'city_kryvyi_rih',
  city_belaya_tserkov: 'city_bila_tserkva',
  city_chernigov: 'city_chernihiv',
  city_chernovtsy: 'city_chernivtsi',
  city_rovno: 'city_rivne',
})

function safeDecodeCity(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const plusNormalized = text.replace(/\+/g, ' ')
  try {
    return decodeURIComponent(plusNormalized).trim()
  } catch {
    return plusNormalized.trim()
  }
}

function transliterateForKey(value) {
  return Array.from(String(value || '').toLowerCase()).map((char) => {
    const mapped = TRANSLITERATION_BY_CODEPOINT[char.codePointAt(0)]
    return mapped === undefined ? char : mapped
  }).join('')
}

function normalizeCityKey(city) {
  const decoded = safeDecodeCity(city)
  if (!decoded) return ''
  return transliterateForKey(decoded)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function cityI18nKey(city) {
  const key = normalizeCityKey(city)
  if (!key) return 'geo_city_unknown'
  const cityKey = 'city_' + key
  return CITY_ALIAS_BY_KEY[cityKey] || cityKey
}

function cleanCityDisplay(city) {
  return safeDecodeCity(city)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 96)
    .trim()
}

function resolveCityLabel(city, lang = 'en', dict = null) {
  const key = cityI18nKey(city)
  const unknown = dict?.geo_city_unknown || dict?.forum_geo_city_unknown || 'City not detected'
  if (key === 'geo_city_unknown') return unknown
  const dictLabel = dict?.[key]
  if (typeof dictLabel === 'string' && dictLabel.trim()) return dictLabel
  const labels = CITY_LABELS_BY_KEY[key]
  const normalizedLang = String(lang || 'en').toLowerCase().slice(0, 2)
  if (labels?.[normalizedLang]) return labels[normalizedLang]
  if (labels?.en) return labels.en
  return cleanCityDisplay(city) || unknown
}

function buildCityGeoDisplay(input = {}, lang = 'en', dict = null) {
  const city = resolveCityLabel(input.city, lang, dict)
  const region = String(input.region || input.regionCode || '').trim()
  const country = String(input.countryLabel || '').trim()
  return [city, region, country].filter(Boolean).join(' / ')
}

module.exports = {
  CITY_LABELS_BY_KEY,
  CITY_ALIAS_BY_KEY,
  TRANSLITERATION_BY_CODEPOINT,
  safeDecodeCity,
  transliterateForKey,
  normalizeCityKey,
  cityI18nKey,
  cleanCityDisplay,
  resolveCityLabel,
  buildCityGeoDisplay,
}
