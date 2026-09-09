// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsUserDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AnalyticsUserDetailed from '../AnalyticsUserDetailed';
import { AnalyticsTestWrapper as Wrapper } from '../_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('../_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  useAnalyticsUserDetailQuery: vi.fn(),
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
  user_id: 7,
  user_email: 'alice@example.com',
  kpis: {
    total_events: 100,
    active_days: 5,
    llm_events: 20,
    tool_events: 30,
    agent_events: 10,
    chat_events: 5,
    errors: 0,
    input_tokens: 1000,
    output_tokens: 500,
    total_tokens: 1500,
    cache_read_tokens: 222,
    cache_creation_tokens: 111,
    llm_cost: 0.0234,
    input_cost: 0.0156,
    output_cost: 0.0078,
    cache_read_cost: 0.0022,
    cache_creation_cost: 0.0011,
  },
  models: [],
  tools: [],
  agents: [],
  daily_activity: [],
};

describe('AnalyticsUserDetailed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsUserDetailQuery.mockReturnValue({ data: MOCK, isFetching: false });
  });

  afterEach(() => cleanup());

  it('renders the token and cost KPI cards', () => {
    render(
      <AnalyticsUserDetailed
        projectId={1}
        userId={7}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('kpi-TOTAL TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-INPUT TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-OUTPUT TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE READ TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE WRITE TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-TOTAL COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-INPUT TOKEN COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-OUTPUT TOKEN COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE READ COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE WRITE COST')).toBeTruthy();
  });

  it('labels every cost KPI as estimated', () => {
    render(
      <AnalyticsUserDetailed
        projectId={1}
        userId={7}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('kpi-TOTAL COST-subtitle').textContent).toMatch(/estimated/i);
    expect(screen.getByTestId('kpi-INPUT TOKEN COST-subtitle').textContent).toMatch(/estimated/i);
    expect(screen.getByTestId('kpi-OUTPUT TOKEN COST-subtitle').textContent).toMatch(/estimated/i);
    expect(screen.getByTestId('kpi-CACHE READ COST-subtitle').textContent).toMatch(/estimated/i);
    expect(screen.getByTestId('kpi-CACHE WRITE COST-subtitle').textContent).toMatch(/estimated/i);
  });

  it('renders formatted token and cost values from kpis', () => {
    render(
      <AnalyticsUserDetailed
        projectId={1}
        userId={7}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('1500')).toBeTruthy(); // total_tokens
    expect(screen.getByText('1000')).toBeTruthy(); // input_tokens
    expect(screen.getByText('500')).toBeTruthy(); // output_tokens
    expect(screen.getByText('222')).toBeTruthy(); // cache_read_tokens
    expect(screen.getByText('111')).toBeTruthy(); // cache_creation_tokens
    expect(screen.getByText('$0.0234')).toBeTruthy(); // llm_cost
    expect(screen.getByText('$0.0156')).toBeTruthy(); // input_cost
    expect(screen.getByText('$0.0078')).toBeTruthy(); // output_cost
    expect(screen.getByText('$0.0022')).toBeTruthy(); // cache_read_cost
    expect(screen.getByText('$0.0011')).toBeTruthy(); // cache_creation_cost
  });
});
