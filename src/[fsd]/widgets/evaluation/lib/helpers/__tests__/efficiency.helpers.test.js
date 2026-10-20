import { describe, expect, it } from 'vitest';

import { buildRunEfficiencyStrip, getRunTimeoutNote } from '../efficiency.helpers';

const ROLLUP = {
  cases: 2,
  recorded_cases: 1,
  timed_out_cases: 1,
  case_time_limit_seconds: 10,
  p50_latency_ms: 1700,
  p95_latency_ms: 1700,
  averages: { llm_calls: 2, tool_calls: 3 },
  totals: { llm_calls: 2, tool_calls: 4, tool_errors: 1 },
};

const AGENT_USAGE = {
  cases: 2,
  recorded_cases: 2,
  totals: { input_tokens: 3000, output_tokens: 200, reasoning_tokens: 0 },
  averages: { input_tokens: 1500, output_tokens: 100, reasoning_tokens: 0 },
  cost: 0.0042,
  average_cost: 0.0021,
  token_source: 'provider',
};

const valueOf = (strip, label) => strip.items.find(item => item.label === label)?.value;

describe('getRunTimeoutNote', () => {
  it('says nothing when no case timed out or the rollup predates the counter', () => {
    expect(getRunTimeoutNote(undefined)).toBeNull();
    expect(getRunTimeoutNote({ cases: 2 })).toBeNull();
    expect(getRunTimeoutNote({ cases: 2, timed_out_cases: 0 })).toBeNull();
  });

  it('counts the timeouts against the limit and says what the scores cover', () => {
    expect(getRunTimeoutNote(ROLLUP)).toEqual({
      label: '1 of 2 cases timed out at 10 s',
      coverage: 'Scores cover the other 1 case',
      message:
        '1 of 2 cases timed out at 10 s. Scores cover the other 1 case: a timed-out case is left out of every score except the latency checks.',
    });
  });

  it('flags a run where every case timed out, and works without the limit', () => {
    const note = getRunTimeoutNote({ cases: 3, timed_out_cases: 3 });
    expect(note.label).toBe('3 of 3 cases timed out');
    expect(note.coverage).toBe('No case was scored');
  });
});

describe('buildRunEfficiencyStrip', () => {
  it('renders nothing for a run without rollups', () => {
    expect(buildRunEfficiencyStrip(undefined)).toBeNull();
    expect(buildRunEfficiencyStrip({ judge_usage: { recorded_cases: 1 } })).toBeNull();
  });

  it('shows latency, timeouts, agent tokens and cost, tool calls and the tool-error rate', () => {
    const strip = buildRunEfficiencyStrip({ trajectory_rollup: ROLLUP, agent_usage: AGENT_USAGE });
    expect(strip.items.map(item => item.label)).toEqual([
      'Latency p50 / p95',
      'Timeouts',
      'Agent tokens',
      'Agent cost',
      'Tool calls / case',
      'Tool-error rate',
    ]);
    expect(valueOf(strip, 'Latency p50 / p95')).toBe('1.7 s / 1.7 s');
    expect(valueOf(strip, 'Timeouts')).toBe('1 of 2 cases');
    expect(valueOf(strip, 'Agent tokens')).toBe('3,200 (1,600 / case)');
    expect(valueOf(strip, 'Agent cost')).toBe('$0.0042 ($0.0021 / case)');
    expect(valueOf(strip, 'Tool calls / case')).toBe('3');
    expect(valueOf(strip, 'Tool-error rate')).toBe('25%');
    expect(strip.items.find(item => item.label === 'Timeouts').isAttention).toBe(true);
    expect(strip.judgeOverhead).toBeNull();
    expect(strip.isEstimate).toBe(false);
  });

  it('keeps the judge apart as a muted overhead line', () => {
    const strip = buildRunEfficiencyStrip({
      agent_usage: AGENT_USAGE,
      judge_usage: { recorded_cases: 2, totals: { input_tokens: 900 }, cost: 0.01 },
    });
    expect(valueOf(strip, 'Agent cost')).toBe('$0.0042 ($0.0021 / case)');
    expect(strip.judgeOverhead).toBe('Evaluation overhead: judge $0.0100');
    expect(
      buildRunEfficiencyStrip({
        agent_usage: AGENT_USAGE,
        judge_usage: { recorded_cases: 1, totals: { input_tokens: 900 }, cost: null },
      }).judgeOverhead,
    ).toBe('Evaluation overhead: judge 900 tokens, not priced');
  });

  it('marks estimated agent figures and an unpriced agent', () => {
    const strip = buildRunEfficiencyStrip({
      agent_usage: { ...AGENT_USAGE, cost: null, average_cost: null, token_source: 'estimate' },
    });
    expect(valueOf(strip, 'Agent cost')).toBe('Not priced');
    expect(strip.isEstimate).toBe(true);
  });

  it('leaves out timeouts for a rollup that predates the counter', () => {
    const older = { ...ROLLUP, timed_out_cases: undefined };
    expect(valueOf(buildRunEfficiencyStrip({ trajectory_rollup: older }), 'Timeouts')).toBeUndefined();
  });
});
