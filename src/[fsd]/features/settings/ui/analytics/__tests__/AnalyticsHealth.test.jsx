// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AnalyticsHealth from '../AnalyticsHealth';
import { AnalyticsTestWrapper as Wrapper, installGlobalStubs } from './_testHelpers';

installGlobalStubs();

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: { fmtNum: v => String(v ?? 0), fmtDuration: ms => `${ms}ms` },
  AnalyticsExportHelpers: { fmtRunDateTime: iso => `at ${iso}` },
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({ ChartTooltip: () => null }));

const HEALTH = [{ event_type: 'llm', total: 2, errors: 1, error_rate: 50, avg_duration_ms: 700 }];

const renderHealth = props =>
  render(
    <Wrapper>
      <AnalyticsHealth
        health={HEALTH}
        hideTrend
        {...props}
      />
    </Wrapper>,
  );

describe('AnalyticsHealth failed calls', () => {
  afterEach(() => cleanup());

  it('lists each failing call of the run under the event type health', () => {
    renderHealth({
      failedCalls: [
        {
          key: 'llm-1',
          ts: '2026-10-09T10:01:00Z',
          eventType: 'llm',
          name: 'Claude Sonnet',
          durationMs: 900,
        },
      ],
    });

    const rows = screen.getAllByTestId('run-analytics-failed-call');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('at 2026-10-09T10:01:00Z');
    expect(rows[0]).toHaveTextContent('Claude Sonnet');
    expect(rows[0]).toHaveTextContent('900ms');
  });

  it('shows no failed-calls card for a run without failures or without a trace', () => {
    renderHealth({ failedCalls: [] });
    expect(screen.queryByTestId('run-analytics-failed-calls')).not.toBeInTheDocument();

    cleanup();
    renderHealth({});
    expect(screen.queryByTestId('run-analytics-failed-calls')).not.toBeInTheDocument();
  });
});
