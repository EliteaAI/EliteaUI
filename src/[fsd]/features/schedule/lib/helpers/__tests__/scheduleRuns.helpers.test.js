import { describe, expect, it } from 'vitest';

import { buildScheduleRowDecorator, toHistoryRows, toWord } from '../scheduleRuns.helpers';

const runs = [
  { id: 1, status: 'success', trigger: 'test', conversation_id: 50, started_at: '2026-10-18T10:00:00Z' },
  {
    id: 2,
    status: 'failed',
    trigger: 'cron',
    reason: 'version_deleted',
    conversation_id: null,
    started_at: '2026-10-18T11:00:00Z',
    finished_at: '2026-10-18T11:00:05Z',
  },
];

describe('EL-7011 R4.2 run rows', () => {
  it('maps only runs without a conversation to rows with status text', () => {
    const rows = toHistoryRows(runs);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'schedule-run:2',
      created_at: '2026-10-18T11:00:00Z',
      event_label: 'Failed, scheduled',
      hasConversation: false,
      duration: 5,
      entry: runs[1],
    });
    expect(rows[0].event_tooltip).toContain('version_deleted');
  });

  it('treats a run without a conversation_id field as a run without a conversation', () => {
    const noField = { ...runs[1], conversation_id: undefined };
    expect(toHistoryRows([noField])).toHaveLength(1);
    expect(buildScheduleRowDecorator([noField])({ id: undefined })).toEqual({ id: undefined });
  });

  it('returns no rows for missing runs', () => {
    expect(toHistoryRows(undefined)).toEqual([]);
  });

  it('decorates a conversation row with the status and trigger of its run', () => {
    const decorate = buildScheduleRowDecorator(runs);
    expect(decorate({ id: 50 })).toMatchObject({ id: 50, event_label: 'Success, test' });
    expect(decorate({ id: 99 })).toEqual({ id: 99 });
  });
});

describe('EL-7011 R4.2 status text', () => {
  it('capitalizes the status, turns every underscore into a space and keeps an empty status empty', () => {
    expect(toWord('not_yet_started')).toBe('Not yet started');
    expect(toWord('')).toBe('');
    expect(toWord(undefined)).toBe('');
  });
});
