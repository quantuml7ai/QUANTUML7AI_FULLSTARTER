import { describe, expect, it } from 'vitest'
import {
  dedupeDmDialogs,
  dialogMatchesUser,
  resolveDmDialogPeerId,
} from '../../../../../../app/forum/features/dm/utils/dmLoaders.js'

describe('dmLoaders dialog identity helpers', () => {
  it('deduplicates the same peer across raw and canonical dialog variants', () => {
    const dialogs = [
      {
        userId: 'raw-peer',
        lastMessage: {
          id: 'm-1',
          ts: 100,
          from: 'raw-peer',
          fromCanonical: 'canon-peer',
          to: 'me',
          toCanonical: 'me',
        },
      },
      {
        userId: 'canon-peer',
        lastMessage: {
          id: 'm-2',
          ts: 200,
          from: 'me',
          fromCanonical: 'me',
          to: 'canon-peer',
          toCanonical: 'canon-peer',
        },
      },
      {
        userId: 'other-peer',
        lastMessage: {
          id: 'm-3',
          ts: 150,
          from: 'other-peer',
          fromCanonical: 'other-peer',
          to: 'me',
          toCanonical: 'me',
        },
      },
    ]

    const result = dedupeDmDialogs(dialogs, 'me')

    expect(result).toHaveLength(2)
    expect(result[0].userId).toBe('canon-peer')
    expect(result[0].lastMessage.id).toBe('m-2')
    expect(result[1].userId).toBe('other-peer')
  })

  it('matches dialogs to the same peer through canonical message fields', () => {
    const dialog = {
      userId: 'raw-peer',
      lastMessage: {
        id: 'm-1',
        ts: 100,
        from: 'raw-peer',
        fromCanonical: 'canon-peer',
        to: 'me',
        toCanonical: 'me',
      },
    }

    expect(resolveDmDialogPeerId(dialog, 'me')).toBe('canon-peer')
    expect(dialogMatchesUser(dialog, 'canon-peer', 'me')).toBe(true)
    expect(dialogMatchesUser(dialog, 'other-peer', 'me')).toBe(false)
  })
})
