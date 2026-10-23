import { describe, expect, it } from 'vitest';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import { getNodeConfigIssues, isEmptyMappingValue } from '../nodeConfig.helpers';

const { PipelineNodeTypes } = FlowEditorConstants;

describe('nodeConfig.helpers', () => {
  describe('isEmptyMappingValue', () => {
    it('treats missing, blank and empty-list values as empty', () => {
      expect(isEmptyMappingValue(undefined)).toBe(true);
      expect(isEmptyMappingValue({ type: 'fixed' })).toBe(true);
      expect(isEmptyMappingValue({ type: 'fixed', value: '  ' })).toBe(true);
      expect(isEmptyMappingValue({ type: 'variable', value: [] })).toBe(true);
    });

    it('keeps real values, including false and 0', () => {
      expect(isEmptyMappingValue({ type: 'fixed', value: 'text' })).toBe(false);
      expect(isEmptyMappingValue({ type: 'variable', value: ['input'] })).toBe(false);
      expect(isEmptyMappingValue({ type: 'fixed', value: false })).toBe(false);
      expect(isEmptyMappingValue({ type: 'fixed', value: 0 })).toBe(false);
    });
  });

  describe('getNodeConfigIssues', () => {
    it('returns nothing without a node', () => {
      expect(getNodeConfigIssues(undefined)).toEqual([]);
    });

    it('asks to select an agent', () => {
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Agent })).toEqual(['Select an agent']);
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Agent, tool: 'Summarizer' })).toEqual([]);
    });

    it('asks to select a toolkit, then a tool', () => {
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Toolkit })).toEqual(['Select a toolkit']);
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Toolkit, toolkit_name: 'github' })).toEqual([
        'Select a tool',
      ]);
      expect(
        getNodeConfigIssues({ type: PipelineNodeTypes.Toolkit, toolkit_name: 'github', tool: 'get_issue' }),
      ).toEqual([]);
    });

    it('asks to select an MCP, then a tool', () => {
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Mcp })).toEqual(['Select an MCP']);
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Mcp, toolkit_name: 'jira' })).toEqual([
        'Select a tool',
      ]);
    });

    it('asks for a decision option', () => {
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Decision, nodes: [] })).toEqual([
        'Add at least one decision option',
      ]);
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Decision, nodes: ['LLM 1'] })).toEqual([]);
    });

    it('asks for a router route', () => {
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Router, routes: [] })).toEqual([
        'Add at least one route',
      ]);
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Router, routes: ['LLM 1'] })).toEqual([]);
    });

    it('flags a HITL Edit route without an edit state key', () => {
      const hitl = {
        type: PipelineNodeTypes.Hitl,
        routes: { approve: 'LLM 1', edit: 'Decision 1', reject: 'END' },
      };

      expect(getNodeConfigIssues({ ...hitl, edit_state_key: ' ' })).toEqual([
        'Provide an edit state key before using the Edit route',
      ]);
      expect(getNodeConfigIssues({ ...hitl, edit_state_key: 'draft' })).toEqual([]);
      expect(getNodeConfigIssues({ ...hitl, routes: { ...hitl.routes, edit: '' } })).toEqual([]);
    });

    it('lists empty required input mappings', () => {
      const node = {
        type: PipelineNodeTypes.Toolkit,
        toolkit_name: 'github',
        tool: 'get_issue',
        input_mapping: { repo: { type: 'fixed', value: '' }, issue: { type: 'fixed', value: '' }, page: {} },
      };

      expect(getNodeConfigIssues(node, { requiredInputs: ['repo'] })).toEqual([
        'Fill in the required input: repo',
      ]);
      expect(getNodeConfigIssues(node, { requiredInputs: ['repo', 'issue'] })).toEqual([
        'Fill in the required inputs: repo, issue',
      ]);
      expect(
        getNodeConfigIssues(
          { ...node, input_mapping: { repo: { type: 'variable', value: 'input' } } },
          { requiredInputs: ['repo'] },
        ),
      ).toEqual([]);
    });

    it('does not flag node types without rules', () => {
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.LLM })).toEqual([]);
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Printer })).toEqual([]);
      expect(getNodeConfigIssues({ type: PipelineNodeTypes.Code })).toEqual([]);
    });
  });
});
