// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsUsersQuery } from '@/api';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AnalyticsUsers from '../AnalyticsUsers';
import { AnalyticsTestWrapper as Wrapper } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/api', () => ({
  useAnalyticsUsersQuery: vi.fn(),
}));

vi.mock('@/components/SearchInput', () => ({ default: () => null }));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  AnalyticsUserDetailed: () => null,
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: {
    fmtCost: v => `$${v ?? 0}`,
    fmtNum: v => String(v ?? 0),
  },
}));

const ROW = {
  user_id: 7,
  user_email: 'alice@example.com',
  active_days: 2,
  llm_events: 11,
  tool_events: 22,
  agent_events: 33,
  skill_events: 44,
  chat_events: 55,
  errors: 0,
};

const headerLabels = () =>
  Array.from(screen.getByTestId('analytics-users-table-header').children).map(cell => cell.textContent);

const rowValues = () =>
  Array.from(screen.getByTestId('analytics-users-row').children).map(cell => cell.textContent);

const renderUsers = props =>
  render(
    <AnalyticsUsers
      projectId={1}
      dateFrom="2026-01-01"
      dateTo="2026-01-31"
      {...props}
    />,
    { wrapper: Wrapper },
  );

describe('AnalyticsUsers — skill runs column (#7030)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsUsersQuery.mockReturnValue({ data: { total: 1, rows: [ROW] }, isFetching: false });
  });

  afterEach(() => cleanup());

  it('adds Skill Runs right after Agent/Pipeline Runs with its value', () => {
    renderUsers({ canViewSkills: true });

    const labels = headerLabels();
    expect(labels.indexOf('Skill Runs')).toBe(labels.indexOf('Agent/Pipeline Runs') + 1);
    const values = rowValues();
    expect(values.indexOf('44')).toBe(values.indexOf('33') + 1);
    expect(values).toHaveLength(labels.length);
  });

  it('hides the Skill Runs column without the skills permission', () => {
    renderUsers();

    expect(headerLabels()).not.toContain('Skill Runs');
    expect(rowValues()).not.toContain('44');
    expect(rowValues()).toHaveLength(headerLabels().length);
  });
});
