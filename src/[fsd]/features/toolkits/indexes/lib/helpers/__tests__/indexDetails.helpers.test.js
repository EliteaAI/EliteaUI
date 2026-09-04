import { describe, expect, it } from 'vitest';

import {
  BUDGET_ERROR_CODES,
  BUDGET_ERROR_VARIANTS,
} from '@/[fsd]/shared/lib/constants/budgetError.constants';

import {
  BannerMessageMap,
  BannerSeverity,
  INDEX_ABANDONED_BANNER_MESSAGE,
  INDEX_DATA_DISABLED_REASON,
  INDEX_RETAINED_DATA_MESSAGE,
  INDEX_SEARCH_TOOL_OPTIONS,
  IndexStatuses,
  REINDEX_FAILED_BANNER_MESSAGE,
  REINDEX_FAILED_BANNER_TITLE,
  REINDEX_IN_PROGRESS_BANNER_MESSAGE,
  REINDEX_IN_PROGRESS_BANNER_TITLE,
} from '../../constants/indexDetails.constants';
import {
  bannerOutlivesRun,
  bannerVariant,
  hasLiveRun,
  hasRetainedIndexData,
  indexBuildBlockedReason,
  indexScheduleBlockedReason,
  indexSearchBlockedReason,
  indexSearchToolOptions,
  shouldExpireReindexStub,
} from '../indexDetails.helpers';

const runState = over => ({ isIndexing: true, canStopIndexing: false, isStale: false, ...over });

describe('hasLiveRun', () => {
  it('holds while indexing and nothing says the run died', () => {
    expect(hasLiveRun(runState())).toBe(true);
  });

  it('clears once the backend marks an unstoppable run stale', () => {
    expect(hasLiveRun(runState({ isStale: true }))).toBe(false);
  });

  it('clears for a stale run the panel still believes it can stop', () => {
    // A run that died without a terminal write keeps its task_id forever, so
    // stoppability is true for every dead row and must not veto the stale verdict.
    expect(hasLiveRun(runState({ isStale: true, canStopIndexing: true }))).toBe(false);
  });

  it('clears when no run is in flight', () => {
    expect(hasLiveRun(runState({ isIndexing: false }))).toBe(false);
  });
});

describe('shouldExpireReindexStub', () => {
  const expiry = over => ({
    serverRow: { stale: false },
    stubCreatedAt: 1_000,
    now: 2_000,
    graceMs: 5_000,
    ...over,
  });

  it('expires immediately when the row is gone', () => {
    expect(shouldExpireReindexStub(expiry({ serverRow: undefined }))).toBe(true);
  });

  it('keeps a stale row inside the grace window', () => {
    expect(shouldExpireReindexStub(expiry({ serverRow: { stale: true } }))).toBe(false);
  });

  it('expires a stale row once the grace window has passed', () => {
    expect(shouldExpireReindexStub(expiry({ serverRow: { stale: true }, now: 7_000 }))).toBe(true);
  });

  it('never expires on a non-stale row', () => {
    expect(shouldExpireReindexStub(expiry({ now: 999_000 }))).toBe(false);
  });
});

const allSearchTools = INDEX_SEARCH_TOOL_OPTIONS.map(option => option.value);

describe('indexSearchToolOptions', () => {
  it('keeps only the search tools the toolkit exposes', () => {
    expect(indexSearchToolOptions(['search_index', 'index_data', 'read_page_by_id'])).toEqual([
      { label: 'Search Index', value: 'search_index' },
    ]);
  });

  it('treats a missing tool list as none enabled', () => {
    expect(indexSearchToolOptions(undefined)).toEqual([]);
  });
});

describe('indexSearchBlockedReason', () => {
  it('allows searching every state that holds queryable data', () => {
    expect(indexSearchBlockedReason(IndexStatuses.success, allSearchTools)).toBeNull();
    expect(indexSearchBlockedReason(IndexStatuses.partlyOk, allSearchTools)).toBeNull();
    expect(indexSearchBlockedReason(IndexStatuses.scheduledReindex, allSearchTools)).toBeNull();
  });

  it('blames the running operation while indexing', () => {
    expect(indexSearchBlockedReason(IndexStatuses.progress, allSearchTools)).toMatch(
      /indexing is in progress/,
    );
  });

  it('stops blaming a run that is no longer in progress in any actionable sense', () => {
    // Without a live chunk count an abandoned run has nothing proven searchable,
    // so the block stands — only the wording stops lying.
    expect(indexSearchBlockedReason(IndexStatuses.progress, allSearchTools, true)).toMatch(/not ready/);
  });

  it('blocks states that never produced searchable data', () => {
    expect(indexSearchBlockedReason(IndexStatuses.fail, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(IndexStatuses.cancelled, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(IndexStatuses.created, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(undefined, allSearchTools)).toMatch(/not ready/);
  });

  it('blocks a searchable index whose toolkit exposes no search tool', () => {
    expect(indexSearchBlockedReason(IndexStatuses.success, ['index_data'])).toMatch(
      /No search tools are enabled/,
    );
  });
});

describe('indexSearchBlockedReason — retained data', () => {
  it('keeps the previous generation searchable while a reindex runs', () => {
    expect(indexSearchBlockedReason(IndexStatuses.progress, allSearchTools, false, true)).toBeNull();
  });

  it('keeps the previous generation searchable after a failed reindex', () => {
    expect(indexSearchBlockedReason(IndexStatuses.fail, allSearchTools, false, true)).toBeNull();
  });

  it('keeps an abandoned reindex over retained data searchable', () => {
    expect(indexSearchBlockedReason(IndexStatuses.progress, allSearchTools, true, true)).toBeNull();
  });

  it('keeps the previous generation searchable after a stopped reindex', () => {
    // Stop deletes only the pending run's rows — the retained generation is intact.
    expect(indexSearchBlockedReason(IndexStatuses.cancelled, allSearchTools, false, true)).toBeNull();
  });

  it('still requires a search tool to be enabled', () => {
    expect(indexSearchBlockedReason(IndexStatuses.fail, ['index_data'], false, true)).toMatch(
      /No search tools are enabled/,
    );
  });

  it('never unlocks states retained data says nothing about', () => {
    expect(indexSearchBlockedReason(IndexStatuses.created, allSearchTools, false, true)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(undefined, allSearchTools, false, true)).toMatch(/not ready/);
  });
});

describe('hasRetainedIndexData', () => {
  it('holds only on a positive live chunk count', () => {
    expect(hasRetainedIndexData({ indexed_chunks: 42 })).toBe(true);
    expect(hasRetainedIndexData({ indexed_chunks: 0 })).toBe(false);
  });

  it('claims nothing for rows that never reported a count', () => {
    expect(hasRetainedIndexData({})).toBe(false);
    expect(hasRetainedIndexData(undefined)).toBe(false);
    expect(hasRetainedIndexData({ indexed_chunks: 'not-a-number' })).toBe(false);
  });

  it('ignores a remembered successful run over an emptied index', () => {
    // A zero-chunk completed first run or a whole-index delete keeps
    // last_successful_run non-null — the count is the only proof of data.
    expect(hasRetainedIndexData({ indexed_chunks: 0, last_successful_run: { updated_on: 100 } })).toBe(false);
  });
});

describe('indexBuildBlockedReason', () => {
  it('allows a rebuild while the toolkit still exposes index_data', () => {
    expect(indexBuildBlockedReason(['index_data', 'search_index'])).toBeNull();
  });

  it('blocks a rebuild once index_data is unselected', () => {
    expect(indexBuildBlockedReason(['search_index'])).toMatch(/Index data/);
  });

  it('allows a rebuild when the toolkit restricts nothing, since that exposes every tool', () => {
    expect(indexBuildBlockedReason([])).toBeNull();
    expect(indexBuildBlockedReason(undefined)).toBeNull();
  });
});

const scheduleState = over => ({
  state: IndexStatuses.success,
  hasSchedulePermission: true,
  projectName: 'Private',
  scheduleEnabled: false,
  buildBlockedReason: null,
  ...over,
});

describe('indexScheduleBlockedReason', () => {
  it('allows scheduling a healthy index', () => {
    expect(indexScheduleBlockedReason(scheduleState())).toBeNull();
  });

  it('blocks arming a schedule the toolkit could not run', () => {
    expect(
      indexScheduleBlockedReason(scheduleState({ buildBlockedReason: INDEX_DATA_DISABLED_REASON })),
    ).toMatch(/Index data/);
  });

  it('keeps an armed schedule switchable off once builds become blocked', () => {
    expect(
      indexScheduleBlockedReason(
        scheduleState({ scheduleEnabled: true, buildBlockedReason: INDEX_DATA_DISABLED_REASON }),
      ),
    ).toBeNull();
  });

  it('keeps an armed schedule switchable off from a state that forbids arming', () => {
    expect(
      indexScheduleBlockedReason(scheduleState({ scheduleEnabled: true, state: IndexStatuses.created })),
    ).toBeNull();
  });

  it('still reports the reasons that outrank the armed-schedule escape hatch', () => {
    expect(
      indexScheduleBlockedReason(scheduleState({ scheduleEnabled: true, state: IndexStatuses.fail })),
    ).toMatch(/stopped\/error state/);
    expect(
      indexScheduleBlockedReason(scheduleState({ scheduleEnabled: true, hasSchedulePermission: false })),
    ).toMatch(/Insufficient permissions/);
  });

  it('allows scheduling a failed reindex whose previous data is still there to rebuild from', () => {
    expect(
      indexScheduleBlockedReason(scheduleState({ state: IndexStatuses.fail, hasRetainedData: true })),
    ).toBeNull();
  });

  it('keeps a failure without retained data blocked', () => {
    expect(
      indexScheduleBlockedReason(scheduleState({ state: IndexStatuses.fail, hasRetainedData: false })),
    ).toMatch(/stopped\/error state/);
  });

  it('keeps a stopped index blocked whatever data it retains', () => {
    expect(
      indexScheduleBlockedReason(scheduleState({ state: IndexStatuses.cancelled, hasRetainedData: true })),
    ).toMatch(/stopped\/error state/);
  });
});

describe('bannerVariant — retained data', () => {
  const NO_STATS = { isReindex: false };
  const retention = over => ({ hasRetainedData: true, lastSuccessfulRun: null, ...over });

  it('tells the user the existing data stays searchable while a reindex runs', () => {
    const banner = bannerVariant(true, IndexStatuses.progress, NO_STATS, undefined, false, retention());

    expect(banner.severity).toBe(BannerSeverity.info);
    expect(banner.label).toBe(REINDEX_IN_PROGRESS_BANNER_TITLE);
    expect(banner.message).toBe(REINDEX_IN_PROGRESS_BANNER_MESSAGE);
  });

  it('applies to a server-reported run the panel is not driving', () => {
    const banner = bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, false, retention());

    expect(banner.label).toBe(REINDEX_IN_PROGRESS_BANNER_TITLE);
  });

  it('tells the user the previous data survived a failed reindex', () => {
    const banner = bannerVariant(false, IndexStatuses.fail, NO_STATS, 'boom', false, retention());

    expect(banner.severity).toBe(BannerSeverity.error);
    expect(banner.label).toBe(REINDEX_FAILED_BANNER_TITLE);
    expect(banner.message).toBe(REINDEX_FAILED_BANNER_MESSAGE);
  });

  it('names the last successful run when the backend reports one', () => {
    const banner = bannerVariant(
      false,
      IndexStatuses.fail,
      NO_STATS,
      'boom',
      false,
      retention({
        lastSuccessfulRun: { updated_on: 1_756_360_800, state: 'completed', indexed: 12 },
      }),
    );

    expect(banner.message).toContain(REINDEX_FAILED_BANNER_MESSAGE);
    expect(banner.message).toMatch(/Last successful indexing: \d{2}\.\d{2}\.\d{4}/);
  });

  it('makes no retention claim without a live chunk count', () => {
    const failed = bannerVariant(false, IndexStatuses.fail, NO_STATS, 'boom', false, {
      hasRetainedData: false,
      lastSuccessfulRun: { updated_on: 100 },
    });

    expect(failed.label).not.toBe(REINDEX_FAILED_BANNER_TITLE);
    expect(failed.message).not.toMatch(/remains available/);

    const indexing = bannerVariant(true, IndexStatuses.progress, NO_STATS);
    expect(indexing.message).not.toMatch(/remains available/);
  });

  it('keeps the stale-run warning ahead of the reindexing copy while stating the data survived', () => {
    const banner = bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, true, retention());

    expect(banner.severity).toBe(BannerSeverity.warning);
    expect(banner.message).toContain(INDEX_ABANDONED_BANNER_MESSAGE);
    expect(banner.message).toContain(INDEX_RETAINED_DATA_MESSAGE);
  });

  it('makes no retention claim for a stale run without a live chunk count', () => {
    const banner = bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, true);

    expect(banner.message).toBe(INDEX_ABANDONED_BANNER_MESSAGE);
  });

  it('tells the user the previous data survived a stopped reindex', () => {
    const banner = bannerVariant(false, IndexStatuses.cancelled, NO_STATS, undefined, false, retention());

    expect(banner.severity).toBe(BannerSeverity.warning);
    expect(banner.message).toContain(BannerMessageMap[BannerSeverity.warning]);
    expect(banner.message).toContain(INDEX_RETAINED_DATA_MESSAGE);
  });

  it('makes no retention claim for a stopped run without a live chunk count', () => {
    const banner = bannerVariant(false, IndexStatuses.cancelled, NO_STATS);

    expect(banner.message).toBe(BannerMessageMap[BannerSeverity.warning]);
  });

  it('keeps a budget block visible while still stating the data survived', () => {
    const budgetError = `The budget has been reached. code: ${BUDGET_ERROR_CODES.PROJECT}`;
    const banner = bannerVariant(false, IndexStatuses.fail, NO_STATS, budgetError, false, retention());

    expect(banner.label).toBe(REINDEX_FAILED_BANNER_TITLE);
    expect(banner.message).toContain(BUDGET_ERROR_VARIANTS[BUDGET_ERROR_CODES.PROJECT].message);
    expect(banner.message).toMatch(/Previously indexed data remains available for search\./);
  });
});

describe('bannerOutlivesRun', () => {
  it('keeps a failed run visible after its transcript is gone', () => {
    expect(bannerOutlivesRun(BannerSeverity.error)).toBe(true);
  });

  it('keeps a stopped run visible after its transcript is gone', () => {
    expect(bannerOutlivesRun(BannerSeverity.warning)).toBe(true);
  });

  it('lets a finished run go quiet', () => {
    expect(bannerOutlivesRun(BannerSeverity.success)).toBe(false);
  });

  it('lets a never-indexed row go quiet rather than claim a run is under way', () => {
    expect(bannerOutlivesRun(BannerSeverity.info)).toBe(false);
  });
});
