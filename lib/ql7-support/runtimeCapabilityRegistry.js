export const QL7_SUPPORT_RUNTIME_STATUSES = Object.freeze(['unknown', 'development', 'private_beta', 'public_beta', 'live', 'maintenance', 'paused', 'retired'])
export const QL7_SUPPORT_RUNTIME_CAPABILITY_COLLECTION = 'ql7_support_runtime_capabilities'

const DEFAULTS = Object.freeze({
  exchange: { status: 'development', publishedLaunchAt: null },
  exchange_ai: { status: 'development', publishedLaunchAt: null },
  battlecoin: { status: 'development', publishedLaunchAt: null },
  futures: { status: 'development', publishedLaunchAt: null },
  gameverse: { status: 'development', publishedLaunchAt: null },
  metastudio: { status: 'development', publishedLaunchAt: null },
  metamarket: { status: 'live', publishedLaunchAt: null },
  forum: { status: 'live', publishedLaunchAt: null },
})
const TOPIC_TO_CAPABILITY = Object.freeze({ exchange: 'exchange', exchange_ai: 'exchange_ai', battlecoin: 'battlecoin', battle_chat: 'battlecoin', futures: 'futures', gameverse: 'gameverse', metastudio: 'metastudio', metaverse: 'gameverse', metamarket: 'metamarket', forum_feed: 'forum', forum_threads: 'forum' })

function str(value) { return String(value ?? '').trim() }
function validDate(value) { if (value === null || value === undefined || String(value).trim() === '') return null; const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toISOString() : null }
function envKey(id, suffix) { return `QL7_RUNTIME_${str(id).replace(/[^A-Za-z0-9]/gu, '_').toUpperCase()}_${suffix}` }

export function normalizeQl7SupportRuntimeCapability(value = {}, fallbackId = '') {
  const capabilityId = str(value?.capabilityId || fallbackId)
  const status = QL7_SUPPORT_RUNTIME_STATUSES.includes(str(value?.status)) ? str(value.status) : 'unknown'
  return Object.freeze({
    capabilityId,
    status,
    effectiveAt: validDate(value?.effectiveAt),
    publishedLaunchAt: validDate(value?.publishedLaunchAt),
    source: str(value?.source || 'runtime_registry').slice(0, 120),
    asOf: validDate(value?.asOf) || new Date().toISOString(),
    userVisible: value?.userVisible !== false,
    notesKey: str(value?.notesKey).slice(0, 120),
  })
}

export function getQl7SupportRuntimeCapability(capabilityId = '', overrides = {}) {
  const id = str(capabilityId)
  const source = overrides?.[id] || DEFAULTS[id] || { status: 'unknown', publishedLaunchAt: null }
  return normalizeQl7SupportRuntimeCapability({ ...source, capabilityId: id }, id)
}

export function getQl7SupportRuntimeCapabilityIdForTopic(topic = '') {
  return TOPIC_TO_CAPABILITY[str(topic)] || ''
}

export async function readQl7SupportRuntimeCapability({ database = null, capabilityId = '', topic = '', env = process.env } = {}) {
  const id = str(capabilityId || getQl7SupportRuntimeCapabilityIdForTopic(topic))
  if (!id) return null
  const environmentStatus = str(env?.[envKey(id, 'STATUS')])
  const environmentDate = str(env?.[envKey(id, 'LAUNCH_AT')])
  if (QL7_SUPPORT_RUNTIME_STATUSES.includes(environmentStatus)) {
    return normalizeQl7SupportRuntimeCapability({ capabilityId: id, status: environmentStatus, publishedLaunchAt: environmentDate || null, source: `env:${envKey(id, 'STATUS')}`, asOf: new Date().toISOString() }, id)
  }
  if (database?.collection) {
    const row = await database.collection(QL7_SUPPORT_RUNTIME_CAPABILITY_COLLECTION)
      .findOne({ $or: [{ _id: id }, { capabilityId: id }] })
      .catch(() => null)
    if (row) return normalizeQl7SupportRuntimeCapability({ ...row, capabilityId: id, source: row.source || QL7_SUPPORT_RUNTIME_CAPABILITY_COLLECTION }, id)
  }
  return getQl7SupportRuntimeCapability(id)
}

const STATE_TEXT = Object.freeze({
  en: { development: 'is in development', private_beta: 'is in private beta', public_beta: 'is available in public beta', live: 'is available', maintenance: 'is temporarily under maintenance', paused: 'is temporarily paused', retired: 'is no longer available', unknown: 'has no confirmed current status', date: 'Published date', noDate: 'No confirmed public launch date is available yet. Users will be notified after an official update.' },
  ru: { development: 'находится в разработке', private_beta: 'доступна в закрытой beta', public_beta: 'доступна в открытой beta', live: 'доступна', maintenance: 'временно находится на обслуживании', paused: 'временно приостановлена', retired: 'больше не доступна', unknown: 'не имеет подтверждённого текущего статуса', date: 'Опубликованная дата', noDate: 'Подтверждённая публичная дата запуска пока не опубликована. Пользователи получат уведомление после официального обновления.' },
  uk: { development: 'перебуває в розробці', private_beta: 'доступна в закритій beta', public_beta: 'доступна у відкритій beta', live: 'доступна', maintenance: 'тимчасово перебуває на обслуговуванні', paused: 'тимчасово призупинена', retired: 'більше не доступна', unknown: 'не має підтвердженого поточного статусу', date: 'Опублікована дата', noDate: 'Підтверджену публічну дату запуску ще не оприлюднено. Користувачі отримають сповіщення після офіційного оновлення.' },
  es: { development: 'está en desarrollo', private_beta: 'está en beta privada', public_beta: 'está disponible en beta pública', live: 'está disponible', maintenance: 'está temporalmente en mantenimiento', paused: 'está temporalmente en pausa', retired: 'ya no está disponible', unknown: 'no tiene un estado actual confirmado', date: 'Fecha publicada', noDate: 'Todavía no hay una fecha pública de lanzamiento confirmada. Los usuarios recibirán una notificación tras una actualización oficial.' },
  tr: { development: 'geliştirme aşamasındadır', private_beta: 'özel beta aşamasındadır', public_beta: 'genel beta olarak kullanılabilir', live: 'kullanılabilir', maintenance: 'geçici olarak bakımdadır', paused: 'geçici olarak duraklatılmıştır', retired: 'artık kullanılamaz', unknown: 'doğrulanmış güncel bir durumu yoktur', date: 'Yayımlanan tarih', noDate: 'Henüz doğrulanmış bir genel lansman tarihi yok. Resmî güncellemeden sonra kullanıcılara bildirim gönderilecektir.' },
  ar: { development: 'قيد التطوير', private_beta: 'متاحة ضمن نسخة تجريبية خاصة', public_beta: 'متاحة ضمن نسخة تجريبية عامة', live: 'متاحة', maintenance: 'تخضع للصيانة مؤقتاً', paused: 'متوقفة مؤقتاً', retired: 'لم تعد متاحة', unknown: 'لا تملك حالة حالية مؤكدة', date: 'التاريخ المنشور', noDate: 'لا يوجد حتى الآن موعد إطلاق عام مؤكد. سيتم إشعار المستخدمين بعد صدور تحديث رسمي.' },
  zh: { development: '正在开发中', private_beta: '处于私测阶段', public_beta: '已开放公测', live: '当前可用', maintenance: '暂时处于维护中', paused: '暂时暂停', retired: '已停止提供', unknown: '当前状态尚未确认', date: '已公布日期', noDate: '目前尚无确认的公开上线日期。正式更新后将通知用户。' },
  he: { development: 'נמצא בפיתוח', private_beta: 'זמין בגרסת בטא פרטית', public_beta: 'זמין בגרסת בטא ציבורית', live: 'זמין', maintenance: 'נמצא זמנית בתחזוקה', paused: 'מושהה זמנית', retired: 'אינו זמין עוד', unknown: 'אין לו מצב נוכחי מאומת', date: 'תאריך שפורסם', noDate: 'עדיין לא פורסם מועד השקה ציבורי מאומת. המשתמשים יקבלו הודעה לאחר עדכון רשמי.' },
  de: { development: 'befindet sich in Entwicklung', private_beta: 'ist in einer geschlossenen Testphase verfügbar', public_beta: 'ist in einer öffentlichen Testphase verfügbar', live: 'ist verfügbar', maintenance: 'wird vorübergehend gewartet', paused: 'ist vorübergehend pausiert', retired: 'ist nicht mehr verfügbar', unknown: 'hat keinen bestätigten aktuellen Status', date: 'Veröffentlichtes Datum', noDate: 'Ein bestätigtes öffentliches Startdatum wurde noch nicht veröffentlicht. Nach einer offiziellen Aktualisierung werden die Nutzer informiert.' },
  fr: { development: 'est en cours de développement', private_beta: 'est disponible en phase de test privée', public_beta: 'est disponible en phase de test publique', live: 'est disponible', maintenance: 'est temporairement en maintenance', paused: 'est temporairement suspendu', retired: 'n’est plus disponible', unknown: 'n’a pas de statut actuel confirmé', date: 'Date publiée', noDate: 'Aucune date de lancement public confirmée n’est encore publiée. Les utilisateurs seront informés après une mise à jour officielle.' },
  it: { development: 'è in fase di sviluppo', private_beta: 'è disponibile in prova privata', public_beta: 'è disponibile in prova pubblica', live: 'è disponibile', maintenance: 'è temporaneamente in manutenzione', paused: 'è temporaneamente sospeso', retired: 'non è più disponibile', unknown: 'non ha uno stato attuale confermato', date: 'Data pubblicata', noDate: 'Non è ancora stata pubblicata una data di lancio confermata. Gli utenti saranno informati dopo un aggiornamento ufficiale.' },
  pt: { development: 'está em desenvolvimento', private_beta: 'está disponível em teste privado', public_beta: 'está disponível em teste público', live: 'está disponível', maintenance: 'está temporariamente em manutenção', paused: 'está temporariamente pausado', retired: 'não está mais disponível', unknown: 'não tem estado atual confirmado', date: 'Data publicada', noDate: 'Ainda não foi publicada uma data confirmada de lançamento público. Os usuários serão avisados após uma atualização oficial.' },
  pl: { development: 'jest w trakcie rozwoju', private_beta: 'jest dostępna w zamkniętych testach', public_beta: 'jest dostępna w otwartych testach', live: 'jest dostępna', maintenance: 'jest tymczasowo w konserwacji', paused: 'jest tymczasowo wstrzymana', retired: 'nie jest już dostępna', unknown: 'nie ma potwierdzonego bieżącego stanu', date: 'Opublikowana data', noDate: 'Nie opublikowano jeszcze potwierdzonej daty publicznego uruchomienia. Użytkownicy otrzymają powiadomienie po oficjalnej aktualizacji.' },
  nl: { development: 'is in ontwikkeling', private_beta: 'is beschikbaar in een besloten test', public_beta: 'is beschikbaar in een openbare test', live: 'is beschikbaar', maintenance: 'is tijdelijk in onderhoud', paused: 'is tijdelijk onderbroken', retired: 'is niet meer beschikbaar', unknown: 'heeft geen bevestigde actuele status', date: 'Gepubliceerde datum', noDate: 'Er is nog geen bevestigde openbare lanceringsdatum gepubliceerd. Gebruikers krijgen bericht na een officiële update.' },
  sv: { development: 'är under utveckling', private_beta: 'är tillgänglig i sluten testning', public_beta: 'är tillgänglig i offentlig testning', live: 'är tillgänglig', maintenance: 'är tillfälligt under underhåll', paused: 'är tillfälligt pausad', retired: 'är inte längre tillgänglig', unknown: 'saknar bekräftad aktuell status', date: 'Publicerat datum', noDate: 'Något bekräftat offentligt lanseringsdatum har ännu inte publicerats. Användare meddelas efter en officiell uppdatering.' },
  no: { development: 'er under utvikling', private_beta: 'er tilgjengelig i lukket testing', public_beta: 'er tilgjengelig i offentlig testing', live: 'er tilgjengelig', maintenance: 'er midlertidig under vedlikehold', paused: 'er midlertidig satt på pause', retired: 'er ikke lenger tilgjengelig', unknown: 'har ingen bekreftet nåværende status', date: 'Publisert dato', noDate: 'En bekreftet offentlig lanseringsdato er ennå ikke publisert. Brukerne varsles etter en offisiell oppdatering.' },
  da: { development: 'er under udvikling', private_beta: 'er tilgængelig i lukket test', public_beta: 'er tilgængelig i offentlig test', live: 'er tilgængelig', maintenance: 'er midlertidigt under vedligeholdelse', paused: 'er midlertidigt sat på pause', retired: 'er ikke længere tilgængelig', unknown: 'har ingen bekræftet aktuel status', date: 'Offentliggjort dato', noDate: 'Der er endnu ikke offentliggjort en bekræftet lanceringsdato. Brugerne får besked efter en officiel opdatering.' },
  fi: { development: 'on kehitysvaiheessa', private_beta: 'on käytettävissä suljetussa testissä', public_beta: 'on käytettävissä julkisessa testissä', live: 'on käytettävissä', maintenance: 'on tilapäisesti huollossa', paused: 'on tilapäisesti keskeytetty', retired: 'ei ole enää käytettävissä', unknown: 'ei sisällä vahvistettua nykytilaa', date: 'Julkaistu päivämäärä', noDate: 'Vahvistettua julkista julkaisupäivää ei ole vielä julkaistu. Käyttäjille ilmoitetaan virallisen päivityksen jälkeen.' },
  cs: { development: 'je ve vývoji', private_beta: 'je dostupná v uzavřeném testování', public_beta: 'je dostupná ve veřejném testování', live: 'je dostupná', maintenance: 'je dočasně v údržbě', paused: 'je dočasně pozastavena', retired: 'již není dostupná', unknown: 'nemá potvrzený aktuální stav', date: 'Zveřejněné datum', noDate: 'Potvrzené datum veřejného spuštění zatím nebylo zveřejněno. Uživatelé budou informováni po oficiální aktualizaci.' },
  sk: { development: 'je vo vývoji', private_beta: 'je dostupná v uzavretom testovaní', public_beta: 'je dostupná vo verejnom testovaní', live: 'je dostupná', maintenance: 'je dočasne v údržbe', paused: 'je dočasne pozastavená', retired: 'už nie je dostupná', unknown: 'nemá potvrdený aktuálny stav', date: 'Zverejnený dátum', noDate: 'Potvrdený dátum verejného spustenia zatiaľ nebol zverejnený. Používatelia budú informovaní po oficiálnej aktualizácii.' },
  hu: { development: 'fejlesztés alatt áll', private_beta: 'zárt tesztben érhető el', public_beta: 'nyilvános tesztben érhető el', live: 'elérhető', maintenance: 'átmenetileg karbantartás alatt áll', paused: 'átmenetileg szünetel', retired: 'már nem érhető el', unknown: 'nem rendelkezik megerősített aktuális állapottal', date: 'Közzétett dátum', noDate: 'Megerősített nyilvános indulási dátum még nem jelent meg. A felhasználók hivatalos frissítés után értesítést kapnak.' },
  ro: { development: 'este în dezvoltare', private_beta: 'este disponibilă în testare privată', public_beta: 'este disponibilă în testare publică', live: 'este disponibilă', maintenance: 'este temporar în mentenanță', paused: 'este temporar suspendată', retired: 'nu mai este disponibilă', unknown: 'nu are o stare curentă confirmată', date: 'Data publicată', noDate: 'Nu a fost publicată încă o dată confirmată pentru lansarea publică. Utilizatorii vor fi anunțați după o actualizare oficială.' },
  bg: { development: 'е в процес на разработка', private_beta: 'е достъпна в затворено тестване', public_beta: 'е достъпна в публично тестване', live: 'е достъпна', maintenance: 'временно е в поддръжка', paused: 'временно е спряна', retired: 'вече не е достъпна', unknown: 'няма потвърден текущ статус', date: 'Публикувана дата', noDate: 'Все още няма публикувана потвърдена дата за публично стартиране. Потребителите ще бъдат уведомени след официална актуализация.' },
  sr: { development: 'je u razvoju', private_beta: 'dostupna je u zatvorenom testiranju', public_beta: 'dostupna je u javnom testiranju', live: 'dostupna je', maintenance: 'privremeno je na održavanju', paused: 'privremeno je pauzirana', retired: 'više nije dostupna', unknown: 'nema potvrđen trenutni status', date: 'Objavljen datum', noDate: 'Potvrđen datum javnog pokretanja još nije objavljen. Korisnici će biti obavešteni nakon zvaničnog ažuriranja.' },
  hr: { development: 'je u razvoju', private_beta: 'dostupna je u zatvorenom testiranju', public_beta: 'dostupna je u javnom testiranju', live: 'dostupna je', maintenance: 'privremeno je na održavanju', paused: 'privremeno je pauzirana', retired: 'više nije dostupna', unknown: 'nema potvrđen trenutačni status', date: 'Objavljeni datum', noDate: 'Potvrđeni datum javnog pokretanja još nije objavljen. Korisnici će biti obaviješteni nakon službenog ažuriranja.' },
  sl: { development: 'je v razvoju', private_beta: 'je na voljo v zaprtem preizkusu', public_beta: 'je na voljo v javnem preizkusu', live: 'je na voljo', maintenance: 'je začasno v vzdrževanju', paused: 'je začasno ustavljena', retired: 'ni več na voljo', unknown: 'nima potrjenega trenutnega stanja', date: 'Objavljeni datum', noDate: 'Potrjen datum javnega zagona še ni objavljen. Uporabniki bodo obveščeni po uradni posodobitvi.' },
  el: { development: 'βρίσκεται σε ανάπτυξη', private_beta: 'είναι διαθέσιμη σε κλειστή δοκιμή', public_beta: 'είναι διαθέσιμη σε δημόσια δοκιμή', live: 'είναι διαθέσιμη', maintenance: 'βρίσκεται προσωρινά σε συντήρηση', paused: 'έχει τεθεί προσωρινά σε παύση', retired: 'δεν είναι πλέον διαθέσιμη', unknown: 'δεν έχει επιβεβαιωμένη τρέχουσα κατάσταση', date: 'Δημοσιευμένη ημερομηνία', noDate: 'Δεν έχει δημοσιευτεί ακόμη επιβεβαιωμένη ημερομηνία δημόσιας κυκλοφορίας. Οι χρήστες θα ενημερωθούν μετά από επίσημη ενημέρωση.' },
  ka: { development: 'დამუშავების პროცესშია', private_beta: 'ხელმისაწვდომია დახურულ ტესტირებაში', public_beta: 'ხელმისაწვდომია საჯარო ტესტირებაში', live: 'ხელმისაწვდომია', maintenance: 'დროებით ტექნიკურ მომსახურებაზეა', paused: 'დროებით შეჩერებულია', retired: 'აღარ არის ხელმისაწვდომი', unknown: 'არ აქვს დადასტურებული მიმდინარე სტატუსი', date: 'გამოქვეყნებული თარიღი', noDate: 'საჯარო გაშვების დადასტურებული თარიღი ჯერ არ გამოქვეყნებულა. მომხმარებლებს ოფიციალური განახლების შემდეგ ეცნობებათ.' },
  az: { development: 'hazırlanma mərhələsindədir', private_beta: 'qapalı sınaqda əlçatandır', public_beta: 'açıq sınaqda əlçatandır', live: 'əlçatandır', maintenance: 'müvəqqəti texniki xidmətdədir', paused: 'müvəqqəti dayandırılıb', retired: 'artıq əlçatan deyil', unknown: 'təsdiqlənmiş cari statusu yoxdur', date: 'Dərc edilmiş tarix', noDate: 'Təsdiqlənmiş ictimai istifadəyə verilmə tarixi hələ dərc edilməyib. Rəsmi yeniləmədən sonra istifadəçilərə bildiriş göndəriləcək.' },
  kk: { development: 'әзірлену үстінде', private_beta: 'жабық сынақта қолжетімді', public_beta: 'ашық сынақта қолжетімді', live: 'қолжетімді', maintenance: 'уақытша техникалық қызметте', paused: 'уақытша тоқтатылған', retired: 'енді қолжетімді емес', unknown: 'расталған ағымдағы мәртебесі жоқ', date: 'Жарияланған күн', noDate: 'Расталған жалпыға қолжетімді іске қосу күні әлі жарияланған жоқ. Ресми жаңартудан кейін пайдаланушыларға хабарланады.' },
  ja: { development: '開発中です', private_beta: '限定テストで利用できます', public_beta: '公開テストで利用できます', live: '利用できます', maintenance: '一時的にメンテナンス中です', paused: '一時停止中です', retired: '現在は提供されていません', unknown: '確認済みの現在状況がありません', date: '公開日', noDate: '確認済みの一般公開日はまだ発表されていません。正式な更新後に利用者へ通知されます。' },
  ko: { development: '개발 중입니다', private_beta: '비공개 시험에서 사용할 수 있습니다', public_beta: '공개 시험에서 사용할 수 있습니다', live: '사용할 수 있습니다', maintenance: '일시적으로 점검 중입니다', paused: '일시 중지되었습니다', retired: '더 이상 제공되지 않습니다', unknown: '확인된 현재 상태가 없습니다', date: '공개된 날짜', noDate: '확인된 공개 출시일은 아직 발표되지 않았습니다. 공식 업데이트 후 사용자에게 알림이 제공됩니다.' },
})

export function buildQl7SupportRuntimeClaim(capability = {}, locale = 'en') {
  const row = normalizeQl7SupportRuntimeCapability(capability, capability?.capabilityId)
  const lang = str(locale).toLowerCase().split(/[-_]/u)[0]
  const copy = STATE_TEXT[lang] || STATE_TEXT.en
  const state = copy[row.status] || copy.unknown
  const date = row.publishedLaunchAt
  const label = getQl7SupportTopicLabel(row.capabilityId, lang) || row.capabilityId
  let localizedDate = ''
  if (date) {
    try { localizedDate = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date)) } catch { localizedDate = String(date).slice(0, 10) }
  }
  const text = date
    ? `${label} ${state}. ${copy.date}: ${localizedDate}.`
    : `${label} ${state}. ${copy.noDate}`
  return Object.freeze({ capabilityId: row.capabilityId, status: row.status, text, publishedLaunchAt: date, inventedDate: false, source: row.source, asOf: row.asOf })
}
import {getQl7SupportTopicLabel} from './ecosystemCatalog.js'
