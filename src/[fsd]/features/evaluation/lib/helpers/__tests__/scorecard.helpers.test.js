import { describe, expect, it } from 'vitest';

import { buildScorecard, getTargetKey } from '../scorecard.helpers';

// A run snapshot with one case and one code-validation binding (engine 'code').
const makeRun = () => ({
  status: 'finished',
  headline_score: null,
  snapshot: {
    cases: [{ id: 12, order_index: 0 }],
    bindings: [{ code_validation_id: 4, engine: 'code', weight: 1, order_index: 0 }],
    code_validations: {
      4: { name: 'CodeVal1', scale_type: 'binary', scale_min: 0, scale_max: 1, polarity: 'higher_better' },
    },
  },
});

describe('getTargetKey', () => {
  it('derives a stable key from whichever reference column is set', () => {
    expect(getTargetKey({ dimension_id: 7 })).toBe('dim:7');
    expect(getTargetKey({ code_validation_id: 4 })).toBe('code:4');
    expect(getTargetKey({ platform_key: 'pii' })).toBe('platform:pii');
    expect(getTargetKey(null)).toBeNull();
  });
});

describe('buildScorecard — code validation results', () => {
  it('joins a code result to its binding cell by code_validation_id', () => {
    const card = buildScorecard({
      run: makeRun(),
      results: [
        {
          dataset_case_id: 12,
          code_validation_id: 4,
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
          code_validation_id: 4,
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
    // The errored row still joins (it has code_validation_id), so the cell is present.
    expect(card.cases[0].cells[0].result).not.toBeNull();
  });
});
