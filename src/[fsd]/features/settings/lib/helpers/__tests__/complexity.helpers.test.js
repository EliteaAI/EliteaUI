import { describe, expect, it } from 'vitest';

import {
  breakdownShares,
  dataFreshnessNote,
  formatCu,
  periodRange,
  runScoreState,
  runTooltip,
  thresholdsLine,
} from '../complexity.helpers';

describe('complexity helpers (EL-7556)', () => {
  it('ends the period tomorrow, since date_to is exclusive', () => {
    expect(periodRange('7', new Date('2026-11-16T22:00:00Z'))).toEqual({
      dateFrom: '2026-11-10',
      dateTo: '2026-11-17',
    });
  });

  it('splits the breakdown into shares and survives an empty one', () => {
    expect(breakdownShares({ context: 2, reasoning: 1, tools: 1 })).toEqual([50, 25, 25]);
    expect(breakdownShares(null)).toEqual([0, 0, 0]);
  });

  it('formats CU and the freshness note', () => {
    expect(formatCu(null)).toBe('—');
    expect(formatCu(12.44)).toBe('12.4');
    expect(dataFreshnessNote({})).toMatch(/^Data freshness: No runs scored yet\. Scores update hourly/);
    expect(
      dataFreshnessNote({ as_of: '2026-11-16T10:00:00Z', thresholds_computed_at: '2026-11-16T02:41:00Z' }),
    ).toMatch(/Scores as of .*\. Scores update hourly\. .*last recalibration: Nov 16, 2026/);
  });

  it('describes the labels with the live cut points and their source', () => {
    expect(
      thresholdsLine({ thresholds: { medium: 10, high: 30, extreme: 100 }, thresholds_source: 'default' }),
    ).toBe(
      'Low under 10 · Medium 10–30 · High 30–100 · Extreme over 100 (default thresholds, updated nightly)',
    );
    expect(
      thresholdsLine({
        thresholds: { medium: 6.24, high: 18, extreme: 75 },
        thresholds_source: 'calibrated',
      }),
    ).toMatch(/^Low under 6\.2 · .*\(calibrated for this installation, updated nightly\)$/);
    expect(
      thresholdsLine({ thresholds: { medium: 5, high: 9, extreme: 50 }, thresholds_source: 'pinned' }),
    ).toMatch(/set by an administrator/);
    expect(thresholdsLine(undefined)).toBeNull();
  });

  it('splits one run in its tooltip', () => {
    expect(
      runTooltip({ cu_total: 12.3, percentile: 80, breakdown: { context: 6, reasoning: 4, tools: 2.3 } }),
    ).toBe('12.3 CU · P80 · Context 6.0 · Reasoning 4.0 · Tools 2.3');
  });

  it('tells a run waiting for its score from one that will not get one', () => {
    const now = Date.UTC(2026, 10, 17, 12);
    const hour = 3600 * 1000;
    expect(runScoreState({ label: 'L' }, now, 2 * hour, now)).toBe('scored');
    expect(runScoreState(undefined, now - 30 * 60 * 1000, 2 * hour, now)).toBe('pending');
    expect(runScoreState(undefined, now - 3 * hour, 2 * hour, now)).toBe('notScored');
    expect(runScoreState(undefined, NaN, 2 * hour, now)).toBe('notScored');
  });
});
