import { describe, expect, it } from 'vitest';

import {
  OUTPUT_NOT_STORED_NOTE,
  OUTPUT_SIZE_CUT_NOTE,
  buildCaseExecutionBadges,
  buildRunTrajectorySummary,
  formatDurationMs,
  formatNodePath,
  getCaseCounters,
  getCaseGuardrailChip,
  getCasePauseDetails,
  getExcludedCasesNote,
  getNodeStepNext,
  getRunHistoryGuardrails,
  getRunHistoryTrajectory,
  getTrajectoryMetricItems,
  getTrajectoryStateMessage,
  getTrajectoryStepDepth,
  getTrajectoryStepMeta,
  getTrajectoryStepSections,
  getTrajectoryStepTitle,
  isGuardrailStep,
  isPipelineTrajectory,
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

  it('tells a suite opt-out from a size cut', () => {
    const omitted = { ...toolStep, tool_output: null, output_omitted: true };
    const note = options => getTrajectoryStepSections(omitted, options).at(-1).content;
    expect(note({ outputsStored: false })).toBe(OUTPUT_NOT_STORED_NOTE);
    expect(note({ outputsStored: true })).toBe(OUTPUT_SIZE_CUT_NOTE);
    expect(note()).toBe(OUTPUT_SIZE_CUT_NOTE);
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

  it('leads with the sub-agent dispatch of a fanned-out case', () => {
    const items = getTrajectoryMetricItems({
      llm_calls: 7,
      dispatch_state: 'reconciled',
      dispatch_waves: 1,
      dispatch_children: 2,
    });
    expect(items[0]).toEqual({ label: 'Dispatch', value: 'reconciled · 1 wave · 2 sub-agents' });
  });

  it('names a fan-out that did not reconcile', () => {
    const [item] = getTrajectoryMetricItems({ dispatch_state: 'dispatch_not_reconciled', dispatch_waves: 2 });
    expect(item.value).toBe('not reconciled · 2 waves');
  });

  it('names a fan-out that hit the case deadline', () => {
    // core's TIMED_OUT is the bare 'timeout', unlike the dispatch_* states
    const [item] = getTrajectoryMetricItems({ dispatch_state: 'timeout', dispatch_waves: 1 });
    expect(item.value).toBe('timed out · 1 wave');
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

  it('shows latency percentiles only when the run has both', () => {
    const latency = rollup =>
      buildRunTrajectorySummary({ cases: 3, recorded_cases: 3, ...rollup }).items.filter(item =>
        item.label.startsWith('Latency'),
      );

    expect(latency({ p50_latency_ms: 850, p95_latency_ms: 3120.6 })).toEqual([
      { label: 'Latency p50 / p95', value: '850 ms / 3.1 s' },
    ]);
    expect(latency({ p50_latency_ms: 850, p95_latency_ms: null })).toEqual([]);
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

  it('shows the recorded pause policy, raw when unknown', () => {
    const withPolicy = policy => ({
      ...paused,
      trajectory: { pause: { ...paused.trajectory.pause, policy } },
    });
    expect(getCasePauseDetails(withPolicy('fail_case')).items.at(-1)).toEqual({
      label: 'Policy',
      value: 'Fail the case',
    });
    expect(getCasePauseDetails(withPolicy('deny_continue')).items.at(-1)).toEqual({
      label: 'Policy',
      value: 'deny_continue',
    });
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
    expect(getCaseGuardrailChip({ status: 'guardrail_blocked' }).label).toBe('Input blocked');
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

describe('getRunHistoryGuardrails', () => {
  const rollup = totals => ({ trajectory_rollup: { cases: 3, recorded_cases: 2, totals } });

  it('sums guardrail events over the recorded cases', () => {
    expect(getRunHistoryGuardrails(rollup({ guardrail_events: 3 }))).toEqual({
      label: '3',
      tooltip: '3 guardrail events over 2 cases (paused for review, blocked or waiting on auth)',
      hasEvents: true,
    });
    expect(getRunHistoryGuardrails(rollup({ guardrail_events: 0 }))).toMatchObject({
      label: '0',
      hasEvents: false,
    });
  });

  it('is empty without a recorded case or the counter', () => {
    expect(getRunHistoryGuardrails(rollup({}))).toBeNull();
    expect(
      getRunHistoryGuardrails({ trajectory_rollup: { recorded_cases: 0, totals: { guardrail_events: 0 } } }),
    ).toBeNull();
    expect(getRunHistoryGuardrails({})).toBeNull();
  });
});

describe('getRunHistoryTrajectory', () => {
  it('averages LLM plus tool calls and reports the tool-error rate and step-limit hits', () => {
    const meta = {
      trajectory_rollup: {
        cases: 3,
        recorded_cases: 2,
        averages: { llm_calls: 1.5, tool_calls: 1 },
        totals: { tool_calls: 4, tool_errors: 1 },
        step_limit_hits: 1,
      },
    };
    expect(getRunHistoryTrajectory(meta)).toEqual({
      label: '2.5',
      tooltip:
        'Steps per case, averaged over 2 of 3 cases · tool-error rate 25% (1 of 4 tool calls) · step limit hit 1 of 2 cases',
      hasErrors: true,
    });
  });

  it('dashes the rate when no tool was called and is empty without a rollup', () => {
    const meta = {
      trajectory_rollup: { cases: 1, recorded_cases: 1, averages: { llm_calls: 1 }, totals: {} },
    };
    expect(getRunHistoryTrajectory(meta)).toMatchObject({ label: '1', hasErrors: false });
    expect(getRunHistoryTrajectory(meta).tooltip).toContain('tool-error rate — (0 of 0 tool calls)');
    expect(getRunHistoryTrajectory({})).toBeNull();
    expect(getRunHistoryTrajectory({ trajectory_rollup: { cases: 1, recorded_cases: 0 } })).toBeNull();
  });
});

// #7015: a pipeline's trajectory lists its nodes; the llm/tool steps they made carry `node`
const nodeStep = {
  i: 2,
  kind: 'node',
  node: 'Route',
  node_type: 'router',
  graph_step: 3,
  status: 'ok',
  edge: { type: 'conditional', next: 'Status' },
  hitl: null,
  error: null,
  duration_ms: 5,
};

describe('pipeline node steps', () => {
  it('titles a node with its name and type', () => {
    expect(getTrajectoryStepTitle(nodeStep)).toBe('#3 · Node · Route (router)');
    expect(getTrajectoryStepTitle({ ...nodeStep, node_type: null })).toBe('#3 · Node · Route');
    expect(getTrajectoryStepTitle({ ...nodeStep, node: null })).toBe('#3 · Node · unknown node (router)');
    expect(getTrajectoryStepTitle({ ...nodeStep, node: null, node_type: null })).toBe(
      '#3 · Node · unknown node',
    );
  });

  it('shows where the node went next, its status and duration', () => {
    expect(getTrajectoryStepMeta(nodeStep)).toBe('→ Status · ok · 5 ms');
    expect(getTrajectoryStepMeta({ ...nodeStep, edge: null })).toBe('ok · 5 ms');
    expect(getNodeStepNext({ ...nodeStep, edge: null, hitl: { action: 'approve', next: 'Answer' } })).toBe(
      '→ Answer',
    );
  });

  it('expands to the edge taken, the human review and the error', () => {
    expect(getTrajectoryStepSections(nodeStep)).toEqual([
      { label: 'Next node', content: 'Status (Condition)' },
      { label: 'Graph step', content: 3 },
    ]);
    const paused = {
      ...nodeStep,
      edge: null,
      status: 'interrupted',
      hitl: { action: 'interrupt', next: null },
    };
    expect(getTrajectoryStepSections(paused)).toEqual([
      { label: 'Human review', content: 'interrupt' },
      { label: 'Graph step', content: 3 },
    ]);
  });

  it('indents calls made inside a pipeline node, and once more inside a sub-agent', () => {
    const inPipeline = { inPipeline: true };
    expect(getTrajectoryStepDepth(nodeStep, inPipeline)).toBe(0);
    expect(getTrajectoryStepDepth(llmStep, inPipeline)).toBe(0);
    expect(getTrajectoryStepDepth({ ...llmStep, node: 'Classify' }, inPipeline)).toBe(1);
    expect(getTrajectoryStepDepth({ ...toolStep, node: 'Ask', parent_agent: 'Child' }, inPipeline)).toBe(2);
    expect(getTrajectoryStepDepth({ ...toolStep, parent_agent: 'Child' }, inPipeline)).toBe(1);
  });

  it('says why a fan-out parked when the run waited for it', () => {
    const details = getCasePauseDetails({
      status: 'parked',
      metrics: { dispatch_state: 'dispatch_too_many_waves', dispatch_waves: 8, dispatch_children: 3 },
    });
    expect(details.items).toEqual([{ label: 'Dispatch', value: 'too many waves · 8 waves · 3 sub-agents' }]);
    expect(details.note).toMatch(/could not collect their answers/);
    expect(getCasePauseDetails({ status: 'parked' }).note).toMatch(/cannot resume/);
  });

  it("does not indent a plain agent's steps, which carry the one-node graph's name", () => {
    // LangGraph tags every step of a plain agent with `langgraph_node: 'agent'`.
    expect(getTrajectoryStepDepth({ ...llmStep, node: 'agent' })).toBe(0);
    expect(getTrajectoryStepDepth({ ...toolStep, node: 'agent', parent_agent: 'Child' })).toBe(1);
  });

  it('tells a pipeline trajectory by its node steps or node sequence', () => {
    expect(isPipelineTrajectory({ steps: [{ ...llmStep, node: 'agent' }] })).toBe(false);
    expect(isPipelineTrajectory({ steps: [nodeStep] })).toBe(true);
    expect(isPipelineTrajectory({ steps: [], node_sequence: [] })).toBe(true);
    expect(isPipelineTrajectory(undefined)).toBe(false);
  });

  it("shows a node still open when the run stopped as 'did not finish'", () => {
    expect(getTrajectoryStepMeta({ ...nodeStep, edge: null, hitl: null, status: 'running' })).toContain(
      'did not finish',
    );
  });

  it('labels an edge without a type or without a next node', () => {
    const sections = edge => getTrajectoryStepSections({ ...nodeStep, hitl: null, graph_step: null, edge });
    expect(sections({ next: 'Lookup', type: null })).toEqual([{ label: 'Next node', content: 'Lookup' }]);
    expect(sections({ next: null, type: 'conditional' })).toEqual([
      { label: 'Next node', content: '(Condition)' },
    ]);
    expect(sections({ next: null, type: null })).toEqual([]);
  });

  it('collapses repeated nodes in the path and cuts a long one, keeping the full path', () => {
    expect(formatNodePath(['Ask', 'Ask', 'Ask', 'Route', 'Ask'])).toEqual({
      short: 'Ask ×3 → Route → Ask',
      full: 'Ask → Ask → Ask → Route → Ask',
    });
    const long = formatNodePath(Array.from({ length: 30 }, (_, i) => `N${i}`));
    expect(long.short.split(' → ')).toHaveLength(13);
    expect(long.short).toMatch(/… 18 more$/);
    expect(long.full.split(' → ')).toHaveLength(30);
    expect(formatNodePath([])).toBeNull();
  });

  it('lists the node count and path first among the counters', () => {
    const items = getTrajectoryMetricItems({
      node_count: 4,
      node_path: ['Classify', 'Route', 'Status'],
      llm_calls: 2,
    });
    expect(items.slice(0, 3)).toEqual([
      { label: 'Nodes', value: '4' },
      { label: 'Node path', value: 'Classify → Route → Status', title: 'Classify → Route → Status' },
      { label: 'LLM calls', value: '2' },
    ]);
  });
});
