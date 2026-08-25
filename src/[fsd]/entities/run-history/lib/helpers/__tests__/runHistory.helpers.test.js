import { describe, expect, it } from 'vitest';

import { compareRunDuration, formatRunTimestamp, resolveRunHistoryColumns } from '../runHistory.helpers';

describe('resolveRunHistoryColumns', () => {
  it('keeps the historical track lists when there is no event column', () => {
    expect(resolveRunHistoryColumns(true, false)).toBe('1.5fr 1.5fr');
    expect(resolveRunHistoryColumns(false, false)).toBe('1.5fr 1.5fr 1fr');
  });

  it('gives the event the wide track and narrows the trailing duration', () => {
    expect(resolveRunHistoryColumns(true, true)).toBe('1.5fr 1.5fr 1fr');
    expect(resolveRunHistoryColumns(false, true)).toBe('1.5fr 1.5fr 1.5fr 1fr');
  });
});

describe('compareRunDuration', () => {
  it('orders known durations shortest first', () => {
    expect(compareRunDuration({ duration: 1 }, { duration: 2 })).toBeLessThan(0);
    expect(compareRunDuration({ duration: 2 }, { duration: 1 })).toBeGreaterThan(0);
  });

  it('keeps a genuine zero among the known durations', () => {
    expect(compareRunDuration({ duration: 0 }, { duration: 1 })).toBeLessThan(0);
  });

  it('sinks an unmeasured run below every measured one', () => {
    expect(compareRunDuration({ duration: null }, { duration: 0 })).toBeGreaterThan(0);
    expect(compareRunDuration({ duration: 0 }, { duration: null })).toBeLessThan(0);
    expect(compareRunDuration({ duration: null }, { duration: null })).toBe(0);
  });
});

describe('formatRunTimestamp', () => {
  it('reads epoch seconds and naive iso strings as the same local time', () => {
    const epoch = new Date(2026, 7, 17, 17, 39).getTime() / 1000;

    expect(formatRunTimestamp(epoch)).toBe('17-08-2026, 05:39 PM');
    expect(formatRunTimestamp('2026-08-17T17:39:00')).toBe('17-08-2026, 05:39 PM');
  });

  it('ignores a trailing Z so a row is not shifted by the viewer offset', () => {
    expect(formatRunTimestamp('2026-08-17T17:39:00Z')).toBe(formatRunTimestamp('2026-08-17T17:39:00'));
  });

  it('has a placeholder for missing and unparsable values', () => {
    expect(formatRunTimestamp(null)).toBe('—');
    expect(formatRunTimestamp('')).toBe('—');
    expect(formatRunTimestamp('nonsense')).toBe('—');
  });
});
