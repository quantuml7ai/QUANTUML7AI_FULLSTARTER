function asProposition(row,index){
 if(row&&typeof row==='object'&&!Array.isArray(row))return row
 const text=String(row??'').trim()
 return Object.freeze({id:text||`proposition-${index+1}`,text})
}
export function placeQl7Propositions(rows=[]){
 const used=new Set()
 return Object.freeze((Array.isArray(rows)?rows:[]).map((row,index)=>{
  const r=asProposition(row,index);const id=String(r.id||r.propositionId||r.text||`proposition-${index+1}`);const slot=r.requiredAccessibilityRepeat?'accessibility-repeat':used.has(id)?'body':String(r.preferredSlot||'body');used.add(id);return Object.freeze({...r,presentationSlot:slot})
 }))
}
