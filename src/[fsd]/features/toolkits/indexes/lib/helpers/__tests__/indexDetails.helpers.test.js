import { describe, expect, it } from 'vitest';

import { hasLiveRun } from '../indexDetails.helpers';

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
