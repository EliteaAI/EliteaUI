import { describe, expect, it } from 'vitest';

import {
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';

import {
  cleanLLMSettings,
  generateLLMSettings,
  isLLMSettingsFamilyConflict,
  resetLLMSettingsForModel,
} from './llmSettings.utils';

const REASONING_MODEL = { name: 'claude-sonnet-4-5', project_id: 1, supports_reasoning: true };
const GPT_MODEL = { name: 'gpt-5.2', project_id: 1, supports_reasoning: false };

// Issue #5859 — the shape sent to the backend must match the resolved model's reasoning family,
// or the new write-time rejection returns HTTP 400.
describe('llmSettings family alignment (issue #5859)', () => {
  describe('resetLLMSettingsForModel', () => {
    it('drops temperature and sets reasoning_effort for a reasoning model', () => {
      expect(resetLLMSettingsForModel(REASONING_MODEL)).toEqual({
        temperature: null,
        reasoning_effort: DEFAULT_REASONING_EFFORT,
      });
    });

    it('keeps temperature and nulls reasoning_effort for a non-reasoning model', () => {
      expect(resetLLMSettingsForModel(GPT_MODEL)).toEqual({
        temperature: DEFAULT_TEMPERATURE,
        reasoning_effort: null,
      });
    });

    it('realigns a stale GPT-shaped seed once a reasoning model resolves', () => {
      // Mirrors NewConversationView: temperature-only seed built before the model is known.
      const staleSeed = { temperature: 0.6, max_tokens: -1 };
      const realigned = { ...staleSeed, ...resetLLMSettingsForModel(REASONING_MODEL) };
      expect(realigned.temperature).toBeNull();
      expect(realigned.reasoning_effort).toBe(DEFAULT_REASONING_EFFORT);
      expect(isLLMSettingsFamilyConflict(realigned.temperature, realigned.reasoning_effort)).toBe(false);
    });
  });

  describe('generateLLMSettings against a resolved model', () => {
    it('produces reasoning shape (no temperature) for a reasoning model', () => {
      const s = generateLLMSettings(REASONING_MODEL);
      expect(s.reasoning_effort).toBe(DEFAULT_REASONING_EFFORT);
      expect(s).not.toHaveProperty('temperature');
    });

    it('produces temperature shape for a non-reasoning model', () => {
      const s = generateLLMSettings(GPT_MODEL);
      expect(s.temperature).toBe(DEFAULT_TEMPERATURE);
      expect(s).not.toHaveProperty('reasoning_effort');
    });
  });

  describe('cleanLLMSettings does not, by itself, add a missing reasoning_effort', () => {
    // Documents why the NewConversationView resync is needed: cleanLLMSettings only strips,
    // so a temperature-only seed survives onto a reasoning model unless realigned first.
    it('leaves a temperature-only seed intact on a reasoning model', () => {
      const cleaned = cleanLLMSettings({ temperature: 0.6, max_tokens: -1 }, REASONING_MODEL);
      expect(cleaned.temperature).toBe(0.6);
      expect(cleaned).not.toHaveProperty('reasoning_effort');
    });
  });
});
