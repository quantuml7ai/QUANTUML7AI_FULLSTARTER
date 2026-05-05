'use client'

import React from 'react'
import Image from 'next/image'
import { cls } from '../../../shared/utils/classnames'
import StarButton from '../../ui/components/StarButton'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'
import useVipFlag from '../../profile/hooks/useVipFlag'
import {
  safeReadProfile,
  resolveProfileAccountId,
  resolveNickForDisplay,
  resolveIconForDisplay,
} from '../../profile/utils/profileCache'
import {
  normalizeDmUrl,
  isDmStickerUrl,
  getDmMediaKind,
  extractDmStickersFromText,
} from '../utils/mediaParsing'
import { shortId, human } from '../../../shared/utils/formatters'
import HydrateText from '../../../shared/components/HydrateText'

function safeResolveDmId(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try {
    return String(resolveProfileAccountId(raw) || raw || '').trim()
  } catch {
    return raw
  }
}

function readDialogSeenTs(dialog, dmSeenMap, meId) {
  const last = dialog?.lastMessage || null
  const ids = new Set()
  const add = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return
    ids.add(raw)
    const normalized = safeResolveDmId(raw)
    if (normalized) ids.add(normalized)
  }
  add(dialog?.userId)

  const me = String(meId || '').trim()
  const fromRaw = String(last?.fromCanonical || last?.from || '').trim()
  const toRaw = String(last?.toCanonical || last?.to || '').trim()
  const from = safeResolveDmId(fromRaw)
  const to = safeResolveDmId(toRaw)
  if (from && from !== me) add(fromRaw || from)
  if (to && to !== me) add(toRaw || to)

  let seenTs = 0
  for (const id of ids) seenTs = Math.max(seenTs, Number(dmSeenMap?.[id] || 0))
  return seenTs
}

function DmPreviewKindIcon({ kind }) {
  if (kind === 'video') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 9.5l4 2.5-4 2.5z" fill="currentColor" />
      </svg>
    )
  }
  if (kind === 'audio') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 17a2.6 2.6 0 1 1-2.6-2.6A2.6 2.6 0 0 1 9 17zm8-2.8a2.6 2.6 0 1 1-2.6-2.6A2.6 2.6 0 0 1 17 14.2z" fill="currentColor" />
        <path d="M9 17V6.4l8-1.6v9.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h8l4 4v16H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 2v4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

export default function DmDialogRow({
  dialog,
  meId,
  dmDeletedMap,
  dmSeenMap,
  t,
  onOpen,
  onDelete,
  starredAuthors,
  onToggleStar,
  onUserInfoToggle,
  stripMediaUrlsFromText,
}) {
  const uid = String(dialog?.userId || '').trim()
  const prof = safeReadProfile(uid) || {}
  const isVipAuthor = useVipFlag(uid, prof.vipActive ?? prof.isVip ?? prof.vip ?? prof.vipUntil ?? null)
  if (!uid) return null
  const entryId = `dm_${uid}`
  const last = dialog?.lastMessage || null
  const lastTs = Number(last?.ts || 0)
  const deletedAt = Number(dmDeletedMap?.[uid] || 0)
  if (deletedAt && (!lastTs || lastTs <= deletedAt)) return null

  const lastFromRaw = String(last?.fromCanonical || last?.from || '')
  const lastFrom = String(resolveProfileAccountId(lastFromRaw) || lastFromRaw || '').trim()
  const seenTs = readDialogSeenTs(dialog, dmSeenMap, meId)
  const unread = !!uid && lastFrom && lastFrom !== String(meId) && lastTs > seenTs
  const nick = resolveNickForDisplay(uid, '')
  const lastTextRaw = String(last?.text || '')
  const { text: lastCleanText, stickers: lastTextStickers } = extractDmStickersFromText(lastTextRaw)
  const lastAtts = Array.isArray(last?.attachments) ? last.attachments : []
  const lastAttMap = new Map()
  for (const a of lastAtts) {
    if (!a) continue
    let url = ''
    let typeHint = ''
    if (typeof a === 'string') {
      url = a
    } else if (typeof a === 'object') {
      url = a.url || a.src || a.href || a.file || ''
      typeHint = a.type || a.mime || a.mediaType || ''
    }
    const cleanUrl = normalizeDmUrl(url)
    if (!cleanUrl) continue
    if (!lastAttMap.has(cleanUrl)) lastAttMap.set(cleanUrl, { url: cleanUrl, type: typeHint })
  }
  const previewMedia = (() => {
    if (Array.isArray(lastTextStickers)) {
      for (const s of lastTextStickers) {
        if (s?.url) return { kind: 'sticker', url: s.url }
      }
    }
    let videoUrl = ''
    let audioUrl = ''
    let otherUrl = ''
    for (const it of lastAttMap.values()) {
      const url = it?.url
      if (!url) continue
      if (isDmStickerUrl(url)) return { kind: 'sticker', url }
      const kind = getDmMediaKind(url, it?.type)
      if (kind === 'image') return { kind: 'image', url }
      if (kind === 'video' && !videoUrl) videoUrl = url
      else if (kind === 'audio' && !audioUrl) audioUrl = url
      else if (kind === 'other' && !otherUrl) otherUrl = url
    }
    if (videoUrl) return { kind: 'video', url: videoUrl }
    if (audioUrl) return { kind: 'audio', url: audioUrl }
    if (otherUrl) return { kind: 'file', url: otherUrl }
    return null
  })()
  const previewText = stripMediaUrlsFromText(lastCleanText)
  const hasPreviewText = !!previewText

  const isSelf = !!meId && String(meId) === String(uid)
  const isStarred = !!uid && !!starredAuthors?.has?.(uid)

  const openProfile = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    const anchor =
      e?.currentTarget?.closest?.('.dmRow')?.querySelector?.('.dmRowAvatar') ||
      e?.currentTarget
    onUserInfoToggle?.(uid, anchor)
  }

  return (
    <button
      type="button"
      id={entryId}
      className={cls('item dmRow hoverPop text-left', unread && 'dmRowUnread')}
      data-feed-card="1"
      data-feed-kind="dm-dialog"
      data-dm-uid={uid}
      data-dm-lastts={lastTs}
      data-dm-lastfrom={lastFromRaw || lastFrom}
      onClick={() => onOpen?.(uid, entryId)}
    >
      <div className="dmRowMain">
        <div className="dmRowTop">
          <div className="dmRowUser">
            <div className="dmRowAvatar" onClick={openProfile}>
              <AvatarEmoji userId={uid} pIcon={resolveIconForDisplay(uid, '')} className="dmRowAvatarImg" />
            </div>
            <button
              type="button"
              className={cls('nick-badge nick-animate dmRowNick', isVipAuthor && 'vipNick')}
              translate="no"
              onClick={openProfile}
            >
              <span className="nick-text">{nick || shortId(uid)}</span>
            </button>
            {!!uid && !isSelf && (
              <StarButton
                on={isStarred}
                onClick={() => onToggleStar?.(uid)}
                title={isStarred ? t?.('forum_subscribed') : t?.('forum_subscribe')}
              />
            )}
            {isVipAuthor && <VipFlipBadge />}
          </div>
        </div>

        <div className="dmRowRail dmRowRailTop" aria-hidden="true" />

        {(previewMedia || hasPreviewText) && (
          <div className="dmRowPreview">
            <div className="dmPreviewFrame">
              {previewMedia && (
                <span className={cls('dmPreviewMedia', `dmPreviewMedia-${previewMedia.kind}`)}>
                  {previewMedia.kind === 'image' || previewMedia.kind === 'sticker' ? (
                    <Image
                      src={previewMedia.url}
                      alt=""
                      width={64}
                      height={64}
                      unoptimized
                      loading="lazy"
                      className="dmPreviewImg"
                    />
                  ) : (
                    <span className="dmPreviewIcon" aria-hidden>
                      <DmPreviewKindIcon kind={previewMedia.kind} />
                    </span>
                  )}
                  {previewMedia.kind === 'video' && (
                    <span className="dmPreviewPlay" aria-hidden>
                      <svg viewBox="0 0 16 16">
                        <path d="M5 3l7 5-7 5z" fill="currentColor" />
                      </svg>
                    </span>
                  )}
                </span>
              )}
              {hasPreviewText && <span className="dmPreviewText">{previewText}</span>}
            </div>
          </div>
        )}

        <div className="dmRowRail dmRowRailBottom" aria-hidden="true" />

        <div className="dmRowTime">
          <span className="dmRowTimeBadge">
            <HydrateText value={human(lastTs)} />
          </span>
        </div>
      </div>
      <button
        type="button"
        className="iconBtn ghost"
        aria-label={t('dm_delete_dialog')}
        title={t('dm_delete_dialog')}
        onClick={(e) => onDelete?.(uid, nick || shortId(uid), e)}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {unread && <span className="dmUnreadDot" aria-hidden="true" />}
    </button>
  )
}
