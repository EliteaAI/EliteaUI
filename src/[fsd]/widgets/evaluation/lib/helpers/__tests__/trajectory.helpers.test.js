import { describe, expect, it } from 'vitest';

import {
  formatDurationMs,
  getTrajectoryMetricItems,
  getTrajectoryStateMessage,
  getTrajectoryStepMeta,
  getTrajectoryStepSections,
  getTrajectoryStepTitle,
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
