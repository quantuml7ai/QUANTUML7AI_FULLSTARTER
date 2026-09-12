import { useCallback, useState } from 'react'

export default function useComposerEmojiState({ setText, setPendingSticker }) {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [emojiTab, setEmojiTab] = useState('emoji')

  const addEmoji = useCallback((entry) => {
    if (typeof entry === 'string' && entry.startsWith('/')) {
      setPendingSticker?.({
        src: entry,
        kind: entry.startsWith('/mozi/') ? 'mozi' : 'vip',
      })
      return
    }
    setText((value) => (value || '') + entry)
  }, [setPendingSticker, setText])

  return {
    emojiOpen,
    setEmojiOpen,
    emojiTab,
    setEmojiTab,
    addEmoji,
  }
}
