import { API_PROTOCOLS } from '../constants/apiProtocol.constants.js';
import {
  LLM_MODEL_FIELDS as FIELDS,
  LLM_MODEL_DISPLAY_NAME_MAX_LENGTH,
  LLM_MODEL_ID_MAX_LENGTH,
  LLM_MODEL_ID_PATTERN,
  LLM_MODEL_ERROR_MESSAGES as MESSAGES,
} from '../constants/llmModelForm.constants.js';
import { hasConflictingLlmModelTiers } from '../helpers/llmModelForm.helpers.js';

const isBlank = value => String(value ?? '').trim() === '';

const isPositiveWholeNumber = value => Number.isInteger(value) && value >= 1;

const validateDisplayName = displayName => {
  if (isBlank(displayName)) return MESSAGES.displayNameRequired;
  if (displayName.length > LLM_MODEL_DISPLAY_NAME_MAX_LENGTH) return MESSAGES.displayNameTooLong;
  return null;
};

const validateId = (id, takenIds) => {
  if (isBlank(id)) return MESSAGES.idRequired;
  if (id.length > LLM_MODEL_ID_MAX_LENGTH) return MESSAGES.idTooLong;
  if (!LLM_MODEL_ID_PATTERN.test(id)) return MESSAGES.idInvalid;
  if (takenIds.includes(id)) return MESSAGES.idTaken;
  return null;
};

const validateTokenLimit = (value, requiredMessage) => {
  if (isBlank(value)) return requiredMessage;
  if (!isPositiveWholeNumber(value)) return MESSAGES.tokenLimitNotWholeNumber;
  return null;
};

export const validateLlmModelSettings = ({
  settings = {},
  isEditing = false,
  takenIds = [],
  isApiProtocolShown = false,
  isCredentialTypePending = false,
  apiProtocol = '',
}) => {
  const contextWindowError = validateTokenLimit(settings.context_window, MESSAGES.contextWindowRequired);
  const maxOutputTokensError =
    validateTokenLimit(settings.max_output_tokens, MESSAGES.maxOutputTokensRequired) ||
    (!contextWindowError && settings.max_output_tokens > settings.context_window
      ? MESSAGES.maxOutputTokensAboveContextWindow
      : null);
  const isAzureProtocolWithReasoning =
    isApiProtocolShown && apiProtocol === API_PROTOCOLS.azure && Boolean(settings.supports_reasoning);

  const errors = {
    [FIELDS.displayName]: validateDisplayName(settings.label),
    [FIELDS.id]: isEditing ? null : validateId(settings.elitea_title, takenIds),
    [FIELDS.modelName]: isBlank(settings.name) ? MESSAGES.modelNameRequired : null,
    [FIELDS.contextWindow]: contextWindowError,
    [FIELDS.maxOutputTokens]: maxOutputTokensError,
    [FIELDS.reasoning]: isAzureProtocolWithReasoning ? MESSAGES.reasoningNotSupportedByProtocol : null,
    [FIELDS.modelTier]: hasConflictingLlmModelTiers(settings) ? MESSAGES.modelTierConflict : null,
    [FIELDS.credentials]: settings.ai_credentials?.elitea_title ? null : MESSAGES.credentialsRequired,
    [FIELDS.credentialsCheck]: isCredentialTypePending ? MESSAGES.credentialsTypePending : null,
    [FIELDS.apiProtocol]: isApiProtocolShown && !apiProtocol ? MESSAGES.apiProtocolRequired : null,
  };

  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
};
