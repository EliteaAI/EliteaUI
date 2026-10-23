import { describe, expect, it } from 'vitest';

import {
  DeprecatedConstants,
  FlowEditorConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import { getAddableNodeTypes } from '../nodeType.helpers';

const { PipelineNodeTypes } = FlowEditorConstants;

describe('getAddableNodeTypes', () => {
  it('returns the 10 addable node types sorted by display name', () => {
    expect(getAddableNodeTypes()).toEqual([
      PipelineNodeTypes.Agent,
      PipelineNodeTypes.Code,
      PipelineNodeTypes.Decision,
      PipelineNodeTypes.Hitl,
      PipelineNodeTypes.LLM,
      PipelineNodeTypes.Mcp,
      PipelineNodeTypes.Printer,
      PipelineNodeTypes.Router,
      PipelineNodeTypes.StateModifier,
      PipelineNodeTypes.Toolkit,
    ]);
  });

  it('excludes deprecated and invisible node types', () => {
    const types = getAddableNodeTypes();

    DeprecatedConstants.DeprecatedNodes.forEach(type => expect(types).not.toContain(type));
    expect(types).not.toContain(PipelineNodeTypes.End);
    expect(types).not.toContain(PipelineNodeTypes.Ghost);
    expect(types).not.toContain(PipelineNodeTypes.Default);
  });

  it('has a description for every addable node type', () => {
    getAddableNodeTypes().forEach(type =>
      expect(FlowEditorConstants.PipelineNodeDescriptions[type]).toBeTruthy(),
    );
  });
});
