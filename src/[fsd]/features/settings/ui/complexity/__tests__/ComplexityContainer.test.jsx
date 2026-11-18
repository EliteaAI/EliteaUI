// @vitest-environment jsdom
import { StrictMode } from 'react';

import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsComplexityQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { AnalyticsTestWrapper, RouterHistoryProbe } from '../../analytics/__tests__/_testHelpers';
import ComplexityContainer from '../ComplexityContainer';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('../../analytics/__tests__/_testHelpers');
  installGlobalStubs();
});

const exportToExcel = vi.hoisted(() => vi.fn());
const initiate = vi.hoisted(() => vi.fn());

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  useAnalyticsComplexityQuery: vi.fn(),
  analyticsApi: { endpoints: { analyticsComplexity: { initiate } } },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 3,
  useSelectedProjectName: () => 'My Project',
  useDebounceValue: value => value,
}));
vi.mock('@/[fsd]/shared/lib/utils', async importOriginal => ({ ...(await importOriginal()), exportToExcel }));
vi.mock('@/[fsd]/shared/ui/select', () => ({ SingleSelect: () => null }));
vi.mock('@/[fsd]/shared/ui/tooltip', () => ({ InfoTooltip: props => <div data-testid={props.testId} /> }));
vi.mock('@/[fsd]/shared/ui/info-popover', () => ({
  InfoPopover: props => <div data-testid={`${props.testIdPrefix}-popover`}>{props.label}</div>,
}));
vi.mock('@/components/SearchInput', () => ({
  default: props => (
    <input
      data-testid={props.testId}
      value={props.search}
      onChange={props.onChangeSearch}
    />
  ),
}));
vi.mock('@/assets/refresh-icon.svg?react', () => ({ default: () => null }));
// The real table is exercised elsewhere; a thin double keeps the analytics barrel out of the graph
vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  AnalyticsBreakdownTable: props => (
    <div data-testid={props.testId}>
      {props.titleAction}
      {props.subtitle}
      {props.columns
        .filter(column => column.sortable !== false)
        .map(column => (
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
      {props.footer}
    </div>
  ),
}));

const META = {
  enabled: true,
  thresholds_source: 'default',
  as_of: '2026-11-16T10:24:01+00:00',
  thresholds_computed_at: '2026-11-16T02:41:00+00:00',
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
  useAnalyticsComplexityQuery.mockReturnValue({
    data,
    isFetching: false,
    isError: false,
    refetch: vi.fn().mockResolvedValue({ data }),
  });

const renderAt = (url = '/settings/complexity', { strict = false } = {}) => {
  const tree = (
    <MemoryRouter initialEntries={[url]}>
      <AnalyticsTestWrapper>
        <ComplexityContainer />
        <RouterHistoryProbe />
      </AnalyticsTestWrapper>
    </MemoryRouter>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
};

const lastArgs = () => useAnalyticsComplexityQuery.mock.lastCall[0];
const location = () => screen.getByTestId('history-location');

describe('ComplexityContainer (#7581)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('shows AG/PL indicators, labels and the toolbar actions', () => {
    mockData({
      meta: META,
      total: 2,
      rows: [
        ROW,
        { ...ROW, entity_id: 9, entity_kind: 'pipeline', entity_name: 'Flow', label_pending: true },
      ],
    });
    renderAt();

    expect(screen.getAllByTestId('row')).toHaveLength(2);
    expect(screen.getAllByTestId('entity-type-badge').map(badge => badge.textContent)).toEqual(['AG', 'PL']);
    expect(screen.getByLabelText('Pipeline')).toBeInTheDocument();
    expect(screen.getByTestId('complexity-label')).toHaveTextContent('Medium');
    expect(screen.getAllByText('P71').length).toBeGreaterThan(0);
    expect(screen.getByTestId('complexity-total')).toHaveTextContent('2 agents & pipelines');
    expect(screen.getByTestId('complexity-refresh-button')).toBeInTheDocument();
    expect(screen.getByTestId('complexity-export-button')).toBeInTheDocument();
    expect(screen.getByTestId('complexity-info-popover')).toHaveTextContent('About Complexity');
    // Freshness moved into the table-level info control
    expect(screen.queryByTestId('complexity-freshness')).toBeNull();
    expect(screen.getByTestId('complexity-table-info')).toBeInTheDocument();
  });

  it('drops the default-thresholds note once calibrated and warns when stale', () => {
    mockData({ meta: { ...META, thresholds_source: 'calibrated', stale: true }, total: 0, rows: [] });
    renderAt();

    expect(screen.queryByTestId('complexity-default-thresholds')).toBeNull();
    expect(screen.getByTestId('complexity-stale')).toBeInTheDocument();
  });

  it('opens the entity complexity detail, carrying the list state for Back', () => {
    mockData({ meta: META, total: 1, rows: [{ ...ROW, entity_kind: 'pipeline' }] });
    renderAt('/settings/complexity?search=code&page=2');

    fireEvent.click(screen.getByText('Code Review Bot'));
    expect(location()).toHaveAttribute('data-pathname', '/settings/complexity/3/7');
    const search = new URLSearchParams(location().getAttribute('data-search'));
    expect(search.get('search')).toBe('code');
    expect(search.get('page')).toBe('2');
    expect(search.get('kind')).toBe('pipeline');
  });

  it('sorts Percentile on the server and resets to the first page', () => {
    mockData({ meta: META, total: 100, rows: [ROW] });
    renderAt('/settings/complexity?page=3');
    expect(lastArgs()).toMatchObject({ offset: 60 });

    fireEvent.click(screen.getByTestId('sort-percentile'));
    expect(lastArgs()).toMatchObject({ sortBy: 'percentile', sortOrder: 'desc', offset: 0 });
    fireEvent.click(screen.getByTestId('sort-percentile'));
    expect(lastArgs()).toMatchObject({ sortBy: 'percentile', sortOrder: 'asc' });
  });

  it('restores search, sort and paging from the URL and searches on the server', () => {
    mockData({ meta: META, total: 100, rows: [ROW] });
    renderAt('/settings/complexity?search=bot&sort_by=runs&sort_order=asc&page=1&rows=50');

    expect(lastArgs()).toMatchObject({
      search: 'bot',
      sortBy: 'runs',
      sortOrder: 'asc',
      limit: 50,
      offset: 50,
    });
    fireEvent.change(screen.getByTestId('complexity-search-input'), { target: { value: 'flow' } });
    expect(lastArgs()).toMatchObject({ search: 'flow', offset: 0 });
  });

  it('exports every matching row, not just the visible page', async () => {
    mockData({ meta: META, total: 101, rows: [ROW] });
    const pages = [
      { total: 101, rows: Array.from({ length: 100 }, (_, i) => ({ ...ROW, entity_id: i })) },
      { total: 101, rows: [{ ...ROW, entity_id: 100, percentile: null }] },
    ];
    initiate.mockImplementation(args => ({
      unwrap: () => Promise.resolve(pages[args.offset / 100]),
      unsubscribe: () => {},
    }));
    renderAt('/settings/complexity?search=bot');

    await act(async () => fireEvent.click(screen.getByTestId('complexity-export-button')));

    expect(initiate).toHaveBeenCalledTimes(2);
    expect(initiate.mock.calls[0][0]).toMatchObject({ search: 'bot', limit: 100, offset: 0 });
    const [fileName, sheets] = exportToExcel.mock.lastCall;
    expect(fileName).toMatch(/^complexity_My_Project_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(sheets[0].rows).toHaveLength(101);
  });

  it('returns to page one when a bookmarked page is past the end', () => {
    mockData({ meta: META, total: 0, rows: [] });
    renderAt('/settings/complexity?page=7&search=bot');

    const search = new URLSearchParams(location().getAttribute('data-search'));
    expect(search.get('page')).toBeNull();
    expect(search.get('search')).toBe('bot');
  });

  // #1576 review: no hidden cap, the workbook holds every matching row
  it('pages the export through to the reported total', async () => {
    mockData({ meta: META, total: 5101, rows: [ROW] });
    initiate.mockImplementation(args => ({
      unwrap: () =>
        Promise.resolve({
          total: 5101,
          rows: Array.from({ length: Math.min(100, 5101 - args.offset) }, (_, i) => ({
            ...ROW,
            entity_id: args.offset + i,
          })),
        }),
      unsubscribe: () => {},
    }));
    renderAt();

    await act(async () => fireEvent.click(screen.getByTestId('complexity-export-button')));

    expect(initiate).toHaveBeenCalledTimes(52);
    expect(exportToExcel.mock.lastCall[1][0].rows).toHaveLength(5101);
  });

  // #1576 review: StrictMode's setup/cleanup/setup must not leave the export button spinning
  it('re-enables the export button after a download under StrictMode', async () => {
    mockData({ meta: META, total: 1, rows: [ROW] });
    initiate.mockImplementation(() => ({
      unwrap: () => Promise.resolve({ total: 1, rows: [ROW] }),
      unsubscribe: () => {},
    }));
    renderAt('/settings/complexity', { strict: true });

    await act(async () => fireEvent.click(screen.getByTestId('complexity-export-button')));

    expect(exportToExcel).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('complexity-export-button')).not.toBeDisabled();
  });

  it('warns on the page and in the export when the name search was truncated', async () => {
    mockData({ meta: META, total: 1, rows: [ROW], search_truncated: true });
    initiate.mockImplementation(() => ({
      unwrap: () => Promise.resolve({ total: 1, rows: [ROW] }),
      unsubscribe: () => {},
    }));
    renderAt('/settings/complexity?search=a');

    expect(screen.getByTestId('complexity-search-truncated')).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByTestId('complexity-export-button')));
    const labels = exportToExcel.mock.lastCall[1][0].metadata.map(([label]) => label);
    expect(labels).toContain('Warning');
  });
});
