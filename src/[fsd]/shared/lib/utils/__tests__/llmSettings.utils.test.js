import { describe, expect, it } from 'vitest';

import {
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';

import {
  cleanLLMSettings,
  defaultReasoningEffortFor,
  generateLLMSettings,
  getReasoningCapability,
  isLLMSettingsFamilyConflict,
  resetLLMSettingsForModel,
} from '../llmSettings.utils';

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

// #6819 — the reasoning control reads the model row's stored levels and default.
describe('getReasoningCapability (issue #6819)', () => {
  const capabilityOf = fields =>
    getReasoningCapability({ name: 'm', project_id: 1, supports_reasoning: true, ...fields });

  it('falls back to low/medium/high with medium default when the row has no levels', () => {
    expect(capabilityOf({})).toEqual({
      supported: true,
      levels: ['low', 'medium', 'high'],
      defaultLevel: 'medium',
      alwaysOn: false,
      isBudget: false,
    });
    expect(capabilityOf({ supported_efforts: [], default_effort: null })).toMatchObject({
      levels: ['low', 'medium', 'high'],
      defaultLevel: 'medium',
    });
  });

  it('renders stored levels in provider order with the stored default', () => {
    const capability = capabilityOf({
      supported_efforts: ['max', 'none', 'high', 'low'],
      default_effort: 'high',
      thinking_type: null,
    });
    expect(capability.levels).toEqual(['none', 'low', 'high', 'max']);
    expect(capability.defaultLevel).toBe('high');
  });

  it('never defaults to Off and falls back to medium, then the first selectable level', () => {
    expect(
      capabilityOf({ supported_efforts: ['none', 'medium', 'high'], default_effort: 'none' }).defaultLevel,
    ).toBe('medium');
    expect(
      capabilityOf({ supported_efforts: ['none', 'xhigh', 'max'], default_effort: null }).defaultLevel,
    ).toBe('xhigh');
  });

  it('flags always-on and token-budget models', () => {
    expect(capabilityOf({ thinking_type: 'always_on', supported_efforts: ['low', 'max'] })).toMatchObject({
      alwaysOn: true,
      isBudget: false,
    });
    expect(
      capabilityOf({ thinking_type: 'enabled', supported_efforts: ['low', 'medium', 'high'] }),
    ).toMatchObject({
      alwaysOn: false,
      isBudget: true,
    });
  });

  it('reports no support for non-reasoning models', () => {
    expect(getReasoningCapability(GPT_MODEL)).toMatchObject({
      supported: false,
      levels: [],
      defaultLevel: null,
    });
    expect(getReasoningCapability(undefined).supported).toBe(false);
  });

  it('seeds new settings with the model default instead of the Medium constant', () => {
    const fable = {
      ...REASONING_MODEL,
      supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
      default_effort: 'high',
    };
    expect(defaultReasoningEffortFor(fable)).toBe('high');
    expect(resetLLMSettingsForModel(fable)).toEqual({ temperature: null, reasoning_effort: 'high' });
    expect(generateLLMSettings(fable).reasoning_effort).toBe('high');
    expect(generateLLMSettings(fable, { reasoning_effort: 'low' }).reasoning_effort).toBe('low');
    expect(defaultReasoningEffortFor(REASONING_MODEL)).toBe(DEFAULT_REASONING_EFFORT);
  });
});
