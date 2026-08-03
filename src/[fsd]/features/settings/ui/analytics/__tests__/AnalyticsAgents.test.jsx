// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsAgentsQuery } from '@/api';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AnalyticsAgents from '../AnalyticsAgents';
import { AnalyticsTestWrapper as Wrapper } from '../_testHelpers';

// Stub browser globals via vi.hoisted BEFORE any vi.mock factory or ESM
// import can touch slices/settings.js (localStorage) or MUI TablePagination
// (ResizeObserver) at module scope.
vi.hoisted(async () => {
  const { installGlobalStubs } = await import('../_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  useAnalyticsAgentsQuery: vi.fn(),
}));

vi.mock('@/api', () => ({
  useAnalyticsAgentsQuery: vi.fn(),
}));

// SearchInput transitively imports slices/settings.js — stubbed at storage
// level above, but mocking here keeps the test focused on analytics.
vi.mock('@/components/SearchInput', () => ({
  default: () => null,
}));

// The analytics barrel pulls in the whole feature. Stub the two consumers
// this file uses.
vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  AnalyticsAgentDetailed: () => null,
  ChartTooltip: () => null,
}));

vi.mock('@/[fsd]/features/settings/lib/constants', () => ({
  AnalyticsCommonConstants: {
    TOP_LIST_SIZE: 10,
    MODEL_CHART_SIZE: 15,
    CHART_COLORS: ['#4285F4'],
  },
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: {
    fmtNum: v => (v == null ? '0' : String(v)),
    fmtCost: v => (v == null ? '$0.00' : `$${v.toFixed(4)}`),
    fmtDuration: v => (v == null ? '0ms' : `${v}ms`),
  },
}));

const AGENT_ROW = {
  entity_id: 42,
  entity_name: 'CodeReviewBot',
  events: 100,
  users: 3,
  avg_duration_ms: 1500,
  errors: 0, // avoid palette.status.rejected lookup path
  input_tokens: 12345,
  output_tokens: 6789,
  total_tokens: 19134,
  llm_cost: 0.4321,
  avg_tokens_per_call: 191,
};

const MOCK = { total: 1, rows: [AGENT_ROW], chat_daily: [] };

describe('AnalyticsAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentsQuery.mockReturnValue({ data: MOCK, isFetching: false });
  });

  afterEach(() => cleanup());

  it('renders the Agent Activity table with the 4 new columns', () => {
    render(
      <AnalyticsAgents
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      {
        wrapper: Wrapper,
      },
    );
    // Table headers for the four new columns land verbatim in the DOM
    expect(screen.getByText('Input')).toBeTruthy();
    expect(screen.getByText('Output')).toBeTruthy();
    expect(screen.getByText('Avg / Call')).toBeTruthy();
    expect(screen.getByText('Cost')).toBeTruthy();
  });

  it('renders per-row input/output tokens, avg-per-call, and cost values', () => {
    render(
      <AnalyticsAgents
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      {
        wrapper: Wrapper,
      },
    );
    expect(screen.getByText('12345')).toBeTruthy(); // input_tokens
    expect(screen.getByText('6789')).toBeTruthy(); // output_tokens
    expect(screen.getByText('19134')).toBeTruthy(); // total_tokens
    expect(screen.getByText('191')).toBeTruthy(); // avg_tokens_per_call
    expect(screen.getByText('$0.4321')).toBeTruthy(); // llm_cost
  });

  it('coerces missing avg_tokens_per_call to 0 without crashing', () => {
    const rowMissingAvg = { ...AGENT_ROW, avg_tokens_per_call: undefined };
    useAnalyticsAgentsQuery.mockReturnValue({
      data: { total: 1, rows: [rowMissingAvg], chat_daily: [] },
      isFetching: false,
    });
    // Would throw if the JSX passed undefined into Math.round without guard.
    expect(() =>
      render(
        <AnalyticsAgents
          projectId={1}
          dateFrom="2026-01-01"
          dateTo="2026-01-31"
        />,
        {
          wrapper: Wrapper,
        },
      ),
    ).not.toThrow();
  });
});
