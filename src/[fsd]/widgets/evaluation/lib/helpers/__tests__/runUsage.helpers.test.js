import { describe, expect, it } from 'vitest';

import {
  buildBudgetVerdictRows,
  buildRunConsumptionRows,
  formatTokenCount,
  formatUsd,
  getRunEndMessage,
  getRunOverBudgetLabel,
  getRunStopLabel,
  getSettlementInfo,
} from '../runUsage.helpers';

const rollup = overrides => ({
  cases: 4,
  recorded_cases: 4,
  totals: { input_tokens: 1200, output_tokens: 300, reasoning_tokens: 0 },
  cost: 0.0123,
  unpriced_cases: 0,
  ...overrides,
});

describe('getRunStopLabel', () => {
  it.each([
    [{ stop_reason: 'cancel_requested' }, 'Cancelled by user'],
    [{ stop_reason: 'time_budget' }, 'Time limit reached'],
    [{ stop_reason: 'budget_exhausted' }, 'Token budget reached'],
    [{ stop_reason: 'gate_closed', stop_scope: 'project' }, 'Project monthly budget used up'],
    [{ stop_reason: 'gate_closed', stop_scope: 'member' }, 'Your monthly budget used up'],
  ])('labels %o', (meta, label) => {
    expect(getRunStopLabel(meta)).toBe(label);
  });

  it('has no label for a run that ran to the end or failed', () => {
    expect(getRunStopLabel({})).toBeNull();
    expect(getRunStopLabel(undefined)).toBeNull();
    expect(getRunStopLabel({ stop_reason: 'failure' })).toBeNull();
  });
});

describe('getRunEndMessage', () => {
  it('shows a stopped run as a warning and a failed one as an error', () => {
    expect(getRunEndMessage({ status: 'cancelled', error: 'Run stopped.' })).toEqual({
      message: 'Run stopped.',
      variant: 'warning',
    });
    expect(getRunEndMessage({ status: 'errored', error: ' boom ' })).toEqual({
      message: 'boom',
      variant: 'error',
    });
  });

  it('has nothing to say without an error', () => {
    expect(getRunEndMessage({ status: 'finished', error: null })).toBeNull();
    expect(getRunEndMessage({ status: 'cancelled', error: '  ' })).toBeNull();
    expect(getRunEndMessage(null)).toBeNull();
  });
});

describe('formatters', () => {
  it('formats tokens with separators', () => {
    expect(formatTokenCount(1234567)).toBe('1,234,567');
    expect(formatTokenCount(null)).toBe('—');
  });

  it('keeps small costs readable', () => {
    expect(formatUsd(0.0123)).toBe('$0.0123');
    expect(formatUsd(0.004)).toBe('$0.0040');
    expect(formatUsd(1.5)).toBe('$1.50');
    expect(formatUsd(0)).toBe('$0.00');
    expect(formatUsd(null)).toBeNull();
  });
});

describe('buildRunConsumptionRows', () => {
  it('has a row per role that reported usage', () => {
    expect(buildRunConsumptionRows({ agent_usage: rollup() })).toEqual([
      {
        role: 'agent',
        label: 'Agent',
        inputTokens: '1,200',
        outputTokens: '300',
        totalTokens: '1,500',
        cost: '$0.0123',
        coverage: null,
        isUnpriced: false,
      },
    ]);
    expect(
      buildRunConsumptionRows({ agent_usage: rollup(), judge_usage: rollup() }).map(r => r.role),
    ).toEqual(['agent', 'judge']);
    expect(buildRunConsumptionRows({})).toEqual([]);
    expect(buildRunConsumptionRows(undefined)).toEqual([]);
  });

  it('says when the cost is unknown and how many cases the figures cover', () => {
    const [row] = buildRunConsumptionRows({
      agent_usage: rollup({ cost: null, recorded_cases: 3, unpriced_cases: 1 }),
    });
    expect(row.cost).toBe('Not priced');
    expect(row.isUnpriced).toBe(true);
    expect(row.coverage).toBe('3 of 4 cases recorded · 1 case not priced');
  });
});

describe('buildBudgetVerdictRows', () => {
  it('has a row per limit the suite set', () => {
    const rows = buildBudgetVerdictRows({
      verdict: 'breached',
      per_case: {
        tokens: { limit: 500, cases: 4, breached_cases: 1, unknown_cases: 0, verdict: 'breached' },
      },
      per_run: {
        tokens: { limit: 50000, value: 1500, verdict: 'pass' },
        cost: { limit: 1, value: null, verdict: 'unknown' },
      },
    });
    expect(rows).toEqual([
      {
        key: 'per_case.tokens',
        label: 'Per case · tokens',
        limit: '500 tokens',
        detail: '1 of 4 cases over',
        verdict: 'breached',
        verdictLabel: 'Over limit',
      },
      {
        key: 'per_run.tokens',
        label: 'Per run · tokens',
        limit: '50,000 tokens',
        detail: 'Used 1,500 tokens',
        verdict: 'pass',
        verdictLabel: 'Within limit',
      },
      {
        key: 'per_run.cost',
        label: 'Per run · cost',
        limit: '$1.00',
        detail: 'Not known',
        verdict: 'unknown',
        verdictLabel: 'Unknown',
      },
    ]);
  });

  it('counts per-case cases it could not judge', () => {
    const [row] = buildBudgetVerdictRows({
      per_case: { cost: { limit: 0.1, cases: 4, breached_cases: 0, unknown_cases: 2, verdict: 'unknown' } },
    });
    expect(row.detail).toBe('0 of 4 cases over, 2 unknown');
  });

  it('is empty without a verdict', () => {
    expect(buildBudgetVerdictRows(undefined)).toEqual([]);
  });

  it('says when a run token limit was only reported', () => {
    const [row] = buildBudgetVerdictRows({
      per_run: { tokens: { limit: 500, value: 1377, verdict: 'breached', on_breach: 'report' } },
    });
    expect(row.detail).toBe('Used 1,377 tokens · reported only');
  });
});

describe('getRunOverBudgetLabel', () => {
  it('names the limits a run went over', () => {
    expect(
      getRunOverBudgetLabel({
        budget_verdict: {
          verdict: 'breached',
          per_case: { cost: { limit: 0.1, cases: 2, breached_cases: 0, unknown_cases: 0, verdict: 'pass' } },
          per_run: { tokens: { limit: 500, value: 1377, verdict: 'breached', on_breach: 'report' } },
        },
      }),
    ).toBe('Over budget: Per run · tokens');
  });

  it('is null when the run stayed within its limits or set none', () => {
    expect(getRunOverBudgetLabel({ budget_verdict: { verdict: 'pass' } })).toBeNull();
    expect(getRunOverBudgetLabel({ budget_verdict: { verdict: 'unknown' } })).toBeNull();
    expect(getRunOverBudgetLabel({})).toBeNull();
  });
});

describe('getSettlementInfo', () => {
  it.each([
    [{ state: 'pending' }, 'Settling'],
    [{ state: 'settled', settled_rows: 4, expected_rows: 4 }, 'Settled'],
    [{ state: 'partial', settled_rows: 1, expected_rows: 2 }, 'Partly settled'],
    [{ state: 'unavailable', reason: 'ledger_unreadable' }, 'Runtime figures'],
  ])('labels %o', (settlement, label) => {
    expect(getSettlementInfo(settlement).label).toBe(label);
  });

  it('explains a partial or unavailable settlement', () => {
    expect(getSettlementInfo({ state: 'partial', settled_rows: 1, expected_rows: 2 }).description).toMatch(
      /^1 of 2 figures/,
    );
    expect(getSettlementInfo({ state: 'unavailable', reason: 'ledger_unreadable' }).description).toMatch(
      /could not be read/,
    );
    expect(getSettlementInfo({ state: 'unavailable', reason: 'write_failed' }).description).toMatch(
      /could not be saved/,
    );
    expect(getSettlementInfo({ state: 'unavailable' }).description).toMatch(/had nothing/);
  });

  it('is null before the run reports a settlement', () => {
    expect(getSettlementInfo(undefined)).toBeNull();
  });
});
