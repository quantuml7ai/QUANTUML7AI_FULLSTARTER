export const QL7_SUPPORT_CORE_LOCALES_V8 = Object.freeze(['en','ru','uk','es','tr','ar','zh'])
export const QL7_SUPPORT_PURPOSES_V8 = Object.freeze([
  'greeting','clarification','choice','explanation','diagnostic_result','complaint','violation',
  'restriction','payment_incident','success','pending','safety','humor','notice'
])
export const QL7_SUPPORT_THEME_BY_PURPOSE_V8 = Object.freeze({
  greeting:'aurora-welcome', clarification:'clarify-indigo', choice:'choice-aurora', explanation:'knowledge-blue',
  diagnostic_result:'result-emerald', complaint:'complaint-amber', violation:'violation-crimson',
  restriction:'violation-crimson', payment_incident:'payment-violet-gold', success:'success-emerald',
  pending:'runtime-cyan', safety:'safety-red', humor:'playful-magenta', notice:'knowledge-blue'
})
const L={
 en:{confirmed:'Confirmed data',checks:'Checks performed',next:'What you can do',material:'Reported material',details:'Details',timeline:'Timeline',checked:'Checked',status:'Status',no_data:'No matching data',unavailable:'Check unavailable',healthy:'Confirmed',active:'Active',expired:'Expired',inactive:'Inactive',pending:'Pending',learning_guarded:'Safe learning',inconsistent:'Inconsistent data',human_review:'Human review',policy_dependent:'Depends on moderation policy',collecting_reports:'Reports are being collected',packageCount:'Packages found',campaignCount:'Campaigns found',metricsCount:'Metric sets',impressions:'Impressions',clicks:'Clicks',ctr:'CTR',campaignName:'Campaign',packageName:'Package',activatedAt:'Activated',expiresAt:'Expires',remaining:'Remaining',dateFrom:'From',dateTo:'To',reviewStatus:'Review status',currentReports:'Current reports',nextThreshold:'Next threshold',remainingReports:'Remaining to threshold',expectedAction:'Expected action',possibleRestriction:'Possible restriction'},
 ru:{confirmed:'Подтверждённые данные',checks:'Выполненные проверки',next:'Что можно сделать',material:'Материал жалобы',details:'Детали',timeline:'Хронология',checked:'Проверено',status:'Статус',no_data:'Подходящие данные не найдены',unavailable:'Проверка недоступна',healthy:'Подтверждено',active:'Активен',expired:'Истёк',inactive:'Неактивен',pending:'В обработке',learning_guarded:'Безопасное обучение',inconsistent:'Данные расходятся',human_review:'Ручная проверка',policy_dependent:'Зависит от политики модерации',collecting_reports:'Жалобы собираются',packageCount:'Пакетов найдено',campaignCount:'Кампаний найдено',metricsCount:'Наборов метрик',impressions:'Просмотры',clicks:'Клики',ctr:'CTR',campaignName:'Кампания',packageName:'Пакет',balance:'Баланс',checkedAt:'Проверено',activatedAt:'Активирован',expiresAt:'Истекает',remaining:'Осталось',dateFrom:'С',dateTo:'По',reviewStatus:'Статус рассмотрения',currentReports:'Жалоб сейчас',nextThreshold:'Следующий порог',remainingReports:'Осталось до порога',expectedAction:'Ожидаемое действие',possibleRestriction:'Возможное ограничение'},
 uk:{confirmed:'Підтверджені дані',checks:'Виконані перевірки',next:'Що можна зробити',material:'Матеріал скарги',details:'Деталі',timeline:'Хронологія',checked:'Перевірено',status:'Статус',no_data:'Відповідні дані не знайдено',unavailable:'Перевірка недоступна',healthy:'Підтверджено',active:'Активний',expired:'Строк минув',inactive:'Неактивний',pending:'В обробці',learning_guarded:'Безпечне навчання',inconsistent:'Дані не узгоджуються',human_review:'Ручна перевірка',policy_dependent:'Залежить від політики модерації',collecting_reports:'Скарги збираються',packageCount:'Пакетів знайдено',campaignCount:'Кампаній знайдено',metricsCount:'Наборів метрик',impressions:'Покази',clicks:'Кліки',ctr:'CTR',campaignName:'Кампанія',packageName:'Пакет',activatedAt:'Активовано',expiresAt:'Завершується',remaining:'Залишилося',dateFrom:'Від',dateTo:'До',reviewStatus:'Статус розгляду',currentReports:'Скарг зараз',nextThreshold:'Наступний поріг',remainingReports:'Залишилося до порога',expectedAction:'Очікувана дія',possibleRestriction:'Можливе обмеження'},
 es:{confirmed:'Datos confirmados',checks:'Comprobaciones realizadas',next:'Qué puedes hacer',material:'Contenido reportado',details:'Detalles',timeline:'Cronología',checked:'Comprobado',status:'Estado',no_data:'No se encontraron datos coincidentes',unavailable:'Comprobación no disponible',healthy:'Confirmado',active:'Activo',expired:'Caducado',inactive:'Inactivo',pending:'En proceso',learning_guarded:'Aprendizaje seguro',inconsistent:'Datos inconsistentes',human_review:'Revisión humana',policy_dependent:'Depende de la política',collecting_reports:'Se están recopilando reportes',packageCount:'Paquetes encontrados',campaignCount:'Campañas encontradas',metricsCount:'Conjuntos de métricas',impressions:'Impresiones',clicks:'Clics',ctr:'CTR',campaignName:'Campaña',packageName:'Paquete',activatedAt:'Activado',expiresAt:'Vence',remaining:'Restante',dateFrom:'Desde',dateTo:'Hasta',reviewStatus:'Estado de revisión',currentReports:'Reportes actuales',nextThreshold:'Siguiente umbral',remainingReports:'Restantes hasta el umbral',expectedAction:'Acción prevista',possibleRestriction:'Posible restricción'},
 tr:{confirmed:'Doğrulanan veriler',checks:'Yapılan kontroller',next:'Yapabilecekleriniz',material:'Şikayet edilen içerik',details:'Ayrıntılar',timeline:'Zaman çizelgesi',checked:'Kontrol edildi',status:'Durum',no_data:'Eşleşen veri bulunamadı',unavailable:'Kontrol kullanılamıyor',healthy:'Doğrulandı',active:'Aktif',expired:'Süresi doldu',inactive:'Etkin değil',pending:'İşleniyor',learning_guarded:'Güvenli öğrenme',inconsistent:'Veriler tutarsız',human_review:'İnsan incelemesi',policy_dependent:'Moderasyon politikasına bağlı',collecting_reports:'Şikayetler toplanıyor',packageCount:'Bulunan paketler',campaignCount:'Bulunan kampanyalar',metricsCount:'Metrik kümeleri',impressions:'Gösterimler',clicks:'Tıklamalar',ctr:'TO',campaignName:'Kampanya',packageName:'Paket',activatedAt:'Etkinleştirildi',expiresAt:'Bitiş',remaining:'Kalan',dateFrom:'Başlangıç',dateTo:'Bitiş',reviewStatus:'İnceleme durumu',currentReports:'Mevcut şikayetler',nextThreshold:'Sonraki eşik',remainingReports:'Eşiğe kalan',expectedAction:'Beklenen işlem',possibleRestriction:'Olası kısıtlama'},
 ar:{confirmed:'حقائق مؤكدة',checks:'عمليات التحقق',next:'ما يمكنك فعله',material:'المحتوى المبلغ عنه',details:'التفاصيل',timeline:'الخط الزمني',checked:'تم التحقق',status:'الحالة',no_data:'لم يتم العثور على بيانات مطابقة',unavailable:'التحقق غير متاح',healthy:'تم التأكيد',active:'نشط',expired:'منتهي',inactive:'غير نشط',pending:'قيد المعالجة',learning_guarded:'تعلم آمن',inconsistent:'بيانات غير متسقة',human_review:'مراجعة بشرية',policy_dependent:'يعتمد على سياسة الإشراف',collecting_reports:'يتم جمع البلاغات',packageCount:'الحزم الموجودة',campaignCount:'الحملات الموجودة',metricsCount:'مجموعات المقاييس',impressions:'مرات الظهور',clicks:'النقرات',ctr:'معدل النقر',campaignName:'الحملة',packageName:'الحزمة',activatedAt:'تاريخ التفعيل',expiresAt:'تاريخ الانتهاء',remaining:'المتبقي',dateFrom:'من',dateTo:'إلى',reviewStatus:'حالة المراجعة',currentReports:'البلاغات الحالية',nextThreshold:'الحد التالي',remainingReports:'المتبقي حتى الحد',expectedAction:'الإجراء المتوقع',possibleRestriction:'التقييد المحتمل'},
 zh:{confirmed:'已确认数据',checks:'已执行检查',next:'可采取的操作',material:'被举报内容',details:'详细信息',timeline:'时间线',checked:'检查时间',status:'状态',no_data:'未找到匹配数据',unavailable:'检查暂不可用',healthy:'已确认',active:'有效',expired:'已过期',inactive:'未激活',pending:'处理中',learning_guarded:'安全学习',inconsistent:'数据不一致',human_review:'人工审核',policy_dependent:'取决于审核政策',collecting_reports:'正在收集举报',packageCount:'找到的套餐',campaignCount:'找到的活动',metricsCount:'指标组',impressions:'展示次数',clicks:'点击次数',ctr:'点击率',campaignName:'活动名称',packageName:'套餐',activatedAt:'激活时间',expiresAt:'到期时间',remaining:'剩余',dateFrom:'开始日期',dateTo:'结束日期',reviewStatus:'审核状态',currentReports:'当前举报数',nextThreshold:'下一个阈值',remainingReports:'距离阈值',expectedAction:'预计操作',possibleRestriction:'可能的限制'}
}
const S={
 en:{ready:'Ready',completed:'Completed',timeout:'Timed out',error:'Could not complete the check',blocked:'Temporarily paused',not_linked:'Account link not found',postId:'Post',author:'Author',reason:'Report reason',contentType:'Content type',created:'Published',updated:'Updated',snapshot:'Reported material',openPost:'Open post',result:'Result',vipStatus:'VIP status',remainingDays:'Days remaining',budget:'Budget',spend:'Spend',moderationStatus:'Moderation status',metricsUpdatedAt:'Metrics updated',accountUsed:'Account used for verification'},
 ru:{ready:'На связи',completed:'Завершено',timeout:'Время ожидания истекло',error:'Проверку завершить не удалось',blocked:'Временно приостановлено',not_linked:'Связанный аккаунт не найден',postId:'Пост',author:'Автор',reason:'Причина жалобы',contentType:'Тип материала',created:'Опубликован',updated:'Обновлён',snapshot:'Материал жалобы',openPost:'Открыть пост',result:'Результат',vipStatus:'Статус VIP',remainingDays:'Осталось дней',budget:'Бюджет',spend:'Расходы',moderationStatus:'Статус модерации',metricsUpdatedAt:'Метрики обновлены',accountUsed:'Аккаунт проверки'},
 uk:{ready:'Готово до роботи',completed:'Завершено',timeout:'Час очікування минув',error:'Перевірку завершити не вдалося',blocked:'Тимчасово призупинено',not_linked:'Пов’язаний акаунт не знайдено',postId:'Пост',author:'Автор',reason:'Причина скарги',contentType:'Тип матеріалу',created:'Опубліковано',updated:'Оновлено',snapshot:'Матеріал скарги',openPost:'Відкрити пост',result:'Результат',vipStatus:'Статус VIP',remainingDays:'Залишилося днів',budget:'Бюджет',spend:'Витрати',moderationStatus:'Статус модерації',metricsUpdatedAt:'Метрики оновлено',accountUsed:'Акаунт перевірки'},
 es:{ready:'Listo',completed:'Completado',timeout:'Tiempo de espera agotado',error:'No se pudo completar la comprobación',blocked:'Pausado temporalmente',not_linked:'No se encontró la cuenta vinculada',postId:'Publicación',author:'Autor',reason:'Motivo del reporte',contentType:'Tipo de contenido',created:'Publicado',updated:'Actualizado',snapshot:'Contenido reportado',openPost:'Abrir publicación',result:'Resultado',vipStatus:'Estado VIP',remainingDays:'Días restantes',budget:'Presupuesto',spend:'Gasto',moderationStatus:'Estado de moderación',metricsUpdatedAt:'Métricas actualizadas',accountUsed:'Cuenta verificada'},
 tr:{ready:'Hazır',completed:'Tamamlandı',timeout:'Bekleme süresi doldu',error:'Kontrol tamamlanamadı',blocked:'Geçici olarak duraklatıldı',not_linked:'Bağlı hesap bulunamadı',postId:'Gönderi',author:'Yazar',reason:'Şikayet nedeni',contentType:'İçerik türü',created:'Yayınlandı',updated:'Güncellendi',snapshot:'Şikayet edilen içerik',openPost:'Gönderiyi aç',result:'Sonuç',vipStatus:'VIP durumu',remainingDays:'Kalan gün',budget:'Bütçe',spend:'Harcama',moderationStatus:'Moderasyon durumu',metricsUpdatedAt:'Metrikler güncellendi',accountUsed:'Doğrulanan hesap'},
 ar:{ready:'جاهز',completed:'اكتمل',timeout:'انتهت مهلة الانتظار',error:'تعذر إكمال التحقق',blocked:'متوقف مؤقتاً',not_linked:'لم يتم العثور على الحساب المرتبط',postId:'المنشور',author:'الكاتب',reason:'سبب البلاغ',contentType:'نوع المحتوى',created:'تاريخ النشر',updated:'آخر تحديث',snapshot:'المحتوى المبلغ عنه',openPost:'فتح المنشور',result:'النتيجة',vipStatus:'حالة VIP',remainingDays:'الأيام المتبقية',budget:'الميزانية',spend:'الإنفاق',moderationStatus:'حالة الإشراف',metricsUpdatedAt:'تحديث المقاييس',accountUsed:'الحساب المستخدم للتحقق'},
 zh:{ready:'已就绪',completed:'已完成',timeout:'等待超时',error:'无法完成检查',blocked:'暂时暂停',not_linked:'未找到关联账户',postId:'帖子',author:'作者',reason:'举报原因',contentType:'内容类型',created:'发布时间',updated:'更新时间',snapshot:'被举报内容',openPost:'打开帖子',result:'结果',vipStatus:'VIP 状态',remainingDays:'剩余天数',budget:'预算',spend:'支出',moderationStatus:'审核状态',metricsUpdatedAt:'指标更新时间',accountUsed:'用于验证的账户'}
}
const CONTENT_TYPE_LABELS_V8 = Object.freeze({
  en:{image:'Image',video:'Video',audio:'Audio',sticker:'Sticker',link:'Link',embed:'Embedded content',file:'File',text:'Text'},
  ru:{image:'Изображение',video:'Видео',audio:'Аудио',sticker:'Стикер',link:'Ссылка',embed:'Встроенный материал',file:'Файл',text:'Текст'},
  uk:{image:'Зображення',video:'Відео',audio:'Аудіо',sticker:'Стікер',link:'Посилання',embed:'Вбудований матеріал',file:'Файл',text:'Текст'},
  es:{image:'Imagen',video:'Vídeo',audio:'Audio',sticker:'Sticker',link:'Enlace',embed:'Contenido incrustado',file:'Archivo',text:'Texto'},
  tr:{image:'Görsel',video:'Video',audio:'Ses',sticker:'Çıkartma',link:'Bağlantı',embed:'Gömülü içerik',file:'Dosya',text:'Metin'},
  ar:{image:'صورة',video:'فيديو',audio:'صوت',sticker:'ملصق',link:'رابط',embed:'محتوى مضمن',file:'ملف',text:'نص'},
  zh:{image:'图片',video:'视频',audio:'音频',sticker:'贴纸',link:'链接',embed:'嵌入内容',file:'文件',text:'文本'},
})

function s(value){return String(value??'').trim()}
function hasValue(value){return value===0||value===false||(value!==undefined&&value!==null&&s(value)!=='')}
function machineKey(value=''){return s(value).replace(/([a-z])([A-Z])/g,'$1_$2').replace(/[\s-]+/g,'_').toLowerCase()}
function inferFormat(value){return typeof value==='number'?'integer':'text'}
function safeArray(value){return Array.isArray(value)?value:[]}
const UNAVAILABLE_STATUS_RE_V8=/^(?:unavailable|mongo_unavailable|provider_unavailable|provider_failure|timeout|source_unavailable)$/iu
const EVIDENCE_META_KEY_RE_V8=/^(?:status|branch|source|sourceStatus|adapterId|error|errors|raw|query|collections|businessCollectionsRead|businessCollectionsWritten|unavailableSources|asOf|updatedAt|checkedAt|generatedAt|readOnly|ok)$/iu

function hasMeaningfulEvidenceV8(value,key=''){
  if(EVIDENCE_META_KEY_RE_V8.test(machineKey(key)))return false
  if(value===0||value===false)return true
  if(value===undefined||value===null||s(value)==='')return false
  if(Array.isArray(value))return value.some((item)=>hasMeaningfulEvidenceV8(item,key))
  if(typeof value==='object')return Object.entries(value).some(([childKey,childValue])=>hasMeaningfulEvidenceV8(childValue,childKey))
  return true
}

function hasRenderableEvidenceV8(card={},metrics=[]){
  if(safeArray(metrics).some((metric)=>hasMeaningfulEvidenceV8(metric?.value,metric?.key||metric?.label)))return true
  if(safeArray(card?.table?.rows).some((row)=>hasMeaningfulEvidenceV8(row,'table')))return true
  if(safeArray(card?.facts).some((item)=>hasMeaningfulEvidenceV8(item,'facts')))return true
  if(safeArray(card?.checks).some((item)=>hasMeaningfulEvidenceV8(item,'checks')))return true
  return false
}

function effectiveStatusCodeV8(statusCode='',card={},metrics=[]){
  const code=s(statusCode)
  return UNAVAILABLE_STATUS_RE_V8.test(code)&&hasRenderableEvidenceV8(card,metrics)?'healthy':code
}

export function isQl7SupportCoreLocaleV8(value=''){
  const key=s(value).toLowerCase().split(/[-_]/u)[0]
  return QL7_SUPPORT_CORE_LOCALES_V8.includes(key)
}

export function ql7SupportRenderLocaleV8(value=''){
  const key=s(value).toLowerCase().replace(/_/gu,'-')
  return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/u.test(key)?key:'en'
}

export function ql7SupportDirectionV8(value=''){
  const key=ql7SupportRenderLocaleV8(value).split('-')[0]
  return ['ar','he','fa','ur'].includes(key)?'rtl':'ltr'
}

export function ql7SupportLocaleV8(value=''){
  const key=s(value).toLowerCase().split(/[-_]/u)[0]
  return QL7_SUPPORT_CORE_LOCALES_V8.includes(key)?key:'en'
}

export function ql7SupportLabelsV8(locale='en'){
  const key=ql7SupportLocaleV8(locale)
  return {...(L[key]||L.en),...(S[key]||S.en)}
}

export function localizeQl7StatusV8(code='',locale='en'){
  const key=machineKey(code)
  const labels=ql7SupportLabelsV8(locale)
  return labels[key]||labels.unavailable||'Status unavailable'
}

export function localizeQl7MetricV8(key='',locale='en'){
  const normalized=machineKey(key)
  const aliases={
    package_count:'packageCount',campaign_count:'campaignCount',metrics_count:'metricsCount',campaign_name:'campaignName',
    package_name:'packageName',activated_at:'activatedAt',expires_at:'expiresAt',date_from:'dateFrom',date_to:'dateTo',
    review_status:'reviewStatus',current_reports:'currentReports',next_threshold:'nextThreshold',remaining_reports:'remainingReports',
    expected_action:'expectedAction',possible_restriction:'possibleRestriction',moderation_status:'moderationStatus',
    metrics_updated_at:'metricsUpdatedAt',account_used:'accountUsed',vip_status:'vipStatus',remaining_days:'remainingDays',
    view_count:'impressions',views_total:'impressions',impressions_total:'impressions',click_count:'clicks',clicks_total:'clicks',
    ctr_total:'ctr',account_balance:'balance',checked_at:'checkedAt',
  }
  const labels=ql7SupportLabelsV8(locale)
  return labels[aliases[normalized]||normalized]||labels.details||'Details'
}

export function localizeQl7ContentTypeV8(value='',locale='en'){
  const key=machineKey(value)
  const dictionaryLocale=ql7SupportLocaleV8(locale)
  return CONTENT_TYPE_LABELS_V8[dictionaryLocale]?.[key]||CONTENT_TYPE_LABELS_V8.en[key]||s(value)||'—'
}

export function inferQl7PurposeV8(input={}){
  const kind=s(input.purpose||input.kind)
  if(QL7_SUPPORT_PURPOSES_V8.includes(kind))return kind
  if(kind==='moderation_snapshot')return 'complaint'
  if(kind==='clarification_choices')return 'choice'
  if(kind==='diagnostic'||kind==='case_result'||kind==='data_table'||kind==='status')return 'diagnostic_result'
  if(kind==='how_to')return 'explanation'
  return 'notice'
}

export function semanticDedupeV8(values=[]){
  const seen=new Set()
  return safeArray(values).filter((value)=>{
    const candidate=typeof value==='object'?(value?.value??value?.text??value?.message??value?.label):value
    const normalized=s(candidate).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()
    if(!normalized||seen.has(normalized))return false
    seen.add(normalized)
    return true
  })
}

function normalizeSectionsV8(card,labels){
  const normalizeItems=(items,id)=>semanticDedupeV8(items).map((item,index)=>{
    if(typeof item!=='object')return{id:`${id}-${index}`,value:s(item)}
    const value=item?.value??item?.text??item?.message
    return{id:s(item?.id||`${id}-${index}`),label:s(item?.label),value:hasValue(value)?s(value):'',asOf:s(item?.asOf)}
  }).filter((item)=>item.label||hasValue(item.value))
  const existing=safeArray(card?.sections).map((section,index)=>{
    const id=s(section?.id||`section-${index}`)
    const items=normalizeItems(section?.items,id)
    if(!items.length)return null
    return{id,title:s(section?.title)||s(labels?.details),tone:s(section?.tone||'neutral'),items}
  }).filter(Boolean)
  if(existing.length)return existing.slice(0,12)
  const sections=[]
  const add=(id,title,items,tone='neutral')=>{
    const clean=normalizeItems(items,id)
    if(clean.length)sections.push({id,title,tone,items:clean})
  }
  add('confirmed',labels.confirmed,card?.facts)
  add('checks',labels.checks,card?.checks)
  add('anomalies',labels.details,card?.anomalies,'warning')
  add('next',labels.next,card?.nextActions,'accent')
  return sections
}

function normalizeMetricObjectV8(metrics,locale){
  const rows=[]
  if(Array.isArray(metrics)){
    for(const item of metrics){
      const key=s(item?.key||item?.label)
      if(!key||!hasValue(item?.value))continue
      rows.push({key,label:s(item?.label)||localizeQl7MetricV8(key,locale),value:item.value,format:s(item?.format)||inferFormat(item.value),tone:s(item?.tone)||'neutral',visibility:s(item?.visibility)||'both'})
    }
  }else if(metrics&&typeof metrics==='object'){
    for(const [key,value] of Object.entries(metrics)){
      if(!hasValue(value))continue
      rows.push({key,label:localizeQl7MetricV8(key,locale),value,format:inferFormat(value),tone:'neutral',visibility:'both'})
    }
  }
  return rows
}

function normalizeLegacyTableMetricsV8(table,locale){
  if(!table||typeof table!=='object')return[]
  const columns=safeArray(table.columns).filter((column)=>s(column?.key))
  const rows=[]
  safeArray(table.rows).forEach((row,rowIndex)=>{
    for(const column of columns){
      const key=s(column.key)
      const value=row?.[key]
      if(!hasValue(value))continue
      rows.push({
        key:`legacy-table-${rowIndex}-${key}`,
        label:s(column.label)||localizeQl7MetricV8(key,locale),
        value,
        format:inferFormat(value),tone:'neutral',visibility:'both',
      })
    }
  })
  return rows
}

function dedupeMetricsV8(rows){
  const seen=new Set()
  return rows.filter((row)=>{
    const key=`${s(row.label).toLowerCase()}\u0000${s(row.value)}`
    if(seen.has(key))return false
    seen.add(key)
    return true
  }).slice(0,64)
}

function normalizeTimelineV8(value){
  return safeArray(value).map((item,index)=>{
    if(typeof item==='string')return{id:`timeline-${index}`,value:s(item)}
    return{id:s(item?.id||`timeline-${index}`),value:s(item?.value??item?.text??item?.message??item?.label),asOf:s(item?.asOf??item?.at)}
  }).filter((item)=>hasValue(item.value)||hasValue(item.asOf)).slice(0,24)
}

function normalizeSnapshotV8(snapshot,locale){
  if(!snapshot||typeof snapshot!=='object')return snapshot??null
  return{
    ...snapshot,
    contentType:hasValue(snapshot.contentType)?localizeQl7ContentTypeV8(snapshot.contentType,locale):snapshot.contentType,
  }
}

export function adaptQl7SupportCardForRenderV3(card={}){
  if(Number(card?.version)===3||card?.schema==='ql7.support.card.v3')return card
  const renderLocale=ql7SupportRenderLocaleV8(card?.locale)
  const dictionaryLocale=ql7SupportLocaleV8(card?.locale)
  const purpose=inferQl7PurposeV8(card)
  const labels=ql7SupportLabelsV8(dictionaryLocale)
  const metrics=dedupeMetricsV8([
    ...normalizeMetricObjectV8(card?.metrics,dictionaryLocale),
    ...normalizeLegacyTableMetricsV8(card?.table,dictionaryLocale),
  ])
  const statusCode=effectiveStatusCodeV8(s(card?.status?.code||card?.status||card?.branch),card,metrics)
  return{
    ...card,
    version:3,
    schema:'ql7.support.card.v3',
    purpose,
    visualTheme:s(card?.visualTheme)||QL7_SUPPORT_THEME_BY_PURPOSE_V8[purpose]||'knowledge-blue',
    severity:s(card?.severity||'info'),
    locale:renderLocale,
    direction:ql7SupportDirectionV8(renderLocale),
    status:statusCode?{
      code:statusCode,
      label:localizeQl7StatusV8(statusCode,dictionaryLocale),
      tone:/unavailable|error|inconsistent|expired|blocked/iu.test(statusCode)?'warning':'neutral',
      icon:'status',
    }:null,
    sections:normalizeSectionsV8(card,labels),
    metrics,
    timeline:normalizeTimelineV8(card?.timeline),
    snapshot:normalizeSnapshotV8(card?.snapshot,dictionaryLocale),
    labels:{...labels,...(card?.labels||{})},
  }
}
