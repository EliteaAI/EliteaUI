// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useOpenScheduleNested } from '../useOpenScheduleNested.hooks';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/pipelines/all/9', search: '?viewMode=owner' }),
}));
vi.mock('@/common/constants', () => ({ SearchParams: { VersionId: 'versionId' } }));

describe('useOpenScheduleNested', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps the editor view mode, adds the schedule version and comes back to the editor', () => {
    const { result } = renderHook(() => useOpenScheduleNested());
    result.current({ pathname: '/pipelines/all/9/schedules/77' }, 5);

    expect(mocks.navigate).toHaveBeenCalledWith(
      { pathname: '/pipelines/all/9/schedules/77', search: '?viewMode=owner&versionId=5' },
      { state: { returnTo: '/pipelines/all/9?viewMode=owner' } },
    );
  });

  it('lets the params of the link win over the editor search', () => {
    const { result } = renderHook(() => useOpenScheduleNested());
    result.current({ pathname: '/runs', search: '?viewMode=public&tab=runs' });

    expect(mocks.navigate.mock.calls[0][0].search).toBe('?viewMode=public&tab=runs');
  });
});
