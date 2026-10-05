import {
  REASONING_EFFORT_LABELS,
  REASONING_EFFORT_OFF,
  REASONING_EFFORT_ORDER,
  THINKING_TYPES,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';

import { API_PROTOCOLS } from './apiProtocol.constants.js';

export const LLM_MODEL_CONFIGURATION_TYPE = 'llm_model';

export const LLM_MODEL_FIELDS = {
  displayName: 'label',
  id: 'elitea_title',
  description: 'description',
  modelName: 'name',
  contextWindow: 'context_window',
  maxOutputTokens: 'max_output_tokens',
  vision: 'supports_vision',
  reasoning: 'supports_reasoning',
  thinkingType: 'thinking_type',
  supportedEfforts: 'supported_efforts',
  defaultEffort: 'default_effort',
  modelTier: 'model_tier',
  lowTier: 'low_tier',
  highTier: 'high_tier',
  shared: 'shared',
  credentials: 'ai_credentials',
  apiProtocol: 'api_protocol',
  openaiCompatible: 'openai_compatible',
  credentialsCheck: 'ai_credentials_check',
};

export const LLM_MODEL_SECTIONS = {
  model: {
    title: 'Model',
    fields: [
      LLM_MODEL_FIELDS.displayName,
      LLM_MODEL_FIELDS.id,
      LLM_MODEL_FIELDS.description,
      LLM_MODEL_FIELDS.modelName,
    ],
  },
  limits: { title: 'Limits', fields: [LLM_MODEL_FIELDS.contextWindow, LLM_MODEL_FIELDS.maxOutputTokens] },
  capabilities: {
    title: 'Capabilities',
    fields: [
      LLM_MODEL_FIELDS.vision,
      LLM_MODEL_FIELDS.reasoning,
      LLM_MODEL_FIELDS.thinkingType,
      LLM_MODEL_FIELDS.supportedEfforts,
      LLM_MODEL_FIELDS.defaultEffort,
    ],
  },
  availability: { title: 'Availability', fields: [LLM_MODEL_FIELDS.modelTier, LLM_MODEL_FIELDS.shared] },
  connection: {
    title: 'Connection',
    fields: [
      LLM_MODEL_FIELDS.credentials,
      LLM_MODEL_FIELDS.credentialsCheck,
      LLM_MODEL_FIELDS.apiProtocol,
      LLM_MODEL_FIELDS.openaiCompatible,
    ],
  },
};

export const LLM_MODEL_FIELDS_CHECKED_ON_OPEN = [
  LLM_MODEL_FIELDS.displayName,
  LLM_MODEL_FIELDS.modelName,
  LLM_MODEL_FIELDS.contextWindow,
  LLM_MODEL_FIELDS.maxOutputTokens,
  LLM_MODEL_FIELDS.credentials,
];

export const LLM_MODEL_ERROR_SOURCE_FIELDS = {
  [LLM_MODEL_FIELDS.id]: [LLM_MODEL_FIELDS.id, LLM_MODEL_FIELDS.displayName],
  [LLM_MODEL_FIELDS.maxOutputTokens]: [LLM_MODEL_FIELDS.maxOutputTokens, LLM_MODEL_FIELDS.contextWindow],
  [LLM_MODEL_FIELDS.reasoning]: [
    LLM_MODEL_FIELDS.reasoning,
    LLM_MODEL_FIELDS.apiProtocol,
    LLM_MODEL_FIELDS.credentials,
    LLM_MODEL_FIELDS.modelName,
  ],
  [LLM_MODEL_FIELDS.thinkingType]: [
    LLM_MODEL_FIELDS.thinkingType,
    LLM_MODEL_FIELDS.reasoning,
    LLM_MODEL_FIELDS.modelName,
  ],
  [LLM_MODEL_FIELDS.supportedEfforts]: [
    LLM_MODEL_FIELDS.supportedEfforts,
    LLM_MODEL_FIELDS.thinkingType,
    LLM_MODEL_FIELDS.reasoning,
    LLM_MODEL_FIELDS.modelName,
  ],
  [LLM_MODEL_FIELDS.defaultEffort]: [
    LLM_MODEL_FIELDS.defaultEffort,
    LLM_MODEL_FIELDS.supportedEfforts,
    LLM_MODEL_FIELDS.reasoning,
    LLM_MODEL_FIELDS.modelName,
  ],
  [LLM_MODEL_FIELDS.modelTier]: [LLM_MODEL_FIELDS.lowTier, LLM_MODEL_FIELDS.highTier],
};

export const LLM_MODEL_REASONING_FIELDS = [
  LLM_MODEL_FIELDS.reasoning,
  LLM_MODEL_FIELDS.thinkingType,
  LLM_MODEL_FIELDS.supportedEfforts,
  LLM_MODEL_FIELDS.defaultEffort,
];

export const LLM_MODEL_EFFORT_LEVELS = REASONING_EFFORT_ORDER;

export const LLM_MODEL_EFFORT_LEVEL_LABELS = { ...REASONING_EFFORT_LABELS, [REASONING_EFFORT_OFF]: 'None' };

export const LLM_MODEL_EFFORT_NONE = REASONING_EFFORT_OFF;

export const LLM_MODEL_THINKING_TYPES = THINKING_TYPES;

export const LLM_MODEL_THINKING_TYPE_NOT_SET = '';

export const LLM_MODEL_LEGACY_TAG = 'Legacy';

export const LLM_MODEL_THINKING_TYPE_OPTIONS = [
  { value: LLM_MODEL_THINKING_TYPE_NOT_SET, label: 'Not set' },
  { value: LLM_MODEL_THINKING_TYPES.adaptive, label: 'Adaptive' },
  { value: LLM_MODEL_THINKING_TYPES.enabled, label: `Enabled (token budget) · ${LLM_MODEL_LEGACY_TAG}` },
];

export const LLM_MODEL_THINKING_TYPE_FIXED_LABELS = {
  [LLM_MODEL_THINKING_TYPES.adaptive]: 'Adaptive · always on',
  [LLM_MODEL_THINKING_TYPES.alwaysOn]: 'Adaptive · always on',
  [LLM_MODEL_THINKING_TYPES.enabled]: 'Enabled (token budget)',
};

export const LLM_MODEL_THINKING_TYPE_FIXED_HELPER_TEXTS = {
  [LLM_MODEL_THINKING_TYPES.adaptive]: 'The model decides how much to think. Nothing to configure.',
  [LLM_MODEL_THINKING_TYPES.alwaysOn]: 'The model decides how much to think. Nothing to configure.',
  [LLM_MODEL_THINKING_TYPES.enabled]:
    'Older Claude models use a token budget based on the effort level. Supported until these models are retired.',
};

export const LLM_MODEL_THINKING_TYPE_CHOICE_HELPER_TEXT =
  'Anthropic models only. Leave it not set for other providers.';

export const LLM_MODEL_REASONING_LOCK_REASONS = {
  provider: 'provider',
  platform: 'platform',
};

export const LLM_MODEL_REASONING_DESCRIPTIONS = {
  default: 'Thinks before answering. Configure which effort levels users can pick.',
  unsupported: "This model family doesn't support reasoning. Turn it off to save.",
  recognized: 'On by default for this model. Configure which effort levels users can pick.',
  [LLM_MODEL_REASONING_LOCK_REASONS.provider]:
    'Always on for this model. Configure which effort levels users can pick.',
  [LLM_MODEL_REASONING_LOCK_REASONS.platform]:
    'Always on in Elitea. Configure which effort levels users can pick.',
};

export const LLM_MODEL_STATUS_TONES = {
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export const LLM_MODEL_CONNECTION_TEST_FIELDS = [
  LLM_MODEL_FIELDS.modelName,
  LLM_MODEL_FIELDS.credentials,
  LLM_MODEL_FIELDS.apiProtocol,
  LLM_MODEL_FIELDS.reasoning,
];

export const LLM_MODEL_CONNECTION_TEST_TEXTS = {
  button: 'Test connection',
  connected: seconds => `Connected in ${seconds} s`,
  missingFields: labels => `Set ${labels} to test the connection.`,
  credentialsTypePending: 'Checking the selected AI credentials. Try again in a moment.',
  incomplete: 'Connection failed: the test could not be completed.',
};

export const LLM_MODEL_RECOGNITION_TEXTS = {
  recognized: label => `Recognized: ${label}. Only the settings it supports are shown.`,
  recognizedWithoutReasoning: label =>
    `Recognized: ${label}. Reasoning isn't supported, so its settings are hidden.`,
  unrecognized: 'Not recognized. All reasoning options are shown; check compatibility with DevOps.',
};

export const LLM_MODEL_EFFORT_LEVELS_HELPER_TEXTS = {
  recognized: "Levels this model supports. Deselect any you don't want to offer.",
  unrecognized: 'Users can only pick from these levels.',
};

export const LLM_MODEL_EFFORT_NONE_WARNING =
  'None lets users turn reasoning off. With reasoning off, models are more likely to make up tool results, so only allow it if you need the cost saving.';

export const LLM_MODEL_REMOVED_EFFORTS_WARNING = removedLabels =>
  `You removed ${removedLabels.join(', ')}. Chats and agents already set to ${
    removedLabels.length > 1 ? 'these levels keep sending them' : 'this level keep sending it'
  } until their settings are changed.`;

export const LLM_MODEL_REASONING_NOT_CONFIGURED_NOTE =
  'Reasoning levels are not configured for this model yet. Users get Low, Medium and High, with Medium as the default.';

export const LLM_MODEL_DEFAULT_EFFORT_PLACEHOLDERS = {
  select: 'Select default level',
  noLevels: 'Select supported levels first',
};

export const LLM_MODEL_DISPLAY_NAME_MAX_LENGTH = 60;

export const LLM_MODEL_ID_MAX_LENGTH = 64;

export const LLM_MODEL_DESCRIPTION_MAX_LENGTH = 40;

export const LLM_MODEL_ID_PATTERN = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;

export const LLM_MODEL_TIERS = {
  notSet: 'not_set',
  low: 'low',
  high: 'high',
};

export const LLM_MODEL_TIER_OPTIONS = [
  { value: LLM_MODEL_TIERS.notSet, label: 'Not set' },
  { value: LLM_MODEL_TIERS.low, label: 'Low tier' },
  { value: LLM_MODEL_TIERS.high, label: 'High tier' },
];

export const LLM_MODEL_API_PROTOCOL_OPTIONS = [
  { value: API_PROTOCOLS.openai, label: 'OpenAI' },
  { value: API_PROTOCOLS.azure, label: 'Azure OpenAI' },
  { value: API_PROTOCOLS.anthropic, label: 'Anthropic' },
];

export const LLM_MODEL_STORED_DIAL_PROTOCOL_FALLBACK = API_PROTOCOLS.azure;

export const LLM_MODEL_CREDENTIAL_TYPE_TAGS = {
  open_ai: 'OpenAI',
  azure_open_ai: 'Azure OpenAI',
  ai_dial: 'DIAL',
  amazon_bedrock: 'AWS Bedrock',
  vertex_ai: 'Vertex AI',
  ollama: 'Ollama',
};

export const LLM_MODEL_CREDENTIALS_SECTION = 'ai_credentials';

export const LLM_MODEL_FIELD_ERROR_ATTRIBUTE = 'data-llm-model-field-error';

export const LLM_MODEL_ERROR_MESSAGES = {
  displayNameRequired: 'Display name is required.',
  displayNameTooLong: `Display name can't be longer than ${LLM_MODEL_DISPLAY_NAME_MAX_LENGTH} characters.`,
  idRequired: 'ID is required.',
  idTooLong: `ID can't be longer than ${LLM_MODEL_ID_MAX_LENGTH} characters.`,
  idInvalid: 'Use lowercase letters, digits, - and _. Start and end with a letter or digit.',
  idTaken: 'This ID is already used by another configuration.',
  modelNameRequired: 'Model name is required.',
  contextWindowRequired: 'Context window is required.',
  maxOutputTokensRequired: 'Max output tokens is required.',
  tokenLimitNotWholeNumber: 'Enter a whole number of 1 or more.',
  maxOutputTokensAboveContextWindow: "Max output tokens can't be larger than the context window.",
  modelTierConflict: 'Choose a model tier.',
  credentialsRequired: 'AI credentials are required.',
  credentialsTypePending: 'Checking the selected AI credentials. Try saving again in a moment.',
  apiProtocolRequired: 'API protocol is required.',
  reasoningNotSupportedByProtocol:
    "Reasoning isn't supported with the Azure OpenAI protocol. Choose OpenAI or Anthropic, or turn Reasoning off.",
  supportedEffortsRequired: 'Select at least one level other than None.',
  supportedEffortsNotOffered: labels =>
    `${labels.join(', ')} ${labels.length > 1 ? "aren't" : "isn't"} offered for this model. Uncheck to save.`,
  defaultEffortRequired: 'Select a default level.',
  defaultEffortNotSupported: 'The default level must be one of the supported levels.',
};

export const LLM_MODEL_TIER_CONFLICT_WARNING = 'This model was set as both low and high tier. Choose one.';

export const LLM_MODEL_MODEL_NAME_HELPER_TEXT =
  'The model ID from the provider, for example global.openai.gpt-5.6-luna';

export const LLM_MODEL_SWITCH_DESCRIPTIONS = {
  [LLM_MODEL_FIELDS.vision]: 'Accepts images as input.',
  [LLM_MODEL_FIELDS.reasoning]: LLM_MODEL_REASONING_DESCRIPTIONS.default,
  [LLM_MODEL_FIELDS.shared]: 'Available to all projects.',
  [LLM_MODEL_FIELDS.openaiCompatible]: 'Sends requests in the OpenAI API format.',
};

export const LLM_MODEL_FIELD_LABELS = {
  [LLM_MODEL_FIELDS.displayName]: 'Display Name',
  [LLM_MODEL_FIELDS.id]: 'ID',
  [LLM_MODEL_FIELDS.description]: 'Description',
  [LLM_MODEL_FIELDS.modelName]: 'Model Name',
  [LLM_MODEL_FIELDS.contextWindow]: 'Context window',
  [LLM_MODEL_FIELDS.maxOutputTokens]: 'Max output tokens',
  [LLM_MODEL_FIELDS.vision]: 'Vision',
  [LLM_MODEL_FIELDS.reasoning]: 'Reasoning',
  [LLM_MODEL_FIELDS.thinkingType]: 'Thinking mode',
  [LLM_MODEL_FIELDS.supportedEfforts]: 'Supported effort levels',
  [LLM_MODEL_FIELDS.defaultEffort]: 'Default effort level',
  [LLM_MODEL_FIELDS.modelTier]: 'Model tier',
  [LLM_MODEL_FIELDS.shared]: 'Shared',
  [LLM_MODEL_FIELDS.credentials]: 'AI Credentials',
  [LLM_MODEL_FIELDS.apiProtocol]: 'API protocol',
  [LLM_MODEL_FIELDS.openaiCompatible]: 'OpenAI compatible',
};

export const LLM_MODEL_FIELD_INFO_TEXTS = {
  [LLM_MODEL_FIELDS.displayName]:
    'The name people see when they pick a model in chats, agents, and pipelines. Include the provider if you host the same model in several places, for example **Claude Sonnet 5 (Bedrock)**.',
  [LLM_MODEL_FIELDS.id]:
    "Unique identifier of this model configuration. It's generated from the display name and **can't be changed after creation**.",
  [LLM_MODEL_FIELDS.description]:
    'A few words on what the model is best for, shown under its name when people pick a model, for example **Fast for everyday tasks** or **Best for coding and agents**.',
  [LLM_MODEL_FIELDS.modelName]:
    "The exact model name or ID the provider expects, copied from the provider's console or docs, for example **global.openai.gpt-5.6-luna**. Requests fail if it doesn't match. It's also used to **recognize the model** and show only the reasoning settings it supports.",
  [LLM_MODEL_FIELDS.contextWindow]:
    'Total tokens the model can handle in one request, input and output combined.',
  [LLM_MODEL_FIELDS.maxOutputTokens]:
    'The most tokens the model can generate in one response. Must be less than or equal to the context window.',
  [LLM_MODEL_FIELDS.vision]:
    "The model accepts images as input. When off, image attachments aren't sent to this model.",
  [LLM_MODEL_FIELDS.reasoning]:
    "The model can think before it answers. For recognized reasoning models it's **on by default**, and always on where the model can't work without it. Choose which effort levels users can pick and which one is used by default.",
  [LLM_MODEL_FIELDS.thinkingType]:
    "**Anthropic models only.** **Adaptive**: the model decides how much to think. Current Claude models always use it. **Enabled (token budget)**: a **legacy** mode for older Claude models, supported until they're retired. For recognized models this is set automatically.",
  [LLM_MODEL_FIELDS.supportedEfforts]:
    'The levels this model accepts. Only these are offered to users, so an unsupported level never reaches the provider. **None** turns reasoning off and is only for models that accept it, such as GPT-5.6.',
  [LLM_MODEL_FIELDS.defaultEffort]:
    "Used when a user hasn't chosen a level. It can't be None, so reasoning stays on unless someone turns it off on purpose.",
  [LLM_MODEL_FIELDS.modelTier]:
    'Optional. **Low tier** marks the model for fast, low-cost background tasks; **high tier** marks it for complex tasks. A model can be in one tier only.',
  [LLM_MODEL_FIELDS.shared]:
    "Makes this model available to **all projects**, not only this one. Other projects can use it but can't edit it. Takes effect only for models in the public project.",
  [LLM_MODEL_FIELDS.credentials]:
    'The provider connection used to call this model: endpoint and keys. Credentials are managed on the **Credentials** page. Choosing **DIAL** credentials adds the API protocol field.',
  [LLM_MODEL_FIELDS.apiProtocol]:
    "DIAL routes requests to several providers. Choose the request format this model uses behind DIAL: **OpenAI**, **Azure OpenAI**, or **Anthropic**. Reasoning isn't available with Azure OpenAI.",
  [LLM_MODEL_FIELDS.openaiCompatible]:
    "Turn on to send this model's requests in the OpenAI API format, for example through a proxy or a self-hosted endpoint. It only changes how Claude models are called; they otherwise use the Anthropic format.",
};
