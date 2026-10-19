import { formatTokenCount, formatUsd, sumTokens } from './runUsage.helpers';
import { formatDurationMs, plural } from './trajectory.helpers';

/**
 * The run header's "Efficiency" strip (tokenomics design §6, performance design §3.2): latency
 * percentiles, timeouts, the agent's tokens and cost, tool calls and the tool-error rate, read
 * from `run.meta`. Pure.
 */

const formatSeconds = seconds => (seconds == null ? null : `${seconds} s`);

const formatTotalAndAverage = (total, average) => {
  if (total == null) return null;
  return average == null ? total : `${total} (${average} / case)`;
};

/**
 * How many cases hit the suite's case time limit, said next to the headline because a timed-out
 * case scores nothing that counts toward it (performance design §3.2). Null when none did, or for a
 * run that predates the counter.
 * @param {object} [rollup] - `meta.trajectory_rollup`
 * @returns {{ label: string, coverage: string, message: string } | null}
 *   e.g. label "1 of 2 cases timed out at 10 s", coverage "Scores cover the other 1 case"
 */
export const getRunTimeoutNote = rollup => {
  const timedOut = rollup?.timed_out_cases ?? 0;
  if (!rollup || typeof rollup !== 'object' || !timedOut) return null;
  const cases = rollup.cases ?? timedOut;
  const limit = formatSeconds(rollup.case_time_limit_seconds);
  const label = `${timedOut} of ${plural(cases, 'case')} timed out${limit ? ` at ${limit}` : ''}`;
  const others = Math.max(cases - timedOut, 0);
  const coverage = others ? `Scores cover the other ${plural(others, 'case')}` : 'No case was scored';

  return {
    label,
    coverage,
    message: `${label}. ${coverage}: a timed-out case is left out of every score except the latency checks.`,
  };
};

/**
 * The strip's items, the muted judge overhead line and whether any figure is an estimate. Null for
 * a run with neither a trajectory rollup nor an agent usage rollup.
 * @param {object} [meta] - Run meta
 * @returns {{ items: Array<{ label: string, value: string, isAttention?: boolean }>,
 *   judgeOverhead: string | null, isEstimate: boolean } | null}
 */
export const buildRunEfficiencyStrip = meta => {
  const rollup =
    meta?.trajectory_rollup && typeof meta.trajectory_rollup === 'object' ? meta.trajectory_rollup : null;
  const agent = meta?.agent_usage && typeof meta.agent_usage === 'object' ? meta.agent_usage : null;
  const judge = meta?.judge_usage && typeof meta.judge_usage === 'object' ? meta.judge_usage : null;
  if (!rollup && !agent) return null;

  const items = [];
  const push = (label, value, extra = {}) => {
    if (value != null) items.push({ label, value, ...extra });
  };

  if (rollup) {
    if (rollup.p50_latency_ms != null && rollup.p95_latency_ms != null) {
      push(
        'Latency p50 / p95',
        `${formatDurationMs(Math.round(rollup.p50_latency_ms))} / ${formatDurationMs(Math.round(rollup.p95_latency_ms))}`,
      );
    }
    if (rollup.timed_out_cases != null) {
      const timedOut = rollup.timed_out_cases;
      push('Timeouts', `${timedOut} of ${plural(rollup.cases ?? 0, 'case')}`, { isAttention: timedOut > 0 });
    }
  }

  if (agent?.recorded_cases) {
    push(
      'Agent tokens',
      formatTotalAndAverage(
        formatTokenCount(sumTokens(agent.totals)),
        formatTokenCount(sumTokens(agent.averages)),
      ),
    );
    const cost = formatUsd(agent.cost);
    push('Agent cost', cost ? formatTotalAndAverage(cost, formatUsd(agent.average_cost)) : 'Not priced');
  }

  if (rollup?.recorded_cases) {
    const averageToolCalls = rollup.averages?.tool_calls;
    if (typeof averageToolCalls === 'number')
      push('Tool calls / case', String(Math.round(averageToolCalls * 10) / 10));
    const toolCalls = rollup.totals?.tool_calls ?? 0;
    const toolErrors = rollup.totals?.tool_errors ?? 0;
    push('Tool-error rate', toolCalls ? `${Math.round((toolErrors / toolCalls) * 100)}%` : '—', {
      isAttention: toolErrors > 0,
    });
  }

  let judgeOverhead = null;
  if (judge?.recorded_cases) {
    const judgeCost = formatUsd(judge.cost);
    judgeOverhead = `Evaluation overhead: judge ${judgeCost ?? `${formatTokenCount(sumTokens(judge.totals))} tokens, not priced`}`;
  }

  return {
    items,
    judgeOverhead,
    isEstimate: agent?.token_source === 'estimate',
  };
};
