import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  findNewestTestRun,
  formatExpiresIn,
  formatRunDuration,
  formatRunStarted,
  formatRunSummary,
  isRunActive,
  toLogLevel,
  toPlainText,
  toRunStatusLabel,
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
      ].map(toRunStatusLabel),
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

describe('EL-7011 R4.1 start time', () => {
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

// Owner CR 2026-10-21 test panel log: the log, the result card and the Runs table Duration column
describe('EL-7011 owner CR 2026-10-21 test panel values', () => {
  it('treats running and waiting_for_approval as active and every other status as final', () => {
    expect(['running', 'waiting_for_approval'].every(isRunActive)).toBe(true);
    expect(['success', 'failed', 'expired', 'blocked', 'skipped', undefined].some(isRunActive)).toBe(false);
  });

  it('writes a duration in seconds, or minutes and two-digit seconds, and a dash without one', () => {
    expect(formatRunDuration(38_000)).toBe('38 s');
    expect(formatRunDuration(65_400)).toBe('1 m 05 s');
    expect(formatRunDuration(0)).toBe('0 s');
    expect(formatRunDuration(null)).toBe('–');
  });

  it('joins duration, tokens and cost of the run summary', () => {
    expect(formatRunSummary({ duration_ms: 38_000, tokens: 2140, cost_usd: 0.031 })).toBe(
      '38 s · 2,140 tokens · $0.0310',
    );
    // a small run does not read as $0.00 (CR-12 D4)
    expect(formatRunSummary({ duration_ms: 4000, tokens: 357, cost_usd: 0.001205 })).toBe(
      '4 s · 357 tokens · $0.0012',
    );
    // CR-12 r2 D2: the recorded run 98 reads $0.0016, not $0.00 and not the rounded-up $0.0017
    expect(formatRunSummary({ duration_ms: 5139, tokens: 447, cost_usd: 0.00161 })).toBe(
      '5 s · 447 tokens · $0.0016',
    );
    expect(formatRunSummary({ cost_usd: 0 })).toBe('$0.00');
    expect(formatRunSummary({ duration_ms: 1000 })).toBe('1 s');
    expect(formatRunSummary(undefined)).toBe('');
  });

  it('takes the level of the server and falls back by event kind', () => {
    expect(toLogLevel({ kind: 'tool_call', level: 'error' })).toBe('error');
    expect(toLogLevel({ kind: 'risk_check' })).toBe('warning');
    expect(toLogLevel({ kind: 'paused' })).toBe('warning');
    expect(toLogLevel({ kind: 'finished' })).toBe('success');
    expect(toLogLevel({ kind: 'started' })).toBe('info');
  });

  it('strips markdown marks so the answer reads as plain text', () => {
    expect(toPlainText('## Open PRs\n1. **EliteaUI** [#482](https://x/482) `form`\n> note')).toBe(
      'Open PRs\n1. EliteaUI #482 form\nnote',
    );
    expect(toPlainText(undefined)).toBe('');
  });

  // CR-21 live check: a blank line after the first sentence filled the second line of the 2-line preview
  it('keeps no blank line, so each preview line shows text', () => {
    expect(toPlainText('I am the **Digest**.\n\nI can summarise it.\n \n\nPaste the data.')).toBe(
      'I am the Digest.\nI can summarise it.\nPaste the data.',
    );
  });

  it('counts the 24 hour approval window down from the pause', () => {
    const pausedAt = '2026-10-21T10:42:19Z';
    expect(formatExpiresIn(pausedAt, Date.parse('2026-10-21T10:44:00Z'))).toBe('Expires in 23 h 58 min');
    expect(formatExpiresIn(pausedAt, Date.parse('2026-10-22T10:00:00Z'))).toBe('Expires in 0 h 42 min');
    expect(formatExpiresIn(pausedAt, Date.parse('2026-10-23T00:00:00Z'))).toBe('Expired');
    expect(formatExpiresIn(undefined, 0)).toBe('');
  });
});
