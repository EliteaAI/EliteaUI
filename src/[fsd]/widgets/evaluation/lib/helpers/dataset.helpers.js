import { EVAL_CASE_SOURCE_LABEL } from '../constants';

/** Counts dataset cases that have no expected_output, for the "N without expected" banner (§17.2). */
export const withoutExpectedCount = (cases = []) =>
  cases.filter(c => c.expected_output == null || c.expected_output === '').length;

/** Human-readable label for a case's source_type badge; falls back to the raw value. */
export const caseSourceLabel = sourceType => EVAL_CASE_SOURCE_LABEL[sourceType] || sourceType || '';

/** Truncates long case text for table cells, appending an ellipsis when clipped. */
export const excerpt = (text, max = 80) => {
  const value = text == null ? '' : String(text);
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

/** Formats a variables object as a compact "key=value, …" preview for the case table. */
export const variablesPreview = (variables = {}) => {
  const entries = Object.entries(variables || {});
  if (entries.length === 0) return '';
  return entries.map(([key, value]) => `${key}=${value}`).join(', ');
};
