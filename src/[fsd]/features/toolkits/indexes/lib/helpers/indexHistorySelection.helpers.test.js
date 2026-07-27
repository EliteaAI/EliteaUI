import { describe, expect, it } from 'vitest';

import { getIndexHistoryRunIdentity, reconcileIndexHistorySelection } from './indexHistorySelection.helpers';

describe('index History selection reconciliation', () => {
  it('replaces the selected latest run when refreshed from in progress to completed', () => {
    const inProgress = {
      index_generation: 15,
      execution_id: 'execution-15',
      index_meta_id: 34,
      state: 'in_progress',
      indexed: 0,
      total: 0,
    };
    const mounted = reconcileIndexHistorySelection({
      history: [inProgress],
      selectedItem: null,
      previousLatestIdentity: null,
      initialized: false,
    });

    expect(mounted.selectedItem).toBe(inProgress);
    expect(mounted.latestIdentity).toBe('index_generation:15');

    const completed = {
      ...inProgress,
      state: 'completed',
      indexed: 61,
      total: 66,
    };
    const rerendered = reconcileIndexHistorySelection({
      history: [completed],
      selectedItem: mounted.selectedItem,
      previousLatestIdentity: mounted.latestIdentity,
      initialized: true,
    });

    expect(rerendered.selectedItem).toBe(completed);
    expect(rerendered.selectedItem).toMatchObject({
      state: 'completed',
      indexed: 61,
      total: 66,
    });
  });

  it('preserves an explicitly selected older run across an unrelated latest refresh', () => {
    const older = {
      index_generation: 14,
      state: 'completed',
      indexed: 40,
      total: 42,
    };
    const latest = {
      index_generation: 15,
      state: 'completed',
      indexed: 61,
      total: 66,
    };
    const mounted = reconcileIndexHistorySelection({
      history: [older, latest],
      selectedItem: null,
      previousLatestIdentity: null,
      initialized: false,
    });
    const refreshedOlder = { ...older };
    const nextLatest = {
      index_generation: 16,
      state: 'in_progress',
      indexed: 0,
      total: 0,
    };
    const rerendered = reconcileIndexHistorySelection({
      history: [refreshedOlder, latest, nextLatest],
      selectedItem: older,
      previousLatestIdentity: mounted.latestIdentity,
      initialized: true,
    });

    expect(rerendered.selectedItem).toBe(refreshedOlder);
    expect(getIndexHistoryRunIdentity(rerendered.selectedItem)).toBe('index_generation:14');
    expect(rerendered.latestIdentity).toBe('index_generation:16');
  });
});
