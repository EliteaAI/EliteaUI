import { describe, expect, it, vi } from 'vitest';

import { isMicrosoftEntraEndpoint } from '../mcpAuthFlow.helpers';

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
