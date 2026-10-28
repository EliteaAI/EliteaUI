// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useCredentialPageStoredLogin } from '../useCredentialPageStoredLogin.hooks';

// The credential page's Test connection / Login used to keep the Microsoft login in the browser only, so
// scheduled runs and other users never got it although the page showed Logout. These tests pin that a
// login from the page is also saved on the credential, with the same admin rule as the toolkit bar.
const mocks = vi.hoisted(() => ({
  isAdmin: true,
  getRefreshToken: vi.fn(),
  updateConfiguration: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({
    checkPermission: permission => permission === 'configuration.users.users.edit' && mocks.isAdmin,
  }),
}));
vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { personal_project_id: 77 } }) }));
vi.mock('@/api/configurations', () => ({
  useUpdateConfigurationMutation: () => [mocks.updateConfiguration],
}));
vi.mock('@/[fsd]/features/credentials/lib/helpers', () => ({
  StoredLoginHelpers: {
    getStoredLoginConfig: type =>
      ['dataverse', 'outlook', 'teams'].includes(type) ? { configurationType: type } : null,
  },
}));
vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: { getRefreshToken: mocks.getRefreshToken },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastSuccess: mocks.toastSuccess, toastError: mocks.toastError }),
}));

const TOKEN_KEY = 'uuid-17:https://login.microsoftonline.com/tenant-1';
const TEAMS = {
  id: 17,
  project_id: 596,
  type: 'teams',
  uuid: 'uuid-17',
  data: { client_id: 'c', client_secret: '{{secret.s}}', oauth_discovery_endpoint: 'https://x' },
};
const STORED = { ...TEAMS, data: { ...TEAMS.data, refresh_token: '{{secret.r}}' } };

const render = credential =>
  renderHook(() => useCredentialPageStoredLogin({ credential, tokenKey: TOKEN_KEY })).result;

describe('useCredentialPageStoredLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdmin = true;
    mocks.getRefreshToken.mockReturnValue('rt-from-browser');
    mocks.updateConfiguration.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('saves the browser login on the credential after a credential-page login', async () => {
    const result = render(TEAMS);

    await act(async () => result.current.saveLogin());

    expect(mocks.getRefreshToken).toHaveBeenCalledWith(TOKEN_KEY);
    expect(mocks.updateConfiguration).toHaveBeenCalledWith({
      projectId: 596,
      configId: 17,
      body: { data: { ...TEAMS.data, refresh_token: 'rt-from-browser' } },
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Connected! The login is saved for scheduled runs.');
  });

  it('keeps every stored field as saved, so vault references are sent back unchanged', async () => {
    const result = render(TEAMS);
    await act(async () => result.current.saveLogin());
    expect(mocks.updateConfiguration.mock.calls[0][0].body.data.client_secret).toBe('{{secret.s}}');
  });

  it('a non-admin on a team credential stays signed in in the browser and is told the login is not saved', async () => {
    mocks.isAdmin = false;
    const result = render(TEAMS);

    await act(async () => result.current.saveLogin());

    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
    expect(mocks.toastError.mock.calls[0][0]).toMatch(/only project admins/i);
  });

  it('anyone saves the login of their own personal credential', async () => {
    mocks.isAdmin = false;
    const result = render({ ...TEAMS, project_id: 77 });
    await act(async () => result.current.saveLogin());
    expect(mocks.updateConfiguration).toHaveBeenCalled();
  });

  it('reports when Microsoft returned no refresh token', async () => {
    mocks.getRefreshToken.mockReturnValue(null);
    const result = render(TEAMS);
    await act(async () => result.current.saveLogin());
    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
    expect(mocks.toastError.mock.calls[0][0]).toMatch(/did not return a refresh token/);
  });

  it('shows the server refusal when the save is rejected', async () => {
    mocks.updateConfiguration.mockReturnValue({
      unwrap: () =>
        Promise.reject({ data: { error: 'Only project admins can log in or out on a team credential' } }),
    });
    const result = render(TEAMS);
    await act(async () => result.current.saveLogin());
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Only project admins can log in or out on a team credential',
    );
  });

  it.each([
    ['an unsaved credential', { ...TEAMS, id: undefined }],
    ['a non-Microsoft credential', { ...TEAMS, type: 'github' }],
    ['no credential', null],
  ])('does nothing for %s', async (_label, credential) => {
    const result = render(credential);
    expect(result.current.enabled).toBe(false);
    await act(async () => result.current.saveLogin());
    expect(mocks.getRefreshToken).not.toHaveBeenCalled();
    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
  });

  it('reports a stored login so the page can offer Logout without a browser token', () => {
    expect(render(STORED).current.hasStoredLogin).toBe(true);
    expect(render(TEAMS).current.hasStoredLogin).toBe(false);
  });

  it('logout removes the stored login from the credential', async () => {
    const result = render(STORED);

    let removed;
    await act(async () => {
      removed = await result.current.removeLogin();
    });

    expect(removed).toBe(true);
    expect(mocks.updateConfiguration).toHaveBeenCalledWith({
      projectId: 596,
      configId: 17,
      body: { data: TEAMS.data },
    });
  });

  it('logout without a stored login touches nothing on the server', async () => {
    const result = render(TEAMS);
    let removed;
    await act(async () => {
      removed = await result.current.removeLogin();
    });
    expect(removed).toBe(true);
    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
  });

  it('a failed logout reports it and keeps the stored login', async () => {
    mocks.updateConfiguration.mockReturnValue({ unwrap: () => Promise.reject({ data: {} }) });
    const result = render(STORED);
    let removed;
    await act(async () => {
      removed = await result.current.removeLogin();
    });
    expect(removed).toBe(false);
    expect(mocks.toastError).toHaveBeenCalledWith('Could not remove the login from the credential.');
  });

  it('a non-admin cannot log out a team credential', async () => {
    mocks.isAdmin = false;
    const result = render(STORED);
    let removed;
    await act(async () => {
      removed = await result.current.removeLogin();
    });
    expect(removed).toBe(false);
    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
  });
});
