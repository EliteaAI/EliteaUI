// @vitest-environment jsdom
import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { eliteaApi } from '@/api';

import { generateScheduleDraftApi } from '../generateScheduleDraftApi';

// The real eliteaApi lives in a circular store import; a bare api with the same shape is enough here.
vi.mock('@/api', () => ({
  eliteaApi: createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost/api/v2' }),
    endpoints: () => ({}),
  }),
}));

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
      .mockResolvedValue(Response.json(draft, { status: 200 }));
    const body = { prompt: 'p', current: {}, locked_entity: null, timezone: 'UTC' };

    const result = await makeStore().dispatch(
      generateScheduleDraftApi.endpoints.generateScheduleDraft.initiate({ projectId: 7, ...body }),
    );

    const request = fetchMock.mock.calls[0][0];
    expect(request.url).toContain('/elitea_core/generate_schedule_draft/prompt_lib/7');
    expect(request.method).toBe('POST');
    expect(await request.json()).toEqual(body);
    expect(result.data).toEqual(draft);
  });

  it('exposes the mutation hook from the api index', async () => {
    const api = await import('../index');
    expect(typeof api.useGenerateScheduleDraftMutation).toBe('function');
  });
});
