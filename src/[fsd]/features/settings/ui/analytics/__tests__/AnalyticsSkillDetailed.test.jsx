// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsSkillDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import AnalyticsSkillDetailed from '../AnalyticsSkillDetailed';
import { AnalyticsTestWrapper } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({ useAnalyticsSkillDetailQuery: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/utils', async importOriginal => ({
  ...(await importOriginal()),
  exportToExcel: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/[fsd]/shared/config/store', () => ({
  default: { getState: () => ({}), dispatch: vi.fn(), subscribe: vi.fn() },
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectName: () => 'Private' }));

const totals = (runs, uses) => ({ runs, in_agent_uses: uses, total_tokens: runs * 10, cost: runs / 100 });

const DETAIL = {
  skill_id: 174,
  skill_project_id: 2,
  skill_name: 'summarizer',
  deleted: false,
  is_public: false,
  kpis: { ...totals(2, 3), users: 2, agents_using: 2, errors: 1, avg_duration_ms: 1500 },
  daily: [{ date: '2026-10-08', ...totals(2, 3) }],
  by_version: [
    { version_id: 252, version_name: 'base', ...totals(1, 2) },
    { version_id: null, version_name: null, ...totals(0, 1) },
  ],
  by_model: [{ model_name: 'gpt-x', display_name: 'GPT X', runs: 1, calls: 2, total_tokens: 20, cost: 0.01 }],
  by_user: [{ user_id: 11, user_email: 'ann@example.com', ...totals(1, 2) }],
  by_trigger_source: [
    { trigger_source: 'manual', ...totals(1, 3) },
    { trigger_source: 'scheduled', ...totals(1, 0) },
  ],
  agents: [
    {
      entity_id: 111,
      entity_project_id: 2,
      entity_name: 'reviewer',
      kind: 'agent',
      deleted: false,
      uses: 2,
      runs: 2,
    },
    { entity_id: 112, entity_name: 'Agent #112', kind: null, deleted: true, uses: 1, runs: 1 },
  ],
  by_source: [
    { source: 'load_skill', uses: 2 },
    { source: 'mention', uses: 1 },
  ],
  recent_runs: [
    { run_id: 'run-2', conversation_id: null, started_at: '2026-10-08T12:01:00Z', is_error: true },
    {
      run_id: 'run-1',
      conversation_id: 1701,
      started_at: '2026-10-08T12:00:00Z',
      version_name: 'base',
      is_error: false,
    },
  ],
};

const renderDetail = (detail = DETAIL) => {
  useAnalyticsSkillDetailQuery.mockReturnValue({ data: detail, isFetching: false, isError: false });
  return render(
    <MemoryRouter>
      <AnalyticsTestWrapper>
        <AnalyticsSkillDetailed
          projectId={2}
          skillId={detail.skill_id}
          skillProjectId={detail.skill_project_id}
          dateFrom="2026-10-01T00:00:00Z"
          dateTo="2026-10-10T00:00:00Z"
          onBack={vi.fn()}
        />
      </AnalyticsTestWrapper>
    </MemoryRouter>,
  );
};

const rowsOf = testId => screen.getAllByTestId(`${testId}-row`).map(row => row.textContent);

describe('AnalyticsSkillDetailed', () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => cleanup());

  it('asks for the skill in its own project', () => {
    renderDetail();

    expect(useAnalyticsSkillDetailQuery.mock.calls[0][0]).toMatchObject({ skillId: 174, skillProjectId: 2 });
  });

  it('shows the KPIs and the trend', () => {
    renderDetail();

    expect(screen.getByTestId('analytics-skill-detail-kpi-runs-value')).toHaveTextContent('2');
    expect(screen.getByTestId('analytics-skill-detail-kpi-in-agent-uses-value')).toHaveTextContent('3');
    expect(screen.getByTestId('analytics-skill-detail-kpi-agents-value')).toHaveTextContent('2');
    expect(screen.getByTestId('analytics-skill-detail-trend')).toBeInTheDocument();
  });

  it('breaks down by version, model, user and trigger source', () => {
    renderDetail();

    expect(rowsOf('analytics-skill-detail-versions')).toEqual([
      expect.stringContaining('base'),
      expect.stringContaining('Version unknown'),
    ]);
    expect(rowsOf('analytics-skill-detail-models')[0]).toContain('GPT X');
    expect(rowsOf('analytics-skill-detail-users')[0]).toContain('ann@example.com');
    expect(rowsOf('analytics-skill-detail-triggers')).toEqual([
      expect.stringContaining('Manual'),
      expect.stringContaining('Scheduled Pipelines'),
    ]);
  });

  it('links live agents and shows the load vs mention split', () => {
    renderDetail();

    const links = screen.getAllByTestId('analytics-skill-detail-agent-link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/agents/all/111');
    expect(rowsOf('analytics-skill-detail-sources')).toEqual([
      expect.stringContaining('Loaded by the agent'),
      expect.stringContaining('Mentioned in a message'),
    ]);
  });

  it('links a recent run to its per-run analytics', () => {
    renderDetail();

    const links = screen.getAllByTestId('analytics-skill-detail-run-link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/skills/all/174/history/analytics?history_run_id=1701');
  });

  it('marks a deleted skill and stops linking its runs', () => {
    renderDetail({ ...DETAIL, deleted: true });

    expect(screen.getByTestId('analytics-skill-detail-deleted')).toHaveTextContent('Deleted');
    expect(screen.queryByTestId('analytics-skill-detail-run-link')).not.toBeInTheDocument();
  });

  it('exports the skill to Excel', async () => {
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-skill-detail-export-button'));

    await waitFor(() => expect(exportToExcel).toHaveBeenCalledTimes(1));
    const [fileName, sheets] = exportToExcel.mock.calls[0];
    expect(fileName).toMatch(/^Private_skill_summarizer_/);
    expect(sheets[0].sections.map(section => section.title)).toEqual([
      'KPIs',
      'Daily Trend',
      'By Version',
      'By Model',
      'By User',
      'By Trigger Source',
      'Used by Agents',
      'Load vs Mention',
      'Recent Runs',
    ]);
  });

  it('reports a failed export', async () => {
    exportToExcel.mockRejectedValueOnce(new Error('disk full'));
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-skill-detail-export-button'));

    expect(await screen.findByTestId('analytics-skill-detail-export-error')).toHaveTextContent(
      'Unable to export skill analytics',
    );
  });

  it('drops a failed export notice once the period changes', async () => {
    exportToExcel.mockRejectedValueOnce(new Error('disk full'));
    const { rerender } = renderDetail();
    fireEvent.click(screen.getByTestId('analytics-skill-detail-export-button'));
    await screen.findByTestId('analytics-skill-detail-export-error');

    rerender(
      <MemoryRouter>
        <AnalyticsTestWrapper>
          <AnalyticsSkillDetailed
            projectId={2}
            skillId={DETAIL.skill_id}
            skillProjectId={DETAIL.skill_project_id}
            dateFrom="2026-09-01T00:00:00Z"
            dateTo="2026-10-10T00:00:00Z"
            onBack={vi.fn()}
          />
        </AnalyticsTestWrapper>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.queryByTestId('analytics-skill-detail-export-error')).not.toBeInTheDocument(),
    );
  });

  it.each([
    [404, 'No usage of this skill in the selected period.'],
    [500, 'Failed to load skill analytics.'],
  ])('tells a %s apart from no usage', (status, message) => {
    useAnalyticsSkillDetailQuery.mockReturnValue({ data: undefined, isFetching: false, error: { status } });
    render(
      <MemoryRouter>
        <AnalyticsTestWrapper>
          <AnalyticsSkillDetailed
            projectId={2}
            skillId={1}
            onBack={vi.fn()}
          />
        </AnalyticsTestWrapper>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('analytics-skill-detail-empty')).toHaveTextContent(message);
    expect(within(document.body).getByTestId('analytics-skill-detail-back-button')).toBeInTheDocument();
  });
});
