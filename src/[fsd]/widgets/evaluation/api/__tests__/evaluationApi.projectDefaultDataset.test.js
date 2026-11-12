// @vitest-environment jsdom
//
// The project's default eval dataset: a project-level GET and a PUT that sends dataset_id, with null
// clearing it rather than an omitted key the backend would read the same way by accident.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

// evaluationApi.js only needs eliteaApi from the '@/api' barrel; the barrel itself re-exports
// dozens of unrelated slices (import-wizard, settings, ...) that touch browser globals at
// module scope and aren't relevant here, so mock it down to just eliteaApi.
vi.mock('@/api', async () => {
  const { eliteaApi } = await vi.importActual('@/api/eliteaApi');
  return { eliteaApi };
});

// '@/api/applications' is only read for a tag-name constant, but importing it for real pulls in
// '@/common/utils.jsx' and through it the whole Redux store, whose reducers then resolve endpoints
// off a half-initialised api module. Stub it down to the one constant evaluationApi.js uses.
vi.mock('@/api/applications', () => ({
  TAG_TYPE_APPLICATION_DETAILS: 'TAG_TYPE_APPLICATION_DETAILS',
}));

// fetchBaseQuery builds a Request before it calls fetch, and the Node Request implementation
// used under vitest rejects the relative VITE_SERVER_URL the app ships with. Seed the runtime
// config getEnvVar reads first — before the api module is imported — so the base query gets the
// same /api/v2 prefix behind an absolute origin, independent of any local .env.
globalThis.elitea_ui_config = {
  ...globalThis.elitea_ui_config,
  vite_server_url: 'http://localhost/api/v2/',
};

const { evaluationApi } = await import('../evaluationApi');

const buildStore = () =>
  configureStore({
    reducer: { [evaluationApi.reducerPath]: evaluationApi.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(evaluationApi.middleware),
  });

// fetchBaseQuery reads the URL/method/params it was asked to fetch from the Request it builds
// out of our arg — stubbing global fetch lets us capture that request without a real network call.
const captureFetch = () => {
  const calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async request => {
      calls.push(request);
      return new Response(JSON.stringify({ dataset_id: 9, name: 'Shared set' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }),
  );
  return calls;
};

describe('evaluationApi — project default dataset', () => {
  let store;
  let calls;

  beforeEach(() => {
    store = buildStore();
    calls = captureFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the default of the project with GET', async () => {
    const result = await store.dispatch(
      evaluationApi.endpoints.projectDefaultEvalDataset.initiate({ projectId: 2 }),
    );

    expect(calls).toHaveLength(1);
    expect(new URL(calls[0].url).pathname).toBe(
      '/api/v2/elitea_core/eval_project_default_dataset/prompt_lib/2',
    );
    expect(calls[0].method).toBe('GET');
    expect(result.data).toEqual({ dataset_id: 9, name: 'Shared set' });
  });

  it('sets the default with PUT', async () => {
    await store.dispatch(
      evaluationApi.endpoints.setProjectDefaultEvalDataset.initiate({ projectId: 2, datasetId: 9 }),
    );

    expect(calls[0].method).toBe('PUT');
    expect(await calls[0].json()).toEqual({ dataset_id: 9 });
  });

  it('clears the default with an explicit null', async () => {
    await store.dispatch(
      evaluationApi.endpoints.setProjectDefaultEvalDataset.initiate({ projectId: 2, datasetId: undefined }),
    );

    expect(await calls[0].json()).toEqual({ dataset_id: null });
  });
});
