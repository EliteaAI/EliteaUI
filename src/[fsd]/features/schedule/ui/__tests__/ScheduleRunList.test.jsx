// @vitest-environment jsdom
import { useEffect } from 'react';

import { format } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import ScheduleRunList from '../ScheduleRunList';

// EL-7011 US-32 R4, owner CR 2026-10-21: the Runs tab table with Started, Trigger, Status and Open.

const mocks = vi.hoisted(() => ({ chat: vi.fn(), mounts: 0 }));

vi.mock('@/[fsd]/entities/run-history/ui', async importOriginal => ({
  ...(await importOriginal()),
  RunHistoryChat: props => {
    mocks.chat(props);
    useEffect(() => {
      mocks.mounts += 1;
    }, []);
    return <div data-testid="run-chat">{props.selectedHistoryItem}</div>;
  },
}));
vi.mock('@/[fsd]/features/chat', () => ({ ChatMessageList: () => null }));

const withConversation = {
  id: 1,
  conversation_id: 77,
  status: 'success',
  trigger: 'cron',
  started_at: '2026-10-14T12:05:00Z',
};
const withoutConversation = {
  id: 2,
  conversation_id: null,
  status: 'failed',
  trigger: 'test',
  reason: 'Model unavailable',
  started_at: '2026-10-15T09:00:00Z',
};
const manual = {
  id: 3,
  conversation_id: 80,
  status: 'blocked',
  trigger: 'manual',
  started_at: '2026-10-13T08:00:00Z',
};

const theme = createTheme(getDesignTokens('dark'));
const renderList = runs =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRunList runs={runs} />
    </ThemeProvider>,
  );
const rows = () => screen.getAllByTestId('schedule-run-row');
const cell = (row, name) => within(row).getByTestId(`schedule-run-${name}`);

describe('ScheduleRunList (EL-7011 US-32, owner CR 2026-10-21)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.mounts = 0;
  });

  it('R4.1 shows the Started, Trigger and Status headers and the runs newest first', () => {
    renderList([withConversation, withoutConversation, manual]);

    ['Started', 'Trigger', 'Status'].forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
    expect(rows().map(row => cell(row, 'trigger').textContent)).toEqual(['Test', 'Scheduled', 'Run now']);
    expect(cell(rows()[1], 'started')).toHaveTextContent(
      format(new Date(withConversation.started_at), 'd MMM, HH:mm'),
    );
  });

  it('R4.2 shows each status as a chip and the reason of a run without a conversation', () => {
    renderList([withConversation, withoutConversation]);

    expect(within(cell(rows()[0], 'status-cell')).getByTestId('schedule-run-status')).toHaveTextContent(
      'Failed',
    );
    expect(cell(rows()[0], 'status-cell')).toHaveTextContent('Model unavailable');
    expect(within(cell(rows()[1], 'status-cell')).getByTestId('schedule-run-status')).toHaveTextContent(
      'Success',
    );
  });

  it('R4.2 shows Open only for a run with a conversation, else a dash', () => {
    renderList([withConversation, withoutConversation]);

    expect(within(rows()[0]).queryByRole('button', { name: 'Open' })).not.toBeInTheDocument();
    expect(cell(rows()[0], 'open')).toHaveTextContent('–');
    expect(within(rows()[1]).getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });

  it('R4.1 Open shows the conversation of the run below the table', () => {
    renderList([withConversation, withoutConversation]);
    expect(screen.queryByTestId('run-chat')).not.toBeInTheDocument();

    fireEvent.click(within(rows()[1]).getByRole('button', { name: 'Open' }));

    expect(screen.getByTestId('run-chat')).toHaveTextContent('77');
    expect(mocks.chat.mock.lastCall[0].ChatMessageListComponent).toBeTypeOf('function');
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

  it('R4.4 reloads the opened conversation when its run ends', () => {
    const running = { ...withConversation, status: 'running' };
    const { rerender } = renderList([running]);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(mocks.mounts).toBe(1);

    rerender(
      <ThemeProvider theme={theme}>
        <ScheduleRunList runs={[withConversation]} />
      </ThemeProvider>,
    );

    expect(mocks.mounts).toBe(2);
    expect(within(rows()[0]).getByTestId('schedule-run-status')).toHaveTextContent('Success');
  });

  it('R4.1 says so when the schedule has no runs', () => {
    renderList([]);
    expect(screen.getByText('No runs yet.')).toBeInTheDocument();
  });
});
