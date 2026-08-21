import { describe, expect, it } from 'vitest';

import {
  buildRunHistory,
  formatRunStatus,
  formatScoreDelta,
  isRunActive,
  isRunTerminal,
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
