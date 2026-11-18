import { CONNECTIONS_CHECK_STATUS, CONNECTION_STATUS } from '../constants';

// The Connections check (#7401): one row per toolkit of the version, its sub-agents included
export const allConnectionsOk = rows =>
  Array.isArray(rows) && rows.every(row => row.status === CONNECTION_STATUS.OK);

// Only a webhook is held back: a schedule under "Pause and ask me" may wait for a sign-in during the run.
// Idle means no version chosen yet: the form schema asks for it, so Save stays clickable to show that.
export const connectionsBlockSave = (isWebhook, { status, rows }) =>
  isWebhook &&
  status !== CONNECTIONS_CHECK_STATUS.IDLE &&
  (status !== CONNECTIONS_CHECK_STATUS.ANSWERED || !allConnectionsOk(rows));

// The Save hint of a webhook held by its connections; empty when they do not hold it
export const connectionsHint = (isWebhook, { status, rows }) => {
  if (!connectionsBlockSave(isWebhook, { status, rows })) return '';
  if (status === CONNECTIONS_CHECK_STATUS.FAILED)
    return 'Connections could not be checked; try again to save';
  if (status !== CONNECTIONS_CHECK_STATUS.ANSWERED) return 'Checking connections';
  return 'Sign in to every connection to save';
};

// A row the owner can fix from the panel: a saved Microsoft login to sign in to
export const canSignInHere = row =>
  row.status === CONNECTION_STATUS.SIGN_IN && !!row.credential_title && !!row.credential_type;

export const connectionLabel = row => row.toolkit || row.credential_title || 'Credential';

export const connectionReason = row =>
  row.status === CONNECTION_STATUS.OK
    ? ''
    : row.reason || 'This toolkit cannot run without a person signed in';
