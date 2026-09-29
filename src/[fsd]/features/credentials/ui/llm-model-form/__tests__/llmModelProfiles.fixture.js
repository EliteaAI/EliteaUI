// A cut of the backend payload (`GET /configurations/llm_model_profiles/{project_id}`) as it stands on 2026-09-29.
const ALL_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];

const profile = (overrides, locked = null) => ({
  supports_reasoning: true,
  thinking_type: null,
  supported_efforts: [],
  default_effort: null,
  provider_lock: locked === 'provider',
  locked: Boolean(locked),
  lock_reason: locked,
  notes: [],
  ...overrides,
});

export const LLM_MODEL_PROFILES_FIXTURE = {
  version: 1,
  matching: {
    normalize: { lowercase: true, replace: { '.': '-', _: '-' } },
    strategy: 'first_profile_with_any_token_as_substring_not_followed_by_digit',
  },
  effort_levels: ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
  thinking_types: ['adaptive', 'enabled', 'always_on'],
  platform: { claude_off_path_implemented: false },
  profiles: [
    profile(
      {
        id: 'anthropic-fable-mythos',
        label: 'Anthropic Claude Fable / Mythos',
        match: ['fable', 'mythos'],
        thinking_type: 'always_on',
        supported_efforts: ALL_LEVELS,
        default_effort: 'high',
      },
      'provider',
    ),
    profile(
      {
        id: 'anthropic-adaptive',
        label: 'Anthropic Claude Opus 5 / Sonnet 5 / Opus 4.7-4.8',
        match: ['opus-5', 'sonnet-5', 'opus-4-8', 'opus-4-7'],
        thinking_type: 'adaptive',
        supported_efforts: ALL_LEVELS,
        default_effort: 'high',
      },
      'platform',
    ),
    profile({
      id: 'anthropic-legacy-budget',
      label: 'Anthropic Claude 4.5 and older',
      match: ['claude-3-7', 'haiku-4-5', 'opus-4', 'sonnet-4'],
      thinking_type: 'enabled',
      supported_efforts: ['low', 'medium', 'high'],
      default_effort: 'medium',
    }),
    profile({
      id: 'openai-gpt-5-6',
      label: 'OpenAI GPT-5.6',
      match: ['gpt-5-6'],
      supported_efforts: ['none', 'low', 'medium', 'high', 'xhigh'],
      default_effort: 'medium',
    }),
    profile({
      id: 'openai-gpt-5-2-5-1',
      label: 'OpenAI GPT-5.2 / GPT-5.1',
      match: ['gpt-5-2', 'gpt-5-1'],
      supported_efforts: ['none', 'low', 'medium', 'high'],
      default_effort: 'medium',
    }),
    profile({
      id: 'openai-gpt-5',
      label: 'OpenAI GPT-5 / mini / nano',
      match: ['gpt-5'],
      supported_efforts: ['minimal', 'low', 'medium', 'high'],
      default_effort: 'medium',
    }),
    profile({
      id: 'openai-gpt-4',
      label: 'OpenAI GPT-4 family',
      match: ['gpt-4'],
      supports_reasoning: false,
    }),
  ],
};
