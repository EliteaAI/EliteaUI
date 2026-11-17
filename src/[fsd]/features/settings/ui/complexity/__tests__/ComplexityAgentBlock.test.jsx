// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsComplexityDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { AnalyticsRouterTestWrapper as Wrapper } from '../../analytics/__tests__/_testHelpers';
import ComplexityAgentBlock from '../ComplexityAgentBlock';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('../../analytics/__tests__/_testHelpers');
  installGlobalStubs();
});

const fixture = vi.hoisted(() => ({ platformSettings: {} }));

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({ useAnalyticsComplexityDetailQuery: vi.fn() }));
vi.mock('@/api/platformSettings', () => ({
  useGetPlatformSettingsQuery: () => ({ data: fixture.platformSettings }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 3 }));
vi.mock('@/[fsd]/shared/ui/select', () => ({ SingleSelect: () => null }));
vi.mock('@/[fsd]/shared/ui/tooltip', () => ({ InfoTooltip: () => null }));
vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  AnalyticsBreakdownTable: props => (
    <div data-testid={props.testId}>
      {props.rows.map(row => (
        <div
          key={row.key}
          data-testid="version-row"
        >
          {props.columns.map(column => (
            <div key={column.key}>{column.render ? column.render(row) : row[column.key]}</div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

const SUMMARY = {
  runs: 40,
  cu_median: 12.4,
  cu_max: 61,
  breakdown: { context: 6, reasoning: 4, tools: 2 },
  label: 'M',
  label_pending: false,
  percentile: 71,
};

describe('ComplexityAgentBlock (EL-7556)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsComplexityDetailQuery.mockReturnValue({
      data: {
        meta: { thresholds_source: 'calibrated' },
        summary: SUMMARY,
        versions: [
          { ...SUMMARY, version_id: 11, runs: 30, label: 'H' },
          { ...SUMMARY, version_id: 12, runs: 2, label: null, label_pending: true },
        ],
      },
      isFetching: false,
    });
  });
  afterEach(cleanup);

  it('renders nothing and skips the request while Complexity is off', () => {
    fixture.platformSettings = {};
    render(<ComplexityAgentBlock entityId={7} />, { wrapper: Wrapper });

    expect(screen.queryByTestId('complexity-agent-block')).toBeNull();
    expect(useAnalyticsComplexityDetailQuery).toHaveBeenCalledWith(expect.anything(), { skip: true });
  });

  // #1570 review: a failed read must not claim there are no scored runs
  it('hides the block when the request fails', () => {
    fixture.platformSettings = { complexity_enabled: true };
    useAnalyticsComplexityDetailQuery.mockReturnValue({ data: undefined, isFetching: false, isError: true });
    render(<ComplexityAgentBlock entityId={7} />, { wrapper: Wrapper });

    expect(screen.queryByTestId('complexity-agent-block')).toBeNull();
    expect(screen.queryByText(/No scored runs/)).toBeNull();
  });

  it('shows the all-version label and one row per version with its name', () => {
    fixture.platformSettings = { complexity_enabled: true };
    render(
      <ComplexityAgentBlock
        entityId={7}
        versions={[{ id: 11, name: 'base' }]}
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByTestId('complexity-agent-label')).toHaveTextContent('Medium');
    expect(screen.getByText(/40 runs, all versions/)).toBeInTheDocument();
    expect(screen.getAllByTestId('version-row')).toHaveLength(2);
    expect(screen.getByText('base')).toBeInTheDocument();
    expect(screen.getByText('#12')).toBeInTheDocument();
    expect(screen.getAllByTestId('complexity-version-label')[0]).toHaveTextContent('High');
  });
});
