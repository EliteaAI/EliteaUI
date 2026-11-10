// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { lists, details } = vi.hoisted(() => ({
  // version id → the list query result
  lists: { current: {} },
  // schedule id → approval rule
  details: { current: {} },
}));

vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { id: 1 } }) }));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 3 }));
vi.mock('@/[fsd]/entities/schedule/api/scheduleApi.js', () => ({
  // Only the first page: no test lists more than 100 schedules
  useGetScheduleListQuery: (args, { skip }) => (skip || args.page ? {} : lists.current[args.versionId]),
  useGetScheduleQuery: ({ scheduleId }) => ({ data: { approval_rule: details.current[scheduleId] } }),
}));
vi.mock('@/[fsd]/shared/lib/helpers', () => ({
  ScheduleHelpers: {
    getBrowserTimezone: () => 'Europe/Berlin',
    getCronSummaryInBrowserTimezone: cron => `cron ${cron}`,
  },
}));

const { default: CompareSchedulesBlock } = await import('../CompareSchedulesBlock');

const theme = createTheme({ palette: darkPalette });

const row = (id, name, extra = {}) => ({
  id,
  name,
  cron: '0 9 * * 1',
  timezone: 'UTC',
  run_mode: 'entry_point',
  enabled: true,
  next_run: '2026-11-10T09:00:00Z',
  owner: { id: 1, name: 'Ann' },
  ...extra,
});

const listOf = (rows, extra = {}) => ({
  data: { rows, total: rows.length },
  isError: false,
  isLoading: false,
  isFetching: false,
  refetch: vi.fn(),
  ...extra,
});

const renderBlock = props =>
  render(
    <ThemeProvider theme={theme}>
      <CompareSchedulesBlock
        entityType="pipeline"
        entityId={9}
        leftVersionId={1}
        rightVersionId={2}
        leftData={{}}
        rightData={{}}
        isAdmin
        onOpenSchedule={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('CompareSchedulesBlock', () => {
  beforeEach(() => {
    details.current = {};
    lists.current = { 1: listOf([]), 2: listOf([]) };
  });
  afterEach(() => cleanup());

  it('lists the schedules of each version and pairs them by name', () => {
    lists.current = {
      1: listOf([row(10, 'Nightly'), row(11, 'Only base')]),
      2: listOf([row(20, 'nightly ', { owner: { id: 2, name: 'Bob' } })]),
    };
    renderBlock();
    expect(screen.getByTestId('compare-schedule-left-10')).toHaveAttribute('data-unpaired', 'false');
    expect(screen.getByTestId('compare-schedule-right-20')).toHaveAttribute('data-unpaired', 'false');
    expect(screen.getByTestId('compare-schedule-left-11')).toHaveAttribute('data-unpaired', 'true');
    expect(screen.getByTestId('compare-schedule-left-10-owner_id')).toHaveAttribute('data-changed', 'true');
    expect(screen.getByTestId('compare-schedule-left-10-cron')).toHaveAttribute('data-changed', 'false');
  });

  it('shows the labels of each field', () => {
    details.current = { 10: 'run_without_asking' };
    lists.current = {
      1: listOf([
        row(10, 'Report', { run_mode: 'prompt', enabled: false, disabled_reason: 'version_deleted' }),
      ]),
      2: listOf([]),
    };
    renderBlock();
    const card = screen.getByTestId('compare-schedule-left-10');
    expect(card).toHaveTextContent('cron 0 9 * * 1');
    expect(card).toHaveTextContent('Shown: Europe/Berlin');
    expect(card).toHaveTextContent('Prompt');
    expect(card).toHaveTextContent('Paused: version was deleted');
    expect(card).toHaveTextContent('Run without asking');
    expect(card).toHaveTextContent('You');
    expect(screen.getByTestId('compare-schedule-left-10-next_run')).toHaveTextContent('—');
  });

  it('highlights a different approval rule once both details load', () => {
    details.current = { 10: 'pause_and_ask', 20: 'run_without_asking' };
    lists.current = { 1: listOf([row(10, 'Report')]), 2: listOf([row(20, 'Report')]) };
    renderBlock();
    expect(screen.getByTestId('compare-schedule-left-10-approval_rule')).toHaveAttribute(
      'data-changed',
      'true',
    );
  });

  it('says when a version runs no schedules', () => {
    renderBlock();
    expect(screen.getByTestId('compare-schedules-empty-left')).toHaveTextContent(
      'No schedules run this version.',
    );
    expect(screen.getByTestId('compare-schedules-empty-right')).toBeInTheDocument();
  });

  it('notes that a non-admin sees only their own schedules, even with none', () => {
    renderBlock({ isAdmin: false });
    expect(screen.getByTestId('compare-schedules-only-yours')).toHaveTextContent(
      'Only your schedules are shown.',
    );
    cleanup();
    renderBlock({ isAdmin: true });
    expect(screen.queryByTestId('compare-schedules-only-yours')).not.toBeInTheDocument();
  });

  it('offers a retry when the schedules fail to load', () => {
    const refetch = vi.fn();
    lists.current = { 1: listOf([], { isError: true, refetch }), 2: listOf([]) };
    renderBlock();
    expect(screen.getByTestId('compare-schedules-error')).toHaveTextContent('Failed to load schedules.');
    fireEvent.click(screen.getByTestId('compare-schedules-retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows more when a version has more schedules than the page', () => {
    lists.current = {
      1: { ...listOf([row(10, 'A')]), data: { rows: [row(10, 'A')], total: 25 } },
      2: listOf([]),
    };
    renderBlock();
    expect(screen.getByTestId('compare-schedules-show-more-left')).toBeInTheDocument();
    expect(screen.queryByTestId('compare-schedules-show-more-right')).not.toBeInTheDocument();
  });

  it('shows the legacy cron trigger as a read-only card', () => {
    renderBlock({ leftData: { legacy_trigger: { cron: '*/5 * * * *', timezone: 'UTC' } } });
    const card = screen.getByTestId('compare-legacy-schedule-left');
    expect(card).toHaveTextContent('Legacy schedule (cron)');
    expect(card).toHaveTextContent('*/5 * * * *');
    expect(card).toHaveTextContent('Not editable. Create a new schedule in the Schedules section.');
  });

  it('opens a schedule from its card', () => {
    const onOpenSchedule = vi.fn();
    lists.current = { 1: listOf([row(10, 'Report', { version_id: 1 })]), 2: listOf([]) };
    renderBlock({ onOpenSchedule });
    fireEvent.click(screen.getByTestId('compare-schedule-open-left-10'));
    // The schedule's own version goes with it, as in the editor's Schedules section
    expect(onOpenSchedule).toHaveBeenCalledWith(10, 1);
  });
});
