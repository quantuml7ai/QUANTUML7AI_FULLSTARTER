'use client'

import React from 'react'
import { translateText } from '../../../shared/api/translate'

export default function usePostTranslation({ postId, cleanedText, locale, t }) {
  const [isTranslated, setIsTranslated] = React.useState(false)
  const [translateLoading, setTranslateLoading] = React.useState(false)
  const [translatedBody, setTranslatedBody] = React.useState(null)
  const [translationAnimationKey, setTranslationAnimationKey] = React.useState(0)
  const [translationAnimationEnabled, setTranslationAnimationEnabled] = React.useState(false)

  React.useEffect(() => {
    setIsTranslated(false)
    setTranslateLoading(false)
    setTranslatedBody(null)
    setTranslationAnimationKey(0)
    setTranslationAnimationEnabled(false)
  }, [postId, cleanedText])

  const cleanedTextVisible = React.useMemo(
    () => String(cleanedText || '').replace(/\u200B/g, '').trim(),
    [cleanedText],
  )

  const displayText = isTranslated && translatedBody ? translatedBody : cleanedTextVisible

  const handleToggleTranslate = React.useCallback(
    async (e) => {
      e?.preventDefault?.()
      e?.stopPropagation?.()
      if (!cleanedTextVisible) return

      if (isTranslated) {
        setTranslationAnimationEnabled(true)
        setTranslationAnimationKey((value) => value + 1)
        setIsTranslated(false)
        return
      }

      setTranslateLoading(true)
      try {
        const tBody = await translateText(cleanedTextVisible, locale)
        setTranslatedBody(tBody)
        setTranslationAnimationEnabled(true)
        setTranslationAnimationKey((value) => value + 1)
        setIsTranslated(true)
      } finally {
        setTranslateLoading(false)
      }
    },
    [cleanedTextVisible, isTranslated, locale],
  )

  const translateBtnLabel = translateLoading
    ? t?.('crypto_news_translate_loading')
    : isTranslated
      ? t?.('crypto_news_show_original')
      : t?.('crypto_news_translate')

  const hasCleanedText = !!cleanedTextVisible

  return {
    isTranslated,
    translateLoading,
    displayText,
    translationAnimationKey,
    translationAnimationEnabled,
    translateBtnLabel,
    hasCleanedText,
    handleToggleTranslate,
  }
}
