// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsChatActivityQuery } from '@/api';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ChatActivityTable from '../components/ChatActivityTable';
import { AnalyticsRouterTestWrapper as Wrapper } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/api', () => ({
  useAnalyticsChatActivityQuery: vi.fn(),
  useAnalyticsChatsQuery: vi.fn(() => {
    throw new Error('Chat Activity table must not use the shared analytics_chats query');
  }),
}));

vi.mock('@/[fsd]/features/settings/lib/hooks', async () => ({
  useAnalyticsChatsTable: (
    await vi.importActual('@/[fsd]/features/settings/lib/hooks/useAnalyticsChatsTable.hooks.js')
  ).useAnalyticsChatsTable,
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  DeletedChip: () => null,
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', async () => ({
  AnalyticCommonHelpers: await vi.importActual(
    '@/[fsd]/features/settings/lib/helpers/analyticsCommon.helpers.js',
  ),
}));

vi.mock('@/[fsd]/shared/ui/button', () => ({
  BUTTON_VARIANTS: { text: 'text' },
  BaseBtn: ({ children, onClick, ...rest }) => (
    <button
      onClick={onClick}
      data-testid={rest['data-testid']}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/[fsd]/shared/ui/tooltip', () => ({ InfoTooltip: () => null }));

vi.mock('@/[fsd]/shared/ui/label/EllipsisLabelWithTooltip', () => ({
  default: ({ label }) => <span>{label}</span>,
}));

vi.mock('@/components/SearchInput', () => ({
  default: ({ search, onChangeSearch, testId }) => (
    <input
      data-testid={testId}
      value={search}
      onChange={onChangeSearch}
    />
  ),
}));

vi.mock('../components/ChatParticipantChips', () => ({ default: () => null }));

const CHAT_A = {
  conversation_uuid: 'uuid-a',
  conversation_id: 1,
  chat_name: 'Alpha chat',
  can_open: true,
  responses: 3,
  users: 1,
  errors: 0,
  total_tokens: 1200,
  llm_cost: 0.0042,
  participants: [],
  models: [],
};

const CHAT_B = { ...CHAT_A, conversation_uuid: 'uuid-b', conversation_id: 2, chat_name: 'Beta chat' };

const queryResult = (overrides = {}) => ({
  data: { total: 2, rows: [CHAT_A, CHAT_B] },
  isFetching: false,
  ...overrides,
});

const renderTable = props =>
  render(
    <ChatActivityTable
      projectId={1}
      dateFrom="2026-10-01"
      dateTo="2026-10-08"
      isPersonalProject={false}
      onChatClick={vi.fn()}
      {...props}
    />,
    { wrapper: Wrapper },
  );

const lastQueryArgs = () => useAnalyticsChatActivityQuery.mock.calls.at(-1)[0];

describe('ChatActivityTable — data source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatActivityQuery.mockReturnValue(queryResult());
  });

  afterEach(() => cleanup());

  it('queries the dedicated chat activity endpoint with the default sort', () => {
    renderTable();

    expect(lastQueryArgs()).toEqual(
      expect.objectContaining({
        projectId: 1,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
        limit: 10,
        offset: 0,
        sortBy: 'llm_cost',
        sortOrder: 'desc',
      }),
    );
  });

  it('skips the query when there is no project', () => {
    renderTable({ projectId: undefined });

    expect(useAnalyticsChatActivityQuery.mock.calls.at(-1)[1]).toEqual({ skip: true });
  });

  it('renders one row per chat returned', () => {
    renderTable();

    expect(screen.getAllByTestId('analytics-chats-row')).toHaveLength(2);
    expect(screen.getByText('Alpha chat')).toBeInTheDocument();
    expect(screen.getByText('Beta chat')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-chats-count')).toHaveTextContent('2 chats');
  });
});

describe('ChatActivityTable — loading states', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the spinner and no rows on the first load', () => {
    useAnalyticsChatActivityQuery.mockReturnValue({ data: undefined, isFetching: true });
    renderTable();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryAllByTestId('analytics-chats-row')).toHaveLength(0);
    expect(screen.queryByText('No chat usage in this period')).not.toBeInTheDocument();
  });

  it('keeps the current rows visible and hides the spinner while refetching', () => {
    useAnalyticsChatActivityQuery.mockReturnValue(queryResult({ isFetching: true }));
    renderTable();

    expect(screen.getAllByTestId('analytics-chats-row')).toHaveLength(2);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('dims the rows while refetching and restores them afterwards', () => {
    useAnalyticsChatActivityQuery.mockReturnValue(queryResult({ isFetching: true }));
    const { rerender } = renderTable();

    const rowsWrapper = () => screen.getAllByTestId('analytics-chats-row')[0].parentElement;
    expect(getComputedStyle(rowsWrapper()).opacity).toBe('0.5');
    expect(getComputedStyle(rowsWrapper()).pointerEvents).toBe('none');

    useAnalyticsChatActivityQuery.mockReturnValue(queryResult({ isFetching: false }));
    rerender(
      <ChatActivityTable
        projectId={1}
        dateFrom="2026-10-01"
        dateTo="2026-10-08"
        isPersonalProject={false}
        onChatClick={vi.fn()}
      />,
    );

    expect(getComputedStyle(rowsWrapper()).opacity).not.toBe('0.5');
  });

  it('says the search is unavailable instead of "no chat usage" when the backend could not search', () => {
    useAnalyticsChatActivityQuery.mockReturnValue({
      data: { total: 0, rows: [], search_unavailable: true },
      isFetching: false,
    });
    renderTable();

    expect(screen.getByTestId('analytics-chats-search-unavailable')).toBeInTheDocument();
    expect(screen.queryByText('No chat usage in this period')).not.toBeInTheDocument();
  });

  it('tells the user when a search matched more chats than were searched', () => {
    useAnalyticsChatActivityQuery.mockReturnValue(
      queryResult({ data: { total: 1, rows: [CHAT_A], search_truncated: true } }),
    );
    renderTable();

    expect(screen.getByTestId('analytics-chats-search-truncated')).toBeInTheDocument();
    expect(screen.getAllByTestId('analytics-chats-row')).toHaveLength(1);
  });

  it('shows no truncation notice for an ordinary result', () => {
    useAnalyticsChatActivityQuery.mockReturnValue(queryResult());
    renderTable();

    expect(screen.queryByTestId('analytics-chats-search-truncated')).not.toBeInTheDocument();
  });

  it('shows the empty message only when not fetching and there are no rows', () => {
    useAnalyticsChatActivityQuery.mockReturnValue({ data: { total: 0, rows: [] }, isFetching: false });
    renderTable();

    expect(screen.getByText('No chat usage in this period')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

describe('ChatActivityTable — sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatActivityQuery.mockReturnValue(queryResult());
  });

  afterEach(() => cleanup());

  it('flips the default Total Cost sort to ascending on the first click', () => {
    renderTable();

    fireEvent.click(screen.getByTestId('analytics-chats-sort-llm_cost'));

    expect(lastQueryArgs()).toEqual(expect.objectContaining({ sortBy: 'llm_cost', sortOrder: 'asc' }));
  });

  it('sorts a different column descending first', () => {
    renderTable();

    fireEvent.click(screen.getByTestId('analytics-chats-sort-total_tokens'));

    expect(lastQueryArgs()).toEqual(expect.objectContaining({ sortBy: 'total_tokens', sortOrder: 'desc' }));
  });

  it('keeps the existing rows on screen after the first sort click while the new sort loads', () => {
    const { rerender } = renderTable();

    fireEvent.click(screen.getByTestId('analytics-chats-sort-llm_cost'));
    useAnalyticsChatActivityQuery.mockReturnValue(queryResult({ isFetching: true }));
    rerender(
      <ChatActivityTable
        projectId={1}
        dateFrom="2026-10-01"
        dateTo="2026-10-08"
        isPersonalProject={false}
        onChatClick={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('analytics-chats-row')).toHaveLength(2);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('does not render a sort control for non-sortable columns', () => {
    renderTable();

    expect(screen.queryByTestId('analytics-chats-sort-chat_name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('analytics-chats-sort-participants')).not.toBeInTheDocument();
    expect(screen.queryByTestId('analytics-chats-sort-models')).not.toBeInTheDocument();
  });
});

describe('ChatActivityTable — row interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatActivityQuery.mockReturnValue(queryResult());
  });

  afterEach(() => cleanup());

  it('opens the chat detail with the conversation uuid when a row is clicked', () => {
    const onChatClick = vi.fn();
    renderTable({ onChatClick });

    fireEvent.click(screen.getAllByTestId('analytics-chats-row')[0]);

    expect(onChatClick).toHaveBeenCalledWith('uuid-a');
  });

  it('renders the open-chat arrow as a router link that opens in a new tab without selecting the row', () => {
    const onChatClick = vi.fn();
    renderTable({ onChatClick });

    const link = screen.getAllByRole('link', { name: 'Open chat' })[0];
    expect(link).toHaveAttribute('href', '/chat/1');
    expect(link).toHaveAttribute('target', '_blank');

    fireEvent.click(link);
    expect(onChatClick).not.toHaveBeenCalled();
  });
});

describe('ChatActivityTable — pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => cleanup());

  it('offers "Show all" when there are more chats than the top list', () => {
    useAnalyticsChatActivityQuery.mockReturnValue(queryResult({ data: { total: 25, rows: [CHAT_A] } }));
    renderTable();

    expect(screen.getByTestId('analytics-chats-show-all-btn')).toBeInTheDocument();
  });

  it('requests a paged list after "Show all" is clicked', () => {
    useAnalyticsChatActivityQuery.mockReturnValue(queryResult({ data: { total: 25, rows: [CHAT_A] } }));
    renderTable();

    fireEvent.click(screen.getByTestId('analytics-chats-show-all-btn'));

    expect(lastQueryArgs()).toEqual(expect.objectContaining({ limit: 20, offset: 0 }));
  });
});
