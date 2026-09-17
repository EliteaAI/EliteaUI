import { describe, expect, it } from 'vitest';

import { TOOL_ACTION_NAMES, TOOL_ACTION_TYPES } from '@/common/constants';
import { getToolInfoFromAction } from '@/common/toolActionUitls';

describe('getToolInfoFromAction — LLM/Summary actions', () => {
  it('uses ls_model_name as the toolkit name when present', () => {
    const { toolkitName, toolkitType } = getToolInfoFromAction({
      type: TOOL_ACTION_TYPES.Llm,
      name: 'Thinking step',
      toolMeta: { ls_model_name: 'gpt-4o' },
    });

    expect(toolkitName).toBe('gpt-4o');
    expect(toolkitType).toBe('model');
  });

  // Regression: refreshing the page while a response is still generating persists an
  // LLM thinking step with no model_name. toolkitName used to come back undefined and
  // ActionView crashed the whole chat route on `toolkitName.replace(...)` (#6654).
  it('never returns an undefined toolkit name for an LLM step without a model name', () => {
    const { toolkitName } = getToolInfoFromAction({
      type: TOOL_ACTION_TYPES.Llm,
      name: 'Thinking step',
      toolMeta: { ls_model_name: '' },
    });

    expect(toolkitName).toBe(TOOL_ACTION_NAMES.Llm);
    expect(typeof toolkitName).toBe('string');
  });

  it('falls back to the pipeline node name when the model name is missing', () => {
    const { toolkitName, originalToolName } = getToolInfoFromAction({
      type: TOOL_ACTION_TYPES.Llm,
      name: 'Executor',
      toolMeta: {},
    });

    expect(toolkitName).toBe('Executor');
    expect(originalToolName).toBe('Executor');
  });

  it('does not use a generic node name as a chip label', () => {
    const { toolkitName, originalToolName } = getToolInfoFromAction({
      type: TOOL_ACTION_TYPES.Llm,
      name: 'agent',
      toolMeta: {},
    });

    expect(toolkitName).toBe(TOOL_ACTION_NAMES.Llm);
    expect(originalToolName).toBeUndefined();
  });

  it('falls back to the summary label for a summary step with no name', () => {
    const { toolkitName } = getToolInfoFromAction({
      type: TOOL_ACTION_TYPES.Summary,
      toolMeta: {},
    });

    expect(toolkitName).toBe(TOOL_ACTION_NAMES.Summary);
  });

  it('still prefers the summary action name over the fallback', () => {
    const { toolkitName } = getToolInfoFromAction({
      type: TOOL_ACTION_TYPES.Summary,
      name: 'Summarizing',
      toolMeta: {},
    });

    expect(toolkitName).toBe('Summarizing');
  });

  it('survives an action with no toolMeta at all', () => {
    expect(() => getToolInfoFromAction({ type: TOOL_ACTION_TYPES.Llm, name: 'Thinking step' })).not.toThrow();
  });
});
