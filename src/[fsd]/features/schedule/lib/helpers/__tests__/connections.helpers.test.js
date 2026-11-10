import { describe, expect, it } from 'vitest';

import { CONNECTIONS_CHECK_STATUS } from '../../constants';
import {
  allConnectionsOk,
  canSignInHere,
  connectionLabel,
  connectionReason,
  connectionsBlockSave,
  connectionsHint,
} from '../connections.helpers';

// #7401: the rows of the Connections check, one per toolkit
const OK = { toolkit: 'Mail', status: 'ok' };
const SIGN_IN = {
  toolkit: 'Mail',
  status: 'sign_in_required',
  credential_title: 'team_outlook',
  credential_type: 'outlook',
  reason: 'no saved login: sign in on the credential',
};
const REMOTE = { toolkit: 'Remote', status: 'unsupported', reason: 'Webhooks cannot wait for a sign-in' };
const answered = rows => ({ status: CONNECTIONS_CHECK_STATUS.ANSWERED, rows });

describe('connections helpers', () => {
  it('is all OK only when every row is', () => {
    expect(allConnectionsOk([OK, OK])).toBe(true);
    expect(allConnectionsOk([OK, SIGN_IN])).toBe(false);
    expect(allConnectionsOk(undefined)).toBe(false);
  });

  it('holds a webhook save until the check answered with every row OK', () => {
    expect(connectionsBlockSave(true, answered([OK]))).toBe(false);
    expect(connectionsBlockSave(true, answered([OK, REMOTE]))).toBe(true);
    expect(connectionsBlockSave(true, { status: CONNECTIONS_CHECK_STATUS.CHECKING, rows: [OK] })).toBe(true);
    expect(connectionsBlockSave(true, { status: CONNECTIONS_CHECK_STATUS.FAILED, rows: [] })).toBe(true);
  });

  it('never holds a schedule save: a schedule under "Pause and ask me" may wait for a sign-in', () => {
    expect(connectionsBlockSave(false, answered([REMOTE, SIGN_IN]))).toBe(false);
  });

  it('offers a sign-in only for a saved login the panel can save', () => {
    expect(canSignInHere(SIGN_IN)).toBe(true);
    expect(canSignInHere(REMOTE)).toBe(false);
    expect(canSignInHere({ ...SIGN_IN, credential_type: undefined })).toBe(false);
  });

  it('names the row and gives the reason of a row that is not OK', () => {
    expect(connectionLabel({ credential_title: 'jira' })).toBe('jira');
    expect(connectionReason(OK)).toBe('');
    expect(connectionReason(REMOTE)).toBe('Webhooks cannot wait for a sign-in');
    expect(connectionReason({ status: 'unsupported' })).toMatch(/without a person signed in/);
  });

  it('names the real cause of a held webhook save', () => {
    expect(connectionsHint(true, answered([OK]))).toBe('');
    expect(connectionsHint(true, answered([REMOTE]))).toBe('Sign in to every connection to save');
    expect(connectionsHint(true, { status: CONNECTIONS_CHECK_STATUS.FAILED, rows: [] })).toMatch(
      /could not be checked/,
    );
    expect(connectionsHint(true, { status: CONNECTIONS_CHECK_STATUS.CHECKING, rows: [] })).toBe(
      'Checking connections',
    );
    expect(connectionsHint(false, answered([REMOTE]))).toBe('');
  });
});
