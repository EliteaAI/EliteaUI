// @vitest-environment jsdom
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import EvaluationRunAnalytics from '../EvaluationRunAnalytics';

const { useEvalRunQuery, useEvalSuitesQuery, useApplicationDetailsQuery, viewProps } = vi.hoisted(() => ({
  useEvalRunQuery: vi.fn(),
  useEvalSuitesQuery: vi.fn(),
  useApplicationDetailsQuery: vi.fn(),
  viewProps: { current: null },
}));

vi.mock('../../../api', () => ({ useEvalRunQuery, useEvalSuitesQuery }));

vi.mock('@/api/applications', async importOriginal => ({
  ...(await importOriginal()),
  useApplicationDetailsQuery,
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 1 }));

vi.mock('../../common', () => ({
  EvaluationBreadcrumbs: props => <nav data-testid="evaluation-breadcrumbs">{props.title}</nav>,
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  RunAnalyticsView: props => {
    viewProps.current = props;
    return (
      <div data-testid="run-analytics-view">
        {props.breadcrumbs}
        {props.infoLines.map(line => (
          <p key={line}>{line}</p>
        ))}
      </div>
    );
  },
}));

const renderAt = url =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/agents/:tab/:agentId/evaluate/history/analytics"
          element={<EvaluationRunAnalytics />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('EvaluationRunAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewProps.current = null;
    useEvalRunQuery.mockReturnValue({
      data: {
        id: 9,
        uuid: '7e1d2c3b-4a5f-4e6d-8c7b-9a0b1c2d3e4f',
        suite_id: 3,
        application_version_id: 21,
        started_at: new Date(2026, 8, 27, 12, 57).getTime() / 1000,
      },
    });
    useEvalSuitesQuery.mockReturnValue({ data: [{ id: 3, name: 'Tester' }] });
    useApplicationDetailsQuery.mockReturnValue({
      data: {
        name: 'Reviewer',
        versions: [
          { id: 20, name: 'latest' },
          { id: 21, name: 'base' },
        ],
      },
    });
  });

  afterEach(() => cleanup());

  it('loads the evaluation run in ?run and scopes analytics by its UUID', () => {
    renderAt('/agents/all/7/evaluate/history/analytics?run=9');

    expect(useEvalRunQuery).toHaveBeenCalledWith({ projectId: 1, runId: 9 }, { skip: false });
    expect(viewProps.current.runScope.queryArgs).toEqual({
      evalRunId: '7e1d2c3b-4a5f-4e6d-8c7b-9a0b1c2d3e4f',
    });
    expect(viewProps.current.runScope.scopeLabel).toBe('this evaluation run');
  });

  it('shows the evaluation metadata with the evaluated version, not the editor one', () => {
    renderAt('/agents/all/7/evaluate/history/analytics?run=9');

    expect(screen.getByText('Evaluation Run #9 · Suite: Tester')).toBeInTheDocument();
    expect(screen.getByText('Run: 27 Sep 2026, 12:57 PM · Agent version: base')).toBeInTheDocument();
    expect(screen.getByTestId('evaluation-breadcrumbs')).toHaveTextContent('Analytics');
  });

  it('writes the evaluation identity into the export', () => {
    renderAt('/agents/all/7/evaluate/history/analytics?run=9');

    expect(Object.fromEntries(viewProps.current.exportMeta.scopeRows)).toMatchObject({
      Agent: 'Reviewer',
      'Evaluated Version': 'base',
      Suite: 'Tester',
      'Evaluation Run ID': 9,
    });
    expect(viewProps.current.exportMeta.fileSuffix).toBe('eval-run-9');
  });

  it('passes no scope and the tracking-data message when the URL names no run', () => {
    useEvalRunQuery.mockReturnValue({ data: undefined, isLoading: false });
    renderAt('/agents/all/7/evaluate/history/analytics');

    expect(viewProps.current.runScope).toBeNull();
    expect(viewProps.current.missingRunMessage).toBe(
      'Analytics is unavailable for this evaluation run because tracking data is missing.',
    );
  });
});
