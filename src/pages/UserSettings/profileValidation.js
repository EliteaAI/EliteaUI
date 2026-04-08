import * as yup from 'yup';

import { VALIDATION_LIMITS } from '@/[fsd]/widgets/ContextBudget/lib/constants';

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
