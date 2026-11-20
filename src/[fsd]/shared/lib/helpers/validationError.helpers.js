const VALUE_ERROR_PREFIX = 'Value error, ';

/** A pydantic validation message without its `Value error, ` prefix. */
export const valueErrorBody = msg =>
  msg.startsWith(VALUE_ERROR_PREFIX) ? msg.slice(VALUE_ERROR_PREFIX.length) : msg;

const pythonToJson = str =>
  str
    .replace(/'/g, '"')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null');

const parseJson = text => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** A validation message's JSON body, read as JSON first and as a Python repr otherwise; null when it is neither. */
export const parseErrorBody = body => {
  const parsed = parseJson(body);
  return parsed === undefined ? (parseJson(pythonToJson(body)) ?? null) : parsed;
};

const connectionErrorsOfMessage = msg => {
  if (typeof msg !== 'string') return null;
  const errors = parseErrorBody(valueErrorBody(msg))?.__connection_errors__;
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
