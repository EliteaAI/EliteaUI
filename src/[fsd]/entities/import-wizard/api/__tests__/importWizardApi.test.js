// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

vi.mock('@/api', () => {
  const TAG_TYPE_APPLICATIONS = 'Applications';
  const TAG_TYPE_TOTAL_APPLICATIONS = 'TotalApplications';
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://test.local' }),
    tagTypes: [TAG_TYPE_APPLICATIONS, TAG_TYPE_TOTAL_APPLICATIONS],
    endpoints: build => ({
      applicationList: build.query({
        query: projectId => `/applications/${projectId}`,
        providesTags: [TAG_TYPE_APPLICATIONS],
      }),
      totalApplications: build.query({
        query: projectId => `/applications/${projectId}?limit=1`,
        providesTags: [TAG_TYPE_TOTAL_APPLICATIONS],
      }),
    }),
  });
  return { eliteaApi, TAG_TYPE_APPLICATIONS, TAG_TYPE_TOTAL_APPLICATIONS };
});

const { configureStore } = await import('@reduxjs/toolkit');
const { importWizardApi } = await import('../importWizardApi.js');

const makeStore = () =>
  configureStore({
    reducer: { [importWizardApi.reducerPath]: importWizardApi.reducer },
    middleware: getDefault => getDefault().concat(importWizardApi.middleware),
  });

const requestedPaths = spy =>
  spy.mock.calls.map(([arg]) => {
    const url = new URL(arg instanceof Request ? arg.url : String(arg));
    return url.pathname + url.search;
  });

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('forkAgent cache invalidation', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
      );
  });

  it('refetches the destination project agent list and total after a fork lands in it', async () => {
    const store = makeStore();
    const { endpoints } = importWizardApi;
    store.dispatch(endpoints.applicationList.initiate(2));
    store.dispatch(endpoints.totalApplications.initiate(2));
    await flush();
    fetchSpy.mockClear();

    await store.dispatch(endpoints.forkAgent.initiate({ projectId: 2, body: {} }));
    await flush();

    expect(requestedPaths(fetchSpy)).toEqual(
      expect.arrayContaining(['/applications/2', '/applications/2?limit=1']),
    );
  });
});
