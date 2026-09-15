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
  applyReindexStub,
  bannerOutlivesRun,
  bannerVariant,
  hasLiveRun,
  hasRetainedIndexData,
  indexBuildBlockedReason,
  indexListCounts,
  indexRunControls,
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
    // `true` for isReclaimable: this is the abandoned case, where Reindex is the
    // remedy the panel actually offers.
    const banner = bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, true, retention(), true);

    expect(banner.severity).toBe(BannerSeverity.warning);
    expect(banner.message).toContain(INDEX_ABANDONED_BANNER_MESSAGE);
    expect(banner.message).toContain(INDEX_RETAINED_DATA_MESSAGE);
  });

  it('makes no retention claim for a stale run without a live chunk count', () => {
    const banner = bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, true, {}, true);

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

  it('treats a server row in flight with no count yet as zero', () => {
    const serverRow = { id: 'row-1', metadata: { state: 'in_progress', task_id: 'live-run' } };

    const [row] = applyReindexStub([serverRow], started);

    expect(row.metadata.run_chunks).toBe(0);
  });
});

describe('bannerVariant — the remedy must match the control the panel renders', () => {
  const NO_STATS = { isReindex: false };
  const retention = over => ({ hasRetainedData: true, lastSuccessfulRun: null, ...over });

  it('names Stop while the run is unresponsive but not yet reclaimable', () => {
    // In this window runIsLive is still true, so the footer renders Stop and the
    // Reindex button is not in the DOM at all — and the server would refuse a
    // Reindex on the same disconnect rule.
    const banner = bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, true, {}, false);

    expect(banner.message).toBe(INDEX_UNRESPONSIVE_BANNER_MESSAGE);
    expect(banner.message).not.toContain('Reindex');
  });

  it('defaults to the conservative copy when the caller omits the flag', () => {
    // Defaulting the other way would name a button that is not on screen.
    const banner = bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, true);

    expect(banner.message).toBe(INDEX_UNRESPONSIVE_BANNER_MESSAGE);
  });

  it('names Reindex once the run is reclaimable', () => {
    const banner = bannerVariant(false, IndexStatuses.progress, NO_STATS, undefined, true, {}, true);

    expect(banner.message).toBe(INDEX_ABANDONED_BANNER_MESSAGE);
    expect(banner.message).toContain('Reindex');
  });

  it('still appends the retention claim in the unresponsive window', () => {
    const banner = bannerVariant(
      false,
      IndexStatuses.progress,
      NO_STATS,
      undefined,
      true,
      retention(),
      false,
    );

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
      overrideSupersedesRun: true,
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
