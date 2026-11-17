// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsComplexityQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { AnalyticsRouterTestWrapper as Wrapper } from '../../analytics/__tests__/_testHelpers';
import ComplexityContainer from '../ComplexityContainer';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('../../analytics/__tests__/_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({ useAnalyticsComplexityQuery: vi.fn() }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 3 }));
vi.mock('@/[fsd]/shared/ui/select', () => ({ SingleSelect: () => null }));
vi.mock('@/[fsd]/shared/ui/tooltip', () => ({ InfoTooltip: () => null }));
// The real table is exercised elsewhere; a thin double keeps the analytics barrel out of the graph
vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  AnalyticsBreakdownTable: props => (
    <div data-testid={props.testId}>
      {props.columns.map(column => (
        <button
          key={column.key}
          data-testid={`sort-${column.key}`}
          onClick={() => props.onSort(column.sortKey ?? column.key)}
        />
      ))}
      {props.rows.map(row => (
        <div
          key={row.key}
          data-testid="row"
        >
          {props.columns.map(column => (
            <div key={column.key}>{column.render ? column.render(row) : row[column.key]}</div>
          ))}
        </div>
      ))}
    </div>
  ),
}));
vi.mock('@/[fsd]/features/settings/ui/analytics/components/EntityKindChip', () => ({ default: () => null }));
vi.mock('@/[fsd]/entities/schedule', () => ({
  buildOwnerViewModeParams: () => new URLSearchParams({ viewMode: 'owner' }),
}));
const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}));

const META = {
  enabled: true,
  thresholds_source: 'default',
  as_of: '2026-11-16T10:24:01+00:00',
  stale: false,
};

const ROW = {
  entity_id: 7,
  entity_project_id: 3,
  entity_type: 'application',
  entity_kind: 'agent',
  entity_name: 'Code Review Bot',
  runs: 42,
  cu_median: 12.4,
  cu_max: 61,
  breakdown: { context: 6.2, reasoning: 4.1, tools: 2.1 },
  label: 'M',
  label_pending: false,
  percentile: 71,
};

const mockData = data =>
  useAnalyticsComplexityQuery.mockReturnValue({ data, isFetching: false, isError: false });

describe('ComplexityContainer (EL-7556)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('lists scored agents with label, percentile and the freshness notes', () => {
    mockData({
      meta: META,
      total: 1,
      rows: [
        ROW,
        { ...ROW, entity_id: 8, entity_name: 'New Bot', label: null, label_pending: true, percentile: null },
      ],
    });
    render(<ComplexityContainer />, { wrapper: Wrapper });

    expect(screen.getAllByTestId('row')).toHaveLength(2);
    expect(screen.getByText('Code Review Bot', { selector: 'button' })).toBeInTheDocument();
    expect(screen.getByTestId('complexity-label')).toHaveTextContent('Medium');
    expect(screen.getByTestId('complexity-label-pending')).toBeInTheDocument();
    expect(screen.getByText('P71')).toBeInTheDocument();
    expect(screen.getByTestId('complexity-freshness')).toHaveTextContent('Scores as of');
    expect(screen.getByTestId('complexity-default-thresholds')).toBeInTheDocument();
    expect(screen.queryByTestId('complexity-stale')).toBeNull();
  });

  it('drops the default-thresholds note once calibrated and warns when stale', () => {
    mockData({ meta: { ...META, thresholds_source: 'calibrated', stale: true }, total: 0, rows: [] });
    render(<ComplexityContainer />, { wrapper: Wrapper });

    expect(screen.queryByTestId('complexity-default-thresholds')).toBeNull();
    expect(screen.getByTestId('complexity-stale')).toBeInTheDocument();
  });

  // The breadcrumb back to the editor 404s without the owner view mode
  it('opens Run History in owner view mode, by kind', () => {
    mockData({
      meta: META,
      total: 2,
      rows: [ROW, { ...ROW, entity_id: 9, entity_kind: 'pipeline', entity_name: 'Flow' }],
    });
    render(<ComplexityContainer />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText('Code Review Bot'));
    expect(navigate).toHaveBeenLastCalledWith('/agents/all/7/history?viewMode=owner');
    fireEvent.click(screen.getByText('Flow'));
    expect(navigate).toHaveBeenLastCalledWith('/pipelines/all/9/history?viewMode=owner');
  });

  it('sorts on the server, toggling the direction on a second click', () => {
    mockData({ meta: META, total: 1, rows: [ROW] });
    render(<ComplexityContainer />, { wrapper: Wrapper });

    fireEvent.click(screen.getByTestId('sort-runs'));
    expect(useAnalyticsComplexityQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'runs', sortOrder: 'desc', offset: 0 }),
      expect.anything(),
    );
    fireEvent.click(screen.getByTestId('sort-runs'));
    expect(useAnalyticsComplexityQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'runs', sortOrder: 'asc' }),
      expect.anything(),
    );
  });
});
