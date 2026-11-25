import { describe, expect, it } from 'vitest';

import { LLM_MODEL_CATALOG_FIXTURE } from '../../../ui/llm-model-form/__tests__/llmModelCatalog.fixture.js';
import {
  buildReasoningSettingsFromCatalogEntry,
  findLlmModelCatalogEntry,
  getEffortLevelOptions,
  getLlmModelReasoningDescription,
  getLlmModelRecognition,
  getUnsupportedStoredLevels,
  isAzureReasoningWarned,
  isLlmModelReasoningConfigured,
  toggleEffortLevel,
} from '../llmModelCatalog.helpers.js';
import { mapLlmModelSaveErrorToFields } from '../llmModelForm.helpers.js';

const find = (name, credentialType = 'open_ai', apiProtocol = '') =>
  findLlmModelCatalogEntry({ catalog: LLM_MODEL_CATALOG_FIXTURE, name, credentialType, apiProtocol });
const keyOf = (...lookup) => find(...lookup)?.key ?? null;

describe('findLlmModelCatalogEntry', () => {
  it.each([
    ['nonexistent  gpt-5.6blablabla'],
    ['gpt-5.6-lunax'],
    ['xx gpt-5.6-luna'],
    ['GPT-5.6-LUNA'],
    [' gpt-5.6-luna'],
    ['gpt-5.6-luna '],
    ['gpt_5.6_luna'],
    ['gpt-5.6'],
    ['claude-sonnet-5-5-garbage'],
    ['model-router'],
    [''],
    [undefined],
  ])('recognizes nothing for %j, which only resembles a catalog name', name => {
    expect(find(name)).toBeNull();
  });

  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf'])(
    'recognizes nothing for the object member name %s',
    name => {
      expect(find(name)).toBeNull();
      expect(find(name, name)).toBeNull();
    },
  );

  it('returns the exact entry together with its catalog key', () => {
    expect(find('gpt-5.6-luna')).toEqual({
      ...LLM_MODEL_CATALOG_FIXTURE.models['gpt-5.6-luna'],
      key: 'gpt-5.6-luna',
    });
  });

  it.each([
    ['azure_open_ai', '', 'gpt-5.6-luna', 'azure/gpt-5.6-luna'],
    ['ai_dial', 'azure', 'gpt-5.6-luna', 'azure/gpt-5.6-luna'],
    ['ai_dial', 'openai', 'gpt-5.6-luna', 'gpt-5.6-luna'],
    ['ai_dial', 'anthropic', 'claude-sonnet-5-5', 'claude-sonnet-5-5'],
    ['vertex_ai', '', 'claude-sonnet-5-5', 'vertex_ai/claude-sonnet-5-5'],
    ['vertex_ai', '', 'gemini-3.7-flash', 'gemini-3.7-flash'],
    ['amazon_bedrock', '', 'global.openai.gpt-5.6-luna', 'global.openai.gpt-5.6-luna'],
    ['open_ai', '', 'gpt-5.6-luna', 'gpt-5.6-luna'],
    ['', '', 'gpt-5.6-luna', 'gpt-5.6-luna'],
    ['unknown_type', '', 'gpt-5.6-luna', 'gpt-5.6-luna'],
    ['ai_dial', '', 'gpt-5.6-luna', 'gpt-5.6-luna'],
  ])(
    '%s %s looks %s up as %s: the credential route first, then the bare name',
    (type, protocol, name, key) => {
      expect(keyOf(name, type, protocol)).toBe(key);
    },
  );

  it('takes the route entry over the bare one when their levels differ', () => {
    expect(find('gpt-6-astra', 'azure_open_ai').supported_efforts).toEqual([
      'low',
      'medium',
      'high',
      'xhigh',
    ]);
    expect(find('gpt-6-astra', 'open_ai').supported_efforts).toEqual([
      'low',
      'medium',
      'high',
      'xhigh',
      'max',
    ]);
  });

  it('recognizes nothing while the catalog is missing or empty', () => {
    const lookup = { name: 'gpt-5.6-luna', credentialType: 'open_ai', apiProtocol: '' };
    expect(findLlmModelCatalogEntry({ ...lookup, catalog: undefined })).toBeNull();
    expect(findLlmModelCatalogEntry({ ...lookup, catalog: { prefixes: {}, models: {} } })).toBeNull();
  });
});

describe('catalog-derived settings', () => {
  it('copies a reasoning entry into the four stored fields', () => {
    const entry = find('claude-sonnet-5');
    expect(buildReasoningSettingsFromCatalogEntry(entry)).toEqual({
      supports_reasoning: true,
      thinking_type: 'adaptive',
      supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
      default_effort: 'medium',
    });
    expect(buildReasoningSettingsFromCatalogEntry(entry).supported_efforts).not.toBe(entry.supported_efforts);
  });

  it('leaves the fields LiteLLM does not report empty', () => {
    expect(buildReasoningSettingsFromCatalogEntry(find('global.xai.grok-4.6'))).toEqual({
      supports_reasoning: true,
      thinking_type: null,
      supported_efforts: null,
      default_effort: null,
    });
  });

  it('turns reasoning off with null fields when the entry reports none, and without an entry', () => {
    const off = {
      supports_reasoning: false,
      thinking_type: null,
      supported_efforts: null,
      default_effort: null,
    };
    expect(buildReasoningSettingsFromCatalogEntry(find('text-only-model'))).toEqual(off);
    expect(buildReasoningSettingsFromCatalogEntry(find('gpt-4.1'))).toEqual(off);
    expect(buildReasoningSettingsFromCatalogEntry(null)).toEqual(off);
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
  it('names the matched catalog key, and says when a name is not in the catalog', () => {
    expect(getLlmModelRecognition('gpt-5.6-luna', find('gpt-5.6-luna', 'azure_open_ai'))).toEqual({
      tone: 'success',
      text: 'Recognized',
    });
    expect(getLlmModelRecognition('nonexistent  gpt-5.6blablabla', null)).toEqual({
      tone: 'warning',
      text: 'Not recognized',
    });
    expect(getLlmModelRecognition('   ', null)).toBeNull();
  });

  it('words the toggle by what the entry reports', () => {
    expect(getLlmModelReasoningDescription(find('claude-sonnet-5-5'))).toMatch(/^Always on for this model\./);
    expect(getLlmModelReasoningDescription(find('gpt-5-pro'))).toMatch(/^Always on for this model\./);
    expect(getLlmModelReasoningDescription(find('gpt-5.6-luna'))).toMatch(/^On by default for this model\./);
    expect(getLlmModelReasoningDescription(find('text-only-model'))).toBe(
      "This model doesn't support reasoning.",
    );
    expect(getLlmModelReasoningDescription(find('gpt-4.1'))).toMatch(/^Thinks before answering\./);
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

describe('stored levels outside the catalog entry', () => {
  const gpt52 = find('gpt-5.2');

  it('keeps them visible as unsupported options in provider order', () => {
    const options = getEffortLevelOptions(gpt52, ['max', 'low', 'xhigh']);
    expect(options.map(option => option.value)).toEqual(['none', 'low', 'medium', 'high', 'xhigh', 'max']);
    expect(options.filter(option => option.unsupported).map(option => option.value)).toEqual([
      'xhigh',
      'max',
    ]);
    expect(getUnsupportedStoredLevels(gpt52, ['low', 'xhigh'])).toEqual(['xhigh']);
  });

  it('flags nothing without an entry, without reported levels, or for levels the entry lists', () => {
    expect(getUnsupportedStoredLevels(null, ['xhigh'])).toEqual([]);
    expect(getUnsupportedStoredLevels(find('global.xai.grok-4.6'), ['xhigh'])).toEqual([]);
    expect(getUnsupportedStoredLevels(gpt52, ['low', 'high'])).toEqual([]);
    expect(getEffortLevelOptions(null, ['xhigh']).every(option => !option.unsupported)).toBe(true);
  });

  it('offers every level when the entry reports none', () => {
    const everyLevel = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
    expect(getEffortLevelOptions(null).map(option => option.value)).toEqual(everyLevel);
    expect(getEffortLevelOptions(find('global.xai.grok-4.6')).map(option => option.value)).toEqual(
      everyLevel,
    );
  });

  it.each(['adaptive', 'always_on'])(
    'never offers None or Minimal with the %s thinking mode',
    thinkingType => {
      expect(getEffortLevelOptions(null, [], thinkingType).map(option => option.value)).toEqual([
        'low',
        'medium',
        'high',
        'xhigh',
        'max',
      ]);
      expect(getUnsupportedStoredLevels(null, ['none', 'minimal', 'low'], thinkingType)).toEqual([
        'none',
        'minimal',
      ]);
      expect(getUnsupportedStoredLevels(null, ['none', 'minimal', 'low'], 'enabled')).toEqual([]);
    },
  );
});

// #6919: DIAL serves Gemini on the azure route and reasoning works there, so only
// OpenAI models and Claude thinking models get the warning
describe('isAzureReasoningWarned', () => {
  const warned = (name, overrides = {}) =>
    isAzureReasoningWarned({
      isApiProtocolShown: true,
      apiProtocol: 'azure',
      supportsReasoning: true,
      entry: find(name, 'ai_dial', 'azure'),
      ...overrides,
    });

  it.each(['gpt-5.6-luna', 'gpt-5.2', 'claude-sonnet-5-5', 'claude-haiku-4-5', 'anthropic.claude-sonnet-5'])(
    'warns for %s',
    name => {
      expect(warned(name)).toBe(true);
    },
  );

  it.each(['gemini-3.7-flash', 'global.xai.grok-4.6', 'custom-unrecognized-model'])(
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
