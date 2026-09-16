import { resolveIndexingReport, summarizeIndexingReport } from '@/[fsd]/entities/indexing-report';
import {
  BANNER_SUCCESS_SUFFIX,
  BannerIcon,
  BannerMessageMap,
  BannerSeverity,
  BannerTitleMap,
  INDEX_ABANDONED_BANNER_MESSAGE,
  INDEX_ABANDONED_TOOLTIP,
  INDEX_DATA_DISABLED_REASON,
  INDEX_DOCS_RATIO_TOOLTIP,
  INDEX_FAILURE_BANNER_PREFIX,
  INDEX_FAILURE_BANNER_SUFFIX,
  INDEX_PARTIAL_BANNER_MESSAGE,
  INDEX_PARTIAL_BANNER_SUFFIX,
  INDEX_PARTIAL_BANNER_TITLE,
  INDEX_REINDEXED_RATIO_TOOLTIP,
  INDEX_RETAINED_DATA_MESSAGE,
  INDEX_RUN_CHUNKS_TOOLTIP,
  INDEX_SEARCH_TOOL_OPTIONS,
  INDEX_UNRESPONSIVE_BANNER_MESSAGE,
  INDEX_UNRESPONSIVE_TOOLTIP,
  IndexStatuses,
  IndexesToolsEnum,
  REINDEX_FAILED_BANNER_MESSAGE,
  REINDEX_FAILED_BANNER_TITLE,
  REINDEX_FAILED_GUIDANCE,
  REINDEX_IN_PROGRESS_BANNER_MESSAGE,
  REINDEX_IN_PROGRESS_BANNER_TITLE,
  RUNNABLE_INDEX_STATUSES,
  TERMINAL_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { BUDGET_ERROR_VARIANTS } from '@/[fsd]/shared/lib/constants/budgetError.constants';

// The scope code the backend puts in the persisted index error. Reusing the shared copy
// keeps the banner and the message below it from drifting apart.
export const budgetErrorMessage = error => {
  if (typeof error !== 'string') return null;

  const code = Object.keys(BUDGET_ERROR_VARIANTS).find(scope => error.includes(scope));

  return code ? BUDGET_ERROR_VARIANTS[code].message : null;
};

const STORED_ERROR_MAX_LENGTH = 200;
const SENTENCE_TERMINATORS = ['.', '!', '?', '…'];

const asBannerSentence = text => {
  if (typeof text !== 'string') return null;

  const [firstLine = ''] = text.split('\n');
  const trimmed = firstLine.trim();
  if (!trimmed) return null;

  if (trimmed.length > STORED_ERROR_MAX_LENGTH) {
    return `${trimmed.slice(0, STORED_ERROR_MAX_LENGTH).trimEnd()}…`;
  }

  return SENTENCE_TERMINATORS.some(mark => trimmed.endsWith(mark)) ? trimmed : `${trimmed}.`;
};

export const reportedFailureMessage = (error, currentRunEntry) => {
  const sampled = resolveIndexingReport(currentRunEntry)?.errors?.[0];
  const errorWasRenderedFromThisReport =
    typeof error === 'string' && typeof sampled === 'string' && error.includes(sampled);

  return errorWasRenderedFromThisReport ? asBannerSentence(sampled) : asBannerSentence(error);
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

export const bannerVariant = ({
  isIndexing,
  state,
  reindexStats,
  error,
  isStale = false,
  retention = {},
  isReclaimable = false,
}) => {
  const { hasRetainedData = false, lastSuccessfulRun = null } = retention;
  // Before the isIndexing branch: a stale row still reads as "in flight" to every
  // other signal, and an eternal "Indexing…" spinner is the bug this variant fixes.
  if (state === IndexStatuses.progress && isStale)
    return {
      severity: BannerSeverity.warning,
      label: BannerTitleMap[BannerSeverity.warning],
      // An interrupted run's writes were never visible, so a live chunk count means
      // the previous generation is still being served — say so under the warning.
      message: [
        isReclaimable ? INDEX_ABANDONED_BANNER_MESSAGE : INDEX_UNRESPONSIVE_BANNER_MESSAGE,
        hasRetainedData ? INDEX_RETAINED_DATA_MESSAGE : null,
      ]
        .filter(Boolean)
        .join(' '),
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
    const reportedCause = budgetMessage ? null : reportedFailureMessage(error, reindexStats?.currentRunEntry);
    if (hasRetainedData) {
      const budgetCause = budgetMessage && `${budgetMessage} ${INDEX_RETAINED_DATA_MESSAGE}`;
      const reportedFailureCause =
        reportedCause && `${reportedCause} ${INDEX_RETAINED_DATA_MESSAGE} ${REINDEX_FAILED_GUIDANCE}`;
      const cause = budgetCause || reportedFailureCause || REINDEX_FAILED_BANNER_MESSAGE;
      const lastIndexedOn = lastSuccessfulRun?.updated_on;
      return {
        severity: BannerSeverity.error,
        label: REINDEX_FAILED_BANNER_TITLE,
        message: lastIndexedOn ? `${cause} Last successful indexing: ${formatDate(lastIndexedOn)}.` : cause,
      };
    }
    const reportedFailure = reportedCause
      ? `${INDEX_FAILURE_BANNER_PREFIX} ${reportedCause} ${INDEX_FAILURE_BANNER_SUFFIX}`
      : BannerMessageMap[BannerSeverity.error];
    return {
      severity: BannerSeverity.error,
      label: BannerTitleMap[BannerSeverity.error],
      message: budgetMessage || reportedFailure,
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
  if (state === IndexStatuses.partlyOk) {
    const breakdown = summarizeIndexingReport(reindexStats?.latestEntry);
    return {
      severity: BannerSeverity.warning,
      icon: BannerIcon.attention,
      label: INDEX_PARTIAL_BANNER_TITLE,
      message: breakdown ? `${breakdown}. ${INDEX_PARTIAL_BANNER_SUFFIX}` : INDEX_PARTIAL_BANNER_MESSAGE,
    };
  }
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

const isTerminalIndexState = state => TERMINAL_INDEX_STATUSES.includes(state);

export const shouldDropIndexStateOverride = (overrideState, serverState, rowReadAfterOverride) => {
  if (!overrideState || !serverState) return false;
  if (overrideState === serverState) return true;

  return (
    Boolean(rowReadAfterOverride) && isTerminalIndexState(overrideState) && isTerminalIndexState(serverState)
  );
};

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
 * The control flag, with the fallback every reader needs while an older backend is
 * still sending `stale` alone. One definition on purpose: this is the flag that
 * authorizes Delete, Reindex, Stop and supersede, so a missed copy arms a destructive
 * control on a live run. When the fallback is retired it goes from here only.
 * @param {object} row - an index list row, or a stub standing in for one
 * @returns {boolean}
 */
export const hasReclaimableFlag = row => Boolean(row?.reclaimable ?? row?.stale);

/**
 * The control-flag counterpart of {@link isAbandonedRun}, for surfaces that retire a run
 * rather than decorate it. See {@link indexRunControls} for the split.
 * @param {object} index - Index row as returned by the indexes list
 * @returns {boolean}
 */
export const isReclaimableRun = index =>
  hasReclaimableFlag(index) && index?.metadata?.state === IndexStatuses.progress;

/**
 * A run that may still be executing. Stoppability is deliberately not consulted: a run
 * that died without a terminal write keeps its `task_id` forever, so "the panel could
 * send a Stop" is true for every dead row and cannot veto the backend's stale verdict.
 * @param {{isIndexing: boolean, isStale: boolean}} runState
 * @returns {boolean}
 */
export const hasLiveRun = ({ isIndexing, isStale }) => Boolean(isIndexing) && !isStale;

/**
 * Split the two questions a run's row answers, so a component cannot answer one with
 * the other's flag.
 *
 * `stale` is DISPLAY — banner severity and copy; being wrong costs a misleading card.
 * `reclaimable` is CONTROL — it gates Delete, which drops the whole collection, plus
 * Reindex and Stop; being wrong destroys a live run. The two disagree for as long as
 * the disconnect timeout exceeds the display horizon, which is the normal case.
 *
 * Returns the disabled states as well as the flags, so the panel keeps no derivation
 * of its own.
 * @param {object} runState
 * @returns {{stale: boolean, reclaimable: boolean, runLooksAbandoned: boolean,
 *   runIsLive: boolean, isAwaitingTaskStart: boolean, deleteDisabled: boolean,
 *   reindexDisabled: boolean}}
 */
export const indexRunControls = ({
  isIndexing,
  index,
  localMetaOverride = null,
  serverSupersedes = false,
  buildBlockedReason = null,
  // `false` is the permissive value for all three, so a key lost in a refactor would
  // degrade toward enabling Delete. Defaulting to disabled makes an omission show up
  // as a stuck button instead.
  isDeleting = true,
  isRunning = true,
  isWaitingForTaskStart = true,
}) => {
  const overrideSupersedesRun = Boolean(localMetaOverride?.state && !serverSupersedes);
  const buildBlocked = Boolean(buildBlockedReason);
  const stale = overrideSupersedesRun ? false : Boolean(index?.stale);
  const reclaimable = overrideSupersedesRun ? false : hasReclaimableFlag(index);
  const runIsLive = hasLiveRun({ isIndexing, isStale: reclaimable });
  const isAwaitingTaskStart = Boolean(isWaitingForTaskStart) && !serverSupersedes;

  return {
    stale,
    reclaimable,
    runLooksAbandoned: Boolean(isIndexing) && stale,
    runIsLive,
    isAwaitingTaskStart,
    // The dispatch window counts as live: a run whose task has been requested but
    // not yet started has nothing to stop and must not be deletable either.
    deleteDisabled: Boolean(isDeleting) || isAwaitingTaskStart || runIsLive,
    reindexDisabled: Boolean(buildBlocked) || Boolean(isRunning) || isAwaitingTaskStart || runIsLive,
  };
};

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
  !serverRow || (hasReclaimableFlag(serverRow) && now - (stubCreatedAt ?? 0) > graceMs);

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

// The SDK records a history entry per state transition, so a second completed entry
// means this collection has been built before.
const countCompletedRuns = history =>
  Array.isArray(history) ? history.filter(entry => RUNNABLE_INDEX_STATUSES.includes(entry?.state)).length : 0;

/**
 * The counts line for one row of the index list.
 *
 * In flight, `indexed`/`total` still describe the PREVIOUS run — the platform preserves
 * them across a reindex so the index stays readable — so rendering them beside a live
 * spinner reads as this run's progress. `run_chunks` is reported instead, never as a
 * ratio: the run's own total is unknown until it finishes, and the two count different
 * things (documents vs chunks).
 * @param {object} metadata - `index.metadata` from the index list GET
 * @param {boolean} isInProgress - whether the row's state is `in_progress`
 * @returns {{tooltip: string, count: string}}
 */
export const indexListCounts = (metadata, isInProgress) => {
  if (!metadata) return { tooltip: '-', count: '–' };

  const runChunks = Number(metadata.run_chunks);
  const hasRunChunks =
    metadata.run_chunks !== null && metadata.run_chunks !== undefined && Number.isFinite(runChunks);
  if (isInProgress && hasRunChunks) {
    return {
      tooltip: INDEX_RUN_CHUNKS_TOOLTIP,
      count: `${runChunks} chunks so far`,
    };
  }

  const hasBeenIndexedBefore = countCompletedRuns(metadata.history) > 1;
  const total = metadata.total ?? metadata.indexed ?? '–';
  const indexedDocs = metadata.indexed ?? '–';
  return {
    tooltip: hasBeenIndexedBefore ? INDEX_REINDEXED_RATIO_TOOLTIP : INDEX_DOCS_RATIO_TOOLTIP,
    count: `${indexedDocs} / ${total}`,
  };
};

/**
 * Tooltip for the abandoned-run icon on a list row.
 *
 * The icon keys on `stale`, but the remedy it names keys on `reclaimable`, the flag the
 * row's buttons are gated on — otherwise a run that is merely slow to promote offers
 * "Reindex to try again" beside a disabled Reindex button.
 * @param {object} index - the index list row
 * @returns {string}
 */
export const abandonedRunTooltip = index =>
  hasReclaimableFlag(index) ? INDEX_ABANDONED_TOOLTIP : INDEX_UNRESPONSIVE_TOOLTIP;

/**
 * Build the optimistic stub for a row the user just clicked Reindex on.
 *
 * Paired with {@link applyReindexStub}: the stash below is the only thing that tells
 * the row being replaced apart from the run it starts.
 * @param {object} reindexTarget - the row as it was when Reindex was clicked
 * @param {number} now - epoch ms
 * @returns {object}
 */
export const buildReindexStub = (reindexTarget, now = Date.now()) => ({
  ...reindexTarget,
  observedAt: now,
  stubCreatedAt: now,
  // Stashed before traceReindex can overwrite metadata.task_id.
  previousTaskId: reindexTarget?.metadata?.task_id ?? null,
  metadata: { ...reindexTarget?.metadata, state: IndexStatuses.progress },
});

/**
 * Overlay the optimistic "a reindex just started" stub onto the fetched list.
 *
 * The stub exists because the list GET is slow to reflect a click. It asserts a
 * NEW run, which by definition has written no chunks yet, so `run_chunks` is
 * forced to 0 — the backend seeds the same 0 at dispatch. The caller builds the
 * stub by spreading the clicked row's metadata, so without this the finished
 * run's count rides along and is rendered as the new run's progress.
 * @param {Array} indexesList - rows from the index list GET
 * @param {object|null} reindexRunning - the optimistic row, or null when none
 * @returns {Array}
 */
export const applyReindexStub = (indexesList, reindexRunning) => {
  if (!reindexRunning) return indexesList;

  return indexesList.map(item => {
    if (item.id !== reindexRunning.id) return item;

    // Stashed because traceReindex overwrites reindexRunning.metadata.task_id as soon
    // as the dispatch lands.
    const isPreClickRow = (item.metadata?.task_id ?? null) === (reindexRunning.previousTaskId ?? null);

    return {
      ...item,
      // Forced only while this is still the pre-click row; once the server returns the
      // new run's own row its flag is the honest one. Keyed on the task_id rather than
      // on `state === in_progress`, because every reachable in-progress click starts
      // from a stale row and that flag would ride onto the run just started.
      stale: isPreClickRow ? false : Boolean(item.stale),
      // Both or neither: reclaimable implies stale on every server-sent row, so resetting
      // one alone mints a tuple the backend cannot produce.
      reclaimable: isPreClickRow ? false : item.reclaimable,
      metadata: {
        ...item.metadata,
        state: reindexRunning.metadata?.state ?? item.metadata?.state,
        // Zero while this is the pre-click row, or the finished run's count reads as the
        // new run's progress; then yield verbatim. Coercing an absent count to 0 would
        // hide indexListCounts' docs-ratio fallback from the one user who clicked.
        run_chunks: isPreClickRow ? 0 : item.metadata?.run_chunks,
        task_id: reindexRunning.metadata?.task_id ?? item.metadata?.task_id,
        conversation_id: reindexRunning.metadata?.conversation_id ?? item.metadata?.conversation_id,
      },
    };
  });
};
