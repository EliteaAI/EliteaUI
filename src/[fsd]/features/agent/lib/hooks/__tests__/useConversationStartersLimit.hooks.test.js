// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import {
  useConversationStartersLimit,
  useRefetchConversationStartersLimit,
} from '../useConversationStartersLimit.hooks';

const shared = vi.hoisted(() => ({ data: undefined, query: vi.fn(), dispatch: vi.fn() }));

vi.mock('react-redux', () => ({ useDispatch: () => shared.dispatch }));
vi.mock('@/api/platformSettings', () => ({
  TAG_PLATFORM_SETTINGS: 'TAG_PLATFORM_SETTINGS',
  platformSettingsApi: { util: { invalidateTags: tags => ({ type: 'invalidate', tags }) } },
  useGetPlatformSettingsQuery: (...args) => {
    shared.query(...args);
    return { data: shared.data };
  },
}));

describe('useConversationStartersLimit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('falls back to 4 when the setting is missing', () => {
    shared.data = {};
    const { result } = renderHook(() => useConversationStartersLimit());
    expect(result.current).toBe(4);
  });

  it('returns the platform limit and refetches on mount', () => {
    shared.data = { conversation_starters_max: 7 };
    const { result } = renderHook(() => useConversationStartersLimit());
    expect(result.current).toBe(7);
    expect(shared.query).toHaveBeenCalledWith(undefined, { refetchOnMountOrArgChange: true });
  });

  it('invalidates the platform settings to refetch the limit', () => {
    const { result } = renderHook(() => useRefetchConversationStartersLimit());
    result.current();
    expect(shared.dispatch).toHaveBeenCalledWith({ type: 'invalidate', tags: ['TAG_PLATFORM_SETTINGS'] });
  });
});
