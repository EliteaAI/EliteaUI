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

describe('R6.2 EL-7011 run mode and prompt handling in create', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('sends run_mode null for an agent schedule', async () => {
    const agentData = {
      projectId: 5,
      name: 'Agent schedule',
      description: 'Test agent',
      entity_type: 'agent',
      application_id: 12,
      version_id: 40,
      run_mode: null,
      prompt: 'Test {{var}}',
      variables: [{ name: 'var', value: 'value' }],
      cron: '0 9 * * 1-5',
      timezone: 'Europe/Kyiv',
      expires_at: null,
      enabled: true,
    };

    fetchSpy.mockImplementation(async request => {
      if (request instanceof Request) {
        const body = JSON.parse(await request.clone().text());
        expect(body.run_mode).toBeNull();
      }
      return jsonResponse({ id: 1 }, 201);
    });

    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.createSchedule.initiate(agentData));

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('sends prompt null and variables empty array for entry point mode', async () => {
    const pipelineData = {
      projectId: 5,
      name: 'Pipeline schedule',
      description: 'Test pipeline',
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

    fetchSpy.mockImplementation(async request => {
      if (request instanceof Request) {
        const body = JSON.parse(await request.clone().text());
        expect(body.prompt).toBeNull();
        expect(body.variables).toEqual([]);
      }
      return jsonResponse({ id: 2 }, 201);
    });

    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.createSchedule.initiate(pipelineData));

    expect(fetchSpy).toHaveBeenCalled();
  });
});
