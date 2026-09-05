import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

function arg(name, fallback = '') { const p=`--${name}=`; const row=process.argv.slice(2).find((x)=>x.startsWith(p)); return row?row.slice(p.length):fallback }
const slash=(v)=>String(v||'').replace(/\\/g,'/')
const sha=(buf)=>crypto.createHash('sha256').update(buf).digest('hex').toUpperCase()
async function file(pathname){return fs.readFile(pathname)}
async function text(root,rel){return fs.readFile(path.join(root,rel),'utf8')}
async function exists(p){return fs.stat(p).then(()=>true).catch(()=>false)}
async function walk(root){const out=[];const stack=[root];while(stack.length){const cur=stack.pop();for(const e of await fs.readdir(cur,{withFileTypes:true})){if(['node_modules','.next','reports','.git','public'].includes(e.name))continue;const full=path.join(cur,e.name);if(e.isDirectory())stack.push(full);else if(e.isFile())out.push(slash(path.relative(root,full)))}}return out.sort()}
function keyframes(source){const rows=new Map();const re=/@keyframes\s+([\w-]+)\s*\{/g;let m;while((m=re.exec(source))){let i=re.lastIndex,depth=1;while(i<source.length&&depth){if(source[i]==='{')depth++;else if(source[i]==='}')depth--;i++}rows.set(m[1],source.slice(m.index,i).replace(/\s+/g,' ').trim())}return rows}
async function writeJson(file,value){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,`${JSON.stringify(value,null,2)}\n`,'utf8')}

const beforeRoot=path.resolve(arg('before-root'))
const afterRoot=path.resolve(arg('after-root'))
const outDir=path.resolve(arg('out-dir',path.join(afterRoot,'reports','ql7-global-visual-activity-v3-codeproof')))
const beforePublicRoot=path.resolve(arg('before-public-root',path.join(beforeRoot,'public')))
const afterPublicRoot=path.resolve(arg('after-public-root',path.join(afterRoot,'public')))
if(!beforeRoot||!afterRoot)throw new Error('before-root and after-root required')
const beforeFiles=new Set(await walk(beforeRoot));const afterFiles=new Set(await walk(afterRoot));const all=[...new Set([...beforeFiles,...afterFiles])].sort();const changed=[]
for(const rel of all){const a=await fs.readFile(path.join(beforeRoot,rel)).catch(()=>null),b=await fs.readFile(path.join(afterRoot,rel)).catch(()=>null);if(!a||!b||sha(a)!==sha(b))changed.push(rel)}
const errors=[]

// Strict mutation boundary.
const allowedPrefixes=['components/visual-runtime/','lib/visual-runtime/','public/__ql7_visual_posters/','tests/unit/visual-runtime/','tests/component/visual-runtime/','tests/integration/visual-runtime/']
const allowedExact=new Set([
'.eslintrc.json','PROJECT_DEPENDENCIES.md','PROJECT_OWNERSHIP.md','PROJECT_RISKS.md','PROJECT_ROUTES.md','PROJECT_TREE.md','audit/project-docs-audit.json','audit/project-tree-audit.json','app/layout.js','app/globals.css','app/page.js','app/about/page.js','app/privacy/page.js','app/subscribe/subscribe.client.jsx','app/game/page.js','app/tma/auto/page.jsx','app/academy/AcademyExamBlock.js','app/academy/page.js','app/ads/AdsGeoTargetingPortal.jsx','app/ads/home.js','app/ads/page.jsx','app/components/CryptoNewsLens.jsx','app/exchange/BattleCoin.jsx','app/exchange/page.js','app/exchange/ai-box/AIWorkbench.jsx','app/exchange/battle-chat/BattleChat.jsx','app/exchange/battle-chat/BattleChatMessageRow.jsx','app/forum/page.js','app/forum/ForumAds.js','app/forum/ForumHeaderPanel.jsx','app/forum/ForumLayout.jsx','app/forum/features/dm/components/DmDialogRow.jsx','app/forum/features/dm/components/DmMediaRenderer.jsx','app/forum/features/dm/components/DmThreadHeader.jsx','app/forum/features/dm/components/DmThreadMessageRow.jsx','app/forum/features/feed/components/ForumPostCard.jsx','app/forum/features/feed/components/PostMediaStack.jsx','app/forum/features/feed/components/TopicItem.jsx','app/forum/features/feed/components/UserRecommendationCard.jsx','app/forum/features/feed/components/UserRecommendationsRail.jsx','app/forum/features/media/components/VideoLimitOverlay.jsx','app/forum/features/media/components/VideoOverlay.jsx','app/forum/features/media/components/VideoTrimPopover.jsx','app/forum/features/profile/components/AvatarEmoji.jsx','app/forum/features/profile/components/ProfilePopover.jsx','app/forum/features/profile/components/UserInfoPopover.jsx','app/forum/features/qcoin/components/QCoinInline.jsx','app/forum/features/qcoin/components/QCoinWithdrawPopover.jsx','app/forum/features/quests/components/QuestHub.jsx','app/forum/features/ui/components/ComposerEmojiPanel.jsx','app/forum/features/ui/components/ForumActionRow.jsx','app/forum/features/ui/components/ForumSearchSortControls.jsx','app/api/forum/upload/route.js','components/AndroidAppPrompt.jsx','components/AuthNavClient.jsx','components/BgAudio.js','components/InviteFriendPopup.jsx','components/MediaPipelineProgress.jsx','components/MetaMarket.jsx','components/QCoinDropFX.jsx','components/QuantumWallet.jsx','components/QuantumWalletLaunchIcon.jsx','components/ScrollTopPulse.js','components/TopBar.js','lib/storage/mediaKeys.js','tests/contracts/project/forum-hook-contracts.test.js','tests/contracts/project/exchange-ai-box-contracts.test.js','tests/contracts/project/global-visual-activity-v3.contract.test.js','tools/audit-global-visual-activity.mjs','tools/verify-global-visual-posters.mjs','tools/prove-global-visual-activity.mjs'
])
const unexpected=changed.filter((rel)=>!allowedExact.has(rel)&&!allowedPrefixes.some((p)=>rel.startsWith(p)))
if(unexpected.length)errors.push(...unexpected.map((x)=>`unexpected_change:${x}`))

// Existing keyframes are immutable; only the new QCoin glint may be added.
const keyframeRows=[]
for(const rel of changed.filter((x)=>/\.(?:css|js|jsx)$/.test(x))){const a=await fs.readFile(path.join(beforeRoot,rel),'utf8').catch(()=>''),b=await fs.readFile(path.join(afterRoot,rel),'utf8').catch(()=>'');const ka=keyframes(a),kb=keyframes(b);for(const [name,body] of ka){const next=kb.get(name);const same=!!next&&sha(Buffer.from(body))===sha(Buffer.from(next));keyframeRows.push({file:rel,name,existing:true,unchanged:same});if(!same)errors.push(`existing_keyframe_drift:${rel}:${name}`)}for(const name of kb.keys())if(!ka.has(name)&&name!=='ql7QCoinGoldGlint')errors.push(`unexpected_new_keyframe:${rel}:${name}`)}

// Heavy R8 architecture must be absent.
const registry=await text(afterRoot,'lib/visual-runtime/visualActivityRegistry.js');const host=await text(afterRoot,'components/visual-runtime/GlobalVisualActivityRuntime.jsx');const adapter=await text(afterRoot,'components/visual-runtime/ViewportAnimatedImage.jsx');const runtime=`${registry}\n${host}\n${adapter}`
const forbidden=[['document_getAnimations',/document\.getAnimations\s*\(/],['body_mutation_observer',/new\s+MutationObserver\s*\(/],['global_img_scan',/querySelectorAll\(\s*["']img["']\s*\)/],['star_scan',/querySelectorAll\(\s*["']\*["']\s*\)/],['computed_style',/getComputedStyle\s*\(/],['rect_read',/getBoundingClientRect\s*\(/],['scroll_geometry',/\.scrollHeight\b|\.clientHeight\b/],['responsive_mutation',/\.srcset\s*=|\.sizes\s*=/],['scroll_listener',/addEventListener\(\s*["']scroll["']/]]
for(const [name,re] of forbidden)if(re.test(runtime))errors.push(`runtime_forbidden:${name}`)
for(const token of ['forcedLayoutReads: 0','globalAnimationScans: 0','bodyMutationObservers: 0','descendantStateScans: 0'])if(!registry.includes(token))errors.push(`runtime_guard_missing:${token}`)
if(adapter.includes('React.useEffect(() => () =>'))errors.push('animated_asset_strictmode_cleanup_regression')
if(!adapter.includes('node.dataset.ql7VisualMargin = profile'))errors.push('animated_asset_margin_marker_missing')
if(!adapter.includes("node.dataset.ql7VisualPinned = '1'")||!adapter.includes("node.dataset.ql7VisualPinnedActive = '1'")||!adapter.includes('enabled: true'))errors.push('animated_asset_pinned_marker_missing')
if(adapter.includes('ViewportPinnedActivityProvider')||adapter.includes('ViewportPinnedActivityContext'))errors.push('animated_asset_pinned_context_regression')
if(!registry.includes('if (record.viewportPinned)')||!registry.includes("viewportPinned: node.dataset.ql7VisualPinned === '1'"))errors.push('viewport_pinned_registry_contract_missing')
const forumAction=await text(afterRoot,'app/forum/features/ui/components/ForumActionRow.jsx');const forumHeader=await text(afterRoot,'app/forum/ForumHeaderPanel.jsx');if(!forumAction.includes('animatedSrc="/friends/invitation.gif"')||!forumAction.includes('viewportPinned')||forumHeader.includes('ViewportPinnedActivityProvider')||!forumHeader.includes('{actionCluster}'))errors.push('forum_invitation_pinned_convergence_contract_missing')
const avatarEmoji=await text(afterRoot,'app/forum/features/profile/components/AvatarEmoji.jsx');const profilePopover=await text(afterRoot,'app/forum/features/profile/components/ProfilePopover.jsx');const composerEmoji=await text(afterRoot,'app/forum/features/ui/components/ComposerEmojiPanel.jsx')
if(!avatarEmoji.includes('data-ql7-animated-role="profile-avatar"')||!profilePopover.includes('data-ql7-visual-surface="profile-vip-avatars"')||!profilePopover.includes('initialPoster={avatarIndex >= DENSE_INITIAL_WARM_COUNT}')||!profilePopover.includes('marginProfile="near50"'))errors.push('profile_vip_dense_runtime_contract_missing')
if(!composerEmoji.includes("data-ql7-visual-surface={emojiTab === 'stickers' ? 'vip-stickers' : 'emoji-picker'}")||!composerEmoji.includes('initialPoster={emojiIndex >= DENSE_INITIAL_WARM_COUNT}')||!composerEmoji.includes('marginProfile="near50"'))errors.push('vip_sticker_dense_runtime_contract_missing')
if(!host.includes('scheduleDestructiveTeardown(generation)')||!host.includes('pendingDestructiveTeardown = window.setTimeout'))errors.push('root_controller_strictmode_deferred_teardown_missing')
const hostCleanup=host.slice(host.indexOf('return () => {'));if(hostCleanup.includes('teardownVisualActivityRegistry()'))errors.push('root_controller_strictmode_destructive_cleanup_regression')

// Media firewall and previously accepted Forum Stability owner are immutable.
for(const banned of ['video.pause(','audio.pause(','.currentTime =','.playbackRate =','.volume =','.muted ='])if(runtime.includes(banned))errors.push(`media_firewall:${banned}`)
const protectedExact=['app/forum/features/media/hooks/useForumMediaCoordinator.js','app/forum/shared/hooks/useForumWindowing.js','app/forum/features/feed/hooks/useForumViewTracking.js']
const protectedRows=[]
for(const rel of protectedExact){const a=await file(path.join(beforeRoot,rel)),b=await file(path.join(afterRoot,rel));const same=sha(a)===sha(b);protectedRows.push({file:rel,unchanged:same});if(!same)errors.push(`protected_runtime_drift:${rel}`)}

// Forum monolithic/mirror styles remain exact: no rail/backdrop/button drift.
for(const rel of ['app/forum/styles/ForumStyles.jsx','app/forum/styles/modules/qcoinStyles.js']){const a=await file(path.join(beforeRoot,rel)),b=await file(path.join(afterRoot,rel));if(sha(a)!==sha(b))errors.push(`protected_forum_style_drift:${rel}`)}

// QCoin visible change is isolated to the opt-in shared class; QCoinDropFX is not opted in.
const globals=await text(afterRoot,'app/globals.css');if(!globals.includes('.qcoinLabel.ql7QCoinGoldLabel')||!globals.includes('@keyframes ql7QCoinGoldGlint'))errors.push('qcoin_gold_signature_missing')
if(!globals.includes('ql7QCoinGoldGlint 7s ease-in-out infinite'))errors.push('qcoin_glint_timing_drift')
for(const phase of ['61%','65%','70%','77%','83%','100%'])if(!globals.includes(phase))errors.push(`qcoin_glint_phase_missing:${phase}`)
if((await text(afterRoot,'components/QCoinDropFX.jsx')).includes('ql7QCoinGoldLabel'))errors.push('qcoin_drop_fx_visual_drift')

// Poster manifest and original public assets.
let manifest=null;try{manifest=JSON.parse(await fs.readFile(path.join(afterRoot,'public/__ql7_visual_posters/manifest.json'),'utf8'))}catch{}
const assets=Array.isArray(manifest?.assets)?manifest.assets:[];if(manifest?.schema!=='ql7-animated-asset-manifest-v2'||assets.length!==295)errors.push('poster_manifest_invalid')
const posterRows=[]
for(const row of assets){const sourceRel=`public/${String(row.source||'').replace(/^\//,'')}`,posterRel=`public/${String(row.poster||'').replace(/^\//,'')}`;const publicSourceRel=String(row.source||'').replace(/^\//,'');const publicPosterRel=String(row.poster||'').replace(/^\//,'');const before=await fs.readFile(path.join(beforePublicRoot,publicSourceRel)).catch(()=>null),after=await fs.readFile(path.join(afterPublicRoot,publicSourceRel)).catch(()=>null),poster=await fs.readFile(path.join(afterPublicRoot,publicPosterRel)).catch(()=>null);const sourceSame=!!before&&!!after&&sha(before)===sha(after)&&sha(after)===String(row.sourceSha256||'').toUpperCase();const posterOk=!!poster&&sha(poster)===String(row.posterSha256||'').toUpperCase();posterRows.push({source:row.source,poster:row.poster,sourceUnchanged:sourceSame,posterHashOk:posterOk});if(!sourceSame)errors.push(`public_source_drift:${row.source}`);if(!posterOk)errors.push(`poster_hash:${row.poster}`)}
const vipAvatarPosterRows=posterRows.filter((row)=>/^\/vip\/avatars\/a\d+\.gif$/i.test(String(row.source||'')))
const vipEmojiPosterRows=posterRows.filter((row)=>/^\/vip\/emoji\/e\d+\.gif$/i.test(String(row.source||'')))
if(vipAvatarPosterRows.length!==130)errors.push(`vip_avatar_poster_count:${vipAvatarPosterRows.length}:130`)
if(vipEmojiPosterRows.length!==149)errors.push(`vip_emoji_poster_count:${vipEmojiPosterRows.length}:149`)

// API mutation boundary.
const apiChanges=changed.filter((x)=>x.startsWith('app/api/'));for(const rel of apiChanges)if(rel!=='app/api/forum/upload/route.js')errors.push(`unexpected_api_change:${rel}`)
const upload=await text(afterRoot,'app/api/forum/upload/route.js'),keys=await text(afterRoot,'lib/storage/mediaKeys.js');for(const token of ['const outBuf = isGif','? input','createAnimatedPosterKey(key)','page: 0','posterUrl','urls.push(url)'])if(!upload.includes(token))errors.push(`upload_contract_missing:${token}`);if(!keys.includes('export function createAnimatedPosterKey'))errors.push('poster_key_helper_missing')

// No DB/Redis mutation added by this visual patch runtime/tools.
for(const rel of changed.filter((x)=>/^(?:components\/visual-runtime|lib\/visual-runtime)/.test(x))){const t=await fs.readFile(path.join(afterRoot,rel),'utf8').catch(()=>'');if(/\b(?:mongo|mongodb|redis)\b/i.test(t)&&/\b(?:insert|update|delete|flush|set|hset|zadd|sadd)\b/i.test(t))errors.push(`data_write_token:${rel}`)}

const reports={
'button-animation-diff.json':{schema:'ql7-button-animation-diff-v3',ok:!errors.some((e)=>e.startsWith('existing_keyframe_drift')||e.startsWith('unexpected_new_keyframe')),rows:keyframeRows},
'performance-regression-firewall.json':{schema:'ql7-performance-regression-firewall-v3',ok:!errors.some((e)=>e.startsWith('runtime_forbidden')||e.startsWith('root_controller_strictmode_')),forbiddenChecks:forbidden.map(([name,re])=>({name,present:re.test(runtime)})),runtimeGuards:['forcedLayoutReads','globalAnimationScans','bodyMutationObservers','descendantStateScans'],rootControllerStrictModeSafe:!errors.some((e)=>e.startsWith('root_controller_strictmode_'))},
'media-firewall-proof.json':{schema:'ql7-media-firewall-proof-v3',ok:!errors.some((e)=>e.startsWith('media_firewall')||e.startsWith('protected_runtime_drift')),protectedRows},
'gif-runtime-proof.json':{schema:'ql7-gif-runtime-proof-v5',ok:posterRows.length===295&&posterRows.every((x)=>x.sourceUnchanged&&x.posterHashOk)&&vipAvatarPosterRows.length===130&&vipEmojiPosterRows.length===149&&!errors.some((e)=>e.includes('pinned_')||e.includes('forum_invitation_pinned')||e.includes('profile_vip_dense')||e.includes('vip_sticker_dense')),entries:posterRows.length,viewportPinnedForumInvitation:!errors.some((e)=>e.includes('pinned_')||e.includes('forum_invitation_pinned')),profileVipDenseRuntime:!errors.some((e)=>e.includes('profile_vip_dense')),vipStickerDenseRuntime:!errors.some((e)=>e.includes('vip_sticker_dense')),vipAvatarPosters:vipAvatarPosterRows.length,vipEmojiPosters:vipEmojiPosterRows.length,rows:posterRows},
'qcoin-visual-contract.json':{schema:'ql7-qcoin-visual-contract-v3',ok:!errors.some((e)=>e.startsWith('qcoin_')),allowedVisibleChange:'Shared qcoinLabel.ql7QCoinGoldLabel static premium gold plus Authorized-synchronized 7s rare glint; no dimensions/handlers changed.'}
}
for(const [name,value] of Object.entries(reports))await writeJson(path.join(outDir,name),value)
const summary={schema:'ql7-global-visual-activity-codeproof-v3',ok:errors.length===0,beforeRoot,afterRoot,changedFiles:changed.length,posterEntries:posterRows.length,existingKeyframesChecked:keyframeRows.filter((x)=>x.existing).length,errors,changed}
await writeJson(path.join(outDir,'codeproof-summary.json'),summary);console.log(JSON.stringify({ok:summary.ok,changedFiles:summary.changedFiles,posterEntries:summary.posterEntries,existingKeyframesChecked:summary.existingKeyframesChecked,errors},null,2));process.exit(summary.ok?0:1)
