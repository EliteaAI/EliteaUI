// Suite run limits (#6809 §4.5, #6716): `meta.steps_limit` caps the agent's steps on every case,
// `meta.consumption_budget = { per_case: { tokens, cost }, per_run: { tokens, cost } }` bounds what a
// run may spend. The form edits them as strings so an empty field means "no limit".
// `per_run.on_breach` says whether reaching the run token limit stops the run or is only reported.

export const MAX_SUITE_STEPS_LIMIT = 100;

export const RUN_LIMIT_FIELDS = [
  'stepsLimit',
  'perCaseTokens',
  'perCaseCost',
  'perRunTokens',
  'perRunCost',
  'perRunOnBreach',
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
 * @returns {{ stepsLimit: string, perCaseTokens: string, perCaseCost: string, perRunTokens: string,
 *   perRunCost: string, perRunOnBreach: 'stop' | 'report' }}
 */
export const readRunLimits = (meta = {}) => {
  const budget = meta?.consumption_budget || {};
  const limits = { stepsLimit: toField(meta?.steps_limit) };
  Object.entries(BUDGET_PATHS).forEach(([field, [scope, key]]) => {
    limits[field] = toField(budget[scope]?.[key]);
  });
  limits.perRunOnBreach =
    budget.per_run?.on_breach === RUN_LIMIT_ON_BREACH.report
      ? RUN_LIMIT_ON_BREACH.report
      : RUN_LIMIT_ON_BREACH.stop;

  return limits;
};

export const areRunLimitsEqual = (a = {}, b = {}) =>
  RUN_LIMIT_FIELDS.every(field => (a[field] ?? '').trim() === (b[field] ?? '').trim());

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

/**
 * Suite meta with the form's limits written in. The update API replaces `meta` as a whole, so every
 * other key is carried over; a limit left empty is dropped rather than stored as null.
 * @param {object} [meta] - Current suite meta
 * @param {object} limits - Valid form strings
 * @returns {object} Meta to send
 */
export const buildRunLimitsMeta = (meta = {}, limits = {}) => {
  // eslint-disable-next-line no-unused-vars
  const { steps_limit: _steps, consumption_budget: _budget, ...rest } = meta || {};
  const next = { ...rest };

  const steps = (limits.stepsLimit ?? '').trim();
  if (steps) next.steps_limit = parseInt(steps, 10);

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

  return next;
};
