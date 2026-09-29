// @vitest-environment jsdom
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunAnalyticsContainer from '../RunAnalyticsContainer';
import { AnalyticsTestWrapper, installGlobalStubs } from './_testHelpers';

installGlobalStubs();

const { useGetRunHistoryDetailsQuery, useApplicationDetailsQuery, viewProps } = vi.hoisted(() => ({
  useGetRunHistoryDetailsQuery: vi.fn(),
  useApplicationDetailsQuery: vi.fn(),
  viewProps: { current: null },
}));

vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: { useGetRunHistoryDetailsQuery },
}));

vi.mock('@/api/applications', async importOriginal => ({
  ...(await importOriginal()),
  useApplicationDetailsQuery,
}));

vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => <nav data-testid="breadcrumbs" /> }));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 1 }));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  RunAnalyticsView: props => {
    viewProps.current = props;
    return <div data-testid="run-analytics-view">{props.infoLines.join(' | ')}</div>;
  },
}));

const renderAt = url =>
  render(
    <AnalyticsTestWrapper>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route
            path="/agents/:tab/:agentId/history/analytics"
            element={<RunAnalyticsContainer source="agent" />}
          />
        </Routes>
      </MemoryRouter>
    </AnalyticsTestWrapper>,
  );

describe('RunAnalyticsContainer', () => {
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
});
