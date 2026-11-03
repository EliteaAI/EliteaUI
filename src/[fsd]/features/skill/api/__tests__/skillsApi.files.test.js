// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

vi.mock('@/api/eliteaApi.js', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  const { middleware, reducer, reducerPath } = eliteaApi;
  return { eliteaApi, middleware, reducer, reducerPath };
});

const { configureStore } = await import('@reduxjs/toolkit');
const { eliteaApi } = await import('@/api/eliteaApi.js');
await import('../skillsApi.js');

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

const sentRequest = spy => spy.mock.calls.at(-1)[0];

describe('skill version files API', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ id: 71 }, 201));
  });

  it('asks a new version to copy the files of the version it was saved from', async () => {
    await makeStore().dispatch(
      eliteaApi.endpoints.skillCreateVersion.initiate({
        projectId: 2,
        skillId: 7,
        name: 'v2',
        instructions: 'Fill it.',
        filesFromVersionId: 70,
      }),
    );

    const request = sentRequest(fetchSpy);
    expect(request.url).toBe('https://test.local/elitea_core/skill/prompt_lib/2/7');
    expect(await request.json()).toMatchObject({ name: 'v2', files_from_version_id: 70 });
  });

  it('creates a version without a file source when none is given', async () => {
    await makeStore().dispatch(
      eliteaApi.endpoints.skillCreateVersion.initiate({
        projectId: 2,
        skillId: 7,
        name: 'v2',
        instructions: 'i',
      }),
    );

    expect(await sentRequest(fetchSpy).json()).not.toHaveProperty('files_from_version_id');
  });
});
