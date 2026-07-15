'use client'

import { resolveForumLang } from '../../../shared/utils/forumLocale'

const FORUM_VOICE_TAP_LABEL = {
  en: 'Record voice',
  ru: 'Запись голоса',
  uk: 'Запис голосу',
  es: 'Grabar voz',
  zh: '录音',
  ar: 'تسجيل صوت',
  tr: 'Ses kaydı',
}

export function getForumVideoLimitCopy(tt) {
  if (typeof tt !== 'function') {
    return {
      badge: '',
      title: '',
      body: '',
      tipsTitle: '',
      tips: [],
      badDuration: '',
      tooLong: '',
      ok: '',
      detectedLabel: '',
      limitLabel: '',
    }
  }
  return {
    badge: String(tt('forum_video_limit_badge') || ''),
    title: String(tt('forum_video_limit_title') || ''),
    body: String(tt('forum_video_limit_body') || ''),
    tipsTitle: String(tt('forum_video_limit_tips_title') || ''),
    tips: [
      String(tt('forum_video_limit_tip_1') || ''),
      String(tt('forum_video_limit_tip_2') || ''),
      String(tt('forum_video_limit_tip_3') || ''),
    ].filter(Boolean),
    badDuration: String(tt('forum_video_limit_bad_duration') || ''),
    tooLong: String(tt('forum_video_limit_too_long') || ''),
    ok: String(tt('forum_video_limit_ok') || ''),
    detectedLabel: String(tt('forum_video_limit_detected') || ''),
    limitLabel: String(tt('forum_video_limit_limit_label') || ''),
  }
}

export function getForumVideoTrimCopy(tt) {
  if (typeof tt !== 'function') {
    return {
      title: '',
      body: '',
      range: '',
      start: '',
      end: '',
      trim: '',
      cancel: '',
      processing: '',
      unsupported: '',
      failed: '',
      hint: '',
      totalLabel: '',
      clipLabel: '',
    }
  }
  return {
    title: String(tt('forum_video_trim_title') || ''),
    body: String(tt('forum_video_trim_body') || ''),
    range: String(tt('forum_video_trim_range') || ''),
    start: String(tt('forum_video_trim_start') || ''),
    end: String(tt('forum_video_trim_end') || ''),
    trim: String(tt('forum_video_trim_trim') || ''),
    cancel: String(tt('forum_video_trim_cancel') || ''),
    processing: String(tt('forum_video_trim_processing') || ''),
    unsupported: String(tt('forum_video_trim_unsupported') || ''),
    failed: String(tt('forum_video_trim_failed') || ''),
    hint: String(tt('forum_video_trim_hint') || ''),
    totalLabel: String(tt('forum_video_trim_total') || ''),
    clipLabel: String(tt('forum_video_trim_clip') || ''),
  }
}

export function getForumVoiceTapLabel(locale) {
  const lang = resolveForumLang(locale)
  return FORUM_VOICE_TAP_LABEL[lang] || FORUM_VOICE_TAP_LABEL.en
}
