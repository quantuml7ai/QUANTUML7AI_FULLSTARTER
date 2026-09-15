const VERSION = 'ql7.composer.surface-registry'
const SURFACES = Object.freeze({
  forum: Object.freeze({ id: 'forum', serverRoute: '/api/forum/mutate', preview: true, authority: 'server', restrictionScope: 'composer' }),
  dm: Object.freeze({ id: 'dm', serverRoute: '/api/dm/send', preview: true, authority: 'server', restrictionScope: 'composer' }),
  battle_chat: Object.freeze({ id: 'battle_chat', serverRoute: '/api/battlecoin/chat/messages', preview: true, authority: 'server', restrictionScope: 'composer' }),
  ql7_support: Object.freeze({ id: 'ql7_support', serverRoute: '/api/dm/send', preview: false, authority: 'ql7-support-runtime', excluded: true, exclusionReason: 'canonical_support_safety_contour' }),
})
function getComposerSurface(id) { return SURFACES[String(id || '').trim()] || null }
function listComposerSurfaces() { return Object.values(SURFACES) }
module.exports = { VERSION, SURFACES, getComposerSurface, listComposerSurfaces }
