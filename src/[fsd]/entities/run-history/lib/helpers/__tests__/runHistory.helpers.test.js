import { describe, expect, it } from 'vitest';

import {
  RUN_ANALYTICS_TIMESTAMP_FORMAT,
  SCHEDULE_RUN_COLUMNS,
  byNewestRunFirst,
  compareRunDuration,
  compareRunTimestamp,
  formatRunTimestamp,
  hasRunAnalytics,
  parseRunTimestamp,
  resolveRunHistoryColumns,
  toExecutionTypeRow,
  toRunISOString,
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

  it('accepts a custom pattern, as the run analytics header uses', () => {
    const epoch = new Date(2026, 8, 2, 12, 23).getTime() / 1000;

    expect(formatRunTimestamp(epoch, RUN_ANALYTICS_TIMESTAMP_FORMAT)).toBe('02 Sep 2026, 12:23 PM');
  });
});

describe('toRunISOString', () => {
  it('normalises a conversation timestamp to an ISO string', () => {
    expect(toRunISOString('2026-08-17T17:39:00+00:00Z')).toBe('2026-08-17T17:39:00.000Z');
  });

  it('returns undefined for missing or unparsable values', () => {
    expect(toRunISOString(null)).toBeUndefined();
    expect(toRunISOString('nonsense')).toBeUndefined();
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

describe('hasRunAnalytics', () => {
  it('offers analytics from 30 Sep 2026 (UTC) on', () => {
    expect(hasRunAnalytics({ created_at: '2026-09-30T00:00:00Z' })).toBe(true);
    expect(hasRunAnalytics({ created_at: '2026-09-29T23:59:59Z' })).toBe(false);
  });

  it('prefers updated_at, so a restored and re-run chat qualifies', () => {
    expect(hasRunAnalytics({ created_at: '2026-09-06T16:35:00Z', updated_at: '2026-09-30T09:00:00Z' })).toBe(
      true,
    );
    expect(hasRunAnalytics({ created_at: '2026-09-30T09:00:00Z', updated_at: '2026-09-29T09:00:00Z' })).toBe(
      false,
    );
  });

  it('hides analytics when the run has no readable timestamp', () => {
    expect(hasRunAnalytics({})).toBe(false);
    expect(hasRunAnalytics({ created_at: 'nonsense' })).toBe(false);
    expect(hasRunAnalytics(undefined)).toBe(false);
  });
});

describe('toExecutionTypeRow (EL-7011 US-38)', () => {
  it('R1.3, US-38 R1.4 (BUG-12): labels an older manual run "Manual (legacy)"', () => {
    expect(toExecutionTypeRow({ id: 1, execution_type: 'manual' })).toEqual({
      id: 1,
      execution_type: 'manual',
      event_label: 'Manual (legacy)',
    });
  });

  it.each([
    ['schedule_manual', 'Run now'],
    ['chat', 'Chat'],
    ['api', 'API'],
    ['mcp', 'MCP'],
    ['webhook', 'Webhook'],
  ])('BUG-12: labels the %s trigger source "%s"', (type, label) => {
    expect(toExecutionTypeRow({ execution_type: type }).event_label).toBe(label);
  });

  it('R1.4: labels a scheduled run "Scheduled"', () => {
    expect(toExecutionTypeRow({ execution_type: 'scheduled' }).event_label).toBe('Scheduled');
  });

  it('R2.3: shows "-" for a missing or unknown execution_type and keeps the row fields', () => {
    expect(toExecutionTypeRow({ id: 2 })).toEqual({ id: 2, event_label: '-' });
    expect(toExecutionTypeRow({ execution_type: 'bogus' }).event_label).toBe('-');
    expect(toExecutionTypeRow({ execution_type: null }).event_label).toBe('-');
  });
});

describe('CR-22 schedule runs in Agent and Pipeline Run History (EL-7011 US-38)', () => {
  it('CR-22 R3.4 a test-trigger schedule run reads Test, also in the Execution type column', () => {
    const row = { id: 9, execution_type: 'schedule_manual', schedule_run: { trigger: 'test' } };
    expect(toExecutionTypeRow(row).event_label).toBe('Test');
    expect(toExecutionTypeRow({ ...row, schedule_run: { trigger: 'manual' } }).event_label).toBe('Run now');
  });

  it('CR-22 R3.1-R3.3 the Schedule and Status cells read the run record, or "-" without one', () => {
    const [schedule, status] = SCHEDULE_RUN_COLUMNS;
    const run = { schedule_run: { schedule_name: 'Daily digest', status: 'waiting_for_approval' } };
    expect([schedule.label, status.label]).toEqual(['Schedule', 'Status']);
    expect([schedule.render(run), status.render(run)]).toEqual(['Daily digest', 'Waiting for input']);
    expect([schedule.render({ schedule_run: null }), status.render({})]).toEqual(['-', '-']);
  });

  it('CR-22 D7 extra columns use fixed rem widths after Date; without them the tracks stay fractional', () => {
    // CR-22 review r4: Version fits its header label, and Duration takes the free space up to the 48 rem list
    expect(resolveRunHistoryColumns(false, true, SCHEDULE_RUN_COLUMNS)).toBe(
      '7.5rem 9rem 7rem 8rem 6.5rem minmax(6.5rem, 1fr)',
    );
    expect(resolveRunHistoryColumns(true, true, SCHEDULE_RUN_COLUMNS)).toBe(
      '7.5rem 9rem 7rem 8rem minmax(6.5rem, 1fr)',
    );
    expect(resolveRunHistoryColumns(false, true)).toBe('1.5fr 1.5fr 1.5fr 1fr');
  });
});
