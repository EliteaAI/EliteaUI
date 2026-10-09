import { describe, expect, it } from 'vitest';

import { EVAL_ENGINE, EVAL_SCALE_TYPE, IMPORTANCE } from '../../constants';
import {
  getBindingEngineTooltip,
  getTargetLabel,
  importanceFormToWeight,
  weightToImportanceForm,
} from '../binding.helpers';

// A target of exactly 0/1 with '==' is only pass/fail semantics on a binary scale — on a rating
// or custom scale it is a legitimate numeric value and must render as a plain number, not "pass".
describe('getTargetLabel', () => {
  it('renders a binary target of 1 as "= pass"', () => {
    expect(getTargetLabel(1, '==', EVAL_SCALE_TYPE.binary)).toBe('= pass');
  });

  it('renders a binary target of 0 as "= fail"', () => {
    expect(getTargetLabel(0, '==', EVAL_SCALE_TYPE.binary)).toBe('= fail');
  });

  it('renders a non-binary target of 1 as a plain number', () => {
    expect(getTargetLabel(1, '==', EVAL_SCALE_TYPE.ordinal)).toBe('==1');
  });

  it('renders a non-binary target of 0 as a plain number', () => {
    expect(getTargetLabel(0, '==', EVAL_SCALE_TYPE.continuous)).toBe('==0');
  });

  it('renders a non-binary target of 1 as a plain number when scale type is unknown', () => {
    expect(getTargetLabel(1, '==', undefined)).toBe('==1');
  });

  it('renders a >= target with the unicode operator regardless of scale', () => {
    expect(getTargetLabel(4, '>=', EVAL_SCALE_TYPE.ordinal)).toBe('≥4');
  });

  it('returns null when there is no target', () => {
    expect(getTargetLabel(null, '==', EVAL_SCALE_TYPE.binary)).toBeNull();
  });

  it('returns null when there is no operator', () => {
    expect(getTargetLabel(1, null, EVAL_SCALE_TYPE.binary)).toBeNull();
  });
});

describe('getBindingEngineTooltip', () => {
  it('uses the dimension engine for dimension bindings', () => {
    expect(getBindingEngineTooltip({ dimension_id: 1, engine: EVAL_ENGINE.human })).toBe(
      'This dimension requires manual review.',
    );
  });

  it('treats platform validations as code regardless of stored engine', () => {
    expect(getBindingEngineTooltip({ platform_key: 'json', engine: EVAL_ENGINE.ai })).toBe(
      'This dimension is evaluated using Python validation logic.',
    );
  });
});

describe('weightToImportanceForm', () => {
  it('maps a preset weight to its importance', () => {
    expect(weightToImportanceForm(3)).toEqual({ importance: IMPORTANCE.high, customImportanceValue: '' });
  });

  it('maps an off-preset weight, including 0, to custom', () => {
    expect(weightToImportanceForm(0)).toEqual({ importance: IMPORTANCE.custom, customImportanceValue: '0' });
    expect(weightToImportanceForm(2.5)).toEqual({
      importance: IMPORTANCE.custom,
      customImportanceValue: '2.5',
    });
  });

  it('falls back to medium when there is no weight', () => {
    expect(weightToImportanceForm(null).importance).toBe(IMPORTANCE.medium);
  });
});

describe('importanceFormToWeight', () => {
  it('maps a preset importance to its weight', () => {
    expect(importanceFormToWeight(IMPORTANCE.critical, '')).toBe(4);
  });

  it('accepts a custom value of zero or more', () => {
    expect(importanceFormToWeight(IMPORTANCE.custom, '0')).toBe(0);
    expect(importanceFormToWeight(IMPORTANCE.custom, '1.5')).toBe(1.5);
  });

  it('rejects an empty, non-numeric or negative custom value', () => {
    expect(importanceFormToWeight(IMPORTANCE.custom, '')).toBeNull();
    expect(importanceFormToWeight(IMPORTANCE.custom, 'abc')).toBeNull();
    expect(importanceFormToWeight(IMPORTANCE.custom, '-1')).toBeNull();
  });
});
