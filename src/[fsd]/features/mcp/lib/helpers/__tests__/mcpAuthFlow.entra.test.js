import { describe, expect, it, vi } from 'vitest';

import { getAuthorizationPrompt, isMicrosoftEntraEndpoint } from '../mcpAuthFlow.helpers';

vi.mock('@/[fsd]/shared/config', () => ({ store: { dispatch: vi.fn() } }));
vi.mock('@/api/toolkits', () => ({ toolkitsApi: {} }));
vi.mock('@/api/mcpOAuth', () => ({ mcpOAuthApi: { endpoints: {} } }));

describe('isMicrosoftEntraEndpoint', () => {
  it.each([
    'https://login.microsoftonline.com/00000000-0000-0000-0000-000000000000',
    'https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize',
    'https://login.microsoftonline.us/tenant',
    'https://login.windows.net/tenant',
  ])('treats %s as Microsoft Entra', url => {
    expect(isMicrosoftEntraEndpoint(url)).toBe(true);
  });

  it.each([
    'https://accounts.google.com',
    'https://login.microsoftonline.com.attacker.test/tenant',
    'https://attacker.test/?login.windows.net',
    'not a url',
    undefined,
  ])('does not treat %s as Microsoft Entra', url => {
    expect(isMicrosoftEntraEndpoint(url)).toBe(false);
  });
});

describe('getAuthorizationPrompt', () => {
  // People sign in to ELITEA itself with their company Microsoft account. With no prompt, Entra reuses
  // that browser session and finishes the toolkit login silently as the same person, even in a private
  // window, so a credential could never be logged in as another account such as a service bot.
  // select_account always shows the picker ("Use another account"); a lone session is one click.
  it.each([
    'https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize',
    'https://login.microsoftonline.us/tenant/oauth2/v2.0/authorize',
  ])('asks Entra (%s) to show the account picker', url => {
    expect(getAuthorizationPrompt(url, true)).toBe('select_account');
    expect(getAuthorizationPrompt(url, false)).toBe('select_account');
  });

  it('never sends prompt=consent to Entra, which shows non-admins the admin-approval screen', () => {
    expect(
      getAuthorizationPrompt('https://login.microsoftonline.com/t/oauth2/v2.0/authorize', true),
    ).not.toBe('consent');
  });

  it('keeps forced re-consent for other OIDC servers', () => {
    expect(getAuthorizationPrompt('https://accounts.google.com/o/oauth2/v2/auth', true)).toBe('consent');
  });

  it('sends no prompt to plain OAuth servers, which may reject it', () => {
    expect(getAuthorizationPrompt('https://github.com/login/oauth/authorize', false)).toBeUndefined();
  });
});
