// @vitest-environment jsdom
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunAnalyticsContainer from '../RunAnalyticsContainer';
import { AnalyticsTestWrapper, installGlobalStubs } from './_testHelpers';

installGlobalStubs();

const {
  useGetRunHistoryDetailsQuery,
  useApplicationDetailsQuery,
  useAnalyticsRunDetailQuery,
  useAnalyticsCostsQuery,
  viewProps,
} = vi.hoisted(() => ({
  useGetRunHistoryDetailsQuery: vi.fn(),
  useApplicationDetailsQuery: vi.fn(),
  useAnalyticsRunDetailQuery: vi.fn(),
  useAnalyticsCostsQuery: vi.fn(),
  viewProps: { current: null },
}));

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  useAnalyticsRunDetailQuery,
  useAnalyticsCostsQuery,
}));

vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: { useGetRunHistoryDetailsQuery },
}));

vi.mock('@/api/applications', async importOriginal => ({
  ...(await importOriginal()),
  useApplicationDetailsQuery,
}));

vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => <nav data-testid="breadcrumbs" /> }));

vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 1 }));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  RunAnalyticsView: props => {
    viewProps.current = props;
    return <div data-testid="run-analytics-view">{props.infoLines.join(' | ')}</div>;
  },
}));

const renderAt = (url, element = <RunAnalyticsContainer source="agent" />) =>
  render(
    <AnalyticsTestWrapper>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route
            path="/agents/:tab/:agentId/history/analytics"
            element={element}
          />
        </Routes>
      </MemoryRouter>
    </AnalyticsTestWrapper>,
  );

const SKILL_ROOT = { rootEntityType: 'skill', rootEntityId: 174, rootEntityProjectId: 2 };

const SKILL_DETAILS = {
  name: 'Summarizer',
  versions: [
    { id: 251, name: 'base' },
    { id: 252, name: 'v2' },
  ],
};

const RUN_DETAIL = {
  root_entity_version_ids: [252],
  kpis: { llm_calls: 2, tool_calls: 0, errors: 1 },
  llm_calls: [
    { model_name: 'eu.anthropic.claude-sonnet-4-6', ts: '2026-10-09T10:00:00+00:00', is_error: false },
    {
      model_name: 'eu.anthropic.claude-sonnet-4-6',
      ts: '2026-10-09T10:01:00+00:00',
      duration_ms: 900,
      is_error: true,
    },
  ],
  tool_calls: [],
};

const RUN_COSTS = {
  by_model: [{ model_name: 'eu.anthropic.claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6' }],
};

const renderSkillRun = (props = {}) =>
  renderAt(
    '/agents/all/174/history/analytics?history_run_id=555',
    <RunAnalyticsContainer
      source="skill"
      entityDetails={SKILL_DETAILS}
      entityLabel="Skill"
      rootEntity={SKILL_ROOT}
      {...props}
    />,
  );

describe('RunAnalyticsContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewProps.current = null;
    useAnalyticsRunDetailQuery.mockReturnValue({ data: undefined, isFetching: false });
    useAnalyticsCostsQuery.mockReturnValue({ data: undefined, isFetching: false });
    useGetRunHistoryDetailsQuery.mockReturnValue({
      data: {
        uuid: '0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e',
        created_at: new Date(2026, 8, 2, 12, 23).getTime() / 1000,
        meta: { single_participant: { entity_settings: { version_id: 11 } } },
      },
    });
    useApplicationDetailsQuery.mockReturnValue({
      data: {
        name: 'Reviewer',
        versions: [
          { id: 10, name: 'latest' },
          { id: 11, name: 'base' },
        ],
      },
    });
  });

  afterEach(() => cleanup());

  it('loads the run in history_run_id and scopes analytics by its UUID', () => {
    renderAt('/agents/all/5/history/analytics?history_run_id=555');

    expect(useGetRunHistoryDetailsQuery).toHaveBeenCalledWith(
      { projectId: 1, conversationId: '555' },
      { skip: false },
    );
    expect(viewProps.current.runScope.queryArgs).toEqual({ runId: '0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e' });
    expect(viewProps.current.runScope.scopeLabel).toBe('this run');
  });

  it('describes the run with its date and executed version', () => {
    renderAt('/agents/all/5/history/analytics?history_run_id=555');

    expect(screen.getByTestId('run-analytics-view')).toHaveTextContent(
      'Run: 02 Sep 2026, 12:23 PM · Version: base',
    );
    expect(Object.fromEntries(viewProps.current.exportMeta.scopeRows)).toMatchObject({
      Agent: 'Reviewer',
      'Run ID': '555',
      Version: 'base',
    });
    expect(viewProps.current.exportMeta.fileSuffix).toBe('run-555');
  });

  it('passes no scope until the run details arrive', () => {
    useGetRunHistoryDetailsQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderAt('/agents/all/5/history/analytics?history_run_id=555');

    expect(viewProps.current.runScope).toBeNull();
    expect(viewProps.current.isRunLoading).toBe(true);
  });

  it('passes no scope when the URL names no run', () => {
    useGetRunHistoryDetailsQuery.mockReturnValue({ data: undefined, isLoading: false });
    renderAt('/agents/all/5/history/analytics');

    expect(viewProps.current.runScope).toBeNull();
    expect(viewProps.current.missingRunMessage).toBe('No analytics data is available for this run.');
  });

  it('keeps agent runs on the run scope alone, without reading the usage trace', () => {
    renderAt('/agents/all/5/history/analytics?history_run_id=555');

    expect(useAnalyticsRunDetailQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
    expect(useAnalyticsCostsQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
    expect(viewProps.current.showToolsTab).toBe(true);
    expect(viewProps.current.failedCalls).toBeUndefined();
  });
});

describe('RunAnalyticsContainer for a root entity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewProps.current = null;
    useGetRunHistoryDetailsQuery.mockReturnValue({
      data: {
        uuid: '0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e',
        created_at: new Date(2026, 9, 9, 10, 0).getTime() / 1000,
        meta: { single_participant: { entity_settings: { version_id: 251 } } },
      },
    });
    useApplicationDetailsQuery.mockReturnValue({ data: undefined });
    useAnalyticsRunDetailQuery.mockReturnValue({ data: RUN_DETAIL, isFetching: false });
    useAnalyticsCostsQuery.mockReturnValue({ data: RUN_COSTS, isFetching: false, isError: false });
  });

  afterEach(() => cleanup());

  it('narrows every tab and the run trace to the root entity of the conversation', () => {
    renderSkillRun();

    const scopedArgs = { runId: '0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e', ...SKILL_ROOT };
    expect(viewProps.current.runScope.queryArgs).toEqual(scopedArgs);
    expect(useAnalyticsRunDetailQuery).toHaveBeenCalledWith(
      { projectId: 1, ...scopedArgs },
      expect.objectContaining({ skip: false }),
    );
  });

  it('reads the model from the same costs request the Costs tab makes', () => {
    renderSkillRun();

    expect(useAnalyticsCostsQuery).toHaveBeenCalledWith(
      { projectId: 1, ...viewProps.current.runScope.queryArgs },
      expect.objectContaining({ skip: false }),
    );
  });

  it('names the version and model the run used, not the participant settings', () => {
    renderSkillRun();

    expect(viewProps.current.infoLines).toEqual([
      'Run: 09 Oct 2026, 10:00 AM · Version: v2 · Model: Claude Sonnet 4.6',
    ]);
    expect(Object.fromEntries(viewProps.current.exportMeta.scopeRows)).toMatchObject({
      Skill: 'Summarizer',
      Version: 'v2',
      Model: 'Claude Sonnet 4.6',
    });
  });

  it('shows placeholders, not the participant version, while the usage data loads', () => {
    useAnalyticsRunDetailQuery.mockReturnValue({ data: undefined, isFetching: true, isError: false });
    renderSkillRun();

    expect(viewProps.current.infoLines[0]).toContain('Version: … · Model: …');
    expect(Object.fromEntries(viewProps.current.exportMeta.scopeRows)).toMatchObject({ Version: '…' });
  });

  it('says unavailable instead of an empty run when a usage request fails', () => {
    useAnalyticsRunDetailQuery.mockReturnValue({
      data: undefined,
      isFetching: false,
      error: { status: 500 },
    });
    useAnalyticsCostsQuery.mockReturnValue({ data: undefined, isFetching: false, isError: true });
    renderSkillRun();

    expect(viewProps.current.infoLines[0]).toContain('Version: unavailable · Model: unavailable');
  });

  it('falls back to the participant version when the run has no usage rows', () => {
    useAnalyticsRunDetailQuery.mockReturnValue({
      data: undefined,
      isFetching: false,
      error: { status: 404 },
    });
    useAnalyticsCostsQuery.mockReturnValue({ data: { by_model: [] }, isFetching: false, isError: false });
    renderSkillRun();

    expect(viewProps.current.infoLines[0]).toContain('Version: base · Model: —');
  });

  it('hides the Tools tab unless the run made a tool call', () => {
    renderSkillRun();
    expect(viewProps.current.showToolsTab).toBe(false);

    cleanup();
    useAnalyticsRunDetailQuery.mockReturnValue({
      data: { ...RUN_DETAIL, kpis: { ...RUN_DETAIL.kpis, tool_calls: 1 } },
      isFetching: false,
      isError: false,
    });
    renderSkillRun();
    expect(viewProps.current.showToolsTab).toBe(true);
  });

  it('hands the failing calls to the view, named by the costs display name', () => {
    renderSkillRun();

    expect(viewProps.current.failedCalls).toEqual([
      {
        key: 'llm-1',
        ts: '2026-10-09T10:01:00+00:00',
        eventType: 'llm',
        name: 'Claude Sonnet 4.6',
        durationMs: 900,
        isError: true,
      },
    ]);
  });
});

const USAGE_RUN_ID = '7d1e2f3a-4b5c-4d6e-8f90-a1b2c3d4e5f6';

describe('RunAnalyticsContainer opened from Analytics Recent Runs (#7033)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewProps.current = null;
    useGetRunHistoryDetailsQuery.mockReturnValue({
      data: {
        uuid: '0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e',
        created_at: new Date(2026, 8, 2, 12, 23).getTime() / 1000,
        meta: { single_participant: { entity_settings: { version_id: 11 } } },
      },
    });
    useApplicationDetailsQuery.mockReturnValue({
      data: {
        name: 'Reviewer',
        versions: [
          { id: 10, name: 'latest' },
          { id: 11, name: 'base' },
        ],
      },
    });
    useAnalyticsRunDetailQuery.mockReturnValue({
      data: {
        ...RUN_DETAIL,
        started_at: new Date(2026, 9, 9, 10, 0).toISOString(),
        root_entity_version_ids: [10],
      },
      isFetching: false,
    });
    useAnalyticsCostsQuery.mockReturnValue({ data: RUN_COSTS, isFetching: false, isError: false });
  });

  afterEach(() => cleanup());

  it('scopes every tab to the usage run, not to its whole conversation', () => {
    renderAt(`/agents/all/5/history/analytics?usage_run_id=${USAGE_RUN_ID}&history_run_id=555`);

    expect(viewProps.current.runScope.queryArgs).toEqual({ runId: USAGE_RUN_ID });
    expect(useAnalyticsRunDetailQuery).toHaveBeenCalledWith(
      { projectId: 1, runId: USAGE_RUN_ID },
      expect.objectContaining({ skip: false }),
    );
  });

  it('opens a run that has no conversation', () => {
    useGetRunHistoryDetailsQuery.mockReturnValue({ data: undefined, isLoading: false });
    renderAt(`/agents/all/5/history/analytics?usage_run_id=${USAGE_RUN_ID}`);

    expect(useGetRunHistoryDetailsQuery).toHaveBeenCalledWith(
      { projectId: 1, conversationId: null },
      { skip: true },
    );
    expect(viewProps.current.runScope.queryArgs).toEqual({ runId: USAGE_RUN_ID });
  });

  it('dates and versions the header from the usage run, not the conversation', () => {
    renderAt(`/agents/all/5/history/analytics?usage_run_id=${USAGE_RUN_ID}&history_run_id=555`);

    expect(viewProps.current.infoLines).toEqual([
      'Run: 09 Oct 2026, 10:00 AM · Version: latest · Model: Claude Sonnet 4.6',
    ]);
    expect(Object.fromEntries(viewProps.current.exportMeta.scopeRows)).toMatchObject({
      'Run ID': USAGE_RUN_ID,
      Version: 'latest',
    });
    expect(viewProps.current.exportMeta.fileSuffix).toBe(`run-${USAGE_RUN_ID}`);
  });
});

describe('RunAnalyticsContainer version names from the usage run (#7033)', () => {
  const runDetailWith = versionIds => ({
    ...RUN_DETAIL,
    started_at: new Date(2026, 9, 9, 10, 0).toISOString(),
    root_entity_version_ids: versionIds,
    root_entity_versions: [
      { id: 10, name: 'latest (run-time)' },
      { id: 242, name: 'v3' },
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    viewProps.current = null;
    useGetRunHistoryDetailsQuery.mockReturnValue({
      data: {
        uuid: '0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e',
        created_at: new Date(2026, 8, 2, 12, 23).getTime() / 1000,
        meta: { single_participant: { entity_settings: { version_id: 11 } } },
      },
    });
    useApplicationDetailsQuery.mockReturnValue({
      data: {
        name: 'Reviewer',
        versions: [
          { id: 10, name: 'latest' },
          { id: 11, name: 'base' },
        ],
      },
    });
    useAnalyticsCostsQuery.mockReturnValue({ data: RUN_COSTS, isFetching: false, isError: false });
  });

  afterEach(() => cleanup());

  it('names a deleted version with the usage run name instead of a dash', () => {
    useAnalyticsRunDetailQuery.mockReturnValue({ data: runDetailWith([242]), isFetching: false });
    renderAt(`/agents/all/130/history/analytics?usage_run_id=${USAGE_RUN_ID}`);

    expect(viewProps.current.infoLines[0]).toContain('Version: v3 ·');
    expect(Object.fromEntries(viewProps.current.exportMeta.scopeRows)).toMatchObject({ Version: 'v3' });
  });

  it('keeps the current name of a version that still exists', () => {
    useAnalyticsRunDetailQuery.mockReturnValue({ data: runDetailWith([10]), isFetching: false });
    renderAt(`/agents/all/130/history/analytics?usage_run_id=${USAGE_RUN_ID}`);

    expect(viewProps.current.infoLines[0]).toContain('Version: latest ·');
  });

  it('leaves a Run History link on the participant version', () => {
    useAnalyticsRunDetailQuery.mockReturnValue({ data: runDetailWith([242]), isFetching: false });
    renderAt('/agents/all/130/history/analytics?history_run_id=555');

    expect(viewProps.current.infoLines).toEqual(['Run: 02 Sep 2026, 12:23 PM · Version: base']);
  });
});
