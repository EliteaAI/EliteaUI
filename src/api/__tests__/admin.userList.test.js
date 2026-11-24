// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

import { apis } from '../admin.js';
import { eliteaApi } from '../eliteaApi.js';

vi.mock('@/common/constants.js', async importOriginal => ({
  ...(await importOriginal()),
  VITE_SERVER_URL: 'http://localhost/api/v2',
}));
vi.mock('@/common/utils.jsx', async importOriginal => ({
  ...(await importOriginal()),
  convertToJson: v => v,
}));

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

const jsonResponse = body =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

const requestUrl = call =>
  new URL(call[0] instanceof Request ? call[0].url : String(call[0]), 'http://localhost');

const rowsOf = (from, count) => Array.from({ length: count }, (_, index) => ({ id: from + index }));

const args = patch => ({
  projectId: 7,
  page: 0,
  pageSize: 20,
  params: { sort_by: 'name', sort_order: 'asc', query: '' },
  ...patch,
});

describe('userList cacheKey', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the loaded pages of a list with its own cacheKey when another list reloads page 0', async () => {
    const fetchMock = vi.fn(async call => {
      const offset = Number(requestUrl([call]).searchParams.get('offset'));
      return jsonResponse({ rows: rowsOf(offset + 1, 20), total: 60 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();
    const { userList } = apis.endpoints;

    await store.dispatch(userList.initiate(args({ cacheKey: 'mentions' })));
    await store.dispatch(userList.initiate(args({ cacheKey: 'mentions', page: 1 })));
    await store.dispatch(userList.initiate(args()));

    const mentions = userList.select(args({ cacheKey: 'mentions', page: 1 }))(store.getState());
    expect(mentions.data.rows).toHaveLength(40);
    expect(fetchMock.mock.calls.map(call => requestUrl(call).searchParams.has('cacheKey'))).toEqual([
      false,
      false,
      false,
    ]);
  });
});
