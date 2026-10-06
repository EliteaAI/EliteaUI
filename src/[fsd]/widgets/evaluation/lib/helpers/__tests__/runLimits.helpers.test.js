import { describe, expect, it } from 'vitest';

import {
  areRunLimitsEqual,
  buildRunLimitsMeta,
  readRunLimits,
  validateRunLimits,
} from '../runLimits.helpers';

const EMPTY = { stepsLimit: '', perCaseTokens: '', perCaseCost: '', perRunTokens: '', perRunCost: '' };

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
    });
  });
});

describe('areRunLimitsEqual', () => {
  it('ignores surrounding whitespace', () => {
    expect(areRunLimitsEqual(EMPTY, { ...EMPTY, stepsLimit: ' ' })).toBe(true);
    expect(areRunLimitsEqual(EMPTY, { ...EMPTY, perRunTokens: '10' })).toBe(false);
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
    };
    expect(readRunLimits(buildRunLimitsMeta({}, limits))).toEqual(limits);
  });
});
