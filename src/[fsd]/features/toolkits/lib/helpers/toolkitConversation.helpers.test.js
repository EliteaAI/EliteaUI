import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';

import { createToolkitConversationWithParticipant } from './toolkitConversation.helpers';

const REASONING_MODEL = { name: 'claude-sonnet-4-5', project_id: 1, supports_reasoning: true };
const GPT_MODEL = { name: 'gpt-5.2', project_id: 1, supports_reasoning: false };

// Capture the persisted llm_settings without hitting the real API.
const runHelper = async ({ selectedModel, llmSettings }) => {
  const createConversation = vi.fn().mockResolvedValue({ data: { id: 7, participants: [] } });
  const addParticipant = vi.fn().mockResolvedValue({ data: [] });
  await createToolkitConversationWithParticipant({
    createConversation,
    addParticipant,
    toolkitId: 99,
    projectId: 1,
    values: { settings: {}, type: 'github' },
    llmSettings,
    selectedModel,
  });
  return addParticipant.mock.calls[0][0].participants[0].entity_settings.llm_settings;
};

// Issue #5859 — the toolkit conversation must persist a family-correct shape, matching the
// backend write-time rejection of a temperature on a reasoning model.
describe('createToolkitConversationWithParticipant llm_settings alignment (issue #5859)', () => {
  it('drops a stale temperature and sets reasoning_effort for a reasoning model', async () => {
    // Mirrors the DEFAULT_LLM_SETTINGS seam: temperature-only base built before the model resolved.
    const settings = await runHelper({
      selectedModel: REASONING_MODEL,
      llmSettings: { temperature: 0.6, max_tokens: -1, top_k: 40 },
    });
    expect(settings).not.toHaveProperty('temperature');
    expect(settings.reasoning_effort).toBe(DEFAULT_REASONING_EFFORT);
    expect(settings.model_name).toBe('claude-sonnet-4-5');
    expect(settings.top_k).toBe(40); // tuned fields preserved
  });

  it('keeps temperature for a non-reasoning model', async () => {
    const settings = await runHelper({
      selectedModel: GPT_MODEL,
      llmSettings: { temperature: 0.6, max_tokens: -1, top_k: 40 },
    });
    expect(settings.temperature).toBe(0.6);
    expect(settings).not.toHaveProperty('reasoning_effort');
    expect(settings.model_name).toBe('gpt-5.2');
  });

  it('supplies the default temperature for a non-reasoning model when none was tuned', async () => {
    const settings = await runHelper({
      selectedModel: GPT_MODEL,
      llmSettings: { max_tokens: -1 },
    });
    expect(settings.temperature).toBe(DEFAULT_TEMPERATURE);
    expect(settings).not.toHaveProperty('reasoning_effort');
  });
});
