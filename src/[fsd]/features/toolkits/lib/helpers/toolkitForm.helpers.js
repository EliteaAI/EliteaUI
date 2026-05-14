const VALUE_ERROR_PREFIX = 'Value error, ';

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

const parseErrorBody = body => {
  try {
    return JSON.parse(pythonToJson(body));
  } catch {
    return null;
  }
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

export const CONFIGURATION_VIEW_OPTIONS = {
  ConfigurationSelect: 'configuration',
  CredentialsSelect: 'credentials',
};
