import {ql7Str} from '../internal/text.js'
import {createQl7SupportLinguisticPrimitive} from './linguisticPrimitiveSchema.js'
import {QL7_SUPPORT_PROFILE_LOCALES} from './locales/manifest.js'

export const QL7_SUPPORT_FACT_PRESENTATION_LEXICON_VERSION = '5.1.0'

export const QL7_SUPPORT_FACT_PRESENTATION_KEYS = Object.freeze([
  'balance', 'status', 'tier', 'expires', 'campaigns', 'payment', 'amount', 'symbol',
  'timeframe', 'price', 'scenario', 'confidence', 'checkedAt', 'asset', 'operation',
  'details', 'case', 'problem', 'usage', 'currentStatus', 'active', 'inactive',
  'exhausted', 'available', 'source',
])

// Lexical labels only. Sentence structure belongs to the morphology realizer.
const RAW = Object.freeze({
  en: { balance: 'Balance', status: 'Status', tier: 'Tier', expires: 'Expires', campaigns: 'Active campaigns', payment: 'Payment', amount: 'Amount', symbol: 'Asset', timeframe: 'Timeframe', price: 'Price', scenario: 'Scenario', confidence: 'Confidence', checkedAt: 'Checked', asset: 'asset or trading pair', operation: 'requested action', details: 'specific detail', case: 'open request', problem: 'specific problem', usage: 'how it works', currentStatus: 'current status', active: 'active', inactive: 'inactive', exhausted: 'exhausted', available: 'available', source: 'source' },
  ru: { balance: 'Баланс', status: 'Статус', tier: 'Уровень', expires: 'Действует до', campaigns: 'Активные кампании', payment: 'Платёж', amount: 'Сумма', symbol: 'Актив', timeframe: 'Таймфрейм', price: 'Цена', scenario: 'Сценарий', confidence: 'Уверенность', checkedAt: 'Проверено', asset: 'актив или торговую пару', operation: 'нужное действие', details: 'конкретную деталь', case: 'открытое обращение', problem: 'конкретную проблему', usage: 'как это работает', currentStatus: 'текущий статус', active: 'активен', inactive: 'неактивен', exhausted: 'исчерпана', available: 'доступна', source: 'источник' },
  uk: { balance: 'Баланс', status: 'Статус', tier: 'Рівень', expires: 'Діє до', campaigns: 'Активні кампанії', payment: 'Платіж', amount: 'Сума', symbol: 'Актив', timeframe: 'Таймфрейм', price: 'Ціна', scenario: 'Сценарій', confidence: 'Впевненість', checkedAt: 'Перевірено', asset: 'актив або торгову пару', operation: 'потрібну дію', details: 'конкретну деталь', case: 'відкрите звернення', problem: 'конкретну проблему', usage: 'як це працює', currentStatus: 'поточний статус', active: 'активний', inactive: 'неактивний', exhausted: 'вичерпано', available: 'доступно', source: 'джерело' },
  es: { balance: 'Saldo', status: 'Estado', tier: 'Nivel', expires: 'Vence', campaigns: 'Campañas activas', payment: 'Pago', amount: 'Importe', symbol: 'Activo', timeframe: 'Temporalidad', price: 'Precio', scenario: 'Escenario', confidence: 'Confianza', checkedAt: 'Comprobado', asset: 'activo o par de negociación', operation: 'acción solicitada', details: 'detalle concreto', case: 'solicitud abierta', problem: 'problema concreto', usage: 'cómo funciona', currentStatus: 'estado actual', active: 'activo', inactive: 'inactivo', exhausted: 'agotada', available: 'disponible', source: 'fuente' },
  tr: { balance: 'Bakiye', status: 'Durum', tier: 'Seviye', expires: 'Bitiş', campaigns: 'Aktif kampanyalar', payment: 'Ödeme', amount: 'Tutar', symbol: 'Varlık', timeframe: 'Zaman dilimi', price: 'Fiyat', scenario: 'Senaryo', confidence: 'Güven', checkedAt: 'Kontrol edildi', asset: 'varlık veya işlem çifti', operation: 'istenen işlem', details: 'belirli ayrıntı', case: 'açık talep', problem: 'belirli sorun', usage: 'nasıl çalıştığı', currentStatus: 'mevcut durum', active: 'aktif', inactive: 'etkin değil', exhausted: 'tükendi', available: 'kullanılabilir', source: 'kaynak' },
  ar: { balance: 'الرصيد', status: 'الحالة', tier: 'المستوى', expires: 'تاريخ الانتهاء', campaigns: 'الحملات النشطة', payment: 'الدفع', amount: 'المبلغ', symbol: 'الأصل', timeframe: 'الإطار الزمني', price: 'السعر', scenario: 'السيناريو', confidence: 'الثقة', checkedAt: 'وقت التحقق', asset: 'الأصل أو زوج التداول', operation: 'الإجراء المطلوب', details: 'التفصيل المحدد', case: 'الطلب المفتوح', problem: 'المشكلة المحددة', usage: 'طريقة العمل', currentStatus: 'الحالة الحالية', active: 'نشط', inactive: 'غير نشط', exhausted: 'مستنفدة', available: 'متاحة', source: 'المصدر' },
  zh: { balance: '余额', status: '状态', tier: '等级', expires: '到期时间', campaigns: '活动广告', payment: '支付', amount: '金额', symbol: '资产', timeframe: '周期', price: '价格', scenario: '情景', confidence: '置信度', checkedAt: '核验时间', asset: '资产或交易对', operation: '所需操作', details: '具体细节', case: '待处理请求', problem: '具体问题', usage: '使用方式', currentStatus: '当前状态', active: '有效', inactive: '未激活', exhausted: '已用尽', available: '可用', source: '来源' },
  he: { balance: 'יתרה', status: 'מצב', tier: 'רמה', expires: 'תוקף עד', campaigns: 'קמפיינים פעילים', payment: 'תשלום', amount: 'סכום', symbol: 'נכס', timeframe: 'טווח זמן', price: 'מחיר', scenario: 'תרחיש', confidence: 'ביטחון', checkedAt: 'נבדק', asset: 'נכס או צמד מסחר', operation: 'הפעולה המבוקשת', details: 'פרט מסוים', case: 'בקשה פתוחה', problem: 'בעיה מסוימת', usage: 'אופן הפעולה', currentStatus: 'המצב הנוכחי', active: 'פעיל', inactive: 'לא פעיל', exhausted: 'נוצלה במלואה', available: 'זמינה', source: 'מקור' },
  de: { balance: 'Kontostand', status: 'Status', tier: 'Stufe', expires: 'Gültig bis', campaigns: 'Aktive Kampagnen', payment: 'Zahlung', amount: 'Betrag', symbol: 'Asset', timeframe: 'Zeitrahmen', price: 'Preis', scenario: 'Szenario', confidence: 'Konfidenz', checkedAt: 'Geprüft', asset: 'Asset oder Handelspaar', operation: 'gewünschte Aktion', details: 'konkretes Detail', case: 'offene Anfrage', problem: 'konkretes Problem', usage: 'Funktionsweise', currentStatus: 'aktueller Status', active: 'aktiv', inactive: 'inaktiv', exhausted: 'aufgebraucht', available: 'verfügbar', source: 'Quelle' },
  fr: { balance: 'Solde', status: 'Statut', tier: 'Niveau', expires: 'Expire le', campaigns: 'Campagnes actives', payment: 'Paiement', amount: 'Montant', symbol: 'Actif', timeframe: 'Unité de temps', price: 'Prix', scenario: 'Scénario', confidence: 'Confiance', checkedAt: 'Vérifié', asset: 'actif ou paire de négociation', operation: 'action demandée', details: 'détail précis', case: 'demande ouverte', problem: 'problème précis', usage: 'fonctionnement', currentStatus: 'statut actuel', active: 'actif', inactive: 'inactif', exhausted: 'épuisé', available: 'disponible', source: 'source' },
  it: { balance: 'Saldo', status: 'Stato', tier: 'Livello', expires: 'Scade il', campaigns: 'Campagne attive', payment: 'Pagamento', amount: 'Importo', symbol: 'Asset', timeframe: 'Intervallo', price: 'Prezzo', scenario: 'Scenario', confidence: 'Affidabilità', checkedAt: 'Verificato', asset: 'asset o coppia di trading', operation: 'azione richiesta', details: 'dettaglio specifico', case: 'richiesta aperta', problem: 'problema specifico', usage: 'funzionamento', currentStatus: 'stato attuale', active: 'attivo', inactive: 'inattivo', exhausted: 'esaurita', available: 'disponibile', source: 'fonte' },
  pt: { balance: 'Saldo', status: 'Estado', tier: 'Nível', expires: 'Expira em', campaigns: 'Campanhas ativas', payment: 'Pagamento', amount: 'Valor', symbol: 'Ativo', timeframe: 'Período', price: 'Preço', scenario: 'Cenário', confidence: 'Confiança', checkedAt: 'Verificado', asset: 'ativo ou par de negociação', operation: 'ação solicitada', details: 'detalhe específico', case: 'solicitação aberta', problem: 'problema específico', usage: 'funcionamento', currentStatus: 'estado atual', active: 'ativo', inactive: 'inativo', exhausted: 'esgotada', available: 'disponível', source: 'fonte' },
  pl: { balance: 'Saldo', status: 'Status', tier: 'Poziom', expires: 'Ważne do', campaigns: 'Aktywne kampanie', payment: 'Płatność', amount: 'Kwota', symbol: 'Aktywo', timeframe: 'Interwał', price: 'Cena', scenario: 'Scenariusz', confidence: 'Pewność', checkedAt: 'Sprawdzono', asset: 'aktywo lub para handlowa', operation: 'żądane działanie', details: 'konkretny szczegół', case: 'otwarte zgłoszenie', problem: 'konkretny problem', usage: 'sposób działania', currentStatus: 'bieżący status', active: 'aktywny', inactive: 'nieaktywny', exhausted: 'wyczerpana', available: 'dostępna', source: 'źródło' },
  nl: { balance: 'Saldo', status: 'Status', tier: 'Niveau', expires: 'Geldig tot', campaigns: 'Actieve campagnes', payment: 'Betaling', amount: 'Bedrag', symbol: 'Asset', timeframe: 'Tijdsbestek', price: 'Prijs', scenario: 'Scenario', confidence: 'Zekerheid', checkedAt: 'Gecontroleerd', asset: 'asset of handelspaar', operation: 'gevraagde actie', details: 'concreet detail', case: 'open verzoek', problem: 'concreet probleem', usage: 'werking', currentStatus: 'huidige status', active: 'actief', inactive: 'inactief', exhausted: 'opgebruikt', available: 'beschikbaar', source: 'bron' },
  sv: { balance: 'Saldo', status: 'Status', tier: 'Nivå', expires: 'Gäller till', campaigns: 'Aktiva kampanjer', payment: 'Betalning', amount: 'Belopp', symbol: 'Tillgång', timeframe: 'Tidsram', price: 'Pris', scenario: 'Scenario', confidence: 'Säkerhet', checkedAt: 'Verifierat', asset: 'tillgång eller handelspar', operation: 'begärd åtgärd', details: 'konkret detalj', case: 'öppet ärende', problem: 'konkret problem', usage: 'hur det fungerar', currentStatus: 'aktuell status', active: 'aktiv', inactive: 'inaktiv', exhausted: 'förbrukad', available: 'tillgänglig', source: 'källa' },
  no: { balance: 'Saldo', status: 'Status', tier: 'Nivå', expires: 'Gyldig til', campaigns: 'Aktive kampanjer', payment: 'Betaling', amount: 'Beløp', symbol: 'Eiendel', timeframe: 'Tidsramme', price: 'Pris', scenario: 'Scenario', confidence: 'Sikkerhet', checkedAt: 'Kontrollert', asset: 'eiendel eller handelspar', operation: 'ønsket handling', details: 'konkret detalj', case: 'åpen henvendelse', problem: 'konkret problem', usage: 'hvordan det fungerer', currentStatus: 'gjeldende status', active: 'aktiv', inactive: 'inaktiv', exhausted: 'oppbrukt', available: 'tilgjengelig', source: 'kilde' },
  da: { balance: 'Saldo', status: 'Status', tier: 'Niveau', expires: 'Gyldig til', campaigns: 'Aktive kampagner', payment: 'Betaling', amount: 'Beløb', symbol: 'Aktiv', timeframe: 'Tidsramme', price: 'Pris', scenario: 'Scenarie', confidence: 'Sikkerhed', checkedAt: 'Kontrolleret', asset: 'aktiv eller handelspar', operation: 'ønsket handling', details: 'konkret detalje', case: 'åben henvendelse', problem: 'konkret problem', usage: 'hvordan det fungerer', currentStatus: 'aktuel status', active: 'aktiv', inactive: 'inaktiv', exhausted: 'opbrugt', available: 'tilgængelig', source: 'kilde' },
  fi: { balance: 'Saldo', status: 'Tila', tier: 'Taso', expires: 'Voimassa asti', campaigns: 'Aktiiviset kampanjat', payment: 'Maksu', amount: 'Summa', symbol: 'Kohde', timeframe: 'Aikaväli', price: 'Hinta', scenario: 'Skenaario', confidence: 'Luottamus', checkedAt: 'Tarkistettu', asset: 'kohde tai kaupankäyntipari', operation: 'pyydetty toiminto', details: 'tarkka yksityiskohta', case: 'avoin pyyntö', problem: 'tarkka ongelma', usage: 'toimintatapa', currentStatus: 'nykyinen tila', active: 'aktiivinen', inactive: 'ei aktiivinen', exhausted: 'käytetty loppuun', available: 'saatavilla', source: 'lähde' },
  cs: { balance: 'Zůstatek', status: 'Stav', tier: 'Úroveň', expires: 'Platí do', campaigns: 'Aktivní kampaně', payment: 'Platba', amount: 'Částka', symbol: 'Aktivum', timeframe: 'Časový rámec', price: 'Cena', scenario: 'Scénář', confidence: 'Spolehlivost', checkedAt: 'Ověřeno', asset: 'aktivum nebo obchodní pár', operation: 'požadovaná akce', details: 'konkrétní údaj', case: 'otevřený požadavek', problem: 'konkrétní problém', usage: 'způsob fungování', currentStatus: 'aktuální stav', active: 'aktivní', inactive: 'neaktivní', exhausted: 'vyčerpána', available: 'dostupná', source: 'zdroj' },
  sk: { balance: 'Zostatok', status: 'Stav', tier: 'Úroveň', expires: 'Platí do', campaigns: 'Aktívne kampane', payment: 'Platba', amount: 'Suma', symbol: 'Aktívum', timeframe: 'Časový rámec', price: 'Cena', scenario: 'Scenár', confidence: 'Spoľahlivosť', checkedAt: 'Overené', asset: 'aktívum alebo obchodný pár', operation: 'požadovaná akcia', details: 'konkrétny údaj', case: 'otvorená požiadavka', problem: 'konkrétny problém', usage: 'spôsob fungovania', currentStatus: 'aktuálny stav', active: 'aktívny', inactive: 'neaktívny', exhausted: 'vyčerpaná', available: 'dostupná', source: 'zdroj' },
  hu: { balance: 'Egyenleg', status: 'Állapot', tier: 'Szint', expires: 'Lejárat', campaigns: 'Aktív kampányok', payment: 'Fizetés', amount: 'Összeg', symbol: 'Eszköz', timeframe: 'Időtáv', price: 'Ár', scenario: 'Forgatókönyv', confidence: 'Bizonyosság', checkedAt: 'Ellenőrizve', asset: 'eszköz vagy kereskedési pár', operation: 'kért művelet', details: 'konkrét részlet', case: 'nyitott kérés', problem: 'konkrét probléma', usage: 'működés', currentStatus: 'jelenlegi állapot', active: 'aktív', inactive: 'inaktív', exhausted: 'kimerült', available: 'elérhető', source: 'forrás' },
  ro: { balance: 'Sold', status: 'Stare', tier: 'Nivel', expires: 'Expiră la', campaigns: 'Campanii active', payment: 'Plată', amount: 'Sumă', symbol: 'Activ', timeframe: 'Interval', price: 'Preț', scenario: 'Scenariu', confidence: 'Încredere', checkedAt: 'Verificat', asset: 'activ sau pereche de tranzacționare', operation: 'acțiunea solicitată', details: 'detaliul concret', case: 'solicitarea deschisă', problem: 'problema concretă', usage: 'modul de funcționare', currentStatus: 'starea actuală', active: 'activ', inactive: 'inactiv', exhausted: 'epuizată', available: 'disponibilă', source: 'sursă' },
  bg: { balance: 'Баланс', status: 'Статус', tier: 'Ниво', expires: 'Валидно до', campaigns: 'Активни кампании', payment: 'Плащане', amount: 'Сума', symbol: 'Актив', timeframe: 'Времева рамка', price: 'Цена', scenario: 'Сценарий', confidence: 'Увереност', checkedAt: 'Проверено', asset: 'актив или търговска двойка', operation: 'желаното действие', details: 'конкретния детайл', case: 'отвореното запитване', problem: 'конкретния проблем', usage: 'как работи', currentStatus: 'текущия статус', active: 'активен', inactive: 'неактивен', exhausted: 'изчерпана', available: 'достъпна', source: 'източник' },
  sr: { balance: 'Stanje', status: 'Status', tier: 'Nivo', expires: 'Važi do', campaigns: 'Aktivne kampanje', payment: 'Plaćanje', amount: 'Iznos', symbol: 'Imovina', timeframe: 'Vremenski okvir', price: 'Cena', scenario: 'Scenario', confidence: 'Pouzdanost', checkedAt: 'Provereno', asset: 'imovinu ili trgovački par', operation: 'traženu radnju', details: 'konkretan detalj', case: 'otvoren zahtev', problem: 'konkretan problem', usage: 'način rada', currentStatus: 'trenutni status', active: 'aktivan', inactive: 'neaktivan', exhausted: 'potrošena', available: 'dostupna', source: 'izvor' },
  hr: { balance: 'Stanje', status: 'Status', tier: 'Razina', expires: 'Vrijedi do', campaigns: 'Aktivne kampanje', payment: 'Plaćanje', amount: 'Iznos', symbol: 'Imovina', timeframe: 'Vremenski okvir', price: 'Cijena', scenario: 'Scenarij', confidence: 'Pouzdanost', checkedAt: 'Provjereno', asset: 'imovinu ili trgovački par', operation: 'traženu radnju', details: 'konkretnu pojedinost', case: 'otvoren zahtjev', problem: 'konkretan problem', usage: 'način rada', currentStatus: 'trenutačni status', active: 'aktivan', inactive: 'neaktivan', exhausted: 'potrošena', available: 'dostupna', source: 'izvor' },
  sl: { balance: 'Stanje', status: 'Status', tier: 'Raven', expires: 'Velja do', campaigns: 'Aktivne kampanje', payment: 'Plačilo', amount: 'Znesek', symbol: 'Sredstvo', timeframe: 'Časovni okvir', price: 'Cena', scenario: 'Scenarij', confidence: 'Zanesljivost', checkedAt: 'Preverjeno', asset: 'sredstvo ali trgovalni par', operation: 'zahtevano dejanje', details: 'konkretno podrobnost', case: 'odprto zahtevo', problem: 'konkretno težavo', usage: 'način delovanja', currentStatus: 'trenutno stanje', active: 'aktiven', inactive: 'neaktiven', exhausted: 'porabljena', available: 'na voljo', source: 'vir' },
  el: { balance: 'Υπόλοιπο', status: 'Κατάσταση', tier: 'Επίπεδο', expires: 'Λήγει', campaigns: 'Ενεργές καμπάνιες', payment: 'Πληρωμή', amount: 'Ποσό', symbol: 'Περιουσιακό στοιχείο', timeframe: 'Χρονικό πλαίσιο', price: 'Τιμή', scenario: 'Σενάριο', confidence: 'Βεβαιότητα', checkedAt: 'Επαληθεύτηκε', asset: 'περιουσιακό στοιχείο ή ζεύγος', operation: 'ζητούμενη ενέργεια', details: 'συγκεκριμένη λεπτομέρεια', case: 'ανοιχτό αίτημα', problem: 'συγκεκριμένο πρόβλημα', usage: 'τρόπο λειτουργίας', currentStatus: 'τρέχουσα κατάσταση', active: 'ενεργό', inactive: 'ανενεργό', exhausted: 'εξαντλήθηκε', available: 'διαθέσιμη', source: 'πηγή' },
  ka: { balance: 'ბალანსი', status: 'სტატუსი', tier: 'დონე', expires: 'ვადა', campaigns: 'აქტიური კამპანიები', payment: 'გადახდა', amount: 'თანხა', symbol: 'აქტივი', timeframe: 'დროის ინტერვალი', price: 'ფასი', scenario: 'სცენარი', confidence: 'სანდოობა', checkedAt: 'შემოწმებულია', asset: 'აქტივი ან სავაჭრო წყვილი', operation: 'მოთხოვნილი მოქმედება', details: 'კონკრეტული დეტალი', case: 'ღია მოთხოვნა', problem: 'კონკრეტული პრობლემა', usage: 'მუშაობის წესი', currentStatus: 'მიმდინარე სტატუსი', active: 'აქტიური', inactive: 'არააქტიური', exhausted: 'ამოწურულია', available: 'ხელმისაწვდომია', source: 'წყარო' },
  az: { balance: 'Balans', status: 'Status', tier: 'Səviyyə', expires: 'Bitmə tarixi', campaigns: 'Aktiv kampaniyalar', payment: 'Ödəniş', amount: 'Məbləğ', symbol: 'Aktiv', timeframe: 'Vaxt intervalı', price: 'Qiymət', scenario: 'Ssenari', confidence: 'Etibar', checkedAt: 'Yoxlanılıb', asset: 'aktiv və ya ticarət cütü', operation: 'tələb olunan əməliyyat', details: 'konkret detal', case: 'açıq müraciət', problem: 'konkret problem', usage: 'iş prinsipi', currentStatus: 'cari status', active: 'aktiv', inactive: 'qeyri-aktiv', exhausted: 'tükənib', available: 'əlçatandır', source: 'mənbə' },
  kk: { balance: 'Баланс', status: 'Мәртебе', tier: 'Деңгей', expires: 'Мерзімі', campaigns: 'Белсенді науқандар', payment: 'Төлем', amount: 'Сома', symbol: 'Актив', timeframe: 'Уақыт аралығы', price: 'Баға', scenario: 'Сценарий', confidence: 'Сенімділік', checkedAt: 'Тексерілді', asset: 'актив немесе сауда жұбы', operation: 'сұралған әрекет', details: 'нақты мәлімет', case: 'ашық өтініш', problem: 'нақты мәселе', usage: 'жұмыс істеу тәртібі', currentStatus: 'ағымдағы мәртебе', active: 'белсенді', inactive: 'белсенді емес', exhausted: 'таусылды', available: 'қолжетімді', source: 'дереккөз' },
  ja: { balance: '残高', status: '状態', tier: 'レベル', expires: '有効期限', campaigns: '有効な広告', payment: '支払い', amount: '金額', symbol: '資産', timeframe: '時間足', price: '価格', scenario: 'シナリオ', confidence: '確度', checkedAt: '確認時刻', asset: '資産または取引ペア', operation: '希望する操作', details: '具体的な詳細', case: '未完了の依頼', problem: '具体的な問題', usage: '仕組み', currentStatus: '現在の状態', active: '有効', inactive: '無効', exhausted: '使い切り', available: '利用可能', source: '情報源' },
  ko: { balance: '잔액', status: '상태', tier: '등급', expires: '만료일', campaigns: '활성 캠페인', payment: '결제', amount: '금액', symbol: '자산', timeframe: '시간대', price: '가격', scenario: '시나리오', confidence: '신뢰도', checkedAt: '확인 시각', asset: '자산 또는 거래 쌍', operation: '원하는 작업', details: '구체적인 세부 정보', case: '열려 있는 요청', problem: '구체적인 문제', usage: '작동 방식', currentStatus: '현재 상태', active: '활성', inactive: '비활성', exhausted: '소진됨', available: '사용 가능', source: '출처' },
})

function buildLexicon() {
  return Object.freeze(Object.fromEntries(Object.entries(RAW).map(([locale, pack]) => [
    locale,
    Object.freeze(Object.fromEntries(Object.entries(pack).map(([key, value]) => [
      key,
      createQl7SupportLinguisticPrimitive({
        entryId: `${locale}.fact-label.${key}`,
        locale,
        semanticRole: `fact-label:${key}`,
        speechAct: 'fact-presentation',
        lexicalChoices: [value],
        syntacticFrame: { type: 'fact-label', slots: [] },
        pragmaticEffect: 'label-verified-value',
        provenance: {
          owner: 'ql7-support.language.fact-presentation-lexicon',
          sourceId: `fact-label:${locale}:${key}`,
          sourceVersion: QL7_SUPPORT_FACT_PRESENTATION_LEXICON_VERSION,
        },
      }),
    ]))),
  ])))
}

export const QL7_SUPPORT_FACT_PRESENTATION_LEXICON = buildLexicon()

export function getQl7SupportFactLabel(locale = '', key = '') {
  const entry = QL7_SUPPORT_FACT_PRESENTATION_LEXICON[ql7Str(locale)]?.[ql7Str(key)]
  if (!entry) {
    const error = new Error(`ql7_fact_label_missing:${locale}:${key}`)
    error.code = 'ql7_fact_label_missing'
    throw error
  }
  return Object.freeze({
    value: entry.lexicalChoices[0],
    entryId: entry.entryId,
    contentHash: entry.contentHash,
  })
}

export function auditQl7SupportFactPresentationLexicon() {
  const failures = []
  for (const locale of QL7_SUPPORT_PROFILE_LOCALES) {
    const pack = QL7_SUPPORT_FACT_PRESENTATION_LEXICON[locale]
    if (!pack) {
      failures.push(`missing_locale:${locale}`)
      continue
    }
    for (const key of QL7_SUPPORT_FACT_PRESENTATION_KEYS) {
      const entry = pack[key]
      if (!entry) failures.push(`missing_label:${locale}:${key}`)
      if (entry?.locale !== locale) failures.push(`locale_mismatch:${locale}:${key}`)
    }
  }
  return Object.freeze({
    version: QL7_SUPPORT_FACT_PRESENTATION_LEXICON_VERSION,
    localeCount: Object.keys(QL7_SUPPORT_FACT_PRESENTATION_LEXICON).length,
    keyCount: QL7_SUPPORT_FACT_PRESENTATION_KEYS.length,
    entryCount: Object.values(QL7_SUPPORT_FACT_PRESENTATION_LEXICON)
      .reduce((sum, pack) => sum + Object.keys(pack).length, 0),
    failures: Object.freeze(failures),
    ok: failures.length === 0,
  })
}
