import buildActionClusterProps from './propBundles/buildActionClusterProps'
import buildComposerCoreProps from './propBundles/buildComposerCoreProps'
import buildForumHeaderPanelProps from './propBundles/buildForumHeaderPanelProps'
import buildInboxPaneProps from './propBundles/buildInboxPaneProps'
import buildSearchSortControlsProps from './propBundles/buildSearchSortControlsProps'
import buildThreadRepliesPaneProps from './propBundles/buildThreadRepliesPaneProps'
import buildTopicsSwitchProps from './propBundles/buildTopicsSwitchProps'

export default function buildForumRootPropBundles(args) {
  const searchSortControlsProps = buildSearchSortControlsProps(args)

  const forumHeaderPanelProps = buildForumHeaderPanelProps({
    ...args,
    searchSortProps: searchSortControlsProps,
  })

  const { mainActionClusterProps, threadActionClusterProps } = buildActionClusterProps(args)

  const inboxPaneProps = buildInboxPaneProps(args)

  const topicsSwitchProps = buildTopicsSwitchProps({
    ...args,
    inboxPaneProps,
    userRecommendationsRail: args.userRecommendationsRail,
    userRecommendationsRuntime: args.userRecommendationsRuntime,
    onOpenUserPosts: args.onOpenUserPosts,
  })

  const threadRepliesPaneProps = buildThreadRepliesPaneProps(args)

  const composerCoreProps = buildComposerCoreProps(args)

  return {
    searchSortControlsProps,
    forumHeaderPanelProps,
    mainActionClusterProps,
    threadActionClusterProps,
    inboxPaneProps,
    topicsSwitchProps,
    threadRepliesPaneProps,
    composerCoreProps,
  }
}
