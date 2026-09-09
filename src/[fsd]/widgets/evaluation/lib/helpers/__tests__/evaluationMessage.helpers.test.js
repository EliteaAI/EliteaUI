import { describe, expect, it } from 'vitest';

import {
  caseDeletedMessage,
  caseExcludedMessage,
  caseIncludedMessage,
  caseLabel,
  casesAddedMessage,
  countAddedCases,
  datasetCreatedMessage,
  datasetDeletedMessage,
  dimensionRemovedMessage,
  dimensionsAddedMessage,
  extractAddedCaseId,
  extractAddedCaseIds,
  suiteCreatedMessage,
  suiteDeletedMessage,
} from '../evaluationMessage.helpers';

// Entity names are interpolated bare: quotation marks around them were the inconsistency
// these helpers exist to remove, so the absence of quotes is asserted, not just the wording.
describe('suite and dataset messages', () => {
  it('names the suite without wrapping it in quotes', () => {
    expect(suiteCreatedMessage('AA')).toBe('The AA suite has been successfully created.');
    expect(suiteDeletedMessage('AA')).toBe('The AA suite has been successfully deleted.');
  });

  it('names the dataset without wrapping it in quotes', () => {
    expect(datasetCreatedMessage('Test Cases Checker')).toBe(
      'The Test Cases Checker has been successfully created.',
    );
    expect(datasetDeletedMessage('New2')).toBe('The New2 has been successfully deleted.');
  });

  it('leaves a name containing quotes or markup untouched', () => {
    expect(suiteCreatedMessage('<b>A "B"</b>')).toBe('The <b>A "B"</b> suite has been successfully created.');
  });
});

describe('case messages', () => {
  it('labels a case with a capitalised prefix and its id', () => {
    expect(caseLabel(10)).toBe('Case #10');
  });

  it('identifies the affected case', () => {
    expect(caseExcludedMessage(10)).toBe('The Case #10 has been excluded from this suite.');
    expect(caseIncludedMessage(10)).toBe('The Case #10 has been included in this suite.');
    expect(caseDeletedMessage(10)).toBe('The Case #10 has been successfully deleted.');
  });
});

describe('dimensionsAddedMessage', () => {
  it('names the dimension when exactly one was added', () => {
    expect(dimensionsAddedMessage(1, 'Response Quality')).toBe(
      'The Response Quality dimension has been added to the suite.',
    );
  });

  it('keeps the count wording for several dimensions', () => {
    expect(dimensionsAddedMessage(2, 'Response Quality')).toBe('2 dimensions added to the suite.');
  });

  it('falls back to the count when the single name is unknown', () => {
    expect(dimensionsAddedMessage(1)).toBe('1 dimension added to the suite.');
  });

  it('names the removed dimension', () => {
    expect(dimensionRemovedMessage('Response Quality')).toBe(
      'The Response Quality has been removed from the suite.',
    );
  });
});

describe('casesAddedMessage', () => {
  it('names a single added case by id', () => {
    expect(casesAddedMessage(1, 10)).toBe('The Case #10 has been successfully added.');
  });

  it('reports the count for several added cases', () => {
    expect(casesAddedMessage(5)).toBe('The 5 cases have been successfully added.');
  });

  it('stays singular but drops the id when the endpoint reports no id', () => {
    expect(casesAddedMessage(1)).toBe('The case has been successfully added.');
  });
});

describe('extractAddedCaseId', () => {
  it('reads the id from each shape a single-case endpoint returns', () => {
    expect(extractAddedCaseId({ id: 10 })).toBe(10);
    expect(extractAddedCaseId({ case_id: 11 })).toBe(11);
    expect(extractAddedCaseId({ case: { id: 12 } })).toBe(12);
    expect(extractAddedCaseId({ cases: [{ id: 13 }] })).toBe(13);
    expect(extractAddedCaseId({ case_ids: [14] })).toBe(14);
  });

  it('returns null when no id is reported', () => {
    expect(extractAddedCaseId({ accepted: 3, rejected: 0 })).toBeNull();
    expect(extractAddedCaseId(null)).toBeNull();
    expect(extractAddedCaseId('nope')).toBeNull();
  });

  it('keeps a zero id rather than treating it as missing', () => {
    expect(extractAddedCaseId({ id: 0 })).toBe(0);
  });
});

describe('extractAddedCaseIds', () => {
  it('reads only the shapes that list cases explicitly', () => {
    expect(extractAddedCaseIds({ case_ids: [1, 2] })).toEqual([1, 2]);
    expect(extractAddedCaseIds({ cases: [{ id: 3 }, { id: 4 }] })).toEqual([3, 4]);
  });

  // An import response's own id identifies the import, not a case, so it must not leak into
  // a message that says "Case #...".
  it('ignores a bare id on the response', () => {
    expect(extractAddedCaseIds({ id: 99, accepted: 2 })).toEqual([]);
    expect(extractAddedCaseIds(null)).toEqual([]);
  });

  it('drops entries that carry no id', () => {
    expect(extractAddedCaseIds({ case_ids: [1, null] })).toEqual([1]);
    expect(extractAddedCaseIds({ cases: [{ id: 1 }, {}] })).toEqual([1]);
  });
});

describe('countAddedCases', () => {
  it('prefers the count the server accepted', () => {
    expect(countAddedCases({ accepted: 4, cases: [{ id: 1 }] })).toBe(4);
    expect(countAddedCases({ accepted: 0, rejected: 3 })).toBe(0);
  });

  it('falls back to the number of listed cases', () => {
    expect(countAddedCases({ cases: [{ id: 1 }, { id: 2 }] })).toBe(2);
  });

  it('counts a response that describes nothing as the one case it was asked to create', () => {
    expect(countAddedCases({})).toBe(1);
  });
});
