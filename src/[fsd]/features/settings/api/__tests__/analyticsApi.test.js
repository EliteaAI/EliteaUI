// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// The real `@/api` barrel eagerly pulls in the app store (and its localStorage
// access) which cannot boot under the test environment. Replace it with a
// minimal, self-contained RTK Query base so `analyticsApi` injects into a real
// slice and we can exercise the endpoint at runtime (dispatch -> query builder
// -> fetch), rather than asserting on the source text of the file.
vi.mock('@/api', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  return { eliteaApi };
});

const { configureStore } = await import('@reduxjs/toolkit');
const { analyticsApi, useAnalyticsActivityQuery, useAnalyticsCostsQuery } =
  await import('../analyticsApi.js');

const makeStore = () =>
  configureStore({
    reducer: { [analyticsApi.reducerPath]: analyticsApi.reducer },
    middleware: getDefault => getDefault().concat(analyticsApi.middleware),
  });

const requestOf = spy => {
  const arg = spy.mock.calls[0]?.[0];
  return arg instanceof Request ? arg : new Request(String(arg));
};

describe('analyticsCosts endpoint', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
      );
  });

  it('exposes the generated hook and endpoint', () => {
    expect(typeof useAnalyticsCostsQuery).toBe('function');
    expect(analyticsApi.endpoints.analyticsCosts).toBeDefined();
  });

  it('issues a GET to the analytics_costs path with the project id and date params', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsCosts.initiate({
        projectId: 42,
        dateFrom: '2026-01-01',
        dateTo: '2026-02-01',
      }),
    );

    const req = requestOf(fetchSpy);
    const url = new URL(req.url);
    expect(req.method).toBe('GET');
    expect(url.pathname).toBe('/usage/analytics_costs/prompt_lib/42');
    expect(url.searchParams.get('date_from')).toBe('2026-01-01');
    expect(url.searchParams.get('date_to')).toBe('2026-02-01');
  });

  it('omits the query string entirely when no date range is supplied (no trailing "?")', async () => {
    const store = makeStore();
    await store.dispatch(analyticsApi.endpoints.analyticsCosts.initiate({ projectId: 7 }));

    const req = requestOf(fetchSpy);
    expect(req.url).toBe('http://test.local/usage/analytics_costs/prompt_lib/7');
    expect(req.url).not.toContain('?');
  });

  it('caches by argument identity — same args dedupe into one request', async () => {
    const store = makeStore();
    const args = { projectId: 9, dateFrom: '2026-03-01', dateTo: '2026-03-31' };
    await Promise.all([
      store.dispatch(analyticsApi.endpoints.analyticsCosts.initiate(args)),
      store.dispatch(analyticsApi.endpoints.analyticsCosts.initiate(args)),
    ]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('surfaces fetched payload as the cached query data', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ kpis: { total_cost: 1.23 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const store = makeStore();
    const result = await store.dispatch(analyticsApi.endpoints.analyticsCosts.initiate({ projectId: 1 }));
    expect(result.data).toEqual({ kpis: { total_cost: 1.23 } });
  });
});

describe('analyticsActivity endpoint', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
      );
  });

  it('exposes the generated hook and endpoint', () => {
    expect(typeof useAnalyticsActivityQuery).toBe('function');
    expect(analyticsApi.endpoints.analyticsActivity).toBeDefined();
  });

  it('sends roles as a repeated param, not a comma-joined one', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsActivity.initiate({
        projectId: 42,
        dateFrom: '2026-01-01',
        dateTo: '2026-02-01',
        roles: ['admin', 'viewer'],
      }),
    );

    const req = requestOf(fetchSpy);
    const url = new URL(req.url);
    expect(url.searchParams.getAll('roles')).toEqual(['admin', 'viewer']);
  });

  it('omits the roles param entirely when the array is empty', async () => {
    const store = makeStore();
    await store.dispatch(analyticsApi.endpoints.analyticsActivity.initiate({ projectId: 42, roles: [] }));

    const req = requestOf(fetchSpy);
    const url = new URL(req.url);
    expect(url.searchParams.getAll('roles')).toEqual([]);
  });
});

describe('run-scoped analytics (run_id)', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
      );
  });

  it.each([
    ['analyticsCosts', '/usage/analytics_costs/prompt_lib/42'],
    ['analyticsTools', '/usage/analytics_tools/prompt_lib/42'],
    ['projectAnalytics', '/elitea_core/analytics/prompt_lib/42'],
  ])('%s sends run_id and no date range when scoped to a run', async (endpoint, pathname) => {
    const store = makeStore();
    await store.dispatch(analyticsApi.endpoints[endpoint].initiate({ projectId: 42, runId: 777 }));

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.pathname).toBe(pathname);
    expect(url.searchParams.get('run_id')).toBe('777');
    expect(url.searchParams.has('date_from')).toBe(false);
    expect(url.searchParams.has('date_to')).toBe(false);
  });

  it.each(['analyticsCosts', 'analyticsTools', 'projectAnalytics'])(
    '%s omits run_id for project-wide requests',
    async endpoint => {
      const store = makeStore();
      await store.dispatch(
        analyticsApi.endpoints[endpoint].initiate({
          projectId: 42,
          dateFrom: '2026-01-01',
          dateTo: '2026-02-01',
        }),
      );

      const url = new URL(requestOf(fetchSpy).url);
      expect(url.searchParams.has('run_id')).toBe(false);
    },
  );
});

describe('evaluation-run-scoped analytics (eval_run_id)', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
      );
  });

  it.each(['analyticsCosts', 'analyticsTools', 'projectAnalytics'])(
    '%s sends eval_run_id, and neither run_id nor a date range',
    async endpoint => {
      const store = makeStore();
      await store.dispatch(analyticsApi.endpoints[endpoint].initiate({ projectId: 42, evalRunId: 9 }));

      const url = new URL(requestOf(fetchSpy).url);
      expect(url.searchParams.get('eval_run_id')).toBe('9');
      expect(url.searchParams.has('run_id')).toBe(false);
      expect(url.searchParams.has('date_from')).toBe(false);
    },
  );

  it.each(['analyticsCosts', 'analyticsTools', 'projectAnalytics'])(
    '%s omits eval_run_id for other requests',
    async endpoint => {
      const store = makeStore();
      await store.dispatch(analyticsApi.endpoints[endpoint].initiate({ projectId: 42, runId: 'abc' }));

      expect(new URL(requestOf(fetchSpy).url).searchParams.has('eval_run_id')).toBe(false);
    },
  );
});
