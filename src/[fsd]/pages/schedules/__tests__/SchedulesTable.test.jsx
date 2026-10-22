// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatRunStarted } from '@/[fsd]/features/schedule';
import { TIME_FORMAT } from '@/common/constants';
import { timeFormatter } from '@/common/utils';
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
  default: ({ authors, showName = true }) => (
    <span data-testid="author">{showName ? authors.map(author => author.name).join(',') : 'avatar'}</span>
  ),
}));
vi.mock('@/components/DotMenu', () => ({
  default: ({ id, disabled, children, anchorButtonProps }) => (
    <button
      data-testid={`${id}-menu-button`}
      disabled={disabled}
      {...anchorButtonProps}
    >
      {children.length}
    </button>
  ),
}));
vi.mock('@/components/Icons/CalendarIcon', () => ({ default: () => <span data-testid="calendar-icon" /> }));
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
const LAST_RUN = '2026-10-23T21:00:00Z';

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
  last_run: LAST_RUN,
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

// The table picks its tier from the measured box (useGetComponentWidth reads offsetWidth). The box is the
// window minus the main sidebar, the Settings menu and the page gutters (spec section 2), plus the
// 1.5 rem gutters that sit inside the measured box.
const SIDE_MENUS_PX = 484;
const GUTTERS_PX = 48;
const SIDEBAR_COLLAPSE_PX = 152;
let boxWidth = 0;
const setWindowWidth = (width, extra = 0) => {
  boxWidth = width - SIDE_MENUS_PX + GUTTERS_PX + extra;
};
const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => boxWidth });
afterAll(() => Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth));

beforeEach(() => setWindowWidth(1600));

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
    expect(screen.getByTestId('schedule-column-value-next_run')).toHaveTextContent(/^[A-Z][a-z]{2}, \d{2} /);
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
    const owner = screen.getByTestId('schedule-column-value-owner');
    expect(within(owner).getByTestId('author')).toBeInTheDocument();
    expect(within(owner).getByText('Ann')).toBeInTheDocument();
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

  it.each([
    ['running', 'Running'],
    ['waiting_for_approval', 'Waiting for input'], // the owner's label for the approval wait
  ])('BUG-35 US-28 R2.5 shows %s in the Last run cell from last_run_status', (status, label) => {
    renderTable([makeRow({ last_run_status: status })]);
    const cell = screen.getByTestId('schedule-column-value-last_run');
    expect(within(cell).getByText(label)).toBeInTheDocument();
  });

  it('BUG-35 US-28 R2.5 refetches for a Running row but not for a row that only waits for approval', () => {
    expect(getPollingInterval([makeRow({ last_run_status: 'waiting_for_approval' })])).toBe(0);
    expect(
      getPollingInterval([
        makeRow({ last_run_status: 'waiting_for_approval' }),
        makeRow({ id: 2, last_run_status: 'running' }),
      ]),
    ).toBe(10000);
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

// EL-7011 QA bug 2026-10-21 table width, owner: no hidden columns (spec schedules-table-fit-spec.md)
describe('EL-7011 US-26 SchedulesTable fits 8 columns at 1280, 1440 and 1600 px', () => {
  const FIELDS = ['name', 'entity_name', 'schedule', 'next_run', 'last_run', 'owner', 'enabled', 'actions'];
  const DATA_FIELDS = ['entity_name', 'schedule', 'next_run', 'last_run', 'owner', 'enabled'];
  const SORTABLE = ['name', 'entity_name', 'next_run', 'last_run', 'enabled'];
  const TEXT_COLUMNS = 'minmax(10.25rem, 1.3fr) minmax(7.5rem, 1fr) minmax(7.25rem, 1fr)';
  const TEMPLATES = {
    compact: `${TEXT_COLUMNS} 5.75rem 5.75rem 3.5rem 5.5rem 4.25rem`,
    regular: `${TEXT_COLUMNS} 7.75rem 7.75rem 6.75rem 5.5rem 4.25rem`, // CR-23 D12; dates like "Nov, 30 23:30" fit
    comfortable: `${TEXT_COLUMNS} 9.25rem 9.25rem 9.75rem 6rem 6.5625rem`, // CR-23 D12
  };
  const minGridWidthPx = template =>
    template
      .match(/minmax\([\d.]+rem|[\d.]+rem/g)
      .reduce((sum, token) => sum + parseFloat(token.replace('minmax(', '')) * 16, 0);
  const headerTemplate = () =>
    getComputedStyle(screen.getByTestId('schedule-column-header-name').parentElement).gridTemplateColumns;
  const timeOf = value =>
    new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const dateOf = value => timeFormatter(value, TIME_FORMAT.MMMDD);

  it.each([
    [1280, 'compact'],
    [1440, 'regular'],
    [1600, 'comfortable'],
  ])(
    'AC1-AC3 at %i px shows all 8 headers and cells in the %s tier, lined up, with no overflow',
    (width, tier) => {
      setWindowWidth(width);
      renderTable([makeRow(), makeRow({ id: 2 })]);
      FIELDS.forEach(field =>
        expect(screen.getByTestId(`schedule-column-header-${field}`)).toBeInTheDocument(),
      );
      DATA_FIELDS.forEach(field =>
        expect(screen.getAllByTestId(`schedule-column-value-${field}`)).toHaveLength(2),
      );
      expect(screen.getAllByTestId('schedule-name')).toHaveLength(2);
      expect(screen.getByTestId('schedule-1-menu-button')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-2-menu-button')).toBeInTheDocument();
      // AC1 and AC2: the columns fit the table box, so the row menu stays in the window
      expect(headerTemplate()).toBe(TEMPLATES[tier]);
      expect(minGridWidthPx(headerTemplate())).toBeLessThanOrEqual(width - SIDE_MENUS_PX);
      // AC3: header and rows share one grid template, so the cell edges line up
      screen
        .getAllByTestId('schedule-row')
        .forEach(row => expect(getComputedStyle(row).gridTemplateColumns).toBe(headerTemplate()));
    },
  );

  it.each([1280, 1440, 1600])(
    'AC5 at %i px keeps the sort test ids and sorts the 5 sortable columns',
    width => {
      setWindowWidth(width);
      const onSort = vi.fn();
      renderTable([makeRow()], false, onSort);
      SORTABLE.forEach(field => {
        expect(screen.getByTestId(`schedule-sort-icon-${field}`)).toBeInTheDocument();
        fireEvent.click(screen.getByTestId(`schedule-column-header-${field}`));
        expect(onSort).toHaveBeenLastCalledWith(field);
      });
      ['schedule', 'owner', 'actions'].forEach(field =>
        expect(screen.queryByTestId(`schedule-sort-icon-${field}`)).toBeNull(),
      );
    },
  );

  it('AC4 at 1280 px shows the owner avatar only, with the full name in a tooltip', () => {
    setWindowWidth(1280);
    renderTable([makeRow()]);
    const owner = screen.getByTestId('schedule-column-value-owner');
    expect(within(owner).getByTestId('author')).toHaveTextContent('avatar');
    expect(owner).not.toHaveTextContent('Ann');
    expect(within(owner).getByLabelText('Ann')).toBeInTheDocument();
  });

  it('AC4 CR-23 R5.1 at 1280 px shows the last run date and time on two lines, the status icon after the time, the reason in a tooltip', () => {
    setWindowWidth(1280);
    renderTable([makeRow({ last_run_status: 'failed', last_run_reason: 'Agent is deleted' })]);
    const lastRun = screen.getByTestId('schedule-column-value-last_run');
    expect(within(lastRun).getByText(dateOf(LAST_RUN))).toBeInTheDocument();
    const time = within(lastRun).getByText(timeOf(LAST_RUN));
    const icon = within(lastRun).getByRole('img', { name: 'Failed' });
    expect(time.parentElement).toContainElement(icon);
    expect(lastRun).not.toHaveTextContent('Failed');
    expect(lastRun).not.toHaveTextContent('Agent is deleted');
    expect(
      within(lastRun).getByLabelText(`Failed - ${formatRunStarted(LAST_RUN)}. Agent is deleted`),
    ).toBeInTheDocument();
  });

  it('AC4 at 1280 px shows Next run on two lines and the rule without the zone, with tooltips', () => {
    setWindowWidth(1280);
    renderTable([makeRow()]);
    const nextRun = screen.getByTestId('schedule-column-value-next_run');
    expect(within(nextRun).getByText(timeOf(NEXT_RUN))).toBeInTheDocument();
    expect(within(nextRun).queryByTestId('calendar-icon')).toBeNull();
    expect(within(nextRun).getByLabelText(new Date(NEXT_RUN).toLocaleString())).toBeInTheDocument();
    const schedule = screen.getByTestId('schedule-column-value-schedule');
    expect(within(schedule).getByText('At 00:00 on Saturday')).toBeInTheDocument();
    expect(within(schedule).getByLabelText('At 00:00 on Saturday (America/New_York)')).toBeInTheDocument();
  });

  it('AC4 at 1280 px uses the compact header and cell padding and centres the row menu', () => {
    setWindowWidth(1280);
    renderTable([makeRow()]);
    expect(getComputedStyle(screen.getByTestId('schedule-column-header-owner')).paddingLeft).toBe('0.5rem');
    expect(getComputedStyle(screen.getByTestId('schedule-column-value-owner')).paddingLeft).toBe('0.5rem');
    expect(getComputedStyle(screen.getByTestId('schedule-row').lastElementChild).justifyContent).toBe(
      'center',
    );
  });

  it('AC4 at 1440 px shows the owner name, the status word with no border and Next run on one line', () => {
    setWindowWidth(1440);
    renderTable([makeRow()]);
    expect(screen.getByTestId('schedule-column-value-owner')).toHaveTextContent('Ann');
    // CR-23 R5.1 and D11: line 1 the date and time on one line, line 2 the status icon and word
    const lastRun = screen.getByTestId('schedule-column-value-last_run');
    expect(lastRun).toHaveTextContent(`${dateOf(LAST_RUN)} ${timeOf(LAST_RUN)}`);
    expect(within(lastRun).getByRole('img', { name: 'Success' })).toBeInTheDocument();
    expect(within(lastRun).getByText('Success')).toBeInTheDocument();
    expect(within(lastRun).queryByTestId('calendar-icon')).toBeNull();
    const nextRun = screen.getByTestId('schedule-column-value-next_run');
    expect(within(nextRun).queryByText(timeOf(NEXT_RUN))).toBeNull();
    expect(nextRun).toHaveTextContent(timeOf(NEXT_RUN));
    expect(within(nextRun).queryByTestId('calendar-icon')).toBeNull();
    expect(within(nextRun).getByLabelText(new Date(NEXT_RUN).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText('At 00:00 on Saturday (America/New_York)')).toBeInTheDocument();
    expect(getComputedStyle(screen.getByTestId('schedule-column-header-owner')).paddingLeft).toBe('0.75rem');
  });

  it('AC4 at 1600 px shows the owner name, the status chip and the calendar icon', () => {
    renderTable([makeRow()]);
    expect(screen.getByTestId('schedule-column-value-owner')).toHaveTextContent('Ann');
    // CR-23 R5.1 and D11: the calendar icon and the date on line 1, the status icon and word on line 2
    const lastRun = screen.getByTestId('schedule-column-value-last_run');
    expect(within(lastRun).getByTestId('calendar-icon')).toBeInTheDocument();
    expect(lastRun).toHaveTextContent(`${dateOf(LAST_RUN)} ${timeOf(LAST_RUN)}`);
    expect(within(lastRun).getByRole('img', { name: 'Success' })).toBeInTheDocument();
    expect(within(lastRun).queryByTestId('schedule-run-status')).not.toHaveClass('MuiChip-outlined');
    expect(
      within(screen.getByTestId('schedule-column-value-next_run')).getByTestId('calendar-icon'),
    ).toBeInTheDocument();
  });

  it.each([1280, 1440, 1600])('CR-23 R5.2 at %i px shows - in Last run for a row with no run', width => {
    setWindowWidth(width);
    renderTable([makeRow({ last_run: null, last_run_status: null })]);
    expect(screen.getByTestId('schedule-column-value-last_run')).toHaveTextContent(/^-$/);
  });

  it.each([1440, 1600])(
    'CR-23 R2.5 at %i px shows the reason after the status on line 2, with the full text in the tooltip',
    width => {
      setWindowWidth(width);
      renderTable([
        makeRow({ last_run_status: 'skipped', last_run_reason: 'The previous run is still running' }),
      ]);
      const lastRun = screen.getByTestId('schedule-column-value-last_run');
      const status = within(lastRun).getByText('Skipped');
      const reason = within(lastRun).getByText('The previous run is still running');
      expect(status.parentElement).toBe(reason.parentElement);
      expect(
        within(lastRun).getByLabelText(
          `Skipped - ${formatRunStarted(LAST_RUN)}. The previous run is still running`,
        ),
      ).toBeInTheDocument();
    },
  );

  it.each([1280, 1600])('shows Paused in Next run for a paused schedule at %i px', width => {
    setWindowWidth(width);
    renderTable([makeRow({ enabled: false, next_run: null })]);
    expect(screen.getByTestId('schedule-column-value-next_run')).toHaveTextContent('Paused');
  });

  it('names the row menu button More actions', () => {
    renderTable([makeRow()]);
    expect(screen.getByTestId('schedule-1-menu-button')).toHaveAttribute('aria-label', 'More actions');
  });

  it('AC6 at 1000 px scrolls header and rows in one box and pins the Actions column', () => {
    setWindowWidth(1000);
    renderTable([makeRow()]);
    const header = screen.getByTestId('schedule-column-header-name').parentElement;
    const row = screen.getByTestId('schedule-row');
    const scrollBox = header.parentElement.parentElement.parentElement;
    expect(getComputedStyle(scrollBox).overflowX).toBe('auto');
    expect(scrollBox).toContainElement(row);
    expect(getComputedStyle(header.parentElement.parentElement).minWidth).toBe('49.75rem');
    const actionsCell = screen.getByTestId('schedule-row').lastElementChild;
    expect(getComputedStyle(actionsCell).position).toBe('sticky');
    expect(getComputedStyle(actionsCell).right).toBe('0px');
    expect(getComputedStyle(screen.getByTestId('schedule-column-header-actions')).position).toBe('sticky');
  });

  it('AC6 at 1280 px keeps the Actions column in place when the table fits', () => {
    setWindowWidth(1280);
    renderTable([makeRow()]);
    expect(getComputedStyle(screen.getByTestId('schedule-row').lastElementChild).position).not.toBe('sticky');
  });

  it('AC6 at 1280 px with the main sidebar collapsed switches to the regular tier', () => {
    setWindowWidth(1280, SIDEBAR_COLLAPSE_PX);
    renderTable([makeRow()]);
    expect(headerTemplate()).toBe(TEMPLATES.regular);
  });
});
