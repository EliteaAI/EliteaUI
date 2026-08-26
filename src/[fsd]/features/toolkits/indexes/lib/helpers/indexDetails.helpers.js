import { summarizeIndexingReport } from '@/[fsd]/entities/indexing-report';
import {
  BANNER_SUCCESS_SUFFIX,
  BannerMessageMap,
  BannerSeverity,
  BannerTitleMap,
  INDEX_DATA_DISABLED_REASON,
  INDEX_SEARCH_TOOL_OPTIONS,
  INTERRUPTED_BANNER,
  IndexStatuses,
  IndexesToolsEnum,
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

export const bannerVariant = (isIndexing, state, reindexStats, error) => {
  if (isIndexing)
    return {
      severity: BannerSeverity.info,
      label: BannerTitleMap[BannerSeverity.info],
      message: BannerMessageMap[BannerSeverity.info],
    };
  if (state === IndexStatuses.progress)
    return {
      severity: BannerSeverity.info,
      label: BannerTitleMap[BannerSeverity.info],
      message: BannerMessageMap[BannerSeverity.info],
    };
  if (state === IndexStatuses.fail)
    return {
      severity: BannerSeverity.error,
      label: BannerTitleMap[BannerSeverity.error],
      // A budget block is not a source-connection problem, and Reindex cannot succeed
      // until the budget resets — the default copy would send the user the wrong way
      message: budgetErrorMessage(error) || BannerMessageMap[BannerSeverity.error],
    };
  if (state === IndexStatuses.cancelled)
    return {
      severity: BannerSeverity.warning,
      label: BannerTitleMap[BannerSeverity.warning],
      message: BannerMessageMap[BannerSeverity.warning],
    };
  if (state === IndexStatuses.interrupted)
    return {
      severity: BannerSeverity.warning,
      label: INTERRUPTED_BANNER.label,
      message: INTERRUPTED_BANNER.message,
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
 * Preserves the rule the embedded search enforced by only ever mounting itself for a success banner,
 * and doubles as the tooltip for every disabled search affordance so they never explain themselves
 * differently.
 * @param {string} state - `metadata.state` of the index row
 * @param {string[]} selectedTools - the toolkit's `settings.selected_tools`
 * @returns {string | null} the reason, or null when the index can be searched
 */
export const indexSearchBlockedReason = (state, selectedTools) => {
  if (state === IndexStatuses.progress) return 'Unavailable while indexing is in progress';
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
 *   buildBlockedReason: string | null}} scheduleState
 * @returns {string | null} the reason, or null when scheduling can be changed
 */
export const indexScheduleBlockedReason = ({
  state,
  hasSchedulePermission,
  projectName,
  scheduleEnabled,
  buildBlockedReason,
}) => {
  if (
    state === IndexStatuses.cancelled ||
    state === IndexStatuses.fail ||
    state === IndexStatuses.interrupted
  )
    return 'Scheduling is unavailable while the index is in a stopped/error state';
  if (!hasSchedulePermission)
    return `Insufficient permissions to perform this action on ${projectName} project`;
  if (scheduleEnabled) return null;
  if (buildBlockedReason) return buildBlockedReason;
  if (!RUNNABLE_INDEX_STATUSES.includes(state) && state !== IndexStatuses.progress)
    return 'Index state is not valid';
  return null;
};

/**
 * A run that may still be executing: it is stoppable, or the backend has not marked it stale.
 * @param {{isIndexing: boolean, canStopIndexing: boolean, isStale: boolean}} runState
 * @returns {boolean}
 */
export const hasLiveRun = ({ isIndexing, canStopIndexing, isStale }) =>
  Boolean(isIndexing) && (Boolean(canStopIndexing) || !isStale);

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
