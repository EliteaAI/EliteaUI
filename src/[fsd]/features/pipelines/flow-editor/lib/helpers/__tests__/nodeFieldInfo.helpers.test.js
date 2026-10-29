import { describe, expect, it } from 'vitest';

import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import {
  COMMON_NODE_FIELD_INFO,
  NODE_FIELD_INFO,
  NODE_FIELD_KEYS,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/nodeFieldInfo.constants';

import {
  getInputMappingFieldInfo,
  getNodeFieldInfo,
  getNodeFieldInfoOf,
  getValueDataTypeInfo,
} from '../nodeFieldInfo.helpers';

describe('getNodeFieldInfo', () => {
  it('returns the node-specific text', () => {
    expect(getNodeFieldInfo(PipelineNodeTypes.LLM, NODE_FIELD_KEYS.input)).toBe(
      'State variables this node can read in System and Task.',
    );
    expect(getNodeFieldInfo(PipelineNodeTypes.Code, NODE_FIELD_KEYS.input)).toBe(
      'State variables available to the code.',
    );
  });

  it('falls back to the common text for shared fields', () => {
    expect(getNodeFieldInfo(PipelineNodeTypes.Router, NODE_FIELD_KEYS.name)).toBe(
      COMMON_NODE_FIELD_INFO[NODE_FIELD_KEYS.name],
    );
    expect(getNodeFieldInfo(undefined, NODE_FIELD_KEYS.type)).toBe(
      COMMON_NODE_FIELD_INFO[NODE_FIELD_KEYS.type],
    );
  });

  it('returns an empty string for an unknown field', () => {
    expect(getNodeFieldInfo(PipelineNodeTypes.LLM, 'unknown')).toBe('');
  });

  it('gives deprecated nodes the Toolkit texts for Input, Output and Structured output', () => {
    [
      PipelineNodeTypes.Function,
      PipelineNodeTypes.Tool,
      PipelineNodeTypes.Loop,
      PipelineNodeTypes.Custom,
    ].forEach(type => {
      expect(getNodeFieldInfo(type, NODE_FIELD_KEYS.output)).toBe(
        NODE_FIELD_INFO[PipelineNodeTypes.Toolkit][NODE_FIELD_KEYS.output],
      );
    });
    expect(getNodeFieldInfo(PipelineNodeTypes.Function, NODE_FIELD_KEYS.toolkit)).toMatch(/^Deprecated: /);
  });

  it('treats the Default node type as Custom', () => {
    expect(getNodeFieldInfo(PipelineNodeTypes.Default, NODE_FIELD_KEYS.configuration)).toBe(
      getNodeFieldInfo(PipelineNodeTypes.Custom, NODE_FIELD_KEYS.configuration),
    );
  });
});

describe('getInputMappingFieldInfo', () => {
  it('uses the fixed text for the agent Task and Chat history', () => {
    expect(getInputMappingFieldInfo(PipelineNodeTypes.Agent, 'task', 'ignored')).toBe(
      NODE_FIELD_INFO[PipelineNodeTypes.Agent].task,
    );
    expect(getInputMappingFieldInfo(PipelineNodeTypes.Agent, 'chat_history')).toBe(
      NODE_FIELD_INFO[PipelineNodeTypes.Agent].chat_history,
    );
  });

  it('uses the agent variable description, then the agent fallback', () => {
    expect(getInputMappingFieldInfo(PipelineNodeTypes.Agent, 'topic', 'The topic to write about')).toBe(
      'The topic to write about',
    );
    expect(getInputMappingFieldInfo(PipelineNodeTypes.Agent, 'topic', '')).toBe(
      "Value passed to the agent's topic input.",
    );
  });

  it('uses the tool schema description, then the tool fallback', () => {
    expect(getInputMappingFieldInfo(PipelineNodeTypes.Toolkit, 'jql', 'JQL query')).toBe('JQL query');
    expect(getInputMappingFieldInfo(PipelineNodeTypes.Mcp, 'query')).toBe(
      "Value passed to the tool's query argument.",
    );
  });

  it('never gives a tool parameter named like a node field the node field text', () => {
    expect(getInputMappingFieldInfo(PipelineNodeTypes.Toolkit, 'input')).toBe(
      "Value passed to the tool's input argument.",
    );
  });
});

describe('getNodeFieldInfoOf', () => {
  it('returns a getter bound to one node type', () => {
    const getRouterFieldInfo = getNodeFieldInfoOf(PipelineNodeTypes.Router);
    expect(getRouterFieldInfo(NODE_FIELD_KEYS.routes)).toBe(
      getNodeFieldInfo(PipelineNodeTypes.Router, NODE_FIELD_KEYS.routes),
    );
  });
});

describe('getValueDataTypeInfo', () => {
  it('names the expected data type, string by default', () => {
    expect(getValueDataTypeInfo('integer')).toBe('Value of integer type is expected');
    expect(getValueDataTypeInfo()).toBe('Value of string type is expected');
  });
});
