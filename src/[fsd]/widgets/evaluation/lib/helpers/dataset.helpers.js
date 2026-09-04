import { EVAL_CASE_SOURCE_LABEL } from '../constants';

/**
 * True when `dataset` is known to be owned by a different agent than `applicationId`.
 * `agent_id == null` covers rows that predate the column and is treated as "owned
 * here" rather than foreign, so it does not count as shared-in.
 */
export const isDatasetSharedIn = (dataset, applicationId = null) =>
  applicationId != null && dataset?.agent_id != null && dataset.agent_id !== applicationId;

/** Counts dataset cases that have no expected_output, for the "N without expected" banner (§17.2). */
export const withoutExpectedCount = (cases = []) =>
  cases.filter(c => c.expected_output == null || c.expected_output === '').length;

/** Human-readable label for a case's source_type badge; falls back to the raw value. */
export const caseSourceLabel = sourceType => EVAL_CASE_SOURCE_LABEL[sourceType] || sourceType || '';

/** Newest-first ordering for dataset lists, falling back to created_at then epoch. */
export const sortDatasetsByDate = (datasets = []) =>
  [...datasets].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at || 0);
    const dateB = new Date(b.updated_at || b.created_at || 0);
    return dateB - dateA;
  });

/**
 * Renders a case field for display: strings pass through, objects are pretty-printed,
 * and empty values become an em dash so the column never renders blank.
 */
export const formatCaseContent = value => {
  if (value == null || value === '') return '—';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

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
