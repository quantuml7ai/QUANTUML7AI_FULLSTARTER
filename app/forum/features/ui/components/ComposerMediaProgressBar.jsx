'use client'

import React from 'react'
import MediaPipelineProgress from '../../../../../components/MediaPipelineProgress'

export default function ComposerMediaProgressBar({
  mediaBarOn,
  mediaPhase,
  mediaPct,
  formatMediaPhase,
  t,
  onCancel,
  pipelineKind = 'media',
}) {
  const labels = React.useMemo(() => ({
    preparing: t?.('media_pipeline_preparing') || t?.('forum_media_processing') || 'Preparing',
    processing: t?.('media_pipeline_processing') || t?.('forum_media_processing') || 'Processing',
    verifying: t?.('media_pipeline_verifying') || 'Verifying',
    uploading: t?.('media_pipeline_uploading') || t?.('forum_media_uploading') || 'Uploading',
    finalizing: t?.('media_pipeline_finalizing') || t?.('forum_media_sending') || 'Finalizing',
    ready: t?.('media_pipeline_ready') || formatMediaPhase?.('Ready') || t?.('forum_media_ready') || 'Ready',
    stagesAria: t?.('media_pipeline_stages') || 'Media processing stages',
  }), [formatMediaPhase, t])

  const rawPhase = String(mediaPhase || 'preparing').toLowerCase()
  const normalizedPhase = rawPhase === 'moderating'
    ? 'processing'
    : (rawPhase === 'sending' ? 'finalizing' : rawPhase)
  const stageOrder = pipelineKind === 'video'
    ? ['preparing', 'processing', 'verifying', 'uploading', 'finalizing', 'ready']
    : ['preparing', 'processing', 'uploading', 'finalizing', 'ready']

  return (
    <MediaPipelineProgress
      active={!!mediaBarOn}
      phase={normalizedPhase}
      percent={mediaPct}
      labels={labels}
      stageOrder={stageOrder}
      theme="forum"
      className="composerMediaBarV2"
      onCancel={onCancel}
      cancelLabel={t?.('forum_cancel_upload') || t?.('forum_cancel') || 'Cancel'}
    />
  )
}
