// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AnalyticsHealth from '../AnalyticsHealth';
import { AnalyticsTestWrapper as Wrapper, installGlobalStubs } from './_testHelpers';

installGlobalStubs();

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: { fmtNum: v => String(v ?? 0), fmtDuration: ms => `${ms}ms` },
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  ChartTooltip: () => null,
  RunFailedCallsTable: props => (
    <div
      data-testid="failed-calls-table"
      data-calls={JSON.stringify(props.calls)}
    />
  ),
}));

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

  it('hands the run failed calls to the failed-calls table under the event type health', () => {
    const failedCalls = [{ key: 'llm-1', eventType: 'llm', name: 'Claude Sonnet' }];
    renderHealth({ failedCalls });

    expect(screen.getByTestId('failed-calls-table')).toHaveAttribute(
      'data-calls',
      JSON.stringify(failedCalls),
    );
  });

  it('passes no calls when the page has no run trace', () => {
    renderHealth({});

    expect(screen.getByTestId('failed-calls-table')).toHaveAttribute('data-calls', '[]');
  });
});
