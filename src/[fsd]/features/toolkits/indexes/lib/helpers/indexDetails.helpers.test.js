import { describe, expect, it } from 'vitest';

import {
  BUDGET_ERROR_CODES,
  BUDGET_ERROR_VARIANTS,
} from '@/[fsd]/shared/lib/constants/budgetError.constants';

import { BannerMessageMap, BannerSeverity, IndexStatuses } from '../constants/indexDetails.constants';
import { bannerVariant } from './indexDetails.helpers';

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
