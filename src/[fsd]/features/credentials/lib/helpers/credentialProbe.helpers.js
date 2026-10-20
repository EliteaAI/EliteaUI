/**
 * The saved credential's uuid to send with a test-connection request, or undefined. It is sent only
 * for a credential that is saved (has a uuid) and whose form has no unsaved edits, so the backend
 * tests the stored credential; a new or edited form is tested from the typed values as before.
 *
 * @param {{ uuid?: string } | undefined} credentialDetails
 * @param {boolean} isDirty the form has unsaved edits
 * @returns {string | undefined}
 */
export const getProbeConfigurationUuid = (credentialDetails, isDirty) => {
  const uuid = credentialDetails?.uuid;
  return typeof uuid === 'string' && uuid && !isDirty ? uuid : undefined;
};
