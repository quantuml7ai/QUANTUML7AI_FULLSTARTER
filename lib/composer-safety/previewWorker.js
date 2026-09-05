import {classifyComposerPreview} from './clientPreview.js'

self.onmessage = (event) => {
  const payload = event?.data || {}
  const row = classifyComposerPreview(payload.text, { locale: payload.locale || 'und', targeted: payload.targeted === true })
  self.postMessage({ ...row, authoritative: false, source: 'client_preview_worker' })
}
