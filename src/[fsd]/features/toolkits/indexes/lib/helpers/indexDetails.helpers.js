import { summarizeIndexingReport } from '@/[fsd]/entities/indexing-report';
import {
  BANNER_SUCCESS_SUFFIX,
  BannerMessageMap,
  BannerSeverity,
  BannerTitleMap,
  INDEX_ABANDONED_BANNER_MESSAGE,
  INDEX_DATA_DISABLED_REASON,
  INDEX_RETAINED_DATA_MESSAGE,
  INDEX_SEARCH_TOOL_OPTIONS,
  IndexStatuses,
  IndexesToolsEnum,
  REINDEX_FAILED_BANNER_MESSAGE,
  REINDEX_FAILED_BANNER_TITLE,
  REINDEX_IN_PROGRESS_BANNER_MESSAGE,
  REINDEX_IN_PROGRESS_BANNER_TITLE,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { BUDGET_ERROR_VARIANTS } from '@/[fsd]/shared/lib/constants/budgetError.constants';

// The scope code the backend puts in the persisted index error. Reusing the shared copy
// keeps the banner and the message below it from drifting apart.
export const budgetErrorMessage = error => {
  if (typeof error !== 'string') return null;

  const code = Object.keys(BUDGET_ERROR_VARIANTS).find(scope => error.includes(scope));

  return code ? BUDGET_ERROR_VARIANTS[code].message : null;
};

export const formatDate = ts => {
  if (!ts) return '—';
  try {
    const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);

    if (Number.isNaN(d.getTime())) return '—';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return '—';
  }
};

export const bannerVariant = (isIndexing, state, reindexStats, error, isStale = false, retention = {}) => {
  const { hasRetainedData = false, lastSuccessfulRun = null } = retention;
  // Before the isIndexing branch: a stale row still reads as "in flight" to every
  // other signal, and an eternal "Indexing…" spinner is the bug this variant fixes.
  if (state === IndexStatuses.progress && isStale)
    return {
      severity: BannerSeverity.warning,
      label: BannerTitleMap[BannerSeverity.warning],
      // An interrupted run's writes were never visible, so a live chunk count means
      // the previous generation is still being served — say so under the warning.
      message: hasRetainedData
        ? `${INDEX_ABANDONED_BANNER_MESSAGE} ${INDEX_RETAINED_DATA_MESSAGE}`
        : INDEX_ABANDONED_BANNER_MESSAGE,
    };
  if (isIndexing || state === IndexStatuses.progress) {
    if (hasRetainedData)
      return {
        severity: BannerSeverity.info,
        label: REINDEX_IN_PROGRESS_BANNER_TITLE,
        message: REINDEX_IN_PROGRESS_BANNER_MESSAGE,
      };
    return {
      severity: BannerSeverity.info,
      label: BannerTitleMap[BannerSeverity.info],
      message: BannerMessageMap[BannerSeverity.info],
    };
  }
  if (state === IndexStatuses.fail) {
    // A budget block is not a source-connection problem, and Reindex cannot succeed
    // until the budget resets — the default copy would send the user the wrong way
    const budgetMessage = budgetErrorMessage(error);
    if (hasRetainedData) {
      const cause = budgetMessage
        ? `${budgetMessage} ${INDEX_RETAINED_DATA_MESSAGE}`
        : REINDEX_FAILED_BANNER_MESSAGE;
      const lastIndexedOn = lastSuccessfulRun?.updated_on;
      return {
        severity: BannerSeverity.error,
        label: REINDEX_FAILED_BANNER_TITLE,
        message: lastIndexedOn ? `${cause} Last successful indexing: ${formatDate(lastIndexedOn)}.` : cause,
      };
    }
    return {
      severity: BannerSeverity.error,
      label: BannerTitleMap[BannerSeverity.error],
      message: budgetMessage || BannerMessageMap[BannerSeverity.error],
    };
  }
  if (state === IndexStatuses.cancelled)
    return {
      severity: BannerSeverity.warning,
      label: BannerTitleMap[BannerSeverity.warning],
      message: hasRetainedData
        ? `${BannerMessageMap[BannerSeverity.warning]} ${INDEX_RETAINED_DATA_MESSAGE}`
        : BannerMessageMap[BannerSeverity.warning],
    };
  if (RUNNABLE_INDEX_STATUSES.includes(state)) {
    // Only the run's own breakdown knows what it indexed and in what units.
    const breakdown = summarizeIndexingReport(reindexStats?.latestEntry);
    return {
      severity: BannerSeverity.success,
      label: BannerTitleMap[BannerSeverity.success],
      message: breakdown
        ? `${breakdown}. ${BANNER_SUCCESS_SUFFIX}`
        : BannerMessageMap[BannerSeverity.success],
    };
  }
  return {
    severity: BannerSeverity.info,
    label: BannerTitleMap[BannerSeverity.info],
    message: BannerMessageMap[BannerSeverity.info],
  };
};

export const indexSearchToolOptions = selectedTools =>
  INDEX_SEARCH_TOOL_OPTIONS.filter(option => (selectedTools || []).includes(option.value));

/**
 * The single retention predicate: `indexed_chunks` is the live pending-excluded count the backend
 * recomputes when a run fails, so it is the only field that proves searchable rows exist. It must
 * never be replaced by `last_successful_run` — that is a remembered history entry which stays
 * non-null over an EMPTY index (zero-chunk completed first run, whole-index delete), and gating on
 * it would claim retained data that does not exist.
 * @param {object} metadata - `metadata` of the index row
 * @returns {boolean}
 */
export const hasRetainedIndexData = metadata => Number(metadata?.indexed_chunks) > 0;

/**
 * Preserves the rule the embedded search enforced by only ever mounting itself for a success banner,
 * and doubles as the tooltip for every disabled search affordance so they never explain themselves
 * differently.
 * @param {string} state - `metadata.state` of the index row
 * @param {string[]} selectedTools - the toolkit's `settings.selected_tools`
 * @param {boolean} [isAbandoned] - the row is in progress but the backend marked it stale
 * @param {boolean} [hasRetainedData] - {@link hasRetainedIndexData} of the index row
 * @returns {string | null} the reason, or null when the index can be searched
 */
export const indexSearchBlockedReason = (
  state,
  selectedTools,
  isAbandoned = false,
  hasRetainedData = false,
) => {
  // A reindex never touches the previous generation until it succeeds, so a run in
  // flight — or one that failed or was stopped — over retained data leaves that data
  // searchable.
  const servesRetainedData =
    hasRetainedData &&
    (state === IndexStatuses.progress || state === IndexStatuses.fail || state === IndexStatuses.cancelled);
  if (servesRetainedData) {
    if (!indexSearchToolOptions(selectedTools).length) return 'No search tools are enabled for this toolkit';
    return null;
  }
  // An abandoned run's writes were invisible like any pending run's, so the previous
  // generation is exactly intact — but without a live chunk count nothing is proven
  // searchable, so only the wording changes, via the not-ready fall-through.
  if (state === IndexStatuses.progress && !isAbandoned) return 'Unavailable while indexing is in progress';
  if (!RUNNABLE_INDEX_STATUSES.includes(state)) return 'Index is not ready to search yet';
  if (!indexSearchToolOptions(selectedTools).length) return 'No search tools are enabled for this toolkit';
  return null;
};

/**
 * Every build starts the toolkit's `index_data` tool, and the backend resets the row's counts to an
 * `in_progress` stub before the worker discovers the tool is missing — so a build the toolkit cannot run
 * destroys the healthy index's metadata rather than leaving it untouched. Doubles as the tooltip for every
 * disabled build affordance.
 *
 * An empty or absent list is the platform's unrestricted state, not "no tools": every toolkit filters with
 * `if selected_tools:` and exposes everything when it is empty.
 * @param {string[]} selectedTools - the toolkit's `settings.selected_tools`
 * @returns {string | null} the reason, or null when the index can be rebuilt
 */
export const indexBuildBlockedReason = selectedTools => {
  const restrictsTools = Array.isArray(selectedTools) && selectedTools.length > 0;
  if (!restrictsTools || selectedTools.includes(IndexesToolsEnum.indexData)) return null;
  return INDEX_DATA_DISABLED_REASON;
};

/**
 * An armed schedule must always stay switchable-off: the scheduler fires `index_data` every tick with no
 * toolset check of its own, so greying out the control while a cron is live would trap the user with a job
 * that keeps resetting the index. Every reason therefore has to sit behind the `scheduleEnabled` escape
 * hatch, which gates arming only.
 * @param {{state: string, hasSchedulePermission: boolean, projectName: string, scheduleEnabled: boolean,
 *   buildBlockedReason: string | null, hasRetainedData?: boolean}} scheduleState
 * @returns {string | null} the reason, or null when scheduling can be changed
 */
export const indexScheduleBlockedReason = ({
  state,
  hasSchedulePermission,
  projectName,
  scheduleEnabled,
  buildBlockedReason,
  hasRetainedData = false,
}) => {
  // A failed reindex over retained data leaves a healthy searchable index behind it,
  // so a scheduled retry has something valid to rebuild from.
  const failedOverRetainedData = state === IndexStatuses.fail && hasRetainedData;
  if (state === IndexStatuses.cancelled || (state === IndexStatuses.fail && !failedOverRetainedData))
    return 'Scheduling is unavailable while the index is in a stopped/error state';
  if (!hasSchedulePermission)
    return `Insufficient permissions to perform this action on ${projectName} project`;
  if (scheduleEnabled) return null;
  if (buildBlockedReason) return buildBlockedReason;
  if (!RUNNABLE_INDEX_STATUSES.includes(state) && state !== IndexStatuses.progress && !failedOverRetainedData)
    return 'Index state is not valid';
  return null;
};

/**
 * A run the backend has marked stale while it still claims to be in progress: the process died
 * without ever reporting a terminal state, so nothing else will ever update it.
 * @param {object} index - Index row as returned by the indexes list
 * @returns {boolean}
 */
export const isAbandonedRun = index =>
  Boolean(index?.stale) && index?.metadata?.state === IndexStatuses.progress;

/**
 * A run that may still be executing. Stoppability is deliberately not consulted: a run
 * that died without a terminal write keeps its `task_id` forever, so "the panel could
 * send a Stop" is true for every dead row and cannot veto the backend's stale verdict.
 * @param {{isIndexing: boolean, isStale: boolean}} runState
 * @returns {boolean}
 */
export const hasLiveRun = ({ isIndexing, isStale }) => Boolean(isIndexing) && !isStale;

/**
 * Whether the optimistic reindex stub should be dropped for what the server returned.
 * A missing row means the index was deleted — the stub has nothing to stand in for.
 * A stale row is trusted only after a grace period: the first fetches after the click
 * still return the old dead row, and expiring on it would unmount the dispatch runner
 * mid-flight, leaving the new run untracked.
 * @param {{serverRow: object | undefined, stubCreatedAt: number | undefined, now: number,
 *   graceMs: number}} expiryState
 * @returns {boolean}
 */
export const shouldExpireReindexStub = ({ serverRow, stubCreatedAt, now, graceMs }) =>
  !serverRow || (Boolean(serverRow.stale) && now - (stubCreatedAt ?? 0) > graceMs);

/**
 * Whether a status banner should stay on screen once its run's transcript is gone, i.e. on a fresh
 * visit. `error` and `warning` do, so a failed or stopped run keeps its retry guidance and its
 * budget-block copy instead of looking untouched. `success` does not — the idle design shows a
 * finished index with no banner, and the left panel already reports what it indexed. `info` must not,
 * because {@link bannerVariant} uses it as the catch-all for `created`/unknown, so persisting it would
 * make a never-indexed row claim a run is under way.
 * @param {string} severity - `severity` from {@link bannerVariant}
 * @returns {boolean}
 */
export const bannerOutlivesRun = severity =>
  severity === BannerSeverity.error || severity === BannerSeverity.warning;
