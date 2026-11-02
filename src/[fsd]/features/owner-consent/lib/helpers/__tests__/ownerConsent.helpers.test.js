import { describe, expect, it } from 'vitest';

import * as OwnerConsentHelpers from '../ownerConsent.helpers';

const NOW = new Date('2026-11-02T12:00:00Z').getTime();

describe('ownerConsent.helpers (EL-7337)', () => {
  it('finds the owner_delegated live mandate of the version only', () => {
    const rows = [
      { id: 'a', version: { id: 70 }, state: 'revoked', identity_source: 'owner_delegated' },
      { id: 'b', version: { id: 71 }, state: 'active', identity_source: 'owner_delegated' },
      { id: 'c', version: { id: 70 }, state: 'active', identity_source: null },
      { id: 'd', version: { id: 70 }, state: 'pending_approval', identity_source: 'owner_delegated' },
    ];
    expect(OwnerConsentHelpers.mandateForVersion(rows, 70)?.id).toBe('d');
    expect(OwnerConsentHelpers.mandateForVersion(rows, 72)).toBeNull();
    expect(OwnerConsentHelpers.mandateForVersion(rows, null)).toBeNull();
    expect(OwnerConsentHelpers.mandateForVersion(undefined, 70)).toBeNull();
  });

  it('lets only a restricted token that has not expired hold a consent', () => {
    const scoped = { expires: '2026-12-01T00:00:00', scope_projects: [5], scope_operations: ['run'] };
    expect(OwnerConsentHelpers.tokenCanConsent(scoped, NOW)).toBe(true);
    expect(OwnerConsentHelpers.tokenCanConsent({ ...scoped, expires: '2026-11-01T00:00:00' }, NOW)).toBe(
      false,
    );
    expect(OwnerConsentHelpers.tokenCanConsent({ ...scoped, scope_projects: null }, NOW)).toBe(false);
    expect(OwnerConsentHelpers.tokenCanConsent({ ...scoped, scope_operations: [] }, NOW)).toBe(false);
    expect(OwnerConsentHelpers.tokenCanConsent({ ...scoped, expires: null }, NOW)).toBe(false);
  });

  it('says that signing out does not end the consent', () => {
    expect(OwnerConsentHelpers.CONSENT_GIVEN_TEXT).toMatch(/Signing out does not end it; withdraw here/);
  });

  it('names the covered credentials and sends only picked candidates', () => {
    const candidates = [
      { project_id: 5, credential_ref: 'a', title: 'one' },
      { project_id: 6, credential_ref: 'b', title: 'two' },
    ];
    expect(OwnerConsentHelpers.pickedCredentials(candidates, ['6:b', '9:z'])).toEqual([
      { project_id: 6, credential_ref: 'b' },
    ]);
    expect(OwnerConsentHelpers.coveredText(candidates)).toMatch(/^Microsoft sign-in: one, two\./);
  });
});
