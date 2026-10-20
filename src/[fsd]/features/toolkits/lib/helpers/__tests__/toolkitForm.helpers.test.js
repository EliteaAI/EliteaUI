import { describe, expect, it } from 'vitest';

import {
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
