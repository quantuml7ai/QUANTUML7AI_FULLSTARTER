import React from 'react'

import { cls } from '../../../shared/utils/classnames'

import VipPopover from './VipPopover'

export default function ForumVipControl({
  t,
  vipBtnRef,
  vipActive,
  openOnly,
  vipOpen,
  setVipOpen,
  onPay,
}) {
  return (
    <div className="vipWrap">
      <button
        ref={vipBtnRef}
        className={cls(
          'iconBtn forumVipControlBtn hoverPop',
          vipActive ? 'vip is-vip-active' : 'vipGray is-vip-invite'
        )}
        title={vipActive ? 'VIP+ ACTIVE' : t('forum_vip_plus')}
        aria-label={vipActive ? 'VIP+ ACTIVE' : t('forum_vip_plus')}
        onClick={() => openOnly(vipOpen ? null : 'vip')}
      >
        <span className="forumVipControlText">
          VIP+
        </span>
      </button>

      <VipPopover
        anchorRef={vipBtnRef}
        open={vipOpen}
        onClose={() => setVipOpen(false)}
        t={t}
        vipActive={vipActive}
        onPay={onPay}
      />
    </div>
  )
}
