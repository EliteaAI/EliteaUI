// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

const { testConnection, batchTestConnection } = vi.hoisted(() => ({
  testConnection: vi.fn(),
  batchTestConnection: vi.fn(),
}));

vi.mock('@/api/configurations', () => ({
  useTestConfigurationConnectionMutation: () => [testConnection],
  useBatchTestConfigurationConnectionMutation: () => [batchTestConnection],
}));

const { useCredentialValidation } = await import('../useCredentialValidation.hooks');

const credential = (id, type = 'sharepoint') => ({ id, type, data: {} });

describe('useCredentialValidation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not treat an authorization-required credential as invalid', async () => {
    testConnection.mockResolvedValue({
      error: {
        status: 401,
        data: { requires_authorization: true, message: 'Authorization required' },
      },
    });
    const { result } = renderHook(() => useCredentialValidation());

    await act(async () => {
      await result.current.validateCredential({ projectId: 7, credential: credential('delegated') });
    });

    expect(result.current.getCredentialStatus('delegated')).toBe('authorization_required');
    expect(result.current.getCredentialMessage('delegated')).toBe('');
  });

  it('classifies authorization-required batch results separately from real failures', async () => {
    batchTestConnection.mockResolvedValue({
      data: [
        {
          id: 'delegated',
          success: false,
          requires_authorization: true,
          message: 'Authorization required',
        },
        { id: 'broken', success: false, message: 'Bad credentials' },
      ],
    });
    const { result } = renderHook(() => useCredentialValidation());

    await act(async () => {
      await result.current.batchValidateCredentials([
        { projectId: 7, credential: credential('delegated') },
        { projectId: 7, credential: credential('broken') },
      ]);
    });

    expect(result.current.getCredentialStatus('delegated')).toBe('authorization_required');
    expect(result.current.getCredentialMessage('delegated')).toBe('');
    expect(result.current.getCredentialStatus('broken')).toBe('invalid');
    expect(result.current.getCredentialMessage('broken')).toBe('Bad credentials');
  });

  it('keeps ordinary connection errors invalid', async () => {
    testConnection.mockResolvedValue({
      error: { status: 400, data: { message: 'Bad credentials' } },
    });
    const { result } = renderHook(() => useCredentialValidation());

    await act(async () => {
      await result.current.validateCredential({ projectId: 7, credential: credential('broken') });
    });

    expect(result.current.getCredentialStatus('broken')).toBe('invalid');
    expect(result.current.getCredentialMessage('broken')).toBe('Bad credentials');
  });
});
