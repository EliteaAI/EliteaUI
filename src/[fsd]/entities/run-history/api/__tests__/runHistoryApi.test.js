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
const { runHistoryApi } = await import('../runHistoryApi.js');

const PATH = '/elitea_core/continue_predict/prompt_lib/7/conv-uuid-1';

const makeStore = () =>
  configureStore({
    reducer: { [runHistoryApi.reducerPath]: runHistoryApi.reducer },
    middleware: getDefault => getDefault().concat(runHistoryApi.middleware),
  });

const decide = async (action, fetchSpy) => {
  fetchSpy.mockResolvedValue(
    new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } }),
  );
  await makeStore().dispatch(
    runHistoryApi.endpoints.decideWaitingRun.initiate({
      projectId: 7,
      conversationUuid: 'conv-uuid-1',
      messageId: 42,
      action,
    }),
  );
  const request = fetchSpy.mock.calls[0][0];
  return { request, body: await request.json() };
};

describe('EL-7011 run history decideWaitingRun', () => {
  let fetchSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('R2.1 EL-7011: approve posts hitl_action approve with the paused message id to continue_predict', async () => {
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

  it('R2.2 EL-7011: reject posts hitl_action reject with the paused message id to continue_predict', async () => {
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
