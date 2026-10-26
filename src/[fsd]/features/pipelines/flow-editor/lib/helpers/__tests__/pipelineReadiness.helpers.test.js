// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  TEST_BLOCK_REASONS,
  getNodeNotConfiguredReason,
  getTestBlockReason,
  isEndReachable,
} from '../pipelineReadiness.helpers';

describe('getTestBlockReason', () => {
  it('blocks an empty pipeline', () => {
    expect(getTestBlockReason({ nodes: [] })).toBe(TEST_BLOCK_REASONS.noNodes);
    expect(getTestBlockReason(undefined)).toBe(TEST_BLOCK_REASONS.noNodes);
  });

  it('blocks when the entry point is missing or points to an unknown node', () => {
    const nodes = [{ id: 'llm_1', type: 'llm', transition: 'END' }];
    expect(getTestBlockReason({ nodes })).toBe(TEST_BLOCK_REASONS.noEntryPoint);
    expect(getTestBlockReason({ nodes, entry_point: 'ghost' })).toBe(TEST_BLOCK_REASONS.noEntryPoint);
  });

  it('allows a linear flow that ends in END', () => {
    expect(
      getTestBlockReason({
        entry_point: 'a',
        nodes: [
          { id: 'a', type: 'llm', transition: 'b' },
          { id: 'b', type: 'code', transition: 'END' },
        ],
      }),
    ).toBe('');
  });

  it('treats a node without a transition as connected to END, as the canvas draws it', () => {
    expect(getTestBlockReason({ entry_point: 'a', nodes: [{ id: 'a', type: 'llm' }] })).toBe('');
  });

  it('blocks a transition to a node that does not exist', () => {
    expect(
      getTestBlockReason({ entry_point: 'a', nodes: [{ id: 'a', type: 'llm', transition: 'missing' }] }),
    ).toBe(TEST_BLOCK_REASONS.noPathToEnd);
  });

  it('blocks a cycle that never reaches END', () => {
    expect(
      getTestBlockReason({
        entry_point: 'a',
        nodes: [
          { id: 'a', type: 'llm', transition: 'b' },
          { id: 'b', type: 'llm', transition: 'a' },
        ],
      }),
    ).toBe(TEST_BLOCK_REASONS.noPathToEnd);
  });

  it('follows router routes and default output', () => {
    expect(
      getTestBlockReason({
        entry_point: 'r',
        nodes: [
          { id: 'r', type: 'router', condition: 'x', routes: ['a'], default_output: 'b' },
          { id: 'a', type: 'llm', transition: 'a' },
          { id: 'b', type: 'llm', transition: 'END' },
        ],
      }),
    ).toBe('');
  });

  it('follows legacy condition branches', () => {
    expect(
      getTestBlockReason({
        entry_point: 'a',
        nodes: [
          {
            id: 'a',
            type: 'llm',
            condition: { conditional_outputs: ['b'], default_output: 'missing' },
          },
          { id: 'b', type: 'llm', transition: 'END' },
        ],
      }),
    ).toBe('');
  });

  it('treats an omitted legacy condition default_output as END, as the SDK does', () => {
    expect(
      getTestBlockReason({
        entry_point: 'a',
        nodes: [{ id: 'a', type: 'llm', condition: { conditional_outputs: ['a'] } }],
      }),
    ).toBe('');
  });

  it('treats an omitted legacy decision default_output as END, as the SDK does', () => {
    expect(
      getTestBlockReason({
        entry_point: 'a',
        nodes: [{ id: 'a', type: 'llm', decision: { nodes: ['a'] } }],
      }),
    ).toBe('');
  });

  it('treats an omitted decision node default_output as END, as the SDK does', () => {
    expect(
      getTestBlockReason({
        entry_point: 'llm',
        nodes: [
          { id: 'llm', type: 'llm', transition: 'd' },
          { id: 'd', type: 'decision', nodes: ['llm'] },
        ],
      }),
    ).toBe('');
  });

  it('blocks an explicitly empty default_output, which the SDK does not route to END', () => {
    expect(
      getTestBlockReason({
        entry_point: 'llm',
        nodes: [
          { id: 'llm', type: 'llm', transition: 'd' },
          { id: 'd', type: 'decision', nodes: ['llm'], default_output: '' },
        ],
      }),
    ).toBe(TEST_BLOCK_REASONS.noPathToEnd);
    expect(
      getTestBlockReason({
        entry_point: 'a',
        nodes: [{ id: 'a', type: 'llm', condition: { conditional_outputs: ['a'], default_output: '' } }],
      }),
    ).toBe(TEST_BLOCK_REASONS.noPathToEnd);
  });

  it('follows HITL routes', () => {
    expect(
      getTestBlockReason({
        entry_point: 'h',
        nodes: [{ id: 'h', type: 'hitl', routes: { approve: 'END' } }],
      }),
    ).toBe('');
  });
});

describe('getTestBlockReason with node issues', () => {
  const pipeline = {
    entry_point: 'a',
    nodes: [
      { id: 'a', type: 'agent', transition: 'b' },
      { id: 'b', type: 'toolkit', transition: 'END' },
    ],
  };

  it('blocks on the first node, in YAML order, that is not configured', () => {
    expect(
      getTestBlockReason(pipeline, {
        b: ['Select a tool'],
        a: ['Select an agent', 'Fill in the required input: x'],
      }),
    ).toBe(getNodeNotConfiguredReason('a', 'Select an agent'));
    expect(getNodeNotConfiguredReason('a', 'Select an agent')).toBe('Configure node "a": Select an agent');
  });

  it('ignores reports for nodes that no longer exist and empty reports', () => {
    expect(getTestBlockReason(pipeline, { removed_node: ['Select a tool'], a: [] })).toBe('');
  });

  it('reports graph problems before configuration problems', () => {
    expect(getTestBlockReason({ ...pipeline, entry_point: undefined }, { a: ['Select an agent'] })).toBe(
      TEST_BLOCK_REASONS.noEntryPoint,
    );
  });
});

describe('isEndReachable', () => {
  it('ignores edges without a target', () => {
    expect(isEndReachable([{ source: 'a', target: undefined }], 'a')).toBe(false);
  });
});
