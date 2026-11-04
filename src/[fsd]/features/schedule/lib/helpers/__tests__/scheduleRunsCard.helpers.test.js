// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { describeRunFacts, mergeRuns, toTriggerLabel } from '../scheduleRunsCard.helpers';

const run = (id, extra = {}) => ({
  id,
  trigger: 'cron',
  status: 'success',
  started_at: `2026-10-2${id}T09:00:00Z`,
  ...extra,
});

describe('toTriggerLabel', () => {
  it('shows the stored trigger cron as Scheduled', () => {
    expect(['cron', 'manual', 'test', 'other'].map(trigger => toTriggerLabel(trigger))).toEqual([
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

  it('puts the run with the higher id first when two runs started at the same time', () => {
    const sameTime = { started_at: '2026-10-21T09:00:00Z' };
    const merged = mergeRuns(
      [run(1, sameTime), run(3, sameTime)],
      [run(2, { ...sameTime, trigger: 'test' })],
      0,
    );

    expect(merged.map(item => item.id)).toEqual([3, 2, 1]);
  });

  it('leaves out the draft runs that were there before the page opened', () => {
    const merged = mergeRuns([], [run(4, { trigger: 'test' }), run(7, { trigger: 'test' })], 4);

    expect(merged.map(item => item.id)).toEqual([7]);
  });
});

describe('describeRunFacts', () => {
  it('joins version, tokens and cost and leaves out missing figures', () => {
    const facts = describeRunFacts({ version_label: 'base', tokens: 1704, cost_usd: 0.0024 });

    expect(facts).toContain('Version base');
    expect(facts).toContain('1,704 tokens');
    expect(facts).toContain('$0.0024');
    expect(describeRunFacts({ version_label: 'v2' })).not.toContain('tokens');
    expect(describeRunFacts({ version_label: 'v2' })).not.toContain('$');
  });
});
