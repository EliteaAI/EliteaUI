// Upper bound on what we try to JSON.parse: a refusal payload is a few hundred bytes,
// anything bigger is a trace or a dump and keeps the generic rendering
const MAX_REFUSAL_PAYLOAD_LENGTH = 4096;

/**
 * Reads a backend refusal payload (`{"code": "DENIED_GRANT", "error": "<readable text>"}`, e.g. the
 * C-1009 admission layer) out of the message exception, so the chat card can show the readable text
 * and the code instead of the generic fallback. Returns undefined unless the payload carries a
 * non-empty `error` string; `code` is optional.
 *
 * @param {unknown} trace exception as stored on the message (JSON string, or a plain object)
 * @returns {{ message: string, code?: string } | undefined}
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

  return code ? { message, code } : { message };
};
