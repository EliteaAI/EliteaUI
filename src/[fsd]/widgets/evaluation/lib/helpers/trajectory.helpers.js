import {
  CASE_EXECUTION_STATUS,
  GUARDRAIL_STEP_STATUSES,
  TRAJECTORY_STATE,
  TRAJECTORY_STATE_MESSAGE,
  TRAJECTORY_STEP_KIND,
} from '../constants';

/**
 * Display helpers for a case's recorded trajectory (#6809 P1). The backend stores the normalized
 * shape (`evaluation_execution.build_trajectory`); these only turn it into labels. Pure.
 */

export const formatDurationMs = ms => {
  if (ms == null || Number.isNaN(Number(ms))) return null;
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
};

// A step without provider usage has `tokens: null` — shown as unknown, never as 0.
export const formatStepTokens = tokens => {
  if (!tokens) return null;
  return `${tokens.in ?? '?'} in / ${tokens.out ?? '?'} out tokens`;
};

/** The one-line summary of a step: what ran, how it ended, how long it took. */
export const getTrajectoryStepTitle = step => {
  const index = `#${(step?.i ?? 0) + 1}`;
  if (step?.kind === TRAJECTORY_STEP_KIND.tool) {
    return [index, 'Tool', step.tool_name || 'unknown tool'].join(' · ');
  }
  const planned = step?.planned_tools?.length ? `calls ${step.planned_tools.join(', ')}` : 'answer';
  return [index, 'LLM', planned].join(' · ');
};

export const getTrajectoryStepMeta = step => {
  const parts = [];
  if (step?.kind === TRAJECTORY_STEP_KIND.tool) {
    if (step.status) parts.push(step.status);
    if (step.toolkit) parts.push(step.toolkit);
  } else {
    if (step?.model) parts.push(step.model);
    const tokens = formatStepTokens(step?.tokens);
    if (tokens) parts.push(step?.token_source === 'estimate' ? `${tokens} (estimated)` : tokens);
    // The provider sent no usage for this call: say so rather than show 0 or nothing.
    else if (step?.token_source === 'estimate') parts.push('tokens not reported');
  }
  const duration = formatDurationMs(step?.duration_ms);
  if (duration) parts.push(duration);
  return parts.join(' · ');
};

/** The labelled payload blocks shown when a step is expanded; empty fields are left out. */
export const getTrajectoryStepSections = step => {
  if (!step) return [];
  const sections =
    step.kind === TRAJECTORY_STEP_KIND.tool
      ? [
          { label: 'Input', content: step.tool_inputs },
          { label: 'Output', content: step.tool_output },
          { label: 'Error', content: step.error },
        ]
      : [{ label: 'Text', content: step.text }];
  const filled = sections.filter(({ content }) => content != null && content !== '');
  if (step.output_omitted) {
    filled.push({
      label: 'Note',
      content: 'Payload dropped to keep the stored trajectory within its size limit.',
    });
  }
  return filled;
};

/** Why a case has no trajectory, or null when one was recorded. */
export const getTrajectoryStateMessage = execution => {
  if (!execution) return 'No execution was recorded for this case.';
  if (execution.trajectory_state === TRAJECTORY_STATE.recorded) return null;
  return (
    TRAJECTORY_STATE_MESSAGE[execution.trajectory_state_reason] ?? 'No trajectory was recorded for this case.'
  );
};

/** The run counters (G8) as label/value pairs, in a fixed order; absent counters are skipped. */
export const getTrajectoryMetricItems = metrics => {
  if (!metrics) return [];
  const items = [
    ['LLM calls', metrics.llm_calls],
    ['Tool calls', metrics.tool_calls],
    ['Distinct tools', metrics.distinct_tools],
    ['Tool errors', metrics.tool_errors],
    ['Retries', metrics.retries],
    ['Redundant calls', metrics.redundant_calls],
    ['Guardrail events', metrics.guardrail_events],
    ['Step limit hit', metrics.step_limit_hit == null ? null : metrics.step_limit_hit ? 'yes' : 'no'],
    ['Latency', formatDurationMs(metrics.latency_ms)],
  ];
  return items
    .filter(([, value]) => value != null)
    .map(([label, value]) => ({ label, value: String(value) }));
};

/** Whether a tool step was stopped by a guardrail rather than run. */
export const isGuardrailStep = step =>
  step?.kind === TRAJECTORY_STEP_KIND.tool && GUARDRAIL_STEP_STATUSES.includes(step.status);

/**
 * Why the run stopped on this case instead of answering (a HITL/guardrail pause or a sub-agent
 * park), or null when it did not. Reads `status` and the stored `trajectory.pause` identities;
 * the paused call's arguments are never stored.
 * @returns {{ title: string, items: Array<{ label: string, value: string }>, note: string } | null}
 */
export const getCasePauseDetails = execution => {
  if (!execution) return null;
  if (execution.status === CASE_EXECUTION_STATUS.parked) {
    return {
      title: 'Parked on a sub-agent fan-out',
      items: [],
      note: 'The agent handed work to sub-agents and waited for them. A batch run cannot resume it, so the case failed.',
    };
  }
  const pause = execution.trajectory?.pause;
  if (execution.status !== CASE_EXECUTION_STATUS.guardrailPaused && !pause) return null;
  const tool =
    pause?.tool_name && pause?.toolkit_name ? `${pause.tool_name} (${pause.toolkit_name})` : pause?.tool_name;
  const items = [
    ['Pause type', pause?.pause_type],
    ['Interaction', pause?.interaction_type],
    ['Guardrail', pause?.guardrail_type],
    ['Tool', tool],
    ['Node', pause?.node_name],
    ['Pending calls', pause?.interrupts > 1 ? pause.interrupts : null],
  ]
    .filter(([, value]) => value != null && value !== '')
    .map(([label, value]) => ({ label, value: String(value) }));
  return {
    title: 'Paused for human review',
    items,
    note: 'Nobody can approve or reject a paused step in a batch run, so the case failed. The steps up to the pause are listed below.',
  };
};

/**
 * The case list's guardrail chip (design §6), or null for a case no guardrail touched. Reads the
 * execution's status and its `guardrail_events` counter; never recomputed from steps.
 * @returns {{ label: string, tooltip: string } | null}
 */
export const getCaseGuardrailChip = execution => {
  if (!execution) return null;
  if (execution.status === CASE_EXECUTION_STATUS.parked) {
    return {
      label: 'Parked',
      tooltip: 'The agent parked on a sub-agent fan-out; a batch run cannot resume it.',
    };
  }
  if (execution.status === CASE_EXECUTION_STATUS.guardrailPaused) {
    return {
      label: 'Paused for review',
      tooltip: 'The agent paused for human review; batch runs fail the case.',
    };
  }
  const events = execution.metrics?.guardrail_events ?? 0;
  if (!events) return null;
  return {
    label: `Guardrail: ${events}`,
    tooltip: `${events} tool ${events === 1 ? 'call was' : 'calls were'} blocked or waited on authorization.`,
  };
};

const plural = (count, word, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;

/**
 * A case's step, tool-error and retry counts for the case list (design §6), read from the stored
 * `metrics`; null when the case recorded none. Steps are LLM calls plus tool calls.
 * @returns {{ label: string, tooltip: string, hasErrors: boolean } | null}
 *   e.g. label "6 steps · 1 tool error · 1 retry" (zero errors and retries are left out)
 */
export const getCaseCounters = execution => {
  const metrics = execution?.metrics;
  if (!metrics || (metrics.llm_calls == null && metrics.tool_calls == null)) return null;
  const llmCalls = metrics.llm_calls ?? 0;
  const toolCalls = metrics.tool_calls ?? 0;
  const toolErrors = metrics.tool_errors ?? 0;
  const retries = metrics.retries ?? 0;
  const label = [
    plural(llmCalls + toolCalls, 'step'),
    toolErrors ? plural(toolErrors, 'tool error') : null,
    retries ? plural(retries, 'retry', 'retries') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    label,
    tooltip: `${plural(llmCalls, 'LLM call')}, ${plural(toolCalls, 'tool call')}, ${plural(toolErrors, 'tool error')}, ${plural(retries, 'retry', 'retries')}`,
    hasErrors: toolErrors > 0,
  };
};

/**
 * The case list's per-case agent outcome, keyed by dataset case id: the guardrail chip and the
 * counters. Cases with neither are left out.
 * @returns {Record<number, { guardrail: object | null, counters: object | null }>}
 */
export const buildCaseExecutionBadges = executions => {
  const badges = {};
  for (const execution of executions ?? []) {
    if (execution?.dataset_case_id == null) continue;
    const guardrail = getCaseGuardrailChip(execution);
    const counters = getCaseCounters(execution);
    if (guardrail || counters) badges[execution.dataset_case_id] = { guardrail, counters };
  }
  return badges;
};

const formatAverage = value =>
  typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value * 10) / 10) : null;

const pluralCases = count => `${count} ${count === 1 ? 'case' : 'cases'}`;

/**
 * Why some cases are left out of the run's trajectory averages (G7), or null when none are.
 * @param {{ count?: number, budget_blocked?: number, not_applicable?: number, not_recorded?: number }} [excluded]
 * @returns {string | null} e.g. "2 cases not recorded (1 blocked by budget, 1 no trajectory)"
 */
export const getExcludedCasesNote = excluded => {
  const count = excluded?.count ?? 0;
  if (!count) return null;
  const reasons = [
    [excluded.budget_blocked, 'blocked by budget'],
    [excluded.not_applicable, 'no agent run'],
    [excluded.not_recorded, 'no trajectory'],
  ]
    .filter(([n]) => n)
    .map(([n, label]) => `${n} ${label}`);

  return `${pluralCases(count)} not recorded${reasons.length ? ` (${reasons.join(', ')})` : ''}`;
};

/**
 * The run's trajectory rollup (`meta.trajectory_rollup`) as per-case averages, or null for a run
 * that predates it. Averages cover recorded cases only; `coverage` says how many that is.
 * @param {object} [rollup]
 * @returns {{ items: Array<{ label: string, value: string }>, coverage: string | null,
 *   excluded: string | null } | null}
 */
export const buildRunTrajectorySummary = rollup => {
  if (!rollup || typeof rollup !== 'object') return null;
  const averages = rollup.averages ?? {};
  const recorded = rollup.recorded_cases ?? 0;
  const items = [
    ['LLM calls / case', formatAverage(averages.llm_calls)],
    ['Tool calls / case', formatAverage(averages.tool_calls)],
    ['Tool errors / case', formatAverage(averages.tool_errors)],
    ['Retries / case', formatAverage(averages.retries)],
    ['Redundant calls / case', formatAverage(averages.redundant_calls)],
    ['Step limit hit', recorded ? `${rollup.step_limit_hits ?? 0} of ${pluralCases(recorded)}` : null],
    [
      'Latency / case',
      formatDurationMs(rollup.average_latency_ms == null ? null : Math.round(rollup.average_latency_ms)),
    ],
  ]
    .filter(([, value]) => value != null)
    .map(([label, value]) => ({ label, value }));

  return {
    items,
    coverage: rollup.cases ? `Averaged over ${recorded} of ${pluralCases(rollup.cases)}` : null,
    excluded: getExcludedCasesNote(rollup.excluded_cases),
  };
};
