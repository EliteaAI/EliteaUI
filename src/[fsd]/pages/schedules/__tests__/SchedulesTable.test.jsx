// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';

import { getPollingInterval } from '../SchedulesPage';
import SchedulesTable from '../SchedulesTable';
import { renderWithTheme } from './_testHelpers';

await vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/shared/lib/helpers/schedule.helpers', async importOriginal => ({
  ...(await importOriginal()),
  getCronSummaryInBrowserTimezone: () => 'At 00:00 on Saturday',
  getBrowserTimezone: () => 'America/New_York',
}));
// AuthorContainer and DotMenu need the store and the router; the Agents list tests mock them the same way
vi.mock('@/components/AuthorContainer', () => ({
  default: ({ authors }) => <span data-testid="author">{authors.map(author => author.name).join(',')}</span>,
}));
vi.mock('@/components/DotMenu', () => ({
  default: ({ id, disabled, children }) => (
    <button
      data-testid={`${id}-menu-button`}
      disabled={disabled}
    >
      {children.length}
    </button>
  ),
}));
const rowActions = vi.hoisted(() => ({
  onRun: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onDelete: vi.fn(),
  isBusy: false,
}));
vi.mock('@/[fsd]/features/schedule/lib/hooks/useScheduleRowActions.hooks', () => ({
  useScheduleRowActions: () => rowActions,
}));
vi.mock('@/[fsd]/shared/ui/icon/EntityTypeIcon', () => ({
  default: ({ type }) => <span data-testid={`icon-${type}`} />,
}));

const NEXT_RUN = '2026-10-24T21:00:00Z';

const makeRow = (overrides = {}) => ({
  id: 1,
  name: 'Nightly',
  description: 'Sends the nightly report',
  entity_type: 'agent',
  entity_name: 'Report agent',
  version_name: 'base',
  cron: '0 0 * * 6',
  timezone: 'Europe/Kyiv',
  next_run: NEXT_RUN,
  last_run_status: 'success',
  last_run_reason: null,
  owner: { id: 3, name: 'Ann' },
  enabled: true,
  allowed_actions: ['run', 'pause', 'resume', 'delete'],
  ...overrides,
});

const renderTable = (rows, isLoading = false, onSort = vi.fn(), emptyMessage, toolbar) =>
  renderWithTheme(
    <MemoryRouter>
      <SchedulesTable
        rows={rows}
        isLoading={isLoading}
        total={rows.length}
        page={0}
        pageSize={20}
        onPageChange={vi.fn()}
        onChangePageSize={vi.fn()}
        sortConfig={{ field: 'next_run', direction: 'asc' }}
        onSort={onSort}
        emptyMessage={emptyMessage}
        toolbar={toolbar}
      />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  rowActions.isBusy = false;
});

describe('EL-7011 US-26 SchedulesTable', () => {
  it('R2.2 EL-7011 shows the eight columns, with Entity Name and no Type, and no view switch', () => {
    renderTable([makeRow()]);
    [
      'Name & Description',
      'Entity Name',
      'Schedule',
      'Next run',
      'Last run',
      'Owner',
      'Enabled',
      'Actions',
    ].forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.queryByText('Type')).toBeNull();
    expect(screen.queryByTestId('schedule-column-header-entity_type')).toBeNull();
    expect(screen.queryByRole('button', { name: /tiles|view/i })).toBeNull();
  });

  it('R2.3 EL-7011 shows one agent icon named Agent, never the pipeline icon', () => {
    renderTable([makeRow()]);
    expect(screen.getAllByTestId('icon-agent')).toHaveLength(1);
    expect(screen.queryByTestId('icon-pipeline')).toBeNull();
    expect(screen.getByRole('img', { name: 'Agent' })).toBeInTheDocument();
  });

  it('R2.3 EL-7011 shows one pipeline icon named Pipeline', () => {
    renderTable([makeRow({ entity_type: 'pipeline' })]);
    expect(screen.getAllByTestId('icon-pipeline')).toHaveLength(1);
    expect(screen.queryByTestId('icon-agent')).toBeNull();
    expect(screen.getByRole('img', { name: 'Pipeline' })).toBeInTheDocument();
  });

  it('R2.6 EL-7011 shows the version on a second line of the Entity Name cell', () => {
    renderTable([makeRow()]);
    const cell = within(screen.getByTestId('schedule-column-value-entity_name'));
    expect(cell.getByText('Report agent')).toBeInTheDocument();
    expect(cell.getByText('base')).toBeInTheDocument();
  });

  it('R2.6 EL-7011 shows no second line without a version', () => {
    renderTable([makeRow({ version_name: null })]);
    const cell = screen.getByTestId('schedule-column-value-entity_name');
    expect(within(cell).getByText('Report agent')).toBeInTheDocument();
    expect(cell).not.toHaveTextContent('base');
  });

  it('R2.4 shows the rule with the timezone and Next run in the viewer timezone', () => {
    renderTable([makeRow()]);
    expect(screen.getByText('At 00:00 on Saturday (America/New_York)')).toBeInTheDocument();
    const nextRun = within(screen.getByTestId('schedule-column-value-next_run'));
    expect(nextRun.getByTitle(new Date(NEXT_RUN).toLocaleString())).toHaveTextContent(
      /^[A-Z][a-z]{2}, \d{2} /,
    );
  });

  it('EL-7011 shows the description under the bold name, like Agents', () => {
    renderTable([makeRow()]);
    expect(screen.getByTestId('schedule-name')).toHaveTextContent('Nightly');
    expect(screen.getByTestId('schedule-description')).toHaveTextContent('Sends the nightly report');
  });

  it('EL-7011 shows sort arrows on the sortable headers only and sorts by the API field', () => {
    const onSort = vi.fn();
    renderTable([makeRow()], false, onSort);
    ['name', 'entity_name', 'next_run', 'last_run', 'enabled'].forEach(field =>
      expect(screen.getByTestId(`schedule-sort-icon-${field}`)).toBeInTheDocument(),
    );
    ['schedule', 'owner', 'actions', 'entity_type'].forEach(field =>
      expect(screen.queryByTestId(`schedule-sort-icon-${field}`)).toBeNull(),
    );
    fireEvent.click(screen.getByTestId('schedule-column-header-entity_name'));
    expect(onSort).toHaveBeenCalledWith('entity_name');
  });

  it('EL-7011 shows the owner name in Owner', () => {
    renderTable([makeRow()]);
    expect(within(screen.getByTestId('schedule-column-value-owner')).getByTestId('author')).toHaveTextContent(
      'Ann',
    );
  });

  it('R2.2 EL-7011 shows the row menu with the allowed actions', () => {
    renderTable([makeRow({ allowed_actions: ['run', 'pause', 'delete'] })]);
    expect(screen.getByTestId('schedule-1-menu-button')).toHaveTextContent('3');
  });

  it('R1.3 EL-7011 shows no menu and a disabled Enabled switch without allowed actions', () => {
    renderTable([makeRow({ allowed_actions: [] })]);
    expect(screen.queryByTestId('schedule-1-menu-button')).toBeNull();
    expect(screen.getByRole('switch', { name: 'Enable Nightly' })).toBeDisabled();
  });

  it('R3.1 EL-7011 pauses an enabled schedule from the switch', () => {
    renderTable([makeRow()]);
    const toggle = screen.getByRole('switch', { name: 'Enable Nightly' });
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(rowActions.onPause).toHaveBeenCalledTimes(1);
    expect(rowActions.onResume).not.toHaveBeenCalled();
  });

  it('R3.1 EL-7011 resumes a paused schedule from the switch', () => {
    renderTable([makeRow({ enabled: false })]);
    fireEvent.click(screen.getByRole('switch', { name: 'Enable Nightly' }));
    expect(rowActions.onResume).toHaveBeenCalledTimes(1);
    expect(rowActions.onPause).not.toHaveBeenCalled();
  });

  it('R3.1 EL-7011 disables the switch while a row call is busy', () => {
    rowActions.isBusy = true;
    renderTable([makeRow()]);
    expect(screen.getByRole('switch', { name: 'Enable Nightly' })).toBeDisabled();
  });

  it('R2.3 EL-7011 polls every 10 seconds only while a row shows Running', () => {
    expect(getPollingInterval([makeRow(), makeRow({ id: 2, last_run_status: 'running' })])).toBe(10000);
    expect(getPollingInterval([makeRow()])).toBe(0);
    expect(getPollingInterval(undefined)).toBe(0);
  });

  it.each([
    ['failed', 'Failed'],
    ['skipped', 'Skipped'],
    ['blocked', 'Blocked'],
  ])('R2.5 shows the reason under a %s last run', (status, label) => {
    renderTable([makeRow({ last_run_status: status, last_run_reason: `why ${status}` })]);
    const cell = screen.getByTestId('schedule-column-value-last_run');
    expect(within(cell).getByText(label)).toBeInTheDocument();
    expect(within(cell).getByText(`why ${status}`)).toBeInTheDocument();
  });

  it('R2.5 shows no reason for a successful last run', () => {
    renderTable([makeRow({ last_run_reason: 'ignored' })]);
    expect(screen.queryByText('ignored')).toBeNull();
  });

  it('R3.1 shows the empty state without rows', () => {
    renderTable([]);
    expect(screen.getByText('No schedules')).toBeInTheDocument();
  });

  it('EL-7011 R1.4 shows the emptyMessage prop when it is set', () => {
    renderTable([], false, vi.fn(), 'No schedules match the filters');
    expect(screen.getByText('No schedules match the filters')).toBeInTheDocument();
    expect(screen.queryByText('No schedules')).not.toBeInTheDocument();
  });

  it('R2.1 shows the loading text, not the empty state, while loading', () => {
    renderTable([], true);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('No schedules')).not.toBeInTheDocument();
  });

  it('EL-7011 R1.4 keeps the filter bar on screen when no row matches', () => {
    renderTable([], false, vi.fn(), 'No schedules match the filters', <span data-testid="bar" />);
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByText('No schedules match the filters')).toBeInTheDocument();
  });

  it('EL-7011 tells screen readers the result count', () => {
    renderTable([makeRow(), makeRow({ id: 2 })], false, vi.fn(), undefined, <span />);
    expect(screen.getByText('2 schedules')).toHaveAttribute('aria-live', 'polite');
  });
});
