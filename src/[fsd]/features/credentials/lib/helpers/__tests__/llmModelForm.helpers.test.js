import { describe, expect, it } from 'vitest';

import {
  buildInitialLlmModelSettings,
  convertDisplayNameToLlmModelId,
  getLlmModelCredentialTypeTag,
  getLlmModelTier,
  getLlmModelTierFlags,
  mapLlmModelSaveErrorToFields,
  parseLlmModelTokenLimitInput,
  pickVisibleLlmModelErrors,
} from '../llmModelForm.helpers.js';

describe('convertDisplayNameToLlmModelId', () => {
  it('lowercases and turns spaces and symbols into dashes', () => {
    expect(convertDisplayNameToLlmModelId('Claude Sonnet 5 (Bedrock)')).toBe('claude-sonnet-5-bedrock');
    expect(convertDisplayNameToLlmModelId('GPT Test')).toBe('gpt-test');
    expect(convertDisplayNameToLlmModelId('gpt-5.6 luna')).toBe('gpt-5-6-luna');
  });

  it('keeps underscores but never starts or ends with a separator', () => {
    expect(convertDisplayNameToLlmModelId('my_model')).toBe('my_model');
    expect(convertDisplayNameToLlmModelId('  _ (Draft) model! _ ')).toBe('draft-model');
  });

  it('caps the ID at 64 characters without leaving a trailing separator', () => {
    const id = convertDisplayNameToLlmModelId(`${'a'.repeat(63)} b`);
    expect(id).toBe('a'.repeat(63));
  });

  it('returns an empty ID for an empty or symbol-only display name', () => {
    expect(convertDisplayNameToLlmModelId('')).toBe('');
    expect(convertDisplayNameToLlmModelId(undefined)).toBe('');
    expect(convertDisplayNameToLlmModelId('!!!')).toBe('');
  });
});

describe('model tier mapping', () => {
  it('reads the stored tier booleans as one tier', () => {
    expect(getLlmModelTier({ low_tier: false, high_tier: false })).toBe('not_set');
    expect(getLlmModelTier({})).toBe('not_set');
    expect(getLlmModelTier({ low_tier: true, high_tier: false })).toBe('low');
    expect(getLlmModelTier({ low_tier: false, high_tier: true })).toBe('high');
  });

  it('shows no tier when both are stored', () => {
    expect(getLlmModelTier({ low_tier: true, high_tier: true })).toBe('');
  });

  it('stores only the chosen tier', () => {
    expect(getLlmModelTierFlags('low')).toEqual({ low_tier: true, high_tier: false });
    expect(getLlmModelTierFlags('high')).toEqual({ low_tier: false, high_tier: true });
    expect(getLlmModelTierFlags('not_set')).toEqual({ low_tier: false, high_tier: false });
  });
});

describe('parseLlmModelTokenLimitInput', () => {
  it('stores whole numbers as numbers', () => {
    expect(parseLlmModelTokenLimitInput('400000')).toBe(400000);
    expect(parseLlmModelTokenLimitInput('0')).toBe(0);
  });

  it('keeps anything else as typed so validation can flag it', () => {
    expect(parseLlmModelTokenLimitInput('')).toBe('');
    expect(parseLlmModelTokenLimitInput('1.5')).toBe('1.5');
    expect(parseLlmModelTokenLimitInput('-3')).toBe('-3');
    expect(parseLlmModelTokenLimitInput('12k')).toBe('12k');
  });
});

describe('buildInitialLlmModelSettings', () => {
  it('starts with every switch off, no tier, empty limits and nothing selected', () => {
    const settings = buildInitialLlmModelSettings();
    expect(settings).toEqual({
      label: '',
      elitea_title: '',
      name: '',
      context_window: '',
      max_output_tokens: '',
      supports_vision: false,
      supports_reasoning: false,
      low_tier: false,
      high_tier: false,
      shared: false,
      openai_compatible: false,
    });
    expect(settings).not.toHaveProperty('ai_credentials');
    expect(settings).not.toHaveProperty('api_protocol');
  });
});

describe('getLlmModelCredentialTypeTag', () => {
  it('labels every AI credential type', () => {
    expect(getLlmModelCredentialTypeTag('open_ai')).toBe('OpenAI');
    expect(getLlmModelCredentialTypeTag('azure_open_ai')).toBe('Azure OpenAI');
    expect(getLlmModelCredentialTypeTag('ai_dial')).toBe('DIAL');
    expect(getLlmModelCredentialTypeTag('amazon_bedrock')).toBe('AWS Bedrock');
    expect(getLlmModelCredentialTypeTag('vertex_ai')).toBe('Vertex AI');
    expect(getLlmModelCredentialTypeTag('ollama')).toBe('Ollama');
  });

  it('falls back to the raw type for unknown credentials', () => {
    expect(getLlmModelCredentialTypeTag('new_provider')).toBe('new_provider');
    expect(getLlmModelCredentialTypeTag(undefined)).toBe('');
  });
});

describe('pickVisibleLlmModelErrors', () => {
  const errors = {
    label: 'Display name is required.',
    elitea_title: 'ID is required.',
    max_output_tokens: "Max output tokens can't be larger than the context window.",
    model_tier: 'Choose a model tier.',
    supports_reasoning: 'reasoning error',
  };
  const initialSettings = { label: '', elitea_title: '', context_window: 1000, max_output_tokens: 500 };

  it('hides every error of an untouched new model', () => {
    expect(
      pickVisibleLlmModelErrors({
        errors,
        settings: initialSettings,
        initialSettings,
        isEditing: false,
        showAll: false,
      }),
    ).toEqual({});
  });

  it('shows every error after a save attempt', () => {
    expect(
      pickVisibleLlmModelErrors({
        errors,
        settings: initialSettings,
        initialSettings,
        isEditing: false,
        showAll: true,
      }),
    ).toEqual(errors);
  });

  it('shows an error once a field it depends on changes', () => {
    const visible = pickVisibleLlmModelErrors({
      errors,
      settings: { ...initialSettings, context_window: 100 },
      initialSettings,
      isEditing: false,
      showAll: false,
    });
    expect(Object.keys(visible)).toEqual(['max_output_tokens']);
  });

  it('shows the ID error when the display name drives the ID', () => {
    const visible = pickVisibleLlmModelErrors({
      errors,
      settings: { ...initialSettings, label: '!!!' },
      initialSettings,
      isEditing: false,
      showAll: false,
    });
    expect(Object.keys(visible)).toEqual(['label', 'elitea_title']);
  });

  it('shows stored value errors of an existing model on open, but not the tier conflict', () => {
    const visible = pickVisibleLlmModelErrors({
      errors,
      settings: initialSettings,
      initialSettings,
      isEditing: true,
      showAll: false,
    });
    expect(Object.keys(visible)).toEqual(['label', 'max_output_tokens']);
  });
});

describe('mapLlmModelSaveErrorToFields', () => {
  it('puts an ID conflict on the ID field', () => {
    const error = { data: { field: 'elitea_title', error: "Credential with ID 'gpt' already exists" } };
    expect(mapLlmModelSaveErrorToFields(error)).toEqual({
      elitea_title: "Credential with ID 'gpt' already exists",
    });
  });

  it('puts the DIAL azure reasoning rejection on the Reasoning field', () => {
    const error = {
      data: {
        field: 'data',
        error: "Value error, api_protocol='azure' does not support reasoning; use 'anthropic' or 'openai'",
      },
    };
    expect(mapLlmModelSaveErrorToFields(error)).toEqual({
      supports_reasoning:
        "Reasoning isn't supported with the Azure OpenAI protocol. Choose OpenAI or Anthropic, or turn Reasoning off.",
    });
  });

  it('leaves other errors to the generic error message', () => {
    expect(mapLlmModelSaveErrorToFields({ data: { field: 'database', error: 'Database error' } })).toEqual(
      {},
    );
    expect(mapLlmModelSaveErrorToFields({ status: 500 })).toEqual({});
    expect(mapLlmModelSaveErrorToFields(undefined)).toEqual({});
  });
});
