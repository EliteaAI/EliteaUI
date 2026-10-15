// Suite run limits (#6809 §4.5, #6716): `meta.steps_limit` caps the agent's steps on every case,
// `meta.consumption_budget = { per_case: { tokens, cost }, per_run: { tokens, cost } }` bounds what a
// run may spend. The form edits them as strings so an empty field means "no limit".
// `per_run.on_breach` says whether reaching the run token limit stops the run or is only reported.
// `meta.store_tool_outputs = false` keeps tool names and masked inputs in the stored trajectory but
// drops every tool output (#6809 Q-S5); absent means outputs are stored.
// `meta.case_time_limit_seconds` stops a case that runs longer (performance §3.1); absent means the
// platform default.

export const MAX_SUITE_STEPS_LIMIT = 100;
export const MIN_CASE_TIME_LIMIT_SECONDS = 10;
export const MAX_CASE_TIME_LIMIT_SECONDS = 900;
export const DEFAULT_CASE_TIME_LIMIT_SECONDS = 120;

export const RUN_LIMIT_FIELDS = [
  'stepsLimit',
  'caseTimeLimit',
  'perCaseTokens',
  'perCaseCost',
  'perRunTokens',
  'perRunCost',
  'perRunOnBreach',
  'storeToolOutputs',
];

export const RUN_LIMIT_ON_BREACH = {
  stop: 'stop',
  report: 'report',
};

const BUDGET_PATHS = {
  perCaseTokens: ['per_case', 'tokens'],
  perCaseCost: ['per_case', 'cost'],
  perRunTokens: ['per_run', 'tokens'],
  perRunCost: ['per_run', 'cost'],
};

const toField = value => (value == null ? '' : String(value));

/**
 * Run limits of a suite as form strings.
 * @param {object} [meta] - Suite meta
 * @returns {{ stepsLimit: string, caseTimeLimit: string, perCaseTokens: string, perCaseCost: string, perRunTokens: string,
 *   perRunCost: string, perRunOnBreach: 'stop' | 'report', storeToolOutputs: boolean }}
 */
export const readRunLimits = (meta = {}) => {
  const budget = meta?.consumption_budget || {};
  const limits = {
    stepsLimit: toField(meta?.steps_limit),
    caseTimeLimit: toField(meta?.case_time_limit_seconds),
  };
  Object.entries(BUDGET_PATHS).forEach(([field, [scope, key]]) => {
    limits[field] = toField(budget[scope]?.[key]);
  });
  limits.perRunOnBreach =
    budget.per_run?.on_breach === RUN_LIMIT_ON_BREACH.report
      ? RUN_LIMIT_ON_BREACH.report
      : RUN_LIMIT_ON_BREACH.stop;
  limits.storeToolOutputs = meta?.store_tool_outputs !== false;

  return limits;
};

const normalizeField = value => (typeof value === 'string' ? value.trim() : (value ?? ''));

export const areRunLimitsEqual = (a = {}, b = {}) =>
  RUN_LIMIT_FIELDS.every(field => normalizeField(a[field]) === normalizeField(b[field]));

const isWholeNumber = text => /^\d+$/.test(text);
const isDecimal = text => /^(\d+(\.\d*)?|\.\d+)$/.test(text);

/**
 * Per-field error messages; an empty object means the form can be saved.
 * @param {object} limits - Form strings from readRunLimits
 * @returns {Record<string, string>}
 */
export const validateRunLimits = (limits = {}) => {
  const errors = {};
  const steps = (limits.stepsLimit ?? '').trim();
  if (steps && (!isWholeNumber(steps) || +steps < 1 || +steps > MAX_SUITE_STEPS_LIMIT)) {
    errors.stepsLimit = `Enter a whole number from 1 to ${MAX_SUITE_STEPS_LIMIT}.`;
  }
  const seconds = (limits.caseTimeLimit ?? '').trim();
  if (
    seconds &&
    (!isWholeNumber(seconds) ||
      +seconds < MIN_CASE_TIME_LIMIT_SECONDS ||
      +seconds > MAX_CASE_TIME_LIMIT_SECONDS)
  ) {
    errors.caseTimeLimit = `Enter a whole number of seconds from ${MIN_CASE_TIME_LIMIT_SECONDS} to ${MAX_CASE_TIME_LIMIT_SECONDS}.`;
  }
  ['perCaseTokens', 'perRunTokens'].forEach(field => {
    const text = (limits[field] ?? '').trim();
    if (text && (!isWholeNumber(text) || +text < 1)) errors[field] = 'Enter a whole number of tokens.';
  });
  ['perCaseCost', 'perRunCost'].forEach(field => {
    const text = (limits[field] ?? '').trim();
    if (text && (!isDecimal(text) || +text <= 0)) errors[field] = 'Enter an amount in USD greater than 0.';
  });

  return errors;
};

// Only a per-run token limit stops a run early; cost is known only after the run (#6809 §5.4).
export const COST_ONLY_BUDGET_HINT =
  'Cost limits are checked after the run; add a run token limit to stop early.';
export const REPORT_ONLY_BUDGET_HINT =
  'Cost limits are checked after the run, and the run token limit only reports; set it to stop the run to stop early.';

/**
 * Warning for a budget whose cost limits cannot stop the run, or null when nothing needs saying.
 * @param {object} limits - Form strings from readRunLimits
 * @returns {string | null}
 */
export const getCostOnlyBudgetHint = (limits = {}) => {
  const hasCostLimit = ['perCaseCost', 'perRunCost'].some(field => (limits[field] ?? '').trim());
  if (!hasCostLimit) return null;
  if (!(limits.perRunTokens ?? '').trim()) return COST_ONLY_BUDGET_HINT;
  return limits.perRunOnBreach === RUN_LIMIT_ON_BREACH.report ? REPORT_ONLY_BUDGET_HINT : null;
};

/**
 * Suite meta with the form's limits written in. The update API replaces `meta` as a whole, so every
 * other key is carried over; a limit left empty is dropped rather than stored as null.
 * @param {object} [meta] - Current suite meta
 * @param {object} limits - Valid form strings
 * @returns {object} Meta to send
 */
export const buildRunLimitsMeta = (meta = {}, limits = {}) => {
  /* eslint-disable no-unused-vars */
  const {
    steps_limit: _steps,
    case_time_limit_seconds: _caseTimeLimit,
    consumption_budget: _budget,
    store_tool_outputs: _storeToolOutputs,
    ...rest
  } = meta || {};
  /* eslint-enable no-unused-vars */
  const next = { ...rest };

  const steps = (limits.stepsLimit ?? '').trim();
  if (steps) next.steps_limit = parseInt(steps, 10);
  const seconds = (limits.caseTimeLimit ?? '').trim();
  if (seconds) next.case_time_limit_seconds = parseInt(seconds, 10);

  const budget = {};
  Object.entries(BUDGET_PATHS).forEach(([field, [scope, key]]) => {
    const text = (limits[field] ?? '').trim();
    if (!text) return;
    budget[scope] = { ...budget[scope], [key]: key === 'tokens' ? parseInt(text, 10) : Number(text) };
  });
  // Stopping is the default, so only "report" is stored, and only alongside a run token limit.
  if (budget.per_run?.tokens != null && limits.perRunOnBreach === RUN_LIMIT_ON_BREACH.report) {
    budget.per_run.on_breach = RUN_LIMIT_ON_BREACH.report;
  }
  if (Object.keys(budget).length) next.consumption_budget = budget;
  // Storing outputs is the default, so only the opt-out is stored.
  if (limits.storeToolOutputs === false) next.store_tool_outputs = false;

  return next;
};
