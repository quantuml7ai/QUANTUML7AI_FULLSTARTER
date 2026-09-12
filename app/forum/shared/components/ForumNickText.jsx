'use client'

import React from 'react'
import useForumNickBadgeFit from '../hooks/useForumNickBadgeFit'

const ForumNickText = React.forwardRef(function ForumNickText({ textValue = '', children, ...props }, forwardedRef) {
  const fitRef = useForumNickBadgeFit(textValue)
  const setRef = React.useCallback((node) => {
    fitRef(node)
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef && typeof forwardedRef === 'object') forwardedRef.current = node
  }, [fitRef, forwardedRef])
  return <span {...props} ref={setRef}>{children}</span>
})

export default ForumNickText
