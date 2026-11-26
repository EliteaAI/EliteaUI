// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { applyDraftToPipeline, mergeDraftTools } from '../nodeDraftApply.helpers';

const PIPELINE = {
  entry_point: 'fetch',
  state: { issues: { type: 'list' } },
  nodes: [
    { id: 'fetch', type: 'toolkit', transition: 'summarize' },
    { id: 'summarize', type: 'llm', transition: 'END' },
  ],
  interrupt_before: ['summarize'],
};

describe('applyDraftToPipeline (AC-24)', () => {
  it('replaces only the node and adds the checked state variables', () => {
    const node = { id: 'summarize', type: 'llm', transition: 'END', output: ['summary'] };
    const next = applyDraftToPipeline(PIPELINE, node, [
      { name: 'summary', type: 'str', checked: true },
      { name: 'skipped', type: 'list', checked: false },
    ]);
    expect(next.nodes).toEqual([PIPELINE.nodes[0], node]);
    expect(next.state).toEqual({ issues: { type: 'list' }, summary: { type: 'str' } });
    expect(next.entry_point).toBe('fetch');
    expect(next.interrupt_before).toEqual(['summarize']);
    expect(PIPELINE.nodes[1].output).toBeUndefined();
  });

  it('never overwrites an existing state variable', () => {
    const next = applyDraftToPipeline(PIPELINE, PIPELINE.nodes[1], [
      { name: 'issues', type: 'str', checked: true },
    ]);
    expect(next.state.issues).toEqual({ type: 'list' });
  });

  it('starts from the default state when the pipeline has none', () => {
    const { state, ...withoutState } = PIPELINE;
    expect(state).toBeTruthy();
    const next = applyDraftToPipeline(withoutState, PIPELINE.nodes[1], [
      { name: 'a', type: 'str', checked: true },
    ]);
    expect(next.state).toEqual({ input: { type: 'str' }, messages: { type: 'list' }, a: { type: 'str' } });
  });
});

describe('mergeDraftTools', () => {
  const GITHUB = { id: 1, type: 'github', name: 'github_elitea', settings: { selected_tools: ['a'] } };
  const JIRA = { id: 2, type: 'jira', name: 'jira_platform', settings: { selected_tools: ['b'] } };

  it('adds the tools picked in the sandbox and keeps the rest', () => {
    expect(mergeDraftTools([GITHUB], [GITHUB, JIRA])).toEqual([GITHUB, JIRA]);
  });

  it('keeps the current tools when the sandbox picked nothing', () => {
    expect(mergeDraftTools([GITHUB], null)).toEqual([GITHUB]);
  });

  it('adds backend attachments that are not attached yet', () => {
    expect(mergeDraftTools([GITHUB], null, [JIRA])).toEqual([GITHUB, JIRA]);
    expect(mergeDraftTools([GITHUB], [GITHUB, JIRA], [JIRA])).toEqual([GITHUB, JIRA]);
  });
});
