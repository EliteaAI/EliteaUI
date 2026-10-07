import { describe, expect, it } from 'vitest';

import { LLM_MODEL_PROFILES_FIXTURE } from '../../../ui/llm-model-form/__tests__/llmModelProfiles.fixture.js';
import { mapLlmModelSaveErrorToFields } from '../llmModelForm.helpers.js';
import {
  buildReasoningSettingsFromProfile,
  getEffortLevelOptions,
  getLlmModelReasoningDescription,
  getLlmModelRecognition,
  getUnsupportedStoredLevels,
  isAzureReasoningWarned,
  isLlmModelReasoningConfigured,
  normalizeLlmModelName,
  recognizeLlmModelProfile,
  toggleEffortLevel,
} from '../llmModelProfiles.helpers.js';

const recognizedId = name => recognizeLlmModelProfile(name, LLM_MODEL_PROFILES_FIXTURE)?.id ?? null;

describe('recognizeLlmModelProfile', () => {
  it.each([
    ['claude-fable-5-1', 'anthropic-fable-mythos'],
    ['eu.anthropic.claude-opus-4-7', 'anthropic-adaptive'],
    ['claude-opus-4.8', 'anthropic-adaptive'],
    ['claude_sonnet_5', 'anthropic-adaptive'],
    ['global.anthropic.claude-sonnet-5', 'anthropic-adaptive'],
    ['eu.anthropic.claude-haiku-4-5-20251001-v1:0', 'anthropic-legacy-budget'],
    ['claude-sonnet-4-5', 'anthropic-legacy-budget'],
    ['claude-3.7-sonnet', 'anthropic-legacy-budget'],
    ['global.openai.gpt-5.6-luna', 'openai-gpt-5-6'],
    ['GPT-5.6', 'openai-gpt-5-6'],
    ['gpt-5.1-codex', 'openai-gpt-5-2-5-1'],
    ['gpt-5.2', 'openai-gpt-5-2-5-1'],
    ['gpt-5-mini', 'openai-gpt-5'],
    ['gpt-5-2025-08-07', 'openai-gpt-5'],
    ['gpt-4.1', 'openai-gpt-4'],
    ['gpt-4o-2024-11-20', 'openai-gpt-4'],
    ['global.xai.grok-4.6', null],
    ['model-router', null],
    ['', null],
    [undefined, null],
  ])('matches %s like the backend does', (name, profileId) => {
    expect(recognizedId(name)).toBe(profileId);
  });

  it('applies the payload normalization and the digit boundary', () => {
    expect(normalizeLlmModelName('  GPT_5.6-Luna ')).toBe('gpt-5-6-luna');
    expect(normalizeLlmModelName('A.b', { lowercase: false, replace: {} })).toBe('A.b');
    // gpt-5-2 must not claim a dated original gpt-5 id
    expect(recognizedId('gpt-5-2025-08-07')).toBe('openai-gpt-5');
    expect(recognizedId('gpt-5-2')).toBe('openai-gpt-5-2-5-1');
  });

  it('recognizes nothing without a payload', () => {
    expect(recognizeLlmModelProfile('claude-fable-5-1', undefined)).toBeNull();
    expect(recognizeLlmModelProfile('claude-fable-5-1', { profiles: [] })).toBeNull();
  });
});

describe('profile-derived settings', () => {
  it('copies a reasoning profile into the four stored fields', () => {
    const profile = LLM_MODEL_PROFILES_FIXTURE.profiles.find(
      candidate => candidate.id === 'anthropic-adaptive',
    );
    expect(buildReasoningSettingsFromProfile(profile)).toEqual({
      supports_reasoning: true,
      thinking_type: 'adaptive',
      supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
      default_effort: 'medium',
    });
    expect(buildReasoningSettingsFromProfile(profile).supported_efforts).not.toBe(profile.supported_efforts);
  });

  it('turns reasoning off with null fields for no-reasoning and unrecognized models', () => {
    const gpt4 = LLM_MODEL_PROFILES_FIXTURE.profiles.find(candidate => candidate.id === 'openai-gpt-4');
    const off = {
      supports_reasoning: false,
      thinking_type: null,
      supported_efforts: null,
      default_effort: null,
    };
    expect(buildReasoningSettingsFromProfile(gpt4)).toEqual(off);
    expect(buildReasoningSettingsFromProfile(null)).toEqual(off);
  });

  it('treats a row as configured once any of the three fields is stored', () => {
    expect(isLlmModelReasoningConfigured({ supports_reasoning: true })).toBe(false);
    expect(
      isLlmModelReasoningConfigured({ thinking_type: null, supported_efforts: null, default_effort: null }),
    ).toBe(false);
    expect(isLlmModelReasoningConfigured({ supported_efforts: [] })).toBe(true);
    expect(isLlmModelReasoningConfigured({ default_effort: 'high' })).toBe(true);
  });

  it('keeps the option order when toggling levels', () => {
    const order = ['none', 'low', 'medium', 'high'];
    expect(toggleEffortLevel(['high', 'low'], 'none', order)).toEqual(['none', 'low', 'high']);
    expect(toggleEffortLevel(['none', 'low', 'high'], 'low', order)).toEqual(['none', 'high']);
  });
});

describe('recognition line and toggle description', () => {
  const byId = id => LLM_MODEL_PROFILES_FIXTURE.profiles.find(candidate => candidate.id === id);

  it('describes recognized, no-reasoning, unrecognized and empty names', () => {
    expect(getLlmModelRecognition('claude-sonnet-5', byId('anthropic-adaptive'))).toEqual({
      tone: 'success',
      text: 'Recognized: Anthropic Claude Opus 5 / Sonnet 5 / Opus 4.7-4.8. Only the settings it supports are shown.',
    });
    expect(getLlmModelRecognition('gpt-4.1', byId('openai-gpt-4'))).toEqual({
      tone: 'success',
      text: "Recognized: OpenAI GPT-4 family. Reasoning isn't supported, so its settings are hidden.",
    });
    expect(getLlmModelRecognition('grok-4.6', null)).toEqual({
      tone: 'warning',
      text: 'Not recognized. All reasoning options are shown; check compatibility with DevOps.',
    });
    expect(getLlmModelRecognition('   ', null)).toBeNull();
  });

  it('words the lock by its reason', () => {
    expect(getLlmModelReasoningDescription(byId('anthropic-fable-mythos'))).toMatch(
      /^Always on for this model\./,
    );
    expect(getLlmModelReasoningDescription(byId('anthropic-adaptive'))).toMatch(/^Always on in Elitea\./);
    expect(getLlmModelReasoningDescription(byId('openai-gpt-5-6'))).toMatch(
      /^On by default for this model\./,
    );
    expect(getLlmModelReasoningDescription(null)).toMatch(/^Thinks before answering\./);
  });
});

describe('mapLlmModelSaveErrorToFields for reasoning fields', () => {
  it.each([
    ['supports_reasoning', 'supports_reasoning'],
    ['data.thinking_type', 'thinking_type'],
    ['supported_efforts', 'supported_efforts'],
    ['data.supported_efforts.1', 'supported_efforts'],
    ['default_effort', 'default_effort'],
  ])('maps the backend field %s to the form field %s', (field, formField) => {
    expect(mapLlmModelSaveErrorToFields({ data: { field, error: 'rejected' } })).toEqual({
      [formField]: 'rejected',
    });
  });

  it('leaves unknown fields to the generic banner', () => {
    expect(mapLlmModelSaveErrorToFields({ data: { field: 'context_window', error: 'rejected' } })).toEqual(
      {},
    );
  });
});

describe('stored levels outside the profile', () => {
  const gpt52 = LLM_MODEL_PROFILES_FIXTURE.profiles.find(candidate => candidate.id === 'openai-gpt-5-2-5-1');
  const levels = LLM_MODEL_PROFILES_FIXTURE.effort_levels;

  it('keeps them visible as unsupported options in provider order', () => {
    const options = getEffortLevelOptions(gpt52, levels, ['max', 'low', 'xhigh']);
    expect(options.map(option => option.value)).toEqual(['none', 'low', 'medium', 'high', 'xhigh', 'max']);
    expect(options.filter(option => option.unsupported).map(option => option.value)).toEqual([
      'xhigh',
      'max',
    ]);
    expect(getUnsupportedStoredLevels(gpt52, ['low', 'xhigh'])).toEqual(['xhigh']);
  });

  it('flags nothing for unrecognized models or levels the profile lists', () => {
    expect(getUnsupportedStoredLevels(null, ['xhigh'])).toEqual([]);
    expect(getUnsupportedStoredLevels(gpt52, ['low', 'high'])).toEqual([]);
    expect(getEffortLevelOptions(null, levels, ['xhigh']).every(option => !option.unsupported)).toBe(true);
  });
});

// #6919: DIAL serves Gemini on the azure route and reasoning works there, so only
// recognized OpenAI/Anthropic models get the warning
describe('isAzureReasoningWarned', () => {
  const warned = (name, overrides = {}) =>
    isAzureReasoningWarned({
      isApiProtocolShown: true,
      apiProtocol: 'azure',
      supportsReasoning: true,
      profile: recognizeLlmModelProfile(name, LLM_MODEL_PROFILES_FIXTURE),
      ...overrides,
    });

  it.each(['anthropic.claude-sonnet-5', 'gpt-5.4-2026-03-05'])('warns for recognized %s', name => {
    expect(warned(name)).toBe(true);
  });

  it.each(['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'custom-unrecognized-model'])(
    'never warns for %s',
    name => {
      expect(warned(name)).toBe(false);
    },
  );

  it.each([
    ['another protocol', { apiProtocol: 'anthropic' }],
    ['reasoning off', { supportsReasoning: false }],
    ['a non-DIAL credential', { isApiProtocolShown: false }],
  ])('does not warn with %s', (_label, overrides) => {
    expect(warned('anthropic.claude-sonnet-5', overrides)).toBe(false);
  });
});
