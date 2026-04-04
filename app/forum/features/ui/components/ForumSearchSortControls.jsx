import Image from 'next/image'

import { cls } from '../../../shared/utils/classnames'
import { isVercelStorageUrl } from '../../media/utils/mediaLinks'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import QuestLaunchIcon from '../../quests/components/QuestLaunchIcon'
import ForumControlNavIcon from './ForumControlNavIcon'

function SearchResultFallbackIcon({ kind }) {
  if (kind === 'video') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M4 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 9.5l4 2.5-4 2.5z" fill="currentColor" />
      </svg>
    )
  }
  if (kind === 'audio') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M9 17a2.6 2.6 0 1 1-2.6-2.6A2.6 2.6 0 0 1 9 17zm8-2.8a2.6 2.6 0 1 1-2.6-2.6A2.6 2.6 0 0 1 17 14.2z" fill="currentColor" />
        <path d="M9 17V6.4l8-1.6v9.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 2h8l4 4v16H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 2v4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function formatSearchTs(ts) {
  const n = Number(ts || 0)
  if (!Number.isFinite(n) || n <= 0) return ''
  try {
    return new Date(n).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function ForumSearchSortControls({
  t,
  q,
  setQ,
  openOnly,
  drop,
  setDrop,
  results,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  getScrollEl,
  data,
  pushNavState,
  setTopicFilterId,
  setSel,
  setThreadRoot,
  openThreadForPost,
  sortOpen,
  setSortOpen,
  videoFeedOpen,
  setVideoFeedUserSortLocked,
  setFeedSort,
  sel,
  forcePostSort,
  setPostSort,
  setTopicSort,
  starMode,
  setStarMode,
  questEnabled,
  questBtnClass,
  openQuests,
}) {
  return (
    <div className="search">
        <div className="searchInputWrap">
          <input
            id="forum-search-input"
            name="forumSearch"
            className="searchInput"
            value={q}
            onChange={(e) => { setQ(e.target.value); openOnly('search') }}
            onFocus={() => openOnly('search')}
            placeholder={t('forum_search_ph')}
          />
          {drop && q.trim() && (
            <div className="searchDrop" onMouseLeave={() => setDrop(false)}>
              {results.length === 0 && <div className="meta px-1 py-1">{t('forum_search_empty')}</div>}
              {results.map((r) => (
                <button
                  key={`${r.k}:${r.id}`}
                  id={`search_${r.k}_${r.id}`}
                  className="item w-full text-left mb-1 searchResultItem"
                  onClick={() => {
                    setDrop(false)
                    setQ('')
                    try { headAutoOpenRef.current = false } catch {}
                    try { setHeadPinned(false) } catch {}
                    try { setHeadHidden(true) } catch {}
                    setTimeout(() => {
                      try {
                        const sc = getScrollEl?.()
                        if (sc && sc.scrollHeight > sc.clientHeight + 1) sc.scrollTop = 0
                        else window.scrollTo({ top: 0, behavior: 'auto' })
                      } catch {}
                    }, 0)
                    if (r.k === 't') {
                      const tt = (data.topics || []).find((x) => x.id === r.id)
                      if (tt) {
                        pushNavState(`search_${r.k}_${r.id}`)
                        setTopicFilterId(tt.id)
                        setSel(tt)
                        setThreadRoot(null)
                      }
                    } else {
                      const p = (data.posts || []).find((x) => x.id === r.id)
                      if (p) {
                        const tt = (data.topics || []).find((x) => x.id === p.topicId)
                        if (tt) {
                          setTopicFilterId(tt.id)
                          openThreadForPost(p, { entryId: `search_${r.k}_${r.id}` })
                        }
                      }
                    }
                  }}
                >
                  {r.media && (
                    <span
                      className={cls('searchResultMedia', `searchResultMedia-${r.media.kind}`)}
                      data-kind={r.media.kind}
                    >
                      {(r.media.kind === 'image' || r.media.kind === 'sticker') ? (
                        <Image
                          src={r.media.url}
                          alt=""
                          width={56}
                          height={56}
                          unoptimized
                          loading="lazy"
                          className="searchResultThumb"
                        />
                      ) : (r.media.kind === 'video' && r.media.thumb) ? (
                        // eslint-disable-next-line @next/next/no-img-element -- dynamic remote video thumbs may come from arbitrary hosts not configured in next/image.
                        <img
                          src={r.media.thumb}
                          alt=""
                          loading="lazy"
                          className="searchResultThumb"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="searchResultIcon" aria-hidden>
                          <SearchResultFallbackIcon kind={r.media.kind} />
                        </span>
                      )}
                      {r.media.kind === 'video' && (
                        <span className="searchResultBadge" aria-hidden>{String(r.media.label || 'Video')}</span>
                      )}
                    </span>
                  )}
                  {r.k === 't' ? (
                    <span className="searchResultContent">
                      <span className="searchResultTitle">
                        <span className="searchResultKind">{t('forum_search_kind_topic')}</span>
                        <span className="searchResultTitleText">{r.title}</span>
                      </span>
                      {r.desc && <span className="searchResultText">{r.desc}</span>}
                    </span>
                  ) : (
                    <span className="searchResultContent">
                      <span className="searchResultTitle searchResultTitle--post">
                        <span className="searchResultAuthor">
                          <span className="searchResultAuthorAva">
                            <AvatarEmoji userId={r.userId} pIcon={r.icon} />
                          </span>
                          <span className="searchResultAuthorNick" translate="no">{String(r.nick || r.userId || '')}</span>
                        </span>
                        <span className="searchResultDate">{formatSearchTs(r.ts)}</span>
                      </span>
                      <span className="searchResultTitle">
                        <span className="searchResultKind">{t('forum_search_kind_post')}</span>
                        {!!r.topicTitle && <span className="searchResultTopic">{r.topicTitle}</span>}
                      </span>
                      {r.media?.kind === 'video' && (
                        <span className="searchResultMeta">
                          {String(r.media.label || 'Video')}
                          {r.media.short && !isVercelStorageUrl(r.media.url)
                            ? ` / ${String(r.media.short)}`
                            : ''}
                        </span>
                      )}
                      {!!r.text && <span className="searchResultText">{r.text}</span>}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={cls('iconBtn forumControlBtn', drop && 'forumControlBtn--active')}
          aria-label={t('forum_search')}
          onClick={() => openOnly(drop ? null : 'search')}
        >
          <ForumControlNavIcon kind="search" active={!!drop} size={20} />
        </button>
        <button
          className={cls('iconBtn forumControlBtn', sortOpen && 'forumControlBtn--active')}
          title={t('forum_sort')}
          onClick={() => openOnly(sortOpen ? null : 'sort')}
        >
          <ForumControlNavIcon kind="sort" active={!!sortOpen} size={20} />
        </button>
        <QuestLaunchIcon
          t={t}
          q={q}
          questEnabled={questEnabled}
          questBtnClass={questBtnClass}
          openQuests={openQuests}
        />
        {sortOpen && (
          <div className="sortDrop" onMouseLeave={() => setSortOpen(false)}>
            {[
              ['new', t('forum_sort_new')],
              ['top', t('forum_sort_top')],
              ['likes', t('forum_sort_likes')],
              ['views', t('forum_sort_views')],
              ['replies', t('forum_sort_replies')],
            ].map(([k, txt]) => (
              <button
                key={k}
                className="item w-full text-left mb-1"
                onClick={() => {
                  if (videoFeedOpen) {
                    setVideoFeedUserSortLocked(true)
                    setFeedSort(k)
                  } else if (sel || forcePostSort) setPostSort(k)
                  else setTopicSort(k)
                  setSortOpen(false)
                }}
              >
                {txt}
              </button>
            ))}
            <button
              type="button"
              className={`starModeBtn ${starMode ? 'on' : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStarMode((v) => !v) }}
              title={t('forum_star_mode_title')}
              aria-pressed={starMode}
              aria-label={t('forum_star_mode')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path className="starPath" d="M12 2.6l2.9 6.2 6.8.6-5.1 4.4 1.6 6.6L12 16.9 5.8 20.4l1.6-6.6-5.1-4.4 6.8-.6L12 2.6Z" />
              </svg>
            </button>
          </div>
        )}
    </div>
  )
}
