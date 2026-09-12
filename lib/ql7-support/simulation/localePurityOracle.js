import crypto from 'node:crypto'
export const QL7_LOCALE_PURITY_ORACLE_VERSION='5.1.0-independent'
const STOP=Object.freeze({
 en:['the','and','is','you','your'],ru:['это','и','вы','ваш','можно'],uk:['це','і','ви','ваш','можна'],es:['el','la','y','que','puede'],tr:['ve','bu','için','bir','ile'],de:['der','die','und','ist','sie'],fr:['le','la','et','est','vous'],it:['il','la','e','che','può'],pt:['o','a','e','que','você'],pl:['i','jest','to','może','dla'],nl:['de','het','en','is','u'],sv:['och','det','är','du','kan'],no:['og','det','er','du','kan'],da:['og','det','er','du','kan'],fi:['ja','on','se','voit','sinun'],cs:['a','je','to','může','pro'],sk:['a','je','to','môže','pre'],hu:['és','az','egy','lehet','ön'],ro:['și','este','un','poate','pentru'],bg:['и','е','това','може','за'],sr:['i','je','to','može','za'],hr:['i','je','to','može','za'],sl:['in','je','to','lahko','za'],el:['και','είναι','το','μπορεί','για'],az:['və','bu','üçün','bir','ilə'],kk:['және','бұл','үшін','бір','болады']
})
function words(v=''){return String(v||'').toLowerCase().normalize('NFKC').match(/[\p{L}]+/gu)||[]}
function scriptScore(text,locale){const t=String(text||'');if(locale==='zh')return (t.match(/[\p{Script=Han}]/gu)||[]).length;if(locale==='ja')return (t.match(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu)||[]).length;if(locale==='ko')return (t.match(/[\p{Script=Hangul}]/gu)||[]).length;if(locale==='ar')return (t.match(/[\p{Script=Arabic}]/gu)||[]).length;if(locale==='he')return (t.match(/[\p{Script=Hebrew}]/gu)||[]).length;if(locale==='ka')return (t.match(/[\p{Script=Georgian}]/gu)||[]).length;if(['ru','uk','bg'].includes(locale))return (t.match(/[\p{Script=Cyrillic}]/gu)||[]).length;if(locale==='el')return (t.match(/[\p{Script=Greek}]/gu)||[]).length;return 0}
export function evaluateLocalePurityIndependent({text='',locale='en',allowCodeSwitch=false}={}){
 const lang=String(locale||'en').toLowerCase().split('-')[0];const ws=words(text);const score=scriptScore(text,lang);let foreignEnglish=0
 if(lang!=='en'&&STOP.en)foreignEnglish=ws.filter(w=>STOP.en.includes(w)).length
 const stopHits=(STOP[lang]||[]).reduce((n,w)=>n+ws.filter(x=>x===w).length,0)
 const scriptLocales=new Set(['zh','ja','ko','ar','he','ka','ru','uk','bg','el'])
 const scriptOk=!scriptLocales.has(lang)||score>0||ws.length<2
 const englishLeak=!allowCodeSwitch&&lang!=='en'&&foreignEnglish>=3&&foreignEnglish>stopHits
 const failures=[];if(!scriptOk)failures.push('expected_script_missing');if(englishLeak)failures.push('english_fallback_leak')
 const body={oracle:'locale-purity-independent',version:QL7_LOCALE_PURITY_ORACLE_VERSION,locale:lang,scriptScore:score,stopHits,foreignEnglish,ok:!failures.length,failures}
 return Object.freeze({...body,receiptHash:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')})
}
