'use client'

import React from 'react'
import Image from 'next/image'

const h = React.createElement
const GRID_CLASS = 'dmMediaGrid'
const MEDIA_SHELL_CLASS = 'dmMediaBox'
const VIDEO_SHELL_CLASS = 'videoCard mediaBox dmMediaBox'
const MEDIA_ITEM_CLASS = 'mediaBoxItem'
const VIDEO_STYLE = Object.freeze({ minHeight: 350, maxHeight: 'min(72vh, 650px)', background: '#000' })

const NativeVideoFallback = React.forwardRef(function NativeVideoFallback({
  frontCameraMirror: _frontCameraMirror,
  mirrorVideo: _mirrorVideo,
  videoClassName,
  videoStyle,
  className,
  style,
  controls,
  ...props
}, ref) {
  return h('video', {
    ...props,
    ref,
    controls: controls !== false,
    className: videoClassName || className || MEDIA_ITEM_CLASS,
    style: { ...(style || {}), ...(videoStyle || {}) },
  })
})

function NativeAudioFallback({ src, dmScope: _dmScope, source = 'standalone-support-card' } = {}) {
  return h('audio', {
    src,
    controls: true,
    preload: 'metadata',
    'data-dm-media': '1',
    'data-dm-media-kind': 'audio',
    'data-dm-media-source': source,
  })
}

function str(value) {
  return String(value ?? '').trim()
}

function itemUrl(item) {
  return str(typeof item === 'string' ? item : (item?.url || item?.src || item?.href))
}

function normalizeItems(items) {
  return Array.isArray(items) ? items.filter((item) => itemUrl(item)) : []
}

function mediaGrid(source, children, key) {
  if (!children.length) return null
  return h('div', { key, className: GRID_CLASS, 'data-dm-media-renderer': source }, children)
}

export default function DmMediaRenderer({
  keyPrefix = 'dm-media',
  stickers = [],
  images = [],
  videos = [],
  audios = [],
  onVideoPlay,
  dmScope = true,
  source = 'ordinary-dm',
  VideoPlayer = NativeVideoFallback,
  VoicePlayer = NativeAudioFallback,
} = {}) {
  const safeStickers = normalizeItems(stickers)
  const safeImages = normalizeItems(images)
  const safeVideos = normalizeItems(videos)
  const safeAudios = normalizeItems(audios)

  const stickerGrid = mediaGrid(source, safeStickers.map((item, index) => {
    const src = itemUrl(item)
    const kind = str(item?.kind)
    return h('div', {
      key: `${keyPrefix}:stk:${index}:${src}`,
      className: `vipMediaBox ${MEDIA_SHELL_CLASS}`,
      'data-kind': 'sticker',
    }, h(Image, {
      src,
      alt: '',
      width: 512,
      height: 512,
      unoptimized: true,
      loading: 'lazy',
      className: kind === 'mozi' ? 'moziEmojiBig emojiPostBig' : 'vipEmojiBig emojiPostBig',
      style: { width: '100%', height: 'auto' },
    }))
  }), `${keyPrefix}:stickers`)

  const imageGrid = mediaGrid(source, safeImages.map((item, index) => {
    const src = itemUrl(item)
    return h('figure', {
      key: `${keyPrefix}:img:${index}:${src}`,
      className: `mediaBox ${MEDIA_SHELL_CLASS}`,
      'data-kind': 'image',
    }, h(Image, {
      src,
      alt: str(item?.alt),
      width: 1200,
      height: 800,
      unoptimized: true,
      loading: 'lazy',
      className: MEDIA_ITEM_CLASS,
      style: { objectFit: 'contain' },
    }))
  }), `${keyPrefix}:images`)

  const videoGrid = mediaGrid(source, safeVideos.map((item, index) => {
    const src = itemUrl(item)
    const facingMode = str(item?.cameraFacingMode).toLowerCase()
    const mirrorVideo = Boolean(
      item?.frontCameraMirror
      || item?.mirrorVideo
      || facingMode === 'user'
      || facingMode === 'front'
    )
    return h('div', {
      key: `${keyPrefix}:vid:${index}:${src}`,
      className: VIDEO_SHELL_CLASS,
      'data-kind': 'video',
    }, h(VideoPlayer, {
      src,
      frontCameraMirror: mirrorVideo,
      mirrorVideo,
      playsInline: true,
      preload: 'metadata',
      controlsList: 'nodownload noplaybackrate noremoteplayback',
      disablePictureInPicture: true,
      'data-dm-media': '1',
      'data-dm-media-kind': 'video',
      'data-dm-media-source': source,
      className: MEDIA_ITEM_CLASS,
      videoClassName: MEDIA_ITEM_CLASS,
      style: VIDEO_STYLE,
      videoStyle: VIDEO_STYLE,
      onPlay: onVideoPlay,
    }))
  }), `${keyPrefix}:videos`)

  const audioGrid = mediaGrid(source, safeAudios.map((item, index) => {
    const src = itemUrl(item)
    return h('div', {
      key: `${keyPrefix}:aud:${index}:${src}`,
      className: MEDIA_SHELL_CLASS,
      'data-kind': 'audio',
    }, h(VoicePlayer, { src, dmScope, source }))
  }), `${keyPrefix}:audios`)

  return h(React.Fragment, null, stickerGrid, imageGrid, videoGrid, audioGrid)
}
