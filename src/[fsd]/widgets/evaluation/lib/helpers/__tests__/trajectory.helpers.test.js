import { describe, expect, it } from 'vitest';

import {
  buildCaseExecutionBadges,
  buildRunTrajectorySummary,
  formatDurationMs,
  getCaseCounters,
  getCaseGuardrailChip,
  getCasePauseDetails,
  getExcludedCasesNote,
  getTrajectoryMetricItems,
  getTrajectoryStateMessage,
  getTrajectoryStepMeta,
  getTrajectoryStepSections,
  getTrajectoryStepTitle,
  isGuardrailStep,
} from '../trajectory.helpers';

const llmStep = {
  i: 0,
  kind: 'llm',
  model: 'claude-haiku',
  tokens: { in: 1428, out: 63 },
  token_source: 'provider',
  planned_tools: ['ChildWriter'],
  text: null,
  duration_ms: 1866,
};

const toolStep = {
  i: 1,
  kind: 'tool',
  tool_name: 'ChildWriter',
  toolkit: 'Child Writer',
  status: 'ok',
  tool_inputs: { task: 'q' },
  tool_output: 'done',
  error: null,
  duration_ms: 19987,
};

describe('formatDurationMs', () => {
  it('keeps short durations in ms and longer ones in seconds', () => {
    expect(formatDurationMs(850)).toBe('850 ms');
    expect(formatDurationMs(19987)).toBe('20.0 s');
    expect(formatDurationMs(null)).toBeNull();
  });
});

describe('getTrajectoryStepTitle', () => {
  it('names the tools an LLM step planned, or calls it the answer', () => {
    expect(getTrajectoryStepTitle(llmStep)).toBe('#1 · LLM · calls ChildWriter');
    expect(getTrajectoryStepTitle({ ...llmStep, planned_tools: [] })).toBe('#1 · LLM · answer');
  });

  it('names the tool of a tool step', () => {
    expect(getTrajectoryStepTitle(toolStep)).toBe('#2 · Tool · ChildWriter');
  });
});

describe('getTrajectoryStepMeta', () => {
  it('shows model, tokens and duration for an LLM step', () => {
    expect(getTrajectoryStepMeta(llmStep)).toBe('claude-haiku · 1428 in / 63 out tokens · 1.9 s');
  });

  it('marks estimated tokens and leaves out missing usage instead of showing 0', () => {
    expect(getTrajectoryStepMeta({ ...llmStep, token_source: 'estimate' })).toContain('(estimated)');
    expect(getTrajectoryStepMeta({ ...llmStep, tokens: null })).toBe('claude-haiku · 1.9 s');
    expect(getTrajectoryStepMeta({ ...llmStep, tokens: null, token_source: 'estimate' })).toBe(
      'claude-haiku · tokens not reported · 1.9 s',
    );
  });

  it('shows status, toolkit and duration for a tool step', () => {
    expect(getTrajectoryStepMeta(toolStep)).toBe('ok · Child Writer · 20.0 s');
  });
});

describe('getTrajectoryStepSections', () => {
  it('lists only the filled payloads of a tool step', () => {
    expect(getTrajectoryStepSections(toolStep).map(s => s.label)).toEqual(['Input', 'Output']);
  });

  it('says when a payload was dropped for size', () => {
    const sections = getTrajectoryStepSections({ ...toolStep, tool_output: null, output_omitted: true });
    expect(sections.map(s => s.label)).toEqual(['Input', 'Note']);
  });
});

describe('getTrajectoryStateMessage', () => {
  it('is null for a recorded trajectory, even an empty one', () => {
    expect(getTrajectoryStateMessage({ trajectory_state: 'recorded', trajectory: { steps: [] } })).toBeNull();
  });

  it('explains each reason a trajectory is missing', () => {
    expect(
      getTrajectoryStateMessage({ trajectory_state: 'not_recorded', trajectory_state_reason: 'timeout' }),
    ).toMatch(/timed out/);
    expect(
      getTrajectoryStateMessage({
        trajectory_state: 'not_applicable',
        trajectory_state_reason: 'structure_only',
      }),
    ).toMatch(/configuration/);
    expect(getTrajectoryStateMessage(null)).toMatch(/No execution/);
  });
});

describe('getTrajectoryMetricItems', () => {
  it('lists counters in a fixed order and skips absent ones', () => {
    const items = getTrajectoryMetricItems({
      llm_calls: 3,
      tool_calls: 1,
      step_limit_hit: false,
      latency_ms: 24692,
    });
    expect(items).toEqual([
      { label: 'LLM calls', value: '3' },
      { label: 'Tool calls', value: '1' },
      { label: 'Step limit hit', value: 'no' },
      { label: 'Latency', value: '24.7 s' },
    ]);
  });

  it('is empty without metrics', () => {
    expect(getTrajectoryMetricItems(null)).toEqual([]);
  });
});

describe('getExcludedCasesNote', () => {
  it('is null when no case was left out', () => {
    expect(getExcludedCasesNote({ count: 0 })).toBeNull();
    expect(getExcludedCasesNote(undefined)).toBeNull();
  });

  it('counts the left-out cases and says why', () => {
    expect(getExcludedCasesNote({ count: 3, budget_blocked: 1, not_applicable: 0, not_recorded: 2 })).toBe(
      '3 cases not recorded (1 blocked by budget, 2 no trajectory)',
    );
    expect(getExcludedCasesNote({ count: 1, not_applicable: 1 })).toBe(
      '1 case not recorded (1 no agent run)',
    );
  });
});

describe('buildRunTrajectorySummary', () => {
  it('is null for a run that predates the rollup', () => {
    expect(buildRunTrajectorySummary(undefined)).toBeNull();
  });

  it('shows averages over recorded cases and the excluded note', () => {
    const summary = buildRunTrajectorySummary({
      cases: 5,
      recorded_cases: 2,
      averages: { llm_calls: 3, tool_calls: 2, tool_errors: 0, retries: 0.5, redundant_calls: 1 / 3 },
      step_limit_hits: 1,
      average_latency_ms: 2000.4,
      excluded_cases: { count: 3, budget_blocked: 1, not_applicable: 1, not_recorded: 1 },
    });

    expect(summary.coverage).toBe('Averaged over 2 of 5 cases');
    expect(summary.items).toEqual([
      { label: 'LLM calls / case', value: '3' },
      { label: 'Tool calls / case', value: '2' },
      { label: 'Tool errors / case', value: '0' },
      { label: 'Retries / case', value: '0.5' },
      { label: 'Redundant calls / case', value: '0.3' },
      { label: 'Step limit hit', value: '1 of 2 cases' },
      { label: 'Latency / case', value: '2.0 s' },
    ]);
    expect(summary.excluded).toBe(
      '3 cases not recorded (1 blocked by budget, 1 no agent run, 1 no trajectory)',
    );
  });

  it('drops averages when nothing was recorded', () => {
    const summary = buildRunTrajectorySummary({
      cases: 1,
      recorded_cases: 0,
      averages: { llm_calls: null },
      average_latency_ms: null,
      excluded_cases: { count: 1, not_recorded: 1 },
    });

    expect(summary.items).toEqual([]);
    expect(summary.excluded).toBe('1 case not recorded (1 no trajectory)');
  });
});

describe('pause and guardrail helpers', () => {
  const paused = {
    dataset_case_id: 7,
    status: 'guardrail_paused',
    trajectory: {
      pause: {
        pause_type: 'hitl',
        interaction_type: 'approve',
        guardrail_type: null,
        node_name: 'agent',
        tool_name: 'delete_branch',
        toolkit_name: 'GitHub',
        interrupts: 2,
      },
    },
    metrics: { guardrail_events: 1 },
  };

  it('lists the pause identities and skips empty ones', () => {
    const details = getCasePauseDetails(paused);
    expect(details.title).toBe('Paused for human review');
    expect(details.items).toEqual([
      { label: 'Pause type', value: 'hitl' },
      { label: 'Interaction', value: 'approve' },
      { label: 'Tool', value: 'delete_branch (GitHub)' },
      { label: 'Node', value: 'agent' },
      { label: 'Pending calls', value: '2' },
    ]);
  });

  it('still explains a paused status without stored details', () => {
    const details = getCasePauseDetails({ status: 'guardrail_paused', trajectory: null });
    expect(details.items).toEqual([]);
    expect(details.note).toMatch(/case failed/);
  });

  it('explains a park and ignores an unpaused case', () => {
    expect(getCasePauseDetails({ status: 'parked' }).title).toBe('Parked on a sub-agent fan-out');
    expect(getCasePauseDetails({ status: 'ok', trajectory: { steps: [] } })).toBeNull();
    expect(getCasePauseDetails(null)).toBeNull();
  });

  it('picks the chip from the status, then the guardrail counter', () => {
    expect(getCaseGuardrailChip(paused).label).toBe('Paused for review');
    expect(getCaseGuardrailChip({ status: 'parked' }).label).toBe('Parked');
    expect(getCaseGuardrailChip({ status: 'ok', metrics: { guardrail_events: 3 } })).toEqual({
      label: 'Guardrail: 3',
      tooltip: '3 tool calls were blocked or waited on authorization.',
    });
    expect(getCaseGuardrailChip({ status: 'ok', metrics: { guardrail_events: 0 } })).toBeNull();
    expect(getCaseGuardrailChip({ status: 'ok', metrics: {} })).toBeNull();
  });

  it('keys badges by dataset case id and leaves out cases with nothing to show', () => {
    const badges = buildCaseExecutionBadges([
      paused,
      { dataset_case_id: 8, status: 'ok', metrics: {} },
      { dataset_case_id: 9, status: 'ok', metrics: { llm_calls: 1, tool_calls: 0 } },
      { dataset_case_id: null, status: 'parked' },
    ]);
    expect(Object.keys(badges)).toEqual(['7', '9']);
    expect(badges[7].guardrail.label).toBe('Paused for review');
    expect(badges[9]).toEqual({ guardrail: null, counters: expect.objectContaining({ label: '1 step' }) });
    expect(buildCaseExecutionBadges(undefined)).toEqual({});
  });

  it('counts steps as LLM plus tool calls and shows errors and retries only when present', () => {
    expect(getCaseCounters({ metrics: { llm_calls: 3, tool_calls: 3, tool_errors: 1, retries: 1 } })).toEqual(
      {
        label: '6 steps · 1 tool error · 1 retry',
        tooltip: '3 LLM calls, 3 tool calls, 1 tool error, 1 retry',
        hasErrors: true,
      },
    );
    expect(
      getCaseCounters({ metrics: { llm_calls: 2, tool_calls: 1, tool_errors: 0, retries: 2 } }),
    ).toMatchObject({
      label: '3 steps · 2 retries',
      hasErrors: false,
    });
    expect(getCaseCounters({ metrics: {} })).toBeNull();
    expect(getCaseCounters({ metrics: null })).toBeNull();
    expect(getCaseCounters(undefined)).toBeNull();
  });

  it('flags blocked and auth-waiting tool steps only', () => {
    expect(isGuardrailStep({ kind: 'tool', status: 'blocked' })).toBe(true);
    expect(isGuardrailStep({ kind: 'tool', status: 'action_required' })).toBe(true);
    expect(isGuardrailStep({ kind: 'tool', status: 'paused' })).toBe(true);
    expect(isGuardrailStep({ kind: 'tool', status: 'error' })).toBe(false);
    expect(isGuardrailStep({ kind: 'llm', status: 'blocked' })).toBe(false);
  });
});
