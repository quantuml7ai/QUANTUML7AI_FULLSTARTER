import { useCallback, useEffect, useState } from 'react'

export default function useAboutEditor({
  idShown,
  profileBump,
  safeReadProfile,
  normalizeAboutForSave,
  mergeProfileCache,
  writeProfileAlias,
}) {
  const [aboutEditing, setAboutEditing] = useState(false)
  const [aboutDraft, setAboutDraft] = useState('')
  const [aboutSaved, setAboutSaved] = useState('')
  const [aboutSaving, setAboutSaving] = useState(false)

  useEffect(() => {
    const cached = safeReadProfile(idShown)?.about || ''
    setAboutSaved(cached)
    if (!aboutEditing) setAboutDraft(cached)
  }, [idShown, profileBump, aboutEditing, safeReadProfile])

  const startAboutEdit = useCallback(() => {
    setAboutDraft(aboutSaved || '')
    setAboutEditing(true)
  }, [aboutSaved])

  const cancelAboutEdit = useCallback(() => {
    setAboutDraft(aboutSaved || '')
    setAboutEditing(false)
  }, [aboutSaved])

  const saveAbout = useCallback(async () => {
    if (!idShown || aboutSaving) return
    const next = normalizeAboutForSave(aboutDraft)
    const prev = aboutSaved
    if (next === normalizeAboutForSave(prev)) {
      setAboutEditing(false)
      return
    }

    setAboutSaving(true)
    mergeProfileCache(idShown, { about: next, updatedAt: Date.now() })
    setAboutSaved(next)

    try {
      const response = await fetch('/api/profile/set-about', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          about: next,
          accountId: idShown,
          asherId: idShown,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'save_failed')

      const savedAccountId = String(payload.accountId || idShown).trim()
      writeProfileAlias(idShown, savedAccountId)
      mergeProfileCache(savedAccountId, { about: payload.about || next, updatedAt: Date.now() })
      setAboutSaved(payload.about || next)
      setAboutEditing(false)
    } catch {
      mergeProfileCache(idShown, { about: prev, updatedAt: Date.now() })
      setAboutSaved(prev)
    } finally {
      setAboutSaving(false)
    }
  }, [
    aboutDraft,
    aboutSaved,
    aboutSaving,
    idShown,
    mergeProfileCache,
    normalizeAboutForSave,
    writeProfileAlias,
  ])

  return {
    aboutEditing,
    aboutDraft,
    aboutSaved,
    aboutSaving,
    setAboutDraft,
    startAboutEdit,
    cancelAboutEdit,
    saveAbout,
  }
}
