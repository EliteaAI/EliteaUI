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
const {
  analyticsApi,
  useAnalyticsActivityQuery,
  useAnalyticsCostsQuery,
  useAnalyticsChatsSummaryQuery,
  useAnalyticsChatsQuery,
  useAnalyticsChatDetailQuery,
  useAnalyticsChatRunsQuery,
} = await import('../analyticsApi.js');

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

describe('root-entity-scoped run analytics', () => {
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
    ['analyticsRunDetail', '/usage/analytics_run_detail/prompt_lib/42'],
  ])('%s narrows the run to one root entity', async (endpoint, pathname) => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints[endpoint].initiate({
        projectId: 42,
        runId: 777,
        rootEntityType: 'skill',
        rootEntityId: 174,
        rootEntityProjectId: 1,
      }),
    );

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.pathname).toBe(pathname);
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      run_id: '777',
      root_entity_type: 'skill',
      root_entity_id: '174',
      root_entity_project_id: '1',
    });
  });

  it('leaves the root entity out of an agent run request', async () => {
    const store = makeStore();
    await store.dispatch(analyticsApi.endpoints.analyticsCosts.initiate({ projectId: 42, runId: 777 }));

    const url = new URL(requestOf(fetchSpy).url);
    expect([...url.searchParams.keys()]).toEqual(['run_id']);
  });
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

// ─── Chat endpoints ───────────────────────────────────────────────────────────

describe('analyticsChatsSummary endpoint', () => {
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
    expect(typeof useAnalyticsChatsSummaryQuery).toBe('function');
    expect(analyticsApi.endpoints.analyticsChatsSummary).toBeDefined();
  });

  it('issues a GET to the analytics_chats_summary path with project id and date params', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsChatsSummary.initiate({
        projectId: 7,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
      }),
    );

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.pathname).toContain('analytics_chats_summary');
    expect(url.pathname).toContain('7');
    expect(url.searchParams.get('date_from')).toBe('2026-10-01');
    expect(url.searchParams.get('date_to')).toBe('2026-10-08');
  });

  it('passes include_daily param when provided', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsChatsSummary.initiate({
        projectId: 7,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
        includeDaily: true,
      }),
    );

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.searchParams.get('include_daily')).toBe('true');
  });
});

describe('analyticsChats endpoint', () => {
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
    expect(typeof useAnalyticsChatsQuery).toBe('function');
    expect(analyticsApi.endpoints.analyticsChats).toBeDefined();
  });

  it('issues a GET to the analytics_chats path with project id and date params', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsChats.initiate({
        projectId: 7,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
      }),
    );

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.pathname).toContain('analytics_chats');
    expect(url.pathname).toContain('7');
    expect(url.searchParams.get('date_from')).toBe('2026-10-01');
    expect(url.searchParams.get('date_to')).toBe('2026-10-08');
  });

  it('passes pagination params', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsChats.initiate({
        projectId: 7,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
        limit: 25,
        offset: 50,
      }),
    );

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.searchParams.get('limit')).toBe('25');
    expect(url.searchParams.get('offset')).toBe('50');
  });

  it('passes sort and search params', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsChats.initiate({
        projectId: 7,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
        search: 'review',
        sortBy: 'llm_cost',
        sortOrder: 'desc',
      }),
    );

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.searchParams.get('search')).toBe('review');
    expect(url.searchParams.get('sort_by')).toBe('llm_cost');
    expect(url.searchParams.get('sort_order')).toBe('desc');
  });
});

describe('analyticsChatDetail endpoint', () => {
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
    expect(typeof useAnalyticsChatDetailQuery).toBe('function');
    expect(analyticsApi.endpoints.analyticsChatDetail).toBeDefined();
  });

  it('issues a GET to the analytics_chat_detail path with project id and conversation uuid', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsChatDetail.initiate({
        projectId: 7,
        conversationUuid: 'uuid-abc',
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
      }),
    );

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.pathname).toContain('analytics_chat_detail');
    expect(url.pathname).toContain('7');
    expect(url.searchParams.get('conversation_uuid')).toBe('uuid-abc');
    expect(url.searchParams.get('date_from')).toBe('2026-10-01');
    expect(url.searchParams.get('date_to')).toBe('2026-10-08');
  });
});

describe('analyticsChatRuns endpoint', () => {
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
    expect(typeof useAnalyticsChatRunsQuery).toBe('function');
    expect(analyticsApi.endpoints.analyticsChatRuns).toBeDefined();
  });

  it('issues a GET to the analytics_chat_runs path with project id, uuid and date params', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsChatRuns.initiate({
        projectId: 7,
        conversationUuid: 'uuid-abc',
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
      }),
    );

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.pathname).toContain('analytics_chat_runs');
    expect(url.pathname).toContain('7');
    expect(url.searchParams.get('conversation_uuid')).toBe('uuid-abc');
    expect(url.searchParams.get('date_from')).toBe('2026-10-01');
    expect(url.searchParams.get('date_to')).toBe('2026-10-08');
  });

  it('passes pagination and sort params', async () => {
    const store = makeStore();
    await store.dispatch(
      analyticsApi.endpoints.analyticsChatRuns.initiate({
        projectId: 7,
        conversationUuid: 'uuid-abc',
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
        limit: 100,
        offset: 200,
        sortBy: 'started_at',
        sortOrder: 'asc',
      }),
    );

    const url = new URL(requestOf(fetchSpy).url);
    expect(url.searchParams.get('limit')).toBe('100');
    expect(url.searchParams.get('offset')).toBe('200');
    expect(url.searchParams.get('sort_by')).toBe('started_at');
    expect(url.searchParams.get('sort_order')).toBe('asc');
  });
});
