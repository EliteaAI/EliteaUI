// @vitest-environment jsdom
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsAgentsQuery } from '@/api';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AnalyticsAgents from '../AnalyticsAgents';
import {
  AnalyticsTestWrapper,
  RouterHistoryProbe,
  AnalyticsRouterTestWrapper as Wrapper,
} from './_testHelpers';

// Stub browser globals via vi.hoisted BEFORE any vi.mock factory or ESM
// import can touch slices/settings.js (localStorage) or MUI TablePagination
// (ResizeObserver) at module scope.
vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  useAnalyticsAgentsQuery: vi.fn(),
}));

// importWizardApi is reached through the entities barrel and calls eliteaApi.enhanceEndpoints()
// at module scope, so the mocked barrel has to answer for it. No endpoint is exercised here.
vi.mock('@/api', async () => {
  const { createEliteaApiStub } = await import('./_testHelpers');
  return {
    eliteaApi: createEliteaApiStub(),
    TAG_TYPE_APPLICATIONS: 'TAG_TYPE_APPLICATIONS',
    TAG_TYPE_TOTAL_APPLICATIONS: 'TAG_TYPE_TOTAL_APPLICATIONS',
    useAnalyticsAgentsQuery: vi.fn(),
  };
});

// @/common/utils imports the configured store, and building it evaluates every slice — whose
// extraReducers match on eliteaApi endpoints that the mocked '@/api' barrel never injects.
// Nothing in this test dispatches, so a bare store double keeps that work out of the graph.
vi.mock('@/[fsd]/shared/config/store', () => ({
  default: { getState: () => ({}), dispatch: vi.fn(), subscribe: vi.fn() },
}));

// SearchInput transitively imports slices/settings.js — stubbed at storage
// level above, but mocking here keeps the test focused on analytics.
vi.mock('@/components/SearchInput', () => ({
  default: () => null,
}));

// The analytics barrel pulls in the whole feature. Stub the two consumers
// this file uses.
vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  AnalyticsAgentDetailed: props => (
    <button
      data-testid="agent-detail"
      data-can-view-skills={String(props.canViewSkills)}
      data-entity-id={props.entityId}
      onClick={props.onBack}
    />
  ),
  ChartTooltip: () => null,
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', async () => ({
  AnalyticsUrlStateHelpers: await vi.importActual(
    '@/[fsd]/features/settings/lib/helpers/analyticsUrlState.helpers.js',
  ),
  AnalyticCommonHelpers: {
    fmtNum: v => (v == null ? '0' : String(v)),
    barChartCursor: () => ({}),
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
  cache_read_tokens: 2222,
  cache_creation_tokens: 1111,
  llm_cost: 0.4321,
  input_cost: 0.1234,
  output_cost: 0.3087,
  cache_read_cost: 0.0022,
  cache_creation_cost: 0.0011,
};

const MOCK = { total: 1, rows: [AGENT_ROW], chat_daily: [] };

describe('AnalyticsAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentsQuery.mockReturnValue({ data: MOCK, isFetching: false });
  });

  afterEach(() => cleanup());

  it('renders the Agent Activity table with the token and cost columns', () => {
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
    // Token and cost column headers land verbatim in the DOM
    expect(screen.getByText('Total Cost')).toBeTruthy();
    expect(screen.getByText('Input Token Cost')).toBeTruthy();
    expect(screen.getByText('Output Token Cost')).toBeTruthy();
    expect(screen.getByText('Total Tokens')).toBeTruthy();
    expect(screen.getByText('Input Tokens')).toBeTruthy();
    expect(screen.getByText('Output Tokens')).toBeTruthy();
    expect(screen.getByText('Cache Read Tokens')).toBeTruthy();
    expect(screen.getByText('Cache Write Tokens')).toBeTruthy();
    expect(screen.getByText('Cache Read Cost')).toBeTruthy();
    expect(screen.getByText('Cache Write Cost')).toBeTruthy();
  });

  it('renders per-row token counts and costs', () => {
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
    expect(screen.getByText('2222')).toBeTruthy(); // cache_read_tokens
    expect(screen.getByText('1111')).toBeTruthy(); // cache_creation_tokens
    expect(screen.getByText('$0.4321')).toBeTruthy(); // llm_cost
    expect(screen.getByText('$0.1234')).toBeTruthy(); // input_cost
    expect(screen.getByText('$0.3087')).toBeTruthy(); // output_cost
    expect(screen.getByText('$0.0022')).toBeTruthy(); // cache_read_cost
    expect(screen.getByText('$0.0011')).toBeTruthy(); // cache_creation_cost
  });

  it('renders a row whose token and cost fields are missing without crashing', () => {
    const sparseRow = {
      entity_id: 42,
      entity_name: 'CodeReviewBot',
      events: 100,
      users: 3,
      avg_duration_ms: 1500,
      errors: 0,
    };
    useAnalyticsAgentsQuery.mockReturnValue({
      data: { total: 1, rows: [sparseRow], chat_daily: [] },
      isFetching: false,
    });
    // The formatters have to absorb undefined rather than propagate it into the JSX.
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

describe('AnalyticsAgents — agent detail skills gating (#7030)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentsQuery.mockReturnValue({ data: MOCK, isFetching: false });
  });

  afterEach(() => cleanup());

  it.each([
    [true, 'true'],
    [false, 'false'],
  ])('passes canViewSkills=%s to the selected agent detail', (canViewSkills, expected) => {
    render(
      <AnalyticsAgents
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
        canViewSkills={canViewSkills}
      />,
      { wrapper: Wrapper },
    );

    fireEvent.click(screen.getAllByText('CodeReviewBot').at(-1));

    expect(screen.getByTestId('agent-detail')).toHaveAttribute('data-can-view-skills', expected);
  });
});

const LocationProbe = () => (
  <div
    data-testid="location"
    data-search={useLocation().search}
  />
);

const renderAt = url =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <LocationProbe />
      <AnalyticsTestWrapper>
        <AnalyticsAgents
          projectId={1}
          dateFrom="2026-01-01"
          dateTo="2026-01-31"
        />
      </AnalyticsTestWrapper>
    </MemoryRouter>,
  );

const searchOf = () => new URLSearchParams(screen.getByTestId('location').dataset.search);

describe('AnalyticsAgents — selected agent in the URL (#7033)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentsQuery.mockReturnValue({ data: MOCK, isFetching: false });
  });

  afterEach(() => cleanup());

  it('opens the agent named in the URL, so Back from a run page restores it', () => {
    renderAt('/settings/analytics?tab=agents&agent_id=42');

    expect(screen.getByTestId('agent-detail')).toHaveAttribute('data-entity-id', '42');
  });

  it('writes the clicked agent into the URL and keeps the other params', () => {
    renderAt('/settings/analytics?tab=agents&range=30');

    fireEvent.click(screen.getAllByText('CodeReviewBot').at(-1));

    expect(searchOf().get('agent_id')).toBe('42');
    expect(searchOf().get('range')).toBe('30');
  });

  it('clears the agent from the URL on Back', () => {
    renderAt('/settings/analytics?tab=agents&agent_id=42');

    fireEvent.click(screen.getByTestId('agent-detail'));

    expect(searchOf().has('agent_id')).toBe(false);
    expect(screen.queryByTestId('agent-detail')).toBeNull();
  });
});

const renderWithHistory = url =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <RouterHistoryProbe />
      <AnalyticsTestWrapper>
        <AnalyticsAgents
          projectId={1}
          dateFrom="2026-01-01"
          dateTo="2026-01-31"
        />
      </AnalyticsTestWrapper>
    </MemoryRouter>,
  );

const historySearch = () => new URLSearchParams(screen.getByTestId('history-location').dataset.search);

describe('AnalyticsAgents browser history (#7033)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentsQuery.mockReturnValue({ data: MOCK, isFetching: false });
  });

  afterEach(() => cleanup());

  it('returns from an opened agent to the list on browser Back', () => {
    renderWithHistory('/settings/analytics?tab=agents&range=0');

    fireEvent.click(screen.getAllByText('CodeReviewBot').at(-1));
    expect(screen.getByTestId('agent-detail')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('history-back'));

    expect(screen.queryByTestId('agent-detail')).toBeNull();
    expect(historySearch().has('agent_id')).toBe(false);
  });

  it('returns to the agent detail on browser Back after the in-page Back arrow', () => {
    renderWithHistory('/settings/analytics?tab=agents&range=0&agent_id=42');

    fireEvent.click(screen.getByTestId('agent-detail'));
    expect(screen.queryByTestId('agent-detail')).toBeNull();

    fireEvent.click(screen.getByTestId('history-back'));

    expect(screen.getByTestId('agent-detail')).toHaveAttribute('data-entity-id', '42');
  });
});
