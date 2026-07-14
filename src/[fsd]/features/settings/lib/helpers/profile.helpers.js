import * as yup from 'yup';

import { DEFAULT_MAX_TOKENS_CUSTOM } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import {
  DEFAULT_CONTEXT_STRATEGY,
  SEPARATOR,
  VALIDATION_LIMITS,
} from '@/[fsd]/widgets/context-budget/lib/constants';
import { DEFAULT_PERSONA } from '@/common/constants';

export const PROFILE_INITIAL_VALUES = {
  persona: DEFAULT_PERSONA,
  default_instructions: '',
  default_internal_mcp_enabled: true,
  context_enabled: DEFAULT_CONTEXT_STRATEGY.ENABLED,
  max_context_tokens: DEFAULT_CONTEXT_STRATEGY.MAX_CONTEXT_TOKENS,
  preserve_recent_messages: DEFAULT_CONTEXT_STRATEGY.PRESERVE_RECENT_MESSAGES,
  enable_summarization: DEFAULT_CONTEXT_STRATEGY.ENABLE_SUMMARIZATION,
  summary_llm_settings: {
    instructions: '',
    model_name: '',
    model_project_id: null,
    max_tokens: DEFAULT_MAX_TOKENS_CUSTOM,
  },
};

export const serializeProfileFormData = (authorData, defaultModel, selectedProjectId) => {
  if (!authorData) {
    return {
      ...PROFILE_INITIAL_VALUES,
      persona: '',
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
    persona: p.persona || DEFAULT_PERSONA,
    default_instructions: p.default_instructions || '',
    default_internal_mcp_enabled: p.default_internal_mcp_enabled ?? true,
    context_enabled: cm.enabled ?? DEFAULT_CONTEXT_STRATEGY.ENABLED,
    max_context_tokens: cm.max_context_tokens ?? DEFAULT_CONTEXT_STRATEGY.MAX_CONTEXT_TOKENS,
    preserve_recent_messages:
      cm.preserve_recent_messages ?? DEFAULT_CONTEXT_STRATEGY.PRESERVE_RECENT_MESSAGES,
    enable_summarization: s.enable_summarization ?? DEFAULT_CONTEXT_STRATEGY.ENABLE_SUMMARIZATION,
    summary_llm_settings: {
      instructions: s.summary_instructions || '',
      model_name: s.summary_model_name || defaultModel?.name || '',
      model_project_id: s.summary_model_project_id ?? defaultModel?.project_id ?? selectedProjectId,
      max_tokens: s.target_summary_tokens ?? DEFAULT_MAX_TOKENS_CUSTOM,
    },
  };
};

export const deserializeProfileFormData = formValues => ({
  personalization: {
    persona: formValues.persona,
    default_instructions: formValues.default_instructions,
    default_internal_mcp_enabled: formValues.default_internal_mcp_enabled,
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

export const createContextStrategyFormData = formikValues => ({
  enabled: formikValues.context_enabled,
  max_context_tokens: formikValues.max_context_tokens,
  preserve_recent_messages: formikValues.preserve_recent_messages,
  enable_summarization: formikValues.enable_summarization,
  summary_llm_settings: formikValues.summary_llm_settings,
});

export const parseModelValue = value => {
  const [modelName, modelProjectId] = value.split(SEPARATOR);
  return {
    modelName,
    modelProjectId: Number(modelProjectId),
  };
};

/**
 * Validation schema for profile settings form
 * Reuses validation limits from ContextBudget constants
 */
export const profileValidationSchema = yup.object({
  // Personalization - no strict validation, just string types
  persona: yup.string().required('Please select a personality'),
  default_instructions: yup.string(),

  // Context Management
  context_enabled: yup.boolean(),
  max_context_tokens: yup
    .number()
    .typeError('Please enter a valid number')
    .integer('Must be a whole number')
    .when('context_enabled', {
      is: true,
      then: schema =>
        schema
          .required('This field is required')
          .min(
            VALIDATION_LIMITS.MAX_CONTEXT_TOKENS.MIN,
            `Max tokens must be at least ${VALIDATION_LIMITS.MAX_CONTEXT_TOKENS.MIN.toLocaleString()}`,
          )
          .max(
            VALIDATION_LIMITS.MAX_CONTEXT_TOKENS.MAX,
            `Max tokens cannot exceed ${VALIDATION_LIMITS.MAX_CONTEXT_TOKENS.MAX.toLocaleString()}`,
          ),
      otherwise: schema => schema.nullable(),
    }),
  preserve_recent_messages: yup
    .number()
    .typeError('Please enter a valid number')
    .integer('Must be a whole number')
    .when('context_enabled', {
      is: true,
      then: schema =>
        schema
          .required('This field is required')
          .min(
            VALIDATION_LIMITS.PRESERVE_RECENT_MESSAGES.MIN,
            `Preserve messages must be at least ${VALIDATION_LIMITS.PRESERVE_RECENT_MESSAGES.MIN}`,
          )
          .max(
            VALIDATION_LIMITS.PRESERVE_RECENT_MESSAGES.MAX,
            `Preserve messages cannot exceed ${VALIDATION_LIMITS.PRESERVE_RECENT_MESSAGES.MAX}`,
          ),
      otherwise: schema => schema.nullable(),
    }),

  // Summarization
  enable_summarization: yup.boolean(),

  // Summary LLM Settings (nested)
  summary_llm_settings: yup.object({
    instructions: yup.string(),
    model_name: yup.string(),
    model_project_id: yup.number().nullable(),
    max_tokens: yup
      .number()
      .typeError('Please enter a valid number')
      .integer('Must be a whole number')
      .required('This field is required')
      .min(
        VALIDATION_LIMITS.MAX_TOKENS.MIN,
        `Target tokens must be at least ${VALIDATION_LIMITS.MAX_TOKENS.MIN}`,
      )
      .max(
        VALIDATION_LIMITS.MAX_TOKENS.MAX,
        `Target tokens cannot exceed ${VALIDATION_LIMITS.MAX_TOKENS.MAX.toLocaleString()}`,
      ),
  }),
});
