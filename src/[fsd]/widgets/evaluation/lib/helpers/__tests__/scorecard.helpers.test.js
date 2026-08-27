import { describe, expect, it } from 'vitest';

import { buildScorecard, coveredCaseIdsFromPage, getTargetKey, normalizeScore } from '../scorecard.helpers';

// A run snapshot with one case and one Code-engine dimension binding (engine 'code').
const makeRun = () => ({
  status: 'finished',
  headline_score: null,
  snapshot: {
    cases: [{ id: 12, order_index: 0 }],
    bindings: [{ dimension_id: 4, engine: 'code', weight: 1, order_index: 0 }],
    dimensions: {
      4: { name: 'CodeVal1', scale_type: 'binary', scale_min: 0, scale_max: 1, polarity: 'higher_better' },
    },
  },
});

describe('getTargetKey', () => {
  it('derives a stable key from whichever reference column is set', () => {
    expect(getTargetKey({ dimension_id: 7 })).toBe('dim:7');
    expect(getTargetKey({ platform_key: 'pii' })).toBe('platform:pii');
    expect(getTargetKey(null)).toBeNull();
  });
});

describe('buildScorecard — code-engine dimension results', () => {
  it('joins a code result to its binding cell by dimension_id', () => {
    const card = buildScorecard({
      run: makeRun(),
      results: [
        {
          dataset_case_id: 12,
          dimension_id: 4,
          engine: 'code',
          status: 'ok',
          native_score: 1,
          normalized_score: 1,
        },
      ],
    });
    const cell = card.cases[0].cells[0];
    expect(cell.result).not.toBeNull();
    expect(cell.nativeScore).toBe(1);
    expect(card.counts.errors).toBe(0);
    expect(card.headline).toBe(1);
  });

  it('flags an errored code result (status "error") instead of silently blank', () => {
    const card = buildScorecard({
      run: makeRun(),
      results: [
        {
          dataset_case_id: 12,
          dimension_id: 4,
          engine: 'code',
          status: 'error',
          native_score: null,
          evidence: { passed: null, status: 'error', stderr: "NameError: name 'json' is not defined" },
        },
      ],
    });
    expect(card.cases[0].hasError).toBe(true);
    expect(card.counts.errors).toBe(1);
    expect(card.counts.metAll).toBe(0);
    // The errored row still joins (it has dimension_id), so the cell is present.
    expect(card.cases[0].cells[0].result).not.toBeNull();
  });
});

// Mirrors tests/unit/utils/test_evaluation_scoring.py — this helper is a fallback whose output is
// summed together with server-provided normalized_score values, so it has to agree with the
// server on scale, range and rounding or it silently skews the provisional headline.
describe('normalizeScore — parity with the server normalizer', () => {
  it('returns null for an absent or non-numeric native score', () => {
    expect(normalizeScore(null, { scaleType: 'continuous' })).toBeNull();
    expect(normalizeScore('abc', { scaleType: 'continuous' })).toBeNull();
    expect(normalizeScore(Number.NaN, { scaleType: 'continuous' })).toBeNull();
  });

  it('maps onto 0..100, not 0..1', () => {
    expect(normalizeScore(78, { scaleType: 'continuous', scaleMin: 0, scaleMax: 100 })).toBe(78);
    expect(normalizeScore(15, { scaleType: 'continuous', scaleMin: 10, scaleMax: 20 })).toBe(50);
  });

  it('scores binary on truthiness', () => {
    expect(normalizeScore(true, { scaleType: 'binary' })).toBe(100);
    expect(normalizeScore(0, { scaleType: 'binary' })).toBe(0);
  });

  it('honours the authored ordinal min instead of assuming 1', () => {
    expect(normalizeScore(4, { scaleType: 'ordinal', scaleMin: 1, scaleMax: 5 })).toBe(75);
    expect(normalizeScore(2, { scaleType: 'ordinal', scaleMin: 0, scaleMax: 4 })).toBe(50);
    expect(normalizeScore(4, { scaleType: 'ordinal', scaleMin: 2, scaleMax: 6 })).toBe(50);
  });

  it('clamps before flipping polarity', () => {
    expect(normalizeScore(120, { scaleType: 'continuous', scaleMin: 0, scaleMax: 100 })).toBe(100);
    expect(
      normalizeScore(12, { scaleType: 'continuous', scaleMin: 0, scaleMax: 100, polarity: 'lower_better' }),
    ).toBe(88);
  });

  it('reproduces the canonical 86.5 worked example', () => {
    const items = [
      [normalizeScore(78, { scaleType: 'continuous', scaleMin: 0, scaleMax: 100 }), 2],
      [normalizeScore(4, { scaleType: 'ordinal', scaleMin: 1, scaleMax: 5 }), 1],
      [normalizeScore(true, { scaleType: 'binary' }), 1],
      [
        normalizeScore(12, { scaleType: 'continuous', scaleMin: 0, scaleMax: 100, polarity: 'lower_better' }),
        1,
      ],
      [normalizeScore(true, { scaleType: 'binary' }), 1],
    ];
    expect(items.map(([value]) => value)).toEqual([78, 75, 100, 88, 100]);
    const weighted = items.reduce((sum, [value, weight]) => sum + value * weight, 0);
    const total = items.reduce((sum, [, weight]) => sum + weight, 0);
    expect(weighted / total).toBe(86.5);
  });
});

describe('coveredCaseIdsFromPage', () => {
  const page = rows => rows.map(id => ({ dataset_case_id: id }));

  it('reports no restriction when the page covers the whole run', () => {
    expect(coveredCaseIdsFromPage({ results: page([1, 2]), total: 2, offset: 0 })).toBeNull();
  });

  it('reports no restriction for a human-only run, which has zero results by design', () => {
    // Filtering on "has a result row" here would hide every case.
    expect(coveredCaseIdsFromPage({ results: [], total: 0, offset: 0 })).toBeNull();
  });

  it('drops the trailing case, which the page may have cut mid-way', () => {
    expect(coveredCaseIdsFromPage({ results: page([1, 1, 2, 3]), total: 9, offset: 0 })).toEqual(['1', '2']);
  });

  it('keeps a lone case rather than reporting an empty scorecard', () => {
    expect(coveredCaseIdsFromPage({ results: page([1, 1]), total: 9, offset: 0 })).toEqual(['1']);
  });

  it('accounts for the offset when deciding whether the read is complete', () => {
    expect(coveredCaseIdsFromPage({ results: page([5, 6]), total: 4, offset: 2 })).toBeNull();
  });
});

describe('buildScorecard — truncated result page', () => {
  const twoCaseRun = () => ({
    status: 'finished',
    snapshot: {
      cases: [
        { id: 12, order_index: 0 },
        { id: 13, order_index: 1 },
      ],
      bindings: [{ dimension_id: 4, engine: 'code', weight: 1, order_index: 0 }],
      dimensions: {
        4: {
          name: 'CodeVal1',
          scale_type: 'binary',
          scale_min: 0,
          scale_max: 1,
          polarity: 'higher_better',
        },
      },
    },
  });

  const result = caseId => ({
    dataset_case_id: caseId,
    dimension_id: 4,
    engine: 'code',
    status: 'ok',
    native_score: 1,
    normalized_score: 1,
  });

  it('renders only the covered case instead of a blank cell for the uncovered one', () => {
    const card = buildScorecard({
      run: twoCaseRun(),
      results: [result(12)],
      caseIds: ['12'],
    });
    expect(card.cases.map(c => c.id)).toEqual([12]);
    expect(card.counts.total).toBe(1);
  });

  it('renders every snapshot case when no restriction is given', () => {
    const card = buildScorecard({ run: twoCaseRun(), results: [result(12), result(13)] });
    expect(card.cases.map(c => c.id)).toEqual([12, 13]);
  });
});
