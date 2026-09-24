// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { eliteaApi } from '@/api/eliteaApi.js';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';

import '../../../api/indexesApi';
import indexesReducer from '../../../model/indexes.slice';
import { useIndexScheduleIndicator } from '../useIndexScheduleIndicator.hooks';

const CURRENT_USER_ID = 5;
const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const fulfilled = (endpointName, originalArgs, payload) => ({
  type: `${eliteaApi.reducerPath}/executeQuery/fulfilled`,
  payload,
  meta: {
    requestId: `${endpointName}-request`,
    requestStatus: 'fulfilled',
    fulfilledTimeStamp: Date.now(),
    baseQueryMeta: {},
    arg: { type: 'query', endpointName, originalArgs, queryCacheKey: endpointName },
  },
});

const indexesLoaded = toolkitId => fulfilled('getIndexesList', { projectId: 2, toolkitId }, []);

const schedulesLoaded = (toolkitId, indexesMeta) =>
  fulfilled('getIndexSchedule', { projectId: 2, toolkitId }, { meta: { indexes_meta: indexesMeta } });

const schedule = (over = {}) => ({ cron: '0 2 * * *', timezone: BROWSER_TIMEZONE, enabled: true, ...over });

const renderIndicator = (indexName, ...actions) => {
  const store = configureStore({
    reducer: { indexes: indexesReducer, user: () => ({ id: CURRENT_USER_ID }) },
  });
  actions.forEach(action => store.dispatch(action));
  return renderHook(() => useIndexScheduleIndicator(indexName), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  }).result.current;
};

describe('useIndexScheduleIndicator', () => {
  it("shows the listed toolkit's schedule for the current user", () => {
    const indicator = renderIndicator(
      'docs',
      indexesLoaded(7),
      schedulesLoaded(7, { docs: { schedules: { [CURRENT_USER_ID]: schedule() } } }),
    );

    expect(indicator).toEqual({ enabled: true, tooltip: 'Scheduled: At 02:00' });
  });

  it('matches the toolkit id across string and number forms', () => {
    const indicator = renderIndicator(
      'docs',
      indexesLoaded('7'),
      schedulesLoaded(7, { docs: { schedules: { [CURRENT_USER_ID]: schedule() } } }),
    );

    expect(indicator).not.toBeNull();
  });

  it("hides the previous toolkit's schedule under a shared index name until the new one loads", () => {
    const indicator = renderIndicator(
      'docs',
      schedulesLoaded(7, { docs: { schedules: { [CURRENT_USER_ID]: schedule() } } }),
      indexesLoaded(8),
    );

    expect(indicator).toBeNull();
  });

  it('shows nothing for an index without a schedule', () => {
    const indicator = renderIndicator(
      'other',
      indexesLoaded(7),
      schedulesLoaded(7, { docs: { schedules: { [CURRENT_USER_ID]: schedule() } } }),
    );

    expect(indicator).toBeNull();
  });
});
