// @vitest-environment jsdom
//
// The project's consent to evaluating agents from chat history: a GET, and a PUT that always sends a
// boolean, so a missing value can never be read as consent.
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
const { historyEvaluationConsentApi } = await import('../historyEvaluationConsentApi.js');

const PATH = '/elitea_core/eval_history_consent/prompt_lib/2';

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
    reducer: { [historyEvaluationConsentApi.reducerPath]: historyEvaluationConsentApi.reducer },
    middleware: getDefault => getDefault().concat(historyEvaluationConsentApi.middleware),
  });

const cached = store =>
  historyEvaluationConsentApi.endpoints.evalHistoryConsent.select({ projectId: 2 })(store.getState()).data;

const loadConsent = async (store, consent) => {
  globalThis.fetch.mockResolvedValueOnce(jsonResponse({ history_evaluation_consent: consent }));
  await store.dispatch(historyEvaluationConsentApi.endpoints.evalHistoryConsent.initiate({ projectId: 2 }));
};

describe('chat history evaluation consent API', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('reads the consent of the project with GET', async () => {
    const store = makeStore();
    await loadConsent(store, true);

    const request = requestOf(fetchSpy);
    expect(request.method).toBe('GET');
    expect(new URL(request.url).pathname).toBe(PATH);
    expect(cached(store)).toEqual({ history_evaluation_consent: true });
  });

  it('sends the new value with PUT and updates the cache before the reply', async () => {
    let reply;
    const store = makeStore();
    await loadConsent(store, false);

    fetchSpy.mockReturnValueOnce(new Promise(resolve => (reply = resolve)));
    const pending = store.dispatch(
      historyEvaluationConsentApi.endpoints.setEvalHistoryConsent.initiate({ projectId: 2, consent: true }),
    );

    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(cached(store)).toEqual({ history_evaluation_consent: true });
    const request = requestOf(fetchSpy, 1);
    expect(request.method).toBe('PUT');
    expect(new URL(request.url).pathname).toBe(PATH);
    expect(await request.json()).toEqual({ history_evaluation_consent: true });

    reply(jsonResponse({ history_evaluation_consent: true }));
    await pending;
    expect(cached(store)).toEqual({ history_evaluation_consent: true });
  });

  it('returns the cache to the saved value when the save fails', async () => {
    const store = makeStore();
    await loadConsent(store, false);

    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 500));
    const result = await store.dispatch(
      historyEvaluationConsentApi.endpoints.setEvalHistoryConsent.initiate({ projectId: 2, consent: true }),
    );

    expect(result.error).toBeDefined();
    expect(cached(store)).toEqual({ history_evaluation_consent: false });
  });

  it('sends false, never an empty body, when the consent is missing', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ history_evaluation_consent: false }));
    const store = makeStore();

    await store.dispatch(
      historyEvaluationConsentApi.endpoints.setEvalHistoryConsent.initiate({ projectId: 2 }),
    );

    expect(await requestOf(fetchSpy).json()).toEqual({ history_evaluation_consent: false });
  });
});
