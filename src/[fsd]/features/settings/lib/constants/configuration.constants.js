export const ICON_TYPE_MAP = {
  VERTEX_AI: ['vertex_ai', 'vertexai'],
  AI_DIAL: ['ai_dial', 'dial'],
  OPEN_AI: ['open_ai', 'openai', 'gpt', 'codex mini', 'embedding-ada'],
  CLAUDE: ['claude', 'anthropic', 'opus', 'haiku'],
  OLLAMA: ['ollama'],
  AMAZON_BEDROCK: ['amazon_bedrock'],
  AMAZON: ['amazon.titan'],
  HUGGING_FACE: ['hugging_face', 'huggingface'],
  CHROMA: ['chroma'],
  AZURE: ['open_ai_azure', 'azure', 'azure_openai', 'azure_open_ai', 'model-router'],
  PGVECTOR: ['pgvector', 'postgresql', 'postgres'],
};

// Grouped configuration types by provider category
export const CONFIGURATION_TYPE_GROUPS = {
  OpenAI: {
    label: 'OpenAI',
    types: ['open_ai', 'openai', 'gpt', 'codex mini', 'embedding-ada'],
  },
  Anthropic: {
    label: 'Anthropic',
    types: ['claude', 'anthropic', 'opus', 'haiku'],
  },
  OtherLLMProviders: {
    label: 'Other LLM Providers',
    types: [
      'vertex_ai',
      'vertexai',
      'ai_dial',
      'dial',
      'ollama',
      'amazon_bedrock',
      'amazon.titan',
      'hugging_face',
      'huggingface',
      'chroma',
      'open_ai_azure',
      'azure',
      'azure_openai',
      'azure_open_ai',
      'model-router',
      'pgvector',
      'postgresql',
      'postgres',
    ],
  },
};

export const DEFAULT_SETTINGS_LAYOUT = {
  STACK: 'stack',
  INLINE: 'inline',
};
