import { describe, expect, it, vi } from 'vitest';

import { useRunAnalyticsFetching } from '../useRunAnalyticsFetching.hooks';

const { state } = vi.hoisted(() => ({ state: { current: null } }));

vi.mock('react-redux', () => ({ useSelector: selector => selector(state.current) }));

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({ analyticsApi: { reducerPath: 'eliteaApi' } }));

const RUN_ARGS = { runId: 'run-1', rootEntityType: 'skill', rootEntityId: 174 };

const withPendingQuery = endpointName => {
  state.current = {
    eliteaApi: {
      queries: { q1: { status: 'pending', endpointName, originalArgs: { projectId: 2, ...RUN_ARGS } } },
    },
  };
};

describe('useRunAnalyticsFetching', () => {
  it('spins Refresh while the run detail behind the header reloads', () => {
    withPendingQuery('analyticsRunDetail');

    expect(useRunAnalyticsFetching(RUN_ARGS)).toBe(true);
  });

  it('ignores endpoints outside the run page', () => {
    withPendingQuery('analyticsUsers');

    expect(useRunAnalyticsFetching(RUN_ARGS)).toBe(false);
  });
});
