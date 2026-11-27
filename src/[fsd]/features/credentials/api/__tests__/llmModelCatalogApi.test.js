// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// The real `@/api` barrel boots the app store; a minimal RTK Query base lets the slice inject for real
vi.mock('@/api', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  return { eliteaApi };
});

const { eliteaApi } = await import('@/api');
await import('@/[fsd]/features/credentials/api/llmModelCatalogApi');

const CATALOG = { prefixes: { open_ai: 'openai' }, models: { 'gpt-5.6-luna': { provider: 'openai' } } };

const fetchCatalog = async (answer, projectId = 2) => {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify(answer), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  );
  vi.stubGlobal('fetch', fetchMock);
  const store = configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(eliteaApi.middleware),
  });
  const result = await store.dispatch(eliteaApi.endpoints.llmModelCatalog.initiate({ projectId }));
  return { result, store, fetchMock };
};

describe('llmModelCatalogApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the catalog the endpoint serves', async () => {
    const { result } = await fetchCatalog(CATALOG);
    expect(result.isSuccess).toBe(true);
    expect(result.data).toEqual(CATALOG);
  });

  it.each([
    ['no models', { prefixes: {}, models: {} }],
    ['no models key', { prefixes: {} }],
  ])('treats an answer with %s as a failed request, so it is asked again', async (_label, answer) => {
    const { result } = await fetchCatalog(answer);
    expect(result.isError).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('keeps one cached catalog whatever project asks for it', async () => {
    const { store, fetchMock } = await fetchCatalog(CATALOG, 2);
    await store.dispatch(eliteaApi.endpoints.llmModelCatalog.initiate({ projectId: 7 }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
