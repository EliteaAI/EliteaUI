// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/api/eliteaApi.js', async () => {
  const { createApi, fetchBaseQuery } = await import('@reduxjs/toolkit/query/react');
  const eliteaApi = createApi({
    reducerPath: 'eliteaApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://test.local' }),
    tagTypes: [],
    endpoints: () => ({}),
  });
  const { middleware, reducer, reducerPath } = eliteaApi;
  return { eliteaApi, middleware, reducer, reducerPath };
});
vi.mock('@/[fsd]/shared/ui', async importOriginal => ({
  ...(await importOriginal()),
  Field: {
    CodeMirrorEditor: props => (
      <div
        data-testid="file-text"
        data-value={props.value}
      />
    ),
  },
}));

const { eliteaApi } = await import('@/api/eliteaApi.js');
const { default: SkillFileViewer } = await import('../SkillFileViewer');

const SCOPE = { projectId: 2, skillId: 7, versionId: 70 };
const theme = createTheme({ palette: darkPalette });

const makeStore = () =>
  configureStore({
    reducer: { [eliteaApi.reducerPath]: eliteaApi.reducer },
    middleware: getDefault => getDefault().concat(eliteaApi.middleware),
  });

const textFile = path => ({ path, size: 10, isText: true });

const viewerTree = (store, file) => (
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <SkillFileViewer
        file={file}
        scope={SCOPE}
      />
    </ThemeProvider>
  </Provider>
);

describe('SkillFileViewer', () => {
  let bodies;
  let reads;

  beforeEach(() => {
    bodies = { 'a.md': 'first a', 'b.md': 'b text' };
    reads = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async request => {
      const path = decodeURIComponent(new URL(request.url).pathname.split('/70/')[1]);
      reads.push(path);
      return new Response(bodies[path], { status: 200 });
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a reopened file at once and replaces it with what is stored now', async () => {
    const store = makeStore();
    const { unmount } = render(viewerTree(store, textFile('a.md')));
    await waitFor(() => expect(screen.getByTestId('file-text')).toHaveAttribute('data-value', 'first a'));
    unmount();

    bodies['a.md'] = 'a rewritten by an agent';
    render(viewerTree(store, textFile('a.md')));
    expect(screen.getByTestId('file-text')).toHaveAttribute('data-value', 'first a');
    await waitFor(() =>
      expect(screen.getByTestId('file-text')).toHaveAttribute('data-value', 'a rewritten by an agent'),
    );
    expect(reads).toEqual(['a.md', 'a.md']);
  });

  it('never shows the previous file under the name of one still loading', async () => {
    const store = makeStore();
    const { rerender } = render(viewerTree(store, textFile('a.md')));
    await waitFor(() => expect(screen.getByTestId('file-text')).toHaveAttribute('data-value', 'first a'));

    rerender(viewerTree(store, textFile('b.md')));
    expect(screen.queryByTestId('file-text')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('file-text')).toHaveAttribute('data-value', 'b text'));
  });
});
