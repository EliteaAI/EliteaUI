import { describe, expect, it } from 'vitest';

import { resolveToolEventLabel } from '../toolEvent.helpers';

describe('resolveToolEventLabel', () => {
  it('humanises tool identifiers into the column vocabulary', () => {
    expect(resolveToolEventLabel('get_issues')).toBe('Get issues');
    expect(resolveToolEventLabel('index_data')).toBe('Index data');
  });

  it('names each search-index variant after the tool that was actually run', () => {
    expect(resolveToolEventLabel('search_index')).toBe('Search Index');
    expect(resolveToolEventLabel('stepback_search_index')).toBe('Stepback Search Index');
    expect(resolveToolEventLabel('stepback_summary_index')).toBe('Stepback Summary Index');
  });

  it('humanises a tool named after an Object member instead of returning the member', () => {
    expect(resolveToolEventLabel('constructor')).toBe('Constructor');
    expect(resolveToolEventLabel('toString')).toBe('ToString');
    expect(resolveToolEventLabel('__proto__')).toBe('  proto  ');
  });

  it('has nothing to say without a tool', () => {
    expect(resolveToolEventLabel(null)).toBeNull();
    expect(resolveToolEventLabel('')).toBeNull();
  });
});
