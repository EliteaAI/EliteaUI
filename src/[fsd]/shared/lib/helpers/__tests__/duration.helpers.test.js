import { describe, expect, it } from 'vitest';

import {
  formatDurationMs,
  formatDurationTooltip,
  getActionDurationMs,
  getBlockDurationMs,
  getSettledActionDurationMs,
  includesApprovalWait,
} from '../duration.helpers';

describe('formatDurationMs', () => {
  it.each([
    [null, '-'],
    [undefined, '-'],
    [NaN, '-'],
    [0, '0ms'],
    [450, '450ms'],
    [999, '999ms'],
    [999.6, '1.0s'],
    [1000, '1.0s'],
    [2400, '2.4s'],
    [59_949, '59.9s'],
    [59_950, '1m 00s'],
    [59_999, '1m 00s'],
    [60_000, '1m 00s'],
    [65_400, '1m 05s'],
    [3_599_999, '59m 59s'],
    [3_600_000, '1h 00m'],
    [3_725_000, '1h 02m'],
  ])('%s → %s', (ms, expected) => {
    expect(formatDurationMs(ms)).toBe(expected);
  });
});

describe('getActionDurationMs', () => {
  it('measures backend-stamped ISO times', () => {
    expect(
      getActionDurationMs({ startedAt: '2026-10-28T10:00:00.000Z', finishedAt: '2026-10-28T10:00:02.350Z' }),
    ).toBe(2350);
  });

  it('accepts epoch ms and mixed inputs', () => {
    expect(getActionDurationMs({ startedAt: 1000, finishedAt: 1850 })).toBe(850);
    expect(
      getActionDurationMs({
        startedAt: new Date('2026-10-28T10:00:00Z').getTime(),
        finishedAt: '2026-10-28T10:00:01Z',
      }),
    ).toBe(1000);
  });

  it('returns null for a start == finish stamp (missed start event), not 0', () => {
    expect(
      getActionDurationMs({ startedAt: '2026-10-28T10:00:00Z', finishedAt: '2026-10-28T10:00:00Z' }),
    ).toBe(null);
  });

  it('returns null when a stamp is missing, unparsable or reversed', () => {
    expect(getActionDurationMs({ finishedAt: '2026-10-28T10:00:00Z' })).toBe(null);
    expect(getActionDurationMs({ startedAt: '2026-10-28T10:00:00Z' })).toBe(null);
    expect(getActionDurationMs({ startedAt: '', finishedAt: '' })).toBe(null);
    expect(getActionDurationMs({ startedAt: 'garbage', finishedAt: '2026-10-28T10:00:00Z' })).toBe(null);
    expect(getActionDurationMs({ startedAt: 2000, finishedAt: 1000 })).toBe(null);
    expect(getActionDurationMs(undefined)).toBe(null);
  });

  it('ignores the client-side created_at/ended_at fallbacks', () => {
    expect(getActionDurationMs({ created_at: 1000, ended_at: 5000 })).toBe(null);
  });
});

describe('getBlockDurationMs', () => {
  it('spans earliest real start to latest real finish', () => {
    expect(
      getBlockDurationMs([
        { startedAt: 2000, finishedAt: 3000 },
        { startedAt: 1000, finishedAt: 9000 }, // wrapper
        { startedAt: 4000, finishedAt: 4000 }, // fake: skipped
        { created_at: 0, ended_at: 20_000 }, // fallbacks only: skipped
      ]),
    ).toBe(8000);
  });

  it('includes folded resume rounds', () => {
    expect(
      getBlockDurationMs([
        { startedAt: 1000, finishedAt: 2000 },
        { startedAt: 30_000, finishedAt: 31_500 },
      ]),
    ).toBe(30_500);
  });

  it('returns null when no action has real times', () => {
    expect(getBlockDurationMs([{ startedAt: 1000, finishedAt: 1000 }, {}])).toBe(null);
    expect(getBlockDurationMs([])).toBe(null);
    expect(getBlockDurationMs(undefined)).toBe(null);
  });
});

describe('includesApprovalWait', () => {
  it('flags HITL-paused or deferred actions', () => {
    expect(includesApprovalWait({ status: 'action_required' })).toBe(true);
    expect(includesApprovalWait({ status: 'complete', hitlDeferred: true })).toBe(true);
    expect(includesApprovalWait({ status: 'complete', toolMeta: { hitl_deferred: true } })).toBe(true);
    expect(includesApprovalWait({ status: 'complete', approvalWaited: true })).toBe(true);
    expect(includesApprovalWait({ status: 'complete' })).toBe(false);
    expect(includesApprovalWait(undefined)).toBe(false);
  });
});

describe('getSettledActionDurationMs', () => {
  const stamps = { startedAt: 1000, finishedAt: 3500 };

  it('measures a finished action', () => {
    expect(getSettledActionDurationMs({ ...stamps, status: 'complete' })).toBe(2500);
  });

  it('withholds a running action and a deferred wrapper still waiting for approval', () => {
    expect(getSettledActionDurationMs({ ...stamps, status: 'processing' })).toBe(null);
    expect(getSettledActionDurationMs({ ...stamps, status: 'complete', hitlDeferred: true })).toBe(null);
  });

  it('measures the wrapper once the resume clears the deferred flag', () => {
    expect(
      getSettledActionDurationMs({
        ...stamps,
        status: 'complete',
        hitlDeferred: false,
        approvalWaited: true,
      }),
    ).toBe(2500);
  });
});

describe('formatDurationTooltip', () => {
  it('shows milliseconds precision and the approval-wait note', () => {
    expect(formatDurationTooltip(2350)).toBe('Took 2.350s');
    expect(formatDurationTooltip(2350, true)).toBe('Took 2.350s (includes time waiting for approval)');
  });
});
