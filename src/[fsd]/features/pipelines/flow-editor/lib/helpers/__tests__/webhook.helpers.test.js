import { describe, expect, it } from 'vitest';

import { GITLAB_SIGNING_KEY_MIN_BYTES } from '../../constants/webhook.constants';
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

  // A partial paste can still be valid base64. Accepting it stores a key that decodes fine and then
  // fails every signature check, so the failure surfaces as "webhook silently never fires".
  it('rejects a decodable but truncated key', () => {
    expect(getGitlabSigningTokenError('whsec_AA')).toBe(
      'Signing token looks truncated — check that the whole value was pasted',
    );
    expect(getGitlabSigningTokenError(`whsec_${btoa('too-short')}`)).toBe(
      'Signing token looks truncated — check that the whole value was pasted',
    );
  });

  it('accepts a key at the minimum length, and rejects one byte below it', () => {
    expect(getGitlabSigningTokenError(`whsec_${btoa('x'.repeat(GITLAB_SIGNING_KEY_MIN_BYTES))}`)).toBeNull();
    expect(getGitlabSigningTokenError(`whsec_${btoa('x'.repeat(GITLAB_SIGNING_KEY_MIN_BYTES - 1))}`)).toBe(
      'Signing token looks truncated — check that the whole value was pasted',
    );
  });

  // The bound is a floor, not GitLab's exact size, so an unexpectedly long key must still pass.
  it('accepts a key longer than the minimum', () => {
    expect(getGitlabSigningTokenError(`whsec_${btoa('y'.repeat(64))}`)).toBeNull();
  });
});
