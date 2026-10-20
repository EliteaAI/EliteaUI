// @vitest-environment jsdom
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import RunHistoryPage from '../RunHistoryPage';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

vi.mock('@/[fsd]/entities/run-history/ui', () => ({
  RunHistoryContainer: props => (
    <button
      data-testid="open-analytics"
      onClick={() => props.handleOpenAnalytics(77)}
    />
  ),
}));

vi.mock('@/[fsd]/features/chat', () => ({ ChatMessageList: () => null }));

vi.mock('@/[fsd]/features/settings/ui/drawer-page', () => ({ DrawerPageHeader: () => null }));

vi.mock('@/[fsd]/features/toolkits', () => ({ ToolkitsHelpers: { prettifyToolkitConversation: vi.fn() } }));

vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => null }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 2 }));

vi.mock('@/api/applications', () => ({ useApplicationDetailsQuery: () => ({ data: undefined }) }));

const AnalyticsProbe = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="analytics-page">{`${pathname}${search}`}</div>;
};

const renderAt = url =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/agents/:tab/:agentId/history"
          element={
            <RunHistoryPage
              source="application"
              detailRoute="/agents/:tab/:agentId"
              analyticsRoute="/agents/:tab/:agentId/history/analytics"
            />
          }
        />
        <Route
          path="/agents/:tab/:agentId/history/analytics"
          element={<AnalyticsProbe />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('RunHistoryPage opening run analytics', () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => cleanup());

  it('opens the chosen conversation without the single analytics run it was reached from', () => {
    renderAt('/agents/all/127/history?usage_run_id=run-x&history_run_id=9');

    fireEvent.click(screen.getByTestId('open-analytics'));

    expect(screen.getByTestId('analytics-page')).toHaveTextContent(
      '/agents/all/127/history/analytics?history_run_id=77',
    );
  });

  it('keeps the other search params of a plain Run History visit', () => {
    renderAt('/agents/all/127/history?viewMode=owner');

    fireEvent.click(screen.getByTestId('open-analytics'));

    expect(screen.getByTestId('analytics-page')).toHaveTextContent(
      '/agents/all/127/history/analytics?viewMode=owner&history_run_id=77',
    );
  });
});
