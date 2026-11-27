import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

import { apis } from '../admin.js';
import { eliteaApi } from '../eliteaApi.js';
import { projectApi } from '../project.js';

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

const requestOf = call => (call[0] instanceof Request ? call[0] : new Request(String(call[0])));

// Answers the delete with `deleteStatus` and everything else with an empty list
const mockFetch = deleteStatus =>
  vi.fn(async input => {
    const request = input instanceof Request ? input : new Request(String(input));
    if (request.method === 'DELETE') {
      return deleteStatus === 204
        ? new Response(null, { status: 204 })
        : jsonResponse({ error: 'no' }, deleteStatus);
    }
    return jsonResponse([]);
  });

const projectListCalls = fetchMock =>
  fetchMock.mock.calls.filter(call => requestOf(call).url.includes('/projects/project/'));

const settle = () => new Promise(resolve => setTimeout(resolve, 20));

const deleteUsers = async (store, args) => {
  const subscription = store.dispatch(projectApi.endpoints.projectList.initiate());
  await subscription;
  const result = await store.dispatch(apis.endpoints.userDelete.initiate(args));
  await settle();
  subscription.unsubscribe();
  return result;
};

describe('userDelete', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('refetches the project list when the user removes themselves', async () => {
    const fetchMock = mockFetch(204);
    vi.stubGlobal('fetch', fetchMock);

    await deleteUsers(makeStore(), { projectId: 7, removesSelf: true, params: { ids: [1] } });

    expect(projectListCalls(fetchMock)).toHaveLength(2);
  });

  it('keeps the project list when the self-removal fails', async () => {
    const fetchMock = mockFetch(403);
    vi.stubGlobal('fetch', fetchMock);

    const result = await deleteUsers(makeStore(), { projectId: 7, removesSelf: true, params: { ids: [1] } });

    expect(result.error?.status).toBe(403);
    expect(projectListCalls(fetchMock)).toHaveLength(1);
  });

  it('keeps the project list when other users are removed', async () => {
    const fetchMock = mockFetch(204);
    vi.stubGlobal('fetch', fetchMock);

    await deleteUsers(makeStore(), { projectId: 7, removesSelf: false, params: { ids: [2] } });

    expect(projectListCalls(fetchMock)).toHaveLength(1);
  });
});
