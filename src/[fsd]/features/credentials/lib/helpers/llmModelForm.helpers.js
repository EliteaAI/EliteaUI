import {
  LLM_MODEL_CONNECTION_TEST_FIELDS,
  LLM_MODEL_CONNECTION_TEST_TEXTS,
  LLM_MODEL_CREDENTIAL_TYPE_TAGS,
  LLM_MODEL_ERROR_MESSAGES,
  LLM_MODEL_ERROR_SOURCE_FIELDS,
  LLM_MODEL_FIELDS,
  LLM_MODEL_FIELDS_CHECKED_ON_OPEN,
  LLM_MODEL_FIELD_INFO_TEXTS,
  LLM_MODEL_FIELD_LABELS,
  LLM_MODEL_ID_MAX_LENGTH,
  LLM_MODEL_REASONING_FIELDS,
  LLM_MODEL_TIERS,
} from '../constants/llmModelForm.constants.js';

const WHOLE_NUMBER_INPUT = /^\d+$/;
const DIAL_AZURE_REASONING_REJECTION = "api_protocol='azure' does not support reasoning";
const DESCRIPTION_ERROR_FIELDS = [LLM_MODEL_FIELDS.description, `data.${LLM_MODEL_FIELDS.description}`];

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

export const getLlmModelInfoTestIds = field => ({
  testId: `llm-model-info-${field}`,
  contentTestId: `llm-model-info-text-${field}`,
});

export const getLlmModelInputLabelProps = (field, required = false) => {
  const { testId, contentTestId } = getLlmModelInfoTestIds(field);
  return {
    label: LLM_MODEL_FIELD_LABELS[field],
    required,
    tooltipDescription: LLM_MODEL_FIELD_INFO_TEXTS[field],
    tooltipTestId: testId,
    tooltipContentTestId: contentTestId,
  };
};

export const getLlmModelSelectLabelProps = (field, required = false) => {
  const { testId, contentTestId } = getLlmModelInfoTestIds(field);
  return {
    label: LLM_MODEL_FIELD_LABELS[field],
    required,
    shrinkLabel: true,
    infoIconDescription: LLM_MODEL_FIELD_INFO_TEXTS[field],
    infoTooltipTestId: testId,
    infoTooltipContentTestId: contentTestId,
  };
};

export const getLlmModelCredentialTypeTag = type => LLM_MODEL_CREDENTIAL_TYPE_TAGS[type] || type || '';

export const buildInitialLlmModelSettings = () => ({
  [LLM_MODEL_FIELDS.displayName]: '',
  [LLM_MODEL_FIELDS.id]: '',
  [LLM_MODEL_FIELDS.modelName]: '',
  [LLM_MODEL_FIELDS.contextWindow]: '',
  [LLM_MODEL_FIELDS.maxOutputTokens]: '',
  [LLM_MODEL_FIELDS.vision]: false,
  [LLM_MODEL_FIELDS.reasoning]: false,
  [LLM_MODEL_FIELDS.thinkingType]: null,
  [LLM_MODEL_FIELDS.supportedEfforts]: null,
  [LLM_MODEL_FIELDS.defaultEffort]: null,
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

export const omitLlmModelErrorsDependingOn = (errors, editedField) => {
  const dependsOnEditedField = errorField =>
    (LLM_MODEL_ERROR_SOURCE_FIELDS[errorField] || [errorField]).includes(editedField);
  if (!Object.keys(errors || {}).some(dependsOnEditedField)) return errors;
  return Object.fromEntries(
    Object.entries(errors).filter(([errorField]) => !dependsOnEditedField(errorField)),
  );
};

export const mapLlmModelSaveErrorToFields = error => {
  const { field, error: message } = error?.data || {};
  if (typeof message !== 'string') return {};
  if (field === LLM_MODEL_FIELDS.id) return { [LLM_MODEL_FIELDS.id]: message };
  if (DESCRIPTION_ERROR_FIELDS.includes(field)) return { [LLM_MODEL_FIELDS.description]: message };
  const dataField = String(field || '')
    .replace(/^data\./, '')
    .split('.')[0];
  if (LLM_MODEL_REASONING_FIELDS.includes(dataField)) return { [dataField]: message };
  if (message.includes(DIAL_AZURE_REASONING_REJECTION)) {
    return { [LLM_MODEL_FIELDS.reasoning]: LLM_MODEL_ERROR_MESSAGES.reasoningNotSupportedByProtocol };
  }
  return {};
};

const joinWithAnd = items =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] || '';

export const getLlmModelConnectionTestMissingFields = ({ settings, isApiProtocolShown, apiProtocol }) =>
  [
    !settings?.ai_credentials?.elitea_title && LLM_MODEL_FIELDS.credentials,
    !String(settings?.name ?? '').trim() && LLM_MODEL_FIELDS.modelName,
    isApiProtocolShown && !apiProtocol && LLM_MODEL_FIELDS.apiProtocol,
  ].filter(Boolean);

export const getLlmModelConnectionTestMissingFieldsText = missingFields =>
  LLM_MODEL_CONNECTION_TEST_TEXTS.missingFields(
    joinWithAnd(missingFields.map(f => LLM_MODEL_FIELD_LABELS[f])),
  );

export const buildLlmModelConnectionTestBody = ({ settings, isApiProtocolShown, apiProtocol }) => ({
  ...Object.fromEntries(LLM_MODEL_CONNECTION_TEST_FIELDS.map(field => [field, settings?.[field]])),
  [LLM_MODEL_FIELDS.modelName]: String(settings?.name ?? '').trim(),
  [LLM_MODEL_FIELDS.apiProtocol]: (isApiProtocolShown && apiProtocol) || null,
});

export const formatLlmModelConnectionLatency = elapsedMs =>
  LLM_MODEL_CONNECTION_TEST_TEXTS.connected((elapsedMs / 1000).toFixed(1));

export const getLlmModelConnectionTestFailureText = error => {
  const message = error?.data?.message;
  if (typeof message !== 'string' || !message.trim()) return LLM_MODEL_CONNECTION_TEST_TEXTS.incomplete;
  if (message.includes(DIAL_AZURE_REASONING_REJECTION))
    return LLM_MODEL_ERROR_MESSAGES.reasoningNotSupportedByProtocol;
  return message;
};
