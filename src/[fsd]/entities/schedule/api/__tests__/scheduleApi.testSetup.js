import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Use inside vi.mock('@/api/eliteaApi.js', ...): a bare eliteaApi on a test base URL.
export const createEliteaApiMock = () => ({
  eliteaApi: createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  }),
});

export const makeStore = api =>
  configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: getDefault => getDefault().concat(api.middleware),
  });

export const requestedUrls = spy =>
  spy.mock.calls.map(([arg]) => new URL(arg instanceof Request ? arg.url : String(arg)));

export const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
