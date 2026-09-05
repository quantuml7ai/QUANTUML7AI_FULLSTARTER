export const QL7_SUPPORT_CONTACT_PRIVACY_VERSION = '5.1.1'

const NO_EXTERNAL_CONTACT_RETENTION = Object.freeze({
  persistOnlyWithConsent: false,
  persistRawContacts: false,
  deleteOnAccountDeletion: true,
  userProjection: 'none',
  operatorProjection: 'none',
})

export const QL7_SUPPORT_CONTACT_RETENTION = Object.freeze({
  operator_handoff: Object.freeze({
    persistOnlyWithConsent: true,
    deleteOnAccountDeletion: true,
    userProjection: 'masked',
    operatorProjection: 'purpose_limited',
  }),
  refused: NO_EXTERNAL_CONTACT_RETENTION,
  dm_only: NO_EXTERNAL_CONTACT_RETENTION,
})

/**
 * Returns the most restrictive registered policy for the requested contact purpose.
 * Unknown values never create a new retention class; they remain in the approved handoff
 * policy whose persistence is still conditioned on the consent owner.
 */
export function getQl7SupportContactRetentionPolicy(purpose = 'operator_handoff') {
  const key = String(purpose || '').trim()
  return QL7_SUPPORT_CONTACT_RETENTION[key] || QL7_SUPPORT_CONTACT_RETENTION.operator_handoff
}
