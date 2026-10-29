import { describe, expect, it } from 'vitest';

import {
  formatApproxCost,
  formatTokens,
  formatWindowSize,
  getWindowModeTokens,
} from '../contextBudget.helpers';

describe('formatApproxCost', () => {
  it('returns untracked placeholder without usage', () => {
    expect(formatApproxCost(null)).toEqual({ text: '—', partial: false, tracked: false });
  });

  it('returns placeholder for null cost and flags unpriced models', () => {
    expect(formatApproxCost({ cost: null, unpriced_models: ['m'] })).toEqual({
      text: '—',
      partial: true,
      tracked: true,
    });
  });

  it('returns placeholder for a non-numeric cost instead of NaN', () => {
    expect(formatApproxCost({ cost: 'abc' })).toEqual({ text: '—', partial: false, tracked: true });
  });

  it('formats zero cost', () => {
    expect(formatApproxCost({ cost: 0 }).text).toBe('≈ $0.0000');
  });

  it('uses 4 decimals below $1', () => {
    expect(formatApproxCost({ cost: 0.09912 }).text).toBe('≈ $0.0991');
  });

  it('uses 2 decimals from $1', () => {
    expect(formatApproxCost({ cost: '1.234' }).text).toBe('≈ $1.23');
  });

  it('appends + when some models are unpriced', () => {
    expect(formatApproxCost({ cost: 1.5, unpriced_models: ['m'] })).toEqual({
      text: '≈ $1.50+',
      partial: true,
      tracked: true,
    });
  });
});

describe('formatTokens', () => {
  it('returns placeholder for null and undefined', () => {
    expect(formatTokens(null)).toBe('—');
    expect(formatTokens(undefined)).toBe('—');
  });

  it('keeps zero as a value', () => {
    expect(formatTokens(0)).toBe('0');
  });

  it('formats large numbers', () => {
    expect(formatTokens(272000).replace(/\s/g, ' ')).toBe('272 000');
  });
});

describe('formatWindowSize', () => {
  it('formats thousands as K', () => {
    expect(formatWindowSize(272000)).toBe('272K');
    expect(formatWindowSize(128000)).toBe('128K');
  });

  it('formats millions as M with one decimal at most', () => {
    expect(formatWindowSize(1000000)).toBe('1M');
    expect(formatWindowSize(1048576)).toBe('1M');
    expect(formatWindowSize(1500000)).toBe('1.5M');
  });

  it('returns an empty string for an unknown size', () => {
    expect(formatWindowSize(0)).toBe('');
    expect(formatWindowSize(undefined)).toBe('');
    expect(formatWindowSize(-5)).toBe('');
  });
});

describe('getWindowModeTokens', () => {
  it('caps Balanced and keeps the whole window for Full', () => {
    expect(getWindowModeTokens(400000, 272000)).toEqual({ balanced: 272000, full: 400000 });
  });

  it('gives both modes the same size when the model window is below the cap', () => {
    expect(getWindowModeTokens(128000, 272000)).toEqual({ balanced: 128000, full: 128000 });
  });

  it('returns zeros when the model window is unknown', () => {
    expect(getWindowModeTokens(undefined, 272000)).toEqual({ balanced: 0, full: 0 });
  });
});
