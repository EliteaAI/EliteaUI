import { describe, expect, it } from 'vitest';

import { getGitlabSigningTokenError } from '../webhook.helpers';

// GitLab shows the signing token exactly once, so the whole value is hand-copied. These checks
// catch the two things that go wrong when copying by hand: grabbing the wrong field, and
// grabbing only part of the token.
describe('getGitlabSigningTokenError', () => {
  const validToken = `whsec_${btoa('a-32-byte-signing-key-goes-here!')}`;

  it('accepts a well-formed token', () => {
    expect(getGitlabSigningTokenError(validToken)).toBeNull();
  });

  it('accepts a token with surrounding whitespace from a copy-paste', () => {
    expect(getGitlabSigningTokenError(`  ${validToken}\n`)).toBeNull();
  });

  it('rejects an empty value', () => {
    expect(getGitlabSigningTokenError('')).toBe('Signing token is required');
    expect(getGitlabSigningTokenError('   ')).toBe('Signing token is required');
    expect(getGitlabSigningTokenError(undefined)).toBe('Signing token is required');
  });

  it('rejects a value without the whsec_ prefix', () => {
    expect(getGitlabSigningTokenError(btoa('some-key'))).toBe('Signing token must start with "whsec_"');
  });

  it('rejects a bare prefix with no key', () => {
    expect(getGitlabSigningTokenError('whsec_')).toBe('Signing token is missing its key');
  });

  it('rejects a key that is not valid base64', () => {
    expect(getGitlabSigningTokenError('whsec_not base64!!')).toBe(
      'Signing token is not valid base64 — check that the whole value was pasted',
    );
  });
});
