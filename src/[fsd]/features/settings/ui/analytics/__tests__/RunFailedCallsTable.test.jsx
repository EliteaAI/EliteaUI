// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunFailedCallsTable from '../components/RunFailedCallsTable';
import { AnalyticsTestWrapper as Wrapper, installGlobalStubs } from './_testHelpers';

installGlobalStubs();

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: { fmtDuration: ms => `${ms}ms` },
  AnalyticsExportHelpers: { fmtRunDateTime: iso => `at ${iso}` },
}));

const FAILED_LLM_CALL = {
  key: 'llm-1',
  ts: '2026-10-09T10:01:00Z',
  eventType: 'llm',
  name: 'Claude Sonnet',
  durationMs: 900,
};

const renderTable = calls =>
  render(
    <Wrapper>
      <RunFailedCallsTable calls={calls} />
    </Wrapper>,
  );

describe('RunFailedCallsTable', () => {
  afterEach(() => cleanup());

  it('lists each failing call with its time, event type, model and latency', () => {
    renderTable([FAILED_LLM_CALL]);

    const rows = screen.getAllByTestId('run-analytics-failed-call');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('at 2026-10-09T10:01:00Z');
    expect(rows[0]).toHaveTextContent('llm');
    expect(rows[0]).toHaveTextContent('Claude Sonnet');
    expect(rows[0]).toHaveTextContent('900ms');
  });

  it('names a call without a model or tool with a dash', () => {
    renderTable([{ ...FAILED_LLM_CALL, name: null }]);

    expect(screen.getByTestId('run-analytics-failed-call')).toHaveTextContent('—');
  });

  it('renders nothing for a run without failures', () => {
    renderTable([]);

    expect(screen.queryByTestId('run-analytics-failed-calls')).not.toBeInTheDocument();
  });
});
