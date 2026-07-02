/**
 * Resolve a download filename from a Content-Disposition header. Prefers the
 * RFC 5987 `filename*=UTF-8''...` parameter (carries non-Latin names intact);
 * falls back to the legacy ASCII `filename="..."` only when it is absent.
 *
 * @param {string} contentDisposition - raw Content-Disposition header value
 * @param {string} [fallback] - returned when neither parameter is present
 * @returns {string}
 */
export const getFilenameFromContentDisposition = (contentDisposition = '', fallback = '') => {
  const extended = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;\n]+)/i);
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim());
    } catch {
      return extended[1].trim();
    }
  }
  const plain = contentDisposition.match(/filename="?([^";\n]+)"?/);
  return plain ? plain[1] : fallback;
};
