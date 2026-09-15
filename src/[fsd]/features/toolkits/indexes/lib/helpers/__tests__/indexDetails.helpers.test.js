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
  INDEX_UNRESPONSIVE_BANNER_MESSAGE,
  IndexStatuses,
  REINDEX_FAILED_BANNER_MESSAGE,
  REINDEX_FAILED_BANNER_TITLE,
  REINDEX_IN_PROGRESS_BANNER_MESSAGE,
  REINDEX_IN_PROGRESS_BANNER_TITLE,
} from '../../constants/indexDetails.constants';
import {
  abandonedRunTooltip,
  applyReindexStub,
  bannerOutlivesRun,
  bannerVariant,
  buildReindexStub,
  hasLiveRun,
  hasRetainedIndexData,
  indexBuildBlockedReason,
  indexListCounts,
  indexRunControls,
  indexScheduleBlockedReason,
  indexSearchBlockedReason,
  indexSearchToolOptions,
  isAbandonedRun,
  isReclaimableRun,
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
    const banner = bannerVariant({
      isIndexing: true,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: false,
      retention: retention(),
    });

    expect(banner.severity).toBe(BannerSeverity.info);
    expect(banner.label).toBe(REINDEX_IN_PROGRESS_BANNER_TITLE);
    expect(banner.message).toBe(REINDEX_IN_PROGRESS_BANNER_MESSAGE);
  });

  it('applies to a server-reported run the panel is not driving', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: false,
      retention: retention(),
    });

    expect(banner.label).toBe(REINDEX_IN_PROGRESS_BANNER_TITLE);
  });

  it('tells the user the previous data survived a failed reindex', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error: 'boom',
      isStale: false,
      retention: retention(),
    });

    expect(banner.severity).toBe(BannerSeverity.error);
    expect(banner.label).toBe(REINDEX_FAILED_BANNER_TITLE);
    expect(banner.message).toBe(REINDEX_FAILED_BANNER_MESSAGE);
  });

  it('names the last successful run when the backend reports one', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error: 'boom',
      isStale: false,
      retention: retention({
        lastSuccessfulRun: { updated_on: 1_756_360_800, state: 'completed', indexed: 12 },
      }),
    });

    expect(banner.message).toContain(REINDEX_FAILED_BANNER_MESSAGE);
    expect(banner.message).toMatch(/Last successful indexing: \d{2}\.\d{2}\.\d{4}/);
  });

  it('makes no retention claim without a live chunk count', () => {
    const failed = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error: 'boom',
      isStale: false,
      retention: {
        hasRetainedData: false,
        lastSuccessfulRun: { updated_on: 100 },
      },
    });

    expect(failed.label).not.toBe(REINDEX_FAILED_BANNER_TITLE);
    expect(failed.message).not.toMatch(/remains available/);

    const indexing = bannerVariant({
      isIndexing: true,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
    });
    expect(indexing.message).not.toMatch(/remains available/);
  });

  it('keeps the stale-run warning ahead of the reindexing copy while stating the data survived', () => {
    // `true` for isReclaimable: this is the abandoned case, where Reindex is the
    // remedy the panel actually offers.
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: true,
      retention: retention(),
      isReclaimable: true,
    });

    expect(banner.severity).toBe(BannerSeverity.warning);
    expect(banner.message).toContain(INDEX_ABANDONED_BANNER_MESSAGE);
    expect(banner.message).toContain(INDEX_RETAINED_DATA_MESSAGE);
  });

  it('makes no retention claim for a stale run without a live chunk count', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: true,
      retention: {},
      isReclaimable: true,
    });

    expect(banner.message).toBe(INDEX_ABANDONED_BANNER_MESSAGE);
  });

  it('tells the user the previous data survived a stopped reindex', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.cancelled,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: false,
      retention: retention(),
    });

    expect(banner.severity).toBe(BannerSeverity.warning);
    expect(banner.message).toContain(BannerMessageMap[BannerSeverity.warning]);
    expect(banner.message).toContain(INDEX_RETAINED_DATA_MESSAGE);
  });

  it('makes no retention claim for a stopped run without a live chunk count', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.cancelled,
      reindexStats: NO_STATS,
    });

    expect(banner.message).toBe(BannerMessageMap[BannerSeverity.warning]);
  });

  it('keeps a budget block visible while still stating the data survived', () => {
    const budgetError = `The budget has been reached. code: ${BUDGET_ERROR_CODES.PROJECT}`;
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error: budgetError,
      isStale: false,
      retention: retention(),
    });

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

describe('indexListCounts', () => {
  const inProgress = true;

  it('reports the running chunk count while a run is in flight', () => {
    expect(indexListCounts({ indexed: 191, total: 200, run_chunks: 42 }, inProgress)).toEqual({
      tooltip: 'chunks written by the current run',
      count: '42 chunks so far',
    });
  });

  it('never renders a ratio mid-run: the run’s own total is unknown', () => {
    const { count } = indexListCounts({ indexed: 191, total: 200, run_chunks: 42 }, inProgress);

    expect(count).not.toContain('/');
  });

  it('treats zero as a real count, not a missing one', () => {
    expect(indexListCounts({ indexed: 191, run_chunks: 0 }, inProgress).count).toBe('0 chunks so far');
  });

  it('falls back to the docs ratio when run_chunks is absent or null', () => {
    expect(indexListCounts({ indexed: 191, total: 200 }, inProgress).count).toBe('191 / 200');
    expect(indexListCounts({ indexed: 191, total: 200, run_chunks: null }, inProgress).count).toBe(
      '191 / 200',
    );
  });

  it('ignores run_chunks once the run is no longer in progress', () => {
    expect(indexListCounts({ indexed: 200, total: 200, run_chunks: 42 }, false).count).toBe('200 / 200');
  });

  it('names the ratio reindexed once the collection has more than one completed run', () => {
    const history = [{ state: 'completed' }, { state: 'completed' }];

    expect(indexListCounts({ indexed: 1, total: 1, history }, false).tooltip).toBe('reindexed / total');
    expect(indexListCounts({ indexed: 1, total: 1, history: [] }, false).tooltip).toBe('indexed / total');
  });

  it('survives a row with no metadata', () => {
    expect(indexListCounts(undefined, false)).toEqual({ tooltip: '-', count: '–' });
  });
});

describe('applyReindexStub', () => {
  const finishedRow = {
    id: 'row-1',
    stale: true,
    metadata: { state: 'failed', run_chunks: 1520, indexed: 180, total: 305, task_id: 'old' },
  };
  // confirmReindex stashes the clicked row's task_id; without it the stub cannot
  // tell the row it replaced from the run it started.
  const clicked = { previousTaskId: 'old' };
  // Mirrors what confirmReindex actually builds: the clicked row's metadata
  // spread wholesale, so the finished run's run_chunks IS present on the stub.
  const started = {
    id: 'row-1',
    ...clicked,
    metadata: { ...finishedRow.metadata, state: 'in_progress', task_id: 'new' },
  };

  it('clears the finished run’s chunk count when a new run starts', () => {
    const [row] = applyReindexStub([finishedRow], started);

    // 1520 belonged to the run that just ended; rendering it as this run's
    // progress is the exact lie the mid-run display exists to remove.
    expect(row.metadata.run_chunks).toBe(0);
    expect(row.metadata.state).toBe('in_progress');
    expect(row.stale).toBe(false);
  });

  it('keeps the previous run’s measurements readable', () => {
    const [row] = applyReindexStub([finishedRow], started);

    expect(row.metadata.indexed).toBe(180);
    expect(row.metadata.total).toBe(305);
  });

  it('leaves the list untouched when no reindex is running', () => {
    const list = [finishedRow];

    expect(applyReindexStub(list, null)).toBe(list);
  });

  it('only stubs the row that started', () => {
    const other = { id: 'row-2', metadata: { state: 'completed', run_chunks: 7 } };

    const [, untouched] = applyReindexStub([finishedRow, other], started);

    expect(untouched.metadata.run_chunks).toBe(7);
  });

  it('resets both liveness flags, never one of them', () => {
    // reclaimable implies stale on every server-sent row, so resetting one alone mints
    // a tuple the backend cannot produce, and Delete's gate reads the half left set.
    const reclaimedRow = { ...finishedRow, reclaimable: true, metadata: { ...finishedRow.metadata } };

    const [row] = applyReindexStub([reclaimedRow], started);

    expect(row.stale).toBe(false);
    expect(row.reclaimable ?? row.stale).toBe(false);
  });

  it('yields both flags to the server once the new run has its own row', () => {
    const serverRow = {
      ...finishedRow,
      reclaimable: true,
      metadata: { ...finishedRow.metadata, state: 'in_progress', task_id: 'new' },
    };

    const [row] = applyReindexStub([serverRow], started);

    expect(row.stale).toBe(true);
    expect(row.reclaimable).toBe(true);
  });

  it('does not invent a control flag for a backend that sends none', () => {
    // Asserted through `?? stale`: what matters is that consumers still fall back,
    // not that the key is absent.
    const legacy = {
      ...finishedRow,
      stale: true,
      metadata: { ...finishedRow.metadata, state: 'in_progress', task_id: 'new' },
    };

    const [row] = applyReindexStub([legacy], started);

    expect(row.reclaimable ?? row.stale).toBe(true);
  });
});

describe('applyReindexStub — run_chunks handover', () => {
  const finished = {
    id: 'row-1',
    stale: true,
    metadata: {
      state: 'failed',
      run_chunks: 1520,
      indexed: 180,
      total: 305,
      task_id: 'dead-run',
    },
  };
  // Mirrors confirmReindex exactly: the clicked row's metadata spread wholesale,
  // plus the stashed pre-click task_id.
  const started = {
    id: 'row-1',
    previousTaskId: 'dead-run',
    metadata: { ...finished.metadata, state: 'in_progress' },
  };

  it('zeroes the finished run’s count while the server still shows the old row', () => {
    const [row] = applyReindexStub([finished], started);

    expect(row.metadata.run_chunks).toBe(0);
  });

  it('yields to the server once its row shows the new run in flight', () => {
    // Without this the stub clobbers every poll and the card freezes at
    // "0 chunks so far" for the whole run — for the one user who clicked Reindex.
    const serverRow = {
      id: 'row-1',
      stale: false,
      metadata: { state: 'in_progress', run_chunks: 3100, indexed: 180, total: 305, task_id: 'live-run' },
    };

    const [row] = applyReindexStub([serverRow], started);

    expect(row.metadata.run_chunks).toBe(3100);
  });

  it('does not invent a count for a backend that sends none', () => {
    // Coercing the absence to 0 would make indexListCounts render "0 chunks so far"
    // for the whole run on an older SDK — and only for the user who clicked Reindex,
    // since everyone else's row still reaches the docs-ratio fallback.
    const serverRow = { id: 'row-1', metadata: { state: 'in_progress', task_id: 'live-run' } };

    const [row] = applyReindexStub([serverRow], started);

    expect(row.metadata.run_chunks).toBeUndefined();
    expect(indexListCounts(row.metadata, true).count).toBe(indexListCounts(serverRow.metadata, true).count);
  });
});

describe('bannerVariant — the remedy must match the control the panel renders', () => {
  const NO_STATS = { isReindex: false };
  const retention = over => ({ hasRetainedData: true, lastSuccessfulRun: null, ...over });

  it('names Stop while the run is unresponsive but not yet reclaimable', () => {
    // In this window runIsLive is still true, so the footer renders Stop and the
    // Reindex button is not in the DOM at all — and the server would refuse a
    // Reindex on the same disconnect rule.
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: true,
      retention: {},
      isReclaimable: false,
    });

    expect(banner.message).toBe(INDEX_UNRESPONSIVE_BANNER_MESSAGE);
    expect(banner.message).not.toContain('Reindex');
  });

  it('defaults to the conservative copy when the caller omits the flag', () => {
    // Defaulting the other way would name a button that is not on screen.
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: true,
    });

    expect(banner.message).toBe(INDEX_UNRESPONSIVE_BANNER_MESSAGE);
  });

  it('names Reindex once the run is reclaimable', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: true,
      retention: {},
      isReclaimable: true,
    });

    expect(banner.message).toBe(INDEX_ABANDONED_BANNER_MESSAGE);
    expect(banner.message).toContain('Reindex');
  });

  it('still appends the retention claim in the unresponsive window', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: true,
      retention: retention(),
      isReclaimable: false,
    });

    expect(banner.message).toContain(INDEX_UNRESPONSIVE_BANNER_MESSAGE);
    expect(banner.message).toContain(INDEX_RETAINED_DATA_MESSAGE);
  });
});

describe('shouldExpireReindexStub — the runner outlives the display flag', () => {
  const base = { stubCreatedAt: 0, now: 10_000, graceMs: 1_000 };

  it('keeps the runner mounted for a run that is only display-stale', () => {
    // A large corpus trips the 300s display horizon mid-promote; unmounting there
    // loses the live transcript and the completion toast on a healthy run.
    expect(shouldExpireReindexStub({ ...base, serverRow: { stale: true, reclaimable: false } })).toBe(false);
  });

  it('expires once the run is genuinely reclaimable', () => {
    expect(shouldExpireReindexStub({ ...base, serverRow: { stale: true, reclaimable: true } })).toBe(true);
  });

  it('falls back to stale when the backend sends no control flag', () => {
    expect(shouldExpireReindexStub({ ...base, serverRow: { stale: true } })).toBe(true);
  });

  it('still expires when the row is gone', () => {
    expect(shouldExpireReindexStub({ ...base, serverRow: undefined })).toBe(true);
  });
});

describe('indexRunControls — display and control must not share a flag', () => {
  const row = over => ({ stale: false, reclaimable: false, ...over });

  it('a run that is only display-stale still counts as live', () => {
    // The window a long promote sits in. Treating it as not-live offers Delete,
    // and Delete drops the whole collection.
    const { runLooksAbandoned, runIsLive } = indexRunControls({
      isIndexing: true,
      index: row({ stale: true, reclaimable: false }),
    });

    expect(runLooksAbandoned).toBe(true);
    expect(runIsLive).toBe(true);
  });

  it('a reclaimable run is no longer live', () => {
    const { runLooksAbandoned, runIsLive } = indexRunControls({
      isIndexing: true,
      index: row({ stale: true, reclaimable: true }),
    });

    expect(runLooksAbandoned).toBe(true);
    expect(runIsLive).toBe(false);
  });

  it('a healthy run is live and looks it', () => {
    const { runLooksAbandoned, runIsLive } = indexRunControls({ isIndexing: true, index: row() });

    expect(runLooksAbandoned).toBe(false);
    expect(runIsLive).toBe(true);
  });

  it('falls back to stale when the backend sends no control flag', () => {
    const { runIsLive } = indexRunControls({
      isIndexing: true,
      index: { stale: true },
    });

    expect(runIsLive).toBe(false);
  });

  it('a row that is not indexing is never live', () => {
    expect(indexRunControls({ isIndexing: false, index: row() }).runIsLive).toBe(false);
  });

  it('an active local override suppresses both flags', () => {
    // A just-observed start proves the row the server is still serving is stale data.
    const { stale, reclaimable, runIsLive } = indexRunControls({
      isIndexing: true,
      index: row({ stale: true, reclaimable: true }),
      localMetaOverride: { state: 'completed' },
    });

    expect(stale).toBe(false);
    expect(reclaimable).toBe(false);
    expect(runIsLive).toBe(true);
  });
});

describe('applyReindexStub — reindexing an abandoned run', () => {
  // The only reachable in-progress Reindex click: the card offers it once the row is
  // reclaimable, and the backend guarantees reclaimable implies stale. So the row the
  // stub stands in for is in_progress AND stale — and handing that flag to the run
  // just started renders it "stopped without finishing" in red.
  const abandoned = {
    id: 'row-1',
    stale: true,
    reclaimable: true,
    metadata: { state: 'in_progress', run_chunks: 1520, task_id: 'dead-run' },
  };
  const started = {
    id: 'row-1',
    previousTaskId: 'dead-run',
    metadata: { ...abandoned.metadata, state: 'in_progress', task_id: 'dead-run' },
  };

  it('does not brand the new run as stopped', () => {
    const [row] = applyReindexStub([abandoned], started);

    expect(row.stale).toBe(false);
  });

  it('does not show the dead run’s chunk count as the new run’s progress', () => {
    const [row] = applyReindexStub([abandoned], started);

    expect(row.metadata.run_chunks).toBe(0);
  });

  it('hands over once the server returns the new run’s own row', () => {
    const newRun = {
      id: 'row-1',
      stale: false,
      metadata: { state: 'in_progress', run_chunks: 400, task_id: 'live-run' },
    };

    const [row] = applyReindexStub([newRun], started);

    expect(row.stale).toBe(false);
    expect(row.metadata.run_chunks).toBe(400);
  });

  it('trusts the server once the new run itself goes stale', () => {
    const deadNewRun = {
      id: 'row-1',
      stale: true,
      metadata: { state: 'in_progress', run_chunks: 400, task_id: 'live-run' },
    };

    expect(applyReindexStub([deadNewRun], started)[0].stale).toBe(true);
  });
});

describe('indexRunControls — the gates the panel used to derive itself', () => {
  // Replaces a test that parsed RunIndexPanel.jsx. That guard asserted spelling:
  // it passed when `effectiveReclaimable` was reassigned from `effectiveStale`
  // (a verbatim revert), passed when the override was wired to the wrong value,
  // and failed on a prettier reflow. Values, not names.
  // Gates passed explicitly as permissive so each case exercises one axis; the
  // conservative defaults get their own cases below.
  const derive = over =>
    indexRunControls({
      isIndexing: true,
      index: { stale: false, reclaimable: false },
      isDeleting: false,
      isRunning: false,
      isWaitingForTaskStart: false,
      ...over,
    });

  it('locks both controls while the run is live', () => {
    const { deleteDisabled, reindexDisabled } = derive();

    expect(deleteDisabled).toBe(true);
    expect(reindexDisabled).toBe(true);
  });

  it('keeps them locked on a merely display-stale run', () => {
    // The long-promote window. Unlocking Delete here drops the whole collection.
    const { deleteDisabled, reindexDisabled } = derive({
      index: { stale: true, reclaimable: false },
    });

    expect(deleteDisabled).toBe(true);
    expect(reindexDisabled).toBe(true);
  });

  it('releases them once the run is reclaimable', () => {
    const { deleteDisabled, reindexDisabled } = derive({
      index: { stale: true, reclaimable: true },
    });

    expect(deleteDisabled).toBe(false);
    expect(reindexDisabled).toBe(false);
  });

  it('keeps Delete locked through the dispatch window', () => {
    // A run whose task is requested but not started has nothing to stop, and must
    // not be deletable either.
    const { deleteDisabled, isAwaitingTaskStart } = derive({
      isIndexing: false,
      isWaitingForTaskStart: true,
    });

    expect(isAwaitingTaskStart).toBe(true);
    expect(deleteDisabled).toBe(true);
  });

  it('ends the dispatch window when the server supersedes the override', () => {
    const { isAwaitingTaskStart } = derive({
      isIndexing: false,
      isWaitingForTaskStart: true,
      serverSupersedes: true,
    });

    expect(isAwaitingTaskStart).toBe(false);
  });

  it('blocks only Reindex when the toolkit cannot build', () => {
    const { deleteDisabled, reindexDisabled } = derive({
      isIndexing: false,
      index: { stale: true, reclaimable: true },
      buildBlockedReason: 'the toolkit has no index_data tool',
    });

    expect(reindexDisabled).toBe(true);
    expect(deleteDisabled).toBe(false);
  });

  it('blocks Delete while a delete is already in flight', () => {
    const { deleteDisabled } = derive({
      isIndexing: false,
      index: { stale: true, reclaimable: true },
      isDeleting: true,
    });

    expect(deleteDisabled).toBe(true);
  });

  it('an active override suppresses both flags and keeps the run live', () => {
    const { stale, reclaimable, runIsLive } = derive({
      index: { stale: true, reclaimable: true },
      localMetaOverride: { state: 'completed' },
    });

    expect([stale, reclaimable, runIsLive]).toEqual([false, false, true]);
  });
});

describe('buildReindexStub round-trips through applyReindexStub', () => {
  // The builder's only caller had no test anywhere in the repo, so deleting the
  // previousTaskId stash reinstated the "new run rendered as stopped" bug with the
  // whole suite green. Round-tripping pins both halves together.
  const abandoned = {
    id: 'row-1',
    stale: true,
    reclaimable: true,
    metadata: { state: 'in_progress', run_chunks: 1520, task_id: 'dead-run' },
  };

  it('produces a stub that keeps the new run out of the stopped state', () => {
    const [row] = applyReindexStub([abandoned], buildReindexStub(abandoned));

    expect(row.stale).toBe(false);
    expect(row.metadata.run_chunks).toBe(0);
    expect(row.metadata.state).toBe('in_progress');
  });

  it('carries the clicked row’s task_id as the pre-click marker', () => {
    expect(buildReindexStub(abandoned).previousTaskId).toBe('dead-run');
  });

  it('marks a row that never had a task_id with null rather than undefined', () => {
    // undefined would still match via ?? null, but null is what the comparison is
    // written against and what a missing stash must not silently imitate.
    const fresh = { id: 'row-2', metadata: { state: 'completed' } };

    expect(buildReindexStub(fresh).previousTaskId).toBeNull();
  });

  it('still hands over once the server returns the new run', () => {
    const newRun = {
      id: 'row-1',
      stale: false,
      metadata: { state: 'in_progress', run_chunks: 900, task_id: 'live-run' },
    };

    const [row] = applyReindexStub([newRun], buildReindexStub(abandoned));

    expect(row.metadata.run_chunks).toBe(900);
  });

  it('a row whose task_id was wiped mid-run is still treated as pre-click', () => {
    // useToolkitChat documents a refetch that can null task_id mid-run; without the
    // `?? null` on the item side that row stops matching and the bug returns.
    const wiped = { ...abandoned, metadata: { ...abandoned.metadata, task_id: undefined } };
    const fromNullRow = buildReindexStub({ id: 'row-1', metadata: { state: 'in_progress' } });

    const [row] = applyReindexStub([wiped], fromNullRow);

    expect(row.stale).toBe(false);
    expect(row.metadata.run_chunks).toBe(0);
  });
});

describe('abandonedRunTooltip — the card must not name a disabled button', () => {
  it('says use Stop while the run is only display-stale', () => {
    // The long-promote window: the row's Reindex button is disabled here, so
    // "Reindex to try again" points at something the user cannot click — and the
    // detail panel for the same run says the opposite.
    const tip = abandonedRunTooltip({ stale: true, reclaimable: false });

    expect(tip).toContain('Stop');
    expect(tip).not.toContain('Reindex');
  });

  it('says Reindex once the run is reclaimable', () => {
    const tip = abandonedRunTooltip({ stale: true, reclaimable: true });

    expect(tip).toContain('Reindex');
  });

  it('falls back to stale when the backend sends no control flag', () => {
    expect(abandonedRunTooltip({ stale: true })).toContain('Reindex');
  });
});

describe('indexRunControls — the arguments the panel used to compute itself', () => {
  // These two were derived at the call site, which no test reached: wiring the
  // override to the wrong value, or hard-coding buildBlocked, survived the suite.
  const abandoned = { stale: true, reclaimable: true };
  const gates = { isDeleting: false, isRunning: false, isWaitingForTaskStart: false };

  it.each([
    ['an override with the server not ahead', { state: 'completed' }, false, false],
    ['an override the server has superseded', { state: 'completed' }, true, true],
    ['no override at all', null, false, true],
    ['no override, server ahead', null, true, true],
  ])('%s', (_label, localMetaOverride, serverSupersedes, expectedStale) => {
    const { stale } = indexRunControls({
      isIndexing: true,
      index: abandoned,
      localMetaOverride,
      serverSupersedes,
      ...gates,
    });

    expect(stale).toBe(expectedStale);
  });

  it('blocks Reindex from the reason string, not a pre-computed boolean', () => {
    const { reindexDisabled } = indexRunControls({
      isIndexing: false,
      index: { stale: true, reclaimable: true },
      buildBlockedReason: 'no index_data tool selected',
      ...gates,
    });

    expect(reindexDisabled).toBe(true);
  });

  it('treats an empty reason as not blocked', () => {
    const { reindexDisabled } = indexRunControls({
      isIndexing: false,
      index: { stale: true, reclaimable: true },
      buildBlockedReason: '',
      ...gates,
    });

    expect(reindexDisabled).toBe(false);
  });
});

describe('indexRunControls — a lost key must fail toward disabled', () => {
  // Every gate defaults to the permissive value in the obvious design, so a key
  // dropped in a refactor silently enables a destructive affordance. These pin the
  // opposite: omission leaves the button stuck, which is visible and safe.
  const reclaimableRow = { isIndexing: false, index: { stale: true, reclaimable: true } };

  it('omitting isDeleting leaves Delete disabled', () => {
    expect(
      indexRunControls({ ...reclaimableRow, isRunning: false, isWaitingForTaskStart: false }).deleteDisabled,
    ).toBe(true);
  });

  it('omitting isWaitingForTaskStart leaves both disabled', () => {
    const { deleteDisabled, reindexDisabled } = indexRunControls({
      ...reclaimableRow,
      isDeleting: false,
      isRunning: false,
    });

    expect([deleteDisabled, reindexDisabled]).toEqual([true, true]);
  });

  it('omitting isRunning leaves Reindex disabled', () => {
    expect(
      indexRunControls({ ...reclaimableRow, isDeleting: false, isWaitingForTaskStart: false })
        .reindexDisabled,
    ).toBe(true);
  });
});

describe('buildReindexStub — the optimistic flip itself', () => {
  // Every other round-trip fixture is already in_progress, so the forced state
  // arrives via the spread either way and dropping it survives. The common case is
  // Reindex on a COMPLETED index, where losing it leaves the card showing
  // `indexed / total` with no spinner for the whole list-GET latency window.
  const completed = {
    id: 'row-1',
    stale: false,
    metadata: { state: 'completed', indexed: 180, total: 305, task_id: 'finished-run' },
  };

  it('flips a completed row to in_progress', () => {
    expect(buildReindexStub(completed).metadata.state).toBe('in_progress');
  });

  it('shows the new run at zero rather than the completed ratio', () => {
    const [row] = applyReindexStub([completed], buildReindexStub(completed));

    expect(row.metadata.state).toBe('in_progress');
    expect(row.metadata.run_chunks).toBe(0);
  });

  it('keeps the previous measurements readable underneath', () => {
    const [row] = applyReindexStub([completed], buildReindexStub(completed));

    expect(row.metadata.indexed).toBe(180);
    expect(row.metadata.total).toBe(305);
  });
});

const GENERIC_FAILURE = BannerMessageMap[BannerSeverity.error];
const NO_STATS = { isReindex: false };

// The shape the backend persists into index metadata when a budget blocks indexing
const budgetError = code =>
  `The budget for shared models has been reached. Requests are unavailable until the budget resets or an administrator raises the limit. code: ${code}`;

describe('bannerVariant — budget blocks', () => {
  it('replaces the failure copy when the error is a budget block', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error: budgetError(BUDGET_ERROR_CODES.PROJECT),
    });

    expect(banner.message).toBe(BUDGET_ERROR_VARIANTS[BUDGET_ERROR_CODES.PROJECT].message);
    expect(banner.message).not.toBe(GENERIC_FAILURE);
  });

  it('uses the member wording when the member budget was the one reached', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error: budgetError(BUDGET_ERROR_CODES.MEMBER),
    });

    expect(banner.message).toBe(BUDGET_ERROR_VARIANTS[BUDGET_ERROR_CODES.MEMBER].message);
  });

  it('never tells the user to check the source connection for a budget block', () => {
    // The reported defect: that advice sends them to investigate the wrong thing, and
    // Reindex cannot succeed until the budget resets
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error: budgetError(BUDGET_ERROR_CODES.PROJECT),
    });

    expect(banner.message).not.toMatch(/source connection/i);
    expect(banner.message).not.toMatch(/Reindex/i);
  });

  it('keeps the error severity and title', () => {
    // Only the message body changes, so the colour and heading logic is untouched
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error: budgetError(BUDGET_ERROR_CODES.PROJECT),
    });

    expect(banner.severity).toBe(BannerSeverity.error);
    expect(banner.label).toBe('Index processing error');
  });
});

describe('bannerVariant — everything else is unchanged', () => {
  it('keeps the generic copy for a non-budget failure', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error: 'Connection refused by the source',
    });

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
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.fail,
      reindexStats: NO_STATS,
      error,
    });

    expect(banner.message).toBe(GENERIC_FAILURE);
  });

  it('ignores a budget error when the index did not fail', () => {
    const inProgress = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: budgetError(BUDGET_ERROR_CODES.PROJECT),
    });

    expect(inProgress.severity).toBe(BannerSeverity.info);
  });

  it('still reports an in-flight index as in progress', () => {
    expect(
      bannerVariant({ isIndexing: true, state: IndexStatuses.fail, reindexStats: NO_STATS }).severity,
    ).toBe(BannerSeverity.info);
  });

  it('still reports a cancelled index as stopped', () => {
    expect(
      bannerVariant({ isIndexing: false, state: IndexStatuses.cancelled, reindexStats: NO_STATS }).severity,
    ).toBe(BannerSeverity.warning);
  });
});

describe('bannerVariant — abandoned run', () => {
  it('reports a stale in_progress run as stopped, not indexing', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.progress,
      reindexStats: NO_STATS,
      error: undefined,
      isStale: true,
      retention: {},
      isReclaimable: true,
    });

    expect(banner.severity).toBe(BannerSeverity.warning);
    expect(banner.label).toBe('Stopped');
    expect(banner.message).toBe(INDEX_ABANDONED_BANNER_MESSAGE);
  });

  it('wins over the in-flight signal, which a stale row still reads as', () => {
    expect(
      bannerVariant({
        isIndexing: true,
        state: IndexStatuses.progress,
        reindexStats: NO_STATS,
        error: undefined,
        isStale: true,
      }).severity,
    ).toBe(BannerSeverity.warning);
  });

  it('never applies to a terminal state, whatever the stale flag says', () => {
    expect(
      bannerVariant({
        isIndexing: false,
        state: IndexStatuses.fail,
        reindexStats: NO_STATS,
        error: undefined,
        isStale: true,
      }).severity,
    ).toBe(BannerSeverity.error);
  });

  it('leaves a fresh in_progress run reported as indexing', () => {
    expect(
      bannerVariant({
        isIndexing: false,
        state: IndexStatuses.progress,
        reindexStats: NO_STATS,
        error: undefined,
        isStale: false,
      }).severity,
    ).toBe(BannerSeverity.info);
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
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.success,
      reindexStats: {
        latestEntry: runEntry({ indexed: 179, skipped: 12, total: 191 }),
      },
    });

    expect(banner.severity).toBe(BannerSeverity.success);
    expect(banner.message).toContain('179 pages indexed, 12 pages skipped');
    expect(banner.message).not.toContain('unsupported format');
  });

  it('says a run that changed nothing is up to date', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.success,
      reindexStats: {
        latestEntry: runEntry({ indexed: 0, unchanged: 196, total: 196 }),
      },
    });

    expect(banner.message).toContain('Up to date \u2014 196 pages unchanged');
    expect(banner.message).not.toContain('0 pages');
  });

  it('applies to scheduled and partial runs, not just completed ones', () => {
    for (const state of [IndexStatuses.scheduledReindex, IndexStatuses.partlyOk]) {
      const banner = bannerVariant({
        isIndexing: false,
        state,
        reindexStats: {
          latestEntry: runEntry({ indexed: 5, total: 5 }),
        },
      });

      expect(banner.severity).toBe(BannerSeverity.success);
      expect(banner.message).toContain('5 pages indexed');
    }
  });

  it('falls back to the generic copy when a run carries no report', () => {
    const banner = bannerVariant({
      isIndexing: false,
      state: IndexStatuses.success,
      reindexStats: { latestEntry: null },
    });

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

// The same four cases as its display twin, side by side: the two differ by one token.
describe('isReclaimableRun', () => {
  const run = (state, extra = {}) => ({ metadata: { state }, ...extra });

  it('flags a run the backend will let another run reclaim', () => {
    expect(isReclaimableRun(run(IndexStatuses.progress, { stale: true, reclaimable: true }))).toBe(true);
  });

  it('leaves a run that is only display-stale alone', () => {
    // A healthy run crosses the five-interval display horizon while mid-promote.
    expect(isReclaimableRun(run(IndexStatuses.progress, { stale: true, reclaimable: false }))).toBe(false);
  });

  it('falls back to stale when the backend sends no control flag', () => {
    expect(isReclaimableRun(run(IndexStatuses.progress, { stale: true }))).toBe(true);
    expect(isReclaimableRun(run(IndexStatuses.progress))).toBe(false);
  });

  it('ignores reclaimable rows that already reached a terminal state', () => {
    // The flag is heartbeat age, which the backend keeps asserting after a row has
    // terminated.
    expect(isReclaimableRun(run(IndexStatuses.success, { reclaimable: true }))).toBe(false);
    expect(isReclaimableRun(run(IndexStatuses.fail, { reclaimable: true }))).toBe(false);
  });

  it('tolerates a missing index or metadata', () => {
    expect(isReclaimableRun(undefined)).toBe(false);
    expect(isReclaimableRun({})).toBe(false);
  });
});
