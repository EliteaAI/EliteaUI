import { format } from 'date-fns';

// The API reads date_to as exclusive, so the window ends tomorrow to include today
export const periodRange = (days, now = new Date()) => {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const start = new Date(end.getTime() - Number(days) * 24 * 3600 * 1000);
  return { dateFrom: start.toISOString().slice(0, 10), dateTo: end.toISOString().slice(0, 10) };
};

export const formatCu = value => (value == null ? '—' : Number(value).toFixed(value >= 100 ? 0 : 1));

export const formatPercentile = value => (value == null ? '—' : `P${value}`);

export const formatAsOf = iso => (iso ? format(new Date(iso), 'MMM d, yyyy HH:mm') : null);

// Runs are scored hourly; only the label cut points are recalibrated nightly
export const freshnessNote = meta => {
  const asOf = formatAsOf(meta?.as_of);
  if (!asOf) return 'No runs scored yet. Runs are scored about 30–90 minutes after they finish.';
  const recalibrated = formatAsOf(meta?.thresholds_computed_at);
  const labels = recalibrated ? `labels recalibrated daily (${recalibrated})` : 'labels recalibrated daily';
  return `Scores as of ${asOf} · updated hourly · ${labels}.`;
};

export const breakdownShares = breakdown => {
  const parts = ['context', 'reasoning', 'tools'].map(key => Math.max(0, Number(breakdown?.[key]) || 0));
  const total = parts.reduce((sum, value) => sum + value, 0);
  return total ? parts.map(value => (value / total) * 100) : [0, 0, 0];
};

const THRESHOLD_SOURCE_NOTES = {
  default: 'default thresholds',
  calibrated: 'calibrated for this installation',
  pinned: 'set by an administrator',
};

// Live cut points from the API, so the text follows calibration instead of hard-coded defaults
export const thresholdsLine = meta => {
  const { medium, high, extreme } = meta?.thresholds ?? {};
  if ([medium, high, extreme].some(value => value == null)) return null;
  const [m, h, x] = [medium, high, extreme].map(value => String(Number(Number(value).toFixed(1))));
  const source = THRESHOLD_SOURCE_NOTES[meta.thresholds_source] ?? THRESHOLD_SOURCE_NOTES.default;
  return `Low under ${m} · Medium ${m}–${h} · High ${h}–${x} · Extreme over ${x} (${source}, updated nightly)`;
};

export const runTooltip = run => {
  const { context, reasoning, tools } = run?.breakdown ?? {};
  return `${formatCu(run?.cu_total)} CU · ${formatPercentile(run?.percentile)} · Context ${formatCu(context)} · Reasoning ${formatCu(reasoning)} · Tools ${formatCu(tools)}`;
};

export const RUN_SCORE_STATE = { scored: 'scored', pending: 'pending', notScored: 'notScored' };

export const runScoreState = (scoredRun, lastActivityMs, pendingWindowMs, now = Date.now()) => {
  if (scoredRun) return RUN_SCORE_STATE.scored;
  if (Number.isFinite(lastActivityMs) && now - lastActivityMs < pendingWindowMs)
    return RUN_SCORE_STATE.pending;
  return RUN_SCORE_STATE.notScored;
};

// Context, reasoning, tools: shared by the breakdown bar and its legend
export const dimensionColor = (palette, index) =>
  [palette.status.draft, palette.status.onModeration, palette.status.published][index];
