// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box, ThemeProvider, createTheme } from '@mui/material';

import { store } from '@/[fsd]/shared/config';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import RunHistoryContainer from '../RunHistoryContainer';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const { fetchRunList, queryResult, listProps } = vi.hoisted(() => ({
  fetchRunList: vi.fn(),
  listProps: { current: null },
  queryResult: { data: undefined, isUninitialized: false, isLoading: false, isFetching: false },
}));

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo: vi.fn() }),
}));

vi.mock('@/[fsd]/entities/run-history/api', () => {
  const queryTuple = [fetchRunList, queryResult];

  return { RunHistoryApi: { useLazyGetRunHistoryListQuery: () => queryTuple } };
});

vi.mock('@/[fsd]/entities/run-history/ui', () => ({
  RunHistoryList: props => {
    listProps.current = props;

    return (
      <Box>
        <button
          data-testid="load-more"
          onClick={props.onLoadMore}
        />
        {props.conversations.length === 0 && props.emptyState}
      </Box>
    );
  },
  RunHistoryChat: () => null,
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 7 }));

vi.mock('@/hooks/useIsSmallWindow', () => ({ default: () => ({ isSmallWindow: false }) }));

const theme = createTheme();

const ROWS = [{ id: 1, created_at: '2026-10-01T10:00:00', duration: 1 }];

beforeEach(() => {
  vi.clearAllMocks();
  listProps.current = null;
  queryResult.data = { rows: ROWS, total: 40 };
});

afterEach(() => cleanup());

const tree = props => (
  <Provider store={store}>
    <MemoryRouter initialEntries={['/skills/all/174/history']}>
      <ThemeProvider theme={theme}>
        <RunHistoryContainer
          entityId={174}
          source="skill"
          versions={[]}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>
  </Provider>
);

describe('RunHistoryContainer filters', () => {
  it('keeps the agent request shape when no owner project or filters are passed', () => {
    render(tree({ source: 'agent', entityId: 1 }));

    expect(fetchRunList).toHaveBeenLastCalledWith({ source: 'agent', projectId: 7, entityId: 1, page: 0 });
  });

  it('sends the owner project and the filters', () => {
    render(tree({ entityProjectId: 1, filters: { status: 'error', author_id: 3 } }));

    expect(fetchRunList).toHaveBeenLastCalledWith({
      source: 'skill',
      projectId: 7,
      entityId: 174,
      page: 0,
      entityProjectId: 1,
      status: 'error',
      author_id: 3,
    });
  });

  it('starts the new filter from the first page, never from the page already scrolled to', () => {
    const { rerender } = render(tree({ filters: {} }));
    fireEvent.click(screen.getByTestId('load-more'));
    expect(fetchRunList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    fetchRunList.mockClear();

    rerender(tree({ filters: { status: 'error' } }));

    expect(fetchRunList).toHaveBeenCalledTimes(1);
    expect(fetchRunList).toHaveBeenCalledWith(expect.objectContaining({ page: 0, status: 'error' }));
  });

  it('does not refetch when the filters are equal but a new object', () => {
    const { rerender } = render(tree({ filters: { status: 'error' } }));
    fetchRunList.mockClear();

    rerender(tree({ filters: { status: 'error' } }));

    expect(fetchRunList).not.toHaveBeenCalled();
  });

  it('hands the first page facets to the page', async () => {
    const onFacets = vi.fn();
    const facets = { authors: [{ id: 3, name: 'Admin' }], models: ['gpt'] };
    fetchRunList.mockResolvedValueOnce({ data: { rows: ROWS, total: 1, facets } });

    render(tree({ onFacets }));

    await vi.waitFor(() => expect(onFacets).toHaveBeenCalledWith(facets));
  });

  it('keeps the facets of a first page that a quick filter superseded', async () => {
    const onFacets = vi.fn();
    const facets = { authors: [{ id: 3, name: 'Admin' }], models: ['gpt'] };
    let resolveFirstPage;
    fetchRunList.mockReturnValueOnce(new Promise(resolve => (resolveFirstPage = resolve)));
    queryResult.data = { rows: ROWS, total: 1 };
    const { rerender } = render(tree({ onFacets, filters: {} }));

    rerender(tree({ onFacets, filters: { status: 'error' } }));
    resolveFirstPage({ data: { rows: ROWS, total: 1, facets } });

    await vi.waitFor(() => expect(onFacets).toHaveBeenCalledWith(facets));
  });

  it('builds the empty state from the page the list shows', () => {
    queryResult.data = { rows: [], total: 0, modelFilterUnavailable: true };

    render(tree({ emptyState: page => <Box data-testid={`empty-${page.modelFilterUnavailable}`} /> }));

    expect(screen.getByTestId('empty-true')).toBeInTheDocument();
  });

  it('passes the empty state, columns and width to the list', () => {
    queryResult.data = { rows: [], total: 0 };
    const extraColumns = [{ type: 'cost', label: 'Cost', width: '1fr', getText: () => '' }];

    render(tree({ emptyState: <Box data-testid="empty" />, extraColumns, listWidth: '60rem' }));

    expect(screen.getByTestId('empty')).toBeInTheDocument();
    expect(listProps.current.extraColumns).toBe(extraColumns);
    expect(listProps.current.listWidth).toBe('60rem');
  });
});
