import { DEFAULT_MAX_TOKENS_CUSTOM } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { DEFAULT_CONTEXT_STRATEGY, SEPARATOR } from '@/[fsd]/widgets/ContextBudget/lib/constants';
import { DEFAULT_PERSONA } from '@/common/constants';

export const PROFILE_INITIAL_VALUES = {
  // Personalization
  persona: DEFAULT_PERSONA,
  default_instructions: '',

  // Context Management
  context_enabled: DEFAULT_CONTEXT_STRATEGY.ENABLED,
  max_context_tokens: DEFAULT_CONTEXT_STRATEGY.MAX_CONTEXT_TOKENS,
  preserve_recent_messages: DEFAULT_CONTEXT_STRATEGY.PRESERVE_RECENT_MESSAGES,

  // Summarization
  enable_summarization: DEFAULT_CONTEXT_STRATEGY.ENABLE_SUMMARIZATION,

  // Summary LLM Settings (nested to match ContextStrategySummarization interface)
  summary_llm_settings: {
    instructions: '',
    model_name: '',
    model_project_id: null,
    max_tokens: DEFAULT_MAX_TOKENS_CUSTOM,
  },
};

/**
 * Transforms API response (authorData) into Formik form values
 */
export const serializeProfileFormData = (authorData, defaultModel, selectedProjectId) => {
  if (!authorData) {
    return {
      ...PROFILE_INITIAL_VALUES,
      summary_llm_settings: {
        ...PROFILE_INITIAL_VALUES.summary_llm_settings,
        model_name: defaultModel?.name || '',
        model_project_id: defaultModel?.project_id ?? selectedProjectId,
      },
    };
  }

  const p = authorData.personalization || {};
  const cm = authorData.default_context_management || {};
  const s = authorData.default_summarization || {};

  return {
    // Personalization
    persona: p.persona || DEFAULT_PERSONA,
    default_instructions: p.default_instructions || '',

    // Context Management
    context_enabled: cm.enabled ?? DEFAULT_CONTEXT_STRATEGY.ENABLED,
    max_context_tokens: cm.max_context_tokens ?? DEFAULT_CONTEXT_STRATEGY.MAX_CONTEXT_TOKENS,
    preserve_recent_messages:
      cm.preserve_recent_messages ?? DEFAULT_CONTEXT_STRATEGY.PRESERVE_RECENT_MESSAGES,

    // Summarization
    enable_summarization: s.enable_summarization ?? DEFAULT_CONTEXT_STRATEGY.ENABLE_SUMMARIZATION,

    // Summary LLM Settings
    summary_llm_settings: {
      instructions: s.summary_instructions || '',
      model_name: s.summary_model_name || defaultModel?.name || '',
      model_project_id: s.summary_model_project_id ?? defaultModel?.project_id ?? selectedProjectId,
      max_tokens: s.target_summary_tokens ?? DEFAULT_MAX_TOKENS_CUSTOM,
    },
  };
};

/**
 * Transforms Formik form values into API payload
 */
export const deserializeProfileFormData = formValues => ({
  personalization: {
    persona: formValues.persona,
    default_instructions: formValues.default_instructions,
  },
  default_context_management: {
    enabled: formValues.context_enabled,
    max_context_tokens: formValues.max_context_tokens,
    preserve_recent_messages: formValues.preserve_recent_messages,
  },
  default_summarization: {
    enable_summarization: formValues.enable_summarization,
    summary_instructions: formValues.summary_llm_settings.instructions,
    summary_model_name: formValues.summary_llm_settings.model_name,
    summary_model_project_id: formValues.summary_llm_settings.model_project_id,
    target_summary_tokens: formValues.summary_llm_settings.max_tokens,
  },
});

/**
 * Creates formData object compatible with ContextStrategy components
 * Maps flat Formik values to the nested structure expected by reusable components
 */
export const createContextStrategyFormData = formikValues => ({
  // For ContextStrategyTokenManagement
  enabled: formikValues.context_enabled,
  max_context_tokens: formikValues.max_context_tokens,
  preserve_recent_messages: formikValues.preserve_recent_messages,

  // For ContextStrategySummarization
  enable_summarization: formikValues.enable_summarization,
  summary_llm_settings: formikValues.summary_llm_settings,
});

/**
 * Parses model value from SEPARATOR-joined string
 */
export const parseModelValue = value => {
  const [modelName, modelProjectId] = value.split(SEPARATOR);
  return {
    modelName,
    modelProjectId: Number(modelProjectId),
  };
};
