'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function CreateTopicCard({ t, onCreate }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [descr, setDescr] = useState('')
  const [first, setFirst] = useState('')
  const [mounted, setMounted] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fn = () => setOpen(true)
    window.__forumToggleCreateTopic = fn
    return () => {
      try {
        if (window.__forumToggleCreateTopic === fn) delete window.__forumToggleCreateTopic
      } catch {}
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      try {
        titleRef.current?.focus?.()
      } catch {}
    }, 0)
    return () => clearTimeout(id)
  }, [open])

  const form = (
    <div className="createTopicModal" role="dialog" aria-modal="true">
      <div className="createTopicModalInner">
        <div className="grid gap-2">
          <label className="block">
            <div className="meta mb-1">{t('forum_topic_title')}</div>
            <input
              ref={titleRef}
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('forum_topic_title_ph')}
              maxLength={40}
            />
            <div className="charRow" aria-live="polite">
              <span className="charNow">{title.trim().length}</span>
              <span className="charSep">/</span>
              <span className={title.trim().length > 40 ? 'charMax charOver' : 'charMax'}>40</span>
            </div>
          </label>
          <label className="block">
            <div className="meta mb-1">{t('forum_topic_desc')}</div>
            <textarea
              className="input textarea"
              value={descr}
              onChange={(e) => setDescr(e.target.value)}
              placeholder={t('forum_topic_desc_ph')}
              maxLength={90}
            />
            <div className="charRow" aria-live="polite">
              <span className="charNow">{descr.trim().length}</span>
              <span className="charSep">/</span>
              <span className={descr.trim().length > 90 ? 'charMax charOver' : 'charMax'}>90</span>
            </div>
          </label>
          <label className="block">
            <div className="meta mb-1">{t('forum_topic_first_msg')}</div>
            <textarea
              className="ta"
              rows={6}
              value={first}
              onChange={(e) => setFirst(e.target.value.slice(0, 400))}
              maxLength={400}
              placeholder={t('forum_topic_first_msg_ph')}
            />
            <div className="charRow" aria-live="polite">
              <span className="charNow">{first.trim().length}</span>
              <span className="charSep">/</span>
              <span className={first.trim().length > 400 ? 'charMax charOver' : 'charMax'}>400</span>
            </div>
          </label>
          <div className="flex items-center justify-end gap-2">
            <button className="btn btnGhost" onClick={() => setOpen(false)}>
              {t('forum_cancel')}
            </button>
            <button
              className="btn"
              disabled={
                busy ||
                !title.trim() ||
                !first.trim() ||
                title.trim().length > 40 ||
                descr.trim().length > 90 ||
                first.trim().length > 400
              }
              onClick={async () => {
                if (
                  busy ||
                  !title.trim() ||
                  !first.trim() ||
                  title.trim().length > 40 ||
                  descr.trim().length > 90 ||
                  first.trim().length > 400
                ) {
                  return
                }
                setBusy(true)
                try {
                  await onCreate?.(title.trim(), descr.trim(), first.trim())
                  setTitle('')
                  setDescr('')
                  setFirst('')
                  setOpen(false)
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? t('forum_creating') : t('forum_create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="createTopicRow mb-2">
      {mounted && open ? createPortal(form, document.body) : null}
      <div className="flex items-center gap-2" />
    </div>
  )
}
