import { describe, expect, it } from 'vitest';

import { resolveToolEventLabel } from '../toolEvent.helpers';

describe('resolveToolEventLabel', () => {
  it('humanises tool identifiers into the column vocabulary', () => {
    expect(resolveToolEventLabel('get_issues')).toBe('Get issues');
    expect(resolveToolEventLabel('index_data')).toBe('Index data');
  });

  it('names every search-index variant the same way', () => {
    expect(resolveToolEventLabel('search_index')).toBe('Search index');
    expect(resolveToolEventLabel('stepback_search_index')).toBe('Search index');
    expect(resolveToolEventLabel('stepback_summary_index')).toBe('Search index');
  });

  it('has nothing to say without a tool', () => {
    expect(resolveToolEventLabel(null)).toBeNull();
    expect(resolveToolEventLabel('')).toBeNull();
  });
});
