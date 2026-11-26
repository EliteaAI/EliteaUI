import { describe, expect, it } from 'vitest';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import { getNodeAiButtonState, getNodeAiMode, isNodeAiSupported } from '../nodeAiMode.helpers';

const { PipelineNodeTypes } = FlowEditorConstants;

const MODEL = { model_name: 'gpt-5-mini' };

describe('nodeAiMode.helpers', () => {
  describe('isNodeAiSupported', () => {
    it.each([
      PipelineNodeTypes.LLM,
      PipelineNodeTypes.Agent,
      PipelineNodeTypes.Toolkit,
      PipelineNodeTypes.Mcp,
      PipelineNodeTypes.Code,
      PipelineNodeTypes.Router,
      PipelineNodeTypes.Decision,
      PipelineNodeTypes.Hitl,
      PipelineNodeTypes.StateModifier,
      PipelineNodeTypes.Printer,
    ])('supports %s', type => {
      expect(isNodeAiSupported(type)).toBe(true);
    });

    it.each([
      PipelineNodeTypes.Function,
      PipelineNodeTypes.Condition,
      PipelineNodeTypes.Pipeline,
      PipelineNodeTypes.Loop,
      PipelineNodeTypes.LoopFromTool,
      PipelineNodeTypes.Tool,
      PipelineNodeTypes.Custom,
      PipelineNodeTypes.End,
      undefined,
    ])('does not support %s', type => {
      expect(isNodeAiSupported(type)).toBe(false);
    });
  });

  describe('getNodeAiMode', () => {
    it.each([
      ['llm', { type: 'llm', input: [], output: [], transition: 'END', structured_output: false }],
      ['llm with blank texts', { type: 'llm', input_mapping: { task: { type: 'fixed', value: '  ' } } }],
      ['agent', { type: 'agent', tool: '', transition: 'END' }],
      ['toolkit', { type: 'toolkit', tool: '', toolkit_name: '', input_mapping: {} }],
      ['mcp', { type: 'mcp', tool: '' }],
      ['code', { type: 'code', code: { type: 'fixed', value: '' } }],
      ['router', { type: 'router', condition: '', routes: [], default_output: '' }],
      ['decision', { type: 'decision', description: '', nodes: [] }],
      [
        'hitl with only the default reject',
        {
          type: 'hitl',
          user_message: { type: 'fixed', value: '' },
          routes: { approve: '', edit: '', reject: 'END' },
        },
      ],
      ['state_modifier', { type: 'state_modifier', template: '', variables_to_clean: [] }],
      ['printer', { type: 'printer', transition: 'END' }],
    ])('is build for an empty %s node', (_label, node) => {
      expect(getNodeAiMode(node)).toBe('build');
    });

    it.each([
      ['llm system', { type: 'llm', input_mapping: { system: { type: 'fixed', value: 'Be brief.' } } }],
      ['llm task', { type: 'llm', input_mapping: { task: { type: 'fstring', value: 'Hi {input}' } } }],
      ['llm tools', { type: 'llm', tool_names: { github: ['list_issues'] } }],
      ['agent tool', { type: 'agent', tool: 'Daily Agent' }],
      ['agent task', { type: 'agent', input_mapping: { task: { type: 'fixed', value: 'go' } } }],
      ['toolkit', { type: 'toolkit', toolkit_name: 'github' }],
      ['mcp tool', { type: 'mcp', tool: 'search' }],
      ['code', { type: 'code', code: { type: 'fixed', value: 'x = 1' } }],
      ['router condition', { type: 'router', condition: "{{ 'END' }}" }],
      ['router routes', { type: 'router', routes: ['a'] }],
      ['decision description', { type: 'decision', description: 'pick' }],
      ['decision nodes', { type: 'decision', nodes: ['a'] }],
      ['hitl message', { type: 'hitl', user_message: { type: 'fixed', value: 'Approve?' } }],
      ['hitl approve', { type: 'hitl', routes: { approve: 'next', edit: '', reject: 'END' } }],
      ['hitl edit', { type: 'hitl', routes: { approve: '', edit: 'next', reject: 'END' } }],
      ['state_modifier', { type: 'state_modifier', template: '{{ x }}' }],
      ['printer message', { type: 'printer', input_mapping: { printer: { type: 'fixed', value: 'Done' } } }],
      ['printer final message', { type: 'printer', final_message: 'Bye' }],
    ])('is edit for a configured %s', (_label, node) => {
      expect(getNodeAiMode(node)).toBe('edit');
    });

    it('ignores input, output, structured output, chat history and transition', () => {
      expect(
        getNodeAiMode({
          type: 'llm',
          input: ['issues'],
          output: ['summary'],
          structured_output: true,
          transition: 'next',
          input_mapping: { chat_history: { type: 'variable', value: 'messages' } },
        }),
      ).toBe('build');
    });

    it('treats an empty tool_names object as not configured', () => {
      expect(getNodeAiMode({ type: 'llm', tool_names: {} })).toBe('build');
      expect(getNodeAiMode({ type: 'llm', tool_names: { github: [] } })).toBe('build');
    });
  });

  describe('getNodeAiButtonState', () => {
    const base = {
      yamlNode: { id: 'n', type: 'llm' },
      disabled: false,
      isRunningPipeline: false,
      isVersionLocked: false,
      llmSettings: MODEL,
    };

    it('is enabled with Build with AI for an empty node', () => {
      expect(getNodeAiButtonState(base)).toEqual({
        visible: true,
        enabled: true,
        mode: 'build',
        label: 'Build with AI',
        tooltip: 'Build with AI',
      });
    });

    it('is enabled with Edit with AI for a configured node', () => {
      const state = getNodeAiButtonState({
        ...base,
        yamlNode: { id: 'n', type: 'code', code: { type: 'fixed', value: 'x' } },
      });
      expect(state).toMatchObject({
        enabled: true,
        mode: 'edit',
        label: 'Edit with AI',
        tooltip: 'Edit with AI',
      });
    });

    it('is hidden for deprecated types', () => {
      expect(getNodeAiButtonState({ ...base, yamlNode: { id: 'n', type: 'loop' } }).visible).toBe(false);
    });

    it.each([
      ['a viewer', { disabled: true }, "You can't edit this pipeline"],
      ['a published version', { isVersionLocked: true }, "This version can't be edited"],
      ['a running pipeline', { isRunningPipeline: true }, 'Wait for the run to finish'],
      ['no model', { llmSettings: null }, 'Select a model for this pipeline to use AI'],
      [
        'a model without a name',
        { llmSettings: { model_name: '' } },
        'Select a model for this pipeline to use AI',
      ],
    ])('is disabled for %s', (_label, overrides, tooltip) => {
      const state = getNodeAiButtonState({ ...base, ...overrides });
      expect(state.visible).toBe(true);
      expect(state.enabled).toBe(false);
      expect(state.tooltip).toBe(tooltip);
      expect(state.label).toBe('Build with AI');
    });

    it('checks read-only before the run and the model', () => {
      expect(
        getNodeAiButtonState({ ...base, disabled: true, isRunningPipeline: true, llmSettings: null }).tooltip,
      ).toBe("You can't edit this pipeline");
      expect(getNodeAiButtonState({ ...base, isRunningPipeline: true, llmSettings: null }).tooltip).toBe(
        'Wait for the run to finish',
      );
    });
  });
});
