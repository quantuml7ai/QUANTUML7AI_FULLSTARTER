'use client'

import React from 'react'
import {
  registerVisualScope,
  subscribeVisualActivity,
  unregisterVisualScope,
} from '../../lib/visual-runtime/visualActivityRegistry'
import {
  canonicalizeImageSrc,
  preferredMarginProfileForAnimatedPath,
  resolveAnimatedPosterSrc,
} from '../../lib/visual-runtime/animatedAssetManifest'
import {
  markAnimatedAssetError,
  markAnimatedAssetMissingPoster,
  markAnimatedAssetState,
  registerAnimatedAsset,
  unregisterAnimatedAsset,
} from '../../lib/visual-runtime/animatedAssetRegistry'

const h = React.createElement
export default function ViewportAnimatedImage({
  animatedSrc,
  staticSrc = '',
  marginProfile,
  initialPoster = false,
  viewportPinned = false,
  className,
  alt = '',
  width,
  height,
  style,
  fill = false,
  sizes,
  priority: _priority,
  unoptimized: _unoptimized,
  quality: _quality,
  loader: _loader,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  onLoadingComplete,
  onError,
  onLoad,
  ...rest
}) {
  const nodeRef = React.useRef(null)
  const cleanupRef = React.useRef(null)
  const posterFailedRef = React.useRef(false)
  const animated = String(animatedSrc || '').trim()
  const poster = resolveAnimatedPosterSrc(animated, staticSrc)
  const profile = marginProfile === 'near50' || marginProfile === 'near100'
    ? marginProfile
    : preferredMarginProfileForAnimatedPath(animated)
  const shouldUseInitialPoster = !!poster && initialPoster

  const setSource = React.useCallback((node, nextSrc, nextState) => {
    if (!(node instanceof HTMLImageElement)) return
    const next = String(nextSrc || '').trim()
    if (!next) return
    const current = canonicalizeImageSrc(node.getAttribute('src') || node.src)
    if (current !== canonicalizeImageSrc(next)) node.src = next
    node.dataset.ql7AnimatedState = nextState
    markAnimatedAssetState(node, nextState)
  }, [])

  const bindNode = React.useCallback((node) => {
    cleanupRef.current?.()
    cleanupRef.current = null
    nodeRef.current = node
    if (!(node instanceof HTMLImageElement) || !animated) return

    posterFailedRef.current = false
    node.dataset.ql7AnimatedSrc = animated
    node.dataset.ql7StaticSrc = poster
    node.dataset.ql7AnimatedState = shouldUseInitialPoster ? 'poster' : 'animated'
    node.dataset.ql7VisualMargin = profile
    if (viewportPinned) {
      node.dataset.ql7VisualPinned = '1'
      node.dataset.ql7VisualPinnedActive = '1'
    } else {
      delete node.dataset.ql7VisualPinned
      delete node.dataset.ql7VisualPinnedActive
    }

    registerAnimatedAsset(node, {
      animatedSrc: animated,
      posterSrc: poster,
      marginProfile: profile,
      state: node.dataset.ql7AnimatedState,
    })

    registerVisualScope(node, {
      kind: 'animated-raster',
      marginProfile: profile,
      rootStrategy: 'nearest-marker',
      pauseCss: true,
      pauseJs: false,
      // Only this ref-owned node may publish data-ql7-visual-state because the
      // matching structural attribute is already emitted by this component.
      // Generic dataset scopes never opt in.
      publishState: true,
      enabled: true,
      viewportPinned,
      initialNear: viewportPinned ? true : !initialPoster,
    })

    const unsubscribe = subscribeVisualActivity(node, {
      onRun: () => setSource(node, animated, 'animated'),
      onPause: () => {
        if (!poster || posterFailedRef.current) return
        setSource(node, poster, 'poster')
      },
    })

    cleanupRef.current = () => {
      unsubscribe?.()
      unregisterVisualScope(node)
      unregisterAnimatedAsset(node)
    }
  }, [animated, initialPoster, poster, profile, setSource, shouldUseInitialPoster, viewportPinned])

  const initialSrc = shouldUseInitialPoster ? poster : animated
  const resolvedStyle = fill
    ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        color: 'transparent',
        ...(style || {}),
      }
    : style
  const handleLoad = (event) => {
    onLoad?.(event)
    onLoadingComplete?.(event.currentTarget)
  }
  const handleError = (event) => {
    const node = event.currentTarget
    const current = canonicalizeImageSrc(node.getAttribute('src') || node.src)
    const posterCanonical = canonicalizeImageSrc(poster)
    if (poster && current === posterCanonical) {
      posterFailedRef.current = true
      markAnimatedAssetMissingPoster(node)
      markAnimatedAssetError()
      setSource(node, animated, 'animated')
      return
    }
    onError?.(event)
  }

  return h('img', {
    ...rest,
    // viewportPinned is structural, so its initial dataset contract is emitted
    // in the rendered markup rather than being invented by a pre-hydration DOM
    // mutation. The document controller may still converge it to paused after
    // hydration for hidden documents or reduced-motion preference.
    'data-ql7-visual-pinned': viewportPinned ? '1' : undefined,
    'data-ql7-visual-pinned-active': viewportPinned ? '1' : undefined,
    'data-ql7-visual-state': viewportPinned ? 'running' : undefined,
    ref: bindNode,
    src: initialSrc,
    className,
    alt,
    width,
    height,
    style: resolvedStyle,
    sizes,
    onLoad: handleLoad,
    onError: handleError,
  })
}
