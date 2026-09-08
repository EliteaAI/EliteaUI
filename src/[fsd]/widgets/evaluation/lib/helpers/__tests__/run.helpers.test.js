import { describe, expect, it } from 'vitest';

import {
  UNTITLED_SUITE_LABEL,
  buildRunHistory,
  compareRunScore,
  formatRunStatus,
  formatScoreDelta,
  getRunScoreLabel,
  isRunActive,
  isRunTerminal,
  resolveRunSuiteName,
  sinkUnscoredRuns,
} from '../run.helpers';

// Runs arrive newest first, mirroring the eval_runs list endpoint.
const runs = [
  { id: 5, status: 'finished', headline_score: 80 },
  { id: 4, status: 'errored', headline_score: null },
  { id: 3, status: 'finished', headline_score: 75.5 },
  { id: 2, status: 'finished', headline_score: 90 },
];

describe('buildRunHistory', () => {
  it('returns an empty list for no runs', () => {
    expect(buildRunHistory()).toEqual([]);
    expect(buildRunHistory([])).toEqual([]);
  });

  it('computes the delta against the previous scored run', () => {
    const history = buildRunHistory(runs);
    expect(history.map(r => [r.id, r.delta])).toEqual([
      [5, 4.5],
      [4, null],
      [3, -14.5],
      [2, null],
    ]);
  });

  it('skips unscored runs when picking the baseline', () => {
    const [newest] = buildRunHistory(runs);
    expect(newest.comparedToRunId).toBe(3);
  });

  it('leaves the oldest scored run without a delta', () => {
    const history = buildRunHistory(runs);
    expect(history.at(-1).delta).toBeNull();
  });

  it('does not mutate the input runs', () => {
    buildRunHistory(runs);
    expect(runs[0]).not.toHaveProperty('delta');
  });
});

describe('run status vocabulary', () => {
  it('stops the progress poll on a cancelled run', () => {
    expect(isRunTerminal('cancelled')).toBe(true);
    expect(isRunTerminal('running')).toBe(false);
    expect(isRunTerminal('created')).toBe(false);
  });

  it('does not treat a cancelled run as still active', () => {
    expect(isRunActive('cancelled')).toBe(false);
  });

  // A deliberate stop must not read as a failure of the agent or the rubric.
  it('labels a cancelled run distinctly from a failed one', () => {
    expect(formatRunStatus('cancelled')).toBe('Cancelled');
    expect(formatRunStatus('errored')).toBe('Failed');
  });
});

describe('formatScoreDelta', () => {
  it('signs positive deltas and leaves negatives as-is', () => {
    expect(formatScoreDelta(4.5)).toBe('+4.5');
    expect(formatScoreDelta(-14.5)).toBe('-14.5');
  });

  it('renders a flat delta without a sign', () => {
    expect(formatScoreDelta(0)).toBe('0');
  });

  it('renders nothing when there is no delta', () => {
    expect(formatScoreDelta(null)).toBe('');
    expect(formatScoreDelta(undefined)).toBe('');
    expect(formatScoreDelta(NaN)).toBe('');
  });
});

describe('resolveRunSuiteName', () => {
  it('prefers the name frozen in the run snapshot over the live suite list', () => {
    const run = { suite_id: 1, snapshot: { suite: { id: 1, name: 'Hallucination Check' } } };
    expect(resolveRunSuiteName(run, { 1: 'Renamed Later' })).toBe('Hallucination Check');
  });

  it('falls back to the live suite list for rows that carry no snapshot', () => {
    expect(resolveRunSuiteName({ suite_id: 7 }, { 7: 'Response Quality' })).toBe('Response Quality');
  });

  it('falls back to the untitled label when the suite can no longer be named', () => {
    expect(resolveRunSuiteName({ suite_id: 7 }, {})).toBe(UNTITLED_SUITE_LABEL);
    expect(resolveRunSuiteName(null)).toBe(UNTITLED_SUITE_LABEL);
  });
});

describe('getRunScoreLabel', () => {
  it('renders a scored run as a trimmed number', () => {
    expect(getRunScoreLabel({ status: 'finished', headline_score: 83 })).toBe('83');
    expect(getRunScoreLabel({ status: 'finished', headline_score: 83.5 })).toBe('83.5');
    expect(getRunScoreLabel({ status: 'finished', headline_score: 83.456 })).toBe('83.46');
  });

  it('reports the lifecycle status while the run has not finished', () => {
    expect(getRunScoreLabel({ status: 'running' })).toBe('Running');
    expect(getRunScoreLabel({ status: 'created' })).toBe('Queued');
  });

  it('says pending rather than zero while human evaluation is outstanding', () => {
    expect(getRunScoreLabel({ status: 'finished', progress: { pending_human: 2 } })).toBe('Pending');
  });

  it('falls back to a dash for a terminal run that never produced a score', () => {
    expect(getRunScoreLabel({ status: 'errored', progress: {} })).toBe('—');
  });
});

describe('compareRunScore', () => {
  it('orders scored runs by their headline', () => {
    expect(compareRunScore({ headline_score: 10 }, { headline_score: 20 })).toBeLessThan(0);
    expect(compareRunScore({ headline_score: 30 }, { headline_score: 20 })).toBeGreaterThan(0);
    expect(compareRunScore({ headline_score: 20 }, { headline_score: 20 })).toBe(0);
  });

  // A ±1 here would be negated along with everything else when the column is sorted descending,
  // floating every pending run above the scored ones. `sinkUnscoredRuns` does the sinking instead.
  it('leaves unscored runs in place rather than sinking them with a sign', () => {
    expect(compareRunScore({ headline_score: null }, { headline_score: 20 })).toBe(0);
    expect(compareRunScore({ headline_score: 20 }, { headline_score: null })).toBe(0);
    expect(compareRunScore({ headline_score: null }, { headline_score: null })).toBe(0);
    expect(compareRunScore({ headline_score: NaN }, { headline_score: 20 })).toBe(0);
  });
});

describe('sinkUnscoredRuns', () => {
  it('moves unscored runs to the end while preserving the order of each group', () => {
    const mixedRuns = [
      { id: 1, headline_score: null },
      { id: 2, headline_score: 80 },
      { id: 3, headline_score: NaN },
      { id: 4, headline_score: 20 },
    ];

    expect(sinkUnscoredRuns(mixedRuns).map(run => run.id)).toEqual([2, 4, 1, 3]);
  });

  it('handles an empty list', () => {
    expect(sinkUnscoredRuns()).toEqual([]);
  });
});
