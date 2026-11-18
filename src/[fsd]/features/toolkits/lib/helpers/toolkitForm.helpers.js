// TODO: DELETE LegacyOpenApiMigration usage after migration period (Q1 2026)
import { normalizeLegacyOpenApiToolkit } from './legacyOpenApiMigration.helpers.js';

const VALUE_ERROR_PREFIX = 'Value error, ';

/**
 * Seeds a toolkit form. `settings` and `type` are forced to be present so the first `setFieldValue`
 * from a child does not create the key and mark an untouched form dirty.
 */
export const buildToolkitFormInitialValues = toolkit => {
  if (!toolkit) return {};

  const normalized = normalizeLegacyOpenApiToolkit(toolkit);

  return {
    ...normalized,
    settings: normalized.settings || {},
    type: normalized.type || '',
  };
};

const pythonToJson = str =>
  str
    .replace(/'/g, '"')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null');

const ERROR_HANDLERS = {
  configuration_model_not_found: parsed => ({
    message: `Model "${parsed.model_name}" is no longer available in project configurations.`,
  }),

  credential_not_found: () => ({
    message: 'Your configuration does not match any available configurations.',
  }),

  private_credential_not_found: () => ({
    message: 'Your private configuration does not match any available configurations.',
  }),
};

const handleConnectionErrors = parsed => {
  const connError = parsed.__connection_errors__?.[0];
  if (!connError) return null;

  return {
    message: connError.message || 'Connection error',
    fieldKey: connError.configuration_type ? `${connError.configuration_type}_configuration` : undefined,
  };
};

const parseJson = text => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const parseErrorBody = body => {
  const parsed = parseJson(body);
  return parsed === undefined ? (parseJson(pythonToJson(body)) ?? null) : parsed;
};

const connectionErrorsOfMessage = msg => {
  if (typeof msg !== 'string') return null;
  const body = msg.startsWith(VALUE_ERROR_PREFIX) ? msg.slice(VALUE_ERROR_PREFIX.length) : msg;
  const errors = parseErrorBody(body)?.__connection_errors__;
  return Array.isArray(errors) && errors.length > 0 ? errors : null;
};

const connectionErrorsOfToolkitEntry = entry =>
  entry?.type === 'connection_error' && !entry.code
    ? [{ message: entry.msg, requires_authorization: entry.requires_authorization }]
    : null;

/**
 * The notice a chat participant shows when every validation error it has is a connection error, else null.
 * `requiresAuthorization` holds only when each of those connection errors just needs the user to sign in.
 */
export const connectionNoticeOf = (toolkitEntries = [], agentMessages = []) => {
  const groups = [
    ...toolkitEntries.map(connectionErrorsOfToolkitEntry),
    ...agentMessages.map(connectionErrorsOfMessage),
  ];
  if (groups.length === 0 || groups.some(errors => !errors)) return null;

  const errors = groups.flat();
  const requiresAuthorization = errors.every(error => error.requires_authorization === true);
  const shown = requiresAuthorization
    ? errors[0]
    : errors.find(error => error.requires_authorization !== true);
  return { message: shown.message || 'Connection error', requiresAuthorization };
};

/**
 * The text an agent or pipeline tool card shows for its sub-agent's validation message: the connection error when that is
 * all the sub-agent has, else what `mapError` recognises, else a generic misconfiguration.
 */
export const applicationToolValidationMessage = (rawMsg, mapError, entityType) => {
  const connectionNotice = connectionNoticeOf([], [rawMsg]);
  if (connectionNotice) return connectionNotice.message;

  const mapped = rawMsg ? mapError(rawMsg) : '';
  return mapped && mapped !== rawMsg ? mapped : `Misconfiguration error found. Check the ${entityType}.`;
};

export const parseValidationError = curr => {
  const msg = curr.msg || '';
  const fieldKey = curr.loc?.[1];

  const body = msg.startsWith(VALUE_ERROR_PREFIX) ? msg.slice(VALUE_ERROR_PREFIX.length) : msg;

  const parsed = parseErrorBody(body);
  if (!parsed) return fieldKey !== undefined ? { fieldKey, message: msg } : null;

  const handler = ERROR_HANDLERS[parsed.error_type];
  if (handler) {
    const result = handler(parsed);
    return { fieldKey, message: result.message };
  }

  const connResult = handleConnectionErrors(parsed);
  if (connResult) {
    return {
      fieldKey: connResult.fieldKey ?? fieldKey,
      message: connResult.message,
    };
  }

  return fieldKey !== undefined ? { fieldKey, message: msg } : null;
};

export const parseValidationErrors = (settingsErrors = []) => {
  return settingsErrors.reduce((acc, curr) => {
    const result = parseValidationError(curr);
    if (result?.fieldKey !== undefined) {
      acc[result.fieldKey] = result.message;
    }
    return acc;
  }, {});
};

// The validator also returns connection errors as plain JSON. Prefer them: the copy embedded in
// settings_errors is Python text that does not survive parsing once it carries quoted challenge headers.
export const parseConnectionErrors = (connectionErrors = []) =>
  connectionErrors.reduce((acc, curr) => {
    const type = curr?.configuration_type;
    if (type) acc[`${type}_configuration`] = curr.message || 'Connection error';
    return acc;
  }, {});

export const parseValidationResponse = (data = {}) => ({
  ...parseValidationErrors(data.settings_errors),
  ...parseConnectionErrors(data.connection_errors),
});

export const CONFIGURATION_VIEW_OPTIONS = {
  ConfigurationSelect: 'configuration',
  CredentialsSelect: 'credentials',
};
