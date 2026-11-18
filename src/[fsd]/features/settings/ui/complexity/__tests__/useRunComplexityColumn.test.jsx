// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

import { useRunComplexityColumn } from '../hooks/useRunComplexityColumn.hooks';

const requests = vi.hoisted(() => []);
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
                runs: args.conversationIds.map(id => ({ conversation_id: id, label: 'L' })),
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
