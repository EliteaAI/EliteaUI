// @vitest-environment jsdom
import { createRef } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import ScheduleRunsSection from '../ScheduleRunsSection';

// EL-7011 owner CR 2026-10-21 test panel log: the Runs section in the right block under the panel (CR-21)

const run = {
  id: 1,
  trigger: 'cron',
  status: 'success',
  conversation_id: 70,
  started_at: '2026-10-21T09:00:00Z',
};
const theme = createTheme(getDesignTokens('light'));
const renderSection = props => {
  const handlers = { onOpen: vi.fn(), onExpandedChange: vi.fn() };
  const ref = createRef();
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRunsSection
        ref={ref}
        runs={[run]}
        versionNames={{}}
        expanded
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
  );
  return { ...handlers, ref };
};

describe('ScheduleRunsSection EL-7011 CR-21', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('R4.1 holds the run rows under the RUNS OF THIS SCHEDULE title, and a row reaches the panel', () => {
    const { onOpen } = renderSection({ selectedRunId: 1 });

    expect(screen.getByTestId('schedule-section-runs')).toHaveTextContent('RUNS OF THIS SCHEDULE');
    expect(screen.getByTestId('schedule-run-row').querySelector('button')).toHaveAttribute(
      'aria-current',
      'true',
    );
    fireEvent.click(within(screen.getByTestId('schedule-run-row')).getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith(run);
  });

  it('is a named region that the ref reaches, with the id #runs and room under the page header', () => {
    const { ref } = renderSection();
    const region = screen.getByRole('region', { name: 'Runs of this schedule' });

    expect(ref.current).toBe(region);
    expect(region).toHaveAttribute('id', 'runs');
    expect(getComputedStyle(region).scrollMarginTop).toBe('4.5rem');
    expect(getComputedStyle(region).maxWidth).not.toBe('43.75rem');
  });

  it('is collapsible, and reports a title click', () => {
    const { onExpandedChange } = renderSection({ expanded: false });

    expect(screen.getByRole('button', { name: /RUNS OF THIS SCHEDULE/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    fireEvent.click(screen.getByTestId('schedule-section-runs'));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it('CR-21 sorts the rows with the Sort select: Newest, Oldest, Status', () => {
    const older = { ...run, id: 2, trigger: 'test', status: 'failed', started_at: '2026-10-20T09:00:00Z' };
    renderSection({ runs: [older, run] });
    const triggers = () => screen.getAllByTestId('schedule-run-trigger').map(chip => chip.textContent);
    expect(triggers()).toEqual(['cron', 'test']);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sort runs' }));
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'Newest',
      'Oldest',
      'Status',
    ]);
    fireEvent.click(screen.getByRole('option', { name: 'Oldest' }));
    expect(triggers()).toEqual(['test', 'cron']);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sort runs' }));
    fireEvent.click(screen.getByRole('option', { name: 'Status' }));
    expect(triggers()).toEqual(['test', 'cron']);
  });

  it('CR-21 hides the Sort select without runs', () => {
    renderSection({ runs: [] });
    expect(screen.queryByRole('combobox', { name: 'Sort runs' })).toBeNull();
    expect(screen.getByText('No runs yet.')).toBeInTheDocument();
  });

  it('CR-21 shows the not-in-the-list note for an unknown history_run_id', () => {
    renderSection({ runNotFound: true });
    expect(screen.getByRole('region', { name: 'Runs of this schedule' })).toHaveTextContent(
      'That run is not in the list.',
    );
  });

  it('CR-21 announces the shown run in one polite live region', () => {
    renderSection({ announcement: 'Showing run 21 Oct, 09:00, cron, Success' });
    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Showing run 21 Oct, 09:00, cron, Success');
  });
});
