import { describe, expect, it } from 'vitest';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import { getNodeSummary, toPreviewText } from '../nodeSummary.helpers';

const { PipelineNodeTypes } = FlowEditorConstants;

const summaryOf = (yamlNode, options = {}) => getNodeSummary(yamlNode, { type: yamlNode?.type, ...options });

describe('getNodeSummary', () => {
  it('summarises an Agent by its agent and task', () => {
    expect(
      summaryOf({
        type: PipelineNodeTypes.Agent,
        tool: 'Researcher',
        input_mapping: { task: { type: 'fixed', value: 'Find  the\nanswer' } },
      }),
    ).toEqual({ primary: 'Researcher', secondary: 'Find the answer' });
  });

  it('summarises Code by its first code line and outputs', () => {
    expect(
      summaryOf({
        type: PipelineNodeTypes.Code,
        code: { type: 'fixed', value: '\n  import json\nprint(1)' },
        output: ['result', 'messages'],
      }),
    ).toEqual({ primary: 'import json', secondary: 'result, messages' });
  });

  it('summarises Decision and Router by their criteria and branch counts', () => {
    expect(
      summaryOf({ type: PipelineNodeTypes.Decision, description: 'Is it urgent?', nodes: ['a', 'b'] }),
    ).toEqual({ primary: 'Is it urgent?', secondary: '2 outputs' });
    expect(summaryOf({ type: PipelineNodeTypes.Router, condition: '{{ x }}', routes: ['a'] })).toEqual({
      primary: '{{ x }}',
      secondary: '1 route',
    });
  });

  it('summarises HITL by its message and configured routes', () => {
    expect(
      summaryOf({
        type: PipelineNodeTypes.Hitl,
        user_message: { type: 'fixed', value: 'Approve?' },
        routes: { approve: 'publish', edit: '', reject: 'END' },
      }),
    ).toEqual({ primary: 'Approve?', secondary: 'Approve → publish · Reject → END' });
  });

  it('summarises LLM by its task and toolkits', () => {
    expect(
      summaryOf({
        type: PipelineNodeTypes.LLM,
        input_mapping: { task: { type: 'fixed', value: 'Summarise' } },
        tool_names: { github: ['get_issue', 'list_issues'], jira: ['search'] },
      }),
    ).toEqual({ primary: 'Summarise', secondary: '2 toolkits · 3 tools' });
  });

  it('summarises MCP and Toolkit by toolkit › tool and required parameters', () => {
    expect(
      summaryOf(
        {
          type: PipelineNodeTypes.Toolkit,
          toolkit_name: 'github',
          tool: 'get_issue',
          input_mapping: { repo: { type: 'fixed', value: 'elitea' }, number: { type: 'fixed', value: '' } },
        },
        { requiredInputs: ['repo', 'number'] },
      ),
    ).toEqual({ primary: 'github › get_issue', secondary: 'Params 1/2 set' });
    expect(summaryOf({ type: PipelineNodeTypes.Mcp, toolkit_name: 'fetch' })).toEqual({
      primary: 'fetch',
      secondary: '',
    });
  });

  it('summarises Printer and State modifier', () => {
    expect(summaryOf({ type: PipelineNodeTypes.Printer, final_message: 'Done' })).toEqual({
      primary: 'Done',
      secondary: '',
    });
    expect(summaryOf({ type: PipelineNodeTypes.StateModifier, template: '{{ a }}', output: ['a'] })).toEqual({
      primary: '{{ a }}',
      secondary: 'a',
    });
  });

  it('marks deprecated types regardless of their YAML', () => {
    expect(getNodeSummary(undefined, { type: PipelineNodeTypes.Loop, isDeprecated: true })).toEqual({
      primary: 'Loop',
      secondary: '⚠ Deprecated',
    });
  });

  it('returns empty lines when there is nothing to show', () => {
    expect(getNodeSummary(undefined, { type: PipelineNodeTypes.LLM })).toEqual({
      primary: '',
      secondary: '',
    });
    expect(summaryOf({ type: PipelineNodeTypes.LLM })).toEqual({ primary: '', secondary: '' });
  });
});

describe('toPreviewText', () => {
  it('flattens whitespace and stringifies non-strings', () => {
    expect(toPreviewText('a\n  b')).toBe('a b');
    expect(toPreviewText(['x'])).toBe('["x"]');
    expect(toPreviewText(null)).toBe('');
  });
});
