// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsSkillsQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import AnalyticsSkills from '../AnalyticsSkills';
import { AnalyticsTestWrapper as Wrapper } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({ useAnalyticsSkillsQuery: vi.fn() }));

vi.mock('@/[fsd]/features/settings/ui/analytics/AnalyticsSkillDetailed', () => ({
  default: props => (
    <div data-testid="skill-detail">
      {props.skillProjectId}:{props.skillId}
    </div>
  ),
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

vi.mock('@/[fsd]/shared/config/store', () => ({
  default: { getState: () => ({}), dispatch: vi.fn(), subscribe: vi.fn() },
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 1 }));

const ROWS = [
  {
    skill_id: 174,
    skill_project_id: 2,
    skill_name: 'summarizer',
    deleted: false,
    runs: 52,
    in_agent_uses: 3,
    users: 2,
    agents_using: 1,
    avg_duration_ms: 1500,
    errors: 1,
    total_tokens: 4700,
    cost: 0.2111,
    last_used: '2026-10-09T19:38:54+00:00',
  },
  {
    skill_id: 180,
    skill_project_id: 2,
    skill_name: 'pirate',
    deleted: true,
    runs: 0,
    in_agent_uses: 7,
    users: 1,
    agents_using: 2,
    avg_duration_ms: 0,
    errors: 0,
    total_tokens: 0,
    cost: 0,
    last_used: '2026-10-08T10:00:00+00:00',
  },
];

const PAYLOAD = {
  total: 2,
  summary: { skills_used: 2, runs: 52, in_agent_uses: 10, total_tokens: 4700, cost: 0.2111 },
  rows: ROWS,
};

const renderSkills = () =>
  render(
    <AnalyticsSkills
      projectId={2}
      dateFrom="2026-10-01T00:00:00Z"
      dateTo="2026-10-10T00:00:00Z"
    />,
    { wrapper: Wrapper },
  );

const lastArgs = () => useAnalyticsSkillsQuery.mock.calls.at(-1)[0];

describe('AnalyticsSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsSkillsQuery.mockReturnValue({ data: PAYLOAD, isFetching: false, isError: false });
  });

  afterEach(() => cleanup());

  it('shows the summary cards', () => {
    renderSkills();

    expect(screen.getByTestId('analytics-skills-kpi-runs-value')).toHaveTextContent('52');
    expect(screen.getByTestId('analytics-skills-kpi-skills-used-value')).toHaveTextContent('2');
    expect(screen.getByTestId('analytics-skills-kpi-in-agent-uses-value')).toHaveTextContent('10');
    expect(screen.getByTestId('analytics-skills-kpi-cost-value')).toHaveTextContent('$0.2111');
  });

  it('lists every column per skill, runs and in-agent uses apart', () => {
    renderSkills();

    const header = screen.getByTestId('analytics-skills-table-header');
    [
      'Skill',
      'Runs',
      'In-Agent Uses',
      'Users',
      'Agents Using',
      'Avg Latency',
      'Errors',
      'Tokens',
      'Cost',
      'Last Used',
    ].forEach(label => expect(within(header).getByText(label)).toBeInTheDocument());
    const [first, second] = screen.getAllByTestId('analytics-skills-row');
    expect(within(first).getByTestId('analytics-skills-row-runs')).toHaveTextContent('52');
    expect(within(first).getByTestId('analytics-skills-row-in_agent_uses')).toHaveTextContent('3');
    expect(within(second).getByTestId('analytics-skills-row-in_agent_uses')).toHaveTextContent('7');
    expect(within(second).getByTestId('analytics-skills-row-total_tokens')).toHaveTextContent('0');
  });

  it('marks a deleted skill with its last known name', () => {
    renderSkills();

    const [first, second] = screen.getAllByTestId('analytics-skills-row');
    expect(within(second).getByText('pirate')).toBeInTheDocument();
    expect(within(second).getByTestId('analytics-skills-row-deleted')).toHaveTextContent('Deleted');
    expect(within(first).queryByTestId('analytics-skills-row-deleted')).not.toBeInTheDocument();
  });

  it('sorts server side, toggling the direction on a second click', () => {
    renderSkills();

    fireEvent.click(screen.getByTestId('analytics-skills-sort-cost'));
    expect(lastArgs()).toMatchObject({ sortBy: 'cost', sortOrder: 'desc', offset: 0 });

    fireEvent.click(screen.getByTestId('analytics-skills-sort-cost'));
    expect(lastArgs()).toMatchObject({ sortBy: 'cost', sortOrder: 'asc' });
  });

  it('searches server side from the first page', () => {
    renderSkills();

    fireEvent.change(screen.getByTestId('analytics-skills-search-input'), { target: { value: 'pir' } });

    expect(lastArgs()).toMatchObject({ search: 'pir', offset: 0 });
  });

  it('pages server side', () => {
    useAnalyticsSkillsQuery.mockReturnValue({
      data: { ...PAYLOAD, total: 45 },
      isFetching: false,
      isError: false,
    });
    renderSkills();

    fireEvent.click(screen.getByTestId('analytics-skills-pagination-next'));

    expect(lastArgs()).toMatchObject({ limit: 20, offset: 20 });
  });

  it('opens the detail of the clicked skill in its own project', () => {
    renderSkills();

    fireEvent.click(screen.getAllByTestId('analytics-skills-row')[1]);

    expect(screen.getByTestId('skill-detail')).toHaveTextContent('2:180');
  });

  it('explains how to start when no skill was used', () => {
    useAnalyticsSkillsQuery.mockReturnValue({
      data: { total: 0, rows: [], summary: { skills_used: 0, runs: 0, in_agent_uses: 0, cost: 0 } },
      isFetching: false,
      isError: false,
    });
    renderSkills();

    expect(screen.getByTestId('analytics-skills-empty-state')).toHaveTextContent('Run a skill');
    expect(screen.queryByTestId('analytics-skills-table-header')).not.toBeInTheDocument();
  });

  it('keeps the search when a search fails, showing the error in the table', () => {
    renderSkills();
    fireEvent.change(screen.getByTestId('analytics-skills-search-input'), { target: { value: 'pir' } });
    useAnalyticsSkillsQuery.mockReturnValue({ data: PAYLOAD, isFetching: false, isError: true });
    fireEvent.change(screen.getByTestId('analytics-skills-search-input'), { target: { value: 'pira' } });

    expect(screen.getByTestId('analytics-skills-search-input')).toHaveValue('pira');
    expect(screen.getByTestId('analytics-skills-error')).toHaveTextContent('Failed to load skill analytics.');
    expect(screen.queryAllByTestId('analytics-skills-row')).toHaveLength(0);
  });

  it('shows no KPI values from the previous period when a load fails', () => {
    useAnalyticsSkillsQuery.mockReturnValue({ data: PAYLOAD, isFetching: false, isError: true });
    renderSkills();

    expect(screen.queryByTestId('analytics-skills-kpi-runs-value')).not.toBeInTheDocument();
    expect(screen.queryByTestId('analytics-skills-kpi-cost-value')).not.toBeInTheDocument();
    expect(screen.getByTestId('analytics-skills-error')).toBeInTheDocument();
  });

  it('keeps the controls when the first load fails', () => {
    useAnalyticsSkillsQuery.mockReturnValue({ data: undefined, isFetching: false, isError: true });
    renderSkills();

    expect(screen.getByTestId('analytics-skills-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-skills-error')).toBeInTheDocument();
    expect(screen.queryByTestId('analytics-skills-empty-state')).not.toBeInTheDocument();
  });

  it('keeps the search input while a search is active even without usage', () => {
    renderSkills();
    useAnalyticsSkillsQuery.mockReturnValue({
      data: { total: 0, rows: [], summary: { skills_used: 0 } },
      isFetching: false,
      isError: false,
    });
    fireEvent.change(screen.getByTestId('analytics-skills-search-input'), { target: { value: 'zz' } });

    expect(screen.getByTestId('analytics-skills-search-input')).toHaveValue('zz');
    expect(screen.queryByTestId('analytics-skills-empty-state')).not.toBeInTheDocument();
  });

  it('keeps the table when only the search matches nothing', () => {
    useAnalyticsSkillsQuery.mockReturnValue({
      data: { ...PAYLOAD, total: 0, rows: [] },
      isFetching: false,
      isError: false,
    });
    renderSkills();

    expect(screen.getByTestId('analytics-skills-no-match')).toBeInTheDocument();
    expect(screen.queryByTestId('analytics-skills-empty-state')).not.toBeInTheDocument();
  });
});
