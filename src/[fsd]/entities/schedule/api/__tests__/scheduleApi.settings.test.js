// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jsonResponse, makeStore as makeStoreFor } from './scheduleApi.testSetup.js';

vi.mock('@/api/eliteaApi.js', async () => (await import('./scheduleApi.testSetup.js')).createEliteaApiMock());

const { scheduleApi } = await import('../scheduleApi.js');

// EL-7011 owner CR 2026-10-21: "Run without asking" is a project setting (US-33, US-39)
const PATH = '/elitea_core/schedules/prompt_lib/5/settings';

const makeStore = () => makeStoreFor(scheduleApi);

const requestAt = async (spy, index) => {
  const [arg] = spy.mock.calls[index];
  return {
    url: new URL(arg.url),
    method: arg.method,
    body: await arg
      .clone()
      .json()
      .catch(() => null),
  };
};

const cached = store =>
  scheduleApi.endpoints.getScheduleSettings.select({ projectId: 5 })(store.getState()).data;

describe('EL-7011 owner CR project schedule settings API', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('US-39 loads the setting with GET on the project settings URL', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ allow_run_without_asking: false }));

    const result = await makeStore().dispatch(
      scheduleApi.endpoints.getScheduleSettings.initiate({ projectId: 5 }),
    );

    const request = await requestAt(fetchSpy, 0);
    expect(request.method).toBe('GET');
    expect(request.url.pathname).toBe(PATH);
    expect(result.data).toEqual({ allow_run_without_asking: false });
  });

  it('US-39 sends only allow_run_without_asking with PUT and updates the cache before the reply', async () => {
    let reply;
    fetchSpy.mockResolvedValueOnce(jsonResponse({ allow_run_without_asking: false }));
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleSettings.initiate({ projectId: 5 }));

    fetchSpy.mockReturnValueOnce(new Promise(resolve => (reply = resolve)));
    const pending = store.dispatch(
      scheduleApi.endpoints.updateScheduleSettings.initiate({ projectId: 5, allowRunWithoutAsking: true }),
    );

    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(cached(store)).toEqual({ allow_run_without_asking: true });
    const request = await requestAt(fetchSpy, 1);
    expect(request.method).toBe('PUT');
    expect(request.url.pathname).toBe(PATH);
    expect(request.body).toEqual({ allow_run_without_asking: true });

    reply(jsonResponse({ allow_run_without_asking: true }));
    await pending;
    expect(cached(store)).toEqual({ allow_run_without_asking: true });
  });

  it('US-39 returns the cache to the saved value when the save fails', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ allow_run_without_asking: false }));
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleSettings.initiate({ projectId: 5 }));

    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'forbidden' }, 403));
    const result = await store.dispatch(
      scheduleApi.endpoints.updateScheduleSettings.initiate({ projectId: 5, allowRunWithoutAsking: true }),
    );

    expect(result.error.status).toBe(403);
    expect(cached(store)).toEqual({ allow_run_without_asking: false });
  });

  it('US-33 refetches the schedule list the form reads after a successful save', async () => {
    fetchSpy.mockImplementation(async arg =>
      arg.method === 'PUT'
        ? jsonResponse({ allow_run_without_asking: true })
        : jsonResponse({ total: 0, rows: [], run_without_asking_allowed: false }),
    );
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, pageSize: 1 }));
    const callsBefore = fetchSpy.mock.calls.length;

    await store.dispatch(
      scheduleApi.endpoints.updateScheduleSettings.initiate({ projectId: 5, allowRunWithoutAsking: true }),
    );

    await vi.waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore + 1));
    const refetch = await requestAt(fetchSpy, fetchSpy.mock.calls.length - 1);
    expect(refetch.url.pathname).toBe('/elitea_core/schedules/prompt_lib/5');
  });

  it('US-33 keeps the schedule list cache when the save fails', async () => {
    fetchSpy.mockImplementation(async arg =>
      arg.method === 'PUT' ? jsonResponse({ error: 'forbidden' }, 403) : jsonResponse({ total: 0, rows: [] }),
    );
    const store = makeStore();
    await store.dispatch(scheduleApi.endpoints.getScheduleList.initiate({ projectId: 5, pageSize: 1 }));
    const callsBefore = fetchSpy.mock.calls.length;

    await store.dispatch(
      scheduleApi.endpoints.updateScheduleSettings.initiate({ projectId: 5, allowRunWithoutAsking: true }),
    );

    expect(fetchSpy.mock.calls).toHaveLength(callsBefore + 1);
  });
});
