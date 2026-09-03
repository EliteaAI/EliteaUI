import * as yup from 'yup';

import {
  ContextStrategyConstants,
  InternalToolsConstants,
  LLMSettingsConstants,
} from '@/[fsd]/shared/lib/constants';
import { DEFAULT_PERSONA, PERSONA_OPTIONS } from '@/common/constants';

const { DEFAULT_CONTEXT_STRATEGY, SEPARATOR, VALIDATION_LIMITS } = ContextStrategyConstants;
const { DEFAULT_MAX_TOKENS_CUSTOM } = LLMSettingsConstants;
const { INTERNAL_TOOL_PERSONALIZATION_FIELD_MAP, INTERNAL_TOOL_AGENT_PERSONALIZATION_FIELD_MAP } =
  InternalToolsConstants;

// #5392: every persona starts with an empty instructions slot.
export const EMPTY_PERSONALITY_INSTRUCTIONS = PERSONA_OPTIONS.reduce(
  (acc, { value }) => ({ ...acc, [value]: '' }),
  {},
);

// #6285: single source of truth for the 20 default_*_enabled module-toggle keys, reusing the
// field maps that already drive INTERNAL_TOOLS_LIST — avoids listing them a third/fourth time
// across PROFILE_INITIAL_VALUES, serializeModuleToggles, and deserializeModuleSettingsFormData.
const MODULE_TOGGLE_KEYS = [
  ...Object.values(INTERNAL_TOOL_PERSONALIZATION_FIELD_MAP),
  ...Object.values(INTERNAL_TOOL_AGENT_PERSONALIZATION_FIELD_MAP),
];

// #6303: mid-turn input rides the same project-scoped store as the module toggles.
const MODULE_SETTINGS_KEYS = [...MODULE_TOGGLE_KEYS, 'midturn_injection_enabled'];

const MODULE_TOGGLE_DEFAULTS = MODULE_SETTINGS_KEYS.reduce((acc, key) => ({ ...acc, [key]: false }), {});

export const PROFILE_INITIAL_VALUES = {
  persona: DEFAULT_PERSONA,
  personality_instructions: { ...EMPTY_PERSONALITY_INSTRUCTIONS },
  ...MODULE_TOGGLE_DEFAULTS,
  context_enabled: DEFAULT_CONTEXT_STRATEGY.ENABLED,
  max_context_tokens: DEFAULT_CONTEXT_STRATEGY.MAX_CONTEXT_TOKENS,
  preserve_recent_messages: DEFAULT_CONTEXT_STRATEGY.PRESERVE_RECENT_MESSAGES,
  enable_summarization: DEFAULT_CONTEXT_STRATEGY.ENABLE_SUMMARIZATION,
  enable_context_editing: DEFAULT_CONTEXT_STRATEGY.ENABLE_CONTEXT_EDITING,
  summary_llm_settings: {
    instructions: '',
    model_name: '',
    model_project_id: null,
    max_tokens: DEFAULT_MAX_TOKENS_CUSTOM,
  },
};

// #6285/#6303: module toggles and mid-turn input live in the project-scoped module_settings
// store now, not authorData.personalization.
const serializeModuleToggles = moduleSettingsData =>
  MODULE_SETTINGS_KEYS.reduce((acc, key) => ({ ...acc, [key]: moduleSettingsData?.[key] ?? false }), {});

export const serializeProfileFormData = (authorData, moduleSettingsData, defaultModel, selectedProjectId) => {
  const moduleToggles = serializeModuleToggles(moduleSettingsData);

  if (!authorData) {
    return {
      ...PROFILE_INITIAL_VALUES,
      ...moduleToggles,
      persona: '',
      personality_instructions: { ...EMPTY_PERSONALITY_INSTRUCTIONS },
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
    // #5392: merge saved per-persona instructions over the empty defaults so every persona key
    // is always present (backend GET self-heals legacy rows into this dict).
    personality_instructions: {
      ...EMPTY_PERSONALITY_INSTRUCTIONS,
      ...(p.personality_instructions || {}),
    },
    ...moduleToggles,
    context_enabled: cm.enabled ?? DEFAULT_CONTEXT_STRATEGY.ENABLED,
    max_context_tokens: cm.max_context_tokens ?? DEFAULT_CONTEXT_STRATEGY.MAX_CONTEXT_TOKENS,
    preserve_recent_messages:
      cm.preserve_recent_messages ?? DEFAULT_CONTEXT_STRATEGY.PRESERVE_RECENT_MESSAGES,
    enable_context_editing: cm.enable_context_editing ?? DEFAULT_CONTEXT_STRATEGY.ENABLE_CONTEXT_EDITING,
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
    // #5392: send the full per-persona map; default_instructions is server-owned now.
    personality_instructions: formValues.personality_instructions,
  },
  default_context_management: {
    enabled: formValues.context_enabled,
    max_context_tokens: formValues.max_context_tokens,
    preserve_recent_messages: formValues.preserve_recent_messages,
    enable_context_editing: formValues.enable_context_editing,
  },
  default_summarization: {
    enable_summarization: formValues.enable_summarization,
    summary_instructions: formValues.summary_llm_settings.instructions,
    summary_model_name: formValues.summary_llm_settings.model_name,
    summary_model_project_id: formValues.summary_llm_settings.model_project_id,
    target_summary_tokens: formValues.summary_llm_settings.max_tokens,
  },
});

// #6285/#6303: module toggles and mid-turn input are saved separately, scoped to the current project.
export const deserializeModuleSettingsFormData = formValues =>
  MODULE_SETTINGS_KEYS.reduce((acc, key) => ({ ...acc, [key]: formValues[key] }), {});

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
  personality_instructions: yup.object(),

  // Context Management
  context_enabled: yup.boolean(),
  enable_context_editing: yup.boolean(),
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
