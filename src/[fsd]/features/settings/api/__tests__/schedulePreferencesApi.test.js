// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// The real `@/api` barrel boots the app store, which cannot run under the test
// environment. A minimal RTK Query base lets the endpoints inject into a real slice.
vi.mock('@/api', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  return { eliteaApi };
});

const { configureStore } = await import('@reduxjs/toolkit');
const { schedulePreferencesApi } = await import('../schedulePreferencesApi.js');

const PATH = '/elitea_core/schedules/prompt_lib/7/preferences';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const requestOf = (spy, index = 0) => {
  const arg = spy.mock.calls[index]?.[0];
  return arg instanceof Request ? arg : new Request(String(arg));
};

const makeStore = () =>
  configureStore({
    reducer: { [schedulePreferencesApi.reducerPath]: schedulePreferencesApi.reducer },
    middleware: getDefault => getDefault().concat(schedulePreferencesApi.middleware),
  });

const cached = store =>
  schedulePreferencesApi.endpoints.getSchedulePreferences.select({ projectId: 7 })(store.getState()).data;

describe('schedule preferences API', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('loads the value of the current user and project with GET', async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ get_notified: false }));
    const store = makeStore();

    const result = await store.dispatch(
      schedulePreferencesApi.endpoints.getSchedulePreferences.initiate({ projectId: 7 }),
    );

    const request = requestOf(fetchSpy);
    expect(request.method).toBe('GET');
    expect(new URL(request.url).pathname).toBe(PATH);
    expect(result.data).toEqual({ get_notified: false });
  });

  it('sends the new value with PUT at once and updates the cache before the reply', async () => {
    let reply;
    fetchSpy.mockResolvedValueOnce(jsonResponse({ get_notified: true }));
    const store = makeStore();
    await store.dispatch(schedulePreferencesApi.endpoints.getSchedulePreferences.initiate({ projectId: 7 }));

    fetchSpy.mockReturnValueOnce(new Promise(resolve => (reply = resolve)));
    const pending = store.dispatch(
      schedulePreferencesApi.endpoints.updateSchedulePreferences.initiate({
        projectId: 7,
        getNotified: false,
      }),
    );

    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(cached(store)).toEqual({ get_notified: false });
    const request = requestOf(fetchSpy, 1);
    expect(request.method).toBe('PUT');
    expect(new URL(request.url).pathname).toBe(PATH);
    expect(await request.json()).toEqual({ get_notified: false });

    reply(jsonResponse({ get_notified: false }));
    await pending;
    expect(cached(store)).toEqual({ get_notified: false });
  });

  it('returns the cache to the saved value when the save fails', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ get_notified: true }));
    const store = makeStore();
    await store.dispatch(schedulePreferencesApi.endpoints.getSchedulePreferences.initiate({ projectId: 7 }));

    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 500));
    const result = await store.dispatch(
      schedulePreferencesApi.endpoints.updateSchedulePreferences.initiate({
        projectId: 7,
        getNotified: false,
      }),
    );

    expect(result.error).toBeDefined();
    expect(cached(store)).toEqual({ get_notified: true });
  });
});
