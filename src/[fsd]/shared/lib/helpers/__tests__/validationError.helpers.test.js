import { describe, expect, it } from 'vitest';

import { connectionNoticeOf } from '../validationError.helpers';

const SIGN_IN = {
  configuration_title: 'repro_dataverse',
  configuration_type: 'dataverse',
  message: 'Dataverse child: Sign in to Dataverse to connect this credential.',
  requires_authorization: true,
  auth_metadata: { server_url: 'https://login.example.test/tenant' },
};
const WRONG_SECRET = {
  configuration_title: 'repro_jira',
  configuration_type: 'jira',
  message: 'Dataverse child: The client secret is wrong or expired.',
  requires_authorization: false,
  auth_metadata: null,
};
const nestedMessage = (...errors) => `Value error, ${JSON.stringify({ __connection_errors__: errors })}`;
const toolkitEntry = (message, extra = {}) => ({
  type: 'connection_error',
  msg: message,
  loc: ['repro_dataverse'],
  requires_authorization: true,
  ...extra,
});

describe('connection notice of a participant (#7585)', () => {
  it('reads the message of a sub-agent whose only errors are sign-ins', () => {
    expect(connectionNoticeOf([], [nestedMessage(SIGN_IN)])).toEqual({
      message: SIGN_IN.message,
      requiresAuthorization: true,
    });
  });

  it('needs a sign-in only when every connection error of every entry does', () => {
    expect(connectionNoticeOf([], [nestedMessage(SIGN_IN, SIGN_IN)]).requiresAuthorization).toBe(true);
    expect(connectionNoticeOf([], [nestedMessage(SIGN_IN, WRONG_SECRET)]).requiresAuthorization).toBe(false);
    expect(
      connectionNoticeOf([], [nestedMessage(SIGN_IN), nestedMessage(WRONG_SECRET)]).requiresAuthorization,
    ).toBe(false);
  });

  it('reads a toolkit participant whose only error is a sign-in', () => {
    expect(
      connectionNoticeOf([toolkitEntry('Sign in to Dataverse to connect this credential.')], []),
    ).toEqual({
      message: 'Sign in to Dataverse to connect this credential.',
      requiresAuthorization: true,
    });
    expect(
      connectionNoticeOf(
        [toolkitEntry('The client secret is wrong or expired.', { requires_authorization: false })],
        [],
      ).requiresAuthorization,
    ).toBe(false);
  });

  it('is no notice when any error is not a connection error', () => {
    const settingsError = { type: 'missing', loc: ['settings', 'url'], msg: 'Field required' };
    const credentialNotFound = `Value error, ${JSON.stringify({ error_type: 'credential_not_found' })}`;
    expect(connectionNoticeOf([toolkitEntry('Sign in…'), settingsError], [])).toBeNull();
    expect(connectionNoticeOf([], [nestedMessage(SIGN_IN), credentialNotFound])).toBeNull();
    expect(connectionNoticeOf([], [credentialNotFound])).toBeNull();
    expect(
      connectionNoticeOf(
        [],
        ["Value error, Application misconfiguration error for agent_name='Bicycle' version_name='base'"],
      ),
    ).toBeNull();
  });

  it('is no notice for a governed refusal, which carries its own code', () => {
    expect(
      connectionNoticeOf([toolkitEntry('Refused.', { code: 'DENIED_ASSERTION_UNAVAILABLE' })], []),
    ).toBeNull();
    expect(
      connectionNoticeOf([], [`Value error, ${JSON.stringify({ code: 'DENIED_X', error: 'Refused.' })}`]),
    ).toBeNull();
  });

  it('is no notice for joined sub-agent messages or nothing at all', () => {
    expect(connectionNoticeOf([], [`${nestedMessage(SIGN_IN)}; ${nestedMessage(SIGN_IN)}`])).toBeNull();
    expect(connectionNoticeOf([], [])).toBeNull();
    expect(connectionNoticeOf([], [nestedMessage()])).toBeNull();
  });

  it('falls back to a generic text when a connection error has none', () => {
    expect(connectionNoticeOf([], [nestedMessage({ ...SIGN_IN, message: '' })]).message).toBe(
      'Connection error',
    );
  });
});

describe('mixed connection errors name what blocks the chat (#7585 review)', () => {
  it('names the error a sign-in will not clear', () => {
    expect(connectionNoticeOf([], [nestedMessage(SIGN_IN, WRONG_SECRET)])).toEqual({
      message: WRONG_SECRET.message,
      requiresAuthorization: false,
    });
    expect(connectionNoticeOf([], [nestedMessage(WRONG_SECRET, SIGN_IN)]).message).toBe(WRONG_SECRET.message);
  });
});
