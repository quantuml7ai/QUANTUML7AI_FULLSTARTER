'use client'
import React from 'react'
import { classifyComposerPreview, composerPreviewBadgeFromClass, QL7_COMPOSER_PREVIEW_DEBOUNCE_MS, resolveComposerPreviewUpdate } from '../../../../../lib/composer-safety/clientPreview.js'

const SERVER_PREVIEW_SURFACES = new Set(['forum','dm','battle_chat'])

function withBadge(row = {}, source = '') {
  const badge = composerPreviewBadgeFromClass(row?.classId)
  return badge ? { ...row, ...badge, ...(source ? { source } : {}) } : { ...row, ...(source ? { source } : {}) }
}

export default function useComposerSafetyPreview(text='', { enabled=true, locale='und', targeted=false, surface='forum' } = {}) {
  const [state,setState]=React.useState(null)
  React.useEffect(()=>{
    if(!enabled){setState(null);return undefined}
    const value=String(text||'')
    if(!value.trim()){setState(null);return undefined}
    let worker=null
    let aborted=false
    let localCandidate=null
    let serverSettled=false
    const controller=typeof AbortController==='function'?new AbortController():null
    const commit=(row,source,authoritative=false)=>{
      if(aborted)return
      const candidate=withBadge(row,source)
      setState(previous=>resolveComposerPreviewUpdate(previous,candidate,{authoritative}))
    }
    const localTimer=setTimeout(()=>{
      try {
        if(typeof Worker==='function') worker=new Worker(new URL('../../../../../lib/composer-safety/previewWorker.js', import.meta.url),{type:'module'})
      } catch { worker=null }
      if(!worker){
        localCandidate=classifyComposerPreview(value,{locale,targeted});commit(localCandidate,'client_preview_fallback');return
      }
      const done=(row)=>{localCandidate=row;commit(row,row?.source||'client_preview_worker');try{worker.terminate()}catch{} }
      worker.onmessage=(event)=>done(event.data||{})
      worker.onerror=()=>done({...classifyComposerPreview(value,{locale,targeted}),source:'client_preview_fallback'})
      worker.postMessage({text:value,locale,targeted})
    },Math.max(320,QL7_COMPOSER_PREVIEW_DEBOUNCE_MS-100))

    const serverTimer=setTimeout(async()=>{
      if(!SERVER_PREVIEW_SURFACES.has(String(surface||'')))return
      try{
        const response=await fetch('/api/composer-safety/preview',{
          method:'POST',headers:{'content-type':'application/json'},cache:'no-store',signal:controller?.signal,
          body:JSON.stringify({text:value,locale,targeted,surface}),
        })
        const row=await response.json().catch(()=>null)
        if(!aborted&&response.ok&&row?.ok===true){serverSettled=true;commit(row,'server_semantic_preview',true)}
      }catch(error){ if(error?.name!=='AbortError'){} }
    },QL7_COMPOSER_PREVIEW_DEBOUNCE_MS)

    const fallbackTimer=setTimeout(()=>{
      if(!serverSettled&&localCandidate)commit(localCandidate,localCandidate?.source||'client_preview_settled',true)
    },QL7_COMPOSER_PREVIEW_DEBOUNCE_MS+650)

    return()=>{aborted=true;clearTimeout(localTimer);clearTimeout(serverTimer);clearTimeout(fallbackTimer);try{controller?.abort()}catch{};try{worker?.terminate()}catch{}}
  },[text,enabled,locale,targeted,surface])
  return state
}
