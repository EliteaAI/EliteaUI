// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { eliteaApi } from '@/api';
import { configureStore } from '@reduxjs/toolkit';

import { generateScheduleDraftApi } from '../generateScheduleDraftApi';

// The real eliteaApi lives in a circular store import; a bare api with the same shape is enough here.
// The factory imports RTK Query itself, because the sorted imports run after the hoisted mock.
vi.mock('@/api', async () => {
  const { createApi, fetchBaseQuery } = await import('@reduxjs/toolkit/query/react');
  return {
    eliteaApi: createApi({
      reducerPath: 'eliteaApi',
      baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost/api/v2' }),
      endpoints: () => ({}),
    }),
  };
});

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

describe('R2.1 EL-7011 generateScheduleDraft', () => {
  afterEach(() => vi.restoreAllMocks());

  it('posts the body to the project draft url without projectId', async () => {
    const draft = { draft: { name: 'n' }, warnings: [] };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(draft), { status: 200, headers: { 'content-type': 'application/json' } }),
      );
    const body = { prompt: 'p', current: {}, locked_entity: null, timezone: 'UTC' };

    const result = await makeStore().dispatch(
      generateScheduleDraftApi.endpoints.generateScheduleDraft.initiate({ projectId: 7, ...body }),
    );

    const request = fetchMock.mock.calls[0][0];
    expect(request.url).toContain('/elitea_core/schedules/prompt_lib/7/draft');
    expect(request.method).toBe('POST');
    expect(await request.json()).toEqual(body);
    expect(result.data).toEqual(draft);
  });

  it('exposes the mutation hook from the api index', async () => {
    const api = await import('../index');
    expect(typeof api.useGenerateScheduleDraftMutation).toBe('function');
  });
});
