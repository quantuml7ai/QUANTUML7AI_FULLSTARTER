import Image from 'next/image'

export default function QuestLaunchIcon({
  t,
  questBtnClass,
}) {
  const openQuantumWallet = () => {
    try {
      window.dispatchEvent(new CustomEvent('quantum-wallet:open'))
    } catch {}
  }

  return (
    <Image
      src="/click/quest.gif"
      unoptimized
      width={52}
      height={52}
      alt=""
      role="button"
      aria-label={t?.('quantum_wallet_open_aria') || t?.('quest_open') || 'Open Quantum Wallet'}
      aria-disabled={false}
      tabIndex={0}
      onClick={openQuantumWallet}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openQuantumWallet()
        }
      }}
      draggable={false}
      className={`questIconPure ${typeof questBtnClass !== 'undefined' ? questBtnClass : ''}`}
      style={{
        ['--quest-w']: '52px',
        ['--quest-h']: 'auto',
        ['--quest-cursor']: 'pointer',
        ['--quest-y']: '-14px',
        width: 'var(--quest-w)',
        height: 'var(--quest-h)',
      }}
    />
  )
}
