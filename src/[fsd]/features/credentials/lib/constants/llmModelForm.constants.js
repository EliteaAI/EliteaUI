import { API_PROTOCOLS } from './apiProtocol.constants.js';

export const LLM_MODEL_CONFIGURATION_TYPE = 'llm_model';

export const LLM_MODEL_FIELDS = {
  displayName: 'label',
  id: 'elitea_title',
  modelName: 'name',
  contextWindow: 'context_window',
  maxOutputTokens: 'max_output_tokens',
  vision: 'supports_vision',
  reasoning: 'supports_reasoning',
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
    fields: [LLM_MODEL_FIELDS.displayName, LLM_MODEL_FIELDS.id, LLM_MODEL_FIELDS.modelName],
  },
  limits: { title: 'Limits', fields: [LLM_MODEL_FIELDS.contextWindow, LLM_MODEL_FIELDS.maxOutputTokens] },
  capabilities: { title: 'Capabilities', fields: [LLM_MODEL_FIELDS.vision, LLM_MODEL_FIELDS.reasoning] },
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
  ],
  [LLM_MODEL_FIELDS.modelTier]: [LLM_MODEL_FIELDS.lowTier, LLM_MODEL_FIELDS.highTier],
};

export const LLM_MODEL_DISPLAY_NAME_MAX_LENGTH = 60;

export const LLM_MODEL_ID_MAX_LENGTH = 64;

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
};

export const LLM_MODEL_TIER_CONFLICT_WARNING = 'This model was set as both low and high tier. Choose one.';

export const LLM_MODEL_MODEL_NAME_HELPER_TEXT =
  'The model ID from the provider, for example global.openai.gpt-5.6-luna';

export const LLM_MODEL_SWITCH_DESCRIPTIONS = {
  [LLM_MODEL_FIELDS.vision]: 'Accepts images as input.',
  [LLM_MODEL_FIELDS.reasoning]: 'Thinks before it answers, with a selectable reasoning effort.',
  [LLM_MODEL_FIELDS.shared]: 'Available to all projects.',
  [LLM_MODEL_FIELDS.openaiCompatible]: 'Sends requests in the OpenAI API format.',
};

export const LLM_MODEL_FIELD_LABELS = {
  [LLM_MODEL_FIELDS.displayName]: 'Display name',
  [LLM_MODEL_FIELDS.id]: 'ID',
  [LLM_MODEL_FIELDS.modelName]: 'Model name',
  [LLM_MODEL_FIELDS.contextWindow]: 'Context window',
  [LLM_MODEL_FIELDS.maxOutputTokens]: 'Max output tokens',
  [LLM_MODEL_FIELDS.vision]: 'Vision',
  [LLM_MODEL_FIELDS.reasoning]: 'Reasoning',
  [LLM_MODEL_FIELDS.modelTier]: 'Model tier',
  [LLM_MODEL_FIELDS.shared]: 'Shared',
  [LLM_MODEL_FIELDS.credentials]: 'AI credentials',
  [LLM_MODEL_FIELDS.apiProtocol]: 'API protocol',
  [LLM_MODEL_FIELDS.openaiCompatible]: 'OpenAI compatible',
};

export const LLM_MODEL_FIELD_INFO_TEXTS = {
  [LLM_MODEL_FIELDS.displayName]:
    'The name people see when they pick a model in chats, agents, and pipelines. Include the provider if you host the same model in several places, for example **Claude Sonnet 5 (Bedrock)**.',
  [LLM_MODEL_FIELDS.id]:
    "Unique identifier of this model configuration. It's generated from the display name and **can't be changed after creation**.",
  [LLM_MODEL_FIELDS.modelName]:
    "The exact model name or ID the provider expects, copied from the provider's console or docs, for example **global.openai.gpt-5.6-luna**. Requests fail if it doesn't match.",
  [LLM_MODEL_FIELDS.contextWindow]:
    'Total tokens the model can handle in one request, input and output combined.',
  [LLM_MODEL_FIELDS.maxOutputTokens]:
    'The most tokens the model can generate in one response. Must be less than or equal to the context window.',
  [LLM_MODEL_FIELDS.vision]:
    "The model accepts images as input. When off, image attachments aren't sent to this model.",
  [LLM_MODEL_FIELDS.reasoning]:
    'The model can think before it answers. When on, users can choose a reasoning effort level.',
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
