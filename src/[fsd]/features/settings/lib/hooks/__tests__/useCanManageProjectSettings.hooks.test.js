// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useCanManageProjectSettings } from '../useCanManageProjectSettings.hooks.js';

const mocks = vi.hoisted(() => ({ projectId: 5, query: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => mocks.projectId }));
vi.mock('@/[fsd]/features/settings/api', () => ({ useProjectInfoQuery: mocks.query }));

const queryResult = (overrides = {}) => ({
  currentData: undefined,
  isFetching: false,
  isUninitialized: false,
  ...overrides,
});

describe('useCanManageProjectSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.projectId = 5;
  });
  afterEach(() => cleanup());

  it('shares the plain project-info cache entry and skips without a project', () => {
    mocks.query.mockReturnValue(queryResult());
    renderHook(() => useCanManageProjectSettings());
    expect(mocks.query).toHaveBeenCalledWith({ projectId: 5 }, { skip: false });

    mocks.projectId = undefined;
    renderHook(() => useCanManageProjectSettings());
    expect(mocks.query).toHaveBeenLastCalledWith({ projectId: undefined }, { skip: true });
  });

  it('reports the backend flag once loaded', () => {
    mocks.query.mockReturnValue(queryResult({ currentData: { can_manage_settings: true } }));
    const { result } = renderHook(() => useCanManageProjectSettings());
    expect(result.current).toEqual({ canManageSettings: true, isLoading: false });
  });

  it('stays loading until a project is selected', () => {
    mocks.projectId = undefined;
    mocks.query.mockReturnValue(queryResult({ isUninitialized: true }));
    const { result } = renderHook(() => useCanManageProjectSettings());
    expect(result.current).toEqual({ canManageSettings: false, isLoading: true });
  });

  it('drops the previous project answer while the new one is fetching', () => {
    mocks.query.mockReturnValue(queryResult({ currentData: undefined, isFetching: true }));
    const { result } = renderHook(() => useCanManageProjectSettings());
    expect(result.current).toEqual({ canManageSettings: false, isLoading: true });
  });
});
