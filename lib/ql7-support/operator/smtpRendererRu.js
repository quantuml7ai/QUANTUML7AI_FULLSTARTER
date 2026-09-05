import {QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU, QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU, auditQl7SupportOperatorReport, buildQl7SupportOperatorReportReceipt} from './reportContract.js'
function str(v=''){return String(v??'').trim()}
function visible(v=''){return str(v).replace(/q[\s._-]*l[\s._-]*7(?:[\s._-]*support)?/giu,'поддержка')}
function esc(v=''){return visible(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function arr(v){return Array.isArray(v)?v:[]}
function human(v=''){return visible(str(v).replace(/[._:-]+/gu,' ').replace(/\s+/gu,' ').trim())}
function value(v,depth=0){if(v===null||v===undefined||v==='')return '—';if(depth>3)return '[структурированные данные скрыты]';if(Array.isArray(v))return v.length?v.map((x,i)=>typeof x==='object'?`${i+1}. ${value(x,depth+1)}`:str(x)).join('\n'):'—';if(typeof v==='object')return Object.entries(v).filter(([k])=>!/(?:secret|token|private|raw|mongo|collection|route|stack)/iu.test(k)).map(([k,x])=>`${human(k)}: ${value(x,depth+1)}`).join('\n')||'—';return visible(v)}
function block(title,body){return `<section data-report-section="${esc(title)}" style="margin-top:14px;border:1px solid rgba(117,230,255,.30);border-radius:14px;overflow:hidden"><h2 style="margin:0;padding:12px 14px;background:#10385d;color:#fff;font-size:16px">${esc(title)}</h2><div style="padding:12px 14px;background:#081a31;color:#fff;white-space:pre-wrap;line-height:1.5">${esc(value(body))}</div></section>`}
function checks(c){return arr(c.checks).map(x=>`${human(x.adapter||x.sourceType)} — ${human(x.resultKind)}; read-only=${x.readOnly===true?'да':'нет'}; ${x.checkedAt||''}`).join('\n')||'Проверки не выполнялись'}
function contacts(c){if(c.contacts?.consent!==true){if(c.contacts?.contactDeclined===true||c.contacts?.consentState==='refused')return 'Пользователь явно отказался от внешнего контакта; продолжение доступно только в личном диалоге экосистемы.';return c.contacts?.dmOnly?'Пользователь выбрал только личный диалог экосистемы.':'Внешний контакт не предоставлен либо явное согласие отсутствует.'}return [`Email: ${c.contacts.email||'—'}`,`Телефон: ${c.contacts.phone||'—'}`,`Telegram: ${c.contacts.telegram||'—'}`,`Предпочтительный канал: ${c.contacts.preferred||'—'}`].join('\n')}
function history(c){const rows=arr(c.operatorReport?.dialogueHistory);return rows.length?rows.map((x,i)=>`${i+1}. ${x}`).join('\n'):'История в этом projection отсутствует; используйте ссылку на личный диалог.'}
function important(c){return arr(c.operatorReport?.importantTopics).join('; ')||[c.request?.topic,c.request?.subtopic].filter(Boolean).map(human).join('; ')||'—'}
function facts(c){const rows=arr(c.operatorReport?.confirmedFacts);return rows.length?rows.join('\n'):'Подтверждённых фактов в этом отчёте нет.'}
function claims(c){const rows=arr(c.operatorReport?.userClaims);return rows.length?rows.join('\n'):c.request?.originalText||'—'}
function actions(c){const rows=arr(c.operatorReport?.actionsTaken);return rows.length?rows.join('\n'):'Автоматические действия не заявлены.'}
function geoEvidence(c){const g=c.geo||{};const rows=[['Страна',g.country],['Регион',g.region],['Город',g.city],['Точность',g.precision],['Источник',g.source],['Актуально на',g.asOf]].filter(([,v])=>str(v));return rows.length?rows.map(([k,v])=>`${k}: ${v}`).join('\n'):'Географические данные не подтверждены.'}
function ratingEvidence(c){const r=c.rating||{};const rows=[`Рейтинг: ${r.score??'—'}/100`,`Уровень: ${r.band||'—'}`,`Уверенность evidence: ${r.confidence??'—'}%`,`Версия расчёта: ${r.calculationVersion||'—'}`];const criteria=arr(r.criteria);if(criteria.length){rows.push('', 'Критерии расчёта рейтинга');for(const x of criteria)rows.push(`${x.label||x.id||'Критерий'}: ${x.value||'—'}; вклад ${Number(x.points||0)>=0?'+':''}${Number(x.points||0)}. ${x.explanation||''}`.trim())}const missing=arr(r.missingSignals);if(missing.length)rows.push('',`Недостающие сигналы: ${missing.join('; ')}`);return rows.join('\n')}
function activityEvidence(c){const a=c.activity||{};return [`Публикации: ${a.posts??0}`,`Темы: ${a.topics??0}`,`Комментарии: ${a.comments??0}`,`Подписчики: ${a.followers??0}`,`Подписки: ${a.following??0}`,`Лайки: ${a.likes??0}`,`Жалобы на публикации: ${a.reportsOnPosts??0}`,`Жалобы от пользователя: ${a.reportsByUser??0}`,`Флаги модерации: ${a.moderationFlags??0}`,`Удалённые публикации: ${a.removedPosts??0}`].join('\n')}
function aggregateMeaning(c){return c.request?.aggregateMeaningRu||c.operatorReport?.detectedProblem||c.operatorReport?.meaningRu||c.request?.meaningRu||'Смысл обращения требует проверки оператором по перечисленным фактам и receipts.'}
function operatorActionHtml(c){const link=str(c.links?.openUserDm);return link?`Открыть личную переписку с пользователем: ${link}`:'Личная переписка недоступна в текущем projection; используйте разрешённый операторский маршрут.'}
function operatorActionText(c){const link=str(c.links?.openUserDm);return link?`Открыть личную переписку: ${link}`:'Открыть личную переписку: ссылка отсутствует в текущем projection.'}
export function renderQl7SupportOperatorEmailRu(operatorCase={}){const c=operatorCase;const op=c.operatorReport||{};const meaning=op.meaningRu||c.request?.meaningRu;const meaningValue=meaning||(op.translationStatus==='unavailable'?'Русский смысловой перевод недоступен; оригинал сохранён отдельно.':'—');const sections=[
 ['Кто пользователь',[`Никнейм: ${c.user?.nickname||'—'}`,`ID: ${c.user?.userIdMasked||c.user?.accountIdMasked||'—'}`,`Язык: ${c.user?.locale||'—'}`].join('\n')],
 ['Тип обращения',human(op.requestType||c.request?.messageAct||c.request?.topic)],
 ['Исходный текст',op.originalText||c.request?.originalText],
 ['Русский смысловой перевод',meaningValue],
 ['Важные темы разговора',important(c)],
 ['Подтверждённые факты',facts(c)],
 ['Заявления пользователя',claims(c)],
 ['Результаты проверок',checks(c)],
 ['Выявленная проблема',op.detectedProblem||c.request?.aggregateMeaningRu||'—'],
 ['Уровень риска',human(op.riskLevel||c.request?.safetyCategory||'обычный')],
 ['Предпринятые действия',actions(c)],
 ['История диалога',history(c)],
 ['Рекомендации оператору',arr(c.recommendations).join('\n')||'—'],
 ['Добровольно предоставленные контакты',contacts(c)],
 ['Статус отправки',human(op.smtpStatus||'prepared_not_sent')],
 ];
 const missing=QL7_SUPPORT_OPERATOR_REPORT_SECTIONS_RU.filter((x,i)=>sections[i]?.[0]!==x);if(missing.length)throw Object.assign(new Error(`ql7_smtp_section_contract_mismatch:${missing.join(',')}`),{code:'ql7_smtp_section_contract_mismatch'})
 const evidenceSections=[
  [QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU[0],aggregateMeaning(c)],
  [QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU[1],operatorActionHtml(c)],
 ]
 const aggregate=c.evidenceAggregation?.sections||{};
 const extra=[
  ...evidenceSections.map(([title,body])=>block(title,body)),
  block('Семантика и уверенность',aggregate.semanticDecision||{}),
  block('Безопасность и кризисный контекст',aggregate.safety||{}),
  block('Подтверждённые read-only проверки',aggregate.verifiedChecks||[]),
  block('Недоступные или неподтверждённые источники',aggregate.unavailableChecks||[]),
  ...(aggregate.aiBox?.present?[block('Аналитика AI Box',aggregate.aiBox)]:[]),
  block('География',geoEvidence(c)),
  block('Критерии расчёта рейтинга',ratingEvidence(c)),
  block('Активность и модерация',activityEvidence(c)),
  block('Дополнительная доказательная сводка',[`Read-only checks: ${arr(c.checks).filter(x=>x.readOnly).length}`,`Business writes: ${c.report?.businessWriteCount??0}`,`Privacy: ${c.report?.privacyBoundary||'operator_internal_privacy_safe'}`].join('\n')),
 ]
 const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head><body style="margin:0;background:#07111f!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important"><main style="max-width:900px;margin:0 auto;padding:18px;font-family:Arial,sans-serif"><header style="padding:18px;border:1px solid #2b6a92;border-radius:16px;background:#092848"><h1 style="margin:0;color:#fff">Операторский отчёт поддержки</h1><p style="color:#cfe7ff">${esc(c.id)} · ${esc(c.createdAt)}</p></header>${sections.map(([t,b])=>block(t,b)).join('')}${extra.join('')}</main></body></html>`
 const textEvidence=[
  '',QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU[0],value(aggregateMeaning(c)),
  '',QL7_SUPPORT_OPERATOR_REPORT_EXTRA_SECTIONS_RU[1],value(operatorActionText(c)),
 ]
 const text=['Операторский отчёт поддержки',...sections.flatMap(([t,b])=>['',t,value(b)]),...textEvidence].join('\n')
 const rendered={subject:`[Поддержка] ${human(c.request?.topic)||'Обращение'} · ${visible(c.user?.nickname||'Пользователь')}`,html,text,replyTo:c.contacts?.consent===true?c.contacts.email||'':'',sectionNames:Object.freeze(sections.map(x=>x[0]))}
 const audit=auditQl7SupportOperatorReport({operatorCase:c,rendered});if(!audit.ok)throw Object.assign(new Error(`ql7_smtp_report_invalid:${audit.failures.join(',')}`),{code:'ql7_smtp_report_invalid',failures:audit.failures})
 return Object.freeze({...rendered,audit,reportReceipt:buildQl7SupportOperatorReportReceipt({operatorCase:c,rendered,smtpStatus:op.smtpStatus||'prepared_not_sent'})})
}
