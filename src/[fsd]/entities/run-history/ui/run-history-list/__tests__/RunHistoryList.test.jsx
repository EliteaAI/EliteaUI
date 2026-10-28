// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import RunHistoryList from '../RunHistoryList';

vi.mock('@/[fsd]/entities/run-history/ui', async () => ({
  RunHistoryListItem: (await vi.importActual('../RunHistoryListItem')).default,
  RunHistoryTooltipCell: ({ text }) => <span>{text}</span>,
  RunHistorySortableHeader: ({ headerItems, onSort }) => (
    <div>
      <div data-testid="header">{headerItems.map(item => item.label).join('|')}</div>
      {headerItems.map(item => (
        <button
          key={item.type}
          onClick={() => onSort(item.type)}
        >
          {`sort ${item.label}`}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../RunHistoryRowActions', () => ({ default: () => null }));

vi.mock('@/pages/Common', () => ({ ContentContainer: ({ children }) => <div>{children}</div> }));
vi.mock('@/ComponentsLib/ListInfiniteMoreLoader', () => ({ default: () => null }));

afterEach(cleanup);

const theme = createTheme({
  palette: {
    background: {
      surface: { interactive: { default: '#eee' } },
      selectedItem: { default: '#dde', hover: '#ccd' },
    },
    border: { lines: '#ccc' },
  },
});

const renderList = props =>
  render(
    <ThemeProvider theme={theme}>
      <RunHistoryList
        hasEvent
        versions={null}
        {...props}
      />
    </ThemeProvider>,
  );

const rowTexts = () =>
  screen.getAllByTestId('run-history-list-item').map(row => within(row).getAllByText(/./)[1].textContent);

const RUNS = [
  { id: 1, created_at: 1786693433, duration: 1, event_label: 'Schedule', event_sort: 'b' },
  { id: 2, created_at: 1786693434, duration: 2, event_label: 'Chat', event_sort: 'a' },
];

describe('RunHistoryList event column title', () => {
  it('shows the given event column title', () => {
    render(
      <RunHistoryList
        hasEvent
        eventColumnLabel="Execution type"
      />,
    );

    expect(screen.getByTestId('header')).toHaveTextContent('Date|Execution type|Version|Duration');
  });

  it('keeps the Event title when no title is given', () => {
    render(<RunHistoryList hasEvent />);

    expect(screen.getByTestId('header')).toHaveTextContent('Date|Event|Version|Duration');
  });
});

describe('RunHistoryList event column rows', () => {
  it('sorts rows by the event label when the title is clicked', () => {
    renderList({ conversations: RUNS, eventColumnLabel: 'Execution type' });

    fireEvent.click(screen.getByText('sort Execution type'));

    expect(rowTexts()).toEqual(['Chat', 'Schedule']);

    fireEvent.click(screen.getByText('sort Execution type'));

    expect(rowTexts()).toEqual(['Schedule', 'Chat']);
  });

  it('shows "-" and keeps a row without an event selectable', () => {
    const onSelect = vi.fn();

    renderList({
      conversations: [{ id: 3, created_at: 1786693435, duration: 3 }],
      handleHistoryItemSelect: onSelect,
    });

    const row = screen.getByTestId('run-history-list-item');

    expect(rowTexts()).toEqual(['-']);

    fireEvent.click(row);

    expect(onSelect).toHaveBeenCalledWith(3);
  });
});

describe('RunHistoryList extra columns', () => {
  const COLUMNS = [
    {
      id: 'schedule',
      label: 'Schedule',
      width: '9rem',
      render: row => row.schedule_run?.schedule_name ?? '-',
    },
    { id: 'status', label: 'Status', width: '7rem', render: row => (row.schedule_run ? 'Success' : '-') },
  ];

  it('shows Schedule and Status columns with - for a chat row', () => {
    renderList({
      extraColumns: COLUMNS,
      conversations: [
        {
          id: 1,
          created_at: 1786693433,
          duration: 1,
          event_label: 'Scheduled',
          schedule_run: { schedule_name: 'Daily' },
        },
        { id: 2, created_at: 1786693434, duration: 2, event_label: 'Chat', schedule_run: null },
      ],
    });

    expect(screen.getByTestId('header')).toHaveTextContent('Date|Schedule|Status|Event|Duration');
    const [chat, run] = screen.getAllByTestId('run-history-list-item');
    expect(within(run).getByText('Daily')).toBeInTheDocument();
    expect(within(run).getByText('Success')).toBeInTheDocument();
    expect(within(chat).getAllByText('-')).toHaveLength(2);
  });

  it('no extra column without extraColumns', () => {
    renderList({ conversations: RUNS });

    expect(screen.getByTestId('header')).toHaveTextContent('Date|Event|Duration');
  });
});
