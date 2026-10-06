// What a run spent and why it stopped (#6716). The backend writes these into `run.meta`:
// `agent_usage` / `judge_usage` rollups, `budget_verdict` when the suite sets a limit,
// `stop_reason` (+ `stop_scope`) when the run ended before every case was scored, and
// `settlement` once the run's figures were checked against the usage ledger.

export const EVAL_STOP_REASON = {
  cancelRequested: 'cancel_requested',
  timeBudget: 'time_budget',
  budgetExhausted: 'budget_exhausted',
  gateClosed: 'gate_closed',
  failure: 'failure',
};

export const EVAL_SETTLEMENT_STATE = {
  pending: 'pending',
  settled: 'settled',
  partial: 'partial',
  unavailable: 'unavailable',
};

export const EVAL_BUDGET_VERDICT = {
  pass: 'pass',
  breached: 'breached',
  unknown: 'unknown',
};

/**
 * Short label for why a run stopped early, or null when it ran to the end. A failed run already
 * reads "Failed" from its status, so `failure` has no label of its own.
 * @param {{ stop_reason?: string, stop_scope?: string }} [meta] - Run meta
 * @returns {string | null}
 */
export const getRunStopLabel = meta => {
  switch (meta?.stop_reason) {
    case EVAL_STOP_REASON.cancelRequested:
      return 'Cancelled by user';
    case EVAL_STOP_REASON.timeBudget:
      return 'Time limit reached';
    case EVAL_STOP_REASON.budgetExhausted:
      return 'Token budget reached';
    case EVAL_STOP_REASON.gateClosed:
      return meta.stop_scope === 'member' ? 'Your monthly budget used up' : 'Project monthly budget used up';
    default:
      return null;
  }
};

/**
 * The run's own message about how it ended, with the banner variant to show it in. A stopped run
 * keeps its partial scorecard, so its message is a warning rather than an error.
 * @param {{ status?: string, error?: string | null }} [run] - Run summary
 * @returns {{ message: string, variant: 'warning' | 'error' } | null}
 */
export const getRunEndMessage = run => {
  const message = typeof run?.error === 'string' ? run.error.trim() : '';
  if (!message) return null;

  return { message, variant: run.status === 'errored' ? 'error' : 'warning' };
};

const tokenFormatter = new Intl.NumberFormat('en-US');

export const formatTokenCount = value =>
  typeof value === 'number' && Number.isFinite(value) ? tokenFormatter.format(Math.round(value)) : '—';

/** USD with enough digits that a small run does not read as $0.00. */
export const formatUsd = value => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value === 0) return '$0.00';
  const digits = Math.abs(value) < 1 ? 4 : 2;

  return `$${value.toFixed(digits)}`;
};

const sumTokens = (totals = {}) =>
  (totals.input_tokens ?? 0) + (totals.output_tokens ?? 0) + (totals.reasoning_tokens ?? 0);

const ROLE_LABEL = { agent: 'Agent', judge: 'Judge' };

/**
 * One row per role that has a usage rollup: tokens, cost and how many cases the figures cover.
 * @param {object} [meta] - Run meta
 * @returns {Array<{ role: string, label: string, inputTokens: string, outputTokens: string,
 *   totalTokens: string, cost: string, coverage: string | null, isUnpriced: boolean }>}
 */
export const buildRunConsumptionRows = (meta = {}) =>
  ['agent', 'judge']
    .map(role => [role, meta?.[`${role}_usage`]])
    .filter(([, usage]) => usage && typeof usage === 'object')
    .map(([role, usage]) => {
      const totals = usage.totals ?? {};
      const cases = usage.cases ?? 0;
      const recorded = usage.recorded_cases ?? 0;
      const unpriced = usage.unpriced_cases ?? 0;
      const cost = formatUsd(usage.cost);
      const notes = [];
      if (cases && recorded < cases) notes.push(`${recorded} of ${cases} cases recorded`);
      if (unpriced) notes.push(`${unpriced} ${unpriced === 1 ? 'case' : 'cases'} not priced`);

      return {
        role,
        label: ROLE_LABEL[role],
        inputTokens: formatTokenCount(totals.input_tokens),
        outputTokens: formatTokenCount(totals.output_tokens),
        totalTokens: formatTokenCount(sumTokens(totals)),
        cost: cost ?? 'Not priced',
        coverage: notes.length ? notes.join(' · ') : null,
        isUnpriced: cost == null,
      };
    });

const VERDICT_LABEL = {
  [EVAL_BUDGET_VERDICT.pass]: 'Within limit',
  [EVAL_BUDGET_VERDICT.breached]: 'Over limit',
  [EVAL_BUDGET_VERDICT.unknown]: 'Unknown',
};

const formatLimit = (key, value) =>
  key === 'cost' ? (formatUsd(value) ?? '—') : `${formatTokenCount(value)} tokens`;

/**
 * One row per limit the suite set. A per-case limit reports how many cases went over it; a per-run
 * limit reports the run's total against it.
 * @param {object} [verdict] - `meta.budget_verdict`
 * @returns {Array<{ key: string, label: string, limit: string, detail: string, verdict: string,
 *   verdictLabel: string }>}
 */
export const buildBudgetVerdictRows = verdict => {
  if (!verdict || typeof verdict !== 'object') return [];
  const rows = [];
  ['per_case', 'per_run'].forEach(scope => {
    ['tokens', 'cost'].forEach(key => {
      const entry = verdict[scope]?.[key];
      if (!entry) return;
      let detail;
      if (scope === 'per_case') {
        const parts = [`${entry.breached_cases ?? 0} of ${entry.cases ?? 0} cases over`];
        if (entry.unknown_cases) parts.push(`${entry.unknown_cases} unknown`);
        detail = parts.join(', ');
      } else {
        detail = entry.value == null ? 'Not known' : `Used ${formatLimit(key, entry.value)}`;
      }
      // A per-run token limit set to "report" did not stop the run, so it says so.
      if (entry.on_breach === 'report') detail = `${detail} · reported only`;
      rows.push({
        key: `${scope}.${key}`,
        label: `${scope === 'per_case' ? 'Per case' : 'Per run'} · ${key === 'cost' ? 'cost' : 'tokens'}`,
        limit: formatLimit(key, entry.limit),
        detail,
        verdict: entry.verdict,
        verdictLabel: VERDICT_LABEL[entry.verdict] ?? entry.verdict ?? '—',
      });
    });
  });

  return rows;
};

/**
 * Short summary for a run that went over a suite limit, or null when it did not (or set none).
 * @param {object} [meta] - Run meta
 * @returns {string | null} e.g. "Over budget: Per run · tokens, Per case · cost"
 */
export const getRunOverBudgetLabel = meta => {
  const verdict = meta?.budget_verdict;
  if (verdict?.verdict !== EVAL_BUDGET_VERDICT.breached) return null;
  const breached = buildBudgetVerdictRows(verdict)
    .filter(row => row.verdict === EVAL_BUDGET_VERDICT.breached)
    .map(row => row.label);

  return breached.length ? `Over budget: ${breached.join(', ')}` : 'Over budget';
};

const UNAVAILABLE_CAUSE = {
  ledger_unreadable: 'The usage ledger could not be read',
  write_failed: 'The ledger figures could not be saved',
  empty: 'The usage ledger had nothing for this run',
};

/**
 * Where the run's figures come from: the usage ledger once settled, the agent runtime until then
 * or when the ledger could not be used.
 * @param {object} [settlement] - `meta.settlement`
 * @returns {{ state: string, label: string, description: string } | null}
 */
export const getSettlementInfo = settlement => {
  switch (settlement?.state) {
    case EVAL_SETTLEMENT_STATE.pending:
      return {
        state: settlement.state,
        label: 'Settling',
        description:
          'Checking the figures against the usage ledger. Until then they come from the agent runtime.',
      };
    case EVAL_SETTLEMENT_STATE.settled:
      return {
        state: settlement.state,
        label: 'Settled',
        description: 'Figures come from the usage ledger.',
      };
    case EVAL_SETTLEMENT_STATE.partial:
      return {
        state: settlement.state,
        label: 'Partly settled',
        description: `${settlement.settled_rows ?? 0} of ${settlement.expected_rows ?? 0} figures come from the usage ledger; the rest come from the agent runtime.`,
      };
    case EVAL_SETTLEMENT_STATE.unavailable:
      return {
        state: settlement.state,
        label: 'Runtime figures',
        description: `${UNAVAILABLE_CAUSE[settlement.reason] ?? UNAVAILABLE_CAUSE.empty}; figures come from the agent runtime.`,
      };
    default:
      return null;
  }
};
