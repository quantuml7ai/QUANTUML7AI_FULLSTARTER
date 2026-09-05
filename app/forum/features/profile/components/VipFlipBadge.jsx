'use client'

import React from 'react'
import Image from 'next/image'
import { useI18n } from '../../../../../components/i18n'
import { cls } from '../../../shared/utils/classnames'

const VIP_BADGE_IMG_1 = '/isvip/1.png'
const VIP_BADGE_IMG_2 = '/isvip/2.png'

export function AvatarBadgeOverlay({ vipActive = false, showInfo = false, className = '' }) {
  if (!vipActive && !showInfo) return null
  return (
    <span className={cls('ql7AvatarBadgeOverlay', className)} data-avatar-badge-overlay="1">
      {showInfo && <span className="ql7AvatarInfoHint" aria-hidden="true">i</span>}
      {vipActive && (
        <span className="ql7AvatarVipDock" data-visible="1">
          <VipFlipBadge className="ql7AvatarVipBadge" />
        </span>
      )}
    </span>
  )
}

export default function VipFlipBadge({ className = '' }) {
  const { t } = useI18n()
  return (
    <span className={cls('vipFlip', className)} aria-label={t?.('forum_vip_label')} title={t?.('forum_vip_label')}>
      <Image className="vipFlipImg vip1" src={VIP_BADGE_IMG_1} alt="" fill sizes="32px" />
      <Image className="vipFlipImg vip2" src={VIP_BADGE_IMG_2} alt="" fill sizes="32px" />
    </span>
  )
}
