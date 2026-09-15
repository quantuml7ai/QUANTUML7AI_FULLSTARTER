'use client'

import React from 'react'
import Ql7SupportCard, { isRenderableQl7SupportCard } from './Ql7SupportCard.js'
import Ql7SemanticBadge from './Ql7SemanticBadge.js'

const h=React.createElement
function str(value){return String(value??'').trim()}
function localeKey(value='en'){return str(value).toLowerCase().replace('_','-').split('-')[0]||'en'}
const TITLE={en:'Ready to help',ru:'Рад помочь',uk:'Радий допомогти',es:'Listo para ayudar',tr:'Yardım etmeye hazırım',ar:'جاهز للمساعدة',zh:'随时为你处理',he:'מוכן לעזור'}
const TOPIC_ICON={qcoin:'qcoin',wallet:'wallet',payments:'payment',vip:'vip',ads_packages:'ads_package',ads_campaigns:'ads_metrics',ads_metrics:'ads_metrics',forum:'forum',forum_threads:'forum',telegram:'telegram',academy:'academy',academy_exam:'academy',gameverse:'gameverse',metamarket:'metamarket',security:'security',privacy:'privacy',account_deletion:'account_deletion',accessibility:'accessibility',contact:'operator_handoff',partnership:'partnership',investment:'investment',accessibility:'accessibility',learning_governance:'learning'}
function fallbackIcon(metadata={}){
  const event=str(metadata?.eventType||metadata?.supportEventType)
  const code=str(metadata?.responseCode)
  const topic=str(metadata?.topic)
  if(/greeting/iu.test(`${event} ${code}`)) return 'greeting'
  if(/gratitude|thanks/iu.test(code)) return 'gratitude'
  if(/humor|joke/iu.test(code)) return 'humor'
  if(/threat|attack|terror/iu.test(`${code} ${metadata?.safetyState||''}`)) return 'threat'
  if(/warning|insult|rude/iu.test(code)) return 'warning'
  if(/operator|human_review/iu.test(code)) return 'operator_handoff'
  if(/unavailable|timeout|failed/iu.test(`${code} ${metadata?.diagnosticStatus||''} ${metadata?.diagnosticBranch||''}`)) return 'unavailable'
  return TOPIC_ICON[topic]||'information'
}
export default function Ql7SupportMessageSurface({card,text='',metadata=null,locale='en',VideoPlayer,VoicePlayer}){
  if(isRenderableQl7SupportCard(card)) return h(Ql7SupportCard,{card,VideoPlayer,VoicePlayer})
  const lang=localeKey(locale||metadata?.locale||'en')
  const icon=fallbackIcon(metadata||{})
  const assetId=str(metadata?.svgAssetId||metadata?.supportSvgAssetId||`${icon}-v1`)
  const direction=['ar','he','fa','ur'].includes(lang)?'rtl':'ltr'
  return h('article',{className:`ql7SupportCompactSurface ql7SupportCompactSurface--${icon}`,lang,dir:'ltr','data-ql7-support-surface':'compact-compat-premium','data-ql7-support-semantic-icon':icon,'data-ql7-support-svg-asset-id':assetId,'data-ql7-support-svg-quality':'premium-detailed','data-ql7-support-svg-legacy':'0'},
    h('div',{className:'ql7SupportCompactSurfaceIcon'},h(Ql7SemanticBadge,{iconKey:icon,assetId,label:TITLE[lang]||TITLE.en,animated:false})),
    h('div',{className:'ql7SupportCompactSurfaceBody',dir:direction},
      h('h3',null,TITLE[lang]||TITLE.en),
      h('p',null,str(text)),
    ),
  )
}
