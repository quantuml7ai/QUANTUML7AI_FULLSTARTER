import crypto from 'node:crypto'
import {QL7_SUPPORT_ALL_LOCALES} from '../config/behaviorManifest.js'
import {
  getQl7SupportDomain,
  getQl7SupportReadCollections,
  getQl7SupportTopicLabel,
} from '../ecosystemCatalog.js'
import {ql7Arr, ql7NormalizeSpaces, ql7Str} from '../internal/text.js'
import {getQl7SupportCanonicalDomain} from './domainRegistry.js'
import {QL7_SUPPORT_DOMAIN_TOPICS} from './domainRegistry.js'

export const QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION = '5.1.0'
export const QL7_SUPPORT_KNOWLEDGE_NODE_SCHEMA_VERSION = '5.1.0'
export const QL7_SUPPORT_KNOWLEDGE_GRAPH_OWNER = 'ql7-support.knowledge.graph'

export const QL7_SUPPORT_KNOWLEDGE_NODE_KINDS = Object.freeze([
  'DomainNode',
  'MicrodomainNode',
  'CapabilityNode',
  'HowToFlow',
  'StatusContract',
  'IncidentFlow',
  'LimitContract',
  'SafetyBoundary',
  'PrivacyBoundary',
  'AvailabilityState',
  'RoadmapState',
  'CTAContract',
  'SourceReceipt',
  'RealizationPlan',
])

export const QL7_SUPPORT_KNOWLEDGE_INTENT_CONTRACTS = Object.freeze([
  'overview',
  'purpose',
  'user_value',
  'open',
  'start',
  'how_to',
  'availability',
  'limitations',
  'prerequisites',
  'safety',
  'privacy',
  'self_status',
  'incident',
  'purchase_cost',
  'earning_credit',
  'gift_transfer_sale',
  'developers_mission',
  'roadmap',
  'action',
])

const REQUIRED_NODE_FIELDS = Object.freeze([
  'nodeId',
  'schemaVersion',
  'domainId',
  'microdomainId',
  'canonicalName',
  'aliasesByLocale',
  'purpose',
  'userValue',
  'capabilities',
  'limitations',
  'prerequisites',
  'howToSteps',
  'statusIntents',
  'incidentIntents',
  'privacyNotes',
  'safetyNotes',
  'availability',
  'availabilityEvidence',
  'roadmapEvidence',
  'forbiddenClaims',
  'ctaIds',
  'sourceRefs',
  'lastVerifiedAt',
  'owner',
])

const NODE_KIND_MICRODOMAIN = Object.freeze({
  HowToFlow: 'how_to',
  StatusContract: 'self_status',
  IncidentFlow: 'incident',
  LimitContract: 'limitations',
  SafetyBoundary: 'safety',
  PrivacyBoundary: 'privacy',
  AvailabilityState: 'availability',
  RoadmapState: 'roadmap',
  CTAContract: 'action',
  SourceReceipt: 'source_evidence',
  RealizationPlan: 'realization',
})

const AVAILABILITY = Object.freeze({
  exchange: 'partially_available',
  exchange_ai: 'partially_available',
  gameverse: 'partially_available',
  metastudio: 'planned',
  metaverse: 'planned',
  quantum_zigzag: 'planned',
  ql7_blockchain: 'planned',
})

const FUTURE_DOMAINS = Object.freeze({
  quantum_zigzag: Object.freeze({
    canonicalName: 'Quantum Zigzag',
    aliases: Object.freeze([
      'Quantum Zigzag', 'Zigzag', 'Zig Zag', 'Квантум Зигзаг', 'Зигзаг',
      'цифровая торговля', 'digital commerce', 'future marketplace',
    ]),
    purpose: 'future digital-commerce direction for stores, goods, services and QCoin commerce',
    userValue: 'a planned path for buying, selling and operating a digital storefront after verified release',
    capabilities: Object.freeze([
      'planned digital storefronts',
      'planned commerce between buyers and sellers',
      'planned QCoin commerce scenarios',
    ]),
    sourceRefs: Object.freeze([
      'components/i18n.source.js:quantum_wallet_action_zigzag_description',
      'docs/mobile-payment-compliance.md',
      'docs/mobile-shell.md',
    ]),
  }),
  ql7_blockchain: Object.freeze({
    canonicalName: 'L7 Blockchain',
    aliases: Object.freeze([
      'L7 Blockchain', 'QL7 Blockchain', 'L7 блокчейн', 'QL7 блокчейн',
      'блокчейн L7', 'blockchain L7',
    ]),
    purpose: 'future direction for verifiable digital history, ownership and ecosystem events',
    userValue: 'a planned trust layer; it is not represented as a released chain or as a promise of launch timing',
    capabilities: Object.freeze([
      'planned verifiable ownership history',
      'planned digital-event history',
      'planned ecosystem trust infrastructure',
    ]),
    sourceRefs: Object.freeze([
      'components/i18n.source.js:about_sections.blockchain',
      'components/i18n.source.js:quantum_wallet_blockchain',
      'docs/mobile-shell.md',
    ]),
  }),
})

const GRAPH_DOMAIN_IDS = Object.freeze([
  ...new Set([...QL7_SUPPORT_DOMAIN_TOPICS, ...Object.keys(FUTURE_DOMAINS)]),
])

const VERIFIED_AT = '2026-08-15T00:00:00.000Z'
const AVAILABILITY_VALUES = Object.freeze(new Set([
  'available',
  'partially_available',
  'planned',
  'unavailable',
  'unknown',
]))

const PLANNED_STATUS_COPY = Object.freeze({
  en: '{label} is registered as a planned direction. There is no confirmed public launch date. I can explain the verified roadmap boundary, but I will not describe unreleased mechanics as active.',
  ru: '{label} зарегистрирован как будущее направление. Подтверждённой публичной даты запуска нет. Я могу объяснить проверенную границу дорожной карты, но не буду выдавать невыпущенные механики за действующие.',
  uk: '{label} зареєстровано як майбутній напрям. Підтвердженої публічної дати запуску немає. Я можу пояснити перевірену межу дорожньої карти, але не називатиму невипущені механіки чинними.',
  es: '{label} está registrado como una dirección futura. No hay una fecha pública de lanzamiento confirmada. Puedo explicar el límite verificado de la hoja de ruta, pero no presentaré mecanismos aún no publicados como activos.',
  tr: '{label} gelecekteki bir yön olarak kayıtlıdır. Doğrulanmış herkese açık bir çıkış tarihi yoktur. Doğrulanmış yol haritası sınırını açıklayabilirim, ancak yayımlanmamış işlevleri etkinmiş gibi anlatmam.',
  ar: '{label} مسجل بوصفه اتجاهاً مستقبلياً. لا يوجد تاريخ إطلاق عام مؤكد. يمكنني شرح حدود خارطة الطريق الموثقة، لكنني لن أصف آليات لم تُطلق بعد على أنها فعالة.',
  zh: '{label} 已登记为未来方向。目前没有经确认的公开上线日期。我可以说明已验证的路线图边界，但不会把尚未发布的机制描述成已启用。',
  he: '{label} רשום ככיוון עתידי. אין תאריך השקה ציבורי מאומת. אפשר להסביר את גבולות מפת הדרכים המאומתים, אך לא אתאר מנגנונים שטרם פורסמו כפעילים.',
  de: '{label} ist als künftige Richtung registriert. Ein bestätigtes öffentliches Startdatum gibt es nicht. Ich kann die belegte Roadmap-Grenze erklären, werde aber unveröffentlichte Funktionen nicht als aktiv darstellen.',
  fr: '{label} est enregistré comme une orientation future. Aucune date publique de lancement n’est confirmée. Je peux expliquer la limite vérifiée de la feuille de route, sans présenter comme actifs des mécanismes non publiés.',
  it: '{label} è registrato come direzione futura. Non esiste una data pubblica di lancio confermata. Posso spiegare il limite verificato della roadmap, senza descrivere come attivi meccanismi non ancora pubblicati.',
  pt: '{label} está registrado como uma direção futura. Não há data pública de lançamento confirmada. Posso explicar o limite verificado do roteiro, mas não apresentarei mecanismos ainda não lançados como ativos.',
  pl: '{label} jest zarejestrowany jako przyszły kierunek. Nie ma potwierdzonej publicznej daty uruchomienia. Mogę wyjaśnić zweryfikowane granice planu, ale nie przedstawię niewydanych mechanizmów jako aktywnych.',
  nl: '{label} staat geregistreerd als toekomstige richting. Er is geen bevestigde openbare lanceringsdatum. Ik kan de geverifieerde grens van de roadmap uitleggen, maar niet-uitgebrachte functies niet als actief voorstellen.',
  sv: '{label} är registrerat som en framtida inriktning. Det finns inget bekräftat offentligt lanseringsdatum. Jag kan förklara den verifierade gränsen i färdplanen, men beskriver inte outgivna funktioner som aktiva.',
  no: '{label} er registrert som en fremtidig retning. Det finnes ingen bekreftet offentlig lanseringsdato. Jeg kan forklare den verifiserte grensen i veikartet, men beskriver ikke uutgitte funksjoner som aktive.',
  da: '{label} er registreret som en fremtidig retning. Der findes ingen bekræftet offentlig lanceringsdato. Jeg kan forklare den verificerede grænse i køreplanen, men beskriver ikke uudgivne funktioner som aktive.',
  fi: '{label} on rekisteröity tulevaksi suunnaksi. Vahvistettua julkista julkaisupäivää ei ole. Voin selittää varmennetun etenemissuunnitelman rajat, mutta en kuvaa julkaisemattomia toimintoja aktiivisiksi.',
  cs: '{label} je vedeno jako budoucí směr. Potvrzené veřejné datum spuštění neexistuje. Mohu vysvětlit ověřenou hranici plánu, ale nebudu nevydané mechanismy popisovat jako aktivní.',
  sk: '{label} je vedené ako budúci smer. Potvrdený verejný dátum spustenia neexistuje. Môžem vysvetliť overenú hranicu plánu, ale nevydané mechanizmy nebudem opisovať ako aktívne.',
  hu: '{label} jövőbeli irányként van nyilvántartva. Nincs megerősített nyilvános indulási dátum. El tudom magyarázni az ellenőrzött ütemterv határát, de a még ki nem adott működést nem állítom be aktívként.',
  ro: '{label} este înregistrat ca direcție viitoare. Nu există o dată publică de lansare confirmată. Pot explica limita verificată a foii de parcurs, dar nu voi prezenta mecanisme nelansate drept active.',
  bg: '{label} е регистриран като бъдещо направление. Няма потвърдена публична дата за стартиране. Мога да обясня проверената граница на пътната карта, но няма да представям неиздадени механики като активни.',
  sr: '{label} je registrovan kao budući pravac. Ne postoji potvrđen javni datum pokretanja. Mogu da objasnim proverenu granicu plana, ali neću neobjavljene mehanizme predstavljati kao aktivne.',
  hr: '{label} je registriran kao budući smjer. Ne postoji potvrđen javni datum pokretanja. Mogu objasniti provjerenu granicu plana, ali neću neobjavljene mehanizme prikazivati kao aktivne.',
  sl: '{label} je registriran kot prihodnja smer. Potrjen javni datum zagona ne obstaja. Pojasnim lahko preverjeno mejo načrta, vendar neobjavljenih mehanizmov ne bom predstavljal kot dejavne.',
  el: 'Το {label} είναι καταχωρισμένο ως μελλοντική κατεύθυνση. Δεν υπάρχει επιβεβαιωμένη δημόσια ημερομηνία κυκλοφορίας. Μπορώ να εξηγήσω το επαληθευμένο όριο του οδικού χάρτη, αλλά δεν θα παρουσιάσω μη δημοσιευμένους μηχανισμούς ως ενεργούς.',
  ka: '{label} რეგისტრირებულია როგორც მომავალი მიმართულება. დადასტურებული საჯარო გაშვების თარიღი არ არსებობს. შემიძლია ავხსნა შემოწმებული საგზაო რუკის საზღვარი, მაგრამ გამოუქვეყნებელ მექანიზმებს მოქმედად არ წარმოვადგენ.',
  az: '{label} gələcək istiqamət kimi qeydə alınıb. Təsdiqlənmiş açıq buraxılış tarixi yoxdur. Təsdiqlənmiş yol xəritəsi sərhədini izah edə bilərəm, lakin buraxılmamış mexanizmləri aktiv kimi təqdim etmərəm.',
  kk: '{label} болашақ бағыт ретінде тіркелген. Расталған ашық іске қосу күні жоқ. Тексерілген жол картасының шегін түсіндіре аламын, бірақ шығарылмаған тетіктерді жұмыс істеп тұр деп көрсетпеймін.',
  ja: '{label} は将来の方向性として登録されています。確認済みの公開開始日はありません。検証されたロードマップの範囲は説明できますが、未公開の仕組みを稼働中とは説明しません。',
  ko: '{label}은 향후 방향으로 등록되어 있습니다. 확인된 공개 출시일은 없습니다. 검증된 로드맵의 범위는 설명할 수 있지만, 아직 출시되지 않은 기능을 활성 상태로 설명하지 않습니다.',
})

const PLANNED_STATUS_PREFIX = Object.freeze({
  en: 'Current roadmap status:', ru: 'Текущий статус дорожной карты:', uk: 'Поточний статус дорожньої карти:',
  es: 'Estado actual de la hoja de ruta:', tr: 'Güncel yol haritası durumu:', ar: 'حالة خارطة الطريق الحالية:',
  zh: '当前路线图状态：', he: 'מצב מפת הדרכים כעת:', de: 'Aktueller Roadmap-Status:',
  fr: 'État actuel de la feuille de route :', it: 'Stato attuale della roadmap:', pt: 'Estado atual do roteiro:',
  pl: 'Bieżący stan planu:', nl: 'Huidige roadmapstatus:', sv: 'Aktuell status i färdplanen:',
  no: 'Gjeldende status i veikartet:', da: 'Aktuel status i køreplanen:', fi: 'Etenemissuunnitelman nykytila:',
  cs: 'Aktuální stav plánu:', sk: 'Aktuálny stav plánu:', hu: 'Az ütemterv jelenlegi állapota:',
  ro: 'Starea actuală a foii de parcurs:', bg: 'Текущ статус на пътната карта:', sr: 'Trenutni status plana:',
  hr: 'Trenutačni status plana:', sl: 'Trenutno stanje načrta:', el: 'Τρέχουσα κατάσταση οδικού χάρτη:',
  ka: 'საგზაო რუკის მიმდინარე სტატუსი:', az: 'Yol xəritəsinin cari vəziyyəti:', kk: 'Жол картасының ағымдағы күйі:',
  ja: '現在のロードマップ状況：', ko: '현재 로드맵 상태:',
})

function sha256(value = '') {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex')
}

function slug(value = '') {
  return ql7Str(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || sha256(value).slice(0, 16)
}

function frozenRows(values = []) {
  return Object.freeze([...new Set(ql7Arr(values).map(ql7Str).filter(Boolean))])
}

function localizedAliases(domainId = '', canonicalName = '', baseAliases = []) {
  return Object.freeze(Object.fromEntries(QL7_SUPPORT_ALL_LOCALES.map((locale) => {
    const label = FUTURE_DOMAINS[domainId]
      ? canonicalName
      : getQl7SupportTopicLabel(domainId, locale)
    return [locale, frozenRows([canonicalName, label, ...baseAliases])]
  })))
}

function domainDescriptor(domainId = '') {
  const future = FUTURE_DOMAINS[domainId]
  if (future) {
    return Object.freeze({
      domainId,
      canonicalName: future.canonicalName,
      aliases: future.aliases,
      purpose: future.purpose,
      userValue: future.userValue,
      capabilities: future.capabilities,
      limitations: Object.freeze([
        'availability is planned and must be checked from current product evidence',
        'no launch date, released mechanism or transaction capability may be invented',
      ]),
      prerequisites: Object.freeze(['a verified public release or runtime availability receipt']),
      readCollections: Object.freeze([]),
      ctaIds: Object.freeze(['roadmap']),
      sourceRefs: future.sourceRefs,
      availability: 'planned',
    })
  }

  const canonical = getQl7SupportCanonicalDomain(domainId, 'en')
  const catalog = getQl7SupportDomain(domainId)
  const collections = getQl7SupportReadCollections(domainId)
  const capabilities = frozenRows(canonical.capabilities)
  const ctaIds = frozenRows([canonical.cta?.routeId])
  const sourceRefs = frozenRows([
    `lib/ql7-support/ecosystemCatalog.js:${domainId}`,
    canonical.cta?.routeId ? `lib/ql7-support/topicActionRegistry.js:${canonical.cta.routeId}` : '',
    ...collections.map((collection) => `mongo-read:${collection}`),
  ])
  return Object.freeze({
    domainId,
    canonicalName: canonical.label || catalog.label || domainId,
    aliases: frozenRows([...(catalog.aliases || []), canonical.label]),
    purpose: canonical.scope || `verified support knowledge for ${domainId}`,
    userValue: `understand and use ${canonical.label || domainId} without mixing unverified account facts or unrelated domains`,
    capabilities: capabilities.length ? capabilities : Object.freeze(['verified knowledge and bounded support guidance']),
    limitations: frozenRows([
      ...(canonical.boundaries || []),
      'personal facts require a verified read-only adapter receipt',
      'support does not perform a business write from a knowledge answer',
    ]),
    prerequisites: frozenRows([
      canonical.authRequired ? 'verified actor for personal status' : 'no account identity for public overview',
      'current source evidence for runtime status or roadmap claims',
    ]),
    readCollections: collections,
    ctaIds: ctaIds.length ? ctaIds : Object.freeze(['support_system']),
    sourceRefs,
    availability: AVAILABILITY[domainId] || 'available',
  })
}

function sourceEvidence(descriptor = {}) {
  const evidenceId = `availability:${descriptor.domainId}:${descriptor.availability}`
  const body = {
    schema: 'ql7.support.knowledge-source-receipt',
    schemaVersion: QL7_SUPPORT_KNOWLEDGE_NODE_SCHEMA_VERSION,
    evidenceId,
    domainId: descriptor.domainId,
    availability: descriptor.availability,
    sourceRefs: descriptor.sourceRefs,
    verifiedAt: VERIFIED_AT,
    owner: QL7_SUPPORT_KNOWLEDGE_GRAPH_OWNER,
  }
  return Object.freeze({ ...body, evidenceHash: sha256(JSON.stringify(body)) })
}

function roadmapEvidence(descriptor = {}) {
  if (!['planned', 'partially_available'].includes(descriptor.availability)) return Object.freeze([])
  const body = {
    schema: 'ql7.support.knowledge-roadmap-receipt',
    schemaVersion: QL7_SUPPORT_KNOWLEDGE_NODE_SCHEMA_VERSION,
    domainId: descriptor.domainId,
    state: descriptor.availability,
    launchDate: null,
    sourceRefs: descriptor.sourceRefs,
    verifiedAt: VERIFIED_AT,
  }
  return Object.freeze([Object.freeze({ ...body, evidenceHash: sha256(JSON.stringify(body)) })])
}

function defaultHowTo(descriptor = {}) {
  const action = descriptor.ctaIds[0]
  return frozenRows([
    `resolve the ${descriptor.domainId} intent and microdomain before choosing an action`,
    `open only the registered action ${action} when it is available for the selected domain`,
    'use a verified read-only receipt for personal status and keep public knowledge separate',
  ])
}

function realizationCapacity(descriptor = {}) {
  const axes = Object.freeze({
    userSpecificAnchor: 17,
    rhetoricalShape: 12,
    factOrder: Math.max(8, Math.min(24, descriptor.capabilities.length * 8)),
    explanationDepth: 4,
    transitionPolicy: 7,
    sentenceRhythm: 5,
    closingPolicy: 6,
  })
  const theoreticalCapacity = Object.values(axes).reduce((total, count) => total * count, 1)
  const conservativeConstraintRatio = 0.2
  return Object.freeze({
    axes,
    theoreticalCapacity,
    conservativeConstraintRatio,
    theoreticalValidCapacity: Math.floor(theoreticalCapacity * conservativeConstraintRatio),
    actualGeneratedCount: 0,
    actualDistinctCount: 0,
    actualProofComplete: false,
  })
}

function buildKnowledgeNode({ descriptor, nodeKind, microdomainId, capability = '' }) {
  const domainId = descriptor.domainId
  const selectedMicrodomain = ql7Str(microdomainId || NODE_KIND_MICRODOMAIN[nodeKind] || 'overview')
  const suffix = nodeKind === 'DomainNode'
    ? 'domain'
    : nodeKind === 'CapabilityNode'
      ? `capability.${slug(capability)}`
      : `${slug(nodeKind)}.${slug(selectedMicrodomain)}`
  const capacity = realizationCapacity(descriptor)
  const sourceReceipt = sourceEvidence(descriptor)
  const body = {
    schema: 'ql7.support.knowledge-node',
    schemaVersion: QL7_SUPPORT_KNOWLEDGE_NODE_SCHEMA_VERSION,
    graphVersion: QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION,
    nodeKind,
    nodeId: `knowledge.${domainId}.${suffix}`,
    domainId,
    microdomainId: `${domainId}.${selectedMicrodomain}`,
    canonicalName: descriptor.canonicalName,
    aliasesByLocale: localizedAliases(domainId, descriptor.canonicalName, descriptor.aliases),
    purpose: nodeKind === 'CapabilityNode' ? capability : descriptor.purpose,
    userValue: descriptor.userValue,
    capabilities: nodeKind === 'CapabilityNode' ? frozenRows([capability]) : descriptor.capabilities,
    limitations: descriptor.limitations,
    prerequisites: descriptor.prerequisites,
    howToSteps: defaultHowTo(descriptor),
    statusIntents: frozenRows([
      `${domainId}.availability`,
      `${domainId}.self_status`,
      `${domainId}.runtime_status`,
    ]),
    incidentIntents: frozenRows([
      `${domainId}.incident`,
      `${domainId}.unavailable`,
      `${domainId}.inconsistent`,
    ]),
    privacyNotes: frozenRows([
      'never request or expose secrets, raw database documents or another actor data',
      'personal status requires verified actor scope and a redacted read-only projection',
    ]),
    safetyNotes: frozenRows([
      'do not convert a knowledge answer into a business write',
      'do not invent availability, price, entitlement, roadmap timing or guaranteed outcome',
    ]),
    availability: descriptor.availability,
    availabilityEvidence: Object.freeze([sourceReceipt]),
    roadmapEvidence: roadmapEvidence(descriptor),
    forbiddenClaims: frozenRows([
      'unverified personal status',
      'invented launch date',
      'unsupported capability',
      'guaranteed financial result',
      'cross-domain account fact',
    ]),
    ctaIds: descriptor.ctaIds,
    sourceRefs: descriptor.sourceRefs,
    lastVerifiedAt: VERIFIED_AT,
    owner: QL7_SUPPORT_KNOWLEDGE_GRAPH_OWNER,
    realizationCapacity: capacity,
  }
  const nodeHash = sha256(JSON.stringify(body))
  return Object.freeze({ ...body, nodeHash })
}

function buildDomainNodes(domainId = '') {
  const descriptor = domainDescriptor(domainId)
  const nodes = [buildKnowledgeNode({ descriptor, nodeKind: 'DomainNode', microdomainId: 'overview' })]
  for (const intentId of QL7_SUPPORT_KNOWLEDGE_INTENT_CONTRACTS) {
    nodes.push(buildKnowledgeNode({ descriptor, nodeKind: 'MicrodomainNode', microdomainId: intentId }))
  }
  for (const capability of descriptor.capabilities) {
    nodes.push(buildKnowledgeNode({ descriptor, nodeKind: 'CapabilityNode', microdomainId: 'capability', capability }))
  }
  for (const nodeKind of QL7_SUPPORT_KNOWLEDGE_NODE_KINDS) {
    if (['DomainNode', 'MicrodomainNode', 'CapabilityNode'].includes(nodeKind)) continue
    nodes.push(buildKnowledgeNode({ descriptor, nodeKind }))
  }
  return nodes
}

const NODES = Object.freeze(GRAPH_DOMAIN_IDS.flatMap(buildDomainNodes))
const NODE_BY_ID = new Map(NODES.map((node) => [node.nodeId, node]))
const DOMAIN_NODE_BY_ID = new Map(
  NODES.filter((node) => node.nodeKind === 'DomainNode').map((node) => [node.domainId, node]),
)
const MICRODOMAIN_NODE_BY_ID = new Map(
  NODES.filter((node) => node.nodeKind === 'MicrodomainNode').map((node) => [node.microdomainId, node]),
)

export const QL7_SUPPORT_KNOWLEDGE_GRAPH = Object.freeze({
  schema: 'ql7.support.knowledge-graph',
  schemaVersion: QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION,
  owner: QL7_SUPPORT_KNOWLEDGE_GRAPH_OWNER,
  locales: QL7_SUPPORT_ALL_LOCALES,
  domainIds: GRAPH_DOMAIN_IDS,
  intentContracts: QL7_SUPPORT_KNOWLEDGE_INTENT_CONTRACTS,
  nodes: NODES,
  graphHash: sha256(JSON.stringify(NODES.map((node) => node.nodeHash))),
})

export function getQl7SupportKnowledgeNode(nodeId = '') {
  return NODE_BY_ID.get(ql7Str(nodeId)) || null
}

export function validateQl7SupportKnowledgeNode(node = {}) {
  const failures = []
  if (node.schema !== 'ql7.support.knowledge-node') failures.push('invalid_schema')
  if (node.schemaVersion !== QL7_SUPPORT_KNOWLEDGE_NODE_SCHEMA_VERSION) failures.push('unknown_schema_version')
  if (!QL7_SUPPORT_KNOWLEDGE_NODE_KINDS.includes(node.nodeKind)) failures.push('invalid_node_kind')
  for (const field of REQUIRED_NODE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(node, field)) failures.push(`missing_field:${field}`)
  }
  if (!AVAILABILITY_VALUES.has(node.availability)) failures.push('invalid_availability')
  if (!node.sourceRefs?.length) failures.push('missing_source_refs')
  if (!node.availabilityEvidence?.length) failures.push('missing_availability_evidence')
  const body = { ...node }
  delete body.nodeHash
  if (!node.nodeHash || sha256(JSON.stringify(body)) !== node.nodeHash) failures.push('node_hash_mismatch')
  for (const receipt of node.availabilityEvidence || []) {
    const receiptBody = { ...receipt }
    delete receiptBody.evidenceHash
    if (!receipt.evidenceHash || sha256(JSON.stringify(receiptBody)) !== receipt.evidenceHash) failures.push('availability_evidence_hash_mismatch')
  }
  return Object.freeze({ ok: failures.length === 0, failures: Object.freeze(failures) })
}

export function getQl7SupportDomainKnowledgeNode(domainId = '') {
  return DOMAIN_NODE_BY_ID.get(ql7Str(domainId)) || null
}

export function getQl7SupportMicrodomainKnowledgeNode(domainId = '', intentId = 'overview') {
  return MICRODOMAIN_NODE_BY_ID.get(`${ql7Str(domainId)}.${ql7Str(intentId)}`) || null
}

export function realizeQl7SupportPlannedKnowledgeNode(node = {}, locale = 'en') {
  const language = QL7_SUPPORT_ALL_LOCALES.includes(ql7Str(locale)) ? ql7Str(locale) : 'en'
  const label = ql7Str(node.aliasesByLocale?.[language]?.[0] || node.canonicalName || node.domainId)
  const template = PLANNED_STATUS_COPY[language]
  if (!template) throw new Error(`knowledge_planned_copy_missing:${language}`)
  const prefix = PLANNED_STATUS_PREFIX[language]
  if (!prefix) throw new Error(`knowledge_planned_prefix_missing:${language}`)
  const text = ql7NormalizeSpaces(`${prefix} ${template.replaceAll('{label}', label)}`)
  return Object.freeze({
    text,
    paragraphs: Object.freeze([text]),
    locale: language,
    nodeId: ql7Str(node.nodeId),
    availability: ql7Str(node.availability),
    sourceReceipts: Object.freeze([...(node.availabilityEvidence || []), ...(node.roadmapEvidence || [])]),
  })
}

function normalizeAlias(value = '') {
  return ql7NormalizeSpaces(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}_]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

function containsBoundedAlias(input = '', alias = '', strongAlias = false) {
  if (!input || !alias) return false
  if (` ${input} `.includes(` ${alias} `)) return true
  // Product names can be immediately followed by CJK text after punctuation is removed.
  return strongAlias && input.includes(alias)
}

const DISTINCTIVE_PRODUCT_ALIASES = Object.freeze(new Set([
  'cryptoradar', 'crypto radar', 'qcoin', 'meta market', 'metamarket',
  'battlecoin', 'battle coin', 'battle chat', 'gameverse', 'metastudio',
  'quantum wallet', 'quantum zigzag', 'exchange ai', 'ai box',
  'l7 blockchain', 'ql7 blockchain', 'quantum family', 'geodetect',
]))

export function resolveQl7SupportKnowledgeAlias({ text = '', locale = 'en' } = {}) {
  const input = normalizeAlias(text)
  const candidates = []
  if (input) {
    for (const node of DOMAIN_NODE_BY_ID.values()) {
      const aliases = node.aliasesByLocale[locale] || []
      const canonicalAlias = normalizeAlias(node.canonicalName)
      const localizedLabel = normalizeAlias(
        FUTURE_DOMAINS[node.domainId]
          ? node.canonicalName
          : getQl7SupportTopicLabel(node.domainId, locale),
      )
      let best = 0
      let matchedAlias = ''
      let matchedExact = false
      let matchedStrong = false
      for (const alias of aliases) {
        const clean = normalizeAlias(alias)
        if (!clean || clean.length < 2) continue
        const exact = input === clean
        const strongAlias = clean === canonicalAlias || clean === localizedLabel || DISTINCTIVE_PRODUCT_ALIASES.has(clean)
        const bounded = containsBoundedAlias(input, clean, strongAlias)
        const score = exact
          ? (strongAlias ? 220 : 180) + clean.length
          : strongAlias && bounded
            ? 120 + Math.min(60, clean.length)
            : bounded
              ? 20 + Math.min(20, clean.length)
              : 0
        if (score > best) {
          best = score
          matchedAlias = alias
          matchedExact = exact
          matchedStrong = strongAlias
        }
      }
      if (best > 0) candidates.push(Object.freeze({
        domainId: node.domainId,
        nodeId: node.nodeId,
        score: best,
        matchedAlias,
        matchKind: matchedExact ? 'exact' : 'bounded',
        aliasStrength: matchedStrong ? 'canonical' : 'secondary',
        availability: node.availability,
      }))
    }
  }
  candidates.sort((left, right) => right.score - left.score || left.domainId.localeCompare(right.domainId))
  const eligible = candidates.filter((candidate) => (
    candidate.aliasStrength === 'canonical' || candidate.matchKind === 'exact'
  ))
  const top = eligible[0]
  const next = eligible[1]
  const selected = top && (
    top.aliasStrength === 'canonical' ||
    !next ||
    top.score - Number(next.score || 0) >= 20
  ) ? top : null
  const body = {
    schema: 'ql7.support.knowledge-alias-receipt',
    schemaVersion: QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION,
    locale,
    inputHash: sha256(input),
    candidates: Object.freeze(candidates.slice(0, 8)),
    decision: selected ? 'selected' : candidates.length ? 'clarification_required' : 'not_found',
    selectedDomainId: selected?.domainId || '',
    selectedNodeId: selected?.nodeId || '',
    selectedMatchKind: selected?.matchKind || '',
    selectedAliasStrength: selected?.aliasStrength || '',
    sourceGated: Boolean(selected && ['planned', 'partially_available'].includes(selected.availability)),
    owner: QL7_SUPPORT_KNOWLEDGE_GRAPH_OWNER,
  }
  return Object.freeze({ ...body, receiptHash: sha256(JSON.stringify(body)) })
}

export function auditQl7SupportKnowledgeGraph() {
  const failures = []
  const domainKindCoverage = new Map()
  for (const node of NODES) {
    for (const field of REQUIRED_NODE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(node, field)) failures.push(`${node.nodeId}:missing:${field}`)
    }
    if (!QL7_SUPPORT_KNOWLEDGE_NODE_KINDS.includes(node.nodeKind)) failures.push(`${node.nodeId}:invalid_kind`)
    if (!AVAILABILITY_VALUES.has(node.availability)) failures.push(`${node.nodeId}:invalid_availability`)
    if (!node.sourceRefs.length) failures.push(`${node.nodeId}:missing_source_refs`)
    if (!node.availabilityEvidence.length) failures.push(`${node.nodeId}:missing_availability_evidence`)
    if (node.realizationCapacity.theoreticalValidCapacity < 10000) failures.push(`${node.nodeId}:capacity_below_10000`)
    for (const locale of QL7_SUPPORT_ALL_LOCALES) {
      if (!node.aliasesByLocale[locale]?.length) failures.push(`${node.nodeId}:missing_aliases:${locale}`)
    }
    if (!domainKindCoverage.has(node.domainId)) domainKindCoverage.set(node.domainId, new Set())
    domainKindCoverage.get(node.domainId).add(node.nodeKind)
  }
  for (const domainId of GRAPH_DOMAIN_IDS) {
    const kinds = domainKindCoverage.get(domainId) || new Set()
    for (const nodeKind of QL7_SUPPORT_KNOWLEDGE_NODE_KINDS) {
      if (!kinds.has(nodeKind)) failures.push(`${domainId}:missing_kind:${nodeKind}`)
    }
    for (const intentId of QL7_SUPPORT_KNOWLEDGE_INTENT_CONTRACTS) {
      if (!MICRODOMAIN_NODE_BY_ID.has(`${domainId}.${intentId}`)) failures.push(`${domainId}:missing_intent:${intentId}`)
    }
  }
  for (const domainId of Object.keys(FUTURE_DOMAINS)) {
    const node = DOMAIN_NODE_BY_ID.get(domainId)
    if (node?.availability !== 'planned') failures.push(`${domainId}:future_not_planned`)
    if (node?.roadmapEvidence?.some((receipt) => receipt.launchDate)) failures.push(`${domainId}:invented_launch_date`)
  }
  return Object.freeze({
    ok: failures.length === 0,
    version: QL7_SUPPORT_KNOWLEDGE_GRAPH_VERSION,
    graphHash: QL7_SUPPORT_KNOWLEDGE_GRAPH.graphHash,
    domainCount: GRAPH_DOMAIN_IDS.length,
    nodeCount: NODES.length,
    localeCount: QL7_SUPPORT_ALL_LOCALES.length,
    intentContractCount: QL7_SUPPORT_KNOWLEDGE_INTENT_CONTRACTS.length,
    futureSourceGatedDomains: Object.freeze(Object.keys(FUTURE_DOMAINS)),
    minimumTheoreticalValidCapacity: Math.min(...NODES.map((node) => node.realizationCapacity.theoreticalValidCapacity)),
    actualCapacityProofComplete: NODES.every((node) => node.realizationCapacity.actualProofComplete),
    failures: Object.freeze(failures),
  })
}
