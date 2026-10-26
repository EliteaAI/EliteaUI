// @vitest-environment jsdom
import { createRef } from 'react';

import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import ScheduleRunsSection from '../ScheduleRunsSection';

// test panel log: the Runs section in the right block under the panel

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
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <ScheduleRunsSection
          ref={ref}
          runs={[run]}
          versionNames={{}}
          expanded
          {...handlers}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );
  return { ...handlers, ref };
};

describe('ScheduleRunsSection', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('holds the run rows under the RUNS OF THIS SCHEDULE title, and a row reaches the panel', () => {
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

  it('sorts the rows with the Sort select: Newest, Oldest, Status, Trigger, Duration, Version', () => {
    const older = { ...run, id: 2, trigger: 'test', status: 'failed', started_at: '2026-10-20T09:00:00Z' };
    renderSection({ runs: [older, run] });
    const triggers = () => screen.getAllByTestId('schedule-run-trigger').map(chip => chip.textContent);
    expect(triggers()).toEqual(['cron', 'test']);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sort runs' }));
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'Newest',
      'Oldest',
      'Status',
      'Trigger',
      'Duration',
      'Version',
    ]);
    fireEvent.click(screen.getByRole('option', { name: 'Oldest' }));
    expect(triggers()).toEqual(['test', 'cron']);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sort runs' }));
    fireEvent.click(screen.getByRole('option', { name: 'Status' }));
    expect(triggers()).toEqual(['test', 'cron']);
  });

  it('hides the Sort select without runs', () => {
    renderSection({ runs: [] });
    expect(screen.queryByRole('combobox', { name: 'Sort runs' })).toBeNull();
    expect(screen.getByText('No runs yet.')).toBeInTheDocument();
  });

  it('shows the run total of the query next to the title, also 0 without runs', () => {
    renderSection({ total: 26 });
    expect(screen.getByTestId('schedule-runs-count')).toHaveTextContent('26');
    cleanup();
    renderSection({ runs: [], total: 0 });
    expect(screen.getByTestId('schedule-runs-count')).toHaveTextContent('0');
  });

  it('places the count right after the title, before the Sort select', () => {
    renderSection({ total: 6 });
    const title = screen.getByText('RUNS OF THIS SCHEDULE', { exact: false });
    const count = screen.getByTestId('schedule-runs-count');
    expect(title).toContainElement(count);
    expect(title).toHaveTextContent(/^RUNS OF THIS SCHEDULE\s*6$/);
    const sort = screen.getByRole('combobox', { name: 'Sort runs' });
    expect(count.compareDocumentPosition(sort) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows no count while the total is unknown', () => {
    renderSection();
    expect(screen.queryByTestId('schedule-runs-count')).toBeNull();
  });

  it('shows the not-in-the-list note for an unknown history_run_id', () => {
    renderSection({ runNotFound: true });
    expect(screen.getByRole('region', { name: 'Runs of this schedule' })).toHaveTextContent(
      'That run is not in the list.',
    );
  });

  it('announces the shown run in one polite live region', () => {
    renderSection({ announcement: 'Showing run 21 Oct, 09:00, cron, Success' });
    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Showing run 21 Oct, 09:00, cron, Success');
  });
});

describe('ScheduleRunsSection Open full history', () => {
  afterEach(() => cleanup());

  it('links to the entity History filtered to this schedule', () => {
    renderSection({ fullHistoryLink: '/pipelines/all/80/history?schedule_id=4' });

    expect(screen.getByRole('link', { name: 'Open full history' })).toHaveAttribute(
      'href',
      '/pipelines/all/80/history?schedule_id=4',
    );
    // the app link colour, not the brand colour
    expect(screen.getByRole('link', { name: 'Open full history' })).toHaveStyle({
      color: theme.palette.text.link,
    });
  });

  it('shows no link without fullHistoryLink', () => {
    renderSection();

    expect(screen.queryByRole('link', { name: 'Open full history' })).not.toBeInTheDocument();
  });
});
