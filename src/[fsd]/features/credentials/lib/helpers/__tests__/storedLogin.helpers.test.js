import { describe, expect, it } from 'vitest';

import { getStoredLoginConfig, isLoginExpired } from '../storedLogin.helpers';

describe('storedLogin helpers', () => {
  it('knows the four toolkit types that keep a Microsoft login on the credential', () => {
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
});
