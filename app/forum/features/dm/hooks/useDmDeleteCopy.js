import { useMemo } from 'react'

export default function useDmDeleteCopy({
  dmDeletePopover,
  t,
  shortIdFn,
}) {
  return useMemo(() => {
    const dmDeleteName = dmDeletePopover?.nick || (dmDeletePopover?.uid ? shortIdFn(dmDeletePopover.uid) : '')
    const dmDeleteText = dmDeletePopover?.kind === 'dialog'
      ? t('dm_delete_dialog_warning')
      : t('dm_delete_msg_warning')
    const dmDeleteCheckboxLabel = dmDeletePopover
      ? t('dm_delete_for_all').replace('{name}', dmDeleteName || shortIdFn(dmDeletePopover?.uid || ''))
      : ''

    return {
      dmDeleteName,
      dmDeleteText,
      dmDeleteCheckboxLabel,
    }
  }, [dmDeletePopover, shortIdFn, t])
}
