// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import useCreateConfiguration from '../useCreateConfiguration';

const mocks = vi.hoisted(() => ({
  testConnection: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

// Heavy collaborators that the test connection does not touch
vi.mock('react-redux', () => ({ useSelector: () => ({ personal_project_id: 1 }) }));
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams()] }));
vi.mock('@/[fsd]/shared/config', () => ({
  store: { getState: () => ({ user: {}, settings: {} }) },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 7,
  useToast: () => ({ toastError: mocks.toastError, toastSuccess: mocks.toastSuccess, toastWarning: vi.fn() }),
}));
vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({ McpAuthHelpers: { getAccessToken: vi.fn() } }));
vi.mock('@/[fsd]/features/credentials/lib/constants', () => ({
  ConfigurationTitlesConstants: { Create_Personal_Title: 'p', Create_Project_Title: 'q', Manual_Title: 'm' },
}));
vi.mock('@/[fsd]/features/credentials/lib/helpers', () => ({
  // No field matches: the error text is shown as the form-level error
  CredentialErrorHelpers: { extractInformationFromCredentialError: () => ({ newErrors: {} }) },
}));
vi.mock('@/api/configurations.js', () => ({
  useCreateConfigurationMutation: () => [vi.fn(), { isLoading: false }],
  useTestConfigurationConnectionMutation: () => [mocks.testConnection, { isLoading: false }],
}));

const GENERIC = 'Insufficient permissions to perform this action\non this project.';

const renderTestConnection = (extra = {}) => {
  const setTestConnectionError = vi.fn();
  const { result } = renderHook(() =>
    useCreateConfiguration({
      type: 'github',
      configuration: {},
      configurationName: 'name',
      settings: { elitea_title: 'name', base_url: 'https://example.test' },
      configurationErrors: {},
      configurationsAsSchema: [],
      setTestConnectionError,
      ...extra,
    }),
  );
  return { onTestConnection: () => act(() => result.current.onTestConnection()), setTestConnectionError };
};

describe('useCreateConfiguration test connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.testConnection.mockResolvedValue({ data: { success: true } });
  });

  it('sends the saved credential uuid when one is given', async () => {
    const { onTestConnection } = renderTestConnection({ configurationUuid: 'uuid-1' });

    await onTestConnection();

    expect(mocks.testConnection).toHaveBeenCalledTimes(1);
    expect(mocks.testConnection.mock.calls[0][0]).toMatchObject({
      projectId: 7,
      configType: 'github',
      configurationUuid: 'uuid-1',
    });
  });

  it('sends no uuid for a credential that is not saved or has edits', async () => {
    const { onTestConnection } = renderTestConnection({ configurationUuid: undefined });

    await onTestConnection();

    expect(mocks.testConnection.mock.calls[0][0].configurationUuid).toBeUndefined();
  });

  it('shows the message and the code of a 403 refusal', async () => {
    mocks.testConnection.mockResolvedValue({
      error: { status: 403, data: { success: false, code: 'DENIED_RBAC', message: 'Probe is not allowed.' } },
    });
    const { onTestConnection, setTestConnectionError } = renderTestConnection({
      configurationUuid: 'uuid-1',
    });

    await onTestConnection();

    expect(setTestConnectionError).toHaveBeenCalledTimes(1);
    expect(setTestConnectionError).toHaveBeenCalledWith({
      message: 'Probe is not allowed.',
      code: 'DENIED_RBAC',
    });
  });

  it('clears stale field errors when the next probe is refused', async () => {
    mocks.testConnection.mockResolvedValue({
      error: { status: 403, data: { success: false, code: 'DENIED_RBAC', message: 'Probe is not allowed.' } },
    });
    const setValidationErrorMessages = vi.fn();
    const setShowValidation = vi.fn();
    const { onTestConnection } = renderTestConnection({
      configurationUuid: 'uuid-1',
      setValidationErrorMessages,
      setShowValidation,
    });

    await onTestConnection();

    expect(setValidationErrorMessages).toHaveBeenCalledWith({});
    expect(setShowValidation).toHaveBeenCalledWith(false);
  });

  it('keeps the generic text for a 403 without a code', async () => {
    mocks.testConnection.mockResolvedValue({
      error: { status: 403, data: { success: false, message: 'Probe is not allowed.' } },
    });
    const { onTestConnection, setTestConnectionError } = renderTestConnection({
      configurationUuid: 'uuid-1',
    });

    await onTestConnection();

    expect(setTestConnectionError).toHaveBeenCalledWith(GENERIC);
  });

  it('keeps showing the provider message of a 400', async () => {
    mocks.testConnection.mockResolvedValue({ error: { status: 400, data: { message: 'Bad credentials' } } });
    const { onTestConnection, setTestConnectionError } = renderTestConnection();

    await onTestConnection();

    expect(setTestConnectionError).toHaveBeenCalledWith('Bad credentials');
  });
});
