import { describe, expect, it } from 'vitest';

import {
  BannerMessageMap,
  BannerSeverity,
  BannerTitleMap,
  IndexStatuses,
  PARTLY_INDEXED_REINDEX_MESSAGE,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  BUDGET_ERROR_CODES,
  BUDGET_ERROR_VARIANTS,
} from '@/[fsd]/shared/lib/constants/budgetError.constants';

import { bannerVariant } from './indexDetails.helpers';

describe('index details banner', () => {
  it('keeps a partial index runnable but presents a reindex warning', () => {
    expect(RUNNABLE_INDEX_STATUSES).toContain(IndexStatuses.partlyOk);
    expect(bannerVariant(false, IndexStatuses.partlyOk)).toEqual({
      severity: BannerSeverity.warning,
      label: 'Index completed with partial results',
      message: PARTLY_INDEXED_REINDEX_MESSAGE,
    });
  });

  it.each([
    [IndexStatuses.fail, BannerSeverity.error],
    [IndexStatuses.cancelled, BannerSeverity.warning],
  ])('preserves the %s presentation', (state, severity) => {
    expect(bannerVariant(false, state)).toEqual({
      severity,
      label: BannerTitleMap[severity],
      message: BannerMessageMap[severity],
    });
  });

  it('keeps active indexing authoritative over a terminal metadata state', () => {
    expect(bannerVariant(true, IndexStatuses.partlyOk)).toEqual({
      severity: BannerSeverity.info,
      label: BannerTitleMap[BannerSeverity.info],
      message: BannerMessageMap[BannerSeverity.info],
    });
  });

  it.each([IndexStatuses.success, IndexStatuses.scheduledReindex])(
    'keeps %s runnable after a successful execution',
    state => {
      expect(bannerVariant(false, state, { firstIndexed: 61, firstSkipped: 5 })).toEqual({
        severity: BannerSeverity.success,
        label: BannerTitleMap[BannerSeverity.success],
        message: BannerMessageMap[BannerSeverity.success]
          .replace('{{indexed_files}}', 61)
          .replace('{{skipped_files}}', 5),
      });
    },
  );
});

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
