import { useCallback, useState } from 'react'

export default function useComposerEmojiState({ setText }) {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [emojiTab, setEmojiTab] = useState('emoji')

  const addEmoji = useCallback((entry) => {
    if (typeof entry === 'string' && entry.startsWith('/')) {
      if (entry.startsWith('/mozi/')) {
        setText('[MOZI:' + entry + ']')
      } else {
        setText('[VIP_EMOJI:' + entry + ']')
      }
      return
    }
    setText((value) => (value || '') + entry)
  }, [setText])

  return {
    emojiOpen,
    setEmojiOpen,
    emojiTab,
    setEmojiTab,
    addEmoji,
  }
}
