import { describe, expect, it } from 'vitest';

import { SCOPED_TOKEN_MAX_TTL_DAYS } from '../../constants/tokenScope.constants';
import { expiryDays, scopeError, scopeLabel, scopePayload } from '../tokenScope.helpers';

describe('tokenScope.helpers (#7336)', () => {
  it('counts the expiry in days, "never" as no end', () => {
    expect(expiryDays('days', 30)).toBe(30);
    expect(expiryDays('weeks', 13)).toBe(91);
    expect(expiryDays('hours', 48)).toBe(2);
    expect(expiryDays('never', 1)).toBe(Infinity);
  });

  it('refuses a scope without projects, operations or a bounded expiry', () => {
    const ok = { projects: [5], operations: ['run'], measure: 'days', expiration: SCOPED_TOKEN_MAX_TTL_DAYS };
    expect(scopeError(ok)).toBe('');
    expect(scopeError({ ...ok, projects: [] })).toMatch(/project/);
    expect(scopeError({ ...ok, operations: [] })).toMatch(/operation/);
    expect(scopeError({ ...ok, measure: 'weeks', expiration: 13 })).toMatch(/90 days/);
    expect(scopeError({ ...ok, measure: 'never' })).toMatch(/90 days/);
  });

  it('sends the scope only for a restricted token, operations in their canonical order', () => {
    expect(scopePayload({ restricted: false, projects: [5], operations: ['run'] })).toEqual({});
    expect(scopePayload({ restricted: true, projects: [5, 1], operations: ['build', 'run'] })).toEqual({
      scope_projects: [5, 1],
      scope_operations: ['run', 'build'],
    });
  });

  it('labels a scoped and a legacy token', () => {
    const scoped = { expires: '2026-12-01T00:00', scope_projects: [5], scope_operations: ['run', 'build'] };
    expect(scopeLabel(scoped)).toBe('1 project · run, build');
    expect(scopeLabel({ ...scoped, scope_projects: [1, 5] })).toBe('2 projects · run, build');
    expect(scopeLabel({ expires: null, scope_projects: null, scope_operations: null })).toBe(
      'All projects · legacy',
    );
    expect(scopeLabel({ ...scoped, expires: null })).toBe('All projects · legacy');
    expect(scopeLabel({ name: 'old' })).toBe('All projects · legacy');
  });
});
