'use client'

import { createIsMediaUrl, createStripMediaUrlsFromText } from './mediaLinks'

export function createForumMediaUrlPipeline({
  feedUrlRegex,
  isVideoUrl,
  isImageUrl,
  isAudioUrl,
  isYouTubeUrlFn,
  isTikTokUrlFn,
}) {
  const isMediaUrl = createIsMediaUrl({
    isVideoUrl,
    isImageUrl,
    isAudioUrl,
    isYouTubeUrlFn,
    isTikTokUrlFn,
  })

  const stripMediaUrlsFromText = createStripMediaUrlsFromText({
    feedUrlRegex,
    isMediaUrl,
  })

  return {
    isMediaUrl,
    stripMediaUrlsFromText,
  }
}
