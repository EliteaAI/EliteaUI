// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsAgentDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AnalyticsAgentDetailed from '../AnalyticsAgentDetailed';
import { AnalyticsTestWrapper as Wrapper } from '../_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('../_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  useAnalyticsAgentDetailQuery: vi.fn(),
}));

vi.mock('@/components/Icons/ArrowBackIcon', () => ({ default: () => null }));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  ChartTooltip: () => null,
  KPICard: ({ label, value, subtitle }) => (
    <div data-testid={`kpi-${label}`}>
      <span>{value}</span>
      {subtitle && <span data-testid={`kpi-${label}-subtitle`}>{subtitle}</span>}
    </div>
  ),
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: {
    fmtNum: v => (v == null ? '0' : String(v)),
    fmtCost: v => (v == null ? '$0.00' : `$${v.toFixed(4)}`),
    fmtDuration: v => (v == null ? '0ms' : `${v}ms`),
  },
}));

const MOCK = {
  entity_name: 'CodeReviewBot',
  kpis: {
    total_events: 100,
    unique_users: 3,
    avg_duration_ms: 1500,
    errors: 0,
    error_rate: 0,
    input_tokens: 12345,
    output_tokens: 6789,
    total_tokens: 19134,
    llm_cost: 0.4321,
    avg_cost_per_call: 0.001,
  },
  users: [],
  tools: [],
  daily_usage: [],
};

describe('AnalyticsAgentDetailed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentDetailQuery.mockReturnValue({ data: MOCK, isFetching: false });
  });

  afterEach(() => cleanup());

  it('renders the 5 new token/cost KPI cards', () => {
    render(
      <AnalyticsAgentDetailed
        projectId={1}
        entityId={42}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('kpi-Total Tokens')).toBeTruthy();
    expect(screen.getByTestId('kpi-Input Tokens')).toBeTruthy();
    expect(screen.getByTestId('kpi-Output Tokens')).toBeTruthy();
    expect(screen.getByTestId('kpi-Total Cost')).toBeTruthy();
    expect(screen.getByTestId('kpi-Avg Cost / Call')).toBeTruthy();
  });

  it('labels the two cost KPIs as estimated', () => {
    render(
      <AnalyticsAgentDetailed
        projectId={1}
        entityId={42}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('kpi-Total Cost-subtitle').textContent).toMatch(/estimated/i);
    expect(screen.getByTestId('kpi-Avg Cost / Call-subtitle').textContent).toMatch(/estimated/i);
  });

  it('renders formatted token and cost values from kpis', () => {
    render(
      <AnalyticsAgentDetailed
        projectId={1}
        entityId={42}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('19134')).toBeTruthy(); // total_tokens
    expect(screen.getByText('12345')).toBeTruthy(); // input_tokens
    expect(screen.getByText('6789')).toBeTruthy(); // output_tokens
    expect(screen.getByText('$0.4321')).toBeTruthy(); // llm_cost
    expect(screen.getByText('$0.0010')).toBeTruthy(); // avg_cost_per_call
  });
});
