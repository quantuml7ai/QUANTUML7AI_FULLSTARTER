export function createRecommendationUser(index, overrides = {}) {
  const normalizedIndex = Number(index || 1)
  return {
    userId: `user-${normalizedIndex}`,
    canonicalAccountId: `user-${normalizedIndex}`,
    nickname: `User ${normalizedIndex}`,
    avatar: `/avatars/${normalizedIndex}.png`,
    followersCount: normalizedIndex * 111,
    isVip: false,
    ...overrides,
  }
}

export function createRecommendationUsers(count = 4, overrides = {}) {
  return Array.from({ length: count }, (_, idx) => createRecommendationUser(idx + 1, overrides))
}

export function createRecommendationRailState(users = createRecommendationUsers(3), overrides = {}) {
  return {
    users,
    loading: false,
    empty: !users.length,
    ...overrides,
  }
}

export function createRecommendationSlots(count = 3) {
  return Array.from({ length: count }, (_, idx) => ({
    type: 'recommendation_rail',
    key: `rec:${idx + 1}`,
    railIndex: idx,
  }))
}

export const recommendationTranslations = {
  forum_user_recommendations_title: 'Recommended creators',
  forum_user_recommendations_followers_label: 'Followers',
  forum_user_popover_stars: 'Stars',
  ui_stars: 'Stars',
  forum_user_recommendations_loading: 'Loading recommendations',
  forum_user_recommendations_empty: 'Recommendations will appear soon',
  forum_user_recommendations_aria: 'Recommended creators',
  forum_user_recommendations_scroll_left_aria: 'Scroll recommendations left',
  forum_user_recommendations_scroll_right_aria: 'Scroll recommendations right',
  forum_user_recommendations_user_action_aria: 'Open user posts',
  forum_search_empty: 'Nothing found',
  loading: 'Loading',
}

export function recommendationT(key) {
  return recommendationTranslations[key] || key || ''
}
