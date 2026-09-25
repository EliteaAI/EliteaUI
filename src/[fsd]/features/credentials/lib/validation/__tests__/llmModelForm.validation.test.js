import { describe, expect, it } from 'vitest';

import { validateLlmModelSettings } from '../llmModelForm.validation.js';

const VALID_SETTINGS = {
  label: 'GPT Test',
  elitea_title: 'gpt-test',
  name: 'gpt-5.4',
  context_window: 400000,
  max_output_tokens: 128000,
  supports_vision: false,
  supports_reasoning: false,
  low_tier: false,
  high_tier: false,
  ai_credentials: { elitea_title: 'openai-cred', private: false },
};

const validate = (settingsOverrides = {}, options = {}) =>
  validateLlmModelSettings({ settings: { ...VALID_SETTINGS, ...settingsOverrides }, ...options });

describe('validateLlmModelSettings', () => {
  it('accepts a complete model', () => {
    expect(validate()).toEqual({});
  });

  it('flags every required field of an empty form', () => {
    const errors = validateLlmModelSettings({
      settings: { label: '', elitea_title: '', name: '', context_window: '', max_output_tokens: '' },
    });
    expect(Object.keys(errors)).toEqual([
      'label',
      'elitea_title',
      'name',
      'context_window',
      'max_output_tokens',
      'ai_credentials',
    ]);
  });

  describe('display name', () => {
    it('allows 1 to 60 characters', () => {
      expect(validate({ label: 'a' })).toEqual({});
      expect(validate({ label: 'a'.repeat(60) })).toEqual({});
      expect(validate({ label: 'a'.repeat(61) }).label).toBe(
        "Display name can't be longer than 60 characters.",
      );
      expect(validate({ label: '   ' }).label).toBe('Display name is required.');
    });
  });

  describe('ID', () => {
    it.each(['gpt-test', 'gpt_5', 'a', 'a1', '9-lives'])('accepts %s', id => {
      expect(validate({ elitea_title: id }).elitea_title).toBeUndefined();
    });

    it.each(['-gpt', 'gpt-', '_gpt', 'gpt_', 'GPT', 'gpt test', 'gpt.5'])('rejects %s', id => {
      expect(validate({ elitea_title: id }).elitea_title).toBe(
        'Use lowercase letters, digits, - and _. Start and end with a letter or digit.',
      );
    });

    it('caps the ID at 64 characters', () => {
      expect(validate({ elitea_title: 'a'.repeat(64) }).elitea_title).toBeUndefined();
      expect(validate({ elitea_title: 'a'.repeat(65) }).elitea_title).toBe(
        "ID can't be longer than 64 characters.",
      );
    });

    it('rejects an ID another configuration already uses', () => {
      expect(validate({}, { takenIds: ['gpt-test'] }).elitea_title).toBe(
        'This ID is already used by another configuration.',
      );
    });

    it('never flags the stored ID of an existing model, which can no longer change', () => {
      expect(validate({ elitea_title: 'Legacy ID_' }, { isEditing: true, takenIds: ['Legacy ID_'] })).toEqual(
        {},
      );
    });
  });

  it('requires a model name that is not only spaces', () => {
    expect(validate({ name: '  ' }).name).toBe('Model name is required.');
  });

  describe('limits', () => {
    it.each([0, -1, 1.5, '1.5', '-3', 'abc'])('rejects %s as a limit', limit => {
      expect(validate({ context_window: limit, max_output_tokens: 1 }).context_window).toBe(
        'Enter a whole number of 1 or more.',
      );
      expect(validate({ max_output_tokens: limit }).max_output_tokens).toBe(
        'Enter a whole number of 1 or more.',
      );
    });

    it('rejects max output tokens above the context window', () => {
      expect(validate({ context_window: 1000, max_output_tokens: 2000 }).max_output_tokens).toBe(
        "Max output tokens can't be larger than the context window.",
      );
    });

    it('accepts max output tokens equal to the context window', () => {
      expect(validate({ context_window: 1000, max_output_tokens: 1000 })).toEqual({});
    });

    it('does not compare against an invalid context window', () => {
      expect(validate({ context_window: 0, max_output_tokens: 2000 }).max_output_tokens).toBeUndefined();
    });
  });

  it('asks to choose one tier when both are stored', () => {
    expect(validate({ low_tier: true, high_tier: true }).model_tier).toBe('Choose a model tier.');
    expect(validate({ low_tier: true }).model_tier).toBeUndefined();
  });

  it('holds the model back while the selected credential type is still loading', () => {
    expect(validate({}, { isCredentialTypePending: true })).toEqual({
      ai_credentials_check: 'Checking the selected AI credentials. Try saving again in a moment.',
    });
  });

  describe('DIAL connection', () => {
    const dial = { isApiProtocolShown: true };

    it('requires an API protocol only while it is shown', () => {
      expect(validate({}, { ...dial, apiProtocol: '' }).api_protocol).toBe('API protocol is required.');
      expect(validate({}, { isApiProtocolShown: false, apiProtocol: '' }).api_protocol).toBeUndefined();
    });

    it('rejects reasoning with the Azure OpenAI protocol', () => {
      expect(
        validate({ supports_reasoning: true }, { ...dial, apiProtocol: 'azure' }).supports_reasoning,
      ).toBe(
        "Reasoning isn't supported with the Azure OpenAI protocol. Choose OpenAI or Anthropic, or turn Reasoning off.",
      );
    });

    it.each(['openai', 'anthropic'])('accepts reasoning with the %s protocol', apiProtocol => {
      expect(validate({ supports_reasoning: true }, { ...dial, apiProtocol })).toEqual({});
    });

    it('accepts Azure OpenAI with reasoning off', () => {
      expect(validate({}, { ...dial, apiProtocol: 'azure' })).toEqual({});
    });

    it('ignores the protocol for credentials that are not DIAL', () => {
      expect(
        validate({ supports_reasoning: true }, { isApiProtocolShown: false, apiProtocol: 'azure' }),
      ).toEqual({});
    });
  });
});
