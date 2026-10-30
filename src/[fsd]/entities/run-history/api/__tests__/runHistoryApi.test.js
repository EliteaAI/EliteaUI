// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// The real `@/api/eliteaApi.js` boots the app store, which cannot run under the test
// environment. A minimal RTK Query base lets the endpoints inject into a real slice.
vi.mock('@/api/eliteaApi.js', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  return { eliteaApi };
});

// Heavy neighbours of the API module reach the app store; the endpoints do not need them here.
vi.mock('@/[fsd]/entities/run-history/lib', () => ({ serializeRunHistoryListResponse: vi.fn() }));
vi.mock('@/[fsd]/shared/lib/constants', () => ({
  ParticipantEntityConstants: { ParticipantEntityTypes: { Toolkit: 'toolkit', MCP: 'mcp', Skill: 'skill' } },
}));
vi.mock('@/common/constants', () => ({ PAGE_SIZE: 20 }));

const { configureStore } = await import('@reduxjs/toolkit');
const { runHistoryApi, HISTORY_ITEMS_TAG } = await import('../runHistoryApi.js');
const { serializeRunHistoryListResponse } = await import('@/[fsd]/entities/run-history/lib');

const PATH = '/elitea_core/continue_predict/prompt_lib/7/conv-uuid-1';

const makeStore = () =>
  configureStore({
    reducer: { [runHistoryApi.reducerPath]: runHistoryApi.reducer },
    middleware: getDefault => getDefault().concat(runHistoryApi.middleware),
  });

const decide = async (action, fetchSpy, extra = {}) => {
  fetchSpy.mockResolvedValue(
    new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } }),
  );
  await makeStore().dispatch(
    runHistoryApi.endpoints.decideWaitingRun.initiate({
      projectId: 7,
      conversationUuid: 'conv-uuid-1',
      messageId: 42,
      action,
      ...extra,
    }),
  );
  const request = fetchSpy.mock.calls[0][0];
  return { request, body: await request.json() };
};

describe('run history decideWaitingRun', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('approve posts hitl_action approve with the paused message id to continue_predict', async () => {
    const { request, body } = await decide('approve', fetchSpy);

    expect(request.method).toBe('POST');
    expect(new URL(request.url).pathname).toBe(PATH);
    expect(body).toEqual({
      message_id: 42,
      hitl_resume: true,
      hitl_action: 'approve',
      await_task_timeout: -1,
    });
  });

  it('reject posts hitl_action reject with the paused message id to continue_predict', async () => {
    const { request, body } = await decide('reject', fetchSpy);

    expect(request.method).toBe('POST');
    expect(new URL(request.url).pathname).toBe(PATH);
    expect(body).toEqual({
      message_id: 42,
      hitl_resume: true,
      hitl_action: 'reject',
      await_task_timeout: -1,
    });
  });
});

describe('run history decideWaitingRun for a sign-in pause', () => {
  let fetchSpy;
  const mcpAuth = {
    authorizationRequestId: 'auth-1',
    toolCallId: 'call-1',
    childThreadId: undefined,
    mcpTokens: { 'https://mcp.example': { access_token: 'fresh' } },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('approve authorizes with the request id and the fresh tokens, without hitl fields', async () => {
    const { body } = await decide('approve', fetchSpy, { mcpAuth });

    expect(body).toEqual({
      message_id: 42,
      mcp_auth_resume: true,
      mcp_auth_action: 'authorize',
      authorization_request_id: 'auth-1',
      mcp_auth_decisions: [
        { interrupt_id: 'auth-1', tool_call_id: 'call-1', action: 'authorize', value: '' },
      ],
      mcp_tokens: mcpAuth.mcpTokens,
      await_task_timeout: -1,
    });
  });

  it('reject skips the sign-in and sends no tokens', async () => {
    const { body } = await decide('reject', fetchSpy, { mcpAuth });

    expect(body.mcp_auth_resume).toBe(true);
    expect(body.mcp_auth_action).toBe('skip');
    expect(body.mcp_auth_decisions[0].action).toBe('skip');
    expect(body).not.toHaveProperty('mcp_tokens');
    expect(body).not.toHaveProperty('hitl_resume');
  });
});

describe('run history cache tags', () => {
  let fetchSpy;

  const respond = body =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

  const loadList = async store => {
    serializeRunHistoryListResponse.mockReturnValue({ rows: [{ id: 1 }, { id: 2 }] });
    fetchSpy.mockImplementation(async () => respond([]));
    await store.dispatch(
      runHistoryApi.endpoints.getRunHistoryList.initiate({ source: 'agent', projectId: 7, entityId: 3 }),
    );
  };

  const requests = () =>
    fetchSpy.mock.calls.map(([request]) => `${request.method} ${new URL(request.url).pathname}`);

  const invalidatedBy = (store, id) =>
    runHistoryApi.util
      .selectInvalidatedBy(store.getState(), [{ type: HISTORY_ITEMS_TAG, id }])
      .map(entry => entry.endpointName);

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('list is provided under the LIST tag and one tag per row id', async () => {
    const store = makeStore();
    await loadList(store);

    expect(invalidatedBy(store, 'LIST')).toEqual(['getRunHistoryList']);
    expect(invalidatedBy(store, 1)).toEqual(['getRunHistoryList']);
    expect(invalidatedBy(store, 2)).toEqual(['getRunHistoryList']);
    expect(invalidatedBy(store, 3)).toEqual([]);
  });

  it('delete hides the item and refetches the list', async () => {
    const store = makeStore();
    await loadList(store);
    fetchSpy.mockClear();

    await store.dispatch(
      runHistoryApi.endpoints.deleteRunHistoryItem.initiate({ projectId: 7, historyId: 2 }),
    );
    await vi.waitFor(() => expect(requests()).toHaveLength(2));

    expect(requests()[0]).toBe('PUT /elitea_core/conversation/prompt_lib/7/2');
    expect(requests()[1]).toMatch(/^GET \/elitea_core\/conversations\/prompt_lib\/7$/);
  });
});
