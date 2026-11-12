// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useChatStoredLogin } from '../useChatStoredLogin.hooks';

// A Dataverse sign-in from the chat authorization card used to live only in the browser, so a scheduled
// run of the same agent still had no login (#7497). These tests pin that the chat sign-in is saved on the
// credential the card names, with the same admin rule for team credentials as the toolkit page.
const mocks = vi.hoisted(() => ({
  isAdmin: true,
  items: [],
  getRefreshToken: vi.fn(),
  getConfigurations: vi.fn(),
  updateConfiguration: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({
    checkPermission: permission => permission === 'configuration.users.users.edit' && mocks.isAdmin,
  }),
}));
vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { personal_project_id: 77 } }) }));
vi.mock('@/api/configurations', () => ({
  useLazyGetConfigurationsByTypeQuery: () => [mocks.getConfigurations],
  useUpdateConfigurationMutation: () => [mocks.updateConfiguration],
}));
vi.mock('@/[fsd]/features/credentials/lib/helpers', async () => ({
  StoredLoginHelpers: await vi.importActual('@/[fsd]/features/credentials/lib/helpers/storedLogin.helpers'),
}));
vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: { getRefreshToken: mocks.getRefreshToken },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({
    toastSuccess: mocks.toastSuccess,
    toastError: mocks.toastError,
    toastInfo: mocks.toastInfo,
  }),
}));

const TOKEN_KEY = 'uuid-1:https://login.microsoftonline.com/tenant-1';
const TEAM_PROJECT = 596;
const CREDENTIAL = {
  id: 3105,
  uuid: 'uuid-1',
  type: 'dataverse',
  data: {
    url: 'https://org.crm4.dynamics.com',
    tenant_id: 'tenant-1',
    client_id: 'c',
    client_secret: '{{secret.s}}',
  },
};

const render = ({ toolkitType = 'dataverse', projectId = TEAM_PROJECT, uuid = 'uuid-1' } = {}) =>
  renderHook(() =>
    useChatStoredLogin({
      toolkitType,
      resourceMetadata: { configuration_uuid: uuid, configuration_project_id: projectId },
      tokenKey: TOKEN_KEY,
    }),
  ).result;

describe('useChatStoredLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdmin = true;
    mocks.items = [{ id: 9, uuid: 'other', data: {} }, CREDENTIAL];
    mocks.getRefreshToken.mockReturnValue('rt-from-chat');
    mocks.getConfigurations.mockImplementation(() => ({
      unwrap: () => Promise.resolve({ items: mocks.items }),
    }));
    mocks.updateConfiguration.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('saves the chat sign-in on the credential the card names', async () => {
    const result = render();
    await act(() => result.current.saveLogin());

    expect(mocks.getRefreshToken).toHaveBeenCalledWith(TOKEN_KEY);
    expect(mocks.getConfigurations).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: TEAM_PROJECT, type: 'dataverse' }),
    );
    expect(mocks.updateConfiguration).toHaveBeenCalledWith({
      projectId: TEAM_PROJECT,
      configId: 3105,
      body: { data: { ...CREDENTIAL.data, refresh_token: 'rt-from-chat' } },
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Connected! The login is saved for scheduled runs.');
  });

  it('lets a member save the login of their private credential', async () => {
    mocks.isAdmin = false;
    const result = render({ projectId: 77 });
    await act(() => result.current.saveLogin());

    expect(mocks.updateConfiguration).toHaveBeenCalledWith(expect.objectContaining({ projectId: 77 }));
  });

  it('keeps a member off a team credential and says who can log in', async () => {
    mocks.isAdmin = false;
    const result = render();
    await act(() => result.current.saveLogin());

    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
    expect(mocks.toastInfo).toHaveBeenCalledWith(expect.stringMatching(/project admin/));
  });

  it('does nothing for toolkits whose login the chat does not save', async () => {
    const result = render({ toolkitType: 'outlook' });
    await act(() => result.current.saveLogin());

    expect(result.current.isEnabled).toBe(false);
    expect(mocks.getRefreshToken).not.toHaveBeenCalled();
    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
  });

  it('does nothing when the card does not name the credential project', async () => {
    const result = render({ projectId: null });
    await act(() => result.current.saveLogin());

    expect(result.current.isEnabled).toBe(false);
    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
  });

  it('reports a sign-in without a refresh token instead of saving nothing silently', async () => {
    mocks.getRefreshToken.mockReturnValue(null);
    const result = render();
    await act(() => result.current.saveLogin());

    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(expect.stringMatching(/did not return a refresh token/));
  });

  it('reports a credential that is gone', async () => {
    mocks.items = [];
    const result = render();
    await act(() => result.current.saveLogin());

    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith('Could not find the credential to save the login on.');
  });

  it('shows the server refusal and does not throw, so the chat run still resumes', async () => {
    mocks.updateConfiguration.mockReturnValue({
      unwrap: () => Promise.reject({ data: { error: 'Only project admins can change this login' } }),
    });
    const result = render();
    await expect(act(() => result.current.saveLogin())).resolves.not.toThrow();

    expect(mocks.toastError).toHaveBeenCalledWith('Only project admins can change this login');
  });
});
