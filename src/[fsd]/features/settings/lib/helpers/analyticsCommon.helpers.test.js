import { describe, expect, it } from 'vitest';

import { axisTick, fmtCost, fmtDuration, fmtNum } from './analyticsCommon.helpers.js';

describe('fmtNum', () => {
  it('formats null as dash', () => expect(fmtNum(null)).toBe('-'));
  it('formats undefined as dash', () => expect(fmtNum(undefined)).toBe('-'));
  it('formats zero as 0', () => expect(fmtNum(0)).toBe('0'));
  it('formats millions', () => expect(fmtNum(1_500_000)).toBe('1.5M'));
  it('formats thousands', () => expect(fmtNum(2500)).toBe('2.5K'));
  it('formats small numbers', () => expect(fmtNum(42)).toBe('42'));
});

describe('axisTick', () => {
  it('builds a tick style from a stroke color', () =>
    expect(axisTick('#fff')).toEqual({ fill: '#fff', fontSize: 11 }));
  it('accepts a custom font size', () =>
    expect(axisTick('#000', 13)).toEqual({ fill: '#000', fontSize: 13 }));
});

describe('fmtDuration', () => {
  it('formats null as dash', () => expect(fmtDuration(null)).toBe('-'));
  it('formats sub-second', () => expect(fmtDuration(450)).toBe('450ms'));
  it('formats seconds', () => expect(fmtDuration(2400)).toBe('2.4s'));
});

describe('fmtCost', () => {
  it('formats null as dash', () => expect(fmtCost(null)).toBe('-'));
  it('formats zero as $0.00', () => expect(fmtCost(0)).toBe('$0.00'));
  it('formats sub-$0.00001 cost as a bound, not $0.00', () => expect(fmtCost(0.000001)).toBe('< $0.00001'));
  it('formats cost under $0.0001 with 5 decimals', () => expect(fmtCost(0.00004)).toBe('$0.00004'));
  it('formats a stored zero with priced usage as a bound', () => expect(fmtCost(0, true)).toBe('< $0.00001'));
  it('keeps a true zero as $0.00', () => expect(fmtCost(0, false)).toBe('$0.00'));
  it('formats small cost with 4 decimals, rounded up', () => expect(fmtCost(0.0044444)).toBe('$0.0045'));
  it('formats cent-range with 4 decimals', () => expect(fmtCost(0.05)).toBe('$0.0500'));
  it('formats dollar range with 2 decimals', () => expect(fmtCost(1.5)).toBe('$1.50'));
  it('formats thousands with K suffix', () => expect(fmtCost(1500)).toBe('$1.5K'));
  it('formats millions with M suffix', () => expect(fmtCost(1_234_567)).toBe('$1.2M'));
  it('formats negative millions with sign', () => expect(fmtCost(-2_500_000)).toBe('-$2.5M'));
  it('formats NaN as dash', () => expect(fmtCost(NaN)).toBe('-'));
  it('formats Infinity as dash', () => expect(fmtCost(Infinity)).toBe('-'));
  it('formats -Infinity as dash', () => expect(fmtCost(-Infinity)).toBe('-'));
  it('formats negative values with sign', () => expect(fmtCost(-1.5)).toBe('-$1.50'));
  it('formats undefined as dash', () => expect(fmtCost(undefined)).toBe('-'));
});
