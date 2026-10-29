// Upper bound on what we try to JSON.parse: a refusal payload is a few hundred bytes,
// anything bigger is a trace or a dump and keeps the generic rendering
const MAX_REFUSAL_PAYLOAD_LENGTH = 4096;
// A support reference names the server log line of a refusal (a uuid today); anything else is dropped
const SUPPORT_REFERENCE_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

/**
 * Reads a backend refusal payload (`{"code": "DENIED_GRANT", "error": "<readable text>"}`, e.g. the
 * C-1009 admission layer) out of the message exception, so the chat card can show the readable text
 * and the code instead of the generic fallback. Returns undefined unless the payload carries a
 * non-empty `error` string; `code` is optional, and so is `ref`, the support reference of the server log line.
 *
 * @param {unknown} trace exception as stored on the message (JSON string, or a plain object)
 * @returns {{ message: string, code?: string, supportRef?: string } | undefined}
 */
export const parseRefusalPayload = trace => {
  let payload = trace;

  if (typeof trace === 'string') {
    const text = trace.trim();
    if (!text.startsWith('{') || text.length > MAX_REFUSAL_PAYLOAD_LENGTH) return undefined;
    try {
      payload = JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;

  const message = typeof payload.error === 'string' ? payload.error.trim() : '';
  if (!message) return undefined;

  const code = typeof payload.code === 'string' ? payload.code.trim() : '';
  const supportRef =
    typeof payload.ref === 'string' && SUPPORT_REFERENCE_PATTERN.test(payload.ref) ? payload.ref : '';

  return {
    message,
    ...(code && { code }),
    ...(supportRef && { supportRef }),
  };
};

/**
 * A governance refusal only: the payload must carry its `code`. On the toolkit and index paths a code-less
 * `{error}` stays a failed tool (with the tool name), not a refusal card.
 *
 * @param {unknown} trace
 * @returns {{ message: string, code: string, supportRef?: string } | undefined}
 */
export const parseGovernanceRefusal = trace => {
  const refusal = parseRefusalPayload(trace);
  return refusal?.code ? refusal : undefined;
};

const VALUE_ERROR_PREFIX = 'Value error, ';

/**
 * A governance refusal carried by a validation result (#7281): a toolkit's connection error that names its `code`
 * (`{msg, code}`), or an agent's toolkit error whose text is the refusal payload (`Value error, {"code", "error"}`).
 * Anything else (a real misconfiguration) is undefined and keeps its own marker.
 *
 * @param {unknown} info a validation entry, or its message
 * @returns {{ message: string, code: string, supportRef?: string } | undefined}
 */
export const parseValidationRefusal = info => {
  if (info && typeof info === 'object' && !Array.isArray(info)) {
    const message = typeof info.msg === 'string' ? info.msg.trim() : '';
    const code = typeof info.code === 'string' ? info.code.trim() : '';
    return message && code ? { message, code } : undefined;
  }
  if (typeof info !== 'string') return undefined;
  return parseGovernanceRefusal(
    info.startsWith(VALUE_ERROR_PREFIX) ? info.slice(VALUE_ERROR_PREFIX.length) : info,
  );
};

/**
 * A governance refusal of a toolkit or index run, kept with the payload it was read from and the message it
 * belongs to, so the card's "Error debugging info" shows what the worker sent and names its download.
 *
 * @param {unknown} content the exception content as received
 * @param {string} [messageId]
 * @returns {{ message: string, code: string, trace: string, messageId?: string } | undefined}
 */
export const parseRunRefusal = (content, messageId) => {
  const refusal = parseGovernanceRefusal(content);
  if (!refusal) return undefined;

  return {
    ...refusal,
    trace: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
    messageId,
  };
};
