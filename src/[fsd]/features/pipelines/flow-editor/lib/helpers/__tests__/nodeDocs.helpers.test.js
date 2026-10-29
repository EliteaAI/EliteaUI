import { describe, expect, it } from 'vitest';

import { DeprecatedTips } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/deprecated.constants';
import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';

import { getNodeDocsLink } from '../nodeDocs.helpers';

describe('getNodeDocsLink', () => {
  it.each([
    [PipelineNodeTypes.LLM, 'LLM', 'interaction-nodes#llm-node'],
    [PipelineNodeTypes.Agent, 'Agent', 'interaction-nodes#agent-node'],
    [PipelineNodeTypes.Toolkit, 'Toolkit', 'execution-nodes#toolkit-node'],
    [PipelineNodeTypes.Mcp, 'MCP', 'execution-nodes#mcp-node'],
    [PipelineNodeTypes.Code, 'Code', 'execution-nodes#code-node'],
    [PipelineNodeTypes.Router, 'Router', 'control-flow-nodes#router-node'],
    [PipelineNodeTypes.Decision, 'Decision', 'control-flow-nodes#decision-node'],
    [PipelineNodeTypes.Hitl, 'Human-in-the-loop', 'control-flow-nodes#human-in-the-loop-node'],
    [PipelineNodeTypes.StateModifier, 'State modifier', 'utility-nodes#state-modifier-node'],
    [PipelineNodeTypes.Printer, 'Printer', 'utility-nodes#printer-node'],
  ])('links %s to its documentation section', (type, name, anchor) => {
    expect(getNodeDocsLink(type)).toEqual({
      url: `https://docs.elitea.ai/how-tos/pipelines/nodes/${anchor}`,
      tooltip: `Open ${name} node documentation`,
    });
  });

  it.each([
    PipelineNodeTypes.Function,
    PipelineNodeTypes.Tool,
    PipelineNodeTypes.Condition,
    PipelineNodeTypes.Pipeline,
    PipelineNodeTypes.Loop,
    PipelineNodeTypes.LoopFromTool,
  ])('links deprecated %s to its migration guide', type => {
    expect(getNodeDocsLink(type)).toEqual({
      url: DeprecatedTips[type].linkUrl,
      tooltip: 'Open migration guide',
    });
  });

  it('links Custom, which has no migration guide, to its documentation section', () => {
    expect(getNodeDocsLink(PipelineNodeTypes.Custom)).toEqual({
      url: 'https://docs.elitea.ai/how-tos/pipelines/nodes/execution-nodes#custom-node',
      tooltip: 'Open Custom node documentation',
    });
  });

  it.each([PipelineNodeTypes.End, PipelineNodeTypes.Ghost, PipelineNodeTypes.Default, 'unknown'])(
    'returns null for %s',
    type => {
      expect(getNodeDocsLink(type)).toBeNull();
    },
  );
});
