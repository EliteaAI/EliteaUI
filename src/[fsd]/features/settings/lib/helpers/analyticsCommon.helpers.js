import { endOfDay, startOfDay, subDays } from 'date-fns';

import {
  EVAL_RUN_NO_DATA_MESSAGE,
  EVAL_RUN_TOOLTIP_TEXTS,
  RUN_NO_DATA_MESSAGE,
  RUN_SCOPE_TYPE,
  RUN_TOOLTIP_TEXTS,
} from '../constants/analyticsCommon.constants.js';

// Calendar-day-aligned, inclusive of today: days=7 spans 7 calendar days total
// (today + 6 prior) starting at 00:00, not 7 days back from the current time.
export const getPresetRange = days => ({
  from: startOfDay(subDays(new Date(), Math.max(days - 1, 0))),
  to: endOfDay(new Date()),
});

// MUI's DateTimePicker calls onChange with a real Date instance even while the
// user is mid-edit on an out-of-range field (e.g. typing minute "99") — that
// Date's time value is NaN, and `date.toISOString()` throws RangeError on it
// instead of returning undefined like a null/undefined date would.
export const isValidDate = date => date instanceof Date && !Number.isNaN(date.getTime());

export const toValidISOString = date => (isValidDate(date) ? date.toISOString() : undefined);

export const fmtNum = n => {
  // Missing data renders as an em-dash, mirroring fmtCost/fmtDuration. A real
  // zero is distinct from "unknown" and still formats as '0'.
  if (n == null) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const fmtDuration = ms => {
  if (ms == null) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

// Recharts axis `tick` styling shared across the analytics charts. Not an MUI
// `sx` value, so it lives here rather than inside a component `styles` object.
export const axisTick = (stroke, fontSize = 11) => ({ fill: stroke, fontSize });

// Recharts paints the hovered bar's band with a hardcoded light grey, which glares in dark mode
export const barChartCursor = palette => ({ fill: palette.background.interactiveItem.hover });

// Below this, a cost is shown as a bound rather than rounded to a misleading $0.00
const MIN_SHOWN_COST = 0.00001;

// `belowResolution`: backend saw priced tokens whose cost was too small to store (reads as 0)
export const fmtCost = (usd, belowResolution = false) => {
  if (usd == null || !Number.isFinite(usd)) return '-';
  if (usd === 0) return belowResolution ? `< $${MIN_SHOWN_COST}` : '$0.00';
  const abs = Math.abs(usd);
  const sign = usd < 0 ? '-' : '';
  if (abs < MIN_SHOWN_COST) return `${sign}< $${MIN_SHOWN_COST}`;
  if (abs < 0.0001) return `${sign}$${abs.toFixed(5)}`;
  if (abs < 0.01) return `${sign}$${(Math.ceil(abs * 10_000) / 10_000).toFixed(4)}`;
  if (abs < 1) return `${sign}$${abs.toFixed(4)}`;
  if (abs < 1000) return `${sign}$${abs.toFixed(2)}`;
  if (abs < 1_000_000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
};

const RUN_SCOPES = {
  [RUN_SCOPE_TYPE.run]: {
    queryKey: 'runId',
    tooltips: RUN_TOOLTIP_TEXTS,
    scopeLabel: 'this run',
    noDataMessage: RUN_NO_DATA_MESSAGE,
  },
  [RUN_SCOPE_TYPE.evalRun]: {
    queryKey: 'evalRunId',
    tooltips: EVAL_RUN_TOOLTIP_TEXTS,
    scopeLabel: 'this evaluation run',
    noDataMessage: EVAL_RUN_NO_DATA_MESSAGE,
  },
};

/**
 * Per-run Analytics scope shared by the run-aware tabs, export and refresh: which query arg narrows the
 * payload (`run_id` for Agent/Pipeline runs, `eval_run_id` for evaluation runs) and the wording that goes
 * with it. Null when there is no id, so the page can show its empty state instead of a project-wide view.
 */
export const buildRunScope = (type, id) => {
  if (id == null || id === '') return null;

  const { queryKey, ...rest } = RUN_SCOPES[type];

  return { queryArgs: { [queryKey]: id }, ...rest };
};
