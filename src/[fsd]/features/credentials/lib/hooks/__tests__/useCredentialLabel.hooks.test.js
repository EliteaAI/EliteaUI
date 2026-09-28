// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook, waitFor } from '@testing-library/react';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const { listQuery, lazyListTrigger } = vi.hoisted(() => ({
  listQuery: vi.fn(),
  lazyListTrigger: vi.fn(),
}));

vi.mock('@/api/configurations', () => ({
  useGetConfigurationsListQuery: (...args) => listQuery(...args),
  useLazyGetConfigurationsListQuery: () => [lazyListTrigger, { isFetching: false }],
  useListModelsQuery: () => ({ data: undefined }),
}));
vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: 5 } }),
}));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 9 }));

const { useCredentialLabel } = await import('../useCredentialLabel.hooks');
const { useCredentialsData } = await import('../useCredentialsData.hooks');

const scheduleCredential = { elitea_title: 'aasd', private: false };

describe('useCredentialLabel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listQuery.mockReturnValue({ data: undefined });
    lazyListTrigger.mockResolvedValue({ data: undefined });
  });

  it('reads the same cache entry the schedule dialog credentials dropdown fills', async () => {
    renderHook(() => useCredentialLabel({ credential: scheduleCredential, type: 'github' }));
    renderHook(() =>
      useCredentialsData({
        selectedProjectId: 9,
        personal_project_id: 9,
        section: 'credentials',
        type: 'github',
        onlyPublic: false,
        batchValidateCredentials: vi.fn(),
        resetStatuses: vi.fn(),
      }),
    );

    await waitFor(() => expect(lazyListTrigger).toHaveBeenCalled());
    expect(listQuery.mock.calls[0][0]).toEqual(lazyListTrigger.mock.calls[0][0]);
  });

  it('resolves the display name from project and shared credentials of the toolkit type', () => {
    listQuery.mockReturnValue({
      data: {
        items: [{ elitea_title: 'aasd', label: 'Jira AA', type: 'jira', project_id: 9 }],
        shared: {
          items: [{ elitea_title: 'aasd', label: 'AA', type: 'github', project_id: 1, shared: true }],
        },
      },
    });

    const { result } = renderHook(() =>
      useCredentialLabel({ credential: scheduleCredential, type: 'github' }),
    );

    expect(result.current).toBe('AA');
  });

  it('resolves a personal credential while a team project is selected', () => {
    listQuery.mockImplementation(({ projectId }) => ({
      data:
        projectId === 5
          ? { items: [{ elitea_title: 'aasd', label: 'My AA', type: 'github', project_id: 5 }] }
          : { items: [{ elitea_title: 'aasd', label: 'Team AA', type: 'github', project_id: 9 }] },
    }));

    const { result } = renderHook(() =>
      useCredentialLabel({ credential: { elitea_title: 'aasd', private: true }, type: 'github' }),
    );

    expect(result.current).toBe('My AA');
  });

  it('reads personal credentials from the same cache entry the credentials dropdown fills', async () => {
    renderHook(() =>
      useCredentialLabel({ credential: { elitea_title: 'aasd', private: true }, type: 'github' }),
    );
    renderHook(() =>
      useCredentialsData({
        selectedProjectId: 9,
        personal_project_id: 5,
        section: 'credentials',
        type: 'github',
        onlyPublic: false,
        batchValidateCredentials: vi.fn(),
        resetStatuses: vi.fn(),
      }),
    );

    await waitFor(() => expect(lazyListTrigger).toHaveBeenCalledTimes(2));
    const [projectRequest, personalRequest] = listQuery.mock.calls.slice(0, 2);
    expect(projectRequest[0]).toEqual(lazyListTrigger.mock.calls[0][0]);
    expect(personalRequest[0]).toEqual(lazyListTrigger.mock.calls[1][0]);
    expect(personalRequest[1]).toEqual({ skip: false });
  });

  it('does not fetch personal credentials for a project credential', () => {
    renderHook(() => useCredentialLabel({ credential: scheduleCredential, type: 'github' }));

    expect(listQuery.mock.calls[1][0].projectId).toBe(5);
    expect(listQuery.mock.calls[1][1]).toEqual({ skip: true });
  });

  it('skips the request when the schedule has no credential', () => {
    const { result } = renderHook(() => useCredentialLabel({ credential: undefined, type: 'github' }));

    expect(listQuery.mock.calls[0][1]).toEqual({ skip: true });
    expect(result.current).toBeNull();
  });
});
