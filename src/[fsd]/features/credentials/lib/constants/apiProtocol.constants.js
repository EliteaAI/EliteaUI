export const API_PROTOCOL_FIELD = 'api_protocol';

export const API_PROTOCOL_CREDENTIAL_FIELD = 'ai_credentials';

// Only DIAL fronts several upstream protocols, so the selector is meaningless elsewhere
export const API_PROTOCOL_CREDENTIAL_TYPES = ['ai_dial'];

export const API_PROTOCOLS = {
  azure: 'azure',
  openai: 'openai',
  anthropic: 'anthropic',
};

export const API_PROTOCOL_MODEL_PATTERNS = [
  { pattern: /claude|sonnet|opus|haiku/i, protocol: API_PROTOCOLS.anthropic },
  { pattern: /(^|[^a-z0-9])gpt/i, protocol: API_PROTOCOLS.openai },
];
