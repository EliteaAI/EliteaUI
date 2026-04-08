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
    temperature: existingSettings.temperature ?? DEFAULT_TEMPERATURE,
  };

  // Only include reasoning_effort if the model supports reasoning
  if (modelSupportsReasoning(model)) {
    baseSettings.reasoning_effort = existingSettings.reasoning_effort ?? DEFAULT_REASONING_EFFORT;
  }

  // Optionally include model information
  if (includeModelInfo && model) {
    baseSettings.model_name = model.name;
    baseSettings.model_project_id = model.project_id;
  }

  return baseSettings;
};

/**
 * Clean LLM settings by removing reasoning_effort if model doesn't support it
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
