import { useCallback, useState } from 'react'

const createClosedVideoLimitOverlay = () => ({
  open: false,
  durationSec: null,
  source: '',
  reason: '',
})

export default function useVideoTrimController({
  emitDiag,
  forumVideoMaxSeconds,
}) {
  const [videoLimitOverlay, setVideoLimitOverlay] = useState(createClosedVideoLimitOverlay)

  const closeVideoLimitOverlay = useCallback(() => {
    setVideoLimitOverlay(createClosedVideoLimitOverlay())
  }, [])

  const showVideoLimitOverlay = useCallback((payload = {}) => {
    const durationSec = Number(payload?.durationSec)
    const reason = String(
      payload?.reason || (
        Number.isFinite(durationSec) && durationSec > forumVideoMaxSeconds ? 'too_long' : 'bad_duration'
      )
    )
    setVideoLimitOverlay({
      open: true,
      durationSec: Number.isFinite(durationSec) ? durationSec : null,
      source: String(payload?.source || ''),
      reason,
    })
    try {
      emitDiag?.('video_limit_reject', {
        source: String(payload?.source || ''),
        reason,
        durationSec: Number.isFinite(durationSec) ? Math.round(durationSec * 100) / 100 : null,
        maxSec: forumVideoMaxSeconds,
      })
    } catch {}
  }, [emitDiag, forumVideoMaxSeconds])

  return {
    videoLimitOverlay,
    closeVideoLimitOverlay,
    showVideoLimitOverlay,
  }
}
