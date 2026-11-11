import { describe, expect, it } from 'vitest';

import {
  buildStoredLoginBody,
  getCredentialAuthority,
  getLockedLoginHint,
  getStoredLoginConfig,
  isLoginExpired,
} from '../storedLogin.helpers';

describe('storedLogin helpers', () => {
  it('knows the toolkit types that keep a Microsoft login on the credential', () => {
    expect(getStoredLoginConfig('dataverse')).toMatchObject({
      settingsKey: 'dataverse_configuration',
      keepBrowserToken: false,
    });
    expect(getStoredLoginConfig('outlook')).toMatchObject({
      settingsKey: 'outlook_configuration',
      keepBrowserToken: true,
    });
    expect(getStoredLoginConfig('teams')).toMatchObject({
      settingsKey: 'teams_configuration',
      keepBrowserToken: true,
    });
    expect(getStoredLoginConfig('sharepoint')).toMatchObject({
      settingsKey: 'sharepoint_configuration',
      keepBrowserToken: true,
    });
    expect(getStoredLoginConfig('ms_graph')).toMatchObject({
      configurationType: 'ms_graph',
      settingsKey: 'ms_graph_configuration',
      keepBrowserToken: true,
    });
    expect(getStoredLoginConfig('jira')).toBeNull();
    expect(getStoredLoginConfig(undefined)).toBeNull();
  });

  it('takes Dataverse authority from the 401 and the others from the credential discovery endpoint', () => {
    const credential = { data: { oauth_discovery_endpoint: 'https://login.microsoftonline.com/t' } };
    const errorData = { auth_metadata: { server_url: 'https://graph.microsoft.com' } };

    expect(
      getStoredLoginConfig('dataverse').getAuthority(credential, { auth_metadata: { server_url: 'A' } }),
    ).toBe('A');
    expect(getStoredLoginConfig('outlook').getAuthority(credential, errorData)).toBe(
      'https://login.microsoftonline.com/t',
    );
    // EL-7345: SharePoint keys its login by the credential's own endpoint, with or without /v2.0
    const v2 = { data: { oauth_discovery_endpoint: 'https://login.microsoftonline.com/t/v2.0' } };
    expect(getStoredLoginConfig('sharepoint').getAuthority(v2, errorData)).toBe(
      'https://login.microsoftonline.com/t/v2.0',
    );
  });

  it('recognises the login-required wording from the SDK connection errors', () => {
    expect(isLoginExpired('Sign in to Dataverse to connect this credential.')).toBe(true);
    expect(
      isLoginExpired(
        'Outlook requires OAuth authorization. Please complete the OAuth flow to obtain an access token.',
      ),
    ).toBe(true);
    expect(isLoginExpired('The Dataverse login expired or was revoked: log in again.')).toBe(true);
    expect(isLoginExpired('Connection timeout - Microsoft Graph is not responding')).toBe(false);
    expect(isLoginExpired(undefined)).toBe(false);
  });

  // Both login bars (toolkit page, credential page) build the PUT body here, so the rules stay in one place
  it('adds the refresh token and keeps every other stored field as is', () => {
    const data = { client_id: 'c', client_secret: '{{secret.s}}', refresh_token: '{{secret.old}}' };
    expect(buildStoredLoginBody(data, 'rt-new')).toEqual({
      data: { client_id: 'c', client_secret: '{{secret.s}}', refresh_token: 'rt-new' },
    });
  });

  it('removes the saved login by leaving the key out (PUT replaces data wholesale)', () => {
    expect(buildStoredLoginBody({ client_id: 'c', refresh_token: '{{secret.old}}' }, null)).toEqual({
      data: { client_id: 'c' },
    });
  });

  it('does not change the data it was given', () => {
    const data = { refresh_token: 'x' };
    buildStoredLoginBody(data, null);
    expect(data).toEqual({ refresh_token: 'x' });
  });

  it('tells a member who manages a team login, connected or not', () => {
    expect(getLockedLoginHint(true)).toBe('Login managed by a project admin');
    expect(getLockedLoginHint(false)).toBe('Not connected, ask a project admin to log in');
  });

  // Dataverse credentials have tenant_id and no oauth_discovery_endpoint, so the credential page built an
  // empty token key: the sign-in token was stored under the bare authority and the save never found it.
  it('builds the Dataverse authority from tenant_id, as the SDK login-required response does', () => {
    expect(getCredentialAuthority('dataverse', { tenant_id: ' tenant-1 ' })).toBe(
      'https://login.microsoftonline.com/tenant-1',
    );
    expect(getCredentialAuthority('dataverse', { tenant_id: '' })).toBe('');
    expect(getCredentialAuthority('dataverse', undefined)).toBe('');
  });

  it('matches the toolkit page key for Dataverse (server_url of the login-required response)', () => {
    const authority = getCredentialAuthority('dataverse', { tenant_id: 'tenant-1' });
    const errorData = { auth_metadata: { server_url: 'https://login.microsoftonline.com/tenant-1' } };
    expect(getStoredLoginConfig('dataverse').getAuthority({}, errorData)).toBe(authority);
  });

  it('uses the discovery endpoint for every other type', () => {
    const settings = { oauth_discovery_endpoint: 'https://login.microsoftonline.com/t', tenant_id: 'x' };
    expect(getCredentialAuthority('teams', settings)).toBe('https://login.microsoftonline.com/t');
    expect(getCredentialAuthority('sharepoint', settings)).toBe('https://login.microsoftonline.com/t');
    expect(getCredentialAuthority('github', {})).toBe('');
  });
});
