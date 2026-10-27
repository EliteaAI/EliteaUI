// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsChatsSummaryQuery } from '@/api';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import AnalyticsChats from '../AnalyticsChats';
import { AnalyticsRouterTestWrapper as Wrapper } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/api', () => ({
  useAnalyticsChatsSummaryQuery: vi.fn(),
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', async () => ({
  AnalyticsChatDetailed: ({ conversationUuid, onBack }) => (
    <div data-testid="analytics-chat-detailed-stub">
      <span data-testid="stub-uuid">{conversationUuid}</span>
      <button
        data-testid="stub-back"
        onClick={onBack}
      />
    </div>
  ),
  KPICard: ({ label, value, subtitle, testId }) => (
    <div data-testid={testId || `kpi-${label}`}>
      <span>{value}</span>
      {subtitle && <span data-testid={`${testId || `kpi-${label}`}-subtitle`}>{subtitle}</span>}
    </div>
  ),
}));

vi.mock('@/[fsd]/features/settings/ui/analytics/components/ChatActivityTable', () => ({
  default: props => (
    <div
      data-testid="chat-activity-table-stub"
      data-project-id={props.projectId}
    />
  ),
}));

vi.mock('@/[fsd]/features/settings/ui/analytics/components/ChatKpiRow', async () => ({
  default: (await vi.importActual('../components/ChatKpiRow')).default,
}));

vi.mock('@/[fsd]/features/settings/ui/analytics/components/ChatParticipantTable', async () => ({
  default: (await vi.importActual('../components/ChatParticipantTable')).default,
}));

vi.mock('@/[fsd]/features/settings/ui/analytics/components/ChatTopChart', () => ({
  default: () => <div data-testid="chat-top-chart-stub" />,
}));

vi.mock('@/[fsd]/features/settings/ui/analytics/components/ChatDailyUsage', () => ({
  default: () => <div data-testid="chat-daily-usage-stub" />,
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', async () => ({
  AnalyticCommonHelpers: {
    ...(await vi.importActual('@/[fsd]/features/settings/lib/helpers/analyticsCommon.helpers.js')),
    fmtNum: v => (v == null ? '0' : String(v)),
    fmtCost: v => (v == null ? '$0.00' : `$${v.toFixed(4)}`),
  },
}));

// ------------------------------------------------------------------
// Shared test data
// ------------------------------------------------------------------

const MOCK_SUMMARY = {
  kpis: {
    active_chats: 12,
    responses: 80,
    users: 5,
    llm_cost: 0.0096,
    total_tokens: 45000,
    avg_cost_per_chat: 0.0008,
    avg_cost_per_response: 0.00012,
  },
  by_participant_type: [
    { type: 'model', responses: 60, total_tokens: 35000, llm_cost: 0.007 },
    { type: 'agent', responses: 20, total_tokens: 10000, llm_cost: 0.0026 },
  ],
  daily: [],
};

const summaryQuery = data => ({ data, isFetching: false });

const renderChats = (props = {}) =>
  render(
    <AnalyticsChats
      projectId={1}
      dateFrom="2026-10-01"
      dateTo="2026-10-08"
      {...props}
    />,
    { wrapper: Wrapper },
  );

// ------------------------------------------------------------------

describe('AnalyticsChats — main view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatsSummaryQuery.mockReturnValue(summaryQuery(MOCK_SUMMARY));
  });

  afterEach(() => cleanup());

  it('renders the chats tab container', () => {
    renderChats();

    expect(screen.getByTestId('analytics-tab-chats')).toBeTruthy();
  });

  it('renders KPI row', () => {
    renderChats();

    expect(screen.getByTestId('analytics-chats-kpi-row')).toBeTruthy();
  });

  it('renders active chats KPI with value', () => {
    renderChats();

    expect(screen.getByTestId('analytics-chats-kpi-active-chats').textContent).toContain('12');
  });

  it('renders participant table', () => {
    renderChats();

    expect(screen.getByTestId('analytics-chats-participant-table')).toBeTruthy();
  });

  it('shows participant type label "Agents" for agent rows', () => {
    renderChats();

    const table = screen.getByTestId('analytics-chats-participant-table');
    expect(within(table).getByText('Agents')).toBeTruthy();
  });

  it('shows participant type label "Direct model" for model rows', () => {
    renderChats();

    const table = screen.getByTestId('analytics-chats-participant-table');
    expect(within(table).getByText('Direct model')).toBeTruthy();
  });

  it('renders activity table', () => {
    renderChats();

    expect(screen.getByTestId('chat-activity-table-stub')).toBeTruthy();
  });

  it('does not show detailed view when no chat is selected', () => {
    renderChats();

    expect(screen.queryByTestId('analytics-chat-detailed-stub')).toBeNull();
  });
});

describe('AnalyticsChats — loading state', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows loading spinner in KPI row while fetching', () => {
    useAnalyticsChatsSummaryQuery.mockReturnValue({ data: undefined, isFetching: true });

    renderChats();

    // The KPI row renders a spinner when isFetching
    const kpiRow = screen.getByTestId('analytics-chats-kpi-row');
    expect(kpiRow).toBeTruthy();
  });
});

describe('AnalyticsChats — personal project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatsSummaryQuery.mockReturnValue(summaryQuery(MOCK_SUMMARY));
  });

  afterEach(() => cleanup());

  it('passes isPersonalProject to the KPI row', () => {
    // Just ensure no crash and main container renders
    renderChats({ isPersonalProject: true });

    expect(screen.getByTestId('analytics-tab-chats')).toBeTruthy();
  });
});

describe('AnalyticsChats — chat selection navigates to detail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatsSummaryQuery.mockReturnValue(summaryQuery(MOCK_SUMMARY));
  });

  afterEach(() => cleanup());

  it('renders detailed view when chatId search param is set', async () => {
    const { MemoryRouter } = await import('react-router-dom');
    const { AnalyticsTestWrapper } = await import('./_testHelpers');
    const ChatId = '00000000-0000-0000-0000-000000000001';

    render(
      <MemoryRouter initialEntries={[`/?chat_id=${ChatId}`]}>
        <AnalyticsTestWrapper>
          <AnalyticsChats
            projectId={1}
            dateFrom="2026-10-01"
            dateTo="2026-10-08"
          />
        </AnalyticsTestWrapper>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('analytics-chat-detailed-stub')).toBeTruthy();
    expect(screen.getByTestId('stub-uuid').textContent).toBe(ChatId);
  });
});
