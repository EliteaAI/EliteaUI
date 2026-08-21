import { describe, expect, it } from 'vitest';

import { INDEX_SEARCH_TOOL_OPTIONS, IndexStatuses } from '../../constants/indexDetails.constants';
import { hasLiveRun, indexSearchBlockedReason, indexSearchToolOptions } from '../indexDetails.helpers';

const runState = over => ({ isIndexing: true, canStopIndexing: false, isStale: false, ...over });

describe('hasLiveRun', () => {
  it('holds while indexing and nothing says the run died', () => {
    expect(hasLiveRun(runState())).toBe(true);
  });

  it('clears once the backend marks an unstoppable run stale', () => {
    expect(hasLiveRun(runState({ isStale: true }))).toBe(false);
  });

  it('holds for a stale run this panel can still stop', () => {
    expect(hasLiveRun(runState({ isStale: true, canStopIndexing: true }))).toBe(true);
  });

  it('clears when no run is in flight', () => {
    expect(hasLiveRun(runState({ isIndexing: false }))).toBe(false);
  });
});

const allSearchTools = INDEX_SEARCH_TOOL_OPTIONS.map(option => option.value);

describe('indexSearchToolOptions', () => {
  it('keeps only the search tools the toolkit exposes', () => {
    expect(indexSearchToolOptions(['search_index', 'index_data', 'read_page_by_id'])).toEqual([
      { label: 'Search Index', value: 'search_index' },
    ]);
  });

  it('treats a missing tool list as none enabled', () => {
    expect(indexSearchToolOptions(undefined)).toEqual([]);
  });
});

describe('indexSearchBlockedReason', () => {
  it('allows searching every state that holds queryable data', () => {
    expect(indexSearchBlockedReason(IndexStatuses.success, allSearchTools)).toBeNull();
    expect(indexSearchBlockedReason(IndexStatuses.partlyOk, allSearchTools)).toBeNull();
    expect(indexSearchBlockedReason(IndexStatuses.scheduledReindex, allSearchTools)).toBeNull();
  });

  it('blames the running operation while indexing', () => {
    expect(indexSearchBlockedReason(IndexStatuses.progress, allSearchTools)).toMatch(
      /indexing is in progress/,
    );
  });

  it('blocks states that never produced searchable data', () => {
    expect(indexSearchBlockedReason(IndexStatuses.fail, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(IndexStatuses.cancelled, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(IndexStatuses.created, allSearchTools)).toMatch(/not ready/);
    expect(indexSearchBlockedReason(undefined, allSearchTools)).toMatch(/not ready/);
  });

  it('blocks a searchable index whose toolkit exposes no search tool', () => {
    expect(indexSearchBlockedReason(IndexStatuses.success, ['index_data'])).toMatch(
      /No search tools are enabled/,
    );
  });
});
