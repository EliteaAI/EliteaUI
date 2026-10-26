// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useEntityScheduleRoute } from '../useEntityScheduleRoute.hooks';

// and the schedule form nested in an editor locks its entity and returns to the editor

const mocks = vi.hoisted(() => ({ params: {}, search: '', viewMode: 'owner' }));

vi.mock('react-router-dom', () => ({
  useParams: () => mocks.params,
  useLocation: () => ({ search: mocks.search }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useViewMode: () => mocks.viewMode }));

describe('useEntityScheduleRoute', () => {
  beforeEach(() => {
    mocks.search = '';
    mocks.viewMode = 'owner';
  });

  it('reads the agent of the editor route', () => {
    mocks.params = { tab: 'my', agentId: '12', scheduleId: '4' };

    const { result } = renderHook(() => useEntityScheduleRoute('agent'));

    expect(result.current).toEqual({
      lockedEntity: { type: 'agent', id: 12 },
      returnTo: '/agents/my/12?viewMode=owner',
    });
  });

  it('reads the pipeline of the editor route', () => {
    mocks.params = { tab: 'all', agentId: '9' };

    const { result } = renderHook(() => useEntityScheduleRoute('pipeline'));

    expect(result.current).toEqual({
      lockedEntity: { type: 'pipeline', id: 9 },
      returnTo: '/pipelines/all/9?viewMode=owner',
    });
  });

  it('browser walk bug 1 keeps the editor search string in the return target', () => {
    mocks.params = { tab: 'all', agentId: '1' };
    mocks.search = '?viewMode=owner&name=Sched%20Daily%20Digest';

    const { result } = renderHook(() => useEntityScheduleRoute('agent'));

    expect(result.current.returnTo).toBe('/agents/all/1?viewMode=owner&name=Sched+Daily+Digest');
  });

  it('TC-US58-16 locks the editor version and returns to it', () => {
    mocks.params = { tab: 'all', agentId: '12' };
    mocks.search = '?viewMode=owner&versionId=71';

    const { result } = renderHook(() => useEntityScheduleRoute('agent'));

    expect(result.current).toEqual({
      lockedEntity: { type: 'agent', id: 12, versionId: 71 },
      returnTo: '/agents/all/12/71?viewMode=owner',
    });
  });

  it('keeps the Settings pages as they are without an entity type', () => {
    mocks.params = { scheduleId: '4' };

    expect(renderHook(() => useEntityScheduleRoute()).result.current).toEqual({});
  });
});
