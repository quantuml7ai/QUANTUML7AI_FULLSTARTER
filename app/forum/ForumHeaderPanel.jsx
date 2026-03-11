import React from 'react'
import { createPortal } from 'react-dom'

import { cls } from './shared/utils/classnames'
import HeadChevronIcon from './features/ui/components/HeadChevronIcon'
import AvatarEmoji from './features/profile/components/AvatarEmoji'
import ProfilePopover from './features/profile/components/ProfilePopover'
import AboutRail from './features/profile/components/AboutRail'
import QCoinInline from './features/qcoin/components/QCoinInline'
import QCoinWithdrawPopover from './features/qcoin/components/QCoinWithdrawPopover'
import ForumSearchSortControls from './features/ui/components/ForumSearchSortControls'
import ForumVipControl from './features/profile/components/ForumVipControl'

export default function ForumHeaderPanel({
  t,
  headHidden,
  headPinned,
  videoState,
  videoOpen,
  isBrowserFn,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  avatarRef,
  nickShown,
  iconShown,
  profileOpen,
  openOnly,
  setProfileOpen,
  idShown,
  auth,
  vipActive,
  setProfileBump,
  viewerId,
  myFollowersCount,
  myFollowersLoading,
  moderateImageFiles,
  toastI18n,
  reasonKey,
  reasonFallbackEN,
  icons,
  vipAvatars,
  copyId,
  qcoinModalOpen,
  withdrawBtnRef,
  setQcoinModalOpen,
  openQuests,
  questEnabled,
  meUid,
  openAuth,
  aboutSaved,
  aboutDraft,
  aboutEditing,
  aboutSaving,
  startAboutEdit,
  setAboutDraft,
  cancelAboutEdit,
  saveAbout,
  searchSortProps,
  vipBtnRef,
  vipOpen,
  setVipOpen,
  handleVipPay,
  actionCluster = null,
  showBottomActionDivider = false,
}) {
  return (
    <>
      {headHidden && !headPinned && isBrowserFn() && !videoOpen && videoState !== 'recording' && videoState !== 'preview' && createPortal(
        <button
          type="button"
          className="headPeekBtn"
          aria-label={t('forum_show_header')}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => { headAutoOpenRef.current = false; setHeadPinned(true); setHeadHidden(false) }}
        >
          <HeadChevronIcon dir="down" />
        </button>,
        document.body
      )}

      <div className={cls('head', headHidden && !headPinned && 'head--collapsed')}>
        <div className="headInner" style={{ width: '100%' }}>
          {(!headHidden || headPinned) && (
            <button
              type="button"
              className="headCollapseBtn"
              aria-label={t('forum_hide_header')}
              onClick={() => { headAutoOpenRef.current = false; setHeadPinned(false); setHeadHidden(true) }}
            >
              <HeadChevronIcon dir="up" />
            </button>
          )}

          <div style={{ position: 'relative' }}>
            <button
              ref={avatarRef}
              className={cls('avaBig neon', (!nickShown || iconShown === '👤') && 'pulse')}
              title={nickShown || t('forum_account')}
              onClick={() => {
                const next = !profileOpen
                openOnly(next ? 'profile' : null)
                setProfileOpen(next)
              }}
            >
              <AvatarEmoji userId={idShown} pIcon={iconShown} />
              <span className="avaEditPencil" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <path d="M12 20h9" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <ProfilePopover
              anchorRef={avatarRef}
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              t={t}
              auth={auth}
              vipActive={vipActive}
              onSaved={() => setProfileBump((x) => x + 1)}
              viewerId={viewerId}
              myFollowersCount={myFollowersCount}
              myFollowersLoading={myFollowersLoading}
              moderateImageFiles={moderateImageFiles}
              toastI18n={toastI18n}
              reasonKey={reasonKey}
              reasonFallbackEN={reasonFallbackEN}
              icons={icons}
              vipAvatars={vipAvatars}
            />

            <button
              className="nick-badge nick-animate avaNick"
              title={idShown || '—'}
              onClick={copyId}
              translate="no"
            >
              <span className="nick-text">{nickShown || t('forum_not_signed')}</span>
            </button>
          </div>

          {qcoinModalOpen && (
            <QCoinWithdrawPopover
              anchorRef={withdrawBtnRef}
              onClose={() => setQcoinModalOpen(false)}
              onOpenQuests={openQuests}
              t={t}
              questEnabled={questEnabled}
              isAuthed={!!meUid}
              requireAuth={openAuth}
            />
          )}

          <div className="min-w-0">
            <div
              className="qRowRight"
              style={{ '--qcoin-offset': '6px', '--qcoin-y': '10px', '--qcoin-scale': '1.15' }}
            >
              <QCoinInline t={t} userKey={idShown} vipActive={vipActive} />
            </div>
          </div>

          <AboutRail
            t={t}
            value={aboutSaved}
            draft={aboutDraft}
            editing={aboutEditing}
            saving={aboutSaving}
            onStartEdit={startAboutEdit}
            onChange={setAboutDraft}
            onCancel={cancelAboutEdit}
            onSave={saveAbout}
          />

          <div className="controls">
            <ForumSearchSortControls {...searchSortProps} />

            <ForumVipControl
              t={t}
              vipBtnRef={vipBtnRef}
              vipActive={vipActive}
              openOnly={openOnly}
              vipOpen={vipOpen}
              setVipOpen={setVipOpen}
              onPay={handleVipPay}
            />
          </div>
        </div>

        {actionCluster && (
          <>
            <div className="forumActionDivider" aria-hidden="true" />
            {actionCluster}
            {showBottomActionDivider && (
              <div className="forumActionDivider" aria-hidden="true" />
            )}
          </>
        )}
      </div>
    </>
  )
}
