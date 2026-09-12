import { useEffect, useMemo, useState } from 'react'

export default function QuestClaimOverlay({
  claimFx,
  t,
  onClose,
  onClaim,
}) {
  const [loading, setLoading] = useState(false)
  const open = !!claimFx?.open

  useEffect(() => {
    if (!open) setLoading(false)
  }, [open])

  const pieces = useMemo(() => {
    return Array.isArray(claimFx?.pieces) ? claimFx.pieces : []
  }, [claimFx?.pieces])

  const amount = useMemo(() => {
    const n = Number(claimFx?.amount)
    return Number.isFinite(n) ? n : 0
  }, [claimFx?.amount])

  const safeLabel = (value, fallback) => {
    const raw = String(value ?? '').replace(/\uFFFD/g, '').trim()
    if (!raw) return fallback
    const visible = raw.replace(/\s+/g, '')
    if (visible.length < 2) return fallback
    return raw
  }

  const rewardTitle = useMemo(
    () => safeLabel(t?.('quest_reward_claimed'), 'Reward credited'),
    [t],
  )
  const claimTitle = useMemo(
    () => safeLabel(t?.('quest_claim'), 'Claim'),
    [t],
  )

  const handleConfirm = async () => {
    if (loading) return
    setLoading(true)
    try {
      const shouldClose = await onClaim?.()
      if (shouldClose) onClose?.()
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="coinBurstOverlay" onClick={onClose}>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="coinPiece"
          style={{
            marginLeft: `${piece.x}vw`,
            animationDelay: `${piece.delay}ms`,
            width: piece.size,
            height: piece.size,
          }}
        />
      ))}
      <div className="coinBurstBox" onClick={(e) => e.stopPropagation()}>
        <div className="coinCongrats">{rewardTitle}</div>
        <div className="coinSum">+ {amount.toFixed(10)}</div>
        <button
          className="coinClaimBtn"
          onClick={handleConfirm}
          disabled={loading}
          data-loading={loading ? '1' : '0'}
        >
          {claimTitle}
        </button>
      </div>
    </div>
  )
}
