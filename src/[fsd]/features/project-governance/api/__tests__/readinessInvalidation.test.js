// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// (#7269) The Save card reads readiness again after every successful save of a version or a toolkit, whichever page
// saved it: the mutations invalidate its tag (no reload, no manual refetch in one button). A real RTK Query slice
// stands in for the app's (whose barrel boots the app store).
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));
const slice = vi.hoisted(() => ({ api: null }));
const makeApi = () => {
  slice.api =
    slice.api ||
    createApi({
      reducerPath: 'eliteaApi',
      baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
      tagTypes: [],
      endpoints: () => ({}),
    });
  return slice.api;
};
vi.mock('@/api/eliteaApi.js', () => {
  const api = makeApi();
  return { eliteaApi: api, reducer: api.reducer, middleware: api.middleware, reducerPath: api.reducerPath };
});
vi.mock('@/api', () => {
  const api = makeApi();
  return { eliteaApi: api, reducer: api.reducer, middleware: api.middleware, reducerPath: api.reducerPath };
});

vi.mock('@/[fsd]/shared/config/store', () => ({ default: { getState: () => ({}), dispatch: () => {} } }));

const { configureStore } = await import('@reduxjs/toolkit');
const { projectGovernanceApi } = await import('../projectGovernanceApi.js');
const { apiSlice: applicationsApi } = await import('@/api/applications');
const { toolkitsApi } = await import('@/api/toolkits');

const READINESS = '/elitea_core/governance_readiness/prompt_lib/8/version/1';
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const urlOf = call => (call[0] instanceof Request ? call[0].url : String(call[0]));

const makeStore = () =>
  configureStore({
    reducer: { eliteaApi: projectGovernanceApi.reducer },
    middleware: getDefault => getDefault().concat(projectGovernanceApi.middleware),
  });

const readinessCalls = spy => spy.mock.calls.filter(call => urlOf(call).includes(READINESS)).length;
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe('readiness is read again after a successful save (EL-7269)', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  const run = async (mutation, args, status = 200) => {
    fetchSpy.mockImplementation(async request =>
      urlOf([request]).includes(READINESS)
        ? json({ items: [] })
        : json(status === 200 ? { ok: true } : {}, status),
    );
    const store = makeStore();
    const subscription = store.dispatch(
      projectGovernanceApi.endpoints.getGovernanceReadiness.initiate({
        projectId: 8,
        entityKind: 'version',
        entityId: 1,
      }),
    );
    await subscription;
    expect(readinessCalls(fetchSpy)).toBe(1);
    await store.dispatch(mutation.initiate(args));
    await settle();
    await settle();
    const calls = readinessCalls(fetchSpy);
    subscription.unsubscribe();
    return calls;
  };

  it.each([
    [
      'the page Save (application edit)',
      () => applicationsApi.endpoints.applicationEdit,
      { projectId: 8, id: 1 },
    ],
    [
      'Save As Version',
      () => applicationsApi.endpoints.saveApplicationNewVersion,
      { projectId: 8, applicationId: 1, name: 'v2' },
    ],
    [
      'a toolkit added under Tools',
      () => toolkitsApi.endpoints.toolkitAssociate,
      { projectId: 8, toolkitId: 1, entity_id: 1, entity_version_id: 1 },
    ],
    ['the toolkit page Save', () => toolkitsApi.endpoints.toolkitEdit, { projectId: 8, toolId: 1 }],
    [
      'your own credential value written from the card',
      () => projectGovernanceApi.endpoints.putMyCredentialValue,
      { projectId: 8, referenceId: 'ref-1', fields: { token: 't' }, expectedGeneration: 0 },
    ],
  ])('%s', async (_label, mutation, args) => {
    expect(await run(mutation(), args)).toBe(2);
  });

  it('a failed save does not read it again', async () => {
    expect(await run(applicationsApi.endpoints.applicationEdit, { projectId: 8, id: 1 }, 500)).toBe(1);
  });
});
