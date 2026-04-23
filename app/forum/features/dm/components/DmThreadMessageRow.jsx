'use client'

import React from 'react'
import Image from 'next/image'
import { cls } from '../../../shared/utils/classnames'
import { safeHtml } from '../../../shared/utils/richText'
import { shortId, human } from '../../../shared/utils/formatters'
import HydrateText from '../../../shared/components/HydrateText'
import { translateText } from '../../../shared/api/translate'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import { VideoMedia } from '../../media/utils/mediaLifecycleRuntime'
import DmVoicePlayer from './DmVoicePlayer'
import {
  normalizeDmUrl,
  inferDmStickerKind,
  isDmStickerUrl,
  getDmMediaKind,
  stripDmPlayableUrlsFromText,
  extractDmStickersFromText,
} from '../utils/mediaParsing'

function pauseOtherDmThreadMedia(currentMedia) {
  if (!(currentMedia instanceof HTMLMediaElement)) return
  try {
    const scope = currentMedia.closest?.('.dmThread')
    if (!(scope instanceof Element)) return
    scope.querySelectorAll?.('[data-dm-media="1"]').forEach((node) => {
      if (!(node instanceof HTMLMediaElement)) return
      if (node === currentMedia) return
      try {
        if (!node.paused) node.pause()
      } catch {}
    })
  } catch {}
}

export default function DmThreadMessageRow({
  m,
  dmDeletedMsgMap,
  dmWithUserId,
  meId,
  dmThreadSeenTs,
  dmBlockedMap,
  dmTranslateMap,
  setDmTranslateMap,
  resolveProfileAccountId,
  resolveNickForDisplay,
  resolveIconForDisplay,
  handleUserInfoToggle,
  openDmDeletePopover,
  toggleDmBlock,
  locale,
  t,
}) {
  const msgId = String(m?.id || '')
  if (dmDeletedMsgMap?.[msgId]) return null

  const fromRaw = String(m?.fromCanonical || m?.from || '').trim()
  const fromId = String(resolveProfileAccountId(fromRaw) || fromRaw || '').trim()
  const mine = !!fromId && (String(fromId) === String(meId || '') || String(fromRaw) === String(meId || ''))
  const rawText = String(m?.text || '')
  const { text: cleanedText, stickers: textStickers } = extractDmStickersFromText(rawText)
  const atts = Array.isArray(m?.attachments) ? m.attachments : []
  const attMap = new Map()
  for (const a of atts) {
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
    if (!attMap.has(cleanUrl)) attMap.set(cleanUrl, { url: cleanUrl, type: typeHint })
  }
  const attItems = Array.from(attMap.values())
  const stickerEntries = Array.isArray(textStickers) ? textStickers.slice() : []
  for (const it of attItems) {
    if (isDmStickerUrl(it.url)) {
      stickerEntries.push({ url: it.url, kind: inferDmStickerKind(it.url) })
    }
  }
  const stickerSet = new Set()
  const stickers = []
  for (const s of stickerEntries) {
    if (!s?.url || stickerSet.has(s.url)) continue
    stickerSet.add(s.url)
    stickers.push(s)
  }
  const mediaItems = attItems.filter((it) => !stickerSet.has(it.url))
  const imgUrls = []
  const audioUrls = []
  const videoUrls = []
  const otherUrls = []
  const seenMedia = new Set()
  for (const it of mediaItems) {
    const url = it.url
    if (!url || seenMedia.has(url)) continue
    seenMedia.add(url)
    const kind = getDmMediaKind(url, it.type)
    if (kind === 'video') videoUrls.push(url)
    else if (kind === 'audio') audioUrls.push(url)
    else if (kind === 'image') imgUrls.push(url)
    else otherUrls.push(url)
  }
  const threadUid = String(dmWithUserId || '').trim()
  const threadNick = resolveNickForDisplay(threadUid, '')
  const threadBlocked = !!dmBlockedMap?.[threadUid]
  const msgNick = resolveNickForDisplay(fromId, '')
  const msgIcon = resolveIconForDisplay(fromId, '')
  const seen = mine && dmThreadSeenTs && Number(m?.ts || 0) <= Number(dmThreadSeenTs || 0)
  const delivered = mine && (seen || Number(m?.deliveredTs || 0) > 0 || String(m?.status || '') === 'sent')
  const statusTitle = (m?.status === 'sending')
    ? t('dm_sending')
    : (seen ? t('dm_seen') : (delivered ? t('dm_delivered') : t('dm_sent')))
  const msgTs = Number(m?.ts || 0)
  const dmTextBase = stripDmPlayableUrlsFromText(cleanedText)
  const dmTrState = (() => {
    const s = (dmTranslateMap && msgId) ? dmTranslateMap[msgId] : null
    if (!s || s.src !== dmTextBase) return { isTranslated: false, loading: false, text: null, src: dmTextBase }
    return s
  })()
  const dmHasText = !!(dmTextBase && dmTextBase.trim())
  const dmDisplayText = (dmTrState?.isTranslated && dmTrState?.text) ? dmTrState.text : dmTextBase
  const dmTranslateLabel = dmTrState?.loading
    ? t?.('crypto_news_translate_loading')
    : (dmTrState?.isTranslated ? t?.('crypto_news_show_original') : t?.('crypto_news_translate'))
  const onDmVideoPlay = (e) => {
    pauseOtherDmThreadMedia(e?.currentTarget || e?.target)
  }

  const onDmTranslateToggle = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!dmHasText) return
    if (dmTrState?.isTranslated) {
      setDmTranslateMap((prev) => ({
        ...(prev || {}),
        [msgId]: { ...(prev?.[msgId] || {}), isTranslated: false, loading: false, src: dmTextBase },
      }))
      return
    }
    setDmTranslateMap((prev) => ({
      ...(prev || {}),
      [msgId]: { ...(prev?.[msgId] || {}), loading: true, src: dmTextBase },
    }))
    try {
      const tBody = await translateText(dmTextBase, locale)
      setDmTranslateMap((prev) => {
        const cur = prev?.[msgId]
        if (cur && cur.src !== dmTextBase) return prev
        return {
          ...(prev || {}),
          [msgId]: {
            ...(cur || {}),
            text: tBody,
            isTranslated: true,
            loading: false,
            src: dmTextBase,
          },
        }
      })
    } catch {
      setDmTranslateMap((prev) => {
        const cur = prev?.[msgId]
        if (cur && cur.src !== dmTextBase) return prev
        return {
          ...(prev || {}),
          [msgId]: { ...(cur || {}), loading: false, src: dmTextBase },
        }
      })
    }
  }

  return (
    <div
      key={m?.id || `${m?.ts || 0}`}
      className={cls('dmMsgRow', mine && 'me')}
      data-feed-card="1"
      data-feed-kind="dm-msg"
      data-dm-ts={msgTs}
      data-dm-from={fromId}
      data-dm-mine={mine ? '1' : '0'}
    >
      <div className={cls('dmMsgBubble', mine && 'me', 'item', 'qshine')}>
        <div className={cls('dmMsgHeader', mine && 'me')}>
          <div
            className="dmMsgAvatar"
            onClick={(e) => {
              e?.preventDefault?.()
              e?.stopPropagation?.()
              handleUserInfoToggle?.(fromId, e?.currentTarget)
            }}
          >
            <AvatarEmoji
              userId={fromId}
              pIcon={msgIcon}
              className="dmMsgAvatarImg"
            />
          </div>
          <button
            type="button"
            className={cls('nick-badge nick-animate dmMsgNick')}
            translate="no"
            onClick={(e) => {
              e?.preventDefault?.()
              e?.stopPropagation?.()
              handleUserInfoToggle?.(fromId, e?.currentTarget)
            }}
          >
            <span className="nick-text">{msgNick || shortId(fromId)}</span>
          </button>
        </div>
        {!!(stickers && stickers.length) && (
          <div className="dmMediaGrid">
            {stickers.map((s, i) => (
              <div key={`${m?.id || 'm'}:stk:${i}`} className="vipMediaBox dmMediaBox" data-kind="sticker">
                <Image
                  src={s.url}
                  alt=""
                  width={512}
                  height={512}
                  unoptimized
                  loading="lazy"
                  className={s.kind === 'mozi' ? 'moziEmojiBig emojiPostBig' : 'vipEmojiBig emojiPostBig'}
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            ))}
          </div>
        )}
        {!!imgUrls.length && (
          <div className="dmMediaGrid">
            {imgUrls.map((src, i) => (
              <figure key={`${m?.id || 'm'}:img:${i}`} className="mediaBox dmMediaBox" data-kind="image">
                <Image
                  src={src}
                  alt=""
                  width={1200}
                  height={800}
                  unoptimized
                  loading="lazy"
                  className="mediaBoxItem"
                  style={{ objectFit: 'contain' }}
                />
              </figure>
            ))}
          </div>
        )}
        {!!videoUrls.length && (
          <div className="dmMediaGrid">
            {videoUrls.map((src, i) => (
              <div key={`${m?.id || 'm'}:vid:${i}`} className="videoCard mediaBox dmMediaBox" data-kind="video">
                <VideoMedia
                  src={src}
                  playsInline
                  preload="metadata"
                  controls
                  controlsList="nodownload noplaybackrate noremoteplayback"
                  disablePictureInPicture
                  data-dm-media="1"
                  data-dm-media-kind="video"
                  className="mediaBoxItem"
                  style={{ objectFit: 'contain', background: '#000' }}
                  onPlay={onDmVideoPlay}
                />
              </div>
            ))}
          </div>
        )}
        {!!audioUrls.length && (
          <div className="dmMediaGrid">
            {audioUrls.map((src, i) => (
              <div key={`${m?.id || 'm'}:aud:${i}`} className="dmMediaBox" data-kind="audio">
                <DmVoicePlayer src={src} dmScope />
              </div>
            ))}
          </div>
        )}
        {!!otherUrls.length && !dmHasText && (
          <div className="dmTextFrame">
            <div className="dmTextContent">
              {otherUrls.map((u, i) => (
                <div key={`${m?.id || 'm'}:plainlink:${i}`}>
                  <a href={u} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()}>
                    {u}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
        {dmHasText && (
          <div className="dmTextFrame">
            {!!dmHasText && (
              <div className="dmTextContent" dangerouslySetInnerHTML={{ __html: safeHtml(dmDisplayText) }} />
            )}
            {!!otherUrls.filter((u) => !/^https?:\/\//i.test(String(u || ''))).length && (
              <div className="dmAttachLinks">
                {otherUrls
                  .filter((u) => !/^https?:\/\//i.test(String(u || '')))
                  .map((u, i) => (
                    <div key={`${m?.id || 'm'}:link:${i}`}>
                      <a href={u} target="_blank" rel="noreferrer noopener">{u}</a>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
        {dmHasText && (
          <button
            type="button"
            className={`btn translateToggleBtn ${dmTrState?.isTranslated ? 'translateToggleBtnOn' : ''}`}
            onClick={onDmTranslateToggle}
            disabled={dmTrState?.loading || !dmHasText}
          >
            <span className="translateToggleIcon" aria-hidden="true">🌐</span>
            <span className="translateToggleText">{dmTranslateLabel}</span>
            <span className="translateToggleIcon" aria-hidden="true">🌐</span>
          </button>
        )}
        <div className="forumDividerRail forumDividerRail--gold" style={{ margin: '17px 4px' }} aria-hidden="true" />

        <div className="dmMsgFooter">
          {!!threadUid && (
            <div className="dmMsgActions">
              {!!msgId && mine && (
                <button
                  type="button"
                  className="dmActionBtn danger"
                  onClick={(e) => openDmDeletePopover('message', { uid: threadUid, msgId, nick: threadNick || shortId(threadUid) }, e)}
                >
                  {t('forum_delete')}
                </button>
              )}
              {!mine && (
                <button
                  type="button"
                  className="dmActionBtn"
                  onClick={() => toggleDmBlock(threadUid, !threadBlocked)}
                >
                  {threadBlocked ? t('dm_unblock') : t('dm_block')}
                </button>
              )}
            </div>
          )}
          <div className="dmMsgMeta">
            <HydrateText value={human(m?.ts)} />
            {mine && (
              <span className={cls('dmStatus', seen && 'seen')} title={statusTitle} aria-label={statusTitle}>
                {m?.status === 'sending'
                  ? t('dm_sending')
                  : (seen ? '✓✓' : (delivered ? '✓' : t('dm_sent')))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
