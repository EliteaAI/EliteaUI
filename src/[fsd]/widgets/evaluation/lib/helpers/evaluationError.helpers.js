const formatValidationEntry = entry => {
  if (!entry || typeof entry !== 'object') return String(entry);
  const path = Array.isArray(entry.loc) ? entry.loc.filter(part => part !== 'body').join('.') : '';
  const message = entry.msg || entry.message || 'Invalid value';
  return path ? `${path}: ${message}` : message;
};

/**
 * Turns an RTK Query error from an eval create/update mutation into a
 * human-readable string.
 *
 * Backend surfaces two shapes:
 *   - EvalLibraryError (incl. the Layer-1 AST safety pre-screen) → { error: "<message>" }
 *   - Pydantic ValidationError → [{ loc, msg, type }, ...]
 */
export const parseEvalError = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.data;
  if (!data) return fallback;

  if (typeof data === 'string') return data;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.message === 'string') return data.message;

  if (Array.isArray(data)) {
    return data.map(formatValidationEntry).join('\n') || fallback;
  }

  return fallback;
};
