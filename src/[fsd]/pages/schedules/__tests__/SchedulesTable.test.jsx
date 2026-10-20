// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import SchedulesTable from '../SchedulesTable';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

vi.mock('@/[fsd]/shared/lib/helpers/schedule.helpers', async importOriginal => ({
  ...(await importOriginal()),
  getCronSummaryInBrowserTimezone: () => 'At 00:00 on Saturday',
  getBrowserTimezone: () => 'America/New_York',
}));
vi.mock('@/[fsd]/shared/ui/icon/EntityTypeIcon', () => ({
  default: ({ type }) => <span data-testid={`icon-${type}`} />,
}));

const NEXT_RUN = '2026-10-24T21:00:00Z';

const makeRow = (overrides = {}) => ({
  id: 1,
  name: 'Nightly',
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

const renderTable = rows =>
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <SchedulesTable
        rows={rows}
        total={rows.length}
        page={0}
        pageSize={20}
        onPageChange={vi.fn()}
        onChangePageSize={vi.fn()}
      />
    </ThemeProvider>,
  );

afterEach(cleanup);

describe('EL-7011 US-26 SchedulesTable', () => {
  it('R2.2 shows the nine columns and no view switch', () => {
    renderTable([makeRow()]);
    ['Name', 'Entity', 'Type', 'Schedule', 'Next run', 'Last run', 'Owner', 'Enabled', 'Actions'].forEach(
      label => expect(screen.getByText(label)).toBeInTheDocument(),
    );
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
    expect(screen.getByText(new Date(NEXT_RUN).toLocaleString())).toBeInTheDocument();
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
});
