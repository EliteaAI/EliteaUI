/**
 * Reads a readable backend refusal out of a failed request: a 403 whose body carries a non-empty
 * `code` and `message` (e.g. the C-1009 governed credential probe). Any other 403 (no `code`, or no
 * readable `message`) returns undefined, so callers keep their generic "insufficient permissions" text.
 *
 * @param {{ status?: number, data?: unknown } | undefined} error RTK Query error object
 * @returns {{ message: string, code: string } | undefined}
 */
export const readRefusal = error => {
  if (error?.status !== 403) return undefined;

  const data = error.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;

  const code = typeof data.code === 'string' ? data.code.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';

  return code && message ? { message, code } : undefined;
};
