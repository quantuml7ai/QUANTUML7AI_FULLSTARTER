'use client'

import React from 'react'
import { cls } from '../../../shared/utils/classnames'
import { ABOUT_LIMIT, normalizeAboutDraft, normalizeAboutForSave } from '../utils/aboutText'

export default function AboutRail({
  t,
  value,
  draft,
  editing,
  saving,
  onStartEdit,
  onChange,
  onCancel,
  onSave,
}) {
  const taRef = React.useRef(null)
  const hasText = Boolean(value)
  const canSave = !saving && normalizeAboutForSave(draft) !== normalizeAboutForSave(value)

  React.useEffect(() => {
    if (!editing) return
    const el = taRef.current
    if (!el) return
    try {
      const active = document.activeElement
      const activeInside = !!(active && el.contains?.(active))
      if (active !== el && !activeInside) {
        try {
          el.focus({ preventScroll: true })
        } catch {
          el.focus()
        }
        const len = el.value.length
        el.setSelectionRange(len, len)
      }
    } catch {}
  }, [editing])

  React.useEffect(() => {
    if (!editing) return
    const el = taRef.current
    if (!el) return
    try {
      el.style.height = '0px'
      el.style.height = `${el.scrollHeight}px`
    } catch {}
  }, [draft, editing])

  return (
    <div
      className={cls('aboutRail', editing && 'is-editing')}
      role={!editing ? 'button' : undefined}
      tabIndex={!editing ? 0 : -1}
      onClick={!editing ? onStartEdit : undefined}
      onKeyDown={
        !editing
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onStartEdit?.()
              }
            }
          : undefined
      }
    >
      <div className="aboutRailContent">
        {editing ? (
          <textarea
            ref={taRef}
            className="aboutTextarea"
            value={draft}
            rows={1}
            maxLength={ABOUT_LIMIT}
            onChange={(e) => onChange?.(normalizeAboutDraft(e.target.value))}
          />
        ) : (
          <div className={cls('aboutText', hasText ? 'aboutText--live' : 'aboutText--placeholder')}>
            {hasText ? value : t('forum_about_placeholder')}
          </div>
        )}
      </div>

      {editing && (
        <div className="aboutActions">
          <div className="aboutLimit">
            {t('forum_about_limit')} {draft.length}/{ABOUT_LIMIT}
          </div>
          <div className="aboutButtons">
            <button
              type="button"
              className="aboutActionBtn"
              onClick={onCancel}
              title={t('forum_about_cancel')}
              aria-label={t('forum_about_cancel')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              className="aboutActionBtn"
              disabled={!canSave}
              onClick={onSave}
              title={t('forum_about_save')}
              aria-label={t('forum_about_save')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M5 12l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="aboutRailLine" aria-hidden="true">
        <span className="aboutRailPencil">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  )
}
