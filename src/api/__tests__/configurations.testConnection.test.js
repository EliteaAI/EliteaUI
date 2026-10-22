import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';

import { configurationsApi } from '../configurations.js';
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

const sentUrl = async args => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  await makeStore().dispatch(configurationsApi.endpoints.testConfigurationConnection.initiate(args));
  const request = fetchMock.mock.calls[0][0];
  return new URL(request instanceof Request ? request.url : String(request), 'http://localhost');
};

describe('testConfigurationConnection request', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('carries configuration_uuid as a query param when given', async () => {
    const url = await sentUrl({ projectId: 7, configType: 'github', body: {}, configurationUuid: 'a b&c' });

    expect(url.pathname.endsWith('/configurations/check_connection/7/github')).toBe(true);
    expect(url.searchParams.get('configuration_uuid')).toBe('a b&c');
    expect([...url.searchParams.keys()]).toEqual(['configuration_uuid']);
  });

  it('adds no query param otherwise', async () => {
    const url = await sentUrl({ projectId: 7, configType: 'github', body: {} });

    expect(url.search).toBe('');
  });
});
