import { describe, expect, it } from 'vitest';

import {
  HUMAN_SCALE_KIND,
  clampHumanScore,
  formatHumanOutcome,
  getPassFailOptions,
  isValidHumanScore,
  resolveHumanScale,
} from '../humanScore.helpers';

describe('resolveHumanScale', () => {
  it('maps a binary dimension onto a Pass/Fail control', () => {
    const scale = resolveHumanScale({ scaleType: 'binary', scaleMin: 0, scaleMax: 1 });
    expect(scale.kind).toBe(HUMAN_SCALE_KIND.passFail);
    expect(getPassFailOptions(scale)).toEqual([
      { value: 1, label: 'Pass' },
      { value: 0, label: 'Fail' },
    ]);
  });

  it('gives an ordinal dimension one mark per point', () => {
    const scale = resolveHumanScale({ scaleType: 'ordinal', scaleMin: 1, scaleMax: 5 });
    expect(scale.kind).toBe(HUMAN_SCALE_KIND.rating);
    expect(scale.label).toBe('Rating');
    expect(scale.marks.map(m => m.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it('rules a wide continuous scale on round numbers', () => {
    const scale = resolveHumanScale({ scaleType: 'continuous', scaleMin: 0, scaleMax: 100 });
    expect(scale.kind).toBe(HUMAN_SCALE_KIND.score);
    expect(scale.marks.map(m => m.value)).toEqual([0, 25, 50, 75, 100]);
  });

  // The Score preset is 1..100, and exact quartiles of it would read 1 / 26 / 51 / 75 / 100.
  it('snaps the interior marks to round numbers, keeping the real bounds as endpoints', () => {
    const scale = resolveHumanScale({ scaleType: 'continuous', scaleMin: 1, scaleMax: 100 });
    expect(scale.marks.map(m => m.value)).toEqual([1, 25, 50, 75, 100]);
  });

  it('keeps the ruler on whole numbers for a narrow continuous scale', () => {
    const scale = resolveHumanScale({ scaleType: 'continuous', scaleMin: 0, scaleMax: 10 });
    expect(scale.marks.map(m => m.value)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  // A dimension may leave its bounds unset; the control must still offer the range the server
  // normalizer assumes rather than collapsing to 0..0.
  it('falls back to the normalizer defaults when bounds are missing', () => {
    expect(resolveHumanScale({ scaleType: 'ordinal' })).toMatchObject({ min: 1, max: 5 });
    expect(resolveHumanScale({ scaleType: 'continuous' })).toMatchObject({ min: 0, max: 100 });
    expect(resolveHumanScale(null)).toMatchObject({ min: 0, max: 100 });
  });

  it('ignores a max that is not above the min', () => {
    expect(resolveHumanScale({ scaleType: 'continuous', scaleMin: 0, scaleMax: 0 })).toMatchObject({
      min: 0,
      max: 100,
    });
  });
});

describe('isValidHumanScore', () => {
  const score = resolveHumanScale({ scaleType: 'continuous', scaleMin: 1, scaleMax: 100 });
  const rating = resolveHumanScale({ scaleType: 'ordinal', scaleMin: 1, scaleMax: 5 });
  const passFail = resolveHumanScale({ scaleType: 'binary', scaleMin: 0, scaleMax: 1 });

  it('requires a value', () => {
    expect(isValidHumanScore(null, score)).toBe(false);
    expect(isValidHumanScore('', score)).toBe(false);
    expect(isValidHumanScore('abc', score)).toBe(false);
  });

  it('enforces the configured bounds', () => {
    expect(isValidHumanScore(0, score)).toBe(false);
    expect(isValidHumanScore(1, score)).toBe(true);
    expect(isValidHumanScore(100, score)).toBe(true);
    expect(isValidHumanScore(101, score)).toBe(false);
  });

  it('accepts fractions on a continuous scale but not an ordinal one', () => {
    expect(isValidHumanScore(75.5, score)).toBe(true);
    expect(isValidHumanScore(3.5, rating)).toBe(false);
    expect(isValidHumanScore(3, rating)).toBe(true);
  });

  it('accepts only the two endpoints of a binary scale', () => {
    expect(isValidHumanScore(0, passFail)).toBe(true);
    expect(isValidHumanScore(1, passFail)).toBe(true);
    expect(isValidHumanScore(0.5, passFail)).toBe(false);
  });
});

describe('clampHumanScore', () => {
  const scale = resolveHumanScale({ scaleType: 'continuous', scaleMin: 1, scaleMax: 100 });

  it('pulls an out-of-range entry back into the scale', () => {
    expect(clampHumanScore(500, scale)).toBe(100);
    expect(clampHumanScore(-4, scale)).toBe(1);
    expect(clampHumanScore(42, scale)).toBe(42);
    expect(clampHumanScore(null, scale)).toBeNull();
  });
});

describe('formatHumanOutcome', () => {
  it('renders a binary score as its outcome', () => {
    const scale = resolveHumanScale({ scaleType: 'binary', scaleMin: 0, scaleMax: 1 });
    expect(formatHumanOutcome(1, scale)).toBe('Pass');
    expect(formatHumanOutcome(0, scale)).toBe('Fail');
  });

  it('renders a numeric score as a number, and an absent one as a dash', () => {
    const scale = resolveHumanScale({ scaleType: 'continuous', scaleMin: 0, scaleMax: 100 });
    expect(formatHumanOutcome(75, scale)).toBe('75');
    expect(formatHumanOutcome(null, scale)).toBe('—');
  });
});

// A run snapshot that lost the scale type still carries the bounds, and those say more about the
// control than the continuous default does.
describe('resolveHumanScale — inferring the control from bounds alone', () => {
  it('reads 0..1 as pass/fail', () => {
    expect(resolveHumanScale({ scaleMin: 0, scaleMax: 1 })).toMatchObject({
      kind: HUMAN_SCALE_KIND.passFail,
    });
  });

  it('reads a short whole range as a rating', () => {
    const scale = resolveHumanScale({ scaleMin: 1, scaleMax: 5 });
    expect(scale.kind).toBe(HUMAN_SCALE_KIND.rating);
    expect(scale.marks.map(m => m.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it('reads a wide range as a score', () => {
    expect(resolveHumanScale({ scaleMin: 1, scaleMax: 100 })).toMatchObject({
      kind: HUMAN_SCALE_KIND.score,
    });
  });

  it('never overrides an explicit scale type', () => {
    expect(resolveHumanScale({ scaleType: 'continuous', scaleMin: 0, scaleMax: 1 })).toMatchObject({
      kind: HUMAN_SCALE_KIND.score,
    });
  });
});
