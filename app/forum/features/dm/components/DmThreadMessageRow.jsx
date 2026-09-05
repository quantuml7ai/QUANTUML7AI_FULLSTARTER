'use client'

import React from 'react'
import ForumNickText from '../../../shared/components/ForumNickText.jsx'
import { cls } from '../../../shared/utils/classnames.js'
import { safeHtml } from '../../../shared/utils/richText.js'
import { shortId, human } from '../../../shared/utils/formatters.js'
import HydrateText from '../../../shared/components/HydrateText.jsx'
import { translateText } from '../../../shared/api/translate.js'
import { translateQl7SupportCard } from '../services/supportAuthClient.js'
import AvatarEmoji from '../../profile/components/AvatarEmoji.jsx'
import { AvatarBadgeOverlay } from '../../profile/components/VipFlipBadge.jsx'
import useVipFlag from '../../profile/hooks/useVipFlag.js'
import { NativeSafeVideoPlayer } from '../../media/utils/mediaLifecycleRuntime.js'
import DmVoicePlayer from './DmVoicePlayer.jsx'
import DmMediaRenderer from './DmMediaRenderer.jsx'
import Ql7SupportPopover from './Ql7SupportPopover.jsx'
import { collectQl7SupportCardTextForTranslate, isRenderableQl7SupportCard } from './Ql7SupportCard.js'
import Ql7SupportMessageSurface from './Ql7SupportMessageSurface.jsx'
import {
  isQl7SupportId,
  QL7_SUPPORT_SYSTEM_ROLE,
  resolveQl7SupportDisplayName,
} from '../../../../../lib/ql7-support/systemActor.js'
import {
  normalizeDmUrl,
  inferDmStickerKind,
  isDmStickerUrl,
  getDmMediaKind,
  stripDmPlayableUrlsFromText,
  extractDmStickersFromText,
} from '../utils/mediaParsing.js'

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
  const [supportPopoverAnchor, setSupportPopoverAnchor] = React.useState(null)

  const fromRaw = String(m?.fromCanonical || m?.from || '').trim()
  const fromId = String(resolveProfileAccountId(fromRaw) || fromRaw || '').trim()
  const fromIsSupport = isQl7SupportId(fromId) || isQl7SupportId(fromRaw)
  const isVipAuthor = useVipFlag(
    fromId,
    fromIsSupport
      ? null
      : (m?.vipActive ?? m?.isVip ?? m?.vip ?? m?.vipUntil ?? m?.author?.vipActive ?? null),
  )
  if (dmDeletedMsgMap?.[msgId]) return null
  const systemRole = String(m?.systemRole || '')
  const supportSystemIdentityOk = m?.isSystem === true && String(m?.systemRole || '') === 'ql7_support_system' && (systemRole === QL7_SUPPORT_SYSTEM_ROLE || systemRole === 'ql7_support_system')
  const supportCard = fromIsSupport && supportSystemIdentityOk && isRenderableQl7SupportCard(m?.supportCard)
    ? m.supportCard
    : null
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
    if (!attMap.has(cleanUrl)) {
      const facingMode = String(a?.cameraFacingMode || a?.facingMode || '').toLowerCase()
      const posterUrl = String(a?.posterUrl || a?.poster || '').trim()
      const moderationStatus = String(a?.moderationStatus || '').trim().toLowerCase()
      const frontCameraMirror = !!(a?.frontCameraMirror || a?.mirrorVideo || facingMode === 'user' || facingMode === 'front')
      attMap.set(cleanUrl, {
        url: cleanUrl,
        type: typeHint,
        frontCameraMirror,
        mirrorVideo: frontCameraMirror,
        cameraFacingMode: frontCameraMirror ? 'user' : '',
        ...(posterUrl ? { posterUrl } : {}),
        ...(['pending', 'approved'].includes(moderationStatus) ? { moderationStatus } : {}),
      })
    }
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
  const videoItems = []
  const otherUrls = []
  const seenMedia = new Set()
  for (const it of mediaItems) {
    const url = it.url
    if (!url || seenMedia.has(url)) continue
    seenMedia.add(url)
    const kind = getDmMediaKind(url, it.type)
    if (kind === 'video') videoItems.push(it)
    else if (kind === 'audio') audioUrls.push(url)
    else if (kind === 'image') imgUrls.push(url)
    else otherUrls.push(url)
  }
  const threadUid = String(dmWithUserId || '').trim()
  const threadIsSupport = isQl7SupportId(threadUid)
  const threadNick = threadIsSupport
    ? (t?.('ql7_support_display_name') || resolveQl7SupportDisplayName(t))
    : resolveNickForDisplay(threadUid, '')
  const threadBlocked = !!dmBlockedMap?.[threadUid]
  const msgNick = fromIsSupport
    ? (t?.('ql7_support_display_name') || resolveQl7SupportDisplayName(t))
    : resolveNickForDisplay(fromId, '')
  const msgIcon = resolveIconForDisplay(fromId, '')
  const seen = mine && dmThreadSeenTs && Number(m?.ts || 0) <= Number(dmThreadSeenTs || 0)
  const delivered = mine && (seen || Number(m?.deliveredTs || 0) > 0 || String(m?.status || '') === 'sent')
  const statusTitle = (m?.status === 'sending')
    ? t('dm_sending')
    : (seen ? t('dm_seen') : (delivered ? t('dm_delivered') : t('dm_sent')))
  const msgTs = Number(m?.ts || 0)
  const dmTextBase = stripDmPlayableUrlsFromText(cleanedText)
  const dmTranslateSource = supportCard
    ? (collectQl7SupportCardTextForTranslate(m?.supportCard) || dmTextBase)
    : dmTextBase
  const dmTrState = (() => {
    const s = (dmTranslateMap && msgId) ? dmTranslateMap[msgId] : null
    if (!s || s.src !== dmTranslateSource) return { isTranslated: false, loading: false, text: null, src: dmTranslateSource }
    return s
  })()
  const dmHasText = !!(dmTranslateSource && dmTranslateSource.trim())
  const dmShowRawText = !!(dmTextBase && dmTextBase.trim() && !fromIsSupport)
  const supportRenderCard = supportCard && dmTrState?.isTranslated && dmTrState?.card ? dmTrState.card : supportCard
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
        [msgId]: { ...(prev?.[msgId] || {}), isTranslated: false, loading: false, src: dmTranslateSource },
      }))
      return
    }
    setDmTranslateMap((prev) => ({
      ...(prev || {}),
      [msgId]: { ...(prev?.[msgId] || {}), loading: true, src: dmTranslateSource },
    }))
    try {
      if (supportCard) {
        const deliveryReceiptId = String(
          m?.metadata?.deliveryReceiptId ||
          m?.raw?.metadata?.deliveryReceiptId ||
          m?.deliveryReceiptId ||
          '',
        ).trim()
        const translated = await translateQl7SupportCard({ deliveryReceiptId, targetLocale: locale })
        setDmTranslateMap((prev) => {
          const cur = prev?.[msgId]
          if (cur && cur.src !== dmTranslateSource) return prev
          return {
            ...(prev || {}),
            [msgId]: {
              ...(cur || {}),
              card: translated?.card || supportCard,
              isTranslated: true,
              loading: false,
              src: dmTranslateSource,
            },
          }
        })
        return
      }
      const tBody = await translateText(dmTranslateSource, locale)
      setDmTranslateMap((prev) => {
        const cur = prev?.[msgId]
        if (cur && cur.src !== dmTranslateSource) return prev
        return {
          ...(prev || {}),
          [msgId]: {
            ...(cur || {}),
            text: tBody,
            isTranslated: true,
            loading: false,
            src: dmTranslateSource,
          },
        }
      })
    } catch {
      setDmTranslateMap((prev) => {
        const cur = prev?.[msgId]
        if (cur && cur.src !== dmTranslateSource) return prev
        return {
          ...(prev || {}),
          [msgId]: { ...(cur || {}), loading: false, src: dmTranslateSource },
        }
      })
    }
  }

  return (
    <div
      key={m?.id || `${m?.ts || 0}`}
      className={cls('dmMsgRow', mine && 'me')}
      data-feed-card="1"
      data-ql7-visual-scope="row"
      data-feed-kind="dm-msg"
      data-dm-ts={msgTs}
      data-dm-from={fromId}
      data-dm-mine={mine ? '1' : '0'}
    >
      <div className={cls('dmMsgBubble', mine && 'me', 'item', 'qshine')}>
        <div className={cls('dmMsgHeader', mine && 'me')}>
          <div
            className="dmMsgAvatar ql7AvatarBadgeHost"
            onClick={(e) => {
              e?.preventDefault?.()
              e?.stopPropagation?.()
              if (fromIsSupport) {
                setSupportPopoverAnchor(e?.currentTarget || null)
                return
              }
              handleUserInfoToggle?.(fromId, e?.currentTarget, {
                userId: fromId,
                nickname: msgNick || shortId(fromId),
                icon: msgIcon,
                avatar: msgIcon,
                vipActive: !!isVipAuthor,
                sourceKind: 'dm-message',
                sourceId: String(m?.id || ''),
              })
            }}
          >
            <AvatarEmoji
              userId={fromId}
              pIcon={msgIcon}
              className="dmMsgAvatarImg ql7AvatarMediaClip"
            />
            <AvatarBadgeOverlay
              vipActive={isVipAuthor && !fromIsSupport}
              showInfo={!!fromId}
            />
          </div>
          <button
            type="button"
            className={cls('nick-badge nick-animate dmMsgNick')}
            translate="no"
            onClick={(e) => {
              e?.preventDefault?.()
              e?.stopPropagation?.()
              if (fromIsSupport) {
                setSupportPopoverAnchor(e?.currentTarget || null)
                return
              }
              handleUserInfoToggle?.(fromId, e?.currentTarget, {
                userId: fromId,
                nickname: msgNick || shortId(fromId),
                icon: msgIcon,
                avatar: msgIcon,
                vipActive: !!isVipAuthor,
                sourceKind: 'dm-message',
                sourceId: String(m?.id || ''),
              })
            }}
          >
            <ForumNickText className="nick-text" textValue={msgNick || shortId(fromId)}><bdi>{msgNick || shortId(fromId)}</bdi></ForumNickText>
          </button>
        </div>
        {!!fromIsSupport && supportSystemIdentityOk && (
          <Ql7SupportMessageSurface
            card={supportRenderCard}
            text={dmDisplayText}
            metadata={{ ...(m?.metadata || {}), supportEventType: m?.supportEventType, eventType: m?.supportEventType }}
            locale={String(supportRenderCard?.locale || m?.localeAtDelivery || locale || 'en')}
            VideoPlayer={NativeSafeVideoPlayer}
            VoicePlayer={DmVoicePlayer}
          />
        )}
        <DmMediaRenderer
          keyPrefix={m?.id || 'm'}
          stickers={stickers}
          images={imgUrls}
          videos={videoItems}
          audios={audioUrls}
          onVideoPlay={onDmVideoPlay}
          dmScope
          source="ordinary-dm"
          VideoPlayer={NativeSafeVideoPlayer}
          VoicePlayer={DmVoicePlayer}
        />
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
        {dmShowRawText && (
          <div className="dmTextFrame">
            {!!dmShowRawText && (
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
              {!mine && !threadIsSupport && (
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
        {fromIsSupport && (
          <Ql7SupportPopover
            anchor={supportPopoverAnchor}
            open={!!supportPopoverAnchor}
            onClose={() => setSupportPopoverAnchor(null)}
            t={t}
          />
        )}
      </div>
    </div>
  )
}
