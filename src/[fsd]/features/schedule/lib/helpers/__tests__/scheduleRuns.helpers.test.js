import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  findNewestTestRun,
  formatRunStarted,
  toRunStatusLabel,
  toRunTriggerLabel,
  toWord,
} from '../scheduleRuns.helpers';

// EL-7011 US-32 R4, owner CR 2026-10-21: the cells of the Runs table and the run the Test schedule tab shows

describe('EL-7011 R4.2 status text', () => {
  it('capitalizes the status, turns every underscore into a space and keeps an empty status empty', () => {
    expect(toWord('not_yet_started')).toBe('Not yet started');
    expect(toWord('')).toBe('');
    expect(toWord(undefined)).toBe('');
  });

  it('names every run status the owner listed', () => {
    expect(
      [
        'running',
        'success',
        'waiting_for_approval',
        'expired',
        'failed',
        'blocked',
        'cancelled',
        'skipped',
      ].map(status => toRunStatusLabel(status)),
    ).toEqual([
      'Running',
      'Success',
      'Waiting for input',
      'Expired',
      'Failed',
      'Blocked',
      'Cancelled',
      'Skipped',
    ]);
    expect(toRunStatusLabel('waiting_for_input')).toBe('Waiting for input');
    expect(toRunStatusLabel('not_known')).toBe('Not known');
  });
});

describe('EL-7011 R4.1 trigger and start time', () => {
  it('names the three run triggers', () => {
    expect(['test', 'cron', 'manual'].map(toRunTriggerLabel)).toEqual(['Test', 'Scheduled', 'Run now']);
    expect(toRunTriggerLabel(undefined)).toBe('');
  });

  it('shows the start as day, month and 24-hour time', () => {
    const started = '2026-10-14T12:05:00Z';
    expect(formatRunStarted(started)).toBe(format(new Date(started), 'd MMM, HH:mm'));
    expect(formatRunStarted(null)).toBe('—');
  });
});

describe('EL-7011 R3 newest test run', () => {
  const runs = [
    { id: 1, trigger: 'test', started_at: '2026-10-14T10:00:00Z' },
    { id: 2, trigger: 'cron', started_at: '2026-10-14T13:00:00Z' },
    { id: 3, trigger: 'test', started_at: '2026-10-14T12:00:00Z' },
  ];

  it('picks the latest run with the test trigger, whatever the list order', () => {
    expect(findNewestTestRun(runs)?.id).toBe(3);
    expect(findNewestTestRun([...runs].reverse())?.id).toBe(3);
  });

  it('returns nothing without a test run', () => {
    expect(findNewestTestRun([runs[1]])).toBeUndefined();
    expect(findNewestTestRun(undefined)).toBeUndefined();
  });
});
