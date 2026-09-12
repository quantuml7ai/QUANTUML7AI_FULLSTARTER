'use client'

import React from 'react'
import {
  getQl7SupportSvgGeometry,
  normalizeQl7SupportSvgRole,
} from '../../../../../lib/ql7-support/presentation/svgRegistry.js'

const h = React.createElement

function renderPrimitive(item, index) {
  const attrs = { ...item.attrs, key:`${item.layer}:${item.type}:${index}` }
  const classNames = [
    'ql7PremiumSvgPrimitive',
    `ql7PremiumSvgPrimitive--${item.layer}`,
    attrs.className || '',
  ].filter(Boolean).join(' ')
  attrs.className = classNames
  return h(item.type, attrs)
}

export default function Ql7SemanticBadge({
  iconKey='social',
  assetId='',
  label='',
  animated=true,
  size='normal',
}) {
  const requestedIconKey = String(iconKey || 'social').trim().toLowerCase().replace(/[^a-z0-9_]+/gu, '_') || 'social'
  const fallbackRole = normalizeQl7SupportSvgRole(requestedIconKey)
  const asset = getQl7SupportSvgGeometry(assetId, fallbackRole)
  const role = asset.role
  const showStopMark = requestedIconKey === 'stop' && role === 'blocked'
  const className = [
    'ql7SemanticBadge',
    'ql7SemanticBadge--premium',
    `ql7SemanticBadge--${role}`,
    `ql7SemanticBadge--variant-${asset.variant}`,
    animated ? 'isAnimated' : '',
    size === 'small' ? 'isSmall' : '',
  ].filter(Boolean).join(' ')
  const groups = ['frame','accent','core','detail','fill','micro'].map((layer)=>{
    const rows = asset.geometry.filter((item)=>item.layer===layer)
    return rows.length ? h('g',{key:layer,className:`ql7PremiumSvgLayer ql7PremiumSvgLayer--${layer}`},...rows.map(renderPrimitive)) : null
  }).filter(Boolean)
  return h('span',{
    className,
    role:label?'img':undefined,
    'aria-label':label||undefined,
    'aria-hidden':label?undefined:'true',
    'data-ql7-semantic-icon':requestedIconKey,
    'data-ql7-svg-role':role,
    'data-ql7-svg-asset-id':asset.assetId,
    'data-ql7-svg-variant':String(asset.variant),
    'data-ql7-svg-quality':asset.qualityTier,
    'data-ql7-svg-path-hash':asset.pathHash,
    'data-ql7-svg-legacy':'0',
    'data-ql7-svg-animation-engine':asset.motion.engine,
  },
    h('svg',{
      viewBox:asset.viewBox,
      focusable:'false',
      preserveAspectRatio:'xMidYMid meet',
      'data-ql7-premium-svg':'1',
    },...groups,showStopMark?h('text',{className:'ql7PremiumSvgStopMark',x:'24',y:'26.2',textAnchor:'middle','aria-hidden':'true'},'STOP'):null),
    h('i',{className:'ql7SemanticBadgeGlow','aria-hidden':'true'}),
  )
}
