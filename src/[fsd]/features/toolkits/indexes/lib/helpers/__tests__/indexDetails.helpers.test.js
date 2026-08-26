import { describe, expect, it } from 'vitest';

import {
  BannerMessageMap,
  BannerSeverity,
  INDEX_DATA_DISABLED_REASON,
  INDEX_SEARCH_TOOL_OPTIONS,
  INTERRUPTED_BANNER,
  IndexStatuses,
} from '../../constants/indexDetails.constants';
import {
  bannerOutlivesRun,
  bannerVariant,
  hasLiveRun,
  indexBuildBlockedReason,
  indexScheduleBlockedReason,
  indexSearchBlockedReason,
  indexSearchToolOptions,
  isRecoveryBlocked,
} from '../indexDetails.helpers';

const runState = over => ({ isIndexing: true, canStopIndexing: false, isStale: false, ...over });

describe('bannerVariant — interrupted runs', () => {
  const NO_STATS = { isReindex: false };

  it('reports an interrupted run with retry guidance, not the "Indexing…" copy', () => {
    const banner = bannerVariant(false, IndexStatuses.interrupted, NO_STATS);

    expect(banner.severity).toBe(BannerSeverity.warning);
    expect(banner.label).toBe(INTERRUPTED_BANNER.label);
    expect(banner.message).toBe(INTERRUPTED_BANNER.message);
  });

  it('does not reuse the user-initiated Stop copy', () => {
    const banner = bannerVariant(false, IndexStatuses.interrupted, NO_STATS);

    expect(banner.message).not.toBe(BannerMessageMap[BannerSeverity.warning]);
    expect(banner.label).not.toBe('Stopped');
  });
});

describe('bannerVariant — unresponsive runs', () => {
  it('replaces the in-progress copy for a run the backend has not heard from', () => {
    const banner = bannerVariant(false, IndexStatuses.unresponsive, { isReindex: false });

    expect(banner.severity).toBe(BannerSeverity.warning);
    expect(banner.message).not.toMatch(/you'll be notified/i);
  });

  it('does not claim the run is over, which only the reclaim decides', () => {
    const banner = bannerVariant(false, IndexStatuses.unresponsive, { isReindex: false });

    expect(banner.label).not.toBe(INTERRUPTED_BANNER.label);
    expect(banner.message).not.toMatch(/stopped without finishing/i);
  });
});

describe('hasLiveRun', () => {
  it('holds while indexing and nothing says the run died', () => {
    expect(hasLiveRun(runState())).toBe(true);
  });

  it('clears once the backend marks an unstoppable run stale', () => {
    expect(hasLiveRun(runState({ isStale: true }))).toBe(false);
  });

  it('holds for a stale run this panel can still stop', () => {
    expect(hasLiveRun(runState({ isStale: true, canStopIndexing: true }))).toBe(true);
  });

  it('clears when no run is in flight', () => {
    expect(hasLiveRun(runState({ isIndexing: false }))).toBe(false);
  });
});

describe('isRecoveryBlocked', () => {
  it('opens recovery for the reported run: silent, but still holding a task id', () => {
    // hasLiveRun stays true for it — a stuck row keeps its task_id on purpose — so
    // gating on that alone leaves the ticket's own run unrecoverable here.
    expect(isRecoveryBlocked({ runIsLive: true, isUnresponsiveRun: true })).toBe(false);
  });

  it('keeps recovery shut while a run is genuinely reporting progress', () => {
    expect(isRecoveryBlocked({ runIsLive: true, isUnresponsiveRun: false })).toBe(true);
  });

  it('leaves recovery open when no run is in flight at all', () => {
    expect(isRecoveryBlocked({ runIsLive: false, isUnresponsiveRun: false })).toBe(false);
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

  it('blocks states that never produced searchable data', () => {
    expect(indexSearchBlockedReason(IndexStatuses.fail, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(IndexStatuses.cancelled, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(IndexStatuses.created, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(undefined, allSearchTools)).toMatch(/not ready/);
  });

  it('no longer claims an interrupted run is in progress', () => {
    expect(indexSearchBlockedReason(IndexStatuses.interrupted, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(IndexStatuses.interrupted, allSearchTools)).not.toMatch(/in progress/);
  });

  it('blocks a searchable index whose toolkit exposes no search tool', () => {
    expect(indexSearchBlockedReason(IndexStatuses.success, ['index_data'])).toMatch(
      /No search tools are enabled/,
    );
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
      indexScheduleBlockedReason(scheduleState({ scheduleEnabled: true, state: IndexStatuses.interrupted })),
    ).toMatch(/stopped\/error state/);
    expect(
      indexScheduleBlockedReason(scheduleState({ scheduleEnabled: true, hasSchedulePermission: false })),
    ).toMatch(/Insufficient permissions/);
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
