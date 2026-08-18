import { EVAL_RUN_STATUS } from '../constants';

const RUN_STATUS_LABEL = {
  [EVAL_RUN_STATUS.created]: 'Queued',
  [EVAL_RUN_STATUS.running]: 'Running',
  [EVAL_RUN_STATUS.finished]: 'Finished',
  [EVAL_RUN_STATUS.errored]: 'Failed',
};

// A run is terminal once it can no longer change on its own — the progress
// screen (#6) stops polling at this point (§14.2).
export const isRunTerminal = status =>
  status === EVAL_RUN_STATUS.finished || status === EVAL_RUN_STATUS.errored;

export const isRunActive = status => status === EVAL_RUN_STATUS.created || status === EVAL_RUN_STATUS.running;

export const formatRunStatus = status => RUN_STATUS_LABEL[status] ?? status ?? '';

const isScored = run => typeof run?.headline_score === 'number' && Number.isFinite(run.headline_score);

/**
 * Build the run-history rows for the drift view (§21). `runs` arrive newest
 * first from the API. Each row keeps its headline score plus `delta` — the
 * change against the next *scored* run older than it, so a failed or unscored
 * run in between does not break the comparison chain. The oldest scored run has
 * `delta === null` (no baseline to compare against).
 */
export const buildRunHistory = (runs = []) =>
  runs.map((run, index) => {
    if (!isScored(run)) return { ...run, delta: null };
    const previous = runs.slice(index + 1).find(isScored);
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
