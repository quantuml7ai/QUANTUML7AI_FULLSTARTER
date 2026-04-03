import { useCallback } from 'react'

export default function useForumPopoverModeController({
  closeSharePopover,
  popoverControlsRef,
}) {
  return useCallback((name) => {
    const controls = popoverControlsRef?.current || {}

    controls.setProfileOpen?.(false)
    controls.setVipOpen?.(false)
    controls.setAdminOpen?.(false)
    controls.setQcoinModalOpen?.(false)
    controls.setSortOpen?.(false)
    controls.setDrop?.(false)
    try { closeSharePopover?.() } catch {}

    if (name === 'profile') controls.setProfileOpen?.(true)
    else if (name === 'vip') controls.setVipOpen?.(true)
    else if (name === 'admin') controls.setAdminOpen?.(true)
    else if (name === 'qcoin') controls.setQcoinModalOpen?.(true)
    else if (name === 'sort') controls.setSortOpen?.(true)
    else if (name === 'search') controls.setDrop?.(true)
  }, [closeSharePopover, popoverControlsRef])
}
