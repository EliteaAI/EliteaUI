// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsChatsQuery } from '@/api';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ChatTopChart from '../components/ChatTopChart';
import { AnalyticsRouterTestWrapper as Wrapper } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/api', () => ({
  useAnalyticsChatsQuery: vi.fn(),
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: { barChartCursor: () => ({}) },
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  ChartTooltip: () => null,
}));

vi.mock('@/[fsd]/shared/ui/tab-group-button/TabGroupButton', () => ({
  default: ({ arrayBtn = [], onChange }) => (
    <div>
      {arrayBtn.map(({ label, value }) => (
        <button
          key={value}
          onClick={event => onChange?.(event, value)}
        >
          {label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: ({ dataKey, name }) => (
    <div
      data-testid="bar"
      data-key={dataKey}
      data-name={name}
    />
  ),
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

const ROWS = [
  { conversation_uuid: 'uuid-a', chat_name: 'Alpha', llm_cost: 1, total_tokens: 20, responses: 3 },
];

const lastQueryArgs = () => useAnalyticsChatsQuery.mock.calls.at(-1)[0];

const renderChart = () =>
  render(
    <ChatTopChart
      projectId={1}
      dateFrom="2026-10-01"
      dateTo="2026-10-08"
      onBarClick={vi.fn()}
    />,
    { wrapper: Wrapper },
  );

describe('ChatTopChart — metric selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsChatsQuery.mockReturnValue({ data: { rows: ROWS } });
  });

  afterEach(() => cleanup());

  it('offers Cost, Tokens and Responses', () => {
    renderChart();

    ['Cost', 'Tokens', 'Responses'].forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
  });

  it('starts on cost: sorts by llm_cost and plots llm_cost', () => {
    renderChart();

    expect(lastQueryArgs()).toEqual(expect.objectContaining({ sortBy: 'llm_cost', sortOrder: 'desc' }));
    expect(screen.getByTestId('bar')).toHaveAttribute('data-key', 'llm_cost');
    expect(screen.getByTestId('bar')).toHaveAttribute('data-name', 'Cost');
  });

  it.each([
    ['Tokens', 'total_tokens'],
    ['Responses', 'responses'],
    ['Cost', 'llm_cost'],
  ])('%s sorts the query and the bars by %s', (label, field) => {
    renderChart();
    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(lastQueryArgs()).toEqual(expect.objectContaining({ sortBy: field }));
    expect(screen.getByTestId('bar')).toHaveAttribute('data-key', field);
    expect(screen.getByTestId('bar')).toHaveAttribute('data-name', label);
  });

  it('asks for the top ten chats of the selected metric', () => {
    renderChart();

    expect(lastQueryArgs()).toEqual(expect.objectContaining({ limit: 10, offset: 0 }));
  });

  it('skips the query without a project', () => {
    render(
      <ChatTopChart
        dateFrom="2026-10-01"
        dateTo="2026-10-08"
      />,
      { wrapper: Wrapper },
    );

    expect(useAnalyticsChatsQuery.mock.calls.at(-1)[1]).toEqual({ skip: true });
  });
});
