'use client'

import React from 'react'

export default function DmThreadAlerts({
  dmWithUserId,
  dmBlockedMap,
  dmBlockedByReceiverMap,
  t,
}) {
  const threadUid = String(dmWithUserId || '').trim()
  return (
    <>
      {dmBlockedMap?.[threadUid] && (
        <div className="meta">{t('dm_you_blocked')}</div>
      )}
      {dmBlockedByReceiverMap?.[threadUid] && (
        <div className="meta">{t('dm_blocked_by_receiver')}</div>
      )}
    </>
  )
}

