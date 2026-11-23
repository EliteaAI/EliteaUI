import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

import { apis } from '../admin.js';
import { eliteaApi } from '../eliteaApi.js';

// Env-dependent app modules; the request shape is all this test reads
vi.mock('@/common/constants.js', async importOriginal => ({
  ...(await importOriginal()),
  VITE_SERVER_URL: 'http://localhost/api/v2',
}));
vi.mock('@/common/utils.jsx', () => ({ convertToJson: v => v, removeDuplicateObjects: v => v }));

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const requestUrl = call =>
  new URL(call[0] instanceof Request ? call[0].url : String(call[0]), 'http://localhost');

const rowsOf = ids => ids.map(id => ({ id, name: `User ${id}` }));

describe('projectMemberIds', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('reads every page of the users list with an explicit limit', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => index + 1);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ rows: rowsOf(firstPage), total: 102 }))
      .mockResolvedValueOnce(jsonResponse({ rows: rowsOf([101, 102]), total: 102 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await makeStore().dispatch(apis.endpoints.projectMemberIds.initiate({ projectId: 7 }));

    expect(result.data).toHaveLength(102);
    expect(result.data.at(-1)).toBe(102);
    const urls = fetchMock.mock.calls.map(requestUrl);
    expect(urls.map(url => url.pathname.endsWith('/admin/users/default/7'))).toEqual([true, true]);
    expect(urls.map(url => url.searchParams.get('limit'))).toEqual(['100', '100']);
    expect(urls.map(url => url.searchParams.get('offset'))).toEqual(['0', '100']);
  });

  it('returns the error instead of a partial list when a page fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'boom' }, 500)));

    const result = await makeStore().dispatch(apis.endpoints.projectMemberIds.initiate({ projectId: 7 }));

    expect(result.data).toBeUndefined();
    expect(result.error?.status).toBe(500);
  });
});
