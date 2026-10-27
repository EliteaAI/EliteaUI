// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleRun, useScheduleRunConversation, useScheduleRuns } from '../useScheduleRuns.hooks';

// test panel log: one run polled while active, and its conversation

const mocks = vi.hoisted(() => ({
  useGetScheduleRunQuery: vi.fn(),
  useGetScheduleRunsQuery: vi.fn(),
  useGetRunHistoryDetailsQuery: vi.fn(),
}));

vi.mock('@/[fsd]/entities/schedule', () => ({
  useGetScheduleRunsQuery: mocks.useGetScheduleRunsQuery,
  useGetScheduleRunQuery: mocks.useGetScheduleRunQuery,
}));
vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: { useGetRunHistoryDetailsQuery: mocks.useGetRunHistoryDetailsQuery },
}));
vi.mock('@/common/convertChatConversationMessages', () => ({
  convertConversationToChatHistory: () => [
    { id: 'q1', role: 'user', content: 'List the PRs' },
    { id: 'a1', role: 'assistant', content: '## Open PRs' },
    { id: 'a2', role: 'assistant', content: '' },
  ],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5, useToast: () => ({}) }));

const pollingOf = () => mocks.useGetScheduleRunQuery.mock.lastCall[1].pollingInterval;
const mockRun = (run, extra = {}) =>
  mocks.useGetScheduleRunQuery.mockReturnValue({ currentData: run, refetch: vi.fn(), ...extra });

describe('useScheduleRun', () => {
  afterEach(() => vi.clearAllMocks());

  it('reads the run of the schedule and polls every 2 seconds while it runs or waits', () => {
    ['running', 'waiting_for_approval'].forEach(status => {
      mockRun({ id: 12, status });
      const { result } = renderHook(() => useScheduleRun(9, 12));

      expect(result.current.run).toEqual({ id: 12, status });
      expect(mocks.useGetScheduleRunQuery).toHaveBeenCalledWith(
        { projectId: 5, scheduleId: 9, runId: 12 },
        { skip: false },
      );
      expect(pollingOf()).toBe(2000);
    });
  });

  it('stops polling when the run is final', () => {
    ['success', 'failed', 'expired', 'blocked', 'skipped'].forEach(status => {
      mockRun({ id: 12, status });
      renderHook(() => useScheduleRun(9, 12));
      expect(pollingOf()).toBe(0);
    });
  });

  it('D3: polls a finished run until the usage figures arrive, then stops', () => {
    const ended = { id: 12, status: 'success', conversation_id: 70 };
    mockRun({ ...ended, summary: { tokens: null, cost_usd: null } });
    const { rerender } = renderHook(() => useScheduleRun(9, 12));
    expect(pollingOf()).toBe(2000);

    mockRun({ ...ended, summary: { tokens: 357, cost_usd: 0.001205 } });
    rerender();
    expect(pollingOf()).toBe(0);
  });

  it('D3: gives up on the usage figures after 10 seconds', () => {
    vi.useFakeTimers();
    try {
      mockRun({ id: 12, status: 'success', conversation_id: 70, summary: { tokens: null } });
      const { rerender } = renderHook(() => useScheduleRun(9, 12));
      expect(pollingOf()).toBe(2000);

      act(() => vi.advanceTimersByTime(10_000));
      rerender();
      expect(pollingOf()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('D3: a run without a conversation never has usage, so it is not polled', () => {
    mockRun({ id: 12, status: 'skipped', conversation_id: null, summary: { tokens: null } });
    renderHook(() => useScheduleRun(9, 12));
    expect(pollingOf()).toBe(0);
  });

  it('stops polling on a load error and reports it', () => {
    mockRun({ id: 12, status: 'running' }, { isError: true });
    const { result } = renderHook(() => useScheduleRun(9, 12));

    expect(pollingOf()).toBe(0);
    expect(result.current.isError).toBe(true);
    expect(result.current.run.status).toBe('running');
  });

  it('asks for nothing without a run', () => {
    mockRun(undefined);
    renderHook(() => useScheduleRun(9, undefined));
    expect(mocks.useGetScheduleRunQuery.mock.lastCall[1]).toEqual({ skip: true, pollingInterval: 0 });
  });
});

describe('useScheduleRunConversation', () => {
  afterEach(() => vi.clearAllMocks());

  const conversation = { uuid: 'conv-uuid', message_groups: [] };

  it('loads the conversation again after a status change and skips a running run', () => {
    mocks.useGetRunHistoryDetailsQuery.mockReturnValue({});
    renderHook(() => useScheduleRunConversation({ conversation_id: 70, status: 'waiting_for_approval' }));
    expect(mocks.useGetRunHistoryDetailsQuery).toHaveBeenLastCalledWith(
      { projectId: 5, conversationId: 70, status: 'waiting_for_approval' },
      { skip: false },
    );

    renderHook(() => useScheduleRunConversation({ conversation_id: 70, status: 'running' }));
    expect(mocks.useGetRunHistoryDetailsQuery.mock.lastCall[1]).toEqual({ skip: true });

    renderHook(() => useScheduleRunConversation({ conversation_id: null, status: 'failed' }));
    expect(mocks.useGetRunHistoryDetailsQuery.mock.lastCall[1]).toEqual({ skip: true });
  });

  it('gives the uuid and the paused message for the decision call, and the last answer', () => {
    mocks.useGetRunHistoryDetailsQuery.mockReturnValue({ currentData: conversation });
    const { result } = renderHook(() =>
      useScheduleRunConversation({ conversation_id: 70, status: 'success' }),
    );

    expect(result.current).toEqual({
      conversationUuid: 'conv-uuid',
      pausedMessageId: 'a2',
      answer: '## Open PRs',
    });
  });
});

describe('useScheduleRuns', () => {
  afterEach(() => vi.clearAllMocks());

  it('asks for no runs before the schedule has loaded', () => {
    mocks.useGetScheduleRunsQuery.mockReturnValue({});
    const { result } = renderHook(() => useScheduleRuns(undefined));

    expect(result.current).toEqual([]);
    expect(mocks.useGetScheduleRunsQuery.mock.calls.every(([, options]) => options.skip)).toBe(true);
  });
});
