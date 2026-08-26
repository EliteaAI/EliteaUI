import { describe, expect, it } from 'vitest';

import {
  byNewestRunFirst,
  compareRunDuration,
  compareRunTimestamp,
  formatRunTimestamp,
  parseRunTimestamp,
  resolveRunHistoryColumns,
} from '../runHistory.helpers';

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
  it('renders epoch seconds in the viewer timezone', () => {
    const epoch = new Date(2026, 7, 17, 17, 39).getTime() / 1000;

    expect(formatRunTimestamp(epoch)).toBe('17-08-2026, 05:39 PM');
  });

  it('reads every timestamp shape the run history serves as the same instant', () => {
    const expected = formatRunTimestamp(Date.UTC(2026, 7, 17, 17, 39) / 1000);

    expect(formatRunTimestamp('2026-08-17T17:39:00+00:00Z')).toBe(expected);
    expect(formatRunTimestamp('2026-08-17T17:39:00Z')).toBe(expected);
    expect(formatRunTimestamp('2026-08-17T17:39:00')).toBe(expected);
  });

  it('has a placeholder for missing and unparsable values', () => {
    expect(formatRunTimestamp(null)).toBe('—');
    expect(formatRunTimestamp('')).toBe('—');
    expect(formatRunTimestamp('nonsense')).toBe('—');
  });
});

describe('parseRunTimestamp', () => {
  const INSTANT = Date.UTC(2026, 7, 17, 17, 39);

  it('reads a conversation timestamp, which carries an offset and a trailing Z', () => {
    expect(parseRunTimestamp('2026-08-17T17:39:00+00:00Z')).toBe(INSTANT);
  });

  it('reads an index run timestamp, which is a plain UTC iso string', () => {
    expect(parseRunTimestamp('2026-08-17T17:39:00.000Z')).toBe(INSTANT);
  });

  it('reads a zoneless timestamp as UTC, the only basis this api emits', () => {
    expect(parseRunTimestamp('2026-08-17T17:39:00')).toBe(INSTANT);
  });

  it('reads epoch seconds', () => {
    expect(parseRunTimestamp(INSTANT / 1000)).toBe(INSTANT);
  });
});

describe('compareRunTimestamp', () => {
  it('orders a conversation row against an index run row on one clock', () => {
    const earlierIndexRun = '2026-08-17T17:39:00.000Z';
    const laterConversation = '2026-08-17T18:39:00+00:00Z';

    expect(compareRunTimestamp(earlierIndexRun, laterConversation)).toBeLessThan(0);
    expect(compareRunTimestamp(laterConversation, earlierIndexRun)).toBeGreaterThan(0);
  });

  it('does not collapse to zero on the offset-and-Z shape', () => {
    expect(compareRunTimestamp('2026-08-17T17:39:00+00:00Z', '2026-08-17T18:39:00+00:00Z')).toBeLessThan(0);
  });

  it('leaves an unreadable timestamp where it is, in either direction', () => {
    expect(compareRunTimestamp('nonsense', '2026-08-17T17:39:00Z')).toBe(0);
    expect(compareRunTimestamp('2026-08-17T17:39:00Z', 'nonsense')).toBe(0);
    expect(compareRunTimestamp('nonsense', null)).toBe(0);
  });
});

describe('byNewestRunFirst', () => {
  const row = created_at => ({ created_at });

  it('puts the newest run first whichever shape the timestamps arrive in', () => {
    const rows = [
      row('2026-08-17T17:39:00.000Z'),
      row('2026-08-17T19:39:00+00:00Z'),
      row('2026-08-17T18:39:00'),
    ];

    expect([...rows].sort(byNewestRunFirst).map(r => r.created_at)).toEqual([
      '2026-08-17T19:39:00+00:00Z',
      '2026-08-17T18:39:00',
      '2026-08-17T17:39:00.000Z',
    ]);
  });

  it('keeps an unreadable run out of the default selection', () => {
    const rows = [row('nonsense'), row('2026-08-17T17:39:00Z'), row('2026-08-17T19:39:00Z')];

    expect([...rows].sort(byNewestRunFirst).map(r => r.created_at)).toEqual([
      '2026-08-17T19:39:00Z',
      '2026-08-17T17:39:00Z',
      'nonsense',
    ]);
  });
});
