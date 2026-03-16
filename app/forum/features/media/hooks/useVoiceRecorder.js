import { useCallback, useEffect, useRef, useState } from 'react'

export default function useVoiceRecorder({
  setPendingAudio,
  saveComposerScroll,
  restoreComposerScroll,
  readAudioDurationSec,
  maxAudioSeconds,
  toast,
}) {
  const [recState, setRecState] = useState('idle')
  const [recElapsed, setRecElapsed] = useState(0)

  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const recTimerRef = useRef(null)
  const stopRecordRef = useRef(() => {})
  const audioBlobUrlRef = useRef(null)

  const stopRecord = useCallback(() => {
    const rec = mediaRef.current
    const isActive = !!rec && (rec.state === 'recording' || rec.state === 'paused')
    if (!isActive) return
    try { mediaRef.current?.stop() } catch {}
    try { mediaRef.current?.stream?.getTracks?.().forEach((tr) => tr.stop()) } catch {}
    mediaRef.current = null
    setRecState('idle')
    clearInterval(recTimerRef.current)
    recTimerRef.current = null
    setRecElapsed(0)
    try { restoreComposerScroll() } catch {}
  }, [restoreComposerScroll])

  useEffect(() => {
    stopRecordRef.current = stopRecord
  }, [stopRecord])

  const startRecord = useCallback(async () => {
    if (recState === 'rec') return
    try {
      try { saveComposerScroll() } catch {}
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          let audioDurationSec = NaN
          try { audioDurationSec = await readAudioDurationSec(blob) } catch {}
          if (!Number.isFinite(audioDurationSec) || audioDurationSec <= 0 || audioDurationSec > maxAudioSeconds) {
            try {
              toast?.warn?.(
                Number.isFinite(audioDurationSec) && audioDurationSec > maxAudioSeconds
                  ? `Audio limit: ${Math.floor(maxAudioSeconds / 60)} min`
                  : 'Audio duration read failed'
              )
            } catch {}
            return
          }
          try {
            const prevUrl = String(audioBlobUrlRef.current || '')
            if (prevUrl && /^blob:/i.test(prevUrl)) URL.revokeObjectURL(prevUrl)
          } catch {}
          const url = URL.createObjectURL(blob)
          audioBlobUrlRef.current = url
          setPendingAudio(url)
          try { restoreComposerScroll() } catch {}
        } catch {}
      }
      mr.start()
      mediaRef.current = mr
      setRecState('rec')
      setRecElapsed(0)
      const started = Date.now()
      clearInterval(recTimerRef.current)
      recTimerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - started) / 1000)
        setRecElapsed(Math.min(maxAudioSeconds, sec))
        if (sec >= maxAudioSeconds) {
          try { stopRecordRef.current?.() } catch {}
        }
      }, 200)
    } catch (e) {
      console.warn('mic denied', e)
    }
  }, [recState, saveComposerScroll, readAudioDurationSec, maxAudioSeconds, toast, setPendingAudio, restoreComposerScroll])

  useEffect(() => {
    return () => {
      try { clearInterval(recTimerRef.current) } catch {}
      recTimerRef.current = null
      try { mediaRef.current?.stream?.getTracks?.().forEach((tr) => tr.stop()) } catch {}
      mediaRef.current = null
      try {
        const prevUrl = String(audioBlobUrlRef.current || '')
        if (prevUrl && /^blob:/i.test(prevUrl)) URL.revokeObjectURL(prevUrl)
      } catch {}
      audioBlobUrlRef.current = null
    }
  }, [])

  return {
    recState,
    recElapsed,
    startRecord,
    stopRecord,
  }
}
