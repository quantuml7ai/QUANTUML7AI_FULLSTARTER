# QL7 Forum Geo Cursor Counter Contract

Contract version: `ql7-forum-premium-geo-server-surfaces-v3`

This contract protects the forum feed, topic, thread, published posts, and profile-branch surfaces from regressions where sorting changes counters or geo pages mix rings.

## Startup

- A full browser reload starts from `Geo + Random`.
- Previous `Geo/World` and sort choices must not be restored from local storage.
- The first visible feed page must come from the server projection reader, not from an old local `forum:snap`.
- Geo session touch may be throttled in memory, but it must not be blocked for the whole browser session after reload.
- `random` is a sort value only. It must never be normalized as a feed mode and must never silently switch Geo to World.

## Geo Order

- `geo` mode is ring-priority: city, region, country, global.
- The only active production geo rings are `city`, `region`, `country`, and `global`. Nearby/neighbor rings may be added later only with real data, indexes, tests, and cursor contracts.
- A later ring must not appear before the current ring is exhausted.
- Sort order applies inside a ring only.
- `world` mode disables ring priority and sorts globally.
- Client topic/video/root-post models must respect server `geo` rank for every selected sort, not only for `random`.
- In surfaces where geo ranking is not valid, such as an opened target reply thread, the sort popover must display World mode and must not allow enabling Geo for that surface.
- Topic creation must capture the same request/profile geo origin as post creation. The canonical topic document may store `_geoOrigin`, and topic/search projection indexes must store only private geo metadata (`geoPrivate.scopeKeys` plus origin) that is stripped from public payloads.

## Random

- Random uses a per-runtime feed seed.
- Random is applied independently inside each geo ring. The ring order itself stays city, region, country, global.
- Soft feed refresh resets the seed and resets the feed sort to `random` while keeping the selected Geo/World mode.
- Startup Geo rebuild uses the same narrow feed rebuild core as manual refresh, but it must not call the broad Home/navigation action or close branches. It runs under boot splash on Geo-ready and has 6s/8s startup retries so the first visible feed is rebuilt after geo/profile fallback is available.
- The `random` sort button must align the first visible feed card to the top edge of the viewport like the other sort buttons; it must not leave the page at raw `scrollTop = 0` with the header still occupying the top.
- Random cursor pages must not repeat already returned ids for the same feed map.

## Canonical Counters

- Sorting must never change canonical counters.
- Never use current array length, visible window length, or partial page length as a total counter.
- Topic cards must prefer canonical topic counters over loaded-post aggregates.
- Topic counters must not be recomputed from the currently loaded feed page when a canonical topic DTO is present.
- Topic cards and topic sort routes must hydrate full topic totals from canonical post rows by `topicId`; the displayed topic counters are totals for all existing posts in the topic, not the currently loaded client window.
- `/api/forum/topics/page` must use the same `forum-server-complete-reader` topic path as user-topic branches, so Home topics and profile topics cannot drift to different counter or cursor rules.
- A topic DTO with only zero counter aliases is a placeholder, not a canonical counter source.
- A topic DTO with positive server counters freezes the displayed aggregate until a newer server topic/core DTO replaces it; partial visible post pages must not inflate or reduce it.
- Feed/media page rows that expose embedded `topic` objects must hydrate those topic counters from `forum_core_topics` before reaching the client.
- `topic_post_totals` may replace stale projection topic counters and may repair/increase stale-low `forum_core_topics` counters by `max(core, full-post-total)`, but it must never lower a higher core value.
- Topic totals may hydrate only the embedded `topic` object on post/feed/media rows; they must never overwrite the post row's top-level `counters`, `sort`, `views`, `likes`, `replies`, or counter source.
- `forum_core_topics` may hydrate only the embedded `topic` object on post/search/thread/media rows; it must never mark the post row itself as `forum_core_topics` counter-authoritative.
- Feed/media/search/thread/inbox/user-post/snapshot/deeplink post rows must hydrate canonical post counters from `forum_core_posts` before reaching the client when a core row exists.
- Post rows may additionally hydrate direct reply counts from `forum_thread_index` by parent post id; this is an explicit counter source, not a visible-window length.
- Post reply counters are now server-authoritative when `forum_core_posts` or `forum_thread_index` provides aliases; opening or closing a thread must not increment, zero, or otherwise rewrite that canonical value.
- Post card counters are currently the protected working contract: do not copy topic aggregate counters into post top-level counters, and do not let topic hydration rewrite post `counters` or `sort`.
- Post cards and user-post/public post DTOs must ignore stale `sort.views`, `sort.replies`, and `sort.top` for displayed counters after `forum_core_posts` or `forum_thread_index` authority is present.
- A forced sort or Geo/World refresh may replace visible order, but it must preserve previously known higher canonical topic/post counters while merging the new page.
- A forced startup, Geo/World, or sort refresh treats the fresh server page as authoritative for `counters` and `sort`; old local snapshot counters must not override fresh server counters.
- Topic reaction counters are one canonical display/sort value read from `likes`, `reactions`, and `reactionCount` aliases across `topic`, `counters`, and `sort`; a partial page value of `0` must never lower a non-zero canonical reaction total.
- Topic cards and topic discovery aggregates must ignore stale `topic.sort.*` for displayed counters after `forum_core_topics` or `topic_post_totals` authority is present.
- Post reply sorting must use canonical aliases: `replyCount`, `repliesCount`, `answersCount`, `commentsCount`, `__repliesCount`, `counters.replies`, `sort.replies`.
- Loaded child counts may be used only as an emergency fallback when a post has no authoritative counter source and no positive canonical reply alias; opening a thread must not increase a server-authoritative zero.
- Reaction sorting uses all reactions, with `likes + dislikes` as fallback.
- The public UI may label this sort as `Reactions`; server readers accept `reactions` as an alias and map it to the existing canonical `sort.likes` reaction-total index until a separate physical `sort.reactions` index is introduced.

## User Identity Scope

- User post lists and published tabs must use the same identity family as the user info popover.
- User topic branches opened from the user info popover must use the server user-topics page and render the returned topic list directly for that profile branch.
- User topic branches opened from the user info popover are a protected working path: they must open on first click, support sort changes, and must not be sliced by the generic Home visible-topic window.
- Identity matching includes wallet, normalized wallet, `userId`, `accountId`, `canonicalAuthorId`, `authorId`, `ownerId`, `uid`, `asherId`, creator fields, Telegram ids, and nested author fields.
- Results must be deduplicated by post id.
- `totalCount` for user posts must be at least the canonical `forum_user_stats.stats.posts` value.

## Search Results

- Quantum Search people results must be profile-first and prefix-based by nickname; users without posts or topics must still be discoverable by their profile nickname.
- Quantum Search people results must be deduplicated by the same canonical identity family used by forum profile cards: wallet, normalized wallet, account, profile, Telegram, and alias rows collapse to one visible person card.
- A linked wallet/Telegram/profile account may appear only once in the People tab even if it is present in `profile_nick_index`, `profiles`, and `forum_core_user_metadata`.
- Quantum Search topic result badges must display canonical server topic counters from the returned topic DTO (`postsCount`, `replies`, `repliesCount`, and `counters.*`). The client may use loaded-post counts only as a backward fallback when the server DTO has no counter aliases.
- Search topic badges must never be calculated from the current visible feed page or from the search popup's locally loaded post window.

## Deletion Tombstones

- Owner deletion, copyright/report-threshold deletion, thread branches, user-post branches, and Quantum Messenger Inbox Published must share one post tombstone contour.
- After a successful owner delete or server-side report delete, every returned deleted post id must enter `tombstones.posts` immediately.
- Published posts must consume the same `tombstones.posts` object as thread/feed branches; the deleted card must disappear on the author's screen after the success toast without requiring tab switch, branch reload, page reload, or manual refresh.
- Published server pages must filter tombstoned ids before merge, and an older/stale server response must not resurrect a deleted card in the Published tab.
- Tombstones may hide stale local/server projections, but failed owner deletion must roll back the optimistic tombstone for the requested post id.

## VIP State

- Forum header `X2`, `VIP+`, and `VipPopover` must consume the single `vipActive` state passed into `ForumHeaderPanel`.
- `ForumHeaderPanel`, `QCoinInline`, and `ForumVipControl` must not create their own VIP probes, local shadow state, route calls, or alternative header truth.
- The current viewer VIP state is owned by `useVipSubscriptionState`: it hydrates from lightweight local flags `ql7_vip` / `ai_quota_vip`, then confirms through `/api/subscription/status` for `auth.accountId || auth.asherId`.
- Profile/post/topic VIP badges for other users remain separate and may use `useVipFlag` with hint/profile cache plus `/api/forum/vip/batch` fallback.
- Opening `VipPopover` is a render of the already accepted `vipActive` state; it must not disagree with `X2` or `VIP+`.
- A hard reload of `/forum` must not leave header `X2` or `VIP+` on a separate stale non-VIP state while `VipPopover` sees VIP active.

## Cursor And Sorting

- Cursor payload must match the same score tuple used for sorting.
- Every server cursor belongs to one feed map: surface, mode, sort, seed, geo key, rings hash, media kind, and page size context.
- Appending a new server page must keep absolute rank order; page-local ranks must be offset before entering client merge state.
- If a page is filled exactly by the last item of the current geo ring, the next cursor must advance to the next ring instead of ending the feed early.
- Bad or stale user-post cursors must be ignored safely, not surfaced as `500`.
- Topic page `hasMore` must be based on a real `nextCursor`, not on an over-fetched internal read limit.
- Stable tie-breakers are timestamp and post id.
- Client merge must preserve known higher counters for views, replies, likes, dislikes, and reactions.
- Forced home/feed refresh may replace home root order, but must preserve previously loaded branch children so back navigation and opened reply branches do not vanish.
- The manually verified Geo ring contour is protected: when the server feed is rebuilt in `geo` mode, Paris/city rows stay before region/country/global rows and sort only inside their ring. Startup `geo-session-touch-ready` plus the 6s/8s/10s boot retries and popover Geo/World switches use the same narrow feed rebuild core as manual refresh, but must not invoke broad Home/navigation actions that close branches or switch the user to the topic Home view.
- Popover Geo/World switches must programmatically perform the same feed-surface reset as pressing `Random`: active feed sort becomes `random`, server seed changes, stale cursor/order is discarded, and the first accepted server page belongs to the selected Geo/World mode.
- Startup Geo rebuilds happen inside the boot window even if the browser fires early programmatic scroll events; only user scroll after the boot window may stop an automatic rebuild.
- World mode must clear stale client Geo rank. A fresh server row with `__ql7ServerFeedMode: "world"` must delete any previous `__ql7GeoFeedRank`, and media/topic builders must not treat stale Geo rank as World server order.
- Media Feed must treat server rank as authoritative for every selected sort when the rank belongs to the active Geo/World mode; starred/local promotion is only allowed after server rank is absent.
- Media Feed reset on Geo/World or sort change must clear `serverVideoPosts`, cursor, `hasMore`, visible count, and the virtualization window before accepting a new page. Old rendered media cards must not stay visible as the "first" page of the new mode.
- While Media Feed is open, `data.posts`, `data.messages`, `data.feed`, and topic-embedded snapshot posts must not be passed into the media builder as feed candidates. The server media page is the only ordering source; local data may only enrich matching ids before rendering.
- Media Feed alignment after refresh/sort/Geo/World change must snap to the first rendered real post card inside `data-ql7-video-feed-grid="1"`, not to the technical video anchor, recommendation rail, ad slot, raw page top, or a later globally sorted card after a skipped Geo ring.
- Media Feed hard reset must not call raw `scrollTop = 0`; reset clears the virtualization window, then the accepted first server page schedules first-card snap retries so Play/open, manual refresh, sort selection, Geo/World switching, and startup all hide the header and align the first real media card.
- Media Feed keeps server media rows as the ordering authority, but local reaction overlay (`myReaction`, likes, dislikes) must be merged back into those rows so like/dislike buttons darken immediately and remain consistent with other forum branches.
- Video Feed reaction clicks dispatch `forum:post-reaction-overlay`; the media runtime may patch only the matching post id in the already rendered media rows and server-page cache. This must never reorder rows, rebuild Geo rings, reset cursors, or change the active Geo/World mode.
- Media Feed cursor loading is a protected working path: once the load-more sentinel enters view it must keep retrying the active cursor request while visible, so page 2+ loads without requiring the user to scroll backward and forward again. A visible spinner without an active/eligible cursor request is a regression.
- The forum virtual window owns scroll anchoring. Browser native scroll anchoring must stay disabled for the virtualized forum surface/cards/media/spinners so it cannot fight spacer compensation and cause reverse-scroll flicker while leaving the final scrollTop unchanged.
- `useForumSyncLoop` must not own separate startup Geo timers or direct `geo-session-touch-ready` feed reorders. Those create late force-apply replacements under the user and can tear virtualized media lists.
- Browser `focus`, `focus-visible`, and `visibilitychange` events must not silently rebuild or reorder the visible feed. They may recover media/profile shell state only; feed order changes require explicit server reasons such as startup geo-ready, Geo/World change, sort change, or user refresh.
- Topic list sort hierarchy is strict for `new`, `views`, `replies`, `reactions`, and `top`; server feed rank may override topic order only for `random`, where the server-provided random/Geo order is the selected sort.
- Home sort controls must update both feed preference and `topicSort`; changing the button label alone or only changing the feed preference is not a valid topic sort.

## Media Feed

- Media Feed is an all-media surface by default: `mediaKind=all` includes image, video, audio, iframe/QCast-compatible, and supported external media rows.
- Media Feed must request and append pages from `/api/forum/feed/media/page`; the local `allPosts` snapshot may enrich returned ids but must never append unmatched local media as if it were a server page.
- Geo and World Media Feed pages use the same ring, sort, seed, cursor, stale-response, and canonical-counter rules as the home feed.
- If a reset page is still loading, Media Feed may show the loading state, but it must not temporarily rebuild from the old full snapshot. Showing a wrong global order before the accepted Geo page is a contract violation.

## Deep Links And Threads

- Deep links and opened threads must keep server-provided post counters.
- Open topic root sorting uses canonical reply counts, not only loaded children.
- Loading spinners are preferred over showing incomplete local branches as final data.
