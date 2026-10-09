import { describe, expect, it } from 'vitest';

import {
  COST_ONLY_BUDGET_HINT,
  REPORT_ONLY_BUDGET_HINT,
  areRunLimitsEqual,
  buildRunLimitsMeta,
  getCostOnlyBudgetHint,
  readRunLimits,
  validateRunLimits,
} from '../runLimits.helpers';

const EMPTY = {
  stepsLimit: '',
  perCaseTokens: '',
  perCaseCost: '',
  perRunTokens: '',
  perRunCost: '',
  perRunOnBreach: 'stop',
};

describe('readRunLimits', () => {
  it('reads an untouched suite as all empty', () => {
    expect(readRunLimits({})).toEqual(EMPTY);
    expect(readRunLimits(undefined)).toEqual(EMPTY);
    expect(readRunLimits({ consumption_budget: null, steps_limit: null })).toEqual(EMPTY);
  });

  it('reads every limit as a string', () => {
    expect(
      readRunLimits({
        steps_limit: 12,
        consumption_budget: { per_case: { tokens: 4000 }, per_run: { tokens: 50000, cost: 1.5 } },
      }),
    ).toEqual({
      stepsLimit: '12',
      perCaseTokens: '4000',
      perCaseCost: '',
      perRunTokens: '50000',
      perRunCost: '1.5',
      perRunOnBreach: 'stop',
    });
  });

  it('reads a report-only run token limit', () => {
    expect(
      readRunLimits({ consumption_budget: { per_run: { tokens: 500, on_breach: 'report' } } }).perRunOnBreach,
    ).toBe('report');
  });
});

describe('areRunLimitsEqual', () => {
  it('ignores surrounding whitespace', () => {
    expect(areRunLimitsEqual(EMPTY, { ...EMPTY, stepsLimit: ' ' })).toBe(true);
    expect(areRunLimitsEqual(EMPTY, { ...EMPTY, perRunTokens: '10' })).toBe(false);
    expect(areRunLimitsEqual(EMPTY, { ...EMPTY, perRunOnBreach: 'report' })).toBe(false);
  });
});

describe('validateRunLimits', () => {
  it('accepts empty fields', () => {
    expect(validateRunLimits(EMPTY)).toEqual({});
  });

  it.each(['0', '101', '2.5', 'abc', '-1'])('rejects steps limit %s', value => {
    expect(validateRunLimits({ ...EMPTY, stepsLimit: value })).toHaveProperty('stepsLimit');
  });

  it.each(['1', '100'])('accepts steps limit %s', value => {
    expect(validateRunLimits({ ...EMPTY, stepsLimit: value })).toEqual({});
  });

  it('wants whole token counts and a positive cost', () => {
    expect(validateRunLimits({ ...EMPTY, perRunTokens: '1.5', perCaseCost: '0' })).toEqual({
      perRunTokens: expect.any(String),
      perCaseCost: expect.any(String),
    });
    expect(
      validateRunLimits({ ...EMPTY, perRunTokens: '50000', perCaseCost: '0.25', perRunCost: '.5' }),
    ).toEqual({});
  });
});

describe('buildRunLimitsMeta', () => {
  it('stores "report" only with a run token limit', () => {
    expect(buildRunLimitsMeta({}, { ...EMPTY, perRunTokens: '500', perRunOnBreach: 'report' })).toEqual({
      consumption_budget: { per_run: { tokens: 500, on_breach: 'report' } },
    });
    expect(buildRunLimitsMeta({}, { ...EMPTY, perRunTokens: '500' })).toEqual({
      consumption_budget: { per_run: { tokens: 500 } },
    });
    expect(buildRunLimitsMeta({}, { ...EMPTY, perRunCost: '1', perRunOnBreach: 'report' })).toEqual({
      consumption_budget: { per_run: { cost: 1 } },
    });
  });

  it('keeps the other meta keys', () => {
    expect(buildRunLimitsMeta({ other: 'kept', steps_limit: 3 }, { ...EMPTY, perRunTokens: '1000' })).toEqual(
      {
        other: 'kept',
        consumption_budget: { per_run: { tokens: 1000 } },
      },
    );
  });

  it('writes numbers, not strings', () => {
    expect(
      buildRunLimitsMeta(
        {},
        { stepsLimit: '8', perCaseTokens: '200', perCaseCost: '0.05', perRunTokens: '', perRunCost: '2' },
      ),
    ).toEqual({
      steps_limit: 8,
      consumption_budget: { per_case: { tokens: 200, cost: 0.05 }, per_run: { cost: 2 } },
    });
  });

  it('drops limits that were cleared', () => {
    expect(
      buildRunLimitsMeta({ steps_limit: 5, consumption_budget: { per_run: { tokens: 10 } } }, EMPTY),
    ).toEqual({});
  });

  it('round-trips through readRunLimits', () => {
    const limits = {
      stepsLimit: '8',
      perCaseTokens: '',
      perCaseCost: '0.05',
      perRunTokens: '900',
      perRunCost: '',
      perRunOnBreach: 'report',
    };
    expect(readRunLimits(buildRunLimitsMeta({}, limits))).toEqual(limits);
  });
});

describe('getCostOnlyBudgetHint', () => {
  const limits = overrides => ({ ...readRunLimits(), ...overrides });

  it('says nothing without a cost limit', () => {
    expect(getCostOnlyBudgetHint(limits())).toBeNull();
    expect(getCostOnlyBudgetHint(limits({ perCaseTokens: '500' }))).toBeNull();
  });

  it('warns when only cost limits are set', () => {
    expect(getCostOnlyBudgetHint(limits({ perRunCost: '2' }))).toBe(COST_ONLY_BUDGET_HINT);
    expect(getCostOnlyBudgetHint(limits({ perCaseCost: '0.1', perCaseTokens: '500' }))).toBe(
      COST_ONLY_BUDGET_HINT,
    );
  });

  it('says nothing when a run token limit stops the run', () => {
    expect(getCostOnlyBudgetHint(limits({ perRunCost: '2', perRunTokens: '10000' }))).toBeNull();
  });

  it('warns when the run token limit only reports', () => {
    expect(
      getCostOnlyBudgetHint(limits({ perRunCost: '2', perRunTokens: '10000', perRunOnBreach: 'report' })),
    ).toBe(REPORT_ONLY_BUDGET_HINT);
  });
});
