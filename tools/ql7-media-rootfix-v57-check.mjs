#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const checks = [
  ['app/forum/features/media/utils/mediaLifecycleRuntime.js', '__isChromeDesktopMediaRuntime'],
  ['app/forum/features/media/utils/mediaLifecycleRuntime.js', 'const __SOFT_RESIDENT_POST_VIDEO = !__isChromeDesktopMediaRuntime()'],
  ['app/forum/features/media/hooks/useForumMediaCoordinator.js', 'window.__ql7VideoFeedPressure'],
  ['app/forum/features/media/hooks/useForumMediaCoordinator.js', 'runQl7MediaLifecycleSweep'],
  ['app/forum/features/media/hooks/useForumMediaCoordinator.js', 'bypassSrcLimiter: false'],
  ['app/forum/features/media/components/VideoFeedPane.jsx', 'data-ql7-video-feed-grid="1"'],
  ['app/forum/shared/hooks/useForumWindowing.js', 'mediaKeepaliveEnabled = true'],
  ['app/forum/shared/hooks/useForumWindowing.js', 'mediaKeepaliveEnabled,\n    readViewportState'],
  ['app/forum/shared/hooks/useForumWindowing.js', 'mediaKeepaliveEnabled,\n    scheduleAnchorFlush'],
  ['app/forum/features/media/hooks/useVideoFeedWindowing.js', 'mediaKeepaliveEnabled: false'],
  ['app/forum/features/feed/components/ForumPostCard.jsx', 'data-video-feed-card'],
  ['app/forum/features/feed/components/PostMediaStack.jsx', 'isVideoFeed ? "0" : "media"'],
  ['app/forum/ForumAds.js', 'normalizeAdMediaIdentity'],
  ['app/forum/ForumAds.js', 'pickAdMediaHref'],
  ['app/forum/features/ui/components/ForumAdSlot.jsx', 'data-windowing-keepalive="0"'],
  ['app/ads.js', 'window.__ql7SiteAdPressure'],
  ['tools/ql7-media-owner-audit.mjs', 'OWNER_PATTERNS'],
  ['tools/ql7-har-media-churn.mjs', 'HAR media churn'],
  ['tools/ql7-media-pressure-watch.mjs', '__ql7MediaPressureWatch'],
];
let ok = true;
console.log('QL7 v57 media lifecycle controller rootfix check');
for (const [rel, needle] of checks) {
  const file = path.join(root, rel);
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const pass = text.includes(needle);
  console.log(`${pass ? 'OK  ' : 'FAIL'} ${rel} :: ${needle}`);
  if (!pass) ok = false;
}
const hookFile = path.join(root, 'app/forum/shared/hooks/useForumWindowing.js');
if (fs.existsSync(hookFile)) {
  const text = fs.readFileSync(hookFile, 'utf8');
  const uses = (text.match(/mediaKeepaliveEnabled/g) || []).length;
  const depUses = (text.match(/mediaKeepaliveEnabled,\n/g) || []).length;
  const depsOk = uses >= 4 && depUses >= 2;
  console.log(`${depsOk ? 'OK  ' : 'FAIL'} app/forum/shared/hooks/useForumWindowing.js :: mediaKeepaliveEnabled hook deps count uses=${uses} depEntries=${depUses}`);
  if (!depsOk) ok = false;
}
console.log('\nPowerShell audit: node tools/ql7-media-owner-audit.mjs .');
console.log('HAR audit:        node tools/ql7-har-media-churn.mjs ".\\localhost.har"');
console.log('Browser pressure: window.__ql7VideoFeedPressure && window.__ql7VideoFeedPressure()');
console.log('Browser watch:    window.__ql7MediaPressureWatch && window.__ql7MediaPressureWatch(1500)');
process.exit(ok ? 0 : 1);
