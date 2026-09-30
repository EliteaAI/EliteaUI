import { useSelector } from 'react-redux';

import { analyticsApi } from '@/[fsd]/features/settings/api/analyticsApi';

const RUN_ANALYTICS_ENDPOINTS = ['analyticsCosts', 'analyticsTools', 'projectAnalytics'];

const matchesScope = (originalArgs, queryArgs) =>
  Object.entries(queryArgs).every(([key, value]) => String(originalArgs?.[key]) === String(value));

/**
 * Whether any analytics request for this run scope (`{ runId }` or `{ evalRunId }`) is in flight. The tabs
 * own their queries, so the page-level Refresh button reads RTK Query's cache entries instead of
 * re-subscribing to each one; an in-flight entry is one whose status is still 'pending'.
 *
 * Caveat: `state[reducerPath].queries` (and its `status` / `endpointName` / `originalArgs` fields) is RTK
 * Query's internal cache shape, not a documented public API, and may change between major versions. If an
 * upgrade breaks it, lift the tab queries into the page and combine their `isFetching` flags instead.
 */
export const useRunAnalyticsFetching = (queryArgs = {}) =>
  useSelector(
    state =>
      Object.keys(queryArgs).length > 0 &&
      Object.values(state[analyticsApi.reducerPath]?.queries ?? {}).some(
        query =>
          query?.status === 'pending' &&
          RUN_ANALYTICS_ENDPOINTS.includes(query.endpointName) &&
          matchesScope(query.originalArgs, queryArgs),
      ),
  );
