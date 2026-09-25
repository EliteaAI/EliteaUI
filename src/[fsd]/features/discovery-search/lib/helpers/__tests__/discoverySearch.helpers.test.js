import { describe, expect, it } from 'vitest';

import { CollectionStatus, SUGGESTION_PAGE_SIZE } from '@/common/constants';

import {
  filterTagsByQuery,
  getAutoSuggestionTypes,
  getShowMoreCounts,
  getSuggestionStatuses,
  shouldFetchMoreSuggestions,
} from '../discoverySearch.helpers';

describe('getSuggestionStatuses', () => {
  it.each(['latest', 'my-liked', 'trending'])('returns published status for %s tab', tab => {
    expect(getSuggestionStatuses(tab)).toEqual([CollectionStatus.Published]);
  });

  it('returns undefined for other tabs', () => {
    expect(getSuggestionStatuses('all')).toBeUndefined();
    expect(getSuggestionStatuses(undefined)).toBeUndefined();
  });
});

describe('getAutoSuggestionTypes', () => {
  it.each([
    [{ isPublicApplications: true }, ['tag', 'application']],
    [{ isPipelines: true }, ['tag', 'pipeline']],
    [{ isToolkits: true }, ['toolkit']],
    [{ isMCPs: true }, ['mcp']],
    [{ isCredentials: true }, ['credential']],
    [{ isSkills: true }, ['tag', 'skill']],
    [{ isUserPublic: true }, ['tag', 'application', 'pipeline', 'toolkit', 'credential']],
  ])('returns types for %o', (flags, expected) => {
    expect(getAutoSuggestionTypes(flags)).toEqual(expected);
  });

  it('returns an empty list when no flag is set', () => {
    expect(getAutoSuggestionTypes({})).toEqual([]);
  });

  it('resolves flags by priority', () => {
    expect(getAutoSuggestionTypes({ isPublicApplications: true, isPipelines: true })).toEqual([
      'tag',
      'application',
    ]);
    expect(getAutoSuggestionTypes({ isToolkits: true, isUserPublic: true })).toEqual(['toolkit']);
    expect(getAutoSuggestionTypes({ isSkills: true, isUserPublic: true })).toEqual(['tag', 'skill']);
  });
});

describe('filterTagsByQuery', () => {
  const tags = [{ name: 'Frontend' }, { name: 'backend' }, { name: undefined }];

  it('returns all tags for an empty or blank query', () => {
    expect(filterTagsByQuery(tags, '')).toBe(tags);
    expect(filterTagsByQuery(tags, '   ')).toBe(tags);
    expect(filterTagsByQuery(tags, undefined)).toBe(tags);
  });

  it('filters case-insensitively and skips tags without a name', () => {
    expect(filterTagsByQuery(tags, 'END')).toEqual([{ name: 'Frontend' }, { name: 'backend' }]);
    expect(filterTagsByQuery(tags, 'front')).toEqual([{ name: 'Frontend' }]);
  });
});

describe('getShowMoreCounts', () => {
  it('caps the next count at the page size', () => {
    expect(getShowMoreCounts(20, 5)).toEqual({ remainedCount: 15, nextCount: SUGGESTION_PAGE_SIZE });
  });

  it('returns the remainder when fewer than a page are left', () => {
    expect(getShowMoreCounts(7, 5)).toEqual({ remainedCount: 2, nextCount: 2 });
  });

  it('returns zero when everything is visible', () => {
    expect(getShowMoreCounts(5, 5)).toEqual({ remainedCount: 0, nextCount: 0 });
  });
});

describe('shouldFetchMoreSuggestions', () => {
  it('fetches when loaded items do not cover the next visible count', () => {
    expect(shouldFetchMoreSuggestions(5, 10, 20)).toBe(true);
  });

  it('does not fetch when loaded items already cover the next visible count', () => {
    expect(shouldFetchMoreSuggestions(10, 10, 20)).toBe(false);
  });

  it('does not fetch when everything is already loaded', () => {
    expect(shouldFetchMoreSuggestions(7, 10, 7)).toBe(false);
  });
});
