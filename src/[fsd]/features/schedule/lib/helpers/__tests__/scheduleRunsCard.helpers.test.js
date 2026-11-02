// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  ALL_FILTER,
  describeRunFacts,
  filterRuns,
  mergeRuns,
  toStatusOptions,
  toTriggerLabel,
} from '../scheduleRunsCard.helpers';

const run = (id, extra = {}) => ({
  id,
  trigger: 'cron',
  status: 'success',
  started_at: `2026-10-2${id}T09:00:00Z`,
  ...extra,
});

describe('toTriggerLabel', () => {
  it('shows the stored trigger cron as Scheduled', () => {
    expect(['cron', 'manual', 'test', 'other'].map(toTriggerLabel)).toEqual([
      'Scheduled',
      'Manual',
      'Test',
      'other',
    ]);
  });
});

describe('mergeRuns', () => {
  it('lists saved and draft runs newest first', () => {
    const merged = mergeRuns([run(1), run(3)], [run(5, { trigger: 'test' }), run(2, { trigger: 'test' })], 0);

    expect(merged.map(item => item.started_at.slice(0, 10))).toEqual([
      '2026-10-25',
      '2026-10-23',
      '2026-10-22',
      '2026-10-21',
    ]);
  });

  it('leaves out the draft runs that were there before the page opened', () => {
    const merged = mergeRuns([], [run(4, { trigger: 'test' }), run(7, { trigger: 'test' })], 4);

    expect(merged.map(item => item.id)).toEqual([7]);
  });
});

describe('filterRuns', () => {
  const runs = [run(1), run(2, { trigger: 'manual', status: 'failed' })];

  it('keeps every run without a filter', () => {
    expect(filterRuns(runs, { trigger: ALL_FILTER, status: ALL_FILTER })).toHaveLength(2);
  });

  it('combines the trigger and the status', () => {
    expect(filterRuns(runs, { trigger: 'manual', status: 'failed' }).map(item => item.id)).toEqual([2]);
    expect(filterRuns(runs, { trigger: 'manual', status: 'success' })).toEqual([]);
  });
});

describe('toStatusOptions', () => {
  it('lists All and each status of the rows once', () => {
    const options = toStatusOptions([run(1), run(2), run(3, { status: 'failed' })], status => `L-${status}`);

    expect(options).toEqual([
      { label: 'All', value: ALL_FILTER },
      { label: 'L-success', value: 'success' },
      { label: 'L-failed', value: 'failed' },
    ]);
  });
});

describe('describeRunFacts', () => {
  it('joins version, tokens and cost and leaves out missing figures', () => {
    const facts = describeRunFacts({ version_label: 'base', tokens: 1704, cost_usd: 0.0024 });

    expect(facts).toContain('base');
    expect(facts).toContain('1,704 tokens');
    expect(facts).toContain('$0.0024');
    expect(describeRunFacts({ version_label: 'v2' })).not.toContain('tokens');
    expect(describeRunFacts({ version_label: 'v2' })).not.toContain('$');
  });
});
