import { EVAL_RUN_STATUS } from '../constants';

const RUN_STATUS_LABEL = {
  [EVAL_RUN_STATUS.created]: 'Queued',
  [EVAL_RUN_STATUS.running]: 'Running',
  [EVAL_RUN_STATUS.finished]: 'Finished',
  [EVAL_RUN_STATUS.errored]: 'Failed',
  [EVAL_RUN_STATUS.cancelled]: 'Cancelled',
};

// A run is terminal once it can no longer change on its own — the progress
// screen (#6) stops polling at this point (§14.2).
export const isRunTerminal = status =>
  status === EVAL_RUN_STATUS.finished ||
  status === EVAL_RUN_STATUS.errored ||
  status === EVAL_RUN_STATUS.cancelled;

export const isRunActive = status => status === EVAL_RUN_STATUS.created || status === EVAL_RUN_STATUS.running;

export const formatRunStatus = status => RUN_STATUS_LABEL[status] ?? status ?? '';

export const isRunScored = run =>
  typeof run?.headline_score === 'number' && Number.isFinite(run.headline_score);

/**
 * Build the run-history rows for the drift view (§21). `runs` arrive newest
 * first from the API. Each row keeps its headline score plus `delta` — the
 * change against the next *scored* run older than it, so a failed or unscored
 * run in between does not break the comparison chain. The oldest scored run has
 * `delta === null` (no baseline to compare against).
 */
export const buildRunHistory = (runs = []) =>
  runs.map((run, index) => {
    if (!isRunScored(run)) return { ...run, delta: null };
    const previous = runs.slice(index + 1).find(isRunScored);
    return {
      ...run,
      delta: previous ? Number((run.headline_score - previous.headline_score).toFixed(2)) : null,
      comparedToRunId: previous?.id ?? null,
    };
  });

// Signed, fixed-precision delta label for the history list ("+4.5" / "-1.2").
export const formatScoreDelta = delta => {
  if (delta == null || !Number.isFinite(delta)) return '';
  if (delta === 0) return '0';
  return `${delta > 0 ? '+' : ''}${delta}`;
};

// Percent complete from the backend progress feed ({ done, total }). Falls back
// to 0 when nothing has been reported yet so the bar renders determinate.
export const runProgressPercent = progress => {
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;
  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
};

// Shown when a run's suite can no longer be named — it was never saved under a name, or it has
// since been deleted. The list endpoint returns only `suite_id`, so the name is resolved against
// the snapshot the run froze at start (authoritative, survives a later rename) and falls back to
// the live suite list for rows whose detail has not been fetched.
export const UNTITLED_SUITE_LABEL = 'Untitled suite';

export const resolveRunSuiteName = (run, suiteNamesById = {}) =>
  run?.snapshot?.suite?.name || suiteNamesById[run?.suite_id] || UNTITLED_SUITE_LABEL;

/**
 * Score cell label for a history row. A terminal run with no headline is not "0" — it is either
 * still waiting on manual scoring or it never produced one, and saying so keeps a pending run from
 * reading as a failed one.
 */
export const getRunScoreLabel = run => {
  if (isRunScored(run)) {
    return Number.isInteger(run.headline_score)
      ? String(run.headline_score)
      : run.headline_score.toFixed(2).replace(/\.?0+$/, '');
  }
  if (!isRunTerminal(run?.status)) return formatRunStatus(run?.status);
  if ((run?.progress?.pending_human ?? 0) > 0) return 'Pending';
  return '—';
};

/**
 * Orders two *scored* runs by headline. An unscored run compares equal rather than sinking with a
 * ±1: sortable columns are negated for descending, which would invert the sink and float every
 * pending run to the top. Keeping them last in both directions is the caller's job — see
 * `sinkUnscoredRuns` (§11 — "must not cause sorting errors").
 */
export const compareRunScore = (a, b) => {
  if (!isRunScored(a) || !isRunScored(b)) return 0;
  return a.headline_score - b.headline_score;
};

// Direction-neutral counterpart to `compareRunScore`: applied after the sort, it keeps runs with no
// headline score at the bottom of the score column whichever way the column is sorted.
export const sinkUnscoredRuns = (runs = []) => [
  ...runs.filter(isRunScored),
  ...runs.filter(run => !isRunScored(run)),
];
