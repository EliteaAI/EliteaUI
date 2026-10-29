import { describe, expect, it } from 'vitest';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import {
  canDuplicateNodeType,
  clearNodeConnections,
  duplicateYamlNode,
  getDuplicateNodeId,
} from '../nodeOperations.helpers';

const { PipelineNodeTypes } = FlowEditorConstants;

describe('getDuplicateNodeId', () => {
  it('appends _copy to the original name', () => {
    expect(getDuplicateNodeId({ name: 'llm_1', nodes: [{ id: 'llm_1' }] })).toBe('llm_1_copy');
  });

  it('takes the next free suffix when the copy name is used', () => {
    const nodes = [{ id: 'llm_1' }, { id: 'llm_1_copy' }, { id: 'llm_1_copy_2' }];

    expect(getDuplicateNodeId({ name: 'llm_1', nodes })).toBe('llm_1_copy_3');
  });

  it('compares names ignoring spaces, as renaming does', () => {
    const nodes = [{ id: 'LLM 1' }, { id: 'LLM1_copy' }];

    expect(getDuplicateNodeId({ name: 'LLM 1', nodes })).toBe('LLM 1_copy_2');
  });

  it('skips names taken by an attached toolkit', () => {
    expect(getDuplicateNodeId({ name: 'jira', nodes: [{ id: 'jira' }], toolNames: ['jira_copy'] })).toBe(
      'jira_copy_2',
    );
  });
});

describe('canDuplicateNodeType', () => {
  it('refuses End and Ghost', () => {
    expect(canDuplicateNodeType(PipelineNodeTypes.End)).toBe(false);
    expect(canDuplicateNodeType(PipelineNodeTypes.Ghost)).toBe(false);
    expect(canDuplicateNodeType(PipelineNodeTypes.LLM)).toBe(true);
  });
});

const CONFIG = {
  input: ['messages'],
  output: ['result'],
  input_mapping: { query: { type: 'variable', value: 'messages' } },
  structured_output: true,
  custom_yaml_only_key: { nested: ['a', 'b'] },
};

const ADDABLE_NODES = [
  [PipelineNodeTypes.Agent, { tool: 'Reviewer', transition: 'llm_2' }, {}],
  [PipelineNodeTypes.Code, { code: { type: 'fixed', value: 'x = 1' }, transition: 'END' }, {}],
  [
    PipelineNodeTypes.Decision,
    { description: 'Pick a branch', nodes: ['a', 'b'], default_output: 'c' },
    { nodes: [], default_output: '' },
  ],
  [
    PipelineNodeTypes.Hitl,
    { user_message: { type: 'fixed', value: 'OK?' }, routes: { approve: 'a', edit: 'b', reject: 'END' } },
    { routes: { approve: '', edit: '', reject: '' } },
  ],
  [PipelineNodeTypes.LLM, { prompt: { type: 'fixed', value: 'Hi' }, tool_names: { jira: ['t'] } }, {}],
  [PipelineNodeTypes.Mcp, { toolkit_name: 'mcp_server', tool: 'search', transition: 'a' }, {}],
  [PipelineNodeTypes.Printer, { printer: { type: 'fixed', value: 'Done' }, transition: 'END' }, {}],
  [
    PipelineNodeTypes.Router,
    { condition: '{% if x %}a{% endif %}', routes: ['a', 'b'], default_output: 'c' },
    { routes: [], default_output: '' },
  ],
  [PipelineNodeTypes.StateModifier, { template: '{{ x }}', variables_to_clean: ['y'], transition: 'a' }, {}],
  [PipelineNodeTypes.Toolkit, { toolkit_name: 'jira', tool: 'get_issue', transition: 'a' }, {}],
];

describe('duplicateYamlNode', () => {
  it.each(ADDABLE_NODES)(
    'copies a %s node as is, except its name and connections',
    (type, specific, clearedConnections) => {
      const original = { id: 'original', type, ...CONFIG, ...specific };
      const copy = duplicateYamlNode(original, 'original_copy');

      const expected = { ...original, ...clearedConnections };
      delete expected.transition;
      expect(copy).toEqual({ ...expected, id: 'original_copy' });
      expect(copy).not.toHaveProperty('transition');
    },
  );

  it('deep-clones, so editing the copy leaves the original untouched', () => {
    const original = { id: 'llm_1', type: PipelineNodeTypes.LLM, ...CONFIG };
    const copy = duplicateYamlNode(original, 'llm_1_copy');

    copy.input.push('extra');
    copy.custom_yaml_only_key.nested.push('c');
    copy.input_mapping.query.value = 'changed';

    expect(original.input).toEqual(['messages']);
    expect(original.custom_yaml_only_key.nested).toEqual(['a', 'b']);
    expect(original.input_mapping.query.value).toBe('messages');
  });
});

describe('clearNodeConnections', () => {
  it('keeps a node without connections as it is', () => {
    const node = { id: 'llm_1', type: PipelineNodeTypes.LLM, input: [] };

    expect(clearNodeConnections(node)).toEqual(node);
  });
});
