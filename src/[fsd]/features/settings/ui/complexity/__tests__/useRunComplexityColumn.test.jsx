// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

import { useRunComplexityColumn } from '../hooks/useRunComplexityColumn.hooks';

const requests = vi.hoisted(() => []);
// The label each conversation comes back with; the default keeps the earlier tests on 'L'
const labelOf = vi.hoisted(() => ({ byId: {} }));
// Stable like the real dispatch and RTK result, so the effect runs once per input
const stable = vi.hoisted(() => ({
  dispatch: thunk => thunk,
  settings: { data: { complexity_enabled: true } },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => stable.dispatch,
}));
vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  analyticsApi: {
    endpoints: {
      analyticsComplexityDetail: {
        initiate: args => {
          requests.push(args);
          return {
            // Each id comes back scored, one row per conversation like the API
            unwrap: () =>
              Promise.resolve({
                // A conversation in byId with no label is unscored; the rest default to 'L' for the earlier tests
                runs: args.conversationIds
                  .filter(id => !(id in labelOf.byId) || labelOf.byId[id] !== null)
                  .map(id => ({ conversation_id: id, label: labelOf.byId[id] ?? 'L' })),
              }),
            unsubscribe: () => {},
          };
        },
      },
    },
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 3 }));
vi.mock('@/api/platformSettings', () => ({
  useGetPlatformSettingsQuery: () => stable.settings,
}));
vi.mock('@/[fsd]/entities/run-history/lib/helpers', () => ({ parseRunTimestamp: () => NaN }));

const rows = count => Array.from({ length: count }, (_, index) => ({ uuid: `c${index}` }));

describe('useRunComplexityColumn (EL-7556)', () => {
  beforeEach(() => {
    requests.length = 0;
  });
  afterEach(cleanup);

  // #1570 review: rows past the first 100 never got requested, and one limit capped all runs
  it('requests every loaded row in page-sized chunks, with the limit following the ids', async () => {
    // Stable rows, like the Run History state the page passes in
    const loaded = rows(130);
    renderHook(() => useRunComplexityColumn({ entityId: 7, rows: loaded }));

    await waitFor(() => expect(requests).toHaveLength(7));
    expect(requests.map(request => request.conversationIds.length)).toEqual([20, 20, 20, 20, 20, 20, 10]);
    expect(requests.every(request => request.limit === request.conversationIds.length)).toBe(true);
    expect(requests.at(-1).conversationIds.at(-1)).toBe('c129');
  });
});

// PR 1630 review: the labels are L, M, H, X, so the sort must order them by that scale, not by lowercase words
describe('useRunComplexityColumn sort order (PR 1630)', () => {
  afterEach(cleanup);

  it('sorts Low, Medium, High, Extreme in that order, and an unscored run last', async () => {
    // c5 is left out of the response, so it has no score and sorts last
    labelOf.byId = { c1: 'H', c2: 'L', c3: 'X', c4: 'M', c5: null };
    const runRows = [{ uuid: 'c1' }, { uuid: 'c2' }, { uuid: 'c3' }, { uuid: 'c4' }, { uuid: 'c5' }];
    const { result } = renderHook(() => useRunComplexityColumn({ entityId: 9, rows: runRows }));
    // The column reads each run's label from the loaded request; sort the rows with its own comparator
    await waitFor(() => expect(result.current.sortValue({ uuid: 'c1' })).toBe(2));
    const column = result.current;
    const labelOfRow = uuid => labelOf.byId[uuid];
    const ordered = [...runRows]
      .sort((a, b) => column.sortValue(a) - column.sortValue(b))
      .map(row => labelOfRow(row.uuid) ?? 'none');

    expect(ordered).toEqual(['L', 'M', 'H', 'X', 'none']);
    labelOf.byId = {};
  });
});
