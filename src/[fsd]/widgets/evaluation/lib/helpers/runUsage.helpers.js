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

// One judge call scores every AI dimension that shares an evidence scope, so judge tokens exist
// per case, never per dimension. Said wherever they are shown, rather than split by a guess.
export const JUDGE_GRANULARITY_NOTE = 'all AI dimensions together, not split per dimension';

/**
 * The run-history "Tokens" cell (design §6): the agent's average tokens per recorded case
 * from `meta.agent_usage`, never the judge's. Null for a run without an agent rollup.
 * @param {object} [meta] - Run meta
 * @returns {{ label: string, tooltip: string } | null} e.g. label "1,921"
 */
export const getRunHistoryUsage = meta => {
  const usage = meta?.agent_usage;
  const recorded = usage?.recorded_cases ?? 0;
  if (!usage || typeof usage !== 'object' || !recorded) return null;
  const averageCost = formatUsd(usage.average_cost);
  const parts = [
    `Agent tokens per case, averaged over ${recorded} of ${usage.cases ?? recorded} cases`,
    averageCost ? `${averageCost} per case` : 'Not priced',
  ];
  if (usage.token_source === 'estimate') parts.push('estimated');

  return { label: formatTokenCount(sumTokens(usage.averages)), tooltip: parts.join(' · ') };
};

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
      if (role === 'judge') notes.push(JUDGE_GRANULARITY_NOTE);

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

const formatRange = (range, format, unit = '') => {
  const low = format(range.low);
  const high = format(range.high);

  return `${low === high ? low : `${low}–${high}`}${unit}`;
};

/**
 * What the suite panel shows before launch (#6716, design Q-S6), from the estimate endpoint. The
 * estimate is the last finished run of this suite on the same version scaled to today's case
 * count; with no such run there is no estimate. Cost is preferred; tokens stand in when that run
 * was not priced.
 * @param {object} [data] - `eval_suite_estimate` response
 * @returns {{ available: boolean, label: string, range: string | null, detail: string | null,
 *   budget: string | null, warning: string | null } | null}
 */
export const buildRunEstimateSummary = data => {
  if (!data || typeof data !== 'object') return null;
  const { estimate, budget } = data;
  const remaining = budget ? formatUsd(budget.remaining) : null;
  const budgetText = remaining
    ? `${budget.scope === 'member' ? 'Your remaining budget' : 'Remaining project budget'}: ${remaining}`
    : null;

  if (!data.available || !estimate) {
    return {
      available: false,
      label: 'No estimate (first run)',
      range: null,
      detail: 'Estimates come from the last finished run of this suite on the selected version.',
      budget: budgetText,
      warning: null,
    };
  }

  const priced = estimate.cost != null;
  const range = priced ? estimate.cost : estimate.tokens;
  const format = priced ? value => formatUsd(value) ?? '—' : formatTokenCount;
  const unit = priced ? '' : ' tokens';
  const parts = [
    `${estimate.cases} ${estimate.cases === 1 ? 'case' : 'cases'}`,
    `based on run #${data.history_run_id}`,
    estimate.includes_judge ? 'agent + judge' : 'agent only',
  ];
  if (priced && estimate.unpriced_cases) parts.push(`${estimate.unpriced_cases} not priced`);
  if (!priced) parts.push('not priced');

  return {
    available: true,
    label: `Estimated ${format(range.expected)}${unit}`,
    range: `Range ${formatRange(range, format, unit)}`,
    detail: parts.join(' · '),
    budget: budgetText,
    warning: data.exceeds_budget ? 'The estimate is over the remaining monthly budget.' : null,
  };
};

const CASE_USAGE_REASON = {
  timeout: 'the case timed out',
  no_envelope: 'the agent returned nothing to read',
  no_callback: 'the agent did not report usage',
  budget_blocked: 'the monthly budget blocked the call',
  unsupported: 'this agent type does not report usage',
  ledger: 'the usage ledger had no figures',
};

const COST_SOURCE_LABEL = {
  'runtime:costs-catalog': 'priced at run time',
  usage_event: 'from the usage ledger',
};

/**
 * What one case spent, one row per role, from the case-executions `usage` list (#6716). Token
 * figures only mean something for a `recorded` row; the others say why there is nothing.
 * @param {Array<object>} [usage] - `eval_case_executions` `usage` rows for one case
 * @returns {Array<{ role: string, label: string, inputTokens: string, outputTokens: string,
 *   totalTokens: string, cost: string, note: string | null, isRecorded: boolean, isUnpriced: boolean }>}
 */
export const buildCaseUsageRows = usage =>
  (Array.isArray(usage) ? usage : [])
    .filter(row => ROLE_LABEL[row?.role])
    .sort((a, b) => (a.role === b.role ? 0 : a.role === 'agent' ? -1 : 1))
    .map(row => {
      const isRecorded = row.usage_state === 'recorded';
      const cost = isRecorded ? formatUsd(row.cost) : null;
      const notes = [];
      if (isRecorded) {
        if (row.model_name) notes.push(row.model_name);
        if (row.token_source === 'estimate') notes.push('tokens estimated');
        if (cost != null && COST_SOURCE_LABEL[row.cost_source])
          notes.push(COST_SOURCE_LABEL[row.cost_source]);
        if (row.role === 'judge') notes.push(JUDGE_GRANULARITY_NOTE);
      } else {
        const reason = CASE_USAGE_REASON[row.usage_state_reason];
        const what = row.usage_state === 'not_applicable' ? 'Not applicable' : 'Not recorded';
        notes.push(reason ? `${what}: ${reason}` : what);
      }

      return {
        role: row.role,
        label: ROLE_LABEL[row.role],
        inputTokens: isRecorded ? formatTokenCount(row.input_tokens) : '—',
        outputTokens: isRecorded ? formatTokenCount(row.output_tokens) : '—',
        totalTokens: isRecorded ? formatTokenCount(row.total_tokens) : '—',
        cost: isRecorded ? (cost ?? 'Not priced') : '—',
        note: notes.length ? notes.join(' · ') : null,
        isRecorded,
        isUnpriced: isRecorded && cost == null,
      };
    });
