export default function buildActionClusterProps({
  t,
  openInboxGlobal,
  inboxOpen,
  mounted,
  unreadCount,
  dmUnreadCount,
  formatCount,
  videoFeedOpen,
  closeVideoFeed,
  setInboxOpen,
  setReplyTo,
  setThreadRoot,
  refreshVideoFeedWithoutReload,
  openVideoFeed,
  goHome,
  canGlobalBack,
  handleGlobalBack,
  createTopic,
  setSel,
}) {
  const mainActionClusterProps = {
    t,
    openInboxGlobal,
    inboxOpen,
    mounted,
    unreadCount,
    dmUnreadCount,
    formatCount,
    videoFeedOpen,
    closeVideoFeed,
    setInboxOpen,
    setReplyTo,
    setThreadRoot,
    refreshVideoFeedWithoutReload,
    openVideoFeed,
    goHome,
    canGlobalBack,
    handleGlobalBack,
    createTopic,
  }

  const threadActionClusterProps = {
    ...mainActionClusterProps,
    setSel,
  }

  return {
    mainActionClusterProps,
    threadActionClusterProps,
  }
}
