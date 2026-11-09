import { describe, expect, it } from 'vitest';

import {
  getApprovalRuleLabel,
  getOwnerLabel,
  getRunModeLabel,
  getScheduleStatusLabel,
  isApprovalRuleChanged,
  pairSchedules,
} from '../compareSchedules.helpers';

const schedule = (id, name, extra = {}) => ({
  id,
  name,
  cron: '0 9 * * 1',
  timezone: 'UTC',
  run_mode: 'entry_point',
  enabled: true,
  next_run: '2026-11-10T09:00:00Z',
  owner: { id: 1, name: 'Ann' },
  ...extra,
});

describe('getScheduleStatusLabel', () => {
  it.each([
    [{ enabled: true }, 'Active'],
    [{ enabled: false }, 'Paused'],
    [{ enabled: false, disabled_reason: 'version_deleted' }, 'Paused: version was deleted'],
    [{ enabled: false, disabled_reason: 'owner_lost_access' }, 'Paused: owner lost access'],
    [
      { enabled: false, disabled_reason: 'governance_refused' },
      'Paused: runs were refused by credential governance',
    ],
    [{ enabled: false, disabled_reason: 'something_new' }, 'Paused'],
  ])('labels %j as %s', (row, label) => {
    expect(getScheduleStatusLabel(row)).toBe(label);
  });
});

describe('schedule field labels', () => {
  it('labels the run mode, approval rule and owner', () => {
    expect(getRunModeLabel('prompt')).toBe('Prompt');
    expect(getRunModeLabel(null)).toBe('Entrypoint');
    expect(getApprovalRuleLabel('run_without_asking')).toBe('Run without asking');
    expect(getApprovalRuleLabel(undefined)).toBe('Pause and ask me');
    expect(getOwnerLabel({ id: 5, name: 'Ann' }, 5)).toBe('You');
    expect(getOwnerLabel({ id: 6, name: 'Bob' }, 5)).toBe('Bob');
    expect(getOwnerLabel({ id: 7, name: null }, 5)).toBe('Unknown user');
  });

  it('compares approval rules only when both are known', () => {
    expect(isApprovalRuleChanged('pause_and_ask', 'run_without_asking')).toBe(true);
    expect(isApprovalRuleChanged('pause_and_ask', 'pause_and_ask')).toBe(false);
    expect(isApprovalRuleChanged('pause_and_ask', undefined)).toBe(false);
  });
});

describe('pairSchedules', () => {
  it('pairs by name, trimmed and case-insensitive', () => {
    const pairs = pairSchedules([schedule(1, ' Nightly ')], [schedule(2, 'nightly')]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].left.id).toBe(1);
    expect(pairs[0].right.id).toBe(2);
    expect(pairs[0].changedFields.size).toBe(0);
  });

  it('highlights the fields that differ within a pair', () => {
    const [pair] = pairSchedules(
      [schedule(1, 'Report')],
      [schedule(2, 'Report', { cron: '0 10 * * 1', enabled: false, owner: { id: 2, name: 'Bob' } })],
    );
    expect([...pair.changedFields].sort()).toEqual(['cron', 'next_run', 'owner_id', 'status']);
  });

  it('keeps schedules without a pair on their own side', () => {
    const pairs = pairSchedules([schedule(1, 'Only left')], [schedule(2, 'Only right')]);
    expect(pairs.map(pair => [pair.left?.id ?? null, pair.right?.id ?? null])).toEqual([
      [1, null],
      [null, 2],
    ]);
  });

  it('pairs repeated names in order of creation and leaves extras unpaired', () => {
    const pairs = pairSchedules(
      [schedule(30, 'Daily'), schedule(10, 'Daily'), schedule(20, 'Daily')],
      [schedule(5, 'Daily')],
    );
    expect(pairs.map(pair => [pair.left?.id, pair.right?.id ?? null])).toEqual([
      [10, 5],
      [20, null],
      [30, null],
    ]);
  });

  it('orders rows by name', () => {
    const pairs = pairSchedules([schedule(1, 'b'), schedule(2, 'A')], [schedule(3, 'c')]);
    expect(pairs.map(pair => (pair.left ?? pair.right).name)).toEqual(['A', 'b', 'c']);
  });
});
