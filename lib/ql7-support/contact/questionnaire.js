import {ql7StableHash, ql7Str} from '../internal/text.js'
export const QL7_SUPPORT_CONTACT_QUESTIONNAIRE_VERSION='5.1.0'
export const QL7_SUPPORT_CONTACT_QUESTIONNAIRE_FIELDS=Object.freeze(['firstName','lastName','additionalName','organization','role','countryOrTimeZone','preferredChannel','convenientTime','purposeSummary','contactConsent'])
const REFUSAL=/(?:^|\b)(?:нет|не\s+желаю|не\s+хочу|пропустить|skip|no|decline|prefiero\s+no|paso|istemiyorum|atla|لا\s+أريد|تخط|不要|跳过|לא\s+רוצה|דלג)(?:\b|$)/iu
function clean(v=''){return ql7Str(v).replace(/[\r\n\t]+/gu,' ').replace(/\s{2,}/gu,' ').slice(0,240)}
export function buildQl7SupportContactQuestionnaire({locale='en',consentReceipt=null,previous={},input={}}={}){
 const consent=consentReceipt?.state==='granted';if(!consent)return Object.freeze({schema:'ql7.support.contact-questionnaire',schemaVersion:QL7_SUPPORT_CONTACT_QUESTIONNAIRE_VERSION,locale,state:'not_permitted_without_consent',fields:Object.freeze({}),declined:false,readyToSend:false})
 const text=clean(input?.text||'');const declined=REFUSAL.test(text)
 const fields={...previous}
 for(const key of QL7_SUPPORT_CONTACT_QUESTIONNAIRE_FIELDS){if(input?.[key]!==undefined&&input?.[key]!==null)fields[key]=clean(input[key])}
 const body={schema:'ql7.support.contact-questionnaire',schemaVersion:QL7_SUPPORT_CONTACT_QUESTIONNAIRE_VERSION,locale:ql7Str(locale),state:declined?'declined':'optional',fields:Object.freeze(fields),declined,repeatContactPromptForbidden:declined,allFieldsOptional:true,readyToSend:false,finalText:false}
 return Object.freeze({...body,questionnaireHash:ql7StableHash(JSON.stringify(body))})
}
export function auditQl7SupportContactQuestionnaire(value={}){const failures=[];if(value?.allFieldsOptional!==true)failures.push('optional');if(value?.readyToSend!==false)failures.push('ready_text');if(value?.declined&&value?.repeatContactPromptForbidden!==true)failures.push('decline_repeat');return Object.freeze({ok:failures.length===0,failures:Object.freeze(failures)})}
