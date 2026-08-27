// @vitest-environment jsdom
//
// The dimension list is already scoped by agent_id; updateEvalDimension/deleteEvalDimension
// previously sent no agent context at all, so a mutation could silently bypass the scope the
// list enforces. This pins that both mutations forward agentId as the `agent_id` query param
// the backend endpoints accept, and that omitting it (project-tier dimensions) sends no param.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

import { evaluationApi } from '../evaluationApi';

// evaluationApi.js only needs eliteaApi from the '@/api' barrel; the barrel itself re-exports
// dozens of unrelated slices (import-wizard, settings, ...) that touch browser globals at
// module scope and aren't relevant here, so mock it down to just eliteaApi.
vi.mock('@/api', async () => {
  const { eliteaApi } = await vi.importActual('@/api/eliteaApi');
  return { eliteaApi };
});

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
      return new Response(JSON.stringify({}), { status: 200 });
    }),
  );
  return calls;
};

describe('evaluationApi — dimension mutation agent scoping', () => {
  let store;
  let calls;

  beforeEach(() => {
    store = buildStore();
    calls = captureFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('updateEvalDimension forwards agentId as agent_id', async () => {
    await store.dispatch(
      evaluationApi.endpoints.updateEvalDimension.initiate({
        projectId: 2,
        dimensionId: 5,
        agentId: 42,
        body: { name: 'Correctness' },
      }),
    );

    expect(calls).toHaveLength(1);
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe('/api/v2/elitea_core/eval_dimension/prompt_lib/2/5');
    expect(url.searchParams.get('agent_id')).toBe('42');
    expect(calls[0].method).toBe('PUT');
  });

  it('updateEvalDimension omits agent_id when agentId is not provided', async () => {
    await store.dispatch(
      evaluationApi.endpoints.updateEvalDimension.initiate({
        projectId: 2,
        dimensionId: 5,
        body: { name: 'Correctness' },
      }),
    );

    expect(calls).toHaveLength(1);
    const url = new URL(calls[0].url);
    expect(url.searchParams.has('agent_id')).toBe(false);
  });

  it('deleteEvalDimension forwards agentId as agent_id', async () => {
    await store.dispatch(
      evaluationApi.endpoints.deleteEvalDimension.initiate({
        projectId: 2,
        dimensionId: 5,
        agentId: 42,
      }),
    );

    expect(calls).toHaveLength(1);
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe('/api/v2/elitea_core/eval_dimension/prompt_lib/2/5');
    expect(url.searchParams.get('agent_id')).toBe('42');
    expect(calls[0].method).toBe('DELETE');
  });

  it('deleteEvalDimension omits agent_id when agentId is not provided', async () => {
    await store.dispatch(
      evaluationApi.endpoints.deleteEvalDimension.initiate({
        projectId: 2,
        dimensionId: 5,
      }),
    );

    expect(calls).toHaveLength(1);
    const url = new URL(calls[0].url);
    expect(url.searchParams.has('agent_id')).toBe(false);
  });
});
