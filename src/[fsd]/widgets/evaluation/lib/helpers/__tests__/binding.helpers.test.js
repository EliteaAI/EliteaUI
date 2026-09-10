import { describe, expect, it } from 'vitest';

import { EVAL_SCALE_TYPE } from '../../constants';
import { getTargetLabel } from '../binding.helpers';

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
