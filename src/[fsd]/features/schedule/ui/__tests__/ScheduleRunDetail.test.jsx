// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRunDetail from '../ScheduleRunDetail';

// what an open run shows, by status

const mocks = vi.hoisted(() => ({
  detail: { run: undefined, isError: false, refetch: vi.fn() },
  answer: 'The answer',
}));

vi.mock('../../lib/hooks/useScheduleRuns.hooks', () => ({
  useRunDetail: () => mocks.detail,
  useScheduleRunConversation: () => ({ answer: mocks.answer }),
}));
vi.mock('../ScheduleRunLog', () => ({ default: () => <div data-testid="log-stub" /> }));
vi.mock('../ScheduleWaitingCard', () => ({ default: () => <div data-testid="waiting-stub" /> }));

const theme = createTheme(getDesignTokens('light'));
const schedule = { id: 9 };
const ended = { id: 1, status: 'success', conversation_id: 70 };

const renderDetail = (run = ended, props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <ScheduleRunDetail
          run={run}
          schedule={schedule}
          entityType="agent"
          applicationId={3}
          {...props}
        />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('ScheduleRunDetail', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.detail = { run: undefined, isError: false, refetch: vi.fn() };
    mocks.answer = 'The answer';
  });

  it('shows the response and a closed log of an ended run', () => {
    renderDetail();

    expect(screen.getByTestId('schedule-run-answer')).toHaveTextContent('The answer');
    expect(screen.queryByTestId('log-stub')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Run logs' }));
    expect(screen.getByTestId('log-stub')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide run logs' })).toBeInTheDocument();
  });

  it('opens the log when a run fails while its card is open', () => {
    const view = renderDetail({ id: 2, status: 'running' });
    const rerenderWith = run =>
      view.rerender(
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <ScheduleRunDetail
              run={run}
              schedule={schedule}
              entityType="agent"
              applicationId={3}
            />
          </MemoryRouter>
        </ThemeProvider>,
      );
    rerenderWith({ id: 2, status: 'success' });
    expect(screen.queryByTestId('log-stub')).not.toBeInTheDocument();

    rerenderWith({ id: 2, status: 'failed' });
    expect(screen.getByTestId('log-stub')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide run logs' })).toBeInTheDocument();
  });

  it('says there is no response when the run has none', () => {
    mocks.answer = '';
    renderDetail();

    expect(screen.getByTestId('schedule-run-answer')).toHaveTextContent('No response.');
  });

  it('shows the log and no response while the run is active', () => {
    renderDetail({ id: 2, status: 'running' });

    expect(screen.getByTestId('log-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-run-answer')).not.toBeInTheDocument();
  });

  it('shows the approval card for a waiting run of a saved schedule', () => {
    renderDetail({ id: 3, status: 'waiting_for_approval' });

    expect(screen.getByTestId('waiting-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-run-open-history')).not.toBeInTheDocument();
  });

  it('shows the reason of the run', () => {
    renderDetail({ ...ended, status: 'failed', reason: 'Model quota exceeded' });

    expect(screen.getByText('Model quota exceeded')).toBeInTheDocument();
  });

  it('shows a short error line for a failed run, not the raw tool error', () => {
    renderDetail({ ...ended, status: 'failed' });

    expect(screen.getByText(/did not finish/)).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-run-answer')).not.toBeInTheDocument();
  });

  it('offers a retry when the run detail fails to load', () => {
    mocks.detail = { run: undefined, isError: true, refetch: vi.fn() };
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(mocks.detail.refetch).toHaveBeenCalledTimes(1);
  });

  it('links a saved run to the Run History of its schedule', () => {
    renderDetail();

    expect(screen.getByTestId('schedule-run-open-history')).toHaveAttribute(
      'href',
      '/agents/all/3/history?schedule_id=9&viewMode=owner',
    );
  });

  it('links a Test run of the form to the Run History filtered by the Test trigger', () => {
    renderDetail({ ...ended, isDraftRun: true });

    expect(screen.getByTestId('schedule-run-open-history')).toHaveAttribute(
      'href',
      '/agents/all/3/history?trigger=test&viewMode=owner',
    );
  });

  it('shows no response section for an ended run of a toolkit index and keeps the log and history link', () => {
    renderDetail(
      { id: 1, status: 'success' },
      { entityType: 'toolkit_index', applicationId: 3, indexName: 'docs' },
    );

    expect(screen.queryByTestId('schedule-run-answer')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run logs' })).toBeInTheDocument();
    expect(screen.getByTestId('schedule-run-open-history')).toHaveAttribute(
      'href',
      expect.stringContaining('docs'),
    );
  });
});
