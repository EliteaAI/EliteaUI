// @vitest-environment jsdom
//
// The hook replaces the progress dialog's 1500 ms poll with a pushed feed, so four of its
// guarantees are worth pinning: a frame for a *different* run must not patch this run's cache
// (rooms are per-run, but one socket can be in several); a reconnect must re-join and refetch,
// because frames emitted while the socket was down are dropped rather than queued; the very
// first join must *not* refetch, or every dialog open would duplicate its own initial GET; and
// `isLive` must rest on the server's join ack, since the caller switches its fallback poll off on
// the strength of it and a connected-but-deaf socket would otherwise silence the dialog for good.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

const dispatch = vi.fn();
const emitEnter = vi.fn();
const emitLeave = vi.fn();
const socketHandlers = [];

let socketConnected = true;

vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: selector => selector({ settings: { socketConnected } }),
}));

vi.mock('@/hooks/useSocket', () => ({
  default: (event, handler) => {
    socketHandlers.push({ event, handler });
  },
  useManualSocket: event => ({
    emit: event === 'eval_run_enter_room' ? emitEnter : emitLeave,
  }),
}));

vi.mock('../../../api', () => ({
  TAG_EVAL_RUN: 'EVAL_RUN',
  evaluationApi: {
    util: {
      updateQueryData: (endpoint, args, recipe) => ({ type: 'update', endpoint, args, recipe }),
      invalidateTags: tags => ({ type: 'invalidate', tags }),
    },
  },
}));

const { useEvalRunLiveProgress } = await import('../useEvalRunLiveProgress.hooks');

const ARGS = { projectId: 1, runId: 7 };

/** Run the recipe the hook handed to `updateQueryData` against a draft. */
const applyPatch = (action, draft) => {
  action.recipe(draft);
  return draft;
};

/** Deliver a payload to the newest handler registered for `event` (each render re-registers). */
const emitTo = (event, payload) =>
  act(() => {
    socketHandlers
      .filter(entry => entry.event === event)
      .at(-1)
      .handler(payload);
  });

const push = frame => emitTo('eval_run_progress', frame);

/** The server's join ack — without it the hook must not claim to be live. */
const ackJoin = (runId = 7) => emitTo('eval_run_room_joined', { run_id: runId });

describe('useEvalRunLiveProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketHandlers.length = 0;
    socketConnected = true;
  });

  afterEach(() => cleanup());

  it('joins the run room and reports itself live once the join is acked', () => {
    const { result } = renderHook(() => useEvalRunLiveProgress(ARGS));

    expect(emitEnter).toHaveBeenCalledWith({ project_id: 1, run_id: 7 });
    // A connected socket alone proves nothing: an older server, or a refused join, never acks.
    expect(result.current.isLive).toBe(false);

    ackJoin();
    expect(result.current.isLive).toBe(true);
  });

  it('ignores an ack for a different run', () => {
    const { result } = renderHook(() => useEvalRunLiveProgress(ARGS));

    ackJoin(8);

    expect(result.current.isLive).toBe(false);
  });

  it('stops reporting live when the socket drops, and needs a fresh ack', () => {
    const { result, rerender } = renderHook(() => useEvalRunLiveProgress(ARGS));
    ackJoin();
    expect(result.current.isLive).toBe(true);

    socketConnected = false;
    rerender();
    expect(result.current.isLive).toBe(false);

    // Reconnecting re-emits the join, but the previous ack must not carry over.
    socketConnected = true;
    rerender();
    expect(result.current.isLive).toBe(false);

    ackJoin();
    expect(result.current.isLive).toBe(true);
  });

  it('drops a stale ack when the watched run changes', () => {
    const { result, rerender } = renderHook(({ runId }) => useEvalRunLiveProgress({ ...ARGS, runId }), {
      initialProps: { runId: 7 },
    });
    ackJoin(7);

    rerender({ runId: 9 });

    expect(result.current.isLive).toBe(false);
  });

  it('does not refetch on the first join', () => {
    renderHook(() => useEvalRunLiveProgress(ARGS));

    expect(dispatch.mock.calls.some(([action]) => action.type === 'invalidate')).toBe(false);
  });

  it('leaves the room on unmount', () => {
    const { unmount } = renderHook(() => useEvalRunLiveProgress(ARGS));
    unmount();

    expect(emitLeave).toHaveBeenCalledWith({ project_id: 1, run_id: 7 });
  });

  it('patches only the fields a frame actually carries', () => {
    renderHook(() => useEvalRunLiveProgress(ARGS));

    push({ run_id: 7, status: 'running', progress: { done: 1, total: 2 } });

    const action = dispatch.mock.calls.at(-1)[0];
    expect(action.endpoint).toBe('evalRun');
    expect(action.args).toEqual(ARGS);
    expect(applyPatch(action, { status: 'created', headline_score: 0.5 })).toEqual({
      status: 'running',
      progress: { done: 1, total: 2 },
      headline_score: 0.5,
    });
  });

  it('ignores a frame for a different run', () => {
    renderHook(() => useEvalRunLiveProgress(ARGS));

    push({ run_id: 8, status: 'finished' });

    expect(dispatch.mock.calls.some(([action]) => action.type === 'update')).toBe(false);
  });

  it('matches a run id that arrives as a string', () => {
    renderHook(() => useEvalRunLiveProgress(ARGS));

    push({ run_id: '7', progress: { done: 2, total: 2 } });

    expect(dispatch.mock.calls.some(([action]) => action.type === 'update')).toBe(true);
  });

  it('re-joins and refetches after the socket drops and comes back', () => {
    const { rerender } = renderHook(() => useEvalRunLiveProgress(ARGS));

    socketConnected = false;
    rerender();
    expect(emitLeave).toHaveBeenCalled();

    socketConnected = true;
    rerender();

    expect(emitEnter).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({ type: 'invalidate', tags: ['EVAL_RUN'] });
  });

  it('stays idle when disabled or missing ids', () => {
    const { result } = renderHook(() => useEvalRunLiveProgress({ ...ARGS, enabled: false }));

    expect(emitEnter).not.toHaveBeenCalled();
    expect(result.current.isLive).toBe(false);

    renderHook(() => useEvalRunLiveProgress({ projectId: 1, runId: null }));
    expect(emitEnter).not.toHaveBeenCalled();
  });

  it('drops frames once it is no longer active', () => {
    const { rerender } = renderHook(({ enabled }) => useEvalRunLiveProgress({ ...ARGS, enabled }), {
      initialProps: { enabled: true },
    });

    rerender({ enabled: false });
    push({ run_id: 7, status: 'finished' });

    expect(dispatch.mock.calls.some(([action]) => action.type === 'update')).toBe(false);
  });
});
