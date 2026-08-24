// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box, ThemeProvider, createTheme } from '@mui/material';

import store from '@/[fsd]/shared/config/store';
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

const CONVERSATION_ID = 1234;

// One mutable result object with a stable identity: RTK Query hands back stable references, and a
// fresh literal per render would loop the effect that mirrors `data` into state.
const { fetchRunList, queryResult, toastInfo } = vi.hoisted(() => ({
  fetchRunList: vi.fn(),
  toastInfo: vi.fn(),
  queryResult: { data: undefined, isUninitialized: false, isLoading: false, isFetching: false },
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo }),
}));

vi.mock('@/[fsd]/entities/run-history/api', () => {
  const queryTuple = [fetchRunList, queryResult];

  return { RunHistoryApi: { useLazyGetRunHistoryListQuery: () => queryTuple } };
});

const CONVERSATION_ROWS = [
  { id: 1234, created_at: '2026-08-01T10:00:00', duration: 5, entry: {} },
  { id: 5678, created_at: '2026-07-01T10:00:00', duration: 5, entry: {} },
];

beforeEach(() => {
  vi.clearAllMocks();
  queryResult.data = { rows: CONVERSATION_ROWS, total: CONVERSATION_ROWS.length };
  queryResult.isUninitialized = false;
  queryResult.isLoading = false;
  queryResult.isFetching = false;
});

vi.mock('@/[fsd]/entities/run-history/ui', () => ({
  RunHistoryList: props => (
    <Box
      data-testid="selection"
      data-value={String(props.selectedHistoryItem)}
      data-type={typeof props.selectedHistoryItem}
    >
      {props.conversations.map(row => (
        <button
          key={row.id}
          data-testid={`select-${row.id}`}
          onClick={() => props.handleHistoryItemSelect(row.id)}
        />
      ))}
    </Box>
  ),
  RunHistoryChat: () => null,
}));

const DetailComponent = props => <Box data-testid="detail">{String(props.row.id)}</Box>;

const INDEX_RUN_ROW = {
  id: 'index-run:docs:1787028832.4885912',
  created_at: '2026-06-01T10:00:00',
  duration: 2,
  hasConversation: false,
  canShare: true,
  entry: {},
};

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 7 }));

vi.mock('@/hooks/useIsSmallWindow', () => ({ default: () => ({ isSmallWindow: false }) }));

afterEach(() => cleanup());

const theme = createTheme({
  palette: {
    background: { userInputBackground: '#eee' },
    split: { pressed: '#ddd' },
    border: { lines: '#ccc' },
  },
});

const LocationProbe = () => <Box data-testid="search">{useLocation().search}</Box>;

const renderContainer = (search, containerProps = {}) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/agents/1${search}`]}>
        <ThemeProvider theme={theme}>
          <RunHistoryContainer
            entityId={1}
            source="agent"
            versions={[]}
            DetailComponent={DetailComponent}
            {...containerProps}
          />
          <LocationProbe />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>,
  );

describe('RunHistoryContainer shared-link restore', () => {
  it('restores a shared run as a number so it matches a conversation id', () => {
    renderContainer(`?history_run_id=${CONVERSATION_ID}`);

    const selection = screen.getByTestId('selection');

    expect(selection).toHaveAttribute('data-value', '1234');
    expect(selection).toHaveAttribute('data-type', 'number');
    expect(screen.getByTestId('detail')).toHaveTextContent('1234');
  });

  it('selects the newest run when no run is named', () => {
    renderContainer('');

    expect(screen.getByTestId('selection')).toHaveAttribute('data-value', '1234');
  });

  it('lets the reader pick another run once the shared one is open', () => {
    renderContainer(`?history_run_id=${CONVERSATION_ID}`);

    fireEvent.click(screen.getByTestId('select-5678'));

    expect(screen.getByTestId('selection')).toHaveAttribute('data-value', '5678');
  });

  it('drops the consumed run id so a reload does not re-pin the selection', () => {
    renderContainer(`?history_run_id=${CONVERSATION_ID}&destTab=History`);

    expect(screen.getByTestId('search')).toHaveTextContent('destTab=History');
    expect(screen.getByTestId('search').textContent).not.toContain('history_run_id');
  });

  it('restores an index run whose id is not a number', () => {
    renderContainer(`?history_run_id=${encodeURIComponent(INDEX_RUN_ROW.id)}`, {
      additionalRows: [INDEX_RUN_ROW],
    });

    const selection = screen.getByTestId('selection');

    expect(selection).toHaveAttribute('data-value', INDEX_RUN_ROW.id);
    expect(selection).toHaveAttribute('data-type', 'string');
    expect(screen.getByTestId('detail')).toHaveTextContent(INDEX_RUN_ROW.id);
  });

  it('waits for the index runs before giving up on a shared run', () => {
    renderContainer(`?history_run_id=${encodeURIComponent(INDEX_RUN_ROW.id)}`, {
      additionalRows: [],
      additionalRowsLoading: true,
    });

    expect(screen.getByTestId('selection')).toHaveAttribute('data-value', 'null');
    expect(screen.getByTestId('search').textContent).toContain('history_run_id');
  });

  it('waits for the conversations query to start before giving up on a shared run', () => {
    queryResult.data = undefined;
    queryResult.isUninitialized = true;

    renderContainer(`?history_run_id=${CONVERSATION_ID}`, { additionalRows: [INDEX_RUN_ROW] });

    expect(screen.getByTestId('selection')).toHaveAttribute('data-value', 'null');
    expect(screen.getByTestId('search').textContent).toContain('history_run_id');
  });

  it('says so rather than silently opening the wrong run', () => {
    queryResult.data = { rows: CONVERSATION_ROWS, total: 40 };

    renderContainer('?history_run_id=99999');

    expect(toastInfo).toHaveBeenCalledWith(
      'That run is not in this list. Showing the most recent run instead.',
    );
    expect(screen.getByTestId('selection')).toHaveAttribute('data-value', '1234');
  });

  it('does not walk the pagination looking for a run it cannot see', () => {
    queryResult.data = { rows: CONVERSATION_ROWS, total: 40 };

    renderContainer('?history_run_id=99999');

    expect(fetchRunList).toHaveBeenCalledTimes(1);
    expect(fetchRunList).toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
  });

  it('reports a missing run once, not on every render', () => {
    queryResult.data = { rows: CONVERSATION_ROWS, total: 40 };

    renderContainer('?history_run_id=99999');

    fireEvent.click(screen.getByTestId('select-5678'));
    fireEvent.click(screen.getByTestId('select-1234'));

    expect(toastInfo).toHaveBeenCalledTimes(1);
  });

  it('falls back to the newest run when the shared run is gone', () => {
    renderContainer('?history_run_id=404');

    expect(screen.getByTestId('selection')).toHaveAttribute('data-value', '1234');
  });
});
