// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box, ThemeProvider, createTheme } from '@mui/material';

import store from '@/[fsd]/shared/config/store';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import IndexHistoryPage from '../IndexHistoryPage';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const { indexesListState } = vi.hoisted(() => ({ indexesListState: { current: null } }));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useParams: () => ({ tab: 'all', toolkitId: '56', indexName: 'docs' }),
}));

vi.mock('@/[fsd]/features/toolkits/indexes/model/indexes.slice', async importOriginal => ({
  ...(await importOriginal()),
  selectIndexesList: () => indexesListState.current,
  selectHistoryItem: () => null,
}));

vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({ useGetIndexesListQuery: vi.fn() }));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({ useIndexRunLiveRefresh: vi.fn() }));

vi.mock('@/[fsd]/features/toolkits/indexes/ui', () => ({
  IndexHistory: () => <Box data-testid="index-history" />,
  IndexRunDetail: () => <Box data-testid="index-run-detail" />,
  IndexChatContainer: () => <Box data-testid="index-chat" />,
}));

vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: {
    useGetRunHistoryListQuery: () => ({ data: { rows: [] }, isLoading: false }),
  },
}));

vi.mock('@/api/toolkits.js', async importOriginal => ({
  ...(await importOriginal()),
  useToolkitsDetailsQuery: () => ({ isError: false, error: null }),
}));

vi.mock('@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader', () => ({ default: () => null }));

vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => null }));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));

vi.mock('@/hooks/useToast.jsx', () => ({ default: () => ({ toastError: vi.fn() }) }));

const INDEX = {
  metadata: {
    collection: 'docs',
    history: [{ state: 'completed', created_on: 100, updated_on: 200, conversation_id: 1 }],
  },
};

beforeEach(() => {
  indexesListState.current = {
    data: [INDEX],
    isLoading: false,
    isFetching: false,
    hasData: true,
  };
});

afterEach(() => cleanup());

const theme = createTheme({ palette: { background: {}, split: {}, border: {} } });

const renderPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/toolkits/all/56/index/docs/history']}>
        <ThemeProvider theme={theme}>
          <IndexHistoryPage />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>,
  );

describe('IndexHistoryPage', () => {
  it('renders the history once the indexes have loaded', () => {
    renderPage();

    expect(screen.getByTestId('index-history')).toBeInTheDocument();
  });

  it('keeps the history mounted while the indexes refetch in the background', () => {
    indexesListState.current = { ...indexesListState.current, isFetching: true };

    renderPage();

    expect(screen.getByTestId('index-history')).toBeInTheDocument();
  });

  it('shows the spinner until the first load arrives', () => {
    indexesListState.current = { data: [], isLoading: true, isFetching: true, hasData: false };

    renderPage();

    expect(screen.queryByTestId('index-history')).not.toBeInTheDocument();
  });
});
