import { describe, expect, it } from 'vitest';

import {
  buildBudgetVerdictRows,
  buildCaseUsageRows,
  buildRunConsumptionRows,
  buildRunEstimateSummary,
  formatTokenCount,
  formatUsd,
  getRunEndMessage,
  getRunHistoryUsage,
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

  it('says judge tokens cover all AI dimensions together', () => {
    const [agent, judge] = buildRunConsumptionRows({ agent_usage: rollup(), judge_usage: rollup() });
    expect(agent.coverage).toBeNull();
    expect(judge.coverage).toBe('all AI dimensions together, not split per dimension');
    expect(buildRunConsumptionRows({ judge_usage: rollup({ recorded_cases: 3 }) })[0].coverage).toBe(
      '3 of 4 cases recorded · all AI dimensions together, not split per dimension',
    );
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

describe('buildRunEstimateSummary', () => {
  const estimateResponse = overrides => ({
    available: true,
    cases: 10,
    history_run_id: 149,
    estimate: {
      cases: 10,
      based_on_cases: 2,
      includes_judge: true,
      tokens: { low: 1200, expected: 2200, high: 3200 },
      cost: { low: 0.12, expected: 0.22, high: 0.32 },
      unpriced_cases: 0,
    },
    budget: { scope: 'project', remaining: 5 },
    exceeds_budget: false,
    ...overrides,
  });

  it('shows the cost estimate as a range with the remaining budget', () => {
    expect(buildRunEstimateSummary(estimateResponse())).toEqual({
      available: true,
      label: 'Estimated $0.2200',
      range: 'Range $0.1200–$0.3200',
      detail: '10 cases · based on run #149 · agent + judge',
      budget: 'Remaining project budget: $5.00',
      warning: null,
    });
  });

  it('falls back to tokens when the history run was not priced', () => {
    const data = estimateResponse();
    data.estimate = { ...data.estimate, cost: null, includes_judge: false, unpriced_cases: 2 };
    const summary = buildRunEstimateSummary({ ...data, budget: null, exceeds_budget: null });
    expect(summary.label).toBe('Estimated 2,200 tokens');
    expect(summary.range).toBe('Range 1,200–3,200 tokens');
    expect(summary.detail).toBe('10 cases · based on run #149 · agent only · not priced');
    expect(summary.budget).toBeNull();
    expect(summary.warning).toBeNull();
  });

  it('warns when the estimate is over the remaining budget', () => {
    const summary = buildRunEstimateSummary(
      estimateResponse({ budget: { scope: 'member', remaining: 0.1 }, exceeds_budget: true }),
    );
    expect(summary.budget).toBe('Your remaining budget: $0.1000');
    expect(summary.warning).toMatch(/over the remaining monthly budget/);
  });

  it('says there is no estimate before the first finished run', () => {
    const summary = buildRunEstimateSummary({ available: false, estimate: null, budget: null });
    expect(summary.available).toBe(false);
    expect(summary.label).toBe('No estimate (first run)');
    expect(summary.range).toBeNull();
  });

  it('is null until the estimate loads', () => {
    expect(buildRunEstimateSummary(undefined)).toBeNull();
  });
});

describe('buildCaseUsageRows', () => {
  it('lists agent before judge with tokens, cost and source', () => {
    const rows = buildCaseUsageRows([
      {
        role: 'judge',
        usage_state: 'recorded',
        input_tokens: 300,
        output_tokens: 20,
        total_tokens: 320,
        cost: null,
      },
      {
        role: 'agent',
        usage_state: 'recorded',
        input_tokens: 5074,
        output_tokens: 2373,
        total_tokens: 7447,
        cost: 0.0123,
        cost_source: 'usage_event',
        model_name: 'haiku',
      },
    ]);

    expect(rows.map(row => row.role)).toEqual(['agent', 'judge']);
    expect(rows[0]).toMatchObject({
      inputTokens: '5,074',
      outputTokens: '2,373',
      totalTokens: '7,447',
      cost: '$0.0123',
      note: 'haiku · from the usage ledger',
      isUnpriced: false,
    });
    expect(rows[1]).toMatchObject({
      cost: 'Not priced',
      isUnpriced: true,
      note: 'all AI dimensions together, not split per dimension',
    });
  });

  it('says why a row has no figures', () => {
    const [row] = buildCaseUsageRows([
      { role: 'agent', usage_state: 'not_recorded', usage_state_reason: 'timeout', total_tokens: 0 },
    ]);

    expect(row).toMatchObject({
      totalTokens: '—',
      cost: '—',
      isRecorded: false,
      note: 'Not recorded: the case timed out',
    });
  });

  it('flags estimated tokens and ignores unknown roles', () => {
    const rows = buildCaseUsageRows([
      { role: 'agent', usage_state: 'recorded', token_source: 'estimate', total_tokens: 10 },
      { role: 'other', usage_state: 'recorded' },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].note).toBe('tokens estimated');
    expect(buildCaseUsageRows(undefined)).toEqual([]);
  });
});

describe('getRunHistoryUsage', () => {
  it('shows the agent tokens per recorded case, with cost and source in the tooltip', () => {
    const meta = {
      agent_usage: {
        cases: 2,
        recorded_cases: 2,
        averages: { input_tokens: 1857.5, output_tokens: 63.5, reasoning_tokens: 0 },
        average_cost: null,
        token_source: 'estimate',
      },
      judge_usage: { cases: 2, recorded_cases: 2, averages: { input_tokens: 9999 } },
    };
    expect(getRunHistoryUsage(meta)).toEqual({
      label: '1,921',
      tooltip: 'Agent tokens per case, averaged over 2 of 2 cases · Not priced · estimated',
    });
    expect(
      getRunHistoryUsage({
        agent_usage: { ...meta.agent_usage, average_cost: 0.0021, token_source: 'provider' },
      }).tooltip,
    ).toBe('Agent tokens per case, averaged over 2 of 2 cases · $0.0021 per case');
  });

  it('is empty without a recorded agent rollup', () => {
    expect(getRunHistoryUsage({})).toBeNull();
    expect(getRunHistoryUsage(undefined)).toBeNull();
    expect(getRunHistoryUsage({ agent_usage: { cases: 2, recorded_cases: 0 } })).toBeNull();
  });
});
