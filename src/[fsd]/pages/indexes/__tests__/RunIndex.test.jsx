// @vitest-environment jsdom
import { useEffect, useState } from 'react';

import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { store } from '@/[fsd]/shared/config';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render } from '@testing-library/react';

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

const { panelLifecycle } = vi.hoisted(() => ({ panelLifecycle: { mounted: [], unmounted: [] } }));

vi.mock('@/[fsd]/features/toolkits/indexes/model', async importOriginal => ({
  ...(await importOriginal()),
  selectIndexesList: () => ({
    data: [
      { id: 1, metadata: { collection: 'all9' } },
      { id: 2, metadata: { collection: 'all10' } },
    ],
    isLoading: false,
    isFetching: false,
    hasData: true,
  }),
}));

vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({ useGetIndexScheduleQuery: vi.fn() }));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useIndexesListPolling: () => ({ refetch: vi.fn() }),
}));

vi.mock('@/[fsd]/features/toolkits/indexes/ui', () => ({
  RunIndexPanel: props => {
    const [mountedIndexName] = useState(props.indexName);

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
    data: { id: 399, name: 'Conf server KB', settings: {} },
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

const openIndex = indexName => act(() => navigation.current(`/toolkits/all/399/index/${indexName}`));

beforeEach(() => {
  panelLifecycle.mounted = [];
  panelLifecycle.unmounted = [];
});

afterEach(() => cleanup());

describe('RunIndex', () => {
  it('gives each index a fresh run panel when the route switches index in place', () => {
    renderPage();

    openIndex('all10');

    expect(panelLifecycle).toEqual({ mounted: ['all9', 'all10'], unmounted: ['all9'] });
  });

  it('keeps the run panel across re-renders of the same index', () => {
    renderPage();

    openIndex('all9');

    expect(panelLifecycle).toEqual({ mounted: ['all9'], unmounted: [] });
  });
});
