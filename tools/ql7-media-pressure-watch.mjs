#!/usr/bin/env node
console.log(`Paste this into Chrome console on /forum:

window.__ql7MediaPressureWatch && window.__ql7MediaPressureWatch(1500)

Stop:
clearInterval(window.__ql7MediaPressureWatchTimer)

Single snapshots:
window.__ql7VideoFeedPressure && window.__ql7VideoFeedPressure()
window.__ql7AdMediaRuntimeState && window.__ql7AdMediaRuntimeState()
window.__ql7ForumAdRotationState && window.__ql7ForumAdRotationState()
window.__ql7SiteAdPressure && window.__ql7SiteAdPressure()

Targets:
videosWithSrc 1-3; postVideosWithSrc 1-2; adVideosWithSrc 0-1; iframesWithSrc 0-1; videosLoadPending 0-1; duplicateSrcWithSrc []
`);
