/**
 * Backend admission-layer refusals arrive as a JSON string `{"code": "...", "error": "..."}`.
 * Returns `{ code, message }` when the payload matches that shape, otherwise `undefined`.
 *
 * @param {string | undefined} trace
 * @returns {{ code: string, message: string } | undefined}
 */
export const parseRefusalPayload = trace => {
  if (!trace) return undefined;
  try {
    const parsed = JSON.parse(trace);
    if (parsed && typeof parsed === 'object' && parsed.error) {
      return {
        message: parsed.error,
        code: parsed.code ?? undefined,
      };
    }
  } catch {
    // not JSON — normal stack trace, not a refusal
  }
  return undefined;
};
