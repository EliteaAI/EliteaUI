// @vitest-environment jsdom
import { format } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import ScheduleRunList from '../ScheduleRunList';

// test panel log: the two-line run rows of the right block

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
const rowButton = row => within(row).getByRole('button');

describe('ScheduleRunList', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('TC-US41-01 TC-US41-03 labels a waiting run and no finished run as waiting', () => {
    renderList([waitingRun, withConversation]);

    expect(screen.getAllByTestId('schedule-run-status')).toHaveLength(2);
    expect(screen.getAllByText(/waiting/i)).toHaveLength(1);
  });

  it('shows no column header and lists the runs as items of one list, newest first', () => {
    renderList([withConversation, withoutConversation, manual]);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    ['Started', 'Trigger', 'Duration'].forEach(label => expect(screen.queryByText(label)).toBeNull());
    expect(rows().map(row => cell(row, 'trigger').textContent)).toEqual(['test', 'cron', 'manual']);
    expect(cell(rows()[1], 'started')).toHaveTextContent(
      format(new Date(withConversation.started_at), 'd MMM, HH:mm'),
    );
  });

  it('puts date, trigger and status on line 1 and version and duration on line 2', () => {
    renderList([withConversation]);
    const [row] = rows();

    expect(within(cell(row, 'line1')).getByTestId('schedule-run-started')).toBeInTheDocument();
    expect(within(cell(row, 'line1')).getByTestId('schedule-run-trigger')).toHaveTextContent('cron');
    expect(within(cell(row, 'line1')).getByTestId('schedule-run-status')).toHaveTextContent('Success');
    expect(cell(row, 'line2')).toHaveTextContent('v3 · 1 m 05 s');
  });

  it('shows the duration and the version name of each run, and a dash without one', () => {
    renderList([withConversation, withoutConversation, manual]);

    expect(rows().map(row => cell(row, 'duration').textContent)).toEqual(['31 s', '1 m 05 s', '–']);
    expect(rows().map(row => cell(row, 'version').textContent)).toEqual(['v2', 'v3', '–']);
  });

  it('shows the reason of a run on line 2', () => {
    renderList([withoutConversation]);
    expect(cell(rows()[0], 'line2')).toHaveTextContent('Model unavailable');
  });

  it('each row is one button that opens the run, a waiting run reads Review and approve', () => {
    const onOpen = renderList([withConversation, waitingRun]);

    expect(within(rows()[0]).getByText('Review and approve')).toBeInTheDocument();
    expect(within(rows()[1]).queryByText('Review and approve')).toBeNull();
    fireEvent.click(rowButton(rows()[0]));
    expect(onOpen).toHaveBeenLastCalledWith(waitingRun);
    fireEvent.click(rowButton(rows()[1]));
    expect(onOpen).toHaveBeenLastCalledWith(withConversation);
  });

  it('owner decision: a run without a conversation (Skipped, Blocked) opens too', () => {
    const skipped = { ...withoutConversation, id: 7, status: 'skipped', reason: 'Agent was deleted' };
    const onOpen = renderList([skipped]);

    fireEvent.click(rowButton(rows()[0]));

    expect(onOpen).toHaveBeenCalledWith(skipped);
    expect(rowButton(rows()[0])).not.toHaveAttribute('aria-disabled');
  });

  it('marks the selected run with aria-current and the row id for the focus', () => {
    renderList([withConversation, manual], { selectedRunId: 3 });

    expect(rows().map(row => rowButton(row).getAttribute('aria-current'))).toEqual([null, 'true']);
    expect(rows().map(row => rowButton(row).dataset.runId)).toEqual(['1', '3']);
  });

  it('sorts by trigger, by duration (longest first) and by version name; ties and gaps go newest first', () => {
    const runs = [withConversation, withoutConversation, manual, waitingRun];
    renderList(runs, { sort: 'trigger' });
    expect(rows().map(row => rowButton(row).dataset.runId)).toEqual(['4', '1', '3', '2']);
    cleanup();

    renderList(runs, { sort: 'duration' });
    expect(rows().map(row => rowButton(row).dataset.runId)).toEqual(['1', '2', '4', '3']);
    cleanup();

    renderList(runs, { sort: 'version' });
    expect(rows().map(row => cell(row, 'version').textContent)).toEqual(['v2', 'v3', '–', '–']);
    expect(rows().map(row => rowButton(row).dataset.runId)).toEqual(['2', '1', '4', '3']);
  });

  it('sorts newest first, oldest first, or by status', () => {
    renderList([withConversation, withoutConversation, manual], { sort: 'oldest' });
    expect(rows().map(row => cell(row, 'trigger').textContent)).toEqual(['manual', 'cron', 'test']);
    cleanup();

    renderList([withConversation, withoutConversation, manual], { sort: 'status' });
    expect(rows().map(row => within(row).getByTestId('schedule-run-status').textContent)).toEqual([
      'Blocked',
      'Failed',
      'Success',
    ]);
  });

  it('says so when the schedule has no runs', () => {
    renderList([]);
    expect(screen.getByText('No runs yet.')).toBeInTheDocument();
  });

  it('renders version and duration as MUI components, not raw span elements', () => {
    renderList([withConversation]);
    const [row] = rows();

    ['version', 'duration'].forEach(name => {
      expect(cell(row, name).className).toMatch(/Mui/);
    });
  });

  it('keeps rows 3.5 rem high and the start time on one line', () => {
    renderList([withConversation]);
    const [row] = rows();

    expect(getComputedStyle(rowButton(row)).minHeight).toBe('3.5rem');
    expect(getComputedStyle(cell(row, 'started')).whiteSpace).toBe('nowrap');
  });
});
