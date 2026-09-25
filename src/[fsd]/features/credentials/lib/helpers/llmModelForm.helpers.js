import {
  LLM_MODEL_CREDENTIAL_TYPE_TAGS,
  LLM_MODEL_ERROR_MESSAGES,
  LLM_MODEL_ERROR_SOURCE_FIELDS,
  LLM_MODEL_FIELDS,
  LLM_MODEL_FIELDS_CHECKED_ON_OPEN,
  LLM_MODEL_ID_MAX_LENGTH,
  LLM_MODEL_TIERS,
} from '../constants/llmModelForm.constants.js';

const WHOLE_NUMBER_INPUT = /^\d+$/;
const REASONING_PROTOCOL_ERROR = /reasoning/i;

export const convertDisplayNameToLlmModelId = displayName =>
  String(displayName || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, LLM_MODEL_ID_MAX_LENGTH)
    .replace(/[-_]+$/, '');

export const hasConflictingLlmModelTiers = settings => Boolean(settings?.low_tier && settings?.high_tier);

export const getLlmModelTier = settings => {
  if (hasConflictingLlmModelTiers(settings)) return '';
  if (settings?.low_tier) return LLM_MODEL_TIERS.low;
  if (settings?.high_tier) return LLM_MODEL_TIERS.high;
  return LLM_MODEL_TIERS.notSet;
};

export const getLlmModelTierFlags = tier => ({
  [LLM_MODEL_FIELDS.lowTier]: tier === LLM_MODEL_TIERS.low,
  [LLM_MODEL_FIELDS.highTier]: tier === LLM_MODEL_TIERS.high,
});

export const parseLlmModelTokenLimitInput = input => (WHOLE_NUMBER_INPUT.test(input) ? Number(input) : input);

export const getLlmModelCredentialTypeTag = type => LLM_MODEL_CREDENTIAL_TYPE_TAGS[type] || type || '';

export const buildInitialLlmModelSettings = () => ({
  [LLM_MODEL_FIELDS.displayName]: '',
  [LLM_MODEL_FIELDS.id]: '',
  [LLM_MODEL_FIELDS.modelName]: '',
  [LLM_MODEL_FIELDS.contextWindow]: '',
  [LLM_MODEL_FIELDS.maxOutputTokens]: '',
  [LLM_MODEL_FIELDS.vision]: false,
  [LLM_MODEL_FIELDS.reasoning]: false,
  [LLM_MODEL_FIELDS.lowTier]: false,
  [LLM_MODEL_FIELDS.highTier]: false,
  [LLM_MODEL_FIELDS.shared]: false,
  [LLM_MODEL_FIELDS.openaiCompatible]: false,
});

export const pickVisibleLlmModelErrors = ({ errors, settings, initialSettings, isEditing, showAll }) => {
  const hasSettingChanged = key => JSON.stringify(settings?.[key]) !== JSON.stringify(initialSettings?.[key]);
  const isVisible = field =>
    showAll ||
    (isEditing && LLM_MODEL_FIELDS_CHECKED_ON_OPEN.includes(field)) ||
    (LLM_MODEL_ERROR_SOURCE_FIELDS[field] || [field]).some(hasSettingChanged);
  return Object.fromEntries(Object.entries(errors).filter(([field]) => isVisible(field)));
};

export const mapLlmModelSaveErrorToFields = error => {
  const { field, error: message } = error?.data || {};
  if (typeof message !== 'string') return {};
  if (field === LLM_MODEL_FIELDS.id) return { [LLM_MODEL_FIELDS.id]: message };
  if (REASONING_PROTOCOL_ERROR.test(message)) {
    return { [LLM_MODEL_FIELDS.reasoning]: LLM_MODEL_ERROR_MESSAGES.reasoningNotSupportedByProtocol };
  }
  return {};
};
