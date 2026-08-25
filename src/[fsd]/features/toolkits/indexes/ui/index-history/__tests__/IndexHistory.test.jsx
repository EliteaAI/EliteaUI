// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Box, ThemeProvider, createTheme } from '@mui/material';

import store from '@/[fsd]/shared/config/store';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import IndexHistory from '../IndexHistory';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: {
    useDeleteRunHistoryItemMutation: () => [vi.fn(), { isLoading: false }],
  },
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 1 }));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo: vi.fn() }),
}));

vi.mock('@/hooks/useGetWindowWidth', () => ({ default: () => ({ windowWidth: 1280 }) }));

vi.mock('@/components/DotMenu', () => ({ default: () => <Box data-testid="dot-menu" /> }));

afterEach(() => cleanup());

const theme = createTheme({
  palette: {
    background: { userInputBackground: '#eee' },
    split: { pressed: '#ddd' },
    border: { lines: '#ccc' },
    icon: { fill: { error: '#f00', warning: '#fa0', info: '#00f', successModal: '#0f0' } },
  },
});

const CREATED = { state: 'created', created_on: 100, updated_on: 150, conversation_id: 11 };
const INDEXED = { state: 'completed', created_on: 196.891, updated_on: 200, conversation_id: 12 };
const GHOST = { state: 'in_progress', created_on: 300, updated_on: 300, conversation_id: 13 };
const RUN_TEST = { state: 'run_test', updated_on: 400, conversation_id: 14, duration: 3661 };

const renderHistory = (history = [CREATED, INDEXED, GHOST, RUN_TEST]) =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <IndexHistory history={history} />
      </ThemeProvider>
    </Provider>,
  );

const selectedEntry = () => store.getState().indexes.selectedHistoryItem;

const historyRows = () => screen.getAllByTestId('run-history-list-item');

const eventLabels = () =>
  historyRows().map(row => within(row).getByText(/^(Created|Indexed|Search index)$/).textContent);

describe('IndexHistory', () => {
  it('lists the columns in the order the toolkit run history uses', () => {
    renderHistory();

    const headers = screen.getAllByText(/^(Date|Event|Duration|Version)$/).map(node => node.textContent);

    expect(headers).toEqual(['Date', 'Event', 'Duration']);
  });

  it('shows a duration for every kind of run', () => {
    renderHistory();

    const rows = historyRows();

    expect(within(rows[0]).getByText('Search index')).toBeInTheDocument();
    expect(within(rows[0]).getByText('1 h 1 m 1 s')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Indexed')).toBeInTheDocument();
    expect(within(rows[1]).getByText('3.11 s')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Created')).toBeInTheDocument();
    expect(within(rows[2]).getByText('50 s')).toBeInTheDocument();
  });

  it('keeps the in-progress placeholders out of the list', () => {
    renderHistory();

    expect(historyRows()).toHaveLength(3);
    expect(screen.queryByText('in_progress')).not.toBeInTheDocument();
  });

  it('offers no run actions this page cannot honour', () => {
    renderHistory();

    expect(screen.queryByTestId('dot-menu')).not.toBeInTheDocument();
  });

  it('selects the newest entry on mount and hands the whole entry to the store', () => {
    renderHistory();

    expect(selectedEntry()).toEqual(RUN_TEST);
    expect(historyRows()[0]).toHaveAttribute('data-selected', 'true');
  });

  it('hands the clicked entry to the store so the detail pane can resolve it', () => {
    renderHistory();

    fireEvent.click(historyRows()[1]);

    expect(selectedEntry()).toEqual(INDEXED);
    expect(historyRows()[1]).toHaveAttribute('data-selected', 'true');
  });

  it('sorts by duration when that column is chosen', () => {
    renderHistory();

    fireEvent.click(screen.getByText('Duration'));

    expect(eventLabels()).toEqual(['Indexed', 'Created', 'Search index']);
  });
});
