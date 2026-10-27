// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsApi, useAnalyticsChatDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import AnalyticsChatDetailed from '../AnalyticsChatDetailed';
import { AnalyticsRouterTestWrapper as Wrapper } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  analyticsApi: {
    endpoints: {
      analyticsChatRuns: { initiate: vi.fn() },
    },
  },
  useAnalyticsChatDetailQuery: vi.fn(),
}));

vi.mock('@/components/Icons/ArrowBackIcon', () => ({ default: () => null }));
vi.mock('@/assets/download.svg?react', () => ({ default: () => null }));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

vi.mock('@/[fsd]/features/settings/ui/analytics/components/AnalyticsLazySection', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/[fsd]/features/settings/ui/analytics/components/ChatRecentRunsTable', () => ({
  default: () => <div data-testid="chat-recent-runs-stub" />,
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', async () => ({
  AnalyticsBreakdownTable: (await vi.importActual('../components/AnalyticsBreakdownTable')).default,
  ChatRecentRunsTable: () => <div data-testid="chat-recent-runs-stub" />,
  DeletedChip: (await vi.importActual('../components/DeletedChip')).default,
  ChartTooltip: () => null,
  KPICard: ({ label, value, subtitle, testId }) => (
    <div data-testid={testId || `kpi-${label}`}>
      <span>{value}</span>
      {subtitle && <span data-testid={`${testId || `kpi-${label}`}-subtitle`}>{subtitle}</span>}
    </div>
  ),
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', async () => ({
  AnalyticsExportHelpers: {
    exportChatDetail: vi.fn(() => Promise.resolve()),
  },
  AnalyticCommonHelpers: {
    ...(await vi.importActual('@/[fsd]/features/settings/lib/helpers/analyticsCommon.helpers.js')),
    fmtNum: v => (v == null ? '0' : String(v)),
    fmtCost: v => (v == null ? '$0.00' : `$${v.toFixed(4)}`),
    fmtDuration: v => (v == null ? '0ms' : `${v}ms`),
  },
}));

vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectName: () => 'Test project',
}));

// ------------------------------------------------------------------
// Shared test data
// ------------------------------------------------------------------

const MOCK_DATA = {
  chat_name: 'Code Review Chat',
  is_private: false,
  is_deleted: false,
  can_open: true,
  conversation_id: 42,
  owner_email: 'alice@example.com',
  kpis: {
    responses: 8,
    users: 2,
    errors: 1,
    llm_cost: 0.0042,
    input_cost: 0.0021,
    output_cost: 0.0021,
    cache_read_cost: 0.0,
    cache_creation_cost: 0.0,
    total_tokens: 5000,
    input_tokens: 2000,
    output_tokens: 3000,
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
    llm_calls: 10,
    tool_calls: 3,
    avg_cost_per_response: 0.000525,
    avg_duration_ms: 1200,
    first_activity: '2026-10-01T10:00:00',
    last_activity: '2026-10-08T18:00:00',
    below_resolution: {},
  },
  by_participant: [
    {
      participant_type: 'model',
      participant_name: 'model',
      responses: 6,
      total_tokens: 4000,
      llm_cost: 0.003,
      errors: 0,
    },
    {
      participant_type: 'agent',
      participant_name: 'ReviewBot',
      responses: 2,
      total_tokens: 1000,
      llm_cost: 0.0012,
      errors: 1,
    },
  ],
  by_model: [
    {
      model_name: 'gpt-4',
      display_name: 'GPT-4 Turbo',
      calls: 10,
      responses: 8,
      total_tokens: 5000,
      llm_cost: 0.0042,
    },
  ],
  by_user: [
    { user_id: 11, user_email: 'alice@example.com', responses: 5, total_tokens: 3000, llm_cost: 0.0025 },
  ],
  tools: [],
  daily_usage: [],
};

const detailQuery = data => ({ currentData: data, isFetching: false, error: undefined });

const renderDetail = props =>
  render(
    <AnalyticsChatDetailed
      projectId={1}
      conversationUuid="00000000-0000-0000-0000-000000000001"
      dateFrom="2026-10-01"
      dateTo="2026-10-08"
      onBack={vi.fn()}
      {...props}
    />,
    { wrapper: Wrapper },
  );

// ------------------------------------------------------------------

describe('AnalyticsChatDetailed — loading state', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows loading spinner while fetching', () => {
    useAnalyticsChatDetailQuery.mockReturnValue({
      currentData: undefined,
      isFetching: true,
      error: undefined,
    });

    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-loading')).toBeTruthy();
  });
});

describe('AnalyticsChatDetailed — empty / error state', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows 404 message when no data and error status is 404', () => {
    useAnalyticsChatDetailQuery.mockReturnValue({
      currentData: undefined,
      isFetching: false,
      error: { status: 404 },
    });

    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-empty')).toBeTruthy();
    expect(screen.getByTestId('analytics-chat-detail-back-button')).toBeTruthy();
  });

  it('shows fallback error message for non-404 failures', () => {
    useAnalyticsChatDetailQuery.mockReturnValue({
      currentData: undefined,
      isFetching: false,
      error: { status: 500 },
    });

    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-empty').textContent).toMatch(/failed/i);
  });
});

describe('AnalyticsChatDetailed — header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatDetailQuery.mockReturnValue(detailQuery(MOCK_DATA));
  });

  afterEach(() => cleanup());

  it('renders the chat title', () => {
    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-title').textContent).toBe('Code Review Chat');
  });

  it('renders back button', () => {
    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-back-button')).toBeTruthy();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderDetail({ onBack });

    fireEvent.click(screen.getByTestId('analytics-chat-detail-back-button'));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows deleted chip when is_deleted is true', () => {
    useAnalyticsChatDetailQuery.mockReturnValue(detailQuery({ ...MOCK_DATA, is_deleted: true }));

    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-deleted-chip')).toBeTruthy();
  });

  it('does not show deleted chip for active chat', () => {
    renderDetail();

    expect(screen.queryByTestId('analytics-chat-detail-deleted-chip')).toBeNull();
  });

  it('renders export button', () => {
    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-export-button')).toBeTruthy();
  });
});

describe('AnalyticsChatDetailed — KPI cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatDetailQuery.mockReturnValue(detailQuery(MOCK_DATA));
  });

  afterEach(() => cleanup());

  it('renders the main KPI cards', () => {
    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-kpi-responses')).toBeTruthy();
    expect(screen.getByTestId('analytics-chat-detail-kpi-total-cost')).toBeTruthy();
    expect(screen.getByTestId('analytics-chat-detail-kpi-total-tokens')).toBeTruthy();
  });

  it('renders cost KPIs with estimated subtitle', () => {
    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-kpi-total-cost-subtitle').textContent).toBe('estimated');
    expect(screen.getByTestId('analytics-chat-detail-kpi-input-cost-subtitle').textContent).toBe('estimated');
    expect(screen.getByTestId('analytics-chat-detail-kpi-output-cost-subtitle').textContent).toBe(
      'estimated',
    );
    expect(screen.getByTestId('analytics-chat-detail-kpi-cache-read-cost-subtitle').textContent).toBe(
      'estimated',
    );
    expect(screen.getByTestId('analytics-chat-detail-kpi-cache-write-cost-subtitle').textContent).toBe(
      'estimated',
    );
  });

  it('renders first and last activity when present', () => {
    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-kpi-first-activity')).toBeTruthy();
    expect(screen.getByTestId('analytics-chat-detail-kpi-last-activity')).toBeTruthy();
  });

  it('hides first/last activity when not in data', () => {
    const dataWithoutActivity = {
      ...MOCK_DATA,
      kpis: { ...MOCK_DATA.kpis, first_activity: null, last_activity: null },
    };
    useAnalyticsChatDetailQuery.mockReturnValue(detailQuery(dataWithoutActivity));

    renderDetail();

    expect(screen.queryByTestId('analytics-chat-detail-kpi-first-activity')).toBeNull();
    expect(screen.queryByTestId('analytics-chat-detail-kpi-last-activity')).toBeNull();
  });

  it('shows unique users KPI for team projects', () => {
    renderDetail({ isPersonalProject: false });

    expect(screen.getByTestId('analytics-chat-detail-kpi-users')).toBeTruthy();
  });

  it('hides unique users KPI for personal projects', () => {
    renderDetail({ isPersonalProject: true });

    expect(screen.queryByTestId('analytics-chat-detail-kpi-users')).toBeNull();
  });
});

describe('AnalyticsChatDetailed — participants table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatDetailQuery.mockReturnValue(detailQuery(MOCK_DATA));
  });

  afterEach(() => cleanup());

  it('renders the participants breakdown table', () => {
    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-participants')).toBeTruthy();
  });

  it('shows agent label for agent participant type', () => {
    renderDetail();

    const table = screen.getByTestId('analytics-chat-detail-participants');
    expect(within(table).getByText(/Agent/i)).toBeTruthy();
  });

  it('shows model label for model participant type', () => {
    renderDetail();

    const table = screen.getByTestId('analytics-chat-detail-participants');
    expect(within(table).getByText(/Model/i)).toBeTruthy();
  });
});

describe('AnalyticsChatDetailed — models table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatDetailQuery.mockReturnValue(detailQuery(MOCK_DATA));
  });

  afterEach(() => cleanup());

  it('renders the models breakdown table', () => {
    renderDetail();

    expect(screen.getByTestId('analytics-chat-detail-models')).toBeTruthy();
  });

  it('shows display name for models', () => {
    renderDetail();

    const table = screen.getByTestId('analytics-chat-detail-models');
    expect(within(table).getByText('GPT-4 Turbo')).toBeTruthy();
  });
});

describe('AnalyticsChatDetailed — export', () => {
  let AnalyticsExportHelpers;

  beforeEach(async () => {
    vi.clearAllMocks();
    useAnalyticsChatDetailQuery.mockReturnValue(detailQuery(MOCK_DATA));
    const helpers = await import('@/[fsd]/features/settings/lib/helpers');
    AnalyticsExportHelpers = vi.mocked(helpers).AnalyticsExportHelpers;
  });

  afterEach(() => cleanup());

  it('delegates the export to exportChatDetail with the current chat data', async () => {
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-chat-detail-export-button'));

    await waitFor(() => {
      expect(AnalyticsExportHelpers.exportChatDetail).toHaveBeenCalledWith(
        expect.any(Function),
        analyticsApi.endpoints,
        expect.objectContaining({
          projectId: 1,
          conversationUuid: '00000000-0000-0000-0000-000000000001',
          dateFrom: '2026-10-01',
          dateTo: '2026-10-08',
          chatData: MOCK_DATA,
          projectName: 'Test project',
        }),
      );
    });
  });

  it('shows an error message when the export fails', async () => {
    AnalyticsExportHelpers.exportChatDetail.mockRejectedValueOnce(new Error('boom'));
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-chat-detail-export-button'));

    expect(await screen.findByText('Export failed. Please try again.')).toBeTruthy();
  });
});
