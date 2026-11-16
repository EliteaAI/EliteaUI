// Scopes that need Entra admin consent are flagged in the credential schema; the runtime's sign-in prompt
// lists the requested ones as provided_settings.admin_consent_scopes. Nothing here names a scope.

// Microsoft refuses a sign-in this way when a requested permission has no (admin) consent in the tenant
const CONSENT_REFUSAL = /AADSTS(65001|90094|900941|90099)\b|consent_required|admin (consent|approval)/i;

const joinScopes = scopes =>
  scopes.length > 1 ? `${scopes.slice(0, -1).join(', ')} and ${scopes.at(-1)}` : scopes[0];

export const getAdminConsentScopes = providedSettings =>
  Array.isArray(providedSettings?.admin_consent_scopes)
    ? providedSettings.admin_consent_scopes.filter(Boolean)
    : [];

// Shown before signing in: the sign-in fails unless an Entra admin has granted these
export const adminConsentNotice = scopes =>
  scopes.length
    ? `${joinScopes(scopes)} ${scopes.length > 1 ? 'need' : 'needs'} admin consent in your Entra tenant. ` +
      'Without it Microsoft refuses the sign-in.'
    : '';

// A clear message for a sign-in refused for missing consent; null for any other error
export const adminConsentErrorMessage = (errorMessage, scopes) => {
  if (!scopes.length || !CONSENT_REFUSAL.test(errorMessage || '')) return null;
  return (
    `${joinScopes(scopes)} ${scopes.length > 1 ? 'need' : 'needs'} admin consent in your Entra tenant. ` +
    `Ask your Entra admin to grant ${scopes.length > 1 ? 'them' : 'it'}, or untick ${
      scopes.length > 1 ? 'them' : 'it'
    } in the credential.`
  );
};
