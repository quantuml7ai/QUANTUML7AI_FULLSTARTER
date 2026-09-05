import {ql7StableHash, ql7Str} from '../internal/text.js'

export const QL7_SUPPORT_SOURCE_EVIDENCE_LEXICON_VERSION='1.0.0-native32'
const R=Object.freeze({
 en:{verified:'verified',approvedSource:'approved source',sourceUnavailable:'verified source is unavailable',noGuess:'I will not guess'},
 ru:{verified:'проверено',approvedSource:'разрешённый источник',sourceUnavailable:'проверенный источник сейчас недоступен',noGuess:'не буду угадывать'},
 uk:{verified:'перевірено',approvedSource:'дозволене джерело',sourceUnavailable:'перевірене джерело зараз недоступне',noGuess:'не буду вгадувати'},
 es:{verified:'verificado',approvedSource:'fuente autorizada',sourceUnavailable:'la fuente verificada no está disponible ahora',noGuess:'no voy a adivinar'},
 tr:{verified:'doğrulandı',approvedSource:'yetkili kaynak',sourceUnavailable:'doğrulanmış kaynak şu anda kullanılamıyor',noGuess:'tahmin etmeyeceğim'},
 ar:{verified:'تم التحقق',approvedSource:'مصدر معتمد',sourceUnavailable:'المصدر المتحقق منه غير متاح الآن',noGuess:'لن أخمّن'},
 zh:{verified:'已验证',approvedSource:'获准来源',sourceUnavailable:'已验证来源当前不可用',noGuess:'我不会猜测'},
 he:{verified:'אומת',approvedSource:'מקור מורשה',sourceUnavailable:'המקור המאומת אינו זמין כעת',noGuess:'לא אנחש'},
 de:{verified:'verifiziert',approvedSource:'freigegebene Quelle',sourceUnavailable:'die verifizierte Quelle ist derzeit nicht verfügbar',noGuess:'ich werde nicht raten'},
 fr:{verified:'vérifié',approvedSource:'source approuvée',sourceUnavailable:'la source vérifiée est actuellement indisponible',noGuess:'je ne vais pas deviner'},
 it:{verified:'verificato',approvedSource:'fonte approvata',sourceUnavailable:'la fonte verificata non è disponibile al momento',noGuess:'non farò supposizioni'},
 pt:{verified:'verificado',approvedSource:'fonte aprovada',sourceUnavailable:'a fonte verificada não está disponível agora',noGuess:'não vou adivinhar'},
 pl:{verified:'zweryfikowano',approvedSource:'zatwierdzone źródło',sourceUnavailable:'zweryfikowane źródło jest teraz niedostępne',noGuess:'nie będę zgadywać'},
 nl:{verified:'geverifieerd',approvedSource:'goedgekeurde bron',sourceUnavailable:'de geverifieerde bron is momenteel niet beschikbaar',noGuess:'ik ga niet raden'},
 sv:{verified:'verifierat',approvedSource:'godkänd källa',sourceUnavailable:'den verifierade källan är inte tillgänglig just nu',noGuess:'jag kommer inte att gissa'},
 no:{verified:'verifisert',approvedSource:'godkjent kilde',sourceUnavailable:'den verifiserte kilden er ikke tilgjengelig nå',noGuess:'jeg vil ikke gjette'},
 da:{verified:'verificeret',approvedSource:'godkendt kilde',sourceUnavailable:'den verificerede kilde er ikke tilgængelig lige nu',noGuess:'jeg vil ikke gætte'},
 fi:{verified:'vahvistettu',approvedSource:'hyväksytty lähde',sourceUnavailable:'vahvistettu lähde ei ole nyt saatavilla',noGuess:'en arvaa'},
 cs:{verified:'ověřeno',approvedSource:'schválený zdroj',sourceUnavailable:'ověřený zdroj nyní není dostupný',noGuess:'nebudu hádat'},
 sk:{verified:'overené',approvedSource:'schválený zdroj',sourceUnavailable:'overený zdroj teraz nie je dostupný',noGuess:'nebudem hádať'},
 hu:{verified:'ellenőrizve',approvedSource:'jóváhagyott forrás',sourceUnavailable:'az ellenőrzött forrás jelenleg nem érhető el',noGuess:'nem fogok találgatni'},
 ro:{verified:'verificat',approvedSource:'sursă aprobată',sourceUnavailable:'sursa verificată nu este disponibilă acum',noGuess:'nu voi ghici'},
 bg:{verified:'проверено',approvedSource:'одобрен източник',sourceUnavailable:'провереният източник в момента не е достъпен',noGuess:'няма да гадая'},
 sr:{verified:'provereno',approvedSource:'odobren izvor',sourceUnavailable:'provereni izvor trenutno nije dostupan',noGuess:'neću nagađati'},
 hr:{verified:'provjereno',approvedSource:'odobren izvor',sourceUnavailable:'provjereni izvor trenutačno nije dostupan',noGuess:'neću nagađati'},
 sl:{verified:'preverjeno',approvedSource:'odobren vir',sourceUnavailable:'preverjen vir trenutno ni na voljo',noGuess:'ne bom ugibal'},
 el:{verified:'επαληθευμένο',approvedSource:'εγκεκριμένη πηγή',sourceUnavailable:'η επαληθευμένη πηγή δεν είναι διαθέσιμη τώρα',noGuess:'δεν θα μαντέψω'},
 ka:{verified:'შემოწმებულია',approvedSource:'დამტკიცებული წყარო',sourceUnavailable:'შემოწმებული წყარო ამჟამად მიუწვდომელია',noGuess:'არ გამოვიცნობ'},
 az:{verified:'yoxlanılıb',approvedSource:'təsdiqlənmiş mənbə',sourceUnavailable:'yoxlanmış mənbə hazırda əlçatan deyil',noGuess:'təxmin etməyəcəyəm'},
 kk:{verified:'тексерілді',approvedSource:'мақұлданған дереккөз',sourceUnavailable:'тексерілген дереккөз қазір қолжетімсіз',noGuess:'болжам жасамаймын'},
 ja:{verified:'確認済み',approvedSource:'承認済みソース',sourceUnavailable:'確認済みソースは現在利用できません',noGuess:'推測しません'},
 ko:{verified:'검증됨',approvedSource:'승인된 출처',sourceUnavailable:'검증된 출처를 현재 사용할 수 없습니다',noGuess:'추측하지 않겠습니다'},
})
export const QL7_SUPPORT_SOURCE_EVIDENCE_LEXICON=Object.freeze(Object.fromEntries(Object.entries(R).map(([locale,row])=>[locale,Object.freeze({...row})])))
export function getQl7SupportSourceEvidenceLexicon(locale='en'){
 const key=ql7Str(locale).toLowerCase().split(/[-_]/u)[0]
 const row=QL7_SUPPORT_SOURCE_EVIDENCE_LEXICON[key]
 if(!row)throw Object.assign(new Error(`ql7_source_evidence_locale_unsupported:${locale}`),{code:'ql7_source_evidence_locale_unsupported'})
 return row
}
export function auditQl7SupportSourceEvidenceLexicon(){
 const failures=[];for(const [locale,row] of Object.entries(QL7_SUPPORT_SOURCE_EVIDENCE_LEXICON)){for(const key of ['verified','approvedSource','sourceUnavailable','noGuess'])if(!ql7Str(row[key]))failures.push(`${locale}:${key}`)}
 return Object.freeze({ok:failures.length===0,version:QL7_SUPPORT_SOURCE_EVIDENCE_LEXICON_VERSION,localeCount:Object.keys(QL7_SUPPORT_SOURCE_EVIDENCE_LEXICON).length,entryCount:Object.keys(QL7_SUPPORT_SOURCE_EVIDENCE_LEXICON).length*4,contentHash:ql7StableHash(JSON.stringify(QL7_SUPPORT_SOURCE_EVIDENCE_LEXICON)),failures:Object.freeze(failures)})
}
