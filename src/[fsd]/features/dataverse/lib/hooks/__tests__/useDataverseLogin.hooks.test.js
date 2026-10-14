// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useDataverseLogin } from '../useDataverseLogin.hooks';

const mocks = vi.hoisted(() => ({
  items: [],
  testConnection: vi.fn(),
  updateConfiguration: vi.fn(),
  handleConfigAuthRequired: vi.fn(),
  onOAuthSuccess: null,
  getRefreshToken: vi.fn(),
  logout: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: 77 } }),
}));

vi.mock('@/api/configurations', () => ({
  useGetConfigurationsByTypeQuery: () => ({ data: { items: mocks.items } }),
  useTestConfigurationConnectionMutation: () => [mocks.testConnection],
  useUpdateConfigurationMutation: () => [mocks.updateConfiguration],
}));

vi.mock('@/[fsd]/features/mcp', () => ({
  McpAuthHelpers: { getRefreshToken: mocks.getRefreshToken, logout: mocks.logout },
  useConfigOAuthModal: options => {
    mocks.onOAuthSuccess = options.onSuccess;
    mocks.modalOptions = options;
    return {
      handleConfigAuthRequired: mocks.handleConfigAuthRequired,
      getModalProps: () => ({ open: false }),
    };
  },
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastSuccess: mocks.toastSuccess, toastError: mocks.toastError }),
}));

const AUTHORITY = 'https://login.microsoftonline.com/tenant-1';
const CREDENTIAL = {
  id: 3094,
  uuid: 'uuid-1',
  elitea_title: 'onecrm_dataverse',
  data: { url: 'https://org.crm4.dynamics.com', client_id: 'client-1', client_secret: '{{secret.s}}' },
};
const CONNECTED = { ...CREDENTIAL, data: { ...CREDENTIAL.data, refresh_token: '{{secret.r}}' } };
const REF = { elitea_title: 'onecrm_dataverse', private: true };

const render = (ref = REF, onLoginChange) =>
  renderHook(() => useDataverseLogin({ credentialRef: ref, projectId: 5, onLoginChange }));

describe('useDataverseLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.items = [CREDENTIAL];
    mocks.testConnection.mockReturnValue({ unwrap: () => Promise.resolve({ success: true }) });
    mocks.updateConfiguration.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  });

  it('reports connected only when the credential holds a saved login', () => {
    expect(render().result.current.isConnected).toBe(false);
    mocks.items = [CONNECTED];
    expect(render().result.current.isConnected).toBe(true);
  });

  it('renders nothing for a toolkit without a resolvable credential', () => {
    mocks.items = [];
    expect(render().result.current.hasCredential).toBe(false);
  });

  it('opens the Authorize modal with a credential-scoped token key when the backend asks for login', async () => {
    const error = {
      status: 401,
      data: { requires_authorization: true, auth_metadata: { server_url: AUTHORITY } },
    };
    mocks.testConnection.mockReturnValue({ unwrap: () => Promise.reject(error) });
    const { result } = render();

    await act(async () => result.current.login());

    expect(mocks.testConnection).toHaveBeenCalledWith({
      projectId: 77,
      configType: 'dataverse',
      body: { ...CREDENTIAL.data, configuration_uuid: 'uuid-1' },
    });
    expect(mocks.handleConfigAuthRequired).toHaveBeenCalledWith(error.data, AUTHORITY, `uuid-1:${AUTHORITY}`);
  });

  it('only tests the connection when a login is already saved', async () => {
    mocks.items = [CONNECTED];
    const { result } = render();

    await act(async () => result.current.login());

    expect(mocks.toastSuccess).toHaveBeenCalledWith('The connection is OK!');
    expect(mocks.handleConfigAuthRequired).not.toHaveBeenCalled();
  });

  it('saves the refresh token on the credential after Authorize, then clears it from the browser', async () => {
    // Scheduled runs read the vault copy, so the browser-held token is dropped once it is stored.
    const error = {
      status: 401,
      data: { requires_authorization: true, auth_metadata: { server_url: AUTHORITY } },
    };
    mocks.testConnection.mockReturnValue({ unwrap: () => Promise.reject(error) });
    mocks.getRefreshToken.mockReturnValue('refresh-abc');
    const { result } = render();
    await act(async () => result.current.login());

    await act(async () => mocks.onOAuthSuccess());

    expect(mocks.getRefreshToken).toHaveBeenCalledWith(`uuid-1:${AUTHORITY}`);
    expect(mocks.updateConfiguration).toHaveBeenCalledWith({
      projectId: 77,
      configId: 3094,
      body: { data: { ...CREDENTIAL.data, refresh_token: 'refresh-abc' } },
    });
    expect(mocks.logout).toHaveBeenCalledWith(`uuid-1:${AUTHORITY}`);
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it('tells the user when Microsoft returned no refresh token', async () => {
    const error = {
      status: 401,
      data: { requires_authorization: true, auth_metadata: { server_url: AUTHORITY } },
    };
    mocks.testConnection.mockReturnValue({ unwrap: () => Promise.reject(error) });
    mocks.getRefreshToken.mockReturnValue(null);
    const { result } = render();
    await act(async () => result.current.login());

    await act(async () => mocks.onOAuthSuccess());

    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalled();
    // Browser-held OAuth state is cleared even though nothing was saved
    expect(mocks.logout).toHaveBeenCalledWith(`uuid-1:${AUTHORITY}`);
  });

  it('clears the browser token and reports failure when saving to the credential fails', async () => {
    const error = {
      status: 401,
      data: { requires_authorization: true, auth_metadata: { server_url: AUTHORITY } },
    };
    mocks.testConnection.mockReturnValue({ unwrap: () => Promise.reject(error) });
    mocks.getRefreshToken.mockReturnValue('refresh-abc');
    mocks.updateConfiguration.mockReturnValue({ unwrap: () => Promise.reject(new Error('save failed')) });
    const { result } = render();
    await act(async () => result.current.login());

    await act(async () => mocks.onOAuthSuccess());

    expect(mocks.toastError).toHaveBeenCalledWith('Could not save the login to the credential.');
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.logout).toHaveBeenCalledWith(`uuid-1:${AUTHORITY}`);
  });

  it('suppresses the generic modal toast so success is reported only after saving', () => {
    render();
    expect(mocks.modalOptions.showSuccessToast).toBe(false);
  });

  it('logout removes the saved login by leaving the key out of the update', async () => {
    mocks.items = [CONNECTED];
    const { result } = render();

    await act(async () => result.current.logout());

    expect(mocks.updateConfiguration).toHaveBeenCalledWith({
      projectId: 77,
      configId: 3094,
      body: { data: CREDENTIAL.data },
    });
  });

  it('updates a non-private credential in the toolkit project', async () => {
    mocks.items = [CONNECTED];
    const { result } = render({ elitea_title: 'onecrm_dataverse', private: false });

    await act(async () => result.current.logout());

    expect(mocks.updateConfiguration).toHaveBeenCalledWith(expect.objectContaining({ projectId: 5 }));
  });

  it('runs the code exchange in the project that owns a private credential, not the page project', () => {
    // The client secret is a vault reference that only resolves in its own (personal) project.
    render();
    expect(mocks.modalOptions.projectId).toBe(77);
  });

  it('runs the code exchange in the page project for a project credential', () => {
    render({ elitea_title: 'onecrm_dataverse', private: false });
    expect(mocks.modalOptions.projectId).toBe(5);
  });

  it('notifies the page after a saved login so stale validation warnings are refreshed', async () => {
    const error = {
      status: 401,
      data: { requires_authorization: true, auth_metadata: { server_url: AUTHORITY } },
    };
    mocks.testConnection.mockReturnValue({ unwrap: () => Promise.reject(error) });
    mocks.getRefreshToken.mockReturnValue('refresh-abc');
    const onLoginChange = vi.fn();
    const { result } = render(REF, onLoginChange);
    await act(async () => result.current.login());

    await act(async () => mocks.onOAuthSuccess());

    expect(onLoginChange).toHaveBeenCalledTimes(1);
  });

  it('does not notify the page when saving the login fails', async () => {
    const error = {
      status: 401,
      data: { requires_authorization: true, auth_metadata: { server_url: AUTHORITY } },
    };
    mocks.testConnection.mockReturnValue({ unwrap: () => Promise.reject(error) });
    mocks.getRefreshToken.mockReturnValue('refresh-abc');
    mocks.updateConfiguration.mockReturnValue({ unwrap: () => Promise.reject(new Error('save failed')) });
    const onLoginChange = vi.fn();
    const { result } = render(REF, onLoginChange);
    await act(async () => result.current.login());

    await act(async () => mocks.onOAuthSuccess());

    expect(onLoginChange).not.toHaveBeenCalled();
  });

  it('notifies the page after logout', async () => {
    mocks.items = [CONNECTED];
    const onLoginChange = vi.fn();
    const { result } = render(REF, onLoginChange);

    await act(async () => result.current.logout());

    expect(onLoginChange).toHaveBeenCalledTimes(1);
  });
});
