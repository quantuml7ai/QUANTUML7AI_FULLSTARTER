
function str(v){return String(v??'').trim()}
function hashInt(v=''){let h=2166136261>>>0;for(const c of str(v)||'v11.6'){h^=c.codePointAt(0);h=Math.imul(h,16777619)>>>0}return h>>>0}
function pick(rows,seed=''){const list=(Array.isArray(rows)?rows:[]).filter(Boolean);return list.length?list[hashInt(seed)%list.length]:''}

const COPY=Object.freeze({
 ru:{
  ai_usage:[
   'Откройте Quantum Exchange и выберите AI Box. Укажите актив и период анализа, затем запустите расчёт. Сначала посмотрите направление и confidence, после этого сверяйте вывод со свечами, объёмом и ликвидностью. Результат — аналитическая оценка, а не гарантия сделки.',
   'AI Box находится внутри Quantum Exchange. Выберите рынок, актив и временной диапазон, нажмите запуск анализа и прочитайте три части: направление, уровень уверенности и риск. Перед решением обязательно сравните их с графиком и стаканом.',
  ],
  ai_accuracy:[
   'Точность AI Box зависит от качества и полноты рыночных данных, выбранного периода и резких изменений ликвидности. Confidence показывает уверенность модели в текущем выводе, но не вероятность гарантированной прибыли. Проверяйте сигнал по графику, объёму, стакану и собственному риск-лимиту.',
   'У AI-аналитики нет одной постоянной точности для всех рынков. Чем стабильнее данные и достаточнее история, тем надёжнее оценка. На новостных скачках и тонкой ликвидности качество снижается. Используйте confidence как показатель уверенности, а не как обещание результата.',
  ],
  qcoin_security:[
   'Понимаю, почему это тревожит. Я проверю текущий баланс, последние движения и операции в ожидании. Вывод будет только по найденным записям: если неизвестного списания не видно, я так и скажу, но не назову спор закрытым без периода и суммы.',
   'Сначала отделим факт от предположения. Нужны текущий баланс, история исходящих операций и примерный период изменения. Я не буду писать «всё подтверждено», пока эти данные не совпадут между собой.',
  ],
  ads_package_status:[
   'Проверю именно рекламный пакет: его название, дату активации, срок действия, общий лимит кампаний, использованный и доступный остаток. Активный пакет с нулём доступных кампаний остаётся активным — это означает, что лимит уже использован.',
  ],
  greeting:['Здравствуйте. Я на связи. Расскажите, что хотите понять или проверить.','Добрый день. Чем помочь по экосистеме сегодня?','Привет. Опишите вопрос своими словами — разберём его спокойно и по делу.'],
 },
 en:{
  ai_usage:['Open Quantum Exchange and choose AI Box. Select the asset and analysis period, run the calculation, then read direction, confidence and risk. Compare the result with candles, volume and liquidity; it is analysis, not a guaranteed trade.'],
  ai_accuracy:['AI Box accuracy depends on data quality, the selected period and sudden liquidity changes. Confidence describes how strongly the model supports its current conclusion; it is not a promise of profit. Verify the signal against the chart, volume, order book and your own risk limit.'],
  qcoin_security:['I understand why that is worrying. I will separate the current balance, recent movements and pending operations. I will only state what the records support and will not call the issue resolved without a relevant time window and amount.'],
  ads_package_status:['I will check the advertising package itself: plan, activation, expiry, campaign limit, used slots and remaining slots. An active package with zero remaining campaigns is still active; its campaign allowance has been used.'],
  greeting:['Hello. I am here. Tell me what you want to understand or check.','Good to see you. Describe the question in your own words and we will sort it out.'],
 },
})

function localeKey(locale='en'){const key=str(locale).toLowerCase().split(/[-_]/u)[0];return COPY[key]?key:'en'}
export function realizeQl7PremiumMicroIntentV11_6({microIntent='',locale='en',seed=''}={}){
 const lang=localeKey(locale),copy=COPY[lang]
 const id=str(microIntent)
 let key=''
 if(id==='exchange_ai.usage'||id==='exchange_ai.start'||id==='exchange_ai.location')key='ai_usage'
 else if(id==='exchange_ai.accuracy'||id==='exchange_ai.evidence')key='ai_accuracy'
 else if(id==='qcoin.security')key='qcoin_security'
 else if(id==='ads_packages.status')key='ads_package_status'
 if(!key)return null
 return Object.freeze({text:pick(copy[key]||COPY.en[key],`${seed}:${id}`),responseCode:`premium_${id.replace(/\W+/gu,'_')}`,presentationState:key.includes('security')?'anxious_support':(key.includes('accuracy')?'analytical':'helpful')})
}
