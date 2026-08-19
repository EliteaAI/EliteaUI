// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useIndexRunLiveRefresh } from '../useIndexRunLiveRefresh.hooks';

const socketHandler = vi.hoisted(() => ({ current: null }));
const dispatched = vi.hoisted(() => []);

vi.mock('@/hooks/useSocket', () => ({
  default: (event, handler) => {
    socketHandler.current = handler;
  },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => action => dispatched.push(action),
}));

vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({
  invalidateIndexesList: () => ({ type: 'indexes/invalidated' }),
}));

describe('useIndexRunLiveRefresh', () => {
  it('refreshes index state when an index run notification arrives, and only then', () => {
    renderHook(() => useIndexRunLiveRefresh());

    socketHandler.current({ event_type: 'chat_user_mentioned' });
    expect(dispatched).toHaveLength(0);

    socketHandler.current({ event_type: 'index_data_changed', meta: { index_name: 'docs' } });
    expect(dispatched).toEqual([{ type: 'indexes/invalidated' }]);
  });

  it('ignores runs of other toolkits when scoped, comparing ids across the route-string/payload-number split', () => {
    dispatched.length = 0;
    renderHook(() => useIndexRunLiveRefresh({ toolkitId: '2' }));

    socketHandler.current({ event_type: 'index_data_changed', meta: { toolkit_id: 5 } });
    expect(dispatched).toHaveLength(0);

    socketHandler.current({ event_type: 'index_data_changed', meta: { toolkit_id: 2 } });
    expect(dispatched).toEqual([{ type: 'indexes/invalidated' }]);
  });

  it('refreshes anyway when the notification does not say which toolkit it is about', () => {
    dispatched.length = 0;
    renderHook(() => useIndexRunLiveRefresh({ toolkitId: '2' }));

    socketHandler.current({ event_type: 'index_data_changed', meta: { index_name: 'docs' } });
    expect(dispatched).toEqual([{ type: 'indexes/invalidated' }]);
  });
});
