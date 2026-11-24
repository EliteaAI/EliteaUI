// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/api/eliteaApi.js', () => {
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
    keepUnusedDataFor: 0,
  });
  return { eliteaApi };
});

const { configureStore } = await import('@reduxjs/toolkit');
const { eliteaApi } = await import('@/api/eliteaApi.js');
const { useSkillVersionFileTexts } = await import('../useSkillVersionFileTexts.hooks');

const SCOPE = { projectId: 2, skillId: 7, versionId: 70 };
const PATHS = ['a.md'];

describe('useSkillVersionFileTexts', () => {
  let fetchSpy;
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('hello', { status: 200 }));
  });

  it('fetches the text of each path, keeps it while mounted, and lets it go after', async () => {
    const store = configureStore({
      reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
      middleware: getDefault => getDefault().concat(eliteaApi.middleware),
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result, rerender, unmount } = renderHook(() => useSkillVersionFileTexts(SCOPE, PATHS), {
      wrapper,
    });
    await waitFor(() => expect(result.current).toEqual({ 'a.md': 'hello' }));
    rerender();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(result.current).toEqual({ 'a.md': 'hello' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    unmount();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(Object.keys(store.getState().eliteaApi.queries)).toHaveLength(0);
  });

  it('does not ask again for a text that failed when the same paths come as a new list', async () => {
    fetchSpy.mockImplementation(async () => new Response('down', { status: 500 }));
    const store = configureStore({
      reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
      middleware: getDefault => getDefault().concat(eliteaApi.middleware),
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { rerender } = renderHook(() => useSkillVersionFileTexts(SCOPE, ['a.md']), { wrapper });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    rerender();
    rerender();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
