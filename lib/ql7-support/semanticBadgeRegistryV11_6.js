
function str(v){return String(v??'').trim()}
const SUPPORTED_BADGE_LOCALES=Object.freeze(['en','ru','uk','es','tr','ar','zh','he','de','fr','it','pt','pl','nl','sv','no','da','fi','cs','sk','hu','ro','bg','sr','hr','sl','el','ka','az','kk','ja','ko'])
function localeKey(v=''){const key=str(v).toLowerCase().split(/[-_]/u)[0];return SUPPORTED_BADGE_LOCALES.includes(key)?key:'en'}
function numeric(v){const value=Number(v);return Number.isFinite(value)&&value>0?value:0}
function formatTimer(seconds=0){const total=Math.max(0,Math.ceil(Number(seconds)||0));const h=Math.floor(total/3600);const m=Math.floor((total%3600)/60);const s=String(total%60).padStart(2,'0');return h>0?`${h}:${String(m).padStart(2,'0')}:${s}`:`${m}:${s}`}

export const QL7_SEMANTIC_BADGES_V11_6=Object.freeze({
 info:{tone:'info',label:'Information'},information:{tone:'info',label:'Information'},analytics:{tone:'analytics',label:'Analytics'},confirmed:{tone:'success',label:'Confirmed'},partial:{tone:'warning',label:'Partially confirmed'},warning:{tone:'warning',label:'Warning'},danger:{tone:'danger',label:'Danger'},stop:{tone:'blocked',label:'Pause'},blocked:{tone:'blocked',label:'Pause'},security:{tone:'security',label:'Security'},checking:{tone:'analytics',label:'Checking'},waiting:{tone:'serious',label:'Waiting'},clarification:{tone:'question',label:'Clarification'},choice:{tone:'question',label:'Choice'},success:{tone:'success',label:'Success'},joy:{tone:'joy',label:'Joy'},gratitude:{tone:'joy',label:'Gratitude'},humor:{tone:'joy',label:'Humor'},serious:{tone:'serious',label:'Serious'},operator:{tone:'operator',label:'Sent to operator'},operator_handoff:{tone:'operator',label:'Sent to operator'},translation:{tone:'info',label:'Translation'},qcoin:{tone:'success',label:'QCoin'},ads_package:{tone:'analytics',label:'Advertising package'},ads_metrics:{tone:'analytics',label:'Advertising metrics'},vip:{tone:'joy',label:'VIP'},wallet:{tone:'security',label:'Quantum Wallet'},forum:{tone:'info',label:'Forum'},moderation:{tone:'warning',label:'Moderation'},account_deletion:{tone:'danger',label:'Account deletion'},privacy:{tone:'security',label:'Privacy'},payment:{tone:'operator',label:'Payment'},exchange:{tone:'analytics',label:'Exchange'},time:{tone:'analytics',label:'Time'},context:{tone:'info',label:'Context'},identity:{tone:'security',label:'Identity'},conversation:{tone:'info',label:'Conversation'},evidence:{tone:'analytics',label:'Evidence'},incident:{tone:'danger',label:'Incident'},appeal:{tone:'question',label:'Appeal'},fraud:{tone:'danger',label:'Fraud'},threat:{tone:'danger',label:'Threat'},cooldown:{tone:'blocked',label:'Pause'},resolved:{tone:'success',label:'Resolved'},
})

const SPECIAL_LABELS=Object.freeze({
 en:{warning:'Warning',operator:'Sent to operator',operator_handoff:'Sent to operator',stop:'Pause',blocked:'Pause',cooldown:'Pause'},
 ru:{warning:'\u041f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435',operator:'\u041f\u0435\u0440\u0435\u0434\u0430\u043d\u043e \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u0443',operator_handoff:'\u041f\u0435\u0440\u0435\u0434\u0430\u043d\u043e \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u0443',stop:'\u041f\u0430\u0443\u0437\u0430',blocked:'\u041f\u0430\u0443\u0437\u0430',cooldown:'\u041f\u0430\u0443\u0437\u0430'},
 uk:{warning:'\u041f\u043e\u043f\u0435\u0440\u0435\u0434\u0436\u0435\u043d\u043d\u044f',operator:'\u041f\u0435\u0440\u0435\u0434\u0430\u043d\u043e \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u0443',operator_handoff:'\u041f\u0435\u0440\u0435\u0434\u0430\u043d\u043e \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u0443',stop:'\u041f\u0430\u0443\u0437\u0430',blocked:'\u041f\u0430\u0443\u0437\u0430',cooldown:'\u041f\u0430\u0443\u0437\u0430'},
 es:{warning:'Aviso',operator:'Enviado a soporte',operator_handoff:'Enviado a soporte',stop:'Pausa',blocked:'Pausa',cooldown:'Pausa'},
 tr:{warning:'Uyarı',operator:'Destek ekibine iletildi',operator_handoff:'Destek ekibine iletildi',stop:'Duraklama',blocked:'Duraklama',cooldown:'Duraklama'},
 ar:{warning:'\u062a\u0646\u0628\u064a\u0647',operator:'\u062a\u0645 \u062a\u062d\u0648\u064a\u0644\u0647 \u0625\u0644\u0649 \u0627\u0644\u0645\u0634\u063a\u0644',operator_handoff:'\u062a\u0645 \u062a\u062d\u0648\u064a\u0644\u0647 \u0625\u0644\u0649 \u0627\u0644\u0645\u0634\u063a\u0644',stop:'\u0625\u064a\u0642\u0627\u0641 \u0645\u0624\u0642\u062a',blocked:'\u0625\u064a\u0642\u0627\u0641 \u0645\u0624\u0642\u062a',cooldown:'\u0625\u064a\u0642\u0627\u0641 \u0645\u0624\u0642\u062a'},
 zh:{warning:'\u8b66\u544a',operator:'\u5df2\u8f6c\u4ea4\u5ba2\u670d',operator_handoff:'\u5df2\u8f6c\u4ea4\u5ba2\u670d',stop:'\u6682\u505c',blocked:'\u6682\u505c',cooldown:'\u6682\u505c'},
 he:{warning:'\u05d0\u05d6\u05d4\u05e8\u05d4',operator:'\u05d4\u05d5\u05e2\u05d1\u05e8 \u05dc\u05de\u05e4\u05e2\u05d9\u05dc',operator_handoff:'\u05d4\u05d5\u05e2\u05d1\u05e8 \u05dc\u05de\u05e4\u05e2\u05d9\u05dc',stop:'\u05d4\u05e9\u05d4\u05d9\u05d4',blocked:'\u05d4\u05e9\u05d4\u05d9\u05d4',cooldown:'\u05d4\u05e9\u05d4\u05d9\u05d4'},
 de:{warning:'Warnung',operator:'An Betreuung übergeben',operator_handoff:'An Betreuung übergeben',stop:'Pause',blocked:'Pause',cooldown:'Pause'},
 fr:{warning:'Avertissement',operator:'Transmis à l’assistance',operator_handoff:'Transmis à l’assistance',stop:'Pause',blocked:'Pause',cooldown:'Pause'},
 it:{warning:'Avviso',operator:'Inviato al supporto',operator_handoff:'Inviato al supporto',stop:'Pausa',blocked:'Pausa',cooldown:'Pausa'},
 pt:{warning:'Aviso',operator:'Enviado ao suporte',operator_handoff:'Enviado ao suporte',stop:'Pausa',blocked:'Pausa',cooldown:'Pausa'},
 pl:{warning:'Ostrzeżenie',operator:'Przekazano do obsługi',operator_handoff:'Przekazano do obsługi',stop:'Pauza',blocked:'Pauza',cooldown:'Pauza'},
 ro:{warning:'Avertisment',operator:'Trimis asistenței',operator_handoff:'Trimis asistenței',stop:'Pauză',blocked:'Pauză',cooldown:'Pauză'},
nl:{warning:'Waarschuwing',operator:'Doorgegeven aan ondersteuning',operator_handoff:'Doorgegeven aan ondersteuning',stop:'Pauze',blocked:'Pauze',cooldown:'Pauze'},
sv:{warning:'Varning',operator:'Skickat till operatör',operator_handoff:'Skickat till operatör',stop:'Paus',blocked:'Paus',cooldown:'Paus'},
no:{warning:'Advarsel',operator:'Sendt til operatør',operator_handoff:'Sendt til operatør',stop:'Pause',blocked:'Pause',cooldown:'Pause'},
da:{warning:'Advarsel',operator:'Sendt til operatør',operator_handoff:'Sendt til operatør',stop:'Pause',blocked:'Pause',cooldown:'Pause'},
fi:{warning:'Varoitus',operator:'Lähetetty operaattorille',operator_handoff:'Lähetetty operaattorille',stop:'Tauko',blocked:'Tauko',cooldown:'Tauko'},
cs:{warning:'Upozornění',operator:'Předáno podpoře',operator_handoff:'Předáno podpoře',stop:'Pauza',blocked:'Pauza',cooldown:'Pauza'},
 sk:{warning:'Upozornenie',operator:'Odovzdané podpore',operator_handoff:'Odovzdané podpore',stop:'Pauza',blocked:'Pauza',cooldown:'Pauza'},
 hu:{warning:'Figyelmeztetés',operator:'Átadva ügyfélszolgálatnak',operator_handoff:'Átadva ügyfélszolgálatnak',stop:'Szünet',blocked:'Szünet',cooldown:'Szünet'},
bg:{warning:'Предупреждение',operator:'Предадено на оператор',operator_handoff:'Предадено на оператор',stop:'Пауза',blocked:'Пауза',cooldown:'Пауза'},
sr:{warning:'Upozorenje',operator:'Poslato operateru',operator_handoff:'Poslato operateru',stop:'Pauza',blocked:'Pauza',cooldown:'Pauza'},
hr:{warning:'Upozorenje',operator:'Poslano operateru',operator_handoff:'Poslano operateru',stop:'Pauza',blocked:'Pauza',cooldown:'Pauza'},
sl:{warning:'Opozorilo',operator:'Poslano operaterju',operator_handoff:'Poslano operaterju',stop:'Premor',blocked:'Premor',cooldown:'Premor'},
el:{warning:'Προειδοποίηση',operator:'Διαβιβάστηκε σε χειριστή',operator_handoff:'Διαβιβάστηκε σε χειριστή',stop:'Παύση',blocked:'Παύση',cooldown:'Παύση'},
 id:{warning:'Peringatan',operator:'Diteruskan ke dukungan',operator_handoff:'Diteruskan ke dukungan',stop:'Jeda',blocked:'Jeda',cooldown:'Jeda'},
 vi:{warning:'Cảnh báo',operator:'Đã chuyển cho điều hành viên',operator_handoff:'Đã chuyển cho điều hành viên',stop:'Tạm dừng',blocked:'Tạm dừng',cooldown:'Tạm dừng'},
 hi:{warning:'चेतावनी',operator:'ऑपरेटर को भेजा गया',operator_handoff:'ऑपरेटर को भेजा गया',stop:'विराम',blocked:'विराम',cooldown:'विराम'},
 ur:{warning:'انتباہ',operator:'آپریٹر کو بھیجا گیا',operator_handoff:'آپریٹر کو بھیجا گیا',stop:'وقفہ',blocked:'وقفہ',cooldown:'وقفہ'},
 fa:{warning:'هشدار',operator:'به اپراتور منتقل شد',operator_handoff:'به اپراتور منتقل شد',stop:'مکث',blocked:'مکث',cooldown:'مکث'},
 az:{warning:'Xəbərdarlıq',operator:'Dəstəyə ötürüldü',operator_handoff:'Dəstəyə ötürüldü',stop:'Fasilə',blocked:'Fasilə',cooldown:'Fasilə'},
 ka:{warning:'გაფრთხილება',operator:'გადაეცა ოპერატორს',operator_handoff:'გადაეცა ოპერატორს',stop:'პაუზა',blocked:'პაუზა',cooldown:'პაუზა'},
 kk:{warning:'Ескерту',operator:'Операторға берілді',operator_handoff:'Операторға берілді',stop:'Үзіліс',blocked:'Үзіліс',cooldown:'Үзіліс'},
 uz:{warning:'Ogohlantirish',operator:'Yordamga yuborildi',operator_handoff:'Yordamga yuborildi',stop:'Pauza',blocked:'Pauza',cooldown:'Pauza'},
 ja:{warning:'警告',operator:'オペレーターに転送済み',operator_handoff:'オペレーターに転送済み',stop:'一時停止',blocked:'一時停止',cooldown:'一時停止'},
 ko:{warning:'경고',operator:'운영자에게 전달됨',operator_handoff:'운영자에게 전달됨',stop:'일시 중지',blocked:'일시 중지',cooldown:'일시 중지'},
 th:{warning:'คำเตือน',operator:'ส่งต่อให้ผู้ดูแลแล้ว',operator_handoff:'ส่งต่อให้ผู้ดูแลแล้ว',stop:'พัก',blocked:'พัก',cooldown:'พัก'},
})
const SPECIAL_KEYS=new Set(['warning','operator','operator_handoff','stop','blocked','cooldown'])
const KEY_ALIASES=Object.freeze({restriction:'blocked',restricted:'blocked',paused:'stop',pause:'stop',handoff:'operator_handoff',human_operator:'operator_handoff',human_operator_request:'operator_handoff',tone_warning:'warning'})
const PURPOSE=Object.freeze({greeting:'joy',explanation:'info',ecosystem_context:'info',data_table:'analytics',diagnostic:'checking',complaint:'warning',safety:'danger',violation:'stop',restriction:'stop',payment_incident:'payment',success:'success',choice:'choice',operator_handoff:'operator'})

export function normalizeQl7SemanticBadgeKeyV11_6(value=''){
 const key=str(value).toLowerCase().replace(/[\s-]+/gu,'_')
 const aliased=KEY_ALIASES[key]||key
 return QL7_SEMANTIC_BADGES_V11_6[aliased]?aliased:''
}

function secondsFromTimerV11_6(value=''){
 const match=str(value).match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/u)
 if(!match)return 0
 const a=Number(match[1]);const b=Number(match[2]);const c=match[3]===undefined?0:Number(match[3])
 if(!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(c))return 0
 return match[3]===undefined?(a*60+b):(a*3600+b*60+c)
}

function badgeSecondsV11_6(badge={}){
 const direct=numeric(badge?.seconds)||numeric(badge?.remainingSeconds)||numeric(badge?.cooldownSeconds)||numeric(badge?.blockedSeconds)
 if(direct)return direct
 const ms=numeric(badge?.cooldownMs)||numeric(badge?.remainingMs)||numeric(badge?.blockedMs)
 if(ms)return Math.ceil(ms/1000)
 return secondsFromTimerV11_6(badge?.label||badge?.value)
}

function inferRailBadgeKeyV11_6(badge={}){
 const icon=normalizeQl7SemanticBadgeKeyV11_6(badge?.icon||badge?.iconKey||badge?.semanticIcon)
 if(SPECIAL_KEYS.has(icon))return icon
 const tone=normalizeQl7SemanticBadgeKeyV11_6(badge?.tone)
 if(SPECIAL_KEYS.has(tone))return tone
 const label=str(badge?.label||badge?.value).normalize('NFKC').toLowerCase()
 if(/^(?:warning|предупреждение|попередження|aviso|uyari|تنبيه|警告|אזהרה)(?:\s|$)/iu.test(label))return'warning'
 if(/operator|оператор|оператору|operador|operatore|المشغل|客服|מפעיל/iu.test(label))return'operator_handoff'
 if(/^(?:blocked|restricted|pause|paused|пауза|на паузе|pausa|duraklama|إيقاف|暂停|השהיה)/iu.test(label))return badgeSecondsV11_6(badge)?'cooldown':'blocked'
 return''
}

export function localizeQl7SemanticBadgeLabelV11_6(key='',locale='en',{seconds=0,fallback=''}={}){
 const normalized=normalizeQl7SemanticBadgeKeyV11_6(key)
 const language=localeKey(locale)
 const label=SPECIAL_LABELS[language]?.[normalized]||str(fallback)||QL7_SEMANTIC_BADGES_V11_6[normalized]?.label||''
 const timer=['stop','blocked','cooldown'].includes(normalized)?numeric(seconds):0
 return timer?`${label} ${formatTimer(timer)}`:label
}

export function localizeQl7SupportBadgeRailLabelV11_6(badge={},locale='en'){
 const raw=str(badge?.label||badge?.value)
 const key=inferRailBadgeKeyV11_6(badge)
 if(!SPECIAL_KEYS.has(key))return raw
 return localizeQl7SemanticBadgeLabelV11_6(key,locale,{seconds:badgeSecondsV11_6(badge),fallback:raw})
}

export function resolveQl7SemanticBadgeV11_6({semanticIcon='',purpose='',status='',topic='',emotion='',locale='en',seconds=0}={}){
 let key=normalizeQl7SemanticBadgeKeyV11_6(semanticIcon)
 if(!QL7_SEMANTIC_BADGES_V11_6[key]){
  if(/qcoin/iu.test(topic))key='qcoin';else if(/ads_package/iu.test(topic))key='ads_package';else if(/ads/iu.test(topic))key='ads_metrics';else if(/vip/iu.test(topic))key='vip';else if(/wallet/iu.test(topic))key='wallet';else if(/moderation/iu.test(topic))key='moderation';else if(/payment/iu.test(topic))key='payment';else if(/exchange/iu.test(topic))key='exchange';else if(/cooldown|paused/iu.test(status))key='cooldown';else if(/blocked|violation|restricted/iu.test(status))key='stop';else if(/warning|review/iu.test(status))key='warning';else if(/confirm|healthy|success|resolved/iu.test(status))key='confirmed';else key=PURPOSE[str(purpose)]||(['joyful','grateful','humorous'].includes(str(emotion))?'joy':'info')
 }
 const base=QL7_SEMANTIC_BADGES_V11_6[key]
 return Object.freeze({key,...base,label:localizeQl7SemanticBadgeLabelV11_6(key,locale,{seconds,fallback:base.label})})
}
export function listQl7SemanticBadgeKeysV11_6(){return Object.freeze(Object.keys(QL7_SEMANTIC_BADGES_V11_6))}
