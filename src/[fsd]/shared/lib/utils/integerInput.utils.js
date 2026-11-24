/**
 * Cleans typed integer input: keeps digits and a single leading minus, so signed values such as
 * `-1` ("return all") survive. Lower bounds are left to the schema validation of the field.
 *
 * @param {string} rawValue value of the input element
 * @returns {string} e.g. `'-1'`, `'12'` for `'1-2'`, `'-1'` for `'--1'`, `'-'` while typing
 */
export const sanitizeIntegerInput = rawValue =>
  String(rawValue ?? '')
    .replace(/[^0-9-]/g, '')
    .replace(/(?!^)-/g, '');

/**
 * Parses a sanitized integer string. A lone minus is an unfinished value and parses to null,
 * so it never reaches a payload as `NaN` or `'-'`.
 *
 * @param {string} cleanedValue output of sanitizeIntegerInput
 * @returns {number | null}
 */
export const parseIntegerInput = cleanedValue => {
  if (cleanedValue === '' || cleanedValue === '-') return null;
  const parsed = parseInt(cleanedValue, 10);
  return Number.isNaN(parsed) ? null : parsed;
};
