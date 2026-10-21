// @vitest-environment jsdom
import { format } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import ScheduleRunList from '../ScheduleRunList';

// EL-7011 US-32 R4, owner CR 2026-10-21 test panel log: the Runs table of the left column

const withConversation = {
  id: 1,
  conversation_id: 77,
  status: 'success',
  trigger: 'cron',
  version_id: 4,
  duration_ms: 65_000,
  started_at: '2026-10-14T12:05:00Z',
};
const withoutConversation = {
  id: 2,
  conversation_id: null,
  status: 'failed',
  trigger: 'test',
  reason: 'Model unavailable',
  version_id: 5,
  duration_ms: 31_000,
  started_at: '2026-10-15T09:00:00Z',
};
const manual = {
  id: 3,
  conversation_id: 80,
  status: 'blocked',
  trigger: 'manual',
  started_at: '2026-10-13T08:00:00Z',
};
const waitingRun = {
  id: 4,
  conversation_id: 90,
  status: 'waiting_for_approval',
  trigger: 'cron',
  started_at: '2026-10-16T08:00:00Z',
};

const theme = createTheme(getDesignTokens('dark'));
const renderList = (runs, props = {}) => {
  const onOpen = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRunList
        runs={runs}
        versionNames={{ 4: 'v3', 5: 'v2' }}
        onOpen={onOpen}
        {...props}
      />
    </ThemeProvider>,
  );
  return onOpen;
};
const rows = () => screen.getAllByTestId('schedule-run-row');
const cell = (row, name) => within(row).getByTestId(`schedule-run-${name}`);

describe('ScheduleRunList EL-7011 US-32, owner CR 2026-10-21', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('R1.1 TC-US41-01 TC-US41-03 labels a waiting run and no finished run as waiting', () => {
    renderList([waitingRun, withConversation]);

    expect(screen.getAllByTestId('schedule-run-status')).toHaveLength(2);
    expect(screen.getAllByText(/waiting/i)).toHaveLength(1);
  });

  it('R4.1 shows Started, Trigger, Status, Duration and Version, newest first', () => {
    renderList([withConversation, withoutConversation, manual]);

    ['Started', 'Trigger', 'Status', 'Duration', 'Version'].forEach(label =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
    expect(rows().map(row => cell(row, 'trigger').textContent)).toEqual(['test', 'cron', 'manual']);
    expect(cell(rows()[1], 'started')).toHaveTextContent(
      format(new Date(withConversation.started_at), 'd MMM, HH:mm'),
    );
  });

  it('shows the duration and the version name of each run, and a dash without one', () => {
    renderList([withConversation, withoutConversation, manual]);

    expect(rows().map(row => cell(row, 'duration').textContent)).toEqual(['31 s', '1 m 05 s', '–']);
    expect(rows().map(row => cell(row, 'version').textContent)).toEqual(['v2', 'v3', '–']);
  });

  it('R4.2 shows each status as a chip and the reason of a run', () => {
    renderList([withConversation, withoutConversation]);

    expect(within(cell(rows()[0], 'status-cell')).getByTestId('schedule-run-status')).toHaveTextContent(
      'Failed',
    );
    expect(cell(rows()[0], 'status-cell')).toHaveTextContent('Model unavailable');
  });

  it('Open shows a run in the panel, Review a waiting run, and a run without a conversation has a dash', () => {
    const onOpen = renderList([withConversation, withoutConversation, waitingRun]);

    expect(cell(rows()[1], 'open')).toHaveTextContent('–');
    fireEvent.click(within(rows()[0]).getByRole('button', { name: 'Review' }));
    expect(onOpen).toHaveBeenLastCalledWith(waitingRun);
    fireEvent.click(within(rows()[2]).getByRole('button', { name: 'Open' }));
    expect(onOpen).toHaveBeenLastCalledWith(withConversation);
  });

  it('marks the run the panel shows', () => {
    renderList([withConversation, manual], { selectedRunId: 3 });

    expect(rows().map(row => row.getAttribute('aria-selected'))).toEqual(['false', 'true']);
  });

  it('R4.1 sorts by a header click', () => {
    renderList([withConversation, withoutConversation, manual]);

    fireEvent.click(screen.getByText('Status'));

    expect(rows().map(row => within(row).getByTestId('schedule-run-status').textContent)).toEqual([
      'Blocked',
      'Failed',
      'Success',
    ]);
  });

  it('R4.1 says so when the schedule has no runs', () => {
    renderList([]);
    expect(screen.getByText('No runs yet.')).toBeInTheDocument();
  });

  it('keeps rows 3.25 rem high and the start time on one line', () => {
    renderList([withConversation]);
    const [row] = rows();

    expect(getComputedStyle(row).minHeight).toBe('3.25rem');
    expect(getComputedStyle(cell(row, 'started')).whiteSpace).toBe('nowrap');
  });
});
