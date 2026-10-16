import { describe, expect, it } from 'vitest';

import { buildPerformanceDiff } from '../performanceDiff.helpers';

const metric = overrides => ({
  run: 1000,
  reference: 1000,
  delta: 0,
  delta_pct: 0,
  cases: 3,
  excluded: 0,
  verdict: 'unchanged',
  not_comparable: null,
  ...overrides,
});

const COMPARE = {
  run: { id: 12 },
  reference: { id: 10, source: 'baseline' },
  diff: {
    not_comparable: [],
    noise: { relative: 0.15, absolute_ms: 2000 },
    coverage: { matched: 3, changed: [7], only_in_run: [9], only_in_reference: [] },
    metrics: {
      p50_latency_ms: metric({ run: 6000, reference: 3000, delta: 3000, delta_pct: 100, verdict: 'worse' }),
      p95_latency_ms: metric({ excluded: 1 }),
      p50_final_answer_ms: metric(),
      tool_calls: metric({ run: 4, reference: 6, delta: -2, delta_pct: -33.3, verdict: 'better' }),
      agent_tokens: metric({ run: 1200, reference: 1200 }),
      agent_cost: metric({ run: null, reference: null, cases: 0, excluded: 3, verdict: null }),
    },
    timeouts: { not_comparable: null, newly_timed_out: [4], no_longer_timed_out: [] },
    slower_than_reference: true,
  },
};

describe('buildPerformanceDiff', () => {
  it('returns null without a reference', () => {
    expect(buildPerformanceDiff(undefined)).toBeNull();
    expect(buildPerformanceDiff({ run: { id: 1 }, reference: null, diff: null })).toBeNull();
  });

  it('labels the reference by its source', () => {
    expect(buildPerformanceDiff(COMPARE).referenceLabel).toBe('Run #10 (suite baseline)');
  });

  it('builds a row per metric with change, verdict and coverage', () => {
    const { rows } = buildPerformanceDiff(COMPARE);
    const byKey = Object.fromEntries(rows.map(r => [r.key, r]));

    expect(rows).toHaveLength(6);
    expect(byKey.p50_latency_ms).toMatchObject({ change: '+100%', verdict: 'worse', verdictLabel: 'Worse' });
    expect(byKey.p95_latency_ms.coverage).toBe('3 cases, 1 left out');
    expect(byKey.tool_calls).toMatchObject({
      run: '4',
      reference: '6',
      change: '-33%',
      verdictLabel: 'Better',
    });
    expect(byKey.agent_cost).toMatchObject({ run: '—', reference: '—', coverage: null });
  });

  it('notes changed and one-sided cases, timeouts and the noise band', () => {
    const view = buildPerformanceDiff(COMPARE);

    expect(view.notes).toEqual([
      '1 case changed input since the reference and is left out.',
      '1 case ran in only one of the two runs and is left out.',
    ]);
    expect(view.timeouts).toEqual({ newly: '#4', noLonger: null });
    expect(view.noise).toBe('Latency changes within ±15% or 2 s count as noise.');
    expect(view.isSlower).toBe(true);
  });

  it('withholds latency and timeouts when the time limit changed', () => {
    const latency = metric({ not_comparable: 'time_limit_changed', verdict: null });
    const view = buildPerformanceDiff({
      ...COMPARE,
      diff: {
        ...COMPARE.diff,
        not_comparable: ['time_limit_changed'],
        metrics: { ...COMPARE.diff.metrics, p50_latency_ms: latency },
        timeouts: { ...COMPARE.diff.timeouts, not_comparable: 'time_limit_changed' },
      },
    });

    expect(view.rows[0]).toMatchObject({ change: 'Not comparable', verdict: null });
    expect(view.timeouts).toBeNull();
    expect(view.notes[0]).toMatch(/time limit changed/);
  });
});
