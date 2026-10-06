import { TRAJECTORY_STATE, TRAJECTORY_STATE_MESSAGE, TRAJECTORY_STEP_KIND } from '../constants';

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
