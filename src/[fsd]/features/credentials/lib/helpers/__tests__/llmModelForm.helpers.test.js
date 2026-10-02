import { describe, expect, it } from 'vitest';

import {
  buildInitialLlmModelSettings,
  buildLlmModelConnectionTestBody,
  convertDisplayNameToLlmModelId,
  formatLlmModelConnectionLatency,
  getLlmModelConnectionTestFailureText,
  getLlmModelConnectionTestMissingFields,
  getLlmModelConnectionTestMissingFieldsText,
  getLlmModelCredentialTypeTag,
  getLlmModelInputLabelProps,
  getLlmModelSelectLabelProps,
  getLlmModelTier,
  getLlmModelTierFlags,
  mapLlmModelSaveErrorToFields,
  omitLlmModelErrorsDependingOn,
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
      thinking_type: null,
      supported_efforts: null,
      default_effort: null,
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

describe('omitLlmModelErrorsDependingOn', () => {
  const serverErrors = { supports_reasoning: 'reasoning rejected', elitea_title: 'ID taken' };

  it('drops an error when a field it depends on is edited', () => {
    expect(omitLlmModelErrorsDependingOn(serverErrors, 'api_protocol')).toEqual({ elitea_title: 'ID taken' });
    expect(omitLlmModelErrorsDependingOn(serverErrors, 'ai_credentials')).toEqual({
      elitea_title: 'ID taken',
    });
    expect(omitLlmModelErrorsDependingOn(serverErrors, 'label')).toEqual({
      supports_reasoning: 'reasoning rejected',
    });
  });

  it('drops an error when its own field is edited', () => {
    expect(omitLlmModelErrorsDependingOn({ name: 'bad name' }, 'name')).toEqual({});
  });

  it('returns the same object when nothing depends on the edited field', () => {
    expect(omitLlmModelErrorsDependingOn(serverErrors, 'shared')).toBe(serverErrors);
  });
});

describe('mapLlmModelSaveErrorToFields', () => {
  it.each(['data.description', 'description'])('puts a description rejection (%s) on its field', field => {
    const error = { data: { field, error: 'String should have at most 40 characters' } };
    expect(mapLlmModelSaveErrorToFields(error)).toEqual({
      description: 'String should have at most 40 characters',
    });
  });

  it('leaves a description error of another entity unmapped', () => {
    const error = { data: { field: 'data.ai_credentials.description', error: 'Field required' } };
    expect(mapLlmModelSaveErrorToFields(error)).toEqual({});
  });

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

  it('leaves other reasoning errors to the generic error message, as the backend wrote them', () => {
    const error = {
      data: { field: 'data', error: "Value error, reasoning effort 'extreme' is not supported" },
    };
    expect(mapLlmModelSaveErrorToFields(error)).toEqual({});
  });

  it('leaves other errors to the generic error message', () => {
    expect(mapLlmModelSaveErrorToFields({ data: { field: 'database', error: 'Database error' } })).toEqual(
      {},
    );
    expect(mapLlmModelSaveErrorToFields({ status: 500 })).toEqual({});
    expect(mapLlmModelSaveErrorToFields(undefined)).toEqual({});
  });
});

describe('getLlmModelConnectionTestMissingFields', () => {
  const CREDENTIALS = { elitea_title: 'creds', private: false };

  it('asks for AI credentials and a non-blank Model name', () => {
    expect(getLlmModelConnectionTestMissingFields({ settings: { name: '  ' } })).toEqual([
      'ai_credentials',
      'name',
    ]);
    expect(
      getLlmModelConnectionTestMissingFields({ settings: { name: 'gpt-4o', ai_credentials: CREDENTIALS } }),
    ).toEqual([]);
  });

  it('asks for API protocol only when the credential needs one', () => {
    const settings = { name: 'claude', ai_credentials: CREDENTIALS };
    expect(
      getLlmModelConnectionTestMissingFields({ settings, isApiProtocolShown: true, apiProtocol: '' }),
    ).toEqual(['api_protocol']);
    expect(
      getLlmModelConnectionTestMissingFields({ settings, isApiProtocolShown: false, apiProtocol: '' }),
    ).toEqual([]);
  });
});

describe('getLlmModelConnectionTestMissingFieldsText', () => {
  it('names every missing field by its label', () => {
    expect(getLlmModelConnectionTestMissingFieldsText(['ai_credentials', 'name', 'api_protocol'])).toBe(
      'Set AI Credentials, Model Name and API protocol to test the connection.',
    );
    expect(getLlmModelConnectionTestMissingFieldsText(['name'])).toBe(
      'Set Model Name to test the connection.',
    );
  });
});

describe('buildLlmModelConnectionTestBody', () => {
  const settings = {
    label: 'GPT',
    elitea_title: 'gpt',
    name: ' gpt-4o ',
    context_window: '',
    max_output_tokens: '',
    supports_reasoning: true,
    openai_compatible: false,
    api_protocol: 'openai',
    ai_credentials: { elitea_title: 'creds', private: true },
  };

  it('carries only the connection fields, with a trimmed model name', () => {
    expect(
      buildLlmModelConnectionTestBody({ settings, isApiProtocolShown: true, apiProtocol: 'openai' }),
    ).toEqual({
      name: 'gpt-4o',
      ai_credentials: { elitea_title: 'creds', private: true },
      api_protocol: 'openai',
      supports_reasoning: true,
      openai_compatible: false,
    });
  });

  it('sends the displayed protocol for DIAL and none for other credentials', () => {
    expect(
      buildLlmModelConnectionTestBody({
        settings: { name: 'x' },
        isApiProtocolShown: true,
        apiProtocol: 'azure',
      }).api_protocol,
    ).toBe('azure');
    expect(
      buildLlmModelConnectionTestBody({ settings, isApiProtocolShown: false, apiProtocol: 'azure' })
        .api_protocol,
    ).toBe(null);
  });
});

describe('formatLlmModelConnectionLatency', () => {
  it('shows seconds with one decimal', () => {
    expect(formatLlmModelConnectionLatency(1234)).toBe('Connected in 1.2 s');
    expect(formatLlmModelConnectionLatency(80)).toBe('Connected in 0.1 s');
  });
});

describe('getLlmModelConnectionTestFailureText', () => {
  it('shows the server message as is', () => {
    expect(getLlmModelConnectionTestFailureText({ data: { message: 'Rate limited: slow down' } })).toBe(
      'Rate limited: slow down',
    );
  });

  it("maps the server's reasoning protocol rejection to the Save message", () => {
    expect(
      getLlmModelConnectionTestFailureText({
        data: { message: "Value error, api_protocol='azure' does not support reasoning; use 'anthropic'" },
      }),
    ).toBe(
      "Reasoning isn't supported with the Azure OpenAI protocol. Choose OpenAI or Anthropic, or turn Reasoning off.",
    );
  });

  it('falls back to a generic failure when the server says nothing usable', () => {
    for (const error of [
      undefined,
      { status: 'FETCH_ERROR' },
      { data: { message: ' ' } },
      { data: 'html' },
    ]) {
      expect(getLlmModelConnectionTestFailureText(error)).toBe(
        'Connection failed: the test could not be completed.',
      );
    }
  });
});

describe('getLlmModelInputLabelProps', () => {
  it('builds the floating label and tooltip props for an input field', () => {
    expect(getLlmModelInputLabelProps('name', true)).toMatchObject({
      label: 'Model Name',
      required: true,
      tooltipTestId: 'llm-model-info-name',
      tooltipContentTestId: 'llm-model-info-text-name',
    });
    expect(getLlmModelInputLabelProps('name').tooltipDescription).toContain('global.openai.gpt-5.6-luna');
  });

  it('marks fields optional by default', () => {
    expect(getLlmModelInputLabelProps('description').required).toBe(false);
  });
});

describe('getLlmModelSelectLabelProps', () => {
  it('builds the label and tooltip props for a select field', () => {
    expect(getLlmModelSelectLabelProps('ai_credentials', true)).toMatchObject({
      label: 'AI Credentials',
      required: true,
      shrinkLabel: true,
      infoTooltipTestId: 'llm-model-info-ai_credentials',
      infoTooltipContentTestId: 'llm-model-info-text-ai_credentials',
    });
    expect(getLlmModelSelectLabelProps('api_protocol').label).toBe('API protocol');
    expect(getLlmModelSelectLabelProps('api_protocol').required).toBe(false);
  });
});
