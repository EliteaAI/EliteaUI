// @vitest-environment jsdom
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsComplexityDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { AnalyticsTestWrapper, RouterHistoryProbe } from '../../analytics/__tests__/_testHelpers';
import ComplexityDetailContainer from '../ComplexityDetailContainer';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('../../analytics/__tests__/_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({ useAnalyticsComplexityDetailQuery: vi.fn() }));
vi.mock('@/api/applications', async importOriginal => ({
  ...(await importOriginal()),
  useApplicationDetailsQuery: () => ({
    data: { name: 'Code Review Bot', versions: [{ id: 11, name: 'base' }] },
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 3 }));
vi.mock('@/[fsd]/shared/ui/select', () => ({ SingleSelect: () => null }));
vi.mock('@/[fsd]/shared/ui/tooltip', () => ({ InfoTooltip: () => null }));
vi.mock('@/[fsd]/shared/ui/info-popover', () => ({ InfoPopover: () => null }));
vi.mock('@/assets/refresh-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/[fsd]/entities/schedule', () => ({
  buildOwnerViewModeParams: () => new URLSearchParams({ viewMode: 'owner' }),
}));
vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  AnalyticsBreakdownTable: props => (
    <div data-testid={props.testId}>
      {props.rows.map(row => (
        <div
          key={row.key}
          data-testid={`${props.testId}-row`}
        >
          {props.columns.map(column => (
            <div key={column.key}>{column.render ? column.render(row) : row[column.key]}</div>
          ))}
        </div>
      ))}
      {props.footer}
    </div>
  ),
}));

const SUMMARY = {
  entity_name: 'Code Review Bot',
  entity_kind: 'agent',
  runs: 40,
  cu_median: 12.4,
  cu_max: 61,
  breakdown: { context: 6, reasoning: 4, tools: 2 },
  label: 'M',
  label_pending: false,
  percentile: 71,
};

const RUN = {
  run_id: 'r-1',
  conversation_id: 'conv-uuid',
  started_at: '2026-11-15T10:00:00+00:00',
  version_id: 11,
  cu_total: 18.3,
  breakdown: { context: 7.3, reasoning: 5, tools: 6 },
  label: 'M',
  percentile: 80,
  llm_calls: 5,
  tool_calls: 6,
};

const renderAt = url =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <AnalyticsTestWrapper>
        <Routes>
          <Route
            path="/settings/complexity/:entityProjectId/:entityId"
            element={<ComplexityDetailContainer />}
          />
          <Route
            path="*"
            element={null}
          />
        </Routes>
        <RouterHistoryProbe />
      </AnalyticsTestWrapper>
    </MemoryRouter>,
  );

const location = () => screen.getByTestId('history-location');

describe('ComplexityDetailContainer (#7581)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsComplexityDetailQuery.mockReturnValue({
      data: {
        meta: { thresholds_source: 'calibrated', as_of: '2026-11-16T10:00:00+00:00' },
        summary: SUMMARY,
        versions: [{ ...SUMMARY, version_id: 11, label: 'H' }],
        total: 1,
        runs: [RUN],
      },
      isFetching: false,
    });
  });
  afterEach(cleanup);

  it('shows the exact summary, versions and recent runs in one request scoped to the entity', () => {
    renderAt('/settings/complexity/3/7?period=7&entity_type=application');

    expect(useAnalyticsComplexityDetailQuery).toHaveBeenCalledTimes(1);
    expect(useAnalyticsComplexityDetailQuery.mock.lastCall[0]).toMatchObject({
      entityId: '7',
      entityProjectId: '3',
      entityType: 'application',
      sortBy: 'ts',
      sortOrder: 'desc',
      offset: 0,
    });
    expect(screen.getByTestId('complexity-detail-title')).toHaveTextContent('Code Review Bot');
    expect(screen.getByTestId('complexity-detail-label')).toHaveTextContent('Medium');
    expect(screen.getAllByTestId('complexity-versions-table-row')).toHaveLength(1);
    expect(screen.getAllByTestId('complexity-recent-runs-row')).toHaveLength(1);
  });

  it('links a run start time to that run’s Complexity tab', () => {
    useAnalyticsComplexityDetailQuery.mockReturnValue({
      data: {
        meta: {},
        summary: { ...SUMMARY, entity_kind: 'pipeline' },
        versions: [],
        total: 1,
        runs: [RUN],
      },
      isFetching: false,
    });
    renderAt('/settings/complexity/3/7');

    const href = screen.getByTestId('complexity-run-link').getAttribute('href');
    const [path, query] = href.split('?');
    expect(path).toBe('/pipelines/all/7/history/analytics');
    const params = new URLSearchParams(query);
    expect(params.get('usage_run_id')).toBe('conv-uuid');
    expect(params.get('analytics_tab')).toBe('complexity');
    expect(params.get('viewMode')).toBe('owner');
  });

  it('returns to the list with its search, sort and page, minus detail-only keys', () => {
    renderAt('/settings/complexity/3/7?search=code&page=2&sort_by=runs&kind=agent&runs_page=1');

    fireEvent.click(screen.getByTestId('complexity-detail-back'));
    expect(location()).toHaveAttribute('data-pathname', '/settings/complexity');
    const search = new URLSearchParams(location().getAttribute('data-search'));
    expect(Object.fromEntries(search)).toEqual({ search: 'code', page: '2', sort_by: 'runs' });
  });
});
