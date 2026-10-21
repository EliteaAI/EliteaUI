// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEliteaApiMock,
  jsonResponse,
  makeStore,
} from '@/[fsd]/entities/schedule/api/__tests__/scheduleApi.testSetup.js';
import { act, renderHook } from '@testing-library/react';

import recorded from './fixtures/scheduleRun98.json';

// CR-12 r2 D1: the real RTK Query cache, not a mocked query, must bring the usage into the run

vi.mock('@/api/eliteaApi.js', () => createEliteaApiMock());
vi.mock('@/common/utils.jsx', () => ({ buildErrorMessage: () => '' }));
vi.mock('@/common/convertChatConversationMessages', () => ({ convertConversationToChatHistory: () => [] }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5, useToast: () => ({}) }));
vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: { useGetRunHistoryDetailsQuery: () => ({}) },
}));

const { scheduleApi } = await import('@/[fsd]/entities/schedule/api/scheduleApi.js');
const { useScheduleRun } = await import('../useScheduleRuns.hooks');
const { formatRunSummary } = await import('../../helpers');

// GET .../runs/98 recorded from the local stack (CR-12 live check 2): tokens 447, cost 0.00161
const WITH_USAGE = recorded;
const ENDED = { ...recorded, summary: { duration_ms: recorded.duration_ms } };

describe('useScheduleRun with the real query cache (CR-12 r2 D1)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the usage that arrives after the run ends', async () => {
    const answers = [{ ...recorded, status: 'running', summary: null }, ENDED, ENDED, WITH_USAGE];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(answers.shift() ?? WITH_USAGE));
    const store = makeStore(scheduleApi);
    const { result } = renderHook(() => useScheduleRun(47, 98), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    for (let i = 0; i < 8; i += 1) await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(formatRunSummary(result.current.run.summary)).toBe('5 s · 447 tokens · $0.0016');
  });
});
