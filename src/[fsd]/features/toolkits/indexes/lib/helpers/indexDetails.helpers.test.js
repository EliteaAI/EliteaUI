import { describe, expect, it } from 'vitest';

import {
  BannerMessageMap,
  BannerSeverity,
  BannerTitleMap,
  IndexStatuses,
  PARTLY_INDEXED_REINDEX_MESSAGE,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';

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
