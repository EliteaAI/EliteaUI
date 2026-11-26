import { describe, expect, it } from 'vitest';

import { IndexRunInitiators, IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';

import { INDEX_RUN_EVENTS, resolveIndexRunEvent, resolveIndexRunStatus } from '../indexRunHistoryRow.helpers';

describe('resolveIndexRunEvent', () => {
  it('reads Scheduled reindex for both a successful and a failed scheduled run (AC-36)', () => {
    expect(resolveIndexRunEvent({ state: IndexStatuses.scheduledReindex })).toBe(
      INDEX_RUN_EVENTS.scheduledReindex,
    );
    expect(resolveIndexRunEvent({ state: IndexStatuses.fail, initiator: IndexRunInitiators.schedule })).toBe(
      INDEX_RUN_EVENTS.scheduledReindex,
    );
  });

  it('never shows the outcome in the Event: a failed reindex reads Reindex', () => {
    expect(resolveIndexRunEvent({ state: IndexStatuses.fail, reindex: true })).toBe(INDEX_RUN_EVENTS.reindex);
  });

  it('reads Index created for a created index, Indexing for a run in progress', () => {
    expect(resolveIndexRunEvent({ state: IndexStatuses.created })).toBe(INDEX_RUN_EVENTS.created);
    expect(resolveIndexRunEvent({ state: IndexStatuses.progress })).toBe(INDEX_RUN_EVENTS.indexing);
  });

  it('reads Search index for a search run', () => {
    expect(resolveIndexRunEvent({ state: IndexStatuses.runTest }, { isSearch: true })).toBe(
      INDEX_RUN_EVENTS.searchIndex,
    );
  });
});

describe('resolveIndexRunStatus', () => {
  it('maps the backend states to the five status keys of the design (AC-38)', () => {
    expect(resolveIndexRunStatus({ state: IndexStatuses.progress })).toBe('running');
    expect(resolveIndexRunStatus({ state: IndexStatuses.success })).toBe('success');
    expect(resolveIndexRunStatus({ state: IndexStatuses.partlyOk })).toBe('partial');
    expect(resolveIndexRunStatus({ state: IndexStatuses.fail })).toBe('failed');
    expect(resolveIndexRunStatus({ state: IndexStatuses.cancelled })).toBe('stopped');
  });

  it('returns null for a state with no status in the design', () => {
    expect(resolveIndexRunStatus({ state: 'unknown_state' })).toBeNull();
  });
});
