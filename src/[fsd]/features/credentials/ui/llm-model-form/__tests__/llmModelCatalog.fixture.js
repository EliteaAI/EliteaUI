// A cut of `GET /configurations/llm_model_catalog/{project_id}` built from the LiteLLM catalog on 2026-11-25.
const CLAUDE_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];
const GPT_5_6_LEVELS = ['none', 'low', 'medium', 'high', 'xhigh'];

const reasoning = (provider, supported_efforts, overrides = {}) => ({
  provider,
  supports_reasoning: true,
  supported_efforts,
  default_effort: 'medium',
  supports_vision: true,
  ...overrides,
});

const claudeThinking = (provider, thinking_type) =>
  reasoning(provider, CLAUDE_LEVELS, { thinking_type, reasoning_locked: true });

export const LLM_MODEL_CATALOG_FIXTURE = {
  prefixes: {
    open_ai: 'openai',
    azure_open_ai: 'azure',
    amazon_bedrock: 'bedrock',
    vertex_ai: 'vertex_ai',
    ollama: 'ollama',
    'ai_dial:azure': 'azure',
    'ai_dial:openai': 'openai',
    'ai_dial:anthropic': 'anthropic',
  },
  models: {
    'gpt-5.6-luna': reasoning('openai', GPT_5_6_LEVELS),
    'azure/gpt-5.6-luna': reasoning('azure', GPT_5_6_LEVELS),
    'global.openai.gpt-5.6-luna': reasoning('bedrock_converse', [...GPT_5_6_LEVELS, 'max']),
    'gpt-5.2': reasoning('openai', ['none', 'low', 'medium', 'high']),
    'gpt-6-astra': reasoning('openai', [...CLAUDE_LEVELS]),
    'azure/gpt-6-astra': reasoning('azure', ['low', 'medium', 'high', 'xhigh'], { reasoning_locked: true }),
    'gpt-5-pro': reasoning('openai', ['minimal', 'low', 'medium', 'high'], { reasoning_locked: true }),
    'gpt-4.1': { provider: 'openai', supports_vision: true },
    'gpt-4o-audio-preview': { provider: 'openai' },
    'azure/gpt-4o-audio-preview': { provider: 'azure', supports_vision: false },
    'claude-opus-4-1': reasoning('anthropic', ['low', 'medium', 'high'], { thinking_type: 'enabled' }),
    'vertex_ai/claude-opus-4-1': { provider: 'vertex_ai-anthropic_models', supports_vision: true },
    'text-only-model': { provider: 'openai', supports_reasoning: false, supports_vision: false },
    'claude-sonnet-5-5': claudeThinking('anthropic', 'always_on'),
    'vertex_ai/claude-sonnet-5-5': claudeThinking('vertex_ai-anthropic_models', 'always_on'),
    'claude-sonnet-5': claudeThinking('anthropic', 'adaptive'),
    'anthropic.claude-sonnet-5': claudeThinking('bedrock_converse', 'adaptive'),
    'claude-without-levels': {
      provider: 'anthropic',
      supports_reasoning: true,
      thinking_type: 'adaptive',
      reasoning_locked: true,
    },
    'claude-haiku-4-5': reasoning('anthropic', ['low', 'medium', 'high'], { thinking_type: 'enabled' }),
    'gemini-3.7-flash': reasoning('vertex_ai-language-models', ['none', 'low', 'medium', 'high']),
    'global.xai.grok-4.6': { provider: 'bedrock_converse', supports_reasoning: true, supports_vision: true },
  },
};
