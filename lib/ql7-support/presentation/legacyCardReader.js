import { validateQl7SupportCardAnyVersion } from '../contracts/supportCard.js'

export function readQl7SupportLegacyCard(card={}){
  const result=validateQl7SupportCardAnyVersion(card)
  return result.ok?Object.freeze({ok:true,card:result.card,legacy:Number(result.card?.version||0)<4}):Object.freeze({ok:false,error:result.error||'card_invalid',card:null,legacy:false})
}
