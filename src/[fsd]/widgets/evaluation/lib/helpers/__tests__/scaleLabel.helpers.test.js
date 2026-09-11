import { describe, expect, it } from 'vitest';

import { getScaleTypeLabel, resolveScalePreset } from '../scaleLabel.helpers';

describe('getScaleTypeLabel', () => {
  it('names each stored scale the way the Dimension modal names it', () => {
    expect(getScaleTypeLabel({ scaleType: 'continuous', scaleMin: 1, scaleMax: 100 })).toBe('Score (1-100)');
    expect(getScaleTypeLabel({ scaleType: 'ordinal', scaleMin: 1, scaleMax: 5 })).toBe('Rating (1-5)');
    expect(getScaleTypeLabel({ scaleType: 'binary', scaleMin: 0, scaleMax: 1 })).toBe('Pass/Fail');
  });

  it('reads a range the presets cannot express as Custom', () => {
    expect(getScaleTypeLabel({ scaleType: 'continuous', scaleMin: 0, scaleMax: 50 })).toBe('Custom');
    expect(getScaleTypeLabel({ scaleType: 'ordinal', scaleMin: 1, scaleMax: 7 })).toBe('Custom');
  });

  it('appends the range to a Custom scale only when asked', () => {
    const binding = { scaleType: 'continuous', scaleMin: 0, scaleMax: 50 };
    expect(getScaleTypeLabel(binding, { withBounds: true })).toBe('Custom (0–50)');
    expect(getScaleTypeLabel({ scaleType: 'binary' }, { withBounds: true })).toBe('Pass/Fail');
  });

  it('falls back to the preset for the type when the bounds never reached the client', () => {
    expect(getScaleTypeLabel({ scaleType: 'continuous' })).toBe('Score (1-100)');
    expect(getScaleTypeLabel({ scaleType: 'ordinal' })).toBe('Rating (1-5)');
  });

  it('never shows the stored value for a scale type it does not know', () => {
    expect(getScaleTypeLabel({ scaleType: 'custom' })).toBe('Custom');
  });

  it('returns null for a binding with no scale, leaving the placeholder to the caller', () => {
    expect(getScaleTypeLabel({ scaleMin: 1, scaleMax: 5 })).toBeNull();
    expect(getScaleTypeLabel(null)).toBeNull();
    expect(getScaleTypeLabel(undefined)).toBeNull();
  });
});

describe('resolveScalePreset', () => {
  it('leaves a non-binary scale unclassified when its bounds are missing', () => {
    expect(resolveScalePreset({ scaleType: 'continuous' }).preset).toBeNull();
    expect(resolveScalePreset({ scaleType: 'binary' }).preset).toBe('pass_fail');
  });

  it('coerces string bounds so a serialized dimension still classifies', () => {
    expect(resolveScalePreset({ scaleType: 'ordinal', scaleMin: '1', scaleMax: '5' }).preset).toBe('rating');
  });
});
