// @vitest-environment jsdom
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RouteDefinitions from '@/routes';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

import { useRestoreLastListRoute } from '../useRestoreLastListRoute.hooks';

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 1 }));

vi.mock('@/hooks/useIsFromSpecificPageHooks', () => ({
  useIsCreatingEntities: () => false,
  useIsFrom: () => false,
}));

let onMonitorProjectChange;

const Probe = () => {
  ({ onMonitorProjectChange } = useRestoreLastListRoute());
  const { pathname } = useLocation();

  return <div data-testid="pathname">{pathname}</div>;
};

const renderAt = (routePath, url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path={routePath}
          element={<Probe />}
        />
        <Route
          path="*"
          element={<Probe />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('useRestoreLastListRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onMonitorProjectChange = undefined;
  });

  afterEach(() => cleanup());

  it.each([
    [
      'Agent Run History Analytics',
      RouteDefinitions.ApplicationsRunAnalytics,
      '/agents/all/7/history/analytics?history_run_id=5',
      RouteDefinitions.Applications,
    ],
    [
      'Agent Results History Analytics',
      RouteDefinitions.ApplicationsEvaluateHistoryAnalytics,
      '/agents/all/7/evaluate/history/analytics?run=9',
      RouteDefinitions.Applications,
    ],
    [
      'Pipeline Run History Analytics',
      RouteDefinitions.PipelineRunAnalytics,
      '/pipelines/all/7/history/analytics?history_run_id=5',
      RouteDefinitions.Pipelines,
    ],
  ])('redirects %s to the list when the project changes', (_, routePath, url, listRoute) => {
    renderAt(routePath, url);

    act(() => onMonitorProjectChange());

    expect(screen.getByTestId('pathname').textContent).toBe(listRoute);
  });
});
