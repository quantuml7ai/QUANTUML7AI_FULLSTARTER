import { ql7Arr, ql7StableHash, ql7Str } from '../internal/text.js'

export const QL7_SUPPORT_SVG_REGISTRY_VERSION = '14.2.0'
export const QL7_SUPPORT_SVG_VIEWBOX = '0 0 48 48'
export const QL7_SUPPORT_SVG_ROLES = Object.freeze([
  'greeting','social','gratitude','humor','emotional_support','qcoin','wallet','payment',
  'vip','ads_package','ads_metrics','forum','telegram','academy','gameverse','metamarket',
  'security','privacy','warning','blocked','threat','operator','verification','unavailable',
  'success','identity','translation','partnership','investment','accessibility','choice','event',
])

const ROLE_ALIASES = Object.freeze({
  info:'social',information:'social',conversation:'social',context:'social',joy:'humor',serious:'social',
  confirmed:'verification',partial:'verification',checking:'verification',resolved:'success',danger:'threat',
  stop:'blocked',cooldown:'blocked',incident:'warning',fraud:'security',operator_handoff:'operator',
  payment_status:'payment',analytics:'ads_metrics',ai_recommendation:'ads_metrics',ai_recomendation:'ads_metrics',market_ai:'ads_metrics',exchange:'payment',moderation:'security',
  account_deletion:'privacy',learning:'academy',appeal:'choice',waiting:'operator',clarification:'choice',
})

const MOOD = Object.freeze({
  greeting:'warm',social:'supportive',gratitude:'warm',humor:'playful',emotional_support:'calm',
  qcoin:'confident',wallet:'confident',payment:'confident',vip:'premium',ads_package:'premium',
  ads_metrics:'analytical',forum:'supportive',telegram:'supportive',academy:'focused',gameverse:'playful',
  metamarket:'premium',security:'strict',privacy:'strict',warning:'firm',blocked:'strict',threat:'strict',
  operator:'focused',verification:'confident',unavailable:'neutral',success:'warm',identity:'confident',
  translation:'focused',partnership:'premium',investment:'premium',accessibility:'calm',choice:'focused',event:'supportive',
})

const primitive = (type, attrs, layer='core') => Object.freeze({ type, layer, attrs:Object.freeze(attrs) })
const path = (d, layer='core', attrs={}) => primitive('path', { d, ...attrs }, layer)
const circle = (cx, cy, r, layer='core', attrs={}) => primitive('circle', { cx, cy, r, ...attrs }, layer)
const rect = (x, y, width, height, rx=0, layer='core', attrs={}) => primitive('rect', { x, y, width, height, rx, ...attrs }, layer)
const line = (x1, y1, x2, y2, layer='core', attrs={}) => primitive('line', { x1, y1, x2, y2, ...attrs }, layer)
const polyline = (points, layer='core', attrs={}) => primitive('polyline', { points, ...attrs }, layer)
const polygon = (points, layer='core', attrs={}) => primitive('polygon', { points, ...attrs }, layer)

function variantFrame(variant) {
  const frames = {
    1:[
      circle(24,24,20.2,'frame',{className:'ql7SvgFrameRing'}),
      path('M7.7 15.4A20 20 0 0 1 17 6.4','frame',{className:'ql7SvgFrameArc'}),
      path('M31 41.6a20 20 0 0 0 9.3-9','frame',{className:'ql7SvgFrameArc'}),
      circle(8.5,13.2,1.35,'accent',{className:'ql7SvgNode'}),
      circle(39.4,34.5,1.1,'accent',{className:'ql7SvgNode ql7SvgNode--secondary'}),
    ],
    2:[
      polygon('24 3.8 39.4 12.7 43.1 29.8 31.2 43 13.4 41.2 4.6 25.6 10.7 9.6','frame',{className:'ql7SvgFacet'}),
      polygon('24 7.8 36.2 14.8 39.2 28.2 29.8 38.7 15.6 37.2 8.6 24.8 13.4 12.2','frame',{className:'ql7SvgFacet ql7SvgFacet--inner'}),
      line(10.7,9.6,13.4,12.2,'accent',{className:'ql7SvgCircuit'}),
      line(39.4,12.7,36.2,14.8,'accent',{className:'ql7SvgCircuit'}),
      circle(4.6,25.6,1.25,'accent',{className:'ql7SvgNode'}),
      circle(43.1,29.8,1.25,'accent',{className:'ql7SvgNode ql7SvgNode--secondary'}),
    ],
    3:[
      path('M8.2 29.8C4.4 20.6 9.1 9.9 18.4 6.2','frame',{className:'ql7SvgOrbit'}),
      path('M29.6 41.8c9.2-3.7 13.9-14.4 10.1-23.6','frame',{className:'ql7SvgOrbit'}),
      path('M11.3 36.8C5.2 29.3 6.5 17.9 14.2 11.9','frame',{className:'ql7SvgOrbit ql7SvgOrbit--inner'}),
      path('M36.7 11.2c6.1 7.5 4.8 18.9-2.9 24.9','frame',{className:'ql7SvgOrbit ql7SvgOrbit--inner'}),
      circle(17.9,6.3,1.45,'accent',{className:'ql7SvgNode'}),
      circle(30.1,41.6,1.45,'accent',{className:'ql7SvgNode ql7SvgNode--secondary'}),
    ],
    4:[
      path('M10 8h10l4-4 4 4h10l2 10 4 4-4 4-2 12H28l-4 4-4-4H10L8 28l-4-4 4-4 2-12z','frame',{className:'ql7SvgCircuitFrame'}),
      path('M12 12h7l5-5 5 5h7v7l5 5-5 5v7h-7l-5 5-5-5h-7v-7l-5-5 5-5v-7z','frame',{className:'ql7SvgCircuitFrame ql7SvgCircuitFrame--inner'}),
      circle(10,8,1.15,'accent',{className:'ql7SvgNode'}),circle(38,8,1.15,'accent',{className:'ql7SvgNode ql7SvgNode--secondary'}),
      circle(38,38,1.15,'accent',{className:'ql7SvgNode'}),circle(10,38,1.15,'accent',{className:'ql7SvgNode ql7SvgNode--secondary'}),
    ],
    5:[
      path('M4.5 24c5.6-12.8 33.4-12.8 39 0-5.6 12.8-33.4 12.8-39 0z','frame',{className:'ql7SvgLens'}),
      path('M24 4.5c12.8 5.6 12.8 33.4 0 39-12.8-5.6-12.8-33.4 0-39z','frame',{className:'ql7SvgLens ql7SvgLens--cross'}),
      circle(24,24,18.1,'frame',{className:'ql7SvgFrameRing ql7SvgFrameRing--inner'}),
      path('M7.4 19.7c4.3-8.5 16-12.1 24.5-7.5','accent',{className:'ql7SvgFrameArc'}),
      circle(42.7,24,1.35,'accent',{className:'ql7SvgNode'}),
      circle(24,5.3,1.15,'accent',{className:'ql7SvgNode ql7SvgNode--secondary'}),
    ],
  }
  return frames[variant] || frames[1]
}

function coreGeometry(role) {
  const core = {
    greeting:[path('M24 10l2.5 8.6L35 21l-8.5 2.5L24 32l-2.5-8.5L13 21l8.5-2.4L24 10z'),circle(34.5,13.5,2.1,'accent'),path('M13 33c6 3.8 16 3.8 22 0','detail')],
    social:[path('M12 14h21v14H21l-7 6v-6h-2z'),path('M25 27h11v8l-4.5-3.2H25','detail'),circle(17,20,1.1,'accent'),circle(22,20,1.1,'accent'),circle(27,20,1.1,'accent')],
    gratitude:[path('M24 36S11 28.6 11 18.3a7.2 7.2 0 0 1 13-4.3 7.2 7.2 0 0 1 13 4.3C37 28.6 24 36 24 36z'),path('M16.2 20.5c2.6-3.9 6.2-3.4 7.8-.4 1.6-3 5.2-3.5 7.8.4','detail'),circle(24,29.5,1.2,'accent')],
    humor:[circle(24,24,12.5),path('M17.2 21c1.2-1.2 2.8-1.2 4 0M26.8 21c1.2-1.2 2.8-1.2 4 0','detail'),path('M17.5 27.2c3.6 4.7 9.4 4.7 13 0','detail'),path('M31.5 14l3-3M15.5 14l-3-3','accent')],
    emotional_support:[path('M12 25c0-8.5 5.2-14 12-14s12 5.5 12 14v7H12z'),path('M16.5 26c2.8-3.8 5.4-3.6 7.5-.6 2.1-3 4.7-3.2 7.5.6','detail'),path('M18 34h12','accent'),circle(24,19,2.2,'fill')],
    qcoin:[circle(23,23,13),path('M28.5 17.5c-2.4-3-9-2.7-10.6 1.8-2.2 6.2 7.4 10.4 11.7 4.8','detail'),path('M30.5 29.5l6 6','accent'),path('M17 15l-2.2-2.2M16 31l-2.6 2.6','accent')],
    wallet:[rect(10,14,28,21,5),path('M31 20h8v9h-8a4.5 4.5 0 0 1 0-9z','detail'),circle(32,24.5,1.2,'fill'),path('M13 14v-2.5h20V14','accent')],
    payment:[rect(9,13,30,22,4),path('M9 20h30','detail'),path('M14 29h8M27 29h6','accent'),circle(34,16.5,1.1,'fill')],
    vip:[path('M8 17l8 6 8-13 8 13 8-6-4 20H12L8 17z'),path('M14 31h20','detail'),path('M18 25l6 5 6-5','accent'),circle(24,17,1.4,'fill')],
    ads_package:[path('M11 16l13-7 13 7v17l-13 7-13-7V16z'),path('M11 16l13 7 13-7M24 23v17','detail'),path('M17 13l14 8M17 35l14-8','accent')],
    ads_metrics:[path('M11 36V27M18 36V18M25 36V24M32 36V12M39 36V20','detail'),path('M9 38h32','core'),path('M12 22l7-7 7 4 9-11','accent'),circle(35,8,1.5,'fill')],
    forum:[path('M9 13h30v19H23l-9 7v-7H9V13z'),path('M15 19h18M15 24h14M15 29h9','detail'),circle(35,29,1.1,'accent')],
    telegram:[path('M7 23L41 9l-7 31-10-8-7 6 2-10 14-11-18 8-8-2z'),path('M19 28l15-11','detail'),circle(35.5,13,1.2,'accent')],
    academy:[path('M7 17L24 8l17 9-17 9-17-9z'),path('M13 23v10c7 5 15 5 22 0V23','detail'),path('M41 18v12','accent'),circle(41,32,1.3,'fill')],
    gameverse:[path('M12 17h24l7 11-4 10-9-6H18l-9 6-4-10 7-11z'),path('M15 25h8M19 21v8','detail'),circle(32,24,1.4,'fill'),circle(36,28,1.4,'fill')],
    metamarket:[path('M9 16h30l-3 24H12L9 16z'),path('M15 16a9 9 0 0 1 18 0','detail'),path('M16 24h16M16 30h12M16 36h8','accent')],
    security:[path('M24 7l14 6v11c0 9-5.8 14.3-14 17-8.2-2.7-14-8-14-17V13l14-6z'),rect(17,22,14,11,3,'detail'),path('M20 22v-3.2a4 4 0 0 1 8 0V22','detail'),circle(24,27.2,1.4,'fill')],
    privacy:[path('M6 24c6-10 12-14 18-14s12 4 18 14c-6 10-12 14-18 14S12 34 6 24z'),circle(24,24,6.5,'detail'),circle(24,24,2.2,'fill'),path('M10 36L38 8','accent')],
    warning:[path('M24 7L43 40H5L24 7z'),path('M24 18v11','detail'),circle(24,34,1.5,'fill'),path('M14 37h20','accent')],
    blocked:[path('M15 7h18l10 10v14L33 41H15L5 31V17L15 7z'),rect(15,23,18,13,3,'detail'),path('M19 23v-4a5 5 0 0 1 10 0v4','detail'),path('M11 11l26 26','accent')],
    threat:[path('M24 6l16 9v18l-16 9-16-9V15l16-9z'),path('M24 15v12','detail'),circle(24,32,1.6,'fill'),path('M13 14l22 22','accent'),path('M35 14L13 36','accent')],
    operator:[path('M11 28v-5a13 13 0 0 1 26 0v5','core'),rect(8,26,7,12,3,'detail'),rect(33,26,7,12,3,'detail'),path('M35 38c0 4-4 6-9 6h-4','accent'),circle(21,44,1.4,'fill'),path('M16 18c3-5 13-5 16 0','detail')],
    verification:[path('M24 7l14 6v11c0 9-5.8 14.3-14 17-8.2-2.7-14-8-14-17V13l14-6z'),path('M16 24l5.2 5.2L33 17.5','detail'),path('M18 34h12','accent')],
    unavailable:[circle(24,24,14),path('M14 34L34 14','detail'),path('M14 14l20 20','detail'),path('M9 24H5M43 24h-4','accent')],
    success:[path('M24 7l4.2 10.8 11.6.7-9 7.3 2.8 11.4L24 31l-9.6 6.2 2.8-11.4-9-7.3 11.6-.7L24 7z'),path('M17 24l5 5 10-12','detail'),circle(36,12,1.3,'fill')],
    identity:[path('M24 7l14 7v10c0 8.2-5.4 13.8-14 17-8.6-3.2-14-8.8-14-17V14l14-7z'),circle(24,20,4.5,'detail'),path('M16 33c1.8-6 14.2-6 16 0','detail'),path('M17 12l7-3 7 3','accent')],
    translation:[circle(24,24,14),path('M10 24h28M24 10c5.5 5 5.5 23 0 28M24 10c-5.5 5-5.5 23 0 28','detail'),path('M14 16h20M14 32h20','accent')],
    partnership:[path('M7 26l9-9 8 8 8-8 9 9-11 12-6-6-6 6L7 26z'),path('M16 20l8 8 8-8','detail'),circle(24,13,2,'fill')],
    investment:[path('M8 38h32','core'),path('M11 34l8-10 7 5 12-17','detail'),path('M31 12h7v7','detail'),rect(11,27,3,7,1,'accent'),rect(20,22,3,12,1,'accent'),rect(29,18,3,16,1,'accent')],
    accessibility:[circle(24,9,3.6),path('M10 15h28M24 13v12M18 18l-5 20M30 18l5 20M24 25l-8 12M24 25l8 12','detail'),circle(12,15,1.1,'fill'),circle(36,15,1.1,'fill')],
    choice:[path('M13 14h25M13 22h25M13 30h25M13 38h25','detail'),circle(8,14,1.8,'fill'),circle(8,22,1.8,'fill'),circle(8,30,1.8,'fill'),circle(8,38,1.8,'fill'),path('M34 10l5 4-5 4','accent')],
    event:[path('M12 18h24v19H12z'),path('M17 18v-4M31 18v-4M12 24h24','detail'),path('M18 29h5M18 33h12','accent'),circle(35,11,3,'fill')],
  }
  return core[role] || core.social
}

function microDetails(role, variant) {
  const offset = variant * 0.65
  return [
    path(`M${12+offset} ${10+variant}l2.2-1.2 2.1 1.2`,'micro',{className:'ql7SvgMicro'}),
    path(`M${31-offset} ${37-variant*.45}l2.2 1.1 2.1-1.1`,'micro',{className:'ql7SvgMicro ql7SvgMicro--secondary'}),
    circle(24 + (variant-3)*1.1, 5.8 + (variant%2)*1.2, .72,'micro',{className:'ql7SvgMicroDot'}),
  ]
}

export function normalizeQl7SupportSvgRole(role='social') {
  const raw = ql7Str(role).toLowerCase().replace(/[^a-z0-9_]+/gu,'_')
  const mapped = ROLE_ALIASES[raw] || raw
  return QL7_SUPPORT_SVG_ROLES.includes(mapped) ? mapped : 'social'
}

function geometryFingerprint(geometry) {
  return geometry.map((item)=>({type:item.type,layer:item.layer,attrs:item.attrs}))
}

function createAsset(role, variant) {
  const geometry = Object.freeze([...variantFrame(variant), ...coreGeometry(role), ...microDetails(role,variant)])
  const serialized = JSON.stringify(geometryFingerprint(geometry))
  const pathDataLength = geometry.reduce((sum,item)=>sum + ql7Str(item.attrs?.d || item.attrs?.points).length,0)
  return Object.freeze({
    assetId:`${role}-v${variant}`,
    role,
    variant,
    mood:MOOD[role] || 'supportive',
    severityCompatibility:role==='threat'||role==='blocked'?Object.freeze(['critical','high']):role==='warning'?Object.freeze(['warning','elevated']):Object.freeze(['normal','info','warning']),
    pathHash:ql7StableHash(serialized),
    viewBox:QL7_SUPPORT_SVG_VIEWBOX,
    geometry,
    primitiveCount:geometry.length,
    pathDataLength,
    qualityTier:'premium-detailed',
    legacy:false,
    motion:Object.freeze({engine:'css-transform-opacity',usesJavaScript:false,usesCanvas:false,usesSvgFilter:false,maxAnimatedNodes:2,durationMs:variant===3?5200:4400,iterationCount:'state-bound',reducedMotion:'static'}),
  })
}

export const QL7_SUPPORT_SVG_ASSETS = Object.freeze(QL7_SUPPORT_SVG_ROLES.flatMap((role)=>[1,2,3,4,5].map((variant)=>createAsset(role,variant))))
const ASSET_MAP = new Map(QL7_SUPPORT_SVG_ASSETS.map((asset)=>[asset.assetId,asset]))

export function getQl7SupportSvgAsset(assetId='') {
  const direct = ASSET_MAP.get(ql7Str(assetId))
  if (direct) return direct
  const match = /^([a-z0-9_]+)-v([1-5])$/iu.exec(ql7Str(assetId))
  const role = normalizeQl7SupportSvgRole(match?.[1] || assetId)
  return ASSET_MAP.get(`${role}-v${Number(match?.[2] || 1)}`) || ASSET_MAP.get('social-v1')
}

export function getQl7SupportSvgGeometry(assetId='', fallbackRole='social') {
  return getQl7SupportSvgAsset(assetId || `${normalizeQl7SupportSvgRole(fallbackRole)}-v1`)
}

export function selectQl7SupportSvg({role='social',recentAssetIds=[],seed='',mood='',severity='normal'}={}) {
  const canonical = normalizeQl7SupportSvgRole(role)
  const recent = new Set(ql7Arr(recentAssetIds).slice(-20))
  let candidates = QL7_SUPPORT_SVG_ASSETS.filter((asset)=>asset.role===canonical&&!recent.has(asset.assetId))
  if (!candidates.length) candidates = QL7_SUPPORT_SVG_ASSETS.filter((asset)=>asset.role===canonical)
  const index = Number.parseInt(ql7StableHash(`${seed}:${canonical}:${mood}:${severity}`).slice(0,8),16) % candidates.length
  const asset = candidates[index]
  return Object.freeze({...asset,selectionHash:ql7StableHash(`${asset.assetId}:${seed}:${recent.size}`)})
}

export function validateQl7SupportSvgRegistry() {
  const ids = new Set(QL7_SUPPORT_SVG_ASSETS.map((asset)=>asset.assetId))
  const paths = new Set(QL7_SUPPORT_SVG_ASSETS.map((asset)=>asset.pathHash))
  const qualityFailures = QL7_SUPPORT_SVG_ASSETS.filter((asset)=>asset.qualityTier!=='premium-detailed'||asset.legacy||asset.primitiveCount<8||asset.pathDataLength<45||asset.motion.usesJavaScript||asset.motion.usesCanvas||asset.motion.usesSvgFilter||asset.motion.maxAnimatedNodes>2)
  return Object.freeze({
    ok:QL7_SUPPORT_SVG_ASSETS.length===160&&ids.size===160&&paths.size===160&&qualityFailures.length===0,
    count:QL7_SUPPORT_SVG_ASSETS.length,
    uniqueIds:ids.size,
    uniquePathHashes:paths.size,
    roles:QL7_SUPPORT_SVG_ROLES.length,
    variantsPerRole:5,
    premiumDetailed:QL7_SUPPORT_SVG_ASSETS.filter((asset)=>asset.qualityTier==='premium-detailed').length,
    legacyAssets:QL7_SUPPORT_SVG_ASSETS.filter((asset)=>asset.legacy).length,
    minPrimitiveCount:Math.min(...QL7_SUPPORT_SVG_ASSETS.map((asset)=>asset.primitiveCount)),
    minPathDataLength:Math.min(...QL7_SUPPORT_SVG_ASSETS.map((asset)=>asset.pathDataLength)),
    maxAnimatedNodes:Math.max(...QL7_SUPPORT_SVG_ASSETS.map((asset)=>asset.motion.maxAnimatedNodes)),
    heavyEffects:QL7_SUPPORT_SVG_ASSETS.filter((asset)=>asset.motion.usesCanvas||asset.motion.usesJavaScript||asset.motion.usesSvgFilter).length,
    qualityFailures:Object.freeze(qualityFailures.map((asset)=>asset.assetId)),
  })
}
