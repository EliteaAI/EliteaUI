import { describe, expect, it } from 'vitest';

import { McpAdminConsentHelpers } from '@/[fsd]/features/mcp/lib/helpers';

const { adminConsentErrorMessage, adminConsentNotice, getAdminConsentScopes } = McpAdminConsentHelpers;

describe('admin consent helpers (#7542)', () => {
  it('reads the requested admin-consent scopes from the sign-in prompt', () => {
    expect(getAdminConsentScopes({ admin_consent_scopes: ['A.Read.All', ''] })).toEqual(['A.Read.All']);
    expect(getAdminConsentScopes({ scopes: ['A.Read'] })).toEqual([]);
    expect(getAdminConsentScopes(undefined)).toEqual([]);
  });

  it('builds a notice only when such scopes are requested', () => {
    expect(adminConsentNotice(['A.Read.All'])).toBe(
      'A.Read.All needs admin consent in your Entra tenant. Without it Microsoft refuses the sign-in.',
    );
    expect(adminConsentNotice(['A.Read.All', 'B.Read.All'])).toMatch(/^A\.Read\.All and B\.Read\.All need /);
    expect(adminConsentNotice([])).toBe('');
  });

  it.each([
    'AADSTS65001: The user or administrator has not consented to use the application',
    'AADSTS90094: Admin consent is required for the permissions requested',
    'consent_required',
    'Need admin approval',
  ])('turns a consent refusal into a clear message: %s', error => {
    expect(adminConsentErrorMessage(error, ['A.Read.All'])).toBe(
      'A.Read.All needs admin consent in your Entra tenant. Ask your Entra admin to grant it, or untick it in the credential.',
    );
  });

  it('leaves other errors and sign-ins without such scopes alone', () => {
    expect(adminConsentErrorMessage('Authorization window was closed', ['A.Read.All'])).toBeNull();
    expect(adminConsentErrorMessage('AADSTS65001: not consented', [])).toBeNull();
  });
});
