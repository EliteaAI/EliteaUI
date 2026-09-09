/**
 * Success-toast and confirmation copy for Agent Evaluation entity actions.
 *
 * Centralised so the suite, dataset, case and dimension messages stay phrased the same way
 * wherever they are raised, and so the singular/plural switches are covered by unit tests
 * rather than re-derived at each call site. Every value is interpolated as plain text — the
 * toast and modal components render strings as text nodes, so names need no extra escaping
 * and are never wrapped in quotation marks.
 */

/** The identifier users see for a case everywhere in the UI, e.g. `Case #10`. */
export const caseLabel = caseId => `Case #${caseId}`;

export const suiteCreatedMessage = name => `The ${name} suite has been successfully created.`;

export const suiteDeletedMessage = name => `The ${name} suite has been successfully deleted.`;

export const datasetCreatedMessage = name => `The ${name} has been successfully created.`;

export const datasetDeletedMessage = name => `The ${name} has been successfully deleted.`;

export const caseExcludedMessage = caseId => `The ${caseLabel(caseId)} has been excluded from this suite.`;

export const caseIncludedMessage = caseId => `The ${caseLabel(caseId)} has been included in this suite.`;

export const caseDeletedMessage = caseId => `The ${caseLabel(caseId)} has been successfully deleted.`;

export const dimensionRemovedMessage = name => `The ${name} has been removed from the suite.`;

/**
 * A single added dimension is named; batches keep the count-based wording. `dimensionName` is
 * only known when exactly one dimension was attached, so the count form is the fallback.
 */
export const dimensionsAddedMessage = (count, dimensionName = null) => {
  if (count === 1 && dimensionName) {
    return `The ${dimensionName} dimension has been added to the suite.`;
  }
  return `${count} dimension${count === 1 ? '' : 's'} added to the suite.`;
};

/**
 * `count` is the number of cases the server actually stored, not the number picked for import.
 * A single case is named by its id; when the endpoint reports a count without ids the message
 * stays singular but drops the identifier rather than printing a wrong one.
 */
export const casesAddedMessage = (count, caseId = null) => {
  if (count !== 1) return `The ${count} cases have been successfully added.`;
  return caseId == null
    ? 'The case has been successfully added.'
    : `The ${caseLabel(caseId)} has been successfully added.`;
};

/**
 * Ids a response lists explicitly as the cases it stored. Only collection shapes are read
 * here, so a payload whose own `id` means something else (a dataset, an import job) can never
 * be mistaken for a case id.
 */
export const extractAddedCaseIds = result => {
  if (!result || typeof result !== 'object') return [];
  if (Array.isArray(result.case_ids)) return result.case_ids.filter(id => id != null);
  if (Array.isArray(result.cases)) return result.cases.map(item => item?.id).filter(id => id != null);
  return [];
};

/**
 * Id of the case a single-case endpoint created. Promoting a conversation answers with the
 * case itself, so its own id counts here; `null` means the response named no case.
 */
export const extractAddedCaseId = result => {
  if (!result || typeof result !== 'object') return null;
  const direct = [result.id, result.case_id, result.case?.id].find(value => value != null);
  return direct ?? extractAddedCaseIds(result)[0] ?? null;
};

/**
 * How many cases one response stored. An explicit accepted count wins, then the ids the
 * response listed; a call that resolved without describing its result counts as the single
 * case it was asked to create.
 */
export const countAddedCases = result => {
  if (typeof result?.accepted === 'number') return result.accepted;
  const ids = extractAddedCaseIds(result);
  return ids.length > 0 ? ids.length : 1;
};
