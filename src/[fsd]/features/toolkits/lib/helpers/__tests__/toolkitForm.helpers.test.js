import { describe, expect, it } from 'vitest';

import {
  applicationToolValidationMessage,
  connectionNoticeOf,
  parseConnectionErrors,
  parseValidationErrors,
  parseValidationResponse,
} from '../toolkitForm.helpers';

const LOGIN_MESSAGE =
  'Outlook requires OAuth authorization. Please complete the OAuth flow to obtain an access token.';

// Python repr of the validator's connection error, including the quoted challenge header that breaks naive parsing
const PYTHON_TEXT_ERROR = {
  type: 'value_error',
  loc: [],
  msg:
    "Value error, {'__connection_errors__': [{'configuration_title': 'outlook_ui_test', 'configuration_type': 'outlook', " +
    `'message': '${LOGIN_MESSAGE}', 'requires_authorization': True, 'auth_metadata': {'www_authenticate': ` +
    '\'Bearer error="unauthorized_client", error_description="No access token was provided"\'}}]}',
};

const CONNECTION_ERROR = {
  configuration_title: 'outlook_ui_test',
  configuration_type: 'outlook',
  message: LOGIN_MESSAGE,
  requires_authorization: true,
};

describe('toolkit validation parsing', () => {
  it('loses the error when the Python text carries quoted challenge headers (why the JSON copy is used)', () => {
    expect(parseValidationErrors([PYTHON_TEXT_ERROR])).toEqual({});
  });

  it('keys structured connection errors by the credential field', () => {
    expect(parseConnectionErrors([CONNECTION_ERROR])).toEqual({ outlook_configuration: LOGIN_MESSAGE });
  });

  it('reads the structured connection errors of a validation response', () => {
    const data = { settings_errors: [PYTHON_TEXT_ERROR], connection_errors: [CONNECTION_ERROR] };
    expect(parseValidationResponse(data)).toEqual({ outlook_configuration: LOGIN_MESSAGE });
  });

  it('keeps other settings errors next to connection errors', () => {
    const data = {
      settings_errors: [{ type: 'missing', loc: ['body', 'name'], msg: 'Field required' }],
      connection_errors: [CONNECTION_ERROR],
    };
    expect(parseValidationResponse(data)).toEqual({
      name: 'Field required',
      outlook_configuration: LOGIN_MESSAGE,
    });
  });

  it('falls back to a generic message and ignores entries without a credential type', () => {
    expect(parseConnectionErrors([{ configuration_type: 'jira' }, { message: 'orphan' }, null])).toEqual({
      jira_configuration: 'Connection error',
    });
  });

  it('copes with empty or partial responses', () => {
    expect(parseValidationResponse(undefined)).toEqual({});
    expect(parseValidationResponse({})).toEqual({});
    expect(parseValidationResponse({ connection_errors: [] })).toEqual({});
  });
});

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

describe('JSON bodies with apostrophes (#7585)', () => {
  it('parses a JSON body whose message has an apostrophe', () => {
    const error = {
      ...SIGN_IN,
      message: "O'Brien's agent: Sign in to Dataverse to connect this credential.",
    };
    expect(parseValidationErrors([{ loc: ['tools', 149], msg: nestedMessage(error) }])).toEqual({
      dataverse_configuration: error.message,
    });
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

describe('agent or pipeline tool card message (#7585)', () => {
  const CYCLE = 'Value error, circular reference detected';
  const mapError = msg => (msg === CYCLE ? 'Cannot use "Child": circular reference' : msg);

  it("shows the sub-agent's connection error", () => {
    expect(applicationToolValidationMessage(nestedMessage(SIGN_IN), mapError, 'agent')).toBe(SIGN_IN.message);
  });

  it('keeps the mapped text for an error the mapper recognises', () => {
    expect(applicationToolValidationMessage(CYCLE, mapError, 'agent')).toBe(
      'Cannot use "Child": circular reference',
    );
  });

  it('keeps the generic text for anything else', () => {
    const misconfigured =
      "Value error, Application misconfiguration error for agent_name='Child' version_name='base'";
    expect(applicationToolValidationMessage(misconfigured, mapError, 'agent')).toBe(
      'Misconfiguration error found. Check the agent.',
    );
    expect(applicationToolValidationMessage(undefined, mapError, 'pipeline')).toBe(
      'Misconfiguration error found. Check the pipeline.',
    );
  });
});
