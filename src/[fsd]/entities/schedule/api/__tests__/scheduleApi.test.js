// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jsonResponse, makeStore as makeStoreFor, requestedUrls } from './scheduleApi.testSetup.js';

vi.mock('@/api/eliteaApi.js', async () => (await import('./scheduleApi.testSetup.js')).createEliteaApiMock());

const { scheduleApi, SCHEDULES_TAG, SCHEDULE_RUNS_TAG } = await import('../scheduleApi.js');
const { PAGE_SIZE } = await import('@/common/constants.js');

const makeStore = () => makeStoreFor(scheduleApi);

const lastRequestOf = async spy => {
  const [arg] = spy.mock.calls.at(-1);
  return {
    url: new URL(arg.url),
    method: arg.method,
    body: await arg
      .clone()
      .json()
      .catch(() => null),
  };
};

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
    expect(result.data).toMatchObject({ total: 1, rows: [{ id: 1 }] });
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
    expect(url.pathname).toBe('/elitea_core/schedules/prompt_lib/5');
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

  it('US-35 R2.1 sends entityId as entity_id', async () => {
    expect((await listParams({ entityType: 'agent', entityId: '12' })).get('entity_id')).toBe('12');
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

describe('R2.1 R3.1 R3.2 R4.2 EL-7011 schedule row mutations', () => {
  const rows = () => [
    { id: 1, enabled: true },
    { id: 2, enabled: true },
  ];
  let fetchSpy;
  let handler;

  const setup = async () => {
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, page: 0 }));
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, page: 1 }));
    return store;
  };

  const cachedEnabled = (store, page, id) =>
    scheduleApi.endpoints.getScheduleList
      .select({ projectId: 5, page })(store.getState())
      .data.rows.find(row => row.id === id).enabled;

  beforeEach(() => {
    vi.restoreAllMocks();
    handler = async () => jsonResponse({ total: 2, rows: rows() });
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(args => handler(args));
  });

  it('R2.1 posts the manual trigger to the run endpoint and returns the run id', async () => {
    const store = makeStore();
    handler = async () => jsonResponse({ run_id: 9 }, 202);

    const result = await store.dispatch(
      scheduleApi.endpoints.runSchedule.initiate({ projectId: 5, scheduleId: 7 }),
    );

    const request = await lastRequestOf(fetchSpy);
    expect(request.method).toBe('POST');
    expect(request.url.pathname).toBe('/elitea_core/schedules/prompt_lib/5/7/run');
    expect(request.body).toEqual({ trigger: 'manual' });
    expect(result.data).toEqual({ run_id: 9 });
  });

  it('R2.1 returns the 409 error with the active run id and does not refetch the list', async () => {
    const store = await setup();
    const callsBefore = fetchSpy.mock.calls.length;
    handler = async () => jsonResponse({ error: 'busy', active_run_id: 3 }, 409);

    const result = await store.dispatch(
      scheduleApi.endpoints.runSchedule.initiate({ projectId: 5, scheduleId: 7 }),
    );

    expect(result.error.status).toBe(409);
    expect(result.error.data).toEqual({ error: 'busy', active_run_id: 3 });
    expect(fetchSpy.mock.calls).toHaveLength(callsBefore + 1);
  });

  it('R2.1 refetches the list after a run is accepted', async () => {
    const store = await setup();
    const callsBefore = fetchSpy.mock.calls.length;
    handler = async args =>
      args.method === 'POST' ? jsonResponse({ run_id: 9 }, 202) : jsonResponse({ rows: rows() });

    await store.dispatch(scheduleApi.endpoints.runSchedule.initiate({ projectId: 5, scheduleId: 7 }));

    await vi.waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore + 1));
  });

  it.each([
    ['pauseSchedule', 'pause'],
    ['resumeSchedule', 'resume'],
  ])('R3.1 %s posts with no body to the %s path', async (endpoint, action) => {
    const store = makeStore();
    handler = async () => jsonResponse({ id: 7 });

    await store.dispatch(scheduleApi.endpoints[endpoint].initiate({ projectId: 5, scheduleId: 7 }));

    const request = await lastRequestOf(fetchSpy);
    expect(request.method).toBe('POST');
    expect(request.url.pathname).toBe(`/elitea_core/schedules/prompt_lib/5/7/${action}`);
    expect(request.body).toBeNull();
  });

  it.each([
    ['pauseSchedule', true, false],
    ['resumeSchedule', false, true],
  ])(
    'R3.1 %s patches Enabled in every cached list entry before the server answers',
    async (endpoint, before, after) => {
      handler = async () => jsonResponse({ rows: rows().map(row => ({ ...row, enabled: before })) });
      const store = await setup();
      let release;
      handler = args =>
        args.method === 'POST'
          ? new Promise(resolve => (release = () => resolve(jsonResponse({}))))
          : jsonResponse({ rows: rows() });

      const pending = store.dispatch(
        scheduleApi.endpoints[endpoint].initiate({ projectId: 5, scheduleId: 1 }),
      );

      await vi.waitFor(() => expect(cachedEnabled(store, 0, 1)).toBe(after));
      expect(cachedEnabled(store, 1, 1)).toBe(after);
      expect(cachedEnabled(store, 0, 2)).toBe(before);
      await vi.waitFor(() => expect(release).toBeTypeOf('function'));
      release();
      await pending;
    },
  );

  it('R3.2 restores the previous Enabled value in every cached entry when the pause fails', async () => {
    const store = await setup();
    handler = async args =>
      args.method === 'POST' ? jsonResponse({ error: 'no' }, 403) : jsonResponse({ rows: rows() });

    const result = await store.dispatch(
      scheduleApi.endpoints.pauseSchedule.initiate({ projectId: 5, scheduleId: 1 }),
    );

    expect(result.error.status).toBe(403);
    expect(cachedEnabled(store, 0, 1)).toBe(true);
    expect(cachedEnabled(store, 1, 1)).toBe(true);
  });

  it('R4.2 sends DELETE to the schedule path and refetches the list', async () => {
    const store = await setup();
    const callsBefore = fetchSpy.mock.calls.length;

    await store.dispatch(scheduleApi.endpoints.deleteSchedule.initiate({ projectId: 5, scheduleId: 7 }));

    const request = (await Promise.all(fetchSpy.mock.calls.map(([arg]) => arg))).find(
      arg => arg.method === 'DELETE',
    );
    expect(new URL(request.url).pathname).toBe('/elitea_core/schedules/prompt_lib/5/7');
    await vi.waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore + 1));
  });

  it('R4.2 keeps the list cache when the delete fails', async () => {
    const store = await setup();
    const callsBefore = fetchSpy.mock.calls.length;
    handler = async () => jsonResponse({ error: 'no' }, 403);

    const result = await store.dispatch(
      scheduleApi.endpoints.deleteSchedule.initiate({ projectId: 5, scheduleId: 7 }),
    );

    expect(result.error.status).toBe(403);
    expect(fetchSpy.mock.calls).toHaveLength(callsBefore + 1);
  });
});

describe('R3.1 R3.2 R3.4 EL-7011 change schedule owner', () => {
  let fetchSpy;
  let respond;

  const sent = async () =>
    (await Promise.all(fetchSpy.mock.calls.map(([arg]) => arg))).filter(arg => arg.method === 'POST');

  beforeEach(() => {
    vi.restoreAllMocks();
    respond = async () => jsonResponse({ id: 7, owner_id: 12 });
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(args => {
      const request = args instanceof Request ? args : new Request(String(args));
      return request.method === 'POST'
        ? respond()
        : Promise.resolve(jsonResponse({ total: 1, rows: [{ id: 7 }] }));
    });
  });

  it('R3.1 posts owner_id to the owner path and refetches the list', async () => {
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5 }));
    const callsBefore = fetchSpy.mock.calls.length;

    const result = await store.dispatch(
      scheduleApi.endpoints.changeScheduleOwner.initiate({ projectId: 5, scheduleId: 7, ownerId: 12 }),
    );

    const [request] = await sent();
    expect(new URL(request.url).pathname).toBe('/elitea_core/schedules/prompt_lib/5/7/owner');
    expect(await request.clone().json()).toEqual({ owner_id: 12 });
    expect(result.data).toEqual({ id: 7, owner_id: 12 });
    await vi.waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore + 1));
  });

  it('R3.2 keeps the list cache and returns the error body on 400', async () => {
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5 }));
    const callsBefore = fetchSpy.mock.calls.length;
    respond = async () => jsonResponse({ error: 'bad owner', field: 'owner_id' }, 400);

    const result = await store.dispatch(
      scheduleApi.endpoints.changeScheduleOwner.initiate({ projectId: 5, scheduleId: 7, ownerId: 99 }),
    );

    expect(result.error.status).toBe(400);
    expect(result.error.data).toEqual({ error: 'bad owner', field: 'owner_id' });
    expect(fetchSpy.mock.calls).toHaveLength(callsBefore + 1);
  });

  it.each([403, 404])('R3.4 refetches the list after a %i', async status => {
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5 }));
    const callsBefore = fetchSpy.mock.calls.length;
    respond = async () => jsonResponse({ error: 'gone' }, status);

    const result = await store.dispatch(
      scheduleApi.endpoints.changeScheduleOwner.initiate({ projectId: 5, scheduleId: 7, ownerId: 12 }),
    );

    expect(result.error.status).toBe(status);
    await vi.waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore + 1));
  });
});

describe('R1.3 EL-7011 run without asking flag on the schedule list', () => {
  const listWith = async body => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(body));
    const result = await makeStore().dispatch(
      scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, page: 0 }),
    );
    return result.data;
  };

  it('exposes runWithoutAskingAllowed false when the server sends false', async () => {
    const data = await listWith({ total: 0, rows: [], run_without_asking_allowed: false });
    expect(data.runWithoutAskingAllowed).toBe(false);
    expect(data.rows).toEqual([]);
  });

  it('exposes runWithoutAskingAllowed true only when the server sends true', async () => {
    expect(
      (await listWith({ total: 0, rows: [], run_without_asking_allowed: true })).runWithoutAskingAllowed,
    ).toBe(true);
  });

  it('exposes runWithoutAskingAllowed false when the server omits the flag', async () => {
    expect((await listWith({ total: 0, rows: [] })).runWithoutAskingAllowed).toBe(false);
  });

  it('exposes runWithoutAskingAllowed false when the server sends null or a non-boolean', async () => {
    expect(
      (await listWith({ total: 0, rows: [], run_without_asking_allowed: null })).runWithoutAskingAllowed,
    ).toBe(false);
    expect(
      (await listWith({ total: 0, rows: [], run_without_asking_allowed: 'true' })).runWithoutAskingAllowed,
    ).toBe(false);
  });
});

describe('R2.1 R3.2 R4.3 EL-7011 schedule details, update, test run and runs', () => {
  let fetchSpy;
  let handler;

  beforeEach(() => {
    vi.restoreAllMocks();
    handler = async () => jsonResponse({ id: 7 });
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(args => handler(args));
  });

  it('R2.1 getSchedule reads the schedule path and returns the schedule', async () => {
    handler = async () => jsonResponse({ id: 7, allowed_actions: ['run'] });

    const result = await makeStore().dispatch(
      scheduleApi.endpoints.getSchedule.initiate({ projectId: 5, scheduleId: 7 }),
    );

    const request = await lastRequestOf(fetchSpy);
    expect(request.method).toBe('GET');
    expect(request.url.pathname).toBe('/elitea_core/schedules/prompt_lib/5/7');
    expect(result.data).toEqual({ id: 7, allowed_actions: ['run'] });
  });

  it('EL-7011 owner CR 2026-10-21 getScheduleRun reads one run with its log and declares the runs tag', async () => {
    const run = {
      id: 12,
      status: 'running',
      events: [{ at: '2026-10-21T10:42:01Z', kind: 'started', text: 'x' }],
    };
    handler = async () => jsonResponse(run);

    const store = makeStore();
    const result = await store.dispatch(
      scheduleApi.endpoints.getScheduleRun.initiate({ projectId: 5, scheduleId: 7, runId: 12 }),
    );

    const request = await lastRequestOf(fetchSpy);
    expect(request.method).toBe('GET');
    expect(request.url.pathname).toBe('/elitea_core/schedules/prompt_lib/5/7/runs/12');
    expect(result.data).toEqual(run);
    // A decision invalidates the runs tag, so the open run loads its new log line at once
    const callsBefore = fetchSpy.mock.calls.length;
    store.dispatch(scheduleApi.util.invalidateTags([SCHEDULE_RUNS_TAG]));
    await vi.waitFor(() => expect(fetchSpy.mock.calls.length).toBe(callsBefore + 1));
  });

  it('R2.1 getSchedule returns the 404 error', async () => {
    handler = async () => jsonResponse({ error: 'not found' }, 404);

    const result = await makeStore().dispatch(
      scheduleApi.endpoints.getSchedule.initiate({ projectId: 5, scheduleId: 7 }),
    );

    expect(result.error.status).toBe(404);
  });

  it('R2.1 updateSchedule puts the whole body without projectId and scheduleId', async () => {
    const body = { name: 'n', description: null, prompt: 'p {{a}}', variables: [{ name: 'a', value: 'x' }] };

    await makeStore().dispatch(
      scheduleApi.endpoints.updateSchedule.initiate({ projectId: 5, scheduleId: 7, ...body }),
    );

    const request = await lastRequestOf(fetchSpy);
    expect(request.method).toBe('PUT');
    expect(request.url.pathname).toBe('/elitea_core/schedules/prompt_lib/5/7');
    expect(request.body).toEqual(body);
  });

  it('R2.1 updateSchedule never sends enabled and leaves the cached Enabled values alone', async () => {
    const store = makeStore();
    handler = async args =>
      args.method === 'PUT' ? jsonResponse({}) : jsonResponse({ rows: [{ id: 7, enabled: true }] });
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, page: 0 }));

    await store.dispatch(
      scheduleApi.endpoints.updateSchedule.initiate({
        projectId: 5,
        scheduleId: 7,
        name: 'n',
        enabled: false,
      }),
    );

    const put = fetchSpy.mock.calls.map(([arg]) => arg).find(arg => arg.method === 'PUT');
    expect(await put.clone().json()).toEqual({ name: 'n' });
    const row = scheduleApi.endpoints.getScheduleList.select({ projectId: 5, page: 0 })(store.getState()).data
      .rows[0];
    expect(row.enabled).toBe(true);
  });

  it('R3.2 runSchedule posts the test trigger when asked', async () => {
    handler = async () => jsonResponse({ run_id: 81 }, 202);

    const result = await makeStore().dispatch(
      scheduleApi.endpoints.runSchedule.initiate({ projectId: 5, scheduleId: 7, trigger: 'test' }),
    );

    expect((await lastRequestOf(fetchSpy)).body).toEqual({ trigger: 'test' });
    expect(result.data).toEqual({ run_id: 81 });
  });

  it('R4.3 getScheduleRuns turns page and pageSize into limit and offset', async () => {
    handler = async () => jsonResponse({ total: 1, rows: [{ id: 1, status: 'running' }] });

    const result = await makeStore().dispatch(
      scheduleApi.endpoints.getScheduleRuns.initiate({ projectId: 5, scheduleId: 7, page: 2, pageSize: 10 }),
    );

    const { url } = await lastRequestOf(fetchSpy);
    expect(url.pathname).toBe('/elitea_core/schedules/prompt_lib/5/7/runs');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('offset')).toBe('20');
    expect(result.data.rows[0].status).toBe('running');
  });

  it('R4.3 getScheduleRuns defaults to the first page', async () => {
    await makeStore().dispatch(
      scheduleApi.endpoints.getScheduleRuns.initiate({ projectId: 5, scheduleId: 7 }),
    );

    const { url } = await lastRequestOf(fetchSpy);
    expect(url.searchParams.get('limit')).toBe(String(PAGE_SIZE));
    expect(url.searchParams.get('offset')).toBe('0');
  });

  it.each([
    ['runSchedule', { projectId: 5, scheduleId: 7, trigger: 'test' }],
    ['updateSchedule', { projectId: 5, scheduleId: 7, name: 'n' }],
  ])('R4.3 %s refetches the runs after success', async (endpoint, args) => {
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleRuns.initiate({ projectId: 5, scheduleId: 7 }));
    const callsBefore = fetchSpy.mock.calls.length;

    await store.dispatch(scheduleApi.endpoints[endpoint].initiate(args));

    await vi.waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore + 1));
    expect(SCHEDULE_RUNS_TAG).toBe('SCHEDULE_RUNS_TAG');
  });

  it('R4.3 runSchedule keeps the runs cache when the run is refused', async () => {
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleRuns.initiate({ projectId: 5, scheduleId: 7 }));
    const callsBefore = fetchSpy.mock.calls.length;
    handler = async () => jsonResponse({ error: 'busy', active_run_id: 3 }, 409);

    const result = await store.dispatch(
      scheduleApi.endpoints.runSchedule.initiate({ projectId: 5, scheduleId: 7, trigger: 'test' }),
    );

    expect(result.error.data).toEqual({ error: 'busy', active_run_id: 3 });
    expect(fetchSpy.mock.calls).toHaveLength(callsBefore + 1);
  });
});

describe('mutations invalidate only the schedule they change', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ id: 7, rows: [] }));
  });

  const refetchedPaths = callsBefore =>
    fetchSpy.mock.calls
      .slice(callsBefore)
      .map(([arg]) => arg)
      .filter(arg => arg.method === 'GET')
      .map(arg => new URL(arg.url).pathname);

  it.each([
    ['updateSchedule', { projectId: 5, scheduleId: 7 }],
    ['runSchedule', { projectId: 5, scheduleId: 7, trigger: 'test' }],
    ['pauseSchedule', { projectId: 5, scheduleId: 7 }],
    ['resumeSchedule', { projectId: 5, scheduleId: 7 }],
    ['changeScheduleOwner', { projectId: 5, scheduleId: 7, ownerId: 12 }],
  ])('%s refetches schedule 7 and its runs, not schedule 8', async (endpoint, args) => {
    const store = makeStore();
    const { endpoints } = scheduleApi;
    for (const scheduleId of [7, 8]) {
      await store.dispatch(endpoints.getSchedule.initiate({ projectId: 5, scheduleId }));
      await store.dispatch(endpoints.getScheduleRuns.initiate({ projectId: 5, scheduleId }));
    }
    const callsBefore = fetchSpy.mock.calls.length;

    await store.dispatch(endpoints[endpoint].initiate(args));

    await vi.waitFor(() => {
      const paths = refetchedPaths(callsBefore);
      expect(paths.some(path => path.endsWith('/7'))).toBe(true);
      expect(paths.some(path => path.endsWith('/7/runs'))).toBe(true);
    });
    const paths = refetchedPaths(callsBefore);
    expect(paths.some(path => path.endsWith('/8') || path.endsWith('/8/runs'))).toBe(false);
  });
});
