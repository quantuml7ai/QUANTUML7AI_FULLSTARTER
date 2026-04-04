import Image from 'next/image'

export default function QuestLaunchIcon({
  t,
  q,
  questEnabled,
  questBtnClass,
  openQuests,
}) {
  return (
    <Image
      src="/click/quest.gif"
      unoptimized
      width={52}
      height={52}
      alt=""
      role="button"
      aria-label={t('quest_open')}
      aria-disabled={!questEnabled}
      tabIndex={questEnabled ? 0 : -1}
      onClick={() => {
        try { window.dispatchEvent(new Event('qcoin:open')) } catch {}
        try { q?.open?.() } catch {}
      }}
      onKeyDown={(e) => {
        if (!questEnabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openQuests?.()
        }
      }}
      draggable={false}
      className={`questIconPure ${typeof questBtnClass !== 'undefined' ? questBtnClass : ''}`}
      style={{
        ['--quest-w']: '52px',
        ['--quest-h']: 'auto',
        ['--quest-cursor']: questEnabled ? 'pointer' : 'default',
        ['--quest-y']: '-14px',
        width: '52px',
        height: 'auto',
      }}
    />
  )
}
