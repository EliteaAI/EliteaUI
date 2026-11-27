import { describe, expect, it } from 'vitest';

import { hasAdminRole, isSelfAdmin } from '../users.helpers';

describe('hasAdminRole', () => {
  it('detects the admin role regardless of case', () => {
    expect(hasAdminRole({ roles: ['viewer', 'Admin'] })).toBe(true);
  });

  it('is false without the admin role or without roles', () => {
    expect(hasAdminRole({ roles: ['editor'] })).toBe(false);
    expect(hasAdminRole({})).toBe(false);
    expect(hasAdminRole(undefined)).toBe(false);
  });
});

describe('isSelfAdmin', () => {
  it('is true only for the current user holding the admin role', () => {
    expect(isSelfAdmin({ id: 5, roles: ['admin'] }, 5)).toBe(true);
    expect(isSelfAdmin({ id: 5, roles: ['admin'] }, '5')).toBe(true);
  });

  it('is false for another admin', () => {
    expect(isSelfAdmin({ id: 6, roles: ['admin'] }, 5)).toBe(false);
  });

  it('is false for the current user without the admin role', () => {
    expect(isSelfAdmin({ id: 5, roles: ['editor'] }, 5)).toBe(false);
  });

  it('is false while the current user is unknown', () => {
    expect(isSelfAdmin({ id: 5, roles: ['admin'] }, null)).toBe(false);
    expect(isSelfAdmin({ id: 5, roles: ['admin'] }, undefined)).toBe(false);
  });
});
