// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { eliteaApi } from '@/api/eliteaApi.js';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ options: vi.fn() }));

vi.mock('@/[fsd]/entities/schedule', () => ({
  useGetToolkitIndexOptionsQuery: (args, config) => mocks.options(args, config),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => 2,
}));

const { useIndexScheduleIndicator } = await import('../useIndexScheduleIndicator.hooks');
await import('../../../api/indexesApi');
const { default: indexesReducer } = await import('../../../model/indexes.slice');

const indexesLoaded = toolkitId => ({
  type: `${eliteaApi.reducerPath}/executeQuery/fulfilled`,
  payload: [],
  meta: {
    requestId: 'getIndexesList-request',
    requestStatus: 'fulfilled',
    fulfilledTimeStamp: Date.now(),
    baseQueryMeta: {},
    arg: {
      type: 'query',
      endpointName: 'getIndexesList',
      originalArgs: { projectId: 2, toolkitId },
      queryCacheKey: 'getIndexesList',
    },
  },
});

const summary = (...rows) => ({ data: rows });

const renderIndicator = (indexName, ...actions) => {
  const store = configureStore({ reducer: { indexes: indexesReducer } });
  actions.forEach(action => store.dispatch(action));
  return renderHook(() => useIndexScheduleIndicator(indexName), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  }).result.current;
};

afterEach(() => vi.clearAllMocks());

describe('useIndexScheduleIndicator', () => {
  it('shows the clock for an index the summary marks as scheduled', () => {
    mocks.options.mockReturnValue(
      summary({ name: 'docs', scheduled: true }, { name: 'wiki', scheduled: false }),
    );

    expect(renderIndicator('docs', indexesLoaded(7))).toEqual({ enabled: true, tooltip: 'Scheduled' });
  });

  it('shows nothing for an index the summary marks as not scheduled', () => {
    mocks.options.mockReturnValue(
      summary({ name: 'docs', scheduled: true }, { name: 'wiki', scheduled: false }),
    );

    expect(renderIndicator('wiki', indexesLoaded(7))).toBeNull();
  });

  it('shows nothing for an index the summary does not list', () => {
    mocks.options.mockReturnValue(summary({ name: 'docs', scheduled: true }));

    expect(renderIndicator('other', indexesLoaded(7))).toBeNull();
  });

  it('shows nothing before the summary arrives', () => {
    mocks.options.mockReturnValue({ data: undefined });

    expect(renderIndicator('docs', indexesLoaded(7))).toBeNull();
  });

  it('asks the summary of the listed toolkit again on each mount', () => {
    mocks.options.mockReturnValue(summary());

    renderIndicator('docs', indexesLoaded(7));

    expect(mocks.options).toHaveBeenCalledWith(
      { projectId: 2, toolkitId: 7 },
      { skip: false, refetchOnMountOrArgChange: true },
    );
  });

  it('skips the summary while no toolkit is listed', () => {
    mocks.options.mockReturnValue({ data: undefined });

    renderIndicator('docs');

    expect(mocks.options).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }));
  });
});
