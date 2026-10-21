// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useEntityScheduleRoute } from '../useEntityScheduleRoute.hooks';

// EL-7011 US-35 and US-36: the schedule form nested in an editor locks its entity and returns to the editor
// (owner CR 2026-10-21)

const mocks = vi.hoisted(() => ({ params: {}, search: '', viewMode: 'owner' }));

vi.mock('react-router-dom', () => ({
  useParams: () => mocks.params,
  useLocation: () => ({ search: mocks.search }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useViewMode: () => mocks.viewMode }));

describe('useEntityScheduleRoute EL-7011', () => {
  beforeEach(() => {
    mocks.search = '';
    mocks.viewMode = 'owner';
  });

  it('US-35 R4.1 R3.5 reads the agent of the editor route', () => {
    mocks.params = { tab: 'my', agentId: '12', scheduleId: '4' };

    const { result } = renderHook(() => useEntityScheduleRoute('agent'));

    expect(result.current).toEqual({
      lockedEntity: { type: 'agent', id: 12 },
      returnTo: '/agents/my/12?viewMode=owner',
    });
  });

  it('US-36 R4.1 reads the pipeline of the editor route', () => {
    mocks.params = { tab: 'all', agentId: '9' };

    const { result } = renderHook(() => useEntityScheduleRoute('pipeline'));

    expect(result.current).toEqual({
      lockedEntity: { type: 'pipeline', id: 9 },
      returnTo: '/pipelines/all/9?viewMode=owner',
    });
  });

  it('US-35 browser walk bug 1 keeps the editor search string in the return target', () => {
    mocks.params = { tab: 'all', agentId: '1' };
    mocks.search = '?viewMode=owner&name=Sched%20Daily%20Digest';

    const { result } = renderHook(() => useEntityScheduleRoute('agent'));

    expect(result.current.returnTo).toBe('/agents/all/1?viewMode=owner&name=Sched+Daily+Digest');
  });

  it('US-35 keeps the Settings pages as they are without an entity type', () => {
    mocks.params = { scheduleId: '4' };

    expect(renderHook(() => useEntityScheduleRoute()).result.current).toEqual({});
  });
});
