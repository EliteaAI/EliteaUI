// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

vi.mock('@/api/eliteaApi.js', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  const { middleware, reducer, reducerPath } = eliteaApi;
  return { eliteaApi, middleware, reducer, reducerPath };
});

const { configureStore } = await import('@reduxjs/toolkit');
const { eliteaApi } = await import('@/api/eliteaApi.js');
await import('../runHistoryApi.js');

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

const CHAT_RUN = { id: 1, created_at: '2026-10-26T16:36:00Z', name: 'chat', meta: {}, skill_version_id: 88 };
const RUN_PANEL_RUN = {
  id: 2,
  created_at: '2026-10-26T15:00:00Z',
  name: 'run',
  meta: { single_participant: { entity_name: 'skill', entity_meta: { id: 629, project_id: 2 } } },
};

const listRows = async args => {
  const store = makeStore();
  const { data } = await store.dispatch(
    eliteaApi.endpoints.getRunHistoryList.initiate({ projectId: 2, ...args }),
  );
  return data.rows;
};

describe('getRunHistoryList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(JSON.stringify({ total: 2, rows: [CHAT_RUN, RUN_PANEL_RUN] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
  });

  it('tells a skill chat run from the skill own Run panel run', async () => {
    const rows = await listRows({ source: 'skill', entityId: '629' });

    expect(rows.map(row => [row.id, row.is_chat_run])).toEqual([
      [1, true],
      [2, false],
    ]);
  });

  it('marks no chat runs in a toolkit history', async () => {
    const rows = await listRows({ source: 'toolkit', entityId: '56' });

    expect(rows.map(row => row.is_chat_run)).toEqual([false, false]);
  });
});
