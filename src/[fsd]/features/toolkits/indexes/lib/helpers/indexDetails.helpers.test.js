import { describe, expect, it } from 'vitest';

import {
  IndexStatuses,
  PARTLY_INDEXED_REINDEX_MESSAGE,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';

import { bannerVariant } from './indexDetails.helpers';

describe('index details banner', () => {
  it('keeps a partial index runnable but presents a reindex warning', () => {
    expect(RUNNABLE_INDEX_STATUSES).toContain(IndexStatuses.partlyOk);
    expect(bannerVariant(false, false, IndexStatuses.partlyOk)).toEqual({
      severity: 'warning',
      label: PARTLY_INDEXED_REINDEX_MESSAGE,
    });
  });

  it.each([
    [IndexStatuses.success, 'success', 'Index is ready!'],
    [IndexStatuses.fail, 'error', 'Indexing failed'],
    [IndexStatuses.cancelled, 'info', 'Indexing stopped'],
  ])('preserves the %s presentation', (state, severity, label) => {
    expect(bannerVariant(false, false, state)).toEqual({ severity, label });
  });

  it('keeps active indexing authoritative over a terminal metadata state', () => {
    expect(bannerVariant(false, true, IndexStatuses.partlyOk)).toEqual({
      severity: 'warning',
      label: 'Indexing in progress…',
    });
  });
});
