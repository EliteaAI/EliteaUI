// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

vi.mock('@/api/eliteaApi.js', () => ({
  eliteaApi: createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  }),
}));

const { configureStore } = await import('@reduxjs/toolkit');
const { scheduleApi, SCHEDULES_TAG } = await import('../scheduleApi.js');
const { PAGE_SIZE } = await import('@/common/constants.js');

const makeStore = () =>
  configureStore({
    reducer: { [scheduleApi.reducerPath]: scheduleApi.reducer },
    middleware: getDefault => getDefault().concat(scheduleApi.middleware),
  });

const requestedUrls = spy =>
  spy.mock.calls.map(([arg]) => new URL(arg instanceof Request ? arg.url : String(arg)));

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('R2.1 EL-7011 schedule list query', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ total: 1, rows: [{ id: 1 }] }));
  });

  it('requests the first page of the current project', async () => {
    const store = makeStore();
    const result = await store.dispatch(
      scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, page: 0 }),
    );

    const [url] = requestedUrls(fetchSpy);
    expect(url.pathname).toBe('/elitea_core/schedules/prompt_lib/5');
    expect(url.searchParams.get('limit')).toBe(String(PAGE_SIZE));
    expect(url.searchParams.get('offset')).toBe('0');
    expect(result.data).toEqual({ total: 1, rows: [{ id: 1 }] });
  });

  it('turns page and pageSize into limit and offset and forwards filters', async () => {
    const store = makeStore();
    await store.dispatch(
      scheduleApi.endpoints.getScheduleList.initiate({
        projectId: 5,
        page: 2,
        pageSize: 10,
        status: 'failed',
      }),
    );

    const [url] = requestedUrls(fetchSpy);
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('offset')).toBe('20');
    expect(url.searchParams.get('status')).toBe('failed');
  });

  it('EL-7011 sends sortBy and sortOrder as sort_by and sort_order', async () => {
    const store = makeStore();
    await store.dispatch(
      scheduleApi.endpoints.getScheduleList.initiate({
        projectId: 5,
        page: 0,
        sortBy: 'entity_name',
        sortOrder: 'desc',
      }),
    );

    const [url] = requestedUrls(fetchSpy);
    expect(url.searchParams.get('sort_by')).toBe('entity_name');
    expect(url.searchParams.get('sort_order')).toBe('desc');
  });

  it('EL-7011 keeps the sort in the cache key, so a new sort requests again', async () => {
    const store = makeStore();
    const args = { projectId: 5, page: 0, sortBy: 'name', sortOrder: 'asc' };
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate(args));
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ ...args, sortOrder: 'desc' }));

    const urls = requestedUrls(fetchSpy);
    expect(urls).toHaveLength(2);
    expect(urls[1].searchParams.get('sort_order')).toBe('desc');
  });

  it('declares SCHEDULES_TAG for the list', () => {
    expect(SCHEDULES_TAG).toBe('SCHEDULES_TAG');
    expect(scheduleApi.endpoints.getScheduleList).toBeDefined();
  });
});

describe('R3.2 EL-7011 project switch', () => {
  it('requests the list of the new project from the first page', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ total: 0, rows: [] }));
    const store = makeStore();

    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, page: 3 }));
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 6, page: 0 }));

    const urls = requestedUrls(fetchSpy);
    expect(urls).toHaveLength(2);
    expect(urls[1].pathname).toBe('/elitea_core/schedules/prompt_lib/6');
    expect(urls[1].searchParams.get('offset')).toBe('0');
  });
});

describe('R3.4 EL-7011 no client-side widening', () => {
  it('returns the rows of the API unchanged and adds no owner filter', async () => {
    const rows = [
      { id: 1, owner_id: 9 },
      { id: 2, owner_id: 10 },
    ];
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ total: 2, rows }));
    const store = makeStore();

    const result = await store.dispatch(
      scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, page: 0 }),
    );

    expect(result.data.rows).toEqual(rows);
    expect([...requestedUrls(fetchSpy)[0].searchParams.keys()].sort((a, b) => a.localeCompare(b))).toEqual([
      'limit',
      'offset',
    ]);
  });

  it('surfaces a failed request as an error with the server message', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ error: 'Forbidden' }, 403));
    const store = makeStore();

    const result = await store.dispatch(
      scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, page: 0 }),
    );

    expect(result.error).toMatchObject({ status: 403, data: { error: 'Forbidden' } });
  });
});

describe('R6.1 EL-7011 create schedule mutation', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('sends POST to the create endpoint with all required fields', async () => {
    const scheduleData = {
      projectId: 5,
      name: 'Daily digest',
      description: 'Team summary',
      entity_type: 'agent',
      application_id: 12,
      version_id: 40,
      run_mode: null,
      prompt: 'Summarize {{topic}}',
      variables: [{ name: 'topic', value: 'tickets' }],
      cron: '0 9 * * 1-5',
      timezone: 'Europe/Kyiv',
      expires_at: null,
      enabled: true,
    };

    fetchSpy.mockImplementation(async () =>
      jsonResponse(
        {
          id: 99,
          ...scheduleData,
          created_at: '2026-10-20T10:00:00Z',
          allowed_actions: ['run', 'update', 'delete'],
        },
        201,
      ),
    );

    const store = makeStore();
    const result = await store.dispatch(scheduleApi.endpoints.createSchedule.initiate(scheduleData));

    const [url] = requestedUrls(fetchSpy);
    expect(url.pathname).toBe('/elitea_core/schedule/prompt_lib/5');
    expect(result.data).toMatchObject({
      id: 99,
      allowed_actions: ['run', 'update', 'delete'],
    });
  });

  it('declares SCHEDULES_TAG and invalidates on success', async () => {
    expect(SCHEDULES_TAG).toBe('SCHEDULES_TAG');
    expect(scheduleApi.endpoints.createSchedule).toBeDefined();
  });
});

describe('R6.2 EL-7011 create sends the form body unchanged', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts every field except projectId, as built by toCreateBody', async () => {
    const body = {
      name: 'Pipeline schedule',
      description: null,
      entity_type: 'pipeline',
      application_id: 31,
      version_id: 77,
      run_mode: 'entry_point',
      prompt: null,
      variables: [],
      cron: '0 2 * * *',
      timezone: 'Europe/Kyiv',
      expires_at: null,
      enabled: true,
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ id: 2 }, 201));

    await makeStore().dispatch(scheduleApi.endpoints.createSchedule.initiate({ projectId: 5, ...body }));

    const [request] = fetchSpy.mock.calls[0];
    expect(request.method).toBe('POST');
    expect(JSON.parse(await request.clone().text())).toEqual(body);
  });
});

describe('R1.1 R1.2 R2.3 R3.2 EL-7011 list filter arguments', () => {
  let fetchSpy;

  const listParams = async args => {
    await makeStore().dispatch(
      scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, page: 0, ...args }),
    );
    return requestedUrls(fetchSpy).at(-1).searchParams;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ total: 0, rows: [] }));
  });

  it('R1.1 sends entityType, status and enabled as entity_type, status and enabled', async () => {
    const params = await listParams({ entityType: 'pipeline', status: 'failed', enabled: true });

    expect(params.get('entity_type')).toBe('pipeline');
    expect(params.get('status')).toBe('failed');
    expect(params.get('enabled')).toBe('true');
  });

  it('R1.1 sends enabled=false, because false is a real filter value', async () => {
    expect((await listParams({ enabled: false })).get('enabled')).toBe('false');
  });

  it('R1.2 sends the search text as search', async () => {
    expect((await listParams({ search: 'daily' })).get('search')).toBe('daily');
  });

  it('R2.3 sends the owner ids comma separated in owner_ids', async () => {
    expect((await listParams({ ownerIds: ['a', 'b'] })).get('owner_ids')).toBe('a,b');
  });

  it('R3.2 sends no filter parameter for empty values and no tag parameter', async () => {
    const params = await listParams({
      entityType: undefined,
      status: '',
      enabled: undefined,
      search: '',
      ownerIds: [],
    });

    expect([...params.keys()].sort((a, b) => a.localeCompare(b))).toEqual(['limit', 'offset']);
  });

  it('R1.1 keeps the filters in the cache key, so a new filter requests again', async () => {
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, status: 'failed' }));
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, status: 'success' }));

    expect(requestedUrls(fetchSpy)).toHaveLength(2);
  });
});
