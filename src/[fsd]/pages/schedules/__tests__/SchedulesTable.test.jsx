// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';

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
  ...overrides,
});

const renderTable = (rows, isLoading = false, onSort = vi.fn(), emptyMessage) =>
  renderWithTheme(
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
    />,
  );

afterEach(cleanup);

describe('EL-7011 US-26 SchedulesTable', () => {
  it('R2.2 shows the nine columns and no view switch', () => {
    renderTable([makeRow()]);
    [
      'Name & Description',
      'Entity',
      'Type',
      'Schedule',
      'Next run',
      'Last run',
      'Owner',
      'Enabled',
      'Actions',
    ].forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /tiles|view/i })).toBeNull();
  });

  it('R2.3 shows the agent icon in Type and Entity, never the pipeline icon', () => {
    renderTable([makeRow()]);
    expect(screen.getAllByTestId('icon-agent')).toHaveLength(2);
    expect(screen.queryByTestId('icon-pipeline')).toBeNull();
    expect(screen.getByText('Report agent base')).toBeInTheDocument();
  });

  it('R2.3 shows the pipeline icon in Type and Entity', () => {
    renderTable([makeRow({ entity_type: 'pipeline' })]);
    expect(screen.getAllByTestId('icon-pipeline')).toHaveLength(2);
    expect(screen.queryByTestId('icon-agent')).toBeNull();
    expect(
      within(screen.getByTestId('schedule-column-value-entity_type')).getByText('Pipeline'),
    ).toBeInTheDocument();
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
    ['name', 'entity_name', 'entity_type', 'next_run', 'last_run', 'enabled'].forEach(field =>
      expect(screen.getByTestId(`schedule-sort-icon-${field}`)).toBeInTheDocument(),
    );
    ['schedule', 'owner', 'actions'].forEach(field =>
      expect(screen.queryByTestId(`schedule-sort-icon-${field}`)).toBeNull(),
    );
    fireEvent.click(screen.getByTestId('schedule-column-header-entity_name'));
    expect(onSort).toHaveBeenCalledWith('entity_name');
  });

  it('EL-7011 shows the owner name and a disabled kebab in Actions', () => {
    renderTable([makeRow()]);
    expect(within(screen.getByTestId('schedule-column-value-owner')).getByTestId('author')).toHaveTextContent(
      'Ann',
    );
    expect(screen.getByTestId('schedule-1-menu-button')).toBeDisabled();
    expect(screen.getByTestId('schedule-1-menu-button')).toHaveTextContent('0');
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
});
