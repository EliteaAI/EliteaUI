import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RUN_SCOPE_TYPE } from '../../constants/analyticsCommon.constants.js';
import {
  axisTick,
  barChartCursor,
  buildRunScope,
  collectFailedRunCalls,
  describeRunModels,
  describeRunTotals,
  describeRunVersions,
  fmtCost,
  fmtDuration,
  fmtNum,
  getPresetRange,
} from '../analyticsCommon.helpers.js';

describe('getPresetRange', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('spans just today for days=0', () => {
    vi.setSystemTime(new Date('2026-03-15T14:30:00'));
    const { from, to } = getPresetRange(0);
    expect(from).toEqual(new Date('2026-03-15T00:00:00'));
    expect(to).toEqual(new Date('2026-03-15T23:59:59.999'));
  });

  it('spans 7 calendar days total (today + 6 prior) for days=7', () => {
    vi.setSystemTime(new Date('2026-03-15T14:30:00'));
    const { from, to } = getPresetRange(7);
    expect(from).toEqual(new Date('2026-03-09T00:00:00'));
    expect(to).toEqual(new Date('2026-03-15T23:59:59.999'));
  });

  it('crosses a month boundary', () => {
    vi.setSystemTime(new Date('2026-03-03T09:00:00'));
    const { from, to } = getPresetRange(7);
    expect(from).toEqual(new Date('2026-02-25T00:00:00'));
    expect(to).toEqual(new Date('2026-03-03T23:59:59.999'));
  });

  it('crosses a year boundary', () => {
    vi.setSystemTime(new Date('2026-01-02T09:00:00'));
    const { from, to } = getPresetRange(7);
    expect(from).toEqual(new Date('2025-12-27T00:00:00'));
    expect(to).toEqual(new Date('2026-01-02T23:59:59.999'));
  });
});

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

describe('barChartCursor', () => {
  it('paints the hover band with the theme hover token instead of the Recharts light grey', () => {
    const palette = { background: { interactiveItem: { hover: 'rgba(255,255,255,0.1)' } } };

    expect(barChartCursor(palette)).toEqual({ fill: 'rgba(255,255,255,0.1)' });
  });
});

describe('buildRunScope', () => {
  it('adds the root entity to the run query so one participant of a conversation is counted', () => {
    const rootEntity = { rootEntityType: 'skill', rootEntityId: 174, rootEntityProjectId: 1 };

    expect(buildRunScope(RUN_SCOPE_TYPE.run, '555', rootEntity).queryArgs).toEqual({
      runId: '555',
      ...rootEntity,
    });
  });

  it('scopes an Agent/Pipeline run by runId with run wording', () => {
    const scope = buildRunScope(RUN_SCOPE_TYPE.run, '555');

    expect(scope.queryArgs).toEqual({ runId: '555' });
    expect(scope.scopeLabel).toBe('this run');
    expect(scope.noDataMessage).toBe('No analytics data is available for this run.');
  });

  it('scopes an evaluation run by evalRunId with evaluation wording', () => {
    const scope = buildRunScope(RUN_SCOPE_TYPE.evalRun, 9);

    expect(scope.queryArgs).toEqual({ evalRunId: 9 });
    expect(scope.scopeLabel).toBe('this evaluation run');
    expect(scope.tooltips.costs.TOTAL_COST).toMatch(
      /^Estimated USD cost of this evaluation run, including Agent execution and LLM-as-judge scoring/,
    );
    expect(scope.noDataMessage).toBe(
      'Analytics is unavailable for this evaluation run because tracking data is missing.',
    );
  });

  it('returns null without an id so the page never falls back to project-wide data', () => {
    expect(buildRunScope(RUN_SCOPE_TYPE.evalRun, null)).toBeNull();
    expect(buildRunScope(RUN_SCOPE_TYPE.run, '')).toBeNull();
  });
});

describe('run trace helpers', () => {
  const runDetail = {
    models: [
      { model_name: 'gpt-x', display_name: 'GPT X' },
      { model_name: 'sonnet', display_name: 'Sonnet' },
    ],
    llm_calls: [
      { model_name: 'sonnet', ts: '2026-10-09T10:02:00Z', duration_ms: 50, is_error: true },
      { model_name: 'gpt-x', ts: '2026-10-09T10:00:00Z', is_error: false },
    ],
    tool_calls: [{ tool_name: 'search', ts: '2026-10-09T10:01:00Z', duration_ms: 20, is_error: true }],
  };

  it('lists every model of the run by display name', () => {
    expect(describeRunModels(runDetail)).toBe('GPT X, Sonnet');
    expect(describeRunModels(undefined)).toBe('—');
  });

  it('names each recorded version and skips ids the entity no longer lists', () => {
    const versions = [
      { id: 1, name: 'base' },
      { id: 2, name: 'v2' },
    ];

    expect(describeRunVersions([2, 1, 99], versions)).toBe('v2, base');
    expect(describeRunVersions([99], versions)).toBe('—');
  });

  it('formats the run totals the way the Costs tab formats them', () => {
    const totals = describeRunTotals({
      kpis: { llm_calls: 3, billable_tokens: 1234, total_cost: 0.001012, errors: 1, calls_duration_ms: 3370 },
    });

    expect(totals).toBe(
      `Calls: 3 · Tokens: 1,234 · Cost: ${fmtCost(0.001012)} · Errors: 1 · Model time: ${fmtDuration(3370)}`,
    );
    expect(totals).toContain('Cost: $0.0011');
  });

  it('describes no totals before the run trace arrives', () => {
    expect(describeRunTotals(undefined)).toBeNull();
  });

  it('collects only the failing llm and tool calls, in time order', () => {
    expect(collectFailedRunCalls(runDetail).map(call => [call.eventType, call.name])).toEqual([
      ['tool', 'search'],
      ['llm', 'Sonnet'],
    ]);
  });
});
