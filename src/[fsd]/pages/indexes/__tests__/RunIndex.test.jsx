// @vitest-environment jsdom
import { useEffect, useState } from 'react';

import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { actions as indexesActions } from '@/[fsd]/features/toolkits/indexes/model';
import { store } from '@/[fsd]/shared/config';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

import RunIndex from '../RunIndex';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const { panelLifecycle, panelRenders, served } = vi.hoisted(() => ({
  panelLifecycle: { mounted: [], unmounted: [] },
  panelRenders: [],
  served: { indexesList: null, toolkit: null },
}));

vi.mock('@/[fsd]/features/toolkits/indexes/model', async importOriginal => ({
  ...(await importOriginal()),
  selectIndexesList: () => served.indexesList,
}));

vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({ useGetIndexScheduleQuery: vi.fn() }));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useIndexesListPolling: () => ({ refetch: vi.fn() }),
}));

vi.mock('@/[fsd]/features/toolkits/indexes/ui', () => ({
  RunIndexPanel: props => {
    const [mountedIndexName] = useState(`${props.toolkitId}/${props.indexName}`);

    panelRenders.push({ route: `${props.toolkitId}/${props.indexName}`, indexId: props.index?.id });

    useEffect(() => {
      panelLifecycle.mounted.push(mountedIndexName);
      return () => panelLifecycle.unmounted.push(mountedIndexName);
    }, [mountedIndexName]);

    return null;
  },
}));

vi.mock('@/api/toolkits.js', async importOriginal => ({
  ...(await importOriginal()),
  useToolkitsDetailsQuery: () => ({
    data: served.toolkit,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/[fsd]/features/settings', () => ({ DrawerPageHeader: () => null }));

vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => null }));

vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({ useToast: () => ({ toastError: vi.fn() }) }));

const theme = createTheme({ palette: { background: {}, split: {}, border: {} } });

const navigation = { current: null };

const NavigationProbe = () => {
  navigation.current = useNavigate();
  return null;
};

const renderPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/toolkits/all/399/index/all9']}>
        <ThemeProvider theme={theme}>
          <NavigationProbe />
          <Routes>
            <Route
              path="/toolkits/:tab/:toolkitId/index/:indexName"
              element={<RunIndex />}
            />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    </Provider>,
  );

const CONF_SERVER_INDEXES = [
  { id: 1, metadata: { collection: 'all9' } },
  { id: 2, metadata: { collection: 'all10' } },
  { id: 3, metadata: { collection: 'docs' } },
];
const WIKI_INDEXES = [{ id: 40, metadata: { collection: 'docs' } }];
const CONF_SERVER = { id: 399, name: 'Conf server KB', settings: {} };
const WIKI = { id: 400, name: 'Wiki', settings: {} };

const indexesListOf = (toolkitId, data) => ({
  data,
  toolkitId,
  isLoading: false,
  isFetching: false,
  hasData: true,
});

const applyServed = ({ indexesList = served.indexesList, toolkit = served.toolkit }) => {
  served.indexesList = { ...indexesList };
  served.toolkit = toolkit;
  store.dispatch(
    indexesActions.selectHistoryItem({ servedIndexesList: indexesList, servedToolkit: toolkit }),
  );
};

const navigateTo = (indexName, toolkitId) =>
  navigation.current(`/toolkits/all/${toolkitId}/index/${indexName}`);

const serve = data => act(() => applyServed(data));

const openIndex = (indexName, toolkitId = '399') => act(() => navigateTo(indexName, toolkitId));

const rendersOf = route => panelRenders.filter(entry => entry.route === route).map(entry => entry.indexId);

beforeEach(() => {
  panelLifecycle.mounted = [];
  panelLifecycle.unmounted = [];
  panelRenders.length = 0;
  served.indexesList = indexesListOf('399', CONF_SERVER_INDEXES);
  served.toolkit = CONF_SERVER;
});

afterEach(() => cleanup());

describe('RunIndex', () => {
  it('gives each index a fresh run panel when the route switches index in place', () => {
    renderPage();

    openIndex('all10');

    expect(panelLifecycle).toEqual({ mounted: ['399/all9', '399/all10'], unmounted: ['399/all9'] });
  });

  it('keeps the run panel across re-renders of the same index', () => {
    renderPage();

    openIndex('all9');

    expect(panelLifecycle).toEqual({ mounted: ['399/all9'], unmounted: [] });
  });

  it('never hands a same-named index of the previous toolkit to the next one', () => {
    renderPage();
    openIndex('docs');

    openIndex('docs', '400');
    serve({ toolkit: WIKI });

    expect(rendersOf('400/docs')).toEqual([]);
    expect(screen.queryByText(/was not found/)).toBeNull();

    serve({ indexesList: indexesListOf('400', WIKI_INDEXES) });

    expect(rendersOf('400/docs')).not.toContain(3);
    expect(rendersOf('400/docs').at(-1)).toBe(40);
  });

  it('waits for the next toolkit details before showing its index', () => {
    renderPage();
    openIndex('docs');

    openIndex('docs', '400');
    serve({ indexesList: indexesListOf('400', WIKI_INDEXES) });

    expect(rendersOf('400/docs')).toEqual([]);

    serve({ toolkit: WIKI });

    expect(rendersOf('400/docs').at(-1)).toBe(40);
  });

  it('gives a same-named index of another toolkit a fresh run panel', () => {
    renderPage();
    openIndex('docs');

    act(() => {
      navigateTo('docs', '400');
      applyServed({ indexesList: indexesListOf('400', WIKI_INDEXES), toolkit: WIKI });
    });

    expect(panelLifecycle.mounted.slice(-2)).toEqual(['399/docs', '400/docs']);
    expect(panelLifecycle.unmounted).toContain('399/docs');
  });

  it('waits for an index missing from the list instead of showing the previous one', () => {
    renderPage();

    openIndex('fresh');

    expect(rendersOf('399/fresh')).toEqual([]);

    serve({
      indexesList: indexesListOf('399', [
        ...CONF_SERVER_INDEXES,
        { id: 5, metadata: { collection: 'fresh' } },
      ]),
    });

    expect(rendersOf('399/fresh')).toEqual(expect.arrayContaining([5]));
    expect(rendersOf('399/fresh')).not.toContain(1);
  });
});
