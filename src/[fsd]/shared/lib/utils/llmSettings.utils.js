import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';

/**
 * Check if a model supports reasoning based on its supports_reasoning property
 * @param {Object} model - The model object
 * @returns {boolean} Whether the model supports reasoning
 */
export const modelSupportsReasoning = model => {
  return Boolean(model?.supports_reasoning);
};

/**
 * Generate LLM settings object that respects model capabilities
 * @param {Object} model - The model object
 * @param {Object} existingSettings - Existing LLM settings to merge with
 * @param {Object} options - Additional options
 * @param {boolean} options.includeModelInfo - Whether to include model name and project_id
 * @returns {Object} LLM settings object
 */
export const generateLLMSettings = (model, existingSettings = {}, options = {}) => {
  const { includeModelInfo = false } = options;

  const baseSettings = {
    max_tokens: existingSettings.max_tokens ?? DEFAULT_MAX_TOKENS,
  };

  // Only one of temperature/reasoning_effort applies, never both (issue #5821) — a
  // reasoning-capable model rejects a custom temperature.
  if (modelSupportsReasoning(model)) {
    baseSettings.reasoning_effort = existingSettings.reasoning_effort ?? DEFAULT_REASONING_EFFORT;
  } else {
    baseSettings.temperature = existingSettings.temperature ?? DEFAULT_TEMPERATURE;
  }

  // Optionally include model information
  if (includeModelInfo && model) {
    baseSettings.model_name = model.name;
    baseSettings.model_project_id = model.project_id;
  }

  return baseSettings;
};

/**
 * True when temperature and an active reasoning_effort are both set — invalid combo for
 * reasoning models (Anthropic extended thinking, OpenAI o1/gpt-5). Mirrors the backend's
 * llm_settings_family_conflict (elitea_core/models/pd/llm.py) — single source of truth for
 * this invariant on both sides (issue #5821).
 * @param {number|null|undefined} temperature
 * @param {string|null|undefined} reasoningEffort
 * @returns {boolean}
 */
export const isLLMSettingsFamilyConflict = (temperature, reasoningEffort) =>
  temperature !== null &&
  temperature !== undefined &&
  reasoningEffort !== null &&
  reasoningEffort !== undefined &&
  reasoningEffort !== 'none';

/**
 * Build the temperature/reasoning_effort pair for a newly selected model, resetting both
 * fields explicitly (never leaves a stale value from the previously selected model's family).
 * Spread this AFTER any existing settings so the explicit nulls always win.
 * @param {Object} model - The newly selected model
 * @returns {{temperature: number|null, reasoning_effort: string|null}}
 */
export const resetLLMSettingsForModel = model => {
  if (modelSupportsReasoning(model)) {
    return { temperature: null, reasoning_effort: DEFAULT_REASONING_EFFORT };
  }
  return { temperature: DEFAULT_TEMPERATURE, reasoning_effort: null };
};

/**
 * Clean LLM settings by removing reasoning_effort if model doesn't support it, and dropping
 * temperature if it conflicts with an active reasoning_effort (issue #5821 — previously only
 * handled the reasoning_effort direction, leaving a stale temperature when switching TO a
 * reasoning model).
 * @param {Object} llmSettings - The LLM settings object
 * @param {Object} model - The model object
 * @returns {Object} Cleaned LLM settings
 */
export const cleanLLMSettings = (llmSettings, model) => {
  if (!llmSettings || typeof llmSettings !== 'object') {
    return llmSettings;
  }

  const cleanedSettings = { ...llmSettings };

  // Remove reasoning_effort if model doesn't support it
  if (!modelSupportsReasoning(model) && 'reasoning_effort' in cleanedSettings) {
    delete cleanedSettings.reasoning_effort;
  }

  // Drop temperature if it still conflicts with an active reasoning_effort
  if (isLLMSettingsFamilyConflict(cleanedSettings.temperature, cleanedSettings.reasoning_effort)) {
    delete cleanedSettings.temperature;
  }

  return cleanedSettings;
};

/**
 * Filter out reasoning_effort from unsaved LLM settings if model doesn't support it
 * This is specifically for cases where we have user-input settings that need filtering
 * @param {Object} unsavedLLMSettings - User's unsaved LLM settings
 * @param {Object} model - The model object
 * @returns {Object} Filtered settings or original if model supports reasoning
 */
export const filterReasoningEffortFromSettings = (unsavedLLMSettings, model) => {
  if (!unsavedLLMSettings || modelSupportsReasoning(model)) {
    return unsavedLLMSettings;
  }

  // Create a filtered copy without reasoning_effort
  const filteredSettings = { ...unsavedLLMSettings };
  delete filteredSettings.reasoning_effort;

  return filteredSettings;
};
