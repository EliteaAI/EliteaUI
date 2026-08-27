import { describe, expect, it } from 'vitest';

import {
  BUDGET_ERROR_CODES,
  BUDGET_ERROR_VARIANTS,
} from '@/[fsd]/shared/lib/constants/budgetError.constants';

import {
  BannerMessageMap,
  BannerSeverity,
  INDEX_ABANDONED_BANNER_MESSAGE,
  IndexStatuses,
} from '../constants/indexDetails.constants';
import { bannerVariant, isAbandonedRun } from './indexDetails.helpers';

const GENERIC_FAILURE = BannerMessageMap[BannerSeverity.error];
const NO_STATS = { isReindex: false };

// The shape the backend persists into index metadata when a budget blocks indexing
const budgetError = code =>
  `The budget for shared models has been reached. Requests are unavailable until the budget resets or an administrator raises the limit. code: ${code}`;

describe('bannerVariant — budget blocks', () => {
  it('replaces the failure copy when the error is a budget block', () => {
    const banner = bannerVariant(
      false,
      IndexStatuses.fail,
      NO_STATS,
      budgetError(BUDGET_ERROR_CODES.PROJECT),
    );

    expect(banner.message).toBe(BUDGET_ERROR_VARIANTS[BUDGET_ERROR_CODES.PROJECT].message);
    expect(banner.message).not.toBe(GENERIC_FAILURE);
  });

  it('uses the member wording when the member budget was the one reached', () => {
    const banner = bannerVariant(false, IndexStatuses.fail, NO_STATS, budgetError(BUDGET_ERROR_CODES.MEMBER));

    expect(banner.message).toBe(BUDGET_ERROR_VARIANTS[BUDGET_ERROR_CODES.MEMBER].message);
  });

  it('never tells the user to check the source connection for a budget block', () => {
    // The reported defect: that advice sends them to investigate the wrong thing, and
    // Reindex cannot succeed until the budget resets
    const banner = bannerVariant(
      false,
      IndexStatuses.fail,
      NO_STATS,
      budgetError(BUDGET_ERROR_CODES.PROJECT),
    );

    expect(banner.message).not.toMatch(/source connection/i);
    expect(banner.message).not.toMatch(/Reindex/i);
  });

  it('keeps the error severity and title', () => {
    // Only the message body changes, so the colour and heading logic is untouched
    const banner = bannerVariant(
      false,
      IndexStatuses.fail,
      NO_STATS,
      budgetError(BUDGET_ERROR_CODES.PROJECT),
    );

    expect(banner.severity).toBe(BannerSeverity.error);
    expect(banner.label).toBe('Index processing error');
  });
});

describe('bannerVariant — everything else is unchanged', () => {
  it('keeps the generic copy for a non-budget failure', () => {
    const banner = bannerVariant(false, IndexStatuses.fail, NO_STATS, 'Connection refused by the source');

    expect(banner.message).toBe(GENERIC_FAILURE);
  });

  it.each([
    ['no error', undefined],
    ['null', null],
    ['empty string', ''],
    // Older failed indexes predate the backend fix and store the raw payload; the banner
    // must not crash on a non-string either
    ['an object', { message: 'boom' }],
  ])('keeps the generic copy when the error is %s', (_label, error) => {
    const banner = bannerVariant(false, IndexStatuses.fail, NO_STATS, error);

    expect(banner.message).toBe(GENERIC_FAILURE);
  });

  it('ignores a budget error when the index did not fail', () => {
    const inProgress = bannerVariant(
      false,
      IndexStatuses.progress,
      NO_STATS,
      budgetError(BUDGET_ERROR_CODES.PROJECT),
    );

    expect(inProgress.severity).toBe(BannerSeverity.info);
  });

  it('still reports an in-flight index as in progress', () => {
    expect(bannerVariant(true, IndexStatuses.fail, NO_STATS).severity).toBe(BannerSeverity.info);
  });

  it('still reports a cancelled index as stopped', () => {
    expect(bannerVariant(false, IndexStatuses.cancelled, NO_STATS).severity).toBe(BannerSeverity.warning);
  });
});

describe('bannerVariant — abandoned run', () => {
  it('reports a stale in_progress run as stopped, not indexing', () => {
    const banner = bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, true);

    expect(banner.severity).toBe(BannerSeverity.warning);
    expect(banner.label).toBe('Stopped');
    expect(banner.message).toBe(INDEX_ABANDONED_BANNER_MESSAGE);
  });

  it('wins over the in-flight signal, which a stale row still reads as', () => {
    expect(bannerVariant(true, IndexStatuses.progress, NO_STATS, undefined, true).severity).toBe(
      BannerSeverity.warning,
    );
  });

  it('never applies to a terminal state, whatever the stale flag says', () => {
    expect(bannerVariant(false, IndexStatuses.fail, NO_STATS, undefined, true).severity).toBe(
      BannerSeverity.error,
    );
  });

  it('leaves a fresh in_progress run reported as indexing', () => {
    expect(bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, false).severity).toBe(
      BannerSeverity.info,
    );
  });
});

const runEntry = totals => ({
  state: IndexStatuses.success,
  report: {
    status: 'ok',
    item_labels: { singular: 'page', plural: 'pages' },
    dependent_labels: { singular: 'attachment', plural: 'attachments' },
    totals: {
      indexed: 0,
      skipped: 0,
      not_indexed: 0,
      failed: 0,
      unchanged: 0,
      dependent_not_indexed: 0,
      total: 0,
      ...totals,
    },
    categories: [
      { kind: 'indexed', count: totals.indexed ?? 0, groups: [] },
      { kind: 'skipped', count: totals.skipped ?? 0, groups: [] },
      { kind: 'not_indexed', count: totals.not_indexed ?? 0, groups: [] },
      { kind: 'failed', count: totals.failed ?? 0, groups: [] },
    ],
    errors: [],
    errors_total: 0,
  },
});

describe('bannerVariant — success copy', () => {
  it('describes the run in the source\u2019s own units', () => {
    const banner = bannerVariant(false, IndexStatuses.success, {
      latestEntry: runEntry({ indexed: 179, skipped: 12, total: 191 }),
    });

    expect(banner.severity).toBe(BannerSeverity.success);
    expect(banner.message).toContain('179 pages indexed, 12 pages skipped');
    expect(banner.message).not.toContain('unsupported format');
  });

  it('says a run that changed nothing is up to date', () => {
    const banner = bannerVariant(false, IndexStatuses.success, {
      latestEntry: runEntry({ indexed: 0, unchanged: 196, total: 196 }),
    });

    expect(banner.message).toContain('Up to date \u2014 196 pages unchanged');
    expect(banner.message).not.toContain('0 pages');
  });

  it('applies to scheduled and partial runs, not just completed ones', () => {
    for (const state of [IndexStatuses.scheduledReindex, IndexStatuses.partlyOk]) {
      const banner = bannerVariant(false, state, {
        latestEntry: runEntry({ indexed: 5, total: 5 }),
      });

      expect(banner.severity).toBe(BannerSeverity.success);
      expect(banner.message).toContain('5 pages indexed');
    }
  });

  it('falls back to the generic copy when a run carries no report', () => {
    const banner = bannerVariant(false, IndexStatuses.success, { latestEntry: null });

    expect(banner.message).toBe(BannerMessageMap[BannerSeverity.success]);
  });
});

describe('isAbandonedRun', () => {
  const run = (state, extra = {}) => ({ metadata: { state }, ...extra });

  it('flags a run the backend marked stale while it still claims to be running', () => {
    expect(isAbandonedRun(run(IndexStatuses.progress, { stale: true }))).toBe(true);
  });

  it('leaves a live in-progress run alone', () => {
    expect(isAbandonedRun(run(IndexStatuses.progress))).toBe(false);
  });

  it('ignores stale rows that already reached a terminal state', () => {
    expect(isAbandonedRun(run(IndexStatuses.success, { stale: true }))).toBe(false);
    expect(isAbandonedRun(run(IndexStatuses.fail, { stale: true }))).toBe(false);
  });

  it('tolerates a missing index or metadata', () => {
    expect(isAbandonedRun(undefined)).toBe(false);
    expect(isAbandonedRun({})).toBe(false);
  });
});
